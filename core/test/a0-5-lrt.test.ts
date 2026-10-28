// A0-5 (L-RT) — üretim LocalCliLauncher + provider→CLI eşleme hermetik kanıtı.
// GERÇEK CLI ÇAĞRISI YOK: sahte CLI = node script'i (sahte-cli.mjs); gerçek spawn
// (child_process.spawn) gerçek süreç doğurur — pid/durum/çıktı zinciri GERÇEK,
// LLM/harcama YOK. Gerçek claude/gemini CLI ölçümü entegrasyon sonrası operatörde.
// RED yolları: registry-dışı CLI RED, providerCliPresent kırmızısı spawn RED,
// provider eksik RED, path-escape RED (M26). METRIK satırı: Paseo'suz koşum
// duvar-süresi (sahte CLI ile ölçülen ms).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, appendFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  LocalRuntimeAdapter, LocalCliLauncher, LocalLaunchRed, LOCAL_REQUIRED_CAPS,
} from '../src/local-runtime.ts';
import {
  CLI_REGISTRY, PROVIDER_CLI_MAP, PROVIDER_REGISTRY, cliOfProvider, cliPresent,
  assertProviderModel, resolveProviderModel, providerArgOf,
} from '../src/providers.ts';
import type { LocalLauncher } from '../src/local-runtime.ts';
import type { ProbeReceipt } from '../src/capabilities.ts'; // tip-borcu v9-06: ProbeReceipt capabilities'te tanimli (local-runtime yeniden ihraç etmiyor)

const dir = () => mkdtempSync(join(tmpdir(), 'ordu-a05-lrt-'));
const uyu = (ms: number) => new Promise((r) => setTimeout(r, ms));
const temiz = (d: string) => { try { rmSync(d, { recursive: true, force: true }); } catch { /* en iyi caba (probe.mjs deseni) */ } };

// ---- sahte CLI (node script): --version yanıtlar; argv/cwd JSON basar; FAKE_HOLD_MS sonra biter
// Modül yükleme anında yazılır (test sırasından bağımsız) — kendi temp evinde yaşar,
// process exit'te en iyi çabayla temizlenir.
const SAIKCLI = join(dir(), 'sahte-cli.mjs');
const SAIKCLI_ICERIK = [
  "const args = process.argv.slice(2);",
  "if (args.includes('--version')) { console.log('sahte-cli 0.0.1'); process.exit(0); }",
  "console.log(JSON.stringify({ argv: args, cwd: process.cwd(), pid: process.pid }));",
  "const hold = Number(process.env.FAKE_HOLD_MS ?? '1200');",
  "setTimeout(() => { console.log('CIKTI-TAMAM'); setTimeout(() => process.exit(0), 30); }, hold);",
].join('\n');
writeFileSync(SAIKCLI, SAIKCLI_ICERIK, 'utf8');
process.on('exit', () => { temiz(join(SAIKCLI, '..')); });

// ---- probe receipt (adapter kapısı; f3-crash deseni — hash doğrulaması adapter katmanında değil)
function probeYap(eksik: string[] = []): ProbeReceipt {
  const caps: Record<string, boolean> = {};
  for (const c of LOCAL_REQUIRED_CAPS) caps[c] = true;
  for (const c of eksik) caps[c] = false;
  const blocked = Object.entries(caps).filter(([, v]) => !v).map(([k]) => k);
  return {
    probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: new Date().toISOString(),
    node: process.version, capabilities: caps, blocked, probeReceiptHash: '0'.repeat(64),
  } as ProbeReceipt;
}

// ---- temp git deposu (probe.mjs worktree provası deseni: init + boş commit)
function repoYap(d: string): string {
  const repo = join(d, 'repo');
  mkdirSync(repo, { recursive: true });
  execFileSync('git', ['init', '-q', '-b', 'main', repo], { timeout: 20000 });
  execFileSync('git', ['-C', repo, '-c', 'user.name=a05', '-c', 'user.email=a05@local', 'commit', '-q', '--allow-empty', '-m', 'a05'], { timeout: 20000 });
  return repo;
}

