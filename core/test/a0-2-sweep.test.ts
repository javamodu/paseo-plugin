// A0-2 (graf v10) — ASILI RUN SWEEP hermetik kanitlari. Canli worker/LLM YOK.
// Kanitlanan iddialar: kira iki katmanli tespit (attempt kirasi + defter kirasi),
// kart/temiz karar ayrimi (olum kaniti olmadan otomatik oldurme YOK — A08),
// temiz oldurmenin defter kapanisi (attempt FAILED + rezervasyon RELEASED +
// CANCEL_CONFIRMED/TIMEOUT_UNCONFIRMED + DONE-olmayan node FAILED + run FAILED +
// RUN_FAILED), kart idempotansi (PENDING approvals satiri — deadline.ts deseni),
// METRIK "asili run sayisi N→0" (3 asili run → sweep → 0 kalan; uretim envanteri
// RUNNING=3 sinifinin birebir fixture kopyasi: FATAL kapanisli run satiri RUNNING kalir),
// ve hermetiklik gercegi: GERCEK repo data/ordu.sqlite DOKUNULMADI (boyut+mtime damgasi).
// Tum defterler :memory: — uretim DBsine bu dosyada HICBAGLANTI yok.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DatabaseSync } from 'node:sqlite';
import { openStore, setGlobalStop, commitCandidate, recordEvidence, takeLease } from '../src/store.ts';
import {
  createRunPlan, approvePlan, ensureStartCommand, dispatchNode, settleNodeOutcome,
  asiliRunTarama, sweepAsiliRunlar, ASILI_KART_ACTION, type PlanNode,
} from '../src/supervisor.ts';
import { sampleHandoff } from '../src/handoff.ts';
import { processOutbox, type WorkerAdapter } from '../src/dispatcher.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);
// zaman enjeksiyonu: kira-dolu testleri 6 saat ileriye, kira-canli testleri simdiki ana bakar
const GELECEK = () => new Date(Date.now() + 6 * 3600_000);
const SIMDI = () => new Date();

// uretim defteri damgasi (modul yuklenisi): son test bunun degmedigini kanitlar
const GERCEK_DB = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'ordu.sqlite');
const gercekDamga = existsSync(GERCEK_DB) ? statSync(GERCEK_DB) : null;

// tek-node run kur: kapsul + donmus plan + insan onayi + START komutu; dispatch hazir
function yeniRun(db: DatabaseSync, tag: string, nodes: PlanNode[] = [{ id: 'n1', role: 'coder', deps: [] }]) {
  const runId = 'run-' + tag;
  const planHash = createRunPlan(db, {
    capsuleId: 'cap-' + tag, goal: 'hedef ' + tag, repoId: 'repo', sourceCommit: H64('c'),
    runId, planId: 'plan-' + tag, profileHash: H64('p'), nodes,
  }).planHash;
  approvePlan(db, runId, planHash, 'insan:test');
  const startCmd = ensureStartCommand(db, runId, planHash, 'operator');
  return {
    runId, startCmd,
    dispatch: () => dispatchNode(db, runId, 'n1', {
      tokens: 1000, startCommandId: startCmd, dispatchKey: 'dk-' + tag + '-n1', handoff: sampleHandoff('n'),
    }),
  };
}

function acilis() {
  const db = openStore();
  setGlobalStop(db, false, 'operator', 'test acilis'); // 001 tetigi: latch=1 iken rezervasyon RED
  db.prepare('UPDATE settings SET max_workers=10 WHERE id=1').run(); // cok-runlu fixturelarda global tavan
  return db;
}

// uretim c0ea713b sinifi birebir: FATAL kapanis (attempt FAILED, node FAILED,
// outbox FAILED, rezervasyon RELEASED) ama RUN SATIRI RUNNING kalir — sweep hedefi.
async function asiliRunYap(db: DatabaseSync, tag: string) {
  const r = yeniRun(db, tag);
  const d = r.dispatch();
  await processOutbox(db, FATAL_ADAPTER);
  return { ...r, attemptId: d.attemptId };
}

const FATAL_ADAPTER: WorkerAdapter = {
  spawn: async () => ({ outcome: 'FATAL', reason: 'test-fatal' }),
  lookup: async () => 'UNKNOWN',
};
const OK_ADAPTER: WorkerAdapter = {
  spawn: async () => ({ outcome: 'OK', externalSessionId: 'sess-test' }),
  lookup: async () => 'ALIVE',
};

