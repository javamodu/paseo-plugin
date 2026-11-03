# PANEL-KOMPAKT-1 — ordu-panosu.html kompakt redesign (rapor)

- **id:** PANEL-KOMPAKT-1 · **tarih:** 2026-11-03 · **yazıcı:** PANEL-KOMPAKT-1 (glm53u-claude; ajan COMMIT ATMAZ)
- **dispatch:** KURMAY-1 (8cc610a4) — kullanıcı steering 2026-11-03 + EK steering (TEK PANEL birleşimi)
- **kapsam:** 2 dosya — `pano/ordu-panosu.html` + `pano/ordu-panosu.test.mjs`. Başka hiçbir dosyaya dokunulmadı (server.js / paseo-kopru.mjs / ordu-birlesim.mjs / package.json DOKUNULMAZ — doğrulandı). PANO_TOKEN hiçbir dosyaya/loga yazılmadı. Commit/push YOK; 4937 sunucusuna dokunulmadı.

## Ne yapıldı

**Kompakt yoğunluk (steering 2026-11-03, ±2px tolerans):** baz 13px/1.4 · bölüm başlığı 15px/600 · mono 12px · kart padding 8-10px · kartlar arası 8px · özet şerit `auto-fit minmax(150px,1fr)`, rakam 22px/600, etiket 11px uppercase, her kart TEK satır değer · sekme 30px/12px · sekmeKapat 20px · ağaç düğümü 28px/12px, durum noktası 8px, girinti 12px · plan tablosu `table-layout:fixed` + `4px 8px` hücre + colgroup kolon genişlikleri (colSira/colKod/colAd/colRol/colDurum/colDizin; proje tablosu colKimlik/colEtiket/colDurum2/colEtkinlik/colSaglayici) · composer 12px, GÖNDER 40px (KISAT alt sınırı; select/input 44px dokunma KORUNDU) · radius 6/4 · kenarlıklar 1px `#e2e8f0` · gölge yok (yalnız `.agacAjan.secili` inset istisnası) · petrol yalnız vurgu.

