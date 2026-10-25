// B01 — Command/Event zarf şemaları: baseline alan listesi + KAPALI payload dalı.
// Baseline (schema.json) payload'u düz `object` bırakıyordu; buradaki discriminated
// union o boşluğu kapatır (ADR-011 K1). Zarf alanları baseline ile birebir test
// edilir: test/sync-baseline.test.ts.
import { Type, type TSchema } from '@sinclair/typebox';
import { commandPayloadBranches, commandKinds } from './command-payloads.ts';
import { eventPayloadBranches, eventTypes } from './event-payloads.ts';

const id = Type.String({ minLength: 1, maxLength: 128 });
const hex64 = Type.String({ pattern: '^[a-f0-9]{64}$' });
const nullable = (s: TSchema) => Type.Union([s, Type.Null()]);

export const CommandSchema = Type.Object(
  {
    id,
    runId: nullable(id),
    kind: Type.Union(commandKinds.map((k) => Type.Literal(k))),
    expectedVersion: nullable(Type.Integer({ minimum: 1 })),
    payloadHash: hex64,
    // (kind, payload) eşleşmesi validator kodunda dallarla yapılır; zarf şeması
    // payload'u nesne olarak tutar, dal zorlaması validateCommand'da ayrı hatadır.
    payload: Type.Object({}, { additionalProperties: true }),
  },
  { additionalProperties: false },
);

export const EventSchema = Type.Object(
  {
    id,
    sequence: Type.Integer({ minimum: 1 }),
    type: Type.Union(eventTypes.map((t) => Type.Literal(t))),
    runId: nullable(id),
    attemptId: nullable(id),
    causationId: id,
    actorId: id,
    createdAt: Type.String({ format: 'date-time' }),
    payload: Type.Object({}, { additionalProperties: true }),
  },
  { additionalProperties: false },
);

export { commandPayloadBranches, eventPayloadBranches };
