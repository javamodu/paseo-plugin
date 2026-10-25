// K-0006 kanonik adapter sözleşmesi — orkestrasyon katmanı (SDK tipinden ARINMIŞ).
// Üç dürüst kural:
//  1) iptal İSTEĞİ ≠ iptal TEYİDİ: teyit gelene dek rezervasyon/slot AKTİF kalir (SLOT + A08).
//  2) hata normalizasyonu: ham/provider hatasi yalniz {cls,message}'a indirgenir —
//     SDK-tipi sizdirmasi YASAK; esleşmeyen → 'belirsiz' (körü körüne OK yok).
//  3) usage-unknown ≠ bedava: belirsiz yanit 'UNKNOWN' döner, slot serbest birakilmaz.
import { DatabaseSync } from 'node:sqlite';
import { appendEvent, settleReservation, GateError, tx } from './store.ts';
import type { WorkerAdapter } from './dispatcher.ts';

export type NormCls = 'auth' | 'kota' | 'zamanasimi' | 'belirsiz' | 'desteklenmiyor';
export interface NormalizedError { readonly cls: NormCls; readonly message: string }

// Ham hatayi kanonik sinifa çevir; fazladan HER alan düşer (SDK-tipi sizdirmasi yok).
export function normalizeError(raw: unknown): NormalizedError {
  const anyErr: any = raw ?? {};
  const msg = String(anyErr?.message ?? anyErr ?? 'bilinmeyen hata').slice(0, 500);
  const code = anyErr?.status ?? anyErr?.code;
  let cls: NormCls = 'belirsiz';
  if (/not.?support|not.?implement|unsupported|desteklenmiyor/i.test(msg)) cls = 'desteklenmiyor';
  else if (code === 401 || code === 403 || /auth|token|yetki|permission/i.test(msg)) cls = 'auth';
  else if (code === 429 || /quota|rate.?limit|kota|limit/i.test(msg)) cls = 'kota';
  else if (/timeout|timed.?out|zamanasimi/i.test(msg)) cls = 'zamanasimi';
  return Object.freeze({ cls, message: msg });
}

// iptal: önce NİYET deftere (CANCEL_REQUESTED) — dış çağrı transaction DIŞINDA.
export async function requestCancel(
  db: DatabaseSync, adapter: WorkerAdapter, attemptId: string, reason: string, actor = 'core',
) {
  const a = db.prepare('SELECT run_id FROM attempts WHERE id=?').get(attemptId) as any;
  if (!a) throw new GateError('attempt yok');
  tx(db, () => {
    appendEvent(db, { type: 'CANCEL_REQUESTED', actorId: actor, causationId: attemptId, runId: a.run_id, attemptId, payload: { runId: a.run_id, attemptId, reason } });
    db.prepare("UPDATE attempts SET state='CANCEL_REQUESTED' WHERE id=? AND state='RUNNING'").run(attemptId);
    db.prepare("UPDATE runs SET state='CANCEL_REQUESTED' WHERE id=? AND state IN('RUNNING','READY','VERIFYING')").run(a.run_id);
  });

  let out: 'CONFIRMED_DEAD' | 'REQUESTED' | 'UNKNOWN' | 'UNSUPPORTED';
  if (adapter.cancel) {
    try { out = await adapter.cancel(attemptId); } catch { out = 'UNKNOWN'; }
  } else out = 'UNSUPPORTED';

  if (out === 'CONFIRMED_DEAD') {
    tx(db, () => {
      appendEvent(db, { type: 'CANCEL_CONFIRMED', actorId: actor, causationId: attemptId, runId: a.run_id, attemptId, payload: { runId: a.run_id, attemptId, externalState: 'CONFIRMED_DEAD' } });
      settleReservation(db, attemptId, 'RELEASED', 0); // teyitli ölüm → slot bırakilir
      db.prepare("UPDATE attempts SET state='CANCELLED' WHERE id=?").run(attemptId);
      db.prepare("UPDATE runs SET state='CANCELLED' WHERE id=?").run(a.run_id);
    });
    return { status: 'CANCELLED' as const };
  }
  // REQUESTED/UNKNOWN/UNSUPPORTED: TEYİT YOK → rezervasyon AKTİF kalir (slot tutmaya devam).
  return { status: 'CANCEL_UNCONFIRMED' as const, adapterResponse: out };
}

