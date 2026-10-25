// V3-S1.2 / V3-S1.4 — CANLI crash-noktası kapıları (FAZ-3 K2; triyaj raporlar/faz3-triyaj-2026-10-25.md).
// f3-live.test.ts F3-A/B worker'ı öldürür; buradaki fark: ÖLEN SÜREÇ MANAGER'dır
// (dispatch'i yürüten node süreci), gerçek SIGKILL ile, tam crash-noktasında:
//   V3-S1.2: spawn ÖNCESİ (SENDING işaretlendikten sonra, süreç doğmadan) — satır
//            SENDING kalır; kör re-spawn YOK; reconcile UNKNOWN'a yükseltir (U1'in canlı hâli).
//   V3-S1.4: spawn ANINDA (gerçek worker doğdu, SENT commit edilmeden) + STOP latch —
//            kill -9 restart'ında latch korunur, dk-2 spawn edilmez, dk-1 recover EDİLİR
//            (yeni süreç doğmaz), resume sonrası dk-2 tek spawn.
// Manager ayrı süreçtir (temp .mjs): test sürecindeki adapter sahteliği crash semantiği
// üretmez — çökme gerçek process ölümü olmalı. Yalnız kendi spawn ettiğimiz child'lar
// öldürülür; sistemin başka sürecine DOKUNULMAZ.
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
const SRC_URL = new URL('../src/', import.meta.url).href;

function probeAllLocal(): ProbeReceipt {
  const caps: Record<string, boolean> = {};
  for (const c of LOCAL_REQUIRED_CAPS) caps[c] = true;
  return {
    probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: new Date().toISOString(),
    node: process.version, capabilities: caps, blocked: [], probeReceiptHash: '0'.repeat(64),
  };
}

// f1-fault/f3-live tohumunun aynısı (dosya defteri — restart provası); workers listesi
// kadar node/attempt/outbox açar. run max_workers=2: iki ACTIVE rezervasyon sığar.
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
  db.close();
}

// Manager süreci (ayrı node): kendi defterini açar, processOutbox'u gerçek launcher ile
// yürütür. launcher CRASH NOKTASINA GÖRE asılır: 'pre' = doğurmadan önce sonsuz bekleme;
// 'mid' = gerçek worker'ı doğurup pid'i DURABLE registry'ye yazdıktan sonra sonsuz bekleme
// (yanıt asla dönmez → SENT commit edilmez). Test, işaret/registry görünce manager'ı
// SIGKILL ile öldürür — çökme gerçek process ölümüdür.
const MANAGER_KAYNAGI = `
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawn as cpSpawn } from 'node:child_process';

const [mode, dbPath, registryPath, srcUrl] = process.argv.slice(2);
const { openStore } = await import(srcUrl + 'store.ts');
const { processOutbox } = await import(srcUrl + 'dispatcher.ts');
const { LocalRuntimeAdapter, LOCAL_REQUIRED_CAPS } = await import(srcUrl + 'local-runtime.ts');

const pids = existsSync(registryPath) ? JSON.parse(readFileSync(registryPath, 'utf8')) : {};

class CrashLauncher {
  async launch(o) {
    if (mode === 'pre') await new Promise(() => {}); // spawn-oncesi: hicbir sey dogurmaz
    // detached: TORUN worker manager'in Windows job-object'ine bagli kalmasin —
    // manager SIGKILL edilince libuv job'u torunu da oldurur; gercek dayaniklilik
    // senaryosu (manager olur, worker yasar) icin surecin bagimsiz dogmasi gerekir.
    const child = cpSpawn(process.execPath, ['-e', 'setInterval(function(){},1000)'], { stdio: 'ignore', detached: true });
    child.unref();
    pids[o.dispatchKey] = child.pid;
    writeFileSync(registryPath, JSON.stringify(pids)); // durable registry: yazilmadan return YOK
    await new Promise(() => {}); // spawn-anki: surec dogdu, yanit donmez
  }
  pidOf(dk) { return pids[dk]; }
  async isAlive(pid) {
    try { process.kill(pid, 0); return true; } catch (e) {
      if (e.code === 'ESRCH') return false; if (e.code === 'EPERM') return true; return null;
    }
  }
  async kill(pid) { try { process.kill(pid, 'SIGKILL'); } catch {} }
}

const db = openStore(dbPath);
const caps = {};
for (const c of LOCAL_REQUIRED_CAPS) caps[c] = true;
const probe = { probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: new Date().toISOString(),
  node: process.version, capabilities: caps, blocked: [], probeReceiptHash: '0'.repeat(64) };
const adapter = new LocalRuntimeAdapter(probe, new CrashLauncher(), { ORDU_RUNTIME: 'local' });
// keepalive: asili bekleyiste event-loop BOS kalirsa node unsettled-TLA exit-13 ile
// kendiliginden olur (crash DEGIL). Gercek crash semantigi icin manager kill -9'dan
// baska bir olum gormemeli — timer loop'u dolu tutar, uyaruyi da bastirir.
setInterval(function(){}, 1 << 30);
const r = await processOutbox(db, adapter); // 'pre'/'mid' modda asila buraya ulasmaz
console.log('MANAGER-SONUC ' + JSON.stringify(r));
`;

