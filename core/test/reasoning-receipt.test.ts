// D3 / M18 reasoning receipt hermetik kanıtı. Saf şema + DB-delivery gate. Çekirdek
// kapalı komut/olay seti DEĞİŞMEZ: makbuz DIŞ JSON sözleşmesi, teslim-isteme yolunda gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStore, setGlobalStop, commitCandidate, recordEvidence } from '../src/store.ts';
import {
  createRunPlan, approvePlan, dispatchNode, ensureStartCommand, settleNodeOutcome,
  decideApproval, requestDelivery, requireDeliverableReceipt,
} from '../src/supervisor.ts';
import { sampleHandoff } from '../src/handoff.ts';
import {
  validateReasoningReceipt, sampleReceipt,
} from '../src/reasoning-receipt.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

function freshPassRig() {
  const db = openStore();
  setGlobalStop(db, false, 'op', 'acilis');
  const planHash = createRunPlan(db, {
    capsuleId: 'cap-1', goal: 'g', repoId: 'r', sourceCommit: H64('c'),
    runId: 'run-1', planId: 'plan-1', profileHash: H64('p'), nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 5,
  }).planHash;
  const startCmd = ensureStartCommand(db, 'run-1', planHash, 'operator');
  approvePlan(db, 'run-1', planHash, 'human');
  const d = dispatchNode(db, 'run-1', 'n1', { tokens: 1000, startCommandId: startCmd, dispatchKey: 'k1', handoff: sampleHandoff('n1') });
  commitCandidate(db, d.attemptId, 1, H64('a'), 'worker');
  const { evidenceId } = recordEvidence(db, { attemptId: d.attemptId, presentedFence: 1, artifactHash: H64('e'), storageRef: 's3://k1', bytes: 8, environmentHash: H64('v'), evaluatorHash: H64('h'), exitCode: 0, verdict: 'PASS', testCount: 4, actorId: 'evaluator' });
  settleNodeOutcome(db, d.attemptId, 'PASS');
  return { db, evidenceId };
}

test('M18 şema: kapalı DTO — ek alan RED, alternatif/kanıt boş RED, confidence enum dışı RED', () => {
  assert.ok(validateReasoningReceipt({ ...sampleReceipt(H64('a')), fazla: 1 }).ok === false, 'additionalProperties:false');
  assert.ok(validateReasoningReceipt({ ...sampleReceipt(H64('a')), alternatives: [] }).ok === false, 'alternatif>=1 zorunlu (assertion değil muhakeme)');
  assert.ok(validateReasoningReceipt({ ...sampleReceipt(H64('a')), evidenceRefs: [] }).ok === false, 'kanıt>=1 zorunlu');
  assert.ok(validateReasoningReceipt({ ...sampleReceipt(H64('a')), confidence: 'KESIN' }).ok === false, 'confidence LOW|MEDIUM|HIGH');
  assert.ok(validateReasoningReceipt({ ...sampleReceipt(H64('a')), candidateHash: 'zz' }).ok === false, 'candidateHash 64 hex');
  assert.ok(validateReasoningReceipt(sampleReceipt(H64('a'))).ok, 'örnek makbuz geçerli');
});

test('M18 gate: makbuz uyuşmaz adayla → RED (başka adayı açıklıyor)', () => {
  const { db, evidenceId } = freshPassRig();
  assert.throws(
    () => requestDelivery(db, 'run-1', 'core', sampleReceipt(H64('b'), 'n1', { evidenceRefs: [evidenceId] })),
    /bağdaşmıyor/,
  );
});

test('M18 gate: kanıt-id uydurma (gerçek PASS değil) → RED (kanıtsız iddia)', () => {
  const { db } = freshPassRig();
  assert.throws(
    () => requestDelivery(db, 'run-1', 'core', sampleReceipt(H64('a'), 'n1', { evidenceRefs: ['sahte-kanit-id'] })),
    /kanıta bağlı değil/,
  );
});

test('M18 gate: donmuş ACCEPTED aday yokken teslim-isteme → RED', () => {
  const db = openStore();
  setGlobalStop(db, false, 'op', 'acilis');
  const planHash = createRunPlan(db, {
    capsuleId: 'c', goal: 'g', repoId: 'r', sourceCommit: H64('c'),
    runId: 'run-2', planId: 'p2', profileHash: H64('p'), nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 5,
  }).planHash;
  ensureStartCommand(db, 'run-2', planHash, 'op');
  approvePlan(db, 'run-2', planHash, 'human');
  assert.throws(() => requireDeliverableReceipt(db, 'run-2', sampleReceipt(H64('a'))), /donmuş aday yok/);
});

test('M18 mutlu yol: geçerli+kanıtlı makbuz → teslim-isteme geçer ve insan onayıyla ACCEPTED', () => {
  const { db, evidenceId } = freshPassRig();
  const { approvalId, candidateHash } = requestDelivery(db, 'run-1', 'core', sampleReceipt(H64('a'), 'n1', { evidenceRefs: [evidenceId] }));
  assert.equal(candidateHash, H64('a'));
  assert.equal((db.prepare('SELECT state FROM runs WHERE id=?').get('run-1') as any).state, 'VERIFYING');
  // mevcut insan-onayı akışı BOZULMADI: APPROVED → ACCEPTED
  assert.equal(decideApproval(db, approvalId, 'APPROVED', 'human', 1).status, 'ACCEPTED');
});
