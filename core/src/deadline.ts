// K12-11 (R4, plan §9.6 eki): deadline YÜRÜTME ETKİSİ + BİLDİRİM.
// "Başlatma takvimi != son çalışma saati (runs.deadline_at)" — kolon createRunPlan'dan
// beri defterde VAR; bu modül yalnız uygulama ucudur. R6'ya saygı: YENİ command.kind /
// Event.type YOK — kapanış PAUSE_REQUESTED zarfıyla (mevcut, payload {runId,reason})
// bildirilir; insan kartı approvals SATIRIdır (grant deseninin aynısı: APPROVAL_REQUESTED
// event'i kapalı şemadan bilinçli olarak YOK). Kalite kapıları süre baskısıyla DÜŞMEZ:
// RUNNING attempt'lerin durumu KORUNUR (checkpoint); kapanış insan kartıyla. İptal
// doğrulanamayan UNKNOWN'lar slot SERBEST BIRAKMAZ, iş yeniden başlatılmaz (§9.6 (5); A08
// reconcile insan kararını bekler). Zaman enjekte edilir — duvar saatine bağlı mantık YOK.
import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { appendEvent, GateError, tx } from './store.ts';
import type { NotifyOutbox } from './notify.ts';

const simdi = () => new Date();

export function deadlineDolu(db: DatabaseSync, runId: string, now: () => Date = simdi): boolean {
  const r = db.prepare('SELECT deadline_at FROM runs WHERE id=?').get(runId) as any;
  if (!r) throw new GateError('run yok: ' + runId);
  return Date.parse(r.deadline_at) <= now().getTime();
}

// Yürütme etkisi (1): deadline dolunca YENİ dispatch kapalı (bildirim/kapanış ayrı uç).
export function assertDispatchOpen(db: DatabaseSync, runId: string, now?: () => Date) {
  if (deadlineDolu(db, runId, now)) {
    throw new GateError('R4 deadline doldu (§9.6): yeni dispatch kapalı — kapanış kartı insan kararı bekler (enforceDeadline)');
  }
}

// Yürütme etkisi (3)+(4) + BİLDİRİM: deadline dolunca TEK SEFERLİK güvenli kapanış —
// PAUSE_REQUESTED olayı + insan kartı (approvals PENDING, action DEADLINE_CLOSE) +
// CRITICAL bildirim (dedupe anahtarı deadline:<runId>). İdempotent: kart durdukça ikinci
// çağrı YENİ satır/olay DOĞURMAZ (DUPLICATE döner). RUNNING attempt DURUMU KORUNUR —
// süre baskısıyla kalite kapısı DÜŞMEZ; süre biten grant ile yeni araç işlemi zaten RED
// (assertGrantDispatchable → expireDueGrants, grants.ts).
export function enforceDeadline(
  db: DatabaseSync,
  o: { runId: string; actor?: string; notify?: Pick<NotifyOutbox, 'enqueue'>; now?: () => Date },
) {
  return tx(db, () => {
    if (!deadlineDolu(db, o.runId, o.now)) return { status: 'open' as const };
    const run = db.prepare(
      'SELECT r.id, r.version, p.plan_hash, p.policy_hash FROM runs r JOIN plans p ON p.id=r.plan_id WHERE r.id=?',
    ).get(o.runId) as any;
    if (!run) throw new GateError('run yok');
    const varsa = db.prepare(
      "SELECT id FROM approvals WHERE run_id=? AND action='DEADLINE_CLOSE' AND decision='PENDING' LIMIT 1",
    ).get(o.runId) as any;
    if (varsa) return { status: 'DUPLICATE' as const, approvalId: varsa.id as string };
    const running = (db.prepare("SELECT COUNT(*) AS c FROM attempts WHERE run_id=? AND state='RUNNING'").get(o.runId) as any).c as number;
    // checkpoint: durum korunur — FAILED'a DÜŞÜRÜLMEZ; iptal doğrulanamayan UNKNOWN'lar
    // slot bırakmaz (§9.6 (5)); süreç durumu mevcut reconcile/sentPoll makinasıyla uzlaştırılır
    const approvalId = 'apv-' + randomUUID().slice(0, 8);
    db.prepare(
      `INSERT INTO approvals(id,run_id,plan_hash,candidate_hash,policy_hash,expected_run_version,action,expires_at,decision)
       VALUES(?,?,?,NULL,?,?,'DEADLINE_CLOSE',datetime('now','+2 day'),'PENDING')`,
    ).run(approvalId, o.runId, run.plan_hash, run.policy_hash, run.version);
    appendEvent(db, {
      type: 'PAUSE_REQUESTED', actorId: o.actor ?? 'core', causationId: approvalId, runId: o.runId,
      payload: { runId: o.runId, reason: `R4 deadline doldu: ${running} RUNNING attempt checkpoint'te, yeni dispatch kapali — insan kapanis karari bekler` },
    });
    o.notify?.enqueue({
      dedupeKey: 'deadline:' + o.runId, severity: 'CRITICAL',
      title: 'deadline doldu: ' + o.runId,
      body: `run ${o.runId}: yeni dispatch kapandi; ${running} RUNNING attempt checkpoint'te (kalite kapilari dusmez); kapanis insani karti ${approvalId}`,
    });
    return { status: 'CLOSED' as const, approvalId, runningAttempts: running };
  });
}
