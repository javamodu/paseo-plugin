# Free model erişim ölçümü — 2026-10-15

Kapsam: `opencode` (Zen), `kilo` (gateway), `openrouter`/`pi`, `tokenharbor`, `codefast` (3 uç).
Yöntem: ham-API varsa `/chat/completions` (+ `/responses` yedeği), yoksa CLI/ajan hattı. Ölçüm
beklemeli tek sıra ile yapıldı (çakışan iki koşu Cloudflare 429 üretiyordu). Anahtarlar diske yazılmadı.

## 1. Sonuç tabloları

| hat | free kayıt | çalışan | erişim sınıfı |
|---|---|---|---|
| OpenCode Zen | 9 | **8** | yalnız-ajan-hattı (ham-API `403`) |
| Kilo gateway | 12 | **8** (+1 sınıflandırıcı) | ham-API |
| OpenRouter (pi) | 14 | 0 (kota dolu) | ham-API |
| tokenharbor | 5 | **5** | ham-API |
| codefast | 2 | **2** | ham-API |
| codefast-os | 11 | 0 (`PAYG_DISABLED`) | ham-API |
| codefast-glm | 1 | 0 (`PAYG_DISABLED`) | ham-API |

## 2. OpenCode Zen — CLI üzerinden (`opencode run -m …`)

Çalışan (hepsi `17*23=391`, exit=0): `space-bunny-free` (5,8 sn), `cat-jam-free` (5,5 sn),
`longcat-2.5-preview-free` (12,4 sn), `mimo-v2.6-flash-free` (12,0 sn), `nemotron-3-ultra-free` (7,8 sn),
`nemotron-3.5-lightning-free` (7,2 sn), `step-5-preview-free` (15,7 sn), `muse-spark-1.3-contributor-free` (8,1 sn).

Hatalı: `exo-free` → `UnknownError: Unexpected server error` (exit=1).

Ham-API denemesi: `POST https://opencode.ai/zen/v1/chat/completions` → `403 OpenCode's free tier can only
be used from within OpenCode`. Zen free, istemci kilidi taşıyor; bu yüzden süre/kalite karşılaştırması
yalnız CLI hattından yapılabilir ve ham-API sayıları ile aynı kefeye konmaz.

## 3. Kilo gateway — `api.kilo.ai/api/gateway` (katalog 394 model / 12 free)

| free model | durum | not |
|---|---|---|
| `nvidia/nemotron-3-ultra-550b-a55b:free` | Çalısır | 1,2 sn |
| `dots-studio/dots-3-note-preview:free` | Çalısır | 4,6 sn |
| `poolside/laguna-s-2.1:free` | Çalısır | 1,3 sn |
| `cohere/north-mini-code:free` | Çalısır | 1,2 sn |
| `stepfun/step-5-preview-free` | Çalısır | 1,1 sn |
| `liquid/lfm-2.5-2.6b:free` | Çalısır | 400 token'da content boş; 2000 token'da `391` (reasoning 854 krk) |
| `nvidia/nemotron-3.5-lightning:free` | Çalısır | 2000 token'da `391` (reasoning 1886 krk) |
| `poolside/laguna-xs-2.1:free` | Çalısır | 2000 token'da `391` (reasoning 2002 krk, 12,6 sn) |
| `nvidia/nemotron-3.5-content-safety:free` | Yarı | 200 ama çıktı `User Safety: safe` — kod modeli değil |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | Hatalı | `Upstream error from Nvidia: ResourceExhausted` |
| `thinkingmachines/inkling-small:free` | Hatalı | `429 limit_rpd` (günlük free kotası dolmuş) |

Ders: **ölçümde `max_tokens` küçükse reasoning-modelleri "boş content" döndürür ve başarısız sayılır.**
İlk koşuda 3 model bu yüzden HATALI göründü; 2000 token ile hepsi geçti.

## 4. OpenRouter / pi

Canlı `:free` küme 14 kayıt. Pi'nin 317'lik kataloğu bayat: config'teki 20 kayıttan 16'sı OpenRouter'da
artık yok (`404 This model is unavailable for free`). Config 14'e çekildi
(`~/.paseo/config.json`, yedek `config.json.bak-or-live`). Uçtan uca çalışan iki free model:
`nvidia/nemotron-3-super-120b-a12b:free` ve `thinkingmachines/inkling:free` → ajan hattı `NUM=391`.
Kota: paylaşılan anahtar `429 Rate limit exceeded: free-models-per-day. Add 10 credits` durumuna düştü.

## 5. codefast / tokenharbor (referans)

`tokenharbor` 5/5, `codefast` 2/2 (`kimi-k3`, `codefastk3unlimited`) — `17*23=391`, 1,2–3,1 sn.
`codefast-os` 11/11 ve `codefast-glm` 1/1 → `403 PAYG_DISABLED` (`allowed:false`, `remaining:0` /
`7.3e-7`, `payg_enabled:false`). `base_url`/yol hatası değil: `/glm-api` ve `/glm-api/v1` aynı 403'ü veriyor.

## 6. Yineleme

Betikler bu turda `raporlar/` altına taşınmadı (kapsam kuralı: tek parça/tur); geçici olarak
`%TEMP%` içinde: `cf-probe.mjs` (ham-API yoklama, 3 sn bekleme), `kilo-olc.mjs` + `kilo-olc2.mjs`
(gateway kataloğu + free ölçümü), `oc-run.mjs` (Zen CLI), `or-free-check.mjs` / `pi-kapi.mjs`
(canlı free kümesiyle config karşılaştırma kapısı). Kanıt exit-kodları: `KAPI_CANLI_EXIT=0`,
`OPENCODE_ZEN_RUN_EXIT=0`, `KILO_KALAN_EXIT=0`, `TEKRAR_KONTROL_EXIT=0`, `PACED_OLCUM_EXIT=0`.