const tek = (db: DatabaseSync, sql: string, ...p: unknown[]) => (db.prepare(sql).get(...p) as any);

test('A0-2 METRIK: asili run sayisi 3→0 — FATAL kapanisli 3 run (uretim RUNNING=3 sinifi) supurulur', async () => {
  const db = acilis();
  await asiliRunYap(db, 'm1');
  await asiliRunYap(db, 'm2');
  await asiliRunYap(db, 'm3');
  // sweep oncesi: 3 run da defterde RUNNING (FATAL kapanisi run satirina islemez)
  assert.equal(tek(db, "SELECT COUNT(*) AS c FROM runs WHERE state='RUNNING'").c, 3);
  const once = asiliRunTarama(db, { now: GELECEK });
  assert.equal(once.taranan, 3);
  assert.equal(once.asili, 3);
  assert.equal(once.bulgular.every((b) => b.karar === 'temiz-oldur'), true);

  const s = sweepAsiliRunlar(db, { now: GELECEK });
  assert.equal(s.asiliOnce, 3);
  assert.equal(s.temizOldurulen, 3);
  assert.equal(s.asiliKalan, 0);
  assert.equal(s.dokunulan, 0);
  assert.equal(s.kartAcilan, 0);

  const sonra = asiliRunTarama(db, { now: GELECEK });
  assert.equal(sonra.taranan, 0, 'RUNNING run kalmadi');
  assert.equal(sonra.asili, 0, 'METRIK: asili run sayisi 3→0');
  for (const tag of ['m1', 'm2', 'm3']) {
    const runId = 'run-' + tag;
    assert.equal(tek(db, 'SELECT state FROM runs WHERE id=?', runId).state, 'FAILED');
    assert.equal(tek(db, "SELECT COUNT(*) AS c FROM events WHERE run_id=? AND type='RUN_FAILED'", runId).c, 1);
    assert.equal(tek(db, 'SELECT COUNT(*) AS c FROM approvals WHERE run_id=?', runId).c, 0, 'temiz oldurmede kart ACILMAZ');
  }
  // idempotent: ikinci sweep yeni olay/satir dogurmaz (run artik RUNNING degil)
  const olaySayisi = tek(db, 'SELECT COUNT(*) AS c FROM events').c;
  const s2 = sweepAsiliRunlar(db, { now: GELECEK });
  assert.equal(s2.taranan, 0);
  assert.equal(tek(db, 'SELECT COUNT(*) AS c FROM events').c, olaySayisi);
});

test('A0-2 attempt kirasi dolmus: takeLease suresi gecti + defter sessiz → temiz oldur (CANCEL_CONFIRMED/TIMEOUT_UNCONFIRMED)', async () => {
  const db = acilis();
  const r = yeniRun(db, 'l1');
  const d = r.dispatch();
  await processOutbox(db, OK_ADAPTER); // SESSION_BOUND: attempt RUNNING + outbox SENT + rezervasyon ACTIVE
  takeLease(db, d.attemptId, 'worker-1', new Date(Date.now() - 3600_000).toISOString()); // 1 saat once dolmus kira

  const once = asiliRunTarama(db, { now: GELECEK });
  assert.equal(once.bulgular[0].karar, 'temiz-oldur');
  const s = sweepAsiliRunlar(db, { now: GELECEK });
  assert.equal(s.temizOldurulen, 1);

  assert.equal(tek(db, 'SELECT state FROM attempts WHERE id=?', d.attemptId).state, 'FAILED');
  assert.equal(tek(db, 'SELECT state FROM reservations WHERE attempt_id=?', d.attemptId).state, 'RELEASED');
  assert.equal(tek(db, 'SELECT state FROM nodes WHERE run_id=? AND id=?', r.runId, 'n1').state, 'FAILED');
  assert.equal(tek(db, 'SELECT state FROM runs WHERE id=?', r.runId).state, 'FAILED');
  const cc = tek(db, "SELECT payload_json FROM events WHERE run_id=? AND type='CANCEL_CONFIRMED'", r.runId);
  assert.match(cc.payload_json, /TIMEOUT_UNCONFIRMED/);
  const rf = tek(db, "SELECT payload_json FROM events WHERE run_id=? AND type='RUN_FAILED'", r.runId);
  assert.match(rf.payload_json, /asili-run-kira-dolu/);
});

