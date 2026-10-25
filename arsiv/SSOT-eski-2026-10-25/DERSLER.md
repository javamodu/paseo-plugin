# DERSLER — negatif bilgi (L5)

Kural: buraya yazılan madde "denendi, patladı, sebebi" içerir. Aynı tuzağa ikinci kez düşme.
Biçim: `tarih — tuzak. Patlama: <gözlem>. Sebep: <kök neden>. Kural: <ne yapılacak>.`

## 2026-10-25 — Codex izin bayraklarını birlikte kullanmak
Patlama: Codex benchmark komutu 214 ms içinde exit 2 verdi.
Sebep: `--approve-for-me` ve `--sandbox <mode>` birbirini dışlıyor.
Kural: Codex CLI’de bu iki bayrağı aynı anda kullanma; ya sandbox bayrağını ya da bypass bayrağını seç.

## 2026-10-25 — Windows süreç ağacını yalnız kökten öldürmek
Patlama: benchmark süreci raporu yazdıktan sonra askıda kaldı; `child.kill('SIGKILL')` yalnız kök süreci öldürdü, alt süreçler ve stdio akışları açık kaldı.
Sebep: Windows `cmd.exe` sarmalayıcısı yeni süreçler doğuruyor; Node yalnız kök PID'i öldürüyor ve açık stdio event loop'u tutuyor.
Kural: Windows'ta süreç ağacını `taskkill /PID <pid> /T /F` ile kapat, ardından `stdout`/`stderr` akışlarını `destroy` et ve `unref` çağır.

## 2026-10-16 — elle yazılmış beklentiyi assert etmek
Patlama: provider-bench doğrulaması `EXIT=1` verdi (`FAIL: modeller`) ama config'de tek bir hata yoktu.
Sebep: beklenti listesini elle sıralayıp `-join ','` ile karşılaştırdım; PowerShell'in kültürel sıralaması ordinal'den farklı (`deepseek-v4.1-` < `deepseek-v4-flash`). Elle yazılan sıra, motorun sırasıyla örtüşmedi.
Kural: küme karşılaştırması kullan (`Compare-Object`, yön bağımsız) veya beklentiyi canlı veriden türet. Sıra bir tesadüf, küme bir gereklilik.

## 2026-10-16 — kanıt nesnesini hash'ten sonra tamamlamak
Patlama: `benchHash` bağımsız yeniden hesaplamada `BOZUK` çıktı (exit 1).
Sebep: `note` alanını hash'i ürettikten SONRA yazdım; dolayısıyla kanıt kapsamı dışarıda kaldı ve tamper-kanıtı kendi içinde geçersizdi.
Kural: hash giriş nesnesi son haliyle kapanmalı; hash'ten sonra hiçbir alan eklenmemeli. Doğrulama script'in kendisine değil, dosyayı bağımsız okuyan ikinci bir komuta yazılır (kanıt, üreticiden bağımsız okunmalı).

## 2026-10-16 — `AbortSignal.timeout` yalnız fetch'i sarar
Patlama: 120s'yi aşan modelde `DOMException [TimeoutError]` yakalanmadan process düştü (exit 1, rapor yazılmadı).
Sebep: `AbortSignal.timeout` sinyali `fetch` çağrısına bağlı; asıl yavaşlık `response.body.getReader()` döngüsündeydi ve o döngü try/catch içinde değildi.
Kural: uzun süren işlerde elle `AbortController` kur, `finally` içinde `clearTimeout` ile temizle ve tüketim döngüsünü de try/catch'e al.

## 2026-10-16 — ölçülemeyen hızı sayı gibi sunmak
Patlama: `nvidia/nemotron-3.5-super-vl:free` için `11189 tok/sn` raporlandı.
Sebep: içerik tek SSE paketinde geldi; üretim penceresi (toplam − ttft) 4ms ölçüldü, bölüm uydurma bir oran verdi.
Kural: ölçüm eşiği yoksa `null` + gerekçe yaz. Gerçek sayı üretilemiyorsa **tahmini hız diye sunma**; en kötü ihtimalle ayrı ve açık etiketli bir taban değer (toplam süreye bölünmüş) ver.

## 2026-10-16 — `file://` ile tarayıcı doğrulaması yapılamaz
Patlama: `paseo_browser_new_tab` `file:///...html` adresini reddetti (URL must use http/https only).
Sebep: tarayıcı hostu yalnız http/https kabul ediyor; dosya şeması kök dosya sistemi erişimi gerektirir.
Kural: yerel HTML'i doğrulamak için evidence klasörünü 127.0.0.1'de izole portta statik sun; iş bitince süreci öldür, portu ve temp dosyalarını temizle, kalıcı sunucu bırakma.

## 2026-10-16 — silinmiş temp dosyayı kullanan sunucuyu "başladı" saymak
Patlama: `Start-Process node bench-serve.mjs` çıktı üretti (PID döndü) ama port dinlemiyordu; tarayıcı boş sayfa açtı, iki tur teşhis kaybı.
Sebep: dosyayı bir önceki turun temizliğinde silmiştim; `Start-Process` var olmayan betiğe karşı hata vermez, sadece süreç anında ölür ve PID yine de basılır.
Kural: uzun süreli arka plan işi başlattıktan sonra **PID'e değil erişilebilirliğe** bak — aynı komut içinde HTTP/port probe'u ile doğrula, `Hazir` olmadan "başladı" deme. Silinen geçici betiği yeniden kullanmayacaksan başlatmayı da atla.

