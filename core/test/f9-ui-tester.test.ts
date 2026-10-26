// F9 UI-TESTER ADAPTORU — hermetik kirilim testleri (PLAN bol.10 F9 satiri).
// Tarayici yuzu = pano BAGIMSIZ web ince-istemcisi: GERCEK pano-server (ayni surecten
// createPanoServer — bildirim-canli deseni) + GERCEK fetch. Kanit kayitlari diske
// dusen senaryo/beklenen/gozlenen uclusudur (F9-A); screenshot verdict'e ETkISIZDIR.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, setGlobalStop } from '../src/store.ts';
import { createRunPlan, approvePlan, ensureStartCommand } from '../src/supervisor.ts';
import { createPanoServer } from '../src/pano-server.ts';
import { acTarayiciProfili, runUiSenaryo, uiKanitlariniOku, type UiSenaryo } from '../src/ui-tester.ts';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

// tohum: bir run + PENDING teslim onayi — pano yuzeyi BOS degil (F7-A tohum deseni)
async function panoKur(dbPath: string): Promise<{ server: any; port: number; token: string; db: any }> {
  const db = openStore(dbPath);
  setGlobalStop(db, false, 'insan:test', 'f9 kurulum');
  const runId = 'run-f9';
  const { planHash } = createRunPlan(db, {
    capsuleId: 'cap-run-f9', goal: 'F9 UI-tester tohum runi', repoId: 'ordu/core',
    sourceCommit: sha('f9'), runId, planId: 'plan-run-f9', profileHash: sha('pf9'),
    nodes: [{ id: 'n1', role: 'coder', deps: [] }], maxWorkers: 1, allowedCommands: ['npm test'],
  });
  const startCommandId = ensureStartCommand(db, runId, planHash, 'insan:test');
  approvePlan(db, runId, planHash, 'insan:test');
  void startCommandId;
  // PENDING teslim onayi dogrudan tohum (F7-A deseni; node DONE olmadan da pano
  // Kararlar bolumu dolu gorunur — UI-tester read-model yuzeyini sinamak yeterli)
  db.prepare(
    "INSERT INTO approvals(id, run_id, plan_hash, candidate_hash, policy_hash, expected_run_version, action, expires_at, decision) VALUES('apv-f9', ?, ?, ?, 'ph-f9', 1, 'ACCEPT_RESULT', '2099-01-01T00:00:00Z', 'PENDING')",
  ).run(runId, planHash, sha('aday-f9'));
  const token = 'f9-token-1';
  const { server, port } = await createPanoServer({ dbPath, port: 0, authToken: token });
  return { server, port, token, db };
}

const senaryoTemel = (): UiSenaryo => ({
  ad: 'f9-temel',
  adimlar: [
    { ad: 'saglik', yol: '/healthz', beklenen: [{ alan: '', kosul: 'icerir', deger: 'ok' }] },
    {
      ad: 'durum', yol: '/api/status',
      beklenen: [
        { alan: 'globalStop', kosul: 'esittir', deger: false },
        { alan: 'runs', kosul: 'icerir', deger: 'run-f9' },
        { alan: 'metrics.verifiedDeliveries', kosul: 'buyuktur', deger: -1 },
        { alan: 'pendingDecisions', kosul: 'icerir', deger: 'ACCEPT_RESULT' },
        { alan: 'alan-yok-boyle', kosul: 'esittir', deger: undefined },
      ],
    },
  ],
});

