# Kapsul-Master-v4.0-Stable-Core-Design — derin analiz (2026-10-14)

Çerçeve v3.2 (sabit 15 alan). Etiketler: TASARIM-EKSIK / UYGULAMA-EKSIK / KANIT-EKSIK / BASARISIZ. Canlı kanıt yok → tavan 8. (R)=resmî ölçüm (bu turda çalıştırıldı/diskten doğrulandı), (T)=tahmin.

## Doğrulanan iddialar (R)
- `npm run test:legacy-reference` → exit 0: domain 32/32 PASS + autonomy 62/62 PASS (reference/domain.mjs + reference/autonomy.mjs, v3 ile SHA256-IDENTICAL).
- `npm run check:package` → exit 0: PASS; 113 dosya hash'lendi, 20 baseline dosyası SHA-pinli korunmuş, 8 tasarım negatif fixture'ı reddedildi, "20 NOT_RUN" closure ve PENDING approval beyanıyla.
- ACCEPTANCE.csv 52/52 NOT_RUN; NATIVE-HOST-ACCEPTANCE.csv 8/8 NOT_RUN; PASEO-INDEPENDENCE-ACCEPTANCE.csv 8/8 NOT_RUN; delivery/CLOSURES.csv 20/20 DRAFT/NOT_ASSESSED/NOT_RUN/UNKNOWN. Hiçbirinde sahte PASS yok.
- 148 KB şema iddiası: contracts/schema.json 147.913 bayt ≈ 148 KB (SI) — doğru; v3 ile byte-identical ve RETAINED-BASELINE.json'da SHA-pinli.
- Casebook/karantina: database/001-initial.sql CHECK(QUARANTINED/VALIDATED/REJECTED) + learning.example.json OFF_UNTIL_ACCEPTANCE/QUARANTINE_AND_VERIFY/HUMAN_ONLY + MASTER-PLAN §10 (poison/expiry/revoke) + CL19 closure — tasarım uçtan uca tutarlı, runtime yok.
- Kanıt hijyeni: eski v3 evidence'ı evidence/legacy-v3/ altına taşınıp "tarihsel, v4 kanıtı değil" etiketlenmiş; REVISION-STATUS.json changedFiles listesi diskle birebir örtüşüyor.
- validate-package.py kendi sınırını beyan ediyor: "subset shape checker; Ajv/TypeBox compliance veya semantic security değil" — dürüst sınırlama.

## Alan tablosu
| Alan | Ağırlık | Puan | Durum |
|---|---:|---:|---|
| Teslim | 14 | 8 | KANIT-EKSIK — CLOSURES.csv 20 kanıt kapanışı + 4 eksenli durum sözlüğü (RELEASE-EVIDENCE) + teslim öncelikli fazlama (S0→S5); canlı teslim CL09 NOT_RUN |
| Yetki/güvenlik | 13 | 8 | KANIT-EKSIK — headless auth broker GUI'den önce, aktör ayrımı, worktree≠sandbox, CL07/CL08 live security kapıları; koşulmamış |
| Halüsinasyon/kanıt | 10 | 8 | En güçlü alan: legacy/current evidence ayrımı, SHA-pinli baseline, "checkbox PASS üretmez", dış rapor iddiası receipt'siz PASS taşınamaz; bugün koşulan check:package ile kısmen kanıtlı (R) |
| Long-run/recovery | 10 | 8 | KANIT-EKSIK — crash-gap analizi, UNKNOWN=no-respawn, iki-bağlantı contention, CL02–CL06 sıralı fault kapıları; reference mantık yeşil (R) |
| İzleme | 8 | 6 | UYGULAMA-EKSIK — iki ince yüzey tasarımı net (snapshot/cursor/SSE, data-age, STOP intent/ACK/confirm ayrımı) ama UI v3 demosuyla byte-identical |
| Otonomi | 7 | 7 | BOUNDED_AUTO + grant-bound yaşam döngüsü (CL11); oto-kabul negatifleri reference'ta PASS (R) |
| Manager | 6 | 7 | docs/12 ayrı manager/provider seçimi; manager event-driven, kendi yetkisini değiştiremez; admission deterministik |
| Handoff | 5 | 7 | UYGULAMA-EKSIK — kapalı handoff.schema.json (10,9 KB) + örnek + 8 negatif fixture (check:package ile reddi doğrulandı, R); production TypeBox'a taşınmamış, paket bunu açıkça söylüyor |
| Coding | 5 | 6 | Üç recipe tek control hattı; scope-diff + protected test; gerçek runner yok (CL18 NOT_RUN) |
| Reasoning | 4 | 5 | Read-only reasoning + citation/known-answer planı (CL17); ölçülmüş rubric yok |
| Paralellik | 4 | 6 | Tek coder ile başla, iki slot ancak contention/fault kapısı sonrası (CL14); child accounting zorunlu |
| Schedule | 4 | 7 | UTC INTERVAL/ONCE + unique(scheduleId,revision,scheduledUTC) + SKIP misfire + DST dürüstlüğü; reference testler PASS (R), durable schedule CL15 NOT_RUN |
| Memory | 4 | 7 | Karantina→VALIDATED casebook + poison/expiry/revoke negatifleri (CL19) + eşlenmiş var/yok deney protokolü; retrieval authority değil data |
| Hız/maliyet | 3 | 7 | METRICS.md: payda disiplini, unknown=null+coverage, accepted=0→null, tam maliyet (manager/child/repair/eval) muhasebesi; ölçüm pilotu S1'de |
| Taşınabilirlik | 3 | 7 | D10/D11: Paseo-bağımsız core, UIHostAdapter≠RuntimeAdapter, alternatif runner aynı trust kapılarıyla; native desteklenmiyorsa BLOCKED_CAPABILITY dürüstlüğü |

