// K13-02 (plan §23 SENARYO A) — ARASTIRMA UCTAN UCA KOMPOZIT KOSUM. F8 protokol
// motoru (src/turnuva.ts) + GERCEK defter runi bir akista: 5 bagimsiz model →
// surumlu kayit → ortak rubric → capraz elestiri → revizyon → yeniden degerlendirme
// → KANITLI SENTEZ. "PASS ancak kosulumuz komut + exit-0 + artefakt ile" (§23):
// sentez GERCEK dosya + evaluateArtifact (bagimsiz dosya degerlendiricisi, A13
// kanit zinciri) + insan karari APPROVED → run ACCEPTED. Turnuvanin bagimsiz son
// incelemesi katilimci OLMAYAN degerlendirenden (insan:gozlemci) — cift bagimsiz
// bacak (protokol + defter).
// DURUST KAPSAM: katilimci AJAN katmani kompozittir (kimlik duzeyinde 5 cift; 4 cift
// registry-canli-kanitli + codefast/kimi-K3 kimlik). Gerçek 5-model spawn ayri canli
// tur ister (F6.5 canli deseni). Protokol kapilari + defter zinciri GERCEKTIR.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, setGlobalStop } from '../src/store.ts';
import {
  createRunPlan, approvePlan, dispatchNode, ensureStartCommand, requestAcceptance, decideApproval,
} from '../src/supervisor.ts';
import { processOutbox } from '../src/dispatcher.ts';
import type { SpawnResult, WorkerAdapter } from '../src/dispatcher.ts';
import { evaluateArtifact } from '../src/cli-evaluate.ts';
import { openTurnuva } from '../src/turnuva.ts';
import { sampleHandoff } from '../src/handoff.ts';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

class FakeAdapter implements WorkerAdapter {
  spawnCalls: any[] = [];
  async spawn(o: any) { this.spawnCalls.push(o); return { outcome: 'OK', externalSessionId: 'ses-a1' } as SpawnResult; }
  async lookup(_dk: string) { return 'UNKNOWN' as const; }
}

