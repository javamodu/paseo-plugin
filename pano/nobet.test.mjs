// OTODEV-1 A2 TESTİ — pano/nobet.mjs (nöbet koşucusu CLI'sı). Hermetik: her vaka tmp dizinde
// ORDU_DEVIR_KIRA env'iyle AYRI SÜREÇ koşar — çıkış kodları (0/2/1) GERÇEK süreçten ölçülür,
// sözleşme ajanla exit kodu arasındadır; GERÇEK core/data/devir-kira.json'a ve kardeş tavan
// dosyasına DOKUNULMAZ (tavan kardeşi de kira gibi tmp'ye bağlanır; env kabuktan sızmaz —
// ORDU_DEVIR_* ailesi koşum öncesi silinir). Kapsam: durum'un kira yüzleri + çıkış kodu tablosu ·
// RED kapılarının karardan ÖNCE dönmesi (tavan/zincir/bozuk — fail-closed sıra) · kira-al
// pid/sinif doğrulaması (geçmeyen çağrı dosya YAZAMAZ) · kira-birak/yenile yolları (sahih RED'ler
// dahil) · brief'in çalışması · RED yolunun dosya YAZMAMASI. OLU_PID deseni devir-kira.test.mjs'ten.
// KOŞUM: node --test pano/nobet.test.mjs (×2 bağımsız koşulabilir).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = dirname(fileURLToPath(import.meta.url));
const MODUL = join(KOK, 'nobet.mjs');
const REPO = join(KOK, '..');

// Nobet CLI koşumu: ayrı süreç + temizlenmiş ORDU_DEVIR_* env'i (yalnız ORDU_DEVIR_KIRA fixture'a
// bağlanır; eşik/TTL/ölçüm yolu env'leri test kabuğundan aktarılmaz — hermetik).
const nobet = (arglar, { kiraYolu, ekEnv } = {}) => {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (k.startsWith('ORDU_DEVIR_')) delete env[k];
  env.ORDU_DEVIR_KIRA = kiraYolu;
  Object.assign(env, ekEnv || {});
  return spawnSync(process.execPath, [MODUL, ...arglar], { cwd: REPO, encoding: 'utf8', env });
};

const json = (r) => JSON.parse(r.stdout);
const tempKok = () => mkdtempSync(join(tmpdir(), 'otodev-nobet-'));
const kiraYolu = (d) => join(d, 'devir-kira.json');
const tavanYolu = (d) => join(d, 'devir-tavan.json');
const logYolu = (yol) => yol + '-log.jsonl';
const olaylar = (yol) => readFileSync(logYolu(yol), 'utf8').split('\n').filter((s) => s.trim()).map((s) => JSON.parse(s));

// Garantili ÖLÜ pid (devir-kira.test.mjs OLU_PID deseni): kısa ömürlü çocuk süreç doğar, senkron
// beklenir, ölür; pid'si ölüm kanıtı taşır. Sabit düşük pid Windows'da rastgele sistem sürecine
// denk gelebilir — kanıt garantisi olmaz, bu yüzden gerçek ölüm kullanılır.
const OLU_PID = (() => {
  const c = spawnSync(process.execPath, ['-e', '']);
  if (!c.pid) throw new Error('RED: OLU_PID üretilemedi (çocuk süreç doğmadı)');
  return c.pid;
})();

// Kira fixture'i: 20 dk önce damgalı 15 dk TTL'li meşru kira (bayat; sahibi OLU_PID) — üst yazımıyla
// taze/birakildi/canlı-sahip varyantları türetilir.
const kiraFixture = (ust = {}) => ({
  surum: 1, kimlik: 'koordinator-1', pid: OLU_PID,
  damgaISO: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  ttlMs: 15 * 60 * 1000, devirSinifi: 'operator',
  ...ust,
});
const kiraYaz = (yol, kira) => writeFileSync(yol, JSON.stringify(kira, null, 2) + '\n');
const logYaz = (yol, olayListesi) => writeFileSync(logYolu(yol), olayListesi.map((o) => JSON.stringify(o)).join('\n') + '\n');
const simdi = () => new Date().toISOString();

