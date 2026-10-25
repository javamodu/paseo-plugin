// M16 + M03 hermetik kanıt (bu dosya tek başına: node --test test/m16-m03.test.ts)
// M16: dosya-tabanlı store yedeklenir, orijinal SİLİNİR, yedekten birebir restore.
// M03: teslim-isteme aynı anahtarla tekrar çağrılınca ÇİFT TESLİM OLMAZ; makbuz
// doğru run/candidate'a bağlı değilse RED (fail-closed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, setGlobalStop, commitCandidate, recordEvidence, appendEvent, GateError } from '../src/store.ts';
import {
  createRunPlan, approvePlan, dispatchNode, ensureStartCommand, settleNodeOutcome,
  decideApproval, requestDelivery,
} from '../src/supervisor.ts';
import { sampleHandoff } from '../src/handoff.ts';
import { sampleReceipt } from '../src/reasoning-receipt.ts';
import { backupStore, restoreStore } from '../src/backup.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

// PASS'e kadar tam akış (runId/candidateHash parametrik — iki run'lı senaryolar için).
function passRig(db: any, runId: string, candChar: string) {
  setGlobalStop(db, false, 'op', 'acilis');
  const planHash = createRunPlan(db, {
    capsuleId: 'cap-' + runId, goal: 'g', repoId: 'r', sourceCommit: H64('c'),
    runId, planId: 'plan-' + runId, profileHash: H64('p'),
    nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 5,
  }).planHash;
  const startCmd = ensureStartCommand(db, runId, planHash, 'operator');
  approvePlan(db, runId, planHash, 'human');
  const d = dispatchNode(db, runId, 'n1', { tokens: 1000, startCommandId: startCmd, dispatchKey: 'k-' + runId, handoff: sampleHandoff('n1') });
  if (d.status !== 'DISPATCHED') throw new Error('dispatch bekleniyordu: ' + d.status);
  const candidateHash = H64(candChar);
  commitCandidate(db, d.attemptId, 1, candidateHash, 'worker');
  const { evidenceId } = recordEvidence(db, {
    attemptId: d.attemptId, presentedFence: 1, artifactHash: createHash('sha256').update('artifact:' + runId).digest('hex'), storageRef: 's3://' + runId,
    bytes: 8, environmentHash: H64('v'), evaluatorHash: H64('h'), exitCode: 0, verdict: 'PASS', testCount: 4, actorId: 'evaluator',
  });
  settleNodeOutcome(db, d.attemptId, 'PASS');
  return { evidenceId, candidateHash };
}

// olay defteri bütünlük damgası: satır sayısı + sequence-zinciri üzerinde kümülatif hash.
function ledgerStamp(db: any) {
  const rows = db.prepare('SELECT sequence,id,type,actor_id,causation_id,payload_json FROM events ORDER BY sequence').all() as any[];
  let h = '0'.repeat(64);
  for (const r of rows) {
    h = createHash('sha256').update(h + '|' + [r.sequence, r.id, r.type, r.actor_id, r.causation_id, r.payload_json].join(':')).digest('hex');
  }
  return { count: rows.length, chainHash: h };
}

// ---- M16 ----
test('M16: yedek → orijinal sil → restore → event zinciri ve satırlar birebir', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-m16-'));
  const srcPath = join(dir, 'store.db');
  const bakPath = join(dir, 'yedek', 'store-backup.db');
  const db = openStore(srcPath);
  const { evidenceId } = passRig(db, 'run-1', 'a');
  // teslim bile istenmiş olsun: approvals+runs(VERIFYING) da yedeğe girsin
  const req = requestDelivery(db, 'run-1', 'core', sampleReceipt(H64('a'), 'n1', { evidenceRefs: [evidenceId] }));
  assert.equal(req.status, 'REQUESTED');
  const before = ledgerStamp(db);
  const evRow = db.prepare('SELECT verdict,test_count FROM evidence WHERE id=?').get(evidenceId) as any;

  backupStore(db, srcPath, bakPath);
  assert.ok(existsSync(bakPath), 'yedek dosyası oluştu');
  db.close();

  // orijinali SİL (+ WAL/SHM kalıntıları): kanıt yalnız yedeğe dayanır
  for (const f of ['store.db', 'store.db-wal', 'store.db-shm']) {
    const p = join(dir, f);
    if (existsSync(p)) rmSync(p);
  }
  assert.ok(!existsSync(srcPath), 'orijinal silindi');

  const restored = restoreStore(bakPath, srcPath);
  const after = ledgerStamp(restored);
  assert.equal(after.count, before.count, 'event sayısı birebir');
  assert.equal(after.chainHash, before.chainHash, 'hash zinciri birebir');
  assert.deepEqual(restored.prepare('SELECT verdict,test_count FROM evidence WHERE id=?').get(evidenceId), evRow, 'evidence satırı birebir');
  assert.equal((restored.prepare("SELECT state FROM runs WHERE id='run-1'").get() as any).state, 'VERIFYING', 'run durumu birebir');
  assert.equal((restored.prepare('SELECT COUNT(*) c FROM approvals').get() as any).c, 1, 'onay satırı birebir');
  restored.close();
  rmSync(dir, { recursive: true, force: true });
});

test('M16: restore sonrası kapılar canlı — append-only tetik RED, zincir devam eder', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-m16-kapi-'));
  const srcPath = join(dir, 's.db');
  const bakPath = join(dir, 'b.db');
  const db = openStore(srcPath);
  passRig(db, 'run-1', 'a');
  const before = ledgerStamp(db);
  backupStore(db, srcPath, bakPath);
  db.close();
  rmSync(srcPath);

  const restored = restoreStore(bakPath, srcPath);
  assert.throws(() => restored.prepare("DELETE FROM events").run(), /append_only_event/, 'append-only tetik yedekte de aktif');
  appendEvent(restored, { type: 'STOP_LATCH_CLEARED', actorId: 'op', causationId: 'operator', payload: { reason: 'restore-sonrasi', actor: 'op', confirmationHash: '0'.repeat(64) } });
  const after = ledgerStamp(restored);
  assert.equal(after.count, before.count + 1, 'yeni event zincire eklendi');
  assert.notEqual(after.chainHash, before.chainHash, 'zincir ilerledi');
  restored.close();
  rmSync(dir, { recursive: true, force: true });
});

