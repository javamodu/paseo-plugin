// RBT-2026-10-28.3 turunun taze baseline üreticisi (B0'). Ürün kaynağı/DB/sağlayıcı yok; commit yok.
// .2 baseline'inin dosya evreni + korumalı bileşen listesi + bu turun önceden yazılmış dosyaları
// bugünkü hash'lerle sabitlenir. v9-06 zinciri (40b72a3 -> 003f79e) core/ dahil değiştirdi;
// .3 bu durumla BAŞLAR — .2'nin protected iddiaları kendi turu için tarihseldir, geriye taşınmaz.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '../..');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8').replace(/^﻿/, ''));
const oldPath = 'raporlar/kilit-oncesi-kapanis-2026-10-28/baslangic.json';
const old = readJson(resolve(root, oldPath));
const digest = (b) => createHash('sha256').update(b).digest('hex');
const info = (p) => { const b = readFileSync(resolve(root, p)); return { sha256: digest(b), bytes: b.length }; };
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const status = execFileSync('git', ['status', '--porcelain=v1', '-uall'], { cwd: root, encoding: 'utf8' });
const lines = status.split(/\r?\n/).filter(Boolean);
const at = new Date().toISOString();

// Turun baseline anında var olan kendi dosyaları (kapanis.json hariç: seal tur içinde günceller).
const own = [
  'raporlar/kilit-oncesi-kapanis-2026-10-29/baslangic-yaz.mjs',
  'raporlar/kilit-oncesi-kapanis-2026-10-29/dogrula-kapanis-v3.mjs',
  'raporlar/kilit-oncesi-kapanis-2026-10-29/kanit-muhur-v3.mjs',
  'raporlar/kilit-oncesi-kapanis-2026-10-29/kanit-muhur.test.mjs',
  'raporlar/kilit-oncesi-kapanis-2026-10-29/OZET.md',
  'raporlar/b5-aday-dogrulama-2026-10-29/OZET.md',
  'raporlar/b5-aday-dogrulama-2026-10-29/DOGRULAMA.json',
];
const roundHomes = ['raporlar/kilit-oncesi-kapanis-2026-10-29/', 'raporlar/b5-aday-dogrulama-2026-10-29/'];

const universe = [...new Set([...Object.keys(old.files), ...old.protectedComponentFiles, ...own])];
for (const p of universe) if (!existsSync(resolve(root, p))) throw new Error('baseline evreninde eksik dosya: ' + p);
const files = {};
for (const p of universe) files[p] = info(p);

// Kapanış içeriği dışındaki mevcut kirli yollar (ölçümlü; .2'nin kürated 6'lisının dürüst geneli).
const oldAday = readJson(resolve(root, 'raporlar/kilit-oncesi-kapanis-2026-10-28/aday-20261028152606837.json'));
const contentSet = new Set([...oldAday.content.map((c) => c.path), ...own]);
const outside = lines.map((l) => l.slice(3).trim()).filter((p) => !contentSet.has(p) && !roundHomes.some((h) => p.startsWith(h)));

// Denetimin sabitleyeceği ölçüler (aynı formüller dogrula-kapanis-v3.mjs'te).
const countRules = ['ANAYASA.md', 'AGENTS.md', 'sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md'].reduce((n, f) =>
  n + readFileSync(resolve(root, f), 'utf8').split(/\r?\n/).filter((l) => /^\s*(-|\d+\.)\s/.test(l)).length, 0);
const stateLines = readFileSync(resolve(root, 'STATE_BOARD.md'), 'utf8').trimEnd().split(/\r?\n/).length;

const out = {
  schemaSurum: 1,
  kind: 'closure-scope-baseline-fresh-revision-no-product-execution',
  at, head, revisionOf: 'RBT-2026-10-28.3',
  userInstruction: 'devam (2026-10-29) + interaktif seçim: 15:26 adayı bayat — yeni kapanış turu bu oturumda',
  previousBaseline: { path: oldPath, ...info(oldPath), head: old.head },
  headEvolution: {
    from: old.head, to: head,
    commits: Number(execFileSync('git', ['rev-list', '--count', old.head + '..' + head], { cwd: root, encoding: 'utf8' }).trim()),
    reason: 'v9-06 tip-borcu 51->0 + RATCHET KILIT + kapanis evraklari (kanal 467/467); core/ degisti — .3 bunlari baslangic noktasi olarak emer',
  },
  gitStatus: lines,
  trackedCount: execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean).length,
  untrackedCount: lines.filter((l) => l.startsWith('??')).length,
  modifiedCount: lines.filter((l) => !l.startsWith('??')).length,
  protectedComponentFiles: old.protectedComponentFiles,
  files,
  preexistingChangesOutsideScope: outside,
  ownership: 'Bu tur yalnız belge/paket kapanış tazelemesi yapar; .2 kirli ağacı ve v9-06/bekci kalıntıları bu ajana ait varsayılmaz. Ürün ve runtime dosyaları değişmez.',
  commitTagAuthorized: false,
  finalHumanAcceptance: null,
};
writeFileSync(resolve(here, 'baslangic.json'), JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({
  at, head, files: Object.keys(files).length, protected: old.protectedComponentFiles.length,
  outsideScope: outside.length, outside, countRules, stateLines,
  oldKapanis: info('raporlar/kilit-oncesi-kapanis-2026-10-28/kapanis.json'),
}, null, 2));
