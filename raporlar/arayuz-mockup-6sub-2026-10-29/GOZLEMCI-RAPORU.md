# GÖZLEMCİ RAPORU — ARAYÜZ İDEAL MOCKUP (6-subagent topolojisi)

Rol: gözlemci/ölçüm. Görev: ölçmek; öznel yorum yok. Komutan = ana oturum.
Damga: 2026-10-29 12:21:50 (Get-Date ile ölçüldü).

## Yöntem

- Kaynak sayım: her dosyanın ham UTF-8 metni `[System.IO.File]::ReadAllText` ile okunup .NET `[regex]::Matches` ile sayıldı (PowerShell 5.1). Kullanılan desen her satırda parantez içinde.
- Satır = ham `\n` sayımı (`Get-Content` satır dizisi uzunluğu ile doğrulandı); bayt = `Get-Item.Length`.
- Görev ID referans kümesi: `plans/gorev-grafigi-2026-10-26.json` → 40 ID: T0 S1 S3 S2 S4 S5 S6 A0-1 A0-2 A0-3 A0-4 A0-5 S7 A1 A2 A3 A4 EK1-1 EK1-2 EK1-3 EK1-4 EK1-5 EK1-6 K1 DC-S0 DC-G0 DC-S1 DC-S2 DC-S3 DC-S4 DC-H1 DC-S5 DC-S6 DC-H2 DC-S7 DC-S8 DC-H3 DC-S9 DC-S10 DC-H4.
- Sütun sırası: **v1-komuta | v2-harita | v3-sahne | mockup (mevcut taban)**. İlk tarama denemesinde sırasız hashtable sütun sırasını bozdu; tüm sayılar sıralı sözlükle yeniden koşuldu ve çapraz doğrulandı (aşağıdaki tablo kesin sayılardır).
- Emoji tanımı (göreve göre): U+1F300–U+1FAFF ve U+2600–U+27BF aralığındaki renkli semboller; `● ▸ ⧉ ✓ ↳ ↻ ▣ ▊` SERBEST. U+FE0F (VS16) ayrıca sayıldı.

## 1) Ölçüm tablosu

### Boyut / kimlik

| Ölçüm | v1-komuta | v2-harita | v3-sahne | mockup |
|---|---|---|---|---|
| Satır (ham `\n` sayımı) | 826 | 846 | 806 | 703 |
| Bayt (`Get-Item.Length`) | 65158 | 55483 | 52275 | 34453 |
| `<title>` metni | ORDU KUMANDA KONSOLU — VARYANT-1 KOMUTA (mockup · ÖRNEK-VERİ) | ORDU Harita Odası — variant-2 mockup (ÖRNEK-VERİ) | ORDU SAHNESİ — Varyant-3 · Mockup | ORDU Kumanda Konsolu — DALGA-1 Mockup (onaya sunuldu) |
| `lang=` değeri | tr | tr | tr | tr |

### Dış kaynak / ağ (beklenti: 0)

| Ölçüm (desen) | v1 | v2 | v3 | mockup |
|---|---|---|---|---|
| `(src\|href)\s*=\s*["']https?:` | 0 | 0 | 0 | 0 |
| `@import` | 0 | 0 | 0 | 0 |
| `url\(https?` | 0 | 0 | 0 | 0 |
| `fetch\(` | 0 | 0 | 0 | 0 |
| `XMLHttpRequest` | 0 | 0 | 0 | 0 |
| `EventSource` | 0 | 0 | 0 | 0 |
| `WebSocket` | 0 | 0 | 0 | 0 |
| `navigator\.sendBeacon` | 0 | 0 | 0 | 0 |
| **Ağ çağrısı toplam** | **0** | **0** | **0** | **0** |
| Toplam `(src\|href)\s*=\s*["']` atfı (yerel dahil) | 0 | 0 | 0 | 0 |
| Metinde `https?://` (çağrı değil, metin) | 0 | 0 | 1 | 0 |

Not: v3'teki tek `http://127.0.0.1:4377/tuval` statik görüntü metni (`<span id="onay-d1b-url">`), istek deseni değil.

### Dokunma

| Ölçüm (desen) | v1 | v2 | v3 | mockup |
|---|---|---|---|---|
| `--min-dokunma\s*:` tanımı | 1 (değer: `44px`) | 1 (`44px`) | 1 (`44px`) | 1 (`44px`) |
| `var\(--min-dokunma\)` fiili kullanım | 7 | 3 | 8 | 3 |
| Kullanan CSS özellikleri | min-height, min-width | min-height, min-width | min-height, min-width | min-height, min-width |
| `min-height:\s*44px\|height:\s*44px` doğrudan | 0 | 0 | 0 | 0 |
| `44px` token toplamı (tüm kaynak) | 3 (tanım + 2 yorum) | 1 (tanım) | 2 (tanım + 1 yorum) | 1 (tanım) |

