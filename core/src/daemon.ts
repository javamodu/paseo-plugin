// S4 Scheduler 2/2 (SAVAS START 2026-10-26 — plan UYGULAMA-PLANI-SPRINT-2026-10-26)
// — TICK DÖNGÜSÜ / DAEMON SÜRÜCÜSÜ. ÇEKİRDEĞİ KORUR: yeni komut/olay kind eklemez,
// DB şemasına dokunmaz. Cadence disiplini schedule.ts'ten gelir (planOccurrences/
// settleKeys — M08/M09/M10 zaten testli): bu modül yalnız "çağrayan döngü"nün uygulama
// ucudur. Her tur `node src/cli.ts tick` ÇOCUK SÜRECİNDE koşar — crash izolasyonu:
// probe/yetenek/STOP kapıları CLI'nın kendi exit kodlarıyla yaşar, daemon çökmez,
// yalnız gözlemler. FAIL-CLOSED: 3 üst üste kırmızı çocuk → daemon ölür (sessiz
// kırmızı döngü YOK). STOP mandalı her uyanışta defterden yeniden okunur — mandalı
// kapatınca tick çocuğu HİÇ spawn edilmez (schedule STOPPED dalı: yerleşmez, mandal
// açılınca AYNI occurrence adil yeniden denenir). SIGINT/SIGTERM temiz duruş (caller
// shouldStop bayrağıyla takar; burada process sinyallerine dokunulmaz).
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openStore } from './store.ts';
import { planOccurrences, settleKeys, occurrenceKey, type ScheduleSpec } from './schedule.ts';
import { besleDaemonKanitlari } from './gozetimsiz.ts';

export interface TickOutcome { code: number; out: string; ms: number }

export interface DaemonStats {
  ticks: number;          // çıkarılan tick çocukları
  ok: number;             // exit 0
  failed: number;         // nonzero exit / spawn hatası
  lastCode: number | null;
  skipped: { misfire: number; overlap: number; stopped: number }; // occurrence başına (tekil)
  kanit: { besleme: number; hata: number }; // A0-3: gözetimsiz kanıt defterine yazılan kayıt sayısı / besleme hatası
  reason: 'max-ticks' | 'fail-closed' | 'signal';
}

export interface DaemonOptions {
  intervalMs: number;                 // tick cadence (serve >= 1000 zorunlu; testler küçük değer kullanır)
  dbPath: string;                     // STOP mandalı okuma + çocuğun ORDU_DB'si
  startAt?: string;                   // ISO UTC; default = ilk uyanış anı
  maxTicks?: number;                  // güvenlik tavanı (serve: undefined = sonsuz)
  probePath?: string;                 // çocuğa ORDU_PROBE aktarımı
  env?: NodeJS.ProcessEnv;            // çocuğa ek env (ORDU_LIVE çağrayan ortamdan taşınır)
  childArgs?: string[];               // default ['tick'] — canlı tesisat sınaması 'status' kullanır
  tickTimeoutMs?: number;             // default 10 dk — askıda çocuğu öldürür (kör kilitlenme yok)
  scheduleId?: string;                // default 'ordu-core-tick'
  now?: () => number;                 // epoch ms (test enjeksiyonu)
  sleep?: (ms: number) => Promise<void>;
  runTick?: () => Promise<TickOutcome>; // test enjeksiyonu; default gerçek child
  stopLatched?: () => boolean;        // default: defterden dispatch_paused oku
  shouldStop?: () => boolean;         // dış duruş bayrağı (serve: SIGINT/SIGTERM)
  log?: (line: object) => void;       // heartbeat; default console.log JSON satırı
  kanitDefteriYolu?: string;          // A0-3: verilirse BAŞARILI tick sonrası gozetimsiz rozetinin 4 defter-sorgulu bayrağı (1/2/3/5) kanıt defterine beslenir — opt-in; verilmedikçe besleme YOK → rozet tazelik kapısında kırmızı kalır (fail-closed)
}

