// D-3 OZ YAZIM CEKIRDEGI TESTI — pano/graf-yaz.mjs.
// Gercek SSOT baglantisi: plans/gorev-grafigi-2026-10-26.json SALT-OKUNUR (v7: hash before/after degismez).
// KOSUM: node --test pano/graf-yaz.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atamaTaslakla, onayla } from './graf-yonetim.js';
import { atamaOku, atamaYaz, atamaDurum } from './graf-yaz.mjs';

const KOK = dirname(fileURLToPath(import.meta.url));
const SSOT_YOL = join(KOK, '..', 'plans', 'gorev-grafigi-2026-10-26.json');
const h = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const tempKok = () => mkdtempSync(join(tmpdir(), 'd3-atama-'));
const kayitUret = (gorevId, ajanId, surum) => {
  const t = atamaTaslakla(gorevId, ajanId, surum > 1 ? { gorevId, ajanId: 'ORDU-ESKI', surum: surum - 1, onay: 'ONAYLI' } : null, 'insan:web', '2026-10-30T15:40:00.000Z');
  return onayla(t, 'insan:web');
};

test('v1: TASLAK kayit diske inemez — fail-closed', () => {
  const d = tempKok();
  const t = atamaTaslakla('S5', 'ORDU-1', null, 'insan:web', '2026-10-30T15:40:00.000Z');
  assert.throws(() => atamaYaz(t, join(d, 'atamalar.jsonl')), /yalniz ONAYLI/);
  rmSync(d, { recursive: true, force: true });
});

test('v2: ONAYLI kayit iner + geri okunur birebir', () => {
  const d = tempKok();
  const yol = join(d, 'atamalar.jsonl');
  const k = kayitUret('S5', 'ORDU-1', 1);
  const r = atamaYaz(k, yol);
  assert.equal(r.yazildi, true);
  const { kayitlar, bozuk } = atamaOku(yol);
  assert.equal(bozuk, 0);
  assert.deepEqual(kayitlar[0], k);
  rmSync(d, { recursive: true, force: true });
});

test('v3: append-only — ikinci kayit eskisini BOZMAZ', () => {
  const d = tempKok();
  const yol = join(d, 'atamalar.jsonl');
  const k1 = kayitUret('S5', 'ORDU-1', 1);
  atamaYaz(k1, yol);
  const ilk = readFileSync(yol, 'utf8');
  atamaYaz(kayitUret('A4', 'ORDU-3', 1), yol);
  const son = readFileSync(yol, 'utf8');
  assert.ok(son.startsWith(ilk));
  assert.equal(son.split('\n').filter(Boolean).length, 2);
  rmSync(d, { recursive: true, force: true });
});

test('v4: idempotans — ayni gorev+surum ikinci kez yazilmaz', () => {
  const d = tempKok();
  const yol = join(d, 'atamalar.jsonl');
  const k = kayitUret('S5', 'ORDU-1', 1);
  const r1 = atamaYaz(k, yol);
  const r2 = atamaYaz(k, yol);
  assert.equal(r2.yazildi, false);
  assert.equal(r2.mevcut, true);
  assert.equal(atamaOku(yol).kayitlar.length, 1);
  rmSync(d, { recursive: true, force: true });
});

test('v5: ajan aktoru onaylayamaz — insan kapisi cekirdekten RED (entegrasyon)', () => {
  const d = tempKok();
  const yol = join(d, 'atamalar.jsonl');
  const t = atamaTaslakla('S5', 'ORDU-1', null, 'insan:web', '2026-10-30T15:40:00.000Z');
  assert.throws(() => onayla(t, 'ajan:llm'), /yetkisiz-onayci/);
  assert.throws(() => atamaYaz({ ...t, onay: 'ONAYLI', onaylayan: 'ajan:llm' }, yol), /onaylayan yalniz/);
  assert.equal(existsYok(yol), true);
  rmSync(d, { recursive: true, force: true });
});

test('v6: atamaDurum — buyuk surum kazanir, harita dogru doner', () => {
  const d = tempKok();
  const yol = join(d, 'atamalar.jsonl');
  atamaYaz(kayitUret('S5', 'ORDU-1', 1), yol);
  atamaYaz(kayitUret('S5', 'ORDU-3', 2), yol);
  const dmr = atamaDurum(yol);
  assert.equal(dmr.harita['S5'].ajanId, 'ORDU-3');
  assert.equal(dmr.harita['S5'].surum, 2);
  assert.equal(dmr.bozuk, 0);
  rmSync(d, { recursive: true, force: true });
});

test('v7: GERCEK SSOT ile calisir + graf dosyasi SALT-OKUNUR kalir (hash before/after)', () => {
  const d = tempKok();
  const yol = join(d, 'atamalar.jsonl');
  const ssot = JSON.parse(readFileSync(SSOT_YOL, 'utf8'));
  const gorevler = ssot.gorevler || ssot.gorev;
  const list = Array.isArray(gorevler) ? gorevler : Object.values(gorevler);
  const hedef = list.find((g) => g.id === 'S5');
  assert.ok(hedef, 'SSOT gorev S5 bulunmali');
  const once = h(SSOT_YOL);
  const k = onayla(atamaTaslakla(hedef.id, 'ORDU-1', null, 'insan:web', '2026-10-30T15:41:00.000Z'), 'insan:web');
  const r = atamaYaz(k, yol);
  assert.equal(r.yazildi, true);
  assert.equal(atamaDurum(yol).harita[hedef.id].ajanId, 'ORDU-1');
  assert.equal(h(SSOT_YOL), once, 'graf SSOT degismemeli (yazim deftere iner, graf dosyasina dokunmaz)');
  rmSync(d, { recursive: true, force: true });
});

function existsYok(p) {
  try { readFileSync(p); return false; } catch { return true; }
}