test('n1: durum — kira YOK → exit 2 (devir gerekli) + JSON yüzleri + HİÇ yazma (defter doğmaz)', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  const r = nobet(['durum'], { kiraYolu: yol });
  assert.equal(r.status, 2, 'stdout: ' + r.stdout + ' stderr: ' + r.stderr);
  const j = json(r);
  assert.equal(j.kira, 'yok');
  assert.equal(j.sahibi, null);
  assert.equal(j.sinif, null);
  assert.equal(j.pidCanli, null);
  assert.equal(j.ardisikDevir, 0);
  assert.equal(j.tavandan, null);
  assert.equal(j.karar, 'devir-gerekli');
  assert.ok(Number.isFinite(Date.parse(j.zamanISO)), 'zamanISO ölçülmüş damga olmalı');
  assert.equal(existsSync(yol), false, 'durum kira dosyası yazamaz');
  assert.equal(existsSync(logYolu(yol)), false, 'durum defter doğuramaz (salt-okur)');
  rmSync(d, { recursive: true, force: true });
});

test('n2: durum — kira TAZE → exit 0 (devir gerekmez) + sahibi/sinif taşınır; defter doğmaz', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraYaz(yol, kiraFixture({ damgaISO: simdi() }));
  const r = nobet(['durum'], { kiraYolu: yol });
  assert.equal(r.status, 0, 'stdout: ' + r.stdout + ' stderr: ' + r.stderr);
  const j = json(r);
  assert.equal(j.kira, 'taze');
  assert.equal(j.sahibi, 'koordinator-1');
  assert.equal(j.sinif, 'operator');
  assert.equal(typeof j.pidCanli, 'boolean');
  assert.equal(j.karar, 'devir-gerekmez');
  assert.equal(j.red, undefined);
  assert.equal(existsSync(logYolu(yol)), false, 'durum salt-okurdur — sessiz çıkış bacağı yazmasız');
  rmSync(d, { recursive: true, force: true });
});

test('n3: durum — kira BAYAT + sahibi ÖLÜ → exit 2, kira bayat-olu, pidCanli false', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraYaz(yol, kiraFixture()); // 20 dk önce + OLU_PID
  const r = nobet(['durum'], { kiraYolu: yol });
  assert.equal(r.status, 2, 'stdout: ' + r.stdout);
  const j = json(r);
  assert.equal(j.kira, 'bayat-olu');
  assert.equal(j.pidCanli, false);
  assert.equal(j.karar, 'devir-gerekli');
  rmSync(d, { recursive: true, force: true });
});

test('n4: durum — kira BAYAT + sahibi CANLI → exit 0 (sahibi ayakta — devir gerekmez)', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraYaz(yol, kiraFixture({ pid: process.pid })); // bu TEST süreci CLI koşarken yaşıyor
  const r = nobet(['durum'], { kiraYolu: yol });
  assert.equal(r.status, 0, 'stdout: ' + r.stdout);
  const j = json(r);
  assert.equal(j.kira, 'bayat-canli');
  assert.equal(j.pidCanli, true);
  assert.equal(j.karar, 'devir-gerekmez');
  rmSync(d, { recursive: true, force: true });
});

test('n5: durum — kira BIRAKILDI → exit 2 (bilinçli bırakılmış — devir gerekli)', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraYaz(yol, kiraFixture({ durum: 'birakildi', birakildiISO: simdi() }));
  const r = nobet(['durum'], { kiraYolu: yol });
  assert.equal(r.status, 2, 'stdout: ' + r.stdout);
  const j = json(r);
  assert.equal(j.kira, 'birakildi');
  assert.equal(j.karar, 'devir-gerekli');
  assert.equal(j.red, undefined);
  rmSync(d, { recursive: true, force: true });
});

test('n6: durum — kira BOZUK → exit 1 RED (kira-bozuk-devir-RED); durum dahi yazmaz', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  writeFileSync(yol, '{surum:1 bozuk');
  const r = nobet(['durum'], { kiraYolu: yol });
  assert.equal(r.status, 1, 'stdout: ' + r.stdout);
  const j = json(r);
  assert.equal(j.kira, 'bozuk');
  assert.equal(j.karar, 'RED');
  assert.ok(j.red.includes('kira-bozuk-devir-RED'), 'red alanı: ' + j.red);
  assert.equal(existsSync(logYolu(yol)), false, 'bozuk kira RED yolu defter de yazamaz');
  rmSync(d, { recursive: true, force: true });
});

