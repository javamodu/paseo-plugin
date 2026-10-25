// K-0006 adapter sözleşmesi — hermetik kanıt. Gerçek Paseo/local worker ÇAĞRILMAZ (NOT_RUN).
// Kanıt: iptal teyidi≠isteği (slot teyitsiz AKTIF), hata normalizasyonu, SDK-tipi sizdirmasi yasaqi.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStore, setGlobalStop, pendingCapacity } from '../src/store.ts';
import { createRunPlan, approvePlan, dispatchNode, ensureStartCommand } from '../src/supervisor.ts';
import { normalizeError, requestCancel, sendFollowUp, pollEvents } from '../src/adapter-contract.ts';
import { sampleHandoff } from '../src/handoff.ts';
import type { WorkerAdapter } from '../src/dispatcher.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

function dispatched(cancelOut?: any, extra: Partial<WorkerAdapter> = {}) {
  const db = openStore();
  setGlobalStop(db, false, 'op', 'acilis');
  const planHash = createRunPlan(db, {
    capsuleId: 'cap-1', goal: 'g', repoId: 'r', sourceCommit: H64('c'),
    runId: 'run-1', planId: 'plan-1', profileHash: H64('p'), nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 5,
  }).planHash;
  const startCmd = ensureStartCommand(db, 'run-1', planHash, 'op');
  approvePlan(db, 'run-1', planHash, 'human');
  const d = dispatchNode(db, 'run-1', 'n1', { tokens: 1000, startCommandId: startCmd, dispatchKey: 'k1', handoff: sampleHandoff('n1') });
  db.prepare('UPDATE attempts SET external_session_id=? WHERE id=?').run('sess-1', (d as any).attemptId);
  const adapter: WorkerAdapter = {
    spawn: async () => ({ outcome: 'OK', externalSessionId: 'sess-1' }),
    lookup: async () => 'ALIVE',
    ...extra,
    ...(cancelOut !== undefined ? { cancel: async () => cancelOut } : {}),
  };
  return { db, attemptId: (d as any).attemptId as string, adapter };
}

test('iptal TEYITLI (CONFIRMED_DEAD) → CANCELLED + rezervasyon RELEASED (slot döner)', async () => {
  const { db, attemptId, adapter } = dispatched('CONFIRMED_DEAD');
  assert.equal(pendingCapacity(db), 1);
  const r = await requestCancel(db, adapter, attemptId, 'vazgec');
  assert.equal(r.status, 'CANCELLED');
  assert.equal(pendingCapacity(db), 0); // teyitli ölüm slotu bıraktı
  assert.ok((db.prepare("SELECT COUNT(*) c FROM events WHERE type='CANCEL_CONFIRMED'").get() as any).c === 1);
});

test('iptal İSTEĞİ ≠ TEYİT: REQUESTED/UNKNOWN → slot AKTİF kalir (SLOT+A08)', async () => {
  for (const out of ['REQUESTED', 'UNKNOWN']) {
    const { db, attemptId, adapter } = dispatched(out);
    const r = await requestCancel(db, adapter, attemptId, 'durak');
    assert.equal(r.status, 'CANCEL_UNCONFIRMED');
    assert.equal(pendingCapacity(db), 1, out + ': teyitsiz slot birakilmaz');
    assert.equal((db.prepare("SELECT COUNT(*) c FROM events WHERE type='CANCEL_CONFIRMED'").get() as any).c, 0);
    assert.equal((db.prepare("SELECT COUNT(*) c FROM events WHERE type='CANCEL_REQUESTED'").get() as any).c, 1);
  }
});

test('adapter iptal FIILI sunmuyor → UNSUPPORTED, slot AKTIF (kör serbest brakma yok)', async () => {
  const { db, attemptId } = dispatched(); // cancel yok
  const r = await requestCancel(db, { spawn: async () => ({ outcome: 'OK' as const, externalSessionId: 's' }), lookup: async () => 'ALIVE' as const }, attemptId, 'x');
  assert.equal(r.status, 'CANCEL_UNCONFIRMED');
  assert.equal((r as any).adapterResponse, 'UNSUPPORTED');
  assert.equal(pendingCapacity(db), 1);
});

test('normalizeError: 401→auth, 429→kota, timeout→zamanasimi, eslesmeyen→belirsiz', () => {
  assert.equal(normalizeError({ status: 401, message: 'bad token' }).cls, 'auth');
  assert.equal(normalizeError({ status: 429, message: 'slow down' }).cls, 'kota');
  assert.equal(normalizeError(new Error('request timed out')).cls, 'zamanasimi');
  assert.equal(normalizeError({}).cls, 'belirsiz');
  assert.equal(normalizeError(new Error('operation not supported here')).cls, 'desteklenmiyor');
});

test('SDK-tipi sizdirmasi YASAK: normalize yalniz {cls,message} — extra alanlar düşer', () => {
  const noisy = { status: 401, message: 'nope', sdkNativeBlob: { secret: 'x' }, requestId: 'r-9' };
  const e = normalizeError(noisy);
  assert.deepEqual(Object.keys(e).sort(), ['cls', 'message']);
});

test('sendFollowUp desteklenmiyor → normalize hata {desteklenmiyor}; durum değişmez', async () => {
  const { db, attemptId } = dispatched(); // send yok
  const before = (db.prepare('SELECT state FROM attempts WHERE id=?').get(attemptId) as any).state;
  const r = await sendFollowUp(db, { spawn: async () => ({ outcome: 'OK' as const, externalSessionId: 's' }), lookup: async () => 'ALIVE' as const }, attemptId, 'devam et');
  assert.equal(r.status, 'UNSUPPORTED');
  assert.equal((r as any).error.cls, 'desteklenmiyor');
  assert.equal((db.prepare('SELECT state FROM attempts WHERE id=?').get(attemptId) as any).state, before);
});

test('sendFollowUp OK ve hata normalizasyonu (adapter.send)', async () => {
  const { db, attemptId } = dispatched(undefined, { send: async () => 'OK' });
  const okAdapter: WorkerAdapter = { spawn: async () => ({ outcome: 'OK', externalSessionId: 's' }), lookup: async () => 'ALIVE', send: async () => 'OK' };
  assert.equal((await sendFollowUp(db, okAdapter, attemptId, 'mesaj')).status, 'OK');
  const failAdapter: WorkerAdapter = { spawn: async () => ({ outcome: 'OK', externalSessionId: 's' }), lookup: async () => 'ALIVE', send: async () => { throw { status: 429, message: 'quota' }; } };
  const errRes = await sendFollowUp(db, failAdapter, attemptId, 'mesaj');
  assert.equal(errRes.status, 'ERROR');
  assert.equal((errRes as any).error.cls, 'kota');
});

test('pollEvents → her olay RUNTIME_OBSERVED olur (olaylar fiili)', async () => {
  const { db, attemptId } = dispatched(undefined, { events: async () => [{ kind: 'thinking', at: 't', payload: {} }, { kind: 'tool', at: 't', payload: {} }] });
  const full: WorkerAdapter = { spawn: async () => ({ outcome: 'OK', externalSessionId: 's' }), lookup: async () => 'ALIVE', events: async () => [{ kind: 'thinking', at: 't', payload: {} }, { kind: 'tool', at: 't', payload: {} }] };
  const r = await pollEvents(db, full, attemptId);
  assert.equal(r.supported, true);
  assert.equal(r.count, 2);
  assert.equal((db.prepare("SELECT COUNT(*) c FROM events WHERE type='RUNTIME_OBSERVED'").get() as any).c, 2);
});
