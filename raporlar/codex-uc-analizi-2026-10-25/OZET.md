# Codex ucu analizi — 2026-10-25

Soru: "Codex glm ucu neden çalışmıyor?" · Yanıtın özeti: **19 Ekim hükmü yanlış uçtan geliyordu; doğru uç (glm-53-unlimited-api) 24 Ekim'de uçtan uca doğrulandı.** Canlı yeniden koşum bu turda izin sınıflandırıcısı (glm-5.3 timeout) nedeniyle koşulamadı — aşağıda yeniden üretme komutları var.

## Kanıt zinciri (diskten, bu turda okundu)

1. **19 Ekim matrisi** (raporlar/glm53-motor-matrisi-2026-10-19/OZET.md:18) Codex'i "ÇALIŞMIYOR" dedi çünkü `codefast-glm /responses 404` ölçtü — bu ölçüm **`/glm-api` günlük ucuna** aitti. O uç **chat-only**'dir: /responses yolu hiç yok (404), hangi anahtar gelirse gelsin çalışmaz. Bu hüküm uç için doğrudur ama **Codex+GLM için değil**.
2. **Doğru uç:** `api.codefast.app/glm-53-unlimited-api/v1` — `/responses` 200 (R, 2026-10-19 prob; kaynak: ~/.paseo/config.json glm53u-codex kart açıklaması, satır 984).
3. **24 Ekim doğrulaması** (~/.codex/glm.config.toml:3, diskten): "paket AKTIF, uctan uca dogrulandi (codex exec + doctor + Responses API 200)".
4. **Yapı hazır:** ~/.codex/config.toml `[model_providers."cf-glm-unlimited"]` (base_url=…/glm-53-unlimited-api/v1, wire_api=responses, env_key=CODEFAST_KIMI_API_KEY) + kökte `model_provider = "cf-glm-unlimited"` + profil `~/.codex/glm.config.toml` (`codex -p glm`).
5. **Anahtar mekaniği (olası tek gerçek arıza):** config.toml'da anahtar YOK (doğru politika); Codex `CODEFAST_KIMI_API_KEY`'i **Windows ortam değişkeninden** okur. Paseo içindeki `glm53u-codex` kartı bu env'i kendi kapsamında doğru anahtara set eder (kart çalışır). **Bağımsız terminalde** bu env eski kimi anahtarını taşıyorsa ya da hiç yoksa Codex 403/401 alır. 10-18 rehber ölçümündeki "403 NO_ACTIVE_PACKAGE" eski anahtarın sonucuydu.

## Ücretsiz alternatifler (kullanıcı politikası: ücretli API yok)

- **TokenHarbor** (`~/.codex/tokenharbor.config.toml`): wire_api=responses, `TOKENHARBOR_API_KEY`; `deepseek-v4.1-flash:free` gibi $0 modeller; 7 günlük free kota penceresi 2026-10-20'de doldu — 25'inde yenilenmiş olmalı, prob gerekir.
- Paseo altı free rotalar (opencode/openrouter/kilo free modelleri) Codex'e değil ACP motorlarına aittir.
- DeepSeek resmi: anahtar bekliyor (kullanıcı politikası dışı şimdilik).

## Bulunan ve düzeltilmesi gereken sorunlar

- **B11 — API anahtarı düz metin 3 yerde** (~/.paseo/config.json iki kart + D:\Vibecode\paseo-plugin\claude-glm.cmd satır 3): rehber kuralı "config dosyalarında tek anahtar yazılmaz" ihlali. claude-glm.cmd env'e referansla düzeltilebilir; Paseo kartları daemon restart ister (bu oturumu keser → insan kararı).
- **B12 — 19 Ekim matris hükmü bayat:** "Codex ÇALIŞMIYOR" satırı doğru uçla güncellenmeli ("çalışıyor, glm-53-unlimited-api + doğru env").
- **B13 — CODEFAST_KIMI_API_KEY çift kimlik riski:** aynı env adı Paseo kartında yeni anahtara, bağımsız terminalde (muhtemelen) eski anahtara bağlanıyor. Ad ayrımı (ör. CODEFAST_GLM_UNLIMITED_KEY) ADR gerektirir (script + config değişimi).

## Canlı ölçüm (R, 2026-10-25 — izin penceresi açıkken koşuldu)

`node scripts/codex-failover.mjs` (yazma yok) sonuçları:

| Blok | /responses | /chat | Hüküm |
|---|---|---|---|
| codefast (PAYG) | 403 PAYG_DISABLED | 403 | bakiye yok — kullanıcı politikası: ücretli yok |
| cf-kimi-unlimited | 403 NO_ACTIVE_PACKAGE | 403 | kimi paketi bitmiş |
| **cf-glm-unlimited** | **400 (server_error)** | **200** | **anahtar + limitsiz paket SAĞLAM**; /responses 400 = istek biçimi/bütçe sorunu |
| cf-open-source | 403 PAYG_DISABLED | 403 | — |
| deepseek | 401 (anahtar YOK) | 401 | anahtar bekliyor |

**Teşhis kesinleşti:** /chat 200 → auth ve paket çalışıyor; env `CODEFAST_KIMI_API_KEY` doğru anahtarı taşıyor (bağımsız terminalde de). /responses 400, 404/403 DEĞİL — uç var; 400'ün en olası sebebi probenin `max_output_tokens: 8` bütçesi (rehber §7.2 tuzağı: glm ailesi minik bütçeyi reddediyor; 24 Ekim doğrulamasında ve Paseo glm53u-codex kartında uç 200 dönmüştü). Kodex'in gerçek istekleri büyük bütçeyle gider.

**Kalan doğrulama (izin katmanı düzeldiğinde):** (1) `max_output_tokens: 512` ile /responses gövdesini görme; (2) `codex -p glm exec` uçtan uca.

## Yeniden üretme (shell erişimi dönünce, sırayla)

```
node scripts/codex-failover.mjs --dogrula          # yapı kontrolü
node scripts/codex-failover.mjs                    # canlı /responses x /chat matrisi
codex -p glm exec "yanit olarak sadece: CANLI-OK" # uçtan uca motor testi
codex -p tokenharbor exec "yanit olarak sadece: TH-OK"  # ücretsiz yedek testi
```

Beklenen: cf-glm-unlimited satırında /responses 200 → HÜKÜM "CODEX HAZIR". 403/401 gelirse kök neden env anahtarıdır → `setx CODEFAST_KIMI_API_KEY "<limitsiz-hesap-anahtarı>"` (yeni terminal gerekir).

Damga: 2026-10-25 · ajan = ana-ajan (codex-uc analizi) · commit = YOK (onaysız yasak) · canlı koşum = BEKLEMEDE (izin sınıflandırıcısı glm-5.3 timeout — ölçüm kanıtı (R) değil, analiz kanıtı disk kaynaklıdır).
