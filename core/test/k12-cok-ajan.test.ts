// K12 — ÇOK-AJAN SENARYO KAPILARI (PLAN §23 release senaryolarının hermetik koşumları;
// "kod çoğunlukla mevcut" iddiası burada sınanır: her senaryo mevcut çekirdek kapılarını
// UÇTAN UCA tetikler; yeni kod yalnızca K12-04'ün değerlendirici-symlink bacağı).
// DÜRÜST KAPSAM AYRIMI: K12-01/02 F8 turnuva protokolüne, K12-14 F9 adaptörüne, K12-11
// (deadline bildirim+kapanış politikası) ve K12-12 (R8 5-şart alt-ajan guard'ı) ayrı
// tura bağlı — bu dosyada SAHTE kanıt ÜRETİLMEZ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  openStore, recordCommand, setGlobalStop, reserveDispatch, takeLease, commitCandidate,
  recordEvidence, settleReservation,
} from '../src/store.ts';
import {
  createRunPlan, approvePlan, dispatchNode, ensureStartCommand, requestAcceptance,
  requestGrantApproval, decideApproval,
} from '../src/supervisor.ts';
import { processOutbox } from '../src/dispatcher.ts';
import type { SpawnResult, WorkerAdapter } from '../src/dispatcher.ts';
import { evaluateArtifact } from '../src/cli-evaluate.ts';
import { createGrant, vekilActorOf } from '../src/grants.ts';
import { sampleHandoff } from '../src/handoff.ts';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const H64 = (c: string) => c.repeat(64).slice(0, 64);

class FakeAdapter implements WorkerAdapter {
  spawnCalls: any[] = [];
  lookups = new Map<string, 'ALIVE' | 'DEAD' | 'UNKNOWN'>();
  script: SpawnResult[]; // boş dizi → spawn exception (API kopması)
  constructor(script: SpawnResult[] = [{ outcome: 'OK', externalSessionId: 'ses-1' }]) { this.script = [...script]; }
  async spawn(o: any) {
    this.spawnCalls.push(o);
    if (this.script.length === 0) throw new Error('bağlantı koptu');
    return this.script.shift()!;
  }
  async lookup(dk: string) { return this.lookups.get(dk) ?? 'UNKNOWN'; }
}

// kapsül → onay → dispatch: iki node'lu plan (n1 + n2 bağımsız), outbox'ta PENDING
// satır doğar (o.nodeId ile n2 de dispatch edilebilir — K12-13 izin bacağı).
// o.kurulumYok: MEVCUT run'a yeni node dispatch'i (kapsül/plan/onay yeniden kurulmaz —
// K12-13'ün n2 bacakları; o.startCommandId zorunlu)
function kapsulAkisi(db: any, runId: string, o: {
  model?: string; dispatchKey?: string; nodeId?: string; kurulumYok?: boolean; startCommandId?: string;
} = {}) {
  const hedef = o.nodeId ?? 'n1';
  let planHash = '';
  let startCommandId = o.startCommandId ?? '';
  if (!o.kurulumYok) {
    setGlobalStop(db, false, 'insan:test', 'k12 kurulum'); // taze defter fail-closed doğar → kurulum mandalı açar
    ({ planHash } = createRunPlan(db, {
      capsuleId: 'cap-' + runId, goal: 'K12 senaryo', repoId: 'ordu/core', sourceCommit: sha(runId),
      runId, planId: 'plan-' + runId, profileHash: sha('k12:' + runId),
      nodes: [
        { id: 'n1', role: 'coder', deps: [], ...(hedef === 'n1' && o.model ? { provider: 'codex', model: o.model } : {}) },
        { id: 'n2', role: 'coder', deps: [], ...(hedef === 'n2' && o.model ? { provider: 'codex', model: o.model } : {}) },
      ],
      maxWorkers: 1, allowedCommands: ['npm test'],
    }));
    approvePlan(db, runId, planHash, 'insan:test');
    startCommandId = ensureStartCommand(db, runId, planHash, 'insan:test');
  }
  const att = dispatchNode(db, runId, hedef, {
    tokens: 1000, startCommandId, dispatchKey: o.dispatchKey ?? 'dk-' + runId, handoff: sampleHandoff(runId),
  });
  return { planHash, startCommandId, attemptId: (att as any).attemptId };
}

