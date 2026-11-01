// BAKIM GP-1 (2026-11-01) — pano/server.js düzeltme paketi testleri (node --test).
// Kapsam: GD-004 (token kapısı zaman-sabit — davranış 401 + kaynak pini) · GD-005 (senkron
// yazma atışı yakalanır → 500 jsonYaz; süreç crash ETMEZ — hata enjeksiyonuyla kanıt) ·
// GD-006 (gövde Buffer.concat — çok baytlı UTF-8 karakteri TCP parça sınırında BÖLÜNÜRSE
// bile tek decode ile bozulmaz; eski += deseni mojibake üretirdi).
// Desen: d1a/d1b hermetik (gerçek node çocuk süreç + gerçek fetch/ham soket) + kapsul-tuval
// kaynak-pin deseni. İZOLASYON: PANO_PORT=0 (geçici port) · PANO_KOKLER/ORDU_ATAMA_DIR/ORDU_
// KAPSUL_DIR TEMP dizinleri · test token'ı BELLEKTE üretilir (crypto.randomBytes) — değeri
// hiçbir dosyaya/log'a/assert mesajına yazılmaz (SH-g). Graf SSOT salt-okunur (gerçek dosya).
// Çok-baytlı test: sunucuya ham TCP ile İKİ parça gönderilir — parça sınırı bilinçli olarak
// 'ç' karakterinin (2 bayt) ORTASINDAN geçer; yanıt hatası echo'lu geldiği için bütünlük
// kanıtlanır (404 gövdesi bozulan gorevId'yi taşısaydı test kırmızıya düşerdi).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PANO = import.meta.dirname;
const TOKEN = randomBytes(24).toString('hex'); // bellekte — değeri hiçbir yere yazılmaz

// --- kaynak pinleri (kapsul-tuval.test.mjs deseni — fail-closed) --------------------

let SRC = '';
try { SRC = readFileSync(join(PANO, 'server.js'), 'utf8'); } catch { SRC = ''; }
const ok = (msg, cond, detay) => assert.ok(cond, 'KAYNAKTA YOK — ' + msg + (detay ? ' (' + detay + ')' : ''));

test('GD-004 kaynak: token karşılaştırması crypto.timingSafeEqual — eski !== deseni söküldü', () => {
  ok('timingSafeEqual import edilmiş', SRC.includes('timingSafeEqual'));
  ok('tokenGecerliMi yardımcısı (uzunluk ön-kontrollü) tanımlı', /function tokenGecerliMi\([^)]*\)\s*\{/.test(SRC) && SRC.includes('a.length === b.length && timingSafeEqual(a, b)'));
  ok('eski zaman-sabit-olmayan karşılaştırma kalktı', !SRC.includes('"] !== TOKEN'));
});

test('GD-005 kaynak: senkron yazma zincirleri try/catch içine alınmış (500 jsonYaz yolları)', () => {
  ok('kart yazma 500 yolu (tmp temizliği mesajı)', SRC.includes('kart yazilamadi'));
  ok('taslak defteri 500 yolu (çift-kayıt bütünlüğü mesajı)', SRC.includes('taslak defterine yazilamadi'));
  ok('onaylı md aynası 500 yolu (E10 dürüst bildirim mesajı)', SRC.includes('MD aynasi yazilamadi'));
  ok('hata mesajı Bilinmeyen-dışı atışlar için instanceof Error dalı', SRC.includes('e instanceof Error ? e.message : "bilinmeyen"'));
});

