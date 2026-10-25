// S1 kalanı: B02 capability gate + Paseo adapter + korunan evaluator.
// Canlı Paseo çağrısı YOK (probe blocked) — gate'in kendisi kanıtlanıyor;
// gerçek transport V3-S1.1'de ORDU_LIVE=1 + boş blocked liste ile koşacak (NOT_RUN).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { loadVerifiedProbe, spawnBlockedReason, type ProbeReceipt } from '../src/capabilities.ts';
import { PaseoWorkerAdapter, type Transport } from '../src/paseo-adapter.ts';
import { evaluateAttempt, type CommandRunner } from '../src/evaluator.ts';
import { openStore, recordCommand, setGlobalStop, reserveDispatch, commitCandidate, GateError, takeLease } from '../src/store.ts';
import { processOutbox } from '../src/dispatcher.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const canonical = (v: unknown): string =>
  v === null || typeof v !== 'object' ? JSON.stringify(v)
    : Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']'
      : '{' + Object.keys(v as object).sort().map((k) => JSON.stringify(k) + ':' + canonical((v as any)[k])).join(',') + '}';

function signReceipt(r: ProbeReceipt): ProbeReceipt {
  const copy: any = { ...r };
  delete copy.probeReceiptHash;
  return { ...copy, probeReceiptHash: createHash('sha256').update(canonical(copy)).digest('hex') } as ProbeReceipt;
}

const baseCaps = (blocked: string[]): Record<string, boolean> => {
  const all = ['nodePinned24', 'gitPresent', 'paseoCliPresent', 'paseoDaemonReachable', 'worktreeIsolationProven', 'sandboxEstablished', 'structuredOutput', 'usageReporting', 'cancelConfirm'];
  return Object.fromEntries(all.map((k) => [k, !blocked.includes(k)]));
};

const freshReceipt = (blocked: string[], generatedAt = '2026-10-13T18:00:00.000Z') =>
  signReceipt({ probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt, node: 'v24.18.0', capabilities: baseCaps(blocked), blocked } as ProbeReceipt);

function writeReceipt(receipt: ProbeReceipt) {
  const p = join(mkdtempSync(join(tmpdir(), 'ordu-probe-')), 'probe.json');
  writeFileSync(p, JSON.stringify(receipt, null, 2));
  return p;
}

// evidence/probe-latest.json `npm run probe` ile yeniden üretilir: sabit saat yerine
// receipt'in kendi generatedAt'ı kullanılır (negatif yaş = gelecek tarih → RED).
const nowOf = (path: string) => {
  const { generatedAt } = JSON.parse(readFileSync(path, 'utf8'));
  return () => new Date(Date.parse(generatedAt) + 3.6e6);
};

test('B02 gerçek receipt: blocked dolu → spawn FATAL (fail-closed, canlıya tek kurşun yok)', () => {
  const now = () => new Date(Date.parse('2026-10-13T19:00:00Z'));
  const receipt = loadVerifiedProbe(writeReceipt(freshReceipt(['cancelConfirm'])), { now });
  assert.ok(spawnBlockedReason(receipt)!.startsWith('capability-blocked:'));
  let touched = false;
  const trap: Transport = {
    async spawn() { touched = true; throw new Error('ULAŞILMAMALIYDI'); },
    async lookup() { touched = true; return 'UNKNOWN'; },
  };
  const a = new PaseoWorkerAdapter(receipt, trap, { ORDU_LIVE: '1' });
  return a.spawn({ dispatchKey: 'dk', attemptId: 'at', prompt: 'p' }).then((r) => {
    assert.equal(r.outcome, 'FATAL');
    assert.equal(touched, false, 'gate kapalıyken transporta dokunulamaz');
  });
});

