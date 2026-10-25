// F5 — CANLI paralellik provasi: IKI kapsul AYNI dosya-tabanli defterde, gercek node
// child worker'larla (f3-live deseni) ayni anda kosar. Kanitlar:
// (a) iki run ayni anda RUNNING — event'ler dogru run'a bagli, attempt kimlik hash'i
//     (planHash|node|no zinciri, A04) run'lar arasi karismaz;
// (b) maxWorkers=1 iken ikinci node slot BEKLER ve reserve YAKMAZ (A24 canli hali);
// (c) run-bazli STOP (runs.dispatch_paused kolonu + reservation_admit 'run_paused'
//     kapisi) oteki run'i etkilemez; GLOBAL STOP ikisini de durdurur ama canli
//     worker'i OLDURMEZ (latch yalniz dispatch kapisidir, A16);
// (d) paralel processOutbox / paralel reconcile CIFT SPAWN uretmez (U1 atomik
//     PENDING->SENDING mark + A08 kor re-spawn yasagi canli dedupe).
// Yalniz kendi spawn ettigimiz child'lar oldurulur; sistemin baska surecine DOKUNULMAZ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, setGlobalStop, commitCandidate } from '../src/store.ts';
import {
  createRunPlan, approvePlan, readyNodes, dispatchNode, ensureStartCommand, settleNodeOutcome,
} from '../src/supervisor.ts';
import { processOutbox, reconcileUnknown } from '../src/dispatcher.ts';
import { LocalRuntimeAdapter, LOCAL_REQUIRED_CAPS, type LocalLauncher } from '../src/local-runtime.ts';
import { sampleHandoff } from '../src/handoff.ts';
import type { ProbeReceipt } from '../src/capabilities.ts';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

// local runtime probe: yalniz LOCAL_REQUIRED_CAPS kanitli (f3-live deseni)
function probeAllLocal(): ProbeReceipt {
  const caps: Record<string, boolean> = {};
  for (const c of LOCAL_REQUIRED_CAPS) caps[c] = true;
  return {
    probe: 'ordu-v3/F5', schemaVersion: 1, generatedAt: new Date().toISOString(),
    node: process.version, capabilities: caps, blocked: [], probeReceiptHash: '0'.repeat(64),
  };
}

// gercek surec launcher (f3-live deseni): her launch bir node child dogurur (uzun
// uyuyan -e script'i), pid dispatchKey ile registry'de durur. failAfterSpawn=true iken
// surec DOGAR ama yanit kaybolur (A08 belirsizligi). kill = SIGKILL (Windows'ta
// TerminateProcess olarak calisir — yeterli).
class RealNodeLauncher implements LocalLauncher {
  launches: string[] = [];
  children = new Map<string, ChildProcess>();
  pids = new Map<string, number>();
  failAfterSpawn = false;
  async launch(o: { dispatchKey: string }) {
    const child = spawn(process.execPath, ['-e', 'setInterval(function(){},1000)'], { stdio: 'ignore' });
    if (child.pid === undefined) throw new Error('pid alinamadi');
    this.children.set(o.dispatchKey, child);
    this.pids.set(o.dispatchKey, child.pid);
    this.launches.push(o.dispatchKey);
    if (this.failAfterSpawn) throw new Error('yanit kaybi: process dogdu mu bilinmiyor');
    return { pid: child.pid };
  }
  pidOf(dispatchKey: string) { return this.pids.get(dispatchKey); }
  async isAlive(pid: number) {
    try { process.kill(pid, 0); return true; } catch (e: any) {
      if (e.code === 'ESRCH') return false;
      if (e.code === 'EPERM') return true;
      return null; // belirsiz — fail-closed UNKNOWN
    }
  }
  async kill(pid: number) { try { process.kill(pid, 'SIGKILL'); } catch { /* zaten olu */ } }
  async cleanup() {
    for (const child of this.children.values()) {
      try { child.kill('SIGKILL'); } catch { /* zaten olu */ }
    }
  }
}

const col = (db: any, sql: string) => {
  const row = db.prepare(sql).get() as any;
  return row[Object.keys(row)[0]];
};
const runState = (db: any, runId: string) => col(db, "SELECT state FROM runs WHERE id='" + runId + "'");
const nodeStateOf = (db: any, runId: string, nodeId: string) =>
  col(db, "SELECT state FROM nodes WHERE run_id='" + runId + "' AND id='" + nodeId + "'");
const outboxStatus = (db: any, dk: string) => col(db, "SELECT status FROM outbox WHERE dispatch_key='" + dk + "'");
const evCount = (db: any, type: string) =>
  (db.prepare('SELECT COUNT(*) AS c FROM events WHERE type=?').get(type) as any).c as number;
