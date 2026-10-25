// M07/RT3 notify outbox hermetik kaniti. Zaman ve sender enjekte edilir;
// gercek webhook/dis cagri YOK, duvar saatine bagli test YOK.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  openNotifyOutbox, redactSecrets, isQuietHours,
  NotifyError, type NotifyRecord, type QuietHours,
} from '../src/notify.ts';

const Q: QuietHours = { start: '23:00', end: '07:00', timezone: 'Europe/Istanbul' };
const tmp = (): string => join(mkdtempSync(join(tmpdir(), 'notify-')), 'notify.jsonl');
const code = (e: unknown): string => (e instanceof NotifyError ? e.code : String(e));

test('dedupe: ayni dedupeKey + ayni icerik idempotent (ikinci kez kaydedilmez)', () => {
  const path = tmp();
  const o = openNotifyOutbox(path, { sender() {} });
  const a = o.enqueue({ dedupeKey: 'k1', severity: 'INFO', title: 't', body: 'b' });
  const b = o.enqueue({ dedupeKey: 'k1', severity: 'INFO', title: 't', body: 'b' });
  assert.equal(b.id, a.id);
  assert.equal(o.list().length, 1);
  assert.equal(o.events().filter((e) => e.event === 'queued').length, 1);
  // reload sonrasi da idempotent (dedupe indeksi jsonl replay'den kurulur)
  const o2 = openNotifyOutbox(path, { sender() {} });
  const c = o2.enqueue({ dedupeKey: 'k1', severity: 'INFO', title: 't', body: 'b' });
  assert.equal(c.id, a.id);
  assert.equal(o2.list().length, 1);
});

test('dedupe conflict: ayni dedupeKey + farkli icerik RED', () => {
  const o = openNotifyOutbox(tmp(), { sender() {} });
  o.enqueue({ dedupeKey: 'k1', severity: 'INFO', title: 't', body: 'b' });
  assert.throws(
    () => o.enqueue({ dedupeKey: 'k1', severity: 'INFO', title: 't', body: 'farkli' }),
    (e: unknown) => code(e) === 'dedupe-cakisma',
  );
  assert.throws(
    () => o.enqueue({ dedupeKey: 'k1', severity: 'WARN', title: 't', body: 'b' }),
    (e: unknown) => code(e) === 'dedupe-cakisma',
  );
});

test('severity kapali kume: bilinmeyen severity RED', () => {
  const o = openNotifyOutbox(tmp(), { sender() {} });
  assert.throws(
    () => o.enqueue({ dedupeKey: 'k1', severity: 'BOGUS' as never, title: 't', body: 'b' }),
    (e: unknown) => code(e) === 'severity-gecersiz',
  );
  assert.equal(o.list().length, 0); // RED edilen kayit outbox'a dusmedi
});

test('isQuietHours saf fonksiyon: sarmal aralik sinirlari (start dahil, end haric)', () => {
  const at = (s: string): Date => new Date(`2026-01-15T${s}:00+03:00`);
  assert.equal(isQuietHours(at('23:00'), Q), true);
  assert.equal(isQuietHours(at('02:30'), Q), true);
  assert.equal(isQuietHours(at('06:59'), Q), true);
  assert.equal(isQuietHours(at('07:00'), Q), false);
  assert.equal(isQuietHours(at('12:00'), Q), false);
  assert.equal(isQuietHours(at('22:59'), Q), false);
  assert.equal(isQuietHours(at('02:30'), { start: '01:00', end: '01:00', timezone: 'Europe/Istanbul' }), false);
});

test('quiet-hours: INFO/WARN deferred, CRITICAL her zaman gecer; sessizlik bitince deferred gonderilir', () => {
  let simdi = new Date('2026-01-15T02:00:00+03:00'); // Istanbul 02:00 — sessiz saat
  const sent: NotifyRecord[] = [];
  const o = openNotifyOutbox(tmp(), { now: () => simdi, sender: (r) => { sent.push(r); }, quietHours: Q });
  const info = o.enqueue({ dedupeKey: 'i1', severity: 'INFO', title: 'bilgi', body: 'x' });
  const warn = o.enqueue({ dedupeKey: 'w1', severity: 'WARN', title: 'uyari', body: 'y' });
  const krit = o.enqueue({ dedupeKey: 'c1', severity: 'CRITICAL', title: 'kritik', body: 'z' });
  const oz = o.flush();
  assert.deepEqual(oz, { sent: 1, deferred: 2, retried: 0, dead: 0 });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].id, krit.id); // CRITICAL sessiz saatte bile gecer
  assert.equal(o.get(info.id)!.status, 'deferred');
  assert.equal(o.get(warn.id)!.status, 'deferred');
  // hâlâ gece: tekrar flush yeni deferred event'i YAZMAZ (sessiz idempotensi)
  const evSayisi = o.events().length;
  o.flush();
  assert.equal(o.events().length, evSayisi);
  assert.equal(sent.length, 1);
  // sessiz saat bitti: deferred kayitlar gonderilir
  simdi = new Date('2026-01-15T12:00:00+03:00');
  const oz2 = o.flush();
  assert.deepEqual(oz2, { sent: 2, deferred: 0, retried: 0, dead: 0 });
  assert.equal(sent.length, 3);
  assert.equal(o.get(info.id)!.status, 'sent');
});

