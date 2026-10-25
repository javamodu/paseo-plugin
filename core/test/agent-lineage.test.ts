// D4 dış agent kimlik zinciri — TEK sorgu, gerçek DB satırları üzerinden. Hermetik:
// canlı Paseo/subagent YOK; zincir halkaları mevcut tablolarda simüle edilir. Kritik
// iddia: unknown-usage ≠ bedava; zincir eksikse "complete" FALSE (uydurma izlenebilirlik yok).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStore, setGlobalStop, commitCandidate, recordEvidence } from '../src/store.ts';
import {
  createRunPlan, approvePlan, dispatchNode, ensureStartCommand, settleNodeOutcome,
} from '../src/supervisor.ts';
import { sampleHandoff } from '../src/handoff.ts';
import { traceLineage, deriveRuntime } from '../src/agent-lineage.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

function rig() {
  const db = openStore();
  setGlobalStop(db, false, 'op', 'acilis');
  const planHash = createRunPlan(db, {
    capsuleId: 'cap-1', goal: 'g', repoId: 'r', sourceCommit: H64('c'),
    runId: 'run-1', planId: 'plan-1', profileHash: H64('p'), nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 5,
  }).planHash;
  const startCmd = ensureStartCommand(db, 'run-1', planHash, 'operator');
  approvePlan(db, 'run-1', planHash, 'human');
  const d = dispatchNode(db, 'run-1', 'n1', { tokens: 1000, startCommandId: startCmd, dispatchKey: 'k1', handoff: sampleHandoff('n1') });
  return { db, attemptId: d.attemptId };
}

test('deriveRuntime: önek → tur; öneksiz/null → bilinmiyor (uydurma yok)', () => {
  assert.equal(deriveRuntime('paseo:abc'), 'paseo');
  assert.equal(deriveRuntime('local:abc'), 'local');
  assert.equal(deriveRuntime('sealsomething'), 'bilinmiyor');
  assert.equal(deriveRuntime(null), 'bilinmiyor');
});

test('tam zincir: session+command+reservation+PASS+events → complete, parent+runtime+cost bağlı', () => {
  const { db, attemptId } = rig();
  db.prepare("UPDATE attempts SET external_session_id='paseo:sess-42', lease_owner='w1' WHERE id=?").run(attemptId);
  commitCandidate(db, attemptId, 1, H64('a'), 'worker');
  recordEvidence(db, { attemptId, presentedFence: 1, artifactHash: H64('e'), storageRef: 's3://k1', bytes: 8, environmentHash: H64('v'), evaluatorHash: H64('h'), exitCode: 0, verdict: 'PASS', testCount: 4, actorId: 'evaluator' });
  settleNodeOutcome(db, attemptId, 'PASS');
  const lin = traceLineage(db, attemptId);
  assert.deepEqual(lin.gaps, [], 'tüm halkalar bağlı');
  assert.equal(lin.complete, true);
  assert.equal(lin.runtimeKind, 'paseo');
  assert.equal(lin.externalSessionId, 'paseo:sess-42');
  assert.equal(lin.parentActorId, 'operator', 'üst/yönetici aktör command zincirinden');
  assert.equal(lin.attemptState, 'ACCEPTED');
  assert.equal(lin.reservation?.state, 'SETTLED');
  assert.equal(lin.usageUnknown, false);
  assert.equal(lin.costAttribution, 1000, 'ölçülebilir kullanım = rezerve token');
  assert.ok(lin.evidence.some((e) => e.verdict === 'PASS'));
  assert.ok(lin.events.length > 0, 'olay izi mevcut');
});

test('kopuk zincir: session bağlı değilse → gap + complete FALSE (sahte izlenebilirlik YOK)', () => {
  const { db, attemptId } = rig(); // external_session_id NULL, kanıt yok
  const lin = traceLineage(db, attemptId);
  assert.equal(lin.complete, false);
  assert.ok(lin.gaps.some((g) => /dis-oturum-kimligi/.test(g)));
  assert.ok(lin.gaps.some((g) => /kanit-yok/.test(g)));
  assert.equal(lin.runtimeKind, 'bilinmiyor');
});

test('unknown-usage ≠ bedava: run.usage_unknown=1 → cost bilinmiyor + gap', () => {
  const { db, attemptId } = rig();
  db.prepare("UPDATE attempts SET external_session_id='paseo:s1' WHERE id=?").run(attemptId);
  commitCandidate(db, attemptId, 1, H64('a'), 'worker');
  recordEvidence(db, { attemptId, presentedFence: 1, artifactHash: H64('e'), storageRef: 's3://k1', bytes: 8, environmentHash: H64('v'), evaluatorHash: H64('h'), exitCode: 0, verdict: 'PASS', testCount: 4, actorId: 'evaluator' });
  settleNodeOutcome(db, attemptId, 'PASS');
  db.prepare('UPDATE runs SET usage_unknown=1 WHERE id=?').run('run-1');
  const lin = traceLineage(db, attemptId);
  assert.equal(lin.usageUnknown, true);
  assert.equal(lin.costAttribution, 'bilinmiyor', 'ölçülemeyen maliyet ASLA 0/bedava değil');
  assert.ok(lin.gaps.some((g) => /run-kullanimi-olculemedi/.test(g)));
});

test('reservation UNKNOWN → kullanım doğrulanamadı gap + cost bilinmiyor', () => {
  const { db, attemptId } = rig();
  db.prepare("UPDATE attempts SET external_session_id='local:w' WHERE id=?").run(attemptId);
  db.prepare("UPDATE reservations SET state='UNKNOWN' WHERE attempt_id=?").run(attemptId);
  const lin = traceLineage(db, attemptId);
  assert.equal(lin.usageUnknown, true);
  assert.equal(lin.costAttribution, 'bilinmiyor');
  assert.ok(lin.gaps.some((g) => /UNKNOWN/.test(g)));
});