test('K12-03 (F2): ajan kendi çıktısına PASS gönderir → kabul OLUŞMAZ (bağımsız değerlendirici)', () => {
  const db = openStore();
  const { attemptId } = kapsulAkisi(db, 'run-k1203');
  const dir = mkdtempSync(join(tmpdir(), 'k12-03-'));
  const artifact = join(dir, 'ajan-ciktisi.txt');
  writeFileSync(artifact, 'AJAN BEYANI: GOREV TAMAMLANDI. PASS. PASS. PASS.'); // öz-beyan
  const r = evaluateArtifact(db, {
    attemptId, artifactPath: artifact, expect: 'bagimsiz-degerlendirici-beklentisi',
    actorId: 'insan:test', artifactsDir: join(dir, 'art'),
  });
  assert.equal(r.verdict, 'FAIL', 'öz-beyan PASS bağımsız değerlendiriciden GEÇMEZ');
  assert.ok(r.checks.some((c) => c.ad === 'icerik-beklenti' && !c.gecti), 'beklenti kontrolü kırmızı');
  // audit: FAIL kanıtı defterde (evidence satırı)
  assert.equal((db.prepare("SELECT verdict FROM evidence WHERE attempt_id=? ORDER BY rowid DESC LIMIT 1").get(attemptId) as any).verdict, 'FAIL');
  // zincir kapanışı: node FAILED → teslim istenemez → onay kartı YOK → run ASLA ACCEPTED olmaz
  assert.equal((db.prepare("SELECT state FROM nodes WHERE run_id='run-k1203' AND id='n1'").get() as any).state, 'FAILED');
  assert.throws(() => requestAcceptance(db, 'run-k1203', 'insan:test'), /tum node DONE/);
  assert.notEqual((db.prepare("SELECT state FROM runs WHERE id='run-k1203'").get() as any).state, 'ACCEPTED');
});

