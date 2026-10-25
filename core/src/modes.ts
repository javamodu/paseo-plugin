// K-0006 iş modları: tavanları ÖLÇEKLER, kapıları GEVŞETMEZ (Y6/F3 sabit).
// Mod yalnız 3 alandan okur: parallelFactor / tokenFactor / kademe. Geri kalan her
// şey — dispatch_paused, insan-onayı, evaluator koruma, deneme tavanı — daima TABAN
// değerindedir; bir mod nesnesi bu anahtarları taşısa bile DAMITILIR (okunmaz).
// Bilinmeyen/geçersiz mod → UnknownMode (fail-closed: dispatch yok).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

export type Kademe = 'hizli' | 'derin';

export interface ModeProfile {
  parallelFactor: number;
  tokenFactor: number;
  kademe: Kademe;
}

export interface OrduConfig {
  schemaVersion: number;
  runtime: 'paseo' | 'local';
  mod: string;
  temel: { maxWorkers: number; maxReservedTokens: number };
  guvenlikTavani: { hardMaxWorkers: number };
  modlar: Record<string, ModeProfile>;
  [k: string]: unknown;
}

// Mod bunları taşısa bile RED — güvenlik alanları asla mod-tarafından gelmez.
export const SECURITY_KEYS = [
  'dispatch_paused', 'stopLatch', 'humanApproval', 'evidenceRequired',
  'evaluatorProtected', 'maxAttemptsPerNode',
] as const;

export class UnknownMode extends Error {}

export function loadOrdConfig(
  path = join(dirname(fileURLToPath(import.meta.url)), '..', 'config', 'ordu.json'),
): OrduConfig {
  return JSON.parse(readFileSync(path, 'utf8')) as OrduConfig;
}

export interface EffectiveLimits {
  mod: string;
  kademe: Kademe;
  maxWorkers: number;
  maxReservedTokens: number;
}

export function resolveLimits(cfg: OrduConfig): EffectiveLimits {
  const raw = cfg.modlar[cfg.mod];
  if (!raw) throw new UnknownMode(`bilinmeyen mod: ${String(cfg.mod)} — fail-closed, dispatch yok`);
  // DAMITMA: yalnız izinli 3 alan; SECURITY_KEYS ve başka her alan düşer.
  const parallelFactor = (raw as ModeProfile).parallelFactor;
  const tokenFactor = (raw as ModeProfile).tokenFactor;
  const kademe = (raw as ModeProfile).kademe;
  if (!Number.isFinite(parallelFactor) || parallelFactor <= 0)
    throw new UnknownMode(`mod parallelFactor geçersiz: ${cfg.mod}`);
  if (!Number.isFinite(tokenFactor) || tokenFactor <= 0)
    throw new UnknownMode(`mod tokenFactor geçersiz: ${cfg.mod}`);
  if (kademe !== 'hizli' && kademe !== 'derin')
    throw new UnknownMode(`mod kademe geçersiz: ${cfg.mod}`);
  // Tavanı ölçekle; hardMaxWorkers ASLA aşılamaz (güvenlik tavani, gevşetilemez).
  const maxWorkers = Math.min(
    cfg.guvenlikTavani.hardMaxWorkers,
    Math.max(1, Math.round(cfg.temel.maxWorkers * parallelFactor)),
  );
  const maxReservedTokens = Math.max(1, Math.floor(cfg.temel.maxReservedTokens * tokenFactor));
  return Object.freeze({ mod: cfg.mod, kademe, maxWorkers, maxReservedTokens });
}

// settings tablosunda YALNIZ kapasite hücresine dokunur (max_workers); dispatch_paused
// ve diğer güvenlik sütunlarına DOKUNMAZ. Böylece mod eşiği kaydırır ama kapıyı kapatmaz.
export function applyModeToSettings(db: DatabaseSync, cfg: OrduConfig): EffectiveLimits {
  const eff = resolveLimits(cfg); // UnknownMode burada patlar → çağıran dispatch'i keser
  db.prepare('UPDATE settings SET max_workers=? WHERE id=1').run(eff.maxWorkers);
  return eff;
}
