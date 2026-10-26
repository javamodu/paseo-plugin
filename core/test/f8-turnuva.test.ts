// F8 ARASTIRMA TURNUVASI (plan §21) — HERMETIK KIRILIM SINAVI. Her protokol kapisinin
// ADIYLA kirmizisi + tam mutlu yol (5 katilimci iki tur — K12-01 "bes bagimsiz model
// iki tur; ilk cevaplar bagimsiz; tum surumler + review kayitli"). K13-02 senaryo A
// KOMPOZIT kosumu ayri dosyada (k13-senaryo-a.test.ts) — burada yalniz protokol.
// Ajan uzlasmasi dogruluk kaniti DEGILDIR; ajan katmani simulasyondur (kimlik duzeyi).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openTurnuva, type Turnuva } from '../src/turnuva.ts';

const RUBRIC = { surum: 'r1', kriterler: [
  { id: 'dogruluk', ad: 'kaynaklar iddialari tasiyor mu' },
  { id: 'kapsam', ad: 'brief kapsaniyor mu' },
] };
const KAYNAK_EVRENI = ['K-0001', 'K-0002', 'K-0003', 'K-0004', 'K-0005'];
const KATILIMCILAR = [
  { provider: 'codex', model: 'kimi-K3' },
  { provider: 'codex', model: 'gpt-5.4' },
  { provider: 'codex', model: 'glm-5.3' },
  { provider: 'glm53u-codex', model: 'glm-5.3' },
  { provider: 'codefast', model: 'kimi-K3' }, // kompozit kimlik (canli spawn ayri tur)
].map((k) => ({ ...k }));
const KIMLIKLER = KATILIMCILAR.map((k) => k.provider + '/' + k.model);

const yeniDosya = () => join(mkdtempSync(join(tmpdir(), 'ordu-f8-')), 'turnuva.jsonl');
const yeniTurnuva = (path = yeniDosya()): Turnuva =>
  openTurnuva(path, { turnuvaId: 't-' + Math.random().toString(36).slice(2, 8), rubric: RUBRIC, katilimcilar: KATILIMCILAR, kaynakEvreni: KAYNAK_EVRENI });

const cevap = (kimlik: string, no: number) => ({
  round: 1 as const, katilimci: kimlik, kayitTip: 'cevap' as const,
  icerik: 'I: iddia ' + no + '\nK: kanit K-000' + no, brief: 'brief-' + no, kaynaklar: ['K-000' + no],
});
const revizyon = (kimlik: string, no: number) => ({
  round: 2 as const, katilimci: kimlik, kayitTip: 'revizyon' as const,
  icerik: 'I: duzeltilmis iddia ' + no + '\nK: kanit K-000' + no, brief: 'brief-' + no + '-v2', kaynaklar: ['K-000' + no],
});
const reviewGovdesi = (hedef: string) => ({
  olcutPuanlari: { dogruluk: 4, kapsam: 3 },
  gerekce: 'kaynak zinciri tasiyor', kanitRef: 'K-0001',
  kritikItiraz: 'orneklem kucuk', kapatmaDeneyi: 'tekrar olcum', belirsizlik: 'tek bolge',
  round: 1 as const, hedefKatilimci: hedef, hedefSurumNo: 1,
});

// 5 katilimci x (diger 4) capraz review — herkes herkesi review ETMEZ (capraz min:
// her katilimci en az bir review ALIR; tam capraz = 5x4 = 20). Tam capraz kosuyoruz.
function tamCaprazReview(t: Turnuva, round: 1 | 2, hedefSurumNo: number) {
  for (const reviewer of KIMLIKLER) {
    for (const hedef of KIMLIKLER) {
      if (reviewer === hedef) continue;
      t.reviewKaydet({ ...reviewGovdesi(hedef), reviewer, round, hedefSurumNo });
    }
  }
}

