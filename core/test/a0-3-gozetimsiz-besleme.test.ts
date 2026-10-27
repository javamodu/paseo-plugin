// A0-3 (dalga planı §3 W-A0-3) — GÖZETİMSİZ KANIT BESLEME KATMANI: rozetin kanıt yüzü
// kalıcı jsonl defterden okunur. 4/6 bayrak (koşul 1/2/3/5 — defter-sorgulu) daemon
// döngüsünden beslenir; 2 yetenek bayrağı (koşul 4/6) dış kanıtla kayda girer. Tazelik
// penceresi fail-closed: eski kanıt = kırmızı; taze kanıt kırmızı DB'yi BOYAYAMAZ.
// Hermetik kol: temp dizin + temp sqlite + sahte saat — ÜRETİM data/ordu.sqlite ve
// data/gozetimsiz-kanit.jsonl DOKUNULMAZ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, setGlobalStop } from '../src/store.ts';
import { createRunPlan, approvePlan, dispatchNode, ensureStartCommand } from '../src/supervisor.ts';
import { sampleHandoff } from '../src/handoff.ts';
import {
  kanitKaydet, kanitTazeligi, besleDaemonKanitlari, unattendedReadinessBeslemeli,
  KANIT_BAYRAKLARI, type KanitBayragi, type GozetimsizKanitKaydi,
} from '../src/gozetimsiz.ts';
import { runDaemon, type TickOutcome } from '../src/daemon.ts';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const geciciDizin = () => mkdtempSync(join(tmpdir(), 'a03-kanit-'));
const temizle = (d: string) => rmSync(d, { recursive: true, force: true });
const kayit = (bayrak: KanitBayragi, turMs: number, kaynak: GozetimsizKanitKaydi['kaynak'] = 'dis-kanit'): GozetimsizKanitKaydi =>
  ({ bayrak, kaynak, damga: new Date(turMs).toISOString(), turMs, detay: 'a03 test kaydi' });
const okTick = (): Promise<TickOutcome> => Promise.resolve({ code: 0, out: '{}', ms: 1 });
const redTick = (): Promise<TickOutcome> => Promise.resolve({ code: 1, out: 'kirmizi', ms: 1 });

// k13-gozetimsiz.test.ts deseni: tek run + dispatch → koşul kırılımı için rezervasyon
function kurulum(db: any, runId: string) {
  setGlobalStop(db, false, 'insan:test', 'a03 kurulum');
  const { planHash } = createRunPlan(db, {
    capsuleId: 'cap-' + runId, goal: 'A0-3 besleme testi', repoId: 'ordu/core', sourceCommit: sha(runId),
    runId, planId: 'plan-' + runId, profileHash: sha('a03:' + runId),
    nodes: [{ id: 'n1', role: 'coder', deps: [] }],
    maxWorkers: 2, allowedCommands: ['npm test'],
  });
  approvePlan(db, runId, planHash, 'insan:test');
  return ensureStartCommand(db, runId, planHash, 'insan:test');
}

test('A0-3 tazelik: taze kayit bayragi besler; pencere disina cikan kayit kirmizi (fail-closed)', () => {
  const d = geciciDizin(); const yol = join(d, 'kanit.jsonl');
  const t0 = 1_000_000_000_000;
  kanitKaydet(yol, kayit('dosyaShellSinirlariKanitli', t0));
  assert.equal(kanitTazeligi(yol, 60_000, () => t0 + 30_000).dosyaShellSinirlariKanitli, true, 'pencere ici = taze');
  assert.equal(kanitTazeligi(yol, 60_000, () => t0 + 30_000).eskiSahipYazmaEngeliKanitli, false, 'kaydi olmayan bayrak beslenmez');
  assert.equal(kanitTazeligi(yol, 60_000, () => t0 + 61_000).dosyaShellSinirlariKanitli, false, 'eski kanit kirmizi — fail-closed');
  temizle(d);
});

test('A0-3 tazelik: EN YENI kayit kazanir; dis-kanit kaydi da ayni kapidan gecer; dosya yoksa hepsi false', () => {
  const d = geciciDizin(); const yol = join(d, 'kanit.jsonl');
  const t0 = 5_000_000;
  kanitKaydet(yol, kayit('grantEtkisiKanitli', t0, 'daemon-tick'));
  kanitKaydet(yol, kayit('grantEtkisiKanitli', t0 + 5_000, 'daemon-tick'));
  kanitKaydet(yol, kayit('eskiSahipYazmaEngeliKanitli', t0 + 5_000, 'dis-kanit'));
  const taze = kanitTazeligi(yol, 60_000, () => t0 + 10_000);
  assert.equal(taze.grantEtkisiKanitli, true, 'en yeni kayit pencereye tasir');
  assert.equal(taze.eskiSahipYazmaEngeliKanitli, true, 'kaynak ayrimi YOK — dis-kanit de taze sayilir');
  const hic = kanitTazeligi(join(d, 'yok.jsonl'), 60_000, () => t0);
  assert.ok(KANIT_BAYRAKLARI.every((b) => hic[b] === false), 'dosya yok = 6/6 bayrak yok');
  temizle(d);
});

