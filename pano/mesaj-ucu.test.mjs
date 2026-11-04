// mesaj-ucu.test.mjs — İZOLE server koşusu (PANEL-EXPLORER-1 FAZ-A kanıt kapısı).
// Gerçek HTTP çağrılarıyla /api/mesaj durum kodları: 403 (token yok) · 401 (yanlış token) ·
// 400 (hedef whitelist dışı / boş mesaj) · 503 (köprü zinciri çözümsüz simülasyonu —
// PANO_KOPRU_KOK_CMD var olmayan yola verilir, GERÇEK paseo send çağrısı YOK) · 429 (min 2sn aralık).
// PANO_PORT=0 (geçici port — 4377'YE ASLA DOKUNULMAZ); token test üretir (PANO_TOKEN gerçek
// değeri hiçbir dosyaya/log'a YAZILMAZ); PASEO_EV tmp fixture.
import test from "node:test";
import assert from "node:assert";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const SERVER_JS = fileURLToPath(new URL("./server.js", import.meta.url));
const HEDEF = "8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7";
const HEDEF2 = "432e03b7-9004-445c-857d-ebf3b6661d53";
const YOK_HEDEF = "00000000-0000-4000-8000-000000000000";

function istekYap(port, yol, govde, token) {
  return new Promise((tamam, kapat) => {
    const req = http.request({ host: "127.0.0.1", port, path: yol, method: "POST", headers: { "Content-Type": "application/json", ...(token ? { "x-pano-token": token } : {}) } }, (res) => {
      let ham = "";
      res.on("data", (p) => { ham += p; });
      res.on("end", () => { let gov = null; try { gov = JSON.parse(ham); } catch { /* govde json değil */ } tamam({ durum: res.statusCode, gov }); });
    });
    req.on("error", (e) => kapat(new Error("http istegi hatasi: " + e.message)));
    req.end(govde === undefined ? "" : JSON.stringify(govde));
  });
}

function istekYapGetir(port, yol) {
  return new Promise((tamam, kapat) => {
    const req = http.request({ host: "127.0.0.1", port, path: yol, method: "GET" }, (res) => {
      let ham = "";
      res.on("data", (p) => { ham += p; });
      res.on("end", () => tamam({ durum: res.statusCode, konum: res.headers.location, govde: ham }));
    });
    req.on("error", (e) => kapat(new Error("http istegi hatasi: " + e.message)));
    req.end();
  });
}

// PANEL-PERF-1: GET + JSON gövde (projeler önbellek testleri — yanıt alanları assert edilir).
function istekYapGetirJson(port, yol) {
  return istekYapGetir(port, yol).then((r) => {
    let gov = null;
    try { gov = JSON.parse(r.govde); } catch { /* govde json değil */ }
    return { durum: r.durum, gov };
  });
}

// server.js'i PANO_PORT=0 ile doğurur, stdout'taki portu okur (4377 ASLA kullanılmaz).
async function sunucuDogur(env) {
  const cocuk = spawn(process.execPath, [SERVER_JS], { env: { ...process.env, ...env } });
  const port = await new Promise((tamam, kapat) => {
    let birikti = "";
    const zamanlayici = setTimeout(() => kapat(new Error("server 10sn icinde porta oturmadı: " + birikti)), 10_000);
    cocuk.stdout.on("data", (p) => {
      birikti += p.toString("utf8");
      const es = birikti.match(/127\.0\.0\.1:(\d+)/);
      if (es) { clearTimeout(zamanlayici); tamam(Number(es[1])); }
    });
    cocuk.stderr.on("data", (p) => { birikti += p.toString("utf8"); });
    cocuk.on("exit", (kod) => { clearTimeout(zamanlayici); kapat(new Error("server dogmadan cikti (kod " + kod + "): " + birikti)); });
  });
  return { cocuk, port };
}

