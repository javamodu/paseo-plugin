import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

const oracleSource = [
  "import { test } from 'node:test';",
  "import assert from 'node:assert/strict';",
  "import { spawnSync } from 'node:child_process';",
  "import { join } from 'node:path';",
  "const root = process.env.PILOT_A_ROOT;",
  "const cli = join(root, 'src/task-cli.mjs');",
  "const run = (args) => spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });",
  "test('pilot A acceptance', () => {",
  "  const add = run(['add', '--title', 'görev 🚀']);",
  "  assert.equal(add.status, 0);",
  "  assert.equal(JSON.parse(add.stdout).ok, true);",
  "  const list = run(['list']);",
  "  assert.equal(list.status, 0);",
  "  const payload = JSON.parse(list.stdout);",
  "  assert.equal(payload.ok, true);",
  "  assert.equal(payload.tasks.length, 1);",
  "  assert.equal(payload.tasks[0].title, 'görev 🚀');",
  "});",
].join('\n');

const packageJson = JSON.stringify({ type: 'module', private: true, version: '0.1.0' }, null, 2) + '\n';

const taskCliSource = [
  "import { existsSync, readFileSync, writeFileSync } from 'node:fs';",
  "import { join, resolve } from 'node:path';",
  "import { randomUUID } from 'node:crypto';",
  "",
  "const root = resolve(process.env.PILOT_A_ROOT ?? process.cwd());",
  "const tasksPath = join(root, 'tasks.json');",
  "const args = process.argv.slice(2);",
  "const command = args[0];",
  "",
  "const fail = (message) => {",
  "  console.log(JSON.stringify({ ok: false, error: message }));",
  "  process.exitCode = 1;",
  "};",
  "",
  "if (process.env.PILOT_A_ORACLE_READY !== '1' || process.env.PILOT_A_LIVE_ALLOWED !== '1') {",
  "  fail('oracle or live permission missing');",
  "  process.exit(1);",
  "}",
  "if (!existsSync(root)) {",
  "  fail('pilot root missing');",
  "  process.exit(1);",
  "}",
  "",
  "const readTasks = () => {",
  "  if (!existsSync(tasksPath)) return [];",
  "  return JSON.parse(readFileSync(tasksPath, 'utf8'));",
  "};",
  "",
  "if (command === 'add') {",
  "  const titleIndex = args.indexOf('--title');",
  "  const title = titleIndex >= 0 ? args[titleIndex + 1] : undefined;",
  "  if (typeof title !== 'string' || title.trim().length === 0) {",
  "    fail('invalid title');",
  "    process.exit(1);",
  "  }",
  "  const tasks = readTasks();",
  "  const task = { id: randomUUID(), title, createdAt: new Date().toISOString() };",
  "  tasks.push(task);",
  "  writeFileSync(tasksPath, JSON.stringify(tasks, null, 2), 'utf8');",
  "  console.log(JSON.stringify({ ok: true, ...task }));",
  "} else if (command === 'list') {",
  "  console.log(JSON.stringify({ ok: true, tasks: readTasks() }, null, 2));",
  "} else {",
  "  fail('unknown command');",
  "  process.exit(1);",
  "}",
].join('\n');

function createOracleRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'dc-pilot-a-oracle-'));
  writeFileSync(join(root, 'acceptance-a.test.mjs'), oracleSource, 'utf8');
  return root;
}

function createPilotRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'dc-pilot-a-'));
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'package.json'), packageJson, 'utf8');
  writeFileSync(join(root, 'src', 'task-cli.mjs'), taskCliSource, 'utf8');
  return root;
}

function runTaskCli(root: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, [join(root, 'src', 'task-cli.mjs'), ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PILOT_A_ROOT: root, ...env },
  });
}

