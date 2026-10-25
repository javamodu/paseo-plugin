# Kapsül — tek, sade, dayanıklı uygulama planı
> Kullanıcı kapsam güncellemesi: [ADR-012](governance/ADR-012-local-runtime.md) ile Paseo-opsiyonel local worker yolu kabul edilmiştir. Aynı core/store/receipt kapıları; [tam bağımsız kabul](../gpt/RUNTIME.md). Aşağıdaki eski MVP “ikinci runner yok” sınırı bu dar ekle supersede edilir. Gerçek local coding/security PASS veya yenilenmiş release onayı iddiası değildir.
## 1. Kesin yön
Bağımsız local-first web uygulaması. Tek control service. İlk runtime Paseo.
Paseo yalnız adapter'dır; kapsülün DB'si, kanıtı, bütçesi ve onayı Paseo'ya ait değildir.
Plugin, masaüstü kabuğu, SSH fleet ve ikinci tool-running runtime MVP'de yok.
Paseo daemon arayüzü kapanırken çalışabilir; bizim control process'imiz ayrı OS servisi olur.

Hazır ürün kullanmak hâlâ en az yeni kod yoludur: yalnız kullanmak isteyen Agent Orchestrator'ı
önce denemeli. Bu plan ise kendine ait kapsül/politika/kanıt sözleşmesi isteyen kullanıcı için
dar bir control layer tasarlar. Büyük bir hazır IDE'yi fork edip çekirdeğini değiştirmek seçilmedi.
Burada “en az kod”, gereken güvenilirliği atlamak değil; terminal/IDE/daemon/model tool loop'unu
yeniden yazmamaktır. Bu paket mevcut repo kararlarını otomatik değiştirmez.

## 2. Kullanıcı döngüsü
Hedef → manager plan taslağı → insan plan onayı → izole coder → dondurulmuş aday →
bağımsız evaluator → gerekiyorsa sınırlı repair → insan kabulü.
Manager günlük composer'ın arkasındadır. Bağımsız görevler paralel dispatch edilir.
Bir kapsül bir hedef; birden fazla node, worker ve attempt taşıyabilir.
İç alt ajan görünürlüğü/bütçesi garanti değilse gizli nesting kapalı; yönetilebilir child ayrı attempt.

## 3. MVP sınırı
- Tek kullanıcı, tek control host, bir repo/project bağlamı; iki kapsül paralel.
- Global iki execution slot ile başla; tavan kullanıcı ayarı. Manager ve evaluator kaynakları ayrı sınırlanır.
- Tek recipe: `repair-v1`. Bugfix/küçük özellik, sabit acceptance suite, insan merge.
- Bir event-driven manager, bir coder, deterministik evaluator ve supervisor.
- Reviewer/vekil yalnız görsel/öznellik veya yüksek riskli rubric kapısında çağrılır.
- Ham LLM adapter yalnız plan/özet/rubric; file/tool yetkisi ve coder iddiası yok.
- Merge/deploy/production credential, otomatik profil değiştirme ve serbest workflow editörü yok.
- Güvenilmeyen repo veya gerekli sandbox capability'si yoksa otomatik kod yürütme yok.

## 4. Stack — alternatif menüsü değil
Node.js 24 LTS + TypeScript. Fastify. TypeBox/Fastify'nin Ajv doğrulaması.
SQLite/WAL (`node:sqlite`), SQL migration; ORM yok. React + Vite + sade CSS.
Paseo TypeScript SDK: `@getpaseo/client`; capability smoke sonrası tam sürüm lockfile'da pinlenir.
Vitest + Playwright geliştirme/test araçları. Native fetch; ek HTTP client yok.
Redis/Kafka/Temporal/Kubernetes/Next.js/LangGraph/vector DB/React Flow/Zustand yok.
UI state küçük React hook'ları; server state snapshot + tek SSE; ayrı cache framework'ü yok.
TypeBox contract source implementasyonda tek otorite olur; JSON export ona bağlı üretilir.
Paket JSON Schema'sı onaylanabilir tasarım baseline'ıdır; uygulama sırasında iki bağımsız schema yazılmaz.

## 5. Güvenilirliğin vazgeçilmezleri
İlk gerçek spawn'dan önce: command dedupe, intent+outbox transaction, kalıcı STOP latch,
snapshot onayı, bağımsız evaluator ve unknown external result yolu.
Ekli JSONL tasarımlarından farklı olarak çalışma durumu DB'dedir; JSON/Markdown sadece export.
Cancel isteği cancel teyidi değildir. Slot doluluğu görev başarısızlığı değildir.
Atla başarı değildir. Bütçe bittiğinde repair otomatik başlamaz.
LLM çağrılarının yeniden çalışması aynı metni garantilemez; audit replay tool çağırmaz.

## 6. 80/20 arayüz
Kapsüller / Kararlar / Laboratuvar. Ayarlar ikincil.
Kapsül detayı: Özet / İşler / Kanıt / Geçmiş. Liste varsayılan; graph canvas yok.
Composer: açık bağlam + çalışma profili + metin. Model/rol/limit Gelişmiş'te.
Bir seferde tek belirgin eylem. Teknik trace yalnız istenince.
Özet: hedef, şimdi/ne yüzden bekliyor, kalan sınır, gereken karar, son doğrulanmış sonuç.

## 7. Model seçimi
Profil = model + runtime + prompt + tool/policy/evaluator sürümleri.
Önce capability/security kapıları; sonra bağımsız kabul, toplam maliyet ve süre.
İlk profil manuel sabit; ucuz model doğrulama kapısını kaldırmaz.
Model ID'leri canlı keşfedilir; “en iyi/ucuz” isimler ölçülmeden default ilan edilmez.
Model fallback önceden izinli, yeni attempt ve kayıtlı olaydır.

## 8. İlerleme ölçütü
LOC/saat veya ajan adedi değil: kabul edilen görev oranı, kabul edilmiş işin toplam maliyeti,
elapsed time, insan rework ve güvenlik/recovery kusurları.
Planın düşük LOC'si performans üstünlüğü değildir. İlk dikey dilimden sonra tahmin kalibre edilir.

## 9. Build sırası
S0 contracts+capability+sandbox probe → S1 güvenli headless dikey dilim →
S2 sade gerçek UI → S3 iki kapsül + fault injection → S4 küçük benchmark.
Güvenlik ve idempotency S3'e ertelenmez. S3 onları stres altında genişletir.
İkinci full tool runner ancak aynı contract/evidence kapılarını geçince ayrı karar olur.

## 10. Tasarım ve release
Bu paket final tasarım önerisidir. İnsan onayı kaydı yokken “kilitlendi” değildir.
Offline fixture PASS production PASS değildir. Gerçek release kapıları tests/ACCEPTANCE.csv'dedir.
