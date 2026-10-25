// F6-A/F6-B ogrenme hatti — hermetik kanit (plan §9.4).
// Iddialar: (1) zorunlu alan eksikse PROPOSED RED; (2) L1: auto not dogrudan PUBLISHED
// olamaz; (3) insan onayli zincir PROPOSED->VALIDATING->PUBLISHED PASS; (4) ONAY#2
// olmadan publish RED; (5) EXPIRED/REVOKED ders uygulanamaz (fail-closed);
// (6) TALIMAT dersi POLITIKA otoritesi olamaz; (7) F6-B: canary regresyonu oto-REVOKE
// + geri-al eventi, yeniden publish RED; (8) L2 tam payda (timeout dahil);
// (9) lessons.jsonl append-only + tail-repair. Gercek LLM/dis API YOK — eslenmis
// deney soyut fonksiyon enjeksiyonuyla.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, appendFileSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  openLessonStore, scorecardFromAttempts, basariOrani, LessonError,
  type AttemptDurum, type ProposeInput, type Scorecard,
} from '../src/lessons.ts';

const yeniYol = () => join(mkdtempSync(join(tmpdir(), 'ordu-lessons-')), 'lessons.jsonl');
const store = (opts: Parameters<typeof openLessonStore>[1] = {}) => openLessonStore(yeniYol(), opts);

const gecerli = (over: Partial<ProposeInput> = {}): ProposeInput => ({
  kind: 'VERI',
  source: 'human',
  text: 'regresyon oncesi ilgili suite kos',
  evidenceRef: 'kanit/run-42#skorcard',
  scope: { repoId: 'repo-a', suiteId: 'suite-1', surum: 'v2' },
  expiresAt: '2027-01-01T00:00:00Z',
  ...over,
});

// Eslenmis izole deney — soyut fonksiyon; attempt durumlarindan skorcard uretir.
const deney = (durumlar: AttemptDurum[]) => () => scorecardFromAttempts(durumlar);

const kodIle = (kod: string) => (e: unknown) => e instanceof LessonError && e.code === kod;

// --- F6-A: zorunlu alanlar ---
test('propose: zorunlu alan eksikse RED (kanit/kapsam/expiry/kind/text)', () => {
  const s = store();
  const dene = (over: Partial<ProposeInput>) =>
    assert.throws(() => s.propose(gecerli(over)), kodIle('eksik-alan'));
  dene({ evidenceRef: '' });                       // kaynak kanit referansi zorunlu
  dene({ evidenceRef: undefined as unknown as string });
  dene({ scope: { repoId: '', suiteId: 's', surum: 'v' } });
  dene({ scope: { repoId: 'r', suiteId: 's', surum: '' } });
  dene({ scope: undefined as unknown as ProposeInput['scope'] });
  dene({ expiresAt: 'tarih-degil' });             // expiry ISO olmali
  dene({ expiresAt: '' });
  dene({ kind: 'NOT' as unknown as ProposeInput['kind'] });
  dene({ text: '   ' });
  // tam girdide PROPOSED (karantina)
  assert.equal(s.propose(gecerli()).state, 'PROPOSED');
});

// --- F6-A: L1 + insan onayli zincir ---
test('L1: auto not dogrudan PUBLISHED olamaz (RED); VALIDATING + insan onayiyla olur', () => {
  const s = store();
  const l = s.propose(gecerli({ source: 'auto' }));
  assert.throws(() => s.publish(l.id, 'ONAY#2: operator'), kodIle('auto-promote-yasak'));
  // insan dersi bile PROPOSED'dan atlayamaz
  const h = s.propose(gecerli());
  assert.throws(() => s.publish(h.id, 'ONAY#2: operator'), kodIle('gecersiz-gecis'));
  // auto, eslenmis deney + insan onayindan sonra promote olabilir
  s.validate(l.id, deney(['kabul', 'kabul']));
  assert.equal(s.publish(l.id, 'ONAY#2: operator').state, 'PUBLISHED');
});