test('A0-3 yazim ucu: bilinmeyen bayrak adi RED (yazim hatasi sessiz kayit doguramaz)', () => {
  const d = geciciDizin(); const yol = join(d, 'kanit.jsonl');
  assert.throws(() => kanitKaydet(yol, { ...kayit('uzlastirmaKanitli', 1), bayrak: 'yok-boyle-bayrak' as KanitBayragi }), /bilinmeyen-kanit-bayragi/);
  assert.equal(existsSync(yol), false, 'RED cikis dosyaya hic yazmaz');
  temizle(d);
});

test('A0-3 daemon beslemesi: temiz defter -> tam 4 defter bayragi yazilir (rozet 4/6 daemon tarafindan besleniyor)', () => {
  const d = geciciDizin(); const yol = join(d, 'kanit.jsonl');
  const db = openStore();
  const yazilan = besleDaemonKanitlari(db, yol, () => 2_000_000);
  assert.deepEqual([...yazilan].sort(), ['grantEtkisiKanitli', 'iptalDogrulamaKanitli', 'kullanimOlcumuKanitli', 'uzlastirmaKanitli']);
  assert.equal(readFileSync(yol, 'utf8').trim().split('\n').length, 4, 'fsync li jsonl: 4 kayit');
  const taze = kanitTazeligi(yol, 60_000, () => 2_000_000 + 1);
  assert.equal(taze.uzlastirmaKanitli, true);
  assert.equal(taze.dosyaShellSinirlariKanitli, false, 'yetenek bayragi daemon dongusinden GELMEZ');
  assert.equal(taze.eskiSahipYazmaEngeliKanitli, false, 'yetenek bayragi daemon dongusunden GELMEZ');
  db.close(); temizle(d);
});

test('A0-3 daemon beslemesi: KIRMIZI kosula kayit YAZMAZ (yesile boyama yok)', () => {
  const d = geciciDizin(); const yol = join(d, 'kanit.jsonl');
  const db = openStore();
  const sc = kurulum(db, 'run-a03a');
  const att = dispatchNode(db, 'run-a03a', 'n1', { tokens: 100, startCommandId: sc, dispatchKey: 'dk-a03a', handoff: sampleHandoff('run-a03a') }) as any;
  db.prepare("UPDATE reservations SET state='UNKNOWN' WHERE attempt_id=?").run(att.attemptId);
  const yazilan = besleDaemonKanitlari(db, yol, () => 3_000_000);
  assert.equal(yazilan.includes('uzlastirmaKanitli'), false, 'kirmizi kosul kanit URETMEZ');
  assert.equal(yazilan.length, 3, 'diger 3 yesil kosul beslenir');
  db.close(); temizle(d);
});

test('A0-3 defter sozlesmesi: SON satir yarim yazma onarilir; ORTA satir bozuklugu LOUD', () => {
  const d = geciciDizin(); const yol = join(d, 'kanit.jsonl');
  kanitKaydet(yol, kayit('uzlastirmaKanitli', 7_000_000, 'daemon-tick'));
  writeFileSync(yol, '{"bayrak":"iptalDogrulamaKanitli","kaynak":"daemon', { flag: 'a' }); // crash yarim yazisi
  assert.equal(kanitTazeligi(yol, 60_000, () => 7_000_001).uzlastirmaKanitli, true, 'onarim onceki kayiti korur');
  assert.equal(kanitTazeligi(yol, 60_000, () => 7_000_001).iptalDogrulamaKanitli, false, 'yarim kayit sayilmaz');
  const orta = join(d, 'orta.jsonl');
  writeFileSync(orta, JSON.stringify(kayit('grantEtkisiKanitli', 1)) + '\n{"bozuk\n' + JSON.stringify(kayit('grantEtkisiKanitli', 2)) + '\n');
  assert.throws(() => kanitTazeligi(orta, 60_000, () => 1_000), /bozuk-kayit/, 'orta satir sessiz onarilmaz');
  temizle(d);
});

test('A0-3 beslemeli rozet: 6 bayrak taze + DB yesil -> gozetimsiz-hazir 6/6', () => {
  const d = geciciDizin(); const yol = join(d, 'kanit.jsonl');
  const db = openStore();
  const t = 9_000_000;
  for (const b of KANIT_BAYRAKLARI) kanitKaydet(yol, kayit(b, t, b === 'dosyaShellSinirlariKanitli' || b === 'eskiSahipYazmaEngeliKanitli' ? 'dis-kanit' : 'daemon-tick'));
  const r = unattendedReadinessBeslemeli(db, yol, 60_000, () => t + 1_000);
  assert.equal(r.rozet, 'gozetimsiz-hazir');
  assert.equal(r.kosullar.filter((k) => k.gecti).length, 6);
  db.close(); temizle(d);
});

