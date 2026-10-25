// PLAN v2.9 bol.22 K13-01 - kalan 3 canli kosulun GERCEK child-process kaniti.
// Kalip: live-gates-v3.test.ts (evaluator/adapter rig desenleri) + f3-live.test.ts
// (RealNodeLauncher: gercek node child, pid registry, SIGKILL). LLM cagrisi YOK,
// dis API YOK, maliyet YOK. Yalniz kendi spawn ettigimiz child'lar oldurulur.
//
// Kapi (2) IPTAL TEYIDI: gercek child kosarken cancel -> CONFIRMED_DEAD (pid olumu
//   OS'ta dogrulanir) -> CANCELLED + rezervasyon RELEASED. UNSUPPORTED dali da kanitli.
//   BULGU BUG-C2 (dalga-3, KAPATILDI - TUR A src duzeltmesi): LocalRuntimeAdapter.cancel
//   sozlesme-disiydi (dispatchKey bekliyor, boolean donduruyordu; requestCancel attemptId
//   gonderdigi icin kill'e HIC ulasilmazdi). Duzeltildi: cancel(attemptId) artik kanonik
//   enum doner (spawn aninda attemptId->dispatchKey baglantil, gercek kill + OS olum
//   dogrulamasi). Regresyon kaniti asagida (KANIT BUG-C2-KAPALI).
//   Gecerli kanit, sozlesme-uyumlu LiveBridgeAdapter ile verilir (test-tarafi kopru;
//   gercek launcher + gercek pid olum dogrulamasi kullanir).
// Kapi (5) GRANT REVOKE IN-FLIGHT: vekil grant'li attempt gercek child ile kosarken
//   revoke -> CANCEL_REQUESTED + fencing bump, KOR KILL YOK (pid canli kalir -> kanit),
//   slot TUTULUR; yeni vekil islemi RED; iptal teyitlenince CANCELLED + RELEASED.
// Kapi (6) HANDOFF SONRASI ESKI SAHIP: gercek disk-tabanli store'da devir (takeLease
//   fence bump) sonrasi eski fence ile commitCandidate/recordEvidence RED (FenceError),
//   yeni sahip yazar. BULGU BUG-C6 (dalga-3, KAPATILDI - TUR A src duzeltmesi): store
//   citi kapaliydi ama eski sahibin SURECI devirden sonra diske yazmaya devam ediyordu.
//   Duzeltildi: cancelStaleOwner (adapter-contract.ts) devir aninda eski sahibin
//   surecini oldurur — attempt durumu degismez; niyet CANCEL_REQUESTED, teyit
//   RUNTIME_OBSERVED dallariyla kaydolur (yeni olay tipi acilmaz - baseline senkron).
//   Kosul 6 artik TEK adimda kapaniyor (KANIT BUG-C6-KAPALI asagida; devir+iptal
//   birlesim yolu yedek kanit).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import {
  openStore, recordCommand, setGlobalStop, reserveDispatch, takeLease,
  commitCandidate, recordEvidence, GateError, FenceError,
} from '../src/store.ts';
import { processOutbox, type WorkerAdapter, type SpawnResult } from '../src/dispatcher.ts';
import { LocalRuntimeAdapter, LOCAL_REQUIRED_CAPS, type LocalLauncher } from '../src/local-runtime.ts';
import { requestCancel, cancelStaleOwner } from '../src/adapter-contract.ts';
import { createGrant, revokeGrant, assertGrantDispatchable, type GrantInput } from '../src/grants.ts';
import {
  createRunPlan, approvePlan, ensureStartCommand, dispatchNode, requestGrantApproval, decideWithGrant,
} from '../src/supervisor.ts';
import { sampleHandoff } from '../src/handoff.ts';
import type { ProbeReceipt } from '../src/capabilities.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);
const FUTURE = '2099-01-01T00:00:00Z';

const col = (db: any, sql: string) => {
  const row = db.prepare(sql).get() as any;
  return row[Object.keys(row)[0]];
};
const evCount = (db: any, type: string) =>
  (db.prepare('SELECT COUNT(*) c FROM events WHERE type=?').get(type) as any).c;

