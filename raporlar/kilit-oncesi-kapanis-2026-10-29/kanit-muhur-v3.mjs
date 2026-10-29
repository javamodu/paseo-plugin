// RBT-2026-10-28.3: yalnız belge/paket kanıtı — CODEMAP + sağlık + kapanış denetimi; ürün/probe/DB/canlı/commit yok.
// .2 mühür aracının uyarlanmış kopyası. Farklar: kapanis.json ve denetim bu dizinde; bağımsız inceleme
// .2 dizininden okunur (bayt-bayt aynı); sağlık kapısı güncel ölçüt — K-0052 (K-SADE, 2026-10-28 19:41)
// sonrası tek SARI HERMETIC_31 (kural-proxy 80→38 çözüldü; .2'nin 2 SARI + '80 satir' beklentisi bayat).
import { readFileSync, writeFileSync, realpathSync, statSync } from 'node:fs';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '../..');
const dir = relative(root, here).replace(/\\/g, '/') + '/';
const oldDir = 'raporlar/kilit-oncesi-kapanis-2026-10-28/';
const reviewPath = oldDir + 'bagimsiz-inceleme.json';
const digest = (b) => createHash('sha256').update(b).digest('hex');
const readJson = (f) => JSON.parse(readFileSync(f, 'utf8').replace(/^﻿/, ''));
const need = (ok, message) => { if (!ok) throw new Error(message); };
const info = (p) => { const b = readFileSync(resolve(root, p)); return { path: p, sha256: digest(b), bytes: b.length }; };
const save = (p, value) => writeFileSync(resolve(root, p), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });

export function verifyEntries(entries, baseRoot, forbiddenPaths = []) {
  need(Array.isArray(entries) && entries.length > 0, 'empty-or-invalid-manifest');
  const seen = new Set(), realRoot = realpathSync(baseRoot);
  for (const e of entries) {
    need(e && typeof e.path === 'string' && !isAbsolute(e.path) && !e.path.includes('\\') &&
      !e.path.split('/').some((x) => !x || x === '..' || x === '.'), 'unsafe-evidence-path');
    need(!seen.has(e.path) && !forbiddenPaths.includes(e.path), 'duplicate-or-self-reference');
    seen.add(e.path);
    const f = realpathSync(resolve(baseRoot, e.path)), rel = relative(realRoot, f);
    need(rel !== '..' && !rel.startsWith('..' + (process.platform === 'win32' ? '\\' : '/')) && !isAbsolute(rel), 'outside-evidence-root');
    need(statSync(f).isFile(), 'not-evidence-file:' + e.path);
    const b = readFileSync(f);
    need(Number.isInteger(e.bytes) && e.bytes > 0 && e.bytes === b.length && /^[a-f0-9]{64}$/.test(e.sha256) && digest(b) === e.sha256, 'evidence-hash-or-bytes:' + e.path);
  }
  return seen.size;
}

function verifyBundle(receipt) {
  verifyEntries([receipt.evidenceManifest], root);
  const evidence = readJson(resolve(root, receipt.evidenceManifest.path));
  const evidenceCount = verifyEntries(evidence.files, root, [receipt.evidenceManifest.path]);
  const candidate = readJson(resolve(root, receipt.contentManifest.path));
  need(evidence.files.some((e) => JSON.stringify(e) === JSON.stringify(receipt.contentManifest)), 'unbound-content-manifest');
  const contentCount = verifyEntries(candidate.content, root, [receipt.contentManifest.path]);
  const state = readJson(resolve(root, dir + 'kapanis.json'));
  need(info(dir + 'kapanis.json').sha256 === info(receipt.stateSnapshot).sha256, 'state-snapshot-drift');
  need(state.permissions.finalHumanAcceptance === null && state.permissions.commitTagPushAuthorized === false &&
    state.permissions.productExecutionAuthorized === false && state.candidate.humanDecision === null, 'human-or-product-gate-opened');
  need(state.warnings.every((w) => w.humanAcceptedForFinalLock === false), 'warning-human-acceptance-fabricated');
  need(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim() === candidate.baseHead, 'HEAD-drift');
  return { evidenceCount, contentCount, stateSnapshotMatches: true, hashesMatch: true };
}

