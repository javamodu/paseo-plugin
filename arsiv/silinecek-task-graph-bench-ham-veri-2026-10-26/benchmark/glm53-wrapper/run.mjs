import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const harnessRoot = dirname(fileURLToPath(import.meta.url));
const reportRoot = join(root, 'raporlar', 'glm53-wrapper-benchmark-2026-10-25');
const benchHome = join(root, '.bench-home');

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = argv.findIndex((argument) => argument === `--${name}` || argument.startsWith(`--${name}=`));
  if (index === -1) return fallback;
  const hit = argv[index];
  if (hit === `--${name}`) return argv[index + 1] ?? true;
  return hit.slice(hit.indexOf('=') + 1);
};

const live = Boolean(flag('live', false));
const timeoutMs = Math.max(1000, Number(flag('timeout-ms', 30000)));
const versionRuns = Math.max(1, Number(flag('version-runs', 3)));
const taskPrompt = 'Fix the failing test in `index.js`, run `node --test index.test.js`, and report the result.';

const wrappers = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    command: 'C:\\Users\\gatep\\.local\\bin\\claude.exe',
    liveArguments: (prompt) => ['-p', prompt, '--model', 'glm-5.3', '--output-format', 'stream-json', '--include-partial-messages', '--verbose', '--max-turns', '10', '--permission-mode', 'bypassPermissions', '--permission-prompts', 'none'],
    environment: () => ({}),
    inventory: collectClaudeInventory,
  },
  {
    id: 'codex',
    label: 'Codex',
    command: 'C:\\Users\\gatep\\AppData\\Local\\OpenAI\\Codex\\bin\\2993767bd1dfb009\\codex.exe',
    liveArguments: () => ['exec', '--skip-git-repo-check', '--model', 'glm-5.3', '--dangerously-bypass-approvals-and-sandbox', '--json', '-'],
    liveStdin: () => taskPrompt,
    environment: () => ({ CODEX_HOME: join(benchHome, '.codex') }),
    inventory: collectCodexInventory,
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    command: 'C:\\Users\\gatep\\AppData\\Roaming\\npm\\opencode.cmd',
    liveArguments: (prompt) => ['run', prompt, '--model', 'glmcodefast/glm-5.3', '--format', 'json', '--pure', '--auto'],
    environment: () => isolatedHomeEnvironment('opencode'),
    inventory: () => collectAgentInventory('opencode', 'build'),
  },
  {
    id: 'kilocode',
    label: 'Kilocode',
    command: 'C:\\Users\\gatep\\AppData\\Roaming\\npm\\kilo.cmd',
    liveArguments: (prompt) => ['run', prompt, '--model', 'glm53u/glm-5.3', '--format', 'json', '--pure', '--auto'],
    environment: () => isolatedHomeEnvironment('kilo'),
    inventory: () => collectAgentInventory('kilocode', 'code'),
  },
];

function isolatedHomeEnvironment(product) {
  return {
    HOME: benchHome,
    USERPROFILE: benchHome,
    XDG_CONFIG_HOME: join(benchHome, '.config'),
    XDG_DATA_HOME: join(benchHome, '.local', 'share'),
    XDG_STATE_HOME: join(benchHome, '.local', 'state'),
    XDG_CACHE_HOME: join(benchHome, '.cache'),
    APPDATA: join(benchHome, 'AppData', 'Roaming'),
  };
}

function commandEnvironment(wrapper) {
  return {
    ...process.env,
    NO_COLOR: '1',
    ...wrapper.environment(),
  };
}

function killProcessTree(child) {
  if (process.platform === 'win32' && child.pid) {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGKILL');
  }
  child.stdout?.destroy();
  child.stderr?.destroy();
  child.unref();
}

