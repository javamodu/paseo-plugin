// A11 + A13 canlı bacak (FAZ-3 K2; triyaj raporlar/faz3-triyaj-2026-10-25.md): DÜRÜST
// GERÇEK evaluator koşusu. Hermetik kol (adapter-evaluator.test.ts) enjekte runner'dı;
// burada komut GERÇEK süreç olarak GERÇEK git repo'su içinde yürütülür: repo'da GERÇEK
// node:test dosyaları var, runner.cjs `node --test`'i TAP raporlayıcıyla KOŞAR ve özet
// satırlarından protokol JSON'ünü üretir ({"tests":N,"failed":M}). A13'ün canlı hâli:
// sahte-PASS iki varyantı GERÇEK süreçte exit-0 döner ama kapı FAIL verir — sahte
// yeil deftere girmez. Kırmızı yollar (allowlist RED/fence RED) hermetik tarafta
// kanıtlı; burada yalnız canlı yeni kanıt: gerçek repo, gerçek test, gerçek ret.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateAttempt, type CommandRunner } from '../src/evaluator.ts';
import { openStore, commitCandidate } from '../src/store.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

// GERÇEK repo: git init + gerçek commit; içinde gerçek node:test dosyaları + gerçek
// TAP-özetleyen runner + bilinçli sahte-PASS ajanları (A13).

const GERCEK_TEST_JS = [
  "const { test } = require('node:test');",
  "const assert = require('node:assert');",
  "const fs = require('node:fs');",
  "test('repo veri.txt gercekten okunur (repo baglami kaniti)', () => {",
  "  assert.equal(fs.readFileSync('veri.txt', 'utf8'), 'merhaba');",
  "});",
  "test('ikinci gercek test', () => { assert.equal(2 + 2, 4); });",
].join('\n');

const KIRMIZI_TEST_JS = [
  "const { test } = require('node:test');",
  "const assert = require('node:assert');",
  "test('bilincli kirmizi test (gercek basarisizlik)', () => {",
  "  assert.fail('bilincli kirmizi');",
  "});",
].join('\n');

// Gerçek runner: `node --test`'i TAP ile KOŞAR, özet satırlarından protokol üretir.
// node --test exit kodu = başarısız test sayısı (capped) — gerçek kırmızı gerçek exit taşır.
// DERS (node:test iç içe çağrı): test bağlamında NODE_TEST_CONTEXT kalıtsal taşınır —
// çocuk `node --test` bunu görüp "recursive run" sanar ve dosyaları sessizce ATLAYARAK
// exit-0 döner (sahte tests=0!). Çözüm: spawnSync'e NODE_TEST_CONTEXT'siz temiz env.
const RUNNER_CJS = [
  "const { spawnSync } = require('node:child_process');",
  "const hedef = process.argv[2] ?? 'test/';",
  "const env = Object.assign({}, process.env);",
  "delete env.NODE_TEST_CONTEXT;",
  "delete env.NODE_TEST_WORKER_ID;",
  "const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', hedef], { encoding: 'utf8', env });",
  "const pass = Number(/# pass (\\d+)/.exec(r.stdout)?.[1] ?? 0);",
  "const fail = Number(/# fail (\\d+)/.exec(r.stdout)?.[1] ?? 0);",
  "console.log(JSON.stringify({ tests: pass + fail, failed: fail }));",
  "process.exit(r.status ?? 1);",
].join('\n');

const SAHTE_PASS_CJS = ["console.log('her sey yolunda saniliyor');"].join('\n');
const SAHTE_PROTOKOL_CJS = ["console.log(JSON.stringify({ tests: 0, failed: 0 }));"].join('\n');

function gercekRepoKur(): string {
  const repo = mkdtempSync(join(tmpdir(), 'ordu-a11-canli-'));
  execFileSync('git', ['init'], { cwd: repo });
  writeFileSync(join(repo, 'veri.txt'), 'merhaba', 'utf8');
  mkdirSync(join(repo, 'test'), { recursive: true });
  writeFileSync(join(repo, 'test', 'gercek.test.js'), GERCEK_TEST_JS, 'utf8');
  writeFileSync(join(repo, 'test', 'kirmizi.test.js'), KIRMIZI_TEST_JS, 'utf8');
  writeFileSync(join(repo, 'runner.cjs'), RUNNER_CJS, 'utf8');
  writeFileSync(join(repo, 'sahte-pass.cjs'), SAHTE_PASS_CJS, 'utf8');
  writeFileSync(join(repo, 'sahte-protokol.cjs'), SAHTE_PROTOKOL_CJS, 'utf8');
  execFileSync('git', ['add', '-A'], { cwd: repo });
  execFileSync('git', ['-c', 'user.name=ordu-canli', '-c', 'user.email=canli@ordu.local', 'commit', '-m', 'A11 canli fixture'], { cwd: repo });
  return repo;
}

// Komutlar planın DONMUŞ allowlist'inde (A11) — evaluator bunların DIŞINA çıkmaz.
const KOMUT_PASS = 'node runner.cjs test/gercek.test.js';
const KOMUT_KIRMIZI = 'node runner.cjs test/kirmizi.test.js';
const KOMUT_SAUTE_PASS = 'node sahte-pass.cjs';
const KOMUT_SAUTE_PROTOKOL = 'node sahte-protokol.cjs';

