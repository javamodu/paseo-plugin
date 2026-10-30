import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

const oracleASource = [
  "import { test } from 'node:test';",
  "import assert from 'node:assert/strict';",
  "test('pilot A acceptance', () => assert.equal(1, 1));",
].join('\n');

const oracleBSource = [
  "import { test } from 'node:test';",
  "import assert from 'node:assert/strict';",
  "test('pilot B acceptance', () => assert.equal(1, 1));",
].join('\n');

const oracleCSource = [
  "import { test } from 'node:test';",
  "import assert from 'node:assert/strict';",
  "import { spawnSync } from 'node:child_process';",
  "import { join } from 'node:path';",
  "const root = process.env.PILOT_C_ROOT;",
  "const cli = join(root, 'src/task-cli.mjs');",
  "const input = process.env.PILOT_C_INPUT;",
  "const output = process.env.PILOT_C_OUTPUT;",
  "const run = (args) => spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });",
  "test('pilot C acceptance', () => {",
  "  const repair = run(['repair', '--input', input, '--output', output]);",
  "  assert.equal(repair.status, 0);",
  "  const payload = JSON.parse(repair.stdout);",
  "  assert.equal(payload.ok, true);",
  "  assert.equal(payload.repaired, 1);",
  "  assert.equal(payload.generalReliability, false);",
  "});",
].join('\n');

const packageJson = JSON.stringify({ type: 'module', private: true, version: '0.3.0' }, null, 2) + '\n';

const taskCliSource = [
  "import { existsSync, readFileSync, writeFileSync } from 'node:fs';",
  "import { dirname, resolve } from 'node:path';",
  "",
  "const args = process.argv.slice(2);",
  "const command = args[0];",
  "",
  "const fail = (message) => {",
  "  console.log(JSON.stringify({ ok: false, error: message }));",
  "  process.exitCode = 1;",
  "};",
  "",
  "if (process.env.PILOT_C_ORACLE_READY !== '1' || process.env.PILOT_C_LIVE_ALLOWED !== '1') {",
  "  fail('oracle or live permission missing');",
  "  process.exit(1);",
  "}",
  "",
  "const flag = (name) => {",
  "  const index = args.indexOf('--' + name);",
  "  return index >= 0 ? args[index + 1] : undefined;",
  "};",
  "",
  "if (command === 'repair') {",
  "  const input = flag('input');",
  "  const output = flag('output');",
  "  if (!input || !output) {",
  "    fail('input and output required');",
  "    process.exit(1);",
  "  }",
  "  const inputPath = resolve(input);",
  "  const outputPath = resolve(output);",
  "  if (!existsSync(inputPath)) {",
  "    fail('old data missing');",
  "    process.exit(1);",
  "  }",
  "  const oldTasks = JSON.parse(readFileSync(inputPath, 'utf8'));",
  "  if (!Array.isArray(oldTasks)) {",
  "    fail('old data invalid');",
  "    process.exit(1);",
  "  }",
  "  const fixedTasks = oldTasks.map((task) => ({",
  "    id: task.id,",
  "    title: task.title,",
  "    createdAt: task.createdAt ?? new Date().toISOString(),",
  "    completedAt: task.completedAt ?? (task.done ? new Date().toISOString() : null),",
  "  }));",
  "  const outputDir = dirname(outputPath);",
  "  if (!existsSync(outputDir)) {",
  "    fail('output directory missing');",
  "    process.exit(1);",
  "  }",
  "  writeFileSync(outputPath, JSON.stringify(fixedTasks, null, 2), 'utf8');",
  "  console.log(JSON.stringify({ ok: true, repaired: fixedTasks.length, generalReliability: false, scope: 'maintenance' }));",
  "} else {",
  "  fail('unknown command');",
  "  process.exit(1);",
  "}",
].join('\n');

function createOldDataRoot(): { root: string; oldDataPath: string } {
  const root = mkdtempSync(join(tmpdir(), 'dc-pilot-c-old-'));
  const oldDataPath = join(root, 'tasks-old.json');
  writeFileSync(oldDataPath, JSON.stringify([{ id: 'old-1', title: 'eski görev', done: true }], null, 2), 'utf8');
  return { root, oldDataPath };
}

function createPilotRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'dc-pilot-c-'));
  mkdirSync(join(root, 'src'), { recursive: true });
  mkdirSync(join(root, 'output'), { recursive: true });
  writeFileSync(join(root, 'package.json'), packageJson, 'utf8');
  writeFileSync(join(root, 'src', 'task-cli.mjs'), taskCliSource, 'utf8');
  return root;
}

function createOracleRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'dc-pilot-c-oracle-'));
  writeFileSync(join(root, 'acceptance-a.test.mjs'), oracleASource, 'utf8');
  writeFileSync(join(root, 'acceptance-b.test.mjs'), oracleBSource, 'utf8');
  writeFileSync(join(root, 'acceptance-c.test.mjs'), oracleCSource, 'utf8');
  return root;
}

function runTaskCli(root: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, [join(root, 'src', 'task-cli.mjs'), ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PILOT_C_ROOT: root, ...env },
  });
}

test('P1: eski veriyle yeni sürüm çalışır ve gerçek düzeltme gözlenir', () => {
  const oracleRoot = createOracleRoot();
  const pilotRoot = createPilotRoot();
  const oldData = createOldDataRoot();
  const outputPath = join(pilotRoot, 'output', 'tasks-fixed.json');
  const oracleCPath = join(oracleRoot, 'acceptance-c.test.mjs');
  const oracleCHash = sha256(readFileSync(oracleCPath));
  try {
    const oracle = spawnSync(process.execPath, [oracleCPath], {
      cwd: oracleRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        PILOT_C_ROOT: pilotRoot,
        PILOT_C_INPUT: oldData.oldDataPath,
        PILOT_C_OUTPUT: outputPath,
        PILOT_C_ORACLE_READY: '1',
        PILOT_C_LIVE_ALLOWED: '1',
      },
    });
    assert.equal(oracle.status, 0);
    assert.equal(sha256(readFileSync(oracleCPath)), oracleCHash);
    assert.equal(existsSync(outputPath), true);
    const fixed = JSON.parse(readFileSync(outputPath, 'utf8'));
    assert.equal(fixed.length, 1);
    assert.equal(fixed[0].completedAt !== null, true);
    console.log('PILOT_C_EVIDENCE ' + JSON.stringify({
      pilotRoot,
      oracleRoot,
      oldDataRoot: oldData.root,
      oldDataHash: sha256(readFileSync(oldData.oldDataPath)),
      oracleCHash,
      pilotPackageHash: sha256(readFileSync(join(pilotRoot, 'package.json'))),
      pilotCliHash: sha256(readFileSync(join(pilotRoot, 'src', 'task-cli.mjs'))),
      outputHash: sha256(readFileSync(outputPath)),
    }));
  } finally {
    rmSync(oracleRoot, { recursive: true, force: true });
    rmSync(pilotRoot, { recursive: true, force: true });
    rmSync(oldData.root, { recursive: true, force: true });
  }
});

test('N1: eski veri değiştirilmez', () => {
  const oracleRoot = createOracleRoot();
  const pilotRoot = createPilotRoot();
  const oldData = createOldDataRoot();
  const outputPath = join(pilotRoot, 'output', 'tasks-fixed.json');
  const before = sha256(readFileSync(oldData.oldDataPath));
  try {
    const repair = runTaskCli(pilotRoot, ['repair', '--input', oldData.oldDataPath, '--output', outputPath], {
      PILOT_C_ORACLE_READY: '1',
      PILOT_C_LIVE_ALLOWED: '1',
    });
    assert.equal(repair.status, 0);
    assert.equal(sha256(readFileSync(oldData.oldDataPath)), before);
    assert.equal(existsSync(outputPath), true);
  } finally {
    rmSync(oracleRoot, { recursive: true, force: true });
    rmSync(pilotRoot, { recursive: true, force: true });
    rmSync(oldData.root, { recursive: true, force: true });
  }
});

test('N2: üç teslim genel güvenilirlik örneklemi değildir', () => {
  const oracleRoot = createOracleRoot();
  const pilotRoot = createPilotRoot();
  const oldData = createOldDataRoot();
  const outputPath = join(pilotRoot, 'output', 'tasks-fixed.json');
  try {
    const repair = runTaskCli(pilotRoot, ['repair', '--input', oldData.oldDataPath, '--output', outputPath], {
      PILOT_C_ORACLE_READY: '1',
      PILOT_C_LIVE_ALLOWED: '1',
    });
    assert.equal(repair.status, 0);
    const payload = JSON.parse(repair.stdout);
    assert.equal(payload.generalReliability, false);
    assert.equal(payload.scope, 'maintenance');
  } finally {
    rmSync(oracleRoot, { recursive: true, force: true });
    rmSync(pilotRoot, { recursive: true, force: true });
    rmSync(oldData.root, { recursive: true, force: true });
  }
});
