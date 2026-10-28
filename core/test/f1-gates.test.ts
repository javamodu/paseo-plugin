// F1-D/E/F/G kabul kapilari — fake adapter, hermetik (MS-SSOT v2.7.2 §10; kabul.csv F1-D..G).
// Var olan kapsam TEKRAR EDILMEZ: store.test (A05/P0-6 komut dedupe+conflict, A13, A36),
// dispatcher.test (STALE/UNKNOWN/RETRYABLE), closure.test (U1-U5 orphan/cökme),
// receipt-link.test (evaluator/suiteHash/grant/scope/fence/candidate baglari),
// local-runtime.test (adapter-seviye capability FATAL), adapter-evaluator.test (B02/A13 runtime).
// Bu dosya kalan EKSIK negatif yollari kapatir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  openStore, recordCommand, setGlobalStop, reserveDispatch,
  commitCandidate, recordEvidence, GateError, FenceError,
} from '../src/store.ts';
import { processOutbox, type WorkerAdapter, type SpawnResult } from '../src/dispatcher.ts';
import { verifyReceiptLinks, type VerificationReceipt, type ReceiptLinkContext } from '../src/receipt-link.ts';
import { loadVerifiedProbe, type ProbeReceipt } from '../src/capabilities.ts';
import { LocalRuntimeAdapter, LOCAL_REQUIRED_CAPS, type LocalLauncher } from '../src/local-runtime.ts';
import { createRunPlan, approvePlan, dispatchNode, ensureStartCommand, settleNodeOutcome } from '../src/supervisor.ts';
import { sampleHandoff } from '../src/handoff.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);
const SUITE = H64('5');

// ---- store-seviye rig (store.test deseni) ----
function seeded() {
  const db = openStore();
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'hedef', 'repo', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)')
    .run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), '{}');
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-1','plan-1',1,'READY','ph',0,2,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1','n-1','coder','[]','READY')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-2','run-1','n-1',2,'RUNNING','ih2',1)`).run();
  setGlobalStop(db, false, 'test', 'kurulum');
  return db;
}
const spawnCmd = (db: any, key = 'idem-1') =>
  recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-1', idempotencyKey: key, payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: key } });

// ---- dispatcher rig (dispatcher.test deseni) ----
class FakeAdapter implements WorkerAdapter {
  spawnCalls: string[] = [];
  script: SpawnResult[];
  constructor(script: SpawnResult[] = [{ outcome: 'OK', externalSessionId: 'ses-1' }]) { this.script = script; }
  async spawn(o: { dispatchKey: string }) { this.spawnCalls.push(o.dispatchKey); return this.script.shift()!; }
  async lookup() { return 'UNKNOWN' as const; }
}
function riggedDispatch() {
  const db = seeded();
  const cmd = spawnCmd(db);
  reserveDispatch(db, { attemptId: 'att-1', tokens: 50, commandId: cmd.commandId, dispatchKey: 'dk-1' });
  return db;
}

// ---- receipt rig (receipt-link.test deseni; kanit verdict'i parametreli) ----
function receiptRig(opts: { verdict?: 'PASS' | 'FAIL'; exitCode?: number; testCount?: number } = {}) {
  const db = openStore();
  setGlobalStop(db, false, 'op', 'acilis');
  const planHash = createRunPlan(db, {
    capsuleId: 'cap-1', goal: 'g', repoId: 'r', sourceCommit: H64('c'),
    runId: 'run-1', planId: 'plan-1', profileHash: H64('p'),
    nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 5,
  }).planHash;
  const startCmd = ensureStartCommand(db, 'run-1', planHash, 'operator');
  approvePlan(db, 'run-1', planHash, 'human');
  const d = dispatchNode(db, 'run-1', 'n1', { tokens: 1000, startCommandId: startCmd, dispatchKey: 'k1', handoff: sampleHandoff('n1') });
  commitCandidate(db, d.attemptId, 1, H64('a'), 'worker');
  recordEvidence(db, {
    attemptId: d.attemptId, presentedFence: 1, artifactHash: H64('e'), storageRef: 's3://k1', bytes: 8,
    environmentHash: H64('f'), evaluatorHash: H64('h'),
    exitCode: opts.exitCode ?? 0, verdict: opts.verdict ?? 'PASS', testCount: opts.testCount ?? 4, actorId: 'evaluator',
  });
  if ((opts.verdict ?? 'PASS') === 'PASS') settleNodeOutcome(db, d.attemptId, 'PASS');
  return { db, attemptId: d.attemptId };
}
function goodReceipt(attemptId: string, over: Partial<VerificationReceipt> = {}): VerificationReceipt {
  return {
    candidateHash: H64('a'), suiteHash: SUITE, evaluatorId: 'eval-1', evaluatorVersion: '1.0',
    attemptId, environment: H64('f'),
    startedAt: '2026-10-14T10:00:00Z', finishedAt: '2026-10-14T10:01:00Z',
    exitCodes: [0], testCounts: { passed: 4, failed: 0 }, artifacts: [H64('e')],
    fenceToken: 1, correlationId: 'run-1', signature: 'sig-1',
    grantId: 'g1', scope: ['coder'],
    ...over,
  };
}
function goodCtx(attemptId: string, over: Partial<ReceiptLinkContext> = {}): ReceiptLinkContext {
  return {
    evaluatorRegistry: { 'eval-1': { '1.0': { suiteHash: SUITE } } },
    grants: { g1: { attemptId, scope: ['coder'], expiresAt: '2099-01-01T00:00:00Z' } },
    ...over,
  };
}