test('K12-04 (P0): yasak dosya/symlink/shell bypass → engellenir + audit oluşur', async () => {
  // (1) SİMLİNK sunuç: hedefin içeriği beklentiyi TUTSA BİLE sembolik bağ kırmızı (M26
  // deseninin değerlendirici ucu — ajan sunuğu symlink ile başka dosyaya kaçamaz).
  // Windows dosya-symlink'i ayrıcalık ister (EPERM) → junction varyantı: lstat junction'u
  // DA symlink rapor eder (ölçüldü), guard aynı kod yolundan tetiklenir; içerik okunamaz
  // (EISDIR) → zincir ADAY aşamasında RED (fail-closed — deftere sahte kanıt düşmez).
  const db = openStore();
  const { attemptId } = kapsulAkisi(db, 'run-k1204a');
  const dir = mkdtempSync(join(tmpdir(), 'k12-04-'));
  const gercek = join(dir, 'gercek.txt');
  writeFileSync(gercek, 'hedef icerik — kacinma denemesi');
  let link = join(dir, 'ajan-sunugu.link');
  let dosyaSymlink = true;
  try {
    symlinkSync(gercek, link); // içerik OKUYABİLEN tam bacak (ayrıcalıklı ortam)
  } catch (e: any) {
    if (e.code !== 'EPERM') throw e;
    dosyaSymlink = false;
    link = join(dir, 'ajan-sunugu-junc');
    symlinkSync(dir, link, 'junction'); // admin GEREKTIRMEZ (F1-G deseni)
  }
  if (dosyaSymlink) {
    const r = evaluateArtifact(db, { attemptId, artifactPath: link, expect: 'hedef icerik', actorId: 'insan:test', artifactsDir: join(dir, 'art') });
    assert.equal(r.verdict, 'FAIL', 'içerik doğru olsa da symlink sunuç RED');
    const semb = r.checks.find((c) => c.ad === 'sembolik-bag-yasak');
    assert.ok(semb && semb.gecti === false, 'sembolik-bağ kontrolü kayıtta');
    assert.equal((db.prepare("SELECT verdict FROM evidence WHERE attempt_id=? ORDER BY rowid DESC LIMIT 1").get(attemptId) as any).verdict, 'FAIL', 'audit: FAIL kanıtı defterde');
  } else {
    // junction sunuğu: guard tetiklenir + okuma EISDIR → aday YOK → değerlendirme RED
    assert.throws(
      () => evaluateArtifact(db, { attemptId, artifactPath: link, expect: 'hedef icerik', actorId: 'insan:test', artifactsDir: join(dir, 'art') }),
      /artifact okunamad/,
    );
    assert.equal((db.prepare('SELECT COUNT(*) c FROM evidence WHERE attempt_id=?').get(attemptId) as any).c, 0, 'deftere kanıt DÜŞMEZ — kabul zincirine girmez');
    assert.equal((db.prepare('SELECT state FROM attempts WHERE id=?').get(attemptId) as any).state, 'RUNNING', 'kabul/karar doğmaz');
  }

  // (2) SHELL bypass: dispatch anahtarındaki kabuk üst-karakterleri TEK argv öğesi olarak
  // taşınır (P0-4 arg-array sözleşmesi — yorumlanma YOK; sahte adapter birebir kaydeder)
  const db2 = openStore();
  const saldiri = 'dk-x; rm -rf / & whoami';
  kapsulAkisi(db2, 'run-k1204b', { dispatchKey: saldiri });
  const a = new FakeAdapter();
  await processOutbox(db2, a);
  assert.equal(a.spawnCalls.length, 1);
  assert.equal(a.spawnCalls[0].dispatchKey, saldiri, 'metakarakterler YORUMLANMAZ — tek argüman birebir');

  // (3) YASAK DOSYA: probe-receipt symlink/junction + worktree kaçışı M26/M31 canlı
  // negatif turlarında zaten PASS (kabul.csv F1-G-CANLI; test/f1-fault + git-worktree) —
  // composite senaryonun bu bacağı birebir kanıtlı, burada yeniden üretilmez.
});

test('K12-05 (P0): aynı task iki kez claim → yetkisiz ikinci sahip ÇALIŞAMAZ', () => {
  const db = openStore();
  const { attemptId, startCommandId } = kapsulAkisi(db, 'run-k1205');
  // node RUNNING: ikinci dispatch denemesi açık RED
  assert.throws(
    () => dispatchNode(db, 'run-k1205', 'n1', { tokens: 1000, startCommandId, dispatchKey: 'dk2-run-k1205', handoff: sampleHandoff('run-k1205') }),
    /node dispatch-edilebilir degil: RUNNING/,
  );
  // dolaysız ikinci rezervasyon (aynı attempt'e ikinci sahip): kapı RED (UNIQUE ve/veya
  // kapasite — maxWorkers dolu; ikisi de "ikinci sahip çalışamaz")
  assert.throws(
    () => reserveDispatch(db, { attemptId, tokens: 10, commandId: startCommandId, dispatchKey: 'dk-saldirgan' }),
    /dispatch kap[ıi]s[ıi] RED/,
  );
  // defterde tek sahip: tek PENDING outbox + tek ACTIVE rezervasyon
  assert.equal((db.prepare("SELECT COUNT(*) c FROM outbox WHERE status='PENDING'").get() as any).c, 1);
  assert.equal((db.prepare("SELECT COUNT(*) c FROM reservations WHERE attempt_id=? AND state='ACTIVE'").get(attemptId) as any).c, 1);
  // YETKİLİ tek yol: devir (takeLease fence bump) — sahiplik çitini yalnız o yükseltir
  const fence = takeLease(db, attemptId, 'yedek-worker', '2099-01-01T00:00:00Z');
  assert.equal(fence, 2, 'devir fence 1→2 (sahiplik çiti)');
});