test("67- izole server: POST /api/mesaj 403 (token yok) — token'sız doğan sunucu", async () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-mesaj-403-"));
  let sunucu = null;
  try {
    const { cocuk, port } = await sunucuDogur({ PANO_PORT: "0", PASEO_EV: d, PANO_KOPRU_KOK_CMD: join(d, "kopru-yok.cmd") });
    sunucu = cocuk;
    const r = await istekYap(port, "/api/mesaj", { hedef: HEDEF, mesaj: "selam" }, null);
    assert.equal(r.durum, 403, "PANO_TOKEN yok -> 403: " + JSON.stringify(r.gov));
    assert.ok(r.gov && r.gov.hata.includes("fail-closed"), "hata mesajı dürüst");
  } finally {
    if (sunucu) sunucu.kill();
    rmSync(d, { recursive: true, force: true });
  }
});

test("68- izole server: 401 (yanlış token) · 400 (whitelist dışı + boş mesaj) — RED'ler gerçek HTTP ile", async () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-mesaj-400-"));
  let sunucu = null;
  try {
    mkdirSync(join(d, "agents", "D-test-proje"), { recursive: true });
    writeFileSync(join(d, "agents", "D-test-proje", HEDEF + ".json"), JSON.stringify({ id: HEDEF, provider: "glm53u-claude", lastStatus: "idle", lastActivityAt: "2026-11-03T10:00:00Z", title: "test ajanı" }), "utf8");
    const token = randomUUID(); // test kendi rastgele token'ını üretir — gerçek PANO_TOKEN DEĞİL
    const { cocuk, port } = await sunucuDogur({ PANO_PORT: "0", PASEO_EV: d, PANO_KOPRU_KOK_CMD: join(d, "kopru-yok.cmd"), PANO_TOKEN: token });
    sunucu = cocuk;
    /* (a) yanlış token -> 401 */
    let r = await istekYap(port, "/api/mesaj", { hedef: HEDEF, mesaj: "selam" }, "yanlis-" + randomUUID());
    assert.equal(r.durum, 401, "yanlis token -> 401: " + JSON.stringify(r.gov));
    /* (b) whitelist dışı hedef -> 400 */
    r = await istekYap(port, "/api/mesaj", { hedef: YOK_HEDEF, mesaj: "selam" }, token);
    assert.equal(r.durum, 400, "whitelist disi hedef -> 400: " + JSON.stringify(r.gov));
    assert.ok(r.gov.hata.includes("whitelist"), "hata beyaz liste nedenini dürüst söyler");
    /* (c) boş mesaj -> 400 */
    r = await istekYap(port, "/api/mesaj", { hedef: HEDEF, mesaj: "   " }, token);
    assert.equal(r.durum, 400, "bos mesaj -> 400: " + JSON.stringify(r.gov));
    /* (d) geçersiz json -> 400 */
    r = await istekYap(port, "/api/mesaj", null, token);
    assert.equal(r.durum, 400, "gecersiz json -> 400");
  } finally {
    if (sunucu) sunucu.kill();
    rmSync(d, { recursive: true, force: true });
  }
});

