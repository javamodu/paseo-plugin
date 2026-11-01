// BAKIM GP-1 (2026-11-01) — pano/deney-server.mjs düzeltme paketi testleri (node --test).
// Kapsam: GD-001 (CORS sabit-değer + POST token kapısı 403/401/200) · GD-002 (manager-yanit
// kaydına «doğrulanmamış» işareti) · GD-008 (veri değişmediğinde diskten yeniden okuma YOK —
// okunan-bayt/sayaç ölçümüyle; JSONL son-N TAIL penceresi; perf_hooks ölçüm kaydı üretiyor).
// Desen: kapsul-tuval.test.mjs (fail-closed — kaynak okunamazsa vakalar ADIYLA kırmızıya düşer)
// + gerçek fetch (d1a/d1b hermetik deseni). İZOLASYON: veri dosyaları TEMP kopyalarında
// (canlı raporlar/deney-canli-panel-2026-10-29/ dizinine YAZMA YOK); izole koşum portu 4936
// (4934 ORDU-1 olabilir — çakışma YASAK; doluysa gecici porta düşer); test token'ı BELLEKTE
// üretilir (crypto.randomBytes) — DEĞERİ HİÇBİR dosyaya/log'a/assert mesajına yazılmaz (SH-g).
// Kapanışta sunucu kapat + temp temizlik (after kancası — hata durumunda da koşar).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { appendFileSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat, kapat, olcumOku } from './deney-server.mjs';

// --- izolasyon kurulumu ------------------------------------------------------------

delete process.env.PANO_TOKEN;      // test sürecinde env'den değil AÇIK değerden çözülür
delete process.env.DENEY_CORS_ORIGIN;
delete process.env.DENEY_DIR;
delete process.env.DENEY_PORT;

const TOKEN = randomBytes(24).toString('hex'); // bellekte — değeri hiçbir yere yazılmaz

const tempKok = () => mkdtempSync(join(tmpdir(), 'bakim-gp1-'));
const dirA = tempKok(); // GD-008 ölçüm dizini (yalnız GET'ler + dışarıdan append)
const dirB = tempKok(); // kimlik/yazma testi dizini (POST'lar buraya yazar)

// dirA fikstürleri: gerçek dosya şekilleri (canlı deney dizininden modellendi; küçük izole kopya).
writeFileSync(join(dirA, 'saglayicilar.json'), JSON.stringify({ list: [{ id: 'sag-a', label: 'Sag A', enabled: true }] }));
writeFileSync(join(dirA, 'modeller.json'), JSON.stringify({ saglayicilar: { 'sag-a': [{ id: 'model-a' }] } }));
writeFileSync(join(dirA, 'workspaces.json'), JSON.stringify({ toplam: 1, deneyWorkspace: { workspaceId: 'wks_t' }, digerlerindenOrnek: [] }));
writeFileSync(join(dirA, 'ajanlar.json'), JSON.stringify({ kosanPaseo: [], ornek: [{ ad: 'ORDU-TEST', rol: 'CODER' }] }));
writeFileSync(join(dirA, 'gorevler.json'), JSON.stringify({ gorevler: [{ id: 'G1', gorev: 'izole test gorevi', rol: 'CODER', dizin: 'D:/temp', durum: 'ACIK' }] }));
// log.jsonl: 400 satır (~140 B/satır ≈ 56 KB) — 16 KiB TAIL penceresinin bariz üstünde;
// pencere ~117 satır taşır (>= 80 kuyruk), tam tarama ise 400 satır okurdu (fark pinlenir).
const logSatir = (i) => JSON.stringify({ t: '2026-11-01T00:00:00.000Z', tur: 'test', metin: 'x'.repeat(90), sira: i });
writeFileSync(join(dirA, 'log.jsonl'), Array.from({ length: 400 }, (_, i) => logSatir(i)).join('\n') + '\n');
writeFileSync(join(dirA, 'mudahale.jsonl'), JSON.stringify({ t: '2026-11-01T00:00:00.000Z', kim: 'insan:web', not: 'taban' }) + '\n');
writeFileSync(join(dirA, 'atamalar.jsonl'), '');
// manager-kuyruk: 5 api-test + 10 chat (son 10'in tamamı chat → bekleyenIs=10, son-N semantiği)
{
  const satirlar = [];
  for (let i = 0; i < 5; i++) satirlar.push(JSON.stringify({ t: '2026-11-01T00:00:00.000Z', is: 'api-test', sira: i }));
  for (let i = 5; i < 15; i++) satirlar.push(JSON.stringify({ t: '2026-11-01T00:00:00.000Z', is: 'chat', sira: i }));
  writeFileSync(join(dirA, 'manager-kuyruk.jsonl'), satirlar.join('\n') + '\n');
}

