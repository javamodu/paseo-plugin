// S4 BILDIRIM (plan UYGULAMA-PLANI-SPRINT-2026-10-26 "Bildirim - gercek sender ucu;
// outbox zaten sağlam"): notify.ts "gerçek dış çağrı bu modülde YOK" sözünü üretim
// tarafında tamamlayan uç. İKİ parça:
// (1) makeWebhookSender — SENKRON NotifySender sözleşmesiyle GERÇEK HTTP POST
//     (curl + execFileSync; RT3 canlı testinin kanıtlanmış kalıbı — DERSLER:
//     senkron gönderen alıcıdan AYRI süreçte yaşar). exit≠0 → throw → notify
//     retry/DEAD yolu. Hata mesajı webhook URL'sinden ARINDIRILIR: URL sorgu
//     parçasında anahtar taşıyabilir; retry/dead 'reason' alanı diske (jsonl)
//     düşer — orijinal URL orada ASLA görünmez (maske ***).
// (2) openProductionNotify — üretim outbox fabrikası. Yol pano-server ile AYNI
//     kökte: dirname(dbPath)/notify.jsonl (pano /api/status görünürlüğü birebir).
//     ENV sözleşmesi: ORDU_NOTIFY_URL (http/https; YOK → sender enjekte EDİLMEZ —
//     sessiz no-op yok, flush 'sender-yok' RED) · ORDU_NOTIFY_TIMEOUT_MS (curl
//     --max-time, varsayılan 5000) · ORDU_NOTIFY_QUIET ("HH:MM-HH:MM"; boş/yok →
//     sessiz saat kapalı) · ORDU_NOTIFY_TZ (varsayılan Europe/Istanbul; IANA
//     doğrulaması notify.ts açılışta fail-fast). Geçersiz env → RED (fail-closed
//     config — sessiz varsayılara düşüş yok).
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { openNotifyOutbox, type NotifyOutbox, type NotifySender, type QuietHours } from './notify.ts';

export type ExecSync = (file: string, args: string[]) => void;

class SenderError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'SenderError';
    this.code = code;
  }
}

const red = (code: string, msg: string): never => { throw new SenderError(code, msg); };

// Bildirim gövdesi (RT3 kalıbı birebir): id/severity/title/body. Kayıt durumu
// GÖNDERİLMEZ (flush anında 'sent' olurdu — alıcı bayat durum görmez).
const webhookPayload = (r: { id: string; severity: string; title: string; body: string }) =>
  JSON.stringify({ id: r.id, severity: r.severity, title: r.title, body: r.body });

export function makeWebhookSender(url: string, o: { timeoutMs?: number; execSync?: ExecSync } = {}): NotifySender {
  let u: URL;
  try { u = new URL(url); }
  catch { red('config-gecersiz', "ORDU_NOTIFY_URL gecerli bir URL olmali: " + String(url)); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:')
    red('config-gecersiz', "ORDU_NOTIFY_URL http/https olmali: " + u.protocol);
  const timeoutMs = o.timeoutMs ?? 5000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1)
    red('config-gecersiz', "ORDU_NOTIFY_TIMEOUT_MS pozitif tam sayi olmali (ms): " + String(timeoutMs));
  const execSync = o.execSync ?? ((file: string, args: string[]) => {
    execFileSync(file, args, { stdio: 'ignore', windowsHide: true });
  });
  return (r) => {
    try {
      execSync('curl', [
        '-s', '-f', '--max-time', String(Math.ceil(timeoutMs / 1000)),
        '-X', 'POST', '-H', 'content-type: application/json',
        '--data', webhookPayload(r), url,
      ]);
    } catch (e: any) {
      // URL (ve sorgu parçasindaki olasi sir) diski yazan reason'dan ARINDIRILIR.
      const raw = e instanceof Error ? e.message : String(e);
      throw new Error(raw.split(url).join('***'));
    }
  };
}

// Pano-server ile AYNI kök (pano-server.ts:143 buildStatus -> dirname(dbPath)):
// bildirim once DISKE iner, pano oradan okur — iki ucun yol sözleşmesi tek yerde.
export function notifyPathOf(dbPath: string): string {
  return join(dirname(dbPath), 'notify.jsonl');
}

// "HH:MM-HH:MM" → QuietHours; boş/yok → null; bozuk → RED.
export function parseQuietEnv(env: NodeJS.ProcessEnv): QuietHours | null {
  const v = env.ORDU_NOTIFY_QUIET;
  if (v === undefined || v.trim() === '') return null;
  const m = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(v.trim());
  if (!m) red('config-gecersiz', "ORDU_NOTIFY_QUIET \"HH:MM-HH:MM\" olmali: " + String(v));
  return { start: m[1], end: m[2], timezone: env.ORDU_NOTIFY_TZ ?? 'Europe/Istanbul' };
}

export function openProductionNotify(
  dbPath: string,
  env: NodeJS.ProcessEnv,
  o: { now?: () => Date; execSync?: ExecSync } = {},
): { outbox: NotifyOutbox; urlSet: boolean; url?: string } {
  const url = env.ORDU_NOTIFY_URL;
  const timeoutMs = env.ORDU_NOTIFY_TIMEOUT_MS !== undefined ? Number(env.ORDU_NOTIFY_TIMEOUT_MS) : undefined;
  const quiet = parseQuietEnv(env);
  if (url !== undefined && url.trim() === '')
    red('config-gecersiz', 'ORDU_NOTIFY_URL bos — ayarli degilse env tamamen kaldirilmali (sessiz no-op yok)');
  const outbox = openNotifyOutbox(notifyPathOf(dbPath), {
    ...(o.now ? { now: o.now } : {}),
    ...(quiet ? { quietHours: quiet } : {}),
    ...(url ? { sender: makeWebhookSender(url, { timeoutMs, execSync: o.execSync }) } : {}),
  });
  return { outbox, urlSet: Boolean(url), ...(url ? { url } : {}) };
}