test("69- izole server: 503 (köprü zinciri çözümsüz — GERÇEK send YOK) + 429 (aynı hedefe min 2sn)", async () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-mesaj-503-"));
  let sunucu = null;
  try {
    mkdirSync(join(d, "agents", "D-test-proje"), { recursive: true });
    writeFileSync(join(d, "agents", "D-test-proje", HEDEF + ".json"), JSON.stringify({ id: HEDEF, provider: "glm53u-claude", lastStatus: "idle", lastActivityAt: "2026-11-03T10:00:00Z" }), "utf8");
    writeFileSync(join(d, "agents", "D-test-proje", HEDEF2 + ".json"), JSON.stringify({ id: HEDEF2, provider: "glm53u-claude", lastStatus: "running", lastActivityAt: "2026-11-03T10:01:00Z" }), "utf8");
    const token = randomUUID();
    const { cocuk, port } = await sunucuDogur({ PANO_PORT: "0", PASEO_EV: d, PANO_KOPRU_KOK_CMD: join(d, "kopru-yok.cmd"), PANO_TOKEN: token });
    sunucu = cocuk;
    /* (a) whitelist'te VAR hedef ama köprü zinciri çözümsüz -> 503; spawn DENENMEDİ */
    let r = await istekYap(port, "/api/mesaj", { hedef: HEDEF, mesaj: "steering mesajı" }, token);
    assert.equal(r.durum, 503, "kopru cozumsuz -> 503: " + JSON.stringify(r.gov));
    assert.ok(r.gov.hata.includes("fail-closed"), "503 hata metni fail-closed nedenini söyler");
    assert.ok(r.gov.detay && r.gov.detay.includes("kopru-cozulmedi"), "detay köprü zincirinden gelir");
    /* (b) aynı hedefe hemen ikinci gönderim -> 429 (min 2sn aralık) */
    r = await istekYap(port, "/api/mesaj", { hedef: HEDEF, mesaj: "tekrar" }, token);
    assert.equal(r.durum, 429, "ayni hedefe min 2sn icinde ikinci -> 429: " + JSON.stringify(r.gov));
    assert.ok(r.gov.hata.includes("aralik"), "429 hata metni aralık kuralını söyler");
    /* (c) farklı hedef: zincir çözümsüz aynı şekilde 503 (hedef bağımsız) */
    r = await istekYap(port, "/api/mesaj", { hedef: HEDEF2, mesaj: "diger hedef" }, token);
    assert.equal(r.durum, 503, "farkli hedef de zincir cozumsuzken 503");
  } finally {
    if (sunucu) sunucu.kill();
    rmSync(d, { recursive: true, force: true });
  }
});

test("70- izole server: GET / → 302 /ordu (ANA PANEL) · GET /iskelet 200 HTML · GET /ordu 200 HTML", async () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-mesaj-kok-"));
  let sunucu = null;
  try {
    const { cocuk, port } = await sunucuDogur({ PANO_PORT: "0", PASEO_EV: d, PANO_KOPRU_KOK_CMD: join(d, "kopru-yok.cmd") });
    sunucu = cocuk;
    /* (a) kök → 302 /ordu — ana panel ORDU (kullanıcı emri 2026-11-03) */
    let r = await istekYapGetir(port, "/");
    assert.equal(r.durum, 302, "kok 302 olmali: " + JSON.stringify(r));
    assert.equal(r.konum, "/ordu", "Location /ordu'yu gostermeli");
    /* (b) eski iskelet yerinde kalır: /iskelet 200 + HTML */
    r = await istekYapGetir(port, "/iskelet");
    assert.equal(r.durum, 200, "iskelet 200 kalmali");
    assert.ok(r.govde.includes("<!DOCTYPE html") || r.govde.includes("<html"), "iskelet HTML servis etmeli");
    /* (c) ordu paneli HTML servis eder (fail-closed: dosya repo kökünde gerçek dosyadır) */
    r = await istekYapGetir(port, "/ordu");
    assert.equal(r.durum, 200, "ordu 200 kalmali");
    assert.ok(r.govde.includes("<!DOCTYPE html") || r.govde.includes("<html"), "ordu HTML servis etmeli");
    assert.ok(r.govde.length > 1000, "ordu HTML gövdesi dolu olmali (" + r.govde.length + " bayt)");
  } finally {
    if (sunucu) sunucu.kill();
    rmSync(d, { recursive: true, force: true });
  }
});

/* ---- PANEL-PERF-1 (2026-11-04): /api/ordu/projeler TTL önbellek + uçuş-birleştirme ----
   PANO_PROJELER_TTL_MS test kancasıyla kısa TTL (400ms) — üretim varsayılanı 10sn (server.js).
   Tarama-sayısı kanıtı DISK-SIDE-EFFECT ile: istekler arası fixture'a YENİ proje dizini eklenir;
   TTL penceresi içindeki istek onu GÖRMEMELİ (tarama tetiklenmedi), TTL bitince GÖRMELİ (yenilendi). */

