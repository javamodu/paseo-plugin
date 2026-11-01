// OTODEV-1 A2 PARÇA 4 — NÖBET KOŞUCUSU (kaynak: plans/OTODEV-OTOMATIK-DEVIR-PLANI-2026-11-01.md parça 4; pilot-0'nın mekanik katmanı): schedule ile doğan nöbet AJANININ önce koşacağı deterministik betik. Rol ayrımı (plan: 'watchdog YAZICI değildir'): ajan LLM'dir — yazma kararı ve handoff İÇERİĞİ onundur; betik yalnız DURUM RAPORLAR (salt-okur), KİRA YÖNETİR (devir-kira.mjs SSOT sarmalayıcı) ve BREF ÜRETİR (devir-brief.mjs). Betik handoff dosyası YAZMAZ.
//
// ALT KOMUTLAR (node pano/nobet.mjs <alt>):
//   durum        salt-okur JSON rapor; HİÇBİR dosyaya yazmaz. Çıkış: 0 = devir gerekmez (kira
//                taze ya da sahibi canlı) · 2 = devir gerekli (kira yok / bayat-ölü / bilinçli
//                bırakılmış) · 1 = RED (tavan ya da zincir kapısı — mesaj JSON 'red' alanında).
//                RED kapıları KARARDAN ÖNCE döner (fail-closed sıra: alarm sessiz çıkışı ezer).
//                Kira etiketi görevdeki 4 değer + dürüst 2 genişletme: 'birakildi' (bilinçli
//                veda — ölü de canlı da değildir; devir gerekli) ve 'bozuk' (kiraAl RED'ler →
//                temizlik [insan] kapısında kalır; exit 1).
//   kira-al      --sinif <operator|nobet> --pid <N> [--kimlik <metin>]: kiraAl sarmalayıcı.
//                --pid ZORUNLU ve pozitif tamsayı, sessiz varsayılan YOK — betik kendi kısa
//                ömürlü pid'ini yanlışlıkla kira sahibi YAPAMAZ (üretimde nöbet ajanı Paseo
//                daemon pid'ini geçirir). --kimlik verilmezse 'nobet-ajan-<pid>' (kira-yenile
//                ve kira-birak AYNI türetmeyi kullanır — ajan yalnız --pid geçirerek tutarlı
//                kimlik taşır). Sonuç {ok,sebep,kira} JSON; başarısızlıkta çıkış 1.
//   kira-birak   bilinçli veda (kira TTL beklemeden devralınabilir olur). Kimlik pass-through:
//                --kimlik ya da --pid'den varsayılan kimlik; ikisi de yoksa RED (betik sahibi
//                TAHMİN ETMEZ — kiraBirak yalnız sahip bırakır).
//   kira-yenile  heartbeat (kiraYenile modülde VAR — 'desteklenmiyor' raporu gerekmedi).
//                --pid <N> varsayılan kimliği türetir, --kimlik ile aşılır.
//   brief        briefUret çıktısını stdout'a birebir yazar (kira yolu kiraYoluCoz'dan — env
//                farkında; devir gerekince ajan bunu okur). Hiçbir dosyaya yazmaz.
//
// TAVAN ölçüm kaynağı: env ORDU_DEVIR_TAVAN_DOSYA; yoksa kira dosyasının kardeşi (üretimde
// core/data/devir-tavan.json). Dosya YOKSA tavan kapısı ölçümsüz geçer (tavandan:null — dürüst
// 'okunamadı'; pilot-0'da ölçüm hattı henüz kurulmamış olabilir) — fail-closed tavan yalnız
// KURULMUŞ kaynağın bozuk/alan-eksik/değer-aşımında RED'ler (devir-tavan.mjs kuralı aynen).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEVIR_SINIFLARI, kiraAl, kiraBirak, kiraDurum, kiraYenile, kiraYoluCoz, zincirKontrol } from './devir-kira.mjs';
import { tavanDosyadanOku } from './devir-tavan.mjs';
import { briefUret } from './devir-brief.mjs';

// --- yardımcılar --------------------------------------------------------------------

// pidCanliMi AYNASI: devir-kira.mjs'teki işlev ÖZELDIR (görev sınırı — mevcut dosya değiştirilemez,
// dışa açılamaz); burada aynı sema sinyal-0 yoklamasıyla tutulur: ESRCH = süreç yok (ölüm kanıtı
// tamam), EPERM/başka hata = canlı (kanıt yoksa devir yok — fail-closed). Sapma riski testle bağlanır.
function pidCanliMi(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return !(e && e.code === 'ESRCH'); }
}

