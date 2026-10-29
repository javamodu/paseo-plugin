# KAPI DENETİM RAPORU — TASARIM MANİFESTOSU × kapsul-tuval.html (ORDU-5)

**Denetçi:** ORDU-5 (tasarım kapısı denetçisi; 5'li dalga) · **Tarih/saat (ölçülmüş):** 2026-10-29 21:31
**Denetlenen:** `pano/kapsul-tuval.html` (1922 satır; HEAD 9ac3ea7 working-tree hali — 127 kirli yolun hiçbiri tuvale ait DEĞİL, tuval değişmeden denetlendi)
**Yöntem:** SALT-OKUR — manifestonun 8 maddesi + KAPI DENETİMİ bölümü; dosyanın TAMAMI okundu (3 parça) + araç ölçümleri: node emoji taraması (EMOJI_COUNT:0 · tipografik semboller: — … – ▸ U+25B8 ⧉ U+29C9 ◎ U+25CE) · `grep -c @keyframes` = 0 · `grep -c .serit` = 0.
**Sonuç:** **7 GEÇTİ / 1 KALDI** (§1 büyük yazılar — 2 ihlal noktası, tek satır düzeltme önerisi aşağıda).

## Madde madde

### §1 BÜYÜK YAZILAR — **KALDI** (2 nokta)
GEÇEN deliller: baz font 16px (`kapsul-tuval.html:49`); dar ekran 15px (`:537`); bölüm başlığı 20px `.bolum-etiket` (`:128-131`) + `#denetimGecmis .bolum-etiket` 20px (`:325`); içerik yazıları 15-16px — `.kart-is` 15 (`:291`), `.kSatir` 15 (`:439`), `.chatGiris` 15 (`:409`), `#hata` 15 (`:270`), `.akordiyonAd` 16 (`:172`), `.marka` 15 (`:76`); tabular-nums — `.gId` (`:184`), `.kartId` (`:429`), `.kart-ayak` (`:294`).
İHLAL 1: **`.chatMesaj` 14px** (`:398`) — sohbet balonu İÇERİK metnidir (etiket/alt-metin değil); manifesto baz ölçeği ≥15-16px'in altında. Chat bu yüzün ana iş içeriği → «sığdırayım» küçültmesi sınıfına girer.
İHLAL 2: **sağ panel başlıkları 18px** — `.panelBas .bolum-etiket` (`:391`) ve `.chatBas h3` (`:396`); bunlar BÖLÜM BAŞLIĞI (h3) → manifesto başlık ölçeği 20-24px; 18 altında.
Gözlem (kapı engelleyici değil): `.sekme` 14,5 (`:212`), `.dkSecici` 14,5 (`:336`), `.gId` 14 (`:184`) — bunlar etiket/mono-kimlik sınıfı; 13px eşik üstü kaldığı için ölçekle uyumlu sayıldı.
**Düzeltme önerisi (tek satır):** `.chatMesaj{font-size:15px}` ve `.panelBas .bolum-etiket,.chatBas h3{font-size:20px}` (2 kural, ~2 dakika; sonrası manifesto madde-bağı test vakası + DOM dumanı).

### §2 NEFES ALAN TASARIM — **GEÇTİ**
Tek viewport: `body { height:100vh; overflow:hidden }` (`:50`); uzun içerik panel-içi kayar — `.grafKutu` (`:159`), `#sekmeGovde` (`:227-231`), `.sagPanel` (`:383-386`); dar ekranda akış geri döner (`:518-519` — sözleşme gereği istisna).
Duvar İNCE 6px: grid 5 hücre `… 6px … 6px …` (`:101`), `.splitter` width:6 (`:118`); K2 emri uygulalı (commit c9501dd).
Tepe şeritleri YOK: `.serit` CSS+HTML kalıntısı **0** (grep ölçümü; c9501dd'de söküldü); kalan `.ustbar` işlevsel uygulama başlığıdır (marka + drawer/sağ-panel düğmeleri + token — `:562-578`), bilgi/dürüstlük şeridi değil.
Boşluklar: `main` padding 12/16 (`:102`), `#sol` padding 10 (`:141`), `.kapsulKart` 16 (`:423-426`), satırlar 44px ritmiyle (`:175-179`).

### §3 BÜYÜK GÖRSELLER — **GEÇTİ**
DAG tuvali orta sütunu domine eder: `#tuvalSarma height:clamp(320px, 52vh, 640px)` (`:243`) + viewBox zoom/pan/pinch çekirdeği (`:1026-1114`); kart ızgarası `minmax(230px, 1fr)` (`:280`).
Ekran kanıtları tam gerçek durumla: `raporlar/tuval-birlesim-2026-10-29/` altında 6 PNG (1440×900 DOM-kanıtlı; sonuncusu ekran-tuval-k2-tepeserit-duvar-bug.png — K2 üçlemesi sonrası).

### §4 TEMİZ MODERN DİL — **GEÇTİ** (2 gözlem)
Light tema: `:root` açık palet (`:34-42`), `color-scheme: light` (`:6`), theme-color (`:7`).
**Emoji YASAK — GEÇTİ:** node taraması EMOJI_COUNT:0; ikonlar inline SVG stroke-tabanlı: marka (`:564-568`), hamburger (`:572`), sağ-panel (`:575`), CHAT/PROJE/API (`:767-775`), akordiyonOk (`:954`), drawerKapa (`:590`) — hepsinde aria-hidden + butonda aria-label/title.
Gözlem A (engel değil): düğme metinlerinde TİPOGRAFİK semboller — ↻ Yenile (`:588`), ▸ (`:595, :682, :791, :1298, :1681, :1892`), ⧉ kopyala (`:696, :705, :1348-1349`), ◎ (`:1350`), ↳ (`:660`), ▊ imleç (`:1451`) — bunlar metin sunumlu dingbat'lardır, emoji DEĞİL; kullanıcı «bunlar da istemem» derse SVG'ye çevrilir (ayrı emir).
Gözlem B (engel değil): hex literalleri — `DURUMRENK` JS (`:851`), lejant inline (`:599-601, :641-644`), marka SVG stroke (`:565-567`); değerler :root tokenlarıyla BİREBİR (047857/b45309/51617a/0e7490/6d28d9) — «dağınık hex» değil, token-değer sistemli; JS/inline-SVG bağlamında var() kısmen mümkündür, sadeleştirme ayrı kalem.
Sistem font stack (`:48`), 0 dış bağımlılık (başlık yorumu `:29-32`).

### §5 DOKUNMA + MOBİL — **GEÇTİ**
`--min-dokunma:44px` (`:39`) + global `button { min-height:44px }` (`:481`) + `touch-action:manipulation` (`:481, :82, :336, :409`); splitter `touch-action:none` (dokunmatik sürükleme, `:118`).
Klavye + aria: `role=tablist/tab/tabpanel` + aria-selected (`:612-616, :622, :1142`); splitter `role=separator` + `aria-valuenow` + ok tuşları ±16px (`:607, :757, :1218, :1249-1257`); aria-pressed (`:574, :629-630, :766-776, :1408-1412`); aria-expanded (`:571, :953, :1677`); Enter/Space — SVG düğüm (`:1067-1071`), role=button satır (`:1768-1775`), data-not kart (`:1846-1853`); Esc drawer kapatır (`:1209`); `:focus-visible` (`:482`).
Kırılım: ≥1024 grid + aç/kapa (`:526-533`); <1024 tek kolon + sol overlay (hamburger + perde + Esc + body scroll kilidi, `:507-525`); <640 ince ayar (`:536-543`).
Kalıcılık: `tuval-solW/sagW/sagAcik` localStorage (`:1213-1214, :1262-1265, :1279, :1284`); 180px nefes-alt sınır / 45vw tavan (`:1220-1222`) — ölçüm kanıtlı (ADIM-C DOM dumanı, STATE 19:57 damgası).

### §6 AKIŞKAN + HİJYENİK HAREKET — **GEÇTİ**
`@keyframes` sayısı **0** (grep). Tüm geçişler yalnız transform/opacity ≤600ms: `.sekmePanel` (`:232`), `.sagPanel` (`:386`), `.toast` (`:496`), `.kayit` (`:308`), `.kart` transform (`:283`), `.akordiyonOk` (`:170`), `.dkKart .ok` (`:356`), `.isik` 600ms (`:60`), `:active` scale (`:418, :489`); splitter tutamacı `transition:transform .15s` — renk anında değişir (`:121-124`).
`prefers-reduced-motion`: tüm animasyon/geçiş kapanır (`:546-551`) + JS `azHareket` (`:859, :1378`).
AÇIK grid yerleşim: `main > * { grid-row:1 }` + çocuk sabit kolon 1..5 (`:110-115`) — K2 orta-kayma bug'ı yapısal kapatılmış (DOM kanıtı STATE 20:25 damgası: sol kapalıyken orta 660→1035px genişledi).

### §7 SAF YÜZ — STATE YAZILARI YOK — **GEÇTİ** (2 gözlem)
Kalıcı sayaç/rozet/meta YOK: drawerBaşlık sayaçsız «GÖREV GRAFİ» (`:587`); harita başlığı sade (`:619`); akordiyon sayı rozeti söküldü (`:955` yorum satırı + kodta yok); `metaYaz` yalnız title yazar (`:920-924`); `document.title = "Kapsül Tuval — ordu " + grafSurumu` — kalıcı kimlik, canlı sayaç yok (`:923`). `agacSayi`/`haritaSayi`/`akordiyonSayi` tanımlarının hiçbiri dosyada mevcut değil (tam okuma).
Gözlem A (engel değil): zFit toast'ı «grafın N düğümü ve M kenarı…» söyler (`:1118`) — 2,8 sn'lik GEÇİCİ işlem geri bildirimi (toast `:867-873`), ekranda kalıcı state yazısı değil; kullanıcı «toast'ta da sayı istemem» derse tek satır sökülür.
Gözlem B (engel değil): API yüzü `dkSatirBilgi` sağlayıcı/model/tercih değerleri taşır (`:1656`) — bu İŞ İÇERİĞİ'dir (gerçek 4930 verisi), ADIM-D'nin «kanıt içeriği ayrı iş» ayrımıyla uyumlu; manifesto maddesi UI meta-sayaçlarını hedefler.

### §8 DÜRÜSTLÜK — **GEÇTİ**
fail-closed: `kirmiziYuz` — ağaç boşalır, tuval boşalır, görev sekmeleri kapanır, bayat graf kalmaz (`:908-918, :895, :906`); deney köprüsü `D=null` → PROJE/API kırmızı yüz, bayat veri gösterilmez (`:1490-1499, :1514-1516, :1524, :1530-1534, :1651`); kart POST token'sız kırmızı (`:1384-1390`).
ÖRNEK etiket sistemi: kartlar/onaylar/defter/kanal geçmişi/chat data-ornek + `.etiketOrnek` (`:654, :688, :692, :701, :710, :722, :724, :733, :740, :781, :784, :1339-1343`); GERÇEK etiketler — graf yüzü + PROJE/API 4930 uçları (`:799, :828, tg() :863`); «yakında» kartı YOK — D-4/D-2 bağları GÖRÜNÜR dürüst etiketle vaat (şablon/örnek), gizli vaat yok.
Ölü buton YOK: her düğmenin işleyicisi var (tek-tık delege `:1777-1843` + ayrı dinleyiciler); bilgi amaçlı düğmeler `data-not` ile bilgilendirir.
EK-2: onay cümlesi statik HTML (`:695`) — JS'te üretilmez/çalıştırılmaz; GUI yalnız panoya kopyalar (`:876-889`); chat ŞABLON etiketli, canlı AI D-4 dürüst sınır beyanı (`:784, :1862`).

## KAPI DENETİMİ bölümü (manifesto §59-64) değerlendirmesi

1. Test iddiaları manifesto maddelerine bağlı mı? — **KISMEN:** `pano/kapsul-tuval.test.mjs` 34/34 vaka sürüyor (vaka 11/23 serit-yokluk + 27/34 6px izleri + açık-yerleşim iddiası — §2/§6 maddeleri testte); ancak **§1 yazı ölçekleri (chatMesaj 14px / başlık 18px) test vakası DEĞİLDİR** — bu denetimin yakaladığı ihval de testin kör noktası; düzeltmeyle birlikte vakaya bağlanmalı.
2. DOM dumanı + ekran PNG: VAR (ADIM-A..D + K2 damgaları, 6 PNG).
3. «Bitti» ilanı: **§1 düzeltilmeden K2 görsel kabul turu «tasarım kapısından geçti» İLAN EDİLEMEZ** — manifesto maddesi açık (başlık 20-24px).
4. Kullanıcı görsel kabulü (K2) sürüyor — bu rapor kabul SİNYALİ değil, kapı ölçümüdür.

## Yaprak özet

| Madde | Sonuç | Kritik delil |
|---|---|---|
| §1 büyük yazılar | **KALDI** | `.chatMesaj` 14px (`:398`) · panel başlık 18px (`:391, :396`) |
| §2 nefes alan | GEÇTİ | 6px duvar (`:101, :118`) · tek viewport (`:50`) · şerit 0 |
| §3 büyük görseller | GEÇTİ | DAG 52vh (`:243`) · 6 ekran PNG |
| §4 temiz modern | GEÇTİ | emoji 0 (node) · inline SVG ikonlar · light tema |
| §5 dokunma+mobil | GEÇTİ | 44px (`:39, :481`) · aria/klavye eksiksiz · 180/45vw |
| §6 hareket hijyeni | GEÇTİ | keyframes 0 · yalnız transform/opacity · reduced-motion |
| §7 saf yüz | GEÇTİ | sayaç 0 · title yalnız kimlik (`:923`) |
| §8 dürüstlük | GEÇTİ | kirmiziYuz (`:910`) · ÖRNEK/GERÇEK etiketler · EK-2 |

**Tek satır düzeltme seti (§1 kapatmak için):** `.chatMesaj{font-size:15px}` + `.panelBas .bolum-etiket,.chatBas h3{font-size:20px}` — sonrası test vaka bağlama + DOM dumanı; o zaman kapı 8/8.

*Rapor salt-okur denetim ürünüdür; koda dokunulmadı (tek istisna: bu dosya). Denetçi emri: ORDU-5 görev mesajı (message-id c9af8a6f).*
