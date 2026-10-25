// F6-C eslenmis benchmark iskeleti (kabul.csv M12: gorev paydasi + toplam maliyet).
// Demir kurallar:
// 1) ESLENMISLIK: kol basina {gorevHash, sourceHash, evaluatorHash, butce} esitligi assert edilir; tek fark = RED (ESLESME_RED).
// 2) TAM PAYDA: basarisiz + timeout + iptal paydada DAHIL; ilk-aday basarisi ile nihai kabul AYRI metrikler.
// 3) MALIYET DURUSTLUGU (Y5): bilinmeyen maliyet SIFIR DEGIL 'unknown' olarak raporlanir.
// 4) BIRIM KIMLIGI: model+runtime+prompt+araclar+izin+evaluator surumu birlikte kimliklenir (tek alan farki = baska birim).
// 5) DURUSTLUK KAPISI: rapor hicbir zaman ustunluk/yargi metni yazamaz; n < esik ise 'nedensellik icin yeterli degil' uyarisi zorunlu.
// Hermetik: executor fonksiyonlari enjekte edilir; gercek LLM/dis API YOK.
import { createHash } from 'node:crypto';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export class BenchmarkError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'BenchmarkError';
    this.code = code;
  }
}

export interface BenchmarkBirimi {
  model: string;
  runtime: string;
  prompt: string;
  araclar: string[];
  izin: string;
  evaluatorSurumu: string;
}

export interface Butce {
  token: number;
  sureMs: number;
}

export type DenemeDurumu = 'kabul' | 'red' | 'timeout' | 'iptal';
const DURUMLAR: readonly DenemeDurumu[] = ['kabul', 'red', 'timeout', 'iptal'];

export interface DenemeSonucu {
  durum: DenemeDurumu;
  ilkAdayKabul: boolean;              // ilk aday dogrudan kabul gordu mu (retry'siz)
  sureMs: number;
  maliyetToken: number | 'unknown';   // bilinmiyorsa ASLA 0 degil 'unknown'
  insanMudahalesi: number;            // deneme icindeki insan mudahalesi sayisi
}

export interface DenemeBaglami {
  kolAdi: string;
  denemeNo: number;                   // 0-tabanli
  gorev: string;
  source: string;
  butce: Butce;
}

export type BenchmarkExecutor = (ctx: DenemeBaglami) => Promise<DenemeSonucu> | DenemeSonucu;

export interface KolTanimi {
  ad: string;
  birim: BenchmarkBirimi;
  gorev: string;
  source: string;
  evaluator: { surum: string; komut: string };
  butce: Butce;
  executor: BenchmarkExecutor;
}

export interface DeneySecenekleri {
  deneyId: string;
  tekrar: number;                     // kol basina deneme sayisi (n)
  nEsik?: number;                     // nedensellik uyarisi esigi (varsayilan 30)
  olusturmaZamani?: string;           // determinizm icin enjekte edilebilir ISO zaman
}

export const VARSAYILAN_N_ESIK = 30;

// Birim kimligi: 6 alan birlikte; tek alan farki = farkli kimlik (eslenmis sayilmaz).
export function birimKimligi(birim: BenchmarkBirimi): string {
  return sha256(
    'ordu-benchmark/birim/v1|' +
      [birim.model, birim.runtime, birim.prompt, birim.izin, birim.evaluatorSurumu, birim.araclar.join(',')].join('|'),
  );
}

export function eslesmisBirimMi(a: BenchmarkBirimi, b: BenchmarkBirimi): boolean {
  return birimKimligi(a) === birimKimligi(b);
}

const gorevHash = (kol: KolTanimi) => sha256('ordu-benchmark/gorev/v1|' + kol.gorev);
const sourceHash = (kol: KolTanimi) => sha256('ordu-benchmark/source/v1|' + kol.source);
const evaluatorHash = (kol: KolTanimi) =>
  sha256('ordu-benchmark/evaluator/v1|' + kol.evaluator.surum + '|' + kol.evaluator.komut);

