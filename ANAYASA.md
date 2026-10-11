# ANAYASA — paseo-plugin

> Bu belge bu repo için tüm dokümanların üstündedir. Çelişkide BU BELGE kazanır; evrensel sözleşme (PASEO-VERIMLILIK-REHBERI-v1.4.md) bu belgeye tabidir.
> Ajan bu belgeyi değiştiremez; değişiklik önerisi kararlar/K-XXXX.md ile açılır, yalnız kullanıcı onaylar.

## 1. Hizalama Anahtarları (öncelik sırasıyla)

- A1. Evrensellik: rehber ve şablonlarda uygulama/proje adı geçmez; "<proje>" yer tutucu kullanılır.
- A2. Kanıt disiplini: ölçüm yoksa (T) tahmin, resmî ölçüm (R), tek-kaynak iddia * işaretli. Ölçümsüz yüzde YAZILMAZ.
- A3. Bütçe hijyeni: rehber ≤150 satır, bu belge ≤60 satır; aşan içerik işaretçiyle alt dosyaya taşınır.
- A4. Sürüm senkronu: rehber ve plan aynı sürüm numarasını taşır (şu an v2.0).

## 2. SSOT Maddeleri

| Konu | Tek doğru kaynak |
|---|---|
| Evrensel sözleşme | PASEO-VERIMLILIK-REHBERI-v2.0.md |
| Kazanç tablosu + mimari | PASEO-VERIMLILIK-PLANI.md |
| Proje şablonu | ANAYASA-SABLONU.md |
| Aktivasyon emirleri | FERMANLAR.md |
| Kanıt araştırmaları | kanit/01-10 |
| Repo haritası | CODEMAP.md (scripts/codemap.ps1 üretir — elle düzenlemek YASAK) |
| Durum | STATE_BOARD.md |

## 3. ASLA

- Y1. Şablonlara belirli bir projenin adını/içeriğini sokma.
- Y2. Doğrulanmamış rakamı (R) diye işaretleme.
- Y3. CODEMAP.md'yi elle düzenleme.

## 4. HER ZAMAN

- Z0. Koda/dokümana dokunmadan önce hedef CODEMAP.md'den seçilir; toplu tarama YASAK.
- Z1. Her anlamlı değişiklik sonrası: scripts\codemap.ps1 tazele + scripts\saglik.ps1 yeşil tut.
- Z2. Rehber ve plan sürüm numaraları birlikte artar.

## 5. Çelişki Çözümü

Sıra: ANAYASA > evrensel sözleşme > plan > kanıt raporları > konuşma. Ajan uyuşmazlıkta DURUR, tek satırla raporlar.
