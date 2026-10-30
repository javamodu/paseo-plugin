# CORE_FULL S4 HALKASI — KANAL KOŞUM ÇİFTİ (dc-h1-atomik-core-s4-20261030)

- **Etiket:** `dc-h1-atomik-core-s4-20261030` · **HEAD:** `b8f3435` (DC-S4-04 kapanışı — ATOM-H1 26/26 fiş; her iki koşumda da aynı)
- **Kanal:** `powershell -ExecutionPolicy Bypass -File scripts\test-kanal.ps1 -Etiket dc-h1-atomik-core-s4-20261030` (cwd=D:\Vibecode\ordu; script cwd=core'da `npm test` koşar — pretest probe dahil)
- **Loglar:** `test-dc-h1-atomik-core-s4-20261030-run1.log` (1. koşum) · `test-dc-h1-atomik-core-s4-20261030.log` (2. koşum — koşum çifti diskte ayrı tutuldu)

## Koşum çifti

| Koşum | d (ölçülmüş) | x | sureSn | Süit | Not |
|---|---|---|---|---:|---|
| 1 (ORDU-2) | 2026-10-30T14:10:55+03:00 | **1** | 180 | — | Kırılan: `f3-crash.test.ts:136 managerBekle` — **BİLİNEN çevresel flake** (A0-3/F9 emsali, S4 kodu DEĞİL); koşum anında CPU %100 (yabancı Playwright/vite testleri) |
| 2 (ORDU-4 mekanik devri) | 2026-10-30T14:38:28+03:00 | **0** | 117 | **467 pass / 0 fail** | Deneme koşumu — CPU %100 yük penceresi KAPALIYKEN koşuldu (K-0057 §3b 2. dal: bir kez deneme); f3-crash bu kez YEŞİL — flake teyidi (yük duyarlı 15 sn manager penceresi) |

`son-kanit.json` (birebir, script yazdı — elle yazılmaz): `d=2026-10-30T14:38:28.7832758+03:00 · h=b8f3435 · x=0 · test=dc-h1-atomik-core-s4-20261030 · sureSn=117`.

## Dürüst notlar

- **Devir kaydı:** ORDU-2 429-exceeded (sağlayıcı rate limit) ile kapandı → kanal 2. koşumu **ORDU-4 mekanik devriyle** yürütüldü (K-0057 §3b; kullanıcı emri «tıkanırsan durursan devam edersin»). 1. koşumun disk teyidi operatörde yapıldı (run1.log korunmuş).
- 2. koşum x=0 geldi → halka KAPANDI; flake (x=1) çevresel kayıt olarak yukarıdaki çiftte durur — gizlenmedi.
- Koşum anında yabancı yüksek CPU sürüyordu; yabancı süreçlere dokunulmadı (yasak). x=0'a rağmen koşum koşulları suboptimaldı — kayıt dürüstlüğü için not düşüldü.
- Sadece `raporlar/kanit-hedef/` altına kayıt yazıldı (bu dosya + son-kanit.json + log); repo kodu YAZILMADI; commit YOK (tek elden operatör).
