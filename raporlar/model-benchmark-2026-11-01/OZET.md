# Paseo Model Benchmark — Top 30 · Tazeleme 2026-11-01 (rev.4)

> **Rev geçmişi:** rev.1/2/3 aynı gün (rev.3 = b3 canlı ajan kanıtı). **rev.4 = yeni ham bench (51 model / 27 OK / 24 hata) + b4 canlı ajan bataryaları + GLM 5.3 akışsız ölçümü.** Önceki rev.3 tablosu 2026-10-17 hız ölçümüne dayanıyordu; bu rev.4 tabloyu tamamen 2026-11-01 ölçümüyle yeniler.

- **Kanıt tabanı:** `core/evidence/provider-bench-latest.json` — **2026-11-01T10:45:43Z**, 51 model / 7 sağlayıcı, **27 OK + 24 hata**, hash `a1bc5d6c3b3bf7fe86a2be4c50088c2164c3333684a04608d989105f0f8f51ba` · `core/evidence/provider-bench-glm53u-nostream-2026-11-01.json` (2026-11-01T10:58:30Z, GLM 5.3 akışsız) · `../.paseo-bench/b4-hiz-2026-11-01.json` (7 canlı ajan, 14:21) · `../.paseo-bench/b4-pi-2026-11-01.json` (5 Pi modeli, 15:13) · `../.paseo-bench/b3-claude-2026-11-01.json` (12:50–13:06) · GLM matrisi `raporlar/glm53-motor-matrisi-2026-10-19/OZET.md` · envanter `paseo provider ls/models` (2026-11-01, daemon 0.14.0, 127.0.0.1:6767).
- **Sıralama ölçütü (değişmedi):** `tokSnToplam` (toplam token/sn). Canlı ajan skorları (`1+1+1`) **ayrı ölçektir** — tablo 2'de, hız tablosuna karıştırılmadı.
- **Erişim etiketi:** ✅ bugün ölçüldü · 🔶 kısmi/koşullu · ❌ hata/kapalı · ⚪ ham API ölçülemez · — bu revizyonda ölçüm yok.

## 1. Rev.4 kritik bulgular

- **Codex `glm53u-codex` bugün GLM 5.3 için tek sağlam yol:** b3 E2E **1+1+1 / 57,8 sn**, b4 E2E **1+1+1 / 15,8 sn** (varyans gerçek), akışsız **34,67 t/s** (7,38 sn). **Akışlı** bench aynı modelde **HTTP_502** — akış yolu hâlâ kırık.
- **Claude Code yolları bugün ölü:** `glm53u-claude` ve `claude-glm` canlı ajan koşumunda **401 "Hata Oluştu"** (b3 logları). Anahtar/paket sağlam; sunucu tarafı.
- **Pi CLI ilk kez E2E ölçüldü:** 5 hedefte 4 sonuç — lightning **1+1+1 / 23,8 sn**, nano-omni **1+1+1 / 61,8 sn**, dots-3 **1+1+1 / 13,0 sn**, north-mini **1+1+0 / 42,2 sn**; deepseek-v4.1-flash **hâlâ running** (281 sn, 0+0+0 — hata değil, bitmedi).
- **En hızlı canlı ajan:** NVIDIA NIM **6,4 sn** (1+1+1); OpenRouter north-mini **10,3 sn** (1+1+1); OpenCode deepseek **28,7 sn** (1+1+1).
- **Bugünkü hata sınıfları:** TokenHarbor 4/4 model `free_tier_limit_reached` (429) · Codefast `NO_ACTIVE_PACKAGE` · Groq motor ayağı hata (4,4 sn) · OpenRouter'da 8/15 hata (429/403/404/503) · Kilo dots-3 251 sn'de 0+0+0.

## 2. Motor × sağlayıcı davranış matrisi (2026-11-01)

