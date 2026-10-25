// P0-7: reconcile sirasinda sentetik 'recovered:' session id URETILMEZ.
// Canli transport lookup'i (makeSafePaseoTransport) ciktida dispatchKey'in gercek
// kaydini goremiyorsa ALIVE iddia EDEMEZ â†’ UNKNOWN doner; reconcile satiri
// UNKNOWN olarak birakir, attempts.external_session_id NULL kalir.
// 0.11.2: korelasyon name alaninda dispatchKey (`paseo ls --json` label alani TASIMAZ).
// Binary cozumleme: enjekte exec'li testler ORDU_PASEO_RESOURCES ile sahte kurulum
// kullanir (tasinabilirlik: Paseo kurulu olmayan makinede de deterministik).
import { test } from 'node:test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { makeSafePaseoTransport } from '../src/paseo-transport.ts';
import { PaseoWorkerAdapter } from '../src/paseo-adapter.ts';
import { openStore, recordCommand, setGlobalStop, reserveDispatch } from '../src/store.ts';
import { processOutbox, reconcileUnknown, type WorkerAdapter } from '../src/dispatcher.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

function fakePaseoInstall(): () => void {
  const base = mkdtempSync(join(tmpdir(), 'ordu-paseo-bin-'));
  const resources = join(base, 'resources');
  mkdirSync(join(resources, 'app.asar.unpacked', 'dist', 'daemon'), { recursive: true });
  writeFileSync(join(base, 'Paseo.exe'), 'fake');
  writeFileSync(join(resources, 'app.asar.unpacked', 'dist', 'daemon', 'node-entrypoint-runner.js'), '// fake');
  const prev = process.env.ORDU_PASEO_RESOURCES;
  process.env.ORDU_PASEO_RESOURCES = resources;
  return () => { if (prev === undefined) delete process.env.ORDU_PASEO_RESOURCES; else process.env.ORDU_PASEO_RESOURCES = prev; };
}

test('P0-7 NEGATIF: dispatchKey kaydi ciktida YOK â†’ ALIVE reddedilir, UNKNOWN doner', async () => {
  const restore = fakePaseoInstall();
  try {
    // baska bir agent'in canli kaydi bu dispatchKey'in kaniti DEGIL
    const t = makeSafePaseoTransport(() => '[{"id":"agent-9","name":"ordu:baskasi","status":"running"}]');
    assert.equal(await t.lookup('dk-1'), 'UNKNOWN');
    // bos liste / alakasiz gurultu de kayit kaniti degil
    const empty = makeSafePaseoTransport(() => '[]');
    assert.equal(await empty.lookup('dk-1'), 'UNKNOWN');
    // name alani olmayan kayit (eski workspace kalibi) da kanit degil
    const noName = makeSafePaseoTransport(() => '[{"id":"dk-1","status":"running"}]');
    assert.equal(await noName.lookup('dk-1'), 'UNKNOWN', 'id eslesmesi name korelasyonu DEGILDIR');
  } finally {
    restore();
  }
});

test('P0-7: gercek kayit korelasyonu + canli durum â†’ ALIVE; korelasyon + olu durum â†’ DEAD', async () => {
  const restore = fakePaseoInstall();
  try {
    const alive = makeSafePaseoTransport(() => '[{"name":"ordu:dk-1","status":"running"}]');
    assert.equal(await alive.lookup('dk-1'), 'ALIVE');
    const dead = makeSafePaseoTransport(() => '[{"name":"ordu:dk-1","status":"closed"}]');
    assert.equal(await dead.lookup('dk-1'), 'DEAD');
  } finally {
    restore();
  }
});

