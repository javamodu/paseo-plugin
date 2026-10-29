import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PROTECTED_BOUNDARY_MECHANISM,
  cleanupProtectedBoundaryFixture,
  createProtectedBoundaryFixture,
  releaseProtectedBoundaryPermissions,
  protectedBoundaryWorkerScript,
} from './fixtures/dc-boundary-protected.mjs';

const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');

test('DC-S0b-02: protected area and escape negatives are enforced by Windows ACL', () => {
  const fixture = createProtectedBoundaryFixture();
  try {
    assert.equal(PROTECTED_BOUNDARY_MECHANISM, 'windows-ntfs-deny-write-v1');
    const before = fixture.initialHashes;
    const allowedPath = join(fixture.allowedDir, 'allowed.txt');
    const script = protectedBoundaryWorkerScript({
      allowedPath,
      protectedPaths: fixture.protectedFiles,
      junctionPath: fixture.junctionFile,
      nestedProtectedPath: fixture.protectedFiles.db,
    });
    const result = spawnSync(process.execPath, ['-e', script], {
      cwd: fixture.allowedDir,
      env: {
        SystemRoot: process.env.SystemRoot || 'C:\\Windows',
        TEMP: fixture.allowedDir,
        TMP: fixture.allowedDir,
      },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0);
    const parsed = JSON.parse(result.stdout.trim());
    assert.equal(parsed.attempts.allowed.ok, true, 'allowed write unexpectedly failed');
    for (const [name, attempt] of Object.entries(parsed.attempts)) {
      if (name !== 'allowed') {
        assert.equal(attempt.ok, false, `${name} write unexpectedly succeeded`);
      }
    }
    assert.equal(parsed.nested.ok, false, 'nested subprocess unexpectedly wrote protected file');
    assert.deepEqual(parsed.envLeak, [], 'operator/signer/provider environment leaked');
    assert.deepEqual(parsed.networkEnvLeak, [], 'network environment leaked');
    releaseProtectedBoundaryPermissions(fixture);
    const after = Object.fromEntries(
      Object.entries(fixture.protectedFiles).map(([name, path]) => [name, sha256(path)]),
    );
    assert.deepEqual(after, before, 'protected files changed');
  } finally {
    cleanupProtectedBoundaryFixture(fixture);
  }
});