test('F9 mutlu yol: senaryo/beklenen/gozlenen kanit kayitlari DISKTE + PASS + profil kapama', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'f9-1-'));
  const dbPath = join(dir, 'ordu.sqlite');
  const pano = await panoKur(dbPath);
  t.after(() => { (pano.server as any).closeAllConnections?.(); pano.server.close(); });

  const profil = acTarayiciProfili('http://127.0.0.1:' + pano.port, pano.token);
  const kanitYolu = join(dir, 'ui-kanit.jsonl');
  const sonuc = await runUiSenaryo(profil, senaryoTemel(), { kanitYolu });
  assert.equal(sonuc.verdict, 'PASS', 'butun adimlar gecti: ' + (sonuc.hata ?? ''));
  assert.equal(sonuc.gecenAdim, 2);

  // F9-A: uclu KANIT DISKTE — her adim gozlenenle kayitli + senaryo ozeti
  const kayitlar = uiKanitlariniOku(kanitYolu) as any[];
  assert.equal(kayitlar.length, 3, '2 adim kaydi + 1 senaryo ozeti');
  const saglik = kayitlar[0];
  assert.equal(saglik.tip, 'ui-adim');
  assert.equal(saglik.senaryo, 'f9-temel');
  assert.equal(saglik.adim, 'saglik');
  assert.equal(saglik.sonuc, 'GECTI');
  assert.ok(String(saglik.gozlenen).includes('ok'), 'gozlenen gercek yanit govdesi');
  const durum = kayitlar[1];
  assert.equal(durum.gozlenen.globalStop, false, 'gozlenen tam status govdesi');
  assert.ok(durum.beklenen.length >= 4, 'beklenen listesi kayitta');
  const ozet = kayitlar[2];
  assert.equal(ozet.tip, 'ui-senaryo');
  assert.equal(ozet.verdict, 'PASS');
  assert.equal(ozet.gecenAdim, 2);

  // tek-sahip zinciri: kapanca koşum RED
  profil.kapat();
  await assert.rejects(
    () => runUiSenaryo(profil, senaryoTemel(), { kanitYolu }),
    /profil KAPALI/,
  );
});

test('F9 kirilim: yanlis beklenen → RED + gozlenen degeri KANIT KAYDINDA kalir', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'f9-2-'));
  const dbPath = join(dir, 'ordu.sqlite');
  const pano = await panoKur(dbPath);
  t.after(() => { pano.server.close(); });
  const profil = acTarayiciProfili('http://127.0.0.1:' + pano.port, pano.token);
  const kanitYolu = join(dir, 'ui-kanit.jsonl');

  const yanlis: UiSenaryo = {
    ad: 'f9-yanlis',
    adimlar: [{
      ad: 'durum', yol: '/api/status',
      beklenen: [{ alan: 'globalStop', kosul: 'esittir', deger: true }],
    }],
  };
  const sonuc = await runUiSenaryo(profil, yanlis, { kanitYolu });
  assert.equal(sonuc.verdict, 'RED');
  assert.match(sonuc.hata ?? '', /adim durum alan globalStop/, 'hata adim+alan ADIYLA tasinir');
  const kayitlar = uiKanitlariniOku(kanitYolu) as any[];
  const kalan = kayitlar.find((k) => k.tip === 'ui-adim');
  assert.equal(kalan.sonuc, 'KALDI');
  assert.equal(kalan.gozlenen.globalStop, false, 'GOZLENEN gercek deger kayitta — uclu tamam');
  profil.kapat();
});

test('F9 kirilim: kapali/yol yanlis yuz → baglanti kirmizisi RED (fail-closed gorunurluk)', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'f9-3-'));
  // bilincli olarak HIC pano kurma — yuz yok: fetch reddi adim kirmizisi
  const profil = acTarayiciProfili('http://127.0.0.1:1', 'f9-token-3');
  const kanitYolu = join(dir, 'ui-kanit.jsonl');
  const sonuc = await runUiSenaryo(profil, {
    ad: 'f9-olu', adimlar: [{ ad: 'durum', yol: '/api/status', beklenen: [{ alan: 'globalStop', kosul: 'esittir', deger: false }] }],
  }, { kanitYolu });
  assert.equal(sonuc.verdict, 'RED');
  assert.match(sonuc.hata ?? '', /yuz erisilemedi/, 'baglanti kirmizisi fail-closed — sessiz yesil YOK');
  const kayitlar = uiKanitlariniOku(kanitYolu) as any[];
  assert.equal(kayitlar[0].sonuc, 'KALDI', 'olumlu yuz de KANIT KAYDI dogar');
  profil.kapat();
});

