# Atomik görevleri ajana verme ve kapatma disiplini

**Paket yazımı onaylandı; ürün uygulaması BAŞLATILMADI.** Tek otorite [ana plan](../../PLAN.md); bu klasör onun görev projeksiyonudur. [Makine fişleri](gorevler.json) · [insan özeti](OZET.md).

## 1. Önce durum ayrımı

- S0a'da dört brief tamamdır; salt-okur keşif + rapor/ADR önerisi için ayrı başlatma emri bekler. Keşif yapılmış gibi sonuç yazma.
- Diğer 22 görev tasarım koşulludur. Görev başına kesin dosya ADAYLARI ve hedefli test reçeteleri yazıldı; bunlar S0 teknik ADR'si, ilgili izin ve kaynak snapshot'ı ile teyit edilmeden çalıştırılamaz.
- Bütün insan kararları boş; gerçek ajan ataması yok; seçilebilir/yetkili görev sayısı 0. Paket denetçisi çalışma zamanı güvenlik kapısı değildir.
- RBT belge birleşimi, K-SADE, S0a keşfi, OS sınaması, ürün kodu, gerçek sağlayıcı harcaması ve nihai insan kabulü farklı kararlardır. Tek paketleme emri bunları açmaz.

## 2. Koordinatörün görev serbest bırakma kaydı

Başlatılacak görev için aşağıdakiler **gerçek kaynaktan** bağlanmadan ajana yürütme emri verilmez:

1. Görev kimliği, paket sürümü ve içerik özeti; ana plan/graf sürümü; önkoşul görevlerinin ayrı tester tarafından doğrulanan kanıtları.
2. Kapsamı açık insan başlatma kaydı; ayrı sınama/kod/bütçe/canlı/harcama kararlarının görevde gerekli olanları. Ajan insan aktör etiketi yazarak onay üretemez.
3. HEAD yanında ilgili kirli dosyalar, içerik hash'leri ve sahipleri. Başkasının değişikliğine veya kanıtına el koyma; yeni dosya adayının mevcut olmadığını doğrula.
4. S0 teknik ADR'sindeki gerçek OS/operatör/süreç/usage/sözleşme/kanıt arayüzleri. Mevcut aday write-set tasarıma uymuyorsa önce paket revizyonu; kod yazarken dosya listesini büyütme.
5. Kesin mevcut/yeni dosya listesi; en fazla üç mevcut dosya, kritik yolda tek yazıcı; aynı dosyaya tester dâhil paralel yazıcı yok. Ortak paket/test zinciri dosyaları da bu sınırda sayılır.
6. Gerçek yazıcı, ayrı tester ve salt-okur denetçi kimlikleri; görev başına tur/süre/token tavanı ve duruş koşulu. Bu paketteki 8 tur/60 dk/60k token öneridir (T), verilmiş hak değildir.
7. Test için temp repo/DB/port, dar ortam, izinli çocuk süreçler ve kanıt kökü. Çalışan kullanıcı süreçlerine dokunma. Gerçek DB veya CLI status salt-okur varsayılamaz; açılış göç yapabilir.
8. Pilot görevlerinde ayrı repo ve korunan oracle kökleri. **Güvenilir Ordu entegrasyon yazıcısı, pilot işçisi ve oracle sahibi tester ayrı kapsamlar kullanır.** Pilot işçisi çekirdek kaynaklarını, onay kanalını, test oracle'ını veya imza anahtarını okuyamaz/yazamaz.

Bu kayıt yoksa **WAITING_AUTHORIZATION / WAITING_DESIGN** olarak bekle. Eksik veriye sahte değer, boş onaya vekil karar veya hazır olmayan fişe “kod-ready” etiketi koyma.

## 3. Komut reçeteleri

Tam komutlar çalışma dizini ve yan etkileriyle [makine kaydında](gorevler.json) bulunur. Her kod fişinin kendi hedefli test komutu da oradadır. Yeni testler **gelecek görev çıktısıdır**; paket hazırlanırken yaratılmadı veya çalıştırılmadı.

