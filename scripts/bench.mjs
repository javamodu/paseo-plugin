#!/usr/bin/env node
// Paseo model benchmark harness. Vanilla Node, no dependencies.
// Usage: node scripts/bench.mjs [--providers=tokenharbor,codefast] [--limit=2] [--out=raporlar/bench-DATE]
//        node scripts/bench.mjs --check <bench.json>   # verifies json <-> index.html consistency

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const HOME = process.env.USERPROFILE ? process.env.USERPROFILE.replace(/\\/g, "/") : process.env.HOME;
const arg = (k, d) => { const m = process.argv.find((a) => a.startsWith(`--${k}=`)); return m ? m.split("=").slice(1).join("=") : d; };
const TODAY = new Date().toISOString().slice(0, 10);
const OUT = path.resolve(arg("out", path.join("raporlar", `bench-${TODAY}`)));

if (process.argv.includes("--render")) {
  const f = path.resolve(process.argv[process.argv.indexOf("--render") + 1]);
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  const hedef = path.join(path.dirname(f), "index.html");
  fs.writeFileSync(hedef, HTML(j.rows, j.tarih, j.hedef, j.olculen));
  console.log(`RENDER ${hedef} (${j.rows.length} satir, API kullanimi yok)`);
  process.exit(0);
}

if (process.argv.includes("--check")) {
  const f = process.argv[process.argv.indexOf("--check") + 1];
  if (!f) { console.log("KULLANIM: node scripts/bench.mjs --check <bench.json>  (raporlar/bench-*/bench.json)"); process.exit(2); }
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  const html = fs.readFileSync(path.join(path.dirname(f), "index.html"), "utf8");
  let bad = 0;
  const chk = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) bad++; };
  chk(Array.isArray(j.rows) && j.rows.length === j.hedef, `satir sayisi = hedef sayisi (${j.rows.length}/${j.hedef})`);
  const gomulu = html.match(/const R=(\[[\s\S]*?\]);\n/);
  chk(!!gomulu, "html içine gömülü veri bulundu");
  if (gomulu) chk(JSON.parse(gomulu[1].replace(/\\u003c/g, "<")).length === j.rows.length, "gömülü satır sayısı json ile aynı");
  for (const r of j.rows) chk(html.includes(r.model), "html'de model satiri: " + r.model);
  chk(j.rows.some((r) => r.tps > 0), "en az bir olculmus t/s");
  // panelin kendisi: gomulu <script> parse edilemezse hicbir satir cizilmez (bu tuzak yasandi)
  const scrip = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || "";
  const tf = path.join(os.tmpdir(), "bench-panel-check.mjs");
  fs.writeFileSync(tf, scrip);
  let parseOK = false, parseMsg = "";
  try { execFileSync(process.execPath, ["--check", tf], { stdio: ["ignore", "ignore", "pipe"] }); parseOK = true; }
  catch (e) { parseMsg = String(e.stderr || e.message).replace(/\s+/g, " ").slice(0, 200); }
  chk(parseOK && scrip.length > 200, `panelin gomulu script'i parse ediliyor (${scrip.length} krk)` + (parseOK ? "" : " :: " + parseMsg));
  console.log("\nCHECK_FAIL=" + bad);
  process.exit(bad ? 1 : 0);
}

const cfg = JSON.parse(fs.readFileSync(path.join(HOME, ".paseo", "config.json"), "utf8")).agents.providers;

let PUAN = {};
try { PUAN = JSON.parse(fs.readFileSync(new URL("./bench-puanlari.json", import.meta.url), "utf8")).models || {}; } catch { }

const KATALOG = new Map();
function katalog(base, key) {
  if (KATALOG.has(base)) return KATALOG.get(base);
  const m = {};
  try {
    const j = JSON.parse(execFileSync("curl.exe", ["-s", "--max-time", "25", "-H", "Authorization: Bearer " + key, base.replace(/\/$/, "") + "/models"], { encoding: "utf8", maxBuffer: 1 << 26 }));
    for (const rec of (j.data || j)) if (rec && rec.id) m[rec.id] = rec;
  } catch { }
  KATALOG.set(base, m); return m;
}

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

