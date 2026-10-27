// ADR-012 / K-0005 — LOCAL runtime yolu: Paseo olmadan worker koşumu.
// İkinci DEFTER değil, ikinci RUNNER (Y1 sabitası): dispatch/outbox/fence semantiği
// dispatcher.ts'den gelir; burası yalnız "dış dünya" taşıma katmanıdır.
// A0-5 (L-RT, 2026-10-27): üretim LocalCliLauncher AŞAĞIDADIR (git worktree + gerçek
// provider CLI süreci + durable pid registry) — iskelet dönemi kapandı; hermetik test
// sahte CLI ile kanıtlar, gerçek CLI ölçümü entegrasyon sonrası operatörde.
import { type ProbeReceipt } from './capabilities.ts';
import type { SpawnResult, WorkerAdapter } from './dispatcher.ts';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, openSync, closeSync, readFileSync, existsSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { jsonlYukle, jsonlEkle } from './defter.ts';
import { cliOfProvider, cliPresent, type CliCozum, type CliTuru, type ExecFn } from './providers.ts';

// local runtime'ın kendi kanıt seti (runtime-spesifik kapılar, ADR-012 §3):
export const LOCAL_REQUIRED_CAPS = [
  'gitWorktreeProven', 'processRegistryDurable', 'cancelConfirmLocal', 'providerCliPresent',
] as const;

export interface LocalLauncher {
  // worktree oluştur + provider CLI sürecini ayrık başlat; pid'i DURABLE registry'e
  // dispatchKey ile yazmadan return ETME (registry yazılmamış launch = sayılmaz).
  // F6.5: cozulmus provider/model launcher'a passthrough; provider->CLI binary eslemesi launcher'in isi.
  launch(o: { dispatchKey: string; attemptId: string; prompt: string; provider?: string; model?: string }): Promise<{ pid: number }>;
  pidOf(dispatchKey: string): number | undefined;
  // B8 (denetçi): restart-sonrası cancel — bellek Map'i ölümlüdür, kayıt attemptId'yi
  // DISKTE taşır; adapter bu yüzden attemptId->dispatchKey çözümünü registry'den ister.
  dispatchKeyOf(attemptId: string): string | undefined;
  isAlive(pid: number): Promise<boolean | null>; // null = belirsiz (fail-closed UNKNOWN)
  kill(pid: number): Promise<void>;
}

// ---------------------------------------------------------------------------
// A0-5 (L-RT) — ÜRETİM LocalLauncher: ORDU_RUNTIME=local ile GERÇEK CLI süreci
// (Paseo'suz koşum bacağı; kullanıcı-değer: ajan yok, daemon yok, doğrudan süreç+çıktı).
// Zincir: provider->CLI çözümü (providers.ts CLI_REGISTRY/PROVIDER_CLI_MAP) ->
// providerCliPresent denetimi (kırmızı = LocalLaunchRed) -> git worktree add
// (M26 path-escape guard; GitWorktreeLauncher deseni) -> detached spawn (cwd=worktree,
// çıktı output dosyasına akar) -> pid DURABLE jsonl registry'ye fsync'li yazılır
// (defter.ts deseni: son-satır onarımı) YAZILMADAN return YOK (ADR-012: registry'siz
// launch sayılmaz). Y1 sabitası: ikinci RUNNER — defter/dispatch semantiği dispatcher'dan.
// Windows notu (B00 dersi): .cmd shim'leri spawn'a doğrudan görünmeyebilir; üretim
// wiring'de cliBindings gerçek .exe'ye işaret eder — varsayılan cmd'nin asenkron
// ENOENT'u pid'siz kalır ve UNKNOWN olarak kalır (uydurma RED/OK yok, A08).
// ---------------------------------------------------------------------------

