// Kapanış testleri (gpt/KAPANIS-LISTESI.md U1–U7). Hermetik: canlı adapter yok.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStore, recordCommand, setGlobalStop, reserveDispatch } from '../src/store.ts';
import { processOutbox, reconcileUnknown, type WorkerAdapter, type SpawnResult } from '../src/dispatcher.ts';
import { decideApproval } from '../src/supervisor.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

class ScriptAdapter implements WorkerAdapter {
  spawnCalls = 0;
  lookups = new Map<string, 'ALIVE' | 'DEAD' | 'UNKNOWN'>();
  // Node strip-only modu TS parametre-properti desteklemez -> açik alan atamasi.
  private next: (db?: any) => SpawnResult | Promise<SpawnResult>;
  private hook?: () => void;
  constructor(next: (db?: any) => SpawnResult | Promise<SpawnResult>, hook?: () => void) {
    this.next = next;
    this.hook = hook;
  }
  async spawn() {
    this.spawnCalls++;
    this.hook?.();
    return await this.next();
  }
  async lookup(dk: string) { return this.lookups.get(dk) ?? 'UNKNOWN'; }
}

function rigged() {
  const db = openStore();
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'h', 'r', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)')
    .run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), '{}');
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-1','plan-1',1,'READY','ph',0,1,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1','n-1','coder','[]','RUNNING')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`).run();
  setGlobalStop(db, false, 'test', 'kurulum');
  const cmd = recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-1', idempotencyKey: 'k-1', payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: 'k-1' } });
  reserveDispatch(db, { attemptId: 'att-1', tokens: 50, commandId: cmd.commandId, dispatchKey: 'dk-1' });
  return db;
}

const one = (db: any, sql: string) => db.prepare(sql).get() as any;

test('U1: spawn sırasında outbox SENDING; çökme (SENDING kalmış) → spawn YOK, reconcile UNKNOWN’a yükseltir', async () => {
  const db = rigged();
  let seenDuringSpawn = '';
  const a = new ScriptAdapter(() => ({ outcome: 'OK', externalSessionId: 'x' }), () => {
    seenDuringSpawn = one(db, "SELECT status FROM outbox WHERE dispatch_key='dk-1'").status;
  });
  await processOutbox(db, a);
  assert.equal(seenDuringSpawn, 'SENDING', 'spawn öncesi niyet işaretlenmeli');

  // çökme simülasyonu: SENDING kalmış satır
  const db2 = rigged();
  db2.prepare("UPDATE outbox SET status='SENDING' WHERE dispatch_key='dk-1'").run();
  const b = new ScriptAdapter(() => ({ outcome: 'OK', externalSessionId: 'x' }));
  const r = await processOutbox(db2, b);
  assert.ok(r.idle);
  assert.equal(b.spawnCalls, 0, 'SENDING satırı kör re-spawn EDİLMEZ');
  const rec = await reconcileUnknown(db2, b);
  assert.deepEqual(rec.outcomes, ['still-unknown']);
  assert.equal(one(db2, "SELECT status FROM outbox WHERE dispatch_key='dk-1'").status, 'UNKNOWN');
  assert.equal(one(db2, "SELECT state FROM reservations WHERE attempt_id='att-1'").state, 'UNKNOWN');
});

test('U2: STALE dalı rezervasyonu RELEASED yapar (ACTIVE sızıntısı yok)', async () => {
  const db = rigged();
  db.prepare("UPDATE attempts SET state='CANCEL_REQUESTED' WHERE id='att-1'").run();
  await processOutbox(db, new ScriptAdapter(() => ({ outcome: 'OK', externalSessionId: 'x' })));
  assert.equal(one(db, "SELECT state FROM reservations WHERE attempt_id='att-1'").state, 'RELEASED');
  assert.equal(one(db, "SELECT status FROM outbox WHERE dispatch_key='dk-1'").status, 'STALE');
});

test('U3: FATAL → attempt FAILED, node FAILED, rezervasyon RELEASED (takılı RUNNING yok)', async () => {
  const db = rigged();
  await processOutbox(db, new ScriptAdapter(() => ({ outcome: 'FATAL', reason: 'kalıcı' })));
  assert.equal(one(db, "SELECT state FROM attempts WHERE id='att-1'").state, 'FAILED');
  assert.equal(one(db, "SELECT state FROM nodes WHERE id='n-1'").state, 'FAILED');
  assert.equal(one(db, "SELECT state FROM reservations WHERE attempt_id='att-1'").state, 'RELEASED');
});

test('U3: reconcile DEAD → attempt FAILED, node READY (yeniden denenebilir)', async () => {
  const db = rigged();
  const a = new ScriptAdapter(() => { throw new Error('x'); });
  await processOutbox(db, a);
  a.lookups.set('dk-1', 'DEAD');
  await reconcileUnknown(db, a);
  assert.equal(one(db, "SELECT state FROM attempts WHERE id='att-1'").state, 'FAILED');
  assert.equal(one(db, "SELECT state FROM nodes WHERE id='n-1'").state, 'READY');
  assert.equal(one(db, "SELECT state FROM reservations WHERE attempt_id='att-1'").state, 'RELEASED');
});

test('U4: FATAL dalında outbox FAILED olur ve sonraki geçiş yeniden spawn ETMEZ', async () => {
  const db = rigged();
  const a = new ScriptAdapter(() => ({ outcome: 'FATAL', reason: 'kalıcı' }));
  const first = await processOutbox(db, a);
  assert.equal(first.result, 'fatal');
  assert.equal(one(db, "SELECT status FROM outbox WHERE dispatch_key='dk-1'").status, 'FAILED');
  assert.equal(a.spawnCalls, 1);

  // İkinci geçiş: FAILED satır PENDING değildir → kuyruk boş, spawn yok
  const second = await processOutbox(db, a);
  assert.ok(second.idle, 'FAILED satır tekrar işlenmemeli');
  assert.equal(a.spawnCalls, 1, 'FATAL sonrası yeniden spawn YASAK');
  assert.equal(one(db, "SELECT status FROM outbox WHERE dispatch_key='dk-1'").status, 'FAILED');
});

test('U5: spawn sırasında devir/iptal → oturum BAĞLANMAZ, sahipsiz oturum UNKNOWN', async () => {
  const db = rigged();
  const a = new ScriptAdapter(() => ({ outcome: 'OK', externalSessionId: 'ses-orphan' }), () => {
    db.prepare("UPDATE attempts SET state='CANCEL_REQUESTED' WHERE id='att-1'").run();
  });
  const r = await processOutbox(db, a);
  assert.equal(r.result, 'orphan-unknown');
  assert.equal(one(db, "SELECT external_session_id FROM attempts WHERE id='att-1'").external_session_id, null);
  assert.equal(one(db, "SELECT status FROM outbox WHERE dispatch_key='dk-1'").status, 'UNKNOWN');
  assert.equal(
    (db.prepare("SELECT COUNT(*) AS c FROM events WHERE type='SESSION_BOUND'").get() as any).c, 0,
  );
});

test('U7: süresi dolmuş onay karara bağlanamaz', () => {
  const db = rigged();
  db.prepare(`INSERT INTO approvals(id,run_id,plan_hash,candidate_hash,policy_hash,expected_run_version,action,expires_at,decision)
    VALUES('ap-1','run-1',?,?,?,1,'ACCEPT_RESULT','2000-01-01 00:00:00','PENDING')`).run(H64('b'), H64('c'), H64('p'));
  assert.throws(() => decideApproval(db, 'ap-1', 'APPROVED', 'op', 1), /süresi doldu/);
  assert.equal(one(db, "SELECT decision FROM approvals WHERE id='ap-1'").decision, 'PENDING');
});
