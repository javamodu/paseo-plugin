# UYGUNLUK — paseo-plugin · 2026-10-18
Profil: `scripts/uygunluk-hedefi.json` · Rapor: raporlar/bench-th-fixdogrulama-2026-10-15/bench.json
Agirliklar: kodTerminal=25 · baglam=15 · uzunUfuk=15 · erisim=20 · hiz=15 · agentik=10
Kapilar: terminal >= 4/5 · kod PASS · IQ >= 100 · ctx >= 256000 · tps >= 20 · zorunlu: toolCall

| # | model | seviye | karar | puan | kod+term | baglam | uzun ufuk | erisim | hiz | agentik | terminal | kod | IQ | tps | ctx | dis puan* |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | tokenharbor/deepseek-v4.1-flash:free | anaYazar | **KABUL** | 77.2 | 25 | 15 | 3.9 | 20 | 5.3 | 8 | 5/5 | PASS | 100 | 91.4 | 1048576 | — |
| 2 | tokenharbor/mimo-v2.6-flash:free | red | **RED** | 73.9 | 25 | 15 | 3.2 | 20 | 2.7 | 8 | 5/5 | PASS | 100 | 49.1 | 1048576 | — |
| 3 | tokenharbor/mimo-v2.5:free | yedek | **KABUL** | 72.7 | 25 | 15 | 3.3 | 20 | 1.4 | 8 | 5/5 | PASS | 100 | 27.2 | 1048576 | — |
| 4 | tokenharbor/claude-haiku-5.5:free | yedek | **KABUL** | 72.6 | 22 | 14.3 | 0 | 20 | 8.3 | 8 | 4/5 | PASS | 100 | 141.3 | 1000000 | — |
| 5 | tokenharbor/deepseek-v4-flash:free | red | **RED** | 62.2 | 10 | 14.3 | 5.2 | 20 | 4.7 | 8 | 0/5 | PASS | 100 | 81.4 | 1000000 | — |

## Kapı kırıkları
Kapı kırığı yok.

