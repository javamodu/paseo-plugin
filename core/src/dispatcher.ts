// S1 dispatcher — outbox tüketimi + belirsizlik + reconciliation.
// Kural sırası (A16/S7): DIŞ ETKİDEN ÖNCE STOP latch okunur — her satırda, önce.
// Kural A08: yanıt alınamayan spawn → UNKNOWN; kör re-spawn YOK, reconcile ŞART.
// Kural (docs/03): RUNNING olmayan / devir alınmış attempt'e spawn YOK (STALE).
// U1: spawn ÖNCESİ outbox SENDING işaretlenir; süreç çökerse satır SENDING kalır
//     ve reconcile onu UNKNOWN'a yükseltir (sessizce yeniden spawn edilmez).
import { DatabaseSync } from 'node:sqlite';
import { appendEvent } from './store.ts';
import { resolveProviderModel, type ProviderModel } from './providers.ts';
import { spawnOlcumKaydet } from './spawn-olcum.ts';

export type SpawnResult =
  | { outcome: 'OK'; externalSessionId: string }
  | { outcome: 'RETRYABLE'; reason: string }
  | { outcome: 'UNKNOWN' }
  | { outcome: 'FATAL'; reason: string };

export interface WorkerAdapter {
  // cwd: kapsul repo yolu (F5.5) — adapter katmani bunu isçi oturumunun
  // calisma dizinine baglar; gecersizse adapter FATAL doner (U3 release).
  // F6.5 (ADR-F65): provider/model dispatcher'da COZULMUS olarak iner (cozum zinciri:
  // node -> ORDU_PROVIDER env -> varsayilan). Adapter/transport env okumaz.
  spawn(o: { dispatchKey: string; attemptId: string; prompt: string; cwd?: string; provider?: string; model?: string }): Promise<SpawnResult>;
  lookup(dispatchKey: string): Promise<'ALIVE' | 'DEAD' | 'UNKNOWN'>; // durum
  // K-0006 kanonik sözleşme (opsiyonel: gerçek adapter sağlayabildigini saglar,
  // saglayamadigi için normalize 'desteklenmiyor' hatası döner — dürüst fail-closed).
  send?(externalSessionId: string, text: string): Promise<'OK' | 'UNKNOWN'>; // gonder
  cancel?(attemptId: string): Promise<'CONFIRMED_DEAD' | 'REQUESTED' | 'UNKNOWN'>; // iptal (teyit≠istek)
  events?(externalSessionId: string): Promise<{ kind: string; at: string; payload: object }[]>; // olaylar
}

const iso = (d = new Date()) => d.toISOString();

function latchOpen(db: DatabaseSync) {
  return (db.prepare('SELECT dispatch_paused FROM settings WHERE id=1').get() as any).dispatch_paused === 1;
}

