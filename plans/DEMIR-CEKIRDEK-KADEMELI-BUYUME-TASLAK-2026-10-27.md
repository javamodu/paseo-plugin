# Demir Çekirdek → İnsan Kanıtlı Ürün → Kademeli Otonomi

**Güncel durum: ANA PLANA AKTARILMIŞ TARİHSEL ÖNERİ — bağımsız aktif plan değildir.** Yürürlükteki kaynak [`PLAN.md`](PLAN.md) v2.10.1 §25, projeksiyon [`graf v14`](gorev-grafigi-2026-10-26.json). Üç denetçi sonrası **aşağıdaki ilk LOC nominali yeterli taahhüt kabul edilmedi**; güncel şartlı yeniden tahmin ve S0a/b ayrımı ana planda. Kararlar: [`ilk ADR`](../kararlar/ADR-demir-cekirdek-kademeli-buyume-2026-10-27.md), [`denetim eki`](../kararlar/ADR-dc-3-denetci-sonlandirma-2026-10-28.md). Uygulama/canlı/harcama ve yeni bütçe onayı yok.

**İlk kayıt durumu (tarihsel): ONAYA SUNULAN TASLAK.** Aşağıdaki öneri ve onay seçenekleri revizyonun gerekçesi olarak korunur; güncel emir veya ikinci plan değildir.  
**Tarih:** 27 Ekim 2026 · **Kimlik:** DEMIR-CEKIRDEK-KADEMELI-BUYUME-v1.  
**Tek uygulama otoritesi [`PLAN.md`](PLAN.md:1).** Bu dosyanın önerisi onaylı ana plan revizyonuna işlendi. Hedef değiştirilmedi; uygulama sırası ve kanıt kapıları sıkılaştırıldı.