test('n7: durum — tavan RED (kardeş devir-tavan.json, cpu 95) → exit 1; bayat-ölü kira bile RED ile ezilir', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraYaz(yol, kiraFixture()); // tek başına exit 2 verirdi
  writeFileSync(tavanYolu(d), JSON.stringify({ eszamanliAjan: 4, cpuYuzde: 95, hata429Son10dk: 0, istekDk: 20 }));
  const r = nobet(['durum'], { kiraYolu: yol });
  assert.equal(r.status, 1, 'stdout: ' + r.stdout);
  const j = json(r);
  assert.equal(j.tavandan.ok, false);
  assert.deepEqual(j.tavandan.redler, ['cpu-esik-RED']);
  assert.ok(j.red.includes('cpu-esik-RED'), 'red alanı: ' + j.red);
  assert.equal(j.karar, 'RED');
  rmSync(d, { recursive: true, force: true });
});

test('n8: durum — tavan YEŞİLİ kararı değiştirmez (kira yok → exit 2; tavandan ok/redler dolu)', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  writeFileSync(tavanYolu(d), JSON.stringify({ eszamanliAjan: 4, cpuYuzde: 84, hata429Son10dk: 1, istekDk: 20 }));
  const r = nobet(['durum'], { kiraYolu: yol });
  assert.equal(r.status, 2, 'stdout: ' + r.stdout);
  const j = json(r);
  assert.equal(j.tavandan.ok, true);
  assert.deepEqual(j.tavandan.redler, []);
  assert.equal(j.red, undefined);
  assert.equal(j.kira, 'yok');
  rmSync(d, { recursive: true, force: true });
});

test('n9: durum — tavan dosyası YOK → tavandan null (kapı ölçümsüz, RED DEĞİL); env ORDU_DEVIR_TAVAN_DOSYA kardeşten uzak yerden okur', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraYaz(yol, kiraFixture({ damgaISO: simdi() })); // taze → tek başına exit 0
  const r = nobet(['durum'], { kiraYolu: yol });
  assert.equal(r.status, 0, 'stdout: ' + r.stdout);
  assert.equal(json(r).tavandan, null, 'ölçüm kaynağı kurulmamışsa dürüst null');
  // Override: kira kardeşi OLMAYAN dosyadan RED'li ölçüm → taze kira bile RED alır:
  const d2 = tempKok();
  const yol2 = kiraYolu(d2);
  const olcum = join(d2, 'olcum.json');
  kiraYaz(yol2, kiraFixture({ damgaISO: simdi() }));
  writeFileSync(olcum, JSON.stringify({ eszamanliAjan: 9, cpuYuzde: 50, hata429Son10dk: 0, istekDk: 20 }));
  const r2 = nobet(['durum'], { kiraYolu: yol2, ekEnv: { ORDU_DEVIR_TAVAN_DOSYA: olcum } });
  assert.equal(r2.status, 1, 'stdout: ' + r2.stdout);
  assert.ok(json(r2).red.includes('tavan-eszamanli-RED'));
  rmSync(d, { recursive: true, force: true });
  rmSync(d2, { recursive: true, force: true });
});

test('n10: durum — zincir kapısı: yankısız devir → echo-borcu-acik RED (exit 1; bayat-ölü kira bile ezilir)', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraYaz(yol, kiraFixture());
  logYaz(yol, [{ tur: 'devir', oncekiKimlik: 'eski', kimlik: 'nobet-1', pid: 2222, devirSinifi: 'nobet', damga: simdi(), sebep: 'ttl-asimi' }]);
  const r = nobet(['durum'], { kiraYolu: yol });
  assert.equal(r.status, 1, 'stdout: ' + r.stdout);
  const j = json(r);
  assert.ok(j.red.includes('echo-borcu-acik'), 'red alanı: ' + j.red);
  assert.equal(j.ardisikDevir, 1);
  assert.equal(j.karar, 'RED');
  rmSync(d, { recursive: true, force: true });
});

test('n11: durum — 4 ardışık devir → devir-zinciri-insan-kapisi-RED (exit 1, ardisikDevir 4)', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraYaz(yol, kiraFixture());
  logYaz(yol, [1, 2, 3, 4].map((i) => ({ tur: 'devir', oncekiKimlik: 'eski-' + i, kimlik: 'nobet-' + i, pid: 2000 + i, devirSinifi: 'nobet', damga: simdi(), sebep: 'ttl-asimi' })));
  const r = nobet(['durum'], { kiraYolu: yol });
  assert.equal(r.status, 1, 'stdout: ' + r.stdout);
  const j = json(r);
  assert.ok(j.red.includes('devir-zinciri-insan-kapisi-RED'), 'red alanı: ' + j.red);
  assert.equal(j.ardisikDevir, 4);
  rmSync(d, { recursive: true, force: true });
});

