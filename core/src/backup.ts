// M16 — hermetik yedek/geri-yükleme (host kısıtı: node:sqlite'in backup API'si yok).
// Yöntem: WAL checkpoint (TRUNCATE) → ana DB dosyasının birebir kopyası.
// VACUUM INTO yerine checkpoint+kopya: açık handle'da tutarlı anlık görüntü,
// -wal/-shm taşınmaz, şema+tetikler+user_version aynen korunur.
import { DatabaseSync } from 'node:sqlite';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { openStore } from './store.ts';

export function backupStore(db: DatabaseSync, sourcePath: string, backupPath: string) {
  if (sourcePath === ':memory:') {
    throw new Error('M16: :memory: store için dosya-yedeği alınamaz — dosya-tabanlı openStore gerekir');
  }
  // TRUNCATE: WAL içeriğini ana dosyaya gömer ve wal'ı sıfırlar → tek dosya kopyası yeterli.
  db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
  mkdirSync(dirname(backupPath), { recursive: true });
  copyFileSync(sourcePath, backupPath);
  return { backupPath };
}

// Geri yükleme: yedek dosyayı hedefe kopyala ve idempotent migrasyonlu openStore ile aç.
// user_version=2 damgalı yedekte 001/002 adımları atlanır (sync-baseline bozulmaz).
export function restoreStore(backupPath: string, destPath: string) {
  mkdirSync(dirname(destPath), { recursive: true });
  copyFileSync(backupPath, destPath);
  return openStore(destPath);
}
