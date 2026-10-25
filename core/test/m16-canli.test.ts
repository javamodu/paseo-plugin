// M16 (disk canlı bacağı) + V3-S3.2 (yedekten dönüş canlı) — FAZ-3 K2; triyaj
// raporlar/faz3-triyaj-2026-10-25.md. Hermetik kol (m16-m03.test.ts) backup→sil→restore
// birebirliğini KANITLADI; buradaki canlı eksi: yedek, GERÇEK çökmüş bir store'dan
// alınır. GERÇEK writer süreci (ayrı node çocuğu) gerçek disk yazmalarını yapar ve
// kapatılmadan SIGKILL ile ÇÖKERTİLİR (temiz kapanış/checkpoint YOK — veri WAL'da
// asılı kalır). Sonra: WAL checkpoint TRUNCATE yedeği → restore → çöken yazıcının
// satırları BİREBİR geri gelir + şema/user_version korunur + kapılar canlı.
// V3-S3.2'nin raporu: raporlar/fault-matrix-2026-10-25.md (hata enjeksiyonu matrisi —
// her satır bugünkü gerçek koşum kanıtına bağlanır; bu test matrisin yedek satırıdır).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore, setGlobalStop } from '../src/store.ts';
import { backupStore, restoreStore } from '../src/backup.ts';

const H64 = (c: string) => c.repeat(64).slice(0, 64);
const root = join(fileURLToPath(import.meta.url), '..', '..');

const waitExit = (c: ChildProcess) => new Promise<void>((res) => {
  if (c.exitCode !== null || c.signalCode !== null) return res();
  c.once('exit', () => res());
});

const YAZICI_KAYNAGI = [
  "const mod = await import(process.argv[2]);",
  "const openStore = mod.openStore;",
  "const db = openStore(process.argv[3]);",
  "const { writeFileSync } = await import('node:fs');",
  "for (let i = 1; i <= 5; i++) {",
  "  db.prepare('INSERT INTO capsules(id,goal,repo_id,source_commit) VALUES(?,?,?,?)')",
  "    .run('crash-cap-' + i, 'gercek yazi ' + i, 'repo', String(i).repeat(64).slice(0, 64));",
  "}",
  "writeFileSync(process.argv[4], 'yazildi');",
  "setInterval(function(){}, 1073741824);",
].join('\n');

test('M16+V3-S3.2 canlı: GERÇEK writer süreci SIGKILL ile çöker → WAL-checkpoint yedeği → restore → veri birebir + kapılar canlı', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'ordu-m16-'));
  const dbPath = join(dir, 'ordu.sqlite');
  const yaziciScript = join(dir, 'yazici.mjs');
  const isaret = join(dir, 'yazildi.txt');
  writeFileSync(yaziciScript, YAZICI_KAYNAGI, 'utf8');

  // 1) GERÇEK writer: AYRI süreç, gerçek disk yazmaları (WAL'da asılı — kapanmayacak)
  const yaziUrl = 'file:///' + join(root, 'src', 'store.ts').replace(/\\/g, '/');
  const yazici = spawn(process.execPath, [yaziciScript, yaziUrl, dbPath, isaret], { stdio: 'ignore' });
  t.after(() => { try { yazici.kill('SIGKILL'); } catch { /* zaten olabilir */ } });
  const t0 = Date.now();
  while (!existsSync(isaret)) {
    if (Date.now() - t0 > 15000) throw new Error('yazici isareti 15sn icinde gelmedi');
    await new Promise((r) => setTimeout(r, 50));
  }
  assert.equal(yazici.exitCode, null, 'yazici hala acik (temiz kapanis YOK)');

  // 2) GERÇEK çökme: SIGKILL — checkpoint/kapanış şansı YOK; veri WAL'da asılı kalır
  yazici.kill('SIGKILL');
  await waitExit(yazici);
  assert.ok(yazici.exitCode !== null || yazici.signalCode !== null, 'yazici süreci kapandi (crash)');
  await new Promise((r) => setTimeout(r, 200)); // DERSLER 165: OS tanıtıcı-bırakma penceresi

  // 3) çökmüş store'dan YEDEK: openStore busy-retry + WAL checkpoint TRUNCATE + kopya
  let db: ReturnType<typeof openStore> | null = null;
  for (let i = 0; i < 20 && db === null; i++) {
    try { db = openStore(dbPath); } catch (e) { if (i === 19) throw e; await new Promise((r) => setTimeout(r, 100)); }
  }
  t.after(() => { (db as any)?.close(); });
  const yedek = join(dir, 'yedek.sqlite');
  const b = backupStore(db as any, dbPath, yedek);
  assert.equal(b.backupPath, yedek);
  assert.ok(existsSync(yedek), 'yedek dosyasi diskte');

  // 4) RESTORE: yedekten yeni eve → çöken yazıcının 5 satırı BİREBİR döner
  const donusYolu = join(dir, 'donus.sqlite');
  const db2 = restoreStore(yedek, donusYolu);
  const satirlar = db2.prepare('SELECT id,goal,source_commit FROM capsules ORDER BY id').all() as any[];
  assert.equal(satirlar.length, 5, 'coken yazicinin 5 satiri yedekten BİREBİR dondu');
  assert.equal(satirlar[0].id, 'crash-cap-1');
  assert.equal(satirlar[4].id, 'crash-cap-5');
  assert.equal(satirlar[2].source_commit, '3'.repeat(64).slice(0, 64), 'kaynak-hash birebir');
  assert.equal((db2.prepare('PRAGMA user_version').get() as any).user_version, 4, 'sema surumu korunur (v4)');

  // 5) kapılar restore sonrası CANLI: global-stop geçişi olay yazar (tetik + defter yaşar)
  const oncesi = (db2.prepare('SELECT COUNT(*) c FROM events').get() as any).c;
  setGlobalStop(db2, true, 'test', 'm16-canli');
  setGlobalStop(db2, false, 'test', 'm16-canli');
  const sonrasi = (db2.prepare('SELECT COUNT(*) c FROM events').get() as any).c;
  assert.equal(sonrasi, oncesi + 2, 'restore-edilmis defterde kapilar canli (2 olay yazdi)');
  db2.close();

  console.log('KANIT M16/V3-S3.2: gercek yazici (ayri surec) 5 satir yazdi → SIGKILL ile COKTU (temiz kapanis yok) → WAL-checkpoint yedek → restore → 5 satir birebir + user_version=4 + kapilar canli; fault-matrix raporu raporlar/fault-matrix-2026-10-25.md');
});
