# DALGA-0-2 · R2 TASARIM REVİZYONU BRIEF'İ — light tema · üç sütun · VS Code sekmeleri · sağda AI chat

**Kimlik:** KAPI K2'nin R2 tasarım bacağı (K1 KAPANDI 14:53). **Kaynak:** kullanıcı emri (2026-10-29 15:0x, verbatim): «Bu kadar uzun karışık plan mı olur — soldaki planı gerekirse akordiyon şeklinde yap; orta kısmı VS Code gibi sekmelerle yap; light arayüz yap; emoji yasak; modern temiz büyük yazılar; tek bakışta viewport içinde her şeyi görebileyim; akışkan dinamik değişen panel ile geçişler olsun; AI chat sağda büyük panel ve üstünde ikon menü var; her iki panel içeriği dinamik değişiyor; varsayılan chat paneli». Hat: **K-0053 aynen** (yazar ayrı worktree/branch → merge --no-ff → merge anında tam kanal + tip + hedefli).

**Taban:** merge **dd51987** (`pano/kapsul-tuval.html` 1516 satır — R1 tek-akış + AI CHAT drawer'da). **Tasarım SSOT:** BU FİŞ — mockup-final bu dalgada tasarım referansı DEĞİL (R1 yerleşimini kullanıcı emri revize etti; mockup koyu tema + uzun akış tasarlıyordu).

## 1. Hedef (EK-3)

`pano/kapsul-tuval.html` — **R2 yerleşim + tema revizyonu** (İÇERİK/veri katmanı korunur; yerleşim + görünüm değişir):

1. **LIGHT TEMA:** açık zemin (ör. `#f4f6f9`/`#ffffff` katmanları) · koyu metin (`#1a2332`) · accent: camgöbeği/menevşe yerine light-uyumlu (teal/mavi) · durum renk tokenları light paletine çevrilir · **emoji YASAK aynen** · kirmiziYuz fail-closed kartı light paletle korunur.
2. **ÜÇ SÜTUN · TEK VIEWPORT:** üstte **TEK SATIR kompakt** GENEL STATE + ordu şeridi; altında yatay grid: **SOL akordiyon · ORTA sekmeli · SAĞ chat**. `body` scroll YOK — her panel kendi içinde kayar (overflow-y). Her şey tek ekranda görünür; uzun sayfa scroll'u BİTER.
3. **SOL — akordiyon görev ağacı:** fazlar katlanır bölüm (akordiyon) · bölüm başlığı ≥44px + aria-expanded + aria-controls · görev satırları seçilebilir · «(faz yok)» dali aynen · mevcut `sec(id)` senkronu KORUNUR.
4. **ORTA — VS Code tarzı SEKMELER (dinamik):** üstte sekme şeridi — seçilen görevler sekme olarak açılır (tıkla=seç, × ile kapat) + **sabit sekmeler:** «Görev haritası» (DAG — mevcut viewBox zoom/pan/pinch aynen) · «Kanıt defteri» (defter + kanal geçmişi + kirmiziYuz) · «Runlar & onaylar» (run kartları + onay-bekleyenler). Sekme içeriği: kapsül kartı + **denetim kanıtı INLINE aynen** (467/467 · ölçüm çifti · tip). **Sekme mekaniği SERBESTTİR** (kullanıcı emri R2 — üst mod-sekmeleri [İZLE/DENETLE/YÖNET] hâlâ YOK; drawer'da nav YOK).
5. **SAĞ — büyük AI CHAT paneli (varsayılan) + ÜSTTE İKON MENÜ:** ikonlar (inline SVG, emoji YASAK): **CHAT** (varsayılan — mevcut şablon-komut üretici aynen, «ŞABLON — canlı AI yanıtı D-4'te» etiketi aynen) · **ÖZET** (yönetici-özeti YERLEŞİMİ — bu dalgada boş-iskelet değil: mevcut gerçek veriden kompakt durum kartı + «canlı AI seçenek paneli K8'de» dürüst etiketi; sahte seçenek ÜRETİLMEZ) · **KOMUT** (komut şablonları + komut kutusu — mevcut davranış taşınır). İkon tıkla → panel içeriği **dinamik değişir** (JS görünüm değişimi; hash/route YOK, id-toggling yeterli).
6. **TİPOGRAFİ:** modern temiz **BÜYÜK yazılar** — baz ≥15-16px, bölüm başlıkları 20-24px, GENEL STATE sayıları büyük (tek bakışta okunur).
7. **AKIŞKAN GEÇİŞLER:** sekme/panel değişimlerinde yumuşak geçiş — **yalnız transform/opacity, ≤600ms** (E12 kuralı aynen; @keyframes YOK).
8. **DAR EKRAN (<1024):** sol akordiyon overlay'e çekilir (hamburger + perde + Esc + scroll-kilidi — mevcut drawer deseni uyarlanır); orta tam genişlik; sağ panel alta katlanır ya da ikon menüden tam ekran. ≥44px dokunma hedefleri aynen.

## 2. Çıktı

- `pano/kapsul-tuval.html` (DÜZENLENECEK — yerleşim + tema; veri/İŞ mantığı korunur)
- `pano/kapsul-tuval.test.mjs` (DÜZENLENECEK): korunur vakalar KORUNUR (drawer/aria/Escape/perde/44px/reduced-motion/ÖRNEK-etiket/kopyala/emoji-yok/dış-fetch-yalnız-/api/graf · K5 seti · E7-E12) · **vaka-10 REVİZE:** üst mod-sekmeleri/nav YOK ama **orta görev-sekmeleri tablist/role=tab TAŞIR** (VS Code tarzı — R2 kullanıcı emri; test «üst nav sekmesi YOK + orta sekme VAR» ayrımını kaynak-düzeyinde doğrular) · YENİ vakalar: üç-sütun grid · body-overflow gizli + panel-içi kaydırma (tek viewport) · sol akordiyon aria-expanded · sağ panel ikon menü + varsayılan chat + dinamik içerik değişimi · light-tema tokenları (kaynakta açık-zemin hex) · büyük yazı (baz font-size ≥15px) · ÖZET paneli dürüst etiketi (sahte seçenek yok)
- `raporlar/dalga0-2-arayuz-2026-10-29/R2-YAZAR-RAPORU.md` (YENİ — 12 dürüst not deseni aynen)

## 3. Araç/kaynak (readFiles)

kapsul-tuval.html (dd51987 hali — İÇERİK/JS korunacak set için) · kapsul-tuval.test.mjs · pano/server.js (SALT-OKUR anlama — /api/graf + /api/kart uçları değişmez).

## 4. Sınır

Mevcut dosya ≤3 (html + test; rapor yeni). server.js + graf SSOT + core/ + scripts/ YAZMA YASAK. Yeni bağımlılık YOK. K5 korunur seti AYNEN: kirmiziYuz fail-closed · İNSAN/MAKİNE OKUR (modUygula) · sec(id) senkronu · 30 sn tazeleme · yerlesim döngüde-çizilmez · «(faz yok)». ÖRNEK-etiket sistemi AYNEN (kalp-yüzü ÖRNEK — canlı bağ D-2/K8). EK-2 DOKUNULMAZ (onay cümlesi GUI'de üretilmez/çalıştırılmaz — yalnız kopyala). K-0053 hattı: yazar ayrı worktree/branch → merge --no-ff → merge anında tam kanal + tip + hedefli (taban: son-kanit 96 sn / h=dd51987).

## 5. Yazar akışı

1. readFiles (§3). 2. Kod + test (2 bağımsız koşum). 3. `npm run tip` (core/). 4. İzole smoke: boş port, /tuval 200 + /api/graf 40 görev; server kill. 5. Branch'inde commit (-F %TEMP% deseni; emoji yok; Co-Authored-By; CRLF korunur — Edit aracı çok satırlı eşleşme tutturamazsa Python splice serbest, tek-eşleşme garantili). 6. R2-YAZAR-RAPORU.md: branch + hash + test X/X ×2 + tip + smoke + LOC + dürüst notlar (light-tema geçişinin eksileri varsa — kontrast/renk körlüği gibi — adıyla yaz).
