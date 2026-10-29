# ANAYASA — ordu

> Bu belge bu repo için tüm dokümanların üstündedir. Çelişkide BU BELGE kazanır; evrensel sözleşme (sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md) bu belgeye tabidir.
> Ajan bu belgeyi değiştiremez; değişiklik önerisi kararlar/K-XXXX.md ile açılır, yalnız kullanıcı onaylar.

## 1. Hizalama Anahtarları (öncelik sırasıyla)

- A1. Evrensellik: rehber ve şablonlarda uygulama/proje adı geçmez; "<proje>" yer tutucu kullanılır.
- A2. Kanıt disiplini: ölçüm yoksa (T) tahmin, resmî ölçüm (R), tek-kaynak iddia * işaretli. Ölçümsüz yüzde YAZILMAZ.
- A3. Bütçe hijyeni: rehber ≤150 satır, bu belge ≤60 satır; aşan içerik işaretçiyle alt dosyaya taşınır.
- A4. Sürüm senkronu: rehber ve plan aynı sürüm numarasını taşır (şu an v2.1 — K-0043 ile senkronlandı).

## 2. SSOT Maddeleri

| Konu | Tek doğru kaynak |
|---|---|
| Evrensel sözleşme | sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md |
| Kazanç tablosu + mimari | PASEO-VERIMLILIK-PLANI.md |
| Proje şablonu | ANAYASA-SABLONU.md |
| Aktivasyon emirleri | FERMANLAR.md |
| Kanıt araştırmaları | kanit/01-10 |
| Repo haritası | CODEMAP.md (scripts/codemap.ps1 üretir — elle düzenlemek YASAK) |
| Durum | STATE_BOARD.md |
| Ürün sacayağı I — kapsül görev grafı (ÇERÇEVE: faz→sprint→görev kapsülleştirme, insan+makine okur) | plans/gorev-grafigi-2026-10-26.json (graf SSOT; politika PLAN §25) |
| Ürün sacayağı II — manager döngüsü (KALP: replan·izle·denetle·benchmark·performansa-dayalı atama) | core/src/{dispatcher,replan,benchmark,spawn-olcum,turnuva}.ts + plans/DIKEY-HIZALAMA-PLANI-2026-10-29.md |

## 3. ASLA

- Y1. Şablonlara belirli bir projenin adını/içeriğini sokma.
- Y2. Doğrulanmamış rakamı (R) diye işaretleme.
- Y3. CODEMAP.md'yi elle düzenleme.

## 4. HER ZAMAN

- Z0. Koda/dokümana dokunmadan önce hedef CODEMAP.md'den seçilir; toplu tarama YASAK.
- Z1. Her anlamlı değişiklik sonrası: scripts\codemap.ps1 tazele + scripts\saglik.ps1 yeşil tut.
- Z2. Rehber ve plan sürüm numaraları birlikte artar.

## 5. Çelişki Çözümü

Sıra: ANAYASA > evrensel sözleşme > plan > kanıt raporları > konuşma. Ajan uyuşmazlıkta DURUR, tek satırla raporlar. (dikey hizalama: K-0054 §6)

## 6. Dikey Hizalama (K-0054)

- H1. Bu repo bundan sonra TEK ürün hedefine dikey hizalanır: projenin görev grafı olarak kapsüllenip sıralanması (sacayağı I) ve manager LLM'in görev ajan ordusunu askeri disiplinle yönetmesi (sacayağı II: dağıtım·denetim·izleme·takip·replan·benchmark· performansa-dayalı görev yazdırma). Sacayağına hizmet etmeyen yeni iş varsayılan RED (gerekçeli iş fişi olmadan başlamaz).
- H2. Öncelik: KALP (II) > ÇERÇEVE (I) cilası. Çerçeve kalbi taşır; kalpsiz çerçeve başarısız sayılır. Başarı ölçütü manager döngüsünün kanıtlanmış çıktılarıdır (ölçüm çifti V9-04 standardı).
- H3. Yol disiplini: dikey dar alan — her dalga atomik, tek-yazıcı, kanıt kanallı (K-0053 hattı); en az kodla en büyük sıçrama; ölçümsüz hız/üstünlük iddiası YASAK (A2 ile birleşir).