> **Önerilen ilk onay: yalnız DC/F0 + DC/F1.** Önce insanın yönettiği, somut proje teslim eden güvenli tek hat. Bu teslim görülmeden otomatik gece modu, stratejik replan, öğrenme ve çıta yükseltme uygulamasına geçilmez. Sonraki fazlar ayrı “devam” kararı ister.
>
> **Kimlik ayrımı:** Bu belgedeki faz ve sprintler **DC/** ad alanındadır. Örneğin DC/S3, eski görev grafiğindeki S3 değildir. Onay sonrası grafiğe DC önekli yeni kimliklerle taşınır; tarihsel kimliklerin anlamı değiştirilmez.

## 1. Yönetici özeti

**(T) Evet, daha doğru yol budur: önce işe yarayan, insan gözetiminde kanıtlanmış dar bir ürün; sonra aynı sağlam hattın adımlarını otomatikleştirmek.** Yeni özelliklerin varlığını değil, gerçek teslimin güvenilirliğini ilerleme birimi yapıyoruz.

| Kilometre taşı | Kullanıcının elde edeceği | Kümülatif teknik iş LOC (T) | Risk paylı planlama zarfı (T) |
|---|---|---:|---:|
| **H1 — İnsan yönetimli ilk sağlam ürün** | Tek çalışma yolu, gerçek test, insan kabulü; kullanılabilir küçük projenin 3 ayrı teslimi | **3.980** | **5.373** |
| H2 — Sınırlı otomatik yürütme | Onaylı sabit planı ilerletir, sınırlı onarır, limitte durur; son kabul insanın | 5.920 | 7.992 |
| H3 — Öneren ve ölçülerek öğrenen sistem | Yeni strateji önerir; öğrenme faydasını deneyle sınar; plan/kural onayı insanda | 7.820 | 10.557 |
| H4 — Yetki içi deterministik iyileştirme | Korunan ölçüte göre onaylı basamakta yükselir; sabit nihai hedefte tamamlanır | 9.980 | 13.473 |

**Bunlar kalan yeni/değişen uygulama + test + ayrı pilot işidir; mevcut kod hacmi veya başarı yüzdesi değildir.** Dokümantasyon ayrı: H1'e kadar yaklaşık 400 satır, bütün planda 920 satır (T). Risk payı yüzde 35'lik planlama rezervidir; istatistiksel güven aralığı veya değişmez üst tavan değildir.

**İlk satın alınacak sonuç H1'dir.** Bütün yol haritasını peşinen uygulamaya açmak önerilmez. H1 sonunda durup gerçek ürünü kullanmak ve devam kararını kanıta göre vermek mümkündür.

## 2. Başlangıç gerçeği ve korunacak yatırım

**(R) 27 Ekim 2026 21:10:03, Europe/Istanbul kaynak sayımı:**

| Kapsam | Dosya | Fiziksel satır | Boş olmayan satır |
|---|---:|---:|---:|
| Çekirdek kaynakları | 43 | 8.417 | 7.818 |
| Çekirdeğin test komutunda yer alan dosyalar | 65 | 12.201 | 11.160 |
| Veritabanı göçleri, ayrı | 4 | 222 | 209 |

Sayım yorum ve boş satırları içeren fiziksel satırdır; sondaki satır sonu ek satır sayılmaz. Kaynak kapsamı çekirdek kaynak dizinindeki TypeScript ve MJS dosyaları; test kapsamı [`core/package.json`](../core/package.json:11) içindeki komutta listelenen dosyalardır. SQL ayrı sayılır. Bu, testlerin bu tur yeniden çalıştırıldığı anlamına gelmez.

Kaynak HEAD: **40b72a34834a6b0f741d845e43885130ca861a35**. Çalışma ağacında başka oturumların değişiklikleri var; onlara dokunulmaz. Ana plan, hedef, graf ve kabul defteri kimlikleri [`makine taslağında`](DEMIR-CEKIRDEK-KADEMELI-BUYUME-TASLAK-2026-10-27.json) korunur.

Son incelemenin geçerli puanı 48,75/100 mühendislik endeksi (T); canlı başarı oranı değil. Eksiklerin doğrudan kanıtı: [`değerlendirme ve erata`](../raporlar/rapor-chatgpt-27ekim.md:369), [`izole deneyler`](../raporlar/rapor-chatgpt-27ekim-deney-v2.json).

**Yeniden yapılmayacak:** SQLite defter, idempotency, fencing, onay iskeleti, uzlaştırma, sweep, yerel çalıştırıcı, bağımsız değerlendirici, ders/canary ve turnuva motoru. Bunlar korunur; eksik bağlar ve olumsuz yollar tamamlanır. Çekirdek değişimi gerekiyorsa mevcut [`donmuş çekirdek kuralı`](PLAN.md:329) uygulanır: onaylı ADR → önce kırmızı test → geriye uyumlu değişim/göç → güncel regresyon.

## 3. İlk ürünün sınırı

### İlk sürümde var

- Tek operatör, tek onaylı yerel sağlayıcı, tek işçi, tek aktif uygulama işi.
- Giriş yüzeyi mevcut çekirdek komut satırı; yeni pano/UI tasarımı yok.
- Hedef, izinler, kaynak kimliği, test sahibi, süre ve bütçe önceden insan tarafından onaylanır.
- Gerçek bağımsız kabul testleri; dondurulmuş aday ve tam kanıt bağı; nihai kabul insanın.
- STOP, süreç ölümü, yeniden açılış, belirsiz sonuç ve ölçülemeyen kullanım için dürüst durum.
- Pilot kapsamındaki alternatif dosya-kuyruğu başlatması kapalı veya açıkça reddedilir. **Çekirdeğin STOP'u eklentiyi kendiliğinden kapsıyor sayılmaz.**

### İlk sürümde yok

Çoklu proje/paralel yazıcı, otomatik yeni hedef, stratejik planı kendiliğinden değiştirme, otomatik kural yayımlama, otomatik final kabulü, merge/deploy, telefon/uzak erişim, yeni sağlayıcı ordusu, beş model turnuvası ve yeni uzman ekranları. Mevcut salt-okur yüzeyler korunabilir; yeni yazma yolu açılmaz.

**Güvenlik önkoşulu:** Git çalışma ağacı sandbox değildir. DC/S0'da seçilen işçi ortamının gerçekten sınırlandırılabildiği ve değerlendirici/testlerin işçiden korunabildiği gösterilmeden canlı pilot açılmaz. Hazır ve uygulanabilir izolasyon yoksa VM/OS izinleri için ayrı karar ve yeniden LOC hesabı gerekir; bu maliyet sessizce 60 satırlık hazırlığa sığdırılmaz.

## 4. Somut pilot: Görev Defteri CLI

**Öneri (T):** Ayrı Git deposunda, gerçekten kullanılabilir yerel görev takip uygulaması. Ordu'nun kendi defteri veya ikinci orkestrasyon veritabanı değildir. Bu taslakta proje/depo oluşturulmadı.

**Yığın:** Mevcut Node 24 ve yerel SQLite; ek SaaS, web arayüzü, dağıtım veya yeni framework yok. Testlerin sahibi uygulamayı yazan işçi değil; insan/tester önce kabul sözleşmesini dondurur.

### Üç ayrı teslim

| Teslim | Kullanıcıdan gelen somut iş | Bağımsız kabul |
|---|---|---|
| PILOT-A | Görev ekle ve listele; uygulamayı kapatıp açınca veriler kalsın | Komut satırından gerçek ekleme/listeleme, Unicode, kalıcılık, hatalı girdi reddi |
| PILOT-B | Görev tamamla, duruma göre süz, doğru istatistik üret | Tekrarlı tamamlama istatistiği bozmamalı; filtre/toplam doğru; A testleri geçmeli |
| PILOT-C | Önceki teslimi bozmadan farklı bir düzeltme/değişiklik isteği | Ayrı gizli regresyon vakası; eski veri uyumluluğu; A+B ve yeni kara-kutu testleri |

PILOT-C'nin tam gizli örnekleri önceden işçi brief'ine sızdırılmaz; fakat istenen işlev ve izin verilen kapsam açık olur. İnsan ayrıca “test yeşil” sözüne değil gerçek terminalde uygulamanın kullanılmasına bakar.

### On hata ailesi için somut kanıt

Yanlış çıktı · sıfır test · işçi ölümü · yönetici ölümü · çift gönderim · STOP/yeniden açılış · teyitsiz iptal · eski sahip yazısı · yanlış repo/commit · eksik/aşan kullanım.

**H1 geçişi:** Üç ayrı teslim ve bu on ailenin kontrollü senaryoları kalıcı kanıtla kapanır. Üç teslim, istatistiksel genel güvenilirlik ispatı değildir; çalışan ilk ürün ve güvenlik sınırı kanıtıdır. Sağlayıcı çağrısı, hata enjeksiyonu ve sürüm/tag her biri kendi insan onayına bağlıdır.

## 5. Fazlar ve çıkış kapıları

### DC/F0 — Gerçeği dondur, doğru kırmızıyı yaz

**DC/S0:** Güncel kaynak/kirli ağaç/komut/ortam kayıtları; mevcut süit tabanı; yeni regresyonların ayrı dalda hazırlanması; ADR taslakları; pilot kabulü; uygulanabilir izolasyon ve gerçek kullanım kaynağı keşfi.

**G0:** İnsan pilot kapsamı, test sahibi, ortam ve harcama tavanını onayladı; izolasyon ve kullanım kaynağı teknik olarak mümkün. Mümkün değilse canlıya geçmeden dur ve bütçeyi yeniden sun.

Yeni beklenen davranış testleri önce kırmızı olabilir; mevcut yeşil tabandan ayrı kayıtlanır. Bilinen kırmızı ürün testi varsayılan süite merge edilmez; her düzeltme kendi testiyle yeşile taşınır. Eski 449 sayısı sonsuza kadar sabit kabul edilmez; o günkü gerçek güncel tam süit kullanılır.

### DC/F1 — İnsan yönetimli demir çekirdek ve gerçek proje

**DC/S1 — Onaylı işin kimliği ve tek kapı**

- Tam sözleşme özeti: hedef + repo + yerel Git nesne kimliği + izinli işlemler + test/değerlendirici kimliği + bütçe/politika.
- Git'in yerel nesne kimliği ile sözleşmenin 64 karakterli özeti ayrı alan/anlamdır; Git kimliği sırf biçim geçsin diye dönüştürülmez.
- Yerel çalışma ağacı onaylı kaynak kimliğinden açılır. Eski onay/kanıt kayıtları geriye dönük yeniden hashlenmez; sürüm ayrımı ve uyumluluk açık olur.
- Pilot kapsamındaki eklenti kuyruğu devre dışı/reddedilir; yeni genel eklenti köprüsü bu ilk teslimin şartı değil.

**G1a:** İş sözleşmesi değişince onay kimliği değişir; yanlış kaynak, onaysız ve alternatif pilot başlatması reddedilir; eski kayıtlar korunur.

**DC/S2 — Gerçek test ve kanıtlı teslim**

- Günlük kod görevi yolu korunan değerlendiriciyi kullanır; salt dosya/alt dizge kontrolü kod işini kabul ettirmez.
- Çıktı dondurma, gerçek test protokolü ve aday/deneme/ortam/değerlendirici/politika bağı; örnek makbuz gerçek kanıt yerine geçmez.
- İşçi korunan testi, değerlendiriciyi veya kabul verisini değiştiremez. Nihai karar insanındır; aktör etiketini insan gibi yazmak onay sayılmaz.

**G1b:** Yanlış çıktı, sıfır test, zayıflatılmış test, yanlış kaynak/değerlendirici ve bayat aday reddi. Doğru küçük iş aynı yoldan kabul edilebilir.

**DC/S3 — Yaşam döngüsü, tüketim ve duruş**

- İptal teyidi çalışma değil deneme kimliğine bağlı; bir ölüm teyidi iki denemeyi kapatamaz.
- Kalıcı süreç kimliği, yeniden açılış sonrası iptal, gerçek ölüm doğrulaması; belirsizlikte hayali slot serbest bırakma yok.
- Gerçek sağlayıcı kullanımı denemeye bağlanır. Ölçülemeyeni sıfır yazma yok; muhafazakâr rezervasyon ve açık limit uygulanır.
- Gerçek süre sınırı çağırıcısı ve STOP; yeni etkiyi kesme ile yaşayan sürecin ölüm teyidi ayrı sınanır.

**G1c:** Seçili gerçek çalışma yolunda on hata ailesinin ilgili kapıları geçer. Kullanımı sağlayıcıdan doğrulayamıyorsak, bağımsız uygulanabilir tüketim sınırı ve bilinmeyen kaydı gerekir; ikisi de yoksa duruş. Genel keyfî kodu her ortamda güvenli çalıştırma iddiası yok.

**DC/S4 — Somut projenin insanla kullanımı**

PILOT-A/B/C gerçek onaylı yoldan tamamlanır. İnsan komutları işletir ve uygulamayı kullanır; bağımsız test ve kara-kutu gözlem uyuşur. Kanıt paketi dışa aktarılır; izole yedekten geri dönüş tatbikatı yapılır. Canlı repo üzerinde otomatik reset/rollback uygulanmaz.

**G1 / H1:** İşe yarayan ilk ürün, üç ayrı teslim, hata kanıtları, tam güncel süit, çözümlenmemiş sahiplik/iptal yok, gerçek veya dürüst sınırlı tüketim, insanın ayrı sürüm kararı. **Burada durulup ürün kullanılabilir.**

### DC/F2 — Önce sabit planı otomatik işlet

**DC/S5:** Yeni bir ikinci orkestrasyon DB'si kurmadan mevcut deftere bağlı kalıcı hedef sürücüsü. Hazır düğümü seç → gönder → adayı bul → korunan test → kayıt → sıradaki düğüm. İlk aşamada planı insan verir; sürücü yeni strateji üretmez.

**DC/S6:** Mevcut sınırlı onarım gerçekten çağrılır; hata başına tek karar, deneme/süre/kullanım tavanı, gerçek bildirim. Önce 30 dakikalık gözetimli otomasyon penceresi; ayrı onayla en fazla 2 saatlik gözetimsiz **hazırlama**. Her pencerede hata enjeksiyonu ve tüm müdahaleler kayıtlı.

**G2 / H2:** Sabit onaylı plan kendiliğinden ilerler veya gerekçeli güvenli durur; yeniden başlama çift iş doğurmaz. İnsan final kabulü korunur. “Otomatik hazırlanmış” çıktı “insansız kabul edilmiş” sayılmaz. Bu süreler test penceresidir; güvenilirlik garantisi veya uygulama takvimi değildir.

### DC/F3 — Stratejik öneri ve faydası ölçülen öğrenme

**DC/S7:** Durum hücresi tazelemesinden farklı olarak yeni görev sırası/bağımlılık/çözüm stratejisi önerisi. Deterministik kapsam/bütçe doğrulaması. İnsan yeni plan sürümünü onaylar; eski onay ve kanıtlar yeni plana sessizce taşınmaz.

**DC/S8:** Mevcut ders motorunu sonraki görevin gerçek girdisine bağla. Ders açık/kapalı sabit bütçeli gizli görev kıyası; hata tekrarı metriği; doğru/yanlış altın seti; bağımsız çift sayım; canary ve geri-al. Fayda yoksa dersi yayımlamamak doğru sonuçtur.

**G3 / H3:** En az bir gerçek strateji değişimi ve ön-kayıtlı öğrenme deneyi; yarar, belirsizlik ve güvenlik ayrı raporlanır. “Kural yazıldı” başarı yerine kullanılmaz. Plan değişimi ve kural yayımlama hâlâ insan kapısındadır.

### DC/F4 — Yetki içi çıta ve temsili kampanya

**DC/S9:** Sabit hedef/oracle, önceden yetkilendirilmiş sonlu basamaklar; yeterli kanıt ve gerilememe varsa yükselt, aksi durumda bekle/onar/geri-al. Aynı normalize durum+politika+kanıt+saat aynı kontrol kararını üretir. Kök hedefi veya yetkiyi büyütmek otomatikleşmez.

**DC/S10:** Temsili görev kampanyası, görev düzeyinde analiz, kanıt denetimi ve sürüm dondurma. Gerçek tamamlanma, güvenli duruş ve insan müdahalesi ayrı sonuçlar. 59/59 ve 299 yanlış örnek gibi sayılar ancak tanımlı bağımsız örnekleme ve güven iddiasıyla anlamlıdır; körü körüne test adedi kapısı olmaz. Yöntem: [`değerlendirme deney planı`](../raporlar/rapor-chatgpt-27ekim.md:346).

**G4 / H4:** Bütün kritik kapılar ve onaylanan görev dağılımındaki ölçülebilir hedefler geçer; geçmezse kapsam daraltılır veya NO-GO. Bu faz da mevcut insan final kabulünü kendiliğinden kaldırmaz; mutlak “unut ve hiç müdahale etme” için ayrıca açık yetki/politika kararı gerekir.

## 6. Sprint bazlı LOC hesabı

**Bütün aşağıdaki rakamlar (T).** Saatlik üretim hızı veya kesin gün hesabı değildir. Sprint bir takvim haftası değil; sınanabilir, ayrı kapanabilen teslim paketidir.

| Sprint | Yeni Ordu kaynak | Değişen Ordu kaynak | Ordu test LOC | Pilot kod | Pilot test | Teknik toplam |
|---|---:|---:|---:|---:|---:|---:|
| DC/S0 | 60 | 0 | 160 | 0 | 0 | 220 |
| DC/S1 | 220 | 180 | 480 | 0 | 0 | 880 |
| DC/S2 | 200 | 140 | 440 | 0 | 0 | 780 |
| DC/S3 | 240 | 180 | 600 | 0 | 0 | 1.020 |
| DC/S4 | 80 | 100 | 300 | 320 | 280 | 1.080 |
| **H1'e kadar** | **800** | **600** | **1.980** | **320** | **280** | **3.980** |
| DC/S5 | 360 | 100 | 520 | 0 | 0 | 980 |
| DC/S6 | 240 | 100 | 460 | 60 | 100 | 960 |
| DC/S7 | 300 | 100 | 480 | 0 | 0 | 880 |
| DC/S8 | 360 | 100 | 560 | 0 | 0 | 1.020 |
| DC/S9 | 300 | 80 | 520 | 0 | 0 | 900 |
| DC/S10 | 220 | 160 | 600 | 80 | 200 | 1.260 |
| **Bütün yol** | **2.580** | **1.240** | **5.120** | **460** | **580** | **9.980** |

**İlk çalışan ürün hesabı:** 1.400 Ordu uygulama/değişiklik + 1.980 Ordu test + 600 ayrı pilot = **3.980 teknik LOC**. Yalnız Ordu kısmı **3.380**; pilot bunun dışında **600**. Doküman 400 ayrıca. Risk payıyla teknik zarf **5.373** (T).

**Bütün döngü hesabı:** 3.820 Ordu uygulama/değişiklik + 5.120 Ordu test + 1.040 ayrı pilot = **9.980 teknik LOC**. Yalnız Ordu **8.940**; pilot **1.040**. Doküman 920 ayrıca. Risk payıyla teknik zarf **13.473** (T).

### Faz bazlı ek iş — kümülatif değildir

| Faz | Ordu uygulama/değişiklik | Ordu test | Pilot kod+test | Teknik toplam |
|---|---:|---:|---:|---:|
| DC/F0 | 60 | 160 | 0 | 220 |
| DC/F1 | 1.340 | 1.820 | 600 | 3.760 |
| DC/F2 | 800 | 980 | 160 | 1.940 |
| DC/F3 | 860 | 1.040 | 0 | 1.900 |
| DC/F4 | 760 | 1.120 | 280 | 2.160 |
| **Toplam** | **3.820** | **5.120** | **1.040** | **9.980** |

### Sayım sınırları ve bütçe alarmı

- Yeni kaynak: yeni halka dosyaları, zorunlu betikler ve kontrollü göçler. Üretilen log/JSON verisi LOC değildir. Göç satırları kaynak tahminine dâhil; ikinci kez eklenmez.
- Değişen kaynak: eski satırın değiştirilmesi sprint başına bir kez; eklenen+silinen iki kez sayılmaz. Aynı satır başka sprintte tekrar değişirse yeniden iş maliyetidir; nihai repo büyümesi değildir.
- Test sütunu **satırdır, test adedi değildir**. Eski planlardaki “+60 test” ile 60 test satırı karışıklığı tekrarlanmaz.
- Yeni testler + bağımsız oracle + hata kanıtı bu işin önemli kısmıdır. Daha önceki kısa “kalan özellik LOC” tahminlerinden yüksek olmasının sebebi yeni framework değil, güvenli üretim hattının eksik bağları ve doğrulama işidir.
- Yüzde 35 rezerv geçmişe uydurulmuş bir güven düzeyi değildir. Mevcut kanıtlarda iş kalemleri farklı miktarlarda aşıldı; örnekler: [`A0-2`](../raporlar/kanit-hedef/a02-sweep-2026-10-27.md:54), [`A0-3`](../raporlar/kanit-hedef/a03-gozetimsiz-besleme-2026-10-27.md:34), [`A3`](../raporlar/kanit-hedef/a3-kural-derleyici-2026-10-27.md:52). Erken keşif ve yeniden bütçeleme, sahte kesinlikten daha değerlidir.
- Sprint nominalini tüketip kapıyı geçemiyorsa kapsam/yeniden iş analizi açılır. Faz rezervi izinsiz tüketilmez; zarf dolduysa dur ve yeni tahmini onaya sun. Kalite kapısı LOC tavanına uysun diye düşürülmez.
- VM/OS izolasyonu, güvenilir kullanım kaynağı, yeni kapalı komut/olay türü veya ek sağlayıcı ihtiyacı ayrı keşif/ADR ve yeniden tahmin tetikler. Özellikle mevcut R6 kapalı kümesi izinsiz genişletilmez.
- Kampanya duvar saati, sağlayıcı tüketimi, insan denetimi ve onay bekleme LOC'ye sığmaz. Gerçek sprint hızı ölçülmeden bu satırlardan teslim tarihi çıkarılmadı.

## 7. Küçük değişiklik ve ekip disiplini

Her sprint aşağıdaki atomik işlere ayrılır; **tek işte en fazla 3 mevcut dosya** kuralı korunur. Sprintin toplam dosya sayısı ile tek işin sınırı karıştırılmaz. Yeni mekanizma mümkün olduğunca yeni halka dosyası + ince çağrı kancasıdır.

| Paket | Atomik işler ve başlıca mevcut temaslar |
|---|---|
| DC/S1 | Sözleşme/uyumluluk işi → [`supervisor.ts`](../core/src/supervisor.ts:30); kaynak sabitleme işi → [`local-runtime.ts`](../core/src/local-runtime.ts:117), [`dispatcher.ts`](../core/src/dispatcher.ts:37), [`cli.ts`](../core/src/cli.ts:38); alternatif pilot yolunu kapatma ayrı iş → [`ordu.ts`](../plugin/server/ordu.ts:119) ve gerekirse eklenti zamanlayıcısı |
| DC/S2 | Yeni değerlendirme adaptörü + CLI kancası; receipt bağı işi ayrı → [`evaluator.ts`](../core/src/evaluator.ts:28), [`receipt-link.ts`](../core/src/receipt-link.ts:70); pilot korunan test paketi ayrı |
| DC/S3 | İptal eşlemesi ayrı → [`gozetimsiz.ts`](../core/src/gozetimsiz.ts:42); kullanım kapatma ayrı → [`supervisor.ts`](../core/src/supervisor.ts:181), [`store.ts`](../core/src/store.ts:259); süre sınırı çağıracı ayrı → [`deadline.ts`](../core/src/deadline.ts:24), CLI |
| DC/S5–S10 | Yeni sürücü/politika/ölçüm halkaları; mevcut ders, replan, benchmark ve zamanlayıcıya ayrı ince kancalar; bütün işi tek dosyaya yığma yok |

**Önerilen yürütme:** Kritik yol boyunca 1 kod yazıcısı; ayrı tester ve salt-okur denetçi. Pilot/test verisi ve kaynak yazma alanları çakışmaz. Commit/entegrasyon tek elde. Daha çok ajan kullanmak, aynı çekirdeğe daha çok eşzamanlı yazıcı açmak değildir.

Her mikro işte önce ilgili negatif test; her merge'de güncel tam çekirdek süiti ve değişen diğer bileşenin tam süiti. Canlı kullanıcı portlarına test veya izinsiz restart yok. Bütün tekrarlar kaydedilir; son yeşil koşu seçilip önceki kırmızı kayıp sayılmaz.

## 8. Eski plan ve görev grafiğine uygulanacak revizyon

**Bu bölüm yalnız öneridir; aşağıdaki değişiklikler henüz yapılmadı.** Kaynak: [`mevcut görev grafiği`](gorev-grafigi-2026-10-26.json:282).

| Mevcut iş | Onay sonrası işlem |
|---|---|
| A0-2, A0-3, A0-5; A1, A2, A3; T0, S1, S7 | Tarihsel kapanış ve kanıtlar korunur. Mevcut modüller kullanılır; dar PASS daha geniş otonomi kanıtına çevrilmez. |
| A4 gece sürücüsü “HAZIR” | DC/H1 kanıtı önüne yeni bağımlılık konur; DC/S5–S6'ya ayrılır. Sırf eski bağımlılıkları kapandı diye gece modu açılmaz. |
| Eski S3/S4/S5 | İnsan STOP, gözlemci ve deadline kanıtları DC/S3–S4'te güncel tek yola bağlanır; kimlikler silinmez/karıştırılmaz. |
| A0-4 sender | Gerçek sender mevcut mu önce diskten doğrula; varsa yeniden yazma değil yalnız eksik kart/sürücü bağlantısını DC/S6'da say. |
| Eski S2 iki paralel proje | İlk sürümden ertelenir. H1/H2 sonrasında ayrı izolasyon/onay ve ayrı LOC ister. |
| Eski S6 ve EK1-6 pano metrikleri | Yeni ekran açma ertelenir; mevcut salt-okur görünürlük korunur. |
| EK1-1..5 | Regresyon kaydı/sinyal/toparlama/altın set/çift sayım DC/S5–S9'a gerçek eksik bağlarıyla dağıtılır; eski LOC ikinci kez toplam üzerine eklenmez. |
| Eski K1 kilit | Her gerçek kilometre taşında ayrı insan onaylı kilit; eski sürüm ve raporlar silinmez. |

Onaydan sonraki belge sırası:

1. Onay kapsamı ve çekirdek/uyumluluk ADR'si kaydedilir. Bu taslağın hedef değiştirmediği açık yazılır.
2. [`PLAN.md`](PLAN.md:137) faz sırası ve [`kapanış listesi`](PLAN.md:301) onaylı revizyonla güncellenir; tarihsel durum yeni kanıt gibi yazılmaz.
3. Mevcut görev grafiği ve senaryo ikizi DC kimlikleri/bağımlılık geçmişiyle birlikte güncellenir. Bu taslak yeni paralel çalışma SSOT'u olarak işletilmez.
4. Yeni kabul kimlikleri [`kabul.csv`](kabul.csv) içine yalnız **NOT_RUN** olarak girer; koşmadan PASS yok. Eski PASS satırlarını silerek veya paydadan çıkararak oran düzeltilmez.
5. Durum kaydına yalnız onaylanan ilk paket açılır. Hedef belgesinin durum iddiaları ayrıca ancak gerçek kabul kanıtıyla tazelenir; taslak onayı yeteneği “VAR” yapmaz.

## 9. Açık onay kapsamı

**Önerilen karar:** “Yönü kabul et; yalnız DC/F0 + DC/F1'i uygulamaya aç.” Bu kararın uygulama sırasında ayrı tutulacak insan alt kapıları:

- Pilot projenin kapsamı, korunan testler, çalışma ortamı ve sağlayıcı harcama tavanı.
- Çekirdek ADR'si ve pilot kapsamındaki eski eklenti başlatma yolunun kapatılması; kişisel çalışan oturumlara müdahale değil.
- Kontrollü canlı süreç/STOP sınaması, üç teslimin ayrı kabulü ve ilk sürüm/tag.

**Otomatik verilmiş sayılmayacak yetkiler:** Ücretli sınırsız koşum, genel gece modu, yeni faz başlatma, canlı restart, silme/force işlemleri, kök hedef/politika değiştirme, final kabulünü ajan adına verme ve otomatik merge/deploy.

**İlk yatırım kararı (T):** H1 için **3.980 teknik LOC nominal; 5.373 risk paylı planlama zarfı**, doküman ayrıca. Toplam yol haritası **9.980 teknik LOC nominal; 13.473 risk paylı**, ancak sonraki fazlar bugünden uygulamaya açılmaz.

**Önerinin tarihsel sonucu:** Önce çalışan ve insanın kullanarak doğruladığı küçük ürün; sonra güvenilir adımların otomasyonu. “Demir gibi sağlam” ifadesinin karşılığı hatasızlık vaadi değil, **açık invariant + bağımsız kanıt + sınırda dürüst duruş + geri üretilebilir teslim** olmalıdır. Öneri artık ana plana aktarılmıştır; bu dosya yürütülmez. Üretim kodu değiştirilmedi.
