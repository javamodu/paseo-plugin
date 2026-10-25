# GLM 5.3 — iki hat kıyaslaması · 2026-10-18

Aynı uç (`api.codefast.app/glm-api`), aynı anahtar, aynı gün; iki farklı hat, aynı bench bataryası (hız/IQ/terminal/kod/uyum — skorlayıcılar birebir aynı, `scripts/bench.mjs` ↔ `scripts/bench-claude.mjs`).

| Ölçüm | Hat A: ham tel (chat/completions) | Hat B: Claude Code motoru (`claude -p`, /v1/messages) |
|---|---|---|
| Kaynak koşum | `bench-glm-2026-10-18` (17:42) + yeniden IQ probu (20:52) | `bench-glm-claude-2026-10-18` (20:50) |
| Hız | **79.5 t/s** (yalnız tel, motor yok) | 22.6 t/s (duvar saati, **motor dahil** — claude engine açılış/sistem-prompt/telemetri yükü içerir; ham telle birebir kıyaslanamaz) |
| IQ (6 soru) | ilk koşum **0/6** → yeniden prob **6/6** (C1=977 · C2=72 · C3=4.5 · C4=195.5 · C5=7006652 · C6=289) | **6/6 (100)** — aynı değerler |
| Terminal | **5/5** | **5/5** |
| Kod (vm sandbox) | **PASS** | **PASS** |
| JSON uyum | **PASS** | **PASS** |
| Tel `model` alanı | **glm-5.2** (glm-5.3 istendi) | glm-5.2 bildiriyor (probe 18:59; DERSLER 135) |
| Motor uyarısı | — | `unrecognized_model` (kosmetik — 5/5 çağrı `success`) |

## Hükümler

1. **IQ kapısı AÇILDI (§7/7 çözüldü):** İlk koşumdaki 0/6 kalıcı yeteneksizlik değil — aynı gün iki hattan da 6/6. GLM 5.3 anaYazar adaylığı engeli kalktı.
2. **Kalite farkı YOK:** terminal/kod/uyum iki hatta da full. Davranışsal fark ölçülemedi.
3. **Hız kıyası adil değil:** 79.5 tel-düzey, 22.6 motor-dahildir → aşağıdaki 3+3 tel-düzey ölçümüyle giderildi (Anthropic kapısı tel'de daha hızlı).
4. **Sürüm sadakati şüphesi ORTAK:** her iki kapının tel yanıtı da `model: glm-5.2` bildiriyor — glm-5.3 isteği sunucuda glm-5.2'ye çözülüyor (veya alan kozmetik). Sağlayıcıdan doğrulanmalı.
5. **0/6'nın kökü belgelenemedi:** ilk koşumun ham IQ metni bench şemasında saklanmıyor (kusur — DERSLER'e işlendi); yeniden koşumda tekrarlanmadı.

Damga (R): 2026-10-18 · koşumlar: `bench-glm-claude-2026-10-18/bench.json` (5 görev success) + 20:52 chat probu · kullanıcı onaylı PAYG.

## Tel-düzey sağlıklı hız ölçümü (20:59, 3+3 tekrar, aynı prompt/parametre)

| Kapı | t/s (3 koşum) | Medyan | Ortalama | model alanı |
|---|---|---|---|---|
| chat/completions | 86.3 · 50.9 · 82.1 | **82.1** | 73.1 | glm-5.2 (3/3) |
| /v1/messages (Anthropic) | 101.1 · 95.8 · 117.9 | **101.1** | 104.9 | glm-5.2 (3/3) |

Hüküm: **Anthropic kapısı tel-düzeyde daha hızlı ve daha tutarlı** (medyan +23%; chat tarafında 50.9–86.3 sapması var). D9'daki 79.5 t/s tek-koşum değerdi — medyan bantla uyumlu. 22.6 t/s (motor-dahil) kapıdan değil Claude Code motor yükünden geliyor. 6/6 koşumda tel `model: glm-5.2` teyit edildi.

## Tool çağırma / ajan döngüsü (21:05, 3 prob)

| Test | Sonuç |
|---|---|
| Chat kapısı native `tools` (OpenAI formatı) | ✅ **EVET** — `tool_calls`: `hava_durumu({"sehir":"Ankara"})`, doğru tek-argüman çağrı |
| Anthropic kapısı native `tool_use` (input_schema) | ✅ **EVET** — `tool_use` bloğu: `hava_durumu {sehir:Ankara}` |
| Claude Code motor ajan döngüsü (gerçek dosya okuma) | ✅ **success · num_turns=2** — CODEMAP.md'yi okuyup **"170"** yanıtı (bağımsız doğrulanabilir: CODEMAP 170 dosya) |

Hüküm: **tool çağırmada fark YOK** — iki tel de native tool protokolünü doğru kullanıyor; motor üzerinden çok-adımlı ajan döngüsü de çalışıyor (2 tur: araç çağrısı + yanıt). **Uzun koşu (çok saatlik/çok-adımlı) farkı ölçülmedi** — bugünkü kanıt yalnız kısa döngüleri kapsar; model-düzeyi uzun-ufuk verileri (SWE-Marathon vb.) yol-denzeysizdir.
