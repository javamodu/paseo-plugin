// D2 / M08-M10 schedule hermetik kanıtı. Çekirdek kapalı komut/olay setine dokunmaz:
// schedule.ts SAF mantıktır; dispatch'i gerçek supervisor.write-path yapar (ENT integrasyon).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planOccurrences, occurrencesUpTo, occurrenceKey, validateScheduleSpec, settleKeys,
  type ScheduleSpec, type GateState,
} from '../src/schedule.ts';
import { openStore, setGlobalStop } from '../src/store.ts';
import { createRunPlan, approvePlan, ensureStartCommand, dispatchNode } from '../src/supervisor.ts';
import { sampleHandoff } from '../src/handoff.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);
const S = (o: Partial<ScheduleSpec> = {}): ScheduleSpec => ({
  scheduleId: 'sch-1', revision: 1, kind: 'INTERVAL',
  startAt: '2026-01-01T00:00:00.000Z', intervalMs: 3_600_000, ...o,
});
const G = (o: Partial<GateState> = {}): GateState => ({
  stopLatched: false, grantActive: true, overlapActive: false, settled: new Set(), ...o,
});
const ms = (s: string) => Date.parse(s);

test('M09 determinizm: UTC interval tam ve tekrarlanabilir (DST işlenmez)', () => {
  const occ = occurrencesUpTo(S(), ms('2026-01-01T04:30:00Z'));
  assert.deepEqual(occ.map((d) => d.toISOString()), [
    '2026-01-01T00:00:00.000Z', '2026-01-01T01:00:00.000Z', '2026-01-01T02:00:00.000Z',
    '2026-01-01T03:00:00.000Z', '2026-01-01T04:00:00.000Z',
  ]);
  // aynı girdi = aynı çıktı (yanlış/deterministik olmayan saat hesabı yok)
  assert.deepEqual(occurrencesUpTo(S(), ms('2026-01-01T04:30:00Z')).map(isoOf), occ.map(isoOf));
});

const isoOf = (d: Date) => d.toISOString();

test('M09 TZ dürüstlüğü: non-UTC reddedilir (sessiz cron/DST vaadi yok)', () => {
  assert.ok(validateScheduleSpec(S({ tz: 'Europe/Istanbul' })).some((e) => /UTC/.test(e)));
  assert.deepEqual(validateScheduleSpec(S({ tz: 'UTC' })), []);
});

test('spec geçersizse planlama patlar (fail-closed, sessiz geçmez)', () => {
  assert.throws(() => planOccurrences(S({ kind: 'INTERVAL', intervalMs: 0 }), ms('2026-01-01T02:00:00Z'), G()), /intervalMs/);
  assert.throws(() => planOccurrences(S({ deadlineAt: '2025-01-01T00:00:00Z' }), ms('2026-01-01T02:00:00Z'), G()), /deadlineAt startAt/);
});

test('M08 occurrence benzersizliği: yerleşen tekrar üretilmez; revizyon değişince yeni kimlik', () => {
  const spec = S({ kind: 'ONCE' });
  const r1 = planOccurrences(spec, ms('2026-01-01T05:00:00Z'), G());
  assert.equal(r1.emit.length, 1);
  const settled = new Set(settleKeys(spec, r1));
  const r2 = planOccurrences(spec, ms('2026-01-01T05:00:00Z'), G({ settled }));
  assert.equal(r2.emit.length, 0, 'aynı occurrence iki kez dispatch EDİLMEZ');
  // revizyon bump → farklı occurrenceKey → aynı an yeniden hak edebilir
  const keyA = occurrenceKey(spec, r1.emit[0]);
  const keyB = occurrenceKey(S({ kind: 'ONCE' }), r1.emit[0]); // rev 1 again
  assert.equal(keyA, keyB);
  assert.notEqual(occurrenceKey(S({ kind: 'ONCE', revision: 2 }), r1.emit[0]), keyA);
});

