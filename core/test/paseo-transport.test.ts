// P0-4 negatif testler: CLI->paseo transport shell-enjeksiyonu kapandi mi?
// Kanit iki katmanli: (1) argv vektorunde prompt TEK eleman ve byte-identik,
// (2) gercek process sinirinda (execFileSync, shell:false) metakarakterler
// yorumlanmaz — "& calc", "%PATH%", "> pwn" hicbir sey CALISTIRMAZ.
// 0.11.2: arguman vektoru gercek `paseo run --help` ciktisiyla birebir dogrulandi:
// run --provider <p> --mode auto --cwd <cwd> --title ordu:<dk> --json <prompt>.
// .cmd shim shell'siz calismaz: cozumleme Paseo.exe + node-entrypoint-runner
// zincirine gider (resmi shim'den cozuldu, --version exit 0 ile dogrulandi).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeSafePaseoTransport, paseoSpawnArgs, paseoLookupArgs, paseoCancelArgs, parseSpawnedSessionId, resolvePaseoBinary } from '../src/paseo-transport.ts';
import { PaseoWorkerAdapter } from '../src/paseo-adapter.ts';
import { cliMain } from '../src/cli.ts';
import { openStore } from '../src/store.ts';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// cmd.exe metakarakter buketi: komut zinciri, degisken genisletme, pipe, yonlendirme, tirnak, backtick
const PAYLOAD = 'acik & calc & echo %PATH% | dir > PWN-MARKER.txt && "tirnak" `backtick` $(sub) ; son';

// Sahte kurulum: resolvePaseoBinary'nin fail-closed kontrollerini gecen minimal yapi.
// Donen temizleyici env'i geri alir.
function fakePaseoInstall(): { dir: string; restore: () => void } {
  const base = mkdtempSync(join(tmpdir(), 'ordu-paseo-bin-'));
  const resources = join(base, 'resources');
  mkdirSync(join(resources, 'app.asar.unpacked', 'dist', 'daemon'), { recursive: true });
  writeFileSync(join(base, 'Paseo.exe'), 'fake');
  writeFileSync(join(resources, 'app.asar.unpacked', 'dist', 'daemon', 'node-entrypoint-runner.js'), '// fake');
  const prev = process.env.ORDU_PASEO_RESOURCES;
  process.env.ORDU_PASEO_RESOURCES = resources;
  return { dir: base, restore: () => { if (prev === undefined) delete process.env.ORDU_PASEO_RESOURCES; else process.env.ORDU_PASEO_RESOURCES = prev; } };
}

test('argv: 0.11.2 vektoru — provider/mode-auto/cwd/title/json sirasi + prompt TEK eleman byte-identik', async () => {
  const args = paseoSpawnArgs({ dispatchKey: 'dk-1', attemptId: 'a-1', prompt: PAYLOAD, cwd: 'D:\\wt' });
  assert.deepEqual(args.slice(0, -1), ['run', '--provider', 'codex/kimi-K3', '--mode', 'auto', '--cwd', 'D:\\wt', '--title', 'ordu:dk-1', '--json'],
    'arguman vektoru gercek CLI yardimiyla birebir uyumlu');
  assert.equal(args[args.length - 1], PAYLOAD, 'prompt degistirilmeden tek token');
  assert.equal(args.filter((a) => a.includes('calc')).length, 1, 'payload baska elemana bulasmadi');
  assert.deepEqual(paseoLookupArgs(), ['ls', '--json', '--all']);
  assert.deepEqual(paseoCancelArgs('sess-1'), ['stop', 'sess-1']);
});