test('K12-06 (P0): aynı kimlik + FARKLI payload → AÇIK RED (command_id_conflict)', () => {
  const db = openStore();
  kapsulAkisi(db, 'run-k1206'); // run satırı kurulu (FK: commands.run_id → runs)
  const pay = (planHash: string) => ({ runId: 'run-k1206', planHash, idempotencyKey: 'kimlik-1' });
  const r1 = recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-k1206', idempotencyKey: 'kimlik-1', payload: pay(H64('a')) });
  assert.equal(r1.status, 'ACCEPTED');
  // birebir aynı payload → idempotent DUPLICATE (sessiz, tek mantıksal koşu — A05)
  const r2 = recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-k1206', idempotencyKey: 'kimlik-1', payload: pay(H64('a')) });
  assert.equal(r2.status, 'DUPLICATE');
  // aynı kimlik + farklı payload → tahrifat: AÇIK RED (P0-6 — sessiz örtme YOK)
  assert.throws(
    () => recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-k1206', idempotencyKey: 'kimlik-1', payload: pay(H64('b')) }),
    /command_id_conflict/,
  );
  // defter tek satır (ikinci koşu doğmadı)
  assert.equal((db.prepare("SELECT COUNT(*) c FROM commands WHERE idempotency_key='kimlik-1'").get() as any).c, 1);
});

test('K12-07 (P1): API kopması + model değişimi → kör çift iş YOK; handoff doğrulanır', async () => {
  const db = openStore();
  const a = new FakeAdapter([]); // spawn exception = API koptu (belirsizlik)
  const { attemptId } = kapsulAkisi(db, 'run-k1207');
  const r1 = await processOutbox(db, a);
  assert.equal(r1.result, 'unknown', 'kopma → UNKNOWN (kör karar yok)');
  const calls = a.spawnCalls.length;
  await processOutbox(db, a);
  assert.equal(a.spawnCalls.length, calls, 'A08: UNKNOWN satır spawn yoluna DÖNMEZ — çift iş yok');
  void attemptId;

  // vekil FALLBACK_MODEL: kapsam içi model ONAY (deftere grant kararı düşer)
  const { grantId } = createGrant(db, {
    runId: 'run-k1207', actions: ['FALLBACK_MODEL'], fallbackModels: ['codex/glm-5.3'],
    expiresAt: '2099-01-01T00:00:00Z', tokenBudget: 100,
  }, 'insan:test');
  const { requestGrantApproval: rg, decideApproval: da } = await import('../src/supervisor.ts');
  const { approvalId } = rg(db, { runId: 'run-k1207', grantId, action: 'FALLBACK_MODEL', payload: { model: 'codex/glm-5.3' } });
  const dec = da(db, approvalId, 'APPROVED', vekilActorOf(grantId), 1, { model: 'codex/glm-5.3' });
  assert.equal(dec.status, 'APPROVED', 'grant İÇİ model değişimi uygulanır');
  assert.throws(
    () => rg(db, { runId: 'run-k1207', grantId, action: 'FALLBACK_MODEL', payload: { model: 'codex/gpt-5.4' } }),
    /R3 RED/, 'grant DIŞI model talep anında açık red',
  );

  // handoff doğrulanır: DTO'suz dispatch RED; model değişikliği yeni ajan (glm-5.3)
  // spawn anında nodes satırından ÇÖZÜLÜR (resolveProviderModel)
  assert.throws(() => dispatchNode(db, 'run-k1207', 'n1', { tokens: 1, startCommandId: 'c', dispatchKey: 'dk2', handoff: {} }), /handoff/);
  kapsulAkisi(db, 'run-k1207b', { model: 'glm-5.3' });
  const a2 = new FakeAdapter([{ outcome: 'OK', externalSessionId: 'ses-k1207b' }]);
  const r2 = await processOutbox(db, a2);
  assert.equal(r2.result, 'bound');
  assert.equal(a2.spawnCalls[0].model, 'glm-5.3', 'yeni model ajanına çözüldü');
  assert.equal(a2.spawnCalls[0].provider, 'codex');
});

