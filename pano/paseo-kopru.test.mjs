// paseo-kopru.test.mjs — Köprü birim-testi (PANEL-EXPLORER-1 FAZ-A; K-0060 TASLAK).
// HERMETİK: mock .cmd içerikleri izole tmp dizinde (gerçek Paseo kurulumuna dokunulmaz);
// GERÇEK paseo send çağrısı YOK — sahte çocuk enjekte edilir (spawnFn). Pini olanlar:
// argv şablonu sabit · mesaj metni argv'de YOK · shell anahtarı YOK · zaman aşımı davranışı.
import test from "node:test";
import assert from "node:assert";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { kopruZincirCoz, mesajGonder, HEDEF_DESENI, VARSAYILAN_KOK_CMD, ZAMAN_ASIMI_MS } from "./paseo-kopru.mjs";

const KAYNAK = readFileSync(new URL("./paseo-kopru.mjs", import.meta.url), "utf8");

// Gerçek paseo.cmd çiftinin yapısal kopyası (mock içerik — tmp dizinde):
// kök cmd -> BUNDLED_CLI -> kaynaklı cmd (APP_EXECUTABLE + runner + cliJs + env satırları).
function mockZincirKur(d) {
  const bin = join(d, "bin");
  const kaynakliDizin = join(d, "Programs", "Paseo", "resources", "bin");
  mkdirSync(bin, { recursive: true });
  mkdirSync(kaynakliDizin, { recursive: true });
  const kokCmd = join(bin, "paseo.cmd");
  writeFileSync(kokCmd, [
    "@echo off",
    'set "BUNDLED_CLI=' + join(kaynakliDizin, "paseo.cmd") + '"',
    'call "%BUNDLED_CLI%" %*',
    "exit /b %errorlevel%",
    "",
  ].join("\r\n"), "utf8");
  const kaynakli = join(kaynakliDizin, "paseo.cmd");
  writeFileSync(kaynakli, [
    "@echo off",
    "setlocal",
    'set "SCRIPT_DIR=%~dp0"',
    'set "RESOURCES_DIR=%SCRIPT_DIR%.."',
    'set "APP_EXECUTABLE=%RESOURCES_DIR%\\..\\Paseo.exe"',
    'set "ELECTRON_RUN_AS_NODE=1"',
    '"%APP_EXECUTABLE%" --disable-warning=DEP0040 "%RESOURCES_DIR%\\app.asar.unpacked\\dist\\daemon\\node-entrypoint-runner.js" node-script "%RESOURCES_DIR%\\app.asar\\node_modules\\@getpaseo\\cli\\dist\\index.js" %*',
    "exit /b %errorlevel%",
    "",
  ].join("\r\n"), "utf8");
  return { kokCmd, kaynakli };
}

// Sahte çocuk: stdout/stderr verisini 'data' ile (process.nextTick — zamanlayıcılardan
// ÖNCE koşar), bitişi 'close' ile taklit eder. kapanmaz:true — zaman aşımı davranışını
// sınamak için close HİÇ gelmez.
function sahteCocuk({ stdout = "", stderr = "", kod = 0, gecikmeMs = 25, kapanmaz = false } = {}) {
  const c = {
    olduruldu: false,
    stdout: { on: (olay, fn) => { if (olay === "data" && stdout) process.nextTick(() => fn(Buffer.from(stdout, "utf8"))); } },
    stderr: { on: (olay, fn) => { if (olay === "data" && stderr) process.nextTick(() => fn(Buffer.from(stderr, "utf8"))); } },
    on(olay, fn) {
      if (olay === "close" && !kapanmaz) setTimeout(() => fn(kod), gecikmeMs);
    },
    kill() { c.olduruldu = true; },
  };
  return c;
}

const HEDEF = "8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7";
const BEYAZ = new Set([HEDEF, "432e03b7-9004-445c-857d-ebf3b6661d53"]);

