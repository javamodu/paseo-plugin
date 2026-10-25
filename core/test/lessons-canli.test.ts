// M14 + M15 canlÄ± bacak (FAZ-3 K2; triyaj raporlar/faz3-triyaj-2026-10-25.md): DÃœRÃœST
// GERÃ‡EK Ã¶ÄŸrenme dÃ¶ngÃ¼sÃ¼. Hermetik kol (lessons.test.ts) enjekte skorcard'lardÄ±; burada
// deney VE canary gÃ¶revleri GERÃ‡EK node Ã§ocuk sÃ¼reÃ§leridir â€” kabul/baÅŸarÄ±sÄ±z/timeout
// durumlarÄ± gerÃ§ek sÃ¼reÃ§ Ã§Ä±ktÄ±sÄ±, gerÃ§ek exit kodu ve GERÃ‡EK zaman aÅŸÄ±mÄ±yla (spawnSync
// timeout â†’ ETIMEDOUT â†’ SIGKILL) Ã¶lÃ§Ã¼lÃ¼r. L1/L2 kapÄ±larÄ± (autoâ†’PUBLISHED yasak, tam
// payda) gerÃ§ek veriyle Ã§alÄ±ÅŸÄ±r; M15: GERÃ‡EK baÅŸarÄ±sÄ±z canary gÃ¶revi gerÃ§ek regresyon
// doÄŸurur â†’ oto-REVOKE + geri-al; insan onayÄ± olmadan yeniden PUBLISHED olamaz.
// Not: lessons.ts'in validate() sÃ¶zleÅŸmesi SENKRONDUR â€” gerÃ§ek koÅŸumlar spawnSync ile
// deney fonksiyonunun Ä°Ã‡Ä°NDE senkron yÃ¼rÃ¼r (enjeksiyon yok; gerÃ§ek sÃ¼reÃ§ gerÃ§ek zaman).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  openLessonStore, scorecardFromAttempts, type AttemptDurum, type Scorecard, type LessonStore,
} from '../src/lessons.ts';

// GERÃ‡EK gÃ¶rev: gerÃ§ek node Ã§ocuÄŸu gerÃ§ek iÅŸ yapar; durum gerÃ§ek gÃ¶zlemden tÃ¼rer:
//  - kabul: exit-0 VE stdout beklenen Ã§Ä±ktÄ±ya EÅÄ°T (gerÃ§ek deÄŸerlendirme)
//  - basarisiz: exitâ‰ 0 VEYA Ã§Ä±ktÄ± yanlÄ±ÅŸ (gerÃ§ek baÅŸarÄ±sÄ±zlÄ±k)
//  - timeout: GERÃ‡EK zaman aÅŸÄ±mÄ± (spawnSync timeout â†’ ETIMEDOUT â†’ SIGKILL)
function gercekGorev(kod: string, beklenen: string, zamanAsimiMs = 4000): AttemptDurum {
  const r = spawnSync(process.execPath, ['-e', kod], { encoding: 'utf8', timeout: zamanAsimiMs, killSignal: 'SIGKILL' });
  if ((r.error as any)?.code === 'ETIMEDOUT') return 'timeout';
  const cikti = String(r.stdout ?? '').trim();
  return r.status === 0 && cikti === beklenen ? 'kabul' : 'basarisiz';
}

// gÃ¶rev fabrikasÄ±: n*2 hesabÄ±nÄ± YAPAN gerÃ§ek kod; hatalÄ± varyant gerÃ§ek exit-3 atar;
// duraksama varyantÄ± GERÃ‡EK zaman aÅŸÄ±mÄ±na dÃ¼ÅŸer (sonsuz bekleme).
const gorev = (n: number, tip: 'ok' | 'hata' | 'duraksama') =>
  tip === 'ok' ? 'process.stdout.write(String(' + n + ' * 2));'
    : tip === 'hata' ? 'process.stderr.write("gercek hata"); process.exit(3);'
      : 'setInterval(function(){},1000);';

function dersAkisiUnused(): void { /* akÄ±ÅŸ iki testte de satÄ±r iÃ§i â€” ortak yardÄ±mcÄ± gerekmedi */ }
void dersAkisiUnused;

