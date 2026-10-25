#!/usr/bin/env node
// Repo uygunluk katmani: bench.json + uygunluk-hedefi.json -> puan + kapı kararı.
// Vanilla Node, bagimlilik yok. Mevcut harness'e (scripts/bench.mjs) DOKUNMAZ; onun ciktisini okur.
//
// Kullanim:
//   node scripts/uygunluk.mjs                          # en son raporlar/bench-*/bench.json
//   node scripts/uygunluk.mjs --rapor=<yol>            # tek rapor
//   node scripts/uygunluk.mjs --rapor=<a.json> --rapor=<b.json>   # birlestirilmis gorunum
//   node scripts/uygunluk.mjs --profil=<yol>           # baska proje profili (varsayilan scripts/uygunluk-hedefi.json)
//   node scripts/uygunluk.mjs --kiyasla=<onceki.json>  # puan deltalari
//   node scripts/uygunluk.mjs --kural                  # yalniz gate huku satirlari (schedule icin)
//   node scripts/uygunluk.mjs --cikis=<yol>            # uygunluk.json + uygunluk.md yaz (varsayilan: rapor dizini)
//
// Cikis kodu: 0 = gate gecti, 1 = gate kirildi (gate uygulanan seviyedeki model esigi tutmadi veya olcum eksik), 2 = kullanim/veri hatasi.

import fs from "node:fs";
import path from "node:path";

const arg = (k, d) => { const m = process.argv.find((a) => a.startsWith(`--${k}=`)); return m ? m.split("=").slice(1).join("=") : d; };
const all = (k) => process.argv.filter((a) => a.startsWith(`--${k}=`)).map((a) => a.split("=").slice(1).join("="));
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, "").replace(/\/scripts$/, "")), "..");
const kok = (p) => path.resolve(process.cwd(), p);

const PROFIL_YOLU = kok(arg("profil", path.join(REPO, "scripts", "uygunluk-hedefi.json")));
if (!fs.existsSync(PROFIL_YOLU)) { console.error("HATA profil yok: " + PROFIL_YOLU); process.exit(2); }
const P = JSON.parse(fs.readFileSync(PROFIL_YOLU, "utf8"));
const W = P.agirliklar, KAP = P.kapilar, O = P.olcekler || {};
const GATE = new Set(P.gateUygulananSeviyeler || ["anaYazar", "gunluk"]);

let DIS = {};
try { DIS = (JSON.parse(fs.readFileSync(kok(path.join(REPO, "scripts", "bench-puanlari.json")), "utf8")).models || {}); } catch { }

// ---- rapor secimi: verilenler, yoksa en yeni raporlar/bench-*/bench.json
function enYeniRapor() {
  const kokD = kok(path.join(REPO, "raporlar"));
  if (!fs.existsSync(kokD)) return null;
  const aday = fs.readdirSync(kokD).filter((d) => /^bench-/.test(d) && fs.existsSync(path.join(kokD, d, "bench.json")));
  if (!aday.length) return null;
  aday.sort();
  return path.join(kokD, aday[aday.length - 1], "bench.json");
}
const RAPORLAR = all("rapor").map(kok);
if (!RAPORLAR.length) { const r = enYeniRapor(); if (!r) { console.error("HATA rapor yok (raporlar/bench-*/bench.json bulunamadi)"); process.exit(2); } RAPORLAR.push(r); }
const satirlar = [];
for (const f of RAPORLAR) {
  if (!fs.existsSync(f)) { console.error("HATA rapor yok: " + f); process.exit(2); }
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  if (!Array.isArray(j.rows)) {
    console.error("HATA " + path.relative(REPO, f).replace(/\\/g, "/") + " bench.json formatinda degil (rows dizisi yok). --rapor yalnizca scripts/bench.mjs ciktisi alir; uygunluk.json icin --kiyasla kullan.");
    process.exit(2);
  }
  for (const r of j.rows || []) satirlar.push({ ...r, _rapor: path.relative(REPO, f).replace(/\\/g, "/"), _tarih: j.tarih || "", _mtime: fs.statSync(f).mtimeMs });
}
const anahtar = (r) => r.provider + "/" + r.model;

// ---- birlestirme: ayni model icin en guncel ve EN DOLU satir kazanir
// oncelik sirasi: doluluk (bos alan az) > tarih > dosya mtime (ayni tarihte sonra yazilan kazanir)
const doluluk = (r) => ["tps", "terminal", "kod", "IQ", "context", "uyum"].filter((k) => r[k] !== null && r[k] !== undefined && r[k] !== "").length;
const sira = (r) => [doluluk(r), String(r._tarih), String(r._mtime || 0)];
const dahaYeni = (a, b) => { const A = sira(a), B = sira(b); for (let i = 0; i < A.length; i++) { if (A[i] > B[i]) return true; if (A[i] < B[i]) return false; } return false; };
const birlesmis = new Map();
for (const r of satirlar) {
  const k = anahtar(r), v = birlesmis.get(k);
  if (!v || dahaYeni(r, v)) birlesmis.set(k, r);
}
const modeller = [...birlesmis.values()].sort((a, b) => anahtar(a).localeCompare(anahtar(b), "tr"));

