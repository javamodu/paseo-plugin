// R3 (ADR-R3) — sinirli vekalet grant modeli hermetik kaniti: 004 migration, createGrant
// kapilari, TEK vekil karar kapisi (assertGrantAllows + decideApproval ayni tx), buyutemezlik
// 4 katmani, insan/vekil audit ayrimi, revoke in-flight etkisi (K13-01 kosul 5), SS16 receipt bagi.
// Hermetik: sahte adapter; canli Paseo/LLM cagrisi YOK. Yeni Command.kind/Event.type YOK.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { openStore, setGlobalStop, commitCandidate, recordEvidence, GateError } from '../src/store.ts';
import {
  createRunPlan, approvePlan, dispatchNode, ensureStartCommand, settleNodeOutcome,
  requestAcceptance, decideApproval, requestGrantApproval, decideWithGrant,
} from '../src/supervisor.ts';
import {
  createGrant, revokeGrant, assertGrantAllows, assertGrantDispatchable,
  assertManifestAmendNarrows, vekilActorOf, GRANT_ACTION_TYPES, QUESTION_TYPES,
  type GrantInput,
} from '../src/grants.ts';
import { computeHeadlineKpis } from '../src/telemetry.ts';
import { verifyReceiptLinks, type VerificationReceipt, type ReceiptLinkContext } from '../src/receipt-link.ts';
import { requestCancel } from '../src/adapter-contract.ts';
import { sampleHandoff } from '../src/handoff.ts';

const here = dirname(fileURLToPath(import.meta.url));
const dbDir = join(here, '..', 'database');
const H64 = (c: string) => c.repeat(64).slice(0, 64);
const COMMIT = H64('c');
const FUTURE = '2099-01-01T00:00:00Z';

function rig(runId = 'run-1') {
  const db = openStore();
  setGlobalStop(db, false, 'op', 'kurulum');
  const planHash = createRunPlan(db, {
    capsuleId: 'cap-' + runId, goal: 'r3', repoId: 'repo', sourceCommit: COMMIT,
    runId, planId: 'plan-' + runId, profileHash: H64('p'),
    nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 5,
  }).planHash;
  approvePlan(db, runId, planHash, 'human');
  return { db, planHash };
}

// tum node'lar DONE + PASS kanitli ACCEPTED aday -> ACCEPT_RESULT PENDING onayi
function acceptanceRig() {
  const { db, planHash } = rig();
  const startCmd = ensureStartCommand(db, 'run-1', planHash, 'operator');
  const d = dispatchNode(db, 'run-1', 'n1', { tokens: 100, startCommandId: startCmd, dispatchKey: 'k1', handoff: sampleHandoff('n1') });
  if (d.status !== 'DISPATCHED') throw new Error('dispatch bekleniyordu');
  commitCandidate(db, d.attemptId, 1, H64('a'), 'worker');
  recordEvidence(db, {
    attemptId: d.attemptId, presentedFence: 1, artifactHash: H64('e'), storageRef: 's3://k1', bytes: 8,
    environmentHash: H64('f'), evaluatorHash: H64('h'), exitCode: 0, verdict: 'PASS', testCount: 4, actorId: 'evaluator',
  });
  settleNodeOutcome(db, d.attemptId, 'PASS');
  const req = requestAcceptance(db, 'run-1', 'human');
  return { db, approvalId: req.approvalId };
}

const baseGrant = (runId: string, over: Partial<GrantInput> = {}): GrantInput => ({
  runId,
  actions: ['ANSWER_QUESTION'],
  questionTypes: ['onar'],
  expiresAt: FUTURE,
  ...over,
});

const grantRow = (db: DatabaseSync, id: string) => db.prepare('SELECT * FROM grants WHERE id=?').get(id) as any;