// Deterministik fail-closed kırmızı: launcher'ın BİLİNEN reddi (registry-dışı CLI,
// providerCliPresent yokluğu, provider eksik, path-escape). Adapter bunu FATAL'a
// çevirir (U3: terminal kapanış, kör retry döngüsü yok); genel hatalar UNKNOWN kalır.
export class LocalLaunchRed extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'LocalLaunchRed';
  }
}

// CLI adı -> gerçek yürütülebilir bağlama (test: sahte CLI = node script'i;
// üretim: PATH'teki gerçek binary ya da Windows'ta tam .exe yolu).
export interface LocalCliBinding { cmd: string; argvPrefix: readonly string[] }

export interface LocalCliLauncherOpts {
  repoPath: string;        // worktree'lerin ekleneceği ana git deposu
  worktreeRoot: string;    // yönetilen worktree dizini (M26: dispatchKey içeride kalır)
  registryPath: string;    // DURABLE pid defteri (jsonl; fsync + son-satır onarımı)
  outputRoot?: string;     // CLI çıktı log dizini (varsayılan: worktreeRoot)
  cliBindings?: Readonly<Record<string, LocalCliBinding>>;
  execDetect?: ExecFn;     // providerCliPresent denetim enjeksiyonu (hermetik unit)
  env?: NodeJS.ProcessEnv; // çocuğa eklenen env (process.env BİRLEŞTİRİLİR — opts.env kazanan)
}

// Durable registry kaydı (append-only; her launch bir satır, son kayıt kazanır).
export interface LocalRunRecord {
  event: 'launch';
  dispatchKey: string;
  attemptId: string;
  pid: number;
  cli: string;             // CLI türü adı (ör. 'claude-code')
  provider: string;
  model: string | null;
  worktreePath: string;
  outputPath: string;
  startedAt: string;       // ISO damga
}

export class LocalCliLauncher implements LocalLauncher {
  // Node strip-only modu TS parametre-properti desteklemez -> açık alan ataması.
  private opts: LocalCliLauncherOpts;
  private outputRoot: string;

  constructor(opts: LocalCliLauncherOpts) {
    this.opts = opts;
    mkdirSync(opts.worktreeRoot, { recursive: true });
    this.outputRoot = opts.outputRoot ?? opts.worktreeRoot;
    mkdirSync(this.outputRoot, { recursive: true });
  }

  private bindingOf(adi: string, tur: CliTuru): LocalCliBinding {
    return this.opts.cliBindings?.[adi] ?? { cmd: tur.cmd, argvPrefix: [] };
  }