test('P1: insan görev ekler/listeler; Unicode ve kalıcılık çalışır', () => {
  const oracleRoot = createOracleRoot();
  const pilotRoot = createPilotRoot();
  const oraclePath = join(oracleRoot, 'acceptance-a.test.mjs');
  const oracleHashBefore = sha256(readFileSync(oraclePath));
  try {
    const oracle = spawnSync(process.execPath, [oraclePath], {
      cwd: oracleRoot,
      encoding: 'utf8',
      env: { ...process.env, PILOT_A_ROOT: pilotRoot, PILOT_A_ORACLE_READY: '1', PILOT_A_LIVE_ALLOWED: '1' },
    });
    assert.equal(oracle.status, 0);
    assert.ok(oracle.stdout.includes('pass 1'));

    const list = runTaskCli(pilotRoot, ['list'], { PILOT_A_ORACLE_READY: '1', PILOT_A_LIVE_ALLOWED: '1' });
    assert.equal(list.status, 0);
    const payload = JSON.parse(list.stdout);
    assert.equal(payload.ok, true);
    assert.equal(payload.tasks.length, 1);
    assert.equal(payload.tasks[0].title, 'görev 🚀');
    assert.equal(sha256(readFileSync(oraclePath)), oracleHashBefore);
    console.log('PILOT_A_EVIDENCE ' + JSON.stringify({
      pilotRoot,
      oracleRoot,
      oracleHash: oracleHashBefore,
      pilotPackageHash: sha256(readFileSync(join(pilotRoot, 'package.json'))),
      pilotCliHash: sha256(readFileSync(join(pilotRoot, 'src', 'task-cli.mjs'))),
      tasksHash: sha256(readFileSync(join(pilotRoot, 'tasks.json'))),
    }));
  } finally {
    rmSync(oracleRoot, { recursive: true, force: true });
    rmSync(pilotRoot, { recursive: true, force: true });
  }
});

test('N1: bozuk giriş reddedilir ve veri bozulmaz', () => {
  const oracleRoot = createOracleRoot();
  const pilotRoot = createPilotRoot();
  try {
    const first = runTaskCli(pilotRoot, ['add', '--title', 'geçerli görev'], { PILOT_A_ORACLE_READY: '1', PILOT_A_LIVE_ALLOWED: '1' });
    assert.equal(first.status, 0);
    const tasksPath = join(pilotRoot, 'tasks.json');
    const before = sha256(readFileSync(tasksPath));
    const invalid = runTaskCli(pilotRoot, ['add', '--title', ''], { PILOT_A_ORACLE_READY: '1', PILOT_A_LIVE_ALLOWED: '1' });
    assert.equal(invalid.status, 1);
    assert.equal(JSON.parse(invalid.stdout).ok, false);
    assert.equal(sha256(readFileSync(tasksPath)), before);
  } finally {
    rmSync(oracleRoot, { recursive: true, force: true });
    rmSync(pilotRoot, { recursive: true, force: true });
  }
});

test('N2: kök/oracle/sağlayıcı izni yoksa dosya yaratılmaz', () => {
  const oracleRoot = createOracleRoot();
  const pilotRoot = createPilotRoot();
  const missingRoot = join(tmpdir(), 'dc-pilot-a-missing-' + randomUUIDSafe());
  try {
    const noPermission = runTaskCli(pilotRoot, ['add', '--title', 'görev'], {});
    assert.equal(noPermission.status, 1);
    assert.equal(JSON.parse(noPermission.stdout).ok, false);
    assert.equal(existsSync(join(pilotRoot, 'tasks.json')), false);

    const noRoot = spawnSync(process.execPath, [join(pilotRoot, 'src', 'task-cli.mjs'), 'add', '--title', 'görev'], {
      cwd: pilotRoot,
      encoding: 'utf8',
      env: { ...process.env, PILOT_A_ROOT: missingRoot, PILOT_A_ORACLE_READY: '1', PILOT_A_LIVE_ALLOWED: '1' },
    });
    assert.equal(noRoot.status, 1);
    assert.equal(existsSync(join(missingRoot, 'tasks.json')), false);
  } finally {
    rmSync(oracleRoot, { recursive: true, force: true });
    rmSync(pilotRoot, { recursive: true, force: true });
  }
});

function randomUUIDSafe(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