export async function processOutbox(db: DatabaseSync, adapter: WorkerAdapter, opts: { now?: () => Date; prompt?: string; cwd?: string; kanitDefteriYolu?: string } = {}) {
  const now = opts.now ?? (() => new Date());
  if (latchOpen(db)) return { blocked: 'global_stop', processed: 0 };

  const row = db.prepare(
    "SELECT * FROM outbox WHERE status='PENDING' AND (next_attempt_at IS NULL OR next_attempt_at<=?) ORDER BY rowid LIMIT 1",
  ).get(iso(now())) as any;
  if (!row) return { idle: true, processed: 0 };

  const attempt = db.prepare('SELECT run_id,node_id,state,fencing_token FROM attempts WHERE id=?').get(row.attempt_id) as any;
  if (!attempt || attempt.state !== 'RUNNING') {
    // devir/iptal: spawn edilmez; U2 — rezervasyon ACTIVE'de sızmaz, RELEASED'e iner
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare("UPDATE outbox SET status='STALE' WHERE id=?").run(row.id);
      db.prepare("UPDATE reservations SET state='RELEASED' WHERE attempt_id=? AND state='ACTIVE'").run(row.attempt_id);
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    return { processed: 1, result: 'stale' };
  }

  // U1: niyet kaydı — spawn'dan ÖNCE. Yalnız PENDING→SENDING geçişi yetkili (çift gönderim kapısı).
  const mark = db.prepare("UPDATE outbox SET status='SENDING' WHERE id=? AND status='PENDING'").run(row.id);
  if (mark.changes !== 1) return { idle: true, processed: 0 };


  // F6.5: attempt satirindan nodes'a join; cozum zinciri saf fonksiyon (Y1: LLM cagrisi YOK).
  // nodes satiri yoksa FATAL (fail-closed); env registry disindaysa FATAL (sessiz dusus yok).
  let resolved: ProviderModel | null = null;
  let resolveFatal: string | null = null;
  {
    const nodeRow = db.prepare('SELECT provider, model FROM nodes WHERE run_id=? AND id=?').get(attempt.run_id, attempt.node_id) as any;
    if (!nodeRow) {
      resolveFatal = 'node satiri yok: ' + attempt.run_id + '/' + attempt.node_id;
    } else {
      const cozum = resolveProviderModel({ provider: nodeRow.provider ?? undefined, model: nodeRow.model ?? undefined }, process.env);
      // tip-borcu v9-06: strict:false ortaminda truthiness literal-union'i daraltmiyor
      // (repro kanitli) — `=== true` daraltir. Davranis degisimi YOK.
      if (cozum.ok === true) resolved = { provider: cozum.provider, model: cozum.model };
      else resolveFatal = cozum.reason;
    }
  }
  let res: SpawnResult;
  const olcumT0 = opts.kanitDefteriYolu ? performance.now() : 0;
  try {
    if (resolveFatal !== null) {
      res = { outcome: 'FATAL', reason: resolveFatal };
    } else {
      res = await adapter.spawn({ dispatchKey: row.dispatch_key, attemptId: row.attempt_id, provider: resolved!.provider, model: resolved!.model ?? undefined, prompt: opts.prompt ?? 'görev brief (B01 ile doğrulanmış)', cwd: opts.cwd });
    }
  } catch {
    res = { outcome: 'UNKNOWN' }; // ağ/process belirsizliği = UNKNOWN, exception fırlatma
  }

  // v9 V9-03: spawn maliyeti ölçüm kanalı — OPT-IN (daemon A0-3 kanitDefteriYolu deseni:
  // verilmedikçe kayıt YOK; mevcut çağıranlar/testler etkilenmez). Yalnız adapter.spawn GERÇEKten
  // çağrıldığında kayda girer (resolveFatal dalında spawn yok → ölçüm de yok). Ölçüm kaydı boru
  // hattını DÜŞÜREMEZ (gözlem üretimi bozmaz): yazma hatası best-effort stderr uyarısı, sonuç değişmez.
  if (opts.kanitDefteriYolu && resolveFatal === null) {
    try {
      spawnOlcumKaydet(opts.kanitDefteriYolu, {
        at: iso(now()), attemptId: row.attempt_id,
        provider: resolved!.provider, model: resolved!.model ?? undefined,
        outcome: res.outcome, sureMs: Math.max(0, Math.round(performance.now() - olcumT0)),
      });
    } catch (e: any) { process.stderr?.write?.('spawn-olcum kaydı yazılamadı (ölçüm best-effort): ' + String(e?.message ?? e) + '\n'); }
  }

  switch (res.outcome) {
    case 'OK':
      db.exec('BEGIN IMMEDIATE');
      try {
        const cur = db.prepare('SELECT state,fencing_token FROM attempts WHERE id=?').get(row.attempt_id) as any;
        if (cur.state !== 'RUNNING' || cur.fencing_token !== attempt.fencing_token) {
          // U5: spawn sırasında devir/iptal oldu → oturum var ama sahibi değil.
          // Bağlamak YASAK; UNKNOWN olarak reconcile/iptal yoluna bırakılır.
          db.prepare("UPDATE outbox SET status='UNKNOWN', delivery_count=delivery_count+1 WHERE id=?").run(row.id);
          db.prepare("UPDATE reservations SET state='UNKNOWN' WHERE attempt_id=? AND state='ACTIVE'").run(row.attempt_id);
          appendEvent(db, {
            type: 'EXTERNAL_STATE_UNKNOWN', actorId: 'core', causationId: row.command_id,
            runId: attempt.run_id, attemptId: row.attempt_id,
            payload: { attemptId: row.attempt_id, reason: 'spawn sırasında devir/iptal: sahipsiz oturum' },
          });
          db.exec('COMMIT');
          return { processed: 1, result: 'orphan-unknown' };
        }
        db.prepare("UPDATE outbox SET status='SENT' WHERE id=?").run(row.id);
        db.prepare("UPDATE attempts SET external_session_id=? WHERE id=?").run(res.externalSessionId, row.attempt_id);
        appendEvent(db, {
          type: 'SESSION_BOUND', actorId: 'core', causationId: row.command_id,
          runId: attempt.run_id, attemptId: row.attempt_id,
          payload: { attemptId: row.attempt_id, externalSessionId: res.externalSessionId, fencingToken: attempt.fencing_token },
        });
        db.exec('COMMIT');
      } catch (e) { db.exec('ROLLBACK'); throw e; }
      return { processed: 1, result: 'bound' };

    case 'RETRYABLE': { // spawn HENÜZ gerçekleşmedi → reserve değişmez; üs gecikmesi yakma
      const due = new Date(now().getTime() + 30_000);
      db.prepare("UPDATE outbox SET status='PENDING', next_attempt_at=?, delivery_count=delivery_count+1 WHERE id=?").run(iso(due), row.id);
      return { processed: 1, result: 'retry-scheduled' };
    }

    case 'UNKNOWN':
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare("UPDATE outbox SET status='UNKNOWN', delivery_count=delivery_count+1 WHERE id=?").run(row.id);
        db.prepare("UPDATE reservations SET state='UNKNOWN' WHERE attempt_id=? AND state='ACTIVE'").run(row.attempt_id); // A08: kör retry YASAK
        appendEvent(db, {
          type: 'EXTERNAL_STATE_UNKNOWN', actorId: 'core', causationId: row.command_id,
          runId: attempt.run_id, attemptId: row.attempt_id,
          payload: { attemptId: row.attempt_id, reason: 'spawn cevapsız' },
        });
        db.exec('COMMIT');
      } catch (e) { db.exec('ROLLBACK'); throw e; }
      return { processed: 1, result: 'unknown' };

    case 'FATAL':
      // U3: kalıcı hata → attempt ve node terminal; rezervasyon serbest; takılı RUNNING kalmaz
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare("UPDATE outbox SET status='FAILED' WHERE id=?").run(row.id);
        db.prepare("UPDATE reservations SET state='RELEASED' WHERE attempt_id=? AND state='ACTIVE'").run(row.attempt_id);
        db.prepare("UPDATE attempts SET state='FAILED' WHERE id=?").run(row.attempt_id);
        db.prepare("UPDATE nodes SET state='FAILED' WHERE run_id=? AND id=?").run(attempt.run_id, attempt.node_id);
        db.exec('COMMIT');
      } catch (e) { db.exec('ROLLBACK'); throw e; }
      return { processed: 1, result: 'fatal' };
  }
}

