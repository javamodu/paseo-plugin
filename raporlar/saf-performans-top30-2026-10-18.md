# SAF PERFORMANS SIRALAMASI — top 30 · 2026-10-18

Kapsam: **fiyat ve erişim puanlamada YOK** — yalnız yetenek (agentik/kod/hız/ufuk/bağlam). "Bu plugini yazmak için modele göre karar" sorusunun performans ekseni; erişim durumu §6'da ayrı tutuldu.
Kanıt etiketi (ANAYASA A2): **(R)** bu repoda canlı ölçüm · **(R-cat)** sağlayıcının canlı `/models` kataloğundan okundu · **(B)** bağımsız üçüncü taraf ölçüm (Vals/AA/BenchLM) · **(T)** tahmin · **\*** tek kaynak.
Yeniden üretme: `node scripts/model-katalog.mjs` + `node scripts/uygunluk.mjs` (§6 komutu). Önceki sürüm: `saf-performans-top30-2026-10-17.md`.

## 0. 10-17 → 10-18 değişiklikleri (bu tazeleme)

Bu tazeleme günde 3 kez koşuldu (17:24 katalog+motor · 18:59+ motor tazelemeleri · **20:41 tam yeniden kurulum**); gün içinde **2 gerçek koşum seti eklendi** (D9 GLM PAYG + D11 ücretsiz 24 hedef/11 ölçülen) → toplam **14 `bench.json`**. Değişen kalan eksen **erişim/katalog** (canlı `/models` taraması, token maliyeti 0):

