# KOORDİNATÖR KAYDI — DC-S3 serbest bırakma (S3_START)

**Kimlik:** DC-S3 zinciri · ATOM-H1-2026-10-28.2 · **2026-10-30T06:35:24+03:00** (ölçülmüş) · koordinatör: operatör oturumu b400f1e5.

## 1. İnsan başlatma kaydı (F1_START — S3 fişleri serbest)

Kullanıcı emri, birebir: **«Ordu siradi ile tüm görevleri bitirsin»** (2026-10-29 ~23:5x, bu oturum zinciri). S0a kaydı [§1](KOORDINATOR-DC-S0a-2026-10-30.md) kapsam hükmü: «her halka kendi ek iznini (S0b zararsız sınama, S1 G0+ADR+bütçe+F1, S4 pilot izinleri) bu genel talimatın kapsamında yürür; EK-2 istisnası yok». Bu kayıt o hükmün S3 halkasıdır. **Kapı bağları:**

| Kapı | Bu kayıtla bağlanan |
|---|---|
| G0_ACCEPT | S1 halkasında bağlandı (koordinatör kayıt 11197e0; G0 kanıt paketi S0b-03, commit 9601809; temel: kullanıcı otomasyon talimatı). **H1 nihai insan kabulü (B5 sınıfı) AYRI ve AÇIK kalır** — bu kayıt onu vermez |
| TECHNICAL_ADR | TASLAK ADR [kararlar/ADR-dc-s0-teknik-oneri-2026-10-28.md, commit 98b6c76] arayüz bağları §4'te fiş write-set'ine bağlanır. **ADR insan onayı AÇIK kalır — bu kayıt onay üretmez** (CALISTIRMA §2.2) |
| IMPLEMENTATION_BUDGET | T önerisi fiş başına 8 tur/60 dk/60k token — kullanıcı otomasyon talimatıyla yürütülür; sağlayıcı harcama izni DEĞİLDİR |
| F1_START | Bu kayıt (S3 fişleri sırayla serbest — S1 F1 bağlantısının devamı, aynı faz-1 uygulama fişleri akışı) |
| LOCAL_TEST_SCOPE | Bu kayıt §7: hedefli testler + (etki incelemesi sonrası) CORE_FULL |

**İzin sınıfı: zararsız yerel kod+test** — yeni modüller cwd=core'da üretilir, hedefli komutlarla koşulur; sağlayıcı çağrısı YOK · canlı YOK · üretim DB YOK · üretim onayı/grant YOK · 4377/4930 dokunulmaz.

## 2. Görev kimlikleri ve zincir

DC-S3-01 (kalıcı süreç ağacı + sahiplik kimliği) → 02 (normal bitiş/çökme/aday ayrımı + uzlaştırma) → 03 (iptal teyidi attempt/nesil/istek bağı) → 04 (gerçek kullanım + idempotent mutabakat) → 05 (kuyrukta dış etki öncesi yetki sınaması) → 06 (STOP/probe altında bakım + restart mandalı). Fiş ayrıntısı: [S3.md](../../plans/uygulama-paketleri/DC-H1-2026-10-28/S3.md); komutlar [gorevler.json](../../plans/uygulama-paketleri/DC-H1-2026-10-28/gorevler.json)'dan birebir:

| Fiş | Hedefli komut (cwd=core) |
|---|---|
| S3-01 | `node --test --test-reporter=spec test/dc-process-identity.test.ts test/a0-5-lrt.test.ts` |
| S3-02 | `node --test --test-reporter=spec test/dc-completion-reconcile.test.ts test/closure.test.ts test/a0-2-sweep.test.ts` |
| S3-03 | `node --test --test-reporter=spec test/dc-cancel-generation.test.ts test/k13-gozetimsiz.test.ts test/local-runtime.test.ts` |
| S3-04 | `node --test --test-reporter=spec test/dc-usage-reconcile.test.ts test/store.test.ts test/metrics.test.ts` |
| S3-05 | `node --test --test-reporter=spec test/dc-before-effect.test.ts test/dispatcher.test.ts test/k12-deadline-r8.test.ts test/r3-grant.test.ts` |
| S3-06 | `node --test --test-reporter=spec test/dc-stop-maintenance.test.ts test/daemon.test.ts test/closure.test.ts` |

**Önkoşül kanıtı:** DC-S1-05 sonuc.json — EVIDENCE_RECORDED (32/32; dogrula passed), commit **63568dd** (S1 zinciri tam kapanış; ORDU-2/3 doğruladı, PLUGIN_FULL 446 ok + typecheck 0, CORE_FULL 467/467 x=0).

## 3. HEAD ve kirli dosya sahipliği

