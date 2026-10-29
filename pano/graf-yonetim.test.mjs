// G9-ÇEKİRDEK DENAYI TESTI (KAPI K9) — pano/graf-yonetim.js saf cekirdegi.
// Gercek SSOT baglantisi: plans/gorev-grafigi-2026-10-26.json (salt-okur) — vaka 25-26.
// KOŞUM: node --test pano/graf-yonetim.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { izCoz, dokumanCoz, uygunluk, atanabilirler, atamaTaslakla, onayla, dizinKapsaminda } from './graf-yonetim.js';

const SSOT = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'plans', 'gorev-grafigi-2026-10-26.json'), 'utf8'));

// ---- izCoz (miras + daraltma-only) ----
test('v1: bos zincir RED — sistem tabani zorunlu', () => {
  assert.throws(() => izCoz([]), /bos/);
});
test('v2: komut daraltma OK — alt kume ustten kuculur', () => {
  const r = izCoz([
    { kapsam: 'sistem', izin: { komutlar: ['node', 'npm test', 'git add'], rate: 60 } },
    { kapsam: 'proje', izin: { komutlar: ['node', 'npm test'] } },
  ]);
  assert.deepEqual(r.komutlar, ['node', 'npm test']);
  assert.equal(r.rate, 60); // belirtilmeyen alan ustte kalir
});
test('v3: komut GENISLETME RED — ustte olmayan komut eklenemez', () => {
  assert.throws(() => izCoz([
    { kapsam: 'sistem', izin: { komutlar: ['node'] } },
    { kapsam: 'graf', izin: { komutlar: ['node', 'npm test'] } },
  ]), /genisletme-komut/);
});
test('v4: dizin daraltma OK — core/src core/ icinde', () => {
  const r = izCoz([
    { kapsam: 'sistem', izin: { dizin: ['core/', 'plans/'] } },
    { kapsam: 'gorev', izin: { dizin: ['core/src'] } },
  ]);
  assert.deepEqual(r.dizin, ['core/src']);
});
test('v5: dizin GENISLETME RED — izin disi yol eklenemez', () => {
  assert.throws(() => izCoz([
    { kapsam: 'sistem', izin: { dizin: ['plans/'] } },
    { kapsam: 'ajan', izin: { dizin: ['core/'] } },
  ]), /genisletme-dizin/);
});
test('v6: rate tavan buyuyemez — 60 ustu 100 RED', () => {
  assert.throws(() => izCoz([
    { kapsam: 'sistem', izin: { rate: 60 } },
    { kapsam: 'proje', izin: { rate: 100 } },
  ]), /genisletme-rate/);
});
test('v7: rate daraltma OK — 60 -> 20', () => {
  const r = izCoz([
    { kapsam: 'sistem', izin: { rate: 60 } },
    { kapsam: 'proje', izin: { rate: 20 } },
  ]);
  assert.equal(r.rate, 20);
});
test('v8: yetki GENISLETME RED — push yetkisi alttan acilamaz', () => {
  assert.throws(() => izCoz([
    { kapsam: 'sistem', izin: { yetki: ['yaz', 'test kos'] } },
    { kapsam: 'graf', izin: { yetki: ['yaz', 'push'] } },
  ]), /genisletme-yetki/);
});
test('v9: zincir sirasi bozuk RED — proje sonrasi sistem gelemez', () => {
  assert.throws(() => izCoz([
    { kapsam: 'proje', izin: { komutlar: ['node'] } },
    { kapsam: 'sistem', izin: { komutlar: ['node'] } },
  ]), /sirasi bozuk/);
});

// ---- dokumanCoz (kume + okuma sirasi + dar-kazanan) ----
test('v10: kume + sira — ANAYASA basta, sonra sistem->proje->graf', () => {
  const r = dokumanCoz({ sistem: ['AGENTS.md'], proje: ['tasarim.md'], graf: ['rol.md'] });
  assert.deepEqual(r.sira, ['ANAYASA.md', 'AGENTS.md', 'tasarim.md', 'rol.md']);
  assert.equal(r.cakisma.length, 0);
});
test('v11: cakisma — dar kapsam kazanir, cakisma listelenir', () => {
  const r = dokumanCoz({ sistem: ['rol.md'], graf: ['rol.md'] });
  assert.deepEqual(r.sira, ['ANAYASA.md', 'rol.md']);
  assert.equal(r.cakisma.length, 1);
  assert.equal(r.cakisma[0].kazanan, 'graf');
  assert.equal(r.cakisma[0].kaybeden, 'sistem');
});

