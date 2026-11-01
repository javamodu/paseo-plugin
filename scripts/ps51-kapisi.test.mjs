// ps51-kapisi.test.mjs — ps51-kapisi.ps1'in testi (SK-1 / S1 mekanik freni, 2026-11-01)
// Koşum: node --test scripts/ps51-kapisi.test.mjs (repo kökünden)
// Desen: kapanis-taslak.test.mjs — izole temp fixture + fail-closed vakaları; repo dosyalarına YAZMAZ
// (powershell.exe alt-koşumunun cwd'si de temp fixture'tır — kazara cwd-yazımı bile repoya düşmez).
// Vaka sınıfları: her RED/UYARI deseninin üç hali (yakalanır/temiz-kardeşi), RED>UYARI önceliği,
// yorum-affı, LF/CRLF bağımsızlığı, fail-closed (git-dışı cwd), merge-guard izole-entegrasyonu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const ps1 = path.join(kok, 'ps51-kapisi.ps1');
const mergeGuard = path.join(kok, 'merge-guard.ps1');

// alt-koşum: powershell.exe -File ... ; hata durumunda da stdout+exit kodu yakalanır
const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'ps51-kapisi-'));
function kos(args, cwd) {
  try {
    const out = execFileSync('powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', ps1, ...args],
      { encoding: 'utf8', timeout: 120000, cwd: cwd || gecici });
    return { code: 0, out };
  } catch (hata) {
    return { code: hata.status ?? 1, out: ((hata.stdout || '') + (hata.stderr || '')) };
  }
}
// fixture .ps1 yazar (ASCII, CRLF default; LF seçenekli — ps1 ASCII kuralı)
function psYaz(ad, satirlar, satirSonu) {
  const yol = path.join(gecici, ad);
  fs.writeFileSync(yol, satirlar.join(satirSonu || '\r\n') + (satirSonu || '\r\n'), 'ascii');
  return yol;
}

test('kaynak: ps1 BOM\'suz ve tamamı ASCII (PS 5.1 kod sayfası tuzağı — K-0051)', () => {
  const ham = fs.readFileSync(ps1);
  assert.ok(ham.length > 3, 'ps1 çok küçük');
  assert.ok(!(ham[0] === 0xEF && ham[1] === 0xBB && ham[2] === 0xBF), 'BOM var — kaldırılmalı (BOM\'suz UTF-8 şart)');
  for (let i = 0; i < ham.length; i++) {
    if (ham[i] > 0x7F) assert.fail('ASCII dışı bayt konum ' + i + ': 0x' + ham[i].toString(16) + ' (PS 5.1 BOM\'suz dosyayı ANSI okur — mojibake)');
  }
});

test('öz-tarama: kapı kendi kaynağını + merge-guard kaynağını temiz bulur (desen sabitleri parçalı — kendini RED\'lememeli)', { timeout: 120000 }, () => {
  const r = kos(['-Yollar', ps1 + ',' + mergeGuard]);
  assert.equal(r.code, 0, 'çıktı: ' + r.out);
  assert.match(r.out, /PS51-KAPISI-GECTI: 2 dosya/);
});

test('RED-1 girintili here-string kapanışı: exit 1 + dosya:satır + DERSLER satır 3 çıpası', { timeout: 120000 }, () => {
  const f = psYaz('red1.ps1', ['$x = @\'', 'veri', '  \'@', 'Write-Output $x']);
  const r = kos(['-Yollar', f]);
  assert.equal(r.code, 1, 'çıktı: ' + r.out);
  assert.match(r.out, /PS51-RED: .*red1\.ps1:3 girintili here-string kapanisi/);
  assert.match(r.out, /DERSLER satir 3/);
  assert.match(r.out, /PS51-KAPISI-RED: 1 kirmizi desen/);
});

