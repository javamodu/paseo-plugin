// spawn-ucu.test.mjs — K-0065 DALGA B kanıt kapısı: spawn-talebi çekirdeği + izole server koşusu.
// Zincir (karar K-0065): panel POST /api/spawn-talebi → talep append-only kuyruğa (SSOT) +
// KURMAY'a kısa bildirim → KURMAY create_agent işletir → sonucu kuyruğa yazar → panel GET ile okur.
// Server spawn ETMEZ; sahte 'açıldı' YOK (E10). PANO_PORT=0 (geçici port — 4377'YE ASLA
// DOKUNULMAZ); PANO_KOPRU_KOK_CMD var olmayan yol (GERÇEK paseo send çağrısı YOK — bildirim
// zinciri çözümsüz → 202 dürüst 'iletilmedi'); token test üretir (PANO_TOKEN gerçek değeri
// hiçbir dosyaya/log'a YAZILMAZ); kuyruk/defter/kadro env kancalarıyla izole tmp yollar.
import test from "node:test";
import assert from "node:assert";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, appendFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { talepEkle, sonucEkle, kuyrukOzet, kurmayKimligiCoz } from "./ordu-spawn.mjs";

const SERVER_JS = fileURLToPath(new URL("./server.js", import.meta.url));
const SPAWN_MJS = fileURLToPath(new URL("./ordu-spawn.mjs", import.meta.url));
const HEDEF = "8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7";
const HEDEF2 = "432e03b7-9004-445c-857d-ebf3b6661d53";

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

