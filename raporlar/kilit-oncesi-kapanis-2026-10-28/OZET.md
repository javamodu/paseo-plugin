# Kilit öncesi kapanış — etkin belge durumu

**Emir:** “yukarıdaki kapanışları tamamla”. **Kapsam:** Belge/paket hazırlığı; ürün görevi veya canlı/harcama açılışı değil. [Karar](../../kararlar/ADR-kilit-oncesi-kapanis-2026-10-28.md) · [ana plan](../../plans/PLAN.md).

## Yapılan düzeltmeler

S0a izin metni taslak ADR çıktısıyla eşleştirildi; pilot core-yazıcısı/işçi/oracle-tester kapsamları görünümde ayrıldı. [ATOM-H1-2026-10-28.2](../../plans/uygulama-paketleri/DC-H1-2026-10-28/OZET.md) sonuç şeması v2, zorunlu kaynak/komut kayıtları ve gerçek kanıt dosyası kimliklerini denetler. Kaydın doğru olması, içeriğin gerçek görev başarısını kanıtlaması veya insan yetkisi aynı şey değildir.

Kaynak raporlara append-only erata eklendi; [boş denetim özeti](../plan-3-denetci-2026-10-27/OZET.md) tamamlandı. **150 kaynak kimliği**, [mevcut eksik defterinin tarihli DC ekine](../birlesik-eksik-defteri-2026-10-25/DC-2026-10-28.json) bağlandı. Bu 150 bağımsız açık/deney değildir; kapsam dışındaki eski bütün-repo/gelen-kutu sayımı yapılmadı. C01–C10 ürün grupları ürün kanıtı bekler; K-SADE ayrı insan kararıdır.

[Veri yerleşimi](../../plans/VERI-YERLESIMI.md) ve [ajan başlangıcı](../../plans/AJAN-BASLANGIC.md) yazıldı; root README/AGENTS ve indeks güncel yönü gösterir. Mevcut iki DB/JSONL veya çalışan süreç değiştirilmedi; WAL/SHM ve geçici araç çıktısı dışlaması daraltılmış yollarla düzeltildi. Eski arşiv/geçici dizinler körlemesine silinmedi.

## Aday, sürüm ve sahiplik sınırı

[Başlangıç manifesti](baslangic.json) HEAD yanında bu turun başındaki ilgili dosya kimliklerini ve önceden var olan kirli ağacı tutar. Daha önceki tüm değişiklikler bu ajana ait varsayılmaz. Runtime/probe/telemetri/handoff ve başkasının değişiklikleri sahiplik dışı korunur. Kilit adayının kesin dosya/hash manifesti ayrı makine kaydıdır; kendisinin hash'ini kendisinde tutan döngü kurulmaz.

**Final B5 kabulü, commit/tag/push veya temiz repo iddiası yok.** Kullanıcının kapanış emri uygulama işlerini açar; henüz görmediği nihai kanıt için insan kabul kaydı uydurulmaz. Aday içeriği değişirse önce manifest ve doğrulama yenilenir; eski kanıt ezilmez.

## Doğrulama sınırı

Bu paketin testleri sadece planlama/sonuç kayıt araçlarıdır; core/probe/tam ürün süiti/DB/sağlayıcı çalıştırılmaz. Paket komutlarının log/exit/tarihleri, bağımsız belge incelemesi ve güncel sağlık ayrı kanıt kayıtlarında bulunur. Eski 17/17 veya 18 OK sonucu yeni ölçüm diye kopyalanmaz.

Etkin B0–B4 sonuçları [birleşim kaydındaki kapanış ekinde](../rapor-birlesimi-2026-10-28/birlesim.json) izlenir; B5 sadece ayrı insan kararı sonrası. İşlerin eski NOT_STARTED başlangıcı tarihçe olarak korunur.

## Son adayın kanıt zinciri ve kalan insan kapıları

[Bağımsız inceleme](BAGIMSIZ-INCELEME.md) belge adayına şartlı devam verdi. S0a-01 metadata reçetelerinin etkin defter projeksiyonuyla tam eşliği kapanış denetiminde; günlük/başlangıç/durum/inceleme bağları [kanıt mühürleme aracında](kanit-muhur.mjs) sınanır. İncelemecinin bu takipleri tekrar test ettiği iddia edilmez.

[Etkin durum kaydı](kapanis.json), son içerik adayı ve doğrulama yanında sağlık kaydını, ayrı kanıt manifestini, sabit durum görüntüsünü ve dış hash-doğrulama makbuzunu gösterir. Zincir içerik → doğrulama → durum görüntüsü → kanıt manifesti → makbuz şeklindedir; hiçbir kayıt kendi hash'ini içermez. Kaynak veya kanıt değişirse eski makbuz geçerli yeni ölçüm sayılmaz; yeni tarihli aday gerekir. Önceki koşular ve ilk bekleyen durum görüntüsü korunur.

**B0–B3 belge teslimleri kayda alındı. B4 teknik sonucu ancak son başarılı otomatik kayda göre okunur; SARI kararları beklediği için B4 bütünüyle kabul edildi denmez. B5 hâlâ ayrı insan kabulü bekler.** Kural-proxy 80 için INSAN/K-SADE; 31 hermetik kabul kaydı için TESTER/ilgili DC kapısı sorumludur. Gerekçe ve sahip kaydı insanın final kilit kabulünün yerine geçmez. Repo temizliği veya ürün güvenliği güvencesi verilmez; otomatik stage/commit/tag/push yoktur.
