// M12 canlı bacak (FAZ-3 K2; triyaj raporlar/faz3-triyaj-2026-10-25.md): GERÇEK
// koşulmuş benchmark. Hermetik kol (benchmark.test.ts) enjekte executor'lardı; burada
// executor'lar GERÇEK node child süreçleri doğurur — süreler gerçek duvar-saati ölçümü,
// sonuçlar GERÇEK çıktı kontrolüyle (parent, child'in bastığı medyanı beklenenle
// karşılaştırır = gerçek evaluator), timeout GERÇEK zaman aşımı (real timer yarışı +
// gerçek SIGKILL). Yerel runtime'da token ölçümü YOKTUR → maliyet dürüstlüğü (Y5):
// 'unknown' raporlanır, 0 SAYILMAZ. Model karşılaştırması (LLM harcaması) V3-S4'te
// ayrı kapıdır — bu test pipeline mekaniğinin canlı kanıtıdır, ustunluk iddiası ÜRETMEZ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { runBenchmark, raporMd, type KolTanimi, type DenemeSonucu } from '../src/benchmark.ts';

const VERI = [5, 3, 8, 1, 9, 2, 7, 4, 6];
const BEKLENEN_MEDYAN = '5'; // gerçek evaluator: child'in ciktisi buna ESIT olmali

// Gerçek koşum: child süreç doğar, gerçek iş yapar, süre ölçülür, çıktı değerlendirilir.
// Zaman aşaması GERÇEKTİR: real timer ile yarış, aşınca child SIGKILL.
async function gercekKos(kod: string, zamanAsimiMs: number): Promise<{ durum: 'kabul' | 'red' | 'timeout'; sureMs: number }> {
  const t0 = Date.now();
  const child = spawn(process.execPath, ['-e', kod], { stdio: ['ignore', 'pipe', 'inherit'] });
  let cikti = '';
  child.stdout.on('data', (c: Buffer) => { cikti += c; });
  const cikis = new Promise<number>((res) => child.on('exit', (c) => res(c ?? -1)));
  const tasma = new Promise<'timeout'>((res) => { setTimeout(() => res('timeout'), zamanAsimiMs); });
  const son = await Promise.race([cikis.then(() => 'cikis' as const), tasma]);
  const sureMs = Date.now() - t0;
  if (son === 'timeout') {
    child.kill('SIGKILL'); // yalnız kendi child'ımız
    return { durum: 'timeout', sureMs };
  }
  // GERÇEK değerlendirme: çıktı medyan eşitliği (evaluator metadata'sının icrası)
  return { durum: cikti.trim() === BEKLENEN_MEDYAN ? 'kabul' : 'red', sureMs };
}

function executor(kod: string, zamanAsimiMs: number): (ctx: { denemeNo: number }) => Promise<DenemeSonucu> {
  return async (ctx) => {
    const r = await gercekKos(kod(ctx.denemeNo), zamanAsimiMs);
    return {
      durum: r.durum, ilkAdayKabul: r.durum === 'kabul', sureMs: r.sureMs,
      maliyetToken: 'unknown', // Y5 dürüstlük: yerel runtime'da token ölçümü YOK — 0 değil 'unknown'
      insanMudahalesi: 0,
    };
  };
}

const GOREV = 'veriyi sirala ve medyani yaz';
const SOURCE = 'dizi=' + VERI.join(',');
const EVALUATOR = { surum: 'v1', komut: 'cikti === "5" (gercek parent kontrolu)' };
const BUTCE = { token: 1000, sureMs: 5000 };

