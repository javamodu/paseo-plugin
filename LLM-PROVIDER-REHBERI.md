# LLM PROVIDER REHBERI — codex / Claude Code / Paseo icin baglanti sozlesmesi

Guncel olcum: 2026-10-18 · Kanit etiketleri: **(R)** bu makineden canli olculdü · **(R-cat)** karsı tarafın canli `/models` kataloğundan okundu · **(R-dok)** saglayicinin resmî dokümanı · **(T)** tahmin.
Kural: **bu rehberde ve config dosyalarinda tek anahtar yazilmaz**; anahtar yalniz env'de veya motorun kendi dosyasinda `{env:...}` olarak durur.

## 1. Tek kural: wire formati

Araç, saglayicinin **konustugu dili** ile ayni dili konusmali. Uyusmazlik "kotu anahtar" degil, **imkansiz baglanti**dir.

| Araç | Konustugu tek format | Aciklamada gecen ad |
|---|---|---|
| Codex CLI (>= 0.163) | **OpenAI Responses** `POST /responses` | `wire_api = "responses"`; `wire_api = "chat"` artik **reddediliyor** (R) |
| Claude Code | **Anthropic Messages** `POST /v1/messages` | `ANTHROPIC_BASE_URL` |
| Paseo `extends:"codex"` karti | Responses (codex motoru) | `OPENAI_BASE_URL` |
| Paseo `extends:"kilo"` / ACP motorlari | **chat/completions** + Messages | `~/.config/kilo/kilo.jsonc` |
| opencode / kilo CLI | chat/completions | `{env:...}` ile anahtar |

**Olcülen uc durumları (R, 2026-10-18, ayni anahtar):**

| Uç | /responses | /chat/completions | /messages | Sonuc |
|---|---|---|---|---|
| `api.codefast.app/glm-api/v1` (GLM gunluk) | **404** | **200** | **200** | codex KULLANAMAZ · Claude Code ve kilo kullanabilir |
| `api.codefast.app/glm-53-unlimited-api/v1` | 403 NO_ACTIVE_PACKAGE | 403 | 403 | uc var, **paket** yok → codex paketi acinca calisir |
| `api.codefast.app/v1` (tek katalog, 72 uc) | 403 PAYG_DISABLED | 403 | 403 | uc var, **bakiye** yok (`remaining 7.3e-7`) |
| `api.deepseek.com` (resmi) | 401 (anahtarsiz) | 401 | — | base_url dogru; anahtarla Responses + `/anthropic` (R-dok) |

> **403 vs 404 ayrimi** en onemli karardir: 403 = yol var, insani karar (paket/bakiye) gerekiyor. 404 = o yol hic yok, hangi anahtar gelirse gelsin calismaz.

## 2. Codex CLI

