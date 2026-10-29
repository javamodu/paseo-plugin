import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const BOUNDARY_MECHANISM = 'windows-ntfs-deny-write-v1';

function currentUser() {
  return execFileSync('whoami', { encoding: 'utf8' }).trim();
}

export function createBoundaryFixture() {
  if (process.platform !== 'win32') {
    throw new Error(`boundary fixture only supports win32, received ${process.platform}`);
  }

  const root = mkdtempSync(join(tmpdir(), 'dc-boundary-'));
  const allowedDir = join(root, 'allowed');
  const protectedDir = join(root, 'protected');
  mkdirSync(allowedDir);
  mkdirSync(protectedDir);

  const allowedFile = join(allowedDir, 'allowed.txt');
  const protectedFile = join(protectedDir, 'protected.txt');
  writeFileSync(protectedFile, 'protected');

  const user = currentUser();
  execFileSync('icacls', [protectedFile, '/deny', `${user}:W`], { stdio: 'ignore' });

  return { root, allowedDir, allowedFile, protectedFile, user };
}

export function cleanupBoundaryFixture(fixture) {
  try {
    execFileSync('icacls', [fixture.protectedFile, '/remove:d', fixture.user], { stdio: 'ignore' });
  } catch {
    // cleanup is best effort; the file itself is not a production artifact
  }
  rmSync(fixture.root, { recursive: true, force: true });
}

export function boundaryWorkerScript({ allowedPath, protectedPath }) {
  return `
const fs = require('node:fs');
const allowedPath = ${JSON.stringify(allowedPath)};
const protectedPath = ${JSON.stringify(protectedPath)};
let allowedOk = true;
let protectedOk = true;
let protectedError = '';
try {
  fs.writeFileSync(allowedPath, 'allowed');
} catch (error) {
  allowedOk = false;
}
try {
  fs.writeFileSync(protectedPath, 'blocked');
} catch (error) {
  protectedOk = false;
  protectedError = String(error.message || error);
}
console.log(JSON.stringify({ allowedOk, protectedOk, protectedError }));
`;
}