function managerDogur(dir: string, mode: string, dbPath: string, registryPath: string): ChildProcess {
  const script = join(dir, 'manager-' + mode + '.mjs');
  writeFileSync(script, MANAGER_KAYNAGI, 'utf8');
  return spawn(process.execPath, [script, mode, dbPath, registryPath, SRC_URL], { stdio: ['ignore', 'pipe', 'inherit'] });
}

// Manager'ın ölümsüz kalması (asılı await + keepalive) ve koşulun görünmesi beklenir;
// manager erken ölürse (import hatası vb.) düzgün hata ver.
async function managerBekle(m: ChildProcess, kosul: () => boolean | Promise<boolean>, ms = 15000): Promise<void> {
  const start = Date.now();
  let exited: number | null = null;
  m.once('exit', (c) => { exited = c; });
  while (Date.now() - start < ms) {
    if (exited !== null) throw new Error('manager erken oldu (exit=' + exited + ') — import/kurulum hatasi');
    // SQLITE_BUSY (manager aninda yazma lock'u tutuyor) gecici: 50ms sonra tekrar denenir
    let ok = false;
    try { ok = await kosul(); } catch { ok = false; }
    if (ok) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('manager kosulu ' + ms + 'ms icinde gorunmedi');
}

const col = (db: any, sql: string) => {
  const row = db.prepare(sql).get() as any;
  return row[Object.keys(row)[0]];
};
const outboxStatus = (db: any, dk: string) => col(db, "SELECT status FROM outbox WHERE dispatch_key='" + dk + "'");
const reservationState = (db: any, att: string) => col(db, "SELECT state FROM reservations WHERE attempt_id='" + att + "'");

// Kurtarma tarafı: registry'den dirilen gerçek launcher (f3-live RealNodeLauncher deseni).
class RegistryLauncher implements LocalLauncher {
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
  pidOf(dk: string) { return this.pids.get(dk); }
  async isAlive(pid: number) {
    try { process.kill(pid, 0); return true; } catch (e: any) {
      if (e.code === 'ESRCH') return false;
      if (e.code === 'EPERM') return true;
      return null;
    }
  }
  async kill(pid: number) { try { process.kill(pid, 'SIGKILL'); } catch { /* zaten ollu */ } }
  async cleanup() { for (const c of this.children.values()) { try { c.kill('SIGKILL'); } catch {} } }
}

async function untilDead(l: RegistryLauncher, pid: number, ms = 5000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if ((await l.isAlive(pid)) === false) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}

// ---- V3-S1.2 canlı: manager kill -9 spawn ÖNCESİ ----

test('V3-S1.2 canlı: manager SIGKILL spawn-öncesi — SENDING kalır (durable), kör re-spawn YOK, reconcile UNKNOWN\'a yükseltir', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-s12-'));
  const dbPath = join(dir, 'ordu.sqlite');
  const registryPath = join(dir, 'registry.json');
  // ONCE rig, SONRA manager: manager bos defterde migration kosarsa parent rig ile
  // kilidi cakistirir (tam-suit CPU yukunde gorulen yarisi — izole kosumda gizli).
  rig(dbPath, [{ attempt: 'att-1', node: 'n-1', dk: 'dk-1' }]);
  const manager = managerDogur(dir, 'pre', dbPath, registryPath);
  t.after(() => { try { manager.kill('SIGKILL'); } catch {} });

  // manager SENDING'i (autocommit — dispatcher.ts U1 niyet kaydı) durable yazar, sonra asilir
  await managerBekle(manager, () => {
    const ro = openStore(dbPath);
    try { return outboxStatus(ro, 'dk-1') === 'SENDING'; } finally { ro.close(); }
  });

  // GERÇEK çökme: manager'ı (dispatch'i yürüten süreci) SIGKILL ile öldür
  manager.kill('SIGKILL');
  await new Promise<void>((resolve) => manager.once('exit', () => resolve()));
  assert.equal(manager.exitCode, null, 'kill -9 → exitCode null (sinyal ölümü, temiz çıkış DEĞİL)');
  assert.equal(existsSync(registryPath), false, 'spawn öncesi çökme: registry YOK (hiç süreç doğmadı)');

  // kurtarma: YENİ süreç (bu test) defteri yeniden açar
  const db = openStore(dbPath);
  const launcher = new RegistryLauncher(registryPath);
  t.after(async () => { await launcher.cleanup(); });
  const adapter = new LocalRuntimeAdapter(probeAllLocal(), launcher, { ORDU_RUNTIME: 'local' });

  assert.equal(outboxStatus(db, 'dk-1'), 'SENDING', 'çökmeden kalan satır SENDING (durable niyet)');
  const r = await processOutbox(db, adapter);
  assert.ok(r.idle, 'SENDING satırı yeniden dispatch edilmez');
  assert.equal(launcher.launches.length, 0, 'kör re-spawn YOK — gerçek süreç doğmadı');

  const rec = await reconcileUnknown(db, adapter);
  assert.deepEqual(rec.outcomes, ['still-unknown'], 'pid yok → uydurma DEAD yok, sabırla UNKNOWN');
  assert.equal(outboxStatus(db, 'dk-1'), 'UNKNOWN', 'U1 canlı: SENDING → UNKNOWN yükseltmesi');
  assert.equal(reservationState(db, 'att-1'), 'UNKNOWN');
  assert.equal(col(db, "SELECT state FROM attempts WHERE id='att-1'"), 'RUNNING', 'belirsizlikte attempt peşinen gömülmez');
  console.log('KANIT V3-S1.2: manager kill -9 spawn-oncesi → SENDING kalır, re-spawn=0, reconcile UNKNOWN');
  db.close();
});

