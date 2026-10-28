// spawn-olcum.test.ts — v9 V9-03'ün kendi testi (kayıt formatı + dispatcher entegrasyonu).
// Kosum: node --test test/spawn-olcum.test.ts (core/ dizininden).
// Harness: dispatcher.test.ts deseni (openStore + rigged + FakeAdapter) — nodes satırına
// provider/model eklenir ki çözüm zinciri (F6.5) deterministik olsun.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, recordCommand, setGlobalStop, reserveDispatch } from '../src/store.ts';
import { processOutbox, type WorkerAdapter, type SpawnResult } from '../src/dispatcher.ts';
import { spawnOlcumKaydet } from '../src/spawn-olcum.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);
const SABIT_NOW = () => new Date('2026-10-28T21:40:00.000Z');

class FakeAdapter implements WorkerAdapter {
  script: SpawnResult[]; // strip-only mod: parametre özelliği YOK (dispatcher.test.ts deseni)
  constructor(script: SpawnResult[] = [{ outcome: 'OK', externalSessionId: 'ses-1' }]) { this.script = script; }
  async spawn(): Promise<SpawnResult> {
    if (this.script.length === 0) throw new Error('bağlantı koptu'); // belirsizlik → UNKNOWN
    return this.script.shift()!;
  }
  async lookup() { return 'UNKNOWN' as const; }
}

function rigged() {
  const db = openStore();
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'h', 'r', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)')
    .run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), '{}');
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-1','plan-1',1,'READY','ph',0,1,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  // provider/model AÇIK: çözüm zinciri node → env → varsayılan yerine buradan deterministik iner
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state,provider,model) VALUES('run-1','n-1','coder','[]','READY','codex','gpt-5.4')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`).run();
  setGlobalStop(db, false, 'test', 'kurulum');
  const cmd = recordCommand(db, { kind: 'START_RUN', actorId: 'op', runId: 'run-1', idempotencyKey: 'k-1', payload: { runId: 'run-1', planHash: H64('b'), idempotencyKey: 'k-1' } });
  reserveDispatch(db, { attemptId: 'att-1', tokens: 50, commandId: cmd.commandId, dispatchKey: 'dk-1' });
  return db;
}

const oku = (yol: string) => readFileSync(yol, 'utf8').split('\n').filter(Boolean).map((s) => JSON.parse(s));

test('kayit formati: spawnOlcumKaydet fsync-append jsonl yazar — event + tum alanlar', () => {
  const d = mkdtempSync(join(tmpdir(), 'spawn-olcum-'));
  const yol = join(d, 'olcum.jsonl');
  try {
    spawnOlcumKaydet(yol, { at: '2026-10-28T21:40:00.000Z', attemptId: 'att-1', provider: 'codex', model: 'gpt-5.4', outcome: 'OK', sureMs: 123 });
    spawnOlcumKaydet(yol, { at: '2026-10-28T21:41:00.000Z', attemptId: 'att-2', provider: 'paseo', outcome: 'UNKNOWN', sureMs: 45000 });
    const satirlar = oku(yol) as any[];
    assert.equal(satirlar.length, 2);
    assert.equal(satirlar[0].event, 'spawn-olcum');
    assert.equal(satirlar[0].attemptId, 'att-1');
    assert.equal(satirlar[0].provider, 'codex');
    assert.equal(satirlar[0].model, 'gpt-5.4');
    assert.equal(satirlar[0].outcome, 'OK');
    assert.equal(satirlar[0].sureMs, 123);
    assert.equal(satirlar[1].model, undefined); // model opsiyonel — kayıtta alan yok
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('entegrasyon opt-in: adapter.spawn cagrisi olcum defterine duser (provider/model cozumunden)', async () => {
  const db = rigged();
  const d = mkdtempSync(join(tmpdir(), 'spawn-olcum-'));
  const yol = join(d, 'olcum.jsonl');
  try {
    const r = await processOutbox(db, new FakeAdapter(), { now: SABIT_NOW, kanitDefteriYolu: yol });
    assert.equal(r.result, 'bound'); // dispatcher akışı ölçümle DEĞİŞMEDİ
    const kayit = oku(yol)[0] as any;
    assert.equal(kayit.event, 'spawn-olcum');
    assert.equal(kayit.at, '2026-10-28T21:40:00.000Z'); // enjekte edilen now() saati
    assert.equal(kayit.attemptId, 'att-1');
    assert.equal(kayit.provider, 'codex'); // nodes satırından çözülen (F6.5)
    assert.equal(kayit.model, 'gpt-5.4');
    assert.equal(kayit.outcome, 'OK');
    assert.equal(typeof kayit.sureMs, 'number');
    assert.ok(kayit.sureMs >= 0);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('opt-out (A0-3 deseni): kanitDefteriYolu verilmedikce defter DOSYASI DOGMAZ', async () => {
  const db = rigged();
  const d = mkdtempSync(join(tmpdir(), 'spawn-olcum-'));
  const yol = join(d, 'olcum.jsonl');
  try {
    const r = await processOutbox(db, new FakeAdapter(), { now: SABIT_NOW }); // ölçüm YOK
    assert.equal(r.result, 'bound');
    assert.equal(existsSync(yol), false); // mevcut çağıranlar sessiz-siz kalır (fail-closed yön)
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('olcum kaydi boru hattini DUSUREMEZ: defter yolu gecersizse spawn akisi yine baglanir', async () => {
  const db = rigged();
  const d = mkdtempSync(join(tmpdir(), 'spawn-olcum-'));
  try {
    const olmayan = join(d, 'yok-boyle-dizin', 'olcum.jsonl'); // ENOENT — ölçüm best-effort
    const r = await processOutbox(db, new FakeAdapter(), { now: SABIT_NOW, kanitDefteriYolu: olmayan });
    assert.equal(r.result, 'bound'); // gözlem üretimi bozamaz — kayıt hatası stderr'de, sonuçta değil
    assert.equal(existsSync(olmayan), false);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('belirsizlik (exception → UNKNOWN) da kayda girer: veri birikir, yorum sonraya (olc-sonra-karar)', async () => {
  const db = rigged();
  const d = mkdtempSync(join(tmpdir(), 'spawn-olcum-'));
  const yol = join(d, 'olcum.jsonl');
  try {
    const r = await processOutbox(db, new FakeAdapter([]), { now: SABIT_NOW, kanitDefteriYolu: yol }); // script boş → throw
    assert.equal(r.result, 'unknown');
    const kayit = oku(yol)[0] as any;
    assert.equal(kayit.outcome, 'UNKNOWN');
    assert.equal(typeof kayit.sureMs, 'number'); // exception öncesi geçen süre de veridir
  } finally { rmSync(d, { recursive: true, force: true }); }
});
