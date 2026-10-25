# Birlesik Model Katalogu — paseo-plugin · 2026-10-17
Kaynak: `~/.paseo/config.json` (provider+model) · canli `/models` · `raporlar/bench-*/bench.json` · `scripts/bench-puanlari.json`
Kapsam: 80 farkli model · 115 provider kaydı · **32 model birden fazla provider'da**

## Birden fazla provider'da olan modeller (asil bakım yeri)
| model | provider sayısı | en ucuz (provider · $/1M g-ç) | ctx | ölçüm (t/s · terminal · kod) | dış puan* |
|---|---|---|---|---|---|
| **mimo-v2.6-flash** | 3 | tokenharbor · 0/0 | 1048576 | — · null · null | — |
| **nemotron-3.5-lightning** | 3 | fiyat yok | 1000000 | — · null · null | — |
| **step-5-preview** | 3 | fiyat yok | — | — · null · null | — |
| **cat-jam** | 2 | fiyat yok | — | — · null · null | — |
| **deepseek-v4-flash** | 2 | tokenharbor · 0/0 | 1000000 | 81.6 · 5/5 · PASS | — |
| **deepseek-v4.1-flash** | 2 | tokenharbor · 0/0 | 1048576 | 133.4 · 5/5 · PASS | — |
| **exo** | 2 | fiyat yok | — | — · null · null | — |
| **gemma-4-31b-it** | 2 | fiyat yok | 262144 | **ölçülmedi** | — |
| **glm-5.3** | 2 | codefast-os · 1.4/4.4 | — | — · 0/5 · FAIL:fonksiyon bulunamadi | SWE 95.4 · TB 88.2 · AA 45 |
| **kimi-k3** | 2 | codefast · 3/15 | — | 46.8 · 5/5 · PASS | TB 88.3 · AA 44 |
| **laguna-xs-2.1** | 2 | fiyat yok | 262144 | **ölçülmedi** | — |
| **longcat-2.5-preview** | 2 | fiyat yok | — | — · null · null | — |
| **muse-spark-1.3-contributor** | 2 | fiyat yok | — | — · null · null | — |
| **nemotron-3-nano-omni-30b-a3b-reasoning** | 2 | fiyat yok | 256000 | **ölçülmedi** | — |
| **nemotron-3-super-120b-a12b** | 2 | fiyat yok | 262144 | **ölçülmedi** | — |
| **nemotron-3-ultra** | 2 | fiyat yok | — | — · null · null | — |
| **nemotron-3-ultra-550b-a55b** | 2 | fiyat yok | 1000000 | — · 0/5 · FAIL:fonksiyon bulunamadi | — |
| **openrouter/cohere/north-mini-code** | 2 | fiyat yok | — | — · null · null | — |
| **openrouter/dots-studio/dots-3-note-preview** | 2 | fiyat yok | — | — · null · null | — |
| **openrouter/google/gemma-4-26b-a4b-it** | 2 | fiyat yok | — | — · null · null | — |
| **openrouter/google/gemma-4-31b-it** | 2 | fiyat yok | — | — · null · null | — |
| **openrouter/liquid/lfm-2.5-2.6b** | 2 | fiyat yok | — | — · null · null | — |
| **openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning** | 2 | fiyat yok | — | — · null · null | — |
| **openrouter/nvidia/nemotron-3-super-120b-a12b** | 2 | fiyat yok | — | — · null · null | — |
| **openrouter/nvidia/nemotron-3-ultra-550b-a55b** | 2 | fiyat yok | — | — · null · null | — |
| **openrouter/nvidia/nemotron-3.5-content-safety** | 2 | fiyat yok | — | — · null · null | — |
| **openrouter/nvidia/nemotron-3.5-lightning** | 2 | fiyat yok | — | — · null · null | — |
| **openrouter/poolside/laguna-s-2.1** | 2 | fiyat yok | — | — · null · null | — |
| **openrouter/poolside/laguna-xs-2.1** | 2 | fiyat yok | — | — · null · null | — |
| **openrouter/thinkingmachines/inkling** | 2 | fiyat yok | — | — · null · null | — |
| **openrouter/thinkingmachines/inkling-small** | 2 | fiyat yok | — | — · null · null | — |
| **space-bunny** | 2 | fiyat yok | — | — · null · null | — |

