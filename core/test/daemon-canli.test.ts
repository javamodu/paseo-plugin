// S4 Scheduler 2/2 canlı bacak: daemon döngüsü GERÇEK node ÇOCUK SÜREÇLERİYLE koşar.
// Hermetik kol (daemon.test.ts) sahte saat/sahte koşucu kullandı; burada spawnCliTick'in
// TA KENDİSİ çalışır: gerçek spawn, gerçek stdout toplama, gerçek exit-kodu geçişi,
// GERÇEK duvar saati cadence ve GERÇEK dosya defterinden dbStopLatched okuması
// (taze defter fail-closed doğar → mandalı açık kurulum gerekir). `tick` komutunun
// kendi kapıları (probe/yetenek/ORDU_LIVE) M02 + sentPoll turlarında ayrıca kanıtlı —
// buradaki hedef tesisat: çocuk süreç yaşam döngüsü + mandal + fail-closed ölüm.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runDaemon } from '../src/daemon.ts';
import { openStore, setGlobalStop } from '../src/store.ts';

function tempDb(openLatch: boolean): string {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-daemon-'));
  const dbPath = join(dir, 'ordu.sqlite');
  const db = openStore(dbPath);
  if (openLatch) setGlobalStop(db, false, 'test', 'canli-kurulum'); // taze defter born-STOPPED'dır
  db.close();
  return dbPath;
}

test('gerçek çocuk döngüsü: cli status 2 kez GERÇEK aralıkla koşar — stdout + exit kodu yakalanır', async () => {
  const dbPath = tempDb(true);
  const outs: string[] = [];
  const occ: number[] = [];
  const r = await runDaemon({
    intervalMs: 200, maxTicks: 2, dbPath, childArgs: ['status'],
    log: (l: any) => {
      if (l.daemon === 'tick-done') outs.push(String(l.out));
      if (l.daemon === 'tick-launched') occ.push(Date.parse(l.occurrence));
    },
  });
  assert.equal(r.code, 0);
  assert.equal(r.stats.reason, 'max-ticks');
  assert.equal(r.stats.ok, 2, 'gerçek çocuk exit 0 ×2');
  assert.ok(outs.every((o) => o.includes('"globalStop"')), 'gerçek çocuk stdout JSON\'u daemon\'a aktı');
  assert.equal(occ.length, 2);
  assert.equal(new Set(occ).size, 2, 'GERÇEK duvar saatiyle aynı occurrence iki kez koşmaz');
  assert.ok(occ[1] - occ[0] >= 150, 'gerçek cadence: ikinci tick ilk occurrence + 200ms (çocuk uzun sürerse overlap adil yeniden deneme)');
});

test('GERÇEK STOP mandalı: latched dosya defteri → çocuk HİÇ çıkmaz; mandal açılınca çıkar', async () => {
  const dbPath = tempDb(false); // fail-closed doğdu: dispatch_paused=1
  const stopAt = Date.now() + 600;
  const r1 = await runDaemon({
    // maxTicks=4 evren tavanı (yeterince occurrence doğsun; duruş shouldStop'tan gelir)
    intervalMs: 200, maxTicks: 4, dbPath, childArgs: ['status'],
    shouldStop: () => Date.now() > stopAt,
    log: () => {},
  });
  assert.equal(r1.stats.ticks, 0, 'mandalı kapalı GERÇEK defterde çocuk HİÇ spawn edilmedi');
  assert.ok(r1.stats.skipped.stopped >= 2, 'mandal penceresindeki occurrence\'lar gerçek döngüde STOPPED atlandı');
  assert.equal(r1.code, 0);

  const db = openStore(dbPath);
  setGlobalStop(db, false, 'test', 'mandal-acildi');
  db.close();
  const r2 = await runDaemon({
    intervalMs: 200, maxTicks: 1, dbPath, childArgs: ['status'], log: () => {},
  });
  assert.equal(r2.stats.ticks, 1, 'mandal açılınca aynı defterde tick çocuğu çıktı (adil yeniden deneme)');
  assert.equal(r2.code, 0);
});

test('fail-closed GERÇEK çocuk: bilinmeyen komut exit 1 → 3 üst üste → daemon exit 1 ile ölür', async () => {
  const dbPath = tempDb(true);
  const r = await runDaemon({
    intervalMs: 150, dbPath, childArgs: ['bilmem-ne-komut'], log: () => {},
  });
  assert.equal(r.stats.reason, 'fail-closed');
  assert.equal(r.code, 1, 'daemon son GERÇEK çocuk exit koduyla ölür (sessiz kırmızı döngü yok)');
  assert.equal(r.stats.ticks, 3);
  assert.equal(r.stats.failed, 3);
});
