# UYGUNLUK — paseo-plugin · 2026-10-18
Profil: `scripts/uygunluk-hedefi.json` · Rapor: raporlar/bench-2026-10-14/bench.json, raporlar/bench-smoke/bench.json, raporlar/bench-free-2026-10-15/bench.json, raporlar/bench-free-2026-10-15-tirmanma/bench.json, raporlar/bench-codefast-fix-2026-10-15/bench.json, raporlar/bench-or-2026-10-15/bench.json, raporlar/bench-th-fixdogrulama-2026-10-15/bench.json, raporlar/bench-kimi-2026-10-17/bench.json, raporlar/bench-th-2026-10-17/bench.json, raporlar/bench-th-1017-2026-10-17/bench.json, raporlar/bench-groq-2026-10-17/bench.json, raporlar/bench-dortlu-2026-10-17/bench.json, raporlar/bench-glm-2026-10-18/bench.json, raporlar/bench-serbest-2026-10-18/bench.json, raporlar/bench-glm-claude-2026-10-18/bench.json
Agirliklar: kodTerminal=25 · baglam=15 · uzunUfuk=15 · erisim=20 · hiz=15 · agentik=10
Kapilar: terminal >= 4/5 · kod PASS · IQ >= 100 · ctx >= 256000 · tps >= 20 · zorunlu: toolCall