test('receipt bütünlüğü: hash tahrifatı + bayatlık + iç tutarsızlık → yükleme RED', () => {
  const now = () => new Date(Date.parse('2026-10-13T19:00:00Z'));
  // tahrifat
  const tampered = { ...freshReceipt([]), node: 'v99.0.0' } as any; // hash yeniden hesaplanmadı
  const p1 = writeReceipt(tampered);
  assert.throws(() => loadVerifiedProbe(p1, { now }), /hash UYUŞMUYOR/);
  // bayat
  const p2 = writeReceipt(freshReceipt([], '2026-10-11T19:00:00Z'));
  assert.throws(() => loadVerifiedProbe(p2, { now }), /BAYAT/);
  // iç tutarsız: blocked listesi false yetenekle eşleşmesin
  const lying = signReceipt({ probe: 'ordu-v3/B00', schemaVersion: 1, generatedAt: '2026-10-13T18:00:00.000Z', node: 'v24.18.0', capabilities: baseCaps(['cancelConfirm']), blocked: [] } as unknown as ProbeReceipt);
  const p3 = writeReceipt(lying);
  assert.throws(() => loadVerifiedProbe(p3, { now }), /iç tutarsız/);
});

test('kapılar açık + ORDU_LIVE=1 → gerçek dispatch ucu: spawn OK → SESSION_BOUND; LIVE=1 yoksa FATAL', async () => {
  const receipt = freshReceipt([]);
  const transport: Transport = {
    calls: [] as string[],
    async spawn(o: any) { (this as any).calls.push(o.dispatchKey); return 'agent-77'; },
    async lookup() { return 'ALIVE'; },
  } as any;
  const noLive = new PaseoWorkerAdapter(receipt, transport, {});
  const r0 = await noLive.spawn({ dispatchKey: 'dk-1', attemptId: 'att-1', prompt: 'p' });
  assert.equal(r0.outcome, 'FATAL');
  assert.match((r0 as any).reason, /ORDU_LIVE/);

  // dispatcher üzerinden uçtan uca (hermetik): gate'i geçmiş adapter gerçek kuyruğu besler
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
  const live = new PaseoWorkerAdapter(receipt, transport, { ORDU_LIVE: '1' });
  const r = await processOutbox(db, live);
  assert.equal(r.result, 'bound');
  assert.equal((db.prepare("SELECT external_session_id FROM attempts WHERE id='att-1'").get() as any).external_session_id, 'agent-77');
});

