// KPI telemetrisi — PUAN-METRIK-CERCEVESI v3.1'in 5 ana göstergesini DEFTERDEN türetir.
// Y5 sabitesi: ölçülemeyen "bilinmiyor" döner (ASLA 0/uydurma değil); alt-ajan kullanımı
// gözlenemiyorsa ölçülmüş kapasite gibi SUNULMAZ. Güvenlik/doğruluk kapısı düşerse
// hız/maliyet "kazanç" SAYILMAZ (credited=false). Tek kaynaq: events/runs/attempts/evidence.
import { DatabaseSync } from 'node:sqlite';

const one = <T = any>(db: DatabaseSync, sql: string, ...p: any[]): T => db.prepare(sql).get(...p) as T;
const all = <T = any>(db: DatabaseSync, sql: string, ...p: any[]): T[] => db.prepare(sql).all(...p) as T[];

export interface HeadlineKpis {
  verifiedDeliveries: number;                    // RUN_ACCEPTED (bağımsız kabul) sayısı
  humanInterventionsPerTask: number | 'bilinmiyor';
  vekilDecisions: number;                         // R3: grant altinda karara baglanmis approval (approvals.grant_id IS NOT NULL)
  costPerAcceptedWork: number | 'bilinmiyor';     // token/kabul; usage_unknown varsa bilinmiyor
  postDeliveryRegressionSignals: number;          // ACCEPTED sonrası aynı node ek attempt (sinyal)
  criticalSafetyViolations: string[];             // boş ⇒ güvenli
  unresolvedExternalState: number;                // reservation UNKNOWN (recovery riski)
  usageUnknownRuns: number;                       // maliyeti belirsiz koşu sayısı (0 sayılmaz)
  subagentUsage: 'bilinmiyor' | 'yok';            // içe-gömülü alt ajanlar gözlenemez
  speed: { acceptedPerHour: number | 'bilinmiyor'; credited: boolean };
  firstPassSuccessRate: number | 'bilinmiyor';    // ilk adayda geçen / başlayan node
  unmeasurable: string[];                          // hangi gösterge bilinmiyor (Y5 şeffaflık)
}

