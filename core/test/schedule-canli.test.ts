// M08 canlı bacak (FAZ-3 K2; triyaj raporlar/faz3-triyaj-2026-10-25.md): GERÇEK
// duvar-saati döngüsü. Hermetik kol (schedule.test.ts) enjekte nowMs'li saf mantık
// sınavıydı; burada döngü GERÇEK zamanla koşar: tick'ler gerçek setTimeout'la atılır,
// occurrence anları gerçek Date.now() ile hesaplanır, settled kümesi gerçek koşum
// sırasında büyür. Kanıtlanan: (1) gerçek zamanda aynı occurrence İKİ KEZ koşmaz
// (M08 benzersizlik), (2) döngü duraklayınca kaçan occurrence'lar MISFIRE_SKIPPED ile
// KALICI elenir — catch-up fırtınası YOK (M10), yalnız en sonuncu hak eder, (3) yerleşen
// occurrence bir daha üretilmez, (4) rev bump yeni kimlik üretir (occurrenceKey).
// Duraklatma ~900ms GERÇEKTİR (gerçek misfire gözlemi — sahte saat yok).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { occurrenceKey, planOccurrences, settleKeys, type GateState, type ScheduleSpec } from '../src/schedule.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test('M08 canlı scheduler döngüsü: gerçek duvar saatiyle koşum — benzersizlik + gerçek misfire + yerleşme + rev kimliği', async () => {
  const spec: ScheduleSpec = {
    scheduleId: 'm08-canli', revision: 1, kind: 'INTERVAL',
    startAt: new Date(Date.now() - 50).toISOString(), intervalMs: 300, maxOccurrences: 100,
  };
  const gate: GateState = { stopLatched: false, grantActive: true, overlapActive: false, settled: new Set() };
  const koşulan: string[] = [];
  const tick = () => {
    const plan = planOccurrences(spec, Date.now(), gate);
    for (const k of settleKeys(spec, plan)) gate.settled.add(k);
    for (const at of plan.emit) koşulan.push(occurrenceKey(spec, at));
    return plan;
  };

  // 1) GERÇEK zamanlı döngü: 700ms boyunca 60ms'de bir tick; 300ms aralıklı occurrence
  const t0 = Date.now();
  while (Date.now() - t0 < 700) { tick(); await sleep(60); }
  assert.ok(koşulan.length >= 2 && koşulan.length <= 3, 'gerçek zamanda ' + koşulan.length + ' occurrence koştu (300ms aralık, 700ms pencere)');
  assert.equal(new Set(koşulan).size, koşulan.length, 'GERÇEK duvar saatiyle koşan döngüde occurrence TEKRARI yok (M08)');

  // 2) GERÇEK duraklatma (900ms tick yok) → kaçan occurrence'lar MISFIRE, yalnız EN SON
  await sleep(900);
  const p1 = tick();
  assert.equal(p1.emit.length, 1, 'catch-up fırtınası YOK: duraklama sonrası tek tick yalnız EN SON occurrence hak eder');
  assert.ok(p1.skipped.some((s) => s.reason === 'MISFIRE_SKIPPED'), 'duraklamada kaçan gerçek occurrence MISFIRE_SKIPPED');
  assert.ok(koşulan.length >= 3, 'toplam koşum arttı (misfire tek başına döngüyü durdurmaz)');

  // 3) yerleşen kalıcı: hemen sonraki tick yeni emit ÜRETMEZ
  const p2 = tick();
  assert.equal(p2.emit.length, 0, 'yerleşen occurrence bir daha koşmaz (settled kalıcı)');

  // 4) rev bump → YENİ kimlik: aynı zaman aralığı yeni occurrence'lar doğurur
  const spec2 = { ...spec, revision: 2 };
  const p3 = planOccurrences(spec2, Date.now(), gate);
  assert.equal(p3.emit.length, 1, 'rev bump sonrası en son occurrence yeniden hak eder');
  const yeniAnahtar = occurrenceKey(spec2, p3.emit[0]);
  assert.ok(yeniAnahtar.includes('|r2|'), 'rev bump yeni kimlik üretir (r1 → r2)');
  assert.ok(!gate.settled.has(yeniAnahtar), 'yeni kimlik eski settled ile ÇAKIŞMAZ');

  console.log('KANIT M08: gerçek duvar saati döngüsü — ' + koşulan.length + ' occurrence koştu, tekrar 0; 900ms gerçek duraklamada MISFIRE_SKIPPED kalıcı; yerleşen yeniden koşmaz; rev-2 yeni kimlik');
});
