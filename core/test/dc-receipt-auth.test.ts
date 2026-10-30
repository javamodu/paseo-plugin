import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, createHash } from 'node:crypto';

import { openStore, setGlobalStop, commitCandidate, recordEvidence, takeLease, GateError } from '../src/store.ts';
import { createRunPlan, approvePlan, dispatchNode, ensureStartCommand, settleNodeOutcome } from '../src/supervisor.ts';
import { sampleHandoff } from '../src/handoff.ts';
import { verifyReceiptLinks, requireReceiptLinks, type ReceiptLinkContext, type VerificationReceipt } from '../src/receipt-link.ts';

const H64 = (c: string) => createHash('sha256').update(c).digest('hex');
const SUITE = H64('suite');
const FIXTURE_KEY = 'dc-receipt-auth-fixture-key';
const AUTHORIZED_SIGNERS = new Set(['eval-1@1.0']);

const canonical = (receipt: VerificationReceipt): string => {
  const copy = { ...receipt, signature: '' };
  return JSON.stringify(copy);
};

const signReceipt = (receipt: VerificationReceipt): string =>
  createHmac('sha256', FIXTURE_KEY).update(canonical(receipt)).digest('hex');

const verifySignature = (receipt: VerificationReceipt): boolean => {
  const signer = `${receipt.evaluatorId}@${receipt.evaluatorVersion}`;
  return AUTHORIZED_SIGNERS.has(signer) && signReceipt(receipt) === receipt.signature;
};

function receiptRig(prefix: string): { db: ReturnType<typeof openStore>; attemptId: string; runId: string } {
  const db = openStore();
  setGlobalStop(db, false, 'operator', 'acilis');
  const planHash = createRunPlan(db, {
    capsuleId: prefix + '-cap',
    goal: 'g',
    repoId: 'r',
    sourceCommit: H64(prefix + 'source'),
    runId: prefix + '-run',
    planId: prefix + '-plan',
    profileHash: H64(prefix + 'profile'),
    nodes: [{ id: 'n1', role: 'coder', deps: [] }],
    maxWorkers: 5,
  }).planHash;
  const startCommand = ensureStartCommand(db, prefix + '-run', planHash, 'operator');
  approvePlan(db, prefix + '-run', planHash, 'human');
  const dispatch = dispatchNode(db, prefix + '-run', 'n1', {
    tokens: 1000,
    startCommandId: startCommand,
    dispatchKey: prefix + '-dispatch',
    handoff: sampleHandoff('n1'),
  });
  commitCandidate(db, dispatch.attemptId, 1, H64('candidate'), 'worker');
  recordEvidence(db, {
    attemptId: dispatch.attemptId,
    presentedFence: 1,
    artifactHash: H64('artifact'),
    storageRef: 'temp://' + prefix + '-artifact',
    bytes: 8,
    environmentHash: H64('environment'),
    evaluatorHash: H64('evaluator'),
    exitCode: 0,
    verdict: 'PASS',
    testCount: 4,
    actorId: 'evaluator',
  });
  settleNodeOutcome(db, dispatch.attemptId, 'PASS');
  return { db, attemptId: dispatch.attemptId, runId: prefix + '-run' };
}

function goodReceipt(attemptId: string, runId: string, over: Partial<VerificationReceipt> = {}): VerificationReceipt {
  const receipt: VerificationReceipt = {
    candidateHash: H64('candidate'),
    suiteHash: SUITE,
    evaluatorId: 'eval-1',
    evaluatorVersion: '1.0',
    attemptId,
    environment: H64('environment'),
    startedAt: '2026-10-30T10:00:00Z',
    finishedAt: '2026-10-30T10:01:00Z',
    exitCodes: [0],
    testCounts: { passed: 4, failed: 0 },
    artifacts: [H64('artifact')],
    fenceToken: 1,
    correlationId: runId,
    signature: '',
    grantId: 'grant-1',
    scope: ['coder'],
    ...over,
  };
  receipt.signature = signReceipt(receipt);
  return receipt;
}

function goodContext(attemptId: string, over: Partial<ReceiptLinkContext> = {}): ReceiptLinkContext {
  return {
    evaluatorRegistry: { 'eval-1': { '1.0': { suiteHash: SUITE } } },
    grants: {
      'grant-1': { attemptId, scope: ['coder'], expiresAt: '2099-01-01T00:00:00Z' },
    },
    verifySignature,
    now: () => new Date('2026-10-30T10:02:00Z'),
    ...over,
  };
}