test('F8 mutlu yol: 5 bagimsiz model iki tur — bagimsiz ilk cevaplar, tum surumler + review kayitli, bagimsiz PASS ile basari', () => {
  const path = yeniDosya();
  const t = yeniTurnuva(path);

  // ADIM 1+2: bes BAGIMSIZ ilk cevap (review acilmadan)
  for (let i = 0; i < KIMLIKLER.length; i++) {
    const s = t.surumKaydet({ ...cevap(KIMLIKLER[i], i + 1), runtime: 'node/llm-' + (i + 1) });
    assert.equal(s.kayitTip, 'cevap');
    assert.equal(s.roundId, t.turnuvaId + '|r1', 'round kimligi turnuvaya bagli (round != attempt)');
  }
  // ADIM 3: on-kontrol (temiz surumler)
  for (const k of KIMLIKLER) assert.deepEqual(t.onKontrol({ katilimci: k, surumNo: 1 }), []);
  // ADIM 4: tam capraz review (20 kayit — SABIT v1 surumleri)
  tamCaprazReview(t, 1, 1);
  // ADIM 5: her katilimci KENDI revizyonunu uretir
  for (let i = 0; i < KIMLIKLER.length; i++) {
    const s = t.surumKaydet(revizyon(KIMLIKLER[i], i + 1));
    assert.equal(s.kayitTip, 'revizyon');
    assert.equal(s.oncekiSurumNo, 1);
  }
  // ADIM 6: round 2 capraz review (ayni rubric surumuyle — yeniden degerlendirme)
  tamCaprazReview(t, 2, 2);
  for (const k of KIMLIKLER) t.onKontrol({ katilimci: k, surumNo: 2 });
  // ADIM 7: sentez + bagimsiz son inceleme (katilimci OLMAYAN degerlendiren)
  t.sentezKaydet({ icerik: 'SENTEZ: 5 modelin duzeltilmis bulgulari birlesti' });
  t.bagimsizDegerlendirme({ degerlendiren: 'insan:gozlemci', verdict: 'PASS', gerekce: 'kaynak zinciri + capraz teyit tamam' });
  const b = t.basari();
  assert.equal(b.basari, true, JSON.stringify(b.engeller));

  // K12-01: TUM SURUMLER + REVIEW KAYITLI (sorgulanabilir)
  const d = t.durumu();
  assert.equal(d.surumler.length, 10, '5 katilimci x 2 tur = 10 surum kaydi');
  assert.equal(d.reviews.length, 40, '2 tur x 20 capraz review = 40 kayit');
  assert.ok(d.surumler.every((s) => /^[0-9a-f]{64}$/.test(s.icerikHash)), 'her surumun icerik karmasi var');
  // kalicilik: DOSYADAN DIRILME — tum kayitlar jsonl uzerinde
  const disk = readFileSync(path, 'utf8').split('\n').filter((l) => l.trim() !== '');
  assert.equal(disk.length, 1 + 5 + 5 + 20 + 5 + 20 + 5 + 1 + 1, 'acilis + ilk cevaplar + onkontroller + 20 capraz review + revizyonlar + 20 yeniden review + onkontroller + sentez + degerlendirme (append-only tam zincir)');
});

test('F8 adim 1 kirmizisi: ilk review acildiktan sonra YENI ilk-cevap RED (bagimsiz uretim penceresi kapanir)', () => {
  const t = yeniTurnuva();
  for (let i = 0; i < 5; i++) t.surumKaydet(cevap(KIMLIKLER[i], i + 1));
  t.reviewKaydet({ ...reviewGovdesi(KIMLIKLER[1]), reviewer: KIMLIKLER[0] });
  // review acildi → bagimsiz uretim penceresi KAPALI: yeni ilk-cevap kaydi RED.
  // (gate sirasi: pencere kontrolu cakismadan ONCE — mesaj pencere kapanisini soyler)
  assert.throws(() => t.surumKaydet(cevap(KIMLIKLER[0], 9)), /bagimsiz uretim penceresi kapali/);
});

