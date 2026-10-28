// V3-S3.1 + F5-C canlı bacak (FAZ-3 K2; triyaj raporlar/faz3-triyaj-2026-10-25.md):
// GERÇEK koşukluk (WAIT_CAPACITY) + GERÇEK kapasite/çakışma ölçümü. Hermetik kol
// (supervisor.test A24) kapı mantığını ölçümsüz sınamıştı; burada slotları GERÇEK
// yaşayan node süreçleri tutar: max_workers=2 → iki gerçek worker doğar (pid'ler
// kayıtlı, OS-seviye canlı), üçüncü node CAPACITY_WAIT ile YAKMASIZ bekler (attempt
// satırı YOK, spawn YOK). GERÇEK worker ölümü slotu geri doğurur → üçüncü node
// dispatch edilir → üçüncü GERÇEK spawn. F5-C ölçümü: doluluk 2/2, çakışma 0
// (node başına tek attempt, toplam launch sayısı = dispatch sayısı, çift spawn yok).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, setGlobalStop, pendingCapacity } from '../src/store.ts';
import { createRunPlan, approvePlan, ensureStartCommand, dispatchNode, settleNodeOutcome } from '../src/supervisor.ts';
import { processOutbox } from '../src/dispatcher.ts';
import { LocalRuntimeAdapter, type LocalLauncher } from '../src/local-runtime.ts';
import { sampleHandoff } from '../src/handoff.ts';
import type { ProbeReceipt } from '../src/capabilities.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

// f3-live deseni: GERÇEK süreç launcher — her launch gerçek node çocuğu doğurur,
// pid dosya-tabanlı durable registry'ye yazılır (LocalLauncher sözleşmesi).
class RealNodeLauncher implements LocalLauncher {
  launches: string[] = [];
  children = new Map<string, ChildProcess>();
  pids = new Map<string, number>();
  registryPath: string;
  constructor(registryPath: string) {
    this.registryPath = registryPath;
    if (existsSync(registryPath)) {
      const raw = JSON.parse(readFileSync(registryPath, 'utf8'));
      for (const k of Object.keys(raw)) this.pids.set(k, raw[k]);
    }
  }
  async launch(o: { dispatchKey: string }) {
    const child = spawn(process.execPath, ['-e', 'setInterval(function(){},1000)'], { stdio: 'ignore' });
    if (child.pid === undefined) throw new Error('pid alinamadi');
    this.children.set(o.dispatchKey, child);
    this.pids.set(o.dispatchKey, child.pid);
    this.launches.push(o.dispatchKey);
    writeFileSync(this.registryPath, JSON.stringify(Object.fromEntries(this.pids)));
    return { pid: child.pid };
  }
  pidOf(dispatchKey: string) { return this.pids.get(dispatchKey); }
  dispatchKeyOf(_attemptId: string): string | undefined { return undefined; } // tip-borcu v9-06: sahte attempt izlemez — cancel yolu UNKNOWN (fail-closed); gerçek impl git-worktree-launcher'da
  async isAlive(pid: number) {
    try { process.kill(pid, 0); return true; } catch (e: any) {
      if (e.code === 'ESRCH') return false;
      if (e.code === 'EPERM') return true;
      return null;
    }
  }
  async kill(pid: number) { try { process.kill(pid, 'SIGKILL'); } catch { /* zaten ölü */ } }
  async cleanup() { for (const c of this.children.values()) { try { c.kill('SIGKILL'); } catch { /* ölü */ } } }
}

const waitExit = (c: ChildProcess) => new Promise<void>((res) => {
  if (c.exitCode !== null || c.signalCode !== null) return res();
  c.once('exit', () => res());
});

// local runtime yeteneklerinin tamamı kanıtlı sahte-receipt (kapı amaçlı; süreçler GERÇEK)
function probeAllLocal(): ProbeReceipt {
  const caps: Record<string, boolean> = {
    nodePinned24: true, gitPresent: true, paseoCliPresent: true, paseoDaemonReachable: true,
    worktreeIsolationProven: true, sandboxEstablished: true, structuredOutput: true,
    usageReporting: true, cancelConfirm: true, gitWorktreeProven: true,
    processRegistryDurable: true, cancelConfirmLocal: true, providerCliPresent: true,
  };
  return { probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: new Date().toISOString(), node: process.version, capabilities: caps, blocked: [], probeReceiptHash: '0'.repeat(64) } as ProbeReceipt;
}

