# Paseo Model Benchmark — Top 30

**Kaynak:** `ordu-core/evidence/provider-bench-latest.html`
**Ölçüm tarihi:** 2026-10-17
**Kapsam:** 36 model, 7 sağlayıcı
**Sonuç:** 27 çalıştı, 9 hata verdi

## Not

- Canlı ağ erişimi bu turda kapalıydı; listeyi mevcut gerçek ölçüm kanıtından çıkardım.
- Sıralama `tokSnToplam` (toplam token/sn) değerine göre yapıldı.
- `—` değeri, o ölçümün bu satırda üretilemediğini gösterir.

## Top 30

| # | Provider | Model | Durum | TTFT ms | Üretim tok/sn | Toplam tok/sn | Çıktı tok |
|---:|---|---|---|---:|---:|---:|---:|
| 1 | groq | allam-2-7b | OK | 232 | 2137.09 | 728.07 | 256 |
| 2 | groq | openai/gpt-oss-20b | OK | 545 | — | 448.46 | 256 |
| 3 | groq | qwen/qwen3.8-27b | OK | 121 | 506.72 | 325.36 | 110 |
| 4 | groq | openai/gpt-oss-120b | OK | 310 | 852.65 | 318.89 | 158 |
| 5 | nvidia | google/diffusiongemma-26b-a4b-it | OK | 516 | — | 213.06 | 110 |
| 6 | openrouter | cohere/north-mini-code:free | OK | 552 | 551.13 | 174.59 | 141 |
| 7 | openrouter | liquid/lfm-2.5-2.6b:free | OK | — | — | 154.06 | 256 |
| 8 | openrouter | nvidia/nemotron-3.5-super-vl:free | OK | 1771 | 919.41 | 124.90 | 256 |
| 9 | nvidia | nvidia/nemotron-3.5-super-vl-120b-a12b | OK | — | — | 96.05 | 256 |
| 10 | tokenharbor | deepseek-v4.1-flash:free | OK | 1528 | 211.12 | 69.11 | 157 |
| 11 | openrouter | nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free | OK | 2868 | 188.66 | 68.71 | 310 |
| 12 | openrouter | openrouter/free | OK | 1155 | 145.26 | 67.60 | 146 |
| 13 | nvidia | nvidia/nemotron-3-super-120b-a12b | OK | 1348 | 160.49 | 65.44 | 149 |
| 14 | nvidia | stepfun-ai/step-5-preview | OK | 2017 | 144.24 | 56.99 | 190 |
| 15 | openrouter | nvidia/nemotron-3.5-content-safety:free | OK | 2751 | — | 50.89 | 143 |
| 16 | openrouter | dots-studio/dots-3-note-preview:free | OK | — | — | 48.93 | 256 |
| 17 | openrouter | nvidia/nemotron-3-super-120b-a12b:free | OK | 1349 | 60.68 | 38.69 | 144 |
| 18 | tokenharbor | deepseek-v4-flash:free | OK | 2717 | 134.12 | 35.66 | 132 |
| 19 | nvidia | nvidia/riva-translate-4b-instruct-v2 | OK | 244 | 53.19 | 27.63 | 14 |
| 20 | nvidia | meta/llama-3.2-11b-vision-instruct | OK | 337 | 29.38 | 27.56 | 150 |
| 21 | nvidia | poolside/laguna-xs-2.1 | OK | 285 | 29.42 | 27.34 | 110 |
| 22 | tokenharbor | mimo-v2.6-flash:free | OK | 2016 | 40.54 | 24.97 | 131 |
| 23 | tokenharbor | mimo-v2.5:free | OK | 3243 | 51.71 | 22.68 | 131 |
| 24 | openrouter | xingchen-agi/xing4.0-29b-a4b:free | OK | 36597 | — | 6.99 | 256 |
| 25 | openrouter | nvidia/nemotron-3.5-lightning:free | OK | — | — | 3.91 | 256 |
| 26 | openrouter | nvidia/nemotron-3-ultra-550b-a55b:free | OK | — | — | 2.46 | 1 |
| 27 | nvidia | nvidia/nemotron-3-nano-omni-30b-a3b-reasoning | OK | — | — | 2.39 | 1 |
| 28 | openrouter | google/gemma-4-31b-it:free | HATA | — | — | — | — |
| 29 | nvidia | google/gemma-4-31b-it | HATA | — | — | — | — |
| 30 | nvidia | z-ai/glm-5.3-flash | HATA | — | — | — | — |

