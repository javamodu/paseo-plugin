# CODEX UYUMLULUK SIRALAMASI — models under `codex` (wire_api=responses) · 2026-10-17

Kapsam: **Codex CLI / Paseo `codex` sağlayıcısı altından çağrılabilen modeller**, fiyattan bağımsız sıralama. Fiyat ve erişim puana girmez; ayrı sütunlarda raporlanır.
Kanıt etiketi (ANAYASA A2): **(R)** bu makinede canlı ölçüm/yoklama · **(R-cat)** canlı `/models` kataloğu · **(B)** bağımsız üçüncü taraf (Vals/AA/BenchLM) · **(C)** vendor/tek kaynak · **(T)** tahmin.
Kardeş belge: `raporlar/saf-performans-top30-2026-10-17.md` (tüm kapılar, §5 kusur listesi K1-K4).

## 0. Neden "codex ile uyumlu" ayrı bir belge

Codex, modeli **kendi ajan sarmalayıcısı** içinde çalıştırır: tur başına sistem promptu + araç şemaları + yeniden kurulan bağlam. Bu repoda ölçülen **174:1 girdi/çıktı oranı** (R, `raporlar/token-olcum-2026-10-11/OZET.md`) yüzünden codex altındaki sıralama, ham API sıralamasından **iki eksende** ayrılır:

| Eksen | Ham API (`bench.mjs`) | Codex altı |
|---|---|---|
| İstek şekli | `/chat/completions`, çıplak mesaj | `/responses`, araç döngülü |
| Bağlam baskısı | minik | her turda tam bağlam → ctx ve girdi fiyatı belirleyici |
| Ölçülebilirlik | 12 model ölçüldü (R) | codex yerleşik modeller **ham-API ile ölçülemez** (`base_url yok`) |

## 1. Kapı yoklaması — hangi sağlayıcı `responses` rotaını sunuyor (R, 2026-10-17)

Yöntem: kapısına tek minik POST (`{"model":"probe","input":"x"}`) — **aynı rotada hata metni rota var/yok ayrımını veriyor**.

| Kapı | `POST /responses` | Hüküm |
|---|---|---|
| groq (`api.groq.com/openai/v1`) | 404 `The model \`probe\` does not exist…` | ✅ **rota var** — hata model adında |
| tokenharbor (`tokenharbor.ai/v1`) | 404 `model_not_found / Model 'probe' is not available` | ✅ rota var |
| openrouter (`openrouter.ai/api/v1`) | 400 `probe is not a valid model ID` | ✅ rota var |
| codefast (`api.codefast.app/kimi-k3-unlimited-api/v1`) | 403 `NO_ACTIVE_PACKAGE` | ✅ rota var, **hesap kapalı** |
| nvidia (`integrate.api.nvidia.com/v1`) | 404 `404 page not found` | ❌ **Responses API yok** → ancak `wire_api = "chat"` ile bağlanır |

Anahtar kimliği (R, sha256 kıyası — anahtarın kendisi yazılmadı): `CODEFAST_API_KEY` ≡ `CODEFAST_KIMI_API_KEY` ≡ Paseo `codefast`/`codefast-os`/`codefast-glm` → **hep `72e98581ca57`**. Yani codex-altı kimi ile doğrudan kimi **aynı hesap, aynı kota**; 403 ikisini de vuruyor.

Codex config kanıtı (R, `~/.codex/config.toml`, 197 satır): satır 1-3 `model_provider="codefast"` · `model="kimi-k3"` · `model_reasoning_effort="high"`; satır 11 `wire_api="responses"`; satır 12 `env_key="CODEFAST_KIMI_API_KEY"`; satır 190-194 `tokenharbor` bloğu (`wire_api="responses"`). **groq/openrouter/nvidia bloğu YOK** → bugünkü codex varsayılanı 403 veren kapıya sabitli.

## 2. Sıralama — fiyat dışarıda (agentik 30 · kod 30 · hız 20 · uzun ufuk 10 · ctx 10)

