// ordu-v3 S1 supervisor — hermetik kanıt. Canlı worker/LLM YOK (NOT_RUN).
// Kanıtlanan iddialar: A03 onay-yoksa-dispatch-yok, A01 bagimlilik sirasi,
// A02 plan donmus + degistirilemez, A04 attempt kimligi number'a bagli,
// A10 PASS yalniz CANDIDATE_FROZEN uzerinde, A12 bounded repair (≤max_attempts),
// A24 WAIT_CAPACITY reserve YAKMAZ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStore, setGlobalStop, commitCandidate, recordEvidence, GateError } from '../src/store.ts';
import {
  createRunPlan, approvePlan, readyNodes, dispatchNode, settleNodeOutcome,
  requestRepair, allNodesDone, ensureStartCommand, planHashOf, type PlanNode,
} from '../src/supervisor.ts';
import { sampleHandoff } from '../src/handoff.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

// 2-node zincir: n2 ← n1
function rig(nodes: PlanNode[] = [{ id: 'n1', role: 'coder', deps: [] }, { id: 'n2', role: 'tester', deps: ['n1'] }], maxWorkers = 5) {
  const db = openStore();
  setGlobalStop(db, false, 'operator', 'test acilis');
  const planHash = createRunPlan(db, {
    capsuleId: 'cap-1', goal: 'target', repoId: 'repo', sourceCommit: H64('c'),
    runId: 'run-1', planId: 'plan-1', profileHash: H64('p'), nodes, maxWorkers,
  }).planHash;
  return { db, planHash, startCmd: ensureStartCommand(db, 'run-1', planHash, 'operator') };
}
const opt = (startCmd: string, key: string) => ({ tokens: 1000, startCommandId: startCmd, dispatchKey: key, handoff: sampleHandoff('n') });

test('A03: plan onaylanmadan HICBIR dispatch yok (readyNodes bos + dispatch RED)', () => {
  const { db, startCmd } = rig();
  assert.deepEqual(readyNodes(db, 'run-1'), []);
  assert.throws(() => dispatchNode(db, 'run-1', 'n1', opt(startCmd, 'k0')), /A03/);
});

test('A01: bagimlilik zinciri — n2 ancak n1 DONE olunca acilir', () => {
  const { db, planHash, startCmd } = rig();
  approvePlan(db, 'run-1', planHash, 'human');
  assert.deepEqual(readyNodes(db, 'run-1'), ['n1']);
  const d1 = dispatchNode(db, 'run-1', 'n1', opt(startCmd, 'k1'));
  assert.equal(d1.status, 'DISPATCHED');
  // n2 henuz bagimlisi bitmedi → dispatch RED
  assert.throws(() => dispatchNode(db, 'run-1', 'n2', opt(startCmd, 'k2')), /A01/);
  // n1'i tamamla: freeze → PASS kanit → ACCEPTED
  commitCandidate(db, d1.attemptId, 1, H64('a'), 'worker');
  recordEvidence(db, { attemptId: d1.attemptId, presentedFence: 1, artifactHash: H64('e'), storageRef: 's3://e1', bytes: 10, environmentHash: H64('v'), evaluatorHash: H64('h'), exitCode: 0, verdict: 'PASS', testCount: 3, actorId: 'evaluator' });
  assert.equal(settleNodeOutcome(db, d1.attemptId, 'PASS').status, 'NODE_DONE');
  assert.deepEqual(readyNodes(db, 'run-1'), ['n2']);
});

test('A02: plan hash deterministik + plans satiri degistirilemez (freeze)', () => {
  const nodes: PlanNode[] = [{ id: 'n1', role: 'coder', deps: [] }];
  assert.equal(planHashOf(nodes), planHashOf(nodes)); // kararli
  assert.notEqual(planHashOf(nodes), planHashOf([{ id: 'n1', role: 'tester', deps: [] }])); // role hassas
  const { db } = rig(nodes);
  assert.throws(() => db.prepare('UPDATE plans SET payload_json=? WHERE id=?').run('{}', 'plan-1'), /immutable_plan/);
});

test('A04: ayni node iki attempt farkli input_hash (number bagliligi)', () => {
  const { db, planHash, startCmd } = rig([{ id: 'n1', role: 'coder', deps: [] }]);
  approvePlan(db, 'run-1', planHash, 'human');
  const a1 = dispatchNode(db, 'run-1', 'n1', opt(startCmd, 'k1'));
  settleNodeOutcome(db, a1.attemptId, 'FAIL', 'sig-x');
  const r = requestRepair(db, 'run-1', 'n1', 'sig-x', opt(startCmd, 'k2'));
  assert.equal(r.status, 'DISPATCHED');
  assert.equal(r.number, 2);
  const h = (id: string) => (db.prepare('SELECT input_hash FROM attempts WHERE id=?').get(id) as any).input_hash;
  assert.notEqual(h(a1.attemptId), h((r as any).attemptId));
});