function sabitlikKontrol(kollar: KolTanimi[]) {
  if (kollar.length < 2) throw new BenchmarkError('ESLESME_RED', 'eslenmis deney icin en az 2 kol gerekli');
  const ref = kollar[0];
  for (let i = 1; i < kollar.length; i++) {
    const kol = kollar[i];
    if (gorevHash(kol) !== gorevHash(ref)) {
      throw new BenchmarkError('ESLESME_RED', `kol '${kol.ad}': gorevHash farkli — eslenmis degil (ayni gorev sart)`);
    }
    if (sourceHash(kol) !== sourceHash(ref)) {
      throw new BenchmarkError('ESLESME_RED', `kol '${kol.ad}': sourceHash farkli — eslenmis degil (ayni source sart)`);
    }
    if (evaluatorHash(kol) !== evaluatorHash(ref)) {
      throw new BenchmarkError('ESLESME_RED', `kol '${kol.ad}': evaluatorHash farkli — sabit evaluator sarti bozuldu`);
    }
    if (kol.butce.token !== ref.butce.token || kol.butce.sureMs !== ref.butce.sureMs) {
      throw new BenchmarkError('ESLESME_RED', `kol '${kol.ad}': butce farkli — eslenmis degil (ayni butce sart)`);
    }
  }
}

function sonucDogrula(kolAdi: string, denemeNo: number, s: DenemeSonucu): DenemeSonucu {
  if (!s || typeof s !== 'object') throw new BenchmarkError('SONUC_GECERSIZ', `kol '${kolAdi}' deneme ${denemeNo}: sonuc nesne degil`);
  if (!DURUMLAR.includes(s.durum)) {
    throw new BenchmarkError('SONUC_GECERSIZ', `kol '${kolAdi}' deneme ${denemeNo}: gecersiz durum '${String(s.durum)}'`);
  }
  if (typeof s.ilkAdayKabul !== 'boolean') throw new BenchmarkError('SONUC_GECERSIZ', `kol '${kolAdi}' deneme ${denemeNo}: ilkAdayKabul boolean olmali`);
  if (!Number.isFinite(s.sureMs) || s.sureMs < 0) throw new BenchmarkError('SONUC_GECERSIZ', `kol '${kolAdi}' deneme ${denemeNo}: sureMs gecersiz`);
  if (!(s.maliyetToken === 'unknown' || (Number.isFinite(s.maliyetToken) && s.maliyetToken >= 0))) {
    throw new BenchmarkError('SONUC_GECERSIZ', `kol '${kolAdi}' deneme ${denemeNo}: maliyetToken number>=0 veya 'unknown' olmali`);
  }
  if (!Number.isInteger(s.insanMudahalesi) || s.insanMudahalesi < 0) {
    throw new BenchmarkError('SONUC_GECERSIZ', `kol '${kolAdi}' deneme ${denemeNo}: insanMudahalesi tamsayi>=0 olmali`);
  }
  return s;
}