test('n12: durum — echo DOLU zincir → zincir RED yok; bayat-ölü kira → exit 2 (devir gerekli)', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraYaz(yol, kiraFixture());
  logYaz(yol, [
    { tur: 'devir', oncekiKimlik: 'eski', kimlik: 'nobet-1', pid: 2222, devirSinifi: 'nobet', damga: simdi(), sebep: 'ttl-asimi' },
    { tur: 'echo', iliskinOlayId: 1, kimlik: 'nobet-1', damga: simdi(), cevaplar: { kirliSayisi: 3, sonCommit: 'e6631e4', ilkOnay: 'K7 push' } },
  ]);
  const r = nobet(['durum'], { kiraYolu: yol });
  assert.equal(r.status, 2, 'stdout: ' + r.stdout);
  const j = json(r);
  assert.equal(j.red, undefined);
  assert.equal(j.ardisikDevir, 1);
  assert.equal(j.karar, 'devir-gerekli');
  rmSync(d, { recursive: true, force: true });
});

test('n13: kira-al — ilk kira: exit 0 + varsayılan kimlik nobet-ajan-<pid> + sinif nobet + defter ilk-kira', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  const r = nobet(['kira-al', '--sinif', 'nobet', '--pid', '4242'], { kiraYolu: yol });
  assert.equal(r.status, 0, 'stdout: ' + r.stdout + ' stderr: ' + r.stderr);
  const j = json(r);
  assert.equal(j.ok, true);
  assert.equal(j.sebep, 'ilk-kira');
  assert.equal(j.kira.kimlik, 'nobet-ajan-4242');
  assert.equal(j.kira.devirSinifi, 'nobet');
  const dosyadan = JSON.parse(readFileSync(yol, 'utf8'));
  assert.equal(dosyadan.kimlik, 'nobet-ajan-4242');
  assert.equal(dosyadan.pid, 4242);
  assert.equal(dosyadan.devirSinifi, 'nobet');
  assert.equal(olaylar(yol)[0].tur, 'ilk-kira');
  rmSync(d, { recursive: true, force: true });
});

test('n14: kira-al — --pid YOK → exit 1 RED; dosya/defter doğmaz (kısa ömürlü pid sessiz varsayılan olamaz)', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  const r = nobet(['kira-al', '--sinif', 'nobet'], { kiraYolu: yol });
  assert.equal(r.status, 1, 'stdout: ' + r.stdout);
  assert.ok(/--pid zorunlu/.test(json(r).red), 'red: ' + r.stdout);
  assert.equal(existsSync(yol), false, 'doğrulamadan geçmeyen çağrı kira dosyası YAZAMAZ');
  assert.equal(existsSync(logYolu(yol)), false);
  rmSync(d, { recursive: true, force: true });
});

test('n15: kira-al — geçersiz pid (0, -5, abc, 3.5) → exit 1 RED; dosya doğmaz', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  for (const p of ['0', '-5', 'abc', '3.5']) {
    const r = nobet(['kira-al', '--sinif', 'nobet', '--pid', p], { kiraYolu: yol });
    assert.equal(r.status, 1, 'pid=' + p + ' stdout: ' + r.stdout);
    assert.ok(/pozitif tamsayı/.test(json(r).red), 'pid=' + p + ' red: ' + r.stdout);
  }
  assert.equal(existsSync(yol), false);
  rmSync(d, { recursive: true, force: true });
});

test('n16: kira-al — sinif doğrulama: --sinif YOK → RED; watchdog (operator|nobet dışı) → RED; dosya doğmaz', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  const r1 = nobet(['kira-al', '--pid', '4242'], { kiraYolu: yol });
  assert.equal(r1.status, 1, 'stdout: ' + r1.stdout);
  assert.ok(/--sinif zorunlu/.test(json(r1).red));
  const r2 = nobet(['kira-al', '--sinif', 'watchdog', '--pid', '4242'], { kiraYolu: yol });
  assert.equal(r2.status, 1, 'stdout: ' + r2.stdout);
  assert.ok(/yalnız operator\|nobet/.test(json(r2).red), 'red: ' + r2.stdout);
  assert.equal(existsSync(yol), false, 'geçersiz sinif dosya YAZAMAZ');
  assert.equal(existsSync(logYolu(yol)), false);
  rmSync(d, { recursive: true, force: true });
});

