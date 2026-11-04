# Git kalıntı envanteri — ordu-a2 (salt-okur analiz)

Tarih: 2026-11-04 · Ölçüm penceresi 22:49–23:00 (damga saati ölçüldü, tahmin yok) · Ajan: coder oturumu (KURMAY direktifi: «6 ajan ata ve tüm sorunları gider» alt görevi — git kalıntı envanteri). Repo: D:\Vibecode\ordu · HEAD 792217b.

## Ölçüm dürüstlüğü — ağaç CANLI

Çalışma ağacı ölçüm sırasında başka bir ajanın (M2a sağ panel işi) yazım seti tarafından aktif değişti: 22:49 ölçümü **258** (113 D + 20 M + 125 ??), 23:00:44 atomik ölçümü **271** (113 D + 23 M + 135 ??). Farkın tamamı echo 22:24'ten SONRA doğan M2a yazım seti (pano M + rapor ??). Bu raporun aile analizleri 22:49 dökümüne (125 ??) göredir; son sayı 271'dir. Bu raporun kendi 2 dosyası da ?? olarak eklenecek.

## A — D sınıfı: 113 dosya (F1 kök taşınması kalıntısı)

HEAD hâlâ 113 dosyayı izliyor; çalışma ağacı silmiş; **hiçbir commit silmeyi kaydetmemiş**. Silinen kütlenin yeni evi: `D:\Vibecode\paseo-verimlilik` (kardeş repo; ÇEKİRDEK'in «tek ev: paseo-verimlilik/sozlesme/» beyanıyla uyumlu).

Eşleşme denetimi (git show HEAD:<yol> blob hash ↔ yeni ev dosya hash'i, bayt düzeyinde):

| Grup | Adet | Sonuç |
|---|---|---|
| plugin/* → paseo-verimlilik/* | 106 | 94 birebir AYNI · 10 evrilmiş · 2 yok (aşağıda) |
| sozlesme/* → paseo-verimlilik/sozlesme/* | 5 | 3 AYNI · 2 evrilmiş |
| PASEO-VERIMLILIK-PLANI.md (kök) | 1 | Yeni ev YOK (ordu diskinde de yok) |
| arsiv/PASEO-VERIMLILIK-REHBERI-v2.0.md | 1 | Yeni ev YOK (her iki repoda da yok) |
| **Toplam** | **113** | **99 AYNI · 12 evrilmiş · 2 eşleşmesiz** |

**12 evrilmiş dosya — tamamı yeni repodaki MEŞRU evrim, kayıp yok:** sozlesme.ts (v2.1→v2.2 atıf güncellemesi) · kalkan429.ts (sabit veri yolu `D:\Vibecode\ordu\plugin\data` → `D:\Vibecode\paseo-verimlilik\data` düzeltmesi) · cekirdek.ts (43→61 satır) · package.json (sadelestirme.test.ts eklendi) · OVERVIEW.md (v2.0→v2.1 ÇEKİRDEK atıf) · .gitignore · 4 test dosyası (satır artışı) · REHBER-EK-YENI-PROJE.md · REHBERI v2.1→v2.2 (ad+sürüm değişimi).

**2 eşleşmesiz dosya:** ikisi de TARİHSEL belge; içerikleri git geçmişinde (`git show HEAD:PASEO-VERIMLILIK-PLANI.md` erişilebilir ölçüldü). PLANI'nın çağdaş devamı ordu'da `plans/PLAN.md` v2.10.1'dir (plans/HEDEF.md diff'i bunu gösteriyor); v2.0 rehber SUPERSEDED başlıklı arşiv kopyasıdır. Veri kaybı YOK — yalnızca diskte yaşayan kopyaları yok.

## B — ?? sınıfı: 125 dosya (runtime + rapor drift)

| Aile | Adet | Nitelik |
|---|---|---|
| raporlar/ | 106 | Tarihsel rapor aileleri 2026-10-26 → 11-04: gelen-kutu v1–v9 · plan-3-denetci · repo-temizlik-hazirligi · uygulama-atomiklestirme · takip-sozlesme günlük · telemetri-haftalik W45 · model-benchmark · puanlama · mockup PNG'leri |
| plans/ | 8 | 4 plan belgesi (10-26/27) + 4 handoff (10-29 ×2, 10-31, 11-01-0512) |
| arsiv/ | 7 | plan arşivleri (10-27) |
| core/data/ | 4 | Runtime ölçüm verisi: devir-kira.json · devir-kira log · devir-olcum.jsonl · spawn-olcum.jsonl (büyüyen, sürekli yazılan) |

Öne çıkan: `raporlar/repo-temizlik-hazirligi-2026-10-28/` — 2026-10-28'de 177 yolluk sahiplik partisyonlu (G01 bağlı belgeler 147 · G02 özgün sahip incelemesi 24 · G03 sahiplik dışı 6) temizlik HAZIRLIĞI yapılmış; COMMIT-KONTROL.md 7 maddelik [insan] commit kapısı listesiyle teslim edilmiş ve **o günden beri kapanmamış**. Bugünkü 125 ?? büyük ölçüde o hazırlığın kapsamının devamı/ürünü.

## C — M sınıfı: 20 dosya (22:49 dökümü)

| Aile | Adet | Nitelik (diff okumasıyla) |
|---|---|---|
| plans/handoff/ (8) | 8 | Devir zinciri **echo doğrulama appends** (append-only protokol artifact'ları; 10-25 → 11-01 dosyalarına sonraki oturumların echo blokları) |
| raporlar/ (8) | 8 | model-benchmark top30.json (+10.464 satır) + OZET · telemetri-haftalik W43/W44 (otomasyon drift — DERSLER 48'de kayıtlı aile) · takip-sozlesme 10-25 append · tuval KAPI re-check append |
| core/evidence/ (3) | 3 | Runtime kanıt yeniden üretimi: probe-latest.json · provider-bench · provider-katalog (+1.048) |
| pano/ordu-panosu.html (1) | 1 | **M2a sürüyor** — başka ajanın aktif yazım seti (sağ panel YÖNETİM metrik kartı; operatör emri kaynak yorumlu) — BURAYA DOKUNULMAMALI |
| plans/HEDEF.md (1) | 1 | PLAN.md v2.10.1 işaretçi güncellemesi |

## En riskli 5 madde (öneri ile — uygulama YALNIZ [insan] onayıyla; bu ajan salt-okur)

1. **113 D'nin commit edilmemesi (yüksek):** F1 taşınması içerik olarak TAMAMIYLA yeni evde (99 aynı + 12 evrim + 2 tarihsele git geçmişi yetiyor), ama ordu repo'sunda silme kaydı hiç düşmedi — her `git status` 100+ satır gürültü, echo'lar şişiyor, `git add` yanlışlıkla riski artıyor. Öneri: tek amaçlı commit ile D'leri stage edip kaydetmek (dosya adıyla; M2a yazım setini ASLA içermeyecek şekilde) — [insan] kapısı (commit).
2. **AGENTS.md ölü yollar (yüksek):** AGENTS.md «plugin/ (paseo-verimlilik)» bileşen evi ve «sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md» diyerek diskte OLMAYAN yollara işaret ediyor (plugin/ ve sozlesme/ dizinleri yok; CODEMAP doğru — onlarda geçmiyor). L0 navigasyon belgesi yanlış adrese götürür. Öneri: AGENTS.md yap bölümünü disk gerçeğine (kardeş repo D:\Vibecode\paseo-verimlilik + ordu kökü) güncellemek.
3. **M2a yazım seti çakışma riski (orta):** pano/ordu-panosu.html + M2a raporları şu an başka bir ajanın kaleminden. Bu kirliliğe temas eden her toplu işlem (add -A YASAK zaten) çakışma üretir. Öneri: M2a kapanış damgasına kadar pano/* ve M2a raporlarını her stage planından hariç tutmak.
4. **Untracked temizlik kararı 7 gündür askıda (orta):** repo-temizlik-hazirligi-2026-10-28'in G02/G03 [insan] commit kapıları hâlâ açık; 125 ??'nin önemli bölümü o hazırlığın kapsamında. Öneri: operatörün G01/G02/G03 kararlarını tek tek kapatması veya yeni bir tek kararla (ör. «tarihsel raporları toplu commit et») süreci bitirmesi.
5. **core/data büyüyen ölçüm dosyaları (dusuk-orta):** devir-olcum.jsonl / spawn-olcum.jsonl / 429 log sürekli yazılıyor ve izlenmiyor — telemetri-haftalik'in DERSLER 48'deki kalıcı drift dersinin aynı deseni. Öneri: .gitignore'a core/data ölçüm ailesini almak veya periyodik commit politikası tanımlamak (karar kaydıyla).

## Dürüst eksikler

- 12 «evrilmiş» dosyadan 4'ünün satır-sonu normalize diff'i ayrıca okundu; kalan 8 satır sayısı değişen dosyalar için gerçek fark derin diff ile değil satır sayısı + örnek diff ile nitelendirildi.
- M2a'nın 23:00 sonrası ürettiği dosyaların içerik analizi bu raporun kapsamı dışında (görevim yalnız 22:49 dökümünü nitelendirmekti).
- paseo-verimlilik repo'sunun kendi kirli durumu (M data/429-defter.jsonl gözlemlendi) bu raporda incelenmedi — görev ordu repoydu.

Kaynak ölçümler: git status --porcelain (3 anlık), git diff --stat (136 dosya, +12.077/−12.790), git show HEAD hash karşılaştırmaları (113 dosya), diff --strip-trailing-cr (4 dosya), disk yoklamaları (plugin/, sozlesme/, paseo-verimlilik/, find aramaları).


## İşlenme

- 2026-11-04 23:1x — KURMAY: M2 kapanışında işlendi (STATE_BOARD ek 23:1x). Öneriler [insan] sırasına alındı: 113 D tek amaçlı kapılı commit + AGENTS.md ölü yollar düzeltmesi (plugin/ + sozlesme/ diskte yok) + G01/G02/G03 kapıları — A5 tablosunda. Bu dalganın kapanış commit'inde rapor kayda girdi (hash sonraki echo'da).
