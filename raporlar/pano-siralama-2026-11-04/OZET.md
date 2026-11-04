# SIRALAMA dalgası — ağaç kontrol satırı (yalnız-aktifler + 4 sıralama modu)

Tarih: 2026-11-04 16:52 · Yazıcı: KURMAY-1 (8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7, glm53u-claude) · Durum: KAPALI

## Emir (verbatim)

«ordu panelinde workspace üzerinde sağ üste sıralama ekleyelim sadece aktifler - en son güncellenenler -proje ismine göre şeklinde - ajan sayısına göre sırala şeklinde»

## Ne yapıldı

- **Kontrol satırı** ağacın tepesinde (`agacAraclar`): «yalnız aktifler» checkbox + 4 modlu select — select sağa yaslı (`margin-left:auto`, «sağ üste» tarifi).
- **4 sıralama modu**: `varsayilan` (aktif önce · isim — FAZ-F davranışı DEĞİŞMEDİ) · `guncel` (en yeni ajan `sonEtkinlikISO` azalan) · `isim` (saf alfabetik, tr locale) · `kayit` (ajan kayıt sayısı azalan). ORDU-önce + isim her modun SON anahtarı (stabil).
- **Yalnız-aktifler filtresi**: çalışan 0 projeleri eler; **ORDU istisnasız görünür** (komuta merkezi erişilebilirliği). Boş durum dürüst: «aktif proje yok (yalnız-aktifler filtresi açık — dürüst boş)».
- **Kalıcılık**: `ordu-agac-siralama` + `ordu-agac-aktif-filtre` (PANEL-SIFIR-1'in sökülen `ordu-agac-sira`'sından FARKLI adlar). Bilinmeyen değer yok sayılır (fail-closed).
- **typeof-güvence**: `agacYaz` diliminde tercih tanımsızsa varsayılan — mevcut VM testleri (ctx'i tercih sağlamaz) kırılmadan yeşil.

## Kanıt

- **Tam kapı**: `node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs` = **313 tests / 313 pass / 0 fail / EXIT=0** (312→313; yeni 51aa; 51f ctx'ine agacTercih eklendi — dilimi kontrol dinleyicilerini kapsar).
- **Servis kanıtı** (server.js DOKUNULMADI → restart YOK): `GET http://127.0.0.1:4937/ordu` HTTP 200 · 135.247 bayt · servis edilen HTML'de `agacAraclar` + `agacAktifFiltre` + `agacSiralama` + 4 option TAM (statik dosya — reload yeterli).
- **Canlı DOM + PNG: YAPILAMADI** — Paseo browser automation host bu koşuda bağlı DEĞİL (`list_hosts` → hosts: []). Davranış VM testlerinde ölçülü (agacYaz diliminde GERÇEK sort kodu koşar: 4-proje fixture × 6 tercih sıra doğrulaması). Host geri gelirse PNG eklenebilir — tahminle kapatılmadı (dürüst eksik).
- **LOC DELTA (K-0062)**: pano/ 17.385 → **17.535, net +150** (dalga tavanı +200 ✓; 18.000 tavanına doluluk %97,4).
- **Z1**: CODEMAP taze (869 dosya, 119 satır) + saglik 16 OK / 2 EKSIK / 1 SARI — üç bayrak da ÖNCEDEN VARDI (REHBER EKSIK = dosya reorganizasyonu; gelen-kutu sidecar 1; kabul defteri SARI 31 hermetik = bilinen backlog); bu dalga hiçbirini ÜRETmedİ.

## Kapsam

pano/ordu-panosu.html M · pano/ordu-panosu.test.mjs M (pin 1602/1603 güncelleme + 51aa yeni + 51f ctx) · raporlar/pano-siralama-2026-11-04/ YENİ · CODEMAP.md M · STATE_BOARD.md M

## Notlar

- Pin 1603'te PREFIX tuzağı çözüldü: `kaydet("ordu-agac-sira"` (kapanış tırnağıyla) yeni `kaydet("ordu-agac-siralama"` ile çakışmaz; regex `ordu-agac-(pasif|fa)\b` — `aktif` bilinçli yeni anahtar (`ordu-agac-aktif-filtre`) olduğu için aileden çıkarıldı.
- `sonEtkinlikISO` alanı GERÇEK (ordu-birlesim.mjs:662, `lastActivityAt`'ten üretilir — test 1047 kanıtlı) — guncel modu ölçüsüz/uydurma DEĞİL.
- Bu kayıt YERELDİR — push ayrı emir (K7; birikim 62 → bu committe 63).
