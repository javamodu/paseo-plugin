# S4 SCHEDULER 2/2 — TICK DÖNGÜSÜ / DAEMON SÜRÜCÜSÜ — 2026-10-26

Sprint 4 Scheduler kaleminin ikinci yarısı (1/2 = sentPoll, `s4-scheduler-sentpoll-2026-10-26.md`): tick'ler elle koşuluyordu; bu turda çağrayan döngü doğdu — `node src/cli.ts serve`.

## Kod (~205 satır kaynak + ~210 satır test; plan tahmini 100-200 ile uyumlu — üst sınır hafif aşılımlı, açıklama aşağıda)

- `core/src/daemon.ts` (YENİ, ~175) — `runDaemon`: cadence disiplini `schedule.ts`'ten (planOccurrences/settleKeys — M08/M09/M10 zaten testli); bu modül yalnız uygulama ucu. Her tur `node src/cli.ts tick` **ÇOCUK SÜRECİNDE** (crash izolasyonu: probe/yetenek/STOP kapıları CLI'nın kendi exit kodlarıyla yaşar, daemon çökmez, yalnız gözlemler). FAIL-CLOSED: 3 üst üste kırmızı çocuk → daemon ölür (sessiz kırmızı döngü YOK). STOP mandalı her uyanışta defterden taze okunur (`dbStopLatched`): mandalı kapalıyken çocuk HİÇ spawn edilmez (schedule STOPPED dalı), açılınca occurrence adil yeniden denenir. Askın çocuk 10 dk tavanında kill edilir. SIGINT/SIGTERM temiz duruş. **ÇEKİRDEĞİ KORUR:** yeni komut/olay kind eklemez, DB şemasına dokunmaz.
- `core/src/cli.ts` — `serve` komutu: `--interval-ms N` (varsayılan 30 sn; 1000 altı RED — hızlı döngü spam'i kapı dışı), `--max N` tavan. ORDU_DB/ORDU_PROBE/ORDU_LIVE çocuğa taşınır.
- `core/src/store.ts` — daemon'ın getirdiği eş-zamanlı ana+çocuk açış tespiti: `openStore`'a `busy_timeout=5000` + **koşullu** user_version damgası (önce koşulsuz YAZIYORDU → ikinci bağlantı BUSIŞ errcode 5 ile ölüyordu; önceki tüm koşumlar tek-bağlantılıydı, yarış hiç yaşanmamıştı). Şema dosyaları (001-004) DEĞİŞMEDİ — migration hash-senkron testi etkilenmez (DERSLER 2026-10-26 daemon turu, ders 1).

## Testler

- Hermetik (`test/daemon.test.ts`, 6): mutlu yol kadansı + benzersizlik (M08) + tavan dolunca temiz çıkış · misfire catch-up yok (M10) · overlap BİNMEZ, çocuk bitince adil yeniden deneme · STOP mandalı kapalıyken çocuk HİÇ çıkmaz, açılınca EN YENİ occurrence · fail-closed 3×kırmızı → exit 1 · intervalMs<=0 → spec RED.
- Canlı (`test/daemon-canli.test.ts`, 3): GERÇEK node çocuk süreçleri — cli `status` 2 kez gerçek aralıkla (stdout JSON + exit kodu yakalanır) · GERÇEK dosya defterinden mandal (latched → çocuk yok; unlatch → çocuk çıkar) · bilinmeyen komut gerçek exit 1 → 3 üst üste → daemon exit 1.
- Süit: **315 → 324** (test listesi `package.json`'a iki yeni dosya eklendi — liste tek-tek sayılıyor; ilk kanal koşumu 315 koştu, fark kanıt sayımında görüldü ve düzeltildi).

## Canlı koşum (üretim savaş defteri — (R))

`node src/cli.ts serve --interval-ms 1000 --max 2` (ORDU_DB=data/ordu.sqlite):

- 2/2 tick exit 0; her çocuk: outbox IDLE, reconcile 0, **sentPoll alive-running** (M02 oturumu, dokunma — olay YAZILMADI).
- **Doğal overlap kanıtı:** ilk çocuk 2912 ms sürdü (interval'i aştı) → +1000 occurrence'ı OVERLAP_SKIPPED; çocuk bitince AYNI occurrence adil yeniden denendi (ikinci launch = tam +1000 anı). skipped.overlap=1, çift koşum YOK. M10 semantiği gerçek duvar saatiyle gözlemlendi.
- Temiz çıkış: reason max-ticks, exit 0.

## Kanal koşumu (K-0046 e/f)

`scripts\test-kanal.ps1 -Etiket s4-scheduler-daemon` → **324/324, fail 0**, EXIT=0. son-kanit.json: `d=2026-10-26T06:51:20 h=240dec6 x=0 test=s4-scheduler-daemon sureSn=26` (log: `test-s4-scheduler-daemon.log`).

## Kabul.csv satır çevirisi

YOK — yeni işlev (S4 Scheduler plan kaleminin 2/2 kapanışı; M08/M09/M10 satırları schedule.ts'te zaten PASS/GECTİ). Kalan [insan] kuyruğu değişmedi: K-0044 uygulama penceresi · plugin kilit açma düdüğü.

Damga (R): 2026-10-26 (Get-Date), ajan = yazıcı (Claude glm-5.3), S4 tur 2 — sıradaki S4 kalemi: K12-01..14 (çok-ajan senaryoları).
