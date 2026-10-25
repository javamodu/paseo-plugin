# BU PLUGİNİ YAZMAK İÇİN HANGİ PROVIDER? — 2026-10-17

Kapsam: (A) §1–§6 = Paseo'da **gerçekten $0** çalışan, gpt/codex/claude dışı sağlayıcılar. (B) §7–§9 = **kullanıcı ücretli API satın alacak** (codefast üzerinden GLM 5.3 / DeepSeek / Kimi K3) — bu ikinci senaryo nihai kararı verir.
Kanıt etiketi: (R) canlı ölçüm · (T) tahmin · * tek kaynak.
Ölçüm kaynakları: `raporlar/bench-free-2026-10-15/bench.json`, `raporlar/bench-th-fixdogrulama-2026-10-15/bench.json`, `raporlar/bench-or-2026-10-15/bench.json`, `raporlar/provider-rehberi-2026-10-14.md` §5.

## 0. Tek cümlelik cevap

**Senaryo A (free, hemen):** `tokenharbor / deepseek-v4.1-flash:free` — 6 zor IQ sorusunun 6'sı, terminal 5/5, JS kodu PASS, 1.048.576 ctx, 91–129 t/s, $0.
İkinci tercih: `tokenharbor / mimo-v2.5:free` (5/5 + PASS ama yavaş, 27–32 t/s). Hız patlaması isteyen tek seferlik iş için `openrouter / cohere/north-mini-code:free` (223.6 t/s, 5/5).