function post(url, key, body, ms = 240000) {
  const govde = JSON.stringify(body);
  const f = path.join(process.env.TEMP || "/tmp", "bench-body-" + Math.abs([...url].reduce((a, c) => a + c.charCodeAt(0) + govde.length, 0)) + ".json");
  fs.writeFileSync(f, govde);
  const t0 = Date.now();
  let code = "000", raw = "";
  try {
    const r = execFileSync("curl.exe", ["-s", "--max-time", String(Math.round(ms / 1000)), "-w", "\nHTTPCODE=%{http_code}",
      "-H", "Content-Type: application/json", "-H", "Authorization: Bearer " + key, "-d", "@" + f, url], { encoding: "utf8", maxBuffer: 1 << 26 });
    const m = r.match(/HTTPCODE=(\d+)\s*$/); code = m ? m[1] : "000";
    raw = r.replace(/\nHTTPCODE=\d+\s*$/, "");
  } catch (e) { raw = JSON.stringify({ error: { message: "CURL " + e.message } }); }
  let j = null; try { j = JSON.parse(raw); } catch { }
  return { code, sn: +((Date.now() - t0) / 1000).toFixed(2), j, raw: raw.slice(0, 400) };
}

function parseChat(j) {
  const m = j?.choices?.[0]?.message || {};
  return { txt: m.content || "", reasoning: m.reasoning_content || m.reasoning || "", bitis: j?.choices?.[0]?.finish_reason ?? null, usage: j?.usage };
}
function parseResp(j) {
  const parts = Array.isArray(j?.output) ? j.output.flatMap((o) => (o.content || []).map((c) => c.text || "")) : [];
  const r = (j?.output || []).map((o) => o.summary?.map((s) => s.text || "").join("") || o.reasoning_content || "").join("");
  return { txt: parts.join("\n"), reasoning: r, bitis: j?.status ?? null, usage: j?.usage };
}

async function runTask(base, key, model, prompt, maxTokens) {
  const url = base.replace(/\/$/, "") + "/chat/completions";
  const chat = post(url, key, { model, messages: [{ role: "user", content: prompt }], max_tokens: maxTokens, temperature: 0 });
  let p = parseChat(chat.j), j = chat.j;
  if ((!j || chat.code[0] === "4") && !p.txt) {
    const rs = post(base.replace(/\/$/, "") + "/responses", key, { model, input: prompt, max_output_tokens: maxTokens, temperature: 0 });
    if (rs.j && (!chat.j || !p.txt)) { j = rs.j; p = parseResp(j); chat.code = rs.code; chat.sn = rs.sn; }
  }
  // reasoning-modelleri kucuk butcede content'i bos birakir; bircok FAIL gercekte budur. Butceyi tirmandir, bir kez dene.
  if (p.txt.trim() === "" && p.reasoning.length > 0 && chat.code[0] === "2") {
    const buyuk = Math.min(8000, maxTokens * 4);
    const again = post(url, key, { model, messages: [{ role: "user", content: prompt }], max_tokens: buyuk, temperature: 0 });
    const pa = parseChat(again.j);
    if (again.j && pa.txt.trim() !== "") { chat.code = again.code; chat.sn = again.sn; j = again.j; p = pa; }
  }
  const tok = p.usage?.completion_tokens ?? p.usage?.output_tokens ?? Math.round((p.txt.length + p.reasoning.length) / 4);
  return { code: chat.code, sn: chat.sn, txt: p.txt, reasoning: p.reasoning, bitis: p.bitis, outToken: tok, hata: j?.error ? String(j.error.message || JSON.stringify(j.error)).slice(0, 120) : (j ? "" : chat.raw) };
}

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

const targets = [];
for (const [id, p] of Object.entries(cfg)) {
  if (p.enabled === false) continue;
  const base = p.env && p.env.OPENAI_BASE_URL;
  let models = (p.models || []).map((m) => m.id || m);
  if (!models.length) { try { models = JSON.parse(execFileSync("cmd.exe", ["/c", "paseo", "provider", "models", id, "--json"], { encoding: "utf8", maxBuffer: 1 << 26 })).map((m) => m.id); } catch { } }
  targets.push(...models.slice(0, Number(arg("limit", 99))).map((m) => ({ provider: id, model: m, base: base || null, key: (p.env || {}).OPENAI_API_KEY || null })));
}
const only = arg("providers", "").split(",").filter(Boolean);
const hedef = only.length ? targets.filter((t) => only.includes(t.provider)) : targets;
console.log(`HEDEF=${hedef.length} model (${new Set(hedef.map((t) => t.provider)).size} provider) -> ${OUT}`);

