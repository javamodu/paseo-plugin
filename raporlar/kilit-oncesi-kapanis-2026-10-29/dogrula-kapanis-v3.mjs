// RBT-2026-10-28.3 belge/paket kapanış denetimi — .2 denetiminin uyarlanmış kopyası.
// Core/probe/DB/sağlayıcı modülü çalıştırmaz; tag/commit yok. .2'ye göre ölçütlü farklar:
// (1) taze baseline bu dizinde (v9-06 sonrası HEAD; .2 protected iddiaları tarihseldir);
// (2) mapping-source-version eşlemenin YAZIM BAĞLAMI .2 baseline'ıdır + DC eki .2 adayından sabitlenir;
// (3) append-only-prefix / erata / historical-json .2 baseline'ına kıyaslanır (taze baseline'la anlamsızlaşır);
// (4) rule-count 38 (K-0052 K-SADE insan kararı, 2026-10-28 19:41 — .2'nin 80 sabiti o turundu);
// (5) sonDamga 'RBT .3'; (6) review .2 dizininden okunur (bayt-bayt aynı);
// (7) bu turun yazma kapsamı yalnız STATE_BOARD damgası + taze CODEMAP.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { readJson, validatePackage } from '../../plans/uygulama-paketleri/DC-H1-2026-10-28/dogrula.mjs';
import { checkViews } from '../../plans/uygulama-paketleri/DC-H1-2026-10-28/gorunum.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '../..');
const pkg = 'plans/uygulama-paketleri/DC-H1-2026-10-28/';
const oldDir = 'raporlar/kilit-oncesi-kapanis-2026-10-28/';
const base = readJson(resolve(here, 'baslangic.json'));
const oldBase = readJson(resolve(root, oldDir + 'baslangic.json'));
const oldAday = readJson(resolve(root, oldDir + 'aday-20261028152606837.json'));
const reviewPath = oldDir + 'bagimsiz-inceleme.json';
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const json = (p) => readJson(resolve(root, p));
const digest = (b) => createHash('sha256').update(b).digest('hex');
const fileInfo = (p) => { const b = readFileSync(resolve(root, p)); return { path: p, sha256: digest(b), bytes: b.length }; };
const checks = [];
const check = (name, ok) => { checks.push({ name, passed: !!ok }); if (!ok) throw new Error(name); };
const p = json(pkg + 'gorevler.json');
const m = json('raporlar/birlesik-eksik-defteri-2026-10-25/DC-2026-10-28.json');
const state = readJson(resolve(here, 'kapanis.json'));

// Bu tur baseline sonrasında yazdığı yalnız kapanış damgası ve taze CODEMAP; .2 kirli içeriği KORUNUR.
const edited = new Set(['STATE_BOARD.md', 'CODEMAP.md']);
let protectedFiles = 0, outsidePreserved = 0;
for (const f of base.protectedComponentFiles) {
  const before = base.files[f];
  check('protected-baseline:' + f, !!before);
  check('protected-unchanged:' + f, fileInfo(f).sha256 === before.sha256);
  protectedFiles++;
}
for (const [f, before] of Object.entries(base.files)) {
  if (edited.has(f)) continue;
  check('outside-scope-unchanged:' + f, fileInfo(f).sha256 === before.sha256);
  outsidePreserved++;
}
// .2'den bu yana yalnız EKLENMİŞ olma disiplini: önek ve erata kontrolleri .2 başlangıcıyla kıyaslanır.
const prefixFiles = ['plans/PLAN.md', 'raporlar/rapor-chatgpt-27ekim.md', 'raporlar/rapor-deepseek27ekim.md',
  'raporlar/birlesik-eksik-defteri-2026-10-25/DEFTER.md', 'raporlar/rapor-birlesimi-2026-10-28/OZET.md'];
for (const f of prefixFiles) {
  const b = readFileSync(resolve(root, f));
  check('append-only-prefix:' + f, digest(b.subarray(0, oldBase.files[f].bytes)) === oldBase.files[f].sha256);
}
for (const [f, key] of [
  ['raporlar/rapor-chatgpt-27ekim.json', 'closureErrata20261028'],
  ['raporlar/rapor-deepseek27ekim.json', 'closureErrata20261028'],
  ['raporlar/birlesik-eksik-defteri-2026-10-25/DEFTER.json', 'dc20261028'],
  ['raporlar/rapor-birlesimi-2026-10-28/birlesim.json', 'closureUpdate20261028'],
]) {
  const raw = read(f), nl = raw.includes('\r\n') ? '\r\n' : '\n';
  const i = raw.indexOf(',' + nl + '  "' + key + '":');
  check('erata-field:' + f, i >= 0 && Object.hasOwn(json(f), key));
  const restored = raw.slice(0, i) + nl + '}' + raw.slice(raw.lastIndexOf('}') + 1);
  check('historical-json-bytes:' + f, digest(Buffer.from(restored)) === oldBase.files[f].sha256);
}
check('denetim-summary-now-nonempty', read('raporlar/plan-3-denetci-2026-10-27/OZET.md').trim().length > 0);

