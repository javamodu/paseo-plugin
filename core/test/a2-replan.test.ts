// A2 (graf v6) — REPLAN MOTORU: hermetik kırılım koşumları.
// DRIFT% ölçer (§18↔kabul çapraz-referans; V4-01 bayat hücre sınıfı) · sapma
// ölçer (hedef/gerçek + defter bağlamı) · taslak → [insan] kapısı → §18 tazeleme
// (MD-ezmez: yalnız Durum hücresi) · replan.jsonl kalıcılığı (idempotent ölçüm +
// onay idempotansı) · EK-2 aktör RED'i · fail-closed (kabul/PLAN yok → RED).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, setGlobalStop } from '../src/store.ts';
import {
  kabulOku, plan18Oku, olcDrift, olcSapma, replanTaslagi, plan18Tazele,
  replanOnayla, openReplanDefteri, replanYolu, REPLAN_ONAY_METNI,
  replanTaslakImzasi, eslesenReplanTaslagi,
} from '../src/replan.ts';

const g = () => join(mkdtempSync(join(tmpdir(), 'a2-replan-')));

// §18 biçiminde sabit fixture (6 kolon; bayat + dürüst-kırmızı + eşleşmeyen satır)
const PLAN_MD = [
  '# PLAN (test fixture)',
  '',
  '## 18. Kapanis listesi',
  '',
  '| ID | Acik | Kod yeri | Kabul testi | Gercek kanit | Durum |',
  '|---|---|---|---|---|---|',
  '| P1-9 | gozetimsiz kapi | bol.22 | K13-01 | canli 6-kosul | tasarim tam; CANLI KANIT YOK |',
  '| P2-10 | senaryo B+C | bol.23 | K13-03/K13-04 | senaryo | tasarim tam; UYGULAMA-EKSIK |',
  '| P0-1 | yetki zinciri | core | M26/M31 + A13 sahte-PASS | exit-0 | kapandi -> GECTI_HERMETIC (kabul.csv M26; test) |',
  '| P2-99 | defter-disi | bol.9 | ZZZ-01 | kanit | UYGULAMA-EKSIK |',
  '',
].join('\n');

const KABUL_CSV = [
  'id,faz,kaynak,durum,kaniT',
  'K13-01,S4,gozetimsiz rozet,PASS,canli 6-kosul paketi',
  'K13-03,S4,senaryo B,PASS,k13-senaryo.test.ts',
  'K13-04,S4,senaryo C,PASS,k13-senaryo.test.ts',
  'M26,S0,izin negatif,GECTI_HERMETIC,negatif test',
  'A13,S0,sahte-PASS kapis,PASS,store kapisi',
  'Z9-9,S9,bos satir,NOT_RUN,-',
].join('\n');

test('A2 kabulOku: CRLF + kaniT içi virgül tolere — yalnız id/durum alınır; başlık atlanır', () => {
  const d = g();
  const ev = join(d, 'kabul.csv');
  writeFileSync(ev, KABUL_CSV.replace('k13-senaryo.test.ts', 'k13, virgullu, kanit'), 'utf8');
  const k = kabulOku(ev);
  assert.equal(k.satirlar.length, 6);
  assert.equal(k.satirlar.find((s) => s.id === 'K13-03')!.durum, 'PASS');
  assert.equal(k.atlanan, 0);
});

test('A2 kabulOku fail-closed: dosya yok → RED (sessiz 0 YOK)', () => {
  assert.throws(() => kabulOku(join(g(), 'yok.csv')), /kabul defteri yok/);
});

test('A2 plan18Oku: 6-kolonlu P-satırları ayıklanır; slash kabul-id grupları açılır', () => {
  const satirlar = plan18Oku(PLAN_MD);
  assert.equal(satirlar.length, 4);
  const p2 = satirlar.find((s) => s.satirId === 'P2-10')!;
  assert.deepEqual(p2.kabulIdler, ['K13-03', 'K13-04']);
  const p1 = satirlar.find((s) => s.satirId === 'P0-1')!;
  assert.ok(p1.kabulIdler.includes('M26') && p1.kabulIdler.includes('M31') && p1.kabulIdler.includes('A13'));
});

