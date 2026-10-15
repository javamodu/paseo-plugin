#!/usr/bin/env node
// openrouter + pi kapisi: openrouter ayri ham-API provider; pi iki saglayicinin free kümelerini listeler.
// API çagrisi yapmaz (yalnız config + paseo CLI + pi'nin yerel kataloğu). exit 0 = asagidaki her satir dogru.
// Kullanim: node scripts/openrouter-pi-kapisi.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const HOME = process.env.USERPROFILE ? process.env.USERPROFILE.replace(/\\/g, "/") : os.homedir();
const run = (a) => execFileSync("cmd.exe", ["/c", "paseo", ...a], { encoding: "utf8", cwd: HOME, maxBuffer: 1 << 26 });
const json = (s) => { const i = Math.min(...[s.indexOf("["), s.indexOf("{")].filter((x) => x >= 0)); return JSON.parse(s.slice(i)); };
const ids = (a) => a.map((m) => m.id || m);
const var_ = (p) => fs.existsSync(p);
const oku = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const piListModels = (q) => {
  const r = spawnSync("pi --list-models " + q, { shell: "cmd.exe", cwd: HOME, encoding: "utf8", maxBuffer: 1 << 26 });
  return String(r.stdout || "") + String(r.stderr || "");
};

let bad = 0;
const chk = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) bad++; };

const rel = json(run(["reload", "--json"]));
chk(JSON.stringify(rel.restartRequiredPaths || []) === "[]", `reload restartRequired=${JSON.stringify(rel.restartRequiredPaths)}`);

const cfg = oku(path.join(HOME, ".paseo", "config.json")).agents.providers;
const orIds = ids(cfg.openrouter.models), piIds = ids(cfg.pi.models);
const thIds = ids((cfg.tokenharbor || {}).models || []);
chk(orIds.length > 0 && orIds.every((i) => /:free$/i.test(i)), `config openrouter: ${orIds.length} uc, TAMAMI :free`);
chk(piIds.every((i) => /^(openrouter|tokenharbor)\//.test(i) && /:free$/i.test(i)), `config pi: ${piIds.length} uc, TAMAMI free + (openrouter|tokenharbor)/ onekli`);
chk(piIds.filter((i) => i.startsWith("openrouter/")).every((i) => orIds.includes(i.replace(/^openrouter\//, ""))), "pi'nin openrouter ucari canli :free kumesinden");
chk(thIds.every((t) => piIds.includes("tokenharbor/" + t)), `pi, tokenharbor'un ${thIds.length} free ucunu tokenharbor/ onekli listediyor`);
chk(!piIds.some((i) => /opencode/i.test(i)), "pi listesinde OpenCode Zen free YOK (403 istemci kilidi olculdu)");
chk((cfg.openrouter.env || {}).OPENAI_BASE_URL === "https://openrouter.ai/api/v1", "openrouter env.OPENAI_BASE_URL var -> bench ham-API olçebilir");

// pi tokenharbor'u nereden biliyor: ~/.pi/agent/models.json (anahtar diska degil env adina referans)
const MJ = path.join(HOME, ".pi", "agent", "models.json");
chk(var_(MJ), "~/.pi/agent/models.json mevcut");
if (var_(MJ)) {
  const mj = (oku(MJ).providers || {}).tokenharbor || {};
  chk(mj.baseUrl === "https://tokenharbor.ai/v1", "models.json: tokenharbor baseUrl dogru");
  chk(mj.apiKey === "OPENAI_API_KEY", "models.json: apiKey diska yazilmadi, env adina referans");
  const th = ids(mj.models || []);
  chk(th.length > 0 && th.every((i) => /:free$/i.test(i)), `models.json: ${th.length} tokenharbor free uc`);
  const kat = piListModels("tokenharbor").split(/\r?\n/).map((s) => s.trim()).filter((s) => /^tokenharbor\s{2,}\S+/.test(s)).map((s) => s.split(/\s{2,}/)[1]);
  chk(kat.length === th.length, `pi yerel katalogu tokenharbor = ${kat.length} uc`);
  chk(kat.every((i) => /:free$/i.test(i)), "pi kataloğundaki tokenharbor ucari free");
}

const ls = json(run(["provider", "ls", "--json"]));
const arr = ls.providers || ls;
chk(arr.length === 17, `paseo provider ls = ${arr.length} (openrouter dahil)`);
for (const [k, bek] of [["openrouter", orIds.length], ["pi", piIds.length], ["tokenharbor", thIds.length]]) {
  const e = arr.find((x) => x.provider === k);
  chk(!!e && e.enabled !== false, `ls'de ${k}: ${e ? e.status + "/enabled=" + e.enabled : "YOK"}`);
  const ham = json(run(["provider", "models", k, "--json"]));
  const mm = Array.isArray(ham) ? ham : (ham && ham.models) || [];
  chk(ids(mm).length === bek, `${k} canli liste = ${ids(mm).length} (beklenen ${bek})`);
  chk(ids(mm).every((i) => /:free$/i.test(i)), `${k}: free-disi uc yok`);
}
console.log("TOPLAM_FAIL=" + bad);
process.exit(bad ? 1 : 0);