test('F6-A zincir PASS: PROPOSED -> VALIDATING(eslenmis deney+skorcard) -> PUBLISHED(ONAY#2)', () => {
  const s = store();
  const l = s.propose(gecerli());
  const v = s.validate(l.id, deney(['kabul', 'kabul', 'kabul']));
  assert.equal(v.state, 'VALIDATING');
  assert.equal(v.scorecard?.kabul, 3);
  // ONAY#2 (insan onayi) olmadan publish RED
  assert.throws(() => s.publish(l.id, ''), kodIle('onay-gerekli'));
  assert.throws(() => s.publish(l.id, undefined as unknown as string), kodIle('onay-gerekli'));
  const p = s.publish(l.id, 'ONAY#2: operator ayse');
  assert.equal(p.state, 'PUBLISHED');
  assert.deepEqual(p.approvals, ['ONAY#2: operator ayse']);
  assert.equal(p.canary?.kalan, 3); // plan §9.4: canary ilk 3 gorev
  assert.equal(p.canary?.bazOran, 1);
  assert.equal(s.applyLesson(l.id).id, l.id); // PUBLISHED ders uygulanabilir
});

// --- fail-closed uygulama noktasi ---
test('EXPIRED ve REVOKED ders uygulanamaz (RED); PUBLISHED olmayan da uygulanamaz', () => {
  let simdi = new Date('2026-10-14T00:00:00Z');
  const s = store({ now: () => simdi });
  const l = s.propose(gecerli({ expiresAt: '2026-10-15T00:00:00Z' }));
  assert.throws(() => s.applyLesson(l.id), kodIle('ders-uygulanamaz')); // PROPOSED uygulanamaz
  s.validate(l.id, deney(['kabul']));
  s.publish(l.id, 'ONAY#2: x');
  assert.equal(s.applyLesson(l.id).state, 'PUBLISHED');
  simdi = new Date('2026-10-16T00:00:00Z'); // expiry doldu
  assert.throws(() => s.applyLesson(l.id), kodIle('ders-uygulanamaz'));
  assert.equal(s.get(l.id)?.state, 'EXPIRED');

  const r = s.propose(gecerli({ expiresAt: '2027-06-01T00:00:00Z' }));
  s.validate(r.id, deney(['kabul']));
  s.publish(r.id, 'ONAY#2: x');
  s.revoke(r.id, 'insan geri-aldi');
  assert.throws(() => s.applyLesson(r.id), kodIle('ders-uygulanamaz'));
});

test('veri-talimat ayrimi: TALIMAT dersi POLITIKA otoritesi OLAMAZ (RED)', () => {
  const s = store();
  const l = s.propose(gecerli({ kind: 'TALIMAT' }));
  s.validate(l.id, deney(['kabul', 'kabul']));
  s.publish(l.id, 'ONAY#2: x');
  assert.equal(s.applyLesson(l.id).kind, 'TALIMAT'); // talimat olarak uygulanabilir
  assert.throws(() => s.applyLesson(l.id, { asPolicy: true }), kodIle('talimat-politika-olamaz'));
});

// --- F6-B: regresyonda oto-geri-al ---
test('F6-B: canary regresyonu oto-REVOKE + geri-al eventi; insan onayi olmadan yeniden PUBLISHED olamaz', () => {
  const s = store({ regresyonEsigi: 0.2 });
  const l = s.propose(gecerli());
  s.validate(l.id, deney(['kabul', 'kabul', 'kabul', 'kabul'])); // baz oran 1.0
  s.publish(l.id, 'ONAY#2: x');
  const r = s.recordCanaryResult(l.id, scorecardFromAttempts(['kabul', 'basarisiz', 'basarisiz'])); // oran 1/3
  assert.equal(r.state, 'REVOKED'); // dusus 0.667 >= 0.2 → oto-geri-al
  const ev = s.events();
  assert.ok(ev.some((e) => e.event === 'geri-al'));
  assert.equal(ev.at(-1)?.lesson.state, 'REVOKED');
  assert.match(ev.at(-1)?.reason ?? '', /regresyon/);
  // yeniden publish RED — onay metniyle bile (REVOKED'dan dogrudan gecis yok)
  assert.throws(() => s.publish(l.id, 'ONAY#2: tekrar'), kodIle('gecersiz-gecis'));
  assert.throws(() => s.applyLesson(l.id), kodIle('ders-uygulanamaz'));
  assert.equal(s.get(l.id)?.state, 'REVOKED');
});

