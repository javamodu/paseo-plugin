// SK-1 ORDU-4 TESTİ — pano/devir-olcum.mjs (devir ölçüm defteri). Hermetik: defter tmp'ye
// bağlanır — fonksiyonlara AÇIK yol + CLI'da env ORDU_DEVIR_OLCUM_DEFTERI (koşum öncesi
// ORDU_DEVIR_* ailesi silinir, nobet.test.mjs deseni); GERÇEK core/data/devir-olcum.jsonl'ye
// DOKUNULMAZ. Kapsam: kayit şeması + doğrulama RED'leri (geçmeyen çağrı defter DOĞURAMAZ) ·
// append idempotansı (aynı handoff satır ÇOĞALTMAZ) · özet n/medyan (tek + 3'lü + 4'lü kümeler) ·
// bozuk satır atlanır + sayılır · boş/olmayan defter dürüst null · seed pilot-0 kaydı
// kaynak-etiketli + idempotent · CLI sözleşmesi (exit 0/1 + JSON yüzleri).
// KOŞUM: node --test pano/devir-olcum.test.mjs (×2 bağımsız koşulabilir).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { devirOlcumKaydet, ozetHesapla, pilotSeed, PILOT_0_RUN_3 } from './devir-olcum.mjs';

const KOK = dirname(fileURLToPath(import.meta.url));
const MODUL = join(KOK, 'devir-olcum.mjs');
const REPO = join(KOK, '..');

// CLI koşumu: ayrı süreç + temizlenmiş ORDU_DEVIR_* env'i (yalnız ORDU_DEVIR_OLCUM_DEFTERI
// fixture'a bağlanır — env kabuktan sızmaz, hermetik).
const olcumCli = (arglar, { defterYolu, ekEnv } = {}) => {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (k.startsWith('ORDU_DEVIR_')) delete env[k];
  env.ORDU_DEVIR_OLCUM_DEFTERI = defterYolu;
  Object.assign(env, ekEnv || {});
  return spawnSync(process.execPath, [MODUL, ...arglar], { cwd: REPO, encoding: 'utf8', env });
};

const json = (r) => JSON.parse(r.stdout);
const tempKok = () => mkdtempSync(join(tmpdir(), 'sk1-devir-olcum-'));
const defterYolu = (d) => join(d, 'devir-olcum.jsonl');
const satirlar = (yol) => readFileSync(yol, 'utf8').split('\n').filter((s) => s.trim()).map((s) => JSON.parse(s));

// Kayıt fixture'i: 4 zorunlu dizge + sureSn; --ust ile varyantlar türetilir.
const ornekKayit = (ust = {}) => ({
  sureSn: 120, echoDoluluk: '3/3',
  handoffDosya: 'plans/handoff/HANDOFF-2026-11-02-1000.md',
  zincir: 'plans/handoff/HANDOFF-2026-11-01-1741.md',
  kaynak: 'core/data/devir-kira.json-log.jsonl',
  ...ust,
});

test('o1: kayit — geçerli kayıt satır doğurur (6 alan; damgaISO koşum anından ISO); özet n=1 medyan=sureSn', () => {
  const d = tempKok();
  const yol = defterYolu(d);
  const r = devirOlcumKaydet(yol, ornekKayit({ sureSn: 120 }));
  assert.equal(r.ok, true);
  assert.equal(r.sebep, 'kaydedildi');
  const k = satirlar(yol);
  assert.equal(k.length, 1);
  assert.equal(k[0].sureSn, 120);
  assert.equal(k[0].echoDoluluk, '3/3');
  assert.equal(k[0].handoffDosya, 'plans/handoff/HANDOFF-2026-11-02-1000.md');
  assert.equal(k[0].kaynak, 'core/data/devir-kira.json-log.jsonl');
  assert.ok(Number.isFinite(Date.parse(k[0].damgaISO)), 'damgaISO ölçülmüş ISO olmalı');
  assert.deepEqual(ozetHesapla(yol), { n: 1, medyanSn: 120, bozuk: 0 });
  rmSync(d, { recursive: true, force: true });
});

test('o2: append idempotansı — aynı handoffDosya ikinci yazım satır ÇOĞALTMAZ; mevcut kayıt döner', () => {
  const d = tempKok();
  const yol = defterYolu(d);
  devirOlcumKaydet(yol, ornekKayit({ sureSn: 100 }));
  const r2 = devirOlcumKaydet(yol, ornekKayit({ sureSn: 999 })); // aynı handoff, farklı sureSn
  assert.equal(r2.ok, true);
  assert.equal(r2.sebep, 'zaten-kayitli');
  assert.equal(r2.kayit.sureSn, 100, 'mevcut kayıt döner — sessiz ezme yok');
  assert.equal(satirlar(yol).length, 1, 'bir handoff bir kez ölçülür');
  assert.deepEqual(ozetHesapla(yol), { n: 1, medyanSn: 100, bozuk: 0 });
  rmSync(d, { recursive: true, force: true });
});

