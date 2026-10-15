# Free model erişim ölçümü — 2026-10-15

Kapsam: `opencode` (Zen), `kilo` (gateway), `openrouter`/`pi`, `tokenharbor`, `codefast` (3 uç).
Yöntem: ham-API varsa `/chat/completions` (+ `/responses` yedeği), yoksa CLI/ajan hattı. Ölçüm
beklemeli tek sıra ile yapıldı (çakışan iki koşu Cloudflare 429 üretiyordu). Anahtarlar diske yazılmadı.

## 0. CALISAN FREE UCLAR — hiz sirali (tek yerden bulunur)

Ham-API satirlari: `raporlar/bench-th-fixdogrulama-2026-10-15/` (harness kosusu, 5/5 olculen).
Eski kosu `raporlar/bench-free-2026-10-15/` (6/7) artik gecersiz: harness kucuk `max_tokens`'ta
icerik reasoning'e gidip bos kaldiginda "cevap yok" sayip yanlis FAIL yaziyordu; kusur kapatildi
(`14fa2bf`), tokenharbor satirlari duzeltilmis harness ile yeniden olculdu.
Kilo ve OpenCode satirlari bu dosyanin §2-§3 yoklamalarindan: harness bunlara ulasamiyor, cunku Paseo
`config.json`'da bu provider'larin `env.OPENAI_BASE_URL` degeri yok (CLI/ACP katalogu).

| uç | hat | hız | IQ | terminal | kod | JSON uyum |
|---|---|---|---|---|---|---|
| `tokenharbor/claude-haiku-5.5:free` | ham-API | **141,3 t/s** | 100 | 4/5 | PASS | PASS |
| `tokenharbor/deepseek-v4.1-flash:free` | ham-API | 91,4 t/s | 100 | 5/5 | PASS | PASS |
| `tokenharbor/deepseek-v4-flash:free` | ham-API | 81,4 t/s | 100 | 0/5 | PASS | PASS |
| `tokenharbor/mimo-v2.6-flash:free` | ham-API | 49,1 t/s | 100 | 5/5 | PASS | PASS |
| `tokenharbor/mimo-v2.5:free` | ham-API | 27,2 t/s | 100 | 5/5 | PASS | PASS |
| `codefast/kimi-k3` | ham-API | 35,1 t/s * | 100 | 0/5 * | FAIL * | FAIL * |
| `kilo/stepfun/step-5-preview-free` | ham-API | 1,1 sn (kisa yanit) | olculmedi | — | — | — |
| `kilo/nvidia/nemotron-3-ultra-550b-a55b:free` | ham-API | 1,2 sn | olculmedi | — | — | — |
| `kilo/cohere/north-mini-code:free` | ham-API | 1,2 sn | olculmedi | — | — | — |
| `kilo/poolside/laguna-s-2.1:free` | ham-API | 1,3 sn | olculmedi | — | — | — |
| `kilo/liquid/lfm-2.5-2.6b:free` | ham-API | 1,8 sn | olculmedi | — | — | — |
| `kilo/dots-studio/dots-3-note-preview:free` | ham-API | 4,6 sn | olculmedi | — | — | — |
| `kilo/nvidia/nemotron-3.5-lightning:free` | ham-API | 5,1 sn | olculmedi | — | — | — |
| `kilo/poolside/laguna-xs-2.1:free` | ham-API | 12,6 sn | olculmedi | — | — | — |
| `opencode/cat-jam-free` | yalniz-CLI | 5,5 sn | olculmedi | — | — | — |
| `opencode/space-bunny-free` | yalniz-CLI | 5,8 sn | olculmedi | — | — | — |
| `opencode/nemotron-3.5-lightning-free` | yalniz-CLI | 7,2 sn | olculmedi | — | — | — |
| `opencode/nemotron-3-ultra-free` | yalniz-CLI | 7,8 sn | olculmedi | — | — | — |
| `opencode/muse-spark-1.3-contributor-free` | yalniz-CLI | 8,1 sn | olculmedi | — | — | — |
| `opencode/mimo-v2.6-flash-free` | yalniz-CLI | 12,0 sn | olculmedi | — | — | — |
| `opencode/longcat-2.5-preview-free` | yalniz-CLI | 12,4 sn | olculmedi | — | — | — |
| `opencode/step-5-preview-free` | yalniz-CLI | 15,7 sn | olculmedi | — | — | — |
| `pi/openrouter/nvidia/nemotron-3-super-120b-a12b:free` | yalniz-CLI (pi) | ajan hatti `NUM=391` | olculmedi | — | — | — |
| `pi/openrouter/thinkingmachines/inkling:free` | yalniz-CLI (pi) | ajan hatti `NUM=391` | olculmedi | — | — | — |

