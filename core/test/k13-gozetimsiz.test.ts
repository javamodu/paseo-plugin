// K13-01 (plan §22) — GÖZETİMSİZ GİRİŞ KAPISI: rozetin HERMETİK kırılım koşumları.
// Her koşul tek tek kırılır → rozet 'gozetimsiz-kullanilamaz' + kusur ADIYLA görünür;
// hepsi dolu → 'gozetimsiz-hazir'. Yetenek-düzeyi koşullar (4/6) kanıt bayrağısız
// KIRMIZI kalır (fail-closed). Kanıtların CANLI paketi: k13-gozetimsiz-canli.test.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { openStore, setGlobalStop, appendEvent, settleReservation, commitCandidate } from '../src/store.ts';
import { createRunPlan, approvePlan, dispatchNode, ensureStartCommand } from '../src/supervisor.ts';
import { unattendedReadiness, type GozetimsizKanitlar } from '../src/gozetimsiz.ts';
import { createGrant, revokeGrant } from '../src/grants.ts';
import { sampleHandoff } from '../src/handoff.ts';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const KANITLAR: GozetimsizKanitlar = { dosyaShellSinirlariKanitli: true, eskiSahipYazmaEngeliKanitli: true };

function kurulum(db: any, runId: string) {
  setGlobalStop(db, false, 'insan:test', 'k13 kurulum');
  const { planHash } = createRunPlan(db, {
    capsuleId: 'cap-' + runId, goal: 'K13 senaryo', repoId: 'ordu/core', sourceCommit: sha(runId),
    runId, planId: 'plan-' + runId, profileHash: sha('k13:' + runId),
    nodes: [{ id: 'n1', role: 'coder', deps: [] }, { id: 'n2', role: 'coder', deps: [] }],
    maxWorkers: 2, allowedCommands: ['npm test'],
  });
  approvePlan(db, runId, planHash, 'insan:test');
  return ensureStartCommand(db, runId, planHash, 'insan:test');
}

const rozet = (db: any, k?: GozetimsizKanitlar) => unattendedReadiness(db, k);
const kusur = (db: any, no: number, k?: GozetimsizKanitlar) =>
  rozet(db, k).kosullar.find((x) => x.no === no)!;

test('K13-01 temiz: boş defter + kanıt bayrakları → rozet HAZIR (6/6)', () => {
  const db = openStore();
  const r = rozet(db, KANITLAR);
  assert.equal(r.rozet, 'gozetimsiz-hazir');
  assert.equal(r.kosullar.filter((x) => x.gecti).length, 6);
});

test('K13-01 fail-closed: kanıt bayrakları GETİRİLMEDİ → koşul 4+6 kırmızı, rozet KULLANILAMAZ', () => {
  const db = openStore();
  const r = rozet(db); // kanıt yok
  assert.equal(r.rozet, 'gozetimsiz-kullanilamaz');
  assert.equal(kusur(db, 4).gecti, false);
  assert.match(kusur(db, 4).detay, /fail-closed/);
  assert.equal(kusur(db, 6).gecti, false);
  assert.match(kusur(db, 6).detay, /fail-closed/);
});

test('K13-01 koşul 1: çözümlenmemiş UNKNOWN rezervasyon → kusur görünür', () => {
  const db = openStore();
  const sc = kurulum(db, 'run-k13a');
  const att = dispatchNode(db, 'run-k13a', 'n1', { tokens: 100, startCommandId: sc, dispatchKey: 'dk-k13a', handoff: sampleHandoff('run-k13a') }) as any;
  db.prepare("UPDATE reservations SET state='UNKNOWN' WHERE attempt_id=?").run(att.attemptId);
  assert.equal(kusur(db, 1, KANITLAR).gecti, false);
  assert.match(kusur(db, 1, KANITLAR).detay, /UNKNOWN/);
  assert.equal(rozet(db, KANITLAR).rozet, 'gozetimsiz-kullanilamaz');
});

