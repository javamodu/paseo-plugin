import { createHash } from 'node:crypto';
import { planHashOf, type PlanNode } from './supervisor.ts';
import { assertProviderModel } from './providers.ts';

export const FULL_CONTRACT_VERSION = 'dc-full-contract-v1';
export const GIT_OBJECT_ALGORITHMS = ['sha1', 'sha256'] as const;
export type GitObjectAlgorithm = (typeof GIT_OBJECT_ALGORITHMS)[number];

export interface FullContractSource {
  repository: string;
  objectAlgorithm: GitObjectAlgorithm;
  objectId: string;
}

export interface FullContractPlan {
  nodes: PlanNode[];
  legacyHash: string;
}

export interface FullContract {
  contractVersion: typeof FULL_CONTRACT_VERSION;
  goal: string;
  source: FullContractSource;
  permissions: { allowedCommands: string[] };
  plan: FullContractPlan;
  evaluatorHash: string;
  policyHash: string;
  budget: { maxReservedTokens: number };
  deadline: { at: string };
  resolvedModel: { provider: string; model: string };
  testSuite: { hash: string; command: string };
}

export class FullContractError extends Error {}

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
  if (!isObject(value)) throw new FullContractError(field + ' object olmali');
  return value;
};

const requireExactKeys = (value: Record<string, unknown>, keys: readonly string[], field: string): void => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new FullContractError(field + ' alan kumesi kapali degil');
  }
};

const requireString = (value: unknown, field: string, maxLength = 4096): string => {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    throw new FullContractError(field + ' gecersiz string');
  }
  return value;
};

const requireHex = (value: unknown, field: string, length: number): string => {
  const text = requireString(value, field, length);
  if (!new RegExp('^[0-9a-f]{' + length + '}$').test(text)) {
    throw new FullContractError(field + ' ' + length + ' haneli kucuk-hex olmali');
  }
  return text;
};

const requirePositiveInteger = (value: unknown, field: string): number => {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new FullContractError(field + ' pozitif tam sayi olmali');
  }
  return value as number;
};

const requireIsoDate = (value: unknown, field: string): string => {
  const text = requireString(value, field, 64);
  if (Number.isNaN(Date.parse(text))) throw new FullContractError(field + ' ISO-8601 tarih olmali');
  return text;
};

const normalizePlan = (value: unknown): FullContractPlan => {
  const plan = requireObject(value, 'plan');
  requireExactKeys(plan, ['nodes', 'legacyHash'], 'plan');
  if (!Array.isArray(plan.nodes) || plan.nodes.length === 0) throw new FullContractError('plan.nodes bos olmaz');
  const nodes = plan.nodes.map((rawNode, index) => {
    const node = requireObject(rawNode, 'plan.nodes[' + index + ']');
    const keys = ['id', 'role', 'deps'];
    if (node.provider !== undefined) keys.push('provider');
    if (node.model !== undefined) keys.push('model');
    requireExactKeys(node, keys, 'plan.nodes[' + index + ']');
    if (!Array.isArray(node.deps)) throw new FullContractError('plan.nodes[' + index + '].deps dizi olmali');
    const deps = node.deps.map((dep) => requireString(dep, 'plan.nodes[' + index + '].deps', 128));
    if (new Set(deps).size !== deps.length) throw new FullContractError('plan.nodes[' + index + '].deps tekrarli');
    const normalized: PlanNode = {
      id: requireString(node.id, 'plan.nodes[' + index + '].id', 128),
      role: requireString(node.role, 'plan.nodes[' + index + '].role', 128),
      deps: [...deps].sort(),
    };
    if (node.provider !== undefined) normalized.provider = requireString(node.provider, 'plan.nodes[' + index + '].provider', 128);
    if (node.model !== undefined) normalized.model = requireString(node.model, 'plan.nodes[' + index + '].model', 128);
    assertProviderModel(normalized.provider ?? null, normalized.model ?? null);
    return normalized;
  });
  const ids = nodes.map((node) => node.id);
  if (new Set(ids).size !== ids.length) throw new FullContractError('plan node id tekrarli');
  for (const node of nodes) for (const dep of node.deps) if (!ids.includes(dep)) throw new FullContractError('plan bagimliligi yok: ' + dep);
  const orderedNodes = [...nodes].sort((left, right) => left.id.localeCompare(right.id));
  const legacyHash = requireHex(plan.legacyHash, 'plan.legacyHash', 64);
  if (legacyHash !== planHashOf(orderedNodes)) throw new FullContractError('plan.legacyHash eski plan hash ile eslesmiyor');
  return { nodes: orderedNodes, legacyHash };
};

