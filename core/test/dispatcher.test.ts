// S1 dispatcher — V3-S1.2'nin deterministik yarısı: fault senaryoları fake
// adapter ile (canlı SDK koşuları V3-S1.1'de ayrıca kanıtlanacak — NOT_RUN).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStore, recordCommand, setGlobalStop, reserveDispatch, takeLease } from '../src/store.ts';
import { processOutbox, reconcileUnknown, pollSentSessions, type WorkerAdapter, type SpawnResult } from '../src/dispatcher.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

class FakeAdapter implements WorkerAdapter {
  spawnCalls: string[] = [];
  lookups = new Map<string, 'ALIVE' | 'DEAD' | 'UNKNOWN'>();
  script: SpawnResult[];
  constructor(script: SpawnResult[] = [{ outcome: 'OK', externalSessionId: 'ses-1' }]) {
    this.script = script;
  }
  async spawn(o: { dispatchKey: string; attemptId: string }) {
    this.spawnCalls.push(o.dispatchKey);
    if (this.script.length === 0) throw new Error('bağlantı koptu'); // belirsizlik
    return this.script.shift()!;
  }
  async lookup(dk: string) {
    return this.lookups.get(dk) ?? 'UNKNOWN';
  }
}

function rigged() {
  // seeded store + cleared stop + reserved dispatch (PENDING outbox row)
  const db = openStore();
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'h', 'r', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)')
    .run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), '{}');
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-1','plan-1',1,'READY','ph',0,1,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1','n-1','coder','[]','READY')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`).run();
  setGlobalStop(db, false, 'test', 'kurulum');
  const cmd = recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-1', idempotencyKey: 'k-1', payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: 'k-1' } });
  reserveDispatch(db, { attemptId: 'att-1', tokens: 50, commandId: cmd.commandId, dispatchKey: 'dk-1' });
  return db;
}

const evTypes = (db: any) => (db.prepare('SELECT type FROM events ORDER BY sequence').all() as any[]).map((r: any) => r.type);

test('A16/S7 okuma sırası: latch açıkken adaptera HİÇ ulaşılmaz (spawn 0 çağrı)', async () => {
  const db = rigged();
  setGlobalStop(db, true, 'op', 'acil'); // reserve SONRASI latch — dispatch yine de dış etki YAPMAZ
  const a = new FakeAdapter();
  const r = await processOutbox(db, a);
  assert.deepEqual(r, { blocked: 'global_stop', processed: 0 });
  assert.equal(a.spawnCalls.length, 0);
});

test('mutlu yol: spawn OK → SESSION_BOUND + outbox SENT', async () => {
  const db = rigged();
  const a = new FakeAdapter([{ outcome: 'OK', externalSessionId: 'ses-42' }]);
  const r = await processOutbox(db, a);
  assert.equal(r.result, 'bound');
  assert.equal((db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'SENT');
  assert.equal((db.prepare("SELECT external_session_id FROM attempts WHERE id='att-1'").get() as any).external_session_id, 'ses-42');
  assert.ok(evTypes(db).includes('SESSION_BOUND'));
});

test('A08: cevapsız spawn (exception) → UNKNOWN; ikinci geçiş kör re-spawn ETMEZ', async () => {
  const db = rigged();
  const a = new FakeAdapter([]); // throw = belirsizlik
  const r = await processOutbox(db, a);
  assert.equal(r.result, 'unknown');
  assert.equal((db.prepare("SELECT state FROM reservations WHERE attempt_id='att-1'").get() as any).state, 'UNKNOWN');
  assert.equal((db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'UNKNOWN');
  const callsBefore = a.spawnCalls.length;
  await processOutbox(db, a); // UNKNOWN satırı spawn yoluna geri DÖNMEZ
  assert.equal(a.spawnCalls.length, callsBefore, 'KÖR RE-SPAWN — A08 ihlali!');
});

test('A08 reconcile: DEAD → release+CANCEL_CONFIRMED; ALIVE → recovered bind', async () => {
  const db = rigged();
  const a = new FakeAdapter([]);
  await processOutbox(db, a);
  a.lookups.set('dk-1', 'DEAD');
  let rec = await reconcileUnknown(db, a);
  assert.deepEqual(rec.outcomes, ['dead-released']);
  assert.equal((db.prepare("SELECT state FROM reservations WHERE attempt_id='att-1'").get() as any).state, 'RELEASED');
  assert.ok(evTypes(db).includes('CANCEL_CONFIRMED'));

  // ikinci senaryo: taze reserve + UNKNOWN + ALIVE lookup
  const db2 = rigged();
  const b = new FakeAdapter([]);
  await processOutbox(db2, b);
  b.lookups.set('dk-1', 'ALIVE');
  rec = await reconcileUnknown(db2, b);
  assert.deepEqual(rec.outcomes, ['recovered']);
  assert.equal((db2.prepare("SELECT external_session_id FROM attempts WHERE id='att-1'").get() as any).external_session_id, 'recovered:dk-1');
});

test('RETRYABLE: 429 benzeri → gecikmeli PENDING, rezervasyon ACTIVE kalır, üs sıfırlanmaz', async () => {
  const db = rigged();
  let clock = new Date('2026-10-13T12:00:00Z');
  const a = new FakeAdapter([{ outcome: 'RETRYABLE', reason: '429' }]);
  const r = await processOutbox(db, a, { now: () => clock });
  assert.equal(r.result, 'retry-scheduled');
  assert.equal((db.prepare("SELECT state FROM reservations WHERE attempt_id='att-1'").get() as any).state, 'ACTIVE');
  const r2 = await processOutbox(db, a, { now: () => clock }); // henüz vakti gelmedi
  assert.ok(r2.idle);
  clock = new Date('2026-10-13T12:01:00Z'); // +60sn
  await processOutbox(db, a, { now: () => clock });
  assert.equal(a.spawnCalls.length, 2);
});

test('STALE: attempt RUNNING değilse (iptal/devir) spawn EDİLMEZ', async () => {
  const db = rigged();
  takeLease(db, 'att-1', 'core-2', '2027-01-01T00:00:00Z'); // bump
  db.prepare("UPDATE attempts SET state='CANCEL_REQUESTED' WHERE id='att-1'").run();
  const a = new FakeAdapter();
  const r = await processOutbox(db, a);
  assert.equal(r.result, 'stale');
  assert.equal(a.spawnCalls.length, 0);
  assert.equal((db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'STALE');
});

// S4 Scheduler — SENT yoklaması (SAVAS START canlı bulgusu: ölü harici oturum
// defterde RUNNING görünüyordu; run-c0ea713b kanıtı — DERSLER 173)
test('SENT-poll: ölü oturum + RUNNING attempt → dead-released (release+FAILED+node READY+olay)', async () => {
  const db = rigged();
  const a = new FakeAdapter([{ outcome: 'OK', externalSessionId: 'ses-7' }]);
  await processOutbox(db, a); // SENT + SESSION_BOUND
  db.prepare("UPDATE nodes SET state='RUNNING' WHERE run_id='run-1' AND id='n-1'").run();
  a.lookups.set('dk-1', 'DEAD');
  const p = await pollSentSessions(db, a);
  assert.deepEqual(p, { polled: 1, outcomes: ['dead-released'] });
  assert.equal((db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'DEAD_CONFIRMED');
  assert.equal((db.prepare("SELECT state FROM attempts WHERE id='att-1'").get() as any).state, 'FAILED');
  assert.equal((db.prepare("SELECT state FROM nodes WHERE run_id='run-1' AND id='n-1'").get() as any).state, 'READY');
  assert.equal((db.prepare("SELECT state FROM reservations WHERE attempt_id='att-1'").get() as any).state, 'RELEASED');
  assert.ok(evTypes(db).includes('CANCEL_CONFIRMED'));
});

test('SENT-poll: ALIVE → alive-running; durum/olay DEĞİŞMEZ (spam yok)', async () => {
  const db = rigged();
  const a = new FakeAdapter([{ outcome: 'OK', externalSessionId: 'ses-8' }]);
  await processOutbox(db, a);
  const evBefore = (db.prepare('SELECT COUNT(*) c FROM events').get() as any).c;
  a.lookups.set('dk-1', 'ALIVE');
  const p = await pollSentSessions(db, a);
  assert.deepEqual(p, { polled: 1, outcomes: ['alive-running'] });
  assert.equal((db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'SENT');
  assert.equal((db.prepare("SELECT state FROM attempts WHERE id='att-1'").get() as any).state, 'RUNNING');
  assert.equal((db.prepare('SELECT COUNT(*) c FROM events').get() as any).c, evBefore, 'ALIVE gözlemi olay ÜRETMEZ');
});

test('SENT-poll: terminal attempte regresyon YOK (DONE düzeyi korunur)', async () => {
  const db = rigged();
  const a = new FakeAdapter([{ outcome: 'OK', externalSessionId: 'ses-9' }]);
  await processOutbox(db, a);
  db.prepare("UPDATE attempts SET state='ACCEPTED' WHERE id='att-1'").run();
  db.prepare("UPDATE nodes SET state='DONE' WHERE run_id='run-1' AND id='n-1'").run();
  a.lookups.set('dk-1', 'DEAD');
  const p = await pollSentSessions(db, a);
  assert.deepEqual(p, { polled: 1, outcomes: ['dead-observed'] });
  assert.equal((db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'DEAD_CONFIRMED');
  assert.equal((db.prepare("SELECT state FROM attempts WHERE id='att-1'").get() as any).state, 'ACCEPTED', 'terminal attempt FAILED edilmez');
  assert.equal((db.prepare("SELECT state FROM nodes WHERE run_id='run-1' AND id='n-1'").get() as any).state, 'DONE', 'DONE node READY edilmez');
});

test('SENT-poll: UNKNOWN → still-unknown; dokunma yok', async () => {
  const db = rigged();
  const a = new FakeAdapter([{ outcome: 'OK', externalSessionId: 'ses-10' }]);
  await processOutbox(db, a);
  a.lookups.set('dk-1', 'UNKNOWN');
  const p = await pollSentSessions(db, a);
  assert.deepEqual(p, { polled: 1, outcomes: ['still-unknown'] });
  assert.equal((db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'SENT');
});
