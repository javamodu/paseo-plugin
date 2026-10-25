# SAF PERFORMANS SIRALAMASI — top 30 · 2026-10-17

Kapsam: **fiyat ve erişim puanlamada YOK** — yalnız yetenek (agentik/kod/hız/ufuk/bağlam). "Bu plugini yazmak için modele göre karar" sorusunun performans ekseni; erişim durumu §5'te ayrı tutuldu.
Kanıt etiketi (ANAYASA A2): **(R)** bu repoda canlı ölçüm · **(R-cat)** sağlayıcının canlı `/models` kataloğundan okundu · **(B)** bağımsız üçüncü taraf ölçüm (Vals/AA/BenchLM) · **(T)** tahmin · **\*** tek kaynak.
Yeniden üretme: `node scripts/uygunluk.mjs` + 12 `bench.json` (§6 komutu).

## 1. Metodoloji

| Bileşen | Ağırlık | Ölçek |
|---|---|---|
| Agentik | 30 | bağımsız lane/TB sırası; yerel terminal 5/5 = 20 tavan tabanı |
| Kod kalitesi | 30 | SWE-bench/DeepSWE/lane; yerel `kod=PASS` + IQ |
| Hız | 20 | **log ölçek**: `s = clamp((log10(t)−log10(5))/(log10(250)−log10(5)),0,1) × 20` (R) |
| Uzun ufuk | 10 | SWE-Marathon/DeepSWE/FrontierSWE/AA-LCR |
| Bağlam | 10 | ctx + maks çıkış |

Üç kural (önceki hataların düzeltmesi):
1. **Ölçülmemiş hız = nötr 10/20**, ceza değil (veri yok ≠ yavaş) → satır **C** güvene düşer.
2. **Lineer hız bandı kullanılmaz** — 5–250 t/s kalibrasyonu ücretli modelleri (30–120 t/s) yapay olarak çökertiyordu.
3. **Vendor rakamı bağımsız rakamla aynı satıra konmaz**; çelişki §7'de listelenir.

## 2. Sıralama (top 30)

