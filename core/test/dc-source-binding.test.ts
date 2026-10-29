import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { planHashOf } from '../src/supervisor.ts';
import { FULL_CONTRACT_VERSION, fullContractIdOf, normalizeFullContract } from '../src/dc-full-contract.ts';
import { ADR_BINDING, bindApprovedContract, readContractBindingRecord } from '../src/dc-contract-binding.ts';

const git = (repoPath: string, args: string[]) => execFileSync('git', ['-C', repoPath, ...args], { encoding: 'utf8' });

function freshRepo(prefix: string) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const repoPath = join(root, 'repo');
  execFileSync('git', ['init', '-q', repoPath]);
  git(repoPath, ['config', 'user.email', 't@t']);
  git(repoPath, ['config', 'user.name', 't']);
  writeFileSync(join(repoPath, 'README.md'), 'v1\n');
  git(repoPath, ['add', '.']);
  git(repoPath, ['commit', '-q', '-m', 'approved']);
  const c1 = git(repoPath, ['rev-parse', 'HEAD']).trim();
  writeFileSync(join(repoPath, 'README.md'), 'v2\n');
  git(repoPath, ['add', '.']);
  git(repoPath, ['commit', '-q', '-m', 'main advanced']);
  const c2 = git(repoPath, ['rev-parse', 'HEAD']).trim();
  return { root, repoPath, c1, c2 };
}

const contractFor = (repository: string, objectId: string, objectAlgorithm: 'sha1' | 'sha256' = 'sha1') => {
  const nodes = [
    { id: 'research', role: 'researcher', deps: [] as string[], provider: 'codex', model: 'glm-5.3' },
    { id: 'write', role: 'writer', deps: ['research'], provider: 'codex', model: 'glm-5.3' },
  ];
  return {
    contractVersion: FULL_CONTRACT_VERSION,
    goal: 'Onayli kaynak nesnesini bagla',
    source: { repository, objectAlgorithm, objectId },
    permissions: { allowedCommands: ['git'] },
    plan: { nodes, legacyHash: planHashOf(nodes) },
    evaluatorHash: createHash('sha256').update('evaluator').digest('hex'),
    policyHash: createHash('sha256').update('policy').digest('hex'),
    budget: { maxReservedTokens: 10000 },
    deadline: { at: '2026-11-01T00:00:00.000Z' },
    resolvedModel: { provider: 'codex', model: 'glm-5.3' },
    testSuite: { hash: createHash('sha256').update('suite').digest('hex'), command: 'node --test' },
  };
};

const bindingFor = (contract: unknown) => bindApprovedContract({
  contract,
  approval: { approvalId: 'apv-source', decision: 'APPROVED' },
  ledger: { stream: 'commands', recordId: 'cmd-source', commandKind: 'APPROVE_PLAN' },
  adr: ADR_BINDING,
});

function resolveSourceBinding(contract: unknown, binding: unknown) {
  const record = readContractBindingRecord(binding);
  if (record.kind !== 'current') return { ok: false, spawn: 0 };
  const contractId = fullContractIdOf(contract);
  if (record.binding.contractId !== contractId) return { ok: false, spawn: 0 };
  const normalized = normalizeFullContract(contract);
  const repository = normalized.source.repository;
  const objectAlgorithm = normalized.source.objectAlgorithm;
  const objectId = normalized.source.objectId;
  try {
    const repoAlgorithm = git(repository, ['rev-parse', '--show-object-format']).trim();
    if (objectAlgorithm !== repoAlgorithm) return { ok: false, spawn: 0 };
    const resolved = git(repository, ['rev-parse', '--verify', objectId + '^{commit}']).trim();
    if (resolved !== objectId) return { ok: false, spawn: 0 };
    return { ok: true, spawn: 1, repository, objectAlgorithm, objectId, contractId };
  } catch {
    return { ok: false, spawn: 0 };
  }
}

test('P1: onayli kaynak kimligi ana HEAD ilerlese de C1 nesnesine bagli kalir', () => {
  const repo = freshRepo('ordu-s1-03-');
  const contract = contractFor(repo.repoPath, repo.c1);
  const binding = bindingFor(contract);
  const resolved = resolveSourceBinding(contract, binding);
  assert.equal(resolved.ok, true);
  assert.equal(resolved.spawn, 1);
  assert.equal(resolved.objectId, repo.c1);
  assert.notEqual(resolved.objectId, repo.c2);
  const worktreePath = join(repo.root, 'wt-approved');
  try {
    git(repo.repoPath, ['worktree', 'add', '--detach', worktreePath, repo.c1]);
    const worktreeHead = git(worktreePath, ['rev-parse', 'HEAD']).trim();
    assert.equal(worktreeHead, repo.c1);
    assert.notEqual(worktreeHead, repo.c2);
    git(repo.repoPath, ['worktree', 'remove', '--force', worktreePath]);
  } finally {
    rmSync(repo.root, { recursive: true, force: true });
  }
});

test('N1: yanlis repo, nesne, algoritma veya kopuk sozlesme baginda spawn 0', () => {
  const repo = freshRepo('ordu-s1-03-main-');
  const other = freshRepo('ordu-s1-03-other-');
  try {
    const contract = contractFor(repo.repoPath, repo.c1);
    const binding = bindingFor(contract);
    assert.equal(resolveSourceBinding(contract, binding).spawn, 1);
    const wrongRepoContract = contractFor(other.repoPath, repo.c1);
    assert.equal(resolveSourceBinding(wrongRepoContract, bindingFor(wrongRepoContract)).spawn, 0);
    const missingObjectContract = contractFor(repo.repoPath, '0'.repeat(40));
    assert.equal(resolveSourceBinding(missingObjectContract, bindingFor(missingObjectContract)).spawn, 0);
    const wrongAlgorithmContract = contractFor(repo.repoPath, 'f'.repeat(64), 'sha256');
    assert.equal(resolveSourceBinding(wrongAlgorithmContract, bindingFor(wrongAlgorithmContract)).spawn, 0);
    const brokenBinding = { ...bindingFor(contract), contractId: 'dcf1:' + '0'.repeat(64) };
    assert.equal(resolveSourceBinding(contract, brokenBinding).spawn, 0);
  } finally {
    rmSync(repo.root, { recursive: true, force: true });
    rmSync(other.root, { recursive: true, force: true });
  }
});

test('N2: SHA-256 ozeti ve Git nesne kimligi ayri alanlardir', () => {
  const repo = freshRepo('ordu-s1-03-hash-');
  try {
    const contract = contractFor(repo.repoPath, repo.c1);
    const binding = bindingFor(contract);
    const resolved = resolveSourceBinding(contract, binding);
    const sha256 = createHash('sha256').update(repo.c1).digest('hex');
    assert.equal(resolved.objectAlgorithm, 'sha1');
    assert.equal(resolved.objectId.length, 40);
    assert.equal(sha256.length, 64);
    assert.notEqual(resolved.objectId, sha256);
    assert.notEqual(resolved.objectId, resolved.contractId);
    assert.notEqual(sha256, resolved.contractId.slice('dcf1:'.length));
  } finally {
    rmSync(repo.root, { recursive: true, force: true });
  }
});
