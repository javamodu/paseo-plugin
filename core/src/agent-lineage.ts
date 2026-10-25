// D4 — DIŞ AGENT KİMLİK ZİNCİRİ: TEK okuma-yolu sorgusu. ÇEKİRDEĞİ KORUR: hiçbir yazma
// yapmaz, yeni tablo/kind EKLEMEZ — mevcut attempts/nodes/runs/reservations/evidence/
// outbox/commands/events satırlarını TEK soyağacı kaydında TOPLAR ve EKSİK halkaları
// DÜRÜSTçe raporlar (metrik v3.1: subagent usage 'bilinmiyor' → bedava DEĞİL; zincir
// eksiksiz olmadan "izlenebilir" denmez).
import { DatabaseSync } from 'node:sqlite';

export interface EvidenceLink { id: string; verdict: string; candidateHash: string; exitCode: number; testCount: number }
export interface EventLink { sequence: number; type: string; actorId: string; causationId: string }

export interface LineageRecord {
  runId: string;
  nodeId: string;
  nodeRole: string;
  attemptId: string;
  attemptNumber: number;
  attemptState: string;
  fencingToken: number;
  parentActorId: string | null;        // START_RUN'ı veren yönetici/üst aktör (commands.actor_id)
  externalSessionId: string | null;    // dış agent oturum kimliği
  runtimeKind: 'paseo' | 'local' | 'bilinmiyor';
  leaseOwner: string | null;
  reservation: { tokens: number; state: string } | null;
  usageUnknown: boolean;               // run.usage_unknown VEYA reservation UNKNOWN
  costAttribution: number | 'bilinmiyor'; // unknown ⇒ 'bilinmiyor' (ASLA 0/bedava değil)
  evidence: EvidenceLink[];
  events: EventLink[];
  gaps: string[];                      // eksik halkalar
  complete: boolean;                   // gaps.length === 0
}

// external_session_id önekinden runtime türetme; önek yok/bilinmeyen → 'bilinmiyor' (uydurma yok).
export function deriveRuntime(sessionId: string | null): 'paseo' | 'local' | 'bilinmiyor' {
  if (!sessionId) return 'bilinmiyor';
  if (sessionId.startsWith('paseo:')) return 'paseo';
  if (sessionId.startsWith('local:')) return 'local';
  return 'bilinmiyor';
}

export function traceLineage(db: DatabaseSync, attemptId: string): LineageRecord {
  const a = db.prepare('SELECT * FROM attempts WHERE id=?').get(attemptId) as any;
  if (!a) throw new Error('attempt yok: ' + attemptId);
  const node = db.prepare('SELECT role FROM nodes WHERE run_id=? AND id=?').get(a.run_id, a.node_id) as any;
  const run = db.prepare('SELECT usage_unknown, spent_tokens, state FROM runs WHERE id=?').get(a.run_id) as any;
  const reservation = db.prepare('SELECT tokens, state FROM reservations WHERE attempt_id=?').get(attemptId) as any;
  // üst/yönetici aktör: bu attempt'e bağlı outbox satırının command'ının actor_id'si.
  const cmd = db.prepare(
    'SELECT c.actor_id FROM outbox o JOIN commands c ON c.id=o.command_id WHERE o.attempt_id=? LIMIT 1',
  ).get(attemptId) as any;
  const evidence = (db.prepare(
    'SELECT id, verdict, candidate_hash, exit_code, test_count FROM evidence WHERE attempt_id=? ORDER BY rowid',
  ).all(attemptId) as any[]).map((e) => ({ id: e.id, verdict: e.verdict, candidateHash: e.candidate_hash, exitCode: e.exit_code, testCount: e.test_count }));
  const events = (db.prepare(
    'SELECT sequence, type, actor_id, causation_id FROM events WHERE attempt_id=? ORDER BY sequence',
  ).all(attemptId) as any[]).map((ev) => ({ sequence: ev.sequence, type: ev.type, actorId: ev.actor_id, causationId: ev.causation_id }));

  const runtimeKind = deriveRuntime(a.external_session_id ?? null);
  const usageUnknown = !!run.usage_unknown || reservation?.state === 'UNKNOWN';
  // maliyet: ölçülemeyen ASLA 0 değil → 'bilinmiyor'; ölçülebilirse rezerve token.
  const costAttribution: number | 'bilinmiyor' = usageUnknown ? 'bilinmiyor' : (reservation ? reservation.tokens : run.spent_tokens);

  const gaps: string[] = [];
  if (!a.external_session_id) gaps.push('dis-oturum-kimligi-baglanmadi (attempt→session kopuk)');
  else if (runtimeKind === 'bilinmiyor') gaps.push('runtime-turu-bilinmiyor (oturum öneksiz)');
  if (!cmd) gaps.push('ust-aktor-bulunamadi (attempt→command/parent kopuk)');
  if (!reservation) gaps.push('rezervasyon-yok (kullanim-baglanti-kopuk)');
  else if (reservation.state === 'UNKNOWN') gaps.push('rezervasyon-durumu-UNKNOWN (kullanim dogrulanamadi)');
  if (run.usage_unknown) gaps.push('run-kullanimi-olculemedi (bilinmiyor ≠ bedava)');
  if (evidence.length === 0) gaps.push('kanit-yok (attempt→evidence kopuk)');
  else if (!evidence.some((e) => e.verdict === 'PASS')) gaps.push('PASS-kanit-yok (zincir dogrulanmis sonucla bitmiyor)');
  if (events.length === 0) gaps.push('olay-izi-yok (attempt→events kopuk)');

  return {
    runId: a.run_id, nodeId: a.node_id, nodeRole: node ? node.role : 'bilinmiyor',
    attemptId: a.id, attemptNumber: a.number, attemptState: a.state, fencingToken: a.fencing_token,
    parentActorId: cmd ? cmd.actor_id : null,
    externalSessionId: a.external_session_id ?? null, runtimeKind, leaseOwner: a.lease_owner ?? null,
    reservation: reservation ? { tokens: reservation.tokens, state: reservation.state } : null,
    usageUnknown, costAttribution, evidence, events, gaps, complete: gaps.length === 0,
  };
}