function runProcess(wrapper, arguments_, options = {}) {
  return new Promise((resolveRun) => {
    const startedAt = performance.now();
    const usesCmd = wrapper.command.toLowerCase().endsWith('.cmd');
    const child = usesCmd
      ? spawn('cmd.exe', ['/d', '/s', '/c', wrapper.command, ...arguments_], {
        cwd: options.cwd ?? root,
        env: commandEnvironment(wrapper),
        shell: false,
        windowsHide: true,
      })
      : spawn(wrapper.command, arguments_, {
      cwd: options.cwd ?? root,
      env: commandEnvironment(wrapper),
      shell: false,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        killProcessTree(child);
        settled = true;
        resolveRun({ timedOut: true, exitCode: child.exitCode, stdout, stderr, durationMs: performance.now() - startedAt });
      }
    }, options.timeoutMs ?? timeoutMs);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    if (options.stdin !== undefined) {
      child.stdin.write(options.stdin);
    }
    child.stdin.end();
    child.on('error', (error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolveRun({ error: String(error), exitCode: null, stdout, stderr, durationMs: performance.now() - startedAt });
      }
    });
    child.on('close', (exitCode) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolveRun({ exitCode, stdout, stderr, durationMs: performance.now() - startedAt });
      }
    });
    if (options.onStdoutLine) {
      child.stdout.on('data', (chunk) => {
        const text = stdout.slice(stdout.length - chunk.length);
        for (const line of text.split(/\r?\n/)) {
          if (line.trim()) options.onStdoutLine(line);
        }
      });
    }
  });
}

async function measureVersion(wrapper) {
  const runs = [];
  for (let index = 0; index < versionRuns; index += 1) {
    const result = await runProcess(wrapper, ['--version'], { timeoutMs: 15000 });
    runs.push(Math.round(result.durationMs));
  }
  const average = runs.reduce((total, value) => total + value, 0) / runs.length;
  return { runsMs: runs, averageMs: Math.round(average * 100) / 100 };
}

async function collectClaudeInventory() {
  return new Promise((resolveInventory) => {
    const wrapper = wrappers[0];
    const child = spawn(wrapper.command, ['-p', 'inventory', '--model', 'glm-5.3', '--output-format', 'stream-json', '--include-partial-messages', '--verbose', '--max-turns', '0'], {
      cwd: root,
      env: commandEnvironment(wrapper),
      windowsHide: true,
    });
    let buffer = '';
    let resolved = false;
    const finish = (value) => {
      if (!resolved) {
        resolved = true;
        killProcessTree(child);
        resolveInventory(value);
      }
    };
    const timer = setTimeout(() => finish({ error: 'timeout' }), 15000);
    child.stdout.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          if (event.type === 'system' && event.subtype === 'init') {
            clearTimeout(timer);
            finish({
              model: event.model,
              version: event.claude_code_version,
              tools: event.tools,
              toolCount: event.tools.length,
              permissionMode: event.permissionMode,
              mcpServerCount: event.mcp_servers.length,
              skillCount: event.skills.length,
              pluginCount: event.plugins.length,
            });
            return;
          }
        } catch {
        }
      }
    });
    child.on('error', () => { clearTimeout(timer); finish({ error: 'spawn failed' }); });
    child.on('close', () => { clearTimeout(timer); finish({ error: 'closed before inventory' }); });
  });
}

async function collectCodexInventory() {
  const wrapper = wrappers[1];
  const result = await runProcess(wrapper, ['debug', 'prompt-input', 'test'], { timeoutMs: 15000 });
  let promptInput = null;
  try {
    promptInput = JSON.parse(result.stdout);
  } catch {
  }
  const messages = Array.isArray(promptInput) ? promptInput : [];
  const textLength = messages.reduce((total, message) => total + String(message.content?.map((item) => item.text ?? '').join('') ?? '').length, 0);
  return {
    promptMessageCount: messages.length,
    promptTextLength: textLength,
    tools: null,
    toolCount: null,
    note: 'Codex does not expose a tool inventory through its offline debug surface.',
  };
}

async function collectAgentInventory(product, agentName) {
  const wrapper = wrappers.find((candidate) => candidate.id === product);
  const result = await runProcess(wrapper, ['debug', 'agent', agentName], { timeoutMs: 20000 });
  try {
    const agent = JSON.parse(result.stdout);
    const tools = Object.entries(agent.tools ?? {}).filter(([, enabled]) => enabled === true).map(([name]) => name);
    return {
      agentName: agent.name,
      mode: agent.mode,
      native: agent.native,
      tools,
      toolCount: tools.length,
      permissionCount: Array.isArray(agent.permission) ? agent.permission.length : 0,
    };
  } catch {
    return { error: 'agent debug output could not be parsed' };
  }
}