### Kırılım

| Ölçüm (desen) | v1 | v2 | v3 | mockup |
|---|---|---|---|---|
| `@media` toplam | 4 | 6 | 4 | 3 |
| Gerçek kırılım listesi (`@media[^{]+`) | min640↑, min1024↑, max639↓, reduced-motion | min640↑×2, min1024↑×2, max639↓, reduced-motion | min640↑, min1024↑, max639↓, reduced-motion | min640↑, max639↓, reduced-motion |
| `max-width:\s*6[0-9]{2}px` (tüm kaynak) | 1 | 3 | 1 | 1 |
| `min-width:\s*64[0-9]px` | 1 | 2 | 1 | 1 |
| `min-width:\s*102[0-9]px` | 1 | 2 | 1 | 0 |
| 1024px kırılımı var mı | VAR | VAR | VAR | **YOK** |

Not: v2'nin 3 `max-width:6xx` eşleşmesinden 1'i `@media (max-width:639px)`, 2'si JS `matchMedia("(max-width:639px)")` çağrısı.

### Animasyon

| Ölçüm (desen) | v1 | v2 | v3 | mockup |
|---|---|---|---|---|
| `transition` tokeni | 9 | 2 | 9 | 9 |
| `animation` tokeni | 8 | 5 | 5 | 9 |
| `@keyframes` | 3 (halka, nabiz, suzulme) | 2 (mesaj-flash, nabiz) | 1 (nabiz) | 3 (nabiz, halka, suzulme) |
| transition değerlerindeki özellikler | transform, opacity, background, border-color, box-shadow | none (2 kural) | color, border-color, background, transform, opacity | transform, border-color, **max-height, margin**, background, opacity, box-shadow |
| @keyframes gövdesindeki özellikler | opacity, transform | opacity | opacity | opacity, transform |
| İzinli küme (transform\|opacity\|color\|background\|border-color\|box-shadow\|filter) dışında animasyonlu özellik | YOK | YOK | YOK | **EVET: max-height, margin** (`.detay` kuralı: `transition: max-height 320ms ease, margin 320ms ease`) |

### Hareket azaltma / erişilebilirlik

| Ölçüm (desen) | v1 | v2 | v3 | mockup |
|---|---|---|---|---|
| `prefers-reduced-motion` | 2 | 2 | 3 | 2 |
| `transition: none !important` (reduced-motion kapatması) | VAR | VAR | VAR | VAR |
| `focus-visible` | 3 | 3 | 7 | 3 |
| `role\s*=` | 16 | 8 | 13 | 6 |
| `aria-` | 49 | 35 | 37 | 30 |
| `tabular-nums` | 11 | 1 | 6 | 7 |

### Emoji

| Ölçüm | v1 | v2 | v3 | mockup |
|---|---|---|---|---|
| U+1F300–U+1FAFF | 0 | 0 | 0 | 0 |
| U+2600–U+27BF | 1 (U+2713 ✓ ×1) | 0 | 3 (U+2713 ✓ ×3) | 3 (U+2713 ✓ ×3) |
| U+FE0F (VS16, emoji zorlaması) | 0 | 0 | 0 | 0 |
| Serbest liste (● ▸ ⧉ ✓ ↳ ↻ ▣ ▊) dışında emoji | 0 | 0 | 0 | 0 |

### JS yüzeyi

| Ölçüm (desen) | v1 | v2 | v3 | mockup |
|---|---|---|---|---|
| `onclick` | 0 | 0 | 0 | 0 |
| `addEventListener` | 6 | 31 | 14 | 9 |
| `navigator\.clipboard` varlığı | VAR (3) | VAR (4) | VAR (3) | VAR (3) |
| `execCommand` yedeği | VAR (2) | VAR (2) | VAR (3) | VAR (2) |

### Dürüstlük işaretleri

