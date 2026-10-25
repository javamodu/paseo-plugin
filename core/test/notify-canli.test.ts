// RT3 canlı bacak (FAZ-3 K2; triyaj raporlar/faz3-triyaj-2026-10-25.md): DÜRÜST
// GERÇEK webhook teslimi. Hermetik kol (notify.test.ts) sender-enjeksiyonuydu; burada
// sender GERÇEK ağ çağrısı yapar — loopback HTTP sunucusuna curl ile POST (senkron
// sözleşmeye uyan gerçek dış çağrı: exit≠0 → throw → retry/dead yolu GERÇEK bağlantı
// reddiyle işlenir).
// KRİTİK DERS: alıcı AYRI node sürecinde çalışır — NotifySender sözleşmesi SENKRONDUR;
// senkron exec (curl) test sürecinin event-loop'unu bloklar, aynı süreçteki sunucu
// isteği işleyemez → kendi kendine kilitlenme (curl 5sn timeout, sunucu "istek görmedi").
// Çözüm: alıcı child'ı (port dosyası yazar) + gönderen test sürecinde senkron curl.
// Kırmızı yollar (dedupe/conflict/quiet-hours/redakte birimleri) hermetik tarafta
// kanıtlı — burada tekrar EDİLMEZ. Redakte enqueue anındadır (tel VE disk orijinal
// sir GEÇMEZ).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openNotifyOutbox, type NotifySender } from '../src/notify.ts';

// Alıcı child: gerçek HTTP sunucusu; aldığı her isteği JSONL dosyaya yazar, port
// numarasını port-dosyasına yazar (test anketle öğrenir). 204 döner.
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

function aliciDogur(dir: string): { child: ChildProcess; portDosya: string; kayitDosya: string } {
  const portDosya = join(dir, 'alici-port.txt');
  const kayitDosya = join(dir, 'alici-kayit.jsonl');
  const script = join(dir, 'alici.cjs');
  writeFileSync(script, ALICI_KAYNAGI, 'utf8');
  const child = spawn(process.execPath, [script, portDosya, kayitDosya], { stdio: 'ignore' });
  return { child, portDosya, kayitDosya };
}

async function portuBekle(portDosya: string, ms = 10000): Promise<number> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (existsSync(portDosya)) return Number(readFileSync(portDosya, 'utf8').trim());
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('alici portu ' + ms + 'ms icinde yazilmadi');
}

// Gerçek webhook sender: loopback alıcıya GERÇEK HTTP POST (curl, senkron, exit≠0 throw).
function gercekWebhookSender(port: number): NotifySender {
  const url = 'http://127.0.0.1:' + port + '/hook';
  return (r) => {
    execFileSync('curl', [
      '-s', '-f', '--max-time', '5', '-X', 'POST',
      '-H', 'content-type: application/json',
      '--data', JSON.stringify({ id: r.id, severity: r.severity, title: r.title, body: r.body }),
      url,
    ], { stdio: 'ignore', windowsHide: true });
  };
}

function kayitlariOku(kayitDosya: string): { url: string; govde: any }[] {
  if (!existsSync(kayitDosya)) return [];
  return readFileSync(kayitDosya, 'utf8').split('\n').filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
}

