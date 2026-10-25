#!/usr/bin/env node
// Birlesik model katalogu: ayni modelin KAC provider'da oldugunu tek tabloda toplar.
// Giris: ~/.paseo/config.json (provider+model listesi) · canli /models (base_url varsa) ·
//       raporlar/bench-*/bench.json (yerel olcum) · scripts/bench-puanlari.json (dis puan)
// Cikis: raporlar/model-katalog-<tarih>/katalog.json + katalog.md
// Kullanim: node scripts/model-katalog.mjs [--canli=0] [--cikis=<yol>]
// Cikis kodu: 0 = yazildi, 1 = hic model yazilamadi, 2 = girdi/veri hatasi.

import fs from "node:fs";
import path from "node:path";

const arg = (k, d) => { const m = process.argv.find((a) => a.startsWith(`--${k}=`)); return m ? m.split("=").slice(1).join("=") : d; };
const CANLI = arg("canli", "1") !== "0";
const REPO = process.cwd();
const HOME = process.env.USERPROFILE ? process.env.USERPROFILE.replace(/\\/g, "/") : process.env.HOME;
const TODAY = new Date().toISOString().slice(0, 10);
const CFG = path.join(HOME, ".paseo", "config.json");
if (!fs.existsSync(CFG)) { console.error("HATA config yok: " + CFG); process.exit(2); }
const cfg = JSON.parse(fs.readFileSync(CFG, "utf8"));

// ---- kanonik ad: prefix/sonek temizligi, ayni modelin farkli yazimlarini birlestirir
const ON_EKLER = ["opencode", "moonshotai", "deepseek-ai", "z-ai", "nvidia", "thinkingmachines", "cohere", "poolside", "google", "meta", "stepfun-ai", "qwen", "mistralai", "moonshot"];
const kanonik = (id) => {
  let s = String(id).trim().toLowerCase();
  s = s.replace(/:free$/, "").replace(/\s*\(.*\)\s*$/, "").replace(/\s*[-–]\s*free$/, "");
  for (const e of ON_EKLER) s = s.replace(new RegExp("^" + e + "/"), "");
  return s.replace(/\s+/g, "-");
};
// gecerli id = kucuk harf slug; ':' (free rota), '.' (surum), '/' (vendor onu) ve '-' serbest.
// Bozuk olan: bosluk, parantez, buyuk harfli gorunum etiketleri ("Space Bunny Free" gibi)
const gecerliId = (id) => /^[a-z0-9][a-z0-9._:/-]*$/.test(String(id).trim().toLowerCase());

// ---- yerel olcum: en dolu satir kazanir (uygunluk.mjs ile ayni oncelik)
const olcum = new Map();
const raporD = path.join(REPO, "raporlar");
if (fs.existsSync(raporD)) {
  const doluluk = (r) => ["tps", "terminal", "kod", "IQ", "context", "uyum"].filter((k) => r[k] !== null && r[k] !== undefined && r[k] !== "").length;
  for (const d of fs.readdirSync(raporD).filter((x) => /^bench/.test(x)).sort()) {
    const f = path.join(raporD, d, "bench.json");
    if (!fs.existsSync(f)) continue;
    const j = JSON.parse(fs.readFileSync(f, "utf8"));
    for (const r of j.rows || []) {
      const k = r.provider + "/" + r.model;
      const v = olcum.get(k);
      if (!v || doluluk(r) > doluluk(v)) olcum.set(k, { ...r, _rapor: d });
    }
  }
}
let DIS = {};
try { DIS = (JSON.parse(fs.readFileSync(path.join(REPO, "scripts", "bench-puanlari.json"), "utf8")).models || {}); } catch { }

// ---- canli katalog (yalniz base_url + anahtar olan codex-extends provider'lar)
const canli = new Map();
if (CANLI) {
  for (const [id, p] of Object.entries(cfg.agents.providers)) {
    const base = p.env && p.env.OPENAI_BASE_URL, key = p.env && p.env.OPENAI_API_KEY;
    if (!base || !key) continue;
    try {
      const r = await fetch(base.replace(/\/$/, "") + "/models", { headers: { Authorization: `Bearer ${key}` } });
      if (!r.ok) { console.log("  canli " + id + ": HTTP " + r.status + " (atlandi)"); continue; }
      const j = await r.json();
      const m = {};
      for (const rec of j.data || []) if (rec && rec.id) m[rec.id] = rec;
      canli.set(id, m);
      console.log("  canli " + id + ": " + Object.keys(m).length + " model");
    } catch (e) { console.log("  canli " + id + ": HATA " + e.message); }
  }
}