  // M26 path-escape (GitWorktreeLauncher/capabilities.ts deseni): dispatchKey çözümlenmiş
  // hali worktreeRoot İÇİNDE kalmalı; '..', mutlak yol veya symlink/junction kaçağı RED.
  private resolveWorktreePath(dispatchKey: string): string {
    const root = realpathSync(this.opts.worktreeRoot); // constructor mkdirSync ile garantili
    const candidate = resolve(root, dispatchKey);
    const rel = relative(root, candidate);
    if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
      throw new LocalLaunchRed('M26 RED: dispatchKey worktreeRoot disina cikiyor - path-escape: ' + JSON.stringify(dispatchKey));
    }
    return candidate;
  }

  private git(args: string[]): void {
    execFileSync('git', ['-C', this.opts.repoPath, ...args], { encoding: 'utf8' });
  }

  async launch(o: { dispatchKey: string; attemptId: string; prompt: string; provider?: string; model?: string }): Promise<{ pid: number }> {
    if (!o.provider) throw new LocalLaunchRed('L-RT RED: provider gerekli — local kosum provider->CLI eslemesi ister');
    let cozum: CliCozum;
    try {
      cozum = cliOfProvider(o.provider); // registry-disi CLI/provider -> GateError
    } catch (e) {
      throw new LocalLaunchRed(String((e as Error).message));
    }
    const binding = this.bindingOf(cozum.adi, cozum.tur);
    // providerCliPresent denetimi (A0-5 olcutu): kirmizi = spawn RED (fail-closed).
    const present = cliPresent(
      { cmd: binding.cmd, args: [...binding.argvPrefix, ...cozum.tur.detectArgs] },
      this.opts.execDetect === undefined ? undefined : { exec: this.opts.execDetect },
    );
    if (!present) throw new LocalLaunchRed('providerCliPresent kirmizisi: ' + binding.cmd + ' bulunamadi — spawn RED (fail-closed)');
    // worktree oluştur (detached HEAD; spend-free yerel git işlemi)
    const worktreePath = this.resolveWorktreePath(o.dispatchKey);
    this.git(['worktree', 'add', '--detach', worktreePath, 'HEAD']);
    // çıktı dosyası: koşum bacağının görünür ürünü (kullanıcı-değer: süreç + çıktı)
    const outputPath = join(this.outputRoot, o.dispatchKey.replace(/[^a-zA-Z0-9._-]/g, '_') + '.log');
    const argv = cozum.tur.buildArgs({ prompt: o.prompt, model: o.model ?? null });
    const outFd = openSync(outputPath, 'a');
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(binding.cmd, [...binding.argvPrefix, ...argv], {
        detached: true,
        cwd: worktreePath,
        stdio: ['ignore', outFd, outFd], // stdout+stderr -> çıktı dosyası
        env: { ...process.env, ...this.opts.env },
      });
    } finally {
      closeSync(outFd); // çocuk fd'yi miras aldı; ebeveyn kopyası kapanır
    }
    child.on('error', () => { /* asenkron ENOENT vs.: pid kapisi asagida halleder */ });
    child.unref();
    const pid = child.pid;
    if (typeof pid !== 'number') throw new Error('launch: pid alinamadi (belirsiz — A08 UNKNOWN yolu, RED degil)');
    // KURAL (ADR-012): pid DURABLE registry'ye yazılmadan return YOK (fsync'li append).
    const record: LocalRunRecord = {
      event: 'launch', dispatchKey: o.dispatchKey, attemptId: o.attemptId, pid,
      cli: cozum.adi, provider: o.provider, model: o.model ?? null,
      worktreePath, outputPath, startedAt: new Date().toISOString(),
    };
    try {
      jsonlEkle(this.opts.registryPath, record);
    } catch (e) {
      // B9 (denetçi): yetim-süreç penceresi — çocuk DOĞDU ama registry'ye yazılamadı
      // (disk/izin). "Registry'siz launch sayılmaz" invariant'ı: süreç TELAFİ kill
      // edilir (en iyi çaba), launch RED döner — kayıtsız yaşayan süreç bırakılmaz.
      try { child.kill(); } catch { /* zaten öldüyse telafi gerekmez */ }
      throw new LocalLaunchRed('L-RT RED: pid registry yazımı başarısız — süreç telafi kill edildi: ' + String((e as Error).message));
    }
    return { pid };
  }

  // Durable okuma: HER çağrıda diskten (restart-honest — yeni instance aynı defteri görür;
  // crash'te yarım son satır jsonlYukle tarafından onarılır; onarılamaz bozukluk = belirsiz
  // -> undefined -> adapter UNKNOWN; uydurma pid/DEAD yok).
  pidOf(dispatchKey: string): number | undefined {
    let kayitlar: LocalRunRecord[];
    try {
      kayitlar = jsonlYukle<LocalRunRecord>(
        this.opts.registryPath,
        (code, msg) => { throw new Error('l-rt registry bozuk (' + code + '): ' + msg); },
        'l-rt-pid-registry',
      );
    } catch {
      return undefined;
    }
    let pid: number | undefined;
    for (const r of kayitlar) {
      if (r?.event === 'launch' && r.dispatchKey === dispatchKey && typeof r.pid === 'number') pid = r.pid; // son kayit kazanir
    }
    return pid;
  }

  // B8 (denetçi): restart-sonrası cancel körlüğü — adapter'in bellek Map'i yeni süreçte
  // boştur; registry kaydı attemptId'yi DISKTE taşır, son launch kaydından çözülür.
  dispatchKeyOf(attemptId: string): string | undefined {
    let kayitlar: LocalRunRecord[];
    try {
      kayitlar = jsonlYukle<LocalRunRecord>(
        this.opts.registryPath,
        (code, msg) => { throw new Error('l-rt registry bozuk (' + code + '): ' + msg); },
        'l-rt-pid-registry',
      );
    } catch {
      return undefined;
    }
    let dk: string | undefined;
    for (const r of kayitlar) {
      if (r?.event === 'launch' && r.attemptId === attemptId && typeof r.dispatchKey === 'string') dk = r.dispatchKey; // son kayit kazanir
    }
    return dk;
  }

  // process.kill(pid, 0) varlık testi: ESRCH=öldü; EPERM/diğer=yaşıyor; belirsiz=null.
  async isAlive(pid: number): Promise<boolean | null> {
    try { process.kill(pid, 0); return true; }
    catch (e) { return (e as any)?.code === 'ESRCH' ? false : null; }
  }

  async kill(pid: number): Promise<void> {
    try { process.kill(pid); } catch { /* zaten ölü: kill yinelenebilir */ }
  }

  // Koşum çıktısını oku (yoksa null — uydurma çıktı yok).
  outputOf(dispatchKey: string): string | null {
    let pidKayit: LocalRunRecord | undefined;
    try {
      const kayitlar = jsonlYukle<LocalRunRecord>(
        this.opts.registryPath,
        (code, msg) => { throw new Error('l-rt registry bozuk (' + code + '): ' + msg); },
        'l-rt-pid-registry',
      );
      for (const r of kayitlar) if (r?.event === 'launch' && r.dispatchKey === dispatchKey) pidKayit = r;
    } catch { return null; }
    if (!pidKayit || !existsSync(pidKayit.outputPath)) return null;
    return readFileSync(pidKayit.outputPath, 'utf8');
  }

  // test/cleanup: worktree'yi kaldır (registry kaydı durable kalır — gerçekçi).
  removeWorktree(dispatchKey: string): void {
    let wt: string | undefined;
    try {
      const kayitlar = jsonlYukle<LocalRunRecord>(
        this.opts.registryPath,
        (code, msg) => { throw new Error('l-rt registry bozuk (' + code + '): ' + msg); },
        'l-rt-pid-registry',
      );
      for (const r of kayitlar) if (r?.event === 'launch' && r.dispatchKey === dispatchKey) wt = r.worktreePath;
    } catch { return; }
    if (wt) { try { this.git(['worktree', 'remove', '--force', wt]); } catch { /* yok say */ } }
  }
}

