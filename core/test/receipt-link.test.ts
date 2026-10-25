// Receipt tam-bag dogrulayicisi hermetik kaniti (SSOT §7 + §20.4/§20.5).
// 8 bag store'a karsi dogrulanir; kayit denklemi registry[id,surum].suiteHash == receipt.suiteHash.
// Pozitif + negatif agirlikli: tek kirilan bag = RED (fail-closed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStore, setGlobalStop, commitCandidate, recordEvidence, takeLease, GateError } from '../src/store.ts';
import { createRunPlan, approvePlan, dispatchNode, ensureStartCommand, settleNodeOutcome } from '../src/supervisor.ts';
import { sampleHandoff } from '../src/handoff.ts';
import {
  verifyReceiptLinks, requireReceiptLinks, validateReceiptShape,
  type VerificationReceipt, type ReceiptLinkContext,
} from '../src/receipt-link.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);
const SUITE = H64('5');

function freshRig() {
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
    environmentHash: H64('f'), evaluatorHash: H64('h'), exitCode: 0, verdict: 'PASS', testCount: 4, actorId: 'evaluator',
  });
  settleNodeOutcome(db, d.attemptId, 'PASS'); // attempt ACCEPTED olur — receipt yine de bagli kalmali
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

test('receipt-link mutlu yol: 8 bagin TAMAMI eslesiyor -> ok', () => {
  const { db, attemptId } = freshRig();
  const report = verifyReceiptLinks(db, goodReceipt(attemptId), goodCtx(attemptId));
  assert.deepEqual(report.failures, []);
  assert.equal(report.ok, true);
  assert.doesNotThrow(() => requireReceiptLinks(db, goodReceipt(attemptId), goodCtx(attemptId)));
});

test('receipt-link RED: yanlis evaluator surumu — registry kaydi yok', () => {
  const { db, attemptId } = freshRig();
  const report = verifyReceiptLinks(db, goodReceipt(attemptId, { evaluatorVersion: '2.0' }), goodCtx(attemptId));
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((f) => f.startsWith('evaluator bagi: registry kaydi yok')));
});

test('receipt-link RED: suiteHash denklemi bozuk — registry[id,surum].suiteHash != receipt.suiteHash', () => {
  const { db, attemptId } = freshRig();
  const ctx = goodCtx(attemptId);
  ctx.evaluatorRegistry['eval-1']['1.0'] = { suiteHash: H64('9') };
  const report = verifyReceiptLinks(db, goodReceipt(attemptId), ctx);
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((f) => f.includes('suiteHash denklemi bozuk')));
});

test('receipt-link RED: revoke edilmis grant', () => {
  const { db, attemptId } = freshRig();
  const ctx = goodCtx(attemptId);
  ctx.grants.g1 = { ...ctx.grants.g1, revoked: true };
  const report = verifyReceiptLinks(db, goodReceipt(attemptId), ctx);
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((f) => f.includes('grant revoke edilmis')));
});

test('receipt-link RED: kapsam disi scope — grant.scope kapsamiyor', () => {
  const { db, attemptId } = freshRig();
  const report = verifyReceiptLinks(db, goodReceipt(attemptId, { scope: ['coder', 'admin'] }), goodCtx(attemptId));
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((f) => f.includes('kapsam disi scope') && f.includes('admin')));
});

test('receipt-link RED: stale fence — devir sonrasi eski token (A36)', () => {
  const { db, attemptId } = freshRig();
  takeLease(db, attemptId, 'worker-2', '2099-01-01T00:00:00Z'); // fence 1 -> 2
  const report = verifyReceiptLinks(db, goodReceipt(attemptId), goodCtx(attemptId));
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((f) => f.includes('stale fence')));
});

test('receipt-link RED: yanlis candidateHash — donmus adayla eslesmiyor', () => {
  const { db, attemptId } = freshRig();
  const report = verifyReceiptLinks(db, goodReceipt(attemptId, { candidateHash: H64('b') }), goodCtx(attemptId));
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((f) => f.includes('candidateHash donmus adayla eslesmiyor')));
});

test('receipt-link RED: suresi dolmus grant + bilinmeyen attempt', () => {
  const { db, attemptId } = freshRig();
  const ctx = goodCtx(attemptId);
  ctx.grants.g1 = { ...ctx.grants.g1, expiresAt: '2020-01-01T00:00:00Z' };
  const expired = verifyReceiptLinks(db, goodReceipt(attemptId), ctx);
  assert.equal(expired.ok, false);
  assert.ok(expired.failures.some((f) => f.includes('suresi dolmus')));

  const ghost = verifyReceiptLinks(db, goodReceipt('att-yok', { grantId: 'g2' }), {
    ...goodCtx(attemptId),
    grants: { g2: { attemptId: 'att-yok', scope: ['coder'], expiresAt: '2099-01-01T00:00:00Z' } },
  });
  assert.equal(ghost.ok, false);
  assert.ok(ghost.failures.some((f) => f.includes('attempt storeda yok')));
});

test('receipt-link RED: sema ihlali ve requireReceiptLinks fail-closed firlatir', () => {
  const { db, attemptId } = freshRig();
  assert.equal(validateReceiptShape({ ...goodReceipt(attemptId), fazla: 1 }).ok, false);
  assert.equal(validateReceiptShape(goodReceipt(attemptId, { candidateHash: 'zz' })).ok, false);
  assert.throws(
    () => requireReceiptLinks(db, goodReceipt(attemptId, { fenceToken: 99 }), goodCtx(attemptId)),
    (e: unknown) => e instanceof GateError && /receipt tam-bag RED/.test((e as Error).message),
  );
});