| Ölçüm (desen) | v1 | v2 | v3 | mockup |
|---|---|---|---|---|
| `ÖRNEK\|örnek` eşleşme | 16 | 34 | 14 | 4 |
| Görünür şerit elemanı `<div class="serit">` | VAR | VAR | VAR | VAR |
| Şerit/gövde görünür ÖRNEK metni (etiketler arası) | 11 | 22 | 6 | 1 |
| `--confirm` | 1 — statik HTML, `<script>` dışı | 0 | 1 — statik HTML, `<script>` dışı | 1 — statik HTML, `<script>` dışı |
| `REPLAN ONAYLIYORUM` | 1 — statik HTML (`<span id="komut-rpl">`) | 0 | 1 — statik HTML (`id="onay-rpl-komut"`) | 1 — statik HTML (`<span id="komut-rpl">`) |
| JS'te dinamik üretimi | YOK | — | YOK | YOK |
| Metinde `plans/gorev-grafigi-2026-10-26.json` referansı | VAR (graf v14, salt-okur) | VAR (24/40 görev, salt-okur kopya) | VAR (40'tan 14 görev, salt-okur) | YOK |

### Gerçek veri (görev ID çapraz sayım)

| Ölçüm (desen) | v1 | v2 | v3 | mockup |
|---|---|---|---|---|
| `\b[A-Z]{1,2}[0-9]?-[A-Z0-9]+\b` toplam eşleşme | 37 | 93 | 36 | 5 |
| Benzersiz tireli token | 18 | 20 | 20 | 5 |
| Grafta geçen tireli token (gerçek) | 10 | 18 | 14 | 0 |
| **Gerçek X / toplam Y (tireli, benzersiz)** | **10/18** | **18/20** | **14/20** | **0/5** |
| Tire-siz graf ID de geçiyor | 8: T0 S1 S2 S3 S4 S5 S6 A2 | 12: T0 S1 S2 S3 S4 S5 S6 S7 A1 A2 A3 K1 | 9: T0 S1 S2 S3 S4 S5 S6 S7 A4 | yok |
| **Toplam gerçek (tireli+tiresiz, benzersiz / 40)** | **18/40** | **30/40** | **23/40** | **0/40** |
| Gömülü veri dizisi girdisi (`{...id:"..."}`) | 13 — tamamı graf ID | 24 — tamamı graf ID (dosyadaki "24/40" iddiasıyla eşit) | 17 = 14 graf ID + 3 rol etiketi (denetle/izle/yonet; dosyadaki "14 görev" iddiasıyla eşit) | 0 |
| Graf ID tekrar sayıları (gerçek) | DC-S1:4, DC-G0:2, DC-H1:2, DC-S0:2, DC-S2:2, DC-S3:2, DC-S4:2, DC-S5:2, DC-S6:2, DC-H2:1, S1:4, S3:3, A2:3, S2:2, S4:2, S5:2, S6:2, T0:1 | DC-S1:8, DC-S0:7, DC-G0:6, DC-H1:6, DC-H2:5, DC-H3:5, DC-H4:3, DC-S2..S6:5, DC-S7..S10:5, S1:12, S7:6, A0-2:2, A0-5:2, S2..S6:5, A1:2, A2:5, A3:2, K1:3, T0:2 | DC-S0:3, DC-G0:2, DC-H1:2, DC-S1:2, DC-S2:2, DC-S3:2, DC-S4:2, DC-S5:2, DC-S6:2, DC-H2:1, DC-H4:1, DC-S7:1, DC-S8:1, DC-S10:1, S1:2, S2..S6:2, S7:1, T0:1, A4:1 | — |

Grafta geçmeyen token'lar (desene uyan, graf ID'si olmayan; bağlamı kaynakta okundu):

