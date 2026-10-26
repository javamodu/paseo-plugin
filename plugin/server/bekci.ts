import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PluginHookAgent } from "@getpaseo/plugin/server";
import { katmanKokuBul } from "./sozlesme";
import { ayarOku } from "./ayar";

export interface BekciAnomali {
  anahtar: string;
  detay: string;
}

export interface KomutSonuc {
  cikti: string;
  kod: number;
}

export type KomutCalistir = (komut: string[], cwd: string) => KomutSonuc | Promise<KomutSonuc>;

const TARAMA_MS = 15 * 60_000;
const FAIL_PENCERE_TUR = 20;
const FAIL_ORAN_ESIK = 0.25;
const FAIL_MIN_TUR = 5;

// K-0029 (A2-8): execFileSync event loop'u 90sn bloke ediyordu — async execFile.
const execFileAsync = promisify(execFile);
export const gercekCalistir: KomutCalistir = async (komut, cwd) => {
  try {
    const { stdout } = await execFileAsync(komut[0], komut.slice(1), { cwd, timeout: 90_000, encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
    return { cikti: stdout, kod: 0 };
  } catch (error) {
    const e = error as { code?: number | string; stdout?: string; message?: string };
    return { cikti: (e.stdout ?? "") + (e.message ?? ""), kod: typeof e.code === "number" ? e.code : 1 };
  }
};

async function psKopru(repoKok: string, scriptAd: string, calistir: KomutCalistir): Promise<KomutSonuc | null> {
  const yol = join(repoKok, "scripts", scriptAd);
  if (!existsSync(yol)) return null;
  return calistir(["powershell", "-ExecutionPolicy", "Bypass", "-File", yol], repoKok);
}

function telemetriFailAnomali(repoKok: string): BekciAnomali | null {
  const dosya = join(repoKok, ".verimlilik", "telemetri.jsonl");
  if (!existsSync(dosya)) return null;
  // v0.23 (bekci.ts:52 kok onarimi — DERSLER 172 + K-0046 teyit taramasi): eski toolCalls>0 filtresi
  // cagri-izlenmeyen saglayicinin turlerini (claude daemon: 0/103 araclu tur) dislayip pencereyi
  // eski kayitlara KAYDIRIYORDU (bayat veri 'son 20 turda' gibi guncel gorunurdu). Pencere artik
  // TUR kayitlarinin son 20'udur — izlenmeyen turler pencerede yer isgal eder (0/0 katki; oran
  // yalniz izlenen cagrilar uzerinden hesaplanir) ve pencereye tarih damgasi yazilir.
  const turlar: { ts: number | null; ok: number; fail: number }[] = [];
  for (const satir of readFileSync(dosya, "utf8").split(/\r?\n/)) {
    if (!satir.trim()) continue;
    try {
      const k = JSON.parse(satir) as { tip?: string; ts?: string; toolCalls?: number; failedCalls?: number };
      if (k.tip !== "tur") continue;
      const tsMs = typeof k.ts === "string" ? Date.parse(k.ts) : NaN;
      turlar.push({
        ts: Number.isNaN(tsMs) ? null : tsMs,
        ok: Math.max(0, (k.toolCalls ?? 0) - (k.failedCalls ?? 0)),
        fail: k.failedCalls ?? 0,
      });
    } catch { /* bozuk satir atlanir */ }
  }
  const pencere = turlar.slice(-FAIL_PENCERE_TUR);
  if (pencere.length < FAIL_MIN_TUR) return null;
  const toplam = pencere.reduce((a, t) => a + t.ok + t.fail, 0);
  const fail = pencere.reduce((a, t) => a + t.fail, 0);
  const oran = toplam > 0 ? fail / toplam : 0;
  if (oran <= FAIL_ORAN_ESIK) return null;
  // Pencere tarih damgasi: bayat pencere artik kendini ele verir (DERSLER 172'nin
  // 'pencere tarih araligi VERMEZ' dersinin kapanisi). ts'siz kayit ? ile gosterilir.
  const ilkTs = pencere.find((t) => t.ts !== null)?.ts ?? null;
  const sonTs = [...pencere].reverse().find((t) => t.ts !== null)?.ts ?? null;
  const damga = (ms: number | null): string => (ms === null ? "?" : new Date(ms).toISOString().slice(0, 16).replace("T", " "));
  return { anahtar: "telemetri-fail", detay: "son " + pencere.length + " turda basarisiz cagri %" + Math.round(oran * 100) + " (" + fail + "/" + toplam + "), pencere " + damga(ilkTs) + ".." + damga(sonTs) + " UTC" };
}

const GELEN_KUTU_ESIK_MS = 24 * 60 * 60_000;

function gelenKutuBekleyen(repoKok: string, simdiMs: number): BekciAnomali | null {
  const dir = join(repoKok, "raporlar", "gelen-kutu");
  if (!existsSync(dir)) return null;
  let bekleyen = 0;
  let eski: string[] = [];
  try {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      try {
        const j = JSON.parse(readFileSync(join(dir, f), "utf8")) as { maddeler?: { id?: string; tarih?: string; islenme?: unknown }[]; tarih?: string };
        for (const m of j.maddeler ?? []) {
          if (m.islenme) continue;
          bekleyen++;
          const baz = Date.parse((m.tarih ?? j.tarih ?? "") + "T00:00:00Z");
          if (!Number.isNaN(baz) && simdiMs - baz > GELEN_KUTU_ESIK_MS) eski.push(f + ":" + (m.id ?? "?"));
        }
      } catch { /* bozuk sidecar saglik kapisina duser */ }
    }
  } catch { return null; }
  if (eski.length === 0) return null;
  return { anahtar: "gelen-kutu-bekleyen", detay: eski.length + " madde 24s+ islenmemis (toplam bekleyen " + bekleyen + "): " + eski.slice(0, 3).join(", ") };
}

// A5-9 (S3 bacağı, v0.23): kirli-ağaç tanımı TEK KAYNAK — scripts/kirli-liste.json (kilit-surum.ps1
// + proje-panosu.ps1 aynı listeyi okur). Dosya YOKSA yabancı repo'dur: gömülü varsayılan (aynı iki
// desen) uygulanır. Dosya VAR ama okunamıyorsa/bozuksa: fail-closed — desen listesi boş döner ve
// tüm kirli satırlar raporlanır (kilit-surum'un JSON-okunamazsa RED davranışının bekci ikizi).
function kirliDesenlerOku(repoKok: string): string[] {
  const yol = join(repoKok, "scripts", "kirli-liste.json");
  try {
    if (!existsSync(yol)) return ["telemetri-haftalik", ".verimlilik"];
    const ham = JSON.parse(readFileSync(yol, "utf8")) as { desenler?: unknown };
    if (!Array.isArray(ham.desenler) || ham.desenler.length === 0 || !ham.desenler.every((d) => typeof d === "string")) {
      return [];
    }
    return ham.desenler;
  } catch {
    return [];
  }
}

export async function bekciKontrol(repoKok: string, calistir: KomutCalistir = gercekCalistir): Promise<BekciAnomali[]> {
  const anomaliler: BekciAnomali[] = [];
  const saglik = await psKopru(repoKok, "saglik.ps1", calistir);
  if (saglik) {
    const m = saglik.cikti.match(/SONUC:\s*(\d+) OK,\s*(\d+) EKSIK,\s*(\d+) SARI/);
    if (!m) {
      anomaliler.push({ anahtar: "saglik-belirsiz", detay: "saglik.ps1 SONUC satiri uretmedi (kod=" + saglik.kod + ")" });
    } else if (Number(m[2]) > 0) {
      anomaliler.push({ anahtar: "saglik-eksik", detay: m[2] + " EKSIK, " + m[3] + " SARI" });
    }
  }
  const zincir = await psKopru(repoKok, "zincir-kontrol.ps1", calistir);
  if (zincir && zincir.kod !== 0) {
    anomaliler.push({ anahtar: "zincir-kopuk", detay: "handoff zincirinde kopuk var" });
  }
  if (existsSync(join(repoKok, "STATE_BOARD.md"))) {
    const st = await calistir(["git", "status", "--short"], repoKok);
    if (st.kod === 0 && st.cikti.trim().length > 0) {
      // A5-9: desenler kirli-liste.json'dan; kirli-liste-bozuk anomalisi desen listesinin
      // bosalmasini aciklar (fail-closed durum kendini etiketler).
      const desenler = kirliDesenlerOku(repoKok);
      if (desenler.length === 0) {
        anomaliler.push({ anahtar: "kirli-liste-bozuk", detay: "scripts/kirli-liste.json okunamadi/bozuk — tum kirli dosyalar raporlanir (fail-closed)" });
      }
      const kirli = st.cikti.trim().split(/\r?\n/).filter((l) => !desenler.some((d) => l.includes(d)));
      if (kirli.length > 0) {
        anomaliler.push({ anahtar: "git-drift", detay: kirli.length + " kirli dosya, aktif tur yok" });
      }
    }
  }
  const tel = telemetriFailAnomali(repoKok);
  if (tel) anomaliler.push(tel);
  const kutu = gelenKutuBekleyen(repoKok, Date.now());
  if (kutu) anomaliler.push(kutu);
  return anomaliler;
}

function raporDosyasi(repoKok: string, simdi: Date): string {
  const gun = simdi.toISOString().slice(0, 10);
  return join(repoKok, "raporlar", "takip-sozlesme", gun + ".md");
}

export interface BekciOzet {
  taranan: number;
  ertelenen: number;
  anomalili: number;
  bildirilen: number;
}

export async function bekciTara(
  ajanlar: Map<string, PluginHookAgent>,
  aktifTurVarMi: (repoKok: string) => boolean,
  gonder: (agent: PluginHookAgent, mesaj: string) => Promise<void>,
  calistir: KomutCalistir = gercekCalistir,
  simdi: Date = new Date(),
): Promise<BekciOzet> {
  const ozet: BekciOzet = { taranan: 0, ertelenen: 0, anomalili: 0, bildirilen: 0 };
  const repoAjan = new Map<string, PluginHookAgent>();
  for (const [, agent] of ajanlar) {
    const kok = katmanKokuBul(agent.cwd);
    if (!repoAjan.has(kok)) repoAjan.set(kok, agent);
  }
  for (const [repoKok, agent] of repoAjan) {
    ozet.taranan++;
    try {
      if (ayarOku(repoKok).bekciKapali) continue;
      if (aktifTurVarMi(repoKok)) { ozet.ertelenen++; continue; }
      const anomaliler = await bekciKontrol(repoKok, calistir);
      if (anomaliler.length === 0) continue;
      ozet.anomalili++;
      const dosya = raporDosyasi(repoKok, simdi);
      const mevcut = existsSync(dosya) ? readFileSync(dosya, "utf8") : "";
      const yeni = anomaliler.filter((a) => !mevcut.includes("| " + a.anahtar + " |"));
      if (yeni.length === 0) continue;
      mkdirSync(join(repoKok, "raporlar", "takip-sozlesme"), { recursive: true });
      const saat = simdi.toISOString().slice(11, 16);
      const baslik = mevcut.length === 0 ? "# Sozlesme bekci raporu — " + simdi.toISOString().slice(0, 10) + "\n\n" : "";
      appendFileSync(dosya, baslik + yeni.map((a) => "- " + saat + " | " + a.anahtar + " | " + a.detay).join("\n") + "\n", "utf8");
      ozet.bildirilen++;
      panoIsaretciYaz(repoKok, simdi.toISOString().slice(0, 10));
      const repoAd = repoKok.replace(/.*[\\/]/, "");
      void gonder(
        agent,
        "[paseo-verimlilik · bekçi] " + repoAd + ": " + yeni.length + " anomali — " +
        yeni.map((a) => a.anahtar + " (" + a.detay + ")").join("; ") +
        ". Rapor: raporlar/takip-sozlesme/" + simdi.toISOString().slice(0, 10) + ".md. Onay verme; bulguları kullanıcıya özetle (Ferman 3).",
      ).catch((error) => console.error("[paseo-verimlilik] bekci gonderim hatasi", error));
    } catch (error) {
      console.error("[paseo-verimlilik] bekci repo hatasi: " + repoKok, error);
    }
  }
  return ozet;
}


const PANO_ISARET_ONEK = "- bekci raporu:";

// A2-10 (v0.23): birebir "## Aktif iş" eslesmesi kirilgandi — sondaki bosluk/ekstra bosluk basligi kaciriyordu.
// Bosluk-normalize karsilastirma (buyuk-kucuk harf bilincli DOKUNULMAZ: Turkce İ/i case-folding tuzagi).
function aktifIsBasligiMi(s: string): boolean {
  return s.replace(/\s+/g, " ").trim() === "## Aktif iş";
}

export function panoIsaretciYaz(repoKok: string, gun: string): boolean {
  const panoYol = join(repoKok, "STATE_BOARD.md");
  if (!existsSync(panoYol)) return false;
  const isaretci = PANO_ISARET_ONEK + " raporlar/takip-sozlesme/" + gun + ".md (untracked — commit bekliyor)";
  const icerik = readFileSync(panoYol, "utf8");
  const eol = icerik.includes("\r\n") ? "\r\n" : "\n";
  const satirlar = icerik.split(/\r?\n/);
  const mevcutIdx = satirlar.findIndex((s) => s.startsWith(PANO_ISARET_ONEK));
  if (mevcutIdx >= 0) {
    if (satirlar[mevcutIdx] === isaretci) return false;
    satirlar[mevcutIdx] = isaretci;
  } else {
    const aktifIdx = satirlar.findIndex(aktifIsBasligiMi);
    if (aktifIdx < 0) return false;
    satirlar.splice(aktifIdx + 1, 0, isaretci);
  }
  // A2-10 (v0.23): tmp+rename atomik — yari-yazilmis STATE_BOARD.md okuyucuya asla dusmez.
  const tmpYol = panoYol + ".bekci-tmp";
  writeFileSync(tmpYol, satirlar.join(eol), "utf8");
  renameSync(tmpYol, panoYol);
  return true;
}

export function bekciBaslat(
  ajanlar: Map<string, PluginHookAgent>,
  aktifTurVarMi: (repoKok: string) => boolean,
  gonder: (agent: PluginHookAgent, mesaj: string) => Promise<void>,
): () => void {
  const timer = setInterval(() => {
    try {
      void bekciTara(ajanlar, aktifTurVarMi, gonder);
    } catch (error) {
      console.error("[paseo-verimlilik] bekci tarama hatasi", error);
    }
  }, TARAMA_MS);
  return () => clearInterval(timer);
}
