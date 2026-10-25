// Paseo worker adapter — taşıma seviyesi. CANLI spawn iki kapıdan geçer:
// 1) B02 capability gate (doğrulanmış probe receipt, blocked boş) — aksi hâlde FATAL,
//    dispatch rezervasyonu release eder (yanlış iş DOĞRULMADAN denenmez).
// 2) ORDU_LIVE=1 açık env beyanı + transport enjeksiyonu; testler sahte transport kullanır.
import { spawnBlockedReason, type ProbeReceipt } from './capabilities.ts';
import type { SpawnResult, WorkerAdapter } from './dispatcher.ts';
import { isAbsolute } from 'node:path';
import { existsSync, statSync } from 'node:fs';

export interface Transport {
  // dispatchKey deterministik korelasyon kimliğidir: yanıt kaybında lookup bununla yapılır.
  // cwd: kapsul repo yolu (F5.5) — verilirse ajan bu dizine baglanir (transport
  // daemon'da workspace find-or-create + --workspace gecer); verilmezse legacy
  // davranis (CLI process.cwd) korunur.
  spawn(o: { dispatchKey: string; attemptId: string; prompt: string; cwd?: string; provider?: string; model?: string }): Promise<string>; // → externalSessionId
  lookup(dispatchKey: string): Promise<'ALIVE' | 'DEAD' | 'UNKNOWN'>;
}

// Legacy shell-string transport (execSync + ComSpec) denetim 6c ile kaldirildi;
// canli yol tek kapi: makeSafePaseoTransport (paseo-transport.ts, execFileSync arg-array).

// F5.5 fail-closed cwd kontrolu: mutlak yol + var olan dizin. stat hatasi
// (erisim, yarista silinme) kullanilamaz sayilir — sessiz dusme yok.
function isUsableCwd(cwd: string): boolean {
  if (!isAbsolute(cwd)) return false;
  try {
    return existsSync(cwd) && statSync(cwd).isDirectory();
  } catch {
    return false;
  }
}

export class PaseoWorkerAdapter implements WorkerAdapter {
  private probe: ProbeReceipt;
  private transport: Transport;
  private env: NodeJS.ProcessEnv;
  constructor(probe: ProbeReceipt, transport: Transport, env: NodeJS.ProcessEnv = process.env) {
    this.probe = probe;
    this.transport = transport;
    this.env = env;
  }

  async spawn(o: { dispatchKey: string; attemptId: string; prompt: string; cwd?: string; provider?: string; model?: string }): Promise<SpawnResult> {
    const blocked = spawnBlockedReason(this.probe);
    if (blocked) return { outcome: 'FATAL', reason: blocked }; // B02 — kanıtsız deneme yok
    if (this.env.ORDU_LIVE !== '1') return { outcome: 'FATAL', reason: 'live-not-declared: ORDU_LIVE=1 bekleniyor' };
    // F5.5 fail-closed: kapsul repo yolu MUTLAK + VAR OLAN dizin olmali.
    // Gecersizse spawn hic denenmez; sessiz process.cwd() dususu YOK (FATAL,
    // dispatcher rezervasyonu release eder). Cozumleme kurali: goreli repoId
    // icin taban belirsizdir (ordu cwd mi, daemon cwd mi?) — reddedilir.
    if (o.cwd !== undefined && !isUsableCwd(o.cwd)) {
      return { outcome: 'FATAL', reason: 'capsule-repo-invalid: mutlak var olan dizin degil: ' + o.cwd };
    }
    try {
      const sid = await this.transport.spawn(o);
      return { outcome: 'OK', externalSessionId: sid };
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      // yanıt AlINAMADI ise belirsizlik; net "hayır" (auth/400) ise tekrarlanabilir/fatal ayrımı
      if (/timeout|ETIMEDOUT|ENOENT|boş çıktı|ECONN/i.test(msg)) return { outcome: 'UNKNOWN' };
      if (/429|rate|temporar|busy/i.test(msg)) return { outcome: 'RETRYABLE', reason: msg.slice(0, 200) };
      return { outcome: 'FATAL', reason: msg.slice(0, 200) };
    }
  }

  lookup(dispatchKey: string) {
    return this.transport.lookup(dispatchKey); // reconcile her zaman izinli: gözlem zararsızdır
  }
}
