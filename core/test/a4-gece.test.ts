// A4 Otonom sürü sürücüsü — gece modu hermetik testleri (graf v12 ölçütü: "hedef+limit
// ver → gece tur serisi; rozet yeşilse açılır"; ölçüm: otonom tur sayısı + ortalama
// süre). Fixture: temp kök + taze DB (boş defterde 4 defter-sorgulu bacak hep yeşil;
// STOP mandalı fixture'ta açılır — taze DB dispatch_paused=1 doğar, DERSLER A0-3) +
// kanıt defteri elle beslenir (kanitKaydet 6 bayrak, 'dis-kanit' kaynağı — tazelik
// okuma kaynak ayrımı YAPMAZ) → rozet 'gozetimsiz-hazir'. Gece koşumu runTick +
// rozetOku enjeksiyonlarıyla izole (gerçek çocuk süreç YOK); defter kayıtları
// DİSKTEN geri okunarak doğrulanır (kanıt = disk; öz-bildirim değil).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, setGlobalStop } from '../src/store.ts';
import { kanitKaydet, KANIT_BAYRAKLARI, unattendedReadinessBeslemeli } from '../src/gozetimsiz.ts';
import { geceModu, type GeceKapanisKaydi, type GeceTurKaydi, type RozetOkuma } from '../src/gece.ts';

function kokKur(): { kok: string; dbPath: string; kanit: string; defter: string } {
  const kok = mkdtempSync(join(tmpdir(), 'a4-gece-'));
  const dbPath = join(kok, 'db.sqlite');
  const db = openStore(dbPath); // fail-closed doğar (dispatch_paused=1) — mandal fixture'ta açılır
  try {
    setGlobalStop(db, false, 'test', 'a4-gece-fixture'); // mandalı aç (resume deseni)
  } finally { db.close(); }
  return { kok, dbPath, kanit: join(kok, 'kanit.jsonl'), defter: join(kok, 'gece.jsonl') };
}

// rozet YEŞİL fixture'ı: 6 bayrağı da taze yaz (tazelik penceresi 30 dk default).
function rozetBesle(kanitYolu: string): void {
  const t = Date.now();
  for (const b of KANIT_BAYRAKLARI) {
    kanitKaydet(kanitYolu, {
      bayrak: b, kaynak: 'dis-kanit', damga: new Date(t).toISOString(), turMs: t,
      detay: 'a4-gece test fixture',
    });
  }
}

const YESIL: RozetOkuma = {
  rozet: 'gozetimsiz-hazir',
  kosullar: [{ no: 1, ad: 'fixture', gecti: true, detay: 'test' }],
};
const KIRMIZI: RozetOkuma = {
  rozet: 'gozetimsiz-kullanilamaz',
  kosullar: [{ no: 1, ad: 'fixture', gecti: false, detay: 'test-kirmizi' }],
};

const tick = (code: number, ms: number) => async () => ({ code, out: '', ms });

// sanal saat: gerçek sleep'in scheduling gecikmesi 5 ms'lik cadence'da MISFIRE doğurur
// (occurrence gecikince emit edilmez — flaky). Deterministik koşum: sleep sanal saati
// ilerletir; occurrence'lar tam anına düşer, misfire sıfır (daemon cadence testli zaten).
function sanalSaat(): { now: () => number; sleep: (ms: number) => Promise<void> } {
  let t = 1_000_000;
  // zaman sanal (occurrence'lar kadans anına tam düşer — misfire sıfır) + her sleep gerçek
  // bir event-loop turu verir: çocuğun mikrotask zinciri (tur kaydı + rozet + inFlight=null)
  // SONRAKİ döngü iterasyonundan önce tamamlanır. Pure-microtask sleep yetmez — döngü devamı
  // zincirden önce koşar, inFlight guard tur düşürür; gerçek sleep'te de Windows zamanlayıcı
  // çözünürlüğü (~15.6ms) 5 ms cadence'ı aşar → M10 misfire tur düşürür. İkisi de kapanır.
  return {
    now: () => t,
    sleep: async (ms: number) => { t += ms; await new Promise<void>((r) => setImmediate(r)); },
  };
}

