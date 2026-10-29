// kapanis-taslak.test.mjs — kapanis-taslak.ps1'in testi (v8 madde V8-02b / K0053 pilot K0053-PILOT-1, 2026-10-29)
// Koşum: node --test scripts/kapanis-taslak.test.mjs (repo kökünden)
// Desen: hedefli-test.test.mjs — izole temp fixture + fail-closed vakaları; repo dosyalarına DOKUNMAZ
// (powershell.exe alt-koşumunun cwd'si de temp fixture'tır — kazara cwd-yazımı bile repoya düşmez).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ps1 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'kapanis-taslak.ps1');

// alt-koşum: powershell.exe -File ... ; hata durumunda da stdout+exit kodu yakalanır
function kos(args) {
  try {
    const out = execFileSync('powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', ps1, ...args],
      { encoding: 'utf8', timeout: 120000, cwd: gecici });
    return { code: 0, out };
  } catch (hata) {
    return { code: hata.status ?? 1, out: ((hata.stdout || '') + (hata.stderr || '')) };
  }
}

const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'kapanis-taslak-'));
const kanalDeger = { d: '2026-10-29T09:20:31.0000000+03:00', h: 'ab12cd3', x: 0, test: 'k0053-pilot-1', sureSn: 130 };
const onceDeger = { d: '2026-10-28T23:13:52.4148411+03:00', h: '39f46e4', x: 0, test: 'v9-06', sureSn: 125 };
const kanalYolu = path.join(gecici, 'kanal.json');
const onceYolu = path.join(gecici, 'once.json');
fs.writeFileSync(kanalYolu, JSON.stringify(kanalDeger));
fs.writeFileSync(onceYolu, JSON.stringify(onceDeger));

const tamArgs = (cikti) => [
  '-DalgaId', 'K0053-PILOT-1',
  '-Commits', 'c0ffee1,  0badf00', // trim + boşluk dayanıklılığı
  '-KanalJson', kanalYolu,
  '-TurBas', '2026-10-29 08:55:12',
  '-TurSon', '2026-10-29 09:20:31',
  '-CiktiDir', cikti,
];
// 08:55:12 -> 09:20:31 = 1519 sn (ölçülmüş duvar)
const duvarSn = 1519;

test('kaynak: ps1 BOM\'suz ve tamamı ASCII (PS 5.1 kod sayfası tuzağı — K-0051)', () => {
  const ham = fs.readFileSync(ps1);
  assert.ok(ham.length > 3, 'ps1 çok küçük');
  assert.ok(!(ham[0] === 0xEF && ham[1] === 0xBB && ham[2] === 0xBF), 'BOM var — kaldırılmalı (BOM\'suz UTF-8 şart)');
  for (let i = 0; i < ham.length; i++) {
    if (ham[i] > 0x7F) assert.fail('ASCII dışı bayt konum ' + i + ': 0x' + ham[i].toString(16) + ' (PS 5.1 BOM\'suz dosyayı ANSI okur — mojibake)');
  }
});