test('M14 canlÄ± Ã¶ÄŸrenme dÃ¶ngÃ¼sÃ¼: GERÃ‡EK sÃ¼reÃ§ deneyi â†’ VALIDATING â†’ insan ONAY#2 â†’ PUBLISHED â†’ uygulanÄ±r', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-m14-'));
  const store = openLessonStore(join(dir, 'lessons.jsonl')); // gerÃ§ek saat; canary 3 gÃ¶rev; esik 0.2

  const l = store.propose({
    kind: 'VERI', source: 'auto',
    text: 'm14 canli dersi',
    evidenceRef: 'test/lessons-canli.test.ts',
    scope: { repoId: 'ordu/core', suiteId: 'm14-canli', surum: '1.0.0' },
    expiresAt: new Date(Date.now() + 36e5).toISOString(),
  });

  // GERÃ‡EK deney: 6 gerÃ§ek gÃ¶rev (4 kabul + 1 gerÃ§ek hata + 1 GERÃ‡EK zaman aÅŸÄ±mÄ±)
  const v = store.validate(l.id, () => {
    const durumlar: AttemptDurum[] = [
      gercekGorev(gorev(21, 'ok'), '42'),
      gercekGorev(gorev(7, 'ok'), '14'),
      gercekGorev(gorev(5, 'ok'), '10'),
      gercekGorev(gorev(3, 'ok'), '6'),
      gercekGorev(gorev(2, 'hata'), '4'),          // GERÃ‡EK baÅŸarÄ±sÄ±z: exit-3
      gercekGorev(gorev(1, 'duraksama'), '2', 400), // GERÃ‡EK timeout: 400ms gerÃ§ek aÅŸÄ±m
    ];
    return scorecardFromAttempts(durumlar);
  });
  assert.equal(v.state, 'VALIDATING');
  assert.deepEqual(
    { b: v.scorecard?.baslayan, k: v.scorecard?.kabul, t: v.scorecard?.timeout, h: v.scorecard?.basarisiz },
    { b: 6, k: 4, t: 1, h: 1 },
    'GERÃ‡EK deney: 6 baÅŸlayan = 4 kabul + 1 baÅŸarÄ±sÄ±z + 1 GERÃ‡EK timeout (tam payda)',
  );

  // insan ONAY#2 ile PUBLISHED (L1: auto kaynak bu kapÄ±dan GEÃ‡MEDEN yayÄ±mlanamazdÄ±)
  const p = store.publish(l.id, 'onay-#2-insan-2026-10-25');
  assert.equal(p.state, 'PUBLISHED');
  assert.ok(p.canary, 'canary aktif');
  assert.equal(p.canary?.bazOran, 4 / 6, 'baz oran gerÃ§ek deneyden: 4/6');

  // uygulama noktasÄ±: PUBLISHED ders uygulanÄ±r (VERI â†’ politika olarak da geÃ§erli)
  const applied = store.applyLesson(l.id, { asPolicy: true });
  assert.equal(applied.state, 'PUBLISHED');
  console.log('KANIT M14: gerÃ§ek sÃ¼reÃ§ deneyi (6 gÃ¶rev: 4 kabul + 1 gerÃ§ek exit-3 + 1 GERÃ‡EK timeout) â†’ VALIDATING â†’ ONAY#2 â†’ PUBLISHED (baz=4/6); ders uygulanabilir');
});

test('M15 canlÄ± canary: GERÃ‡EK baÅŸarÄ±sÄ±z canary gÃ¶revi â†’ gerÃ§ek regresyon â†’ oto-REVOKE + geri-al; yeniden PUBLISHED RED', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-m15-'));
  const store = openLessonStore(join(dir, 'lessons.jsonl'));

  // baz: 4/6 gerÃ§ek deney (M14 deseni â€” kÄ±sa gerÃ§ek deney)
  const durumlar: AttemptDurum[] = [
    gercekGorev(gorev(4, 'ok'), '8'),
    gercekGorev(gorev(9, 'ok'), '18'),
    gercekGorev(gorev(6, 'ok'), '12'),
    gercekGorev(gorev(5, 'hata'), '10'), // gerÃ§ek baÅŸarÄ±sÄ±z
  ];
  const baz = scorecardFromAttempts(durumlar);
  assert.equal(baz.kabul / baz.baslayan, 3 / 4);

  const l = store.propose({
    kind: 'VERI', source: 'retro',
    text: 'm15 canli canary dersi',
    evidenceRef: 'test/lessons-canli.test.ts',
    scope: { repoId: 'ordu/core', suiteId: 'm15-canli', surum: '1.0.0' },
    expiresAt: new Date(Date.now() + 36e5).toISOString(),
  });
  store.validate(l.id, () => baz);
  const p = store.publish(l.id, 'onay-#2-insan-2026-10-25');
  assert.equal(p.canary?.bazOran, 0.75);
  assert.equal(p.canary?.kalan, 3);

  // canary adÄ±m-1: GERÃ‡EK gÃ¶rev BAÅARILI â†’ oran 1.0; dÃ¼ÅŸÃ¼ÅŸ yok â†’ canary-adim, kalan 2
  const a1 = store.recordCanaryResult(l.id, scorecardFromAttempts([gercekGorev(gorev(11, 'ok'), '22')]));
  assert.equal(a1.canary?.kalan, 2);
  assert.ok(store.events().some((e) => e.event === 'canary-adim'));

  // canary adÄ±m-2: GERÃ‡EK gÃ¶rev BAÅARISIZ (gerÃ§ek exit-3) â†’ oran 0.0; dÃ¼ÅŸÃ¼ÅŸ 0.75 â‰¥ esik 0.2
  // â†’ OTO-GERÄ°-AL: REVOKED + geri-al event'i (insan onayÄ± olmadan yeniden PUBLISHED yok)
  const a2 = store.recordCanaryResult(l.id, scorecardFromAttempts([gercekGorev(gorev(8, 'hata'), '16')]));
  assert.equal(a2.state, 'REVOKED', 'gerÃ§ek regresyon â†’ oto-REVOKE');
  assert.equal(a2.canary, null);
  const geriAl = store.events().find((e) => e.event === 'geri-al');
  assert.ok(geriAl?.reason?.includes('canary regresyonu oto-geri-al'), 'geri-al olayÄ± gerÃ§ek dÃ¼ÅŸÃ¼ÅŸle gerekÃ§eli: ' + geriAl?.reason);

  // yeniden yayÄ±m RED: REVOKED'dan publish yok; uygulama RED (fail-closed)
  assert.throws(() => store.publish(l.id, 'tekrar-onay'), /publish yalniz VALIDATING/);
  assert.throws(() => store.applyLesson(l.id), /ders uygulanamaz/);
  console.log('KANIT M15: gerÃ§ek canary â€” adÄ±m-1 gerÃ§ek kabul (kalan 2); adÄ±m-2 GERÃ‡EK baÅŸarÄ±sÄ±z gÃ¶rev (oran 0, dÃ¼ÅŸÃ¼ÅŸ 0.75 â‰¥ esik 0.2) â†’ oto-REVOKE + geri-al; yeniden PUBLISHED RED, uygulama RED');
});