export class LocalRuntimeAdapter implements WorkerAdapter {
  private probe: ProbeReceipt;
  private launcher: LocalLauncher;
  private env: NodeJS.ProcessEnv;
  // BUG-C2 duzeltmesi (TUR A): requestCancel attemptId gonderir; spawn aninda
  // attemptId->dispatchKey bagini kur — iptalde durable registry'den (pidOf) taze pid alinir.
  private readonly dispatchKeyByAttempt = new Map<string, string>();
  constructor(probe: ProbeReceipt, launcher: LocalLauncher, env: NodeJS.ProcessEnv = process.env) {
    this.probe = probe;
    this.launcher = launcher;
    this.env = env;
  }

  async spawn(o: { dispatchKey: string; attemptId: string; prompt: string; provider?: string; model?: string }): Promise<SpawnResult> {
    // ADR-012 §3: kapı RUNTIME-KAPSAMLI değerlendirilir — paseo-özel yeteneklerin
    // false olması local yolunu bloklamaz (ve tersi); eksik kanıt = o runtime'da spawn yok.
    const missing = LOCAL_REQUIRED_CAPS.filter((c) => this.probe.capabilities[c] !== true);
    if (missing.length > 0) return { outcome: 'FATAL', reason: 'local-capability-blocked: ' + missing.join(',') };
    if (this.env.ORDU_RUNTIME !== 'local') return { outcome: 'FATAL', reason: 'runtime-declaration: ORDU_RUNTIME=local bekleniyor' };
    try {
      const { pid } = await this.launcher.launch(o);
      this.dispatchKeyByAttempt.set(o.attemptId, o.dispatchKey);
      return { outcome: 'OK', externalSessionId: 'local:' + pid };
    } catch (e) {
      // A0-5: LocalLaunchRed = DETERMİNİSTİK fail-closed kırmızı (registry-dışı CLI,
      // providerCliPresent yokluğu, provider eksik, path-escape). Ölçüt: "kırmızı =
      // spawn RED" — UNKNOWN DEĞİL, FATAL (U3: attempt/node terminal, rezervasyon
      // serbest; kör retry döngüsü doğmaz). Genel hatalar (ağ/process belirsizliği)
      // A08 UNKNOWN kalır — belirsizlikte kör re-spawn YASAK, reconcile şart.
      if (e instanceof LocalLaunchRed) return { outcome: 'FATAL', reason: 'local-launch-red: ' + e.message };
      return { outcome: 'UNKNOWN' }; // A08: belirsizlikte kör re-spawn YASAK — reconcile şart
    }
  }

