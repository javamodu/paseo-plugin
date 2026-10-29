# K-0053 pilot dalga fişi — V8-02b kapanis-taslak.ps1 (2026-10-29)

**Dalga kimliği:** K0053-PILOT-1 (graf-dışı — v8 verimlilik bacağı; DC bütçesine girmez)
**Operatör:** ana oturum (tek elden merge + kanal + kapanış) · **Yazar:** ayrı worktree yazıcı ajanı · **Denetçi:** merge anında tam kanal + tip kapısı (PLAN §25.5)
**Tavanlar (öneri T):** 1 yazım turu · ~30 dk duvar · ~40k token · duruş: hedefli testte 2 üst üste kırmızı → dur, raporla.

## Hedef (EK-3/1)

`scripts/kapanis-taslak.ps1` — dalga-kapanış **TASLAK** üretici: dalga girdilerinden (dalga kimliği, commit listesi, kanal sonucu, tur zamanları) kapanış satırlarının taslağını üretir: STATE damga satırı + graf/kabul/SENARYO satır taslakları + **ÖNCE/SONRA ölçüm çifti tablosu** ([CALISTIRMA.md §7](../../../plans/uygulama-paketleri/DC-H1-2026-10-28/CALISTIRMA.md) şeması: kanal sn · duvar sn · x · tur sayısı). **SSOT dosyalarına ASLA yazmaz** — yalnız taslak üretir (`-CiktiDir`'e TASLAK.md + TASLAK.json). Fail-closed: eksik/ölçümsüz girdi → ADIYLA exit 1; uydurma değer YOK («ölçümsüz hız iddiası kapanamaz» kuralı kodun kendisidir).

## Çıktı formatı (EK-3/2)

- `scripts/kapanis-taslak.ps1` — PowerShell 5.1 uyumlu; parametrelerle girdi; `-CiktiDir`'e TASLAK.md + TASLAK.json; BOM'suz UTF-8.
- `scripts/kapanis-taslak.test.mjs` — node --test; powershell.exe alt-koşumu **İZOLE temp dizinde** (kanal/defter/SSOT DOKUNMAZ): mutlu yol (alan kontrolü) · eksik-girdi → exit 1 ADIYLA · ölçümsüz kanal girdisi → red · determinizm · fixture dosyalarının değişmediği (SSOT-dokunmama).
- Hedefli koşum: `node --test scripts/kapanis-taslak.test.mjs` yeşil.

## Araç/kaynak (EK-3/3)

Repo kökü; emsaller: `scripts/hedefli-test.mjs` (+ `.test.mjs` — test deseni: temp fixture + fail-closed vakaları) · `scripts/merge-guard.ps1` (PS 5.1 fail-closed deseni) · `core/data/son-kanit.json` (kanal girdisi alan adları) · V8-02b madde metni `raporlar/gelen-kutu/v8-paralel-yazar-hizi-2026-10-28.md`.
PS 5.1 tuzakları: here-string kapanışı `'@` DAIMA kolon 0 · BOM'suz yazım · çift tırnak `$` genişletir (DERSLER/K-0051).

## Görev sınırı (EK-3/4)

- YENİ 2 dosya; MEVCUT dosyaya DOKUNMA (≤3 sınırından 0 harcanır). STATE/PLAN/graf/kabul/SENARYO/CODEMAP/kanıt defterleri YASAK.
- Commit'ler worktree branch'ine (kısa kanca commit'ler; yoğun Türkçe mesaj + `Co-Authored-By: Claude Code <noreply@anthropic.com>` satırı). MERGE/push/kanal/tip-kapısı OPERATÖRDE — yazar bunları yapmaz.
- Geçici dosyalar koşum sonunda silinir.
- Bitiş raporu: branch adı + commit hash listesi + hedefli test sonucu (+ tasarım kararları/dürüst notlar).

## Ölçütler (operatör bacağı — V9-04 ölçüm çifti)

ÖNCE taban: kanal 125 sn / x=0 / 467/467 (v9-06, h=39f46e4) · tip 0/0 · duvar emsal ~25 dk (v9-04 turu, 08:33→08:50). SONRA: bu dalganın kanal koşumu + tur duvar süresi (tur başlangıcı 2026-10-29 08:55:12 yerel). K-0053 ölçütleri: emsal-eşdeğer-veya-daha-kısa duvar · dalga başına TEK kanal koşumu · merge anında kaçak 0 · kirli-dosya sahiplik ihlali 0. Tutmazsa K-0054 geri alır.
