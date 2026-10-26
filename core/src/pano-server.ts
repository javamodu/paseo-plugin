// pano-server — Paseo'dan bağımsız durum panosu (node:http, framework YOK, node builtin only).
// Yalnız 127.0.0.1'e bind olur; /api/* 'x-pano-token' ister (yanlış/eksik → 403);
// / ve /healthz tokensiz. Veri tek kaynaktan: store.ts tabloları + telemetry KPI'ları.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { DatabaseSync } from 'node:sqlite';
import { openStore, recordCommand, setGlobalStop } from './store.ts';
import { computeHeadlineKpis } from './telemetry.ts';
import { PANO_HTML } from './pano-ui.ts';

export interface PanoOptions {
  dbPath: string;
  port: number;
  authToken: string;
}

const one = (db: DatabaseSync, sql: string): any => db.prepare(sql).get();
const all = (db: DatabaseSync, sql: string): any[] => db.prepare(sql).all() as any[];

// lessons.jsonl / notify.jsonl okuma (plan 3. bolum: Ogrenme+Bildirim gorunurlugu).
// Dosya yoksa ya da satir bozuksa bos deger — pano fail-closed DEGIL, bos gorunum verir.
// Append-only defterde ayni id icin SON satir gecerli durumu tasir.
function readJsonlLines(path: string): any[] {
  if (!existsSync(path)) return [];
  let text = '';
  try { text = readFileSync(path, 'utf8'); } catch { return []; }
  const out: any[] = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try { out.push(JSON.parse(t)); } catch { /* bozuk satir atla */ }
  }
  return out;
}

function buildLessonsSummary(dir: string) {
  const events = readJsonlLines(join(dir, 'lessons.jsonl'));
  const byId = new Map<string, any>();
  for (const e of events) {
    if (e && e.lesson && typeof e.lesson.id === 'string') byId.set(e.lesson.id, e.lesson);
  }
  const dersler = [...byId.values()];
  const sonDersler = dersler
    .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
    .slice(0, 10)
    .map((d) => ({ id: d.id, kind: d.kind, state: d.state, expiry: d.expiresAt ?? null }));
  return {
    toplam: dersler.length,
    published: dersler.filter((d) => d.state === 'PUBLISHED').length,
    karantina: dersler.filter((d) => d.state === 'PROPOSED').length,
    sonDersler,
  };
}

function buildNotificationsSummary(dir: string) {
  const events = readJsonlLines(join(dir, 'notify.jsonl'));
  const byId = new Map<string, any>();
  for (const e of events) {
    if (e && e.record && typeof e.record.id === 'string') byId.set(e.record.id, e.record);
  }
  const kayitlar = [...byId.values()];
  const say = (st: string) => kayitlar.filter((r) => r.status === st).length;
  const sonBildirimler = kayitlar
    .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
    .slice(0, 10)
    .map((r) => ({ severity: r.severity, redakteMetin: r.title ?? '', state: r.status }));
  return { bekleyen: say('pending'), deferred: say('deferred'), dead: say('dead'), sonBildirimler };
}

// /api/status gövdesi — tüm alanlar defterden türetilir (uydurma veri yok):
// runs.updatedAt ← run'ın son olayı (runs tablosunda zaman damgası kolonu yok);
// pendingDecisions ← approvals(PENDING) + APPROVAL_REQUESTED olayının created_at'i.
function buildStatus(db: DatabaseSync, dataDir: string) {
  const globalStop = one(db, 'SELECT dispatch_paused FROM settings WHERE id=1').dispatch_paused === 1;
  const runs = all(db, `
    SELECT r.id, r.state, r.plan_id AS planId,
           r.spent_tokens AS spentTokens, r.max_reserved_tokens AS maxReservedTokens,
           (SELECT MAX(e.created_at) FROM events e WHERE e.run_id = r.id) AS updatedAt
    FROM runs r ORDER BY r.id`);
  const pendingDecisions = all(db, `
    SELECT a.run_id AS runId, a.action AS kind,
           (SELECT e.created_at FROM events e
             WHERE e.type = 'APPROVAL_REQUESTED'
               AND json_extract(e.payload_json, '$.approvalId') = a.id) AS createdAt
    FROM approvals a WHERE a.decision = 'PENDING'`);
  const unknownCount = one(db, "SELECT COUNT(*) c FROM reservations WHERE state='UNKNOWN'").c;
  const kpi = computeHeadlineKpis(db);
  const metrics = {
    verifiedDeliveries: kpi.verifiedDeliveries,
    humanInterventions: one(db, "SELECT COUNT(*) c FROM commands WHERE actor_id NOT IN('core')").c,
    criticalViolations: kpi.criticalSafetyViolations.length,
  };
  const lastEvents = all(db,
    'SELECT sequence, type, run_id AS runId, created_at AS createdAt FROM events ORDER BY sequence DESC LIMIT 10');
  const lessons = buildLessonsSummary(dataDir);
  const notifications = buildNotificationsSummary(dataDir);
  return { globalStop, runs, pendingDecisions, unknownCount, metrics, lastEvents, lessons, notifications };
}

