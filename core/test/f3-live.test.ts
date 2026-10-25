// F3-A/F3-B — CANLI fault kabul kapıları: worker GERÇEK OS süreci (node child_process).
// f1-fault.test.ts aynı akışları FakeAdapter ile hermetik prova eder; buradaki fark:
// launcher child_process.spawn ile gerçek node süreci doğurur (uzun uyuyan -e script'i),
// pid dosya-tabanlı registry'de durur, kill GERÇEK terminate (process.kill SIGKILL;
// Windows'ta TerminateProcess olarak çalışır — yeterli). Yalnız kendi spawn ettiğimiz
// child'lar öldürülür; sistemin başka sürecine DOKUNULMAZ.
// Tekrar EDİLMEYEN hermetik kanıtlar: SENDING→UNKNOWN yükseltme, latch restart
// davranışı (fake adapter), reconcile idempotentlik (fake) — f1-fault.test.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { openStore, recordCommand, setGlobalStop, reserveDispatch } from '../src/store.ts';
import { processOutbox, reconcileUnknown } from '../src/dispatcher.ts';
import { LocalRuntimeAdapter, LOCAL_REQUIRED_CAPS, type LocalLauncher } from '../src/local-runtime.ts';
import type { ProbeReceipt } from '../src/capabilities.ts';
import { cliMain } from '../src/cli.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

// ProbeReceipt doğrulama yükü (hash/tazelik/blocked tutarlılığı) hermetik olarak
// local-runtime.test.ts + capabilities kapılarında kanıtlı; adapter yalnız capabilities okur.
function probeAllLocal(): ProbeReceipt {
  const caps: Record<string, boolean> = {};
  for (const c of LOCAL_REQUIRED_CAPS) caps[c] = true;
  return {
    probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: new Date().toISOString(),
    node: process.version, capabilities: caps, blocked: [], probeReceiptHash: '0'.repeat(64),
  };
}

// Gerçek süreç launcher: her launch bir node child doğurur, pid'i dosya-tabanlı
// registry'ye yazar (LocalLauncher sözleşmesi: durable registry). "Restart" provasında
// registry dosyasından dirilen ikinci nesne handle'sız pid okur.
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
  pidOf(dispatchKey: string) {
    return this.pids.get(dispatchKey);
  }
  async isAlive(pid: number) {
    try {
      process.kill(pid, 0);
      return true;
    } catch (e: any) {
      if (e.code === 'ESRCH') return false;
      if (e.code === 'EPERM') return true;
      return null; // belirsiz → fail-closed UNKNOWN
    }
  }
  async kill(pid: number) {
    try { process.kill(pid, 'SIGKILL'); } catch { /* zaten ölü */ }
  }
  async cleanup() {
    for (const child of this.children.values()) {
      try { child.kill('SIGKILL'); } catch { /* zaten ölü */ }
    }
  }
}

// A08 belirsizliğinin canlı hâli: süreç GERÇEKTEN doğdu ama launch yanıtı kayboldu.
class AmbiguousRealLauncher extends RealNodeLauncher {
  failAfterSpawn = false;
  async launch(o: { dispatchKey: string }) {
    const r = await super.launch(o);
    if (this.failAfterSpawn) throw new Error('yanit kaybi: process dogdu mu bilinmiyor');
    return r;
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

// f1-fault.test.ts rigged() ile aynı tohum; workers listesi kadar node/attempt/outbox açar,
// path DOSYA defteridir (restart provası). run max_workers=2: iki ACTIVE rezervasyon sığar.
function rig(dbPath: string, workers: { attempt: string; node: string; dk: string }[]) {
  const db = openStore(dbPath);
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'h', 'r', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)')
    .run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), '{}');
  db.prepare("INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at) VALUES('run-1','plan-1',1,'READY','ph',0,2,3,100,0,0,'2026-12-31T00:00:00Z')").run();
  setGlobalStop(db, false, 'test', 'kurulum');
  let n = 0;
  for (const w of workers) {
    n += 1;
    db.prepare("INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1',?,'coder','[]','READY')").run(w.node);
    db.prepare("INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES(?,'run-1',?,?,'RUNNING','ih',1)").run(w.attempt, w.node, n);
    const cmd = recordCommand(db, {
      kind: 'START_RUN', actorId: 'op', runId: 'run-1', idempotencyKey: 'k-' + w.dk,
      payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: 'k-' + w.dk },
    });
    reserveDispatch(db, { attemptId: w.attempt, tokens: 50, commandId: cmd.commandId, dispatchKey: w.dk });
  }
  return db;
}

