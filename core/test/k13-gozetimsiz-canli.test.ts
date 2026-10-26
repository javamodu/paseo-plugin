// K13-01 (plan §22) — CANLI 6-KOŞUL PAKETİ: 'gece çalıştır' giriş kapısının koşulları
// GERÇEK süreç / GERÇEK dosya sistemi / GERÇEK defter üzerinde tek akışta ispatlanır
// (f3-live deseni: LocalRuntimeAdapter + gerçek node child + dosya registry; yalnız kendi
// spawn ettiğimiz çocuklar öldürülür). Akışın sonunda rozet HAZIR döner; kanıt bayrağı
// getirilmeden fail-closed kırmızı kalır. Koşul kırılım koşumları hermetik dosyada.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { openStore, setGlobalStop, commitCandidate, settleReservation } from '../src/store.ts';
import { createRunPlan, approvePlan, dispatchNode, ensureStartCommand } from '../src/supervisor.ts';
import { processOutbox, reconcileUnknown } from '../src/dispatcher.ts';
import { LocalRuntimeAdapter, LOCAL_REQUIRED_CAPS, type LocalLauncher } from '../src/local-runtime.ts';
import type { ProbeReceipt } from '../src/capabilities.ts';
import { createGrant, revokeGrant } from '../src/grants.ts';
import { takeLease } from '../src/store.ts';
import { evaluateArtifact } from '../src/cli-evaluate.ts';
import { unattendedReadiness } from '../src/gozetimsiz.ts';
import { sampleHandoff } from '../src/handoff.ts';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

function probeAllLocal(): ProbeReceipt {
  const caps: Record<string, boolean> = {};
  for (const c of LOCAL_REQUIRED_CAPS) caps[c] = true;
  return {
    probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: new Date().toISOString(),
    node: process.version, capabilities: caps, blocked: [], probeReceiptHash: '0'.repeat(64),
  };
}

// f3-live RealNodeLauncher (kısaltılmış): gerçek node child + dosya registry
class GercekLauncher implements LocalLauncher {
  launches: string[] = [];
  children = new Map<string, ChildProcess>();
  pids = new Map<string, number>();
  failAfterSpawn = false;
  registryPath: string;
  constructor(registryPath: string) { this.registryPath = registryPath; }
  async launch(o: { dispatchKey: string }) {
    const child = spawn(process.execPath, ['-e', 'setInterval(function(){},1000)'], { stdio: 'ignore' });
    if (child.pid === undefined) throw new Error('pid alinamadi');
    this.children.set(o.dispatchKey, child);
    this.pids.set(o.dispatchKey, child.pid);
    this.launches.push(o.dispatchKey);
    writeFileSync(this.registryPath, JSON.stringify(Object.fromEntries(this.pids)));
    if (this.failAfterSpawn) throw new Error('yanit kaybi: process dogdu mu bilinmiyor');
    return { pid: child.pid };
  }
  pidOf(dispatchKey: string) { return this.pids.get(dispatchKey); }
  async isAlive(pid: number) {
    try { process.kill(pid, 0); return true; } catch (e: any) {
      if (e.code === 'ESRCH') return false;
      if (e.code === 'EPERM') return true;
      return null;
    }
  }
  async kill(pid: number) { try { process.kill(pid, 'SIGKILL'); } catch { /* zaten ölü */ } }
  async cleanup() { for (const c of this.children.values()) { try { c.kill('SIGKILL'); } catch { /* zaten ölü */ } } }
}