function defterOku<T>(yol: string): T[] {
  return readFileSync(yol, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l) as T);
}

test('A4-1 açılış kapısı: kanıt defteri YOK → rozet kırmızı → gece AÇILMAZ (0 tur, RED, kapanış kaydı düşer)', async () => {
  const f = kokKur();
  const res = await geceModu({
    hedef: 'gece-hedef-1', turLimiti: 3, intervalMs: 5,
    dbPath: f.dbPath, kanitDefteriYolu: f.kanit, defterYolu: f.defter,
    runTick: tick(0, 100), rozetOku: () => KIRMIZI,
  });
  assert.equal(res.code, 1);
  assert.equal(res.stats.reason, 'gozetimsiz-kullanilamaz');
  assert.equal(res.stats.turSayisi, 0);
  assert.equal(res.stats.rozet, 'gozetimsiz-kullanilamaz');
  const kayitlar = defterOku(f.defter);
  assert.equal(kayitlar.length, 1); // kapanış kaydı — tur kaydı YOK
  const k = kayitlar[0] as GeceKapanisKaydi;
  assert.equal(k.kayit, 'gece-kapanis');
  assert.equal(k.reason, 'gozetimsiz-kullanilamaz');
  assert.equal(k.turSayisi, 0);
});

test('A4-2 gerçek rozet entegrasyonu: beslenen kanıt defteri + taze DB → rozet gozetimsiz-hazir (kapı bacağı birebir)', () => {
  const f = kokKur();
  rozetBesle(f.kanit);
  const db = openStore(f.dbPath);
  try {
    const r = unattendedReadinessBeslemeli(db, f.kanit, 30 * 60_000);
    assert.equal(r.rozet, 'gozetimsiz-hazir');
    assert.equal(r.kosullar.filter((c) => c.gecti).length, 6);
  } finally { db.close(); }
});

test('A4-3 rozet yeşil + limit: gece tur serisi koşar → limit-doldu temiz kapanış; tur sayısı + ortalama süre ölçülür', async () => {
  const f = kokKur();
  const s = sanalSaat();
  const res = await geceModu({
    hedef: 'gece-hedef-2', turLimiti: 3, intervalMs: 5,
    dbPath: f.dbPath, kanitDefteriYolu: f.kanit, defterYolu: f.defter,
    runTick: tick(0, 120), rozetOku: () => YESIL,
    now: s.now, sleep: s.sleep,
  });
  assert.equal(res.code, 0);
  assert.equal(res.stats.reason, 'limit-doldu');
  assert.equal(res.stats.turSayisi, 3);
  assert.equal(res.stats.ok, 3);
  assert.equal(res.stats.failed, 0);
  assert.equal(res.stats.ortalamaMs, 120);
  assert.equal(res.stats.toplamMs, 360);
  assert.equal(res.stats.rozet, 'gozetimsiz-hazir');
});

test('A4-4 tur kayıtları gece defterine düşer (fsync append): 3 gece-turu + 1 gece-kapanis, alanlar tam', async () => {
  const f = kokKur();
  const s = sanalSaat();
  await geceModu({
    hedef: 'defter-hedefi', turLimiti: 3, intervalMs: 5,
    dbPath: f.dbPath, kanitDefteriYolu: f.kanit, defterYolu: f.defter,
    runTick: tick(0, 50), rozetOku: () => YESIL,
    now: s.now, sleep: s.sleep,
  });
  const kayitlar = defterOku<GeceTurKaydi | GeceKapanisKaydi>(f.defter);
  const turlar = kayitlar.filter((k) => k.kayit === 'gece-turu') as GeceTurKaydi[];
  const kapanis = kayitlar.filter((k) => k.kayit === 'gece-kapanis') as GeceKapanisKaydi[];
  assert.equal(turlar.length, 3);
  assert.deepEqual(turlar.map((t) => t.tur), [1, 2, 3]);
  for (const t of turlar) {
    assert.equal(t.hedef, 'defter-hedefi');
    assert.equal(t.code, 0);
    assert.equal(t.ms, 50);
    assert.ok(t.damga.endsWith('Z'));
  }
  assert.equal(kapanis.length, 1);
  const k = kapanis[0];
  assert.equal(k.hedef, 'defter-hedefi');
  assert.equal(k.turSayisi, 3);
  assert.equal(k.reason, 'limit-doldu');
  assert.equal(k.ortalamaMs, 50);
  assert.ok(k.damga.endsWith('Z'));
});

