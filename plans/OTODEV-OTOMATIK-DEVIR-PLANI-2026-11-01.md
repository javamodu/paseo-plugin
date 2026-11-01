# OTODEV-1 — OTOMATİK DEVRİM PLANI («sekme açma sıfır») (2026-11-01)

**Kimlik:** OTODEV-1. **Kaynak:** kullanıcı seçimi (bu sohbet — «kalıcı çözüm» bloğu; ağrı: «ben sürekli yeni sekme açıyorum bu salakça»). Kök: [otonom analiz sentezi](../raporlar/otonom-analiz-sentez-2026-11-01/OZET.md) — KOŞULLU EVET'in 7 birleşik koşulu + ölçülmüş ağrı: **yeni-sekme med 23 dk** (n=62; aktif 12 dk; watchdog devri med ~7 dk).

## Hedef (ölçülebilir)

Koordinatör oturumu öldüğünde/bağlamı dolduğunda devir **Paseo içinden** otomatik: nöbet ajanı → kira kilidi → handoff okuma → **echo** → işi devralır. **Kullanıcı sekme açmaz**; ölçüm hattı: devir toplam süresi ≤ 10 dk (izole, manuel 23 dk'nın yarısından az). İnsan kapıları (commit/push/restart/izin) **sıraya girer ve bekler** — fail-closed, tasarım gereği.

## Mimari — 5 parça (hepsi YENİ dosya; kilitli plugin DOKUNULMAZ)

| # | Parça | İş |
|---|---|---|
| 1 | `pano/devir-kira.mjs` + testi | **Lease kilidi:** kira dosyası [PID + damga + TTL]; koordinatör heartbeat ile yeniler; TTL aşımı YOKSA devir RED (fail-closed); kira çift-yazar RED (ölünüp dirilme vakası — 429 ile ölenler pencere açılınca dirildi, tek-örnek kilidi kodda YOK'tu; bu kapatır) |
| 2 | `pano/devir-brief.mjs` (üretici) | Ardıl brief'i **EK-3 4 öğe** (hedef/çıktı formatı/kaynak/sınır) + **echo borcu 3 soru** + [insan] kapı listesi |
| 3 | `pano/devir-tavan.mjs` + testi | **Tavanlar kodda:** eşzamanlı ajan ≤3+1 · 429 geri çekilme · spawn CPU eşiği — brief'e DEĞİL koda |
| 4 | Nöbet schedule (Paseo `create_schedule`) | Cron ~20-30 dk; ajan davranışı: kira TAZE → **sessiz çıkış** (0 yazma, min token) · kira ÖLÜ → devir zinciri (handoff → echo → izinli iş sınıfı) |
| 5 | Zincir denetimi | `devirSinifi` alanı + echo-doluluk bacağı zincir-kontrol'e (KALİTE raporu önerisi) |

**[insan] kapıları kodda fail-closed (devralan ajan YAPAMAZ):** canlı sunucu restart · süreç kill · izin onayı · `git push` · kilitli sürüm dokunma · GRAF SSOT'ya onaysız yazma. Mekanizma: PANO_TOKEN devralana verilmez + izin polisi + tavan modülü.

## Aşamalar

- **A0 — C: eşiği [insan]:** diskC anlık **%9,9 < %10** → kalıcı schedule kurma kuralı bloğunda. İki seçenek: (a) Temp 3,42 GB temizliği [ayrı karar — yeniden üretilir] → ~%11'e çıkar; (b) pilot yalnız **geçici, maxRuns sınırlı** schedule ile (kalıcı DEĞİL — kuralı ihlal etmez). Kalıcıya geçiş A3'te.
- **A1 — Kod + test (yürütme emri: «OTODEV A1 başla»):** parça 1-3 + 5; hermetik testler: kira çift-yazar RED · TTL dolmadan devir RED · kapılar fail-closed · tavan aşımı RED · echo zorunluluğu. Süit mevcut 6 pakete ek 2 paket (hedef ~25 vaka); ×2 bağımsız koşum.
- **A2 — Pilot-0 (yürütme emri: «OTODEV pilot başla»):** 1 workspace × **30 dk** nöbet (sentez koşulu 7); ölçüm: devir süresi · echo doluluğu · çift-yazar 0 · [insan] kapı ihlali 0 · sekme açma **0** (kullanıcı açısından).
- **A3 — Ölçüm raporu + kademeli büyütme [insan]:** 2. workspace / daha uzun nöbet / watchdog 2. derece — O2 hattına bağlanır.

## Bağlar ve dürüst notlar

- **Kütle diyeti (47→38 + MCP 61→13):** mekanizma için engel DEĞİL, spawn maliyeti için önkoşul önerisi — [insan] kararı (kilitli v0.23'e dokunur), ayrı emir.
- **Headless `claude -p` YASAK** (GÜVENLİK bulgusu: Paseo koruma zincirini bypass eder) — devir yalnız Paseo `create_schedule`/`create_agent` yolundan.
- Devralanın iş sınıfı SINIRLI: salt-okur tarama + rapor + kuyruk hazırlama + [insan] karar listesi üretme. **Commit tek elden operatörde kalır** (kural).
- Nöbet spawn'ı token maliyeti taşır (sessiz çıkış minimize eder; glm53u ücretsiz uç önerilir).
- Mevcut durum muhafaza: heartbeat K0057 aynen; watchdog YAZICI OLMAZ (rol ayrımı — devralan nöbet ajanıdır, watchdog yalnız tetikler).

## Kanıt ölçütleri

Test yeşil ×2 bağımsız · pilot 30 dk: devir ≤10 dk ölçülü · echo 3/3 dolu · çift-yazar 0 · kapı ihlali 0 · kira ihlali 0 · log + STATE damgası + rapor md+json.

**Yürüme emri bekler:** «OTODEV A1 başla» (kod) → «OTODEV pilot başla» (A2). Bu plan YERELDİR — push ayrı emir (K7).