function launcherYap(d: string, ek: Partial<ConstructorParameters<typeof LocalCliLauncher>[0]> = {}) {
  const repo = repoYap(d);
  const opts = {
    repoPath: repo,
    worktreeRoot: join(d, 'wt'),
    registryPath: join(d, 'pid-registry.jsonl'),
    cliBindings: { 'claude-code': { cmd: process.execPath, argvPrefix: [SAIKCLI] } },
    ...ek,
  } as ConstructorParameters<typeof LocalCliLauncher>[0];
  return { launcher: new LocalCliLauncher(opts), opts };
}

// =====================================================================
// 1) CLI registry: ajan kadrosu CLI türleri açıkça listelenir; registry-dışı RED
// =====================================================================
test('A0-5 CLI registry: ajan kadrosu CLI turuleri acikca listelenir; registry-disi CLI/provider RED (K-0033)', () => {
  assert.deepEqual(Object.keys(CLI_REGISTRY), ['claude-code', 'gemini-cli'], 'graf notu: CLI turleri acikca listelenir');
  assert.equal(CLI_REGISTRY['claude-code'].cmd, 'claude');
  assert.deepEqual(CLI_REGISTRY['claude-code'].detectArgs, ['--version']);
  assert.equal(CLI_REGISTRY['gemini-cli'].cmd, 'gemini');
  // provider->CLI eslemesi (bilincli tablo): codex motoru yerel codex CLI'sine eslenir
  assert.equal(PROVIDER_CLI_MAP['codex'], 'codex');
  assert.equal(PROVIDER_CLI_MAP['claude-code'], 'claude-code');
  // codex -> 'codex' CLI -> registry DISI: fail-closed RED kalir (K-0033; sonraki +40/CLI dalga)
  assert.throws(() => cliOfProvider('codex'), /registry-disi CLI turu: codex/);
  assert.throws(() => cliOfProvider('yok-provider'), /provider->CLI eslemesi yok: yok-provider/);
  assert.deepEqual(Object.keys(cliOfProvider('claude-code')), ['adi', 'tur']);
  assert.equal(cliOfProvider('gemini-cli').adi, 'gemini-cli');
});

// =====================================================================
// 2) providers registry: bilinçli girişler; model kümeleri dürüst
// =====================================================================
test('A0-5 providers registry: claude-code/gemini-cli girisleri bilincli; olculmemis model YAZILMAZ', () => {
  // (R, 2026-10-27 canlı koşum x2 + tanı) headless sdk yolu: glm-5.3 → proxy 400
  // (etkileşimli çalışır, sdk sorgu kaynağına kapalı); codefastglm53unlimited →
  // ÇALIŞIR (tanı koşumu TAMAM, exit 0). Kırık-ölçülmüş model kayda YAZILMAZ.
  assert.deepEqual(PROVIDER_REGISTRY['claude-code'], ['codefastglm53unlimited'], '(R) canli kosum: tek olculmus-CALISAN headless model');
  assert.deepEqual(PROVIDER_REGISTRY['gemini-cli'], [], 'olculmemis model id uydurma YOK — model NULL = CLI varsayilani');
  assert.throws(() => assertProviderModel('claude-code', 'glm-5.3'), /registry-disi model/, 'kirik yolu olculmus model artik kayitta DEGIL (sdk 400)');
  assert.doesNotThrow(() => assertProviderModel('claude-code', 'codefastglm53unlimited'));
  assert.doesNotThrow(() => assertProviderModel('claude-code', null), 'sozlesme: model NULL serbest (CLI varsayilani) — uretim olcumu: varsayilan KIRIK, olculmus model kullan');
  assert.doesNotThrow(() => assertProviderModel('gemini-cli', null));
  assert.throws(() => assertProviderModel('gemini-cli', 'uyduruk-model'), /registry-disi model/);
  assert.throws(() => assertProviderModel('claude-code', 'gemini-9'), /registry-disi model/);
  assert.equal(providerArgOf({ provider: 'claude-code', model: 'glm-5.3' }), 'claude-code/glm-5.3');
  // cozum zinciri: ORDU_PROVIDER='claude-code' (bölüsüz) -> model NULL kabul
  const r = resolveProviderModel({ provider: 'gemini-cli', model: null }, {});
  assert.ok(r.ok && r.provider === 'gemini-cli' && r.model === null);
  assert.equal((resolveProviderModel({}, { ORDU_PROVIDER: 'claude-code' } as any) as any).model, null);
  // arg uretimi: model NULL -> yalniz prompt; model dolu -> --model tasiyinir
  assert.deepEqual(CLI_REGISTRY['claude-code'].buildArgs({ prompt: 'p1', model: null }), ['-p', 'p1']);
  assert.deepEqual(CLI_REGISTRY['claude-code'].buildArgs({ prompt: 'p1', model: 'glm-5.3' }), ['-p', 'p1', '--model', 'glm-5.3']);
});

