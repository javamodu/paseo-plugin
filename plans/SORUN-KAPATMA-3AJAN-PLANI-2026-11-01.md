# SORUN-KAPATMA 3-AJAN PLANI (SK-1) — 2026-11-01 21:11

**Emir:** kullanıcı «şu an aktif çalışmalar var, restart onlar bitince yapacağım .. sen diğer sorunları nasıl çözeceksin, plan oluştur, 3 ajan ile».
**Kaynak sorunlar:** [sorun-envanteri](../raporlar/sorun-envanteri-2026-11-01/OZET.md) (kronik top-5) + fix kuyruğu (F3, devir-olcum) + KURMAY-1 durum raporu 20:58.
**Desen:** K-0057 / DAR-DENE dalga-2 ailesi — 2 paralel yazıcı + 1 salt-okur denetçi; koordinatör (KURMAY-1) dispatch eder, bağımsız doğrular, TEK ELDEN committer. Ajanlar COMMIT ATMAZ.

## Kapsam DIŞI (bu plan dokunmaz — [insan] kapıları değişmez)

- 4377/4930/8790 restart (kullanıcı: «aktif çalışmalar bitince») · K7 push (birikim 30) · gece schedule taşıma («taşı» emri bekler) · OTODEV A3 kalıcı nöbet (diskC ~%9,9 eşiği) · plugin v0.25 penceresi (F1 429 tur-içi retry, F2 stored-prompt, M1/M2 bazaradar) · provider-available alanı (top-30 ajanının domaini — biz dokunmayız) · 138 kirli kayıt / 177-yol temizlik kararı.

## Ajanlar (EK-3 brief çekirdekleri)

### ORDU-1 — YAZICI-1: S1 PS5.1 MEKANİK FRENİ (kronik #1 + meta-bulgu)

Kronik #1 ~%19 (~45 tekrar) ve sağlık ışığının kırmızısı buradan. Mevcut fren DOKÜMANSAL (AGENTS.md 3 tuzak) — yansıma dış-sinyalle kuralına göre bu yetmiyor: **MEKANİK KAPI** kurulur.

