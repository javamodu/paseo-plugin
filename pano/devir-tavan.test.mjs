// OTODEV-1 A1 TESTİ — pano/devir-tavan.mjs (devir tavanları kodda). Hermetik: saf fonksiyon
// + temp fixture; ağ/sunucu/canlı süreç YOK. Kapsam: 3+1 tavan · CPU eşiği %85 (sentez koşul 3;
// >= karşılaştırması) · 429 geri çekilme · istek/dk tavanı ~20 (sentez) · tanımsız/geçersiz
// sayı RED (varsayılan uydurma YOK) · env override + geçersiz env ATILIR · dosyadan okuma
// bacağı (integration).
// KOŞUM: node --test pano/devir-tavan.test.mjs (×2 bağımsız koşulabilir).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tavanKontrol, tavanDosyadanOku } from './devir-tavan.mjs';

const tempKok = () => mkdtempSync(join(tmpdir(), 'otodev-tavan-'));

test('t1: tavan altı OK — 4 eşzamanlı ajan (3+1) + cpu 84 + 429x1 + istek 20/dk', () => {
  const r = tavanKontrol({ eszamanliAjan: 4, cpuYuzde: 84, hata429Son10dk: 1, istekDk: 20 });
  assert.equal(r.ok, true);
  assert.deepEqual(r.redler, []);
});

test('t2: 5 eşzamanlı ajan → tavan-eszamanli-RED (tavan 3+1=4)', () => {
  const r = tavanKontrol({ eszamanliAjan: 5, cpuYuzde: 50, hata429Son10dk: 0, istekDk: 20 });
  assert.equal(r.ok, false);
  assert.deepEqual(r.redler, ['tavan-eszamanli-RED']);
});

test('t3: CPU eşiği %85 — 84 OK / 84.9 OK / 85 RED (>= karşılaştırması)', () => {
  assert.equal(tavanKontrol({ eszamanliAjan: 1, cpuYuzde: 84, hata429Son10dk: 0, istekDk: 20 }).ok, true);
  assert.equal(tavanKontrol({ eszamanliAjan: 1, cpuYuzde: 84.9, hata429Son10dk: 0, istekDk: 20 }).ok, true);
  const r = tavanKontrol({ eszamanliAjan: 1, cpuYuzde: 85, hata429Son10dk: 0, istekDk: 20 });
  assert.equal(r.ok, false);
  assert.deepEqual(r.redler, ['cpu-esik-RED']);
});

test('t4: 429 geri çekilme — 1 OK / 2 RED / 3 RED', () => {
  assert.equal(tavanKontrol({ eszamanliAjan: 1, cpuYuzde: 50, hata429Son10dk: 1, istekDk: 20 }).ok, true);
  assert.deepEqual(tavanKontrol({ eszamanliAjan: 1, cpuYuzde: 50, hata429Son10dk: 2, istekDk: 20 }).redler, ['429-geri-cekilme-RED']);
  assert.deepEqual(tavanKontrol({ eszamanliAjan: 1, cpuYuzde: 50, hata429Son10dk: 3, istekDk: 20 }).redler, ['429-geri-cekilme-RED']);
});

test('t5: sayı YOK/tanımsız/tipi hatalı → RED fail-closed (varsayılan uydurma YOK)', () => {
  const bos = tavanKontrol({});
  assert.equal(bos.ok, false);
  assert.deepEqual(bos.redler, [
    'eszamanliAjan-gecersiz-RED', 'cpuYuzde-gecersiz-RED', 'hata429Son10dk-gecersiz-RED',
    'istekDk-gecersiz-RED',
  ]);
  assert.deepEqual(
    tavanKontrol({ eszamanliAjan: undefined, cpuYuzde: 50, hata429Son10dk: 0, istekDk: 20 }).redler,
    ['eszamanliAjan-gecersiz-RED'],
  );
  assert.deepEqual(
    tavanKontrol({ eszamanliAjan: '5', cpuYuzde: 50, hata429Son10dk: 0, istekDk: 20 }).redler, // dizge sayı DEĞİL
    ['eszamanliAjan-gecersiz-RED'],
  );
  assert.deepEqual(
    tavanKontrol({ eszamanliAjan: null, cpuYuzde: NaN, hata429Son10dk: 0, istekDk: 20 }).redler,
    ['eszamanliAjan-gecersiz-RED', 'cpuYuzde-gecersiz-RED'],
  );
});

