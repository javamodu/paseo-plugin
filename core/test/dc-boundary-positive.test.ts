import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  BOUNDARY_MECHANISM,
  boundaryWorkerScript,
  cleanupBoundaryFixture,
  createBoundaryFixture,
} from './fixtures/dc-boundary-fixture.mjs';

test('DC-S0b-01: seçili Windows ACL sınırı izinli pilot-test alanına yazar', () => {
  const fixture = createBoundaryFixture();
  try {
    assert.equal(BOUNDARY_MECHANISM, 'windows-ntfs-deny-write-v1');
    const script = boundaryWorkerScript({
      allowedPath: fixture.allowedFile,
      protectedPath: fixture.protectedFile,
    });
    const result = spawnSync(process.execPath, ['-e', script], {
      cwd: fixture.allowedDir,
      env: { SystemRoot: process.env.SystemRoot, TEMP: fixture.allowedDir, TMP: fixture.allowedDir },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0);
    const parsed = JSON.parse(result.stdout.trim());
    assert.equal(parsed.allowedOk, true, 'izinli pilot-test alanına yazma başarısız');
    assert.equal(parsed.protectedOk, false, 'korunan dosyaya yazma beklenmedik şekilde başarılı');
    assert.match(parsed.protectedError, /EACCES|EPERM|PERMISSION|denied|izin/i);
  } finally {
    cleanupBoundaryFixture(fixture);
  }
});