test('mutlu yol: tabanlı TASLAK.md + TASLAK.json üretilir, alanlar içinde (dalgaId, commits, kanal d/h/x/sureSn, ölçüm çifti satırları)', { timeout: 120000 }, () => {
  const cikti = path.join(gecici, 'cikti-a');
  const r = kos([...tamArgs(cikti), '-OnceKanalJson', onceYolu]);
  assert.equal(r.code, 0, 'çıktı: ' + r.out);
  assert.match(r.out, /KAPANIS-TASLAK-OK/);
  assert.match(r.out, /taban VAR/);
  // BOM'suz çıktılar
  const mdHam = fs.readFileSync(path.join(cikti, 'TASLAK.md'));
  assert.ok(!(mdHam[0] === 0xEF && mdHam[1] === 0xBB && mdHam[2] === 0xBF), 'TASLAK.md BOM\'lu olmamalı');
  const md = mdHam.toString('utf8');
  const js = JSON.parse(fs.readFileSync(path.join(cikti, 'TASLAK.json'), 'utf8'));
  // TASLAK.json alanları
  assert.equal(js.dalgaId, 'K0053-PILOT-1');
  assert.deepEqual(js.commits, ['c0ffee1', '0badf00']);
  assert.equal(js.kanal.d, kanalDeger.d);
  assert.equal(js.kanal.h, 'ab12cd3');
  assert.equal(js.kanal.x, 0);
  assert.equal(js.kanal.test, 'k0053-pilot-1');
  assert.equal(js.kanal.sureSn, 130);
  assert.equal(js.duvarSn, duvarSn);
  assert.equal(js.olcumCifti.tabanVar, true);
  assert.equal(js.olcumCifti.red, false);
  assert.equal(js.olcumCifti.kanalSn.once, 125);
  assert.equal(js.olcumCifti.kanalSn.sonra, 130);
  assert.equal(js.olcumCifti.x.once, 0);
  assert.equal(js.olcumCifti.x.sonra, 0);
  assert.equal(js.olcumCifti.duvarSn.once, null); // kanal JSON şemasında duvar alanı yok — uydurma YOK
  assert.equal(js.olcumCifti.duvarSn.sonra, duvarSn);
  assert.equal(js.olcumCifti.turKosum.once.kosum, 1);
  assert.equal(js.olcumCifti.turKosum.sonra.tur, 1);
  assert.equal(js.olcumCifti.turKosum.sonra.kosum, 1);
  // TASLAK.md alanları (damga + graf/kabul/SENARYO satırları + ölçüm çifti tablosu satırları)
  const beklenenler = [
    'K0053-PILOT-1',
    'c0ffee1 + 0badf00',
    'd=' + kanalDeger.d + ' h=ab12cd3 x=0 test=k0053-pilot-1 sureSn=130',
    '- graf: K0053-PILOT-1',
    '- kabul: K0053-PILOT-1',
    '- SENARYO: K0053-PILOT-1',
    '| kanal suresi (sn) | 125 | 130 |',
    '| duvar suresi (sn, tur baslangic -> kapanis, olculmus) | TABAN YOK (kanal JSON semasinda duvar alani yok - uydurma YASAK) | ' + duvarSn + ' |',
    '| x (basarisiz kosum sayisi) | 0 | 0 |',
    'STATE_BOARD otomasyonu YOK',
    'TABAN KISMI',
    'OnceKanalJson: ' + onceYolu,
  ];
  for (const beklenen of beklenenler) {
    assert.ok(md.includes(beklenen), 'TASLAK.md içermiyor: ' + JSON.stringify(beklenen));
  }
  assert.ok(!md.includes('TABAN YOK - olcum cifti eksik'), 'tabanlı koşumda RED metni olmamalı');
  assert.ok(!('fail' in js.kanal), 'fail alanı yoksa UYDURULMAMALI (girdide yok)');
});

test('tabansız: -OnceKanalJson verilmezse ÖNCE sütunu TABAN YOK + RED; taslak yine üretilir (exit 0, RED taslakta)', { timeout: 120000 }, () => {
  const cikti = path.join(gecici, 'cikti-red');
  const r = kos(tamArgs(cikti));
  assert.equal(r.code, 0, 'çıktı: ' + r.out);
  assert.match(r.out, /taban YOK/);
  const md = fs.readFileSync(path.join(cikti, 'TASLAK.md'), 'utf8');
  const js = JSON.parse(fs.readFileSync(path.join(cikti, 'TASLAK.json'), 'utf8'));
  assert.equal(js.olcumCifti.tabanVar, false);
  assert.equal(js.olcumCifti.red, true);
  assert.equal(js.olcumCifti.kanalSn.once, null);
  assert.ok(md.includes('TABAN YOK - olcum cifti eksik'), 'RED durum metni olmalı');
  assert.ok(md.includes('KAPANAMAZ'), 'ölçümsüz hız iddiası kapanamaz kuralı metinde olmalı (V9-04 s7)');
  assert.ok(md.includes('| kanal suresi (sn) | TABAN YOK | 130 |'), 'ÖNCE hücresi TABAN YOK olmalı');
});