const col = (db: any, sql: string) => {
  const row = db.prepare(sql).get() as any;
  return row[Object.keys(row)[0]];
};
const evCount = (db: any, type: string) =>
  (db.prepare('SELECT COUNT(*) AS c FROM events WHERE type=?').get(type) as any).c as number;
const outboxStatus = (db: any, dk: string) => col(db, "SELECT status FROM outbox WHERE dispatch_key='" + dk + "'");
const reservationState = (db: any, att: string) => col(db, "SELECT state FROM reservations WHERE attempt_id='" + att + "'");

// ---- F3-A: canlı kill ----

test('F3-A canlı kill: gerçek child SIGKILL ile ölünce reconcile UNKNOWN→DEAD_CONFIRMED; kör re-spawn YOK, çift etki YOK', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-f3a-'));
  const launcher = new AmbiguousRealLauncher(join(dir, 'registry.json'));
  t.after(async () => { await launcher.cleanup(); });
  const db = rig(join(dir, 'ordu.sqlite'), [{ attempt: 'att-1', node: 'n-1', dk: 'dk-1' }]);
  const adapter = new LocalRuntimeAdapter(probeAllLocal(), launcher, { ORDU_RUNTIME: 'local' });

  // süreç doğdu ama yanıt kayboldu (A08): dispatcher kör re-spawn YAPMAZ, UNKNOWN'a çeker
  launcher.failAfterSpawn = true;
  const r = await processOutbox(db, adapter);
  assert.equal(r.result, 'unknown');
  assert.equal(outboxStatus(db, 'dk-1'), 'UNKNOWN');
  assert.equal(reservationState(db, 'att-1'), 'UNKNOWN');
  assert.equal(col(db, "SELECT state FROM attempts WHERE id='att-1'"), 'RUNNING', 'belirsizlikte attempt peşinen gömülmez');
  const pid = launcher.pidOf('dk-1');
  assert.ok(pid !== undefined && pid > 0, 'gerçek pid registryde');
  assert.equal(await launcher.isAlive(pid), true, 'belirsiz spawn: süreç GERÇEKTEN yaşıyor');

  // canlı kill — yalnız kendi child'ımız (pid: kanıt özetinde raporlanır)
  await launcher.kill(pid);
  await waitExit(launcher.children.get('dk-1')!);
  assert.equal(await untilDead(launcher, pid), true, 'OS ölümü teyitli (pid=' + pid + ')');
  console.log('KANIT F3-A: pid=' + pid + ' spawn→UNKNOWN, SIGKILL→ölü, reconcile→DEAD_CONFIRMED');

  const rec = await reconcileUnknown(db, adapter);
  assert.deepEqual(rec.outcomes, ['dead-released']);
  assert.equal(outboxStatus(db, 'dk-1'), 'DEAD_CONFIRMED');
  assert.equal(col(db, "SELECT state FROM attempts WHERE id='att-1'"), 'FAILED');
  assert.equal(col(db, "SELECT state FROM nodes WHERE run_id='run-1' AND id='n-1'"), 'READY', 'node yeniden sıralanabilir');
  assert.equal(reservationState(db, 'att-1'), 'RELEASED', 'ölü worker slot tutmaz');
  assert.equal(evCount(db, 'CANCEL_CONFIRMED'), 1);

  // çift etki YOK: ikinci reconcile no-op, teyit olayı çoğalmaz
  const rec2 = await reconcileUnknown(db, adapter);
  assert.deepEqual(rec2.outcomes, []);
  assert.equal(evCount(db, 'CANCEL_CONFIRMED'), 1, 'teyit olayı çoğaldı — çift etki!');

  // kör re-spawn YOK: spawn yolunda satır kalmadı, launcher'a yeni launch gitmedi
  const r2 = await processOutbox(db, adapter);
  assert.ok(r2.idle);
  assert.equal(launcher.launches.length, 1, 'ölü worker körü körüne yeniden doğuruldu — A08 ihlali!');
  db.close();
});

// ---- F3-B: STOP → restart → reconcile gerçek worker ile ----

