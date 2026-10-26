// S4 Scheduler 2/2 — daemon sürücüsü HERMETİK kolu: sahte saat (now enjeksiyonu +
// anında sleep) + sahte koşucu. Kanıtlanan: (1) cadence disiplini schedule.ts'ten
// gelir — benzersizlik (M08), misfire catch-up fırtınası YOK (M10), overlap BINMEZ,
// (2) STOP mandalı kapatınca çocuk HİÇ çıkmaz, mandal açılınca en yeni occurrence
// adil denenir, (3) 3 üst üste kırmızı çocuk → fail-closed ölüm, (4) sinyal temiz
// duruş, (5) tavan dolunca temiz çıkış. Gerçek çocuk tesisatı daemon-canli.test.ts'te.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runDaemon, type TickOutcome } from '../src/daemon.ts';

// sahte saat: t elle ilerler; sleep anında t += ms (gerçek bekleme yok — deterministik)
function fakeClock(startMs = 1_000_000) {
  let t = startMs;
  return { now: () => t, sleep: async (ms: number) => { t += ms; }, t: () => t };
}

const ok = (): Promise<TickOutcome> => Promise.resolve({ code: 0, out: '{"outbox":{}}', ms: 1 });
const red = (): Promise<TickOutcome> => Promise.resolve({ code: 1, out: 'probe doğrulanamadı', ms: 1 });

// occurrence ölçümü runTick İÇİNDEN değil heartbeat'ten: launch mikro-görevde çağırır,
// koşucu saati okuduğunda saat çoktan ilerlemiş olur — daemon'un PLANLADIĞI an
// 'tick-launched' log satırındaki occurrence'dır (ölçülen de budur).
function occurrenceProbe() {
  const occ: number[] = [];
  const log = (l: any) => { if (l.daemon === 'tick-launched') occ.push(Date.parse(l.occurrence)); };
  return { occ, log };
}

test('mutlu yol: interval kadansı + benzersizlik + tavan dolunca temiz çıkış (M08)', async () => {
  const c = fakeClock();
  const p = occurrenceProbe();
  const r = await runDaemon({
    intervalMs: 1000, maxTicks: 3, dbPath: ':memory:',
    now: c.now, sleep: c.sleep,
    runTick: ok, stopLatched: () => false, log: p.log,
  });
  assert.equal(r.code, 0);
  assert.equal(r.stats.reason, 'max-ticks');
  assert.equal(r.stats.ticks, 3);
  assert.equal(r.stats.ok, 3);
  // kadans: 3 occurrence = start, +1000, +2000 (tavan 3) — hepsi TEKİL (M08)
  const start = 1_000_000;
  assert.deepEqual(p.occ, [start, start + 1000, start + 2000]);
  assert.equal(new Set(p.occ).size, 3, 'aynı occurrence İKİ KEZ koşmaz (M08)');
});

test('misfire: saat zıplayınca yalnız EN SON occurrence hak eder — catch-up fırtınası YOK (M10)', async () => {
  // her uyanış 3500ms ilerletir: arada occurrence'lar kaçar → yalnız en sonuncu koşar.
  // maxTicks=5 evren tavanı: koşan 3 (start, +3000, +4000), kaçan 2 misfire ile elenir.
  // 2 kademeli iç yield: sahte koşucunun bitiş mikro-görevi (promise assimilation +
  // handler) uyanmadan ÖNCE işlensin — çakışmasız SAF misfire senaryosu; overlap
  // davranışının kendisi ayrı testte kapsanır.
  let t = 1_000_000;
  const now = () => t;
  const sleep = async (ms: number) => { t += 3500; for (let i = 0; i < 2; i++) await Promise.resolve().then(() => {}); };
  const p = occurrenceProbe();
  const r = await runDaemon({
    intervalMs: 1000, maxTicks: 5, dbPath: ':memory:', now, sleep,
    runTick: ok, stopLatched: () => false, log: p.log,
  });
  assert.equal(r.code, 0);
  assert.equal(r.stats.reason, 'max-ticks');
  assert.equal(r.stats.ticks, 3, 'kaçan occurrence\'lar TOPLU koşmaz — yalnız en sonuncu');
  assert.deepEqual(p.occ, [1_000_000, 1_003_000, 1_004_000], 'zıplayan saat: +1000/+2000 kaçtı, en son hak etti');
  assert.equal(r.stats.skipped.misfire, 2, 'aradaki kaçanlar MISFIRE_SKIPPED ile kalıcı elendi');
});

