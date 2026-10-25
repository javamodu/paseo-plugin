# DEVİR TARAMASI — 6-SUBAGENT (tam devir + plan girdisi) — 2026-10-25 18:50

Tetik: kullanıcı — "6 subagent ile uçtan uca tarama, tam devir al, en iyi uygulama planı". Yöntem: 6 salt-okur doğrulayıcı (EK-3 6-alanlı brief) + 1 yazıcı + ana-ajan bağımsız doğrulaması. Hiçbir düzeltme UYGULANMADI (yalnız tespit; uygulama planı: `plans/SAVASA-HAZIR-PLAN-2026-10-25.md`).

## Ana-ajan bağımsız doğrulamaları (R)
- Plugin `npm test`: **EXIT=0, 4/4 dosya, 387 ok** — denetim c4f7043 iddiası doğru.
- Handoff zinciri: **20 halka, 19 bağ, KOPUK YOK** (onarım `480911b` geçerli); echo `294e8d8` + bağlantı `132aeaa`.
- Düz-metin anahtar "repo'ya sızmış" iddiası **ÇÜRÜTÜLDÜ**: `.claude/settings.json` + `.tmp-home/...` + `arsiv/tmp-home-2026-10-25/...` üçü de **gitignored** (`.gitignore:2-4`) ve `git log --all` geçmişinde **0 commit** — anahtarlar yalnız diskte (karar C kapsamı, repo sızıntısı yok).

## Doğrulanan denetim maddeleri (önceki 20'lik listenin teyidi)
- **Fake-green kesin teşhis (kod düzeyi)**: `plugin\server\telemetry.ts:292-296` `cachedInputTokens/inputTokens*100` — Codex semantiğinde payda cache DÂHİL (doğru %), opencode/kilo tipinde cache DIŞI → `cacheHitPct=2253.1` gibi ham oranlar (telemetri.jsonl:769, 1003; 1099 turun 114'ünde pct>100). Kapı `saglik.ps1:110-115` ağırlıklı ortalamayla %175.1 ≥ eşik 40 → daima yeşil. Eşik 60→40 ezmesi (`hedefler.json:8`, `saglik.ps1:15`) **K kayıtsız**.
- **Kabul kapısı öz-bildirimli**: `saglik.ps1:120-127` yalnız plugin'in yazdığı telemetri `tip=kabul` olaylarını okur (288/292 = %98,6); **`plans\kabul.csv` scriptte hiç geçmiyor** (0 atıf). Gerçek defter: 115 satır — NOT_RUN=38 (%33), GECTI_HERMETIC=43, yeşil aile 71 (%61,7), **canlı-doğrulanmış 27 (%23,5)**.
- `ajanTemizle` **9 modülde duplike** (brief/finishgate/kapsam/loopguard/pitbull/kalite/modlar/onboarding/telemetry — 8'i tek-satır şablon kopyası, K-0025 yorumu birebir).
- `plugin\client\web.ts` **ölü** (0 import; 2026-10-13'ten beri). `core\package.json:11` test scripti 36/37 — **live-gates-v4 hiç koşulmuyor**.
- Kural-proxy **84 > 80** bağımsız sayımla doğru (ANAYASA 10 + AGENTS 5 + rehber 69) — K-0039 erte geçerli.
- `plugin\server\pano.ts:46` varsayılan eski ev; yazma **fail-closed** (token yoksa 403), UI salt-okur; `ordu\pano` VAR (10 dosya); **PANO_UI_DIR env tanımlı değil**.
- K-0029/K-0036 **diskte YOK** (Glob tam liste) — K-0029 13+ belgede karar gibi atıflı.

## Yeni bulgular (denetim listesinde olmayan)
- **N1** HANDOFF-1815'in echo bloğu **BOŞ** (son 5 halkada 4/5 dolu) — 1930'u yazan oturum kendi devrini damgalamamış. Düzeltme: gecikmeli echo append (bu turda işlendi).
- **N2** kabul.csv kanıt hijyeni: 115 satırın **yalnız 2'sinde** commit hash (%1,7) — kanıt alanı çoğunlukla test adı/EXIT koduna dayanıyor.
- **N3** Sürüm senkronu ihlali (ANAYASA A4/Z2): rehber v2.1 iken `PASEO-VERIMLILIK-PLANI.md:3,30` hâlâ "Plan v2.0 ... REHBER v2.0 ÇEKİRDEK".
- **N4** K-0000 "tek plan ilkesi" iki plan belgesinde atıflı, kararlar/ kaydı yok (düşük).
- **N5** `plugin\package.json:8,11` manifest `index.client.ts` + `index.server.tsx` listeliyor — diskte bu adlar YOK (yalnız .tsx/.ts karşılıkları).
- **N6** Düz metin anahtar envanteri güncel değil: `~/.paseo/config.json`'da **10 alan satırı / 5 farklı değer** (B11'in "6 kart/7 alan" sayısı bayat); aynı anahtar hem OPENAI_API_KEY hem CODEFAST_KIMI_API_KEY olarak 2 hesap taşıyor (`config.json:987-988`, B13).
- **N7** Restart ayrımı (DERSLER 131 inceltmesi): child-kill yalnız **disk config** tazeler; **env** çözümleri (PANO_UI_DIR, karar C setx) supervisor env mirası gerektirir → **tam restart**. Kod varsayılanı değişimi (pano.ts:46) child-kill (~30 sn) ile yeter. Restart penceresinde kesilenler: koşan ajanlar, schedule/heartbeat bir çevrim, MCP bağlantıları, pano SSE (5sn otomatik yeniden bağlanır).
- **N8** Doküman bayatlık listesi genişledi (16 bulgu + 5 çelişki): en risklisi **STATE_BOARD.md:25 kendi içinde çelişiyor** (bekleyen onaylarda F3 dururken satır 5-8 "F3 KAPALI" diyor); `core\KULLANIM.md:4` hâlâ eski köke koşturuyor; README/ANAYASA başlıkları "paseo-plugin"; ANAYASA A4 "şu an v2.0" (ANAYASA değişikliği = K kaydı + kullanıcı onayı).

## Çürütülen önbilgiler (denetim/gelen-kutu)
- "K-0034 dosyası yok" → **VAR** (kararlar/K-0034.md diskte; denetim OZET:11 zaten doğru, gelen-kutu B3 bayat).
- "plugin server'da başka ölü modüller" → **ÇÜRÜTÜLDÜ** (ayar/cekirdek/surum/rollup hepsi canlı import zincirinde).
- Kodemap dizin-sayı sapması kısmen tracked-vs-disk sayım yöntemi; HEAD damgası 2 commit geride (bootstrap gecikmesi, açıklanabilir) — codemap bu turda tazelenecek.

Damga (R): 2026-10-25 18:50, ajan = ana-ajan (Claude glm-5.3; 6 salt-okur subagent + bağımsız doğrulama), commit = bu turun devir commit'i; kod değişikliği YOK (yalnız rapor + plan + STATE + handoff halkası).
