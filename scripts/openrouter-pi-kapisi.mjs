#!/usr/bin/env node
// openrouter+pi ayrimi kapisi: iki provider da yalniz :free listeliyor mu ve ham-API olulebilir mi?
// Kullanim: node scripts/openrouter-pi-kapisi.mjs   (paseo CLI + config okur, API cagrisi yapmaz)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const HOME = process.env.USERPROFILE ? process.env.USERPROFILE.replace(/\\/g, "/") : os.homedir();
const run = (a) => execFileSync("cmd.exe", ["/c", "paseo", ...a], { encoding: "utf8", cwd: HOME, maxBuffer: 1 << 26 });
const json = (s) => { const i = Math.min(...[s.indexOf("["), s.indexOf("{")].filter((x) => x >= 0)); return JSON.parse(s.slice(i)); };
const ids = (a) => a.map((m) => m.id);

let bad = 0;
const chk = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) bad++; };

const rel = json(run(["reload", "--json"]));
chk(JSON.stringify(rel.restartRequiredPaths || []) === "[]", `reload restartRequired=${JSON.stringify(rel.restartRequiredPaths)}`);

const cfg = JSON.parse(fs.readFileSync(path.join(HOME, ".paseo", "config.json"), "utf8")).agents.providers;
const orIds = ids(cfg.openrouter.models), piIds = ids(cfg.pi.models);
chk(orIds.length === piIds.length && orIds.every((i) => /:free$/i.test(i)), `config openrouter: ${orIds.length} uc, TAMAMI :free`);
chk(piIds.every((i) => i.startsWith("openrouter/") && /:free$/i.test(i)), `config pi: ${piIds.length} uc, TAMAMI openrouter/ onekli + :free`);
chk(JSON.stringify(piIds) === JSON.stringify(orIds.map((i) => "openrouter/" + i)), "pi listesi = openrouter listesinin birebir oneekli kopyasi");
chk((cfg.openrouter.env || {}).OPENAI_BASE_URL === "https://openrouter.ai/api/v1", "openrouter env.OPENAI_BASE_URL tanimli -> bench ham-API olcabilir");

const ls = json(run(["provider", "ls", "--json"]));
const arr = ls.providers || ls;
chk(arr.length === 17, `paseo provider ls = ${arr.length} (16 + yeni openrouter)`);
for (const k of ["openrouter", "pi"]) {
  const e = arr.find((x) => x.provider === k);
  chk(!!e && e.enabled !== false, `ls'de ${k}: ${e ? e.status + "/enabled=" + e.enabled : "YOK"}`);
  const m = json(run(["provider", "models", k, "--json"]));
  const mm = m.models || m;
  chk(mm.length === orIds.length, `canli katalog ${k} = ${mm.length} uc`);
  chk(ids(mm).every((i) => /:free$/i.test(i)), `${k}: canli listede free-disi uc yok`);
}
console.log("ORNEK uc aciklik:", JSON.stringify((json(run(["provider", "models", "openrouter", "--json"])).models || []).find((m) => m.id === "cohere/north-mini-code:free")));
console.log("TOPLAM_FAIL=" + bad);
process.exit(bad ? 1 : 0);
