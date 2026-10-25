// D2 / M08-M10 — PROGRAMLIK (schedule) SAF mantık modülü. ÇEKİRDEĞİ KORUR:
// yeni komut/olay kind EKLEMEZ, DB/şemaya dokunmaz, dispatch etmez — yalnız
// "hangi occurrence şu an hak edildi" sorusunu DETERMINİSTİK ve FAIL-CLOSED yanıtlar.
// Uygulama (gerçek dispatch) supervisor.dispatchNode + mevcut START_RUN ile yapılır;
// buraya yalnız kapı mantığı girer. §8 v4.0: occurrence unique, misfire/overlap SKIP
// (catch-up fırtınası YOK), STOP/revoke/deadline dispatch anında YENİDEN kontrol.
// TZ dürüstlüğü: yalnız UTC. Günlük IANA/DST genişlemesi AYRI bir yetenektir; burada
// sessiz cron vaadi YOK — non-UTC → RED (uydurma determinizm yerine açık red).

export interface ScheduleSpec {
  scheduleId: string;
  revision: number;              // tanım revizyonu — değişirse occurrence kimliği değişir
  kind: 'ONCE' | 'INTERVAL';
  startAt: string;               // ISO UTC ("...Z"); epoch'tan itibaren ilk occurrence
  intervalMs?: number;           // INTERVAL için zorunlu, > 0
  deadlineAt?: string;           // ISO UTC; üst sınır (dahil)
  tz?: string;                   // yalnız 'UTC' kabul edilir
  maxOccurrences?: number;       // güvenlik tavanı (sonsuz döngü koruması)
}

export type SkipReason =
  | 'STOPPED' | 'GRANT_REVOKED' | 'DEADLINE_PASSED' | 'OVERLAP_SKIPPED' | 'MISFIRE_SKIPPED';

export interface GateState {
  stopLatched: boolean;          // A16: kalıcı dispatch mandalı
  grantActive: boolean;          // M11: grant kapsamı — iptal edilmişse dispatch YOK
  overlapActive: boolean;        // aynı schedule'ın önceki run'ı hâlâ aktif mi
  settled: Set<string>;          // M08: HEM üretilmiş HEM kalıcı-atlanmış occurrence anahtarları
}

export const iso = (d: Date) => d.toISOString();
const epoch = (s: string) => Date.parse(s);

// M08 — occurrence kimliği: (scheduleId, revision, scheduledUTC). Farklı revizyon =
// farklı kimlik; aynı an + aynı revizyon = AYNI occurrence (duplike reddedilir).
export function occurrenceKey(spec: ScheduleSpec, at: Date): string {
  return `${spec.scheduleId}|r${spec.revision}|${iso(at)}`;
}

export function validateScheduleSpec(s: ScheduleSpec): string[] {
  const e: string[] = [];
  if (!s.scheduleId) e.push('scheduleId boş');
  if (!Number.isInteger(s.revision) || s.revision < 0) e.push('revision negatif olmayan tam sayı');
  if (!(s.kind === 'ONCE' || s.kind === 'INTERVAL')) e.push('kind ONCE|INTERVAL olmalı');
  if (Number.isNaN(epoch(s.startAt))) e.push('startAt geçerli ISO değil');
  if (s.tz !== undefined && s.tz !== 'UTC') e.push('yalnız UTC desteklenir (DST sessiz vaat edilmez)');
  if (s.kind === 'INTERVAL' && !(typeof s.intervalMs === 'number' && s.intervalMs > 0)) e.push('INTERVAL için intervalMs > 0 zorunlu');
  if (s.deadlineAt !== undefined) {
    if (Number.isNaN(epoch(s.deadlineAt))) e.push('deadlineAt geçerli ISO değil');
    else if (epoch(s.deadlineAt) < epoch(s.startAt)) e.push('deadlineAt startAt önce olamaz');
  }
  if (s.maxOccurrences !== undefined && (!Number.isInteger(s.maxOccurrences) || s.maxOccurrences < 0)) e.push('maxOccurrences tam sayı >= 0');
  return e;
}

// M09 — DETERMİNİSTİK UTC sayımı: occurrence anları startAt + n*interval. Duvar saati/
// DST hiç işlenmez (yalnız UTC epoch), bu yüzden aynı girdi her zaman aynı listeyi verir.
export function occurrencesUpTo(spec: ScheduleSpec, nowMs: number): Date[] {
  const start = epoch(spec.startAt);
  const out: Date[] = [];
  if (spec.kind === 'ONCE') {
    if (start <= nowMs) out.push(new Date(start));
    return out;
  }
  const interval = spec.intervalMs as number;
  const cap = spec.maxOccurrences ?? 100000;
  for (let n = 0; n < cap; n++) {
    const t = start + n * interval;
    if (t > nowMs) break;
    out.push(new Date(t));
  }
  return out;
}

