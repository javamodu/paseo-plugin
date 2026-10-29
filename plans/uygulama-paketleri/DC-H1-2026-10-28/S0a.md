# S0a — Atomik görev fişleri

**Kimlik:** ATOM-H1-2026-10-28.2. **Durum:** NOT_STARTED; yürütme/harcama yetkisi yok. Bu fişler [ana planın](../../PLAN.md) projeksiyonudur; ürün grafiğine veya kabul defterine yeni PASS eklemez. [Makine kaydı](gorevler.json) · [çalıştırma disiplini](CALISTIRMA.md).

**KEŞİF BRIEF’İ TAM, BAŞLATMA YOK:** Salt-okur kaynak incelemesi ve yalnız görev rapor çifti/ADR önerisi üretilebilir. Ürün testi, probe, DB/CLI, sağlayıcı veya OS davranış deneyi bu kapsamda değildir.

## DC-S0a-01

**Kaynak ve araç tabanını salt-okur sabitle**

**Hedef:** Hangi kod/araç sürümleri üzerinden keşif yapıldığını, ilgili kirli dosya ve sahiplik belirsizlikleriyle kaydet.

**Hazırlık:** BRIEF_COMPLETE_WAITING_START. **Yazıcı:** salt-okur keşif/rapor yazarı. Gerçek ajan kimliği, tester ve salt-okur denetçi henüz atanmadı.

**Önkoşul görevleri:** yok. Önceki görevlerin kanıt çiftleri de girdidir; görevin tamamlanması insan kapısını geçirmez.

**Ayrı kapılar:** S0A_START. Bütün kararlar boş/kapalı; [kapı kapsamları](gorevler.json) ve [serbest bırakma reçetesi](CALISTIRMA.md) zorunlu.

**Okunacak kaynaklar:**
- [CODEMAP.md](../../../CODEMAP.md)
- [AGENTS.md](../../../AGENTS.md)
- [ANAYASA.md](../../../ANAYASA.md)
- [plans/PLAN.md](../../PLAN.md)
- [plans/SSOT-INDEX.md](../../SSOT-INDEX.md)
- [core/package.json](../../../core/package.json)
- [plugin/package.json](../../../plugin/package.json)
- [scripts/test-kanal.ps1](../../../scripts/test-kanal.ps1)

**Kesin mevcut dosya adayları (yalnız release sonrası yazma):**
- yok

**Yeni dosya adayları (henüz yok):**
- yok

**İzinli kanıt çıktısı:** [raporlar/dc-uygulama/DC-S0a-01/OZET.md — planlanan](gorevler.json) ve [raporlar/dc-uygulama/DC-S0a-01/sonuc.json — planlanan](gorevler.json). Mevcut kanıt varsa ezme; koordinatörden yeni deneme yolu/revizyon iste.

**Komut/test reçetesi:**
- READ_GIT: . çalışma dizininde; [tam komut](gorevler.json): git metadata okuma; uygulama/probe/DB çağırmaz.
- READ_ENV: . çalışma dizininde; [tam komut](gorevler.json): yalnız platform/mimari/Node sürümü; env/sır dökümü yok.

**Görev sonucu biçim kontrolü:** [doğrulayıcı](dogrula.mjs), [CALISTIRMA](CALISTIRMA.md) içindeki --result reçetesiyle DC-S0a-01 ve izinli sonuç yolu için çalıştırılır. Bu yalnız kayıt denetimi; empirik doğrulama veya insan onayı değildir.

**Pozitif kabul kanıtı:**
- P1: Her okunan dosyanın hash/byte kimliği, HEAD ve ölçülmüş saat aynı sonuçta bulunur
- P2: Araç sürüm kaynağı komut çıktısıyla bağlanır

**Negatif kabul kanıtı / sınır:**
- N1: Kimliği alınamayan/inceleme sırasında değişen kaynak doğrulandı sayılmaz
- N2: Sahibi belirsiz kirli dosyaya yazılmaz; eksik önkoşul BLOCKED olarak kaydedilir

**Somut teslim:** Kapsamlı kaynak manifesti; platform/Node sürümü; kirli dosya sahipliği; probe/pretest dış etki uyarısı.

**LOC payı (T; onaysız):** Ordu kaynak 0; Ordu test 0; ayrı pilot kaynak 0; ayrı pilot test 0. Kaynak/test bir kez sayılır; kanıt/doküman ayrıca, ölçülmüş LOC değil.

**Yürütme bütçesi önerisi (T; ayrı onay ister):** en fazla 8 tur / 60 dakika / 60000 token. Tavan yaklaşınca dur ve devir/kart; bütçe sağlayıcı harcama izni değildir.

