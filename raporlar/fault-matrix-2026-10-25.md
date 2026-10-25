# FAZ-3 fault-matrix (hata-enjeksiyonu matrisi) — 2026-10-25

İlgi: V3-S3.2 (kabul.csv: fault-matrix raporu + yedekten dönüş) · plans/SAVASA-HAZIR-PLAN-2026-10-25.md FAZ-3 · K-0046 (kanıt-üçleme; NOT_RUN ≠ FAIL; geri-doldurma YASAK).

Etiketler: (R) resmî ölçüm (bugünkü makine EXIT koşumları, loglar `raporlar/kanit-hedef/`) · (T) tahmin.

Amaç: sistemin hangi arıza TÜRÜNE hangi GERÇEK davranışla karşılık verdiğini tek tabloda toplamak. Her satır bugün gerçek koşulmuş bir enjeksiyon noktasıdır (uydurma/simülasyon satırı YOK); "canlı bacak" = gerçek süreç/gerçek zaman/gerçek ağ kullanılarak bugün koşulan test.

## Hata-enjeksiyonu matrisi (R — hepsi bugünkü koşum)

| # | Arıza türü | Enjeksiyon noktası (canlı) | Gözlenen davranış | Kanıt |
|---|---|---|---|---|
| 1 | Manager süreci kill-9 (SENDING anında) | f3-crash.test.ts V3-S1.2: manager AYRI süreç, SENDING durable yazıldıktan sonra SIGKILL | SENDING kalır; kör re-spawn YOK; reconcile UNKNOWN'a yükseltir | core-test-faz3b log |
| 2 | Worker doğarken manager kill-9 | f3-crash.test.ts V3-S1.4: SENT commit EDİLMEDEN kill | latch kill-9 sonrası KORUNUR; dk-1 registry'den RECOVER; resume sonrası TEK spawn | core-test-faz3b log |
| 3 | Belirsiz spawn (yanıt kaybı) | f3-live.test.ts F3-A: süreç doğdu, launch yanıtı kayboldu | UNKNOWN'a çekilir; kör re-spawn YOK; attempt peşinen gömülmez | bugünkü tam suit |
| 4 | Worker SIGKILL ile ölür | f3-live.test.ts F3-A + capacity-canli.test.ts: gerçek pid SIGKILL | reconcile DEAD_CONFIRMED → FAILED + slot RELEASED; çift etki YOK | bugünkü tam suit |
| 5 | SQLITE BUSY (kilit kalıntısı) | f3-crash.test.ts: önceki SIGKILL sonrası manager açılışı | openStore 20x100ms busy-retry; 150ms OS tanıtıcı penceresi | DERSLER 165 + core-test-faz3b log |
| 6 | Sahte-PASS (exit-0, protokolsüz) | evaluator-canli.test.ts: GERÇEK süreç exit-0, stdout protokol değil | FAIL; kanıt defterine FAIL olarak düşer | core-test-faz3d log |
| 7 | Sahte-PASS (exit-0 + tests=0) | evaluator-canli.test.ts: GERÇEK süreç tests=0 protokolü | FAIL (exit-0 YETMEZ); 0-test sahte yeşil RED | core-test-faz3d log |
| 8 | Webhook alıcı ölür (bağlantı reddi) | notify-canli.test.ts: alıcı SIGKILL, sender gerçek curl | retry 2 → DEAD (attempts=3, gerçek hata nedeni) | bugünkü tam suit |
| 9 | Webhook sırrı sızdırma girişimi | notify-canli.test.ts: sir içeren govde | tel + disk redakte (enqueue-anı maskelama) | bugünkü tam suit |
| 10 | Zaman aşımı (gerçek) | benchmark-canli.test.ts: sonsuz bekleyen çocuk + gerçek timer | SIGKILL + tam paydada timeout (çıkarılmaz) | bugünkü tam suit |
| 11 | Scheduler duraklaması (misfire) | schedule-canli.test.ts: 900ms GERÇEK duraksama | MISFIRE_SKIPPED kalıcı; catch-up fırtınası YOK; yalnız en son occurrence | bugünkü tam suit |
| 12 | Lease süresi dolması | a09-canli.test.ts: GERÇEK 400ms lease, gerçek bekleme | devir fence bump; eski fence yazma RED; eski sahibin süreci ölür | bugünkü tam suit |
| 13 | Kapasite dolu (üçüncü worker) | capacity-canli.test.ts: 2 GERÇEK yaşayan worker, 3. dispatch | CAPACITY_WAIT yakmasız (attempt 0, spawn 0); ölümle slot doğar | bugünkü tam suit |
| 14 | Gerçek çökme → yedek/restore | m16-canli.test.ts: GERÇEK writer SIGKILL, WAL'da asılı veri | checkpoint yedeği → restore birebir; kapılar canlı | bugünkü tam suit |
| 15 | Canary regresyonu (gerçek görev) | lessons-canli.test.ts: gerçek başarısız canary görevi | oto-REVOKE + geri-al; yeniden PUBLISHED RED | bugünkü tam suit |
| 16 | Ders süresi dolumu / bozuk tail | lessons.test.ts (hermetik) + lessons-canli replay | EXPIRED (lazy); bozuk son satır budanır | bugünkü tam suit |

## Yedekten dönüş zinciri (V3-S3.2 çekirdeği)

(R) `test/m16-canli.test.ts`: GERÇEK writer (ayrı node süreci) 5 satır yazar → SIGKILL ile ÇÖKERTİLİR (temiz kapanış yok — veri WAL'da asılı) → `backupStore` WAL-checkpoint(TRUNCATE) yedeği → `restoreStore` yeni eve → 5 satır BİREBİR + `user_version=4` korunur + kapılar canlı (global-stop geçişi 2 olay yazar). Hermetik tamamlayıcı: `m16-m03.test.ts` (yedek→orijinal SİL→restore zincir/event birebir; :memory: RED).

## Not (dürüstlük)

Bu matris core içi enjeksiyonları kapsar. Dış-bağımlılıklı arıza türleri (provider CLI çökmesi, telefon UI kaybı, çok-ajan yarışı) K3 sınıfındadır (triyaj `raporlar/faz3-triyaj-2026-10-25.md`) — kalıcı-açık listesine SAVAŞA HAZIR raporu ekiyle girecekler; bu belgeye GERİ-DOLDURULMAZ.

Koşum tabanı: tam suit 305/305 makine EXIT=0 (log `raporlar/kanit-hedef/core-test-faz3d-2026-10-25.log`; batch-5 sonrası koşum; batch-6 testleri eklendiğinde suit sayısı taze damgada güncellenir).