Dosyalar: `~/.codex/config.toml` (provider'lar) + `~/.codex/<profil>.config.toml` (secimler).
**V2 zorunlulugu (R):** satir ici `[profiles.x]` artik hata veriyor — `"--profile glm cannot be used while config.toml contains legacy [profiles.glm]"`. Her profil ayri dosya.

```toml
# ~/.codex/config.toml  — anahtar YOK, yalniz env_key ismi
[model_providers.deepseek]
name = "DeepSeek resmi API"
base_url = "https://api.deepseek.com"
wire_api = "responses"
env_key = "DEEPSEEK_API_KEY"
```

```toml
# ~/.codex/glm.config.toml
model_provider = "cf-glm-unlimited"
model = "glm-5.3"
```

Kullanim: `codex -p glm` · `codex -p deepseek` · `codex -p cf-kimik3`. Gecici deneme: `codex -c model="glm-5.3" exec ...`.
Kurulum (Windows, kalici env): `setx DEEPSEEK_API_KEY "sk-..."` → **yeni** terminal gerektirir; mevcut kabuk gormez.
Birikmis tuzaq (R): `disable_response_storage` ve `preferred_auth_method` bu surumde taninmiyor, uyari basiyor → sil.

## 3. Claude Code

Anahtar ve uc tamamen env ile verilir; `settings.json`a dokunmaya gerek yok:

```
setx ANTHROPIC_BASE_URL "https://api.deepseek.com/anthropic"    # (R-dok) DeepSeek resmi
setx ANTHROPIC_AUTH_TOKEN "sk-..."                              # anahtar yalniz burada
setx ANTHROPIC_MODEL "deepseek-flash[1m]"                       # (R-dok)
setx CLAUDE_CODE_SUBAGENT_MODEL "deepseek-flash"
setx CLAUDE_CODE_AUTO_COMPACT_WINDOW "786432"
```

codefast gunluk GLM icin: `ANTHROPIC_BASE_URL=https://api.codefast.app/glm-api` — `/v1/messages` 200 dondu (R), **ama yanit `model: glm-5.2` bildiriyor**; yani messages yolu istenen surumu garanti etmez. Kullanimdan once yanitin `model` alanina bak. Paseo'da kurulu kart: `claude-glm` (E2E kanitli, modeller glm-5.3 gunluk + glm-5.2 yedek).
Püf: Claude Code Anthropic formati ister; `chat/completions`-only bir uca dogrudan baglanamazsin — ya saglayicinin `/anthropic` yolu vardir ya da hic yok.

## 4. Paseo

Kart tanimi `~/.paseo/config.json > agents.providers.<id>`. `extends` ya ilk-derece bir motor (`codex`, `kilo`, `opencode`, ...) ya da `acp` olmali; **wire API secenegi yoktur** (R-dok).

- **Responses konusan uc** → `extends: "codex"` + `env.OPENAI_BASE_URL`.
- **chat-only uc** → `extends: "kilo"`; asil baglanti `~/.config/kilo/kilo.jsonc` icinde:

```jsonc
"glmcodefast": {
  "name": "Codefast GLM 5.3 (gunluk, chat)",
  "npm": "@ai-sdk/openai-compatible",
  "options": { "baseURL": "https://api.codefast.app/glm-api/v1", "apiKey": "{env:CODEFAST_KIMI_API_KEY}" },
  "models": { "glm-5.3": { "name": "GLM 5.3" } }
}
```

Kartta model id'si **`<kiloProviderId>/<modelId>`** biciminde yazilir: `glmcodefast/glm-5.3`. Kanit: `E2E-OK-GLM53-KILO` (R).
Anahtarsiz baglanma: kilo `{env:VAR}` okur → anahtar config'de degil Windows env'inde durur. opencode icin ayni mantık `~/.local/share/opencode/auth.json`.

**Reload kurali (R):** kart/model listesi daemon belleğinden gelir. Disk duzenlemesi tek basina yetmez; `~/.paseo/paseo.pid` **supervisor**'dir, onu oldurme — altindaki daemon sunucusunu oldur, supervisor yeniden baslatir ve disk config'i yeniden okur. Bu oturumu keser → insan karari.

## 5. Failover ve rotate

**Rotate (sen secersin):** codex `-p <profil>`; Paseo'da kart/model secimi. Profil dosyasi degistirmek gerekmez, tek dosya = tek secim.
**Failover (kotu durumdan cikis):** `node scripts/codex-failover.mjs`

```
node scripts/codex-failover.mjs --dogrula   # aga gitmeden yapi: profil->provider cozuluyor mu (exit 0/1)
node scripts/codex-failover.mjs             # her provider icin /responses x /chat matrisi + HUKUM
node scripts/codex-failover.mjs --oner      # ilk "CODEX HAZIR" olana model_provider/model yazar (yedek alir)
node scripts/codex-failover.mjs --sec=glm   # ada gore doner; hazir degilse YAZMAZ, exit 3
```

Hukum satiri kodex'in ne yapabildigini soyluyor: `CODEX HAZIR` (200) · `uc var, hesap engeli` (402/403) · `CHAT-ONLY -> ACP gerekir` (404+200) · `kullanilamaz`.
**Otomatik failover yok** (ne codex'te ne Paseo'da): kotu yanit alinca ajan kendilginden baska provider'a gecmez. Bu script'in `--oner` cikisi bir kabuga sarilabilir (T), ama once hesap engelleri kalkmali.

## 6. Uc dogrulamanin uc katmani

1. **Yapısal:** `--dogrula` exit 0 (dosya/alan/adlandirma dogru).
2. **Canli ham probe:** `/responses` veya `/chat/completions`'a tek cagri; **icerik bos ise basari degildir** (bkz. §7 tuzak 2).
3. **Ajan E2E:** taze bir ajanla sabit token istegi (`E2E-...`); arayuzde gorunen modelin gercekten o model oldugunu kanitlar.
`status = available` tek basina hicbirini kanitlamaz.

## 7. Puf noktalari (tekrarlanan tuzaklar)

1. **403'u "anahtar bozuk" sanmak.** `NO_ACTIVE_PACKAGE` = paket süresi bitmis/yok; `PAYG_DISABLED` = bakiye/kredi kapali. Anahtar dogru olabilir — ikisi de insan karari ister.
2. **200 + bos içerik = olum degil, thinking butcesi.** `max_tokens=64` ile `glm-5.2/4.7/5-turbo` bos `content` dondurdu; `max_tokens=600` ile `D52-OK` uretti (R). Ajanlar kisa butceyle "model bozuk" diye raporlar. Yanitta `finish_reason` ve `reasoning_content` alanlarina bak.
3. **Katalog ≠ calisan model.** `glm-api/v1/models` 6 id listeliyor, `glm-5.3` **yok** ama calisiyor (R). Liste disindaki id'leri tek basina "gecersiz" sayma; ham probe ile dogrula.
4. **UI etiketi = model id degil.** Etikte `(New)`, `: free`, bosluk/buyuk harf gorursen o satir yapistirmadir; geceri **canli katalogla** (`opencode models`, `kilo models`) filtrele.
5. **Ayni ailenin birden cok "kanonik" adi.** Provider oneki temizlenmezse `deepseek-v4.1-flash-1017` / `deepseek/...` / `tokenharbor/...` ayri model sanilir.
6. **Anahtarin kopyasi bellekte kalabilir.** Credential degistirdikten sonra sahibi sureci (resident CLI/daemon) yeniden baslamadan yeni anahtar kullanilmaz; `401 api_key_expired` bayat istemciden de gelir.
7. **Kota pencereleri saat farkli.** Ayni gun iki kosum 20 Ekim / 22 Ekim sifirlama soyluyorsa paneli kontrol etmeden huküm verme.

## 8. Bu makinedeki guncel durum (R, 2026-10-18)

| Provider | Yol | Durum |
|---|---|---|
| openrouter · groq · nvidia · kilo · opencode · pi · qoder · omp | chat/Responses | acik, olcülmus |
| Codefast · Kimi K3 limitsiz | `/kimi-k3-unlimited-api/v1` | 403 NO_ACTIVE_PACKAGE (10-14'te calisiyordu, paket bitmis) |
| Codefast · GLM 5.3 gunluk (kilo) | `/glm-api/v1` chat | **CALISIYOR** (`glmcodefast/glm-5.3`, E2E-OK) |
| Codefast · GLM 5.3 limitsiz | `/glm-53-unlimited-api/v1` | 403 NO_ACTIVE_PACKAGE; ikinci hesabin anahtari hicbir config'de yok |
| DeepSeek · Resmi API | `https://api.deepseek.com` | kart + `codex -p deepseek` hazir, **anahtar bekliyor** (env `DEEPSEEK_API_KEY`) |
| TokenHarbor free | `tokenharbor.ai/v1` | 429 kota, pencere 2026-10-20 05:38 UTC (T: panel teyidi gerekir) |

## 9. Yeniden uretme

```
node scripts/codex-failover.mjs --dogrula && node scripts/codex-failover.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/saglik.ps1
```