// =====================================================================
// 3) cliPresent: komut tespiti + ENOENT→ComSpec fallback (B00 deseni)
// =====================================================================
test('A0-5 cliPresent: komut tespiti ENOENTta ComSpec fallback (B00 deseni); baska hata = false, kirmizi kazandirmaz', () => {
  // (a) direkt basari: tek cagri
  const c1: [string, string[]][] = [];
  assert.equal(cliPresent({ cmd: 'sahte', args: ['--version'] }, { exec: (c, a) => { c1.push([c, [...a]]); return 'v'; } }), true);
  assert.equal(c1.length, 1);
  // (b) ENOENT -> ComSpec fallback basari
  const c2: [string, string[]][] = [];
  let i = 0;
  const exec2 = (c: string, a: string[]) => {
    c2.push([c, [...a]]);
    if (i++ === 0) throw new Error('spawnSync sahte.cmd ENOENT');
    return 'v1';
  };
  assert.equal(cliPresent({ cmd: 'sahte.cmd', args: ['--version'] }, { exec: exec2 }), true);
  assert.equal(c2.length, 2, 'fallback denendi');
  assert.equal(c2[0][0], 'sahte.cmd');
  assert.equal(c2[1][0], process.env.ComSpec ?? 'cmd.exe');
  assert.deepEqual(c2[1][1], ['/d', '/s', '/c', 'sahte.cmd --version'], 'probe.mjs alintilama bicimi');
  // (c) ENOENT degil (ornek timeout/exit!=0) -> fallback YOK, false
  const c3: [string, string[]][] = [];
  assert.equal(cliPresent({ cmd: 'sahte', args: ['--version'] }, { exec: (c, a) => { c3.push([c, [...a]]); throw new Error('basarisiz cikis kodu 1'); } }), false);
  assert.equal(c3.length, 1, 'ENOENT disi hata fallback denemEZ');
  // (d) fallback de basarisizsa false ("bilinmiyor" yetenek KAZANDIRMAZ)
  const c4: [string, string[]][] = [];
  assert.equal(cliPresent({ cmd: 'yok', args: ['--version'] }, { exec: (c, a) => { c4.push([c, [...a]]); throw new Error('spawnSync yok ENOENT'); } }), false);
  assert.equal(c4.length, 2);
});

