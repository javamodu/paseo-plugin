// F6.5 (ADR-F65) — rol->model secimi: 003 migration, kapali provider registry,
// planHash geriye uyumlulugu, dispatch cozum zinciri, spawn arg akisi, CLI flag'leri.
// Hermetik: sahte adapter/execFile enjeksiyonu; canli Paseo/LLM cagrisi YOK.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { openStore, recordCommand, setGlobalStop, reserveDispatch, GateError } from '../src/store.ts';
import { createRunPlan, approvePlan, dispatchNode, planHashOf, type PlanNode } from '../src/supervisor.ts';
import { assertProviderModel, resolveProviderModel, providerArgOf, PROVIDER_REGISTRY } from '../src/providers.ts';
import { processOutbox, type WorkerAdapter, type SpawnResult } from '../src/dispatcher.ts';
import { paseoSpawnArgs } from '../src/paseo-transport.ts';
import { LocalRuntimeAdapter, type LocalLauncher } from '../src/local-runtime.ts';
import { sampleHandoff } from '../src/handoff.ts';
import { cliMain } from '../src/cli.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dbDir = join(root, 'database');
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const H64 = (c: string) => c.repeat(64).slice(0, 64);
const COMMIT = sha('f65-test-commit');

// planHashOf'un F6.5 ONCESI kanonik algoritmasi (geriye uyum kaniti icin donmus kopya).
const canonicalLegacy = (v: unknown): string =>
  v === null || typeof v !== 'object' ? JSON.stringify(v)
    : Array.isArray(v) ? '[' + (v as unknown[]).map(canonicalLegacy).join(',') + ']'
      : '{' + Object.keys(v as object).sort().map((k) => JSON.stringify(k) + ':' + canonicalLegacy((v as any)[k])).join(',') + '}';
const legacyHashOf = (nodes: PlanNode[]) =>
  sha(canonicalLegacy(nodes.map((n) => ({ id: n.id, role: n.role, deps: [...n.deps].sort() }))));

function planDb(nodes: PlanNode[], runId = 'run-1') {
  const db = openStore();
  setGlobalStop(db, false, 'test', 'kurulum');
  const planHash = createRunPlan(db, {
    capsuleId: 'cap-' + runId, goal: 'f65', repoId: 'repo', sourceCommit: COMMIT,
    runId, planId: 'plan-' + runId, profileHash: H64('p'), nodes, maxWorkers: 5,
  }).planHash;
  return { db, planHash };
}

function reserveFor(db: any, runId: string, nodeId: string, key: string) {
  approvePlan(db, runId, (db.prepare('SELECT p.plan_hash h FROM plans p JOIN runs r ON r.plan_id=p.id WHERE r.id=?').get(runId) as any).h, 'human');
  const cmd = recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId, idempotencyKey: key, payload: { runId, planHash: H64('b'), idempotencyKey: key } });
  return dispatchNode(db, runId, nodeId, { tokens: 100, startCommandId: cmd.commandId, dispatchKey: key, handoff: sampleHandoff(runId) });
}

class SpyAdapter implements WorkerAdapter {
  calls: any[] = [];
  private script: SpawnResult[];
  constructor(script: SpawnResult[] = [{ outcome: 'OK', externalSessionId: 'ses-1' }]) { this.script = script; }
  async spawn(o: any) { this.calls.push(o); return this.script.shift() ?? { outcome: 'OK', externalSessionId: 'ses-x' }; }
  async lookup() { return 'UNKNOWN' as const; }
}

// ---- Grup 1: migration ----
test('003 migration: temiz DB user_version=4 (003+004 sirasiyla) + nodes.provider/model kolonlari', () => {
  const p = join(mkdtempSync(join(tmpdir(), 'ordu-f65-mig-')), 'ordu.sqlite');
  const db = openStore(p);
  assert.equal((db.prepare('PRAGMA user_version').get() as any).user_version, 4); // R3: 004-grants sonrasi damga 4 (003 adimi korunur)
  const cols = (db.prepare('PRAGMA table_info(nodes)').all() as any[]).map((c) => c.name);
  assert.ok(cols.includes('provider') && cols.includes('model'));
  db.close();
  const db2 = openStore(p); // ikinci acilis no-op (user_version kapisi)
  assert.equal((db2.prepare('PRAGMA user_version').get() as any).user_version, 4); // R3: 004-grants sonrasi damga 4 (003 adimi korunur)
  db2.close();
});