// ---- V3-S1.4 canlı: manager kill -9 spawn ANINDA + STOP latch restart ----

test('V3-S1.4 canlı: manager SIGKILL spawn-anki + STOP — latch kill -9 restart\'ta korunur, dk-1 RECOVER (yeni süreç yok), dk-2 tek spawn', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-s14-'));
  const dbPath = join(dir, 'ordu.sqlite');
  const registryPath = join(dir, 'registry.json');
  // ONCE rig, SONRA manager (S1.2 ile ayni yarasi nedeni)
  rig(dbPath, [
    { attempt: 'att-1', node: 'n-1', dk: 'dk-1' },
    { attempt: 'att-2', node: 'n-2', dk: 'dk-2' },
  ]);
  const manager = managerDogur(dir, 'mid', dbPath, registryPath);
  t.after(() => { try { manager.kill('SIGKILL'); } catch {} });
  let pid1 = 0; // manager'in dogurdugu torun worker — hata halinde de temizlenmeli
  // manager: dk-1 SENDING (durable) → GERÇEK worker doğar → pid registry'ye yazılır → asilir
  await managerBekle(manager, () => {
    const ro = openStore(dbPath);
    try {
      if (outboxStatus(ro, 'dk-1') !== 'SENDING') return false;
    } finally { ro.close(); }
    return existsSync(registryPath) && 'dk-1' in JSON.parse(readFileSync(registryPath, 'utf8'));
  });
  pid1 = JSON.parse(readFileSync(registryPath, 'utf8'))['dk-1'] as number;
  assert.ok(pid1 > 0, 'spawn-anki: gerçek worker doğdu, pid registry\'de');

  // STOP ortasında: gerçek CLI yüzeyi (latch kalıcı — başka süreçten yazılır)
  const stop = await cliMain(['stop', '--actor', 'op', '--reason', 's14-crash'], { dbPath, env: {}, probePath: 'yok' });
  assert.equal(stop.code, 0);

  // GERÇEK çökme: manager'ı SENT commit edilmeden öldür; worker (torun) yaşamaya devam eder
  manager.kill('SIGKILL');
  await new Promise<void>((resolve) => manager.once('exit', () => resolve()));
  assert.equal(manager.exitCode, null, 'kill -9 → exitCode null (crash, temiz çıkış DEĞİL)');

  // kurtarma: YENİ süreç — registry'den dirilen launcher (handle'sız pid okur)
  const db = openStore(dbPath);
  const launcher = new RegistryLauncher(registryPath);
  t.after(async () => { if (pid1 > 0) { try { await launcher.kill(pid1); } catch {} } await launcher.cleanup(); });
  const adapter = new LocalRuntimeAdapter(probeAllLocal(), launcher, { ORDU_RUNTIME: 'local' });
  assert.equal(launcher.pidOf('dk-1'), pid1, 'durable registry kill -9 restart sonrası pid taşır');
  assert.equal(outboxStatus(db, 'dk-1'), 'SENDING', 'SENT commit EDİLMEDİ — kill tam spawn anında');
  assert.equal(outboxStatus(db, 'dk-2'), 'PENDING');

  // STOP latch kill -9 restart'ta korunur: dk-2 spawn edilmez, SENDING satırı da yeniden dispatch edilmez
  const blocked = await processOutbox(db, adapter);
  assert.deepEqual(blocked, { blocked: 'global_stop', processed: 0 });
  assert.equal(launcher.launches.length, 0, 'STOP unutulduysa dk-2 GERÇEKTEN spawn olurdu');

  // resume kapısı (gerçek CLI): onaysız RED → latch yerinde
  const denied = await cliMain(['resume', '--actor', 'op'], { dbPath, env: {}, probePath: 'yok' });
  assert.equal(denied.code, 1);

  // reconcile: SENDING→UNKNOWN yükseltir, sonra pid1 ALIVE → RECOVER (kör re-spawn değil BAĞLANMA)
  const rec = await reconcileUnknown(db, adapter);
  assert.deepEqual(rec.outcomes, ['recovered']);
  assert.equal(outboxStatus(db, 'dk-1'), 'SENT');
  assert.equal(col(db, "SELECT external_session_id FROM attempts WHERE id='att-1'"), 'recovered:dk-1');
  assert.equal(launcher.launches.length, 0, 'recover için yeni süreç doğmadı');

  const ok = await cliMain(['resume', '--actor', 'op', '--confirm', 'I understand the risk'], { dbPath, env: {}, probePath: 'yok' });
  assert.equal(ok.code, 0);

  // latch açık: dk-2 GERÇEK spawn (tek); dk-1'in worker'ı restart boyunca yaşadı
  const r2 = await processOutbox(db, adapter);
  assert.equal(r2.result, 'bound');
  assert.equal(launcher.launches.length, 1, 'toplam yeni süreç 1 (dk-2); dk-1 çift spawn YOK');
  const pid2 = launcher.pidOf('dk-2')!;
  assert.equal(await launcher.isAlive(pid2), true);
  assert.equal(await launcher.isAlive(pid1), true, 'gerçek worker kill -9 restart boyunca hayatta');

  // temizlik: yalnız kendi pid'lerimiz
  await launcher.kill(pid2);
  await launcher.kill(pid1);
  assert.equal(await untilDead(launcher, pid1), true);
  assert.equal(await untilDead(launcher, pid2), true);
  console.log('KANIT V3-S1.4: pid1=' + pid1 + ' (dk-1, spawn-anki kill→recovered), pid2=' + pid2 + ' (dk-2, resume sonrası tek spawn); STOP latch kill -9 restart\'ta korunur');
  db.close();
  // temp dizin bilincli birakilir (f3-live idyomu): Windows'ta sqlite/pipe tanitici
  // gec kapanabilir — rmSync EPERM yarisi kirik temizlik uretir; %TEMP% zaten OS temizligindedir.
});