test('F9 kirilim: yanlis token → HTTP 403 adim kirmizisi (token zemin sozlesmesi)', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'f9-4-'));
  const dbPath = join(dir, 'ordu.sqlite');
  const pano = await panoKur(dbPath);
  t.after(() => { pano.server.close(); });
  const profil = acTarayiciProfili('http://127.0.0.1:' + pano.port, 'YANLIS-token');
  const kanitYolu = join(dir, 'ui-kanit.jsonl');
  const sonuc = await runUiSenaryo(profil, {
    ad: 'f9-403', adimlar: [{ ad: 'durum', yol: '/api/status', beklenen: [{ alan: 'globalStop', kosul: 'esittir', deger: false }] }],
  }, { kanitYolu });
  assert.equal(sonuc.verdict, 'RED');
  assert.match(sonuc.hata ?? '', /HTTP 403/, '403 beklenen degil KIRMIZI — yuzey token gostermek zorunda');
  profil.kapat();
});

test('F9 sozlesme: screenshot tek basina PASS DEGIL — verdict hesabina OKUNMAZ', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'f9-5-'));
  const dbPath = join(dir, 'ordu.sqlite');
  const pano = await panoKur(dbPath);
  t.after(() => { pano.server.close(); });
  const profil = acTarayiciProfili('http://127.0.0.1:' + pano.port, pano.token);
  const kanitYolu = join(dir, 'ui-kanit.jsonl');
  // kirmizi senaryo + screenshot referansi → verdict YINE RED; kayitta gorunur
  const sonuc = await runUiSenaryo(profil, {
    ad: 'f9-ekran', adimlar: [{
      ad: 'durum', yol: '/api/status',
      beklenen: [{ alan: 'unknownCount', kosul: 'esittir', deger: 999 }],
    }],
  }, { kanitYolu, screenshot: 'f9-ekran.png' });
  assert.equal(sonuc.verdict, 'RED', 'screenshot verdict degistirMEZ');
  const disk = readFileSync(kanitYolu, 'utf8');
  assert.ok(disk.includes('f9-ekran.png'), 'screenshot yalniz gorunurluk olarak kayitta');
  assert.ok(disk.includes('"verdict":"RED"'));
  profil.kapat();
});

test('F9 sozlesme: tek sahip — acik profil uzerinden ikinci acilis RED; giris kapilari', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'f9-6-'));
  const dbPath = join(dir, 'ordu.sqlite');
  const pano = await panoKur(dbPath);
  t.after(() => { pano.server.close(); });
  const profil = acTarayiciProfili('http://127.0.0.1:' + pano.port, pano.token);
  assert.throws(
    () => acTarayiciProfili('http://127.0.0.1:' + pano.port + '/', pano.token),
    /tek sahip/, 'ayni yuz tek kosucunundur (trailing-slash normalize)',
  );
  profil.kapat();
  const p2 = acTarayiciProfili('http://127.0.0.1:' + pano.port, pano.token); // kapandiktan sonra acilir
  p2.kapat();

  // giris kapilari: boş token / boş senaryo / boş beklenen
  assert.throws(() => acTarayiciProfili('http://127.0.0.1:' + pano.port, ''), /token bos/);
  assert.throws(() => acTarayiciProfili('not-a-url', 'x'), /http\/https/);
  const profil3 = acTarayiciProfili('http://127.0.0.1:' + pano.port, pano.token);
  const kanitYolu = join(dir, 'ui-kanit.jsonl');
  await assert.rejects(() => runUiSenaryo(profil3, { ad: 'bos', adimlar: [] }, { kanitYolu }), /bos senaryo/);
  await assert.rejects(() => runUiSenaryo(profil3, { ad: 'b1', adimlar: [{ ad: 'a', yol: '/healthz', beklenen: [] }] }, { kanitYolu }), /beklenen listesi bos/);
  await assert.rejects(() => runUiSenaryo(profil3, {
    ad: 'b2', adimlar: [{ ad: 'a', yol: '/healthz', beklenen: [{ alan: '', kosul: 'bilinmeyen' as any, deger: 1 }] }],
  }, { kanitYolu }), /bilinmeyen kriter kosulu/);
  profil3.kapat();
});
