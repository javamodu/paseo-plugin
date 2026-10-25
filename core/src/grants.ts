// R3 (ADR-R3) — sinirli vekalet: grant yasam dongusu + TEK vekil kapi fonksiyonu.
// Fail-closed: tek kirmizi = GateError. Yeni Command.kind/Event.type YOK (ADR madde 5):
// grant defterde (grants tablosu) yasar; vekil karari approvals + mevcut APPROVAL_DECIDED
// olayinin actor_id'sinde ('vekil:<grantId>') tasir — cift-dogru-kaynak alinmaz.
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { appendEvent, GateError, tx } from './store.ts';
import { PROVIDER_REGISTRY } from './providers.ts';

// SS9.2 kapali kumesi — vekil YALNIZ bu 5 karar tipini verebilir; her biri ayri yetki.
// merge/deploy/harcama/kapsam-genisletme (ve teslim kabulu ACCEPT_RESULT) bu kumede YOK:
// grant ile HIC verilemez (ayri insan yetkisi).
export const GRANT_ACTION_TYPES = ['ANSWER_QUESTION', 'FALLBACK_MODEL', 'EXTRA_RETRY', 'REASSIGN_NODE', 'MANIFEST_AMEND'] as const;
export type GrantActionType = (typeof GRANT_ACTION_TYPES)[number];

// SS9.2 karar karti tur seti (kapali kume, 9 tur) — ANSWER_QUESTION kapsami bunun alt kumesi.
export const QUESTION_TYPES = [
  '3-kirmizi', 'plateau', 'butce-asimi', 'kapsam-disi', 'yetim',
  'izin-sorisi', 'onar', 'acik-bagimlilik', 'ogrenme-onerisi',
] as const;

// MANIFEST_AMEND izinli degisiklik siniflari — yalniz kapsam-DARALTAN / not-duzeltme sinifi.
export const MANIFEST_AMEND_CLASSES = ['not-duzeltme', 'kapsam-daraltma'] as const;

export const VEKIL_PREFIX = 'vekil:';
export const vekilActorOf = (grantId: string) => VEKIL_PREFIX + grantId;
export const grantIdOfVekil = (actor: string): string | null =>
  actor.startsWith(VEKIL_PREFIX) && actor.length > VEKIL_PREFIX.length ? actor.slice(VEKIL_PREFIX.length) : null;

export interface GrantInput {
  runId: string;
  actions: string[];
  questionTypes?: string[];      // ANSWER_QUESTION kapsami
  fallbackModels?: string[];     // 'provider/model' bicimi; F6.5 registry alt kumesi
  extraRetryBudget?: number;
  reassignAllowed?: boolean;
  manifestAmendScope?: string[]; // MANIFEST_AMEND_CLASSES alt kumesi
  tokenBudget?: number;
  expiresAt: string;             // suresiz grant YOK (zorunlu)
  forbidden?: string[];          // derinlik-savunmasi acik yasak listesi
}

export interface ManifestAmendSide {
  nodes?: string[];
  deps?: Record<string, string[]>;
  budgets?: Record<string, number>;
  dirs?: string[];
  notes?: string;
  providerModel?: string;        // 'provider/model'
}
export interface ManifestAmend { before: ManifestAmendSide; after: ManifestAmendSide }

export interface GrantDecisionPayload {
  runId?: string;
  questionType?: string;
  model?: string;                // 'provider/model'
  tokens?: number;               // kararin dogurdugu attempt rezervasyonu (token_budget'tan duser)
  amend?: ManifestAmend;
}

function assertModelInRegistry(pm: string, ctx: string) {
  const slash = pm.indexOf('/');
  if (slash <= 0 || slash === pm.length - 1) throw new GateError(ctx + ": model 'provider/model' biciminde olmali: " + pm);
  const provider = pm.slice(0, slash);
  const model = pm.slice(slash + 1);
  const models = PROVIDER_REGISTRY[provider];
  if (!models) throw new GateError(ctx + ': F6.5 registry-disi provider: ' + provider);
  if (!models.includes(model)) throw new GateError(ctx + ': F6.5 registry-disi model: ' + pm);
}