test('argv: provider ORDU_PROVIDER env\'inden gelir; --workspace dispatchKey kalibina DONUS YOK', async () => {
  const prev = process.env.ORDU_PROVIDER;
  process.env.ORDU_PROVIDER = 'codex/gpt-5.4';
  try {
    const args = paseoSpawnArgs({ dispatchKey: 'dk-2', attemptId: 'a-2', prompt: 'p' });
    assert.equal(args[args.indexOf('--provider') + 1], 'codex/gpt-5.4');
  } finally {
    if (prev === undefined) delete process.env.ORDU_PROVIDER; else process.env.ORDU_PROVIDER = prev;
  }
  const src = readFileSync(join(root, 'src', 'paseo-transport.ts'), 'utf8');
  assert.ok(!src.includes("'--workspace', o.dispatchKey"), 'yanlis --workspace dispatchKey kalibi geri geldi');
  assert.ok(src.includes("'--mode', 'auto'"), 'mode auto zorunlu (full-access yasak)');
});

test('resolvePaseoBinary: exe + runner oneki + zorunlu env; .cmd hicbir yerde yok', async () => {
  const fake = fakePaseoInstall();
  try {
    const bin = resolvePaseoBinary();
    assert.equal(bin.file, resolve(fake.dir, 'Paseo.exe'));
    assert.equal(bin.prefixArgs[0], '--disable-warning=DEP0040');
    assert.ok(bin.prefixArgs[1].endsWith('node-entrypoint-runner.js'));
    assert.equal(bin.prefixArgs[2], 'node-script');
    assert.ok(bin.prefixArgs[3].endsWith(join('@getpaseo', 'cli', 'dist', 'index.js')));
    assert.equal(bin.env.ELECTRON_RUN_AS_NODE, '1');
    assert.equal(bin.env.PASEO_NODE_ENV, 'production');
    assert.equal(bin.env.PASEO_DESKTOP_MANAGED, '1');
  } finally {
    fake.restore();
  }
});

test('resolvePaseoBinary NEGATIF: binary/runner yoksa fail-closed firlatir', async () => {
  const bos = mkdtempSync(join(tmpdir(), 'ordu-paseo-bos-'));
  assert.throws(() => resolvePaseoBinary(bos), /ENOENT.*binary bulunamadi/);
  const resources = join(bos, 'resources');
  mkdirSync(resources, { recursive: true });
  writeFileSync(join(bos, 'Paseo.exe'), 'fake');
  assert.throws(() => resolvePaseoBinary(resources), /ENOENT.*runner bulunamadi/);
});

test('kaynak bekÃ§isi: hicbir cagri yolu .cmd shim\'e dusmez', async () => {
  const src = readFileSync(join(root, 'src', 'paseo-transport.ts'), 'utf8');
  assert.ok(!src.includes("execFile('paseo'"), 'dogrudan shim adina exec kalmadi');
  assert.ok(!src.includes('paseo.cmd'), 'kaynak .cmd shim referansi tasimaz');
  assert.ok(src.includes('execPaseo('), 'tum cagrilar cozumlenmis binary uzerinden');
});

test('parseSpawnedSessionId: JSON govdeden id — son-satir hack\'i degil', async () => {
  assert.equal(parseSpawnedSessionId('{"id":"sess-42","shortId":"sess"}'), 'sess-42');
  assert.equal(parseSpawnedSessionId('gurultu satiri\n[{"id":"sess-7"}]\nbaska gurultu'), 'sess-7', 'govde oncesi/sonrasi gurultu tolere edilir');
  assert.equal(parseSpawnedSessionId('[{"id":"a-1"},{"id":"a-2"}]'), 'a-1', 'liste ciktisinda ilk kayit');
});

test('NEGATIF: json parse bozuksa spawn UNKNOWN sinifina duser (belirsizlik = UNKNOWN)', async () => {
  assert.throws(() => parseSpawnedSessionId('tamamen bozuk <<<>>>'), /boş çıktı|parse edilemedi/, 'parse hatasi belirsizlik mesaji tasir');
  assert.throws(() => parseSpawnedSessionId('{"name":"id-yok"}'), /id alani yok/);
  const fake = fakePaseoInstall();
  try {
    const t = makeSafePaseoTransport(() => 'tamamen bozuk <<<>>>');
    await assert.rejects(() => t.spawn({ dispatchKey: 'dk-x', attemptId: 'a-x', prompt: 'p' }), /boş çıktı|parse edilemedi/);
  } finally {
    fake.restore();
  }
});

