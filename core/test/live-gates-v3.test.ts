// V3-S1.5 / V3-S1.6 / M26-M31 — CANLI guvenlik dalgasi kabul kapilari.
// Hermetik karsiliklari: adapter-evaluator.test (A13), dispatcher/store/f3-live (A16),
// f1-gates F1-G (M26/M31). Buradaki fark: hepsi GERCEK child-process kosulariyla
// uctan uca kanitlanir (evaluator execSync runner + LocalRuntimeAdapter + gercek node
// alt-surecleri). LLM cagrisi YOK, dis API YOK, maliyet YOK.
// NOT: Bu testler REDDEDILMEYI kanitlar — yasak islem gerceklesirse BUG'dir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, execSync, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  openStore, recordCommand, setGlobalStop, reserveDispatch,
  commitCandidate, recordEvidence, GateError,
} from '../src/store.ts';
import { processOutbox } from '../src/dispatcher.ts';
import { LocalRuntimeAdapter, LOCAL_REQUIRED_CAPS, type LocalLauncher } from '../src/local-runtime.ts';
import { evaluateAttempt, type CommandRunner } from '../src/evaluator.ts';
import { settleNodeOutcome, requestAcceptance, decideApproval } from '../src/supervisor.ts';
import { loadVerifiedProbe, type ProbeReceipt } from '../src/capabilities.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

// gercek evaluator runner'i: komutu isletim sisteminde KOSAR (e2e-s11 deseni)
const realRunner: CommandRunner = async (cmd) => {
  try {
    const stdout = execSync(cmd, { encoding: 'utf8', shell: process.env.ComSpec ?? '/bin/sh' });
    return { exitCode: 0, stdout };
  } catch (e: any) {
    return { exitCode: e.status ?? 1, stdout: String(e.stdout ?? '') };
  }
};

// evaluator rig'i (adapter-evaluator deseni): plan payload'inda DONMUS allowedCommands
function evalRig(allowed: string[]) {
  const db = openStore();
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'h', 'r', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)')
    .run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), JSON.stringify({ allowedCommands: allowed }));
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-1','plan-1',1,'READY','ph',0,1,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1','n-1','tester','[]','READY')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`).run();
  setGlobalStop(db, false, 'test', 'kurulum');
  const cmd = recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-1', idempotencyKey: 'k-ev', payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: 'k-ev' } });
  reserveDispatch(db, { attemptId: 'att-1', tokens: 50, commandId: cmd.commandId, dispatchKey: 'dk-ev' });
  commitCandidate(db, 'att-1', 1, H64('c'), 'core');
  return db;
}

// dispatcher rig'i (f3-live deseni): pending outbox satiri olan RUNNING attempt
function dispatchRig() {
  const db = openStore();
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'h', 'r', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)')
    .run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), '{}');
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-1','plan-1',1,'READY','ph',0,2,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1','n-1','coder','[]','READY')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`).run();
  setGlobalStop(db, false, 'test', 'kurulum');
  const cmd = recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-1', idempotencyKey: 'k-1', payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: 'k-1' } });
  reserveDispatch(db, { attemptId: 'att-1', tokens: 50, commandId: cmd.commandId, dispatchKey: 'dk-1' });
  return db;
}

// local probe: tum LOCAL_REQUIRED_CAPS true (f3-live probeAllLocal deseni)
function probeAllLocal(): ProbeReceipt {
  const caps: Record<string, boolean> = {};
  for (const c of LOCAL_REQUIRED_CAPS) caps[c] = true;
  return {
    probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: new Date().toISOString(),
    node: process.version, capabilities: caps, blocked: [], probeReceiptHash: '0'.repeat(64),
  } as ProbeReceipt;
}

