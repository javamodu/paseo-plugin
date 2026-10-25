// Receipt tam-bag dogrulayicisi (SSOT §7 14-alan receipt + §20.4/§20.5 uc katman).
// JSON schema yalniz SEKIL dogrular; 8 semantik bag (run / attempt / candidate /
// evaluator / environment / plan-policy / grant / fence) burada STORE SORGUSUyla
// dogrulanir — schema'ya yazilmaz (§20.5). Kayit denklemi:
//   evaluatorRegistry[id, surum].suiteHash == receipt.suiteHash
// Bes iliski bulunmasi yetmez: TAMAMI eslesmeli (fail-closed; tek kirilan bag = RED).
// Not: kriptografik imza dogrulamasi ayri guven siniri katmanidir (§20.5 katman-3);
// bu modul iliskisel baglari dogrular, verifySignature callback'i verilirse uygular.
import { Type, type Static } from '@sinclair/typebox';
import { Ajv } from 'ajv';
import type { DatabaseSync } from 'node:sqlite';
import { GateError } from './store.ts';

const id = Type.String({ minLength: 1, maxLength: 128 });
const hex64 = Type.String({ pattern: '^[a-f0-9]{64}$' });
const HEX64 = /^[a-f0-9]{64}$/;

export const VerificationReceiptSchema = Type.Object(
  {
    candidateHash: hex64,               // donmus aday (attempts.candidate_hash)
    suiteHash: hex64,                   // evaluator suite hash'i (registry denklemi)
    evaluatorId: id,
    evaluatorVersion: Type.String({ minLength: 1, maxLength: 64 }),
    attemptId: id,
    environment: hex64,                 // evidence.environment_hash
    startedAt: Type.String({ minLength: 1, maxLength: 64 }),
    finishedAt: Type.String({ minLength: 1, maxLength: 64 }),
    exitCodes: Type.Array(Type.Integer(), { minItems: 1 }),
    testCounts: Type.Object(
      { passed: Type.Integer({ minimum: 0 }), failed: Type.Integer({ minimum: 0 }) },
      { additionalProperties: false },
    ),
    artifacts: Type.Array(hex64, { minItems: 1 }),
    fenceToken: Type.Integer({ minimum: 1 }),
    correlationId: id,                  // run korelasyonu (attempt.run_id)
    signature: Type.String({ minLength: 1, maxLength: 512 }),
    grantId: id,                        // PREPARE baglantisinin receipt'e tasimasi (§20.4)
    scope: Type.Array(Type.String({ minLength: 1, maxLength: 128 }), { minItems: 1 }),
  },
  { additionalProperties: false },
);

export type VerificationReceipt = Static<typeof VerificationReceiptSchema>;

const ajv = new Ajv({ allErrors: true, strict: false });
const shapeValidator = ajv.compile(VerificationReceiptSchema);

export function validateReceiptShape(p: unknown): { ok: boolean; errors: string[] } {
  const ok = shapeValidator(p);
  return { ok: !!ok, errors: (shapeValidator.errors ?? []).map((e) => `${e.instancePath || '/'}: ${e.message}`) };
}

// evaluator registry: [evaluatorId][surum] -> suiteHash kaydi (revoke/rotation politikasi burada)
export interface EvaluatorRegistryEntry { suiteHash: string; revoked?: boolean }
export type EvaluatorRegistry = Record<string, Record<string, EvaluatorRegistryEntry>>;

// grant registry: budget+expiry+scope baglantisinin policy tarafi (§20.4 PREPARE)
export interface ReceiptGrant { attemptId: string; scope: string[]; expiresAt: string; revoked?: boolean }
export type GrantRegistry = Record<string, ReceiptGrant>;

export interface ReceiptLinkContext {
  evaluatorRegistry: EvaluatorRegistry;
  grants: GrantRegistry;
  now?: () => Date;
  verifySignature?: (r: VerificationReceipt) => boolean;
}