// ---- uygunluk (atama metrigi + gerekce) ----
const GOREV_MTN = { id: 'DC-S0', rol: 'MANAGER+TESTER', dizin: 'core/ + raporlar/' };
const ajan = (ad, uzerine) => ({
  ad, durum: 'aktif', roller: ['MANAGER', 'TESTER'], dolu: 0,
  limit: { esZamanli: 2 }, izin: { dizin: ['core/', 'raporlar/'] }, ...uzerine,
});
test('v12: rol-eksik — MANAGER+TESTER gorevine tek MANAGER elenir', () => {
  const r = uygunluk(GOREV_MTN, ajan('ORNEK-tek', { roller: ['MANAGER'] }));
  assert.equal(r.uygun, false);
  assert.equal(r.elenen[0].neden, 'rol-eksik');
  assert.match(r.elenen[0].detay, /TESTER/);
});
test('v13: bilesik rol OK — MANAGER+TESTER tam karsilanir', () => {
  const r = uygunluk(GOREV_MTN, ajan('ORNEK-mt'));
  assert.equal(r.uygun, true);
  assert.equal(r.elenen.length, 0);
});
test('v14: dizin-yasak — gorev dizini ajan izninde degilse elenir', () => {
  const r = uygunluk(GOREV_MTN, ajan('ORNEK-dis', { izin: { dizin: ['plans/'] } }));
  assert.equal(r.uygun, false);
  assert.equal(r.elenen[0].neden, 'dizin-yasak');
});
test('v15: limit-dolu — esZamanli hak bitmis elenir', () => {
  const r = uygunluk(GOREV_MTN, ajan('ORNEK-dolu', { dolu: 2 }));
  assert.equal(r.uygun, false);
  assert.equal(r.elenen[0].neden, 'limit-dolu');
  assert.equal(r.elenen[0].detay, '2/2');
});
test('v16: pasif — dinlenen ajan elenir', () => {
  const r = uygunluk(GOREV_MTN, ajan('ORNEK-pasif', { durum: 'dinleniyor' }));
  assert.equal(r.uygun, false);
  assert.equal(r.elenen[0].neden, 'pasif');
});
test('v17: tam uygun — puan = kalan esZamanli hak', () => {
  const r = uygunluk(GOREV_MTN, ajan('ORNEK-bos', { dolu: 1 }));
  assert.equal(r.uygun, true);
  assert.equal(r.puan, 1);
});
test('v18: atanabilirler — uygunlar puana gore sirali + elenenler gerekceli', () => {
  const r = atanabilirler(GOREV_MTN, [
    ajan('ORNEK-dolu', { dolu: 2 }),
    ajan('ORNEK-mt'),          // puan 2
    ajan('ORNEK-yarim', { dolu: 1 }), // puan 1
  ]);
  assert.deepEqual(r.uygunlar.map((u) => u.ajan), ['ORNEK-mt', 'ORNEK-yarim']);
  assert.equal(r.elenenler.length, 1);
  assert.equal(r.elenenler[0].elenen[0].neden, 'limit-dolu');
});
test('v18b: dizin onek kurali — core/src core/ icinde, pano/ disinda', () => {
  assert.equal(dizinKapsaminda('core/src', ['core/']), true);
  assert.equal(dizinKapsaminda('pano/', ['core/']), false);
});