function istekYapGetirJson(port, yol) {
  return new Promise((tamam, kapat) => {
    const req = http.request({ host: "127.0.0.1", port, path: yol, method: "GET" }, (res) => {
      let ham = "";
      res.on("data", (p) => { ham += p; });
      res.on("end", () => { let gov = null; try { gov = JSON.parse(ham); } catch { /* govde json değil */ } tamam({ durum: res.statusCode, gov }); });
    });
    req.on("error", (e) => kapat(new Error("http istegi hatasi: " + e.message)));
    req.end();
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

test("80- K-0065 DALGA B çekirdek: talepEkle doğrulama RED'leri (kesme YOK) + kayıt şekli + append-only", () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-spawn-cekirdek-"));
  const kuyruk = join(d, "spawn-kuyrugu.jsonl");
  try {
    /* (a) RED'ler throw — sınırı aşan/boş girdi DÜRÜST reddedilir (kesilmez) */
    assert.throws(() => talepEkle(kuyruk, null), /nesne/);
    assert.throws(() => talepEkle(kuyruk, { proje: "   " }), /zorunlu/);
    assert.throws(() => talepEkle(kuyruk, { proje: "x".repeat(201) }), /200 karakteri/);
    assert.throws(() => talepEkle(kuyruk, { proje: "D-p", baslik: "b".repeat(201) }), /200 karakteri/);
    assert.throws(() => talepEkle(kuyruk, { proje: "D-p", ilkMesaj: "m".repeat(3001) }), /3000 karakteri/);
    assert.ok(!existsSync(kuyruk) || !readFileSync(kuyruk, "utf8").trim(), "RED'lerde kuyruğa ÇÖP YAZILMAZ (dosya yok ya da boş)");
    /* (b) geçerli talep: kimlik/zaman içeride üretilir (tek doğru kaynak) + trim'lenir */
    const k1 = talepEkle(kuyruk, { proje: "  D-test-proje  ", baslik: "  oturum basligi  ", ilkMesaj: "  brif  " });
    assert.equal(k1.tur, "talep");
    assert.match(k1.talepId, /^[0-9a-f-]{36}$/, "talepId uuid");
    assert.ok(!Number.isNaN(Date.parse(k1.zamanISO)), "zamanISO ISO");
    assert.equal(k1.proje, "D-test-proje"); assert.equal(k1.baslik, "oturum basligi"); assert.equal(k1.ilkMesaj, "brif");
    /* (c) boş alan yazılmaz (uydurma değer YOK — E10) */
    const k2 = talepEkle(kuyruk, { proje: "D-iki" });
    assert.equal(k2.baslik, undefined); assert.equal(k2.ilkMesaj, undefined);
    /* (d) append-only: 2 talep = 2 satır (eski kayıt bozulmaz) */
    assert.equal(readFileSync(kuyruk, "utf8").trim().split("\n").length, 2, "kuyruk append-only");
    /* (e) sonucEkle doğrulamaları */
    assert.throws(() => sonucEkle(kuyruk, { talepId: "" }), /talepId/);
    assert.throws(() => sonucEkle(kuyruk, { talepId: k1.talepId, durum: "acildi" }), /islandi/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("81- K-0065 DALGA B çekirdek: kuyrukOzet — durum türetimi + EN SON sonuc kazanır + bozuk satır SAYILIR + ilkMesaj pencere kısaltması", async () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-spawn-ozet-"));
  const kuyruk = join(d, "spawn-kuyrugu.jsonl");
  try {
    /* (a) dosya YOK → dürüst sıfır */
    let o = kuyrukOzet(kuyruk);
    assert.equal(o.toplamTalep, 0); assert.equal(o.kuyrukta, 0); assert.equal(o.talepler.length, 0);
    /* (b) talep: uzun ilkMesaj DOSYADA TAM kalır, read-model 300 pencereyle kısaltır + bayrak */
    const uzun = "x".repeat(350);
    const k = talepEkle(kuyruk, { proje: "D-test-proje", baslik: "oturum", ilkMesaj: uzun });
    o = kuyrukOzet(kuyruk);
    assert.equal(o.kuyrukta, 1, "sonuc yok → kuyrukta");
    assert.equal(o.talepler[0].durum, "kuyrukta");
    assert.equal(o.talepler[0].ilkMesaj.length, 300);
    assert.equal(o.talepler[0].ilkMesajKisitli, true, "kısaltma dürüst bayrak taşır (TAM metin kuyruk dosyasında)");
    assert.ok(JSON.parse(readFileSync(kuyruk, "utf8").trim()).ilkMesaj.length === 350, "dosyada TAM 350 (SSOT)");
    /* (c) hata → islandi: EN SON sonuc kazanır (zamanISO karşılaştırması) */
    sonucEkle(kuyruk, { talepId: k.talepId, durum: "hata", detay: "deneme" });
    await new Promise((ok) => setTimeout(ok, 6)); // zamanISO ayrışması (aynı-ms eşitlikte eski kalırdı)
    sonucEkle(kuyruk, { talepId: k.talepId, durum: "islandi", ajanId: HEDEF2 });
    o = kuyrukOzet(kuyruk);
    assert.equal(o.islenen, 1); assert.equal(o.hatali, 0); assert.equal(o.kuyrukta, 0);
    assert.equal(o.talepler[0].durum, "islandi");
    assert.equal(o.talepler[0].ajanId, HEDEF2);
    assert.ok(o.talepler[0].sonucZamanISO, "sonuc zamanı taşınır");
    /* (d) bozuk satır atlanır + SAYILIR (gizlenmez — E10) */
    const srv = readFileSync(SPAWN_MJS, "utf8");
    assert.ok(srv.includes("const KUYRUK_TAVAN = 200"), "kaynak pini: okuma penceresi 200 talep");
    appendFileSync(kuyruk, "bu bir bozuk satir\n");
    o = kuyrukOzet(kuyruk);
    assert.equal(o.bozukSatir, 1, "bozuk satır sayılır");
    assert.equal(o.islenen, 1, "bozuk satır okunan kayıtları etkilemez");
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("82- K-0065 DALGA B çekirdek: kurmayKimligiCoz kadro SSOT — MANAGER şablonu (ajanId'siz) atlanır + bozuk/yok → null (fail-closed)", () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-spawn-kurmay-"));
  const kadro = join(d, "kadro.json");
  try {
    /* (a) kurmay + ölçülmüş ajanId çözülür; ajanId'siz şablon atlanır */
    writeFileSync(kadro, JSON.stringify({ birlikler: [
      { kodAdi: "MANAGER", tur: "kurmay" }, // şablon — ajanId YOK
      { kodAdi: "SAVASCI-1", tur: "savasci", ajanId: HEDEF2 },
      { kodAdi: "KURMAY-1", tur: "kurmay", ajanId: HEDEF },
    ] }), "utf8");
    const k = kurmayKimligiCoz(kadro);
    assert.equal(k.ajanId, HEDEF); assert.equal(k.kodAdi, "KURMAY-1");
    /* (b) yalnız şablon → null (kuyrukta işleyen kimlik YOK — uydurulmaz) */
    writeFileSync(kadro, JSON.stringify({ birlikler: [{ kodAdi: "MANAGER", tur: "kurmay" }] }), "utf8");
    assert.equal(kurmayKimligiCoz(kadro), null);
    /* (c) bozuk JSON / dosya yok → null (fail-closed) */
    writeFileSync(kadro, "{{{", "utf8");
    assert.equal(kurmayKimligiCoz(kadro), null);
    assert.equal(kurmayKimligiCoz(join(d, "yok.json")), null);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("83- izole server: POST /api/spawn-talebi RED zinciri — 403 · 401 · 400 (json/proje/whitelist) · 422 (uzun) · 503 (kurmay yok — talep DÜŞMEDİ) + GET boş kuyruk dürüst sıfır", async () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-spawn-red-"));
  const kuyruk = join(d, "spawn-kuyrugu.jsonl");
  let sunucu = null;
  try {
    /* (a) token'sız doğan sunucu → 403 (fail-closed) */
    let { cocuk, port } = await sunucuDogur({ PANO_PORT: "0", PASEO_EV: d, PANO_KOPRU_KOK_CMD: join(d, "kopru-yok.cmd"), ORDU_SPAWN_KUYRUGU: kuyruk });
    sunucu = cocuk;
    let r = await istekYap(port, "/api/spawn-talebi", { proje: "D-test-proje" }, null);
    assert.equal(r.durum, 403, "PANO_TOKEN yok -> 403: " + JSON.stringify(r.gov));
    sunucu.kill(); sunucu = null;
    /* (b) token'lı sunucu — fixture: 1 proje + KADRO YOK (kurmay çözülemez) */
    mkdirSync(join(d, "agents", "D-test-proje"), { recursive: true });
    writeFileSync(join(d, "agents", "D-test-proje", HEDEF + ".json"), JSON.stringify({ id: HEDEF, provider: "glm53u-claude", lastStatus: "idle", lastActivityAt: "2026-11-04T10:00:00Z", title: "spawn ajan" }), "utf8");
    const token = randomUUID(); // test kendi rastgele token'ını üretir — gerçek PANO_TOKEN DEĞİL
    ({ cocuk, port } = await sunucuDogur({ PANO_PORT: "0", PASEO_EV: d, PANO_KOPRU_KOK_CMD: join(d, "kopru-yok.cmd"), PANO_TOKEN: token, ORDU_SPAWN_KUYRUGU: kuyruk, ORDU_KADRO_JSON: join(d, "kadro-yok.json"), ORDU_HAREKET_DEFTERI: join(d, "hareket-defteri.jsonl") }));
    sunucu = cocuk;
    r = await istekYap(port, "/api/spawn-talebi", { proje: "D-test-proje" }, "yanlis-" + randomUUID());
    assert.equal(r.durum, 401, "yanlis token -> 401");
    r = await istekYap(port, "/api/spawn-talebi", null, token);
    assert.equal(r.durum, 400, "gecersiz json -> 400");
    r = await istekYap(port, "/api/spawn-talebi", { proje: "   " }, token);
    assert.equal(r.durum, 400, "proje bos -> 400");
    r = await istekYap(port, "/api/spawn-talebi", { proje: "D-test-proje", baslik: "b".repeat(201) }, token);
    assert.equal(r.durum, 422, "baslik 201 -> 422 (kesilmez — RED)");
    r = await istekYap(port, "/api/spawn-talebi", { proje: "D-yok-proje" }, token);
    assert.equal(r.durum, 400, "taramada olmayan proje -> 400 (izolasyon SSOT: mevcut proje YOK)");
    /* (c) kadro yok -> 503; talep KUYRUĞA DÜŞMEDİ (fail-closed — zincirin başı kopuk) */
    r = await istekYap(port, "/api/spawn-talebi", { proje: "D-test-proje" }, token);
    assert.equal(r.durum, 503, "kurmay cozulemedi -> 503: " + JSON.stringify(r.gov));
    assert.ok(r.gov.hata.includes("fail-closed"), "503 hata metni dürüst");
    assert.ok(!existsSync(kuyruk), "talep kuyruğa DÜŞMEDİ (kabul edilmedi)");
    /* (d) GET boş kuyruk: salt-okur (token başlığı YOK) + dürüst sıfır */
    let g = await istekYapGetirJson(port, "/api/ordu/spawn-kuyruk");
    assert.equal(g.durum, 200, "GET 200: " + JSON.stringify(g.gov));
    assert.equal(g.gov.toplamTalep, 0); assert.equal(g.gov.talepler.length, 0);
  } finally {
    if (sunucu) sunucu.kill();
    rmSync(d, { recursive: true, force: true });
  }
});

test("84- izole server: uçtan-uca 202 (talep kuyrukta + hareket kaydı + GET SSOT okur) + 429 (min 10sn) + KURMAY sonucu → GET işlendi görünür", async () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-spawn-uc-"));
  const kuyruk = join(d, "spawn-kuyrugu.jsonl");
  const defter = join(d, "hareket-defteri.jsonl");
  let sunucu = null;
  try {
    mkdirSync(join(d, "agents", "D-test-proje"), { recursive: true });
    writeFileSync(join(d, "agents", "D-test-proje", HEDEF + ".json"), JSON.stringify({ id: HEDEF, provider: "glm53u-claude", lastStatus: "idle", lastActivityAt: "2026-11-04T10:00:00Z", title: "kurmay ajan" }), "utf8");
    writeFileSync(join(d, "kadro.json"), JSON.stringify({ birlikler: [
      { kodAdi: "KURMAY-1", tur: "kurmay", ajanId: HEDEF }, // KURMAY = bildirim hedefi (izolasyon istisnası)
      { kodAdi: "SAVASCI-1", tur: "savasci", ajanId: HEDEF2 }, // eşleşmez — kurmay çözümü yalnız tur 'kurmay' + ajanId
    ] }), "utf8");
    const token = randomUUID();
    const { cocuk, port } = await sunucuDogur({ PANO_PORT: "0", PASEO_EV: d, PANO_KOPRU_KOK_CMD: join(d, "kopru-yok.cmd"), PANO_TOKEN: token, ORDU_SPAWN_KUYRUGU: kuyruk, ORDU_KADRO_JSON: join(d, "kadro.json"), ORDU_HAREKET_DEFTERI: defter });
    sunucu = cocuk;
    /* (a) POST → 202: talep KUYRUKTA, bildirim iletilmedi (köprü çözümsüz — sahte 'açıldı' YOK) */
    const r = await istekYap(port, "/api/spawn-talebi", { proje: "D-test-proje", baslik: "test oturumu", ilkMesaj: "brif metni" }, token);
    assert.equal(r.durum, 202, "koprui cozumsuz -> 202 (talep kuyrukta KALIR): " + JSON.stringify(r.gov));
    assert.equal(r.gov.kuyrukta, true); assert.equal(r.gov.bildirim, "iletilmedi");
    assert.ok(r.gov.detay && String(r.gov.detay).includes("kopru-cozulmedi"), "detay köprü zincirinden gelir");
    assert.equal(r.gov.kayit, "yazildi", "hareket kaydı dürüst bayrak (E10)");
    /* (b) kuyruk dosyası SSOT: talep kaydı kopta — talepId yanıtla eş */
    const satir = JSON.parse(readFileSync(kuyruk, "utf8").trim());
    assert.equal(satir.tur, "talep"); assert.equal(satir.talepId, r.gov.talepId);
    assert.equal(satir.proje, "D-test-proje"); assert.equal(satir.baslik, "test oturumu");
    /* (c) hareket defteri: tur 'spawn-talebi' + hedef KURMAY + token YAZILMAZ */
    const h = JSON.parse(readFileSync(defter, "utf8").trim());
    assert.equal(h.tur, "spawn-talebi"); assert.equal(h.hedef, HEDEF); assert.equal(h.sonuc, "hata");
    assert.ok(!JSON.stringify(h).includes(token), "kayda TOKEN YAZILMAZ");
    /* (d) GET read-model: aynı kuyruğu okur (SSOT) — talep kuyrukta */
    let g = await istekYapGetirJson(port, "/api/ordu/spawn-kuyruk");
    assert.equal(g.durum, 200);
    assert.equal(g.gov.toplamTalep, 1); assert.equal(g.gov.kuyrukta, 1);
    assert.equal(g.gov.talepler[0].talepId, r.gov.talepId);
    assert.equal(g.gov.talepler[0].durum, "kuyrukta");
    /* (e) aynı projeye hemen ikinci talep -> 429 (min 10sn aralık) */
    const r2 = await istekYap(port, "/api/spawn-talebi", { proje: "D-test-proje" }, token);
    assert.equal(r2.durum, 429, "ayni proje min 10sn -> 429: " + JSON.stringify(r2.gov));
    /* (f) KURMAY sonucu (çekirdek fonksiyon — gerçek zincirde create_agent sonrası) → GET işlendi görünür */
    sonucEkle(kuyruk, { talepId: r.gov.talepId, durum: "islandi", ajanId: HEDEF2, detay: "test zinciri" });
    g = await istekYapGetirJson(port, "/api/ordu/spawn-kuyruk");
    assert.equal(g.gov.kuyrukta, 0); assert.equal(g.gov.islenen, 1);
    assert.equal(g.gov.talepler[0].durum, "islandi");
    assert.equal(g.gov.talepler[0].ajanId, HEDEF2, "işlenen ajanın kimliği panelde görünür (diskten okur)");
    /* (g) kaynak pinleri: uç + env kancası + hareket türü server.js'te */
    const srv = readFileSync(SERVER_JS, "utf8");
    assert.ok(srv.includes('"/api/spawn-talebi"'), "kaynak pini: POST ucu");
    assert.ok(srv.includes("ORDU_SPAWN_KUYRUGU"), "kaynak pini: izole test kancası");
    assert.ok(srv.includes("SPAWN_ARALIK_MS"), "kaynak pini: 429 aralık sabiti");
    assert.ok(srv.includes('tur: "spawn-talebi"'), "kaynak pini: M1 hareket türü");
  } finally {
    if (sunucu) sunucu.kill();
    rmSync(d, { recursive: true, force: true });
  }
});
