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
| openrouter (bu turda ayrildi) | 14 | 14 listeli, 1'i bench ile olculdu (223,6 t/s) | ham-API |
| pi (ayri ajan-hatti provider) | 19 (14 openrouter + 5 tokenharbor) | 19 free uc listeli, tokenharbor 3/3 canlı doğrulandı | yalniz-ajan-hatti |
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

## 4. OpenRouter ve pi — iki ayrı provider (güncellendi 2026-10-15, ikinci oturum)

Canlı `:free` küme **14 kayıt** (OpenRouter kataloğu 462 model; serbest küme günlük dolup boşalıyor).
Pi'nin 317'lik kataloğu bayat: config'teki 20 kayıttan 16'sı OpenRouter'da artık yok
(`404 This model is unavailable for free`).

Bu turda yapılan: `openrouter` **ayrı provider olarak** yazıldı (ham-API, `paseo provider ls` = 17),
`pi` ayrı kaldı. İkisinde de **yalnızca** canlı 14 `:free` uç listeli; `pi` id'leri ajentin beklediği
`openrouter/` öneklisiyle birebir aynı küme. (R)

| provider | erişim | uç | ölçülen |
|---|---|---|---|
| `openrouter` | ham-API `https://openrouter.ai/api/v1` | 14 free | `cohere/north-mini-code:free` **223,6 t/s**, IQ 100, terminal 5/5, kod/uyum PASS, ctx 256000 (`raporlar/bench-or-2026-10-15/`, 1/1 ölçülen) |
| `pi` | yalnız-ajan-hattı (`env.OPENAI_BASE_URL` yok) | 14 free (`openrouter/` önekli) | önceki oturumda `NUM=391`; bu turda yeniden koşulmadı |

Tuzak (R): yeni provider girdisi **`extends` olmadan daemon tarafından sessizce yok sayılıyor** —
`paseo provider ls` listemiyor, `provider diagnostic <id>` → `Provider <id> is not configured`,
`reload` ise `appliedPaths: []` verip yine de "Configuration reloaded." yazıyor. Çalışan custom
girdilerin hepsinde `extends: "codex"` var (codex uyumu `OPENAI_BASE_URL`/`OPENAI_API_KEY` okur);
`openrouter` da eklendiği anda 17. provider olarak göründü. `paseo provider models <id> --json`
custom id'de statik listeyi döndürüyor, canlı katalog değil.

Doğrulama: `node scripts/openrouter-pi-kapisi.mjs` → 12 PASS / `TOPLAM_FAIL=0` / `DEPO_KAPI_EXIT=0`;
`node scripts/pi-erisim-kapisi.mjs` → `PI_KAPI_EXIT=0`; `node scripts/bench.mjs --check
raporlar/bench-or-2026-10-15/bench.json` → `BENCH_CHECK_EXIT=0`, `CHECK_FAIL=0`.
Anahtar diske değil yalnız config `env`'ine yazıldı (değeri raporlara düşürülmedi).
Geri alma: `~/.paseo/config.json.bak-or-ayri` (bu değişiklikten önceki durum) veya
`.bak-or-ayri2` kopyalanır + `paseo reload --json`. Kota notu: paylaşılan anahtar gün içinde
`429 Rate limit exceeded: free-models-per-day. Add 10 credits` durumuna düşebiliyor.

### 4.1 Düzeltme: pi tek sağlayıcıya mahkum değil (kullanıcı uyarısı sonrası ölçüldü)

`https://pi.dev/models?name=free` 1.613 model döndürüyor (filtre metin araması; çoğu $0 değil) ve
$0 alt kümesi **birden çok sağlayıcıda**: `google`, `mistral`, `nvidia`, `huggingface`,
`kimi-coding`, `opencode`, `openrouter`. Yerel pi 0.73.1'in kuralı: bir sağlayıcının modelleri
**yalnızca kimliği varsa** listede görünüyor — 19 kimlik değişkeninin bu makinede **2'si dolu**
(`OPENAI_API_KEY` = tokenharbor anahtarı, `OPENROUTER_API_KEY`). (R)