test('o3: özet medyan — tek kayıt kendisi; 3 kayıt ortanca; 4 kayıt ortanca ikilisi ortalaması', () => {
  const d = tempKok();
  const yol = defterYolu(d);
  devirOlcumKaydet(yol, ornekKayit({ sureSn: 30 }));
  assert.equal(ozetHesapla(yol).medyanSn, 30);
  devirOlcumKaydet(yol, ornekKayit({ sureSn: 10, handoffDosya: 'plans/handoff/HANDOFF-2026-11-02-1001.md' }));
  devirOlcumKaydet(yol, ornekKayit({ sureSn: 20, handoffDosya: 'plans/handoff/HANDOFF-2026-11-02-1002.md' }));
  assert.equal(ozetHesapla(yol).medyanSn, 20, '[10,20,30] ortanca 20');
  devirOlcumKaydet(yol, ornekKayit({ sureSn: 40, handoffDosya: 'plans/handoff/HANDOFF-2026-11-02-1003.md' }));
  const o = ozetHesapla(yol);
  assert.equal(o.n, 4);
  assert.equal(o.medyanSn, 25, '[10,20,30,40] → (20+30)/2');
  rmSync(d, { recursive: true, force: true });
});

test('o4: bozuk satır atlanır + sayılır — parse-dışı VE şema-dışı (sureSn eksik) kayıt medyana girmez', () => {
  const d = tempKok();
  const yol = defterYolu(d);
  devirOlcumKaydet(yol, ornekKayit({ sureSn: 10 }));
  devirOlcumKaydet(yol, ornekKayit({ sureSn: 30, handoffDosya: 'plans/handoff/HANDOFF-2026-11-02-1001.md' }));
  // elle iki bozuk satır: biri JSON parse dışı, biri şema dışı (sureSn/kaynak yok)
  const icerik = readFileSync(yol, 'utf8');
  writeFileSync(yol, icerik + 'bu bir bozuk satır\n' + JSON.stringify({ damgaISO: '2026-11-02T10:00:00.000Z', echoDoluluk: '3/3' }) + '\n');
  const o = ozetHesapla(yol);
  assert.equal(o.n, 2, 'geçerli 2 kayıt ölçüde kalır');
  assert.equal(o.medyanSn, 20, '(10+30)/2');
  assert.equal(o.bozuk, 2, 'parse-dışı + şema-dışı dürüstçe sayılır — sessiz yutma yok');
  rmSync(d, { recursive: true, force: true });
});

test('o5: defter YOK → özet dürüst n:0 + medyanSn:null + bozuk:0 — ölçüsüz alan sayı GÖSTERMEZ; kayit sonrası doğar', () => {
  const d = tempKok();
  const yol = defterYolu(d);
  assert.equal(existsSync(yol), false);
  const o = ozetHesapla(yol);
  assert.deepEqual(o, { n: 0, medyanSn: null, bozuk: 0 });
  assert.notEqual(o.medyanSn, 0, 'null ≠ 0 — ölçülmedi, sıfır değil');
  devirOlcumKaydet(yol, ornekKayit());
  assert.equal(existsSync(yol), true, 'defter ilk yazımda doğar (dizin dahil)');
  rmSync(d, { recursive: true, force: true });
});

test('o6: kayit doğrulama RED — sureSn 0/-5/NaN/eksik/dizge, boş/eksik dizge alanı, bozuk damgaISO; defter DOĞMAZ', () => {
  const d = tempKok();
  const yol = defterYolu(d);
  for (const kotu of [0, -5, NaN, undefined, 'abc']) {
    assert.throws(() => devirOlcumKaydet(yol, ornekKayit({ sureSn: kotu })), /RED: sureSn/, 'sureSn=' + String(kotu));
  }
  for (const alan of ['echoDoluluk', 'handoffDosya', 'zincir', 'kaynak']) {
    assert.throws(() => devirOlcumKaydet(yol, ornekKayit({ [alan]: '' })), new RegExp('RED: ' + alan), alan + ' boş');
    assert.throws(() => devirOlcumKaydet(yol, ornekKayit({ [alan]: undefined })), new RegExp('RED: ' + alan), alan + ' eksik');
  }
  assert.throws(() => devirOlcumKaydet(yol, ornekKayit({ damgaISO: 'dun aksam' })), /RED: damgaISO/);
  assert.equal(existsSync(yol), false, 'geçmeyen çağrı defter doğuramaz');
  rmSync(d, { recursive: true, force: true });
});

