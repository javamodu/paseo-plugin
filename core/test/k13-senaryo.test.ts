// K13-03 / K13-04 (plan §23) — KOMPOZİT SENARYO KOŞUMLARI.
// SENARYO B (K13-03): coder/tester → GERÇEK test (koşullu komut + gerçek dosya + exit-0)
// → kontrollü API kesintisi → handoff → eski sahibin engellenmesi → deadline'da GÜVENLİ
// kapanış. Her adım mevcut çekirdek kapılarından geçer (K12-07/08/11 bacakları tek akışta).
// SENARYO C (K13-04): İKİ run eşzamanlı — biri düz uçtan uca ACCEPTED, biri B'nin kesintili
// bacağı; oturum/bütçe/karar/çıktı KARIŞMAZ (K12-13 omurgası). DÜRÜST KAPSAM: A'ya özgü
// turnuva çok-tur claim/değerlendirme protokolü F8'de (K13-02) — burada sahte A ÜRETİLMEZ;
// C'nin eşzamanlılık+izolasyon omurgası mevcut çekirdekle uçtan uca sınanır.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, setGlobalStop, takeLease, commitCandidate, settleReservation, recordEvidence } from '../src/store.ts';
import {
  createRunPlan, approvePlan, dispatchNode, ensureStartCommand, requestAcceptance, decideApproval,
} from '../src/supervisor.ts';
import { processOutbox } from '../src/dispatcher.ts';
import type { SpawnResult, WorkerAdapter } from '../src/dispatcher.ts';
import { evaluateArtifact } from '../src/cli-evaluate.ts';
import { enforceDeadline } from '../src/deadline.ts';
import { sampleHandoff } from '../src/handoff.ts';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

class FakeAdapter implements WorkerAdapter {
  spawnCalls: any[] = [];
  script: SpawnResult[]; // boş dizi → spawn exception (kontrollü API kesintisi)
  constructor(script: SpawnResult[] = [{ outcome: 'OK', externalSessionId: 'ses-1' }]) { this.script = [...script]; }
  async spawn(o: any) {
    this.spawnCalls.push(o);
    if (this.script.length === 0) throw new Error('baglanti koptu');
    return this.script.shift()!;
  }
  async lookup(_dk: string) { return 'UNKNOWN' as const; }
}

// kapsül → onay → start komutu: koşullu komut listesi ['npm test'] (P0-4 sözleşme) +
// roller coder/tester + deadline. Kurulum mandalı: taze defter fail-closed doğar.
function kurulum(db: any, runId: string, o: { deadlineAt?: string; nodes?: { id: string; role: string }[] } = {}) {
  setGlobalStop(db, false, 'insan:test', 'k13 senaryo kurulum');
  const nodes = (o.nodes ?? [{ id: 'n1', role: 'coder' }, { id: 'n2', role: 'tester' }]).map((n) => ({ deps: [], ...n }));
  const { planHash } = createRunPlan(db, {
    capsuleId: 'cap-' + runId, goal: 'K13 senaryo ' + runId, repoId: 'ordu/core', sourceCommit: sha(runId),
    runId, planId: 'plan-' + runId, profileHash: sha('k13s:' + runId),
    nodes, maxWorkers: nodes.length, allowedCommands: ['npm test'],
    ...(o.deadlineAt ? { deadlineAt: o.deadlineAt } : {}),
  });
  approvePlan(db, runId, planHash, 'insan:test');
  const startCommandId = ensureStartCommand(db, runId, planHash, 'insan:test');
  return { planHash, startCommandId };
}

const GELECEK = '2099-01-01T00:00:00Z';