function seal() {
  const at = new Date().toISOString(), stamp = at.replace(/[^0-9]/g, '');
  const commands = [];
  const run = (id, executable, args, timeout = 120000) => {
    const r = spawnSync(executable, args, { cwd: root, encoding: 'utf8', timeout, windowsHide: true });
    const log = dir + id + '-' + stamp + '.log';
    writeFileSync(resolve(root, log), (r.stdout ?? '') + (r.stderr ? '\nSTDERR:\n' + r.stderr : ''), { flag: 'wx' });
    commands.push({ id, executable, args, cwd: '.', exitCode: r.status, output: info(log) });
    need(!r.error && r.status === 0, 'command-failed:' + id + ':' + log);
    return r.stdout;
  };
  run('kanit-test', process.execPath, ['--test', '--test-reporter=spec', dir + 'kanit-muhur.test.mjs']);
  run('codemap', 'powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', "$ErrorActionPreference = 'Stop'; & .\\scripts\\codemap.ps1"]);
  const healthOutput = run('saglik', 'powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'scripts/saglik.ps1']);
  const counts = healthOutput.match(/SONUC:\s*(\d+) OK,\s*(\d+) EKSIK,\s*(\d+) SARI/);
  need(counts && Number(counts[2]) === 0, 'health-counts-or-missing');
  // K-0052 sonrası ölçüt: 0 EKSIK + tek SARI HERMETIC_31 + sayaç 38 (< 40 hedef).
  need(Number(counts[3]) === 1 && /31 GECTI_HERMETIC/.test(healthOutput) && /38 satir/.test(healthOutput), 'unexpected-warning-set-requires-triage');
  const healthPath = dir + 'saglik-' + stamp + '.json';
  save(healthPath, { schemaSurum: 1, at, ok: Number(counts[1]), missing: Number(counts[2]), warnings: Number(counts[3]),
    warningIds: ['HERMETIC_31'], humanAcceptedForFinalLock: false, commands: [...commands], codemap: info('CODEMAP.md') });
  const output = run('kapanis-denetimi', process.execPath, [dir + 'dogrula-kapanis-v3.mjs']);
  const validation = JSON.parse(output), validationPath = validation.report;
  need(validation.passed && validation.reviewFollowup01.passed && validation.packageTests.passed === 27, 'validation-not-complete');
  verifyEntries([info(validationPath), { path: validation.contentManifest, sha256: validation.contentManifestHash,
    bytes: statSync(resolve(root, validation.contentManifest)).size }], root);

  const statePath = dir + 'kapanis.json', before = readFileSync(resolve(root, statePath));
  const previousPath = dir + 'durum-oncesi-' + stamp + '.json';
  writeFileSync(resolve(root, previousPath), before, { flag: 'wx' });
  const state = readJson(resolve(root, statePath));
  const evidencePath = dir + 'kanit-manifesti-' + stamp + '.json';
  const receiptPath = dir + 'muhur-' + stamp + '.json', snapshotPath = dir + 'durum-' + stamp + '.json';
  state.updatedAt = new Date().toISOString();
  state.previousState = info(previousPath);
  const b4 = state.effectiveSteps.find((s) => s.id === 'RBT/B4');
  b4.state = 'TECHNICAL_VALIDATION_RECORDED_WARNING_DECISIONS_PENDING';
  b4.evidence = [validationPath, healthPath, reviewPath, evidencePath];
  b4.meaning = 'Otomatik belge/paket kontrolleri tazelendi (.3: taze baseline + uyarlanmış denetim); .2 şartlı inceleme değişmeden devralındı. 0 EKSİK; tek SARI HERMETIC_31 (RULE_PROXY_80, K-0052 insan kararıyla çözüldü); B4 bütünüyle kabul edilmiş veya B5 geçmiş değildir.';
  state.candidate = { ...state.candidate, state: 'CONTENT_ADDRESSED_CANDIDATE_READY_FOR_HUMAN_REVIEW_NOT_LOCKED',
    contentManifest: info(validation.contentManifest), validation: info(validationPath), health: info(healthPath),
    independentReview: info(reviewPath), evidenceManifest: evidencePath, sealingReceipt: receiptPath,
    stateSnapshot: snapshotPath, noSelfHashCycle: true };
  state.reviewFollowups = [
    { id: 'REVIEW-01', state: 'VERIFIED_BY_MAIN_AGENT_AUTOMATION', evidence: validationPath },
    { id: 'REVIEW-02', state: 'HASH_BOUND_BY_MAIN_AGENT_AUTOMATION', evidence: evidencePath }
  ];
  state.finalB4Accepted = false;
  const status = execFileSync('git', ['status', '--porcelain=v1', '-uall'], { cwd: root, encoding: 'utf8' });
  const lines = status.split(/\r?\n/).filter(Boolean);
  const ownershipPath = dir + 'sahiplik-' + stamp + '.json';
  save(ownershipPath, { schemaSurum: 1, at: new Date().toISOString(), scope: 'pre-seal-git-status-snapshot-not-clean-tree',
    head: validation.head, tracked: execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean).length,
    modifiedTracked: lines.filter((l) => !l.startsWith('??')).length, untracked: lines.filter((l) => l.startsWith('??')).length,
    staged: lines.filter((l) => l[0] !== ' ' && l[0] !== '?').length, porcelain: lines,
    outsideScopeChangesPreserved: state.ownership.outsideScopeChangesPreserved, repoCleanClaimed: false,
    noStageCommitTagPush: true });
  const text = before.toString('utf8'), nl = text.includes('\r\n') ? '\r\n' : '\n';
  const stateBytes = Buffer.from((text.startsWith('﻿') ? '﻿' : '') + (JSON.stringify(state, null, 2) + '\n').replace(/\n/g, nl));
  writeFileSync(resolve(root, snapshotPath), stateBytes, { flag: 'wx' });
  writeFileSync(resolve(root, statePath), stateBytes);
  const paths = [...new Set([validation.contentManifest, validationPath, state.baseline, previousPath, statePath, snapshotPath,
    ownershipPath, healthPath, oldDir + 'BAGIMSIZ-INCELEME.md', reviewPath,
    ...commands.map((c) => c.output.path), ...validation.executions.map((c) => c.log)])].sort();
  save(evidencePath, { schemaSurum: 1, kind: 'acyclic-hash-bound-document-evidence-not-B5', at: new Date().toISOString(),
    contentManifest: validation.contentManifest, stateSnapshot: snapshotPath, files: paths.map(info),
    selfHashIncluded: false, humanAcceptance: null, productRelease: false, commands,
    reviewFollowups: state.reviewFollowups, independentRetestClaimed: false });
  const receipt = { schemaSurum: 1, kind: 'evidence-hash-verification-not-human-acceptance', at: new Date().toISOString(),
    evidenceManifest: info(evidencePath), contentManifest: info(validation.contentManifest), stateSnapshot: snapshotPath,
    finalB4Accepted: false, finalB5Accepted: false, commitTagPushRun: false };
  const verification = verifyBundle(receipt);
  const whitespace = spawnSync('git', ['diff', '--check'], { cwd: root, encoding: 'utf8' });
  need(whitespace.status === 0, 'final-whitespace');
  save(receiptPath, { ...receipt, verification, whitespacePassed: true });
  console.log(JSON.stringify({ receipt: receiptPath, evidenceManifest: info(evidencePath), validation: validationPath,
    health: healthPath, ownership: ownershipPath, ...verification, healthCounts: { ok: Number(counts[1]), missing: 0, warnings: 1 },
    finalB4Accepted: false, finalB5Accepted: false, productExecutionStarted: false, commitTagPushRun: false }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--check') {
    const receiptPath = process.argv[3];
    need(typeof receiptPath === 'string' && receiptPath.startsWith(dir + 'muhur-'), 'receipt-path-required');
    console.log(JSON.stringify({ receipt: receiptPath, ...verifyBundle(readJson(resolve(root, receiptPath))) }, null, 2));
  } else {
    need(process.argv.length === 2, 'usage: node kanit-muhur-v3.mjs [--check receipt-path]');
    seal();
  }
}