test('F8 adim 4 kirmizilari: cevaplar tam degilken review RED / kendi kendini review RED / eksik alan RED / kriter-disi + puan disi RED', () => {
  const t = yeniTurnuva();
  t.surumKaydet(cevap(KIMLIKLER[0], 1));
  // (a) round 1 cevaplari TAM DEGIL → review acilamaz (SABIT surumler kesilmedi)
  assert.throws(() => t.reviewKaydet({ ...reviewGovdesi(KIMLIKLER[0]), reviewer: KIMLIKLER[1] }), /cevaplari tamamlanmadi/);
  for (let i = 1; i < 5; i++) t.surumKaydet(cevap(KIMLIKLER[i], i + 1));
  // (b) reviewer == hedef → CAPRAZ DEGIL
  assert.throws(() => t.reviewKaydet({ ...reviewGovdesi(KIMLIKLER[0]), reviewer: KIMLIKLER[0] }), /kendi cevabini review edemez/);
  // (c) alti alandan biri bos → eksik-alan
  assert.throws(() => t.reviewKaydet({ ...reviewGovdesi(KIMLIKLER[0]), reviewer: KIMLIKLER[1], belirsizlik: '' }), /review alani zorunlu: belirsizlik/);
  assert.throws(() => t.reviewKaydet({ ...reviewGovdesi(KIMLIKLER[0]), reviewer: KIMLIKLER[1], kritikItiraz: '' }), /kritikItiraz/);
  assert.throws(() => t.reviewKaydet({ ...reviewGovdesi(KIMLIKLER[0]), reviewer: KIMLIKLER[1], kapatmaDeneyi: '' }), /kapatmaDeneyi/);
  // (d) rubricte olmayan kriter → kriter-disi; eksik kriter → eksik-alan; puan aralik disi
  assert.throws(() => t.reviewKaydet({ ...reviewGovdesi(KIMLIKLER[0]), reviewer: KIMLIKLER[1], olcutPuanlari: { dogruluk: 4, kapsam: 3, tarafsizlik: 5 } }), /rubricte olmayan kriter/);
  assert.throws(() => t.reviewKaydet({ ...reviewGovdesi(KIMLIKLER[0]), reviewer: KIMLIKLER[1], olcutPuanlari: { dogruluk: 4 } }), /her rubric kriteri puanlanmali/);
  assert.throws(() => t.reviewKaydet({ ...reviewGovdesi(KIMLIKLER[0]), reviewer: KIMLIKLER[1], olcutPuanlari: { dogruluk: 9, kapsam: 3 } }), /1-5 arasi tam sayi/);
  // (e) ayni rubric surumuyle ikinci review → cakisma
  t.reviewKaydet({ ...reviewGovdesi(KIMLIKLER[0]), reviewer: KIMLIKLER[1] });
  assert.throws(() => t.reviewKaydet({ ...reviewGovdesi(KIMLIKLER[0]), reviewer: KIMLIKLER[1] }), /ayni rubric surumuyle review zaten kayitli/);
});

test('F8 adim 5 kirmizilari: review acilmadan revizyon RED / baskasinin surumune revizyon RED / revizyon cakismasi', () => {
  const t = yeniTurnuva();
  for (let i = 0; i < 5; i++) t.surumKaydet(cevap(KIMLIKLER[i], i + 1));
  // (a) capraz review acilmadan revizyon dogmaz (adim sirasi 4 -> 5)
  assert.throws(() => t.surumKaydet(revizyon(KIMLIKLER[0], 1)), /adim sirasi 4 -> 5/);
  t.reviewKaydet({ ...reviewGovdesi(KIMLIKLER[0]), reviewer: KIMLIKLER[1] });
  // (b) revizyon yalniz KENDI cevabindan dogar: katilimci DISI kimlik RED
  assert.throws(() => t.surumKaydet({ ...revizyon(KIMLIKLER[0], 1), katilimci: 'codex/baskasi' }), /katilimci degil/);
  // (c) revizyon cakismasi: ikinci revizyon RED
  t.surumKaydet(revizyon(KIMLIKLER[0], 1));
  assert.throws(() => t.surumKaydet(revizyon(KIMLIKLER[0], 2)), /revizyonu zaten kayitli/);
  // (d) cevapsiz katilimcinin revizyonu RED (v1 zinciri olmadan revizyon dogmaz —
  // gate sirasi: revizyon-onsuz kontrolu review-erken'den ONCE, reviewsiz durumda da kanitlanir)
  const t2 = yeniTurnuva();
  for (let i = 1; i < 5; i++) t2.surumKaydet(cevap(KIMLIKLER[i], i + 1));
  assert.throws(() => t2.surumKaydet(revizyon(KIMLIKLER[0], 1)), /ilk cevabi yok/);
});

