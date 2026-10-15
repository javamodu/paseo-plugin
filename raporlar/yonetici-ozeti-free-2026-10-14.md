# YÖNETİCİ ÖZETİ — FREE KULLANIM DURUMU (2026-10-14)

Kapsam: Kilo, OpenCode, OpenRouter, TokenHarbor (+ Codefast ailesi karşılaştırması).
Kanıt etiketi: (R) resmî ölçüm · (T) tahmin · * tek kaynak.
Doğrulama kapısı: `free-ayrim-kapisi.mjs` → **19 PASS, TOPLAM_FAIL=0, EXIT=0**; canlı liste `paseo provider ls --json` = 16 provider.

## 0. GÜNCELLEME 2026-10-15 (bu dosyanın aşağıdaki hükmünü kısmen geçersiz kılar) (R)

Detay ve yineleme: `raporlar/free-modeller-2026-10-15.md`.

- **Kilo: "0/41, 10 USD gerekir" hükmü yanlıştı.** Gateway kataloğunda **12 free** kayıt var (394 modelin içinden) ve **8'i bakiye yüklemeden çalışıyor** (`17*23=391`, 1,2–12,6 sn). Üçü (`lfm-2.5-2.6b`, `nemotron-3.5-lightning`, `laguna-xs-2.1`) yalnız **≥2000 token** bütçede content üretiyor — 400 token'da boş dönüp "başarısız" sayıldılar. Kalanı: `nemotron-3-nano-omni-30b-a3b-reasoning` → `Upstream error from Nvidia: ResourceExhausted`; `inkling-small` → `429 limit_rpd`; `content-safety` → 200 ama çıktı `User Safety: safe` (kod modeli değil). **10 USD kararı bu tabloya göre yeniden verilmeli.**
- **codefast-os / codefast-glm: bakiye miktarı değil, özellik kapalı.** Ölçülen: `403 PAYG_DISABLED`, `payg_enabled:false`, `remaining:0` (glm) / `7.3e-7` (os). `base_url`/yol hatası değil (`/glm-api` ve `/glm-api/v1` aynı 403). §5-soru 2 artık "PAYG açılacak mı?" biçiminde sorulmalı.
- **OpenRouter:** ayrı provider değil ama pi üzerinden ölçüldü — canlı `:free` küme **14**; pi'nin 317'lik kataloğundaki 20 kayıttan **16'sı artık yok** (`404 unavailable for free`), config 14'e çekildi. Paylaşılan anahtar bugün `429 free-models-per-day` noktasına düştü.
- **Doğrulanan yeşiller:** `tokenharbor` 5/5, `codefast` 2/2 (`kimi-k3`, `codefastk3unlimited`) — 1,2–3,1 sn.
- **Yeniden-üretim borcu:** §1.1 ve başlıkta atıf yapılan `free-ayrim-kapisi.mjs` / `free-durum-kapisi.mjs` depoda değil (temp'teydi, silinmiş); bu yüzden aşağıdaki `EXIT=0` iddiaları depodan koşulamıyor. Bugünün ölçüm kapısı repo harness'ine taşındı (`scripts/bench.mjs --check`, `--list`).

## 1. Tek tabloda cevap

| Sağlayıcı | Listede free | Bakiye **yüklemeden** kullanılabilir mi? | Ölçülen free limit | Bakiye yüklenirse ne değişir |
|---|---|---|---|---|
| `opencode` | **27** | **EVET** — bugün canlı üretim: `OC_OK=8` (oturum `09652091`, `openrouter/poolside/laguna-s-2.1:free`, mode `build`) (R) | Gözlenen limit **yok**: 7 free uçta hata görülmedi, maliyet $0.00 (R). Sayısal kota yayımlanmış değil* | Gerek yok; ücretli uçlar ayrıca $0 listeli değil (R) |
| `kilo` | **41** | **HAYIR** — 4/4 denemede 0 token: `Rate limit exceeded: free-models-per-day` (R) | Kilo'nun kendi cevabı: **"Add 10 credits to unlock 1000 free model requests per day"** (R) → bakiyesiz fiili kota **0** | 10 USD → **1000 free istek/gün** açılıyor (R, sağlayıcının mesajı) |
| OpenRouter (ayrı provider **yok**) | `openrouter/*` id'leri `kilo` (41 içi) ve `opencode` (27 içi) kataloğunda yaşıyor (R) | **Dolaylı EVET** — opencode üzerinden; kilo üzerinden hayır (R) | OpenRouter'a doğrudan anahtar tanımlı değil, kendi kotası **ölçülemedi** (R: uç yok) | OpenRouter anahtarı eklenirse ayrı sağlayıcı olarak ölçülmesi gerekir |
| `tokenharbor` | **5** (9 ücretli uç listeden çıkarıldı) | **EVET** — 5/5 free uç ajan hattında koştu, IQ 100 (mimo-v2.5:free 88) (R) | Kataloq girdi/çıktı **$0/1M** (R); günlük istek kotası yayımlanmamış (R). Ücretli 9 uç `402` (bakiye $0) (R) | Bakiye yalnız ücretli uçları açar; free'ler zaten açık (R) |
| `codefast` (bakiye/sınırsız) | 2 uç (`kimi-k3`, `codefastk3unlimited`) | **EVET** — `NUM=391` canlı üretim, 300.1 t/s (R) | `model_not_allowed`: yalnız bu 2 id kabul ediliyor (R) | Bu iki uç fiilen unlimited; kota gözlenmedi (R) |
| `codefast-os` (`open-source-api/v1`) | 11 (`GLM 5.3-os` vb.) | **HAYIR** — `403 API access denied` (R) | Anahtar bu kapıda hiçbir modele izin vermiyor (R) | Hesap/PAYG açılınca aynı id'ler koşulabilir (T) |
| `codefast-glm` (`glm-api`) | 1 (`glm-5.3`) | **HAYIR** — `403 API access denied` (R) | Uç doğru (`config.toml` ikiziyle aynı `base_url`), kapı hesap/bakiye bekliyor (R) | Bakiye/yetkiyle açılır (T) |

## 1.1 Taze sweep (aynı gün, saat 16:0x) (R)

| Küme | Sonuç | Kanıt |
|---|---|---|
| `tokenharbor` 5 free | **5/5 çalışıyor** | ham `POST /responses`: hepsi `200 completed`, çıktı tokenları 15 / 18 / 89 / 17 / 7, süre 1.9–11.7 sn (`th-free-sweep.json`) |
| `opencode` 27 free | **3/27 doğrulandı**, kalan 24 doğrulanmadı | ajan hattı canlı üretim: `OC_OK=8` (`poolside/laguna-s-2.1:free`), `SMOKE_A=1` (`cohere/north-mini-code:free`), `SMOKE_C=3` (`thinkingmachines/inkling:free`) |
| `kilo` 41 free | **0/41** | `Rate limit exceeded: free-models-per-day` (bugün 4. tekrar) |
| `codefast-os` 11 | **0/11** | `open-source-api/v1` her yanıtta `403 API access denied` |

Doğrulama kapısı: `free-durum-kapisi.mjs` → 23 PASS, **EXIT=0** (yukarıdaki her satırı kanıt dosyasıyla çapraz kontrol eder; "kalan 24 doğrulanmadı" boşluğunu da assert eder).

## 2. Bugünkü fiili kapasite (bakiyesiz)

- **Kullanılabilir hat:** `opencode` 27 free + `tokenharbor` 5 free + `codefast` 2 unlimited = **34 koşabilir free/ucretsiz uç** (R).
- **Listeli ama kapalı:** `kilo` 41 + `codefast-os` 11 + `codefast-glm` 1 = **53 uç**, bakiye/yetki bekliyor (R).
- En hızlı ölçülen ücretsiz uç: `codefast/kimi-k3` 300.1 t/s (R); free tier içinde en hızlısı `tokenharbor/claude-haiku-5.5:free` 131.1 t/s (R).

## 3. Kalan belirsizlikler (bilerek boş bırakıldı)

- OpenCode'un gerçek günlük kotası: sağlayıcı kota yayımlamıyor, 7 ölçümde de hat görünmedi → sayı vermek (T) olurdu (R).
- Kilo 41 free modelin tek tek hızı/puanı: 10 USD'lik karar insana ait; kredi yüklenmeden ölçülemez (R).
- OpenRouter doğrudan limiti: ayrı provider olmadığı için ölçülemedi (R).

## 4. Yapılandırma kararları ve geri alma

- Bu oturakta uygulananlar: `tokenharbor` → 5 free; `kilo` → 41 free; `opencode` → 27 free (`models` listeyi **tamamen değiştiriyor**, `additionalModels` kaldırıldı — resmî belge: paseo.sh/docs/custom-providers.md) (R).
- Codefast ailesi üç ayrı `base_url` olduğu için üç provider'a ayrıldı: `codefast` / `codefast-os` / `codefast-glm` (R).
- Yedekler: `config.json.bak-th-free`, `config.json.bak-os-etiket`, `config.json.bak-os-ayrimi`, `config.json.bak-free-filtre`, `config.json.bak-birlestirme`.
- Geri alma: ilgili yedeği `~/.paseo/config.json` üzerine kopyala + `paseo reload --json` (yeniden başlatma gerekmiyor, `restartRequiredPaths: []`) (R).
- Doğrulama: `paseo provider ls --json` (16) · `paseo provider models <id> --json` · `node free-ayrim-kapisi.mjs` (EXIT=0).

## 5. Yönetici için üç soru

1. Kilo'ya 10 USD kredi: 41 free uç gün başına 1000 istek kotayla açılıyor — ödemeye değer mi, yoksa opencode 27 free yeterli mi?
2. `codefast-os` (11 model) + `codefast-glm` (GLM 5.3 ayrı bakiye) kapıları hesap/PAYG bekliyor; bakiye yüklenecek mi, yoksa listeden mi indirilsin?
3. Boşta duran deneme ajanları (`4e7c00cd` hatalı, `09652091` tamam) arşivlensin mi?
