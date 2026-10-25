// M07/RT3 — dayanikli bildirim outbox (plan §9.6: durable outbox, dedupe+severity+
// quiet-hours; LLM poll YOK — saf zamanlayici/manuel flush).
// Kalicilik: notify.jsonl append-only AYRI dosya (store.ts'e ve node:sqlite semasina
// DOKUNULMAZ); her append fsync'lenir; bozuk SON satir yuklemede budanir (tail-repair),
// orta satir bozuksa fail-closed RED (lessons.ts deseni).
// Dedupe: ayni dedupeKey + ayni icerik = idempotent (ikinci kez KAYDEDILMEZ);
// ayni dedupeKey + farkli icerik = CONFLICT RED.
// Severity kapali kume: 'INFO'|'WARN'|'CRITICAL'; bilinmeyen severity RED.
// Quiet-hours: parametrik (ornek 23:00-07:00 Europe/Istanbul); sessiz saatte INFO/WARN
// GONDERILMEZ, kuyruga 'deferred' yazilir; CRITICAL her zaman gecer. Zaman enjekte
// edilir (opts.now) — duvar saatine bagli mantik YOK.
// Redakte: govde/baslik metninde sir desenleri (token=, Bearer , sk-, x-pano-token,
// password=) append'ten ONCE maskelenir (***) — orijinal sir diske DUSMEZ.
// Gonderim: sender fonksiyonu enjekte edilir (webhook/SSE taklidi); hata → sinirli
// retry (max 3) → DEAD. Gercek dis cagri bu modulde YOK.
import {
  existsSync, mkdirSync, readFileSync,
  openSync, writeSync, fsyncSync, ftruncateSync, closeSync,
} from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

export type Severity = 'INFO' | 'WARN' | 'CRITICAL';
const SEVERITIES: readonly Severity[] = ['INFO', 'WARN', 'CRITICAL'];

export type NotifyStatus = 'pending' | 'deferred' | 'sent' | 'dead';

export interface NotifyRecord {
  id: string;
  dedupeKey: string;
  contentHash: string;       // redakte SONRASI icerigin sha256'si (dedupe conflict kaniti)
  severity: Severity;
  title: string;             // redakte edilmis
  body: string;              // redakte edilmis
  status: NotifyStatus;
  attempts: number;          // toplam gonderim denemesi
  createdAt: string;
  updatedAt: string;
}

export type NotifyEventTip = 'queued' | 'deferred' | 'sent' | 'retry' | 'dead';

export interface NotifyEvent {
  event: NotifyEventTip;
  at: string;
  record: NotifyRecord;
  reason?: string;
}

export interface QuietHours {
  start: string;    // "HH:MM" (24s, yerel)
  end: string;      // "HH:MM"; start==end → sessiz saat YOK; start>end → geceyari sarmali
  timezone: string; // IANA (ornek 'Europe/Istanbul')
}

export interface NotifyInput {
  id?: string;
  dedupeKey: string;
  severity: Severity;
  title: string;
  body: string;
}

// webhook/SSE taklidi — senkron; hata firlatarak basarisizlik bildirir.
export type NotifySender = (record: NotifyRecord) => void;

export interface NotifyOutboxOptions {
  now?: () => Date;                       // zaman enjeksiyonu (test duvardan bagimsiz)
  sender?: NotifySender;                  // flush icin zorunlu
  quietHours?: QuietHours | null;         // null → sessiz saat yok
  maxRetries?: number;                    // varsayilan 3 (plan: sinirli retry → DEAD)
}

export interface NotifyOutbox {
  path: string;
  enqueue(input: NotifyInput): NotifyRecord;
  flush(): { sent: number; deferred: number; retried: number; dead: number };
  get(id: string): NotifyRecord | undefined;
  list(): NotifyRecord[];
  events(): NotifyEvent[];
}

export class NotifyError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'NotifyError';
    this.code = code;
  }
}

const red = (code: string, msg: string): never => { throw new NotifyError(code, msg); };

