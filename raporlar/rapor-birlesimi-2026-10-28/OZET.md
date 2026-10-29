# Özet — Rapor birleştirme ve belge kilidi plan düzenlemesi

**Tarih:** 28 Ekim 2026. **Kimlik:** RBT-2026-10-28.1. **Durum: PLAN DÜZENLENDİ; BİRLEŞİM BAŞLATILMADI; KİLİT YOK.**

Kullanıcının “planı bu şekilde düzenle” emri [ana planın §26 ekine](../../plans/PLAN.md:588) işlendi. Bu dosya ikinci aktif plan veya tamamlanmış birleşik eksik defteri değildir. Ürün yürütmesi [v2.10.1 §25](../../plans/PLAN.md:422), görev projeksiyonu [v14](../../plans/gorev-grafigi-2026-10-26.json) olarak kalır. Karar: [ADR](../../kararlar/ADR-rapor-birlesimi-belge-kilidi-2026-10-28.md). Makine ikizi: [birleşim kaydı](birlesim.json).

## Bu turda düzenlenen kapsam

- Tek ana planda B0 kaynak sabitleme → B1 iddia uzlaştırma → B2 kabul/sorumluluk eşleme → B3 belge birleşimi → B4 bağımsız doğrulama → B5 ayrı insan kabulüyle belge kilidi tanımlandı.
- Kaynak yolu/özgün kimlik/sürüm üçlüsü, tekrar ve kanıt ayrımları; rapor hatası ile ürün açığının ayrı tutulması kararlaştırıldı.
- Tarihsel sıra, boş kapı kararları, S0 alt adımları, NOT_RUN/ölçüt ayrımı, puan ölçekleri, bütçe tarihçesi, bayat insan kuyruğu, K-SADE sınırı ve boş özet için B1/B3 işleri plana alındı.
- Asıl açık-iş kaynağı [mevcut eksik defteri](../birlesik-eksik-defteri-2026-10-25/DEFTER.md) olarak kaldı. Kaynak raporlara erata eklenmesi ve defter eşlemesi **bu turda uygulanmadı**.

## Aşamaların dürüst durumu

| Aşama | Durum | Kapanış için gereken |
|---|---|---|
| B0 kaynak sabitleme | NOT_STARTED | Ayrı başlatma/kapsam emri, bütün kaynak envanteri ve sahiplik/kesim noktası |
| B1 uzlaştırma | NOT_STARTED | Her ham iddia için gerekçeli sınıf ve etkin düzeltme adayı |
| B2 kabul eşleme | NOT_STARTED | Kanonik iş, DC bağı, sorumlu, sınama/eşik/kanal/kanıt/insan kapısı |
| B3 belge birleşimi | NOT_STARTED | Kaynak erataları, boş denetim özeti, mevcut defter eki ve eş insan/makine sonuç |
| B4 kilit adayı doğrulama | NOT_STARTED | Birleşmiş adayın kapsamlı belge/okuyucu/değişmezlik kontrolü ve güncel sağlık |
| B5 final belge kilidi | NOT_STARTED | B4 kanıtı + ayrı insan kabulü; commit/tag/push için kendi izinleri |

[Başlangıç kaydı](baslangic-duzenleme.json) yalnız **bu plan düzenlemesinin** öncesindeki kimlikleri ve kirli ağacı sabitler; bütün birleşimin B0 kapanışı değildir. Kayıttaki korunan dosya adedi, satır-satır okuma veya ürün testi kapsamı değildir.

## Sayısal ve yetkisel sınır

19/40 = **%47,5** eşit ağırlıklı kontrol oranı; **48,75/100** ayrı ağırlıklı hazırlık endeksi; **3,9125/10** ayrı olgunluk değerlendirmesi (T). H1 **5,775**, H4 **8,775** koşullu projeksiyondur (T); mevcut ürün iyileşmesi veya bir ölçeğin diğerine dönüşümü değildir. Bu açıklamanın kaynak raporlara etkin erata olarak işlenmesi B1/B3 işidir.

