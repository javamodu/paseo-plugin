# YÖNETİM ARAYÜZÜ — DALGA-YÖNETİM planı (KAPI K8 · ONAYLANDI 2026-10-31 07:20 — kullanıcı seçimi «graf-yüzü önce»; ilk dalga: [K8 DALGA 1](K8-DALGA1-GRAF-YUZU-PLANI-2026-10-31.md))

**Durum:** ÖNERİ — R1 dalgası kapanışı sonrası koşar. **Kaynak:** kullanıcı «chat bölümünde ai ile plan yapabilmeli; dizin, istek, ratelimit her şeyi yönetebilmeliyim; kim manager kim coder hangi görevi alır; rollerin MD dokümanı olarak izlenip editlenmesi; her şey MD + makine-okur ÇİFTE KAYIT; AI ile ya da manuel her şeyi ön yüzden yönetmeliyim — sen İZLEME arayüzü yapmışsın, ben YÖNETİM arayüzü istiyorum» + **kilit nokta** «tüm yönetim ekranın kilit noktası admin ön yüzden görüp edit yapabilmeli — sistem anında makine okur olarak arkada programlamalı görev grafını ve planı» (2026-10-29 14:2x).

## 0. Farkın özü: izleme (read-model) → yönetim (write-model)

Tuval bugüne dek **okur**: graf + durum + defter GÖSTERİR. Yönetim yüzü **yazar**: plan, rol, ayar, onay ön yüzten diske iner. Her eylem **çifte kayıt** — MD (insan okur, repo kültürü: raporlar md+json) + JSON/JSONL (makine okur, append-only). MD-ezmez deseni (A2): belge düzeltilirken ilk hücreler/eski satırlar korunur.

## 0.5. KİLİT NOKTA — admin editler, sistem anında yazar

**Admin (sen) her yönetim ekranını ön yüzde GÖRÜR ve EDİTLEbilirsin** — rol, görev, plan, ayar, onay. **Her edit ANINDA diske iner:** sistem arkada görev grafını ve planı **makine-okur** formatta yazar (JSON/JSONL) + insan-yüzü MD'yi tazeler. UI bir «arka ofis programlayıcı»dır: senin her düzenlemen grafı/planı aynı anda günceller; görünen ile disk ASLA ayrışmaz (SSOT sayı tutarlılığı — E10 dersi). İki mod aynı yüzde: **AI ile** (chat'ten plan üret/düzelt) **veya manuel** (form/editörde elle) — ikisi de aynı yazım ucundan geçer, ikisi de çifte kayıt üretir.

## 1. Bloklar

