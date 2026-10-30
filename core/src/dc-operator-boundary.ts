import { createHash, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { fullContractIdOf, normalizeFullContract } from './dc-full-contract.ts';
import { readContractBindingRecord } from './dc-contract-binding.ts';

export const OPERATOR_BOUNDARY_VERSION = 'dc-operator-boundary-v1';
export const OPERATOR_SURFACE_ACTIONS = ['capsule', 'approve', 'dispatch', 'decide', 'resume', 'grant'] as const;
export type OperatorSurfaceAction = (typeof OPERATOR_SURFACE_ACTIONS)[number];

export interface OperatorAuthorizationPayload {
  boundaryVersion: typeof OPERATOR_BOUNDARY_VERSION;
  keyId: string;
  operatorId: string;
  contractId: string;
  sourceId: string;
  actions: OperatorSurfaceAction[];
  notBefore: string;
  expiresAt: string;
  nonce: string;
}

export interface SignedOperatorAuthorization {
  payload: OperatorAuthorizationPayload;
  signature: string;
}

export type OperatorBoundaryDecision =
  | {
      allowed: true;
      action: OperatorSurfaceAction;
      operatorId: string;
      contractId: string;
      sourceId: string;
    }
  | {
      allowed: false;
      action: OperatorSurfaceAction;
      contractId?: string;
      sourceId?: string;
      reason: string;
    };

export interface OperatorBoundaryLedgerEntry {
  entryVersion: typeof OPERATOR_BOUNDARY_VERSION;
  at: string;
  action: OperatorSurfaceAction;
  decision: 'ALLOW' | 'DENY';
  contractId?: string;
  sourceId?: string;
  operatorId?: string;
  reason?: string;
}

export class OperatorBoundaryError extends Error {}

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  const record = value as Record<string, unknown>;
  return '{' + Object.keys(record).sort().map((key) => JSON.stringify(key) + ':' + canonicalJson(record[key])).join(',') + '}';
};

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const requireObject = (value: unknown, field: string): Record<string, unknown> => {
  if (!isObject(value)) throw new OperatorBoundaryError(field + ' object olmali');
  return value;
};

const requireExactKeys = (value: Record<string, unknown>, keys: readonly string[], field: string): void => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new OperatorBoundaryError(field + ' alan kumesi kapali degil');
  }
};

const requireString = (value: unknown, field: string, maxLength = 4096): string => {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    throw new OperatorBoundaryError(field + ' gecersiz string');
  }
  return value;
};

const requireIsoDate = (value: unknown, field: string): string => {
  const text = requireString(value, field, 64);
  if (Number.isNaN(Date.parse(text))) throw new OperatorBoundaryError(field + ' ISO-8601 tarih olmali');
  return text;
};

const requireActions = (value: unknown): OperatorSurfaceAction[] => {
  if (!Array.isArray(value) || value.length === 0) throw new OperatorBoundaryError('actions bos olmaz');
  const actions = value.map((action) => requireString(action, 'actions', 32) as OperatorSurfaceAction);
  if (actions.some((action) => !OPERATOR_SURFACE_ACTIONS.includes(action))) {
    throw new OperatorBoundaryError('actions kapali yuz kumesinde degil');
  }
  if (new Set(actions).size !== actions.length) throw new OperatorBoundaryError('actions tekrarli');
  return [...actions].sort();
};

const requireCurrentBinding = (contract: unknown, binding: unknown): string => {
  const record = readContractBindingRecord(binding);
  if (record.kind !== 'current') throw new OperatorBoundaryError('operator boundary current binding ister');
  const contractId = fullContractIdOf(contract);
  if (record.binding.contractId !== contractId) throw new OperatorBoundaryError('contract binding eslesmiyor');
  return contractId;
};

export function operatorSourceIdentityOf(input: unknown): string {
  const contract = normalizeFullContract(input);
  return 'git:' + contract.source.objectAlgorithm + ':' + contract.source.objectId + ':' + sha256(contract.source.repository);
}

export function issueOperatorAuthorization(input: {
  privateKey: string;
  keyId: string;
  operatorId: string;
  contract: unknown;
  contractBinding: unknown;
  actions: readonly OperatorSurfaceAction[];
  notBefore: string;
  expiresAt: string;
  nonce: string;
}): SignedOperatorAuthorization {
  const record = requireObject(input, 'operator authorization input');
  requireExactKeys(
    record,
    ['privateKey', 'keyId', 'operatorId', 'contract', 'contractBinding', 'actions', 'notBefore', 'expiresAt', 'nonce'],
    'operator authorization input',
  );
  const contractId = requireCurrentBinding(record.contract, record.contractBinding);
  const payload: OperatorAuthorizationPayload = {
    boundaryVersion: OPERATOR_BOUNDARY_VERSION,
    keyId: requireString(record.keyId, 'keyId', 128),
    operatorId: requireString(record.operatorId, 'operatorId', 128),
    contractId,
    sourceId: operatorSourceIdentityOf(record.contract),
    actions: requireActions(record.actions),
    notBefore: requireIsoDate(record.notBefore, 'notBefore'),
    expiresAt: requireIsoDate(record.expiresAt, 'expiresAt'),
    nonce: requireString(record.nonce, 'nonce', 128),
  };
  if (Date.parse(payload.notBefore) >= Date.parse(payload.expiresAt)) {
    throw new OperatorBoundaryError('notBefore expiresAt once olmali');
  }
  const signature = sign(null, Buffer.from(canonicalJson(payload), 'utf8'), createPrivateKey(record.privateKey)).toString('base64url');
  return { payload, signature };
}

