# TEKLİF-BİRLEŞİK — DALGA-0-2 GERÇEK ARAYÜZ İNŞASI (ONAY BEKLER)

**Tarih:** 2026-10-29 13:45 · **Durum:** ÖNERİ — DALGA-0-2 SÜRÜŞTE (koder oturumu, fiş **4fb5042**; yazar ayrı worktree'de ÇALIŞIYOR). Bu teklif onaylanırsa koder oturumuna **İLETİLİR** (zaman-hassas: yazara merge'den ÖNCE ulaşmalı). **Teşhis:** fişin BRIEF.md'si R1-ÖNCESİ referansla yazılmış — §1'de «İZLE/DENETLE/YÖNET nav» + «İZLE sekmesinde DAG» şart koşuyor = kullanıcının R1'de reddettiği yapı. · **Kaynaklar:** 6-subagent mockup çalışması (385d921) + denetçi/gözlemci bulguları + R1 revizyonu (aa3da88) + fiş 4fb5042'nin kendisinin okunması · **Alıcı:** koder oturumu (yazara ek-şart iletecek) · **Referans tasarım:** [mockup-final.html](mockup-final.html) **GÜNCEL hali** (1254 satır, tablist=0) + [GEREKSİNİM MATRİSİ](GEREKSINIM-MATRISI.md) (§3-§5, R1 bağlayıcı)

## 1. EKSİK/SONU ENVANTERİ (tam liste — tek yerde)

### A. Mevcut gerçek tuval (pano/kapsul-tuval.html) eksikleri

| # | Eksik/Sorun | Kanıt |
|---|---|---|
| E1 | Görsel kimlik eski — DALGA-0 cerrahi kapsamda temayı korudu; kullanıcı beğenmedi | kullanıcı: «arayüz istediğim gibi değil» |
| E2 | **KALP yüzü YOK:** ordu şeridi · run kartları · onay kuyruğu · kanıt defteri · komut kutusu — hiçbiri yok | kaynak taraması; mevcut mockup analizi (17/28) |
| E3 | Graf okunabilirliği zayıf: düğüm etiketleri yok, zoom/pan yok, düğümler küçük/yoğun | kullanıcı seçimi «grafı okunur yap» |
| E4 | Drawer yok — sol sütun sabit, mobilde alan yiyor | kullanıcı: «sol drawer menü hem mobile hem desktop» |
| E5 | GENEL STATE şeridi yok (toplam/aktif/durum dağılımı/onay/x=0/HEAD tek bakışta) | kullanıcı: «genel state ayrıca belirtilmeli» |
| E6 | 4 durum boyutu eksik: durum noktası VAR; aktif-vurgu + ayrı onay-bekleyenler bölümü + genel state YOK | kullanıcı beyanı (4 boyut) |

### B. Mockup turunda yakalanan onarım dersleri (gerçek koda ADIYLA geçer)

| # | Ders |
|---|---|
| E7 | Ölü buton YASAK — her buton tıklanınca ne yapacağını söyler (mockupta 6 ölü buton yakalandı) |
| E8 | 44px tutarlılığı — bağımlılık/kopyala çipleri dahil (2 ihlal yakalandı) |
| E9 | JS'in beklediği her id/class CSS+HTML'de birebir var (sınıf uyumsuzluğu yakalandı) |
| E10 | Sayılar SSOT'tan sayılır — gösterilen alt kümeyle çelişki yasak («aktif 1» vs gerçek 16 yakalandı) |
| E11 | Uydurma veri YASAK — gerçek yoksa «atanmadı / kanıt yok» dürüstlüğü (sahte run ID'si yakalandı) |
| E12 | Animasyon yalnız transform/opacity kümesi (mevcut V0 mockupta max-height/margin ihlali yakalandı) |

### C. Bağlayıcı tasarım kararları (kullanıcı + R1)

| # | Karar |
|---|---|
| K1 | İZLE/DENETLE/YÖNET **sekme/mod BUTONU YOK** — TEK AKIŞ (kullanıcı: «daha user dostu») |
| K2 | Denetim kanıtı görev KAPSÜL KARTININ içinde inline (kanal x=0 · ölçüm çifti · tip) |
| K3 | Yönetim eylemleri bağlamda: görev kartında fiş/dispatch-şablonu **kopyala**; onay kartında onay cümlesi **kopyala** — GUI'de onay cümlesi ÜRETİLMEZ/çalıştırılmaz (EK-2 dokunulmaz) |
| K4 | Drawer: masaüstü ≥1024 sabit + toggle; 640-1023 + mobil overlay (hamburger/perde/Esc/scroll-kilidi/aria-expanded) |
| K5 | Korunur set: kirmiziYuz fail-closed · İNSAN/MAKİNE OKUR (modUygula aynı fetch) · sec(id) senkronu · 30 sn tazeleme · SVG DAG döngüde-çizilmez · «(faz yok)» dalı (uydurma faz YOK) |

### D. Yapısal kısıtlar / karar gerektirenler

| # | Konu | Durum |
|---|---|---|
| E13 | **server.js donmuş sözleşme:** ordu/kalp yüzü CANLI veri ister (ajan durumu, defter, ölçüm) — `pano/server.js`'te yeni **salt-okur** uç gerekir (ör. GET /api/ordu — core defter/ölçüm dosyalarından okur) | **ONAY SORUSU 1** (§3) |
| E14 | Graf SSOT `faz` alanı 24/40 görevde yok — veri tamamlama graf sahibinin AYRI işi, bu dalgada YOK | kısıt |
| E15 | Tek-dosya geleneği: kapsul-tuval.html HTML+CSS+JS inline kalır; mockup'taki ÖRNEK-sahte bloklar çıkar → gerçek işlevsel boyut ~600-1000 satır beklenir | tasarım kararı |
| E16 | DAG katlanmış/gizliyken rect=0 tuzağı — açılışta ölçüm-düzeltme deseni (mockupta çözüldü, taşınır) | teknik ders |
| E17 | Paralel oturum eşgüdümü: DALGA-0-2 başka terminalde 13:11'de AÇILMIŞ durumda (KAPI-HARITASI SSOT + kendi brief'i) — çift-yazar çakışma riski | **ONAY SORUSU 2** (§4) |