| Blok | İş | Yazım ucu |
|---|---|---|
| **B1 · AI CHAT (plan)** | hedef cümle → **gerçek AI plan üretir** (core providers hattı) → plan taslağı ön yüzde görünür → sen düzeltirsin/onaylarsın → grafa işlenir. Manuel mod: planı kendin yazarsın (MD editör) | POST /api/ai/plan + POST /api/plan/yaz |
| **B2 · ROL YÖNETİMİ** | **kim manager, kim coder/denetçi; hangi görevi alır** — atama, görevlendirme, rol değişimi; her ajanın rol sayfası MD + durumu JSONL'de izlenir; **ön yüzden EDİT** | POST /api/rol — `plans/roller/<ajan>.md` + `rolller.jsonl` (append) |
| **B3 · AYARLAR** | dizin yolları · istek limitleri · **ratelimit** · tazeleme aralıkları — ön yüzden düzenle | POST /api/ayar — ayar dosyası (**anahtar DEĞERLERİ hiçbir yüzde görünmez/yazılmaz — K-0044** ) |
| **B4 · ONAY YÜZÜ** | [insan] kapıları ön yüzden: **cümleyi SEN yazarsın** → aktör `insan:web` → onay defterine işlenir. (RBT-2 gerekçesi: arayüz senin cümlen + token'ın; ajan üretmez) | POST /api/onay |
| **B5 · KANIT/İZLEME** | mevcut tuval aynen kalır (graf/defter/durum) — yönetim eylemleri deftere düşer | read-model (var) |

## 2. Donmuş sözleşmeler (değişenler — bu yüzden onay kapısı)

1. **server.js'e POST uçları AÇILIR** — DALGA-0'dan beri süren «server.js DEĞİŞMEZ» bu dalga için yeniden tanımlanır: yalnız yeni POST uçları; PANO_TOKEN kimliği + fail-closed + sınırlı write-set (yalnız B1-B4 dosyaları).
2. **Graf SSOT:** onaylı plan → `/api/graf/yaz` (D-3 kapası) — append-only, MD-ezmez.
3. **EK-2 uyarlaması (K-0055 ADR):** onay cümlesi GUI'de KULLANICI tarafından yazılır → aktör **insan:web** (token + cümle + zaman damgası deftere). Ajan/proxy üretemez — koşul aynen.
4. **Güvenlik:** her POST token'lı; anahtar değerleri ekrana log'a yazılmaz; write-set kısıtlı; tüm yazımlar kanıt defterine satır düşer (kim, ne, ne zaman, hangi dosya).

## 3. Süreç + ölçek

Onay → **K-0055 ADR** + yazar fişi → K-0053 hattı (yazar ayrı worktree → merge + anında tam kanal) → kapanış.
Ölçek: **~1.500–2.500 LOC** — 2-3 alt dalgada (B1+B2 · B3+B4 · test sertleştirme); her alt dalga ayrı merge-birimi.

## 4. Karar maddeleri (onayla netleşir)

- **a) AI motoru:** core providers hattı (glm-5.3) — chat penceresi kısa bağlamlı; uzun plan üretimi tek çağrı.
- **b) Rol MD'leri:** `plans/roller/` ajan-başına MD; edit ön yüzden (MD-ezmez: korunan hücreler fişte tanımlı).
- **c) Onay aktörü:** `insan:web` (bu planın 2.3 maddesi — K-0055).

**Onay cümlesi:** «DALGA-YÖNETİM başla»

## 5. KAPSAM GENİŞLEMESİ (2026-10-29 16:1x — kullanıcı emri, 8 madde)

**Kaynak (verbatim):** «sol taraf graf durumunu belirleyen alanı çeşitlendirelim tamamlanma yüzdesi ile · sol ve sağ panel aç kapa ve resize olacak · orta sayfa en önemli kısım — oradan her şeyi edit yapabilmeliyim, taslak olarak kalabilir ya da versiyon olarak; sonra yapay zeka onaylar ve sisteme işlenir · her ajanın manager dizin izin yetki rolleri çalışma şeklini graf içinde yönetebilmeliyim · ajanlara görev bazında ya da proje bazında rol atayabilmeliyim · ajanlara tüm sistem ya da proje ya da graf bazında AGENTS.MD atayabilmeliyim · benim yaptığım her değişiklik sistemde çalışmaya başladıktan sonra versiyon olarak kalır; tüm değişiklikler diff olarak sistemde saklanacak arşivlenecek · yapay zeka manager onaylayacak sistemde kalıcı yapacak.»

