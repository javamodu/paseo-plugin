import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { openStore, recordCommand, reserveDispatch, setGlobalStop } from '../src/store.ts';
import { processOutbox, reconcileUnknown, pollSentSessions, type WorkerAdapter, type SpawnResult } from '../src/dispatcher.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

class CountingAdapter implements WorkerAdapter {
  spawnCalls = 0;
  private readonly status: 'ALIVE' | 'DEAD' | 'UNKNOWN';
  constructor(status: 'ALIVE' | 'DEAD' | 'UNKNOWN') {
    this.status = status;
  }
  async spawn(): Promise<SpawnResult> {
    this.spawnCalls++;
    return { outcome: 'OK', externalSessionId: 'ses-maintenance' };
  }
  async lookup(): Promise<'ALIVE' | 'DEAD' | 'UNKNOWN'> {
    return this.status;
  }
}

function seeded(dbPath: string, outboxStatus: 'PENDING' | 'UNKNOWN' | 'SENT') {
  const db = openStore(dbPath);
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'h', 'r', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)')
    .run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), '{}');
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-1','plan-1',1,'READY','ph',0,1,3,100,0,0,'2099-01-01T00:00:00Z')`).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1','n-1','coder','[]','READY')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`).run();
  setGlobalStop(db, false, 'test', 'kurulum');
  const command = recordCommand(db, {
    kind: 'START_RUN',
    actorId: 'operator',
    runId: 'run-1',
    idempotencyKey: 'k-1',
    payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: 'k-1' },
  });
  reserveDispatch(db, { attemptId: 'att-1', tokens: 50, commandId: command.commandId, dispatchKey: 'dk-1' });
  db.prepare('UPDATE outbox SET status=? WHERE dispatch_key=?').run(outboxStatus, 'dk-1');
  if (outboxStatus === 'UNKNOWN') {
    db.prepare("UPDATE reservations SET state='UNKNOWN' WHERE attempt_id='att-1'").run();
  }
  if (outboxStatus === 'SENT') {
    db.prepare("UPDATE attempts SET external_session_id='ses-1' WHERE id='att-1'").run();
  }
  return { db, commandId: command.commandId };
}

test('P1: STOP altinda uzlastirma ve SENT poll surer, yeni spawn olmaz; restart mandali korunur', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dc-stop-maintenance-'));
  const dbPath = join(dir, 'store.sqlite');
  const { db } = seeded(dbPath, 'UNKNOWN');
  setGlobalStop(db, true, 'operator', 'bakim');
  const adapter = new CountingAdapter('DEAD');
  const blocked = await processOutbox(db, adapter);
  assert.deepEqual(blocked, { blocked: 'global_stop', processed: 0 });
  assert.equal(adapter.spawnCalls, 0, 'STOP altinda yeni spawn YOK');

  const reconciled = await reconcileUnknown(db, adapter);
  assert.deepEqual(reconciled.outcomes, ['dead-released']);
  assert.equal((db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'DEAD_CONFIRMED');
  assert.equal((db.prepare("SELECT state FROM reservations WHERE attempt_id='att-1'").get() as any).state, 'RELEASED');
  assert.equal((db.prepare("SELECT state FROM attempts WHERE id='att-1'").get() as any).state, 'FAILED');

  db.close();
  const reopened = openStore(dbPath);
  assert.equal((reopened.prepare('SELECT dispatch_paused FROM settings WHERE id=1').get() as any).dispatch_paused, 1, 'restart mandali korunur');
  const stillBlocked = await processOutbox(reopened, new CountingAdapter('DEAD'));
  assert.deepEqual(stillBlocked, { blocked: 'global_stop', processed: 0 });
  reopened.close();
  rmSync(dir, { recursive: true, force: true });
});

test('P1: STOP altinda SENT oturum da bakimla kapanir', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dc-stop-sent-'));
  const dbPath = join(dir, 'store.sqlite');
  const { db } = seeded(dbPath, 'SENT');
  setGlobalStop(db, true, 'operator', 'bakim');
  const adapter = new CountingAdapter('DEAD');
  const polled = await pollSentSessions(db, adapter);
  assert.deepEqual(polled.outcomes, ['dead-released']);
  assert.equal((db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'DEAD_CONFIRMED');
  assert.equal((db.prepare("SELECT state FROM reservations WHERE attempt_id='att-1'").get() as any).state, 'RELEASED');
  assert.equal((db.prepare("SELECT state FROM attempts WHERE id='att-1'").get() as any).state, 'FAILED');
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

test('N1: insan karti ve kirmizi probe bakim teyidini engellemez', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dc-stop-card-'));
  const dbPath = join(dir, 'store.sqlite');
  const { db } = seeded(dbPath, 'UNKNOWN');
  db.prepare(`INSERT INTO approvals(id,run_id,plan_hash,candidate_hash,policy_hash,expected_run_version,action,expires_at,decision)
    VALUES('ap-1','run-1',?,?,?,1,'ACCEPT_RESULT','2099-01-01 00:00:00','PENDING')`)
    .run(H64('b'), H64('c'), H64('p'));
  setGlobalStop(db, true, 'operator', 'bakim');
  const adapter = new CountingAdapter('DEAD');
  const reconciled = await reconcileUnknown(db, adapter);
  assert.deepEqual(reconciled.outcomes, ['dead-released']);
  assert.equal((db.prepare("SELECT decision FROM approvals WHERE id='ap-1'").get() as any).decision, 'PENDING', 'kart acilmasi bakimi bloke etmez');
  assert.equal((db.prepare("SELECT state FROM reservations WHERE attempt_id='att-1'").get() as any).state, 'RELEASED');
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

test('N1: kirmizi probe bakim-okuma ve teyit yolunu engellemez', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dc-stop-red-probe-'));
  const dbPath = join(dir, 'store.sqlite');
  const { db } = seeded(dbPath, 'UNKNOWN');
  setGlobalStop(db, true, 'operator', 'bakim');
  const redProbeAdapter = new CountingAdapter('DEAD');
  const reconciled = await reconcileUnknown(db, redProbeAdapter);
  assert.deepEqual(reconciled.outcomes, ['dead-released']);
  assert.equal((db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'DEAD_CONFIRMED');
  assert.equal((db.prepare("SELECT state FROM reservations WHERE attempt_id='att-1'").get() as any).state, 'RELEASED');
  assert.equal(redProbeAdapter.spawnCalls, 0, 'kırmızı probe altında yeni spawn YOK');
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

test('N2: belirsiz sahiplik hayali serbest birakma uretmez', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dc-stop-unknown-'));
  const dbPath = join(dir, 'store.sqlite');
  const { db } = seeded(dbPath, 'UNKNOWN');
  setGlobalStop(db, true, 'operator', 'bakim');
  const adapter = new CountingAdapter('UNKNOWN');
  const reconciled = await reconcileUnknown(db, adapter);
  assert.deepEqual(reconciled.outcomes, ['still-unknown']);
  assert.equal((db.prepare("SELECT state FROM reservations WHERE attempt_id='att-1'").get() as any).state, 'UNKNOWN');
  assert.equal((db.prepare("SELECT state FROM attempts WHERE id='att-1'").get() as any).state, 'RUNNING');
  assert.equal((db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'UNKNOWN');
  db.close();
  rmSync(dir, { recursive: true, force: true });
});
