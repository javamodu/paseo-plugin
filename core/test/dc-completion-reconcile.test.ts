import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { openStore, recordCommand, reserveDispatch, setGlobalStop, commitCandidate, recordEvidence } from '../src/store.ts';
import { processOutbox, reconcileUnknown, type WorkerAdapter, type SpawnResult } from '../src/dispatcher.ts';
import { settleNodeOutcome, requestAcceptance } from '../src/supervisor.ts';

const H64 = (value: string) => createHash('sha256').update(value).digest('hex');

class QuietAdapter implements WorkerAdapter {
  spawnCalls = 0;
  lookups = new Map<string, 'ALIVE' | 'DEAD' | 'UNKNOWN'>();
  async spawn(): Promise<SpawnResult> {
    this.spawnCalls++;
    return { outcome: 'OK', externalSessionId: 'session-normal' };
  }
  async lookup(dispatchKey: string): Promise<'ALIVE' | 'DEAD' | 'UNKNOWN'> {
    return this.lookups.get(dispatchKey) ?? 'UNKNOWN';
  }
}

function storeWithRun(prefix: string) {
  const db = openStore();
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run(prefix + '-cap', 'h', 'r', H64(prefix + 'a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)')
    .run(prefix + '-plan', prefix + '-cap', 1, H64(prefix + 'b'), H64(prefix + 'e'), H64(prefix + 'p'), '{}');
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES(?,?,1,'READY','ph',0,1,3,100,0,0,'2026-12-31T00:00:00Z')`).run(prefix + '-run', prefix + '-plan');
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES(?,?, 'coder','[]','RUNNING')`).run(prefix + '-run', prefix + '-node');
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES(?,?,?,1,'RUNNING','ih',1)`)
    .run(prefix + '-att', prefix + '-run', prefix + '-node');
  setGlobalStop(db, false, 'test', 'setup');
  const command = recordCommand(db, {
    kind: 'START_RUN',
    actorId: 'operator',
    runId: prefix + '-run',
    idempotencyKey: prefix + '-key',
    payload: { runId: prefix + '-run', planHash: H64(prefix + 'b'), idempotencyKey: prefix + '-key' },
  });
  reserveDispatch(db, { attemptId: prefix + '-att', tokens: 50, commandId: command.commandId, dispatchKey: prefix + '-dk' });
  return db;
}

const one = (db: any, sql: string, ...params: unknown[]) => db.prepare(sql).get(...params) as any;

test('P1: normal bitis hazir adayi dogrulamaya birakir', async () => {
  const db = storeWithRun('normal');
  const adapter = new QuietAdapter();
  await processOutbox(db, adapter);
  commitCandidate(db, 'normal-att', 1, H64('normal-candidate'), 'worker');
  recordEvidence(db, {
    attemptId: 'normal-att',
    presentedFence: 1,
    artifactHash: H64('normal-artifact'),
    storageRef: 'temp://normal-artifact',
    bytes: 12,
    environmentHash: H64('normal-env'),
    evaluatorHash: H64('normal-evaluator'),
    exitCode: 0,
    verdict: 'PASS',
    testCount: 2,
    actorId: 'evaluator',
  });
  const outcome = settleNodeOutcome(db, 'normal-att', 'PASS');
  assert.equal(outcome.status, 'NODE_DONE');
  const acceptance = requestAcceptance(db, 'normal-run', 'operator');
  assert.equal(one(db, "SELECT state FROM attempts WHERE id='normal-att'").state, 'ACCEPTED');
  assert.equal(one(db, "SELECT state FROM nodes WHERE id='normal-node'").state, 'DONE');
  assert.equal(one(db, "SELECT state FROM reservations WHERE attempt_id='normal-att'").state, 'SETTLED');
  assert.equal(one(db, "SELECT state FROM runs WHERE id='normal-run'").state, 'VERIFYING');
  assert.equal(one(db, 'SELECT decision FROM approvals WHERE id=?', acceptance.approvalId).decision, 'PENDING');
});

test('N1: lease ve sessizlik tek basina iptal/kapasite birakma dogurmaz', async () => {
  const db = storeWithRun('silent');
  const adapter = new QuietAdapter();
  await processOutbox(db, adapter);
  db.prepare("UPDATE attempts SET lease_until='2000-01-01T00:00:00.000Z' WHERE id='silent-att'").run();
  db.prepare("UPDATE outbox SET status='UNKNOWN' WHERE dispatch_key='silent-dk'").run();
  db.prepare("UPDATE reservations SET state='UNKNOWN' WHERE attempt_id='silent-att'").run();
  const result = await reconcileUnknown(db, adapter);
  assert.deepEqual(result.outcomes, ['still-unknown']);
  assert.equal(one(db, "SELECT state FROM reservations WHERE attempt_id='silent-att'").state, 'UNKNOWN');
  assert.equal(one(db, "SELECT state FROM attempts WHERE id='silent-att'").state, 'RUNNING');
  assert.equal(one(db, "SELECT COUNT(*) AS c FROM events WHERE type='CANCEL_CONFIRMED'").c, 0);
});

test('N2: uzlastirma ayni sonuc icin cift kayit veya yeniden spawn uretmez', async () => {
  const db = storeWithRun('idempotent');
  const adapter = new QuietAdapter();
  await processOutbox(db, adapter);
  db.prepare("UPDATE outbox SET status='UNKNOWN' WHERE dispatch_key='idempotent-dk'").run();
  const first = await reconcileUnknown(db, adapter);
  const eventCount = one(db, 'SELECT COUNT(*) AS c FROM events').c;
  const reservationState = one(db, "SELECT state FROM reservations WHERE attempt_id='idempotent-att'").state;
  const second = await reconcileUnknown(db, adapter);
  assert.deepEqual(first.outcomes, second.outcomes);
  assert.equal(one(db, 'SELECT COUNT(*) AS c FROM events').c, eventCount);
  assert.equal(one(db, "SELECT state FROM reservations WHERE attempt_id='idempotent-att'").state, reservationState);
  assert.equal(adapter.spawnCalls, 1);
  const third = await processOutbox(db, adapter);
  assert.ok(third.idle);
  assert.equal(adapter.spawnCalls, 1);
});
