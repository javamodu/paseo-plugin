// S1.1 e2e — TEK kapsul gercek uctan uca akis (canli, ucretsiz, yerel):
// capsule olustur -> plan -> insan onayi -> dispatch (LocalRuntimeAdapter + gercek
// node alt-sureci echo worker) -> candidate -> evaluator (gercek runner, gercek
// fixture) -> receipt (F2-A tam-bag) -> ACCEPT. Ayrica F2-B: worker PASS dese bile
// bagimsiz kanit yoksa/yanissa RED.
// Hermetik degil CANLI: dispatcher outbox'i gercek LocalRuntimeAdapter uzerinden
// tuketir; evaluator gercek execSync runner ile node fixture kosur. Dis API YOK.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn, execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  openStore, setGlobalStop, commitCandidate, recordEvidence, GateError,
} from '../src/store.ts';
import {
  createRunPlan, approvePlan, readyNodes, dispatchNode, ensureStartCommand,
  settleNodeOutcome, requestAcceptance, decideApproval, requestDelivery, allNodesDone,
} from '../src/supervisor.ts';
import { processOutbox } from '../src/dispatcher.ts';
import { LocalRuntimeAdapter, type LocalLauncher } from '../src/local-runtime.ts';
import { evaluateAttempt, type CommandRunner } from '../src/evaluator.ts';
import { sampleHandoff } from '../src/handoff.ts';
import { sampleReceipt } from '../src/reasoning-receipt.ts';
import {
  requireReceiptLinks, verifyReceiptLinks, type VerificationReceipt, type ReceiptLinkContext,
} from '../src/receipt-link.ts';
import type { ProbeReceipt } from '../src/capabilities.ts';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const SUITE = sha('ordu-core/e2e-s11-suite');
const CAND_CONTENT = 'candidate: e2e tek kapsul ciktisi (deterministik echo worker)';

// gercek evaluator runner'i: komutu isletim sisteminde KOSAR (adapter-evaluator deseni)
const realRunner: CommandRunner = async (cmd) => {
  try {
    const stdout = execSync(cmd, { encoding: 'utf8', shell: process.env.ComSpec ?? '/bin/sh' });
    return { exitCode: 0, stdout };
  } catch (e: any) {
    return { exitCode: e.status ?? 1, stdout: String(e.stdout ?? '') };
  }
};

// local runtime probe: yalniz LOCAL_REQUIRED_CAPS kanitli (ADR-012 kapsamli kapi)
const localProbe = (): ProbeReceipt => ({
  probe: 'ordu-v3/e2e-local', schemaVersion: 1, generatedAt: new Date().toISOString(), node: process.version,
  capabilities: { gitWorktreeProven: true, processRegistryDurable: true, cancelConfirmLocal: true, providerCliPresent: true },
  blocked: [], probeReceiptHash: '0'.repeat(64),
});

// yerel deterministik echo worker: GEREK node alt-sureci candidate dosyasini yazar.
// pid'i registry (Map) dispatchKey ile yazilmadan launch'dan donmez (sozlesme).
class EchoLauncher implements LocalLauncher {
  private pids = new Map<string, number>();
  private outFile: string;
  constructor(outFile: string) { this.outFile = outFile; }
  async launch(o: { dispatchKey: string; attemptId: string; prompt: string }) {
    const child = spawn(
      process.execPath,
      ['-e', 'require("fs").writeFileSync(process.argv[1], process.argv[2])', this.outFile, CAND_CONTENT],
      { stdio: 'ignore' },
    );
    if (!child.pid) throw new Error('pid alinamadi');
    this.pids.set(o.dispatchKey, child.pid);
    return { pid: child.pid };
  }
  pidOf(dispatchKey: string) { return this.pids.get(dispatchKey); }
  async isAlive(pid: number) {
    try { process.kill(pid, 0); return true; } catch { return false; }
  }
  async kill(pid: number) { try { process.kill(pid); } catch { /* zaten olu */ } }
}

