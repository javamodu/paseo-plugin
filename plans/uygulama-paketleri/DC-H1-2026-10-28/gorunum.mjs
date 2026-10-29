// gorevler.json -> insan görev fişleri. --write yalnız yeni dosya yaratır; --check salt-okur.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readJson, validatePackage, packageDir, repoRoot } from './dogrula.mjs';

const stages = ['S0a', 'S0b', 'S1', 'S3', 'S2', 'S4'];
const span = (b) => b[0] === b[1] ? String(b[0]) : b.join('–');
const link = (f) => `[${f}](${relative(packageDir, resolve(repoRoot, f)).replace(/\\/g, '/')})`;
const planned = (f) => `[${f} — planlanan](gorevler.json)`;
const taskLink = (p, id) => {
  const t = p.tasks.find((t) => t.id === id);
  return `[${id}](${t.stage}.md#${id.toLowerCase()})`;
};
const bullets = (xs) => xs.map((x) => '- ' + x).join('\n');

export function render(p) {
  const docs = new Map();
  const common = `**Kimlik:** ${p.packageId}. **Durum:** NOT_STARTED; yürütme/harcama yetkisi yok. Bu fişler [ana planın](../../PLAN.md) projeksiyonudur; ürün grafiğine veya kabul defterine yeni PASS eklemez. [Makine kaydı](gorevler.json) · [çalıştırma disiplini](CALISTIRMA.md).\n`;
  for (const stage of stages) {
    const lines = [`# ${stage} — Atomik görev fişleri`, '', common];
    if (stage !== 'S0a') lines.push('**TASARIM KOŞULLU:** Aşağıdaki dosya ve arayüzler uygulama adayıdır. S0 teknik ADR’si, gerekli izinler, kaynak snapshot’ı, pilot/OS bağları ve write-set teyidi olmadan hiçbir görev başlatılamaz. Önerilen yeni dosyalar bu paket yazılırken oluşturulmadı.', '');
    else lines.push('**KEŞİF BRIEF’İ TAM, BAŞLATMA YOK:** Salt-okur kaynak incelemesi ve yalnız görev rapor çifti/ADR önerisi üretilebilir. Ürün testi, probe, DB/CLI, sağlayıcı veya OS davranış deneyi bu kapsamda değildir.', '');
    for (const t of p.tasks.filter((t) => t.stage === stage)) {
      const evidence = `${p.sourcePolicy.evidenceRoot}/${t.id}`;
      lines.push(`## ${t.id}`, '', `**${t.title}**`, '', `**Hedef:** ${t.goal}`, '',
        `**Hazırlık:** ${t.readiness}. **Yazıcı:** ${stage === 'S0a' ? 'salt-okur keşif/rapor yazarı' : stage === 'S4' ? 'Ordu harness dosyaları için güvenilir entegrasyon yazıcısı; yalnız pilotWrite için ayrı güvenilmeyen pilot işçisi; korunan oracle için ayrı güvenilir tester' : 'tek CODER; ayrı tester ve salt-okur denetçi'}. Gerçek ajan kimliği, tester ve salt-okur denetçi henüz atanmadı.`, '',
        `**Önkoşul görevleri:** ${t.dependsOn.length ? t.dependsOn.map((id) => taskLink(p, id)).join(', ') : 'yok'}. Önceki görevlerin kanıt çiftleri de girdidir; görevin tamamlanması insan kapısını geçirmez.`, '',
        `**Ayrı kapılar:** ${t.gates.join(', ')}. Bütün kararlar boş/kapalı; [kapı kapsamları](gorevler.json) ve [serbest bırakma reçetesi](CALISTIRMA.md) zorunlu.`, '',
        '**Okunacak kaynaklar:**', bullets(t.readFiles.map(link)), '',
        '**Kesin mevcut dosya adayları (yalnız release sonrası yazma):**', bullets(t.writeExisting.map(link).length ? t.writeExisting.map(link) : ['yok']), '',
        '**Yeni dosya adayları (henüz yok):**', bullets(t.writeNew.map(planned).length ? t.writeNew.map(planned) : ['yok']), '',
        `**İzinli kanıt çıktısı:** ${planned(evidence + '/OZET.md')} ve ${planned(evidence + '/sonuc.json')}. Mevcut kanıt varsa ezme; koordinatörden yeni deneme yolu/revizyon iste.`, '');
      if (t.pilotWrite.length) lines.push('**Ayrı pilot köküne göre işçi yazma kümesi:**', bullets(t.pilotWrite.map(planned)), '',
        `**Korunan oracle:** yalnız ayrı güvenilir tester, kök bağı protectedOracleRoot; adaydan önce dondurulur. ${t.protectedOracle.files.map(planned).join(', ')}. Önceki oracle sürümleri değişmez. İşçi bu köke/anahtara erişmez; çekirdek harness dosyaları pilot işçisine verilmez.`, '');
      const commands = (t.recipes ?? []).map((id) => {
        const r = p.recipes.find((r) => r.id === id);
        return `${id}: ${r.cwd} çalışma dizininde; [tam komut](gorevler.json): ${r.effect}.`;
      });
      if (t.test) commands.push(`${t.test.cwd} çalışma dizininde [hedefli test komutu](gorevler.json): ${t.test.effect}. Yeni test bu görevde üretilir; bugün varmış/çalışmış gibi sayılmaz.`);
      lines.push('**Komut/test reçetesi:**', bullets(commands.length ? commands : ['Kaynak dosyaları okuma aracıyla oku; yürütülecek ürün testi veya probe yok.']), '',
        `**Görev sonucu biçim kontrolü:** [doğrulayıcı](dogrula.mjs), [CALISTIRMA](CALISTIRMA.md) içindeki --result reçetesiyle ${t.id} ve izinli sonuç yolu için çalıştırılır. Bu yalnız kayıt denetimi; empirik doğrulama veya insan onayı değildir.`, '',
        '**Pozitif kabul kanıtı:**', bullets(t.positive.map((x, i) => `P${i + 1}: ${x}`)), '',
        '**Negatif kabul kanıtı / sınır:**', bullets(t.negative.map((x, i) => `N${i + 1}: ${x}`)), '',
        `**Somut teslim:** ${t.output}`, '',
        `**LOC payı (T; onaysız):** Ordu kaynak ${span(t.locT.source)}; Ordu test ${span(t.locT.tests)}; ayrı pilot kaynak ${span(t.locT.pilotSource)}; ayrı pilot test ${span(t.locT.pilotTests)}. Kaynak/test bir kez sayılır; kanıt/doküman ayrıca, ölçülmüş LOC değil.`, '',
        `**Yürütme bütçesi önerisi (T; ayrı onay ister):** en fazla ${p.common.budgetT.maxTurns} tur / ${p.common.budgetT.maxMinutes} dakika / ${p.common.budgetT.maxTokens} token. Tavan yaklaşınca dur ve devir/kart; bütçe sağlayıcı harcama izni değildir.`, '',
        `**Tam regresyon:** ${t.fullRegression.length ? t.fullRegression.join(', ') + '; ayrı tester ve onaylı ortam; hedefli test yerine geçmez.' : 'S0a’da uygulanmaz; ürün kapanışı iddiası yok.'}`, '');
      if (t.designQuestions.length) lines.push('**Release öncesi cevaplanacak tasarım bağı:**', bullets(t.designQuestions), '');
      lines.push('**Yapılmayacaklar:** [ortak yasaklar ve görev kilitleri](CALISTIRMA.md) aynen geçerli. Ek dosya/göç veya kapsam ihtiyacı çıkarsa bu fişi genişletmeden dur; önce paket revizyonu. Tamamlanan rapor, görevi/sprinti veya insan kapısını kendi başına PASS yapmaz.', '');
    }
    docs.set(stage + '.md', lines.join('\n') + '\n');
  }
  const summary = ['# DC-H1 — Ajan uygulama paketi', '', common,
    '**26 atomik görev:** 4 S0a keşif + 3 S0b sınama + 5 S1 + 6 S3 + 4 S2 + 4 S4. **Başlatılmış görev 0.**', '',
    '| Sıra | Fişler | Durum | Somut sonuç |', '|---|---|---|---|',
    '| 1 | [S0a](S0a.md) | Brief tam; insan emri bekler | Kaynak/ortam, tehdit, kullanım/veri ve TASLAK teknik ADR |',
    '| 2 | [S0b](S0b.md) | Tasarım + ayrı zararsız sınama izni bekler | Gerçek sınır/kaçış ve bağımsız kullanım limiti kanıtı |',
    '| 3 | [S1](S1.md) | G0 + teknik ADR + bütçe + F1 başlatma bekler | Tam sözleşme, onaylı kaynak ve operatör/tek giriş sınırı |',
    '| 4 | [S3](S3.md) | S1 tamamlanmadan açılmaz | Süreç/iptal/kullanım ve dış etki öncesi güncel yetki |',
    '| 5 | [S2](S2.md) | S3 yazma/yaşam kapanışını bekler | Mühürlü aday, korunan test, zorunlu imza ve gerçek teslim |',
    '| 6 | [S4](S4.md) | Ayrı pilot/oracle/sağlayıcı ve geri dönüş izinleri | A/B/C kullanılabilir uygulama + on hata ailesi + H1 insan kanıtı |', '',
    '**Tek kaynak sırası:** ana plan > bu makine projeksiyonu > üretilmiş fişler. Bütün işler mevcut makro sprint/kabul kimliğine bağlı; görev fişi yeni ürün graf düğümü, onay veya başarı satırı değildir.', '',
    '## LOC (T; geçici atomik paylar)', '',
    '| Sprint | Kaynak | Test | Pilot kaynak | Pilot test | Toplam |', '|---|---:|---:|---:|---:|---:|'];
  for (const s of p.sprintBudgetsT) summary.push(`| ${s.id} | ${span(s.source)} | ${span(s.tests)} | ${span(s.pilotSource)} | ${span(s.pilotTests)} | ${span(s.total)} |`);
  summary.push('| **H1** | **2.230–3.700** | **3.050–4.750** | **300–500** | **300–500** | **5.880–9.450** |', '',
    'Atomik paylar ve pilot kaynak/test ayrımı yeni (T) öneridir; bütçe büyümesi değildir. S0 ADR’si bunları geçersiz kılarsa dur ve yeniden tahmin et. Mevcut modülleri yeniden yazım olarak toplama, eski rezervi tekrar ekleme. S0a dokümanı teknik LOC değildir; kaynak/test/kanıt/doküman/rework ayrı ölçülür.', '',
    '## Kullanım ve doğrulama', '',
    '- Önce [CALISTIRMA](CALISTIRMA.md): gerçek izin, snapshot, write-set, rol ve test ortamı bağları olmadan fişi ajana yürütme emri diye verme.',
    '- [Statik doğrulayıcı](dogrula.mjs) DAG, dosya sınırı/çakışma, kapalı izinler, kaynak varlığı ve LOC toplamını denetler; gerçek OS sınırı veya görev sonucunu kanıtlamaz.',
    '- [Denetçi testleri](dogrula.test.mjs) yalnız paket yazım araçlarının testidir; ürün regresyonu değildir.',
    '- [Görünüm üreticisi](gorunum.mjs): --check salt-okur eşlik kontrolü; --write yalnız yeni insan görünümü oluşturur, mevcut dosyayı ezmez.',
    '- RBT rapor birleşimi ve K-SADE ayrı işlerdir; bunları S0a’nın otomatik önkoşulu yapma.', '',
    '## Sonraki fazlar', '',
    '[S5–S10 ayrıntılandırma kapıları](SONRAKI-FAZLAR.md): H1/H2/H3 ölçümleri sonrası bir sonraki faz atomikleştirilir. Bugün kesin dosya/komut/tekil LOC uydurulmaz.', '');
  docs.set('OZET.md', summary.join('\n') + '\n');
  const later = ['# Sonraki fazlar — kapı sonrası ayrıntılandırma', '', common,
    '**Bunlar çalıştırılabilir kod görevleri değil; ileride görev paketi üretmenin teslim sözleşmesidir.**', ''];
  for (const phase of p.laterPhases) later.push(`## ${phase.sprints.join(' / ')}`, '',
    `**Ayrıntılandırma önkoşulu:** ${phase.detailAfter}; ayrıca yeni faz başlatma emri gerekir. Başlatma kararı yok.`, '',
    '**Somut teslimler:**', bullets(phase.deliverables), '',
    `**Paketleme:** ${phase.nextPackaging}.`, '',
    `**Teknik LOC (T):** ${phase.technicalLocT ? span(phase.technicalLocT) : phase.combinedS7ToS10TechnicalLocT ? 'S7–S10 ortak zarfı ' + span(phase.combinedS7ToS10TechnicalLocT) : 'S7–S10 ortak zarfından; bu faza ayrı tahmin yok'}. Tekil sprint payları yeni kanıtla hazırlanır; eski nominalden sessiz bölünmez.`, '');
  later.push('## Bir sonraki faz paketinin zorunlu çıktısı', '',
    'Kesin görev/bağımlılık listesi; en fazla üç mevcut dosyalı ve sırasız yazma çakışması olmayan kapsam; gerçek tasarım/insan kapıları; pozitif/negatif test komutları; kaynak/test/pilot LOC ve yürütme bütçesi; korunan oracle ve kanıt şeması; ayrı tester/denetçi. Hedef, yetki ve kabul tanımı genişletilmez.', '',
    '**Toplam yol (T):** H1 5.880–9.450 + S5/S6 1.860–3.160 + S7–S10 4.580–6.780 = 12.320–19.390. Bu dosya kaynak/test/pilot işlerini yeniden bütçeye eklemez.', '');
  docs.set('SONRAKI-FAZLAR.md', later.join('\n') + '\n');
  return docs;
}

export function checkViews(p) {
  return [...render(p)].filter(([name, expected]) => !existsSync(resolve(packageDir, name)) || readFileSync(resolve(packageDir, name), 'utf8') !== expected).map(([name]) => name);
}

function main() {
  const arg = process.argv[2];
  if (!['--write', '--check'].includes(arg)) throw new Error('--write veya --check gerekli');
  const p = readJson(resolve(packageDir, 'gorevler.json'));
  const r = validatePackage(p);
  if (r.errors.length) throw new Error(r.errors.join('\n'));
  if (arg === '--check') {
    const differences = checkViews(p);
    console.log(JSON.stringify({ passed: differences.length === 0, kind: 'human-machine-view-parity', differences }, null, 2));
    process.exitCode = differences.length ? 1 : 0;
  } else {
    const docs = render(p);
    for (const name of docs.keys()) if (existsSync(resolve(packageDir, name))) throw new Error('Mevcut görünüm ezilmez: ' + name);
    for (const [name, text] of docs) writeFileSync(resolve(packageDir, name), text, { encoding: 'utf8', flag: 'wx' });
    console.log(JSON.stringify({ created: [...docs.keys()], tasks: p.tasks.length }, null, 2));
  }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main();