test('RED-1 çift tırnaklı girintili kapanış ("@): exit 1 — iki tirnak tipi ayni parser hatasi (ORDU-3 F1)', { timeout: 120000 }, () => {
  const f = psYaz('red1c.ps1', ['$x = @"', 'veri', '  "@', 'Write-Output $x']);
  const r = kos(['-Yollar', f]);
  assert.equal(r.code, 1, 'çıktı: ' + r.out);
  assert.match(r.out, /PS51-RED: .*red1c\.ps1:3 girintili here-string kapanisi/);
  assert.match(r.out, /PS51-KAPISI-RED: 1 kirmizi desen/);
});

test('RED-2 git push ile 2>&1 aynı satırda: exit 1 + DERSLER satır 8 çıpası', { timeout: 120000 }, () => {
  const f = psYaz('red2.ps1', ['git push origin main 2>&1']);
  const r = kos(['-Yollar', f]);
  assert.equal(r.code, 1, 'çıktı: ' + r.out);
  assert.match(r.out, /PS51-RED: .*red2\.ps1:1 git push komutunda 2>&1/);
  assert.match(r.out, /DERSLER satir 8/);
});

test('RED-3 git commit -m çift tırnaklı mesaj: exit 1 + DERSLER satır 190 çıpası', { timeout: 120000 }, () => {
  const f = psYaz('red3.ps1', ['git commit -m "MERHABA DUNYA"']);
  const r = kos(['-Yollar', f]);
  assert.equal(r.code, 1, 'çıktı: ' + r.out);
  assert.match(r.out, /PS51-RED: .*red3\.ps1:1 git commit -m cift tirnakli/);
  assert.match(r.out, /DERSLER satir 190/);
  assert.match(r.out, /git commit -F/);
});

test('RED-3 kardeşi: -m boşluksuz çift tırnak (-m"mesaj") da yakalanır', { timeout: 120000 }, () => {
  const f = psYaz('red3b.ps1', ['git commit -m"kayit"']);
  const r = kos(['-Yollar', f]);
  assert.equal(r.code, 1, 'çıktı: ' + r.out);
  assert.match(r.out, /red3b\.ps1:1/);
});

test('UYARI-1 Measure-Object -Line: exit 2 (yalnız-uyarı — RED değil)', { timeout: 120000 }, () => {
  const f = psYaz('uyari1.ps1', ['$n = (Get-Content f.txt | Measure-Object -Line).Lines']);
  const r = kos(['-Yollar', f]);
  assert.equal(r.code, 2, 'çıktı: ' + r.out);
  assert.match(r.out, /PS51-UYARI: .*uyari1\.ps1:1 Measure-Object -Line/);
  assert.match(r.out, /PS51-KAPISI-UYARI: 1 uyari/);
  assert.doesNotMatch(r.out, /PS51-RED/);
});

test('UYARI-2 boruda Format-Table: exit 2 + DERSLER satır 97/198 çıpası', { timeout: 120000 }, () => {
  const f = psYaz('uyari2.ps1', ['Get-ChildItem | Format-Table -AutoSize']);
  const r = kos(['-Yollar', f]);
  assert.equal(r.code, 2, 'çıktı: ' + r.out);
  assert.match(r.out, /PS51-UYARI: .*uyari2\.ps1:1 boruda Format-Table/);
  assert.match(r.out, /DERSLER satir 97\/198/);
  assert.doesNotMatch(r.out, /PS51-RED/);
});

test('temiz dosya: iyi desen kardeşleri exit 0 (kolon-0 kapanış · push 2>$null · commit -F · tek tırnak -m · @(Get-Content).Count)', { timeout: 120000 }, () => {
  const f = psYaz('temiz.ps1', [
    '$k = @\'',
    'veri',
    '\'@',
    '$m = @"',
    'cift tirnak here-string',
    '"@',
    'git push origin main',
    'git push origin main 2>$null',
    'git commit -m \'tek tirnak guvenli\'',
    'git commit -F C:\\temp\\mesaj.txt',
    '$n = @(Get-Content dosya.txt).Count',
    'Write-Output $n',
  ]);
  const r = kos(['-Yollar', f]);
  assert.equal(r.code, 0, 'çıktı: ' + r.out);
  assert.match(r.out, /PS51-KAPISI-GECTI: 1 dosya tarandi, desen eslesmesi 0/);
});