// Buyutemez katman-a (kod): yalniz insan grant yaratabilir; 'vekil:%' actor RED.
// DB tarafinda CHECK(created_by NOT LIKE 'vekil:%') ikinci katman — kod atlasa sema yakalar.
export function createGrant(db: DatabaseSync, input: GrantInput, actor: string) {
  expireDueGrants(db);
  if (grantIdOfVekil(actor) !== null) throw new GateError('R3 RED: vekil grant yaratamaz (buyutemez katman-a)');
  if (!input.expiresAt) throw new GateError('R3 RED: suresiz grant YOK — expiresAt zorunlu');
  if (!db.prepare('SELECT 1 AS x FROM runs WHERE id=?').get(input.runId)) {
    throw new GateError('R3 RED: run yok: ' + input.runId);
  }
  if (!Array.isArray(input.actions) || input.actions.length === 0) {
    throw new GateError('R3 RED: actions bos olamaz');
  }
  for (const a of input.actions) {
    if (!(GRANT_ACTION_TYPES as readonly string[]).includes(a)) {
      throw new GateError('R3 RED: vekil karar tipi kapali kume disinda (grant ile verilemez): ' + a);
    }
  }
  const questionTypes = input.questionTypes ?? [];
  for (const q of questionTypes) {
    if (!(QUESTION_TYPES as readonly string[]).includes(q)) throw new GateError('R3 RED: soru tipi kapali kume disinda: ' + q);
  }
  if (input.actions.includes('ANSWER_QUESTION') && questionTypes.length === 0) {
    throw new GateError('R3 RED: ANSWER_QUESTION icin questionTypes bos olamaz');
  }
  const fallbackModels = input.fallbackModels ?? [];
  for (const m of fallbackModels) assertModelInRegistry(m, 'R3 RED');
  if (input.actions.includes('FALLBACK_MODEL') && fallbackModels.length === 0) {
    throw new GateError('R3 RED: FALLBACK_MODEL icin fallbackModels bos olamaz');
  }
  const extraRetryBudget = input.extraRetryBudget ?? 0;
  if (!Number.isInteger(extraRetryBudget) || extraRetryBudget < 0) {
    throw new GateError('R3 RED: extraRetryBudget >=0 tamsayi olmali');
  }
  if (input.actions.includes('EXTRA_RETRY') && extraRetryBudget === 0) {
    throw new GateError('R3 RED: EXTRA_RETRY icin extraRetryBudget 0 olamaz');
  }
  const tokenBudget = input.tokenBudget ?? 0;
  if (!Number.isInteger(tokenBudget) || tokenBudget < 0) {
    throw new GateError('R3 RED: tokenBudget >=0 tamsayi olmali');
  }
  const amendScope = input.manifestAmendScope ?? [];
  for (const s of amendScope) {
    if (!(MANIFEST_AMEND_CLASSES as readonly string[]).includes(s)) {
      throw new GateError('R3 RED: amend sinifi kapali kume disinda: ' + s);
    }
  }
  if (input.actions.includes('MANIFEST_AMEND') && amendScope.length === 0) {
    throw new GateError('R3 RED: MANIFEST_AMEND icin manifestAmendScope bos olamaz');
  }
  const forbidden = input.forbidden ?? [];
  return tx(db, () => {
    // expires sqlite datetime formatina normalize edilir (U7 deseni: datetime('now') kiyasi tutarli kalsin).
    if (db.prepare("SELECT 1 AS x WHERE datetime(?) <= datetime('now')").get(input.expiresAt)) {
      throw new GateError('R3 RED: expiresAt gecmiste — dogmus olu grant YOK');
    }
    const id = 'grt-' + randomUUID().slice(0, 8);
    db.prepare(
      `INSERT INTO grants(id,run_id,created_by,created_at,actions_json,question_types_json,fallback_models_json,
        extra_retry_budget,reassign_allowed,manifest_amend_scope_json,token_budget,expires_at,forbidden_json,state)
       VALUES(?,?,?,datetime('now'),?,?,?,?,?,?,?,datetime(?),?,'ACTIVE')`,
    ).run(id, input.runId, actor, JSON.stringify(input.actions), JSON.stringify(questionTypes),
      JSON.stringify(fallbackModels), extraRetryBudget, input.reassignAllowed ? 1 : 0,
      JSON.stringify(amendScope), tokenBudget, input.expiresAt, JSON.stringify(forbidden));
    return { grantId: id };
  });
}

