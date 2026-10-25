// S1 store — node:sqlite üzerinde baseline 001 + hardening 002 repository'si.
// Kural 1: her komut/olay YAZMA ANINDA B01 kapalı şemasından geçer (K1 write-path).
// Kural 2: dış etki niyeti (outbox+reservation) TEK transaction'ta doğar (A06/A07).
// Kural 3: sonuç commit'i SUNULAN fencing token'a bağlıdır (A36 minimum çit).
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCommand, validateEvent, payloadHashOf } from './contracts/validate.ts';

const dbDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'database');

export function openStore(path = ':memory:') {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys=ON;');
  // idempotent migration (V3-S1.4 restart doğruluğu): 001 kopyası değiştirilemez
  // (hash-senkron testi), bu yüzden user_version damgası ile ikinci açılışta atlanır.
  const version = (db.prepare('PRAGMA user_version').get() as any).user_version as number;
  if (version < 1) db.exec(readFileSync(join(dbDir, '001-initial.sql'), 'utf8'));
  if (version < 2) db.exec(readFileSync(join(dbDir, '002-hardening.sql'), 'utf8'));
  // F6.5 (ADR-F65): nodes.provider/model; user_version<3 kapisi ikinci acilista atlatir (001/002 deseni).
  if (version < 3) db.exec(readFileSync(join(dbDir, '003-role-model.sql'), 'utf8'));
  // R3 (ADR-R3): grants defteri + attempts/approvals.grant_id; user_version<4 kapisi ikinci acilista atlatir.
  if (version < 4) db.exec(readFileSync(join(dbDir, '004-grants.sql'), 'utf8'));
  db.exec('PRAGMA user_version=4;');
  return db;
}

// re-entrant tx: dış sarmalayıcı (supervisor) BEGIN açıkken içteki store
// fonksiyonları (reserveDispatch/recordCommand...) yeniden BEGIN açmaya calisirsa
// "transaction within transaction" patlar. Ise dalma SAVEPOINT'e duser.
// P0-5: derinlik sayacı modül-global DEĞİL, DB handle başına (WeakMap) — aksi halde
// aynı process'te iki store iç içe tx çağırınca ikinci DB'ye BEGIN açılmadan
// SAVEPOINT yazılır (no such savepoint) ve iki defterin atomikliği birbirine karışır.
const txDepthByDb = new WeakMap<DatabaseSync, number>();
export function tx(db: DatabaseSync, fn: () => any) {
  const depth = txDepthByDb.get(db) ?? 0;
  if (depth === 0) {
    db.exec('BEGIN IMMEDIATE');
    txDepthByDb.set(db, 1);
    try {
      const r = fn();
      db.exec('COMMIT');
      return r;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    } finally {
      txDepthByDb.set(db, 0);
    }
  }
  const sp = 'ordusp_' + depth;
  db.exec('SAVEPOINT ' + sp);
  txDepthByDb.set(db, depth + 1);
  try {
    const r = fn();
    db.exec('RELEASE ' + sp);
    return r;
  } catch (e) {
    db.exec('ROLLBACK TO ' + sp);
    db.exec('RELEASE ' + sp);
    throw e;
  } finally {
    txDepthByDb.set(db, depth);
  }
}

const nowIso = () => new Date().toISOString();

export class GateError extends Error {}
export class FenceError extends Error {}

// ---- olay defteri (append-only; 001 UPDATE/DELETE tetiklerini taşıyor) ----
export function appendEvent(
  db: DatabaseSync,
  ev: { type: string; payload: object; actorId: string; causationId: string; runId?: string | null; attemptId?: string | null },
) {
  const seq = (db.prepare('SELECT COALESCE(MAX(sequence),0)+1 AS s FROM events').get() as any).s;
  const envelope = {
    id: randomUUID(),
    sequence: seq,
    type: ev.type,
    runId: ev.runId ?? null,
    attemptId: ev.attemptId ?? null,
    causationId: ev.causationId,
    actorId: ev.actorId,
    createdAt: nowIso(),
    payload: ev.payload,
  };
  const v = validateEvent(envelope);
  if (!v.ok) throw new GateError(`olay RED (${ev.type}): ${v.errors.join('; ')}`);
  db.prepare(
    'INSERT INTO events(id,run_id,attempt_id,type,actor_id,causation_id,created_at,payload_json) VALUES(?,?,?,?,?,?,?,?)',
  ).run(envelope.id, envelope.runId, envelope.attemptId, ev.type, ev.actorId, ev.causationId, envelope.createdAt, JSON.stringify(ev.payload));
  return envelope;
}