test('overlap: önceki tick koşarken yeni occurrence BİNMEZ; bitince adil denenir', async () => {
  let t = 1_000_000;
  const now = () => t;
  let calls = 0;
  let resolver: ((o: TickOutcome) => void) | null = null;
  const runTick = () => {
    calls++;
    if (calls === 1) return new Promise<TickOutcome>((res) => { resolver = res; });
    return ok();
  };
  let wakeups = 0;
  const sleep = async (ms: number) => {
    t += ms; wakeups++;
    if (wakeups === 12 && resolver) resolver({ code: 0, out: 'yavaş-tick', ms: 1 }); // çocuk ~1100ms sonra biter
  };
  const r = await runDaemon({
    intervalMs: 1000, dbPath: ':memory:', now, sleep, runTick,
    stopLatched: () => false, shouldStop: () => calls >= 2, log: () => {},
  });
  assert.equal(r.code, 0);
  assert.equal(r.stats.reason, 'signal');
  assert.equal(r.stats.ticks, 2);
  assert.ok(r.stats.skipped.overlap >= 1, 'koşarken gelen occurrence OVERLAP_SKIPPED (üst üste binme yok)');
});

test('STOP mandalı: kapatılınca çocuk HİÇ çıkmaz; açılınca en yeni occurrence denenir', async () => {
  let t = 1_000_000;
  const now = () => t;
  const sleep = async (ms: number) => { t += ms; };
  let latched = true, wakeups = 0;
  const stopLatched = () => { wakeups++; if (wakeups >= 3) latched = false; return latched; };
  const p = occurrenceProbe();
  const r = await runDaemon({
    intervalMs: 1000, dbPath: ':memory:', now, sleep, stopLatched,
    runTick: ok,
    shouldStop: () => p.occ.length >= 1, log: p.log,
  });
  assert.equal(r.stats.ticks, 1, 'mandal kapalıyken tick çocuğu HİÇ spawn edilmedi');
  assert.ok(r.stats.skipped.stopped >= 2, 'mandal penceresindeki occurrence\'lar STOPPED atlandı');
  // adil yeniden deneme: açılınca koşan occurrence mandal penceresinin EN YENİ anıdır
  assert.equal(p.occ[0], 1_000_000 + 2000);
  assert.equal(r.code, 0);
});

test('fail-closed: 3 üst üste kırmızı çocuk → daemon ölür (sessiz kırmızı döngü yok)', async () => {
  let t = 1_000_000;
  const now = () => t;
  const sleep = async (ms: number) => { t += ms; };
  const r = await runDaemon({
    intervalMs: 1000, dbPath: ':memory:', now, sleep,
    runTick: red, stopLatched: () => false, log: () => {},
  });
  assert.equal(r.stats.reason, 'fail-closed');
  assert.equal(r.code, 1, 'daemon son çocuk exit koduyla ölür');
  assert.equal(r.stats.ticks, 3);
  assert.equal(r.stats.failed, 3);
});

test('geçersiz cadence: intervalMs <= 0 → spec RED (fail-closed, sessiz düzeltme yok)', async () => {
  const c = fakeClock();
  await assert.rejects(() => runDaemon({
    intervalMs: 0, dbPath: ':memory:', now: c.now, sleep: c.sleep, runTick: ok, stopLatched: () => false, log: () => {},
  }), /schedule spec geçersiz/);
});
