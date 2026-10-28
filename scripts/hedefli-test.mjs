#!/usr/bin/env node
// hedefli-test.mjs — v9 V9-01 (2026-10-28): degisen src dosyalarindan hedefli test
// alt kumesini DETERMINISTIK secer. Kaynak: raporlar/gelen-kutu/v9-kalite-koruyucu-hiz-2026-10-28.md
// Kullanim:
//   node scripts/hedefli-test.mjs [--base <ref>] [--kok <repoKoku>] [--json]
//   --base: diff tabani (varsayilan HEAD; branch modunda merge-tabani ref'i ver)
//   --kok : repo koku override (test entegrasyonu icin; varsayilan script'in iki ust dizini)
// Cikti: secilen test listesi + `node --test` komut satiri + kapsamsiz-src UYARISI.
// Kapsamsiz src EXIT 1 yapmaz (karar operatore ait — v9 ilkesi: makine secer, insan dogrular);
// yalniz altyapi hatasi (git coker / core/test yok) fail-closed exit 1.
// Guven yonu: asiri-secim (false-positive import eslesmesi) GUVENLIDIR — fazla test kosmak
// kalite kaybi degildir; asiri-secim degil EKSIK-secim tehlikelidir.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// --- saf cekirdek (hedefli-test.test.mjs bu kismi hermetik sinar) ---
// degisenler: repo-koklu yol dizisi; testEnvanteri: [{ dosya: repo-koklu, icerik }]
export function hedefliSec(degisenler, testEnvanteri) {
  const secilen = new Set();
  const kapsamsiz = [];
  const SRC_RE = /^core\/src\/(.+)\.(ts|mjs|js)$/;
  const TEST_RE = /^core\/test\/(.+)\.test\.(ts|mjs)$/;
  for (const degisen of degisenler) {
    if (TEST_RE.test(degisen)) { secilen.add(degisen); continue; } // degisen test dogrudan kosulur
    const m = SRC_RE.exec(degisen);
    if (!m) continue; // plans/raporlar/scripts belgeleri test eslesmez (bilincli yoksayma)
    const modul = m[1].replace(/\.(ts|mjs|js)$/, ''); // core/src/<mod>.ts -> <mod>
    let bulundu = false;
    for (const t of testEnvanteri) {
      const testAd = TEST_RE.exec(t.dosya);
      const adEslesmesi = testAd && testAd[1] === modul;                       // src/foo.ts <-> foo.test.ts
      const importTaramasi = t.icerik.includes('src/' + modul + '.');         // "../src/foo.ts" / "../src/foo.mjs"
      if (adEslesmesi || importTaramasi) { secilen.add(t.dosya); bulundu = true; }
    }
    if (!bulundu) kapsamsiz.push(degisen);
  }
  return { secilen: [...secilen].sort(), kapsamsiz: kapsamsiz.sort() };
}

// --- CLI kabugu ---
function cikis(kod, mesaj) { if (mesaj) console.error(mesaj); process.exit(kod); }
const args = process.argv.slice(2);
const argAl = (ad) => { const i = args.indexOf(ad); return i >= 0 ? args[i + 1] : undefined; };
const base = argAl('--base') || 'HEAD';
const kok = argAl('--kok') || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonMod = args.includes('--json');

let degisen;
try {
  // diff (izlenen degisimler) + UNTRACKED dosyalar (yeni dosya diff'te gorunmez — yazarin
  // en sik ciktisi yeni dosyadir; eksik-secim tehlikeli yondur, bu yuzden ikisi de alinir).
  // --exclude-standard: .gitignore sayilir (shm/wal/defterler zaten disarida).
  const diff = execFileSync('git', ['diff', '--name-only', base], { cwd: kok, encoding: 'utf8' });
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: kok, encoding: 'utf8' });
  degisen = [...new Set((diff + '\n' + untracked).split(/\r?\n/).map(s => s.trim()).filter(Boolean))].sort();
} catch (e) {
  cikis(1, 'KAPI-HAZIR-DEGIL: git calismadi (fail-closed): ' + e.message);
}
const testDizin = path.join(kok, 'core', 'test');
if (!fs.existsSync(testDizin)) cikis(1, 'KAPI-HAZIR-DEGIL: core/test bulunamadi (fail-closed): ' + testDizin);
const testEnvanteri = fs.readdirSync(testDizin)
  .filter(ad => /\.test\.(ts|mjs)$/.test(ad))
  .map(ad => ({ dosya: 'core/test/' + ad, icerik: fs.readFileSync(path.join(testDizin, ad), 'utf8') }));

const { secilen, kapsamsiz } = hedefliSec(degisen, testEnvanteri);
const komut = 'cd core && node --test ' + secilen.map(d => d.replace(/^core\//, '')).join(' ');
if (jsonMod) {
  console.log(JSON.stringify({ arac: 'hedefli-test', surum: 1, taban: base, degisenSayisi: degisen.length, secilen, kapsamsiz }, null, 2));
} else {
  console.log('HEDEFLI-TEST SECIMI (v9 V9-01) — taban: ' + base + ' · degisen: ' + degisen.length + ' dosya');
  console.log('secilen testler (' + secilen.length + '):');
  for (const s of secilen) console.log('  ' + s);
  if (kapsamsiz.length > 0) {
    console.log('KAPSAMSIZ SRC (UYARI — degisti ama test secilmedi; karar operatore ait):');
    for (const k of kapsamsiz) console.log('  ' + k);
  } else {
    console.log('kapsamsiz src: 0');
  }
  console.log('komut: ' + (secilen.length > 0 ? komut : '(hedefli test yok — tam kanal kuralina don)'));
}