test('A2 olcDrift: yeşil kabul + eski açık §18 → BAYAT (V4-01 sınıfı); kapanmış hücre tutarlı sayılır', () => {
  const d = g();
  const ev = join(d, 'kabul.csv');
  writeFileSync(ev, KABUL_CSV, 'utf8');
  const r = olcDrift(PLAN_MD, kabulOku(ev));
  // taranan: P1-9, P2-10, P0-1 (P2-99 kabul eşleşmesi yok → ölçüm dışı dürüst listelenir)
  assert.equal(r.taranan, 3);
  assert.equal(r.tutarli, 1, 'P0-1 kapanmış işaretli → tutarlı');
  assert.equal(r.bayat, 3, 'P1-9 (1 kabul) + P2-10 (2 kabul) bayat');
  assert.ok(r.bayatHucreler.some((b) => b.satirId === 'P1-9' && b.kabulId === 'K13-01' && /CANLI KANIT YOK/.test(b.eskiDurum)));
  assert.equal(r.driftYuzde, 33.3);
  assert.deepEqual(r.eslesenYok, ['P2-99']);
});

test('A2 olcSapma: hedef-gerçek sapma + eşik aşımı + defter run bağlamı', () => {
  const d = g();
  const ev = join(d, 'kabul.csv');
  writeFileSync(ev, KABUL_CSV, 'utf8');
  const db = openStore();
  setGlobalStop(db, false, 'insan:test', 'a2');
  const k = kabulOku(ev);
  const s = olcSapma(db, k, { hedefYuzde: 90, esik: 5 });
  assert.equal(s.yesil, 5); // PASS×4 + GECTI_HERMETIC
  assert.equal(s.toplam, 6);
  assert.equal(s.gercekYuzde, 83.3);
  assert.equal(s.sapmaYuzde, 6.7);
  assert.equal(s.asim, true);
  assert.ok(s.defter.attemptSayisi >= 0);
});

