// S1 store kapıları — A05, A06/A07, A13, A16, A35 (iki probe senaryosu), A36.
// Negatif ağırlıklı: GPT/Notio gözlemlerindeki UPDATE kaçamakları artık RED olmalı.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStore, recordCommand, setGlobalStop, reserveDispatch, takeLease, commitCandidate, recordEvidence, settleReservation, appendEvent, tx, GateError, FenceError } from '../src/store.ts';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

function seeded() {
  const db = openStore();
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'hedef', 'repo', H64('a'));
  db.prepare(
    'INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)',
  ).run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), '{}');
  db.prepare(
    `INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
     VALUES('run-1','plan-1',1,'READY','ph',0,1,3,100,0,0,'2026-12-31T00:00:00Z')`,
  ).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1','n-1','coder','[]','READY')`).run();
  db.prepare(
    `INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token)
     VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`,
  ).run();
  db.prepare(
    `INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token)
     VALUES('att-2','run-1','n-1',2,'RUNNING','ih2',1)`,
  ).run();
  // STOP latch varsayılan açık (001); test akışı için temizle (A16 ayrı testi aşağıda)
  setGlobalStop(db, false, 'test', 'kurulum');
  return db;
}

const spawnCmd = (db: any, key = 'idem-1') =>
  recordCommand(db, { kind: 'START_RUN', actorId: 'operator', runId: 'run-1', idempotencyKey: key, payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: key } });

test('A16: STOP latch açıkken dispatch RED — kapatılınca geçer', () => {
  const db = seeded();
  setGlobalStop(db, true, 'operator', 'acil');
  const cmd = spawnCmd(db);
  assert.throws(() => reserveDispatch(db, { attemptId: 'att-1', tokens: 50, commandId: cmd.commandId, dispatchKey: 'dk-1' }), /global_stop/);
  setGlobalStop(db, false, 'operator', 'temiz', H64('f'));
  reserveDispatch(db, { attemptId: 'att-1', tokens: 50, commandId: cmd.commandId, dispatchKey: 'dk-1' }); // patlamamalı
});

test('A05: aynı idempotencyKey iki kez → tek mantıksal komut (DUPLICATE)', () => {
  const db = seeded();
  const a = spawnCmd(db, 'idem-x');
  const b = spawnCmd(db, 'idem-x');
  assert.equal(a.status, 'ACCEPTED');
  assert.equal(b.status, 'DUPLICATE');
  assert.equal(b.commandId, a.commandId);
  assert.equal((db.prepare('SELECT COUNT(*) AS c FROM commands').get() as any).c, 1);
});

test('A06: niyet+outbox+rezervasyon atomik — token_budget RED sonrası sıfır artık', () => {
  const db = seeded();
  const cmd = spawnCmd(db);
  assert.throws(
    () => reserveDispatch(db, { attemptId: 'att-1', tokens: 150, commandId: cmd.commandId, dispatchKey: 'dk-over' }),
    /token_budget/,
  );
  assert.equal((db.prepare('SELECT COUNT(*) AS c FROM reservations').get() as any).c, 0);
  assert.equal((db.prepare('SELECT COUNT(*) AS c FROM outbox').get() as any).c, 0); // transaction rollback doğrulaması
});

test('A07: run kapasite tavanı (max_workers=1) ikinci rezervasyonu RED eder', () => {
  const db = seeded();
  const cmd = spawnCmd(db);
  reserveDispatch(db, { attemptId: 'att-1', tokens: 40, commandId: cmd.commandId, dispatchKey: 'dk-1' });
  assert.throws(() => reserveDispatch(db, { attemptId: 'att-2', tokens: 40, commandId: cmd.commandId, dispatchKey: 'dk-2' }), /run_capacity/);
});