| Motor | Durum | Kanıt | Not |
|---|---|---|---|
| **Claude Code** (`glm53u-claude`) | **❌ 401** | b3 canlı ajan: `Failed to authenticate. API Error: 401` | Sunucu tarafı; `/v1/messages` 401, diğer uçlar 200 |
| **Claude Code** (`claude-glm`) | **❌ 401** | b3 canlı ajan: aynı 401 | glm-api ucu ayrı sunucu olsa da bugünkü kanıt kırmızı |
| **Codex** (`glm53u-codex`) | **✅** | b3 1+1+1 / 57,8 sn · b4 1+1+1 / 15,8 sn · akışsız 34,67 t/s | Akışlı bench 502 — akışsız kullan |
| **Codex** (codefast-glm eski kart) | **❌ 404** | 10-19 `/responses` 404 | Kart bilinçli kapalı |
| **Pi CLI** (`pi`) | **🔶 4/5** | b4-pi: 3 tam, 1 kısmi, 1 running | İlk gerçek Pi E2E bataryası |
| **Kilo/KiloCode** | **🔶** | b4-hiz dots-3 0+0+0 (251 sn) · b2 aynı desen | Motor açılıyor, hedef modelde skor yok |
| **OpenCode** | **✅** | b4-hiz deepseek-v4.1-flash 1+1+1 / 28,7 sn | GLM E2E hâlâ kanıtsız |
| **NVIDIA NIM** | **✅** | b4-hiz nemotron-3.5-super-vl 1+1+1 / 6,4 sn | Bugünün en hızlı ajanı |
| **TokenHarbor** | **❌ bugün** | 4/4 model 429 · b4 0+0+0 (242 sn) | Kota penceresi; dün çalışıyordu |
| **OpenRouter (ham)** | **✅ kısmen** | b4-hiz north-mini 1+1+1 / 10,3 sn | 15 modelde 8 hata (429/403/404/503) |
| **Groq (Paseo motor ayağı)** | **❌** | b4 4,4 sn hata | Ham API hızı yüksek (tablo 3); motor istek biçimi sorunu |
| **Codefast (kimi-k3)** | **❌** | `NO_ACTIVE_PACKAGE` | Her iki kart |

## 3. Top 30 — `tokSnToplam` (2026-11-01 ham bench + GLM akışsız)