const isSubset = (superset: readonly string[] = [], subset: readonly string[] = []) => subset.every((x) => superset.includes(x));
const sameList = (a: readonly string[] = [], b: readonly string[] = []) => a.length === b.length && a.every((x) => b.includes(x));

// Buyutemez katman-c: MANIFEST_AMEND genisletme yuklemcisi (K-0033 supabi). Yeni manifest her
// alanda eskisinin ALT KUMESI/daraltmasi olmali: yeni node YOK, deps genislemesi YOK,
// butce/tavan artisi YOK, izinli-dizin genislemesi YOK, provider/model kapali kume disi YOK.
// Bilincli DAR: supheli fark = RED (insan kartina duser); yanlis-negatif kabul, yanlis-pozitif degil.
export function assertManifestAmendNarrows(scope: readonly string[], amend: ManifestAmend): void {
  const { before, after } = amend;
  if ((before.notes ?? '') !== (after.notes ?? '')) {
    if (!scope.includes('not-duzeltme')) throw new GateError('R3 RED: not degisikligi not-duzeltme sinifi disinda');
  }
  const structural =
    !sameList(before.nodes, after.nodes) ||
    JSON.stringify(before.deps ?? {}) !== JSON.stringify(after.deps ?? {}) ||
    JSON.stringify(before.budgets ?? {}) !== JSON.stringify(after.budgets ?? {}) ||
    !sameList(before.dirs, after.dirs) ||
    (before.providerModel ?? null) !== (after.providerModel ?? null);
  if (structural && !scope.includes('kapsam-daraltma')) {
    throw new GateError('R3 RED: yapisal manifest degisikligi kapsam-daraltma sinifi disinda');
  }
  if (!isSubset(before.nodes, after.nodes)) {
    throw new GateError('R3 RED: MANIFEST_AMEND yeni node ekleyemez (genisletme = insan)');
  }
  for (const [k, v] of Object.entries(after.deps ?? {})) {
    const bDeps = (before.deps ?? {})[k];
    if (!bDeps) throw new GateError('R3 RED: deps yeni anahtar ekleyemez: ' + k);
    if (!isSubset(bDeps, v)) throw new GateError('R3 RED: dependencies_json genislemesi YOK: ' + k);
  }
  for (const [k, v] of Object.entries(after.budgets ?? {})) {
    const b = (before.budgets ?? {})[k];
    if (b === undefined) throw new GateError('R3 RED: butce yeni anahtar ekleyemez: ' + k);
    if (v > b) throw new GateError('R3 RED: butce/tavan artisi YOK: ' + k);
  }
  if (!isSubset(before.dirs, after.dirs)) {
    throw new GateError('R3 RED: izinli-dizin genislemesi YOK');
  }
  if (after.providerModel !== undefined && after.providerModel !== before.providerModel) {
    assertModelInRegistry(after.providerModel, 'R3 RED');
  }
}