// --pid değer çözümü: pozitif tamsayı (0/negatif/kesirli/dizge → RED). --pid bayrağının YOKLUĞU
// ayrı kırmızıdır (pidCoz'a değmeden argCoz red vermez — zorunluluk burada zorlanır).
function pidCoz(ham) {
  if (ham === undefined) throw new Error('RED: --pid zorunlu (üretimde nöbet ajanı Paseo daemon pid\'ini geçirir)');
  const n = Number(ham);
  if (!Number.isInteger(n) || n <= 0) throw new Error('RED: --pid pozitif tamsayı olmak zorunda: ' + String(ham));
  return n;
}

// --anahtar değer çiftleri: bilinmeyen/tekrarlı/değersiz anahtar RED (sessiz yok sayma yok);
// '--' ile başlayan değer sonraki anahtarın yutulması sayılır → RED.
function argCoz(kalan) {
  const cikti = {};
  for (let i = 0; i < kalan.length; i++) {
    const a = kalan[i];
    if (!a.startsWith('--')) throw new Error('RED: anahtar bekleniyordu (--anahtar değer): ' + String(a));
    const ad = a.slice(2);
    if (!ad) throw new Error('RED: boş anahtar');
    if (cikti[ad] !== undefined) throw new Error('RED: tekrarlı anahtar: ' + a);
    const deger = kalan[i + 1];
    if (deger === undefined) throw new Error('RED: ' + a + ' bir değer ister');
    if (String(deger).startsWith('--')) throw new Error('RED: ' + a + ' değeri -- ile başlayamaz (anahtar karışması): ' + String(deger));
    cikti[ad] = deger;
    i++;
  }
  return cikti;
}

// Tavan ölçüm dosyası yolu: env önce, yoksa kira kardeşi (kardeş seçimi hermetik testi de tmp'ye
// bağlar — betik gerçek core/data'ya okuma DIŞINDA hiçbir şekilde dokunmaz).
export function tavanYoluCoz(kiraYolu = kiraYoluCoz()) {
  return process.env.ORDU_DEVIR_TAVAN_DOSYA || join(dirname(kiraYolu), 'devir-tavan.json');
}

// Varsayılan kimlik: betik nöbet ajanı adına koşar — 'nobet-ajan-<pid>' (deterministik, sır yok).
const varsayilanKimlik = (pid) => 'nobet-ajan-' + pid;

// --- durum (salt-okur — YAZMA/LOG YOK) ------------------------------------------------

// DURUM HESAPLA: kira etiketi (kiraDurum SSOT — tazelik/bozuk/yok) + pid canlılığı + zincir
// kapısı (echo doluluğu + ardışık-devir insan kapısı, zincirKontrol) + tavan kapısı (ölçüm
// dosyası varsa tavanDosyadanOku). Çıkış sözleşmesi: RED(1) > devir-gerekmez(0) > devir-gerekli(2).
export function durumHesapla(kiraYolu = kiraYoluCoz()) {
  const kd = kiraDurum(kiraYolu);
  // pid: kiraDurum pid taşımaz (modül API'si tazelik odaklı) ama şemayı ZATEN doğruladı —
  // dosyadan yalnız pid alanı bir kez okunur (ikinci şema parseri YAZILMAZ; SSOT bozulmaz).
  // Okuma yarışı (kiraDurum ile bu okuma arası dosya değişimi) → pid null → fail-closed yorum:
  // kanıt yoksa sahibi CANLI sayılır, devir açılmaz.
  let pid = null;
  if (!kd.yok && !kd.bozuk) {
    try {
      const ham = JSON.parse(readFileSync(kiraYolu, 'utf8').replace(/^﻿/, ''));
      if (Number.isInteger(ham.pid)) pid = ham.pid;
    } catch { /* yarış — pid null kalır, dürüst */ }
  }
  const pidCanli = pid === null ? null : pidCanliMi(pid);
  const kira = kd.yok ? 'yok'
    : kd.bozuk ? 'bozuk'
    : kd.taze ? 'taze'
    : kd.durum === 'birakildi' ? 'birakildi'
    : pidCanli === false ? 'bayat-olu'
    : 'bayat-canli';
  const redler = [];
  if (kira === 'bozuk') redler.push('kira-bozuk-devir-RED');
  let zincir = null;
  try {
    zincir = zincirKontrol(kiraYolu);
    if (zincir && !zincir.ok) redler.push(zincir.sebep);
  } catch (e) { redler.push('zincir-okunamadi-RED: ' + String((e && e.message) || e)); }
  let tavandan = null;
  const tYolu = tavanYoluCoz(kiraYolu);
  if (existsSync(tYolu)) {
    try {
      tavandan = tavanDosyadanOku(tYolu);
      if (tavandan && !tavandan.ok) redler.push(...tavandan.redler);
    } catch (e) { redler.push('tavan-okunamadi-RED: ' + String((e && e.message) || e)); }
  }
  const rapor = {
    kira,
    sahibi: kd.kimlik || null,
    sinif: kd.devirSinifi || null,
    pidCanli,
    ardisikDevir: zincir ? zincir.ardisikDevir : null,
    tavandan,
    zamanISO: new Date().toISOString(),
  };
  if (redler.length > 0) { rapor.red = redler.join('; '); rapor.karar = 'RED'; return { cikis: 1, rapor }; }
  if (kira === 'taze' || kira === 'bayat-canli') { rapor.karar = 'devir-gerekmez'; return { cikis: 0, rapor }; }
  rapor.karar = 'devir-gerekli';   // yok | bayat-olu | birakildi
  return { cikis: 2, rapor };
}

