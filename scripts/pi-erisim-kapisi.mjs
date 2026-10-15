#!/usr/bin/env node
// pi erisim kapisi: "pi neden OpenRouter uzerinden?" iddialarini yerel kanitla dogrular.
// API çagrisi yapmaz; cikis kodu 0 ise asagidaki her satir bugunku durumuyla dogrudur.
// Kullanim: node scripts/pi-erisim-kapisi.mjs

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const HOME = process.env.USERPROFILE ? process.env.USERPROFILE.replace(/\\/g, "/") : os.homedir();
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const varsay = (p) => { try { return fs.existsSync(p); } catch { return false; } };

let bad = 0;
const chk = (cond, msg) => { console.log((cond ? "PASS " : "FAIL ") + msg); if (!cond) bad++; };

// 1. pi CLI kurulu ve surumu var
let surum = "";
try {
  const r = spawnSync("pi --version", { shell: "cmd.exe", cwd: HOME, encoding: "utf8" });
  surum = (String(r.stdout || "") + String(r.stderr || "")).match(/\d+\.\d+\.\d+/)?.[0] || "";
} catch { }
chk(/^\d+\.\d+\.\d+/.test(surum), `pi CLI surumu okunabildi (${surum || "okunamadi"})`);

// 2. pi'nin kendi kimlik dosyasi bos -> credentials yalniz env'den geliyorum
const piAuth = path.join(HOME, ".pi", "agent", "auth.json");
chk(varsay(piAuth), `pi auth dosyasi mevcut: ${piAuth}`);
if (varsay(piAuth)) chk(Object.keys(readJson(piAuth)).length === 0, "pi auth.json BOS -> saglayici kimligi dosyada tutulmuyor");

// 3. ozel saglayici tanimi yok -> dogrudan yol konfigüre edilmemis
const piModels = path.join(HOME, ".pi", "agent", "models.json");
chk(!varsay(piModels), "pi models.json YOK -> tokenharbor gibi ozel base_url henuz tanimli degil");

// 4. pi'nin yerlesik saglayici tablosu
const PKG = path.join(process.env.APPDATA || "", "npm", "node_modules", "@mariozechner", "pi-coding-agent", "docs");
const saglayiciDoc = path.join(PKG, "providers.md");
const modDoc = path.join(PKG, "models.md");
if (varsay(saglayiciDoc)) {
  const t = fs.readFileSync(saglayiciDoc, "utf8");
  chk(/\|\s*OpenRouter\s*\|\s*`OPENROUTER_API_KEY`/.test(t), "providers.md: OpenRouter yerlesik + OPENROUTER_API_KEY okuyor");
  chk(!/tokenharbor/i.test(t), "providers.md: tokenharbor YERLESIK saglayici degil");
  chk(/\|\s*OpenAI\s*\|\s*`OPENAI_API_KEY`/.test(t) && !/OPENAI_API_BASE/.test(t), "providers.md: OpenAI yalniz OPENAI_API_KEY okuyor, base_url env değeri tanimli degil");
  chk(varsay(modDoc) && /~\/\.pi\/agent\/models\.json/.test(fs.readFileSync(modDoc, "utf8")), "models.md: ozel base_url yolu ~/.pi/agent/models.json ile destekli");
} else chk(false, "providers.md bulundu");

// 5. Paseo pi provider'i: tum id'ler openrouter onekli, ham-API icin base_url yok
const cfg = readJson(path.join(HOME, ".paseo", "config.json")).agents.providers;
const pi = cfg.pi || {};
const idler = (pi.models || []).map((m) => m.id || m);
chk(idler.length > 0, `Paseo pi provider'i ${idler.length} model listeliyor`);
chk(idler.every((i) => String(i).startsWith("openrouter/")), "Paseo pi: model id'lerinin TAMAMI openrouter/ onekli");
chk(!(pi.env || {}).OPENAI_BASE_URL, "Paseo pi: env.OPENAI_BASE_URL yok -> bench ham-API olcumu bu hatta yapilamaz");

// 6. env'deki OPENAI anahtari aslinda tokenharbor anahtari
const thKey = ((cfg.tokenharbor || {}).env || {}).OPENAI_API_KEY || "";
const envKey = process.env.OPENAI_API_KEY || "";
chk(thKey.length > 8 && envKey.slice(0, 8) === thKey.slice(0, 8), "env OPENAI_API_KEY = tokenharbor anahtari (ayni on ek) -> pi --provider openai bunu api.openai.com'a gonderiyor, 401 beklenen");
chk((process.env.OPENAI_API_BASE || "").includes("tokenharbor.ai"), `OPENAI_API_BASE tokenharbor'u gosteriyor (${process.env.OPENAI_API_BASE}) ama pi bu değeri okumuyor`);

console.log(`TOPLAM_FAIL=${bad}`);
process.exit(bad ? 1 : 0);