## Hiç ölçülmemiş (hedef bekleniyor)
- **tokenharbor/deepseek-v4.1-flash-1017** [yedek] — Ayni modelin tokenharbor UCRETLI rotasi (10-17 id'si): $0.14/$0.42 (tablonun en ucuz ucretli rotasi), ctx 1.048.576, toolCall+promptCache evet; yetenek kaniti kardes id'den aktarim (T). Kapi: 402 bakiye $0 (bench-th-1017-2026-10-17) · koşul: bakiye yuklenirse terminal >= 4/5 ve kod PASS olculmeli; aile kanidi 5/5+PASS (deepseek-v4.1-flash:free, R)
- **openrouter/cohere/north-mini-code:free** [gunluk] — 223.6 t/s, terminal 5/5, kod PASS; toplu uretim/olcum isleri. NOT: ctx 256.000 (kapi esigine esit) ve free kuyrugu var
- **codefast/kimi-k3** [ikincil] — En yseksek kapasite (Vals TB2.1 80.9 / SWE-bench 93.4 / kod lane 58.9 #22; ajan hatti 300.1 t/s olculmus 2026-10-14). ANCAK kapi KAPALI: 2026-10-17 canli taramada kimi-k3-unlimited-api /models = 403 NO_ACTIVE_PACKAGE, ajan hatti 403 API access denied · koşul: Paket/PAYG yeniden alinmali (kimi: NO_ACTIVE_PACKAGE; diger kapilar: PAYG_DISABLED) -> kimi-k3-unlimited-api /models 200 donmeli, sonra terminal >= 4/5 ve kod PASS
- **codefast-glm/glm-5.3** [gunluk] — KULLANICI TALIMATI (2026-10-18): gunluk modele yukseltildi. GERCEK OLcum (2026-10-18, R): 79.5 t/s, terminal 5/5, kod PASS, uyum PASS (bench-glm-2026-10-18). ANCAK IQ probu 0/6 (C1-C6 tamamen kacti; SWE-bench 95.4 ile celisir - format/parse suphesi) -> IQ>=100 kapisi kirik, gate izlemede. Vals SWE 95.4 (en yuksek), lane 70.2 #8/128, $1.40/$4.40. NOT: 'claudecode altinda' istendi ama glm-api Anthropic-uyumlu /v1/messages kapisi hatali (Hata Olustu, R 17:52) - Claude Code yolu kapali, calisan kapi OpenAI-uyumlu codefast-glm · koşul: IQ yeniden olcum (format duzeltmesiyle) IQ >= 100 saglanmali; saglanirsa anaYazar adayi (terminal+kod+hiz kanitlari zaten yerinde). Claude Code kullanimi icin glm-api /v1/messages duzelmesi veya Anthropic-uyumlu proxy gerekir
- **codefast/deepseek-v4-pro** [ikincil] — En ucuz ($1.32/$3.96) + en hizli (~115 t/s); kod lane 47.2 daha dusuk · koşul: bakiye acilirsa ham olcum terminal >= 4/5
- **qoder/qfmodel** [aday] — Qwen3.8-Flash, 0.00x Credit; makinede hic olculmedi · koşul: scripts/bench.mjs ACP olcumu (base_url yok -> ham API olculmez); en az 1 ham olcum veya ajan hatti t/s
- **openrouter/qwen3.8-max** [aday] — Vals TB2.1 67.4 / SWE-bench 85.6 geride; codefast katalogunda yok · koşul: OpenRouter anahtari + modelin free havuzuna girmesi (kodfast katalogunda YOK)
- **nvidia/z-ai/glm-5.3-flash** [red] — 1.2 t/s - kullanilamaz
- **kilo/free** [red] — gunluk free-models-per-day limiti, 0 token
- **openrouter/poolside-laguna** [red] — 1.6-2.5 t/s + bir kosuda NUM=401 sapmasi

## Profilde olup raporda olmayan modeller için koşul
- tokenharbor/deepseek-v4.1-flash-1017: bakiye yuklenirse terminal >= 4/5 ve kod PASS olculmeli; aile kanidi 5/5+PASS (deepseek-v4.1-flash:free, R).
- openrouter/cohere/north-mini-code:free: (koşul yazılmamış — profille).
- codefast/kimi-k3: Paket/PAYG yeniden alinmali (kimi: NO_ACTIVE_PACKAGE; diger kapilar: PAYG_DISABLED) -> kimi-k3-unlimited-api /models 200 donmeli, sonra terminal >= 4/5 ve kod PASS.
- codefast-glm/glm-5.3: IQ yeniden olcum (format duzeltmesiyle) IQ >= 100 saglanmali; saglanirsa anaYazar adayi (terminal+kod+hiz kanitlari zaten yerinde). Claude Code kullanimi icin glm-api /v1/messages duzelmesi veya Anthropic-uyumlu proxy gerekir.
- codefast/deepseek-v4-pro: bakiye acilirsa ham olcum terminal >= 4/5.
- qoder/qfmodel: scripts/bench.mjs ACP olcumu (base_url yok -> ham API olculmez); en az 1 ham olcum veya ajan hatti t/s.
- openrouter/qwen3.8-max: OpenRouter anahtari + modelin free havuzuna girmesi (kodfast katalogunda YOK).
- nvidia/z-ai/glm-5.3-flash: (koşul yazılmamış — profille).
- kilo/free: (koşul yazılmamış — profille).
- openrouter/poolside-laguna: (koşul yazılmamış — profille).

## Kural çizgisi
- Gate uygulanan seviyeler: anaYazar, gunluk
- Gate sonucu: GECTI
- Ana yazar boşluğu: yok
- Puan = yalnız yerel ölçüm (bench.json). `*` dış puan karar puanına karıştırılmaz.