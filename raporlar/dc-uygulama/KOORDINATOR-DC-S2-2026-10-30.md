# KOORDİNATÖR KAYDI — DC-S2 serbest bırakma (S2_START)

**Kimlik:** DC-S2 zinciri · ATOM-H1-2026-10-28.2 · **2026-10-30T07:50:52+03:00** (ölçülmüş) · koordinatör: operatör oturumu b400f1e5.

## 1. İnsan başlatma kaydı (F1_START — S2 fişleri serbest)

Kullanıcı emri, birebir: **«Ordu siradi ile tüm görevleri bitirsin»** (2026-10-29 ~23:5x) + **«3 ajanla kalan işleri hızlandır»** (2026-10-30 ~06:40 → [K-0056](../../kararlar/K-0056.md) boru hattı modeli). S0a kaydı [§1](KOORDINATOR-DC-S0a-2026-10-30.md) kapsam hükmü: «her halka kendi ek iznini bu genel talimatın kapsamında yürür; EK-2 istisnası yok». Bu kayıt o hükmün S2 halkasıdır. **Kapı bağları:**

| Kapı | Bu kayıtla bağlanan |
|---|---|
| G0_ACCEPT | S1 halkasında bağlandı (11197e0; kanıt paketi 9601809; temel: kullanıcı otomasyon talimatı). **H1 nihai insan kabulü (B5 sınıfı) AYRI ve AÇIK kalır** |
| TECHNICAL_ADR | TASLAK ADR [kararlar/ADR-dc-s0-teknik-oneri-2026-10-28.md, commit 98b6c76] arayüz bağları §4'te. **ADR insan onayı AÇIK kalır — bu kayıt onay üretmez** |
| IMPLEMENTATION_BUDGET | T önerisi fiş başına 8 tur/60 dk/60k token; sağlayıcı harcama izni DEĞİLDİR |
| F1_START | Bu kayıt (S2 fişleri sırayla serbest) |
| LOCAL_TEST_SCOPE | Bu kayıt §7: hedefli testler + (etki incelemesi sonrası) CORE_FULL |

**İzin sınıfı: zararsız yerel kod+test** — sağlayıcı çağrısı YOK · canlı YOK · üretim DB YOK · üretim onayı/grant YOK · üretim sırları YOK (S2-03 ayrılmış TEST imzalayıcısı + fixture anahtarları) · 4377/4930 dokunulmaz.

## 2. Görev kimlikleri ve zincir

DC-S2-01 (yazma kapanışı sonrası güvenilir aday mühürleme) → 02 (korunan gerçek görev testini günlük yola bağla) → 03 (zorunlu imza + run/attempt tam kanıt bağı) → 04 (evaluate/teslim yolunu gerçek kanıta bağla). Fiş ayrıntısı: [S2.md](../../plans/uygulama-paketleri/DC-H1-2026-10-28/S2.md); komutlar [gorevler.json](../../plans/uygulama-paketleri/DC-H1-2026-10-28/gorevler.json)'dan birebir:

| Fiş | Hedefli komut (cwd=core) |
|---|---|
| S2-01 | `node --test --test-reporter=spec test/dc-candidate-seal.test.ts test/supervisor.test.ts` |
| S2-02 | `node --test --test-reporter=spec test/dc-protected-runner.test.ts test/adapter-evaluator.test.ts` |
| S2-03 | `node --test --test-reporter=spec test/dc-receipt-auth.test.ts test/receipt-link.test.ts test/store.test.ts` |
| S2-04 | `node --test --test-reporter=spec test/dc-delivery-chain.test.ts test/cli-capsule.test.ts test/e2e-s11.test.ts` |

**Önkoşül kanıtı:** DC-S3-06 sonuc.json — EVIDENCE_RECORDED (17/17; dogrula passed; operatör bağımsız koşum 17/17 exit 0). K-0056 boru hattı hükmü: kanıt çifti diskte olduğundan sonraki fiş serbest; S3-05/06 bağımsız doğrulaması + CORE_FULL paralel sürüyor (ORDU-2/3).

## 3. HEAD ve kirli dosya sahipliği

