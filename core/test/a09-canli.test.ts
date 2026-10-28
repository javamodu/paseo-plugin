// A09 canlı bacak (FAZ-3 K2; triyaj raporlar/faz3-triyaj-2026-10-25.md): GERÇEK
// süre-aşımı gözlemi. Hermetik kol takeLease+bump'ı ölçümsüz zamanla sınamıştı; burada
// lease GERÇEK duvar saatiyle dolar: owner-1 gerçek bir node sürecidir (pid kayıtlı),
// lease_until = şimdi+400ms GERÇEKTEN geçmesi BEKLENİR (gerçek ölçülmüş süre), sonra
// devir (takeLease fence bump) gelir; eski sahibin fence'li yazması RED; devir anında
// eski sahibin GERÇEK süreci cancelStaleOwner ile öldürülür (OS ölümü teyitli).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, takeLease, commitCandidate, setGlobalStop, GateError, FenceError } from '../src/store.ts';
import { cancelStaleOwner } from '../src/adapter-contract.ts';
import type { WorkerAdapter } from '../src/dispatcher.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);

const waitExit = (c: ChildProcess) => new Promise<void>((res) => {
  if (c.exitCode !== null || c.signalCode !== null) return res();
  c.once('exit', () => res());
});

test('A09 canlı lease: GERÇEK süre-aşımı → devir (fence bump) → eski fence yazması RED → eski sahibin GERÇEK süreci ölür', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-a09-'));
  const db = openStore(join(dir, 'ordu.sqlite'));
  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)').run('cap-1', 'h', 'r', H64('a'));
  db.prepare('INSERT INTO plans(id,capsule_id,version,plan_hash,evaluator_hash,policy_hash,payload_json) VALUES(?,?,?,?,?,?,?)').run('plan-1', 'cap-1', 1, H64('b'), H64('e'), H64('p'), '{}');
  db.prepare(`INSERT INTO runs(id,plan_id,version,state,profile_hash,dispatch_paused,max_workers,max_attempts,max_reserved_tokens,spent_tokens,usage_unknown,deadline_at)
    VALUES('run-1','plan-1',1,'READY','ph',0,2,3,100,0,0,'2026-12-31T00:00:00Z')`).run();
  db.prepare(`INSERT INTO nodes(run_id,id,role,dependencies_json,state) VALUES('run-1','n-1','coder','[]','READY')`).run();
  db.prepare(`INSERT INTO attempts(id,run_id,node_id,number,state,input_hash,fencing_token) VALUES('att-1','run-1','n-1',1,'RUNNING','ih',1)`).run();
  setGlobalStop(db, false, 't', 'kurulum');
  t.after(() => { db.close(); });

  // owner-1'in GERÇEK süreci: canlı kalır (keepalive) — devir anında öldürülecek
  const eskiSahip = spawn(process.execPath, ['-e', 'setInterval(function(){},1073741824)'], { stdio: 'ignore', detached: true });
  eskiSahip.unref();
  t.after(() => { try { eskiSahip.kill('SIGKILL'); } catch { /* zaten olabilir */ } });
  assert.ok(eskiSahip.pid !== undefined && eskiSahip.pid > 0, 'eski sahibin gerçek pid: ' + eskiSahip.pid);
  process.kill(eskiSahip.pid, 0); // canlı teyit (0 sinyali = yoklama)

  // 1) lease GERÇEK 400ms'lik: şimdi alınır, GERÇEKTEN dolması beklenir
  const leaseSuresi = 400;
  const leaseUntil = new Date(Date.now() + leaseSuresi).toISOString();
  const f2 = takeLease(db, 'att-1', 'owner-1', leaseUntil);
  assert.equal(f2, 2, 'ilk devir: fence 1→2');

  // 2) GERÇEK bekleme: duvar saati lease_until'i geçsin (ölçülmüş)
  const t0 = Date.now();
  while (Date.now() < Date.parse(leaseUntil) + 60) {
    await new Promise((r) => setTimeout(r, 40));
  }
  const gecen = Date.now() - t0;
  assert.ok(gecen >= leaseSuresi, 'lease GERÇEKTEN doldu: ' + gecen + 'ms >= ' + leaseSuresi + 'ms');
  assert.ok(Date.now() > Date.parse(leaseUntil), 'duvar saati lease_until sonrası');

  // 3) devir: yeni sahip lease alır → fence 2→3 (eski sahibin yazmaları artık stale)
  const f3 = takeLease(db, 'att-1', 'owner-2', new Date(Date.now() + 36e5).toISOString());
  assert.equal(f3, 3, 'ikinci devir: fence 2→3');

  // 4) eski sahibin fence'li commit'i RED (stale fence — kanıt defteri kirlenmez)
  assert.throws(
    () => commitCandidate(db, 'att-1', 2, H64('c'), 'owner-1-eski'),
    FenceError,
  );
  const kanit = (db.prepare('SELECT COUNT(*) c FROM evidence').get() as any).c;
  assert.equal(kanit, 0, 'stale fence ile kanıt yazılamadı');

  // 5) devir anında eski sahibin GERÇEK süreci iptal edilir (BUG-C6 patikası):
  // adapter.cancel gerçek pid'yi SIGKILL ile öldürür + OS ölümünü teyit eder
  const adapter: WorkerAdapter = {
    async spawn() { throw new Error('ULAŞILMAMALIYDI'); },
    async lookup(_dk: string): Promise<'ALIVE' | 'DEAD' | 'UNKNOWN'> { return 'UNKNOWN' as const; }, // tip-borcu v9-06: WorkerAdapter sözleşme üyesi (cancel senaryosu lookup kullanmıyor — UNKNOWN dürüst)
    async cancel(attemptId: string): Promise<'CONFIRMED_DEAD' | 'REQUESTED' | 'UNKNOWN'> {
      assert.equal(attemptId, 'att-1');
      try { process.kill(eskiSahip.pid!, 'SIGKILL'); } catch { /* zaten olabilir */ }
      await waitExit(eskiSahip);
      const son = Date.now() + 2000;
      while (Date.now() < son) {
        try { process.kill(eskiSahip.pid!, 0); await new Promise((r) => setTimeout(r, 25)); }
        catch (e: any) { return e.code === 'ESRCH' ? 'CONFIRMED_DEAD' : 'UNKNOWN'; }
      }
      return 'REQUESTED';
    },
  };
  const k = await cancelStaleOwner(db, adapter, 'att-1', 'lease-expiry');
  assert.equal(k.status, 'KILLED', 'eski sahibin gerçek süreci öldürüldü (OS teyitli)');
  assert.ok(eskiSahip.exitCode !== null || eskiSahip.signalCode !== null, 'gerçek süreç kapandı (exitCode=' + eskiSahip.exitCode + ' signal=' + eskiSahip.signalCode + ')');

  // 6) attempt durumu DEĞİŞMEZ (devir iptal değil — yeni sahip aynı attempte devam eder)
  const st = (db.prepare("SELECT state FROM attempts WHERE id='att-1'").get() as any).state;
  assert.equal(st, 'RUNNING', 'devir attempt durumunu değiştirmez (BUG-C6 kuralı)');

  // 7) yeni sahip YAZAR: güncel fence 3 ile commit geçer
  commitCandidate(db, 'att-1', 3, H64('d'), 'owner-2');
  const st2 = (db.prepare("SELECT state FROM attempts WHERE id='att-1'").get() as any).state;
  assert.equal(st2, 'CANDIDATE_FROZEN', 'yeni sahip güncel fence ile yazar');

  console.log('KANIT A09: lease gerçek ' + leaseSuresi + 'ms doldu (ölçülen ' + gecen + 'ms) → devir fence 2→3; eski fence commit RED (kanıt 0); eski sahibin gerçek pid=' + eskiSahip.pid + ' devir anında öldü (KILLED); attempt RUNNING kaldı; yeni fence 3 ile commit geçti');
});