// gercek surec launcher (f3-live RealNodeLauncher deseni): her launch GERCEK node
// child'i dogurur; kapi acik olsaydi surec gercekten dogardi — spawn=0 iddiasi bu
// yuzden anlamli. Yalniz kendi child'larimiz oldurulur.
class RealNodeLauncher implements LocalLauncher {
  launches: string[] = [];
  children = new Map<string, ChildProcess>();
  pids = new Map<string, number>();
  async launch(o: { dispatchKey: string }) {
    const child = spawn(process.execPath, ['-e', 'setInterval(function(){},1000)'], { stdio: 'ignore' });
    if (child.pid === undefined) throw new Error('pid alinamadi');
    this.children.set(o.dispatchKey, child);
    this.pids.set(o.dispatchKey, child.pid);
    this.launches.push(o.dispatchKey);
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
  async kill(pid: number) { try { process.kill(pid, 'SIGKILL'); } catch { /* zaten olu */ } }
  async cleanup() {
    for (const child of this.children.values()) {
      try { child.kill('SIGKILL'); } catch { /* zaten olu */ }
    }
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

const col = (db: any, sql: string) => {
  const row = db.prepare(sql).get() as any;
  return row[Object.keys(row)[0]];
};

// ================= V3-S1.5: sifir-test kirmizi gate (CANLI) =================

test('V3-S1.5 CANLI: gercek runner exit-0 + 0 test -> FAIL; sahte PASS store RED; kabul RED', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-s15-'));
  // gercek fixture: exit 0 ama SIFIR test raporlar (protokole uyar, yine de yetmez)
  const zeroFixture = join(dir, 'zero-test.js');
  writeFileSync(zeroFixture, 'console.log(JSON.stringify({tests:0,failed:0}));\n');
  const zeroCmd = `"${process.execPath}" "${zeroFixture}"`;
  const db = evalRig([zeroCmd]);

  // gercek child-process: komut execSync ile OS'te kosar, exit code gercekten 0
  const probe = await realRunner(zeroCmd, dir);
  assert.equal(probe.exitCode, 0, 'fixture gercekten exit-0 donmeli (gate seciciligi icin onkosul)');

  const ev = await evaluateAttempt(db, {
    attemptId: 'att-1', presentedFence: 1, candidateHash: H64('c'), testCmd: zeroCmd,
    repoDir: dir, runner: realRunner, evidenceDir: join(dir, 'evidence'), actorId: 'evaluator',
  });
  assert.equal(ev.verdict, 'FAIL', 'exit-0 + 0 test CANLI kosuda FAIL olmali (A13)');
  assert.equal(ev.tests, 0);
  assert.equal(ev.protocolParsed, true);
  assert.equal(col(db, "SELECT verdict FROM evidence WHERE id='" + ev.evidenceId + "'"), 'FAIL');

  // store A13 kapisi: sahte PASS satiri (exit-0, 0 test) deftere DUSMEZ
  assert.throws(
    () => recordEvidence(db, {
      attemptId: 'att-1', presentedFence: 1, artifactHash: H64('x'), storageRef: 'mem://sahte', bytes: 1,
      environmentHash: H64('y'), evaluatorHash: H64('z'),
      exitCode: 0, verdict: 'PASS', testCount: 0, actorId: 'worker-yalanci',
    }),
    GateError,
  );

  // kabul ucu: worker PASS iddia etse bile bagimsiz kanit FAIL oldugundan ACCEPTED OLMAZ
  assert.equal(settleNodeOutcome(db, 'att-1', 'PASS').status, 'NODE_DONE');
  const req = requestAcceptance(db, 'run-1', 'human');
  assert.throws(
    () => decideApproval(db, req.approvalId, 'APPROVED', 'human', 1),
    /PASS kan/,
  );
  assert.notEqual(col(db, "SELECT state FROM runs WHERE id='run-1'"), 'ACCEPTED');

  // secicilik kontrolu: gercek test raporlayan fixture PASS alir (gate fail-always degil)
  const passFixture = join(dir, 'pass-test.js');
  writeFileSync(passFixture, 'console.log(JSON.stringify({tests:4,failed:0}));\n');
  // ayri rig: plan allowlist'i bu komutu dondurur
  const db2 = openStore();
  db2.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-2', 'h', 'r', H64('a'));
  db2.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)')
    .run('plan-2', 'cap-2', 1, H64('b'), H64('e'), H64('p'), JSON.stringify({ allowedCommands: [`"${process.execPath}" "${passFixture}"`] }));
  db2.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-2','plan-2',1,'READY','ph',0,1,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  db2.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-2','n-2','tester','[]','READY')`).run();
  db2.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-2','run-2','n-2',1,'RUNNING','ih',1)`).run();
  commitCandidate(db2, 'att-2', 1, H64('c'), 'core');
  const ok = await evaluateAttempt(db2, {
    attemptId: 'att-2', presentedFence: 1, candidateHash: H64('c'),
    testCmd: `"${process.execPath}" "${passFixture}"`,
    repoDir: dir, runner: realRunner, evidenceDir: join(dir, 'evidence2'), actorId: 'evaluator',
  });
  assert.equal(ok.verdict, 'PASS');
  assert.equal(ok.tests, 4);

