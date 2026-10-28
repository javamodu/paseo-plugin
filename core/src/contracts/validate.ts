// B01 — Doğrulama girişi: zarf + tür-spesifik kapalı dal (if/then) + payloadHash bağı.
// Tek Ajv derlemesi: date-time formatı dahil zorlanır (ajv-formats).
// Kanıtsız-geçme kuralı: dal tutmazsa HATA zorunlu; boş payload nesnesi RED.
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import { CommandSchema, EventSchema, commandPayloadBranches, eventPayloadBranches } from './envelope.ts';
import { createHash } from 'node:crypto';

const ajv = new Ajv({ allErrors: true, strict: false });
// tip-borcu v9-06: ajv-formats'in nodenext tip cozumu cagrilabilir gostermiyor (runtime kanitli:
// dist/index.js module.exports = formatsPlugin + __esModule + exports.default). Bilinen cagri
// sekli lokal tipte soylenir — davranis degisimi YOK, yalnizca tip-duzey duzeltme.
(addFormats as unknown as (a: Ajv) => void)(ajv);

export function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonicalJson).join(',') + ']';
  const o = v as Record<string, unknown>;
  return '{' + Object.keys(o).sort().map((k) => JSON.stringify(k) + ':' + canonicalJson(o[k])).join(',') + '}';
}

export const payloadHashOf = (payload: unknown): string =>
  createHash('sha256').update(canonicalJson(payload)).digest('hex');

export type ValidationResult = { ok: boolean; errors: string[] };

function withClosedBranches(envelope: object, keyProp: string, branches: Record<string, object>) {
  const s = structuredClone(envelope) as any;
  s.allOf = Object.entries(branches).map(([k, branch]) => ({
    if: { properties: { [keyProp]: { const: k } }, required: [keyProp] },
    then: { properties: { payload: branch }, required: ['payload'] },
  }));
  // kapalı küme dışı kind/type zaten zarf enum'unda patlar; boş payload ise her
  // dalın required alanları sayesinde RED — ek kural gerekmez.
  return s;
}

const cmdValidator = ajv.compile(withClosedBranches(CommandSchema, 'kind', commandPayloadBranches));
const evValidator = ajv.compile(withClosedBranches(EventSchema, 'type', eventPayloadBranches));

function run(validate: any, value: unknown, payload: unknown, hash: unknown): ValidationResult {
  const ok = validate(value);
  const errors = (validate.errors ?? []).map(
    (e: any) => `${e.instancePath || '/'}: ${e.message}${e.allowedValues ? ' (kapalı küme: ' + e.allowedValues.join('|') + ')' : ''}`,
  );
  if (ok && typeof hash === 'string' && hash !== payloadHashOf(payload)) {
    errors.push('payloadHash canonical payload ile eşleşmiyor');
  }
  return { ok: ok && errors.length === 0, errors };
}

export const validateCommand = (cmd: any): ValidationResult =>
  run(cmdValidator, cmd, cmd?.payload, cmd?.payloadHash);
export const validateEvent = (ev: any): ValidationResult =>
  run(evValidator, ev, ev?.payload, ev?.payloadHash);