// ---- puanlama (deterministik; agirliklar profilden)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const termPuan = (s) => { const m = /^([0-5])\/5$/.exec(String(s || "")); return m ? +m[1] : null; };
const kodPuan = (s) => (s === "PASS" ? 1 : s ? 0 : null);

function puanla(r) {
  const bilesen = {}, eksik = [];
  const t = termPuan(r.terminal), k = kodPuan(r.kod);
  if (t === null || k === null) eksik.push(t === null ? "terminal" : "kod");
  else bilesen.kodTerminal = +(15 * (t / 5) + 10 * k).toFixed(1);

  const ctx = Number(r.context) || null;
  if (!ctx) eksik.push("context");
  else bilesen.baglam = +(clamp(((ctx - (O.ctxAlt ?? 65536)) / ((O.ctxUst ?? 1048576) - (O.ctxAlt ?? 65536))), 0, 1) * W.baglam).toFixed(1);

  const rk = Number(r.reasoningKarakter) || 0;
  bilesen.uzunUfuk = +(clamp(rk / (O.reasoningCok ?? 4000), 0, 1) * W.uzunUfuk).toFixed(1);
  if (rk === 0) bilesen.uzunUfuk = Math.min(bilesen.uzunUfuk, 4);

  const hata = String(r.hata || "");
  let erisim = null;
  if (/403|access denied|not_allowed/i.test(hata)) erisim = 2;
  else if (/402|balance|bakiye|quota|rate limit/i.test(hata)) erisim = 4;
  else if (hata || !r.tps) erisim = 0;
  else erisim = 20;
  bilesen.erisim = erisim;

  const tps = Number(r.tps) || null;
  if (!tps) eksik.push("hiz");
  else bilesen.hiz = +(clamp(((tps - (O.tpsAlt ?? 5)) / ((O.tpsUst ?? 250) - (O.tpsAlt ?? 5))), 0, 1) * W.hiz).toFixed(1);

  let ag = 0;
  if (r.toolCall === "evet") ag += 6;
  if (Number(r.parametreler) >= 8) ag += 2;
  if (r.uyum === "PASS") ag += 2;
  bilesen.agentik = ag;
  if (r.toolCall === null || r.toolCall === undefined) eksik.push("toolCall");

  const tplam = W.kodTerminal + W.baglam + W.uzunUfuk + W.erisim + W.hiz + W.agentik;
  const dolu = Object.values(bilesen).reduce((s, v) => s + v, 0);
  return { bilesen, eksik, puan: eksik.length ? null : +dolu.toFixed(1), tavan: tplam };
}

// ---- kapilar
function kapilar(r, puan) {
  const k = [], g = (ad, kosul, olcum) => k.push({ ad, gecti: !!kosul, olcum: olcum ?? null });
  const t = termPuan(r.terminal), tmin = termPuan(KAP.minTerminal) ?? 4;
  g("terminal >= " + KAP.minTerminal, t !== null && t >= tmin, r.terminal ?? "olculmedi");
  g("kod " + KAP.kodSart, kodPuan(r.kod) === 1, r.kod ?? "olculmedi");
  g("IQ >= " + KAP.minIQ, Number(r.IQ) >= KAP.minIQ, r.IQ ?? "olculmedi");
  g("ctx >= " + KAP.minCtx, Number(r.context) >= KAP.minCtx, r.context ?? "yayimlanmamis");
  g("tps >= " + KAP.minTps, Number(r.tps) >= KAP.minTps, r.tps ?? "olculmedi");
  for (const y of KAP.gerekenYetenekler || []) g("yetenek: " + y, r[y] === "evet", r[y] ?? "bilinmiyor");
  return k;
}

// ---- satirlari degerlendir
const sonuc = modeller.map((r) => {
  const anahtarId = anahtar(r);
  const hedef = P.modeller[anahtarId] || P.modeller[r.model] || null;
  const p = puanla(r);
  const ks = kapilar(r, p);
  const kalan = ks.filter((x) => !x.gecti);
  const seviye = hedef ? hedef.seviye : (p.puan === null ? "aday" : "yedek");
  let karar;
  if (seviye === "red") karar = "RED";
  else if (p.puan === null) karar = "BEKLENIYOR";
  else if (!kalan.length) karar = "KABUL";
  else karar = "KIRIK";
  const dis = DIS[r.model] || null;
  return { ...r, _anahtar: anahtarId, _seviye: seviye, _gerekce: hedef ? (hedef.gerekce || "") : "profilde tanimsiz", _kosul: hedef ? (hedef.kosul || "") : "", puan: p.puan, bilesen: p.bilesen, eksik: p.eksik, tavan: p.tavan, kapilar: ks, karar, dis };
});