test('M12 canlı benchmark: gerçek süreç + gerçek ölçüm + gerçek değerlendirme + tam payda + unknown maliyet + yargısız rapor', async () => {
  const kollar: KolTanimi[] = [
    {
      ad: 'builtin-sort',
      birim: { model: 'yok/local', runtime: 'node-cocuk', prompt: 'std-sort', araclar: ['Array.prototype.sort'], izin: 'cocuk-sureci', evaluatorSurumu: 'v1' },
      gorev: GOREV, source: SOURCE, evaluator: EVALUATOR, butce: BUTCE,
      executor: executor(() => 'const a=[' + VERI.join(',') + '];a.sort((x,y)=>x-y);process.stdout.write(String(a[4]));', 4000),
    },
    {
      ad: 'naive-insertion-sort',
      birim: { model: 'yok/local', runtime: 'node-cocuk', prompt: 'elle-insertion', araclar: ['insertion-loop'], izin: 'cocuk-sureci', evaluatorSurumu: 'v1' },
      gorev: GOREV, source: SOURCE, evaluator: EVALUATOR, butce: BUTCE,
      // 3. denemede GERÇEK zaman aşımı: child sonsuz bekler, zaman aşımını geçince SIGKILL.
      // 2000ms: tam-suit yükünde node açılışı ~90ms'nin çok üstüne çıkabilir (250ms koşusunda
      // 0 kabul flake'i yaşandı); duraksama denemesi sonsuz bekler → timeout yine GERÇEKTİR.
      executor: executor((denemeNo) => denemeNo === 2
        ? 'setInterval(function(){},1000)' // bilincli duraksama → gerçek timeout
        : 'const a=[' + VERI.join(',') + '];for(let i=1;i<a.length;i++){const k=a[i];let j=i-1;while(j>=0&&a[j]>k){a[j+1]=a[j];j--;}a[j+1]=k;}process.stdout.write(String(a[4]));',
        2000),
    },
  ];

  const rapor = await runBenchmark(kollar, { deneyId: 'm12-canli-2026-10-25', tekrar: 3 });
  const [a, b] = rapor.kollar;

  // gerçek koşum: her deneme gerçek ölçülmüş süre taşıdı
  assert.ok(a.p50SureMs > 0 && b.p50SureMs > 0, 'süreler gerçek duvar-saati ölçümü');
  // tam payda: timeout NİHAİ kabul oranının paydasında (çıkarılmaz)
  assert.equal(a.durumlar.kabul, 3, 'builtin-sort: 3/3 gerçek değerlendirme kabul');
  assert.equal(b.durumlar.kabul, 2, 'naive: 2 gerçek kabul');
  assert.equal(b.durumlar.timeout, 1, 'naive 3. deneme GERÇEK zaman aşımı (SIGKILL)');
  assert.equal(b.n, 3, 'tam payda: timeout denemesi de n=3 içinde');
  assert.equal(b.nihaiKabulOrani, 2 / 3, 'nihai oran = kabul/n (timeout düşülmez)');
  assert.equal(b.ilkAdayOrani, 2 / 3, 'ilk-aday oranı ayrı metrik');
  // maliyet dürüstlüğü (Y5): yerel runtime token ölçmez → 'unknown', 0 SAYILMAZ
  assert.equal(a.toplamMaliyetToken, 'unknown', 'yerel maliyet bilinmiyor → unknown');
  assert.equal(a.maliyetBilinmeyenDeneme, 3);
  // küçük-n uyarısı zorunlu (dürüstlük kapısı)
  assert.ok(rapor.uyarilar.length >= 2 && rapor.uyarilar[0].includes('nedensellik'), 'n<esik uyarısı var');
  // rapor yargı/üstünlük ÜRETMEZ
  const md = raporMd(rapor);
  for (const yasak of ['daha iyi', 'üstün', 'ustun', 'kazand', 'yenik']) {
    assert.ok(!md.toLowerCase().includes(yasak), 'rapor yargı metni taşımaz: ' + yasak);
  }
  assert.ok(md.includes('| kol | n | nihaiKabulOrani |'), 'metrik tablosu var');

  // kanıt artefaktı: gerçek koşulmuş rapor diske (suite logu dışında kalıcı kopya)
  const dir = mkdtempSync(join(tmpdir(), 'ordu-m12-'));
  writeFileSync(join(dir, 'benchmark-rapor.json'), JSON.stringify(rapor, null, 2), 'utf8');
  writeFileSync(join(dir, 'benchmark-rapor.md'), md, 'utf8');
  console.log('KANIT M12: gerçek süreç koşumu — a.p50=' + a.p50SureMs + 'ms (3/3 kabul) · b.p50=' + b.p50SureMs + 'ms (2 kabul + 1 GERÇEK timeout, paydada) · maliyet=unknown (Y5) · uyarı: ' + rapor.uyarilar[0]);
});
