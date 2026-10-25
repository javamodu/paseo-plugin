// B01 — Kapalı Command payload dalları (ADR-011/K1 kapanışı).
// Kaynak alan listesi: kapsul-final-v2.0.0 notio/contracts/schema.json "Command".
// Kural: her `kind` İÇİN bir dal zorunlu; boş `{}` object RED. Dal anahtarları
// test/sync-baseline.test.ts ile baseline şeması ile karşılaştırılır — senkron
// bozulursa fail-closed.
import { Type, type TSchema } from '@sinclair/typebox';

const id = Type.String({ minLength: 1, maxLength: 128 });
const hex64 = Type.String({ pattern: '^[a-f0-9]{64}$' });

export const commandPayloadBranches: Record<string, TSchema> = {
  PROPOSE_PLAN: Type.Object(
    {
      capsuleId: id,
      goal: Type.String({ minLength: 1, maxLength: 2000 }),
      constraints: Type.Optional(Type.String({ maxLength: 4000 })),
    },
    { additionalProperties: false },
  ),
  APPROVE_PLAN: Type.Object(
    { runId: id, planHash: hex64, expectedRunVersion: Type.Integer({ minimum: 1 }) },
    { additionalProperties: false },
  ),
  START_RUN: Type.Object(
    { runId: id, planHash: hex64, idempotencyKey: id },
    { additionalProperties: false },
  ),
  MESSAGE_MANAGER: Type.Object(
    { runId: Type.Optional(id), text: Type.String({ minLength: 1, maxLength: 8000 }) },
    { additionalProperties: false },
  ),
  PAUSE_RUN: Type.Object(
    { runId: id, reason: Type.String({ minLength: 1, maxLength: 500 }) },
    { additionalProperties: false },
  ),
  RESUME_RUN: Type.Object(
    { runId: id, reason: Type.String({ minLength: 1, maxLength: 500 }) },
    { additionalProperties: false },
  ),
  CANCEL_RUN: Type.Object(
    { runId: id, reason: Type.String({ minLength: 1, maxLength: 500 }) },
    { additionalProperties: false },
  ),
  GLOBAL_STOP: Type.Object(
    { reason: Type.String({ minLength: 1, maxLength: 500 }) },
    { additionalProperties: false },
  ),
  CLEAR_STOP: Type.Object(
    { reason: Type.String({ minLength: 1, maxLength: 500 }), confirmText: Type.Literal('I understand the risk') },
    { additionalProperties: false },
  ),
  RERUN: Type.Object(
    { runId: id, fromNodeId: Type.Optional(id), idempotencyKey: id },
    { additionalProperties: false },
  ),
  DECIDE_APPROVAL: Type.Object(
    {
      approvalId: id,
      decision: Type.Union([Type.Literal('APPROVED'), Type.Literal('REJECTED')]),
      note: Type.Optional(Type.String({ maxLength: 2000 })),
      expectedRunVersion: Type.Integer({ minimum: 1 }),
    },
    { additionalProperties: false },
  ),
  UPDATE_PROFILE: Type.Object(
    {
      profileId: id,
      newVersion: Type.Integer({ minimum: 1 }),
      changeSummary: Type.String({ minLength: 1, maxLength: 2000 }),
      approvalId: id, // profil değişimi ONAYSIZ olamaz (F1/30-ogrenme)
    },
    { additionalProperties: false },
  ),
};

export const commandKinds = Object.keys(commandPayloadBranches);