test('A0-2 dis olu kaniti: outbox DEAD_CONFIRMED + attempt RUNNING (pollSentSessions ONCESI c0ea713b hali) → temiz oldur', async () => {
  const db = acilis();
  const r = yeniRun(db, 'dead1');
  const d = r.dispatch();
  await processOutbox(db, OK_ADAPTER);
  // pollSentSessions hic kosmadi; dis olum baska kanalla teyit edildi (outbox isareti)
  db.prepare("UPDATE outbox SET status='DEAD_CONFIRMED' WHERE attempt_id=?").run(d.attemptId);

  const s = sweepAsiliRunlar(db, { now: GELECEK });
  assert.equal(s.temizOldurulen, 1);
  assert.equal(tek(db, 'SELECT state FROM attempts WHERE id=?', d.attemptId).state, 'FAILED');
  assert.equal(tek(db, 'SELECT state FROM reservations WHERE attempt_id=?', d.attemptId).state, 'RELEASED');
  assert.equal(tek(db, 'SELECT state FROM runs WHERE id=?', r.runId).state, 'FAILED');
});

test('A0-2 kart: dis belirsizlik (outbox UNKNOWN) → insan karti acilir, durumlar DOKUNULMAZ, ikinci sweep DUPLICATE', async () => {
  const db = acilis();
  const gonderilen: any[] = [];
  const notify = { enqueue: (i: any) => { gonderilen.push(i); return {} as any; } };
  const r = yeniRun(db, 'k1');
  const d = r.dispatch();
  // cokme izi: spawn sonucu kayip → outbox UNKNOWN (A08 — reconcile sahipligi)
  db.prepare("UPDATE outbox SET status='UNKNOWN' WHERE attempt_id=?").run(d.attemptId);

  const s = sweepAsiliRunlar(db, { now: GELECEK, notify });
  assert.equal(s.kartAcilan, 1);
  assert.equal(s.asiliKalan, 1, 'kartli run RUNNING+asili kalir — kart cozulmedikce kapanis yok');
  const ap = tek(db, 'SELECT * FROM approvals WHERE run_id=? AND action=?', r.runId, ASILI_KART_ACTION);
  assert.equal(ap.decision, 'PENDING');
  assert.equal(ap.candidate_hash, null);
  // checkpoint (deadline.ts kurali): surebaskisiyla kalite kapisi DUSMEZ
  assert.equal(tek(db, 'SELECT state FROM attempts WHERE id=?', d.attemptId).state, 'RUNNING');
  assert.equal(tek(db, 'SELECT state FROM runs WHERE id=?', r.runId).state, 'RUNNING');
  assert.equal(tek(db, 'SELECT state FROM reservations WHERE attempt_id=?', d.attemptId).state, 'ACTIVE');
  // bildirim: YENI kartta CRITICAL, dedupe anahtari asili:<runId>
  assert.equal(gonderilen.length, 1);
  assert.equal(gonderilen[0].severity, 'CRITICAL');
  assert.equal(gonderilen[0].dedupeKey, 'asili:' + r.runId);
  // idempotent: ikinci sweep yeni satir/bildirim dogurmaz
  const s2 = sweepAsiliRunlar(db, { now: GELECEK, notify });
  assert.equal(s2.kartZatenAcik, 1);
  assert.equal(s2.kartAcilan, 0);
  assert.equal(tek(db, 'SELECT COUNT(*) AS c FROM approvals WHERE run_id=?', r.runId).c, 1);
  assert.equal(gonderilen.length, 1, 'DUPLICATE kartta bildirim YOK');
  // tarama hala asili sayar (durust sayac — kart kapanis degil KARARDIR)
  assert.equal(asiliRunTarama(db, { now: GELECEK }).asili, 1);
});

