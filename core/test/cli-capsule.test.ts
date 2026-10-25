// CLI kapsul yasam dongusu (hermetik): capsule -> approve -> resume -> dispatch -> decide.
// Gercek paseo/model cagrisi YOK; donmus aday + PASS kanit dogrudan store kancalariyla
// kurulur (cli.test.ts deseni). Akis sirasi e2e-s11 ile ayni tutulur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { cliMain } from '../src/cli.ts';
import { openStore, commitCandidate, recordEvidence } from '../src/store.ts';
import { settleNodeOutcome } from '../src/supervisor.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const COMMIT = sha('capsule-cli-test-commit');

function deps() {
  return {
    dbPath: join(mkdtempSync(join(tmpdir(), 'ordu-cli-capsule-')), 'ordu.sqlite'),
    env: {}, probePath: join(root, 'evidence', 'probe-latest.json'),
  };
}

// dispatch edilmis run'i ACCEPTED adaya kadar gotur (CLI disi kurulum; e2e-s11'in store yarisi)
function freezeAcceptedCandidate(dbPath: string, runId: string, attemptId: string) {
  const db = openStore(dbPath);
  const candidateHash = sha('candidate-' + runId);
  commitCandidate(db, attemptId, 1, candidateHash, 'worker-fake');
  recordEvidence(db, {
    attemptId, presentedFence: 1, artifactHash: sha('art-' + runId), storageRef: 'mem://' + runId, bytes: 1,
    environmentHash: sha('env-' + runId), evaluatorHash: sha('eval-' + runId),
    exitCode: 0, verdict: 'PASS', testCount: 1, actorId: 'evaluator-fake',
  });
  assert.equal(settleNodeOutcome(db, attemptId, 'PASS').status, 'NODE_DONE');
  db.close();
  return candidateHash;
}

test('kapsul akisi: capsule -> approve -> dispatch -> decide --approve (run ACCEPTED)', async () => {
  const d = deps();
  // 1) capsule: tek node'lu plan + run; cikti {runId, planHash, nodeId}
  let r = await cliMain(['capsule', '--goal', 'tek kapsul cli', '--repo', 'repo-local', '--commit', COMMIT, '--allow', 'npm test'], d);
  assert.equal(r.code, 0);
  const out = r.out as any;
  assert.match(out.runId, /^run-/);
  assert.match(out.planHash, /^[0-9a-f]{64}$/);
  assert.equal(out.nodeId, 'n1');

  // 2) onaysiz dispatch (A03 negatif): hazir node yok, hicbir sey outbox'a dusmez
  r = await cliMain(['dispatch', '--run', out.runId], d);
  assert.equal(r.code, 0);
  assert.deepEqual((r.out as any).dispatched, []);

  // 3) approve: yanlis plan-hash RED, dogru hash OK
  r = await cliMain(['approve', '--run', out.runId, '--plan-hash', sha('yanlis-plan')], d);
  assert.equal(r.code, 1);
  r = await cliMain(['approve', '--run', out.runId, '--plan-hash', out.planHash], d);
  assert.equal(r.code, 0);
  assert.equal((r.out as any).approved, true);
  assert.equal((r.out as any).actor, 'insan:cli');

  // 3b) global STOP latch kapali baslar (A16); e2e-s11'in 'e2e acilis' karsiligi = insan 'resume' komutu
  r = await cliMain(['resume', '--confirm', 'I understand the risk'], d);
  assert.equal(r.code, 0);

  // 4) dispatch: tek node outbox'a duser
  r = await cliMain(['dispatch', '--run', out.runId], d);
  assert.equal(r.code, 0);
  const dispatched = (r.out as any).dispatched;
  assert.equal(dispatched.length, 1);
  assert.equal(dispatched[0].nodeId, 'n1');
  assert.equal(dispatched[0].status, 'DISPATCHED');
  const attemptId = dispatched[0].attemptId as string;

  // 5) onaysiz decide (negatif): ACCEPTED donmus aday yokken RED
  r = await cliMain(['decide', '--run', out.runId, '--approve'], d);
  assert.equal(r.code, 1);
  assert.match(String(r.out), /ACCEPTED/);

  // 6) aday dondur + PASS kanit + node DONE -> decide --approve: teslim zinciri ACCEPT
  freezeAcceptedCandidate(d.dbPath, out.runId, attemptId);
  r = await cliMain(['decide', '--run', out.runId, '--approve'], d);
  assert.equal(r.code, 0);
  assert.equal((r.out as any).status, 'ACCEPTED');
  assert.equal((r.out as any).runState, 'ACCEPTED');
  assert.ok((r.out as any).approvalId);
});

test('decide --reject: teslim talebi reddedilir, run ACCEPTED olmaz', async () => {
  const d = deps();
  let r = await cliMain(['capsule', '--goal', 'ret akisi', '--repo', 'repo-local', '--commit', COMMIT], d);
  assert.equal(r.code, 0);
  const out = r.out as any;
  r = await cliMain(['approve', '--run', out.runId, '--plan-hash', out.planHash], d);
  assert.equal(r.code, 0);
  r = await cliMain(['resume', '--confirm', 'I understand the risk'], d);
  assert.equal(r.code, 0);
  r = await cliMain(['dispatch', '--run', out.runId], d);
  const attemptId = (r.out as any).dispatched[0].attemptId as string;
  freezeAcceptedCandidate(d.dbPath, out.runId, attemptId);
  r = await cliMain(['decide', '--run', out.runId, '--reject'], d);
  assert.equal(r.code, 0);
  assert.equal((r.out as any).decision, 'REJECTED');
  assert.equal((r.out as any).status, 'NOT_APPROVED');
  assert.notEqual((r.out as any).runState, 'ACCEPTED');
});

test('negatifler: bozuk commit, eksik flag, olmayan run, cift karar', async () => {
  const d = deps();
  let r = await cliMain(['capsule', '--goal', 'g', '--repo', 'r', '--commit', 'abc123'], d); // 64-hex degil
  assert.equal(r.code, 1);
  r = await cliMain(['capsule', '--repo', 'r', '--commit', COMMIT], d); // --goal yok
  assert.equal(r.code, 1);
  r = await cliMain(['approve', '--run', 'run-yok', '--plan-hash', COMMIT], d);
  assert.equal(r.code, 1);
  r = await cliMain(['dispatch', '--run', 'run-yok'], d);
  assert.equal(r.code, 1);
  r = await cliMain(['decide', '--run', 'run-yok', '--approve', '--reject'], d); // cift karar RED
  assert.equal(r.code, 1);
  r = await cliMain(['decide', '--run', 'run-yok'], d); // karar flag'i yok
  assert.equal(r.code, 1);

  // A16: STOP latch acikken (resume yok) onayli run bile dispatch RED
  r = await cliMain(['capsule', '--goal', 'stoplu', '--repo', 'r', '--commit', COMMIT], d);
  assert.equal(r.code, 0);
  const stopOut = r.out as any;
  r = await cliMain(['approve', '--run', stopOut.runId, '--plan-hash', stopOut.planHash], d);
  assert.equal(r.code, 0);
  r = await cliMain(['dispatch', '--run', stopOut.runId], d);
  assert.equal(r.code, 1);
  assert.match(String(r.out), /global_stop/);
});
