// K-0006/metrik v3.1 + plan v2.7 §20.4-20.5 — 4-aşamalı diskrimine Handoff DTO'su.
// 'stage' alanı const diskriminatördür: PREPARE → PRODUCE → VERIFY → DELIVER; her aşama
// öncekinin alanlarını taşır ve kendi zorunlu bağlarını ekler (§20.4 tablosu).
// ÇEKİRDEĞİ KORUR: kapalı komut/olay SETİNE ekleme YOK; store/dispatcher şemasına DOKUNMAZ;
// semantik çapraz bağlar (attempt↔candidate↔grant↔suite) şemada değil store'da (§20.5).
// Ayna: src/handoff.schema.json bu birliğin JSON-Schema karşılığıdır (test iki yönlü doğrular).
import { Type, type Static } from '@sinclair/typebox';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';

const id = Type.String({ minLength: 1, maxLength: 128 });
const hex64 = Type.String({ pattern: '^[a-f0-9]{64}$' });
const txt = (max = 2000) => Type.String({ minLength: 1, maxLength: max });
// izinSnapshot/environment: başka kayıtların opak kopyaları — şema iç alanlarını dondurmaz (§20.5).
const snap = Type.Unsafe<Record<string, unknown>>({ type: 'object' });

const GrantSchema = Type.Object(
  { budget: Type.Integer({ minimum: 0 }), expiry: Type.String({ format: 'date-time' }) },
  { additionalProperties: false },
);
const TestResultSchema = Type.Object(
  { name: txt(256), result: Type.Union([Type.Literal('PASS'), Type.Literal('FAIL'), Type.Literal('UNKNOWN')]) },
  { additionalProperties: false },
);

const prepareFields = {
  stage: Type.Literal('PREPARE'),
  runId: id,
  parentTask: id,
  scope: txt(),
  grant: GrantSchema,
  evaluatorId: id,
  surum: Type.String({ minLength: 1, maxLength: 64 }),
};
const produceFields = {
  ...prepareFields,
  stage: Type.Literal('PRODUCE'),
  attemptId: id,
  candidateRef: txt(256),
  izinSnapshot: snap,
};
const verifyFields = {
  ...produceFields,
  stage: Type.Literal('VERIFY'),
  candidateHash: hex64,
  suiteHash: hex64,
  environment: snap,
  // §20.4: VERIFY 'gerçek test sonuçları' ister — boş dizi kabul EDİLMEZ.
  testResults: Type.Array(TestResultSchema, { minItems: 1 }),
};
const deliverFields = {
  ...verifyFields,
  stage: Type.Literal('DELIVER'),
  receiptId: id,
  artifactPaths: Type.Array(Type.String({ minLength: 1, maxLength: 512 }), { minItems: 1 }),
};

export const PrepareHandoffSchema = Type.Object(prepareFields, { additionalProperties: false });
export const ProduceHandoffSchema = Type.Object(produceFields, { additionalProperties: false });
export const VerifyHandoffSchema = Type.Object(verifyFields, { additionalProperties: false });
export const DeliverHandoffSchema = Type.Object(deliverFields, { additionalProperties: false });

// Union seviyesinde additionalProperties YOK: anyOf dışında properties tanımsız olduğundan
// her alan 'ek' sayılıp tüm paketleri RED eder; kapalılık dal şemalarında zaten var.
export const StageHandoffSchema = Type.Union([
  PrepareHandoffSchema,
  ProduceHandoffSchema,
  VerifyHandoffSchema,
  DeliverHandoffSchema,
]);

export type PrepareHandoff = Static<typeof PrepareHandoffSchema>;
export type ProduceHandoff = Static<typeof ProduceHandoffSchema>;
export type VerifyHandoff = Static<typeof VerifyHandoffSchema>;
export type DeliverHandoff = Static<typeof DeliverHandoffSchema>;
export type StageHandoff = Static<typeof StageHandoffSchema>;
export type HandoffStage = StageHandoff['stage'];

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const v = ajv.compile(StageHandoffSchema);

export function validateHandoff(p: unknown): { ok: boolean; errors: string[] } {
  const ok = v(p);
  return { ok: !!ok, errors: (v.errors ?? []).map((e) => (e.instancePath || '/') + ': ' + e.message) };
}

// dispatchNode YAZMA YOLUNDA çağrılır: geçersiz/eksik handoff → RED (fail-closed).
export function requireHandoff(p: unknown): StageHandoff {
  const r = validateHandoff(p);
  if (!r.ok) throw new Error('handoff geçersiz (plan §20.4): ' + r.errors.join('; '));
  return p as StageHandoff;
}

// dispatch yazma yolu PREPARE aşamasıyla konuşur (spawn öncesi paket).
export function sampleHandoff(runId: string, over: Record<string, unknown> = {}): PrepareHandoff {
  return {
    stage: 'PREPARE',
    runId,
    parentTask: 'task-' + runId,
    scope: 'src/**',
    grant: { budget: 100000, expiry: '2099-01-01T00:00:00Z' },
    evaluatorId: 'eval-1',
    surum: '1.0.0',
    ...over,
  } as PrepareHandoff;
}

// test/seed kolaylığı: istenen aşamada geçerli bir paket (kümülatif alanlar §20.4).
export function sampleStage(stage: HandoffStage, over: Record<string, unknown> = {}): StageHandoff {
  const prepare = sampleHandoff('run-1');
  if (stage === 'PREPARE') return { ...prepare, ...over } as StageHandoff;
  const produce = {
    ...prepare, stage: 'PRODUCE', attemptId: 'att-1',
    candidateRef: 'worktree://cand-1', izinSnapshot: { allow: ['src/**'] },
  };
  if (stage === 'PRODUCE') return { ...produce, ...over } as StageHandoff;
  const verify = {
    ...produce, stage: 'VERIFY', candidateHash: 'a'.repeat(64), suiteHash: 'b'.repeat(64),
    environment: { node: '24', os: 'win32' }, testResults: [{ name: 'suite', result: 'PASS' }],
  };
  if (stage === 'VERIFY') return { ...verify, ...over } as StageHandoff;
  return { ...verify, stage: 'DELIVER', receiptId: 'rcpt-1', artifactPaths: ['raporlar/x.md'], ...over } as StageHandoff;
}