const packageReport = validatePackage(p, root);
check('static-package', packageReport.errors.length === 0);
check('human-machine-parity', checkViews(p).length === 0);
check('package-revision', p.packageId === 'ATOM-H1-2026-10-28.2' && p.common.resultSchemaSurum === 2);
check('draft-adr-allowed-in-gate', p.tasks.filter((t) => t.stage === 'S0a').every((t) => t.writeNew.every((f) => p.gates.find((g) => g.id === 'S0A_START').allowedDraftWriteNew.includes(f))));
check('all-product-permissions-closed', p.executionAuthorized === false && p.budgetApproved === false && p.gates.every((g) => g.decision === null));
check('final-human-gate-not-fabricated', state.permissions.finalHumanAcceptance === null && state.permissions.commitTagPushAuthorized === false && state.candidate.humanDecision === null && state.candidate.tag === null && state.candidate.lockedCommit === null);

const identity = (x) => x.sourceIdentity.path + '#' + x.sourceIdentity.id;
check('mapping-150', m.claimMappings.length === 150 && new Set(m.claimMappings.map(identity)).size === 150);
const expected = new Set();
const dsPath = 'raporlar/rapor-deepseek27ekim.json', cgPath = 'raporlar/rapor-chatgpt-27ekim.json';
for (const f of json(dsPath).findings) expected.add(dsPath + '#' + f.id);
const audit = json('raporlar/plan-3-denetci-2026-10-27/denetim.json');
for (const f of audit.rawFindings) expected.add(`raporlar/plan-3-denetci-2026-10-27/${f.id.slice(0, 2)}-SONUC.md#${f.id}`);
const cg = json(cgPath);
for (const a of cg.axes) for (const c of a.checks) expected.add(cgPath + '#' + c.id);
for (const g of [...cg.gates, ...cg.operationalMetrics]) expected.add(cgPath + '#' + g.id);
for (let i = 1; i <= 6; i++) {
  expected.add('raporlar/rapor-chatgpt-27ekim-deney-v2.json#P' + i);
  expected.add('raporlar/rapor-chatgpt-27ekim.md#4.' + i);
}
for (const x of audit.mainAgentEvidence.observations) expected.add('raporlar/plan-3-denetci-2026-10-27/ana-karakterizasyon.json#' + x.id);
for (const x of json('raporlar/gelen-kutu/v7-kural-sadelestirme-2026-10-27.json').maddeler) expected.add('raporlar/gelen-kutu/v7-kural-sadelestirme-2026-10-27.json#' + x.id);
check('declared-scope-complete', expected.size === 150 && m.claimMappings.every((x) => expected.has(identity(x))));
const groups = new Set([...m.canonicalGroups, ...m.specialGroups].map((x) => x.id));
// Eşleme .2 baseline sürümlerine bağlandı (yazım bağlamı); kaynaklar sonradan evrimleşebilir (v7 islenme gibi) —
// bu, eşlemenin doğru yazıldığını kanıtlar; kaynakların bugünkü hali aday manifestinde ayrıca ölçülür.
for (const x of m.claimMappings) {
  check('mapping-source-version-authoring-context:' + identity(x), x.sourceIdentity.sha256 === oldBase.files[x.sourceIdentity.path]?.sha256);
  check('mapping-rationale:' + identity(x), !!x.rationale && !!x.claimClass && !!x.disposition && x.canonicalGroups.every((g) => groups.has(g)) && x.productFixedByClosure === false);
}
// DC eki .2 adayından bu yana değişmedi; .2 adayının A+B yolları (50+7) diskte hâlâ birebir (b5 doğrulaması).
const oldAdayHash = new Map(oldAday.content.map((c) => [c.path, c.sha256]));
check('dc-supplement-unchanged-since-rbt2-aday', fileInfo('raporlar/birlesik-eksik-defteri-2026-10-25/DC-2026-10-28.json').sha256 === oldAdayHash.get('raporlar/birlesik-eksik-defteri-2026-10-25/DC-2026-10-28.json'));
const adayPreserved = oldAday.content.filter((c) => fileInfo(c.path).sha256 === c.sha256).length;
check('rbt2-aday-preserved-set', adayPreserved === 57);
for (const g of m.canonicalGroups) {
  check('group-owner-and-gate:' + g.id, !!g.ownerRole && !!g.humanGate && !!g.prerequisites.length && g.productFixed === false);
  check('group-test-contract:' + g.id, g.id === 'C07' ? !!g.deferredContract?.length : g.testContract.length > 0 && g.testContract.every((x) => x.positives.length && x.negatives.length && x.threshold && x.evidenceRoot && x.command));
}
const discovery = p.tasks.find((t) => t.id === 'DC-S0a-01');
const overrides = m.effectiveTestContractOverrides?.entries ?? [];
const discoveryOverrides = overrides.filter((x) => x.groupId === 'C01' && x.taskId === discovery.id);
check('review-01-exact-effective-recipes', discoveryOverrides.length === 1 &&
  JSON.stringify(discoveryOverrides[0].command.recipes) === JSON.stringify(discovery.recipes.map((id) => p.recipes.find((r) => r.id === id))));