test('K13-02 SENARYO A: 5 bagimsiz model → rubric → capraz elestiri → revizyon → yeniden degerlendirme → kanitli sentez (run ACCEPTED)', async () => {
  const db = openStore();
  const dir = mkdtempSync(join(tmpdir(), 'k13-a-'));
  const runId = 'run-k13a';

  // (0) GERCEK DEFTER RUNI: tek sentez nodeu (arastirmaci rolü) — kimlik zinciri
  // taskId -> runId -> roundId -> nodeId -> attemptId (§21). Kosulumuz komut listesi
  // ['npm test'] (P0-4). Turnuva runa BAGLANIR (runId + taskId).
  setGlobalStop(db, false, 'insan:test', 'k13 senaryo A kurulum');
  const goal = 'K13 senaryo A: 5-model arastirma turnuvasi + kanitli sentez';
  const { planHash, startCommandId } = (() => {
    const { planHash } = createRunPlan(db, {
      capsuleId: 'cap-' + runId, goal, repoId: 'ordu/core', sourceCommit: sha(runId),
      runId, planId: 'plan-' + runId, profileHash: sha('k13a:' + runId),
      nodes: [{ id: 'n1', role: 'arastirmaci', deps: [] }], maxWorkers: 1, allowedCommands: ['npm test'],
    });
    approvePlan(db, runId, planHash, 'insan:test');
    return { planHash, startCommandId: ensureStartCommand(db, runId, planHash, 'insan:test') };
  })();

  // (1) TURNUVA ACILISI: 5 bagimsiz model, ortak rubric (2 kriter), kaynak evreni
  const KATILIMCILAR = [
    { provider: 'codex', model: 'kimi-K3', nodeId: 'n1' },
    { provider: 'codex', model: 'gpt-5.4' },
    { provider: 'codex', model: 'glm-5.3' },
    { provider: 'glm53u-codex', model: 'glm-5.3' },
    { provider: 'codefast', model: 'kimi-K3' }, // kompozit kimlik (durust kapsam)
  ];
  const KIMLIKLER = KATILIMCILAR.map((k) => k.provider + '/' + k.model);
  const turnuvaYolu = join(dir, 'turnuva.jsonl');
  const t = openTurnuva(turnuvaYolu, {
    turnuvaId: 't-k13a', runId, taskId: goal,
    rubric: { surum: 'r1', kriterler: [
      { id: 'dogruluk', ad: 'kaynaklar iddialari tasiyor mu' },
      { id: 'kapsam', ad: 'brief kapsaniyor mu' },
    ] },
    katilimcilar: KATILIMCILAR,
    kaynakEvreni: ['K-0001', 'K-0002', 'K-0003', 'K-0004', 'K-0005'],
  });

  // (2) ADIM 1+2: bes BAGIMSIZ ilk cevap (review acilmadan; surumlu kayit: runtime)
  for (let i = 0; i < 5; i++) {
    t.surumKaydet({
      round: 1, katilimci: KIMLIKLER[i], kayitTip: 'cevap',
      icerik: 'I: model ' + (i + 1) + ' bulgusu\nK: K-000' + (i + 1),
      brief: 'arastirma brief ' + (i + 1), kaynaklar: ['K-000' + (i + 1)],
      runtime: 'llm-runtime-' + (i + 1),
    });
  }
  // ADIM 1 kapisinin senaryo ici kaniti: review acildiktan sonra yeni ilk cevap RED
  // (asagida (3) sonrasi) — bagimsiz uretim penceresi kapandigini senaryo akisi icerisinde
  // sinamak icin once review acacagiz.
  // (3) ADIM 3: on-kontrol — tum ilk cevaplar temiz
  for (let i = 0; i < 5; i++) assert.deepEqual(t.onKontrol({ katilimci: KIMLIKLER[i], surumNo: 1 }), []);
  // (4) ADIM 4: capraz elestiri — her katilimci diger DORT modelin SABIT v1ini
  // alti-alanli review kaydiyla degerlendirir (5x4 = 20)
  const reviewGovde = (hedef: string) => ({
    round: 1 as const, hedefKatilimci: hedef, hedefSurumNo: 1,
    olcutPuanlari: { dogruluk: 4, kapsam: 3 } as Record<string, number>,
    gerekce: 'kaynak zinciri tasiyor', kanitRef: 'K-0001',
    kritikItiraz: 'orneklem kucuk', kapatmaDeneyi: 'tekrar olcum', belirsizlik: 'tek bolge',
  });
  for (const reviewer of KIMLIKLER) for (const hedef of KIMLIKLER) {
    if (reviewer !== hedef) t.reviewKaydet({ ...reviewGovde(hedef), reviewer });
  }
  // bagimsizlik kapisinin senaryo ici kirmizisi: pencere kapandi
  assert.throws(() => t.surumKaydet({
    round: 1, katilimci: KIMLIKLER[0], kayitTip: 'cevap',
    icerik: 'gec cevap', brief: 'b', kaynaklar: ['K-0001'],
  }), /bagimsiz uretim penceresi kapali/, 'ilk review acildi — gec ilk-cevap RED');
  // (5) ADIM 5: her model YALNIZ KENDI revizyonunu uretir
  for (let i = 0; i < 5; i++) {
    t.surumKaydet({
      round: 2, katilimci: KIMLIKLER[i], kayitTip: 'revizyon',
      icerik: 'I: duzeltilmis bulgu ' + (i + 1) + '\nK: K-000' + (i + 1),
      brief: 'revize brief ' + (i + 1), kaynaklar: ['K-000' + (i + 1)],
    });
  }
  // (6) ADIM 6: yeniden degerlendirme — ayni rubric surumuyle round 2 capraz review
  for (const reviewer of KIMLIKLER) for (const hedef of KIMLIKLER) {
    if (reviewer !== hedef) t.reviewKaydet({ ...reviewGovde(hedef), reviewer, round: 2, hedefSurumNo: 2 });
  }
  for (let i = 0; i < 5; i++) t.onKontrol({ katilimci: KIMLIKLER[i], surumNo: 2 });

  // (7) ADIM 7a: KANITLI SENTEZ — sentez GERCEK DOSYA olarak dogar (artefakt);
  // defter tarafinda sentez nodeunun attempti dispatch edilir, oturum baglanir
  const att = dispatchNode(db, runId, 'n1', {
    tokens: 100, startCommandId, dispatchKey: 'dk-k13a-1', handoff: sampleHandoff(runId),
  }) as any;
  const adapter = new FakeAdapter();
  const r = await processOutbox(db, adapter);
  assert.equal(r.result, 'bound', 'sentez node oturumu baglandi (kimlik zinciri attempt ucu)');
  const sentezDosyasi = join(dir, 'sentez-k13a.md');
  writeFileSync(sentezDosyasi, 'KANITLI SENTEZ (K13-02): 5 modelin duzeltilmis bulgulari birlesti; capraz teyit 40 review; kaynak evreni 5/5', 'utf8');
  t.sentezKaydet({ icerik: readFileSync(sentezDosyasi, 'utf8') });
  // (8) ADIM 7b: BAGIMSIZ SON INCELEME (katilimci OLMAYAN degerlendiren) → basari
  t.bagimsizDegerlendirme({ degerlendiren: 'insan:gozlemci', verdict: 'PASS', gerekce: 'kaynak zinciri + capraz teyit + sentez kapsami tamam' });
  const b = t.basari();
  assert.equal(b.basari, true, 'bagimsiz PASS olmadan basari ilan EDILEMEZ — burada ilan edildi: ' + b.engeller.join(';'));
  // K12-01: tum surumler + review kayitli (sorgulanabilir)
  const d = t.durumu();
  assert.equal(d.surumler.length, 10, '5 model x 2 tur = 10 surum');
  assert.equal(d.reviews.length, 40, '2 tur x 20 capraz review');
  assert.equal(d.baslangic.runId, runId, 'turnuva defter runina bagli (kimlik zinciri)');

  // (9) DEFTER BACAGI: bagimsiz dosya degerlendiricisi (kosullu komut + GERCEK
  // artefakt + beklenti + exit-0) → teslim → insan karari → run ACCEPTED
  const ev = evaluateArtifact(db, {
    attemptId: att.attemptId, artifactPath: sentezDosyasi,
    expect: 'KANITLI SENTEZ (K13-02)', actorId: 'insan:gozlemci', artifactsDir: join(dir, 'art'),
  });
  assert.equal(ev.verdict, 'PASS', 'sentez artefakti bagimsiz degerlendiriciden PASS');
  assert.equal(ev.exitCode, 0, 'exit-0 (kosullu komut kosumu temiz)');
  const kanit = db.prepare("SELECT COUNT(*) c FROM evidence WHERE attempt_id=? AND verdict='PASS'").get(att.attemptId) as any;
  assert.equal(kanit.c, 1, 'A13 kanit satiri defterde');
  const req = requestAcceptance(db, runId, 'insan:test');
  const versiyon = (db.prepare('SELECT version FROM runs WHERE id=?').get(runId) as any).version;
  const karar = decideApproval(db, req.approvalId, 'APPROVED', 'insan:test', versiyon);
  assert.equal(karar.status, 'ACCEPTED', 'insan karari sentezi teslim kabul etti');
  assert.equal((db.prepare('SELECT state FROM runs WHERE id=?').get(runId) as any).state, 'ACCEPTED', 'SENARYO A runi ACCEPTED');

  // (10) turnuva kayitlari DISKTE (append-only) — kalici kanit
  const diskSatirlar = readFileSync(turnuvaYolu, 'utf8').split('\n').filter((l) => l.trim() !== '');
  assert.equal(diskSatirlar.length, 1 + 5 + 5 + 20 + 5 + 20 + 5 + 1 + 1, 'turnuva zinciri diskte: acilis + cevaplar + onkontroller + 40 review + revizyonlar + sentez + bagimsiz degerlendirme');
  console.log('KANIT K13-02: senaryo A uctan uca — 5 model iki tur, 40 capraz review, bagimsiz PASS, kanitli sentez (A13 evidence + insan karari) run ACCEPTED');
});