test('F8 adim 3 on-kontrol: eksik-alan / uydurma-kaynak / kanitsiz-iddia bayraklari ADIYLA dogar', () => {
  const t = yeniTurnuva();
  t.surumKaydet({ round: 1, katilimci: KIMLIKLER[0], kayitTip: 'cevap', icerik: 'I: iddia A\nI: iddia B', brief: 'b', kaynaklar: ['K-YOK'] });
  t.surumKaydet({ round: 1, katilimci: KIMLIKLER[1], kayitTip: 'cevap', icerik: 'I: iddia C\nK: kanit', brief: 'b', kaynaklar: [] });
  const b1 = t.onKontrol({ katilimci: KIMLIKLER[0], surumNo: 1 });
  assert.ok(b1.some((x) => x.kod === 'uydurma-kaynak'), 'evren disi kaynak isaretlendi');
  assert.ok(b1.some((x) => x.kod === 'kanitsiz-iddia'), '2 iddiaya 1 kanit — kanitsiz iddia isaretlendi');
  const b2 = t.onKontrol({ katilimci: KIMLIKLER[1], surumNo: 1 });
  assert.ok(b2.some((x) => x.kod === 'eksik-alan'), 'bos brief + bos kaynaklar isaretlendi');
  // on-kontrol kayitli olmayan surume RED
  assert.throws(() => t.onKontrol({ katilimci: KIMLIKLER[2], surumNo: 1 }), /on-kontrol hedefi kayitli degil/);
});

test('F8 adim 7 kirmizilari: sentez oncesi kapilar + bagimsizlik + PASS zorunlulugu', () => {
  const t = yeniTurnuva();
  // (a) revizyonlar tamamlanmadan sentez RED
  for (let i = 0; i < 5; i++) t.surumKaydet(cevap(KIMLIKLER[i], i + 1));
  assert.throws(() => t.sentezKaydet({ icerik: 'erken sentez' }), /revizyonu .* yok/);
  // (b) on-kontrol bayragi tasiyan son surum senteze GIREMEZ
  t.reviewKaydet({ ...reviewGovdesi(KIMLIKLER[0]), reviewer: KIMLIKLER[1] });
  t.surumKaydet({ ...revizyon(KIMLIKLER[0], 1), kaynaklar: ['K-YOK'] }); // uydurma kaynak tasiyacak
  for (let i = 1; i < 5; i++) t.surumKaydet(revizyon(KIMLIKLER[i], i + 1));
  t.onKontrol({ katilimci: KIMLIKLER[0], surumNo: 2 }); // bayrak: uydurma-kaynak
  for (let i = 1; i < 5; i++) t.onKontrol({ katilimci: KIMLIKLER[i], surumNo: 2 });
  assert.throws(() => t.sentezKaydet({ icerik: 'bayrakli sentez' }), /senteze GIREMEZ/);
  // (c) capraz review almayan katilimci varsa sentez RED (KIMLIKLER[1..4] review aldi mi? sadece 0 aldi)
  const t2 = yeniTurnuva();
  for (let i = 0; i < 5; i++) t2.surumKaydet(cevap(KIMLIKLER[i], i + 1));
  t2.reviewKaydet({ ...reviewGovdesi(KIMLIKLER[0]), reviewer: KIMLIKLER[1] });
  for (let i = 0; i < 5; i++) t2.surumKaydet(revizyon(KIMLIKLER[i], i + 1));
  for (let i = 0; i < 5; i++) t2.onKontrol({ katilimci: KIMLIKLER[i], surumNo: 2 });
  assert.throws(() => t2.sentezKaydet({ icerik: 'eksik review sentezi' }), /capraz review almayan katilimci/);
  // (d) degerlendirme sentezden once RED; katilimci degerlendiren RED; PASS olmadan basari RED
  assert.throws(() => t2.bagimsizDegerlendirme({ degerlendiren: 'insan:gozlemci', verdict: 'PASS', gerekce: 'g' }), /sentezden once/);
  // (c) durumunu duzelt: her katilimci en az bir capraz review ALSIN → sentez kesilir
  // (hedef 0 zaten review aldi — 1..4 icin yeni ciftler)
  for (let i = 1; i < 5; i++) t2.reviewKaydet({ ...reviewGovdesi(KIMLIKLER[i]), reviewer: KIMLIKLER[(i + 1) % 5] });
  t2.sentezKaydet({ icerik: 'SENTEZ' });
  assert.throws(() => t2.bagimsizDegerlendirme({ degerlendiren: KIMLIKLER[0], verdict: 'PASS', gerekce: 'g' }), /DISARIDAN gelir/);
  t2.bagimsizDegerlendirme({ degerlendiren: 'insan:gozlemci', verdict: 'FAIL', gerekce: 'kanit zayif' });
  assert.equal(t2.basari().basari, false, 'bagimsiz inceleme FAIL → basari YOK');
  assert.ok(t2.basari().engeller.some((e) => e.includes('FAIL')), 'engellerde FAIL görünür');
});

