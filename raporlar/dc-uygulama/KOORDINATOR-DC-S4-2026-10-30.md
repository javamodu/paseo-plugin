# KOORDİNATÖR KAYDI — DC-S4 serbest bırakma (S4_START)

**Kimlik:** DC-S4 zinciri · ATOM-H1-2026-10-28.2 · **2026-10-30T12:27:01+03:00** (ölçülmüş) · koordinatör: operatör oturumu b400f1e5.

## 1. İnsan başlatma kaydı (F1_START — S4 fişleri serbest)

Kullanıcı emri, birebir: **«Ordu siradi ile tüm görevleri bitirsin»** (2026-10-29 ~23:5x) + **«3 ajanla kalan işleri hızlandır»** (2026-10-30 ~06:40 → [K-0056](../../kararlar/K-0056.md) boru hattı modeli). S0a kaydı [§1](KOORDINATOR-DC-S0a-2026-10-30.md) kapsam hükmü: «her halka kendi ek iznini bu genel talimatın kapsamında yürür; EK-2 istisnası yok». Bu kayıt o hükmün S4 halkasıdır. **Kapı bağları ve ayrıştırma:**

| Kapı | Bu kayıtla bağlanan |
|---|---|
| G0_ACCEPT | S1 halkasında bağlandı (11197e0; kanıt paketi 9601809). **H1 nihai insan kabulü (B5 sınıfı) AYRI ve AÇIK kalır** |
| TECHNICAL_ADR | TASLAK ADR [kararlar/ADR-dc-s0-teknik-oneri-2026-10-28.md, commit 98b6c76] arayüz bağları §4'te. **ADR insan onayı AÇIK kalır — bu kayıt onay üretmez** |
| IMPLEMENTATION_BUDGET | T önerisi fiş başına 8 tur/60 dk/60k token; sağlayıcı harcama izni DEĞİLDİR |
| F1_START | Bu kayıt (S4 fişleri sırayla serbest) |
| LOCAL_TEST_SCOPE | Bu kayıt §7: hedefli testler + (etki incelemesi sonrası) CORE_FULL — **fiş hedefli komutları YEREL bacaklarla kapanır** |
| **PILOT_REPO** | Bu kayıt §7: ayrı pilot kökü İZOLE temp alanında (repo yazma alanı DIŞI); işçi yazma kümesi yalnız pilot kökünde package.json + src/task-cli.mjs; korunan oracle kökü (protectedOracleRoot) İŞÇİ ERİŞİMİNE KAPALI |
| **LIVE_SPEND** | **İNSAN KAPISI — fiş komutlarında DEĞİL.** Fiş hükmü «gerçek sağlayıcı denemesi ayrıca kayıtlı; sadece yerel test gerçek koşum yerine geçmez»: yerel testler EVIDENCE_RECORDED üretir; gerçek sağlayıcı denemesi B5/LIVE_SPEND izin sınıfında AYRICA kayda bağlanır — ajan üretmez, bekleyemez, tahmin edilemez. Fiş kapanışı bu bacağı BEKLEMEZ |
| **ROLLBACK_DEMO** (yalnız S4-04) | **İNSAN KAPISI — fiş komutlarında DEĞİL.** İzole geri dönüş gösterimi ayrı izinli; üretim deposuna reset YOK. S4-04 yerel hata-matrisi bacağıyla kapanır; geri dönüş demo kaydı ayrıca izinle |

**İzin sınıfı: zararsız yerel kod+test** — sağlayıcı çağrısı YOK · canlı YOK · üretim DB YOK · üretim onayı/grant YOK · 4377/4930 dokunulmaz. LIVE_SPEND/ROLLBACK_DEMO bacakları bu izin sınıfının DIŞINDA ve İNSAN KAPISINDADIR (EK-2 istisnası yok — CALISTIRMA §2.8d/§8d).

## 2. Görev kimlikleri ve zincir

DC-S4-01 (Pilot A: ekleme/listeleme/kalıcılık) → 02 (Pilot B: tamamlama/filtre/toplam) → 03 (Pilot C: eski veriyle bakım/düzeltme) → 04 (on hata ailesi + H1 kabul paketi). Fiş ayrıntısı: [S4.md](../../plans/uygulama-paketleri/DC-H1-2026-10-28/S4.md); komutlar [gorevler.json](../../plans/uygulama-paketleri/DC-H1-2026-10-28/gorevler.json)'dan birebir:

