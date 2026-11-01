// SK-1 ORDU-4 — DEVİR ÖLÇÜM DEFTERİ (kaynak: plans/SORUN-KAPATMA-3AJAN-PLANI-2026-11-01.md §ORDU-4
// madde 2 + raporlar/otodev-pilot-0-2026-11-01/ARA-DURUM.md 'ÖLÇÜM SAHİPLİĞİ' katman 1 — mekanik
// rollup, LLM'siz). Kayıt = tamamlanmış bir devir: {damgaISO, sureSn, echoDoluluk, handoffDosya,
// zincir, kaynak} — append-only JSONL + fsync (core/src/spawn-olcum.ts deseni: crash'te yarım
// satır yalnız SON satır olabilir); bozuk satır atlanır + sayılır (sessiz yutma yok). Defter
// ÜRETİM DEFTERİDİR — commit edilmez; İLK YAZIMDA DOĞAR (SK-1'de pilot-0 run3 seed'iyle doğdu).
// Ölçüsüz alan sayı göstermez: boş defter → n:0 + medyanSn:null (ölçülmedi ≠ sıfır).
//
// ALT KOMUTLAR (node pano/devir-olcum.mjs <alt>):
//   kayit  --sure-sn <N> --echo <3/3> --handoff <yol> --zincir <önceki handoff yolu>
//          --kaynak <ölçümün kalıcı diski yolu>: bir devir ölçümü yazar. --kaynak ZORUNLU —
//          kaynağızsız ölçüm uydurmadır (RED). İDEMPOTAN: aynı handoffDosya zaten kayıtlıysa
//          yeni satır YAZILMAZ ({ok:true, sebep:'zaten-kayitli', kayit:<mevcut>}) — bir handoff
//          bir kez ölçülür; koşum-yeniden-dene sınıfı kaydı çoğaltamaz. damgaISO koşum anından
//          ölçülür (seed istisna: geçmiş devrin kapanış damgası taşınır).
//   ozet   {n, medyanSn, bozuk}: n geçerli kayıt sayısı · medyanSn sureSn medyanı (çift n'de
//          ortanca ikilisinin ortalaması) · bozuk = parse edilemeyen + şema-dışı satır sayısı.
//          Defter yoksa/boşsa n:0 + medyanSn:null — ölçüsüz alan sayı GÖSTERMEZ.
//   seed   pilot-0 run3 İLK KAYIT, kaynak-etiketli: devir 248sn (4dk08sn; kira-al
//          2026-11-01T14:37:59.172Z → kira-birak 2026-11-01T14:42:07.064Z = 247.892sn —
//          core/data/devir-kira.json + kira-log'dan ölçüldü; 248 kaynak raporun yuvarlaması),
//          echo 3/3, handoff 1741, zincir 1658'e bağlı. damgaISO = devrin KAPANIŞ anı (kira-birak)
//          — seed anı değil: kayıt geçmiş devri belgeler. İDEMPOTAN — tekrar koşum çoğaltmaz.
import { appendFileSync, closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Üretim defteri module-göreli sabit (spawn-olcum.ts KANIT_DEFTERI_YOLU deseni — cwd'den
// bağımsız deterministik); env ORDU_DEVIR_OLCUM_DEFTERI önce — testler tmp'ye bağlar
// (kiraYoluCoz deseni; env kabuktan sızmaz, koşum öncesi temizlenir).
export const DEVIR_OLCUM_DEFTERI_YOLU = fileURLToPath(new URL('../core/data/devir-olcum.jsonl', import.meta.url));

export function defterYoluCoz() {
  return process.env.ORDU_DEVIR_OLCUM_DEFTERI || DEVIR_OLCUM_DEFTERI_YOLU;
}

// --- kayıt şeması -----------------------------------------------------------------------

// Kayıt şeması: 6 alanın tamamı + biçimleri (damgaISO geçerli ISO; sureSn pozitif sonlu sayı;
// dizge alanları dolu). Şema-dışı satır defterde BOZUK sayılır — medyana GİRMEZ, sayaca girer
// (sessiz yutma yok; dürüst bozuk raporu).
function kayitGecerliMi(h) {
  return !!h && typeof h === 'object' && !Array.isArray(h) &&
    typeof h.damgaISO === 'string' && Number.isFinite(Date.parse(h.damgaISO)) &&
    Number.isFinite(h.sureSn) && h.sureSn > 0 &&
    typeof h.echoDoluluk === 'string' && !!h.echoDoluluk.trim() &&
    typeof h.handoffDosya === 'string' && !!h.handoffDosya.trim() &&
    typeof h.zincir === 'string' && !!h.zincir.trim() &&
    typeof h.kaynak === 'string' && !!h.kaynak.trim();
}

// Kayıt girdisi doğrulaması (yazma ÖNCESİ — geçmeyen çağrı defter DOĞURAMAZ): sureSn pozitif
// sonlu sayı; dizge alanları zorunlu + boş olamaz; damgaISO verilirse geçerli ISO (verilmezse
// koşum anı ölçülür).
function kayitDogrula(k) {
  if (k.sureSn === undefined || !Number.isFinite(k.sureSn) || k.sureSn <= 0) {
    throw new Error('RED: sureSn pozitif sayı olmak zorunda: ' + String(k.sureSn));
  }
  for (const ad of ['echoDoluluk', 'handoffDosya', 'zincir', 'kaynak']) {
    if (typeof k[ad] !== 'string' || !k[ad].trim()) throw new Error('RED: ' + ad + ' zorunlu (boş olamaz)');
  }
  if (k.damgaISO !== undefined && (typeof k.damgaISO !== 'string' || !Number.isFinite(Date.parse(k.damgaISO)))) {
    throw new Error('RED: damgaISO geçerli ISO-8601 olmak zorunda: ' + String(k.damgaISO));
  }
}

// Defter oku: dosya yok → boş (ölçülmedi — null yüzleriyle dürüst); bozuk/şema-dışı satır
// atlanır + sayılır. Olay konumu kararlıdır (append-only) — bozuk satırın yeri asla kaymaz.
export function defterOku(defterYolu = defterYoluCoz()) {
  if (!existsSync(defterYolu)) return { kayitlar: [], bozuk: 0 };
  const satirlar = readFileSync(defterYolu, 'utf8').replace(/^﻿/, '').split('\n').filter((s) => s.trim());
  const kayitlar = [];
  let bozuk = 0;
  for (const s of satirlar) {
    let h = null;
    try { h = JSON.parse(s); } catch { bozuk++; continue; }
    if (kayitGecerliMi(h)) kayitlar.push(h); else bozuk++;
  }
  return { kayitlar, bozuk };
}

// --- yazma + özet -----------------------------------------------------------------------

// Kayıt EKLE (append-only + fsync; dizin ilk yazımda doğar). İDEMPOTAN: aynı handoffDosya zaten
// kayıtlıysa YENİ SATIR YAZILMAZ — mevcut kayıt dürüstçe döner (sessiz ezme yok). damgaISO
// verilirse o damga yazılır (yalnız seed — geçmiş devri belgeleme); yoksa şimdi ölçülür.
export function devirOlcumKaydet(defterYolu = defterYoluCoz(), k = {}) {
  kayitDogrula(k);
  const { kayitlar } = defterOku(defterYolu);
  const varOlan = kayitlar.find((r) => r.handoffDosya === k.handoffDosya);
  if (varOlan) return { ok: true, sebep: 'zaten-kayitli', kayit: varOlan };
  const kayit = {
    damgaISO: k.damgaISO !== undefined ? k.damgaISO : new Date().toISOString(),
    sureSn: k.sureSn,
    echoDoluluk: k.echoDoluluk,
    handoffDosya: k.handoffDosya,
    zincir: k.zincir,
    kaynak: k.kaynak,
  };
  mkdirSync(dirname(defterYolu), { recursive: true });
  const fd = openSync(defterYolu, 'a');
  try { appendFileSync(fd, JSON.stringify(kayit) + '\n'); fsyncSync(fd); } finally { closeSync(fd); }
  return { ok: true, sebep: 'kaydedildi', kayit };
}

// ÖZET: n + medyan + bozuk. Medyan çift n'de ortanca ikilisinin ortalamasıdır. n:0 → medyanSn
// null — ölçüsüz alan sayı göstermez (uydurma ölçüm uydurma eşik doğurur; K-0058 taslağı
// medyan ≥5 kayıtta eşik bağlar — tek-örnek gürültüsü süzülmeden eşik yok).
export function ozetHesapla(defterYolu = defterYoluCoz()) {
  const { kayitlar, bozuk } = defterOku(defterYolu);
  const sureler = kayitlar.map((r) => r.sureSn).sort((a, b) => a - b);
  let medyanSn = null;
  if (sureler.length > 0) {
    const ort = Math.floor(sureler.length / 2);
    medyanSn = sureler.length % 2 === 1 ? sureler[ort] : (sureler[ort - 1] + sureler[ort]) / 2;
  }
  return { n: kayitlar.length, medyanSn, bozuk };
}

// --- pilot-0 seed -----------------------------------------------------------------------

// Pilot-0 run3 (2026-11-01, İLK OTOMATİK DEVRİM) — uydurma YOK: süre kira dosyasından ölçüldü
// (kira-al 14:37:59.172Z → kira-birak 14:42:07.064Z = 247.892sn; rapor 4dk08sn ≈ 248sn
// yuvarlaması), echo 3/3 + zincir 1658 + handoff 1741 diskteki dosyadan, tablo kaynağı pilot-0
// hasat raporu. damgaISO = devrin kapanış anı (kira-birak) — kayıt geçmiş devri belgeler,
// seed anını değil.
export const PILOT_0_RUN_3 = Object.freeze({
  damgaISO: '2026-11-01T14:42:07.064Z',
  sureSn: 248,
  echoDoluluk: '3/3',
  handoffDosya: 'plans/handoff/HANDOFF-2026-11-01-1741.md',
  zincir: 'plans/handoff/HANDOFF-2026-11-01-1658.md',
  kaynak: 'raporlar/otodev-pilot-0-2026-11-01/OZET.md',
});

export function pilotSeed(defterYolu = defterYoluCoz()) {
  return devirOlcumKaydet(defterYolu, { ...PILOT_0_RUN_3 });
}

// --- CLI (nobet.mjs deseni: RED JSON + exit kodu) ---------------------------------------

// --anahtar değer çiftleri: bilinmeyen/tekrarlı/değersiz anahtar RED (nobet.mjs argCoz aynası —
// sessiz yok sayma yok; '--' ile başlayan değer anahtar karışması sayılır → RED).
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

// kayit/seed sonuç JSON'u: {ok, sebep, kayit} aynen taşınır; ok:false → çıkış 1 (tek satır RED,
// stack değil). ozet düz JSON + exit 0 (boş defter hata DEĞİL — dürüst ölçülmedi raporu).
function sonucYaz(sonuc) {
  process.stdout.write(JSON.stringify(sonuc) + '\n');
  process.exitCode = sonuc && sonuc.ok === true ? 0 : 1;
}

function main() {
  const [alt, ...kalan] = process.argv.slice(2);
  try {
    if (alt === 'ozet') { process.stdout.write(JSON.stringify(ozetHesapla()) + '\n'); return; }
    if (alt === 'seed') { sonucYaz(pilotSeed()); return; }
    if (alt === 'kayit') {
      const a = argCoz(kalan);
      sonucYaz(devirOlcumKaydet(defterYoluCoz(), {
        sureSn: Number(a['sure-sn']),
        echoDoluluk: a.echo,
        handoffDosya: a.handoff,
        zincir: a.zincir,
        kaynak: a.kaynak,
      }));
      return;
    }
    throw new Error('RED: alt komut zorunlu: kayit | ozet | seed' +
      (alt !== undefined ? ' (bilinmeyen: ' + alt + ')' : ''));
  } catch (e) {
    process.stdout.write(JSON.stringify({ ok: false, red: String((e && e.message) || e) }) + '\n');
    process.exitCode = 1;
  }
}

const anaModul = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (anaModul) main();
