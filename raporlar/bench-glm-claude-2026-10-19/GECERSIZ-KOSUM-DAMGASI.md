# GEÇERSİZ KOŞUM DAMGASI — bench-glm-claude-2026-10-19

Tarih: 2026-10-26 (gelen-kutu B9 işleme turu; kaynak: ana-ajan-2026-10-25.json B9)

**Bu koşum GEÇERSİZDİR — veriler hiçbir karşılaştırmada kullanılmaz.**

Kanıt (R, bench.json satır içi):

- 5 aşamanın tamamında örnek çıktı `API Error: Connection refused (ECONNREFUSED)` — `hizOrnek` · `iqOrnek` · `termOrnek` hepsi aynı bağlantı reddi.
- `olculen: 0` · `tps: null` · `hizToken: 0` · `IQ: 0` · `terminal: 0/5` — hiçbir ölçüm üretilmedi.
- **Yanıltıcı alan:** `durumlar.hiz/iq/term: "success"` — koşum "başarılı" işaretli olmasına rağmen hiçbir API çağrısı gerçekleşmedi (dış dünya: proxy/güvenlik duvarı engeli). Bu alan dosyada DOKUNULMADAN bırakıldı (append-only disiplini: veri değiştirilmez, damga yanına yazılır).
- `kod: "FAIL:fonksiyon bulunamadi"` + `uyum: "FAIL"` da bağlantı reddinden türedi (kod/uyum aşamasına giren yanıt hiç gelmedi).

Sonuç: FAZ-4.1 paired-benchmark karşılaştırmalarında ve "24 koşu / 702K" türü sayımlarda bu dizin **dışlanır** (geçersiz-koşum sınıfı). Ham bench verisinin arşiv taşınması (EN ÜST RİSK maddesi) ayrı [insan] sıra kararıdır — bu damga yalnızca verinin geçerliliği hakkındadır.

İşleme kaydı: ana-ajan-2026-10-25.json B9 `islenme` alanı bu dosyaya atıf verir.
