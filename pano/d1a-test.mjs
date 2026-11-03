// D-1a hermetik testler — kapsul tuval masaustu cekirdegi (zero-dep; gercek node cocuk sureci + gercek fetch).
// Kapsam: /tuval 302 (PANEL-SIFIR-1 — uretim yuzu kapandi, dosya diskte kalir), /api/graf (disk ile birebir + kenar gecerliligi), fail-closed graf yoklugu,
// /api/repolar regresyonu (izole KOKLER), 404 kapisinin gecerliligi, kok/ordu/iskelet yuz pinleri. PANO_PORT=0 -> gecici port (catisma yok).
import { spawn } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";

const PANO = import.meta.dirname;
const GRAF_YOLU = join(PANO, "..", "plans", "gorev-grafigi-2026-10-26.json");
const gecen = [];
const cocuklar = [];
const gec = (ad, fn) => gecen.push([ad, fn]);

function sunucuBaslat(env) {
  const c = spawn(process.execPath, ["server.js"], { cwd: PANO, env: { ...process.env, ...env } });
  cocuklar.push(c);
  return new Promise((res, rej) => {
    const zamanAsimi = setTimeout(() => rej(new Error("sunucu 5 sn icinde port bildirmedi")), 5000);
    c.stdout.on("data", (d) => {
      const m = String(d).match(/127\.0\.0\.1:(\d+)/);
      if (m) { clearTimeout(zamanAsimi); res({ cocuk: c, port: Number(m[1]) }); }
    });
    c.stderr.on("data", (d) => process.stderr.write(d));
  });
}

const gecici = mkdtempSync(join(tmpdir(), "d1a-"));
let ana, yanlisGraf;
let kirmizi = 0;
try {
  ana = await sunucuBaslat({ PANO_PORT: "0", PANO_KOKLER: gecici, ORDU_GRAF_JSON: undefined });
  const base = "http://127.0.0.1:" + ana.port;

  gec("/tuval — PANEL-SIFIR-1 (kullanici emri 2026-11-03 'kapsul tuval alt sayfasi iptal'): uretim yuzu KAPANDI — 302 /ordu; kapsul-tuval.html DOSYA diskte kalir", async () => {
    const r = await fetch(base + "/tuval", { redirect: "manual" });
    assert.equal(r.status, 302);
    assert.equal(r.headers.get("location"), "/ordu");
  });

  gec("/api/graf — disk graf JSON'u ile BIREBIR + surum/dugum/kenar", async () => {
    const r = await fetch(base + "/api/graf");
    assert.equal(r.status, 200);
    const servis = await r.json();
    const disk = JSON.parse(readFileSync(GRAF_YOLU, "utf8"));
    assert.deepEqual(servis, disk, "servis ile disk farkli — cift SSOT kokusu");
    // pin = bilinçli SSOT-snapshot alarmı: graf evrilince pin güncellenmezse npm test kırmızı kalır
    // (S8 drift alarmı — sessiz evrim yasak). v6/24/29 → v14/40/15 (2026-11-01; graf 10-27'den beri
    // v14'dü, pin bayattı ve npm test o zamandan beri koşulmamıştı — koordinatör bulgusu).
    assert.equal(servis.grafSurumu, "v14");
    assert.equal(servis.gorevler.length, 40);
    assert.equal(servis.kenarlar.length, 15);
  });

  gec("kenar uclari gecerli (DAG somut dogrulama)", async () => {
    const servis = await (await fetch(base + "/api/graf")).json();
    const idler = new Set(servis.gorevler.map((g) => g.id));
    for (const e of servis.kenarlar) {
      assert.ok(idler.has(e.dan), "gecersiz kenar ucu: " + e.dan);
      assert.ok(idler.has(e.ile), "gecersiz kenar ucu: " + e.ile);
    }
  });

  gec("fail-closed: graf JSON yok -> 404 + ADIYLA hata (sessiz bos servis YOK)", async () => {
    yanlisGraf = await sunucuBaslat({ PANO_PORT: "0", PANO_KOKLER: gecici, ORDU_GRAF_JSON: join(gecici, "yok.json") });
    const r = await fetch("http://127.0.0.1:" + yanlisGraf.port + "/api/graf");
    assert.equal(r.status, 404);
    const j = await r.json();
    assert.ok(j.hata && j.hata.includes("yok.json"), "hata ADIYLA yolu tasimali: " + JSON.stringify(j));
  });

  gec("/api/repolar regresyon — izole KOKLER: bos repo listesi", async () => {
    const r = await fetch(base + "/api/repolar");
    assert.equal(r.status, 200);
    const j = await r.json();
    assert.equal(j.schemaSurum, 1);
    assert.deepEqual(j.repolar, []);
  });

  gec("tanimsiz uc -> 404 (kapanmamis kapi yok)", async () => {
    const r = await fetch(base + "/api/yok-boyle");
    assert.equal(r.status, 404);
  });

  gec("kok / + /ordu + /iskelet yuzleri — PANEL-SIFIR-1 sonrasi pin seti (kok 302 /ordu; /ordu 200 HTML; /iskelet 200 AYNEN)", async () => {
    const r1 = await fetch(base + "/", { redirect: "manual" });
    assert.equal(r1.status, 302);
    assert.equal(r1.headers.get("location"), "/ordu");
    const r2 = await fetch(base + "/ordu", { redirect: "manual" });
    assert.equal(r2.status, 200);
    assert.ok((r2.headers.get("content-type") || "").includes("text/html"));
    const r3 = await fetch(base + "/iskelet");
    assert.equal(r3.status, 200);
  });

  // testler BURADA kosulur — finally cocuklari oldurmeden ONCE (once-kill-sonra-kos = olcu sunucuya fetch)
  for (const [ad, fn] of gecen) {
    try { await fn(); console.log("ok   " + ad); }
    catch (e) { kirmizi++; console.log("FAIL " + ad + " -> " + e.message + (e.cause ? " [neden: " + e.cause.code + "]" : "")); }
  }
} finally {
  for (const c of cocuklar) { try { c.kill("SIGKILL"); } catch { /* zaten cikmis */ } }
  try { rmSync(gecici, { recursive: true, force: true }); } catch { }
}
console.log(kirmizi === 0 ? "SONUC: " + gecen.length + "/" + gecen.length + " PASS — D-1a cekirdek hazir" : "SONUC: " + kirmizi + "/" + gecen.length + " FAIL");
process.exitCode = kirmizi === 0 ? 0 : 1;
