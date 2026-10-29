import { commandKinds } from './contracts/command-payloads.ts';
import { eventTypes } from './contracts/event-payloads.ts';
import { fullContractIdOf } from './dc-full-contract.ts';

export const CONTRACT_BINDING_VERSION = 'dc-contract-binding-v1';
export const LEGACY_CONTRACT_BINDING_VERSION = 'legacy-contract-binding-v1';
export const MIGRATION_POLICY = 'none';
export const ADR_BINDING = Object.freeze({
  documentId: 'ADR-dc-s0-teknik-oneri-2026-10-28',
  revision: 'draft',
  section: '4',
});

export interface ApprovedContractRef {
  approvalId: string;
  decision: 'APPROVED';
}

export interface LedgerSelection {
  stream: 'events' | 'commands';
  recordId: string;
  eventType?: string;
  commandKind?: string;
}

export interface AdrSelection {
  documentId: string;
  revision: string;
  section: string;
}

export interface ContractBinding {
  bindingVersion: typeof CONTRACT_BINDING_VERSION;
  contractId: string;
  approval: ApprovedContractRef;
  ledger: LedgerSelection;
  adr: AdrSelection;
}

export interface LegacyContractBinding {
  recordVersion: 1;
  planHash: string;
  evaluatorHash: string;
  policyHash: string;
  sourceCommit: string;
  approvalId: string;
  ledger: LedgerSelection;
  adr: AdrSelection;
}

export type ContractBindingRecord =
  | { kind: 'current'; binding: ContractBinding }
  | { kind: 'legacy-v1'; binding: LegacyContractBinding };

export class ContractBindingError extends Error {}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const requireObject = (value: unknown, field: string): Record<string, unknown> => {
  if (!isObject(value)) throw new ContractBindingError(field + ' object olmali');
  return value;
};

const requireExactKeys = (value: Record<string, unknown>, keys: readonly string[], field: string): void => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new ContractBindingError(field + ' alan kumesi kapali degil');
  }
};

const requireString = (value: unknown, field: string, maxLength = 4096): string => {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    throw new ContractBindingError(field + ' gecersiz string');
  }
  return value;
};

const requireHex = (value: unknown, field: string, lengths: readonly number[]): string => {
  const text = requireString(value, field, Math.max(...lengths));
  if (!lengths.some((length) => new RegExp('^[0-9a-f]{' + length + '}$').test(text))) {
    throw new ContractBindingError(field + ' izinli hex uzunlugunda degil');
  }
  return text;
};

const normalizeApproval = (value: unknown): ApprovedContractRef => {
  const approval = requireObject(value, 'approval');
  requireExactKeys(approval, ['approvalId', 'decision'], 'approval');
  if (approval.decision !== 'APPROVED') throw new ContractBindingError('approval.decision APPROVED olmali');
  return { approvalId: requireString(approval.approvalId, 'approval.approvalId', 128), decision: 'APPROVED' };
};

const normalizeLedger = (value: unknown): LedgerSelection => {
  const ledger = requireObject(value, 'ledger');
  if (ledger.stream === 'events') {
    requireExactKeys(ledger, ['stream', 'recordId', 'eventType'], 'ledger');
    const eventType = requireString(ledger.eventType, 'ledger.eventType', 128);
    if (!eventTypes.includes(eventType)) throw new ContractBindingError('ledger.eventType R6 kumesinde degil');
    return { stream: 'events', recordId: requireString(ledger.recordId, 'ledger.recordId', 128), eventType };
  }
  if (ledger.stream === 'commands') {
    requireExactKeys(ledger, ['stream', 'recordId', 'commandKind'], 'ledger');
    const commandKind = requireString(ledger.commandKind, 'ledger.commandKind', 128);
    if (!commandKinds.includes(commandKind)) throw new ContractBindingError('ledger.commandKind R6 kumesinde degil');
    return { stream: 'commands', recordId: requireString(ledger.recordId, 'ledger.recordId', 128), commandKind };
  }
  throw new ContractBindingError('ledger.stream events veya commands olmali');
};

const normalizeAdr = (value: unknown): AdrSelection => {
  const adr = requireObject(value, 'adr');
  requireExactKeys(adr, ['documentId', 'revision', 'section'], 'adr');
  return {
    documentId: requireString(adr.documentId, 'adr.documentId', 256),
    revision: requireString(adr.revision, 'adr.revision', 128),
    section: requireString(adr.section, 'adr.section', 64),
  };
};

export function bindApprovedContract(input: {
  contract: unknown;
  approval: unknown;
  ledger: unknown;
  adr: unknown;
}): ContractBinding {
  const record = requireObject(input, 'binding input');
  requireExactKeys(record, ['contract', 'approval', 'ledger', 'adr'], 'binding input');
  const contractId = fullContractIdOf(record.contract);
  return {
    bindingVersion: CONTRACT_BINDING_VERSION,
    contractId,
    approval: normalizeApproval(record.approval),
    ledger: normalizeLedger(record.ledger),
    adr: normalizeAdr(record.adr),
  };
}

const normalizeCurrentBinding = (value: unknown): ContractBinding => {
  const binding = requireObject(value, 'binding');
  requireExactKeys(binding, ['bindingVersion', 'contractId', 'approval', 'ledger', 'adr'], 'binding');
  if (binding.bindingVersion !== CONTRACT_BINDING_VERSION) throw new ContractBindingError('bindingVersion desteklenmiyor');
  const contractId = requireString(binding.contractId, 'binding.contractId', 69);
  if (!/^dcf1:[0-9a-f]{64}$/.test(contractId)) throw new ContractBindingError('binding.contractId tam sozlesme kimligi degil');
  return {
    bindingVersion: CONTRACT_BINDING_VERSION,
    contractId,
    approval: normalizeApproval(binding.approval),
    ledger: normalizeLedger(binding.ledger),
    adr: normalizeAdr(binding.adr),
  };
};

const normalizeLegacyBinding = (value: unknown): LegacyContractBinding => {
  const binding = requireObject(value, 'legacy binding');
  requireExactKeys(
    binding,
    ['recordVersion', 'planHash', 'evaluatorHash', 'policyHash', 'sourceCommit', 'approvalId', 'ledger', 'adr'],
    'legacy binding',
  );
  if (binding.recordVersion !== 1) throw new ContractBindingError('legacy recordVersion 1 olmali');
  return {
    recordVersion: 1,
    planHash: requireHex(binding.planHash, 'legacy.planHash', [64]),
    evaluatorHash: requireHex(binding.evaluatorHash, 'legacy.evaluatorHash', [64]),
    policyHash: requireHex(binding.policyHash, 'legacy.policyHash', [64]),
    sourceCommit: requireHex(binding.sourceCommit, 'legacy.sourceCommit', [40, 64]),
    approvalId: requireString(binding.approvalId, 'legacy.approvalId', 128),
    ledger: normalizeLedger(binding.ledger),
    adr: normalizeAdr(binding.adr),
  };
};

export function readContractBindingRecord(value: unknown): ContractBindingRecord {
  const record = requireObject(value, 'binding record');
  if ('bindingVersion' in record) return { kind: 'current', binding: normalizeCurrentBinding(record) };
  if ('recordVersion' in record) return { kind: 'legacy-v1', binding: normalizeLegacyBinding(record) };
  throw new ContractBindingError('binding surumu yok');
}

export function contractIdOfBindingRecord(record: ContractBindingRecord): string | null {
  return record.kind === 'current' ? record.binding.contractId : null;
}

export function migrateLegacyContractBinding(): never {
  throw new ContractBindingError('legacy contract binding migration requires package revision');
}