// ---- kaynak toplama
const satirlar = [];
const bozuk = [];
for (const [pid, p] of Object.entries(cfg.agents.providers)) {
  if (p.enabled === false) continue;
  const base = p.env && p.env.OPENAI_BASE_URL ? p.env.OPENAI_BASE_URL : null;
  const tur = p.extends ? "codex-extends" : (p.type || "acp/native");
  for (const m of p.models || []) {
    const id = m.id || m;
    if (!gecerliId(id)) { bozuk.push({ provider: pid, id, neden: "gecersiz id (bosluk/parantez; Zen id'leri kucuk harf slug)" }); continue; }
    const kan = kanonik(id);
    const cat = (canli.get(pid) || {})[id] || {};
    const ol = olcum.get(pid + "/" + id);
    const dis = DIS[id] || DIS[kan] || null;
    satirlar.push({
      kanonik: kan, provider: pid, modelId: id, tur, baseVar: !!base,
      ctx: cat.context_length ?? cat.context ?? null,
      maks: cat.max_completion_tokens ?? cat.max_output_tokens ?? null,
      fiyatG: cat.pricing?.input_usd_per_1m ?? dis?.fiyat_girdi ?? null,
      fiyatC: cat.pricing?.output_usd_per_1m ?? dis?.fiyat_cikti ?? null,
      tier: cat.tier ?? null,
      olculdu: !!ol, tps: ol?.tps ?? null, terminal: ol?.terminal ?? null, kod: ol?.kod ?? null, IQ: ol?.IQ ?? null,
      hata: ol?.hata ? String(ol.hata).slice(0, 90) : "",
      disPuan: dis ? { swebench: dis.swebench ?? null, terminalBench: dis.terminal_bench ?? null, aa: dis.aa_intelligence ?? null } : null,
    });
  }
}

// ---- grupla
const gruplar = new Map();
for (const s of satirlar) { if (!gruplar.has(s.kanonik)) gruplar.set(s.kanonik, []); gruplar.get(s.kanonik).push(s); }
const fiyat = (a) => (a.fiyatG === null && a.fiyatC === null) ? Infinity : (Number(a.fiyatG) || 0) + (Number(a.fiyatC) || 0) / 6;
const sirali = [...gruplar.entries()].map(([kan, satirlar2]) => {
  const olc = satirlar2.filter((s) => s.olculdu);
  const enUcuz = satirlar2.slice().sort((a, b) => fiyat(a) - fiyat(b))[0];
  const enGenisCtx = satirlar2.map((s) => s.ctx || 0).sort((a, b) => b - a)[0] || null;
  return {
    kanonik: kan, providerSayisi: satirlar2.length, toplamKayit: satirlar2.length,
    satirlar: satirlar2.sort((a, b) => fiyat(a) - fiyat(b)),
    enUcuz: enUcuz.fiyatG === null ? null : { provider: enUcuz.provider, modelId: enUcuz.modelId, fiyatG: enUcuz.fiyatG, fiyatC: enUcuz.fiyatC },
    ctx: enGenisCtx, olculen: olc.length, olcumluSatir: olc[0] ? { tps: olc[0].tps, terminal: olc[0].terminal, kod: olc[0].kod, IQ: olc[0].IQ } : null,
    disPuan: satirlar2.map((s) => s.disPuan).find(Boolean) || null,
  };
}).sort((a, b) => b.providerSayisi - a.providerSayisi || String(a.kanonik).localeCompare(b.kanonik, "tr"));

const coklu = sirali.filter((g) => g.providerSayisi > 1);
console.log(`\nKATEGORI=${sirali.length} · coklu saglayici=${coklu.length} · kayit=${satirlar.length} · bozuk-id=${bozuk.length}`);

