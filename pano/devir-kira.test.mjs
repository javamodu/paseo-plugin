// OTODEV-1 A1 TESTİ — pano/devir-kira.mjs (lease kilidi). Hermetik: tümü temp fixture'da;
// GERÇEK core/data/devir-kira.json'a ve defterine DOKUNMAZ; canlı sunucuya bağlanmaz.
// Kapsam: ilk-kira · yenile · taze kirada çift-yazar RED (429-dirilme vakası) · stale devir +
// log 'devir' olayı · SÜREÇ-ÇIKIŞ KANITI (TTL aşmış ama pid CANLI → devir RED; sentez koşul 2) ·
// bırak yalnız sahip · echo yazımı + zincirKontrol kırmızısı/yeşili · ardışık-devir zinciri >3 →
// İNSAN KAPISI RED (sentez koşul 5; kök kırılımı dahil) · append-only defter · tmp+rename atomiklik
// · bozuk kira devrilmez · giriş doğrulama.
// KOŞUM: node --test pano/devir-kira.test.mjs (×2 bağımsız koşulabilir).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { kiraAl, kiraYenile, kiraDurum, kiraBirak, kiraEchoYaz, zincirKontrol, logOku } from './devir-kira.mjs';

const tempKok = () => mkdtempSync(join(tmpdir(), 'otodev-kira-'));
const kiraYolu = (d) => join(d, 'devir-kira.json');
const logIcerigi = (yol) => readFileSync(yol + '-log.jsonl', 'utf8');
const olaylar = (yol) => logIcerigi(yol).split('\n').filter((s) => s.trim()).map((s) => JSON.parse(s));

// Garantili ÖLÜ pid (sentez koşul 2 — pid yoklaması testi için): kısa ömürlü çocuk süreç doğar,
// senkron beklenir, ölür; pid'si ölüm kanıtı taşır. Sabit düşük pid (111 gibi) Windows'da rastgele
// bir sistem sürecine denk gelebilir — kanıt garantisi OLMAZ, bu yüzden gerçek ölüm kullanılır.
const OLU_PID = (() => {
  const c = spawnSync(process.execPath, ['-e', '']);
  if (!c.pid) throw new Error('RED: OLU_PID üretilemedi (çocuk süreç doğmadı)');
  return c.pid;
})();

// Stale fixture: 20 dk önce damgalı, 15 dk TTL'li meşru görünümlü kira (TTL'i dolmuş; sahibi
// ÖLÜ — OLU_PID — ki devir yolu süreç-çıkış kanıtından geçebilsin).
const staleKiraYaz = (yol, kimlik = 'eski-koordinator', pid = OLU_PID) => {
  writeFileSync(yol, JSON.stringify({
    surum: 1, kimlik, pid,
    damgaISO: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    ttlMs: 15 * 60 * 1000, devirSinifi: 'operator',
  }, null, 2) + '\n');
};

test('v1: ilk kira alınır — dosya sürüm şemasıyla iner + loga ilk-kira düşer', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  const r = kiraAl(yol, { kimlik: 'operator-1', pid: 1234, devirSinifi: 'operator' });
  assert.equal(r.ok, true);
  assert.equal(r.sebep, 'ilk-kira');
  assert.equal(r.kira.kimlik, 'operator-1');
  const dosyadan = JSON.parse(readFileSync(yol, 'utf8'));
  assert.equal(dosyadan.surum, 1);
  assert.equal(dosyadan.kimlik, 'operator-1');
  assert.equal(dosyadan.pid, 1234);
  assert.equal(dosyadan.devirSinifi, 'operator');
  assert.equal(dosyadan.ttlMs, 15 * 60 * 1000);
  assert.ok(Number.isFinite(Date.parse(dosyadan.damgaISO)));
  const o = olaylar(yol);
  assert.equal(o.length, 1);
  assert.equal(o[0].tur, 'ilk-kira');
  assert.equal(o[0].kimlik, 'operator-1');
  assert.ok(o[0].damga);
  rmSync(d, { recursive: true, force: true });
});

test('v2: sahip yeniler — damga tazelenir + loga yenile düşer', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraAl(yol, { kimlik: 'operator-1', pid: 1234, devirSinifi: 'operator' });
  const r = kiraYenile(yol, 'operator-1');
  assert.equal(r.ok, true);
  assert.equal(r.sebep, 'yenilendi');
  const dm = kiraDurum(yol);
  assert.equal(dm.taze, true);
  assert.equal(dm.kimlik, 'operator-1');
  assert.ok(dm.kalanMs > 14 * 60 * 1000, 'yenileme sonrası kalan süre taze olmalı: ' + dm.kalanMs);
  assert.ok(olaylar(yol).some((o) => o.tur === 'yenile' && o.kimlik === 'operator-1'));
  rmSync(d, { recursive: true, force: true });
});

