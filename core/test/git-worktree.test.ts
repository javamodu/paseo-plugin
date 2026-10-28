// V3-RT.1 — spend-free GERÇEK git worktree + durable PID registry provasi.
// Temp git reposu uzerinde: worktree add + ayrik zararsiz surec + pid'i kalici
// deftere yazma + restart'ta geri okuma + kill ile iptal DOGRULAMASI.
// Provider CLI / LLM YOK (harcama yok); mekanizma kanitlanir. Temizlik garanti.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { GitWorktreeLauncher } from '../src/git-worktree-launcher.ts';
import { LocalRuntimeAdapter } from '../src/local-runtime.ts';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function freshRepo() {
  const root = mkdtempSync(join(tmpdir(), 'ordu-rt1-'));
  const repo = join(root, 'repo');
  execFileSync('git', ['init', '-q', repo]);
  execFileSync('git', ['-C', repo, 'config', 'user.email', 't@t']);
  execFileSync('git', ['-C', repo, 'config', 'user.name', 't']);
  writeFileSync(join(repo, 'README.md'), 'kapsul\n');
  execFileSync('git', ['-C', repo, 'add', '.']);
  execFileSync('git', ['-C', repo, 'commit', '-q', '-m', 'base']);
  return { root, repoPath: repo, worktreeRoot: join(root, 'wt'), registryPath: join(root, 'registry.json') };
}

test('RT.1: worktree olusur, pid durable registrye yazilir, surec yasarken kill ile DEAD dogrulanir', async () => {
  const { root, ...o } = freshRepo();
  const l = new GitWorktreeLauncher(o);
  try {
    const { pid } = await l.launch({ dispatchKey: 'dk-1', attemptId: 'att-1', prompt: 'is' });
    assert.ok(Number.isInteger(pid) && pid > 0, 'gecerli pid');
    // worktree gercekten diskte var (detached)
    assert.ok(existsSync(join(o.worktreeRoot, 'dk-1')), 'worktree dizini olusmali');
    // pid durable defterde
    assert.ok(existsSync(o.registryPath), 'registry dosyasi yazilmali');
    assert.equal(l.pidOf('dk-1'), pid);
    // surec canli
    await delay(150);
    assert.equal(await l.isAlive(pid), true, 'spawn edilen surec yasali');
    // kill + lookup: iptal DOGRULANIR (uydurma degil)
    await l.kill(pid);
    await delay(250);
    assert.equal(await l.isAlive(pid), false, 'kill sonrasi DEAD');
  } finally {
    try { l.removeWorktree('dk-1'); } catch { /* noop */ }
    rmSync(root, { recursive: true, force: true });
  }
});

test('RT.1: DURABLE registry restarti — yeni instance ayni pidOf gorur (pid kaybolmaz)', async () => {
  const { root, ...o } = freshRepo();
  const l1 = new GitWorktreeLauncher(o);
  let pid = 0;
  try {
    pid = (await l1.launch({ dispatchKey: 'dk-2', attemptId: 'att-2', prompt: 'is' })).pid;
    // "restart": state'i unutan yeni instance ayni durable dosyayi okur
    const l2 = new GitWorktreeLauncher(o);
    assert.equal(l2.pidOf('dk-2'), pid, 'restart sonrasi pid geri okunmali');
    // registry'de olmayan key: uydurma DEAD YOK -> lookup pidOf undefined (adapter UNKNOWN'a ceker)
    assert.equal(l2.pidOf('yok-boyle-bir-key'), undefined);
  } finally {
    await l1.kill(pid);
    try { l1.removeWorktree('dk-2'); } catch { /* noop */ }
    rmSync(root, { recursive: true, force: true });
  }
});

test('RT.1 B8 (tip-borcu v9-06/c): dispatchKeyOf — attemptId→dispatchKey restart sonrasi DISKTE cozulur, bilinmeyen undefined', async () => {
  const { root, ...o } = freshRepo();
  const l1 = new GitWorktreeLauncher(o);
  let pid = 0;
  try {
    pid = (await l1.launch({ dispatchKey: 'dk-b8', attemptId: 'att-b8', prompt: 'is' })).pid;
    assert.equal(l1.dispatchKeyOf('att-b8'), 'dk-b8', 'ayni instance: kayittan cozulur');
    // restart: yeni instance bellek Map'i bos ama durable registry'den cozer (cancel kör değil)
    const l2 = new GitWorktreeLauncher(o);
    assert.equal(l2.dispatchKeyOf('att-b8'), 'dk-b8', 'restart sonrasi DISKTE cozulmeli');
    assert.equal(l2.dispatchKeyOf('yok-boyle-attempt'), undefined, 'bilinmeyen → undefined → adapter UNKNOWN (fail-closed)');
  } finally {
    await l1.kill(pid);
    try { l1.removeWorktree('dk-b8'); } catch { /* noop */ }
    rmSync(root, { recursive: true, force: true });
  }
});

