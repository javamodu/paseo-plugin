// K12-11 (R4 §9.6: deadline dolması — yeni iş kapanır + kapanış politikası) ve
// K12-12 (R8 §24: görünmeyen alt-ajan dispatch reddi — 5 şart) — hermetik koşumlar.
// K12-11 plan gereği İKİ alt-test: (a) BİLDİRİM (notify outbox, M07 kanalı) +
// (b) YÜRÜTME ETKİSİ (yeni dispatch kapanır; grant süresi dolunca yeni araç işlemi RED;
// RUNNING attempt'ler checkpoint'te — kalite kapıları süre baskısıyla DÜŞMEZ; iptal
// doğrulanamayan UNKNOWN slot bırakmaz). R6'ya saygı: yeni kind/type YOK (PAUSE_REQUESTED
// mevcut zarfı; insan kartı approvals satırı — grant deseni).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, appendEvent } from '../src/store.ts';
import {
  createRunPlan, approvePlan, dispatchNode, ensureStartCommand,
} from '../src/supervisor.ts';
import { deadlineDolu, assertDispatchOpen, enforceDeadline } from '../src/deadline.ts';
import { assertAltAjanGorunur } from '../src/r8.ts';
import { openNotifyOutbox } from '../src/notify.ts';
import { createGrant, expireDueGrants } from '../src/grants.ts';
import { sampleHandoff } from '../src/handoff.ts';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

function kurulum(db: any, runId: string, o: { deadlineAt?: string } = {}) {
  setGlobalStopAc(db);
  const { planHash } = createRunPlan(db, {
    capsuleId: 'cap-' + runId, goal: 'K12-11/12 senaryo', repoId: 'ordu/core', sourceCommit: sha(runId),
    runId, planId: 'plan-' + runId, profileHash: sha('k12b:' + runId),
    nodes: [
      { id: 'n1', role: 'coder', deps: [] },
      { id: 'n2', role: 'coder', deps: [] },
    ],
    maxWorkers: 2, allowedCommands: ['npm test'], ...(o.deadlineAt ? { deadlineAt: o.deadlineAt } : {}),
  });
  approvePlan(db, runId, planHash, 'insan:test');
  const startCommandId = ensureStartCommand(db, runId, planHash, 'insan:test');
  return { planHash, startCommandId };
}

// taze defter fail-closed doğar → kurulum mandalı açar (K12 turu 1 deseninin aynısı)
import { setGlobalStop } from '../src/store.ts';
function setGlobalStopAc(db: any) { setGlobalStop(db, false, 'insan:test', 'k12-11/12 kurulum'); }

const GECMIS = '2026-01-01T00:00:00Z';
const GELECEK = '2099-01-01T00:00:00Z';