test('t6: çoklu RED bir arada — dört tavan RED\'i aynı anda döner', () => {
  const r = tavanKontrol({ eszamanliAjan: 6, cpuYuzde: 95, hata429Son10dk: 3, istekDk: 40 });
  assert.equal(r.ok, false);
  assert.deepEqual(r.redler, ['tavan-eszamanli-RED', 'cpu-esik-RED', '429-geri-cekilme-RED', 'istek-dk-tavan-RED']);
});

test('t7: env override — ORDU_DEVIR_TAVAN=2 → 3 ajan RED, 2 ajan OK', () => {
  process.env.ORDU_DEVIR_TAVAN = '2';
  try {
    assert.deepEqual(
      tavanKontrol({ eszamanliAjan: 3, cpuYuzde: 50, hata429Son10dk: 0, istekDk: 20 }).redler,
      ['tavan-eszamanli-RED'],
    );
    assert.equal(tavanKontrol({ eszamanliAjan: 2, cpuYuzde: 50, hata429Son10dk: 0, istekDk: 20 }).ok, true);
  } finally {
    delete process.env.ORDU_DEVIR_TAVAN;
  }
});

test('t8: geçersiz env ATILIR — sessiz varsayılana düşme YOK (fail-closed)', () => {
  process.env.ORDU_DEVIR_CPU = 'yuzde-doksan';
  try {
    assert.throws(() => tavanKontrol({ eszamanliAjan: 1, cpuYuzde: 50, hata429Son10dk: 0, istekDk: 20 }), /ORDU_DEVIR_CPU/);
  } finally {
    delete process.env.ORDU_DEVIR_CPU;
  }
});

test('t9: dosyadan okuma bacağı — fixture OK / dosya yok RED / bozuk RED / alan eksik RED', () => {
  const d = tempKok();
  const yol = join(d, 'tavan-durum.json');
  writeFileSync(yol, JSON.stringify({ eszamanliAjan: 4, cpuYuzde: 84, hata429Son10dk: 1, istekDk: 20 }));
  const ok = tavanDosyadanOku(yol);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.redler, []);
  assert.deepEqual(tavanDosyadanOku(join(d, 'yok.json')).redler, ['durum-dosyasi-yok-RED']);
  writeFileSync(yol, '{bozuk');
  assert.deepEqual(tavanDosyadanOku(yol).redler, ['durum-dosyasi-bozuk-RED']);
  writeFileSync(yol, JSON.stringify({ eszamanliAjan: 4 })); // alan eksik → gecersiz-RED taşınır
  const eksik = tavanDosyadanOku(yol);
  assert.equal(eksik.ok, false);
  assert.deepEqual(eksik.redler, ['cpuYuzde-gecersiz-RED', 'hata429Son10dk-gecersiz-RED', 'istekDk-gecersiz-RED']);
  rmSync(d, { recursive: true, force: true });
});

test('t10: istek/dk tavanı ~20 — 20 OK / 21 RED / 20.5 RED / env ORDU_DEVIR_ISTEK=5 → 6 RED', () => {
  assert.equal(tavanKontrol({ eszamanliAjan: 1, cpuYuzde: 50, hata429Son10dk: 0, istekDk: 20 }).ok, true);
  assert.deepEqual(tavanKontrol({ eszamanliAjan: 1, cpuYuzde: 50, hata429Son10dk: 0, istekDk: 21 }).redler, ['istek-dk-tavan-RED']);
  assert.deepEqual(tavanKontrol({ eszamanliAjan: 1, cpuYuzde: 50, hata429Son10dk: 0, istekDk: 20.5 }).redler, ['istek-dk-tavan-RED']);
  process.env.ORDU_DEVIR_ISTEK = '5';
  try {
    assert.deepEqual(tavanKontrol({ eszamanliAjan: 1, cpuYuzde: 50, hata429Son10dk: 0, istekDk: 6 }).redler, ['istek-dk-tavan-RED']);
    assert.equal(tavanKontrol({ eszamanliAjan: 1, cpuYuzde: 50, hata429Son10dk: 0, istekDk: 5 }).ok, true);
  } finally {
    delete process.env.ORDU_DEVIR_ISTEK;
  }
});
