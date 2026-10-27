// A3 (graf v8 kritik yol ucu; OTONOMİ MERDİVENİ): DENEYİM→KURAL DERLEYİCİSİ.
// (1) DERSLER.md deterministik ayrıştırma → madde/ALT-DERS adayları (Kural: cümlesi
//     değil — 177 maddenin yalnız ~%26'sı işaretli; "ders birden: (1)(2)(3)" bölünür,
//     işaretsiz (N) tuzak-numaralandırması BÖLMEZ).
// (2) sha256 dedup: anahtar = normalize HAM metin (NFC + kanıt-parantezleri soyulmuş +
//     Türkçe katlanmış) — sentez çıktısı DEĞİL (LLM her tur farklı üretir, hash
//     idempotansı öldürür). Mevcut kural birebir eşleşirse aday DÜŞER; yumuşak
//     benzerlik ≥0.6 Jaccard çakışan TAHMİNİ taşır (düşmez — [insan] karar verir).
// (3) kuralSayaci = saglik.ps1 §5b TS İKİZİ (aynı desen ^\s*(-|\d+\.)\s, aynı Find-First
//     dosya havuzu; eşik hedefler.json'dan — K-0040 tek-eşik-kaynağı, kod TAŞIMAZ).
//     Dürüst güçlendirme: sayılan dosya tüm alternatifleriyle eksikse RED (saglik
//     fail-safe düşer, ikiz drift-alarmı atar).
// (4) Tavan kilidi (REHBER §2 stacking-collapse): TAZE sayaç + aday satırı > kuralKirmiziEsik
//     → derleyici DURUR, hedef dosyaya 0 bayt (disk mutasyonundan ÖNCE kontrol).
// (5) [insan] TOPLU kapısı: KURALLARI ONAYLIYORUM + aktör 'insan:cli' (EK-2: ajan/proxy
//     RED). K-0051 kararları: hedef AGENTS.md; ilk toplu onay ≤5 (kademeli); aday metni
//     sentez ajan turunda (ajan:llm kaydı — onay DEĞİL) sıkılaştırılır, onaysa sentez
//     yoksa ham metin ADIYLA düşer.
// R6: yeni tablo/event yok. Kalıcılık: kural.jsonl append-only (defter.ts yardımcıları).
// lessons.ts çalışma-zamanı ders döngüsü (F6-A/B) DOKUNULMAZ — ayrı havuz.
import {
  existsSync, readFileSync, mkdirSync,
  openSync, writeSync, fsyncSync, closeSync, renameSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { jsonlYukle, jsonlEkle, type Red } from './defter.ts';

export const KURAL_ONAY_METNI = 'KURALLARI ONAYLIYORUM'; // insan sürtünmesi (B01 deseni)
export const KURAL_PARTI_UST = 5; // K-0051 karar 2: ilk toplu onay ≤5 (kademeli güven)
export const KURAL_HEDEF_DOSYA = 'AGENTS.md'; // K-0051 karar 1: onaylı kural L0 hedefi (sayaç zaten sayar — drift yok)

// sayılan dosya havuzu — saglik.ps1:75 Find-First sıralı alternatiflerinin birebir ikizi
// (REHBER 5 alternatif: sozlesme/ + kök + arastirma/ — denetçi B3 düzeltmesi)
export const KURAL_SAYAC_DOSYALARI: readonly string[][] = [
  ['ANAYASA.md'],
  ['AGENTS.md', 'CLAUDE.md'],
  ['sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md', 'PASEO-VERIMLILIK-REHBERI-v2.0.md', 'PASEO-VERIMLILIK-REHBERI-v1.4.md', 'arastirma/PASEO-VERIMLILIK-REHBERI-v2.0.md', 'arastirma/PASEO-VERIMLILIK-REHBERI-v1.4.md'],
];

export const KURAL_SATIR_DESENI = /^\s*(-|\d+\.)\s/; // saglik §5b birebir (girinti dahil; '-x'/'---' sayılmaz)

// DERSLER madde öncüsü: (tarihsiz)|tarih [+ (kanıt parantezi)] [+ hibrit gövde-tarihi] + ayraç.
// Anahtar (B4) VE inen kural satırı AYNI deseni soyar — hibrit '(tarihsiz) 2026-10-14: X'
// sınıfı anahtar uzayında tarihsiz 'X' ile eşlenir, inen satırdan tarih sızmaz.
const MADDE_ONEKI = /^\s*(?:\(tarihsiz\)|\d{4}-\d{2}-\d{2})\s*(?:\([^)]*\))?\s*(?:\d{4}-\d{2}-\d{2}\s*)?[·:-]\s*/i;

