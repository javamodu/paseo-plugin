// Korunan evaluator (A11/A13 runtime tarafı). Üç demir kural:
// 1) Çalışan komut plan'da DONMUŞ allowlist'ten gelir — model metni ASLA yürütülmez.
// 2) PASS için exit-0 YETMEZ: protocol stdout {tests,failed} şart; tests=0 → FAIL (A13).
// 3) Kanıt yalnız DONMUŞ adaya ve GÜNCEL fence ile yazılır (store.recordEvidence).
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { GateError, recordEvidence } from './store.ts';

export interface RunResult { exitCode: number; stdout: string }
export type CommandRunner = (cmd: string, cwd: string) => Promise<RunResult>;

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export function allowedCommandsFromPlan(db: DatabaseSync, attemptId: string): string[] {
  const row = db.prepare(
    `SELECT p.payload_json FROM attempts a JOIN runs r ON r.id=a.run_id JOIN plans p ON p.id=r.plan_id WHERE a.id=?`,
  ).get(attemptId) as any;
  if (!row) throw new GateError('plan bulunamadı — evaluator komutu çözülemez');
  const payload = JSON.parse(row.payload_json);
  if (!Array.isArray(payload.allowedCommands) || payload.allowedCommands.length === 0) {
    throw new GateError('planda donmus allowedCommands YOK — evaluator reddedilir (A11)');
  }
  return payload.allowedCommands;
}

export async function evaluateAttempt(
  db: DatabaseSync,
  o: {
    attemptId: string; presentedFence: number; candidateHash: string;
    testCmd: string; repoDir: string; runner: CommandRunner;
    evidenceDir: string; actorId: string;
  },
) {
  const allow = allowedCommandsFromPlan(db, o.attemptId);
  if (!allow.includes(o.testCmd)) throw new GateError('evaluator komutu allowlist dışı — yürütülmez (M19: model metni koşmaz)');

  let run: RunResult;
  try {
    run = await o.runner(o.testCmd, o.repoDir);
  } catch (err: any) {
    run = { exitCode: 1, stdout: 'RUNNER_ERROR ' + String(err?.message ?? err) };
  }

  // protocol: stdout'un SON geçerli JSON satırı {"tests":N,"failed":M}
  let tests = 0, failed = 1, parsed = false;
  for (const line of run.stdout.split(/\r?\n/).reverse()) {
    try {
      const j = JSON.parse(line);
      if (Number.isInteger(j.tests) && Number.isInteger(j.failed) && j.tests >= 0 && j.failed >= 0) {
        tests = j.tests; failed = j.failed; parsed = true; break;
      }
    } catch { /* sonraki satır */ }
  }

  // A13 çekirdek kuralı: PASS = exit-0 VE protokole göre testler var VE hepsi geçti
  const verdict: 'PASS' | 'FAIL' = run.exitCode === 0 && parsed && tests > 0 && failed === 0 ? 'PASS' : 'FAIL';

  mkdirSync(o.evidenceDir, { recursive: true });
  const storageRef = join(o.evidenceDir, o.attemptId + '.log');
  writeEvidenceLog(storageRef, o.testCmd, run, verdict);
  const artifactHash = sha256(readFileSync(storageRef, 'utf8'));

  const evId = recordEvidence(db, {
    attemptId: o.attemptId, presentedFence: o.presentedFence,
    artifactHash, storageRef, bytes: Buffer.byteLength(run.stdout),
    environmentHash: sha256(process.platform + '|' + process.version),
    evaluatorHash: sha256('ordu-core/evaluator.ts@S1|' + o.testCmd),
    exitCode: run.exitCode, verdict, testCount: verdict === 'PASS' ? tests : (parsed ? tests : 0),
    actorId: o.actorId,
  });
  return { verdict, tests, protocolParsed: parsed, evidenceId: evId.evidenceId, storageRef };
}

function writeEvidenceLog(ref: string, cmd: string, run: RunResult, verdict: string) {
  // append-only kanıt kopyası; secret redaksiyonu S2 API yüzeyinde (burada girdi kendi fixture'ımız)
  appendFileSync(ref, `# ordu evaluator log — verdict=${verdict} cmd=${cmd} exit=${run.exitCode}\n${run.stdout}\n`);
}
