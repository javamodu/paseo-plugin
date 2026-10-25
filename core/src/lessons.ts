// F6-A/F6-B ogrenme (lessons) modulu — plan §9.4.
// Ders yasam dongusu: PROPOSED(karantina) -> VALIDATING(eslenmis izole deney + skorcard)
//   -> PUBLISHED(insan onayi ONAY#2 ZORUNLU) / REJECTED; ayrica REVOKED ve EXPIRED.
// L1: kaynagi 'auto' olan not tek basina PROMOTE EDILEMEZ — publish yalniz VALIDATING'den,
//     o da ancak eslenmis deney skorcardi + insan onayiyla mumkun.
// L2: skorcard TAM PAYDA — basarisiz+atlandi+iptal+timeout dahil; oran = kabul/baslayan
//     (attempt sayisi basariyla KARISTIRILMAZ).
// F6-B: PUBLISHED derste canary (ilk N gorev) regresyon kontrolu; esik asilirsa
//     oto-REVOKE + geri-al event'i; insan onayi olmadan yeniden PUBLISHED olamaz.
// Veri-talimat ayrimi: TALIMAT dersinin ajan metni POLITIKA otoritesi OLAMAZ.
// Uygulama noktasi fail-closed: PUBLISHED olmayan / EXPIRED / REVOKED ders uygulanamaz.
// Kalicilik: lessons.jsonl append-only AYRI dosya (store.ts'e ve node:sqlite semasina
// DOKUNULMAZ); her append fsync'lenir; bozuk SON satir yuklemede budanir (tail-repair).
import {
  existsSync, mkdirSync, readFileSync,
  openSync, writeSync, fsyncSync, ftruncateSync, closeSync,
} from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export type LessonKind = 'VERI' | 'TALIMAT';
export type LessonSource = 'auto' | 'human' | 'retro';
export type LessonState = 'PROPOSED' | 'VALIDATING' | 'PUBLISHED' | 'REJECTED' | 'REVOKED' | 'EXPIRED';
export type AttemptDurum = 'kabul' | 'basarisiz' | 'atlandi' | 'iptal' | 'timeout';

export interface LessonScope { repoId: string; suiteId: string; surum: string; }

// Tam payda: baslayan = kabul + basarisiz + atlandi + iptal + timeout.
export interface Scorecard {
  baslayan: number;
  kabul: number;
  basarisiz: number;
  atlandi: number;
  iptal: number;
  timeout: number;
}

export interface Lesson {
  id: string;
  kind: LessonKind;
  source: LessonSource;
  text: string;
  evidenceRef: string;
  scope: LessonScope;
  expiresAt: string; // ISO 8601
  state: LessonState;
  scorecard: Scorecard | null;
  approvals: string[];
  canary: { kalan: number; bazOran: number; esik: number } | null;
  createdAt: string;
  updatedAt: string;
}

export type LessonEventTip =
  | 'proposed' | 'validated' | 'published' | 'rejected'
  | 'revoked' | 'expired' | 'geri-al' | 'canary-adim' | 'canary-kapandi';

export interface LessonEvent {
  event: LessonEventTip;
  at: string;
  lesson: Lesson;
  reason?: string;
}

export class LessonError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'LessonError';
    this.code = code;
  }
}

const red = (code: string, msg: string): never => { throw new LessonError(code, msg); };

// L2: basari orani = kabul / baslayan (attempt ile basari KARISTIRILMAZ).
export function basariOrani(s: Scorecard): number {
  return s.baslayan > 0 ? s.kabul / s.baslayan : 0;
}

export function assertTamPayda(s: Scorecard): void {
  const alanlar = ['baslayan', 'kabul', 'basarisiz', 'atlandi', 'iptal', 'timeout'] as const;
  for (const a of alanlar) {
    const v = (s as Scorecard)[a];
    if (!Number.isInteger(v) || v < 0)
      red('skorcard-gecersiz', `skorcard.${a} negatif olmayan tam sayi olmali: ${String(v)}`);
  }
  if (s.baslayan < 1)
    red('skorcard-gecersiz', 'skorcard.baslayan en az 1 olmali (bos deney kanit sayilmaz)');
  const payda = s.kabul + s.basarisiz + s.atlandi + s.iptal + s.timeout;
  if (payda !== s.baslayan)
    red('tam-payda', `tam payda bozuk: kabul+basarisiz+atlandi+iptal+timeout=${payda} != baslayan=${s.baslayan}`);
}