export function verifyOperatorAuthorization(input: {
  action: OperatorSurfaceAction;
  contract: unknown;
  contractBinding: unknown;
  authorization: unknown;
  publicKey: string;
  now: string;
}): OperatorBoundaryDecision {
  const record = requireObject(input, 'operator boundary request');
  requireExactKeys(record, ['action', 'contract', 'contractBinding', 'authorization', 'publicKey', 'now'], 'operator boundary request');
  const action = requireString(record.action, 'action', 32) as OperatorSurfaceAction;
  let contractId: string;
  try {
    contractId = requireCurrentBinding(record.contract, record.contractBinding);
  } catch (error) {
    return {
      allowed: false,
      action,
      reason: error instanceof Error ? error.message : 'contract binding gecersiz',
    };
  }
  const sourceId = operatorSourceIdentityOf(record.contract);
  if (!OPERATOR_SURFACE_ACTIONS.includes(action)) {
    return { allowed: false, action, contractId, sourceId, reason: 'action kapali yuz kumesinde degil' };
  }
  try {
    const authorization = requireObject(record.authorization, 'authorization');
    requireExactKeys(authorization, ['payload', 'signature'], 'authorization');
    const payload = requireObject(authorization.payload, 'authorization.payload');
    requireExactKeys(
      payload,
      ['boundaryVersion', 'keyId', 'operatorId', 'contractId', 'sourceId', 'actions', 'notBefore', 'expiresAt', 'nonce'],
      'authorization.payload',
    );
    if (payload.boundaryVersion !== OPERATOR_BOUNDARY_VERSION) {
      return { allowed: false, action, contractId, sourceId, reason: 'boundaryVersion desteklenmiyor' };
    }
    const now = Date.parse(requireIsoDate(record.now, 'now'));
    const notBefore = Date.parse(requireIsoDate(payload.notBefore, 'authorization.payload.notBefore'));
    const expiresAt = Date.parse(requireIsoDate(payload.expiresAt, 'authorization.payload.expiresAt'));
    if (now < notBefore || now >= expiresAt) {
      return { allowed: false, action, contractId, sourceId, reason: 'operator authorization suresi gecersiz' };
    }
    const signature = requireString(authorization.signature, 'authorization.signature', 1024);
    const verified = verify(
      null,
      Buffer.from(canonicalJson(payload), 'utf8'),
      createPublicKey(record.publicKey),
      Buffer.from(signature, 'base64url'),
    );
    if (!verified) return { allowed: false, action, contractId, sourceId, reason: 'operator imzasi gecersiz' };
    if (payload.contractId !== contractId) {
      return { allowed: false, action, contractId, sourceId, reason: 'contract kimligi eslesmiyor' };
    }
    if (payload.sourceId !== sourceId) {
      return { allowed: false, action, contractId, sourceId, reason: 'kaynak kimligi eslesmiyor' };
    }
    const actions = requireActions(payload.actions);
    if (!actions.includes(action)) {
      return { allowed: false, action, contractId, sourceId, reason: 'action operator kapsaminda degil' };
    }
    const operatorId = requireString(payload.operatorId, 'authorization.payload.operatorId', 128);
    return { allowed: true, action, operatorId, contractId, sourceId };
  } catch (error) {
    return {
      allowed: false,
      action,
      contractId,
      sourceId,
      reason: error instanceof Error ? error.message : 'operator authorization gecersiz',
    };
  }
}

export function recordOperatorBoundaryDecision(input: {
  ledgerPath: string;
  decision: OperatorBoundaryDecision;
  at: string;
}): OperatorBoundaryLedgerEntry {
  const record = requireObject(input, 'operator ledger input');
  requireExactKeys(record, ['ledgerPath', 'decision', 'at'], 'operator ledger input');
  const ledgerPath = requireString(record.ledgerPath, 'ledgerPath', 4096);
  const at = requireIsoDate(record.at, 'at');
  const decision = requireObject(record.decision, 'decision');
  if (typeof decision.action !== 'string') throw new OperatorBoundaryError('decision.action gecersiz');
  if (decision.allowed !== true && decision.allowed !== false) throw new OperatorBoundaryError('decision.allowed gecersiz');
  const entry: OperatorBoundaryLedgerEntry = {
    entryVersion: OPERATOR_BOUNDARY_VERSION,
    at,
    action: decision.action,
    decision: decision.allowed ? 'ALLOW' : 'DENY',
  };
  if (decision.contractId !== undefined) entry.contractId = requireString(decision.contractId, 'decision.contractId', 69);
  if (decision.sourceId !== undefined) entry.sourceId = requireString(decision.sourceId, 'decision.sourceId', 4096);
  if (decision.allowed) entry.operatorId = requireString(decision.operatorId, 'decision.operatorId', 128);
  else entry.reason = requireString(decision.reason, 'decision.reason', 256);
  appendFileSync(ledgerPath, JSON.stringify(entry) + '\n', 'utf8');
  return entry;
}
