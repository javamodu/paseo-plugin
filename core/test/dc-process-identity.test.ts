import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  PROCESS_IDENTITY_VERSION,
  appendProcessTreeRecord,
  buildProcessTreeRecord,
  confirmProcessDeath,
  readProcessTreeRecords,
  resolveKillTarget,
  resolveOwnershipAfterRestart,
} from '../src/dc-process-identity.ts';

const startedAt = '2026-10-30T01:00:00.000Z';
const recordedAt = '2026-10-30T01:00:01.000Z';

const identityOf = (pid: number, bootId = 'boot-a') => ({ pid, startedAt, bootId });

const recordOf = (rootPid: number, childPid: number, attemptId: string, ownerId: string, generation: number) =>
  buildProcessTreeRecord({
    attemptId,
    ownerId,
    ownershipGeneration: generation,
    root: { identity: identityOf(rootPid), parentPid: null },
    children: [{ identity: identityOf(childPid), parentPid: rootPid }],
    recordedAt,
  });

const snapshotOf = (rootPid: number, childPid: number, rootAlive = true, childAlive = true) => [
  { pid: rootPid, startedAt, bootId: 'boot-a', parentPid: null, alive: rootAlive },
  { pid: childPid, startedAt, bootId: 'boot-a', parentPid: rootPid, alive: childAlive },
];

test('P1: restart ayni attempt/sahiplik nesline bagli agaci bulur', () => {
  const root = mkdtempSync(join(tmpdir(), 'ordu-s3-01-restart-'));
  const registryPath = join(root, 'process-tree.jsonl');
  try {
    const record = recordOf(101, 102, 'att-restart', 'owner-restart', 7);
    appendProcessTreeRecord(registryPath, record);
    assert.equal(readProcessTreeRecords(registryPath).length, 1);
    const snapshot = snapshotOf(101, 102);
    const ownership = resolveOwnershipAfterRestart(registryPath, 'att-restart', snapshot);
    assert.equal(ownership?.ownerId, 'owner-restart');
    assert.equal(ownership?.ownershipGeneration, 7);
    assert.equal(ownership?.ownershipKey, 'att-restart:owner-restart:7');
    assert.equal(ownership?.root.identity.pid, 101);
    assert.equal(ownership?.children[0]?.identity.pid, 102);
    assert.deepEqual(resolveKillTarget(registryPath, 'att-restart', snapshot), identityOf(101));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('N1: PID yeniden kullanilinca baska surec kill hedefi olmaz', () => {
  const root = mkdtempSync(join(tmpdir(), 'ordu-s3-01-pid-reuse-'));
  const registryPath = join(root, 'process-tree.jsonl');
  try {
    const record = recordOf(201, 202, 'att-reuse', 'owner-reuse', 3);
    appendProcessTreeRecord(registryPath, record);
    const snapshot = [
      { pid: 201, startedAt: '2026-10-30T02:00:00.000Z', bootId: 'boot-b', parentPid: null, alive: true },
      { pid: 202, startedAt, bootId: 'boot-a', parentPid: 201, alive: true },
    ];
    assert.equal(resolveOwnershipAfterRestart(registryPath, 'att-reuse', snapshot), null);
    assert.equal(resolveKillTarget(registryPath, 'att-reuse', snapshot), null);
    assert.equal(confirmProcessDeath(registryPath, 'att-reuse', snapshot, 201), 'UNKNOWN');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('N2: olu ebeveyn veya bozuk kayit olum teyidi sayilmaz', () => {
  const root = mkdtempSync(join(tmpdir(), 'ordu-s3-01-death-'));
  const parentDeadPath = join(root, 'parent-dead.jsonl');
  const corruptedPath = join(root, 'corrupted.jsonl');
  try {
    const record = recordOf(301, 302, 'att-death', 'owner-death', 4);
    appendProcessTreeRecord(parentDeadPath, record);
    const parentDeadSnapshot = [
      { pid: 301, startedAt, bootId: 'boot-a', parentPid: null, alive: false },
      { pid: 302, startedAt, bootId: 'boot-a', parentPid: 301, alive: true },
    ];
    assert.equal(confirmProcessDeath(parentDeadPath, 'att-death', parentDeadSnapshot, 302), 'UNKNOWN');
    assert.equal(resolveOwnershipAfterRestart(parentDeadPath, 'att-death', parentDeadSnapshot), null);

    writeFileSync(corruptedPath, JSON.stringify({ recordVersion: PROCESS_IDENTITY_VERSION }) + '\n', 'utf8');
    assert.equal(readProcessTreeRecords(corruptedPath).length, 0);
    assert.equal(resolveOwnershipAfterRestart(corruptedPath, 'att-death', snapshotOf(301, 302)), null);
    assert.equal(confirmProcessDeath(corruptedPath, 'att-death', snapshotOf(301, 302), 302), 'UNKNOWN');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
