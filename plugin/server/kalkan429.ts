import { mkdirSync, openSync, writeSync, fsyncSync, closeSync, readFileSync, existsSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PluginTurnOutcome } from "@getpaseo/plugin/server";
import { temizlikKaydet } from "./temizlik";

// PK-1 (429-kalkani, 2026-11-01): coklu-proje paralel calismada paylasilan saglayici RPM'i asilince
// gelen 429'leri gor, olc, kontrol et. Uc parca tek modulde:
//   PK-a — agent.turn_ended 'failed' turunde 429/rate-limit/RPM desenini siniflandirip append-only deftere yazar.
//   PK-b — agent.create oncesinde son pencerede >=2 429 varsa yeni spawn RED (hata firlatma = olusturma iptali).
//   PK-c — 429'lu tur sonrasi zamanlanmis dirilme (setTimeout; 30 sn handler timeout'u BEKLEMEZ, plan kurar).
// DURUST SINIRLAR:
//   - Event'ler best-effort: kacan 429 olabilir -> defter ALT SINIR gostergesidir (abartili yorum yasak).
//   - Reload'da zamanlanmis dirilmeler kaybolur (best-effort); defter kaydi kalici kalir.
//   - Defter satirinda gizli deger YOKTUR: error metninden yalnizca sinif etiketi cikarilir.
//   - Bu kapi yalniz Paseo AJAN filosunu kapatir; daemon-disi (Claude Code sekmesi vb.) istekleri gormez.

export const VARSAYILAN_PENCERE_MS = 10 * 60_000;
export const VARSAYILAN_DIRILME_MS = 12 * 60_000;
export const VARSAYILAN_ESIK = 2;
export const MAKS_OTOMATIK_DIRILME = 2;
export const DIRILME_MESAJI = "429 penceresi geçti — kaldığın işten kalıcı kayıtlardan devam et";

// Defter satiri: hata metni ASLA girmez; yalniz sinif etiketi. tip='kapi-red' satirlari
// gate retleridir ve pencere sayacina GIRMEZ (kendi kendini besleyen kirmizi pencere olmasin).
export interface DefterSatiri {
  damgaISO: string;
  agentId: string;
  workspaceId: string | null;
  provider: string;
  hataSinifi: string;
  tip: "429" | "kapi-red";
}

// BUG-2026-10-25 ailesi: Paseo plugin kodunu eval baglaminda yukler; orada import.meta.url
// TANIMSIZDIR. Kok turetimi pano.ts'in B20 notundaki gibi iki adimlidir (ORDU_429_DEFTER gecersiz kilar).
export function defterYolu(): string {
  const cevr = process.env.ORDU_429_DEFTER;
  if (cevr !== undefined && cevr.trim() !== "") return cevr;
  const modulKok = typeof import.meta.url === "string" ? dirname(fileURLToPath(import.meta.url)) : null;
  return modulKok !== null
    ? join(modulKok, "..", "data", "429-defter.jsonl")
    : join("D:\\Vibecode\\ordu\\plugin", "data", "429-defter.jsonl");
}

const DES429: Array<{ sinif: string; desen: RegExp }> = [
  { sinif: "http-429", desen: /\b429\b/ },
  { sinif: "rate-limit", desen: /\brate[\s_-]?limit/i },
  { sinif: "rpm", desen: /\brpm\b|\brequests?\s+per\s+minute\b/i },
];

// error metninden yalnizca SINIF etiketi cikarilir — metin, token, anahtar deftere asla gecmez.
export function hataSinifiBul(error: { message: string; code?: string } | string | null | undefined): string | null {
  const metin = typeof error === "string" ? error : error ? (error.code ?? "") + " " + (error.message ?? "") : "";
  if (!metin) return null;
  for (const d of DES429) {
    if (d.desen.test(metin)) return d.sinif;
  }
  return null;
}

// D2-08 ailesi: rotasyonsuz buyume engeli (telemetri.jsonl ile ayni tavan/koruma).
const ROTASYON_TAVAN = 5 * 1024 * 1024;
const ROTASYON_KORU = 2 * 1024 * 1024;

function defterRotasyon(dosya: string): void {
  try {
    if (!existsSync(dosya)) return;
    if (statSync(dosya).size <= ROTASYON_TAVAN) return;
    const icerik = readFileSync(dosya, "utf8");
    const korunan = icerik.slice(-ROTASYON_KORU);
    const ilkNl = korunan.indexOf("\n");
    writeFileSync(dosya, ilkNl >= 0 ? korunan.slice(ilkNl + 1) : korunan, "utf8");
  } catch (error) {
    console.error("[paseo-verimlilik] 429 defter rotasyon hatasi", error);
  }
}

