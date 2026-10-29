# S0b — Atomik görev fişleri

**Kimlik:** ATOM-H1-2026-10-28.2. **Durum:** NOT_STARTED; yürütme/harcama yetkisi yok. Bu fişler [ana planın](../../PLAN.md) projeksiyonudur; ürün grafiğine veya kabul defterine yeni PASS eklemez. [Makine kaydı](gorevler.json) · [çalıştırma disiplini](CALISTIRMA.md).

**TASARIM KOŞULLU:** Aşağıdaki dosya ve arayüzler uygulama adayıdır. S0 teknik ADR’si, gerekli izinler, kaynak snapshot’ı, pilot/OS bağları ve write-set teyidi olmadan hiçbir görev başlatılamaz. Önerilen yeni dosyalar bu paket yazılırken oluşturulmadı.

## DC-S0b-01

**Onaylı OS sınırı için zararsız fixture ve pozitif kontrol**

**Hedef:** Seçili hazır mekanizmayı sadece onaylı test alanında çağıran fixture'ı ve izinli yazma kontrolünü kur.

**Hazırlık:** CONDITIONAL_DESIGN. **Yazıcı:** tek CODER; ayrı tester ve salt-okur denetçi. Gerçek ajan kimliği, tester ve salt-okur denetçi henüz atanmadı.

