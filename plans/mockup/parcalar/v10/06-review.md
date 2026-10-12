# 06 — UX / A11Y / Performans Denetimi (v10 hedefine karşı)

Tarih: 2026-10-12 · Denetlenen: `plans/mockup/pano-mockup-2026-10-12.html` (v9 ara durum, 782 satır, statik inceleme) + `plans/mockup/DESIGN.md` (v8)
Not: Satır referansları `pano-mockup-2026-10-12.html` dosyasınadır. Runtime kırıkları bilinçli olarak kapsam dışı; yalnız statik bulgular.

## 1. Gereksinim kontrol listesi (v10 hedef mimarisi)

| # | Gereksinim | Durum | Kanıt / not |
|---|---|---|---|
| 1 | Rail: Plan/Doktor/Orkestr./Galeri/Dosyalar/Linkler/Dökümanlar | KISMI | `:478` RAIL = plan, doktor, orkestrasyon, **canli**, galeri, **arkayuz**. Eksik: Dosyalar, Linkler, Dökümanlar. Fazla: Canlı, Arka yüz. |
| 2 | Rail tıkla = flyout panel aç/kapa (orta açmaz) | KISMI | `:484-488` rail tıklaması yalnız panel bölümünü değiştirir; masaüstünde panel kapatılamaz (`.panel.kapali` yok), aynı öğeye tekrar tıkla kapatmaz. "Orta açmaz" kısmı sağlanıyor. |
| 3 | Panel öğesi tıkla = orta sekme aç | KISMI | Yalnız görev listesi `:605` → `gorevGoster` → `sekmeAc` `:582`. Plan akordiyonu `:569,:572` sekme açmaz; galeri/dosya/canlı panel öğeleri statik. |
| 4 | Orta varsayılan = Pano one-view dashboard | YOK | Açılış `:778` chat sekmesini seçer; Pano sağ dock bölümü `:264` (300px sütuna sıkışmış). One-view markup + `.pgrid/.pkart/.donut` CSS var (`:148-155`) ama yanlış konumda. |
| 5 | Sağ dock = chat (çoklu oturum sekmeleri + composer) | YOK | SAG `:723` = pano/akis/dosyalar/url/terminal; chat orta sekme (`:333` tpl-chat); çoklu oturum kavramı hiç yok. |
| 6 | Dock kapanınca composer ortaya sabitlenir | YOK | Composer `.orta` altına sabit `:245-259`; `sagToggle` yalnız `.kapali` toggle eder `:735`; koşullu composer taşıma yok. |
| 7 | İki panel resize | VAR | Ortak `surukleKur` `:736-747`, bağlama `:748-749`; sınırlar sol 220–480 / sağ 240–560. Yalnız mouse, rAF yok (bkz. §4). |
| 8 | Emoji yok (inline SVG) | VAR | İkon seti `I{}` inline SVG `:428-449`. Kalıntı metin glifleri: `✕` `:500`, `›` `:536`, `→` `:617`, `▊` `:327,:408` — emoji değil ama tutarlılık için SVG'ye çevrilmeli. |
| 9 | Mod seçimi select ile (5 mod) | VAR | `<select id="modSec">` `:248`, 5 option JS'ten `:675-678`, change handler `:679`. |
| 10 | Mobil ≤880px drawer + backdrop | KISMI | Media query `:182`; sol panel drawer + backdrop `:185-187,:331,:487-489`. Sağ panel mobilde fixed overlay `:188` ama backdrop'a bağlı değil ve ilk yüklemede açık (`.kapali` yok) → mobil ekran 86vw panelle açılır. |
| 11 | Dokunma hedefi ≥38px | KISMI | Uygun: rail 48 `:22`, tab 38 `:33`, sagtabbar 38 `:86`, ikon-btn 42 `:73`, yuvarlak 44 `:77`, psprint 44 `:139`, psub 38 `:141`. Altında: `.tab .x` ~18px `:37`, `.arti-menu div` ~35px `:42`, `.mod-btn` 34px `:64`, `.agac div` ~22px `:132`. |
| 12 | Lighthouse/CWV 100 (sıfır dış istek, shift yok) | KISMI | Dış istek sıfır, sistem fontu, inline SVG `:10-16`. Riskler: `.ek-serit:empty{display:none}` `:68` ilk eklemede composer yüksekliğini büyütür (yerel shift); a11y/SEO denetimleri (href'siz `<a>` `:480`, aria eksikleri) 100'ü engeller. |

## 2. UX tutarlılık hataları

**Navigasyon modeli çelişkileri**
- Kapatılan Plan/Doktor/Emir orta sekmeleri geri açılamıyor: `+` menüsünde yalnız terminal/url/dosyalar/ajan var `:517`; rail bu türler için orta sekme açmıyor `:484-488` → sekme kapat = kalıcı kayıp (v10'da rail→öğe→sekme akışı bunu çözer).
- Etiket uyumsuzluğu: rail "Doktor" `:478` ama panel başlığı "Workspace" `:202-203`; kullanıcı iki adı eşleyemez.
- Tek scroll konteyneri: tüm yüzeyler `.icerik` içinde `:49-50`; `sekmeSec` scroll'u sıfırlamaz `:510` → sekme değişince önceki yüzeyin scroll konumu yeni yüzeye taşar. `gonder` içindeki `icerik.scrollTop=1e6` `:700` chat görünmezken başka yüzeyin scroll'unu bozar.
- Mobilde sağ panel overlay backdrop'suz `:188` + kapat düğmesi/Esc yok; sol drawer yalnız backdrop tıklasıyla kapanır `:489`.

**Ölü uçlar (tıklanabilir görünüp işlevsiz)**
- Canlı panel "Başlat/Durdur" butonları handlersız `:228`.
- URL "Yenile" butonları handlersız `:322, :411`.
- Dosya ağacı satırları `cursor:pointer` + hover'lı ama handlersız `:132-133, :318, :416`.
- Galeri filtre satırları statik `:232-234`; galeri için orta yüzey şablonu da yok (`TUR` içinde galeri yok `:494`).

**Durum kaybı riskleri**
- Emir sekmesi kapatılırsa textarea düzenlemeleri uçar (içerik template klonu `:357-382`, kapatma `:511`) ve geri açılamaz.
- Görev sekmesi kapatılıp yeniden açılınca `gorevGoster` template'ten taze klon doldurur — tutarlı; ama plan inline-edit sonrası plan sekmesi kapanır/açılırsa `planFullYaz` yalnız init'te çağrılıyor `:779` → boş tablo riski (yeniden açma yolu olmadığı için şimdilik gizli).

**Geri bildirim eksikleri**
- Gönder, chat yüzeyi görünmezken çağrılırsa mesaj görünmez yere yazılır `:694-701`; sekmede okunmamış rozeti yok.
- Mod değişimi yalnız placeholder değiştirir `:679`; aktif modun kalıcı görsel göstergesi yok (durum şeridi statik "10 çalışıyor" `:249`).
- `sagToggle` açık/kapalı durum göstergesi sunmuyor `:243, :735`.
- Yeni sekme tabbar'da `overflow-x:auto` içinde görünmez alanda açılabilir `:32, :504` (scrollIntoView yok).

## 3. A11y

**Kontrast (WCAG AA)**
- `--soluk #9a9aac` on `--bg #0a0a10` ≈ 7,1:1 → **geçer** `:11`; kart2 zeminde ≈ 6,2:1 geçer.
- `.kaynak` (10,5px + `opacity:.65`) ≈ 3,5:1 → **kırılır** `:91, :310`.
- Beyaz metin on `--vurgu #8b5cf6` (button `:105`, `.mod-btn.aktif` `:65`) ≈ 4,2:1 → 13px altı metin için AA sınırı **altında**; vurgu tonu koyultulmalı veya metin büyütülmeli.
- `::placeholder` hiç tanımlı değil → UA grisi, composer'da ≈ 4,1:1 **sınır altı** `:254`.
- `.dalga`/`.zincir` `--vurgu2` 10px `:159, :116` ≈ 4,4–4,8:1 → marjinal; 10px metinde riskli.

**Klavye erişimi**
- Rail öğeleri href'siz `<a>` `:480` → tab sırasına girmez, Enter ile çalışmaz; `<button>` olmalı.
- Sekmeler `div`, kapat `✕` span, `+` ve menü öğeleri div `:499-501, :515-521` → hiçbiri klavyeyle erişilemez; Escape menüyü kapatmaz.
- Akordiyon satırları `<button>` (iyi) `:533`; ama inline edit satırı `div`+click `:540-553` → klavyeyle düzenleme başlatılamaz.
- Select'ler ve form alanları doğal olarak erişilebilir `:103-104, :248` (iyi).

**Focus görünürlüğü**
- Yalnız `select/input/textarea` için outline var `:104`; butonlara/sekmelere/rail'e `:focus-visible` stili tanımsız.

**Aria eksikleri**
- `role=tablist/tab/tabpanel` + `aria-selected` yok (tabbar `:243`, sekme `:499`, yüzey `:502`); sagtabbar'da `aria-label` var ama `aria-selected` yok `:726-727`.
- Akordiyon `aria-expanded/aria-controls` yok `:533, :569, :572`; rail aktif durumu `aria-current`'süz `:485`.
- `sagToggle` `aria-expanded/aria-controls` yok `:243`; mic toggle `aria-pressed` yok `:689-693`.
- Canlı bölgeler yok: `ekSerit` `:687`, `emirDurum` `:370`, chat mesajları `:694-701` → `role=status`/`aria-live` gerek.
- Donut/bar grafikler `role=img` + `aria-label`'sız `:272, :278`; composer input yalnız placeholder'a bel bağlıyor `:254`.

## 4. Performans

**CLS riskleri**
- `.ek-serit:empty{display:none}` `:68` ilk ek'te composer yüksekliğini büyütür → `.icerik` daralır (uygulama-içi shift); sabit min-height veya her-zaman-görünür şerit önerilir.
- `planYaz`/`planFullYaz` tam `innerHTML` rebuild `:556-576, :636` → görünür sekmede içerik sıçraması; mockup ölçeğinde kabul edilebilir.
- Akordiyon açma panel içinde, genişlik sabit → viewport CLS yok (iyi).

**content-visibility kapsama**
- Yalnız `.kart` `:93`; uzama potansiyeli taşıyan `.gorev`, `.chat-mesaj`, `.frow`, `.log` kapsamsız → `content-visibility:auto` + `contain-intrinsic-size` ekle.

**Scroll performansı**
- `.icerik`/`.panel`/`.agac` ayrı scroll konteynerleri, passive wheel varsayılan (iyi); tabbar/mod-serit yatay `overflow-x:auto` `:32, :63` (iyi).
- Tek konteyner-tek scroll modeli sekme başına scroll hafızasını imkânsız kılıyor (§2 ile kesişir).

**Resize + büyük DOM**
- `surukleKur` her `mousemove'da `style.width` yazar `:738-743` ve `.govde` `auto` track'li grid `:18` → her pikselde tam relayout; rAF throttle + Pointer Events (touch desteği de gelir) önerilir.
- DOM düğüm sayısı düşük (yüzler mertebesi) → sorun yok; dış istek sıfır, font swap yok (LCP/FCP için elverişli).

## 5. Öncelikli düzeltme listesi

**P0 — v10 mimari bloklayıcılar**
1. RAIL dizisini v10 kümesiyle değiştir: canli/arkayuz çıkar, dosyalar/linkler/dokümanlar ekle `:478` (+ karşılık gelen `.pbolum` `:202-240`).
2. Rail tıklamasına flyout aç/kapa ekle: aynı öğeye ikinci tıkla veya aktif öğe dışına tıkla paneli kapatsın; `.panel.kapali{display:none}` `:484-489, :27`.
3. Sağ dock'u chat yap: SAG'ı oturum sekmeleri + mesaj listesi + composer'a çevir; mevcut SAG bölümlerini orta sekme/rail öğesine taşı `:723, :261-329`.
4. Composer'ı dock içine al; dock `.kapali` iken composer'ı `.orta` altına sabitleyen tek bayrak ekle `:245-259, :735`.
5. Açılışı Pano one-view yap: `.sbolum[data-sp=pano]` içeriğini orta varsayılan yüzeye taşı, `sekmeSec('sek1')` yerine pano sekmesini seç `:264-311, :778`.
6. Klavye tabanı: rail öğelerini `<button>` yap; sekme/`+`/menü/`✕`/`yaprakSatir`'a tabindex+keydown (Enter/Space/Escape) ekle `:480, :499-501, :515-521, :540`.

**P1 — tutarlılık + a11y**
7. Mobilde sağ panele başlangıçta `.kapali` ver, açılınca backdrop göster, backdrop/Esc ile kapat `:188, :735, :489`.
8. `+` menüsüne Plan/Doktor/Emir türlerini ekle (veya rail öğesi orta sekme açsın) — kapatılan sekme geri çağrılabilsin `:517`.
9. Ölü uçları bağla ya da kaldır: Başlat/Durdur `:228`, Yenile `:322, :411`, ağaç satırları `:318, :416`, galeri filtreleri `:232-234`.
10. Sekme başına scroll hafızası: `.yuzey{overflow-y:auto}` yapıp `.icerik`'i düz kapsayıcıya çevir; `icerik.scrollTop=1e6` yerine yüzey-içi scroll `:49-50, :700`.
11. Aria seti: tablist/tab/tabpanel+`aria-selected` `:499-510`, akordiyon `aria-expanded` `:533`, rail `aria-current` `:485`, togglara `aria-expanded`/`aria-pressed` `:243, :689`.
12. `:focus-visible` stilini button/tab/rail/arti'ye genişlet `:104`.
13. Kontrast: `.kaynak` opacity'yi kaldır veya rengi aç `:91`; vurgu zeminli buton metni için vurguyu koyult (`#7c4dff` bandı) `:105, :65`; `::placeholder` rengini `--soluk`'a sabitle.
14. Dokunma hedefleri: `.x`≥38px `:37`, `.arti-menu div`≥38px `:42`, `.mod-btn`≥38px `:64`, `.agac div`≥38px `:132`.
15. Chat'e okunmamış rozeti ekle; `chatYaz` görünmez yüzeye yazdığında rozeti artır `:694-701`.

**P2 — cilalar**
16. `surukleKur`'ü Pointer Events + rAF throttle'a çevir `:736-747`.
17. `content-visibility:auto` + `contain-intrinsic-size`'ı `.gorev`, `.chat-mesaj`, `.frow`'a genişlet `:93`.
18. Emir textarea durumunu `VERI`'ye yansıt ki sekme kapanıp açılınca korunsun `:357-382`.
19. Canlı bölgeler: `ekSerit`/`emirDurum`/chat'e `aria-live="polite"` + `role=status`/`role=log` `:687, :370, :694`.
20. Donut/bar grafiklere `role=img` + açıklayıcı `aria-label`; dekoratif çubuklara `aria-hidden` `:272, :278`.
21. Metin gliflerini SVG'ye çevir: `✕` `:500`, `›` `:536`, `→` `:617`, `▊` `:327, :408`.
22. Yeni sekme açılınca `tab.scrollIntoView()` çağır `:504`; rail "Doktor"↔panel "Workspace" etiketini birleştir `:478, :203`.
23. Sürüm etiketlerini tekilleştir: meta "v7" `:6`, kaynak "mockup v8" `:310`, dosya fiilen v9.