test('A10: PASS yalniz CANDIDATE_FROZEN attempt uzerinde (freeze-oncesi reddedilir)', () => {
  const { db, planHash, startCmd } = rig([{ id: 'n1', role: 'coder', deps: [] }]);
  approvePlan(db, 'run-1', planHash, 'human');
  const d1 = dispatchNode(db, 'run-1', 'n1', opt(startCmd, 'k1'));
  assert.throws(() => settleNodeOutcome(db, d1.attemptId, 'PASS'), GateError); // RUNNING → PASS olamaz
});

test('A12: bounded repair — max_attempts dolunca NEEDS_DECISION (sonsuz dongu yok)', () => {
  const { db, planHash, startCmd } = rig([{ id: 'n1', role: 'coder', deps: [] }], 5);
  approvePlan(db, 'run-1', planHash, 'human');
  let r: any = dispatchNode(db, 'run-1', 'n1', opt(startCmd, 'k1'));
  for (let i = 2; i <= 3; i++) {
    settleNodeOutcome(db, r.attemptId, 'FAIL', 'sig');
    r = requestRepair(db, 'run-1', 'n1', 'sig', opt(startCmd, 'kr' + i));
    assert.equal(r.status, 'DISPATCHED');
    assert.equal(r.number, i);
  }
  settleNodeOutcome(db, r.attemptId, 'FAIL', 'sig');
  const stop = requestRepair(db, 'run-1', 'n1', 'sig', opt(startCmd, 'kr4'));
  assert.equal(stop.status, 'NEEDS_DECISION');
  const cnt = (db.prepare('SELECT COUNT(*) AS c FROM attempts WHERE run_id=? AND node_id=?').get('run-1', 'n1') as any).c;
  assert.equal(cnt, 3); // 1 ilk + 2 repair, 4. deneme YOK
});

test('A24: WAIT_CAPACITY reserve YAKMAZ — slot dolunca node PENDING kalir + kanit', () => {
  const { db, planHash, startCmd } = rig([{ id: 'n1', role: 'coder', deps: [] }, { id: 'n3', role: 'coder', deps: [] }], 5);
  db.prepare('UPDATE settings SET max_workers=1 WHERE id=1').run(); // global tavani 1'e indir
  approvePlan(db, 'run-1', planHash, 'human');
  const d1 = dispatchNode(db, 'run-1', 'n1', opt(startCmd, 'k1'));
  assert.equal(d1.status, 'DISPATCHED');
  const w = dispatchNode(db, 'run-1', 'n3', opt(startCmd, 'k3'));
  assert.equal(w.status, 'WAIT_CAPACITY');
  assert.equal(nodeState(db, 'n3'), 'PENDING');
  assert.equal((db.prepare('SELECT COUNT(*) AS c FROM attempts WHERE node_id=?').get('n3') as any).c, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS c FROM reservations WHERE state='ACTIVE'").get() as any).c, 1); // n1 reserve durur, n3 YAKMADI
  assert.ok((db.prepare("SELECT COUNT(*) AS c FROM events WHERE type='CAPACITY_WAIT'").get() as any).c >= 1);
});

test('olay serisi: CAPSULE→PLAN_PROPOSED→RUN_CREATED ve tum node DONE → allNodesDone', () => {
  const { db, planHash, startCmd } = rig();
  const seq = (t: string) => (db.prepare('SELECT COUNT(*) AS c FROM events WHERE type=? AND run_id=?').get(t, 'run-1') as any).c;
  assert.equal((db.prepare('SELECT COUNT(*) AS c FROM events WHERE type=?').get('CAPSULE_CREATED') as any).c, 1); // kapsül run-kapsami degil (run_id null)
  assert.equal(seq('RUN_CREATED'), 1);
  approvePlan(db, 'run-1', planHash, 'human');
  for (const [nid, key, depDone] of [['n1', 'k1', false], ['n2', 'k2', true]] as any) {
    const d = dispatchNode(db, 'run-1', nid, opt(startCmd, key));
    commitCandidate(db, d.attemptId, 1, H64('a'), 'worker');
    recordEvidence(db, { attemptId: d.attemptId, presentedFence: 1, artifactHash: H64('e' + nid), storageRef: 's3://' + nid, bytes: 10, environmentHash: H64('v'), evaluatorHash: H64('h'), exitCode: 0, verdict: 'PASS', testCount: 2, actorId: 'evaluator' });
    settleNodeOutcome(db, d.attemptId, 'PASS');
    void depDone;
  }
  assert.ok(allNodesDone(db, 'run-1'));
});

function nodeState(db: any, id: string) {
  return (db.prepare('SELECT state FROM nodes WHERE run_id=? AND id=?').get('run-1', id) as any).state;
}