test('F8 K12-02: rubric degisikligi → eski degerlendirme BARI KAPATIR; yeniden degerlendirme acar', () => {
  // 2 katilimcili MINI turnuva (rubric degisikligi bacaklarini izole sinar)
  const path = yeniDosya();
  const t = openTurnuva(path, { turnuvaId: 't-k1202', rubric: RUBRIC, katilimcilar: KATILIMCILAR.slice(0, 2), kaynakEvreni: KAYNAK_EVRENI });
  const k0 = KIMLIKLER[0], k1 = KIMLIKLER[1];
  t.surumKaydet({ ...cevap(k0, 1), katilimci: k0 });
  t.surumKaydet({ ...cevap(k1, 2), katilimci: k1 });
  t.onKontrol({ katilimci: k0, surumNo: 1 });
  t.onKontrol({ katilimci: k1, surumNo: 1 });
  t.reviewKaydet({ ...reviewGovdesi(k0), reviewer: k1 });
  t.reviewKaydet({ ...reviewGovdesi(k1), reviewer: k0 });
  t.surumKaydet({ ...revizyon(k0, 1), katilimci: k0 });
  t.surumKaydet({ ...revizyon(k1, 2), katilimci: k1 });
  t.onKontrol({ katilimci: k0, surumNo: 2 });
  t.onKontrol({ katilimci: k1, surumNo: 2 });
  t.reviewKaydet({ ...reviewGovdesi(k0), reviewer: k1, round: 2, hedefSurumNo: 2 });
  t.reviewKaydet({ ...reviewGovdesi(k1), reviewer: k0, round: 2, hedefSurumNo: 2 });
  t.sentezKaydet({ icerik: 'SENTEZ r1' });
  t.bagimsizDegerlendirme({ degerlendiren: 'insan:gozlemci', verdict: 'PASS', gerekce: 'r1 uzerinden tamam' });
  assert.equal(t.basari().basari, true, 'r1 ile basari kapali');

  // RUBRIC DEGISIKLIGI (K12-02): yeni kriter eklendi → surum r2
  t.rubricGuncelle({ surum: 'r2', kriterler: [...RUBRIC.kriterler, { id: 'tekrarlanabilirlik', ad: 'tekrar olcum' }] });
  const kapali = t.basari();
  assert.equal(kapali.basari, false, 'rubric degisti — eski degerlendirme SINAMAZ');
  assert.ok(kapali.engeller.some((e) => e.includes('rubric surumu degisti')), 'K12-02 engeli görünür: ' + kapali.engeller.join(';'));
  assert.ok(kapali.engeller.some((e) => e.includes('guncellenmeyen reviewlar')), 'bayat reviewlar engel listesinde');
  // eski surumle yeni review RED degil — YENIDEN DEGERLENDIRME kaydi dogar (farkli rubric surumu)
  const yeniReview = t.reviewKaydet({ ...reviewGovdesi(k0), reviewer: k1, round: 2, hedefSurumNo: 2, olcutPuanlari: { dogruluk: 4, kapsam: 3, tekrarlanabilirlik: 4 } });
  assert.equal(yeniReview.rubricSurum, 'r2', 'yeniden degerlendirme kaydi guncel rubric surumunu tasir');
  t.reviewKaydet({ ...reviewGovdesi(k1), reviewer: k0, round: 2, hedefSurumNo: 2, olcutPuanlari: { dogruluk: 4, kapsam: 3, tekrarlanabilirlik: 5 } });
  t.bagimsizDegerlendirme({ degerlendiren: 'insan:gozlemci', verdict: 'PASS', gerekce: 'r2 uzerinden yeniden tamam' });
  const acik = t.basari();
  assert.equal(acik.basari, true, 'guncel rubric surumuyle yeniden degerlendirme basariyi acar: ' + acik.engeller.join(';'));
  // sentezden SONRA rubric degisikligi DOGAR (K12-02 mekanizmasi) — bar yeniden acilir
  t.rubricGuncelle({ surum: 'r3', kriterler: RUBRIC.kriterler });
  assert.equal(t.basari().basari, false, 'r3 degisikligi bari yeniden acti (yeniden degerlendirme zorunlu)');
  // ayni surumle ikinci rubric kaydi RED (birebir tekrar degisiklik degil)
  assert.throws(() => t.rubricGuncelle({ surum: 'r3', kriterler: RUBRIC.kriterler }), /FARKLI olmali/);
  // kalicilik: eski review kayitlari HALA diskte (append-only — gecmis silinmez)
  const d = t.durumu();
  assert.ok(d.reviews.some((r) => r.rubricSurum === 'r1'), 'eski rubricli review kaydi korunur');
  assert.ok(d.sonReviewlar.filter((r) => r.round === 2).every((r) => r.rubricSurum === 'r2'), 'SON TUR reviewlari guncel rubric surumuyle (round 1 tarihtir)');
});

