# TEK-SATIR + MOBİL + İNCE dalgası — ağaç kontrol satırı tek satır, %100 mobil dokunma, ince konuşma başlığı

Tarih: 2026-11-04 17:17 · Yazıcı: KURMAY-1 (8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7, glm53u-claude) · Durum: KAPALI

## Emirler (verbatim)

1. «tek satıra insin projeler üstü»
2. «alt satıra geçme .. ayrıca reposnisve mobile touch olmalı %100»
3. «metin kutusu içine eklediğin  aktif konuşma sadece metin üstünde  ince biçimde gelsin»

## Ne yapıldı

- **TEK SATIR** (emir 1 + emir 2'nin ilk yarısı): `.agacAraclar` `flex-wrap:nowrap` (sarma YOK — kontrol satırı alt satıra GEÇMEZ) + `gap:6px`; `.agacAramaKutusu` `min-width:0` (arama kutusu esnek — dar ekranda kendi içeriğiyle satırı zorlamaz, placeholder kırpılır). Arama + yalnız-aktifler + sıralama TEK satırda birlikte yaşar.
- **MOBİL %100** (emir 2'nin ikinci yarısı): `@media (pointer:coarse)` bloğuna 5 kural — `.agacAraclar` gap 8px · `.agacAramaKutusu` `min-height:var(--min-dokunma)` [44px] + font 14px + padding 6px 10px · `.agacFiltreEtiket` 13px + padding 8px 0 + min-height 44px · onay kutusu 18×18px · `.agacSiralamaSec` min-height 44px + 13px + padding 6px 4px. Dokunma hedefi 44px = panelin mevcut standardı (`--min-dokunma`; sekme/proje-başlığı/ajan-satırıyla aynı). Viewport meta zaten mevcuttu (satır 5: `width=device-width, initial-scale=1`).
- **İNCE BİÇİM** (emir 3): «metin üstündeki aktif konuşma» = chatBaslik satırı (mesajların üstünde — konum zaten doğru; kalınlık giderildi): 12px/600 → **11px/400/var(--ikincil)**, min-height 20px, `white-space:nowrap` + `overflow:hidden` (uzun başlık taşmaz); `.chatBaslikSaglayici` `font:400 10px var(--mono)`. Composer hedef seçici DOKUNULMADI — o gönderim hedefinin SEÇİM aracıdır, gösterim değil; sökülmesi mesajın nereye gittiğini belirsizleştirir.

## Kanıt

- **Tam kapı**: `node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs` = **314 tests / 314 pass / 0 fail / EXIT=0** (kapanış öncesi taze koşum, 17:17). Dalga yeni TEST doğurmadı — pinler mevcut testlere gömüldü: 51ab'ye TEK SATIR + MOBİL kaynak-pinleri, 51g-bölgesine İNCE BİÇİM pini (sayı 314 sabit).
- **Servis kanıtı** (server.js DOKUNULMADI → restart YOK): `GET http://127.0.0.1:4937/ordu` **HTTP 200 · 139.574** (Content-Length serisi: SIRALAMA 135.247 → ARAMA 138.188 → bu dalga 139.574) · `flex-wrap:nowrap` serviste ✓ · ince başlık (`font-size:11px; font-weight:400`) serviste ✓.
- **Canlı DOM + PNG: YAPILAMADI** — Paseo browser automation host hâlâ bağlı değil (SIRALAMA + ARAMA dalgalarıyla aynı durum — üçüncü dalga üst üste). Davranış kaynak-pin + servis doğrulamasıyla ölçüldü; host geri gelirse PNG eklenebilir — tahminle kapatılmadı (dürüst eksik).
- **LOC DELTA (K-0062)**: pano/ 17.632 → **17.650, net +18** (dalga tavanı +200 ✓; 18.000 tavanına doluluk %98,1).
- **Z1**: CODEMAP taze (**872 dosya**, 119 satır) + saglik 16 OK / 2 EKSIK / 1 SARI — üç bayrak da ÖNCEDEN VARDI (REHBER EKSIK = dosya reorganizasyonu; gelen-kutu sidecar 1; kabul defteri SARI 31 hermetik); bu dalga hiçbirini üretmedi. **Sayım dürüstlüğü (kök neden kaynakta)**: `codemap.ps1` yalnız `.md` + kod uzantılarını sayar (satır 17-22 — `.json`/`.html`/`.png` HİÇ sayılmaz). Dizi: SIRALAMA 869 → ARAMA 870 → 17:14 ölçümü 871 — her dalganın yenilemesi kendi OZET.md'inden ÖNCE koştuğu için sayı bir adım geride taşıyordu (her +1 = önceki dalganın OZET.md'i). Bu dalganın yenilemesi rapor yazımından SONRA koştu: **872 = 871 + bu dalganın OZET.md'i** (tek-satir.json uzantısı gereği hiç sayılmaz) — ilk kez tam güncel sayı.

## Kapsam

pano/ordu-panosu.html M · pano/ordu-panosu.test.mjs M (51ab +2 pin grubu · 51g-bölgesi +İNCE pini) · raporlar/pano-tek-satir-2026-11-04/ YENİ · CODEMAP.md M · STATE_BOARD.md M

## Notlar

- Emir 3 yorumu: «metin kutusu İÇİNE eklediğin aktif konuşma» — gösterim zaten mesajların ÜSTÜNDE (chatBaslik); composer'ın İÇİNE ekstra gösterim konmadı (hedef pill'i seçim aracıdır, çıkarılamaz). «İnce biçim» = 11px/400 ikincil.
- Bu kayıt YERELDİR — push ayrı emir (K7; birikim 64 → bu committe 65).
