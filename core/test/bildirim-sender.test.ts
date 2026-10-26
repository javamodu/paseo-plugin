// S4 Bildirim — uretim sender ucu hermetik sinavi (plan: "gercek sender ucu; outbox
// zaten saglam"). notify.ts/outbox sozlesmesi (dedupe/quiet-hours/retry-DEAD/redakte)
// notify.test.ts + notify-canli.test.ts tarafindan KANITLI — burada YENI uclar:
// (1) makeWebhookSender URL kapisı + curl cagri bicimi + HATA MASKELEME (webhook URL
//     sorgu parcasinda sir tasiyabilir; retry/dead 'reason' DISKI yazilir — orijinal
//     URL orada ASLA gormemeli), (2) openProductionNotify yol/env girisimi (pano ile
//     ayni kok), (3) CLI 'notify' komutu (URL yok → durumust RED; enjeksiyonlu exec ile
//     enqueue+flush). Gercek ag cagi bildirim-canli.test.ts'te.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { makeWebhookSender, openProductionNotify, notifyPathOf, parseQuietEnv } from '../src/sender.ts';
import { cliMain } from '../src/cli.ts';

const gecis = () => {}; // basari: throw yok
const dir = () => mkdtempSync(join(tmpdir(), 'ordu-bildirim-'));

test('S4 sender: URL kapisu — http/https disi ve bozuk URL fail-closed RED', () => {
  assert.throws(() => makeWebhookSender('ftp://ornek.test/hook'), /ORDU_NOTIFY_URL http\/https olmali/);
  assert.throws(() => makeWebhookSender('http'), /ORDU_NOTIFY_URL gecerli bir URL olmali/);
  assert.throws(() => makeWebhookSender(''), /ORDU_NOTIFY_URL gecerli bir URL olmali/);
  // timeout kapisu: pozitif tam sayi degilse RED
  assert.throws(() => makeWebhookSender('http://127.0.0.1:9/hook', { timeoutMs: 0 }), /ORDU_NOTIFY_TIMEOUT_MS pozitif/);
  assert.throws(() => makeWebhookSender('http://127.0.0.1:9/hook', { timeoutMs: 1.5 }), /ORDU_NOTIFY_TIMEOUT_MS pozitif/);
});

test('S4 sender: curl cagri bicimi — POST + JSON govde + max-time; govde kayit durumunu TASIMAZ', () => {
  const cagrilar: { file: string; args: string[] }[] = [];
  const exec = (file: string, args: string[]) => { cagrilar.push({ file, args }); };
  const sender = makeWebhookSender('http://127.0.0.1:9/hook', { timeoutMs: 5000, execSync: exec });
  const rec = { id: 'b-1', dedupeKey: 'k', contentHash: 'x', severity: 'WARN', title: 't', body: 'b', status: 'pending', attempts: 0, createdAt: '', updatedAt: '' };
  sender(rec as any);
  assert.equal(cagrilar.length, 1);
  assert.equal(cagrilar[0].file, 'curl');
  const args = cagrilar[0].args;
  assert.ok(args.includes('-X') && args.includes('POST'), 'POST yazilim');
  assert.ok(args.includes('--max-time') && args.includes('5'), 'timeout ms -> saniye tavana (5000 -> 5)');
  const i = args.indexOf('--data');
  const govde = JSON.parse(args[i + 1]);
  assert.deepEqual(Object.keys(govde).sort(), ['body', 'id', 'severity', 'title'], 'RT3 kalibi: id/severity/title/body — durum GONDERILMEZ');
  assert.equal(govde.id, 'b-1');
  assert.equal(args[args.length - 1], 'http://127.0.0.1:9/hook', 'URL son arguman');
});

test('S4 sender: HATA MASKELEME — curl hatasinin mesajindaki webhook URL si diski yazan reasona DUSMEZ', () => {
  const SIR_URL = 'https://hook.ornek.test/x?token=sk-BILDIRIM-SEKRET-123';
  const exec = () => { throw new Error('Command failed: curl -s -f --max-time 5 ' + SIR_URL + ' kod 7'); };
  const sender = makeWebhookSender(SIR_URL, { execSync: exec });
  let yakalanan: any;
  try { sender({ id: 'b', severity: 'WARN', title: 't', body: 'b' } as any); }
  catch (e) { yakalanan = e; }
  assert.ok(yakalanan instanceof Error, 'exec hatasi yeniden firlatildi (notify retry/DEAD yolu calisir)');
  assert.ok(!yakalanan.message.includes(SIR_URL), 'ORIJINAL URL hata mesajinda YOK');
  assert.ok(yakalanan.message.includes('***'), 'URL *** ile maskelendi');
  assert.ok(yakalanan.message.includes('kod 7'), 'maskeleme tanimayi (curl cikis kodu) korur');
});

test('S4 uretim fabrikasi: yol pano-server ile ayni kok — URL yokken sender yok, flush fail-closed', () => {
  const d = dir();
  const dbPath = join(d, 'data', 'ordu.sqlite');
  assert.equal(notifyPathOf(dbPath), join(d, 'data', 'notify.jsonl'), 'pano buildStatus dirname(dbPath) okur — yol sozlesmesi tek');
  const p = openProductionNotify(dbPath, {});
  assert.equal(p.urlSet, false, 'ORDU_NOTIFY_URL yok -> sender enjekte EDILMEDI');
  p.outbox.enqueue({ dedupeKey: 'k1', severity: 'INFO', title: 't', body: 'b' }); // kuyruk calisir
  assert.throws(() => p.outbox.flush(), /sender enjekte edilmeli/, 'flush fail-closed RED (sessiz no-op yok)');
  assert.ok(existsSync(join(d, 'data', 'notify.jsonl')), 'kuyruk diske indi (pano okuyabilir)');
  // bos string URL de RED: ayar yoksa env tamamen kaldirilmali
  assert.throws(() => openProductionNotify(dbPath, { ORDU_NOTIFY_URL: '' }), /ORDU_NOTIFY_URL bos/);
});