test('A4-5 ortalama süre farklı turlarda doğru ölçülür (100+300 → ort 200, toplam 400)', async () => {
  const f = kokKur();
  const s = sanalSaat();
  const msler = [100, 300];
  let i = 0;
  const res = await geceModu({
    hedef: 'h', turLimiti: 2, intervalMs: 5,
    dbPath: f.dbPath, kanitDefteriYolu: f.kanit, defterYolu: f.defter,
    runTick: () => { const o = { code: 0, out: '', ms: msler[i++ % msler.length] }; return Promise.resolve(o); },
    rozetOku: () => YESIL,
    now: s.now, sleep: s.sleep,
  });
  assert.equal(res.stats.turSayisi, 2);
  assert.equal(res.stats.toplamMs, 400);
  assert.equal(res.stats.ortalamaMs, 200);
});

test('A4-6 canlılık: rozet tur ortasında kırmızıya düşer → seri kendini kapatır (rozet-kapandi, temiz çıkış)', async () => {
  const f = kokKur();
  const s = sanalSaat();
  let cagrilar = 0;
  const rozetOku = (): RozetOkuma => {
    cagrilar++;
    // 1. çağrı = açılış kapısı (yeşil); 2. çağrı = 1. tur sonrası (kırmızı) → köprü kapanır
    return cagrilar <= 1 ? YESIL : KIRMIZI;
  };
  const res = await geceModu({
    hedef: 'h', turLimiti: 5, intervalMs: 5,
    dbPath: f.dbPath, kanitDefteriYolu: f.kanit, defterYolu: f.defter,
    runTick: tick(0, 30), rozetOku,
    now: s.now, sleep: s.sleep,
  });
  assert.equal(res.stats.reason, 'rozet-kapandi');
  assert.equal(res.stats.turSayisi, 1); // tur 1 kaydedildi, seri durdu
  assert.equal(res.code, 0); // koruma davranışı — temiz kapanış, etiket dürüst
  const kayitlar = defterOku<GeceKapanisKaydi>(f.defter);
  assert.equal(kayitlar[kayitlar.length - 1].reason, 'rozet-kapandi');
});

test('A4-7 dış duruş (signal): shouldStop → temiz çıkış, reason signal', async () => {
  const f = kokKur();
  const s = sanalSaat();
  const res = await geceModu({
    hedef: 'h', turLimiti: 5, intervalMs: 5,
    dbPath: f.dbPath, kanitDefteriYolu: f.kanit, defterYolu: f.defter,
    runTick: tick(0, 10), rozetOku: () => YESIL,
    shouldStop: () => true,
    now: s.now, sleep: s.sleep,
  });
  assert.equal(res.stats.reason, 'signal');
  assert.equal(res.code, 0);
});

test('A4-8 fail-closed: 3 üst üste kırmızı çocuk → daemon sözleşmesi aynen (reason fail-closed, code nonzero, 3 tur kaydı denetim izi)', async () => {
  const f = kokKur();
  const s = sanalSaat();
  const res = await geceModu({
    hedef: 'h', turLimiti: 10, intervalMs: 5,
    dbPath: f.dbPath, kanitDefteriYolu: f.kanit, defterYolu: f.defter,
    runTick: tick(1, 10), rozetOku: () => YESIL,
    now: s.now, sleep: s.sleep,
  });
  assert.equal(res.stats.reason, 'fail-closed');
  assert.notEqual(res.code, 0);
  assert.equal(res.stats.turSayisi, 3);
  assert.equal(res.stats.failed, 3);
  const turlar = defterOku<GeceTurKaydi>(f.defter).filter((k) => k.kayit === 'gece-turu');
  assert.equal(turlar.length, 3);
  assert.ok(turlar.every((t) => t.code === 1));
});

