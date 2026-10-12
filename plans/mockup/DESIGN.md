# DESIGN.md — Pano Mockup Tasarım Sistemi (v10)

Kapsam: \`plans/mockup/pano-mockup-2026-10-12.html\` — tek dosya vanilla, bağımlılık yok.
İlkeler: big/bold/clean · uyarı bandı yok · **emoji yok** (ikonlar inline SVG, \`I{}\`) · sistem fontu · sıfır dış istek · veri-odaklı (markup değil veri düzenlenir).

## 1. Tokenlar
| Token | Değer | Kullanım |
|---|---|---|
| \`--bg\` | #0a0a10 (+ radial mor ışıma) | zemin |
| \`--kart\` / \`--kart2\` | #12121b / #1a1a26 | yüzeyler |
| \`--sinir\` | rgba(255,255,255,.06) | kenarlıklar |
| \`--metin\` / \`--soluk\` | #eceaf4 / #9a9aac | tipografi |
| \`--vurgu\` / \`--vurgu2\` | #8b5cf6 / #a855f7 | gradyan + aksiyon |
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