test('v3: TAZE kira + farklı kimlik → kira-taze-devir-RED (çift-yazar) + loga RED düşer', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraAl(yol, { kimlik: 'operator-1', pid: 1234, devirSinifi: 'operator' });
  const r = kiraAl(yol, { kimlik: 'nobet-1', pid: 2222, devirSinifi: 'nobet' });
  assert.equal(r.ok, false);
  assert.equal(r.sebep, 'kira-taze-devir-RED');
  // Kira sahibinde kalır — çift-yazar dosyayı DEĞİŞTİREMEDİ:
  assert.equal(JSON.parse(readFileSync(yol, 'utf8')).kimlik, 'operator-1');
  assert.equal(kiraDurum(yol).kimlik, 'operator-1');
  const son = olaylar(yol).at(-1);
  assert.equal(son.tur, 'RED');
  assert.equal(son.sebep, 'kira-taze-devir-RED');
  assert.equal(son.kimlik, 'nobet-1');
  assert.equal(son.oncekiKimlik, 'operator-1');
  rmSync(d, { recursive: true, force: true });
});

test('v4: STALE kira → devir ALINIR + loga devir olayı {oncekiKimlik, kimlik, sebep:ttl-asimi}', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  staleKiraYaz(yol);
  const r = kiraAl(yol, { kimlik: 'nobet-1', pid: 2222, devirSinifi: 'nobet' });
  assert.equal(r.ok, true);
  assert.equal(r.sebep, 'ttl-asimi-devir');
  const dosyadan = JSON.parse(readFileSync(yol, 'utf8'));
  assert.equal(dosyadan.kimlik, 'nobet-1');
  assert.equal(dosyadan.devirSinifi, 'nobet');
  const o = olaylar(yol);
  assert.equal(o.length, 1);
  assert.equal(o[0].tur, 'devir');
  assert.equal(o[0].oncekiKimlik, 'eski-koordinator');
  assert.equal(o[0].kimlik, 'nobet-1');
  assert.equal(o[0].sebep, 'ttl-asimi');
  assert.ok(o[0].damga);
  rmSync(d, { recursive: true, force: true });
});

test('v5: devir SONRASI yeni taze kira da çift-yazara kapalı — ardaşık RED zinciri', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  staleKiraYaz(yol);
  assert.equal(kiraAl(yol, { kimlik: 'nobet-1', pid: 2222, devirSinifi: 'nobet' }).ok, true);
  // Yeni kira da tazedir — üçüncü kimlik YİNE RED alır (dirilme vakası zincirde kapanır):
  const r = kiraAl(yol, { kimlik: 'nobet-2', pid: 3333, devirSinifi: 'nobet' });
  assert.equal(r.ok, false);
  assert.equal(r.sebep, 'kira-taze-devir-RED');
  assert.equal(JSON.parse(readFileSync(yol, 'utf8')).kimlik, 'nobet-1');
  rmSync(d, { recursive: true, force: true });
});

test('v6: başkası yenileyemez — kira-sahip-degil RED + log RED', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraAl(yol, { kimlik: 'operator-1', pid: 1234, devirSinifi: 'operator' });
  const r = kiraYenile(yol, 'nobet-1');
  assert.equal(r.ok, false);
  assert.equal(r.sebep, 'kira-sahip-degil');
  assert.equal(kiraDurum(yol).kimlik, 'operator-1');
  const son = olaylar(yol).at(-1);
  assert.equal(son.tur, 'RED');
  assert.equal(son.sebep, 'kira-sahip-degil');
  rmSync(d, { recursive: true, force: true });
});

test('v7: bırak yalnız sahip — dosya SİLİNMEZ, durum birakildi; bırakılan kira yenilenemez', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraAl(yol, { kimlik: 'operator-1', pid: 1234, devirSinifi: 'operator' });
  assert.equal(kiraBirak(yol, 'nobet-1').sebep, 'kira-sahip-degil'); // başkası bırakamaz
  const r = kiraBirak(yol, 'operator-1');
  assert.equal(r.ok, true);
  assert.equal(r.sebep, 'birakildi');
  assert.equal(existsSync(yol), true, 'kira dosyası silinmez (append-only olay + durum yazımı)');
  const dosyadan = JSON.parse(readFileSync(yol, 'utf8'));
  assert.equal(dosyadan.durum, 'birakildi');
  const dm = kiraDurum(yol);
  assert.equal(dm.taze, false);
  assert.equal(dm.durum, 'birakildi');
  assert.equal(kiraYenile(yol, 'operator-1').sebep, 'kira-birakildi'); // bırakılan yenilenmez
  assert.ok(olaylar(yol).some((o) => o.tur === 'birak' && o.durum === 'birakildi'));
  rmSync(d, { recursive: true, force: true });
});