OpenCode Zen free pi üzerinden **koşamıyor** (R): `OPENCODE_API_KEY` verilince pi kataloğu 73 Zen
modelini gösteriyor (`pi --list-models opencode`), ama canlı denemeler `opencode/hy3-preview-free` →
`400 Upstream request failed: Model is unavailable`, `opencode/cat-jam-free` → `403 OpenCode's free
tier can only be used from within OpenCode`. Yani Zen free yalnız `opencode run` hattından koşuyor
(§2); pi listesine bilerek alınmadı.

Yapılan: tokenharbor'un 5 free ucu `~/.pi/agent/models.json` ile pi'ye kaydedildi —
`baseUrl https://tokenharbor.ai/v1`, `api openai-completions`, `apiKey "OPENAI_API_KEY"`
(**env adı referansı, anahtar diske yazılmadı**), `compat.supportsDeveloperRole/ReasoningEffort=false`.
Canlı ölçüm (ajan hattı, `17*23` → `391`): `deepseek-v4.1-flash:free`, `claude-haiku-5.5:free`,
`mimo-v2.5:free` = 3/3 PASS, önekli biçimler de PASS (`tokenharbor/claude-haiku-5.5:free`,
`openrouter/cohere/north-mini-code:free`) → `PI_TH_EXIT=0`.

Böylece Paseo `pi` provider'ı artık **19 free uç** listeliyor: 14 `openrouter/…` + 5 `tokenharbor/…`;
`openrouter` ayrı provider olarak 14 free ile duruyor. Kapı: `node scripts/openrouter-pi-kapisi.mjs`
→ 23 PASS / `TOPLAM_FAIL=0` / `KAPI_EXIT=0` (API çağrısı yok; config + paseo CLI + pi yerel kataloğu).
Geri alma: `~/.pi/agent/models.json` silinir (dosya bu turda ilk kez oluşturuldu) +
`config.json.bak-or-ayri2` → `paseo reload --json`.

## 5. codefast / tokenharbor (referans)

`tokenharbor` 5/5 (duzeltilmis harness ile yeniden olculdu, `bench-th-fixdogrulama-2026-10-15`, 5/5
olculen, `--check` EXIT=0). `codefast` 2/2 (`kimi-k3`, `codefastk3unlimited`) — `17*23=391`, 1,2–3,1 sn —
**ayni gunun erken saati**; sonraki kosuda iki uc de `403 API access denied` dondurdu, yani 2/2
su anki durum degil gecmis olcum. `codefast-os` 11/11 ve `codefast-glm` 1/1 → `403 PAYG_DISABLED`
(`allowed:false`, `remaining:0` / `7.3e-7`, `payg_enabled:false`). `base_url`/yol hatası değil: `/glm-api` ve `/glm-api/v1` aynı 403'ü veriyor.

## 6. Paseo `omp` (Oh My Pi) provider'ı: neden unavailable, nasıl koşar

Kullanıcı uyarısı: "oh my pi var paseo agent içinde provider olarak". Ölçüm (R):

- `paseo provider ls --json` → `{"provider":"omp","label":"Oh My Pi","status":"unavailable",
  "enabled":"Enabled","defaultMode":"full"}`; 17 provider içinde yerleşik olarak duruyor.
- `paseo provider models omp --json` → `PROVIDER_ERROR: Failed to fetch models for omp: Provider
  omp is not available` — katalog boş değil, **erişilemez**; free uç ölçümü bu yüzden yapılamadı.
- `paseo provider diagnostic omp` neden zinciri: `Command source: override` / `Configured command: omp`
  → `where.exe omp` bulunamadı, `Resolved path: not found`, `Version: unknown`,
  `Version support: unknown (minimum 16.3.9)`. Daemon PATH'inde `AppData\Roaming\npm` var; global
  npm listesinde `@oh-my-pi/*` **yok** (yalnız `@mariozechner/pi-coding-agent@0.73.1`).
- İkinci engel: `diagnostic` → `Bun runtime: unavailable; npm-installed OMP requires Bun >= 1.3.14`
  ve `npm view @oh-my-pi/pi-coding-agent engines` → `{ bun: ">=1.3.14" }`. Makinede `bun` yok
  (`where bun` → bulunamadı). Paket yalnız npm ile kurulsa da komut koşmaz.