  async lookup(dispatchKey: string): Promise<'ALIVE' | 'DEAD' | 'UNKNOWN'> {
    const pid = this.launcher.pidOf(dispatchKey);
    if (pid === undefined) return 'UNKNOWN'; // registry'de yok: "hiç yoktu" mu "kayıp" mı AYIRT EDİLEMEZ — uydurma DEAD yok
    const alive = await this.launcher.isAlive(pid);
    return alive === true ? 'ALIVE' : alive === false ? 'DEAD' : 'UNKNOWN';
  }

  // BUG-C2 duzeltmesi (TUR A): kanonik K-0006 sözleşme — cancel(attemptId) =>
  // 'CONFIRMED_DEAD' | 'REQUESTED' | 'UNKNOWN'. Eski imza cancel(dispatchKey)=>boolean
  // sözleşme DIŞIydı: requestCancel attemptId gonderir, pidOf(attemptId)=undefined ->
  // erken false, kill'e HIC ulasılmaz, süreç yaşamaya devam ederdi.
  // Teyit = kill + sınırlı pencerede OS ölüm doğrulaması (uydurma CONFIRMED_DEAD yok;
  // ölüm gözlenmezse REQUESTED, belirsizlikte UNKNOWN — her ikisinde slot AKTİF kalır).
  async cancel(attemptId: string): Promise<'CONFIRMED_DEAD' | 'REQUESTED' | 'UNKNOWN'> {
    // B8 (denetçi): bellek Map'i yalnız bu adapter ömründe yaşar — restart sonrası
    // kayıt DISKTE attemptId taşır, registry'den çözülür (yoksa UNKNOWN: fail-closed).
    const dk = this.dispatchKeyByAttempt.get(attemptId) ?? this.launcher.dispatchKeyOf(attemptId);
    if (dk === undefined) return 'UNKNOWN'; // bu adapter'ten spawn edilmedi: fail-closed
    const pid = this.launcher.pidOf(dk);
    if (pid === undefined) return 'UNKNOWN';
    await this.launcher.kill(pid);
    const son = Date.now() + 2000;
    while (Date.now() < son) {
      const alive = await this.launcher.isAlive(pid);
      if (alive === false) return 'CONFIRMED_DEAD';
      if (alive === null) return 'UNKNOWN'; // belirsizlik → teyit yok
      await new Promise((r) => setTimeout(r, 50));
    }
    return 'REQUESTED'; // kill isteği gitti, pencerede ölüm teyidi gelmedi
  }
}