async function waitForFile(path: string, tries = 100) {
  for (let i = 0; i < tries; i++) {
    if (existsSync(path)) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('worker ciktisi gelmedi: ' + path);
}

// tam akis iskeleti: capsule+plan+onay+dispatch; LocalRuntime spawn SONRASI candidate dondurur
async function capsuleToCandidate(opts: { runId: string; testCmd: string; dir: string }) {
  const db = openStore();
  setGlobalStop(db, false, 'operator', 'e2e acilis');
  const { planHash } = createRunPlan(db, {
    capsuleId: 'cap-' + opts.runId, goal: 'tek kapsul e2e', repoId: 'repo-local',
    sourceCommit: sha('commit-' + opts.runId),
    runId: opts.runId, planId: 'plan-' + opts.runId, profileHash: sha('profile-' + opts.runId),
    nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 1,
    allowedCommands: [opts.testCmd],
  });
  const startCmd = ensureStartCommand(db, opts.runId, planHash, 'operator');
  approvePlan(db, opts.runId, planHash, 'human'); // insan onayi (A03 kapsi)
  assert.deepEqual(readyNodes(db, opts.runId), ['n1']);
  const d = dispatchNode(db, opts.runId, 'n1', {
    tokens: 1000, startCommandId: startCmd, dispatchKey: 'dk-' + opts.runId,
    handoff: sampleHandoff('n1'),
  });
  assert.equal(d.status, 'DISPATCHED');
  const candFile = join(opts.dir, 'candidate-' + opts.runId + '.txt');
  const launcher = new EchoLauncher(candFile);
  const adapter = new LocalRuntimeAdapter(localProbe(), launcher, { ORDU_RUNTIME: 'local' });
  const out = await processOutbox(db, adapter);
  assert.equal((out as any).result, 'bound'); // SESSION_BOUND: yerel oturum baglandi
  const bound = db.prepare('SELECT external_session_id FROM attempts WHERE id=?').get(d.attemptId) as any;
  assert.match(bound.external_session_id, /^local:\d+$/);
  await waitForFile(candFile); // gercek alt-surec ciktisi
  const candidateHash = sha(readFileSync(candFile, 'utf8'));
  commitCandidate(db, d.attemptId, 1, candidateHash, 'worker-local');
  return { db, planHash, attemptId: d.attemptId as string, candidateHash };
}

test('S1.1 e2e: tek kapsul uctan uca — capsule -> onay -> yerel dispatch -> candidate -> evaluator -> receipt -> ACCEPT', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-e2e-'));
  const passFixture = join(dir, 'pass-fixture.js');
  writeFileSync(passFixture, 'console.log(JSON.stringify({tests:3,failed:0}));\n');
  const testCmd = `"${process.execPath}" "${passFixture}"`;

  const { db, planHash, attemptId, candidateHash } = await capsuleToCandidate({ runId: 'run-e2e', testCmd, dir });

  // evaluator: gercek runner + gercek fixture; PASS kaniti donmus adaya yazilir
  const ev = await evaluateAttempt(db, {
    attemptId, presentedFence: 1, candidateHash, testCmd, repoDir: dir,
    runner: realRunner, evidenceDir: join(dir, 'evidence'), actorId: 'evaluator',
  });
  assert.equal(ev.verdict, 'PASS');
  assert.equal(ev.tests, 3);
  assert.equal(settleNodeOutcome(db, attemptId, 'PASS').status, 'NODE_DONE');
  assert.ok(allNodesDone(db, 'run-e2e'));

  // F2-A: receipt TUM zorunlu alanlari + 8 semantik bag store'a karsi dogrulanir
  const evRow = db.prepare('SELECT * FROM evidence WHERE id=?').get(ev.evidenceId) as any;
  const receipt: VerificationReceipt = {
    candidateHash, suiteHash: SUITE, evaluatorId: 'ordu-core/evaluator.ts', evaluatorVersion: 'S1',
    attemptId, environment: evRow.environment_hash,
    startedAt: '2026-10-14T10:00:00Z', finishedAt: '2026-10-14T10:01:00Z',
    exitCodes: [0], testCounts: { passed: 3, failed: 0 }, artifacts: [evRow.artifact_hash],
    fenceToken: 1, correlationId: 'run-e2e', signature: 'sig-local-e2e',
    grantId: 'g-e2e', scope: ['coder'],
  };
  const ctx: ReceiptLinkContext = {
    evaluatorRegistry: { 'ordu-core/evaluator.ts': { S1: { suiteHash: SUITE } } },
    grants: { 'g-e2e': { attemptId, scope: ['coder'], expiresAt: '2099-01-01T00:00:00Z' } },
  };
  const linkReport = verifyReceiptLinks(db, receipt, ctx);
  assert.deepEqual(linkReport.failures, []);
  assert.doesNotThrow(() => requireReceiptLinks(db, receipt, ctx));
  // F2-A negatif kol: tek zorunlu bag bozulursa RED (testCounts kanitla uymaz)
  const tampered = verifyReceiptLinks(db, { ...receipt, testCounts: { passed: 2, failed: 0 } }, ctx);
  assert.equal(tampered.ok, false);
  assert.ok(tampered.failures.some((f) => f.includes('testCounts')));

  // receipt -> teslim-isteme (M18 makbuz kapisi) -> insan onayi -> ACCEPT
  const reasoning = sampleReceipt(candidateHash, 'n1', { evidenceRefs: [ev.evidenceId] });
  const req = requestDelivery(db, 'run-e2e', 'human', reasoning);
  const dec = decideApproval(db, req.approvalId, 'APPROVED', 'human', 1);
  assert.equal(dec.status, 'ACCEPTED');
  assert.equal((db.prepare("SELECT state FROM runs WHERE id='run-e2e'").get() as any).state, 'ACCEPTED');

  // KANIT artefakti: event zinciri + hash'ler stdout'a (rapor bunlari tasir)
  const chain = (db.prepare('SELECT type FROM events ORDER BY sequence').all() as any[]).map((e) => e.type);
  console.log('EVENT_CHAIN ' + JSON.stringify(chain));
  console.log('PLAN_HASH ' + planHash);
  console.log('CANDIDATE_HASH ' + candidateHash);
  console.log('RECEIPT_HASH ' + sha(JSON.stringify(receipt)));
});

