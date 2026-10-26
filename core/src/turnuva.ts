// F8 ARASTIRMA TURNUVASI (plan §21 — 7 adimli protokol, R1; Sprint 4 "F8 turnuva
// protokolü" 2026-10-26). KIMLIK ZINCIRI: taskId -> runId -> roundId -> nodeId ->
// attemptId; round != attempt (arastirma turu round=2 iken API retry attempt=3
// olabilir — v2.9 düzeltmesi). YENI TABLO ZORUNLU DEGIL (§21): kalicilik append-only
// turnuva.jsonl (notify/lessons deseni — store semasina ve node:sqlite'ye DOKUNULMAZ;
// R6'ya saygı: yeni command.kind / Event.type YOK). Surumler/Reviewlar KAYITLI ve
// SORGULANABILIR (K12-01: "tum surumler + review kayitli").
//
// 7 ADIM (kapilar fail-closed):
// 1. BAGIMSIZ URETIM: ilk cevaplar diger ajanlara KAPALI — ilk review acilinca YENI
//    ilk-cevap kaydi RED (bagimsizlik geri alinamaz).
// 2. SURUMLU KAYIT: model/runtime + brief + kaynaklar + cikti surumu (icerikHash).
// 3. ON KONTROL: eksik alan / uydurma kaynak / kanitsiz iddia ISARETI (bayrak).
// 4. CAPRAZ REVIEW: SABIT surumler salt-okur; cikti = olcut puani (rubric kriter
//    basina) + gerekce + kanit referansi + kritik itiraz + kapatma deneyi +
//    belirsizlik — ALTI alanin HEPSI zorunlu. Review hedefi KENDI DEGIL (capraz);
//    review ancak o turun TUM cevaplari kesildikten sonra acilir.
// 5. REVIZYON: her ajan YALNIZ KENDI yeni surumunu uretir (baskasinin surumune
//    revizyon RED); revizyon capraz review'lar ACILDIKTAN sonra dogar.
// 6. YENIDEN DEGERLENDIRME: ayni rubric surumuyle; rubric surumu DEGISIRSE yeni
//    degerlendirme kayitlari zorunlu (K12-02 — eski rubricli kayit basariya
//    SINAMAZ; kayitlar append-only, guncel rubric surumuyle yenisi yazilir).
// 7. SENTEZ + BAGIMSIZ SON INCELEME: bagimsiz degerlendirme (katilimci OLMAYAN
//    degerlendiren) PASS olmadan BASARI ILAN EDILEMEZ. Ajan uzlasmasi dogruluk
//    kaniti DEGILDIR; kor review uygulanabilirligi ayrica degerlendirilir, mutlak
//    tarafsizlik garantisi IDDIA EDILMEZ (§21).
import {
  existsSync, mkdirSync, readFileSync,
  openSync, writeSync, fsyncSync, ftruncateSync, closeSync,
} from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

export type KayitTip = 'cevap' | 'revizyon' | 'sentez';
export type BayrakKodu = 'eksik-alan' | 'uydurma-kaynak' | 'kanitsiz-iddia';

export interface TurnuvaKriter { id: string; ad: string }
export interface TurnuvaRubric { surum: string; kriterler: TurnuvaKriter[] }
export interface TurnuvaKatilimci {
  provider: string;
  model: string;
  nodeId?: string;    // kimlik zinciri (opsiyonel bag)
  attemptId?: string;
}

export interface TurnuvaBaslangic {
  turnuvaId: string;
  runId?: string;      // kimlik zinciri: run baglantisi (opsiyonel)
  taskId?: string;
  rubric: TurnuvaRubric;
  katilimcilar: TurnuvaKatilimci[];
  kaynakEvreni?: string[]; // on-kontrolun "uydurma kaynak" kiyas evreni (yoksa kontrol atlanir)
}