test('eksik -KanalJson: exit 1 ADIYLA sebep + yan etki yok (çıktı dizini doğmaz)', { timeout: 120000 }, () => {
  const args = [...tamArgs(path.join(gecici, 'cikti-b'))];
  const i = args.indexOf('-KanalJson');
  args.splice(i, 2);
  const r = kos(args);
  assert.equal(r.code, 1, 'çıktı: ' + r.out);
  assert.match(r.out, /KAPANIS-TASLAK-RED/);
  assert.match(r.out, /KanalJson yok/);
  assert.match(r.out, /olcumsuz hiz iddiasi kapanamaz/);
  assert.ok(!fs.existsSync(path.join(gecici, 'cikti-b')), 'fail-closed: hata durumunda çıktı dizini doğmamalı');
});

test('bozuk JSON: exit 1 ADIYLA (KanalJson okunamıyor)', { timeout: 120000 }, () => {
  const bozuk = path.join(gecici, 'bozuk.json');
  fs.writeFileSync(bozuk, '{ bu json bozuk');
  const args = tamArgs(path.join(gecici, 'cikti-c'));
  args[args.indexOf('-KanalJson') + 1] = bozuk;
  const r = kos(args);
  assert.equal(r.code, 1, 'çıktı: ' + r.out);
  assert.match(r.out, /KAPANIS-TASLAK-RED/);
  assert.match(r.out, /bozuk JSON/);
});

test('alanı eksik JSON: exit 1 ADIYLA (zorunlu: d,h,x,test,sureSn — test-kanal.ps1 şeması)', { timeout: 120000 }, () => {
  const eksikJson = path.join(gecici, 'eksik.json');
  fs.writeFileSync(eksikJson, JSON.stringify({ d: '2026-10-29T09:20:31+03:00', h: 'ab12cd3', x: 0 }));
  const args = tamArgs(path.join(gecici, 'cikti-d'));
  args[args.indexOf('-KanalJson') + 1] = eksikJson;
  const r = kos(args);
  assert.equal(r.code, 1, 'çıktı: ' + r.out);
  assert.match(r.out, /KAPANIS-TASLAK-RED/);
  assert.match(r.out, /zorunlu alani eksik/);
  assert.match(r.out, /test, sureSn/);
});

test('sayı olmayan sureSn: exit 1 ADIYLA (uydurma/ölçümsüz değer reddi)', { timeout: 120000 }, () => {
  const kotu = path.join(gecici, 'kotu.json');
  fs.writeFileSync(kotu, JSON.stringify({ d: '2026-10-29T09:20:31+03:00', h: 'ab12cd3', x: 0, test: 't', sureSn: 'hizli' }));
  const args = tamArgs(path.join(gecici, 'cikti-e'));
  args[args.indexOf('-KanalJson') + 1] = kotu;
  const r = kos(args);
  assert.equal(r.code, 1, 'çıktı: ' + r.out);
  assert.match(r.out, /KAPANIS-TASLAK-RED/);
  assert.match(r.out, /sayi degil/);
});