if (process.argv.includes("--list")) {
  for (const [id, p] of Object.entries(cfg)) if (p.enabled === false) console.log("  0  " + id + " [devre disi]");
  const g = new Map();
  for (const t of hedef) {
    const k = t.provider + (t.base ? " [ham-API: olculabilir]" : " [yalniz-ajan-hatti: base_url yok]");
    g.set(k, (g.get(k) || 0) + 1);
  }
  for (const [k, n] of [...g].sort()) console.log(String(n).padStart(3) + "  " + k);
  const ham = hedef.filter((t) => t.base).length;
  console.log(`TOPLAM=${hedef.length} model · ham-API olculabilir=${ham} · olcum disi (base_url yok)=${hedef.length - ham}`);
  console.log(`filtreler: --limit=${arg("limit", 99)} --providers=${only.join(",") || "tumu"}`);
  process.exit(0);
}

const rows = [];
for (const t of hedef) {
  const r = { provider: t.provider, model: t.model, erisim: t.base ? "ham-API" : "yalniz-ajan-hatti", tps: null, hizToken: 0, sn: 0, IQ: 0, iqDogru: [], iqKacan: [], terminal: null, termKacan: [], kod: null, uyum: null, reasoningKarakter: 0, bitis: null, context: null, maksCikis: null, fiyatG: null, fiyatC: null, tier: null, toolCall: null, promptCache: null, parametreler: null, swebench: null, terminalBench: null, aa: null, puanKaynak: null, hata: "" };
  if (!t.base) { r.hata = "base_url yok (ACP/native katalog) — ham API olcumu yapilamaz"; rows.push(r); console.log("ATLA " + t.provider + "/" + t.model + " :: " + r.hata); continue; }
  try {
    const rec = katalog(t.base, t.key)[t.model] || {};
    r.context = rec.context_length ?? rec.max_context_length ?? null;
    r.maksCikis = rec.max_completion_tokens ?? rec.max_output_tokens ?? null;
    r.fiyatG = rec.pricing?.input_usd_per_1m ?? null;
    r.fiyatC = rec.pricing?.output_usd_per_1m ?? null;
    r.tier = rec.tier ?? null;
    const params = Array.isArray(rec.supported_parameters) ? rec.supported_parameters : null;
    r.parametreler = params ? params.length : null;
    const tool = typeof rec.tool_call === "boolean" ? rec.tool_call : (params ? params.includes("tools") : null);
    r.toolCall = tool === null ? null : (tool ? "evet" : "hayir");
    r.promptCache = typeof rec.supports_prompt_cache === "boolean" ? (rec.supports_prompt_cache ? "evet" : "hayir") : null;
    const py = PUAN[t.model] || {};
    r.swebench = py.swebench ?? null; r.terminalBench = py.terminal_bench ?? null; r.aa = py.aa_intelligence ?? null; r.puanKaynak = py.kaynak ?? null;
    const h = await runTask(t.base, t.key, t.model, HIZ_PROMPT, 4000);
    r.sn = h.sn; r.hizToken = h.outToken; r.tps = h.outToken && h.sn ? +(h.outToken / h.sn).toFixed(1) : null; r.bitis = h.bitis; r.hata = h.hata || "";
    const q = await runTask(t.base, t.key, t.model, IQ_PROMPT, 12000);
    r.reasoningKarakter = q.reasoning.length;
    for (const [k, v] of Object.entries(KE)) {
      const re = new RegExp(k + "\\s*=\\s*\\**\\s*" + String(v).replace(".", "[.,]") + "\\b", "i");
      (re.test(q.txt) ? r.iqDogru : r.iqKacan).push(k + (re.test(q.txt) ? "" : "(" + v + ")"));
    }
    r.IQ = Math.round((r.iqDogru.length / Object.keys(KE).length) * 100);
    const te = await runTask(t.base, t.key, t.model, TERM_PROMPT, 3000);
    let tOk = 0;
    TERM.forEach((x, i) => {
      const satir = (te.txt.match(new RegExp("T" + (i + 1) + "\\s*=\\s*([^\\n]+)", "i")) || [])[1] || "";
      const kazan = x.fn ? x.fn(satir) : x.re.test(satir);
      if (kazan) tOk++; else r.termKacan.push("T" + (i + 1));
    });
    r.terminal = tOk + "/5";
    r.termOrnek = blok(te.txt).replace(/\s+/g, " ").slice(0, 240);
    const c = await runTask(t.base, t.key, t.model, KOD_PROMPT, 2000);
    const ko = kodOk(c.txt); r.kod = ko.pass ? "PASS" : "FAIL:" + ko.not; r.kodOrnek = fonkBul(c.txt).replace(/\s+/g, " ").slice(0, 110);
    const u = await runTask(t.base, t.key, t.model, UYUM_PROMPT, 300);
    const jso = dengeli(blok(u.txt), "{"); r.uyumOrnek = jso.slice(0, 90);
    try { const x = JSON.parse(jso); r.uyum = x && x.a === 1 && JSON.stringify(x.b) === "[2,3]" ? "PASS" : "FAIL"; } catch { r.uyum = "FAIL"; }
  } catch (e) { r.hata = "THROW " + e.message; }
  rows.push(r);
  console.log([t.provider, t.model, "speed t/s=" + r.tps, "IQ=" + r.IQ, "terminal=" + r.terminal, "kod=" + r.kod, "uyum=" + r.uyum, "akil=" + r.reasoningKarakter, "ctx=" + r.context, "maks=" + r.maksCikis, "fiyat=" + r.fiyatG + "/" + r.fiyatC, r.hata].join(" | "));
}