const logYolu = join(dirA, 'log.jsonl');

// --- sunucu yaşam döngüsü yardımcıları ----------------------------------------------

let adr = null; // aktif sunucu adresi (testler sırayla kullanır — node:test dosya içi sıralı)
const kok = () => 'http://127.0.0.1:' + (adr ? adr.port : 0);

// İzole koşum portu 4936 (brief); doluysa (EADDRINUSE) gecici porta düşer — çakışma YASAK.
async function sunucuAc(dir, secenekler) {
  try { await kapat(); } catch { /* sunucu yok — sorun değil */ }
  try {
    adr = await baslat(4936, dir, secenekler);
  } catch (e) {
    if (e && e.code === 'EADDRINUSE') adr = await baslat(0, dir, secenekler);
    else throw e;
  }
}
async function sunucuKapat() {
  try { await kapat(); } catch { /* zaten kapalı */ }
  adr = null;
  // kapat → aynı port yeniden bağlan döngüsünde undici keep-alive havuzundaki ÖLÜ soketi
  // bir tick bekletmeden kullanmak ECONNRESET yarışına girer — soket kapanış olaylarının
  // işlenmesi için kısa bekleme (yeni fetch taze soket açar).
  await new Promise((r) => setTimeout(r, 80));
}

// fetch sarmalayıcı: ÖLÜ soket yarışı yine de yakalanırsa TEK yeniden deneme (istek sunucuya
// hiç ulaşmamıştır — çift sunucu-yan etkisi YOK; 100ms sonra havuz boşalır, taze soket açılır).
async function istek(yol, secenekler) {
  try {
    return await fetch(kok() + yol, secenekler);
  } catch (e) {
    await new Promise((r) => setTimeout(r, 100));
    return await fetch(kok() + yol, secenekler);
  }
}

const post = (yol, govde, token) => istek(yol, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(token ? { 'x-pano-token': token } : {}) },
  body: JSON.stringify(govde),
});

after(async () => {
  await sunucuKapat();
  for (const d of [dirA, dirB]) { try { rmSync(d, { recursive: true, force: true }); } catch { /* temp zaten yok */ } }
});

// --- GD-001: CORS sabit-değer + token kapısı ----------------------------------------

test('GD-001a: CORS varsayılan SABİT değer http://127.0.0.1:4377 (yıldız YOK) + preflight 204 + X-Pano-Token başlığına izin', async () => {
  await sunucuAc(dirA, { token: TOKEN });
  const r = await istek('/api/deney/durum');
  assert.equal(r.status, 200, 'GET durum açık kalmalı (yalnız POST kapılanır)');
  assert.equal(r.headers.get('access-control-allow-origin'), 'http://127.0.0.1:4377', 'ACAO sabit-değer değil');
  const p = await istek('/api/deney/mudahale', { method: 'OPTIONS' });
  assert.equal(p.status, 204, 'preflight 204 olmalı');
  assert.equal(p.headers.get('access-control-allow-origin'), 'http://127.0.0.1:4377', 'preflight ACAO sabit-değer değil');
  const izinli = p.headers.get('access-control-allow-headers') || '';
  assert.ok(izinli.includes('X-Pano-Token'), 'token başlığı preflight izninde olmalı: ' + izinli);
});

test('GD-001b: POST token YOK → 401 · token YANLIŞ → 401 · token DOĞRU → 200', async () => {
  await sunucuKapat(); // yazma testleri dirB'ye (ölçüm dizini dirA'yı GET'le kirletmemeli)
  await sunucuAc(dirB, { token: TOKEN });
  assert.equal((await post('/api/deney/mudahale', { metin: 'izin denemesi' }, null)).status, 401, 'başlıksız POST 401 olmalı');
  assert.equal((await post('/api/deney/mudahale', { metin: 'izin denemesi' }, 'yanlis-token')).status, 401, 'yanlış token 401 olmalı');
  const r = await post('/api/deney/mudahale', { metin: 'tokenlı yazım' }, TOKEN);
  assert.equal(r.status, 200, 'doğru tokenlı POST 200 olmalı');
  assert.equal((await r.json()).tamam, true);
});