test('RT.1: olsente kanit — pid yazilamassa launch hata verir (return yok, fail-closed)', async () => {
  const { root, ...o } = freshRepo();
  // worker aninda olurse bile pid gecerli; ama ornek: worker cmd gecersiz -> spawn throw etmez, pid yoksa throw
  const l = new GitWorktreeLauncher({ ...o, worker: () => ({ cmd: '__olmayan_binary__xyz__', args: [] }) });
  try {
    // spawn ENOENT -> child.pid tanimsiz -> launch throw (registry'ye YAZMAZ)
    await assert.rejects(() => l.launch({ dispatchKey: 'dk-3', attemptId: 'att-3', prompt: 'x' }), /pid/);
    assert.equal(l.pidOf('dk-3'), undefined, 'basarisiz launch registry birakmaz');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('RT.1 ENTEGRASYON: LocalRuntimeAdapter + gercek launcher — spawn OK, lookup ALIVE, kill ile DEAD', async () => {
  const { root, ...o } = freshRepo();
  const l = new GitWorktreeLauncher(o);
  // kapilar RT.1 mekanizmasi icin TRUE verilir (provider CLI gercek kontrolu RT.2/harcali)
  const probe = { capabilities: { gitWorktreeProven: true, processRegistryDurable: true, cancelConfirmLocal: true, providerCliPresent: true }, blocked: [] } as any;
  const a = new LocalRuntimeAdapter(probe, l, { ORDU_RUNTIME: 'local' });
  let pid = 0;
  try {
    const r = await a.spawn({ dispatchKey: 'dk-4', attemptId: 'att-4', prompt: 'is' });
    assert.equal(r.outcome, 'OK');
    pid = l.pidOf('dk-4')!;
    await delay(150);
    assert.equal(await a.lookup('dk-4'), 'ALIVE', 'durable registry + canli pid -> ALIVE');
    await l.kill(pid);
    await delay(250);
    assert.equal(await a.lookup('dk-4'), 'DEAD', 'kill sonrasi lookup DEAD (iptal dogrulanir)');
  } finally {
    await l.kill(pid);
    try { l.removeWorktree('dk-4'); } catch { /* noop */ }
    rmSync(root, { recursive: true, force: true });
  }
});

test('RT.1 GUVENLIK (M26): dispatchKey path-escape RED - .. / mutlak yol worktreeRoot disina cikamaz', async () => {
  const { root, ...o } = freshRepo();
  const l = new GitWorktreeLauncher(o);
  let leakedPid: number | undefined;
  const attempt = async (dispatchKey: string): Promise<Error | null> => {
    try {
      const r = await l.launch({ dispatchKey, attemptId: 'att-x', prompt: 'x' });
      leakedPid = r.pid; // yama oncesi: kacis launch basarili -> KACAK kaniti
      return null;
    } catch (err) {
      return err as Error;
    }
  };
  try {
    const errUp = await attempt('../escape-outside');
    assert.ok(errUp, 'kacis key (..) RED edilmeli - yama oncesi bu satir PATLAR (kirmizi kanit)');
    assert.match(String(errUp!.message), /worktreeRoot|path-escape|RED/i);
    assert.ok(!existsSync(join(root, 'escape-outside')), 'worktreeRoot disina dizin yazilmamali');

    const errDeep = await attempt('../../escape-deep');
    assert.ok(errDeep, 'cift-seviye .. RED edilmeli');
    assert.ok(!existsSync(join(root, '..', 'escape-deep')), 'root ustune worktree yazilmamali');

    const errAbs = await attempt(resolve(root, 'escape-abs'));
    assert.ok(errAbs, 'mutlak yol key RED edilmeli');
    assert.ok(!existsSync(join(root, 'escape-abs')), 'mutlak yol kacagi yazilmamali');

    // pozitif kontrol: normal key hala calisir ve worktreeRoot ICINDE kalir
    const okPid = (await l.launch({ dispatchKey: 'dk-ok', attemptId: 'att-ok', prompt: 'is' })).pid;
    assert.ok(existsSync(join(o.worktreeRoot, 'dk-ok')), 'normal key worktree olusturur');
    await l.kill(okPid);
    try { l.removeWorktree('dk-ok'); } catch { /* noop */ }
  } finally {
    if (typeof leakedPid === 'number') { try { await l.kill(leakedPid); } catch { /* noop */ } }
    try { l.removeWorktree('../escape-outside'); } catch { /* noop */ }
    try { l.removeWorktree('../../escape-deep'); } catch { /* noop */ }
    rmSync(root, { recursive: true, force: true });
    rmSync(join(root, '..', 'escape-deep'), { recursive: true, force: true });
  }
});