export interface SurumKaydi {
  tip: 'surum'; turnuvaId: string; roundId: string; round: number;
  katilimci: string; surumNo: number; kayitTip: KayitTip; oncekiSurumNo?: number;
  icerikHash: string; icerik: string; brief: string; kaynaklar: string[];
  runtime?: string;    // surumlu kayit: model/runtime (§21 adim 2)
  createdAt: string;
}

export interface ReviewKaydi {
  tip: 'review'; turnuvaId: string; round: number;
  reviewer: string; hedefKatilimci: string; hedefSurumNo: number;
  olcutPuanlari: Record<string, number>; // kriterId -> 1..5
  gerekce: string; kanitRef: string; kritikItiraz: string;
  kapatmaDeneyi: string; belirsizlik: string;
  rubricSurum: string; createdAt: string;
}

export interface Bayrak { kod: BayrakKodu; detay: string }
export interface OnKontrolKaydi {
  tip: 'onkontrol'; turnuvaId: string; katilimci: string; surumNo: number;
  bayraklar: Bayrak[]; at: string;
}

export interface DegerlendirmeKaydi {
  tip: 'degerlendirme'; turnuvaId: string;
  degerlendiren: string; verdict: 'PASS' | 'FAIL';
  gerekce: string; rubricSurum: string; createdAt: string;
}

export interface RubricKaydi { tip: 'rubric'; turnuvaId: string; rubric: TurnuvaRubric; at: string }
export interface TurnuvaKaydi {
  tip: 'turnuva'; turnuvaId: string; baslangic: TurnuvaBaslangic; katilimciKimlikler: string[]; at: string;
}
export interface SentezKaydi {
  tip: 'sentez'; turnuvaId: string; icerikHash: string; icerik: string;
  isaretliKatilimcilar: string[]; createdAt: string;
}

export type TurnuvaOlay =
  | TurnuvaKaydi | SurumKaydi | ReviewKaydi | OnKontrolKaydi
  | DegerlendirmeKaydi | RubricKaydi | SentezKaydi;

export class TurnuvaError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'TurnuvaError';
    this.code = code;
  }
}

const red = (code: string, msg: string): never => { throw new TurnuvaError(code, msg); };
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const kimlikOf = (k: TurnuvaKatilimci) => k.provider + '/' + k.model;
const dolu = (s: string | undefined) => typeof s === 'string' && s.trim() !== '';

// Yukleme: append-only jsonl replay — bozuk SON satir budanir (tail-repair), orta
// satir bozuksa fail-closed RED (notify.ts deseni birebir).
function yukleVeOnar(path: string): TurnuvaOlay[] {
  if (!existsSync(path)) return [];
  const buf = readFileSync(path);
  const satirlar: { start: number; text: string }[] = [];
  let start = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0a) {
      satirlar.push({ start, text: buf.subarray(start, i).toString('utf8') });
      start = i + 1;
    }
  }
  if (start < buf.length) satirlar.push({ start, text: buf.subarray(start).toString('utf8') });
  const out: TurnuvaOlay[] = [];
  for (let i = 0; i < satirlar.length; i++) {
    const s = satirlar[i];
    if (s.text.trim() === '') continue;
    try {
      out.push(JSON.parse(s.text) as TurnuvaOlay);
    } catch {
      if (i === satirlar.length - 1) {
        const fd = openSync(path, 'r+');
        try { ftruncateSync(fd, s.start); fsyncSync(fd); } finally { closeSync(fd); }
      } else {
        red('bozuk-kayit', 'turnuva.jsonl ortasinda bozuk satir (' + (i + 1) + '); yalniz son satir onarilabilir');
      }
    }
  }
  return out;
}

export interface TurnuvaDurum {
  baslangic: TurnuvaBaslangic;
  rubric: TurnuvaRubric;                       // SON rubric kaydi (K12-02)
  surumler: SurumKaydi[];                      // tum surumler kayitli (K12-01)
  reviews: ReviewKaydi[];                      // tum reviewlar kayitli (K12-01)
  sonReviewlar: ReviewKaydi[];                 // (reviewer,hedef,surum) basina SON kayit
  onKontroller: OnKontrolKaydi[];
  sonOnKontroller: OnKontrolKaydi[];           // (katilimci,surumNo) basina SON
  sentez: SentezKaydi | null;
  degerlendirmeler: DegerlendirmeKaydi[];
  sonDegerlendirme: DegerlendirmeKaydi | null;
}

