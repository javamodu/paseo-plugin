# DESIGN.md — Pano Mockup Tasarım Sistemi (v7)

Kapsam: `plans/mockup/pano-mockup-2026-10-12.html` — tek dosya vanilla, bağımlılık yok.
İlkeler: big/bold/clean · uyarı bandı yok · **emoji yok** (ikonlar inline SVG) · sistem fontu · sıfır dış istek.

## 1. Tokenlar
| Token | Değer | Kullanım |
|---|---|---|
| `--bg` | #0a0a10 (+ radial mor ışıma) | zemin |
| `--kart` / `--kart2` | #12121b / #1a1a26 | yüzeyler |
| `--sinir` | rgba(255,255,255,.06) | kenarlıklar |
| `--metin` / `--soluk` | #eceaf4 / #9a9aac | tipografi |
| `--vurgu` / `--vurgu2` | #8b5cf6 / #a855f7 | gradyan + aksiyon |
| `--yesil/--sari/--kirmizi` | #34d399 / #fbbf24 / #f87171 | durum |
| `--r` | 16px | kart radius |
Tipografi: gövde 15px · h2 22px/800 · hero 52px/800 (mobil 34px) · `.buyuk` 32px/800.

## 2. Yerleşim
`grid: 64px | auto(320) | 1fr | auto(300)` = rail · sol panel · orta · sağ panel.
- **İki panel de resize**: sol 220–480 (sol-handle), sağ 240–560 (sag-handle); ortak `surukleKur()`.
- Tabbar: sekmeler solda, "+" yanında, **panel toggle en sağda** (margin-left:auto + appendChild sırası).
- Composer: ortalı 780px sütun; üstte mod segmenti + durum çipleri; pill içinde attach/mic/send.
- Sağ panel varsayılan sekmesi: **Pano** (tek bakışta tüm metrikler).

## 3. Composer modları (5)
| Mod | Yapar | Yapamaz |
|---|---|---|
| Orkestrasyon | task topolojisine dağıtır, izler/denetler/puanlar | kod edit |
| Plan | plan üretir/inceler | kod |
| Coder | kod yazar | plan değiştirme, orkestrasyon |
| Manager | ana yönetici — hepsinin üstünde | — |
| Ask | inceler/yorumlar | her türlü yazım |
Varsayılan: manager. Mod placeholder'ı ve sahte yanıtı `MODLAR` sözlüğünden gelir.

## 4. Veri-odaklı mimari (AI ile genişletme)
Markup değil **veri** düzenlenir:
- `VERI.planlar` → Plan paneli (Excel-satır, ID'li, sprint akordiyonu)
- `VERI.gorevler` → Orkestrasyon görev listesi → tıkla → orta "Görev" detay sekmesi
- `MODLAR` → composer modları · `RAIL` → rail öğeleri · `SAG` → sağ sekmeler · `TUR` → orta sekme türleri · `I{}` → ikonlar
Yeni X eklemek = ilgili sözlüğe/diziye kayıt (+ X'in türüyse `<template id="tpl-X">`).

## 5. Bileşenler
kart · hap (ok/uyari/kotu/notr) · satir · gorev (.gsatir tıklanabilir) · ptablo (prow/psprint/psub/palt) · sagtabbar · mod-serit · hero (.grad) · chat-mesaj · term · agac.

## 6. Responsive + dokunmatik
- Kırılım **880px**: rail 52px; sol panel drawer (backdrop'lu); sağ panel overlay (min(86vw,360px)).
- Dokunma hedefleri: rail 48px, tab/ikon-btn 38–42px, send 44px.
- Hareket: 150–180ms ease; layout shift yok.

## 7. Performans (Lighthouse/CWV 100 hedefi)
Tek dosya · dış istek yok · sistem fontu · inline SVG · `content-visibility:auto` kartlarda · sabit grid (CLS yok).

## 8. Kurallar (bu dosyayı düzenleyen AI için)
1. Emoji/plastik ikon yasak — ikon = `I{}` içine inline SVG.
2. Renkler yalnız token; uyarı/bilgi bandı eklenmez.
3. Yeni içerik statik HTML değil, `VERI`/`MODLAR`/`RAIL`/`SAG`/`TUR` kaydıdır.
4. Türkçe UI metni; dosya UTF-8 LF.
5. Örnek veri işareti: yalnız sağ panel altındaki küçük `.kaynak` satırı.