test('F2-B arm-1: worker PASS iddia eder ama bagimsiz kanit HIC yok -> kabul RED', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-e2e-fake1-'));
  const fixture = join(dir, 'f.js');
  writeFileSync(fixture, 'console.log(JSON.stringify({tests:1,failed:0}));\n');
  const testCmd = `"${process.execPath}" "${fixture}"`;
  const { db, attemptId, candidateHash } = await capsuleToCandidate({ runId: 'run-fake1', testCmd, dir });

  // evaluator HIC kosmadi: worker'in 'PASS' sozunden baska sey yok
  assert.equal(settleNodeOutcome(db, attemptId, 'PASS').status, 'NODE_DONE'); // supervisor donmus adayi kabul eder
  const req = requestAcceptance(db, 'run-fake1', 'human'); // onay talebi olusur
  assert.throws(
    () => decideApproval(db, req.approvalId, 'APPROVED', 'human', 1),
    /PASS kan/, // 'donmus adayda PASS kanit yok — kabul yok' (fail-closed)
  );
  assert.notEqual((db.prepare("SELECT state FROM runs WHERE id='run-fake1'").get() as any).state, 'ACCEPTED');

  // receipt-link de ayni kapi: PASS iddiali receipt bagimsiz kanitsiz RED
  const fakeReceipt = {
    candidateHash, suiteHash: SUITE, evaluatorId: 'ordu-core/evaluator.ts', evaluatorVersion: 'S1',
    attemptId, environment: sha('uydurma-env'),
    startedAt: '2026-10-14T10:00:00Z', finishedAt: '2026-10-14T10:01:00Z',
    exitCodes: [0], testCounts: { passed: 1, failed: 0 }, artifacts: [sha('uydurma-artifact')],
    fenceToken: 1, correlationId: 'run-fake1', signature: 'sig-fake',
    grantId: 'g-fake', scope: ['coder'],
  } satisfies VerificationReceipt;
  const report = verifyReceiptLinks(db, fakeReceipt, {
    evaluatorRegistry: { 'ordu-core/evaluator.ts': { S1: { suiteHash: SUITE } } },
    grants: { 'g-fake': { attemptId, scope: ['coder'], expiresAt: '2099-01-01T00:00:00Z' } },
  });
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((f) => f.includes('environment')));
});

