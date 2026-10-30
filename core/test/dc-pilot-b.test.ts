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
  "import { spawnSync } from 'node:child_process';",
  "import { join } from 'node:path';",
  "const root = process.env.PILOT_B_ROOT;",
  "const cli = join(root, 'src/task-cli.mjs');",
  "const run = (args) => spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });",
  "test('pilot A acceptance', () => {",
  "  const add = run(['add', '--title', 'A görevi']);",
  "  assert.equal(add.status, 0);",
  "  assert.equal(JSON.parse(add.stdout).ok, true);",
  "  const list = run(['list']);",
  "  assert.equal(list.status, 0);",
  "  const payload = JSON.parse(list.stdout);",
  "  assert.equal(payload.ok, true);",
  "  assert.equal(payload.tasks.length, 1);",
  "});",
].join('\n');

const oracleBSource = [
  "import { test } from 'node:test';",
  "import assert from 'node:assert/strict';",
  "import { spawnSync } from 'node:child_process';",
  "import { join } from 'node:path';",
  "const root = process.env.PILOT_B_ROOT;",
  "const cli = join(root, 'src/task-cli.mjs');",
  "const run = (args) => spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });",
  "test('pilot B acceptance', () => {",
  "  const add = run(['add', '--title', 'B görevi']);",
  "  assert.equal(add.status, 0);",
  "  const first = JSON.parse(run(['list']).stdout).tasks[0];",
  "  const complete = run(['complete', '--id', first.id]);",
  "  assert.equal(complete.status, 0);",
  "  const todo = JSON.parse(run(['list', '--status', 'todo']).stdout);",
  "  assert.equal(todo.tasks.length, 1);",
  "  const done = JSON.parse(run(['list', '--status', 'done']).stdout);",
  "  assert.equal(done.tasks.length, 1);",
  "  const stats = JSON.parse(run(['stats']).stdout);",
  "  assert.equal(stats.total, 2);",
  "  assert.equal(stats.done, 1);",
  "  assert.equal(stats.todo, 1);",
  "});",
].join('\n');

const packageJson = JSON.stringify({ type: 'module', private: true, version: '0.2.0' }, null, 2) + '\n';

const taskCliSource = [
  "import { existsSync, readFileSync, writeFileSync } from 'node:fs';",
  "import { join, resolve } from 'node:path';",
  "import { randomUUID } from 'node:crypto';",
  "",
  "const root = resolve(process.env.PILOT_B_ROOT ?? process.cwd());",
  "const tasksPath = join(root, 'tasks.json');",
  "const args = process.argv.slice(2);",
  "const command = args[0];",
  "",
  "const fail = (message) => {",
  "  console.log(JSON.stringify({ ok: false, error: message }));",
  "  process.exitCode = 1;",
  "};",
  "",
  "if (process.env.PILOT_B_ORACLE_READY !== '1' || process.env.PILOT_B_LIVE_ALLOWED !== '1' || process.env.PILOT_B_A_ACCEPTED !== '1' || process.env.PILOT_B_ORACLE_VERSION !== 'v1') {",
  "  fail('A delivery record or oracle version missing');",
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
  "  const task = { id: randomUUID(), title, createdAt: new Date().toISOString(), completedAt: null };",
  "  tasks.push(task);",
  "  writeFileSync(tasksPath, JSON.stringify(tasks, null, 2), 'utf8');",
  "  console.log(JSON.stringify({ ok: true, ...task }));",
  "} else if (command === 'complete') {",
  "  const idIndex = args.indexOf('--id');",
  "  const id = idIndex >= 0 ? args[idIndex + 1] : undefined;",
  "  const tasks = readTasks();",
  "  const task = tasks.find((item) => item.id === id);",
  "  if (!task) {",
  "    fail('task not found');",
  "    process.exit(1);",
  "  }",
  "  if (task.completedAt === null) {",
  "    task.completedAt = new Date().toISOString();",
  "    writeFileSync(tasksPath, JSON.stringify(tasks, null, 2), 'utf8');",
  "  }",
  "  console.log(JSON.stringify({ ok: true, ...task }));",
  "} else if (command === 'list') {",
  "  const statusIndex = args.indexOf('--status');",
  "  const status = statusIndex >= 0 ? args[statusIndex + 1] : 'all';",
  "  const tasks = readTasks().filter((task) => status === 'all' || (status === 'done') === (task.completedAt !== null));",
  "  console.log(JSON.stringify({ ok: true, tasks }, null, 2));",
  "} else if (command === 'stats') {",
  "  const tasks = readTasks();",
  "  const done = tasks.filter((task) => task.completedAt !== null).length;",
  "  console.log(JSON.stringify({ ok: true, total: tasks.length, done, todo: tasks.length - done }));",
  "} else {",
  "  fail('unknown command');",
  "  process.exit(1);",
  "}",
].join('\n');

function createOracleRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'dc-pilot-b-oracle-'));
  writeFileSync(join(root, 'acceptance-a.test.mjs'), oracleASource, 'utf8');
  writeFileSync(join(root, 'acceptance-b.test.mjs'), oracleBSource, 'utf8');
  return root;
}

function createPilotRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'dc-pilot-b-'));
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'package.json'), packageJson, 'utf8');
  writeFileSync(join(root, 'src', 'task-cli.mjs'), taskCliSource, 'utf8');
  return root;
}

function runTaskCli(root: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, [join(root, 'src', 'task-cli.mjs'), ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PILOT_B_ROOT: root, ...env },
  });
}

test('P1: insan görevi tamamlar, filtreler ve toplamları görür', () => {
  const oracleRoot = createOracleRoot();
  const pilotRoot = createPilotRoot();
  const oracleAPath = join(oracleRoot, 'acceptance-a.test.mjs');
  const oracleBPath = join(oracleRoot, 'acceptance-b.test.mjs');
  const oracleAHash = sha256(readFileSync(oracleAPath));
  const oracleBHash = sha256(readFileSync(oracleBPath));
  try {
    const oracleA = spawnSync(process.execPath, [oracleAPath], {
      cwd: oracleRoot,
      encoding: 'utf8',
      env: { ...process.env, PILOT_B_ROOT: pilotRoot, PILOT_B_ORACLE_READY: '1', PILOT_B_LIVE_ALLOWED: '1', PILOT_B_A_ACCEPTED: '1', PILOT_B_ORACLE_VERSION: 'v1' },
    });
    assert.equal(oracleA.status, 0);
    const oracleB = spawnSync(process.execPath, [oracleBPath], {
      cwd: oracleRoot,
      encoding: 'utf8',
      env: { ...process.env, PILOT_B_ROOT: pilotRoot, PILOT_B_ORACLE_READY: '1', PILOT_B_LIVE_ALLOWED: '1', PILOT_B_A_ACCEPTED: '1', PILOT_B_ORACLE_VERSION: 'v1' },
    });
    assert.equal(oracleB.status, 0);
    assert.equal(sha256(readFileSync(oracleAPath)), oracleAHash);
    assert.equal(sha256(readFileSync(oracleBPath)), oracleBHash);
    console.log('PILOT_B_EVIDENCE ' + JSON.stringify({
      pilotRoot,
      oracleRoot,
      oracleAHash,
      oracleBHash,
      pilotPackageHash: sha256(readFileSync(join(pilotRoot, 'package.json'))),
      pilotCliHash: sha256(readFileSync(join(pilotRoot, 'src', 'task-cli.mjs'))),
      tasksHash: sha256(readFileSync(join(pilotRoot, 'tasks.json'))),
    }));
  } finally {
    rmSync(oracleRoot, { recursive: true, force: true });
    rmSync(pilotRoot, { recursive: true, force: true });
  }
});

