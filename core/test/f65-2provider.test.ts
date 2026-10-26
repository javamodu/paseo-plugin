// F6.5-A (Sprint 4) — IKI PROVIDER: registry genisletmesi (glm53u-codex) + rol bazinda
// farkli provider dispatch. Hermetik: sahte adapter; canli Paseo cagrisi YOK (canli kanit
// uretim defteri uzerinde ayri raporla — F65-01 kapanisi, M02 deseni).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { openStore, setGlobalStop, recordCommand } from '../src/store.ts';
import { createRunPlan, approvePlan, dispatchNode, type PlanNode } from '../src/supervisor.ts';
import { assertProviderModel, resolveProviderModel, providerArgOf } from '../src/providers.ts';
import { processOutbox, type WorkerAdapter, type SpawnResult } from '../src/dispatcher.ts';
import { sampleHandoff } from '../src/handoff.ts';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const H64 = (c: string) => c.repeat(64).slice(0, 64);

class SpyAdapter implements WorkerAdapter {
  calls: any[] = [];
  private script: SpawnResult[];
  constructor(script: SpawnResult[] = []) { this.script = [...script]; }
  async spawn(o: any) { this.calls.push(o); return this.script.shift() ?? { outcome: 'OK', externalSessionId: 'ses-' + (this.calls.length) }; }
  async lookup() { return 'UNKNOWN' as const; }
}

function kurulum(db: any, runId: string, nodes: PlanNode[]) {
  setGlobalStop(db, false, 'insan:test', 'f65-2provider kurulum');
  const { planHash } = createRunPlan(db, {
    capsuleId: 'cap-' + runId, goal: 'F6.5 2-provider', repoId: 'ordu/core', sourceCommit: sha(runId),
    runId, planId: 'plan-' + runId, profileHash: H64(runId), nodes, maxWorkers: nodes.length,
  });
  approvePlan(db, runId, planHash, 'insan:test');
  const cmd = recordCommand(db, { kind: 'START_RUN', actorId: 'insan:test', runId, idempotencyKey: 'ik-' + runId, payload: { runId, planHash, idempotencyKey: 'ik-' + runId } });
  return cmd.commandId;
}

test('F6.5-A registry: IKINCI provider kabul edilir, kartı kırmızıya düşer, arg bicimi dogru', () => {
  // iki provider da gecerli kombinasyonlarla kabul
  assertProviderModel('codex', 'glm-5.3');
  assertProviderModel('glm53u-codex', 'glm-5.3');
  assertProviderModel('glm53u-codex', null); // model NULL = provider varsayilani
  assertProviderModel(null, null); // NULL/NULL hala kabul (manager'a birak)
  // yeni providerin disina cikmak fail-closed RED
  assert.throws(() => assertProviderModel('glm53u-codex', 'kimi-K3'), /registry-disi model/);
  assert.throws(() => assertProviderModel('glm53u-claude', 'glm-5.3'), /registry-disi provider/, 'registry bilincli kume — serbest metin YOK');
  // arg bicimi: provider/model; model NULL ise provider tek basina (CLI '--provider codex or codex/gpt-5.4' sozlesmesi)
  assert.equal(providerArgOf({ provider: 'codex', model: 'glm-5.3' }), 'codex/glm-5.3');
  assert.equal(providerArgOf({ provider: 'glm53u-codex', model: 'glm-5.3' }), 'glm53u-codex/glm-5.3');
  assert.equal(providerArgOf({ provider: 'glm53u-codex', model: null }), 'glm53u-codex');
});

test('F6.5-A cozum zinciri: node ucu ve ORDU_PROVIDER env ucu iki provideri da cozer', () => {
  // node ucu
  assert.deepEqual(
    resolveProviderModel({ provider: 'codex', model: 'glm-5.3' }, {}),
    { ok: true, provider: 'codex', model: 'glm-5.3' },
  );
  assert.deepEqual(
    resolveProviderModel({ provider: 'glm53u-codex', model: 'glm-5.3' }, {}),
    { ok: true, provider: 'glm53u-codex', model: 'glm-5.3' },
  );
  // env ucu (node provider NULL iken)
  assert.deepEqual(
    resolveProviderModel({}, { ORDU_PROVIDER: 'glm53u-codex/glm-5.3' } as any),
    { ok: true, provider: 'glm53u-codex', model: 'glm-5.3' },
  );
  // env registry disi → ok:false (dispatcher FATAL'a cevirir — sessiz dusus yok)
  assert.equal((resolveProviderModel({}, { ORDU_PROVIDER: 'glm53u-claude/glm-5.3' } as any) as any).ok, false);
  // varsayilan zinciri degismedi
  assert.deepEqual(resolveProviderModel({}, {}), { ok: true, provider: 'codex', model: 'kimi-K3' });
});

test('F6.5-A dispatch: tek planda ROL BAZINDA farkli provider — her node KENDI providerina cozulur', async () => {
  const db = openStore();
  const runId = 'run-f65iki';
  const sc = kurulum(db, runId, [
    { id: 'n1', role: 'coder', deps: [], provider: 'codex', model: 'glm-5.3' },
    { id: 'n2', role: 'coder', deps: [], provider: 'glm53u-codex', model: 'glm-5.3' },
  ]);
  dispatchNode(db, runId, 'n1', { tokens: 100, startCommandId: sc, dispatchKey: 'dk-f65-1', handoff: sampleHandoff(runId) });
  dispatchNode(db, runId, 'n2', { tokens: 100, startCommandId: sc, dispatchKey: 'dk-f65-2', handoff: sampleHandoff(runId) });
  const a = new SpyAdapter([
    { outcome: 'OK', externalSessionId: 'ses-A' },
    { outcome: 'OK', externalSessionId: 'ses-B' },
  ]);
  await processOutbox(db, a);
  await processOutbox(db, a);
  assert.equal(a.calls.length, 2, 'iki node iki spawn');
  // her spawn KENDI provider/model ciftiyle cagrildi (rol bazinda ayrim)
  const c1 = a.calls.find((c) => c.dispatchKey === 'dk-f65-1')!;
  const c2 = a.calls.find((c) => c.dispatchKey === 'dk-f65-2')!;
  assert.deepEqual([c1.provider, c1.model], ['codex', 'glm-5.3'], 'n1 codex motoru');
  assert.deepEqual([c2.provider, c2.model], ['glm53u-codex', 'glm-5.3'], 'n2 glm53u-codex motoru');
  // oturum ayrımı defterde: her attempt kendi harici oturumuna bagli
  const oturumlar = db.prepare("SELECT o.dispatch_key, a.external_session_id FROM attempts a JOIN outbox o ON o.attempt_id=a.id WHERE a.run_id=? ORDER BY o.dispatch_key").all(runId) as any[];
  assert.equal(oturumlar.length, 2);
  assert.notEqual(oturumlar[0].external_session_id, oturumlar[1].external_session_id, 'oturumlar karismaz');
});

test('F6.5-A kirmizi: node provider/model uyumsuzsa DERLEME asamasinda ACIK RED (fail-closed)', () => {
  const db = openStore();
  const runId = 'run-f65red';
  // uyumsuz cift plana zaten GIREMEZ — createRunPlan'in derleme kapisi RED (dispatch hic dogmaz)
  assert.throws(
    () => kurulum(db, runId, [{ id: 'n1', role: 'coder', deps: [], provider: 'glm53u-codex', model: 'kimi-K3' }]),
    /F6\.5 RED: registry-disi model/,
  );
  assert.equal((db.prepare('SELECT COUNT(*) c FROM attempts WHERE run_id=?').get(runId) as any).c, 0, 'attempt dogmadi');
});
