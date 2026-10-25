# UYGUNLUK — paseo-plugin · 2026-10-17
Profil: `scripts/uygunluk-hedefi.json` · Rapor: raporlar/bench-2026-10-14/bench.json, raporlar/bench-smoke/bench.json, raporlar/bench-free-2026-10-15/bench.json, raporlar/bench-free-2026-10-15-tirmanma/bench.json, raporlar/bench-codefast-fix-2026-10-15/bench.json, raporlar/bench-or-2026-10-15/bench.json, raporlar/bench-th-fixdogrulama-2026-10-15/bench.json, raporlar/bench-kimi-2026-10-17/bench.json, raporlar/bench-th-2026-10-17/bench.json, raporlar/bench-th-1017-2026-10-17/bench.json, raporlar/bench-groq-2026-10-17/bench.json, raporlar/bench-dortlu-2026-10-17/bench.json
Agirliklar: kodTerminal=25 · baglam=15 · uzunUfuk=15 · erisim=20 · hiz=15 · agentik=10
Kapilar: terminal >= 4/5 · kod PASS · IQ >= 100 · ctx >= 256000 · tps >= 20 · zorunlu: toolCall

| # | model | seviye | karar | puan | kod+term | baglam | uzun ufuk | erisim | hiz | agentik | terminal | kod | IQ | tps | ctx | dis puan* |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | openrouter/cohere/north-mini-code:free | gunluk | **KABUL** | 82.1 | 25 | 2.9 | 10.8 | 20 | 13.4 | 10 | 5/5 | PASS | 100 | 223.6 | 256000 | — |
| 2 | tokenharbor/deepseek-v4.1-flash:free | anaYazar | **KABUL** | 77.2 | 25 | 15 | 3.9 | 20 | 5.3 | 8 | 5/5 | PASS | 100 | 91.4 | 1048576 | — |
| 3 | tokenharbor/mimo-v2.6-flash:free | red | **RED** | 73.9 | 25 | 15 | 3.2 | 20 | 2.7 | 8 | 5/5 | PASS | 100 | 49.1 | 1048576 | — |
| 4 | tokenharbor/mimo-v2.5:free | yedek | **KABUL** | 72.7 | 25 | 15 | 3.3 | 20 | 1.4 | 8 | 5/5 | PASS | 100 | 27.2 | 1048576 | — |
| 5 | tokenharbor/claude-haiku-5.5:free | yedek | **KABUL** | 72.6 | 22 | 14.3 | 0 | 20 | 8.3 | 8 | 4/5 | PASS | 100 | 141.3 | 1000000 | — |
| 6 | codefast/codefastk3unlimited | yedek | **KABUL** | 70.4 | 25 | 2.9 | 9.5 | 20 | 3 | 10 | 5/5 | PASS | 100 | 53.9 | 256000 | — |
| 7 | tokenharbor/deepseek-v4-flash:free | red | **RED** | 62.2 | 10 | 14.3 | 5.2 | 20 | 4.7 | 8 | 0/5 | PASS | 100 | 81.4 | 1000000 | — |
| 8 | codefast/kimi-k3 | ikincil | **KIRIK** | 40 | 0 | 2.9 | 7.3 | 20 | 1.8 | 8 | 0/5 | FAIL:fonksiyon bulunamadi | 100 | 35.1 | 256000 | 58.9 / 69.4 |
| 9 | codefast-glm/glm-5.3 | ikincil | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | 56.4 / 70.2 |
| 10 | codefast-os/deepseek-v4-flash | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 11 | codefast-os/deepseek-v4-pro | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 12 | codefast-os/glm-5.1 | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 13 | codefast-os/glm-5.2 | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 14 | codefast-os/glm-5.3 | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | 56.4 / 70.2 |
| 15 | codefast-os/gpt-oss-120b-medium | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 16 | codefast-os/kimi-k3 | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | 58.9 / 69.4 |
| 17 | codefast-os/mimo-v2.5-pro | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 18 | codefast-os/minimax-m3 | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 19 | codefast-os/nvidia/nemotron-3-ultra-550b-a55b | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 20 | codefast-os/stepfun-ai/step-3.7-flash | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 21 | codex/gpt-5.5 | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 22 | codex/gpt-5.6-luna | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 23 | codex/gpt-5.6-sol | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 24 | codex/gpt-5.6-terra | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 25 | codex/gpt-6-astra | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 26 | codex/gpt-6-luna | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 27 | codex/gpt-6-sol | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 28 | codex/gpt-6.1-sol | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 29 | codex/kimi-K3 | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 30 | groq/allam-2-7b | aday | **BEKLENIYOR** | — | 0 | 0 | 0 | 20 | 15 | 0 | 0/5 | FAIL:bek=220,0,56 got=9,NaN,4 | 0 | 1242.2 | 4096 | — |
| 31 | groq/openai/gpt-oss-120b | aday | **BEKLENIYOR** | — | 25 | 1 | 8.9 | 20 | 15 | 2 | 5/5 | PASS | 100 | 296.1 | 131072 | — |
| 32 | groq/openai/gpt-oss-20b | aday | **BEKLENIYOR** | — | 25 | 1 | 6.9 | 20 | 15 | 2 | 5/5 | PASS | 100 | 448.9 | 131072 | — |
| 33 | groq/qwen/qwen3.8-27b | aday | **BEKLENIYOR** | — | 25 | 1 | 0 | 20 | 15 | 2 | 5/5 | PASS | 33 | 369.9 | 131072 | — |
| 34 | kilo/Kilo Gateway/StepFun: Step 5 Preview (free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 35 | kilo/kilo/cohere/north-mini-code:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 36 | kilo/kilo/dots-studio/dots-3-note-preview:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 37 | kilo/kilo/kilo-auto/free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 38 | kilo/kilo/liquid/lfm-2.5-2.6b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 39 | kilo/kilo/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 40 | kilo/kilo/nvidia/nemotron-3-super-120b-a12b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 41 | kilo/kilo/nvidia/nemotron-3-ultra-550b-a55b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 42 | kilo/kilo/nvidia/nemotron-3.5-lightning:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 43 | kilo/kilo/openrouter/free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 44 | kilo/kilo/poolside/laguna-s-2.1:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 45 | kilo/kilo/poolside/laguna-xs-2.1:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 46 | kilo/kilo/stealth/glyph-cluster | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 47 | kilo/kilo/stepfun/step-5-preview-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 48 | kilo/kilo/thinkingmachines/inkling-small:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 49 | kilo/OpenCode Zen/Muse Spark 1.3 Free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 50 | kilo/OpenCode Zen/Space Bunny Free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 51 | kilo/opencode/cat-jam-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 52 | kilo/opencode/exo-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 53 | kilo/opencode/longcat-2.5-preview-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 54 | kilo/opencode/mimo-v2.6-flash-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 55 | kilo/opencode/muse-spark-1.3-contributor-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 56 | kilo/opencode/nemotron-3-ultra-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 57 | kilo/opencode/nemotron-3.5-lightning-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 58 | kilo/opencode/space-bunny-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 59 | kilo/opencode/step-5-preview-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 60 | kilo/openrouter/cohere/north-mini-code:free | gunluk | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 61 | kilo/openrouter/dots-studio/dots-3-note-preview:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 62 | kilo/openrouter/google/gemma-4-26b-a4b-it:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 63 | kilo/openrouter/google/gemma-4-31b-it:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 64 | kilo/openrouter/liquid/lfm-2.5-2.6b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 65 | kilo/openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 66 | kilo/openrouter/nvidia/nemotron-3-super-120b-a12b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 67 | kilo/openrouter/nvidia/nemotron-3-ultra-550b-a55b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 68 | kilo/openrouter/nvidia/nemotron-3.5-content-safety:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 69 | kilo/openrouter/nvidia/nemotron-3.5-lightning:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 70 | kilo/openrouter/openrouter/free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 71 | kilo/openrouter/poolside/laguna-s-2.1:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 72 | kilo/openrouter/poolside/laguna-xs-2.1:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 73 | kilo/openrouter/thinkingmachines/inkling-small:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 74 | kilo/openrouter/thinkingmachines/inkling:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 75 | opencode/DeepSeek V4 Flash Free (New) | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 76 | opencode/opencode/cat-jam-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 77 | opencode/opencode/exo-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 78 | opencode/opencode/longcat-2.5-preview-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 79 | opencode/opencode/mimo-v2.6-flash-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 80 | opencode/opencode/muse-spark-1.3-contributor-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 81 | opencode/opencode/nemotron-3-ultra-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 82 | opencode/opencode/nemotron-3.5-lightning-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 83 | opencode/opencode/space-bunny-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 84 | opencode/opencode/step-5-preview-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 85 | opencode/openrouter/cohere/north-mini-code:free | gunluk | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 86 | opencode/openrouter/dots-studio/dots-3-note-preview:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 87 | opencode/openrouter/google/gemma-4-26b-a4b-it:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 88 | opencode/openrouter/google/gemma-4-31b-it:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 89 | opencode/openrouter/liquid/lfm-2.5-2.6b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 90 | opencode/openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 91 | opencode/openrouter/nvidia/nemotron-3-super-120b-a12b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 92 | opencode/openrouter/nvidia/nemotron-3-ultra-550b-a55b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 93 | opencode/openrouter/nvidia/nemotron-3.5-content-safety:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 94 | opencode/openrouter/nvidia/nemotron-3.5-lightning:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 95 | opencode/openrouter/openrouter/free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 96 | opencode/openrouter/poolside/laguna-s-2.1:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 97 | opencode/openrouter/poolside/laguna-xs-2.1:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 98 | opencode/openrouter/thinkingmachines/inkling-small:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 99 | opencode/openrouter/thinkingmachines/inkling:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 100 | opencode/Space Bunny Free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 101 | opencode/Step 5 Preview Free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 102 | qoder/qfmodel | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 103 | qoder/Qwen3.8-Flash (default) | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 104 | tokenharbor/deepseek-v4-pro | aday | **BEKLENIYOR** | — | 0 | — | 0 | 4 | — | 6 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 105 | tokenharbor/deepseek-v4.1-flash-1017 | aday | **BEKLENIYOR** | — | 0 | 15 | 0 | 4 | — | 6 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | 1048576 | — |
| 106 | tokenharbor/glm-5.3 | aday | **BEKLENIYOR** | — | 0 | 2.1 | 0 | 4 | — | 6 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | 200000 | 56.4 / 70.2 |
| 107 | tokenharbor/kimi-k3 | aday | **BEKLENIYOR** | — | 0 | 15 | 0 | 4 | — | 6 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | 1048576 | 58.9 / 69.4 |
| 108 | tokenharbor/qwen3.8-max | aday | **BEKLENIYOR** | — | 0 | — | 0 | 4 | — | 6 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |

## Kapı kırıkları
- **codefast/kimi-k3** (ikincil): terminal >= 4/5=0/5, kod PASS=FAIL:fonksiyon bulunamadi

## Hiç ölçülmemiş (hedef bekleniyor)
- **codefast/deepseek-v4-pro** [ikincil] — En ucuz ($1.32/$3.96) + en hizli (~115 t/s); kod lane 47.2 daha dusuk · koşul: bakiye acilirsa ham olcum terminal >= 4/5
- **openrouter/qwen3.8-max** [aday] — Vals TB2.1 67.4 / SWE-bench 85.6 geride; codefast katalogunda yok · koşul: OpenRouter anahtari + modelin free havuzuna girmesi (kodfast katalogunda YOK)
- **nvidia/z-ai/glm-5.3-flash** [red] — 1.2 t/s - kullanilamaz
- **kilo/free** [red] — gunluk free-models-per-day limiti, 0 token
- **openrouter/poolside-laguna** [red] — 1.6-2.5 t/s + bir kosuda NUM=401 sapmasi

## Profilde olup raporda olmayan modeller için koşul
- codefast/deepseek-v4-pro: bakiye acilirsa ham olcum terminal >= 4/5.
- openrouter/qwen3.8-max: OpenRouter anahtari + modelin free havuzuna girmesi (kodfast katalogunda YOK).
- nvidia/z-ai/glm-5.3-flash: (koşul yazılmamış — profille).
- kilo/free: (koşul yazılmamış — profille).
- openrouter/poolside-laguna: (koşul yazılmamış — profille).

## Kural çizgisi
- Gate uygulanan seviyeler: anaYazar, gunluk
- Gate sonucu: KIRILDI -> kilo/openrouter/cohere/north-mini-code:free, opencode/openrouter/cohere/north-mini-code:free
- Ana yazar boşluğu: yok
- Puan = yalnız yerel ölçüm (bench.json). `*` dış puan karar puanına karıştırılmaz.