# ADR eki — Üç denetçi sonrası DC planının sonlandırılması

**Tarih:** 28 Ekim 2026. **Durum:** Onaylı v2.10 yönü içinde denetim düzeltmeleri işlendi; **yeni bütçe/uygulama yetkisi ONAYLANMADI**. Kullanıcı görevi: “planı tüm doküman ve kodlarla çapraz … 3 subagent ile incele … son hâline getir”.

## Karar

- Tek uygulama otoritesi [`PLAN.md`](../plans/PLAN.md) v2.10.1 §25; graf v14 onun projeksiyonu. Hedef, insan kapıları ve R6 genişletilmedi. Üretim kodu değiştirilmez.
- Üç tamamlanan yerleşik salt-okur denetim V1/V2/V3 ve ana ajanın izole karakterizasyonları [`pakette`](../raporlar/plan-3-denetci-2026-10-27/OZET.md) kayıtlı. Sonuçsuz Paseo başlangıçları tamamlanmış denetim sayılmaz. Denetimler istatistiksel bağımsız performans deneyi değildir.
- S0a keşif ile S0b sağlayıcısız dar sınama izni/kanıtı ayrıldı; G0 gerçek sınır ister. S1'den sonra S3 yaşam/yazma kapanışı, ardından S2 güvenilir aday/test/makbuz zinciri gelir; kimlikler yeniden numaralanmaz.
- Tam kaynak/onay sözleşmesi, insan kimliği, süreç ağacı, usage, STOP altında güvenlik bakımı, kuyrukta yetki/deadline ve run/attempt'e bağlı zorunlu kanıt somut kabul maddelerine açıldı. Ürün hataları planda tanımlanmış olmasıyla kapanmış sayılmaz.
- Tarihsel bağımlılıklar provenans, aktif kenarlar DC yürütme ilişkisi olarak ayrılır. Eski kapanış metni ve kabul kanıtı korunur. Kapı kanıt kabulü ile sonraki faz başlatma kararı ayrı, başlangıçta boş/kapalıdır.
- Pano bütçe tip kırılması ürün koduna dokunmadan geriye uyumlu veri görünümüyle giderilir; aritmetik sayısal alanlarda kalır. Bayrak/kartlar teknik yürütme yetkisi gibi sunulmaz. Genel okuyucu güvenlik/tip düzeltmesi ileride gerçek kod/test kapısından geçer.

## Bütçe etkisi (T)

İlk nominal H1 3.980 / bütün yol 9.980 tarihçede korunur; yeterli yürütme taahhüdü değildir. Paket bazlı **yerine geçen** şartlı aralık: H1 **5.880–9.450**, bütün yol **12.320–19.390 teknik LOC**. Eski rezerv tekrar eklenmez; hazır Windows sınırı ve kullanım kaynağı yoksa ayrıca tahmin gerekir. Bu karar büyümüş bütçeyi veya harcamayı açmaz; S0 keşfi sonrası insan kararı bekler.

## Reddedilen yollar

Denetim bulgusunu ürün onarımı gibi göstermek; ilk nominali sessizce garantiye çevirmek; eski PASS'i yeniden yazmak; statik bayrakla gerçek sandbox/onay varsaymak; yardımcı testin yeşilini genel otonomi kanıtı saymak reddedilir. Üç denetim tamamlanmış plan incelemesidir, canlı ürün onayı değildir.