test('S4 uretim fabrikasi: env URL + gecis exec ile enqueue→flush sent; quiet env INFO deferral + bozuk quiet RED', () => {
  const d = dir();
  const dbPath = join(d, 'ordu.sqlite');
  let gitti = 0;
  const p = openProductionNotify(dbPath, { ORDU_NOTIFY_URL: 'http://127.0.0.1:9/hook' }, { execSync: () => { gitti++; } });
  assert.equal(p.urlSet, true);
  p.outbox.enqueue({ dedupeKey: 'k', severity: 'WARN', title: 't', body: 'b' });
  const r = p.outbox.flush();
  assert.equal(r.sent, 1);
  assert.equal(gitti, 1, 'uretim sender gercekte cagrildi');
  assert.equal(p.outbox.list().find((x) => x.dedupeKey === 'k')?.status, 'sent');

  // quiet-hours env girisimi: "23:00-07:00" gecerli; INFO sessiz saatte deferred, CRITICAL gecer
  const d2 = dir();
  const sessizSaat = new Date('2026-10-26T23:30:00+03:00'); // Istanbul 23:30
  const p2 = openProductionNotify(join(d2, 'ordu.sqlite'), {
    ORDU_NOTIFY_URL: 'http://127.0.0.1:9/hook', ORDU_NOTIFY_QUIET: '23:00-07:00',
  }, { now: () => sessizSaat, execSync: () => {} });
  p2.outbox.enqueue({ dedupeKey: 'i', severity: 'INFO', title: 't', body: 'b' });
  p2.outbox.enqueue({ dedupeKey: 'c', severity: 'CRITICAL', title: 't', body: 'b' });
  const r2 = p2.outbox.flush();
  assert.equal(r2.deferred, 1, 'INFO sessiz saatte kuyruga (deferred)');
  assert.equal(r2.sent, 1, 'CRITICAL sessiz saatte bile gecer (notify.ts sozlesmesi)');
  const q = parseQuietEnv({ ORDU_NOTIFY_QUIET: '23:00-07:00' });
  assert.equal(q?.timezone, 'Europe/Istanbul', 'ORDU_NOTIFY_TZ yoksa varsayilan');
  assert.throws(() => parseQuietEnv({ ORDU_NOTIFY_QUIET: '9-17' }), /ORDU_NOTIFY_QUIET/);
  assert.equal(parseQuietEnv({}), null, 'env yok -> sessiz saat kapali');
});

test('S4 CLI notify: URL yok → durust RED (kuyruk dokunulmaz); enjeksiyonlu exec ile enqueue+flush uçtan uca', async () => {
  const d = dir();
  const dbPath = join(d, 'data', 'ordu.sqlite'); // cliMain kendi dizinini yaratip acar

  const r1 = await cliMain(['notify'], { dbPath, env: {}, probePath: 'evidence/probe-latest.json' });
  assert.equal(r1.code, 1);
  assert.ok(String(r1.out).includes('ORDU_NOTIFY_URL'), 'durust RED: neden soylenir (sessiz no-op yok)');
  assert.ok(!existsSync(join(d, 'data', 'notify.jsonl')), 'RED aninda kuyruk dosyasi DOGMADI (kuyruk dokunulmadi)');

  const cagrilar: string[][] = [];
  const r2 = await cliMain(
    ['notify', '--enqueue', '--severity', 'WARN', '--title', 't', '--body', 'b', '--dedupe-key', 'cli-k'],
    { dbPath, env: { ORDU_NOTIFY_URL: 'http://127.0.0.1:9/hook' }, probePath: 'evidence/probe-latest.json', notifyExec: (_f, args) => { cagrilar.push(args); } },
  );
  assert.equal(r2.code, 0, JSON.stringify(r2.out));
  const o2 = r2.out as any;
  assert.equal(o2.sent, 1, 'enqueue + ayni cagrismada flush teslim');
  assert.equal(o2.bekleyen, 0);
  assert.equal(o2.queued.dedupeKey, 'cli-k');
  assert.equal(o2.path, join(d, 'data', 'notify.jsonl'), 'CLI ciktisi uretim yolunu soyler (pano ayni yolu okur)');
  assert.equal(cagrilar.length, 1, 'tek gercek-cagri denemesi (retry yok — basari)');
  const disk = readFileSync(join(d, 'data', 'notify.jsonl'), 'utf8');
  assert.ok(disk.includes('"event":"sent"'), 'sent olayi diske indi (pano /api/status okur)');

  // gecersiz severity enqueue RED — kapali kume CLI uzerinden de korunur
  const r3 = await cliMain(
    ['notify', '--enqueue', '--severity', 'YUKSEK', '--title', 't', '--body', 'b', '--dedupe-key', 'cli-k2'],
    { dbPath, env: { ORDU_NOTIFY_URL: 'http://127.0.0.1:9/hook' }, probePath: 'evidence/probe-latest.json', notifyExec: () => {} },
  );
  assert.equal(r3.code, 1);
  assert.ok(String(r3.out).includes('severity'), 'severity kapisi CLI uzerinden kirmizi');
});
