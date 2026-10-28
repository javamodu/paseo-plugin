// A4 Otonom sürü sürücüsü — GECE MODU (graf v12 ölçütü: "hedef+limit ver → gece tur
// serisi; rozet yeşilse açılır"; dizin core/src/daemon.ts, LOC 200/100). Gece modu
// runDaemon'i SARMALAYAN sürücü katmanıdır: daemon çekirdeğine (cadence disiplini,
// crash izolasyonu, STOP mandalı, A0-3 kanıt beslemesi) sıfır davranış dokunuşu —
// ince kanca = runTick sarmalayıcı (tur ölçümü + rozet canlılığı) + shouldStop köprüsü.
// Kapılar: (1) AÇILIŞ — unattendedReadinessBeslemeli rozeti 'gozetimsiz-hazir' değilse
// gece AÇILMAZ (fail-closed; rozetsiz gece yok — gozetimsiz.ts:35 "A4 tüketir" ucunun
// bu bacağı); (2) CANLILIK — her tur sonunda rozet yeniden okunur, kırmızıya düştüyse
// seri kendini kapatır ('rozet-kapandi' — daemon koşarken kanıt eskirse gece
// kendiliğinden kapanır; A0-3 fail-closed canlılık sözü); (3) LİMİT — turLimiti dolunca
// temiz kapanış ('limit-doldu'). Ölçüm (A0 planı: "rakamla biten cümle yoksa dalga
// teorik sayılır"): otonom tur sayısı + ortalama süre hem dönüş stats'ında hem gece
// defterine (gece.jsonl — append-only fsync'li; notify/replan deseni) yazılır.
import { runDaemon, spawnCliTick, type DaemonOptions, type TickOutcome } from './daemon.ts';
import { openStore } from './store.ts';
import { unattendedReadinessBeslemeli, type GozetimsizKosul } from './gozetimsiz.ts';
import { jsonlEkle } from './defter.ts';
import { fileURLToPath } from 'node:url';

// üretim gece defteri (tur + kapanış kayıtları; A4 ölçüm kanalı — komik değil kalıcı)
export const GECE_DEFTERI_YOLU = fileURLToPath(new URL('../data/gece.jsonl', import.meta.url));

const TAZELIK_MS_DEFAULT = 30 * 60_000;

export type GeceKapanisNedeni =
  | 'parametre-gecersiz'      // doğrulama RED — döngüye HİÇ girilmez
  | 'gozetimsiz-kullanilamaz' // açılış kapısı: rozet kırmızı — 0 tur
  | 'limit-doldu'             // turLimiti tamam — hedeflenen kapanış
  | 'rozet-kapandi'           // canlılık: tur sonunda rozet kırmızıya düştü
  | 'signal'                  // dış duruş (SIGINT/SIGTERM köprüsü)
  | 'fail-closed';            // 3 üst üste kırmızı çocuk (daemon sözleşmesi aynen)

export interface GeceTurKaydi {
  kayit: 'gece-turu'; tur: number; hedef: string; code: number; ms: number; damga: string;
}

export interface GeceKapanisKaydi {
  kayit: 'gece-kapanis'; hedef: string; turSayisi: number; ok: number; failed: number;
  toplamMs: number; ortalamaMs: number; reason: GeceKapanisNedeni; rozet: string; damga: string;
}

export interface GeceStats {
  hedef: string;
  turSayisi: number;   // tamamlanan otonom turlar (skipped occurrence tur DOĞURMAZ)
  ok: number; failed: number;
  toplamMs: number; ortalamaMs: number;
  reason: GeceKapanisNedeni;
  rozet: 'gozetimsiz-hazir' | 'gozetimsiz-kullanilamaz';
  acilisKosullar: GozetimsizKosul[]; // açılış kapısı kanıtı — kırmızı bacak hangisiydi
}

export interface RozetOkuma {
  rozet: 'gozetimsiz-hazir' | 'gozetimsiz-kullanilamaz';
  kosullar: GozetimsizKosul[];
}