test('M16: :memory: store için dosya-yedeği RED (host kısıtı açık hata)', () => {
  const db = openStore();
  const dir = mkdtempSync(join(tmpdir(), 'ordu-m16-mem-'));
  assert.throws(() => backupStore(db, ':memory:', join(dir, 'x.db')), /:memory:/);
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

// ---- M03 ----
test('M03: aynı teslim tekrar istenince ÇİFT TESLİM YOK — DUPLICATE, tek onay, tek APPROVAL_REQUESTED', () => {
  const db = openStore();
  const { evidenceId } = passRig(db, 'run-1', 'a');
  const receipt = sampleReceipt(H64('a'), 'n1', { evidenceRefs: [evidenceId] });
  const first = requestDelivery(db, 'run-1', 'core', receipt);
  assert.equal(first.status, 'REQUESTED');
  const again = requestDelivery(db, 'run-1', 'core', receipt); // aynı idempotency anahtarı (run+aday)
  assert.equal(again.status, 'DUPLICATE', 'tekrar çağrı DUPLICATE');
  assert.equal(again.approvalId, first.approvalId, 'ikinci teslim yeni onay ÜRETMEDİ');
  assert.equal((db.prepare("SELECT COUNT(*) c FROM approvals WHERE run_id='run-1'").get() as any).c, 1, 'tek onay satırı');
  assert.equal(
    (db.prepare("SELECT COUNT(*) c FROM events WHERE run_id='run-1' AND type='APPROVAL_REQUESTED'").get() as any).c,
    1, 'tek APPROVAL_REQUESTED eventi',
  );
  // onay tek kez karara bağlanır; ikinci karar RED (çift teslimin son halkası da kapalı)
  assert.equal(decideApproval(db, first.approvalId, 'APPROVED', 'human', 1).status, 'ACCEPTED');
  assert.throws(() => decideApproval(db, first.approvalId, 'APPROVED', 'human', 1), /zaten karara/);
  db.close();
});

test('M03: makbuz başka adaya/run\u2019a bağlıysa teslim RED', () => {
  const db = openStore();
  const r1 = passRig(db, 'run-1', 'a');
  passRig(db, 'run-2', 'b');
  // run-2'ye, run-1'in adayını açıklayan makbuzla teslim → RED (bağdaşmıyor)
  assert.throws(
    () => requestDelivery(db, 'run-2', 'core', sampleReceipt(H64('a'), 'n1', { evidenceRefs: [r1.evidenceId] })),
    /bağdaşmıyor/,
  );
  // doğru aday ama kanıt başka adayın PASS'i → RED (kanıt bu adaya bağlı değil)
  assert.throws(
    () => requestDelivery(db, 'run-2', 'core', sampleReceipt(H64('b'), 'n1', { evidenceRefs: [r1.evidenceId] })),
    /kanıta bağlı değil/,
  );
  assert.equal((db.prepare("SELECT COUNT(*) c FROM approvals").get() as any).c, 0, 'RED yolunda onay ÜRETİLMEDİ');
  db.close();
});

test('M03: donmuş ACCEPTED adayı olmayan run için teslim RED; şema-bozuk makbuz RED', () => {
  const db = openStore();
  setGlobalStop(db, false, 'op', 'acilis');
  const planHash = createRunPlan(db, {
    capsuleId: 'cap-x', goal: 'g', repoId: 'r', sourceCommit: H64('c'),
    runId: 'run-x', planId: 'plan-x', profileHash: H64('p'),
    nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 5,
  }).planHash;
  ensureStartCommand(db, 'run-x', planHash, 'op');
  approvePlan(db, 'run-x', planHash, 'human');
  assert.throws(() => requestDelivery(db, 'run-x', 'core', sampleReceipt(H64('a'))), /donmuş aday yok/);
  const db2 = openStore();
  const { evidenceId } = passRig(db2, 'run-1', 'a');
  // şema-bozuk makbuz (alternatif yok = assertion, muhakeme değil) gate'te RED
  assert.throws(
    () => requestDelivery(db2, 'run-1', 'core', { ...sampleReceipt(H64('a'), 'n1', { evidenceRefs: [evidenceId] }), alternatives: [] }),
    /reasoning receipt geçersiz/,
  );
  assert.throws(
    () => requestDelivery(db2, 'run-1', 'core', { ...sampleReceipt(H64('a'), 'n1', { evidenceRefs: [evidenceId] }), fazlaAlan: 1 }),
    /reasoning receipt geçersiz/,
  );
  assert.equal((db2.prepare("SELECT COUNT(*) c FROM approvals").get() as any).c, 0, 'RED yolunda onay yok');
  db.close();
  db2.close();
});

// GateError'un fail-closed tipi korunuyor (yama yeni hata tipi eklemedi)
test('M03: yama sonrası kapı hataları GateError tipinde kalır', () => {
  const db = openStore();
  passRig(db, 'run-1', 'a');
  try {
    requestDelivery(db, 'run-1', 'core', sampleReceipt(H64('b'), 'n1', { evidenceRefs: ['x'] }));
    assert.fail('RED bekleniyordu');
  } catch (e) {
    assert.ok(e instanceof GateError, 'GateError tipi');
  }
  db.close();
});