// ---- A05: idempotent komut kaydı ----
export function recordCommand(
  db: DatabaseSync,
  c: { kind: string; payload: object; actorId: string; runId?: string | null; expectedVersion?: number | null; idempotencyKey: string },
) {
  const payload = c.payload;
  const envelope = {
    id: randomUUID(),
    runId: c.runId ?? null,
    kind: c.kind,
    expectedVersion: c.expectedVersion ?? null,
    payloadHash: payloadHashOf(payload),
    payload,
  };
  const v = validateCommand(envelope);
  if (!v.ok) throw new GateError(`komut RED (${c.kind}): ${v.errors.join('; ')}`);
  return tx(db, () => {
    try {
      db.prepare(
        'INSERT INTO commands(id,run_id,expected_version,kind,actor_id,payload_hash,payload_json,status,idempotency_key) VALUES(?,?,?,?,?,?,?,?,?)',
      ).run(envelope.id, envelope.runId, envelope.expectedVersion, c.kind, c.actorId, envelope.payloadHash, JSON.stringify(payload), 'ACCEPTED', c.idempotencyKey);
    } catch (e: any) {
      if (String(e.message).includes('idempotency_key')) {
        const existing = db.prepare('SELECT id, payload_hash FROM commands WHERE idempotency_key=?').get(c.idempotencyKey) as any;
        // P0-6: aynı idempotencyKey + FARKLI payload = submit-anı tahrifatı; sessiz
        // DUPLICATE ile örtülemez. A05 idempotency yalnız BİREBİR aynı içerikte geçerli.
        if (existing.payload_hash !== envelope.payloadHash) {
          throw new GateError(`command_id_conflict: aynı idempotencyKey farklı payload (${c.idempotencyKey})`);
        }
        return { status: 'DUPLICATE' as const, commandId: existing.id }; // tek mantıksal koşu (A05)
      }
      throw e;
    }
    appendEvent(db, {
      type: 'COMMAND_ACCEPTED',
      actorId: c.actorId,
      causationId: envelope.id,
      runId: envelope.runId,
      payload: { commandId: envelope.id, kind: c.kind, idempotencyKey: c.idempotencyKey },
    });
    return { status: 'ACCEPTED' as const, commandId: envelope.id };
  });
}

// ---- A16: küresel STOP latch ----
export function setGlobalStop(db: DatabaseSync, paused: boolean, actor: string, reason: string, confirmationHash?: string) {
  return tx(db, () => {
    db.prepare('UPDATE settings SET dispatch_paused=? WHERE id=1').run(paused ? 1 : 0);
    appendEvent(db, {
      type: paused ? 'STOP_LATCH_SET' : 'STOP_LATCH_CLEARED',
      actorId: actor,
      causationId: 'operator',
      payload: paused ? { reason, actor } : { reason, actor, confirmationHash: confirmationHash ?? '0'.repeat(64) },
    });
  });
}

// ---- A06/A07: niyet+outbox+rezervasyon TEK transaction (kapılar 001 INSERT + 002 UPDATE) ----
export function reserveDispatch(
  db: DatabaseSync,
  d: { attemptId: string; tokens: number; commandId: string; dispatchKey: string },
) {
  return tx(db, () => {
    const attempt = db.prepare('SELECT run_id,node_id,fencing_token FROM attempts WHERE id=?').get(d.attemptId) as any;
    if (!attempt) throw new GateError(`attempt yok: ${d.attemptId}`);
    db.prepare(
      'INSERT INTO outbox(id,attempt_id,command_id,dispatch_key,kind,payload_json,status) VALUES(?,?,?,?,?,?,?)',
    ).run(randomUUID(), d.attemptId, d.commandId, d.dispatchKey, 'SPAWN_WORKER', '{}', 'PENDING');
    try {
      db.prepare('INSERT INTO reservations(id,attempt_id,tokens,state) VALUES(?,?,?,?)').run(
        randomUUID(), d.attemptId, d.tokens, 'ACTIVE',
      );
    } catch (e: any) {
      throw new GateError(`dispatch kapısı RED: ${String(e.message)}`); // global_stop/run_capacity/token_budget...
    }
    appendEvent(db, {
      type: 'DISPATCH_RESERVED',
      actorId: 'core',
      causationId: d.commandId,
      runId: attempt.run_id,
      attemptId: d.attemptId,
      payload: { runId: attempt.run_id, nodeId: attempt.node_id, attemptId: d.attemptId, reservedTokens: d.tokens, fencingToken: attempt.fencing_token },
    });
  });
}

// ---- A36: devir = bump; commit = sunulan token şartı ----
export function takeLease(db: DatabaseSync, attemptId: string, newOwner: string, leaseUntil: string) {
  return tx(db, () => {
    db.prepare('UPDATE attempts SET lease_owner=?, lease_until=?, fencing_token=fencing_token+1 WHERE id=?').run(
      newOwner, leaseUntil, attemptId,
    );
    const a = db.prepare('SELECT fencing_token FROM attempts WHERE id=?').get(attemptId) as any;
    return a.fencing_token as number;
  });
}