export interface GeceOptions {
  hedef: string;              // gece hedefi — her kayda yazılır; boş RED
  turLimiti: number;          // tur tavanı; pozitif tam sayı değilse RED
  intervalMs: number;         // tur cadence — runDaemon'e aynen geçer (CLI katmanı >= 1000 kapısı)
  dbPath: string;             // STOP mandalı + rozet DB bacağı + çocuğun ORDU_DB'si
  kanitDefteriYolu: string;   // ZORUNLU — rozetin okunacağı kanıt defteri; boş RED (rozsiz gece yok)
  tazelikMs?: number;         // rozet tazelik penceresi; default 30 dk
  defterYolu?: string;        // gece kayıtları; default GECE_DEFTERI_YOLU
  tickTimeoutMs?: number;     // askıda çocuğu öldürür (daemon default 10 dk)
  probePath?: string;         // çocuğa ORDU_PROBE aktarımı
  env?: NodeJS.ProcessEnv;    // çocuğa ek env (ORDU_LIVE çağrayan ortamdan taşınır)
  now?: () => number;         // epoch ms (test enjeksiyonu)
  sleep?: (ms: number) => Promise<void>;
  runTick?: () => Promise<TickOutcome>;  // test enjeksiyonu; default gerçek çocuk (spawnCliTick)
  rozetOku?: () => RozetOkuma;           // test enjeksiyonu; default gerçek rozet sorgusu
  shouldStop?: () => boolean;            // dış duruş bayrağı (CLI: SIGINT/SIGTERM)
  log?: (line: object) => void;          // heartbeat; default sessiz (CLI kendi yazdırır)
}