// EXPIRED zaman gecisi (U7 deseni: datetime('now') kiyasi). Persist TX DISINDA yapilir: gecis
// RED olan bir kararin rollback'ine kurban gitmemeli (zaman otoritesi tx'ten bagimsizdir).
// API girislerinde (createGrant/assertGrantAllows/assertGrantDispatchable/revokeGrant +
// supervisor.decideApproval) tx ONCESI cagrilir; ortam tx icinde cagrilirsa kontrol yine
// fail-closed kalir (loadActiveGrant'in expired bayragi), yalniz persist ertelenir.
export function expireDueGrants(db: DatabaseSync) {
  db.prepare("UPDATE grants SET state='EXPIRED' WHERE state='ACTIVE' AND expires_at < datetime('now')").run();
}

// Grant satirini yukle; sonlanmis/suresi dolmus = GateError (fail-closed, tek kirmizi).
function loadActiveGrant(db: DatabaseSync, grantId: string) {
  const g = db.prepare("SELECT *, (expires_at < datetime('now')) AS expired FROM grants WHERE id=?").get(grantId) as any;
  if (!g) throw new GateError('R3 RED: grant yok: ' + grantId);
  if (g.state !== 'ACTIVE' || g.expired === 1) {
    throw new GateError('R3 RED: grant aktif degil (' + (g.expired === 1 ? 'EXPIRED' : g.state) + ') — vekil yetkisi sonludur');
  }
  return g;
}

// TEK vekil kapisi (ADR karar-3): grant var + state ACTIVE + suresi dolmamis + action actions_json
// icinde + tip-bazli alt kontrol + token_budget yeterli. opts.consume=false => saf kontrol
// (istek aninda tuketim YOK); sayaclar karar aninda decideApproval ile AYNI tx icinde duser —
// karar sonrasi kapi RED verirse tx rollback sayaclari da geri alir (cift-dusum YOK).
export function assertGrantAllows(
  db: DatabaseSync,
  grantId: string,
  action: string,
  payload: GrantDecisionPayload = {},
  opts: { consume?: boolean } = {},
) {
  const consume = opts.consume !== false;
  expireDueGrants(db);
  return tx(db, () => {
    const g = loadActiveGrant(db, grantId);
    if (payload.runId && g.run_id !== payload.runId) {
      throw new GateError('R3 RED: grant baska run kapsamli (run-kapsamli grant; yatay yetki YOK)');
    }
    if (!(GRANT_ACTION_TYPES as readonly string[]).includes(action)) {
      throw new GateError('R3 RED: action vekil karar kapali kumesi disinda: ' + action);
    }
    const actions = JSON.parse(g.actions_json) as string[];
    if (!actions.includes(action)) throw new GateError('R3 RED: action grant kapsami disinda: ' + action);
    const tokens = payload.tokens ?? 0;
    if (!Number.isInteger(tokens) || tokens < 0) throw new GateError('R3 RED: tokens >=0 tamsayi olmali');
    if (tokens > g.token_budget) throw new GateError('R3 RED: token_budget yetersiz');
    switch (action) {
      case 'ANSWER_QUESTION': {
        const qts = JSON.parse(g.question_types_json) as string[];
        if (!payload.questionType || !qts.includes(payload.questionType)) {
          throw new GateError('R3 RED: soru tipi grant kapsami disinda: ' + (payload.questionType ?? 'yok'));
        }
        break;
      }
      case 'FALLBACK_MODEL': {
        const models = JSON.parse(g.fallback_models_json) as string[];
        if (!payload.model || !models.includes(payload.model)) {
          throw new GateError('R3 RED: model fallback_models listesi disinda: ' + (payload.model ?? 'yok'));
        }
        assertModelInRegistry(payload.model, 'R3 RED'); // grant listesinde VE F6.5 registry'de olmali
        break;
      }
      case 'EXTRA_RETRY':
        if (g.extra_retry_budget <= 0) throw new GateError('R3 RED: extra_retry_budget tukendi (0)');
        break;
      case 'REASSIGN_NODE':
        if (g.reassign_allowed !== 1) throw new GateError('R3 RED: yeniden-atama yetkisi yok (reassign_allowed=0)');
        break;
      case 'MANIFEST_AMEND': {
        if (!payload.amend) throw new GateError('R3 RED: MANIFEST_AMEND farki (before/after) zorunlu');
        assertManifestAmendNarrows(JSON.parse(g.manifest_amend_scope_json) as string[], payload.amend);
        break;
      }
    }
    if (consume) {
      // Buyutemez katman-d: sayaclar yalniz TUKENIR (artan/esit UPDATE trigger'a takilir).
      if (action === 'EXTRA_RETRY') {
        const r = db.prepare('UPDATE grants SET extra_retry_budget=extra_retry_budget-1 WHERE id=? AND extra_retry_budget>0').run(grantId);
        if (r.changes !== 1) throw new GateError('R3 RED: extra_retry_budget tukendi (0)');
      }
      if (tokens > 0) {
        const r = db.prepare('UPDATE grants SET token_budget=token_budget-? WHERE id=? AND token_budget>=?').run(tokens, grantId, tokens);
        if (r.changes !== 1) throw new GateError('R3 RED: token_budget yetersiz');
      }
    }
    return { runId: g.run_id as string };
  });
}