// profilde tanimli ama hic olculmemis modeller
const olculemeyenler = Object.entries(P.modeller)
  .filter(([id]) => !sonuc.some((s) => s._anahtar === id || s.model === id))
  .map(([id, h]) => ({ anahtar: id, seviye: h.seviye, kosul: h.kosul || "", gerekce: h.gerekce || "", karar: "HIC-OLCUMEDI" }));

const sirali = [...sonuc].sort((a, b) => (b.puan ?? -1) - (a.puan ?? -1) || a._anahtar.localeCompare(b._anahtar, "tr"));
// ana yazar boslugu: hicbir model seviye=anaYazar ve KABUL degilse gate kirik sayilir (yazacak model yok)
const anaYazarlar = sirali.filter((s) => s._seviye === "anaYazar");
const anaYazarYok = !anaYazarlar.some((s) => s.karar === "KABUL");
const gateKirilani = sirali.filter((s) => GATE.has(s._seviye) && s.karar !== "KABUL");
const gateMetni = anaYazarYok
  ? "KIRILDI -> ana yazar yok (" + (anaYazarlar.length ? anaYazarlar.map((s) => s._anahtar + "=" + s.karar).join(", ") : "profilde anaYazar seviyesi tanimli degil") + ")" + (gateKirilani.length ? " + " + gateKirilani.map((s) => s._anahtar).join(", ") : "")
  : gateKirilani.length ? "KIRILDI -> " + gateKirilani.map((s) => s._anahtar).join(", ") : "GECTI";

// ---- kiyasla
let deltalar = null;
const oncekiYol = arg("kiyasla", null);
if (oncekiYol) {
  const o = JSON.parse(fs.readFileSync(kok(oncekiYol), "utf8"));
  const om = new Map((o.sonuc || []).map((s) => [s.anahtar, s.puan]));
  deltalar = sirali.filter((s) => om.has(s._anahtar) && s.puan !== null).map((s) => ({ anahtar: s._anahtar, yeni: s.puan, eski: om.get(s._anahtar), delta: +(s.puan - om.get(s._anahtar)).toFixed(1) }));
}

// ---- markdown
function md() {
  const L = [];
  L.push(`# UYGUNLUK — ${P.proje} · ${new Date().toISOString().slice(0, 10)}`);
  L.push(`Profil: \`${path.relative(REPO, PROFIL_YOLU).replace(/\\/g, "/")}\` · Rapor: ${RAPORLAR.map((r) => path.relative(REPO, r).replace(/\\/g, "/")).join(", ")}`);
  L.push(`Agirliklar: ` + Object.entries(W).map(([k, v]) => `${k}=${v}`).join(" · "));
  L.push(`Kapilar: terminal >= ${KAP.minTerminal} · kod ${KAP.kodSart} · IQ >= ${KAP.minIQ} · ctx >= ${KAP.minCtx} · tps >= ${KAP.minTps} · zorunlu: ${(KAP.gerekenYetenekler || []).join(", ")}`);
  L.push("");
  L.push(`| # | model | seviye | karar | puan | kod+term | baglam | uzun ufuk | erisim | hiz | agentik | terminal | kod | IQ | tps | ctx | dis puan* |`);
  L.push(`|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|`);
  sirali.forEach((s, i) => {
    const b = s.bilesen || {};
    const d = s.dis ? [s.dis.benchalign_coding ?? null, s.dis.benchalign_agentic ?? null].filter((x) => x !== null).join(" / ") : "";
    L.push(`| ${i + 1} | ${s._anahtar} | ${s._seviye} | **${s.karar}** | ${s.puan ?? "—"} | ${b.kodTerminal ?? "—"} | ${b.baglam ?? "—"} | ${b.uzunUfuk ?? "—"} | ${b.erisim ?? "—"} | ${b.hiz ?? "—"} | ${b.agentik ?? "—"} | ${s.terminal ?? "—"} | ${s.kod ?? "—"} | ${s.IQ ?? "—"} | ${s.tps ?? "—"} | ${s.context ?? "—"} | ${d || "—"} |`);
  });
  L.push("");
  L.push("## Kapı kırıkları");
  const kirik = sirali.filter((s) => s.karar === "KIRIK");
  if (!kirik.length) L.push("Kapı kırığı yok.");
  for (const s of kirik) L.push(`- **${s._anahtar}** (${s._seviye}): ` + s.kapilar.filter((k) => !k.gecti).map((k) => `${k.ad}=${k.olcum}`).join(", "));
  L.push("");
  L.push("## Hiç ölçülmemiş (hedef bekleniyor)");
  if (!olculemeyenler.length) L.push("Yok.");
  for (const m of olculemeyenler) L.push(`- **${m.anahtar}** [${m.seviye}] — ${m.gerekce}${m.kosul ? " · koşul: " + m.kosul : ""}`);
  L.push("");
  L.push("## Profilde olup raporda olmayan modeller için koşul");
  for (const m of olculemeyenler) L.push(`- ${m.anahtar}: ${m.kosul || "(koşul yazılmamış — profille)"}.`);
  if (deltalar) {
    L.push("");
    L.push("## Kıyaslama (puan deltaları)");
    for (const d of deltalar) L.push(`- ${d.anahtar}: ${d.eski} -> ${d.yeni} (${d.delta >= 0 ? "+" : ""}${d.delta})`);
  }
  L.push("");
  L.push("## Kural çizgisi");
  L.push(`- Gate uygulanan seviyeler: ${[...GATE].join(", ")}`);
  L.push(`- Gate sonucu: ${gateMetni}`);
  L.push(`- Ana yazar boşluğu: ${anaYazarYok ? "VAR (yazacak model yok)" : "yok"}`);
  L.push("- Puan = yalnız yerel ölçüm (bench.json). `*` dış puan karar puanına karıştırılmaz.");
  return L.join("\n");
}