**Taşma kesme (üç katman):** (1) CSS — her metin hücresi `overflow:hidden + text-overflow:ellipsis + white-space:nowrap` (ozetDeger/ozetAlt/gdDeger/gdEtiket/miniSatir/planTablo td/kutuAd/kutuSorumlu/zincirSatiri/olayAd/logDetay/logKaynak/ajanIdSatiri/saglikAd/agacAd/agacDugumAd/konusmaKimlik/projeAjan); grid çocuklarında min-width:0 korundu. (2) JS — yeni `kisalt(metin,n)`: ağaç düğüm adı `kisalt(etiket,20)`, sağlayıcı `kisalt(a.provider,16)` (sağ kartta), AKIŞ satır adı `kisalt(o.ad,80)`; null/undefined→null. (3) title — her kısaltılan yüz TAM metni taşır (ozetYaz `el.title=metin`; plan tablosu/log satırları/proje tablosu hücre title'ları).

**Kısa ad kuralı:** ağaç konuşma düğümü adı = etiket VARSA `kisalt(etiket,20)`; yoksa 8 hane kimlik (`a.ajanId || kisaIdGoster(a.ajanKimligi)` literal birebir korundu — test 2 pini). `data-ajan` TAM uuid, seçim/yerleşim/gönderim değişmedi. Sağ kart TAM kimlik + TAM etiket göstermeyi sürdürür.

**Panel genişlikleri:** varsayılan sol 240px (clamp 200-360) · sağ 320px (clamp 260-460) — splitter taraf-bazlı `KENAR` sabiti (eski 180px-45vw genel clamp kaldırıldı). localStorage anahtarları AYNEN (`ordu-solW`/`ordu-sagW` — kayıtlı kullanıcı değeri saygı duyulur; media yalnız kayıt yokken geçerli). 900-1279px kırılımı: `--solW:200px; --sagW:280px`. <899px istif düzeni KORUNDU (drawer yok).

**EK steering (TEK PANEL birleşimi):** (1) «PROJE DURUMLARI — Paseo canlı tarama» bloğu HTML gövdesinde ZATEN YOKTU (PANEL-EXPLORER-1'de ağaç lehine sökülmüş; grep doğrulaması — yalnız satır ~1396'daki bayat JS yorumu eşleşti, yorum güncellendi). DURUM alt-sekmesine TEK kompakt satır `paseoOzet` eklendi: başarıda «Paseo taraması: N proje · M ajan», tarama ölürse dürüst «okunamadı (fail-closed)». (2) orta yalnız seçili öğe detayları — değişiklik gerekmedi (yapı zaten böyle). (3) üst çubuklar TEK bitişik aile: `#anaSekmeSerit` border-top:0 (üstbarın border-bottom'u ortak çizgi), main `padding:0 12px 12px`, `#altSekmeSerit` negatif marjla sekmeGovde üstüne yapışır (radius 0, yan kenarlıklar 0). (4) kapsam 2 dosya; pinler bilinçli güncellendi (liste aşağıda).

**Dokunulmayanlar (veri katmanı sözleşmesi):** 7 GET ucu · fetch çağrı sayısı 7 AYNEN · POST /api/mesaj + x-pano-token başlığı AYNEN · esc() her yerde · 30sn yenileme + odakIcindeMi/gonderiyor girdi koruması · emoji/webfont/dış URL/@keyframes YOK · animasyon yalnız color/border-color/background/transform/opacity (E12) · test 0 (vm.Script tüm-script parse) KORUNDU ve geçiyor.

## Test kanıtı (bu koşumda ölçüldü)

- `cd pano; npm test` → **70/70 pass, 0 fail, EXIT=0** (taban 68 + YENİ 10e + 51d = 70)
- repo kökü: `node --test pano/*.test.mjs scripts/*.test.mjs` → **292/292 pass, 0 fail, EXIT=0** (taban 290 → 292)
- Test 0 (canlı SyntaxError regresyon pini — tüm inline script vm.Script parse) yeşil.

## Bilinçli pin değişimleri (görsel sözleşme — kompakt steering gerekçesiyle)

| Test | Eski pin | Yeni pin |
|---|---|---|
| 2 | `.agacProjeBas`/`.agacAjan` 44px (`--min-dokunma`) | 28px |
| 10 | body 16px / bolum-etiket 20px / padding 22px 24px / satır 1.5 / radius 8-6 | 13px / 15px+600 / 10px 12px / 1.4 / 6-4 |
| 10 | GÖNDER 44px | 40px (KISAT alt sınırı) |
| 10b | ozetDeger 36px / ozetEtiket 14px / kutuKod 20px | 22px+600 / 11px / 14px |
| 10d | --solW:280 / --sagW:380 · aria-valuenow 280/380 · clamp `Math.max(180, Math.min(45vw…))` | 240/320 · 240/320 · `KENAR` sabiti + `Math.max(k.min, Math.min(k.max…)` |
| 10d mesaj | logListe 13px | 12px |
| 51b | başlıksız ajan «(başlıksız)» literal | 8 hane kimlik + TAM kimlik title |

YENİ pinler: **10e** (kompakt yoğunluk + ellipsis katmanları + kisalt + KENAR + fallback 240/320 + 900-1279 media + #e2e8f0 + gölge-yok + paseoOzet + bitişik üst çubuk ailesi + colgroup'lar) · **51d** (kisalt eşik tablosu vm: null/undefined→null, eşik altı aynen, 21→19+…, tam eşik kesilmez, sayı metne iner; ajanDugumHtml davranışı: uzun etiket 19+…, title TAM, data-ajan TAM uuid, XSS esc, eski agacAjanId/agacEtiket yok) · 51b vm context'e `kisalt` eklendi (ajanDugumHtml artık çağırıyor — ReferenceError önlemi).

## Yapamadım (dürüst)

1. **Canlı DOM doğrulaması (4937) ve ekran görüntüsü kanıtı YAPILMADI** — görev sınırı: 4937 test sunucusuna dokunmak yasak; koordinatör (KURMAY-1) sorumluluğunda. HTML diskten taze okunarak tarayıcıda doğrulanmalı: özet şerit tek satır değerler, ağaç kısa adlar, splitter 200-360/260-460 clamp, 900-1279 daralma, bitişik üst çubuk ailesi.
2. **Tasarım kapısı (TASARIM-MANIFESTOSU) tam tur atılmadı** — §1 (baz ≥15-16px/nefes) bu işte koordinatör brief'iyle kullanıcı steering'i karşısında GEÇERSİZ kılındı (yetki koordinatöre ait); §4/§6/§7/§8 pinleri test 10/10e'de AYNEN geçiyor. Kapanış ilanı koordinatör kapısındadır.
3. **ekran-tuval-cross-check (K2 görsel kabul)** kullanıcıda — bu rapor kabul sinyali değildir.

## İşlenme (koordinatör KURMAY-1 — kapanış, 2026-11-03 15:16)

1. **Canlı DOM doğrulandı** (4937, HTML diskten taze): ağaç düğümleri kısa ad TEK satır (ör. «10 subagent öyle pl…» = kisalt 19+…) + `title` TAM uuid + `data-ajan` TAM uuid — ORDU grubunda 62 düğüm ölçüldü; `paseoOzet` canlı «Paseo taraması: 74 proje · 1037 ajan»; composer İKİ AYRI optgroup (ORDU YÖNETİM: 1 · SEÇİLİ PROJE: 61, yönetim hariç); görünür kırmızı yüz 0. Ekran kanıtı: `raporlar/ordu-panosu-2026-11-03/ekran-kanit-kompakt.png` (148 KB, 1534x888).
2. **Tasarım kapısı KAPANDI:** `kararlar/K-0061.md` YÜRÜRLÜKTE — §1 (baz 16px/nefes) bu panelde kullanıcı steering'iyle askıda; §4/§6 grep temiz (yalnız bilinen iyi huylu favicon data-SVG eşleşmesi); §5 GÖNDER 40px + select/input 44px.
3. **KOORDİNATÖR BULGUSU + DÜZELTME (gizil regresyon):** composer hedef `select`'i ağaç tıklamasını takip ETMİYORDU — kart doluyor ama select eski değerde kalıyordu. Taze sayfada ilk tıklama çalıştığı için PANEL-EXPLORER-1 kapanış kanıtı bunu göremedi; localStorage'dan dönen seçimle görünür hale geldi. Düzeltme: `konusmaSecGuncelle(secimiZorla)` / `composerHedefGuncelle(secimiZorla)` — ağaç tıklaması TIKLANAN konuşmayı hedefler; 30sn yenileme yolu elle seçilmiş değeri KORUR (elle seçilmiş yönetim hedefi ezilmez). Test **51e** YENİ (vm: zorla takibi + elle seçim korunumu + listede olmayan eski değere dürüst dönüş). Canlı kanıt: tıklanan 074a43f2 → select `074a43f2-f0b…` + kart doldu. **Dürüst not:** koordinatörün ilk düzeltmesinde kendi yazım hatası vardı (`seciliKonsma` → doğrusu `seciliKonusma`) — 51e kırmızı çıkardı, dış-sinyalle (test çıktısı) düzeltildi; üç maddeli döngü: test düştü → hata ayıkla → kök → yeşil.
4. **K2 görsel kabul KULLANICIDA** — hâlâ açık (bu kapanış kabul sinyali değildir).

Koordinatör bağımsız koşumlar: pano npm **71/71** (yazıcının 70'ine +51e) + repo glob **293/293** (yazıcının 292'sine +51e) — ikisi de EXIT=0.