test('N1: yinelenen tamamlama sayıları bozmaz', () => {
  const oracleRoot = createOracleRoot();
  const pilotRoot = createPilotRoot();
  try {
    const add = runTaskCli(pilotRoot, ['add', '--title', 'görev'], { PILOT_B_ORACLE_READY: '1', PILOT_B_LIVE_ALLOWED: '1', PILOT_B_A_ACCEPTED: '1', PILOT_B_ORACLE_VERSION: 'v1' });
    assert.equal(add.status, 0);
    const id = JSON.parse(add.stdout).id;
    const first = runTaskCli(pilotRoot, ['complete', '--id', id], { PILOT_B_ORACLE_READY: '1', PILOT_B_LIVE_ALLOWED: '1', PILOT_B_A_ACCEPTED: '1', PILOT_B_ORACLE_VERSION: 'v1' });
    assert.equal(first.status, 0);
    const duplicate = runTaskCli(pilotRoot, ['complete', '--id', id], { PILOT_B_ORACLE_READY: '1', PILOT_B_LIVE_ALLOWED: '1', PILOT_B_A_ACCEPTED: '1', PILOT_B_ORACLE_VERSION: 'v1' });
    assert.equal(duplicate.status, 0);
    const stats = JSON.parse(runTaskCli(pilotRoot, ['stats'], { PILOT_B_ORACLE_READY: '1', PILOT_B_LIVE_ALLOWED: '1', PILOT_B_A_ACCEPTED: '1', PILOT_B_ORACLE_VERSION: 'v1' }).stdout);
    assert.equal(stats.total, 1);
    assert.equal(stats.done, 1);
    assert.equal(stats.todo, 0);
  } finally {
    rmSync(oracleRoot, { recursive: true, force: true });
    rmSync(pilotRoot, { recursive: true, force: true });
  }
});

test('N2: A teslim kaydı ve aynı oracle sürümü olmadan B kapanışı yok', () => {
  const oracleRoot = createOracleRoot();
  const pilotRoot = createPilotRoot();
  try {
    const add = runTaskCli(pilotRoot, ['add', '--title', 'görev'], { PILOT_B_ORACLE_READY: '1', PILOT_B_LIVE_ALLOWED: '1', PILOT_B_A_ACCEPTED: '1', PILOT_B_ORACLE_VERSION: 'v1' });
    assert.equal(add.status, 0);
    const tasksPath = join(pilotRoot, 'tasks.json');
    const before = sha256(readFileSync(tasksPath));
    const id = JSON.parse(add.stdout).id;
    const noA = runTaskCli(pilotRoot, ['complete', '--id', id], { PILOT_B_ORACLE_READY: '1', PILOT_B_LIVE_ALLOWED: '1', PILOT_B_ORACLE_VERSION: 'v1' });
    assert.equal(noA.status, 1);
    assert.equal(JSON.parse(noA.stdout).ok, false);
    assert.equal(sha256(readFileSync(tasksPath)), before);
  } finally {
    rmSync(oracleRoot, { recursive: true, force: true });
    rmSync(pilotRoot, { recursive: true, force: true });
  }
});

test('N2: yanlış oracle sürümü B kapanışını RED eder', () => {
  const oracleRoot = createOracleRoot();
  const pilotRoot = createPilotRoot();
  try {
    const add = runTaskCli(pilotRoot, ['add', '--title', 'görev'], { PILOT_B_ORACLE_READY: '1', PILOT_B_LIVE_ALLOWED: '1', PILOT_B_A_ACCEPTED: '1', PILOT_B_ORACLE_VERSION: 'v1' });
    assert.equal(add.status, 0);
    const tasksPath = join(pilotRoot, 'tasks.json');
    const before = sha256(readFileSync(tasksPath));
    const id = JSON.parse(add.stdout).id;
    const wrongVersion = runTaskCli(pilotRoot, ['complete', '--id', id], { PILOT_B_ORACLE_READY: '1', PILOT_B_LIVE_ALLOWED: '1', PILOT_B_A_ACCEPTED: '1', PILOT_B_ORACLE_VERSION: 'v2' });
    assert.equal(wrongVersion.status, 1);
    assert.equal(JSON.parse(wrongVersion.stdout).ok, false);
    assert.equal(sha256(readFileSync(tasksPath)), before);
  } finally {
    rmSync(oracleRoot, { recursive: true, force: true });
    rmSync(pilotRoot, { recursive: true, force: true });
  }
});
