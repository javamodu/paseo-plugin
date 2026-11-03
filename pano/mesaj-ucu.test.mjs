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
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
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