test('lookup NEGATIF: json parse bozuksa UNKNOWN; name eslesmezse UNKNOWN', async () => {
  const fake = fakePaseoInstall();
  try {
    const broken = makeSafePaseoTransport(() => 'not-json <<<');
    assert.equal(await broken.lookup('dk-1'), 'UNKNOWN', 'bozuk json ALIVE kaniti olamaz');
    const execThrows = makeSafePaseoTransport(() => { throw new Error('ENOENT'); });
    assert.equal(await execThrows.lookup('dk-1'), 'UNKNOWN', 'daemon ulasilamaz → UNKNOWN');
    const noMatch = makeSafePaseoTransport(() => '[{"id":"agent-9","name":"ordu:baskasi","status":"running"}]');
    assert.equal(await noMatch.lookup('dk-1'), 'UNKNOWN', 'name eslesmesi yok → korelasyon yok');
    const notArray = makeSafePaseoTransport(() => '{"id":"x"}');
    assert.equal(await notArray.lookup('dk-1'), 'UNKNOWN', 'liste olmayan json → UNKNOWN');
  } finally {
    fake.restore();
  }
});

test('lookup: name korelasyonu + status haritasi (0.11.2 durumlari)', async () => {
  const fake = fakePaseoInstall();
  try {
    const mk = (status: string) => makeSafePaseoTransport(() => `[{"id":"i","name":"ordu:dk-1","status":"${status}"}]`);
    assert.equal(await mk('running').lookup('dk-1'), 'ALIVE');
    assert.equal(await mk('idle').lookup('dk-1'), 'ALIVE');
    assert.equal(await mk('initializing').lookup('dk-1'), 'ALIVE');
    assert.equal(await mk('closed').lookup('dk-1'), 'DEAD');
    assert.equal(await mk('error').lookup('dk-1'), 'DEAD');
    assert.equal(await mk('tuhaf-durum').lookup('dk-1'), 'UNKNOWN', 'bilinmeyen status iddia kazandirmaz');
  } finally {
    fake.restore();
  }
});

test('transport: enjekte exec .exe + onekli argv ve JSON session-id (metakarakter round-trip) + cancel', async () => {
  const fake = fakePaseoInstall();
  try {
    const seen: { file: string; args: string[] }[] = [];
    const t = makeSafePaseoTransport((file, args) => { seen.push({ file, args }); return '{"id":"sess-42"}'; });
    const sid = await t.spawn({ dispatchKey: 'dk-9', attemptId: 'a-9', prompt: PAYLOAD });
    assert.equal(sid, 'sess-42');
    assert.equal(seen[0].file, resolve(fake.dir, 'Paseo.exe'), 'exec hedefi .cmd degil cozumlenmis .exe');
    const runIdx = seen[0].args.indexOf('run');
    assert.equal(runIdx, 4, 'onek 4 eleman: DEP0040 + runner + node-script + cli-index');
    assert.deepEqual(seen[0].args.slice(runIdx, runIdx + 2), ['run', '--provider']);
    assert.equal(seen[0].args[seen[0].args.length - 1], PAYLOAD, 'prompt onek sonrasi TEK eleman byte-identik');
    await t.cancel('sess-42');
    const stopIdx = seen[1].args.indexOf('stop');
    assert.deepEqual(seen[1].args.slice(stopIdx), ['stop', 'sess-42']);
  } finally {
    fake.restore();
  }
});

