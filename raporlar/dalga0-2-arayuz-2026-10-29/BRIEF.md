# DALGA-0-2 BRIEF — kapsül-tuval'e İDEAL YÜZ inşası (mockup-final → gerçek veri)

**Dalga kimliği:** DALGA-0-2 (KAPI-HARITASI K1 ürünü; kullanıcı «DALGA-0-2 başla», 2026-10-29 13:11). Hat: **K-0053** — yazar ayrı worktree/branch'te; merge + anında tam kanal + tip + hedefli yeniden-koşum OPERATÖRDE.
**Tasarım SSOT:** `raporlar/arayuz-mockup-6sub-2026-10-29/mockup-final.html` (1245 satır; 6-subagent sentez + denetçi 6 onarımı + drawer). DERSLER kaynağı: `raporlar/dalga0-arayuz-2026-10-29/YAZAR-RAPORU.md`.

## 1. Hedef (EK-3)

`pano/kapsul-tuval.html` mevcut yüzünü İDEAL YÜZ ile değiştir — **İKİ TEMEL birlikte** (R2):
- **Temel (a):** solda DRAWER (≥1024px sabit + GRAF düğmesi toggle; <1024px hamburger + overlay perde + Esc + body scroll kilidi + aria-expanded senkronu) içinde İZLE/DENETLE/YÖNET nav + **faz-gruplu görev ağacı** («(faz yok)» dali korunur — 40 görevden 24'ü fazsız, uydurma faz YOK) → satır seçince sağda **kapsül detay kartı** (İNSAN/MAKİNE OKUR + bağımlılık çipleri — çipe dokununca zincirde gezinir, `sec(dep)`).
- **Temel (b) kalp yüzü:** GENEL STATE şeridi · 6-rollü ordu şeridi · run kartları · onay-bekleyenler (rpl-03579e06/D-1b/K-0044 — kopyala GERÇEK panoya yazar) · kanıt defteri (mono akış) · `$` komut kutusu (odak ışıması + şablon önerisi; Enter → panoya kopyala).
- **İZLE sekmesinde DAG:** mevcut `yerlesim` SVG çizimi mockup'ın viewBox zoom/pan (tekerlek+ sürükle) deseniyle güçlendirilir; döngüde-çizilmez kuralı korunur.

## 2. Çıktı formatı

- `pano/kapsul-tuval.html` (DÜZENLENECEK — tek dosya, 0 dış bağımlılık, inline CSS/JS)
- `pano/kapsul-tuval.test.mjs` (DÜZENLENECEK — mevcut 8 vaka KORUNUR + §6'daki yeniler)
- `raporlar/dalga0-2-arayuz-2026-10-29/YAZAR-RAPORU.md` (YENİ)

## 3. Veri kaynak matrisi (dürüstlük — mockup'ın GERÇEK/ORNEK etiket sistemi)

| Öğe | Kaynak | Etiket |
|---|---|---|
| görev ağacı, GENEL STATE, detay kartı, bağımlılık çipleri, DAG | `fetch('/api/graf')` — mevcut uç, sözleşme DEĞİŞMEZ | GERÇEK |
| ordu şeridi, run kartları, onay-bekleyenler, kanıt defteri, komut kutusu verisi | kalp verisi (core 8790 /api/status) — **bu dalgada bağlanMAZ** (server.js yazma yasağı) | **ÖRNEK** — görünür sarı etiket; gerçek bağ D-2 dalgası |

ÖRNEK etiketsiz sahte veri YASAK; ÖRNEK satır üstte sarı şeritle de beyan edilir (mockup §dürüstlük deseni).

## 4. Donmuş sözleşmeler (YAZMA YASAK)

- `pano/server.js` DEĞİŞTİRİLMEZ (graf SSOT salt-okur; OKU + izole smoke'ta ÇALIŞTIR).
- `core/`, `scripts/`, graf JSON DEĞİŞMEZ. `node src/pano-server.ts` (8790) YAZMA YASAK.
- DALGA-0 mirası KORUNUR: `kirmiziYuz` fail-closed · İNSAN/MAKİNE OKUR (`modUygula` aynı fetch) · `sec(id)` + kartIcerik · 30sn auto-refresh · yerlesim döngüde-çizilmez.
- Onay cümlesi GUI'de ÜRETİLMEZ/ÇALIŞTIRILMAZ (EK-2) — yalnız panoya kopyalanır. GUI onay düğmeleri PASİF (D-2 ölçütü).
- Her buton ölü değil: tıklanınca ne yapacağını söyler (mockup deseni).

## 5. Görev sınırı

- Mevcut dosya ≤3: kapsul-tuval.html + kapsul-tuval.test.mjs (+ YAZAR-RAPORU.md yeni).
- Yeni bağımlılık YOK: webfont/CDN/emoji YASAK (inline SVG ikon; sistem font stack; touch hedefi ≥44px; `prefers-reduced-motion` kapatması; animasyon yalnız transform/opacity ≤600ms; `touch-action: manipulation`).
- Mobil <640 tek kolon; 640-1023 drawer hamburger modu; ≥1024 drawer sabit.

## 6. Yazar akışı (tur içi — TAM KANAL YOK; hedefli seçici deterministik)

1. readFiles: mockup-final.html · kapsul-tuval.html (269 satır) · kapsul-tuval.test.mjs (98) · pano/server.js (OKU) · raporlar/dalga0-arayuz-2026-10-29/YAZAR-RAPORU.md.
2. Kod + test. Test genişletmeleri (mevcut 8 KORUNUR):
   - drawer kaynak-işaretleri: `aria-expanded` senkronu · `Escape` dinleyicisi · perde elemanı · `min-width:1024px` media query · hamburger;
   - İKİ-TEMEL varlığı: faz-gruplama + «(faz yok)» · İZLE/DENETLE/YÖNET · detay kartı · ordu şeridi · defter · komut kutusu;
   - ÖRNEK-etiket sistemi: kalp-yüzü öğeleri etiketli, graf-yüzü öğeleri etiketsiz (kaynak tarama);
   - kopyala düğmeleri clipboard'a gider; onay-cümmesi üretim/çalıştırma YOK (komut kutusu yalnız kopyalar);
   - 44px · reduced-motion · emoji-yok · dış-fetch-yalnız-graf.
3. `node --test pano/kapsul-tuval.test.mjs` (pano/ dizininden) — İKİ bağımsız koşum.
4. `npm run tip` (core/ dizininden) — yeşil kalmalı (dokunmuyorsan değişmez).
5. İzole smoke: `PANO_PORT=<boş port> node pano/server.js` → GET /tuval 200 + /api/graf 40 görev (server ÇALIŞTIRILIR, yazılmaz; DALGA-0 deseni PANO_PORT=4879).
6. Branch'inde commit: mesajı %TEMP% dosyayla `git commit -F` (PS 5.1 çift tırnak tuzak); emoji YOK; satır sonu `Co-Authored-By: Claude Code <noreply@anthropic.com>`.
7. YAZAR-RAPORU.md: branch adı + son hash + test X/X (iki koşum süreleriyle) + smoke sonucu + LOC (+/−) + **dürüst notlar** (sığmayan/ertelenen öğeler adıyla; ÖRNEK kalan veriler listesi).

## 7. Yapılmayacaklar

- Test adedi/süit üyeliği kırılmaz; eşik gevşetilmez; sahte yeşil yok (fail-closed davranış testten düşürülmez).
- Merge/push YOK — yalnız kendi branch'inde; operatör (ana oturum) merge + tam kanalı koşar.
- core/data/*, production defterleri, CODEMAP, STATE YAZMA (operatör alanı).