export function commitCandidate(db: DatabaseSync, attemptId: string, presentedFence: number, candidateHash: string, actorId: string) {
  if (!/^[a-f0-9]{64}$/.test(candidateHash)) throw new GateError('candidateHash 64 hex olmalı');
  return tx(db, () => {
    const r = db.prepare(
      "UPDATE attempts SET state='CANDIDATE_FROZEN', candidate_hash=? WHERE id=? AND fencing_token=? AND state='RUNNING'",
    ).run(candidateHash, attemptId, presentedFence);
    if (r.changes === 0) {
      const a = db.prepare('SELECT state,fencing_token FROM attempts WHERE id=?').get(attemptId) as any;
      throw new FenceError(
        `stale/uygunsuz commit reddi (A36): state=${a?.state} sunulan=${presentedFence} güncel=${a?.fencing_token}`,
      );
    }
    const a = db.prepare('SELECT run_id FROM attempts WHERE id=?').get(attemptId) as any;
    appendEvent(db, {
      type: 'CANDIDATE_FROZEN',
      actorId,
      causationId: attemptId,
      runId: a.run_id,
      attemptId,
      payload: { attemptId, candidateHash },
    });
  });
}

// ---- A13 store kapısı: 0-test/sahte PASS kabul değil; donmuş olmayan aday da yok ----
export function recordEvidence(
  db: DatabaseSync,
  e: { attemptId: string; presentedFence: number; artifactHash: string; storageRef: string; bytes: number; environmentHash: string; evaluatorHash: string; exitCode: number; verdict: 'PASS' | 'FAIL' | 'UNKNOWN'; testCount: number; actorId: string },
) {
  return tx(db, () => {
    const a = db.prepare('SELECT run_id,state,candidate_hash,fencing_token FROM attempts WHERE id=?').get(e.attemptId) as any;
    if (!a) throw new GateError('attempt yok');
    if (a.fencing_token !== e.presentedFence) throw new FenceError(`stale fence (A36): sunulan=${e.presentedFence} güncel=${a.fencing_token}`);
    if (a.state !== 'CANDIDATE_FROZEN' || !a.candidate_hash) throw new GateError('kanıt yalnız donmuş aday üzerinde kaydedilir');
    db.prepare('INSERT INTO artifacts(hash,storage_ref,bytes,media_type,sensitivity) VALUES(?,?,?,?,?)').run(
      e.artifactHash, e.storageRef, e.bytes, 'application/json', 'normal',
    );
    const evidenceId = randomUUID();
    try {
      db.prepare(
        'INSERT INTO evidence(id,attempt_id,artifact_hash,candidate_hash,evaluator_hash,environment_hash,exit_code,verdict,test_count) VALUES(?,?,?,?,?,?,?,?,?)',
      ).run(evidenceId, e.attemptId, e.artifactHash, a.candidate_hash, e.evaluatorHash, e.environmentHash, e.exitCode, e.verdict, e.testCount);
    } catch (err: any) {
      throw new GateError(`kanıt kapısı RED (A13): ${String(err.message)}`); // PASS⟸exit0 && test_count>0
    }
    appendEvent(db, {
      type: 'EVIDENCE_RECORDED',
      actorId: e.actorId,
      causationId: e.attemptId,
      runId: a.run_id,
      attemptId: e.attemptId,
      payload: { attemptId: e.attemptId, evidenceId, verdict: e.verdict, testCount: e.testCount },
    });
    return { evidenceId };
  });
}

// ---- mutabakat: UNKNOWN yalnız SETTLED/RELEASED olabilir (A35.2) ----
export function settleReservation(db: DatabaseSync, attemptId: string, to: 'SETTLED' | 'RELEASED', spentTokens: number) {
  return tx(db, () => {
    const r = db.prepare("UPDATE reservations SET state=? WHERE attempt_id=? AND state IN('ACTIVE','UNKNOWN')").run(to, attemptId);
    if (r.changes !== 1) throw new GateError(`mutabakat reddi: rezervasyon ACTIVE/UNKNOWN değil (A35)`);
    if (to === 'SETTLED') db.prepare('UPDATE runs SET spent_tokens=spent_tokens+? WHERE id=(SELECT run_id FROM attempts WHERE id=?)').run(spentTokens, attemptId);
    const a = db.prepare('SELECT run_id FROM attempts WHERE id=?').get(attemptId) as any;
    appendEvent(db, {
      type: 'BUDGET_SETTLED',
      actorId: 'core',
      causationId: attemptId,
      runId: a.run_id,
      attemptId,
      payload: { runId: a.run_id, reservationId: attemptId, spentTokens, usageState: to === 'SETTLED' ? 'KNOWN' : 'ESTIMATED' },
    });
  });
}

// ---- kapasite-bekliyor: kapı RED ise kör retry YOK; çağranıya net sebep ----
export function pendingCapacity(db: DatabaseSync) {
  return (db.prepare("SELECT COUNT(*) AS c FROM reservations WHERE state IN('ACTIVE','UNKNOWN')").get() as any).c;
}