test('003 migration: 001+002 fixture DB acilinca 003 uygulanir; mevcut satirlar NULL (eski davranis)', () => {
  const p = join(mkdtempSync(join(tmpdir(), 'ordu-f65-fixture-')), 'ordu.sqlite');
  const raw = new DatabaseSync(p);
  raw.exec(readFileSync(join(dbDir, '001-initial.sql'), 'utf8'));
  raw.exec(readFileSync(join(dbDir, '002-hardening.sql'), 'utf8'));
  raw.exec('PRAGMA user_version=2;');
  raw.prepare(`INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES('c0','g','r','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')`).run();
  raw.prepare(`INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES('p0','c0',1,'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee','pppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp','{}')`).run();
  raw.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at) VALUES('r0','p0',1,'READY','ph',0,1,3,100,0,0,'2099-01-01T00:00:00Z')`).run();
  raw.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('r0','n0','coder','[]','PENDING')`).run();
  raw.close();
  const db = openStore(p); // 003 uygulanmali
  assert.equal((db.prepare('PRAGMA user_version').get() as any).user_version, 4); // R3: 004-grants sonrasi damga 4 (003 adimi korunur)
  const row = db.prepare(`SELECT provider, model FROM nodes WHERE id='n0'`).get() as any;
  assert.equal(row.provider, null);
  assert.equal(row.model, null);
  db.close();
});

test('003 migration: 001/002 SQL dosyalari byte-degismez (hash kilidi)', () => {
  assert.equal(createHash('sha256').update(readFileSync(join(dbDir, '001-initial.sql'))).digest('hex'),
    '06716b653e94931b8c1b9ad1be80559fc727987a0c923e5a98d8ab2083d0d61f');
  assert.equal(createHash('sha256').update(readFileSync(join(dbDir, '002-hardening.sql'))).digest('hex'),
    '30b9247817ea4c3f64e94c3d3ce768d085a1fe0969dfd93abeda5709fe5572ce');
});

// ---- Grup 2: registry RED'leri + createRunPlan ----
test('registry: model-dolu + provider-NULL RED; bilinmeyen provider/model RED; NULL/NULL kabul', () => {
  assert.throws(() => assertProviderModel(undefined, 'kimi-K3'), GateError);
  assert.throws(() => assertProviderModel(null, 'kimi-K3'), GateError);
  assert.throws(() => assertProviderModel('qwen', null), GateError);
  assert.throws(() => assertProviderModel('codex', 'halusinasyon-9'), GateError);
  assert.doesNotThrow(() => assertProviderModel(undefined, undefined));
  assert.doesNotThrow(() => assertProviderModel('codex', 'kimi-K3'));
  assert.doesNotThrow(() => assertProviderModel('codex', null)); // provider tek basina = vendor varsayilani
  assert.ok(Object.keys(PROVIDER_REGISTRY).includes('codex'));
});

test('createRunPlan: provider+model INSERT edilir; registry-disi plan RED (GateError)', () => {
  const { db } = planDb([{ id: 'n1', role: 'coder', deps: [], provider: 'codex', model: 'gpt-5.4' }]);
  const row = db.prepare(`SELECT provider, model FROM nodes WHERE id='n1'`).get() as any;
  assert.equal(row.provider, 'codex');
  assert.equal(row.model, 'gpt-5.4');
  assert.throws(() => planDb([{ id: 'n1', role: 'coder', deps: [], provider: 'bilinmeyen' }], 'run-red'), GateError);
  assert.throws(() => planDb([{ id: 'n1', role: 'coder', deps: [], model: 'kimi-K3' }], 'run-red2'), GateError);
});

// ---- Grup 3: planHash geriye uyumluluk ----
test('planHashOf: providersuz plan ESKI algoritmayla byte-ayni; farkli model = farkli hash', () => {
  const nodes: PlanNode[] = [{ id: 'n1', role: 'coder', deps: [] }, { id: 'n2', role: 'tester', deps: ['n1'] }];
  assert.equal(planHashOf(nodes), legacyHashOf(nodes), 'F0 byte-esitlik kapisi bozuldu');
  const withModel = planHashOf(nodes.map((n) => ({ ...n, provider: 'codex', model: 'kimi-K3' })));
  assert.notEqual(withModel, planHashOf(nodes), 'model secimi hash disinda kaldi');
  const otherModel = planHashOf(nodes.map((n) => ({ ...n, provider: 'codex', model: 'gpt-5.4' })));
  assert.notEqual(withModel, otherModel, 'farkli model ayni hash uretti');
});

