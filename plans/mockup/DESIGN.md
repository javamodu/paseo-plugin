# DESIGN.md — Pano Mockup Tasarım Sistemi (v11)

Kapsam: \`plans/mockup/pano-mockup-2026-10-12.html\` — tek dosya vanilla, bağımlılık yok.
İlkeler: big/bold/clean · uyarı bandı yok · **emoji yok** (ikonlar inline SVG, \`I{}\`) · sistem fontu · sıfır dış istek · veri-odaklı (markup değil veri düzenlenir).

## 1. Tokenlar
| Token | Değer | Kullanım |
|---|---|---|
| \`--bg\` | #0a0e14 (+ radial lacivert ışıma) | zemin |
| \`--kart\` / \`--kart2\` | #11161f / #1a2230 | yüzeyler |
| \`--sinir\` | rgba(255,255,255,.06) | kenarlıklar |
| \`--metin\` / \`--soluk\` | #eceaf4 / #9a9aac | tipografi |
| \`--vurgu\` / \`--vurgu2\` | #2563eb / #3b82f6 | kurumsal mavi — gradyan + aksiyon (mor/cırtlak yasak) |
| \`--yesil/--sari/--kirmizi\` | #34d399 / #fbbf24 / #f87171 | durum |
| \`--r\` | 16px | kart radius |
Tipografi: gövde 15px · h2 22px/800 · \`.buyuk\` 26-32px/800. Odak: \`:focus-visible\` 2px vurgu2 (klavye).

## 2. Yerleşim (v10)
\`grid: 64px | auto(flyout) | 1fr | auto(chat dock 340)\`
- **Rail (7):** Plan · Provider · Dosyalar · Galeri · Linkler · Doktor · Dökümanlar. Rail tık = **yalnız flyout aç/kapa** (aynı öğe 2. tık kapatır; VS Code modeli). Orta sekme açmaz.
- **Flyout panel:** varsayılan KAPALI; resize 220–480 (nav-handle, pointer events, çift tık 320); bölüm başlığı nav'ın \`BASLIK\` sözlüğünden; içerik \`.pgovde\`'de eager veya \`nav.doldurucuKaydet\` ile lazy.
- **Panel öğesi → orta sekme:** ya \`data-orta-tur\`/\`data-orta-params\` bildirimi (delegated) ya da doğrudan \`ctx.ortaAc(tur)\`. Tek-örnek: aynı tür açıksa yenisini açmaz, mevcuda geçer. Mobilde panel kaynaklı orta açılış drawer'ı otomatik kapatır (nav'daki \`ortaAc\` sarmalı).
- **Sağ dock = sadece chat:** üstte oturum sekmeleri (\`Map<id,html>\`, + yeni, ✕ kapat; son kapanırsa otomatik Sohbet 1), ortada mesaj alanı, altta composer. Dock kapanınca **composer DOM node olarak orta alta taşınır** (listener/state korunur), açılınca geri. Resize 240–560 (pointer events, çift tık 340).
- **Orta varsayılan = Pano** (one-view dashboard; 12-kolon grid, span3/4/5/12).
- Tabbar: sekmeler solda, "+" menüsü TUR kayıtlarından üretilir (kapatılan sekme geri açılabilir), **Chat toggle en sağda**.

## 3. Composer modları (5)
| Mod | Yapar | Yapamaz |
|---|---|---|
| Manager (varsayılan) | ana yönetici — dağıtır/izler/denetler/puanlar | — |
| Ask | inceler/yorumlar | her türlü yazım |
| Plan | plan üretir/inceler | kod |
| Coder | kod yazar | plan değiştirme, orkestrasyon |
| Tester | test/doğrulama koşar | üretim kodu editi |
Mod placeholder'ı ve sahte yanıtı \`MODLAR\` sözlüğünden; \`plan: <ID> <alan> <değer>\` komutu moddan bağımsız \`ctx.planKomut\`'a düşer (alan: durum/tamam/loc/ad; faz-sprint'te tamam reddedilir).

## 4. Plan yüzeyi (en kritik ekran)
- **Panel:** Faz → Sprint → Alt görev akordiyonu (\`acik\` durumu VERI'da) · yaprak adı inline edit (Enter/blur kaydet, Esc iptal) · \`.pid\` tık → orta sekme + satır flaşı · altta görev listesi (T1-T4) → görev detay sekmesi.
- **Orta Plan sekmesi:** DAG kartı + temsil (Tablo/MD/JSON) + geniş tablo (7 kolon).
- **DAG üç görünüm:** Şerit (çipler, notlu düğüm vurgulu) · **Metin** (DSL editörü) · JSON. Metin DSL: \`A, B → C [ajan: x · mod: y · limit: z]\`, \`#\` yorum; Uygula → doğrulama (bilinmeyen ID, kendine döngü, DFS döngü tespiti) → VERI.dag + VERI.dagNot; hata varsa uygulanmaz, satır bazlı liste.
- Tek gerçek kaynak \`VERI.planlar\` + \`VERI.dag\` + \`VERI.dagNot\`; tüm görünümler aynı veriden üretilir.

## 5. Veri-odaklı mimari (AI ile genişletme)
- \`VERI.planlar/dag/dagNot\` → plan · \`VERI.gorevler\` → görevler · \`VERI.providerlar/modEsleme\` → Provider · \`VERI.galeri/dosyaAgaci/linkler/dokumanlar\` → içerik · \`PANO\` → pano (22 \`data-p\` bağlama noktası)
- \`MODLAR\` → composer modları · \`TUR\` → orta sekme türleri (+ \`tpl-X\` template'i) · \`I{}\` → ikonlar
- Yeni X = ilgili sözlüğe kayıt (+ varsa \`<template id="tpl-X">\`). Örnek veri her zaman (T) işaretli.

## 6. A11y + performans
Rail öğeleri \`<button>\` (klavye doğal) · tab'lar \`role=tab\`/\`aria-selected\` · akordiyon \`aria-expanded\` · chat \`role=log\`/\`aria-live\` · donut \`role=img\` + dinamik label · dokunma hedefleri ≥38px · grafikler sabit yükseklikli (CLS 0) · \`content-visibility\` kart/mesaj/görev · dış istek sıfır · mobil ≤880px: rail 52px, flyout drawer + backdrop, dock overlay (varsayılan kapalı, composer ortada), backdrop \`dataset.kaynak\` ile nav/sag ayrımı.

## v11 (2026-10-12)
- **Renk:** mor/cırtlak palet kaldırıldı → kurumsal mavi/slate (`#2563eb/#3b82f6`, yüzeyler slate). Örnek-veri gradientleri de muted kurumsal tonlara çevrildi.
- **Rail:** 64→72px, etiket 10px, overflow-x hidden + ellipsis — taşma sıfır. Aktif efekti: inset shadow yerine solda 3px floating bar + yumuşak transition; hover hafif zemin.
- **Dosyalar:** ASCII ağaç kaldırıldı → Explorer tarzı ağaç (chevron expand/collapse, uzantı-renkli ikonlar, girinti). Panel ağacından dosya tık → ortada **ayrı sekme** (dedupe'li); orta Dosyalar sekmesinde aynı yüzeyde önizleme.
- **Viewer'lar (tür bazlı):** md → okuma render · kod → pre · json → pretty-print · png → gradient yer tutucu · html → sandbox iframe srcdoc + Önizleme/Kaynak toggle.
- **Panel thumb:** 34×24 → 72×46 (daima büyük); linklerde monogram thumb.
- **Taşma fixleri:** `.satir` değer/etiket ellipsis + sağ hizalama.
## v11.1 mobil (2026-10-13)
- **Taşma fixleri:** `.psat` baz kuralı eklendi (flex + space-between; ilk span `flex:1;min-width:0`, değer/hap `flex:0 0 auto`) — inline span'da ellipsis çalışmadığı için gelen-kutu satırları kartı taşırıyordu (R: 375px ölçüm). `.fview` `overflow-x:auto` — plan tablosu min-width 640px, mobilde kart içi yatay kaydırma (touch momentum).
- **Dokunma (≤880px):** tab/chat-tab/panel-kapat/ikon-btn/psatir/tab-toggle/mod-sec 44px; rail ikon-only (etiket gizli); html önizleme min 320px.
- **Tek sütun (≤560px):** pano-grid 1fr (span'ler sıfırlanır), donut 64px, galeri minmax 150px, composer max-width %100.
- **Genel:** `-webkit-tap-highlight-color:transparent` + interaktiflerde `touch-action:manipulation` (çift-dokunma zoom gecikmesi yok).
- **Doğrulama (R):** 375×812'de 10 yüzey (pano/plan/provider/galeri/dosyalar/linkler/dökümanlar/terminal/url/görev) 0 taşma + görünür interaktiflerde 40px altı 0 hedef; 1440×900 regresyon 0 taşma.
## v11.2 (2026-10-13)
- **Mobil paneller bottom-sheet (≤880px):** sol nav ve sağ chat dock yan drawer yerine alttan açılan sheet — full-width, yükseklik `min(72vh,560px)` nav / `min(78vh,620px)` chat, üst köşeler 18px radius, `translateY(112%)` ile gizli + .22s transition. Chat `.kapali` mobilde `display:flex` + transform (animasyon korunur); desktop'ta base `display:none` kuralı geçerli.
- **Composer sabitliği:** dock kapalıyken composer `.orta` altında sabit (flex:0 0 auto, bottom=viewport) — hem mobil hem desktop. Dock açıkken composer node'u dock içine taşınır (listener korunur).
- **Varsayılan:** mobilde dock kapalı + composer ortada; desktop'ta dock açık + composer dock içinde. mq change kullanıcı tercihini ezmez.
- **Doğrulama (R):** 375×812 — init dock kapalı/composer orta; nav sheet bottom:812 full-width 560px; chat sheet bottom:812 620px composer içinde; kapanışta composer orta bottom=812. 1440×900 — init dock açık/composer dock'ta; kapa→composer orta bottom=900 sabit; aç→geri. Taşma 0 her iki boyutta.
## v11.3 (2026-10-13)
- **Galeri:** `galeri.html` — 7 durum PNG'i (png/), filtre (Tumu/Mobil/Desktop), lightbox (tik+Esc), lazy yok (arka-plan sekmede IntersectionObserver ateslenmez). Mobil tek sutun, desktop auto-fill grid.
- **Hash durumlari:** mockup sonunda `hashDurumUygula` — `#nav` `#chat` `#plan` `#dock-kapali` (+ ile birlesir); galeri/ekran-goruntusu cekimlerinin durum girisi.
- **PNG uretimi:** `cek.mjs` — Edge headless + CDP setDeviceMetricsOverride (mobil 375x812 DPR2, desktop 1440x900 DPR1; `--window-size` <500px kenetlenir, kullanma); her kare oncesi DOM olcumu (bottom-sheet boyutlari, composer konumu, tasma=0).
- **Duzeltme:** composer-ust "10 calisiyor" rozeti kaldirildi (+408 −13 korundu).
- **tab-toggle sticky:** cok sekmeli mobilde Chat dugmesi tabbar kaymasinda sabit kalir (`position:sticky;right:4px`, R: scroll testi).
