// K13-01 (plan §22): GÖZETİMSİZ ÇALIŞMA GİRİŞ KAPISI — 6 koşul + 'gozetimsiz kullanılamaz' rozeti.
// "Gece çalıştır" modu ancak 6 koşulun kanıtıyla açılır; koşullar sağlanmıyorsa runtime
// rozet KIRMIZI taşır. Bu modül rozetin HESAP ucudur: defterden sorgulanabilir koşullar
// (1 uzlaştırma / 2 iptal / 3 ölçüm / 5 grant etkisi) DOĞRUDAN sorgulanır; yetenek-düzeyi
// koşulları (4 dosya-shell sınırları — M26/M31 canlı negatif; 6 eski sahip yazamaz —
// K12-08 devir/fence) ÇAĞIRANDAN kanıt bayrağı bekler ve KANIT YOKSA KIRMIZI kalır
// (fail-closed — B02 probe deseni). Kanıtların kendisi canlı test paketindedir
// (test/k13-gozetimsiz-canli.test.ts). Yeni defter gücü/kind YOK (R6).
import type { DatabaseSync } from 'node:sqlite';
import { expireDueGrants } from './grants.ts';

export interface GozetimsizKosul { no: number; ad: string; gecti: boolean; detay: string }

// yetenek-düzeyi kanıt bayrakları (canlı turlardan gelir; verilmedikçe koşul KIRMIZI)
export interface GozetimsizKanitlar {
  dosyaShellSinirlariKanitli?: boolean;   // (4) M26/M31 canlı negatif: junction/symlink RED + worktree izolasyon
  eskiSahipYazmaEngeliKanitli?: boolean;  // (6) K12-08: devir sonrası eski fence ile commit/evidence RED
}

export function unattendedReadiness(db: DatabaseSync, kanitlar: GozetimsizKanitlar = {}) {
  const kosullar: GozetimsizKosul[] = [];

  // (1) worker durumu/sahipliği uzlaştırılabiliyor: çözümlenmemiş UNKNOWN rezervasyon YOK
  // (kapasite kanıtı: reconcile canlı — belirsiz spawn → gerçek ölüm → dead-released)
  const unknown = (db.prepare("SELECT COUNT(*) AS c FROM reservations WHERE state='UNKNOWN'").get() as any).c as number;
  kosullar.push({ no: 1, ad: 'worker durumu/sahipligi uzlastirilabilir', gecti: unknown === 0, detay: unknown === 0 ? 'cozumlenmemis UNKNOWN rezervasyon yok' : `${unknown} UNKNOWN rezervasyon cozumlenmemis` });

  // (2) iptal doğrulanmış: CANCEL_REQUESTED'ı CANCEL_CONFIRMED'sız kalan run YOK
  const bekleyenIptal = (
    db.prepare(
      "SELECT COUNT(*) AS c FROM (SELECT DISTINCT run_id FROM events WHERE type='CANCEL_REQUESTED' AND run_id IS NOT NULL EXCEPT SELECT DISTINCT run_id FROM events WHERE type='CANCEL_CONFIRMED')",
    ).get() as any
  ).c as number;
  kosullar.push({ no: 2, ad: 'iptal dogrulanmis', gecti: bekleyenIptal === 0, detay: bekleyenIptal === 0 ? 'dogrulanmamis iptal talebi yok' : `${bekleyenIptal} run icin CANCEL_REQUESTED teyitsiz` });

  // (3) kullanım ölçülüyor: ölçülemeyen bütçeli (usage_unknown=1) run YOK (§9.3)
  const olcumelenmeyen = (db.prepare('SELECT COUNT(*) AS c FROM runs WHERE usage_unknown=1').get() as any).c as number;
  kosullar.push({ no: 3, ad: 'kullanim olculuyor', gecti: olcumelenmeyen === 0, detay: olcumelenmeyen === 0 ? 'usage_unknown=0 tum runlarda' : `${olcumelenmeyen} run butcesi olculemiyor` });

  // (4) dosya/shell sınırları uygulanıyor (M26/M31 canlı negatif) — kanıt bayrağı fail-closed
  kosullar.push({ no: 4, ad: 'dosya/shell sinirlari uygulaniyor', gecti: kanitlar.dosyaShellSinirlariKanitli === true, detay: kanitlar.dosyaShellSinirlariKanitli === true ? 'M26/M31 canli negatif kaniti taze' : 'kanit GETIRILMEDI — fail-closed kirmizi' });

  // (5) grant expiry/revoke çalışırken etki ediyor: sonlanmış grant'e RUNNING attempt bağlı YOK
  expireDueGrants(db); // U7: sonlanma tx-dışı işlenir (rozet okuma girişi API düzeyindedir)
  const sonlanmisBagli = (
    db.prepare("SELECT COUNT(*) AS c FROM attempts a JOIN grants g ON g.id=a.grant_id WHERE a.state='RUNNING' AND g.state IN('EXPIRED','REVOKED')").get() as any
  ).c as number;
  kosullar.push({ no: 5, ad: 'grant expiry/revoke etkisi calisiyor', gecti: sonlanmisBagli === 0, detay: sonlanmisBagli === 0 ? 'sonlanmis granta bagli RUNNING attempt yok' : `${sonlanmisBagli} RUNNING attempt sonlanmis granta bagli` });

  // (6) handoff sonrası eski sahip YAZAMAZ (K12-08) — kanıt bayrağı fail-closed
  // (receipt fence YAZMA engeliyle aynı şey DEĞİLDİR — kanıt devir+stale-fence RED turundan)
  kosullar.push({ no: 6, ad: 'handoff sonrasi eski sahip yazamaz', gecti: kanitlar.eskiSahipYazmaEngeliKanitli === true, detay: kanitlar.eskiSahipYazmaEngeliKanitli === true ? 'devir + stale fence yazma RED kaniti taze' : 'kanit GETIRILMEDI — fail-closed kirmizi' });

  const hazir = kosullar.every((k) => k.gecti);
  return { rozet: hazir ? ('gozetimsiz-hazir' as const) : ('gozetimsiz-kullanilamaz' as const), kosullar };
}
