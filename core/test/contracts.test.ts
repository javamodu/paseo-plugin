// V3-S0.2 — Kapalı payload şemaları: pozitif + NEGATIF testler (A03 + K1).
// Negatifler K1'in gerçek kapanışıdır: boş payload / dal-kind uyuşmazlığı /
// unknown kind / fazladan alan / bozuk hash RED edilmeden bu dosya GEÇTİ sayılmaz.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCommand, validateEvent, payloadHashOf } from '../src/contracts/validate.ts';
import { commandKinds } from '../src/contracts/command-payloads.ts';
import { eventTypes } from '../src/contracts/event-payloads.ts';

const H = (p: unknown) => payloadHashOf(p);
const cmd = (kind: string, payload: object, over: object = {}) => ({
  id: 'c-1',
  runId: 'r-1',
  kind,
  expectedVersion: 1,
  payloadHash: H(payload),
  payload,
  ...over,
});

test('pozitif: her 12 command kind kendi dalıyla geçer', () => {
  const fixtures: Record<string, object> = {
    PROPOSE_PLAN: { capsuleId: 'cap-1', goal: 'paneli kur' },
    APPROVE_PLAN: { runId: 'r-1', planHash: 'a'.repeat(64), expectedRunVersion: 2 },
    START_RUN: { runId: 'r-1', planHash: 'a'.repeat(64), idempotencyKey: 'k-1' },
    MESSAGE_MANAGER: { text: 'devam et' },
    PAUSE_RUN: { runId: 'r-1', reason: 'durakala' },
    RESUME_RUN: { runId: 'r-1', reason: 'döndü' },
    CANCEL_RUN: { runId: 'r-1', reason: 'vazgeç' },
    GLOBAL_STOP: { reason: 'acil' },
    CLEAR_STOP: { reason: 'onayli temizlik', confirmText: 'I understand the risk' },
    RERUN: { runId: 'r-1', idempotencyKey: 'k-2' },
    DECIDE_APPROVAL: { approvalId: 'ap-1', decision: 'APPROVED', expectedRunVersion: 3 },
    UPDATE_PROFILE: { profileId: 'p-1', newVersion: 2, changeSummary: 'derin kademe', approvalId: 'ap-2' },
  };
  assert.deepEqual(Object.keys(fixtures).sort(), [...commandKinds].sort(), 'fixture-kim kind listesi senkron değil');
  for (const [kind, payload] of Object.entries(fixtures)) {
    const r = validateCommand(cmd(kind, payload));
    assert.ok(r.ok, `${kind} geçmeliydi: ${r.errors.join('; ')}`);
  }
});

test('NEGATIF K1: boş payload {} her kind için RED', () => {
  for (const kind of commandKinds) {
    const r = validateCommand({ id: 'c-2', runId: null, kind, expectedVersion: null, payloadHash: H({}), payload: {} });
    assert.ok(!r.ok, `${kind}: boş payload KABUL EDİLDİ — K1 kapanmamış!`);
  }
});

test('NEGATIF: kapalı küme dışı kind RED', () => {
  const r = validateCommand(cmd('DELETE_EVERYTHING', { reason: 'kötü' }));
  assert.ok(!r.ok && r.errors.some((e) => e.includes('kind')), `expected RED, got ${JSON.stringify(r)}`);
});

test('NEGATIF: kind ile yanlış dalın payload uyuşmazlığı RED', () => {
  // GLOBAL_STOP dalı runId istemez; CANCEL_RUN dalı runId ister
  const wrong = validateCommand(cmd('GLOBAL_STOP', { runId: 'r-9', reason: 'acil' }));
  assert.ok(!wrong.ok, 'GLOBAL_STOP extra runId almamalı');
  const wrong2 = validateCommand(cmd('CANCEL_RUN', { reason: 'sadece-reason' }));
  assert.ok(!wrong2.ok, 'CANCEL_RUN runId-siz geçmemeli');
});

test('NEGATIF: fazladan alan (additionalProperties) RED', () => {
  const r = validateCommand(cmd('START_RUN', { runId: 'r-1', planHash: 'b'.repeat(64), idempotencyKey: 'k', sneaky: true }));
  assert.ok(!r.ok, 'sneaky alanı geçmemeli');
});