const olculen = rows.filter((r) => r.tps > 0).length;
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "bench.json"), JSON.stringify({ tarih: TODAY, hedef: hedef.length, olculen, rows }, null, 2));
fs.writeFileSync(path.join(OUT, "index.html"), HTML(rows, TODAY, hedef.length, olculen));
console.log(`YAZILDI ${path.join(OUT, "bench.json")} + index.html (olculen ${olculen}/${hedef.length})`);
process.exit(olculen > 0 ? 0 : 1);

function HTML(rows, tarih, hedef, olculen) {
  const COLS = [
    ["provider", "provider", "s"], ["model", "model", "s"], ["erisim", "erişim", "s"],
    ["tps", "speed t/s", "n"], ["IQ", "IQ (ölçüm)", "n", "puan"], ["terminal", "terminal (ölçüm)", "s", "metin"],
    ["kod", "kod (ölçüm)", "s", "metin"], ["uyum", "JSON uyum", "s", "metin"], ["reasoningKarakter", "akıl krk", "n"],
    ["context", "context", "n"], ["maksCikis", "maks çıkış", "n"], ["fiyatG", "$ girdi/1M", "n"], ["fiyatC", "$ çıktı/1M", "n"],
    ["tier", "tier", "s"], ["toolCall", "tool call", "s"], ["promptCache", "prompt cache", "s"], ["parametreler", "parametre sayısı", "n"],
    ["swebench", "SWE-bench *", "n", "puan"], ["terminalBench", "Terminal-Bench *", "n", "puan"], ["aa", "AA intelligence *", "n", "puan"],
    ["sn", "süre sn", "n"], ["bitis", "bitiş", "s"], ["puanKaynak", "puan kaynağı", "s"], ["hata", "hata", "s"],
  ];
  const data = JSON.stringify(rows).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Paseo model bench ${tarih}</title>
<style>
body{font:14px/1.45 ui-monospace,Menlo,Consolas,monospace;margin:24px;color:#111;background:#fafafa}
h1{font-size:18px;margin:0 0 4px} .ozet{color:#555;margin-bottom:14px;max-width:1100px}
input,select{font:inherit;padding:5px 8px;margin:0 8px 12px 0;border:1px solid #ccc;border-radius:6px;background:#fff}
table{border-collapse:collapse;width:100%;background:#fff}
th,td{border-bottom:1px solid #e5e5e5;padding:6px 8px;text-align:left;white-space:nowrap}
th{cursor:pointer;position:sticky;top:0;background:#f0f0f0} th:hover{background:#e2e2e2}
th.sirali{background:#d8e6ff}
td.n{text-align:right} .ok{color:#0a7a2f} .kotu{color:#b00020} .pas{color:#777}
tr.hatali td{background:#fff4f4}
</style></head><body>
<h1>Paseo model benchmark — ${tarih}</h1>
<div class="ozet">Hedef: <b>${hedef}</b> model · Ölçülen: <b>${olculen}</b> · Uç: ham API (chat/completions → responses yedeği).<br>
<b>(ölçüm)</b> bu araçla bugün ölçüldü: speed t/s = çıktı token / saniye · IQ = 6 soruluk hesap/kombinatorik · terminal = 5 komut-yazımı sorusu (satır bazlı kalıp + <code>dd</code> için bayt matematiği) · kod = vm sandbox'ında çalıştırılan fonksiyon · JSON uyum = şema kontrolü · akıl krk = reasoning karakteri. Renklendirme yalnız puan/metin sütunlarında; süre, context, fiyat gibi nicelikler tarafsız.<br>
<b>Katalog</b> alanları provider'ın kendi <code>/models</code> cevabından: context, maks çıkış, fiyat, tier, tool call, prompt cache, desteklenen parametre sayısı.<br>
<b>*</b> ile işaretli sütunlar <u>dış kaynaklı yayımlanmış puandır, burada ölçülmedi</u>; değerler <code>scripts/bench-puanlari.json</code> içinde URL'li kaynağıyla durur, kaynaksız model <code>—</code> görünür (bu "puan yok" demektir, sıfır değil). Sütun başlığına tıklayarak sırala.</div>
<input id="q" placeholder="model/provider ara…" oninput="ciz()">
<select id="f" onchange="ciz()"><option value="">tümü</option><option value="olc">sadece ölçülen</option><option value="hata">sadece hatalı</option><option value="yayin">sadece yayımlı puanı olan</option></select>
<table><thead><tr id="th"></tr></thead><tbody id="tb"></tbody></table>
<script>
const R=${data};
const COLS=${JSON.stringify(COLS)};
let key=3,asc=false;
const sinif=(p,v)=>{if(v==null||v==='')return 'pas';const s=String(v);if(p==='puan'){const x=Number(s);return x>=100?'ok':(x>0&&x<50?'kotu':'')}if(p==='metin')return /^PASS$|^[45][/][5]$/.test(s)?'ok':(/^FAIL|^ATLA|^yok|^[012][/][5]$/.test(s)?'kotu':'');return ''};
function thOlustur(){document.getElementById('th').textContent='';COLS.forEach((c,i)=>{const th=document.createElement('th');th.textContent=c[1]+(key===i?(asc?' ▲':' ▼'):'');th.onclick=()=>sirala(i);document.getElementById('th').appendChild(th)});}
function sirala(i){asc=(key===i)?!asc:true;key=i;ciz();}
function ciz(){
  const q=document.getElementById('q').value.toLowerCase(),f=document.getElementById('f').value;
  let r=R.filter(x=>(!q||(x.provider+' '+x.model).toLowerCase().includes(q))&&(f!=='olc'||x.tps>0)&&(f!=='hata'||(x.hata||'').length>0)&&(f!=='yayin'||x.swebench!=null||x.terminalBench!=null||x.aa!=null));
  r.sort((a,b)=>{const k=COLS[key][0];let A=a[k],B=b[k];const bosA=A==null||A==='',bosB=B==null||B==='';if(bosA&&bosB)return 0;if(bosA)return 1;if(bosB)return -1;if(typeof A==='string'||typeof B==='string'){A=String(A);B=String(B);return asc?A.localeCompare(B,'tr'):B.localeCompare(A,'tr')}return asc?A-B:B-A});
  const tb=document.getElementById('tb');tb.textContent='';
  for(const x of r){
    const tr=document.createElement('tr');if((x.hata||'').length)tr.className='hatali';
    for(const [k,label,t,p] of COLS){
      const td=document.createElement('td');
      const ham=x[k];const bos=ham==null||ham==='';
      if(t==='n'&&!bos)td.className='n';
      const v=bos?'—':ham;
      if(k!=='provider'&&k!=='model'&&k!=='erisim')td.className+=' '+sinif(p,bos?'':ham);
      td.textContent=String(v).slice(0,120);tr.appendChild(td);
    }
    tb.appendChild(tr);
  }
  if(!r.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=COLS.length;td.textContent='sonuç yok';tr.appendChild(td);tb.appendChild(tr)}
  thOlustur();
}
ciz();
</script></body></html>`;
}