**Ağırlıklı toplam: 70,2 / 100**

## İlk 3 açık
1. Production runtime yok (UYGULAMA-EKSIK): 20 closure'ın tamamı NOT_RUN; tek gerçek repair görevi (CL09) bile koşulmamış — paketin kendi "Hiçbir şey bugün PASS değil" beyanıyla uyumlu.
2. Handoff/schema production'a taşınmamış (UYGULAMA-EKSIK): handoff.schema.json ve 148 KB draft schema, TypeBox SSOT'a migration review'u bekliyor; şimdilik standalone tasarım artifact'ı.
3. UI ve native yüzey gerçek backend'siz (UYGULAMA-EKSIK + KANIT-EKSIK): ui/ v3 demosuyla byte-identical; N01–N08 native kapıları NOT_RUN, capability probe yapılmamış.

## v3 → v4 karşılaştırması
v4, v3'ün çalışan çekirdeğini (schema, reference, testler, UI, SQL) byte-identical koruyup üstüne tamamen "kanıt disiplini" katmanı eklemiş: 20 maddelik CLOSURES.csv faz→kanıt eşlemesi, 4 eksenli durum sözlüğü (DESIGN/IMPLEMENTATION/EXECUTION/RESULT — bir eksen diğerini otomatik doldurmaz), kapalı handoff sözleşmesi + 8 negatif fixture, 15 metriklik ölçüm sözlüğü (payda/maliyet/pilot kurallarıyla), CORE-STABILITY invariant listesi + PR kapısı ve validate-package.py ile kendi kendini statik doğrulama. En kritik iyileşme epistemik: v3'te evidence/ altında "güncel" gibi duran v3 kanıtları v4'te legacy-v3/ altına taşınıp açıkça "v4 kanıtı değil" denmiş; REVISION-STATUS.json değişen dosyaları eksiksiz listeliyor. Sonuç: v3'ün yapısal açıkları (handoff yok, kapanış defteri yok, Paseo gerilimi) üçü de kapatılmış; buna karşılık hiçbir yeni runtime kanıtı üretilmemiş — v4 daha iyi tasarlanmış bir sıfır-implementasyon, skor farkı (+7,0) tamamen tasarım/dürüstlük kalitesinden geliyor.

## Hüküm
v4.0-draft, " Stable-Core-Design" adının hakkını veren, kendi kanıt eksikliğini her yüzeyde (README, STATUS, CLOSURES, validate çıktısı) tutarlı biçimde beyan eden nadir plan paketlerinden; bugün koşulan iki script (exit 0/0) legacy çekirdeğin hâlâ yeşil olduğunu ve paket bütünlüğünün doğrulanabilir olduğunu gösteriyor. 70,2 puanın tamamı tasarım kalitesi + offline reference kanıtıdır; canlı kanıt tavanı (8) dört ağır alanda (Teslim, Yetki, Halüsinasyon, Recovery) skoru bastırıyor — CL01–CL10 kapanmadan bu tavan kalkmaz ve kalkmamalı.
