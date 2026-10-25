// ADR-012 hermetik kanıtlar: runtime-spesifik kapı + local semantikler.
// Gerçek git-worktree/CLI provası V3-RT.1/2 (canlı) — burada NOT_RUN.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { loadVerifiedProbe, type ProbeReceipt } from '../src/capabilities.ts';
import { LocalRuntimeAdapter, LOCAL_REQUIRED_CAPS, type LocalLauncher } from '../src/local-runtime.ts';
import { processOutbox, reconcileUnknown } from '../src/dispatcher.ts';
import { openStore, recordCommand, setGlobalStop, reserveDispatch } from '../src/store.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);
const canonical = (v: unknown): string =>
  v === null || typeof v !== 'object' ? JSON.stringify(v)
    : Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']'
      : '{' + Object.keys(v as object).sort().map((k) => JSON.stringify(k) + ':' + canonical((v as any)[k])).join(',') + '}';

const PASEO_CAPS = ['worktreeIsolationProven', 'sandboxEstablished', 'structuredOutput', 'usageReporting', 'cancelConfirm'];

function localReceipt(localTrue: string[], opts: { paseoAllFalse?: boolean } = {}): ProbeReceipt {
  const caps: Record<string, boolean> = {
    nodePinned24: true, gitPresent: true, paseoCliPresent: true, paseoDaemonReachable: true,
  };
  for (const c of PASEO_CAPS) caps[c] = opts.paseoAllFalse === false;
  for (const c of LOCAL_REQUIRED_CAPS) caps[c] = localTrue.includes(c as string);
  const blocked = Object.entries(caps).filter(([, v]) => !v).map(([k]) => k);
  const r: any = { probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: '2026-10-13T18:00:00.000Z', node: 'v24.18.0', capabilities: caps, blocked };
  r.probeReceiptHash = createHash('sha256').update(canonical(r)).digest('hex');
  return r as ProbeReceipt;
}

function writeReceipt(r: ProbeReceipt) {
  const p = join(mkdtempSync(join(tmpdir(), 'ordu-local-')), 'probe.json');
  writeFileSync(p, JSON.stringify(r, null, 2));
  return p;
}
const NOW = () => new Date(Date.parse('2026-10-13T19:00:00Z'));

class FakeLauncher implements LocalLauncher {
  launches: string[] = [];
  kills: number[] = [];
  pids = new Map<string, number>();
  alive = true;
  failNext = false;
  async launch(o: { dispatchKey: string }) {
    if (this.failNext) { this.failNext = false; throw new Error('çalıştırma belirsiz'); }
    this.launches.push(o.dispatchKey);
    const pid = 4242;
    this.pids.set(o.dispatchKey, pid); // durable registry yazımı buradan (launcher sözleşmesi)
    return { pid };
  }
  pidOf(dk: string) { return this.pids.get(dk); }
  async isAlive() { return this.alive; }
  async kill(pid: number) { this.kills.push(pid); this.alive = false; }
}

test('RUNTIME-KAPSAMI: paseo yetenekleri blocked iken local kanıtları varsa local DOĞAR', async () => {
  const receipt = loadVerifiedProbe(writeReceipt(localReceipt([...LOCAL_REQUIRED_CAPS])), { now: NOW });
  assert.ok(receipt.blocked.length > 0, 'paseo yetenekleri hâlâ blocked — kabul testi bunu varsayar');
  const l = new FakeLauncher();
  const a = new LocalRuntimeAdapter(receipt, l, { ORDU_RUNTIME: 'local' });
  const r = await a.spawn({ dispatchKey: 'dk-1', attemptId: 'att-1', prompt: 'p' });
  assert.equal(r.outcome, 'OK');
  assert.equal((r as any).externalSessionId, 'local:4242');
});

