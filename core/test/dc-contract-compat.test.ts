import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { planHashOf } from '../src/supervisor.ts';
import { FULL_CONTRACT_VERSION, FullContractError } from '../src/dc-full-contract.ts';
import {
  ADR_BINDING,
  CONTRACT_BINDING_VERSION,
  MIGRATION_POLICY,
  ContractBindingError,
  bindApprovedContract,
  contractIdOfBindingRecord,
  migrateLegacyContractBinding,
  readContractBindingRecord,
} from '../src/dc-contract-binding.ts';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

const fullContract = () => {
  const nodes = [
    { id: 'research', role: 'researcher', deps: [] as string[], provider: 'codex', model: 'glm-5.3' },
    { id: 'write', role: 'writer', deps: ['research'], provider: 'codex', model: 'glm-5.3' },
  ];
  return {
    contractVersion: FULL_CONTRACT_VERSION,
    goal: 'Kalici sozlesme bagini dogrula',
    source: {
      repository: 'D:/Vibecode/ordu',
      objectAlgorithm: 'sha1',
      objectId: '0123456789012345678901234567890123456789',
    },
    permissions: { allowedCommands: ['git', 'node'] },
    plan: { nodes, legacyHash: planHashOf(nodes) },
    evaluatorHash: hash('evaluator'),
    policyHash: hash('policy'),
    budget: { maxReservedTokens: 10000 },
    deadline: { at: '2026-11-01T00:00:00.000Z' },
    resolvedModel: { provider: 'codex', model: 'glm-5.3' },
    testSuite: { hash: hash('suite'), command: 'node --test' },
  };
};

const currentInput = () => ({
  contract: fullContract(),
  approval: { approvalId: 'apv-current', decision: 'APPROVED' },
  ledger: { stream: 'commands', recordId: 'cmd-current', commandKind: 'APPROVE_PLAN' },
  adr: ADR_BINDING,
});

const legacyRecord = () => ({
  recordVersion: 1,
  planHash: hash('legacy-plan'),
  evaluatorHash: hash('legacy-evaluator'),
  policyHash: hash('legacy-policy'),
  sourceCommit: '0123456789012345678901234567890123456789',
  approvalId: 'apv-legacy',
  ledger: { stream: 'events', recordId: 'evt-legacy', eventType: 'PLAN_APPROVED' },
  adr: ADR_BINDING,
});

test('P1: yeni onay tam sozlesme kimligine ve mevcut defter/ADR secimine baglanir', () => {
  const input = currentInput();
  const binding = bindApprovedContract(input);
  assert.equal(binding.bindingVersion, CONTRACT_BINDING_VERSION);
  assert.match(binding.contractId, /^dcf1:[0-9a-f]{64}$/);
  assert.deepEqual(binding.approval, input.approval);
  assert.deepEqual(binding.ledger, input.ledger);
  assert.deepEqual(binding.adr, ADR_BINDING);
  const read = readContractBindingRecord(binding);
  assert.equal(read.kind, 'current');
  assert.deepEqual(read.binding, binding);
  assert.equal(contractIdOfBindingRecord(read), binding.contractId);
});

test('P1: eski kayit kendi surum anlamiyla yeniden hashlenmeden okunur', () => {
  const legacy = legacyRecord();
  const read = readContractBindingRecord(legacy);
  assert.equal(read.kind, 'legacy-v1');
  assert.equal(read.binding.recordVersion, 1);
  assert.equal(read.binding.planHash, legacy.planHash);
  assert.equal(read.binding.evaluatorHash, legacy.evaluatorHash);
  assert.equal(read.binding.policyHash, legacy.policyHash);
  assert.equal(read.binding.sourceCommit, legacy.sourceCommit);
  assert.equal(read.binding.approvalId, legacy.approvalId);
  assert.deepEqual(read.binding.ledger, legacy.ledger);
  assert.deepEqual(read.binding.adr, legacy.adr);
});

test('N1: eski kaynak/kanit hash yeni sozlesme kimligine tasinmaz', () => {
  const legacy = legacyRecord();
  const read = readContractBindingRecord(legacy);
  assert.equal(contractIdOfBindingRecord(read), null);
  assert.throws(() => bindApprovedContract({ ...currentInput(), contract: legacy }), FullContractError);
  const withContractId = { ...legacy, contractId: 'dcf1:' + '0'.repeat(64) };
  assert.throws(() => readContractBindingRecord(withContractId), ContractBindingError);
});

test('N2: legacy goc uygulanmaz ve eksik paket revizyonu RED', () => {
  assert.equal(MIGRATION_POLICY, 'none');
  assert.throws(() => migrateLegacyContractBinding(), /package revision/);
});

test('N2: defter secimi R6 kumesine ve ADR alanlarina kapalidir', () => {
  const wrongEvent = currentInput();
  (wrongEvent.ledger as any).eventType = 'NEW_EVENT';
  delete (wrongEvent.ledger as any).commandKind;
  assert.throws(() => bindApprovedContract(wrongEvent), ContractBindingError);

  const wrongCommand = currentInput();
  (wrongCommand.ledger as any).commandKind = 'APPROVE_FULL_CONTRACT';
  assert.throws(() => bindApprovedContract(wrongCommand), ContractBindingError);

  const unapproved = currentInput();
  (unapproved.approval as any).decision = 'PENDING';
  assert.throws(() => bindApprovedContract(unapproved), ContractBindingError);

  const extraAdr = currentInput();
  extraAdr.adr = { ...ADR_BINDING, extra: 'yasak' };
  assert.throws(() => bindApprovedContract(extraAdr), ContractBindingError);

  const unknownVersion = { ...bindApprovedContract(currentInput()), bindingVersion: 'v9' };
  assert.throws(() => readContractBindingRecord(unknownVersion), ContractBindingError);
});