// Attempt durumlarindan skorcard uret; timeout AYRI sayilir (paydadan dusmez).
export function scorecardFromAttempts(durumlar: AttemptDurum[]): Scorecard {
  const s: Scorecard = { baslayan: durumlar.length, kabul: 0, basarisiz: 0, atlandi: 0, iptal: 0, timeout: 0 };
  for (const d of durumlar) {
    if (d === 'kabul') s.kabul++;
    else if (d === 'basarisiz') s.basarisiz++;
    else if (d === 'atlandi') s.atlandi++;
    else if (d === 'iptal') s.iptal++;
    else if (d === 'timeout') s.timeout++;
    else red('skorcard-gecersiz', `bilinmeyen attempt durumu: ${String(d)}`);
  }
  return s;
}

export interface ProposeInput {
  id?: string;
  kind: LessonKind;
  source?: LessonSource;
  text: string;
  evidenceRef: string;
  scope: LessonScope;
  expiresAt: string;
}

export interface LessonStoreOptions {
  now?: () => Date;
  canaryGorev?: number;    // varsayilan 3 (plan §9.4: canary ilk 3 gorev = regresyon kontrolu)
  regresyonEsigi?: number; // varsayilan 0.2 — baz orandan bu kadar dusus = regresyon
}

export interface LessonStore {
  path: string;
  propose(input: ProposeInput): Lesson;
  validate(id: string, experiment: (lesson: Lesson) => Scorecard): Lesson;
  publish(id: string, onay2: string): Lesson;
  reject(id: string, reason: string): Lesson;
  revoke(id: string, reason: string): Lesson;
  recordCanaryResult(id: string, s: Scorecard): Lesson;
  applyLesson(id: string, opts?: { asPolicy?: boolean }): Lesson;
  get(id: string): Lesson | undefined;
  list(): Lesson[];
  events(): LessonEvent[];
}

// Yukleme: append-only jsonl replay. Bozuk SON satir budanir (tail-repair);
// orta satir bozuksa fail-closed RED (sessiz onarim yok).
function loadAndRepair(path: string): LessonEvent[] {
  if (!existsSync(path)) return [];
  const buf = readFileSync(path);
  const satirlar: { start: number; text: string }[] = [];
  let start = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0a) {
      satirlar.push({ start, text: buf.subarray(start, i).toString('utf8') });
      start = i + 1;
    }
  }
  if (start < buf.length) satirlar.push({ start, text: buf.subarray(start).toString('utf8') });
  const out: LessonEvent[] = [];
  for (let i = 0; i < satirlar.length; i++) {
    const s = satirlar[i];
    if (s.text.trim() === '') continue;
    try {
      out.push(JSON.parse(s.text) as LessonEvent);
    } catch {
      if (i === satirlar.length - 1) {
        const fd = openSync(path, 'r+');
        try { ftruncateSync(fd, s.start); fsyncSync(fd); } finally { closeSync(fd); }
      } else {
        red('bozuk-kayit', `lessons.jsonl ortasinda bozuk satir (${i + 1}); yalniz son satir onarilabilir`);
      }
    }
  }
  return out;
}

