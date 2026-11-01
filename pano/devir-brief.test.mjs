// OTODEV-1 A1 TESTİ — pano/devir-brief.mjs (ardıl brief üreticisi + --olc ölçüm CLI'sı).
// Hermetik: brief metin iddiaları + olc() DI fixture'la (calistir enjekte); b8 CLI duman
// testi GERÇEK süreci spawn eder ama yalnız SALT-OKUR git komutları çalıştırır (status/log)
// — canlı sunuculara ve dosyalara yazma YOK. KOŞUM: node --test pano/devir-brief.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { briefUret, olc } from './devir-brief.mjs';

const KOK = dirname(fileURLToPath(import.meta.url));
const MODUL = join(KOK, 'devir-brief.mjs');
const REPO = join(KOK, '..');
const tempKok = () => mkdtempSync(join(tmpdir(), 'otodev-brief-'));

test('b1: EK-3 4 öğe başlığı briefte VAR + echo borcu bölümü', () => {
  const b = briefUret({});
  for (const h of ['## 1) HEDEF', '## 2) ÇIKTI FORMATI', '## 3) ARAÇ/KAYNAK', '## 4) GÖREV SINIRI']) {
    assert.ok(b.includes(h), 'eksik bölüm başlığı: ' + h);
  }
  assert.ok(b.includes('## ECHO BORCU — 3 SORU'));
  assert.ok(b.includes('raporlar/devir/<YYYY-AA-GG>/OZET.md'));
});

test('b2: [insan] kapı listesi TAM — 6 kapı + headless yasak + PANO_TOKEN sınırı', () => {
  const b = briefUret({});
  for (const k of [
    'canlı sunucu restart', 'süreç kill', 'izin onayı', 'git push',
    'kilitli sürüm plugin/ dokunma', 'GRAF SSOT',
  ]) {
    assert.ok(b.includes(k), 'eksik [insan] kapısı: ' + k);
  }
  assert.ok(b.includes('claude -p YASAK'));
  assert.ok(b.includes('Paseo spawn'));
  assert.ok(b.includes('Commit/push YASAK'));
  assert.ok(b.includes('PANO_TOKEN devralana verilmez'));
});

test('b3: echo 3 soru metni + raporun İLK 3 SATIRI kuralı + salt-okur iş sınıfı', () => {
  const b = briefUret({});
  assert.ok(b.includes('1. Kirli kayıt sayısı?'));
  assert.ok(b.includes('2. Son commit hash?'));
  assert.ok(b.includes('3. Bekleyen ilk onay?'));
  assert.ok(b.includes('İLK 3 SATIR'));
  assert.ok(b.includes('salt-okur tarama'));
  assert.ok(b.includes('DOSYADAN doğrulanarak'));
});

test('b4: --olc DI fixture ile doğru değerler — git stub + STATE_BOARD fikstürü', () => {
  const d = tempKok();
  writeFileSync(join(d, 'STATE_BOARD.md'), '- **TEST KAPALI (2026-11-01) — PAKET · K8-2b emri bekler:** ayrıntı\n');
  const calistir = (komut, arglar) => {
    if (komut === 'git' && arglar[0] === 'status') return 'M a\n?? b\n'; // 2 kirli kayıt
    if (komut === 'git' && arglar[0] === 'log') return 'abc1234\n';
    throw new Error('beklenmedik komut: ' + komut + ' ' + arglar.join(' '));
  };
  const r = olc({ calistir, kok: d });
  assert.equal(r.kirliSayisi, 2);
  assert.equal(r.sonCommit, 'abc1234');
  assert.equal(r.ilkOnay, 'K8-2b emri bekler');
  // Boş ölçüm dürüsttür: 0 kirli kayıt ölçüldü demektir (hata değil):
  assert.equal(olc({ calistir: () => '', kok: d }).kirliSayisi, 0);
  rmSync(d, { recursive: true, force: true });
});

test('b5: olcum-hata dürüst — komut hata verirse + STATE_BOARD bekler satırı yoksa', () => {
  const d = tempKok(); // STATE_BOARD YOK
  const r = olc({ calistir: () => { throw new Error('git yok'); }, kok: d });
  assert.equal(r.kirliSayisi, 'olcum-hata');
  assert.equal(r.sonCommit, 'olcum-hata');
  assert.equal(r.ilkOnay, 'olcum-hata');
  // STATE_BOARD VAR ama 'bekler' satırı YOK → yalnız o soru olcum-hata, diğerleri ölçülür:
  writeFileSync(join(d, 'STATE_BOARD.md'), '# DURUM\n- her şey kapalı, kuyruk boş\n');
  const calistir2 = (komut, arglar) => (arglar[0] === 'status' ? 'M x\n' : ''); // log → boş stdout
  const r2 = olc({ calistir: calistir2, kok: d });
  assert.equal(r2.ilkOnay, 'olcum-hata');
  assert.equal(r2.kirliSayisi, 1);
  assert.equal(r2.sonCommit, 'olcum-hata'); // boş stdout → dürüst hata
  rmSync(d, { recursive: true, force: true });
});

test('b6: gizli değer briefte YOK — token ataması / uzun hex koşusu yok', () => {
  const b = briefUret({ handoffYolu: 'plans/handoff/HANDOFF-2026-11-01-0609.md' });
  assert.ok(!/PANO_TOKEN\s*[:=]/.test(b), 'brief token DEĞERİ atayamaz');
  assert.ok(!/[a-f0-9]{20,}/i.test(b), 'brief uzun hex/blob taşıyamaz');
});

test('b7: handoff/kira yolları verildiyse briefte geçer; verilmediyse dürüst not', () => {
  const b = briefUret({ handoffYolu: 'plans/handoff/HANDOFF-2026-11-01-0609.md', kiraYolu: 'core/data/devir-kira.json' });
  assert.ok(b.includes('plans/handoff/HANDOFF-2026-11-01-0609.md'));
  assert.ok(b.includes('core/data/devir-kira.json'));
  const b2 = briefUret({});
  assert.ok(b2.includes('en son HANDOFF-*.md'), 'sabitlenmemiş handoff dürüst notu');
  assert.ok(b2.includes('devir-kira.json'), 'varsayılan kira yolu devir-kira.mjs SSOTundan gelir');
});

test('b8: CLI --olc ayakta — süreç çıkış 0 + 3 soru satır yapısı (gerçek git, salt-okur)', () => {
  const r = spawnSync(process.execPath, [MODUL, '--olc'], { cwd: REPO, encoding: 'utf8' });
  assert.equal(r.status, 0, 'stdout: ' + r.stdout + ' stderr: ' + r.stderr);
  assert.ok(/^1\) Kirli kayıt sayısı: /m.test(r.stdout));
  assert.ok(/^2\) Son commit: /m.test(r.stdout));
  assert.ok(/^3\) Bekleyen ilk onay: /m.test(r.stdout));
});