const review = json(reviewPath);
check('independent-review-provenance', review.nativeTaskId === '01a182c1-65cb-7208-927c-e09a1178fb2c' &&
  review.verdict === 'CONDITIONAL_CONTINUE_FOR_DOCUMENT_CANDIDATE' && review.testsRunByReviewer === false &&
  review.finalHumanAcceptance === null && review.commitOrTagApproval === false);
check('review-followups-not-hidden', ['REVIEW-01', 'REVIEW-02'].every((id) => review.findings.some((x) => x.id === id)));
const weighted = cg.axes.reduce((n, a) => n + a.weight * a.checks.filter((c) => c.credited).length / 4, 0);
check('readiness-not-raised', weighted === 48.75 && cg.effectiveResult.weightedPoints === 48.75 && cg.closureErrata20261028.correctedControlRatio.unweightedPercent === 47.5);
const rows = read('plans/kabul.csv').split(/\r?\n/).filter((l) => l && !l.startsWith('id,')).map((l) => l.split(','));
const acceptance = { total: rows.length, green: rows.filter((r) => ['PASS', 'GECTI', 'GECTI_CANLI'].includes(r[3])).length, dcNotRun: rows.filter((r) => r[0].startsWith('DC-') && r[3] === 'NOT_RUN').length };
check('acceptance-preserved', acceptance.total === 135 && acceptance.green === 81 && acceptance.dcNotRun === 11);
const graph = json('plans/gorev-grafigi-2026-10-26.json');
check('graph-hash-and-version-preserved', graph.grafSurumu === 'v14' && fileInfo('plans/gorev-grafigi-2026-10-26.json').sha256 === oldAdayHash.get('plans/gorev-grafigi-2026-10-26.json'));
const active = graph.gorevler.filter((x) => x.aktif), node = new Map(active.map((x) => [x.id, x]));
check('active-graph-16', active.length === 16 && active.every((x) => x.secilebilir === false && x.uygulamaYetkisi === false));
check('S3-before-S2', node.get('DC-S2').bagimli.includes('DC-S3') && node.get('DC-S3').bagimli.includes('DC-S1'));

// Mevcut gerçek okuyucuları yalnız bellek içi DOM/FS taklitleriyle çalıştır; server açma yok.
const html = read('pano/kapsul-tuval.html'), meta = html.match(/function metaYaz\(\) \{[\s\S]*?\n\}/)?.[0];
check('actual-meta-reader-found', !!meta);
const dom = { textContent: '' }, document = { title: '' };
vm.runInNewContext(meta + '; metaYaz();', { G: graph, $: () => dom, document }, { timeout: 1000 });
check('actual-meta-reader-compatible', dom.textContent.includes('v14') && document.title.includes('v14'));
const server = read('pano/server.js'), summary = server.match(/function repoOzeti\(repo\) \{[\s\S]*?\n\}/)?.[0];
check('actual-state-reader-found', !!summary);
const ctx = { join: (...xs) => xs.join('/'), readFileSync: (f) => f.endsWith('STATE_BOARD.md') ? read('STATE_BOARD.md') : '', existsSync: () => true };
const actualState = vm.runInNewContext('(' + summary + ')', ctx, { timeout: 1000 })({ ad: 'audit-fixture', yol: '.' });
check('actual-state-reader-compatible', actualState.sonDamga?.includes('RBT .3'));

