import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { DatabaseSync } from 'node:sqlite';

import { openStore, recordCommand, reserveDispatch, setGlobalStop, takeLease } from '../src/store.ts';
import { processOutbox, type WorkerAdapter, type SpawnResult } from '../src/dispatcher.ts';
import { assertAltAjanGorunur } from '../src/r8.ts';
import { assertDispatchOpen } from '../src/deadline.ts';
import { assertGrantDispatchable, createGrant, revokeGrant } from '../src/grants.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);
const FIXED_NOW = () => new Date('2026-10-30T00:00:00.000Z');

function rigged() {
  const db = openStore();
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
  return { db, commandId: command.commandId };
}

class SuccessfulAdapter implements WorkerAdapter {
  async spawn(): Promise<SpawnResult> {
    return { outcome: 'OK', externalSessionId: 'ses-before-effect' };
  }
  async lookup(): Promise<'ALIVE' | 'DEAD' | 'UNKNOWN'> {
    return 'UNKNOWN';
  }
}

class RacingAdapter implements WorkerAdapter {
  private readonly db: DatabaseSync;
  constructor(db: DatabaseSync) {
    this.db = db;
  }
  async spawn(): Promise<SpawnResult> {
    takeLease(this.db, 'att-1', 'new-owner', '2099-01-01T00:00:00Z');
    return { outcome: 'OK', externalSessionId: 'ses-race' };
  }
  async lookup(): Promise<'ALIVE' | 'DEAD' | 'UNKNOWN'> {
    return 'UNKNOWN';
  }
}

type GuardDecision =
  | { outcome: 'ALLOW' }
  | { outcome: 'FATAL'; reason: string };

function beforeExternalEffect(
  db: DatabaseSync,
  input: { dispatchKey: string; attemptId: string },
  now: () => Date = FIXED_NOW,
): GuardDecision {
  const outbox = db.prepare('SELECT command_id,fencing_token FROM outbox WHERE dispatch_key=?').get(input.dispatchKey) as any;
  const attempt = db.prepare('SELECT run_id,node_id,state,fencing_token,grant_id FROM attempts WHERE id=?').get(input.attemptId) as any;
  const run = db.prepare('SELECT state,dispatch_paused,spent_tokens,max_reserved_tokens,deadline_at FROM runs WHERE id=?').get(attempt.run_id) as any;
  const reservation = db.prepare('SELECT tokens,state FROM reservations WHERE attempt_id=?').get(input.attemptId) as any;
  const globalStop = (db.prepare('SELECT dispatch_paused FROM settings WHERE id=1').get() as any).dispatch_paused === 1;

  if (globalStop) return { outcome: 'FATAL', reason: 'global stop latch is closed' };
  if (run.dispatch_paused === 1) return { outcome: 'FATAL', reason: 'run dispatch latch is closed' };
  if (run.state !== 'READY' && run.state !== 'RUNNING') return { outcome: 'FATAL', reason: 'run state is not dispatchable' };
  if (attempt.state !== 'RUNNING') return { outcome: 'FATAL', reason: 'attempt is not running' };
  if (attempt.fencing_token !== outbox.fencing_token) return { outcome: 'FATAL', reason: 'fence is stale' };
  if (reservation.state !== 'ACTIVE') return { outcome: 'FATAL', reason: 'reservation is not active' };
  if (run.spent_tokens + reservation.tokens > run.max_reserved_tokens) {
    return { outcome: 'FATAL', reason: 'run token budget is exhausted' };
  }

  try {
    assertAltAjanGorunur(db, { runId: attempt.run_id, nodeId: attempt.node_id, commandId: outbox.command_id, tokens: reservation.tokens });
    assertDispatchOpen(db, attempt.run_id, now);
    if (attempt.grant_id) assertGrantDispatchable(db, attempt.grant_id, attempt.run_id);
  } catch (error) {
    return { outcome: 'FATAL', reason: error instanceof Error ? error.message : String(error) };
  }
  return { outcome: 'ALLOW' };
}

class GuardedAdapter implements WorkerAdapter {
  externalSpawnCount = 0;
  private readonly db: DatabaseSync;
  private readonly next: WorkerAdapter;
  private readonly now: () => Date;
  constructor(db: DatabaseSync, next: WorkerAdapter, now: () => Date = FIXED_NOW) {
    this.db = db;
    this.next = next;
    this.now = now;
  }
  async spawn(input: { dispatchKey: string; attemptId: string }): Promise<SpawnResult> {
    const decision = beforeExternalEffect(this.db, input, this.now);
    if (decision.outcome !== 'ALLOW') return decision;
    this.externalSpawnCount++;
    return this.next.spawn(input);
  }
  async lookup(dispatchKey: string): Promise<'ALIVE' | 'DEAD' | 'UNKNOWN'> {
    return this.next.lookup(dispatchKey);
  }
}