// Dispatch kapisi (ADR karar-3a): revoke/expiry sonrasi grant ile YENI vekil islemi (yeni attempt
// doguracak EXTRA_RETRY/REASSIGN_NODE dahil) RED. Tuketim YOK — karar aninda dusuldu.
export function assertGrantDispatchable(db: DatabaseSync, grantId: string, runId: string) {
  expireDueGrants(db);
  return tx(db, () => {
    const g = loadActiveGrant(db, grantId);
    if (g.run_id !== runId) throw new GateError('R3 RED: grant baska run kapsamli');
  });
}

// Revoke INSAN islemidir. In-flight etkisi (K13-01 kosul 5b): grant'a bagli RUNNING attempt'ler
// mevcut iptal patikasina duser — CANCEL_REQUESTED niyeti + fencing bump; rezervasyon/slot
// SERBEST BIRAKILMAZ (teyit/UNKNOWN mevcut requestCancel+reconcileUnknown makinasinin isi;
// kor kill YOK, yeni mekanizma YOK). (c) PENDING approval'lar vekilce baglanamaz (decideApproval
// girisinde grant-state yeniden kontrolu); insan baglayabilir — otorite sahibine doner.
export function revokeGrant(db: DatabaseSync, grantId: string, actor: string) {
  expireDueGrants(db);
  if (grantIdOfVekil(actor) !== null) throw new GateError('R3 RED: revoke insan islemidir — vekil revoke edemez');
  return tx(db, () => {
    const g = db.prepare('SELECT state FROM grants WHERE id=?').get(grantId) as any;
    if (!g) throw new GateError('R3 RED: grant yok: ' + grantId);
    if (g.state !== 'ACTIVE') throw new GateError('R3 RED: grant zaten sonlanmis: ' + g.state);
    db.prepare("UPDATE grants SET state='REVOKED', revoked_by=?, revoked_at=datetime('now') WHERE id=? AND state='ACTIVE'").run(actor, grantId);
    const inflight = db.prepare("SELECT id, run_id FROM attempts WHERE grant_id=? AND state='RUNNING'").all(grantId) as any[];
    for (const a of inflight) {
      db.prepare("UPDATE attempts SET state='CANCEL_REQUESTED', fencing_token=fencing_token+1 WHERE id=?").run(a.id);
      appendEvent(db, {
        type: 'CANCEL_REQUESTED', actorId: actor, causationId: grantId, runId: a.run_id, attemptId: a.id,
        payload: { runId: a.run_id, attemptId: a.id, reason: 'grant-revoke: ' + grantId },
      });
    }
    return { revoked: grantId, inFlightCancelRequested: inflight.length };
  });
}