function canliRig(allowed: string[]) {
  const db = openStore();
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'h', 'r', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)')
    .run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), JSON.stringify({ allowedCommands: allowed }));
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-1','plan-1',1,'READY','ph',0,1,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1','n-1','tester','[]','READY')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`).run();
  commitCandidate(db, 'att-1', 1, H64('c'), 'core');
  return db;
}

// GERÇEK CommandRunner: komutu gerçek kabukta GERÇEK repo dizininde yürütür.
const gercekRunner: CommandRunner = async (cmd, cwd) => {
  try {
    const out = execSync(cmd, { encoding: 'utf8', cwd, shell: process.env.ComSpec ?? '/bin/sh' });
    return { exitCode: 0, stdout: out };
  } catch (e: any) {
    return { exitCode: e.status ?? 1, stdout: String(e.stdout ?? '') };
  }
};

test('A11+A13 canlı evaluator: GERÇEK git repo üzerinde GERÇEK test koşusu; sahte-PASS iki varyantı da GERÇEK süreçte RED', async () => {
  const repo = gercekRepoKur();
  // repo gerçek: commit tarihi var, çalışma ağacı temiz
  const log = execFileSync('git', ['log', '--oneline'], { cwd: repo, encoding: 'utf8' });
  assert.ok(log.includes('A11 canli fixture'), 'repo GERÇEK (git init + commit)');

  const evidenceKoku = mkdtempSync(join(tmpdir(), 'ordu-a11-ev-'));
  const db = canliRig([KOMUT_PASS, KOMUT_KIRMIZI, KOMUT_SAUTE_PASS, KOMUT_SAUTE_PROTOKOL]);
  // her koşum AYRI kanıt dizini ister (store artifacts.storage_ref UNIQUE — aynı
  // dosyaya iki kanıt yazılamaz; hermetik kolun evDir() deseni)
  const ev = (cmd: string) => evaluateAttempt(db, {
    attemptId: 'att-1', presentedFence: 1, candidateHash: H64('c'),
    testCmd: cmd, repoDir: repo, runner: gercekRunner,
    evidenceDir: mkdtempSync(join(evidenceKoku, 'kosu-')), actorId: 'evaluator-canli',
  });

  // 1) A11 canlı: GERÇEK koşu — 2 gerçek test geçti → PASS kanıtı deftere düştü
  const r1 = await ev(KOMUT_PASS);
  assert.equal(r1.verdict, 'PASS', 'gerçek repo + gerçek test → PASS');
  assert.equal(r1.tests, 2, 'gerçek node:test 2 test koştu');
  assert.equal(r1.protocolParsed, true);
  const logDosya = r1.storageRef;
  assert.ok(existsSync(logDosya), 'kanıt logu diske düştü');
  const logIcerik = readFileSync(logDosya, 'utf8');
  assert.ok(logIcerik.includes('verdict=PASS') && logIcerik.includes('cmd=' + KOMUT_PASS), 'kanıt logu komut + kararı taşır');

  // 2) GERÇEK kırmızı: 1 gerçek test gerçekten PATLADI → gerçek exit≠0 → FAIL
  const r2 = await ev(KOMUT_KIRMIZI);
  assert.equal(r2.verdict, 'FAIL', 'gerçek başarısız test FAIL');
  assert.equal(r2.exitCode ?? 1, 1, 'node --test gerçek exit-1 taşıdı');
  assert.equal(r2.tests, 1, 'gerçek kırmızı test sayıldı (failed=1)');

  // 3) A13 canlı varyant-1: exit-0 AMA protokol YOK → FAIL (exit-0 YETMEZ)
  const r3 = await ev(KOMUT_SAUTE_PASS);
  assert.equal(r3.verdict, 'FAIL', 'sahte-PASS: exit-0 yetmez');
  assert.equal(r3.protocolParsed, false, 'stdout protokol JSON değil');

  // 4) A13 canlı varyant-2: exit-0 + tests=0 → FAIL (0 test = sahte yeşil)
  const r4 = await ev(KOMUT_SAUTE_PROTOKOL);
  assert.equal(r4.verdict, 'FAIL', 'sahte-PASS: tests=0 sahte yeşildir');
  assert.equal(r4.protocolParsed, true, 'protokol çözüldü ama tests=0');

  // 5) defter dürüst: 4 kanıt satırı — 1 PASS + 3 FAIL; sahte yeşil HİÇ girmedi
  const satirlar = db.prepare("SELECT verdict, exit_code, test_count FROM evidence WHERE attempt_id='att-1'").all() as any[];
  assert.equal(satirlar.length, 4, 'dört koşumun dördü de kanıtlandı');
  assert.equal(satirlar.filter((s) => s.verdict === 'PASS').length, 1, 'yalnız gerçek koşu PASS');
  assert.equal(satirlar.filter((s) => s.verdict === 'FAIL').length, 3, 'sahteler FAIL olarak kayda geçti');

  // 6) repo evaluator tarafından kirletilmedi (yalnız okundu)
  const status = execFileSync('git', ['status', '--porcelain'], { cwd: repo, encoding: 'utf8' });
  assert.equal(status.trim(), '', 'evaluator repo çalışma ağacını kirletmez');

  console.log('KANIT A11: gerçek git repo + gerçek node:test (2/2) → PASS kanıtı; gerçek kırmızı (1 fail, exit-1) → FAIL');
  console.log('KANIT A13: sahte-PASS exit-0 (protokolsüz) VE exit-0+tests=0 — ikisi de GERÇEK süreçte FAIL; defterde 1 PASS + 3 FAIL');
});