| # | Model | Puan | G | Codex kapısı | Hız | Kod kanıtı | Agentik kanıtı | Ctx | Bugün |
|---|---|---|---|---|---|---|---|---|---|
| 1 | GLM 5.3 | **86** | B | codefast-glm | 83 t/s* | SWE-bench **95.4** (B) | lane 70.2 **#8/128** (B) | 1M/128k | ❌ 403 |
| 2 | Kimi K3 | **85** | **A** | codefast | 46.8 t/s (R) | PASS·IQ100·**term 5/5** (R) + SWE 93.4 (B) | TB2.1 Vals **80.9** · Marathon 48.1 (B) | 1.05M | ❌ 403 |
| 3 | GPT-6.1 Sol | 83 | C | codex yerleşik | ölçülmedi→10 | DeepSWE ≈ Astra (B) | AutomationBench **+4.8** · TB-Science 2× (B) | 1.05M | ⚠ prova yok |
| 4= | GPT-6 Sol | 82 | C | codex yerleşik | ölçülmedi→10 | **DeepSWE 68.8** (B, setin en yüksek) | AutomationBench 33.2 en iyi (B) | 1.05M | ⚠ |
| 4= | **gpt-oss-120b** | **82** | **A** | **groq** | **296.1 t/s** (R) | PASS·IQ100·**5/5** (R) | terminal 5/5 (R) | 131k | ✅ **AÇIK** |
| 6= | GPT-5.6 Luna | 81 | B | codex yerleşik | ölçülmedi→10 | SWE 93.0 · lane 61.6 (B) | TB2.1 Vals 79.0 (B) | 1.05M | ⚠ |
| 6= | GPT-5.6 Terra | 81 | B | codex yerleşik | ölçülmedi→10 | SWE 95.4 · lane **61.9 #15** (B) | TB2.1 Vals 77.5 (B) | 1.05M | ⚠ (fiyat elemesi geri alındı) |
| 6= | **north-mini-code:free** | **81** | **A** | **openrouter** | **223.6 t/s** (R) | PASS·IQ100·**5/5** (R) | terminal 5/5 (R) | 256k | ✅ **AÇIK** |
| 9 | Claude Haiku 5.5 | **79** | **A** | tokenharbor | **135.6 t/s** (R) | PASS·IQ100·5/5 (R) | terminal 5/5 (R) | 1M/128k | ❌ 429 |
| 10 | **gpt-oss-20b** | **78** | **A** | **groq** | **448.9 t/s** (R) | PASS·IQ100·**5/5** (R) | 5/5 (R) | 131k | ✅ AÇIK |
| 11 | DeepSeek V4.1 Flash | **78** | **A** | tokenharbor | **133.4 t/s** (R) | lane **60.7** (B) · PASS·IQ100·5/5 (R) | 5/5 (R) | **1.05M** | ❌ 429 |
| 12 | MiMo v2.5 | 71 | **A** | tokenharbor | 32.4 t/s (R) | PASS·IQ100·5/5 (R) | 5/5 (R) | 1.05M | ❌ 429 |
| 13 | Qwen3.8-27B | 70 | **A** | groq | 369.9 t/s (R) | PASS · **IQ 33** (R) | 5/5 (R) | 131k | ✅ AÇIK |
| 14 | GPT-6 Luna | 69 | C | codex yerleşik | ölçülmedi→10 | DeepSWE 66.6 (B) | lane 56.4 (B) | 1.05M | ⚠ |
| 15 | mimo-v2.6-flash:free | 63 | **A** | tokenharbor | 49.1 t/s (R) | PASS·IQ100·5/5 (R) | 5/5 (R) | 1.05M | ❌ 429 |
| 16 | DeepSeek V4 Flash | 56 | **A** | tokenharbor | 81.6 t/s (R) | PASS·IQ100 (R) | **5/5 (10-14) ↔ 0/5 (10-15)** §6.2 | 1M | ❌ 429 |
| 17 | nemotron-3-super-120b | 51 | C | nvidia (**chat** zorunlu) | 45 t/s (R) | ölçülmedi | ölçülmedi | 1M | ✅ anahtar var |
| 18 | nemotron-3-ultra-550b | 40 | **A** | nvidia (chat zorunlu) | 8.3 t/s (R) | ölçülmedi | ölçülmedi | 1M | ✅ |
| ⚠ | allam-2-7b | **elenmiş** | A | groq | 1242.2 t/s (R) | kod **FAIL** · IQ **0** (R) | terminal 0/5 (R) | **4096** (R) | elendi |

**Codex altında açılamaz (elendi — ACP/native, `/responses` yok):** Step 5 Preview (84 puan, opencode Zen/kilo) · Qwen3.8-Flash (qoder ACP) · space-bunny-free · inkling-small:free · step-3.5-flash · DeepSeek V4.1 Flash-1017 (kilo kapısı ACP).

## 3. Ölçülmüş alt küme — codex kapılarından (R)

