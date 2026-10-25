# Agent Ordu — Teknik ürün özeti ve geliştirici promptu

## Belgenin statüsü

Bu belge kullanıcı hedeflerinin teknik geliştirme brief'idir; kendiliğinden yeni SSOT, yayınlanmış mimari karar veya uygulama kanıtı oluşturmaz. Mevcut MASTER-SSOT-PLAN v2.7.2 üzerinde hedefli revizyon önerileri hazırlanmalıdır. Fonksiyon adları önerilen sözleşmelerdir; mevcut kodda bulundukları iddia edilmez.

Plan, güvenlik ve recovery yaklaşımı için kaynak: [^session-file://d60c8183-1b3d-4d65-ad83-c01bb1328dd3]

## 1. Ürün tanımı

Kullanıcının seçtiği Manager LLM üzerinden yönetilen; task, run, round, node ve attempt kimlikleriyle izlenebilen; önceden verilmiş rol, araç, dosya, bütçe ve süre sınırları içinde uzun süre çalışan ajan takımı yönetim sistemi.

LLM plan önerir ve içerik üretir. Deterministik kod yetki, bütçe, durum geçişi, sahiplik ve kabul kurallarını uygular. Kullanıcı varsayılan olarak izler; düğüm veya görev düzeyinde müdahale edebilir; sınırlı yetkili vekil atayabilir.

Başarı: önceden verilmiş yetki ve bütçe içinde, az insan müdahalesiyle, bağımsız doğrulanmış teslim. “En iyi cevap”, “dünya standardının üstü” ve “sıfır bağlam kaybı” kanıtsız garanti değildir.

## 2. Değişmez gereksinimler

- LangChain, LangGraph ve Paperclip kullanılmayacak.
- Upstream fork gerektiren çözüm yerine desteklenen plugin, sidecar, SDK veya adaptör kullanılacak.
- Küçük çekirdek, tek otoriter görev/durum kaydı, açık sözleşmeler ve geri alınabilir değişiklikler.
- Rol, model ve runtime birbirinden ayrı; insan seçimi izinsiz değiştirilmez.
- Manager kendi brief'ini, grant'ini, bütçesini veya kabul ölçütlerini tek taraflı genişletemez.
- Coder kendi çıktısını kabul edemez, korunan evaluator/suite'i değiştiremez.
- Worktree dosya güvenliği veya process sandbox'ı değildir.
- Gözetimsiz çalışma için worker'ın sahipliği, durumu, yetkisi, kullanım sınırı ve iptal davranışı kontrol edilebilir olmalıdır.
- Merge, deploy, dış dünyaya yazma ve harcama yetkileri ayrı tanımlanır.
- STOP, grant iptali ve deadline yalnız UI durumu değil gerçek dispatch/tool/process davranışıdır.

## 3. Geliştirici ajana verilecek ana prompt

Sen kıdemli full-stack ve distributed-systems mühendisisin. Görevin mevcut MASTER-SSOT-PLAN v2.7.2, ordu-core, Paseo plugin'i, adaptörler ve testleri inceleyerek kullanıcının ajan takımı yönetim ürününü en küçük güvenilir mimariyle geliştirme önerisi hazırlamaktır.

Bu prompt yeni SSOT değildir. Önce kaynak kodu, DB şemasını, migration'ları, çalışan API'leri ve test çıktısını incele. Dokümandaki test sayısını veya “kapandı” ifadesini bağımsız kanıt sayma. Her önemli gereksinimi mevcut kod, test ve gerçek sonuçla eşleştir. Mevcut olmayan fonksiyon adlarını varmış gibi sunma.

Kullanıcı birden fazla task açacak. Her task'ta Manager modelini seçecek; coder, tester, reviewer ve diğer rollerin modellerini isterse sabitleyecek, isterse sınırlı seçimi manager'a devredecek. Task'ı run, round, node ve attempt seviyesinde izleyecek. Ajan sayısı ile graph düğümü aynı şey değildir: bir ajan farklı düğümler çalıştırabilir; bazı düğümler deterministik test, onay veya birleştirme işlemidir.

Birinci zorunlu senaryo: aynı araştırma sorusuna beş farklı model bağımsız cevap verir; cevaplar değişmez sürümler olarak kaydedilir; bütün cevaplar ortak ve sürümlü rubric üzerinden çapraz eleştirilir; her değerlendirme gerekçe, kanıt, kritik itiraz ve düzeltme önerisi taşır; ajanlar kendi cevaplarını revize eder; yeniden değerlendirme ve bağımsız sentez gerçekleşir. İlk turda adaylar birbirini görmez. Sonraki turda diğer çıktılar salt-okur verilir. Yeni dikey metrik gerekiyorsa yeni rubric sürümü önerilir; onaylı politika izin verirse bütün ilgili adaylar yeniden değerlendirilir. Reviewer uzlaşması doğruluk kanıtı değildir. İlerleme yoksa, bütçe/deadline dolarsa veya kritik itiraz kapanmıyorsa döngü dürüstçe durur.

İkinci zorunlu senaryo: seçilen coder ve tester belirlenen tarih/saat ve saat dilimine kadar çalışır; soru, takılma veya geçici API hatası olduğunda manager/vekil sadece grant içindeki müdahaleyi yapar; kalıcı problemde izinli fallback model/runtime'a doğrulanmış handoff yapılır. Çıktı sabit candidate'a bağlanır; bağımsız test ve gerekiyorsa canlı UI testi yapılır. Hatalar yeni repair attempt'ına dönüşür; kapılar süre baskısıyla düşürülmez. Deadline yaklaşırken test ve handoff için rezerv korunur; kapanış politikası uygulanır.

Manager doğal dilden yapılandırılmış plan önerisi üretir. Kod derleyici bu planı kanonik manifest'e çevirir. Checker ve domain doğrulayıcı bağımlılık, izin, kapasite, bütçe ve kayıt bağlarını kontrol eder. Aynı yapılandırılmış girdi ve derleyici sürümü aynı manifest üretmelidir; LLM yorumunun determinizmi iddia edilmez.

Graph'ta paralel dallanma/birleşme, koşullu geçiş, başarısızlık politikası, bounded retry, approval, repair, handoff ve kapanış bulunmalıdır. Büyük graph framework'ü zorunlu değildir. Graph revision, rollback ve çalışan attempt'a etkisi açık olmalıdır; UI'dan yapılan scope/kapı değişikliği gizlice çalışan grant'e taşınmamalıdır.

Çekirdek kalıcı task/attempt durumu, atomik claim, rezervasyon, idempotency, event kaydı, fence, STOP ve receipt doğrulamasının otoritesidir. Sidecar ikinci bir otoriter defter oluşturmaz. Aktif koordinatör core'a doğrulanacak komut gönderir; read-model sadece okur. Yeni özellikler adaptör, uygulama katmanı, politika, projeksiyon veya yüzey olarak eklenir. Gerekli core değişikliği ADR, önce başarısız test ve kontrollü migration ile yapılır.

Dosya erişiminde read/write izinleri, canonical path, symlink/path traversal, shell ve subprocess bypass, sırlar ve ağ erişimi ele alınmalıdır. Prompt veya tool allowlist'i tek başına OS izolasyonu sayma. CLI worker gereken kontrol yeteneklerini sunmuyorsa gözetimsiz modu reddet veya daha sınırlı mode'a düşür; bunu UI'da açık göster.

Vekil önceden verilmiş yetki içinde soru cevaplayabilir, ek retry veya model değişimi gibi tanımlı kararları verebilir. Kendi yetkisini büyütemez. İnsan, manager ve vekil kararları ayrı audit edilir. Rutin ve ön yetkili işler insan onayı istemeden ilerler; scope/bütçe genişletme, yüksek risk ve çözülemeyen belirsizlik eskalasyon doğurur.

Handoff hedef, graph durumu, karar gerekçeleri, scope/grant, kalan bütçe/deadline, candidate/artifact referansları, gerçek testler, açık sorunlar ve sonraki adımı taşımalıdır. Yeni sahipliği doğrula; eski owner'ın yazmasını engelle. Tam konuşma arşivi gerektiğinde erişilebilir olsun; özet tek otorite olmasın. Gizli düşünce zinciri talep etme; karar gerekçesi, varsayım ve kanıt kaydet. “Mutlak sıfır bağlam kaybı” yerine iş devamlılığı için gerekli doğrulanmış durumun korunmasını test et.

Araştırma, kod ve UI için farklı kabul payload'ları kullan; ortak receipt zarfı görev/attempt/manifest/grant/candidate/evaluator/kanıt bağlarını taşısın. Şema biçimi, domain kaydı ilişkiyi, korunan evaluator ise gerçek kanıt kaynağını doğrulasın. LLM puanı tek başına PASS oluşturamaz.

İlk tercih tek host üzerinde mevcut TypeScript core'u koruyup Node/TypeScript uygulama katmanı kullanmaktır; Python tarafı gerçekten ihtiyaç varsa Pydantic AI sidecar olarak eklenebilir. PocketFlow ancak mevcut yürütme modeli için gerçek kazanç sağlıyorsa eklenmelidir. Aynı anda iki graph motoru ve iki recovery otoritesi kurma. CLI coder veya browser/desktop tester'ı yeniden yazmak yerine kontrollü adaptör olarak bağla.

Teknik review tesliminde: hedef–kod–test matrisi; seçilen/reddedilen mimari seçenekler; planın hedefli revizyonları; veri modeli ve sözleşmeler; P0/P1/P2 iş listesi; üretim/test/UI/adapter LOC ayrımı; gerçek kanıt ve NOT_RUN listesi; ilk küçük uygulama dilimi ve rollback planı bulunmalıdır. Bu önerileri sorgula; daha iyi bir alternatif varsa gerekçelendir. İlk gerçek worker veya yüksek riskli test için geçerli yetkiyi doğrula.

## 4. Önerilen stack ve karar koşulları

### Tercih: tek runtime

- Mevcut ordu-core kaynakları doğrulanırsa korunur.
- Node.js + TypeScript: core/koordinatör/adaptörler.
- Mevcut HTTP sunucusu varsa korunur; yoksa Fastify gibi küçük bir HTTP katmanı.
- SQLite: tek-host otoriter durum; transaction, index, migration, backup ve restore.
- Zod veya mevcut şema doğrulayıcı: plan, brief, komut ve API biçimleri.
- Gereken resmi model SDK'ları; model/runtime capability registry.
- Mevcut Paseo React paneli; bağımsız erişim için minimal web yüzeyi.
- SSE: olay akışı; kalıcı event cursor ile yeniden bağlanma.
- Playwright: web test adaptörü adayı; desktop için OS'e özel native erişilebilirlik adaptörü.
- Test runner: mevcut Node test sistemi; gerekirse Vitest. Gerçek fault testleri ayrı.
- CLI coder'lar: kontrol edilen alt process/runner; genel shell izni güvenli sayılmaz.

İkinci seçenek: aynı core + Python/Pydantic AI sidecar. Pydantic AI model/structured output/agent çağrısı tekrarını azaltabilir; fakat iki runtime'ın paketleme ve operasyon yükü vardır. Durable execution kütüphaneye otomatik gelmez: mevcut supervisor veya ayrı durable engine seçilir, iki sahiplik sistemi kurulmaz.

Üçüncü seçenek: aynı core + PocketFlow sidecar. Çok küçük flow soyutlamasıdır; durability ve izin sistemi ayrıca yapılır.

Pydantic AI kaynakları: [^https://github.com/pydantic/pydantic-ai] [^https://ai.pydantic.dev/durable_execution/overview/]
PocketFlow kaynakları: [^https://the-pocket.github.io/PocketFlow/] [^https://github.com/the-pocket/PocketFlow/blob/main/pocketflow/__init__.py]

## 5. UI → kod → döngü eşlemesi

| Yetenek | Arayüz | Önerilen sözleşme | Döngü / kabul |
|---|---|---|---|
| Task açma | Hedef, preset, budget, deadline formu | createTask, validateTaskSpec | Eksik veya yetkisiz görev dispatch edilmez |
| Rol/model seçme | Sabit/manager-seçebilir model alanı | resolveRoleBindings, checkCapabilities | Sabit seçim sessiz değişmez |
| Plan/graph | Düğüm, bağımlılık, kapı, revizyon | proposePlan, compilePlan, validateGraph | Döngü/eksik bağımlılık ve yetki kontrolü |
| Çalıştırma | Start, pause, resume | enqueueRun, claimAttempt, dispatch | Atomik claim + rezervasyon + runner çağrısı |
| Çoklu task | Task listesi, kapasite ve kritik yol | scheduleReadyNodes, reserveCapacity | Task'lar arası izolasyon ve adalet |
| Araştırma turu | Cevap/eleştiri/revizyon sekmeleri | startRound, fanOut, joinRound | Timeout ve eksik cevap politikası açık |
| Çapraz review | Puan matrisi, itirazlar | collectReviews, validateReview | Gerekçe/kanıt/çıktı sürümü bağlı |
| Dikey metrik | Rubric sürümleri ve diff | proposeRubric, activateRubric, reevaluate | Kapılar gizlice düşürülemez |
| Dosya/worktree | Read/write yolları, output mode | issueGrant, prepareWorkspace, authorizeTool | Bypass ve symlink negatif testleri |
| Bağımsız kabul | Kapılar, test sonucu, receipt | evaluateCandidate, verifyReceipt | Self-PASS reddi; sabit candidate |
| Canlı UI testi | Test oturumu, kayıt, bulgular | acquireTestSession, runUiSuite | Aynı desktop üzerinde tek etkileşim sahibi |
| Soru/vekil | Karar kutusu ve yetki diff'i | handleQuestion, authorizeDecision | Grant içi otomatik; dışı eskalasyon |
| Watchdog | Son ilerleme, heartbeat, takılma | detectStall, boundedRepair | Sessizlik tek başına kill gerekçesi değil |
| Handoff | Kaynak/hedef ajan, paket, ACK | prepareHandoff, validateHandoff, transferOwnership | Yeni owner teyidi, eski yazmanın reddi |
| Deadline | Kalan süre, kapanış modu | enforceDeadline, drainRun | Test/devir rezervi, dürüst kapanış |
| STOP | Task ve global durdurma | requestStop, persistStop, reconcileStop | İstek/kalıcı kayıt/process teyidi ayrı |
| Metrikler | Kalite, süre, maliyet, müdahale | projectMetrics, aggregateUsage | Başarısız/timeout işler rapordan çıkmaz |
| Audit | Timeline, neden, actor, evidence | appendEvent, streamEvents | Otoriter geçiş ve event aynı transaction |

## 6. Küçük ama açık veri modeli

Mantıksal varlıklar: task, run, round, graph revision, node/edge, attempt, agent binding, grant, rubric, review, artifact, receipt, decision, event.

Bunların her biri için ayrı tablo zorunlu değildir. Düşük riskli metadata JSON tutulabilir; aktif sahiplik, kimlik tekilliği, grant/attempt/receipt bağları ve kritik geçişler DB constraint/transaction ile korunmalıdır.

Önemli alanlar:

- task/run: hedef, owner, status, budget, deadline, policyVersion.
- node: type, dependencies, roleBinding, scope, gateRefs.
- attempt: attemptId, correlationId, owner, fenceToken, manifestRef, candidateRef, lifecycle.
- grant: actor, scope, tools, budgetReservation, expiry, revokedAt.
- rubric/review: version, candidateRef, reviewer, dimensions, evidence, objections.
- receipt: type, candidate/attempt/evaluator/grant bağları, kanıt hash'leri ve doğrulama.
- event: monoton cursor, actor, task/run/node/attempt bağları, eventVersion.

Durum tek alanda ezilmez: run durumu, attempt yaşamı ve teslim/kabul durumu ayrı eksenlerdir.

## 7. Çalışma döngüleri

### Komuta
intent → typed plan → deterministic manifest → policy/checker → authorize → enqueue.

### Yürütme
ready node → atomic claim/reservation → spawn → observe → persist → evaluate → accept veya bounded repair.

### Araştırma
rubric → independent answers → validate → peer review → revise → reevaluate → synthesize → independent acceptance.

### Recovery
crash/timeout → UNKNOWN → reconcile → live owner bekle veya güvenli devir; kör retry yok.

### Vekil
question/decision → classify risk → grant check → authorized answer veya escalation → audit.

### Deadline
remaining budget/time → admission policy → test/handoff reserve → drain/checkpoint/cancel → honest report.

### Öğrenme
evidence → quarantined lesson/proposal → matched experiment → authorized promote → canary → regression rollback.

Öğrenme, görev içi cevap revizyonuyla aynı döngü değildir. Her cevap revizyonu için sistem politikasını veya hafızasını promote etmek gerekmez.

## 8. En önemli kabul kapıları

1. Coder kendi işine PASS veremez; test suite değiştirmek kabul üretmez.
2. Yasak dosya, symlink ve shell bypass gerçekten engellenir.
3. Aynı iş kimliği/farklı payload conflict olur.
4. Crash/restart sonrası kayıp iş veya kör çift spawn yoktur.
5. Eski fence sahibi sonuç veya yazma yapamaz.
6. STOP kalıcıdır; yeniden başlatma dispatch'i açmaz.
7. İki task çıktı, izin, bütçe, oturum ve kararlarını karıştırmaz.
8. Rubric değişiminde ilgili adaylar aynı sürümle yeniden değerlendirilir.
9. Vekil grant içi kararı uygular, dışını reddeder.
10. Gözlenemeyen/kontrol edilemeyen alt agent gözetimsiz dispatch edilmez.
11. Deadline sonrası kabul kapıları düşmez; kapanış durumu dürüst raporlanır.
12. Paseo kapalıyken bağımsız runner teslim ve STOP döngüsünü tamamlar.

Haricî sistem idempotency sunmuyorsa mutlak exactly-once garantisi verilmez; uzlaştırma ve gerektiğinde insan kararı belirtilir. Dağıtık bütçe metering/in-flight kullanım gecikmesi nedeniyle kesin maliyet tavanı kontrolünün sınırı açıkça gösterilir.

## 9. Minimumdan büyüme

### İlk dikey dilim
Bir task, bir model/worker, bir bağımsız evaluator, bir grant, SQLite kayıt, temel durum paneli, STOP/restart testi.

Hedefli prototip: yaklaşık 1.200–2.500 üretim LOC; testler ayrıca. Bu sayı bütün güvenlik/otonomi gereksinimlerinin tamamlandığı anlamına gelmez; mevcut doğrulanmış core tekrar kullanımı farklı maliyet doğurur.

### İkinci dilim
Beş model, iki araştırma turu, sürümlü rubric, review matrisi, değişmez çıktılar.

### Üçüncü dilim
Coder/tester, gerçek recovery, handoff, deadline, sınırlı vekil.

### Dördüncü dilim
İki task izolasyonu, bağımsız runner, UI tester; gelişmiş graph ekranı sonra.

### Sonraki dilim
Kanıtlı öğrenme, matched benchmark ve policy promotion.

## 10. LOC ve stack puanları

Bunlar ölçülmüş repo büyüklüğü veya benchmark değildir; tek-host MVP için geniş belirsizlikli mühendislik tahminidir. Resmî model/CLI/browser araçları kullanılır. Yeni desktop motoru, çok-host dağıtık runtime, SSO ve gelişmiş grafik editörü kapsam dışıdır. DB, sandbox ve runner entegrasyonu zorlaşırsa kapsam yeniden tahmin edilir.

| Modül | Üretim LOC tahmini |
|---|---:|
| Kalıcı core ve recovery | 1.500–2.500 |
| Model/runner adaptörleri | 700–1.200 |
| Graph ve takım turları | 800–1.400 |
| Grant ve kontrollü araçlar | 800–1.500 |
| Rubric ve evaluator | 600–1.000 |
| Deadline ve vekil | 500–900 |
| İnce Paseo bridge | 250–500 |
| Temel panel | 700–1.300 |
| Metrik/projeksiyon | 300–600 |
| Toplam üretim | 6.150–10.900 |
| Test/fault/negatif-yol kodu | 3.500–6.500 |
| Birlikte toplam | 9.650–17.400 |

Bu tablo toplam hedef kapsamdır; mevcut core'a eklenecek LOC değildir. Modül sınırları çakışabilir; mevcut dosyalar ölçülmeden tahminden 1.815 satır doğrudan çıkarılmaz.

Stack puanı 10 üzerinden öznel mimari uygunluk değerlendirmesidir. Ağırlıklar: sadelik %25, kontrol %25, mevcut projeye uyum %20, geliştirme %20, genişleme %10. Kontrol puanı uygulama güvenliği sertifikası değildir.

| Stack | Sadelik | Kontrol | Uyum | Geliştirme | Genişleme | Ağırlıklı |
|---|---:|---:|---:|---:|---:|---:|
| Mevcut TS core + Node/TS sidecar | 9 | 9 | 9 | 8 | 8 | 8,7 |
| Mevcut core + Pydantic AI Python sidecar | 7 | 9 | 9 | 9 | 9 | 8,5 |
| Mevcut core + PocketFlow Python sidecar | 8 | 8 | 8 | 7 | 8 | 7,8 |

Tercih neden değişti: Pydantic AI faydalı bir agent SDK'dır, fakat mevcut projenin TypeScript core ve Paseo plugin'ini koruma koşulunda tek runtime daha az operasyon yükü yaratabilir. Sıfırdan Python ağırlıklı üründe aynı puanlama başka sonuç verebilir.

## 11. Beklenen coder teslimi

- Tek sayfalık karar özeti.
- Hedef → UI → modül/fonksiyon → test → kanıt matrisi.
- Güncel kod envanteri ve gerçek açıklar.
- Mevcut plana küçük, hedefli revizyon önerileri.
- Seçilen/reddedilen alternatifler ve bağımlılık/maliyet etkisi.
- Veri modeli ve public sözleşmeler; uyumluluk/migration planı.
- P0/P1/P2 işler; her biri sahibi, dosyası, kabul testi ve rollback'iyle.
- Üretim/test/UI/adapter LOC ayrımı; ölçüm ile tahmin ayrı.
- Gerçek çalıştırma kanıtı, NOT_RUN ve kalan belirsizlikler.
- İlk uygulanacak küçük dilim; yetki gerektiren işlemler açık.

## 12. Son ilke

Disiplin, ajanı sürekli dürtmek veya sınırsız çalıştırmak değildir. Disiplin; açık komuta zinciri, uygulanabilir yetki, doğru sahiplik, bağımsız kabul, gözlenebilir durum ve kontrollü toparlanmadır. Az ajanla güvenilir teslim, çok ajanla belirsiz faaliyet üstünlüğünden daha değerlidir.