test('F2-B arm-2: bagimsiz evaluator FAIL derken worker PASS iddiasi -> RED (A13)', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-e2e-fake2-'));
  const failFixture = join(dir, 'fail-fixture.js');
  writeFileSync(failFixture, 'console.log(JSON.stringify({tests:2,failed:1})); process.exitCode = 1;\n');
  const testCmd = `"${process.execPath}" "${failFixture}"`;
  const { db, attemptId, candidateHash } = await capsuleToCandidate({ runId: 'run-fake2', testCmd, dir });

  // bagimsiz kanit FAIL: evaluator gercek fixture'i kostu, 1 test patladi
  const ev = await evaluateAttempt(db, {
    attemptId, presentedFence: 1, candidateHash, testCmd, repoDir: dir,
    runner: realRunner, evidenceDir: join(dir, 'evidence'), actorId: 'evaluator',
  });
  assert.equal(ev.verdict, 'FAIL');

  // store A13 kapisi: sahte PASS satiri (exit!=0 / 0 test) deftere DUSMEZ
  assert.throws(
    () => recordEvidence(db, {
      attemptId, presentedFence: 1, artifactHash: sha('sahte'), storageRef: 'mem://sahte', bytes: 1,
      environmentHash: sha('sahte-env'), evaluatorHash: sha('sahte-eval'),
      exitCode: 1, verdict: 'PASS', testCount: 0, actorId: 'worker-yalanci',
    }),
    GateError, // kanit kapisi RED (A13)
  );

  // worker yine de PASS iddia eden receipt sunarsa: kanit FAIL oldugundan RED (A13 bagi)
  const evRow = db.prepare('SELECT * FROM evidence WHERE id=?').get(ev.evidenceId) as any;
  const lyingReceipt = {
    candidateHash, suiteHash: SUITE, evaluatorId: 'ordu-core/evaluator.ts', evaluatorVersion: 'S1',
    attemptId, environment: evRow.environment_hash,
    startedAt: '2026-10-14T10:00:00Z', finishedAt: '2026-10-14T10:01:00Z',
    exitCodes: [0], testCounts: { passed: 2, failed: 0 }, artifacts: [evRow.artifact_hash],
    fenceToken: 1, correlationId: 'run-fake2', signature: 'sig-yalan',
    grantId: 'g-fake2', scope: ['coder'],
  } satisfies VerificationReceipt;
  const report = verifyReceiptLinks(db, lyingReceipt, {
    evaluatorRegistry: { 'ordu-core/evaluator.ts': { S1: { suiteHash: SUITE } } },
    grants: { 'g-fake2': { attemptId, scope: ['coder'], expiresAt: '2099-01-01T00:00:00Z' } },
  });
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((f) => f.includes('A13')), 'PASS iddiasi FAIL kanita baglaninca A13 RED');

  // durust yol: FAIL settle; node FAILED kalir, teslim talebi bile ACILAMAZ
  assert.equal(settleNodeOutcome(db, attemptId, 'FAIL', 'sig-fail').status, 'NODE_FAILED');
  assert.throws(() => requestAcceptance(db, 'run-fake2', 'human'), GateError);
});