// Sir desenleri: append'ten once maskelenir; maske sonrasi orijinal sir diske DUSMEZ.
const SECRET_PATTERNS: [RegExp, string][] = [
  [/\btoken=[^\s&"']+/gi, 'token=***'],
  [/\bpassword=[^\s&"']+/gi, 'password=***'],
  [/\bBearer\s+\S+/gi, 'Bearer ***'],
  [/\bsk-[A-Za-z0-9_-]{4,}/g, '***'],
  [/\bx-pano-token\s*[:=]\s*\S+/gi, 'x-pano-token=***'],
];

export function redactSecrets(text: string): string {
  let out = text;
  for (const [re, rep] of SECRET_PATTERNS) out = out.replace(re, rep);
  return out;
}

function parseHHMM(s: string, alan: string): number {
  const m = /^(\d{2}):(\d{2})$/.exec(s);
  if (!m) red('config-gecersiz', `quietHours.${alan} "HH:MM" olmali: ${String(s)}`);
  const h = Number(m[1]);
  const d = Number(m[2]);
  if (h > 23 || d > 59) red('config-gecersiz', `quietHours.${alan} gecersiz saat: ${String(s)}`);
  return h * 60 + d;
}

function localMinutesAt(d: Date, timezone: string): number {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(d);
  } catch {
    red('config-gecersiz', `quietHours.timezone gecersiz IANA bolgesi: ${String(timezone)}`);
  }
  const saat = Number(parts!.find((p) => p.type === 'hour')!.value);
  const dakika = Number(parts!.find((p) => p.type === 'minute')!.value);
  return saat * 60 + dakika;
}

// Sarmal aralik destekli (23:00-07:00 geceyarisini asar). Sinirlar: start dahil, end haric.
export function isQuietHours(at: Date, q: QuietHours): boolean {
  const start = parseHHMM(q.start, 'start');
  const end = parseHHMM(q.end, 'end');
  if (start === end) return false;
  const m = localMinutesAt(at, q.timezone);
  return start < end ? (m >= start && m < end) : (m >= start || m < end);
}

// Yukleme: append-only jsonl replay. Bozuk SON satir budanir (tail-repair);
// orta satir bozuksa fail-closed RED (sessiz onarim yok).
function loadAndRepair(path: string): NotifyEvent[] {
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
  const out: NotifyEvent[] = [];
  for (let i = 0; i < satirlar.length; i++) {
    const s = satirlar[i];
    if (s.text.trim() === '') continue;
    try {
      out.push(JSON.parse(s.text) as NotifyEvent);
    } catch {
      if (i === satirlar.length - 1) {
        const fd = openSync(path, 'r+');
        try { ftruncateSync(fd, s.start); fsyncSync(fd); } finally { closeSync(fd); }
      } else {
        red('bozuk-kayit', `notify.jsonl ortasinda bozuk satir (${i + 1}); yalniz son satir onarilabilir`);
      }
    }
  }
  return out;
}

export function openNotifyOutbox(path: string, opts: NotifyOutboxOptions = {}): NotifyOutbox {
  const now = opts.now ?? (() => new Date());
  const sender = opts.sender;
  const quietHours = opts.quietHours ?? null;
  const maxRetries = opts.maxRetries ?? 3;
  if (!Number.isInteger(maxRetries) || maxRetries < 1)
    red('config-gecersiz', `maxRetries pozitif tam sayi olmali: ${String(maxRetries)}`);
  if (quietHours) {
    parseHHMM(quietHours.start, 'start');
    parseHHMM(quietHours.end, 'end');
    localMinutesAt(now(), quietHours.timezone); // timezone'u acilista dogrula (fail-fast)
  }

  mkdirSync(dirname(path), { recursive: true });
  const log: NotifyEvent[] = loadAndRepair(path);
  const byId = new Map<string, NotifyRecord>();
  const byKey = new Map<string, string>(); // dedupeKey -> id
  for (const e of log) {
    byId.set(e.record.id, e.record);
    if (e.event === 'queued') byKey.set(e.record.dedupeKey, e.record.id);
  }

  function append(event: NotifyEventTip, record: NotifyRecord, reason?: string): void {
    const rec: NotifyEvent = { event, at: now().toISOString(), record };
    if (reason !== undefined) rec.reason = reason;
    const fd = openSync(path, 'a');
    try {
      writeSync(fd, JSON.stringify(rec) + '\n');
      fsyncSync(fd); // kalicilik: append diske inmeden donme
    } finally {
      closeSync(fd);
    }
    log.push(rec);
    byId.set(record.id, record);
    if (event === 'queued') byKey.set(record.dedupeKey, record.id);
  }

  function enqueue(input: NotifyInput): NotifyRecord {
    if (!input || typeof input !== 'object') red('eksik-alan', 'enqueue input nesnesi zorunlu');
    if (typeof input.dedupeKey !== 'string' || input.dedupeKey.trim() === '')
      red('eksik-alan', 'dedupeKey zorunlu');
    if (!SEVERITIES.includes(input.severity))
      red('severity-gecersiz', `severity 'INFO'|'WARN'|'CRITICAL' olmali: ${String(input.severity)}`);
    if (typeof input.title !== 'string' || input.title.trim() === '')
      red('eksik-alan', 'title zorunlu');
    if (typeof input.body !== 'string')
      red('eksik-alan', 'body metin olmali');
    // Redakte append'ten ONCE: orijinal sir ne diske ne contentHash'e duser.
    const title = redactSecrets(input.title);
    const body = redactSecrets(input.body);
    const contentHash = createHash('sha256')
      .update(JSON.stringify([input.severity, title, body]))
      .digest('hex');
    const mevcutId = byKey.get(input.dedupeKey);
    if (mevcutId !== undefined) {
      const mevcut = byId.get(mevcutId)!;
      if (mevcut.contentHash !== contentHash)
        red('dedupe-cakisma', `dedupeKey farkli icerikle yeniden kullanildi: ${input.dedupeKey}`);
      return mevcut; // idempotent: ayni icerik ikinci kez KAYDEDILMEZ
    }
    const id = input.id ?? randomUUID();
    if (byId.has(id)) red('cakisma', `bildirim id zaten var: ${id}`);
    const t = now().toISOString();
    const record: NotifyRecord = Object.freeze({
      id, dedupeKey: input.dedupeKey, contentHash, severity: input.severity,
      title, body, status: 'pending' as NotifyStatus, attempts: 0,
      createdAt: t, updatedAt: t,
    });
    append('queued', record);
    return record;
  }

  // Saf zamanlayici/manuel flush — LLM poll YOK. Idempotent: 'sent'/'dead' kayitlar
  // yeniden gonderilmez; sessiz saatte zaten 'deferred' olan kayda tekrar event yazilmaz.
  function flush(): { sent: number; deferred: number; retried: number; dead: number } {
    const quiet = quietHours ? isQuietHours(now(), quietHours) : false;
    const ozet = { sent: 0, deferred: 0, retried: 0, dead: 0 };
    for (const r of [...byId.values()]) {
      if (r.status !== 'pending' && r.status !== 'deferred') continue;
      if (quiet && r.severity !== 'CRITICAL') {
        if (r.status !== 'deferred') {
          const nx: NotifyRecord = Object.freeze({ ...r, status: 'deferred' as NotifyStatus, updatedAt: now().toISOString() });
          append('deferred', nx, 'quiet-hours aktif');
          ozet.deferred++;
        }
        continue;
      }
      if (!sender)
        red('sender-yok', 'flush icin sender enjekte edilmeli (gercek dis cagri bu modulde YOK)');
      try {
        sender(r);
      } catch (err) {
        const attempts = r.attempts + 1;
        const reason = err instanceof Error ? err.message : String(err);
        if (attempts >= maxRetries) {
          const nx: NotifyRecord = Object.freeze({ ...r, status: 'dead' as NotifyStatus, attempts, updatedAt: now().toISOString() });
          append('dead', nx, `gonderim ${maxRetries} denemede basarisiz: ${reason}`);
          ozet.dead++;
        } else {
          const nx: NotifyRecord = Object.freeze({ ...r, attempts, updatedAt: now().toISOString() });
          append('retry', nx, reason);
          ozet.retried++;
        }
        continue;
      }
      const nx: NotifyRecord = Object.freeze({
        ...r, status: 'sent' as NotifyStatus, attempts: r.attempts + 1, updatedAt: now().toISOString(),
      });
      append('sent', nx);
      ozet.sent++;
    }
    return ozet;
  }

  return {
    path,
    enqueue,
    flush,
    get: (id: string) => byId.get(id),
    list: () => [...byId.values()],
    events: () => log.slice(),
  };
}