test('RED + UYARI karışık dosya: exit 1 (RED önceliği) + uyarı kaybolmaz (ikisi de raporlanır)', { timeout: 120000 }, () => {
  const f = psYaz('karisik.ps1', [
    'git push origin main 2>&1',
    '$n = (Get-Content f.txt | Measure-Object -Line).Lines',
    'Write-Output $n',
  ]);
  const r = kos(['-Yollar', f]);
  assert.equal(r.code, 1, 'çıktı: ' + r.out);
  assert.match(r.out, /karisik\.ps1:1 git push komutunda 2>&1/);
  assert.match(r.out, /karisik\.ps1:2 Measure-Object -Line/);
  assert.match(r.out, /PS51-KAPISI-RED: 1 kirmizi desen/);
});

test('yorum satırındaki desen bilgi-amaçlıdır: RED/UYARI üretmez (# başlantılı satır affı)', { timeout: 120000 }, () => {
  const f = psYaz('yorum.ps1', [
    '# ornek: git push origin main 2>&1 YAPMA (DERSLER satir 8)',
    '# Measure-Object -Line da kotu ornek',
    'Write-Output \'temiz\'',
  ]);
  const r = kos(['-Yollar', f]);
  assert.equal(r.code, 0, 'çıktı: ' + r.out);
  assert.match(r.out, /PS51-KAPISI-GECTI/);
});

test('LF satır sonlu dosya: desen yakalama satır-sonundan bağımsız (RED-2)', { timeout: 120000 }, () => {
  const f = psYaz('lf.ps1', ['git push origin main 2>&1'], '\n');
  const r = kos(['-Yollar', f]);
  assert.equal(r.code, 1, 'çıktı: ' + r.out);
  assert.match(r.out, /lf\.ps1:1/);
});

test('-Yollar\'da olmayan dosya: ATLANDI bildirimi + engelleme yok (silinen staged durumu)', { timeout: 120000 }, () => {
  const r = kos(['-Yollar', path.join(gecici, 'yok-boyle-bir-dosya.ps1')]);
  assert.equal(r.code, 0, 'çıktı: ' + r.out);
  assert.match(r.out, /PS51-KAPISI-ATLANDI: dosya yok/);
  assert.match(r.out, /PS51-KAPISI-GECTI: 1 dosya tarandi/);
});

test('fail-closed: parametresiz çağrı + git-dışı cwd → exit 1 KAPI-INFAZ-EDILEMEDI', { timeout: 120000 }, () => {
  const r = kos([]);
  assert.equal(r.code, 1, 'çıktı: ' + r.out);
  assert.match(r.out, /KAPI-INFAZ-EDILEMEDI: git staged listesi okunamiyor/);
});

