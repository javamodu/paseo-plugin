// Plan v2.7 §20.4-20.5 — 4-aşamalı diskrimine Handoff DTO'su. Hermetik kanıt:
// her aşama pozitif + negatif (yanlış aşama alanı RED), kapalı nesne (ek alan RED),
// JSON-Schema aynası (src/handoff.schema.json) typebox ile aynı kararı verir,
// dispatchNode YAZMA YOLUNDA geçersiz handoff'u RED eder (fail-closed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import { openStore, setGlobalStop } from '../src/store.ts';
import { createRunPlan, approvePlan, ensureStartCommand, dispatchNode } from '../src/supervisor.ts';
import { validateHandoff, requireHandoff, sampleHandoff, sampleStage } from '../src/handoff.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);
const jsonSchema = JSON.parse(readFileSync(new URL('../src/handoff.schema.json', import.meta.url), 'utf8'));
const ajvJson = new Ajv({ allErrors: true, strict: false });
addFormats(ajvJson);
const validateJson = ajvJson.compile(jsonSchema);

// İki şema (typebox ↔ handoff.schema.json) aynı vektörde aynı kararı vermeli.
function bothAgree(p: unknown, expected: boolean) {
  assert.equal(validateHandoff(p).ok, expected, 'typebox kararı');
  assert.equal(validateJson(p), expected, 'handoff.schema.json kararı');
}

test('PREPARE pozitif: spawn öncesi paket geçer', () => {
  bothAgree(sampleStage('PREPARE'), true);
  bothAgree(sampleHandoff('n1'), true); // dispatch uyumluluk örneği
});

test('PREPARE negatif: candidateRef/testResults henüz YOK → RED; zorunlu alan eksik → RED', () => {
  bothAgree({ ...sampleStage('PREPARE') as object, candidateRef: 'x' }, false);
  bothAgree({ ...sampleStage('PREPARE') as object, testResults: [{ name: 't', result: 'PASS' }] }, false);
  const noGrant = sampleStage('PREPARE') as any; delete noGrant.grant;
  bothAgree(noGrant, false);
});

test('PRODUCE pozitif: attemptId+candidateRef+izinSnapshot ile geçer', () => {
  bothAgree(sampleStage('PRODUCE'), true);
});

test('PRODUCE negatif: candidateRef eksik → RED; verify alanı (candidateHash) erken → RED', () => {
  const noRef = sampleStage('PRODUCE') as any; delete noRef.candidateRef;
  bothAgree(noRef, false);
  bothAgree({ ...sampleStage('PRODUCE') as object, candidateHash: H64('a') }, false);
});

test('VERIFY pozitif: sabit candidate + gerçek test sonuçları ile geçer', () => {
  bothAgree(sampleStage('VERIFY'), true);
});

test('VERIFY negatif: boş testResults RED; receiptId erken RED; hash bozuk RED', () => {
  bothAgree(sampleStage('VERIFY', { testResults: [] }), false);
  bothAgree({ ...sampleStage('VERIFY') as object, receiptId: 'r1' }, false);
  bothAgree(sampleStage('VERIFY', { candidateHash: 'deadbeef' }), false);
});

test('DELIVER pozitif: receiptId + artefakt yolları ile geçer', () => {
  bothAgree(sampleStage('DELIVER'), true);
});

test('DELIVER negatif: receiptId eksik RED; boş artifactPaths RED', () => {
  const noReceipt = sampleStage('DELIVER') as any; delete noReceipt.receiptId;
  bothAgree(noReceipt, false);
  bothAgree(sampleStage('DELIVER', { artifactPaths: [] }), false);
});

test('diskriminatör: bilinmeyen stage RED; stage taklidi (PRODUCE alanlarıyla PREPARE) RED', () => {
  bothAgree(sampleStage('PREPARE', { stage: 'DEPLOY' }), false);
  const fake = sampleStage('PRODUCE') as any; fake.stage = 'PREPARE';
  bothAgree(fake, false); // PREPARE'da attemptId/candidateRef ek alan → RED
});

test('KAPALI nesne: ek alan (sır/SDK blob) her aşamada RED', () => {
  for (const st of ['PREPARE', 'PRODUCE', 'VERIFY', 'DELIVER'] as const) {
    bothAgree({ ...sampleStage(st) as object, sdkBlob: { s: 'x' } }, false);
  }
});

test('grant kapısı: negatif bütçe RED; bozuk tarih RED', () => {
  bothAgree(sampleStage('PREPARE', { grant: { budget: -1, expiry: '2099-01-01T00:00:00Z' } }), false);
  bothAgree(sampleStage('PREPARE', { grant: { budget: 1, expiry: 'yarin' } }), false);
});

test('test sonucu enumu: PASS|FAIL|UNKNOWN — uydurma sonuç RED', () => {
  bothAgree(sampleStage('VERIFY', { testResults: [{ name: 't', result: 'MAYBE' }] }), false);
  bothAgree(sampleStage('VERIFY', { testResults: [{ name: 't', result: 'UNKNOWN' }] }), true);
});

test('requireHandoff geçersizde fırlatır (fail-closed)', () => {
  assert.throws(() => requireHandoff({ runId: 'r' }), /handoff/);
  assert.throws(() => requireHandoff(sampleStage('VERIFY', { suiteHash: 'zz' })), /handoff/);
});

test('ENTegrasyon: dispatchNode GEÇERSİZ handoff ile RED — PREPARE paketiyle geçer', () => {
  const db = openStore();
  setGlobalStop(db, false, 'op', 'acilis');
  const planHash = createRunPlan(db, {
    capsuleId: 'cap-1', goal: 'g', repoId: 'r', sourceCommit: H64('c'),
    runId: 'run-1', planId: 'plan-1', profileHash: H64('p'), nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 5,
  }).planHash;
  const startCmd = ensureStartCommand(db, 'run-1', planHash, 'op');
  approvePlan(db, 'run-1', planHash, 'human');
  assert.throws(() => dispatchNode(db, 'run-1', 'n1', { tokens: 1000, startCommandId: startCmd, dispatchKey: 'kb', handoff: { kötü: 1 } }), /handoff/);
  const d = dispatchNode(db, 'run-1', 'n1', { tokens: 1000, startCommandId: startCmd, dispatchKey: 'kg', handoff: sampleHandoff('n1') });
  assert.equal(d.status, 'DISPATCHED');
});
