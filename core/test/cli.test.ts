// CLI yürüyüşü (V3-S1.1 öncesi hermetik yarısı): sürtünme kapıları + tick gate'i.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { cliMain } from '../src/cli.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const NOW = () => new Date(Date.parse('2026-10-13T19:00:00Z'));

const canonical = (v: unknown): string =>
  v === null || typeof v !== 'object' ? JSON.stringify(v)
    : Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']'
      : '{' + Object.keys(v as object).sort().map((k) => JSON.stringify(k) + ':' + canonical((v as any)[k])).join(',') + '}';

function cleanProbeFile() {
  const all = ['nodePinned24', 'gitPresent', 'paseoCliPresent', 'paseoDaemonReachable', 'worktreeIsolationProven', 'sandboxEstablished', 'structuredOutput', 'usageReporting', 'cancelConfirm'];
  const r: any = { probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: '2026-10-13T18:00:00.000Z', node: 'v24.18.0', capabilities: Object.fromEntries(all.map((k) => [k, true])), blocked: [] };
  r.probeReceiptHash = createHash('sha256').update(canonical(r)).digest('hex');
  const p = join(mkdtempSync(join(tmpdir(), 'ordu-cli-')), 'probe.json');
  writeFileSync(p, JSON.stringify(r, null, 2));
  return p;
}


function blockedProbeFile() {
  const all = ['nodePinned24', 'gitPresent', 'paseoCliPresent', 'paseoDaemonReachable', 'worktreeIsolationProven', 'sandboxEstablished', 'structuredOutput', 'usageReporting', 'cancelConfirm'];
  const caps = Object.fromEntries(all.map((k) => [k, true]));
  caps.cancelConfirm = false;
  const r: any = { probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: '2026-10-13T18:00:00.000Z', node: 'v24.18.0', capabilities: caps, blocked: ['cancelConfirm'] };
  r.probeReceiptHash = createHash('sha256').update(canonical(r)).digest('hex');
  const p = join(mkdtempSync(join(tmpdir(), 'ordu-cli-')), 'probe.json');
  writeFileSync(p, JSON.stringify(r, null, 2));
  return p;
}
function deps() {
  return { dbPath: join(mkdtempSync(join(tmpdir(), 'ordu-cli-db-')), 'ordu.sqlite'), env: {}, probePath: join(root, 'evidence', 'probe-latest.json'), now: NOW };
}

// evidence/probe-latest.json `npm run probe` ile yeniden üretilir: sabit saat yerine
// receipt'in kendi generatedAt'ı kullanılır (negatif yaş = gelecek tarih → RED).
const nowOf = (path: string) => {
  const { generatedAt } = JSON.parse(readFileSync(path, 'utf8'));
  return () => new Date(Date.parse(generatedAt) + 3.6e6);
};

test('status → stop → resume sürtünme kapısı: yanlış onayda latch KALIR', async () => {
  const d = deps();
  let r = await cliMain(['status'], d);
  assert.equal(r.code, 0);
  assert.equal((r.out as any).globalStop, true); // 001 fail-closed doğar

  r = await cliMain(['stop', '--actor', 'op', '--reason', 'tatbikat'], d);
  assert.equal(r.code, 0);

  r = await cliMain(['resume', '--confirm', 'eminim'], d); // B01 literal'i bilmiyor → RED
  assert.equal(r.code, 1);
  r = await cliMain(['status'], d);
  assert.equal((r.out as any).globalStop, true, 'yanlış onay latchi açamaz');

  r = await cliMain(['resume', '--confirm', 'I understand the risk'], d);
  assert.equal(r.code, 0);
  r = await cliMain(['status'], d);
  assert.equal((r.out as any).globalStop, false);
});

test('tick: gerçek (blocked) probe → exit 2 BLOCKED, adaptera hiç gidilmez', async () => {
  let adapterMade = false;
  const realProbe = blockedProbeFile();
  const d = { ...deps(), probePath: realProbe, now: nowOf(realProbe), makeAdapter: () => { adapterMade = true; throw new Error('ULASILMAMALI'); } };
  const r = await cliMain(['tick'], d);
  assert.equal(r.code, 2);
  assert.match((r.out as any).reason, /capability-blocked/);
  assert.equal(adapterMade, false);
});

test('tick: sürtünmesiz probe + enjekte adapter → dispatch ilerler (SESSION_BOUND)', async () => {
  const d = deps();
  // önce boş kuyruk + fail-closed varsayılanı: tick BLOCKED döner (stop hiç açılmadı)
  let r = await cliMain(['tick'], { ...d, probePath: cleanProbeFile(), makeAdapter: () => ({ async spawn() { throw new Error('yok'); }, async lookup() { return 'UNKNOWN' as const; } }) });
  assert.equal(r.code, 0);
  assert.equal((r.out as any).outbox.blocked, 'global_stop');
  // reserve ekle (START_RUN komutu CLI'da değil; store'a yazıp tick'i besliyoruz)
  const { openStore, recordCommand, setGlobalStop, reserveDispatch } = await import('../src/store.ts');
  const db = openStore(d.dbPath);
  const H = (c: string) => c.repeat(64).slice(0, 64);
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-9', 'h', 'r', H('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)').run('plan-9', 'cap-9', 1, H('b'), H('e'), H('p'), '{}');
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-9','plan-9',1,'READY','ph',0,1,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-9','n-9','coder','[]','READY')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-9','run-9','n-9',1,'RUNNING','ih',1)`).run();
  setGlobalStop(db, false, 't', 'kurulum');
  const cmd = recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-9', idempotencyKey: 'k-9', payload: { runId: 'run-9', planHash: H('b'), idempotencyKey: 'k-9' } });
  reserveDispatch(db, { attemptId: 'att-9', tokens: 10, commandId: cmd.commandId, dispatchKey: 'dk-9' });
  db.close();

  r = await cliMain(['tick'], { ...d, probePath: cleanProbeFile(), makeAdapter: () => ({ async spawn() { return { outcome: 'OK' as const, externalSessionId: 'ses-cli' }; }, async lookup() { return 'ALIVE' as const; } }) });
  assert.equal(r.code, 0);
  assert.equal((r.out as any).outbox.result, 'bound');
});