test('GD-001c: token ÇÖZÜMLENMEMİŞ (PANO_TOKEN yok) → 403 fail-closed', async () => {
  await sunucuKapat();
  await sunucuAc(dirB, { token: null });
  const r = await post('/api/deney/mudahale', { metin: 'kapalı kapı' }, TOKEN);
  assert.equal(r.status, 403, 'token tanımsızken POST 403 olmalı');
  const j = await r.json();
  assert.ok(j.hata && j.hata.includes('PANO_TOKEN'), 'fail-closed mesajı PANO_TOKEN demeli');
});

test('GD-001d: üretim çözüm yolu — PANO_TOKEN ortam değişkeninden (açık geçersiz kılıcı YOK)', async () => {
  await sunucuKapat();
  process.env.PANO_TOKEN = TOKEN;
  try {
    await sunucuAc(dirB, {});
    const r = await post('/api/deney/mudahale', { metin: 'env yolundan yazım' }, TOKEN);
    assert.equal(r.status, 200, 'ortam değişkenli token 200 olmalı');
  } finally {
    delete process.env.PANO_TOKEN;
  }
});

test('GD-001e: DENEY_CORS_ORIGIN ortam değişkeni izole koşum kaynağını değiştirir', async () => {
  await sunucuKapat();
  process.env.DENEY_CORS_ORIGIN = 'http://127.0.0.1:7777';
  try {
    await sunucuAc(dirA, {});
    const r = await istek('/api/deney/durum');
    assert.equal(r.headers.get('access-control-allow-origin'), 'http://127.0.0.1:7777', 'env CORS kökeni uygulanmalı');
  } finally {
    delete process.env.DENEY_CORS_ORIGIN;
  }
});

test('GD-001f: CORS kökeni AÇIK geçersiz kılıcıyla (izole test kanalı)', async () => {
  await sunucuKapat();
  await sunucuAc(dirA, { corsOrigin: 'http://127.0.0.1:9999' });
  const r = await istek('/api/deney/durum');
  assert.equal(r.headers.get('access-control-allow-origin'), 'http://127.0.0.1:9999', 'geçersiz kılıcı kaynak uygulanmalı');
});

// --- GD-002: manager-yanit kaydı doğrulanmamış işareti -------------------------------

test('GD-002: tokenlı manager-yanit → 200 + kayıt dogrulanmamis:true + aktor etiketi (işaretsiz eski kayıt YOK varsayımı notta)', async () => {
  await sunucuKapat();
  await sunucuAc(dirB, { token: TOKEN });
  assert.equal((await post('/api/deney/manager-yanit', { metin: 'kimliksiz deneme' }, null)).status, 401, 'manager-yanit kapısız 401');
  const r = await post('/api/deney/manager-yanit', { metin: 'manager yanıtı (test)' }, TOKEN);
  assert.equal(r.status, 200);
  const satirlar = readFileSync(join(dirB, 'log.jsonl'), 'utf8').split(/\r?\n/).filter(Boolean).map((s) => JSON.parse(s));
  const kayitlar = satirlar.filter((k) => k.tur === 'manager-yanit');
  assert.ok(kayitlar.length >= 1, 'manager-yanit kaydı düşmeli');
  const kayit = kayitlar[kayitlar.length - 1];
  assert.equal(kayit.dogrulanmamis, true, 'kayıt dogrulanmamis:true işaretli olmalı (içerik sunucuda doğrulanamaz — E10)');
  assert.equal(kayit.aktor, 'ai-manager:glm-5.3', 'aktor etiketi sunucu-sabit kalır');
  assert.equal(kayit.metin, 'manager yanıtı (test)');
});

// --- SH-g: test token'ı hiçbir dosyaya sızmaz ---------------------------------------

test('SH-g: test token DEĞERİ hiçbir temp dosyada görünmez (log/mudahale/kuyruk taraması)', async () => {
  for (const ad of readdirSync(dirB)) {
    const icerik = readFileSync(join(dirB, ad), 'utf8');
    assert.ok(!icerik.includes(TOKEN), 'token değeri dosyaya sızdı: ' + ad);
  }
});

// --- GD-008: durum okuma katmanı (ölçümle pinlenir) ----------------------------------