| Fiş | Hedefli komut (cwd=core) |
|---|---|
| S4-01 | `node --test --test-reporter=spec test/dc-pilot-a.test.ts` |
| S4-02 | `node --test --test-reporter=spec test/dc-pilot-a.test.ts test/dc-pilot-b.test.ts` |
| S4-03 | `node --test --test-reporter=spec test/dc-pilot-a.test.ts test/dc-pilot-b.test.ts test/dc-pilot-c.test.ts` |
| S4-04 | `node --test --test-reporter=spec test/dc-h1-fault-matrix.test.ts test/dc-pilot-a.test.ts test/dc-pilot-b.test.ts test/dc-pilot-c.test.ts` |

(Komutlar gorevler.json'dan birebir teyit edilecek; fark varsa gorevler.json kazanır ve bu kayıt düzeltilmeden fiş yürütülür — paket revizyonu sınıfı.)

**Önkoşül kanıtı:** DC-S2-04 sonuc.json — EVIDENCE_RECORDED (9/9; dogrula passed; operatör bağımsız koşum 9/9 exit 0), commit **c283612** (S2 zinciri 4/4 fiş diskte). S2 halka kapanış CORE_FULL'u (dc-h1-atomik-core-s2-20261030) paralel sürüyor — K-0056 boru hattı: fiş serbest bırakma CORE_FULL'u BEKLEMEZ (hedefli bacaklar bağımsız).

## 3. HEAD ve kirli dosya sahipliği

HEAD **c283612** (S2 zinciri; yerel — push K7 ayrı emir, bu kayıt push yetkisi VERMEZ). Kirli ~128 yol: dokunulmaz. **S4 yazıcı bunlara dokunmaz.** Fişlerdeki mevcut dosya adayı (core/package.json) **«yalnız release sonrası yazma»** etiketli: **bu zincirde YAZILMAZ**. Pilot işçi dosyaları AYRI PİLOT KÖKÜNDE (repo yazma alanı dışı, §7).

## 4. S0 ADR arayüz bağları

TASLAK ADR'den S4'e inen bağlar: pilot repo mutlak kökü + korunan oracle yerleşimi + insan kara-kutu reçetesi S4-01 tasarım bağı (fiş içinde çözülür, kalıcı yer ADR'de sürümlenir); A'nın ayrı insan teslim kaydı ve B'nin önce dondurulmuş kabul girdileri (S4-02); C bakım isteği + gizli oracle adaydan önce dondurma (S4-03); gerçek giriş yolu hata enjeksiyon kapsamı + izole geri dönüş penceresi onayı (S4-04 — **insan kapısı**: LIVE_SPEND/ROLLBACK_DEMO ayrıştırması §1'de). Write-set bu bağların dışına çıkarsa önce paket revizyonu.

## 5. Kesin dosya listesi (yazma alanı)

| Fiş | Mevcut repo dosyası | Yeni repo dosyası (cwd=core) | Ayrı pilot kökü (izole temp) |
|---|---|---|---|
| DC-S4-01 | YOK | `core/test/dc-pilot-a.test.ts` | `package.json` + `src/task-cli.mjs` (işçi) + protectedOracleRoot: `acceptance-a.test.mjs` (oracle — tester/yazıcı ayrımı fiş hükmüyle) |
| DC-S4-02 | YOK | `core/test/dc-pilot-b.test.ts` | `src/task-cli.mjs` (işçi) + oracle: `acceptance-b.test.mjs` |
| DC-S4-03 | YOK | `core/test/dc-pilot-c.test.ts` | `src/task-cli.mjs` (işçi) + oracle: `acceptance-c.test.mjs` |
| DC-S4-04 | YOK | `core/test/dc-h1-fault-matrix.test.ts` + `core/test/fixtures/dc-h1-faults.mjs` | — |

Kanıt çiftleri: `raporlar/dc-uygulama/DC-S4-XX/{OZET.md,sonuc.json}` (yeni deneme yolları — mevcut kanıt YOK, ezme yok). Üst sınır: **0 mevcut repo dosyası**; pilot kökü İZOLE (repo dışı yazma sayılmaz ama kayıtta raporlanır); korunan oracle köküne işçi erişemez; çekirdek harness dosyaları pilot işçisine verilmez. Yeni repo dosya adaylarının mevcut olmadığı doğrulandı.

## 6. Roller ve tavanlar

- **Yazıcı:** ORDU-1 (128a3edc) — pilot işçi kümesi + core testleri + hedefli komut koşumu; **commit ATMAZ**. 429 dizisi NOTU: ORDU-1 codex 429 penceresinde — görev kuyrukta, pencere açılınca yürür; ORDU-4 süpervizör devri hazır (S2-02 senkron devri emsali).
- **Ayrı tester:** ORDU-2 (6061983f) — fiş başına dogrula + hash + bağımsız koşum; CORE_FULL yeni benzersiz etiketle: **`dc-h1-atomik-core-s4-20261030`** (halka sonunda). 429 dizisi NOTU: ORDU-2 de pencerede — S2 CORE_FULL'u ORDU-4 devriyle yürüyor; S4 doğrulama bacakları ORDU-2 penceresiyle, devir gerekirse ORDU-4.
- **Salt-okur denetçi:** ORDU-3 (d171af6b).
- **Süpervizör:** ORDU-4 (cfda82a0) — 429/hata diriltme + mekanik devirler (kayıtla).
- **Tavan (fiş başına):** 8 tur / 60 dk / 60000 token. ORDU-1 çıktı disiplini: fiş başına ≤15 satır rapor.

## 7. Test ortamı

Hedefli komutlar cwd=core (§2 tablosu). **Ayrı pilot kökü**: izole temp dizini (repo dışı — ör. OS temp altında görev-benzersiz alt dizin); işçi yazma kümesi yalnız orada. **Korunan oracle kökü** (protectedOracleRoot): ayrı izole temp dizini; işçi erişemez; adaydan önce dondurulur; önceki oracle sürümleri değişmez. Sağlayıcı/DB/canlı/ağ YOK (LIVE_SPEND insan kapısı — §1); 4377/4930 dokunulmaz. Yeni testler önce doğru nedenle kırmızı olabilir (CALISTIRMA §5). Pilot verisi kalıcılık senaryoları pilot kökü içinde simüle edilir (insan kullanım kaydı fiş içinde simülasyon — gerçek insan kara-kutu kabulü H1 insan kapısı).

## 8. Duruş koşulları

(a) Tavan → dur + devir; (b) mekanizma/izin eksikse **BLOCKED** (sahte değer YOK); (c) write-set/kapsam büyümesi → paket revizyonu; (d) sağlayıcı harcaması/canlı/insan-kabul sınıfı → **DUR ve rapor** (EK-2 istisnası yok — LIVE_SPEND/ROLLBACK_DEMO/gerçek insan kara-kutu bacakları fiş kapanışı değildir). **S4 sonuçları EVIDENCE_RECORDED sınıfıdır — sprint PASS/ürün kabulü/insan kapısı DEĞİL.** S4-04 N2 hükmü aynen: **H1 kararı veya H2 başlatması ajanca verilmez; otomatik merge/deploy yok.** H1 nihai insan kabulü AÇIK kalır.

## 9. Kaldıraç talimatları (2026-10-30 14:59 — BORU-HATTI-KALDIRAC planından; sonraki TÜM koordinatör kayıtlarına taşınır)

**P4 — ORDU-3 (salt-okur denetçi) brief zorunlu maddesi:** her P-x/N-x denetiminde ASSERT EDİLEN DEĞERİN KAYNAĞI izlenir — gerçek mekanizmanın çıktısı mı (gate.request gibi gerçek çağrı), testin kendi lokal sabiti mi? Test-içi sabit karşı-sabit = tautoloji şüphesi → RED bildir (emsal: S4-04 N2; DERSLER 196). Şema denetimi satır sayar; semantik denetim tester bacağındadır — bu maddenin amacı denetçi bacağını tautoloji-yakalar hale getirmek (derinlik farkı kapanır).

**P5 — fiş raporu ilk satırı:** her fiş kapanış/ara raporunun İLK SATIRI «bağlam ~%XX» olur (ölçülen tahmin değil — ajanın kendi bildirimi; %70+ → yeni büyük fiş ALMA, atomik parçala; %80 → devir töreni; mevcut ÇEKİRDEK kuralının fişlere genellenmesi — emsal: ORDU-1 %94'te kırılgandı).

**P6 — fiş kapanışında usage alanı:** koordinatör kapanış kaydına `usage:{in,out,cached}` yazılır — get_agent_status / oturum kaydından okunur; değer yoksa alan `null` kalır (uydurma YOK). Haftalık telemetriye bağlanır (emsal: S1/S7 oturum usage kayıtları zaten var — boru hattı zincirinde eksikti).