test('local kanıt eksiği → FATAL, launcher\'a dokunulmaz; ORDU_RUNTIME beyanı şart', async () => {
  const receipt = localReceipt(['gitWorktreeProven', 'providerCliPresent']); // 2 eksik
  let touched = false;
  const guard: LocalLauncher = {
    async launch() { touched = true; return { pid: 1 }; },
    pidOf() { touched = true; return undefined; },
    async isAlive() { return true; },
    async kill() { touched = true; },
  };
  const a = new LocalRuntimeAdapter(receipt, guard, { ORDU_RUNTIME: 'local' });
  const r = await a.spawn({ dispatchKey: 'dk', attemptId: 'at', prompt: 'p' });
  assert.equal(r.outcome, 'FATAL');
  assert.match((r as any).reason, /processRegistryDurable,cancelConfirmLocal|cancelConfirmLocal,processRegistryDurable/);
  assert.equal(touched, false);
  const b = new LocalRuntimeAdapter(loadProbeAllLocal(), guard, {}); // beyan yok
  const r2 = await b.spawn({ dispatchKey: 'dk', attemptId: 'at', prompt: 'p' });
  assert.equal(r2.outcome, 'FATAL');
  assert.match((r2 as any).reason, /ORDU_RUNTIME/);
});

function loadProbeAllLocal() {
  return loadVerifiedProbe(writeReceipt(localReceipt([...LOCAL_REQUIRED_CAPS])), { now: NOW });
}

test('dispatcher entegrasyonu: local adapter ile uç uca SESSION_BOUND + reconcile ALIVE/DEAD', async () => {
  const db = openStore();
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'h', 'r', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)').run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), '{}');
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-1','plan-1',1,'READY','ph',0,1,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1','n-1','coder','[]','READY')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`).run();
  setGlobalStop(db, false, 't', 'kurulum');
  const cmd = recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-1', idempotencyKey: 'k-1', payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: 'k-1' } });
  reserveDispatch(db, { attemptId: 'att-1', tokens: 50, commandId: cmd.commandId, dispatchKey: 'dk-1' });

  const l = new FakeLauncher();
  const a = new LocalRuntimeAdapter(loadProbeAllLocal(), l, { ORDU_RUNTIME: 'local' });
  const r = await processOutbox(db, a);
  assert.equal(r.result, 'bound');
  assert.equal((db.prepare("SELECT external_session_id FROM attempts WHERE id='att-1'").get() as any).external_session_id, 'local:4242');
  assert.equal(await a.lookup('dk-1'), 'ALIVE');
  assert.equal(await a.lookup('yok-olarak-dk'), 'UNKNOWN', 'registry\'de olmayan key uydurma DEAD OLMAZ');
  assert.equal(await a.cancel('dk-1'), true);
  assert.deepEqual(l.kills, [4242]);
});

test('A08 local kolu: launch patlarsa UNKNOWN → reconcile UNKNOWN kalır, kör re-spawn yok', async () => {
  const db = openStore();
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'h', 'r', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)').run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), '{}');
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-1','plan-1',1,'READY','ph',0,1,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1','n-1','coder','[]','READY')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`).run();
  setGlobalStop(db, false, 't', 'kurulum');
  const cmd = recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-1', idempotencyKey: 'k-1', payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: 'k-1' } });
  reserveDispatch(db, { attemptId: 'att-1', tokens: 50, commandId: cmd.commandId, dispatchKey: 'dk-1' });

  const l = new FakeLauncher();
  l.failNext = true;
  const a = new LocalRuntimeAdapter(loadProbeAllLocal(), l, { ORDU_RUNTIME: 'local' });
  const r = await processOutbox(db, a);
  assert.equal(r.result, 'unknown');
  const callsAfterFail = l.launches.length;
  await processOutbox(db, a); // UNKNOWN satırı spawn yoluna dönmez
  assert.equal(l.launches.length, callsAfterFail);
  const rec = await reconcileUnknown(db, a); // pidOf undefined → still-unknown (uydurma kapanış yok)
  assert.deepEqual(rec.outcomes, ['still-unknown']);
});
