// F6.5 (ADR-F65) — kapali provider registry + deterministik cozum zinciri.
// provider = vendor adi (or. 'codex'), model = o provider'in model kimligi (or. 'kimi-K3').
// Spawn aninda Paseo CLI bicimi 'provider/model' birlesimiyle uretilir (model NULL ise
// provider tek basina = provider'in kendi varsayilani). Serbest metin YASAK (K-0033 supabi):
// bilinmeyen provider/model fail-closed RED. Registry bakimi bilincli kod degisikligidir.

import { GateError } from './store.ts';

export const PROVIDER_REGISTRY: Readonly<Record<string, readonly string[]>> = Object.freeze({
  // glm-5.3 (SAVAS START 2026-10-26): kimi-K3 canli API'de RED — codex kartinin
  // servisi model_not_allowed dondu ("Only glm-5.3 or codefastglm53unlimited"),
  // request_id a50638f90f0c66c7 (kanit: raporlar/kanit-hedef/m02-savas-spawn-2026-10-26.md).
  // kimi-K3 listede KALIR (kart degisirse geri doner); glm-5.3 canli olculmus modeldir.
  codex: Object.freeze(['kimi-K3', 'gpt-5.4', 'glm-5.3']),
});

export const DEFAULT_PROVIDER = 'codex';
export const DEFAULT_MODEL = 'kimi-K3';

export interface ProviderModel { provider: string; model: string | null }

// Derleme kapisi (createRunPlan): model dolu + provider NULL = RED (model tek basina anlamsiz);
// provider/model registry disinda = RED. NULL/NULL kabul (manager'a birak).
export function assertProviderModel(provider: string | null | undefined, model: string | null | undefined): void {
  if ((model ?? null) !== null && (provider ?? null) === null) {
    throw new GateError('F6.5 RED: model tek basina anlamsiz — provider gerekli');
  }
  if ((provider ?? null) !== null) {
    const models = PROVIDER_REGISTRY[provider!];
    if (!models) throw new GateError('F6.5 RED: registry-disi provider: ' + provider);
    if ((model ?? null) !== null && !models.includes(model!)) {
      throw new GateError('F6.5 RED: registry-disi model: ' + provider + '/' + model);
    }
  }
}

export type ResolveResult = { ok: true } & ProviderModel | { ok: false; reason: string };

// Dispatch kapisi (Y1: LLM cagrisi YOK, saf fonksiyon). Oncelik zinciri:
//   node.provider/model  →  ORDU_PROVIDER env (parse: 'vendor/model')  →  kod-varsayilani.
// Env registry disindaysa ok:false (dispatcher FATAL'a cevirir — sessiz dusus yok).
export function resolveProviderModel(
  node: { provider?: string | null; model?: string | null },
  env: NodeJS.ProcessEnv = process.env,
): ResolveResult {
  if ((node.provider ?? null) !== null) {
    try {
      assertProviderModel(node.provider, node.model);
    } catch (e: any) {
      return { ok: false, reason: e.message };
    }
    return { ok: true, provider: node.provider!, model: node.model ?? null };
  }
  if ((node.model ?? null) !== null) {
    return { ok: false, reason: 'F6.5 RED: node model dolu ama provider NULL' };
  }
  const raw = env.ORDU_PROVIDER;
  if (raw !== undefined && raw !== '') {
    const slash = raw.indexOf('/');
    const provider = slash >= 0 ? raw.slice(0, slash) : raw;
    const model = slash >= 0 ? raw.slice(slash + 1) || null : null;
    try {
      assertProviderModel(provider, model);
    } catch (e: any) {
      return { ok: false, reason: e.message };
    }
    return { ok: true, provider, model };
  }
  return { ok: true, provider: DEFAULT_PROVIDER, model: DEFAULT_MODEL };
}

// Spawn arg bicimi: 'provider/model'; model NULL ise provider tek basina.
export function providerArgOf(pm: ProviderModel): string {
  return pm.model ? pm.provider + '/' + pm.model : pm.provider;
}
