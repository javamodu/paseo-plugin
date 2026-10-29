// Sadece paket denetçisinin yerel pozitif/negatifleri; core/probe/DB/sağlayıcı yok.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { validatePackage, validateResult, readJson, packageDir, repoRoot } from './dogrula.mjs';
import { render, checkViews } from './gorunum.mjs';

const data = () => readJson(resolve(packageDir, 'gorevler.json'));
const has = (p, fragment) => validatePackage(p).errors.some((e) => e.includes(fragment));

test('26 görev, 4 salt-okur keşif, kapalı izinler ve H1 LOC toplamı geçerli', () => {
  const r = validatePackage(data());
  assert.deepEqual(r.errors, []);
  assert.equal(r.tasks, 26);
  assert.equal(r.discoveryTasks, 4);
  assert.equal(r.conditionalTasks, 22);
  assert.equal(r.releasedTasks, 0);
  assert.deepEqual(r.h1, [5880, 9450]);
});
test('RED: örtük yürütme ve görev başlatma kararı', () => {
  const p = data(); p.executionAuthorized = true; p.common.authorizationRecord = 'fake';
  assert.ok(has(p, 'authority-expanded'));
  assert.ok(has(p, 'implicit-task-release'));
});
test('RED: insan kapısını paket yazarı dolduramaz', () => {
  const p = data(); p.gates[0].decision = { approved: true };
  assert.ok(has(p, 'gate-not-closed'));
});
test('RED: mevcut dosya tavanı ve runtime veri yolu', () => {
  const p = data(); p.tasks[7].writeExisting.push('core/src/cli.ts', 'core/src/store.ts', 'core/veri/ordu.sqlite');
  assert.ok(has(p, 'existing-file-limit'));
  assert.ok(has(p, 'runtime-path'));
});
test('RED: bağımlılık döngüsü', () => {
  const p = data(); p.tasks[0].dependsOn = [p.tasks[1].id];
  assert.ok(has(p, 'cycle'));
});
test('RED: aynı dosyada sırasız yazıcı', () => {
  const p = data(); p.tasks[8].dependsOn = ['DC-S0b-03'];
  assert.ok(has(p, 'unordered-write-conflict'));
});
test('RED: görev LOC payları parent zarfını sessiz büyütemez', () => {
  const p = data(); p.tasks[7].locT.source[1]++;
  assert.ok(has(p, 'sprint-loc'));
  assert.ok(has(p, 'H1-envelope'));
});
test('RED: S0a keşfine ürün testi veya kod yazımı eklenemez', () => {
  const p = data(); p.tasks[0].writeNew.push('core/src/not-approved.ts'); p.tasks[0].test = { command: 'npm test' };
  assert.ok(has(p, 'discovery-product-write'));
  assert.ok(has(p, 'discovery-test-or-pilot'));
});
test('RED: S2 süreç/yazma kapanışını atlayamaz', () => {
  const p = data(); p.tasks.find((t) => t.id === 'DC-S2-01').dependsOn = ['DC-S1-05'];
  assert.ok(has(p, 'stage-order'));
});
test('RED: pilotta harcama/ortam kapısı kaldırılamaz', () => {
  const p = data(); p.tasks.find((t) => t.id === 'DC-S4-01').gates = ['G0_ACCEPT'];
  assert.ok(has(p, 'missing-pilot-gate'));
  assert.ok(has(p, 'missing-code-gate'));
});
test('RED: negatif kanıt ve tam regresyon alanı eksik', () => {
  const p = data(); p.tasks[7].negative = []; p.tasks[7].fullRegression = [];
  assert.ok(has(p, 'missing-positive-negative'));
  assert.ok(has(p, 'missing-full-regression'));
});
test('RED: pilot işçisi korunan kabul oracle sahibi olamaz', () => {
  const p = data(); p.tasks.find((t) => t.id === 'DC-S4-01').protectedOracle.workerMayReadOrWrite = true;
  assert.ok(has(p, 'oracle-owner-boundary'));
});
test('İnsan/makine fişleri aynı kaynaktan ve bayt eş üretilebilir', () => {
  assert.deepEqual(checkViews(data()), []);
  const docs = render(data());
  assert.equal(docs.size, 8);
  assert.ok(docs.get('S4.md').includes('ayrı güvenilir tester'));
});
test('RED: görevde insan görünümüne yansımayan değişiklik drift olur', () => {
  const p = data(); p.tasks[0].title += ' değişti';
  assert.ok(checkViews(p).includes('S0a.md'));
});
const result = () => ({
  schemaSurum: 2, taskId: 'DC-S0a-01', at: '2026-10-28T00:00:00.000Z',
  sourceManifest: [{ path: 'core/package.json', sha256: createHash('sha256').update(readFileSync(resolve(repoRoot, 'core/package.json'))).digest('hex') }],
  artifacts: [], outcome: 'BLOCKED', checks: [], commands: [], changedFiles: [], blockers: ['İnsan başlatma emri yok; bu testte ürün görevi koşulmadı.'],
});
test('Sonuç: gerekçeli BLOCKED kaydı kabul edilir, insan kapısı açılmaz', () => {
  assert.deepEqual(validateResult(data(), 'DC-S0a-01', result()), []);
});
test('Sonuç RED: eksik kanıttan EVIDENCE_RECORDED yapılamaz', () => {
  const r = result(); r.outcome = 'EVIDENCE_RECORDED'; r.blockers = [];
  assert.ok(validateResult(data(), 'DC-S0a-01', r).some((e) => e.includes('missing-check-result')));
});
test('Sonuç RED: kapsam dışı değişiklik, bayat hash ve sahte insan kabulü', () => {
  const r = result(); r.changedFiles = ['core/src/cli.ts']; r.sourceManifest[0].sha256 = '0'.repeat(64); r.humanGateAccepted = true;
  const errors = validateResult(data(), 'DC-S0a-01', r);
  assert.ok(errors.some((e) => e.includes('out-of-scope')));
  assert.ok(errors.some((e) => e.includes('source-changed')));
  assert.ok(errors.includes('result-authority-claim'));
});