\*) `kimi-k3` terminal/kod/JSON-uyum satirlari **eski olcum artefakti**: 2000-3000 token'lik butcede
reasoning her seyi yiyor, `content` bos donuyor. Harness'e butce-tirmanmali tekrar eklendi ve
tokenharbor uzerinde dogrulandi (`14fa2bf`; `deepseek-v4.1-flash` 0/5 -> 5/5, `mimo-v2.6-flash`
IQ 83/4/5 -> 100/5/5). `kimi-k3` satiri henuz yeniden olculemedi: codefast ham-API'si 2026-10-15
itibariyle `403 API access denied` veriyor (dun olculen 35,1 t/s + ham test `17*23=391` + ajan
hatti `NUM=391` gecici kanit; bkz. §5). Erisim hesabı yeniden acilinca satir yeniden olculmeli.

## 1. Sonuç tabloları

| hat | free kayıt | çalışan | erişim sınıfı |
|---|---|---|---|
| OpenCode Zen | 9 | **8** | yalnız-ajan-hattı (ham-API `403`) |
| Kilo gateway | 12 | **8** (+1 sınıflandırıcı) | ham-API |
| OpenRouter (pi) | 14 | 1 dogrulandi (kota gun ici dolup bosuyor; bu turda `north-mini-code:free` HTTP 200 / `391`) | ham-API |
| tokenharbor | 5 | **5** | ham-API |
| codefast | 2 | 0 (bugun `403 API access denied`; erken saatte 2 olculmustu) | ham-API |
| codefast-os | 11 | 0 (`PAYG_DISABLED`) | ham-API |
| codefast-glm | 1 | 0 (`PAYG_DISABLED`) | ham-API |

**Pi neden OpenRouter'da? (R)** Bu bir kisitlama degil, kimlik durumunun sonucu: `~/.pi/agent/auth.json`
bos (`{}`), `~/.pi/agent/models.json` hic yok, pi'nin yerlesik saglayici tablosunda tokenharbor yok ve
OpenAI saglayicisi yalniz `OPENAI_API_KEY` okuyup `OPENAI_API_BASE`'i görmezden geliyor — env'deki anahtar
tokenharbor'a ait (`thk_live…`) oldugu icin `pi --provider openai` `401 Incorrect API key provided` donduruyor
(olculdu). Calisan tek kimlik `OPENROUTER_API_KEY` (`sk-or-…`). Dogrudan yol resmî ve tek dosya isidir:
`~/.pi/agent/models.json` icine `{"providers":{"tokenharbor":{"baseUrl":"https://tokenharbor.ai/v1",
"api":"openai-completions",…}}}` → `pi --provider tokenharbor --model deepseek-v4-flash:free`.
Bu turda alinan karar: dosya YAZILMADI (kullanici onayi bekliyor). Dogrulama komutu: `node scripts/pi-erisim-kapisi.mjs`
(13 PASS / TOPLAM_FAIL=0 / API cagrisi yok).

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

`tokenharbor` 5/5 (duzeltilmis harness ile yeniden olculdu, `bench-th-fixdogrulama-2026-10-15`, 5/5
olculen, `--check` EXIT=0). `codefast` 2/2 (`kimi-k3`, `codefastk3unlimited`) — `17*23=391`, 1,2–3,1 sn —
**ayni gunun erken saati**; sonraki kosuda iki uc de `403 API access denied` dondurdu, yani 2/2
su anki durum degil gecmis olcum. `codefast-os` 11/11 ve `codefast-glm` 1/1 → `403 PAYG_DISABLED`
(`allowed:false`, `remaining:0` / `7.3e-7`, `payg_enabled:false`). `base_url`/yol hatası değil: `/glm-api` ve `/glm-api/v1` aynı 403'ü veriyor.

## 6. Yineleme

Betikler bu turda `raporlar/` altına taşınmadı (kapsam kuralı: tek parça/tur); geçici olarak
`%TEMP%` içinde: `cf-probe.mjs` (ham-API yoklama, 3 sn bekleme), `kilo-olc.mjs` + `kilo-olc2.mjs`
(gateway kataloğu + free ölçümü), `oc-run.mjs` (Zen CLI), `or-free-check.mjs` / `pi-kapi.mjs`
(canlı free kümesiyle config karşılaştırma kapısı). Kanıt exit-kodları: `KAPI_CANLI_EXIT=0`,
`OPENCODE_ZEN_RUN_EXIT=0`, `KILO_KALAN_EXIT=0`, `TEKRAR_KONTROL_EXIT=0`, `PACED_OLCUM_EXIT=0`.
