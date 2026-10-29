# Özet — DC-H1 atomik ajan paketleri

**Kapsam:** Kullanıcının “uygulama paketini bu şekilde atomikleştir” emri; yalnız paket ve plan projeksiyonu yazımı. **Ürün/keşif/sınama/sağlayıcı görevi başlatılmadı; kabul/bütçe/puan veya insan yetkisi değişmedi.**

## Teslim

- [Ana plan §27](../../plans/PLAN.md) ve [ADR](../../kararlar/ADR-dc-h1-atomik-paketler-2026-10-28.md).
- [İnsan paketi](../../plans/uygulama-paketleri/DC-H1-2026-10-28/OZET.md) ve [makine fişleri](../../plans/uygulama-paketleri/DC-H1-2026-10-28/gorevler.json).
- 4 S0a keşif, 3 S0b sınama, 5 S1, 6 S3, 4 S2, 4 S4 = **26 atomik görev**. Bütün görevler NOT_STARTED; yürütmeye açılmış görev 0.
- Her fişte hedef, bağımlılık/insan kapısı, kaynak/dosya yazma adayları, pozitif/negatif kabul, test komutu/yan etkisi, LOC ve yürütme bütçesi önerisi, kanıt çifti var. Kritik yol tek yazıcı; en fazla üç mevcut dosya.
- S0a için brief tam ama ayrı başlatma emri yok. Diğer 22 görev S0 tasarımı ve ilgili izinler beklenirken **koşullu fiş**tir; şimdiden tam yürütülebilir diye sunulmaz.
- Korunan oracle, pilot işçisi ve çekirdek entegrasyon yazıcısının kapsamları ayrı. S5–S10, önceki fazın gerçek kanıtı sonrasında ayrıntılandırılır.

## LOC dürüstlüğü

Görev payları (T) yeni, geçici ayrıştırmadır; ölçülmüş iş veya onaylı tavan değil. S0a dokümanı teknik LOC dışında. H1 kaynak 2.230–3.700 + test 3.050–4.750 + pilot 600–1.000 = **5.880–9.450**; bütün yol **12.320–19.390** (T) korunur. Pilot kaynak/test payı 300–500 / 300–500 öneridir. Keşif varsayımı bozulursa yeniden tahmin gerekir.

## Doğrulama ve değişmezlik

[Başlangıç kaydı](baslangic.json) bu paket yazımından önceki HEAD/kirli ağaç ve 248 korunan bileşen dosyasının hash'lerini taşır; satır-satır okuma veya ürün testi sayısı değildir. [Paket doğrulayıcısı](../../plans/uygulama-paketleri/DC-H1-2026-10-28/dogrula.mjs), [negatif testleri](../../plans/uygulama-paketleri/DC-H1-2026-10-28/dogrula.test.mjs) ve [insan/makine eşlik denetimi](../../plans/uygulama-paketleri/DC-H1-2026-10-28/gorunum.mjs) yalnız yerel paket araçlarını sınar. Core/probe/tam ürün regresyonu veya gerçek sağlayıcı çağrısı çalıştırılmaz. Ölçülmüş son sonuç ayrı doğrulama kaydında tutulur.

Kaynak raporlara erata, RBT/B0–B5, K-SADE, S0a/S0b veya ürün sprinti uygulanmış sayılmaz. Ürün grafiği, hedef, kabul defteri ve mevcut kaynak/test/betikler korunur. Commit/tag/push veya final kilit yoktur.

## Ölçülmüş paketleme sonucu (R; ürün kabulü değil)

[İlk tam yazım doğrulaması](dogrulama-20261028103755753.json): **17/17 yerel paket testi**, **26 görev**, **492 bağlantı**, insan/makine fiş eşliği ve **1.306 doğrulama asercyonu** geçti. 248 korunan bileşen dosyası ve toplam 261 başlangıç dosyası değişmedi; eski ana plan gövdesi bayt ön ekiyle korundu. Kabul defteri **81/135**, DC NOT_RUN **11**; durum belgesi **100 satır**. Bu sayılar ürün görev başarısı/performans örneklemi değildir.

Sağlıkta ilk harita üretimi geçici Windows dosya eşleme kilidine takıldı. Üretici başarısız yazıma rağmen normal çıktı/exit 0 verdi; sonraki sağlık **17 OK / 1 EKSİK / 2 SARI** oldu. Hata saklanmadı: [harita ilk koşum günlüğü](codemap-paketleme.log), [sağlık ilk koşum günlüğü](saglik-paketleme.log). Kullanıcı sürecine müdahale edilmedi; yeniden çağrı hata durumunda duran kabukla yapıldı, harita üretimi ve sağlık **18 OK / 0 EKSİK / 2 SARI** sonucuna döndü. Son sağlık komut/çıktı kaydı ayrı makine dosyasında tutulur; ilk günlükler ezilmez.

İki SARI, mevcut **80 kural-proxy** ve **31 hermetik kabul kaydıdır**. Bunları kaldıracak K-SADE/canlı kabul işlerine bu görevde izin verilmedi; ölçüt veya kabul rengi gevşetilmedi. İlk başlatılabilir ürün işi, ayrıca kapsam emri verilirse **DC-S0a-01** keşfidir; paket fişi ve doğrulayıcı bunu kendi başına başlatmaz.