test('F6-B: regresyon yoksa canary 3 gorev sonra kapanir, ders PUBLISHED kalir', () => {
  const s = store({ regresyonEsigi: 0.2 });
  const l = s.propose(gecerli());
  s.validate(l.id, deney(['kabul', 'kabul', 'iptal'])); // baz 2/3
  s.publish(l.id, 'ONAY#2: x');
  const a1 = s.recordCanaryResult(l.id, scorecardFromAttempts(['kabul', 'kabul', 'iptal'])); // ayni oran
  assert.equal(a1.state, 'PUBLISHED');
  assert.equal(a1.canary?.kalan, 2);
  s.recordCanaryResult(l.id, scorecardFromAttempts(['kabul', 'kabul', 'timeout'])); // timeout paydada
  const a3 = s.recordCanaryResult(l.id, scorecardFromAttempts(['kabul', 'kabul', 'iptal']));
  assert.equal(a3.canary, null); // canary kapandi
  assert.ok(s.events().some((e) => e.event === 'canary-kapandi'));
  assert.equal(s.applyLesson(l.id).state, 'PUBLISHED');
  // canary kapandiktan sonra yeni canary sonucu RED
  assert.throws(() => s.recordCanaryResult(l.id, scorecardFromAttempts(['kabul'])), kodIle('gecersiz-gecis'));
});

// --- L2: tam payda ---
test('L2 tam payda: timeout dahil sayim; oran=kabul/baslayan; bozuk payda RED', () => {
  const sc = scorecardFromAttempts(['kabul', 'kabul', 'timeout', 'iptal', 'atlandi', 'basarisiz']);
  assert.equal(sc.baslayan, 6);
  assert.equal(sc.timeout, 1); // timeout paydadan dusmez
  assert.equal(sc.iptal, 1);
  assert.equal(basariOrani(sc), 2 / 6); // basari = kabul/baslayan (attempt != basari)
  const s = store();
  const l = s.propose(gecerli());
  const bozuk: Scorecard = { baslayan: 5, kabul: 2, basarisiz: 1, atlandi: 1, iptal: 0, timeout: 0 }; // toplam 4 != 5
  assert.throws(() => s.validate(l.id, () => bozuk), kodIle('tam-payda'));
  assert.equal(s.get(l.id)?.state, 'PROPOSED'); // bozuk deney kanit sayilmaz
  const bos: Scorecard = { baslayan: 0, kabul: 0, basarisiz: 0, atlandi: 0, iptal: 0, timeout: 0 };
  assert.throws(() => s.validate(l.id, () => bos), kodIle('skorcard-gecersiz'));
  // saglam deney sonrasi zincir devam eder
  assert.equal(s.validate(l.id, deney(['kabul'])).state, 'VALIDATING');
});

// --- kalicilik: append-only jsonl + tail-repair ---
test('kalicilik: yeniden acilista durum korunur (append-only jsonl replay)', () => {
  const p = yeniYol();
  const s1 = openLessonStore(p);
  const l = s1.propose(gecerli());
  s1.validate(l.id, deney(['kabul', 'kabul']));
  s1.publish(l.id, 'ONAY#2: x');
  const s2 = openLessonStore(p);
  assert.equal(s2.get(l.id)?.state, 'PUBLISHED');
  assert.deepEqual(s2.get(l.id)?.approvals, ['ONAY#2: x']);
  assert.equal(s2.events().length, 3);
});

test('tail-repair: bozuk SON satir budanir, onceki kayitlar korunur, append surer', () => {
  const p = yeniYol();
  const s1 = openLessonStore(p);
  const l = s1.propose(gecerli());
  s1.validate(l.id, deney(['kabul']));
  const boyutOnce = statSync(p).size;
  appendFileSync(p, '{"event":"published","lesson":{"id":"yarim'); // crash'te yarim kalan yazim
  const s2 = openLessonStore(p); // yukleme sirasinda onarim
  assert.equal(s2.get(l.id)?.state, 'VALIDATING');
  assert.equal(s2.events().length, 2);
  assert.equal(statSync(p).size, boyutOnce); // bozuk kuyruk budandi
  s2.publish(l.id, 'ONAY#2: x'); // onarim sonrasi append calisir
  assert.equal(s2.get(l.id)?.state, 'PUBLISHED');
  // orta satir bozuksa fail-closed RED (sessiz onarim yok)
  const p2 = join(mkdtempSync(join(tmpdir(), 'ordu-lessons-')), 'bozuk.jsonl');
  const ilk = readFileSync(p, 'utf8').split('\n')[0];
  writeFileSync(p2, ilk + '\nBOZUK-SATIR\n' + ilk + '\n');
  assert.throws(() => openLessonStore(p2), kodIle('bozuk-kayit'));
});