| # | Provider | Model | Durum | TTFT ms | Üretim tok/sn | Toplam tok/sn | Çıktı tok | Erişim |
|---:|---|---|---|---:|---:|---:|---:|---|
| 1 | groq | allam-2-7b | OK | 189 | 1401,62 | **689,65** | 256 | ✅ · ⚠ kod FAIL/IQ 0 (10-18) — hız göstergesi |
| 2 | groq | openai/gpt-oss-20b | OK | 454 | — | 493,77 | 256 | ✅ |
| 3 | groq | qwen/qwen3.8-27b | OK | 145 | 518,96 | 308,44 | 110 | ✅ · IQ 33 (10-18) |
| 4 | groq | openai/gpt-oss-120b | OK | 597 | 880,98 | 207,45 | 162 | ✅ ham API · motor b4 HATA |
| 5 | kilo-gw | nvidia/nemotron-3.5-super-vl:free | OK | 1542 | 1256,73 | 146,68 | 256 | ✅ |
| 6 | kilo-gw | nvidia/nemotron-3.5-lightning:free | OK | — | — | 128,63 | 256 | ✅ |
| 7 | openrouter | nvidia/nemotron-3.5-lightning:free | OK | — | — | 121,57 | 256 | ✅ |
| 8 | openrouter | nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free | OK | 2058 | 1646,44 | 115,64 | 256 | ✅ |
| 9 | kilo-gw | kilo-auto/free | OK | 1277 | 631,31 | 114,21 | 178 | ✅ |
| 10 | kilo-gw | cohere/north-mini-code:free | OK | 869 | 348,12 | 112,84 | 145 | ✅ |
| 11 | nvidia | nvidia/nemotron-3-nano-omni-30b-a3b-reasoning | OK | 1877 | 653,79 | 112,82 | 256 | ✅ |
| 12 | openrouter | openrouter/free | OK | 879 | 374,88 | 112,34 | 141 | ✅ |
| 13 | kilo-gw | nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free | OK | 1013 | 198,05 | 95,81 | 188 | ✅ |
| 14 | nvidia | poolside/laguna-xs-2.1 | OK | 466 | 157,22 | 94,38 | 110 | ✅ |
| 15 | kilo-gw | reflection/beam-free | OK | 1403 | 528,05 | 84,41 | 141 | ✅ |
| 16 | nvidia | meta/muse-glimmer-30b | OK | — | — | 76,10 | 256 | ✅ |
| 17 | kilo-gw | inclusionai/ling-3.1-flash-1019-free | OK | 1791 | 221,94 | 62,27 | 155 | ✅ |
| 18 | openrouter | dots-studio/dots-3-note-preview:free | OK | 2967 | 222,91 | 62,21 | 256 | ✅ · kilo motoru 0+0+0 |
| 19 | kilo-gw | dots-studio/dots-3-note-preview:free | OK | 3464 | 272,11 | 58,12 | 256 | ✅ |
| 20 | kilo-gw | nvidia/nemotron-3-ultra-550b-a55b:free | OK | 1215 | 106,60 | 52,79 | 127 | ✅ |
| 21 | kilo-gw | xingchen-agi/xing4.0-29b-a4b:free | OK | 6531 | — | 39,20 | 256 | ✅ (bugün kilo-gw'de ölçüldü) |
| 22 | openrouter | nvidia/nemotron-3-ultra-550b-a55b:free | OK | 2450 | 149,70 | 38,50 | 127 | ✅ |
| 23 | kilo-gw | openrouter/free | OK | 2277 | 120,72 | 38,15 | 127 | ✅ |
| 24 | **glm53u-codex** | **glm-5.3** | OK (akışsız) | — | — | **34,67** | 256 | 🔶 akış 502 · akışsız OK · b4 1+1+1 / 15,8 sn |
| 25 | nvidia | nvidia/nemotron-3.5-super-vl-120b-a12b | OK | 7232 | 1234,87 | 34,41 | 256 | ✅ · b4 1+1+1 / 6,4 sn |
| 26 | openrouter | nvidia/nemotron-3.5-super-vl:free | OK | — | — | 32,80 | 256 | ✅ |
| 27 | openrouter | cohere/north-mini-code:free | OK | 989 | 36,00 | 28,90 | 145 | ✅ · b4 1+1+1 / 10,3 sn |
| 28 | nvidia | nvidia/riva-translate-4b-instruct-v2 | OK | 9249 | 50,43 | 1,47 | 14 | ✅ çeviri modeli (kod görevi değil) |
| 29 | tokenharbor | deepseek-v4.1-flash:free | HATA | — | — | — | — | ❌ `free_tier_limit_reached` (429) · b4 0+0+0 |
| 30 | codefast | kimi-k3 | HATA | — | — | — | — | ❌ `NO_ACTIVE_PACKAGE` |

> 28 hız satırı = bench'in 27 OK'si + GLM akışsız ölçümü. Son 2 satır hata olduğu için hız sıralamasına girmez. Bench'teki diğer 22 hata `provider-bench-latest.json`'da.

## 4. Canlı ajan bataryaları (skor = 3 soru, `1+1+1` tam)

### b4-hiz (14:21, 7 hedef)

| Hedef | Durum | Süre | Skor |
|---|---|---:|---|
| glm53u-codex/glm-5.3 | idle | 15,8 sn | **1+1+1** |
| nvidia/nemotron-3.5-super-vl-120b-a12b | idle | 6,4 sn | **1+1+1** |
| openrouter/cohere/north-mini-code:free | idle | 10,3 sn | **1+1+1** |
| opencode/deepseek-v4.1-flash-free | idle | 28,7 sn | **1+1+1** |
| groq/openai/gpt-oss-120b | error | 4,4 sn | 0+0+0 |
| kilo/openrouter/dots-studio/dots-3:free | running | 251,1 sn | 0+0+0 |
| tokenharbor/deepseek-v4-flash:free | running | 242,2 sn | 0+0+0 |

### b4-pi (15:13, 5 hedef)

| Hedef | Durum | Süre | Skor |
|---|---|---:|---|
| pi/openrouter/nvidia/nemotron-3.5-lightning:free | idle | 23,8 sn | **1+1+1** |
| pi/openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free | idle | 61,8 sn | **1+1+1** |
| pi/openrouter/cohere/north-mini-code:free | idle | 42,2 sn | 1+1+0 |
| pi/openrouter/dots-studio/dots-3-note-preview:free | idle | 13,0 sn | **1+1+1** |
| pi/tokenharbor/deepseek-v4.1-flash:free | running | 281,3 sn | 0+0+0 |

## 5. Yöntem ve dürüstlük notları

1. **`1+1+1` skoru ile `tokSnToplam` aynı ölçek değildir.** Bölüm 3 hız, bölüm 4 ajan davranışıdır; birleştirilmedi.
2. **"running" = hata değil, bitmedi.** Derin ajan ölürken deepseek (281 sn), kilo (251 sn) ve tokenharbor (242 sn) hâlâ koşuyordu; Pi deepseek alt-ajanı (`86a7ca6`) açık kalmış olabilir.
3. **GLM 34,67 t/s akışsızdır** (`stream=false`), diğer satırlar akışlıdır — birebir kıyas değil. Aynı modelin akışlı bench'i 502.
4. **allam-2-7b hız zirvesi yanıltıcı:** 10-18'de kod FAIL + IQ 0 + terminal 0/5.
5. **Bu rapor üretilirken model çağrısı yapılmadı;** tüm sayılar yukarıdaki dosyalardan okundu. Kaynak bench hash'i `a1bc5d6c3b3bf7fe86a2be4c50088c2164c3333684a04608d989105f0f8f51ba`; üretim 2026-11-01 15:32 (+03).
6. Bench'te 24 hata var; tabloda yalnız 2 temsilci hata satırı gösterildi (TokenHarbor kota, Codefast paket).

---
*Damga (R): 2026-11-01 15:32 · rev.4 = 2026-11-01 ham bench (51/27/24) + b4-hiz (7) + b4-pi (5) + GLM akışsız; üretilen dosyalar: bu rapor + `top30.json`; ikinci yazar (58b4601) 15:21'de `stream disconnected` ile durdu, rev.4 bu oturumda tamamlandı.*