| # | Maddе | Kapsam | Nereye |
|---|---|---|---|
| G1 | Sol panel durum alanı çeşitlendirme + **tamamlanma yüzdesi** (faz bazında kapalı/toplam — GRAF SSOT'tan sayılır, E10; uydurma % YASAK, E11) | UI | **R3 mini-dalga** (açılıyor) |
| G2 | **Sol/sağ panel aç-kapa + RESIZE** (sürüklenebilir splitter, min/max genişlik, ≥44px, dokunmatik; tercih kalıcı) | UI | **R3 mini-dalga** (açılıyor) |
| G3 | **Orta = EDİT MERKEZİ (en önemli kısım):** oradan HER ŞEY düzenlenebilir — düzenleme **taslak** ya da **versiyon** olarak kalır → **AI manager onaylar** → **sisteme işlenir** (kalıcı yazma) | write-model | **B1' büyütür — B1-ORTA** |
| G4 | **Ajan kartı graf içinde:** her ajanın manager · dizin · izin · yetki · rolleri · **çalışma şekli** yönetilir | write-model | B2 büyütür |
| G5 | **Rol atama kapsamı:** görev bazlı **ya da proje bazlı** (tek atama değil) | write-model | B2 büyütür |
| G6 | **AGENTS.MD atama:** ajanlara **tüm sistem / proje / graf** kapsamıyla ajan-başına kural dosyası bağlanır | write-model | B2 büyütür (uc: `/api/ajan/kural`) |
| G7 | **Versiyon + diff arşivi:** her değişiklik sistemde çalışmaya başladıktan sonra **versiyon** olarak kalır; tüm değişiklikler **diff** olarak saklanır ve arşivlenir (append-only diff JSONL + insan-yüzü MD görünüm — A2/notify desenleri) | write-model | **YENİ B6 bloğu** |
| G8 | **AI manager onay zinciri:** edit → taslak/versiyon → **AI manager onayı** → kalıcı işleme (kabul/red gerekçeli); [insan] kapıları (replan/canlı/kilit) EK-2 gereği `insan:web` kalır — **katman ayrımı K-0055 ADR'de netleşir** | write-model | B4 büyütür |
| **G9** | **GRAF-YÜZÜ YÖNETİMİ — KALBİN MERKEZİ (kullanıcı: «en önemli kısım bir graf içindeki tüm yönetim nasıl olmalı ve ajanları nasıl seçtik — bu henüz yok — tüm kalbin merkezi»):** DAG düğümleri ÜZERİNDE yönetim — görev düğümü seç → **atanabilir ajanlar listesi** (rol/yetki/bütçe uygunluk filtreli) → ata; düğüm kartından durum · limitler · dizin yönetimi; graf düzenleme (düğüm/bağ/faz ekle-değiştir); hepsi **taslak → AI-manager onayı → kalıcı** zinciriyle (G3/G8'e bağlanır). **K8'in omurgası bu bloktur** — B2 + B1-ORTA kaynaşır | write-model | **B7 bloğu (YENİ)** |
| **G10** | **PROJE SEÇİCİ + «PROJELER» SEKMESİ (kullanıcı: «tasarımda proje sekmesi eksik — genel tüm projelerin olaylar ile proje özel olaylar ve projeye ait görevi olayları karışmış, ayırt edici değildir» 2026-10-31 12:24; tam paket K8-2 onayı):** üst barda aktif proje rozeti + açılır liste (SİSTEM görünümü + projeler, seçim kalıcı); 4. sabit sekme «PROJELER» — filo/proje listesi + proje durum özeti + geçiş; **genel olaylar burada toplanır, görev haritası seçilen projenin kalbi kalır** | UI + kapsam | **K8-2a** ([plan](K8-DALGA2-PLANI-2026-10-31.md)) |
| **G11** | **OLAY KAPSAM ROZETİ + FİLTRE:** defter + onay kuyruğu + run kartlarında her satıra kapsam etiketi `[SİSTEM]` · `[PROJE: x]` · `[GRAF]`; defter başlığında kapsam filtresi; G7 diff arşivinde kapsam alanı zorunlu — **genel olay ≠ proje olayı ≠ görev olayı üç katmanı ayrışır** | UI + veri | **K8-2a** |
| **G12** | **HARD KAPILAR** (kullanıcı 2026-10-31: «llm deterministik değil, rastgele çalışıyor — os level gibi hard coded zorlama kapıları olmalı; dokümanla her şey kontrol edilemiyor»): kritik kısıtlar dokümanda değil **KODDA** zorlanır — token fail-closed · sunucu-sabit aktör · write-set whitelist · append-only · pre-commit kapsam denetimi · **puanı ajan yazamaz**. Envanter: [K8-2 planı §H](K8-DALGA2-PLANI-2026-10-31.md) | mimari | **K8-2 (§H) + sonraki dalgalar** |

**K-0055 ADR'ye ek netleşme (dalga açılışında yazılır):** iki onay katmanı — (a) **yönetim yazıları** (graf/plan/rol/ayar/AGENTS.MD): AI manager onayı kalıcı işler; (b) **[insan] kapıları** (replan onayı · canlı restart · push · kilit/tag): EK-2 aynen — `insan:web` aktörü, cümle KULLANICI'dan. B6 diff arşivi her iki katmanın denetim kaynağıdır.