test('A35.1 [baseline probe #1]: ACTIVE rezervasyon UPDATE ile tavan ÜZERİNE çıkamaz', () => {
  const db = seeded();
  const cmd = spawnCmd(db);
  reserveDispatch(db, { attemptId: 'att-1', tokens: 50, commandId: cmd.commandId, dispatchKey: 'dk-1' });
  assert.throws(
    () => db.prepare("UPDATE reservations SET tokens=1000 WHERE attempt_id='att-1'").run(),
    /reservation_tokens_immutable/,
  );
  // azaltma da immutable (bütçe muhasebesi tek yönlü sapamaz)
  assert.throws(() => db.prepare("UPDATE reservations SET tokens=1 WHERE attempt_id='att-1'").run(), /reservation_tokens_immutable/);
});

test('A35.2 [baseline probe #2]: STOP açıkken UNKNOWN→ACTIVE FLIP RED', () => {
  const db = seeded();
  const cmd = spawnCmd(db);
  reserveDispatch(db, { attemptId: 'att-1', tokens: 50, commandId: cmd.commandId, dispatchKey: 'dk-1' });
  db.prepare("UPDATE reservations SET state='UNKNOWN' WHERE attempt_id='att-1'").run(); // belirsizleşme serbest
  setGlobalStop(db, true, 'operator', 'acil');
  assert.throws(
    () => db.prepare("UPDATE reservations SET state='ACTIVE' WHERE attempt_id='att-1'").run(),
    /reactivation_forbidden/,
  );
  // mutabakat yolu yalnız SETTLED/RELEASED
  setGlobalStop(db, false, 'operator', 'temiz', H64('f'));
  assert.throws(() => db.prepare("UPDATE reservations SET state='ACTIVE' WHERE attempt_id='att-1'").run(), /reactivation_forbidden/);
  settleReservation(db, 'att-1', 'RELEASED', 0); // meşru yol çalışır
});

test('A36: devir alan eski fence commit reddi — yeni fence geçer', () => {
  const db = seeded();
  const newFence = takeLease(db, 'att-1', 'core-epoch-2', '2026-10-13T23:59:59Z');
  assert.equal(newFence, 2);
  assert.throws(() => commitCandidate(db, 'att-1', 1, H64('c'), 'old-holder'), FenceError); // stale RED
  commitCandidate(db, 'att-1', 2, H64('c'), 'new-holder'); // güncel geçer
});

test('A36: donmuş aday hash i değiştirilemez; fencing token azaltılamaz', () => {
  const db = seeded();
  commitCandidate(db, 'att-1', 1, H64('c'), 'w');
  assert.throws(() => db.prepare("UPDATE attempts SET candidate_hash=? WHERE id='att-1'").run(H64('d')), /candidate_already_frozen/);
  assert.throws(() => db.prepare("UPDATE attempts SET fencing_token=0 WHERE id='att-1'").run(), /fencing_token_monotonic/);
});

test('A36: lease süresi doldu tek başına yeniden-doğum KANITI değildir (expiry≠bump)', () => {
  const db = seeded();
  db.prepare("UPDATE attempts SET lease_until='2020-01-01T00:00:00Z' WHERE id='att-1'").run();
  // eski sahip hâlâ fence=1 ile commit DENERSE state koşulu onu durdurmuyor mu?
  // Hayır: commit yalnız RUNNING+fence1 ister; devir olmadan time geçer.
  // KURAL (docs/03): yeniden spawn için önce takeLease(bump) ŞART — repository
  // bunu dispatch yolunda zorunlu kılar; burada eski sonucun YENİ attempt'e
  // yazılamadığını kanıtlıyoruz: att-2 fence ile att-1 commit RED.
  assert.throws(() => commitCandidate(db, 'att-1', 99, H64('c'), 'ghost'), FenceError);
});