// A08 reconciliation: UNKNOWN satırlar gözlenmeden ASLA yeniden spawn edilmez.
export async function reconcileUnknown(db: DatabaseSync, adapter: WorkerAdapter) {
  // U1: çökmeden kalan SENDING satırı = spawn sonucu kayıp → UNKNOWN'a yükselt
  const sending = db.prepare("SELECT * FROM outbox WHERE status='SENDING' ORDER BY rowid").all() as any[];
  for (const row of sending) {
    const at = db.prepare('SELECT run_id FROM attempts WHERE id=?').get(row.attempt_id) as any;
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare("UPDATE reservations SET state='UNKNOWN' WHERE attempt_id=? AND state='ACTIVE'").run(row.attempt_id);
      db.prepare("UPDATE outbox SET status='UNKNOWN', delivery_count=delivery_count+1 WHERE id=?").run(row.id);
      appendEvent(db, {
        type: 'EXTERNAL_STATE_UNKNOWN', actorId: 'core', causationId: row.command_id,
        runId: at.run_id, attemptId: row.attempt_id,
        payload: { attemptId: row.attempt_id, reason: 'çökme: spawn sonucu kayıp' },
      });
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
  }

  const rows = db.prepare("SELECT * FROM outbox WHERE status='UNKNOWN' ORDER BY rowid").all() as any[];
  const outcomes: string[] = [];
  for (const row of rows) {
    const status = await adapter.lookup(row.dispatch_key);
    const attempt = db.prepare('SELECT run_id,node_id,fencing_token FROM attempts WHERE id=?').get(row.attempt_id) as any;
    if (status === 'ALIVE') {
      // Oturum yaşıyor: attempt bağlanır. Rezervasyon UNKNOWN kalır (A35.2: yalnız
      // SETTLED/RELEASED'e çıkar; iş bitince settleReservation ile kapanır). Bu bilinçli.
      db.exec('BEGIN IMMEDIATE');
      try {
        const sid = 'recovered:' + row.dispatch_key;
        db.prepare("UPDATE outbox SET status='SENT' WHERE id=?").run(row.id);
        db.prepare('UPDATE attempts SET external_session_id=? WHERE id=?').run(sid, row.attempt_id);
        appendEvent(db, {
          type: 'SESSION_BOUND', actorId: 'core', causationId: row.command_id, runId: attempt.run_id, attemptId: row.attempt_id,
          payload: { attemptId: row.attempt_id, externalSessionId: sid, fencingToken: attempt.fencing_token },
        });
        db.exec('COMMIT'); outcomes.push('recovered');
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    } else if (status === 'DEAD') {
      // U3: ölü teyitli → rezervasyon RELEASED, attempt FAILED, node yeniden denenebilir (READY)
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare("UPDATE outbox SET status='DEAD_CONFIRMED' WHERE id=?").run(row.id);
        db.prepare("UPDATE reservations SET state='RELEASED' WHERE attempt_id=? AND state IN('ACTIVE','UNKNOWN')").run(row.attempt_id);
        db.prepare("UPDATE attempts SET state='FAILED' WHERE id=? AND state IN('RUNNING','CANCEL_REQUESTED')").run(row.attempt_id);
        db.prepare("UPDATE nodes SET state='READY' WHERE run_id=? AND id=(SELECT node_id FROM attempts WHERE id=?)").run(attempt.run_id, row.attempt_id);
        appendEvent(db, {
          type: 'CANCEL_CONFIRMED', actorId: 'core', causationId: row.command_id, runId: attempt.run_id, attemptId: row.attempt_id,
          payload: { runId: attempt.run_id, attemptId: row.attempt_id, externalState: 'CONFIRMED_DEAD' },
        });
        db.exec('COMMIT'); outcomes.push('dead-released');
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    } else {
      outcomes.push('still-unknown'); // sabırla bekle; spawn yoluna dokunma
    }
  }
  return { reconciled: outcomes.length, outcomes };
}

// S4 Scheduler (SAVAS START 2026-10-26 canlı bulgu — DERSLER 173): SENT satırları
// için durum yoklaması. reconcileUnknown yalnız SENDING/UNKNOWN bakar; SESSION_BOUND
// olmuş ama harici oturumu ÖLMÜŞ satır defterde RUNNING görünür (kanıt: run-c0ea713b,
// raporlar/kanit-hedef/m02-savas-spawn-2026-10-26.md). Gözlem zararsızdır:
//   ALIVE   → dokunma (olay YOK — her tick'te olay spam üretilmez)
//   DEAD    → attempt RUNNING ailesindeyse reconcile'ın DEAD dalıyla AYNI kapanış
//             (release + FAILED + node READY + CANCEL_CONFIRMED); attempt zaten
//             terminalse (CANDIDATE_FROZEN/ACCEPTED/FAILED) yalnız gözlem — DONE
//             düzeyine REGRESYON YOK
//   UNKNOWN → sabırla bekle; kör karar yok
export async function pollSentSessions(db: DatabaseSync, adapter: WorkerAdapter) {
  const rows = db.prepare("SELECT * FROM outbox WHERE status='SENT' ORDER BY rowid").all() as any[];
  const outcomes: string[] = [];
  for (const row of rows) {
    const status = await adapter.lookup(row.dispatch_key);
    const attempt = db.prepare('SELECT run_id,node_id,state FROM attempts WHERE id=?').get(row.attempt_id) as any;
    if (status === 'DEAD') {
      const running = attempt && (attempt.state === 'RUNNING' || attempt.state === 'CANCEL_REQUESTED');
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare("UPDATE outbox SET status='DEAD_CONFIRMED' WHERE id=? AND status='SENT'").run(row.id);
        if (running) {
          db.prepare("UPDATE reservations SET state='RELEASED' WHERE attempt_id=? AND state IN('ACTIVE','UNKNOWN')").run(row.attempt_id);
          db.prepare("UPDATE attempts SET state='FAILED' WHERE id=?").run(row.attempt_id);
          db.prepare("UPDATE nodes SET state='READY' WHERE run_id=? AND id=?").run(attempt.run_id, attempt.node_id);
          appendEvent(db, {
            type: 'CANCEL_CONFIRMED', actorId: 'core', causationId: row.command_id,
            runId: attempt.run_id, attemptId: row.attempt_id,
            payload: { runId: attempt.run_id, attemptId: row.attempt_id, externalState: 'CONFIRMED_DEAD' },
          });
        }
        db.exec('COMMIT');
        outcomes.push(running ? 'dead-released' : 'dead-observed');
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    } else if (status === 'ALIVE') {
      outcomes.push('alive-running');
    } else {
      outcomes.push('still-unknown');
    }
  }
  return { polled: outcomes.length, outcomes };
}
