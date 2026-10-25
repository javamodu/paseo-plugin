// F1-A/F1-B/F1-C — fake-adapter fault kabul kapıları (hermetik; gerçek Paseo/dış API çağrısı YOK).
// Tekrar EDİLMEYEN mevcut kanıtlar: spawn-exception→UNKNOWN (dispatcher.test A08),
// STOP biti reopen'da korunur (store.test V3-S1-restart), reconcile DEAD/ALIVE temel akış
// (dispatcher.test), local launch patlaması→UNKNOWN (local-runtime.test A08 local kolu).
// Burada kanıtlanan EKSİKLER:
//  F1-A crash: SENDING'de takılı satır reconcile'da UNKNOWN'a yükselir (U1) + kanıtsız dokunuş yok.
//  F1-B STOP/restart: latch restart'ta DAVRANIŞSAL korunur (processOutbox bloklu, spawn 0 çağrı)
//    ve kaldırma da aynı şekilde kalıcıdır (latch takılı kalmaz).
//  F1-C UNKNOWN reconcile: DEAD → attempt FAILED + node READY (yeniden sıralanabilir);
//    reconcile idempotent — ikinci geçiş no-op, CANCEL_CONFIRMED/SESSION_BOUND çoğalmaz.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, recordCommand, setGlobalStop, reserveDispatch } from '../src/store.ts';
import { processOutbox, reconcileUnknown, type WorkerAdapter, type SpawnResult } from '../src/dispatcher.ts';

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
    if (this.script.length === 0) throw new Error('bağlantı koptu'); // crash/reset = belirsizlik
    return this.script.shift()!;
  }
  async lookup(dk: string) {
    return this.lookups.get(dk) ?? 'UNKNOWN';
  }
}