test('A4-9 ok/failed sayımı karışık turlarda doğru (0,1,0 → ok 2 failed 1)', async () => {
  const f = kokKur();
  const s = sanalSaat();
  const kodlar = [0, 1, 0];
  let i = 0;
  const res = await geceModu({
    hedef: 'h', turLimiti: 3, intervalMs: 5,
    dbPath: f.dbPath, kanitDefteriYolu: f.kanit, defterYolu: f.defter,
    runTick: () => { const o = { code: kodlar[i++ % kodlar.length], out: '', ms: 10 }; return Promise.resolve(o); },
    rozetOku: () => YESIL,
    now: s.now, sleep: s.sleep,
  });
  assert.equal(res.stats.turSayisi, 3);
  assert.equal(res.stats.ok, 2);
  assert.equal(res.stats.failed, 1);
  assert.equal(res.stats.reason, 'limit-doldu');
});

test('A4-10 parametre doğrulama RED: hedef boş / turLimiti geçersiz / kanıt defteri yolu boş → döngüye girilmez, kapanış kaydı yine düşer', async () => {
  const f = kokKur();
  const r1 = await geceModu({
    hedef: '  ', turLimiti: 3, intervalMs: 5,
    dbPath: f.dbPath, kanitDefteriYolu: f.kanit, defterYolu: f.defter,
    runTick: tick(0, 10), rozetOku: () => YESIL,
  });
  assert.equal(r1.code, 1);
  assert.equal(r1.stats.reason, 'parametre-gecersiz');
  assert.equal(r1.stats.turSayisi, 0);

  const r2 = await geceModu({
    hedef: 'h', turLimiti: 0, intervalMs: 5,
    dbPath: f.dbPath, kanitDefteriYolu: f.kanit, defterYolu: f.defter,
    runTick: tick(0, 10), rozetOku: () => YESIL,
  });
  assert.equal(r2.stats.reason, 'parametre-gecersiz');

  const r3 = await geceModu({
    hedef: 'h', turLimiti: 3, intervalMs: 5,
    dbPath: f.dbPath, kanitDefteriYolu: '', defterYolu: f.defter,
    runTick: tick(0, 10), rozetOku: () => YESIL,
  });
  assert.equal(r3.stats.reason, 'parametre-gecersiz');

  const kayitlar = defterOku<GeceKapanisKaydi>(f.defter);
  assert.equal(kayitlar.length, 3); // her RED kendi kapanışını düşürdü (denetim izi)
  assert.ok(kayitlar.every((k) => k.reason === 'parametre-gecersiz'));
});

test('A4-11 gerçek rozet + enjeksiyonsuz koşum: beslenen defterle açılış kapisi gerçek sorgudan geçer (bütünleşik bacak)', async () => {
  const f = kokKur();
  rozetBesle(f.kanit); // gerçek rozetOku kullanılacak — 6 taze bayrak
  const s = sanalSaat(); // tazelik: fixture kayıtları gerçek Date.now() taşır → sanal now'a göre daima pencere içinde
  const res = await geceModu({
    hedef: 'butunlesik', turLimiti: 2, intervalMs: 5,
    dbPath: f.dbPath, kanitDefteriYolu: f.kanit, defterYolu: f.defter,
    runTick: tick(0, 15), // rozetOku enjekte EDİLMEDİ — varsayılan gerçek sorgu
    now: s.now, sleep: s.sleep,
  });
  assert.equal(res.code, 0);
  assert.equal(res.stats.reason, 'limit-doldu');
  assert.equal(res.stats.turSayisi, 2);
  assert.equal(res.stats.acilisKosullar.filter((c) => c.gecti).length, 6);
});