test('v8: bırakılan kira TTL beklemeden devralınabilir — devir sebep birakildi', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraAl(yol, { kimlik: 'operator-1', pid: 1234, devirSinifi: 'operator' });
  kiraBirak(yol, 'operator-1');
  const r = kiraAl(yol, { kimlik: 'nobet-1', pid: 2222, devirSinifi: 'nobet' });
  assert.equal(r.ok, true);
  assert.equal(r.sebep, 'birakildi-devir');
  const devirOlay = olaylar(yol).find((o) => o.tur === 'devir');
  assert.equal(devirOlay.sebep, 'birakildi');
  assert.equal(devirOlay.oncekiKimlik, 'operator-1');
  rmSync(d, { recursive: true, force: true });
});

test('v9: kiraDurum salt-okur — yok/bozuk/taze/stale yüzleri; YAZMA YOK (log dosyası doğmaz)', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  assert.equal(kiraDurum(yol).yok, true);
  assert.equal(kiraDurum(yol).taze, false);
  writeFileSync(yol, '{surum:1 bozuk');
  const bozuk = kiraDurum(yol);
  assert.equal(bozuk.bozuk, true);
  assert.equal(bozuk.taze, false);
  // Şimdiye kadar HİÇ yazma yapılmadı — defter dosyası doğmamış olmalı (sessiz çıkış bacağı):
  assert.equal(existsSync(yol + '-log.jsonl'), false, 'kiraDurum yazma yaparsa sessiz çıkış bozulur');
  rmSync(yol, { force: true }); // bozuk kira [insan] temizliği — kod bozuğu kendisi devirmez (v15)
  kiraAl(yol, { kimlik: 'operator-1', pid: 1234, devirSinifi: 'operator' });
  const taze = kiraDurum(yol);
  assert.equal(taze.taze, true);
  assert.ok(taze.kalanMs > 0);
  assert.equal(taze.devirSinifi, 'operator');
  staleKiraYaz(yol);
  assert.equal(kiraDurum(yol).taze, false);
  rmSync(d, { recursive: true, force: true });
});

test('v10: devirden sonra echo yazılır — iliskinOlayId doğru + zincirKontrol echo-dolu', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  staleKiraYaz(yol);
  kiraAl(yol, { kimlik: 'nobet-1', pid: 2222, devirSinifi: 'nobet' }); // olayId 1: devir
  const r = kiraEchoYaz(yol, { kirliSayisi: 127, sonCommit: 'e6631e4', ilkOnay: 'K7 push' });
  assert.equal(r.ok, true);
  assert.equal(r.iliskinOlayId, 1);
  const echo = olaylar(yol).find((o) => o.tur === 'echo');
  assert.equal(echo.iliskinOlayId, 1);
  assert.deepEqual(echo.cevaplar, { kirliSayisi: 127, sonCommit: 'e6631e4', ilkOnay: 'K7 push' });
  assert.ok(echo.damga);
  const zk = zincirKontrol(yol);
  assert.equal(zk.ok, true);
  assert.equal(zk.sebep, 'echo-dolu');
  assert.equal(zk.devirOlayId, 1);
  rmSync(d, { recursive: true, force: true });
});

test('v11: echo yazılmadan zincir KIRMIZI — echo-borcu-acik; devir yoksa borç yoktur', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  staleKiraYaz(yol);
  kiraAl(yol, { kimlik: 'nobet-1', pid: 2222, devirSinifi: 'nobet' });
  const zk = zincirKontrol(yol);
  assert.equal(zk.ok, false);
  assert.equal(zk.sebep, 'echo-borcu-acik');
  assert.equal(zk.devirOlayId, 1);
  // Yeni dizinde yalnız ilk-kira var (devir olayı yok) → borç yok, kırmızı da yok:
  const d2 = tempKok();
  const yol2 = kiraYolu(d2);
  kiraAl(yol2, { kimlik: 'operator-2', pid: 55, devirSinifi: 'operator' });
  assert.equal(zincirKontrol(yol2).sebep, 'devir-olayi-yok');
  rmSync(d, { recursive: true, force: true });
  rmSync(d2, { recursive: true, force: true });
});