test('K12-08 (P0): eski ajan geç sonuc/yazma → stale + yetkisiz yazma ENGELLENİR', () => {
  const db = openStore();
  const { attemptId } = kapsulAkisi(db, 'run-k1208');
  const yeniFence = takeLease(db, attemptId, 'yedek-worker', '2099-01-01T00:00:00Z');
  // geç sonuc: eski fence (1) ile candidate → A36 RED (karmalar sha: 64-hex şartı)
  assert.throws(() => commitCandidate(db, attemptId, 1, sha('gec-sonuc'), 'eski-ajan'), /stale\/uygunsuz commit reddi/);
  // yeni sahip (yeni fence) yazar — kural kimliği değil ÇİTİ sınar
  commitCandidate(db, attemptId, yeniFence, sha('yeni-sonuc'), 'yedek-worker');
  // kanıt da fence'e bağlı: eski sunulan fence ile evidence → RED (A36 kanıt bacağı)
  assert.throws(
    () => recordEvidence(db, {
      attemptId, presentedFence: 1, artifactHash: sha('a'), storageRef: 's', bytes: 1,
      environmentHash: sha('v'), evaluatorHash: sha('h'), exitCode: 0, verdict: 'PASS', testCount: 1, actorId: 'eski-ajan',
    }),
    /stale fence/,
  );
});

test('K12-09 (P0): restart + kalıcı STOP → STOP UNUTULMAZ; yeni dispatch BAŞLAMAZ', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'k12-09-'));
  const dbPath = join(dir, 'ordu.sqlite');
  let db = openStore(dbPath);
  kapsulAkisi(db, 'run-k1209');           // outbox'ta PENDING iş var
  setGlobalStop(db, true, 'insan:test', 'acil durdur');
  db.close();                              // SÜREÇ ÖLÜR
  db = openStore(dbPath);                  // YENİ AÇILIŞ (restart) — latch hatırlanır
  const a = new FakeAdapter();
  const r = await processOutbox(db, a);
  assert.equal(r.blocked, 'global_stop', 'restart sonrası STOP unutulmadı');
  assert.equal(a.spawnCalls.length, 0, 'yeni dispatch BAŞLAMAZ');
  // mandal tek kapıdan açılır (B01 onay zinciri CLI katmanında ayrıca kanıtlı);
  // defter tarafı açılınca bekleyen iş tek geçişte koşar
  setGlobalStop(db, false, 'insan:test', 'test-resume', sha('k12-resume'));
  const r2 = await processOutbox(db, a);
  assert.equal(r2.result, 'bound', 'mandal açılınca yol açılır');
});

test('K12-10 (P1): vekil grant İÇİ karar uygulanır; DIŞI reddedilir', () => {
  const db = openStore();
  kapsulAkisi(db, 'run-k1210a');
  kapsulAkisi(db, 'run-k1210b');
  const { grantId: grantA } = createGrant(db, {
    runId: 'run-k1210a', actions: ['EXTRA_RETRY'], extraRetryBudget: 2,
    expiresAt: '2099-01-01T00:00:00Z', tokenBudget: 100,
  }, 'insan:test');
  const { grantId: grantB } = createGrant(db, {
    runId: 'run-k1210b', actions: ['EXTRA_RETRY'], extraRetryBudget: 2,
    expiresAt: '2099-01-01T00:00:00Z', tokenBudget: 100,
  }, 'insan:test');

  // İÇİ: vekil kararı deftere düşer (approvals satırı grant bağlı + karar kayıtlı)
  const { approvalId: apA } = requestGrantApproval(db, { runId: 'run-k1210a', grantId: grantA, action: 'EXTRA_RETRY' });
  const dec = decideApproval(db, apA, 'APPROVED', vekilActorOf(grantA), 1);
  assert.equal(dec.status, 'APPROVED');
  const row = db.prepare('SELECT decision,grant_id FROM approvals WHERE id=?').get(apA) as any;
  assert.equal(row.decision, 'APPROVED');
  assert.equal(row.grant_id, grantA, 'defterde grant bağı');

  // DIŞI-1 (run kapsamı): grantA ile başka run'ın onayı İSTENEMEZ
  assert.throws(() => requestGrantApproval(db, { runId: 'run-k1210b', grantId: grantA, action: 'EXTRA_RETRY' }), /R3 RED/);
  // DIŞI-2 (grant kılığı): meşru onayı UYDURMA grant'lı vekil bağlayamaz
  const { approvalId: apB } = requestGrantApproval(db, { runId: 'run-k1210b', grantId: grantB, action: 'EXTRA_RETRY' });
  assert.throws(() => decideApproval(db, apB, 'APPROVED', vekilActorOf('grant-uydurma'), 1), /grant yok|R3 RED/);
  // DIŞI-3 (başka grant): grantB'li vekil grantA'nın TAZE onayını bağlayamaz
  const { approvalId: apA2 } = requestGrantApproval(db, { runId: 'run-k1210a', grantId: grantA, action: 'EXTRA_RETRY' });
  assert.throws(() => decideApproval(db, apA2, 'APPROVED', vekilActorOf(grantB), 1), /baska grant|R3 RED|grant baska run/);
});

