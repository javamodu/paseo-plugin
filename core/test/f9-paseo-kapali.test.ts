// K12-14 (F9) — "PASEO KAPALI BAGIMSIZ TESLIM" (runner arayüz bağımsızlığı) kompozit koşum.
// Teslim zinciri Paseo'ya GEREK DUYMAZ: (1) GERÇEK defter DOSYASI (temp) + LocalRuntimeAdapter
// (e2e-s11 deseni — GERÇEK node alt-süreci; Paseo adaptörü kod YOLU hiç devrede değil);
// (2) bağımsız evaluator GERÇEK komut koşumu (exit-0 + test sayısı — A13 kanıt zinciri);
// (3) insan kararı APPROVED → run ACCEPTED; (4) görünürlük/doğrulama PANO BAĞIMSIZ WEB
// yüzünden (PLAN bol.12: pano Paseo kapaliyken yaşar) — F9 UI-tester adaptörü
// senaryo/beklenen/gözlenen üçlüsünü KANIT KAYDI olarak diske yazar (F9-A).
// DÜRÜST KAPSAM: Paseo'nun FİZİKSEL kapatılması [insan] müdahalesi ister; bu koşumda
// Paseo-adaptör/spawn yolu HİÇ kullanılmaz — bağımsızlık kod-yolu düzeyinde kanıtlanır
// (F7-B emsal: e2e-s11 LocalRuntimeAdapter).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, setGlobalStop, commitCandidate } from '../src/store.ts';
import {
  createRunPlan, approvePlan, dispatchNode, ensureStartCommand, requestDelivery, decideApproval, allNodesDone, settleNodeOutcome,
} from '../src/supervisor.ts';
import { processOutbox } from '../src/dispatcher.ts';
import { LocalRuntimeAdapter, type LocalLauncher } from '../src/local-runtime.ts';
import { evaluateAttempt, type CommandRunner } from '../src/evaluator.ts';
import { sampleHandoff } from '../src/handoff.ts';
import { sampleReceipt } from '../src/reasoning-receipt.ts';
import type { ProbeReceipt } from '../src/capabilities.ts';
import { createPanoServer } from '../src/pano-server.ts';
import { acTarayiciProfili, runUiSenaryo, uiKanitlariniOku, type UiSenaryo } from '../src/ui-tester.ts';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const CAND_ICERIK = 'K12-14 bagimsiz teslim: Paseo kod yolu DEVREDE DEGIL — local runner ciktisi';

const realRunner: CommandRunner = async (cmd) => {
  try {
    const stdout = execSync(cmd, { encoding: 'utf8', shell: process.env.ComSpec ?? '/bin/sh' });
    return { exitCode: 0, stdout };
  } catch (e: any) {
    return { exitCode: e.status ?? 1, stdout: String(e.stdout ?? '') };
  }
};

const localProbe = (): ProbeReceipt => ({
  probe: 'ordu-v3/f9-k14-local', schemaVersion: 1, generatedAt: new Date().toISOString(), node: process.version,
  capabilities: { gitWorktreeProven: true, processRegistryDurable: true, cancelConfirmLocal: true, providerCliPresent: true },
  blocked: [], probeReceiptHash: '0'.repeat(64),
});

class EchoLauncher implements LocalLauncher {
  private pids = new Map<string, number>();
  private outFile: string;
  constructor(outFile: string) { this.outFile = outFile; }
  async launch(o: { dispatchKey: string; attemptId: string; prompt: string }) {
    const child = spawn(
      process.execPath,
      ['-e', 'require("fs").writeFileSync(process.argv[1], process.argv[2])', this.outFile, CAND_ICERIK],
      { stdio: 'ignore' },
    );
    if (!child.pid) throw new Error('pid alinamadi');
    this.pids.set(o.dispatchKey, child.pid);
    return { pid: child.pid };
  }
  pidOf(dispatchKey: string) { return this.pids.get(dispatchKey); }
  async isAlive(pid: number) { try { process.kill(pid, 0); return true; } catch { return false; } }
  async kill(pid: number) { try { process.kill(pid); } catch { /* zaten olu */ } }
}