test('o7: seed — pilot-0 run3 İLK kayıt kaynak-etiketli; damgaISO devir kapanış anı; idempotent', () => {
  const d = tempKok();
  const yol = defterYolu(d);
  const r1 = pilotSeed(yol);
  assert.equal(r1.sebep, 'kaydedildi');
  const k = satirlar(yol);
  assert.equal(k.length, 1);
  assert.equal(k[0].sureSn, 248, 'pilot-0 run3: 4dk08sn (kira-al 14:37:59.172Z → birak 14:42:07.064Z = 247.892sn)');
  assert.equal(k[0].sureSn, PILOT_0_RUN_3.sureSn);
  assert.equal(k[0].echoDoluluk, '3/3');
  assert.equal(k[0].handoffDosya, 'plans/handoff/HANDOFF-2026-11-01-1741.md');
  assert.equal(k[0].zincir, 'plans/handoff/HANDOFF-2026-11-01-1658.md');
  assert.equal(k[0].kaynak, 'raporlar/otodev-pilot-0-2026-11-01/OZET.md', 'kaynak alanı diski gösterir — uydurma ölçüm değil');
  assert.equal(k[0].damgaISO, '2026-11-01T14:42:07.064Z', 'damga devrin kapanış anı (kira-birak) — seed anı değil');
  const r2 = pilotSeed(yol);
  assert.equal(r2.sebep, 'zaten-kayitli');
  assert.equal(satirlar(yol).length, 1, 'seed idempotent — satır çoğalmaz');
  rmSync(d, { recursive: true, force: true });
});

test('o8: CLI sözleşmesi — kayit/ozet/seed exit 0 + JSON yüzleri; geçersiz kayit + bilinmeyen alt exit 1 RED; env yönlendirme hermetik', () => {
  const d1 = tempKok();
  const yol1 = defterYolu(d1);
  const args = (sn) => ['kayit', '--sure-sn', sn, '--echo', '3/3', '--handoff', 'plans/handoff/HANDOFF-2026-11-02-1000.md', '--zincir', 'plans/handoff/HANDOFF-2026-11-01-1741.md', '--kaynak', 'core/data/devir-kira.json-log.jsonl'];
  const r1 = olcumCli(args('100'), { defterYolu: yol1 });
  assert.equal(r1.status, 0, 'stdout: ' + r1.stdout + ' stderr: ' + r1.stderr);
  assert.equal(json(r1).sebep, 'kaydedildi');
  const rTekrar = olcumCli(args('100'), { defterYolu: yol1 });
  assert.equal(rTekrar.status, 0);
  assert.equal(json(rTekrar).sebep, 'zaten-kayitli');
  assert.equal(satirlar(yol1).length, 1, 'CLI idempotansı — satır çoğalmaz');
  const rOzet = olcumCli(['ozet'], { defterYolu: yol1 });
  assert.equal(rOzet.status, 0, 'stdout: ' + rOzet.stdout);
  assert.deepEqual(json(rOzet), { n: 1, medyanSn: 100, bozuk: 0 });
  const d2 = tempKok();
  const rSeed = olcumCli(['seed'], { defterYolu: defterYolu(d2) });
  assert.equal(rSeed.status, 0, 'stdout: ' + rSeed.stdout);
  assert.equal(json(rSeed).sebep, 'kaydedildi');
  assert.equal(satirlar(defterYolu(d2)).length, 1);
  assert.deepEqual(json(olcumCli(['ozet'], { defterYolu: defterYolu(d2) })), { n: 1, medyanSn: 248, bozuk: 0 });
  const d3 = tempKok();
  const rKotu = olcumCli(args('abc'), { defterYolu: defterYolu(d3) });
  assert.equal(rKotu.status, 1, 'stdout: ' + rKotu.stdout);
  assert.ok(/RED: sureSn/.test(json(rKotu).red));
  assert.equal(existsSync(defterYolu(d3)), false, 'geçmeyen CLI kaydı defter doğuramaz');
  const d4 = tempKok();
  const rEksik = olcumCli(['kayit', '--sure-sn', '10'], { defterYolu: defterYolu(d4) });
  assert.equal(rEksik.status, 1);
  assert.ok(/RED: echoDoluluk zorunlu/.test(json(rEksik).red), 'red: ' + rEksik.stdout);
  const d5 = tempKok();
  const rBilinmeyen = olcumCli(['yok-boyle'], { defterYolu: defterYolu(d5) });
  assert.equal(rBilinmeyen.status, 1);
  assert.ok(/bilinmeyen: yok-boyle/.test(json(rBilinmeyen).red));
  for (const d of [d1, d2, d3, d4, d5]) rmSync(d, { recursive: true, force: true });
});
