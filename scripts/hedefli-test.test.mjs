// hedefli-test.test.mjs — v9 V9-01'in kendi testi (hermetik cekirdek + temp-repo entegrasyonu)
// Kosum: node --test scripts/hedefli-test.test.mjs (repo kokunden)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hedefliSec } from './hedefli-test.mjs';

const env = (kayitlar) => kayitlar.map(([dosya, icerik]) => ({ dosya, icerik }));

test('ad-eslesmesi: src/foo.ts -> core/test/foo.test.ts secilir', () => {
  const r = hedefliSec(['core/src/foo.ts'], env([['core/test/foo.test.ts', "import { x } from '../src/baska.ts';"]]));
  assert.deepEqual(r.secilen, ['core/test/foo.test.ts']);
  assert.deepEqual(r.kapsamsiz, []);
});

test('import-taramasi: src/gece.ts -> a4-gece.test.ts (ad eslesmesi YOK, import yakalar)', () => {
  const r = hedefliSec(['core/src/gece.ts'], env([['core/test/a4-gece.test.ts', "import { geceModu } from '../src/gece.ts';"]]));
  assert.deepEqual(r.secilen, ['core/test/a4-gece.test.ts']);
});

test('cok-testli import: store.ts degisince import eden TUM testler secilir (asiri-secim guvenli yon)', () => {
  const r = hedefliSec(['core/src/store.ts'], env([
    ['core/test/a.test.ts', "from '../src/store.ts'"],
    ['core/test/b.test.ts', "from '../src/store.ts'"],
    ['core/test/c.test.ts', "from '../src/baska.ts'"],
  ]));
  assert.deepEqual(r.secilen, ['core/test/a.test.ts', 'core/test/b.test.ts']);
});

test('degisen test dosyasi dogrudan secilir', () => {
  const r = hedefliSec(['core/test/foo.test.ts'], env([['core/test/foo.test.ts', '...']]));
  assert.deepEqual(r.secilen, ['core/test/foo.test.ts']);
});

test('kapsamsiz src: uyari listesine duser, exit degiskeni YOK (karar operatore ait)', () => {
  const r = hedefliSec(['core/src/yalniz.ts'], env([['core/test/baska.test.ts', "from '../src/baska.ts'"]]));
  assert.deepEqual(r.secilen, []);
  assert.deepEqual(r.kapsamsiz, ['core/src/yalniz.ts']);
});

test('ilgili olmayan dosyalar (plans/raporlar/scripts) yoksayilir — kapsamsiz DEGIL', () => {
  const r = hedefliSec(['plans/PLAN.md', 'scripts/k.ps1', 'README.md'], env([['core/test/foo.test.ts', 'x']]));
  assert.deepEqual(r.secilen, []);
  assert.deepEqual(r.kapsamsiz, []);
});

test('.mjs modulu: src/tip-kapisi.mjs import taramasindan yakalanir', () => {
  const r = hedefliSec(['core/src/tip-kapisi.mjs'], env([['core/test/kapi.test.ts', "from '../src/tip-kapisi.mjs'"]]));
  assert.deepEqual(r.secilen, ['core/test/kapi.test.ts']);
});

test('secim deterministik: ayni girdi ayni cikti (sort + dedupe)', () => {
  const envanter = env([
    ['core/test/b.test.ts', "from '../src/foo.ts'"],
    ['core/test/a.test.ts', "from '../src/foo.ts'"],
    ['core/test/a.test.ts', "from '../src/foo.ts'"],
  ]);
  const r1 = hedefliSec(['core/src/foo.ts'], envanter);
  const r2 = hedefliSec(['core/src/foo.ts'], envanter);
  assert.deepEqual(r1, r2);
  assert.deepEqual(r1.secilen, ['core/test/a.test.ts', 'core/test/b.test.ts']);
});

// --- entegrasyon: temp git repo uzerinden CLI kabugu ---
test('entegrasyon: temp repoda diff -> secim -> json cikti (fail-closed git yolu dahil)', { timeout: 60000 }, () => {
  const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'hedefli-test-'));
  try {
    const calis = (komutlar) => execFileSync('git', komutlar, { cwd: gecici, encoding: 'utf8' });
    calis(['init', '-q']);
    calis(['config', 'user.email', 'ht@test']);
    calis(['config', 'user.name', 'ht-test']);
    fs.mkdirSync(path.join(gecici, 'core', 'src'), { recursive: true });
    fs.mkdirSync(path.join(gecici, 'core', 'test'), { recursive: true });
    fs.writeFileSync(path.join(gecici, 'core', 'src', 'foo.ts'), 'export const a = 1;\n');
    fs.writeFileSync(path.join(gecici, 'core', 'test', 'foo.test.ts'), "import { a } from '../src/foo.ts';\n");
    calis(['add', '.']);
    execFileSync('git', ['commit', '-q', '-m', 'base'], { cwd: gecici, encoding: 'utf8' });
    // taban sonrasi degisimler: foo.ts degisir + yeni kapsamsiz modul dogar
    fs.writeFileSync(path.join(gecici, 'core', 'src', 'foo.ts'), 'export const a = 2;\n');
    fs.writeFileSync(path.join(gecici, 'core', 'src', 'bar.ts'), 'export const b = 1;\n');
    const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'hedefli-test.mjs');
    const cikti = JSON.parse(execFileSync('node', [script, '--kok', gecici, '--json'], { encoding: 'utf8' }));
    assert.equal(cikti.degisenSayisi, 2);
    assert.deepEqual(cikti.secilen, ['core/test/foo.test.ts']);
    assert.deepEqual(cikti.kapsamsiz, ['core/src/bar.ts']);
    // fail-closed: varolmayan taban -> exit 1
    assert.throws(() => execFileSync('node', [script, '--kok', gecici, '--base', 'yok-boyle-ref'], { encoding: 'utf8' }), /KAPI-HAZIR-DEGIL|fatal/);
  } finally {
    fs.rmSync(gecici, { recursive: true, force: true }); // gecici dosya kosum sonunda silinir
  }
});