const countOf = (db: any, sql: string) => (db.prepare(sql).get() as any).c as number;

// run iskeleti: kapsul + DONMUS plan + insan onayi (A03) — dispatch'e hazir run
function makeRun(db: any, runId: string, nodes: { id: string; deps?: string[] }[], maxWorkers: number) {
  const { planHash } = createRunPlan(db, {
    capsuleId: 'cap-' + runId, goal: 'F5 paralellik provasi', repoId: 'repo-local',
    sourceCommit: sha('commit-' + runId), runId, planId: 'plan-' + runId,
    profileHash: sha('profile-' + runId),
    nodes: nodes.map((n) => ({ id: n.id, role: 'coder', deps: n.deps ?? [] })),
    maxWorkers,
  });
  const startCommandId = ensureStartCommand(db, runId, planHash, 'operator');
  approvePlan(db, runId, planHash, 'human');
  return { planHash, startCommandId };
}

function dispatch(db: any, runId: string, nodeId: string, startCommandId: string) {
  return dispatchNode(db, runId, nodeId, {
    tokens: 100, startCommandId, dispatchKey: 'dk-' + nodeId, handoff: sampleHandoff(nodeId),
  });
}

// ---- (a) iki run AYNI anda RUNNING — izolasyon + hash zinciri ----

test('F5-a: iki run AYNI dosya defterinde ayni anda RUNNING; event/attempt/oturum izolasyonu ve run-bazli kimlik hash zinciri bozulmaz', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-f5a-'));
  const launcher = new RealNodeLauncher();
  t.after(async () => { await launcher.cleanup(); });
  const db = openStore(join(dir, 'ordu.sqlite'));
  setGlobalStop(db, false, 'test', 'f5a kurulum');

  const A = makeRun(db, 'run-A', [{ id: 'a1' }], 1);
  const B = makeRun(db, 'run-B', [{ id: 'b1' }], 1);
  assert.deepEqual(readyNodes(db, 'run-A'), ['a1']);
  assert.deepEqual(readyNodes(db, 'run-B'), ['b1']);
  assert.notEqual(A.planHash, B.planHash, 'plan hashleri run bazli farkli');

  const dA = dispatch(db, 'run-A', 'a1', A.startCommandId);
  const dB = dispatch(db, 'run-B', 'b1', B.startCommandId);
  assert.equal(dA.status, 'DISPATCHED');
  assert.equal(dB.status, 'DISPATCHED');
  // AYNI ANDA: iki run da RUNNING (biri digerini beklemedi/dusurmedi)
  assert.equal(runState(db, 'run-A'), 'RUNNING');
  assert.equal(runState(db, 'run-B'), 'RUNNING');
  assert.equal(nodeStateOf(db, 'run-A', 'a1'), 'RUNNING');
  assert.equal(nodeStateOf(db, 'run-B', 'b1'), 'RUNNING');

  // iki spawn GEREKTEN paralel: iki processOutbox ayni anda, iki ayri PENDING satir
  const adapter = new LocalRuntimeAdapter(probeAllLocal(), launcher, { ORDU_RUNTIME: 'local' });
  const [rA, rB] = await Promise.all([processOutbox(db, adapter), processOutbox(db, adapter)]);
  assert.equal(rA.result, 'bound');
  assert.equal(rB.result, 'bound');
  assert.equal(launcher.launches.length, 2);
  const pidA = launcher.pidOf('dk-a1')!;
  const pidB = launcher.pidOf('dk-b1')!;
  assert.notEqual(pidA, pidB);
  assert.equal(await launcher.isAlive(pidA), true);
  assert.equal(await launcher.isAlive(pidB), true, 'iki gercek worker AYNI ANDA canli');

  // izolasyon 1: her run'in SESSION_BOUND event'i KENDI attempt'ine bagli
  const attA = (dA as any).attemptId as string;
  const attB = (dB as any).attemptId as string;
  const evA = db.prepare("SELECT attempt_id FROM events WHERE run_id='run-A' AND type='SESSION_BOUND'").all() as any[];
  const evB = db.prepare("SELECT attempt_id FROM events WHERE run_id='run-B' AND type='SESSION_BOUND'").all() as any[];
  assert.deepEqual(evA.map((e) => e.attempt_id), [attA]);
  assert.deepEqual(evB.map((e) => e.attempt_id), [attB]);
  assert.equal(countOf(db, "SELECT COUNT(*) AS c FROM events WHERE run_id='run-A' AND attempt_id='" + attB + "'"), 0, 'run-A eventi run-B attemptine sizmadi');
  assert.equal(countOf(db, "SELECT COUNT(*) AS c FROM events WHERE run_id='run-B' AND attempt_id='" + attA + "'"), 0, 'run-B eventi run-A attemptine sizmadi');

  // izolasyon 2: attempt kimlik zinciri (A04): input_hash = sha(planHash|node|no)
  assert.equal(col(db, "SELECT input_hash FROM attempts WHERE id='" + attA + "'"), sha(A.planHash + '|a1|1'));
  assert.equal(col(db, "SELECT input_hash FROM attempts WHERE id='" + attB + "'"), sha(B.planHash + '|b1|1'));

  // izolasyon 3: dis oturum dogru run'in dogru pid'ine bagli
  assert.equal(col(db, "SELECT external_session_id FROM attempts WHERE id='" + attA + "'"), 'local:' + pidA);
  assert.equal(col(db, "SELECT external_session_id FROM attempts WHERE id='" + attB + "'"), 'local:' + pidB);

  // event zinciri saglam: sequence 1..N araliksiz, tek artan
  const seqs = (db.prepare('SELECT sequence FROM events ORDER BY sequence').all() as any[]).map((r) => r.sequence as number);
  assert.deepEqual(seqs, seqs.map((_, i) => i + 1), 'event zinciri aralikli/bozuk');

  console.log('KANIT F5-a: run-A(pid=' + pidA + ') + run-B(pid=' + pidB + ') ayni anda RUNNING; '
    + 'SESSION_BOUND izolasyonu OK; A04 input_hash zinciri run basina dogru; events 1..' + seqs.length + ' araliksiz');
  db.close();
});

