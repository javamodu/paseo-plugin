// F6-C eslenmis benchmark testleri (kabul.csv M12: gorev paydasi + toplam maliyet).
// Hermetik: tum executor'lar sahte fonksiyon; gercek LLM/dis API YOK.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BenchmarkError, birimKimligi, eslesmisBirimMi, raporMd, runBenchmark,
  type BenchmarkBirimi, type DenemeSonucu, type KolTanimi,
} from '../src/benchmark.ts';

const birim = (patch: Partial<BenchmarkBirimi> = {}): BenchmarkBirimi => ({
  model: 'fake-model-a',
  runtime: 'fake-runtime-1',
  prompt: 'prompt-v1',
  araclar: ['read', 'test'],
  izin: 'auto',
  evaluatorSurumu: 'eval-1.0',
  ...patch,
});

const kol = (ad: string, patch: Partial<KolTanimi> = {}): KolTanimi => ({
  ad,
  birim: birim({ prompt: ad === 'dersli' ? 'prompt-dersli' : 'prompt-v1' }),
  gorev: 'X fonksiyonunu yaz ve testleri gecir',
  source: 'sabit-source-icerigi',
  evaluator: { surum: '1.0', komut: 'node --test' },
  butce: { token: 1000, sureMs: 60000 },
  executor: () => ({ durum: 'kabul', ilkAdayKabul: true, sureMs: 100, maliyetToken: 10, insanMudahalesi: 0 }),
  ...patch,
});

const ZAMAN = '2026-10-14T06:00:00.000Z';

test('sabitlik esitligi bozulunca RED: gorev/source/evaluator/butce tek tek', async () => {
  const bozanlar: Array<[string, Partial<KolTanimi>]> = [
    ['gorev', { gorev: 'baska gorev' }],
    ['source', { source: 'baska source' }],
    ['evaluator', { evaluator: { surum: '2.0', komut: 'node --test' } }],
    ['butce', { butce: { token: 2000, sureMs: 60000 } }],
  ];
  for (const [alan, patch] of bozanlar) {
    await assert.rejects(
      () => runBenchmark([kol('dersli'), kol('derssiz', patch)], { deneyId: 'd1', tekrar: 1, olusturmaZamani: ZAMAN }),
      (e: any) => {
        assert.ok(e instanceof BenchmarkError, `${alan}: BenchmarkError bekleniyor`);
        assert.equal(e.code, 'ESLESME_RED', `${alan}: kod ESLESME_RED olmali`);
        return true;
      },
      `${alan} farki RED uretmeli`,
    );
  }
});

test('tek kol ile deney RED (eslenmis icin en az 2 kol)', async () => {
  await assert.rejects(
    () => runBenchmark([kol('dersli')], { deneyId: 'd1', tekrar: 1, olusturmaZamani: ZAMAN }),
    (e: any) => e instanceof BenchmarkError && e.code === 'ESLESME_RED',
  );
});

test('tam payda: kabul+red+timeout+iptal hepsi paydada', async () => {
  const durumlar = ['kabul', 'red', 'timeout', 'iptal'] as const;
  const executor = (ctx: { denemeNo: number }): DenemeSonucu => ({
    durum: durumlar[ctx.denemeNo % 4],
    ilkAdayKabul: false,
    sureMs: [10, 20, 30, 40][ctx.denemeNo % 4],
    maliyetToken: 5,
    insanMudahalesi: 1,
  });
  const rapor = await runBenchmark(
    [kol('dersli', { executor }), kol('derssiz', { executor })],
    { deneyId: 'payda', tekrar: 4, olusturmaZamani: ZAMAN },
  );
  for (const k of rapor.kollar) {
    assert.deepEqual(k.durumlar, { kabul: 1, red: 1, timeout: 1, iptal: 1 });
    assert.equal(k.nihaiKabulOrani, 1 / 4, 'payda n=4 (timeout+iptal+red dahil)');
    assert.equal(k.n, 4);
    assert.equal(k.p50SureMs, 20);
    assert.equal(k.p95SureMs, 40);
    assert.equal(k.insanMudahalesi, 4);
    assert.equal(k.toplamMaliyetToken, 20);
  }
  assert.equal(rapor.sabitlik.gorevHash, rapor.kollar[0].gorevHash);
  assert.equal(rapor.kollar[0].gorevHash, rapor.kollar[1].gorevHash);
});

