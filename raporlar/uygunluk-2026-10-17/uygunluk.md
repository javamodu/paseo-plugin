# UYGUNLUK — paseo-plugin · 2026-10-17
Profil: `scripts/uygunluk-hedefi.json` · Rapor: raporlar/bench-free-2026-10-15/bench.json, raporlar/bench-th-fixdogrulama-2026-10-15/bench.json, raporlar/bench-or-2026-10-15/bench.json, raporlar/bench-groq-2026-10-17/bench.json, raporlar/bench-th-2026-10-17/bench.json, raporlar/bench-th-1017-2026-10-17/bench.json
Agirliklar: kodTerminal=25 · baglam=15 · uzunUfuk=15 · erisim=20 · hiz=15 · agentik=10
Kapilar: terminal >= 4/5 · kod PASS · IQ >= 100 · ctx >= 256000 · tps >= 20 · zorunlu: toolCall

| # | model | seviye | karar | puan | kod+term | baglam | uzun ufuk | erisim | hiz | agentik | terminal | kod | IQ | tps | ctx | dis puan* |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | openrouter/cohere/north-mini-code:free | gunluk | **KABUL** | 82.1 | 25 | 2.9 | 10.8 | 20 | 13.4 | 10 | 5/5 | PASS | 100 | 223.6 | 256000 | — |
| 2 | tokenharbor/deepseek-v4.1-flash:free | anaYazar | **KABUL** | 77.2 | 25 | 15 | 3.9 | 20 | 5.3 | 8 | 5/5 | PASS | 100 | 91.4 | 1048576 | — |
| 3 | tokenharbor/mimo-v2.6-flash:free | red | **RED** | 73.9 | 25 | 15 | 3.2 | 20 | 2.7 | 8 | 5/5 | PASS | 100 | 49.1 | 1048576 | — |
| 4 | tokenharbor/mimo-v2.5:free | yedek | **KABUL** | 72.7 | 25 | 15 | 3.3 | 20 | 1.4 | 8 | 5/5 | PASS | 100 | 27.2 | 1048576 | — |
| 5 | tokenharbor/claude-haiku-5.5:free | yedek | **KABUL** | 72.6 | 22 | 14.3 | 0 | 20 | 8.3 | 8 | 4/5 | PASS | 100 | 141.3 | 1000000 | — |
| 6 | tokenharbor/deepseek-v4-flash:free | red | **RED** | 62.2 | 10 | 14.3 | 5.2 | 20 | 4.7 | 8 | 0/5 | PASS | 100 | 81.4 | 1000000 | — |
| 7 | codefast/kimi-k3 | ikincil | **KIRIK** | 40 | 0 | 2.9 | 7.3 | 20 | 1.8 | 8 | 0/5 | FAIL:fonksiyon bulunamadi | 100 | 35.1 | 256000 | 58.9 / 69.4 |
| 8 | codefast/codefastk3unlimited | aday | **BEKLENIYOR** | — | 0 | 2.9 | 0 | 2 | — | 8 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | 256000 | — |
| 9 | groq/allam-2-7b | aday | **BEKLENIYOR** | — | 0 | 0 | 0 | 20 | 15 | 0 | 0/5 | FAIL:bek=220,0,56 got=9,NaN,4 | 0 | 1242.2 | 4096 | — |
| 10 | groq/openai/gpt-oss-120b | aday | **BEKLENIYOR** | — | 25 | 1 | 8.9 | 20 | 15 | 2 | 5/5 | PASS | 100 | 296.1 | 131072 | — |
| 11 | groq/openai/gpt-oss-20b | aday | **BEKLENIYOR** | — | 25 | 1 | 6.9 | 20 | 15 | 2 | 5/5 | PASS | 100 | 448.9 | 131072 | — |
| 12 | groq/qwen/qwen3.8-27b | aday | **BEKLENIYOR** | — | 25 | 1 | 0 | 20 | 15 | 2 | 5/5 | PASS | 33 | 369.9 | 131072 | — |
| 13 | tokenharbor/deepseek-v4.1-flash-1017 | aday | **BEKLENIYOR** | — | 0 | 15 | 0 | 4 | — | 6 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | 1048576 | — |

## Kapı kırıkları
- **codefast/kimi-k3** (ikincil): terminal >= 4/5=0/5, kod PASS=FAIL:fonksiyon bulunamadi

## Hiç ölçülmemiş (hedef bekleniyor)
- **codefast-glm/glm-5.3** [ikincil] — Vals SWE-bench 95.4 (en yuksek), agentik lane 70.2 (#8/128), 83 t/s, $1.40/$4.40; kapisi 403 API access denied · koşul: bakiye/entitlement acilirsa glm-api /models 200 donmeli, sonra terminal >= 4/5 ve kod PASS
- **codefast/deepseek-v4-pro** [ikincil] — En ucuz ($1.32/$3.96) + en hizli (~115 t/s); kod lane 47.2 daha dusuk · koşul: bakiye acilirsa ham olcum terminal >= 4/5
- **qoder/qfmodel** [aday] — Qwen3.8-Flash, 0.00x Credit; makinede hic olculmedi · koşul: scripts/bench.mjs ACP olcumu (base_url yok -> ham API olculmez); en az 1 ham olcum veya ajan hatti t/s
- **openrouter/qwen3.8-max** [aday] — Vals TB2.1 67.4 / SWE-bench 85.6 geride; codefast katalogunda yok · koşul: OpenRouter anahtari + modelin free havuzuna girmesi (kodfast katalogunda YOK)
- **nvidia/z-ai/glm-5.3-flash** [red] — 1.2 t/s - kullanilamaz
- **kilo/free** [red] — gunluk free-models-per-day limiti, 0 token
- **openrouter/poolside-laguna** [red] — 1.6-2.5 t/s + bir kosuda NUM=401 sapmasi

## Profilde olup raporda olmayan modeller için koşul
- codefast-glm/glm-5.3: bakiye/entitlement acilirsa glm-api /models 200 donmeli, sonra terminal >= 4/5 ve kod PASS.
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