test('V3-S3.1 + F5-C canlı: GERÇEK worker' + 'lar slotları tutar → CAPACITY_WAIT yakmasız; gerçek ölüm slotu doğurur; çakışma 0', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-s31-'));
  const db = openStore(join(dir, 'ordu.sqlite'));
  setGlobalStop(db, false, 'test', 'acilis');
  db.prepare('UPDATE settings SET max_workers=2 WHERE id=1').run(); // GERÇEK kapasite tavanı: 2
  t.after(() => { db.close(); });

  const launcher = new RealNodeLauncher(join(dir, 'registry.json'));
  t.after(async () => { await launcher.cleanup(); });
  const adapter = new LocalRuntimeAdapter(probeAllLocal(), launcher, { ORDU_RUNTIME: 'local' });

  // 3 BAĞIMSIZ node (deps yok) — hepsi anında hazır
  const { planHash } = createRunPlan(db, {
    capsuleId: 'cap-1', goal: 'kapasite canli', repoId: 'repo', sourceCommit: H64('a'),
    runId: 'run-1', planId: 'plan-1', profileHash: H64('p'), maxWorkers: 2,
    nodes: [
      { id: 'n1', role: 'coder', deps: [] },
      { id: 'n2', role: 'coder', deps: [] },
      { id: 'n3', role: 'coder', deps: [] },
    ],
  });
  approvePlan(db, 'run-1', planHash, 'human');
  const startCmd = ensureStartCommand(db, 'run-1', planHash, 'operator');
  const opt = (key: string) => ({ tokens: 50, startCommandId: startCmd, dispatchKey: key, handoff: sampleHandoff('run-1') });

  const col = (sql: string) => { const r = db.prepare(sql).get() as any; return r[Object.keys(r)[0]]; };

  // 1) iki node dispatch → İKİ GERÇEK worker doğar, slotları tutar
  const d1 = dispatchNode(db, 'run-1', 'n1', opt('dk-n1'));
  const d2 = dispatchNode(db, 'run-1', 'n2', opt('dk-n2'));
  assert.equal(d1.status, 'DISPATCHED');
  assert.equal(d2.status, 'DISPATCHED');
  const sp1 = await processOutbox(db, adapter);
  const sp2 = await processOutbox(db, adapter); // her çağrı tek sıra işler (LIMIT 1)
  assert.equal(sp1.result, 'bound');
  assert.equal(sp2.result, 'bound');
  assert.equal(launcher.launches.length, 2, 'İKİ GERÇEK süreç doğdu');
  const pid1 = launcher.pidOf('dk-n1')!;
  const pid2 = launcher.pidOf('dk-n2')!;
  assert.ok(pid1 > 0 && pid2 > 0 && pid1 !== pid2, 'gerçek pid: ' + pid1 + ' ve ' + pid2);
  assert.equal(await launcher.isAlive(pid1), true, 'worker-1 GERÇEKTEN yaşıyor');
  assert.equal(await launcher.isAlive(pid2), true, 'worker-2 GERÇEKTEN yaşıyor');
  assert.equal(col("SELECT COUNT(*) FROM reservations WHERE state='ACTIVE'"), 2);
  assert.equal(col("SELECT external_session_id FROM attempts WHERE id='" + d1.attemptId + "'"), 'local:' + pid1, 'attempt gercek pid-ye bagli');

  // 2) üçüncü node: kapasite DOLU → CAPACITY_WAIT (YAKMAZ: attempt yok, spawn yok)
  const d3 = dispatchNode(db, 'run-1', 'n3', opt('dk-n3'));
  assert.equal(d3.status, 'WAIT_CAPACITY');
  assert.equal(col("SELECT state FROM nodes WHERE run_id='run-1' AND id='n3'"), 'PENDING', 'node beklemeye döner');
  assert.equal(col("SELECT COUNT(*) FROM attempts WHERE node_id='n3'"), 0, 'YAKMAZ: attempt satırı YOK');
  assert.equal(col("SELECT COUNT(*) FROM events WHERE type='CAPACITY_WAIT'"), 1, 'CAPACITY_WAIT kanıtı defterde');
  assert.equal(launcher.launches.length, 2, 'üçüncü spawn HİÇ gitmedi');
  // çakışma ölçümü (F5-C): node başına TEK attempt; koşan worker'a ikinci dispatch RED
  assert.equal(col("SELECT COUNT(*) FROM attempts WHERE node_id='n1'"), 1);
  assert.throws(() => dispatchNode(db, 'run-1', 'n2', opt('dk-n2-tekrar')), /dispatch-edilebilir degil/, 'üst üste binme RED');

  // 3) GERÇEK ölüm: worker-1'i SIGKILL ile öldür → OS teyidi → arızalı attempt slotu bırakır
  await launcher.kill(pid1);
  await waitExit(launcher.children.get('dk-n1')!);
  assert.equal(await launcher.isAlive(pid1), false, 'worker-1 OS-seviye ÖLDÜ (pid=' + pid1 + ')');
  settleNodeOutcome(db, d1.attemptId, 'FAIL', 'worker-oldu');
  assert.equal(col("SELECT state FROM reservations WHERE attempt_id='" + d1.attemptId + "'"), 'RELEASED', 'gerçek ölüm → slot GERİEKİ DOĞDU (RELEASED)');

  // 4) üçüncü node ARTIK dispatch edilir → ÜÇÜNCÜ GERÇEK spawn
  const d3b = dispatchNode(db, 'run-1', 'n3', opt('dk-n3'));
  assert.equal(d3b.status, 'DISPATCHED', 'boşalan slotla bekleyen node dispatch edildi');
  const sp3 = await processOutbox(db, adapter);
  assert.equal(sp3.result, 'bound');
  assert.equal(launcher.launches.length, 3, 'ÜÇÜNCÜ GERÇEK süreç doğdu (toplam 3 launch = 3 dispatch)');
  const pid3 = launcher.pidOf('dk-n3')!;
  assert.equal(await launcher.isAlive(pid3), true, 'worker-3 GERÇEKTEN yaşıyor');

  // 5) F5-C sonuç ölçümü: doluluk 2/2 (yeni dizilim), çakışma 0 (tekrarsız launch)
  assert.equal(col("SELECT COUNT(*) FROM reservations WHERE state='ACTIVE'"), 2, 'kapasite yeniden dolu: 2/2');
  assert.equal(new Set(launcher.launches).size, launcher.launches.length, 'çakışma 0: launch anahtarları TEKRARSIZ');
  for (const n of ['n1', 'n2', 'n3']) {
    assert.equal(col("SELECT COUNT(*) FROM attempts WHERE node_id='" + n + "'"), 1, 'node ' + n + ' tam bir attempt');
  }
  console.log('KANIT V3-S3.1: 2 gerçek worker (pid ' + pid1 + '+' + pid2 + ') slotları tuttu → n3 CAPACITY_WAIT (attempt 0; spawn 0); worker-1 gerçek ölüm → slot doğdu → n3 dispatch → 3. gerçek spawn (pid ' + pid3 + ')');
  console.log('KANIT F5-C: kapasite doluluk 2/2 ölçüldü; çakışma 0 (3 launch tekrarsız; node başına 1 attempt; çalışan worker-a ikinci dispatch RED)');
});