// ---- probe receipt builder (local-runtime.test deseni) ----
const canonical = (v: unknown): string =>
  v === null || typeof v !== 'object' ? JSON.stringify(v)
    : Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']'
      : '{' + Object.keys(v as object).sort().map((k) => JSON.stringify(k) + ':' + canonical((v as any)[k])).join(',') + '}';
function probeReceipt(localTrue: string[]): ProbeReceipt {
  const caps: Record<string, boolean> = {
    nodePinned24: true, gitPresent: true, paseoCliPresent: true, paseoDaemonReachable: true,
    worktreeIsolationProven: true, sandboxEstablished: true, structuredOutput: true, usageReporting: true, cancelConfirm: true,
  };
  for (const c of LOCAL_REQUIRED_CAPS) caps[c] = localTrue.includes(c as string);
  const blocked = Object.entries(caps).filter(([, v]) => !v).map(([k]) => k);
  const r: any = { probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: '2026-10-13T18:00:00.000Z', node: 'v24.18.0', capabilities: caps, blocked };
  r.probeReceiptHash = createHash('sha256').update(canonical(r)).digest('hex');
  return r as ProbeReceipt;
}
const PROBE_NOW = () => new Date(Date.parse('2026-10-13T19:00:00Z'));

// ================= F1-D: stale/fence reddi =================
// (store.test A36 eski-fence commit+kanit reddi ve closure.test U5 orphan kapsamda;
//  burada kalan iki negatif: gelecek fence + terminal attempte kanit.)

test('F1-D: gelecek fence commit reddi — sunulan=guncel+1 de FenceError (zaman yolculugu yok)', () => {
  const db = seeded();
  assert.throws(() => commitCandidate(db, 'att-1', 2, H64('a'), 'worker'), FenceError);
  assert.equal((db.prepare("SELECT state FROM attempts WHERE id='att-1'").get() as any).state, 'RUNNING');
});

test('F1-D: terminal (ACCEPTED) attempte kanit yazimi RED — kanit yalniz donmus adaya', () => {
  const db = seeded();
  commitCandidate(db, 'att-1', 1, H64('a'), 'worker');
  db.prepare("UPDATE attempts SET state='ACCEPTED' WHERE id='att-1'").run(); // terminal
  assert.throws(
    () => recordEvidence(db, {
      attemptId: 'att-1', presentedFence: 1, artifactHash: H64('e'), storageRef: 's3://x', bytes: 1,
      environmentHash: H64('f'), evaluatorHash: H64('h'), exitCode: 0, verdict: 'PASS', testCount: 1, actorId: 'evaluator',
    }),
    (e: unknown) => e instanceof GateError && /donmuş aday/.test((e as Error).message),
  );
});

// ================= F1-E: cift-spawn dedupe =================
// (komut katmani A05/P0-6 kapsamda; burada dispatch katmani + supervisor retry yolu.)

test('F1-E: ayni dispatchKey ile ikinci reserveDispatch CONFLICT RED — rezervasyon/outbox sizmaz', () => {
  const db = seeded();
  const cmd = spawnCmd(db);
  reserveDispatch(db, { attemptId: 'att-1', tokens: 40, commandId: cmd.commandId, dispatchKey: 'dk-x' });
  assert.throws(
    () => reserveDispatch(db, { attemptId: 'att-2', tokens: 40, commandId: cmd.commandId, dispatchKey: 'dk-x' }),
    /UNIQUE|dispatch_key/,
  );
  assert.equal((db.prepare('SELECT COUNT(*) AS c FROM outbox').get() as any).c, 1, 'ikinci niyet satiri sizdi');
  assert.equal((db.prepare('SELECT COUNT(*) AS c FROM reservations').get() as any).c, 1, 'rezervasyon sizdi (rollback bozuk)');
  assert.equal((db.prepare("SELECT state FROM reservations WHERE attempt_id='att-1'").get() as any).state, 'ACTIVE');
});

