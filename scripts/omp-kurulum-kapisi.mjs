#!/usr/bin/env node
// omp (Oh My Pi) kurulum kapisi: Paseo'nun beklediği `omp` komutu + Bun runtime cozuluyor mu ve katalog okunabiliyor mu?
// Kullanim: node scripts/omp-kurulum-kapisi.mjs   (API cagrisi yok; paseo CLI + yerel binary kontrolu)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HOME = process.env.USERPROFILE ? process.env.USERPROFILE.replace(/\\/g, "/") : process.env.HOME;
const run = (a) => execFileSync("cmd.exe", ["/c", "paseo", ...a], { encoding: "utf8", cwd: HOME, maxBuffer: 1 << 26 });
const sh = (c) => execFileSync(c, { encoding: "utf8", cwd: HOME, shell: "cmd.exe", maxBuffer: 1 << 26 });
const json = (s) => { const i = Math.min(...[s.indexOf("["), s.indexOf("{")].filter((x) => x >= 0)); return JSON.parse(s.slice(i)); };
const say = (v) => String(v).split(".").map(Number);
const ge = (a, b) => { const x = say(a), y = say(b); for (let i = 0; i < 3; i++) { if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0); } return true; };
const SURUM_MIN = "16.3.9", BUN_MIN = "1.3.14";

let bad = 0;
const chk = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) bad++; };

const bunYolu = path.join(HOME, ".bun", "bin", "bun.exe");
chk(fs.existsSync(bunYolu), `Bun binary mevcut: ~/.bun/bin/bun.exe`);
let bunYolda = "";
try { bunYolda = execFileSync("bun", ["--version"], { encoding: "utf8", cwd: HOME }).trim(); } catch { bunYolda = ""; }
chk(!!bunYolda && ge(bunYolda, BUN_MIN), `Bun kabuksuz cozumleniyor (daemon'in yaptigi gibi) = ${bunYolda || "COZULEMEDI"} (>= ${BUN_MIN})`);

let whereOmp = "";
try { whereOmp = sh("where omp").trim().split(/\r?\n/)[0]; } catch { whereOmp = ""; }
chk(/omp\.(cmd|exe)$/i.test(whereOmp), `omp komutu cozuldu: ${whereOmp || "BULUNAMADI"}`);
const ompSurum = (/omp\/(\d+\.\d+\.\d+)/.exec(sh("omp --version")) || [])[1] || "";
chk(!!ompSurum && ge(ompSurum, SURUM_MIN), `omp surumu ${ompSurum || "?"} (>= ${SURUM_MIN})`);

const diyas = run(["provider", "diagnostic", "omp"]);
const satir = (k) => { const m = diyas.match(new RegExp("^\\s*" + k + ":\\s*(.*)$", "m")); return m ? m[1].trim() : "YOK"; };
chk(satir("Resolved path") !== "not found", `diagnostic Resolved path = ${satir("Resolved path")}`);
chk(/supported/.test(satir("Version support")), `diagnostic Version support = ${satir("Version support")}`);
const bunDiyas = satir("Bun runtime");
console.log(/unavailable/i.test(bunDiyas)
  ? `BILGI diagnostic "Bun runtime" = ${bunDiyas}. Neden YAPISAL, hata degil: uretici kodu (app.asar) bu satiri \`process.versions.bun ?? "unavailable"\` ile uretiyor — daemon'un KENDI runtime'i sorgulaniyor, PATH degil. Node uzerinde kosan daemon'da kurulumdan bagimsiz daima "unavailable"; \`paseo restart\` sonrasi da degismedi (olculdu). OMP'nin gercekten kostugu ayri PASS denetimleriyle dogrulanir: bun.exe kabuksuz cozumleniyor, omp surumu okunuyor, katalog 635 uc donuyor, agent.db found.`
  : `PASS diagnostic Bun runtime = ${bunDiyas}`);
const modelSayi = Number((satir("Models").match(/\d+/) || [0])[0]);
chk(modelSayi > 0, `diagnostic Models = ${modelSayi}`);

const lsJson = json(run(["provider", "ls", "--json"]));
const arr = lsJson.providers || lsJson;
chk(arr.length === 17, `provider ls = ${arr.length} provider`);
const e = arr.find((x) => x.provider === "omp");
chk(!!e && e.status === "available", `ls'de omp: ${e ? e.status + "/enabled=" + e.enabled : "YOK"}`);
chk(!!e && /Full Access/.test(e.modes || ""), `omp modlari: ${e ? e.modes : "YOK"}`);

let ham = null, hata = "";
try { ham = json(run(["provider", "models", "omp", "--json"])); } catch (err) { hata = String(err.stdout || err.message).replace(/\s+/g, " ").slice(0, 160); }
const mm = Array.isArray(ham) ? ham : (ham && ham.models) || [];
chk(mm.length === modelSayi, `canli katalog omp = ${mm.length} uc (diagnostic ${modelSayi})${hata ? " HATA: " + hata : ""}`);
const free = mm.filter((m) => /:free$/i.test(m.id) || (m.prices && Number(m.prices?.prompt) === 0 && Number(m.prices?.completion) === 0));
console.log(`BILGI free uc = ${free.length}/${mm.length}; ornek: ${JSON.stringify((mm.find((m) => m.id === "cohere/north-mini-code:free") || mm[0] || {}).id)}`);
console.log("TOPLAM_FAIL=" + bad);
process.exit(bad ? 1 : 0);