export interface PlanResult {
  emit: Date[];                 // dispatched edilmeye HAK eden (en fazla 1 — catch-up yok)
  skipped: { at: Date; reason: SkipReason }[];
}

// Ana kapı: planlanan occurrence'ları gate durumuna göre sınıflandırır.
// Fail-closed öncelik sırası: STOPPED > GRANT_REVOKED > DEADLINE_PASSED > (MISFIRE/OVERLAP) > DISPATCH.
export function planOccurrences(spec: ScheduleSpec, nowMs: number, gate: GateState): PlanResult {
  const errs = validateScheduleSpec(spec);
  if (errs.length) throw new Error('schedule spec geçersiz: ' + errs.join('; '));

  const all = occurrencesUpTo(spec, nowMs);
  // deadline üst sınırı (dahil): deadline'ı geçmiş occurrence'lar elenir.
  const deadlineMs = spec.deadlineAt !== undefined ? epoch(spec.deadlineAt) : Infinity;
  const eligible = all.filter((d) => d.getTime() <= deadlineMs);
  const pastDeadline = all.filter((d) => d.getTime() > deadlineMs);

  const skipped: { at: Date; reason: SkipReason }[] = pastDeadline.map((at) => ({ at, reason: 'DEADLINE_PASSED' as SkipReason }));

  // henüz üretilmemiş/yerleşmemiş olanlar (M08 dedupe).
  const fresh = eligible.filter((d) => !gate.settled.has(occurrenceKey(spec, d)));

  // GÜVENLİK önce: STOP mandalı veya revoke varsa HİÇBİR şey dispatch edilmez, geri kalan
  // ileri sürülmez (mandal açılınca yeniden planlanır; burada sessiz yutma yok ama emit boş).
  if (gate.stopLatched) {
    return { emit: [], skipped: fresh.map((at) => ({ at, reason: 'STOPPED' as SkipReason })) };
  }
  if (!gate.grantActive) {
    return { emit: [], skipped: fresh.map((at) => ({ at, reason: 'GRANT_REVOKED' as SkipReason })) };
  }

  if (fresh.length === 0) return { emit: [], skipped };

  // M10 — MISFIRE catch-up fırtınası YOK: üretilmemiş geçmiş occurrence'lardan yalnız
  // EN SONUNCU hak eder; aradaki kaçanlar MISFIRE_SKIPPED. (Zamanlanmış ONCE tek olduğundan
  // catch-up yalnız INTERVAL için anlam taşır.)
  const due = fresh[fresh.length - 1];
  for (let i = 0; i < fresh.length - 1; i++) skipped.push({ at: fresh[i], reason: 'MISFIRE_SKIPPED' });

  // M10 — OVERLAP: önceki run hâlâ aktifse yeni üst üste BİNMEZ; atlanır (default skip).
  if (gate.overlapActive) {
    skipped.push({ at: due, reason: 'OVERLAP_SKIPPED' });
    return { emit: [], skipped };
  }
  return { emit: [due], skipped };
}

// Çağrayan scheduler döngüsü her turda bu anahtarları `settled`e EKLEMELİ ki kaçan
// occurrence'lar yüzmesin. Yalnız KALıcı eleneler yerleştirilir:
//  - emit edilenler
//  - MISFIRE_SKIPPED (catch-up fırtınası yok — eski kaçanlar bir daha denmez)
//  - DEADLINE_PASSED (deadline geçti — artık hiç hak edemez)
// STOPPED / GRANT_REVOKED / OVERLAP_SKIPPED YERLEŞTİRİLMEZ: mandal/revoke kalkınca veya
// önceki run bitince AYNI occurrence yeniden denenir (adil; güvenlik-redi kalıcı silme değil).
export function settleKeys(spec: ScheduleSpec, result: PlanResult): string[] {
  const keys = result.emit.map((d) => occurrenceKey(spec, d));
  for (const s of result.skipped) {
    if (s.reason === 'MISFIRE_SKIPPED' || s.reason === 'DEADLINE_PASSED') keys.push(occurrenceKey(spec, s.at));
  }
  return keys;
}