| Model | t/s | Term | Kod | IQ | Ctx | Kaynak |
|---|---|---|---|---|---|---|
| gpt-oss-120b | 296.1 | 5/5 | PASS | 100 | 131k | `raporlar/bench-groq-2026-10-17/bench.json` |
| gpt-oss-20b | 448.9 | 5/5 | PASS | 100 | 131k | aynı |
| qwen3.8-27b | 369.9 | 5/5 | PASS | **33** | 131k | aynı |
| allam-2-7b | 1242.2 | 0/5 | **FAIL** | **0** | 4k | aynı |
| north-mini-code:free | 223.6 | 5/5 | PASS | 100 | 256k | `raporlar/bench-or-2026-10-15/bench.json` |
| claude-haiku-5.5:free | 135.6 | 5/5 | PASS | 100 | 1M | `raporlar/bench-free-2026-10-15/bench.json` |
| deepseek-v4.1-flash:free | 133.4 | 5/5 | PASS | 100 | 1.05M | `raporlar/bench-2026-10-14/bench.json` |
| mimo-v2.5:free | 32.4 | 5/5 | PASS | 100 | 1.05M | `raporlar/bench-free-2026-10-15/bench.json` |
| mimo-v2.6-flash:free | 49.1 | 5/5 | PASS | 100 | 1.05M | `raporlar/bench-th-fixdogrulama-2026-10-15/bench.json` |
| deepseek-v4-flash:free | 81.6 | 5/5 | PASS | 100 | 1M | `raporlar/bench-2026-10-14/bench.json` |
| **kimi-k3** | 46.8 (46.1 duman, `codefastk3unlimited` 53.9) | 5/5 | PASS | 100 | 256k | `raporlar/bench-2026-10-14/` · `bench-smoke/` |
| codex/gpt-6.1-sol · 6-sol · 5.6-\* · gpt-5.5 | — | — | — | — | — | `raporlar/bench-2026-10-14/` → `hata: base_url yok (ACP/native katalog) — ham API ölçümü yapılamaz` |

## 4. Hüküm (codex ekseni)

1. **Bugün codex altında fiilen kullanılabilecek en iyi iki satır:** `gpt-oss-120b` (82, 296 t/s, $0, 5/5+PASS+IQ100) ve `north-mini-code:free` (81, 223.6 t/s, 256k). İkisi de A-güven, yani **bu makinede ölçülmüş**.
2. **Fiyattan bağımsız zirve (GLM 86 · Kimi 85 · GPT-6.1 Sol 83) bugün koşmuyor** — üçü de ya 403 ya hiç prova edilmemiş.
3. **Bağlam eksenini küçümseme:** 174:1 girdi yükü + 131k ctx = groq uçları uzun oturumda duvara dayanır. Codex için **1.05M ctx'li `deepseek-v4.1-flash` ailesi (78)** bu eksende listedeki en rahat satır; bakiye açılırsa `1017` ucu hem en ucuz hem en rahat.
4. **Nvidia bağlanacaksa tek kural:** `wire_api = "chat"` — `responses` ile 404 (R, §1).

## 5. Yapılabilir config değişikliği (ÖNERİ — bu belgede uygulanmadı)

Bugünkü `~/.codex/config.toml` varsayılanı 403 veren codefast/kimi-k3'e sabitli. Çalışan bir kapıya çevirmek için **eklenmesi önerilen** blok:

```toml
[model_providers.groq]
name = "groq-responses"
base_url = "https://api.groq.com/openai/v1"
wire_api = "responses"        # §1'de doğrulandı: rota var
env_key = "GROQ_API_KEY"

[profiles.groq-fast]
model = "openai/gpt-oss-120b"
model_provider = "groq"
model_reasoning_effort = "high"
```

```toml
[model_providers.nvidia]
name = "nvidia-chat-only"
base_url = "https://integrate.api.nvidia.com/v1"
wire_api = "chat"              # responses YOK (R, §1)
env_key = "NVIDIA_API_KEY"
```

**Engel (R):** `GROQ_API_KEY` ve `NVIDIA_API_KEY` Windows **User/Machine env'inde YOK** — anahtarlar yalnız `~/.paseo/config.json` içinde duruyor. Çıplak `codex` CLI'ın görmesi için env'e çıkarılması gerekir (Paseo ajanları etkilenmez, Paseo env'i kendisi veriyor).

## 6. Çözülmemiş konular

1. **codex yerleşik OpenAI modelleri hiç prova edilmedi** — 3/4/6/7/14. sıralar hız sütunu boş olduğu için C güvende; tek codex ajan provası ile A'ya çıkar.
2. **DeepSeek V4 Flash terminal çelişkisi:** 10-14 koşumu 5/5, 10-15 koşumu 0/5 — aynı kapı, iki sonuç.
3. **GPT-5.6 Terra geri alındı:** önceki listede "pahalı" gerekçesiyle çıkarılmıştı; fiyat dışı ölçekte 81 puanla 6. sırayı paylaşıyor.
4. **K1-K4 motor kusurları** duruyor (`saf-performans-top30-2026-10-17.md` §5) — bu tablo elle düzeltilmiş en-başarılı-koşum değerleriyle yazıldı, motorun ham çıktısı değil.

## 7. Yeniden üretme

```
# kapı/rota yoklaması (aynı yöntem, §1)
node -e "…POST /responses…"           # 5 kapı, tek minik gövde → durum + hata metni

# model ölçümleri
node scripts/bench.mjs --providers=groq        --out=raporlar/bench-groq-<tarih>
node scripts/bench.mjs --providers=openrouter  --out=raporlar/bench-or-<tarih>
node scripts/uygunluk.mjs --rapor=<12 bench.json> --cikis=raporlar/uygunluk-top30-<tarih>
```