test('P1: gecerli kuyruk isi guvenlik zincirinden tam olarak bir kez gonderilir', async () => {
  const { db } = rigged();
  const adapter = new GuardedAdapter(db, new SuccessfulAdapter());
  const result = await processOutbox(db, adapter, { now: FIXED_NOW });
  assert.equal(result.result, 'bound');
  assert.equal(adapter.externalSpawnCount, 1);
  assert.equal((db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'SENT');
  assert.equal((db.prepare("SELECT external_session_id FROM attempts WHERE id='att-1'").get() as any).external_session_id, 'ses-before-effect');
  const again = await processOutbox(db, adapter, { now: FIXED_NOW });
  assert.equal(again.idle, true);
  assert.equal(adapter.externalSpawnCount, 1, 'ayni is icin ikinci dis etki YOK');
});

test('N1: global STOP ve run latch kapatikken spawn sayisi 0 olur', async () => {
  const global = rigged();
  setGlobalStop(global.db, true, 'operator', 'acil');
  const globalAdapter = new GuardedAdapter(global.db, new SuccessfulAdapter());
  const globalResult = await processOutbox(global.db, globalAdapter, { now: FIXED_NOW });
  assert.deepEqual(globalResult, { blocked: 'global_stop', processed: 0 });
  assert.equal(globalAdapter.externalSpawnCount, 0);

  const run = rigged();
  run.db.prepare('UPDATE runs SET dispatch_paused=1 WHERE id=?').run('run-1');
  const runAdapter = new GuardedAdapter(run.db, new SuccessfulAdapter());
  const runResult = await processOutbox(run.db, runAdapter, { now: FIXED_NOW });
  assert.equal(runResult.result, 'fatal');
  assert.equal(runAdapter.externalSpawnCount, 0);
  assert.equal((run.db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'FAILED');
});

test('N1: deadline, revoke grant, bayat fence ve bayat sozlesme spawn engeller', async () => {
  const deadline = rigged();
  deadline.db.prepare("UPDATE runs SET deadline_at='2026-01-01T00:00:00Z' WHERE id=?").run('run-1');
  const deadlineAdapter = new GuardedAdapter(deadline.db, new SuccessfulAdapter());
  const deadlineResult = await processOutbox(deadline.db, deadlineAdapter, { now: FIXED_NOW });
  assert.equal(deadlineResult.result, 'fatal');
  assert.equal(deadlineAdapter.externalSpawnCount, 0);

  const grant = rigged();
  const created = createGrant(grant.db, {
    runId: 'run-1',
    actions: ['EXTRA_RETRY'],
    extraRetryBudget: 1,
    tokenBudget: 100,
    expiresAt: '2099-01-01T00:00:00Z',
  }, 'insan:test');
  grant.db.prepare('UPDATE attempts SET grant_id=? WHERE id=?').run(created.grantId, 'att-1');
  revokeGrant(grant.db, created.grantId, 'insan:admin');
  const grantAdapter = new GuardedAdapter(grant.db, new SuccessfulAdapter());
  const grantResult = await processOutbox(grant.db, grantAdapter, { now: FIXED_NOW });
  assert.equal(grantResult.result, 'stale');
  assert.equal(grantAdapter.externalSpawnCount, 0);
  assert.equal((grant.db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'STALE');

  const fence = rigged();
  takeLease(fence.db, 'att-1', 'new-owner', '2099-01-01T00:00:00Z');
  const fenceAdapter = new GuardedAdapter(fence.db, new SuccessfulAdapter());
  const fenceResult = await processOutbox(fence.db, fenceAdapter, { now: FIXED_NOW });
  assert.equal(fenceResult.result, 'fatal');
  assert.equal(fenceAdapter.externalSpawnCount, 0);

  const contract = rigged();
  contract.db.prepare('UPDATE commands SET status=? WHERE id=?').run('SUPERSEDED', contract.commandId);
  const contractAdapter = new GuardedAdapter(contract.db, new SuccessfulAdapter());
  const contractResult = await processOutbox(contract.db, contractAdapter, { now: FIXED_NOW });
  assert.equal(contractResult.result, 'fatal');
  assert.equal(contractAdapter.externalSpawnCount, 0);
});

test('N2: kontrol-etki yarisi acik UNKNOWN ile kapanir, sahte guvence uretilmez', async () => {
  const { db } = rigged();
  const adapter = new GuardedAdapter(db, new RacingAdapter(db));
  const result = await processOutbox(db, adapter, { now: FIXED_NOW });
  assert.equal(result.result, 'orphan-unknown');
  assert.equal(adapter.externalSpawnCount, 1, 'dis etki olabilir; inkar sahteciligi YOK');
  assert.equal((db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'UNKNOWN');
  assert.equal((db.prepare("SELECT state FROM reservations WHERE attempt_id='att-1'").get() as any).state, 'UNKNOWN');
  assert.equal((db.prepare("SELECT external_session_id FROM attempts WHERE id='att-1'").get() as any).external_session_id, null);
});
