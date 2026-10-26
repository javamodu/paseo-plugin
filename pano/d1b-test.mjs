// D-1b hermetik testler — kapsul kartlari + vurgu + fail-closed (zero-dep; gercek cocuk surec + gercek fetch).
// Kart yazimi IZOLE ORDU_KAPSUL_DIR temp dizinine — gercek repo plans/kapsuller/ DOKUNULMAZ (test de dogrular).
import { spawn } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";

const PANO = import.meta.dirname;
const TOKEN = "d1b-test-token";
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
const post = (base, govde, token) => fetch(base + "/api/kart", {
  method: "POST", headers: { "Content-Type": "application/json", ...(token ? { "X-Pano-Token": token } : {}) }, body: JSON.stringify(govde),
});

const kartEv = mkdtempSync(join(tmpdir(), "d1b-kart-"));
const kokler = mkdtempSync(join(tmpdir(), "d1b-kok-"));
const REPO_KAPSUL = resolve(PANO, "..", "plans", "kapsuller", "A2.md"); // gercek repo — dokunulmamali
let ana, grafYok, tokenYok;
try {
  ana = await sunucuBaslat({ PANO_PORT: "0", PANO_KOKLER: kokler, ORDU_KAPSUL_DIR: kartEv, PANO_TOKEN: TOKEN });
  const base = "http://127.0.0.1:" + ana.port;

  gec("/tuval yuz: kart dugmesi + token alani isaretleri", async () => {
    const h = await (await fetch(base + "/tuval")).text();
    assert.ok(h.includes("KAPSÜL KARTI OLUŞTUR"), "kart dugmesi yok");
    assert.ok(h.includes("PANO_TOKEN (kart yazma kapısı)"), "token alani yok");
  });

  gec("token basligi YOK -> 401 (gecersiz); PANO_TOKEN env YOK sunucu -> 403 fail-closed", async () => {
    assert.equal((await post(base, { id: "A2" }, null)).status, 401);
    tokenYok = await sunucuBaslat({ PANO_PORT: "0", PANO_KOKLER: kokler, ORDU_KAPSUL_DIR: kartEv, PANO_TOKEN: "" });
    const r = await post("http://127.0.0.1:" + tokenYok.port, { id: "A2" }, null);
    assert.equal(r.status, 403);
    assert.ok((await r.json()).hata.includes("PANO_TOKEN"), "fail-closed hata mesaji");
    assert.ok(!existsSync(join(kartEv, "A2.md")), "403 sunucusunda kart dogmamali (A2 henuz yazilmadi)");
  });

  gec("token YANLIS -> 401", async () => {
    const r = await post(base, { id: "A2" }, "yanlis-token");
    assert.equal(r.status, 401);
  });

  gec("KART DOGAR: 201 + dosya + KT-08 8-eksen icerik", async () => {
    const r = await post(base, { id: "A2" }, TOKEN);
    assert.equal(r.status, 201);
    const j = await r.json();
    assert.equal(j.eksen, 8);
    const yol = join(kartEv, "A2.md");
    assert.ok(existsSync(yol), "kart dosyasi dogmadi");
    const md = readFileSync(yol, "utf8");
    for (const eksen of ["| ID |", "Görev (hedef)", "| Rol |", "| Durum |", "| Dizin |", "| Ölçüt |", "Bütçe (LOC)", "Deadline", "Ajan kadrosu", "| Kapı |", "| Bağımlılık |"]) {
      assert.ok(md.includes(eksen), "eksen eksik: " + eksen);
    }
    assert.ok(md.includes("Replan motoru"), "gorev metni graf SSOT'tan degil");
    assert.ok(md.includes("MEVCUT MD EZİLMEZ"), "ezilmez beyani yok");
  });

  gec("MEVCUT MD EZILMEZ: ikinci POST -> 409 + icerik ayni", async () => {
    const once = readFileSync(join(kartEv, "A2.md"), "utf8");
    const r = await post(base, { id: "A2" }, TOKEN);
    assert.equal(r.status, 409);
    assert.equal(readFileSync(join(kartEv, "A2.md"), "utf8"), once, "icerik degismemeli");
  });

  gec("graf-disi id -> 404", async () => {
    const r = await post(base, { id: "YOK-BOYLE" }, TOKEN);
    assert.equal(r.status, 404);
  });

  gec("yol kacamasi id (../) -> 422 RED", async () => {
    const r = await post(base, { id: "../kacamak" }, TOKEN);
    assert.equal(r.status, 422);
  });

  gec("GET /api/kart salt-okur: icerik birebir + yoksa 404 + kotu id 400", async () => {
    const r = await fetch(base + "/api/kart?id=A2");
    assert.equal(r.status, 200);
    const j = await r.json();
    assert.equal(j.icerik, readFileSync(join(kartEv, "A2.md"), "utf8"), "GET icerigi diskten farkli");
    assert.equal((await fetch(base + "/api/kart?id=YOK")).status, 404);
    assert.equal((await fetch(base + "/api/kart?id=" + encodeURIComponent("../x"))).status, 400);
  });

  gec("tmp kalintisi yok (tmp+fsync+rename: sadece .md kalir)", async () => {
    const { readdirSync } = await import("node:fs");
    const dosyalar = readdirSync(kartEv).filter((f) => f.includes(".tmp-"));
    assert.equal(dosyalar.length, 0, "tmp dosya kaldi: " + dosyalar);
  });

  gec("fail-closed: graf SSOT yok -> kart uretilmez 404", async () => {
    grafYok = await sunucuBaslat({ PANO_PORT: "0", PANO_KOKLER: kokler, ORDU_KAPSUL_DIR: kartEv, PANO_TOKEN: TOKEN, ORDU_GRAF_JSON: join(kartEv, "yok-graf.json") });
    const r = await post("http://127.0.0.1:" + grafYok.port, { id: "A3" }, TOKEN);
    assert.equal(r.status, 404);
    assert.ok((await r.json()).hata.includes("graf SSOT yok"));
    assert.ok(!existsSync(join(kartEv, "A3.md")), "grafsiz kart dogmamali");
  });

  gec("D-1a regresyon: /api/graf hala disk ile birebir", async () => {
    const servis = await (await fetch(base + "/api/graf")).json();
    const disk = JSON.parse(readFileSync(join(PANO, "..", "plans", "gorev-grafigi-2026-10-26.json"), "utf8"));
    assert.deepEqual(servis, disk);
  });

  gec("GERCEK repo kapsuller dizinine dokunulMAdi (izolasyon)", async () => {
    assert.ok(!existsSync(REPO_KAPSUL), "test gercek repoya kart yazdi — YASAK (canli sunucuya test kosma kurali)");
  });

  let kirmizi = 0;
  for (const [ad, fn] of gecen) {
    try { await fn(); console.log("ok   " + ad); }
    catch (e) { kirmizi++; console.log("FAIL " + ad + " -> " + e.message); }
  }
  console.log(kirmizi === 0 ? "SONUC: " + gecen.length + "/" + gecen.length + " PASS — D-1b kartlar+vurgu hazir" : "SONUC: " + kirmizi + "/" + gecen.length + " FAIL");
  process.exitCode = kirmizi === 0 ? 0 : 1;
} finally {
  for (const c of cocuklar) { try { c.kill("SIGKILL"); } catch { /* zaten cikmis */ } }
  for (const d of [kartEv, kokler]) { try { rmSync(d, { recursive: true, force: true }); } catch { } }
}