test('bilinmeyen maliyet sifir sayilmaz: unknown olarak raporlanir', async () => {
  const executor = (ctx: { denemeNo: number }): DenemeSonucu => ({
    durum: 'kabul',
    ilkAdayKabul: true,
    sureMs: 10,
    maliyetToken: ctx.denemeNo === 0 ? 100 : 'unknown',
    insanMudahalesi: 0,
  });
  const rapor = await runBenchmark(
    [kol('dersli', { executor }), kol('derssiz')],
    { deneyId: 'maliyet', tekrar: 2, olusturmaZamani: ZAMAN },
  );
  assert.equal(rapor.kollar[0].toplamMaliyetToken, 'unknown', 'bir unknown varsa toplam unknown, 100 DEGIL');
  assert.equal(rapor.kollar[0].maliyetBilinmeyenDeneme, 1);
  assert.equal(rapor.kollar[1].toplamMaliyetToken, 20, 'tumu bilinen kol toplami sayisal');
  assert.equal(rapor.kollar[1].maliyetBilinmeyenDeneme, 0);
});

test('ilk-aday basarisi ile nihai kabul ayri metrikler', async () => {
  const sonuclar: DenemeSonucu[] = [
    { durum: 'kabul', ilkAdayKabul: false, sureMs: 10, maliyetToken: 1, insanMudahalesi: 0 }, // retry ile kabul
    { durum: 'red', ilkAdayKabul: false, sureMs: 10, maliyetToken: 1, insanMudahalesi: 0 },
    { durum: 'kabul', ilkAdayKabul: true, sureMs: 10, maliyetToken: 1, insanMudahalesi: 0 }, // ilk adayda kabul
  ];
  const executor = (ctx: { denemeNo: number }): DenemeSonucu => sonuclar[ctx.denemeNo];
  const rapor = await runBenchmark(
    [kol('dersli', { executor }), kol('derssiz', { executor })],
    { deneyId: 'ayrim', tekrar: 3, olusturmaZamani: ZAMAN },
  );
  const k = rapor.kollar[0];
  assert.equal(k.nihaiKabulOrani, 2 / 3);
  assert.equal(k.ilkAdayOrani, 1 / 3, 'ilk aday orani nihai kabuldan farkli sayilmali');
  assert.notEqual(k.ilkAdayOrani, k.nihaiKabulOrani);
});

test('rapor semasi kapali nesne: tam anahtar kumesi', async () => {
  const rapor = await runBenchmark([kol('dersli'), kol('derssiz')], { deneyId: 'sema', tekrar: 2, olusturmaZamani: ZAMAN });
  assert.deepEqual(
    Object.keys(rapor).sort(),
    ['deneyId', 'kollar', 'nEsik', 'olusturmaZamani', 'sabitlik', 'sema', 'uyarilar'].sort(),
  );
  assert.equal(rapor.sema, 'ordu-benchmark/v1');
  assert.deepEqual(Object.keys(rapor.sabitlik).sort(), ['butce', 'evaluatorHash', 'gorevHash', 'sourceHash'].sort());
  assert.deepEqual(Object.keys(rapor.sabitlik.butce).sort(), ['sureMs', 'token'].sort());
  assert.deepEqual(
    Object.keys(rapor.kollar[0]).sort(),
    [
      'ad', 'birim', 'birimKimligi', 'butce', 'durumlar', 'evaluatorHash', 'gorevHash', 'ilkAdayOrani',
      'insanMudahalesi', 'maliyetBilinmeyenDeneme', 'n', 'nihaiKabulOrani', 'p50SureMs', 'p95SureMs',
      'sourceHash', 'toplamMaliyetToken',
    ].sort(),
  );
  assert.deepEqual(Object.keys(rapor.kollar[0].durumlar).sort(), ['iptal', 'kabul', 'red', 'timeout'].sort());
  assert.deepEqual(
    Object.keys(rapor.kollar[0].birim).sort(),
    ['araclar', 'evaluatorSurumu', 'izin', 'model', 'prompt', 'runtime'].sort(),
  );
});

