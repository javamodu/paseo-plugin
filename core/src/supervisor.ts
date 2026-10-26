// ordu-v3 S1 SUPERVISOR — deterministik orkestrasyon beyni (kod; LLM değil).
// Kapılar: A01 kapsül draft→ready, A02 plan dondurme+hash, A03 insan onaysiz dispatch YOK,
// A04 attempt kimlik/versiyon bagliligi, A10 kosu→frozen candidate, A12 repair tek jenerasyon (≤2),
// A24 WAIT_CAPACITY yakmasiz bekleme. HEPSI store.ts kapilarinin UZERINDE calisir; burada
// yeni bir defter/guc YOK — yalniz sira mantigi (Y1 sabitesi).
import { createHash, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { appendEvent, recordCommand, reserveDispatch, settleReservation, GateError, tx } from './store.ts';
import { requireHandoff } from './handoff.ts';
import { requireReasoningReceipt, type ReasoningReceipt } from './reasoning-receipt.ts';
import { assertProviderModel } from './providers.ts';
import { assertGrantAllows, assertGrantDispatchable, expireDueGrants, grantIdOfVekil, vekilActorOf, type GrantDecisionPayload } from './grants.ts';
import { assertAltAjanGorunur } from './r8.ts';
import { assertDispatchOpen } from './deadline.ts';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const canonical = (v: unknown): string =>
  v === null || typeof v !== 'object' ? JSON.stringify(v)
    : Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']'
      : '{' + Object.keys(v as object).sort().map((k) => JSON.stringify(k) + ':' + canonical((v as any)[k])).join(',') + '}';

// node.state kapali kumesi (semantik; schema CHECK'siz, supervisor sabitler)
export type NodeState = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'SKIPPED';
// attempt.state: RUNNING | CANDIDATE_FROZEN | ACCEPTED | FAILED (store RUNNING/FROZEN kullanir)

// F6.5 (ADR-F65): provider/model opsiyonel; NULL = manager'a birak (dispatch'te cozum zinciri).
export interface PlanNode { id: string; role: string; deps: string[]; provider?: string; model?: string }

export function planHashOf(nodes: PlanNode[]): string {
  // F6.5: provider/model YALNIZ tanimliysa hash'e girer — providersuz planlar bugunku
  // hash'lerle byte-aynen ayni kalir (F0 byte-esitlik kapisi; canonical anahtar siralar).
  return sha(canonical(nodes.map((n) => {
    const base: Record<string, unknown> = { id: n.id, role: n.role, deps: [...n.deps].sort() };
    if (n.provider !== undefined) base.provider = n.provider;
    if (n.model !== undefined) base.model = n.model;
    return base;
  })));
}

// A01/A02: kapsül + DONMUS plan + run + node'lar TEK transaction'ta; hash zinciri.
export function createRunPlan(
  db: DatabaseSync,
  i: { capsuleId: string; goal: string; repoId: string; sourceCommit: string; runId: string; planId: string; profileHash: string; nodes: PlanNode[]; maxWorkers?: number; maxAttempts?: number; maxReservedTokens?: number; deadlineAt?: string; allowedCommands?: string[] },
) {
  const planHash = planHashOf(i.nodes);
  return tx(db, () => {
    db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run(i.capsuleId, i.goal, i.repoId, i.sourceCommit);
    db.prepare(
      'INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,1,?,?,?,?)',
    ).run(i.planId, i.capsuleId, planHash, sha('evaluator:' + i.planId), sha('policy:' + i.planId), (i.allowedCommands ? canonical({ allowedCommands: i.allowedCommands, nodes: i.nodes }) : canonical(i.nodes)));
    db.prepare(
      `INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
       VALUES(?,?,1,'READY',?,0,?,?,?,0,0,?)`,
    ).run(i.runId, i.planId, i.profileHash, i.maxWorkers ?? 2, i.maxAttempts ?? 3, i.maxReservedTokens ?? 100000, i.deadlineAt ?? '2099-01-01T00:00:00Z');
    for (const n of i.nodes) {
      // F6.5: kapali registry dogrulamasi (fail-closed GateError) + iki kolonlu INSERT.
      assertProviderModel(n.provider, n.model);
      db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state,provider,model) VALUES(?,?,?,?,'PENDING',?,?)`).run(i.runId, n.id, n.role, canonical(n.deps), n.provider ?? null, n.model ?? null);
    }
    appendEvent(db, { type: 'CAPSULE_CREATED', actorId: 'core', causationId: i.capsuleId, runId: null as any, payload: { capsuleId: i.capsuleId, goalHash: sha(i.goal) } });
    appendEvent(db, { type: 'PLAN_PROPOSED', actorId: 'core', causationId: i.planId, runId: i.runId, payload: { planId: i.planId, planHash, nodeCount: i.nodes.length } });
    appendEvent(db, { type: 'RUN_CREATED', actorId: 'core', causationId: i.runId, runId: i.runId, payload: { runId: i.runId, planId: i.planId } });
    return { planHash };
  });
}

function hasEvent(db: DatabaseSync, runId: string, type: string) {
  return !!db.prepare('SELECT 1 FROM events WHERE run_id=? AND type=? LIMIT 1').get(runId, type);
}
function nodeDeps(db: DatabaseSync, runId: string, nodeId: string): string[] {
  const r = db.prepare('SELECT dependencies_json FROM nodes WHERE run_id=? AND id=?').get(runId, nodeId) as any;
  return r ? (JSON.parse(r.dependencies_json) as string[]) : [];
}
function nodeState(db: DatabaseSync, runId: string, nodeId: string): NodeState {
  return (db.prepare('SELECT state FROM nodes WHERE run_id=? AND id=?').get(runId, nodeId) as any).state as NodeState;
}
// bir node "DONE" sayilir: en az bir ACCEPTED attempt'i var
function depDone(db: DatabaseSync, runId: string, depId: string) {
  return !!db.prepare("SELECT 1 FROM attempts WHERE run_id=? AND node_id=? AND state='ACCEPTED' LIMIT 1").get(runId, depId);
}

// A03: plan ONAYLANMADAN hiçbir dispatch yok (fail-closed).
export function approvePlan(db: DatabaseSync, runId: string, planHash: string, actor: string, expectedRunVersion = 1) {
  return tx(db, () => {
    const run = db.prepare('SELECT plan_id FROM runs WHERE id=?').get(runId) as any;
    if (!run) throw new GateError('run yok');
    const ph = (db.prepare('SELECT plan_hash FROM plans WHERE id=?').get(run.plan_id) as any).plan_hash as string;
    if (ph !== planHash) throw new GateError('plan hash uymaz — onay bayat/yanlis');
    appendEvent(db, { type: 'PLAN_APPROVED', actorId: actor, causationId: runId, runId, payload: { planId: run.plan_id, planHash, actor } });
  });
}

// dispatch'e HAZIR node: PENDING + tüm bağımlılar DONE + onayli plan.
export function readyNodes(db: DatabaseSync, runId: string): string[] {
  if (!hasEvent(db, runId, 'PLAN_APPROVED')) return []; // A03
  const pendings = db.prepare("SELECT id FROM nodes WHERE run_id=? AND state='PENDING'").all(runId) as any[];
  return pendings.filter((n) => nodeDeps(db, runId, n.id).every((d) => depDone(db, runId, d))).map((n) => n.id);
}

// A04/A10 + A24: bir node'u dispatch et; kapasite yoksa YAKMASIZ bekleme.
export function dispatchNode(
  db: DatabaseSync,
  runId: string,
  nodeId: string,
  opts: { tokens: number; startCommandId: string; dispatchKey: string; handoff: unknown; grantId?: string; now?: () => Date },
) {
  if (!hasEvent(db, runId, 'PLAN_APPROVED')) throw new GateError('A03: plan onaylanmadan dispatch yok');
  requireHandoff(opts.handoff); // P1 §5: handoff DTO'su YAZMA YOLUNDA zorunlu (fail-closed)
  const deps = nodeDeps(db, runId, nodeId);
  if (!deps.every((d) => depDone(db, runId, d))) throw new GateError('A01: bagimliliklar tam degil — dispatch yok');
  // K12-12 (R8 §24): görünmeyen alt-ajan dispatch reddi — 5 şart (kimlik+ana görev,
  // yetki bağı, kullanım ölçümü, yaşam durumu uzlaştırma, iptal+sahiplik); eksik şart ADIYLA kırmızı
  assertAltAjanGorunur(db, { runId, nodeId, commandId: opts.startCommandId, tokens: opts.tokens });
  if (nodeState(db, runId, nodeId) !== 'PENDING') throw new GateError('node dispatch-edilebilir degil: ' + nodeState(db, runId, nodeId));
  // K12-11 (R4 §9.6): deadline dolunca yeni dispatch kapalı (kapanış politikası deadline.ts'te)
  assertDispatchOpen(db, runId, opts.now);
  const planHash = (db.prepare('SELECT p.plan_hash FROM plans p JOIN runs r ON r.plan_id=p.id WHERE r.id=?').get(runId) as any).plan_hash as string;
  return tx(db, () => {
    const number = ((db.prepare('SELECT COALESCE(MAX(number),0) AS m FROM attempts WHERE run_id=? AND node_id=?').get(runId, nodeId) as any).m as number) + 1;
    const attemptId = 'att-' + randomUUID().slice(0, 8);
    const inputHash = sha(planHash + '|' + nodeId + '|' + number); // A04 attempt kimligi plan+node+no'ya bagli
    // R3 (ADR-R3): vekil kokenli dispatch — grant ACTIVE + bu run kapsamli olmali (revoke/expiry sonrasi yeni vekil islemi RED);
    // attempt.grant_id PLAN SS16 capraz-bagini deftere isler (revoke in-flight taramasi bu kolondan).
    if (opts.grantId) assertGrantDispatchable(db, opts.grantId, runId);
    db.prepare(
      `INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token,grant_id) VALUES(?,?,?,?,'RUNNING',?,1,?)`,
    ).run(attemptId, runId, nodeId, number, inputHash, opts.grantId ?? null);
    db.prepare("UPDATE nodes SET state='RUNNING' WHERE run_id=? AND id=?").run(runId, nodeId);
    const r = db.prepare("UPDATE runs SET state='RUNNING' WHERE id=? AND state='READY'").run(runId);
    try {
      reserveDispatch(db, { attemptId, tokens: opts.tokens, commandId: opts.startCommandId, dispatchKey: opts.dispatchKey });
    } catch (e) {
      const msg = String((e as Error).message);
      if (/capacity/.test(msg)) {
        // A24: slot yok — reserve YAKMAZ; node beklemeye döner, CAPACITY_WAIT kaniti.
        db.prepare("UPDATE nodes SET state='PENDING' WHERE run_id=? AND id=?").run(runId, nodeId);
        db.prepare('DELETE FROM attempts WHERE id=?').run(attemptId);
        if (r.changes === 1) db.prepare("UPDATE runs SET state='READY' WHERE id=?").run(runId);
        appendEvent(db, { type: 'CAPACITY_WAIT', actorId: 'core', causationId: opts.startCommandId, runId, payload: { runId, nodeId, reason: 'worker-cap' } });
        return { status: 'WAIT_CAPACITY' as const, nodeId };
      }
      throw e;
    }
    return { status: 'DISPATCHED' as const, attemptId, number };
  });
}

// A12: sinirli onarim — ayni node'da ≤2 repair (attempt number 2..3); kadiyorsa insana devret.
export function requestRepair(
  db: DatabaseSync,
  runId: string,
  nodeId: string,
  failureSignature: string,
  opts: { tokens: number; startCommandId: string; dispatchKey: string; handoff: unknown },
) {
  const max = (db.prepare('SELECT max_attempts AS m FROM runs WHERE id=?').get(runId) as any).m as number;
  const cur = (db.prepare('SELECT COALESCE(MAX(number),0) AS m FROM attempts WHERE run_id=? AND node_id=?').get(runId, nodeId) as any).m as number;
  const repairAttempt = cur; // ilk attempt=1 → cur 1 olunca repair 1... bounded ≤2
  if (cur >= max) return { status: 'NEEDS_DECISION' as const, reason: 'repair budget tukendi (bounded ≤ max_attempts)' };
  db.prepare("UPDATE nodes SET state='PENDING' WHERE run_id=? AND id=?").run(runId, nodeId);
  const res = dispatchNode(db, runId, nodeId, opts);
  if (res.status === 'DISPATCHED') {
    appendEvent(db, {
      type: 'REPAIR_REQUESTED', actorId: 'core', causationId: res.attemptId, runId,
      payload: { attemptId: res.attemptId, failureSignature, repairAttempt: Math.min(2, repairAttempt) }, // event dal max 2
    });
  }
  return res;
}

// node sonucunu isle: PASS→attempt ACCEPTED + node DONE; FAIL→node FAILED (onarim karari).
export function settleNodeOutcome(
  db: DatabaseSync,
  attemptId: string,
  outcome: 'PASS' | 'FAIL',
  failureSignature?: string,
) {
  return tx(db, () => {
    const a = db.prepare('SELECT run_id,node_id FROM attempts WHERE id=?').get(attemptId) as any;
    if (!a) throw new GateError('attempt yok');
    if (outcome === 'PASS') {
      const up = db.prepare("UPDATE attempts SET state='ACCEPTED' WHERE id=? AND state='CANDIDATE_FROZEN'").run(attemptId);
      if (up.changes === 0) throw new GateError('PASS icin once CANDIDATE_FROZEN sart (A10)');
      db.prepare("UPDATE nodes SET state='DONE' WHERE run_id=? AND id=?").run(a.run_id, a.node_id);
      settleReservation(db, attemptId, 'SETTLED', 0); // slotu birak (kapasite geri doger)
      return { status: 'NODE_DONE' as const, runId: a.run_id, nodeId: a.node_id };
    }
    db.prepare("UPDATE attempts SET state='FAILED' WHERE id=?").run(attemptId);
    db.prepare("UPDATE nodes SET state='FAILED' WHERE run_id=? AND id=?").run(a.run_id, a.node_id);
    settleReservation(db, attemptId, 'RELEASED', 0); // arizali attempt slotu tutmaz
    return { status: 'NODE_FAILED' as const, runId: a.run_id, nodeId: a.node_id, failureSignature };
  });
}

// tum node'lar DONE ise run VERIFYING'e gecer (insan ACCEPT_RESULT sonrasi — ayni A14).
export function allNodesDone(db: DatabaseSync, runId: string) {
  return (db.prepare("SELECT COUNT(*) AS c FROM nodes WHERE run_id=? AND state<>'DONE'").get(runId) as any).c === 0;
}

// run'a bagli START_RUN komutu (idempotent) — dispatch'lerin causation'ı.
export function ensureStartCommand(db: DatabaseSync, runId: string, planHash: string, actor: string) {
  const key = 'start-' + runId;
  const r = recordCommand(db, { kind: 'START_RUN', actorId: actor, runId, idempotencyKey: key, payload: { runId, planHash, idempotencyKey: key } });
  return r.commandId;
}

// ---- A14 teslim-onayı BAĞLAMA (hermetik yarısı) + bayatlık (staleness) ----
// requestAcceptance: tüm node DONE + donmuş aday üzerinde PASS kanıt varsa ACCEPT_RESULT onayı İSTER.
// decideApproval APPROVED olmadan run ASLA ACCEPTED olmaz (insan ONAYSIZ teslim yok).
export function requestAcceptance(db: DatabaseSync, runId: string, actor: string) {
  if (!allNodesDone(db, runId)) throw new GateError('teslim icin tum node DONE olmali');
  return tx(db, () => {
    const run = db.prepare(
      'SELECT r.id, r.version, p.plan_hash, p.policy_hash FROM runs r JOIN plans p ON p.id=r.plan_id WHERE r.id=?',
    ).get(runId) as any;
    if (!run) throw new GateError('run yok');
    const cand = db.prepare(
      "SELECT candidate_hash FROM attempts WHERE run_id=? AND state='ACCEPTED' AND candidate_hash IS NOT NULL ORDER BY number DESC LIMIT 1",
    ).get(runId) as any;
    if (!cand) throw new GateError('ACCEPTED aday yok — teslim istenemez');
    db.prepare("UPDATE runs SET candidate_hash=?, state='VERIFYING' WHERE id=?").run(cand.candidate_hash, runId);
    const approvalId = 'apv-' + randomUUID().slice(0, 8);
    db.prepare(
      `INSERT INTO approvals(id,run_id,plan_hash,candidate_hash,policy_hash,expected_run_version,action,expires_at,decision)
       VALUES(?,?,?,?,?,?, 'ACCEPT_RESULT', datetime('now','+1 day'), 'PENDING')`,
    ).run(approvalId, runId, run.plan_hash, cand.candidate_hash, run.policy_hash, run.version);
    appendEvent(db, { type: 'APPROVAL_REQUESTED', actorId: actor, causationId: approvalId, runId, payload: { approvalId, runId, action: 'ACCEPT_RESULT', reason: 'teslim onayi bekleniyor' } });
    return { approvalId, candidateHash: cand.candidate_hash as string };
  });
}

export function decideApproval(
  db: DatabaseSync, approvalId: string, decision: 'APPROVED' | 'REJECTED', actor: string, expectedRunVersion: number,
  grantPayload: GrantDecisionPayload = {},
) {
  expireDueGrants(db); // R3: EXPIRED gecisi RED olabilecek tx'in disinda deftere duser
  return tx(db, () => {
    const ap = db.prepare('SELECT * FROM approvals WHERE id=?').get(approvalId) as any;
    if (!ap) throw new GateError('onay yok');
    if (ap.decision !== 'PENDING') throw new GateError('onay zaten karara ulasmis');
    // U7: süresi dolmuş onay karara bağlanamaz (expires_at kontrolü; format datetime('now') ile aynı)
    if (db.prepare("SELECT 1 AS x FROM approvals WHERE id=? AND expires_at < datetime('now')").get(approvalId)) {
      throw new GateError('onay süresi doldu — yeniden talep gerekir');
    }
    if (ap.expected_run_version !== expectedRunVersion) throw new GateError('A05 stale: run versiyonu uymaz');
    // R3 (ADR-R3 karar-3): vekil karari TEK kapidan — U7/A05 kapilari yukarida AYNEN calisti,
    // gevsek hicbir yol YOK. assertGrantAllows AYNI tx icinde: grant-state yeniden kontrolu (revoke/expiry
    // sonrasi PENDING approval vekilce baglanamaz; insan yolu bu dala hic girmez) + tip-bazli kontrol +
    // sayac tuketimi; sonraki kapilar RED verirse rollback sayaclari da geri alir.
    const vekilGrantId = grantIdOfVekil(actor);
    if (vekilGrantId !== null) {
      assertGrantAllows(db, vekilGrantId, ap.action, { ...grantPayload, runId: ap.run_id });
      if (ap.grant_id !== null && ap.grant_id !== vekilGrantId) {
        throw new GateError('R3 RED: vekil baska grant altindaki onayi baglayamaz');
      }
      db.prepare('UPDATE approvals SET grant_id=? WHERE id=?').run(vekilGrantId, approvalId);
    }
    db.prepare('UPDATE approvals SET decision=?, actor_id=? WHERE id=?').run(decision, actor, approvalId);
    appendEvent(db, { type: 'APPROVAL_DECIDED', actorId: actor, causationId: approvalId, runId: ap.run_id, payload: { approvalId, decision, actor } });
    if (decision !== 'APPROVED') return { status: 'NOT_APPROVED' as const };
    if (ap.action === 'ACCEPT_RESULT') {
      const run = db.prepare('SELECT candidate_hash FROM runs WHERE id=?').get(ap.run_id) as any;
      if (run.candidate_hash !== ap.candidate_hash) throw new GateError('A14: onay BAYAT — aday degisti, kabul yok');
      const ev = db.prepare("SELECT id FROM evidence WHERE candidate_hash=? AND verdict='PASS' ORDER BY rowid LIMIT 1").get(ap.candidate_hash) as any;
      if (!ev) throw new GateError('donmus adayda PASS kanit yok — kabul yok');
      db.prepare("UPDATE runs SET state='ACCEPTED' WHERE id=?").run(ap.run_id);
      appendEvent(db, { type: 'RUN_ACCEPTED', actorId: actor, causationId: approvalId, runId: ap.run_id, payload: { runId: ap.run_id, candidateHash: ap.candidate_hash, evidenceId: ev.id } });
      return { status: 'ACCEPTED' as const };
    }
    return { status: 'APPROVED' as const };
  });
}

// ---- D3 / M18 — TESLİM-İSTEME MAKBUZ KAPISI (eklemeli; requestAcceptance'ı DEĞİŞTİRMEZ) ----
// requireDeliverableReceipt: makbuz şema-cazip OLMALI, run'ın DONMUŞ ACCEPTED adayıyla
// birebir bağdaşmalı ve her evidenceRef GERÇEK, o aday üzerinde PASS bir kanıt satırı olmalı.
// Makbuzsuz/uyuşmaz/kanıtsız → GateError (fail-closed). "Rapor makbuzsuz kabul edilemez."
export function requireDeliverableReceipt(db: DatabaseSync, runId: string, receipt: unknown): ReasoningReceipt {
  const r = requireReasoningReceipt(receipt); // kapalı şema (ek alan RED, alternatif≥1, kanıt≥1)
  const cand = db.prepare(
    "SELECT candidate_hash FROM attempts WHERE run_id=? AND state='ACCEPTED' AND candidate_hash IS NOT NULL ORDER BY number DESC LIMIT 1",
  ).get(runId) as any;
  if (!cand) throw new GateError('M18: teslim için önce ACCEPTED donmuş aday yok');
  if (r.candidateHash !== cand.candidate_hash) {
    throw new GateError('M18: makbuz DONMUŞ adayla bağdaşmıyor (rapor başka adayı açıklıyor)');
  }
  for (const ref of r.evidenceRefs) {
    const ev = db.prepare("SELECT 1 AS x FROM evidence WHERE id=? AND candidate_hash=? AND verdict='PASS'").get(ref, cand.candidate_hash);
    if (!ev) throw new GateError(`M18: makbuz kanıta bağlı değil — '${ref}' bu adayda gerçek PASS kanıt değil`);
  }
  return r;
}

// requestDelivery: M18 kapısından geçen TESLİM-İSTEME — önce makbuzu denetler, sonra mevcut
// requestAcceptance'a delege eder (insan onayı akışı AYNEN; yeni komut/olay kind YOK).
export function requestDelivery(db: DatabaseSync, runId: string, actor: string, receipt: unknown) {
  const r = requireDeliverableReceipt(db, runId, receipt);
  // M03 idempotent teslim: doğal idempotency anahtarı = (run_id, ACCEPT_RESULT, candidate_hash, PENDING).
  // Aynı anahtarla tekrar çağrı YENİ onay/event ÜRETMEZ; bekleyen onayı DUPLICATE olarak döndürür.
  const pending = db.prepare(
    "SELECT id FROM approvals WHERE run_id=? AND action='ACCEPT_RESULT' AND decision='PENDING' AND candidate_hash=? ORDER BY rowid LIMIT 1",
  ).get(runId, r.candidateHash) as any;
  if (pending) {
    return { approvalId: pending.id as string, candidateHash: r.candidateHash, status: 'DUPLICATE' as const };
  }
  const req = requestAcceptance(db, runId, actor);
  return { ...req, status: 'REQUESTED' as const };
}

// ---- R3 (ADR-R3): vekil karar onay akisi — approvals.action kapali kumesinin SS9.2 genislemesi ----
// APPROVAL_REQUESTED event'i YOK: event payload semasi kapali (ACCEPT_RESULT/EXTEND_BUDGET/REPLAN)
// ve ADR madde-5 geregi vekil karari defterde (approvals satiri grant_id'li + APPROVAL_DECIDED
// actor_id='vekil:<grantId>') yasar. expires_at = grant.expires_at: karar omru grant'i asamaz.
export function requestGrantApproval(
  db: DatabaseSync,
  i: { runId: string; grantId: string; action: string; payload?: GrantDecisionPayload },
) {
  expireDueGrants(db); // R3: EXPIRED gecisi tx disinda deftere duser (rollback'e kurban gitmez)
  return tx(db, () => {
    assertGrantAllows(db, i.grantId, i.action, { ...i.payload, runId: i.runId }, { consume: false });
    const run = db.prepare(
      'SELECT r.version, p.plan_hash, p.policy_hash FROM runs r JOIN plans p ON p.id=r.plan_id WHERE r.id=?',
    ).get(i.runId) as any;
    if (!run) throw new GateError('run yok');
    const grant = db.prepare('SELECT expires_at FROM grants WHERE id=?').get(i.grantId) as any;
    const approvalId = 'apv-' + randomUUID().slice(0, 8);
    db.prepare(
      `INSERT INTO approvals(id,run_id,plan_hash,candidate_hash,policy_hash,expected_run_version,action,expires_at,decision,grant_id)
       VALUES(?,?,?,NULL,?,?,?,?,'PENDING',?)`,
    ).run(approvalId, i.runId, run.plan_hash, run.policy_hash, run.version, i.action, grant.expires_at, i.grantId);
    return { approvalId };
  });
}

// R3 vekil karar yolu: PENDING ac + AYNI grant ile karara bagla. Karar decideApproval kapisindan
// gecer (U7/A05 + grant kapisi ayni tx); insan yolu (decideApproval dogrudan) DEGISMEZ.
export function decideWithGrant(
  db: DatabaseSync,
  i: { runId: string; grantId: string; action: string; decision?: 'APPROVED' | 'REJECTED'; payload?: GrantDecisionPayload },
) {
  const req = requestGrantApproval(db, i);
  const version = (db.prepare('SELECT version FROM runs WHERE id=?').get(i.runId) as any).version as number;
  const res = decideApproval(db, req.approvalId, i.decision ?? 'APPROVED', vekilActorOf(i.grantId), version, i.payload);
  return { approvalId: req.approvalId, ...res };
}
