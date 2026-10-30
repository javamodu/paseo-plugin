import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import type { CandidateSeal } from './dc-candidate-seal.ts';

export const PROTECTED_RUNNER_VERSION = 'dc-protected-runner-v1';

export interface ProtectedRunnerInput {
  candidateSeal: CandidateSeal;
  repoPath: string;
  suiteFiles: readonly string[];
  runnerFile: string;
  command: string;
  args: readonly string[];
  expectedAttemptId: string;
  expectedSuiteHash: string;
  expectedRunnerHash: string;
  env?: NodeJS.ProcessEnv;
}

export interface ProtectedRunnerResult {
  ok: boolean;
  version: typeof PROTECTED_RUNNER_VERSION;
  runnerCalled: boolean;
  tests: number;
  failed: number;
  exitCode: number;
  stdout: string;
  reason: string | null;
  signerInherited: boolean;
}

export class ProtectedRunnerError extends Error {}

const gitBuffer = (repoPath: string, args: readonly string[]): Buffer =>
  execFileSync('git', ['-C', repoPath, ...args], { maxBuffer: 1024 * 1024 * 64 });

const gitText = (repoPath: string, args: readonly string[]): string =>
  execFileSync('git', ['-C', repoPath, ...args], { encoding: 'utf8' }).trim();

const sha256 = (value: string | Buffer): string => createHash('sha256').update(value).digest('hex');

const fileContentAtHead = (repoPath: string, path: string): Buffer =>
  gitBuffer(repoPath, ['show', `HEAD:${path}`]);

const hashFilesAtHead = (repoPath: string, files: readonly string[]): string => {
  if (files.length === 0) throw new ProtectedRunnerError('suite dosya listesi boş olamaz');
  const contents = [...files].sort().map((path) => fileContentAtHead(repoPath, path));
  return sha256(Buffer.concat(contents.map((content) => Buffer.concat([content, Buffer.from('\0')]))));
};

const assertCleanWorktree = (repoPath: string): void => {
  const status = gitText(repoPath, ['status', '--porcelain=v1', '--untracked-files=all', '--ignored=matching']);
  if (status.length > 0) throw new ProtectedRunnerError('aday/suite/runner degisim veya izlenmeyen dosya var');
};

const assertCandidateSeal = (input: ProtectedRunnerInput): void => {
  if (input.candidateSeal.version !== 'dc-candidate-seal-v1') {
    throw new ProtectedRunnerError('aday mührü sürümü geçersiz');
  }
  if (input.candidateSeal.attemptId !== input.expectedAttemptId) {
    throw new ProtectedRunnerError('aday mührü attempt kimliği uyuşmuyor');
  }
  const commit = gitText(input.repoPath, ['rev-parse', 'HEAD']);
  const tree = gitText(input.repoPath, ['rev-parse', 'HEAD^{tree}']);
  if (input.candidateSeal.candidateCommit !== commit || input.candidateSeal.candidateTree !== tree) {
    throw new ProtectedRunnerError('aday mührü Git commit/tree kimliği bayat');
  }
  const entries = gitText(input.repoPath, ['ls-tree', '-r', '--full-tree', '-z', 'HEAD'])
    .split('\0')
    .filter((entry) => entry.length > 0)
    .map((entry) => /^(\d+) (blob) ([0-9a-f]+)\t(.+)$/.exec(entry))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => match[4]);
  const expectedFiles = [...input.suiteFiles, input.runnerFile].sort();
  if (JSON.stringify(entries.sort()) !== JSON.stringify(expectedFiles)) {
    throw new ProtectedRunnerError('aday mührü dosya manifesti suite/runner ile uyuşmuyor');
  }
  for (const file of input.candidateSeal.files) {
    const content = fileContentAtHead(input.repoPath, file.path);
    if (file.sha256 !== sha256(content) || file.bytes !== content.length) {
      throw new ProtectedRunnerError('aday mührü dosya kimliği bayat: ' + file.path);
    }
  }
};

const assertSuiteAndRunnerIdentity = (input: ProtectedRunnerInput): void => {
  const suiteHash = hashFilesAtHead(input.repoPath, input.suiteFiles);
  const runnerHash = hashFilesAtHead(input.repoPath, [input.runnerFile]);
  if (suiteHash !== input.expectedSuiteHash) throw new ProtectedRunnerError('suite kimliği uyuşmuyor');
  if (runnerHash !== input.expectedRunnerHash) throw new ProtectedRunnerError('runner kimliği uyuşmuyor');
};

const sanitizeRunnerEnv = (env: NodeJS.ProcessEnv): NodeJS.ProcessEnv => {
  const clean = { ...env };
  for (const key of Object.keys(clean)) {
    if (/^ORDU_(TEST_)?SIGNER|^ORDU_PRIVATE_KEY/.test(key)) delete clean[key];
  }
  delete clean.NODE_TEST_CONTEXT;
  delete clean.NODE_TEST_WORKER_ID;
  return clean;
};

const parseRunnerOutput = (stdout: string): { tests: number; failed: number; signerSeen?: boolean } => {
  const lines = stdout.trim().split(/\r?\n/).filter((line) => line.trim().length > 0);
  const last = lines[lines.length - 1];
  if (!last) throw new ProtectedRunnerError('runner stdout boş');
  const parsed = JSON.parse(last) as { tests?: unknown; failed?: unknown; signerSeen?: unknown };
  if (!Number.isSafeInteger(parsed.tests) || !Number.isSafeInteger(parsed.failed)) {
    throw new ProtectedRunnerError('runner protokolü tamsayı değil');
  }
  return { tests: parsed.tests as number, failed: parsed.failed as number, signerSeen: parsed.signerSeen === true };
};

export function runProtectedRunner(input: ProtectedRunnerInput): ProtectedRunnerResult {
  let runnerCalled = false;
  const base = {
    ok: false,
    version: PROTECTED_RUNNER_VERSION,
    runnerCalled: false,
    tests: 0,
    failed: 0,
    exitCode: 1,
    stdout: '',
    reason: null as string | null,
    signerInherited: false,
  };
  try {
    assertCleanWorktree(input.repoPath);
    assertCandidateSeal(input);
    assertSuiteAndRunnerIdentity(input);
    const env = sanitizeRunnerEnv(input.env ?? process.env);
    const spawned = spawnSync(input.command, [...input.args], {
      cwd: input.repoPath,
      env,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 64,
    });
    runnerCalled = true;
    const stdout = String(spawned.stdout ?? '');
    const exitCode = typeof spawned.status === 'number' ? spawned.status : 1;
    if (spawned.error) {
      return { ...base, stdout, exitCode, reason: spawned.error.message };
    }
    const parsed = parseRunnerOutput(stdout);
    const signerInherited = parsed.signerSeen === true;
    const ok = exitCode === 0 && parsed.tests > 0 && parsed.failed === 0 && signerInherited === false;
    return {
      ...base,
      ok,
      runnerCalled,
      tests: parsed.tests,
      failed: parsed.failed,
      exitCode,
      stdout,
      reason: ok ? null : 'runner sonucu RED',
      signerInherited,
    };
  } catch (error) {
    return {
      ...base,
      runnerCalled,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