- Üçüncü engel: `Config root: C:\Users\gatep\.omp` mevcut ama içinde **sadece** `agent/extensions/`
  (19 Temmuz tarihli `orca-agent-status.ts`, `orca-prefill.ts`, `orca-titlebar-spinner.ts`);
  `agent/agent.db (not found)` — eski bir omp izi, oturum/hafıza veritabanı yok.
- Ad karışıklığı (önemli): `oh-my-pi@0.2.0` = **pi eklentisi** ("Enhancement framework for Pi CLI",
  `pi install oh-my-pi`, Sisyphus-vari orkestrasyon prompt'u). `@oh-my-pi/pi-coding-agent@18.11.0`
  = Paseo'nun beklediği `omp` CLI'si (`bin.omp = dist/cli.js`, homepage omp.sh). Paseo provider'ı
  ikincisini istiyor; 18.11.0 ≥ 16.3.9 olduğundan sürüm engeli yok, **kurulum engeli** var.
- Kurulum yolu (resmî README): `bun install -g @oh-my-pi/pi-coding-agent`; sonra `omp models [arama]`
  / oturumda `/model`. Özel uçlar `~/.omp/agent/models.yml` (etiketler `oauth`, `plan`); katalog
  paketi `@oh-my-pi/pi-catalog` bundled `models.json` + discovery (OpenAI-uyumlu, Gemini, Codex,
  Cursor, Antigravity, Ollama). README OpenRouter'ı sayıyor, tokenharbor/omniRoute geçmiyor; bazı
  arama backendleri `no key` / `anonymous fallback` veriyor — free model kapsamı kurulum sonrası
  `omp models` ile ölçülür, şu an iddia edilmez (T).

Doğrulama (bu bölümün iddiaları için koşulan komutlar, exit-0): `node
scripts/openrouter-pi-kapisi.mjs` → `KAPI_EXIT=0`, `TOPLAM_FAIL=0`, `grep -c '^FAIL'` = 0 (19 pi /
14 openrouter / 5 tokenharbor canlı); `node scripts/bench.mjs --check
raporlar/bench-or-2026-10-15/bench.json` → `BENCH_CHECK_EXIT=0`, `CHECK_FAIL=0`;
`powershell -File scripts/saglik.ps1` → `SAGLIK_EXIT=0` (17 OK, 0 EKSIK, 1 SARI).
`omp` ölçümü salt-okuma: `%TEMP%\omp-diyas.mjs` (paseo `provider diagnostic omp` +
`--json`) ile `npm view @oh-my-pi/pi-coding-agent engines bin` ve `where bun` / `where omp`.
Kurulum yapılmadığı için omp tarafında exit-0 üretilecek doğrulanabilir bir çalışma yok; iddia
yalnız "komut çözülmüyor + Bun yok" ölçümüdür.

Karar: kurulum (Bun + global paket) makine-geneli ortam değiştirdiği için kullanıcı onayına bırakıldı;
onay gelene kadar free uç ihtiyacı mevcut `openrouter` (14 free, ham-API ölçülebilir) + `pi`
(19 free) provider'larıyla karşılanıyor — `omp` için config'e/binary'e dokunulmadı, yalnız belgelendi.

## 7. Yineleme

Betikler bu turda `raporlar/` altına taşınmadı (kapsam kuralı: tek parça/tur); geçici olarak
`%TEMP%` içinde: `cf-probe.mjs` (ham-API yoklama, 3 sn bekleme), `kilo-olc.mjs` + `kilo-olc2.mjs`
(gateway kataloğu + free ölçümü), `oc-run.mjs` (Zen CLI), `or-free-check.mjs` / `pi-kapi.mjs`
(canlı free kümesiyle config karşılaştırma kapısı), `omp-diyas.mjs` (paseo `provider diagnostic omp`
salt-okuma tanısı). Kanıt exit-kodları: `KAPI_CANLI_EXIT=0`,
`OPENCODE_ZEN_RUN_EXIT=0`, `KILO_KALAN_EXIT=0`, `TEKRAR_KONTROL_EXIT=0`, `PACED_OLCUM_EXIT=0`;
omp turunda `KAPI_EXIT=0` (TOPLAM_FAIL=0), `BENCH_CHECK_EXIT=0` (CHECK_FAIL=0), `SAGLIK_EXIT=0`
(17 OK / 0 EKSIK / 1 SARI).