| # | Model | Puan | G | Hız | Kod kanıtı | Agentik kanıtı | Ctx |
|---|---|---|---|---|---|---|---|
| 1 | GLM 5.3 | **86** | B | 83 t/s* | SWE-bench **95.4** (B) | lane 70.2 **#8/128** (B) · TB3.0 28.3 lider | 1M/128k (R-cat) |
| 2 | Kimi K3 | **85** | **A** | 46.8 t/s (R) · 41.7* | SWE 93.4 (B) · yerel 5/5+PASS+IQ100 (R) | TB2.1 Vals **80.9** (B) · Marathon 48.1 | 1.05M (R-cat) |
| 3 | Step 5 Preview | **84** | A/B | 45 t/s (R, nvidia) | DeepSWE 67.7 · ProgramBench 80.5 (B) | TB2.1 85.0 · ALE 29.5 (B) | 1M |
| 4 | GPT-6.1 Sol | 83 | C | ölçülmedi→10 | DeepSWE ≈ Astra (B) | AutomationBench **+4.8** · TB-Science 2× (B) | 1.05M |
| 5= | GPT-6 Sol | 82 | C | ölçülmedi→10 | **DeepSWE 68.8** (setin en yüksek, B) | AutomationBench **33.2** en iyi (B) | 1.05M |
| 5= | gpt-oss-120b (groq) | **82** | **A** | **296.1 t/s** (R) | PASS · IQ 100 (R) | terminal **5/5** (R) | 131k (R) |
| 7= | GPT-5.6 Luna | 81 | B | ölçülmedi→10 | SWE 93.0 · lane 61.6 (B) | TB2.1 Vals 79.0 (B) | 1.05M |
| 7= | north-mini-code:free | **81** | **A** | **223.6 t/s** (R) | PASS · IQ 100 (R) | terminal **5/5** (R) | 256k (R) |
| 9 | Claude Haiku 5.5 | **79** | **A** | **135.6 t/s** (R) | PASS · IQ 100 (R) | terminal 5/5 (R) | 1M/128k |
| 10 | gpt-oss-20b (groq) | **78** | **A** | **448.9 t/s** (R) | PASS · IQ 100 (R) | terminal **5/5** (R) | 131k (R) |
| 11 | DeepSeek V4.1 Flash | **78** | **A** | **133.4 t/s** (R) | lane **60.7** (B) · PASS (R) | terminal 5/5 (R) | 1.05M (R-cat) |
| 12= | GLM 5.2 | 75 | B | ~168 t/s* | SWE-Pro 62.1 (B) | TB2.1 81.0 · lane 57.4 (B) | 1M |
| 12= | GLM 5.3 Flash | 75 | B | ölçülmedi→10 | SWE **92.0** (B) | TB2.1 Vals 62.9 (B) | 1M |
| 14 | Qwen3.8-27B (groq) | 70 | **A** | **369.9 t/s** (R) | PASS · **IQ 33** (R) | terminal 5/5 (R) · lane 61.7 (B) | 131k (R) |
| 15 | MiMo v2.5 | 71 | **A** | 32.4 t/s (R) | PASS · IQ 100 (R) | terminal 5/5 (R) | 1.05M (R-cat) |
| 16= | DeepSeek V4 Pro | 70 | B | ~115 t/s* | LiveCodeBench **#1** 93.5 (B) | Vals TB **54.7** ⚠ vendor 87.9 (§7) | 1M |
| 16= | Qwen3.8 Flash-Next | 70 | B | ölçülmedi→10 | SWE-Pro 62.5 · LCB v6 91.9 (B) | lane **65.6 #17/128** (B) | 262k |
| 18= | GPT-6 Luna | 69 | C | ölçülmedi→10 | DeepSWE 66.6 (B) | lane 56.4 · ARC-AGI 86.7 (B) | 1.05M |
| 18= | Qwen3.8 Max | 69 | B | ölçülmedi→10 | SWE 85.6 · multimodal **#4/54** (B) | TB2.1 Vals 67.4 (B) | 1M/131k |
| 20 | mimo-v2.6-flash:free | 63 | **A** | 49.1 t/s (R) | PASS · IQ 100 (R) | terminal 5/5 (R) | 1.05M (R-cat) |
| 21 | MiniMax M2.5 | 59 | C | ölçülmedi→10 | SWE 80.2 (B) | veri yok | 1M |
| 22 | Qwen3.7-Plus | 58 | C | ölçülmedi→10 | SWE-Verified 77.7 (B) | veri yok | 1M |
| 23 | Kimi K2.6 | 57 | C | ölçülmedi→10 | SWE-Verified 80.2 (B) | veri yok | 262k |
| 24 | DeepSeek V4 Flash | 56 | **A** | 81.6 t/s (R) | PASS · IQ 100 (R) | **5/5 (10-14) ↔ 0/5 (10-15)** (§7) | 1M (R-cat) |
| 25 | Qwen3.8-Flash (qoder) | 55 | C | ölçülmedi→10 | 1 probe geçti (R) | ölçülmedi | yayımlanmadı |
| 26 | space-bunny-free | 52 | C | 13.3 t/s (R) | NUM 391 PASS (R) | terminal ölçülmedi | 1M |
| 27 | nemotron-3-super-120b | 51 | C | 45 t/s (R) | ölçülmedi | ölçülmedi | 1M |
| 28= | step-3.5-flash | 50 | C | ölçülmedi→10 | SWE-Verified 74.4 (B) | veri yok | 66k |
| 28= | inkling-small:free | 50 | C | 39.5 t/s (R) | ölçülmedi | 7 thinking kademe (R-cat) | — |
| 30 | nemotron-3-ultra-550b | 40 | **A** | 8.3 t/s (R) | ölçülmedi | ölçülmedi | 1M |
| ⚠ | allam-2-7b (groq) | **elenmiş** | **A** | **1242.2 t/s** (R) | kod **FAIL** · IQ **0** (R) | terminal 0/5 (R) | **4096** (R) |

## 3. Benchmark'la ölçülebilen tek alt küme (12 model)

Top 30'un **18 satırı hiç koşamadı** — yerel harness yalnız 12 model için başarılı ölçüm üretti (108 birleştirilmiş satırın 96'sı erişim-engelli veya ACP/native `base_url` yok).

