# YÖNETİM ARAYÜZÜ — DALGA-YÖNETİM planı (KAPI K8 · onay bekler)

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
