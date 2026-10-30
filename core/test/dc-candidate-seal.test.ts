import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

import { CANDIDATE_SEAL_VERSION, CandidateSealError, sealCandidate, type CandidateSealInput } from '../src/dc-candidate-seal.ts';
import { reconcileUsage } from '../src/dc-usage-reconcile.ts';

const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

function candidateRepo(): { repo: string; sealPath: string; clean: () => void } {
  const repo = mkdtempSync(join(tmpdir(), 'dc-candidate-seal-repo-'));
  const sealDir = mkdtempSync(join(tmpdir(), 'dc-candidate-seal-out-'));
  execFileSync('git', ['init'], { cwd: repo });
  writeFileSync(join(repo, 'a.txt'), 'aday-a', 'utf8');
  writeFileSync(join(repo, 'b.txt'), 'aday-b', 'utf8');
  execFileSync('git', ['add', '-A'], { cwd: repo });
  execFileSync('git', ['-c', 'user.name=ordu', '-c', 'user.email=ordu@local', 'commit', '-m', 'aday'], { cwd: repo });
  const sealPath = join(sealDir, 'seal.json');
  return {
    repo,
    sealPath,
    clean: () => {
      rmSync(repo, { recursive: true, force: true });
      rmSync(sealDir, { recursive: true, force: true });
    },
  };
}

const closedUsage = () =>
  reconcileUsage({
    reports: [{ reportId: 'r-1', attemptId: 'att-seal', subProcessId: null, kind: 'SUCCESS', tokens: 42, reportedAt: '2026-10-30T07:00:00.000Z', source: 'fixture' }],
    expected: [{ attemptId: 'att-seal', subProcessId: null }],
    cutoff: '2026-10-30T08:00:00.000Z',
    independentLimit: true,
  });

const goodInput = (repo: string, sealPath: string): CandidateSealInput => ({
  attemptId: 'att-seal',
  repoPath: repo,
  writeClosure: { closed: true, closedAt: '2026-10-30T07:30:00.000Z' },
  usage: closedUsage(),
  liveSubProcessIds: [],
  sealPath,
});

test('P1: bitmis attempt ve tam kullanim kapanisindan sonra aday Git tree/commit ile mühürlenir', () => {
  const { repo, sealPath, clean } = candidateRepo();
  try {
    const seal = sealCandidate(goodInput(repo, sealPath));
    const commit = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const tree = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD^{tree}'], { encoding: 'utf8' }).trim();
    assert.equal(seal.version, CANDIDATE_SEAL_VERSION);
    assert.equal(seal.attemptId, 'att-seal');
    assert.equal(seal.candidateCommit, commit);
    assert.equal(seal.candidateTree, tree);
    assert.deepEqual(seal.files.map((file) => file.path).sort(), ['a.txt', 'b.txt']);
    assert.equal(seal.files.find((file) => file.path === 'a.txt')?.sha256, sha256('aday-a'));
    assert.equal(seal.files.find((file) => file.path === 'a.txt')?.bytes, 6);
    assert.equal((statSync(sealPath).mode & 0o222), 0, 'test kopyasi salt-okur');
  } finally {
    clean();
  }
});

test('N1: yasayan alt süreç veya yazma yetkisi kapanmamissa mühür RED', () => {
  const { repo, sealPath, clean } = candidateRepo();
  try {
    const live = { ...goodInput(repo, sealPath), liveSubProcessIds: ['pid-1'] };
    assert.throws(() => sealCandidate(live), CandidateSealError);
    const open = { ...goodInput(repo, sealPath), writeClosure: { closed: false, closedAt: '2026-10-30T07:30:00.000Z' } as any };
    assert.throws(() => sealCandidate(open), CandidateSealError);
  } finally {
    clean();
  }
});

test('N1: aday degisiminde ve SETTLED olmayan kullanimda mühür RED', () => {
  const { repo, sealPath, clean } = candidateRepo();
  try {
    writeFileSync(join(repo, 'a.txt'), 'degisti', 'utf8');
    assert.throws(() => sealCandidate(goodInput(repo, sealPath)), CandidateSealError);
    execFileSync('git', ['-C', repo, 'checkout', '--', 'a.txt']);
    const usage = reconcileUsage({
      reports: [],
      expected: [{ attemptId: 'att-seal', subProcessId: null }],
      cutoff: '2026-10-30T08:00:00.000Z',
      independentLimit: true,
    });
    const input = { ...goodInput(repo, sealPath), usage };
    assert.throws(() => sealCandidate(input), CandidateSealError);
  } finally {
    clean();
  }
});

test('N2: izlenmeyen dosyalar sessizce atlanmaz', () => {
  const { repo, sealPath, clean } = candidateRepo();
  try {
    mkdirSync(join(repo, 'yeni'));
    writeFileSync(join(repo, 'yeni', 'izlenmeyen.txt'), 'politika disi', 'utf8');
    assert.throws(() => sealCandidate(goodInput(repo, sealPath)), CandidateSealError);
  } finally {
    clean();
  }
});