// ---- md
function md() {
  const L = [];
  L.push(`# Birlesik Model Katalogu — ${P.proje || "paseo-plugin"} · ${TODAY}`);
  L.push(`Kaynak: \`~/.paseo/config.json\` (provider+model) · canli \`/models\` · \`raporlar/bench-*/bench.json\` · \`scripts/bench-puanlari.json\``);
  L.push(`Kapsam: ${sirali.length} farkli model · ${satirlar.length} provider kaydı · **${coklu.length} model birden fazla provider'da**`);
  L.push("");
  L.push("## Birden fazla provider'da olan modeller (asil bakım yeri)");
  L.push("| model | provider sayısı | en ucuz (provider · $/1M g-ç) | ctx | ölçüm (t/s · terminal · kod) | dış puan* |");
  L.push("|---|---|---|---|---|---|");
  for (const g of coklu) {
    const o = g.olcumluSatir;
    const d = g.disPuan ? [g.disPuan.swebench && `SWE ${g.disPuan.swebench}`, g.disPuan.terminalBench && `TB ${g.disPuan.terminalBench}`, g.disPuan.aa && `AA ${g.disPuan.aa}`].filter(Boolean).join(" · ") : "";
    L.push(`| **${g.kanonik}** | ${g.providerSayisi} | ${g.enUcuz ? `${g.enUcuz.provider} · ${g.enUcuz.fiyatG}/${g.enUcuz.fiyatC}` : "fiyat yok"} | ${g.ctx || "—"} | ${o ? `${o.tps ?? "—"} · ${o.terminal} · ${o.kod}` : "**ölçülmedi**"} | ${d || "—"} |`);
  }
  L.push("");
  L.push("## Tüm modeller (provider → id, ctx, fiyat)");
  L.push("| model | provider kayıtları | ctx | fiyat $/1M (g-ç) | ölçüm durumu |");
  L.push("|---|---|---|---|---|");
  for (const g of sirali) {
    const kayit = g.satirlar.map((s) => `\`${s.modelId}\`${s.ctx ? ` (${s.ctx})` : ""}${s.fiyatG !== null ? ` $${s.fiyatG}/$${s.fiyatC}` : ""}`).join("<br>");
    const durum = g.olculdu ? `ölçüldü (${g.olcumluSatir.tps ?? "—"} t/s · ${g.olcumluSatir.terminal} · kod ${g.olcumluSatir.kod})` : (g.satirlar.some((s) => s.hata) ? "hata: " + g.satirlar.find((s) => s.hata).hata : "ölçülmedi");
    L.push(`| ${g.kanonik} | ${kayit} | ${g.ctx || "—"} | ${g.enUcuz ? `$${g.enUcuz.fiyatG}/$${g.enUcuz.fiyatC}` : "—"} | ${durum} |`);
  }
  if (bozuk.length) {
    L.push("");
    L.push("## Bozuk/geçersiz model id kayıtları (çalışmaz — düzeltilmeli)");
    L.push("| provider | id | neden |");
    L.push("|---|---|---|");
    for (const b of bozuk) L.push(`| ${b.provider} | \`${b.id}\` | ${b.neden} |`);
  }
  L.push("");
  L.push("* dış puan = `scripts/bench-puanlari.json`'daki yayımlanmış puan (URL'li, tek kaynak); ölçülmediği anlamak için boş bırakıldı.");
  return L.join("\n");
}

const P = { proje: path.basename(REPO) };
const cikis = path.resolve(arg("cikis", path.join(REPO, "raporlar", `model-katalog-${TODAY}`)));
fs.mkdirSync(cikis, { recursive: true });
fs.writeFileSync(path.join(cikis, "katalog.json"), JSON.stringify({ tarih: TODAY, toplamModel: sirali.length, cokluSaglayici: coklu.length, kayit: satirlar.length, gruplar: sirali, bozuk }, null, 2));
fs.writeFileSync(path.join(cikis, "katalog.md"), md());
console.log("COKLU SAGLAYICILI (ilk 12):");
for (const g of coklu.slice(0, 12)) console.log(`  ${g.kanonik.padEnd(34)} ${g.providerSayisi} provider · en ucuz ${g.enUcuz ? g.enUcuz.provider + " $" + g.enUcuz.fiyatG + "/$" + g.enUcuz.fiyatC : "-"} · olcum ${g.olculdu ? "var" : "yok"}`);
if (bozuk.length) { console.log("BOZUK ID: " + bozuk.length); for (const b of bozuk) console.log("  " + b.provider + " -> " + b.id); }
console.log(`YAZILDI ${path.join(cikis, "katalog.json")} + katalog.md`);
process.exit(satirlar.length ? 0 : 1);