#!/usr/bin/env node
// codex-failover.mjs — ~/.codex/config.toml icindeki [model_providers.*] bloklarini canli
// olcer; codex'in konusabildigi (Responses API) ilk hazir saglayiciya doner (failover/rotate).
//
// Kullanim:
//   node scripts/codex-failover.mjs                  # matris, HICBIR SEY YAZMAZ
//   node scripts/codex-failover.mjs --oner           # ilk HAZIR olana don (config.toml + yedek)
//   node scripts/codex-failover.mjs --sec=tokenharbor# ada gore don (hazir degilse yazmaz)
//   node scripts/codex-failover.mjs --model=glm-5.3  # secim sonrasi model adini zorla
//   node scripts/codex-failover.mjs --dogrula        # aga gitmeden yapisal dogrulama (exit 0/1)
//
// Neden: codex-cli >= 0.163 yalniz Responses API konusuyor; `wire_api = "chat"` reddediliyor.
// Bu yuzden /responses'ta 404 donduren uc (ornek: codefast glm-api) codex altindan KULLANILAMAZ;
// boyle modeller ACP istemcisine (kilo/opencode) yazilir. 402/403/429 = uc var, hesap engeli.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);
const bayrak = (ad) => argv.find((a) => a.startsWith("--" + ad + "="))?.split("=").slice(1).join("=");
const YAZ = argv.includes("--oner") || !!bayrak("sec");
const SEC = bayrak("sec"), ZOR_MODEL = bayrak("model");

const CODEX = path.join(os.homedir(), ".codex", "config.toml");
const toml = fs.readFileSync(CODEX, "utf8");