export function computeHeadlineKpis(db: DatabaseSync): HeadlineKpis {
  const totalRuns = one<{ c: number }>(db, 'SELECT COUNT(*) c FROM runs').c;
  const verifiedDeliveries = one<{ c: number }>(db, "SELECT COUNT(*) c FROM events WHERE type='RUN_ACCEPTED'").c;

  // --- kritik güvenlik / doğruluk ihlalleri ---
  const violations: string[] = [];
  const noApproval = all<{ run_id: string }>(db,
    `SELECT e.run_id FROM events e WHERE e.type='RUN_ACCEPTED'
     AND NOT EXISTS(SELECT 1 FROM approvals a WHERE a.run_id=e.run_id AND a.action='ACCEPT_RESULT' AND a.decision='APPROVED')`);
  if (noApproval.length) violations.push(`onaysiz-teslim (${noApproval.length} run: RUN_ACCEPTED ama APPROVED ACCEPT_RESULT yok)`);
  const noEvidence = one<{ c: number }>(db,
    `SELECT COUNT(*) c FROM attempts at WHERE at.state='ACCEPTED'
     AND NOT EXISTS(SELECT 1 FROM evidence ev WHERE ev.attempt_id=at.id AND ev.verdict='PASS')`).c;
  if (noEvidence) violations.push(`kanitsiz-accept (${noEvidence} ACCEPTED attempt'ta PASS kanit yok)`);
  const fakePass = one<{ c: number }>(db, "SELECT COUNT(*) c FROM evidence WHERE verdict='PASS' AND (exit_code<>0 OR test_count<=0)").c;
  if (fakePass) violations.push(`sahte-pass (${fakePass} PASS kanit exit0/test>0 degil)`);

  const unresolvedExternalState = one<{ c: number }>(db, "SELECT COUNT(*) c FROM reservations WHERE state='UNKNOWN'").c;
  const usageUnknownRuns = one<{ c: number }>(db, 'SELECT COUNT(*) c FROM runs WHERE usage_unknown=1').c;

  // --- maliyet / kabul edilen iş (usage-unknown ≠ bedava) ---
  const acceptedForCost = one<{ c: number }>(db, "SELECT COUNT(*) c FROM runs WHERE state='ACCEPTED'").c;
  const acceptedUsageUnknown = one<{ c: number }>(db, "SELECT COUNT(*) c FROM runs WHERE state='ACCEPTED' AND usage_unknown=1").c;
  const acceptedTokenSum = one<{ s: number }>(db, "SELECT COALESCE(SUM(spent_tokens),0) s FROM runs WHERE state='ACCEPTED'").s;
  const costPerAcceptedWork: number | 'bilinmiyor' =
    acceptedForCost === 0 ? 'bilinmiyor' : acceptedUsageUnknown > 0 ? 'bilinmiyor' : acceptedTokenSum / acceptedForCost;

  // --- insan müdahalesi / görev ---
  const humanCmds = one<{ c: number }>(db, "SELECT COUNT(*) c FROM commands WHERE actor_id NOT IN('core')").c;
  // R3 audit ayrismasi: yapisal grant_id kolonu ile (actor_id regex'ine guven YOK).
  const vekilDecisions = one<{ c: number }>(db, "SELECT COUNT(*) c FROM approvals WHERE grant_id IS NOT NULL AND decision<>'PENDING'").c;
  const humanInterventionsPerTask: number | 'bilinmiyor' = totalRuns === 0 ? 'bilinmiyor' : humanCmds / totalRuns;

  // --- ilk geçiş başarısı (node bazlı, attempt karıştırılmaz) ---
  const nodesStarted = one<{ c: number }>(db, 'SELECT COUNT(*) c FROM (SELECT run_id,node_id FROM attempts GROUP BY run_id,node_id)').c;
  const firstPass = one<{ c: number }>(db,
    `SELECT COUNT(*) c FROM (SELECT run_id,node_id,MIN(number) mn FROM attempts GROUP BY run_id,node_id) t
     JOIN attempts a ON a.run_id=t.run_id AND a.node_id=t.node_id AND a.number=t.mn WHERE a.state='ACCEPTED'`).c;
  const firstPassSuccessRate: number | 'bilinmiyor' = nodesStarted === 0 ? 'bilinmiyor' : firstPass / nodesStarted;

  // --- teslim sonrası regresyon sinyali (ilk-geçiş ile karıştırılmaz) ---
  const postDeliveryRegressionSignals = one<{ c: number }>(db,
    `SELECT COUNT(*) c FROM attempts a2 WHERE a2.number>1
     AND EXISTS(SELECT 1 FROM attempts a1 WHERE a1.run_id=a2.run_id AND a1.node_id=a2.node_id AND a1.state='ACCEPTED')`).c;

  // --- hız: kabul/saat — YALNIZ güvenlik kapısı geçerse kazanç sayılır ---
  let acceptedPerHour: number | 'bilinmiyor' = 'bilinmiyor';
  if (verifiedDeliveries > 0) {
    const spanH = one<{ h: number }>(db,
      `SELECT (julianday(MAX(created_at))-julianday(MIN(created_at)))*24 h FROM events WHERE type IN('RUN_CREATED','RUN_ACCEPTED')`).h;
    if (spanH > 0) acceptedPerHour = verifiedDeliveries / spanH;
  }
  const credited = violations.length === 0;

  const dispatchedAttempts = one<{ c: number }>(db, 'SELECT COUNT(*) c FROM attempts').c;
  const subagentUsage: 'bilinmiyor' | 'yok' = dispatchedAttempts > 0 ? 'bilinmiyor' : 'yok';

  const unmeasurable: string[] = [];
  if (costPerAcceptedWork === 'bilinmiyor') unmeasurable.push('maliyet/kabul');
  if (firstPassSuccessRate === 'bilinmiyor') unmeasurable.push('ilk-gecis-orani');
  if (acceptedPerHour === 'bilinmiyor') unmeasurable.push('teslim/saat');
  if (humanInterventionsPerTask === 'bilinmiyor') unmeasurable.push('insan-mudahale/gorev');
  if (subagentUsage === 'bilinmiyor') unmeasurable.push('alt-ajan-kullanimi (ice-gomulu gozlenemez)');

  return {
    verifiedDeliveries, humanInterventionsPerTask, vekilDecisions, costPerAcceptedWork,
    postDeliveryRegressionSignals, criticalSafetyViolations: violations,
    unresolvedExternalState, usageUnknownRuns, subagentUsage,
    speed: { acceptedPerHour, credited }, firstPassSuccessRate, unmeasurable,
  };
}