// ---- Grup 4: cozum zinciri (saf fonksiyon) ----
test('cozum zinciri: node > env > varsayilan; registry-disi env ok:false', () => {
  assert.deepEqual(resolveProviderModel({ provider: 'codex', model: 'gpt-5.4' }, {}),
    { ok: true, provider: 'codex', model: 'gpt-5.4' });
  assert.deepEqual(resolveProviderModel({}, { ORDU_PROVIDER: 'codex/gpt-5.4' }),
    { ok: true, provider: 'codex', model: 'gpt-5.4' });
  assert.deepEqual(resolveProviderModel({}, { ORDU_PROVIDER: 'codex' }),
    { ok: true, provider: 'codex', model: null });
  assert.deepEqual(resolveProviderModel({}, {}), { ok: true, provider: 'codex', model: 'kimi-K3' });
  assert.deepEqual(resolveProviderModel({ provider: null, model: null }, {}), { ok: true, provider: 'codex', model: 'kimi-K3' });
  const bad = resolveProviderModel({}, { ORDU_PROVIDER: 'qwen/x1' });
  assert.equal(bad.ok, false, 'registry-disi env sessizce kabul edildi');
  const badNode = resolveProviderModel({ provider: null, model: 'kimi-K3' }, {});
  assert.equal(badNode.ok, false, 'provider-NULL model sessizce kabul edildi');
  assert.equal(providerArgOf({ provider: 'codex', model: 'kimi-K3' }), 'codex/kimi-K3');
  assert.equal(providerArgOf({ provider: 'codex', model: null }), 'codex');
});

// ---- Grup 5: paseoSpawnArgs cozulmus degeri kullanir ----
test('paseoSpawnArgs: provider+model birlesimi; model-NULL provider tek basina', () => {
  const a1 = paseoSpawnArgs({ dispatchKey: 'dk', attemptId: 'a', prompt: 'p', provider: 'codex', model: 'gpt-5.4' });
  assert.equal(a1[a1.indexOf('--provider') + 1], 'codex/gpt-5.4');
  const a2 = paseoSpawnArgs({ dispatchKey: 'dk', attemptId: 'a', prompt: 'p', provider: 'codex' });
  assert.equal(a2[a2.indexOf('--provider') + 1], 'codex');
  const a3 = paseoSpawnArgs({ dispatchKey: 'dk', attemptId: 'a', prompt: 'p' });
  assert.equal(a3[a3.indexOf('--provider') + 1], 'codex/kimi-K3', 'parametresiz legacy varsayilan bozuldu');
});

