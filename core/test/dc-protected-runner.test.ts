import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

import { runProtectedRunner, type ProtectedRunnerInput } from '../src/dc-protected-runner.ts';
import { sealCandidate, type CandidateSeal } from '../src/dc-candidate-seal.ts';
import { reconcileUsage } from '../src/dc-usage-reconcile.ts';

const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

const suiteSource = [
  "const { test } = require('node:test');",
  "const assert = require('node:assert');",
  "test('birinci gercek gorev testi', () => assert.equal(1 + 1, 2));",
  "test('ikinci gercek gorev testi', () => assert.ok('ordu'.length > 0));",
].join('\n');

const realRunnerSource = [
  "const { spawnSync } = require('node:child_process');",
  "const env = Object.assign({}, process.env);",
  "delete env.NODE_TEST_CONTEXT;",
  "delete env.NODE_TEST_WORKER_ID;",
  "const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'suite.test.js'], { encoding: 'utf8', env });",
  "const pass = Number(/# pass (\\d+)/.exec(result.stdout)?.[1] ?? 0);",
  "const fail = Number(/# fail (\\d+)/.exec(result.stdout)?.[1] ?? 0);",
  "console.log(JSON.stringify({ tests: pass + fail, failed: fail, signerSeen: Boolean(process.env.ORDU_TEST_SIGNER) }));",
  "process.exit(result.status ?? 1);",
].join('\n');

const zeroRunnerSource = [
  "console.log(JSON.stringify({ tests: 0, failed: 0, signerSeen: false }));",
  "process.exit(0);",
].join('\n');

const fakeRunnerSource = [
  "console.log('her sey yolunda saniliyor');",
  "process.exit(0);",
].join('\n');

const failingRunnerSource = [
  "console.log(JSON.stringify({ tests: 1, failed: 1, signerSeen: false }));",
  "process.exit(1);",
].join('\n');

function protectedRepo(runnerSource: string, suiteContents = suiteSource): {
  repo: string;
  seal: CandidateSeal;
  input: ProtectedRunnerInput;
  clean: () => void;
} {
  const repo = mkdtempSync(join(tmpdir(), 'dc-protected-runner-repo-'));
  const sealDir = mkdtempSync(join(tmpdir(), 'dc-protected-runner-out-'));
  execFileSync('git', ['init'], { cwd: repo });
  writeFileSync(join(repo, 'suite.test.js'), suiteContents, 'utf8');
  writeFileSync(join(repo, 'runner.cjs'), runnerSource, 'utf8');
  execFileSync('git', ['add', '-A'], { cwd: repo });
  execFileSync('git', ['-c', 'user.name=ordu', '-c', 'user.email=ordu@local', 'commit', '-m', 'korunan gorev'], { cwd: repo });

  const usage = reconcileUsage({
    reports: [{ reportId: 'r-1', attemptId: 'att-protected', subProcessId: null, kind: 'SUCCESS', tokens: 33, reportedAt: '2026-10-30T07:00:00.000Z', source: 'fixture' }],
    expected: [{ attemptId: 'att-protected', subProcessId: null }],
    cutoff: '2026-10-30T08:00:00.000Z',
    independentLimit: true,
  });
  const seal = sealCandidate({
    attemptId: 'att-protected',
    repoPath: repo,
    writeClosure: { closed: true, closedAt: '2026-10-30T07:40:00.000Z' },
    usage,
    liveSubProcessIds: [],
    sealPath: join(sealDir, 'seal.json'),
  });
  const suiteHash = sha256(Buffer.concat([readFileSync(join(repo, 'suite.test.js')), Buffer.from('\0')]));
  const runnerHash = sha256(Buffer.concat([readFileSync(join(repo, 'runner.cjs')), Buffer.from('\0')]));
  const input: ProtectedRunnerInput = {
    candidateSeal: seal,
    repoPath: repo,
    suiteFiles: ['suite.test.js'],
    runnerFile: 'runner.cjs',
    command: process.execPath,
    args: [join(repo, 'runner.cjs')],
    expectedAttemptId: 'att-protected',
    expectedSuiteHash: suiteHash,
    expectedRunnerHash: runnerHash,
  };
  return {
    repo,
    seal,
    input,
    clean: () => {
      rmSync(repo, { recursive: true, force: true });
      rmSync(sealDir, { recursive: true, force: true });
    },
  };
}

test('P1: dogru gorev gercek korunan suite ile gecer ve imzalayici yetkisi miras alinmaz', () => {
  const { repo, input, clean } = protectedRepo(realRunnerSource);
  try {
    const result = runProtectedRunner({ ...input, env: { ...process.env, ORDU_TEST_SIGNER: 'test-secret' } });
    assert.equal(result.ok, true);
    assert.equal(result.runnerCalled, true);
    assert.equal(result.tests, 2);
    assert.equal(result.failed, 0);
    assert.equal(result.exitCode, 0);
    assert.equal(result.signerInherited, false);
    assert.equal(result.reason, null);
  } finally {
    void repo;
    clean();
  }
});

test('N1: sifir test, sahte stdout ve yanlis gorev sonucu RED', () => {
  const zero = protectedRepo(zeroRunnerSource);
  try {
    const result = runProtectedRunner(zero.input);
    assert.equal(result.ok, false);
    assert.equal(result.runnerCalled, true);
    assert.equal(result.reason, 'runner sonucu RED');
  } finally {
    zero.clean();
  }

  const fake = protectedRepo(fakeRunnerSource);
  try {
    const result = runProtectedRunner(fake.input);
    assert.equal(result.ok, false);
    assert.equal(result.runnerCalled, true);
    assert.ok(result.reason?.includes('runner') || result.reason?.includes('JSON'));
  } finally {
    fake.clean();
  }

  const failing = protectedRepo(failingRunnerSource);
  try {
    const result = runProtectedRunner(failing.input);
    assert.equal(result.ok, false);
    assert.equal(result.runnerCalled, true);
    assert.equal(result.failed, 1);
  } finally {
    failing.clean();
  }
});

test('N2: bayat kimlikte runner cagrilmaz', () => {
  const { repo, input, clean } = protectedRepo(realRunnerSource);
  try {
    writeFileSync(join(repo, 'suite.test.js'), suiteSource + '\n// degisim\n', 'utf8');
    const result = runProtectedRunner(input);
    assert.equal(result.ok, false);
    assert.equal(result.runnerCalled, false);
    assert.ok(result.reason?.includes('degisim'));
  } finally {
    void repo;
    clean();
  }
});

test('N2: bayat runner kimliginde runner cagrilmaz', () => {
  const { repo, input, clean } = protectedRepo(realRunnerSource);
  try {
    const result = runProtectedRunner({ ...input, expectedRunnerHash: sha256('wrong-runner') });
    assert.equal(result.ok, false);
    assert.equal(result.runnerCalled, false);
    assert.ok(result.reason?.includes('runner kimliği uyuşmuyor'));
  } finally {
    void repo;
    clean();
  }
});