// [model_providers."x"] / [model_providers.x] ve [profiles.x] bloklarini satir satir tara
const satirlar = toml.split(/\r?\n/);
const govdeOf = (i) => {
  const g = [];
  for (let j = i + 1; j < satirlar.length && !satirlar[j].startsWith("["); j++) g.push(satirlar[j]);
  return g.join("\n");
};
const al = (govde, ad) => (govde.match(new RegExp("^" + ad + "\\s*=\\s*\"([^\"]+)\"", "m")) || [])[1];
const bloklar = [];
const profiller = [];
for (let i = 0; i < satirlar.length; i++) {
  const h = satirlar[i].match(/^\[model_providers\.(?:"([^"]+)"|'([^']+)'|([^\]\s]+))\]\s*$/);
  if (h) {
    const g = govdeOf(i);
    bloklar.push({ id: h[1] || h[2] || h[3], base_url: al(g, "base_url"), env_key: al(g, "env_key"), wire_api: al(g, "wire_api") || "?" });
    continue;
  }
  const p = satirlar[i].match(/^\[profiles\.(?:"([^"]+)"|'([^']+)'|([^\]\s]+))\]\s*$/);
  if (p) {
    const g = govdeOf(i);
    profiller.push({ id: p[1] || p[2] || p[3], model: al(g, "model"), provider: al(g, "model_provider") });
  }
}

// --dogrula: aga ihtiyac olmadan yapisal baglantiya bakar (codex'in 403'unu degil, kendi hatamizi olcer)
function dogrula() {
  const ev = [];
  const hataliProfil = satirlar.filter((s) => /^\[profiles\./.test(s));
  ev.push(["Satir ici [profiles.x] yok (V2 dosya sart)", hataliProfil.length === 0, hataliProfil.join(" ")]);
  const profilDosyalari = fs.readdirSync(path.dirname(CODEX)).filter((f) => f.endsWith(".config.toml"));
  const ids = new Set(bloklar.map((b) => b.id));
  for (const f of profilDosyalari) {
    const t = fs.readFileSync(path.join(path.dirname(CODEX), f), "utf8");
    const yerel = new Set(ids);
    for (const s of t.split(/\r?\n/)) { const m = s.match(/^\[model_providers\.(?:"([^"]+)"|([^\]\s]+))\]\s*$/); if (m) yerel.add(m[1] || m[2]); }
    const mp = (t.match(/^model_provider\s*=\s*"([^"]+)"/m) || [])[1];
    const md = (t.match(/^model\s*=\s*"([^"]+)"/m) || [])[1];
    ev.push(["profil " + path.basename(f, ".config.toml") + " -> provider+model", !!mp && !!md && yerel.has(mp), mp + "/" + md]);
  }
  const eskiler = ["disable_response_storage", "preferred_auth_method"].filter((k) => new RegExp("^" + k + "\\s*=", "m").test(toml));
  ev.push(["Birken_bakilmis root anahtari yok", eskiler.length === 0, eskiler.join(",")]);
  let kotu = 0;
  for (const [ad, ok, detay] of ev) { console.log((ok ? "OK      " : "HATALI  ") + ad + (detay ? " [" + detay + "]" : "")); if (!ok) kotu++; }
  console.log(kotu ? "\n" + kotu + " YAPI hatasi." : "\nYAPI TAS");
  process.exit(kotu ? 1 : 0);
}
if (argv.includes("--dogrula")) dogrula();

// aktif secim + profiller
const aktif = { provider: (toml.match(/^model_provider\s*=\s*"([^"]+)"/m) || [])[1], model: (toml.match(/^model\s*=\s*"([^"]+)"/m) || [])[1] };
console.log("AKTIF: model_provider=" + aktif.provider + " model=" + aktif.model + " | blok sayisi=" + bloklar.length);

async function olc(b) {
  const key = process.env[b.env_key] || "";
  const sonuc = { ...b, anahtar: key ? "var" : "YOK", responses: "?", chat: "?", hukum: "" };
  if (!b.base_url) { sonuc.hukum = "base_url yok"; return sonuc; }
  const taban = b.base_url.replace(/\/$/, "");
  const model = ZOR_MODEL || denemeModeli(b) || aktif.model;
  sonuc.model = model;
  for (const [uc, govde] of [["/responses", { model, input: "ping", max_output_tokens: 8 }], ["/chat/completions", { model, max_tokens: 8, messages: [{ role: "user", content: "ping" }] }]]) {
    try {
      const r = await fetch(taban + uc, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key }, body: JSON.stringify(govde) });
      const t = await r.text();
      const kod = uc === "/responses" ? "responses" : "chat";
      sonuc[kod] = r.status;
      sonuc[kod + "_hata"] = (t.match(/"(?:code|error)"\s*:\s*"?([A-Za-z_\-]{3,22})/) || [])[1] || "";
    } catch (e) { sonuc[uc === "/responses" ? "responses" : "chat"] = "ERR"; }
  }
  const ucVar = sonuc.responses !== 404 && sonuc.responses !== "ERR";
  if (sonuc.responses === 200) sonuc.hukum = "CODEX HAZIR";
  else if (ucVar) sonuc.hukum = "uc var, hesap engeli (" + (sonuc.responses_hata || sonuc.responses) + ")";
  else if (sonuc.chat === 200) sonuc.hukum = "CHAT-ONLY -> ACP (kilo/opencode) gerekir";
  else sonuc.hukum = "kullanilamaz";
  return sonuc;
}
function denemeModeli(b) {
  const a = (b.id + " " + b.base_url).toLowerCase();
  if (a.includes("glm")) return "glm-5.3";
  if (a.includes("kimi")) return "kimi-k3";
  if (a.includes("open-source")) return "glm-5.3";
  return aktif.model;
}

const sonuclar = [];
for (const b of bloklar) sonuclar.push(await olc(b));
const profilAdi = (blokId) => profiller.filter((p) => p.provider === blokId).map((p) => "-p " + p.id).join(",") || "-";
console.log("BLOK | base_url | model | anahtar | /responses | /chat | profil | HUKUM");
for (const s of sonuclar) console.log([s.id, s.base_url || "-", s.model || "-", s.anahtar, s.responses, s.chat, profilAdi(s.id), s.hukum + (s.responses_hata ? "[" + s.responses_hata + "]" : "")].join(" | "));
if (profiller.length) console.log("\nPROFILLER: " + profiller.map((p) => p.id + "=" + (p.provider || "?") + "/" + (p.model || "?")).join("  "));

if (!YAZ) { console.log("\nMOD: yalniz olcum. Yazmak icin --oner veya --sec=<blok>."); process.exit(0); }

const hedef = SEC ? sonuclar.find((s) => s.id === SEC || s.id.toLowerCase().includes(SEC.toLowerCase())) : sonuclar.find((s) => s.hukum === "CODEX HAZIR");
if (!hedef) { console.log("\nHATA: " + (SEC ? "blok bulunadi (" + SEC + ")" : "hazir codex saglayici yok") + ". Siradaki adim: hesap/paket acmak ya da ACP istemcisini kullanmak."); process.exit(3); }
if (hedef.hukum !== "CODEX HAZIR") { console.log("\nYAZILMADI: " + hedef.id + " hazir degil -> " + hedef.hukum); process.exit(3); }

const YB = CODEX + ".bak-" + new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
let metin = toml
  .replace(/^model_provider\s*=.*$/m, 'model_provider = "' + hedef.id + '"')
  .replace(/^model\s*=.*$/m, 'model = "' + (hedef.model || aktif.model) + '"');
fs.writeFileSync(YB, toml);
fs.writeFileSync(CODEX, metin);
console.log("\nYAZILDI: model_provider=" + hedef.id + " model=" + (hedef.model || aktif.model) + " | yedek: " + path.basename(YB));