test('A0-2 olum kaniti yok: lease NULL + outbox SENT + defter sessiz → kart (otomatik oldurme YOK — A08)', async () => {
  const db = acilis();
  const r = yeniRun(db, 'n1');
  const d = r.dispatch();
  await processOutbox(db, OK_ADAPTER); // SESSION_BOUND sonrasi kira HI-ALINMADI

  const once = asiliRunTarama(db, { now: GELECEK });
  assert.equal(once.bulgular[0].karar, 'kart');
  assert.match(once.bulgular[0].neden, /kaniti yok/);
  const s = sweepAsiliRunlar(db, { now: GELECEK });
  assert.equal(s.kartAcilan, 1);
  assert.equal(tek(db, 'SELECT state FROM attempts WHERE id=?', d.attemptId).state, 'RUNNING');
  assert.equal(tek(db, 'SELECT state FROM runs WHERE id=?', r.runId).state, 'RUNNING');
});

test('A0-2 UNKNOWN rezervasyon → kart (A35.2: mutabakat insan/uzlastirma karari ister)', async () => {
  const db = acilis();
  const r = yeniRun(db, 'u1');
  const d = r.dispatch();
  await processOutbox(db, OK_ADAPTER);
  db.prepare("UPDATE reservations SET state='UNKNOWN' WHERE attempt_id=?").run(d.attemptId);

  const s = sweepAsiliRunlar(db, { now: GELECEK });
  assert.equal(s.kartAcilan, 1);
  assert.equal(tek(db, 'SELECT state FROM attempts WHERE id=?', d.attemptId).state, 'RUNNING');
});

test('A0-2 bozuk lease_until: NaN damgasi ne canli sayilir ne olum kaniti → kira-dolu asamasinda KART', async () => {
  const db = acilis();
  const r = yeniRun(db, 'b1');
  const d = r.dispatch();
  await processOutbox(db, OK_ADAPTER);
  db.prepare("UPDATE attempts SET lease_until='bozuk-damga' WHERE id=?").run(d.attemptId);

  const once = asiliRunTarama(db, { now: GELECEK });
  assert.equal(once.bulgular[0].karar, 'kart', 'bozuk kira canli KANITI degildir');
  const s = sweepAsiliRunlar(db, { now: GELECEK });
  assert.equal(s.kartAcilan, 1);
  assert.equal(tek(db, 'SELECT state FROM runs WHERE id=?', r.runId).state, 'RUNNING');
});

test('A0-2 dokunma siniflari: canli kira / is-bekleyen / kira-canli — TEK olay bile yazilmaz', async () => {
  const db = acilis();
  // siralama kasitli: processOutbox her cagrıda İLK PENDING satiri isler —
  // islenmesi istenen run once dispatch edilir, PENDING kalacak run en SON.
  const rB = yeniRun(db, 'd2');
  const dB = rB.dispatch();
  await processOutbox(db, OK_ADAPTER); // SESSION_BOUND taze
  takeLease(db, dB.attemptId, 'worker-2', new Date(Date.now() + 3600_000).toISOString()); // kira gelecekte → canli
  const rC = yeniRun(db, 'd3');
  rC.dispatch();
  await processOutbox(db, OK_ADAPTER); // defter taze (olaylar simdi yazildi) → kira-canli
  const rA = yeniRun(db, 'd1');
  rA.dispatch(); // outbox PENDING kalir → is-bekleyen (scheduler mulku)

  const olayOnce = tek(db, 'SELECT COUNT(*) AS c FROM events').c;
  const s = sweepAsiliRunlar(db, { now: SIMDI });
  assert.equal(s.taranan, 3);
  assert.equal(s.dokunulan, 3);
  assert.equal(s.asiliOnce, 0);
  assert.deepEqual(s.bulgular.map((b) => b.karar).sort(), ['canli', 'is-bekleyen', 'kira-canli']);
  assert.equal(tek(db, 'SELECT COUNT(*) AS c FROM events').c, olayOnce, 'dokunma siniflarinda olay YAZILMAZ');
  for (const r of [rA, rB, rC]) {
    assert.equal(tek(db, 'SELECT state FROM runs WHERE id=?', r.runId).state, 'RUNNING');
    assert.equal(tek(db, 'SELECT COUNT(*) AS c FROM approvals WHERE run_id=?', r.runId).c, 0);
  }
});