test('K13-01 CANLI 6-koşul paketi: gerçek süreç+dosya+düzen ile rozet HAZIR', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'k13-canli-'));
  const launcher = new GercekLauncher(join(dir, 'registry.json'));
  t.after(async () => { await launcher.cleanup(); });
  const db = openStore(join(dir, 'ordu.sqlite'));
  const runId = 'run-k13canli';
  setGlobalStop(db, false, 'insan:test', 'k13 canlı kurulum');
  const { planHash } = createRunPlan(db, {
    capsuleId: 'cap-' + runId, goal: 'K13 canlı 6-koşul', repoId: 'ordu/core', sourceCommit: sha(runId),
    runId, planId: 'plan-' + runId, profileHash: sha('k13c:' + runId),
    nodes: [{ id: 'n1', role: 'coder', deps: [] }, { id: 'n2', role: 'coder', deps: [] }],
    maxWorkers: 2, allowedCommands: ['npm test'],
  });
  approvePlan(db, runId, planHash, 'insan:test');
  const sc = ensureStartCommand(db, runId, planHash, 'insan:test');
  const adapter = new LocalRuntimeAdapter(probeAllLocal(), launcher, { ORDU_RUNTIME: 'local' });

  // ---- (5) grant revoke ÇALIŞIRKEN ETKİ EDER: grantlı dispatch → belirsiz spawn → revoke → iptal niyeti
  const { grantId } = createGrant(db, {
    runId, actions: ['EXTRA_RETRY'], extraRetryBudget: 2,
    expiresAt: '2099-01-01 00:00:00', tokenBudget: 100,
  }, 'insan:test');
  const att1 = dispatchNode(db, runId, 'n1', { tokens: 100, startCommandId: sc, dispatchKey: 'dk-k13c-1', handoff: sampleHandoff(runId), grantId }) as any;
  launcher.failAfterSpawn = true; // süreç GERÇEKTEN doğdu, yanıt kayboldu (A08 belirsizlik)
  const r1 = await processOutbox(db, adapter);
  assert.equal(r1.result, 'unknown');
  const pid1 = launcher.pidOf('dk-k13c-1')!;
  assert.equal(await launcher.isAlive(pid1), true, 'gerçek süreç yaşıyor (pid=' + pid1 + ')');
  revokeGrant(db, grantId, 'insan:test');
  assert.equal((db.prepare('SELECT state FROM attempts WHERE id=?').get(att1.attemptId) as any).state, 'CANCEL_REQUESTED', 'revoke inflight attempti iptale düşürdü — etki İŞLEDİ');

  // ---- (2) iptal doğrulanması + (1) reconcile: GERÇEK ölüm → CANCEL_CONFIRMED → dead-released
  await launcher.kill(pid1); // yalnız kendi çocuğumuz
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(await launcher.isAlive(pid1), false, 'OS ölümü teyitli (pid=' + pid1 + ')');
  const rec = await reconcileUnknown(db, adapter);
  assert.deepEqual(rec.outcomes, ['dead-released'], 'reconcile: UNKNOWN → DEAD_CONFIRMED');
  assert.ok(!!db.prepare("SELECT 1 FROM events WHERE type='CANCEL_CONFIRMED'").get(), 'iptal TEYİTLİ (CANCEL_CONFIRMED)');
  assert.equal((db.prepare('SELECT state FROM reservations WHERE attempt_id=?').get(att1.attemptId) as any).state, 'RELEASED', 'ölü worker slot bıraktı — uzlaştırma TAM');

  // ---- STOP → kalıcı ACK pencesi: mandal kurulur → dispatch bloke → onay metniyle açılır
  setGlobalStop(db, true, 'insan:test', 'k13 canlı stop');
  const rBlok = await processOutbox(db, adapter);
  assert.equal(rBlok.blocked, 'global_stop', 'STOP anında yeni iş YOK');
  setGlobalStop(db, false, 'insan:test', 'resume: I understand the risk', sha('k13-resume'));

  // ---- (6)'ya zemin: n2 GERÇEK spawn (yanıt bu kez döndü — SESSION_BOUND)
  launcher.failAfterSpawn = false;
  const att2 = dispatchNode(db, runId, 'n2', { tokens: 100, startCommandId: sc, dispatchKey: 'dk-k13c-2', handoff: sampleHandoff(runId) }) as any;
  const r2 = await processOutbox(db, adapter);
  assert.equal(r2.result, 'bound', 'ikinci GERÇEK süreç doğdu');
  const pid2 = launcher.pidOf('dk-k13c-2')!;
  assert.equal((db.prepare('SELECT external_session_id FROM attempts WHERE id=?').get(att2.attemptId) as any).external_session_id, 'local:' + pid2);

  // ---- (4) dosya/shell sınırları GERÇEK dosya sisteminde: junction sunuç → değerlendirici RED
  // (attempt RUNNING'deyken değerlendirilir — köpük/kör değerlendirme kapısı B06)
  const gercekDir = join(dir, 'sunug');
  const jun = join(dir, 'sunug-junc');
  symlinkSync(gercekDir, jun, 'junction'); // admin gerektirmez; lstat symlink rapor eder (ölçüldü)
  assert.throws(
    () => evaluateArtifact(db, { attemptId: att2.attemptId, artifactPath: jun, expect: 'x', actorId: 'insan:test', artifactsDir: join(dir, 'art') }),
    /artifact okunamad/, 'junction sunuç kabul zincirine GİRMEZ (M26 değerlendirici ucu canlı)',
  );

  // ---- (6) eski sahip YAZAMAZ: devir (takeLease) → eski fence commit RED → yeni sahip yazar
  const yeniFence = takeLease(db, att2.attemptId, 'yedek-worker', '2099-01-01T00:00:00Z'); // DEVİR
  assert.equal(yeniFence, 2, 'fence 1→2 (sahiplik çiti devirle yükseldi)');
  assert.throws(() => commitCandidate(db, att2.attemptId, 1, sha('eski-sahip'), 'eski-ajan'), /stale\/uygunsuz commit reddi/, 'ESKİ SAHİP yazamaz (K12-08; receipt-fence ≠ yazma engeli değil — KENDİSİ yazma engeli)');
  commitCandidate(db, att2.attemptId, yeniFence, sha('k13c-aday'), 'yedek-worker'); // yeni sahip yazar

  // ---- (3) kullanım ölçülüyor: settle → kendi run'una yazar (ölçülebilir harcama)
  settleReservation(db, att2.attemptId, 'SETTLED', 42);
  assert.equal((db.prepare('SELECT spent_tokens FROM runs WHERE id=?').get(runId) as any).spent_tokens, 42, 'harcama DEFTERDE ölçüldü');

  // ---- ROZET: kanıt bayraklarıyla 6/6 HAZIR; bayraksız fail-closed KIRMIZI
  const rHazir = unattendedReadiness(db, { dosyaShellSinirlariKanitli: true, eskiSahipYazmaEngeliKanitli: true });
  assert.equal(rHazir.rozet, 'gozetimsiz-hazir');
  assert.equal(rHazir.kosullar.filter((k) => k.gecti).length, 6, '6/6 koşul canlı kanıtla geçti');
  const rKanitsiz = unattendedReadiness(db);
  assert.equal(rKanitsiz.rozet, 'gozetimsiz-kullanilamaz');
  assert.equal(rKanitsiz.kosullar.filter((k) => k.gecti).length, 4, 'defter koşulları geçer, yetenek kanıtları fail-closed kırmızı');
  console.log('KANIT K13-01: pid1=' + pid1 + ' (spawn→UNKNOWN→revoke→kill→CANCEL_CONFIRMED) · pid2=' + pid2 + ' (spawn→devir fence2→eski-sahip RED) · junction RED · spent=42 · rozet 6/6');
  db.close();
});
