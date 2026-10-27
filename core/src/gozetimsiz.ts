// K13-01 (plan §22): GÖZETİMSİZ ÇALIŞMA GİRİŞ KAPISI — 6 koşul + 'gozetimsiz kullanılamaz' rozeti.
// "Gece çalıştır" modu ancak 6 koşulun kanıtıyla açılır; koşullar sağlanmıyorsa runtime
// rozet KIRMIZI taşır. Bu modül rozetin HESAP ucudur: defterden sorgulanabilir koşullar
// (1 uzlaştırma / 2 iptal / 3 ölçüm / 5 grant etkisi) DOĞRUDAN sorgulanır; yetenek-düzeyi
// koşulları (4 dosya-shell sınırları — M26/M31 canlı negatif; 6 eski sahip yazamaz —
// K12-08 devir/fence) ÇAĞIRANDAN kanıt bayrağı bekler ve KANIT YOKSA KIRMIZI kalır
// (fail-closed — B02 probe deseni). Kanıtların kendisi canlı test paketindedir
// (test/k13-gozetimsiz-canli.test.ts). Yeni defter gücü/kind YOK (R6).
//
// A0-3 BESLEME KATMANI (dalga planı §3 W-A0-3 — kanıt-üretici uç): rozetin kanıt yüzü
// kalıcı jsonl defterden okunur (varsayılan core/data/gozetimsiz-kanit.jsonl —
// defter.ts jsonlYukle/jsonlEkle: fsync'li append + son-satır onarımı). 6 kanıt
// bayrağının 4'ü (koşul 1/2/3/5 — defter-sorgulu) DAEMON'UN KENDİ DÖNGÜSÜNDEN beslenir
// (besleDaemonKanitlari: başarılı tick sonrası DB sorgulanır, YEŞİL koşullar için kayıt
// yazılır; kırmızı koşula kayıt YAZILMAZ — yeşile boyama yok, kanıt eskir, rozet kırmızı
// düşer). Kalan 2 yetenek bayrağı (koşul 4/6) dış kanıt sahibi (canlı paket) kanitKaydet
// ile kayda girer. Tazelik penceresi (kanitTazeligi): pencere dışı kalmış kanıt = kanıt
// YOK — fail-closed. unattendedReadinessBeslemeli: gece-modu rozeti — 1/2/3/5 için
// DB-yeşili VE taze kanıt (çift bacak: taze kanıt kırmızı DB'yi ASLA boyayamaz), 4/6
// için taze kanıt; daemon ölse/pazlasa kanıtlar pencere dışına düşer → rozet kendiliğinden
// kapanır (canlılık kanıtı da fail-closed).
import type { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { expireDueGrants } from './grants.ts';
import { jsonlYukle, jsonlEkle, type Red } from './defter.ts';

export interface GozetimsizKosul { no: number; ad: string; gecti: boolean; detay: string }

// yetenek-düzeyi kanıt bayrakları (canlı turlardan gelir; verilmedikçe koşul KIRMIZI)
export interface GozetimsizKanitlar {
  dosyaShellSinirlariKanitli?: boolean;   // (4) M26/M31 canlı negatif: junction/symlink RED + worktree izolasyon
  eskiSahipYazmaEngeliKanitli?: boolean;  // (6) K12-08: devir sonrası eski fence ile commit/evidence RED
}

// üretim kanıt defteri yolu (daemon beslemesi + dış kanıt kaydı ortak ucu; A4 tüketir)
export const KANIT_DEFTERI_YOLU = fileURLToPath(new URL('../data/gozetimsiz-kanit.jsonl', import.meta.url));

// === koşul sorguları — TEK KAYNAK: unattendedReadiness VE besleme katmanı aynı SQL'i paylaşır ===
function unknownSayisi(db: DatabaseSync): number {
  return (db.prepare("SELECT COUNT(*) AS c FROM reservations WHERE state='UNKNOWN'").get() as any).c as number;
}
function teyitsizIptalSayisi(db: DatabaseSync): number {
  return (db.prepare(
    "SELECT COUNT(*) AS c FROM (SELECT DISTINCT run_id FROM events WHERE type='CANCEL_REQUESTED' AND run_id IS NOT NULL EXCEPT SELECT DISTINCT run_id FROM events WHERE type='CANCEL_CONFIRMED')",
  ).get() as any).c as number;
}
function olcumelenmeyenSayisi(db: DatabaseSync): number {
  return (db.prepare('SELECT COUNT(*) AS c FROM runs WHERE usage_unknown=1').get() as any).c as number;
}
function sonlanmisBagliSayisi(db: DatabaseSync): number {
  return (db.prepare(
    "SELECT COUNT(*) AS c FROM attempts a JOIN grants g ON g.id=a.grant_id WHERE a.state='RUNNING' AND g.state IN('EXPIRED','REVOKED')",
  ).get() as any).c as number;
}

export function unattendedReadiness(db: DatabaseSync, kanitlar: GozetimsizKanitlar = {}) {
  const kosullar: GozetimsizKosul[] = [];

  // (1) worker durumu/sahipliği uzlaştırılabiliyor: çözümlenmemiş UNKNOWN rezervasyon YOK
  // (kapasite kanıtı: reconcile canlı — belirsiz spawn → gerçek ölüm → dead-released)
  const unknown = unknownSayisi(db);
  kosullar.push({ no: 1, ad: 'worker durumu/sahipligi uzlastirilabilir', gecti: unknown === 0, detay: unknown === 0 ? 'cozumlenmemis UNKNOWN rezervasyon yok' : `${unknown} UNKNOWN rezervasyon cozumlenmemis` });

  // (2) iptal doğrulanmış: CANCEL_REQUESTED'ı CANCEL_CONFIRMED'sız kalan run YOK
  const bekleyenIptal = teyitsizIptalSayisi(db);
  kosullar.push({ no: 2, ad: 'iptal dogrulanmis', gecti: bekleyenIptal === 0, detay: bekleyenIptal === 0 ? 'dogrulanmamis iptal talebi yok' : `${bekleyenIptal} run icin CANCEL_REQUESTED teyitsiz` });

  // (3) kullanım ölçülüyor: ölçülemeyen bütçeli (usage_unknown=1) run YOK (§9.3)
  const olcumelenmeyen = olcumelenmeyenSayisi(db);
  kosullar.push({ no: 3, ad: 'kullanim olculuyor', gecti: olcumelenmeyen === 0, detay: olcumelenmeyen === 0 ? 'usage_unknown=0 tum runlarda' : `${olcumelenmeyen} run butcesi olculemiyor` });

  // (4) dosya/shell sınırları uygulanıyor (M26/M31 canlı negatif) — kanıt bayrağı fail-closed
  kosullar.push({ no: 4, ad: 'dosya/shell sinirlari uygulaniyor', gecti: kanitlar.dosyaShellSinirlariKanitli === true, detay: kanitlar.dosyaShellSinirlariKanitli === true ? 'M26/M31 canli negatif kaniti taze' : 'kanit GETIRILMEDI — fail-closed kirmizi' });

  // (5) grant expiry/revoke çalışırken etki ediyor: sonlanmış grant'e RUNNING attempt bağlı YOK
  expireDueGrants(db); // U7: sonlanma tx-dışı işlenir (rozet okuma girişi API düzeyindedir)
  const sonlanmisBagli = sonlanmisBagliSayisi(db);
  kosullar.push({ no: 5, ad: 'grant expiry/revoke etkisi calisiyor', gecti: sonlanmisBagli === 0, detay: sonlanmisBagli === 0 ? 'sonlanmis granta bagli RUNNING attempt yok' : `${sonlanmisBagli} RUNNING attempt sonlanmis granta bagli` });

  // (6) handoff sonrası eski sahip YAZAMAZ (K12-08) — kanıt bayrağı fail-closed
  // (receipt fence YAZMA engeliyle aynı şey DEĞİLDİR — kanıt devir+stale-fence RED turundan)
  kosullar.push({ no: 6, ad: 'handoff sonrasi eski sahip yazamaz', gecti: kanitlar.eskiSahipYazmaEngeliKanitli === true, detay: kanitlar.eskiSahipYazmaEngeliKanitli === true ? 'devir + stale fence yazma RED kaniti taze' : 'kanit GETIRILMEDI — fail-closed kirmizi' });

  const hazir = kosullar.every((k) => k.gecti);
  return { rozet: hazir ? ('gozetimsiz-hazir' as const) : ('gozetimsiz-kullanilamaz' as const), kosullar };
}

// ===================== A0-3 BESLEME KATMANI (kanıt-üretici uç) =====================

// Kanıt bayrağı adları — yukarıdaki 6 koşulla birebir eşleşir. 4 defter-sorgulu bayrak
// (koşul 1/2/3/5) daemon döngüsünden beslenir; 2 yetenek bayrağı (koşul 4/6) dış
// kanıt sahibinden kayda girer. Ölçüt cümlesi: rozet 4/6 bayrağı daemon tarafından
// besleniyor (A0-DALGA planı §3/§4).
export type KanitBayragi =
  | 'uzlastirmaKanitli'           // koşul 1 — daemon döngüsü besler
  | 'iptalDogrulamaKanitli'       // koşul 2 — daemon döngüsü besler
  | 'kullanimOlcumuKanitli'       // koşul 3 — daemon döngüsü besler
  | 'dosyaShellSinirlariKanitli'  // koşul 4 (yetenek) — dış kanıt (canlı paket)
  | 'grantEtkisiKanitli'          // koşul 5 — daemon döngüsü besler
  | 'eskiSahipYazmaEngeliKanitli'; // koşul 6 (yetenek) — dış kanıt (canlı paket)

export const KANIT_BAYRAKLARI: readonly KanitBayragi[] = [
  'uzlastirmaKanitli', 'iptalDogrulamaKanitli', 'kullanimOlcumuKanitli',
  'dosyaShellSinirlariKanitli', 'grantEtkisiKanitli', 'eskiSahipYazmaEngeliKanitli',
] as const;

// kalıcı kanıt kaydı (jsonl satırı): damga insan gözü için ISO, turMs tazelik
// aritmetiği için epoch ms — ikisi AYNI andan gelir (tahmin değil ölçüm).
export interface GozetimsizKanitKaydi {
  bayrak: KanitBayragi;
  kaynak: 'daemon-tick' | 'dis-kanit'; // daemon kendi döngüsü / dış kanıt sahibi
  damga: string;                       // ISO UTC
  turMs: number;                       // epoch ms
  detay: string;
}

// ORTA satır bozukluğu LOUD (defter.ts sözleşmesi — sessiz onarım veri kaybı gizler);
// SON satır yarım yazma jsonlYukle'de onarılır (crash tuzağı).
const kanitRed: Red = (code, msg) => { throw new Error('gozetimsiz-kanit ' + code + ': ' + msg); };

// kanıt YAZMA ucu — daemon beslemesi ve dış kanıt sahibi (canlı paket) ortak kapısı.
// fsync'li append: crash anında yarım satır ancak SON satır olabilir (tail-repair).
// Bilinmeyen bayrak adı RED: yazım hatası sessizce 'asla taze sayılmayan' kayıt doğurur.
export function kanitKaydet(defterYolu: string, kayit: GozetimsizKanitKaydi): void {
  if (!KANIT_BAYRAKLARI.includes(kayit.bayrak)) throw new Error('bilinmeyen-kanit-bayragi: ' + String(kayit.bayrak));
  jsonlEkle(defterYolu, kayit);
}

// DAEMON TİK BESLEMESİ — rozetin 4/6 bayrağı buradan gelir: 4 defter-sorgulu koşulu
// (1/2/3/5) DB'den DOĞRULAR ve yeşil olanların HER BİRİ için kalıcı kanıt yazar.
// Kırmızı koşula kayıt YAZMAZ (yeşile boyama yok — kırmızının kanıtı eskir, rozet
// kırmızı düşer: fail-closed). expireDueGrants önce işlenir (U7 — unattendedReadiness
// ile aynı ayak). Dönen liste: bu koşumda yazılan bayraklar (gözlemlenebilirlik).
export function besleDaemonKanitlari(db: DatabaseSync, defterYolu: string, now: () => number = () => Date.now()): KanitBayragi[] {
  expireDueGrants(db);
  const t = now();
  const damga = new Date(t).toISOString();
  const yazilan: KanitBayragi[] = [];
  const besle = (bayrak: KanitBayragi, dbGecti: boolean, detay: string) => {
    if (!dbGecti) return; // kırmızı koşul kanıt ÜRETMEZ
    kanitKaydet(defterYolu, { bayrak, kaynak: 'daemon-tick', damga, turMs: t, detay });
    yazilan.push(bayrak);
  };
  besle('uzlastirmaKanitli', unknownSayisi(db) === 0, 'UNKNOWN rezervasyon yok — daemon tick dogrulamasi');
  besle('iptalDogrulamaKanitli', teyitsizIptalSayisi(db) === 0, 'teyitsiz iptal talebi yok — daemon tick dogrulamasi');
  besle('kullanimOlcumuKanitli', olcumelenmeyenSayisi(db) === 0, 'usage_unknown=0 — daemon tick dogrulamasi');
  besle('grantEtkisiKanitli', sonlanmisBagliSayisi(db) === 0, 'sonlanmis granta bagli RUNNING attempt yok — daemon tick dogrulamasi');
  return yazilan;
}

// TAZELİK OKUMA — bayrak başına EN YENİ kayıt pencere içinde mi? Kayıt yok / eski =
// bayrak YOK (fail-closed — eski kanıt kırmızıdır). Kaynak ayrımı YOK: dış kanıt da
// aynı tazelik kapısından geçer (daemon ile canlı paket eşit yurttaş). Tanınmayan
// bayrak adı taşıyan kayıt sessizce YOKSAYILIR (asla taze sayılmaz).
export function kanitTazeligi(defterYolu: string, pencereMs: number, now: () => number = () => Date.now()): Record<KanitBayragi, boolean> {
  const kayitlar = jsonlYukle<GozetimsizKanitKaydi>(defterYolu, kanitRed, 'gozetimsiz-kanit');
  const enYeni = new Map<KanitBayragi, number>();
  for (const k of kayitlar) {
    if (!KANIT_BAYRAKLARI.includes(k.bayrak)) continue;
    const onceki = enYeni.get(k.bayrak);
    if (onceki === undefined || k.turMs > onceki) enYeni.set(k.bayrak, k.turMs);
  }
  const t = now();
  const taze = {} as Record<KanitBayragi, boolean>;
  for (const b of KANIT_BAYRAKLARI) taze[b] = (enYeni.get(b) ?? Number.NEGATIVE_INFINITY) >= t - pencereMs;
  return taze;
}

// GECE-MODİ ROZETİ (A4 tüketir) — unattendedReadiness ile AYNI 6 koşul, yeni koşul YOK
// (R6); fark: kanıt yüzü tazelik penceresine bağlanır. 1/2/3/5: DB-yeşili VE taze kanıt
// (çift bacak — taze kanıt kırmızı DB'yi ASLA boyayamaz); 4/6: taze kanıt. Daemon ölse
// ya da pazlasa kanıtlar pencere dışına düşer → rozet kendiliğinden kullanilamaz (daemon
// canlılığının kendisi kanıt fail-closed).
export function unattendedReadinessBeslemeli(
  db: DatabaseSync, defterYolu: string, pencereMs: number, now: () => number = () => Date.now(),
): { rozet: 'gozetimsiz-hazir' | 'gozetimsiz-kullanilamaz'; kosullar: GozetimsizKosul[]; tazelik: Record<KanitBayragi, boolean> } {
  const taze = kanitTazeligi(defterYolu, pencereMs, now);
  const kosullar: GozetimsizKosul[] = [];
  const ESKI_KANIT = 'kanit ESKI ya da YOK — tazelik penceresi disinda (fail-closed)';

  // (1/2/3/5) çift bacak: DB bacağı + tazelik bacağı — detay HANGİ bacağın düştüğünü adlandır
  const ciftBacak = (no: number, ad: string, dbGecti: boolean, dbDetay: string, bayrak: KanitBayragi) => {
    kosullar.push({
      no, ad,
      gecti: dbGecti && taze[bayrak],
      detay: !dbGecti ? dbDetay : (taze[bayrak] ? dbDetay + ' + kanit taze' : ESKI_KANIT),
    });
  };

  const unknown = unknownSayisi(db);
  ciftBacak(1, 'worker durumu/sahipligi uzlastirilabilir', unknown === 0, unknown === 0 ? 'cozumlenmemis UNKNOWN rezervasyon yok' : `${unknown} UNKNOWN rezervasyon cozumlenmemis`, 'uzlastirmaKanitli');
  const bekleyenIptal = teyitsizIptalSayisi(db);
  ciftBacak(2, 'iptal dogrulanmis', bekleyenIptal === 0, bekleyenIptal === 0 ? 'dogrulanmamis iptal talebi yok' : `${bekleyenIptal} run icin CANCEL_REQUESTED teyitsiz`, 'iptalDogrulamaKanitli');
  const olcumelenmeyen = olcumelenmeyenSayisi(db);
  ciftBacak(3, 'kullanim olculuyor', olcumelenmeyen === 0, olcumelenmeyen === 0 ? 'usage_unknown=0 tum runlarda' : `${olcumelenmeyen} run butcesi olculemiyor`, 'kullanimOlcumuKanitli');

  // (4) yetenek koşulu — taze kanıt kaydı fail-closed (kaynak fark etmez: dış kanıt da taze olmalı)
  kosullar.push({ no: 4, ad: 'dosya/shell sinirlari uygulaniyor', gecti: taze.dosyaShellSinirlariKanitli === true, detay: taze.dosyaShellSinirlariKanitli === true ? 'M26/M31 canli negatif kaniti taze' : ESKI_KANIT });

  // (5) grant etkisi — expireDueGrants önce (U7), sonra çift bacak
  expireDueGrants(db);
  const sonlanmisBagli = sonlanmisBagliSayisi(db);
  ciftBacak(5, 'grant expiry/revoke etkisi calisiyor', sonlanmisBagli === 0, sonlanmisBagli === 0 ? 'sonlanmis granta bagli RUNNING attempt yok' : `${sonlanmisBagli} RUNNING attempt sonlanmis granta bagli`, 'grantEtkisiKanitli');

  // (6) yetenek koşulu — taze kanıt kaydı fail-closed
  kosullar.push({ no: 6, ad: 'handoff sonrasi eski sahip yazamaz', gecti: taze.eskiSahipYazmaEngeliKanitli === true, detay: taze.eskiSahipYazmaEngeliKanitli === true ? 'devir + stale fence yazma RED kaniti taze' : ESKI_KANIT });

  const hazir = kosullar.every((k) => k.gecti);
  return { rozet: hazir ? ('gozetimsiz-hazir' as const) : ('gozetimsiz-kullanilamaz' as const), kosullar, tazelik: taze };
}