// BUG-C6 düzeltmesi (TUR A): devir (takeLease fence bump) store yazmalarini RED eder ama eski
// sahibin SURECI OS-seviyesinde yazmaya devam ederdi (dalga-3 canli kanit). Kapatma patikasi:
// devir aninda eski sahibin sürecini iptal et — attemptin DURUMU DEGISMEZ (yeni sahip ayni
// attempte devam eder; requestCancel'in CANCELLED durum geçişlerinden FARKLI). Niyet mevcut
// CANCEL_REQUESTED daliyla, teyit RUNTIME_OBSERVED (dış süreç gözlemi) ile deftere düşer —
// yeni olay tipi AÇILMAZ (baseline senkron: 31 tip birebir). Teyit gelmezse süreç yaşar (dürüst).
export async function cancelStaleOwner(
  db: DatabaseSync, adapter: WorkerAdapter, attemptId: string, reason: string, actor = 'core',
) {
  const a = db.prepare('SELECT run_id FROM attempts WHERE id=?').get(attemptId) as any;
  if (!a) throw new GateError('attempt yok');
  tx(db, () => {
    appendEvent(db, { type: 'CANCEL_REQUESTED', actorId: actor, causationId: attemptId, runId: a.run_id, attemptId, payload: { runId: a.run_id, attemptId, reason: 'stale-owner: ' + reason } });
  });

  let out: 'CONFIRMED_DEAD' | 'REQUESTED' | 'UNKNOWN' | 'UNSUPPORTED';
  if (adapter.cancel) {
    try { out = await adapter.cancel(attemptId); } catch { out = 'UNKNOWN'; }
  } else out = 'UNSUPPORTED';

  tx(db, () => {
    appendEvent(db, { type: 'RUNTIME_OBSERVED', actorId: actor, causationId: attemptId, runId: a.run_id, attemptId, payload: { attemptId, runtimeState: 'STALE_OWNER_' + out } });
  });
  return out === 'CONFIRMED_DEAD'
    ? { status: 'KILLED' as const, adapterResponse: out }
    : { status: 'UNCONFIRMED' as const, adapterResponse: out };
}

// gonder: çalışan worker'a takip mesajı; desteklenmiyorsa normalize hata, durum değişmez.
export async function sendFollowUp(
  db: DatabaseSync, adapter: WorkerAdapter, attemptId: string, text: string,
) {
  const a = db.prepare('SELECT external_session_id FROM attempts WHERE id=?').get(attemptId) as any;
  if (!a) throw new GateError('attempt yok');
  if (!adapter.send) return { status: 'UNSUPPORTED' as const, error: normalizeError(new Error('gonder desteklenmiyor')) };
  try {
    const out = await adapter.send(a.external_session_id ?? attemptId, text);
    return { status: out }; // 'OK' | 'UNKNOWN'
  } catch (e) {
    return { status: 'ERROR' as const, error: normalizeError(e) };
  }
}

// olaylar: dış runtime gözlemi → RUNTIME_OBSERVED (send/olay polling köprüsü).
export async function pollEvents(db: DatabaseSync, adapter: WorkerAdapter, attemptId: string) {
  if (!adapter.events) return { supported: false as const, count: 0 };
  const a = db.prepare('SELECT run_id,external_session_id FROM attempts WHERE id=?').get(attemptId) as any;
  if (!a) throw new GateError('attempt yok');
  const evs = await adapter.events(a.external_session_id ?? attemptId);
  for (const e of evs) {
    tx(db, () => appendEvent(db, { type: 'RUNTIME_OBSERVED', actorId: 'core', causationId: attemptId, runId: a.run_id, attemptId, payload: { attemptId, runtimeState: e.kind } }));
  }
  return { supported: true as const, count: evs.length };
}
