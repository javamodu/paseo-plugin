// K-0006 metrik çerçevesi v3.1 — A14 teslim-onayı bağı + 5 ana gösterge telemetrisi.
// Hermetik: canlı worker/LLM YOK. Kritik iddialar:
//  (a) insan ONAYSIZ teslim yok; aday değişince onay BAYAT (RED) → run ACCEPTED olamaz;
//  (b) güvenlik/doğruluk ihlali varsa hız "kazanç" SAYILMAZ (credited=false);
//  (c) usage-unknown maliyeti ASLA 0/bedava değil → "bilinmiyor"; ölçülemeyen "bilinmiyor".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStore, setGlobalStop, commitCandidate, recordEvidence, appendEvent } from '../src/store.ts';
import {
  createRunPlan, approvePlan, dispatchNode, ensureStartCommand, settleNodeOutcome,
  requestRepair, requestAcceptance, decideApproval,
} from '../src/supervisor.ts';
import { computeHeadlineKpis } from '../src/telemetry.ts';
import { sampleHandoff } from '../src/handoff.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

function fresh() {
  const db = openStore();
  setGlobalStop(db, false, 'op', 'acilis');
  const planHash = createRunPlan(db, {
    capsuleId: 'cap-1', goal: 'g', repoId: 'r', sourceCommit: H64('c'),
    runId: 'run-1', planId: 'plan-1', profileHash: H64('p'), nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 5,
  }).planHash;
  const startCmd = ensureStartCommand(db, 'run-1', planHash, 'operator');
  approvePlan(db, 'run-1', planHash, 'human');
  return { db, planHash, startCmd };
}
// n1'i baştan sona PASS'le: dispatch→freeze→kanıt→node DONE
function passNode(db: any, startCmd: string, key = 'k1') {
  const d = dispatchNode(db, 'run-1', 'n1', { tokens: 1000, startCommandId: startCmd, dispatchKey: key, handoff: sampleHandoff('n1') });
  commitCandidate(db, d.attemptId, 1, H64('a'), 'worker');
  const { evidenceId } = recordEvidence(db, { attemptId: d.attemptId, presentedFence: 1, artifactHash: H64('e'), storageRef: 's3://' + key, bytes: 8, environmentHash: H64('v'), evaluatorHash: H64('h'), exitCode: 0, verdict: 'PASS', testCount: 4, actorId: 'evaluator' });
  settleNodeOutcome(db, d.attemptId, 'PASS');
  return { attemptId: d.attemptId, evidenceId };
}

test('A14: insan ONAYSIZ teslim YOK — REJECTED karar run\'ı ACCEPTED yapmaz', () => {
  const { db, startCmd } = fresh();
  passNode(db, startCmd);
  const { approvalId } = requestAcceptance(db, 'run-1', 'core');
  assert.equal(decideApproval(db, approvalId, 'REJECTED', 'human', 1).status, 'NOT_APPROVED');
  assert.notEqual((db.prepare('SELECT state FROM runs WHERE id=?').get('run-1') as any).state, 'ACCEPTED');
  assert.equal(computeHeadlineKpis(db).verifiedDeliveries, 0);
});

test('A14: aday değişince onay BAYAT (RED) → kabul yok (run ACCEPTED olamaz)', () => {
  const { db, startCmd } = fresh();
  passNode(db, startCmd);
  const { approvalId } = requestAcceptance(db, 'run-1', 'core');
  db.prepare('UPDATE runs SET candidate_hash=? WHERE id=?').run(H64('b'), 'run-1'); // aday değişti
  assert.throws(() => decideApproval(db, approvalId, 'APPROVED', 'human', 1), /BAYAT/);
  assert.notEqual((db.prepare('SELECT state FROM runs WHERE id=?').get('run-1') as any).state, 'ACCEPTED');
});

test('mutlu yol: onaylı teslim → verifiedDeliveries=1, ihlalsiz, credited=true', () => {
  const { db, startCmd } = fresh();
  passNode(db, startCmd);
  const { approvalId } = requestAcceptance(db, 'run-1', 'core');
  assert.equal(decideApproval(db, approvalId, 'APPROVED', 'human', 1).status, 'ACCEPTED');
  const k = computeHeadlineKpis(db);
  assert.equal(k.verifiedDeliveries, 1);
  assert.deepEqual(k.criticalSafetyViolations, []);
  assert.equal(k.speed.credited, true);
  assert.equal(k.firstPassSuccessRate, 1); // ilk attempt (no=1) ACCEPTED
  assert.equal(k.postDeliveryRegressionSignals, 0);
  assert.equal(k.costPerAcceptedWork, 0); // bilinen kullanım=0 token (ölçülmüş, uydurma değil)
  assert.equal(k.humanInterventionsPerTask, 1); // operator START_RUN 1 komut / 1 run
});