test('redakte: sir desenleri maskelenir; orijinal sir diske DUSMEZ', () => {
  const path = tmp();
  const o = openNotifyOutbox(path, { sender() {} });
  const body = 'hata: token=abc123XYZ / Bearer gizli-bearer-degeri / sk-live-9876543210 / password=hunter2 / x-pano-token: pano-gizli-123';
  const r = o.enqueue({ dedupeKey: 'r1', severity: 'CRITICAL', title: 'patladi token=titleSir1', body });
  for (const sir of ['abc123XYZ', 'gizli-bearer-degeri', 'sk-live-9876543210', 'hunter2', 'pano-gizli-123', 'titleSir1']) {
    assert.ok(!r.body.includes(sir), `record govdesinde sir kaldi: ${sir}`);
    assert.ok(!r.title.includes(sir), `record basliginda sir kaldi: ${sir}`);
  }
  assert.ok(r.body.includes('token=***') && r.body.includes('Bearer ***') && r.body.includes('password=***'));
  const disk = readFileSync(path, 'utf8');
  for (const sir of ['abc123XYZ', 'gizli-bearer-degeri', 'sk-live-9876543210', 'hunter2', 'pano-gizli-123', 'titleSir1'])
    assert.ok(!disk.includes(sir), `orijinal sir diskte: ${sir}`);
  assert.ok(disk.includes('***'));
  assert.equal(redactSecrets('api token=t1'), 'api token=***');
  assert.equal(redactSecrets('sir yok'), 'sir yok');
});

test('retry sinirli (max 3) sonra DEAD; DEAD kayit yeniden denenmez', () => {
  let cagri = 0;
  const o = openNotifyOutbox(tmp(), {
    sender() { cagri++; throw new Error('webhook 500'); },
  });
  const r = o.enqueue({ dedupeKey: 'f1', severity: 'CRITICAL', title: 't', body: 'b' });
  assert.equal(o.flush().retried, 1); // attempts 1
  assert.equal(o.flush().retried, 1); // attempts 2
  const oz = o.flush();               // attempts 3 → DEAD
  assert.equal(oz.dead, 1);
  assert.equal(cagri, 3);
  assert.equal(o.get(r.id)!.status, 'dead');
  assert.equal(o.get(r.id)!.attempts, 3);
  o.flush();
  assert.equal(cagri, 3); // DEAD'e tekrar denenmez
});

test('gecici hata sonrasi basari: retry pending kalir, sonraki flush sent olur', () => {
  let patla = true;
  const sent: NotifyRecord[] = [];
  const o = openNotifyOutbox(tmp(), {
    sender(r) { if (patla) throw new Error('gecici'); sent.push(r); },
  });
  const r = o.enqueue({ dedupeKey: 'g1', severity: 'WARN', title: 't', body: 'b' });
  o.flush();
  assert.equal(o.get(r.id)!.status, 'pending');
  assert.equal(o.get(r.id)!.attempts, 1);
  patla = false;
  o.flush();
  assert.equal(o.get(r.id)!.status, 'sent');
  assert.equal(sent.length, 1);
});

test('flush idempotent: sent kayit ikinci flush sonrasi yeniden gonderilmez', () => {
  let cagri = 0;
  const o = openNotifyOutbox(tmp(), { sender() { cagri++; } });
  o.enqueue({ dedupeKey: 's1', severity: 'INFO', title: 't', body: 'b' });
  assert.equal(o.flush().sent, 1);
  const evSayisi = o.events().length;
  const oz = o.flush();
  assert.deepEqual(oz, { sent: 0, deferred: 0, retried: 0, dead: 0 });
  assert.equal(cagri, 1);
  assert.equal(o.events().length, evSayisi);
});

test('flush sender-siz RED (gercek dis cagri bu modulde YOK)', () => {
  const o = openNotifyOutbox(tmp());
  o.enqueue({ dedupeKey: 'n1', severity: 'INFO', title: 't', body: 'b' });
  assert.throws(() => o.flush(), (e: unknown) => code(e) === 'sender-yok');
});

test('tail-repair: bozuk SON satir budanir; orta satir bozuksa fail-closed RED', () => {
  const path = tmp();
  const o = openNotifyOutbox(path, { sender() {} });
  o.enqueue({ dedupeKey: 'a1', severity: 'INFO', title: 't', body: 'b' });
  o.enqueue({ dedupeKey: 'a2', severity: 'WARN', title: 't', body: 'b' });
  appendFileSync(path, '{"event":"queued","record":{"id":"YARIM-KAYIT', 'utf8'); // crash ortasinda yarim kalmis satir
  const o2 = openNotifyOutbox(path, { sender() {} });
  assert.equal(o2.list().length, 2);
  assert.ok(!readFileSync(path, 'utf8').includes('YARIM-KAYIT')); // budandi
  // orta satir bozulursa sessiz onarim YOK
  const satirlar = readFileSync(path, 'utf8').split('\n');
  satirlar[0] = 'BOZUK-SATIR';
  writeFileSync(path, satirlar.join('\n'), 'utf8');
  assert.throws(() => openNotifyOutbox(path, { sender() {} }), (e: unknown) => code(e) === 'bozuk-kayit');
});

test('dayaniklilik: sent/dead durumu reload sonrasi korunur (append-only replay)', () => {
  const path = tmp();
  let cagri = 0;
  const o = openNotifyOutbox(path, { sender() { cagri++; } });
  o.enqueue({ dedupeKey: 'd1', severity: 'INFO', title: 't', body: 'b' });
  o.flush();
  const o2 = openNotifyOutbox(path, { sender() { cagri++; } });
  assert.equal(o2.list()[0].status, 'sent');
  o2.flush();
  assert.equal(cagri, 1); // reload sonrasi flush yeniden gondermez
});