test('GERCEK SINIR: shell:false execFile metakarakterleri CALISTIRMAZ (negatif kanit)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-p04-'));
  const marker = join(dir, 'PWN-MARKER.txt');
  const payload = 'x & echo owned > "' + marker + '" & echo %PATH% | more';
  // transport'un urettigi argv sekliyle ayni sinir: shell olmadan tek arguman
  const out = execFileSync(process.execPath, ['-e', 'process.stdout.write(process.argv[1])', payload], { encoding: 'utf8', shell: false });
  assert.equal(out, payload, 'payload arguman olarak degismeden ulasti');
  assert.equal(existsSync(marker), false, 'yonlendirme calismadi — dosya OLUSMADI');
  assert.equal(/owned/.test(out) && out !== payload, false, 'komut zinciri yorumlanmadi');
});

test('regresyon bekÃ§isi: cli.ts kabuk-string spawn kalibina geri donmemis', async () => {
  const src = readFileSync(join(root, 'src', 'cli.ts'), 'utf8');
  assert.ok(src.includes('makeSafePaseoTransport'), 'cli guvenli transportu kullaniyor');
  assert.ok(!src.includes('makePaseoTransport('), 'eski shell-string transport bagli degil');
  const sanitizerKalibi = 'prompt.replace(' + ''; // duz literal strip-types parser bug'ina takiliyor (Node 24.18)
  assert.ok(!src.includes(sanitizerKalibi), 'tirnak-siyirma sanitizer kalibi yok (artik gereksiz)');
});

// --- F5.5: kapsul repo'su spawn cwd'sine baglanir (oturum-ici spawn bug duzeltmesi) ---

const F55_COMMIT = createHash('sha256').update('f55-capsule').digest('hex');
// resume idempotency-key'i now()'dan turer; sabit saat ikinci resume'u RED eder.
let f55Tick = 0;
const F55_NOW = () => new Date(Date.parse('2026-10-13T19:00:00Z') + f55Tick++ * 1000);

function f55CleanProbe(): string {
  const all = ['nodePinned24', 'gitPresent', 'paseoCliPresent', 'paseoDaemonReachable', 'worktreeIsolationProven', 'sandboxEstablished', 'structuredOutput', 'usageReporting', 'cancelConfirm'];
  const canonical = (v: unknown): string =>
    v === null || typeof v !== 'object' ? JSON.stringify(v)
      : Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']'
        : '{' + Object.keys(v as object).sort().map((k) => JSON.stringify(k) + ':' + canonical((v as any)[k])).join(',') + '}';
  const r: any = { probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: '2026-10-13T18:00:00.000Z', node: 'v24.18.0', capabilities: Object.fromEntries(all.map((k) => [k, true])), blocked: [] };
  r.probeReceiptHash = createHash('sha256').update(canonical(r)).digest('hex');
  const p = join(mkdtempSync(join(tmpdir(), 'ordu-f55-probe-')), 'probe.json');
  writeFileSync(p, JSON.stringify(r, null, 2));
  return p;
}

// capsule -> approve -> resume -> dispatch; sonuc: outbox'ta PENDING satir.
async function f55Dispatch(dbPath: string, probePath: string, repo: string): Promise<void> {
  const d = { dbPath, env: {}, probePath, now: F55_NOW };
  let r = await cliMain(['capsule', '--goal', 'f55 cwd testi', '--repo', repo, '--commit', F55_COMMIT], d);
  assert.equal(r.code, 0);
  const out = r.out as any;
  r = await cliMain(['approve', '--run', out.runId, '--plan-hash', out.planHash], d);
  assert.equal(r.code, 0);
  r = await cliMain(['resume', '--confirm', 'I understand the risk'], d);
  assert.equal(r.code, 0);
  r = await cliMain(['dispatch', '--run', out.runId], d);
  assert.equal(r.code, 0);
  assert.equal((r.out as any).dispatched.length, 1);
}

