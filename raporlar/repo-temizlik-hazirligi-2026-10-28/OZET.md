# Kontrollü repo temizliği — hazırlık teslimi

**Emir:** “bu şekilde uygula”. Son yönetici önerisindeki yalnız kontrollü hazırlık açıldı; stage/commit/tag/push/silme/üretim taşıma veya B4/B5 insan kararı açılmadı.

Başlangıç (R): 177 yol = 20 değişmiş takipli + 157 takip edilmeyen; stage 0. [Başlangıç](baslangic.json).

## Sahiplik ve commit grupları

- **G01: 147 yol.** DC plan + rapor + atomik paket + kapanış; ortak dosyalar parçalanmaz.
- **G02: 24 yol.** Önceki plan/gelen-kutu/operasyon kaynakları; özgün sahip teyidi bekler.
- **G03: 6 yol.** Altı sahiplik dışı mevcut değişiklik; otomatik commit kapsamına alınmaz.

[Kesin başlangıç dosya listesi](DOSYA-LISTESI.md) / [makine envanteri](envanter.json): her yolda kimlik, kaynak, sorumlu, koruma ve izin durumu vardır. Sorumlu rol, doğrulanmış özgün yazar kimliği değildir; bilinmeyen sahiplik sahte isimle kapatılmaz.

## Kontroller ve yeni engeller

[Hedefli tarama](hedefli-tarama.json): yüksek güvenli kimlik bilgisi eşleşmesi 0; diğer sır incelemesi 0; gizlilik konumu 2. Eşleşen değerler/alıntılar yazılmadı; bütün geçmiş/ignored/binary/sır yokluğu garantisi değil.

[Satır sonu/hash ölçümü](satir-sonu-hash.json): 55 dosyada Git temizleme dönüşümü baytı değiştirir; 8 dosya başlangıçta karışık satır sonludur. Dosya veya indeks dönüştürülmedi. Çalışma ağacı hash'i ile Git blob hash'i eşit olmak zorunda değildir; temiz checkoutta eski raw-bayt manifestinin geçeceği iddia edilmez.

İlk son-kontrol koşusu, başlangıçtan beri boş olan tek tarihsel ham kaydı yeni kanıt doluluk koşuluyla karıştırdığı için durdu; [başarısız koşu kaydı](dogrulama-hatasi-20261028152008022.json) korunur. Kaynak doldurulmadı/silinmedi. Yalnız başlangıçta zaten boş olan aynı path/hash/byte kimliği envanterde korunur; yeni rapor ve kanıtın dolu olması şartı değişmedi. Bu ayrım üç negatif/pozitif teste eklendi.

[İkinci başarısız kontrol](dogrulama-hatasi-baglanti.json), aynı tarihsel boş kaydın envanter bağlantısındaki doluluk ayrımıdır. Yalnız kesin dosya listesi için başlangıç kimliği aynı olan boş tarihsel kaynak bağlantısına izin verilir; etkin özet/kanıt bağlantıları için doluluk şartı korunur. Erken üretilmiş geçici sonuç final kanıt değildir; yeni sonuçtan önce bütün diğer bağlantılar doğrulanır.

[Kanca/runtime/bağımlılık incelemesi](kanca-runtime-bagimlilik.json): kanca harici Qoder CLI çağırır, hata çıktısını bastırır ve başarısızlığı maskeler; çalıştırılmadı. Harici kod/ağ/telemetri davranışı doğrulanmadı. 18 takipli veri/artefakt/destek yolu yalnız metadata ile envanterlendi; DB/JSONL/artefakt içerikleri açılmadı veya taşınmadı.

**Temiz çalışma kopyası kapısı açık:** Mevcut kanıt doğrulayıcılarının 30 başlangıç dosyası G02/G03 gruplarına da bağlı. G01 kaynaklarını tek başına commit etmek, eksiksiz bağımsız checkout veya 0 sahipsiz dosya garantisi değildir. Sahip teyitleri ve taşınabilir kanıt/bayt politikası ayrı karara sunulur.

## Kanıt tazeleme ve sınır

Hazırlık yeni dosyalar eklediğinden otomatik CODEMAP değişir; önceki kapanış makbuzu geçmiş kayıt olarak korunur. Güncel belge adayı aynı mevcut mühürleme reçetesiyle yenilenir; yeni makbuz [etkin kapanış kaydından](../kilit-oncesi-kapanis-2026-10-28/kapanis.json) okunur. Bu hazırlığın kendi son kanıtı ayrıca üretilir; kayıtlar kendilerinin hashini içermez.

[Commit öncesi kontrol listesi](COMMIT-KONTROL.md). Son test/bağlantı/değişmezlik kanıtı ve güncel dosya/hash manifesti [sonuç kaydından](sonuc.json) okunur. **Bu teslim hazırlık tamamdır; repo temiz, commit serbest veya B5 kabul edildi sonucu değildir.**