HEAD **63568dd** (yerel; push K7 ayrı emir — bu kayıt push yetkisi VERMEZ). Kirli ~128 yol: dokunulmaz sınıf. **S3 yazıcı bunlara dokunmaz.** Fişlerdeki mevcut dosya adayları (core/src/local-runtime.ts · dispatcher.ts · supervisor.ts · gozetimsiz.ts · store.ts · cli.ts · daemon.ts · core/package.json) hepsi **«yalnız release sonrası yazma»** etiketli: **bu zincirde YAZILMAZ** — mevcut kod dosyasına sıfır dokunuş; yalnız yeni modüller + yeni testler.

## 4. S0 ADR arayüz bağları

TASLAK ADR'den S3'e inen bağlar: Windows kimlik/ağaç mekanizması + kalıcı kayıt sürümü seçimi dondurulur (S3-01; kimlik nesneye değil kayda bağlı — S1-03 dersinin süreç ağacı izdüşümü); normal bitiş/yazma kapanışı ve aday-ready arayüzü S2 için teyit (S3-02); iptal isteği/nesil bağının kalıcı yeri ve yazıcı/tüketicileri (S3-03 — ek dosya gerekirse görev böl, paket revizyonu); kullanım kaynağın gerçek sağlayıcı bağı ayrıca LIVE_SPEND ile doğrulanır — fixture gerçek maliyet kanıtı değildir (S3-04); kontrol-etki atomikliği/niyet ve yarış telafisi ADR ile bağlanır (S3-05); bakım döngüsü yetkisi üretim spawn yetkisinden ayrı teyit (S3-06). Write-set bu bağların dışına çıkarsa önce paket revizyonu.

## 5. Kesin dosya listesi (yazma alanı)

| Fiş | Mevcut dosya | Yeni dosya |
|---|---|---|
| DC-S3-01 | YOK | `core/src/dc-process-identity.ts` + `core/test/dc-process-identity.test.ts` + kanıt çifti |
| DC-S3-02 | YOK | `core/test/dc-completion-reconcile.test.ts` + kanıt çifti |
| DC-S3-03 | YOK | `core/test/dc-cancel-generation.test.ts` + kanıt çifti |
| DC-S3-04 | YOK | `core/src/dc-usage-reconcile.ts` + `core/test/dc-usage-reconcile.test.ts` + kanıt çifti |
| DC-S3-05 | YOK | `core/test/dc-before-effect.test.ts` + kanıt çifti |
| DC-S3-06 | YOK | `core/test/dc-stop-maintenance.test.ts` + kanıt çifti |

Kanıt çiftleri: `raporlar/dc-uygulama/DC-S3-XX/{OZET.md,sonuc.json}` (yeni deneme yolları — mevcut kanıt YOK, ezme yok). Üst sınır: 0 mevcut dosya · kritik yolda TEK yazıcı · yeni dosya adaylarının mevcut olmadığı doğrulandı.

## 6. Roller ve tavanlar

- **Yazıcı:** ORDU-1 (128a3edc) — yeni modül/test üretir + hedefli komutu koşar; **commit ATMAZ**.
- **Ayrı tester:** ORDU-2 (6061983f) — fiş başına dogrula + kaynak/artefakt hash + bağımsız koşum. **CORE_FULL** (workerMayRun:false): etki incelemesi ÖNCE; koşum yeni benzersiz etiketle: **`dc-h1-atomik-core-s3-20261030`**. PLUGIN_FULL gerekmez (S3 plugin'e dokunmaz — yalnız S3 zincirinde plugin değişikliği çıkarsa).
- **Salt-okur denetçi:** ORDU-3 (d171af6b) — şema/şeffaflık/P-N gerçeklik.
- **Süpervizör:** ORDU-4 (cfda82a0) — 429/hata diriltme.
- **Tavan (fiş başına):** 8 tur / 60 dk / 60000 token. Tavan → dur + devir kartı. ORDU-1 çıktı disiplini: fiş başına ≤15 satır rapor (max_output_tokens dersi).

## 7. Test ortamı

Hedefli komutlar cwd=core (§2 tablosunda; gorevler.json birebir). Yalnız temp alan (temp defter/registry · fake adaptör · kaydı tutulan zararsız çocuk süreçler · enjekte saat); sağlayıcı/DB/canlı/ağ YOK; çalışan süreçlere (4377/4930) dokunma YOK. Yeni testler önce doğru nedenle kırmızı olabilir (CALISTIRMA §5); kırmızı tekrarlar kaybolmaz. Mevcut testler zincirden ÇIKARILMAZ (komutlar mevcut testlerle BİRLİKTE koşar — fiş reçeteleri böyle).

## 8. Duruş koşulları

(a) Tavan → dur + devir; (b) mekanizma/izin eksikse **BLOCKED** (sahte değer YOK); (c) write-set/kapsam büyümesi → fişi genişletme, paket revizyonu iste; (d) sağlayıcı harcaması/canlı/insan-kabul sınıfı → **DUR ve rapor** (EK-2 istisnası yok). **S3 sonuçları EVIDENCE_RECORDED sınıfıdır — sprint PASS/ürün kabulü/insan kapısı DEĞİL.** H1 nihai insan kabulü AÇIK kalır.
