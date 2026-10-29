# V2 — Belge/graf/otorite denetimi: kalıcı sonuç özeti

**Kaynak:** Tamamlanan yerleşik salt-okur alt görev 01a1801d-541c-74df-8aa4-218230fb20a2. İlk V2 açılışı kesildi, sonuç üreten tekrar kullanıldı. Bu belge dönen incelemenin ana ajan tarafından düzenlenmiş özetidir; ham oturum dökümü değildir. Brief: [`V2-BRIEF.md`](V2-BRIEF.md).

**Hüküm:** DÜZELT-İLE-DEVAM (belge/plan); uygulama/faz geçişi NO-GO. Yeni ölçüm, komut/test/DB erişimi, dosya değişikliği ve diğer incelemelere erişim yok; aşağıdaki tespitler statik.

| ID | Şiddet | Kaynak ve çelişki | Somut düzeltme / yetki sınırı |
|---|---|---|---|
| V2-01 | Yüksek | Grafın kod bütçesi sayı; [`metaYaz()`](../../pano/kapsul-tuval.html:91) aynı alanda metin değiştirme çağırıyor ve hata “sunucu yok” görünümüne düşüyor. 3.820 uygulama ile 9.980 teknik toplam da farklı kapsam. | Sayısal sözleşme ve gerçek okuyucu uyumu sınansın; uygulama/test/pilot toplamları ayrı. Ürün kodunu değiştirmek ayrı kapsam; veri uyumluluk çözümü de kayıtlı ve testli olmalı. |
| V2-02 | Yüksek | Grafın aktif/seçilebilir/uygulama bayrakları [`tuval`](../../pano/kapsul-tuval.html:99) ve [`kart üreticisinde`](../../pano/server.js:146) güvenlik kapısı olarak uygulanmıyor; [`diğer plan okuyucusu`](../../plugin/server/planmd.ts:169) farklı yerel dosyaları okuyor. | Metadata gerçek yürütme freni sanılmasın. Görsel seçim/kart yazımı dispatch değildir. Pilotun bütün operasyonel başlatma sınırları S0/S1'de kanıtlanmalı; alan eksikliği deny-default. |
| V2-03 | Yüksek | Tarihsel KAPALI A1, ertelenmiş A0-1'e; A0-1 ise yeni H1'e bağlı gösteriliyor. DAG döngüsüzlüğü kapanış anlamını doğrulamıyor. | Geçmiş provenans ile aktif yürütme altgrafını ayır. Eski kabulü silme, açık önkoşulu sahte kapatma veya eski kanıtı genişletme yok. |
| V2-04 | Yüksek | Ana plan insan kapısına sprint kanıtı ve insan kararı istiyor; kapı düğümlerinde anahtarlı kanıt/karar/sürüm/kapsam bağı yok. Kabulde yalnız 11 sprint NOT_RUN. | Kapı için gerekli kabul kimlikleri, plan/graf sürümü, kanıt referansları, insan karar kimliği ve kapsamı tanımlansın. Kapı kabulü ile sonraki fazı başlatma izni ayrı. Yeni PASS veya keyfî payda satırı yok. |
| V2-05 | Orta | [`kart üretimi`](../../pano/server.js:91) sınırsız “JSON kazanır” yazıyor; ana plan üstünlüğü ve kaynak sürüm/özetini taşımıyor. Mevcut kart ezilmediği için bayat kart kalabiliyor. | Kart anlık görüntüdür, başlatma yetkisi değil; plan ve graf sürüm/özetini taşımalı, stale kart reddi ayrıca sınanmalı. Eski kartları ezme yok. |
| V2-06 | Orta | [`durum başlığı`](../../STATE_BOARD.md) ekli; [`okuyucu`](../../pano/server.js:53) tam “Son damgalar” başlığını arıyor. | En dar politika içi çözüm sabit başlık, açıklama ayrı satır; veya ileride okuyucuyu esnetme. Eski damgayı yeni gerçekleşmiş iş gibi yazma yok. |

**Doğru kalanlar:** Tek ana planın üstünlüğü indeks/hedef/ADR'de hizalı; taslak ve eski senaryo bölümleri tarihçe olarak işaretli. Kabul paydasının büyümesi kalite gerilemesi veya yeni başarı sayılmıyor. Bu doğrular ikinci aktif plan var diye yanlış sınıflandırılmadı.

**Kapsam:** Ana plan §25, graf, insan ikizi, durum/indeks/hedef/kabul/ADR/taslaklar ve ilgili pano/eklenti okuyucuları açıldı. Bütün depo satırlarının veya bütün ham raporların okunduğu iddia edilmedi.