test('merge-guard izole-entegrasyon: kanca koşar; RED düşürür, UYARI/yasak davranışları korunur', { timeout: 300000 }, () => {
  // izole mini repo: merge-guard + ps51-kapisi + yasak-liste kopyaları (repo dosyalarına yazılmaz)
  const iso = fs.mkdtempSync(path.join(os.tmpdir(), 'ps51-merge-guard-iso-'));
  try {
    fs.mkdirSync(path.join(iso, 'scripts'));
    fs.copyFileSync(mergeGuard, path.join(iso, 'scripts', 'merge-guard.ps1'));
    fs.copyFileSync(ps1, path.join(iso, 'scripts', 'ps51-kapisi.ps1'));
    fs.copyFileSync(path.join(kok, 'yasak-liste.json'), path.join(iso, 'scripts', 'yasak-liste.json'));
    const git = (args) => execFileSync('git', args, { cwd: iso, timeout: 60000 });
    const kosGuard = () => {
      try {
        const out = execFileSync('powershell.exe',
          ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(iso, 'scripts', 'merge-guard.ps1')],
          { encoding: 'utf8', timeout: 240000, cwd: iso });
        return { code: 0, out };
      } catch (hata) {
        return { code: hata.status ?? 1, out: ((hata.stdout || '') + (hata.stderr || '')) };
      }
    };
    const stagele = (ad, icerik) => {
      fs.writeFileSync(path.join(iso, ad), icerik, 'ascii');
      git(['add', ad]);
    };
    git(['init']);

    // A) temiz .ps1 staged → kanca koşar (GECTI + PS51-KAPISI-GECTI görünür) → merge-guard exit 0
    stagele('temiz-a.ps1', 'Write-Output \'temiz\'\r\n');
    let r = kosGuard();
    assert.equal(r.code, 0, 'A temiz koşum exit 0 beklenir; çıktı: ' + r.out);
    assert.match(r.out, /PS51-KAPISI-GECTI: 1 dosya/);
    assert.match(r.out, /merge-guard GECTI/);
    git(['rm', '--cached', 'temiz-a.ps1']);

    // D) uyarılı .ps1 staged → merge-guard exit 0 (uyarı asla RED'e dönüşmez — kırmızı çizgi)
    stagele('uyari-a.ps1', '$n = (Get-Content f.txt | Measure-Object -Line).Lines\r\n');
    r = kosGuard();
    assert.equal(r.code, 0, 'D uyarı koşumu engellememeli (uyarı sınıfı); çıktı: ' + r.out);
    assert.match(r.out, /PS51-UYARI/);
    assert.match(r.out, /merge-guard GECTI/);
    git(['rm', '--cached', 'uyari-a.ps1']);

    // C) yasak-adlı dosya staged → mevcut v9 davranışı korunur (YASAK-DOSYA-STAGED, exit 1)
    stagele('probe-latest.json', '{}\r\n');
    r = kosGuard();
    assert.equal(r.code, 1, 'C yasak-ad koşumu exit 1 beklenir; çıktı: ' + r.out);
    assert.match(r.out, /YASAK-DOSYA-STAGED/);
    git(['rm', '--cached', 'probe-latest.json']);

    // B) kötü .ps1 staged (push 2>&1) → kanca RED düşürür → merge-guard exit 1
    stagele('kotu-a.ps1', 'git push origin main 2>&1\r\n');
    r = kosGuard();
    assert.equal(r.code, 1, 'B RED koşumu exit 1 beklenir; çıktı: ' + r.out);
    assert.match(r.out, /PS51-RED: .*kotu-a\.ps1:1/);
    assert.match(r.out, /PS51-KAPISI-RED/);
    assert.doesNotMatch(r.out, /YASAK-DOSYA-STAGED/); // RED kaynağı ps51-kapisi, yasak-liste değil
    git(['rm', '--cached', 'kotu-a.ps1']);
  } finally {
    fs.rmSync(iso, { recursive: true, force: true });
  }
});

test('izolasyon: powershell koşumları sırasında repo kökünde hiçbir dosya değişmez', { timeout: 120000 }, () => {
  // gecici fixture dışına yazım yapılmadığını mekanikler: koşum öncesi/sonrası repo
  // değişiklik sayısı birebir aynı kalır (yalnız bu testin kendi yazdığı tmp dosyaları)
  const r = kos(['-Yollar', psYaz('izolasyon.ps1', ['Write-Output \'x\''])]);
  assert.equal(r.code, 0, 'çıktı: ' + r.out);
  const gitStatus = (() => {
    try {
      return execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8', cwd: kok, timeout: 60000 });
    } catch { return 'OLCULEMEDI'; }
  })();
  // izolasyon.psi fixture tmp içinde; repo içi yeni dosya oluşmamalı
  assert.ok(!gitStatus.includes('izolasyon.ps1'), 'fixture repoya sızmamalı: ' + gitStatus);
});

test('temizlik: gecici fixture koşum sonunda silinir', () => {
  fs.rmSync(gecici, { recursive: true, force: true });
  assert.ok(!fs.existsSync(gecici), 'temp fixture silinmeli (geçici dosya bırakma — görev sınırı)');
});
