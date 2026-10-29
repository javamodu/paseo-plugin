# KOORDİNATÖR KAYDI — DC-S0b serbest bırakma (S0B_START)

**Kimlik:** DC-S0b zinciri · ATOM-H1-2026-10-28.2 · **2026-10-30T01:39:12+03:00** (ölçülmüş) · koordinatör: operatör oturumu b400f1e5.

## 1. İnsan başlatma kaydı (S0B_START açıldı)

Kullanıcı emri, birebir: **«Ordu siradi ile tüm görevleri bitirsin»** (2026-10-29 ~23:5x, bu oturum). S0a kaydı [§1](KOORDINATOR-DC-S0a-2026-10-30.md) kapsam hükmü: «her halka kendi ek iznini (S0b zararsız sınama, S1 G0+ADR+bütçe+F1, S4 pilot izinleri) bu genel talikatın kapsamında yürür; EK-2 istisnası yok». Bu kayıt o hükmün S0b halkasıdır. **S0b izin sınıfı: zararsız yerel sınama** — yeni test/fixture dosyaları cwd=core'da üretilir ve fişin hedefli komutuyla koşulur; sağlayıcı çağrısı YOK · canlı YOK · DB YOK · temp alan dışına yazma YOK · çalışan süreçlere (4377/4930) dokunma YOK. Fiş kapı bağları:

| Kapı | Bu kayıtla bağlanan |
|---|---|
| S0B_SCOPE | Bu kayıt §2/§5 (görev zinciri + kesin dosya listesi) |
| IMPLEMENTATION_BUDGET | T önerisi fiş başına 8 tur/60 dk/60k token — kullanıcı otomasyon talimatıyla yürütülür; sağlayıcı harcama izni DEĞİLDİR |
| LOCAL_TEST_SCOPE | Bu kayıt §7: yalnız hedefli testler + (etki incelemesi sonrası) CORE_FULL; koşum reçeteleri birebir |
| TECHNICAL_ADR | TASLAK ADR [kararlar/ADR-dc-s0-teknik-oneri-2026-10-28.md, commit 98b6c76] arayüz/write-set bağları §4'te fiş write-set'ine bağlanır. **ADR insan onayı AÇIK kalır — bu kayıt onay üretmez** (§5.2 CALISTIRMA; ajan insan aktör etiketiyle onay üretemez) |

## 2. Görev kimlikleri ve zincir

DC-S0b-01 (zararsız fixture + pozitif kontrol; hedefli komut `node --test --test-reporter=spec test/dc-boundary-positive.test.ts`, cwd=core) → DC-S0b-02 (korunan alan + kaçış negatifleri; komut pozitif+negatif iki dosya) → DC-S0b-03 (bağımsız tüketim sınırı + G0 kanıt paketi; komut üç dosya). Fiş ayrıntısı: [S0b.md](../../plans/uygulama-paketleri/DC-H1-2026-10-28/S0b.md); komutlar [gorevler.json](../../plans/uygulama-paketleri/DC-H1-2026-10-28/gorevler.json)'dan birebir alındı (yukarıda). **Önkoşul kanıtı:** DC-S0a-04 sonuc.json — EVIDENCE_RECORDED, ORDU-2 bağımsız doğruladı, commit 98b6c76.

## 3. HEAD ve kirli dosya sahipliği

HEAD **98b6c76** (yerel; push K7 ayrı emir — bu kayıt push yetkisi VERMEZ). Kirli 128 yol: dokunulmaz sınıf [eski untracked + üretim defterleri + deney kayıtları]. **S0b yazıcı bunlara dokunmaz.** `core/package.json` fişlerdeki tek mevcut dosya adayıdır ve fişte **«yalnız release sonrası yazma»** etiketli: **bu zincirde YAZILMAZ** (hedefli komutlar doğrudan `node --test` — npm script eklemeye gerek yok).

## 4. S0 ADR arayüz bağları

TASLAK ADR'den (98b6c76) S0b'ye inen bağlar: seçili mekanizma kimliği fixture'ta kaydedilir (S0a-03 erişim matrisi: izinli yazma yalnız temp pilot-test alanı); korunan alan taklitleri (DB/onay/suite/anahtar) gerçek ev dizini/sırları TEMSİL ETMEZ (ADR §taklit eşdeğerliği bağı — release öncesi cevaplanacak, bu zincir köle çözmez); kullanım limiti sağlayıcısız fixture'da sınanır (S0a-03 üç sınıf: gerçek/bağımsız/bilinmeyen tüketim). Write-set bu bağların dışına çıkarsa önce paket revizyonu.