| Reçete | Kullanım sınırı |
|---|---|
| READ_GIT / READ_ENV | S0a başlatma kapsamı; yalnız Git ve platform/Node metadata. Sır/env dump yok. |
| Göreve özel hedefli test | Kod ve yerel test izinleri sonrası, mevcut/yeni testler ve dış etkiler incelenerek. Gerekli OS mekanizması yoksa atlayıp PASS verme; BLOCKED. |
| CORE_FULL | Ayrı tester için tam regresyon. [Mevcut paket](../../../core/package.json) ön-testte [probe](../../../core/src/probe.mjs) çalıştırır; süreç/çıktı/ağ etkisi incelemesi gerekir. S0a kapsamında veya otomatik çalıştırılmaz. |
| PLUGIN_FULL | Plugin değişmişse tam bileşen test ve tip kontrolü; gerçek Paseo çağrısı/reload yok. Plugin yazıcısı ilgili plugin becerisini de yükler. |
| DOC_RESULT | Görev sonuç dosyasının biçim kontrolü. Gözlemi yeniden üretmez; izin, imza, ürün PASS veya insan kabulü değildir. |

Kanal etiketi makine kaydında somut örnektir. Mevcut etiket/log varsa **çalıştırma**; ayrı koordinatör kaydında yeni benzersiz deneme etiketi ver. [Kanal betiği](../../../scripts/test-kanal.ps1) aynı etikette logu ve son kayıt işaretçisini ezebilir. Her tekrarın günlüğü ve aynı koşuya ait tarih/HEAD/exit/süre kaydı sabit kopyayla korunur; kırmızı tekrarlar kaybolmaz. Yetkisiz temizleme/silme/sağlayıcı çağrısı ihtimali varsa komutu çalıştırmadan dur.

## 4. Görev sonucu

**Etkin sonuç şeması v2 (ATOM-H1-2026-10-28.2):** Kaynak manifesti görevin bütün zorunlu okuma dosyalarını kapsar. Kanıt artefaktları kendi görev kökünde mevcut, boş olmayan dosyalar ve SHA-256/byte kimlikleriyle kaydedilir; sonuç dosyası kendi hash'ini içermez. Denetçi dosya varlığını/kapsamı/kimliğini de kontrol eder; komutu yeniden çalıştırmış veya gözlemi doğrulamış sayılmaz.

Her görevin yalnız kendi kanıt kökünde iki dosyası vardır: insan özeti ve makine sonucu. Dolu sonuç alanları [sonuç sözleşmesinde](gorevler.json) listelidir. Önceki kanıt varsa ezilmez; yeni deneme yolu ve paket bağı koordinatörce kaydedilir.

- Kaynak manifesti path+SHA-256; ölçülmüş zaman; gerçek çalıştırılan komut/cwd/exit/çıktı kimliği; değişen dosyalar; pozitif P1..Pn ve negatif N1..Nn gözlemleri, kalıcı kanıt referansları.
- Her komut kaydı recipeId, tam command, cwd, exitCode, expectedExitCode ve artefakt listesinde bulunan outputRef taşır. S0a-01 için READ_GIT/READ_ENV, testli fişte TARGETED kaydı eksikse tamamlandı sonucu reddedilir. Komutsuz kaynak incelemesi fişlerinde komut uydurulmaz.
- Her artefakt path/sha256/bytes taşır. Kanıtın başlığı/sayacı gerçek sonucu temsil ediyor mu ayrı tester tarafından incelenir. Hash eşliği içeriğin doğru olduğunu veya aktörün insan olduğunu kanıtlamaz.
- **EVIDENCE_RECORDED:** gözlemler kanıtlı, görev açısından açık blocker yok. Sprint PASS, ürün kabulü veya insan kararı anlamına gelmez.
- **BLOCKED:** eksik izin/mekanizma/veri/kapsam gerekçesi açık. Yalnız “testler başarısız” demek yerine doğru hata sınıfı ve ölçüm sınırı belirtilir.
- Pilot kökü/serbest bırakma kaydı bağlanmadan [sonuç denetçisi](dogrula.mjs) pilot değişikliğine otomatik izin vermez; bu yazar paketi release yöneticisi değildir. İzinli kapsam ancak onaylı yeni paket/serbest bırakma kaydıyla genişler.