test('K12-13 (P1): iki task eşzamanlı — oturum/bütçe/izin/çıktı KARIŞMAZ', async () => {
  const db = openStore();
  const sa = kapsulAkisi(db, 'run-k1213a');
  const sb = kapsulAkisi(db, 'run-k1213b');
  void sa;
  const a = new FakeAdapter([
    { outcome: 'OK', externalSessionId: 'ses-A' },
    { outcome: 'OK', externalSessionId: 'ses-B' },
  ]);
  await processOutbox(db, a); // run-A (rowid sırası)
  await processOutbox(db, a); // run-B
  // OTURUM ayrımı: harici oturum kimlikleri ayrı, dispatch anahtarları ayrı, run'lar ayrı
  const atts = db.prepare("SELECT a.id,a.run_id,a.external_session_id,o.dispatch_key FROM attempts a JOIN outbox o ON o.attempt_id=a.id ORDER BY a.rowid").all() as any[];
  assert.equal(atts.length, 2);
  assert.notEqual(atts[0].external_session_id, atts[1].external_session_id, 'oturumlar karışmaz');
  assert.notEqual(atts[0].dispatch_key, atts[1].dispatch_key, 'dispatch anahtarları karışmaz');
  assert.notEqual(atts[0].run_id, atts[1].run_id, 'run kimlikleri karışmaz');
  // BÜTÇE ayrımı: settle kendi run'una yazar (BUDGET_SETTLED → runs.spent_tokens)
  for (const t of atts) {
    commitCandidate(db, t.id, 1, sha('aday-' + t.run_id), 'insan:test');
    settleReservation(db, t.id, 'SETTLED', 10);
  }
  const spent = db.prepare("SELECT id,spent_tokens FROM runs WHERE id IN ('run-k1213a','run-k1213b') ORDER BY id").all() as any[];
  assert.equal(spent[0].spent_tokens, 10, 'run-A kendi harcaması');
  assert.equal(spent[1].spent_tokens, 10, 'run-B kendi harcaması');
  // İZİN ayrımı: run-A bazlı pause (runs.dispatch_paused + reservation_admit TETİĞİ)
  // run-B'nin yeni claim'ini etkilemez (n2 bacakları kurulumYok — kapsül zaten kurulu)
  db.prepare("UPDATE runs SET dispatch_paused=1 WHERE id='run-k1213a'").run();
  kapsulAkisi(db, 'run-k1213b', { nodeId: 'n2', dispatchKey: 'dk-k1213b-n2', kurulumYok: true, startCommandId: sb.startCommandId }); // run-B serbest
  assert.throws(
    () => kapsulAkisi(db, 'run-k1213a', { nodeId: 'n2', dispatchKey: 'dk-k1213a-n2', kurulumYok: true, startCommandId: sa.startCommandId }),
    /run_paused|dispatch kap[ıi]s[ıi] RED/, 'run-A yeni claim RED (izin karışmaz)',
  );
  // ÇIKTI ayrımı: adaylar deneme kimliğine (planHash|node|no — A04) bağlı, hash'ler tekil
  const hashes = db.prepare('SELECT run_id, candidate_hash FROM attempts WHERE candidate_hash IS NOT NULL').all() as any[];
  assert.equal(new Set(hashes.map((h) => h.candidate_hash)).size, hashes.length, 'aday karması yok');
});
