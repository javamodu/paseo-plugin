# ADR — DC-H1 uygulama paketlerinin atomikleştirilmesi

**Tarih:** 28 Ekim 2026. **Durum:** Kullanıcının “uygulama paketini bu şekilde atomikleştir” emriyle paket yazımı; ürün/keşif/OS sınaması/harcama veya final kabul emri değildir.

## Karar

- [Tek ana planın §27 eki](../plans/PLAN.md) altında **ATOM-H1-2026-10-28.1** görev projeksiyonu oluşturulur. Ürün planı v2.10.1, graf v14 ve kabul kimlikleri/durumları değişmez.
- [Paket](../plans/uygulama-paketleri/DC-H1-2026-10-28/OZET.md): 4 S0a, 3 S0b, 5 S1, 6 S3, 4 S2, 4 S4 = 26 atomik fiş. Başlatılmış görev 0; gerçek ajan ataması/insan kararları boş.
- S0a brief'leri salt-okur kaynak/ortam/tehdit/kullanım/veri incelemesi ve teknik ADR-oracle önerisi için doludur; ayrıca başlatma gerekir. S0b ve 19 kod/pilot fişi **tasarım koşullu** dosya adaylarıdır. S0 ADR'si, G0/faz/bütçe ve görevde gereken ayrı test/pilot/sağlayıcı/geri dönüş izinleri olmadan yürütülmez.
- Her fişte dosya sahipliği, bağımlılık, pozitif/negatif test, komut/cwd/yan etki, LOC payı ve kanıt çıktısı vardır. Başlatmada kaynak snapshot'ı ve gerçek rol/izin bağları tamamlanır; üç mevcut dosya sınırı içinde kalınır. İhtiyaç artarsa görev bölünür.
- Güvenilmeyen pilot işçisi çekirdek entegrasyon koduna veya korunan oracle'a sahip değildir. Oracle ayrı güvenilir tester kökünde adaydan önce dondurulur; kaynak/test/insan yetkisi karıştırılmaz.
- Atomik LOC payları ve pilot kaynak/test ayrımı yeni (T) öneridir; §25.10 H1 5.880–9.450, bütün yol 12.320–19.390 aralıkları korunur. Keşif varsayımı bozulursa ayrı yeniden tahmin/onay gerekir.
- S5–S10 için kapı sonrası somut teslim/ayrıntılandırma sözleşmesi tutulur; bilinmeyen altyapıya göre kesin dosya/LOC uydurulmaz.

## Kanıt ve sınır

[Statik doğrulayıcı](../plans/uygulama-paketleri/DC-H1-2026-10-28/dogrula.mjs) ve [testleri](../plans/uygulama-paketleri/DC-H1-2026-10-28/dogrula.test.mjs) yalnız paket araçlarıdır; üretim modülü/DB/probe/sağlayıcı çalıştırmaz. İnsan fişleri makine kaydından üretilir ve eşliği sınanır. Tam ürün süiti koşulmuş sayılmaz. Değişmezlik, sağlık ve paket denetimi [rapor paketinde](../raporlar/uygulama-atomiklestirme-2026-10-28/OZET.md) kaydedilir.

## Reddedilen yollar

Paket yazımını kod çalıştırma izni saymak; test/probe'u salt-okur keşif gibi sunmak; pilot işçisine kabul oracle'ını vermek; eski nominali yeni zarfın üstüne eklemek; görev sayısını yeni kabul paydası yapmak; makine biçim kontrolünü empirik güvenlik veya insan onayı saymak reddedilir.
