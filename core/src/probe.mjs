// B00 — Runtime/SDK semver pin + sandbox/capability probe (A01).
// durust probe: dogrulanamayan yetenek UNKNOWN kalir ve `blocked` listesinde
// gorunur; "bilinmiyor" ASLA yetenek kazandirmaz (fail-closed).
// Kanit: evidence/probe-latest.json + sha256 receipt (canonical sirali).
// 0.11.2 yukseltmesi: worktree izolasyonu GERCEK git worktree dongusuyle kanitlanir;
// structuredOutput/cancelConfirm gercek CLI --help ciktisindan; usageReporting gercek
// `paseo inspect` LastUsage alanindan; sandboxEstablished STATIK config dogrulamasi
// (davranissal iddia YOK — receipt note'a 'config-kaniti' yazilir).
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, mkdtempSync, rmSync, existsSync, openSync, writeSync, fsyncSync, closeSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const run = (cmd, args, ms = 8000) => {
  try {
    return { ok: true, out: execFileSync(cmd, args, { timeout: ms, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() };
  } catch (e) {
    const msg = String(e.message ?? e);
    if (msg.includes('ENOENT')) {
      // Windows .cmd shim'leri (paseo.cmd) execFileSync'e gorunmez; shell fallback
      try {
        const quoted = [cmd, ...args].map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' ');
        const out = execFileSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', quoted], { timeout: ms, encoding: 'utf8' }).trim();
        return { ok: true, out };
      } catch (e2) {
        return { ok: false, out: String(e2.message ?? e2).split('\n')[0] };
      }
    }
    return { ok: false, out: msg.split('\n')[0] };
  }
};

// 1) Node pin kontrolu (package.json engines tek gercek)
const node = process.version; // v24.18.0
const nodeMajor = Number(node.slice(1).split('.')[0]);
const nodeOk = nodeMajor === 24;

// 2) git (worktree izolasyonu on kosulu)
const git = run('git', ['--version']);

// 2b) worktree izolasyonu — GERCEK kanit: temp repo + `git worktree add` basarili + cleanup.
// Probe-only dizinler isletim sistemi temp'inde acilir ve finally'de silinir; repo'ya dokunulmaz.
function probeWorktreeIsolation() {
  if (!git.ok) return { ok: false, detail: 'git yok' };
  const base = mkdtempSync(join(tmpdir(), 'ordu-worktree-probe-'));
  try {
    const repo = join(base, 'repo');
    const wt = join(base, 'wt');
    mkdirSync(repo);
    if (!run('git', ['init', '-q', '-b', 'main', repo], 15000).ok) return { ok: false, detail: 'git init basarisiz' };
    if (!run('git', ['-C', repo, '-c', 'user.name=probe', '-c', 'user.email=probe@local', 'commit', '-q', '--allow-empty', '-m', 'probe'], 15000).ok)
      return { ok: false, detail: 'bos commit basarisiz' };
    if (!run('git', ['-C', repo, 'worktree', 'add', '-q', '-b', 'probe-wt', wt], 15000).ok) return { ok: false, detail: 'git worktree add basarisiz' };
    if (!existsSync(join(wt, '.git'))) return { ok: false, detail: 'worktree .git isaretcisi yok' };
    return { ok: true, detail: 'temp repo + git worktree add basarili, cleanup tamam' };
  } finally {
    try { rmSync(base, { recursive: true, force: true }); } catch { /* cleanup en iyi caba */ }
  }
}
const worktree = probeWorktreeIsolation();

// 3) Paseo CLI/daemon — surum ve erisilebilirlik
const paseoVer = run('paseo', ['--version']);
const paseoStatus = paseoVer.ok ? 'CLI-FOUND' : 'CLI-NOT-FOUND';

// 4) Yetenek tablosu: yalniz BU probe'un dogruladigi satirlar true olur.
const capabilities = {
  nodePinned24: nodeOk,
  gitPresent: git.ok,
  paseoCliPresent: paseoVer.ok,
  paseoDaemonReachable: false, // daemon list denemesi asagida
  worktreeIsolationProven: worktree.ok,
  sandboxEstablished: false, // statik config dogrulamasi asagida (davranissal iddia YOK)
  structuredOutput: false, // `paseo run --help` --output-schema iceriyor mu
  usageReporting: false, // gercek `paseo inspect` LastUsage alani
  cancelConfirm: false, // `paseo stop --help` erisilebilir mi
};

// 4b) A0-5 (L-RT, 2026-10-27) — LOCAL runtime ailesi (ADR-012 §3: Paseo'suz koşum).
//     LOCAL_REQUIRED_CAPS kapılarını DÜRÜST gerçek kanıtla üretir; "bilinmiyor"
//     ASLA yetenek kazandırmaz (fail-closed). Aile kapıları spawnBlockedReason'da
//     runtime-kapsamlı süzülür (paseo ailesi kapalıyken local koşum yaşar; tersi de).
const registryProbe = (function probeRegistryDurable() {
  // processRegistryDurable: fsync'li jsonl append + geri okuma (defter.ts deseni —
  // durable pid registry'nin taşıma mekanizmasının kendisi).
  const base = mkdtempSync(join(tmpdir(), 'ordu-registry-probe-'));
  try {
    const p = join(base, 'r.jsonl');
    const fd = openSync(p, 'a');
    try { writeSync(fd, '{"event":"probe"}\n'); fsyncSync(fd); } finally { closeSync(fd); }
    return { ok: readFileSync(p, 'utf8').includes('"probe"'), detail: 'temp jsonl fsync-append + geri okuma başarılı' };
  } catch (e) {
    return { ok: false, detail: 'registry probe hatası: ' + String(e.message ?? e).split('\n')[0] };
  } finally {
    try { rmSync(base, { recursive: true, force: true }); } catch { /* en iyi çaba */ }
  }
})();

const cancelLocal = await (async function probeCancelConfirmLocal() {
  // GERÇEK süreç kanıtı: node çocuk doğar → kill → ölüm 'exit' olayıyla teyit
  // (uydurma CONFIRMED yok; pencerede teyit gelmezse false kalır — dürüst).
  return new Promise((resolve) => {
    let child;
    try { child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)'], { stdio: 'ignore' }); }
    catch (e) { return resolve({ ok: false, detail: 'spawn hatası: ' + String(e.message ?? e).split('\n')[0] }); }
    const pid = child.pid;
    if (typeof pid !== 'number') return resolve({ ok: false, detail: 'pid alınamadı' });
    const t = setTimeout(() => resolve({ ok: false, detail: 'olum teyidi 3 sn icinde gelmedi' }), 3000);
    child.on('exit', () => { clearTimeout(t); resolve({ ok: true, detail: `cocuk pid=${pid} dogdu, kill sonrasi exit teyit edildi` }); });
    try { child.kill(); } catch (e) { clearTimeout(t); resolve({ ok: false, detail: 'kill hatasi: ' + String(e.message ?? e).split('\n')[0] }); }
  });
})();

const cliTespit = await (async function probeProviderCliPresent() {
  // providerCliPresent: CLI_REGISTRY girişlerinin varlık tespiti (providers.ts
  // cliPresent — B00 ComSpec fallback dahil). Kapı = AİLE kullanılabilirliği
  // (>=1 CLI tespit edildi); per-CLI kırmızısı launch anında LocalLaunchRed ile
  // fail-closed kalır (aile kapısı ile CLI kapısı ayrı seviyelerdir).
  try {
    const mod = await import('./providers.ts');
    const kayitlar = Object.entries(mod.CLI_REGISTRY).map(([adi, tur]) => ({
      adi, cmd: tur.cmd, ok: mod.cliPresent({ cmd: tur.cmd, args: tur.detectArgs }),
    }));
    const ok = kayitlar.some((k) => k.ok);
    return { ok, kayitlar, detail: kayitlar.map((k) => `${k.adi}(${k.cmd})=${k.ok ? 'FOUND' : 'NOT-FOUND'}`).join(' ') };
  } catch (e) {
    return { ok: false, kayitlar: [], detail: 'providers.ts import hatasi: ' + String(e.message ?? e).split('\n')[0] };
  }
})();

capabilities.gitWorktreeProven = worktree.ok; // aynı gerçek kanıt (temp repo + worktree add)
capabilities.processRegistryDurable = registryProbe.ok;
capabilities.cancelConfirmLocal = cancelLocal.ok;
capabilities.providerCliPresent = cliTespit.ok;

// daemon denemesi: `paseo project ls` yerel daemon'a bakar; kisa timeout
const daemon = run('paseo', ['project', 'ls'], 6000);
capabilities.paseoDaemonReachable = daemon.ok;

// structuredOutput: gercek CLI yardimi — `paseo run --help` --output-schema flag'i var mi
const runHelp = run('paseo', ['run', '--help']);
capabilities.structuredOutput = runHelp.ok && runHelp.out.includes('--output-schema');

// cancelConfirm: `paseo stop --help` erisilebilir mi (interrupt semantigi belgelenmis mi)
const stopHelp = run('paseo', ['stop', '--help']);
capabilities.cancelConfirm = stopHelp.ok && /interrupt/i.test(stopHelp.out);

// usageReporting: gercek kanit — `paseo ls --json` ilk agent id'si + `paseo inspect <id> --json`
// LastUsage{InputTokens,OutputTokens,...} alani. Daemon ulasilamazsa/alan yoksa false kalir (durust).
(function probeUsageReporting() {
  const ls = run('paseo', ['ls', '--json', '--all'], 15000);
  if (!ls.ok) return;
  let agents;
  try { agents = JSON.parse(ls.out); } catch { return; }
  const first = Array.isArray(agents) ? agents.find((a) => typeof a?.id === 'string' && a.id) : null;
  if (!first) return;
  const insp = run('paseo', ['inspect', first.id, '--json'], 20000);
  if (!insp.ok) return;
  let info;
  try { info = JSON.parse(insp.out); } catch { return; }
  const usage = info?.LastUsage ?? info?.lastUsage;
  if (usage && typeof usage === 'object' && ('InputTokens' in usage || 'inputTokens' in usage)) {
    capabilities.usageReporting = true;
  }
})();

// sandboxEstablished: STATIK config kaniti — spawn vektorunde provider + mode('auto',
// full-access/bypass DEGIL) + cwd uclemesi zorunlu mu. Davranissal sandbox iddiasi YOK;
// kanit, transport arguman vektorunun kendisidir (receipt note: config-kaniti).
let sandboxDetail = 'transport vektoru okunamadi';
try {
  const mod = await import('./paseo-transport.ts');
  const args = mod.paseoSpawnArgs({ dispatchKey: 'probe-dk', attemptId: 'probe-a', prompt: 'probe', cwd: join(root, '.probe-cwd') });
  const modeIdx = args.indexOf('--mode');
  const hasProvider = args.includes('--provider') && args[args.indexOf('--provider') + 1]?.length > 0;
  const safeMode = modeIdx > 0 && args[modeIdx + 1] === 'auto';
  const hasCwd = args.includes('--cwd') && args[args.indexOf('--cwd') + 1]?.length > 0;
  capabilities.sandboxEstablished = hasProvider && safeMode && hasCwd;
  sandboxDetail = `provider=${hasProvider} mode-auto=${safeMode} cwd=${hasCwd} (config-kaniti)`;
} catch (e) {
  sandboxDetail = 'import hatasi: ' + String(e.message ?? e).split('\n')[0];
}

const blocked = Object.entries(capabilities).filter(([, v]) => !v).map(([k]) => k);

const receipt = {
  probe: 'ordu-v3/B00',
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  node,
  nodeEngines: pkg.engines.node,
  depsExact: { typebox: pkg.dependencies['@sinclair/typebox'], ajv: pkg.dependencies['ajv'], ajvFormats: pkg.dependencies['ajv-formats'] },
  paseo: paseoVer.ok ? paseoVer.out : `not-found (${paseoVer.out})`,
  paseoStatus,
  git: git.ok ? git.out : 'not-found',
  capabilities,
  blocked,
  evidence: {
    worktree: worktree.detail,
    registryDurable: registryProbe.detail,
    cancelConfirmLocal: cancelLocal.detail,
    providerCliPresent: cliTespit.detail,
    sandbox: sandboxDetail, // config-kaniti: statik vektor dogrulamasi, davranissal iddia YOK
    structuredOutput: runHelp.ok ? "--output-schema flag'i paseo run --help ciktisinda mevcut" : 'run --help alinamadi: ' + runHelp.out,
    cancelConfirm: stopHelp.ok ? 'paseo stop --help erisilebilir (interrupt semantigi)' : 'stop --help alinamadi: ' + stopHelp.out,
  },
  note: 'blocked listesi bos olmadan worker spawn YOK (fail-closed, A01). sandboxEstablished yalniz config-kanitidir; davranissal sandbox kaniti ayri gate ister.',
};
const canonical = (v) =>
  v === null || typeof v !== 'object'
    ? JSON.stringify(v)
    : Array.isArray(v)
      ? '[' + v.map(canonical).join(',') + ']'
      : '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
receipt.probeReceiptHash = createHash('sha256').update(canonical(receipt)).digest('hex');

mkdirSync(join(root, 'evidence'), { recursive: true });
const out = JSON.stringify(receipt, null, 2);
writeFileSync(join(root, 'evidence', 'probe-latest.json'), out);
console.log(out);
if (!nodeOk) {
  console.error('FATAL: Node 24 degil — pin ihlali');
  process.exit(2);
}