// ---- (b) maxWorkers=1 — A24 yakmasiz bekleme (canli) ----

test('F5-b: maxWorkers=1 iken ikinci node slot BEKLER ve reserve YAKMAZ; slot bosalinca dispatch olur', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-f5b-'));
  const launcher = new RealNodeLauncher();
  t.after(async () => { await launcher.cleanup(); });
  const db = openStore(join(dir, 'ordu.sqlite'));
  setGlobalStop(db, false, 'test', 'f5b kurulum');

  const C = makeRun(db, 'run-C', [{ id: 'c1' }, { id: 'c2' }], 1);
  assert.deepEqual(readyNodes(db, 'run-C').sort(), ['c1', 'c2']);

  const d1 = dispatch(db, 'run-C', 'c1', C.startCommandId);
  assert.equal(d1.status, 'DISPATCHED');
  // gercek worker canli — slot GEREKTEN dolu
  const adapter = new LocalRuntimeAdapter(probeAllLocal(), launcher, { ORDU_RUNTIME: 'local' });
  const s1 = await processOutbox(db, adapter);
  assert.equal(s1.result, 'bound');
  assert.equal(await launcher.isAlive(launcher.pidOf('dk-c1')!), true);

  // A24 canli: worker hala calisirken ikinci node kapasite BEKLER — reserve YAKMAZ
  const d2 = dispatch(db, 'run-C', 'c2', C.startCommandId);
  assert.equal(d2.status, 'WAIT_CAPACITY');
  assert.equal(nodeStateOf(db, 'run-C', 'c2'), 'PENDING', 'bekleyen node RUNNING kalmaz');
  assert.equal(countOf(db, "SELECT COUNT(*) AS c FROM attempts WHERE run_id='run-C'"), 1, 'hayalet attempt YOK');
  assert.equal(countOf(db, "SELECT COUNT(*) AS c FROM reservations WHERE state='ACTIVE'"), 1, 'reserve yakilmadi');
  assert.equal(countOf(db, "SELECT COUNT(*) AS c FROM outbox WHERE dispatch_key='dk-c2'"), 0, 'outbox satiri dogmadi');
  const cw = db.prepare("SELECT payload_json FROM events WHERE type='CAPACITY_WAIT'").get() as any;
  assert.ok(cw && String(cw.payload_json).includes('c2'), 'CAPACITY_WAIT kaniti c2yi isaret eder');
  assert.equal(runState(db, 'run-C'), 'RUNNING', 'bekleme runi dusurmez');

  // slot bosalinca (c1 PASS -> rezervasyon SETTLED) c2 dispatch olur: ertelemeci, yakici degil
  commitCandidate(db, (d1 as any).attemptId, 1, sha('cand-c1'), 'worker-c1');
  assert.equal(settleNodeOutcome(db, (d1 as any).attemptId, 'PASS').status, 'NODE_DONE');
  const d3 = dispatch(db, 'run-C', 'c2', C.startCommandId);
  assert.equal(d3.status, 'DISPATCHED');
  const s2 = await processOutbox(db, adapter);
  assert.equal(s2.result, 'bound');
  assert.equal(launcher.launches.length, 2);
  assert.equal(await launcher.isAlive(launcher.pidOf('dk-c2')!), true);

  console.log('KANIT F5-b: c1 canli iken c2 WAIT_CAPACITY (reserve YAKILMADI, hayalet attempt/outbox YOK); '
    + 'c1 SETTLED sonrasi c2 DISPATCHED+bound (pid=' + launcher.pidOf('dk-c2') + ')');
  db.close();
});

