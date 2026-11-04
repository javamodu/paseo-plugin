# SEKME-MİNİMAL dalgası — kapanış raporu (OZET)

Tarih: 2026-11-04 · Yazıcı: KURMAY-1 (8cc610a4, koordinatör bizzat) · Dalga: pano sekme davranışı + minimal görünüm

## Emir (verbatim, operatör 2026-11-04)

1. «hem proje adına tıklayınca sekme açıyorsun hem konuşmaya tıklayınca öyle değil sadece konuşmaya tıklayınca sekme açmalı»
2. «şu üst sekmeleri sadece klasör adı olacak şekilde minimal yap kapanma artısını en küçük olarak değiştir az dar yer kaplasın sekme»

## Yapılan (pano/ordu-panosu.html — 10 kaynak düzenlemesi)

- Ağaç tıklama handler'ında `sekmeAc(dizin);` çağrısı SÖKÜLDÜ — proje başlığı yalnız akordiyon çevirir; sekme yalnız oturum (ajan) satırı tıklamasıyla.
- Sekme içeriği SADECE AD: durum noktası span'i söküldü; durum artık ağaç satırı + oturum kartı + sekme `title` özniteliğinde («ad — kimlik · status») yaşar.
- × (sekmeKapat): görsel 12×12px + 1px padding, `box-sizing:content-box` → hedef 14px (eski FAZ-S 28+12=40px). **K-0061 §5 (40px dokunma hedefi) OPERATÖR İSTİSNASIYLA küçültüldü** — geri istenirse K-0061'e dönülür.
- Daralma: sekmeAd max-width 180→110px · sekme butonu 232→150px · `#anaSekmeSerit .sekme` padding 0 8px→0 4px.
- Coarse-pointer `28px/8px` override bloğu söküldü (× her yerde 14px).
- Ölü CSS söküldü (`.sekme.anaSekme { gap:6px; }`).
- **KORUNAN:** FAZ-U ton dili (aynı projenin oturumları aynı renk — aynı günkü operatör fermanı) + anaSekmeGrup birimi + ORDU sabit sekmesi.
- **Bilinen durum:** proje-sekme makinesi (sekmeAc/projeSekmeHtml/küme gruplama) KAYNAKTA kalır ama UI'dan erişilemez (tek çağıran ağaç tıklamasıydı) — ARŞİV dalgasında söküm adayı; VM testleri makineyi hâlâ sınar.

## Kanıt (ölçülmüş)

- **Tam kapı:** `node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs` → **312 tests · 312 pass · 0 fail · EXIT=0** (13 test pini yeni davranışa güncellendi).
- **Canlı DOM** (izole panel http://127.0.0.1:4937/ordu, sekme 2f5c4d80, 1280×800):
  - Proje başlığı (D-Vibecode, 41 kayıt) tıklaması → sekme sayısı 3→3 DEĞİŞMEDİ; akordiyon açıldı (aria-expanded=true, agacCocuklar DOM'da) ✓
  - Oturum satırı (3f3584c0, PANEL-ANA-1) tıklaması → sekme AÇILDI (3→4) ✓
  - Sekmeler: genişlik 101/105/117px (≤150 tavan) · sekmeAd maxW=110px ✓ · padding 0px 4px ✓
  - ×: 12px×12px görsel + 1px padding, content-box; kutu 15×14px (subpiksel yuvarlama) ✓
  - Durum noktası: 3 sekme grubunda da YOK ✓
- **PNG kanıtı:** kanit-sekme-minimal.png (178.572 bayt) — imza bayt 0-7 `89 50 4E 47 0D 0A 1A 0A` ✓ + IHDR bloğu ✓; 1600×1000.
- **LOC DELTA (K-0062):** pano/ 17.373 → 17.385 = **net +12** (tavan +200 altında; 17.385/18.000 = %96,6).

## Kapsam

pano/ordu-panosu.html · pano/ordu-panosu.test.mjs · raporlar/pano-sekme-minimal-2026-11-04/ (bu rapor + JSON + PNG) · CODEMAP.md (taze) · STATE_BOARD.md (damga)

Makine-okunur yan dosya: sekme-minimal.json
