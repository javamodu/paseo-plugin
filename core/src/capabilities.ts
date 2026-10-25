// B02 kapısı: probe receipt'i DOĞRULANmadan tek worker spawn edilmez (fail-closed).
// Receipt bağımsız doğrulanır: canonical sha256 + tazelik + blokaj listesi boş mu.
import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const canonical = (v: unknown): string =>
  v === null || typeof v !== 'object'
    ? JSON.stringify(v)
    : Array.isArray(v)
      ? '[' + v.map(canonical).join(',') + ']'
      : '{' + Object.keys(v as object).sort().map((k) => JSON.stringify(k) + ':' + canonical((v as any)[k])).join(',') + '}';

export interface ProbeReceipt {
  probe: string; schemaVersion: number; generatedAt: string; node: string;
  capabilities: Record<string, boolean>; blocked: string[]; probeReceiptHash: string;
  [k: string]: unknown;
}

// M26 (izin/symlink): receipt yolu symlink/junction uzerinden BASKA bir dosyaya
// sapıyorsa RED — guven capasi yalniz gercek yoldan okunur. Windows'ta yalniz-case
// farklari kacak degildir (case-insensitive FS); realpath karsilastirmasi normalize edilir.
const normPath = (p: string) => (process.platform === 'win32' ? p.replace(/\//g, '\\').toLowerCase() : p);

export function loadVerifiedProbe(path: string, opts: { maxAgeHours?: number; now?: () => Date } = {}): ProbeReceipt {
  const real = realpathSync(path);
  if (normPath(real) !== normPath(resolve(path))) {
    throw new Error('probe receipt yolu symlink/junction KACAGI — gercek yol sart (M26), spawn YOK');
  }
  const raw = readFileSync(real, 'utf8');
  const receipt = JSON.parse(raw) as ProbeReceipt;
  const claimed = receipt.probeReceiptHash;
  const copy: any = { ...receipt };
  delete copy.probeReceiptHash;
  const computed = createHash('sha256').update(canonical(copy)).digest('hex');
  if (computed !== claimed) throw new Error('probe receipt hash UYUŞMUYOR — kanıt güvenilmez, spawn YOK');
  if (receipt.probe !== 'ordu-v3/B00' || receipt.schemaVersion !== 1) throw new Error('probe şeması/türü bilinmeyen');
  const ageH = ((opts.now?.() ?? new Date()).getTime() - Date.parse(receipt.generatedAt)) / 3.6e6;
  if (!(ageH >= 0) || ageH > (opts.maxAgeHours ?? 24)) throw new Error('probe receipt BAYAT — yeniden probe koş, spawn YOK');
  for (const [k, v] of Object.entries(receipt.capabilities)) {
    if (typeof v !== 'boolean') throw new Error(`capability ${k} boolean değil (fail-closed)`);
  }
  // tutarlılık: blocked listesi, false yeteneklerin TAMAMI olmalı — "bilinmiyor" kazandıramaz
  const falseCaps = Object.entries(receipt.capabilities).filter(([, v]) => !v).map(([k]) => k).sort();
  const blocked = [...receipt.blocked].sort();
  if (JSON.stringify(falseCaps) !== JSON.stringify(blocked)) throw new Error('probe iç tutarsız: blocked ≠ false yetenekler');
  return receipt;
}

export function spawnBlockedReason(receipt: ProbeReceipt): string | null {
  return receipt.blocked.length > 0 ? 'capability-blocked: ' + receipt.blocked.join(',') : null;
}
