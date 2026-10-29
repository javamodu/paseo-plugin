# TASARIM MANİFESTOSU — ordu arayüz dili (SSOT · TASARIM KAPISI)

> **Statü:** Bu dosya ARAYÜZ/TASARIM işlerinin tek-doğru-kaynağıdır (SSOT). **Tasarım kapısıdır: emirden ötedir** —
> her UI işi bu kapıdan geçmeden «bitti» İLAN EDİLEMEZ. Kullanıcı bu ilkeleri defalarca söyledi;
> bu dosya onların kalıcı yazılışıdır. Aynı ilkeleri sohbette yeniden tartışmak/talep etmek ZORUNLU DEĞİLDİR —
> buraya atıf yeter. İlkeyi değiştirmek yalnız kullanıcı emriyle olur (ajan değiştiremez; ANAYASA çerçevesi).
> Kaynak zinciri: kullanıcı emirleri (2026-10-13 mockup dalgaları · 2026-10-29 R2/DALGA-0-2 brief · 2026-10-29 K8 tuval · 2026-10-29 K2 turu)
> + [BRIEF-R2-TASARIM](../raporlar/dalga0-2-arayuz-2026-10-29/BRIEF-R2-TASARIM.md) + [STATE_BOARD](../STATE_BOARD.md) K8/K2 damgaları.

## 1. BÜYÜK YAZILAR (küçültme YASAK)

- Baz font **≥15-16px**; bölüm başlıkları **20-24px**; etiket/alt metin 13px'ten Küçük kalıp yalnız meta/rozet sınırında ve BİLİNÇLİ.
- Yeni bileşen yazı boyutu bu ölçeğe OTURMAK zorundadır. «Sığdırayım» gerekçesiyle küçültme = kapı ihlali.
- Sayı/monospace alanlar tabular-nums; kimlik (id) etiketleri okunur boyutta kalır.

## 2. NEFES ALAN TASARIM (ferah · tek bakışta)

- **Tek viewport**: her şey tek bakışta görülür; sayfa scroll'u BİTER — uzun içerik panel-İÇİ kayar (overflow-y).
- Boşluklar CÖMERT: sıkışık satır/sütun = kapsam hatası. Panel içi dolum 44px'lik dokunma ritmiyle nefes alır.
- Paneller arası duvar **İNCE** (K2: 6px; kalın ayırıcı yasak). Splitter ince tutamaçla sürüklenir.
- Üst tepe bantları/uzun açıklama şeritleri YOK (K2: tepe dürüstlük şeridi söküldü) — bilgi bileşeninin yanında/ içinde yaşar.

## 3. BÜYÜK GÖRSELLER

- Görsel ağırlık: DAG/tuval/kartlar EKRANI DOMİNE eder; minik simgeler-dekorasyon değil Büyük çizimler.
- Ekran görüntüsü kanıtları tam çerezsiz gerçek durumla alınır (1440×900 temel + mobil kırılım).

## 4. TEMİZ MODERN DİL

- **Light tema** (açık zemin); modern temiz tipografi; sistem font ailesi.
- **Emoji YASAK** — ikonlar inline SVG (stroke tabanlı, aria-hidden + aria-label/title ile).
- Renk tokenları: `:root` değişkenlerinden (camgöbeği/menevse/başarı/uyarı/tehlike) — dağınık hex YOK.

## 5. DOKUNMA + MOBİL (responsive)

- **44px dokunma hedefi** (`--min-dokunma`): her etkileşimli öğe; küçük görünür alan + geniş tıklama kabulu.
- Klavye + aria eksiksiz (role/aria-pressed/aria-expanded/aria-valuenow; Enter/Space/ok tuşları; focus-visible).
- Kırılım: **≥1024** çok-sütun grid + panel aç/kapa + resize (splitter); **<1024** tek kolon akış (body scroll döner), sol panel overlay drawer (hamburger + perde + Esc + scroll kilidi).
- Paneller açılır/kapanır + yeniden boyutlanır; genişlik kalıcıdır (localStorage) — 180px nefes-alt sınırı, 45vw üst sınır.

## 6. AKIŞKAN + HİJYENİK HAREKET

- Panel/sekme geçişleri akışkan; **E12 kuralı**: animasyon yalnız `transform`/`opacity`, ≤600ms, `@keyframes` YOK.
- `prefers-reduced-motion` TÜM animasyon/geçişi kapatır.
- Grid yerleşimi AÇIK (çocuklar sabit kolonda) — panel gizleme yerleşim kaydırMAZ (K2 orta-kayma bug dersi).

## 7. SAF YÜZ — STATE YAZILARI YOK

- Kullanıcı emri (K8): **«her yerdeki state yazılarını kaldır — saf fonksiyon ve açık menüler odaklı»**.
- Canlı sayaç/rozet/«N görev · X kenar» tarzı meta yazıları EKRANA YAZILMAZ (kimlik: document.title yalnız graf sürümü).
- Veri yüzde YALNIZ iş içerik; durum DOM rengi/title ile taşınır (görsel gürültü YOK).

## 8. DÜRÜSTLÜK (tasarımın ahlakı)

- **Sahte veri/ölü buton YOK** (fail-closed): sunucu ölürse kırmızı yüz; bayat veri ekranda kalmaz; «yakında» kartı yasak.
- Kalp-yüzü (canlı olmayan) her bileşen **ÖRNEK** etiketi taşır; graf/DAG GERÇEK etiketli.
- Onay cümlesi GUI'de üretilmez/çalıştırılmaz (EK-2 — insan kapısı).

## KAPİ DENETİMİ (bir UI işi nasıl kapanır)

1. Yazı ölçekleri bu manifestoya göre (§1) · nefes/duvar (§2) · ikon SVG (§4) · 44px+aria (§5) · hareket hijyeni (§6) · state sökümü (§7) · dürüstlük (§8).
2. Test paketi vaka iddiaları manifesto maddelerine bağlanır; DOM dumanı + ekran PNG kanıtı.
3. **Kapıyı geçmeyen iş «bitti» ilan EDİLMEZ** — ölçütlere ekle, düzelt, yeniden kanıtla.
4. Görsel kabul (K2) kullanıcıda; bu manifesto kabul SİNYALİ değil Kabul KAPISIDIR — ikisi birlikte çalışır.
