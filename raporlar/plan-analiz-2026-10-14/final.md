# Plan Analizi — FINAL (kapsul-final-v2.0.0 notio)

Tarih: 2026-10-14 · Çerçeve: v3.2 (15 alan, sabit ağırlıklar) · Yöntem: diskten doğrulama; verify.py temp kopyada koştu (orijinal pakete dokunulmadı) · Analiz edilen: D:\Vibecode\silinecek-task-graph\kapsul-final-v2.0.0 notio

## Zorunlu kontroller — sonuçlar

1. **NOT_RUN doğrulaması: TUTARLI.** evidence/CURRENT-STATUS.json 4 alan NOT_RUN (productionRuntime, liveBenchmark, sdkTypecheck, sandboxSecurity); tests/ACCEPTANCE.csv 36/36 NOT_RUN (A35/A36 dahil). "PASS_REFERENCE_ONLY" iddiası canlı koşuyla doğrulandı: domain.test.mjs 32/32 PASS, database.test.py 16/16 PASS (exit 0). NOT_RUN başarısızlık değildir; paket bunu dürüstçe beyan ediyor.
2. **Manifest bayatlığı: DOĞRULANDI (R).** `python tools/verify.py` → exit 1, `AssertionError: MASTER-PLAN.md` (ilk hash kontrolünde çakıldı). Salt-okunur taramayla 6 hash uyuşmazlığı: MASTER-PLAN.md, delivery/BACKLOG.md, delivery/CODE-BUDGET.md, docs/03-execution-and-recovery.md, docs/06-runtime-adapters.md, tests/ACCEPTANCE.csv. Ek: governance/ADR-011 ve ADR-012 manifest'te hiç yok (excluded listesinde de değiller — kayıt dışı dosya). Kritik yan etki: diskteki evidence/OFFLINE-CHECK.json hâlâ "All manifest content hashes match: PASS" diyor → bayat kanıt, güncel diskte geçersiz. ADR-011 §4'ün kendi kilit şartı ("verify.py PASS olmadan LOCK yenilenmez") şu an KIRMIZI.
3. **Şema `local` runtime tanımıyor: DOĞRULANDI.** contracts/schema.json Profile.runtime enum = ["paseo","completion"] — ADR-012 (KABUL, kullanıcı kararı) "paseo" | "local" diyor; şema senkronlanmamış. Ayrıca şemadaki "completion" değeri ADR-012 modelinde karşılıksız. UYGULAMA-EKSIK (tasarım kararı alınmış, sözleşmeye işlenmemiş).
4. **K1 payload açığı: DURUYOR.** contracts/schema.json:605 Command.payload = {"type":"object"} (kapalı değil, kind'a göre ayrışmıyor); Event.payload de generic object (~satır 840). ADR-011 K1 kapanış şartı "payload'lar AYRIK + KAPALI şema; generic object RED" dediği halde şema eski halde. A03/A05/A06 negatif testleri bu haliyle payload kaçağını yakalayamaz.

## Alan tablosu (v3.2)

| Alan | Ağırlık | Puan (0-10) | Katkı | Kanıt / not |
|---|---:|---:|---:|---|
| Teslim | 14 | 7 | 98 | BACKLOG B00-B12 faz kapıları, ACCEPTANCE 36 gate, CODE-BUDGET, LOCK akışı güçlü; ama kendi kapısı (verify.py) şu an kırmızı, humanApproval PENDING |
| Yetki/güvenlik | 13 | 7 | 91 | docs/04 tehdit modeli + fail-closed + auth tasarımı güçlü; K1 açık payload + sandboxSecurity NOT_RUN (tavan 8 altında) |
| Halüsinasyon/kanıt | 10 | 7 | 70 | NOT_RUN dürüstlüğü örnek; evaluator trust zinciri (K4) iyi; ama OFFLINE-CHECK bayat PASS iddiası kanıt hijyenini bozuyor |
| Long-run/recovery | 10 | 8 | 80 | docs/03 crash-gap, reconcile, UNKNOWN_EXTERNAL_STATE, stop latch, restore sırası, A26 — tasarım çok olgun (canlı kanıt yok, tavan 8) |
| İzleme | 8 | 7 | 56 | Event store + SSE cursor (A18) + usage_unknown muhasebesi; canlı telemetri yok |
| Otonomi | 7 | 7 | 49 | Bilinçli sınırlı otonomi: bounded repair, insan kapıları, bütçe tavanı (A15) |
| Manager | 6 | 7 | 42 | Manager self-approval/quota genişletemez (D05); prompt ince ama rol net |
| Handoff | 5 | 5 | 25 | Süreç restart/restore güçlü; ajan-ajan devir kavramı zayıf |
| Coding | 5 | 7 | 35 | Frozen candidate + protected evaluator + repair generations iyi tasarım; uygulama yok |
| Reasoning | 4 | 6 | 24 | Rubric/reviewer kapısı var; derinlik orta |
| Paralellik | 4 | 7 | 28 | 2 kapsül izolasyonu (A22), kapasite adaleti (A24), contention testleri (A07) |
| Schedule | 4 | 4 | 16 | Lease/timeout/backoff var; zamanlanmış görev (cron) kavramı yok |
| Memory | 4 | 5 | 20 | Event/audit replay güçlü; öğrenen bellek (ders/retro) yok |
| Hız/maliyet | 3 | 7 | 21 | Bilinmeyen maliyet ücretsiz değil, denominator disiplini, LOC bütçesi |
| Taşınabilirlik | 3 | 6 | 18 | Bağımsız paket + pinli stack; local runtime kararı şemaya işlenmemiş |

**Ağırlıklı toplam: 67,3 / 100**

## İlk 3 açık

1. **Manifest bayat + verify.py kırmızı** — durum: KANIT-EKSIK/UYGULAMA-EKSIK. Kod yeri: MANIFEST.json (6 eski hash; ADR-011/012 kayıt dışı) + evidence/OFFLINE-CHECK.json (bayat PASS). Kabul testi: manifest yenilenir, `python tools/verify.py` exit 0, OFFLINE-CHECK yeniden üretilir, LOCK-AND-RELEASE akışına göre insan onayı alınır.
2. **K1 payload açığı** — durum: TASARIM-EKSIK (kapanış kararı var, uygulanmamış). Kod yeri: contracts/schema.json:605 (Command.payload) ve Event.payload (~:840) generic object. Kabul testi: payload'lar kind/type'a göre discriminated-union (TypeBox kaynak, JSON export); bilinmeyen kind + rogue payload negatif fixture'ı verify.py'de RED.
3. **`local` runtime şemada yok** — durum: UYGULAMA-EKSIK (ADR-012 KABUL, sözleşme senkronsuz). Kod yeri: contracts/schema.json Profile.runtime enum (:~180, ["paseo","completion"]). Kabul testi: enum "paseo"|"local"|"completion" kararlı set + local capability alanları (gitWorktreeProven, processRegistryDurable, cancelConfirmLocal, providerCliPresent) Capabilities'e işlenir; examples.json'a local fixture + verify.py PASS.

## Hüküm

Final, teslim disiplini ve kanıt dürüstlüğü açısından bu çerçevede gördüğüm en olgun tasarım paketi: 36 kabul kapısının tamamını NOT_RUN ilan etmek, offline PASS'i production'dan ayırmak ve kendi kilit mekanizmasını (verify.py + APPROVAL.json) pakete gömmek ciddi mühendislik hijyenidir. Ne var ki paket şu anda kendi kapısından geçemiyor: ADR-011/012 sonrası 6 dosya değişmiş, manifest yenilenmemiş, verify.py ilk satırda kırmızı ve diskteki OFFLINE-CHECK artık yalan söylüyor; üstüne KABUL edilmiş iki karar (K1 kapalı payload, ADR-012 local runtime) sözleşmeye işlenmemiş. Bunlar tasarım kalitesini düşürmez ama "kilitlenebilir baseline" iddiasını bozar: 67/100, insan onayından önce manifest tazeleme + K1/local şema işleme şart.
