// paseo-pano mini sunucu — K-0019 prototip. Bagimliliksiz node:http, yalniz 127.0.0.1.
// D-1a (kapsul-tuval cekirdegi): PANO_PORT (test icin 0 = gecici port), GET /tuval, GET /api/graf.
// D-3 Kapi 3 (dar-dene dalga 2/3; K-0055): POST /api/atama/taslak + /api/atama/onay + GET /api/atama/durum.
// BAKIM GP-1 (2026-11-01; GUVENLIK-DENETCI GD-004/005/006):
//   GD-004 — token karsilastirmasi ZAMAN-SABIT: crypto.timingSafeEqual (uzunluk on-kontrolu ile;
//     !== deseni kalkti — 403/401 semantigi ve mesajlari AYNEN korundu).
//   GD-005 — senkron yazma atislari (mkdir/open/write/rename/append) yakalanir -> 500 jsonYaz:
//     yaristan/rename redinde surec CRASH ETMEZ; kalan tmp dosyasi temizlenir; onayli md aynasi
//     yazilamazsa jsonl kaydi durustlukle bildirilir (cift-kayit acigi acik soylenir — E10).
//   GD-006 — govde toplama Buffer parcalariyla (Buffer.concat; deney-server.mjs govdeOku deseni):
//     cok baytli UTF-8 karakteri parca sinirinda BOZULMAZ (eski += deseni mojibake uretiyordu);
//     limit artik BAYT cinsinden (4096 — onceki karakter sayimi degil).
import http from "node:http";
import { readFileSync, existsSync, readdirSync, statSync, writeFileSync, renameSync, mkdirSync, openSync, writeSync, fsyncSync, closeSync, appendFileSync, rmSync } from "node:fs";
import { timingSafeEqual } from "node:crypto";
import { join, resolve } from "node:path";
import { atamaTaslakla, onayla } from "./graf-yonetim.js"; // D-3 cekirdegi (yazilmaz, yalniz cagrilir)
import { atamaYaz, atamaOku, atamaDurum } from "./graf-yaz.mjs";
import { kiraDurum, kiraYoluCoz, logOku } from "./devir-kira.mjs"; // ORDU paneli: kira/log kaynagi (salt-okur)
import { aktifIsOku, akisTopla, defterOzet, gitHeadOku, kadroBirlesim, kiraEtiketi, saglikBirlesim, sorunBirlesim, genelSaglikIsigi, grafSayim, ajanEslemeKur, logBirlesik, projelerTara, sonDamgaSatiri } from "./ordu-birlesim.mjs"; // ORDU paneli birlesim katmani

const PORT = process.env.PANO_PORT !== undefined ? Number(process.env.PANO_PORT) : 4377;
const GRAF_JSON = process.env.ORDU_GRAF_JSON || join(import.meta.dirname, "..", "plans", "gorev-grafigi-2026-10-26.json");
const KAPSUL_DIR = process.env.ORDU_KAPSUL_DIR || join(import.meta.dirname, "..", "plans", "kapsuller");
const ATAMA_DIR = process.env.ORDU_ATAMA_DIR || join(import.meta.dirname, "..", "plans", "atamalar"); // D-3 cift-kayit hedefi (KA-4)
// ORDU KOMUTA PANELI (2026-11-01 spec + 17:5x guncellemesi): SALT-OKUR ek yollar (env ile ezilebilir;
// mevcut uclarin/verilerin davranisi AYNEN — yalnizca EKLEME, /api/graf ve /api/veri degismez):
const ORDU_KOK = process.env.ORDU_KOK || join(import.meta.dirname, "..");
const ORDU_HTML = join(import.meta.dirname, "ordu-panosu.html");
const KADRO_JSON = process.env.ORDU_KADRO_JSON || join(import.meta.dirname, "ordu-kadro.json");
const HANDOFF_DIR = process.env.ORDU_HANDOFF_DIR || join(ORDU_KOK, "plans", "handoff");
const SORUN_OZET = process.env.ORDU_SORUN_JSON || join(ORDU_KOK, "raporlar", "sorun-envanteri-2026-11-01", "OZET.json");
const DEFTER_429 = process.env.ORDU_429_DEFTER || join(ORDU_KOK, "plugin", "data", "429-defter.jsonl");
const STATE_MD = process.env.ORDU_STATE_MD || join(ORDU_KOK, "STATE_BOARD.md");
// BOLUM 6 (LOG spec eki): kira-log + deney defteri/ajanlari (salt-okur; panel diske log YAZMAZ)
const KIRA_LOG = process.env.ORDU_KIRA_LOG || join(ORDU_KOK, "core", "data", "devir-kira.json-log.jsonl");
const DENAY_LOG = process.env.ORDU_DENAY_LOG || join(ORDU_KOK, "raporlar", "deney-canli-panel-2026-10-29", "log.jsonl");
const DENAY_AJANLAR = process.env.ORDU_DENAY_AJANLAR || join(ORDU_KOK, "raporlar", "deney-canli-panel-2026-10-29", "ajanlar.json");
const LOG_TAVAN = 200; // goruntuleme tavani — kaynak defterler append-only, panel silmez
// STEERING-7: Paseo agents deposu (salt-okur canli tarama) — env PASEO_EV test fixture'i icin ezilebilir.
// ~/.paseo/config.json'da workspace kayit defteri YOK (koordinator kontrolu) — diskteki tek canli kaynak agents/ taramasi.
const PASEO_EV = process.env.PASEO_EV || join(process.env.USERPROFILE || "C:\\Users\\gatep", ".paseo");
const ORDU_DIZIN_ADI = ORDU_KOK.replace(/[\\/:]+/g, "-"); // ordu kokunun Paseo agents dizin adi — boli isaretleri VE surucu iki noktasi tireye (D:\Vibecode\ordu -> D-Vibecode-ordu; olcumle kanitlandi)
const TTL_MS = 60_000;
const TOKEN = process.env.PANO_TOKEN || null;
const KOKLER = (process.env.PANO_KOKLER || "D:\\Vibecode").split(";");
const GOVDE_LIMIT_BAYT = 4096; // POST govde tavani (BAYT — GD-006): asiminda baglanti kesilir
const onbellek = new Map(); // repo -> { ts, veri }
const sseIstemci = new Set();