test("60- kopruZincirCoz: mock .cmd ikilisinden APP_EXECUTABLE + runner + cliJs cikarilir", () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-kopru-zincir-"));
  try {
    const { kokCmd } = mockZincirKur(d);
    const z = kopruZincirCoz(kokCmd);
    assert.ok(!z.hata, "zincir hatasiz cozulmeli: " + JSON.stringify(z));
    assert.ok(z.appExecutable.endsWith("Paseo.exe"), "APP_EXECUTABLE Paseo.exe: " + z.appExecutable);
    assert.ok(z.appExecutable.includes("resources\\bin\\..\\.."), "RESOURCES_DIR degiskeni genisletilir (\\bin\\..\\..\\Paseo.exe)");
    assert.ok(z.runner.endsWith("app.asar.unpacked\\dist\\daemon\\node-entrypoint-runner.js"), "runner: " + z.runner);
    assert.ok(z.cliJs.endsWith("app.asar\\node_modules\\@getpaseo\\cli\\dist\\index.js"), "cliJs: " + z.cliJs);
    assert.ok(z.bundledCmd && z.bundledCmd.includes("resources"), "bundled cmd yolu doner");
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("61- kopruZincirCoz fail-closed: dosya yok / BUNDLED_CLI yok / APP_EXECUTABLE yok -> {hata}, spawn DENEMEZ", async () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-kopru-red-"));
  try {
    let cagrildi = 0;
    const secenek = (kokCmd) => ({ beyazListe: BEYAZ, kokCmd, spawnFn: () => { cagrildi++; return sahteCocuk(); } });
    /* (a) kok cmd yok */
    let r = await mesajGonder(HEDEF, "m", secenek(join(d, "yok.cmd")));
    assert.ok(r.hata && r.hata.includes("kopru-cozulmedi"), "kok cmd yok -> kopru-cozulmedi: " + r.hata);
    /* (b) BUNDLED_CLI satiri eksik */
    const kok2 = join(d, "kopsuz.cmd");
    writeFileSync(kok2, "@echo off\r\necho BUNDLED_CLI YOK\r\n", "utf8");
    r = await mesajGonder(HEDEF, "m", secenek(kok2));
    assert.ok(r.hata && r.hata.includes("BUNDLED_CLI"), "BUNDLED_CLI yok -> hata: " + r.hata);
    /* (c) bundled cmd APP_EXECUTABLE satiri eksik */
    const { kokCmd } = mockZincirKur(d);
    writeFileSync(join(d, "Programs", "Paseo", "resources", "bin", "paseo.cmd"), "@echo off\r\nset \"SCRIPT_DIR=%~dp0\"\r\n", "utf8");
    r = await mesajGonder(HEDEF, "m", secenek(kokCmd));
    assert.ok(r.hata && r.hata.includes("APP_EXECUTABLE"), "APP_EXECUTABLE yok -> hata: " + r.hata);
    assert.equal(cagrildi, 0, "zincir cozumsuzken spawn HIC cagrilmaz (fail-closed)");
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("62- mesajGonder SABIT argv sablonu: mesaj argv'de YOK · shell anahtari YOK · ELECTRON_RUN_AS_NODE=1 · tmp UTF-8", async () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-kopru-argv-"));
  try {
    const { kokCmd } = mockZincirKur(d);
    const mesaj = "türkçe mesaj — steering <b>yük</b> ile";
    let yakalanan = null; let tmpIcerik = null;
    const r = await mesajGonder(HEDEF, mesaj, {
      beyazListe: BEYAZ, kokCmd,
      spawnFn: (app, argv, secenekler) => {
        yakalanan = { app, argv: [...argv], secenekler };
        tmpIcerik = readFileSync(argv[7], "utf8"); // --prompt-file yolundaki dosya
        return sahteCocuk({ stdout: '{"ok":true,"agentId":"' + HEDEF + '"}' });
      },
    });
    assert.ok(r && r.tamam, "sahte cocuk JSON yanitiyla tamam: " + JSON.stringify(r));
    assert.deepEqual(r.yanit, { ok: true, agentId: HEDEF });
    /* SABIT argv sablonu (birebir dizili) */
    assert.ok(yakalanan.app.endsWith("Paseo.exe") && yakalanan.app.includes(d), "spawn hedefi APP_EXECUTABLE (genisletilmis): " + yakalanan.app);
    assert.equal(yakalanan.argv[0], "--disable-warning=DEP0040");
    assert.equal(yakalanan.argv[1].endsWith("node-entrypoint-runner.js"), true);
    assert.equal(yakalanan.argv[2], "node-script");
    assert.equal(yakalanan.argv[3].endsWith("cli\\dist\\index.js"), true);
    assert.equal(yakalanan.argv[4], "send");
    assert.equal(yakalanan.argv[5], HEDEF);
    assert.equal(yakalanan.argv[6], "--prompt-file");
    assert.equal(yakalanan.argv[8], "--json");
    assert.equal(yakalanan.argv[9], "--no-wait");
    assert.equal(yakalanan.argv[10], "--behavior");
    assert.equal(yakalanan.argv[11], "steer");
    assert.equal(yakalanan.argv.length, 12, "argv 12 ogeli sablon (birebir)");
    /* mesaj metni argv'de YOK — yalniz tmp dosyada */
    assert.ok(!yakalanan.argv.some((a) => a.includes("steering") || a.includes("türkçe") || a.includes("<b>")), "mesaj metni argv'de YOK");
    assert.equal(tmpIcerik, mesaj, "tmp dosya icerigi mesajla birebir (UTF-8 korunur)");
    /* shell anahtari YOK · env zorunlu */
    assert.ok(!("shell" in yakalanan.secenekler), "shell anahtari YOK (cmd.exe enjeksiyon kapisi kapali)");
    assert.equal(yakalanan.secenekler.env.ELECTRON_RUN_AS_NODE, "1");
    /* tmp dosya kosu sonunda silinir */
    assert.equal(yakalanan.argv.some((a) => a.endsWith("mesaj.txt") && existsSync(a)), false, "tmp mesaj dosyasi silinir");
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("63- mesajGonder hedef dogrulama: desen RED · beyaz liste disi RED · liste yok RED · bos mesaj RED — spawn YOK", async () => {
  let cagrildi = 0;
  const bekleyen = (hedef, mesaj, secenek) => mesajGonder(hedef, mesaj, { ...secenek, spawnFn: () => { cagrildi++; return sahteCocuk(); } });
  const d = mkdtempSync(join(tmpdir(), "paseo-kopru-hedef-"));
  try {
    const { kokCmd } = mockZincirKur(d);
    let r = await bekleyen("ABC123", "m", { beyazListe: BEYAZ, kokCmd }); // buyuk harf/decimal desen dişi
    assert.ok(r.hata && r.hata.includes("geçersiz hedef"), "buyuk harf desen dişi RED: " + r.hata);
    r = await bekleyen("../yol-kacisi", "m", { beyazListe: BEYAZ, kokCmd });
    assert.ok(r.hata && r.hata.includes("geçersiz hedef"), "yol kacisi desen dişi RED");
    r = await bekleyen("12345678", "m", { beyazListe: new Set(["99999999"]), kokCmd }); // desen OK ama liste dişi
    assert.ok(r.hata && r.hata.includes("beyaz listede YOK"), "desen OK + liste dişi RED: " + r.hata);
    r = await bekleyen(HEDEF, "m", { kokCmd }); // beyaz liste verilmedi
    assert.ok(r.hata && r.hata.includes("beyaz liste verilmedi"), "liste yok RED (fail-closed): " + r.hata);
    r = await bekleyen(HEDEF, "   ", { beyazListe: BEYAZ, kokCmd });
    assert.ok(r.hata && r.hata.includes("mesaj boş"), "bos mesaj RED: " + r.hata);
    r = await bekleyen(HEDEF, "x".repeat(5000), { beyazListe: BEYAZ, kokCmd });
    assert.ok(r.hata && r.hata.includes("tavan"), "4096 bayt tavani korunur: " + r.hata);
    assert.equal(cagrildi, 0, "hedef/mesaj reddinde spawn HIC cagrilmaz");
    assert.equal(HEDEF_DESENI.test(HEDEF), true, "gecerli kimlik desenle gecer");
    assert.equal(HEDEF_DESENI.test("kurmay-oturum-1"), false, "kod adi kimlik degil (desen dişi)");
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("64- mesajGonder zaman-asimi: kapanmayan cocuk oldurulur + {hata} + tmp silinir", async () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-kopru-asimi-"));
  try {
    const { kokCmd } = mockZincirKur(d);
    let cocuk = null; let tmpYol = null;
    const r = await mesajGonder(HEDEF, "bekle", {
      beyazListe: BEYAZ, kokCmd, zamanAsimiMs: 60,
      spawnFn: (app, argv) => { tmpYol = argv[7]; cocuk = sahteCocuk({ kapanmaz: true, gecikmeMs: 5000 }); return cocuk; },
    });
    assert.ok(r.hata && r.hata.includes("zaman-asimi"), "zaman asimi hata doner: " + r.hata);
    assert.equal(cocuk.olduruldu, true, "cocuk kill() ile olduruldu");
    assert.equal(existsSync(tmpYol), false, "zaman asimi sonrasi tmp dosya da silinir");
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("65- mesajGonder durust hata turleri: cikis kodu != 0 · yanit JSON degil", async () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-kopru-hata-"));
  try {
    const { kokCmd } = mockZincirKur(d);
    const secenek = (cocuk) => ({ beyazListe: BEYAZ, kokCmd, spawnFn: () => cocuk });
    let r = await mesajGonder(HEDEF, "m", secenek(sahteCocuk({ kod: 1, stderr: "agent not found" })));
    assert.ok(r.hata && r.hata.includes("çıkış kodu 1"), "sifir dişi cikis kodu hata: " + r.hata);
    assert.equal(r.stderr, "agent not found", "stderr durust tasınır");
    r = await mesajGonder(HEDEF, "m", secenek(sahteCocuk({ stdout: "bu JSON degil" })));
    assert.ok(r.hata && r.hata.includes("JSON değil"), "JSON olmayan yanit hata: " + r.hata);
    assert.equal(r.stdoutKisit, "bu JSON degil", "ham kisit durust doner");
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("66- kaynak-pin (K-0060 dar izin): spawn yalnuz bu dosyada · shell asla · prompt-file + no-wait + steer", () => {
  assert.ok(KAYNAK.includes('from "node:child_process"'), "child_process yalnız köprüde");
  assert.ok(!/shell\s*:\s/.test(KAYNAK), "shell: anahtarı kaynakta YOK");
  assert.ok(KAYNAK.includes("--prompt-file") && KAYNAK.includes("--no-wait") && KAYNAK.includes('"steer"'), "sabit argv sablonu kaynakta");
  assert.ok(KAYNAK.includes("ELECTRON_RUN_AS_NODE"), "Electron node modu env'i");
  assert.ok(KAYNAK.includes("beyazListe"), "beyaz liste dogrulamasi");
  assert.equal(VARSAYILAN_KOK_CMD.endsWith(join(".local", "bin", "paseo.cmd")), true, "varsayilan kok cmd USERPROFILE altinda");
  assert.equal(ZAMAN_ASIMI_MS, 15_000, "zaman asimi 15sn");
});