**Tam regresyon:** S0a’da uygulanmaz; ürün kapanışı iddiası yok.

**Yapılmayacaklar:** [ortak yasaklar ve görev kilitleri](CALISTIRMA.md) aynen geçerli. Ek dosya/göç veya kapsam ihtiyacı çıkarsa bu fişi genişletmeden dur; önce paket revizyonu. Tamamlanan rapor, görevi/sprinti veya insan kapısını kendi başına PASS yapmaz.

## DC-S0a-02

**Windows işçi ve test sınırı fizibilitesini çıkar**

**Hedef:** İşçi/test/operatör/imzalayıcı ayrımının seçili mevcut Windows mekanizmasıyla kurulup kurulamayacağını öner; kuruldu iddiası üretme.

**Hazırlık:** BRIEF_COMPLETE_WAITING_START. **Yazıcı:** salt-okur keşif/rapor yazarı. Gerçek ajan kimliği, tester ve salt-okur denetçi henüz atanmadı.

**Önkoşul görevleri:** [DC-S0a-01](S0a.md#dc-s0a-01). Önceki görevlerin kanıt çiftleri de girdidir; görevin tamamlanması insan kapısını geçirmez.

**Ayrı kapılar:** S0A_START. Bütün kararlar boş/kapalı; [kapı kapsamları](gorevler.json) ve [serbest bırakma reçetesi](CALISTIRMA.md) zorunlu.

**Okunacak kaynaklar:**
- [plans/PLAN.md](../../PLAN.md)
- [core/src/local-runtime.ts](../../../core/src/local-runtime.ts)
- [core/src/capabilities.ts](../../../core/src/capabilities.ts)
- [core/src/probe.mjs](../../../core/src/probe.mjs)
- [core/src/evaluator.ts](../../../core/src/evaluator.ts)
- [core/src/receipt-link.ts](../../../core/src/receipt-link.ts)
- [plugin/index.server.ts](../../../plugin/index.server.ts)
- [plugin/server/ordu.ts](../../../plugin/server/ordu.ts)

**Kesin mevcut dosya adayları (yalnız release sonrası yazma):**
- yok

**Yeni dosya adayları (henüz yok):**
- yok

**İzinli kanıt çıktısı:** [raporlar/dc-uygulama/DC-S0a-02/OZET.md — planlanan](gorevler.json) ve [raporlar/dc-uygulama/DC-S0a-02/sonuc.json — planlanan](gorevler.json). Mevcut kanıt varsa ezme; koordinatörden yeni deneme yolu/revizyon iste.

**Komut/test reçetesi:**
- Kaynak dosyaları okuma aracıyla oku; yürütülecek ürün testi veya probe yok.

**Görev sonucu biçim kontrolü:** [doğrulayıcı](dogrula.mjs), [CALISTIRMA](CALISTIRMA.md) içindeki --result reçetesiyle DC-S0a-02 ve izinli sonuç yolu için çalıştırılır. Bu yalnız kayıt denetimi; empirik doğrulama veya insan onayı değildir.

**Pozitif kabul kanıtı:**
- P1: Çekirdek DB, onay kanalı, korunan suite/anahtar, kullanıcı evi ve ortak Git alanı için işçi/test/operatör erişimleri ayrı yazılır
- P2: Mevcut kaynak kanıtı ile OS davranış deneyi gerektiren iddia ayrılır

**Negatif kabul kanıtı / sınır:**
- N1: Worktree veya statik capability sandbox kanıtı sayılmaz
- N2: Kullanıcı evi/config/sır/env değerleri okunmaz; sınır deneyi veya süreç öldürme yapılmaz

**Somut teslim:** Korunan alan/aktör/erişim matrisi, mevcut mekanizma adayı, eksikler ve S0b'nin zararsız sınama kapsam önerisi.

**LOC payı (T; onaysız):** Ordu kaynak 0; Ordu test 0; ayrı pilot kaynak 0; ayrı pilot test 0. Kaynak/test bir kez sayılır; kanıt/doküman ayrıca, ölçülmüş LOC değil.

**Yürütme bütçesi önerisi (T; ayrı onay ister):** en fazla 8 tur / 60 dakika / 60000 token. Tavan yaklaşınca dur ve devir/kart; bütçe sağlayıcı harcama izni değildir.

**Tam regresyon:** S0a’da uygulanmaz; ürün kapanışı iddiası yok.

**Release öncesi cevaplanacak tasarım bağı:**
- Hazır seçili OS sınırı yoksa ayrı altyapı kararı; S0b'yi hayalen geçirme.

**Yapılmayacaklar:** [ortak yasaklar ve görev kilitleri](CALISTIRMA.md) aynen geçerli. Ek dosya/göç veya kapsam ihtiyacı çıkarsa bu fişi genişletmeden dur; önce paket revizyonu. Tamamlanan rapor, görevi/sprinti veya insan kapısını kendi başına PASS yapmaz.

## DC-S0a-03

**Kullanım, süreç ve kalıcı bağ yerleşimini tasarla**

**Hedef:** Gerçek kullanım kaynağı veya bağımsız uygulanabilir limit ile sözleşme/süreç/kanıt bağlarının tek otoritede kalacağı veri kararını öner.

**Hazırlık:** BRIEF_COMPLETE_WAITING_START. **Yazıcı:** salt-okur keşif/rapor yazarı. Gerçek ajan kimliği, tester ve salt-okur denetçi henüz atanmadı.

**Önkoşul görevleri:** [DC-S0a-02](S0a.md#dc-s0a-02). Önceki görevlerin kanıt çiftleri de girdidir; görevin tamamlanması insan kapısını geçirmez.

**Ayrı kapılar:** S0A_START. Bütün kararlar boş/kapalı; [kapı kapsamları](gorevler.json) ve [serbest bırakma reçetesi](CALISTIRMA.md) zorunlu.

**Okunacak kaynaklar:**
- [plans/PLAN.md](../../PLAN.md)
- [core/src/store.ts](../../../core/src/store.ts)
- [core/src/supervisor.ts](../../../core/src/supervisor.ts)
- [core/src/local-runtime.ts](../../../core/src/local-runtime.ts)
- [core/src/dispatcher.ts](../../../core/src/dispatcher.ts)
- [core/src/gozetimsiz.ts](../../../core/src/gozetimsiz.ts)
- [core/src/grants.ts](../../../core/src/grants.ts)
- [core/database/001-initial.sql](../../../core/database/001-initial.sql)
- [core/database/002-hardening.sql](../../../core/database/002-hardening.sql)
- [core/database/003-role-model.sql](../../../core/database/003-role-model.sql)
- [core/database/004-grants.sql](../../../core/database/004-grants.sql)

**Kesin mevcut dosya adayları (yalnız release sonrası yazma):**
- yok

**Yeni dosya adayları (henüz yok):**
- yok

**İzinli kanıt çıktısı:** [raporlar/dc-uygulama/DC-S0a-03/OZET.md — planlanan](gorevler.json) ve [raporlar/dc-uygulama/DC-S0a-03/sonuc.json — planlanan](gorevler.json). Mevcut kanıt varsa ezme; koordinatörden yeni deneme yolu/revizyon iste.

**Komut/test reçetesi:**
- Kaynak dosyaları okuma aracıyla oku; yürütülecek ürün testi veya probe yok.

**Görev sonucu biçim kontrolü:** [doğrulayıcı](dogrula.mjs), [CALISTIRMA](CALISTIRMA.md) içindeki --result reçetesiyle DC-S0a-03 ve izinli sonuç yolu için çalıştırılır. Bu yalnız kayıt denetimi; empirik doğrulama veya insan onayı değildir.

**Pozitif kabul kanıtı:**
- P1: Gerçek tüketim, bağımsız limit ve bilinmeyen tüketim ayrı tanımlanır
- P2: Eski kayıt/hash/olay anlamını koruyan uyumluluk yolu ve tek defter kararı önerilir

**Negatif kabul kanıtı / sınır:**
- N1: Rezervasyon tüketim, süre dolması ölüm teyidi veya bilinmeyen kullanım sıfır sayılmaz
- N2: openStore/CLI status veya üretim DB açılmaz; sağlayıcı ölçümü yapılmış gibi yazılmaz

**Somut teslim:** Sözleşme/süreç/iptal/kullanım bağları ve göç/artefakt seçenekleri; kullanım kaynağı/limit fizibilitesi; belirsizlik ve maliyet listesi.

**LOC payı (T; onaysız):** Ordu kaynak 0; Ordu test 0; ayrı pilot kaynak 0; ayrı pilot test 0. Kaynak/test bir kez sayılır; kanıt/doküman ayrıca, ölçülmüş LOC değil.

**Yürütme bütçesi önerisi (T; ayrı onay ister):** en fazla 8 tur / 60 dakika / 60000 token. Tavan yaklaşınca dur ve devir/kart; bütçe sağlayıcı harcama izni değildir.

**Tam regresyon:** S0a’da uygulanmaz; ürün kapanışı iddiası yok.

**Release öncesi cevaplanacak tasarım bağı:**
- Kalıcı bağlar onaylı core göçünde mi zorunlu doğrulanan artefaktta mı?
- Gerçek kullanım kaynağı/uygulanabilir limit yoksa yeniden tahmin.

**Yapılmayacaklar:** [ortak yasaklar ve görev kilitleri](CALISTIRMA.md) aynen geçerli. Ek dosya/göç veya kapsam ihtiyacı çıkarsa bu fişi genişletmeden dur; önce paket revizyonu. Tamamlanan rapor, görevi/sprinti veya insan kapısını kendi başına PASS yapmaz.

## DC-S0a-04

**Teknik ADR, pilot oracle ve görev serbest bırakma paketini öner**

**Hedef:** İlk üç keşfi tek teknik ADR önerisine, dondurulacak pilot oracle'ına ve görev write-set/izin bağlarına dönüştür; onay verme.

**Hazırlık:** BRIEF_COMPLETE_WAITING_START. **Yazıcı:** salt-okur keşif/rapor yazarı. Gerçek ajan kimliği, tester ve salt-okur denetçi henüz atanmadı.

**Önkoşul görevleri:** [DC-S0a-03](S0a.md#dc-s0a-03). Önceki görevlerin kanıt çiftleri de girdidir; görevin tamamlanması insan kapısını geçirmez.

**Ayrı kapılar:** S0A_START. Bütün kararlar boş/kapalı; [kapı kapsamları](gorevler.json) ve [serbest bırakma reçetesi](CALISTIRMA.md) zorunlu.

**Okunacak kaynaklar:**
- [plans/PLAN.md](../../PLAN.md)
- [plans/uygulama-paketleri/DC-H1-2026-10-28/gorevler.json](gorevler.json)
- [core/src/cli.ts](../../../core/src/cli.ts)
- [core/src/cli-evaluate.ts](../../../core/src/cli-evaluate.ts)
- [core/src/evaluator.ts](../../../core/src/evaluator.ts)
- [core/src/receipt-link.ts](../../../core/src/receipt-link.ts)

**Kesin mevcut dosya adayları (yalnız release sonrası yazma):**
- yok

**Yeni dosya adayları (henüz yok):**
- [kararlar/ADR-dc-s0-teknik-oneri-2026-10-28.md — planlanan](gorevler.json)

**İzinli kanıt çıktısı:** [raporlar/dc-uygulama/DC-S0a-04/OZET.md — planlanan](gorevler.json) ve [raporlar/dc-uygulama/DC-S0a-04/sonuc.json — planlanan](gorevler.json). Mevcut kanıt varsa ezme; koordinatörden yeni deneme yolu/revizyon iste.

**Komut/test reçetesi:**
- Kaynak dosyaları okuma aracıyla oku; yürütülecek ürün testi veya probe yok.

**Görev sonucu biçim kontrolü:** [doğrulayıcı](dogrula.mjs), [CALISTIRMA](CALISTIRMA.md) içindeki --result reçetesiyle DC-S0a-04 ve izinli sonuç yolu için çalıştırılır. Bu yalnız kayıt denetimi; empirik doğrulama veya insan onayı değildir.

**Pozitif kabul kanıtı:**
- P1: Her sonraki görevin tasarım sorusu cevap veya gerekçeli BLOCKED ile bağlanır
- P2: Pilot A Unicode/kalıcılık, B idempotent toplam/filtre, C eski veri regresyonu adaydan önce tanımlanır

**Negatif kabul kanıtı / sınır:**
- N1: İmza, sınama, G0, bütçe veya faz başlangıcı ajanca onaylanmaz
- N2: Adaya göre oracle/eşik değiştirilmez; yeni command/event veya ikinci otoriter DB önerisi onaysız uygulanmaz

**Somut teslim:** TASLAK teknik ADR; A/B/C oracle ve on hata ailesi beklenen etkileri; seçili arayüz/write-set teyit önerisi; ayrı sınama/kod/bütçe kapıları.

**LOC payı (T; onaysız):** Ordu kaynak 0; Ordu test 0; ayrı pilot kaynak 0; ayrı pilot test 0. Kaynak/test bir kez sayılır; kanıt/doküman ayrıca, ölçülmüş LOC değil.

**Yürütme bütçesi önerisi (T; ayrı onay ister):** en fazla 8 tur / 60 dakika / 60000 token. Tavan yaklaşınca dur ve devir/kart; bütçe sağlayıcı harcama izni değildir.

**Tam regresyon:** S0a’da uygulanmaz; ürün kapanışı iddiası yok.

**Yapılmayacaklar:** [ortak yasaklar ve görev kilitleri](CALISTIRMA.md) aynen geçerli. Ek dosya/göç veya kapsam ihtiyacı çıkarsa bu fişi genişletmeden dur; önce paket revizyonu. Tamamlanan rapor, görevi/sprinti veya insan kapısını kendi başına PASS yapmaz.