test('F8 acilis kapislari: katilimci sayisi/cift kimlik/rubric gecersiz/turnuvaId cakismasi', () => {
  const path = yeniDosya();
  const gecerli = { turnuvaId: 't-cift', rubric: RUBRIC, katilimcilar: KATILIMCILAR };
  openTurnuva(path, gecerli);
  assert.throws(() => openTurnuva(path, gecerli), /turnuvaId zaten kayitli/);
  assert.throws(() => openTurnuva(yeniDosya(), { turnuvaId: 't-tek', rubric: RUBRIC, katilimcilar: [KATILIMCILAR[0]] }), /en az 2 katilimci/);
  assert.throws(() => openTurnuva(yeniDosya(), { turnuvaId: 't-ciftk', rubric: RUBRIC, katilimcilar: [...KATILIMCILAR.slice(0, 2), KATILIMCILAR[0]] }), /TEKIL olmali/);
  assert.throws(() => openTurnuva(yeniDosya(), { turnuvaId: 't-rub0', rubric: { surum: 'r1', kriterler: [] }, katilimcilar: KATILIMCILAR }), /en az bir kriter/);
  assert.throws(() => openTurnuva(yeniDosya(), { turnuvaId: 't-rubc', rubric: { surum: 'r1', kriterler: [{ id: 'a', ad: 'x' }, { id: 'a', ad: 'y' }] }, katilimcilar: KATILIMCILAR }), /tekil olmali/);
});

test('F8 kalicilik: dosyadan dirilme — ayni turnuva YENI nesneden acilir, durum birebir korunur', () => {
  const path = yeniDosya();
  const t1 = openTurnuva(path, { turnuvaId: 't-diril', rubric: RUBRIC, katilimcilar: KATILIMCILAR.slice(0, 2), kaynakEvreni: KAYNAK_EVRENI });
  const k0 = KIMLIKLER[0], k1 = KIMLIKLER[1];
  t1.surumKaydet({ ...cevap(k0, 1), katilimci: k0 });
  t1.surumKaydet({ ...cevap(k1, 2), katilimci: k1 });
  t1.reviewKaydet({ ...reviewGovdesi(k0), reviewer: k1 });
  t1.reviewKaydet({ ...reviewGovdesi(k1), reviewer: k0 });
  t1.surumKaydet({ ...revizyon(k0, 1), katilimci: k0 });
  // AYNI turnuvaId ile ikinci acilis RED (cakisma) — dirilme ARACI ayri:
  assert.throws(() => openTurnuva(path, { turnuvaId: 't-diril', rubric: RUBRIC, katilimcilar: KATILIMCILAR.slice(0, 2) }), /zaten kayitli/);
  // durum, dosyadan okunan yeni nesne uzerinden sorgulanabilir (durumu() dosyadan okur)
  const d = t1.durumu();
  assert.equal(d.surumler.length, 3, 'kayitlar diskte — okuma dosyadan (nesne bellekte durum TASIMAZ)');
  assert.equal(d.reviews.length, 2);
});