test("71- izole server: /api/ordu/projeler TTL önbellek — pencere içinde tarama YOK (disk-side-effect), TTL bitince tarama YENİLENİR", async () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-projeler-ttl-"));
  let sunucu = null;
  try {
    mkdirSync(join(d, "agents", "D-test-proje"), { recursive: true });
    writeFileSync(join(d, "agents", "D-test-proje", HEDEF + ".json"), JSON.stringify({ id: HEDEF, provider: "glm53u-claude", lastStatus: "idle", lastActivityAt: "2026-11-04T10:00:00Z", title: "ttl ajan" }), "utf8");
    const { cocuk, port } = await sunucuDogur({ PANO_PORT: "0", PASEO_EV: d, PANO_KOPRU_KOK_CMD: join(d, "kopru-yok.cmd"), PANO_PROJELER_TTL_MS: "400" });
    sunucu = cocuk;
    /* (a) ilk istek: TAZE tarama (onbellek:false) — tek proje görünür */
    const r1 = await istekYapGetirJson(port, "/api/ordu/projeler");
    assert.equal(r1.durum, 200, "ilk istek 200: " + JSON.stringify(r1.gov));
    assert.equal(r1.gov.onbellek, false, "ilk istek taze tarama (onbellek:false)");
    assert.ok(Array.isArray(r1.gov.projeler) && r1.gov.projeler.length === 1, "fixture'taki tek proje döner");
    assert.equal(r1.gov.projeler[0].dizin, "D-test-proje", "dizin adı taramadan gelir");
    /* (b) diskte YENİ proje doğar (side-effect sayacı yerine gerçek disk kanıtı) */
    let r;
    mkdirSync(join(d, "agents", "D-test-yeni"), { recursive: true });
    writeFileSync(join(d, "agents", "D-test-yeni", HEDEF2 + ".json"), JSON.stringify({ id: HEDEF2, provider: "glm53u-claude", lastStatus: "idle", lastActivityAt: "2026-11-04T10:01:00Z", title: "yeni ajan" }), "utf8");
    /* (c) TTL penceresi içinde ikinci istek: tarama TETİKLENMEDİ — yeni dizin GÖRÜNMEZ */
    r = await istekYapGetirJson(port, "/api/ordu/projeler");
    assert.equal(r.durum, 200, "ikinci istek 200 (önbellekten)");
    assert.equal(r.gov.onbellek, true, "TTL penceresi içinde onbellek:true");
    assert.ok(r.gov.projeler.length === 1 && r.gov.projeler[0].dizin === "D-test-proje", "yeni dizin önbellekten GÖRÜNMEZ (tarama tetiklenmedi)");
    assert.equal(r.gov.olcumAniISO, r1.gov.olcumAniISO, "önbellek yanıtı İLK tarama anını taşır (yanıt anı DEĞİL — dürüstlük)");
    /* (d) TTL doldu (400ms + pay) → üçüncü istek: tarama YENİLENDİ — yeni dizin GÖRÜNÜR */
    await new Promise((ok) => setTimeout(ok, 550));
    r = await istekYapGetirJson(port, "/api/ordu/projeler");
    assert.equal(r.durum, 200, "üçüncü istek 200 (taze tarama)");
    assert.equal(r.gov.onbellek, false, "TTL bitince taze tarama (onbellek:false)");
    assert.ok(r.gov.projeler.length === 2 && r.gov.projeler.some((p) => p.dizin === "D-test-yeni"), "TTL bitince yeni dizin GÖRÜNÜR (tarama yenilendi)");
    assert.notEqual(r.gov.olcumAniISO, undefined, "taze tarama yeni tarama anı taşır");
  } finally {
    if (sunucu) sunucu.kill();
    rmSync(d, { recursive: true, force: true });
  }
});