function probeAllLocal(): ProbeReceipt {
  const caps: Record<string, boolean> = {};
  for (const c of LOCAL_REQUIRED_CAPS) caps[c] = true;
  return {
    probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: new Date().toISOString(),
    node: process.version, capabilities: caps, blocked: [], probeReceiptHash: '0'.repeat(64),
  } as ProbeReceipt;
}

// Gercek surec launcher (f3-live RealNodeLauncher deseni): her launch GERCEK node
// child'i dogurur. writerScript verilirse child uyumak yerine 100ms'de bir dosyaya
// yazar (kapi 6'nin OS-seviye yazma gozlemi icin). Yalniz kendi child'larimiz oldurulur.
class RealNodeLauncher implements LocalLauncher {
  launches: string[] = [];
  children = new Map<string, ChildProcess>();
  pids = new Map<string, number>();
  writerScript: string | null = null;
  async launch(o: { dispatchKey: string }) {
    const script = this.writerScript ?? 'setInterval(function(){},1000)';
    const child = spawn(process.execPath, ['-e', script], { stdio: 'ignore' });
    if (child.pid === undefined) throw new Error('pid alinamadi');
    this.children.set(o.dispatchKey, child);
    this.pids.set(o.dispatchKey, child.pid);
    this.launches.push(o.dispatchKey);
    return { pid: child.pid };
  }
  pidOf(dispatchKey: string) { return this.pids.get(dispatchKey); }
  async isAlive(pid: number) {
    try { process.kill(pid, 0); return true; } catch (e: any) {
      if (e.code === 'ESRCH') return false;
      if (e.code === 'EPERM') return true;
      return null; // belirsiz -> fail-closed UNKNOWN
    }
  }
  async kill(pid: number) { try { process.kill(pid, 'SIGKILL'); } catch { /* zaten olu */ } }
  async cleanup() {
    for (const child of this.children.values()) {
      try { child.kill('SIGKILL'); } catch { /* zaten olu */ }
    }
  }
}
// WorkerAdapter sozlesmesine UYUMLU kopru: cancel(attemptId) -> dispatchKey -> pid ->
// gercek kill -> OS'ta olum dogrulamasi -> ancak o zaman CONFIRMED_DEAD.
// (LocalRuntimeAdapter.cancel'in yapmadigi koprulama + teyit; BUG-C2 kaniti icin kiyas.)
class LiveBridgeAdapter implements WorkerAdapter {
  launcher: RealNodeLauncher;
  byAttempt = new Map<string, string>(); // attemptId -> dispatchKey
  cancelMode: 'KILL' | 'UNKNOWN' = 'KILL';
  constructor(launcher: RealNodeLauncher) { this.launcher = launcher; }
  async spawn(o: { dispatchKey: string; attemptId: string }): Promise<SpawnResult> {
    const { pid } = await this.launcher.launch({ dispatchKey: o.dispatchKey, attemptId: o.attemptId, prompt: 'live-gates-v4' });
    this.byAttempt.set(o.attemptId, o.dispatchKey);
    return { outcome: 'OK', externalSessionId: 'local:' + pid };
  }
  async lookup(dispatchKey: string) {
    const pid = this.launcher.pidOf(dispatchKey);
    if (pid === undefined) return 'UNKNOWN' as const;
    const alive = await this.launcher.isAlive(pid);
    return alive === true ? 'ALIVE' as const : alive === false ? 'DEAD' as const : 'UNKNOWN' as const;
  }
  async cancel(attemptId: string) {
    const dk = this.byAttempt.get(attemptId);
    if (dk === undefined) return 'UNKNOWN' as const;
    const pid = this.launcher.pidOf(dk);
    if (pid === undefined) return 'UNKNOWN' as const;
    if (this.cancelMode === 'UNKNOWN') return 'UNKNOWN' as const; // teyitsiz dal provasi
    await this.launcher.kill(pid);
    return (await untilDead(this.launcher, pid)) ? 'CONFIRMED_DEAD' as const : 'UNKNOWN' as const;
  }
}