  console.log('KANIT S1.5: canli runner exit=0 tests=0 -> verdict=FAIL evidence=' + ev.evidenceId
    + '; sahte PASS store GateError; kabul RED (onay ' + req.approvalId + '); pozitif kontrol PASS tests=' + ok.tests);
  db.close();
  db2.close();
});

// ================= V3-S1.6: STOP SLO <=5sn (CANLI olcum) =================

test('V3-S1.6 CANLI: STOP latch acikken gercek spawn KESIK; latch->dispatch-red gecikmesi <=5sn', async (t) => {
  const launcher = new RealNodeLauncher();
  t.after(async () => { await launcher.cleanup(); });
  const db = dispatchRig();
  const adapter = new LocalRuntimeAdapter(probeAllLocal(), launcher, { ORDU_RUNTIME: 'local' });

  // SLO olcumu: latch set -> dispatch RED, performance.now ile
  const t0 = performance.now();
  setGlobalStop(db, true, 'op', 's1.6 slo olcum');
  const t1 = performance.now();
  const blocked = await processOutbox(db, adapter);
  const t2 = performance.now();

  assert.deepEqual(blocked, { blocked: 'global_stop', processed: 0 });
  assert.equal(launcher.launches.length, 0, 'STOP acikken GERCEK child dogdu — A16 ihlali!');
  const latchMs = t1 - t0;
  const redMs = t2 - t1;
  const totalMs = t2 - t0;
  assert.ok(totalMs <= 5000, 'SLO ihlali: latch->dispatch-red ' + totalMs.toFixed(2) + 'ms > 5000ms');

  // latch kalici: ikinci dispatch denemesi de kesik, hala spawn yok
  const again = await processOutbox(db, adapter);
  assert.deepEqual(again, { blocked: 'global_stop', processed: 0 });
  assert.equal(launcher.launches.length, 0);
  assert.equal(col(db, "SELECT status FROM outbox WHERE dispatch_key='dk-1'"), 'PENDING', 'kesilen satir PENDING kalmali (sonra dispatch edilebilir)');

  // secicilik kontrolu: latch kaldirilinca ayni adapter GERCEK child dogurur (gate stuck-closed degil)
  setGlobalStop(db, false, 'op', 's1.6 devam');
  const r = await processOutbox(db, adapter);
  assert.equal(r.result, 'bound');
  assert.equal(launcher.launches.length, 1);
  const pid = launcher.pidOf('dk-1')!;
  assert.equal(await launcher.isAlive(pid), true, 'resume sonrasi gercek child yasamali');
  await launcher.kill(pid);
  await waitExit(launcher.children.get('dk-1')!);
  assert.equal(await untilDead(launcher, pid), true);

  console.log('KANIT S1.6: latch_set=' + latchMs.toFixed(2) + 'ms dispatch_red=' + redMs.toFixed(2)
    + 'ms toplam=' + totalMs.toFixed(2) + 'ms (SLO<=5000ms); latch acikken spawn=0, resume sonrasi gercek pid=' + pid + ' dogdu+olduruldu');
  db.close();
});

// ================= M26/M31: canli negatif izin =================

test('M31 CANLI: capability eksik LocalRuntime — gercek launcher\'a HIC gidilmez, defter FAILED yazar', async () => {
  const launcher = new RealNodeLauncher();
  const db = dispatchRig();
  const caps: Record<string, boolean> = {};
  for (const c of LOCAL_REQUIRED_CAPS) caps[c] = true;
  caps.cancelConfirmLocal = false; // kanitsiz tek yetenek
  const receipt = {
    probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: new Date().toISOString(),
    node: process.version, capabilities: caps, blocked: ['cancelConfirmLocal'], probeReceiptHash: '0'.repeat(64),
  } as unknown as ProbeReceipt;
  const adapter = new LocalRuntimeAdapter(receipt, launcher, { ORDU_RUNTIME: 'local' });

  const r = await processOutbox(db, adapter);
  assert.equal(r.result, 'fatal');
  assert.equal(launcher.launches.length, 0, 'capability eksikken GERCEK child dogdu — M31 ihlali, BUG!');
  assert.equal(launcher.pids.size, 0, 'registry\'ye pid yazildi — M31 ihlali, BUG!');
  // kalici audit kaydi: attempt/outbox/rezervasyon terminal durumda
  assert.equal(col(db, "SELECT state FROM attempts WHERE id='att-1'"), 'FAILED');
  assert.equal(col(db, "SELECT status FROM outbox WHERE dispatch_key='dk-1'"), 'FAILED');
  assert.equal(col(db, "SELECT state FROM reservations WHERE attempt_id='att-1'"), 'RELEASED');
  assert.equal(col(db, "SELECT external_session_id FROM attempts WHERE id='att-1'"), null);
  console.log('KANIT M31: spawn FATAL (local-capability-blocked), gercek launch=0, audit: attempt=FAILED outbox=FAILED reservation=RELEASED');
  db.close();
});