## 2026-10-16 — inline `node -e` içinde çift tırnak
Patlama: doğrulama komutu `SyntaxError: Invalid regular expression` verdi, hiçbir kontrol çalışmadı.
Sebep: PowerShell'in `-e` argümanı içindeki JS çift tırnakları bozdu; normal ifade `/data-v="OK"/` bozuldu.
Kural: birden fazla tırnak içeren doğrulamayı `-e` ile değil geçici `.mjs` dosyasıyla koştur; doğrulamayı tek satırlık kabuk komutuna sıkıştırma.

## 2026-10-16 — TDZ: döngüde kullanılan haritayı sonradan bildirmek
Patlama: `ReferenceError: Cannot access 'kataloglar' before initialization` + süreç çöktü.
Sebep: `const kataloglar = new Map()` ifadesi ana döngüden sonra, kullanıldığı yerden sonra duruyordu; `const` zamanlanmış bölge (TDZ) hata verir.
Kural: bir toplayıcıyı (`Map`, dizi) ilk kullanıldığı satırdan **önce** bildir; dosyanın sonuna eklemek yeni kodu yerel olarak tutmaz.

## 2026-10-16 — kapatılan (closure) raporu, okunan dosyayı gölgelemek
Patlama: `olcumTopla()` receipt'leri diskten okuyordu ama `ekle()` **kapanış değerini** (`rapor`) geziyordu; diskten okunan içerik yalnız `generatedAt` için kullanılıyordu. Sonuç: birleştirme hiç çalışmıyordu, katalog tablosunda 718 satırın hepsi "ölçülmedi" göründü.
Kural: diske/veri kaynağından gelen nesneyi işleyen yardımcıya **o nesneyi parametre olarak geç**; `ekle(dosyaIcerigi, zaman)` yaz, `ekle(zaman)` değil. Kapalı değişken bir veri kaynağını gölgeliyorsa test "beklenenden iyi" çıkar.
Kural (ikinci yarı): `--katalog-only` gibi "ölçüm yapmayan" kip, **receipt'i boş raporla ezdi** ve o koşunun 27 başarılı ölçümü kalıcı olarak silindi. Dosya yazan her yol `if (!KIP_OLCUM_YOK)` ile korunmalı; ayrıca ölçümsüz kipte çıktı yazımı tamamen atlanmalı.

## 2026-10-16 — edit oldString'ini dosyadan tahmin etmek
Patlama: `envanterKur` bloğunu iki kez düzeltemedim ("Could not find oldString"), sonunda PowerShell satır aralığı değişimiyle yol açtım.
Sebep: kaynak dosyada `'canli /models'` **ASCII** yazılıydı, ben `canlı` (Türkçe noktasız ı) yazmıştım. Ayrıca `'ÖLÇÜLMEDİ'` gibi Türkçe karakterli bir dizgi yazıp eşleşmeyen bir kez daha denedim; `parcaBaşıTok` da aynı sınıftan bir kayıp alan üretti.
Kural: edit öncesi hedef satırları **gerçekten oku** ve birebir kopyala; karakter konusunda tahmin yürütme. Aynı edit iki kez başarısız olursa üçüncü kez aynı aracı tekrar etme — satır aralığı bazlı (PowerShell) değişime geç. Yeni kaynak kodu ASCII yaz, ekranda Türkçe gerekiyorsa HTML entity (`&#214;` gibi) kullan.

## 2026-10-16 — konsolun karakter bozmasını dosya bozulması sanmak
Patlama: `Get-Content` çıktısında `'ÖLÇÜLMEDİ'` bozuk göründü, "dosyada U+FFFD var" diye düzelttim.
Sebep: PowerShell konsolu UTF-8'i doğru kodlayla göstermiyor; **dosyanın baytları bozuk değildi** (tarama: 0 adet U+FFFD, 32 non-ASCII satırın hepsi bilinçli Türkçe etiket).
Kural: karakter bozulması iddiasını konsol çıktısından değil, dosyayı okuyup kod noktası sayan bir taramadan koy. Yanlış "onarım" dosyayı bozabilir.

## 2026-10-16 — aynı ölçüm döngüsünü tekrar etmek
Gözlem: `node --check` + tam benchmark koşusu birkaç tur üst üste aynı komutlarla koşuldu; ölçüm maliyeti (ücretli istekler) tekrar ederken kanıt değeri düşüyordu.
Kural: bir doğrulama koşusunu **ikinci kez aynı biçimde tekrarlama**; üretilen çıktının kendisini bağımsız okuyup çapraz tutarlılık denetle (satır sayısı = katalog toplamı, ölçüm zaman damgaları, alan bütünlüğü). Aynı tuzağa iki kez düşme: ikinci denemede aracı değiştir.

## 2026-10-16 — hız ölçümü tek turda oynuyor
Gözlem: aynı TokenHarbor free modeli iki ardışık koşuda `ttft 27s` ve `ttft 44.7s` verdi; TokenHarbor free kota birkaç dakikada tükendi (`free_tier_limit_reached`).
Sebep: ücretsiz havuz yalnız 4 model, her koşu kotadan düşüyor; tek tur istatistik değil örneklem.
Kural: hız iddiası için `--runs=3` üstü medyan kullan; tek tur sonucu "hız" değil "anlık gözlem" diye etiketle.
