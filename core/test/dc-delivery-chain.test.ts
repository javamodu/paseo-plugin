import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { openStore, setGlobalStop, GateError } from '../src/store.ts';
import {
  createRunPlan,
  approvePlan,
  dispatchNode,
  ensureStartCommand,
  requestDelivery,
  decideApproval,
} from '../src/supervisor.ts';
import { sampleHandoff } from '../src/handoff.ts';
import { evaluateArtifact } from '../src/cli-evaluate.ts';
import { sampleReceipt } from '../src/reasoning-receipt.ts';

const sha256 = (buf: Buffer | string) => createHash('sha256').update(buf).digest('hex');

function deliveryRig(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-dc-delivery-'));
  const db = openStore(join(dir, 'delivery.sqlite'));
  setGlobalStop(db, false, 'operator', 'test');
  const runId = `${prefix}-run`;
  const plan = createRunPlan(db, {
    capsuleId: `${prefix}-capsule`,
    goal: 'test goal',
    repoId: 'repo-local',
    sourceCommit: sha256(prefix + '-source'),
    runId,
    planId: `${prefix}-plan`,
    profileHash: sha256(prefix + '-profile'),
    nodes: [{ id: 'n1', role: 'coder', deps: [] }],
    maxWorkers: 1,
  });
  const startCommandId = ensureStartCommand(db, runId, plan.planHash, 'operator');
  approvePlan(db, runId, plan.planHash, 'human');
  const dispatched = dispatchNode(db, runId, 'n1', {
    tokens: 1000,
    startCommandId,
    dispatchKey: `${prefix}-dispatch`,
    handoff: sampleHandoff('n1'),
  });
  return { db, dir, runId, attemptId: dispatched.attemptId as string };
}

function deliveryGate(
  db: ReturnType<typeof openStore>,
  runId: string,
  attemptId: string,
  artifactPath: string,
  candidateHash: string,
  evidenceId: string,
) {
  const currentHash = sha256(readFileSync(artifactPath));
  if (currentHash !== candidateHash) {
    throw new Error(`teslim edilen bayt test edilen bayt değil (${currentHash} != ${candidateHash})`);
  }
  const receipt = sampleReceipt(candidateHash, 'n1', { evidenceRefs: [evidenceId] });
  const request = requestDelivery(db, runId, 'human', receipt);
  return decideApproval(db, request.approvalId, 'APPROVED', 'human', 1);
}

test('P1: doğru görev gerçek test kanalı ve makbuzla insan kabul adımına sunulur', () => {
  const { db, dir, runId, attemptId } = deliveryRig('delivery-p1');
  const artifactPath = join(dir, 'artifact.txt');
  const content = 'real delivery payload: pass';
  writeFileSync(artifactPath, content, 'utf8');

  const result = evaluateArtifact(db, {
    attemptId,
    artifactPath,
    expect: 'pass',
    actorId: 'evaluator:delivery',
    artifactsDir: join(dir, 'artifacts'),
  });
  assert.equal(result.verdict, 'PASS');
  assert.equal(result.exitCode, 0);
  assert.ok(result.evidenceId);
  assert.equal(sha256(readFileSync(artifactPath)), result.candidateHash);

  const decision = deliveryGate(db, runId, attemptId, artifactPath, result.candidateHash, result.evidenceId as string);
  assert.equal(decision.status, 'ACCEPTED');
  const runState = (db.prepare('SELECT state FROM runs WHERE id=?').get(runId) as any).state;
  assert.equal(runState, 'ACCEPTED');
  db.close();
});

test('N1: dosya varlığı/alt-dize veya örnek makbuz genel kod teslimi kabul ettirmez', () => {
  const { db, dir, runId, attemptId } = deliveryRig('delivery-n1');
  const artifactPath = join(dir, 'artifact.txt');
  writeFileSync(artifactPath, 'general code payload: pass', 'utf8');

  const result = evaluateArtifact(db, {
    attemptId,
    artifactPath,
    expect: 'pass',
    actorId: 'evaluator:delivery',
    artifactsDir: join(dir, 'artifacts'),
  });
  assert.equal(result.verdict, 'PASS');
  assert.ok(result.evidenceId);

  const fakeEvidenceReceipt = sampleReceipt(result.candidateHash, 'n1', { evidenceRefs: ['ev-fake'] });
  assert.throws(
    () => requestDelivery(db, runId, 'human', fakeEvidenceReceipt),
    (error: unknown) => error instanceof GateError && /kanıta bağlı değil/.test((error as Error).message),
  );

  const runState = (db.prepare('SELECT state FROM runs WHERE id=?').get(runId) as any).state;
  assert.notEqual(runState, 'ACCEPTED');
  db.close();
});

test('N2: test sonrası değişen içerik teslim kabul edilmez', () => {
  const { db, dir, runId, attemptId } = deliveryRig('delivery-n2');
  const artifactPath = join(dir, 'artifact.txt');
  writeFileSync(artifactPath, 'stable payload', 'utf8');

  const result = evaluateArtifact(db, {
    attemptId,
    artifactPath,
    expect: 'stable',
    actorId: 'evaluator:delivery',
    artifactsDir: join(dir, 'artifacts'),
  });
  assert.equal(result.verdict, 'PASS');
  assert.ok(result.evidenceId);

  writeFileSync(artifactPath, 'tampered payload', 'utf8');
  assert.throws(
    () => deliveryGate(db, runId, attemptId, artifactPath, result.candidateHash, result.evidenceId as string),
    /teslim edilen bayt test edilen bayt değil/,
  );

  const runState = (db.prepare('SELECT state FROM runs WHERE id=?').get(runId) as any).state;
  assert.notEqual(runState, 'ACCEPTED');
  db.close();
});