**Önkoşul görevleri:** [DC-S0a-04](S0a.md#dc-s0a-04). Önceki görevlerin kanıt çiftleri de girdidir; görevin tamamlanması insan kapısını geçirmez.

**Ayrı kapılar:** TECHNICAL_ADR, S0B_SCOPE, IMPLEMENTATION_BUDGET, LOCAL_TEST_SCOPE. Bütün kararlar boş/kapalı; [kapı kapsamları](gorevler.json) ve [serbest bırakma reçetesi](CALISTIRMA.md) zorunlu.

**Okunacak kaynaklar:**
- [core/src/local-runtime.ts](../../../core/src/local-runtime.ts)
- [core/src/probe.mjs](../../../core/src/probe.mjs)
- [core/test/local-runtime.test.ts](../../../core/test/local-runtime.test.ts)

**Kesin mevcut dosya adayları (yalnız release sonrası yazma):**
- [core/package.json](../../../core/package.json)

**Yeni dosya adayları (henüz yok):**
- [core/test/fixtures/dc-boundary-fixture.mjs — planlanan](gorevler.json)
- [core/test/dc-boundary-positive.test.ts — planlanan](gorevler.json)

**İzinli kanıt çıktısı:** [raporlar/dc-uygulama/DC-S0b-01/OZET.md — planlanan](gorevler.json) ve [raporlar/dc-uygulama/DC-S0b-01/sonuc.json — planlanan](gorevler.json). Mevcut kanıt varsa ezme; koordinatörden yeni deneme yolu/revizyon iste.

**Komut/test reçetesi:**
- core çalışma dizininde [hedefli test komutu](gorevler.json): onaylı zararsız OS fixture; yalnız temp alan. Yeni test bu görevde üretilir; bugün varmış/çalışmış gibi sayılmaz.

**Görev sonucu biçim kontrolü:** [doğrulayıcı](dogrula.mjs), [CALISTIRMA](CALISTIRMA.md) içindeki --result reçetesiyle DC-S0b-01 ve izinli sonuç yolu için çalıştırılır. Bu yalnız kayıt denetimi; empirik doğrulama veya insan onayı değildir.

**Pozitif kabul kanıtı:**
- P1: Fixture seçili sınırda çalışır ve izinli pilot-test alanına yazabilir

**Negatif kabul kanıtı / sınır:**
- N1: Mekanizma yoksa/kurulamıyorsa test atlanarak PASS verilmez; BLOCKED
- N2: Üretim yetkisi, ev dizini, ağ veya sırlar fixture'a miras verilmez

**Somut teslim:** Seçili mekanizma kimliğini kaydeden fixture; izinli alanda yazma/okuma pozitif kanıtı.

**LOC payı (T; onaysız):** Ordu kaynak 100–200; Ordu test 100–200; ayrı pilot kaynak 0; ayrı pilot test 0. Kaynak/test bir kez sayılır; kanıt/doküman ayrıca, ölçülmüş LOC değil.

**Yürütme bütçesi önerisi (T; ayrı onay ister):** en fazla 8 tur / 60 dakika / 60000 token. Tavan yaklaşınca dur ve devir/kart; bütçe sağlayıcı harcama izni değildir.

**Tam regresyon:** CORE_FULL; ayrı tester ve onaylı ortam; hedefli test yerine geçmez.

**Release öncesi cevaplanacak tasarım bağı:**
- Onaylı OS sınırını başlatan kesin komut/hesap/izin kapsamı release öncesi bağlanmalı.

**Yapılmayacaklar:** [ortak yasaklar ve görev kilitleri](CALISTIRMA.md) aynen geçerli. Ek dosya/göç veya kapsam ihtiyacı çıkarsa bu fişi genişletmeden dur; önce paket revizyonu. Tamamlanan rapor, görevi/sprinti veya insan kapısını kendi başına PASS yapmaz.

## DC-S0b-02

**Korunan alan ve kaçış negatiflerini kanıtla**

**Hedef:** Aynı fixture'da worker ve güvenilmeyen aday-test sürecinin korunan alana erişemediğini göster.

**Hazırlık:** CONDITIONAL_DESIGN. **Yazıcı:** tek CODER; ayrı tester ve salt-okur denetçi. Gerçek ajan kimliği, tester ve salt-okur denetçi henüz atanmadı.

**Önkoşul görevleri:** [DC-S0b-01](S0b.md#dc-s0b-01). Önceki görevlerin kanıt çiftleri de girdidir; görevin tamamlanması insan kapısını geçirmez.

**Ayrı kapılar:** TECHNICAL_ADR, S0B_SCOPE, IMPLEMENTATION_BUDGET, LOCAL_TEST_SCOPE. Bütün kararlar boş/kapalı; [kapı kapsamları](gorevler.json) ve [serbest bırakma reçetesi](CALISTIRMA.md) zorunlu.

**Okunacak kaynaklar:**
- [core/src/evaluator.ts](../../../core/src/evaluator.ts)
- [core/src/receipt-link.ts](../../../core/src/receipt-link.ts)
- [core/test/k13-gozetimsiz-canli.test.ts](../../../core/test/k13-gozetimsiz-canli.test.ts)

**Kesin mevcut dosya adayları (yalnız release sonrası yazma):**
- [core/package.json](../../../core/package.json)

**Yeni dosya adayları (henüz yok):**
- [core/test/fixtures/dc-boundary-protected.mjs — planlanan](gorevler.json)
- [core/test/dc-boundary-negative.test.ts — planlanan](gorevler.json)

**İzinli kanıt çıktısı:** [raporlar/dc-uygulama/DC-S0b-02/OZET.md — planlanan](gorevler.json) ve [raporlar/dc-uygulama/DC-S0b-02/sonuc.json — planlanan](gorevler.json). Mevcut kanıt varsa ezme; koordinatörden yeni deneme yolu/revizyon iste.

**Komut/test reçetesi:**
- core çalışma dizininde [hedefli test komutu](gorevler.json): temp korunan alan taklitleri; ayrı izinli OS sınaması. Yeni test bu görevde üretilir; bugün varmış/çalışmış gibi sayılmaz.

**Görev sonucu biçim kontrolü:** [doğrulayıcı](dogrula.mjs), [CALISTIRMA](CALISTIRMA.md) içindeki --result reçetesiyle DC-S0b-02 ve izinli sonuç yolu için çalıştırılır. Bu yalnız kayıt denetimi; empirik doğrulama veya insan onayı değildir.

**Pozitif kabul kanıtı:**
- P1: Pozitif kontrol aynı koşumda çalışır; korunan taklit dosyaların değişmediği hash ile gösterilir

**Negatif kabul kanıtı / sınır:**
- N1: Bütün tanımlı yasak erişimler ve testten operatör/imzalayıcı yetki mirası reddedilir
- N2: Yalnız string/path kontrolü gerçek OS reddi diye sunulmaz

**Somut teslim:** DB/onay/suite/anahtar ve üst-dizin/junction/alt-süreç/env/ağ kaçış girişimlerinin beklenen/gerçek sonuç matrisi.

**LOC payı (T; onaysız):** Ordu kaynak 100–200; Ordu test 125–225; ayrı pilot kaynak 0; ayrı pilot test 0. Kaynak/test bir kez sayılır; kanıt/doküman ayrıca, ölçülmüş LOC değil.

**Yürütme bütçesi önerisi (T; ayrı onay ister):** en fazla 8 tur / 60 dakika / 60000 token. Tavan yaklaşınca dur ve devir/kart; bütçe sağlayıcı harcama izni değildir.

**Tam regresyon:** CORE_FULL; ayrı tester ve onaylı ortam; hedefli test yerine geçmez.

**Release öncesi cevaplanacak tasarım bağı:**
- Gerçek kullanıcı evi/sır yerine güvenli taklit kökler ve korunma mekanizmasının eşdeğerliği ADR'de belirlenmeli.

**Yapılmayacaklar:** [ortak yasaklar ve görev kilitleri](CALISTIRMA.md) aynen geçerli. Ek dosya/göç veya kapsam ihtiyacı çıkarsa bu fişi genişletmeden dur; önce paket revizyonu. Tamamlanan rapor, görevi/sprinti veya insan kapısını kendi başına PASS yapmaz.

## DC-S0b-03

**Bağımsız tüketim sınırı ve G0 kanıt paketi**

**Hedef:** Seçilen ölçüm/limit kaynağını sağlayıcısız fixture'da sına; fizibilite ve ayrı G0 kabulüne hazır kanıt üret.

**Hazırlık:** CONDITIONAL_DESIGN. **Yazıcı:** tek CODER; ayrı tester ve salt-okur denetçi. Gerçek ajan kimliği, tester ve salt-okur denetçi henüz atanmadı.

**Önkoşul görevleri:** [DC-S0b-02](S0b.md#dc-s0b-02). Önceki görevlerin kanıt çiftleri de girdidir; görevin tamamlanması insan kapısını geçirmez.

**Ayrı kapılar:** TECHNICAL_ADR, S0B_SCOPE, IMPLEMENTATION_BUDGET, LOCAL_TEST_SCOPE. Bütün kararlar boş/kapalı; [kapı kapsamları](gorevler.json) ve [serbest bırakma reçetesi](CALISTIRMA.md) zorunlu.

**Okunacak kaynaklar:**
- [core/src/store.ts](../../../core/src/store.ts)
- [core/src/capabilities.ts](../../../core/src/capabilities.ts)
- [core/src/gozetimsiz.ts](../../../core/src/gozetimsiz.ts)

**Kesin mevcut dosya adayları (yalnız release sonrası yazma):**
- [core/package.json](../../../core/package.json)

**Yeni dosya adayları (henüz yok):**
- [core/test/fixtures/dc-usage-bound-fixture.mjs — planlanan](gorevler.json)
- [core/test/dc-usage-bound.test.ts — planlanan](gorevler.json)

**İzinli kanıt çıktısı:** [raporlar/dc-uygulama/DC-S0b-03/OZET.md — planlanan](gorevler.json) ve [raporlar/dc-uygulama/DC-S0b-03/sonuc.json — planlanan](gorevler.json). Mevcut kanıt varsa ezme; koordinatörden yeni deneme yolu/revizyon iste.

**Komut/test reçetesi:**
- core çalışma dizininde [hedefli test komutu](gorevler.json): bağımsız üst sınır/ölçüm fixture'ı; sağlayıcı çağrısı yok. Yeni test bu görevde üretilir; bugün varmış/çalışmış gibi sayılmaz.

**Görev sonucu biçim kontrolü:** [doğrulayıcı](dogrula.mjs), [CALISTIRMA](CALISTIRMA.md) içindeki --result reçetesiyle DC-S0b-03 ve izinli sonuç yolu için çalıştırılır. Bu yalnız kayıt denetimi; empirik doğrulama veya insan onayı değildir.

**Pozitif kabul kanıtı:**
- P1: Bağımsız limit aşımı yeni etkiyi durdurur veya seçili gerçek ölçüm kaynağı fixture'da doğrulanır

**Negatif kabul kanıtı / sınır:**
- N1: Eksik kullanım sıfır ve tahmini rezerv ölçülmüş tüketim sayılmaz
- N2: Hazır kaynak/limit yoksa G0 açık ilan edilmez; ayrı altyapı/yeniden tahmin gerekir

**Somut teslim:** Kullanım kaynağı/limit fizibilitesi ve S0b sınır kanıtları; G0 insan kararına sunulacak bağlar.

**LOC payı (T; onaysız):** Ordu kaynak 100–200; Ordu test 125–225; ayrı pilot kaynak 0; ayrı pilot test 0. Kaynak/test bir kez sayılır; kanıt/doküman ayrıca, ölçülmüş LOC değil.

**Yürütme bütçesi önerisi (T; ayrı onay ister):** en fazla 8 tur / 60 dakika / 60000 token. Tavan yaklaşınca dur ve devir/kart; bütçe sağlayıcı harcama izni değildir.

**Tam regresyon:** CORE_FULL; ayrı tester ve onaylı ortam; hedefli test yerine geçmez.

**Release öncesi cevaplanacak tasarım bağı:**
- Üst sınırın bağımsız uygulayıcısı veya ölçüm kaynağı kesinleşmeli; yeni kota aracısı bu pakete gizlenemez.

**Yapılmayacaklar:** [ortak yasaklar ve görev kilitleri](CALISTIRMA.md) aynen geçerli. Ek dosya/göç veya kapsam ihtiyacı çıkarsa bu fişi genişletmeden dur; önce paket revizyonu. Tamamlanan rapor, görevi/sprinti veya insan kapısını kendi başına PASS yapmaz.

