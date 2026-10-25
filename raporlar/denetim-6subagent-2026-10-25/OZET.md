# DENETİM — 6-SUBAGENT (F4 öncesi) — 2026-10-25 19:00

Tetik: kullanıcı — faz başlamadan döküman/kod drift · mimari drift · fake green · atık · dışarıda kalan taraması. Yöntem: 6 salt-okur doğrulayıcı (EK-3 brief) + tek yazıcı; hiçbir düzeltme UYGULANMADI (yalnız tespit; karar insanın).

## Bulguların kanıt zinciri
Her subagent kendi kanıtını ölçtü (Test-Path, grep sayımı, npm test EXIT, Import-Csv sayımı). Toplam 58 ham bulgu → 20 maddeye indirildi (dedupe: MD-01=DKD-01/02, MD-05=DKD-03/04/05, FG-02=FG-03, DK-01 ile DK-03..09 aynı kök).

## EKSİKLER LİSTESİ (öncelik sırasıyla)

### A. Kayıp / dışarıda kalan (F4'ü bloklar nitelikte)
1. **kararlar/K-0029.md ve K-0036.md diskte YOK** — 3'er yerden atıflı (handoff, plugin/surumler/v0.17/kilit.json, STATE_BOARD:26). K-0036 = ücretli-yok politikası, kayıtsız kalıyor.
2. **Ham kanıt verileri eski evde, ordu/arsiv'de karşılığı YOK** (ADR §bağlam-sürekliliği m.7 ihlali): `silinecek-task-graph/benchmark/glm53-wrapper/runs/` 24 ham koşu (702K) · `.bench-data/state/home/config/` 4 dizin · `ordu-core.zip` (2.1MB). Rapor özetleri kopyalandı, ham veri kopyalanmadı.
3. **silinecek-task-graph versiyonsuz** (`.git` yok) — F4 silme penceresi açılırsa A-2 kalıcı kayıp; taşıma F4'ten ÖNCE olmalı.

