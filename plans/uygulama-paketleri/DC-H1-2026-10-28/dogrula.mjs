// Yalnız görev paketi / sonuç kaydı denetçisi. Ürün modülü, DB veya komut çalıştırmaz.
import { readFileSync, existsSync, statSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const packageDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(packageDir, '../../..');
export const readJson = (p) => JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const parts = ['source', 'tests', 'pilotSource', 'pilotTests'];
const safePath = (p) => typeof p === 'string' && p.length > 0 &&
  !isAbsolute(p) && !/^[A-Za-z]:|\\|[?*\x00-\x1f]/.test(p) &&
  !p.split('/').includes('..') && !p.endsWith('/');
const dbOrRuntime = (p) => /^core\/(data|veri)\//.test(p) || /\.(sqlite|db)(-|$)/.test(p);
const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

export function validatePackage(p, root = repoRoot) {
  const errors = [];
  const need = (ok, msg) => { if (!ok) errors.push(msg); };
  need(p?.schemaSurum === 1, 'schema');
  need(p?.authoringOnly === true && p?.executionAuthorized === false && p?.budgetApproved === false, 'authority-expanded');
  need(p?.runtimeEnforcementClaimed === false, 'runtime-enforcement-claim');
  need(p?.productPlanVersion === 'v2.10.1' && p?.productGraphVersion === 'v14', 'product-version-changed');
  need(p?.common?.status === 'NOT_STARTED' && p?.common?.authorizationRecord === null &&
    p?.common?.assignedAgentId === null && p?.common?.sourceSnapshot === null, 'implicit-task-release');
  need(p?.common?.maxExistingFilesPerTask === 3 && p?.common?.writerParallelism === 1, 'ownership-policy');
  for (const k of ['commitTagMergeDeployAllowed', 'productionDbAccessAllowed', 'providerCallsAllowed', 'operatorOrEvaluatorSecretsAllowed', 'taskPassIsSprintPass', 'taskPassIsHumanGateAcceptance']) {
    need(p?.common?.[k] === false, 'unsafe-common:' + k);
  }
  need(p?.common?.budgetT?.approved === false, 'budget-implicitly-approved');
  need(p?.designBindings?.writeSetsConfirmed === false, 'design-implicitly-confirmed');
  const gates = new Set((p?.gates ?? []).map((g) => g.id));
  need(gates.size === (p?.gates ?? []).length, 'duplicate-gate');
  for (const g of p?.gates ?? []) need(g.decision === null && !!g.scope, 'gate-not-closed:' + g.id);
  const recipes = new Map((p?.recipes ?? []).map((r) => [r.id, r]));
  for (const r of recipes.values()) {
    need(!!r.cwd && !!r.effect && !!(r.command || r.commandPattern), 'recipe-incomplete:' + r.id);
    for (const g of r.gates ?? []) need(gates.has(g), 'unknown-recipe-gate:' + g);
  }
  const tasks = Array.isArray(p?.tasks) ? p.tasks : [];
  const byId = new Map(tasks.map((t) => [t.id, t]));
  need(byId.size === tasks.length, 'duplicate-task-id');
  need(tasks.length === 26, 'task-count');
  const ancestors = (id, stack = new Set()) => {
    if (stack.has(id)) { errors.push('cycle:' + id); return new Set(); }
    const task = byId.get(id);
    if (!task) { errors.push('unknown-dependency:' + id); return new Set(); }
    const all = new Set();
    for (const dep of task.dependsOn ?? []) {
      all.add(dep);
      for (const a of ancestors(dep, new Set([...stack, id]))) all.add(a);
    }
    return all;
  };
  const ancestorSets = new Map(tasks.map((t) => [t.id, ancestors(t.id)]));
  const componentPrefixes = /^(core|plugin|pano|scripts)\//;
  for (const t of tasks) {
    for (const key of ['id', 'sprint', 'stage', 'title', 'goal', 'readiness', 'output']) need(typeof t[key] === 'string' && t[key].length > 0, 'missing-field:' + t.id + ':' + key);
    for (const key of ['dependsOn', 'gates', 'readFiles', 'writeExisting', 'writeNew', 'pilotWrite', 'positive', 'negative', 'fullRegression', 'designQuestions']) need(Array.isArray(t[key]), 'missing-list:' + t.id + ':' + key);
    need(t.positive?.length > 0 && t.negative?.length > 0, 'missing-positive-negative:' + t.id);
    need((t.writeExisting?.length ?? 99) <= 3, 'existing-file-limit:' + t.id);
    // Pilot dosyaları gerçek kök bağlanana kadar adaydır; aynı işte muhafazakâr toplam sınırı.
    const pilotExistingUpper = t.stage === 'S4' && t.id !== 'DC-S4-01' ? (t.pilotWrite ?? []).length : 0;
    need((t.writeExisting?.length ?? 99) + pilotExistingUpper <= 3, 'cross-repo-existing-file-limit:' + t.id);
    for (const g of t.gates ?? []) need(gates.has(g), 'unknown-gate:' + t.id + ':' + g);
    for (const r of t.recipes ?? []) need(recipes.has(r), 'unknown-recipe:' + t.id + ':' + r);
    const writes = [...(t.writeExisting ?? []), ...(t.writeNew ?? [])];
    need(new Set(writes).size === writes.length, 'duplicate-write:' + t.id);
    for (const f of [...(t.readFiles ?? []), ...writes, ...(t.pilotWrite ?? [])]) {
      need(safePath(f), 'unsafe-path:' + t.id + ':' + f);
      need(!dbOrRuntime(f), 'runtime-path:' + t.id + ':' + f);
    }
    for (const f of [...(t.readFiles ?? []), ...(t.writeExisting ?? [])]) need(existsSync(resolve(root, f)), 'missing-existing:' + t.id + ':' + f);
    for (const f of t.writeNew ?? []) need(!existsSync(resolve(root, f)), 'planned-file-already-exists:' + t.id + ':' + f);
    if (t.stage === 'S0a') {
      need(t.readiness === 'BRIEF_COMPLETE_WAITING_START', 'discovery-state:' + t.id);
      need(t.gates?.length === 1 && t.gates[0] === 'S0A_START', 'discovery-gates:' + t.id);
      need(writes.every((f) => !componentPrefixes.test(f)), 'discovery-product-write:' + t.id);
      const draftOutputs = p.gates.find((g) => g.id === 'S0A_START')?.allowedDraftWriteNew ?? [];
      need(t.writeExisting.length === 0 && t.writeNew.every((f) => draftOutputs.includes(f)), 'discovery-draft-output-gate:' + t.id);
      need((t.pilotWrite ?? []).length === 0 && !t.test && (t.fullRegression ?? []).length === 0, 'discovery-test-or-pilot:' + t.id);
    } else {
      need(t.readiness === 'CONDITIONAL_DESIGN' && t.designQuestions?.length > 0, 'conditional-design-missing:' + t.id);
      for (const g of ['TECHNICAL_ADR', 'IMPLEMENTATION_BUDGET', 'LOCAL_TEST_SCOPE']) need(t.gates?.includes(g), 'missing-code-gate:' + t.id + ':' + g);
      need(typeof t.test?.command === 'string' && !!t.test?.effect && !!t.test?.cwd, 'missing-test-recipe:' + t.id);
      need(t.fullRegression?.includes('CORE_FULL'), 'missing-full-regression:' + t.id);
      if (t.stage !== 'S0b') for (const g of ['G0_ACCEPT', 'F1_START']) need(t.gates?.includes(g), 'missing-phase-gate:' + t.id + ':' + g);
      if (t.stage === 'S0b') need(t.gates?.includes('S0B_SCOPE'), 'missing-boundary-permission:' + t.id);
      if (t.stage === 'S4') {
        for (const g of ['PILOT_REPO', 'LIVE_SPEND']) need(t.gates?.includes(g), 'missing-pilot-gate:' + t.id + ':' + g);
        if (t.pilotWrite?.length) {
          need(t.protectedOracle?.owner === 'TRUSTED_TESTER' && t.protectedOracle?.freezeBeforeCandidate === true &&
            t.protectedOracle?.workerMayReadOrWrite === false, 'oracle-owner-boundary:' + t.id);
          need(t.protectedOracle?.files?.length > 0 && t.protectedOracle.files.every((f) => safePath(f) && !t.pilotWrite.includes(f)), 'oracle-worker-overlap:' + t.id);
        }
      }
    }
    if (writes.some((f) => f.startsWith('plugin/'))) need(t.fullRegression?.includes('PLUGIN_FULL'), 'missing-plugin-suite:' + t.id);
    for (const r of t.fullRegression ?? []) need(recipes.has(r), 'unknown-full-suite:' + t.id + ':' + r);
    for (const part of parts) {
      const band = t.locT?.[part];
      need(Array.isArray(band) && band.length === 2 && band.every((n) => Number.isInteger(n) && n >= 0) && band[0] <= band[1], 'loc-band:' + t.id + ':' + part);
      if (t.stage === 'S0a') need(band?.[0] === 0 && band?.[1] === 0, 'discovery-technical-loc:' + t.id);
    }
  }
  for (let i = 0; i < tasks.length; i++) for (let k = i + 1; k < tasks.length; k++) {
    const a = tasks[i], b = tasks[k];
    const aw = [...a.writeExisting, ...a.writeNew, ...a.pilotWrite.map((f) => 'PILOT:' + f)];
    const bw = new Set([...b.writeExisting, ...b.writeNew, ...b.pilotWrite.map((f) => 'PILOT:' + f)]);
    if (aw.some((f) => bw.has(f))) need(ancestorSets.get(b.id)?.has(a.id) || ancestorSets.get(a.id)?.has(b.id), 'unordered-write-conflict:' + a.id + ':' + b.id);
  }
  for (const [stage, previous] of [['S3', 'DC-S1-05'], ['S2', 'DC-S3-06'], ['S4', 'DC-S2-04']]) {
    for (const t of tasks.filter((t) => t.stage === stage)) need(ancestorSets.get(t.id)?.has(previous), 'stage-order:' + t.id);
  }
  const sums = [];
  for (const sprint of p?.sprintBudgetsT ?? []) {
    const group = tasks.filter((t) => t.sprint === sprint.id);
    const sum = { id: sprint.id };
    need(group.length > 0, 'empty-sprint:' + sprint.id);
    for (const part of parts) {
      sum[part] = [0, 1].map((i) => group.reduce((n, t) => n + (t.locT?.[part]?.[i] ?? NaN), 0));
      need(JSON.stringify(sum[part]) === JSON.stringify(sprint[part]), 'sprint-loc:' + sprint.id + ':' + part);
    }
    sum.total = [0, 1].map((i) => parts.reduce((n, part) => n + sum[part][i], 0));
    need(JSON.stringify(sum.total) === JSON.stringify(sprint.total), 'sprint-total:' + sprint.id);
    sums.push(sum);
  }
  const h1 = [0, 1].map((i) => sums.reduce((n, s) => n + s.total[i], 0));
  need(JSON.stringify(h1) === '[5880,9450]', 'H1-envelope');
  need(p?.laterPhases?.length === 3 && p.laterPhases.every((x) => x.startDecision === null), 'later-phase-release');
  return { errors: [...new Set(errors)], tasks: tasks.length, discoveryTasks: tasks.filter((t) => t.stage === 'S0a').length, conditionalTasks: tasks.filter((t) => t.stage !== 'S0a').length, sprintSums: sums, h1, releasedTasks: 0 };
}

// Yapı, kapsam, kaynak/artefakt kimlikleri ve kayıt tamlığı. Komutları yeniden çalıştırmaz.
export function validateResult(p, taskId, r, root = repoRoot) {
  const errors = [];
  const need = (ok, m) => { if (!ok) errors.push(m); };
  const t = p.tasks.find((t) => t.id === taskId);
  if (!t) return ['unknown-task'];
  const record = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
  if (!record(r)) return ['result-object-required'];
  for (const f of p.common.resultRequiredFields) need(Object.hasOwn(r, f), 'result-field:' + f);
  need(r.schemaSurum === p.common.resultSchemaSurum && r.taskId === taskId, 'result-identity');
  need(typeof r.at === 'string' && Number.isFinite(Date.parse(r.at)), 'result-time');
  need(p.common.resultOutcomes.includes(r.outcome), 'result-outcome');
  const listNames = ['sourceManifest', 'artifacts', 'checks', 'commands', 'changedFiles', 'blockers'];
  for (const k of listNames) need(Array.isArray(r[k]), 'result-list:' + k);
  if (listNames.some((k) => !Array.isArray(r[k]))) return errors;
  const complete = r.outcome === 'EVIDENCE_RECORDED';
  const evidenceRoot = `${p.sourcePolicy.evidenceRoot}/${taskId}/`;
  const sourcePaths = new Set();
  const sourceAllowed = new Set([...t.readFiles, ...t.dependsOn.flatMap((id) =>
    p.common.evidenceFiles.map((f) => `${p.sourcePolicy.evidenceRoot}/${id}/${f}`))]);
  const realRoot = realpathSync(root);
  const inspectFile = (f, label) => {
    if (!safePath(f) || dbOrRuntime(f)) { need(false, label + '-unsafe-path'); return null; }
    try {
      const full = resolve(root, f);
      const rel = relative(realRoot, realpathSync(full));
      if (isAbsolute(rel) || rel === '..' || rel.startsWith('..' + (process.platform === 'win32' ? '\\' : '/'))) {
        need(false, label + '-outside-root'); return null;
      }
      if (!statSync(full).isFile()) { need(false, label + '-not-file'); return null; }
      const bytes = readFileSync(full);
      return { sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length };
    } catch { need(false, label + '-missing'); return null; }
  };
  for (const s of r.sourceManifest) {
    if (!record(s)) { need(false, 'result-source-object'); continue; }
    need(sourceAllowed.has(s.path), 'result-source-out-of-scope:' + s.path);
    need(!sourcePaths.has(s.path), 'result-source-duplicate:' + s.path);
    sourcePaths.add(s.path);
    need(/^[0-9a-f]{64}$/.test(s.sha256 ?? ''), 'result-source-identity');
    if (!sourceAllowed.has(s.path)) continue; // Yetkisiz yolu denetim bahanesiyle okuma.
    const actual = inspectFile(s.path, 'result-source');
    if (actual) need(actual.sha256 === s.sha256, 'result-source-changed:' + s.path);
  }
  if (complete) for (const f of t.readFiles) need(sourcePaths.has(f), 'result-source-required:' + f);
  const artifactPaths = new Set();
  for (const a of r.artifacts) {
    if (!record(a)) { need(false, 'result-artifact-object'); continue; }
    const own = safePath(a.path) && a.path.startsWith(evidenceRoot) && a.path !== evidenceRoot + 'sonuc.json';
    need(own, 'result-artifact-out-of-scope');
    need(!artifactPaths.has(a.path), 'result-artifact-duplicate');
    artifactPaths.add(a.path);
    need(/^[0-9a-f]{64}$/.test(a.sha256 ?? '') && Number.isInteger(a.bytes) && a.bytes > 0, 'result-artifact-identity');
    if (!own) continue;
    const actual = inspectFile(a.path, 'result-artifact');
    if (actual) need(actual.sha256 === a.sha256 && actual.bytes === a.bytes && actual.bytes > 0, 'result-artifact-changed:' + a.path);
  }
  if (complete) need(artifactPaths.has(evidenceRoot + 'OZET.md'), 'result-summary-artifact-required');
  // OZET transkripsiyonunda kısa kalan sha256 (S2-02 63 hane / S4-02 62 hane / S1-01 63 hane — üç kez):
  // 57-63 hane hex = 64'ten kısa ama yarıdan uzun → yalnız düşmüş sha256 olabilir;
  // 40 hane tam SHA-1 (git HEAD damgası gibi) ve kısa commit önekleri etkilenmez.
  const summaryRel = evidenceRoot + 'OZET.md';
  if (artifactPaths.has(summaryRel)) {
    try {
      const truncated = readFileSync(resolve(root, summaryRel), 'utf8').match(/\b[0-9a-f]{57,63}\b/);
      need(!truncated, 'ozet-truncated-hash:' + summaryRel + ':' + (truncated ? truncated[0] : ''));
    } catch { need(false, 'ozet-summary-unreadable:' + summaryRel); }
  }
  const recipes = new Map((t.recipes ?? []).map((id) => [id, p.recipes.find((x) => x.id === id)]));
  if (t.test) recipes.set('TARGETED', t.test);
  const commandIds = new Set();
  for (const c of r.commands) {
    if (!record(c)) { need(false, 'result-command-object'); continue; }
    for (const f of p.common.commandRequiredFields) need(Object.hasOwn(c, f), 'result-command-field:' + f);
    need(recipes.has(c.recipeId), 'result-command-recipe:' + c.recipeId);
    need(!commandIds.has(c.recipeId), 'result-command-duplicate:' + c.recipeId);
    commandIds.add(c.recipeId);
    const recipe = recipes.get(c.recipeId);
    need(typeof c.command === 'string' && c.command.trim().length > 0 &&
      c.command === recipe?.command && c.cwd === recipe?.cwd, 'result-command-mismatch:' + c.recipeId);
    need(Number.isInteger(c.exitCode) && c.expectedExitCode === 0, 'result-command-exit');
    need(artifactPaths.has(c.outputRef), 'result-command-output-ref');
    if (complete) need(c.exitCode === c.expectedExitCode, 'result-command-unexpected-exit:' + c.recipeId);
  }
  if (complete) for (const id of recipes.keys()) need(commandIds.has(id), 'result-command-required:' + id);
  const allowed = new Set([...t.writeExisting, ...t.writeNew, ...p.common.evidenceFiles.map((f) => evidenceRoot + f)]);
  for (const f of r.changedFiles) need(allowed.has(f), 'result-out-of-scope:' + f);
  // Pilot kökü bağlanmadan pilot dosyaları bu denetçide de izinli kabul edilmez.
  const expectedChecks = new Set([...t.positive.map((_, i) => 'P' + (i + 1)), ...t.negative.map((_, i) => 'N' + (i + 1))]);
  const checkIds = new Set();
  for (const c of r.checks) {
    if (!record(c)) { need(false, 'result-check-object'); continue; }
    need(expectedChecks.has(c.id) && !checkIds.has(c.id), 'result-check-identity');
    need(typeof c.observed === 'boolean', 'result-check-observation');
    if (c.observed) need(artifactPaths.has(c.evidenceRef), 'result-check-evidence-ref:' + c.id);
    if (c.observed === true) checkIds.add(c.id);
  }
  if (complete) {
    need(r.blockers.length === 0, 'result-has-blockers');
    for (const id of expectedChecks) need(checkIds.has(id), 'missing-check-result:' + id);
  } else need(r.blockers.some((x) => typeof x === 'string' && x.trim().length > 0), 'blocked-without-reason');
  need(r.humanGateAccepted !== true && r.productAccepted !== true && r.executionAuthorized !== true, 'result-authority-claim');
  return [...new Set(errors)];
}

function main() {
  const p = readJson(resolve(packageDir, 'gorevler.json'));
  const [arg, taskId, resultPath] = process.argv.slice(2);
  if (arg === '--result') {
    if (!taskId || !resultPath) throw new Error('--result TASK_ID RESULT_PATH gerekli');
    const rel = relative(repoRoot, resolve(repoRoot, resultPath)).replace(/\\/g, '/');
    if (!safePath(rel) || dbOrRuntime(rel)) throw new Error('Sonuç yolu repo içinde ve runtime dışı olmalı');
    const errors = validateResult(p, taskId, readJson(resolve(repoRoot, rel)));
    console.log(JSON.stringify({ kind: 'result-shape-not-empirical-verification', taskId, passed: errors.length === 0, errors, humanAcceptance: false }, null, 2));
    process.exitCode = errors.length ? 1 : 0;
  } else {
    if (arg) throw new Error('Bilinmeyen argüman: ' + arg);
    const report = validatePackage(p);
    console.log(JSON.stringify({ kind: 'static-package-validation-not-product-tests', passed: report.errors.length === 0, ...report }, null, 2));
    process.exitCode = report.errors.length ? 1 : 0;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