test('P0-7 NEGATIF uctan uca: reconcile gercek kaydi bulamazsa sentetik kimlik URETMEZ, UNKNOWN birakir', async () => {
  const restore = fakePaseoInstall();
  try {
    const db = openStore();
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

    // spawn yaniti kayip â†’ UNKNOWN (gercek belirsizlik senaryosu)
    const spawnLost: WorkerAdapter = {
      async spawn() { return { outcome: 'UNKNOWN' }; },
      async lookup() { return 'UNKNOWN'; },
    };
    const r = await processOutbox(db, spawnLost);
    assert.equal(r.result, 'unknown');

    // reconcile: lookup ciktisinda dk-1 kaydi YOK (baska agent canli) â†’ sentetik id YASAK
    const adapter = new PaseoWorkerAdapter({} as any, makeSafePaseoTransport(() => '[{"id":"agent-9","name":"ordu:baskasi","status":"running"}]'));
    const rec = await reconcileUnknown(db, adapter);
    assert.deepEqual(rec.outcomes, ['still-unknown']);
    assert.equal((db.prepare("SELECT status FROM outbox WHERE dispatch_key='dk-1'").get() as any).status, 'UNKNOWN');
    const sid = (db.prepare("SELECT external_session_id FROM attempts WHERE id='att-1'").get() as any).external_session_id;
    assert.equal(sid, null, "sentetik 'recovered:' kimligi URETILDI â€” P0-7 ihlali!");
    assert.ok(!(db.prepare('SELECT payload_json FROM events').all() as any[]).some((e: any) => String(e.payload_json).includes('recovered:')));
  } finally {
    restore();
  }
});

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// P0-4/6c kaynak taramasi: legacy shell-string yolu paseo-adapter.ts'den TAMAMEN kalkmali.
test('P0-4/6c NEGATIF kaynak taramasi: paseo-adapter.ts shell-string kalibini icermez', () => {
  const src = readFileSync(join(root, 'src', 'paseo-adapter.ts'), 'utf8');
  assert.ok(!src.includes('exec' + 'Sync('), 'execSync kalibi kalmis');
  assert.ok(!src.includes('make' + 'PaseoTransport'), 'legacy shell-string transport kalmis');
  assert.ok(!src.includes('node:child_process'), 'child_process importu kalmis');
});

// Davranissal: shell metakarakterli prompt adapter uzerinden execFile arg-array ile TEK token gecer.
test('P0-4/6c davranissal: metakarakterli prompt tek argv tokeni olarak ulasir (JSON session-id)', async () => {
  const restore = fakePaseoInstall();
  try {
    const seen: { file: string; args: string[] }[] = [];
    const t = makeSafePaseoTransport((file, args) => { seen.push({ file, args }); return '{"id":"sess-7"}'; });
    const adapter = new PaseoWorkerAdapter({ blocked: [] } as any, t, { ORDU_LIVE: '1' });
    const payload = 'x & calc & echo %PATH% | dir > PWN.txt && "tirnak" `backtick` $(sub)';
    const r = await adapter.spawn({ dispatchKey: 'dk-m', attemptId: 'a-m', prompt: payload });
    assert.equal(r.outcome, 'OK');
    assert.equal((r as any).externalSessionId, 'sess-7');
    assert.equal(seen.length, 1);
    assert.ok(seen[0].file.endsWith('Paseo.exe'), 'exec hedefi cozumlenmis .exe, shim degil');
    assert.equal(seen[0].args[seen[0].args.length - 1], payload, 'prompt degismeden tek token');
    const runIdx = seen[0].args.indexOf('run');
    assert.deepEqual(seen[0].args.slice(runIdx, runIdx + 2), ['run', '--provider'], '0.11.2 vektoru onek sonrasi');
  } finally {
    restore();
  }
});

// 0.11.2 NEGATIF: --json ciktisi parse edilemezse adapter UNKNOWN doner (FATAL degil â€”
// yanit alinamadi sinifi; bozuk cikti "net hayir" degildir).
test('0.11.2 NEGATIF: bozuk --json ciktisi adapter seviyesinde UNKNOWN', async () => {
  const restore = fakePaseoInstall();
  try {
    const t = makeSafePaseoTransport(() => 'tamamen bozuk cikti <<<');
    const adapter = new PaseoWorkerAdapter({ blocked: [] } as any, t, { ORDU_LIVE: '1' });
    const r = await adapter.spawn({ dispatchKey: 'dk-b', attemptId: 'a-b', prompt: 'p' });
    assert.equal(r.outcome, 'UNKNOWN', 'parse edilemeyen spawn yaniti belirsizliktir, FATAL degil');
  } finally {
    restore();
  }
});

// Binary cozumleme NEGATIF: kurulum yoksa spawn UNKNOWN (ENOENT ile ayni fail-closed sinif).
test('NEGATIF: paseo binary cozulemezse spawn UNKNOWN, sessiz dusme yok', async () => {
  const prev = process.env.ORDU_PASEO_RESOURCES;
  process.env.ORDU_PASEO_RESOURCES = mkdtempSync(join(tmpdir(), 'ordu-paseo-yok-'));
  try {
    const t = makeSafePaseoTransport(() => { throw new Error('buraya gelinmemeli'); });
    const adapter = new PaseoWorkerAdapter({ blocked: [] } as any, t, { ORDU_LIVE: '1' });
    const r = await adapter.spawn({ dispatchKey: 'dk-n', attemptId: 'a-n', prompt: 'p' });
    assert.equal(r.outcome, 'UNKNOWN', 'binary yoklugu belirsizliktir; exec cagrilmadi');
  } finally {
    if (prev === undefined) delete process.env.ORDU_PASEO_RESOURCES; else process.env.ORDU_PASEO_RESOURCES = prev;
  }
});