// =====================================================================
// 4) L-RT uç uca: gerçek CLI süreci + durable pid jsonl + worktree + çıktı + METRIK
// =====================================================================
test('A0-5 L-RT uc uca: ORDU_RUNTIME=local -> GERCEK CLI sureci + pid durable jsonl + worktree + cikti zinciri + METRIK', async () => {
  const d = dir();
  try {
    const { launcher } = launcherYap(d, { env: { FAKE_HOLD_MS: '400' } });
    const adapter = new LocalRuntimeAdapter(probeYap(), launcher, { ORDU_RUNTIME: 'local' });
    const PROMPT = 'görev brief — üretim koşum bacağı (Türkçe UTF-8)';
    const t0 = Date.now();
    const r = await adapter.spawn({ dispatchKey: 'dk-metrik', attemptId: 'att-metrik', prompt: PROMPT, provider: 'claude-code', model: 'glm-5.3' });
    assert.equal(r.outcome, 'OK', 'ORDU_RUNTIME=local + kapılar açık -> gerçek süreç doğdu');
    const pid = Number((r as any).externalSessionId.slice('local:'.length));
    assert.ok(pid > 0, 'externalSessionId gerçek pid taşır');

    // durable registry: DISKTEN oku (launch return ETMEDEN önce yazılmış olmalı)
    const kayitlar = readFileSync(join(d, 'pid-registry.jsonl'), 'utf8').trim().split('\n').map((s) => JSON.parse(s));
    assert.equal(kayitlar.length, 1, 'tek launch kaydı');
    const rec: any = kayitlar[0];
    assert.equal(rec.event, 'launch');
    assert.equal(rec.dispatchKey, 'dk-metrik');
    assert.equal(rec.attemptId, 'att-metrik');
    assert.equal(rec.pid, pid, 'pid durable registryde');
    assert.equal(rec.cli, 'claude-code');
    assert.equal(rec.provider, 'claude-code');
    assert.equal(rec.model, 'glm-5.3');
    assert.ok(existsSync(join(rec.worktreePath, '.git')), 'worktree gerçekten doğdu (.git işaretçisi)');
    assert.ok(existsSync(rec.outputPath), 'çıktı dosyası kayıtlı');

    // çıktı zinciri: sahte CLI argv/cwd JSON basar → METRIK için poll
    let cikti = '';
    const son = Date.now() + 20000;
    while (Date.now() < son) {
      cikti = launcher.outputOf('dk-metrik') ?? '';
      if (cikti.includes('CIKTI-TAMAM')) break;
      await uyu(40);
    }
    const ms = Date.now() - t0;
    assert.ok(cikti.includes('CIKTI-TAMAM'), 'çıktı göründü: ' + cikti.slice(0, 200));
    const payload = JSON.parse(cikti.split('\n')[0]);
    assert.ok(payload.argv.includes(PROMPT), 'prompt arg üretimiyle taşındı (UTF-8)');
    assert.ok(payload.argv.includes('--model') && payload.argv.includes('glm-5.3'), 'model arg üretimi');
    assert.equal(payload.cwd, rec.worktreePath, 'çocuk süreç cwd=worktree');
    assert.ok(Number.isFinite(ms) && ms > 0 && ms < 20000);
    console.log('METRIK: Paseo\'suz koşum duvar-süresi (sahte CLI, launch→çıktı-göründü) = ' + ms + ' ms — gerçek CLI ölçümü entegrasyon sonrası operatörde');

    // durum zinciri: süreç kendi biter -> lookup DEAD (uydurma yok, OS gözlemi)
    const son2 = Date.now() + 15000;
    while (Date.now() < son2) {
      if ((await adapter.lookup('dk-metrik')) === 'DEAD') break;
      await uyu(100);
    }
    assert.equal(await adapter.lookup('dk-metrik'), 'DEAD', 'çıkış sonrası gerçek DEAD');
  } finally {
    temiz(d);
  }
});

// =====================================================================
// 5) restart dayanıklılığı + son-satır onarımı (defter.ts deseni)
// =====================================================================
test('A0-5 restart dayanikliligi: yeni launcher ayni defteri okur; son-satir onarimi; uydurma pid YOK', async () => {
  const d = dir();
  try {
    const { launcher, opts } = launcherYap(d, { env: { FAKE_HOLD_MS: '60000' } });
    const adapter = new LocalRuntimeAdapter(probeYap(), launcher, { ORDU_RUNTIME: 'local' });
    const r = await adapter.spawn({ dispatchKey: 'dk-restart', attemptId: 'att-r', prompt: 'p', provider: 'claude-code', model: null });
    assert.equal(r.outcome, 'OK');
    const pid = Number((r as any).externalSessionId.slice('local:'.length));
    assert.equal(await adapter.lookup('dk-restart'), 'ALIVE', 'uzun ömürlü çocuk: gözlenen durum ALIVE');
    // RESTART simülasyonu: YENİ instance aynı registryPath'i görür
    const yeniden = new LocalCliLauncher(opts);
    assert.equal(yeniden.pidOf('dk-restart'), pid, 'durable: restart sonrası pid geri okunur');
    assert.equal(yeniden.pidOf('hiç-yok-dk'), undefined, 'registry\'de olmayan key uydurma pid ALMAZ');
    // crash sonrası yarım son satır (tail) onarılır: pid HÂLÂ okunur
    appendFileSync(opts.registryPath, '{"event":"launch","dispatchKey":"yari-yaz');
    const onarimSonrasi = new LocalCliLauncher(opts);
    assert.equal(onarimSonrasi.pidOf('dk-restart'), pid, 'son-satır onarımı (jsonlYukle) — veri kaybı yok');
    // cleanup: çocuk kapat + worktree kaldır (kayıt durable kalır)
    await launcher.kill(pid);
    launcher.removeWorktree('dk-restart');
  } finally {
    temiz(d);
  }
});