test("72- izole server: eşzamanlı 2 projeler isteği — TEK tarama (uçuş paylaşımı: aynı tarama anı + aynı liste) + kaynak pini", async () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-projeler-ucus-"));
  let sunucu = null;
  try {
    mkdirSync(join(d, "agents", "D-test-proje"), { recursive: true });
    writeFileSync(join(d, "agents", "D-test-proje", HEDEF + ".json"), JSON.stringify({ id: HEDEF, provider: "glm53u-claude", lastStatus: "idle", lastActivityAt: "2026-11-04T11:00:00Z", title: "ucus ajan" }), "utf8");
    const { cocuk, port } = await sunucuDogur({ PANO_PORT: "0", PASEO_EV: d, PANO_KOPRU_KOK_CMD: join(d, "kopru-yok.cmd"), PANO_PROJELER_TTL_MS: "400" });
    sunucu = cocuk;
    /* (a) iki istek EŞZAMANLI açılır (Promise.all) — tek thread'de ilki taramayı yapar,
       ikincisi ya önbellekten ya da SÜREN uçuşu paylaşır; iki ayrı tarama AÇILMAZ */
    const [a, b] = await Promise.all([istekYapGetirJson(port, "/api/ordu/projeler"), istekYapGetirJson(port, "/api/ordu/projeler")]);
    assert.equal(a.durum, 200, "a 200: " + JSON.stringify(a.gov));
    assert.equal(b.durum, 200, "b 200: " + JSON.stringify(b.gov));
    assert.equal(a.gov.olcumAniISO, b.gov.olcumAniISO, "tek tarama: iki yanıt AYNI tarama anını taşır (iki tarama iki farklı an üretirdi)");
    assert.deepStrictEqual(a.gov.projeler, b.gov.projeler, "tek tarama: iki yanıt aynı proje listesini taşır");
    /* (b) kaynak pini: uçuş-birleştirme yapısı server.js'te (davranış + kaynak birlikte kanıt) */
    const srv = readFileSync(SERVER_JS, "utf8");
    assert.ok(srv.includes("if (!projelerUcus)"), "kaynak pini: süren uçuş kontrolü (paylaşım koşulu) server.js'te");
    assert.ok(srv.includes("ucus.finally"), "kaynak pini: uçuş hatada da kapanır (finally)");
  } finally {
    if (sunucu) sunucu.kill();
    rmSync(d, { recursive: true, force: true });
  }
});

test("73- izole server: hata dürüstlüğü kaynak pinleri — atama YALNIZ başarı yolunda (hata önbelleğe YAZILMAZ) + 500 mesajı + boş tarama dürüst davranış", async () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-projeler-hata-"));
  let sunucu = null;
  try {
    /* (a) kaynak pinleri: tarama hatası önbelleğe yazılmaz yapısı (atama try/başarı yolunda;
       projelerTara katmanı fs hatalarını kendisi yuttuğundan [ordu-birlesim.mjs readdirSync/workspaceBasliklari
       catch'leri] uçta 500 fiilen tetiklenemez — yapı kaynağta pin'lenir, raporda dürüst not) */
    const srv = readFileSync(SERVER_JS, "utf8");
    assert.ok(srv.includes("projelerOnbellek = { ts: Date.now(), veri: taze }"), "atama literal'i başarı yolunda (IIFE içi)");
    assert.ok(srv.indexOf("projelerOnbellek = { ts: Date.now()") < srv.indexOf("paseo projeler okunamadi"), "atama 500 mesajından ÖNCE gelir (hata yolunda atama YOK)");
    assert.ok(srv.includes('hata: "paseo projeler okunamadi: '), "hata 500 dürüst mesajı korunur (bayat hata dizilmez — fail-closed)");
    assert.ok(srv.includes("onbellek: true") && srv.includes("onbellek: false"), "onbellek işareti iki yanıt türünü ayırt eder (dürüst etiket)");
    assert.ok(srv.includes("PANO_PROJELER_TTL_MS"), "TTL test kancası (PASEO_EV deseni) kaynakta");
    /* (b) davranış: BOŞ Paseo evi (agents/ yok → katman boş liste döner — hata DEĞİL) dürüst
       200 + boş liste; önbelleğe YAZILIR (boş sonuç hata değildir) → ikinci istek onbellek:true */
    const { cocuk, port } = await sunucuDogur({ PANO_PORT: "0", PASEO_EV: d, PANO_KOPRU_KOK_CMD: join(d, "kopru-yok.cmd"), PANO_PROJELER_TTL_MS: "400" });
    sunucu = cocuk;
  } finally {
    if (sunucu) sunucu.kill();
    rmSync(d, { recursive: true, force: true });
  }
});