// GD-004: zaman-sabit token karsilastirma — uzunluk FARKLIYSA timingSafeEqual hic cagrilmez
// (uzunluk sirmaz; uzunluk esitse icerik karsilastirmasi sabit sureli). TOKEN yoksa her sey RED.
function tokenGecerliMi(gelen) {
  if (typeof gelen !== "string" || !TOKEN) return false;
  const a = Buffer.from(gelen);
  const b = Buffer.from(TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

// GD-006: govdeyi Buffer paralariyla toplar; 'end' uzerinde TEK decode (utf8) — cok baytli
// karakter parca sinirinda bozulmaz (deney-server.mjs govdeOku deseni). GOVDE_LIMIT_BAYT
// asiminda baglanti kesilir (yanit YOK — eski davranis); kopan istek sessiz yutilir.
function govdeTopla(req, cb) {
  const parcalar = [];
  let bayt = 0;
  let kesildi = false;
  req.on("data", (p) => {
    if (kesildi) return;
    bayt += p.length;
    if (bayt > GOVDE_LIMIT_BAYT) { kesildi = true; req.destroy(); return; }
    parcalar.push(p);
  });
  req.on("end", () => { if (!kesildi) cb(Buffer.concat(parcalar).toString("utf8")); });
  req.on("error", () => { /* kopan istek — yanit gonderilemez */ });
}

// D-3 Kapi 3 (dar-dene dalga 2/3; K-0055 uyumlu): atama defterleri — cift-kayit MD+JSON, append-only, fsync'li.
// AKTOR SUNUCU TARAFINDAN sabit "insan:web" — istemciden aktor alani KABUL EDILMEZ (KA-5; spoof edilemez).
function defterEkle(yol, satir) {
  mkdirSync(ATAMA_DIR, { recursive: true });
  const fd = openSync(yol, "a"); // append-only: eski satir bozulmaz
  try { appendFileSync(fd, satir); fsyncSync(fd); } finally { closeSync(fd); }
}

// KA-6: gorevin tarihce en yeni kaydi — taslak + onayli IKI defterden TARIH ile sec (yoksa null).
function sonKayit(gorevId) {
  const adaylar = [];
  for (const ad of ["taslaklar.jsonl", "onayli.jsonl"]) {
    for (const k of atamaOku(join(ATAMA_DIR, ad)).kayitlar) if (k && k.gorevId === gorevId) adaylar.push(k); // null satir korumasi (ORDU-3 B-002)
  }
  if (adaylar.length === 0) return null;
  adaylar.sort((a, b) => Date.parse(b.tarih || "") - Date.parse(a.tarih || ""));
  return adaylar[0];
}

function repolariBul() {
  const bulunan = [];
  for (const kok of KOKLER) {
    let girdiler = [];
    try { girdiler = readdirSync(kok, { withFileTypes: true }); } catch { continue; }
    for (const g of girdiler) {
      if (!g.isDirectory()) continue;
      const tel = join(kok, g.name, ".verimlilik", "telemetri.jsonl");
      if (existsSync(tel)) bulunan.push({ ad: g.name, yol: join(kok, g.name) });
    }
  }
  return bulunan;
}

function repoOzeti(repo) {
  const tel = join(repo.yol, ".verimlilik", "telemetri.jsonl");
  let tur = 0, loop = 0, fg = 0, kabul = 0, ret = 0, karisiklik = 0, altAjan = 0;
  let inTok = 0, outTok = 0, cacheTok = 0, maliyet = 0;
  const modlar = {};
  for (const satir of readFileSync(tel, "utf8").split(/\r?\n/)) {
    if (!satir.trim()) continue;
    try {
      const k = JSON.parse(satir);
      if (k.tip === "tur") {
        tur++;
        inTok += k.inTok ?? 0; outTok += k.outTok ?? 0; cacheTok += k.cacheTok ?? 0;
        maliyet += k.maliyetUsd ?? 0;
        if (k.altAjan) altAjan++;
        if (k.mod) modlar[k.mod] = (modlar[k.mod] ?? 0) + 1;
      }
      if (k.loopDurtme) loop++;
      if (k.finishGateDurtme) fg++;
      if (k.tip === "kabul") { if (k.kabul) kabul++; else ret++; }
      if (k.tip === "karisiklik") karisiklik++;
    } catch { /* bozuk satir atlanir */ }
  }
  const toplam = kabul + ret;
  let sonDamga = null;
  const pano = join(repo.yol, "STATE_BOARD.md");
  if (existsSync(pano)) sonDamga = sonDamgaSatiri(readFileSync(pano, "utf8").split(/\r?\n/)); // basliktan ONCEKI son tarihli damga (arsiv degil)
  return {
    ad: repo.ad, tur, kabulOrani: toplam > 0 ? Math.round((kabul / toplam) * 1000) / 10 : null,
    loop, finishGate: fg, karisiklik, altAjan, inTok, outTok, cacheTok,
    maliyetUsd: Math.round(maliyet * 10000) / 10000, modlar, sonDamga,
  };
}

function veriGetir(repoAd) {
  const repo = repolariBul().find((r) => r.ad === repoAd);
  if (!repo) return null;
  const c = onbellek.get(repoAd);
  if (c && Date.now() - c.ts < TTL_MS) return c.veri;
  const veri = { schemaSurum: 1, uretim: new Date().toISOString(), ttlSn: TTL_MS / 1000, ...repoOzeti(repo) };
  onbellek.set(repoAd, { ts: Date.now(), veri });
  return veri;
}

function jsonYaz(res, kod, obj) {
  const govde = JSON.stringify(obj);
  res.writeHead(kod, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(govde);
}

// D-1b: KT-08 8-eksen kapsul karti (graf SSOT'tan uretilir; deadline alani SSOT'ta YOK — uydurulmaz, durust "—")
function kartIcerik(g, gorev) {
  const varsayilan = (g.ajanKadrosu && g.ajanKadrosu.varsayilan) || {};
  const kadro = (gorev.ajanlar && gorev.ajanlar.length)
    ? gorev.ajanlar.map((a) => a.rol + " · " + a.model).join(" | ")
    : Object.entries(varsayilan).map(([r, k]) => r + " · " + k.model).join(" | ");
  const butce = (gorev.loc ?? 0) + " kod" + (gorev.testLoc ? " + " + gorev.testLoc + " test" : "") +
    (gorev.locAralik ? " (aralik " + gorev.locAralik + ")" : "");
  const satirlar = [
    ["ID", gorev.id], ["Görev (hedef)", gorev.gorev], ["Rol", gorev.rol || "—"], ["Durum", gorev.durum || "—"],
    ["Dizin", gorev.dizin || "—"], ["Ölçüt", gorev.olcut || "—"], ["Bütçe (LOC)", butce],
    ["Deadline", gorev.deadline || "— (graf SSOT'ta görev-başı deadline alanı YOK — uydurulmaz)"],
    ["Bağımlılık", (gorev.bagimli || []).join(", ") || "—"], ["Kapı", gorev.kapi || "—"],
    ["Ajan kadrosu", kadro || "—"],
  ];
  let md = "# " + gorev.id + " — " + gorev.gorev + "\n\n" +
    "> Kapsül kartı (KT-08 8-eksen). Üretim: " + new Date().toISOString() +
    " · kaynak: `pano/server.js POST /api/kart` (graf SSOT diskten) · **MEVCUT MD EZİLMEZ** (kart yoksa doğar; varsa 409)\n\n" +
    "| Eksen | Değer |\n|---|---|\n";
  for (const [k, v] of satirlar) md += "| " + k + " | " + String(v).replace(/\|/g, "\\|") + " |\n";
  if (gorev.not) md += "\nNot: " + gorev.not + "\n";
  md += "\n## Bağlantı\n- graf SSOT (makine; çelişkide JSON kazanır): `plans/gorev-grafigi-2026-10-26.json`\n" +
    "- insan-okur ikiz: `plans/GOREV-GRAFIGI-SENERARYO-2026-10-26.md`\n" +
    "- bu kart tuvalden doğdu: `pano/kapsul-tuval.html` → POST /api/kart (token kapısı)\n";
  return md;
}

const IZINLI_EMIRLER = new Set(["not-dus"]); // prototip dar-listesi: yalniz not

const sunucu = http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(readFileSync(join(import.meta.dirname, "iskelet.html"), "utf8"));
    return;
  }
  // D-1a: kapsul-tuval uretim yuzu (kapsul-tuval.html) + gorev-grafigi makine SSOT'u (salt-okur)
  if (req.method === "GET" && url.pathname === "/tuval") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(readFileSync(join(import.meta.dirname, "kapsul-tuval.html"), "utf8"));
    return;
  }
  // ORDU KOMUTA PANELI (2026-11-01): salt-okur komuta yuzu. HTML statik; veriyi /api/ordu/* uclarindan ceker.
  if (req.method === "GET" && url.pathname === "/ordu") {
    if (!existsSync(ORDU_HTML)) { jsonYaz(res, 404, { hata: "ordu-panosu.html yok: " + ORDU_HTML + " (fail-closed)" }); return; }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(readFileSync(ORDU_HTML, "utf8"));
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/graf") {
    if (!existsSync(GRAF_JSON)) { jsonYaz(res, 404, { hata: "graf SSOT yok: " + GRAF_JSON + " (fail-closed)" }); return; }
    try {
      const g = JSON.parse(readFileSync(GRAF_JSON, "utf8")); // her istekte diskten — bayat onbellek yok
      jsonYaz(res, 200, g);
    } catch (e) { jsonYaz(res, 500, { hata: "graf JSON bozuk: " + (e instanceof Error ? e.message : "bilinmeyen") }); }
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/repolar") {
    jsonYaz(res, 200, { schemaSurum: 1, repolar: repolariBul().map((r) => r.ad) });
    return;
  }
  // D-1b: kapsul kartlari — GET salt-okur; POST TEK yazici ucu (PANO_TOKEN fail-closed; MEVCUT MD EZILMEZ)
  if (req.method === "GET" && url.pathname === "/api/kart") {
    const id = url.searchParams.get("id") ?? "";
    if (!/^[A-Za-z0-9._-]+$/.test(id)) { jsonYaz(res, 400, { hata: "gecersiz id (izinli: harf/rakam/._-)" }); return; }
    const yol = join(KAPSUL_DIR, id + ".md");
    if (!existsSync(yol)) { jsonYaz(res, 404, { hata: "kart yok: " + yol }); return; }
    jsonYaz(res, 200, { id, yol, icerik: readFileSync(yol, "utf8") });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/kart") {
    if (!TOKEN) { jsonYaz(res, 403, { hata: "PANO_TOKEN tanimli degil — kart yazma kapali (fail-closed)" }); return; }
    if (!tokenGecerliMi(req.headers["x-pano-token"])) { jsonYaz(res, 401, { hata: "token gecersiz" }); return; }
    govdeTopla(req, (govde) => {
      let id = null;
      try { const v = JSON.parse(govde); id = String((v && v.id) ?? ""); } catch { jsonYaz(res, 400, { hata: "gecersiz json" }); return; } // null govde korumasi (ORDU-3 B-001 sinifi)
      if (!/^[A-Za-z0-9._-]+$/.test(id)) { jsonYaz(res, 422, { hata: "gecersiz id (izinli: harf/rakam/._-; yol kacamasi RED)" }); return; }
      if (!existsSync(GRAF_JSON)) { jsonYaz(res, 404, { hata: "graf SSOT yok — kart uretilmez (fail-closed): " + GRAF_JSON }); return; }
      let g = null;
      try { g = JSON.parse(readFileSync(GRAF_JSON, "utf8")); } catch { jsonYaz(res, 500, { hata: "graf JSON bozuk — kart uretilmez (fail-closed)" }); return; }
      const gorev = g.gorevler.find((x) => x.id === id);
      if (!gorev) { jsonYaz(res, 404, { hata: "graf SSOT'ta boyle bir gorev yok: " + id }); return; }
      const yol = join(KAPSUL_DIR, id + ".md");
      if (existsSync(yol)) { jsonYaz(res, 409, { hata: "kart ZATEN VAR — mevcut MD ezilmez (yazar kaydi: ilk uretim)", yol }); return; }
      // GD-005: senkron yazma zinciri (mkdir+open+write+fsync+rename) yakalanir -> 500 (surec
      // crash ETMEZ); kalan tmp dosyasi temizlenir (d1b 'tmp kalintisi yok' pini korunur).
      const tmp = yol + ".tmp-" + Date.now(); // tmp + fsync + rename: kismi yazis gorunmez (A2-10 kalibi)
      try {
        mkdirSync(KAPSUL_DIR, { recursive: true });
        const fd = openSync(tmp, "w");
        try { writeSync(fd, kartIcerik(g, gorev), "utf8"); fsyncSync(fd); } finally { closeSync(fd); }
        renameSync(tmp, yol);
      } catch (e) {
        try { if (existsSync(tmp)) rmSync(tmp); } catch { /* tmp zaten yok/kaldirildi */ }
        jsonYaz(res, 500, { hata: "kart yazilamadi (tmp temizlendi — surec ayakta): " + (e instanceof Error ? e.message : "bilinmeyen") });
        return;
      }
      jsonYaz(res, 201, { ok: true, id, yol, eksen: 8, yazar: "pano/server.js POST /api/kart" });
    });
    return;
  }
  // D-3 Kapi 3 (dar-dene dalga 2/3): atama uclari — taslak ACMA insan kapisi; aktor sunucu tarafinda sabit.
  // K-0055: cift-kayit (jsonl + md ayni is), write-set YALNIZ ATAMA_DIR 4 dosya; graf SSOT salt-okunur.
  if (req.method === "POST" && url.pathname === "/api/atama/taslak") {
    if (!TOKEN) { jsonYaz(res, 403, { hata: "PANO_TOKEN tanimli degil — atama yazma kapali (fail-closed)" }); return; }
    if (!tokenGecerliMi(req.headers["x-pano-token"])) { jsonYaz(res, 401, { hata: "token gecersiz" }); return; }
    govdeTopla(req, (govde) => {
      let istek = null;
      try { istek = JSON.parse(govde); } catch { jsonYaz(res, 400, { hata: "gecersiz json" }); return; }
      if (!istek || typeof istek !== "object") { jsonYaz(res, 400, { hata: "govde nesne degil (null/dizi RED)" }); return; } // O3 B-001
      const gorevId = typeof istek.gorevId === "string" ? istek.gorevId.trim() : "";
      const ajanId = typeof istek.ajanId === "string" ? istek.ajanId.trim() : "";
      if (!gorevId || !ajanId) { jsonYaz(res, 422, { hata: "gorevId ve ajanId zorunlu (bos/eksik RED)" }); return; }
      if (!existsSync(GRAF_JSON)) { jsonYaz(res, 404, { hata: "graf SSOT yok — atama uretilmez (fail-closed): " + GRAF_JSON }); return; }
      let g = null;
      try { g = JSON.parse(readFileSync(GRAF_JSON, "utf8")); } catch { jsonYaz(res, 500, { hata: "graf JSON bozuk — atama uretilmez (fail-closed)" }); return; }
      if (!Array.isArray(g.gorevler) || !g.gorevler.some((x) => x.id === gorevId)) { jsonYaz(res, 404, { hata: "graf SSOT'ta boyle bir gorev yok: " + gorevId }); return; }
      const onceki = sonKayit(gorevId); // KA-6: surum zinciri iki defterin tarihce en yenisinden
      let taslak = null;
      try {
        taslak = atamaTaslakla(gorevId, ajanId, onceki, "insan:web", new Date().toISOString());
      } catch (e) { jsonYaz(res, 500, { hata: "atamaTaslakla RED: " + (e instanceof Error ? e.message : "bilinmeyen") }); return; }
      // GD-005: cift-kayit (jsonl + md) yazimi yakalanir -> 500 — surec crash ETMEZ; kismi
      // kalmis kayit durumunda hata mesaji acik soyler (E10).
      try {
        defterEkle(join(ATAMA_DIR, "taslaklar.jsonl"), JSON.stringify(taslak) + "\n");
        defterEkle(join(ATAMA_DIR, "taslaklar.md"), "| " + taslak.tarih + " | " + taslak.gorevId + " | " + taslak.ajanId + " | surum " + taslak.surum + " | TASLAK |\n");
      } catch (e) {
        jsonYaz(res, 500, { hata: "taslak defterine yazilamadi (cift-kayit jsonl+md birligi bozulmus olabilir — durust bildirim): " + (e instanceof Error ? e.message : "bilinmeyen") });
        return;
      }
      jsonYaz(res, 201, { ok: true, taslak });
    });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/atama/onay") {
    if (!TOKEN) { jsonYaz(res, 403, { hata: "PANO_TOKEN tanimli degil — atama yazma kapali (fail-closed)" }); return; }
    if (!tokenGecerliMi(req.headers["x-pano-token"])) { jsonYaz(res, 401, { hata: "token gecersiz" }); return; }
    govdeTopla(req, (govde) => {
      let istek = null;
      try { istek = JSON.parse(govde); } catch { jsonYaz(res, 400, { hata: "gecersiz json" }); return; }
      if (!istek || typeof istek !== "object") { jsonYaz(res, 400, { hata: "govde nesne degil (null/dizi RED)" }); return; } // O3 B-001
      const gorevId = typeof istek.gorevId === "string" ? istek.gorevId.trim() : "";
      if (!gorevId) { jsonYaz(res, 422, { hata: "gorevId zorunlu (bos/eksik RED)" }); return; }
      const { kayitlar } = atamaOku(join(ATAMA_DIR, "taslaklar.jsonl")); // bozuk satir atlanir + sayilir (cekirdek)
      const taslak = [...kayitlar].reverse().find((k) => k && k.gorevId === gorevId && k.onay === "TASLAK"); // null kayit korumasi (O3 B-002)
      if (!taslak) { jsonYaz(res, 404, { hata: "onaylanacak TASLAK yok (taslaklar.jsonl): " + gorevId }); return; }
      let onayli = null;
      try { onayli = onayla(taslak, "insan:web"); } catch (e) { jsonYaz(res, 500, { hata: "onayla RED: " + (e instanceof Error ? e.message : "bilinmeyen") }); return; }
      let sonuc = null;
      try { sonuc = atamaYaz(onayli, join(ATAMA_DIR, "onayli.jsonl")); } // idempotans: mevcut:true hata DEGIL
      catch (e) { jsonYaz(res, 500, { hata: "atamaYaz RED (defter kaydi gecersiz): " + (e instanceof Error ? e.message : "bilinmeyen") }); return; }
      if (sonuc.yazildi) { // md aynasi yalniz gercek yazimda — jsonl ile satir sayisi senkron (cift-kayit)
        // GD-005: md aynasi yazilamazsa jsonl kaydi VARDIR (onayli) ama ayna eksik — 500 ile
        // durust bildirilir (cift-kayit acigi gizlenmez — E10); surec crash ETMEZ.
        try {
          defterEkle(join(ATAMA_DIR, "onayli.md"), "| " + onayli.tarih + " | " + onayli.gorevId + " | " + onayli.ajanId + " | surum " + onayli.surum + " | ONAYLI |\n");
        } catch (e) {
          jsonYaz(res, 500, { hata: "onayli JSONL yazildi ama MD aynasi yazilamadi (cift-kayit acik kaldi — durust bildirim): " + (e instanceof Error ? e.message : "bilinmeyen") });
          return;
        }
      }
      jsonYaz(res, 201, { ok: true, kayit: onayli, yazildi: sonuc.yazildi, mevcut: sonuc.mevcut, toplam: sonuc.toplam });
    });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/atama/durum") {
    const { harita, bozuk } = atamaDurum(join(ATAMA_DIR, "onayli.jsonl"));
    jsonYaz(res, 200, { harita, bozuk });
    return;
  }
  // ORDU KOMUTA PANELI uclari (2026-11-01): 4 SALT-OKUR uclar — EKLEME, mevcut uclar AYNEN.
  // Yazma ucu YOK (token kapisi gerekmez); her istekte diskten okunur (bayat onbellek yok);
  // hata halinde 500 json + surec ayakta kalir (fail-closed, GD-005 deseni).
  if (req.method === "GET" && url.pathname === "/api/ordu/genel") {
    try {
      const kira = kiraDurum(kiraYoluCoz());
      const defter = defterOzet(DEFTER_429);
      const sorun = existsSync(SORUN_OZET) ? sorunBirlesim(JSON.parse(readFileSync(SORUN_OZET, "utf8"))) : null;
      const graf = existsSync(GRAF_JSON) ? grafSayim(JSON.parse(readFileSync(GRAF_JSON, "utf8"))) : null;
      const son429Ms = defter.sonKayit && typeof defter.sonKayit.damgaISO === "string" ? Date.parse(defter.sonKayit.damgaISO) : null;
      let sonDamga = null;
      try {
        const orduRepo = repolariBul().find((r) => r.ad === "ordu");
        if (orduRepo) sonDamga = repoOzeti(orduRepo).sonDamga ?? null; // telemetry.jsonl yoksa repolariBul listeye koymaz -> null (durus)
      } catch { /* sonDamga salt bilgidir; bozuksa null ile gosterilir */ }
      jsonYaz(res, 200, {
        olcumAniISO: new Date().toISOString(), // OLCUM ANI etiketi: snapshot'i canli gosterme kurali
        sonDamga,
        aktifIs: aktifIsOku(STATE_MD).aktifIs,
        kira,
        defter,
        gitHead: gitHeadOku(ORDU_KOK),
        sorun,
        grafSayim: graf,
        saglikIsigi: genelSaglikIsigi({ kiraEtiketi: kiraEtiketi(kira), fren: sorun ? sorun.frenSayilari : null, son429Ms, simdiMs: Date.now() }),
      });
    } catch (e) { jsonYaz(res, 500, { hata: "ordu genel okunamadi: " + (e instanceof Error ? e.message : "bilinmeyen") }); }
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/ordu/kadro") {
    if (!existsSync(KADRO_JSON)) { jsonYaz(res, 404, { hata: "kadro SSOT yok: " + KADRO_JSON + " (fail-closed)" }); return; }
    try {
      jsonYaz(res, 200, { olcumAniISO: new Date().toISOString(), ...kadroBirlesim(JSON.parse(readFileSync(KADRO_JSON, "utf8")), kiraDurum(kiraYoluCoz())) });
    } catch (e) { jsonYaz(res, 500, { hata: "kadro birlesim hatasi: " + (e instanceof Error ? e.message : "bilinmeyen") }); }
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/ordu/akis") {
    try {
      jsonYaz(res, 200, { olcumAniISO: new Date().toISOString(), ...akisTopla({ handoffDir: HANDOFF_DIR, kiraYolu: kiraYoluCoz(), defterYolu: DEFTER_429, logOkuFn: logOku }) });
    } catch (e) { jsonYaz(res, 500, { hata: "akis okunamadi: " + (e instanceof Error ? e.message : "bilinmeyen") }); }
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/ordu/saglik") {
    if (!existsSync(SORUN_OZET)) { jsonYaz(res, 404, { hata: "sorun envanteri yok: " + SORUN_OZET + " (fail-closed)" }); return; }
    try {
      const kira = kiraDurum(kiraYoluCoz());
      jsonYaz(res, 200, { olcumAniISO: new Date().toISOString(), ...saglikBirlesim(JSON.parse(readFileSync(SORUN_OZET, "utf8")), { defterToplam: defterOzet(DEFTER_429).toplam, kiraEtiketi: kiraEtiketi(kira) }) });
    } catch (e) { jsonYaz(res, 500, { hata: "saglik okunamadi: " + (e instanceof Error ? e.message : "bilinmeyen") }); }
    return;
  }
  // BOLUM 6 (LOG spec eki): birlesik detay kayitlari — kira-log + 429-defter + handoff dogumlari
  // + deney defteri. SALT-OKUR (panel diske log YAZMAZ); saat filtresi server-side; tavan son 200.
  if (req.method === "GET" && url.pathname === "/api/ordu/log") {
    const saatHam = url.searchParams.get("saat");
    let saat = null;
    if (saatHam !== null) {
      if (!["1", "6", "24", "168"].includes(saatHam)) { jsonYaz(res, 422, { hata: "gecersiz saat filtresi (izinli: 1|6|24|168)", alinan: saatHam }); return; }
      saat = Number(saatHam);
    }
    try {
      // ajan eslemesi: kadro ajanId'leri (olculmus) + deney ajanlar.json (snapshot etiketli)
      let esleme = new Map();
      try {
        const kadro = existsSync(KADRO_JSON) ? JSON.parse(readFileSync(KADRO_JSON, "utf8")) : null;
        const deney = existsSync(DENAY_AJANLAR) ? JSON.parse(readFileSync(DENAY_AJANLAR, "utf8")) : null;
        esleme = ajanEslemeKur(kadro, deney);
      } catch { /* esleme tuzugu: kayitlar ajanId'siz durust gosterilir */ }
      jsonYaz(res, 200, {
        olcumAniISO: new Date().toISOString(),
        pencereSaat: saat,
        ...logBirlesik({ kiraLogYolu: KIRA_LOG, defterYolu: DEFTER_429, handoffDir: HANDOFF_DIR, deneyLogYolu: DENAY_LOG, esleme, saat, tavan: LOG_TAVAN }),
        appendOnlyNotu: "kanıt defterleri append-only'dir; panel yalnız pencere gösterir (diske log YAZMAZ, silme YAPMAZ)",
      });
    } catch (e) { jsonYaz(res, 500, { hata: "ordu log okunamadi: " + (e instanceof Error ? e.message : "bilinmeyen") }); }
    return;
  }
  // STEERING-7: Paseo projeleri — agents/<dizin>/<agentId>.json taramasi. SALT-OKUR, HER ISTEGTE
  // diskten (bayat onbellek YOK). systemPrompt YANITA GIRMEZ (yalniz sayim alanlari cikar);
  // bozuk JSON atlanir + sayilir. Ajan kaydi olmayan dizin gorunmez (daemon kayit defteri diskte kapali).
  if (req.method === "GET" && url.pathname === "/api/ordu/projeler") {
    try {
      const { projeler, atlanan } = projelerTara(PASEO_EV, { orduDizinAdi: ORDU_DIZIN_ADI });
      jsonYaz(res, 200, {
        olcumAniISO: new Date().toISOString(), // OLCUM ANI etiketi: tarama anindan kanit
        projeler,
        atlanan,
        kapsamNotu: "ajanı hiç doğmamış workspace bu kaynakta GÖRÜNMEZ (daemon kayıt defteri diskte kapalı) — liste yalnız en az bir ajan kaydı taşıyan dizinleri gösterir",
      });
    } catch (e) { jsonYaz(res, 500, { hata: "paseo projeler okunamadi: " + (e instanceof Error ? e.message : "bilinmeyen") }); }
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/veri") {
    const veri = veriGetir(url.searchParams.get("repo") ?? "");
    if (!veri) { jsonYaz(res, 404, { hata: "repo yok veya telemetrisiz" }); return; }
    jsonYaz(res, 200, veri);
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/canli") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive" });
    res.write("retry: 5000\n\n");
    const hb = setInterval(() => res.write(": nabiz " + Date.now() + "\n\n"), 15_000);
    sseIstemci.add(res);
    req.on("close", () => { clearInterval(hb); sseIstemci.delete(res); });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/emir") {
    if (!TOKEN) { jsonYaz(res, 403, { hata: "PANO_TOKEN tanimli degil — yazma kapali (fail-closed)" }); return; }
    if (!tokenGecerliMi(req.headers["x-pano-token"])) { jsonYaz(res, 401, { hata: "token gecersiz" }); return; }
    govdeTopla(req, (govde) => {
      try {
        const emir = JSON.parse(govde);
        if (!emir || typeof emir !== "object" || !IZINLI_EMIRLER.has(emir.eylem)) { jsonYaz(res, 422, { hata: "dar-liste disi eylem", izinli: [...IZINLI_EMIRLER] }); return; } // null govde korumasi (O3 B-001 sinifi)
        console.log("[pano] emir:", emir.eylem, emir.metin ?? "");
        jsonYaz(res, 202, { ok: true });
      } catch { jsonYaz(res, 400, { hata: "gecersiz json" }); }
    });
    return;
  }
  jsonYaz(res, 404, { hata: "bulunamadi" });
});

sunucu.listen(PORT, "127.0.0.1", () => {
  console.log("paseo-pano: http://127.0.0.1:" + sunucu.address().port + " (yalniz yerel, TTL " + TTL_MS / 1000 + "sn, token " + (TOKEN ? "VAR" : "YOK-fail-closed") + ", graf " + (existsSync(GRAF_JSON) ? "VAR" : "YOK-fail-closed") + ")");
});
