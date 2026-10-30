import { execFileSync } from 'node:child_process';
import { chmodSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { UsageReconciliation } from './dc-usage-reconcile.ts';

export const CANDIDATE_SEAL_VERSION = 'dc-candidate-seal-v1';

export interface CandidateWriteClosure {
  closed: true;
  closedAt: string;
}

export interface CandidateSealInput {
  attemptId: string;
  repoPath: string;
  writeClosure: CandidateWriteClosure;
  usage: readonly UsageReconciliation[];
  liveSubProcessIds: readonly string[];
  sealPath: string;
}

export interface CandidateFileSeal {
  path: string;
  sha256: string;
  bytes: number;
}

export interface CandidateSeal {
  version: typeof CANDIDATE_SEAL_VERSION;
  attemptId: string;
  candidateCommit: string;
  candidateTree: string;
  writeClosureClosedAt: string;
  sealedAt: string;
  files: readonly CandidateFileSeal[];
}

export class CandidateSealError extends Error {}

const gitText = (repoPath: string, args: readonly string[]): string =>
  execFileSync('git', ['-C', repoPath, ...args], { encoding: 'utf8' }).trim();

const gitBuffer = (repoPath: string, args: readonly string[]): Buffer =>
  execFileSync('git', ['-C', repoPath, ...args], { maxBuffer: 1024 * 1024 * 64 });

const assertCleanWorktree = (repoPath: string): void => {
  const status = gitText(repoPath, ['status', '--porcelain=v1', '--untracked-files=all', '--ignored=matching']);
  if (status.length > 0) {
    throw new CandidateSealError('aday degisim/izlenmeyen dosya var — mühür RED');
  }
};

const assertUsageClosed = (attemptId: string, usage: readonly UsageReconciliation[]): void => {
  if (usage.length === 0) throw new CandidateSealError('kullanim kapanışı yok — mühür RED');
  for (const record of usage) {
    if (record.attemptId !== attemptId) throw new CandidateSealError('kullanim kaydi başka attempt — mühür RED');
    if (record.outcome !== 'SETTLED') throw new CandidateSealError('kullanim SETTLED değil — mühür RED');
    if (record.effectOpened !== false) throw new CandidateSealError('kullanim yeni etki açtı — mühür RED');
  }
};

const assertNoLiveSubProcesses = (liveSubProcessIds: readonly string[]): void => {
  if (liveSubProcessIds.length > 0) throw new CandidateSealError('yaşayan alt süreç var — mühür RED');
};

const parseGitTreeEntries = (repoPath: string): readonly { path: string; objectHash: string }[] => {
  const output = gitText(repoPath, ['ls-tree', '-r', '--full-tree', '-z', 'HEAD']);
  return output
    .split('\0')
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const match = /^(\d+) (blob) ([0-9a-f]+)\t(.+)$/.exec(entry);
      if (!match) throw new CandidateSealError('Git tree girdisi çözülemedi');
      return { path: match[4], objectHash: match[3] };
    });
};

export function sealCandidate(input: CandidateSealInput): CandidateSeal {
  if (input.writeClosure.closed !== true) throw new CandidateSealError('yazma kapanışı kapalı değil — mühür RED');
  assertUsageClosed(input.attemptId, input.usage);
  assertNoLiveSubProcesses(input.liveSubProcessIds);
  assertCleanWorktree(input.repoPath);

  const candidateCommit = gitText(input.repoPath, ['rev-parse', 'HEAD']);
  const candidateTree = gitText(input.repoPath, ['rev-parse', 'HEAD^{tree}']);
  const entries = parseGitTreeEntries(input.repoPath);
  if (entries.length === 0) throw new CandidateSealError('aday dosya manifesti boş — mühür RED');

  const files = entries.map((entry) => {
    const content = gitBuffer(input.repoPath, ['show', `HEAD:${entry.path}`]);
    return {
      path: entry.path,
      sha256: createHash('sha256').update(content).digest('hex'),
      bytes: content.length,
    };
  });

  const seal: CandidateSeal = {
    version: CANDIDATE_SEAL_VERSION,
    attemptId: input.attemptId,
    candidateCommit,
    candidateTree,
    writeClosureClosedAt: input.writeClosure.closedAt,
    sealedAt: new Date().toISOString(),
    files,
  };
  writeFileSync(input.sealPath, JSON.stringify(seal, null, 2) + '\n', 'utf8');
  chmodSync(input.sealPath, 0o444);
  return seal;
}