test('K13-01 koşul 2: teyitsiz CANCEL_REQUESTED → kusur görünür; CANCEL_CONFIRMED ile kapanır', () => {
  const db = openStore();
  const sc = kurulum(db, 'run-k13b');
  const att = dispatchNode(db, 'run-k13b', 'n1', { tokens: 100, startCommandId: sc, dispatchKey: 'dk-k13b', handoff: sampleHandoff('run-k13b') }) as any;
  appendEvent(db, { type: 'CANCEL_REQUESTED', actorId: 'insan:test', causationId: 'run-k13b', runId: 'run-k13b', payload: { runId: 'run-k13b', reason: 'k13-01 koşul 2 kırılımı' } });
  assert.equal(kusur(db, 2, KANITLAR).gecti, false, 'teyitsiz iptal kusuru');
  appendEvent(db, { type: 'CANCEL_CONFIRMED', actorId: 'core', causationId: 'run-k13b', runId: 'run-k13b', attemptId: att.attemptId, payload: { runId: 'run-k13b', attemptId: att.attemptId, externalState: 'CONFIRMED_DEAD' } });
  assert.equal(kusur(db, 2, KANITLAR).gecti, true, 'teyit kusuru kapatır');
  assert.equal(rozet(db, KANITLAR).rozet, 'gozetimsiz-hazir');
});

test('K13-01 koşul 3: usage_unknown=1 → kusur görünür', () => {
  const db = openStore();
  kurulum(db, 'run-k13c');
  db.prepare('UPDATE runs SET usage_unknown=1 WHERE id=?').run('run-k13c');
  assert.equal(kusur(db, 3, KANITLAR).gecti, false);
  assert.match(kusur(db, 3, KANITLAR).detay, /olculemiyor/);
});

test('K13-01 koşul 5: REVOKE edilmiş granta bağlı RUNNING attempt → kusur görünür; iptal kapanınca geçer', () => {
  const db = openStore();
  const sc = kurulum(db, 'run-k13d');
  const { grantId } = createGrant(db, {
    runId: 'run-k13d', actions: ['EXTRA_RETRY'], extraRetryBudget: 2,
    expiresAt: '2099-01-01 00:00:00', tokenBudget: 100,
  }, 'insan:test');
  const att = dispatchNode(db, 'run-k13d', 'n1', { tokens: 100, startCommandId: sc, dispatchKey: 'dk-k13d', handoff: sampleHandoff('run-k13d'), grantId }) as any;
  assert.equal(kusur(db, 5, KANITLAR).gecti, true, 'ACTIVE grantlı RUNNING attempt kusur değil');
  // revoke ÇALIŞIRKEN ETKİ EDER: inflight attempt CANCEL_REQUESTED'a düşer + iptal niyeti defterde
  revokeGrant(db, grantId, 'insan:test');
  const state = (db.prepare('SELECT state FROM attempts WHERE id=?').get(att.attemptId) as any).state;
  assert.equal(state, 'CANCEL_REQUESTED', 'revoke inflight attempti iptale düşürür (koşul 5 kanıt ucu)');
  assert.equal(kusur(db, 5, KANITLAR).gecti, true, 'CANCEL_REQUESTED RUNNING değildir — grant etkisi işledi');
  assert.equal(kusur(db, 2, KANITLAR).gecti, false, 'iptal teyidi beklenir (koşul 2 devreye girer — §22 zinciri)');
});

test('K13-01 koşul 5 (EXPIRED): süresi bitmiş granta bağlı RUNNING attempt → kusur görünür', () => {
  const db = openStore();
  const sc = kurulum(db, 'run-k13e');
  const { grantId } = createGrant(db, {
    runId: 'run-k13e', actions: ['EXTRA_RETRY'], extraRetryBudget: 2,
    expiresAt: '2099-01-01 00:00:00', tokenBudget: 100,
  }, 'insan:test');
  const att = dispatchNode(db, 'run-k13e', 'n1', { tokens: 100, startCommandId: sc, dispatchKey: 'dk-k13e', handoff: sampleHandoff('run-k13e'), grantId }) as any;
  db.prepare("UPDATE grants SET state='EXPIRED' WHERE id=?").run(grantId);
  assert.equal(kusur(db, 5, KANITLAR).gecti, false, 'EXPIRED granta bağlı RUNNING kusurdur');
  // kapanış: attempt settle edilir (insan/reconcile kararı) → kusur kapanır
  commitCandidate(db, att.attemptId, 1, sha('k13e-aday'), 'insan:test');
  settleReservation(db, att.attemptId, 'SETTLED', 10);
  db.prepare("UPDATE attempts SET state='FAILED' WHERE id=?").run(att.attemptId);
  assert.equal(kusur(db, 5, KANITLAR).gecti, true);
});
