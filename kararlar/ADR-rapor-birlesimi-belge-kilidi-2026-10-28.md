# ADR — Rapor birleştirme ve belge kilidi planının ana plana eklenmesi

**Tarih:** 28 Ekim 2026. **Durum:** Kullanıcının “planı bu şekilde düzenle” emriyle belge düzenlemesi kayda alındı; birleşim uygulaması/final kilit/ürün yetkisi verilmedi.

## Bağlam

Son raporlardaki ham bulguların bir bölümü örtüşüyor; tarihsel sıra, boş kapı kararları ve ayrı puan ölçekleri güncel hata gibi yorumlanabiliyor. Yeni bir özet eklemek bunları çözmüyor. Tek plan ve append-only kanıt düzeni korunarak kaynaklı uzlaştırma gerekiyor.

## Karar

- [Ana planın §26 eki](../plans/PLAN.md:588) **RBT-2026-10-28.1** kimliğiyle B0 kaynak sabitleme → B1 uzlaştırma → B2 kabul/sorumlu eşleme → B3 belge birleşimi → B4 doğrulama → B5 ayrı insan kabulüyle belge kilidi sırasını tanımlar.
- Ürün yürütme revizyonu v2.10.1 §25 ve graf v14 korunur. Bu ek ikinci aktif plan/ürün sprinti veya evrensel sözleşme sürümü değildir.
- [Birleşim paketi](../raporlar/rapor-birlesimi-2026-10-28/OZET.md) insan/makine **planlama kaydıdır**. B0..B5 başlangıç durumu NOT_STARTED; dosya yaratılması kapanış değildir. Bu düzenleme için alınan başlangıç kimliği bütün birleşimin B0'ı sayılmaz.
- Eski rapor gövdeleri ve makine değerleri korunur; ileride tarihli erata/etkin düzeltme eklenir. Açık işler [mevcut deftere](../raporlar/birlesik-eksik-defteri-2026-10-25/DEFTER.md) tarihli ekle bağlanır; ikinci görev/kabul/karar otoritesi kurulmaz.
- Ürün kaynakları, kabul durumları, hedef, bütçe, graf bağımlılık/yetkileri ve insan kapıları bu belge işiyle değişmez. K-SADE ve S0a birbirinin otomatik önkoşulu değildir; kendi kapsam izinleri korunur.
- Commit/tag/push, final kilit ve rollback ayrı insan kararlarıdır. [Kilit betiği](../scripts/kilit-surum.ps1:93) monorepo/sıra uyumu izole sınanmadan bu iş için çalıştırılmaz.

## Reddedilen yollar

Ham bulgu sayılarını bağımsız açık gibi toplamak; tarihsel metni yeni yürütme planı diye değiştirmek; boş kararları sahte onayla doldurmak; 48,75/100 ile 19/40 ve 3,9/10'u eşitlemek; kabul şemasını okuyucu testi olmadan genişletmek; K-SADE'yi gizlice uygulamak; rapor kilidini ürün/canlı/harcama onayı saymak reddedilir.

## Sonuç ve kabul

Bu tur yalnız plan düzenlemesi ve işaretçileri üretir. Kabul: B0–B5, kaynak/tekilleştirme ve pozitif/negatif kabul bağları planda; insan/makine kayıtları eş; eski plan gövdesi ve rapor/ürün kaynakları korunmuş; CODEMAP güncel ve sağlık 0 EKSİK. Yeni ürün regresyonu/canlı başarı iddiası yoktur. Final belge kilidi ancak ayrı B4 kanıtı ve B5 insan kararıyla doğar.