const normalizeSource = (value: unknown): FullContractSource => {
  const source = requireObject(value, 'source');
  requireExactKeys(source, ['repository', 'objectAlgorithm', 'objectId'], 'source');
  const objectAlgorithm = requireString(source.objectAlgorithm, 'source.objectAlgorithm', 16) as GitObjectAlgorithm;
  if (!GIT_OBJECT_ALGORITHMS.includes(objectAlgorithm)) throw new FullContractError('source.objectAlgorithm registry disi');
  return {
    repository: requireString(source.repository, 'source.repository', 2048),
    objectAlgorithm,
    objectId: requireHex(source.objectId, 'source.objectId', objectAlgorithm === 'sha1' ? 40 : 64),
  };
};

const normalizeResolvedModel = (value: unknown): { provider: string; model: string } => {
  const resolvedModel = requireObject(value, 'resolvedModel');
  requireExactKeys(resolvedModel, ['provider', 'model'], 'resolvedModel');
  const provider = requireString(resolvedModel.provider, 'resolvedModel.provider', 128);
  const model = requireString(resolvedModel.model, 'resolvedModel.model', 128);
  assertProviderModel(provider, model);
  return { provider, model };
};

export function normalizeFullContract(input: unknown): FullContract {
  const contract = requireObject(input, 'contract');
  requireExactKeys(contract, [
    'contractVersion', 'goal', 'source', 'permissions', 'plan', 'evaluatorHash', 'policyHash',
    'budget', 'deadline', 'resolvedModel', 'testSuite',
  ], 'contract');
  if (contract.contractVersion !== FULL_CONTRACT_VERSION) throw new FullContractError('contractVersion desteklenmiyor');
  const permissions = requireObject(contract.permissions, 'permissions');
  requireExactKeys(permissions, ['allowedCommands'], 'permissions');
  if (!Array.isArray(permissions.allowedCommands) || permissions.allowedCommands.length === 0) {
    throw new FullContractError('permissions.allowedCommands bos olmaz');
  }
  const allowedCommands = permissions.allowedCommands.map((command) => requireString(command, 'permissions.allowedCommands', 128));
  if (new Set(allowedCommands).size !== allowedCommands.length) throw new FullContractError('permissions.allowedCommands tekrarli');
  const budget = requireObject(contract.budget, 'budget');
  requireExactKeys(budget, ['maxReservedTokens'], 'budget');
  const deadline = requireObject(contract.deadline, 'deadline');
  requireExactKeys(deadline, ['at'], 'deadline');
  const testSuite = requireObject(contract.testSuite, 'testSuite');
  requireExactKeys(testSuite, ['hash', 'command'], 'testSuite');
  return {
    contractVersion: FULL_CONTRACT_VERSION,
    goal: requireString(contract.goal, 'goal', 2000),
    source: normalizeSource(contract.source),
    permissions: { allowedCommands: [...allowedCommands].sort() },
    plan: normalizePlan(contract.plan),
    evaluatorHash: requireHex(contract.evaluatorHash, 'evaluatorHash', 64),
    policyHash: requireHex(contract.policyHash, 'policyHash', 64),
    budget: { maxReservedTokens: requirePositiveInteger(budget.maxReservedTokens, 'budget.maxReservedTokens') },
    deadline: { at: requireIsoDate(deadline.at, 'deadline.at') },
    resolvedModel: normalizeResolvedModel(contract.resolvedModel),
    testSuite: {
      hash: requireHex(testSuite.hash, 'testSuite.hash', 64),
      command: requireString(testSuite.command, 'testSuite.command', 2048),
    },
  };
}

export function fullContractIdOf(input: unknown): string {
  return 'dcf1:' + sha256(canonicalJson(normalizeFullContract(input)));
}

export function approvalMatchesFullContract(input: unknown, approval: { contractId: string }): boolean {
  return fullContractIdOf(input) === approval.contractId;
}