| # | Model | Puan | t/s (R) | Term | Kod | IQ | Ctx | Kaynak koşum |
|---|---|---|---|---|---|---|---|---|
| 1 | north-mini-code:free | 82.1 | 223.6 | 5/5 | PASS | 100 | 256k | `raporlar/bench-or-2026-10-15/` |
| 2 | deepseek-v4.1-flash:free | 77.2→**79** | 133.4 | 5/5 | PASS | 100 | 1.05M | `raporlar/bench-2026-10-14/` |
| 3 | mimo-v2.6-flash:free | 73.9 | 49.1 | 5/5 | PASS | 100 | 1.05M | `raporlar/bench-th-fixdogrulama-2026-10-15/` |
| 4 | mimo-v2.5:free | 72.7 | 32.4 | 5/5 | PASS | 100 | 1.05M | `raporlar/bench-free-2026-10-15/` |
| 5 | claude-haiku-5.5:free | 72.6 | 135.6 | 5/5 | PASS | 100 | 1M | `raporlar/bench-free-2026-10-15/` |
| 6 | gpt-oss-120b | 71.9 | 296.1 | 5/5 | PASS | 100 | 131k | `raporlar/bench-groq-2026-10-17/` |
| 7 | codefastk3unlimited | 70.4 | 53.9 | 5/5 | PASS | 100 | 256k | `raporlar/bench-2026-10-14/` |
| 8 | gpt-oss-20b | 69.9 | 448.9 | 5/5 | PASS | 100 | 131k | `raporlar/bench-groq-2026-10-17/` |
| 9 | qwen3.8-27b | 63.0 | 369.9 | 5/5 | PASS | **33** | 131k | `raporlar/bench-groq-2026-10-17/` |
| 10 | deepseek-v4-flash:free | 62.2 | 81.6 | 5/5 | PASS | 100 | 1M | `raporlar/bench-2026-10-14/` |
| 11 | kimi-k3 | 40 *(§5)* | 46.8 | 5/5 | PASS | 100 | 256k | `raporlar/bench-2026-10-14/` |
| 12 | allam-2-7b | 35 | 1242.2 | 0/5 | **FAIL** | 0 | 4k | `raporlar/bench-groq-2026-10-17/` |

Not: 2. satırda motor 91.4 t/s kullandı (aynı tarihli daha zayıf koşum) — **en iyi başarılı koşum** 133.4 t/s, puanı bu yüzden ~79 (kusur §5/K1).

## 4. Ölçüm tarihi