test('F1-E: SENT sonrasi ikinci processOutbox idle — spawn tam 1 kez (idempotent tuketim)', async () => {
  const db = riggedDispatch();
  const a = new FakeAdapter([{ outcome: 'OK', externalSessionId: 'ses-9' }]);
  const r1 = await processOutbox(db, a);
  assert.equal(r1.result, 'bound');
  const r2 = await processOutbox(db, a);
  assert.ok(r2.idle, 'SENT satir spawn yoluna geri dondu');
  assert.equal(a.spawnCalls.length, 1, 'cift spawn — F1-E ihlali');
});

test('F1-E: supervisor start-komutu retry — ayni idempotency key ikinci mantiksal komut URETMEZ', () => {
  const db = openStore();
  setGlobalStop(db, false, 'op', 'acilis');
  const planHash = createRunPlan(db, {
    capsuleId: 'cap-1', goal: 'g', repoId: 'r', sourceCommit: H64('c'),
    runId: 'run-1', planId: 'plan-1', profileHash: H64('p'),
    nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 5,
  }).planHash;
  const c1 = ensureStartCommand(db, 'run-1', planHash, 'operator');
  const c2 = ensureStartCommand(db, 'run-1', planHash, 'operator'); // retry
  assert.equal(c2, c1);
  assert.equal((db.prepare('SELECT COUNT(*) AS c FROM commands').get() as any).c, 1);
});

// ================= F1-F: sahte-PASS reddi =================

test('F1-F: PASS beyani exit_code!=0 ile RED — artefakt da geri alinir (exit-0-yetmez ikizi)', () => {
  const db = seeded();
  commitCandidate(db, 'att-1', 1, H64('a'), 'worker');
  assert.throws(
    () => recordEvidence(db, {
      attemptId: 'att-1', presentedFence: 1, artifactHash: H64('e'), storageRef: 's3://x', bytes: 1,
      environmentHash: H64('f'), evaluatorHash: H64('h'), exitCode: 1, verdict: 'PASS', testCount: 3, actorId: 'evaluator',
    }),
    (e: unknown) => e instanceof GateError && /A13/.test((e as Error).message),
  );
  assert.equal((db.prepare('SELECT COUNT(*) AS c FROM artifacts').get() as any).c, 0, 'RED edilen kanitin artefakti kaldi');
});

test('F1-F: environment bagi — yanlis environment hash RED', () => {
  const { db, attemptId } = receiptRig();
  const report = verifyReceiptLinks(db, goodReceipt(attemptId, { environment: H64('9') }), goodCtx(attemptId));
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((f) => f.includes('eslesen kanit kaydi yok')));
});

test('F1-F: receipt PASS iddia ediyor ama kanit FAIL — sahte-PASS capraz kontrolu RED', () => {
  const { db, attemptId } = receiptRig({ verdict: 'FAIL', exitCode: 1, testCount: 2 });
  const report = verifyReceiptLinks(
    db,
    goodReceipt(attemptId, { exitCodes: [0], testCounts: { passed: 2, failed: 0 } }),
    goodCtx(attemptId),
  );
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((f) => f.includes('receipt PASS iddia ediyor ama kanit PASS degil')));
});

test('F1-F: testCounts toplami kanit test_count ile eslesmiyor — RED', () => {
  const { db, attemptId } = receiptRig();
  const report = verifyReceiptLinks(db, goodReceipt(attemptId, { testCounts: { passed: 3, failed: 0 } }), goodCtx(attemptId));
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((f) => f.includes('testCounts toplami')));
});

test('F1-F: artefakt baglari — listede yok / storeda yok RED', () => {
  const { db, attemptId } = receiptRig();
  const missing = verifyReceiptLinks(db, goodReceipt(attemptId, { artifacts: [H64('7')] }), goodCtx(attemptId));
  assert.equal(missing.ok, false);
  assert.ok(missing.failures.some((f) => f.includes('kanit artefakti receipt artifacts listesinde yok')));
  const ghost = verifyReceiptLinks(db, goodReceipt(attemptId, { artifacts: [H64('e'), H64('7')] }), goodCtx(attemptId));
  assert.equal(ghost.ok, false);
  assert.ok(ghost.failures.some((f) => f.includes('artefakt storeda yok')));
});