test('güvenlik kapısı: onaysiz RUN_ACCEPTED → ihlal + hız kazanç DEĞİL (credited=false)', () => {
  const { db, startCmd } = fresh();
  const { evidenceId } = passNode(db, startCmd);
  db.prepare('UPDATE runs SET state=?, candidate_hash=? WHERE id=?').run('ACCEPTED', H64('a'), 'run-1');
  appendEvent(db, { type: 'RUN_ACCEPTED', actorId: 'core', causationId: 'x', runId: 'run-1', payload: { runId: 'run-1', candidateHash: H64('a'), evidenceId } });
  const k = computeHeadlineKpis(db);
  assert.equal(k.verifiedDeliveries, 1);
  assert.ok(k.criticalSafetyViolations.some((v) => /onaysiz-teslim/.test(v)));
  assert.equal(k.speed.credited, false); // teslim var ama güvenlik kapısı düştü → hız sayılmaz
});

test('kanitsiz-accept ihlali: PASS-evidence olmadan ACCEPTED attempt → yakalanır', () => {
  const { db, startCmd } = fresh();
  const d = dispatchNode(db, 'run-1', 'n1', { tokens: 1000, startCommandId: startCmd, dispatchKey: 'k1', handoff: sampleHandoff('n1') });
  db.prepare("UPDATE attempts SET state='ACCEPTED' WHERE id=?").run(d.attemptId); // kanitsiz
  const k = computeHeadlineKpis(db);
  assert.ok(k.criticalSafetyViolations.some((v) => /kanitsiz-accept/.test(v)));
  assert.equal(k.speed.credited, false);
});

test('usage-unknown ≠ bedava: kabul edilmiş koşuda kullanım belirsiz → maliyet "bilinmiyor"', () => {
  const { db, startCmd } = fresh();
  passNode(db, startCmd);
  const { approvalId } = requestAcceptance(db, 'run-1', 'core');
  decideApproval(db, approvalId, 'APPROVED', 'human', 1);
  db.prepare('UPDATE runs SET usage_unknown=1 WHERE state=?').run('ACCEPTED');
  const k = computeHeadlineKpis(db);
  assert.equal(k.costPerAcceptedWork, 'bilinmiyor');
  assert.equal(k.usageUnknownRuns, 1);
  assert.ok(k.unmeasurable.includes('maliyet/kabul'));
});

test('ilk-geçiş vs repair: onarimla geçen node firstPass=0 (attempt başarısıyla karışmaz)', () => {
  const { db, startCmd } = fresh();
  const d = dispatchNode(db, 'run-1', 'n1', { tokens: 1000, startCommandId: startCmd, dispatchKey: 'k1', handoff: sampleHandoff('n1') });
  settleNodeOutcome(db, d.attemptId, 'FAIL', 'sig'); // attempt1 FAIL
  const r = requestRepair(db, 'run-1', 'n1', 'sig', { tokens: 1000, startCommandId: startCmd, dispatchKey: 'k2', handoff: sampleHandoff('n1') });
  commitCandidate(db, r.attemptId, 1, H64('a'), 'worker');
  recordEvidence(db, { attemptId: r.attemptId, presentedFence: 1, artifactHash: H64('e'), storageRef: 's3://r', bytes: 8, environmentHash: H64('v'), evaluatorHash: H64('h'), exitCode: 0, verdict: 'PASS', testCount: 2, actorId: 'evaluator' });
  settleNodeOutcome(db, r.attemptId, 'PASS');
  const k = computeHeadlineKpis(db);
  assert.equal(k.firstPassSuccessRate, 0); // ilk attempt ACCEPTED değil
  assert.ok(k.postDeliveryRegressionSignals >= 1); // no>1 attempt + ACCEPTED mevcut
});

test('boş defter: her şey "bilinmiyor"/0 — uydurma sayı YOK (Y5)', () => {
  const k = computeHeadlineKpis(openStore());
  assert.equal(k.verifiedDeliveries, 0);
  assert.equal(k.firstPassSuccessRate, 'bilinmiyor');
  assert.equal(k.costPerAcceptedWork, 'bilinmiyor');
  assert.equal(k.humanInterventionsPerTask, 'bilinmiyor');
  assert.equal(k.speed.acceptedPerHour, 'bilinmiyor');
  assert.equal(k.subagentUsage, 'yok');
  assert.deepEqual(k.criticalSafetyViolations, []);
  assert.ok(k.unmeasurable.length >= 4);
});