function prepareRunDirectory(wrapper) {
  const runDirectory = join(harnessRoot, 'runs', `${wrapper.id}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  mkdirSync(runDirectory, { recursive: true });
  copyFileSync(join(harnessRoot, 'task', 'index.js'), join(runDirectory, 'index.js'));
  copyFileSync(join(harnessRoot, 'task', 'index.test.js'), join(runDirectory, 'index.test.js'));
  return runDirectory;
}

async function runLiveTask(wrapper) {
  const runDirectory = prepareRunDirectory(wrapper);
  const result = await runProcess(wrapper, wrapper.liveArguments(taskPrompt), {
    cwd: runDirectory,
    timeoutMs,
    stdin: wrapper.liveStdin ? wrapper.liveStdin(taskPrompt) : '',
  });
  writeFileSync(join(runDirectory, 'events.jsonl'), result.stdout);
  writeFileSync(join(runDirectory, 'stderr.txt'), result.stderr);
  const outputLines = result.stdout.split(/\r?\n/).filter(Boolean);
  return {
    runDirectory,
    exitCode: result.exitCode,
    timedOut: Boolean(result.timedOut),
    durationMs: Math.round(result.durationMs),
    stdoutChars: result.stdout.length,
    stderrChars: result.stderr.length,
    outputLineCount: outputLines.length,
    stdoutPreview: result.stdout.slice(0, 2000),
    stderrPreview: result.stderr.slice(0, 2000),
  };
}

async function main() {
  mkdirSync(reportRoot, { recursive: true });
  const results = [];
  for (const wrapper of wrappers) {
    const versionResult = await runProcess(wrapper, ['--version'], { timeoutMs: 15000 });
    const version = versionResult.stdout.trim();
    const startup = await measureVersion(wrapper);
    const inventory = await wrapper.inventory();
    const liveResult = live ? await runLiveTask(wrapper) : null;
    results.push({
      id: wrapper.id,
      label: wrapper.label,
      version,
      model: 'glm-5.3',
      startup,
      inventory,
      live: liveResult,
    });
  }
  const report = {
    schema: 'glm53-wrapper-benchmark/v1',
    generatedAt: new Date().toISOString(),
    mode: live ? 'live' : 'offline',
    taskPrompt,
    networkStatus: live ? 'available' : 'not attempted',
    wrappers: results,
  };
  writeFileSync(join(reportRoot, 'wrapper-benchmark.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(reportRoot, 'OZET.md'), renderSummary(report));
  console.log(JSON.stringify(report, null, 2));
}

function renderSummary(report) {
  const lines = [
    '# GLM 5.3 Sarmalayıcı Benchmark',
    '',
    `Üretim zamanı: ${report.generatedAt}`,
    `Mod: ${report.mode === 'live' ? 'canlı' : 'offline'}`,
    `Ağ durumu: ${report.networkStatus}`,
    '',
    '## Sarmalayıcılar',
    '',
    '| Sarmalayıcı | Sürüm | Başlangıç ms | Araç sayısı | İzin kuralı | Canlı sonuç |',
    '|---|---:|---:|---:|---:|---|',
  ];
  for (const wrapper of report.wrappers) {
    const toolCount = wrapper.inventory.toolCount ?? '—';
    const permissionCount = wrapper.inventory.permissionCount ?? '—';
    const liveResult = wrapper.live ? (wrapper.live.timedOut ? 'zaman aşımı' : `exit ${wrapper.live.exitCode}`) : 'ölçülmedi';
    lines.push(`| ${wrapper.label} | ${wrapper.version} | ${wrapper.startup.averageMs} | ${toolCount} | ${permissionCount} | ${liveResult} |`);
  }
  lines.push('', '## Not', '', `- ${report.mode === 'live' ? 'Canlı model çağrısı tamamlandı; sonuçlar sarmalayıcı davranışını yansıtır.' : 'Canlı model çağrısı bu turda denenmedi; ölçüm offline sarmalayıcı yüzeyine odaklandı.'}`);
  return lines.join('\n');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