// Yalnız kayıt denetçisi için geçerli fixture; gerçek komut/görev başarısı değildir.
function completeFixture(ctx) {
  const root = mkdtempSync(resolve(tmpdir(), 'ordu-result-v2-'));
  ctx.after(() => rmSync(root, { recursive: true, force: true }));
  const p = data(), t = p.tasks[0];
  const digest = (b) => createHash('sha256').update(b).digest('hex');
  const manifest = t.readFiles.map((file) => {
    const bytes = Buffer.from('local source fixture: ' + file);
    mkdirSync(dirname(resolve(root, file)), { recursive: true });
    writeFileSync(resolve(root, file), bytes);
    return { path: file, sha256: digest(bytes) };
  });
  const artifact = `${p.sourcePolicy.evidenceRoot}/${t.id}/OZET.md`;
  const bytes = Buffer.from('Test-only captured output fixture; not a real product observation.');
  mkdirSync(dirname(resolve(root, artifact)), { recursive: true });
  writeFileSync(resolve(root, artifact), bytes);
  const r = {
    schemaSurum: 2, taskId: t.id, at: '2026-10-28T00:00:00.000Z', sourceManifest: manifest,
    artifacts: [{ path: artifact, sha256: digest(bytes), bytes: bytes.length }],
    outcome: 'EVIDENCE_RECORDED',
    commands: t.recipes.map((id) => { const x = p.recipes.find((v) => v.id === id); return { recipeId: id, command: x.command, cwd: x.cwd, exitCode: 0, expectedExitCode: 0, outputRef: artifact }; }),
    checks: [...t.positive.map((_, i) => ({ id: 'P' + (i + 1), observed: true, evidenceRef: artifact })), ...t.negative.map((_, i) => ({ id: 'N' + (i + 1), observed: true, evidenceRef: artifact }))],
    changedFiles: [artifact], blockers: [],
  };
  return { p, t, r, root, artifact };
}
test('v2 kayıt: bütün kaynaklar, komutlar ve hash bağlı gerçek artefaktla biçim geçer', (ctx) => {
  const { p, t, r, root } = completeFixture(ctx);
  assert.deepEqual(validateResult(p, t.id, r, root), []);
});
test('RED: denetimdeki boş-komut/tek-kaynak/hayali-kanıt karşı örneği', (ctx) => {
  const { p, t, r, root } = completeFixture(ctx);
  r.commands = []; r.sourceManifest = r.sourceManifest.slice(0, 1); r.artifacts[0].path += '.missing';
  const errors = validateResult(p, t.id, r, root);
  assert.ok(errors.some((x) => x.includes('result-command-required')));
  assert.ok(errors.some((x) => x.includes('result-source-required')));
  assert.ok(errors.includes('result-artifact-missing'));
});
test('RED: komut cwd/exit/çıktı bağı eksik veya yanlış', (ctx) => {
  const { p, t, r, root } = completeFixture(ctx);
  delete r.commands[0].exitCode; r.commands[0].cwd = 'outside'; r.commands[0].outputRef = 'missing';
  const errors = validateResult(p, t.id, r, root);
  assert.ok(errors.includes('result-command-field:exitCode'));
  assert.ok(errors.some((x) => x.includes('result-command-mismatch')));
  assert.ok(errors.includes('result-command-output-ref'));
});
test('RED: kaydedilen artefakt sonradan değişmiş', (ctx) => {
  const { p, t, r, root, artifact } = completeFixture(ctx);
  writeFileSync(resolve(root, artifact), 'tampered');
  assert.ok(validateResult(p, t.id, r, root).some((x) => x.includes('result-artifact-changed')));
});
test('RED: kanıt görevin kendi kökünün dışında veya sonuç dosyasının kendisi', (ctx) => {
  const { p, t, r, root } = completeFixture(ctx);
  r.artifacts[0].path = 'core/package.json';
  assert.ok(validateResult(p, t.id, r, root).includes('result-artifact-out-of-scope'));
  r.artifacts[0].path = `${p.sourcePolicy.evidenceRoot}/${t.id}/sonuc.json`;
  assert.ok(validateResult(p, t.id, r, root).includes('result-artifact-out-of-scope'));
});
test('RED: yinelenen kaynak veya check sahte tamlık sağlamaz', (ctx) => {
  const { p, t, r, root } = completeFixture(ctx);
  r.sourceManifest.push(r.sourceManifest[0]); r.checks.push(r.checks[0]);
  const errors = validateResult(p, t.id, r, root);
  assert.ok(errors.some((x) => x.includes('result-source-duplicate')));
  assert.ok(errors.includes('result-check-identity'));
});
test('RED: bozuk sonuç nesnesi/liste denetçiyi patlatmadan reddedilir', () => {
  assert.deepEqual(validateResult(data(), 'DC-S0a-01', null), ['result-object-required']);
  const r = result(); r.sourceManifest = {};
  assert.ok(validateResult(data(), r.taskId, r).includes('result-list:sourceManifest'));
});
test('RED: eski v1 sonuç kaydı etkin şema yerine geçmez', () => {
  const r = result(); r.schemaSurum = 1;
  assert.ok(validateResult(data(), r.taskId, r).includes('result-identity'));
});
test('RED: S0a taslak ADR çıktısı insan kapısı kapsamından çıkarılamaz', () => {
  const p = data(); p.gates.find((g) => g.id === 'S0A_START').allowedDraftWriteNew = [];
  assert.ok(has(p, 'discovery-draft-output-gate'));
});
test('RED: komut başarısızlığı beklenen çıkış denerek tamamlanmaya çevrilemez', (ctx) => {
  const { p, t, r, root } = completeFixture(ctx);
  r.commands[0].exitCode = 1; r.commands[0].expectedExitCode = 1;
  assert.ok(validateResult(p, t.id, r, root).includes('result-command-exit'));
});
