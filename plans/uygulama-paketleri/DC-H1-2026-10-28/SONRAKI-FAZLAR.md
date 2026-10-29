# Sonraki fazlar — kapı sonrası ayrıntılandırma

**Kimlik:** ATOM-H1-2026-10-28.2. **Durum:** NOT_STARTED; yürütme/harcama yetkisi yok. Bu fişler [ana planın](../../PLAN.md) projeksiyonudur; ürün grafiğine veya kabul defterine yeni PASS eklemez. [Makine kaydı](gorevler.json) · [çalıştırma disiplini](CALISTIRMA.md).

**Bunlar çalıştırılabilir kod görevleri değil; ileride görev paketi üretmenin teslim sözleşmesidir.**

## DC-S5 / DC-S6

**Ayrıntılandırma önkoşulu:** H1_ACCEPT; ayrıca yeni faz başlatma emri gerekir. Başlatma kararı yok.

**Somut teslimler:**
- kalıcı hazır iş/niyet-etki-kayıt sürücüsü
- restart/crash sınırlarında çift işsiz devam
- tavanlı onarım/bildirim ve ayrı izinli 30 dk/en fazla 2 saat hazırlama

**Paketleme:** H1 ölçümüyle kesin write-set/test/bütçe; yeni satırlar bu paketin revizyonunda, ikinci aktif plan yok.

**Teknik LOC (T):** 1860–3160. Tekil sprint payları yeni kanıtla hazırlanır; eski nominalden sessiz bölünmez.

## DC-S7 / DC-S8

**Ayrıntılandırma önkoşulu:** DC-H2; ayrıca yeni faz başlatma emri gerekir. Başlatma kararı yok.

**Somut teslimler:**
- gerçek alternatif strateji ve insan onaylı revizyon
- dersin sonraki görev girdisine bağlanması
- gizli eşlenmiş görev kıyası, altın set, bağımsız çift sayım ve canary

**Paketleme:** H2 sonrası görev bazlı tasarım ve bütçe; faydasız dersin reddi geçerli sonuç.

**Teknik LOC (T):** S7–S10 ortak zarfından; bu faza ayrı tahmin yok. Tekil sprint payları yeni kanıtla hazırlanır; eski nominalden sessiz bölünmez.

## DC-S9 / DC-S10

**Ayrıntılandırma önkoşulu:** DC-H3; ayrıca yeni faz başlatma emri gerekir. Başlatma kararı yok.

**Somut teslimler:**
- yetkili sonlu terfi/bekle/geri-al ve karar tekrarı
- ön-kayıtlı temsili görev kampanyası
- tam payda, insan müdahalesi, tüketim ve ayrı sürüm kararı

**Paketleme:** H3 sonrası; ön-kayıtlı eşik/örneklem ve korunan oracle olmadan kampanya başlatma yok.

**Teknik LOC (T):** S7–S10 ortak zarfı 4580–6780. Tekil sprint payları yeni kanıtla hazırlanır; eski nominalden sessiz bölünmez.

## Bir sonraki faz paketinin zorunlu çıktısı

Kesin görev/bağımlılık listesi; en fazla üç mevcut dosyalı ve sırasız yazma çakışması olmayan kapsam; gerçek tasarım/insan kapıları; pozitif/negatif test komutları; kaynak/test/pilot LOC ve yürütme bütçesi; korunan oracle ve kanıt şeması; ayrı tester/denetçi. Hedef, yetki ve kabul tanımı genişletilmez.

**Toplam yol (T):** H1 5.880–9.450 + S5/S6 1.860–3.160 + S7–S10 4.580–6.780 = 12.320–19.390. Bu dosya kaynak/test/pilot işlerini yeniden bütçeye eklemez.

