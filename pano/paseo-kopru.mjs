// paseo-kopru.mjs — Composer gönderim köprüsü (K-0060 TASLAK; PANEL-EXPLORER-1 FAZ-A).
// DAR SPAWN İZNİ: yalnız sabit argv şablonu + beyaz-liste hedef + UTF-8 prompt-file +
// --no-wait + zaman aşımı. Mesaj metni ASLA argv'ye girmez (tmp dosyaya yazılır, koşu
// sonunda silinir) · shell anahtarı ASLA kullanılmaz · zincir çözülemezse {hata} döner,
// spawn DENEMEZ (fail-closed). server.js'e child_process GELMEDİ — izin yalnız bu dosyada.
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export const VARSAYILAN_KOK_CMD = join(process.env.USERPROFILE || "C:\\Users\\gatep", ".local", "bin", "paseo.cmd");
export const HEDEF_DESENI = /^[a-f0-9-]{8,64}$/; // Paseo ajan kimliği (hex + tire, 8-64)
export const ZAMAN_ASIMI_MS = 15_000;
export const MESAJ_TAVAN = 4096; // server.js GOVDE_LIMIT_BAYT ile aynı tavan — köprüde de korunur
const CIKTI_TAVAN_BAYT = 262_144; // stdout toplama tavanı (çıktı şişerse ilk 256KB kalır)

// .cmd metninden set "AD=değer" atamalarını çıkarır (BUNDLED_CLI / APP_EXECUTABLE / RESOURCES_DIR).
function cmdAtamalar(metin) {
  const map = new Map();
  for (const es of metin.matchAll(/set\s+"([A-Z_]+)=([^"]*)"/g)) map.set(es[1], es[2]);
  return map;
}

// İki .cmd'yi okuyup APP_EXECUTABLE + runner (node-entrypoint-runner.js) + cli-js
// (@getpaseo/cli dist/index.js) yollarını çıkarır. Başarısızsa {hata} döner — spawn DENEMEZ.
export function kopruZincirCoz(kokCmdYolu = VARSAYILAN_KOK_CMD) {
  try {
    const kokMetin = readFileSync(String(kokCmdYolu), "utf8");
    const bundledCmd = cmdAtamalar(kokMetin).get("BUNDLED_CLI");
    if (!bundledCmd) return { hata: "kök cmd BUNDLED_CLI ataması bulunamadı: " + kokCmdYolu };
    const metin = readFileSync(bundledCmd, "utf8");
    const atamalar = cmdAtamalar(metin);
    const appHam = atamalar.get("APP_EXECUTABLE");
    if (!appHam) return { hata: "paseo cmd APP_EXECUTABLE ataması bulunamadi: " + bundledCmd };
    const runnerEs = metin.match(/"([^"]*node-entrypoint-runner\.js)"/);
    if (!runnerEs) return { hata: "paseo cmd node-entrypoint-runner.js satırı bulunamadı: " + bundledCmd };
    const cliEs = metin.match(/"([^"]*\\@getpaseo\\cli\\dist\\index\.js)"/);
    if (!cliEs) return { hata: "paseo cmd @getpaseo/cli dist index.js satırı bulunamadı: " + bundledCmd };
    // %~dp0 = cmd'nin dizini (sonunda bölü) -> SCRIPT_DIR; RESOURCES_DIR = SCRIPT_DIR..
    const degiskenler = new Map(atamalar);
    degiskenler.set("SCRIPT_DIR", dirname(bundledCmd) + "\\");
    const genislet = (ham) => ham.replace(/%([A-Z_]+)%/g, (tam, ad) => (degiskenler.has(ad) ? degiskenler.get(ad) : tam));
    if (degiskenler.has("RESOURCES_DIR")) degiskenler.set("RESOURCES_DIR", genislet(degiskenler.get("RESOURCES_DIR")));
    return {
      appExecutable: genislet(appHam),
      runner: genislet(runnerEs[1]),
      cliJs: genislet(cliEs[1]),
      bundledCmd,
    };
  } catch (e) {
    return { hata: "köprü zinciri çözümlenemedi: " + (e instanceof Error ? e.message : String(e)) };
  }
}

// Hedef doğrulama: desen + çağıranın beyaz listesinde birebir eşleşme (fail-closed —
// liste verilmezse RED). Beyaz liste server ucu projelerTara taramasından gelir.
function hedefGecerliMi(hedefKimlik, beyazListe) {
  if (typeof hedefKimlik !== "string" || !HEDEF_DESENI.test(hedefKimlik)) return "geçersiz hedef kimliği (izinli: a-f0-9 ve tire, 8-64 karakter)";
  const kume = beyazListe instanceof Set ? beyazListe : Array.isArray(beyazListe) ? new Set(beyazListe) : null;
  if (!kume) return "beyaz liste verilmedi — hedef RED (fail-closed)";
  if (!kume.has(hedefKimlik)) return "hedef beyaz listede YOK: " + hedefKimlik;
  return null;
}