test('A2 replanTaslagi: bayat hücreler öneriye döner (yeni durum kabul kaynaklı); tetik etiketi doğru', () => {
  const d = g();
  const ev = join(d, 'kabul.csv');
  writeFileSync(ev, KABUL_CSV, 'utf8');
  const db = openStore();
  const k = kabulOku(ev);
  const t = replanTaslagi(olcSapma(db, k, { hedefYuzde: 90, esik: 5 }), olcDrift(PLAN_MD, k));
  assert.equal(t.tetik, 'sapma-esik-asimi+drift-bayat-satir');
  const o = t.oneriler.find((x) => x.satirId === 'P1-9')!;
  assert.match(o.yeniDurum, /kapandi -> PASS \(kabul\.csv K13-01/);
  assert.equal(o.eskiDurum, 'tasarim tam; CANLI KANIT YOK');
});

test('A2 defter kalıcılığı: ölçüm fsync ile iner; aynı sayılar ikinci kez KAYDEDİLMEZ (spam yok)', () => {
  const d = g();
  const ev = join(d, 'kabul.csv');
  writeFileSync(ev, KABUL_CSV, 'utf8');
  const db = openStore();
  const dbPath = join(d, 'data', 'ordu.sqlite');
  const k = kabulOku(ev);
  const sapma = olcSapma(db, k, {});
  const drift = olcDrift(PLAN_MD, k);
  const r1 = openReplanDefteri(dbPath);
  assert.equal(r1.olcumKaydet(sapma, drift).kaydedildi, true);
  assert.ok(existsSync(replanYolu(dbPath)));
  const r2 = openReplanDefteri(dbPath); // yeniden açılış: kayıt replay'den gelir
  assert.equal(r2.olcumKaydet(sapma, drift).kaydedildi, false, 'idempotent — aynı icerikHash');
});

test('A2 [insan] kapısı: yanlış onay metni RED; ajan aktörü RED (EK-2); onaysız uygulama YOK', () => {
  const d = g();
  const planEv = join(d, 'PLAN.md');
  const kabulEv = join(d, 'kabul.csv');
  writeFileSync(planEv, PLAN_MD, 'utf8');
  writeFileSync(kabulEv, KABUL_CSV, 'utf8');
  const db = openStore();
  const dbPath = join(d, 'data', 'ordu.sqlite');
  const k = kabulOku(kabulEv);
  const defter = openReplanDefteri(dbPath);
  const t = replanTaslagi(olcSapma(db, k, {}), olcDrift(PLAN_MD, k));
  defter.taslakKaydet(t);
  const ham = readFileSync(planEv, 'utf8');
  assert.throws(() => replanOnayla({ defter, taslakId: t.id, confirm: 'onayliyorum', actor: 'insan:cli', planEv }), /gerekli \(kapi tasarimi\)|gerekli \(kapı tasarımı\)|--confirm/);
  assert.equal(readFileSync(planEv, 'utf8'), ham, 'RED anında PLAN.md DOKUNULMADI');
  assert.throws(() => replanOnayla({ defter, taslakId: t.id, confirm: REPLAN_ONAY_METNI, actor: 'ajan:proxy', planEv }), /ajan:proxy/);
  assert.equal(readFileSync(planEv, 'utf8'), ham, 'EK-2 RED anında da dokunulmadı');
});

test('A2 §18 tazeleme (onaylı): yalnız Durum hücresi değişir — satırın ilk 5 hücresi + diğer satırlar bayt-bayt aynı', () => {
  const d = g();
  const planEv = join(d, 'PLAN.md');
  const kabulEv = join(d, 'kabul.csv');
  writeFileSync(planEv, PLAN_MD, 'utf8');
  writeFileSync(kabulEv, KABUL_CSV, 'utf8');
  const db = openStore();
  const dbPath = join(d, 'data', 'ordu.sqlite');
  const k = kabulOku(kabulEv);
  const defter = openReplanDefteri(dbPath);
  const t = replanTaslagi(olcSapma(db, k, {}), olcDrift(PLAN_MD, k));
  defter.taslakKaydet(t);
  const r = replanOnayla({ defter, taslakId: t.id, confirm: REPLAN_ONAY_METNI, actor: 'insan:cli', planEv });
  assert.equal(r.status, 'ONAYLANDI');
  assert.equal(r.uygulanan, 2, 'P1-9 + P2-10 (P2-10 iki kanıt TEK hücrede birleşir)');
  const sonra = readFileSync(planEv, 'utf8').split('\n');
  const once = PLAN_MD.split('\n');
  const idx = sonra.findIndex((s) => s.startsWith('| P1-9 '));
  assert.ok(idx > 0);
  assert.equal(sonra[idx].split('|').slice(0, 6).join('|'), once[idx].split('|').slice(0, 6).join('|'), 'ilk 5 hucre degismedi');
  assert.match(sonra[idx], /kapandi -> PASS \(kabul\.csv K13-01; replan tazeleme/);
  for (const [i, satir] of once.entries())
    if (!satir.startsWith('| P1-9 ') && !satir.startsWith('| P2-10 '))
      assert.equal(sonra[i], satir, 'dokunulmaz satir degisti: ' + satir);
  // onay kaydı deftere düştü; ikinci onay idempotent RED
  assert.equal(defter.onaylar().length, 1);
  assert.throws(() => replanOnayla({ defter, taslakId: t.id, confirm: REPLAN_ONAY_METNI, actor: 'insan:cli', planEv }), /idempotent/);
});

test('A2 plan18Tazele: arada değişmiş durum hücresi → dokunulmadan listesinde ADIYLA (sessiz ezme yok)', () => {
  const md = PLAN_MD.replace('tasarim tam; CANLI KANIT YOK', 'insan elle güncelledi');
  const t = { satirId: 'P1-9', eskiDurum: 'tasarim tam; CANLI KANIT YOK', yeniDurum: 'kapandi -> PASS (kabul.csv K13-01)', kabulId: 'K13-01' };
  const r = plan18Tazele(md, [t]);
  assert.equal(r.uygulanan, 0);
  assert.match(r.dokunulmayan.join('; '), /aradagismis/);
});

test('A2 önerisiz taslak onayı RED (sapma aşımı §18 hücresi YAZMAZ — ölçüm/uyarı sınıfı)', () => {
  const d = g();
  const dbPath = join(d, 'data', 'ordu.sqlite');
  const defter = openReplanDefteri(dbPath);
  const db = openStore();
  const t = replanTaslagi(olcSapma(db, { satirlar: [{ id: 'X', durum: 'NOT_RUN' }], atlanan: 0, ev: 'x' }, {}), {
    taranan: 0, tutarli: 0, bayat: 0, driftYuzde: 0, bayatHucreler: [], eslesenYok: [],
  });
  assert.equal(t.tetik, 'tetiklenmedi');
  defter.taslakKaydet(t);
  assert.throws(() => replanOnayla({ defter, taslakId: t.id, confirm: REPLAN_ONAY_METNI, actor: 'insan:cli', planEv: join(d, 'PLAN.md') }), /tazelenecek h/);
});

test('A2 B7 eş-taslak: aynı öneri imzası çift koşumda ikinci taslak DOĞURMAZ; kısmi küme eşleşmez; onaylı taslak eşleşmez', () => {
  // Üretim bulgusu (canlı ilk kullanım): replan ölçüm kaydı icerikHash'le idempotent
  // ama taslak yüzü değildi — çift gözlemsel koşum yinelenen taslak doğurdu.
  const d = g();
  const kabulEv = join(d, 'kabul.csv');
  writeFileSync(kabulEv, KABUL_CSV, 'utf8');
  const db = openStore();
  const dbPath = join(d, 'data', 'ordu.sqlite');
  const k = kabulOku(kabulEv);
  const defter = openReplanDefteri(dbPath);
  const sapma = olcSapma(db, k, {});
  const drift = olcDrift(PLAN_MD, k);
  const t1 = replanTaslagi(sapma, drift);
  defter.taslakKaydet(t1);
  // ikinci gözlemsel koşum: yeni id/at doğar ama eylem yükü (öneri kimlik kümesi) aynı
  const t2 = replanTaslagi(sapma, drift);
  assert.notEqual(t2.id, t1.id, 'hazırlık: iki ayrı taslak nesnesi');
  assert.equal(replanTaslakImzasi(t1.oneriler), replanTaslakImzasi(t2.oneriler), 'aynı drift → aynı imza');
  const eslesen = eslesenReplanTaslagi(defter.taslaklar(), new Set<string>(), t2.oneriler);
  assert.ok(eslesen, 'onaysız eş-taslak bulunur');
  assert.equal(eslesen!.id, t1.id, 'mevcut döner — kayıt doğmaz (CLI yüzü bu id ile devam eder)');
  // kısmi küme eşleşmez (farklı eylem yükü = farklı taslak)
  assert.equal(eslesenReplanTaslagi(defter.taslaklar(), new Set<string>(), t2.oneriler.slice(0, 1)), undefined, 'kısmi set eşleşmez');
  // onay tüketti: onaylı taslak eş-taslak DEĞİL — yeniden ölçülen aynı öneri yeni taslak ister
  assert.equal(eslesenReplanTaslagi(defter.taslaklar(), new Set([t1.id]), t2.oneriler), undefined, 'onaylı taslak eşleşmez (idempotans onaya karşı)');
});
