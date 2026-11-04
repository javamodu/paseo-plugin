# TASARIM MANİFESTOSU — ordu arayüz dili (SSOT · TASARIM KAPISI)

> **Statü:** Bu dosya ARAYÜZ/TASARIM işlerinin tek-doğru-kaynağıdır (SSOT). **Tasarım kapısıdır: emirden ötedir** —
> her UI işi bu kapıdan geçmeden «bitti» İLAN EDİLEMEZ. Kullanıcı bu ilkeleri defalarca söyledi;
> bu dosya onların kalıcı yazılışıdır. Aynı ilkeleri sohbette yeniden tartışmak/talep etmek ZORUNLU DEĞİLDİR —
> buraya atıf yeter. İlkeyi değiştirmek yalnız kullanıcı emriyle olur (ajan değiştiremez; ANAYASA çerçevesi).
> Kaynak zinciri: kullanıcı emirleri (2026-10-13 mockup dalgaları · 2026-10-29 R2/DALGA-0-2 brief · 2026-10-29 K8 tuval · 2026-10-29 K2 turu)
> + [BRIEF-R2-TASARIM](../raporlar/dalga0-2-arayuz-2026-10-29/BRIEF-R2-TASARIM.md) + [STATE_BOARD](../STATE_BOARD.md) K8/K2 damgaları.

> **REVİZYON 2026-11-04 (kullanıcı emri — üstün):** «chat paneli daralt en geniş sağdaki panel olsun .. minimal
> komplat yap okunaklı olsun chat yazıları .. sayfa geneli tasarım dili kötü eski ve modern değil ... akıcı net
> profesyonel arayüz yap». Bu emirle: §1 «büyük yazılar» → **KOMPAKT-OKUNAKLI ölçek**; §2 «cömert nefes» →
> **EKONOMİK minimal ritim**; **kolon doktrini** (§2a) EKLENDİ: sağ panel EN GENİŞ · chat kolon DAR (balon genişlik
> tavanı · dar görünüm) · sol ağaç kompakt. Eski «büyük yazılar/nefes alan» dili bu revizyonla değişir; okunaklılık
> tabanı ve diğer maddeler AYNEN yürür.

## 1. KOMPAKT-OKUNAKLI ÖLÇEK (REVİZYON 2026-11-04)

- Baz font **~13px**; **chat balon metni 14-15px + rahat satır yüksekliği (okunaklılık şart — «okunaklı olsun chat yazıları»)**; başlık 15-16px; meta/rozet 11-12px BİLİNÇLİ.
- Küçültme «sığdırma» değil ÖLÇÜ: her boyut okunaklılık tabanını korur; kimlik (id) etiketleri okunur kalır. Sayı/monospace tabular-nums AYNEN.

## 2. MİNİMAL RİTİM (tek bakışta · kompakt · REVİZYON 2026-11-04)

- **Tek viewport**: her şey tek bakışta görülür; sayfa scroll'u BİTER — uzun içerik panel-İÇİ kayar (overflow-y) AYNEN.
- Boşluklar **EKONOMİK** (minimal-kompakt ritim); iç içe kutu/çerçeve katmanı YOK — düz yüzey + ince ayırıcı. 44px dokunma ritmi etkileşimlilerde KORUNUR (K-0061).
- Paneller arası duvar **İNCE** (K2: 6px; kalın ayırıcı yasak). Splitter ince tutamaçla sürüklenir.
- Üst tepe bantları/uzun açıklama şeritleri YOK — bilgi bileşeninin yanında/içinde yaşar AYNEN.

## 2a. KOLON DOKTRİNİ (REVİZYON 2026-11-04)

- **Sağ panel (sekmeli bölüm) EN GENİŞ**; **chat (orta) DAR** — balon/genişlik tavanıyla (~640-680px) dar görünüm, kalan boşluk kenara nefes; **sol ağaç kompakt**.
- Eski kayıtlı genişlikler yeni ölçeği EZMEZ (anahtar sürümü/tek sıfırlama — uygulama detayı dalgada). Splitter + kalıcılık mekanizması AYNEN.

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

## REVİZYON 2026-11-04 (FAZ-U — PANEL-ANA-1 sekme şeridi renkli çip ailesi)

- Kullanıcı emri: «üst butonlar minimal ve renkli modernyalın olsun .. aynı projede iki oturum yanyana aynı renk olsun» — şerit butonlarına **pastel proje tonu** ailesi eklendi.
- Kural: ton/doygunluk SABİT (pasif zemin 45%/92%, kenar 40%/72%; aktif kenar 55%/42%) — **ton proje kimliğinden (dizin) deterministik string hash**; localStorage'a GİRMEZ, reload'da aynı.
- ORDU sabit butonu ton ALMAZ (camgöbeği ailesi aynen); kayıt düşmüş oturum ton almaz (gri ailesi).
- Palet büyümez: YENİ renk token YOK — `hsl()` literal + `--proje-ton` satır-içi değişken (JS `tonHesapla`).
- Kuru dil korunur: ::after üst vurgu YOK · keyframes YOK · box-shadow YOK · radius-cip/32px AYNEN; rozetler (çalışan sayısı · hata ikonu · durum noktası) ağacın AYNI kaynak verisinden, buton İÇİNDE.