// ---- Grup 6: uctan uca hermetik dispatch ----
test('e2e hermetik: 2 node farkli provider; NULL node varsayilana duser; registry-disi env FATAL', async () => {
  const { db } = planDb([
    { id: 'n1', role: 'coder', deps: [], provider: 'codex', model: 'gpt-5.4' },
    { id: 'n2', role: 'tester', deps: [] },
  ]);
  const d1 = reserveFor(db, 'run-1', 'n1', 'dk-1');
  const d2 = reserveFor(db, 'run-1', 'n2', 'dk-2');
  assert.equal(d1.status, 'DISPATCHED');
  assert.equal(d2.status, 'DISPATCHED');
  const spy = new SpyAdapter();
  let r = await processOutbox(db, spy);
  assert.equal(r.result, 'bound');
  r = await processOutbox(db, spy);
  assert.equal(r.result, 'bound');
  assert.equal(spy.calls.length, 2);
  const byKey = new Map(spy.calls.map((c) => [c.dispatchKey, c]));
  assert.deepEqual([byKey.get('dk-1').provider, byKey.get('dk-1').model], ['codex', 'gpt-5.4'], 'node degeri spawn akmadi');
  assert.deepEqual([byKey.get('dk-2').provider, byKey.get('dk-2').model], ['codex', 'kimi-K3'], 'NULL node varsayilana dusmedi');

  // registry-disi env: FATAL — adapter HIC cagrilmaz, rezervasyon RELEASED, attempt/node FAILED
  const env = process.env.ORDU_PROVIDER;
  process.env.ORDU_PROVIDER = 'qwen/x1';
  try {
    const { db: db2 } = planDb([{ id: 'n1', role: 'coder', deps: [] }], 'run-env');
    reserveFor(db2, 'run-env', 'n1', 'dk-env');
    const spy2 = new SpyAdapter();
    const r2 = await processOutbox(db2, spy2);
    assert.equal(r2.result, 'fatal');
    assert.equal(spy2.calls.length, 0, 'registry-disi env ile spawn denendi');
    assert.equal((db2.prepare(`SELECT status FROM outbox WHERE dispatch_key='dk-env'`).get() as any).status, 'FAILED');
    assert.equal((db2.prepare(`SELECT state FROM reservations WHERE attempt_id=?`).get((d1 as any).attemptId ?? 'att') as any)?.state ?? 'RELEASED', 'RELEASED');
    assert.equal((db2.prepare(`SELECT state FROM attempts a JOIN outbox o ON o.attempt_id=a.id WHERE o.dispatch_key='dk-env'`).get() as any).state, 'FAILED');
  } finally {
    if (env === undefined) delete process.env.ORDU_PROVIDER; else process.env.ORDU_PROVIDER = env;
  }

  // env fallback: node NULL + gecerli env → env kazanir
  const env2 = process.env.ORDU_PROVIDER;
  process.env.ORDU_PROVIDER = 'codex/gpt-5.4';
  try {
    const { db: db3 } = planDb([{ id: 'n1', role: 'coder', deps: [] }], 'run-env2');
    reserveFor(db3, 'run-env2', 'n1', 'dk-env2');
    const spy3 = new SpyAdapter();
    await processOutbox(db3, spy3);
    assert.deepEqual([spy3.calls[0].provider, spy3.calls[0].model], ['codex', 'gpt-5.4'], 'env fallback calismadi');
  } finally {
    if (env2 === undefined) delete process.env.ORDU_PROVIDER; else process.env.ORDU_PROVIDER = env2;
  }
});

// ---- Grup 7: LocalRuntimeAdapter spy ----
test('LocalRuntimeAdapter: launcher cozulmus provider/model ile cagrilir', async () => {
  const calls: any[] = [];
  const launcher: LocalLauncher = {
    async launch(o: any) { calls.push(o); return { pid: 4242 }; },
    pidOf: () => 4242,
    async isAlive() { return true; },
    async kill() {},
    dispatchKeyOf(_a: string): string | undefined { return undefined; }, // tip-borcu v9-06: guard-nesne attempt izlemez (cancel UNKNOWN fail-closed)
  };
  const caps = { gitWorktreeProven: true, processRegistryDurable: true, cancelConfirmLocal: true, providerCliPresent: true };
  const adapter = new LocalRuntimeAdapter({ capabilities: caps } as any, launcher, { ORDU_RUNTIME: 'local' });
  const r = await adapter.spawn({ dispatchKey: 'dk-l', attemptId: 'a-l', prompt: 'p', provider: 'codex', model: 'kimi-K3' });
  assert.equal(r.outcome, 'OK');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].provider, 'codex');
  assert.equal(calls[0].model, 'kimi-K3');
});

// ---- CLI flag parse ----
test('cli capsule: --provider/--model node kolonlarina yazar; --model tek basina RED', async () => {
  const deps = () => ({ dbPath: join(mkdtempSync(join(tmpdir(), 'ordu-f65-cli-')), 'ordu.sqlite'), env: {}, probePath: join(root, 'evidence', 'probe-latest.json') });
  const d1 = deps();
  let r = await cliMain(['capsule', '--goal', 'g', '--repo', 'r', '--commit', COMMIT, '--provider', 'codex', '--model', 'gpt-5.4'], d1);
  assert.equal(r.code, 0, String(r.out));
  const db = openStore(d1.dbPath);
  const row = db.prepare(`SELECT provider, model FROM nodes WHERE id='n1'`).get() as any;
  assert.equal(row.provider, 'codex');
  assert.equal(row.model, 'gpt-5.4');
  db.close();

  const d2 = deps();
  r = await cliMain(['capsule', '--goal', 'g', '--repo', 'r', '--commit', COMMIT, '--model', 'kimi-K3'], d2);
  assert.equal(r.code, 1, 'model tek basina kabul edildi');

  const d3 = deps();
  r = await cliMain(['capsule', '--goal', 'g', '--repo', 'r', '--commit', COMMIT, '--provider', 'bilinmeyen-vendor'], d3);
  assert.equal(r.code, 1, 'registry-disi provider kabul edildi');
});