// ---- SLOT (K-0006 v3.0.0 par4): slot sayımı REZERVASYONLA, etiketle değil ----
// Eşleme (F5-A/F5-B emsal deseni): v3.0.0 "WAITING/PAUSED slot tutar" → modern şemada
// UNKNOWN (yanıt kaybı bekleme durumu) slotu tutar (001-initial.sql:84 ACTIVE+UNKNOWN sayar);
// "ölçülemeyen iç nested ajan KAPALI" → runs.usage_unknown=1 → rezervasyon kabulü
// unknown_budget ABORT ile KAPALI (001-initial.sql:82-83). Her iki bacak GERÇEK süreçle.
class AmbiguousLauncher extends RealNodeLauncher {
  failAfterSpawn = false;
  async launch(o: { dispatchKey: string }) {
    const r = await super.launch(o);
    if (this.failAfterSpawn) throw new Error('yanit kaybi: surec dogdu mu bilinmiyor');
    return r;
  }
}

test('SLOT canlı: UNKNOWN rezervasyon slotu TUTAR (etiket yok) + YAŞAYAN süreç RELEASED ile slotu bırakır (etiketle değil) + ölçülemeyen KAPALI (unknown_budget)', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-slot-'));
  const db = openStore(join(dir, 'ordu.sqlite'));
  setGlobalStop(db, false, 'test', 'acilis');
  db.prepare('UPDATE settings SET max_workers=2 WHERE id=1').run(); // GERÇEK kapasite tavanı: 2
  t.after(() => { db.close(); });

  const launcher = new AmbiguousLauncher(join(dir, 'registry.json'));
  t.after(async () => { await launcher.cleanup(); });
  const adapter = new LocalRuntimeAdapter(probeAllLocal(), launcher, { ORDU_RUNTIME: 'local' });

  const { planHash } = createRunPlan(db, {
    capsuleId: 'cap-slot', goal: 'slot canli', repoId: 'repo', sourceCommit: H64('s'),
    runId: 'run-slot', planId: 'plan-slot', profileHash: H64('p'), maxWorkers: 2,
    nodes: [
      { id: 'n1', role: 'coder', deps: [] },
      { id: 'n2', role: 'coder', deps: [] },
      { id: 'n3', role: 'coder', deps: [] },
      { id: 'n4', role: 'coder', deps: [] },
    ],
  });
  approvePlan(db, 'run-slot', planHash, 'human');
  const startCmd = ensureStartCommand(db, 'run-slot', planHash, 'operator');
  const opt = (key: string) => ({ tokens: 50, startCommandId: startCmd, dispatchKey: key, handoff: sampleHandoff('run-slot') });
  const col = (sql: string) => { const r = db.prepare(sql).get() as any; return r[Object.keys(r)[0]]; };

  // 1) n1: GERÇEK süreç doğdu ama launch YANITI KAYBOLDU → reservation UNKNOWN (etiket bağlanmadı)
  launcher.failAfterSpawn = true;
  const d1 = dispatchNode(db, 'run-slot', 'n1', opt('dk-s1'));
  assert.equal(d1.status, 'DISPATCHED');
  const sp1 = await processOutbox(db, adapter);
  assert.equal(sp1.result, 'unknown', 'yanit kaybi: bilinmezlik asil kaynak (A08)');
  assert.equal(col("SELECT state FROM reservations WHERE attempt_id='" + d1.attemptId + "'"), 'UNKNOWN');
  const pid1 = launcher.pidOf('dk-s1')!;
  assert.equal(await launcher.isAlive(pid1), true, 'belirsiz süreç GERÇEKTEN yaşıyor (pid=' + pid1 + ')');
  assert.equal(col("SELECT external_session_id FROM attempts WHERE id='" + d1.attemptId + "'"), null, 'etiket HİÇ bağlanmadı (yanıt kaybı)');

  // 2) n2: normal dispatch → ACTIVE + GERÇEK spawn + etiketli
  launcher.failAfterSpawn = false;
  const d2 = dispatchNode(db, 'run-slot', 'n2', opt('dk-s2'));
  assert.equal(d2.status, 'DISPATCHED');
  const sp2 = await processOutbox(db, adapter);
  assert.equal(sp2.result, 'bound');
  const pid2 = launcher.pidOf('dk-s2')!;
  assert.ok(pid2 > 0 && pid2 !== pid1, 'iki gerçek pid: ' + pid1 + ' ve ' + pid2);
  assert.equal(col("SELECT state FROM reservations WHERE attempt_id='" + d2.attemptId + "'"), 'ACTIVE');

  // 3) SLOT TUTULUYOR: 1 UNKNOWN + 1 ACTIVE = 2/2 → n3 CAPACITY_WAIT (yakmasız)
  assert.equal(pendingCapacity(db), 2, 'UNKNOWN + ACTIVE = 2 slot — sayım REZERVASYONLA (etiketle değil)');
  const d3 = dispatchNode(db, 'run-slot', 'n3', opt('dk-s3'));
  assert.equal(d3.status, 'WAIT_CAPACITY', 'etiketsiz UNKNOWN bekleyen yine de slot TUTAR → 3. dispatch bekler');
  assert.equal(col("SELECT COUNT(*) FROM attempts WHERE node_id='n3'"), 0, 'YAKMAZ: attempt yok');
  assert.equal(col("SELECT COUNT(*) FROM events WHERE type='CAPACITY_WAIT'"), 1);
  assert.equal(launcher.launches.length, 2, 'üçüncü spawn HİÇ gitmedi');

  // 4) ETİKETLE DEĞİL (ters yön): n2 GERÇEKTEN YAŞIYORKEN rezervasyon RELEASED → slot SERBEST
  settleNodeOutcome(db, d2.attemptId, 'FAIL', 'test-settle');
  assert.equal(col("SELECT state FROM reservations WHERE attempt_id='" + d2.attemptId + "'"), 'RELEASED');
  assert.equal(await launcher.isAlive(pid2), true, 'süreç HÂLÂ yaşıyor — yine de slot FREE (etiket değil rezervasyon sayar)');
  assert.equal(pendingCapacity(db), 1, 'RELEASED slotu bıraktı');
  const d3b = dispatchNode(db, 'run-slot', 'n3', opt('dk-s3'));
  assert.equal(d3b.status, 'DISPATCHED', 'boşalan slotla bekleyen node dispatch edildi');
  const sp3 = await processOutbox(db, adapter);
  assert.equal(sp3.result, 'bound');
  const pid3 = launcher.pidOf('dk-s3')!;
  assert.equal(await launcher.isAlive(pid3), true, 'üçüncü GERÇEK spawn (pid=' + pid3 + ')');
  assert.equal(col("SELECT external_session_id FROM attempts WHERE id='" + d3b.attemptId + "'"), 'local:' + pid3);

  // 5) ÖLÇÜLEMEYEN-NESTED KAPALI: önce UNKNOWN da bırakılır (kapasite boş — yalnız unknown_budget kesebilir)
  settleNodeOutcome(db, d1.attemptId, 'FAIL', 'test-settle');
  assert.equal(col("SELECT state FROM reservations WHERE attempt_id='" + d1.attemptId + "'"), 'RELEASED', 'UNKNOWN→RELEASED (A35 yolu)');
  assert.equal(pendingCapacity(db), 1, 'kapasite dolu DEĞİL — RED nedeni yalnız unknown_budget olabilir');
  db.prepare("UPDATE runs SET usage_unknown=1 WHERE id='run-slot'").run();
  assert.throws(() => dispatchNode(db, 'run-slot', 'n4', opt('dk-s4')), /unknown_budget/, 'ölçülemeyen kullanım yeni dispatch KAPATIR');
  assert.equal(col("SELECT state FROM nodes WHERE run_id='run-slot' AND id='n4'"), 'PENDING', 'dispatch geri alındı (tx rollback)');
  assert.equal(col("SELECT COUNT(*) FROM attempts WHERE node_id='n4'"), 0, 'attempt satırı YOK');

  console.log('KANIT SLOT: yanıt-kaybı n1 (pid ' + pid1 + ') ETİKETSİZ UNKNOWN olarak slot tuttu → n3 CAPACITY_WAIT (attempt 0; spawn 0); n2 (pid ' + pid2 + ') YAŞADIĞI halde RELEASED rezervasyon slotu bıraktı → 3. gerçek spawn (pid ' + pid3 + '); usage_unknown=1 → dispatch unknown_budget RED (ölçülemeyen-nested KAPALI) — sayım rezervasyonla, etiketle değil');
});