// =====================================================================
// 6) RED: registry-dışı CLI → LocalLaunchRed; adapter FATAL (UNKNOWN değil)
// =====================================================================
test('A0-5 RED: registry-disi CLI (provider codex -> CLI codex) -> LocalLaunchRed; adapter FATAL; worktree/registry DOGMAZ', async () => {
  const d = dir();
  try {
    const { launcher } = launcherYap(d);
    // dogrudan launcher: deterministik kirmizi (GateError -> LocalLaunchRed sarmali)
    await assert.rejects(
      () => launcher.launch({ dispatchKey: 'dk-red', attemptId: 'att-red', prompt: 'p', provider: 'codex', model: 'glm-5.3' }),
      (e: any) => e instanceof LocalLaunchRed && /registry-disi CLI turu: codex/.test(e.message),
    );
    // adapter uzerinden: spawn RED = FATAL (UNKNOWN degil — U3 terminal, kor retry yok)
    const adapter = new LocalRuntimeAdapter(probeYap(), launcher, { ORDU_RUNTIME: 'local' });
    const r = await adapter.spawn({ dispatchKey: 'dk-red', attemptId: 'att-red', prompt: 'p', provider: 'codex', model: 'glm-5.3' });
    assert.equal(r.outcome, 'FATAL');
    assert.match((r as any).reason, /local-launch-red: .*registry-disi CLI turu: codex/);
    // fail-closed yan etki: RED worktree ve registry DOGMADAN once patlar
    assert.equal(readdirSync(join(d, 'wt')).length, 0, 'worktree doğmadı');
    assert.ok(!existsSync(join(d, 'pid-registry.jsonl')), 'registry kaydı doğmadı');
  } finally {
    temiz(d);
  }
});

// =====================================================================
// 7) RED: providerCliPresent kırmızısı → spawn RED (3 katman)
// =====================================================================
test('A0-5 RED: providerCliPresent kirmizisi -> spawn RED (launcher + adapter FATAL + probe kapisi)', async () => {
  const d = dir();
  try {
    // (a) launcher katmani: binary YOK -> denetim kirmizi -> LocalLaunchRed (gercek ENOENT + ComSpec fallback yolu)
    const { launcher: l1 } = launcherYap(d, { cliBindings: { 'claude-code': { cmd: 'ordu-yok-binary-a05', argvPrefix: [] } } });
    await assert.rejects(
      () => l1.launch({ dispatchKey: 'dk-cli-yok', attemptId: 'att-y', prompt: 'p', provider: 'claude-code' }),
      (e: any) => e instanceof LocalLaunchRed && /providerCliPresent kirmizisi: ordu-yok-binary-a05/.test(e.message),
    );
    // (b) adapter katmani: ayni kirmizi FATAL (spawn RED)
    const a1 = new LocalRuntimeAdapter(probeYap(), l1, { ORDU_RUNTIME: 'local' });
    const r1 = await a1.spawn({ dispatchKey: 'dk-cli-yok', attemptId: 'att-y', prompt: 'p', provider: 'claude-code' });
    assert.equal(r1.outcome, 'FATAL');
    assert.match((r1 as any).reason, /providerCliPresent kirmizisi/);
    // (c) probe kapisI: receipt providerCliPresent=false -> adapter kapisinden FATAL, launcher'a DOKUNULMAZ
    let dokunuldu = false;
    const guard: LocalLauncher = {
      async launch() { dokunuldu = true; return { pid: 1 }; },
      pidOf() { dokunuldu = true; return undefined; },
      dispatchKeyOf() { dokunuldu = true; return undefined; }, // B8: arayüze göre zorunlu
      async isAlive() { dokunuldu = true; return true; },
      async kill() { dokunuldu = true; },
    };
    const a2 = new LocalRuntimeAdapter(probeYap(['providerCliPresent']), guard, { ORDU_RUNTIME: 'local' });
    const r2 = await a2.spawn({ dispatchKey: 'dk', attemptId: 'at', prompt: 'p', provider: 'claude-code' });
    assert.equal(r2.outcome, 'FATAL');
    assert.match((r2 as any).reason, /local-capability-blocked: providerCliPresent/);
    assert.equal(dokunuldu, false, 'kırmızı probe launcher\'a hiç ulaşmaz');
  } finally {
    temiz(d);
  }
});