// Sabit argv şablonu (K-0060): mesaj metni argv'de YOK — yalnız tmp dosya yolu taşınır.
export function mesajGonder(hedefKimlik, mesaj, secenekler = {}) {
  const hata = hedefGecerliMi(hedefKimlik, secenekler.beyazListe);
  if (hata) return Promise.resolve({ hata });
  if (typeof mesaj !== "string" || !mesaj.trim()) return Promise.resolve({ hata: "mesaj boş olamaz" });
  if (Buffer.byteLength(mesaj, "utf8") > MESAJ_TAVAN) return Promise.resolve({ hata: "mesaj tavan aşıldı (" + MESAJ_TAVAN + " bayt)" });
  const zincir = secenekler.zincir && !secenekler.zincir.hata ? secenekler.zincir : kopruZincirCoz(secenekler.kokCmd ?? VARSAYILAN_KOK_CMD);
  if (zincir.hata) return Promise.resolve({ hata: "kopru-cozulmedi: " + zincir.hata });
  const spawnFn = secenekler.spawnFn ?? spawn; // testler sahte çocuk enjekte eder; üretimde gerçek spawn
  const tmpDizin = mkdtempSync(join(tmpdir(), "paseo-kopru-"));
  const tmpDosya = join(tmpDizin, "mesaj.txt");
  writeFileSync(tmpDosya, mesaj, "utf8"); // mesaj yalnız burada yaşar — argv'ye ASLA
  const argv = [
    "--disable-warning=DEP0040",
    zincir.runner,
    "node-script",
    zincir.cliJs,
    "send",
    hedefKimlik,
    "--prompt-file",
    tmpDosya,
    "--json",
    "--no-wait",
    "--behavior",
    "steer",
  ];
  const spawnSecenekleri = { env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" } }; // shell anahtarı ASLA (K-0060)
  return new Promise((tamam) => {
    const basladi = Date.now();
    let cocuk;
    try {
      cocuk = spawnFn(zincir.appExecutable, argv, spawnSecenekleri);
    } catch (e) {
      try { rmSync(tmpDizin, { recursive: true, force: true }); } catch { /* tmp zaten yok */ }
      tamam({ hata: "spawn başlatılamadı: " + (e instanceof Error ? e.message : String(e)) });
      return;
    }
    let bitti = false; let asildi = false;
    const ciktiKutu = { deger: "" }; const hataKutu = { deger: "" };
    const temizle = () => { try { rmSync(tmpDizin, { recursive: true, force: true }); } catch { /* koşu sonrası OS temizler */ } };
    const kapat = (sonuc) => { if (bitti) return; bitti = true; clearTimeout(zamanlayici); temizle(); tamam(sonuc); };
    const topla = (kutu, sinir) => (parca) => {
      if (kutu.deger.length < sinir) kutu.deger = kutu.deger + parca.toString("utf8");
    };
    try { cocuk.stdout.on("data", topla(ciktiKutu, CIKTI_TAVAN_BAYT)); } catch { /* sahte çocuk stdout taşımaz */ }
    try { cocuk.stderr.on("data", topla(hataKutu, 8192)); } catch { /* sahte çocuk stderr taşımaz */ }
    const zamanlayici = setTimeout(() => {
      asildi = true;
      try { cocuk.kill(); } catch { /* ölmüş olabilir */ }
      kapat({ hata: "zaman-asimi (" + (secenekler.zamanAsimiMs ?? ZAMAN_ASIMI_MS) + "ms — çocuk öldürüldü)" });
    }, secenekler.zamanAsimiMs ?? ZAMAN_ASIMI_MS);
    cocuk.on("close", (kod) => {
      if (asildi) return; // zaman aşımı kapanışı zaten sonuçlandı
      if (kod !== 0) { kapat({ hata: "paseo send çıkış kodu " + kod + " (" + (Date.now() - basladi) + "ms)", stderr: hataKutu.deger.slice(0, 512) }); return; }
      let yanit = null;
      try { yanit = JSON.parse(ciktiKutu.deger); } catch { kapat({ hata: "paseo yanıtı JSON değil (dürüst ham kısıt)", stdoutKisit: ciktiKutu.deger.slice(0, 256) }); return; }
      kapat({ tamam: true, yanit });
    });
    cocuk.on("error", (e) => { if (asildi) return; kapat({ hata: "spawn hatası: " + (e instanceof Error ? e.message : String(e)) }); });
  });
}