test('n17: kira-al — TAZE kirada farklı kimlik → modül RED kira-taze-devir-RED (exit 1); kira sahibinde kalır', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraYaz(yol, kiraFixture({ damgaISO: simdi() }));
  const r = nobet(['kira-al', '--sinif', 'nobet', '--pid', '2222', '--kimlik', 'nobet-1'], { kiraYolu: yol });
  assert.equal(r.status, 1, 'stdout: ' + r.stdout);
  const j = json(r);
  assert.equal(j.ok, false);
  assert.equal(j.sebep, 'kira-taze-devir-RED');
  assert.equal(JSON.parse(readFileSync(yol, 'utf8')).kimlik, 'koordinator-1', 'çift-yazar dosyayı değiştiremedi');
  rmSync(d, { recursive: true, force: true });
});

test('n18: kira-al — STALE kira (ölü sahib) → devir ALINIR: exit 0, sebep ttl-asimi-devir, sinif nobet', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraYaz(yol, kiraFixture()); // 20 dk önce + OLU_PID → süreç-çıkış kanıtı tamam
  const r = nobet(['kira-al', '--sinif', 'nobet', '--pid', '2222', '--kimlik', 'nobet-1'], { kiraYolu: yol });
  assert.equal(r.status, 0, 'stdout: ' + r.stdout + ' stderr: ' + r.stderr);
  const j = json(r);
  assert.equal(j.ok, true);
  assert.equal(j.sebep, 'ttl-asimi-devir');
  const dosyadan = JSON.parse(readFileSync(yol, 'utf8'));
  assert.equal(dosyadan.kimlik, 'nobet-1');
  assert.equal(dosyadan.devirSinifi, 'nobet');
  const son = olaylar(yol).at(-1);
  assert.equal(son.tur, 'devir');
  assert.equal(son.sebep, 'ttl-asimi');
  rmSync(d, { recursive: true, force: true });
});

test('n19: kira-birak — sahip bırakır (exit 0, durum birakildi); yanlış kimlik RED; kimlik YOK RED', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraYaz(yol, kiraFixture({ damgaISO: simdi() }));
  const rYanlis = nobet(['kira-birak', '--kimlik', 'baskasi'], { kiraYolu: yol });
  assert.equal(rYanlis.status, 1, 'stdout: ' + rYanlis.stdout);
  assert.equal(json(rYanlis).sebep, 'kira-sahip-degil');
  const r = nobet(['kira-birak', '--kimlik', 'koordinator-1'], { kiraYolu: yol });
  assert.equal(r.status, 0, 'stdout: ' + r.stdout);
  assert.equal(json(r).sebep, 'birakildi');
  const dosyadan = JSON.parse(readFileSync(yol, 'utf8'));
  assert.equal(dosyadan.durum, 'birakildi');
  assert.equal(existsSync(yol), true, 'kira dosyası silinmez');
  const rYok = nobet(['kira-birak'], { kiraYolu: yol });
  assert.equal(rYok.status, 1, 'stdout: ' + rYok.stdout);
  assert.ok(/kimlik zorunlu/.test(json(rYok).red));
  rmSync(d, { recursive: true, force: true });
});

test('n20: kira-birak --pid — varsayılan kimlik türetmesi kira-al ile TUTARLI (nobet-ajan-<pid>)', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  const rAl = nobet(['kira-al', '--sinif', 'nobet', '--pid', '4242'], { kiraYolu: yol }); // kimlik: nobet-ajan-4242
  assert.equal(rAl.status, 0, 'stdout: ' + rAl.stdout);
  const r = nobet(['kira-birak', '--pid', '4242'], { kiraYolu: yol });
  assert.equal(r.status, 0, 'stdout: ' + r.stdout);
  assert.equal(json(r).sebep, 'birakildi');
  const dosyadan = JSON.parse(readFileSync(yol, 'utf8'));
  assert.equal(dosyadan.kimlik, 'nobet-ajan-4242');
  assert.equal(dosyadan.durum, 'birakildi');
  rmSync(d, { recursive: true, force: true });
});

