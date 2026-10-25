// ADR-012 / V3-RT.1 — GERÇEK git worktree + ayrık süreç + DURABLE PID registry.
// HARCAMASIZ (spend-free): provider CLI / LLM DEĞİL, zararsız bir yerel süreç başlatır.
// Amaç yalnız RT.1 mekanizmasını kanıtlamak: worktree add → detached launcher →
// pid'i dispatchKey ile KALICI deftere yazmadan return YOK → restart'ta geri okunur
// → kill + lookup ile iptal DOĞRULANIR. Provider CLI uca-ucası V3-RT.2 (canlı/harcama)
// burada DEĞİL — Y1 sabitası: bu ikinci RUNNER'dır, defter semantiği dispatcher'dan gelir.
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import type { LocalLauncher } from './local-runtime.ts';

export interface RegistryEntry {
  dispatchKey: string;
  attemptId: string;
  pid: number;
  worktreePath: string;
  startedAt: string;
}

export interface WorktreeLauncherOpts {
  repoPath: string;         // worktree'ların ekleneceği ana git deposu
  worktreeRoot: string;      // yönetilen worktree dizini
  registryPath: string;      // DURABLE pid defteri (JSON) — restart'ta geri okunur
  // başlatılacak zararsız iş; gerçek RT.2'de provider CLI buraya girer (harcamalı).
  worker?: () => { cmd: string; args: string[] };
}

export class GitWorktreeLauncher implements LocalLauncher {
  private registry = new Map<string, RegistryEntry>();
  // Node strip-only modu TS parametre-properti desteklemez -> açik alan atamasi.
  private opts: WorktreeLauncherOpts;
  constructor(opts: WorktreeLauncherOpts) {
    this.opts = opts;
    mkdirSync(opts.worktreeRoot, { recursive: true });
    this.load(); // durable: mevcut instance'lar aynı defteri görür (restart simülasyonu)
  }

  private load() {
    if (existsSync(this.opts.registryPath)) {
      const arr = JSON.parse(readFileSync(this.opts.registryPath, 'utf8')) as RegistryEntry[];
      for (const e of arr) this.registry.set(e.dispatchKey, e);
    }
  }
  private save() {
    writeFileSync(this.opts.registryPath, JSON.stringify([...this.registry.values()], null, 2));
  }

  private git(args: string[]) {
    return execFileSync('git', ['-C', this.opts.repoPath, ...args], { encoding: 'utf8' });
  }

  // M26 path-escape: dispatchKey cozumlenmis hali worktreeRoot ICINDE kalmali;
  // '..', mutlak yol veya symlink/junction kacagi RED (ref: capabilities.ts loadVerifiedProbe).
  private resolveWorktreePath(dispatchKey: string): string {
    const root = realpathSync(this.opts.worktreeRoot); // constructor mkdirSync ile garantili
    const candidate = resolve(root, dispatchKey);
    const rel = relative(root, candidate);
    if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
      throw new Error('dispatchKey worktreeRoot disina cikiyor - path-escape RED (M26): ' + JSON.stringify(dispatchKey));
    }
    return candidate;
  }

  async launch(o: { dispatchKey: string; attemptId: string; prompt: string }): Promise<{ pid: number }> {
    const worktreePath = this.resolveWorktreePath(o.dispatchKey);
    // worktree ekle (detached HEAD; spend-free, yalnız yerel git işlemi)
    this.git(['worktree', 'add', '--detach', worktreePath, 'HEAD']);
    // ayrık, zararsız worker süreci başlat (varsayılan: uzun-uyuyan node süreci)
    const w = (this.opts.worker ??
      (() => ({ cmd: process.execPath, args: ['-e', 'setTimeout(() => {}, 600000);'] })))();
    const child = spawn(w.cmd, w.args, { detached: true, stdio: 'ignore' });
    child.unref();
    // ENOENT vb. asenkron 'error' olayi: yutulur (pid yoksa zaten throw edilir);
    // dinleyici olmadan test prosesini dusurur (uncaughtException).
    child.on('error', () => { /* belirsiz baslangic: asagidaki pid kapisi halleder */ });
    const pid = child.pid;
    if (typeof pid !== 'number') throw new Error('launch: pid alinamadi');
    // KURAL: pid DURABLE registry'ye yazilmadan return YOK.
    this.registry.set(o.dispatchKey, {
      dispatchKey: o.dispatchKey, attemptId: o.attemptId, pid, worktreePath,
      startedAt: new Date().toISOString(),
    });
    this.save();
    return { pid };
  }

  pidOf(dispatchKey: string): number | undefined {
    return this.registry.get(dispatchKey)?.pid;
  }

  // process.kill(pid, 0) varlık testi: ESRCH=öldü; EPERM/diğer=yaşıyor; belirsiz=null.
  async isAlive(pid: number): Promise<boolean | null> {
    try { process.kill(pid, 0); return true; }
    catch (e: any) { return e?.code === 'ESRCH' ? false : null; }
  }

  async kill(pid: number): Promise<void> {
    try { process.kill(pid); } catch { /* zaten ölü: kill yinelenebilir */ }
  }

  // test/cleanup: worktree'yi kaldır (registry kaydı durable kalır — gerçekçi).
  removeWorktree(dispatchKey: string) {
    const e = this.registry.get(dispatchKey);
    if (e) { try { this.git(['worktree', 'remove', '--force', e.worktreePath]); } catch { /* yok say */ } }
  }
}