1. `scripts/ps51-kapisi.ps1` YENİ — betik tarayıcı, bilinen kötü desenler (her biri DERSLER'de kanıtlı):
   - `^\s+'@` girintili here-string kapanışı → **RED** (parser hatası sınıfı)
   - `git push` ile `2>&1` birleşimi → **RED** (NativeCommandError → push başarılıyken kırmızı)
   - `git commit -m "..."` çift tırnaklı mesaj → **RED** (PS 5.1 bölmesi; -F deseni zorunlu)
   - `Measure-Object -Line` sayım amacıyla → **UYARI** (gerçek sayım `@(Get-Content …).Count`)
   - `| Format-Table` boru → **UYARI** (abort riski — ayrı komut kuralı)
   - Çıkış: 0 temiz / 1 RED / 2 yalnız-uyarı; kapsam: staged/parametre verilen `*.ps1` dosyaları.
2. `scripts/ps51-kapisi.test.mjs` YENİ — hermetik (tmp dosya ile her desenin RED/UYARI/temiz üç hali; exit kodları).
3. `scripts/merge-guard.ps1` DÜZENLENİR (ince kanca ≤10 satır): staged `.ps1` varsa ps51-kapisi çağrılır — merge-guard zaten her committe koşuyor, kapı otomatik tetiklenir.
4. `AGENTS.md` mevcut «PowerShell 5.1 tuzak ailesi» paragrafına 3 eksik tuzak eklenir (push 2>&1 · commit -m · Measure-Object; L0 her zaman yüklü → **meta-bulgu** «ders kayıtlı ama tetiklenmiyor» L0+kapıyla kapanır; L0 ≤200 bütçe: 15→~18 satır).

**Sınır:** yalnız bu 4 dosya; DERSLER/ANAYASA dokunulmaz; uyarı sınıfı asla RED'e dönüşmez (yanlış-fren riski).

### ORDU-4 — YAZICI-2: F3 KİRA-PİD KAPANIŞI + DEVİR-ÖLÇÜM HATTI (OTODEV A3 hazırlığı)

1. **F3 (kira-pid KISMEN-AÇIK):** `pano/nobet.mjs` — `durum` okumasında kira sahibinin pid'i `pidCanliMi` ile kontrol edilir (A1-Y4 fonksiyonu modülde zaten var): sahibi ölmüş kira `bozuk` damgası taşır → devralan fail-closed devredebilir; yaşayan kira aynen. `pano/nobet.test.mjs` +2 vaka (ölü pid → bozuk; canlı pid → taze/bayat aynen). Pilot-0 bulgusu «kira sahibi kısa ömürlü değil ama öldüğünde düşmüyor» kapanır.
2. `pano/devir-olcum.mjs` YENİ — devir ölçüm defteri (append-only JSONL; üretim yolu `core/data/devir-olcum.jsonl` — YOK, ilk yazımda doğar; `spawn-olcum.jsonl` deseninin aynısı; testler tmp izole): her devirde {damgaISO, sureSn, echoDoluluk, handoffDosya, zincir} + `ozet` altkomutu (medyan/n sayısı). Pilot-0 run3 verisi (4dk08sn, echo 3/3) ilk kayıt olarak seed edilir — **kaynak-etiketli** (pilot-0 raporu).
3. `kararlar/K-0058.md` TASLAK YENİ — devir hedef eşikleri önerisi (süre üst sınır + echo % alt sınır + tavan ihlal = insan kartı). **[insan] ONAYI AÇIK kalır** — taslak karar kaydı, yürürlükte değil.
4. `pano/devir-olcum.test.mjs` YENİ — hermetik (tmp defter; append idempotansı + özet hesabı + bozuk satır atlanır).

**Sınır:** nobet.mjs mevcut testlere dokunmadan +2 vaka; A1 modüllerine (devir-kira/brief/tavan) dokunulmaz; ölçüsüz alan sayı YAZMAZ.

### ORDU-3 — DENETÇİ (SALT-OKUR, kod yazmaz)

İki yazıcının çıktısını diske karşı doğrular: test koşumları (kendi koşar, exit kodu), kapsam (dosya listesi vs plan), desen etkinliği (bilinen kötü örnek kapıdan RED düşüyor mu), K-0058 taslağının [insan] kapısı açık mı, devir-olcum ilk kayıt kaynak-etiketli mi. Bulgular `raporlar/gelen-kutu/ORDU-3-2026-11-01-sk1-kapanis.md` + aynı adlı `.json` (schemaSurum 1; islenme null). Ölçüm yoksa «ölçülmedi» yazar — uydurma yok.

## Dalga sırası + ölçütler

1. **Dispatch:** ORDU-1 + ORDU-4 PARALEL (paralel yazıcı 2 ≤ tavan 3; ayrı dosya kümeleri — çakışma yok). Bitince ORDU-3.
2. **Kanıt kapısı (koordinatör bağımsız koşumu):** her yeni test ×2 yeşil (yazıcı + koordinatör) · pano glob + core glob regresyon 0 · merge-guard (ps51-kapisi dahil) geçer · kapsam = plan listesi + hiç fazlası · ORDU-3 bulguları işlenmiş/TEMİZ.
3. **Kapanış:** STATE damgası + tek elden commit (koordinatör) + L1 budama. Push ayrı emir (K7).

## Riskler + bağlar

- Yanlış-fren (ps51-kapisi valid kodu RED'lerse): uyarı sınıfı geniş, RED yalnız 3 kanıtlı desen → ORDU-3 bunu özellikle sınar; gerekirse desen daraltılır.
- Paralel brief koordinasyonu (DERSLER 197): her yazıcının brief'i kendi dosya kümesini ADıyla listeler.
- Devir-olcum seed verisi uydurma görünmesin: kaynağı (pilot-0 raporu) alanına yazılır.
- K-0058 taslağı yürürlüğe girmez (EK-2 ruhü): onay cümlesi üretmez, yalnız [insan] onayı bekler.

**Yürütme emri bekler:** «SK-1 başla» → dispatch aynı turda.