export class KuralError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(message); this.name = 'KuralError'; this.code = code; }
}
const red: Red = (code, msg): never => { throw new KuralError(code, msg); };

// ---- DERSLER.md okuma (tuzaklar: satır 62 tire-siz anomali; hibrit önekler; HTML yorumu) ----
export interface AltDers { satirNo: number; altDersIndex: number; hamMetin: string }
export interface DerslerTarama {
  maddeler: { satirNo: number; tarihli: boolean; hamMetin: string }[];
  altDersler: AltDers[];
  anomaliler: { satirNo: number; hamMetin: string }[];
  ev: string;
}

const MADDE_DESENI = /^\s*(?:- )?(?:\(tarihsiz\)|\d{4}-\d{2}-\d{2})/;

// bölme YALNIZ "ders birden" işaretli maddede; işaretsiz (1)(2) tuzak-numaralandırmadır (DERSLER 96/107/108 sınıfı)
function altDerslerBol(hamMetin: string): string[] {
  if (!/\bders birden\b/i.test(hamMetin)) return [hamMetin];
  const isaret = [...hamMetin.matchAll(/\(\d\)\s*/g)];
  if (isaret.length < 2) return [hamMetin];
  const parcalar: string[] = [];
  for (let i = 0; i < isaret.length; i++) {
    const bas = isaret[i].index! + isaret[i][0].length;
    const son = i + 1 < isaret.length ? isaret[i + 1].index! : hamMetin.length;
    const parca = hamMetin.slice(bas, son).replace(/[\s;]+$/, '').trim();
    if (parca) parcalar.push(parca);
  }
  return parcalar.length ? parcalar : [hamMetin];
}

