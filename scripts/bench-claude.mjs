#!/usr/bin/env node
// Claude Code (claude-glm karti) uzerinden ayni bench bataryasi.
// Kullanim: node scripts/bench-claude.mjs [--out=raporlar/bench-glm-claude-DATE]
// Skorlayicilar scripts/bench.mjs ile birebir ayni (kopya) — karsilastirilabilirlik icin.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const HOME = process.env.USERPROFILE ? process.env.USERPROFILE.replace(/\\/g, "/") : process.env.HOME;
const arg = (k, d) => { const m = process.argv.find((a) => a.startsWith(`--${k}=`)); return m ? m.split("=").slice(1).join("=") : d; };
const TODAY = new Date().toISOString().slice(0, 10);
const OUT = path.resolve(arg("out", path.join("raporlar", `bench-glm-claude-${TODAY}`)));

const cfg = JSON.parse(fs.readFileSync(path.join(HOME, ".paseo", "config.json"), "utf8")).agents.providers;
const P = cfg["claude-glm"];
if (!P || !P.env || !P.env.ANTHROPIC_BASE_URL) { console.log("HATA: claude-glm provider/env yok"); process.exit(2); }
const ENV = { ...process.env, ...P.env };

// --- bench.mjs'ten birebir kopya: skorlayicilar + promptlar ---
const ddOK = (satir) => {
  if (!/\bdd\b/i.test(satir)) return false;
  const bs = satir.match(/bs=(\d+(?:\.\d+)?)\s*([kKmMgGbB]?)/);
  const ct = satir.match(/count=(\d+)/i);
  if (!bs || !ct) return false;
  const kat = { "": 1, k: 1e3, m: 1e6, g: 1e9, b: 512 }[bs[2].toLowerCase()] ?? 1;
  const toplam = Number(bs[1]) * kat * Number(ct[1]);
  return toplam >= 4.9e8 && toplam <= 5.3e8;
};
const TERM = [
  { k: "T1", re: /\b(lsof|ss|netstat)\b[^\n]{0,60}8080/, q: "Ubuntu'da 8080 portunu kullanan process'i gosteren tek komut" },
  { k: "T2", re: /grep\s+-[a-zA-Z]*[rR][a-zA-Z]*\b[^\n]{0,40}ERROR|grep[^\n]{0,40}ERROR[^\n]{0,40}-[a-zA-Z]*[rR]/, q: "Bir dizindeki tum dosyalarda ERROR iceren satirlari recursive ara" },
  { k: "T3", re: /git\s+reset\s+(--soft\s+|--mixed\s+)?HEAD(~1|\^1?)?\b|git\s+revert\s+-n/, q: "Son commit'i geri al ama degisiklikler calisma dizininde kalsin" },
  { k: "T4", fn: ddOK, q: "dd ile tam 500MB'lik bir dosya olustur" },
  { k: "T5", re: /docker\s+ps[^\n]{0,90}(tail|head|sort)[^\n]{0,60}docker\s+rm|docker\s+rm\s+(-f\s+)?\$\(docker\s+ps|docker\s+ps[^\n]{0,90}xargs\s+(-n\s*\d+\s+)?docker\s+rm/i, q: "En eski 3 docker container'ini kaldir" },
];
const TERM_PROMPT = "5 soruluk terminal testi. Her cevabi AYRI satira Tn=<tek komut> biciminde yaz, aciklama ve yorum yazma.\n"
  + TERM.map((x, i) => `T${i + 1}: ${x.q}`).join("\n");
const KE = {
  C1: 17 * 23 + 41 * 19 - 965 / 5, C2: 120 - 2 * 24, C3: 4.5,
  C4: +(200 * 1.15 * 0.85).toFixed(2), C5: 1234 * 5678, C6: 654321 % 997,
};
const IQ_PROMPT = [
  "6 soruluk test. Her cevabi AYRI satira sadece C1=<sayi> biciminde yaz. Birim/aciklama yazma.",
  "C1: 17*23 + 41*19 - 965/5 = ?", "C2: 5 farkli kisi siraya diziliyor. A ve B yan yana olmamak sartiyla kac dizilim?",
  "C3: 3 kalem + 2 defter = 21 TL, 5 kalem + 4 defter = 38 TL. Bir defter kac TL? (ondalik)",
  "C4: 200 TL'ye once %15 zam sonra %15 indirim. Son fiyat? (ondalik)", "C5: 1234 * 5678 = ?", "C6: 654321 mod 997 = ?",
].join("\n");
const HIZ_PROMPT = "1'den 150'ye kadar her tamsayiyi ayri bir satirda, sadece sayi olacak bicimde yaz. Baska metin yazma.";
const KOD_PROMPT = "Tek bir JavaScript fonksiyonu yaz: function fonk(n){...} — n'den kucuk veya esit cift sayilarin kareleri toplamini dondur. Sadece kod bloğu dondur.";
const UYUM_PROMPT = 'Yalnizca su JSON nesnesini dondur, baska hicbir sey yazma: {"a":1,"b":[2,3]}';

const blok = (txt) => { const m = String(txt).match(/```(?:js|javascript|json|ts)?\s*([\s\S]*?)```/i); return (m ? m[1] : String(txt)).trim(); };
const dengeli = (t, acik) => {
  const i = t.indexOf(acik); if (i < 0) return "";
  let d = 0, str = null;
  for (let k = i; k < t.length; k++) {
    const c = t[k];
    if (str) { if (c === "\\") k++; else if (c === str) str = null; continue; }
    if (c === '"' || c === "'" || c === "`") { str = c; continue; }
    if (c === "{") d++; else if (c === "}") { d--; if (!d) return t.slice(i, k + 1); }
  }
  return "";
};
const fonkBul = (txt) => {
  const t = blok(txt), i = t.search(/function\s+fonk\s*\(/);
  if (i < 0) return "";
  const a = t.indexOf("{", i); if (a < 0) return "";
  const govde = dengeli(t.slice(a), "{");
  return govde ? t.slice(i, a + govde.length) : "";
};
const kodOk = (txt) => {
  const f = fonkBul(txt);
  if (!f) return { pass: false, not: "fonksiyon bulunamadi" };
  try {
    const ctx = vm.createContext({});
    vm.runInNewContext(f + ";this.r=[fonk(10),fonk(0),fonk(6)];", ctx, { timeout: 500 });
    const got = ctx.r, bek = [220, 0, 56];
    return { pass: JSON.stringify(got) === JSON.stringify(bek), not: `bek=${bek} got=${got}` };
  } catch (e) { return { pass: false, not: "CALISMA " + e.message.slice(0, 60) }; }
};

// --- claude -p cagrisi ---
function claude(prompt, ms = 240000) {
  const t0 = Date.now();
  let raw = "", code = 0;
  try {
    raw = execFileSync("cmd.exe", ["/c", "claude", "-p", "--output-format", "json", "--dangerously-skip-permissions"],
      { encoding: "utf8", input: prompt, env: ENV, timeout: ms, maxBuffer: 1 << 26 });
  } catch (e) { code = 1; raw = e.stdout ? String(e.stdout) : ""; if (!raw) raw = JSON.stringify({ hata: String(e.message).slice(0, 200) }); }
  const sn = +((Date.now() - t0) / 1000).toFixed(2);
  let j = null; try { j = JSON.parse(raw); } catch { }
  const txt = j?.result ?? "";
  const usage = j?.usage || {};
  const outToken = usage.output_tokens ?? usage.outputTokens ?? (txt ? Math.round(txt.length / 4) : 0);
  return { code, sn, txt, outToken, durum: j?.subtype ?? (j?.hata ? "HATA" : "?"), durationMs: j?.duration_ms ?? null, ham: String(raw).slice(0, 300) };
}

const r = { provider: "claude-glm", model: "glm-5.3", motor: "claude-code", erisim: "claude -p (Anthropic /v1/messages)", tps: null, hizToken: 0, sn: 0, IQ: 0, iqDogru: [], iqKacan: [], terminal: null, termKacan: [], kod: null, uyum: null, durumlar: {}, hata: "" };

console.log("KOŞUM 1/5 hiz...");
const h = claude(HIZ_PROMPT);
r.sn = h.sn; r.hizToken = h.outToken; r.tps = h.outToken && h.sn ? +(h.outToken / h.sn).toFixed(1) : null;
r.durumlar.hiz = h.durum; r.hizOrnek = h.txt.replace(/\s+/g, " ").slice(0, 80);

console.log("KOŞUM 2/5 IQ...");
const q = claude(IQ_PROMPT);
r.iqSn = q.sn; r.iqToken = q.outToken; r.durumlar.iq = q.durum; r.iqOrnek = q.txt.replace(/\s+/g, " ").slice(0, 200);
for (const [k, v] of Object.entries(KE)) {
  const re = new RegExp(k + "\\s*=\\s*\\**\\s*" + String(v).replace(".", "[.,]") + "\\b", "i");
  (re.test(q.txt) ? r.iqDogru : r.iqKacan).push(k + (re.test(q.txt) ? "" : "(" + v + ")"));
}
r.IQ = Math.round((r.iqDogru.length / Object.keys(KE).length) * 100);

console.log("KOŞUM 3/5 terminal...");
const te = claude(TERM_PROMPT);
r.termSn = te.sn; r.durumlar.term = te.durum;
let tOk = 0;
TERM.forEach((x, i) => {
  const satir = (te.txt.match(new RegExp("T" + (i + 1) + "\\s*=\\s*([^\\n]+)", "i")) || [])[1] || "";
  const kazan = x.fn ? x.fn(satir) : x.re.test(satir);
  if (kazan) tOk++; else r.termKacan.push("T" + (i + 1));
});
r.terminal = tOk + "/5";
r.termOrnek = te.txt.replace(/\s+/g, " ").slice(0, 240);

console.log("KOŞUM 4/5 kod...");
const c = claude(KOD_PROMPT);
r.kodSn = c.sn; r.durumlar.kod = c.durum;
const ko = kodOk(c.txt); r.kod = ko.pass ? "PASS" : "FAIL:" + ko.not;
r.kodOrnek = fonkBul(c.txt).replace(/\s+/g, " ").slice(0, 110);

console.log("KOŞUM 5/5 uyum...");
const u = claude(UYUM_PROMPT);
r.uyumSn = u.sn; r.durumlar.uyum = u.durum;
const jso = dengeli(blok(u.txt), "{"); r.uyumOrnek = jso.slice(0, 90);
try { const x = JSON.parse(jso); r.uyum = x && x.a === 1 && JSON.stringify(x.b) === "[2,3]" ? "PASS" : "FAIL"; } catch { r.uyum = "FAIL"; }

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "bench.json"), JSON.stringify({ tarih: TODAY, hedef: 1, olculen: r.tps > 0 ? 1 : 0, rows: [r] }, null, 2));
console.log(`\nSONUC claude-glm/glm-5.3 (claude-code motoru): t/s=${r.tps} · IQ=${r.IQ} (${r.iqDogru.length}/6) · terminal=${r.terminal} · kod=${r.kod} · uyum=${r.uyum}`);
console.log(`YAZILDI ${path.join(OUT, "bench.json")}`);
process.exit(r.tps > 0 ? 0 : 1);