// dispatcher.test.ts rigged() ile aynı tohum; path verilirse DOSYA defteri (restart provası).
function rigged(path?: string) {
  const db = openStore(path);
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

const col = (db: any, sql: string) => (db.prepare(sql).get() as any)[Object.keys(db.prepare(sql).get() as any)[0]];
const evCount = (db: any, type: string) =>
  (db.prepare('SELECT COUNT(*) AS c FROM events WHERE type=?').get(type) as any).c as number;
const outboxStatus = (db: any) => col(db, "SELECT status FROM outbox WHERE dispatch_key='dk-1'");
const reservationState = (db: any) => col(db, "SELECT state FROM reservations WHERE attempt_id='att-1'");

// ---- F1-A: fake adapter CRASH ----

test('F1-A pozitif (crash): SENDING takılı satır reconcile ile UNKNOWN olur, kör re-spawn YOK (U1+A08)', async () => {
  const db = rigged();
  // crash simülasyonu: U1 niyet işareti (SENDING) yazıldı, sonuç commit'i ASLA gelmedi.
  db.prepare("UPDATE outbox SET status='SENDING' WHERE dispatch_key='dk-1'").run();
  const a = new FakeAdapter();
  const rec = await reconcileUnknown(db, a);
  assert.deepEqual(rec.outcomes, ['still-unknown'], 'lookup belirsizken uydurma kapanış yok');
  assert.equal(outboxStatus(db), 'UNKNOWN');
  assert.equal(reservationState(db), 'UNKNOWN'); // slot körü körüne serbest bırakılmadı
  assert.equal(evCount(db, 'EXTERNAL_STATE_UNKNOWN'), 1);
  const ev = db.prepare("SELECT payload_json FROM events WHERE type='EXTERNAL_STATE_UNKNOWN'").get() as any;
  assert.match(JSON.parse(ev.payload_json).reason, /spawn sonucu kay/);
  const r = await processOutbox(db, a); // UNKNOWN satırı spawn yoluna DÖNMEZ
  assert.ok(r.idle);
  assert.equal(a.spawnCalls.length, 0, 'crash sonrası kör re-spawn — A08 ihlali!');
});

test('F1-A negatif: çökme kanıtı (SENDING kalıntısı) yoksa reconcile sağlıklı akışa DOKUNMAZ', async () => {
  const db = rigged(); // outbox PENDING, reservation ACTIVE — crash YOK
  const a = new FakeAdapter();
  a.lookups.set('dk-1', 'ALIVE');
  const rec = await reconcileUnknown(db, a);
  assert.equal(rec.reconciled, 0);
  assert.deepEqual(rec.outcomes, []);
  assert.equal(outboxStatus(db), 'PENDING', 'sağlıklı satır UNKNOWN yapılmaz');
  assert.equal(reservationState(db), 'ACTIVE');
  assert.equal(evCount(db, 'EXTERNAL_STATE_UNKNOWN'), 0);
  const r = await processOutbox(db, a); // normal akış sürer
  assert.equal(r.result, 'bound');
  assert.equal(a.spawnCalls.length, 1);
});

// ---- F1-B: STOP / restart persistence ----

test('F1-B pozitif: STOP + restart → latch DAVRANIŞSAL korunur (processOutbox bloklu, adaptera 0 çağrı)', async () => {
  const p = join(mkdtempSync(join(tmpdir(), 'ordu-f1b-stop-')), 'ordu.sqlite');
  const db = rigged(p);
  setGlobalStop(db, true, 'operator', 'acil stop');
  db.close();

  const db2 = openStore(p); // restart: defter yeniden açılır
  const a = new FakeAdapter();
  const r = await processOutbox(db2, a);
  assert.deepEqual(r, { blocked: 'global_stop', processed: 0 });
  assert.equal(a.spawnCalls.length, 0, 'restart sonrası STOP unutulduysa dış etki kaçardı — A16 ihlali!');
  assert.equal(evCount(db2, 'STOP_LATCH_SET'), 1, 'latch ACK olayı da defterde kalıcı');
  db2.close();
});

test('F1-B negatif: STOP kaldırma da kalıcı — restart sonrası dispatch akar (latch takılı KALMAZ)', async () => {
  const p = join(mkdtempSync(join(tmpdir(), 'ordu-f1b-clear-')), 'ordu.sqlite');
  const db = rigged(p);
  setGlobalStop(db, true, 'operator', 'acil');
  setGlobalStop(db, false, 'operator', 'cozum', H64('f')); // ACK: confirmationHash ile kaldırış
  db.close();

  const db2 = openStore(p); // restart
  const a = new FakeAdapter([{ outcome: 'OK', externalSessionId: 'ses-9' }]);
  const r = await processOutbox(db2, a);
  assert.equal(r.result, 'bound');
  assert.equal(a.spawnCalls.length, 1);
  assert.equal(outboxStatus(db2), 'SENT');
  assert.equal(evCount(db2, 'STOP_LATCH_SET'), 1);
  assert.equal(evCount(db2, 'STOP_LATCH_CLEARED'), 2); // kurulum + bilinçli kaldırış
  db2.close();
});

// ---- F1-C: UNKNOWN reconcile ----

test('F1-C pozitif: bağlantı koptu → UNKNOWN; DEAD reconcile → attempt FAILED + node READY + slot RELEASED', async () => {
  const db = rigged();
  const a = new FakeAdapter([]); // spawn throw = spawn sonrası bağlantı koptu
  const r = await processOutbox(db, a);
  assert.equal(r.result, 'unknown');
  assert.equal(reservationState(db), 'UNKNOWN');

  a.lookups.set('dk-1', 'DEAD'); // gözlem: oturum ölü TEYİTLİ
  const rec = await reconcileUnknown(db, a);
  assert.deepEqual(rec.outcomes, ['dead-released']);
  assert.equal(col(db, "SELECT state FROM attempts WHERE id='att-1'"), 'FAILED');
  assert.equal(col(db, "SELECT state FROM nodes WHERE run_id='run-1' AND id='n-1'"), 'READY', 'node yeniden sıralanabilir olmalı');
  assert.equal(reservationState(db), 'RELEASED'); // ölü oturum slot tutmaz
  assert.equal(evCount(db, 'CANCEL_CONFIRMED'), 1);

  const r2 = await processOutbox(db, a); // kör retry YOK: spawn yolunda satır kalmadı
  assert.ok(r2.idle);
  assert.equal(a.spawnCalls.length, 1);
});

test('F1-C negatif: reconcile idempotent — ikinci geçiş no-op, olaylar ÇOĞALMAZ', async () => {
  // DEAD kolu:
  const db = rigged();
  const a = new FakeAdapter([]);
  await processOutbox(db, a);
  a.lookups.set('dk-1', 'DEAD');
  await reconcileUnknown(db, a);
  const rec2 = await reconcileUnknown(db, a);
  assert.equal(rec2.reconciled, 0);
  assert.deepEqual(rec2.outcomes, []);
  assert.equal(evCount(db, 'CANCEL_CONFIRMED'), 1, 'teyit olayı çoğalmaz');

  // ALIVE kolu:
  const db2 = rigged();
  const b = new FakeAdapter([]);
  await processOutbox(db2, b);
  b.lookups.set('dk-1', 'ALIVE');
  const rec3 = await reconcileUnknown(db2, b);
  assert.deepEqual(rec3.outcomes, ['recovered']);
  const rec4 = await reconcileUnknown(db2, b);
  assert.equal(rec4.reconciled, 0);
  assert.deepEqual(rec4.outcomes, []);
  assert.equal(evCount(db2, 'SESSION_BOUND'), 1, 'bind olayı çoğalmaz');
  assert.equal(col(db2, "SELECT external_session_id FROM attempts WHERE id='att-1'"), 'recovered:dk-1', 'oturum bağlı kalır');
});