test('GD-008a: perf_hooks ölçüm KAYDI üretiyor — yanıt perf alanı sayısal değerler taşıyor', async () => {
  await sunucuKapat();
  await sunucuAc(dirA, { token: TOKEN }); // taze sunucu: ölçüm dizininde sıfır durumu
  const r = await istek('/api/deney/durum');
  const j = await r.json();
  assert.ok(j.perf && typeof j.perf === 'object', 'perf alanı yok');
  assert.equal(typeof j.perf.istekSuresiMs, 'number', 'istekSuresiMs sayı değil');
  assert.ok(j.perf.istekSuresiMs >= 0, 'istekSuresiMs negatif olamaz');
  assert.equal(typeof j.perf.okunanBayt, 'number', 'okunanBayt sayı değil');
  assert.equal(typeof j.perf.okumaSayisi, 'number', 'okumaSayisi sayı değil');
  assert.ok(j.perf.okumaSayisi > 0, 'ilk çağrıda diskten okuma OLMALI');
  assert.ok(j.perf.durumIstek >= 1, 'durumIstek sayacı işlemeli');
  assert.ok(j.perf.jsonlBoyut && typeof j.perf.jsonlBoyut['log.jsonl'] === 'number', 'jsonlBoyut büyüme izi yok');
  assert.equal(j.perf.jsonlBoyut['log.jsonl'], statSync(logYolu).size, 'jsonlBoyut disk ile çelişiyor');
});

test('GD-008b: veri DEĞİŞMEDİĞİNDE diskten yeniden okuma YOK (okunan-bayt/sayaç 0)', async () => {
  const r2 = await istek('/api/deney/durum');
  const j2 = await r2.json();
  assert.equal(j2.perf.okunanBayt, 0, 'veri değişmedi — bayt okundu: ' + j2.perf.okunanBayt);
  assert.equal(j2.perf.okumaSayisi, 0, 'veri değişmedi — okuma çağrısı: ' + j2.perf.okumaSayisi);
  const o = olcumOku();
  assert.ok(o.durumIstek >= 2, 'modül ölçüm sayaçları çalışıyor');
  assert.equal(typeof o.ortSureMs, 'number', 'ortalama süre ölçümü sayısal');
});

test('GD-008c: JSONL son-N TAIL penceresi — 400 satırlık dosyadan son 80; tam tarama DEĞİL', async () => {
  const r = await istek('/api/deney/durum');
  const j = await r.json();
  assert.equal(j.log.length, 80, 'kuyruk sınırı 80 olmalı');
  assert.equal(j.log[79].sira, 399, 'son kayıt görünmeli');
  assert.equal(j.log[0].sira, 320, 'ilk kayıt 320 olmalı (son-80 penceresi)');
  // manager kuyruğu son-10 + chat filtresi
  assert.equal(j.manager.bekleyenIs, 10, 'manager bekleyenIs son-10 chat sayısı');
});

test('GD-008d: dosya değişince yeniden okunur VE okuma TAIL penceresiyle sınırlı (tam dosya DEĞİL)', async () => {
  appendFileSync(logYolu, logSatir(400) + '\n'); // dışarıdan bir yazar (sunucu restartsız görmeli)
  const r = await istek('/api/deney/durum');
  const j = await r.json();
  assert.ok(j.perf.okunanBayt > 0, 'değişiklik algılanmalı (yeniden okuma)');
  assert.ok(j.perf.okunanBayt <= 16384, 'okuma tail penceresini aşmamalı (16 KiB): ' + j.perf.okunanBayt);
  assert.ok(j.perf.okunanBayt < statSync(logYolu).size, 'tam dosya okundu — tail çalışmıyor: ' + j.perf.okunanBayt);
  assert.equal(j.log[79].sira, 400, 'yeni satır restartsız görünmeli');
  assert.equal(j.log.length, 80, 'kuyruk sınırı değişmemeli');
});

test('GD-008e: ölçüm sayacı modülden okunabilir (olcumOku — O2 puan kaynağı dışa açık)', async () => {
  const o = olcumOku();
  assert.ok(o.durumIstek >= 4, 'durum istekleri sayılıyor');
  assert.ok(o.okunanBayt > 0, 'toplam okunan bayt sayılıyor');
  assert.ok(o.diskOkuma > 0, 'disk okuma çağrıları sayılıyor');
  assert.ok(o.sonSureMs === null || typeof o.sonSureMs === 'number', 'son süre sayısal');
});