| Dosya | Token(lar) | Kaynaktaki bağlam (olgusal) |
|---|---|---|
| v1 | EK-2, K-0044, K-0053, K-0054, V8-05, YZ-1, YZ-2, YZ-3 | EK-2: "onay cümlesi GUI'de üretilmez (EK-2)" kural referansı; K-0044/K-0053/K-0054: onay kartı ve kanıt defteri karar numaraları; V8-05: kanıt defteri ölçü kimliği; YZ-1/YZ-2/YZ-3: `data-not` özniteliğinde varyant yazarı etiketleri ("YZ-1 = bu dosyanın yazarı", "YZ-2 = variant-2-harita.html yazarı", "YZ-3 = variant-3-sahne.html yazarı") |
| v2 | EK-2, L-RT | EK-2: aynı kural referansı; L-RT: A0-5 görev başlığının içinde metin ("L-RT: üretim LocalLauncher + provider→CLI eşleme") |
| v3 | D-2, EK-2, K-0044, K-0053, K-0054, V8-05 | D-2: tasarım akışı referansı ("dispatch → coder → tester → ACCEPTED ... D-2, notify.jsonl→SSE"); diğerleri yukarıdakiyle aynı seri |
| mockup | EK-2, K-0044, K-0053, K-0054, V8-05 | Onay kartı / kanıt defteri / kural metinleri (görev ID'si iddiası yok) |

Hiçbir dosyada graf görev ID'si gibi sunulup grafta bulunmayan uydurma görev ID'si yok; grafta geçmeyen token'ların tamamı yukarıdaki repo serileri.

## 2) Sapma / uyarı listesi

Beklenen 4 kontrol (görev tanımından): ağ 0, emoji 0, reduced-motion VAR, 44px VAR.

| # | Kontrol | v1 | v2 | v3 | mockup | Sapma |
|---|---|---|---|---|---|---|
| B-1 | Ağ çağrısı 0 | 0 | 0 | 0 | 0 | YOK (0/4) |
| B-2 | Emoji 0 | 0 | 0 | 0 | 0 | YOK (U+2713 ✓ isabetleri v1:1, v3:3, mockup:3 — komutanın SERBEST listesinde; serbest-dışı 0/4) |
| B-3 | `prefers-reduced-motion` VAR | VAR | VAR | VAR | VAR | YOK (4/4) |
| B-4 | 44px VAR | VAR | VAR | VAR | VAR | YOK (4/4 — `--min-dokunma: 44px` tanımı + var() kullanımı üzerinden; doğrudan `height: 44px` deseni 4 dosyada da 0) |

Beklenen kontrol sapması: **0**. Ek kayıtlar:

- **UY-1 (mockup)**: animasyonlu özellik kümesi ihlali — `max-height` ve `margin` animasyonlu (`.detay { transition: max-height 320ms ease, margin 320ms ease; }`). İzinli küme: transform/opacity/color/background/border-color/box-shadow/filter. Not: mockup'un `prefers-reduced-motion` bloğunda `transition: none !important` ile kapatılıyor.
- **UY-2 (mockup)**: 1024px kırılımı yok (`@media` 3: 640↑, 639↓, reduced-motion).
- **UY-3 (mockup)**: grafta geçen görev ID'si 0/5 (tireli token'ların tamamı repo serisi: K-0044/K-0053/K-0054 karar, V8-05 ölçü, EK-2 kural); gömülü görev verisi 0 girdi. Şerit metni: "tüm sayılar ve kayıtlar ÖRNEKTİR".
- **UY-4 (v2)**: `--confirm` ve `REPLAN ONAYLIYORUM` geçmiyor (0); diğer 3 dosyada statik onay kartı metni var.
- **UY-5 (v3)**: gövde metninde 1 statik `http://127.0.0.1:4377/tuval` URL — ağ çağrısı deseni değil (B-1'e dahil değil).
- **UY-6 (ölçüm notu, v2)**: `max-width:\s*6[0-9]{2}px` deseninin 3 eşleşmesinden 2'si JS `matchMedia()` çağrısında; kırılım satırındaki gerçek değerler `@media` listesinden ayrıca verildi.

Ek kayıt toplamı: **6 (5 uyarı + 1 ölçüm notu)**.

## 3) Sayısal özet (tek paragraf)

Dört dosyanın dördünde de ağ çağrısı 0 (fetch/XMLHttpRequest/EventSource/WebSocket/sendBeacon ve `src|href=https?` atfının tamamı 0; toplam `src|href` atfı da 0 — tamamen kendi-yeterli dosyalar), `prefers-reduced-motion` VAR (2/2/3/2 token; hepsinde `transition: none !important` kapatması), ÖRNEK şeridi VAR (eşleşme 16/34/14/4; görünür `<div class="serit">` 4'ünde de mevcut) ve `--min-dokunma: 44px` tanımlı (4'ünde de 1; `var(--min-dokunma)` kullanımı 7/3/8/3, min-height+min-width üzerinde; doğrudan `height: 44px` deseni 0). Boyut 826/846/806/703 satır, 65158/55483/52275/34453 bayt. Kırılım: `@media` 4/6/4/3; v1/v2/v3 640↑+1024↑+639↓ taşır, mockup 1024'süz. Animasyon: transition tokeni 9/2/9/9, `@keyframes` 3/2/1/3; geçiş özellikleri v1/v2/v3'te izinli küme içinde, mockup'ta küme dışı 2 özellik (max-height, margin — 1 kural). Erişilebilirlik: `aria-` 49/35/37/30, `role=` 16/8/13/6, `focus-visible` 3/3/7/3, `tabular-nums` 11/1/6/7. Emoji (serbest liste dışı) 0/0/0/0 (U+2713 ✓ v1'de 1, v3 ve mockup'ta 3'er). JS: `onclick` 0; `addEventListener` 6/31/14/9; `navigator.clipboard` ve `execCommand` 4'ünde de VAR. Gerçek görev verisi: graftan benzersiz 18/30/23/0 ID (tireli oran 10/18, 18/20, 14/20, 0/5; gömülü veri girdisi 13/24/17/0 — v2'nin "24/40" ve v3'ün "14 görev" iddiaları sayımla eşit); grafta geçmeyen token'lar repo serileri (K-00xx karar, V8-05 ölçü, EK-2 kural, YZ-x yazar, L-RT başlık metni, D-2 tasarım) ve hiçbir dosyada görev ID'si olarak uydurma yok. Beklenen 4 kontrolde sapma 0; ek kayıt 6 (mockup 3: küme dışı animasyon, 1024 kırılımı yok, gerçek görev ID 0; v2 1: --confirm/REPLAN yok; v3 1: statik localhost URL; v2 1 ölçüm notu).
