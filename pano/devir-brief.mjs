// OTODEV-1 PARÇA 2 — ARDIL (DEVRALAN) BREF ÜRETİCİ (kaynak: plans/OTODEV-OTOMATIK-DEVIR-PLANI-2026-11-01.md, EK-3 4 öğe): devralan nöbet ajanının tek giriş metni; fail-closed — izinli iş sınıfı DAR (salt-okur tarama + rapor + [insan] kuyruk hazırlama; commit/push YASAK), tüm [insan] kapıları BEKLER, gizli değer (PANO_TOKEN vb.) brief'e ASLA yazılmaz.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VARSAYILAN_KIRA_YOLU } from './devir-kira.mjs';

export const VARSAYILAN_KOK = join(import.meta.dirname, '..');

// --- EK-3 brief üreticisi (4 öğe + echo borcu 3 soru + [insan] kapı listesi) -----------

// Bölümler: 1) HEDEF 2) ÇIKTI FORMATI 3) ARAÇ/KAYNAK 4) GÖREV SINIRI + ECHO BORCU.
// Kira yolu varsayılanı devir-kira.mjs'ten gelir (tek SSOT — iki modul iki yol yazmaz).
// handoffYolu verilmediyse dürüst not: tek dosya sabitlenmedi, zincir en son HANDOFF-*.md'den seçilir.
export function briefUret({ proje = 'ordu', handoffYolu = null, kiraYolu = VARSAYILAN_KIRA_YOLU } = {}) {
  const handoffSatiri = typeof handoffYolu === 'string' && handoffYolu.trim()
    ? handoffYolu
    : 'plans/handoff/ içinde en son HANDOFF-*.md (nöbet zinciri seçer — bu üretimde tek dosya sabitlenmedi)';
  return [
    '# DEVRİR BREFİ — ' + proje + ' (OTODEV-1)',
    '',
    'Devralınan işi SÜRDÜR. Sözleşme: plans/OTODEV-OTOMATIK-DEVIR-PLANI-2026-11-01.md. Kapalı olmayan her durumda DUR ve rapora dürüst yaz — tahminle kapatma.',
    '',
    '## 1) HEDEF',
    'Devralınan işi sürdür. İzinli iş sınıfı YALNIZ:',
    '- salt-okur tarama',
    '- rapor yazımı',
    '- [insan] karar kuyruğu hazırlama',
    'Commit/push YASAK — tek elden operatörde kalır.',
    '',
    '## 2) ÇIKTI FORMATI',
    '- Yer: raporlar/devir/<YYYY-AA-GG>/OZET.md + yanına OZET.json (aynı içerik, makine-okur).',
    '- Raporun İLK 3 SATIRI echo cevaplarıdır (aşağıdaki 3 sorunun cevabı, değiştirilmeden).',
    '',
    '## 3) ARAÇ/KAYNAK',
    '- Handoff: ' + handoffSatiri,
    '- STATE_BOARD.md (repo kökü) — güncel durum + [insan] kuyruğu',
    '- CODEMAP.md (yapı SSOT) · DERSLER.md (tuzak defteri)',
    '- Yasak-liste: scripts/yasak-liste.json — ASLA commite girmemesi gereken dosya desenleri',
    '',
    '## 4) GÖREV SINIRI',
    'Aşama aşama ilerle; kapsam büyütme YOK. [insan] KAPILARI — hepsi fail-closed BEKLER, devralan ajan YAPAMAZ:',
    '- canlı sunucu restart (4377/4930)',
    '- süreç kill',
    '- izin onayı',
    '- git push',
    '- kilitli sürüm plugin/ dokunma (v0.23)',
    "- GRAF SSOT'ya onaysız yazma",
    'headless claude -p YASAK — devir yalnız Paseo spawn yolu (koruma zinciri bypass olur).',
    'PANO_TOKEN devralana verilmez — elinde yok, istenmez.',
    '',
    '## ECHO BORCU — 3 SORU (DOSYADAN doğrulanarak cevaplanır; tahmin YASAK)',
    '1. Kirli kayıt sayısı? (git status --short satır sayısı)',
    '2. Son commit hash? (git log -1)',
    "3. Bekleyen ilk onay? (STATE_BOARD 'bekler' satırından ilk madde)",
    '',
    'Kira (devir kilidi): ' + kiraYolu + ' — kiraDurum ile bak; kira TAZE ise sessiz çık (0 yazma).',
  ].join('\n') + '\n';
}

// --- echo ölçümü (--olc; DI: calistir — hermetik testte fixture ile enjekte edilir) ----

// Gerçek komut çalıştırıcı: spawnSync senkron (stderr hata olarak taşınır). Yalnız SALT-OKUR
// git komutları (status/log) — canlı sunuculara ve dosyalara DOKUNMAZ.
function gercekCalistir(komut, arglar, kok) {
  const r = spawnSync(komut, arglar, { cwd: kok, encoding: 'utf8' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(komut + ' exit ' + r.status + ' — ' + String(r.stderr || '').trim());
  return r.stdout;
}

// STATE_BOARD 'bekler' satırından ilk madde: '·'/':'/'—' ile ayrılan parçalardan 'bekler'
// içleyen İLK parça (en dar madde). Bulunamazsa/parse edilemezse 'olcum-hata' (dürüst).
function beklerIlkMadde(metin) {
  try {
    const satir = metin.split('\n').find((s) => s.includes('bekler'));
    if (!satir) return 'olcum-hata';
    const parcalar = satir.split(/[·:—]/).map((p) => p.replace(/\*/g, '').trim()).filter(Boolean);
    const madde = parcalar.find((p) => p.includes('bekler'));
    return madde || 'olcum-hata';
  } catch {
    return 'olcum-hata';
  }
}

// ECHO 3 sorunun ölçülmüş cevabı (tahmin YOK — damga saati ölçülür kuralı): ölçülemeyen
// soru 'olcum-hata' kalır; boş ölçüm dürüsttür (0 kirli kayıt = ölçüldü, hata değil).
export function olc({ calistir = gercekCalistir, kok = VARSAYILAN_KOK } = {}) {
  const sonuc = { kirliSayisi: 'olcum-hata', sonCommit: 'olcum-hata', ilkOnay: 'olcum-hata' };
  try {
    const cikti = String(calistir('git', ['status', '--short'], kok) || '');
    sonuc.kirliSayisi = cikti.trim() ? cikti.split('\n').filter((s) => s.trim()).length : 0;
  } catch { /* dürüst: olcum-hata kalır */ }
  try {
    const h = String(calistir('git', ['log', '-1', '--format=%h'], kok) || '').trim();
    sonuc.sonCommit = h || 'olcum-hata';
  } catch { /* dürüst */ }
  try {
    sonuc.ilkOnay = beklerIlkMadde(readFileSync(join(kok, 'STATE_BOARD.md'), 'utf8'));
  } catch { /* dürüst */ }
  return sonuc;
}

// --- CLI: node pano/devir-brief.mjs --olc --------------------------------------------

const anaModul = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (anaModul && process.argv.includes('--olc')) {
  const r = olc();
  console.log('ECHO ÖLÇÜMÜ — devir-brief --olc (ölçüldü, tahmin değil):');
  console.log('1) Kirli kayıt sayısı: ' + r.kirliSayisi);
  console.log('2) Son commit: ' + r.sonCommit);
  console.log('3) Bekleyen ilk onay: ' + r.ilkOnay);
}