// ---- Grup 1: migration (user_version=4, idempotent kapi, geriye-uyum, byte-hash kilitleri) ----
test('004 migration: temiz DB user_version=4; grants tablosu ADR kolon setiyle; ikinci acilis no-op', () => {
  const p = join(mkdtempSync(join(tmpdir(), 'ordu-r3-mig-')), 'ordu.sqlite');
  const db = openStore(p);
  assert.equal((db.prepare('PRAGMA user_version').get() as any).user_version, 4);
  const cols = (db.prepare('PRAGMA table_info(grants)').all() as any[]).map((c) => c.name);
  for (const col of ['id', 'run_id', 'created_by', 'created_at', 'actions_json', 'question_types_json',
    'fallback_models_json', 'extra_retry_budget', 'reassign_allowed', 'manifest_amend_scope_json',
    'token_budget', 'expires_at', 'forbidden_json', 'state', 'revoked_by', 'revoked_at']) {
    assert.ok(cols.includes(col), 'kolon yok: ' + col);
  }
  assert.ok((db.prepare('PRAGMA table_info(attempts)').all() as any[]).some((c) => c.name === 'grant_id'));
  assert.ok((db.prepare('PRAGMA table_info(approvals)').all() as any[]).some((c) => c.name === 'grant_id'));
  const triggers = (db.prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'grants_%'").all() as any[]).map((t) => t.name);
  for (const t of ['grants_authority_immutable', 'grants_retry_budget_monotonic', 'grants_token_budget_monotonic', 'grants_state_guard', 'grants_revoke_immutable']) {
    assert.ok(triggers.includes(t), 'trigger yok: ' + t);
  }
  db.close();
  const db2 = openStore(p); // ikinci acilis no-op (user_version kapisi)
  assert.equal((db2.prepare('PRAGMA user_version').get() as any).user_version, 4);
  db2.close();
});

test('004 migration: 001+002+003 fixture DB acilinca 004 uygulanir; mevcut attempts/approvals grant_id=NULL ile bozulmadan acilir', () => {
  const p = join(mkdtempSync(join(tmpdir(), 'ordu-r3-fixture-')), 'ordu.sqlite');
  const raw = new DatabaseSync(p);
  raw.exec(readFileSync(join(dbDir, '001-initial.sql'), 'utf8'));
  raw.exec(readFileSync(join(dbDir, '002-hardening.sql'), 'utf8'));
  raw.exec(readFileSync(join(dbDir, '003-role-model.sql'), 'utf8'));
  raw.exec('PRAGMA user_version=3;');
  raw.prepare(`INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES('c0','g','r','${COMMIT}')`).run();
  raw.prepare(`INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES('p0','c0',1,'${H64('b')}','${H64('e')}','${H64('f')}','{}')`).run();
  raw.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at) VALUES('r0','p0',1,'READY','ph',0,1,3,100,0,0,'2099-01-01T00:00:00Z')`).run();
  raw.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('r0','n0','coder','[]','PENDING')`).run();
  raw.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('a0','r0','n0',1,'RUNNING','ih',1)`).run();
  raw.prepare(`INSERT INTO approvals(id,run_id,plan_hash,candidate_hash,policy_hash,expected_run_version,action,expires_at,decision) VALUES('ap0','r0','ph',NULL,'pol',1,'EXTEND_BUDGET','2099-01-01 00:00:00','PENDING')`).run();
  raw.close();
  const db = openStore(p); // 004 uygulanmali
  assert.equal((db.prepare('PRAGMA user_version').get() as any).user_version, 4);
  assert.equal((db.prepare("SELECT grant_id FROM attempts WHERE id='a0'").get() as any).grant_id, null);
  assert.equal((db.prepare("SELECT grant_id FROM approvals WHERE id='ap0'").get() as any).grant_id, null);
  assert.equal((db.prepare('SELECT COUNT(*) c FROM grants').get() as any).c, 0);
  db.close();
});

test('004 migration: 001/002/003 SQL dosyalari byte-degismez (hash kilidi)', () => {
  const h = (f: string) => createHash('sha256').update(readFileSync(join(dbDir, f))).digest('hex');
  assert.equal(h('001-initial.sql'), '06716b653e94931b8c1b9ad1be80559fc727987a0c923e5a98d8ab2083d0d61f');
  assert.equal(h('002-hardening.sql'), '30b9247817ea4c3f64e94c3d3ce768d085a1fe0969dfd93abeda5709fe5572ce');
  assert.equal(h('003-role-model.sql'), '9a0c31a5810c86c15548d67a9593020609d788e5d30997a7a5714039180d35e6');
});

// ---- Grup 2: createGrant kapilari ----
test('createGrant: insan actor ile kabul; satir ACTIVE, expires normalize, created_by insan', () => {
  const { db } = rig();
  const { grantId } = createGrant(db, baseGrant('run-1'), 'insan:test');
  const g = grantRow(db, grantId);
  assert.equal(g.state, 'ACTIVE');
  assert.equal(g.created_by, 'insan:test');
  assert.equal(g.expires_at, '2099-01-01 00:00:00'); // datetime() normalize (U7 kiyasiyla uyumlu)
  assert.equal(g.run_id, 'run-1');
  assert.deepEqual(JSON.parse(g.actions_json), ['ANSWER_QUESTION']);
});

test("createGrant: 'vekil:%' actor RED (GateError) + DB CHECK ikinci katman (cift katman kaniti)", () => {
  const { db } = rig();
  assert.throws(() => createGrant(db, baseGrant('run-1'), 'vekil:grt-abc'), GateError);
  assert.throws(() => db.prepare(
    `INSERT INTO grants(id,run_id,created_by,created_at,actions_json,question_types_json,fallback_models_json,extra_retry_budget,reassign_allowed,manifest_amend_scope_json,token_budget,expires_at,forbidden_json,state)
     VALUES('grt-hack','run-1','vekil:grt-abc',datetime('now'),'[]','[]','[]',0,0,'[]',0,'2099-01-01 00:00:00','[]','ACTIVE')`,
  ).run(), /CHECK/);
});

test('createGrant: expiresAt yok/bos RED; gecmis expiresAt RED (suresiz/olu grant YOK)', () => {
  const { db } = rig();
  assert.throws(() => createGrant(db, baseGrant('run-1', { expiresAt: '' }), 'insan:test'), GateError);
  assert.throws(() => createGrant(db, baseGrant('run-1', { expiresAt: '2000-01-01T00:00:00Z' }), 'insan:test'), GateError);
});

test('createGrant: merge/deploy/harcama/kapsam-genisletme tipleri actions icine SOKULAMAZ (kapali kume)', () => {
  const { db } = rig();
  for (const banned of ['MERGE', 'DEPLOY', 'SPEND', 'SCOPE_EXPAND', 'ACCEPT_RESULT']) {
    assert.throws(() => createGrant(db, baseGrant('run-1', { actions: [banned] }), 'insan:test'), GateError, banned);
  }
  assert.throws(() => createGrant(db, baseGrant('run-1', { actions: ['ANSWER_QUESTION', 'MERGE'] }), 'insan:test'), GateError);
  assert.throws(() => createGrant(db, baseGrant('run-1', { actions: [] }), 'insan:test'), GateError);
});

test('createGrant: fallback_models F6.5 registry disi RED; registry alt kumesi kabul', () => {
  const { db } = rig();
  assert.throws(() => createGrant(db, baseGrant('run-1', { actions: ['FALLBACK_MODEL'], fallbackModels: ['codex/halusinasyon-9'] }), 'insan:test'), GateError);
  assert.throws(() => createGrant(db, baseGrant('run-1', { actions: ['FALLBACK_MODEL'], fallbackModels: ['qwen/max'] }), 'insan:test'), GateError);
  assert.throws(() => createGrant(db, baseGrant('run-1', { actions: ['FALLBACK_MODEL'], fallbackModels: [] }), 'insan:test'), GateError);
  assert.doesNotThrow(() => createGrant(db, baseGrant('run-1', { actions: ['FALLBACK_MODEL'], fallbackModels: ['codex/gpt-5.4'] }), 'insan:test'));
});

test('createGrant: run yok RED; soru tipi kapali kume disi RED; EXTRA_RETRY 0 butce RED; 5 tip + 9 soru turu sabitleri', () => {
  const { db } = rig();
  assert.throws(() => createGrant(db, baseGrant('run-yok'), 'insan:test'), GateError);
  assert.throws(() => createGrant(db, baseGrant('run-1', { questionTypes: ['serbest-soru'] }), 'insan:test'), GateError);
  assert.throws(() => createGrant(db, baseGrant('run-1', { actions: ['EXTRA_RETRY'], extraRetryBudget: 0 }), 'insan:test'), GateError);
  assert.equal(GRANT_ACTION_TYPES.length, 5);
  assert.equal(QUESTION_TYPES.length, 9);
});

// ---- Grup 3: vekil karar kapisi (TEK kapi; approvals actor_id/grant_id; U7 vekil eslenigi) ----
test("vekil karar: gecerli grant + izinli action -> approvals actor_id='vekil:<grantId>' + grant_id dolu + APPROVAL_DECIDED", () => {
  const { db } = rig();
  const { grantId } = createGrant(db, baseGrant('run-1'), 'insan:test');
  const res = decideWithGrant(db, { runId: 'run-1', grantId, action: 'ANSWER_QUESTION', payload: { questionType: 'onar' } });
  assert.equal(res.status, 'APPROVED');
  const ap = db.prepare('SELECT * FROM approvals WHERE id=?').get(res.approvalId) as any;
  assert.equal(ap.actor_id, 'vekil:' + grantId);
  assert.equal(ap.grant_id, grantId);
  assert.equal(ap.action, 'ANSWER_QUESTION');
  assert.equal(ap.decision, 'APPROVED');
  const ev = db.prepare("SELECT * FROM events WHERE type='APPROVAL_DECIDED' ORDER BY sequence DESC LIMIT 1").get() as any;
  assert.equal(ev.actor_id, 'vekil:' + grantId);
});

test('vekil karar: izinsiz action RED; soru tipi kapsam disi RED', () => {
  const { db } = rig();
  const { grantId } = createGrant(db, baseGrant('run-1'), 'insan:test');
  assert.throws(() => decideWithGrant(db, { runId: 'run-1', grantId, action: 'EXTRA_RETRY' }), GateError);
  assert.throws(() => decideWithGrant(db, { runId: 'run-1', grantId, action: 'ANSWER_QUESTION', payload: { questionType: 'plateau' } }), GateError);
});

test('vekil karar: suresi dolmus grant karara baglanamaz (U7 vekil eslenigi) + state EXPIRED islenir', () => {
  const { db } = rig();
  db.prepare(
    `INSERT INTO grants(id,run_id,created_by,created_at,actions_json,question_types_json,fallback_models_json,extra_retry_budget,reassign_allowed,manifest_amend_scope_json,token_budget,expires_at,forbidden_json,state)
     VALUES('grt-exp','run-1','insan:test','2026-01-01 00:00:00','["ANSWER_QUESTION"]','["onar"]','[]',0,0,'[]',0,'2000-01-01 00:00:00','[]','ACTIVE')`,
  ).run();
  assert.throws(() => decideWithGrant(db, { runId: 'run-1', grantId: 'grt-exp', action: 'ANSWER_QUESTION', payload: { questionType: 'onar' } }), GateError);
  assert.equal(grantRow(db, 'grt-exp').state, 'EXPIRED'); // zaman fonksiyonuyla set edildi
});

test('vekil karar: REVOKED grant RED; token_budget yetersiz RED', () => {
  const { db } = rig();
  const { grantId } = createGrant(db, baseGrant('run-1', { actions: ['EXTRA_RETRY'], extraRetryBudget: 2, tokenBudget: 100 }), 'insan:test');
  assert.throws(() => decideWithGrant(db, { runId: 'run-1', grantId, action: 'EXTRA_RETRY', payload: { tokens: 500 } }), /token_budget yetersiz/);
  revokeGrant(db, grantId, 'insan:admin');
  assert.throws(() => decideWithGrant(db, { runId: 'run-1', grantId, action: 'EXTRA_RETRY', payload: { tokens: 50 } }), GateError);
});

test('vekil ACCEPT_RESULT baglayamaz (teslim kabulu grant ile HIC verilemez); insan yolu aynen calisir', () => {
  const { db, approvalId } = acceptanceRig();
  const { grantId } = createGrant(db, baseGrant('run-1'), 'insan:test');
  assert.throws(() => decideApproval(db, approvalId, 'APPROVED', vekilActorOf(grantId), 1), GateError);
  const res = decideApproval(db, approvalId, 'APPROVED', 'insan:test', 1);
  assert.equal(res.status, 'ACCEPTED');
  assert.equal((db.prepare('SELECT grant_id FROM approvals WHERE id=?').get(approvalId) as any).grant_id, null);
});

// ---- Grup 4: buyutemezlik — 4 deterministik katman ----
test('buyutemez-b: yetki alanlari UPDATE trigger RED (actions/expires/fallback/forbidden)', () => {
  const { db } = rig();
  const { grantId } = createGrant(db, baseGrant('run-1'), 'insan:test');
  assert.throws(() => db.prepare(`UPDATE grants SET actions_json='["ANSWER_QUESTION","EXTRA_RETRY"]' WHERE id=?`).run(grantId), /grant_authority_immutable/);
  assert.throws(() => db.prepare(`UPDATE grants SET expires_at='2999-01-01 00:00:00' WHERE id=?`).run(grantId), /grant_authority_immutable/);
  assert.throws(() => db.prepare(`UPDATE grants SET fallback_models_json='["codex/gpt-5.4"]' WHERE id=?`).run(grantId), /grant_authority_immutable/);
  assert.throws(() => db.prepare(`UPDATE grants SET created_by='insan:baska' WHERE id=?`).run(grantId), /grant_authority_immutable/);
});

test('buyutemez-d: extra_retry_budget artirma/esit RED, azaltma OK; token_budget artirma RED', () => {
  const { db } = rig();
  const { grantId } = createGrant(db, baseGrant('run-1', { actions: ['EXTRA_RETRY'], extraRetryBudget: 3, tokenBudget: 100 }), 'insan:test');
  assert.throws(() => db.prepare('UPDATE grants SET extra_retry_budget=4 WHERE id=?').run(grantId), /grant_retry_budget_monotonic/);
  assert.throws(() => db.prepare('UPDATE grants SET extra_retry_budget=3 WHERE id=?').run(grantId), /grant_retry_budget_monotonic/);
  db.prepare('UPDATE grants SET extra_retry_budget=2 WHERE id=?').run(grantId); // azaltma serbest
  assert.equal(grantRow(db, grantId).extra_retry_budget, 2);
  assert.throws(() => db.prepare('UPDATE grants SET token_budget=101 WHERE id=?').run(grantId), /grant_token_budget_monotonic/);
});

test('buyutemez: REVOKED->ACTIVE flip RED; revoke damgasi oynanamaz; vekil revoke edemez; vekil createGrant RED', () => {
  const { db } = rig();
  const { grantId } = createGrant(db, baseGrant('run-1'), 'insan:test');
  revokeGrant(db, grantId, 'insan:admin');
  assert.throws(() => db.prepare(`UPDATE grants SET state='ACTIVE' WHERE id=?`).run(grantId), /grant_state_transition_forbidden/);
  assert.throws(() => db.prepare(`UPDATE grants SET revoked_by='insan:baska' WHERE id=?`).run(grantId), /grant_revoke_immutable/);
  assert.throws(() => revokeGrant(db, grantId, 'insan:admin'), GateError); // zaten sonlanmis
  const g2 = createGrant(db, baseGrant('run-1'), 'insan:test');
  assert.throws(() => revokeGrant(db, g2.grantId, 'vekil:grt-x'), GateError);
  assert.throws(() => createGrant(db, baseGrant('run-1'), vekilActorOf(g2.grantId)), GateError);
});

test('buyutemez-c: MANIFEST_AMEND yuklemcisi — genisletmeler RED, daraltma/not GECER', () => {
  const { db } = rig();
  const { grantId } = createGrant(db, baseGrant('run-1', { actions: ['MANIFEST_AMEND'], manifestAmendScope: ['kapsam-daraltma'] }), 'insan:test');
  const decide = (amend: any) => decideWithGrant(db, { runId: 'run-1', grantId, action: 'MANIFEST_AMEND', payload: { amend } });
  assert.throws(() => decide({ before: { nodes: ['n1'] }, after: { nodes: ['n1', 'n2'] } }), /yeni node/);
  assert.throws(() => decide({ before: { deps: { n1: [] } }, after: { deps: { n1: ['x'] } } }), /genislemesi YOK/);
  assert.throws(() => decide({ before: { budgets: { max: 100 } }, after: { budgets: { max: 200 } } }), /artisi YOK/);
  assert.throws(() => decide({ before: { dirs: ['a'] }, after: { dirs: ['a', 'b'] } }), /dizin genislemesi YOK/);
  assert.throws(() => decide({ before: { providerModel: 'codex/kimi-K3' }, after: { providerModel: 'codex/halusinasyon' } }), GateError);
  // daraltma GECER: node cikarma + butce dusurme
  assert.equal(decide({ before: { nodes: ['n1', 'n2'], budgets: { max: 100 } }, after: { nodes: ['n1'], budgets: { max: 50 } } }).status, 'APPROVED');
  // provider/model kapali kume icinde degisim RED degil
  assert.equal(decide({ before: { providerModel: 'codex/kimi-K3' }, after: { providerModel: 'codex/gpt-5.4' } }).status, 'APPROVED');
  // sinif disi: scope'ta 'not-duzeltme' olmayan grant not degistiremez; yapisal degisiklik de sinif ister
  const g2 = createGrant(db, baseGrant('run-1', { actions: ['MANIFEST_AMEND'], manifestAmendScope: ['not-duzeltme'] }), 'insan:test');
  const decide2 = (amend: any) => decideWithGrant(db, { runId: 'run-1', grantId: g2.grantId, action: 'MANIFEST_AMEND', payload: { amend } });
  assert.throws(() => decide2({ before: { nodes: ['n1', 'n2'] }, after: { nodes: ['n1'] } }), /kapsam-daraltma sinifi disinda/);
  assert.equal(decide2({ before: { notes: 'eski' }, after: { notes: 'yeni' } }).status, 'APPROVED');
  // dogrudan yuklemce de ayni kural: not-duzeltme sinifi not degisimini gecirir
  assert.doesNotThrow(() => assertManifestAmendNarrows(['not-duzeltme'], { before: { notes: 'a' }, after: { notes: 'b' } }));
});

test('buyutemez: FALLBACK_MODEL liste-disi RED (listedeyse GECER); EXTRA_RETRY budget=0\'da RED (atomik tuketim)', () => {
  const { db } = rig();
  const { grantId } = createGrant(db, baseGrant('run-1', { actions: ['FALLBACK_MODEL'], fallbackModels: ['codex/gpt-5.4'] }), 'insan:test');
  assert.throws(() => decideWithGrant(db, { runId: 'run-1', grantId, action: 'FALLBACK_MODEL', payload: { model: 'codex/kimi-K3' } }), GateError);
  assert.equal(decideWithGrant(db, { runId: 'run-1', grantId, action: 'FALLBACK_MODEL', payload: { model: 'codex/gpt-5.4' } }).status, 'APPROVED');
  const g2 = createGrant(db, baseGrant('run-1', { actions: ['EXTRA_RETRY'], extraRetryBudget: 1, tokenBudget: 0 }), 'insan:test');
  assert.equal(decideWithGrant(db, { runId: 'run-1', grantId: g2.grantId, action: 'EXTRA_RETRY' }).status, 'APPROVED');
  assert.equal(grantRow(db, g2.grantId).extra_retry_budget, 0); // atomik azaldi
  assert.throws(() => decideWithGrant(db, { runId: 'run-1', grantId: g2.grantId, action: 'EXTRA_RETRY' }), GateError); // 0'da RED
});

test('buyutemez: token_budget atomik TUKENIR (karar aninda, decideApproval ile ayni tx)', () => {
  const { db } = rig();
  const { grantId } = createGrant(db, baseGrant('run-1', { actions: ['EXTRA_RETRY'], extraRetryBudget: 5, tokenBudget: 100 }), 'insan:test');
  decideWithGrant(db, { runId: 'run-1', grantId, action: 'EXTRA_RETRY', payload: { tokens: 60 } });
  assert.equal(grantRow(db, grantId).token_budget, 40);
  assert.throws(() => decideWithGrant(db, { runId: 'run-1', grantId, action: 'EXTRA_RETRY', payload: { tokens: 41 } }), GateError);
  assert.equal(grantRow(db, grantId).token_budget, 40); // RED yakmadi
});

// ---- Grup 5: audit ayrimi (cift katman: actor_id deseni + yapisal grant_id) ----
test('audit: ayni run\'da insan + vekil kararlari grant_id IS NULL/IS NOT NULL ile birebir ayrilir; telemetry ayrismis', () => {
  const { db, approvalId } = acceptanceRig();
  const { grantId } = createGrant(db, baseGrant('run-1'), 'insan:test');
  decideWithGrant(db, { runId: 'run-1', grantId, action: 'ANSWER_QUESTION', payload: { questionType: 'onar' } });
  decideApproval(db, approvalId, 'APPROVED', 'insan:test', 1);
  const human = db.prepare("SELECT COUNT(*) c FROM approvals WHERE grant_id IS NULL AND decision<>'PENDING'").get() as any;
  const vekil = db.prepare("SELECT COUNT(*) c FROM approvals WHERE grant_id IS NOT NULL AND decision<>'PENDING'").get() as any;
  assert.equal(human.c, 1);
  assert.equal(vekil.c, 1);
  const actors = (db.prepare("SELECT DISTINCT actor_id a FROM approvals WHERE decision<>'PENDING'").all() as any[]).map((r) => r.a).sort();
  assert.deepEqual(actors, ['insan:test', 'vekil:' + grantId]);
  assert.equal(computeHeadlineKpis(db).vekilDecisions, 1);
});

// ---- Grup 6: revoke davranisi (K13-01 kosul 5) ----
test('revoke: in-flight RUNNING attempt cancel patikasina duser (fencing bump, slot SERBEST KALIR); yeni vekil islemi RED', async () => {
  const { db, planHash } = rig();
  const { grantId } = createGrant(db, baseGrant('run-1', { actions: ['EXTRA_RETRY'], extraRetryBudget: 3, tokenBudget: 1000 }), 'insan:test');
  const startCmd = ensureStartCommand(db, 'run-1', planHash, 'operator');
  const d = dispatchNode(db, 'run-1', 'n1', { tokens: 100, startCommandId: startCmd, dispatchKey: 'k1', handoff: sampleHandoff('n1'), grantId });
  if (d.status !== 'DISPATCHED') throw new Error('dispatch bekleniyordu');
  assert.equal((db.prepare('SELECT grant_id FROM attempts WHERE id=?').get(d.attemptId) as any).grant_id, grantId);

  const r = revokeGrant(db, grantId, 'insan:admin');
  assert.equal(r.inFlightCancelRequested, 1);
  const a = db.prepare('SELECT state, fencing_token FROM attempts WHERE id=?').get(d.attemptId) as any;
  assert.equal(a.state, 'CANCEL_REQUESTED'); // kor kill YOK — mevcut iptal patikasi
  assert.equal(a.fencing_token, 2); // fencing bump
  assert.equal((db.prepare('SELECT state FROM reservations WHERE attempt_id=?').get(d.attemptId) as any).state, 'ACTIVE'); // slot serbest KALIR
  const ev = db.prepare("SELECT payload_json FROM events WHERE type='CANCEL_REQUESTED' AND attempt_id=?").get(d.attemptId) as any;
  assert.ok(ev.payload_json.includes('grant-revoke'));

  // revoke sonrasi o grant ile YENI vekil islemi RED (karar + istek + dispatch kapisi)
  assert.throws(() => decideWithGrant(db, { runId: 'run-1', grantId, action: 'EXTRA_RETRY' }), GateError);
  assert.throws(() => requestGrantApproval(db, { runId: 'run-1', grantId, action: 'EXTRA_RETRY' }), GateError);
  assert.throws(() => assertGrantDispatchable(db, grantId, 'run-1'), GateError);

  // in-flight: iptal dogrulanamazsa slot TUTULUR (mevcut requestCancel/UNKNOWN makinasi, yeni mekanizma YOK)
  const res = await requestCancel(db, { spawn: async () => ({ outcome: 'OK' as const, externalSessionId: 's' }), lookup: async () => 'UNKNOWN' as const, cancel: async () => 'UNKNOWN' as const }, d.attemptId, 'revoke-takip');
  assert.equal(res.status, 'CANCEL_UNCONFIRMED');
  assert.equal((db.prepare('SELECT state FROM reservations WHERE attempt_id=?').get(d.attemptId) as any).state, 'ACTIVE');
});

test('revoke: grant PENDING approval\'i vekilce baglanamaz ama insan baglayabilir (otorite sahibine doner)', () => {
  const { db } = rig();
  const { grantId } = createGrant(db, baseGrant('run-1'), 'insan:test');
  const { approvalId } = requestGrantApproval(db, { runId: 'run-1', grantId, action: 'ANSWER_QUESTION', payload: { questionType: 'onar' } });
  const ap = db.prepare('SELECT * FROM approvals WHERE id=?').get(approvalId) as any;
  assert.equal(ap.decision, 'PENDING');
  assert.equal(ap.grant_id, grantId);
  revokeGrant(db, grantId, 'insan:admin');
  assert.throws(() => decideApproval(db, approvalId, 'APPROVED', vekilActorOf(grantId), 1, { questionType: 'onar' }), GateError);
  const res = decideApproval(db, approvalId, 'APPROVED', 'insan:test', 1); // insan yolu grant kapisina girmez
  assert.equal(res.status, 'APPROVED');
  assert.equal((db.prepare('SELECT actor_id FROM approvals WHERE id=?').get(approvalId) as any).actor_id, 'insan:test');
});

test('dispatch kapisi: grant ile yeni attempt grant_id tasir; baska run granti RED; revoke sonrasi grant dispatch RED', () => {
  const { db, planHash } = rig();
  const { db: db2 } = rig('run-2');
  const { grantId } = createGrant(db, baseGrant('run-1', { actions: ['EXTRA_RETRY'], extraRetryBudget: 1, tokenBudget: 100 }), 'insan:test');
  const startCmd = ensureStartCommand(db, 'run-1', planHash, 'operator');
  // baska run'in grant'i ile dispatch RED — once db2'nin granti db'de yok
  const g2 = createGrant(db2, baseGrant('run-2', { actions: ['EXTRA_RETRY'], extraRetryBudget: 1, tokenBudget: 100 }), 'insan:test');
  assert.throws(() => dispatchNode(db, 'run-1', 'n1', { tokens: 10, startCommandId: startCmd, dispatchKey: 'k-x', handoff: sampleHandoff('n1'), grantId: g2.grantId }), GateError);
  const d = dispatchNode(db, 'run-1', 'n1', { tokens: 10, startCommandId: startCmd, dispatchKey: 'k2', handoff: sampleHandoff('n1'), grantId });
  assert.equal(d.status, 'DISPATCHED');
});

// ---- Grup 7: PLAN SS16 bagi (receipt dogrulayicisinda store-tarafi grant capraz-bagi) ----
function receiptRig() {
  const { db, planHash } = rig();
  const { grantId } = createGrant(db, baseGrant('run-1', { actions: ['EXTRA_RETRY'], extraRetryBudget: 1, tokenBudget: 1000 }), 'insan:test');
  const startCmd = ensureStartCommand(db, 'run-1', planHash, 'operator');
  const d = dispatchNode(db, 'run-1', 'n1', { tokens: 100, startCommandId: startCmd, dispatchKey: 'k1', handoff: sampleHandoff('n1'), grantId });
  if (d.status !== 'DISPATCHED') throw new Error('dispatch bekleniyordu');
  commitCandidate(db, d.attemptId, 1, H64('a'), 'worker');
  recordEvidence(db, {
    attemptId: d.attemptId, presentedFence: 1, artifactHash: H64('e'), storageRef: 's3://k1', bytes: 8,
    environmentHash: H64('f'), evaluatorHash: H64('h'), exitCode: 0, verdict: 'PASS', testCount: 4, actorId: 'evaluator',
  });
  settleNodeOutcome(db, d.attemptId, 'PASS');
  const receipt: VerificationReceipt = {
    candidateHash: H64('a'), suiteHash: H64('5'), evaluatorId: 'eval-1', evaluatorVersion: '1.0',
    attemptId: d.attemptId, environment: H64('f'),
    startedAt: '2026-10-15T10:00:00Z', finishedAt: '2026-10-15T10:01:00Z',
    exitCodes: [0], testCounts: { passed: 4, failed: 0 }, artifacts: [H64('e')],
    fenceToken: 1, correlationId: 'run-1', signature: 'sig-1',
    grantId, scope: ['coder'],
  };
  const ctx: ReceiptLinkContext = {
    evaluatorRegistry: { 'eval-1': { '1.0': { suiteHash: H64('5') } } },
    grants: { [grantId]: { attemptId: d.attemptId, scope: ['coder'], expiresAt: FUTURE } },
  };
  return { db, grantId, attemptId: d.attemptId, receipt, ctx };
}

test('SS16: attempt.grant_id dolu + ACTIVE grant -> receipt store bagi GECER; revoke sonrasi RED', () => {
  const { db, grantId, receipt, ctx } = receiptRig();
  const okReport = verifyReceiptLinks(db, receipt, ctx);
  assert.deepEqual(okReport.failures, []);
  assert.equal(okReport.ok, true);
  revokeGrant(db, grantId, 'insan:admin');
  const badReport = verifyReceiptLinks(db, receipt, { ...ctx, grants: { [grantId]: { ...ctx.grants[grantId], revoked: true } } });
  assert.equal(badReport.ok, false);
  assert.ok(badReport.failures.some((f) => f.includes('grant bagi(store): grant ACTIVE degil')));
});

test('SS16: receipt grantId attempt.grant_id ile eslesmezse store bagi RED', () => {
  const { db, grantId, receipt, ctx } = receiptRig();
  const other = { ...receipt, grantId: 'grt-baska' };
  const otherCtx: ReceiptLinkContext = { ...ctx, grants: { ...ctx.grants, 'grt-baska': ctx.grants[grantId] } };
  const report = verifyReceiptLinks(db, other, otherCtx);
  assert.equal(report.ok, false);
  assert.ok(report.failures.some((f) => f.includes('grant bagi(store): receipt grantId attempt.grant_id ile eslesmiyor')));
});