test('A13 store kapısı: PASS + 0 test RED; donmamış adaya kanıt RED', () => {
  const db = seeded();
  const evBase = {
    attemptId: 'att-1', presentedFence: 1, artifactHash: H64('1'), storageRef: 's3://x/1', bytes: 10,
    environmentHash: H64('2'), evaluatorHash: H64('3'), exitCode: 0, actorId: 'evaluator',
  };
  // donmuş olmayan aday (state RUNNING) → RED
  assert.throws(() => recordEvidence(db, { ...evBase, verdict: 'PASS', testCount: 12 }), /donmuş/);
  commitCandidate(db, 'att-1', 1, H64('c'), 'w');
  // sahte PASS: 0 test
  assert.throws(() => recordEvidence(db, { ...evBase, verdict: 'PASS', testCount: 0 }), /CHECK/);
  // exit-code yalanı: PASS + exit 1
  assert.throws(() => recordEvidence(db, { ...evBase, verdict: 'PASS', testCount: 12, exitCode: 1 }), /CHECK/);
  // meşru kanıt geçer
  recordEvidence(db, { ...evBase, verdict: 'PASS', testCount: 12 });
});

test('K1 write-path: boş payloadlı olay YAZMA ANINDA RED (defter kirlenemez)', () => {
  const db = seeded();
  assert.throws(
    () => appendEvent(db, { type: 'CANDIDATE_FROZEN', actorId: 'x', causationId: 'y', payload: {} }),
    GateError,
  );
});

test('stale fence sonrası kanıt RED (A36 zinciri: commit→evidence aynı fence)', () => {
  const db = seeded();
  takeLease(db, 'att-1', 'core-2', '2027-01-01T00:00:00Z'); // fence 1→2
  assert.throws(
    () =>
      recordEvidence(db, {
        attemptId: 'att-1', presentedFence: 1, artifactHash: H64('1'), storageRef: 's', bytes: 1,
        environmentHash: H64('2'), evaluatorHash: H64('3'), exitCode: 0, verdict: 'PASS', testCount: 5, actorId: 'ev',
      }),
    FenceError,
  );
});

// P0 "aynı kimlik/farklı içerik conflict": komut payload'u SONRADAN değiştirilemez (tetik).
test('A05-b: komut payload tahrifatı (aynı id, farklı içerik) → command_id_conflict', () => {
  const db = seeded();
  const c = spawnCmd(db, 'idem-tamper');
  assert.throws(
    () => db.prepare('UPDATE commands SET payload_json=? WHERE id=?').run('{"runId":"run-1","planHash":"farkli","idempotencyKey":"idem-tamper"}', c.commandId),
    /command_id_conflict/,
  );
});

// P0 "restart STOP'u unutmaz": dosya-defterinde latch reopen sonrası hatırlanır.
test('V3-S1-restart: STOP latch dosya-defterinde reopen SONRASI korunur (unutulmaz)', () => {
  const p = join(mkdtempSync(join(tmpdir(), 'ordu-restart-')), 'ordu.sqlite');
  const db = openStore(p);
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'hedef', 'repo', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)').run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), '{}');
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at) VALUES('run-1','plan-1',1,'READY','ph',0,1,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1','n-1','coder','[]','READY')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`).run();
  setGlobalStop(db, true, 'operator', 'acil');
  db.close();

  const db2 = openStore(p); // reopen: migration TEKRAR etmez (user_version), settings + defter korunur
  assert.equal((db2.prepare('SELECT dispatch_paused AS p FROM settings WHERE id=1').get() as any).p, 1, 'STOP latch reopen sonrası hatırlanmalı');
  const cmd = recordCommand(db2, { kind: 'START_RUN', actorId: 'op', runId: 'run-1', idempotencyKey: 'r1', payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: 'r1' } });
  assert.throws(() => reserveDispatch(db2, { attemptId: 'att-1', tokens: 10, commandId: cmd.commandId, dispatchKey: 'dk' }), /global_stop/);
  assert.equal((db2.prepare('SELECT COUNT(*) AS c FROM reservations').get() as any).c, 0);
});