Kayıtlı kabul 81/135 ve 11 DC NOT_RUN bu plan düzenlemesiyle değiştirilmez. İlk nominal 3.980/9.980 tarihçe; yerine geçen H1 5.880–9.450 / bütün yol 12.320–19.390 teknik LOC (T) onaysızdır. Canlı/ücretli kampanya, ürün kodu, kabul şeması, K-SADE, süreç sınaması, commit/tag/push ve final kilit uygulanmadı.

## Kanıt ve sonraki adım

Bu turun belge doğrulaması, birleşimin B4'ü veya tam ürün regresyonu değildir. Sağlık ve değişmezlik sonucu ayrı ölçülmüş doğrulama kaydına alınır; önceki 18 OK/0 EKSİK sonucu bugünkü ölçüm diye kullanılmaz. Kaynak raporların yeniden incelenmesi yeni bağımsız performans deneyi değildir.

Sonraki belge işi, ayrıca başlatma/kapsam emri verilirse **B0**'dır. İlk ürün işi, ayrıca izin verilirse **DC-S0a salt-okur keşfi**dir. Final kilit ve ürün kabulü birbirinden ayrıdır.

## Plan düzenlemesinin doğrulaması (R; B4/final kilit değildir)

[İlk belge doğrulaması](dogrulama-duzenleme.json): **388 kontrol geçti**, **56 bağlantı** kontrol edildi; önceki ana plan bayt ön eki, eski durum/indeks metinleri ve **272 dosya** korundu. Bunun **248'i korunan bileşen dosyasıdır**; okuma veya ürün test kapsamı sayısı değildir. Kabul defteri 135 toplam / 81 yeşil / 11 DC NOT_RUN; durum belgesi 100 satır. Kaynak raporlar, graf, hedef, sözleşme ve mevcut eksik defteri değiştirilmedi. Boş denetim özeti B3 işi olarak açık kaldı; sadece varlığıyla yeşile çevrilmedi.

[CODEMAP koşumu](codemap-duzenleme.log) ve [sağlık kaydı](saglik-duzenleme.json): **18 OK, 0 EKSİK, 2 SARI**, iki komut da exit 0. Tam çıktı [sağlık günlüğünde](saglik-duzenleme.log); bu kayıtlar bu plan düzenlemesinin kontrolleridir, ürün tam regresyonu veya canlı başarı kanıtı değildir.

| SARI | Gerekçe / sorumlu | Karar durumu |
|---|---|---|
| Kural-proxy 80 | Mevcut tavan dolu; K-SADE madde/varyant ve uygulama kararı insanda. | Uygulanmadı; B5 için kabul edilmiş sayılmıyor. |
| 31 GECTI_HERMETIC | Hermetik kayıtlar canlı kanıt yerine sayılmadı; ilgili tester/DC işi ve insan kapısı korunur. | Yeni PASS/canlı kapanış üretilmedi; B5 için ayrı değerlendirme gerekir. |

Commit/tag/push, belge kilidi, süreç/sağlayıcı koşumu, K-SADE, kaynak erataları ve tam defter birleşimi yapılmadı. B0..B5 durumu hâlâ NOT_STARTED'dır.

## Etkin devam kaydı — RBT-2026-10-28.2 (28 Ekim 2026)

Yukarıdaki gövde .1 plan düzenlemesinin tarihli başlangıcıdır. Kullanıcının sonraki “yukarıdaki kapanışları tamamla” emriyle belge birleşimi açıldı: kaynak erataları, boş denetim özeti, 150 kaynak kimliğinin [mevcut defter DC ekine](../birlesik-eksik-defteri-2026-10-25/DC-2026-10-28.json) eşlemesi, sonuç denetçisi v2 ve giriş/veri politikası işlendi. Eski NOT_STARTED alanları ve rapor değerleri silinmedi; etkin durum [kapanış makine kaydından](../kilit-oncesi-kapanis-2026-10-28/kapanis.json) okunur.

B0..B3 için belge teslimleri kaydedilir; B4 sadece güncel komut ve bağımsız inceleme kanıtıyla ilerler. B5 final insan kabulü, kesin commit/tag ve temiz repo iddiası yoktur. Ürün görevleri, K-SADE, S0a/S0b veya sağlayıcı harcaması bu belge kapanışıyla başlamaz. [Etkin rapor ve aday sınırı](../kilit-oncesi-kapanis-2026-10-28/OZET.md).
