# M2b — rename talebi zinciri ÇEKİRDEK + SERVER UCU (K-0065 deseni)

Tarih: 2026-11-04 · Ajan: coder (M2b brifi — KURMAY 8cc610a4) · Durum: KOD TAMAM, COMMIT YOK (tek elden KURMAY'da)

## Değişen dosyalar (4)

1. **pano/ordu-rename.mjs YENİ** (~100 satır) — ordu-spawn.mjs deseni: `talepEkle` (hedefTip "proje"|"oturum" RED · hedef dolu ≤200 · yeniAd dolu ≤200 — KESME YOK; talepId/zaman içeride üretilir) + `sonucEkle` (islandi|hata; EN SON sonuç kazanır) + `kuyrukOzet` (salt-okur read-model; bozuk satır SAYILIR; **yeniAd kısa alan — TAM okunur**, kısaltma penceresi YOK; KUYRUK_TAVAN 200 okuma penceresi). Kuyruk yolu parametre; env `ORDU_RENAME_KUYRUGU` server.js'te.
2. **pano/server.js M** (+~90) — aliased import (renameTalepEkle/renameKuyrukOzet) + `RENAME_KUYRUGU`/`RENAME_ARALIK_MS` (10sn)/`sonRenameTalebi` (hedefTip|hedef anahtar) + **POST /api/rename-talebi** (403 → 401 → 400 json/hedefTip/hedef-boş/yeniAd-boş → 422 yeniAd>200 → 400 whitelist [proje: projelerTara `p.dizin`; oturum: `hedefBeyazListe`] → 429 → 500 kuyruk yazımı → talep kuyruğa + KURMAY kısa bildirimi → 200 iletildi | 202 iletilmedi [talep kuyrukta KALIR]) + **GET /api/ordu/rename-kuyruk** (salt-okur token'sız) + hareket defteri tur `"rename-talebi"` (M1; token YAZILMAZ).
3. **pano/ordu-metrik.mjs M** — `HAREKET_TURLERI`'ye "rename-talebi" (tek satır; ordu-metrik.test.mjs dizini pinlemediğinden kırmızı YOK).
4. **pano/rename-ucu.test.mjs YENİ** — bloklar 85-88 (spawn-ucu.test.mjs deseni: çekirdek RED'ler + kuyrukOzet + izole server RED zinciri + uçtan-uca 202 + kaynak pinleri).

## Test sonuçları (2 koşu — bütçe ≤4 içinde)

- **Kendi paketi**: `node --test pano/rename-ucu.test.mjs` = **4/4 PASS, EXIT=0**.
- **TAM KAPI**: `node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs` = **271 tests / 268 pass / 3 fail / EXIT=1**. Üç düşüş de `pano/ordu-panosu.test.mjs`'te (KURMAY'ın dosyası — M2b brifinde bu ajana YASAK):
  - (a) **test 46 satır 878 + test 51 satır 1086**: POST-uç-sayısı pini 6 bekliyor; server.js'te artık 7 (bu işin `/api/rename-talebi`'si — bilinçli genişletme; **pin 6→7 güncellemesi KURMAY'da**).
  - (b) **test 51v satır 2676**: «vm uçuş kilidi: 3 istek yalnız (bekleyen: 4)» — HTML VM pini; `ordu-panosu.html` working-tree'de kirli (KURMAY'ın devam eden M2a işi — `hepsiniYukle` artık 4+ fetch başlatıyor, test 3 bekliyor). **Bu ajan HTML'e dokunmadı — diff'ten bağımsız.**

## Dürüst eksikler

- Brifin RED zincirinde kurmay-çözülemez dalı 503 YOKTU (spawn-talebi'den fark) → **202 uygulandı** (talep KUYRUĞA düşer, kaybolmaz; hareket hedef = `hedefTip:hedef`) ve test 87'de pinlendi. Bilinçli yorum — KURMAY onaylamazsa 503'e çevrilir.
- 200 «iletildi» yolu izole koşulamadı (köprüsüz simülasyon 202'yi ölçer — Dalga B emsali; gerçek köprü gerekir).
- Canlı 4937'ye DOKUNULMADI: server.js değişti → rename ucu canlıda restart'a kadar HİZMET DIŞI (restart [insan] onayıyla — spawn Dalga B emsali).
- LOC ≈ +390 (ordu-rename ~100 + test ~200 + server.js ~90) — dalga tavanı +200 AŞILDI; salt-ekleme gerekçesi: mevcut dosya dokunuşu yalnız server.js + ordu-metrik 1 satır.
- COMMIT ATILMADI (brif talimatı — tek elden KURMAY'da). Tam kapıda 271 test göründü (baseline 266 + bu işin 4'ü + muhtemelen M2a'nın 1'i) — kapanışta yeniden ölçülmeli.
