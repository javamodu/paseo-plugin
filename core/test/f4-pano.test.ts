// F4-A/F4-B — pano HTTP kapı kabul testleri (hermetik: Paseo importu/processi YOK, dış API YOK).
// Sözleşme (ana ajan src/pano-server.ts'i buna AYNEN uydurur):
//   createPanoServer({ dbPath, port: 0, authToken }) -> { server, port }  (yalnız 127.0.0.1)
//   GET /            -> 200 text/html (tokensiz); gövdede 'ACIL DURDUR' + 'Kapsul'
//   GET /healthz     -> 200 (tokensiz)
//   GET /api/status  -> token kapılı (x-pano-token); JSON: globalStop, runs, pendingDecisions,
//                       unknownCount, metrics{verifiedDeliveries,humanInterventions,criticalViolations}, lastEvents
//   POST /api/stop   -> {confirm:'DURDUR'} => 200 {stopped:true}; yanlış confirm => 400
//   POST /api/resume -> {confirm:'I understand the risk'} => 200; yanlış metin => 400
// Kanıtlanan kapılar:
//  F4-A: Paseo kapalıyken (hiç Paseo yok) pano read yolu 200 ve globalStop alanı defterle uyumlu.
//  F4-B: STOP sonrası 0 spawn — latch dosya defterinde kalıcı (restart simülasyonu dahil),
//        dispatcher processOutbox fake adapter'a 0 çağrı yapar; resume kapısı latch'i açar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, recordCommand, setGlobalStop, reserveDispatch } from '../src/store.ts';
import { processOutbox, type WorkerAdapter, type SpawnResult } from '../src/dispatcher.ts';
import { createPanoServer } from '../src/pano-server.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);
const TOKEN = 't123';
const RESUME_TEXT = 'I understand the risk';

class FakeAdapter implements WorkerAdapter {
  spawnCalls: string[] = [];
  async spawn(o: { dispatchKey: string; attemptId: string }) {
    this.spawnCalls.push(o.dispatchKey);
    return { outcome: 'OK', externalSessionId: 'ses-1' } as SpawnResult;
  }
  async lookup() {
    return 'UNKNOWN' as const;
  }
}

const tempDbPath = (prefix: string) => join(mkdtempSync(join(tmpdir(), prefix)), 'ordu.sqlite');

// dispatcher F1 tohumu: PENDING outbox + ACTIVE rezervasyon üretir (spawn yolu hazır olur).
function rigged(path: string) {
  const db = openStore(path);
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'h', 'r', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)')
    .run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), '{}');
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-1','plan-1',1,'READY','ph',0,1,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1','n-1','coder','[]','READY')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`).run();
  setGlobalStop(db, false, 'test', 'kurulum');
  const cmd = recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-1', idempotencyKey: 'k-1', payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: 'k-1' } });
  reserveDispatch(db, { attemptId: 'att-1', tokens: 50, commandId: cmd.commandId, dispatchKey: 'dk-1' });
  return db;
}

async function startPano(dbPath: string) {
  const { server, port } = await createPanoServer({ dbPath, port: 0, authToken: TOKEN });
  return {
    server,
    port,
    base: `http://127.0.0.1:${port}`,
    close: () => new Promise((r) => server.close(r)),
  };
}

const paused = (db: any) => (db.prepare('SELECT dispatch_paused FROM settings WHERE id=1').get() as any).dispatch_paused;

// ---- F4-A: Paseo'dan bağımsız read yüzeyi ----

test('F4-A pozitif: Paseo kapalıyken pano read 200 — GET / ve /api/status, globalStop defterle uyumlu', async () => {
  const dbPath = tempDbPath('ordu-f4a-');
  const db = openStore(dbPath); // DOSYA defteri: gerçek kayıt store fonksiyonlarıyla
  setGlobalStop(db, false, 'test', 'kurulum');
  db.close();

  const p = await startPano(dbPath); // Paseo'ya HİÇ dokunulmadı (import/process yok)
  try {
    assert.equal((p.server.address() as any).address, '127.0.0.1', 'pano yalnız loopback dinler');
    assert.equal((p.server.address() as any).port, p.port, 'dönen port gerçek dinleme portu');

    const home = await fetch(p.base + '/'); // tokensiz
    assert.equal(home.status, 200);
    assert.match(home.headers.get('content-type') ?? '', /text\/html/);
    const html = await home.text();
    assert.ok(/ACİL DURDUR|ACIL DURDUR/i.test(html), 'acil durdur kontrolü yüzeyde görünür');
    assert.ok(/Kapsül|Kapsul/i.test(html), 'kapsül yüzeyi görünür');

    const hz = await fetch(p.base + '/healthz'); // tokensiz
    assert.equal(hz.status, 200);

    const st = await fetch(p.base + '/api/status', { headers: { 'x-pano-token': TOKEN } });
    assert.equal(st.status, 200);
    const j = (await st.json()) as Record<string, any>; // tip-borcu v9-06: fetch json() unknown — pano yanıtı gevşek kayda çözülür, alan iddiaları aynen
    assert.equal(j.globalStop, false, 'latch açık defterde 0 — pano da 0 okumalı');
    assert.ok(Array.isArray(j.runs), 'runs alanı');
    assert.ok('pendingDecisions' in j, 'pendingDecisions alanı');
    assert.ok('unknownCount' in j, 'unknownCount alanı');
    assert.ok('verifiedDeliveries' in j.metrics, 'metrics.verifiedDeliveries');
    assert.ok('humanInterventions' in j.metrics, 'metrics.humanInterventions');
    assert.ok('criticalViolations' in j.metrics, 'metrics.criticalViolations');
    assert.ok(Array.isArray(j.lastEvents), 'lastEvents alanı');
  } finally {
    await p.close();
  }
});

