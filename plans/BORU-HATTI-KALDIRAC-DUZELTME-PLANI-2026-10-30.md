# BORU HATTI KALDIRAÇ DÜZELTME PLANI — az LOC / yüksek kaldıraç (TASLAK · onay bekler)

**Kimlik:** boru-hatti-kaldirac-2026-10-30 · 2026-10-30T15:0x+03:00 · kaynak: [performans denetimi](../raporlar/boru-hatti-performans-2026-10-30/OZET.md) (8 eksik) + puan kartı (7/10) · ilke: her madde ≤25 satır kod veya 0 kod (talimat/prompt) — mevcut hükümler (K-0056/K-0057/EK-2) DEĞİŞMEZ.

## Eksik dökümü (tam liste — 8 + 3)

| # | Eksik | Sınıf | Madde |
|---|---|---|---|
| 1 | Askıda tur tespiti insana bağlı (ORDU-1 12:56 donuk, 13:14'te insan yakaladı) | süreklilik | P3 |
| 2 | Hash düşürme 2. kez (S2-02 63 hane · S4-02 62 hane — İKİSİ DE OZET.md transkripsiyonunda; dogrula satır 173/186 zaten 64-hane regex'i var ama yalnız sonuc.json alanlarını denetler, OZET İÇİNDEKİ metni değil) | kayıt kalitesi | P1 |
| 3 | Denetçi/tester derinlik farkı (tautolojiyi ORDU-3 kaçırdı, ORDU-2 yakaladı) | doğrulama | P2+P4 |
| 4 | ORDU-1 bağlam %94 (devir promptu hazır, kullanılmadı) | bağlam bütçesi | P5 |
| 5 | İzin kapısı sürtünmesi (CodexMcpElicitation 6+ kez, ~30-60 sn her biri) | süreç | P8 [insan] |
| 6 | ORDU-2 429→closed (tester rolü zincir sonunda boşta) | süreklilik | P7 |
| 7 | Operatör tekeli (commit/izin/görevlendirme darboğazı — bilinçli K-0056 tasarımı) | süreç | dokunulmaz |
| 8 | Token harcaması ölçülmedi | ölçme | P6 |
| 9 | Yazıcı ders almıyor (aynı hata sınıfı tekrarı) | öğrenme | P1+P2 |
| 10 | Paralel yazıcı yok (V8-05 önkoşul tamam, uygulanmadı) | ölçek | P9 [ayrı dalga] |
| 11 | f3-crash yük-duyarlı flake (2 koşumda x=1→x=0; bilinen sınıf) | çevresel | dokunulmaz (kayıt disiplini yeter) |

## Uygulama maddeleri (sırayla; madde başına kanıt)

### P1 — dogrula.mjs OZET-içi düşük-uzunluk hash freni [KOD · ~12 satır]

- **Ne:** `validateResult` içinde `OZET.md` artifact'i okunur; metinde `\b[0-9a-f]{40,63}\b` eşleşmesi (sha256'dan kısa, sha1'den uzun hex = düşmüş hash) → `ozet-truncated-hash:<dosya>` RED. 64 hane tam ve 7-8 hane commit önekleri etkilenmez.
- **Nerede:** `plans/uygulama-paketleri/DC-H1-2026-10-28/dogrula.mjs` (plans/ → core yazma yasağı DIŞINDA).
- **Kanıt:** (a) hedefli: geçici dizinde düşük-hane hash taşıyan OZET'lu sonuc.json → RED teyidi; (b) regresyon: DC-S4-01..04 + S2 fişlerinin mevcut sonuc.json'ları → passed aynen.
- **Kaldıraç:** 2 kez yaşanan sınıf → insan dikkatine değil mühendisliğe bağlanır.

### P2 — DERSLER +2 ders [0 kod]

- (a) «Kanıt transkripsiyonu elle düşürür: OZET.md'ye hash yazarken sha256sum çıktısından kopyala-yapıştır; 2 kez yaşandı (S2-02 63 hane · S4-02 62 hane); otomatik fren dogrula OZET-taraması (P1).»
- (b) «Tautoloji sınıfı: test kendi lokal objesine sabit yazıp aynı sabiti assert ederse mekanizma sınanmamış olur (S4-04 N2). Her N-x/P-x denetiminde assert edilen DEĞERİN KAYNAĞI izlenir: gerçek mekanizma mı, testin kendi sabiti mi. Şema denetimi satır sayar; semantik denetim tester bacağındadır.»
- **Kanıt:** satır append (DERSLER append-only; ~194 → ~196).

### P3 — nöbet dürtmesi (heartbeat) güncellemesi [0 kod · prompt]

- **Ne:** K-0057 nöbet heartbeat'i yeniden yaratılır; prompt: «ajan durumlarını tara + `get_agent_activity` ile son aktivite yaşı >15 dk VE statü running → donuk-şüphesi bildir (2 satır EK-2); hâlâ aynı konuda 2. ardışık dürtmede dur.» Mevcut prompt yalnız statü tarıyordu — SÜRE sinyali yoktu; ORDU-1 12:56-13:14 arası 18 dk fark edilmedi.
- **Kanıt:** create_heartbeat dönüş kaydı + bir dürtme nöbet raporu örneği.
- **Kapsam:** K-0057 karar kaydı DEĞİŞMEZ (uygulama yüzü keskinleşir).

### P4 — ORDU-3 denetçi brief'ine tautoloji maddesi [0 kod · prompt]

- **Ne:** bir sonraki ORDU-3 yaratımında/iletiminde brief'e: «assert edilen değerlerin kaynağını izle — test içinde tanımlı lokal sabite assert = tautoloji şüphesi, RED bildir.»
- **Kanıt:** brief metni koordinatör kaydına eklenir.

### P5 — fiş raporuna bağlam yüzdesi [0 kod · talimat]

- **Ne:** koordinatör fiş rapor formatının İLK SATIRI: «bağlam ~%XX» (durum raporu kuralının fişlere genellenmesi). %70+ → yazıcı yeni büyük fiş ALMAZ, atomik parçalar; %80 → devir töreni (mevcut ÇEKİRDEK kuralı — uygulanmayan pencere buydu).
- **Kanıt:** bir sonraki fiş raporunda ilk satır kontrolü.

### P6 — kanal/koordinatör kaydına usage alanı [0-10 kod]

- **Ne:** fiş kapanışlarında `get_agent_status` usage (in/out/cached) koordinatör kaydına yazılır; haftalık telemetriye bağlanır. Şema alanı: `usage:{in,out,cached}` (varsa).
- **Kanıt:** bir fiş kapanışında dolu alan.

### P7 — ORDU-2 (tester) yeniden yaratma prosedürü [0 kod · hazır talimat]

- **Ne:** create_agent talimatı hazır: rol AYRI TESTER (derin semantik tarama — P4 maddesi brief'te), K-0056 yasakları aynen, sağlayıcı sağlamlığı için codex/glm-5.3 (429'a dayanıklı alternatif: glm53u ucu değerlendirilir). **Emir operatörde** — tester gerektiren ilk zincirde yaratılır.
- **Kanıt:** yaratıldığında get_agent_status kaydı.

### P8 — izin kapısı allowlist [İNSAN KARARI · K kaydı gerekir]

- **Ne:** tekrar eden salt-okur sınıf (tool-results log tail, dosya okuma, dogrula koşumu) izin kuralı tanımıyla kanalize; yazma/commit/canlı sınıfı aynen sorulu kalır. Sürtünme 6+ × ~30-60 sn → ~0.
- **Durum:** ÖNERİ — izin politikası değişikliği insan kararıdır (K-0057 EK-2 sınırına dokunmaz; yeni K kaydı).

### P9 — V8-05 paralel yazıcı [AYRI DALGA · bu planda REFERANS]

- 2-3 paralel yazıcı + yazma-kümesi ayrımı; LOC yüksek (~yeni düzen) — «az loc» ilkesi dışı; önkoşulu tamam, uygulama ayrı emir.

## Uygulama sırası ve sahiplik

1. **P1** operatör yazar (kod + 2 kanıt koşumu) — ~25 dk
2. **P2** operatör yazar (2 satır) — ~5 dk
3. **P3** operatör heartbeat'i yeniden yaratır — ~5 dk
4. **P4+P5+P6** talimat metinleri koordinatör kaydına — ~10 dk
5. **P7** tester gerektiren ilk zincirde — askıda
6. **P8+P9** insan kuyruğu

**Kapanış ölçütü:** P1-P6 kanıtlı + damga + commit (P8/P9 kuyrukta kalır).

## Dürüst notlar

- P1 dışında kod YOK — bu bilinçli: 8 eksikten 5'i süreç/prompt sınıfı, kod freni yalnız tekrar eden kayıt hatasına değer.
- f3-crash flake'i (x=1 sınıfı) bu planda düzeltilMEZ: çevresel, 2-koşum dürüst kayıt disiplini zaten çalışıyor.
- Bu plan TASLAK — uygulanmaya başlama onayı kullanıcıda.