test('v12: eksik cevap — kiraEchoYaz ATILIR (fail-closed) + borç açık kalır + devirsiz echo RED', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  staleKiraYaz(yol);
  kiraAl(yol, { kimlik: 'nobet-1', pid: 2222, devirSinifi: 'nobet' });
  assert.throws(() => kiraEchoYaz(yol, { kirliSayisi: 1, sonCommit: 'x' }), /eksik alan: ilkOnay/);
  assert.equal(zincirKontrol(yol).sebep, 'echo-borcu-acik');
  // Devir olayı olmayan defterde echo iliştirilecek halka bulamaz:
  const d2 = tempKok();
  const yol2 = kiraYolu(d2);
  kiraAl(yol2, { kimlik: 'operator-2', pid: 55, devirSinifi: 'operator' });
  assert.equal(kiraEchoYaz(yol2, { kirliSayisi: 1, sonCommit: 'x', ilkOnay: 'y' }).sebep, 'devir-olay-yok');
  rmSync(d, { recursive: true, force: true });
  rmSync(d2, { recursive: true, force: true });
});

test('v13: defter append-only — yeni olay eskisini BOZMAZ + her satır geçerli JSON', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraAl(yol, { kimlik: 'operator-1', pid: 1234, devirSinifi: 'operator' });
  const ilk = logIcerigi(yol);
  kiraYenile(yol, 'operator-1');
  kiraBirak(yol, 'operator-1');
  const son = logIcerigi(yol);
  assert.ok(son.startsWith(ilk), 'eski satırlar bozulmadan kalmalı (append-only)');
  const satirlar = son.split('\n').filter(Boolean);
  assert.equal(satirlar.length, 3);
  for (const s of satirlar) JSON.parse(s); // hepsi tek başına geçerli JSON — yarım satır yok
  rmSync(d, { recursive: true, force: true });
});

test('v14: tmp+fsync+rename — tmp kalıntısı YOK + kira dosyası her zaman TAM JSON', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  kiraAl(yol, { kimlik: 'operator-1', pid: 1234, devirSinifi: 'operator' });
  kiraYenile(yol, 'operator-1');
  kiraBirak(yol, 'operator-1');
  staleKiraYaz(yol);
  kiraAl(yol, { kimlik: 'nobet-1', pid: 2222, devirSinifi: 'nobet' }); // devir yazımı da tmp+rename
  assert.equal(readdirSync(d).filter((f) => f.includes('.tmp-')).length, 0, 'tmp kalıntısı kalmaz');
  const dosyadan = JSON.parse(readFileSync(yol, 'utf8')); // yarım dosya yok — her an tam JSON
  assert.equal(dosyadan.kimlik, 'nobet-1');
  assert.equal(dosyadan.surum, 1);
  rmSync(d, { recursive: true, force: true });
});

test('v15: BOZUK kira devrilmez — kira-bozuk-devir-RED (fail-closed) + log RED', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  writeFileSync(yol, '{surum:1 kimlik:'); // yarım/bozuk JSON
  const r = kiraAl(yol, { kimlik: 'nobet-1', pid: 2222, devirSinifi: 'nobet' });
  assert.equal(r.ok, false);
  assert.equal(r.sebep, 'kira-bozuk-devir-RED');
  const son = olaylar(yol).at(-1);
  assert.equal(son.tur, 'RED');
  assert.equal(son.sebep, 'kira-bozuk-devir-RED');
  rmSync(d, { recursive: true, force: true });
});

test('v16: giriş doğrulama fail-closed — kimlik/pid zorunlu; devirSinifi watchdog\'a KAPALI', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  assert.throws(() => kiraAl(yol, {}), /kimlik zorunlu/);
  assert.throws(() => kiraAl(yol, { kimlik: 'x', pid: '123' }), /pid tamsayı/);
  assert.throws(() => kiraAl(yol, { kimlik: 'x', pid: 1, devirSinifi: 'watchdog' }), /devirSinifi/);
  assert.throws(() => kiraYenile(yol, '  '), /kimlik zorunlu/);
  assert.throws(() => kiraBirak(yol, undefined), /kimlik zorunlu/);
  assert.equal(existsSync(yol), false, 'doğrulamadan geçmeyen çağrı dosya YAZAMAZ');
  rmSync(d, { recursive: true, force: true });
});

test('v17: logOku — bozuk satır atlanır + sayılır (dürüst)', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  writeFileSync(yol + '-log.jsonl', '{"tur":"devir","kimlik":"a"}\nBOZUK SATIR\n{"tur":"echo"}\n');
  const { olaylar: o, bozuk } = logOku(yol);
  assert.equal(o.length, 2);
  assert.equal(bozuk, 1);
  rmSync(d, { recursive: true, force: true });
});