export function openLessonStore(path: string, opts: LessonStoreOptions = {}): LessonStore {
  const now = opts.now ?? (() => new Date());
  const canaryGorev = opts.canaryGorev ?? 3;
  const regresyonEsigi = opts.regresyonEsigi ?? 0.2;
  if (!Number.isInteger(canaryGorev) || canaryGorev < 1)
    red('config-gecersiz', `canaryGorev pozitif tam sayi olmali: ${String(canaryGorev)}`);
  if (!Number.isFinite(regresyonEsigi) || regresyonEsigi <= 0 || regresyonEsigi > 1)
    red('config-gecersiz', `regresyonEsigi (0,1] araliginda olmali: ${String(regresyonEsigi)}`);

  mkdirSync(dirname(path), { recursive: true });
  const log: LessonEvent[] = loadAndRepair(path);
  const byId = new Map<string, Lesson>();
  for (const e of log) byId.set(e.lesson.id, e.lesson);

  function append(event: LessonEventTip, lesson: Lesson, reason?: string): void {
    const rec: LessonEvent = { event, at: now().toISOString(), lesson };
    if (reason !== undefined) rec.reason = reason;
    const fd = openSync(path, 'a');
    try {
      writeSync(fd, JSON.stringify(rec) + '\n');
      fsyncSync(fd); // kalicilik: append diske inmeden donme
    } finally {
      closeSync(fd);
    }
    log.push(rec);
    byId.set(lesson.id, lesson);
  }

  function mustGet(id: string): Lesson {
    const l = byId.get(id);
    if (!l) red('bulunamadi', `ders yok: ${id}`);
    return l;
  }

  // Expiry tembel (lazy) islenir: suresi dolan ders ilk dokunusta EXPIRED'a duser.
  function refreshExpiry(l: Lesson): Lesson {
    if ((l.state === 'PROPOSED' || l.state === 'VALIDATING' || l.state === 'PUBLISHED')
        && now().getTime() >= Date.parse(l.expiresAt)) {
      const nx: Lesson = Object.freeze({ ...l, state: 'EXPIRED' as LessonState, canary: null, updatedAt: now().toISOString() });
      append('expired', nx, 'expiry doldu');
      return nx;
    }
    return l;
  }

  function propose(input: ProposeInput): Lesson {
    if (!input || typeof input !== 'object') red('eksik-alan', 'propose input nesnesi zorunlu');
    if (input.kind !== 'VERI' && input.kind !== 'TALIMAT')
      red('eksik-alan', `kind 'VERI'|'TALIMAT' olmali: ${String(input.kind)}`);
    if (typeof input.text !== 'string' || input.text.trim() === '')
      red('eksik-alan', 'text zorunlu');
    if (typeof input.evidenceRef !== 'string' || input.evidenceRef.trim() === '')
      red('eksik-alan', 'kaynak kanit referansi (evidenceRef) zorunlu');
    const sc = input.scope;
    if (!sc || typeof sc.repoId !== 'string' || sc.repoId.trim() === ''
        || typeof sc.suiteId !== 'string' || sc.suiteId.trim() === ''
        || typeof sc.surum !== 'string' || sc.surum.trim() === '')
      red('eksik-alan', 'kapsam zorunlu: scope.{repoId,suiteId,surum}');
    if (typeof input.expiresAt !== 'string' || Number.isNaN(Date.parse(input.expiresAt)))
      red('eksik-alan', `expiry (expiresAt) gecerli ISO tarih olmali: ${String(input.expiresAt)}`);
    const id = input.id ?? randomUUID();
    if (byId.has(id)) red('cakisma', `ders id zaten var: ${id}`);
    const t = now().toISOString();
    const lesson: Lesson = Object.freeze({
      id, kind: input.kind, source: input.source ?? 'human', text: input.text,
      evidenceRef: input.evidenceRef, scope: Object.freeze({ ...sc }), expiresAt: input.expiresAt,
      state: 'PROPOSED' as LessonState, scorecard: null, approvals: [], canary: null,
      createdAt: t, updatedAt: t,
    });
    append('proposed', lesson);
    return lesson;
  }

  function validate(id: string, experiment: (lesson: Lesson) => Scorecard): Lesson {
    const l = refreshExpiry(mustGet(id));
    if (l.state !== 'PROPOSED')
      red('gecersiz-gecis', `validate yalniz PROPOSED'dan: ${id} (${l.state})`);
    if (typeof experiment !== 'function')
      red('gecersiz-gecis', 'eslenmis izole deney fonksiyonu enjekte edilmeli (gercek LLM/dis API yok)');
    const sc = experiment(l); // eslenmis izole deney — soyut fonksiyon enjeksiyonu
    assertTamPayda(sc);       // tam payda bozuksa deney kanit sayilmaz; ders PROPOSED'da kalir
    const nx: Lesson = Object.freeze({
      ...l, state: 'VALIDATING' as LessonState,
      scorecard: Object.freeze({ ...sc }), updatedAt: now().toISOString(),
    });
    append('validated', nx);
    return nx;
  }

  function publish(id: string, onay2: string): Lesson {
    const l = refreshExpiry(mustGet(id));
    if (l.state !== 'VALIDATING') {
      // L1: 'auto' kaynakli not dogrudan PUBLISHED'a GECEMEZ — once VALIDATING + insan onayi.
      if (l.source === 'auto' && l.state === 'PROPOSED')
        red('auto-promote-yasak', `L1: otomatik not dogrudan PUBLISHED olamaz; once VALIDATING + insan onayi: ${id}`);
      red('gecersiz-gecis', `publish yalniz VALIDATING'den: ${id} (${l.state})`);
    }
    if (!l.scorecard) red('gecersiz-gecis', `skorcard olmadan publish olmaz: ${id}`);
    if (typeof onay2 !== 'string' || onay2.trim() === '')
      red('onay-gerekli', `PUBLISHED icin insan onayi (ONAY#2) ZORUNLU: ${id}`);
    const nx: Lesson = Object.freeze({
      ...l, state: 'PUBLISHED' as LessonState,
      approvals: [...l.approvals, onay2],
      canary: Object.freeze({ kalan: canaryGorev, bazOran: basariOrani(l.scorecard), esik: regresyonEsigi }),
      updatedAt: now().toISOString(),
    });
    append('published', nx);
    return nx;
  }

  function reject(id: string, reason: string): Lesson {
    const l = refreshExpiry(mustGet(id));
    if (l.state !== 'PROPOSED' && l.state !== 'VALIDATING')
      red('gecersiz-gecis', `reject yalniz PROPOSED/VALIDATING'den: ${id} (${l.state})`);
    const nx: Lesson = Object.freeze({ ...l, state: 'REJECTED' as LessonState, updatedAt: now().toISOString() });
    append('rejected', nx, reason);
    return nx;
  }

  function revoke(id: string, reason: string): Lesson {
    const l = refreshExpiry(mustGet(id));
    if (l.state !== 'PUBLISHED')
      red('gecersiz-gecis', `revoke yalniz PUBLISHED'dan: ${id} (${l.state})`);
    const nx: Lesson = Object.freeze({ ...l, state: 'REVOKED' as LessonState, canary: null, updatedAt: now().toISOString() });
    append('revoked', nx, reason);
    return nx;
  }

  // F6-B: PUBLISHED dersin canary gorev sonucu. Baz orandan esik kadar dusus = regresyon
  // → oto-REVOKE + geri-al event'i; insan onayi olmadan yeniden PUBLISHED olamaz.
  function recordCanaryResult(id: string, s: Scorecard): Lesson {
    const l = refreshExpiry(mustGet(id));
    if (l.state !== 'PUBLISHED' || !l.canary)
      red('gecersiz-gecis', `canary yalniz PUBLISHED + aktif canary ile: ${id} (${l.state})`);
    assertTamPayda(s);
    const oran = basariOrani(s);
    const dusus = l.canary.bazOran - oran;
    if (dusus >= l.canary.esik) {
      const nx: Lesson = Object.freeze({ ...l, state: 'REVOKED' as LessonState, canary: null, updatedAt: now().toISOString() });
      append('geri-al', nx, `canary regresyonu oto-geri-al: oran=${oran} baz=${l.canary.bazOran} esik=${l.canary.esik}`);
      return nx;
    }
    const kalan = l.canary.kalan - 1;
    const nx: Lesson = Object.freeze({
      ...l,
      canary: kalan > 0 ? Object.freeze({ ...l.canary, kalan }) : null,
      updatedAt: now().toISOString(),
    });
    append(kalan > 0 ? 'canary-adim' : 'canary-kapandi', nx);
    return nx;
  }

  // Uygulama noktasi — FAIL-CLOSED: PUBLISHED olmayan / EXPIRED / REVOKED ders uygulanamaz.
  // Veri-talimat ayrimi: TALIMAT dersinin ajan metni POLITIKA otoritesi OLAMAZ.
  function applyLesson(id: string, a: { asPolicy?: boolean } = {}): Lesson {
    const l = refreshExpiry(mustGet(id));
    if (l.state !== 'PUBLISHED')
      red('ders-uygulanamaz', `ders uygulanamaz (state=${l.state}): ${id}`);
    if (a.asPolicy && l.kind === 'TALIMAT')
      red('talimat-politika-olamaz', `TALIMAT dersi politika otoritesi olamaz: ${id}`);
    return l;
  }

  return {
    path,
    propose, validate, publish, reject, revoke, recordCanaryResult, applyLesson,
    get: (id: string) => { const l = byId.get(id); return l ? refreshExpiry(l) : undefined; },
    list: () => [...byId.values()].map(refreshExpiry),
    events: () => log.slice(),
  };
}