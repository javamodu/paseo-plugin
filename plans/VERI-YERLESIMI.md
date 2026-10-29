# Veri yerleşimi — mevcut yollar ve değişmezlik politikası

Bu belge **mevcut kaynakların statik yol haritasıdır**; veritabanı içerikleri açılmadı, doğruluğu veya birbirine eşitliği iddia edilmiyor. Yetki kaynağı [ana plan](PLAN.md), güncel durum [STATE_BOARD](../STATE_BOARD.md). Göç ve runtime seçimi S0 teknik ADR'si + ayrı uygulama kararıdır.

| Yer | Mevcut anlam / kaynak | Bu kapanışta işlem |
|---|---|---|
| core/data/ordu.sqlite | [CLI](../core/src/cli.ts:411) varsayılanı çalışma dizinine göre göreli data yoludur; ORDU_DB ile değişir. İlgili geçmiş canlı koşular bu kökü açık seçerek kaydetmiştir. | Baytlarına dokunulmaz, taşınmaz, açılmaz. CLI gerçek çalışma dizini/env olmadan çalıştırılmaz. |
| core/veri/ordu.sqlite | [Pano başlatma betiği](../core/veri/pano-start.ps1:9) bu yolu açık seçer. CLI köküyle aynı DB olduğu varsayılmaz. | Betik/DB değiştirilmez; kullanıcı süreçleri durdurulmaz. |
| İki kökteki SQLite WAL/SHM | Canlı veritabanı yan dosyaları; anlık ve süreç sahipliğindedir. | Git dışlanır; silme, taşıma, checkpoint veya canlı temizleme yok. |
| core/data altındaki JSONL/registry | Kural, replan, kullanım/yaşam gibi kalıcı runtime kayıtları; bir kısmı bilinçli sürümlüdür. | Toplu ignore/silme yapılmaz; önceki sahiplik ve append-only sözleşmesi korunur. |
| core/veri/artifacts | Kaydedilmiş artefaktların sürümlü evlerinden biri. | Çöp varsayılmaz; kayıt ilişkileri incelenmeden taşınmaz. |
| raporlar/kanit-hedef ve rapor paketleri | Tarihli test/deney/karar kanıtları; runtime DB'nin yerine geçmez. | Yeni koşum benzersiz kayıt; eskiler korunur. |
| .tmp-kilo ve kök veri dizini | Denetimde boş görülen yardımcı dizinler; kalıcı otorite değiller. | Geçici araç dizini dışlanır; boş dizin silme gereksizdir. |

## Yeni ajan için uygulanacak mevcut güvenlik sınırı

Üretim CLI/pano komutu gerekiyorsa operatör **aynı doğrulanmış mutlak ORDU_DB yolunu, çalışma dizinini ve izin kapsamını** açıkça seçmelidir. Varsayılan iki yolun kendiliğinden birleştiği sanılmaz. Bu belge runtime davranışını değiştirmediğinden S0 ADR'si ve uygulama kapısı olmadan yeni üretim komutu çalıştırma izni vermez.

Testler kendi geçici repo/DB/port alanlarını kullanır; üretim iki veri köküne sıfır dokunuş. [Store açılışı](../core/src/store.ts:14) göç/pragma/yazım doğurabileceği için “yalnız status okuyacağım” gerekçesi yeterli değildir. Runtime evlerinin birleştirilmesi, sürümden çıkarılması veya veri göçü ayrı, yedek/uyumluluk/geri dönüş kanıtlı iş olarak kalır.

**Kilit kapsamı:** Belge/paket kaynakları ve kanıt manifesti. Runtime DB/JSONL, SQLite yan dosyaları, probe-latest, telemetri ve başka ajanların kirli dosyaları otomatik stage/commit edilmez. Çalışma ağacı hâlâ kirli olabilir; kapsam hash'iyle hazırlanmış aday buna rağmen “repo temiz” diye sunulmaz.