function sendJson(res: ServerResponse, code: number, body: unknown) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const parts: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > 65536) { reject(new Error('govde cok buyuk')); req.destroy(); return; }
      parts.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(parts).toString('utf8')));
    req.on('error', reject);
  });
}

export async function createPanoServer(opts: PanoOptions): Promise<{ server: Server; port: number }> {
  if (opts.dbPath !== ':memory:') mkdirSync(dirname(opts.dbPath), { recursive: true });
  const db = openStore(opts.dbPath);
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      if (req.method === 'GET' && url.pathname === '/healthz') {
        res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('ok');
        return;
      }
      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(PANO_HTML);
        return;
      }
      if (!url.pathname.startsWith('/api/')) { sendJson(res, 404, { error: 'yok' }); return; }
      if (req.headers['x-pano-token'] !== opts.authToken) {
        sendJson(res, 403, { error: 'yetkisiz: x-pano-token gecersiz' });
        return;
      }
      if (req.method === 'GET' && url.pathname === '/api/status') { sendJson(res, 200, buildStatus(db, dirname(opts.dbPath))); return; }
      if (req.method === 'POST' && (url.pathname === '/api/stop' || url.pathname === '/api/resume')) {
        let body: any = {};
        try { body = JSON.parse((await readBody(req)) || '{}'); }
        catch { sendJson(res, 400, { error: 'gecersiz JSON govde' }); return; }
        if (url.pathname === '/api/stop') {
          if (body.confirm !== 'DURDUR') {
            sendJson(res, 400, { error: 'onay reddedildi: govde {"confirm":"DURDUR"} olmali' });
            return;
          }
          setGlobalStop(db, true, 'pano', typeof body.reason === 'string' ? body.reason : 'pano-acil-durdur');
          sendJson(res, 200, { stopped: true });
          return;
        }
        // resume: CLI ile aynı kapı — B01 CLEAR_STOP onay metni + komut kaydı + confirmationHash
        if (body.confirm !== 'I understand the risk') {
          sendJson(res, 400, { error: 'resume reddedildi: {"confirm":"I understand the risk"} gerekli (CLI ile ayni kapi)' });
          return;
        }
        const cmdr = recordCommand(db, {
          kind: 'CLEAR_STOP', actorId: 'pano',
          idempotencyKey: 'pano-resume-' + randomUUID(),
          payload: { reason: 'pano-resume', confirmText: 'I understand the risk' },
        } as any);
        if (cmdr.status !== 'ACCEPTED') { sendJson(res, 500, { error: 'komut kaydi reddedildi' }); return; }
        const confirmationHash = createHash('sha256').update('CLEAR_STOP|' + cmdr.commandId).digest('hex');
        setGlobalStop(db, false, 'pano', 'pano-resume', confirmationHash);
        sendJson(res, 200, { resumed: true, commandId: cmdr.commandId });
        return;
      }
      sendJson(res, 404, { error: 'yok' });
    } catch (e: any) {
      sendJson(res, 500, { error: 'sunucu hatasi: ' + String(e?.message ?? e) });
    }
  });
  server.on('close', () => { try { db.close(); } catch { /* zaten kapali */ } });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(opts.port, '127.0.0.1', () => resolve());
  });
  const port = (server.address() as AddressInfo).port;
  return { server, port };
}

// doğrudan çalıştırma: node src/pano-server.ts (env: ORDU_DB, ORDU_PANO_PORT, ORDU_PANO_TOKEN)
if (process.argv[1] && process.argv[1].endsWith('pano-server.ts')) {
  const authToken = process.env.ORDU_PANO_TOKEN ?? randomUUID();
  const { port } = await createPanoServer({
    dbPath: process.env.ORDU_DB ?? 'data/ordu.sqlite',
    // S2 (2026-10-26): varsayilan 8787 -> 8790 — 8787 deepseek-harness koprusu (yabanci surec) tarafindan
    // isgal edildi; varsayilan portta pano kalkamiyordu (EADDRINUSE). Testler port:0 kullanir (etkilenmez).
    port: Number(process.env.ORDU_PANO_PORT ?? 8790),
    authToken,
  });
  console.log('pano: http://127.0.0.1:' + port + '  (x-pano-token: ' + authToken + ')');
}