// ---- evaluator ----
function evalRig(allowed: string[]) {
  const db = openStore();
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'h', 'r', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)')
    .run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), JSON.stringify({ allowedCommands: allowed }));
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-1','plan-1',1,'READY','ph',0,1,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1','n-1','tester','[]','READY')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`).run();
  commitCandidate(db, 'att-1', 1, H64('c'), 'core');
  return db;
}

const evDir = () => mkdtempSync(join(tmpdir(), 'ordu-ev-'));

test('A13 runtime: exit-0 + 0 test YETMEZ → FAIL; protocol PASS → GEÇERLİ kanıt', async () => {
  const db = evalRig(['npm test']);
  const zero: CommandRunner = async () => ({ exitCode: 0, stdout: 'hazırlık...\n{"tests":0,"failed":0}' });
  const r1 = await evaluateAttempt(db, { attemptId: 'att-1', presentedFence: 1, candidateHash: H64('c'), testCmd: 'npm test', repoDir: '.', runner: zero, evidenceDir: evDir(), actorId: 'evaluator' });
  assert.equal(r1.verdict, 'FAIL'); // exit 0'a rağmen — "exit-0 YETMEZ"
  const ok: CommandRunner = async () => ({ exitCode: 0, stdout: '{"tests":5,"failed":0}' });
  const r2 = await evaluateAttempt(db, { attemptId: 'att-1', presentedFence: 1, candidateHash: H64('c'), testCmd: 'npm test', repoDir: '.', runner: ok, evidenceDir: evDir(), actorId: 'evaluator' });
  assert.equal(r2.verdict, 'PASS');
  assert.equal((db.prepare('SELECT COUNT(*) c FROM evidence').get() as any).c, 2);
});

test('A13: protokole uymayan stdout → testCount 0 FAIL; runner patlarsa da KANIT düşer', async () => {
  const db = evalRig(['npm test']);
  const junk: CommandRunner = async () => ({ exitCode: 0, stdout: 'hepsi güzel! 🎉' });
  const r = await evaluateAttempt(db, { attemptId: 'att-1', presentedFence: 1, candidateHash: H64('c'), testCmd: 'npm test', repoDir: '.', runner: junk, evidenceDir: evDir(), actorId: 'evaluator' });
  assert.equal(r.verdict, 'FAIL');
  assert.equal(r.protocolParsed, false);
  const boom: CommandRunner = async () => { throw new Error('runner patladı'); };
  const r2 = await evaluateAttempt(db, { attemptId: 'att-1', presentedFence: 1, candidateHash: H64('c'), testCmd: 'npm test', repoDir: '.', runner: boom, evidenceDir: evDir(), actorId: 'evaluator' });
  assert.equal(r2.verdict, 'FAIL');
  assert.equal((db.prepare('SELECT COUNT(*) c FROM evidence').get() as any).c, 2);
});

test('M19/A11: allowlist dışı komut → RED ve runner\'a HİÇ ulaşmaz; plan donmamışsa da RED', async () => {
  let touched = false;
  const spy: CommandRunner = async () => { touched = true; return { exitCode: 0, stdout: '{}' }; };
  const db = evalRig(['npm test']);
  await assert.rejects(
    evaluateAttempt(db, { attemptId: 'att-1', presentedFence: 1, candidateHash: H64('c'), testCmd: "rm -rf /; echo 'model metni'", repoDir: '.', runner: spy, evidenceDir: evDir(), actorId: 'x' }),
    /allowlist/,
  );
  assert.equal(touched, false);
  const db2 = evalRig([] as string[]); // payload'da allowlist yok → rig zaten GateError atardı; boş plan:
  await assert.rejects(
    evaluateAttempt(db2, { attemptId: 'att-1', presentedFence: 1, candidateHash: H64('c'), testCmd: 'npm test', repoDir: '.', runner: spy, evidenceDir: evDir(), actorId: 'x' }),
    GateError,
  );
});

test('A36 zinciri: devir sonrası evaluator fence RED — kanıt defteri kirlenmez', async () => {
  const db = evalRig(['npm test']);
  takeLease(db, 'att-1', 'core-2', '2027-01-01T00:00:00Z'); // fence 1→2
  const ok: CommandRunner = async () => ({ exitCode: 0, stdout: '{"tests":9,"failed":0}' });
  await assert.rejects(
    evaluateAttempt(db, { attemptId: 'att-1', presentedFence: 1, candidateHash: H64('c'), testCmd: 'npm test', repoDir: '.', runner: ok, evidenceDir: evDir(), actorId: 'evaluator' }),
    /stale fence/,
  );
  assert.equal((db.prepare('SELECT COUNT(*) c FROM evidence').get() as any).c, 0);
});

test('gerçek-runner smoke: tmp fixture Node testi KOŞUR, PASS kanıtı yazılır', async () => {
  const dir = evDir();
  const fixture = join(dir, 'pass-fixture.js');
  writeFileSync(fixture, "console.log(JSON.stringify({tests:3,failed:0}));\n");
  const cmd = `"${process.execPath}" "${fixture}"`;
  const db = evalRig([cmd]);
  const realRunner: CommandRunner = async (c) => {
    try {
      const out = execSync(c, { encoding: 'utf8', shell: process.env.ComSpec ?? '/bin/sh' });
      return { exitCode: 0, stdout: out };
    } catch (e: any) {
      return { exitCode: e.status ?? 1, stdout: String(e.stdout ?? '') };
    }
  };
  const r = await evaluateAttempt(db, { attemptId: 'att-1', presentedFence: 1, candidateHash: H64('c'), testCmd: cmd, repoDir: dir, runner: realRunner, evidenceDir: dir, actorId: 'evaluator' });
  assert.equal(r.verdict, 'PASS');
  assert.equal(r.tests, 3);
});