// ---- atamaTaslakla (versiyon + diff + actor) ----
test('v19: yeni atama — surum 1 + diff {eski:null, yeni:ajan}', () => {
  const t = atamaTaslakla('DC-S0', 'ORNEK-mt', null, 'insan:web', '2026-10-29T17:00:00');
  assert.equal(t.surum, 1);
  assert.deepEqual(t.diff, { alan: 'ajanId', eski: null, yeni: 'ORNEK-mt' });
  assert.equal(t.onay, 'TASLAK');
});
test('v20: surum artisi + degisim diffi — v2 ajan degisir', () => {
  const t = atamaTaslakla('DC-S0', 'ORNEK-yeni', { surum: 2, ajanId: 'ORNEK-eski' }, 'insan:web', '2026-10-29T17:05:00');
  assert.equal(t.surum, 3);
  assert.deepEqual(t.diff, { alan: 'ajanId', eski: 'ORNEK-eski', yeni: 'ORNEK-yeni' });
});
test('v21: ayni ajan yeniden — diff alan yok', () => {
  const t = atamaTaslakla('DC-S0', 'ORNEK-eski', { surum: 2, ajanId: 'ORNEK-eski' }, 'insan:web', '2026-10-29T17:06:00');
  assert.equal(t.diff.alan, 'yok');
});
test('v22: taslak actor insan:web DEGILSE RED — vekil/ajan acamaz', () => {
  assert.throws(() => atamaTaslakla('DC-S0', 'ORNEK-mt', null, 'vekil:g1', '2026-10-29T17:07:00'), /insan:web olmali/);
});
test('v23: tarih YOK ise RED — olcumsuz kayit yasak', () => {
  assert.throws(() => atamaTaslakla('DC-S0', 'ORNEK-mt', null, 'insan:web'), /tarih zorunlu/);
});

// ---- onayla (disiplin katmani) ----
const TASLAK = { gorevId: 'DC-S0', ajanId: 'ORNEK-mt', surum: 1, diff: { alan: 'ajanId', eski: null, yeni: 'ORNEK-mt' }, onay: 'TASLAK', acan: 'insan:web', tarih: '2026-10-29T17:10:00' };
test('v24: ai-manager onaylar — ONAYLI + onaylayan yazilir', () => {
  const o = onayla(TASLAK, 'ai-manager');
  assert.equal(o.onay, 'ONAYLI');
  assert.equal(o.onaylayan, 'ai-manager');
});
test('v25: vekil onayci RED — buyutemez', () => {
  assert.throws(() => onayla(TASLAK, 'vekil:g1'), /yetkisiz-onayci/);
});
test('v26: TASLAK olmayan kayit onaylanamaz — fail-closed', () => {
  assert.throws(() => onayla({ ...TASLAK, onay: 'ONAYLI' }, 'ai-manager'), /taslak-degil/);
});
test('v27: red GEREKCESIZ olmaz — ret zapsiz RED', () => {
  assert.throws(() => onayla(TASLAK, 'ai-manager', '  '), /red gerekcesiz/);
});
test('v28: gerekceli red — RED + retGerekce tasinir', () => {
  const o = onayla(TASLAK, 'ai-manager', 'ajan izin dizini gorev dizinini kapsamiyor');
  assert.equal(o.onay, 'RED');
  assert.equal(o.retGerekce, 'ajan izin dizini gorev dizinini kapsamiyor');
});

// ---- GERCEK SSOT baglantisi ----
test('v29: SSOT gercek veri — 40 gorev + DC-S0 kadro MANAGER+TESTER ile (dizin onyargisiz)', () => {
  assert.equal(SSOT.gorevler.length, 40);
  const gorev = SSOT.gorevler.find((g) => g.id === 'DC-S0');
  const mtAjan = ajan('ORNEK-mt-kadro', { roller: ['MANAGER', 'TESTER'], izin: { dizin: ['core/', 'raporlar/', 'ilgili politika/adaptor halkasi'] } });
  const r = uygunluk(gorev, mtAjan);
  assert.equal(r.uygun, true, 'DC-S0 (rol ' + gorev.rol + ') kadro MANAGER+TESTER ile atanabilir olmali');
});
test('v29b: SSOT BULGUSU — gorev.dizin serbest metin: yol-olmayan parca dizin-yasak dogurur', () => {
  const gorev = SSOT.gorevler.find((g) => g.id === 'DC-S0'); // 'core/ + ilgili politika/adaptor halkasi'
  const r = uygunluk(gorev, ajan('ORNEK-dar', { roller: ['MANAGER', 'TESTER'], izin: { dizin: ['core/'] } }));
  assert.equal(r.uygun, false, 'SSOT dizin alani yol degil — G9 yuzunde normalize/anlam eslenmesi gerek (denay bulgusu)');
  assert.equal(r.elenen[0].neden, 'dizin-yasak');
  assert.match(r.elenen[0].detay, /ilgili politika/);
});
test('v30: SSOT yetkiMatrisi — insanKarti yetkisi false (fail-closed tasinir)', () => {
  assert.equal(SSOT.yetkiMatrisi.insanKarti.yetki, false);
  assert.equal(SSOT.yetkiMatrisi.kapsam.otomatikOnay, false);
});