test('A0-2 kabul-bekler: tum node DONE + kira dolmus → oldurulMEZ (kabul akisi sahiplenir; basarili isi FAILED yazmak yalan olur)', async () => {
  const db = acilis();
  const r = yeniRun(db, 'a1');
  const d = r.dispatch();
  await processOutbox(db, OK_ADAPTER);
  commitCandidate(db, d.attemptId, 1, H64('a'), 'worker');
  recordEvidence(db, {
    attemptId: d.attemptId, presentedFence: 1, artifactHash: H64('e'), storageRef: 's3://a02-kabul',
    bytes: 10, environmentHash: H64('v'), evaluatorHash: H64('h'), exitCode: 0, verdict: 'PASS', testCount: 3, actorId: 'evaluator',
  });
  assert.equal(settleNodeOutcome(db, d.attemptId, 'PASS').status, 'NODE_DONE');
  // run RUNNING'de takildi (requestAcceptance hic cagrilmadi) + defter sessizlesti
  const s = sweepAsiliRunlar(db, { now: GELECEK });
  assert.equal(s.bulgular[0].karar, 'kabul-bekler');
  assert.equal(s.dokunulan, 1);
  assert.equal(s.temizOldurulen, 0);
  assert.equal(tek(db, 'SELECT state FROM runs WHERE id=?', r.runId).state, 'RUNNING');
  assert.equal(tek(db, 'SELECT COUNT(*) AS c FROM approvals WHERE run_id=? AND action=?', r.runId, ASILI_KART_ACTION).c, 0);
});

test('A0-2 kapsam: RUNNING disi run TARANMAZ (ACCEPTED run SENT outbox ile dokunulmaz)', async () => {
  const db = acilis();
  const r = yeniRun(db, 'x1');
  const d = r.dispatch();
  await processOutbox(db, OK_ADAPTER);
  db.prepare("UPDATE runs SET state='ACCEPTED' WHERE id=?").run(r.runId); // kapanmis run
  const s = sweepAsiliRunlar(db, { now: GELECEK });
  assert.equal(s.taranan, 0);
  assert.equal(tek(db, 'SELECT state FROM attempts WHERE id=?', d.attemptId).state, 'RUNNING', 'terminal runun attemptine dokunulmaz');
});

test('A0-2 B1 (denetci): kart KARARLI (APPROVED) — yeni kart DOGMAZ, bildirim YOK; yurutme semantigi A0-3 kalemidir', async () => {
  const db = acilis();
  const gonderilen: any[] = [];
  const notify = { enqueue: (i: any) => { gonderilen.push(i); return {} as any; } };
  const r = yeniRun(db, 'kr1');
  const d = r.dispatch();
  db.prepare("UPDATE outbox SET status='UNKNOWN' WHERE attempt_id=?").run(d.attemptId); // kart sinifi

  const s1 = sweepAsiliRunlar(db, { now: GELECEK, notify });
  assert.equal(s1.kartAcilan, 1);
  // [insan] karti karar verdi (yurutme = onay -> kapanis tetigi A0-3 wiring kalemi; BU dalga donguyu kapatir)
  db.prepare("UPDATE approvals SET decision='APPROVED' WHERE run_id=? AND action=?").run(r.runId, ASILI_KART_ACTION);
  const s2 = sweepAsiliRunlar(db, { now: GELECEK, notify });
  assert.equal(s2.kartKararli, 1, 'kararli kart tespit edilir');
  assert.equal(s2.kartAcilan, 0);
  assert.equal(s2.kartZatenAcik, 0, 'kararli oncelikli — zaten-acik sinifina dusmez');
  assert.equal(tek(db, 'SELECT COUNT(*) AS c FROM approvals WHERE run_id=?', r.runId).c, 1, 'B1: yeni approvals satiri DOGMAZ (dongu kapali)');
  assert.equal(gonderilen.length, 1, 'kararli kartta bildirim YOK');
  assert.equal(tek(db, 'SELECT state FROM runs WHERE id=?', r.runId).state, 'RUNNING', 'yurutme A0-3: kart APPROVED olsa da bu dalgada kapanis tetiklenmez');
  assert.equal(s2.asiliKalan, 1, 'durust sayac: yurutme olmadikca asili sayilmaya devam');
});