// ---- konsol
const y = (n, w = 6) => String(n ?? "—").padStart(w);
console.log("MODEL".padEnd(46) + "SEVIYE".padEnd(10) + "KARAR".padEnd(13) + "PUAN" + "  " + ["kod+trm", "baglam", "uzunuf", "erisim", "hiz", "agtk"].map((h) => h.padStart(8)).join(""));
for (const s of sirali) {
  const b = s.bilesen || {};
  console.log(s._anahtar.slice(0, 45).padEnd(46) + String(s._seviye).padEnd(10) + String(s.karar).padEnd(13) + y(s.puan, 5) + "  "
    + [b.kodTerminal, b.baglam, b.uzunUfuk, b.erisim, b.hiz, b.agentik].map((v) => y(v, 8)).join(""));
}
const kirikSatir = sirali.filter((s) => s.karar === "KIRIK");
if (kirikSatir.length) { console.log("\nKAPI KIRIK:"); for (const s of kirikSatir) console.log(`  ${s._anahtar}: ` + s.kapilar.filter((k) => !k.gecti).map((k) => `${k.ad}=${k.olcum}`).join(", ")); }
if (olculemeyenler.length) { console.log("\nHIC-OLCUMEDI (hedef bekleniyor):"); for (const m of olculemeyenler) console.log(`  ${m.anahtar} [${m.seviye}] kosul: ${m.kosul || "-"}`); }
if (deltalar) { console.log("\nDELTA:"); for (const d of deltalar) console.log(`  ${d.anahtar}: ${d.eski} -> ${d.yeni} (${d.delta >= 0 ? "+" : ""}${d.delta})`); }
console.log("\nGATE: " + gateMetni);

if (process.argv.includes("--kural")) process.exit(gateMetni.startsWith("GECTI") ? 0 : 1);

// ---- yaz
const cikis = kok(arg("cikis", path.dirname(RAPORLAR[0])));
const cikisJson = path.join(cikis, "uygunluk.json");
const cikisMd = path.join(cikis, "uygunluk.md");
fs.mkdirSync(cikis, { recursive: true });
const govde = {
  tarih: new Date().toISOString().slice(0, 10), profil: path.relative(REPO, PROFIL_YOLU).replace(/\\/g, "/"),
  raporlar: RAPORLAR.map((r) => path.relative(REPO, r).replace(/\\/g, "/")),
  agirliklar: W, kapilar: KAP, gateUygulananSeviyeler: [...GATE],
  sonuc: sirali.map((s) => ({ anahtar: s._anahtar, model: s.model, provider: s.provider, seviye: s._seviye, karar: s.karar, puan: s.puan, tavan: s.tavan, bilesen: s.bilesen, eksik: s.eksik, terminal: s.terminal, kod: s.kod, IQ: s.IQ, tps: s.tps, context: s.context, erisim: s.erisim, hata: s.hata, gerekce: s._gerekce, kosul: s._kosul, kapilar: s.kapilar })),
  hicOlcumedi: olculemeyenler, deltalar,
  gate: { sonuc: gateMetni.startsWith("GECTI") ? "GECTI" : "KIRILDI", anaYazarYok, kirilan: gateKirilani.map((s) => s._anahtar) },
};
fs.writeFileSync(cikisJson, JSON.stringify(govde, null, 2));
fs.writeFileSync(cikisMd, md());
console.log(`YAZILDI ${cikisJson} + ${cikisMd}`);
process.exit(gateMetni.startsWith("GECTI") ? 0 : 1);