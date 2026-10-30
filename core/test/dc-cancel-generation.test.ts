import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { openStore, recordCommand, reserveDispatch, appendEvent, setGlobalStop } from '../src/store.ts';
import { pollSentSessions, type WorkerAdapter, type SpawnResult } from '../src/dispatcher.ts';

const H64 = (value: string) => createHash('sha256').update(value).digest('hex');

class LookupAdapter implements WorkerAdapter {
  spawnCalls = 0;
  lookups = new Map<string, 'ALIVE' | 'DEAD' | 'UNKNOWN'>();
  async spawn(): Promise<SpawnResult> {
    this.spawnCalls++;
    return { outcome: 'OK', externalSessionId: 'session-cancel' };
  }
  async lookup(dispatchKey: string): Promise<'ALIVE' | 'DEAD' | 'UNKNOWN'> {
    return this.lookups.get(dispatchKey) ?? 'UNKNOWN';
  }
}

function twoAttemptStore(prefix: string) {
  const db = openStore();
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run(prefix + '-cap', 'h', 'r', H64(prefix + 'a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)')
    .run(prefix + '-plan', prefix + '-cap', 1, H64(prefix + 'b'), H64(prefix + 'e'), H64(prefix + 'p'), '{}');
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES(?,?,1,'READY','ph',0,2,4,100,0,0,'2026-12-31T00:00:00Z')`).run(prefix + '-run', prefix + '-plan');
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES(?,?, 'coder','[]','RUNNING')`).run(prefix + '-run', prefix + '-node1');
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES(?,?, 'coder','[]','RUNNING')`).run(prefix + '-run', prefix + '-node2');
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES(?,?,?,1,'RUNNING','ih',1)`)
    .run(prefix + '-att1', prefix + '-run', prefix + '-node1');
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES(?,?,?,2,'RUNNING','ih',1)`)
    .run(prefix + '-att2', prefix + '-run', prefix + '-node2');
  setGlobalStop(db, false, 'test', 'setup');
  const command = recordCommand(db, {
    kind: 'START_RUN',
    actorId: 'operator',
    runId: prefix + '-run',
    idempotencyKey: prefix + '-key',
    payload: { runId: prefix + '-run', planHash: H64(prefix + 'b'), idempotencyKey: prefix + '-key' },
  });
  reserveDispatch(db, { attemptId: prefix + '-att1', tokens: 40, commandId: command.commandId, dispatchKey: prefix + '-dk1' });
  reserveDispatch(db, { attemptId: prefix + '-att2', tokens: 40, commandId: command.commandId, dispatchKey: prefix + '-dk2' });
  return db;
}

const one = (db: any, sql: string, ...params: unknown[]) => db.prepare(sql).get(...params) as any;

function cancelRequest(db: any, prefix: string, attempt: 1 | 2) {
  appendEvent(db, {
    type: 'CANCEL_REQUESTED',
    actorId: 'operator',
    causationId: prefix + '-run',
    runId: prefix + '-run',
    attemptId: prefix + '-att' + attempt,
    payload: { runId: prefix + '-run', attemptId: prefix + '-att' + attempt, reason: 'test cancel' },
  });
  db.prepare("UPDATE attempts SET state='CANCEL_REQUESTED' WHERE id=?").run(prefix + '-att' + attempt);
}

function markSent(db: any, prefix: string) {
  db.prepare("UPDATE outbox SET status='SENT' WHERE dispatch_key=?").run(prefix + '-dk1');
  db.prepare("UPDATE outbox SET status='SENT' WHERE dispatch_key=?").run(prefix + '-dk2');
}

test('P1: her attempt ilgili guncel iptali kendi kanitiyla kapatir', async () => {
  const prefix = 'cancel-p1';
  const db = twoAttemptStore(prefix);
  cancelRequest(db, prefix, 1);
  cancelRequest(db, prefix, 2);
  markSent(db, prefix);
  const adapter = new LookupAdapter();
  adapter.lookups.set(prefix + '-dk1', 'DEAD');
  adapter.lookups.set(prefix + '-dk2', 'DEAD');
  const result = await pollSentSessions(db, adapter);
  assert.deepEqual(result.outcomes, ['dead-released', 'dead-released']);
  assert.equal(one(db, 'SELECT state FROM attempts WHERE id=?', prefix + '-att1').state, 'FAILED');
  assert.equal(one(db, 'SELECT state FROM attempts WHERE id=?', prefix + '-att2').state, 'FAILED');
  assert.equal(one(db, 'SELECT state FROM reservations WHERE attempt_id=?', prefix + '-att1').state, 'RELEASED');
  assert.equal(one(db, 'SELECT state FROM reservations WHERE attempt_id=?', prefix + '-att2').state, 'RELEASED');
  const confirmed = db.prepare("SELECT attempt_id FROM events WHERE type='CANCEL_CONFIRMED' ORDER BY rowid").all() as any[];
  assert.deepEqual(confirmed.map((row) => row.attempt_id), [prefix + '-att1', prefix + '-att2']);
});

test('N1: tek teyit ikinci attempti ortmez; yeni iptal acik kalir', async () => {
  const prefix = 'cancel-n1';
  const db = twoAttemptStore(prefix);
  cancelRequest(db, prefix, 1);
  cancelRequest(db, prefix, 2);
  markSent(db, prefix);
  const adapter = new LookupAdapter();
  adapter.lookups.set(prefix + '-dk1', 'DEAD');
  adapter.lookups.set(prefix + '-dk2', 'UNKNOWN');
  const result = await pollSentSessions(db, adapter);
  assert.deepEqual(result.outcomes, ['dead-released', 'still-unknown']);
  assert.equal(one(db, 'SELECT state FROM attempts WHERE id=?', prefix + '-att1').state, 'FAILED');
  assert.equal(one(db, 'SELECT state FROM attempts WHERE id=?', prefix + '-att2').state, 'CANCEL_REQUESTED');
  assert.equal(one(db, 'SELECT state FROM reservations WHERE attempt_id=?', prefix + '-att2').state, 'ACTIVE');
  assert.equal(one(db, 'SELECT COUNT(*) AS c FROM events WHERE type=? AND attempt_id=?', 'CANCEL_CONFIRMED', prefix + '-att2').c, 0);
});

test('N2: olum dogrulanamiyorsa slot ve rezerv hayalen birakilmaz', async () => {
  const prefix = 'cancel-n2';
  const db = twoAttemptStore(prefix);
  cancelRequest(db, prefix, 1);
  cancelRequest(db, prefix, 2);
  markSent(db, prefix);
  const adapter = new LookupAdapter();
  const result = await pollSentSessions(db, adapter);
  assert.deepEqual(result.outcomes, ['still-unknown', 'still-unknown']);
  assert.equal(one(db, 'SELECT state FROM attempts WHERE id=?', prefix + '-att1').state, 'CANCEL_REQUESTED');
  assert.equal(one(db, 'SELECT state FROM attempts WHERE id=?', prefix + '-att2').state, 'CANCEL_REQUESTED');
  assert.equal(one(db, 'SELECT state FROM reservations WHERE attempt_id=?', prefix + '-att1').state, 'ACTIVE');
  assert.equal(one(db, 'SELECT state FROM reservations WHERE attempt_id=?', prefix + '-att2').state, 'ACTIVE');
  assert.equal(one(db, 'SELECT COUNT(*) AS c FROM events WHERE type=?', 'CANCEL_CONFIRMED').c, 0);
});
