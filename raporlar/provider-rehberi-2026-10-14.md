# PASEO PROVIDER REHBERİ — 2026-10-14 (v1.0)

Kapsam: Paseo IDE'de kayıtlı provider'lar, free model evreni, limitler ve hız/doğruluk benchmarkı.
Kanıt etiketi: (R) resmî ölçüm · (T) tahmin · * tek kaynak.

## 1. Provider haritası (R: `paseo provider ls`)

| Provider id | Etiket | Durum | Tür | Model sayısı | Free model |
|---|---|---|---|---|---|
| tokenharbor | TokenHarbor | available/Enabled | codex-extends (OpenAI-compat) | 14 | 5 |
| codefast | Codefast | available/Enabled | codex-extends (`kimi-k3-unlimited-api`) | 12 (2'si koşabilir) | 0 |
| opencode | OpenCode | available/Enabled | acp | 550 | 29 |
| kilo | Kilo | available/Enabled | acp | 829 | 42 |
| codex | Codex | available/Enabled | native | 9 | 0 |
| qoder | Qoder CLI | available/Enabled | acp | 2 | 0 |

**Toplam: 14 provider** (R: `paseo provider ls --json` birleştime sonrası).

### Codefast birleşmesi (R: canlı probe (`wire_api = "responses"`) + `paseo reload`)

İlk ham tarama `/chat/completions` ucuyla yapılmıştı; oysa codex bu kapıları `wire_api = "responses"` ile bağlıyor (`~/.codex/config.toml`: `[model_providers.codefast] base_url = ".../kimi-k3-unlimited-api/v1"`, `wire_api = "responses"`). Yoklama `/responses` ile **yeniden koşuldu**:

| Kapı (`base_url`) | `GET /models` | `kimi-k3` | `codefastk3unlimited` | `glm-5.3` | `deepseek-v4-flash` | `minimax-m3` | `glm-5.2` |
|---|---|---|---|---|---|---|---|
| `kimi-k3-unlimited-api/v1` | 200 (2 model) | **200** | **200** | 400 `Only "kimi-k3" or "codefastk3unlimited" is available on this API` | 400 aynı | 400 aynı | 400 aynı |
| `glm-api` (+ `/v1`) | 403 `API access denied` | 403 | 403 | 403 | 403 | 403 | 403 |
| `open-source-api/v1` | 403 | 403 | 403 | 403 | 403 | 403 | 403 |
| **kök `https://api.codefast.app/v1`** | **200 (72 model)** | 403 | 400 `MODEL_NOT_ROUTABLE` | 403 | 403 | 403 | 403 |

Anahtar denetimi: yedekteki üç kapının **üçü de aynı anahtarı** kullanıyordu (sha256 parmak izi `72e98581ca`, uzunluk 51; `env CODEFAST_KIMI_API_KEY` ve `env CODEFAST_API_KEY` de aynı parmak izi) — birleşme hiçbir kimlik kaybına yol açmadı. Aynı anahtarla denenen **her** kapı/model kombinasyonu yukarıdaki tablodaki gibi cevap verdi; yani 403 hesap/yetki kapısıdır, uç yanlışlığı değil.

Yorum: kök `/v1` **birleşik kapıdır** (72 modelin tamamı listeleniyor, `glm-5.3`/`deepseek-v4-flash`/`minimax-m3`/`nvidia/nemotron-3-ultra-550b-a55b` katalogda) ve modele göre yönlendirme yapıyor; ancak bu anahtar için hiçbir modeli route etmiyor (403). `codefastk3unlimited`'e `MODEL_NOT_ROUTABLE` demesi, o ucun yalnız kendi kapısında geçerli olduğunu gösteriyor.

**Uygulanan kurulum:** tek `codefast` provider id'si, `base_url = kimi-k3-unlimited-api/v1` (canlı olan tek kapı), `models` dizisinde ailenin **12 modeli**: `kimi-k3`, `codefastk3unlimited`, `glm-5.3`, `deepseek-v4-pro`, `deepseek-v4-flash`, `minimax-m3`, `mimo-v2.5-pro`, `gpt-oss-120b-medium`, `glm-5.2`, `glm-5.1`, `stepfun-ai/step-3.7-flash`, `nvidia/nemotron-3-ultra-550b-a55b`. Bir codex-extends provider'ı **tek** `base_url` taşır (`config.toml`'da `[model_providers.<id>]` bloğu) — bu yüzden 12 model tek id altında listelenebilir ama fiilen yalnız canlı kapının 2 modeli koşar.

**Paseo içinden canlı doğrulama (R):**
- `codefast / kimi-k3` → ajan `NUM=391` üretti (oturum `01a13b89-6085-75d3-9d4d-3ad5cbec8e74`, mode `auto-review`) — birleşik id çalışıyor.
- `codefast / glm-5.3` → ajan hatası: `{"error":{"type":"invalid_request_error","code":"model_not_allowed","message":"Only \"kimi-k3\" or \"codefastk3unlimited\" is available on this API. Requested model \"glm-5.3\" is not supported."}}` — model **seçilebilir ama kapısı kapalı**.

Geri alma: `~/.paseo/config.json.bak-birlestirme` → kopyala + `paseo reload`. Doğrulama komutları: `paseo provider ls --json` (14 satır, `codefast-*` yok) · `paseo provider models codefast --json` (12 model).

## 2. Limitler (R: katalog + canlı hata mesajları)

| Kaynak | Gözlenen limit | Kanıt |
|---|---|---|
| TokenHarbor | `context_length` katalogda yayımlanmış: 1.000.000–1.048.576 ctx; free modellerde girdi/çıktı $0/1M; `tier` etiketi: low/mid/high | `GET /v1/models` (Authorization ile HTTP 200, 70 model) (R) |
| TokenHarbor anon | anahtarsız istek 401 `invalid_api_key` | (R) |
| Kilo free | **`Rate limit exceeded: free-models-per-day` — "Add 10 credits to unlock 1000 free model requests per day"**; üç denemede de 0 token üretildi | 3 hatılı ajan (R) |
| OpenCode free | denenen 7 modelde limit hatası gözlenmedi, $0.00 maliyet | (R) |
| Codefast (`glm-api`, `open-source-api`) | `GET /models` ve `POST /responses` her modelde 403 `API access denied` — aynı anahtarla; modeller `codefast` altında listeli ama kapıları hesap/PAYG bekliyor | `/responses` yoklaması (R) |
| Codefast (canlı kapı) | `kimi-k3-unlimited-api/v1` yalnız `kimi-k3` ve `codefastk3unlimited`'i kabul ediyor; başka model 400 | canlı `Only "kimi-k3" or "codefastk3unlimited" is available on this API` + ajan hatası `model_not_allowed` (R) |
| Codex native | **Kasıtlı kurulum: `model_provider = "codefast"` + `model = "kimi-k3"`** → codex sağlayıcısı Kimi K3 unlimited ucunu kullanır. 28 codex ajanının **25'i `kimi-K3` koştu** (thinking: high/ultra) (R). Yalnız `gpt-*` modelleri bu profilde reddediliyor: `codex/gpt-5.6-terra` → `model_not_allowed` | canlı ajan kayıtları + 9004aa44 hatası (R) |
| gpt-5.6-terra (TokenHarbor) | TH kataloğunda `context_length = null` (yayımlanmamış) | (R) |

Codex ailesinin `gpt-*` modelleri ölçülemedi: iki satırın (`config.toml` satır 1–2) değiştirilmesi gerekir ve bu **kullanıcı tercihi olarak mevcut haliyle bırakıldı** — Kimi K3 kurulumu diğer oturumda da çalışıyor. Aynı uç nokta birleşik `codefast/kimi-k3` altında zaten ölçüldü (300.1 t/s) ve `config.toml`'daki `model_provider = "codefast"` satırı birleşmeden sonra da aynı uca işaret ediyor, dolayısıyla codex ailesinin hız sayısı biliniyor ve bozulmadı.

## 3. Free model evreni (R: `paseo provider models <p> --json`)

- **Seçilebilir free toplam: 29** → TokenHarbor 5 + OpenCode 29 liste içindeki benzersizlerden Kilo ile çakışmayan ölçüm kapısı; pratikte Kilo ve OpenCode aynı OpenRouter havuzunu paylaşıyor.
- TokenHarbor (5): `deepseek-v4-flash:free`, `deepseek-v4.1-flash:free`, `mimo-v2.5:free`, `mimo-v2.6-flash:free`, `claude-haiku-5.5:free`
- Kilo (42): 24 `:free` + 18 ada "free" giren model (ör. `opencode/space-bunny-free`, `kilo/kilo-auto/free`) — **hesap limitinden dolayı şu an koşamaz**
- OpenCode (29): 15 `:free` + 14 `*-free` (ör. `opencode/space-bunny-free`, `opencode/muse-spark-1.3-contributor-free`, `openrouter/thinkingmachines/inkling:free`)
- Düzeltme: önceki "kilo 43 free" iddiam yanlış; doğru sayı **42** (24 `:free` + 18 diğer) ve bundan önceki strict sayım **24** idi.

## 4. Benchmark — yöntem

- Görev (tek tip): `node -e "console.log('NUM='+(13*30+1))"` → beklenen çıktı `NUM=391`.
- **Hız (t/s)**: codex-extends için Codex rollout JSONL (`token_count.last_token_usage.output_tokens` / tur duvar zamanı); ACP için `~/.local/share/opencode/opencode.db` `message.data.tokens` + `time.created/completed`.
- **Cevap sağlaması**: ajan loglarında `NUM=391` var mı; sapma (`NUM=401`) = FAIL. **Yüzde puanı yok** — ikili sonuç yazılır.
- **IQ suite (canlı, ham API)**: 8 soruluk transfer seti (`iq-bench.mjs`: 288 / 8 / 100 / 171 / 60 / 30 / 31768 / 64) ve 6 soruluk zor set (`iq-hard.mjs`: 977, yan-yana-olmayan dizilim 72, denklem 4.5, %15 zam+%15 indirim 195.5, 1234×5678 = 7006652, 654321 mod 997 = 289). Cevap anahtarı **node ile hesaplanıp doğrulandı**; `temperature:0`, tek istek.
- **Sıralama ölçütü**: yalnızca ölçülen **t/s**. Doğruluk/erişim puan olarak toplanmaz; hız eşitse yan ölçüt (akıl üretimi, kademe sayısı) kullanılır.
- Kısıt (dürüstlük): `paseo-verimlilik` eklentisinin `echo kapisi` hook'u bench ajanlarını repo işine sürüklüyor; **tur sayıları ve toplam yaşam süresi şişkin**, t/s yalnız ölçülen LLM turlarından hesaplanıyor. Repo dışı (plugin'siz) workspace'te temiz tekrar önerilir (T).

## 5. TEK BİRLEŞİK TABLO — 14 sağlayıcının tamamı (R)

Sütunlar iki ayrı ölçüm kaynağından gelir ve **birbirine karıştırılmaz**: `t/s AJAN` = Paseo ajan turu üzerinden (Codex rollout JSONL / `opencode.db`), `t/s HAM` = tek HTTP isteği (`curl`, `temperature:0`, reasoning dahil). IQ kolonları canlı suite: **6-zor** (`iq-hard.mjs`) ve **8-transfer** (`iq-bench.mjs`), anahtar node ile hesaplandı. Sahte "Doğruluk/Erişim/GENEL" puanları kaldırıldı — sıralama **yalnız ölçülen hıza** göre yapılır.

Satır id'leri **ölçüm anındaki** provider id'sidir: `codefast-k3` altında ölçülen iki satır, birleşmeden (§1) sonra Paseo'da `codefast` id'si altında koşar — hız/IQ değerleri kapı aynı olduğu için geçerlidir.

| Sağlayıcı (id) | Model | t/s AJAN (koşu) | t/s HAM | IQ 6-zor | IQ 8-transfer | Kaçan soru | Akıl krk | Context | Maks çıkış | Fiyat $/1M (g-ç) | Kod idx (kat.) | Think kad. | Ajan cevabı | Erişim / limit |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `tokenharbor` | `claude-haiku-5.5:free` | **131.1** (2) | **117.6** | 100 | 100 | — | 0 | 1.000.000 | — | 0/0 | — | codex:high | PASS | 7 günlük free kota, tier mid |
| `tokenharbor` | `deepseek-v4.1-flash:free` | 26.5 (1) | **120.6** | 100 | 100 | — | 1073 | 1.048.576 | 943.718ᶜ | 0/0 | — | codex:high | PASS | 7 günlük free kota, tier low |
| `tokenharbor` | `mimo-v2.6-flash:free` | 39.4 (2) | 99.7 | 100 | 100 | — | 1046 | 1.048.576 | — | 0/0 | — | codex:high | PASS | 7 günlük free kota, tier low |
| `tokenharbor` | `deepseek-v4-flash:free` | 70.9 (1) | 80.9 | 100 | 100 | — | 1366 | 1.000.000 | 943.717ᶜ | 0/0 | 52 | codex:high | PASS | 7 günlük free kota, tier low |
| `opencode` | `opencode/muse-spark-1.3-contributor-free` | 80.8 (1) | — | — | — | — | — | yayımlanmamış | — | — | — | 6 | PASS | ham API HTTP 403 (CLI-kilidi) |
| `codefast` | `kimi-k3` | **300.1** (1) | 71.1 | 100 | 100 | — | 1339 | 1.048.576ᶜ | 943.718ᶜ | 3/15ᶜ | 76.2ᶜ | codex:high | PASS | tek kapı `kimi-k3-unlimited-api` (eski id `codefast-k3`) + codex CLI |
| `codefast` | `codefastk3unlimited` | — (0) | 62.3 | 100 | 100 | — | **4559** | yayımlanmamış | — | — | — | 0 | — | aynı kapı (eski id `codefast-k3`) |
| `opencode` | `openrouter/thinkingmachines/inkling-small:free` | 39.5 (1) | — | — | — | — | — | yayımlanmamış | — | — | — | **7** | PASS | yalnız Paseo/ACP (ham 404) |
| `tokenharbor` | `mimo-v2.5:free` | 20.5 (1) | 33.4 | 100 | **88** | C2(8) | 705 | 1.048.576 | 131.072ᶜ | 0/0 | 56.8ᶜ | codex:high | PASS | 7 günlük free kota, tier high |
| `opencode` | `opencode/step-5-preview-free` | 14.6 (1) | — | — | — | — | — | yayımlanmamış | — | — | — | 4 | PASS | ham API HTTP 403 (CLI-kilidi) |
| `opencode` | `opencode/space-bunny-free` | 13.3 (1) | — | — | — | — | — | 1.000.000ᶜ | 524.288ᶜ | 0/0ᶜ | — | 6 | PASS | ham API HTTP 403 (CLI-kilidi) |
| `opencode` | `nvidia/nemotron-3-ultra-550b:free` | 8.3 (1) | — | — | — | — | — | 1.000.000ᶜ | 65.536ᶜ | 0/0ᶜ | — | 3 | PASS | yalnız Paseo/ACP |
| `opencode` | `poolside/laguna-s-2.1:free` | 2.5 (1) | — | — | — | — | — | 262.144ᶜ | 32.768ᶜ | 0/0 | — | 4 | PASS | yalnız Paseo/ACP |
| `opencode` | `poolside/laguna-xs-2.1:free` | 1.6 (1) | — | — | — | — | — | 262.144ᶜ | 32.768ᶜ | 0.1/0.2ᶜ | — | 4 | **FAIL sapma=NUM=401** | yalnız Paseo/ACP |
| `codex` | `gpt-5.6-terra` + 8 model | — | — | — | — | — | — | — | — | — | — | mod bazlı | — | `config.toml` bilinçli kimi-k3 sabitlemesi; `gpt-*` → `model_not_allowed` |
| `kilo` | 42 free model (3 ajan denendi) | — | — | — | — | — | — | — | — | — | — | thinking | — | canlı: **free-model günlük limiti**, 0 token üretildi |
| `codefast` | opensource 10 + `glm-5.3` (listede, kapalı kapı) | — | — | — | — | — | — | — | — | — | — | codex | — | kendi kapılarında **403**, canlı kapıda **`model_not_allowed`** → ölçüm yok (§1) |
| `qoder` | 2 model (Qwen3.8-Flash vb.) | — | — | — | — | — | — | — | — | 0.00x Credit | — | — | — | bench yapılmadı (bu oturumu yürüten CLI) |
| `claude` | — | — | — | — | — | — | — | — | — | — | — | — | — | `unavailable · disabled` |
| `copilot` | — | — | — | — | — | — | — | — | — | — | — | — | — | `unavailable · disabled` |
| `gemini` | — | — | — | — | — | — | — | — | — | — | — | — | — | `unavailable · disabled` |
| `cline` | — | — | — | — | — | — | — | — | — | — | — | — | — | `unavailable · disabled` |
| `pi` | — | — | — | — | — | — | — | — | — | — | — | — | — | `unavailable · disabled` |
| `omp` | — | — | — | — | — | — | — | — | — | — | — | — | — | `unavailable · disabled` |
| `antigravity` | — | — | — | — | — | — | — | — | — | — | — | — | — | `unavailable · disabled` |
| `muse` | — | — | — | — | — | — | — | — | — | — | — | — | — | `unavailable · disabled` |

ᶜ = değer **ücretli kataloz ikizinden** geldi (`:free` varyantı kataloğa yazılmamış) — `(K)` etiketli, bizim ucun limiti olmayabilir.

### En büyük canlı değerler
- **En yüksek hız (ajan):** `codefast / kimi-k3` (birleşik kapı) — **300.1 t/s** (rakkibin 2.3 katı). (R)
- **En yüksek hız (ham API):** `tokenharbor / deepseek-v4.1-flash:free` — **120.6 t/s**, sonra `claude-haiku-5.5:free` 117.6. (R)
- **En yüksek ücretsiz hız (ajan):** `tokenharbor / claude-haiku-5.5:free` — **131.1 t/s**, 2 koşuda da PASS. (R)
- **En derin akıl üretimi:** `codefast / codefastk3unlimited` — **4559 karakter** reasoning/tur. (R)
- **En çok thinking kademesi:** `openrouter/thinkingmachines/inkling-small:free` — **7 kademe** (default…max). (R)
- **En geniş yayımlanmış context:** `tokenharbor` free ucu — **1.048.576**. (R)
- **Tek doğruluk kırıkları:** `mimo-v2.5:free` 8-transfer setinde C2'yi kaçırdı (88/100); `poolside/laguna-xs-2.1:free` ajan turunda `NUM=401` üretti. (R)

### IQ bulgusu — dürüst sonuç
6 zor soruluk sette (4 haneli çarpma 1234×5678=7006652, `654321 mod 997=289`, kısıtlı dizilim 72, bileşik faiz 100, dizi 171, harmonik ortalama 64) **7 modelin 7'si de 100/100** yaptı: sayısal muhakeme bu modelleri **ayırt etmiyor**, ayırt edici eksen **hız ve akıl üretimi**. 8-transfer setinde yalnız `mimo-v2.5:free` takıldı (88/100). (R)

### 43 hedefli ham tarama kararları (R)
- **7 HTTP 200:** tokenharbor 5 free uç + codefast 2 uç (`kimi-k3-unlimited-api`). Diğerleri red.
- **TokenHarbor ücretli 9 uç → 402** `Your Token Harbor balance is at $0` (bakiye sıfır; yalnız `:free` uçları çalışır).
- **Codefast opensource 11 + glm 1 → 403** `API access denied` (anahtar o kapıya yazılı değil).
- **OpenCode zen 9 free → 403** `OpenCode's free tier can only be used from within OpenCode` (CLI-içi-kilit; ham API ile ölçülemez).
- **Kilo gateway 6 free → 404** (chat uç noktası yok; kilo yalnız ACP üzerinden ölçülebilir).
- İlk taramada (`api-bench.mjs`, `max_tokens:1500`) iki satır bütçe tavanına çarptı (`deepseek-v4.1-flash:free` 1536 tok, `kimi-k3` 1503 tok, `finish_reason=length`) — o değerler geçersizdi. **Bütçe yükseltilerek yeniden koşuldu** (`iq-hard.mjs`): 7 hedefin 7'si de `finish_reason=stop` ile tamamlandı; tablodaki `t/s HAM` sütunu bu tamamlanmış koşudan gelir (120.6 / 117.6 / 99.7 / 80.9 / 71.1 / 62.3 / 33.4).

### Best-for (iş türü → seçim)
- Ham hız / uzun kod üretimi → `codefast / kimi-k3` (300.1 t/s ajan, kod indeksi 76.2ᶜ). (R)
- Ücretsiz + hızlı günlük iş → `tokenharbor / claude-haiku-5.5:free` (131.1 t/s ajan, 0 akıl karakteri, $0). (R)
- Ucuz token başına derinlik / uzun bağlam → `tokenharbor / deepseek-v4-flash:free` (70.9 t/s ajan + 1366 akıl krk, 1M ctx, $0). (R)
- Çok adım akıl yürütme (ücretsiz) → `tokenharbor / deepseek-v4.1-flash:free` (120.6 t/s ham, 1073 akıl krk). (R)
- OpenCode içinde en iyi free → `opencode / opencode/muse-spark-1.3-contributor-free` (80.8 t/s, 6 kademe). (R)
- Kademeli reasoning kontrolü → `openrouter/thinkingmachines/inkling-small:free` (7 kademe, 39.5 t/s). (R)
- Kaçın → `poolside/laguna-xs-2.1:free` (NUM=401), `poolside/laguna-s-2.1:free` (2.5 t/s), Kilo free (günlük limit), `mimo-v2.5:free` (en yavaş free + tek IQ kırığı). (R)

## 6. Model seçimi ve profil (R)

- Seçim alanı: yeni ajan açılırken provider + model; listede `isDefault:true` olan öntekli gelir, `order`/`models` dizisi sırayı belirler.
- Kalıcı paket için `daemon.agentProfiles` (provider+model+thinking+mode) kullan — örnek: `step5` profili `opencode/opencode/step-5-preview-free`.
- Thinking kademe adları provider'a göre farklı: codex-extends `default/low/…/high`, opencode `default/minimal/low/medium/high/xhigh/max`, ACP `auto`.
- Türkçe düşünme kaldıracı: `daemon.appendSystemPrompt` (global) veya `paseo-verimlilik` plugin hook'u — **karar bekliyor**.

## 7. Yeniden koşum (reprodüksiyon)

```
node "$env:LOCALAPPDATA/Temp/codex-measure.mjs  <agent-on-ekleri>"   # codex-extends t/s
node "$env:LOCALAPPDATA/Temp/oc-tps.mjs        <agent-on-ekleri>"    # opencode.db t/s
node "$env:LOCALAPPDATA/Temp/acp-measure.mjs   <agent-on-ekleri>"    # durum+NUM doğrulama
node "$env:LOCALAPPDATA/Temp/th-limits.mjs"                         # TokenHarbor limitleri
node "$env:LOCALAPPDATA/Temp/api-bench.mjs"                         # 43 hedefli ham HTTP taramasi -> api-bench.json
node "$env:LOCALAPPDATA/Temp/iq-bench.mjs"                          # 8 soruluk transfer IQ seti  -> iq-bench.json
node "$env:LOCALAPPDATA/Temp/iq-hard.mjs"                           # 6 soruluk zor IQ + tamamlanmis ham t/s -> iq-hard.json
node "$env:LOCALAPPDATA/Temp/iki-tablo.mjs"                         # birlesik bench + ozellik tablosu -> iki-tablo.md
```

## 8. Yapılabilecekler / açıklar

- Kilo free'yi açmak: 10 USD kredi → 1000 free istek/gün (karar insana ait).
- Codefast ailesi tek id'de birleşti (§1): `codefast.models` **12 model** listeli, bunların **2'si koşuyor** (`kimi-k3`, `codefastk3unlimited`). `glm-5.3` + 9 opensource model listede duruyor; kendi kapıları (`glm-api`, `open-source-api/v1`) her modelde 403 veriyor, canlı kapıdan geçince `model_not_allowed` (§1) — hesap/PAYG açılırsa yeniden ölçüm koşulabilir, config değişikliği gerekmez.
- Codex native `gpt-*` modelleri: istenirse `config.toml` satır 1–2 geçici değiştirilip 9 model koşulabilir; mevcut Kimi K3 sabitlemesi çalışıyor ve hızı ölçüldü (300.1 t/s).
- Temiz hız ölçümü: plugin'siz/boş workspace'te ardışık tur (kir etkisi olmadan).
- TokenHarbor kataloğunda 70 model var, biz 14ünü ekledik; kalan 56 modelden free olanlar zaten listede (5/5 kapıldı).
- Ham tarama kalıcı bulguları: TokenHarbor **ücretli** 9 uç 402 (bakiye $0 — dolarsa yeniden koşulabilir), opencode-zen free 9 uç **403 CLI-içi-kilit** (ham API ile hiç ölçülemez), kilo gateway **404** (chat uç noktası yok — kilo yalnız ACP/agent üzerinden ölçülebilir).
- Açık ölçüm boşlukları: ham API yalnız 43 hedefin 7'sine açıldı (diğerleri 402/403/404) — `opencode`, `kilo`, `qoder` hızları **yalnız ajan hattı üzerinden** ölçülebilir; Codefast'ın `glm-5.3` + opensource modelleri Paseo kaydında **listeli** ama kapıları 403 verdiği için hızları ölçülemedi (§1, §8) — anahtar/PAYG açılınca aynı kayıtlarla koşulabilir.

## 9. Özellik tablosu — 14 sağlayıcı (R)

Kaynak: `paseo provider ls --json` (durum, model sayısı, `defaultMode`, `modes`), `paseo provider diagnostic <id> --json` (binary/kurulum) ve resmî Paseo dokümanı (native vs ACP katalog, orkestrasyon, Antigravity kısıtları). Bu sütunlar **hız ölçümü değil, yetenek/erişim yüzeyidir** — §5'sindeki t/s ile karıştırılmaz.

| Sağlayıcı (id) | Etiket | Durum | Model sayısı | Tür | Context (ölçülen en geniş) | Thinking kademesi | Varsayılan mod | Mod / izin | Subagent açma | Handoff + steering | Worktree / izole ortam | Belgelenmiş yetenek & kısıt |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `claude` | Claude | unavailable | — | native · Claude Code | yayımlanmamış | — | auto | — | Evet — orkestrasyon sağlayıcıdan bağımsız, host'taki her provider/model seçilebilir (sağlayıcı şu an kapalı) | Evet — `/paseo-handoff` + agentId'ye prompt | Evet — Paseo worktree/izole workspace | streaming, derin muhakeme, MCP |
| `codex` | Codex | available | 9 model | native · Codex CLI | yayımlanmamış | mod bazlı | auto-review | Default Permissions, Auto-review, Full Access | Evet — orkestrasyon sağlayıcıdan bağımsız | Evet — `/paseo-handoff` + agentId'ye prompt | Evet — Paseo worktree/izole workspace | izole ortam, seçilebilir internet erişimi |
| `copilot` | Copilot | unavailable | — | ACP · GitHub Copilot | yayımlanmamış | — | ACP oturum modu | — | Evet — orkestrasyon sağlayıcıdan bağımsız (sağlayıcı şu an kapalı) | Evet — `/paseo-handoff` + agentId'ye prompt | Evet — Paseo worktree/izole workspace | ACP katalog kurulumu, tek tık |
| `opencode` | OpenCode | available | 550 model | native · OpenCode | 262.144 | 7 kademe (default…max) | default | Build, Plan | Evet — bu oturumda canlı test: subagent açıldı | Evet — `/paseo-handoff` + agentId'ye prompt | Evet — Paseo worktree/izole workspace | çok sağlayıcılı model desteği, `opencode.db` üzerinden ölçülebilir |
| `pi` | Pi | unavailable | — | native · Pi | yayımlanmamış | — | default | — | Evet — orkestrasyon sağlayıcıdan bağımsız (sağlayıcı şu an kapalı) | Evet — `/paseo-handoff` + agentId'ye prompt | Evet — Paseo worktree/izole workspace | minimal terminal ajanı, çoklu LLM |
| `omp` | Oh My Pi | unavailable | — | native · Oh My Pi | yayımlanmamış | — | full | — | Evet — orkestrasyon sağlayıcıdan bağımsız (sağlayıcı şu an kapalı) | Evet — `/paseo-handoff` + agentId'ye prompt | Evet — Paseo worktree/izole workspace | yerel eklenti |
| `antigravity` | Antigravity | unavailable | — | native · Antigravity | yayımlanmamış | — | default | — | Evet — orkestrasyon sağlayıcıdan bağımsız (sağlayıcı şu an kapalı) | **KAPALI** (belge: Paseo MCP araçları ve steering devre dışı) | Evet — Paseo worktree/izole workspace | **YALNIZ "full access"** (izin soruları atlanır); MCP + steering kapalı; görseller dosya yolu olarak verilir; daemon yeniden başlatınca Paseo transkripti sıfırlanır |
| `muse` | Muse Code | unavailable | — | native · Muse Code | yayımlanmamış | — | default | — | Evet — orkestrasyon sağlayıcıdan bağımsız (sağlayıcı şu an kapalı) | Evet — `/paseo-handoff` + agentId'ye prompt | Evet — Paseo worktree/izole workspace | belgelenmiş ek yetenek yok |
| `kilo` | Kilo | available | 829 model | ACP · `kilo.cmd acp` (v7.8.8) | yayımlanmamış | mod bazlı | default | code, ask, debug, orchestrator, plan | Evet — bu oturumda canlı test: subagent açıldı; ayrıca `orchestrator` modu | Evet — `/paseo-handoff` + agentId'ye prompt | Evet — Paseo worktree/izole workspace | `orchestrator` modu (çoklu ajan), 156 kayıtlık katalogda 21 modelde `codingIndex` |
| `gemini` | Gemini CLI | unavailable | — | ACP · Gemini CLI | yayımlanmamış | — | default | — | Evet — orkestrasyon sağlayıcıdan bağımsız (sağlayıcı şu an kapalı) | Evet — `/paseo-handoff` + agentId'ye prompt | Evet — Paseo worktree/izole workspace | ACP katalog kurulumu |
| `cline` | Cline | unavailable | — | ACP · Cline | yayımlanmamış | — | default | — | Evet — orkestrasyon sağlayıcıdan bağımsız (sağlayıcı şu an kapalı) | Evet — `/paseo-handoff` + agentId'ye prompt | Evet — Paseo worktree/izole workspace | ACP katalog kurulumu |
| `qoder` | Qoder CLI | available | 2 model | ACP · `qodercli --acp` | yayımlanmamış | mod bazlı | default | Default, Accept Edits, Bypass Permissions, Plan | Evet — orkestrasyon sağlayıcıdan bağımsız (bu oturumu yürüten CLI) | Evet — `/paseo-handoff` + agentId'ye prompt | Evet — Paseo worktree/izole workspace | ACP oturum modları + Accept Edits/Bypass |
| `tokenharbor` | TokenHarbor | available | 14 model | custom · extends `codex` | **1.048.576** | mod bazlı (`codex` kademe seti) | auto-review | Default Permissions, Auto-review, Full Access | Evet — bu oturumda canlı test: subagent açıldı | Evet — `/paseo-handoff` + agentId'ye prompt | Evet — Paseo worktree/izole workspace | `codex` ile aynı araç seti (`OPENAI_BASE_URL` köprüsü); 7 günlük free kota |
| `codefast` | Codefast | available | **12 model** (2'si koşar) | custom · extends `codex` (`kimi-k3-unlimited-api/v1`) | 1.048.576ᶜ | mod bazlı | auto-review | Default Permissions, Auto-review, Full Access | Evet — bu oturumda canlı test: subagent açıldı (`NUM=391`) | Evet — `/paseo-handoff` + agentId'ye prompt | Evet — Paseo worktree/izole workspace | **Birleşik aile** (§1): eski `codefast-k3` + `codefast-glm` + opensource modeller tek id altında, `models` dizisinde 12 id listeli. Canlı `/responses` probe yalnız `kimi-k3`/`codefastk3unlimited`'de 200; diğer 10 model kendi kapılarında 403, canlı kapıda `model_not_allowed`. Kök `/v1` 72 model listeliyor ama bu anahtara hiçbirini route etmiyor (403). En yüksek ölçülen ajan hızı (300.1 t/s) |

### Özellik notları (R)
- **Subagent / orkestrasyon sağlayıcıdan bağımsızdır**: Paseo host'taki hangi provider/model kurulduysa onu alt ajan olarak açabilir — yani "bu model subagent açamaz" diye bir satır yok, yalnız **o an kapalı olan provider** satırı var (`unavailable · disabled`).
- **Handoff**: `/paseo-handoff` devir töreni + `send_agent_prompt` (agentId'ye prompt) tüm açık provider'larda çalışıyor; **tek belgelenmiş istisna Antigravity** — orada MCP araçları ve steering kapalı, dolayısıyla steering tabanlı devir yerine yeniden oturum açma gerekir.
- **Worktree**: izolasyon Paseo tarafında sağlanır (worktree / ayrı workspace), provider'a ait bir özellik değildir; 14 sağlayıcının tamamında aynı.
- **Context sütunu**: `yayımlanmamış` = provider/model katalogda context yayımlamıyor (ölçemedik, tahmin yazılmadı). Sayı olanlar §5 ile aynı kaynak: `tokenharbor` free uçları 1.048.576 (kendi freeCatalog), `opencode` 262.144 (`poolside/laguna-*` free), ᶜ = ücretli katalog ikizinden.
- **Thinking kademesi**: adlar provider'a göre değişiyor — `codex`/codex-extends kademe seti mod bazlı, `opencode` 7 kademe (default…max), ACP sağlayıcılar oturum modu üzerinden. En yüksek kademe sayısı ölçülen: `inkling-small:free` 7 (§5).
- **Mod / izin**: `modes` alanı `paseo provider ls --json`'da **virgülle ayrılmış tek string** döner (dizi değil) — tablo bu string'in çözülmüş halidir.