| # | Değişiklik | Kanıt |
|---|---|---|
| D1 | **codefast-glm `/models` = 200, 6 model** — 10-17'de 403'tü; katalog kapısı AÇILDI. ANCAK provider config'te `enabled=false` ve sohbet çağrısı (PAYG) doğrulanmadı — harcama kararı insanın (PLAN §9.2) | (R-cat) `raporlar/model-katalog-2026-10-18/` |
| D2 | **openrouter kataloğunda `stepfun/step-5-preview` belirdi** (ctx 1.048.576) — saf performans #3'e ücretli rota açıldı (`:free` değil) | (R-cat) |
| D3 | **kilo Gateway'a `glmcodefast/glm-5.3` rotası eklendi** — zirvedeki GLM 5.3'e üçüncü rota; ACP/native olduğu için ham ölçülemez | (R-cat) |
| D4 | **yeni `deepseek` provider** (`https://api.deepseek.com`, modeller `deepseek-flash` + `deepseek-v4-pro`) — anahtar YOK, canlı tarama yapılamadı | (R-cat, config) |
| D5 | `codefast` ve `codefast-os` `/models` hâlâ **403** — kapalı kaldı | (R-cat) |
| D6 | tokenharbor `/models` = 200 (70 model listeliyor) — katalog açık; **üretim kotası (429 penceresi) ayrı konu**, ölçülmedi | (R-cat) |
| D7 | **`deepseek-v4.1-flash-1017` listeye eklendi** (kullanıcı talimatı) — TH ücretli rota $0.14/$0.42 (tablonun en ucuz ücretli rotası), ctx 1M, 402 $0 bakiye; profilde `yedek` olarak izleniyor | (R) `bench-th-1017-2026-10-17/bench.json` |
| D8 | **Non-1017 satırı listeden çıkarıldı** (kullanıcı talimatı — görsel tekrar) — sıralamada yalnız `Flash-1017` kaldı (#11); kardeş `:free` rotası motor profiline `anaYazar` olarak DOKUNULMADAN kaldı, erişim durumu §6'da | (R) |
| D9 | **GLM 5.3 GERÇEK ÖLÇÜM** (kullanıcı onayı, PAYG) — kapı AÇIK: **79.5 t/s · terminal 5/5 · kod PASS · uyum PASS**; IQ probu **0/6** (C1-C6 tamamen kaçtı — format/parse şüphesi, §7/7). Provider ölçüm için geçici açıldı, sonrasında orijinal durumuna (`enabled=false`) kapatıldı | (R) `bench-glm-2026-10-18/bench.json` |
| D10 | **GLM 5.3 günlük seviyeye atandı** (kullanıcı talimatı: "claudecode altında günlük model") — seviye `yedek`→`gunluk` (IQ kapısı kırık olduğu için gate izleme listesinde). **Claude Code (Anthropic /v1/messages) kapısı DENEendi: hata döndü** → claudecode yolu bugün kapalı; çalışan kapı OpenAI-uyumlu codefast-glm (D9 ölçümü) | (R) probe 17:52 · uygunluk-hedefi.json |
| D11 | **GERÇEK t/s KOŞUMLARI** (kullanıcı onayı, ücretsiz kapılar; 24 hedef / 11 ölçüldü) — groq: gpt-oss-20b **583.8** · gpt-oss-120b 261.4 · qwen3.8-27b 348.9 (**IQ 33 iki koşumda teyit**) · allam 1204.8 (kod FAIL, elenmiş) · OR: **nemotron-3-ultra 129.9 t/s + 5/5 + PASS + IQ 100 → motor KABUL 83.2, setin en yüksek ölçülmüş uygunluk puanı** · **dots-3-note-preview 98.6 t/s + 5/5 + PASS → KABUL 76.6 (yeni keşif, 512k ctx)** · north-mini 47.8 (223.6'dan düşüş, §7/8) · nemotron-nano 42.5 (uyum FAIL) · nemotron-super 60.8 (terminal 0/5) · TH free 5/5 = 429 — **pencere 20 Ekim 05:38 UTC kesinleşti** · OR free-models-per-day doldu (lightning + poolside koşamadı) · gemma-4 kapı hatası · inkling agentic-only · 1017'nin OR rotası kredisiz | (R) `bench-serbest-2026-10-18/bench.json` |
| D12 | **codefast-glm GÜNLÜK KULLANIMA AÇILDI** (kullanıcı kararı 18:52) — config `enabled=true` (diskten doğrulandı); GLM 5.3 günlük seviyede aktif kapı: bugünkü ölçüm 79.5 t/s + 5/5 + PASS (D9). IQ 0/6 şüphesi izlemede (§7/7) | (R) `~/.paseo/config.json` |
| D13 | **D12'nin üstüne — Claude Code yolu AÇILDI, günlük kart `claude-glm`'e taşındı** — (1) glm-api `/v1/messages` 18:59'da 200 döndü (x-api-key + bearer; 17:52 hatası giderilmiş) · (2) paralel oturum `claude-glm` kartını kurdu ve E2E kanıtladı: `claude -p` exit 0 → GUNLUK-VAR/TEMIZLIK-DOGRULANDI · (3) kullanıcı talebiyle karta modeller eklendi: **glm-5.3 (gunluk, varsayılan) + glm-5.2 (yedek)** — daemon reload sonrası MCP `list_models` doğruladı · (4) `codefast-glm` kartı bilinçli KAPALI: codex motoru `/responses` 404 (kart seçilirse ajan kırılır) · (5) aynı kapının yinelenen `claudecode-glm` kartı silindi (tek kanonik kart) | (R) MCP list_providers/list_models · config · prob 18:59 |
| D14 | **LİSTE YENİDEN KURULDU** (kullanıcı talebi 20:40) — canlı katalog yeniden tarandı (20:41, token 0) + motor 14 bench'le yeniden koşuldu + rapor gövdesi tazelendi (§0/§2/§3/§6: 12→14 koşum komutu, delta −16, D13 erişim durumu). Sıralama değişmedi (yeni bench koşumu yok); motor zirvesi nemotron-3-ultra 83.2 | (R) `model-katalog-2026-10-18/` · `uygunluk-top30-2026-10-18/` |
| D15 | **İKİ HAT KARŞILAŞTIRMASI + IQ KAPISI AÇILDI** (kullanıcı talebi, PAYG onaylı) — aynı batarya `claude -p` hattından koşuldu (`bench-claude.mjs`): **IQ 6/6 (100) · terminal 5/5 · kod PASS · uyum PASS · 22.6 t/s (motor-dahil)**; chat hattında yeniden IQ probu da **6/6** (C1=977…C6=289) → D9'daki 0/6 geçiciydi, §7/7 çözüldü, GLM 5.3 anaYazar adaylığı engeli kalktı. Kritik ortak bulgu: **her iki hattın tel yanıtı da `model: glm-5.2` bildiriyor** (sürüm sadakati sağlayıcıdan doğrulanmalı). `unrecognized_model` uyarısı kosmetik (5/5 success). Kıyas: `bench-glm-claude-2026-10-18/karsilama.md` | (R) `bench-glm-claude-2026-10-18/` · 20:52 chat probu |
| D16 | **TEL-DÜZEY SAĞLIKLI HIZ (3+3 tekrar, aynı prompt/parametre)** — chat/completions: 86.3·50.9·82.1 (medyan **82.1**) ↔ `/v1/messages`: 101.1·95.8·117.9 (medyan **101.1**) → **Anthropic kapısı tel'de daha hızlı ve tutarlı** (+%23 medyan); 22.6 t/s motor yüküydü, kapıdan değil. 6/6 koşumda tel `model: glm-5.2` teyidi (sürüm sadakati şüphesi güçlendi) | (R) `bench-glm-claude-2026-10-18/karsilama.md` tel-düzey bölümü |

Uygunluk puan deltaları (10-17'ye göre): 7 model +0, **north-mini 82.1→66.1 (−16)** (D11'deki 47.8 t/s koşumu) — `uygunluk-top30-2026-10-18/uygunluk.json` `deltalar` bloğu. Motor KABUL zirvesi: **nemotron-3-ultra 83.2** · deepseek-v4.1-flash:free 77.2 · dots-3-note 76.6.

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
2. **Lineer hız bandı kullanılmaz** — 5–250 t/s kalibrasyonu ücretli modelleri yapay olarak çökertiyordu.
3. **Vendor rakamı bağımsız rakamla aynı satıra konmaz**; çelişki §7'de listelenir.

## 2. Sıralama (top 30)

> Puanlar 10-17 tabanlı; gün içi gerçek koşumlar (D9/D11) hız/kanıt sütunlarını ve motor uygunluk puanlarını tazeledi (delta: north-mini −16). Değişen ayrıca **erişim notları** (D1-D14).

| # | Model | Puan | G | Hız | Kod kanıtı | Agentik kanıtı | Ctx | 10-18 erişim notu |
|---|---|---|---|---|---|---|---|---|
| 1 | GLM 5.3 | **86** | **A** | **medyan 82.1 t/s** (chat, 3 koşum) · `/v1/messages` medyan **101.1** (R, 3+3, D16) | SWE-bench **95.4** (B) · yerel kod PASS (R, D9) | lane 70.2 **#8/128** (B) · TB3.0 28.3 lider · yerel terminal **5/5** (R, D9) | 1M/128k (R-cat) | ✅ kapı açık + ölçüldü (D9) · **günlük seviye (D10, kullanıcı)** · IQ **6/6 iki hattan** (D15) · claudecode yolu **açık: claude-glm kartı E2E** (D13) · kilo rotası (D3) |
| 2 | Kimi K3 | **85** | **A** | 46.8 t/s (R) · 41.7* | SWE 93.4 (B) · yerel 5/5+PASS+IQ100 (R) | TB2.1 Vals **80.9** (B) · Marathon 48.1 | 1.05M (R-cat) | ❌ codefast 403 sürüyor (D5) |
| 3 | Step 5 Preview | **84** | A/B | 45 t/s (R, nvidia) | DeepSWE 67.7 · ProgramBench 80.5 (B) | TB2.1 85.0 · ALE 29.5 (B) | 1M | 🔶 openrouter'a ücretli rota girdi (D2, `:free` değil) |
| 4 | GPT-6.1 Sol | 83 | C | ölçülmedi→10 | DeepSWE ≈ Astra (B) | AutomationBench **+4.8** · TB-Science 2× (B) | 1.05M | ⚪ ACP |
| 5= | GPT-6 Sol | 82 | C | ölçülmedi→10 | **DeepSWE 68.8** (setin en yüksek, B) | AutomationBench **33.2** en iyi (B) | 1.05M | ⚪ ACP |
| 5= | gpt-oss-120b (groq) | **82** | **A** | **261.4 t/s** (R, D11) | PASS · IQ 100 (R, D11) | terminal **5/5** (R, D11) | 131k (R) | ✅ groq `/models` 200 (11 model) |
| 7= | GPT-5.6 Luna | 81 | B | ölçülmedi→10 | SWE 93.0 · lane 61.6 (B) | TB2.1 Vals 79.0 (B) | 1.05M | ⚪ ACP |
| 7= | north-mini-code:free | **77** *(10-18)* | **A** | **47.8 t/s** (R, D11; 223.6 ↔ 47.8 varyans §7/8) | PASS · IQ 100 (R) | terminal 4/5 (R, D11) | 256k (R) | ✅ açık; bugünkü koşum zayıf — motor puanı 82.1→66.1 (D11) |
| 9 | Claude Haiku 5.5 | **79** | **A** | **135.6 t/s** (R) | PASS · IQ 100 (R) | terminal 5/5 (R) | 1M/128k | ❌ TH free 429 penceresi (ölçülmedi, T) |
| 10 | gpt-oss-20b (groq) | **79** | **A** | **583.8 t/s** (R, D11) | PASS · IQ 100 (R, D11) | terminal **5/5** (R, D11) | 131k (R) | ✅ groq açık |
| 11 | DeepSeek V4.1 Flash-1017 (TH ücretli) | **78** *(T)* | C | 133.4 t/s (R, aile) | lane **60.7** (B) · PASS (R, aile) | terminal 5/5 (R, aile) | 1.05M (R-cat, kendi) | ❌ TH ücretli **402 $0 bakiye** · $0.14/$0.42 (tablonun en ucuz ücretli rotası) · kanıt kardeş id `:free`'den aktarım (D7) · kardeş rotanın erişimi §6'da |
| 11= | nemotron-3-ultra-550b (OR free) | **77** | **A** | **129.9 t/s** (R, D11) | PASS · IQ 100 (R, D11) | terminal **5/5** (R, D11) | 1M (R) | ✅ **bugün KABUL 83.2 — setin en yüksek ölçülmüş uygunluk puanı** (D11); nvidia rotası 8.3 t/s idi (§7/9) |
| 12= | GLM 5.2 | 75 | B | ~168 t/s* | SWE-Pro 62.1 (B) | TB2.1 81.0 · lane 57.4 (B) | 1M | ❌ codefast-os 403 (D5) |
| 12= | GLM 5.3 Flash | 75 | B | ölçülmedi→10 | SWE **92.0** (B) | TB2.1 Vals 62.9 (B) | 1M | nvidia `/models` 200 (81 model), üretim ayrı |
| 14 | Qwen3.8-27B (groq) | 70 | **A** | **348.9 t/s** (R, D11) | PASS · **IQ 33** (R — iki koşumda teyit, §7/5 çözüldü) | terminal 5/5 (R, D11) | 131k (R) | ✅ groq açık |
| 15 | MiMo v2.5 | 71 | **A** | 32.4 t/s (R) | PASS · IQ 100 (R) | terminal 5/5 (R) | 1.05M (R-cat) | ❌ TH free 429 penceresi (T) |
| 15= | dots-3-note-preview (OR free) | **73** | **A** | 98.6 t/s (R, D11) | PASS · IQ 100 (R, D11) | terminal 5/5 (R, D11) | 512k (R) | ✅ **KABUL 76.6 — yeni keşif** (D11) |
| 16= | DeepSeek V4 Pro | 70 | B | ~115 t/s* | LiveCodeBench **#1** 93.5 (B) | Vals TB **54.7** ⚠ vendor 87.9 (§7) | 1M | 🔶 `deepseek` provider'a girdi ama anahtar YOK (D4) |
| 16= | Qwen3.8 Flash-Next | 70 | B | ölçülmedi→10 | SWE-Pro 62.5 · LCB v6 91.9 (B) | lane **65.6 #17/128** (B) | 262k | ⚪ |
| 18= | GPT-6 Luna | 69 | C | ölçülmedi→10 | DeepSWE 66.6 (B) | lane 56.4 · ARC-AGI 86.7 (B) | 1.05M | ⚪ ACP |
| 18= | Qwen3.8 Max | 69 | B | ölçülmedi→10 | SWE 85.6 · multimodal **#4/54** (B) | TB2.1 Vals 67.4 (B) | 1M/131k | ⚪ |
| 20 | mimo-v2.6-flash:free | 63 | **A** | 49.1 t/s (R) | PASS · IQ 100 (R) | terminal 5/5 (R) | 1.05M (R-cat) | ❌ TH free 429 penceresi (T) |
| 21 | MiniMax M2.5 | 59 | C | ölçülmedi→10 | SWE 80.2 (B) | veri yok | 1M | ❌ codefast-os 403 |
| 22 | Qwen3.7-Plus | 58 | C | ölçülmedi→10 | SWE-Verified 77.7 (B) | veri yok | 1M | ⚪ |
| 23 | Kimi K2.6 | 57 | C | ölçülmedi→10 | SWE-Verified 80.2 (B) | veri yok | 262k | ⚪ |
| 24 | DeepSeek V4 Flash | 56 | **A** | 81.6 t/s (R) | PASS · IQ 100 (R) | **5/5 (10-14) ↔ 0/5 (10-15)** (§7) | 1M (R-cat) | 🔶 `deepseek` provider'da `deepseek-flash` adıyla (D4, anahtar YOK); §7/1 koşum çelişkisi yeni id'de geçersiz olabilir |
| 25 | Qwen3.8-Flash (qoder) | 55 | C | ölçülmedi→10 | 1 probe geçti (R) | ölçülmedi | yayımlanmadı | ⚪ ACP |
| 26 | space-bunny-free | 52 | C | 13.3 t/s (R) | NUM 391 PASS (R) | terminal ölçülmedi | 1M | ⚪ opencode 401 (10-17) |
| 27 | nemotron-3-super-120b | 51 | C | 45 t/s (R) | ölçülmedi | ölçülmedi | 1M | nvidia katalog 200 |
| 30 | nemotron-3.5-lightning | 50→**koşamadı** (D11: OR free limiti doldu) | C | ölçülmedi→10 | SWE-Verified 74.4 (B) | veri yok | 66k→1M | ⚪ |
| ⚠ | allam-2-7b (groq) | **elenmiş** | **A** | **1242.2 t/s** (R) | kod **FAIL** · IQ **0** (R) | terminal 0/5 (R) | **4096** (R) | |

## 3. Benchmark'la ölçülebilen tek alt küme (12 model)

Gün içinde genişledi: D9 (GLM 5.3 gerçek ölçüm) + D11 (ücretsiz kapılarda 24 hedef/11 ölçülen) → makine-okur kopya: `uygunluk-top30-2026-10-18/uygunluk.json` (delta: north-mini −16, diğerleri +0).

## 4. Ölçüm tarihi

| Koşum | Tarih | Ne ölçtü |
|---|---|---|
| `bench-2026-10-14` … `bench-codefast-fix-2026-10-15` | 2026-10-14/15 | 117 satır birikmiş |
| `bench-kimi-2026-10-17` … `bench-dortlu-2026-10-17` (5 koşum) | 2026-10-17 | 20 satır |
| `bench-glm-2026-10-18` | 2026-10-18 | GLM 5.3 gerçek ölçüm (D9, kullanıcı onaylı PAYG) |
| **`bench-serbest-2026-10-18`** | **2026-10-18** | **24 hedef / 11 ölçüldü — groq 4 + OR 7 gerçek t/s (D11, ücretsiz)** |
| **`bench-glm-claude-2026-10-18`** | **2026-10-18** | **Claude Code hattı aynı batarya: IQ 6/6 · 5/5 · PASS · PASS · 22.6 t/s motor-dahil (D15)** |

## 5. Bilinen kusurlar — K1-K4 hâlâ açık, +K5

| # | Kusur | Durum |
|---|---|---|
| K1 | Aynı tarihli raporlarda kanıtı zayıf koşum seçiliyor | açık (kod değişmedi) |
| K2 | Profilinde seviye olmayan modellerde puan boş | açık |
| K3 | Erişim-engelli yeni koşum eski başarılı ölçümün üstüne yazıyor | açık |
| K4 | `model-katalog.mjs` provider önekini temizlemiyor | açık — bugün de üretti: `glm-5.3` ailesi 2 gruba bölündü (`glm-5.3` [codefast-os] ↔ `glmcodefast/glm-5.3` [kilo]) |
| **K5 (yeni)** | `codefast-glm` `enabled=false` ama canlı tarama disabled provider'ı da tarıyor → katalog "açık" görünürken ajan hattı kapalı | bu turda D1 bulgusunun kaynağı |

## 6. Erişim durumu (puanlamaya GİRMEDİ) — 2026-10-18 canlı tarama

| Durum | Modeller/sağlayıcı |
|---|---|
| ✅ katalog 200 + bugün ölçülmüş | groq (4 model) · openrouter (471 katalog girdisi; north-mini:free) · nvidia (81) · tokenharbor (70) |
| ✅ sohbet çağrısı DOĞRULANDI (D9+D16) | **codefast-glm / GLM 5.3** — medyan 82.1 t/s (chat) · 101.1 (`/v1/messages`) · 5/5 · PASS · uyum PASS (R); IQ 6/6 iki hattan (D15, çözüldü); kart bilinçli KAPALI (codex `/responses` 404, D13) — günlük kapı `claude-glm` (alttaki satır) |
| ✅ Anthropic-format kapı (claudecode) | **glm-api `/v1/messages` 200 (R, 18:59)** — Claude Code kartı `claude-glm` kurulu + E2E kanıtlı (`claude -p` exit 0); altında `glm-5.3 (gunluk, varsayılan)` + `glm-5.2 (yedek)`. Dikkat: yanıt `model` alanı glm-5.2 bildirebilir (sunucu takma adı, DERSLER 135) |
| ❌ 403 | codefast (kimi-k3) · codefast-os (11 model) |
| ❌ 429 kota penceresi — **20 Ekim 05:38 UTC kesinleşti (R, D11)** | tokenharbor free üretimi: deepseek-v4.1-flash · deepseek-v4-flash · mimo-v2.5/v2.6 (5/5 model aynı mesajı döndürdü; claude-haiku koşum dışı) |
| ❌ 402 bakiye $0 | **deepseek-v4.1-flash-1017** (listede 11=, D7) · glm-5.3 · qwen3.8-max · deepseek-v4-pro (tokenharbor ücretli id'ler) |
| ❌ anahtar yok | deepseek provider (D4) · opencode 401 (10-17) |
| ⚪ ham API ölçülemez (ACP/native) | codex gpt-5.5/5.6/6/6.1 · qoder · kilo (glmcodefast dahil) · pi |

Yeniden üretme (tek satır):

```
node scripts/model-katalog.mjs
node scripts/uygunluk.mjs --rapor=raporlar/bench-2026-10-14/bench.json --rapor=raporlar/bench-smoke/bench.json --rapor=raporlar/bench-free-2026-10-15/bench.json --rapor=raporlar/bench-free-2026-10-15-tirmanma/bench.json --rapor=raporlar/bench-codefast-fix-2026-10-15/bench.json --rapor=raporlar/bench-or-2026-10-15/bench.json --rapor=raporlar/bench-th-fixdogrulama-2026-10-15/bench.json --rapor=raporlar/bench-kimi-2026-10-17/bench.json --rapor=raporlar/bench-th-2026-10-17/bench.json --rapor=raporlar/bench-th-1017-2026-10-17/bench.json --rapor=raporlar/bench-groq-2026-10-17/bench.json --rapor=raporlar/bench-dortlu-2026-10-17/bench.json --rapor=raporlar/bench-glm-2026-10-18/bench.json --rapor=raporlar/bench-serbest-2026-10-18/bench.json --kiyasla=raporlar/uygunluk-top30-2026-10-17/uygunluk.json --cikis=raporlar/uygunluk-top30-2026-10-18
```

## 7. Çelişkiler (çözülmeden hüküm verilmedi)

1. **DeepSeek V4 Flash terminal:** 10-14 koşumu 5/5 ↔ 10-15 koşumu 0/5 — yeni `deepseek-flash` id'si (D4) farklı bir sürüm olabilir; anahtar gelince yeniden koşulmalı.
2. **DeepSeek V4 Pro terminal:** vendor 87.9 ↔ bağımsız Vals 54.7 (B güvende).
3. **Kimi K3 hızı:** yerel 35–71 t/s ↔ ajan hattı 300 t/s ↔ AA 41.7 t/s — tablo 46.8 (R) kullanıyor.
4. **(çözüldü) Kota sıfırlama:** **20 Ekim 05:38 UTC kesinleşti** (R, D11 — TH free 5 model aynı mesajı döndürdü).
5. **(çözüldü) Qwen3.8-27B IQ 33:** 10-17 ve 10-18 koşumlarında aynı sonuç — sürüm karışması değil, groq sürümünün ölçülmüş gerçeği.
6. **(çözüldü → kanıta bağlandı) GLM 5.3 kapısı:** katalog 200 + **sohbet çağrısı OK** (D9) — kapı gerçekten açık; kalan şüphe IQ'ya taşındı (madde 7).
7. **(çözüldü → kanıta bağlandı, D15) GLM 5.3 IQ probu:** ilk koşum **0/6** idi (R/D9; ham metin saklanmadığı için kökü belgelenemedi); aynı gün **chat hattı yeniden prob 6/6 + claude-code hattı 6/6** — kalıcı yeteneksizlik değil. Yeni izleme maddesi: **tel `model` alanı her iki kapıda glm-5.2 bildiriyor** — glm-5.3 isteği sunucuda glm-5.2'ye mi çözülüyor, sağlayıcıdan doğrulanmalı.
8. **(yeni) north-mini hızı:** 223.6 t/s (10-15/17) ↔ **47.8 t/s** (10-18, D11) — aynı rota, 4.7× sapma; free kuyruk yoğunluğu şüphesi, üçüncü koşum kararır.
9. **(yeni) nemotron-3-ultra hızı:** 8.3 t/s (nvidia rotası, 10-17) ↔ **129.9 t/s** (OR free, 10-18) — 15.7× fark rota bazlı; iki kapı ayrı satır olarak izlenmeli.

## 8. Hüküm

1. **Saf performans zirvesi değişmedi: GLM 5.3 (86) · Kimi K3 (85) · Step 5 Preview (84)** — GLM 5.3 artık **gerçekten koşabiliyor**: kapı açık, tel medyan 82.1–101.1 t/s (D16, 3+3) + 5/5 + PASS ölçüldü ve kullanıcı talimatıyla **günlük seviyede** (D10; IQ 6/6 iki hattan — kapı açık, D15). Claude Code yolu AÇIK: `claude-glm` kartı E2E kanıtlı, günlük kullanım bu karttan (D13; codefast-glm kartı codex `/responses` 404 nedeniyle kapalı tutuluyor).
2. **Bugün yazdırabilecek kanıtlanmış modeller (hepsi bugünkü gerçek koşumla):** **nemotron-3-ultra (KABUL 83.2, 1M ctx)** · gpt-oss-120b/20b (82/79) · **dots-3-note-preview (KABUL 76.6, yeni)** · GLM 5.3 (kapı açık, IQ 6/6 — D15) · north-mini (66.1, bugünkü koşum yavaş) + 20 Ekim 05:38 UTC sonrası TH free ailesi.
3. **Liste 30 satırın 18'i hâlâ aktarım/iddia**; ölçüm ekseni ancak insan onaylı bench koşumuyla tazelenir — bu tazeleme katalog/erişim ekseniydi (token maliyeti 0) + 1 modelde gerçek ölçüm (D9, kullanıcı onaylı).

---
*Damga (R): 2026-10-18 · tazeleme = canlı `/models` taraması + uygunluk yeniden hesabı + rapor; gün içi gerçek koşumlar: D9 (GLM, kullanıcı onaylı PAYG) + D11 (ücretsiz, 11 model); 20:41 yeniden kurulum; üretilen dosyalar: `model-katalog-2026-10-18/`, `uygunluk-top30-2026-10-18/`, bu rapor.*
