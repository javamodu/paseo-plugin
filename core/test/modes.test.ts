// K-0006 iş modları — hermetik kanıt: MOD tavanı KAYDIRIR, kapıyı GEVŞETMEZ.
// Üç kritik iddia: (1) parallelFactor ayarı global_capacity eşiğini büyütür ama
// hardMaxWorkers'ı aşamaz; (2) mod nesnesi güvenlik anahtarı taşısa bile damıtılır;
// (3) STOP latch açıkken hiçbir mod dispatch üretemez (Y6/F3). Canlı koşu NOT_RUN.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStore, recordCommand, setGlobalStop, reserveDispatch } from '../src/store.ts';
import { resolveLimits, applyModeToSettings, loadOrdConfig, UnknownMode, type OrduConfig } from '../src/modes.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

const cfg = (over: Partial<OrduConfig> = {}): OrduConfig => ({
  schemaVersion: 1,
  runtime: 'paseo',
  mod: 'atolye',
  temel: { maxWorkers: 2, maxReservedTokens: 200000 },
  guvenlikTavani: { hardMaxWorkers: 8 },
  modlar: {
    atolye: { parallelFactor: 1, tokenFactor: 1, kademe: 'hizli' },
    firtina: { parallelFactor: 2, tokenFactor: 1, kademe: 'hizli' },
    ekonomi: { parallelFactor: 1, tokenFactor: 0.5, kademe: 'derin' },
  },
  ...over,
});

// --- birim: tavan ölçekleme + hard cap + fail-closed ---
test('resolveLimits: firtina paraleli ×2 yapar, ekonomi tokeni yarılar', () => {
  assert.equal(resolveLimits(cfg({ mod: 'firtina' })).maxWorkers, 4);
  assert.equal(resolveLimits(cfg({ mod: 'atolye' })).maxWorkers, 2);
  assert.equal(resolveLimits(cfg({ mod: 'ekonomi' })).maxReservedTokens, 100000);
  assert.equal(resolveLimits(cfg({ mod: 'ekonomi' })).kademe, 'derin');
});

test('resolveLimits: hardMaxWorkers ASLA aşılamaz (firtina ×2 → tavan 5, taban 5 → 8)', () => {
  const c = cfg({ mod: 'firtina', temel: { maxWorkers: 5, maxReservedTokens: 100 } });
  // 5×2=10 ama güvenlik tavani 8 → 8'e kırpılır (mod eşiği sınırsız yükseltemez)
  assert.equal(resolveLimits(c).maxWorkers, 8);
});

test('resolveLimits: bilinmeyen/geçersiz mod → UnknownMode (fail-closed, dispatch yok)', () => {
  assert.throws(() => resolveLimits(cfg({ mod: 'turbo' })), UnknownMode);
  const c = cfg();
  (c.modlar as any).kotu = { parallelFactor: -1, tokenFactor: 1, kademe: 'hizli' };
  c.mod = 'kotu';
  assert.throws(() => resolveLimits(c), /parallelFactor/);
});

test('resolveLimits: mod nesnesi GÜVENLİK anahtarı taşısa bile damıtılır (sonuca sızmaz)', () => {
  const c = cfg();
  (c.modlar as any).firtina.dispatch_paused = false; // kötücül enjeksiyon denemesi
  (c.modlar as any).firtina.humanApproval = false;
  const eff = resolveLimits(c);
  assert.equal('dispatch_paused' in eff, false);
  assert.equal('humanApproval' in eff, false);
  assert.deepEqual(Object.keys(eff).sort(), ['kademe', 'maxReservedTokens', 'maxWorkers', 'mod']);
});

// --- entegrasyon: ayar tablosu üzerinden GERÇEK global_capacity kapısı ---
function seededRuns(n: number) {
  const db = openStore();
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'hedef', 'repo', H64('a'));
  db.prepare(
    'INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)',
  ).run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), '{}');
  // her run kendi kapasitesinde cömert (max_workers=3), tek attempt; bağlayıcı olan GLOBAL eşik
  for (let i = 1; i <= n; i++) {
    const rid = 'run-' + i;
    db.prepare(
      `INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
       VALUES(?,'plan-1',1,'READY','ph',0,3,3,1000,0,0,'2026-12-31T00:00:00Z')`,
    ).run(rid);
    db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES(?,'n-1','coder','[]','READY')`).run(rid);
    db.prepare(
      `INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES(?,?,?,1,'RUNNING','ih',1)`,
    ).run('att-' + i, rid, 'n-1');
  }
  setGlobalStop(db, false, 'test', 'kurulum'); // varsayılan latch'i aç
  return db;
}

const cmdFor = (db: any, rid: string, key: string) =>
  recordCommand(db, { kind: 'START_RUN', actorId: 'operator', runId: rid, idempotencyKey: key, payload: { runId: rid, planHash: H64('b'), idempotencyKey: key } });

test('global_capacity eşiği settings.max_workers=2: 3. rezerve RED', () => {
  const db = seededRuns(3);
  for (const i of [1, 2, 3]) {
    const rid = 'run-' + i;
    const cmd = cmdFor(db, rid, 'k' + i);
    const call = () => reserveDispatch(db, { attemptId: 'att-' + i, tokens: 10, commandId: cmd.commandId, dispatchKey: 'dk' + i });
    if (i < 3) call();
    else assert.throws(call, /global_capacity/);
  }
});

test('MOD firtina eşiği 2→4 kaydırır: 3. rezerve artık GEÇER (kapı hâlâ duruyor, sadece eşiği)', () => {
  const db = seededRuns(4);
  applyModeToSettings(db, cfg({ mod: 'firtina' })); // settings.max_workers=4
  assert.equal((db.prepare('SELECT max_workers AS w FROM settings WHERE id=1').get() as any).w, 4);
  for (const i of [1, 2, 3]) {
    const rid = 'run-' + i;
    const cmd = cmdFor(db, rid, 'k' + i);
    reserveDispatch(db, { attemptId: 'att-' + i, tokens: 10, commandId: cmd.commandId, dispatchKey: 'dk' + i });
  }
  // 4. de geçer (eşik 4); 5. olsa RED — kapı kalkmadı, sadece büyüdü
  assert.equal((db.prepare("SELECT COUNT(*) AS c FROM reservations WHERE state IN('ACTIVE','UNKNOWN')").get() as any).c, 3);
});

test('Y6/F3: STOP latch açıkken HİÇBİR mod dispatch üretemez (applyMode onu açamaz)', () => {
  const db = seededRuns(2);
  setGlobalStop(db, true, 'operator', 'acil');
  const eff = applyModeToSettings(db, cfg({ mod: 'firtina' })); // paralel artar...
  assert.equal(eff.maxWorkers, 4);
  const cmd = cmdFor(db, 'run-1', 'k1');
  // ...ama STOP kapısı gevşemez: global_stop hâlâ patlar
  assert.throws(() => reserveDispatch(db, { attemptId: 'att-1', tokens: 10, commandId: cmd.commandId, dispatchKey: 'dk1' }), /global_stop/);
  // dispatch_paused sütunu mod tarafından DEĞİŞTİRİLMEMİŞ olmalı:
  assert.equal((db.prepare('SELECT dispatch_paused AS p FROM settings WHERE id=1').get() as any).p, 1);
});

test('config/ordu.json gerçek dosyası yüklenir ve geçerli mod içerir', () => {
  const loaded = loadOrdConfig();
  assert.ok(['atolye', 'firtina', 'ekonomi'].includes(loaded.mod));
  assert.ok(resolveLimits(loaded).maxWorkers >= 1);
});