// ---- (c) run-bazli STOP izolasyonu + global STOP her ikisini durdurur ----

test('F5-c: run-bazli STOP oteki runi etkilemez; GLOBAL STOP iki runi da durdurur ama canli workerlari OLDURMEZ', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-f5c-'));
  const launcher = new RealNodeLauncher();
  t.after(async () => { await launcher.cleanup(); });
  const db = openStore(join(dir, 'ordu.sqlite'));
  setGlobalStop(db, false, 'test', 'f5c kurulum');
  db.exec('UPDATE settings SET max_workers=8'); // global kapasite bu provada kisit degil

  const D = makeRun(db, 'run-D', [{ id: 'd1' }, { id: 'd2' }, { id: 'd3' }], 3);
  const E = makeRun(db, 'run-E', [{ id: 'e1' }, { id: 'e2' }], 2);
  const adapter = new LocalRuntimeAdapter(probeAllLocal(), launcher, { ORDU_RUNTIME: 'local' });

  // iki run da canli worker'a sahip
  assert.equal(dispatch(db, 'run-D', 'd1', D.startCommandId).status, 'DISPATCHED');
  assert.equal(dispatch(db, 'run-E', 'e1', E.startCommandId).status, 'DISPATCHED');
  assert.equal((await processOutbox(db, adapter)).result, 'bound');
  assert.equal((await processOutbox(db, adapter)).result, 'bound');
  assert.equal(runState(db, 'run-D'), 'RUNNING');
  assert.equal(runState(db, 'run-E'), 'RUNNING');

  // RUN-BAZLI STOP: runs.dispatch_paused=1 — reservation_admit kapisi 'run_paused' ile RED
  // (run-bazli latch'in tek yazma yolu defter kolonu; trigger bu kolonu okur)
  db.exec("UPDATE runs SET dispatch_paused=1 WHERE id='run-E'");

  // oteki run ETKILENMEZ: run-D d2 dispatch + gercek spawn surer
  assert.equal(dispatch(db, 'run-D', 'd2', D.startCommandId).status, 'DISPATCHED');
  assert.equal((await processOutbox(db, adapter)).result, 'bound');
  assert.equal(launcher.launches.length, 3);

  // duran run'da reserve YAKMAZ: GateError(run_paused), defterde iz YOK
  assert.throws(() => dispatch(db, 'run-E', 'e2', E.startCommandId), /run_paused/);
  assert.equal(nodeStateOf(db, 'run-E', 'e2'), 'PENDING');
  assert.equal(countOf(db, "SELECT COUNT(*) AS c FROM attempts WHERE run_id='run-E'"), 1, 'duran runda hayalet attempt YOK');
  assert.equal(countOf(db, "SELECT COUNT(*) AS c FROM outbox WHERE dispatch_key='dk-e2'"), 0);

  // GLOBAL STOP: IKI run da durur — run-D'nin yeni dispatch'i de RED (global_stop)
  setGlobalStop(db, true, 'operator', 'f5c global stop');
  assert.throws(() => dispatch(db, 'run-D', 'd3', D.startCommandId), /global_stop/);
  assert.throws(() => dispatch(db, 'run-E', 'e2', E.startCommandId), /global_stop/);
  const blocked = await processOutbox(db, adapter);
  assert.deepEqual(blocked, { blocked: 'global_stop', processed: 0 });
  assert.equal(launcher.launches.length, 3, 'STOP altinda spawn YOK');

  // latch dispatch'i keser; CANLI worker'lari OLDURMEZ (A16 semantigi)
  const pidD1 = launcher.pidOf('dk-d1')!;
  const pidD2 = launcher.pidOf('dk-d2')!;
  const pidE1 = launcher.pidOf('dk-e1')!;
  assert.equal(await launcher.isAlive(pidD1), true);
  assert.equal(await launcher.isAlive(pidD2), true);
  assert.equal(await launcher.isAlive(pidE1), true);

  // resume: global latch acilir ama run-E'nin run-bazli stop'u HALA durur (kapsam kaniti)
  setGlobalStop(db, false, 'operator', 'f5c resume');
  assert.equal(dispatch(db, 'run-D', 'd3', D.startCommandId).status, 'DISPATCHED');
  assert.throws(() => dispatch(db, 'run-E', 'e2', E.startCommandId), /run_paused/, 'global resume run-bazli stopu kaldirmaz');
  // run-E stop'u kaldirilinca e2 de yoluna devam eder
  db.exec("UPDATE runs SET dispatch_paused=0 WHERE id='run-E'");
  assert.equal(dispatch(db, 'run-E', 'e2', E.startCommandId).status, 'DISPATCHED');

  console.log('KANIT F5-c: run-E stop altinda run-D dispatch+bound surdu (pid=' + pidD2 + '); '
    + 'global STOP iki runi da kesti, 3 worker canli kaldi; resume sonrasi run-E hala run_paused, kaldirilinca DISPATCHED');
  db.close();
});

