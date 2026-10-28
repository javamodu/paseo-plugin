// spawn-olcum.ts — v9 V9-03 (2026-10-28): spawn maliyeti ölçüm kanalı.
// Kaynak: raporlar/gelen-kutu/v9-kalite-koruyucu-hiz-2026-10-28.md — V8-06 (spawn ekonomisi)
// DEĞERLENDİRİLEMEZ çünkü ölçümsüz varsayımdı: önce N koşum verisi birikir, sonra karar (ölç-sonra-karar).
// Desen: gece.jsonl (defter.ts jsonlEkle — fsync'li append; crash'te yarım satır yalnız son satır olabilir).
// core/data/spawn-olcum.jsonl ÜRETİM DEFTERİDİR — COMMIT EDİLMEZ (scripts/yasak-liste.json deseni).
import { fileURLToPath } from 'node:url';
import { jsonlEkle } from './defter.ts';

// gozetimsiz.ts KANIT_DEFTERI_YOLU deseni: module-göreli sabit yol (cwd'den bağımsız deterministik).
export const SPAWN_OLCUM_DEFTERI_YOLU = fileURLToPath(new URL('../data/spawn-olcum.jsonl', import.meta.url));

export interface SpawnOlcumKayit {
  event: 'spawn-olcum';
  at: string;          // ISO anlık (dispatcher'ın now() saati — test enjeksiyonuyla deterministik)
  attemptId: string;
  provider: string;    // F6.5: dispatcher'da ÇÖZÜLMÜŞ provider iner
  model?: string;
  outcome: string;     // adapter.spawn dönen SpawnResult.outcome (OK/RETRYABLE/UNKNOWN/FATAL)
  sureMs: number;      // adapter.spawn çağrısının duvar süresi (performance.now tabanlı)
}

export function spawnOlcumKaydet(defterYolu: string, k: Omit<SpawnOlcumKayit, 'event'>): void {
  const kayit: SpawnOlcumKayit = { event: 'spawn-olcum', ...k };
  jsonlEkle(defterYolu, kayit);
}