test('F1-F: run bagi — correlationId uyusmazligi ve CANCELLED run RED', () => {
  const { db, attemptId } = receiptRig();
  const wrong = verifyReceiptLinks(db, goodReceipt(attemptId, { correlationId: 'run-2' }), goodCtx(attemptId));
  assert.equal(wrong.ok, false);
  assert.ok(wrong.failures.some((f) => f.includes('correlationId run ile eslesmiyor')));
  db.prepare("UPDATE runs SET state='CANCELLED' WHERE id='run-1'").run();
  const cancelled = verifyReceiptLinks(db, goodReceipt(attemptId), goodCtx(attemptId));
  assert.equal(cancelled.ok, false);
  assert.ok(cancelled.failures.some((f) => f.includes('CANCELLED')));
});

test('F1-F: zaman bagi — finishedAt < startedAt RED', () => {
  const { db, attemptId } = receiptRig();
  const report = verifyReceiptLinks(
    db,
    goodReceipt(attemptId, { startedAt: '2026-10-14T10:02:00Z', finishedAt: '2026-10-14T10:01:00Z' }),
    goodCtx(attemptId),
  );
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((f) => f.includes('zaman bagi')));
});

// ================= F1-G: M26/M31 negatif izin =================

test('F1-G (M31): capability eksik — spawn FATAL, attempt FAILED + rezervasyon RELEASED, launchera HIC gidilmez', async () => {
  const db = riggedDispatch();
  const receipt = probeReceipt(['gitWorktreeProven', 'processRegistryDurable', 'providerCliPresent']); // cancelConfirmLocal EKSIK
  let touched = false;
  const guard: LocalLauncher = {
    async launch() { touched = true; return { pid: 1 }; },
    pidOf() { touched = true; return undefined; },
    async isAlive() { touched = true; return true; },
    async kill() { touched = true; },
    dispatchKeyOf(_a: string): string | undefined { return undefined; }, // tip-borcu v9-06: guard-nesne attempt izlemez (cancel UNKNOWN fail-closed)
  };
  const a = new LocalRuntimeAdapter(receipt, guard, { ORDU_RUNTIME: 'local' });
  const r = await processOutbox(db, a);
  assert.equal(r.result, 'fatal');
  assert.equal(touched, false, 'capability eksikken launchera gidildi — M31 yazma engeli ihlali');
  assert.equal((db.prepare("SELECT state FROM attempts WHERE id='att-1'").get() as any).state, 'FAILED');
  assert.equal((db.prepare("SELECT state FROM reservations WHERE attempt_id='att-1'").get() as any).state, 'RELEASED');
  assert.equal((db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'FAILED');
  assert.equal((db.prepare("SELECT external_session_id FROM attempts WHERE id='att-1'").get() as any).external_session_id, null);
});

test('F1-G (M26): probe receipt symlink/junction kacak yolu RED — gercek yol sart', () => {
  const root = mkdtempSync(join(tmpdir(), 'ordu-m26-'));
  const realDir = join(root, 'real');
  mkdirSync(realDir);
  const receiptPath = join(realDir, 'probe.json');
  writeFileSync(receiptPath, JSON.stringify(probeReceipt([...LOCAL_REQUIRED_CAPS]), null, 2));
  const linkDir = join(root, 'link');
  symlinkSync(realDir, linkDir, 'junction'); // admin GEREKTIRMEZ (Windows junction)
  const viaLink = join(linkDir, 'probe.json');
  assert.doesNotThrow(() => loadVerifiedProbe(receiptPath, { now: PROBE_NOW }), 'gercek yol kabul edilmeli');
  assert.throws(() => loadVerifiedProbe(viaLink, { now: PROBE_NOW }), /symlink|junction|KAÇ|kacak/i);
});

test('F1-G (M26 deny-wins): grant baska attempte bagli / imza bozuk — diger 7 bag gecerli olsa da RED', () => {
  const { db, attemptId } = receiptRig();
  const wrongGrant = verifyReceiptLinks(db, goodReceipt(attemptId), {
    ...goodCtx(attemptId),
    grants: { g1: { attemptId: 'att-baska', scope: ['coder'], expiresAt: '2099-01-01T00:00:00Z' } },
  });
  assert.equal(wrongGrant.ok, false);
  assert.ok(wrongGrant.failures.some((f) => f.includes('grant bu attempte bagli degil')));
  const badSig = verifyReceiptLinks(db, goodReceipt(attemptId), goodCtx(attemptId, { verifySignature: () => false }));
  assert.equal(badSig.ok, false);
  assert.ok(badSig.failures.some((f) => f.includes('imza bagi')));
});