async function dosyaBekle(path: string, tries = 100) {
  for (let i = 0; i < tries; i++) {
    if (existsSync(path)) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('worker ciktisi gelmedi: ' + path);
}

test('K12-14: Paseo kapali bagimsiz teslim — local runner uctan uca + pano BAGIMSIZ web yuzunden dogrulanir (F9-A kanit kayitlari)', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'k14-'));
  const dbPath = join(dir, 'ordu.sqlite');          // defter DOSYASI — pano ayni dosyadan okur
  const runId = 'run-k14';
  const db = openStore(dbPath);

  // (1) DEFTER BACAGI — Paseo adaptör YOLU YOK: LocalRuntimeAdapter + GERÇEK cocuk surec
  setGlobalStop(db, false, 'insan:test', 'k12-14 kurulum');
  const fixture = join(dir, 'pass.js');
  writeFileSync(fixture, 'console.log(JSON.stringify({tests:2,failed:0}));\n');
  const testCmd = `"${process.execPath}" "${fixture}"`;
  const { planHash } = createRunPlan(db, {
    capsuleId: 'cap-' + runId, goal: 'K12-14 Paseo-kapali bagimsiz teslim', repoId: 'repo-local',
    sourceCommit: sha('commit-' + runId), runId, planId: 'plan-' + runId, profileHash: sha('pf:' + runId),
    nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 1, allowedCommands: [testCmd],
  });
  const startCommandId = ensureStartCommand(db, runId, planHash, 'insan:test');
  approvePlan(db, runId, planHash, 'insan:test');
  const d = dispatchNode(db, runId, 'n1', {
    tokens: 500, startCommandId, dispatchKey: 'dk-' + runId, handoff: sampleHandoff('n1'),
  });
  const candFile = join(dir, 'candidate-k14.txt');
  const adapter = new LocalRuntimeAdapter(localProbe(), new EchoLauncher(candFile), { ORDU_RUNTIME: 'local' });
  const out = await processOutbox(db, adapter);
  assert.equal((out as any).result, 'bound', 'yerel oturum baglandi — Paseo spawn YOLU kullanilmadi');
  assert.match((db.prepare('SELECT external_session_id FROM attempts WHERE id=?').get(d.attemptId) as any).external_session_id, /^local:\d+$/);
  await dosyaBekle(candFile);
  const candidateHash = sha(readFileSync(candFile, 'utf8'));
  commitCandidate(db, d.attemptId, 1, candidateHash, 'worker-local');

  // (2) BAGIMSIZ EVALUATOR — GERÇEK komut koşumu (exit-0 + test sayisi; A13)
  const ev = await evaluateAttempt(db, {
    attemptId: d.attemptId as string, presentedFence: 1, candidateHash, testCmd, repoDir: dir,
    runner: realRunner, evidenceDir: join(dir, 'evidence'), actorId: 'evaluator',
  });
  assert.equal(ev.verdict, 'PASS');
  assert.equal(ev.tests, 2);
  assert.equal(settleNodeOutcome(db, d.attemptId as string, 'PASS').status, 'NODE_DONE');
  assert.ok(allNodesDone(db, runId));

  // (3) TESLIM: M18 makbuz → insan karari → ACCEPTED (Paseo'suz)
  const reasoning = sampleReceipt(candidateHash, 'n1', { evidenceRefs: [ev.evidenceId] });
  const req = requestDelivery(db, runId, 'insan:test', reasoning);
  const versiyon = (db.prepare('SELECT version FROM runs WHERE id=?').get(runId) as any).version;
  const karar = decideApproval(db, req.approvalId, 'APPROVED', 'insan:test', versiyon);
  assert.equal(karar.status, 'ACCEPTED');
  assert.equal((db.prepare('SELECT state FROM runs WHERE id=?').get(runId) as any).state, 'ACCEPTED');

  // (4) GORUNURLUK BACAGI — pano BAGIMSIZ web yuzu AYNI defter dosyasindan okur;
  // F9 UI-tester senaryosu teslimi Paseo'ya ihtiyac DUYMADAN dogrular (K12-14 ozu)
  const token = 'k14-pano-token';
  const { server, port } = await createPanoServer({ dbPath, port: 0, authToken: token });
  t.after(() => { (server as any).closeAllConnections?.(); server.close(); });
  const profil = acTarayiciProfili('http://127.0.0.1:' + port, token);
  const kanitYolu = join(dir, 'ui-kanit.jsonl');
  const senaryo: UiSenaryo = {
    ad: 'k14-paseo-kapali-teslim',
    adimlar: [
      { ad: 'saglik', yol: '/healthz', beklenen: [{ alan: '', kosul: 'icerir', deger: 'ok' }] },
      {
        ad: 'teslim-gorunur', yol: '/api/status',
        beklenen: [
          { alan: 'globalStop', kosul: 'esittir', deger: false },
          { alan: 'runs', kosul: 'icerir', deger: runId },
          { alan: 'runs', kosul: 'icerir', deger: '"state":"ACCEPTED"' },
          { alan: 'metrics.verifiedDeliveries', kosul: 'buyuktur', deger: 0 },
          { alan: 'metrics.criticalViolations', kosul: 'esittir', deger: 0 },
          { alan: 'pendingDecisions', kosul: 'esittir', deger: [] },
        ],
      },
    ],
  };
  const sonuc = await runUiSenaryo(profil, senaryo, { kanitYolu, screenshot: 'k14-pano.png' });
  assert.equal(sonuc.verdict, 'PASS', 'bagimsiz yuzden teslim DOGRULANDI: ' + (sonuc.hata ?? ''));

  // F9-A: senaryo/beklenen/gozlenen uclusu DISKTE (kanit kayitlari)
  const kayitlar = uiKanitlariniOku(kanitYolu) as any[];
  assert.equal(kayitlar.length, 3, '2 adim + 1 ozet');
  assert.equal(kayitlar[1].gozlenen.runs[0].id, runId, 'gozlenen GERCEK defter durumu');
  assert.equal(kayitlar[1].gozlenen.runs[0].state, 'ACCEPTED');
  assert.equal(kayitlar[2].verdict, 'PASS');
  assert.equal(kayitlar[2].screenshot, 'k14-pano.png', 'screenshot gorunurluk olarak kayitta (verdict etkisi YOK)');

  // (5) KIRILIM: bagimsiz yuz olunce gorunurluk ADIYLA kirmizi (fail-closed — sessiz yesil YOK)
  profil.kapat();
  await new Promise<void>((r) => { server.close(() => r()); });
  const profil2 = acTarayiciProfili('http://127.0.0.1:' + port, token);
  const sonuc2 = await runUiSenaryo(profil2, {
    ad: 'k14-olu-yuz', adimlar: [{ ad: 'durum', yol: '/api/status', beklenen: [{ alan: 'globalStop', kosul: 'esittir', deger: false }] }],
  }, { kanitYolu: join(dir, 'ui-kanit-olu.jsonl') });
  assert.equal(sonuc2.verdict, 'RED');
  assert.match(sonuc2.hata ?? '', /yuz erisilemedi/);
  profil2.kapat();
  console.log('KANIT K12-14: Paseo kod-yolu devrede degil — local runner + bagimsiz evaluator + insan karari + pano bagimsiz web yuzunden teslim dogrulandi (F9-A kanit kayitlari diskte)');
});