// =====================================================================
// 8) RED: provider eksik + dispatchKey path-escape (M26)
// =====================================================================
test('A0-5 RED: provider eksik RED + dispatchKey path-escape RED (M26) — süreç doğmadan', async () => {
  const d = dir();
  try {
    const { launcher } = launcherYap(d);
    await assert.rejects(
      () => launcher.launch({ dispatchKey: 'dk-p', attemptId: 'a', prompt: 'p' }),
      (e: any) => e instanceof LocalLaunchRed && /provider gerekli/.test(e.message),
    );
    await assert.rejects(
      () => launcher.launch({ dispatchKey: '../kacis', attemptId: 'a', prompt: 'p', provider: 'claude-code' }),
      (e: any) => e instanceof LocalLaunchRed && /path-escape/.test(e.message),
    );
    assert.equal(readdirSync(join(d, 'wt')).length, 0, 'RED süreçleri worktree bırakmaz');
  } finally {
    temiz(d);
  }
});

// =====================================================================
// 9) adapter cancel: uzun-ömürlü sahte CLI → kill + CONFIRMED_DEAD
// =====================================================================
test('A0-5 adapter cancel: uzun-omurlu sahte CLI -> kill + CONFIRMED_DEAD (durable pid uzerinden)', async () => {
  const d = dir();
  try {
    const { launcher } = launcherYap(d, { env: { FAKE_HOLD_MS: '60000' } });
    const adapter = new LocalRuntimeAdapter(probeYap(), launcher, { ORDU_RUNTIME: 'local' });
    const r = await adapter.spawn({ dispatchKey: 'dk-iptal', attemptId: 'att-iptal', prompt: 'p', provider: 'claude-code', model: 'glm-5.3' });
    assert.equal(r.outcome, 'OK');
    const pid = Number((r as any).externalSessionId.slice('local:'.length));
    assert.equal(await adapter.lookup('dk-iptal'), 'ALIVE');
    // BUG-C2 sözleşmesi: cancel(attemptId) -> kill + pencere içinde OS ölüm teyidi
    assert.equal(await adapter.cancel('att-iptal'), 'CONFIRMED_DEAD', 'kill gerçek süreği öldürdü ve teyit edildi');
    assert.equal(await adapter.lookup('dk-iptal'), 'DEAD');
    launcher.removeWorktree('dk-iptal');
    assert.ok(pid > 0);
  } finally {
    temiz(d);
  }
});

// Sahte CLI doğrulaması: --version gerçek sürece yanıt verir (komut tespiti kalitesi —
// providerCliPresent denetimi bu yanıta güvenir).
test('A0-5 kurulum: sahte CLI scripti hazir ve --version yanitlar (diger testler bunu spawn eder)', () => {
  assert.ok(existsSync(SAIKCLI));
  const out = execFileSync(process.execPath, [SAIKCLI, '--version'], { encoding: 'utf8' });
  assert.match(out, /sahte-cli 0\.0\.1/);
});