test('diğer fail-closed vakaları: eksik -DalgaId / bozuk -TurBas / TurSon<TurBas — hepsi exit 1 ADIYLA', { timeout: 240000 }, () => {
  const cikti = path.join(gecici, 'cikti-f');
  const dalgaYok = [...tamArgs(cikti)];
  dalgaYok.splice(dalgaYok.indexOf('-DalgaId'), 2);
  const r1 = kos(dalgaYok);
  assert.equal(r1.code, 1, 'çıktı: ' + r1.out);
  assert.match(r1.out, /KAPANIS-TASLAK-RED/);
  assert.match(r1.out, /DalgaId yok/);

  const turBozuk = tamArgs(cikti);
  turBozuk[turBozuk.indexOf('-TurBas') + 1] = 'yarin-sabah';
  const r2 = kos(turBozuk);
  assert.equal(r2.code, 1, 'çıktı: ' + r2.out);
  assert.match(r2.out, /KAPANIS-TASLAK-RED/);
  assert.match(r2.out, /TurBas cozumlenemiyor/);

  const tersZaman = tamArgs(cikti);
  tersZaman[tersZaman.indexOf('-TurBas') + 1] = '2026-10-29 09:20:31';
  tersZaman[tersZaman.indexOf('-TurSon') + 1] = '2026-10-29 08:55:12';
  const r3 = kos(tersZaman);
  assert.equal(r3.code, 1, 'çıktı: ' + r3.out);
  assert.match(r3.out, /KAPANIS-TASLAK-RED/);
  assert.match(r3.out, /once olamaz/);
});

test('determinizm: aynı girdi iki koşumda bayt-bayt aynı TASLAK.md + TASLAK.json', { timeout: 240000 }, () => {
  const c1 = path.join(gecici, 'det-1');
  const c2 = path.join(gecici, 'det-2');
  kos([...tamArgs(c1), '-OnceKanalJson', onceYolu]);
  kos([...tamArgs(c2), '-OnceKanalJson', onceYolu]);
  assert.equal(fs.readFileSync(path.join(c1, 'TASLAK.md'), 'utf8'), fs.readFileSync(path.join(c2, 'TASLAK.md'), 'utf8'), 'TASLAK.md farklı');
  assert.equal(fs.readFileSync(path.join(c1, 'TASLAK.json'), 'utf8'), fs.readFileSync(path.join(c2, 'TASLAK.json'), 'utf8'), 'TASLAK.json farklı');
});

// izolasyon: fixture ağacının tüm dosyaları içerikleriyle fotoğraflanır; koşum sonrası
// değişen/eklenen YOK, eklenen yalnız CiktiDir altındaki TASLAK.md + TASLAK.json
function durumFotografi() {
  const m = new Map();
  const gez = (dizin) => {
    for (const ad of fs.readdirSync(dizin)) {
      const p = path.join(dizin, ad);
      if (fs.statSync(p).isDirectory()) gez(p);
      else m.set(p, fs.readFileSync(p, 'utf8'));
    }
  };
  gez(gecici);
  return m;
}

test('izolasyon: fixture (ve powershell cwd) dışında hiçbir dosya değişmez — yalnız CiktiDir içine yazılır', { timeout: 120000 }, () => {
  const onceki = durumFotografi();
  const cikti = path.join(gecici, 'cikti-izolasyon');
  const r = kos([...tamArgs(cikti), '-OnceKanalJson', onceYolu]);
  assert.equal(r.code, 0, 'çıktı: ' + r.out);
  const sonraki = durumFotografi();
  const eklenen = [...sonraki.keys()].filter((p) => !onceki.has(p)).sort();
  assert.deepEqual(eklenen, [path.join(cikti, 'TASLAK.json'), path.join(cikti, 'TASLAK.md')].sort(), 'eklenen dosyalar yalnız TASLAK çıktıları olmalı');
  const silinen = [...onceki.keys()].filter((p) => !sonraki.has(p));
  assert.deepEqual(silinen, [], 'dosya silinmemeli');
  for (const [p, icerik] of onceki) {
    if (sonraki.has(p)) assert.equal(sonraki.get(p), icerik, 'değişmemeli: ' + p);
  }
  // kanal/once JSON'ları (girdiler) birebir korunur
  assert.equal(sonraki.get(kanalYolu), JSON.stringify(kanalDeger));
  assert.equal(sonraki.get(onceYolu), JSON.stringify(onceDeger));
});

test('temizlik: gecici fixture koşum sonunda silinir', () => {
  fs.rmSync(gecici, { recursive: true, force: true });
  assert.ok(!fs.existsSync(gecici), 'temp fixture silinmeli (geçici dosya bırakma — görev sınırı)');
});