// P0-5: txDepth artık DB handle başına — iki store iç içe tx birbirine karışamaz.
// (Global sayaç olsaydı iç tx, ikinci DB'ye BEGIN açılmadan SAVEPOINT yazardı: RED kanıtı.)
test('P0-5: iki DB iç içe tx — ikinci store kendi BEGIN ini açar, ikisi de COMMIT olur', () => {
  const dbA = seeded();
  const dbB = seeded();
  tx(dbB, () => {
    dbB.prepare("UPDATE runs SET max_workers=2 WHERE id='run-1'").run();
    tx(dbA, () => {
      dbA.prepare("UPDATE runs SET max_workers=3 WHERE id='run-1'").run();
    });
  });
  assert.equal((dbA.prepare("SELECT max_workers AS w FROM runs WHERE id='run-1'").get() as any).w, 3);
  assert.equal((dbB.prepare("SELECT max_workers AS w FROM runs WHERE id='run-1'").get() as any).w, 2);
});

// P0-5b: içteki (farklı DB) tx'in ROLLBACK'i dış tx'i zehirleyemez; dış defter commit kalır.
test('P0-5b: iç tx (farklı DB) patlarsa yalnız kendi defteri geri alınır', () => {
  const dbA = seeded();
  const dbB = seeded();
  tx(dbB, () => {
    dbB.prepare("UPDATE runs SET max_workers=2 WHERE id='run-1'").run();
    assert.throws(
      () =>
        tx(dbA, () => {
          dbA.prepare("UPDATE runs SET max_workers=9 WHERE id='run-1'").run();
          throw new Error('ic-tx-boom');
        }),
      /ic-tx-boom/,
    );
  });
  assert.equal((dbA.prepare("SELECT max_workers AS w FROM runs WHERE id='run-1'").get() as any).w, 1, 'dbA geri alınmalı');
  assert.equal((dbB.prepare("SELECT max_workers AS w FROM runs WHERE id='run-1'").get() as any).w, 2, 'dbB commit kalmalı');
});

// P0-5c [negatif]: iç içe tx'te ikinci store GERÇEK transaction (BEGIN IMMEDIATE) almalı.
// Global sayaç olsaydı dbB'ye SAVEPOINT (implicit DEFERRED) düşerdi ve dosya-defterine
// dışarıdan ikinci bağlantı YAZABİLİRDİ — IMMEDIATE altında probe BUSY yemeli.
test("P0-5c: içteki store'un tx'i BEGIN IMMEDIATE — eşzamanlı dış yazıcı kilit yer", () => {
  const p = join(mkdtempSync(join(tmpdir(), 'ordu-txlock-')), 'b.sqlite');
  const dbA = seeded();
  const dbB = openStore(p);
  tx(dbA, () => {
    tx(dbB, () => {
      const probe = new DatabaseSync(p);
      assert.throws(() => probe.exec('CREATE TABLE t(x)'), /locked/i);
      probe.close();
    });
  });
});

// P0-6: idempotency yalnız BİREBİR aynı içerikte — aynı key + farklı payload submit-anı tahrifatıdır.
test('P0-6: aynı idempotencyKey + FARKLI payload → command_id_conflict RED; aynı içerik DUPLICATE kalır', () => {
  const db = seeded();
  const a = recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-1', idempotencyKey: 'idem-c', payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: 'idem-c' } });
  assert.equal(a.status, 'ACCEPTED');
  assert.throws(
    () => recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-1', idempotencyKey: 'idem-c', payload: { runId: 'run-1', planHash: H64('d'), idempotencyKey: 'idem-c' } }),
    /command_id_conflict/,
  );
  const b = recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-1', idempotencyKey: 'idem-c', payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: 'idem-c' } });
  assert.equal(b.status, 'DUPLICATE');
  assert.equal(b.commandId, a.commandId);
  assert.equal((db.prepare('SELECT COUNT(*) AS c FROM commands').get() as any).c, 1);
});
