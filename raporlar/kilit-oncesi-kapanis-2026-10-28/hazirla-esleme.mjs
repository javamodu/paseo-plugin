// Tek seferlik B1/B2 veri uzlaştırması. Ürün kaynağı/DB/sağlayıcı yok; eski JSON alanları korunur.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const dir = 'raporlar/kilit-oncesi-kapanis-2026-10-28/';
const read = (p) => JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const base = read(dir + 'baslangic.json');
const p = read('plans/uygulama-paketleri/DC-H1-2026-10-28/gorevler.json');
const cgPath = 'raporlar/rapor-chatgpt-27ekim.json';
const dsPath = 'raporlar/rapor-deepseek27ekim.json';
const auditPath = 'raporlar/plan-3-denetci-2026-10-27/denetim.json';
const rulePath = 'raporlar/gelen-kutu/v7-kural-sadelestirme-2026-10-27.json';
const cg = read(cgPath), ds = read(dsPath), audit = read(auditPath), rules = read(rulePath);
const at = new Date().toISOString();
const target = 'raporlar/birlesik-eksik-defteri-2026-10-25/DC-2026-10-28.json';
if (existsSync(target)) throw new Error('Append-only: DC eki zaten var');
const tasks = (stage) => p.tasks.filter((t) => t.stage === stage).map((t) => t.id);
const groupDefs = [
  ['C01', 'Gerçek OS sınırı ve kullanım fizibilitesi', [...tasks('S0a'), ...tasks('S0b')], 'G0_ACCEPT'],
  ['C02', 'Sürümlü tam sözleşme ve onaylı kaynak', ['DC-S1-01', 'DC-S1-02', 'DC-S1-03'], 'H1_ACCEPT'],
  ['C03', 'Gerçek operatör ve bütün pilot girişleri', ['DC-S1-04', 'DC-S1-05'], 'H1_ACCEPT'],
  ['C04', 'Mühürlü aday, korunan test ve yetkili kanıt', tasks('S2'), 'H1_ACCEPT'],
  ['C05', 'Normal bitiş, süreç/sahiplik ve deneme bazlı iptal', ['DC-S3-01', 'DC-S3-02', 'DC-S3-03'], 'H1_ACCEPT'],
  ['C06', 'Gerçek kullanım, dış etki öncesi yetki ve STOP bakımı', ['DC-S3-04', 'DC-S3-05', 'DC-S3-06'], 'H1_ACCEPT'],
  ['C07', 'Kalıcı sürücü, strateji, öğrenme ve terfi', [], 'H1/H2/H3 sonrası ayrı faz kararları'],
  ['C08', 'Aktif/tarihsel ilişki ve insan kapısı kaydı', ['DC-S0a-04', 'DC-S1-05', 'DC-S4-04'], 'G0_ACCEPT / H1_ACCEPT'],
  ['C09', 'Gerçek okuyucu uyumu ve sürümlü kart gösterimi', ['DC-S1-04', 'DC-S4-04'], 'H1_ACCEPT'],
  ['C10', 'Pilot oracle, dürüst tahmin ve deney kapsamı', ['DC-S0a-04', ...tasks('S4')], 'IMPLEMENTATION_BUDGET / H1_ACCEPT'],
];
const canonicalGroups = groupDefs.map(([id, title, ids, gate]) => ({
  id, title, ownerRole: id === 'C10' ? 'KOORDINATOR + TESTER + INSAN' : 'CODER + AYRI TESTER',
  assignedAgentId: null, state: id === 'C07' ? 'DEFERRED_TO_PHASE_GATE' : 'PRODUCT_PENDING_NOT_FIXED_BY_DOCUMENTS',
  representationAlreadyFixed: ['C08', 'C09'].includes(id), productFixed: false,
  taskIds: ids, acceptanceIds: [...new Set(ids.map((x) => p.tasks.find((t) => t.id === x).sprint))],
  humanGate: gate, prerequisites: id === 'C07' ? ['H1 sonra S5/S6', 'H2 sonra S7/S8', 'H3 sonra S9/S10'] : ['göreve özel insan emri', 'gerekli teknik ADR/tasarım ve bütçe bağları'],
  testContract: ids.map((x) => { const t = p.tasks.find((t) => t.id === x); return {
    taskId: x, positives: t.positive, negatives: t.negative,
    command: t.test ?? (t.recipes?.length ? { recipes: t.recipes.map((id) => p.recipes.find((x) => x.id === id)) } : { cwd: '.', command: null, reason: 'salt-okur kaynak incelemesi; komut uydurulmaz' }),
    threshold: 'Bütün belirtilen P/N gözlemleri ayrı kanıtlı; yetkisiz dış etki yok; ölçülmeyen sonuç boş/BLOCKED.',
    evidenceRoot: `${p.sourcePolicy.evidenceRoot}/${x}`, fullRegression: t.fullRegression,
  }; }),
  deferredContract: id === 'C07' ? p.laterPhases : null,
  evidenceMeaning: 'Bu eşleme testin koşulduğu veya ürünün düzeldiği anlamına gelmez; yeni kapanış kendi kalıcı kanıtını ister.',
}));
const e = {
  'E-01': [['C01'], 'product_gap', 'OPEN', 'İzolasyon ürün kanıtı bekler; plan S0/G0 öncesinde şart koşar, H1 sonuna ertelemez.'],
  'E-02': [['C03'], 'product_gap', 'OPEN', 'Alternatif başlatma ve insan aktör etiketinin gerçek kimlik olmaması ürün işidir.'],
  'E-03': [['C08'], 'report_error_or_superseded_claim', 'CORRECTED', 'Boş kararlar sözleşmesizlik veya çalışma anı hata kanıtı değil; doğru kapalı başlangıç.'],
  'E-04': [['C08'], 'report_error_or_superseded_claim', 'REFUTED_CURRENT_CONFLICT', 'Sıra alıntısı tarihsel §19; güncel §20 zaten ana planla aynı.'],
  'E-05': [['C04'], 'product_gap', 'OPEN', 'Opsiyonel imza ürün zincirinde zorunlu yetkili üretici doğrulamasına dönüşmeli.'],
  'E-06': [['C06'], 'product_gap', 'OPEN', 'Kuyruk kabulü yetmez; dış etki öncesi güncel yetki/süre yeniden sınanmalı.'],
  'E-07': [['C10'], 'plan_or_acceptance_detail', 'HISTORY_AND_REESTIMATE_DISTINGUISHED', 'İlk nominal tarihçe; yerine geçen tahmin onaysız, eski rezerv eklenmez.'],
  'E-08': [['C04', 'C10'], 'report_error_or_superseded_claim', 'CRITERIA_LINKED_PRODUCT_PENDING', 'NOT_RUN/CSV sütun yokluğu ölçüt yok demek değil; fişlerle test/kanıt bağı kuruldu.'],
  'E-09': [['C04', 'C10'], 'plan_or_acceptance_detail', 'CONTRACT_LINKED_PRODUCT_PENDING', 'Hedefli ve tam regresyon/kanal reçeteleri fişlerde; gerçek görev testi henüz yok.'],
  'E-10': [['C01', 'C10'], 'plan_or_acceptance_detail', 'DOCUMENT_CLOSED', 'Mevcut defterin DC eki kaynaklı tekilleştirme; ikinci açık-iş otoritesi yok.'],
  'E-11': [['C01', 'C08'], 'report_error_or_superseded_claim', 'CORRECTED', 'S0a/S0b mevcut DC-S0 alt adımları; ayrı PASS veya yeni ürün düğümü gerekmez.'],
  'E-12': [['C09'], 'historical_evidence', 'COMPATIBILITY_REPRESENTATION_FIXED', 'Eski metin görünümü kasıtlı uyumluluk; aritmetik sayısal alanlarda. Genel okuyucu işi ayrı.'],
  'E-13': [['C04'], 'historical_evidence', 'HISTORICAL_SCOPE_PRESERVED', 'Eski kanıta sonradan tek kanal şekli dayatılarak PASS silinmez, sahte kanıt eklenmez.'],
  'E-14': [['C10'], 'historical_evidence', 'HISTORICAL_SCOPE_DECISIONS_PRESERVED', 'K-0049 gibi kapsam kararı geniş ürün yeteneği kanıtı sayılmaz.'],
  'E-15': [['C08'], 'report_error_or_superseded_claim', 'CORRECTED', 'Eski S kimliği ve DC-S kimliği farklı; önek benzerliği gerçek çakışma kanıtı değil.'],
  'E-16': [['C06', 'C10'], 'plan_or_acceptance_detail', 'CONTRACT_LINKED_PRODUCT_PENDING', 'STOP bakımı ve izole geri dönüş kendi S3/S4 test/izinlerine bağlı.'],
  'E-17': [['C10'], 'plan_or_acceptance_detail', 'PROJECTION_NOT_MEASUREMENT', 'Olgunluk tahmini başarı ölçümü değil; yeni kanıtla yeniden puanlanır.'],
  'E-18': [['C08', 'C10'], 'plan_or_acceptance_detail', 'CONTRACT_LINKED_PRODUCT_PENDING', 'İnsan kararının format/kapsam bağı vardır; gerçek karar yalnız ilgili insan kapısında.'],
  'E-19': [['C01', 'C10'], 'plan_or_acceptance_detail', 'DEPENDENCY_NOT_EXTRA_DEFECT', 'S0 sonrası ayrıştırma açık tasarım bağıdır; ek LOC veya ürün hatası diye iki kez sayılmaz.'],
  'E-20': [['C02', 'C05'], 'report_error_or_superseded_claim', 'CORRECTED', 'S1 ile S3 farklı teslimlerdir; S3 kapsam büyüklüğü tek başına sınır ihlali değildir.'],
  'E-21': [['C10'], 'plan_or_acceptance_detail', 'CONTRACT_LINKED_PRODUCT_PENDING', 'Hata aileleri S4-04 P/N kanıtına bağlandı; aday öncesi eşikler ve gerçek koşum gerekecek.'],
  'E-22': [['C08'], 'plan_or_acceptance_detail', 'DOCUMENT_CLOSED', 'Boş denetim özeti mevcut denetim.json ve sonuçlardan tamamlandı.'],
};
const claimMappings = [];
function add(path, id, groups, claimClass, disposition, rationale) {
  if (!base.files[path]) throw new Error('Kaynak başlangıç kimliği yok: ' + path);
  claimMappings.push({ sourceIdentity: { path, id, sha256: base.files[path].sha256 }, canonicalGroups: groups,
    claimClass, disposition, rationale, evidenceKind: 'source_or_historical_record_review_not_new_product_measurement', productFixedByClosure: false });
}
for (const f of ds.findings) add(dsPath, f.id, ...e[f.id]);
for (const f of audit.rawFindings) add(`raporlar/plan-3-denetci-2026-10-27/${f.id.slice(0, 2)}-SONUC.md`, f.id,
  f.groups, 'product_gap', f.state, 'Kayıtlı denetim grubu ve plan netleştirmesi korunur; ürün kapanışı değildir.');
