# ADR — Kilit öncesi belge ve paket kapanışları

**Tarih:** 28 Ekim 2026. **Emir:** “yukarıdaki kapanışları tamamla”. **Kapsam:** Belge/paket düzeltmesi, rapor uzlaştırması, runtime dışlama ve navigasyon, B0–B4 doğrulaması ve hash bağlı kilit adayı. Ürün uygulaması veya B5 final insan kabulü değildir.

## Karar

- [Ana plan](../plans/PLAN.md) §25 ürün yürütme revizyonu v2.10.1, graf v14 ve mevcut kabul durumları korunur; etkin belge kapanışı §28'de izlenir.
- [ATOM-H1-2026-10-28.2](../plans/uygulama-paketleri/DC-H1-2026-10-28/OZET.md): S0a kaynak okuma/kanıt kapsamına yalnız S0a-04'ün TASLAK ADR önerisi açıkça bağlandı. İnsan/ürün/OS/harcama kararları yine boş. Pilot aktör kapsamları fişte ayrıldı.
- Sonuç şeması v2: bütün zorunlu kaynaklar, komut/cwd/çıkış/çıktı referansı, kendi görev kökündeki mevcut ve hash/byte kimlikli kanıt kontrol edilir. Biçim/kayıt doğrulaması gerçek komutu yeniden çalıştırmak, kimliği yetkilendirmek veya ürün kabulü değildir.
- Kaynak raporların eski gövdeleri/alanları korunur, tarihli erata eklenir. 150 kaynak kimliği [mevcut defterin DC ekine](../raporlar/birlesik-eksik-defteri-2026-10-25/DC-2026-10-28.json) tekilleştirilir; açık ürün işlerine yeni PASS verilmez. Boş denetim özeti mevcut kayıttan tamamlanır.
- [Veri yerleşimi](../plans/VERI-YERLESIMI.md) mevcut iki runtime kökünü ve kaynaklarını açıklar; DB/JSONL taşınmaz/açılmaz/silinmez. İki kökün WAL/SHM dosyaları ve geçici araç dizini Git dışlanır. Göç/çalışan süreç/operasyon emri yoktur.
- [Ajan başlangıcı](../plans/AJAN-BASLANGIC.md), kök girişler ve indeks doğru SSOT yolunu gösterir. Yeni kural satırı eklenmez; K-SADE veya evrensel sözleşme semantiği değiştirilmez.
- B0–B4 ancak kendi kaynak/komut/bağımsız denetim kanıtıyla kapanır. B5, doğrulanmış aday için ayrıca insan kabulü ister; bu ADR onay/commit/tag üretmez. Çalışma ağacı kirli kalabilir; aday manifesti temiz repo iddiası değildir.

## Kabul ve reddedilen yollar

Kapanış kabulü: pozitif/negatif paket testleri, insan/makine eşliği, kaynağı belli tam kapsam eşlemesi, eski rapor alanları ve korunan bileşenlerin değişmezliği, yeni link/içerik kontrolü, güncel harita/sağlık ve bağımsız belge incelemesi. Sağlıkta 0 EKSİK; SARI'lar gerekçeli ve insan kabulü bekler. Ürün tam regresyonu veya canlı başarı uydurmak, eski raporu silmek, bütün kirli dosyaları stage etmek ve final insan onayı taklit etmek reddedilir.