test('n21: kira-yenile — sahip yeniler (exit 0, damga tazelenir); yanlış kimlik RED; argümansız RED', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraYaz(yol, kiraFixture({ damgaISO: new Date(Date.now() - 10 * 60 * 1000).toISOString() })); // 10 dk önce — yenilenebilir
  const r = nobet(['kira-yenile', '--kimlik', 'koordinator-1'], { kiraYolu: yol });
  assert.equal(r.status, 0, 'stdout: ' + r.stdout + ' stderr: ' + r.stderr);
  const j = json(r);
  assert.equal(j.ok, true);
  assert.equal(j.sebep, 'yenilendi');
  const dosyadan = JSON.parse(readFileSync(yol, 'utf8'));
  assert.ok(Date.now() - Date.parse(dosyadan.damgaISO) < 60 * 1000, 'damga yenilenmiş olmalı');
  assert.ok(olaylar(yol).some((o) => o.tur === 'yenile'));
  const rYanlis = nobet(['kira-yenile', '--pid', '9999'], { kiraYolu: yol }); // nobet-ajan-9999 ≠ sahip
  assert.equal(rYanlis.status, 1, 'stdout: ' + rYanlis.stdout);
  assert.equal(json(rYanlis).sebep, 'kira-sahip-degil');
  const rYok = nobet(['kira-yenile'], { kiraYolu: yol });
  assert.equal(rYok.status, 1, 'stdout: ' + rYok.stdout);
  assert.ok(/--pid ya da --kimlik/.test(json(rYok).red));
  rmSync(d, { recursive: true, force: true });
});

test('n22: brief — exit 0 + EK-3 bölümleri + echo borcu; kira yolu env üzerinden (ORDU_DEVIR_KIRA) breve geçer; yazma yok', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  const r = nobet(['brief'], { kiraYolu: yol });
  assert.equal(r.status, 0, 'stdout: ' + r.stdout + ' stderr: ' + r.stderr);
  assert.ok(r.stdout.includes('DEVRİR BREFİ'));
  assert.ok(r.stdout.includes('## 4) GÖREV SINIRI'));
  assert.ok(r.stdout.includes('## ECHO BORCU — 3 SORU'));
  assert.ok(r.stdout.includes(yol), 'brief nöbetin GERÇEK (env) kira yolunu taşımalı');
  assert.ok(!r.stdout.includes('undefined'));
  assert.equal(existsSync(yol), false, 'brief kira yoluna yazmaz — salt metin üretimi');
  rmSync(d, { recursive: true, force: true });
});

test('n23: brief --handoff <yol> — briefte geçer; varsayılan sabitlenmedi notu kalkar', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  const r = nobet(['brief', '--handoff', 'plans/handoff/HANDOFF-2026-11-01-0512.md'], { kiraYolu: yol });
  assert.equal(r.status, 0, 'stdout: ' + r.stdout);
  assert.ok(r.stdout.includes('plans/handoff/HANDOFF-2026-11-01-0512.md'));
  assert.ok(!r.stdout.includes('sabitlenmedi'));
  rmSync(d, { recursive: true, force: true });
});

test('n24: bilinmeyen/eksik alt komut → exit 1 RED JSON; dosya yazılmaz', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  const r1 = nobet(['yok-boyle'], { kiraYolu: yol });
  assert.equal(r1.status, 1, 'stdout: ' + r1.stdout);
  assert.ok(/alt komut zorunlu/.test(json(r1).red));
  assert.ok(/bilinmeyen: yok-boyle/.test(json(r1).red));
  const r2 = nobet([], { kiraYolu: yol });
  assert.equal(r2.status, 1, 'stdout: ' + r2.stdout);
  assert.ok(/alt komut zorunlu/.test(json(r2).red));
  assert.equal(existsSync(yol), false);
  assert.equal(existsSync(logYolu(yol)), false);
  rmSync(d, { recursive: true, force: true });
});

test('n25: RED yolu tamamen sessiz — bozuk kira + RED tavan: exit 1 ve tmp dizinde TEK YENİ DOSYA doğmaz', () => {
  const d = tempKok();
  writeFileSync(kiraYolu(d), '{bozuk');
  writeFileSync(tavanYolu(d), JSON.stringify({ eszamanliAjan: 9, cpuYuzde: 50, hata429Son10dk: 0, istekDk: 20 }));
  const once = readdirSync(d).sort();
  const r = nobet(['durum'], { kiraYolu: kiraYolu(d) });
  assert.equal(r.status, 1, 'stdout: ' + r.stdout);
  const j = json(r);
  assert.ok(j.red.includes('kira-bozuk-devir-RED') && j.red.includes('tavan-eszamanli-RED'), 'red alanı: ' + j.red);
  const sonra = readdirSync(d).sort();
  assert.deepEqual(sonra, once, 'durum RED yolunda dahi hiçbir dosya yazamaz');
  rmSync(d, { recursive: true, force: true });
});
