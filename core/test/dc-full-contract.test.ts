import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { commandKinds } from '../src/contracts/command-payloads.ts';
import { eventTypes } from '../src/contracts/event-payloads.ts';
import { planHashOf } from '../src/supervisor.ts';
import {
  FULL_CONTRACT_VERSION,
  GIT_OBJECT_ALGORITHMS,
  FullContractError,
  approvalMatchesFullContract,
  fullContractIdOf,
  normalizeFullContract,
} from '../src/dc-full-contract.ts';

const here = dirname(fileURLToPath(import.meta.url));
const baseline = JSON.parse(readFileSync(join(here, '..', '..', 'referans', 'kapsul-final-v2.0.0 notio', 'contracts', 'schema.json'), 'utf8'));
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

const nodes = () => [
  { id: 'research', role: 'researcher', deps: [] as string[], provider: 'codex', model: 'glm-5.3' },
  { id: 'write', role: 'writer', deps: ['research'], provider: 'codex', model: 'glm-5.3' },
];

const draft = () => {
  const planNodes = nodes();
  return {
    contractVersion: FULL_CONTRACT_VERSION,
    goal: 'Kapsul sozlesmesini tamamla',
    source: {
      repository: 'D:/Vibecode/ordu',
      objectAlgorithm: 'sha1',
      objectId: '0123456789012345678901234567890123456789',
    },
    permissions: { allowedCommands: ['git', 'node'] },
    plan: { nodes: [...planNodes].reverse(), legacyHash: planHashOf(planNodes) },
    evaluatorHash: hash('evaluator'),
    policyHash: hash('policy'),
    budget: { maxReservedTokens: 10000 },
    deadline: { at: '2026-11-01T00:00:00.000Z' },
    resolvedModel: { provider: 'codex', model: 'glm-5.3' },
    testSuite: { hash: hash('suite'), command: 'node --test' },
  };
};

test('P1: normalize edilmis sozlesme ayni kimligi verir ve kaynak/model/suite baglanir', () => {
  const first = draft();
  const second = draft();
  second.permissions.allowedCommands = ['node', 'git'];
  const firstId = fullContractIdOf(first);
  assert.equal(firstId, fullContractIdOf(second));
  const normalized = normalizeFullContract(second);
  assert.equal(normalized.source.objectId, first.source.objectId);
  assert.deepEqual(normalized.resolvedModel, { provider: 'codex', model: 'glm-5.3' });
  assert.equal(normalized.testSuite.hash, first.testSuite.hash);
  assert.equal(normalized.testSuite.command, first.testSuite.command);
  assert.deepEqual(normalized.plan.nodes.map((node) => node.id), ['research', 'write']);
});

test('N1: kritik alan degisiminde kimlik ve onay eslesmesi bozulur', () => {
  const baseId = fullContractIdOf(draft());
  const mutations: Array<[string, (value: ReturnType<typeof draft>) => void]> = [
    ['goal', (value) => { value.goal = 'Baska hedef'; }],
    ['repository', (value) => { value.source.repository = 'D:/Vibecode/other'; }],
    ['objectAlgorithm', (value) => { value.source.objectAlgorithm = 'sha256'; value.source.objectId = 'f'.repeat(64); }],
    ['objectId', (value) => { value.source.objectId = 'fedcba9876543210fedcba9876543210fedcba98'; }],
    ['permissions', (value) => { value.permissions.allowedCommands = ['node']; }],
    ['evaluatorHash', (value) => { value.evaluatorHash = hash('evaluator-2'); }],
    ['policyHash', (value) => { value.policyHash = hash('policy-2'); }],
    ['budget', (value) => { value.budget.maxReservedTokens = 10001; }],
    ['deadline', (value) => { value.deadline.at = '2026-11-02T00:00:00.000Z'; }],
    ['resolvedModel', (value) => { value.resolvedModel.model = 'gpt-5.4'; }],
    ['testSuiteHash', (value) => { value.testSuite.hash = hash('suite-2'); }],
    ['testSuiteCommand', (value) => { value.testSuite.command = 'npm test'; }],
    ['planNode', (value) => {
      value.plan.nodes[0].role = 'reviewer';
      value.plan.legacyHash = planHashOf([...value.plan.nodes].sort((left, right) => left.id.localeCompare(right.id)));
    }],
  ];
  for (const [name, mutate] of mutations) {
    const value = draft();
    mutate(value);
    const changedId = fullContractIdOf(value);
    assert.notEqual(changedId, baseId, name + ' kimlik degistirmeli');
    assert.equal(approvalMatchesFullContract(value, { contractId: baseId }), false, name + ' onay eslesmemeli');
  }
  assert.equal(approvalMatchesFullContract(draft(), { contractId: baseId }), true);
});

test('N2: eski planHash sessiz genislemez ve R6 kumesi degismeden kalir', () => {
  const planNodes = nodes();
  const legacyHash = planHashOf(planNodes);
  const value = draft();
  const contract = normalizeFullContract(value);
  assert.equal(contract.plan.legacyHash, legacyHash);
  assert.match(fullContractIdOf(value), /^dcf1:[0-9a-f]{64}$/);
  assert.notEqual(fullContractIdOf(value), legacyHash);
  assert.equal(planHashOf(planNodes), legacyHash);
  assert.deepEqual([...commandKinds].sort(), [...baseline.definitions.Command.properties.kind.enum].sort());
  assert.deepEqual([...eventTypes].sort(), [...baseline.definitions.Event.properties.type.enum].sort());
});

test('N2: kapali sozlesme semasi ve registry disi degerler RED', () => {
  const unknownField = { ...draft(), extra: 'yasak' } as any;
  assert.throws(() => normalizeFullContract(unknownField), FullContractError);
  const unknownAlgorithm = draft();
  (unknownAlgorithm.source as any).objectAlgorithm = 'sha384';
  assert.throws(() => normalizeFullContract(unknownAlgorithm), FullContractError);
  const staleLegacyHash = draft();
  staleLegacyHash.plan.legacyHash = hash('wrong-plan');
  assert.throws(() => normalizeFullContract(staleLegacyHash), FullContractError);
  const unresolvedModel = draft();
  (unresolvedModel.resolvedModel as any).model = null;
  assert.throws(() => normalizeFullContract(unresolvedModel), FullContractError);
  assert.deepEqual([...GIT_OBJECT_ALGORITHMS], ['sha1', 'sha256']);
});