const verifyAuthorizedReceipt = (
  db: ReturnType<typeof openStore>,
  receipt: VerificationReceipt,
  context: ReceiptLinkContext,
) => {
  if (typeof context.verifySignature !== 'function') {
    return { ok: false, failures: ['imza callback yok — yetkili üretici doğrulanamaz'] };
  }
  return verifyReceiptLinks(db, receipt, context);
};

test('P1: dogru imzali ve tam baglar esit makbuz kabul edilir', () => {
  const { db, attemptId, runId } = receiptRig('auth');
  const receipt = goodReceipt(attemptId, runId);
  const context = goodContext(attemptId);
  const report = verifyAuthorizedReceipt(db, receipt, context);
  assert.deepEqual(report.failures, []);
  assert.equal(report.ok, true);
  assert.doesNotThrow(() => requireReceiptLinks(db, receipt, context));
});

test('N1: eksik/revoke imza ve callback yoklugu RED', () => {
  const { db, attemptId, runId } = receiptRig('sign');
  const receipt = goodReceipt(attemptId, runId);
  const wrong = { ...receipt, signature: 'yanlis-imza' };
  const wrongReport = verifyAuthorizedReceipt(db, wrong, goodContext(attemptId));
  assert.equal(wrongReport.ok, false);
  assert.ok(wrongReport.failures.some((failure) => failure.includes('imza')));

  const revokedContext = goodContext(attemptId, { verifySignature: () => false });
  const revokedReport = verifyAuthorizedReceipt(db, receipt, revokedContext);
  assert.equal(revokedReport.ok, false);
  assert.ok(revokedReport.failures.some((failure) => failure.includes('imza')));

  const missingCallbackContext = goodContext(attemptId);
  delete (missingCallbackContext as { verifySignature?: unknown }).verifySignature;
  const missingCallbackReport = verifyAuthorizedReceipt(db, receipt, missingCallbackContext);
  assert.equal(missingCallbackReport.ok, false);
  assert.ok(missingCallbackReport.failures.some((failure) => failure.includes('imza callback yok')));
});

test('N1: yanlis evaluator, ortam, suite, fence ve sure RED', () => {
  const { db, attemptId, runId } = receiptRig('links');
  const receipt = goodReceipt(attemptId, runId);
  const context = goodContext(attemptId);

  const wrongEvaluator = verifyAuthorizedReceipt(db, goodReceipt(attemptId, runId, { evaluatorVersion: '2.0' }), context);
  assert.equal(wrongEvaluator.ok, false);
  assert.ok(wrongEvaluator.failures.some((failure) => failure.includes('evaluator')));

  const wrongEnvironment = verifyAuthorizedReceipt(db, goodReceipt(attemptId, runId, { environment: H64('baska-ortam') }), context);
  assert.equal(wrongEnvironment.ok, false);
  assert.ok(wrongEnvironment.failures.some((failure) => failure.includes('environment')));

  const wrongSuite = verifyAuthorizedReceipt(db, goodReceipt(attemptId, runId, { suiteHash: H64('baska-suite') }), context);
  assert.equal(wrongSuite.ok, false);
  assert.ok(wrongSuite.failures.some((failure) => failure.includes('suiteHash')));

  takeLease(db, attemptId, 'worker-2', '2099-01-01T00:00:00Z');
  const staleFence = verifyAuthorizedReceipt(db, receipt, context);
  assert.equal(staleFence.ok, false);
  assert.ok(staleFence.failures.some((failure) => failure.includes('stale fence')));

  const expiredContext = goodContext(attemptId, {
    grants: { 'grant-1': { attemptId, scope: ['coder'], expiresAt: '2020-01-01T00:00:00Z' } },
  });
  const expired = verifyAuthorizedReceipt(db, receipt, expiredContext);
  assert.equal(expired.ok, false);
  assert.ok(expired.failures.some((failure) => failure.includes('suresi dolmus')));
});

test('N2: ayni icerik baska run/attempt icin PASS kaniti olarak kullanilamaz', () => {
  const first = receiptRig('same-first');
  const second = receiptRig('same-second');
  const receipt = goodReceipt(second.attemptId, first.runId);
  const context = goodContext(second.attemptId);
  const report = verifyAuthorizedReceipt(second.db, receipt, context);
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((failure) => failure.includes('run') || failure.includes('attempt') || failure.includes('correlation')));
  assert.throws(
    () => requireReceiptLinks(second.db, receipt, context),
    (error: unknown) => error instanceof GateError && /receipt tam-bag RED/.test((error as Error).message),
  );
});
