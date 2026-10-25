// B01 — Kapalı Event payload dalları (ADR-011/K1 kapanışı).
// Kaynak küme: kapsul-final-v2.0.0 notio/contracts/schema.json "Event".type (31 tür).
// Kural: her olay türü İÇİN dal; dal yoksa sync testi patlar (fail-closed).
import { Type, type TSchema } from '@sinclair/typebox';

const id = Type.String({ minLength: 1, maxLength: 128 });
const hex64 = Type.String({ pattern: '^[a-f0-9]{64}$' });
const txt = (max = 2000) => Type.String({ minLength: 1, maxLength: max });
const obj = (props: Record<string, TSchema>) =>
  Type.Object(props, { additionalProperties: false });

export const eventPayloadBranches: Record<string, TSchema> = {
  CAPSULE_CREATED: obj({ capsuleId: id, goalHash: hex64 }),
  PLAN_PROPOSED: obj({ planId: id, planHash: hex64, nodeCount: Type.Integer({ minimum: 1 }) }),
  PLAN_APPROVED: obj({ planId: id, planHash: hex64, actor: txt(128) }),
  RUN_CREATED: obj({ runId: id, planId: id }),
  COMMAND_ACCEPTED: obj({ commandId: id, kind: txt(64), idempotencyKey: id }),
  DISPATCH_RESERVED: obj({
    runId: id,
    nodeId: id,
    attemptId: id,
    reservedTokens: Type.Integer({ minimum: 0 }),
    fencingToken: Type.Integer({ minimum: 1 }),
  }),
  SESSION_BOUND: obj({ attemptId: id, externalSessionId: txt(128), fencingToken: Type.Integer({ minimum: 1 }) }),
  CAPACITY_WAIT: obj({
    runId: id,
    nodeId: id,
    reason: Type.Union([Type.Literal('worker-cap'), Type.Literal('budget-reserve'), Type.Literal('daemon-throttle')]),
  }),
  RUNTIME_OBSERVED: obj({ attemptId: id, runtimeState: txt(64) }),
  CANDIDATE_FROZEN: obj({ attemptId: id, candidateHash: hex64 }),
  EVIDENCE_RECORDED: obj({
    attemptId: id,
    evidenceId: id,
    verdict: Type.Union([Type.Literal('PASS'), Type.Literal('FAIL'), Type.Literal('UNKNOWN')]),
    testCount: Type.Integer({ minimum: 0 }),
  }),
  REPAIR_REQUESTED: obj({
    attemptId: id,
    failureSignature: txt(256),
    repairAttempt: Type.Integer({ minimum: 1, maximum: 2 }), // bounded repair ≤2
  }),
  APPROVAL_REQUESTED: obj({
    approvalId: id,
    runId: id,
    action: Type.Union([Type.Literal('ACCEPT_RESULT'), Type.Literal('EXTEND_BUDGET'), Type.Literal('REPLAN')]),
    reason: txt(),
  }),
  APPROVAL_DECIDED: obj({
    approvalId: id,
    decision: Type.Union([Type.Literal('APPROVED'), Type.Literal('REJECTED'), Type.Literal('REVOKED')]),
    actor: txt(128),
  }),
  APPROVAL_REVOKED: obj({ approvalId: id, reason: txt() }),
  BUDGET_RESERVED: obj({ runId: id, reservationId: id, tokens: Type.Integer({ minimum: 0 }) }),
  BUDGET_SETTLED: obj({
    runId: id,
    reservationId: id,
    spentTokens: Type.Integer({ minimum: 0 }),
    usageState: Type.Union([Type.Literal('KNOWN'), Type.Literal('ESTIMATED'), Type.Literal('UNKNOWN')]),
  }),
  USAGE_UNKNOWN: obj({ attemptId: Type.Optional(id), reservationId: Type.Optional(id), reason: txt() }),
  PAUSE_REQUESTED: obj({ runId: id, reason: txt(500) }),
  RUN_RESUMED: obj({ runId: id, actor: txt(128) }),
  STOP_LATCH_SET: obj({ reason: txt(500), actor: txt(128) }),
  STOP_LATCH_CLEARED: obj({ reason: txt(500), actor: txt(128), confirmationHash: hex64 }),
  CANCEL_REQUESTED: obj({ runId: id, attemptId: Type.Optional(id), reason: txt(500) }),
  CANCEL_CONFIRMED: obj({
    runId: id,
    attemptId: id,
    externalState: Type.Union([Type.Literal('CONFIRMED_DEAD'), Type.Literal('TIMEOUT_UNCONFIRMED')]),
  }),
  EXTERNAL_STATE_UNKNOWN: obj({ attemptId: id, reason: txt() }),
  RUN_ACCEPTED: obj({ runId: id, candidateHash: hex64, evidenceId: id }),
  RUN_FAILED: obj({ runId: id, failureSignature: txt(256) }),
  NODE_SKIPPED: obj({
    runId: id,
    nodeId: id,
    reason: Type.Union([Type.Literal('operator-skip'), Type.Literal('obsolete-plan'), Type.Literal('scope-reduced')]),
    approvalId: id, // "atlamak başarı değildir": skip daima denetlenebilir onayla
  }),
  PROFILE_PUBLISHED: obj({ profileId: id, version: Type.Integer({ minimum: 1 }), profileHash: hex64, actor: txt(128) }),
  EVAL_TRIAL_RECORDED: obj({ trialId: id, caseId: id, profileHash: hex64 }),
  RESTORE_RECONCILED: obj({
    repaired: Type.Integer({ minimum: 0 }),
    quarantined: Type.Integer({ minimum: 0 }),
    schemaVersion: Type.Integer({ minimum: 1 }),
  }),
};

export const eventTypes = Object.keys(eventPayloadBranches);