test('M10 misfire: daemon durdu — catch-up fırtınası YOK, yalnız en son hak eder', () => {
  const r = planOccurrences(S(), ms('2026-01-01T05:00:00Z'), G()); // 00..05 = 6 occurrence
  assert.equal(r.emit.length, 1);
  assert.equal(r.emit[0].toISOString(), '2026-01-01T05:00:00.000Z');
  assert.equal(r.skipped.filter((s) => s.reason === 'MISFIRE_SKIPPED').length, 5);
  // yerleştir → sonraki turda hiçbir şey yüzmez
  const settled = new Set(settleKeys(S(), r));
  assert.deepEqual(planOccurrences(S(), ms('2026-01-01T05:00:00Z'), G({ settled })).emit, []);
});

test('M10 overlap: önceki run aktifken yeni BİNMEZ; bitince aynı occurrence denenir', () => {
  const spec = S({ kind: 'ONCE' });
  const r = planOccurrences(spec, ms('2026-01-01T05:00:00Z'), G({ overlapActive: true }));
  assert.equal(r.emit.length, 0);
  assert.ok(r.skipped.some((s) => s.reason === 'OVERLAP_SKIPPED'));
  assert.deepEqual(settleKeys(spec, r), [], 'overlap KALICI silinmez (adil yeniden deneme)');
  // overlap kalktı → aynı occurrence şimdi hak eder
  assert.equal(planOccurrences(spec, ms('2026-01-01T05:00:00Z'), G()).emit.length, 1);
});

test('GÜVENLİK: STOP/revoke emit etmez ve kalıcı yerleştirmez (kalkınca yeniden denenir)', () => {
  const r = planOccurrences(S(), ms('2026-01-01T05:00:00Z'), G({ stopLatched: true }));
  assert.equal(r.emit.length, 0);
  assert.ok(r.skipped.every((s) => s.reason === 'STOPPED'));
  assert.deepEqual(settleKeys(S(), r), []);
  const g = planOccurrences(S(), ms('2026-01-01T05:00:00Z'), G({ grantActive: false }));
  assert.equal(g.emit.length, 0);
  assert.ok(g.skipped.every((s) => s.reason === 'GRANT_REVOKED'));
});

test('DEADLINE: geç occurrence DEADLINE_PASSED, emit edilmez, yerleşir', () => {
  const r = planOccurrences(S({ deadlineAt: '2026-01-01T02:00:00Z' }), ms('2026-01-01T04:00:00Z'), G());
  assert.ok(r.skipped.some((s) => s.reason === 'DEADLINE_PASSED' && s.at.toISOString() === '2026-01-01T03:00:00.000Z'));
  assert.ok(r.skipped.some((s) => s.reason === 'DEADLINE_PASSED' && s.at.toISOString() === '2026-01-01T04:00:00.000Z'));
  assert.equal(r.emit[0].toISOString(), '2026-01-01T02:00:00.000Z', 'yalnız deadline içi en son hak eder');
});

test('ENTEGRAZYON: hak edilen occurrence gerçek supervisor yazma yoluna akar (yeni kind yok)', () => {
  const db = openStore();
  setGlobalStop(db, false, 'op', 'acilis');
  const planHash = createRunPlan(db, {
    capsuleId: 'cap-1', goal: 'g', repoId: 'r', sourceCommit: H64('c'),
    runId: 'run-1', planId: 'plan-1', profileHash: H64('p'), nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 5,
  }).planHash;
  const startCmd = ensureStartCommand(db, 'run-1', planHash, 'sched');
  approvePlan(db, 'run-1', planHash, 'human');
  const r = planOccurrences(S({ kind: 'ONCE' }), ms('2026-01-01T05:00:00Z'), G());
  assert.equal(r.emit.length, 1);
  const dk = 'sched-' + occurrenceKey(S({ kind: 'ONCE' }), r.emit[0]);
  const d = dispatchNode(db, 'run-1', 'n1', { tokens: 1000, startCommandId: startCmd, dispatchKey: dk, handoff: sampleHandoff('n1') });
  assert.equal(d.status, 'DISPATCHED', 'schedule → gerçek dispatch (kapalı sözleşme bozulmadan)');
});