export interface ReceiptLinkReport { ok: boolean; failures: string[] }

export function verifyReceiptLinks(db: DatabaseSync, p: unknown, ctx: ReceiptLinkContext): ReceiptLinkReport {
  const shape = validateReceiptShape(p);
  if (!shape.ok) return { ok: false, failures: shape.errors.map((e) => 'sema: ' + e) };
  const r = p as VerificationReceipt;
  const failures: string[] = [];
  const now = ctx.now?.() ?? new Date();

  const attempt = db.prepare(
    'SELECT id,run_id,state,candidate_hash,fencing_token,grant_id FROM attempts WHERE id=?',
  ).get(r.attemptId) as any;

  // ---- attempt bagi ----
  if (!attempt) failures.push('attempt bagi: attempt storeda yok');

  // ---- run bagi ----
  if (attempt) {
    const run = db.prepare('SELECT id,state,plan_id FROM runs WHERE id=?').get(attempt.run_id) as any;
    if (!run) {
      failures.push('run bagi: attemptin runi storeda yok');
    } else {
      if (r.correlationId !== run.id) failures.push('run bagi: correlationId run ile eslesmiyor');
      if (run.state === 'CANCELLED' || run.state === 'FAILED') {
        failures.push(`run bagi: run ${run.state} durumunda — receipt kabul edilemez`);
      }
      // ---- plan-policy bagi: run -> donmus plan hash zinciri saglam mi ----
      const plan = db.prepare('SELECT plan_hash,policy_hash FROM plans WHERE id=?').get(run.plan_id) as any;
      if (!plan || !HEX64.test(plan.plan_hash) || !HEX64.test(plan.policy_hash)) {
        failures.push('plan-policy bagi: run donmus plan/policy hash zincirine bagli degil');
      }
    }

    // ---- candidate bagi: receipt donmus adayin kendisine bagli olmali ----
    if (attempt.state !== 'CANDIDATE_FROZEN' && attempt.state !== 'ACCEPTED') {
      failures.push(`candidate bagi: aday donmus degil (state=${attempt.state})`);
    }
    if (attempt.candidate_hash !== r.candidateHash) {
      failures.push('candidate bagi: candidateHash donmus adayla eslesmiyor');
    }

    // ---- fence bagi: sunulan token guncel fence olmali (A36) ----
    if (attempt.fencing_token !== r.fenceToken) {
      failures.push(`fence bagi: stale fence — sunulan=${r.fenceToken} guncel=${attempt.fencing_token}`);
    }

    // ---- environment bagi: attempt+bu environment hash'li gercek kanit satiri ----
    const ev = db.prepare(
      'SELECT artifact_hash,environment_hash,exit_code,verdict,test_count FROM evidence WHERE attempt_id=? AND environment_hash=? LIMIT 1',
    ).get(r.attemptId, r.environment) as any;
    if (!ev) {
      failures.push('environment bagi: attempt+environment eslesen kanit kaydi yok');
    } else {
      if (!r.exitCodes.includes(ev.exit_code)) {
        failures.push(`environment bagi: kanit exit_code=${ev.exit_code} receipt exitCodes icinde yok`);
      }
      if (ev.test_count !== r.testCounts.passed + r.testCounts.failed) {
        failures.push('environment bagi: testCounts toplami kanit test_count ile eslesmiyor');
      }
      const claimsPass = r.exitCodes.every((c) => c === 0) && r.testCounts.failed === 0 && r.testCounts.passed > 0;
      if (claimsPass && ev.verdict !== 'PASS') failures.push('environment bagi: receipt PASS iddia ediyor ama kanit PASS degil (A13)');
      if (!claimsPass && ev.verdict === 'PASS') failures.push('environment bagi: kanit PASS ama receipt PASS iddia etmiyor');
      if (!r.artifacts.includes(ev.artifact_hash)) {
        failures.push('environment bagi: kanit artefakti receipt artifacts listesinde yok');
      }
    }
    // ---- R3/SS16 grant store bagi: attempt.grant_id doluysa defter capraz-bagi zorunlu ----
    // grant defterde var + bu run'i kapsiyor + receipt.grantId = attempt.grant_id + ACTIVE + suresi dolmamis.
    // Dogrulanamayan bag = RED (dogrulanmayan asama gecisi yok); grant'siz attempt (NULL) bu kapsam disi.
    if (attempt.grant_id) {
      const g = db.prepare('SELECT id,run_id,state,expires_at FROM grants WHERE id=?').get(attempt.grant_id) as any;
      if (!g) {
        failures.push('grant bagi(store): attempt.grant_id defterde yok');
      } else {
        if (r.grantId !== g.id) failures.push('grant bagi(store): receipt grantId attempt.grant_id ile eslesmiyor');
        if (g.run_id !== attempt.run_id) failures.push('grant bagi(store): grant attempt runini kapsamiyor');
        if (g.state !== 'ACTIVE') failures.push(`grant bagi(store): grant ACTIVE degil (${g.state})`);
        if (db.prepare("SELECT 1 AS x FROM grants WHERE id=? AND expires_at < datetime('now')").get(g.id)) {
          failures.push('grant bagi(store): grant suresi dolmus');
        }
      }
    }
    for (const hash of r.artifacts) {
      if (!db.prepare('SELECT 1 AS x FROM artifacts WHERE hash=?').get(hash)) {
        failures.push(`environment bagi: artefakt storeda yok (${hash.slice(0, 12)}…)`);
      }
    }
  }

  // ---- evaluator bagi: KAYIT DENKLEMI (§20.5) ----
  const entry = ctx.evaluatorRegistry[r.evaluatorId]?.[r.evaluatorVersion];
  if (!entry) {
    failures.push(`evaluator bagi: registry kaydi yok (${r.evaluatorId}@${r.evaluatorVersion})`);
  } else {
    if (entry.revoked) failures.push('evaluator bagi: registry kaydi revoke edilmis');
    if (entry.suiteHash !== r.suiteHash) {
      failures.push('evaluator bagi: suiteHash denklemi bozuk — registry[id,surum].suiteHash != receipt.suiteHash');
    }
  }

  // ---- grant bagi: budget+expiry+scope (§20.4 PREPARE) ----
  const grant = ctx.grants[r.grantId];
  if (!grant) {
    failures.push('grant bagi: grant registryde yok');
  } else {
    if (grant.revoked) failures.push('grant bagi: grant revoke edilmis');
    if (!(Date.parse(grant.expiresAt) > now.getTime())) failures.push('grant bagi: grant suresi dolmus');
    if (grant.attemptId !== r.attemptId) failures.push('grant bagi: grant bu attempte bagli degil');
    const outOfScope = r.scope.filter((s) => !grant.scope.includes(s));
    if (outOfScope.length > 0) failures.push('grant bagi: kapsam disi scope — ' + outOfScope.join(','));
  }

  // ---- zaman sira sagligi + imza (guven siniri katmani, §20.5 katman-3) ----
  if (Date.parse(r.finishedAt) < Date.parse(r.startedAt)) failures.push('zaman bagi: finishedAt < startedAt');
  if (ctx.verifySignature && !ctx.verifySignature(r)) failures.push('imza bagi: signature dogrulanamadi');

  return { ok: failures.length === 0, failures };
}

// Fail-closed varyant: tek kirilan bag = RED (dogrulanmayan asama gecisi reddedilir, §20.4).
export function requireReceiptLinks(db: DatabaseSync, p: unknown, ctx: ReceiptLinkContext): VerificationReceipt {
  const report = verifyReceiptLinks(db, p, ctx);
  if (!report.ok) throw new GateError('receipt tam-bag RED: ' + report.failures.join('; '));
  return p as VerificationReceipt;
}