| # | model | seviye | karar | puan | kod+term | baglam | uzun ufuk | erisim | hiz | agentik | terminal | kod | IQ | tps | ctx | dis puan* |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | openrouter/nvidia/nemotron-3-ultra-550b-a55b:free | yedek | **KABUL** | 83.2 | 25 | 14.3 | 6.3 | 20 | 7.6 | 10 | 5/5 | PASS | 100 | 129.9 | 1000000 | — |
| 2 | tokenharbor/deepseek-v4.1-flash:free | anaYazar | **KABUL** | 77.2 | 25 | 15 | 3.9 | 20 | 5.3 | 8 | 5/5 | PASS | 100 | 91.4 | 1048576 | — |
| 3 | openrouter/dots-studio/dots-3-note-preview:free | yedek | **KABUL** | 76.6 | 25 | 6.8 | 9.1 | 20 | 5.7 | 10 | 5/5 | PASS | 100 | 98.6 | 512000 | — |
| 4 | tokenharbor/mimo-v2.6-flash:free | red | **RED** | 73.9 | 25 | 15 | 3.2 | 20 | 2.7 | 8 | 5/5 | PASS | 100 | 49.1 | 1048576 | — |
| 5 | tokenharbor/mimo-v2.5:free | yedek | **KABUL** | 72.7 | 25 | 15 | 3.3 | 20 | 1.4 | 8 | 5/5 | PASS | 100 | 27.2 | 1048576 | — |
| 6 | tokenharbor/claude-haiku-5.5:free | yedek | **KABUL** | 72.6 | 22 | 14.3 | 0 | 20 | 8.3 | 8 | 4/5 | PASS | 100 | 141.3 | 1000000 | — |
| 7 | codefast/codefastk3unlimited | yedek | **KABUL** | 70.4 | 25 | 2.9 | 9.5 | 20 | 3 | 10 | 5/5 | PASS | 100 | 53.9 | 256000 | — |
| 8 | openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free | yedek | **KABUL** | 67.1 | 25 | 2.9 | 8.9 | 20 | 2.3 | 8 | 5/5 | PASS | 100 | 42.5 | 256000 | — |
| 9 | openrouter/cohere/north-mini-code:free | gunluk | **KABUL** | 66.1 | 22 | 2.9 | 8.6 | 20 | 2.6 | 10 | 4/5 | PASS | 100 | 47.8 | 256000 | — |
| 10 | tokenharbor/deepseek-v4-flash:free | red | **RED** | 62.2 | 10 | 14.3 | 5.2 | 20 | 4.7 | 8 | 0/5 | PASS | 100 | 81.4 | 1000000 | — |
| 11 | openrouter/liquid/lfm-2.5-2.6b:free | yedek | **KIRIK** | 60 | 0 | 0 | 15 | 20 | 15 | 10 | 0/5 | FAIL:bek=220,0,56 got=385,0,91 | 0 | 266.1 | 65536 | — |
| 12 | openrouter/nvidia/nemotron-3-super-120b-a12b:free | yedek | **KIRIK** | 54.2 | 10 | 3 | 7.8 | 20 | 3.4 | 10 | 0/5 | PASS | 100 | 60.8 | 262144 | — |
| 13 | codefast/kimi-k3 | ikincil | **KIRIK** | 40 | 0 | 2.9 | 7.3 | 20 | 1.8 | 8 | 0/5 | FAIL:fonksiyon bulunamadi | 100 | 35.1 | 256000 | 58.9 / 69.4 |
| 14 | openrouter/nvidia/nemotron-3.5-content-safety:free | yedek | **KIRIK** | 26.2 | 0 | 1 | 1.3 | 20 | 3.9 | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | 68.2 | 128000 | — |
| 15 | claude-glm/glm-5.3 | gunluk | **BEKLENIYOR** | — | 25 | — | 0 | 20 | 1.1 | 2 | 5/5 | PASS | 100 | 22.6 | — | 56.4 / 70.2 |
| 16 | codefast-glm/glm-5.3 | gunluk | **BEKLENIYOR** | — | 25 | — | 0 | 20 | 4.6 | 2 | 5/5 | PASS | 0 | 79.5 | — | 56.4 / 70.2 |
| 17 | codefast-os/deepseek-v4-flash | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 18 | codefast-os/deepseek-v4-pro | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 19 | codefast-os/glm-5.1 | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 20 | codefast-os/glm-5.2 | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 21 | codefast-os/glm-5.3 | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | 56.4 / 70.2 |
| 22 | codefast-os/gpt-oss-120b-medium | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 23 | codefast-os/kimi-k3 | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | 58.9 / 69.4 |
| 24 | codefast-os/mimo-v2.5-pro | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 25 | codefast-os/minimax-m3 | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 26 | codefast-os/nvidia/nemotron-3-ultra-550b-a55b | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 27 | codefast-os/stepfun-ai/step-3.7-flash | aday | **BEKLENIYOR** | — | 0 | — | 0 | 2 | — | 0 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 28 | codex/gpt-5.5 | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 29 | codex/gpt-5.6-luna | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 30 | codex/gpt-5.6-sol | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 31 | codex/gpt-5.6-terra | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 32 | codex/gpt-6-astra | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 33 | codex/gpt-6-luna | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 34 | codex/gpt-6-sol | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 35 | codex/gpt-6.1-sol | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 36 | codex/kimi-K3 | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 37 | groq/allam-2-7b | aday | **BEKLENIYOR** | — | 0 | 0 | 0 | 20 | 15 | 0 | 0/5 | FAIL:bek=220,0,56 got=9,NaN,4 | 0 | 1204.8 | 4096 | — |
| 38 | groq/openai/gpt-oss-120b | aday | **BEKLENIYOR** | — | 25 | 1 | 9.9 | 20 | 15 | 2 | 5/5 | PASS | 100 | 261.4 | 131072 | — |
| 39 | groq/openai/gpt-oss-20b | aday | **BEKLENIYOR** | — | 25 | 1 | 6.5 | 20 | 15 | 2 | 5/5 | PASS | 100 | 583.8 | 131072 | — |
| 40 | groq/qwen/qwen3.8-27b | aday | **BEKLENIYOR** | — | 25 | 1 | 0 | 20 | 15 | 2 | 5/5 | PASS | 33 | 348.9 | 131072 | — |
| 41 | kilo/Kilo Gateway/StepFun: Step 5 Preview (free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 42 | kilo/kilo/cohere/north-mini-code:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 43 | kilo/kilo/dots-studio/dots-3-note-preview:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 44 | kilo/kilo/kilo-auto/free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 45 | kilo/kilo/liquid/lfm-2.5-2.6b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 46 | kilo/kilo/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 47 | kilo/kilo/nvidia/nemotron-3-super-120b-a12b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 48 | kilo/kilo/nvidia/nemotron-3-ultra-550b-a55b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 49 | kilo/kilo/nvidia/nemotron-3.5-lightning:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 50 | kilo/kilo/openrouter/free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 51 | kilo/kilo/poolside/laguna-s-2.1:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 52 | kilo/kilo/poolside/laguna-xs-2.1:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 53 | kilo/kilo/stealth/glyph-cluster | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 54 | kilo/kilo/stepfun/step-5-preview-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 55 | kilo/kilo/thinkingmachines/inkling-small:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 56 | kilo/OpenCode Zen/Muse Spark 1.3 Free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 57 | kilo/OpenCode Zen/Space Bunny Free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 58 | kilo/opencode/cat-jam-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 59 | kilo/opencode/exo-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 60 | kilo/opencode/longcat-2.5-preview-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 61 | kilo/opencode/mimo-v2.6-flash-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 62 | kilo/opencode/muse-spark-1.3-contributor-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 63 | kilo/opencode/nemotron-3-ultra-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 64 | kilo/opencode/nemotron-3.5-lightning-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 65 | kilo/opencode/space-bunny-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 66 | kilo/opencode/step-5-preview-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 67 | kilo/openrouter/cohere/north-mini-code:free | gunluk | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 68 | kilo/openrouter/dots-studio/dots-3-note-preview:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 69 | kilo/openrouter/google/gemma-4-26b-a4b-it:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 70 | kilo/openrouter/google/gemma-4-31b-it:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 71 | kilo/openrouter/liquid/lfm-2.5-2.6b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 72 | kilo/openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 73 | kilo/openrouter/nvidia/nemotron-3-super-120b-a12b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 74 | kilo/openrouter/nvidia/nemotron-3-ultra-550b-a55b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 75 | kilo/openrouter/nvidia/nemotron-3.5-content-safety:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 76 | kilo/openrouter/nvidia/nemotron-3.5-lightning:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 77 | kilo/openrouter/openrouter/free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 78 | kilo/openrouter/poolside/laguna-s-2.1:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 79 | kilo/openrouter/poolside/laguna-xs-2.1:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 80 | kilo/openrouter/thinkingmachines/inkling-small:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 81 | kilo/openrouter/thinkingmachines/inkling:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 82 | opencode/DeepSeek V4 Flash Free (New) | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 83 | opencode/opencode/cat-jam-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 84 | opencode/opencode/exo-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 85 | opencode/opencode/longcat-2.5-preview-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 86 | opencode/opencode/mimo-v2.6-flash-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 87 | opencode/opencode/muse-spark-1.3-contributor-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 88 | opencode/opencode/nemotron-3-ultra-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 89 | opencode/opencode/nemotron-3.5-lightning-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 90 | opencode/opencode/space-bunny-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 91 | opencode/opencode/step-5-preview-free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 92 | opencode/openrouter/cohere/north-mini-code:free | gunluk | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 93 | opencode/openrouter/dots-studio/dots-3-note-preview:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 94 | opencode/openrouter/google/gemma-4-26b-a4b-it:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 95 | opencode/openrouter/google/gemma-4-31b-it:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 96 | opencode/openrouter/liquid/lfm-2.5-2.6b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 97 | opencode/openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 98 | opencode/openrouter/nvidia/nemotron-3-super-120b-a12b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 99 | opencode/openrouter/nvidia/nemotron-3-ultra-550b-a55b:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 100 | opencode/openrouter/nvidia/nemotron-3.5-content-safety:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 101 | opencode/openrouter/nvidia/nemotron-3.5-lightning:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 102 | opencode/openrouter/openrouter/free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 103 | opencode/openrouter/poolside/laguna-s-2.1:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 104 | opencode/openrouter/poolside/laguna-xs-2.1:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 105 | opencode/openrouter/thinkingmachines/inkling-small:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 106 | opencode/openrouter/thinkingmachines/inkling:free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 107 | opencode/Space Bunny Free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 108 | opencode/Step 5 Preview Free | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 109 | openrouter/deepseek/deepseek-v4.1-flash-1017 | aday | **BEKLENIYOR** | — | 10 | 15 | 0 | 0 | — | 10 | 0/5 | PASS | 0 | — | 1048576 | — |
| 110 | openrouter/google/gemma-4-26b-a4b-it:free | aday | **BEKLENIYOR** | — | 0 | 3 | 0 | 0 | — | 8 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | 262144 | — |
| 111 | openrouter/google/gemma-4-31b-it:free | aday | **BEKLENIYOR** | — | 0 | 3 | 0 | 0 | — | 8 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | 262144 | — |
| 112 | openrouter/nvidia/nemotron-3.5-lightning:free | aday | **BEKLENIYOR** | — | 0 | 14.3 | 0 | 4 | — | 8 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | 1000000 | — |
| 113 | openrouter/poolside/laguna-s-2.1:free | aday | **BEKLENIYOR** | — | 0 | 3 | 0 | 4 | — | 6 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | 262144 | — |
| 114 | openrouter/poolside/laguna-xs-2.1:free | aday | **BEKLENIYOR** | — | 0 | 3 | 0 | 4 | — | 6 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | 262144 | — |
| 115 | openrouter/thinkingmachines/inkling-small:free | aday | **BEKLENIYOR** | — | 0 | 15 | 0 | 0 | — | 8 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | 1048576 | — |
| 116 | openrouter/thinkingmachines/inkling:free | aday | **BEKLENIYOR** | — | 0 | 15 | 0 | 0 | — | 8 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | 1048576 | — |
| 117 | qoder/qfmodel | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 118 | qoder/Qwen3.8-Flash (default) | aday | **BEKLENIYOR** | — | — | — | 0 | 0 | — | 0 | — | — | 0 | — | — | — |
| 119 | tokenharbor/deepseek-v4-pro | aday | **BEKLENIYOR** | — | 0 | — | 0 | 4 | — | 6 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |
| 120 | tokenharbor/deepseek-v4.1-flash-1017 | yedek | **BEKLENIYOR** | — | 0 | 15 | 0 | 4 | — | 6 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | 1048576 | — |
| 121 | tokenharbor/glm-5.3 | aday | **BEKLENIYOR** | — | 0 | 2.1 | 0 | 4 | — | 6 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | 200000 | 56.4 / 70.2 |
| 122 | tokenharbor/kimi-k3 | aday | **BEKLENIYOR** | — | 0 | 15 | 0 | 4 | — | 6 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | 1048576 | 58.9 / 69.4 |
| 123 | tokenharbor/qwen3.8-max | aday | **BEKLENIYOR** | — | 0 | — | 0 | 4 | — | 6 | 0/5 | FAIL:fonksiyon bulunamadi | 0 | — | — | — |

## Kapı kırıkları
- **openrouter/liquid/lfm-2.5-2.6b:free** (yedek): terminal >= 4/5=0/5, kod PASS=FAIL:bek=220,0,56 got=385,0,91, IQ >= 100=0, ctx >= 256000=65536
- **openrouter/nvidia/nemotron-3-super-120b-a12b:free** (yedek): terminal >= 4/5=0/5
- **codefast/kimi-k3** (ikincil): terminal >= 4/5=0/5, kod PASS=FAIL:fonksiyon bulunamadi
- **openrouter/nvidia/nemotron-3.5-content-safety:free** (yedek): terminal >= 4/5=0/5, kod PASS=FAIL:fonksiyon bulunamadi, IQ >= 100=0, ctx >= 256000=128000, yetenek: toolCall=hayir

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

## Kıyaslama (puan deltaları)
- tokenharbor/deepseek-v4.1-flash:free: 77.2 -> 77.2 (+0)
- tokenharbor/mimo-v2.6-flash:free: 73.9 -> 73.9 (+0)
- tokenharbor/mimo-v2.5:free: 72.7 -> 72.7 (+0)
- tokenharbor/claude-haiku-5.5:free: 72.6 -> 72.6 (+0)
- codefast/codefastk3unlimited: 70.4 -> 70.4 (+0)
- openrouter/cohere/north-mini-code:free: 82.1 -> 66.1 (-16)
- tokenharbor/deepseek-v4-flash:free: 62.2 -> 62.2 (+0)
- codefast/kimi-k3: 40 -> 40 (+0)

## Kural çizgisi
- Gate uygulanan seviyeler: anaYazar, gunluk
- Gate sonucu: KIRILDI -> claude-glm/glm-5.3, codefast-glm/glm-5.3, kilo/openrouter/cohere/north-mini-code:free, opencode/openrouter/cohere/north-mini-code:free
- Ana yazar boşluğu: yok
- Puan = yalnız yerel ölçüm (bench.json). `*` dış puan karar puanına karıştırılmaz.