### B. Fake green (yeşil görünen kapılar)
4. **saglik.ps1:110-115 cache-hit kapısı bozuk metrikle hep yeşil** — %175.1 (değerler 0.2–107920 arası ham sayı, yüzde değil); eşik ayrıca hedefler.json'da 60→40'a indirilmiş (FG-01+FG-08).
5. **Kabul-oranı kapısı öz-bildirimli** (saglik.ps1:120-127): plugin'in KENDİ yazdığı telemetriden %99 OK; gerçek defter kabul.csv'de **38/115 NOT_RUN (%33)**, canlı-doğrulanmış yalnız 27/115 = **%23**; 43 kayıt GECTI_HERMETIK (canlı kanıtsız yeşil) (FG-02/03).
6. **STATE anlatısı ile saglik gerçeği ayrıştı**: son turların "17 OK / 1 EKSIK" iddiası bayat — güncel ölçüm 16 OK/2 EKSIK (Jsonl'siz) veya 18 OK/3 EKSIK (Jsonl'li: dürtme 197/1077 kırmızısı backlog'ta görünmüyor). Kök neden: handoff commit zincirinde `*> $null` ile çıktı maskelendi — exit 1'i K-0039'e yormak (FG-04/06).

### C. Kırık zincir / bayat anlatı (canlı dokümanlar)
7. **HANDOFF-1815 zincir atfı kısaltılmış ad taşıyor** ("1640 → 1716" tam ad değil) → `zincir-kontrol.ps1` EXIT=1 **KOPUK**, saglik EKSIK. B-6'nın tetikleyicisi. Düzeltme: yeni halkada tam ad + zincir kontrolü tazelensin (append-only: 1815 değiştirilmez).
8. **core/KULLANIM.md:4 eski eve koşturuyor** ("`D:\Vibecode\silinecek-task-graph\ordu-core` kökünden koş") — yeni ajan yanlış yerde `npm test` koşar.
9. **Kimlik bayatlığı**: README.md:1 "paseo-plugin" · pano/README.md "izole/ayrı proje" · pano/BLUEPRINT.md:4 "paseo-plugin/plans" · ANAYASA A4 "şu an v2.0" vs rehber v2.1 · admin-onboarding.md:85/96 + plans/PLAN.md:6 + FERMANLAR.md:15 bayat atıf/durum satırları · F3-TASLAK "hâlâ" satırları kapanışla çelişiyor (task-kapanış notu eksik) · plans/SSOT-INDEX.md:23 olmayan `silinecek-task-graph/ordu-core` yolunu gösteriyor.
10. **CODEMAP sapması**: HEAD damgası bir commit geride (bootstrap gecikmesi — CODEMAP'ı taşıyan commit kendi hash'ini bilemez; açıklanabilir) AMA dizin sayıları da uyumsuz (arsiv 37↔200, core 78↔108, plugin 63↔93, referans 50↔82, pano 5↔10, gelen-kutu 9↔17, surumler 6↔12) — kısmen tracked-vs-disk sayım yöntemi, kalıcı ise üreticide düzeltme gerekir.

### D. Atık / kopya kod
11. **`ajanTemizle` 9 modülde aynı adla export** (finishgate, kalite, brief, onboarding, kapsam, modlar, pitbull, telemetry, loopguard) — DERSLER "duplike drift eder" deseni.
12. **plugin/client/web.ts ölü modül** (0 import; 2026-10-13 denetiminde de tespit edilmiş, hâlâ duruyor).
13. **core/test/live-gates-v4.test.ts hiç koşulmuyor** — package.json test scriptinde yok (36/37).
14. Yalnız otomatik CODEMAP + eski raporlarla anılan 3 betik (omp-kurulum-kapisi, pi-erisim-kapisi, model-katalog) + bench-claude.mjs bilinçli kopya (skorlayıcılar bench.mjs ile birebir) + pano/.pano-serve.js geçici yardımcı.

### E. Yapı fazlalıkları (ADR hedef ağaç sapması)
15. **core/ içinde 21 tracked runtime/veri dosyası** (core/data, core/veri, core/evidence, core/raporlar) — ADR S7 "repo runtime verisi biriktirmez" ihlali.
16. plans/arsiv (7 eski plan) + plans/mockup — ADR'ye göre kök arsiv/ altında olmalı.
17. Kökte hedef-ağaç-dışı öğeler: sorular/, surumler/ (v0.4..v0.8 tracked), hedefler.json (HEDEF ikinci temsili), 8 kök dokümanı (PASEO-VERIMLILIK-PLANI, admin-onboarding, LLM-PROVIDER-REHBERI, FERMANLAR + 3 SABLON).
18. referans/ içindeki dizin adı ADR'deki "kapsul-final" ile birebir eşleşmiyor (kapsul-final-v2.0.0-notio).

## Olumlu doğrulamalar (denetim tazeledi)
- Plugin `npm test`: **EXIT=0**, 4/4 dosya, 387 ok — c4f7043 iddiası DOĞRU.
- Git geçmişi kesintisiz (216 commit, ilk halka d781995); bundle'lar (ordu-core + paseo-verimlilik) arsiv/history'de.
- SSOT tekliği temiz (STATE/DERSLER/HEDEF/PLAN tek — arsiv kopyaları kasıtlı).
- Eski ölü kapı (D2-09) kaldırılmış, yerine geçen kontrol 18/19 eşleşme — canlı; gelen-kutu sema 8/8 geçerli.
- saglik.ps1 kendisi dürüst (EXIT=1, EKSIK'leri raporluyor) — yeşil görüntü anlatıda ve bozuk metrikte.

## Önerilen sıra (hiçbiri onaysız başlamaz)
1. **Zincir onarımı** (madde 7): yeni tam-ad zinciri tazele → saglik tek EKSIK'e dönsün.
2. **F4 HAZIRLIK taslağı** genişletilmiş: A-2/A-3 taşıma planı (ham bench + .bench-* + zip → arsiv/) + K-0029/K-0036 kayıtlarının açılması.
3. **Fake-green tamiri** (B): metrik düzeltme + kabul.csv NOT_RUN azaltma turu.
4. C/D/E doküman-atık temizliği (tek tur, dosya-bazlı commit).

Damga (R): 2026-10-25 19:00, ajan = devralan (Claude glm-5.3; 6 salt-okur subagent), commit = bu-turun-commit-i.
