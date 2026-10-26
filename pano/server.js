// paseo-pano mini sunucu — K-0019 prototip. Bagimliliksiz node:http, yalniz 127.0.0.1.
// D-1a (kapsul-tuval cekirdegi): PANO_PORT (test icin 0 = gecici port), GET /tuval, GET /api/graf.
import http from "node:http";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const PORT = process.env.PANO_PORT !== undefined ? Number(process.env.PANO_PORT) : 4377;
const GRAF_JSON = process.env.ORDU_GRAF_JSON || join(import.meta.dirname, "..", "plans", "gorev-grafigi-2026-10-26.json");
const TTL_MS = 60_000;
const TOKEN = process.env.PANO_TOKEN || null;
const KOKLER = (process.env.PANO_KOKLER || "D:\\Vibecode").split(";");
const onbellek = new Map(); // repo -> { ts, veri }
const sseIstemci = new Set();

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
  if (existsSync(pano)) {
    const satirlar = readFileSync(pano, "utf8").split(/\r?\n/);
    const i = satirlar.findIndex((s) => s.trim() === "## Son damgalar");
    if (i >= 0) sonDamga = (satirlar.slice(i + 1).find((s) => s.trim().startsWith("- ")) ?? null)?.trim().slice(0, 160) ?? null;
  }
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
    if (req.headers["x-pano-token"] !== TOKEN) { jsonYaz(res, 401, { hata: "token gecersiz" }); return; }
    let govde = "";
    req.on("data", (p) => { govde += p; if (govde.length > 4096) req.destroy(); });
    req.on("end", () => {
      try {
        const emir = JSON.parse(govde);
        if (!IZINLI_EMIRLER.has(emir.eylem)) { jsonYaz(res, 422, { hata: "dar-liste disi eylem", izinli: [...IZINLI_EMIRLER] }); return; }
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