test('K13-03 SENARYO B: coder/tester → gerçek test → kesinti → handoff → eski sahip RED → deadline güvenli kapanış', async () => {
  const db = openStore();
  const dir = mkdtempSync(join(tmpdir(), 'k13-b-'));
  const { startCommandId } = kurulum(db, 'run-k13b', {
    deadlineAt: GELECEK,
    nodes: [{ id: 'n1', role: 'coder' }, { id: 'n2', role: 'tester' }, { id: 'n3', role: 'coder' }, { id: 'n4', role: 'coder' }],
  });

  // (1) CODER çalışır → GERÇEK TEST: gerçek dosya + beklenti eşleşmesi + exit-0
  const att1 = dispatchNode(db, 'run-k13b', 'n1', { tokens: 100, startCommandId, dispatchKey: 'dk-k13b-1', handoff: sampleHandoff('run-k13b') }) as any;
  const a1 = new FakeAdapter([{ outcome: 'OK', externalSessionId: 'ses-k13b-1' }]);
  const r1 = await processOutbox(db, a1);
  assert.equal(r1.result, 'bound', 'coder oturumu doğdu');
  const gercekDosya = join(dir, 'test-raporu.txt');
  writeFileSync(gercekDosya, 'npm test: 7 pass / 0 fail — gercek kosum cikisi');
  const ev1 = evaluateArtifact(db, { attemptId: att1.attemptId, artifactPath: gercekDosya, expect: '7 pass / 0 fail', actorId: 'insan:test', artifactsDir: join(dir, 'art') });
  assert.equal(ev1.verdict, 'PASS', 'PASS ancak koşullu komut + gerçek artefakt + beklenti ile');
  assert.equal(ev1.exitCode, 0, 'exit-0');
  assert.equal((db.prepare("SELECT state FROM nodes WHERE run_id='run-k13b' AND id='n1'").get() as any).state, 'DONE', 'coder node DONE');

  // (2) TESTER'a KONTROLLÜ API KESİNTİSİ: spawn exception → UNKNOWN (kör çift iş yok)
  const att2 = dispatchNode(db, 'run-k13b', 'n2', { tokens: 100, startCommandId, dispatchKey: 'dk-k13b-2', handoff: sampleHandoff('run-k13b') }) as any;
  const aKopuk = new FakeAdapter([]); // script boş → exception = API koptu
  const r2 = await processOutbox(db, aKopuk);
  assert.equal(r2.result, 'unknown', 'kesinti → UNKNOWN');
  const calls = aKopuk.spawnCalls.length;
  await processOutbox(db, aKopuk);
  assert.equal(aKopuk.spawnCalls.length, calls, 'A08: UNKNOWN satır spawn yoluna DÖNMEZ — çift iş yok');

  // (3) HANDOFF: devir (takeLease fence 1→2) → ESKİ SAHİP ENGELLENİR, yeni sahip yazar
  const yeniFence = takeLease(db, att2.attemptId, 'yedek-worker', '2099-01-01T00:00:00Z');
  assert.equal(yeniFence, 2, 'devir: sahiplik çiti yükseldi');
  assert.throws(() => commitCandidate(db, att2.attemptId, 1, sha('eski-sahip-aday'), 'eski-ajan'), /stale\/uygunsuz commit reddi/, 'eski sahip aday YAZAMAZ');
  assert.throws(
    () => recordEvidence(db, {
      attemptId: att2.attemptId, presentedFence: 1, artifactHash: sha('b'), storageRef: 's', bytes: 1,
      environmentHash: sha('v'), evaluatorHash: sha('h'), exitCode: 0, verdict: 'PASS', testCount: 1, actorId: 'eski-ajan',
    }),
    /stale fence/, 'eski sahip KANIT da yazamaz (A36 iki bacak)',
  );
  commitCandidate(db, att2.attemptId, yeniFence, sha('yeni-sahip-aday'), 'yedek-worker');

  // (4) DEADLINE'DA GÜVENLİ KAPANIŞ: n3 RUNNING'deyken süre dolar → checkpoint KALIR + insan kartı
  const att3 = dispatchNode(db, 'run-k13b', 'n3', { tokens: 100, startCommandId, dispatchKey: 'dk-k13b-3', handoff: sampleHandoff('run-k13b') }) as any;
  const a3 = new FakeAdapter([{ outcome: 'OK', externalSessionId: 'ses-k13b-3' }]);
  const r3 = await processOutbox(db, a3);
  assert.equal(r3.result, 'bound');
  const kapanis = enforceDeadline(db, { runId: 'run-k13b', actor: 'insan:test', now: () => new Date('2099-06-01T00:00:00Z') }) as any;
  assert.equal(kapanis.status, 'CLOSED', 'deadline kapanışı');
  assert.equal(kapanis.runningAttempts, 1, 'RUNNING attempt checkpointte');
  assert.equal((db.prepare('SELECT state FROM attempts WHERE id=?').get(att3.attemptId) as any).state, 'RUNNING', 'kalite kapıları süre baskısıyla DÜŞMEZ — durum korunur');
  const kart = db.prepare("SELECT action,decision FROM approvals WHERE run_id='run-k13b'").get() as any;
  assert.equal(kart.action, 'DEADLINE_CLOSE');
  assert.equal(kart.decision, 'PENDING', 'kapanış kararı İNSANI bekler');
  assert.throws(
    () => dispatchNode(db, 'run-k13b', 'n4', { tokens: 100, startCommandId, dispatchKey: 'dk-k13b-4', handoff: sampleHandoff('run-k13b'), now: () => new Date('2099-06-01T00:00:00Z') }),
    /R4 deadline doldu/, 'kapanmış runa YENİ dispatch YOK',
  );
  // kabul zinciri: run ASLA ACCEPTED olmaz (n2 CANDIDATE_FROZEN ama değerlendirme YOK; n3 RUNNING; n4 doğmadı)
  assert.throws(() => requestAcceptance(db, 'run-k13b', 'insan:test'), /tum node DONE/);
  assert.notEqual((db.prepare("SELECT state FROM runs WHERE id='run-k13b'").get() as any).state, 'ACCEPTED');
  // bütçe: harcama ölçüldü (defterde) — checkpoint'teki attempt settle edilir, kendi run'una yazar
  settleReservation(db, att3.attemptId, 'SETTLED', 21);
  assert.equal((db.prepare("SELECT spent_tokens FROM runs WHERE id='run-k13b'").get() as any).spent_tokens, 21);
});