## 2. TEKLİF — CODER AJAN BRIEF'İ (EK-3 4 öge; onaylanınca fişe dönüşür)

1. **HEDEF:** `pano/kapsul-tuval.html` mockup-final tasarım diliyle (koyu #070b14 + camgöbeği/menevşe, cam barlar, 48px grid dokusu, 4px boşluk ölçeği, durum renk tokenları) ve **R1 tek-akış** yapısıyla yeniden inşa: ÜST GENEL STATE + ordu şeridi (hep görünür) → SOL DRAWER (görev grafı ağacı — faz gruplu; masaüstü sabit/toggle, mobil overlay) → KAPSÜL KARTI (denetim kanıtı inline) → «Görev haritası» katlanır DAG (etiketli düğümler + tekerlek-zoom + sürükle-pan + düğüme tıkla=sec) → run kartları → onay bekleyenler → kanıt defteri → alt komut kutusu (öneri+kopyala). Veri: GERÇEK (/api/graf 40 görev; E13 onayına göre /api/ordu).
2. **ÇIKTI:** (a) kapsul-tuval.html düzenlenmiş; (b) kapsul-tuval.test.mjs GENİŞLETİLMİŞ — mevcut 8 vaka KIRILMAZ + yeni fail-closed vakalar: drawer var+aria · tablist=0 (sekme yasak) · 4 durum boyutu · 44px · DAG etiket+zoom kaynakta · K5 korunur seti · (E13-A ise) /api/ordu ucu; (c) YAZAR-RAPORU.md (LOC, dürüst notlar). **LOC hedefi:** ~600-1000 (T tahmini).
3. **ARAÇ/KAYNAK:** mockup-final.html (tasarım referansı) · GEREKSİNİM MATRİSİ §3-§5 · mevcut kapsul-tuval.html (K5 setini çıkarmak için) · pano/server.js SALT-OKUR anlama · plans/gorev-grafigi-2026-10-26.json (gerçek ID/faz/bağımlılık).
4. **SINIR:** server.js + graf SSOT + core/ + scripts/ **E13-A onayı dışında** dokunulmaz · yeni npm bağımlılığı YOK · K-0053 hattı: yazar AYRI worktree/branch → merge --no-ff → **merge anında tam kanal 467/467 x=0** + tip kapısı + hedefli test + kapanış V9-04 ölçüm çifti (taban: son-kanit 206 sn) · E7-E12 dersleri test vakalarına dönüştürülür.

## 3. D-2 ORDU VERİSİ (E13) — sürüşteki dalga B'yi seçti (kabul)

- **B (SÜRÜŞTEKİ DALGADA UYGULANIYOR — KABUL):** kalp-yüzü bu dalgada ÖRNEK-etiketli kalır (görünür sarı etiket; sahte-etiketsiz veri YOK); canlı bağ D-2 dalgasında. Uygun: wave zaten açık, yarı-yolda tercih değiştirmek dalga maliyeti ekler.
- **A (TAVSİYE — D-2 DALGASINA TAŞINDI):** minimal **GET /api/ordu** ucu server.js'e (~30-60 satır; defter/ölçüm dosyalarından salt-okur). ANAYASA H2 (KALP > ÇERÇEVE): manager döngüsü görünürlüğü asıl başarı ölçütü — D-2 dalgasının İLK kalemi olsun (fişte açıkça yazılır, testle sabitlenir).

## 4. ONAY SORUSU 2 — sürüşteki DALGA-0-2 (E17) → çözüm: EK-ŞART

Fiş **4fb5042**'nin BRIEF.md'si komutan tarafından diskten OKUNDU. Teşhis:

- **İYİ (olduğu gibi kalsın):** drawer tanımı (§1 masaüstü sabit/toggle + mobil overlay/Esc) · ÖRNEK-etiket sistemi + veri kaynak matrisi (graf-yüzü GERÇEK `/api/graf`, kalp-yüzü ÖRNEK — canlı bağ D-2'de) · EK-2 (onay cümlesi GUI'de üretilmez) · 44px/reduced-motion/animasyon kümesi · DALGA-0 mirası korunur seti (kirmiziYuz/modUygula/sec/30sn) · yazar akışı + test disiplini.
- **R1 ÇATIŞMASI (düzeltilecek):** §1 «drawer içinde İZLE/DENETLE/YÖNET nav» + «İZLE sekmesinde DAG» + §6 test listesinde «İZLE/DENETLE/YÖNET» varlığı aranıyor. Bu, kullanıcının R1'de **reddettiği** sekme/mod yapısıdır; ayrıca §4 tasarım SSOT referansı «mockup-final 1245 satır» = R1-öncesi sürüm (güncel: 1254, tablist=0).
- **ÇÖZÜM:** yazara (worktree'de, merge'den önce) ek-şart: nav/sekmeler KALDIR → TEK AKIŞ; drawer = yalnız görev ağacı; DAG katlanır «Görev haritası» bölümü; denetim kanıtı kapsül kartında inline; test vakası «İZLE/DENETLE/YÖNET varlığı» → «tablist=0 + tek-akış varlığı» olarak düzeltilir. Kalp-yüzü ÖRNEK (B tercihi) KABUL — canlı bağ D-2 dalgasında (§3-A tavsiyesi oraya taşınır).

## 5. KODER OTURUMUNA İLETİLECEK HAZIR METİN (onay verirseniz kopyala-yapıştır)

> R1 EK-ŞART (yazara merge'den ÖNCE ilet — kaynak: raporlar/arayuz-mockup-6sub-2026-10-29/TEKLIF-BIRLESIK-DALGA0-2.md):
> 1. Kullanıcı İZLE/DENETLE/YÖNET nav/sekmelerini REDDETTİ («izle denetle yönet diye ayrı ayrı buton… daha user dostu» — R1, commit aa3da88). Brief'in §1'indeki «drawer içinde İZLE/DENETLE/YÖNET nav» ve «İZLE sekmesinde DAG» maddeleri İPTAL: drawer'da nav YOK (yalnız faz-gruplu görev ağacı + «görev haritası» bağlantısı); DAG katlanır «Görev haritası» BÖLÜMÜ olarak tek akışta; denetim kanıtı (kanal x=0 · ölçüm çifti · tip) kapsül detay kartının İÇİNDE inline; yönetim butonları bağlamda (görev kartında fiş/dispatch kopyala; onay kartında kopyala).
> 2. Tasarım SSOT: mockup-final.html'nin GÜNCEL hali (1254 satır — R1 sonrası, tablist=0) + GEREKSINIM-MATRISI.md §3.5 (bağlayıcı: «ayrı sekme/mod BUTONU YASAK»). Brief'teki «1245 satır» referansı R1-öncesi — güncel olanı kullan.
> 3. §6 test listesindeki «İZLE/DENETLE/YÖNET varlığı» vaka(ları) şöyle DÜZENLENİR: tablist=0 · role="tab"=0 · aria-selected=0 (kaynak tarama — tek akış) + drawer/44px/ÖRNEK-etiket vakaları aynen korunur.
> 4. Bunun dışındaki brief maddeleri (veri matrisi B, ÖRNEK etiketleri, EK-2, korunur seti, yazar akışı) AYNEN GEÇERLİ.

## 6. ONAY

Kullanıcı cümlesi: **«Birleşik teklifi onaylıyorum — koder oturumuna ilet»** (üstteki hazır metin koder terminaline yapıştırılır; koder oturumu yazara ek-şartı worktree'de iletir). Ek-şart merge'den SONRA ulaşırsa: kapanış sonrası R1 düzeltme mini-dalgası (aynı yazar hattı) gerekir — maliyet +1 dalga. Onay verilmezse: bu kayıt tarihsel öneri olarak kalır; sürüşteki dalga kendi brief'iyle kapanır (sekmeli/navlu yapı kullanıcı onayına sunulmuş olur).