export interface Turnuva {
  path: string;
  turnuvaId: string;
  durumu(): TurnuvaDurum;
  surumKaydet(o: {
    round: 1 | 2; katilimci: string; kayitTip: 'cevap' | 'revizyon';
    icerik: string; brief: string; kaynaklar: string[]; runtime?: string;
  }): SurumKaydi;
  reviewKaydet(o: {
    round: 1 | 2; reviewer: string; hedefKatilimci: string; hedefSurumNo: number;
    olcutPuanlari: Record<string, number>; gerekce: string; kanitRef: string;
    kritikItiraz: string; kapatmaDeneyi: string; belirsizlik: string;
  }): ReviewKaydi;
  onKontrol(o: { katilimci: string; surumNo: number }): Bayrak[];
  rubricGuncelle(rubric: TurnuvaRubric): RubricKaydi;
  sentezKaydet(o: { icerik: string }): SentezKaydi;
  bagimsizDegerlendirme(o: { degerlendiren: string; verdict: 'PASS' | 'FAIL'; gerekce: string }): DegerlendirmeKaydi;
  basari(): { basari: boolean; engeller: string[] };
}

const MIN_KATILIMCI = 2;
const MIN_PUAN = 1, MAX_PUAN = 5;

// Adim 3 — ON KONTROL: eksik alan / uydurma kaynak / kanitsiz iddia ISARETI.
// Iddia satiri "I:" ile, kanit satiri "K:" ile baslar (protokol sozlesmesi);
// iddia sayisi kanit sayisini asarsa "kanitsiz iddia" bayragi dogar.
function bayraklariHesapla(
  s: SurumKaydi, kaynakEvreni: string[] | undefined,
): Bayrak[] {
  // brief kayit kapisinda zaten ZORUNLU (surumKaydet RED) — on-kontrolun eksik-alan
  // bayragi kayitta SERBEST birakilan kaynaklar listesini ve icerik yapisini saysin.
  const bayraklar: Bayrak[] = [];
  if (!Array.isArray(s.kaynaklar) || s.kaynaklar.length === 0)
    bayraklar.push({ kod: 'eksik-alan', detay: 'kaynaklar listesi bos' });
  if (kaynakEvreni && s.kaynaklar.some((k) => !kaynakEvreni.includes(k)))
    bayraklar.push({ kod: 'uydurma-kaynak', detay: 'kaynak evreninde olmayan kaynak' });
  const iddialar = s.icerik.split('\n').filter((l) => l.trim().startsWith('I:')).length;
  const kanitlar = s.icerik.split('\n').filter((l) => l.trim().startsWith('K:')).length;
  if (iddialar > kanitlar)
    bayraklar.push({ kod: 'kanitsiz-iddia', detay: iddialar + ' iddiaya karsi ' + kanitlar + ' kanit satiri' });
  return bayraklar;
}