test('A0-2 B2 (denetci): notify.enqueue PATLARSA sweep KESILMEZ — kart dogar, bildirimHata durust not duser, yeniden deneme YOK', async () => {
  const db = acilis();
  const r = yeniRun(db, 'bh1');
  const d = r.dispatch();
  db.prepare("UPDATE outbox SET status='UNKNOWN' WHERE attempt_id=?").run(d.attemptId);

  // enqueue patlar (tx DISINDA yurutulur — kartin dogusunu BOZMAZ)
  const patlayan = { enqueue: () => { throw new Error('notify-kanali-kirik-b2'); } };
  const s1 = sweepAsiliRunlar(db, { now: GELECEK, notify: patlayan });
  assert.equal(s1.kartAcilan, 1, 'B2: bildirim hatasi sweep\'i kesmedi — kart dogdu');
  assert.equal(tek(db, 'SELECT COUNT(*) AS c FROM approvals WHERE run_id=? AND action=?', r.runId, ASILI_KART_ACTION).c, 1);
  assert.match(String(s1.bulgular[0].bildirimHata), /notify-kanali-kirik-b2/, 'hata bulguya durust not olarak dustu');
  // B1 dongu kilidi: sonraki kosum YENI bildirim DENEMEZ (ayni icerikle yeniden denemez)
  const saglikli: any[] = [];
  const s2 = sweepAsiliRunlar(db, { now: GELECEK, notify: { enqueue: (i: any) => { saglikli.push(i); return {} as any; } } });
  assert.equal(s2.kartZatenAcik, 1);
  assert.equal(saglikli.length, 0, 'B1+B2 birlesimi: kart var — bildirim yeniden denenmez');
  assert.equal(s2.bulgular[0].bildirimHata, undefined);
  // durumlar karta kadar DOKUNULMADI (enqueue tx disi oldugundan kart+zaman ayni tx kapsami disi ama tutarli)
  assert.equal(tek(db, 'SELECT state FROM attempts WHERE id=?', d.attemptId).state, 'RUNNING');
});

test('A0-2 B4 (denetci): sweep-in kapattigi FAILED run a yeni dispatch DOGMAZ (GateError)', async () => {
  const db = acilis();
  const r = yeniRun(db, 'dp1');
  r.dispatch();
  await processOutbox(db, FATAL_ADAPTER); // asili run dogar (FATAL kapanis, run RUNNING kalir)
  const s = sweepAsiliRunlar(db, { now: GELECEK });
  assert.equal(s.temizOldurulen, 1);
  assert.equal(tek(db, 'SELECT state FROM runs WHERE id=?', r.runId).state, 'FAILED');
  // KAPI İZOLASYONU: sweep node'u da FAILED yapar ve dispatchNode'un node-state kontrolü
  // B4 run-state kapısından ÖNCE reddeder — B4'ün KENDİSİNİ test etmek için node'u
  // PENDING'e geri çekiyoruz (reddin kaynağı run durumu olmalı, node durumu değil).
  db.prepare("UPDATE nodes SET state='PENDING' WHERE run_id=? AND id='n1'").run(r.runId);
  assert.throws(
    () => r.dispatch(),
    (e: any) => e instanceof Error && /A0-2: run durumu dispatche kapalı: FAILED/.test(e.message),
  );
  assert.equal(tek(db, 'SELECT COUNT(*) AS c FROM attempts WHERE run_id=?', r.runId).c, 1, 'yeni attempt dogmadi');
});

test('A0-2 fail-closed: bos defterde sweep zararsiz; kiraDakika<=0 RED', () => {
  const db = acilis();
  const s = sweepAsiliRunlar(db, { now: GELECEK });
  assert.equal(s.taranan, 0);
  assert.equal(s.asiliOnce, 0);
  assert.throws(() => asiliRunTarama(db, { now: GELECEK, kiraDakika: 0 }), /kiraDakika/);
  assert.throws(() => sweepAsiliRunlar(db, { kiraDakika: -5 }), /kiraDakika/);
});

test('A0-2 hermetiklik: GERCEK repo data/ordu.sqlite boyut+mtime degismedi (DOKUNULMADI)', () => {
  if (!gercekDamga) return; // ortamda yoksa (taze checkout) durust atla — bu dosyada zaten acilmadi
  const s = statSync(GERCEK_DB);
  assert.equal(s.size, gercekDamga.size, 'uretim defteri boyutu degismemeli');
  assert.equal(s.mtimeMs, gercekDamga.mtimeMs, 'uretim defteri mtime degismemeli');
});