test('K13-04 SENARYO C: iki run eşzamanlı — oturum/bütçe/karar/çıktı KARIŞMAZ (A turnuva bacağı F8 — dürüst kapsam)', async () => {
  const db = openStore();
  const dir = mkdtempSync(join(tmpdir(), 'k13-c-'));
  // RUN-A: DÜZ uçtan uca (A'nın tek-tur iskeleti: dispatch → bağlan → gerçek değerlendirme
  // → teslim → insan kararı ACCEPTED). Çok-tur turnuva claim'leri F8'de — burada taklit YOK.
  const scA = kurulum(db, 'run-k13ca', { nodes: [{ id: 'n1', role: 'coder' }] });
  // RUN-B: B'nin kesintili bacağı eşzamanlı (kesinti → devir → deadline kapanışı)
  const scB = kurulum(db, 'run-k13cb', {
    deadlineAt: GELECEK,
    nodes: [{ id: 'n1', role: 'coder' }, { id: 'n2', role: 'coder' }],
  });
  const attA = dispatchNode(db, 'run-k13ca', 'n1', { tokens: 100, startCommandId: scA.startCommandId, dispatchKey: 'dk-k13ca-1', handoff: sampleHandoff('run-k13ca') }) as any;
  const attB = dispatchNode(db, 'run-k13cb', 'n1', { tokens: 100, startCommandId: scB.startCommandId, dispatchKey: 'dk-k13cb-1', handoff: sampleHandoff('run-k13cb') }) as any;
  const a = new FakeAdapter([
    { outcome: 'OK', externalSessionId: 'ses-C-A' }, // run-A
    { outcome: 'OK', externalSessionId: 'ses-C-B' }, // run-B
  ]);
  await processOutbox(db, a); // run-A
  await processOutbox(db, a); // run-B

  // OTURUM ayrımı: harici oturumlar/dispatch anahtarları/run'lar tekil
  const atts = db.prepare('SELECT a.id,a.run_id,a.external_session_id,o.dispatch_key FROM attempts a JOIN outbox o ON o.attempt_id=a.id ORDER BY a.rowid').all() as any[];
  assert.equal(atts.length, 2);
  assert.notEqual(atts[0].external_session_id, atts[1].external_session_id, 'oturumlar karışmaz');
  assert.notEqual(atts[0].dispatch_key, atts[1].dispatch_key, 'dispatch anahtarları karışmaz');
  assert.notEqual(atts[0].run_id, atts[1].run_id, 'run kimlikleri karışmaz');

  // RUN-A düz kapanır: gerçek dosya → PASS → teslim → insan kararı
  const dosyaA = join(dir, 'a-cikti.txt');
  writeFileSync(dosyaA, 'A run urunu: beklenen icerik');
  const evA = evaluateArtifact(db, { attemptId: attA.attemptId, artifactPath: dosyaA, expect: 'A run urunu', actorId: 'insan:test', artifactsDir: join(dir, 'art') });
  assert.equal(evA.verdict, 'PASS');
  const { approvalId } = requestAcceptance(db, 'run-k13ca', 'insan:test');
  const versiyonA = (db.prepare('SELECT version FROM runs WHERE id=?').get('run-k13ca') as any).version;
  const karar = decideApproval(db, approvalId, 'APPROVED', 'insan:test', versiyonA);
  assert.equal(karar.status, 'ACCEPTED', 'run-A insan kararıyla KAPANDI');
  assert.equal((db.prepare("SELECT state FROM runs WHERE id='run-k13ca'").get() as any).state, 'ACCEPTED');

  // RUN-B eşzamanlıda kesilir: devir + deadline kapanışı (kart PENDING kalır)
  const yeniFence = takeLease(db, attB.attemptId, 'yedek-worker', '2099-01-01T00:00:00Z');
  commitCandidate(db, attB.attemptId, yeniFence, sha('B-aday'), 'yedek-worker');
  const attB2 = dispatchNode(db, 'run-k13cb', 'n2', { tokens: 100, startCommandId: scB.startCommandId, dispatchKey: 'dk-k13cb-2', handoff: sampleHandoff('run-k13cb') }) as any;
  const a2 = new FakeAdapter([{ outcome: 'OK', externalSessionId: 'ses-C-B2' }]);
  await processOutbox(db, a2);
  enforceDeadline(db, { runId: 'run-k13cb', actor: 'insan:test', now: () => new Date('2099-06-01T00:00:00Z') });

  // KARAR ayrımı: A'nın APPROVED onayı B'nin kapanış kartına SINAMAZ (approvals.run_id izolasyonu)
  const kartlar = db.prepare('SELECT run_id,action,decision FROM approvals ORDER BY run_id').all() as any[];
  assert.deepEqual(kartlar.map((k) => [k.run_id, k.action, k.decision]), [
    ['run-k13ca', 'ACCEPT_RESULT', 'APPROVED'],
    ['run-k13cb', 'DEADLINE_CLOSE', 'PENDING'],
  ], 'kararlar kendi runina bagli — B karti insani bekler');
  assert.notEqual((db.prepare("SELECT state FROM runs WHERE id='run-k13cb'").get() as any).state, 'ACCEPTED', 'run-B ASLA ACCEPTED olmaz');

  // BÜTÇE ayrımı: A'nın değerlendirmesi kendi run'una otomatik settle (0) yazar; B elle
  // settle edilir (22) — harcama satırları KENDİ run'larına gider, karışmaz
  settleReservation(db, attB.attemptId, 'SETTLED', 22);
  const spent = db.prepare("SELECT id,spent_tokens FROM runs WHERE id IN ('run-k13ca','run-k13cb') ORDER BY id").all() as any[];
  assert.deepEqual(spent.map((s) => [s.id, s.spent_tokens]), [['run-k13ca', 0], ['run-k13cb', 22]], 'bütçe karışmaz');

  // ÇIKTI ayrımı: aday karmaları tekil (A04 deneme kimliği; A'nın adayı B'ye kaymaz)
  const hashes = db.prepare('SELECT run_id, candidate_hash FROM attempts WHERE candidate_hash IS NOT NULL').all() as any[];
  assert.equal(new Set(hashes.map((h) => h.candidate_hash)).size, hashes.length, 'aday karması yok');
  assert.ok(hashes.every((h) => h.run_id === 'run-k13ca' || h.run_id === 'run-k13cb'));
  void attB2;
});