| Koşum | Tarih | Ne ölçtü |
|---|---|---|
| `bench-2026-10-14` | 2026-10-14 | 98 satır · 8 provider (geniş tarama) |
| `bench-smoke` | 2026-10-14 | 2 satır duman |
| `bench-free-2026-10-15`, `bench-or-2026-10-15`, `bench-th-fixdogrulama-2026-10-15`, `bench-codefast-fix-2026-10-15`, `bench-free-2026-10-15-tirmanma` | 2026-10-15 | 17 satır |
| `bench-kimi-2026-10-17`, `bench-th-2026-10-17`, `bench-th-1017-2026-10-17`, `bench-groq-2026-10-17`, `bench-dortlu-2026-10-17` | **2026-10-17** | 20 satır (4'ü groq'ta başarılı, 16'sı kota/bakiye/403) |

Birleştirme kuralı: **en yeni tarih** esas; aynı tarihli koşumlarda motor argüman sırasına bakıyor (§5/K1).

## 5. Bilinen kusurlar — puanı bu tablo etkileniyor

| # | Kusur | Etki |
|---|---|---|
| **K1** | Aynı tarihli raporlarda **kanıtı zayıf koşum** seçiliyor | `deepseek-v4.1-flash` 91.4 yerine 133.4 t/s; `claude-haiku-5.5` 4/5 yerine 5/5 → hız/bağlam bileşenleri eksik |
| **K2** | Profilinde seviye olmayan modellerde `puan` alanı **boş** | 21 ölçülmüş model gizlendi (`gpt-oss-120b` 71.9 ancak elle hesaplandı) |
| **K3** | Yeni ama **erişim-engelli** koşum, eski başarılı ölçümün üstüne yazıyor | `kimi-k3` 40 görünüyor; yetenek kanıtı 5/5+PASS+46.8 t/s → düzeltilirse ~70 |
| K4 | `model-katalog.mjs` provider önekini temizlemiyor | aynı aile 5 "kanonik" gruba bölünüyor (`deepseek-v4.1-flash-1017` vs `deepseek/…` vs `tokenharbor/…`) |

## 6. Erişim durumu (puanlamaya GİRMEDİ)

| Durum | Modeller |
|---|---|
| ✅ bugün açık + ölçülmüş | north-mini-code:free · gpt-oss-120b · gpt-oss-20b · qwen3.8-27b (groq/openrouter) |
| ❌ 429 kota (TokenHarbor free) | deepseek-v4.1-flash:free · deepseek-v4-flash:free · mimo-v2.5/v2.6 · claude-haiku-5.5 — pencere: **20 Ekim 05:38 UTC** (`bench-th-2026-10-17`, `bench-th-1017-2026-10-17`) ↔ **22 Ekim 14:33 UTC** (`bench-dortlu-2026-10-17`) — rota bazlı kayan pencere (T) |
| ❌ 402 bakiye $0 | deepseek-v4.1-flash-1017 · glm-5.3 · qwen3.8-max · deepseek-v4-pro (tokenharbor ücretli id'ler) |
| ❌ 403 NO_ACTIVE_PACKAGE / PAYG_DISABLED | kimi-k3 · codefastk3unlimited · glm-5.3 (codefast-glm) · codefast-os'taki 11 model |
| ❌ 401 `api_key_expired` | opencode provider'ının 13 modeli (step-5-preview-free dahil) — yeni anahtar şart |
| ⚪ ham API ölçülemez (ACP/native) | codex gpt-5.5/5.6/6/6.1 ailesi · qoder · kilo · pi |

Yeniden üretme (tek satır):

```
node scripts/uygunluk.mjs --rapor=raporlar/bench-2026-10-14/bench.json --rapor=raporlar/bench-smoke/bench.json --rapor=raporlar/bench-free-2026-10-15/bench.json --rapor=raporlar/bench-free-2026-10-15-tirmanma/bench.json --rapor=raporlar/bench-codefast-fix-2026-10-15/bench.json --rapor=raporlar/bench-or-2026-10-15/bench.json --rapor=raporlar/bench-th-fixdogrulama-2026-10-15/bench.json --rapor=raporlar/bench-kimi-2026-10-17/bench.json --rapor=raporlar/bench-th-2026-10-17/bench.json --rapor=raporlar/bench-th-1017-2026-10-17/bench.json --rapor=raporlar/bench-groq-2026-10-17/bench.json --rapor=raporlar/bench-dortlu-2026-10-17/bench.json --cikis=raporlar/uygunluk-top30-2026-10-17
```

## 7. Çelişkiler (çözülmeden hüküm verilmedi)

1. **DeepSeek V4 Flash terminal:** 10-14 koşumu **5/5**, 10-15 koşumu **0/5** — aynı model, aynı kapı. Yeniden koşmadan 24. sıradaki yeri sabit değil.
2. **DeepSeek V4 Pro terminal:** vendor **87.9** ↔ bağımsız Vals **54.7**. Saf performansta B güvene indirdim.
3. **Kimi K3 hızı:** yerel ham API 35–71 t/s ↔ ajan hattında 300 t/s (10-14) ↔ AA 41.7 t/s. Üçü farklı düzlem; tablo **46.8 (R)** kullandı.
4. **Kota sıfırlama zamanı:** 20 Ekim ↔ 22 Ekim (iki ayrı bugün koşumu, §6) — panelde teyit gerek.
5. **Qwen3.8-27B IQ 33** (groq, 131k ctx) ↔ lane 61.7 (262k kapısı). Aynı ailenin iki sürümü olabilir, doğrulanmadı.

## 8. Hüküm

1. **Saf performans zirvesi: GLM 5.3 (86) · Kimi K3 (85) · Step 5 Preview (84)** — aradaki 2 puan, pratikte üçlü eşdeğer; ikisi de bugün **koşamıyor**.
2. **Benchmark'la kanıtlanmış zirve: north-mini-code:free (81) · gpt-oss-120b (82) · Kimi K3 (85)** — yerel ölçümlü 3 satır; bunlardan bugün yazabilen ikisi north-mini ve gpt-oss-120b.
3. **Fiyat-dışı listede 18 satır iddiadır** (ölçüm yok, dış kaynak). Top 30'un **12 satırı ölçüm**, 18'i aktarım.