test('GD-006 kaynak: gövde toplama Buffer.concat deseni — eski += deseni söküldü', () => {
  ok('govdeTopla yardımcısı tanımlı', /function govdeTopla\(/.test(SRC));
  ok('tek decode: Buffer.concat(parcalar).toString("utf8")', SRC.includes('Buffer.concat(parcalar).toString("utf8")'));
  ok('eski buffer→string parça toplama deseni kalktı', !SRC.includes('govde += p'));
  ok('gövde limiti BAYT cinsinden sabitlenmiş', SRC.includes('GOVDE_LIMIT_BAYT'));
});

// --- hermetik çocuk süreç (d1a/d1b deseni) -------------------------------------------

const cocuklar = [];
const kokler = mkdtempSync(join(tmpdir(), 'bakim-srv-'));
const atamaDir = mkdtempSync(join(tmpdir(), 'bakim-atama-'));
const kapsulDir = mkdtempSync(join(tmpdir(), 'bakim-kapsul-'));

function sunucuBaslat(env) {
  const c = spawn(process.execPath, ['server.js'], { cwd: PANO, env: { ...process.env, ...env } });
  cocuklar.push(c);
  return new Promise((res, rej) => {
    const zamanAsimi = setTimeout(() => rej(new Error('sunucu 5 sn içinde port bildirmedi')), 5000);
    c.stdout.on('data', (d) => {
      const m = String(d).match(/127\.0\.0\.1:(\d+)/);
      if (m) { clearTimeout(zamanAsimi); res({ cocuk: c, port: Number(m[1]) }); }
    });
    c.stderr.on('data', (d) => process.stderr.write(d));
  });
}

after(() => {
  for (const c of cocuklar) { try { c.kill('SIGKILL'); } catch { /* zaten çıkmış */ } }
  for (const d of [kokler, atamaDir, kapsulDir]) { try { rmSync(d, { recursive: true, force: true }); } catch { /* temp yok */ } }
});

// Ham TCP POST — gövdeyi İKİ parça olarak yollar; parçaOfset bayt cinsinden (bilinçli olarak
// çok baytlı karakterin ortasından geçecek seçilir). Connection: close → yanıt soket kapanınca tam.
function hamPost(port, yol, token, govde, parcaOfset) {
  return new Promise((tamam, hata) => {
    const s = net.connect(port, '127.0.0.1');
    s.setNoDelay(true);
    const parcalar = [];
    let yazi = 0;
    const ust = 'POST ' + yol + ' HTTP/1.0\r\nHost: 127.0.0.1\r\nContent-Type: application/json\r\n' +
      (token ? 'X-Pano-Token: ' + token + '\r\n' : '') +
      'Content-Length: ' + govde.length + '\r\n\r\n';
    s.on('connect', () => {
      yazi = 1;
      // DİKKAT: başlık string + gövde Buffer AYRI yazılır — 'ust + buffer' string zorlaması
      // parça sınırındaki çok baytlı karakteri test ARPACIĞINDA bozardı (sunucu değil).
      s.write(ust);
      s.write(govde.subarray(0, parcaOfset));
      setTimeout(() => { if (yazi === 1) { yazi = 2; s.write(govde.subarray(parcaOfset)); s.end(); } }, 70);
    });
    s.on('data', (d) => parcalar.push(d));
    s.on('close', () => tamam(Buffer.concat(parcalar).toString('utf8')));
    s.on('error', (e) => hata(e));
    setTimeout(() => { try { s.destroy(); } catch { /* güvenlik zaman aşımı */ } }, 6000);
  });
}

function httpYanitAyir(ham) {
  const i = ham.indexOf('\r\n\r\n');
  assert.ok(i > 0, 'HTTP yanıt başlığı bulunamadı');
  const durumSatiri = ham.slice(0, ham.indexOf('\r\n'));
  const govde = ham.slice(i + 4);
  return { kod: Number(durumSatiri.split(' ')[1]), govde };
}

test('GD-004 davranış: yanlış tokenlı POST → 401 (zaman-sabit kapı yolu)', async () => {
  const s = await sunucuBaslat({ PANO_PORT: '0', PANO_KOKLER: kokler, ORDU_ATAMA_DIR: atamaDir, ORDU_KAPSUL_DIR: kapsulDir, PANO_TOKEN: TOKEN });
  const r = await fetch('http://127.0.0.1:' + s.port + '/api/kart', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Pano-Token': 'yanlis-token' }, body: JSON.stringify({ id: 'A2' }),
  });
  assert.equal(r.status, 401, 'yanlış token 401 olmalı');
  const j = await r.json();
  assert.ok(j.hata.includes('token gecersiz'), 'hata mesajı değişmemeli');
});

test('GD-006 davranış: çok baytlı UTF-8 karakteri TCP parça sınırından BÖLÜNSE bile gövde bozulmadan çözümlenir', async () => {
  const s = await sunucuBaslat({ PANO_PORT: '0', PANO_KOKLER: kokler, ORDU_ATAMA_DIR: atamaDir, ORDU_KAPSUL_DIR: kapsulDir, PANO_TOKEN: TOKEN });
  // {"gorevId":" = 12 bayt ASCII önek; 'ç' 2 bayt — TEK sayı ofset (1501) bir 'ç'nin ORTASINDAN geçer.
  const govde = Buffer.from('{"gorevId":"' + 'ç'.repeat(1500) + '","ajanId":"x"}', 'utf8');
  assert.ok(govde.length < 4096, 'gövde limit içinde olmalı');
  const ham = await hamPost(s.port, '/api/atama/taslak', TOKEN, govde, 1501);
  const { kod, govde: yanit } = httpYanitAyir(ham);
  // gövde çözümlendi → 404 (graf dışı id) + hata mesajı ECHO'LU ve BOZULMAMIŞ:
  // eski += deseni 2 adet U+FFFD üretirdi — temiz 1500'lük dizi o zaman bulunamazdı.
  assert.equal(kod, 404, 'JSON çözümlenmeli ve graf dışı id 404 dönmeli (eski desende mojibake kalırdı)');
  const j = JSON.parse(yanit);
  assert.ok(j.hata.includes('ç'.repeat(1500)), 'echo lu gorevId bozulmadan dönmeli (tek decode kanıtı)');
});

test('GD-005 davranış: yazma zinciri atarsa 500 jsonYaz — süreç CRASH ETMEZ (izleyen istek yanıtlar)', async () => {
  // Hata enjeksiyonu: ORDU_KAPSUL_DIR bir DOSYANIN altına işaret eder → mkdirSync ATAR
  // (ENOTDIR) — eski kodda yakalanmayan senkron atış süreci düşürürdü.
  const engel = join(kokler, 'engel-dosya');
  writeFileSync(engel, 'x');
  const s = await sunucuBaslat({ PANO_PORT: '0', PANO_KOKLER: kokler, ORDU_ATAMA_DIR: atamaDir, ORDU_KAPSUL_DIR: join(engel, 'kart'), PANO_TOKEN: TOKEN });
  const r = await fetch('http://127.0.0.1:' + s.port + '/api/kart', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Pano-Token': TOKEN }, body: JSON.stringify({ id: 'A2' }),
  });
  assert.equal(r.status, 500, 'yazma hatası 500 olmalı (crash değil yanıt)');
  const j = await r.json();
  assert.ok(j.hata.includes('kart yazilamadi'), 'hata kart yazma yolunu söylemeli: ' + j.hata);
  // süreç AYAKTA: izleyen istek normal yanıtlıyor (crash olsaydı bağlantı reddedilirdi)
  const r2 = await fetch('http://127.0.0.1:' + s.port + '/api/repolar');
  assert.equal(r2.status, 200, 'hata sonrası süreç ayakta olmalı');
  assert.equal((await r2.json()).repolar.length, 0, 'izole KOKLER — boş repo listesi');
});
