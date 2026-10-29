# Özet — Tek ana plan v2.10 / görev grafiği v13 revizyonu

**Kapsam:** Kullanıcı onaylı plan/yönetişim revizyonu. Üretim kodu, çalışma zamanı ayarı, çalışan süreç ve rapor puanı değiştirilmedi; canlı/ücretli koşum ve ürün test süiti başlatılmadı.

## Yapılanlar

- Tek aktif [`ana plan`](../../plans/PLAN.md) v2.10 §25'e taşındı: insan kanıtlı somut ürün → sabit plan otomasyonu → stratejik öneri/ölçülmüş öğrenme → yetki içi deterministik iyileştirme.
- Onay kapsamı [`ADR'de`](../../kararlar/ADR-demir-cekirdek-kademeli-buyume-2026-10-27.md) kaydedildi. Plan onayı uygulama/canlı/harcama yetkisi değildir.
- Eski plan/graf/senaryo baytları [`arşivde`](../../arsiv/plan-revizyonu-2026-10-27/README.md) korundu. Taslaklar ana plana aktarılmış tarihsel kaynak olarak işaretlendi.
- [`Graf v13`](../../plans/gorev-grafigi-2026-10-26.json) ve [`insan ikizi`](../../plans/GOREV-GRAFIGI-SENERARYO-2026-10-26.md) hizalandı: 9 eski kapalı kayıt aynen; 15 eski açık iş bağımsız seçime kapalı; 11 yeni sprint ve 5 insan kanıt kapısı.
- [`Kabul defterine`](../../plans/kabul.csv) 11 yeni sprint yalnız NOT_RUN eklendi. Eski satırlar bayt ön ekiyle korundu: yeşil sayı **81** aynı; yeni toplam **135**, oran **yüzde 60**. Payda genişlemesi kalite kaybı veya yeni başarı değildir.
- Hedef belgesinin yalnız uygulama sürüm işaretçisi, SSOT indeksi ve durum kaydı güncellendi; yetenek durumları “VAR” yapılmadı.

## Doğrulama (R)

Ölçüm: **2026-10-27T18:58:49.886Z**. Kalıcı makine kaydı: [`dogrulama.json`](dogrulama.json).

- Arşiv baytları ve başlangıç kimlikleri eşleşti.
- Değerlendirme raporu/yan kaydı ve 24 korunan çekirdek/eklenti kaynak-test dosyasının kimliği değişmedi.
- 40 düğüm / 59 kenar döngüsüz; bağımlılık–kenar eşliği ve insan kapılı kritik yol doğrulandı.
- Yeni 16 aktif planlama düğümünün tamamında seçilebilirlik ve uygulama yetkisi kapalı; gece sürücüsü H1'i bekler.
- Ana plan bütçe tablosu, taslak kaynak bütçesi ve makine grafiği eşleşti; eski bütçe ikinci kez sayılmadı.
- 54 belge bağlantısı hedef/satır aralığı kontrolünden geçti; durum kaydı 97 satırla bütçede.

## Bütçe ve sonraki kapı

**(T)** İlk H1: **3.980 teknik LOC**, rezervli **5.373**; doküman 400 ayrıca. Bütün yol: **9.980**, rezervli **13.473**; doküman 920 ayrıca. Yüzde 35 rezerv istatistiksel güven aralığı değil.

**İlk planlanan iş DC-S0'dır; başlatılmadı.** İlk paket DC/F0–F1, sonraki fazlar ayrı devam kararına tabidir. Pilot/ortam/test sahibi, sağlayıcı bütçesi, canlı hata sınaması, final kabul ve sürüm ayrı insan kapıları olarak kalır. Bu belge ürün teslimi veya yeni test süiti geçişi iddiası içermez.
