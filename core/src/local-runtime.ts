// ADR-012 / K-0005 — LOCAL runtime yolu: Paseo olmadan worker koşumu.
// İkinci DEFTER değil, ikinci RUNNER (Y1 sabitası): dispatch/outbox/fence semantiği
// dispatcher.ts'den gelir; burası yalnız "dış dünya" taşıma katmanıdır.
// Not: gerçek launcher (git worktree add + detached provider CLI süreci + durable
// registry) V3-RT.1/2 canlı provasıyla yazılır; bu sınıf gate + semantik sözleşmesini
// hermetik kanıtlar — kanıtsız canlı çağrıya yine izin vermez (B02 deseni).
import { type ProbeReceipt } from './capabilities.ts';
import type { SpawnResult, WorkerAdapter } from './dispatcher.ts';

// local runtime'ın kendi kanıt seti (runtime-spesifik kapılar, ADR-012 §3):
export const LOCAL_REQUIRED_CAPS = [
  'gitWorktreeProven', 'processRegistryDurable', 'cancelConfirmLocal', 'providerCliPresent',
] as const;

export interface LocalLauncher {
  // worktree oluştur + provider CLI sürecini ayrık başlat; pid'i DURABLE registry'ye
  // dispatchKey ile yazmadan return ETME (registry yazılmamış launch = sayılmaz).
  // F6.5: cozulmus provider/model launcher'a passthrough; provider->CLI binary eslemesi launcher'in isi.
  launch(o: { dispatchKey: string; attemptId: string; prompt: string; provider?: string; model?: string }): Promise<{ pid: number }>;
  pidOf(dispatchKey: string): number | undefined;
  isAlive(pid: number): Promise<boolean | null>; // null = belirsiz (fail-closed UNKNOWN)
  kill(pid: number): Promise<void>;
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
    } catch {
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
    const dk = this.dispatchKeyByAttempt.get(attemptId);
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