test('A0-3 beslemeli rozet fail-closed: kanit yok -> DB yesil olsa bile 0/6 (daemon olmus = rozet kapali)', () => {
  const d = geciciDizin();
  const db = openStore();
  const r = unattendedReadinessBeslemeli(db, join(d, 'yok.jsonl'), 60_000, () => Date.now());
  assert.equal(r.rozet, 'gozetimsiz-kullanilamaz');
  assert.equal(r.kosullar.filter((k) => k.gecti).length, 0, 'tazelik bacagi yoksa DB bacagi yetmez');
  assert.match(r.kosullar.find((k) => k.no === 3)!.detay, /pencere/);
  assert.match(r.kosullar.find((k) => k.no === 4)!.detay, /fail-closed/);
  db.close(); temizle(d);
});

test('A0-3 beslemeli rozet: TAZE kanit KIRMIZI DB yi boyayamaz (cift bacak) + kanit bayatlayinca rozet kapanir', () => {
  const d = geciciDizin(); const yol = join(d, 'kanit.jsonl');
  const db = openStore();
  const sc = kurulum(db, 'run-a03b');
  const att = dispatchNode(db, 'run-a03b', 'n1', { tokens: 100, startCommandId: sc, dispatchKey: 'dk-a03b', handoff: sampleHandoff('run-a03b') }) as any;
  db.prepare("UPDATE reservations SET state='UNKNOWN' WHERE attempt_id=?").run(att.attemptId);
  const t = 4_000_000;
  for (const b of KANIT_BAYRAKLARI) kanitKaydet(yol, kayit(b, t));
  const kirmizi = unattendedReadinessBeslemeli(db, yol, 60_000, () => t + 1);
  assert.equal(kirmizi.kosullar.find((k) => k.no === 1)!.gecti, false, 'taze kanit UNKNOWN kusurunu gizleyemez');
  assert.match(kirmizi.kosullar.find((k) => k.no === 1)!.detay, /UNKNOWN/);
  assert.equal(kirmizi.rozet, 'gozetimsiz-kullanilamaz');
  db.prepare("UPDATE reservations SET state='RELEASED' WHERE attempt_id=?").run(att.attemptId);
  assert.equal(unattendedReadinessBeslemeli(db, yol, 60_000, () => t + 1).rozet, 'gozetimsiz-hazir', 'kusur kapaninca + kanit tazeyken hazir');
  assert.equal(unattendedReadinessBeslemeli(db, yol, 60_000, () => t + 61_000).rozet, 'gozetimsiz-kullanilamaz', 'kanit bayatlar -> rozet kapanir');
  db.close(); temizle(d);
});

test('A0-3 daemon dongusu: basarili tick sonrasi kanit defteri beslenir (4/6) — wiring kaniti', async () => {
  const d = geciciDizin();
  const dbYol = join(d, 'defter.sqlite');
  const kanitYol = join(d, 'kanit.jsonl');
  let t = 1_000_000;
  const r = await runDaemon({
    intervalMs: 1000, maxTicks: 2, dbPath: dbYol, kanitDefteriYolu: kanitYol,
    now: () => t, sleep: async (ms: number) => { t += ms; },
    runTick: okTick, stopLatched: () => false, log: () => {},
  });
  assert.equal(r.code, 0);
  assert.equal(r.stats.reason, 'max-ticks');
  assert.equal(r.stats.kanit.besleme, 8, '2 tick x 4 yesil bayrak = 8 kayit');
  assert.equal(r.stats.kanit.hata, 0);
  const taze = kanitTazeligi(kanitYol, 60_000, () => t);
  assert.equal(KANIT_BAYRAKLARI.filter((b) => taze[b]).length, 4, 'olcut: rozet 4/6 bayragi daemon tarafindan besleniyor');
  temizle(d);
});

test('A0-3 daemon dongusu: KIRMIZI tick BESLEMEZ — kanit yazilmaz, dosya dogmaz', async () => {
  const d = geciciDizin();
  let t = 1_000_000;
  const r = await runDaemon({
    intervalMs: 1000, dbPath: join(d, 'defter.sqlite'), kanitDefteriYolu: join(d, 'kanit.jsonl'),
    now: () => t, sleep: async (ms: number) => { t += ms; },
    runTick: redTick, stopLatched: () => false, log: () => {},
  });
  assert.equal(r.stats.reason, 'fail-closed');
  assert.equal(r.stats.kanit.besleme, 0);
  assert.equal(existsSync(join(d, 'kanit.jsonl')), false, 'kirmizi dongu kanit uretmez — eskir, fail-closed');
  temizle(d);
});

test('A0-3 daemon dongusu: besleme HATASI daemon i oldurmuz — hata sayilir, dongu devam eder', async () => {
  const d = geciciDizin();
  let t = 1_000_000;
  const r = await runDaemon({
    intervalMs: 1000, maxTicks: 2, dbPath: ':memory:', kanitDefteriYolu: join(d, 'yok-dizin', 'kanit.jsonl'),
    now: () => t, sleep: async (ms: number) => { t += ms; },
    runTick: okTick, stopLatched: () => false, log: () => {},
  });
  assert.equal(r.code, 0, 'daemon yasar (max-ticks cikisi — fail-closed degil)');
  assert.equal(r.stats.ok, 2);
  assert.equal(r.stats.kanit.hata, 2, 'her basarili tick 1 besleme hatasi saydi');
  assert.equal(r.stats.kanit.besleme, 0);
  temizle(d);
});