test('v18: SÜREÇ-ÇIKIŞ KANITI (sentez koşul 2) — TTL aşmış ama sahibin pid\'i CANLI → devir RED', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  staleKiraYaz(yol, 'eski-koordinator', process.pid); // bu TEST süreci canlıdır — pid yaşar
  const r = kiraAl(yol, { kimlik: 'nobet-1', pid: 2222, devirSinifi: 'nobet' });
  assert.equal(r.ok, false);
  assert.equal(r.sebep, 'pid-canli-devir-RED');
  // Kira ES SAHİBİNDE kalır — devir alınamadı, dosya devralıcının olamaz:
  const dosyadan = JSON.parse(readFileSync(yol, 'utf8'));
  assert.equal(dosyadan.kimlik, 'eski-koordinator');
  const son = olaylar(yol).at(-1);
  assert.equal(son.tur, 'RED');
  assert.equal(son.sebep, 'pid-canli-devir-RED');
  assert.equal(son.oncekiKimlik, 'eski-koordinator');
  rmSync(d, { recursive: true, force: true });
});

test('v19: SÜREÇ-ÇIKIŞ KANITI — sahibi ÖLÜ (OLU_PID) → TTL aşımı devri YASAL yoldan alınır', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  staleKiraYaz(yol, 'eski-koordinator', OLU_PID); // ölüm kanıtı var
  const r = kiraAl(yol, { kimlik: 'nobet-1', pid: 2222, devirSinifi: 'nobet' });
  assert.equal(r.ok, true);
  assert.equal(r.sebep, 'ttl-asimi-devir');
  const son = olaylar(yol).at(-1);
  assert.equal(son.tur, 'devir');
  assert.equal(son.sebep, 'ttl-asimi');
  rmSync(d, { recursive: true, force: true });
});

test('v20: zincir >3 ardışık devir → İNSAN KAPISI RED (sentez koşul 5)', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  for (let i = 1; i <= 4; i++) {
    staleKiraYaz(yol, 'eski-' + i, OLU_PID);
    const r = kiraAl(yol, { kimlik: 'nobet-' + i, pid: 2000 + i, devirSinifi: 'nobet' });
    assert.equal(r.ok, true, 'her devir tek başına yasaldır (ölüm kanıtlı)');
  }
  const z = zincirKontrol(yol);
  assert.equal(z.ok, false);
  assert.equal(z.sebep, 'devir-zinciri-insan-kapisi-RED');
  assert.equal(z.ardisikDevir, 4);
  rmSync(d, { recursive: true, force: true });
});

test('v21: 3 ardışık devir + dolu echo → zincir OK (eşik altı; insan turu gerekmez)', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  for (let i = 1; i <= 3; i++) {
    staleKiraYaz(yol, 'eski-' + i, OLU_PID);
    const r = kiraAl(yol, { kimlik: 'nobet-' + i, pid: 2000 + i, devirSinifi: 'nobet' });
    assert.equal(r.ok, true);
  }
  const e = kiraEchoYaz(yol, { kirliSayisi: 127, sonCommit: 'e6631e4', ilkOnay: 'K7 push' });
  assert.equal(e.ok, true);
  const z = zincirKontrol(yol);
  assert.equal(z.ok, true);
  assert.equal(z.sebep, 'echo-dolu');
  assert.equal(z.ardisikDevir, 3);
  rmSync(d, { recursive: true, force: true });
});

test('v22: zincir KÖK KIRILIMI — arada yeni ilk-kira kökü varsa sayım kökten sonra (5 eski + kök + 2 yeni = 2)', () => {
  const d = tempKok();
  const yol = kiraYolu(d);
  const satirlar = [];
  for (let i = 1; i <= 5; i++) satirlar.push(JSON.stringify({ tur: 'devir', kimlik: 'eski-' + i }));
  satirlar.push(JSON.stringify({ tur: 'ilk-kira', kimlik: 'yeni-kok' })); // insan turu kökü
  satirlar.push(JSON.stringify({ tur: 'devir', kimlik: 'nobet-1' }));
  satirlar.push(JSON.stringify({ tur: 'devir', kimlik: 'nobet-2' }));
  writeFileSync(yol + '-log.jsonl', satirlar.join('\n') + '\n');
  const z = zincirKontrol(yol);
  assert.equal(z.ok, false);
  assert.equal(z.sebep, 'echo-borcu-acik'); // zincir eşiği kökle sıfırlandı; borç hâlâ açık
  assert.equal(z.ardisikDevir, 2); // kök ÖNCESİ 5 devir sayılmaz
  rmSync(d, { recursive: true, force: true });
});