// Gece serisi: hedef+limit verilir → açılış kapısı → tur serisi → ölçümlü kapanış.
// Her çıkış yolunda (kapı RED'i dahil) kapanış kaydı deftere düşer — "neden açılmadı"
// da kalıcı bilgi; diskte kapanış kaydı yoksa gece koşmuş sayılmaz.
export async function geceModu(opts: GeceOptions): Promise<{ code: number; stats: GeceStats }> {
  const now = opts.now ?? (() => Date.now());
  const log = opts.log ?? (() => {});
  const defterYolu = opts.defterYolu ?? GECE_DEFTERI_YOLU;
  const tazelikMs = opts.tazelikMs ?? TAZELIK_MS_DEFAULT;

  const kapan = (
    reason: GeceKapanisNedeni,
    rozet: 'gozetimsiz-hazir' | 'gozetimsiz-kullanilamaz',
    kosullar: GozetimsizKosul[],
    turlar: { code: number; ms: number }[],
    code: number,
  ): { code: number; stats: GeceStats } => {
    const ok = turlar.filter((t) => t.code === 0).length;
    const failed = turlar.length - ok;
    const toplamMs = turlar.reduce((a, t) => a + t.ms, 0);
    const ortalamaMs = turlar.length ? Math.round(toplamMs / turlar.length) : 0;
    const stats: GeceStats = {
      hedef: opts.hedef, turSayisi: turlar.length, ok, failed,
      toplamMs, ortalamaMs, reason, rozet, acilisKosullar: kosullar,
    };
    const kayit: GeceKapanisKaydi = {
      kayit: 'gece-kapanis', hedef: opts.hedef, turSayisi: turlar.length, ok, failed,
      toplamMs, ortalamaMs, reason, rozet, damga: new Date(now()).toISOString(),
    };
    jsonlEkle(defterYolu, kayit);
    log({ gece: 'kapanis', reason, turSayisi: turlar.length, ortalamaMs });
    return { code, stats };
  };

  // (0) doğrulama — sessiz varsayılan yok; RED'ler tek geçiş, döngüye girilmez.
  if (!opts.hedef || !opts.hedef.trim()) {
    return kapan('parametre-gecersiz', 'gozetimsiz-kullanilamaz', [], [], 1);
  }
  if (!(Number.isInteger(opts.turLimiti) && opts.turLimiti > 0)) {
    return kapan('parametre-gecersiz', 'gozetimsiz-kullanilamaz', [], [], 1);
  }
  if (!opts.kanitDefteriYolu) {
    return kapan('parametre-gecersiz', 'gozetimsiz-kullanilamaz', [], [], 1);
  }

  // (1) AÇILIŞ KAPISI — rozet fail-closed: 'gozetimsiz-hazir' değilse 0 tur RED.
  // (gozetimsiz.ts:35 "daemon beslemesi + dış kanıt kayıt ortak ucu; A4 tüketir")
  const rozetOku = opts.rozetOku ?? (() => {
    const db = openStore(opts.dbPath);
    try { return unattendedReadinessBeslemeli(db, opts.kanitDefteriYolu, tazelikMs, now); }
    finally { db.close(); }
  });
  const acilis = rozetOku();
  if (acilis.rozet !== 'gozetimsiz-hazir') {
    return kapan('gozetimsiz-kullanilamaz', acilis.rozet, acilis.kosullar, [], 1);
  }
  log({ gece: 'acildi', hedef: opts.hedef, turLimiti: opts.turLimiti, rozet: acilis.rozet });

  // (2) TUR SERİSİ — runDaemon sarmalayıcıyla: her tur ölçülür + deftere yazılır +
  // rozet canlılığı izlenir (kırmızı → shouldStop köprüsü → temiz duruş).
  const turlar: { code: number; ms: number }[] = [];
  let rozetKapandi = false;
  let turNo = 0;
  const tabanTick = opts.runTick ?? (() => spawnCliTick({
    intervalMs: opts.intervalMs, dbPath: opts.dbPath,
    ...(opts.probePath ? { probePath: opts.probePath } : {}),
    ...(opts.env ? { env: opts.env } : {}),
    ...(opts.tickTimeoutMs ? { tickTimeoutMs: opts.tickTimeoutMs } : {}),
  } as DaemonOptions));
  const sarmalTick = async (): Promise<TickOutcome> => {
    const o = await tabanTick();
    turNo++;
    turlar.push({ code: o.code, ms: o.ms });
    const turKaydi: GeceTurKaydi = {
      kayit: 'gece-turu', tur: turNo, hedef: opts.hedef, code: o.code, ms: o.ms,
      damga: new Date(now()).toISOString(),
    };
    jsonlEkle(defterYolu, turKaydi);
    // canlılık: tur sonrası rozet. Dürüst not: okuma, runDaemon'in başarılı-tick kanıt
    // beslemesinden ÖNCE yapılır — tespit en geç bir sonraki turda kesinleşir
    // (fail-closed gecikmesi ≤ 1 tur; tasarım bilinçli, sessiz yeşil yok).
    if (!rozetKapandi) {
      const r = rozetOku();
      if (r.rozet !== 'gozetimsiz-hazir') {
        rozetKapandi = true;
        log({ gece: 'rozet-kapandi', tur: turNo, rozet: r.rozet });
      }
    }
    return o;
  };

  const res = await runDaemon({
    intervalMs: opts.intervalMs, maxTicks: opts.turLimiti, dbPath: opts.dbPath,
    ...(opts.probePath ? { probePath: opts.probePath } : {}),
    ...(opts.env ? { env: opts.env } : {}),
    ...(opts.tickTimeoutMs ? { tickTimeoutMs: opts.tickTimeoutMs } : {}),
    ...(opts.now ? { now: opts.now } : {}),
    ...(opts.sleep ? { sleep: opts.sleep } : {}),
    kanitDefteriYolu: opts.kanitDefteriYolu,
    runTick: sarmalTick,
    shouldStop: () => opts.shouldStop?.() || rozetKapandi,
    log: (l) => log(l),
  });

  // (3) KAPANIŞ — daemon reason'ı gece diline çevir (rozet köprüsü signal'i yakalar)
  // + ölçüm + defter. fail-closed çocuk zinciri dışındaki kapanışlar temiz (code 0):
  // rozet-kapandi koruma davranışıdır, hata değil — reason etiketi dürüst taşınır.
  const reason: GeceKapanisNedeni = rozetKapandi
    ? 'rozet-kapandi'
    : res.stats.reason === 'max-ticks' ? 'limit-doldu' : res.stats.reason;
  return kapan(reason, 'gozetimsiz-hazir', acilis.kosullar, turlar, reason === 'fail-closed' ? res.code : 0);
}