test('F3-B STOP→restart→reconcile: latch kalıcı, resume onay metni kapısı, gerçek worker restart boyunca yaşar ve recovered olur', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-f3b-'));
  const dbPath = join(dir, 'ordu.sqlite');
  const registryPath = join(dir, 'registry.json');
  const launcher1 = new AmbiguousRealLauncher(registryPath);
  t.after(async () => { await launcher1.cleanup(); });

  const db = rig(dbPath, [
    { attempt: 'att-1', node: 'n-1', dk: 'dk-1' },
    { attempt: 'att-2', node: 'n-2', dk: 'dk-2' },
  ]);
  const adapter1 = new LocalRuntimeAdapter(probeAllLocal(), launcher1, { ORDU_RUNTIME: 'local' });
  // dk-1: süreç doğdu, yanıt kayboldu → UNKNOWN; dk-2 PENDING olarak bekliyor
  launcher1.failAfterSpawn = true;
  const r1 = await processOutbox(db, adapter1);
  assert.equal(r1.result, 'unknown');
  const pid1 = launcher1.pidOf('dk-1')!;
  assert.equal(await launcher1.isAlive(pid1), true);
  db.close();

  // STOP — gerçek CLI yüzeyi
  const stop = await cliMain(['stop', '--actor', 'op', '--reason', 'f3b'], { dbPath, env: {}, probePath: 'yok' });
  assert.equal(stop.code, 0);

  // restart: defter yeniden açılır; launcher2 registry dosyasından dirilir (yeni nesne, handle'sız)
  const db2 = openStore(dbPath);
  const launcher2 = new RealNodeLauncher(registryPath);
  t.after(async () => { await launcher2.cleanup(); });
  const adapter2 = new LocalRuntimeAdapter(probeAllLocal(), launcher2, { ORDU_RUNTIME: 'local' });
  assert.equal(launcher2.pidOf('dk-1'), pid1, 'durable registry restart sonrası pid taşır');

  const blocked = await processOutbox(db2, adapter2);
  assert.deepEqual(blocked, { blocked: 'global_stop', processed: 0 });
  assert.equal(launcher2.launches.length, 0, 'STOP restartta unutulduysa dk-2 GERÇEKTEN spawn olurdu — A16 ihlali!');

  // resume kapısı: onay metni olmadan RED; latch yerinde kalır
  const denied = await cliMain(['resume', '--actor', 'op'], { dbPath, env: {}, probePath: 'yok' });
  assert.equal(denied.code, 1);
  assert.match(String(denied.out), /confirm/);
  const still = await processOutbox(db2, adapter2);
  assert.deepEqual(still, { blocked: 'global_stop', processed: 0 });
  assert.equal(launcher2.launches.length, 0);

  const ok = await cliMain(['resume', '--actor', 'op', '--confirm', 'I understand the risk'], { dbPath, env: {}, probePath: 'yok' });
  assert.equal(ok.code, 0);
  assert.equal(evCount(db2, 'STOP_LATCH_SET'), 1);
  assert.equal(evCount(db2, 'STOP_LATCH_CLEARED'), 2); // kurulum + onaylı kaldırış

  // latch açık: dk-2 GERÇEK spawn olur; dk-1'in gerçek worker'ı restart boyunca yaşadı
  const r2 = await processOutbox(db2, adapter2);
  assert.equal(r2.result, 'bound');
  assert.equal(launcher2.launches.length, 1);
  const pid2 = launcher2.pidOf('dk-2')!;
  assert.equal(await launcher2.isAlive(pid2), true);
  assert.equal(await launcher2.isAlive(pid1), true, 'gerçek worker restart boyunca hayatta');

  // reconcile gerçek worker ile: pid1 yaşıyor → ALIVE → recovered (kör re-spawn değil, BAĞLANMA)
  const rec = await reconcileUnknown(db2, adapter2);
  assert.deepEqual(rec.outcomes, ['recovered']);
  assert.equal(outboxStatus(db2, 'dk-1'), 'SENT');
  assert.equal(col(db2, "SELECT external_session_id FROM attempts WHERE id='att-1'"), 'recovered:dk-1');
  assert.equal(evCount(db2, 'SESSION_BOUND'), 2, 'dk-2 bound + dk-1 recovered');
  assert.equal(launcher2.launches.length + launcher1.launches.length, 2, 'recovered için yeni süreç doğmadı');

  // temizlik: yalnız kendi pid'lerimiz
  await launcher2.kill(pid2);
  await waitExit(launcher2.children.get('dk-2')!);
  await launcher1.kill(pid1);
  await waitExit(launcher1.children.get('dk-1')!);
  assert.equal(await untilDead(launcher2, pid1), true);
  assert.equal(await untilDead(launcher2, pid2), true);
  console.log('KANIT F3-B: pid1=' + pid1 + ' (dk-1, restart boyunca yaşadı→recovered), pid2=' + pid2 + ' (dk-2, resume sonrası gerçek spawn)');
  db2.close();
});
