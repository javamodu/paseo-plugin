// S4 Bildirim CANLI bacagi (plan UYGULAMA-PLANI-SPRINT-2026-10-26 "Bildirim - gercek
// sender ucu"): uretim CLI yolu ('notify') uzerinden GERCEK ag teslimi. RT3 canli
// testinin alici-deseni (AYRI node sureci loopback HTTP sunucusu; DERSLER: senkron
// curl gondereni ayni surecteki sunucudan ayirir) + F6.5 kalibi (cliMain dogrudan
// cagrilsa da uretim kod yolu ayni): (1) enqueue+flush gercek POST 204 → sent;
// bildirim uretim yoluna (dirname(dbPath)/notify.jsonl) iner, (2) PANO GORUNURLUGU —
// /api/status gercek HTTP uzerinden ayni dosyadan okur (bekleyen 0, son bildirimler
// tablosunda gorunur), (3) alici olunce GERCEK baglanti reddi → retry (kayit
// 'pending' kalir, attempts=1, neden GERCEK curl hatasi) — uretim hata yolu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cliMain } from '../src/cli.ts';
import { createPanoServer } from '../src/pano-server.ts';

const ALICI_KAYNAGI = `
const http = require('node:http');
const fs = require('node:fs');
const [portDosya, kayitDosya] = process.argv.slice(2);
const s = http.createServer((req, res) => {
  let b = '';
  req.on('data', (c) => { b += c; });
  req.on('end', () => {
    fs.appendFileSync(kayitDosya, JSON.stringify({ url: req.url, govde: JSON.parse(b) }) + '\\n');
    res.writeHead(204);
    res.end();
  });
});
s.listen(0, '127.0.0.1', () => fs.writeFileSync(portDosya, String(s.address().port)));
setInterval(function(){}, 1 << 30);
`;

async function portuBekle(portDosya: string, ms = 10000): Promise<number> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (existsSync(portDosya)) return Number(readFileSync(portDosya, 'utf8').trim());
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('alici portu ' + ms + 'ms icinde yazilmadi');
}

function kayitlariOku(kayitDosya: string): { url: string; govde: any }[] {
  if (!existsSync(kayitDosya)) return [];
  return readFileSync(kayitDosya, 'utf8').split('\n').filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
}

test('S4 bildirim canli: uretim CLI notify → GERCEK POST teslimi + pano /api/status gorunurlugu + gercek baglanti reddi → retry', async (t) => {
  const d = mkdtempSync(join(tmpdir(), 'ordu-bildirim-canli-'));
  const dbPath = join(d, 'data', 'ordu.sqlite');
  const portDosya = join(d, 'alici-port.txt');
  const kayitDosya = join(d, 'alici-kayit.jsonl');
  writeFileSync(join(d, 'alici.cjs'), ALICI_KAYNAGI, 'utf8');
  const alici: ChildProcess = spawn(process.execPath, [join(d, 'alici.cjs'), portDosya, kayitDosya], { stdio: 'ignore' });
  t.after(() => { try { alici.kill('SIGKILL'); } catch { /* zaten olabilir */ } });
  const port = await portuBekle(portDosya);
  const url = 'http://127.0.0.1:' + port + '/hook';

  // 1) URETIM CLI: enqueue + flush — gercek curl POST, alici AYRI surecte (204)
  const r = await cliMain(
    ['notify', '--enqueue', '--severity', 'WARN', '--title', 'S4 bildirim canli', '--body', 'uretim sender ucu gercek teslim', '--dedupe-key', 'bildirim-canli-1'],
    { dbPath, env: { ORDU_NOTIFY_URL: url }, probePath: 'evidence/probe-latest.json' },
  );
  assert.equal(r.code, 0, JSON.stringify(r.out));
  const o = r.out as any;
  assert.equal(o.sent, 1, 'gercek POST 204 → sent');
  assert.equal(o.bekleyen, 0);
  const gelen = kayitlariOku(kayitDosya);
  assert.equal(gelen.length, 1, 'loopback alici gercek istek aldi');
  assert.equal(gelen[0].url, '/hook');
  assert.equal(gelen[0].govde.title, 'S4 bildirim canli');
  assert.equal(gelen[0].govde.id, o.queued.id, 'CLI kuyrukladigi kayit GERCEK telde ayni idyle teslim');
  console.log('KANIT S4-a: uretim CLI notify gercek POST (port ' + port + ') 204; sent=1; id=' + o.queued.id);

  // 2) PANO GORUNURLUGU: ayni uretim yolu (dirname(dbPath)/notify.jsonl) gercek
  // /api/status cagrisiyla okunur — bildirim pano yuzunde gorunur olur.
  const { server, port: panoPort } = await createPanoServer({ dbPath, port: 0, authToken: 'test-token-1' });
  t.after(() => { server.close(); });
  const res = await fetch('http://127.0.0.1:' + panoPort + '/api/status', { headers: { 'x-pano-token': 'test-token-1' } });
  assert.equal(res.status, 200);
  const durum = await res.json() as any;
  assert.equal(durum.notifications.bekleyen, 0, 'kuyruk bos — teslim diske sent olarak indi');
  assert.ok(durum.notifications.sonBildirimler.some((b: any) => b.redakteMetin === 'S4 bildirim canli' && b.state === 'sent'),
    'pano son bildirimler tablosunda sent kayit gorunur');
  console.log('KANIT S4-b: pano /api/status ayni dosyadan okudu — sonBildirimler sent kayit tasiyor');

  // 3) URETIM HATA YOLU: aliciyi SIGKILL → gercek baglanti reddi → retry (kayit pending kalir)
  alici.kill('SIGKILL');
  await new Promise<void>((resolve) => {
    if (alici.exitCode !== null || alici.signalCode !== null) return resolve();
    alici.once('exit', () => resolve());
  });
  const r2 = await cliMain(
    ['notify', '--enqueue', '--severity', 'WARN', '--title', 'olu nokta', '--body', 'kapali port', '--dedupe-key', 'bildirim-canli-2'],
    { dbPath, env: { ORDU_NOTIFY_URL: url }, probePath: 'evidence/probe-latest.json' },
  );
  assert.equal(r2.code, 0, 'flush ozeti doner; basarisizlik kayit durumu degil cikis kodu degil');
  const o2 = r2.out as any;
  assert.equal(o2.retried, 1, 'gercek baglanti reddi → 1. deneme retry');
  assert.equal(o2.bekleyen, 1, 'kayit pending kalir — bir sonraki flush adil yeniden dener');
  const disk = readFileSync(join(d, 'data', 'notify.jsonl'), 'utf8');
  const olaysiz = disk.split('\n').filter((l) => l.includes('"event":"retry"'));
  assert.equal(olaysiz.length, 1);
  assert.ok(olaysiz[0].includes('Command failed'), 'retry olayi GERCEK curl hatasi nedeni tasiyor');
  console.log('KANIT S4-c: gercek baglanti reddiyle retry (attempts=1, pending); neden: Command failed: curl');
});
