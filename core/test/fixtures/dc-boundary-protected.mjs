import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const PROTECTED_BOUNDARY_MECHANISM = 'windows-ntfs-deny-write-v1';

function currentUser() {
  return execFileSync('whoami', { encoding: 'utf8' }).trim();
}

export function createProtectedBoundaryFixture() {
  if (process.platform !== 'win32') {
    throw new Error(`protected boundary fixture only supports win32, received ${process.platform}`);
  }

  const root = mkdtempSync(join(tmpdir(), 'dc-protected-'));
  const allowedDir = join(root, 'allowed');
  const protectedDir = join(root, 'protected');
  mkdirSync(allowedDir);
  mkdirSync(protectedDir);

  const protectedFiles = {
    db: join(protectedDir, 'db.sqlite'),
    approval: join(protectedDir, 'approval.json'),
    suite: join(protectedDir, 'suite.json'),
    key: join(protectedDir, 'signing-key.pem'),
    parent: join(root, 'parent-guard.txt'),
  };
  for (const file of Object.values(protectedFiles)) writeFileSync(file, 'protected');
  const initialHashes = Object.fromEntries(
    Object.entries(protectedFiles).map(([name, path]) => [
      name,
      createHash('sha256').update(readFileSync(path)).digest('hex'),
    ]),
  );

  const user = currentUser();
  for (const file of Object.values(protectedFiles)) {
    execFileSync('icacls', [file, '/deny', `${user}:W`], { stdio: 'ignore' });
  }
  execFileSync('icacls', [protectedDir, '/deny', `${user}:W`], { stdio: 'ignore' });

  const junction = join(allowedDir, 'junction');
  symlinkSync(protectedDir, junction, 'junction');
  const junctionFile = join(junction, 'db.sqlite');

  return { root, allowedDir, protectedDir, protectedFiles, junction, junctionFile, user, initialHashes };
}

export function releaseProtectedBoundaryPermissions(fixture) {
  try {
    execFileSync('icacls', [fixture.protectedDir, '/remove:d', fixture.user], { stdio: 'ignore' });
  } catch {
  }
  for (const file of Object.values(fixture.protectedFiles)) {
    try {
      execFileSync('icacls', [file, '/remove:d', fixture.user], { stdio: 'ignore' });
    } catch {
    }
  }
}

export function cleanupProtectedBoundaryFixture(fixture) {
  releaseProtectedBoundaryPermissions(fixture);
  rmSync(fixture.root, { recursive: true, force: true });
}

export function protectedBoundaryWorkerScript({ allowedPath, protectedPaths, junctionPath, nestedProtectedPath }) {
  return `
const fs = require('node:fs');
const cp = require('node:child_process');
const allowedPath = ${JSON.stringify(allowedPath)};
const protectedPaths = ${JSON.stringify(protectedPaths)};
const junctionPath = ${JSON.stringify(junctionPath)};
const nestedProtectedPath = ${JSON.stringify(nestedProtectedPath)};
function tryWrite(path) {
  try {
    fs.writeFileSync(path, 'escape');
    return { ok: true, error: '' };
  } catch (error) {
    return { ok: false, error: String(error.message || error) };
  }
}
const attempts = { allowed: tryWrite(allowedPath) };
for (const [name, path] of Object.entries(protectedPaths)) attempts[name] = tryWrite(path);
attempts.junction = tryWrite(junctionPath);
const nestedScript = 'const fs = require("node:fs"); const path = ' + JSON.stringify(nestedProtectedPath) + '; try { fs.writeFileSync(path, "nested-escape"); console.log(JSON.stringify({ok:true,error:""})); } catch (error) { console.log(JSON.stringify({ok:false,error:String(error.message || error)})); }';
const nested = cp.spawnSync(process.execPath, ['-e', nestedScript], {
  cwd: process.cwd(),
  env: { SystemRoot: process.env.SystemRoot || 'C:\\\\Windows', TEMP: process.env.TMP, TMP: process.env.TMP },
  encoding: 'utf8',
});
const envLeak = ['ORDU_OPERATOR_TOKEN', 'ORDU_SIGNER_KEY', 'ORDU_PROVIDER_TOKEN'].filter((key) => process.env[key] !== undefined);
const networkEnvLeak = ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'ORDU_NETWORK_ENDPOINT', 'ORDU_PROVIDER_URL'].filter((key) => process.env[key] !== undefined);
console.log(JSON.stringify({ attempts, nested: JSON.parse(nested.stdout.trim()), envLeak, networkEnvLeak }));
`;
}