const docs = [
  'README.md', 'AGENTS.md', 'ANAYASA.md', 'plans/AJAN-BASLANGIC.md', 'plans/VERI-YERLESIMI.md', 'plans/SSOT-INDEX.md', 'plans/PLAN.md', 'STATE_BOARD.md', 'raporlar/OZET.md',
  'kararlar/ADR-kilit-oncesi-kapanis-2026-10-28.md', 'raporlar/kilit-oncesi-kapanis-2026-10-28/OZET.md',
  'raporlar/kilit-oncesi-kapanis-2026-10-28/BAGIMSIZ-INCELEME.md',
  'raporlar/kilit-oncesi-kapanis-2026-10-29/OZET.md',
  'raporlar/plan-3-denetci-2026-10-27/OZET.md', 'raporlar/rapor-birlesimi-2026-10-28/OZET.md',
  'raporlar/birlesik-eksik-defteri-2026-10-25/DEFTER.md',
  ...readdirSync(resolve(root, pkg)).filter((x) => x.endsWith('.md')).map((x) => pkg + x),
];
let links = 0;
for (const [f, text] of [...docs.map((f) => [f, read(f)]),
  ['raporlar/rapor-chatgpt-27ekim.md', read('raporlar/rapor-chatgpt-27ekim.md').split('## 15. ERATA')[1]],
  ['raporlar/rapor-deepseek27ekim.md', read('raporlar/rapor-deepseek27ekim.md').split('## 9. ERATA')[1]],
]) for (const x of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
  if (/^(https?:|mailto:)/.test(x[1])) continue;
  const [target, anchor] = x[1].split('#');
  if (!target) continue;
  const lm = target.match(/:(\d+)$/), path = resolve(root, dirname(f), lm ? target.slice(0, lm.index) : target);
  check('active-link:' + f + ':' + x[1], existsSync(path));
  const text = statSync(path).isFile() ? readFileSync(path, 'utf8') : 'directory';
  check('active-link-nonempty:' + x[1], text.trim().length > 0);
  if (lm) check('line-range:' + x[1], Number(lm[1]) <= text.split(/\r?\n/).length);
  if (anchor) check('task-anchor:' + anchor, text.toLowerCase().includes('## ' + anchor));
  links++;
}
const stateLines = read('STATE_BOARD.md').trimEnd().split(/\r?\n/).length;
check('state-budget', stateLines <= 100);
// K-0052 (K-SADE, 2026-10-28 19:41) sonrası sayaç 80->38; .2'nin === 80 sabiti o turun beklentisiydi.
const countRules = ['ANAYASA.md', 'AGENTS.md', 'sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md'].reduce((n, f) => n + read(f).split(/\r?\n/).filter((l) => /^\s*(-|\d+\.)\s/.test(l)).length, 0);
check('rule-count-not-expanded', countRules === 38);
for (const f of ['core/data/ordu.sqlite-wal', 'core/data/ordu.sqlite-shm', 'core/veri/ordu.sqlite-wal', 'core/veri/ordu.sqlite-shm', '.tmp-kilo/']) {
  check('runtime-ignore:' + f, spawnSync('git', ['check-ignore', '--no-index', '--quiet', f], { cwd: root }).status === 0);
}
const at = new Date().toISOString(), stamp = at.replace(/[^0-9]/g, '');
const executions = [];
for (const [id, args] of [
  ['paket', [pkg + 'dogrula.mjs']], ['test', ['--test', '--test-reporter=spec', pkg + 'dogrula.test.mjs']], ['gorunum', [pkg + 'gorunum.mjs', '--check']],
]) {
  const r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 30000 });
  const log = relative(root, resolve(here, `${id}-${stamp}.log`)).replace(/\\/g, '/');
  writeFileSync(resolve(root, log), (r.stdout ?? '') + (r.stderr ? '\nSTDERR:\n' + r.stderr : ''), { flag: 'wx' });
  check('command:' + id, !r.error && r.status === 0);
  if (id === 'test') check('package-tests-27', /tests 27\b/.test(r.stdout) && /pass 27\b/.test(r.stdout) && /fail 0\b/.test(r.stdout) && /skipped 0\b/.test(r.stdout));
  executions.push({ id, executable: process.execPath, args, cwd: '.', exitCode: r.status, log, output: fileInfo(log) });
}
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
check('HEAD-unchanged', head === base.head);
const git = spawnSync('git', ['diff', '--check'], { cwd: root, encoding: 'utf8' });
check('whitespace', git.status === 0);

