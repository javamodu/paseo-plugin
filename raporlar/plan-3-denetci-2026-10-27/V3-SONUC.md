# V3 — Sprint/LOC/pilot denetimi: kalıcı sonuç özeti

**Kaynak:** Yerleşik salt-okur alt görev 01a18025-1c8e-775f-aff0-f0287144608e. Ana ajan tarafından düzenlenmiş özet; ham oturum dökümü değildir. Brief: [`V3-BRIEF.md`](V3-BRIEF.md).

**Hüküm:** DÜZELT-İLE-DEVAM (yön); canlı pilot NO-GO. Denetçi yalnız okuma/arama yaptı; komut/test/DB/sağlayıcı/ajan veya dosya yazımı yapmadı, diğer denetimleri okumadı. LOC aralıkları (T); eski kaynak raporlardaki ölçümler bu tur yeniden ölçülmedi.

| ID | Şiddet | Kaynak/varsayım | Düzeltme ve kabul |
|---|---|---|---|
| V3-01 | Kritik | İlk S0 60 kaynak + 160 test; [`yerel başlatma`](../../core/src/local-runtime.ts:141) normal süreç/ortam; [`probe`](../../core/src/probe.mjs:172) statik. Keşif ile davranışsal sınır kanıtı birleşmiş. | S0a salt-okur keşif; ayrı dar insan izniyle S0b sağlayıcısız zararsız sınır fixture'ı. Hazır OS izolasyonu yoksa dur/yeni altyapı tahmini. G0 config varlığıyla geçmez. |
| V3-02 | Yüksek | [`sözleşme özeti`](../../core/src/supervisor.ts:30), [`CLI kaynak biçimi`](../../core/src/cli.ts:150) ve [`HEAD checkout`](../../core/src/local-runtime.ts:134) uçtan uca göç gerektiriyor. | S1 sürümlü sözleşme/uyumluluk → onaylı kaynak → tek pilot girişine bölünsün. Değişen hedef/izin/suite/bütçede eski onay kullanılmasın; geçmiş yeniden hashlenmesin. |
| V3-03 | Kritik | [`günlük değerlendirme`](../../core/src/cli.ts:196) dosya kontrolü; [`runner`](../../core/src/evaluator.ts:28) ve [`opsiyonel imza`](../../core/src/receipt-link.ts:180) tam ürün zinciri değil. | S2 gerçek korunan test+mühürlü aday; tam bağ+zorunlu yetkili imza. Genel PKI ürünü değil seçili yerel sınır; sahte test özeti bağımsız sayım değildir. |
| V3-04 | Kritik | [`sıfır harcama`](../../core/src/supervisor.ts:194), [`run bazlı iptal`](../../core/src/gozetimsiz.ts:42), [`tek PID`](../../core/src/local-runtime.ts:213), [`ölüm yoklaması`](../../core/src/dispatcher.ts:223) ayrı büyük işler. | S3 kalıcı OS süreç kimliği/ağaç → kullanım/limit → STOP/deadline/yeniden açılış. Normal bitiş/çökme ayrı; eski teyit yeni iptali örtemez; başkasının PID'si öldürülmez. |
| V3-05 | Yüksek | Aynı pilotun A/B/C teslimleri bağımlı işler; eski [`yerel canlı koşum`](../kanit-hedef/a05-lrt-2026-10-27.md:25) metin çıkarma, kod projesi değil. | S4 kapsamını genişletmeden Unicode/kalıcılık, idempotent tamamlama/toplam ve eski-veri regresyon oracle'ı önceden dondurulsun. İnsan terminalden kullansın; üç teslim bağımsız genel başarı örneklemi sayılmasın. |
| V3-06 | Yüksek | [`replan`](../../core/src/replan.ts:195) hücre tazeler, [`ders`](../../core/src/lessons.ts:325) nesne döndürür; [`benchmark`](../../core/src/benchmark.ts:173) aynı görevi tekrarlar ve executor hatası akışı kesebilir. | S7 strateji kontrolü; S8 gerçek görev girdisinde ders ve gizli eşlenmiş kıyas; S9 korunan sonlu terfi; S10 ön-kayıtlı görev düzeyi analiz. Hata/timeout paydadan kaybolmasın; aynı görevin tekrarı bağımsız görev olmasın. |

## Yerine geçen paket tahminleri (T)

| Paket | Ordu kaynak işi | Ordu test işi | Ayrı pilot kod/test | Sınır |
|---|---:|---:|---:|---|
| S0 | 300–600 | 350–650 | 0 | Hazır seçili Windows sınırı; yeni genel sandbox hariç |
| S1 | 500–800 | 650–950 | 0 | Göç/kimlik; S0 izolasyonu ve S2 makbuzu tekrar sayılmaz |
| S2 | 600–950 | 850–1.250 | 0 | Runner/aday/imza; anahtar OS koruması S0'da |
| S3 | 650–1.050 | 900–1.400 | 0 | Yaşam/usage/STOP; genel runtime ve yeni sağlayıcı yok |
| S4 | 180–300 | 300–500 | 600–1.000 | Hata altyapısı S1–3; burada pilot/kanıt/geri dönüş |
| S7–S10 birleşik | 1.800–2.700 | 2.500–3.800 | 280 | S10 pilot payı bir kez, S2/S3 altyapısı tekrar değil |

H1: Ordu kaynak 2.230–3.700 + test 3.050–4.750 + pilot 600–1.000 = **5.880–9.450 teknik LOC (T)**. S5–S6'nın eski 1.940 teknik LOC'u şimdilik tutulduğunda H4 **12.400–18.170**; bu iki sprintin yeterliliği onaylanmış değildir. Eski yüzde 35 rezerv bu aralıklara yeniden eklenmez. Ortak işler bir kez sayılır; aralıklar mevcut bütçenin üstüne otomatik ilave değildir ve yürütme/harcama taahhüdü vermez.

**Geçmiş sapmaların anlamı:** [`A0-2`](../kanit-hedef/a02-sweep-2026-10-27.md:59), [`A0-3`](../kanit-hedef/a03-gozetimsiz-besleme-2026-10-27.md:34) ve [`A3`](../kanit-hedef/a3-kural-derleyici-2026-10-27.md:57) olumsuz yolların iş hacmini büyüttüğünü gösteriyor; bunlardan evrensel bir aşım çarpanı çıkarılmadı. Dosya boyu ile iş deltası, test satırı ile test adedi ayrılmalı. Kampanya ve insan zamanı LOC'den uydurulmamalı.