test('NEGATIF: payloadHash tutarsızlığı RED (kanıt bağı)', () => {
  const c = cmd('GLOBAL_STOP', { reason: 'acil' });
  c.payload = { reason: 'sonradan değiştirildi' };
  const r = validateCommand(c);
  assert.ok(!r.ok, 'hash payload ile bağlanmadan geçmemeli');
});

test('NEGATIF: CLEAR_STOP risk-onay metni olmadan geçmez', () => {
  const r = validateCommand(cmd('CLEAR_STOP', { reason: 'temizle' }));
  assert.ok(!r.ok, 'confirmText zorunlu');
});

// ---- Event tarafı ----
const ev = (type: string, payload: object) => ({
  id: 'e-1',
  sequence: 1,
  type,
  runId: 'r-1',
  attemptId: null,
  causationId: 'c-1',
  actorId: 'core',
  createdAt: '2026-10-13T10:00:00Z',
  payloadHash: undefined,
  payload,
});

test('pozitif: örnek olaylar dalıyla geçer; 31 türün tamamı kapalı kümede', () => {
  assert.equal(eventTypes.length, 31, 'baseline Event.type 31 tür');
  const cases: Array<[string, object]> = [
    ['DISPATCH_RESERVED', { runId: 'r-1', nodeId: 'n-1', attemptId: 'a-1', reservedTokens: 100, fencingToken: 3 }],
    ['CANDIDATE_FROZEN', { attemptId: 'a-1', candidateHash: 'c'.repeat(64) }],
    ['EVIDENCE_RECORDED', { attemptId: 'a-1', evidenceId: 'ev-1', verdict: 'PASS', testCount: 12 }],
    ['NODE_SKIPPED', { runId: 'r-1', nodeId: 'n-2', reason: 'operator-skip', approvalId: 'ap-9' }],
    ['REPAIR_REQUESTED', { attemptId: 'a-1', failureSignature: 'sig-1', repairAttempt: 2 }],
  ];
  for (const [t, p] of cases) {
    const e = ev(t, p);
    delete (e as any).payloadHash; // Event zarfında hash alanı yok (baseline)
    const r = validateEvent(e);
    assert.ok(r.ok, `${t} geçmeliydi: ${r.errors.join('; ')}`);
  }
});

test('NEGATIF K1: boş payload event dalında da RED', () => {
  const e = ev('CANDIDATE_FROZEN', {});
  delete (e as any).payloadHash;
  const r = validateEvent(e);
  assert.ok(!r.ok, 'boş CANDIDATE_FROZEN payload KABUL edilemez');
});

test('NEGATIF: bounded repair aşılamaz (repairAttempt 3 RED) — A09 bağlantısı', () => {
  const e = ev('REPAIR_REQUESTED', { attemptId: 'a-1', failureSignature: 's', repairAttempt: 3 });
  delete (e as any).payloadHash;
  assert.ok(!validateEvent(e).ok);
});

test('NEGATIF: sahte PASS — testCount 0 + verdict PASS veri düzeyinde yasal ama...', () => {
  // Şema bunu yakalamaz (yetki korunan evaluator/A13); burada amaç BELGELENMİŞ sınır:
  const e = ev('EVIDENCE_RECORDED', { attemptId: 'a-1', evidenceId: 'ev-2', verdict: 'PASS', testCount: 0 });
  delete (e as any).payloadHash;
  assert.ok(validateEvent(e).ok, 'şema düzeyinde geçer');
  // A13 kapısı store katmanındadır: 0-test PASS kabul edilmez (S1'de kanıtlanacak).
});

test('NEGATIF: date-time formatı zorunlu (createdAt bozuğu RED)', () => {
  const e = ev('RUN_CREATED', { runId: 'r-1', planId: 'p-1' });
  e.createdAt = 'dün';
  delete (e as any).payloadHash;
  assert.ok(!validateEvent(e).ok);
});

test('NEGATIF: Node 24 type-stripping zinciri çalışıyor (meta-sağlık)', () => {
  assert.ok(typeof validateCommand === 'function');
});