function yuzdelik(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export interface KolRaporu {
  ad: string;
  birimKimligi: string;
  birim: BenchmarkBirimi;
  gorevHash: string;
  sourceHash: string;
  evaluatorHash: string;
  butce: Butce;
  n: number;
  durumlar: { kabul: number; red: number; timeout: number; iptal: number };
  nihaiKabulOrani: number;            // kabul / n (tam payda: timeout+iptal+red DAHIL)
  ilkAdayOrani: number;               // ilk adayda kabul / n — nihai kabuldan AYRI
  p50SureMs: number;
  p95SureMs: number;
  toplamMaliyetToken: number | 'unknown';
  maliyetBilinmeyenDeneme: number;
  insanMudahalesi: number;
}

export interface BenchmarkRaporu {
  sema: 'ordu-benchmark/v1';
  deneyId: string;
  olusturmaZamani: string;
  nEsik: number;
  sabitlik: { gorevHash: string; sourceHash: string; evaluatorHash: string; butce: Butce };
  kollar: KolRaporu[];
  uyarilar: string[];
}

export async function runBenchmark(kollar: KolTanimi[], sec: DeneySecenekleri): Promise<BenchmarkRaporu> {
  if (!Number.isInteger(sec.tekrar) || sec.tekrar < 1) {
    throw new BenchmarkError('SECENEK_GECERSIZ', 'tekrar tamsayi>=1 olmali');
  }
  sabitlikKontrol(kollar);
  const nEsik = sec.nEsik ?? VARSAYILAN_N_ESIK;
  const n = sec.tekrar;
  const uyarilar: string[] = [];
  const kolRaporlari: KolRaporu[] = [];

  for (const kol of kollar) {
    const durumlar = { kabul: 0, red: 0, timeout: 0, iptal: 0 };
    const sureler: number[] = [];
    let ilkAday = 0;
    let maliyetToplam = 0;
    let maliyetBilinmeyen = 0;
    let mudahale = 0;

    for (let i = 0; i < n; i++) {
      const ham = await kol.executor({ kolAdi: kol.ad, denemeNo: i, gorev: kol.gorev, source: kol.source, butce: kol.butce });
      const s = sonucDogrula(kol.ad, i, ham);
      durumlar[s.durum]++;
      if (s.ilkAdayKabul) ilkAday++;
      sureler.push(s.sureMs);
      if (s.maliyetToken === 'unknown') maliyetBilinmeyen++;
      else maliyetToplam += s.maliyetToken;
      mudahale += s.insanMudahalesi;
    }

    sureler.sort((a, b) => a - b);
    kolRaporlari.push({
      ad: kol.ad,
      birimKimligi: birimKimligi(kol.birim),
      birim: kol.birim,
      gorevHash: gorevHash(kol),
      sourceHash: sourceHash(kol),
      evaluatorHash: evaluatorHash(kol),
      butce: kol.butce,
      n,
      durumlar,
      nihaiKabulOrani: durumlar.kabul / n,
      ilkAdayOrani: ilkAday / n,
      p50SureMs: yuzdelik(sureler, 50),
      p95SureMs: yuzdelik(sureler, 95),
      toplamMaliyetToken: maliyetBilinmeyen > 0 ? 'unknown' : maliyetToplam,
      maliyetBilinmeyenDeneme: maliyetBilinmeyen,
      insanMudahalesi: mudahale,
    });

    if (n < nEsik) {
      uyarilar.push(`kol '${kol.ad}': n=${n} < esik=${nEsik}; nedensellik icin yeterli degil (tablo yalniz metrik raporudur)`);
    }
  }

  const ref = kollar[0];
  return {
    sema: 'ordu-benchmark/v1',
    deneyId: sec.deneyId,
    olusturmaZamani: sec.olusturmaZamani ?? new Date().toISOString(),
    nEsik,
    sabitlik: {
      gorevHash: gorevHash(ref),
      sourceHash: sourceHash(ref),
      evaluatorHash: evaluatorHash(ref),
      butce: ref.butce,
    },
    kollar: kolRaporlari,
    uyarilar,
  };
}

// Insan icin kisa ozet. DURUSTLUK KAPISI: bu fonksiyon yargi/ustunluk metni URETMEZ;
// yalniz metrik tablosu + uyarilari yazar.
export function raporMd(rapor: BenchmarkRaporu): string {
  const satirlar: string[] = [];
  satirlar.push('# Benchmark Ozeti: ' + rapor.deneyId);
  satirlar.push('');
  satirlar.push('| kol | n | nihaiKabulOrani | ilkAdayOrani | p50SureMs | p95SureMs | toplamMaliyetToken | insanMudahalesi |');
  satirlar.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const k of rapor.kollar) {
    satirlar.push(
      '| ' + k.ad + ' | ' + k.n + ' | ' + k.nihaiKabulOrani + ' | ' + k.ilkAdayOrani + ' | ' +
        k.p50SureMs + ' | ' + k.p95SureMs + ' | ' + k.toplamMaliyetToken + ' | ' + k.insanMudahalesi + ' |',
    );
  }
  satirlar.push('');
  satirlar.push('Not: bu tablo yalniz metrik raporudur; tek basina nedensellik kaniti degildir.');
  for (const u of rapor.uyarilar) satirlar.push('- UYARI: ' + u);
  return satirlar.join('\n') + '\n';
}