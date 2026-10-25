// CLI 'evaluate' fiili — canlı demo kapanış zincirinin evaluator halkası.
// Deterministik DOSYA değerlendiricisi: worker'ın ürettiği artifact'i core okur,
// kontrolleri KENDİSİ çalıştırır (worker beyanına güven yok):
//   1) dosya var + okunabilir
//   2) boş değil
//   3) --expect verildiyse içerik alt-dizeyi içerir
// Sonuç zinciri mevcut kapılardan geçer: commitCandidate (A36 fence) →
// recordEvidence (donmuş aday şartı) → settleNodeOutcome (A10: PASS→ACCEPTED).
// evaluatorHash: bu modülün kaynak metninin sha256'sı — evaluator kimliği
// receipt'te koda bağlıdır, taklit edilemez beyan değildir.
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DatabaseSync } from 'node:sqlite';
import { commitCandidate, recordEvidence } from './store.ts';
import { settleNodeOutcome } from './supervisor.ts';

const sha256 = (buf: Buffer | string) => createHash('sha256').update(buf).digest('hex');
const selfHash = () => sha256(readFileSync(fileURLToPath(import.meta.url)));

export function evaluateArtifact(
  db: DatabaseSync,
  o: { attemptId: string; artifactPath: string; expect?: string; actorId: string; artifactsDir?: string },
) {
  const a = db.prepare('SELECT id,run_id,state,fencing_token FROM attempts WHERE id=?').get(o.attemptId) as any;
  if (!a) throw new Error('attempt yok: ' + o.attemptId);
  if (a.state !== 'RUNNING') throw new Error('evaluate reddedildi: attempt RUNNING değil (state=' + a.state + ') — kör değerlendirme yok');

  const abs = resolve(o.artifactPath);
  const checks: { ad: string; gecti: boolean }[] = [];
  let content: Buffer | null = null;
  try {
    content = readFileSync(abs);
    checks.push({ ad: 'dosya-var', gecti: true });
  } catch {
    checks.push({ ad: 'dosya-var', gecti: false });
  }
  if (content) {
    checks.push({ ad: 'bos-degil', gecti: content.length > 0 });
    if (o.expect !== undefined) checks.push({ ad: 'icerik-beklenti', gecti: content.toString('utf8').includes(o.expect) });
  }
  const verdict: 'PASS' | 'FAIL' = checks.every((c) => c.gecti) ? 'PASS' : 'FAIL';
  const exitCode = verdict === 'PASS' ? 0 : 1;

  // donmuş aday = üretilen dosyanın birebir bayt özeti (değişmez candidate)
  const candidateHash = content ? sha256(content) : '0'.repeat(64);
  const report = {
    evaluator: 'cli-dosya-v1',
    attemptId: o.attemptId,
    artifactPath: abs,
    checks,
    verdict,
    exitCode,
    at: new Date().toISOString(),
  };
  const artifactHash = sha256(JSON.stringify(report));
  const dir = o.artifactsDir ?? join('veri', 'artifacts');
  mkdirSync(dir, { recursive: true });
  const storageRef = join(dir, artifactHash + '.json');
  writeFileSync(storageRef, JSON.stringify(report, null, 2));

  if (content) commitCandidate(db, o.attemptId, a.fencing_token, candidateHash, o.actorId);
  else throw new Error('evaluate reddedildi: artifact okunamadı — donmuş aday üretilemez (FAIL kanıtı için bile içerik gerekmez ama zincir aday ister)');

  const ev = recordEvidence(db, {
    attemptId: o.attemptId,
    presentedFence: a.fencing_token,
    artifactHash,
    storageRef,
    bytes: Buffer.byteLength(JSON.stringify(report)),
    environmentHash: sha256(process.platform + '|' + process.version),
    evaluatorHash: selfHash(),
    exitCode,
    verdict,
    testCount: checks.length,
    actorId: o.actorId,
  });
  const settled = settleNodeOutcome(db, o.attemptId, verdict);
  return { verdict, exitCode, checks, candidateHash, artifactHash, evidenceId: (ev as any)?.evidenceId ?? null, settled };
}