export function derslerOku(ev: string): DerslerTarama {
  if (!existsSync(ev)) red('dersler-yok', `DERSLER yok: ${ev} (aday üretimi koşmaz — sessiz 0 YOK)`);
  const ham = readFileSync(ev, 'utf8');
  const satirlar = ham.split(/\r?\n/);
  const maddeler: DerslerTarama['maddeler'] = [];
  const anomaliler: DerslerTarama['anomaliler'] = [];
  const altDersler: AltDers[] = [];
  for (let i = 0; i < satirlar.length; i++) {
    const satir = satirlar[i];
    if (satir.trim() === '' || /^\s*#\s/.test(satir) || /^\s*<!--/.test(satir)) continue;
    if (!MADDE_DESENI.test(satir)) continue; // paragraf/tablo — madde değil (sessiz değil: ölçüm dışı)
    const tireli = /^\s*- /.test(satir);
    const tarihli = !/^\s*(?:- )?\(tarihsiz\)/.test(satir); // sınıflandırma ÖNEKLE (hibrit gövde-tarihi sınıfı bozmaz)
    maddeler.push({ satirNo: i + 1, tarihli, hamMetin: satir });
    if (!tireli) anomaliler.push({ satirNo: i + 1, hamMetin: satir }); // satır-62 sınıfı: ADIYLA listelenir, sessiz düşmez
    altDerslerBol(satir).forEach((m, idx) => altDersler.push({ satirNo: i + 1, altDersIndex: idx, hamMetin: m }));
  }
  if (maddeler.length === 0) red('dersler-bos', `DERSLER geçerli madde taşımıyor: ${ev} (yalnız başlık/başlıksız dosya kabul değil)`);
  return { maddeler, altDersler, anomaliler, ev };
}

// ---- kural-proxy sayacı (saglik §5b ikizi) ----
export interface SayacDosyasi { yol: string; sayi: number; satirlar: string[] }
export interface SayacOlcumu { toplam: number; dosyaBasi: SayacDosyasi[] }

export function kuralSayaci(kok: string): SayacOlcumu {
  const dosyaBasi: SayacDosyasi[] = [];
  for (const alternatifler of KURAL_SAYAC_DOSYALARI) {
    const yol = alternatifler.map((a) => join(kok, a)).find((p) => existsSync(p));
    if (!yol)
      red('sayac-dosya-yok', `sayılan dosya havuzu eksik: ${alternatifler.join(' | ')} (kuralSayaci=drift alarmı — RED; saglik fail-safe düşer, ikiz düşMEZ)`);
    let icerik = readFileSync(yol, 'utf8');
    if (icerik.charCodeAt(0) === 0xfeff) icerik = icerik.slice(1); // BOM soy (PS ilk satırda soyar)
    const satirlar = icerik.split(/\r?\n/).filter((l) => KURAL_SATIR_DESENI.test(l));
    dosyaBasi.push({ yol, sayi: satirlar.length, satirlar });
  }
  return { toplam: dosyaBasi.reduce((a, d) => a + d.sayi, 0), dosyaBasi };
}

// ---- eşik kaynağı: hedefler.json (K-0040 tek-eşik-kaynağı; kod TAŞIMAZ, fallback ADIYLA) ----
export interface KuralEsigi { sari: number; kirmizi: number; kaynak: 'hedefler.json' | 'varsayilan' }
export function esikOku(hedeflerYolu: string): KuralEsigi {
  if (existsSync(hedeflerYolu)) {
    try {
      const a = (JSON.parse(readFileSync(hedeflerYolu, 'utf8')) as any)?.aktifHedefler ?? {};
      return { sari: Number(a.kuralSariEsik ?? 40), kirmizi: Number(a.kuralKirmiziEsik ?? 80), kaynak: 'hedefler.json' };
    } catch { /* bozuk JSON: saglik fail-safe deseni — varsayılanla devam, kaynak alanı ADIYLA */ }
  }
  return { sari: 40, kirmizi: 80, kaynak: 'varsayilan' };
}

// ---- aday anahtarı: normalize HAM metin (sentez değil; havuz-agnostik — DERSLER
// madde öncüleri VE mevcut kural liste-satırları aynı anahtar uzayına iner) ----
function anahtarMetni(metin: string): string {
  let m = metin.normalize('NFC').trim().replace(/\s+/g, ' ');
  m = m.replace(/^\s*(?:\d+\.\s*)?-\s*/, ''); // liste işareti (mevcut kural satırları)
  m = m.replace(MADDE_ONEKI, ''); // DERSLER madde öncüleri (hibrit gövde-tarihi DAHİL — B4)
  m = m.replace(/\((?:R|T|kalite|A3 K-\d{4}|2026-\d{2}-\d{2})[^)]*\)/gi, ' '); // kanıt + A3-kaynak provenans parantezleri soyulur (ANAHTAR için; saklanan metin orijinal — inmiş kural satırı ölçümde 'cakisan' olarak eşlenir)
  m = m.replace(/\s+/g, ' ').trim().replace(/[.!?;:]+$/, '');
  return m.replace(/[İIı]/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
export function adayAnahtari(metin: string): string {
  return createHash('sha256').update(anahtarMetni(metin)).digest('hex');
}
function benzerlik(a: string, b: string): number {
  const kume = (m: string) => new Set(anahtarMetni(m).split(' ').filter((w) => w.length > 2));
  const ta = kume(a), tb = kume(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let kesisim = 0;
  for (const w of ta) if (tb.has(w)) kesisim++;
  return kesisim / (ta.size + tb.size - kesisim);
}
const kisalt = (s: string) => (s.length > 90 ? s.slice(0, 87) + '...' : s);

// ---- aday üretimi (≤limit/tur; tekrar + birebir-çakışan DÜŞER; yumuşak çakışan TAŞINIR) ----
export interface KuralAdayi { anahtar: string; kaynakSatir: number; altDersIndex: number; hamMetin: string; sentezMetin?: string; cakisanTahmin?: string }
export interface Dusen { kaynakSatir: number; sebep: 'tekrar' | 'cakisan'; metin: string }
export interface AdaySonucu { adaylar: KuralAdayi[]; dusenler: Dusen[]; kalan: number }

// B6 (üretim bulgusu, (R) onay-sonrası ölçüm): anahtar-hash HAM metinden hesaplanır ama
// inen satır SENTEZ metnidir (sentez farklı yazılır) → hash eşleşmesi KURULAMAZ; inmiş
// kural yeniden ölçümde aday olarak DÖNÜYORDU (üretimde gözlemlendi: onay sonrası aday 3,
// düşen 0 → çift iniş + tavan delinmesi mümkün). ÇAPA: inen satırın provenans eki
// '(A3 K-XXXX; kaynak DERSLER satır N; ham <16hex>)' — ham anahtar HAM metinden türediği
// için sentezden bağımsız; DERSLER yeniden düzenlense bile yeni dersin anahtarı farklıdır
// (satır-sürüklenmesine bağışık). İlk 3 üretim satırı ham taşımaz (eski biçim): satır-only
// eşleşme — DERSLER append-only olduğundan üretimde güvenli, dürüst sınır yorumda.
const PROVENANS_DESENI = /kaynak DERSLER satır (\d+)(?:; ham ([0-9a-f]{12,64}))?\)/g;
export interface ProvenansKaydi { satir: number; ham?: string }
export function provenansKayitlari(satirlar: string[]): ProvenansKaydi[] {
  const kayitlar: ProvenansKaydi[] = [];
  for (const satir of satirlar) {
    for (const m of satir.matchAll(PROVENANS_DESENI)) kayitlar.push({ satir: Number(m[1]), ...(m[2] ? { ham: m[2] } : {}) });
  }
  return kayitlar;
}
function provenansCakisir(anahtar: string, kaynakSatir: number, kayitlar: ProvenansKaydi[]): boolean {
  return kayitlar.some((k) => (k.ham !== undefined ? anahtar.startsWith(k.ham) : k.satir === kaynakSatir));
}

export function adayUret(tarama: DerslerTarama, mevcutSatirlar: string[], limit = 3): AdaySonucu {
  const mevcutAnahtarlar = new Set(mevcutSatirlar.map(adayAnahtari));
  const inmisProvenans = provenansKayitlari(mevcutSatirlar); // B6: sentezli iniş provenans çapası
  const gorulen = new Set<string>();
  const adaylar: KuralAdayi[] = [];
  const dusenler: Dusen[] = [];
  let kalan = 0;
  for (const alt of tarama.altDersler) {
    const anahtar = adayAnahtari(alt.hamMetin);
    if (gorulen.has(anahtar)) { dusenler.push({ kaynakSatir: alt.satirNo, sebep: 'tekrar', metin: kisalt(alt.hamMetin) }); continue; }
    gorulen.add(anahtar);
    if (mevcutAnahtarlar.has(anahtar) || provenansCakisir(anahtar, alt.satirNo, inmisProvenans)) { dusenler.push({ kaynakSatir: alt.satirNo, sebep: 'cakisan', metin: kisalt(alt.hamMetin) }); continue; }
    if (adaylar.length < limit) {
      const yumusak = mevcutSatirlar.find((m) => benzerlik(alt.hamMetin, m) >= 0.6);
      adaylar.push({ anahtar, kaynakSatir: alt.satirNo, altDersIndex: alt.altDersIndex, hamMetin: alt.hamMetin, ...(yumusak ? { cakisanTahmin: kisalt(yumusak) } : {}) });
    } else kalan++;
  }
  return { adaylar, dusenler, kalan };
}

// ---- kalıcı kayıt: kural.jsonl (append-only; sentez kayıtları replay'de taslağa uygulanır) ----
export interface KuralTaslagi { id: string; at: string; tip: 'TASLAK'; sayac: number; esik: number; adaylar: KuralAdayi[]; dusenler: Dusen[]; kalan: number }
export type KuralKayit =
  | { event: 'tarama'; at: string; icerikHash: string; maddeSayisi: number; altDersSayisi: number; adaySayisi: number; sayac: number }
  | { event: 'taslak'; at: string; taslak: KuralTaslagi }
  | { event: 'sentez'; at: string; taslakId: string; adayAnahtar: string; sentezMetin: string; actor: string }
  | { event: 'onay'; at: string; taslakId: string; actor: string; uygulanan: number; yeniSayac: number; sentezsiz: number };

export function kuralYolu(dbPath: string): string { return join(dirname(dbPath), 'kural.jsonl'); }

export interface KuralDefteri {
  path: string;
  taramaKaydet(o: { maddeSayisi: number; altDersSayisi: number; adaySayisi: number; sayac: number }, now?: () => Date): { kaydedildi: boolean; icerikHash: string };
  taslakKaydet(t: KuralTaslagi): void;
  sentezKaydet(taslakId: string, adayOnEk: string, sentezMetin: string, actor: string, now?: () => Date): void;
  onayKaydet(taslakId: string, actor: string, uygulanan: number, yeniSayac: number, sentezsiz: number, now?: () => Date): void;
  taslaklar(): KuralTaslagi[]; // sentez overlay uygulanmış (kayıt sırası = son kazanır)
  onaylar(): { taslakId: string; actor: string }[];
}

function taslaklariUygula(kayitlar: KuralKayit[]): KuralTaslagi[] {
  const taslaklar = kayitlar.filter((k): k is Extract<KuralKayit, { event: 'taslak' }> => k.event === 'taslak').map((k) => structuredClone(k.taslak));
  for (const k of kayitlar) {
    if (k.event !== 'sentez') continue;
    const t = taslaklar.find((x) => x.id === k.taslakId);
    const a = t?.adaylar.find((x) => x.anahtar === k.adayAnahtar);
    if (a) a.sentezMetin = k.sentezMetin;
  }
  return taslaklar;
}

export function openKuralDefteri(dbPath: string): KuralDefteri {
  const path = kuralYolu(dbPath);
  mkdirSync(dirname(path), { recursive: true });
  const kayitlar: KuralKayit[] = jsonlYukle<KuralKayit>(path, red, 'kural.jsonl');  return {
    path,
    taramaKaydet(o, now = () => new Date()) {
      const icerikHash = createHash('sha256').update(JSON.stringify([o.maddeSayisi, o.altDersSayisi, o.adaySayisi, o.sayac])).digest('hex');
      const ayni = kayitlar.some((k) => k.event === 'tarama' && k.icerikHash === icerikHash);
      if (!ayni) { // ölçüm spam'ı önlenir: sayılar değişmedikçe kayıt düşmez
        const k: KuralKayit = { event: 'tarama', at: now().toISOString(), icerikHash, ...o };
        jsonlEkle(path, k); kayitlar.push(k);
      }
      return { kaydedildi: !ayni, icerikHash };
    },
    taslakKaydet(t) { const k: KuralKayit = { event: 'taslak', at: t.at, taslak: t }; jsonlEkle(path, k); kayitlar.push(k); },
    sentezKaydet(taslakId, adayOnEk, sentezMetin, actor, now = () => new Date()) {
      if (adayOnEk.length < 8) red('aday-on-ek-kisa', `aday anahtar öneki >= 8 hex olmalı: ${adayOnEk}`);
      const t = taslaklariUygula(kayitlar).find((x) => x.id === taslakId);
      if (!t) red('taslak-yok', `taslak yok: ${taslakId} (sentez ölçüm → taslak sonrası koşar)`);
      const aday = t.adaylar.find((a) => a.anahtar.startsWith(adayOnEk));
      if (!aday) red('aday-yok', `aday yok: ${adayOnEk} (taslak ${taslakId} adaylarından birine işaret etmeli)`);
      const k: KuralKayit = { event: 'sentez', at: now().toISOString(), taslakId, adayAnahtar: aday.anahtar, sentezMetin, actor };
      jsonlEkle(path, k); kayitlar.push(k);
    },
    onayKaydet(taslakId, actor, uygulanan, yeniSayac, sentezsiz, now = () => new Date()) {
      const k: KuralKayit = { event: 'onay', at: now().toISOString(), taslakId, actor, uygulanan, yeniSayac, sentezsiz };
      jsonlEkle(path, k); kayitlar.push(k);
    },
    taslaklar: () => taslaklariUygula(kayitlar),
    onaylar: () => kayitlar.filter((k): k is Extract<KuralKayit, { event: 'onay' }> => k.event === 'onay').map((k) => ({ taslakId: k.taslakId, actor: k.actor })),
  };
}

// B7 (üretim bulgusu, (R) ölçüm yüzü): her ölçüm koşusu aday varsa YENİ taslak kaydı
// düşürüyordu (üretimde 2 doğrulama koşumu 2 çöp taslak doğurdu). Aynı aday-anahtar seti
// için ONAYSIZ taslak zaten varsa yenisi DOĞMAZ — mevcut döner (sentez kayıtları da mevcut
// taslağa bağlı kalır). İmza = sıralı anahtar seti; sayaç/dusenler/kalan bilgiseldir.
export function eslesenTaslak(taslaklar: KuralTaslagi[], onayliTaslakIdler: Set<string>, adaylar: KuralAdayi[]): KuralTaslagi | undefined {
  const imza = (a: KuralAdayi[]) => a.map((x) => x.anahtar).sort().join('|');
  const hedefImza = imza(adaylar);
  return taslaklar.find((t) => !onayliTaslakIdler.has(t.id) && t.adaylar.length === adaylar.length && imza(t.adaylar) === hedefImza);
}

// ---- hedef yazma (tmp+fsync+rename — A2-10 kalıbı; append-only, bayt-koruma, EOL koruma) ----
export function hedefYaz(ev: string, icerik: string): void {
  const tmp = ev + '.tmp-' + Date.now();
  const fd = openSync(tmp, 'w');
  try { writeSync(fd, icerik, 'utf8'); fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(tmp, ev);
}

export function hedefEkle(hedefEv: string, yeniSatirlar: string[]): { eskiSatirSayisi: number; yeniSatirSayisi: number } {
  if (!existsSync(hedefEv)) red('hedef-yok', `hedef dosya yok: ${hedefEv}`);
  const ham = readFileSync(hedefEv, 'utf8');
  const eol = ham.includes('\r\n') ? '\r\n' : '\n'; // hedefin EOL'ü korunur (PS >> CRLF tuzağı)
  const satirSay = (m: string) => (m === '' ? 0 : m.split(/\r?\n/).length - (/\r?\n$/.test(m) ? 1 : 0));
  const govde = ham === '' ? '' : (/\r?\n$/.test(ham) ? ham : ham + eol);
  const temiz = yeniSatirlar.map((s) => s.replace(/\r?\n/g, ' ')); // aday TEK satıra iner — sayaç +1/aday
  hedefYaz(hedefEv, govde + temiz.join(eol) + eol);
  return { eskiSatirSayisi: satirSay(ham), yeniSatirSayisi: satirSay(ham) + temiz.length };
}

// ---- [insan] TOPLU kapısı + uygulama (tek yol: insan CLI yüzü) ----
export function kuralOnayla(o: {
  defter: KuralDefteri; taslakId: string; confirm: string; actor: string;
  hedefEv: string; kok: string; hedeflerYolu?: string; now?: () => Date;
}): { status: 'ONAYLANDI'; uygulanan: number; yeniSayac: number; sentezsiz: number } {
  // RED'lerin TAMAMI disk mutasyonundan ÖNCE (sıra: metin → aktör → taslak → idempotent → aday → parti → hedef → tavan → bayat)
  if (o.confirm !== KURAL_ONAY_METNI)
    red('onay-metni', `onay reddedildi: --confirm "${KURAL_ONAY_METNI}" gerekli (kapı tasarımı — L0 DEĞİŞİMİ onaysız olmaz)`);
  if (o.actor !== 'insan:cli')
    red('aktor-red', `onay reddedildi: aktör '${o.actor}' — onay yalnız insan CLI yüzünden (EK-2: ajan/proxy onaylayamaz)`);
  const taslak = o.defter.taslaklar().find((t) => t.id === o.taslakId);
  if (!taslak) red('taslak-yok', `taslak yok: ${o.taslakId} (önce ölçüm → aday → taslak doğmalı)`);
  if (o.defter.onaylar().some((a) => a.taslakId === o.taslakId))
    red('onaylandi-zaten', `taslak ${o.taslakId} zaten onaylı (idempotent)`);
  if (taslak.adaylar.length === 0)
    red('aday-yok', `taslak ${o.taslakId} aday taşımıyor (DERSLER'den yeni ders akmalı)`);
  if (taslak.adaylar.length > KURAL_PARTI_UST)
    red('parti-ust', `taslak ${taslak.adaylar.length} aday taşıyor — ilk toplu onay <= ${KURAL_PARTI_UST} (K-0051 kademeli güven); adayları bölün`);
  if (!existsSync(o.hedefEv)) red('hedef-yok', `hedef dosya yok: ${o.hedefEv}`);
  // TAVAN KİLİDİ: sayaç TA-ZE diskten (dalgalar arası doküman değişimi sayacı oynatır; önbellek yok)
  const sayacOlcumu = kuralSayaci(o.kok);
  const sayac = sayacOlcumu.toplam;
  const esik = esikOku(o.hedeflerYolu ?? join(o.kok, 'hedefler.json')).kirmizi;
  const eklenecek = taslak.adaylar.length; // her aday TEK liste-satırı (+1)
  if (sayac + eklenecek > esik)
    red('tavan-asimi', `tavan kilidi: sayaç ${sayac} + ${eklenecek} aday = ${sayac + eklenecek} > ${esik} (hedefler.json kuralKirmiziEsik) — derleyici DURUR, hedef dosya DOKUNULMAZ (REHBER §2 stacking-collapse)`);
  // B1 (denetçi bulgusu, (R) çift-uygulama): onay ANINDA güncel havuzla yeniden dedup — ölçüm
  // sırasındaki 'mevcut çakışan düşer' vaadi onayda da geçerli olmalı. Örtüşen ikinci taslak
  // (iki hızlı ölçüm) VE hedefEkle↔onayKaydet çökme penceresi aynı ders metnini İKİZLEMEZ.
  // B6: dedup İKİ sinyalli — birebir anahtar-hash VE provenans çapası (inen satır sentez
  // metni olduğu için hash tek başına eşleşmez; üretim bulgusu).
  const hedefSatirlari = readFileSync(o.hedefEv, 'utf8').split(/\r?\n/);
  const mevcutAnahtarlar = new Set<string>();
  for (const d of sayacOlcumu.dosyaBasi) for (const s of d.satirlar) mevcutAnahtarlar.add(adayAnahtari(s));
  for (const s of hedefSatirlari) mevcutAnahtarlar.add(adayAnahtari(s));
  const inmisProvenans = provenansKayitlari([...sayacOlcumu.dosyaBasi.flatMap((d) => d.satirlar), ...hedefSatirlari]);
  const cakisan = taslak.adaylar.filter((a) => mevcutAnahtarlar.has(a.anahtar) || provenansCakisir(a.anahtar, a.kaynakSatir, inmisProvenans));
  if (cakisan.length > 0)
    red('bayat-taslak', `taslak ${o.taslakId} bayat: ${cakisan.length} aday güncel havuzda zaten duruyor (${cakisan.map((a) => 'satır ' + a.kaynakSatir + ': ' + kisalt(a.sentezMetin ?? a.hamMetin)).join('; ')}) — yeniden ölçün (çakışanlar 'cakisan' olarak düşer)`);
  const satirlar = taslak.adaylar.map((a) =>
    `- ${(a.sentezMetin ?? a.hamMetin.replace(/^\s*-\s*/, '').replace(MADDE_ONEKI, '').trim()).replace(/\r?\n/g, ' ')} (A3 K-0051; kaynak DERSLER satır ${a.kaynakSatir}; ham ${a.anahtar.slice(0, 16)})`);
  hedefEkle(o.hedefEv, satirlar);
  const sentezsiz = taslak.adaylar.filter((a) => !a.sentezMetin).length;
  o.defter.onayKaydet(o.taslakId, o.actor, satirlar.length, sayac + eklenecek, sentezsiz, o.now);
  return { status: 'ONAYLANDI', uygulanan: satirlar.length, yeniSayac: sayac + eklenecek, sentezsiz };
}