test('F5.5: tick spawn argv — cwd kapsul reposundan gelir + --workspace find-or-create iletilir', async () => {
  const fake = fakePaseoInstall();
  try {
    const repoDir = mkdtempSync(join(tmpdir(), 'ordu-f55-repo-'));
    const dbPath = join(mkdtempSync(join(tmpdir(), 'ordu-f55-db-')), 'ordu.sqlite');
    const probePath = f55CleanProbe();
    await f55Dispatch(dbPath, probePath, repoDir);

    const seen: string[][] = [];
    const exec = (_file: string, args: string[]) => {
      seen.push(args);
      if (args.includes('workspace') && args.includes('ls')) return '[]';
      if (args.includes('workspace') && args.includes('create')) return JSON.stringify({ workspaceId: 'wks-f55', cwd: repoDir });
      if (args.includes('run')) return '{"id":"sess-f55"}';
      return '[]';
    };
    const adapter = new PaseoWorkerAdapter({ blocked: [] } as any, makeSafePaseoTransport(exec), { ORDU_LIVE: '1' });
    const r = await cliMain(['tick'], { dbPath, env: {}, probePath, now: F55_NOW, makeAdapter: () => adapter });
    assert.equal(r.code, 0);
    assert.equal((r.out as any).outbox.result, 'bound');

    const runArgs = seen.find((a) => a.includes('run'));
    assert.ok(runArgs, 'run cagrisi yapilmadi');
    assert.equal(runArgs[runArgs.indexOf('--cwd') + 1], repoDir, 'spawn cwd kapsul repo yolu degil');
    assert.equal(runArgs[runArgs.indexOf('--workspace') + 1], 'wks-f55', 'workspace find-or-create sonucu spawn argv iletilmedi');
    const lsIdx = seen.findIndex((a) => a.includes('workspace') && a.includes('ls'));
    assert.ok(lsIdx >= 0 && lsIdx < seen.indexOf(runArgs), 'workspace cozumleme spawn oncesi yapilmali');
  } finally {
    fake.restore();
  }
});

test('F5.5 NEGATIF: repo yolu yoksa/goreliyse spawn FATAL — rezervasyon RELEASED, exec hic cagrilmaz', async () => {
  const fake = fakePaseoInstall();
  try {
    const dbPath = join(mkdtempSync(join(tmpdir(), 'ordu-f55-neg-')), 'ordu.sqlite');
    const probePath = f55CleanProbe();
    let execCalled = 0;
    const exec = () => { execCalled++; return '{"id":"asla"}'; };
    const adapter = new PaseoWorkerAdapter({ blocked: [] } as any, makeSafePaseoTransport(exec), { ORDU_LIVE: '1' });
    const tickDeps = { dbPath, env: {}, probePath, now: F55_NOW, makeAdapter: () => adapter };

    // (a) mutlak ama var olmayan dizin
    await f55Dispatch(dbPath, probePath, join(tmpdir(), 'ordu-f55-olmayan-xyz'));
    let r = await cliMain(['tick'], tickDeps);
    assert.equal((r.out as any).outbox.result, 'fatal');

    // (b) goreli yol — cozumleme tabani belirsiz, fail-closed RED
    await f55Dispatch(dbPath, probePath, 'goreli-repo');
    r = await cliMain(['tick'], tickDeps);
    assert.equal((r.out as any).outbox.result, 'fatal');

    assert.equal(execCalled, 0, 'gecersiz repo yolunda transport/exec hic cagrilmamali');
    const db = openStore(dbPath);
    try {
      const outbox = db.prepare('SELECT status FROM outbox ORDER BY rowid').all() as any[];
      assert.deepEqual(outbox.map((x) => x.status), ['FAILED', 'FAILED']);
      const res = db.prepare('SELECT state FROM reservations ORDER BY rowid').all() as any[];
      assert.deepEqual(res.map((x) => x.state), ['RELEASED', 'RELEASED']);
      const atts = db.prepare('SELECT state FROM attempts ORDER BY rowid').all() as any[];
      assert.deepEqual(atts.map((x) => x.state), ['FAILED', 'FAILED']);
    } finally {
      db.close();
    }
  } finally {
    fake.restore();
  }
});