const initialScope = json('raporlar/rapor-birlesimi-2026-10-28/birlesim.json').scope;
const contentPaths = [...new Set([
  ...docs, ...initialScope.primarySources, ...initialScope.evidenceAndOperationalSources,
  ...['gorevler.json', 'dogrula.mjs', 'dogrula.test.mjs', 'gorunum.mjs'].map((f) => pkg + f),
  '.gitignore', 'CODEMAP.md', 'plans/gorev-grafigi-2026-10-26.json', 'plans/kabul.csv',
  'raporlar/rapor-birlesimi-2026-10-28/birlesim.json', 'raporlar/birlesik-eksik-defteri-2026-10-25/DC-2026-10-28.json',
  'raporlar/birlesik-eksik-defteri-2026-10-25/DEFTER.json',
  oldDir + 'hazirla-esleme.mjs', oldDir + 'dogrula-kapanis.mjs', oldDir + 'kanit-muhur.mjs', oldDir + 'kanit-muhur.test.mjs',
  oldDir + 'bagimsiz-inceleme.json',
  // .3 tur dosyalari (taze turun kanit zinciri + b5 dogrulama raporu)
  'raporlar/kilit-oncesi-kapanis-2026-10-29/baslangic-yaz.mjs', 'raporlar/kilit-oncesi-kapanis-2026-10-29/dogrula-kapanis-v3.mjs',
  'raporlar/kilit-oncesi-kapanis-2026-10-29/kanit-muhur-v3.mjs', 'raporlar/kilit-oncesi-kapanis-2026-10-29/kanit-muhur.test.mjs',
  'raporlar/kilit-oncesi-kapanis-2026-10-29/OZET.md',
  'raporlar/b5-aday-dogrulama-2026-10-29/OZET.md', 'raporlar/b5-aday-dogrulama-2026-10-29/DOGRULAMA.json',
])].sort();
const manifest = {
  schemaSurum: 1, kind: 'content-addressed-document-candidate-refresh-not-tag-or-clean-tree', at, baseHead: head,
  revisionId: state.revisionId, packageRevision: p.packageId, content: contentPaths.map(fileInfo),
  outsideScopeChangesPreserved: base.preexistingChangesOutsideScope,
  noSelfHash: true, repoCleanClaimed: false, productRelease: false, humanAcceptance: null, tag: null, lockedCommit: null,
};
const manifestPath = relative(root, resolve(here, `aday-${stamp}.json`)).replace(/\\/g, '/');
writeFileSync(resolve(root, manifestPath), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
const report = {
  schemaSurum: 1, kind: 'closure-technical-validation-refresh-not-final-B5-or-product-acceptance', at, head, passed: true,
  assertions: checks.length, links, protectedComponentFiles: protectedFiles, preservedOutsideScopeFiles: outsidePreserved,
  appendOnlyPrefixesPreserved: prefixFiles, historicalJsonFieldsPreserved: true,
  sourceIdentityMappings: m.claimMappings.length, productGroups: m.canonicalGroups.length,
  rbt2AdayPreserved: adayPreserved, baselineRevision: 'RBT-2026-10-28.3',
  reviewFollowup01: { passed: true, scope: 'exact effective READ_GIT/READ_ENV recipe equality', independentRetestClaimed: false },
  independentReview: fileInfo(reviewPath),
  packageTests: { passed: 27, total: 27, failed: 0, skipped: 0 }, packageReport, humanMachineParity: true,
  actualConsumers: { metaYaz: true, stateHeaderParser: true, browserE2E: false, scope: 'real function code with memory DOM/FS fixture; no server' },
  stateLines, ruleCount: countRules, acceptance, executions,
  contentManifest: manifestPath, contentManifestHash: fileInfo(manifestPath).sha256,
  finalB5Accepted: false, warningsAcceptedByHuman: false, commitTagPushRun: false,
  fullProductRegressionRun: false, providerCalls: 0, productionDbOpened: false, productSourceChanged: false,
};
const reportPath = relative(root, resolve(here, `dogrulama-${stamp}.json`)).replace(/\\/g, '/');
writeFileSync(resolve(root, reportPath), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...report, executions: report.executions.map(({ id, exitCode, log }) => ({ id, exitCode, log })), report: reportPath }, null, 2));