// =====================================================================
// 10) B8 (denetçi): restart-sonrası cancel — bellek Map'i ölür, kayıt DISKTE
// =====================================================================
test('A0-5 B8: adapter restart sonrasi cancel DISK registry uzerinden (bellek Map i yok sayilir); kayitsiz attemptId UNKNOWN', async () => {
  const d = dir();
  try {
    const { launcher } = launcherYap(d, { env: { FAKE_HOLD_MS: '60000' } });
    // 1. adapter: spawn eder (bellek Map'ine att-1 -> dk-8 kaydı düşer)
    const a1 = new LocalRuntimeAdapter(probeYap(), launcher, { ORDU_RUNTIME: 'local' });
    const r = await a1.spawn({ dispatchKey: 'dk-restart', attemptId: 'att-restart', prompt: 'p', provider: 'claude-code' });
    assert.equal(r.outcome, 'OK');
    assert.equal(await a1.lookup('dk-restart'), 'ALIVE');
    // RESTART BENZETİMİ: aynı launcher üzerinden YENİ adapter — bellek Map'i BOŞ.
    // cancel attemptId ile çağrılır; dispatchKey yalnız DISKTEKİ registry kaydından çözülebilir.
    const a2 = new LocalRuntimeAdapter(probeYap(), launcher, { ORDU_RUNTIME: 'local' });
    assert.equal(await a2.cancel('att-restart'), 'CONFIRMED_DEAD', 'kayıt attemptId DISKTE taşır — restart körlüğü YOK');
    assert.equal(await a2.lookup('dk-restart'), 'DEAD');
    // fail-closed: registry'de OLMAYAN attemptId -> uydurma DEAD yok, UNKNOWN
    assert.equal(await a2.cancel('att-hic-yokmamis'), 'UNKNOWN');
    launcher.removeWorktree('dk-restart');
  } finally {
    temiz(d);
  }
});

// =====================================================================
// 11) B9 (denetçi): registry yazımı başarısız → süreç TELAFİ KILL + RED
// =====================================================================
test('A0-5 B9: pid registry yazimi basarisiz (yok dizin ENOENT) -> cocuk telafi kill + LocalLaunchRed; kayitsiz yasayan surec KALMAZ', async () => {
  const d = dir();
  // Yetim avı: kayıt yazılamadığından pid HİÇBİR YERDE yok — OS işlem tablosundan
  // tara. sahte-cli.mjs'yi komut satırında taşıyan node.exe süreci = yetim
  // (FAKE_HOLD_MS=60000: kill çalışmazsa 60 sn yaşar ve iki taramada da görünür).
  // Tarama yalnız BU dosyanın sahte CLI'sini süzer (diğer test dosyaları 'sahte-cli'
  // spawn etmez; bu süreçte test-dosyaları paralel ama komut satırları farklıdır).
  const tara = (): string => execFileSync('powershell', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
    "@(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -match 'sahte-cli' }).Count",
  ], { encoding: 'utf8', timeout: 20000 }).trim();
  try {
    // registryPath var olmayan dizinde: jsonlEkle openSync ENOENT ile patlar (defter.ts mkdir YAPMAZ)
    const { launcher } = launcherYap(d, {
      registryPath: join(d, 'yok-dizin', 'pid-registry.jsonl'),
      env: { FAKE_HOLD_MS: '60000' },
    });
    await assert.rejects(
      () => launcher.launch({ dispatchKey: 'dk-b9', attemptId: 'att-b9', prompt: 'p', provider: 'claude-code' }),
      (e: any) => e instanceof LocalLaunchRed && /pid registry/.test(e.message) && /telafi kill edildi/.test(e.message),
    );
    // NOT: telafi kill spawn'dan ~1 ms sonra gelir — çocuk ilk satırını (pid yazımını)
    // bile yazamadan ölür; bu yüzden çıktı log'u pid KAYNAĞI OLAMAZ (üretime iyi:
    // yetim penceresi milisaniye; teste kötü: gözlem kaynağı işlem tablosu).
    await uyu(400); // TerminateProcess'in tamamlanmasına nefes
    const say1 = tara();
    assert.equal(say1, '0', 'tarama 1: yetim sahte-cli süreci YOK');
    await uyu(600);
    const say2 = tara();
    assert.equal(say2, '0', 'tarama 2 (1 sn sonra): yetim sahte-cli süreci YOK — kayıtsız yaşayan süreç kalmadı');
  } finally {
    temiz(d);
  }
});