HEAD **1384e23** (S3 zinciri tam kapanış; yerel — push K7 ayrı emir, bu kayıt push yetkisi VERMEZ). Kirli ~128 yol: dokunulmaz. **S2 yazıcı bunlara dokunmaz.** Fişlerdeki mevcut dosya adayları (core/src/supervisor.ts · evaluator.ts · cli-evaluate.ts · receipt-link.ts · store.ts · cli.ts · core/package.json) hepsi **«yalnız release sonrası yazma»** etiketli: **bu zincirde YAZILMAZ**.

## 4. S0 ADR arayüz bağları

TASLAK ADR'den S2'ye inen bağlar: S3 yazma kapanışı arayüzü ve izlenmeyen dosya politikası teyidi (S2-01); korunan oracle/runner yerleşimi + test raporunun gerçek sayımı + işçi/test OS sınırı (S2-02); yerel yetkili üretici/anahtar sınırı S0 seçimine bağlı — genel PKI ürünü EKLENMEZ (S2-03); CLI uyumluluk davranışı ve eski dar artefakt işlerinin kapsamı sürümlenir (S2-04). Write-set bu bağların dışına çıkarsa önce paket revizyonu.

## 5. Kesin dosya listesi (yazma alanı)

| Fiş | Mevcut dosya | Yeni dosya |
|---|---|---|
| DC-S2-01 | YOK | `core/src/dc-candidate-seal.ts` + `core/test/dc-candidate-seal.test.ts` + kanıt çifti |
| DC-S2-02 | YOK | `core/src/dc-protected-runner.ts` + `core/test/dc-protected-runner.test.ts` + kanıt çifti |
| DC-S2-03 | YOK | `core/test/dc-receipt-auth.test.ts` + kanıt çifti |
| DC-S2-04 | YOK | `core/test/dc-delivery-chain.test.ts` + kanıt çifti |

Kanıt çiftleri: `raporlar/dc-uygulama/DC-S2-XX/{OZET.md,sonuc.json}` (yeni deneme yolları). Üst sınır: 0 mevcut dosya · kritik yolda TEK yazıcı · yeni dosya adaylarının mevcut olmadığı doğrulandı.

## 6. Roller ve tavanlar

- **Yazıcı:** ORDU-1 (128a3edc) — commit ATMAZ.
- **Ayrı tester:** ORDU-2 (6061983f) — fiş başına dogrula + hash + bağımsız koşum; CORE_FULL yeni benzersiz etiketle: **`dc-h1-atomik-core-s2-20261030`**.
- **Salt-okur denetçi:** ORDU-3 (d171af6b).
- **Süpervizör:** ORDU-4 (cfda82a0) — 429/hata diriltme.
- **Tavan (fiş başına):** 8 tur / 60 dk / 60000 token. ORDU-1 çıktı disiplini: fiş başına ≤15 satır rapor.
- **K-0056 boru hattı:** fiş bitince kanıt çifti diske → sonraki fiş (doğrulama beklemeden); ORDU-2/3 paralel; ara commit'ler operatörde.

## 7. Test ortamı

Hedefli komutlar cwd=core (§2 tablosu). Yalnız temp alan (temp aday/fixture · korunan runner · ayrılmış test imzalayıcısı + fixture anahtarları — üretim sırları YOK); sağlayıcı/DB/canlı/ağ YOK; 4377/4930 dokunulmaz. Yeni testler önce doğru nedenle kırmızı olabilir (CALISTIRMA §5); mevcut testler zincirden ÇIKARILMAZ.

## 8. Duruş koşulları

(a) Tavan → dur + devir; (b) mekanizma/izin eksikse **BLOCKED** (sahte değer YOK); (c) write-set/kapsam büyümesi → paket revizyonu; (d) sağlayıcı harcaması/canlı/insan-kabul → **DUR ve rapor** (EK-2 istisnası yok). **S2 sonuçları EVIDENCE_RECORDED sınıfıdır — sprint PASS/ürün kabulü/insan kapısı DEĞİL.** H1 nihai insan kabulü AÇIK kalır.