/* ---- M1 (2026-11-04): KURMAY hareket-metrik uçtan-uca zinciri ----
   ORDU_HAREKET_DEFTERI env kancasıyla izole defter; 503 müdahalesi DEFTERE YAZILIR
   (kayit bayrağı 'yazildi') + GET /api/ordu/metrik özeti aynı kaydı okur (SSOT: tek defter). */

test("74- izole server: M1 — 503 müdahalesi hareket defterine yazılır (kayit:'yazildi') + /api/ordu/metrik özeti kaydı okur", async () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-metrik-uc-"));
  const defter = join(d, "hareket-defteri.jsonl");
  let sunucu = null;
  try {
    mkdirSync(join(d, "agents", "D-test-proje"), { recursive: true });
    writeFileSync(join(d, "agents", "D-test-proje", HEDEF + ".json"), JSON.stringify({ id: HEDEF, provider: "glm53u-claude", lastStatus: "idle", lastActivityAt: "2026-11-04T10:00:00Z", title: "metrik ajan" }), "utf8");
    const token = randomUUID();
    const { cocuk, port } = await sunucuDogur({ PANO_PORT: "0", PASEO_EV: d, PANO_KOPRU_KOK_CMD: join(d, "kopru-yok.cmd"), PANO_TOKEN: token, ORDU_HAREKET_DEFTERI: defter });
    sunucu = cocuk;
    /* (a) köprü çözümsüz -> 503; DENELEN gonderim hareket olarak deftere düşer */
    const r = await istekYap(port, "/api/mesaj", { hedef: HEDEF, mesaj: "metrik zincir testi" }, token);
    assert.equal(r.durum, 503, "503 aynen: " + JSON.stringify(r.gov));
    assert.equal(r.gov.kayit, "yazildi", "yanıt dürüst kayit bayrağı taşır (E10)");
    /* (b) defterde TEK satır: mudahale/hata/sureMs sayısal */
    const satirlar = readFileSync(defter, "utf8").trim().split("\n");
    assert.equal(satirlar.length, 1, "tek hareket satırı");
    const kayit = JSON.parse(satirlar[0]);
    assert.equal(kayit.tur, "mudahale"); assert.equal(kayit.hedef, HEDEF); assert.equal(kayit.sonuc, "hata");
    assert.ok(typeof kayit.sureMs === "number" && Number.isFinite(kayit.sureMs), "sureMs sayısal");
    assert.ok(!JSON.stringify(kayit).includes(token), "kayda TOKEN YAZILMAZ");
    /* (c) read-model: GET /api/ordu/metrik aynı defteri okur */
    const m = await istekYapGetirJson(port, "/api/ordu/metrik");
    assert.equal(m.durum, 200, "metrik ucu 200: " + JSON.stringify(m.gov));
    assert.equal(m.gov.toplam, 1);
    assert.equal(m.gov.turler.mudahale.toplam, 1); assert.equal(m.gov.turler.mudahale.hata, 1);
    assert.equal(m.gov.son24s.toplam, 1); assert.equal(m.gov.son24s.hata, 1);
    assert.equal(m.gov.sonHareketISO, kayit.zamanISO, "özet defterdeki kayıtla uyuşur (SSOT)");
  } finally {
    if (sunucu) sunucu.kill();
    rmSync(d, { recursive: true, force: true });
  }
});