function waitExit(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve();
    child.once('exit', () => resolve());
  });
}

async function untilDead(launcher: RealNodeLauncher, pid: number, ms = 5000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if ((await launcher.isAlive(pid)) === false) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// dispatcher rig'i (live-gates-v3 deseni): PENDING outbox satiri olan RUNNING attempt.
// path verilirse DISK-tabanli gercek store (kapi 6), yoksa bellek. dk: dispatchKey
// (ayni launcher'i paylasan bloklar icin tekil).
function dispatchRig(path?: string, dk = 'dk-1') {
  const db = openStore(path);
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'h', 'r', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)')
    .run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), '{}');
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-1','plan-1',1,'READY','ph',0,2,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1','n-1','coder','[]','READY')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`).run();
  setGlobalStop(db, false, 'test', 'kurulum');
  const cmd = recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-1', idempotencyKey: 'k-1', payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: 'k-1' } });
  reserveDispatch(db, { attemptId: 'att-1', tokens: 50, commandId: cmd.commandId, dispatchKey: dk });
  return db;
}

// ================= bol.22 kosul (2): IPTAL TEYIDI CANLI =================

test('S22-K2 CANLI: gercek child kosarken iptal -> CONFIRMED_DEAD (pid olumu) -> CANCELLED + RELEASED; UNSUPPORTED ve BUG-C2 dallari', async (t) => {
  const launcher = new RealNodeLauncher();
  t.after(async () => { await launcher.cleanup(); });

  // --- UNSUPPORTED dali: cancel'i olmayan adapter durust 'UNSUPPORTED' doner, slot TUTULUR
  {
    const db0 = dispatchRig();
    const noCancel: WorkerAdapter = {
      spawn: async () => ({ outcome: 'OK', externalSessionId: 's0' }),
      lookup: async () => 'ALIVE',
    };
    const r0 = await requestCancel(db0, noCancel, 'att-1', 'destek-yok');
    assert.equal(r0.status, 'CANCEL_UNCONFIRMED');
    assert.equal((r0 as any).adapterResponse, 'UNSUPPORTED');
    assert.equal(col(db0, "SELECT state FROM reservations WHERE attempt_id='att-1'"), 'ACTIVE', 'teyitsiz iptalde slot birakilmis - ihlal!');
    assert.equal(evCount(db0, 'CANCEL_CONFIRMED'), 0);
    console.log('KANIT K2-UNSUPPORTED: cancel yok -> CANCEL_UNCONFIRMED/UNSUPPORTED, rezervasyon ACTIVE (slot tutuldu)');
    db0.close();
  }

  // --- canli spawn: gercek child process dogar
  const db = dispatchRig();
  const bridge = new LiveBridgeAdapter(launcher);
  const r1 = await processOutbox(db, bridge);
  assert.equal(r1.result, 'bound');
  const pid = launcher.pidOf('dk-1')!;
  assert.ok(pid > 0);
  assert.equal(await launcher.isAlive(pid), true, 'gercek child kosmali');
  assert.match(String(col(db, "SELECT external_session_id FROM attempts WHERE id='att-1'")), /^local:/);

  // --- BUG-C2 REGRESYON (TUR A src duzeltmesi): LocalRuntimeAdapter.cancel artik kanonik
  // sözleşmede — attemptId alir, spawn bagindan dispatchKey'e köprüler, durable registry'den
  // pid alir, gercek kill + OS olum teyidi ile CONFIRMED_DEAD doner. Ayri rig (dk-c2);
  // bridge akisi (dk-1) etkilenmez.
  {
    const dbC2 = dispatchRig(undefined, 'dk-c2');
    const directAdapter = new LocalRuntimeAdapter(probeAllLocal(), launcher, { ORDU_RUNTIME: 'local' });
    const rC2s = await processOutbox(dbC2, directAdapter);
    assert.equal(rC2s.result, 'bound');
    const pidC2 = launcher.pidOf('dk-c2')!;
    assert.equal(await launcher.isAlive(pidC2), true, 'regresyon child kosmali');
    const rC2 = await requestCancel(dbC2, directAdapter, 'att-1', 'bug-c2-regresyon');
    assert.equal(rC2.status, 'CANCELLED', 'duzeltilmis adapter canli iptali TEYITLEMELI (BUG-C2 kapandi)');
    assert.equal(await untilDead(launcher, pidC2), true, 'kill gercek surece ulasmali');
    await waitExit(launcher.children.get('dk-c2')!);
    assert.equal(col(dbC2, "SELECT state FROM attempts WHERE id='att-1'"), 'CANCELLED');
    assert.equal(col(dbC2, "SELECT state FROM reservations WHERE attempt_id='att-1'"), 'RELEASED');
    assert.equal(evCount(dbC2, 'CANCEL_CONFIRMED'), 1);
    console.log('KANIT BUG-C2-KAPALI: LocalRuntimeAdapter.cancel(att-1) -> pid=' + pidC2 + ' gercek kill + OS olum teyidi -> CONFIRMED_DEAD -> CANCELLED + RELEASED (sozlesme-disi dispatchKey/boolean imzasi giderildi)');
    dbC2.close();
  }

  // --- sozlesme-uyumlu kopru ile gercek iptal: pid olumu OS'ta dogrulanir
  const t0 = performance.now();
  const r2 = await requestCancel(db, bridge, 'att-1', 'canli-iptal');
  const cancelMs = Math.round(performance.now() - t0);
  assert.equal(r2.status, 'CANCELLED', 'CONFIRMED_DEAD sonrasi CANCELLED bekleniyor');
  assert.equal(await untilDead(launcher, pid), true, 'pid olumu OS uzerinde dogrulanamadi');
  await waitExit(launcher.children.get('dk-1')!);
  assert.equal(col(db, "SELECT state FROM attempts WHERE id='att-1'"), 'CANCELLED');
  assert.equal(col(db, "SELECT state FROM reservations WHERE attempt_id='att-1'"), 'RELEASED');
  assert.equal(col(db, "SELECT state FROM runs WHERE id='run-1'"), 'CANCELLED');
  assert.equal(evCount(db, 'CANCEL_CONFIRMED'), 1);
  const cc = db.prepare("SELECT payload_json FROM events WHERE type='CANCEL_CONFIRMED'").get() as any;
  assert.ok(cc.payload_json.includes('CONFIRMED_DEAD'));
  console.log('KANIT K2: pid=' + pid + ' gercek kill + olum teyidi -> CONFIRMED_DEAD -> attempt=CANCELLED reservation=RELEASED run=CANCELLED; iptal->teyit ' + cancelMs + 'ms; CANCEL_CONFIRMED x1');
  db.close();
});

// ================= bol.22 kosul (5): GRANT REVOKE IN-FLIGHT CANLI =================

test('S22-K5 CANLI: vekil grant\'li attempt gercek child ile kosarken revoke -> yeni vekil islemi RED; kor kill YOK (pid canli); teyitli iptal -> CANCELLED + RELEASED', async (t) => {
  const launcher = new RealNodeLauncher();
  t.after(async () => { await launcher.cleanup(); });

  const db = openStore();
  setGlobalStop(db, false, 'op', 'kurulum');
  const planHash = createRunPlan(db, {
    capsuleId: 'cap-1', goal: 'r3-canli', repoId: 'repo', sourceCommit: H64('c'),
    runId: 'run-1', planId: 'plan-1', profileHash: H64('p'),
    nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 5,
  }).planHash;
  approvePlan(db, 'run-1', planHash, 'human');
  const grant: GrantInput = {
    runId: 'run-1', actions: ['EXTRA_RETRY'], extraRetryBudget: 3, tokenBudget: 1000, expiresAt: FUTURE,
  };
  const { grantId } = createGrant(db, grant, 'insan:test');
  const startCmd = ensureStartCommand(db, 'run-1', planHash, 'operator');
  const d = dispatchNode(db, 'run-1', 'n1', { tokens: 100, startCommandId: startCmd, dispatchKey: 'dk-1', handoff: sampleHandoff('n1'), grantId });
  if (d.status !== 'DISPATCHED') throw new Error('dispatch bekleniyordu');
  assert.equal(col(db, 'SELECT grant_id FROM attempts WHERE id=\'' + d.attemptId + '\''), grantId);

  // canli spawn: gercek child process (LocalRuntime launcher'i uzerinden kopru)
  const bridge = new LiveBridgeAdapter(launcher);
  const r1 = await processOutbox(db, bridge);
  assert.equal(r1.result, 'bound');
  const pid = launcher.pidOf('dk-1')!;
  assert.equal(await launcher.isAlive(pid), true, 'in-flight gercek child kosmali');

  // revoke: in-flight cancel patikasina duser - KOR KILL YOK (pid canli kalmali, canli kanit)
  const rv = revokeGrant(db, grantId, 'insan:admin');
  assert.equal(rv.inFlightCancelRequested, 1);
  assert.equal(col(db, 'SELECT state FROM attempts WHERE id=\'' + d.attemptId + '\''), 'CANCEL_REQUESTED');
  assert.equal(col(db, 'SELECT fencing_token FROM attempts WHERE id=\'' + d.attemptId + '\''), 2, 'fencing bump');
  assert.equal(col(db, 'SELECT state FROM reservations WHERE attempt_id=\'' + d.attemptId + '\''), 'ACTIVE', 'teyitsiz iptalde slot tutulmali');
  assert.equal(await launcher.isAlive(pid), true, 'revoke KOR KILL yapmamali - gercek child hala canli (ADR-R3 k13-01/5b)');
  const ev = db.prepare("SELECT payload_json FROM events WHERE type='CANCEL_REQUESTED' AND attempt_id=?").get(d.attemptId) as any;
  assert.ok(ev.payload_json.includes('grant-revoke'));

  // revoke sonrasi YENI vekil islemi RED (karar + istek + dispatch kapisi)
  assert.throws(() => decideWithGrant(db, { runId: 'run-1', grantId, action: 'EXTRA_RETRY' }), GateError);
  assert.throws(() => requestGrantApproval(db, { runId: 'run-1', grantId, action: 'EXTRA_RETRY' }), GateError);
  assert.throws(() => assertGrantDispatchable(db, grantId, 'run-1'), GateError);
  console.log('KANIT K5-REVOKE: grant=' + grantId + ' REVOKED; in-flight att CANCEL_REQUESTED fence=2 slot=ACTIVE; gercek pid=' + pid + ' HALA CANLI (kor kill yok); yeni vekil islemi x3 RED');

  // UNKNOWN dali: iptal teyitlenemezse slot TUTULUR, surec oldurulmez
  bridge.cancelMode = 'UNKNOWN';
  const rU = await requestCancel(db, bridge, d.attemptId, 'revoke-takip-unknown');
  assert.equal(rU.status, 'CANCEL_UNCONFIRMED');
  assert.equal((rU as any).adapterResponse, 'UNKNOWN');
  assert.equal(col(db, 'SELECT state FROM reservations WHERE attempt_id=\'' + d.attemptId + '\''), 'ACTIVE');
  assert.equal(await launcher.isAlive(pid), true, 'UNKNOWN dalda child oldurulmemeli');

  // teyitli iptal: gercek kill + pid olumu -> CANCELLED + RELEASED
  bridge.cancelMode = 'KILL';
  const t0 = performance.now();
  const r2 = await requestCancel(db, bridge, d.attemptId, 'revoke-takip-teyit');
  const cancelMs = Math.round(performance.now() - t0);
  assert.equal(r2.status, 'CANCELLED');
  assert.equal(await untilDead(launcher, pid), true);
  await waitExit(launcher.children.get('dk-1')!);
  assert.equal(col(db, 'SELECT state FROM attempts WHERE id=\'' + d.attemptId + '\''), 'CANCELLED');
  assert.equal(col(db, 'SELECT state FROM reservations WHERE attempt_id=\'' + d.attemptId + '\''), 'RELEASED');
  assert.equal(evCount(db, 'CANCEL_CONFIRMED'), 1);
  console.log('KANIT K5-INFLIGHT: UNKNOWN dalda slot TUTULDU + pid canli; teyitli iptalde pid=' + pid + ' OLDU -> CANCELLED + RELEASED (' + cancelMs + 'ms)');
  db.close();
});

// ================= bol.22 kosul (6): HANDOFF SONRASI ESKI SAHIP YAZAMIYOR CANLI =================

test('S22-K6 CANLI: disk-tabanli gercek store\'da devir sonrasi eski fence ile yazma RED; yeni sahip yazar; BUG-C6 KAPALI: devir aninda eski sahip sureci oldurulur, dosya buyumez', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-s22k6-'));
  const dbPath = join(dir, 'ordu.sqlite'); // GERCEK disk store
  const proofFile = join(dir, 'eski-sahip-yazi.txt');
  const launcher = new RealNodeLauncher();
  // eski sahibin gercek worker'i: 100ms'de bir diske yazar (OS-seviye yazma gozlemi)
  launcher.writerScript =
    'const fs=require("fs");setInterval(function(){fs.appendFileSync(' + JSON.stringify(proofFile) + ',"x")},100);';
  t.after(async () => { await launcher.cleanup(); });

  const db = dispatchRig(dbPath);
  assert.ok(existsSync(dbPath), 'store gercekten diskte');
  const bridge = new LiveBridgeAdapter(launcher);
  const r1 = await processOutbox(db, bridge);
  assert.equal(r1.result, 'bound');
  const pid = launcher.pidOf('dk-1')!;
  assert.equal(await launcher.isAlive(pid), true);
  assert.equal(col(db, "SELECT fencing_token FROM attempts WHERE id='att-1'"), 1);

  // devir oncesi: eski sahip gercekten yaziyor (OS gozlemi baseline).
  // Sınırılı yoklama: tam süitin paralel yükünde child'in ilk yazması 450ms'yi aşabilir
  // (gerçek flake: statSync ENOENT) — dosya doğana dek bekle, yazmıyorsa dürüst patla.
  const tFile = Date.now() + 5000;
  while (!existsSync(proofFile) && Date.now() < tFile) await sleep(50);
  await sleep(450);
  const size0 = statSync(proofFile).size;
  assert.ok(size0 > 0, 'yazar child baseline yazmali');

  // DEVIR (A36/takeLease): fence 1->2, yeni sahip
  const newFence = takeLease(db, 'att-1', 'worker-yeni', FUTURE);
  assert.equal(newFence, 2);
  assert.equal(col(db, "SELECT lease_owner FROM attempts WHERE id='att-1'"), 'worker-yeni');

  // BUG-C6 duzeltmesi (TUR A): devir aninda eski sahibin SURECI iptal edilir -
  // cancelStaleOwner attempt durumunu BOZMAZ (yeni sahip ayni attempte devam eder);
  // niyet CANCEL_REQUESTED daliyla, teyit RUNTIME_OBSERVED ile deftere duser (yeni olay tipi ACILMAZ - baseline senkron 31 tip).
  const rStale = await cancelStaleOwner(db, bridge, 'att-1', 'devir-eski-sahip');
  assert.equal(rStale.status, 'KILLED');
  assert.equal(rStale.adapterResponse, 'CONFIRMED_DEAD');
  assert.equal(await untilDead(launcher, pid), true, 'eski sahip sureci devir aninda olmeli');
  await waitExit(launcher.children.get('dk-1')!);
  assert.equal(col(db, "SELECT state FROM attempts WHERE id='att-1'"), 'RUNNING', 'eski sahip iptali attempt durumunu bozmamali');
  assert.equal(evCount(db, 'CANCEL_REQUESTED'), 1);
  const ro = db.prepare("SELECT payload_json FROM events WHERE type='RUNTIME_OBSERVED'").get() as any;
  assert.ok(ro.payload_json.includes('STALE_OWNER_CONFIRMED_DEAD'), 'olum teyidi RUNTIME_OBSERVED dalinda kayitli');

  // eski sahibin STORE yazmalari RED (receipt reddi degil - sonuc ve kanit yazma kapilari)
  const e1 = (() => { try { commitCandidate(db, 'att-1', 1, H64('d'), 'worker-eski'); return null; } catch (e) { return e; } })();
  assert.ok(e1 instanceof FenceError, 'eski fence commit RED olmali');
  const e2 = (() => {
    try {
      recordEvidence(db, { attemptId: 'att-1', presentedFence: 1, artifactHash: H64('e'), storageRef: 'mem://x', bytes: 1, environmentHash: H64('f'), evaluatorHash: H64('g'), exitCode: 0, verdict: 'PASS', testCount: 4, actorId: 'worker-eski' });
      return null;
    } catch (e) { return e; }
  })();
  assert.ok(e2 instanceof FenceError, 'eski fence kanit RED olmali');
  assert.equal(col(db, "SELECT COUNT(*) FROM evidence WHERE attempt_id='att-1'"), 0, 'eski sahip kanit yazdi - ihlal!');

  // yeni sahip YAZAR: fence 2 ile sonuc + kanit deftere duser
  commitCandidate(db, 'att-1', 2, H64('d'), 'worker-yeni');
  const evOk = recordEvidence(db, { attemptId: 'att-1', presentedFence: 2, artifactHash: H64('e'), storageRef: 'mem://y', bytes: 8, environmentHash: H64('f'), evaluatorHash: H64('g'), exitCode: 0, verdict: 'PASS', testCount: 4, actorId: 'worker-yeni' });
  assert.ok(evOk.evidenceId);
  assert.equal(col(db, "SELECT verdict FROM evidence WHERE id='" + evOk.evidenceId + "'"), 'PASS');

  // BUG-C6 KAPALDI (TUR A): eski sahibin sureci devir aninda olduruldu -
  // dosya devirden SONRA buyumuyor (eski bomba: yazma devam ederdi).
  await sleep(450);
  const size1 = statSync(proofFile).size;
  assert.equal(size1, size0, 'KANIT BUG-C6-KAPALI: devir sonrasi eski sahip yazamiyor (surec devir aninda olduruldu)');
  console.log('KANIT BUG-C6-KAPALI: devir (fence 1->2) + cancelStaleOwner -> eski sahip pid=' + pid + ' devir ANINDA oldu (CANCEL_REQUESTED + RUNTIME_OBSERVED/STALE_OWNER_CONFIRMED_DEAD); dosya ' + size0 + 'B -> ' + size1 + 'B sabit (yazma durdu); attempt RUNNING kaldi (yeni sahip devam ediyor)');

  // devir sonrasi normal iptal patikasi (yedek kanit): attempt kapaninca rezervasyon RELEASED
  const r2 = await requestCancel(db, bridge, 'att-1', 'devir-iptal');
  assert.equal(r2.status, 'CANCELLED');
  assert.equal(await untilDead(launcher, pid), true);
  await waitExit(launcher.children.get('dk-1')!);
  assert.equal(col(db, "SELECT state FROM reservations WHERE attempt_id='att-1'"), 'RELEASED');
  const size2 = statSync(proofFile).size;
  await sleep(350);
  assert.equal(statSync(proofFile).size, size2, 'olu surec yazamaz - yazma durdu');
  console.log('KANIT K6: devir fence 1->2; eski fence commit+kanit FenceError; yeni sahip yazdi (evidence=' + evOk.evidenceId.slice(0, 8) + '); eski sahip pid=' + pid + ' devir aninda oldu (BUG-C6 kapali); attempt kapanisiyla rezervasyon RELEASED');
  db.close();
});