// --- kira alt komut sarmalayıcıları ---------------------------------------------------

// kira-al: sinif doğrulaması betik tarafında da zorlanır (temiz RED JSON'u — stack değil);
// kiraAl zaten ikinci kez doğrular (fail-closed katmanlaşma).
function kiraAlAlt(a) {
  if (a.sinif === undefined) throw new Error('RED: --sinif zorunlu (operator|nobet — nöbet ajanı nobet taşır)');
  if (!DEVIR_SINIFLARI.includes(a.sinif)) throw new Error('RED: --sinif yalnız operator|nobet olabilir: ' + String(a.sinif));
  const pid = pidCoz(a.pid);
  const kimlik = a.kimlik !== undefined ? a.kimlik : varsayilanKimlik(pid);
  return kiraAl(kiraYoluCoz(), { kimlik, pid, devirSinifi: a.sinif });
}

// kira-birak: kimlik ya açık gelir ya --pid'den türetilir; betik sahibi ASLA tahmin etmez.
function kiraBirakAlt(a) {
  let kimlik = a.kimlik;
  if (kimlik === undefined && a.pid !== undefined) kimlik = varsayilanKimlik(pidCoz(a.pid));
  if (kimlik === undefined) throw new Error('RED: --kimlik zorunlu (--pid verilirse varsayılan kimlik de çözülür)');
  return kiraBirak(kiraYoluCoz(), kimlik);
}

// kira-yenile: kiraYenile modülde VAR (heartbeat K0057) — dürüst 'desteklenmiyor' raporu gerekmedi.
// --pid yalnız varsayılan kimliği türetir (modül kuralı: yenilemede pid yoklaması YOK — sahip
// kendini tazeliyor; ölüm kanıtı DEVİR yolunda, kiraAl içinde zorlanır).
function kiraYenileAlt(a) {
  let kimlik = a.kimlik;
  if (kimlik === undefined && a.pid !== undefined) kimlik = varsayilanKimlik(pidCoz(a.pid));
  if (kimlik === undefined) throw new Error('RED: --pid ya da --kimlik zorunlu (kimlik çözülemedi)');
  return kiraYenile(kiraYoluCoz(), kimlik);
}

// --- CLI (ana modül koruması devir-brief.mjs deseni) ----------------------------------

// kira-* sonuç JSON'u: {ok, sebep, kira} aynen taşınır (SSOT — betik yeniden yorumlamaz);
// ok:false → çıkış 1 (ajan tek satır RED raporu verir, YAZMAZ).
function sonucYaz(sonuc) {
  process.stdout.write(JSON.stringify(sonuc) + '\n');
  process.exitCode = sonuc && sonuc.ok === true ? 0 : 1;
}

function main() {
  const [alt, ...kalan] = process.argv.slice(2);
  try {
    if (alt === 'durum') {
      const { cikis, rapor } = durumHesapla();
      process.stdout.write(JSON.stringify(rapor) + '\n');
      process.exitCode = cikis;
      return;
    }
    if (alt === 'kira-al') { sonucYaz(kiraAlAlt(argCoz(kalan))); return; }
    if (alt === 'kira-birak') { sonucYaz(kiraBirakAlt(argCoz(kalan))); return; }
    if (alt === 'kira-yenile') { sonucYaz(kiraYenileAlt(argCoz(kalan))); return; }
    if (alt === 'brief') {
      const a = argCoz(kalan);
      process.stdout.write(briefUret({ handoffYolu: a.handoff, kiraYolu: kiraYoluCoz() }));
      return;
    }
    throw new Error('RED: alt komut zorunlu: durum | kira-al | kira-birak | kira-yenile | brief' +
      (alt !== undefined ? ' (bilinmeyen: ' + alt + ')' : ''));
  } catch (e) {
    process.stdout.write(JSON.stringify({ ok: false, red: String((e && e.message) || e) }) + '\n');
    process.exitCode = 1;
  }
}

const anaModul = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (anaModul) main();