## 5. Kesin dosya listesi (yazma alanı)

| Fiş | Mevcut dosya | Yeni dosya |
|---|---|---|
| DC-S0b-01 | YOK (package.json dokunulmaz) | `core/test/fixtures/dc-boundary-fixture.mjs` + `core/test/dc-boundary-positive.test.ts` + `raporlar/dc-uygulama/DC-S0b-01/{OZET.md,sonuc.json}` |
| DC-S0b-02 | YOK | `core/test/fixtures/dc-boundary-protected.mjs` + `core/test/dc-boundary-negative.test.ts` + `raporlar/dc-uygulama/DC-S0b-02/{OZET.md,sonuc.json}` |
| DC-S0b-03 | YOK | `core/test/fixtures/dc-usage-bound-fixture.mjs` + `core/test/dc-usage-bound.test.ts` + `raporlar/dc-uygulama/DC-S0b-03/{OZET.md,sonuc.json}` |

Üst sınır: 0 mevcut dosya (≤3 rahat) · kritik yolda TEK yazıcı (ORDU-1) · yeni dosya adaylarının mevcut olmadığı doğrulandı (untracked/izlenen listingte yok). Mevcut kanıt çifti YOK (yeni deneme; ezme söz konusu değil).

## 6. Roller ve tavanlar

- **Yazıcı:** ORDU-1 (128a3edc) — test/fixture üretir + hedefli komutu koşar; **commit ATMAZ** (operatör tek elden).
- **Ayrı tester:** ORDU-2 (6061983f) — fiş başına: `node plans/uygulama-paketleri/DC-H1-2026-10-28/dogrula.mjs --result DC-S0b-XX raporlar/dc-uygulama/DC-S0b-XX/sonuc.json` + kaynak hash'lerini yeniden hesapla (P1) + komut kayıtları çıktı kimliği teyit. **CORE_FULL** (tam regresyon; `workerMayRun:false` → ORDU-1 koşamaz): ÖNCE `scripts/test-kanal.ps1` + `core/package.json` pretest/probe etki incelemesi (süreç/çıktı/ağ — sağlayıcı çağrısı riski varsa KOŞMA, dur ve rapor); etki temizse yeni benzersiz etiketle koş: **`dc-h1-atomik-core-s0b-20261030`** (reçete etiketi `dc-h1-atomik-core` kanal logunu ezebilir — CALISTIRMA §3).
- **Salt-okur denetçi:** ORDU-3 (d171af6b) — şema/şeffaflık: sonuc.json alanları sözleşmeye birebir; P/N gerçek gözlem mi; BLOCKED gerekçeleri doğru sınıfta mı.
- **Süpervizör:** ORDU-4 (cfda82a0) — 429/hata diriltme; görev dağıtımı YOK.
- **Tavan (fiş başına):** 8 tur / 60 dk / 60000 token. Tavan → dur + devir kartı.

## 7. Test ortamı

Hedefli komutlar cwd=core (gorevler.json birebir; §2'de). Yalnız temp alan yazılır; DB/port/repo/sunucu YOK; sağlayıcı çağrısı YOK. Yeni testler **bu görevde üretilir** — önce doğru nedenle kırmızı, sonra pozitif+negatif yeşil (CALISTIRMA §5). Mevcut test zincirden ÇIKARILMAZ. Çocuk süreç yalnız node --test (izli).

## 8. Duruş koşulları

(a) Tavan → dur + devir; (b) mekanizma yok/kurulamıyorsa **BLOCKED** (test atlanıp PASS YOK — sahte değer yok); (c) kapsam/write-set büyümesi → fişi genişletme, paket revizyonu iste; (d) sağlayıcı harcaması/canlı/insan-kabul sınıfı → **DUR ve rapor** (EK-2 istisnası yok). **S0b sonuçları EVIDENCE_RECORDED sınıfıdır — sprint PASS/ürün kabulü/insan kapısı DEĞİLDİR** (her fiş hükmü aynen). G0 insan kararına sunulacak bağlar S0b-03 çıktısı olarak AÇIK kalır.