### Kayıt biçimini sınama

Repo kökünde, [doğrulayıcının](dogrula.mjs) komut satırı arayüzü kullanılır:

```text
node plans/uygulama-paketleri/DC-H1-2026-10-28/dogrula.mjs --result DC-S0a-01 raporlar/dc-uygulama/DC-S0a-01/sonuc.json
```

Bu bir **biçim kontrolü örneğidir**; sonuç dosyası henüz yoktur. Eksik dosya RED olmalıdır; örnekten görev yapılmış/onaylanmış sonucu çıkarılmaz. Diğer görevde kimlik ve yolu o fişin izinli kanıt yoluyla değiştir.

## 5. Test → doğrulama → insan kapısı

Yeni test doğru nedenle önce kırmızı, değişim sonrası pozitif ve negatifleriyle yeşil olur. Mevcut testler test zincirinden çıkarılmaz; yeni test aynı atomik işin izinli paket dosyasına eklenir. Kısmi test tam regresyon değildir. Her teknik merge öncesi güncel tam core ve değişen bileşenin tam süiti gerekir; izinli ortam yoksa merge/kapanış yoktur. Harita/sağlık kontrolleri ürün regresyonunun yerine geçmez.

Tester ve salt-okur denetçi kaynağı/komutu/artefaktı bağımsız kontrol eder. Görev sonuçları mevcut DC sprint/kabul kimliğine bağlanır; yeni genel PASS satırı açılmaz. G0/H1 kanıt kabulü ile sonraki fazı başlatma ayrı insan kararlarıdır. H1'de üç kullanılabilir teslim ve on hata ailesi kanıtı olmadan, plan fişleri tamamlandı diye ürün kabul edilmez.

## 6. Paket araçları

Bu klasördeki [doğrulayıcı](dogrula.mjs), [denetçi testleri](dogrula.test.mjs) ve [görünüm üreticisi](gorunum.mjs) yalnız plan paketleme araçlarıdır; core import etmez, provider/probe/DB çağırmaz. Yerel paket denetimleri için komutlar:

```text
node plans/uygulama-paketleri/DC-H1-2026-10-28/dogrula.mjs
node --test --test-reporter=spec plans/uygulama-paketleri/DC-H1-2026-10-28/dogrula.test.mjs
node plans/uygulama-paketleri/DC-H1-2026-10-28/gorunum.mjs --check
```

Bu kontrollerden geçen görev paketinin runtime'da güvenli olduğu iddia edilmez. Fişlerin hazırlanması hiçbir ürün görevini başlatmaz. S5–S10 yalnız [kapı sonrası ayrıntılandırma teslimleri](SONRAKI-FAZLAR.md) olarak durur.

## 7. Hız kalemleri kapanışında ölçüm çifti (V9-04)

Hız/verimlilik sınıfı bir kalemin (v8/v9 paket maddesi, K-0053 dalga pilotu vb.) kapanışı, kanıt raporunda **ÖNCE/SONRA ölçüm çifti tablosu** olmadan yapılamaz:

| ölçüt | ÖNCE (taban) | SONRA |
|---|---|---|
| kanal süresi (sn) | taban koşumun son-kanit.json'undan | aynı ölçütte bu dalganın koşumundan |
| duvar süresi (tur başlangıç→kapanış, ölçülmüş) | taban turdan | bu turdan |
| x (başarısız koşum sayısı) | taban koşumdan | bu dalgadan |
| tur/koşum sayısı | taban turdan | bu dalgadan |

Ölçümsüz "hızlandı/azaldı" iddiası **kapanamaz** — madde BEKLEYEN kalır; ölçümsüz hız iddiası sahte-yeşil sınıfıdır. Taban ölçüsü zaten yoksa önce taban koşumu yapılır, sonra değişiklik uygulanır (V9-03'ün ölç-sonra-karar ilkesi). 0 teknik LOC; kural sayacına girmez (paket dokümanı).