## Tüm modeller (provider → id, ctx, fiyat)
| model | provider kayıtları | ctx | fiyat $/1M (g-ç) | ölçüm durumu |
|---|---|---|---|---|
| mimo-v2.6-flash | `mimo-v2.6-flash:free` (1048576) $0/$0<br>`opencode/mimo-v2.6-flash-free`<br>`opencode/mimo-v2.6-flash-free` | 1048576 | $0/$0 | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| nemotron-3.5-lightning | `opencode/nemotron-3.5-lightning-free`<br>`opencode/nemotron-3.5-lightning-free`<br>`nvidia/nemotron-3.5-lightning:free` (1000000) | 1000000 | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| step-5-preview | `opencode/step-5-preview-free`<br>`opencode/step-5-preview-free`<br>`stepfun-ai/step-5-preview` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| cat-jam | `opencode/cat-jam-free`<br>`opencode/cat-jam-free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| deepseek-v4-flash | `deepseek-v4-flash:free` (1000000) $0/$0<br>`deepseek-v4-flash` | 1000000 | $0/$0 | hata: API access denied |
| deepseek-v4.1-flash | `deepseek-v4.1-flash:free` (1048576) $0/$0<br>`opencode/deepseek-v4.1-flash` $0.15/$0.6 | 1048576 | $0/$0 | ölçülmedi |
| exo | `opencode/exo-free`<br>`opencode/exo-free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| gemma-4-31b-it | `google/gemma-4-31b-it`<br>`google/gemma-4-31b-it:free` (262144) | 262144 | — | ölçülmedi |
| glm-5.3 | `glm-5.3` $1.4/$4.4<br>`glm-5.3` $1.4/$4.4 | — | $1.4/$4.4 | hata: API access denied |
| kimi-k3 | `kimi-k3` $3/$15<br>`kimi-k3` $3/$15 | — | $3/$15 | hata: API access denied |
| laguna-xs-2.1 | `poolside/laguna-xs-2.1`<br>`poolside/laguna-xs-2.1:free` (262144) | 262144 | — | ölçülmedi |
| longcat-2.5-preview | `opencode/longcat-2.5-preview-free`<br>`opencode/longcat-2.5-preview-free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| muse-spark-1.3-contributor | `opencode/muse-spark-1.3-contributor-free`<br>`opencode/muse-spark-1.3-contributor-free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| nemotron-3-nano-omni-30b-a3b-reasoning | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`<br>`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` (256000) | 256000 | — | ölçülmedi |
| nemotron-3-super-120b-a12b | `nvidia/nemotron-3-super-120b-a12b`<br>`nvidia/nemotron-3-super-120b-a12b:free` (262144) | 262144 | — | ölçülmedi |
| nemotron-3-ultra | `opencode/nemotron-3-ultra-free`<br>`opencode/nemotron-3-ultra-free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| nemotron-3-ultra-550b-a55b | `nvidia/nemotron-3-ultra-550b-a55b`<br>`nvidia/nemotron-3-ultra-550b-a55b:free` (1000000) | 1000000 | — | hata: API access denied |
| openrouter/cohere/north-mini-code | `openrouter/cohere/north-mini-code:free`<br>`openrouter/cohere/north-mini-code:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| openrouter/dots-studio/dots-3-note-preview | `openrouter/dots-studio/dots-3-note-preview:free`<br>`openrouter/dots-studio/dots-3-note-preview:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| openrouter/google/gemma-4-26b-a4b-it | `openrouter/google/gemma-4-26b-a4b-it:free`<br>`openrouter/google/gemma-4-26b-a4b-it:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| openrouter/google/gemma-4-31b-it | `openrouter/google/gemma-4-31b-it:free`<br>`openrouter/google/gemma-4-31b-it:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| openrouter/liquid/lfm-2.5-2.6b | `openrouter/liquid/lfm-2.5-2.6b:free`<br>`openrouter/liquid/lfm-2.5-2.6b:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning | `openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`<br>`openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| openrouter/nvidia/nemotron-3-super-120b-a12b | `openrouter/nvidia/nemotron-3-super-120b-a12b:free`<br>`openrouter/nvidia/nemotron-3-super-120b-a12b:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| openrouter/nvidia/nemotron-3-ultra-550b-a55b | `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free`<br>`openrouter/nvidia/nemotron-3-ultra-550b-a55b:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| openrouter/nvidia/nemotron-3.5-content-safety | `openrouter/nvidia/nemotron-3.5-content-safety:free`<br>`openrouter/nvidia/nemotron-3.5-content-safety:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| openrouter/nvidia/nemotron-3.5-lightning | `openrouter/nvidia/nemotron-3.5-lightning:free`<br>`openrouter/nvidia/nemotron-3.5-lightning:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| openrouter/poolside/laguna-s-2.1 | `openrouter/poolside/laguna-s-2.1:free`<br>`openrouter/poolside/laguna-s-2.1:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| openrouter/poolside/laguna-xs-2.1 | `openrouter/poolside/laguna-xs-2.1:free`<br>`openrouter/poolside/laguna-xs-2.1:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| openrouter/thinkingmachines/inkling | `openrouter/thinkingmachines/inkling:free`<br>`openrouter/thinkingmachines/inkling:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| openrouter/thinkingmachines/inkling-small | `openrouter/thinkingmachines/inkling-small:free`<br>`openrouter/thinkingmachines/inkling-small:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| space-bunny | `opencode/space-bunny-free`<br>`opencode/space-bunny-free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| allam-2-7b | `allam-2-7b` (4096) | 4096 | — | ölçülmedi |
| codefastk3unlimited | `codefastk3unlimited` | — | — | ölçülmedi |
| deepseek-v4-pro | `deepseek-v4-pro` | — | — | hata: API access denied |
| deepseek-v4.1-flash-1017 | `deepseek-v4.1-flash-1017` (1048576) $0.14/$0.42 | 1048576 | $0.14/$0.42 | hata: Your Token Harbor balance is at $0. Top up at https://tokenharbor.ai/dashboard to keep usi |
| deepseek/deepseek-v4.1-flash-1017 | `deepseek/deepseek-v4.1-flash-1017` (1048576) | 1048576 | — | ölçülmedi |
| diffusiongemma-26b-a4b-it | `google/diffusiongemma-26b-a4b-it` | — | — | ölçülmedi |
| dots-studio/dots-3-note-preview | `dots-studio/dots-3-note-preview:free` (512000) | 512000 | — | ölçülmedi |
| gemma-4-26b-a4b-it | `google/gemma-4-26b-a4b-it:free` (262144) | 262144 | — | ölçülmedi |
| glm-5.1 | `glm-5.1` | — | — | hata: API access denied |
| glm-5.2 | `glm-5.2` | — | — | hata: API access denied |
| glm-5.3-flash | `z-ai/glm-5.3-flash` | — | — | ölçülmedi |
| gpt-oss-120b-medium | `gpt-oss-120b-medium` | — | — | hata: API access denied |
| inkling | `thinkingmachines/inkling:free` (1048576) | 1048576 | — | ölçülmedi |
| inkling-small | `thinkingmachines/inkling-small:free` (1048576) | 1048576 | — | ölçülmedi |
| kilo/cohere/north-mini-code | `kilo/cohere/north-mini-code:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| kilo/dots-studio/dots-3-note-preview | `kilo/dots-studio/dots-3-note-preview:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| kilo/kilo-auto/free | `kilo/kilo-auto/free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| kilo/liquid/lfm-2.5-2.6b | `kilo/liquid/lfm-2.5-2.6b:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| kilo/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning | `kilo/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| kilo/nvidia/nemotron-3-super-120b-a12b | `kilo/nvidia/nemotron-3-super-120b-a12b:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| kilo/nvidia/nemotron-3-ultra-550b-a55b | `kilo/nvidia/nemotron-3-ultra-550b-a55b:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| kilo/nvidia/nemotron-3.5-lightning | `kilo/nvidia/nemotron-3.5-lightning:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| kilo/openrouter/free | `kilo/openrouter/free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| kilo/poolside/laguna-s-2.1 | `kilo/poolside/laguna-s-2.1:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| kilo/poolside/laguna-xs-2.1 | `kilo/poolside/laguna-xs-2.1:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| kilo/stealth/glyph-cluster | `kilo/stealth/glyph-cluster` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| kilo/stepfun/step-5-preview | `kilo/stepfun/step-5-preview-free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| kilo/thinkingmachines/inkling-small | `kilo/thinkingmachines/inkling-small:free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| laguna-s-2.1 | `poolside/laguna-s-2.1:free` (262144) | 262144 | — | ölçülmedi |
| liquid/lfm-2.5-2.6b | `liquid/lfm-2.5-2.6b:free` (65536) | 65536 | — | ölçülmedi |
| llama-3.2-11b-vision-instruct | `meta/llama-3.2-11b-vision-instruct` | — | — | ölçülmedi |
| mimo-v2.5 | `mimo-v2.5:free` (1048576) $0/$0 | 1048576 | $0/$0 | ölçülmedi |
| mimo-v2.5-pro | `mimo-v2.5-pro` | — | — | hata: API access denied |
| minimax-m3 | `minimax-m3` | — | — | hata: API access denied |
| muse-glimmer-30b | `meta/muse-glimmer-30b` | — | — | ölçülmedi |
| nemotron-3.5-content-safety | `nvidia/nemotron-3.5-content-safety:free` (128000) | 128000 | — | ölçülmedi |
| nemotron-3.5-super-vl-120b-a12b | `nvidia/nemotron-3.5-super-vl-120b-a12b` | — | — | ölçülmedi |
| north-mini-code | `cohere/north-mini-code:free` (256000) | 256000 | — | ölçülmedi |
| openai/gpt-oss-120b | `openai/gpt-oss-120b` (131072) | 131072 | — | ölçülmedi |
| openai/gpt-oss-20b | `openai/gpt-oss-20b` (131072) | 131072 | — | ölçülmedi |
| openrouter/openrouter/free | `openrouter/openrouter/free` | — | — | hata: base_url yok (ACP/native katalog) — ham API olcumu yapilamaz |
| qwen3.8-27b | `qwen/qwen3.8-27b` (131072) | 131072 | — | ölçülmedi |
| riva-translate-4b-instruct-v2 | `nvidia/riva-translate-4b-instruct-v2` | — | — | ölçülmedi |
| step-3.7-flash | `stepfun-ai/step-3.7-flash` | — | — | hata: API access denied |
| tokenharbor/deepseek-v4-flash | `tokenharbor/deepseek-v4-flash:free` | — | — | ölçülmedi |
| tokenharbor/deepseek-v4.1-flash | `tokenharbor/deepseek-v4.1-flash:free` | — | — | ölçülmedi |
| tokenharbor/mimo-v2.5 | `tokenharbor/mimo-v2.5:free` | — | — | ölçülmedi |
| tokenharbor/mimo-v2.6-flash | `tokenharbor/mimo-v2.6-flash:free` | — | — | ölçülmedi |

## Bozuk/geçersiz model id kayıtları (çalışmaz — düzeltilmeli)
| provider | id | neden |
|---|---|---|
| opencode | `DeepSeek V4 Flash Free (New)` | gecersiz id (bosluk/parantez; Zen id'leri kucuk harf slug) |
| opencode | `Space Bunny Free` | gecersiz id (bosluk/parantez; Zen id'leri kucuk harf slug) |
| opencode | `Step 5 Preview Free` | gecersiz id (bosluk/parantez; Zen id'leri kucuk harf slug) |
| kilo | `OpenCode Zen/Space Bunny Free` | gecersiz id (bosluk/parantez; Zen id'leri kucuk harf slug) |
| kilo | `Kilo Gateway/StepFun: Step 5 Preview (free` | gecersiz id (bosluk/parantez; Zen id'leri kucuk harf slug) |
| kilo | `OpenCode Zen/Muse Spark 1.3 Free` | gecersiz id (bosluk/parantez; Zen id'leri kucuk harf slug) |

* dış puan = `scripts/bench-puanlari.json`'daki yayımlanmış puan (URL'li, tek kaynak); ölçülmediği anlamak için boş bırakıldı.