test('M19 CANLI: allowlist disi komut gercek runner\'a ULASMAZ — hedef dosya yok, kanit yok, GateError audit', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-m19-'));
  const hedef = join(dir, 'forbidden', 'pwn.txt'); // izin verilmemis dizine yazma girisimi
  const pwn = join(dir, 'pwn.js');
  writeFileSync(pwn, 'require("fs").mkdirSync(require("path").dirname(process.argv[2]),{recursive:true});\nrequire("fs").writeFileSync(process.argv[2],"pwned");\nconsole.log(JSON.stringify({tests:9,failed:0}));\n');
  const yasakCmd = `"${process.execPath}" "${pwn}" "${hedef}"`;
  const db = evalRig(['npm test']); // allowlist'te yalniz 'npm test' donmus

  let runnerTouched = false;
  const spyReal: CommandRunner = async (cmd, cwd) => { runnerTouched = true; return realRunner(cmd, cwd); };
  const err = await evaluateAttempt(db, {
    attemptId: 'att-1', presentedFence: 1, candidateHash: H64('c'), testCmd: yasakCmd,
    repoDir: dir, runner: spyReal, evidenceDir: join(dir, 'evidence'), actorId: 'evaluator',
  }).then(() => null).catch((e) => e);

  assert.ok(err instanceof GateError, 'GateError bekleniyordu');
  assert.match(String(err.message), /allowlist/);
  assert.equal(runnerTouched, false, 'allowlist disi komut runner\'a ulasti — M19 ihlali, BUG!');
  assert.equal(existsSync(hedef), false, 'yasak dosya GERCEKTEN yazildi — M19 ihlali, BUG!');
  assert.equal((db.prepare('SELECT COUNT(*) c FROM evidence').get() as any).c, 0, 'kanit defteri kirlendi');
  console.log('KANIT M19: GateError="' + String(err.message) + '"; runner_touched=false; hedef dosya YOK; evidence=0');
  db.close();
});

test('M26 CANLI: probe receipt junction/symlink kacak yolu RED — gercek yol kabul', () => {
  const canonical = (v: unknown): string =>
    v === null || typeof v !== 'object' ? JSON.stringify(v)
      : Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']'
        : '{' + Object.keys(v as object).sort().map((k) => JSON.stringify(k) + ':' + canonical((v as any)[k])).join(',') + '}';
  const caps: Record<string, boolean> = {
    nodePinned24: true, gitPresent: true, paseoCliPresent: true, paseoDaemonReachable: true,
    worktreeIsolationProven: true, sandboxEstablished: true, structuredOutput: true, usageReporting: true, cancelConfirm: true,
  };
  for (const c of LOCAL_REQUIRED_CAPS) caps[c] = true;
  const r: any = {
    probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: '2026-10-13T18:00:00.000Z',
    node: 'v24.18.0', capabilities: caps, blocked: [],
  };
  r.probeReceiptHash = createHash('sha256').update(canonical(r)).digest('hex');
  const now = () => new Date(Date.parse('2026-10-13T19:00:00Z'));

  const rootDir = mkdtempSync(join(tmpdir(), 'ordu-m26-'));
  const realDir = join(rootDir, 'real');
  mkdirSync(realDir);
  const receiptPath = join(realDir, 'probe.json');
  writeFileSync(receiptPath, JSON.stringify(r, null, 2));
  const linkDir = join(rootDir, 'link');
  symlinkSync(realDir, linkDir, 'junction'); // Windows junction: admin GEREKTIRMEZ
  const viaLink = join(linkDir, 'probe.json');

  assert.doesNotThrow(() => loadVerifiedProbe(receiptPath, { now }), 'gercek yol kabul edilmeli');
  const err = (() => { try { loadVerifiedProbe(viaLink, { now }); return null; } catch (e) { return e; } })();
  assert.ok(err !== null, 'junction uzerinden receipt yuklendi — M26 ihlali, BUG!');
  assert.match(String((err as Error).message), /symlink|junction|kacak/i);
  console.log('KANIT M26: junction yolu RED ("' + String((err as Error).message).slice(0, 80) + '"), gercek yol OK');
});