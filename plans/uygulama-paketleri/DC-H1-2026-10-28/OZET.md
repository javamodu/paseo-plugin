# DC-H1 — Ajan uygulama paketi

**Kimlik:** ATOM-H1-2026-10-28.2. **Durum:** NOT_STARTED; yürütme/harcama yetkisi yok. Bu fişler [ana planın](../../PLAN.md) projeksiyonudur; ürün grafiğine veya kabul defterine yeni PASS eklemez. [Makine kaydı](gorevler.json) · [çalıştırma disiplini](CALISTIRMA.md).

**26 atomik görev:** 4 S0a keşif + 3 S0b sınama + 5 S1 + 6 S3 + 4 S2 + 4 S4. **Başlatılmış görev 0.**

| Sıra | Fişler | Durum | Somut sonuç |
|---|---|---|---|
| 1 | [S0a](S0a.md) | Brief tam; insan emri bekler | Kaynak/ortam, tehdit, kullanım/veri ve TASLAK teknik ADR |
| 2 | [S0b](S0b.md) | Tasarım + ayrı zararsız sınama izni bekler | Gerçek sınır/kaçış ve bağımsız kullanım limiti kanıtı |
| 3 | [S1](S1.md) | G0 + teknik ADR + bütçe + F1 başlatma bekler | Tam sözleşme, onaylı kaynak ve operatör/tek giriş sınırı |
| 4 | [S3](S3.md) | S1 tamamlanmadan açılmaz | Süreç/iptal/kullanım ve dış etki öncesi güncel yetki |
| 5 | [S2](S2.md) | S3 yazma/yaşam kapanışını bekler | Mühürlü aday, korunan test, zorunlu imza ve gerçek teslim |
| 6 | [S4](S4.md) | Ayrı pilot/oracle/sağlayıcı ve geri dönüş izinleri | A/B/C kullanılabilir uygulama + on hata ailesi + H1 insan kanıtı |

**Tek kaynak sırası:** ana plan > bu makine projeksiyonu > üretilmiş fişler. Bütün işler mevcut makro sprint/kabul kimliğine bağlı; görev fişi yeni ürün graf düğümü, onay veya başarı satırı değildir.

## LOC (T; geçici atomik paylar)

| Sprint | Kaynak | Test | Pilot kaynak | Pilot test | Toplam |
|---|---:|---:|---:|---:|---:|
| DC-S0 | 300–600 | 350–650 | 0 | 0 | 650–1250 |
| DC-S1 | 500–800 | 650–950 | 0 | 0 | 1150–1750 |
| DC-S3 | 650–1050 | 900–1400 | 0 | 0 | 1550–2450 |
| DC-S2 | 600–950 | 850–1250 | 0 | 0 | 1450–2200 |
| DC-S4 | 180–300 | 300–500 | 300–500 | 300–500 | 1080–1800 |
| **H1** | **2.230–3.700** | **3.050–4.750** | **300–500** | **300–500** | **5.880–9.450** |

Atomik paylar ve pilot kaynak/test ayrımı yeni (T) öneridir; bütçe büyümesi değildir. S0 ADR’si bunları geçersiz kılarsa dur ve yeniden tahmin et. Mevcut modülleri yeniden yazım olarak toplama, eski rezervi tekrar ekleme. S0a dokümanı teknik LOC değildir; kaynak/test/kanıt/doküman/rework ayrı ölçülür.

## Kullanım ve doğrulama

- Önce [CALISTIRMA](CALISTIRMA.md): gerçek izin, snapshot, write-set, rol ve test ortamı bağları olmadan fişi ajana yürütme emri diye verme.
- [Statik doğrulayıcı](dogrula.mjs) DAG, dosya sınırı/çakışma, kapalı izinler, kaynak varlığı ve LOC toplamını denetler; gerçek OS sınırı veya görev sonucunu kanıtlamaz.
- [Denetçi testleri](dogrula.test.mjs) yalnız paket yazım araçlarının testidir; ürün regresyonu değildir.
- [Görünüm üreticisi](gorunum.mjs): --check salt-okur eşlik kontrolü; --write yalnız yeni insan görünümü oluşturur, mevcut dosyayı ezmez.
- RBT rapor birleşimi ve K-SADE ayrı işlerdir; bunları S0a’nın otomatik önkoşulu yapma.

## Sonraki fazlar

[S5–S10 ayrıntılandırma kapıları](SONRAKI-FAZLAR.md): H1/H2/H3 ölçümleri sonrası bir sonraki faz atomikleştirilir. Bugün kesin dosya/komut/tekil LOC uydurulmaz.