export function openTurnuva(path: string, b: TurnuvaBaslangic, o: { now?: () => Date } = {}): Turnuva {
  const now = o.now ?? (() => new Date());
  if (!dolu(b.turnuvaId)) red('eksik-alan', 'turnuvaId zorunlu');
  if (!b.rubric || !dolu(b.rubric.surum) || !Array.isArray(b.rubric.kriterler) || b.rubric.kriterler.length === 0)
    red('rubric-gecersiz', 'rubric.surum ve en az bir kriter zorunlu');
  const kriterIdler = b.rubric.kriterler.map((k) => k.id);
  if (new Set(kriterIdler).size !== kriterIdler.length) red('rubric-gecersiz', 'kriter idleri tekil olmali');
  if (!Array.isArray(b.katilimcilar) || b.katilimcilar.length < MIN_KATILIMCI)
    red('katilimci-eksik', 'en az ' + MIN_KATILIMCI + ' katilimci zorunlu');
  for (const k of b.katilimcilar) {
    if (!dolu(k.provider) || !dolu(k.model)) red('katilimci-gecersiz', 'her katilimcinin provider ve model alanlari zorunlu');
  }
  const kimlikler = b.katilimcilar.map(kimlikOf);
  if (new Set(kimlikler).size !== kimlikler.length)
    red('katilimci-gecersiz', 'katilimci (provider/model) kimlikleri TEKIL olmali — ayni model iki kez turnuvada olmaz');

  mkdirSync(dirname(path), { recursive: true });
  const mevcut = yukleVeOnar(path);
  if (mevcut.some((e) => e.tip === 'turnuva' && e.baslangic.turnuvaId === b.turnuvaId))
    red('cakisma', 'turnuvaId zaten kayitli: ' + b.turnuvaId);

  function yaz(olay: TurnuvaOlay): void {
    const fd = openSync(path, 'a');
    try {
      writeSync(fd, JSON.stringify(olay) + '\n');
      fsyncSync(fd); // kalicilik: kayit diske inmeden donme
    } finally { closeSync(fd); }
  }

  const acilis: TurnuvaKaydi = { tip: 'turnuva', turnuvaId: b.turnuvaId, baslangic: b, katilimciKimlikler: kimlikler, at: now().toISOString() };
  yaz(acilis);

  function durumuOku(): TurnuvaDurum {
    const tum = yukleVeOnar(path);
    const benim = tum.filter((e) => 'turnuvaId' in e && (e as any).turnuvaId === b.turnuvaId);
    const acilisKaydi = benim.find((e) => e.tip === 'turnuva') as TurnuvaKaydi;
    const rubricler = benim.filter((e): e is RubricKaydi => e.tip === 'rubric');
    const surumler = benim.filter((e): e is SurumKaydi => e.tip === 'surum');
    const reviews = benim.filter((e): e is ReviewKaydi => e.tip === 'review');
    const onKontroller = benim.filter((e): e is OnKontrolKaydi => e.tip === 'onkontrol');
    const degerlendirmeler = benim.filter((e): e is DegerlendirmeKaydi => e.tip === 'degerlendirme');
    const sentezler = benim.filter((e): e is SentezKaydi => e.tip === 'sentez');
    // append-only: ayni anahtarin SON kaydi gecerli (K12-02 yeniden degerlendirme)
    const sonReviewMap = new Map<string, ReviewKaydi>();
    for (const r of reviews) sonReviewMap.set(r.reviewer + '|' + r.hedefKatilimci + '|' + r.hedefSurumNo, r);
    const sonOkMap = new Map<string, OnKontrolKaydi>();
    for (const k of onKontroller) sonOkMap.set(k.katilimci + '|' + k.surumNo, k);
    return {
      baslangic: acilisKaydi.baslangic,
      rubric: rubricler.length ? rubricler[rubricler.length - 1].rubric : acilisKaydi.baslangic.rubric,
      surumler,
      reviews,
      sonReviewlar: [...sonReviewMap.values()],
      onKontroller,
      sonOnKontroller: [...sonOkMap.values()],
      sentez: sentezler.length ? sentezler[sentezler.length - 1] : null,
      degerlendirmeler,
      sonDegerlendirme: degerlendirmeler.length ? degerlendirmeler[degerlendirmeler.length - 1] : null,
    };
  }

  function katilimciMi(kimlik: string): boolean { return kimlikler.includes(kimlik); }

  // Tur tamligi: o turda her katilimcinin bir kaydi var mi (round 1 = cevap,
  // round 2 = revizyon — turun CEVAP EVRENI tamamlanmali, sabit surumler kesilmeli).
  function turTam(d: TurnuvaDurum, round: number): boolean {
    return kimlikler.every((k) => d.surumler.some((s) => s.katilimci === k && s.round === round));
  }

  function surumKaydet(x: {
    round: 1 | 2; katilimci: string; kayitTip: 'cevap' | 'revizyon';
    icerik: string; brief: string; kaynaklar: string[]; runtime?: string;
  }): SurumKaydi {
    const d = durumuOku();
    if (!katilimciMi(x.katilimci)) red('katilimci-disi', 'surum katilimci degil: ' + x.katilimci);
    if (x.kayitTip === 'cevap' && x.round !== 1) red('kayit-tip-gecersiz', 'cevap yalniz round 1de kaydedilir');
    if (x.kayitTip === 'revizyon' && x.round !== 2) red('kayit-tip-gecersiz', 'revizyon round 2de kaydedilir');
    if (!dolu(x.icerik)) red('eksik-alan', 'icerik zorunlu');
    if (!dolu(x.brief)) red('eksik-alan', 'brief zorunlu');
    if (!Array.isArray(x.kaynaklar)) red('eksik-alan', 'kaynaklar dizi olmali');
    const benimkiler = d.surumler.filter((s) => s.katilimci === x.katilimci);
    if (x.kayitTip === 'cevap') {
      // ADIM 1 — BAGIMSIZ URETIM: ilk cevaplar diger ajanlara KAPALI. Ilk review
      // acildiginda turnuva "cevap penceresi" KAPANIR — yeni ilk cevap RED.
      if (d.reviews.length > 0) red('bagimsizlik-kapandi', 'ilk review acildi — yeni ilk-cevap kaydi YOK (bagimsiz uretim penceresi kapali)');
      if (benimkiler.some((s) => s.kayitTip === 'cevap')) red('cakisma', 'katilimcinin ilk cevabi zaten kayitli');
    } else {
      // ADIM 5 — REVIZYON: yalniz KENDI yeni surumu; capraz review acildiktan sonra.
      const v1 = benimkiler.find((s) => s.kayitTip === 'cevap');
      if (!v1) red('revizyon-onsuz', 'katilimcinin ilk cevabi yok — revizyon kendi cevabindan dogar');
      if (benimkiler.some((s) => s.kayitTip === 'revizyon')) red('cakisma', 'katilimcinin revizyonu zaten kayitli');
      if (d.reviews.length === 0) red('revizyon-erken', 'capraz review acilmadan revizyon dogmaz (protokol adim sirasi 4 -> 5)');
      if (!turTam(d, 1)) red('revizyon-erken', 'round 1 cevaplari tamamlanmadi');
      if (benimkiler.length !== 1) red('cakisma', 'beklenmedik surum sayisi');
    }
    const surumNo = benimkiler.length + 1;
    const kayit: SurumKaydi = {
      tip: 'surum', turnuvaId: b.turnuvaId, roundId: b.turnuvaId + '|r' + x.round, round: x.round,
      katilimci: x.katilimci, surumNo, kayitTip: x.kayitTip,
      ...(x.kayitTip === 'revizyon' ? { oncekiSurumNo: surumNo - 1 } : {}),
      icerikHash: sha(x.icerik), icerik: x.icerik, brief: x.brief, kaynaklar: [...x.kaynaklar],
      ...(x.runtime !== undefined ? { runtime: x.runtime } : {}),
      createdAt: now().toISOString(),
    };
    yaz(kayit);
    return kayit;
  }

  function reviewKaydet(x: {
    round: 1 | 2; reviewer: string; hedefKatilimci: string; hedefSurumNo: number;
    olcutPuanlari: Record<string, number>; gerekce: string; kanitRef: string;
    kritikItiraz: string; kapatmaDeneyi: string; belirsizlik: string;
  }): ReviewKaydi {
    const d = durumuOku();
    if (!katilimciMi(x.reviewer)) red('katilimci-disi', 'reviewer katilimci degil: ' + x.reviewer);
    if (!katilimciMi(x.hedefKatilimci)) red('katilimci-disi', 'hedef katilimci degil: ' + x.hedefKatilimci);
    // ADIM 4 — CAPRAZ: reviewer kendi cevabini review ETMEZ.
    if (x.reviewer === x.hedefKatilimci) red('capraz-degil', 'reviewer kendi cevabini review edemez (capraz elestiri)');
    const hedef = d.surumler.find((s) => s.katilimci === x.hedefKatilimci && s.surumNo === x.hedefSurumNo);
    if (!hedef) red('hedef-surum-yok', 'hedef surum kayitli degil: ' + x.hedefKatilimci + ' v' + x.hedefSurumNo);
    if (hedef.round !== x.round) red('round-uyumsuz', 'hedef surum round ' + hedef.round + ' — review roundu uyusmadi');
    // ADIM 4 — SABIT SURUMLER: review ancak o turun TUM cevaplari kesildikten sonra.
    if (!turTam(d, x.round)) red('cevaplar-tam-degil', 'round ' + x.round + ' cevaplari tamamlanmadi — sabit surumler kesilmedi');
    // ADIM 4 — alti alanin HEPSI zorunlu (olcut puani + gerekce + kanit ref +
    // kritik itiraz + kapatma deneyi + belirsizlik).
    for (const [alan, deger] of Object.entries({ gerekce: x.gerekce, kanitRef: x.kanitRef, kritikItiraz: x.kritikItiraz, kapatmaDeneyi: x.kapatmaDeneyi, belirsizlik: x.belirsizlik })) {
      if (!dolu(deger)) red('eksik-alan', 'review alani zorunlu: ' + alan);
    }
    if (!x.olcutPuanlari || typeof x.olcutPuanlari !== 'object') red('eksik-alan', 'olcutPuanlari zorunlu');
    const gecerliKriterler = new Set(d.rubric.kriterler.map((k) => k.id));
    for (const [kriter, puan] of Object.entries(x.olcutPuanlari)) {
      if (!gecerliKriterler.has(kriter)) red('kriter-disi', 'rubricte olmayan kriter: ' + kriter);
      if (!Number.isInteger(puan) || puan < MIN_PUAN || puan > MAX_PUAN)
        red('puan-gecersiz', 'olcut puani ' + MIN_PUAN + '-' + MAX_PUAN + ' arasi tam sayi olmali: ' + kriter + '=' + String(puan));
    }
    for (const k of d.rubric.kriterler) {
      if (x.olcutPuanlari[k.id] === undefined) red('eksik-alan', 'her rubric kriteri puanlanmali: ' + k.id);
    }
    // Ayni (reviewer, hedef, surum) + AYNI rubric surumu → cakisma; FARKLI rubric
    // surumu → K12-02 yeniden degerlendirme kaydi (append-only, son kayit gecerli).
    const eski = d.reviews.find((r) => r.reviewer === x.reviewer && r.hedefKatilimci === x.hedefKatilimci && r.hedefSurumNo === x.hedefSurumNo);
    if (eski && eski.rubricSurum === d.rubric.surum)
      red('cakisma', 'ayni rubric surumuyle review zaten kayitli (yeniden degerlendirme yalniz rubric degisince)');
    const kayit: ReviewKaydi = {
      tip: 'review', turnuvaId: b.turnuvaId, round: x.round,
      reviewer: x.reviewer, hedefKatilimci: x.hedefKatilimci, hedefSurumNo: x.hedefSurumNo,
      olcutPuanlari: { ...x.olcutPuanlari },
      gerekce: x.gerekce, kanitRef: x.kanitRef, kritikItiraz: x.kritikItiraz,
      kapatmaDeneyi: x.kapatmaDeneyi, belirsizlik: x.belirsizlik,
      rubricSurum: d.rubric.surum, createdAt: now().toISOString(),
    };
    yaz(kayit);
    return kayit;
  }

  function onKontrol(x: { katilimci: string; surumNo: number }): Bayrak[] {
    const d = durumuOku();
    if (!katilimciMi(x.katilimci)) red('katilimci-disi', 'on-kontrol katilimci degil: ' + x.katilimci);
    const s = d.surumler.find((k) => k.katilimci === x.katilimci && k.surumNo === x.surumNo);
    if (!s) red('hedef-surum-yok', 'on-kontrol hedefi kayitli degil: ' + x.katilimci + ' v' + x.surumNo);
    const bayraklar = bayraklariHesapla(s, d.baslangic.kaynakEvreni);
    const kayit: OnKontrolKaydi = {
      tip: 'onkontrol', turnuvaId: b.turnuvaId, katilimci: x.katilimci, surumNo: x.surumNo,
      bayraklar, at: now().toISOString(),
    };
    yaz(kayit);
    return bayraklar;
  }

  function rubricGuncelle(rubric: TurnuvaRubric): RubricKaydi {
    const d = durumuOku();
    if (!dolu(rubric.surum) || !Array.isArray(rubric.kriterler) || rubric.kriterler.length === 0)
      red('rubric-gecersiz', 'rubric.surum ve en az bir kriter zorunlu');
    const idler = rubric.kriterler.map((k) => k.id);
    if (new Set(idler).size !== idler.length) red('rubric-gecersiz', 'kriter idleri tekil olmali');
    // K12-02: rubric degisikligi sentezden SONRA da dogabilir — bar her defasinda
    // guncel rubric surumuyle degerlendirme ister (append-only, son kayit gecerli).
    if (rubric.surum === d.rubric.surum) red('rubric-gecersiz', 'yeni rubric surumu FARKLI olmali: ' + rubric.surum);
    const kayit: RubricKaydi = { tip: 'rubric', turnuvaId: b.turnuvaId, rubric, at: now().toISOString() };
    yaz(kayit);
    return kayit;
  }

  function sentezKaydet(x: { icerik: string }): SentezKaydi {
    const d = durumuOku();
    if (!dolu(x.icerik)) red('eksik-alan', 'sentez icerigi zorunlu');
    if (d.sentez) red('cakisma', 'sentez zaten kayitli (tek sentez — protokol kapanis)');
    // ADIM 5 tamamlanmali: her katilimcinin revizyonu (round 2) kesilmis olmali.
    const sonSurumler = new Map<string, SurumKaydi>();
    for (const k of kimlikler) {
      const benim = d.surumler.filter((s) => s.katilimci === k);
      if (benim.length === 0) red('sentez-erken', 'katilimcinin surumu yok: ' + k);
      if (benim.length === 1) red('sentez-erken', 'katilimcinin revizyonu (round 2) yok: ' + k);
      sonSurumler.set(k, benim[benim.length - 1]);
    }
    // ADIM 3 sonucu: eksik-alan / uydurma-kaynak bayragi tasiyan son surum senteze
    // GIREMEZ; kanitsiz-iddia ISARETLE tasınır (sentez kaydında görünür).
    const engelli: string[] = [];
    const isaretli: string[] = [];
    for (const [k, s] of sonSurumler) {
      const ok = d.sonOnKontroller.find((y) => y.katilimci === k && y.surumNo === s.surumNo);
      if (!ok) red('onkontrol-yok', 'son surum on-kontrolden gecmedi: ' + k + ' v' + s.surumNo);
      if (ok.bayraklar.some((bf) => bf.kod === 'eksik-alan' || bf.kod === 'uydurma-kaynak')) engelli.push(k);
      if (ok.bayraklar.some((bf) => bf.kod === 'kanitsiz-iddia')) isaretli.push(k);
    }
    if (engelli.length) red('onkontrol-engelli', 'on-kontrol bayragi tasiyan son surumler senteze GIREMEZ: ' + engelli.join(', '));
    // ADIM 4 kapsam: her katilimci EN AZ BIR capraz review almis olmali.
    const reviewsuz = kimlikler.filter((k) => !d.sonReviewlar.some((r) => r.hedefKatilimci === k));
    if (reviewsuz.length) red('review-yok', 'capraz review almayan katilimci: ' + reviewsuz.join(', '));
    const kayit: SentezKaydi = {
      tip: 'sentez', turnuvaId: b.turnuvaId, icerikHash: sha(x.icerik), icerik: x.icerik,
      isaretliKatilimcilar: isaretli, createdAt: now().toISOString(),
    };
    yaz(kayit);
    return kayit;
  }

  function bagimsizDegerlendirme(x: { degerlendiren: string; verdict: 'PASS' | 'FAIL'; gerekce: string }): DegerlendirmeKaydi {
    const d = durumuOku();
    // ADIM 7 — BAGIMSIZ SON INCELEME: degerlendiren KATILIMCI OLAMAZ.
    if (!dolu(x.degerlendiren)) red('eksik-alan', 'degerlendiren zorunlu');
    if (katilimciMi(x.degerlendiren)) red('bagimsiz-degil', 'degerlendiren katilimci — bagimsiz son inceleme DISARIDAN gelir');
    if (x.verdict !== 'PASS' && x.verdict !== 'FAIL') red('verdict-gecersiz', "verdict 'PASS'|'FAIL' olmali");
    if (!dolu(x.gerekce)) red('eksik-alan', 'gerekce zorunlu');
    if (!d.sentez) red('sentez-yok', 'degerlendirme sentezden once dogmaz (protokol adim sirasi 7)');
    const eski = d.degerlendirmeler.find((y) => y.degerlendiren === x.degerlendiren);
    if (eski && eski.rubricSurum === d.rubric.surum)
      red('cakisma', 'ayni rubric surumuyle degerlendirme zaten kayitli');
    const kayit: DegerlendirmeKaydi = {
      tip: 'degerlendirme', turnuvaId: b.turnuvaId, degerlendiren: x.degerlendiren,
      verdict: x.verdict, gerekce: x.gerekce, rubricSurum: d.rubric.surum,
      createdAt: now().toISOString(),
    };
    yaz(kayit);
    return kayit;
  }

  // ADIM 7 — BASARI ILANI: bagimsiz PASS olmadan ilan EDILEMEZ; K12-02: guncel
  // rubric surumuyle YENIDEN degerlendirme zorunlu (rubric degistiyse eski kayit
  // sinamaz). Ajan uzlasmasi dogruluk kaniti DEGILDIR (§21).
  function basari(): { basari: boolean; engeller: string[] } {
    const d = durumuOku();
    const engeller: string[] = [];
    if (!d.sentez) engeller.push('sentez kayitli degil');
    if (d.sentez && d.sentez.isaretliKatilimcilar.length > 0)
      engeller.push('kanitsiz-iddia isareti tasiyan katilimcilar: ' + d.sentez.isaretliKatilimcilar.join(', '));
    const son = d.sonDegerlendirme;
    if (!son) engeller.push('bagimsiz son inceleme yok');
    else {
      if (son.rubricSurum !== d.rubric.surum)
        engeller.push('rubric surumu degisti (' + son.rubricSurum + ' -> ' + d.rubric.surum + ') — K12-02: yeniden degerlendirme gerekli');
      if (son.verdict !== 'PASS') engeller.push('bagimsiz inceleme PASS degil: ' + son.verdict);
    }
    // K12-02: SON TURUN reviewlari guncel rubric surumuyle yapilmis olmali (round 1
    // kayitlari tarihtir — append-only korunur, son tur degere girer).
    const sonTur = d.surumler.reduce((m, s) => Math.max(m, s.round), 0);
    const bayatik = d.sonReviewlar.filter((r) => r.round === sonTur && r.rubricSurum !== d.rubric.surum);
    if (bayatik.length > 0)
      engeller.push('rubric degisikligi sonrasi guncellenmeyen reviewlar var (' + bayatik.length + ') — yeniden degerlendirme gerekli');
    return { basari: engeller.length === 0, engeller };
  }

  return {
    path, turnuvaId: b.turnuvaId,
    durumu: durumuOku, surumKaydet, reviewKaydet, onKontrol,
    rubricGuncelle, sentezKaydet, bagimsizDegerlendirme, basari,
  };
}