// ---- (d) paralel tuketim/reconcile cift spawn URETMEZ (dedupe canli) ----

test('F5-d: tek PENDING satir + paralel processOutbox = 1 spawn; UNKNOWN + paralel reconcile = baglanma, yeni surec YOK', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-f5d-'));
  const launcher = new RealNodeLauncher();
  t.after(async () => { await launcher.cleanup(); });
  const db = openStore(join(dir, 'ordu.sqlite'));
  setGlobalStop(db, false, 'test', 'f5d kurulum');
  const adapter = new LocalRuntimeAdapter(probeAllLocal(), launcher, { ORDU_RUNTIME: 'local' });

  // 1) TEK PENDING satir, IKI paralel tuketici: atomik PENDING->SENDING mark tek gecer (U1)
  const F = makeRun(db, 'run-F', [{ id: 'f1' }], 1);
  dispatch(db, 'run-F', 'f1', F.startCommandId);
  const [p1, p2] = await Promise.all([processOutbox(db, adapter), processOutbox(db, adapter)]);
  assert.equal([p1, p2].filter((r) => r.result === 'bound').length, 1, 'iki paralel tuketiciden TAM BIRI spawn eder');
  assert.equal(launcher.launches.length, 1, 'cift spawn YOK');
  assert.equal(outboxStatus(db, 'dk-f1'), 'SENT');
  assert.equal(evCount(db, 'SESSION_BOUND'), 1);

  // 2) A08 canli dedupe: spawn cevabi kayip (UNKNOWN) ama surec canli;
  //    IKI PARALEL reconcile yeni surec DOGURMAZ — var olana BAGLANIR
  const G = makeRun(db, 'run-G', [{ id: 'g1' }], 1);
  dispatch(db, 'run-G', 'g1', G.startCommandId);
  launcher.failAfterSpawn = true;
  const u = await processOutbox(db, adapter);
  assert.equal(u.result, 'unknown');
  assert.equal(outboxStatus(db, 'dk-g1'), 'UNKNOWN');
  const pidG = launcher.pidOf('dk-g1')!;
  assert.equal(await launcher.isAlive(pidG), true, 'belirsiz spawn gercekten canli');
  const launchCountBefore = launcher.launches.length;

  const [rec1, rec2] = await Promise.all([reconcileUnknown(db, adapter), reconcileUnknown(db, adapter)]);
  assert.ok([...rec1.outcomes, ...rec2.outcomes].includes('recovered'), 'canli oturum recovered');
  assert.equal(launcher.launches.length, launchCountBefore, 'paralel reconcile CIFT SPAWN uretmedi');
  assert.equal(outboxStatus(db, 'dk-g1'), 'SENT');
  assert.equal(
    col(db, "SELECT external_session_id FROM attempts a JOIN outbox o ON o.attempt_id=a.id WHERE o.dispatch_key='dk-g1'"),
    'recovered:dk-g1',
  );

  // reconcile sonrasi spawn yolunda satir yok: kor re-spawn YOK
  const idle = await processOutbox(db, adapter);
  assert.ok(idle.idle);
  assert.equal(launcher.launches.length, launchCountBefore);

  console.log('KANIT F5-d: tek PENDING + 2 paralel tuketici = 1 spawn (pid=' + launcher.pidOf('dk-f1') + '); '
    + 'UNKNOWN(pid=' + pidG + ') + 2 paralel reconcile = recovered, launch sayisi sabit ' + launchCountBefore);
  db.close();
});