test('F4-A negatif: token kapısı + bilinmeyen yol — tokensiz/yanlış token 403, bilinmeyen yol 404', async () => {
  const dbPath = tempDbPath('ordu-f4a-neg-');
  const db = openStore(dbPath);
  setGlobalStop(db, false, 'test', 'kurulum');
  db.close();

  const p = await startPano(dbPath);
  try {
    const noTok = await fetch(p.base + '/api/status');
    assert.equal(noTok.status, 403, 'tokensiz /api/status reddedilir');
    const badTok = await fetch(p.base + '/api/status', { headers: { 'x-pano-token': 'yanlis' } });
    assert.equal(badTok.status, 403, 'yanlış token reddedilir');

    const badConfirm = await fetch(p.base + '/api/stop', {
      method: 'POST',
      headers: { 'x-pano-token': TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: 'durur belki' }),
    });
    assert.equal(badConfirm.status, 400, 'yanlış stop onayı 400');

    const badResume = await fetch(p.base + '/api/resume', {
      method: 'POST',
      headers: { 'x-pano-token': TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: 'devam et' }),
    });
    assert.equal(badResume.status, 400, 'yanlış resume metni 400');

    const notFound = await fetch(p.base + '/api/bilinmeyen', { headers: { 'x-pano-token': TOKEN } });
    assert.equal(notFound.status, 404, 'bilinmeyen yol 404');
  } finally {
    await p.close();
  }
});

// ---- F4-B: STOP sonrası 0 spawn + restart kalıcılığı ----

test('F4-B pozitif: POST /api/stop -> latch kalıcı, restart sonrası bile processOutbox 0 spawn', async () => {
  const dbPath = tempDbPath('ordu-f4b-');
  const db = rigged(dbPath); // PENDING outbox + ACTIVE rezervasyon: latch olmasa spawn akardı
  assert.equal(paused(db), 0);
  db.close();

  const p = await startPano(dbPath);
  try {
    const stop = await fetch(p.base + '/api/stop', {
      method: 'POST',
      headers: { 'x-pano-token': TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: 'DURDUR' }),
    });
    assert.equal(stop.status, 200);
    assert.deepEqual(await stop.json(), { stopped: true });

    // latch defterde kalıcı: settings.dispatch_paused = 1
    const db2 = openStore(dbPath);
    assert.equal(paused(db2), 1, 'stop latch dosya defterine yazılmadı — A16 ihlali!');
    const a1 = new FakeAdapter();
    const r1 = await processOutbox(db2, a1);
    assert.deepEqual(r1, { blocked: 'global_stop', processed: 0 });
    assert.equal(a1.spawnCalls.length, 0, 'STOP sonrası dış etki kaçtı — A16 ihlali!');
    db2.close();

    // restart simülasyonu: defter kapat/aç, latch hâlâ 1, yine 0 spawn
    const db3 = openStore(dbPath);
    assert.equal(paused(db3), 1, 'restart latchi unuttu — A16 ihlali!');
    const a2 = new FakeAdapter();
    const r2 = await processOutbox(db3, a2);
    assert.deepEqual(r2, { blocked: 'global_stop', processed: 0 });
    assert.equal(a2.spawnCalls.length, 0, 'restart sonrası STOP unutulduysa dış etki kaçardı!');
    db3.close();

    // resume kapısı: doğru onay metni latch'i açar
    const resume = await fetch(p.base + '/api/resume', {
      method: 'POST',
      headers: { 'x-pano-token': TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: RESUME_TEXT }),
    });
    assert.equal(resume.status, 200);
    const db4 = openStore(dbPath);
    assert.equal(paused(db4), 0, 'resume latchi açmadı');
    db4.close();
  } finally {
    await p.close();
  }
});