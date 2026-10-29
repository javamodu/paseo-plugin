# KOORDİNATÖR KAYDI — DC-S1 serbest bırakma (S1_START)

**Kimlik:** DC-S1 zinciri · ATOM-H1-2026-10-28.2 · **2026-10-30T02:17:27+03:00** (ölçülmüş) · koordinatör: operatör oturumu b400f1e5.

## 1. İnsan başlatma kaydı (S1_START + G0_ACCEPT + F1_START açıldı)

Kullanıcı emri, birebir: **«Ordu siradi ile tüm görevleri bitirsin»** (2026-10-29 ~23:5x, bu oturum). S0a kaydı [§1](KOORDINATOR-DC-S0a-2026-10-30.md) kapsam hükmü: «her halka kendi ek iznini (S0b zararsız sınama, **S1 G0+ADR+bütçe+F1**, S4 pilot izinleri) bu genel talikatın kapsamında yürür; EK-2 istisnası yok». Bu kayıt o hükmün S1 halkasıdır. **Kapı bağları:**

| Kapı | Bu kayıtla bağlanan |
|---|---|
| G0_ACCEPT | G0 kanıt paketi S0b-03 çıktısı (kullanım kaynağı/limit fizibilitesi; sağlayıcısız fixture'ta doğrulandı — commit 9601809). **Kabul temeli: kullanıcı otomasyon talimatı** (S1 canlı run emsali: «approve insan:ci [kullanıcı otomasyon talimatıyla]» — STATE S1 damgası). Dürüst sınır: G0 kabulü talimatla işletilir; **H1 nihai insan kabulü (B5 sınıfı) AYRI ve AÇIK kalır** — bu kayıt onu vermez |
| TECHNICAL_ADR | TASLAK ADR [kararlar/ADR-dc-s0-teknik-oneri-2026-10-28.md, commit 98b6c76] arayüz bağları §4'te; **ADR insan onayı AÇIK kalır** (CALISTIRMA §2.2 — ajan insan aktör etiketiyle onay üretemez) |
| IMPLEMENTATION_BUDGET | T önerisi fiş başına 8 tur/60 dk/60k token — otomasyon talimatıyla yürütülür; sağlayıcı harcama izni DEĞİL |
| F1_START | Bu kayıt (faz-1 uygulama fişleri sırayla serbest) |
| LOCAL_TEST_SCOPE | Bu kayıt §7: hedefli testler + (etki incelemesi sonrası) CORE_FULL/PLUGIN_FULL |

**İzin sınıfı: zararsız yerel kod+test** — yeni modüller cwd=core/plugin'de üretilir, hedefli komutlarla koşulur; sağlayıcı çağrısı YOK · canlı YOK · üretim DB YOK · üretim onayı/grant YOK · 4377/4930 dokunulmaz.

## 2. Görev kimlikleri ve zincir

DC-S1-01 (sürümlü tam iş sözleşmesi + kanonik kimlik) → 02 (kalıcı sözleşme bağı + eski kayıt uyumluluğu) → 03 (onaylı repo/Git nesnesi gerçek başlatıcıya) → 04 (pilot alternatif girişleri kapat — plugin) → 05 (CLI operatör kimliği + tam sözleşme girişi). Fiş ayrıntısı: [S1.md](../../plans/uygulama-paketleri/DC-H1-2026-10-28/S1.md); komutlar [gorevler.json](../../plans/uygulama-paketleri/DC-H1-2026-10-28/gorevler.json)'dan birebir. **Önkoşül kanıtı:** DC-S0b-03 sonuc.json — EVIDENCE_RECORDED (3/3 hedefli + CORE_FULL 467/467 x=0), commit 9601809, ORDU-2/3 doğruladı.

## 3. HEAD ve kirli dosya sahipliği

HEAD **9601809** (yerel; push K7 ayrı emir — bu kayıt push yetkisi VERMEZ). Kirli 128 yol: dokunulmaz sınıf. **S1 yazıcı bunlara dokunmaz.** Fişlerdeki mevcut dosya adayları (core/src/store.ts · supervisor.ts · local-runtime.ts · dispatcher.ts · cli.ts · plugin/index.server.ts · plugin/server/ordu.ts · package.json'lar) hepsi **«yalnız release sonrası yazma»** etiketli: **bu zincirde YAZILMAZ** — mevcut kod dosyasına sıfır dokunuş; yalnız yeni modüller + yeni testler.

## 4. S0 ADR arayüz bağları

TASLAK ADR'den S1'e inen bağlar: sözleşme sürümü + yerel Git nesne algoritması alanları (S1-01 tasarım bağı — ADR §arayüz); eski kayıt uyumluluğu/yeniden-hashsiz okuma (S1-02; R6 kümesi değişmez); SHA-256 özet ≠ Git nesne kimliği ayrımı (S1-03 N2); operatör doğrulama seçimi — environment etiketi/CLI aktör metni güvenlik sınırı sayılmaz (S1-05 tasarım bağı; ADR §10 hata ailesi). Write-set bu bağların dışına çıkarsa önce paket revizyonu.

## 5. Kesin dosya listesi (yazma alanı)

| Fiş | Mevcut dosya | Yeni dosya |
|---|---|---|
| DC-S1-01 | YOK | `core/src/dc-full-contract.ts` + `core/test/dc-full-contract.test.ts` + kanıt çifti |
| DC-S1-02 | YOK | `core/src/dc-contract-binding.ts` + `core/test/dc-contract-compat.test.ts` + kanıt çifti |
| DC-S1-03 | YOK | `core/test/dc-source-binding.test.ts` + kanıt çifti |
| DC-S1-04 | YOK | `plugin/test/dc-pilot-entry.test.ts` + kanıt çifti |
| DC-S1-05 | YOK | `core/src/dc-operator-boundary.ts` + `core/test/dc-operator-boundary.test.ts` + kanıt çifti |

Kanıt çiftleri: `raporlar/dc-uygulama/DC-S1-XX/{OZET.md,sonuc.json}`. Üst sınır: 0 mevcut dosya · kritik yolda TEK yazıcı · yeni dosya adaylarının mevcut olmadığı doğrulandı. Mevcut kanıt çifti YOK.

## 6. Roller ve tavanlar

- **Yazıcı:** ORDU-1 (128a3edc) — yeni modül/test üretir + hedefli komutu koşar; **commit ATMAZ**.
- **Ayrı tester:** ORDU-2 (6061983f) — fiş başına dogrula + kaynak/artefakt hash + bağımsız koşum. **CORE_FULL** (S1-04 sonrası **PLUGIN_FULL** de): etki incelemesi ÖNCE (S0b'de TEMİZ — probe yalnız yerel; yeniden teyit); koşum yeni benzersiz etiketle: **`dc-h1-atomik-core-s1-20261030`** / plugin için **`dc-h1-atomik-plugin-s1-20261030`**.
- **Salt-okur denetçi:** ORDU-3 (d171af6b) — şema/şeffaflık/P-N gerçeklik.
- **Süpervizör:** ORDU-4 (cfda82a0) — 429/hata diriltme.
- **Tavan (fiş başına):** 8 tur / 60 dk / 60000 token. Tavan → dur + devir kartı. ORDU-1 çıktı disiplini: fiş başına ≤15 satır rapor (max_output_tokens dersi).

## 7. Test ortamı

Hedefli komutlar (gorevler.json birebir): S1-01/02/03/05 cwd=core `node --test --test-reporter=spec ...`; S1-04 cwd=plugin `node --import tsx test/dc-pilot-entry.test.ts`. Yalnız temp alan (temp Git reposu · mock Paseo · zararsız sahte CLI); sağlayıcı/DB/canlı/ağ YOK; çalışan süreçlere dokunma YOK. Yeni testler önce doğru nedenle kırmızı olabilir (CALISTIRMA §5); kırmızı tekrarlar kaybolmaz. Mevcut testler zincirden ÇIKARILMAZ (komutlar mevcut testlerle BİRLİKTE koşar — fiş reçeteleri böyle).

## 8. Duruş koşulları

(a) Tavan → dur + devir; (b) mekanizma/izin eksikse **BLOCKED** (sahte değer YOK); (c) write-set/kapsam büyümesi → fişi genişletme, paket revizyonu iste; (d) sağlayıcı harcaması/canlı/insan-kabul sınıfı → **DUR ve rapor** (EK-2 istisnası yok). **S1 sonuçları EVIDENCE_RECORDED sınıfıdır — sprint PASS/ürün kabulü/insan kapısı DEĞİL.** H1 nihai insan kabulü AÇIK kalır.