const MAX_CONSECUTIVE_FAILURES = 3;

// Çocuk süreç koşucusu: `node src/cli.ts <args>` — tek geçiş tick. Exit kodu + stdout
// daemon'a döner; yorum DAEMONDA YAPILMAZ (kayıt memuru değil gözlemci — kapılar CLI'da).
function spawnCliTick(opts: DaemonOptions): Promise<TickOutcome> {
  const cliPath = fileURLToPath(new URL('./cli.ts', import.meta.url));
  return new Promise((resolve) => {
    const t0 = Date.now();
    const child = spawn(process.execPath, [cliPath, ...(opts.childArgs ?? ['tick'])], {
      env: { ...process.env, ...(opts.env ?? {}), ORDU_DB: opts.dbPath, ...(opts.probePath ? { ORDU_PROBE: opts.probePath } : {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let out = '';
    child.stdout!.on('data', (d: Buffer) => { out += d.toString('utf8'); });
    child.stderr!.on('data', (d: Buffer) => { out += d.toString('utf8'); });
    const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch { /* zaten kapandı */ } }, opts.tickTimeoutMs ?? 600_000);
    const done = (code: number, extra?: string) => {
      clearTimeout(timer);
      resolve({ code, out: (out + (extra ? '\n' + extra : '')).trim(), ms: Date.now() - t0 });
    };
    child.on('close', (c) => done(c ?? 1));
    child.on('error', (e: Error) => done(1, 'child spawn hatası: ' + e.message));
  });
}

// STOP mandalı: her uyanışta taze okunur (kalıcı okuma yok — resume anında etkin).
// Dosya yoksa openStore fail-closed doğar (dispatch_paused=1) → daemon tick çıkarmaz.
function dbStopLatched(dbPath: string): boolean {
  const db = openStore(dbPath);
  try {
    return (db.prepare('SELECT dispatch_paused FROM settings WHERE id=1').get() as any).dispatch_paused === 1;
  } finally { db.close(); }
}

export async function runDaemon(opts: DaemonOptions): Promise<{ code: number; stats: DaemonStats }> {
  const now = opts.now ?? (() => Date.now());
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const runTick = opts.runTick ?? (() => spawnCliTick(opts));
  const stopLatched = opts.stopLatched ?? (() => dbStopLatched(opts.dbPath));
  const log = opts.log ?? ((line: object) => console.log(JSON.stringify(line)));

  const spec: ScheduleSpec = {
    scheduleId: opts.scheduleId ?? 'ordu-core-tick',
    revision: 1,
    kind: 'INTERVAL',
    startAt: opts.startAt ?? new Date(now()).toISOString(), // spec geçersizse planOccurrences RED atar (fail-closed)
    intervalMs: opts.intervalMs,
    maxOccurrences: opts.maxTicks,
  };

  const settled = new Set<string>();      // occurrence kimlikleri (M08 — yeniden koşmaz)
  const countedSkips = new Set<string>(); // skip sayaçları occurrence başına TEKİL
  const stats: DaemonStats = {
    ticks: 0, ok: 0, failed: 0, lastCode: null,
    skipped: { misfire: 0, overlap: 0, stopped: 0 }, reason: 'signal', // her dönüş yolunda üzerine yazılır
    kanit: { besleme: 0, hata: 0 },
  };
  let inFlight: Promise<TickOutcome> | null = null;
  let consecutiveFailures = 0;

  // A0-3 KANIT BESLEMESİ: BAŞARILI tick sonrası rozetin 4 defter-sorgulu bayrağını
  // (koşul 1/2/3/5) kanıt defterine yazar (besleDaemonKanitlari — yeşile boyama YOK:
  // kırmızı koşula kayıt girmez). KIRMIZI tick BESLEMEZ — kanıt eskir, rozet tazelik
  // kapısında kırmızı düşer (fail-closed canlılık: daemon pazlasa gece modu kendiliğinden
  // kapanır). Besleme hatası daemon'ı ÖLDÜRMEZ (kanıt yazılamadıysa rozet zaten kırmızıya
  // düşer — sessiz yeşil yok; hata sayılır + loglanır, gözlemci kalınır).
  const kanitBesle = () => {
    if (!opts.kanitDefteriYolu) return;
    try {
      const db = openStore(opts.dbPath);
      try {
        const yazilan = besleDaemonKanitlari(db, opts.kanitDefteriYolu, now);
        stats.kanit.besleme += yazilan.length;
        log({ daemon: 'kanit-besleme', kayit: yazilan.length, bayraklar: yazilan });
      } finally { db.close(); }
    } catch (e: any) {
      stats.kanit.hata++;
      log({ daemon: 'kanit-besleme-hata', error: String(e?.message ?? e) });
    }
  };

  const countSkip = (at: Date, reason: 'misfire' | 'overlap' | 'stopped') => {
    const k = occurrenceKey(spec, at);
    if (countedSkips.has(k)) return;
    countedSkips.add(k);
    stats.skipped[reason]++;
  };

  const launch = (at: Date) => {
    stats.ticks++;
    log({ daemon: 'tick-launched', occurrence: at.toISOString() });
    const p = Promise.resolve().then(() => runTick());
    inFlight = p;
    p.then((o: TickOutcome) => {
      if (inFlight === p) inFlight = null;
      stats.lastCode = o.code;
      if (o.code === 0) { stats.ok++; consecutiveFailures = 0; kanitBesle(); } // A0-3: yeşil tick kanıt besler
      else { stats.failed++; consecutiveFailures++; }
      log({ daemon: 'tick-done', code: o.code, ms: o.ms, out: o.out.slice(0, 400) });
    }).catch((e: any) => {
      if (inFlight === p) inFlight = null;
      stats.failed++; stats.lastCode = 1; consecutiveFailures++;
      log({ daemon: 'tick-error', error: String(e?.message ?? e) });
    });
  };

  const nextOccurrenceMs = (t: number) => {
    const start = Date.parse(spec.startAt);
    const iv = spec.intervalMs as number;
    return start + (Math.floor((t - start) / iv) + 1) * iv;
  };

  while (true) {
    // FAIL-CLOSED önce: 3 üst üste kırmızı çocuk → sessiz döngü yok, daemon ölür.
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      if (inFlight) await inFlight.catch(() => {});
      stats.reason = 'fail-closed';
      return { code: stats.lastCode ?? 1, stats };
    }
    if (opts.shouldStop?.()) {
      if (inFlight) await inFlight.catch(() => {});
      stats.reason = 'signal';
      return { code: 0, stats };
    }
    // tavan doldu (tüm occurrence'lar yerleşti — emit + kalıcı skip) → temiz çıkış.
    if (opts.maxTicks !== undefined && settled.size >= opts.maxTicks && !inFlight) {
      stats.reason = 'max-ticks';
      return { code: 0, stats };
    }

    const t = now();
    const plan = planOccurrences(spec, t, {
      stopLatched: stopLatched(),
      grantActive: true,
      overlapActive: inFlight !== null,
      settled,
    });
    for (const k of settleKeys(spec, plan)) settled.add(k);
    for (const s of plan.skipped) {
      if (s.reason === 'MISFIRE_SKIPPED') countSkip(s.at, 'misfire');
      else if (s.reason === 'OVERLAP_SKIPPED') countSkip(s.at, 'overlap');
      else if (s.reason === 'STOPPED') countSkip(s.at, 'stopped');
    }
    if (plan.emit.length && !inFlight) launch(plan.emit[0]);

    // uyanma: sonraki occurrence'a kadar; çocuk koşarken kısa adım (bitince adil
    // yeniden deneme gecikmesiz olsun) — uyanmak ucuz, kapı pahalı değil.
    const wait = inFlight ? Math.min(100, Math.max(1, nextOccurrenceMs(t) - t)) : Math.max(1, nextOccurrenceMs(t) - t);
    await sleep(wait);
  }
}