test('RT3 canlı webhook: gerçek POST teslimi + tel ve disk üzerinde redakte + gerçek bağlantı-reddiyle retry→DEAD + dosyadan dirilen dedupe', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-rt3-'));
  const jsonl = join(dir, 'notify.jsonl');
  const alici = aliciDogur(dir);
  t.after(() => { try { alici.child.kill('SIGKILL'); } catch { /* zaten olabilir */ } });
  const port = await portuBekle(alici.portDosya);

  // 1) GERÇEK teslim: sir iceren govde — enqueue aninda redakte, tel ve disk temiz
  const o = openNotifyOutbox(jsonl, { sender: gercekWebhookSender(port) });
  const SIR = 'sk-CANLI-RT3-SEKRET-987';
  const rec = o.enqueue({
    dedupeKey: 'rt3-canli-1', severity: 'CRITICAL',
    title: 'RT3 canli teslim', body: 'pano raporu; token=pano-token-degeri ' + SIR,
  });
  const f1 = o.flush();
  assert.equal(f1.sent, 1, 'gerçek POST 204 → sent');
  assert.equal(f1.dead, 0);
  const gelen = kayitlariOku(alici.kayitDosya);
  assert.equal(gelen.length, 1, 'loopback alıcı (AYRI süreç) gerçek istek aldı');
  assert.equal(gelen[0].url, '/hook');
  assert.equal(gelen[0].govde.id, rec.id);
  const telGovde = JSON.stringify(gelen[0].govde);
  assert.ok(telGovde.includes('token=***'), 'telde redakte: token maskeli');
  assert.ok(!telGovde.includes(SIR) && !telGovde.includes('pano-token-degeri'), 'orijinal sir TELE gecmedi');
  const disk = readFileSync(jsonl, 'utf8');
  assert.ok(!disk.includes(SIR) && !disk.includes('pano-token-degeri'), 'orijinal sir DISKE dusmedi');
  assert.ok(o.get(rec.id)?.status === 'sent', 'kayıt sent');
  console.log('KANIT RT3-a: gerçek POST (port ' + port + ') teslim 204; tel+disk redakte; sent=1');

  // 2) GERÇEK başarısızlık: alıcıyı SIGKILL ile kapat → curl bağlantı reddi → retry→DEAD
  alici.child.kill('SIGKILL');
  await new Promise<void>((resolve) => {
    if (alici.child.exitCode !== null || alici.child.signalCode !== null) return resolve();
    alici.child.once('exit', () => resolve());
  });
  const o2 = openNotifyOutbox(jsonl, { sender: gercekWebhookSender(port), maxRetries: 3 });
  o2.enqueue({ dedupeKey: 'rt3-canli-2', severity: 'WARN', title: 'olu nokta', body: 'kapali port' });
  const r1 = o2.flush();
  assert.equal(r1.retried, 1, 'gerçek bağlantı reddi → 1. deneme retry');
  const r2 = o2.flush();
  assert.equal(r2.retried, 1, '2. deneme retry');
  const r3 = o2.flush();
  assert.equal(r3.dead, 1, '3. denemede DEAD (gerçek hata mesajıyla)');
  const olumlu = o2.list().find((x) => x.dedupeKey === 'rt3-canli-2');
  assert.equal(olumlu?.status, 'dead');
  assert.equal(olumlu?.attempts, 3);
  const olumOlay = o2.events().find((e) => e.event === 'dead');
  assert.ok(olumOlay?.reason?.includes('denemede basarisiz'), 'DEAD olayı gerçek hata nedeni taşır');
  assert.ok(olumOlay?.reason?.includes('Command failed: curl'), 'neden GERÇEK curl hatası (bağlantı reddi) içerir');
  console.log('KANIT RT3-b: gerçek bağlantı reddiyle retry 2 → DEAD (attempts=3); neden: ' + (olumOlay?.reason ?? ''));

  // 3) Dosyadan dirilme + dedupe dayanıklılığı: aynı dosya YENİ nesneden açılır
  const o3 = openNotifyOutbox(jsonl, { sender: gercekWebhookSender(port) });
  const ayni = o3.enqueue({
    dedupeKey: 'rt3-canli-1', severity: 'CRITICAL',
    title: 'RT3 canli teslim', body: 'pano raporu; token=pano-token-degeri ' + SIR,
  });
  assert.equal(ayni.id, rec.id, 'yeniden oynatma sonrası dedupe: aynı kayıt döner');
  assert.equal(o3.events().filter((e) => e.event === 'queued').length, 2, 'yeni queued yazılmadı (idempotent)');
  console.log('KANIT RT3-c: jsonl replay dedupe — ikinci enqueue yeni kayıt üretmedi');
});