test('K12-11b-1: deadline dolmuş runa YENİ dispatch KAPALI (yürütme etkisi 1)', () => {
  const db = openStore();
  const { startCommandId } = kurulum(db, 'run-dl1', { deadlineAt: GECMIS });
  assert.throws(
    () => dispatchNode(db, 'run-dl1', 'n1', { tokens: 100, startCommandId, dispatchKey: 'dk-dl1', handoff: sampleHandoff('run-dl1') }),
    /R4 deadline doldu/, 'deadline dolunca dispatch RED',
  );
  // kapı fail-closed: attempt/outbox SATIRI DOĞMADI (sessiz bekleme değil — açık kırmızı)
  assert.equal((db.prepare('SELECT COUNT(*) AS c FROM attempts WHERE run_id=?').get('run-dl1') as any).c, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS c FROM outbox WHERE status='PENDING'").get() as any).c, 0);
});

test('K12-11b-2: deadline gelecekteyken dispatch AÇIK; now enjeksiyonu dolunca kapanır', () => {
  const db = openStore();
  const { startCommandId } = kurulum(db, 'run-dl2', { deadlineAt: '2030-01-01T00:00:00Z' });
  dispatchNode(db, 'run-dl2', 'n1', { tokens: 100, startCommandId, dispatchKey: 'dk-dl2', handoff: sampleHandoff('run-dl2') }); // açık
  // n2'yi varsayılan saatle değil, 2031'e yolculukla dene: deadline dolu
  assert.throws(
    () => dispatchNode(db, 'run-dl2', 'n2', { tokens: 100, startCommandId, dispatchKey: 'dk-dl2b', handoff: sampleHandoff('run-dl2'), now: () => new Date('2031-01-01T00:00:00Z') }),
    /R4 deadline doldu/, 'now > deadline → kapanır',
  );
  assert.ok(deadlineDolu(db, 'run-dl2', () => new Date('2031-06-01T00:00:00Z')));
  assert.ok(!deadlineDolu(db, 'run-dl2')); // duvar saatiyle hâlâ açık
  // kapı tek başına da çağrılabilir (dispatcher/daemon ileride buradan bakabilir)
  assert.throws(() => assertDispatchOpen(db, 'run-dl2', () => new Date('2031-01-01T00:00:00Z')), /R4/);
});

test('K12-11b-3: enforceDeadline kapanış politikası — RUNNING checkpoint KALIR + insan kartı + olay', () => {
  const db = openStore();
  const { startCommandId } = kurulum(db, 'run-dl3', { deadlineAt: GELECEK });
  const att = dispatchNode(db, 'run-dl3', 'n1', { tokens: 100, startCommandId, dispatchKey: 'dk-dl3', handoff: sampleHandoff('run-dl3') }) as any;
  // deadline dolmadan çağrı → no-op (açık run kapanmaz)
  const acik = enforceDeadline(db, { runId: 'run-dl3', now: () => new Date('2098-01-01T00:00:00Z') });
  assert.equal((acik as any).status, 'open');
  assert.equal((db.prepare('SELECT COUNT(*) AS c FROM approvals').get() as any).c, 0, 'kart doğmaz');
  // deadline dolunca: KAPANMA — checkpoint (durum korunur; kalite kapıları süre baskısıyla DÜŞMEZ)
  const kapali = enforceDeadline(db, { runId: 'run-dl3', actor: 'insan:test', now: () => new Date('2099-06-01T00:00:00Z') }) as any;
  assert.equal(kapali.status, 'CLOSED');
  assert.equal(kapali.runningAttempts, 1);
  assert.equal((db.prepare('SELECT state FROM attempts WHERE id=?').get(att.attemptId) as any).state, 'RUNNING', 'checkpoint: attempt durumu KORUNUR');
  assert.equal((db.prepare('SELECT state FROM nodes WHERE run_id=? AND id=?').get('run-dl3', 'n1') as any).state, 'RUNNING', 'node durumu korunur');
  const kart = db.prepare("SELECT id,action,decision FROM approvals WHERE run_id='run-dl3'").get() as any;
  assert.equal(kart.action, 'DEADLINE_CLOSE');
  assert.equal(kart.decision, 'PENDING', 'insan kartı: kapanış kararı insanı bekler');
  assert.ok(!!db.prepare("SELECT 1 FROM events WHERE run_id='run-dl3' AND type='PAUSE_REQUESTED'").get(), 'kapanış PAUSE_REQUESTED zarfıyla defterde (R6: yeni tip YOK)');
  // yeni dispatch artık duvar saatiyle de kapalı (deadline 2099 → now ilerledi sayılmaz; enjeksiyonla sına)
  assert.throws(
    () => dispatchNode(db, 'run-dl3', 'n2', { tokens: 100, startCommandId, dispatchKey: 'dk-dl3b', handoff: sampleHandoff('run-dl3'), now: () => new Date('2099-06-01T00:00:00Z') }),
    /R4 deadline doldu/,
  );
  // idempotent: ikinci çağrı YENİ kart/olay doğurmaz
  const tekrar = enforceDeadline(db, { runId: 'run-dl3', now: () => new Date('2099-06-02T00:00:00Z') }) as any;
  assert.equal(tekrar.status, 'DUPLICATE');
  assert.equal(tekrar.approvalId, kapali.approvalId ?? kart.id);
  assert.equal((db.prepare('SELECT COUNT(*) AS c FROM approvals WHERE run_id=?').get('run-dl3') as any).c, 1);
  assert.equal((db.prepare("SELECT COUNT(*) AS c FROM events WHERE run_id='run-dl3' AND type='PAUSE_REQUESTED'").get() as any).c, 1);
});

test('K12-11a: BİLDİRİM — deadline kapanışı CRITICAL bildirim doğurur, dedupe ile tek', () => {
  const dir = mkdtempSync(join(tmpdir(), 'k12-11a-'));
  const db = openStore();
  const notify = openNotifyOutbox(join(dir, 'notify.jsonl'), { sender() {} });
  const { startCommandId } = kurulum(db, 'run-dl4', { deadlineAt: GELECEK });
  dispatchNode(db, 'run-dl4', 'n1', { tokens: 100, startCommandId, dispatchKey: 'dk-dl4', handoff: sampleHandoff('run-dl4') });
  const r = enforceDeadline(db, { runId: 'run-dl4', notify, now: () => new Date('2099-06-01T00:00:00Z') }) as any;
  assert.equal(r.status, 'CLOSED');
  const list = notify.list();
  assert.equal(list.length, 1, 'bildirim doğar');
  assert.equal(list[0].severity, 'CRITICAL', 'deadline kapanışı CRITICAL (sessiz saatte bile gider)');
  assert.equal(list[0].dedupeKey, 'deadline:run-dl4');
  assert.ok(list[0].body.includes('run-dl4') && list[0].body.includes('checkpoint'), 'gövde kapanışı anlatır');
  // ikinci enforce (DUPLICATE) → notify outbox dedupe: ikinci kayıt YOK
  enforceDeadline(db, { runId: 'run-dl4', notify, now: () => new Date('2099-06-02T00:00:00Z') });
  assert.equal(notify.list().length, 1, 'aynı dedupe anahtarı ikinci kez KAYDEDİLMEZ (M07)');
  // grant-expiry bildirimleriyle karışmaz: farklı run → farklı anahtar
  const { startCommandId: sc2 } = kurulum(db, 'run-dl5', { deadlineAt: GELECEK });
  void sc2;
  enforceDeadline(db, { runId: 'run-dl5', notify, now: () => new Date('2099-06-01T00:00:00Z') });
  assert.equal(notify.list().length, 2);
  assert.deepEqual(notify.list().map((x) => x.dedupeKey), ['deadline:run-dl4', 'deadline:run-dl5']);
});

test('K12-11b-4: süresi biten grant ile YENİ araç işlemi (dispatch) RED', async () => {
  const db = openStore();
  const { startCommandId } = kurulum(db, 'run-dl6');
  const { grantId } = createGrant(db, {
    runId: 'run-dl6', actions: ['EXTRA_RETRY'], extraRetryBudget: 2,
    // ~2,5 sn sonra dolar; datetime(?) saniye tabanlı → bekleme 4,5 sn (T-ms [500,800) bandında
    // expires ile dispatch AYNI saniyeye düşebilir — 1 tam saniye fark payıyla yarış YOK)
    expiresAt: new Date(Date.now() + 2500).toISOString().replace('Z', ''),
    tokenBudget: 100,
  }, 'insan:test');
  await new Promise((r) => setTimeout(r, 4500)); // süresi dolması (duvar saati — U7 datetime('now') kıyası)
  assert.throws(
    () => dispatchNode(db, 'run-dl6', 'n1', { tokens: 100, startCommandId, dispatchKey: 'dk-dl6', handoff: sampleHandoff('run-dl6'), grantId }),
    /R3 RED: grant aktif degil \(EXPIRED/, 'grant süresi dolunca yeni vekil işlemi RED (yürütme etkisi 2)',
  );
  // U7 bilinçli tasarım: geçişin PERSIST'i tx-DIŞI API girişlerinde işlenir (RED rollback'una
  // kurban gitmez — grants.ts başlık notu; kontrol zaten fail-closed). Deftere tx-dışı işlenir:
  expireDueGrants(db);
  assert.equal((db.prepare('SELECT state FROM grants WHERE id=?').get(grantId) as any).state, 'EXPIRED', 'geçiş deftere işlendi');
});

test('K12-12: R8 5 şart — her biri ayrı ADIYLA kırmızı; doluysa dispatch geçer', () => {
  const db = openStore();
  const { startCommandId } = kurulum(db, 'run-r8');
  // (şart 1) kimlik+ana görev: planda olmayan node → görünmeyin alt ajan
  assert.throws(
    () => dispatchNode(db, 'run-r8', 'n-gizli', { tokens: 100, startCommandId, dispatchKey: 'dk-r8x', handoff: sampleHandoff('run-r8') }),
    /R8 sart 1 \(kimlik\+ana gorev\)/,
  );
  // (şart 2) yetki bağı: BAŞKA runa bağlı KABUL komutuyla dispatch
  const b = kurulum(db, 'run-r8b');
  assert.throws(
    () => dispatchNode(db, 'run-r8', 'n1', { tokens: 100, startCommandId: b.startCommandId, dispatchKey: 'dk-r8y', handoff: sampleHandoff('run-r8') }),
    /R8 sart 2 \(yetki bagi\)/,
  );
  // (şart 3) kullanım ölçümü: tokens=0 → ölçümsüz kullanım
  assert.throws(
    () => dispatchNode(db, 'run-r8', 'n1', { tokens: 0, startCommandId, dispatchKey: 'dk-r8z', handoff: sampleHandoff('run-r8') }),
    /R8 sart 3 \(kullanim olcumu\)/,
  );
  // (şart 4) yaşam durumu uzlaştırma: çözümlenmemiş UNKNOWN rezervasyon (API kopması enjeksiyonu)
  const att = dispatchNode(db, 'run-r8', 'n1', { tokens: 100, startCommandId, dispatchKey: 'dk-r8', handoff: sampleHandoff('run-r8') }) as any;
  db.prepare("UPDATE reservations SET state='UNKNOWN' WHERE attempt_id=?").run(att.attemptId);
  assert.throws(
    () => dispatchNode(db, 'run-r8', 'n1', { tokens: 100, startCommandId, dispatchKey: 'dk-r8-2', handoff: sampleHandoff('run-r8') }),
    /R8 sart 4 \(yasam durumu uzlastirma\)/, 'UNKNOWN çözümlenmeden yeni doğuş YOK (nodeState mesajından ÖNCE)',
  );
  // (şart 5) iptal+sahiplik: doğrulanmamış iptal talebi
  appendEvent(db, { type: 'CANCEL_REQUESTED', actorId: 'insan:test', causationId: 'run-r8', runId: 'run-r8', payload: { runId: 'run-r8', reason: 'k12-12 senaryo: iptal istendi, teyit yok' } });
  assert.throws(
    () => dispatchNode(db, 'run-r8', 'n2', { tokens: 100, startCommandId, dispatchKey: 'dk-r8-n2', handoff: sampleHandoff('run-r8') }),
    /R8 sart 5 \(iptal\+sahiplik\)/,
  );
  // kapı tek başına da sınanabilir (dispatch dışı çağrı — sema aynı)
  assert.throws(() => assertAltAjanGorunur(db, { runId: 'run-r8', nodeId: 'n2', commandId: startCommandId, tokens: 5 }), /R8 sart 5/);
});

test('K12-12 pozitif: 5 şart dolu — dispatch geçer (mevcut süitler bu yoldan zaten geçiyor)', () => {
  const db = openStore();
  const { startCommandId } = kurulum(db, 'run-r8ok');
  const att = dispatchNode(db, 'run-r8ok', 'n1', { tokens: 100, startCommandId, dispatchKey: 'dk-r8ok', handoff: sampleHandoff('run-r8ok') }) as any;
  assert.ok(att.attemptId);
  assert.equal((db.prepare("SELECT state FROM nodes WHERE run_id='run-r8ok' AND id='n1'").get() as any).state, 'RUNNING');
  // ikinci node da geçer (kapasite var; UNKNOWN/cancel yok)
  dispatchNode(db, 'run-r8ok', 'n2', { tokens: 100, startCommandId, dispatchKey: 'dk-r8ok-2', handoff: sampleHandoff('run-r8ok') });
  assert.equal((db.prepare("SELECT COUNT(*) AS c FROM attempts WHERE run_id='run-r8ok'").get() as any).c, 2);
});

// yardimci: kullanilmayan import uyarilarini engelle (mkdtempSync/writeFileSync notify dizininde kullanilir)
void mkdtempSync; void writeFileSync;