// Append-only + fsync: kapanis aninda satir diskte durur (append-only sozlesmesi; rotasyon
// istisnasi yukarida). Yazim hatasi YUTULUR — event akisini bloke etmez (best-effort eventler).
export function kayit429(satir: Omit<DefterSatiri, "tip" | "damgaISO"> & { tip?: DefterSatiri["tip"] }): void {
  try {
    const dosya = defterYolu();
    defterRotasyon(dosya);
    mkdirSync(dirname(dosya), { recursive: true });
    const tam: DefterSatiri = {
      damgaISO: new Date().toISOString(),
      agentId: satir.agentId,
      workspaceId: satir.workspaceId,
      provider: satir.provider,
      hataSinifi: satir.hataSinifi,
      tip: satir.tip ?? "429",
    };
    const fd = openSync(dosya, "a");
    try {
      writeSync(fd, Buffer.from(JSON.stringify(tam) + "\n", "utf8"));
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
  } catch (error) {
    console.error("[paseo-verimlilik] 429 defter yazim hatasi (best-effort, akis devam eder)", error);
  }
}

interface OkunanSatir extends DefterSatiri {
  ts: number;
}

function satirlariOku(dosya: string): OkunanSatir[] {
  if (!existsSync(dosya)) return [];
  let metin: string;
  try {
    metin = readFileSync(dosya, "utf8");
  } catch (error) {
    // Defter okunamiyorsa (izin/kilit/EISDIR) sayac 0 kabul edilir: kanit yok → RED yok.
    // Okuma hatasi asla kapiyi kirletmez — agent.create akisini bozmak yasak (PK davranis garantisi).
    console.error("[paseo-verimlilik] 429 defter okuma hatasi (sayac 0 kabul, izin verilir)", error);
    return [];
  }
  const cikti: OkunanSatir[] = [];
  for (const satir of readFileSync(dosya, "utf8").split(/\r?\n/)) {
    if (!satir.trim()) continue;
    try {
      const k = JSON.parse(satir) as Partial<DefterSatiri>;
      const ts = Date.parse(k.damgaISO ?? "");
      if (!Number.isFinite(ts)) continue;
      cikti.push({
        damgaISO: k.damgaISO ?? "",
        agentId: k.agentId ?? "-",
        workspaceId: k.workspaceId ?? null,
        provider: k.provider ?? "-",
        hataSinifi: k.hataSinifi ?? "-",
        tip: k.tip ?? "429",
        ts,
      });
    } catch {
      // bozuk satir atlanir (defter alt-sinir gostergesi; durust okuma)
    }
  }
  return cikti;
}

// Pencere sayaci: tip==='429' satirlarindan [simdi-ms, simdi+60sn] araliginda kalanlar.
// +60sn toleransi: daemon restart / saat duzeltmesi kucuk ileri kaymalari cezalandirmasin.
// Kapi-red satirlari SAYILMAZ (sayac kendi retlerini okuyup pencereyi sonsuz kirmizi tutamaz).
function pencereOlaylari(ms: number, simdi: number): OkunanSatir[] {
  return satirlariOku(defterYolu()).filter(
    (s) => s.tip === "429" && s.ts >= simdi - ms && s.ts <= simdi + 60_000,
  );
}

// PK-a sayac API'si: son n dakikada kac 429 (defterden okur).
export function sonNdk(dk: number, simdi: number = Date.now()): number {
  return pencereOlaylari(dk * 60_000, simdi).length;
}

function pozitifEnv(ad: string, dusus: number): number {
  const ham = process.env[ad];
  if (ham === undefined || ham.trim() === "") return dusus;
  const n = Number(ham);
  return Number.isFinite(n) && n > 0 ? n : dusus;
}

export function pencereMsOku(): number {
  return pozitifEnv("ORDU_429_PENCERE_MS", VARSAYILAN_PENCERE_MS);
}

export function dirilmeMsOku(): number {
  return pozitifEnv("ORDU_429_DIRILME_MS", VARSAYILAN_DIRILME_MS);
}

export interface KapiKarar {
  red: boolean;
  mesaj: string | null;
  sayac: number;
  pencereMs: number;
  kalanMs: number | null;
}

// PK-b pencere kapisi. ORDU_429_KAPI=0 -> kapali: red=YOK, deftere de kapi-red YAZILMAZ;
// agent.create akisi mevcut haliyle surer. Varsayilan ACIK (fail-closed yonu).
export function kapiKontrol(provider: string | null): KapiKarar {
  const pencereMs = pencereMsOku();
  const simdi = Date.now();
  if (process.env.ORDU_429_KAPI === "0") {
    return { red: false, mesaj: null, sayac: 0, pencereMs, kalanMs: null };
  }
  const olaylar = pencereOlaylari(pencereMs, simdi);
  if (olaylar.length < VARSAYILAN_ESIK) {
    return { red: false, mesaj: null, sayac: olaylar.length, pencereMs, kalanMs: null };
  }
  const enEski = Math.min(...olaylar.map((o) => o.ts));
  const kalanMs = Math.max(60_000, enEski + pencereMs - simdi);
  const kalanDk = Math.max(1, Math.ceil(kalanMs / 60_000));
  const mesaj =
    `429 penceresi açık — son ${Math.round(pencereMs / 60_000)} dakikada ${olaylar.length} adet 429 ` +
    `(eşik ${VARSAYILAN_ESIK}); ~${kalanDk} dk sonra tekrar dene. Defter: ${defterYolu()}`;
  // RED deftere islenir (operator gorunurlugu); sayac kapi-red okumadigi icin pencere sismez.
  kayit429({ tip: "kapi-red", agentId: "-", workspaceId: null, provider: provider ?? "-", hataSinifi: "kapi-red" });
  return { red: true, mesaj, sayac: olaylar.length, pencereMs, kalanMs };
}

// --- PK-c: zamanlanmis dirilme -------------------------------------------------------------
// Ajan basina sayac: en fazla 2 otomatik deneme, sonra insan kapisi. Basarili (completed) tur
// firtinanin bittigini kanitlar -> bekleyen dirilme iptal + sayac sifir (ajan yeni bir 429
// firtinasinda taze butceyle baslar). Reload'da planlar kaybolur (best-effort) — defter kalir.
interface DirilmeState {
  sayac: number;
  zamanlayici: ReturnType<typeof setTimeout> | null;
}

const dirilmeDurumu = new Map<string, DirilmeState>();

function dirilmeTemizle(agentId: string): void {
  const s = dirilmeDurumu.get(agentId);
  if (!s) return;
  if (s.zamanlayici !== null) clearTimeout(s.zamanlayici);
  dirilmeDurumu.delete(agentId);
}

// K-0025 (A2-1): agent.closed sonrasi bellek sizintisi + kapanmis ajana gec dirilme yok.
temizlikKaydet((agentId) => dirilmeTemizle(agentId));

export function dirilmePlanla(agentId: string, gonder: () => Promise<void>): boolean {
  const s = dirilmeDurumu.get(agentId);
  if (s !== undefined && s.zamanlayici !== null) return false; // bekleyen dirilme var: cift plan yok
  const mevcut: DirilmeState = s ?? { sayac: 0, zamanlayici: null };
  if (mevcut.sayac >= MAKS_OTOMATIK_DIRILME) {
    console.error(`[paseo-verimlilik] 429 dirilme insan kapisi: ${agentId} — ${mevcut.sayac} otomatik deneme tukendi`);
    return false;
  }
  const ms = dirilmeMsOku();
  mevcut.sayac += 1;
  const zamanlayici = setTimeout(() => {
    const st = dirilmeDurumu.get(agentId);
    if (st !== undefined) st.zamanlayici = null; // sayac kalir: ust sinir tuketildi
    try {
      gonder().catch((e) => console.error(`[paseo-verimlilik] 429 dirilme gonderim hatasi: ${agentId}`, e));
    } catch (e) {
      console.error(`[paseo-verimlilik] 429 dirilme tetikleme hatasi: ${agentId}`, e);
    }
  }, ms);
  (zamanlayici as { unref?: () => void }).unref?.(); // daemon kapanisini 12 dk bekletme
  mevcut.zamanlayici = zamanlayici;
  dirilmeDurumu.set(agentId, mevcut);
  return true;
}

export function _testIcinDirilmeDurumu(agentId: string): { sayac: number; bekleyen: boolean } | null {
  const s = dirilmeDurumu.get(agentId);
  return s === undefined ? null : { sayac: s.sayac, bekleyen: s.zamanlayici !== null };
}

// Plugin unload (reload/disable/remove): butun zamanlanmis dirilmeler iptal.
export function dirilmeKapat(): void {
  for (const s of dirilmeDurumu.values()) {
    if (s.zamanlayici !== null) clearTimeout(s.zamanlayici);
  }
  dirilmeDurumu.clear();
}

// --- turn_ended entegrasyon noktasi ---------------------------------------------------------
// completed -> dirilme iptal + sayac sifir; failed+429 -> defter + dirilme plani; canceled -> dokunma.
export function turn429Isle(
  ajan: { id: string; workspaceId: string | null; provider: string },
  outcome: PluginTurnOutcome,
  gonder: () => Promise<void>,
): void {
  if (outcome.kind === "completed") {
    dirilmeTemizle(ajan.id);
    return;
  }
  if (outcome.kind !== "failed") return;
  const sinif = hataSinifiBul(outcome.error);
  if (sinif === null) return;
  kayit429({ agentId: ajan.id, workspaceId: ajan.workspaceId, provider: ajan.provider, hataSinifi: sinif });
  dirilmePlanla(ajan.id, gonder);
}