const axisGroup = { M1: ['C02'], M2: ['C01', 'C03'], M3: ['C04'], M4: ['C05', 'C07'], M5: ['C06'], M6: ['C07'], M7: ['C07'], M8: ['C07'], M9: ['C07', 'C10'], M10: ['C07', 'C10'] };
for (const axis of cg.axes) for (const c of axis.checks) add(cgPath, c.id, axisGroup[axis.id], c.credited ? 'historical_evidence' : 'product_gap', c.state,
  c.credited ? 'Eski dar mekanizma/test kredisi korunur; bütün ürün veya yeni görev başarısı sayılmaz.' : 'Yetersiz/bütünlenmemiş/ölçülmemiş kanıt; plan/fiş yazımı kontrolü otomatik kredilendirmez.');
const gateGroup = [['C03'], ['C04'], ['C05', 'C06'], ['C02', 'C07'], ['C07'], ['C10']];
cg.gates.forEach((g, i) => add(cgPath, g.id, gateGroup[i], 'product_gap', g.state, 'Bu G1–G6 rubrik kapısı DC-G0/H1 insan kararıyla aynı kimlik değildir; ürün kanıtı bekler.'));
const opGroups = [['C07', 'C10'], ['C10'], ['C04'], ['C01', 'C03'], ['C05'], ['C06'], ['C07'], ['C07'], ['C07'], ['C07'], ['C09', 'C10'], ['C07']];
cg.operationalMetrics.forEach((o, i) => add(cgPath, o.id, opGroups[i], 'plan_or_acceptance_detail', o.state, 'Pay/payda tanımı korunur; değer ölçülmedi veya proxy eşdeğer değil. Bilimsel başarı oranı uydurulmaz.'));
const probes = [['C02'], ['C04'], ['C06'], ['C09', 'C10'], ['C07'], ['C05']];
probes.forEach((g, i) => add('raporlar/rapor-chatgpt-27ekim-deney-v2.json', 'P' + (i + 1), g, 'historical_evidence', 'RECORDED_COUNTEREXAMPLE', 'Yapılandırılmış eski yerel karşı örnek; temsilî görev dağılımı/hata oranı değildir.'));
audit.mainAgentEvidence.observations.forEach((o) => add('raporlar/plan-3-denetci-2026-10-27/ana-karakterizasyon.json', o.id, [o.group], 'historical_evidence', 'RECORDED_LOCAL_OBSERVATION', o.scope));
for (const x of rules.maddeler) add(rulePath, x.id, ['K-SADE'], 'human_decision_or_implementation_window', 'PENDING_SEPARATE_HUMAN_RULE_DECISION', '34 madde/varyantın değerlendirilmesi ve uygulaması ayrı insan kararıdır; bu kapanış kural semantiğini değiştirmez.');
for (let i = 1; i <= 6; i++) add('raporlar/rapor-chatgpt-27ekim.md', '4.' + i, [['C03'], ['C04'], ['C06'], ['C02'], ['C02'], ['C05', 'C09']][i - 1], 'product_gap', 'LINKED_TO_CANONICAL_GROUP', 'Teknik anlatımın aynı mekanizma/deneyle örtüşen bulgusu; bağımsız yeni deney/açık diye toplanmaz.');
const specialGroups = [{ id: 'K-SADE', ownerRole: 'INSAN + KURAL YAZICISI', state: 'SEPARATE_DECISION_PENDING', source: rulePath, rationale: 'V7-23 dahil koruma yükleme riski; 38 koşullu öneri, uygulanmadı.' }];
const identity = (x) => x.sourceIdentity.path + '#' + x.sourceIdentity.id;
if (new Set(claimMappings.map(identity)).size !== claimMappings.length) throw new Error('Yinelenen ham kimlik');
const sourcePaths = [...new Set(claimMappings.map((x) => x.sourceIdentity.path))];
const out = {
  schemaSurum: 1, kind: 'existing-issue-ledger-dated-supplement-not-product-closure', id: 'DC-2026-10-28', at,
  authority: 'plans/PLAN.md', existingLedger: 'raporlar/birlesik-eksik-defteri-2026-10-25/DEFTER.md',
  scope: 'Sayılabilir rapor kimlikleri: E22 + native20 + M40 + G6 + O12 + P6 + MAIN4 + V7-34 + teknik §4.1–4.6. Eski bütün repo/backlog sayımı değildir.',
  rawIdentityCount: claimMappings.length, expectedIdentityCount: 150, sourcePaths,
  sourceVersions: Object.fromEntries(sourcePaths.map((f) => [f, base.files[f]])),
  canonicalGroups, specialGroups, claimMappings, mappingsCompleteForDeclaredScope: true,
  sourceArtifactRule: 'İlgili canlı/yerel kanıt raporları kendi tarih/commit/kapsamıyla referanstır; aynı logu aktaran rapor bağımsız deney değildir.',
  wholeRepositoryOpenIssueCount: null, productGroupsFixedByThisClosure: 0, productScoreChanged: false,
  legacyBacklogCarry: { source: 'raporlar/birlesik-eksik-defteri-2026-10-25/DEFTER.json', fullRecountPerformed: false, oldCountsNotCurrent: true, ownerRole: 'KOORDINATOR', rule: 'Eski ~22/27/29 sayıları bugüne kopyalanmaz. Kaynak maddeler silinmez; güncel DC ile açıkça örtüşenler referans eşlemesiyle taşınır.' },
  authorityQueue: [
    { id: 'A3-krl-b0cb1576', state: 'ALREADY_APPROVED_IN_LATER_RECORD', source: 'STATE_BOARD.md', action: 'Tekrar insan onayı veya yeniden iniş üretme.' },
    { id: 'K-0044', state: 'DECISION_APPROVED_IMPLEMENTATION_WINDOW_PENDING', source: 'kararlar/K-0044.md', action: 'Restart/env uygulaması ayrı; sır/config bu görevde okunmaz.' },
    { id: 'rpl-03579e06', state: 'STALE_SCOPE_REVALIDATION_REQUIRED', source: 'STATE_BOARD.md', action: 'Güncel plan sürümü ve taslak özeti doğrulanmadan uygulatma.' },
    { id: 'A4', state: 'SUPERSEDED_BY_DC_S5_S6_AFTER_H1', source: 'plans/PLAN.md', action: 'Eski HAZIR kaydından gece modu izni çıkarma.' },
  ],
};
if (out.rawIdentityCount !== out.expectedIdentityCount) throw new Error('Kapsam sayımı: ' + out.rawIdentityCount);
writeFileSync(target, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
function appendField(path, key, value) {
  const raw = readFileSync(path, 'utf8'), old = JSON.parse(raw.replace(/^\uFEFF/, ''));
  if (Object.hasOwn(old, key)) throw new Error('Erata alanı zaten var: ' + path);
  const cut = raw.lastIndexOf('}');
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  const next = raw.slice(0, cut).trimEnd() + ',' + nl + '  ' + JSON.stringify(key) + ': ' + JSON.stringify(value, null, 2).replaceAll('\n', nl + '  ') + nl + '}' + raw.slice(cut + 1);
  const parsed = JSON.parse(next.replace(/^\uFEFF/, ''));
  const { [key]: added, ...rest } = parsed;
  if (JSON.stringify(rest) !== JSON.stringify(old) || !added) throw new Error('Eski JSON alanı değişti: ' + path);
  writeFileSync(path, next);
}
appendField(cgPath, 'closureErrata20261028', { at, reportSection: '15', activeReadinessRef: 'effectiveResult',
  correctedControlRatio: { numerator: 19, denominator: 40, unweightedPercent: 47.5, weightedReadiness: 48.75, weightedMaturityToday: 3.9125, equivalentConversions: false },
  historicalFieldsPreserved: true, sourceClaimsMapped: true, canonicalMappingRef: target, productScoreChanged: false, executionAuthorized: false });
appendField(dsPath, 'closureErrata20261028', { at, reportSection: '9', originalFindingsAndSeverityAreHistorical: true,
  refutedCurrentClaims: ['E-04', 'E-11', 'E-15', 'E-20'], reinterpreted: ['E-01', 'E-03', 'E-07', 'E-08', 'E-12', 'E-13', 'E-14', 'E-17'],
  documentClosed: ['E-10', 'E-22'], canonicalMappingRef: target, originalFieldsPreserved: true, productFindingsFixed: false, humanQueueSupersededByCanonicalMapping: true, executionAuthorized: false });
appendField('raporlar/birlesik-eksik-defteri-2026-10-25/DEFTER.json', 'dc20261028', { at, supplement: target, rawIdentityCount: out.rawIdentityCount,
  wholeRepositoryOpenIssueCount: null, historicalCountsNotCurrent: true, existingLedgerRetained: true, sourceMappingsCompleteForDeclaredScope: true, productFindingsFixed: false });
console.log(JSON.stringify({ at, supplement: target, rawIdentityCount: out.rawIdentityCount, canonicalGroups: canonicalGroups.length, sourceJsonHistoricalValuesPreserved: true }, null, 2));