const YARGI = /(üstün|ustun|daha iyi|daha kötü|daha kotu|kazandı|kazandi|kaybetti|yenik|yenildi|winner|better|worse|superior)/i;

test('durustluk kapisi: rapor ve md hicbir yargi/ustunluk kelimesi icermez', async () => {
  const rapor = await runBenchmark([kol('dersli'), kol('derssiz')], { deneyId: 'durust', tekrar: 5, olusturmaZamani: ZAMAN });
  const metin = JSON.stringify(rapor) + '\n' + raporMd(rapor);
  assert.ok(!YARGI.test(metin), `yargi kelimesi bulundu: ${metin.match(YARGI)?.[0]}`);
});

test('n esigi parametrik: esik altinda nedensellik uyarisi, ustunde yok', async () => {
  const dusuk = await runBenchmark([kol('dersli'), kol('derssiz')], { deneyId: 'n1', tekrar: 2, nEsik: 30, olusturmaZamani: ZAMAN });
  assert.equal(dusuk.uyarilar.length, 2, 'iki kol icin iki uyari');
  assert.ok(dusuk.uyarilar.every((u) => u.includes('nedensellik icin yeterli degil')));
  assert.ok(!YARGI.test(dusuk.uyarilar.join(' ')), 'uyari metni de yargi icermez');
  const md = raporMd(dusuk);
  assert.ok(md.includes('nedensellik icin yeterli degil'));

  const yeterli = await runBenchmark([kol('dersli'), kol('derssiz')], { deneyId: 'n2', tekrar: 4, nEsik: 4, olusturmaZamani: ZAMAN });
  assert.equal(yeterli.uyarilar.length, 0, 'n >= esik ise uyari yok');
});

test('birim kimligi: tek alan farki = farkli kimlik (eslenmis sayilmaz)', () => {
  const a = birim();
  assert.equal(birimKimligi(a), birimKimligi(birim()), 'ayni 6 alan = ayni kimlik');
  const alanlar: Array<Partial<BenchmarkBirimi>> = [
    { model: 'fake-model-b' }, { runtime: 'fake-runtime-2' }, { prompt: 'prompt-v2' },
    { araclar: ['read'] }, { izin: 'readonly' }, { evaluatorSurumu: 'eval-2.0' },
  ];
  for (const patch of alanlar) {
    assert.notEqual(birimKimligi(birim(patch)), birimKimligi(a), `tek alan farki kimligi degistirmeli: ${JSON.stringify(patch)}`);
    assert.equal(eslesmisBirimMi(birim(patch), a), false);
  }
  assert.equal(eslesmisBirimMi(a, birim()), true);
});

test('gecersiz executor sonucu SONUC_GECERSIZ uretir', async () => {
  const bozuk = kol('dersli', { executor: () => ({ durum: 'belki', ilkAdayKabul: true, sureMs: 1, maliyetToken: 1, insanMudahalesi: 0 }) as any });
  await assert.rejects(
    () => runBenchmark([bozuk, kol('derssiz')], { deneyId: 'd1', tekrar: 1, olusturmaZamani: ZAMAN }),
    (e: any) => e instanceof BenchmarkError && e.code === 'SONUC_GECERSIZ',
  );
});

test('md ozet: tablo + durustluk notu, makine raporuyla tutarli', async () => {
  const rapor = await runBenchmark([kol('dersli'), kol('derssiz')], { deneyId: 'md', tekrar: 3, olusturmaZamani: ZAMAN });
  const md = raporMd(rapor);
  assert.ok(md.includes('# Benchmark Ozeti: md'));
  assert.ok(md.includes('| kol | n | nihaiKabulOrani | ilkAdayOrani | p50SureMs | p95SureMs | toplamMaliyetToken | insanMudahalesi |'));
  assert.ok(md.includes('| dersli | 3 | 1 | 1 | 100 | 100 | 30 | 0 |'));
  assert.ok(md.includes('yalniz metrik raporudur'));
});