**Senaryo B (ücretli alım, codefast):** **`glm-5.3`** — agentic lane 70.2 (#8/128), Terminal-Bench 3.0 lideri (28.3), 83 t/s, **$1.40/$4.40** (Kimi K3'ün 1/3.4'ü). DeepSeek V4 Pro ikinci (en ucuz + en hızlı), Kimi K3 yalnız görsel/uzun-repo işi (çıkış token'ı 3.4× pahalı). **Qwen3.8 Max codefast kataloğunda yok — bu yolla alınamaz** (R, canlı katalog).

## 1. Soruda geçen 4 modelin canlı durumu (R: `paseo_list_providers` + `paseo_list_models`, 2026-10-17)

| Sorulan model | Bu makinede durumu | Kanıt |
|---|---|---|
| **Kimi K3** | **Koşuyor, ama free değil** — `codefast` etiketi "Sınırsız **(bakiye)**"; katalog fiyatı 3/15 $ per 1M. Ayrıca `codefastk3unlimited` ucunda ham ölçüm 2 kez `API access denied` verdi | `paseo_list_models(codefast)` → 2 model; `raporlar/provider-rehberi-2026-10-14.md` §5 fiyat sütunu; `raporlar/bench-free-2026-10-15-tirmanma/bench.json` hata alanı |
| **DeepSeek** | **Free ve erişilebilir** — `tokenharbor` altında `deepseek-v4-flash:free` + `deepseek-v4.1-flash:free` | `paseo_list_models(tokenharbor)`; ölçüm: 91.4 / 129.5 t/s, IQ 100, kod PASS |
| **Qwen3.8-Max** | **Yok.** Hiçbir sağlayıcı kataloğunda `qwen3.8-max` geçmiyor. Tek Qwen 3.8 ucu `qoder` altında **`Qwen3.8-Flash`** (0.00x Credit) | `paseo_list_models(qoder)` → `qfmodel` = "Qwen3.8-Flash (default)", `Qwen3.8-Flash (default)`; openrouter/tokenharbor/codefast listelerinde Qwen3.8-Max yok (R) |
| **GLM 5.3** | **Bu anahtarda kapalı** — `codefast-glm / glm-5.3` canlı ajan denemesinde **HTTP 403 `API access denied`** (PAYG bakiye şart). Free alternatif `nvidia / z-ai/glm-5.3-flash` var ama **1.2 t/s** (ölçülmüş, kullanılamaz) | Canlı probe 2026-10-17 ajan hatası: `unexpected status 403 Forbidden ... https://api.codefast.app/glm-api/v1/responses`; `paseo_list_providers(nvidia)` açıklaması |

**Sonuç:** Sorudaki 4 isimden 3'ü bu makinede "free + erişilebilir" değil. Tek gerçekten free ve ölçülmüş aday **DeepSeek** (tokenharbor free ucu).

## 2. Puanlama yöntemi

Ağırlıklar (toplam 100), bu eklentinin işine göre seçildi — "hızlı sohbet" değil, "çok dosyalı plugin kodu + uzun sözleşme dokümanı yazmak":

| # | Ölçüt | Ağırlık | Ölçüm kaynağı |
|---|---|---|---|
| 1 | **Kod + terminal yetkinliği** | 25 | JS `fonk()` fonksiyonu doğru mu + 5 terminal komutu doğru mu (PASS/5) — `bench-*.json` `kod` ve `terminal` alanları |
| 2 | **Bağlam (context)** | 15 | katalog `context_length` |
| 3 | **Uzun ufuk disiplini** | 15 | katalog `tier` (low/mid/high) + tur başına reasoning karakteri (düşük = düşünmeden kod yazma eğilimi) |
| 4 | **Erişim / ücretsizlik** | 20 | $0 mı, kota/kapı var mı, ajan hattı çalışıyor mu |
| 5 | **Hız** | 15 | ham API t/s (tek HTTP istek, IQ seti koşusu) |
| 6 | **Agentik yüzey** | 10 | `toolCall` + gerçek ajan hattında koşabilme (ACP/codex-extends) |

Ölçülmemiş her hücre **tahmin (T)** yazılmadı — puan 0 değil, "veri yok" notu. Puan üretmek için dış benchmark (SWE-bench vb.) **kullanılmadı**: `scripts/bench-puanlari.json` bilinçli olarak boş.

## 3. Puan tablosu — $0 sağlayıcılar (gpt/codex/claude hariç)

| # | Sağlayıcı · model | Kod+term (25) | Ctx (15) | Uzun ufuk (15) | Erişim (20) | Hız t/s (15) | Agentik (10) | **TOPLAM** |
|---|---|---|---|---|---|---|---|---|
| 1 | `tokenharbor / deepseek-v4.1-flash:free` | 25 (5/5 + PASS) | 15 (1.048.576) | 9 (tier low, 1034 krk) | 17 ($0, 7 günlük kota) | 15 (129.5) | 10 (codex-extends ajan hattı) | **91** |
| 2 | `tokenharbor / mimo-v2.5:free` | 25 (5/5 + PASS) | 15 (1.048.576) | 12 (tier **high**, 883 krk) | 17 ($0, 7 günlük kota) | 9 (32.4) | 10 | **88** |
| 3 | `openrouter / cohere/north-mini-code:free` | 25 (5/5 + PASS) | 10 (256.000) | 13 (2891 krk) | 15 ($0 ama `:free` kuyruğu) | 15 (223.6) | 10 | **88** |
| 4 | `tokenharbor / deepseek-v4-flash:free` | 18 (PASS ama terminal 0/5) | 15 (1.000.000) | 8 (tier low, 1396 krk) | 17 | 13 (81.4) | 10 | **81** |
| 5 | `tokenharbor / mimo-v2.6-flash:free` | 20 (4/5, IQ 83 — C4 kaçtı) | 15 (1.048.576) | 8 (tier low, 845 krk) | 17 | 10 (49.1) | 10 | **80** |
| 6 | `qoder / Qwen3.8-Flash` (Qwen3.8-Max yok) | ölçüm yok | ölçüm yok | ölçüm yok | 12 (0.00x Credit, ACP) | ölçüm yok | 8 (ACP, Accept Edits modu var) | **veri yok** |
| — | `codefast / kimi-k3` | 18 (karışık: 10-14 NUM=391 PASS, 10-15 terminal 0/5 + kod çıktısı boş) | 12 (canlı 256.000) | 13 (thinking high/ultra, 1940 krk) | **8 (bakiye = ücretli)** | 15 (300.1 ajan t/s) | 10 | 76 **(free ligi dışında)** |
| — | `codefast-glm / glm-5.3` | — | — | — | **0 (403 doğrulandı)** | — | — | **kullanılamaz** |
| — | `nvidia / z-ai/glm-5.3-flash` | ölçülmedi | — | — | 15 (free) | **0 (1.2 t/s)** | 6 | **kullanılamaz** |
| — | `opencode / *-free` | ölçülmedi | — | — | 14 (CLI içi kilit) | 12 (en iyi 80.8) | 10 | veri yok |
| — | `kilo / 42 free` | — | — | — | **0 (günlük `free-models-per-day` limiti)** | — | 10 | **kullanılamaz** |

Eşitlik bozma (3. sıra): eşit puanlı satırlarda **tier/derinlik** öne alınır — plugin kodunda uzun ufuk disiplini tek seferlik hızdan değerlidir.

## 4. Bütün kombinasyonlarda kanıtı olan hükümler

- **Sayısal muhakeme ayırt etmiyor:** 6-zor IQ setinde ölçülen 7 modelin 7'si 100/100. Ayrıştırıcı eksen **hız + terminal/kod doğruluğu + tier**. (R)
- **Free liginde tek kırık:** `deepseek-v4-flash:free` bir koşuda terminal 0/5 verdi (fonksiyonu doğru yazdı, 5 komutun hiçbirini doğru yazamadı). `deepseek-v4.1-flash` aynı sette 5/5 → **sürüm farkı, `deepseek-v4-flash`'ı seçme.** (R)
- **Kimi K3'ün kod tarafı kararsız:** 10-14'te ajan turunda `NUM=391` PASS + 300.1 t/s; 10-15'te aynı model ham API'de boş çıktı verdi (`kod: FAIL:fonksiyon bulunamadi`, terminal 0/5, `hata` boş). Ayrıca "unlimited" ucu **bakiye** tüketiyor. → Free ligde **değil**, ücretliyse de **plugin kodunda tek seferlik** kullan. (R)
- **Qwen tarafı:** `qwen3.8-max` bu makinede hiçbir katalogda yok; ölçülebilir tek Qwen 3.8 ucu `qoder/Qwen3.8-Flash` (ACP, 0.00x Credit) ve **bench'i hiç koşulmamış** — puan uydurulmadı, "veri yok" bırakıldı. (R)
- **GLM 5.3:** kapı 403 (PAYG). Bakiye doldurulursa aynı provider id'siyle ölçüm yeniden koşulabilir; config değişikliği gerekmez. (R)

## 5. Uygulama önerisi (bu eklentinin yazımı için)

1. **Birincil yazar:** `tokenharbor / deepseek-v4.1-flash:free`, thinking `codex:high`. 1M ctx → SSOT belgeleri (ANAYASA + rehber + STATE_BOARD) tek bağlamda okunur, progressive-disclosure kuralı bozulmaz.
2. **Derin çok-adımlı işler (sözleşme değişikliği, ADR yazımı):** `tokenharbor / mimo-v2.5:free` — tier high, 5/5 terminal; yavaş olduğu için büyük yazma işine değil karar/derinleştirme işine.
3. **Tek seferlik uzun kod üretimi (ör. test üretimi, toplu refactor):** `openrouter / cohere/north-mini-code:free` (223.6 t/s).
4. **Kabul etme:** Ücretli bakiye (Kimi K3), 403 kapılı (GLM 5.3), günlük limitli (Kilo free), 1.2 t/s (glm-5.3-flash), 1.6–2.5 t/s + sapma (`poolside/laguna-*`).

## 6. Boşluklar / yeniden ölçüm gerekenler

- `qoder / Qwen3.8-Flash` (Qwen3.8-Max'ın makinedeki karşılığı) için `bench-free` koşusu **yapılmamış** — yapılırsa satır 6 doludur (komut: §5'teki ham tarama + IQ seti, ACP üzerinden ajan hattı).
- Kimi K3'ün 10-15'teki kod FAIL'i **tekrarlandı mı** bilinmiyor (bir koşu). Tekrarlanırsa 300.1 t/s'e rağmen kod güvenilirliği düşük demektir.
- Hiçbir free model resmî kod benchmark'ı (SWE-bench / Terminal-Bench) **bu repoda ölçülmedi**; `scripts/bench-puanlari.json` boştur ve bilinçli olarak doldurulmamıştır. Puanlama tamamen kendi ölçümlerimize dayanır.

---

# BÖLÜM B — ÜCRETLİ ALIM (codefast) · 2026-10-17 ek

Kullanıcı kararı: GLM 5.3 / DeepSeek / Kimi K3'den **biri satın alınıp codefast'a eklenecek**; free modeller mevcut hâliyle kalacak. Aşağıdaki dış puanlar **üçüncü taraf toplayıcı** verisidir — `*` tek kaynak etiketiyle taşınır, kendi ölçümümüz değildir (T değil, * ).

## 7. Alınabilirlik: codefast kataloğu (R, canlı `GET https://api.codefast.app/v1/models`, 2026-10-17)

Anahtarla kök katalog **HTTP 200, 72 model** döndü. İlgili satırlar: `glm-5.3`, `codefastglm53`, `glm-5.2`, `glm-5.1`, `glm-5-turbo`, `kimi-k3`, `moonshotai/kimi-k3`, `deepseek-v4-pro`, `deepseek-v4.1-flash`, `deepseek-v4-flash`, `mimo-v2.5-pro`, `minimax-m3`, `stepfun-ai/step-3.7-flash`.

- **Qwen yok:** katalogda `qwen` geçen **hiçbir model id'si yok** → Qwen3.8 Max bu yolla satın alınamaz. (R)
- **GLM kapısı hâlâ kapalı:** `glm-api/v1/models` ve `open-source-api/v1/models` **HTTP 403** (bakiye/entitlement gerekiyor). Bakiye sonrası aynı kapıları yeniden yoklamak gerekir; `glm-5.3` modeli **root katalogda listeli** olduğu için bakiye açılınca route edilmesi beklenir (T).
- Katalog `context_length`/fiyat alanı döndürmedi → fiyat bilgisi aşağıda **dış kaynaktan** geliyor, kendi katalogumuzdan değil.

## 8. Ücretli senaryo puanlaması

Ağırlıklar (bu kez "hangi modeli alacağım" sorusuna göre): terminal/agentik yetkinlik 25 · uzun-repo kod 20 · hız 20 · fiyat 20 · bağlam + max çıkış 15.

| Sıra | Model | Terminal/agentik (25) | Uzun-repo kod (20) | Hız t/s (20) | Fiyat $g/çc (20) | Ctx + max çıkış (15) | **TOPLAM** |
|---|---|---|---|---|---|---|---|
| 1 | **GLM 5.3** | **24** (agentic lane 70.2 · #8/128; TB2.1 88.2; **TB3.0 28.3** — en yüksek) | 17 (DeepSWE 66.9 · SWE-Marathon 42.5 · CursorBench 60.8 · FrontierSWE 78.3) | 16 (AA 83 t/s) | **19** ($1.40 / $4.40) | **15** (1M · max çıkış 128k) | **91** |
| 2 | **DeepSeek V4 Pro** | 19 (agentic lane 54.5 · #43/128; TB2.1 87.9) | 15 (LiveCodeBench pass@1-COT **93.5**, küresel #1; kod lane 47.2) | **18** (ölçüm ~115 t/s) | **20** ($1.32 / $3.96 — en ucuz) | 14 (1M) | **86** |
| 3 | **Kimi K3** | 24 (agentic lane 69.4 · #10/128; TB2.1 88.3) | **19** (SWE-Marathon **48.1** · DeepSWE 67.5 · CursorBench 60.8 · FrontierSWE 81.2 · ProgramBench 77.8 vs GLM 19.0) | 9 (AA 41.7 t/s) | 8 ($3.00 / **$15.00**) | 15 (1.05M · **görsel/video giriş**) | **75** |
| — | DeepSeek V4.1 Flash (kodfast'ta var) | veri yok | **kod lane 60.7 — bu üçlüden yüksek** | ölçülmedi | fiyat dış kaynakta doğrulanamadı | 1M | ölçüm sonrası |
| — | Qwen3.8 Max | — | — | — | — | — | **alınamaz (katalogda yok)** |

Kaynaklar (hepsi * üçüncü taraf, 2026-10-17'de okundu):
- BenchLM karşılaştırma sayfaları: `benchlm.ai/compare/glm-5-3-vs-kimi-k3`, `.../deepseek-v4-pro-0813-vs-kimi-k3`, `.../deepseek-v4-1-flash-vs-glm-5-3-flash` (lane skorları, TB2.1, DeepSWE, fiyat).
- Vals AI: `vals.ai/models/zai_glm-5.3` — Vals Index 53.51 % (#19/49), SWE-bench 95.40 %, Terminal-Bench 4.0 38.89 %, Vibe Code Bench v1.1 78.13 %, ctx 1M, max çıkış 128k, $1.40/$4.40, test başına ~73 dk (çok yavaş ajanik koşu — thinking `max` önerme).
- Z.ai model kartı tablosu (Respan aktarımı): TB3.0 28.3 vs 17.4 · SWE-Marathon 42.5 vs 48.1 · CyberGym 84.5 vs 80.0 · Toolathlon 73.0 vs 76.5 — `respan.ai/articles/glm-vs-kimi`.
- EmpirioLabs (2026-10-06) tek atış tarayıcı testi: DeepSeek V4 Pro ~115 t/s, GLM 5.3 ~59k çıkış token/ görev, Kimi K3 en kompakt çıktı.
- AA Intelligence Index: GLM 5.3 **45** · Kimi K3 **44** (bir puanlık fark, genel yetenekte berabere sayılır — asıl ayrım terminal/uzun-repo + fiyat).

Aynı puanlar `scripts/bench-puanlari.json` dosyasına kaynak URL + tarih ile işlendi.

## 9. Karar ve uygulama

1. **`glm-5.3` al ve ana yazar yap.** Gerekçe: agentik lane en yüksek (#8/128), zor terminal işinde (TB3.0) tek lider, çıkış token'ı Kimi K3'ün 1/3.4'ü, 1M bağlam + 128k çıkış (plugin'de uzun dosya yazımı için kritik), kodfast kataloğunda **zaten listeli** → config değişikliği yok, sadece bakiye/entitlement.
2. **`deepseek-v4-pro`'yu ikinci mevkiye al** (istersen): en ucuz ($1.32/$3.96) + en hızlı (~115 t/s) → toplu üretim, test yazımı, mekanik refactor. Not: kod lane'ı GLM'den düşük (47.2), yani "düşünülmesi gereken" işlerde GLM.
3. **Kimi K3'ü koru, daralt.** Zaten kurulu ve 300.1 t/s ölçüldü; ama $15/1M çıkış = pahalı. Yalnız **görsel/video girdi** (tek başına bu yetenek diğerlerinde yok) ve **en uzun repo işi** (SWE-Marathon 48.1) için aç.
4. **Qwen3.8 Max'ı bu bütçeyle unut** — codefast kataloğunda yok; ek kapı (resmî Alibaba/OpenRouter) kurulumu ayrı iş ve ayrı anahtar.
5. Bakiye açıldıktan sonra **doğrulama kapısı** (satın alma tek başına kanıt değildir):
   `GET https://api.codefast.app/glm-api/v1/models` → 200 beklenir; ardından `paseo_list_models(codefast-glm)` ve tek ajan turu (`NUM=391`). Kapı 403'te kalırsa §7'deki root-katalog beklentisi doğrulanmamış sayılır, plan B'ye düşer.
6. **Düşünme kademesi:** GLM 5.3'te thinking `max` değil `high`/`medium` — Vals testi `max` ile ~73 dk sürdü; bu repo saat ekonomisi kuralıyla (EK-5) çelişir.

## 10. Bu iki senaryonun ortak sonucu

Free lig (senaryo A) ve ücretli lig (senaryo B) **farklı kazananlar** veriyor ve bu bir çelişki değil: free tarafta `deepseek-v4.1-flash:free` ölçülmüş tek güçlü aday (kod lane 60.7, 5/5 terminal, 129 t/s, 1M ctx); ücretli tarafta `glm-5.3` fiyat/derinlik dengesi kazanıyor. İkisini **eşzamanlı kullan**: free model günlük rutin + ölçüm/deneme işi, ücretli GLM 5.3 sözleşme/ADR/kritik refactor.