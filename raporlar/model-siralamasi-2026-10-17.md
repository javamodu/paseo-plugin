# YEDİ UCUN PUANLI KARŞILAŞTIRMASI — kod kalitesi / hata yönü / agentik · 2026-10-17

Kapsam: Kimi K3, Qwen 3.8 Max, DeepSeek V4 Pro (0813), GLM-5.3, DeepSeek V4.1 Flash, GLM 5.3 Flash, Qwen 3.8 Flash — "bu repoyu yazmaya uygunluk" ekseninde puanlama.
Kanıt etiketi (ANAYASA A2): (R) canlı ölçüm · (R-cat) sağlayıcının canlı kataloğundan okunan alan · (T) tahmin · * tek kaynak.
**Bu belge `raporlar/provider-secimi-2026-10-17.md` §1'ini kısmen ÇÜRÜTÜR**: "qwen3.8-max hiçbir katalogda yok" ve "GLM 5.3 yalnız codefast'te" hükümleri yanlıştır — ikisi de `tokenharbor` canlı kataloğunda mevcut (68 kayıt, HTTP 200). Eski dosya append-only kuralı gereği değiştirilmedi, düzeltme buradadır.

## 0. Ölçüm neden bugün mümkün değil (R)

| denek | durum | kanıt |
|---|---|---|
| `tokenharbor/{glm-5.3,qwen3.8-max,deepseek-v4-pro,kimi-k3}` | çağrıreddi: `Your Token Harbor balance is at $0` | `raporlar/bench-dortlu-2026-10-17/bench.json` `hata` alanı, 4/4 satır |
| `tokenharbor/deepseek-v4.1-flash:free` | kota bitmiş: `next rolling 7-day period starts 22 Oct 2026 14:33 UTC` | aynı artefakt, satır 5 |
| `codefast` uçları | `403 NO_ACTIVE_PACKAGE` (kimi), `403 PAYG_DISABLED` (`codefast-os`, `codefast-glm`) | canlı `/models` yoklaması 2026-10-17, HTTP 403 |
| `openrouter` free kümesi | 16 free uç, **içlerinde bu 7 aileden hiçbiri yok** (`glm|qwen|deepseek|kimi|mimo` eşleşmesi = 0) | canlı `/models`, HTTP 200, katalog 470 |
| `nvidia/z-ai/glm-5.3-flash` | erişilebilir ama **1,2 t/s** (ölçülmüş 2026-10-16) — harness'ın 240 sn başına-çağrı tavanında ~288 çıktı token'ına sıkışır, ölçüm yapılamaz | `paseo_list_providers` nvidia açıklaması + `raporlar/free-modeller-2026-10-15.md` §0 |
| `omp` | bugün `PROVIDER_ERROR: Timed out waiting for OMP to become ready` — dünkü 635 uç / 58 free hattı şu an kapalı (gerileme) | canlı `paseo provider models omp --json` 2026-10-17 |

Sonuç: aşağıdaki puanlar **hücre hücre kaynaklıdır**. Kod kalitesi/hata yönü/agentik hücrelerinin büyük kısmı (T)'dir — bu tablo sıralama önerir, sıralama **kanıtlamaz**. Tek $5'lik tokenharbor yüklemesi 7 satırın tamamını (R)'ye çevirir (~20 dk, aynı harness).

## 1. Canlı katalog gerçekleri (R-cat, tokenharbor `/models`, 2026-10-17)

| uç | tier | ctx | tool_call | prompt cache | $/1M giriş/çıkış |
|---|---|---|---|---|---|
| `glm-5.3` | **frontier** | 200.000 | var | var | 1,4 / 4,4 |
| `kimi-k3` | high | 1.048.576 | var | var | 3 / 15 |
| `qwen3.8-max` | high | katalogda `null` | var | var | 2 / 6 |
| `deepseek-v4-pro` | high | katalogda `null` | var | var | 1,32 / 3,96 |
| `deepseek-v4.1-flash` | low | 1.048.576 | var | var | 0,3 / 1,2 |
| `glm-5.3-flash` | low | 1.000.000 | var | var | 0,15 / 0,5 |
| `qwen3.8-flash` | low | 983.616 | var | var | 0,15 / 0,47 |

Çelişki (rapor edilen, çözülmemiş): `glm-5.3` bağlamı tokenharbor'da **200.000**, openrouter'da (`z-ai/glm-5.3`) **1.048.576**. Aynı model, iki kaynak, 5x fark — hangisinin gerçek olduğu ancak canlı çağrıyla ölçülür (T yok, ölçülmedi). `deepseek/deepseek-v4-pro-0813` (openrouter) ctx 1.048.576; "0813" bir tarih-yaması sürüm etiketidir, ayrı denektir.

## 2. Puanlama rubric'i (toplam 100) — bu reponun işine göre

| eksen | ağırlık | neyi ölçüyor | hücre kaynağı |
|---|---|---|---|
| **Kod kalitesi** | 30 | sandbox'ta çalışan fonksiyon + çok-dosyalı TS plugin kodu doğruluğu | (R) yalnız ölçülen satırlarda; gerisi (T) |
| **Hata yönü** | 25 | talimat takibi, boş-çıktı/ihlal eğilimi, butce daralmasında kendini kurtarma, JSON şema uyumu | (R) `bench-2026-10-15` `uyum`/`kod` + `free-modeller` §3-ders; gerisi (T) |
| **Agentik** | 25 | tool_call desteği (R-cat) + ajan hattında koşma kanıtı + uzun-ufuk disiplini (tier, akıl-karakter) | (R-cat)/(R) + (T) |
| **Bağlam** | 20 | ctx büyüklüğü + prompt cache (uzun SSOT belgeleri: ANAYASA+rehber+STATE_BOARD tek bağlamda) | (R-cat) |

## 3. Puan tablosu

| # | uç | Kod (30) | Hata (25) | Agentik (25) | Bağlam (20) | **TOPLAM** | Kanıt kapsamı |
|---|---|---|---|---|---|---|---|
| 1 | `deepseek-v4.1-flash` | 26 (R: kardeş `:free` ucu IQ 100, kod PASS, terminal 5/5) | 21 (R: aynı kümede JSON uyum PASS; *kardeş `deepseek-v4-flash` bir koşuda terminal 0/5 — sürüm farkı ölçüldü*) | 20 (R-cat tool=true, tier low; (T) düşük tier = uzun-ufuk riski) | 18 (R-cat 1.048.576 + cache) | **85** | **yüksek** (aile ölçüldü) |
| 2 | `kimi-k3` | 17 (R: ajan hattında `NUM=391` PASS + 300,1 t/s; R: 10-15 ham-API koşusunda `kod FAIL:fonksiyon bulunamadi`, terminal 0/5 — tek yinelemesiz çelişki) | 13 (R: küçük butcede reasoning her şeyi yiyip `content` boş döndürmesi ÖLÇÜLDÜ; kendini kurtarma yok) | 24 (R-cat tool=true + tier high + gerçek ajan hattında koştuğu kanıtlı) | 18 (R-cat 1.048.576 + cache) | **72** | **orta** (iki çelişik ölçüm) |
| 3 | `qwen3.8-max` | 20 (T) | 17 (T) | 21 (R-cat tool=true, tier high; ajan hattı ölçülmedi) | 12 (T: ctx katalogda `null` — bilinmeyen bağlam puanı düşürülür) | **70** | **düşük** (0 ölçüm) |
| 4 | `glm-5.3` | 21 (T: tek **frontier** tier) | 17 (T) | 21 (R-cat tool=true, frontier) | 10 (R-cat 200.000 — 1M'lik SSOT paketini tek bağlama sığdırma riski; *openrouter 1M diyor, çelişki*) | **69** | **düşük** (0 ölçüm; codefast ucu 403) |
| 5 | `deepseek-v4-pro` | 22 (T: ailenin ölçülmüş flash üyesi 5/5 terminal) | 18 (T) | 21 (R-cat tool=true, tier high) | 14 (T: ctx `null`; openrouter yaması 1.048.576 *) | **75** | **düşük-orta** (0 ölçüm, aile kanıtı güçlü) |
| 6 | `qwen3.8-flash` | 16 (T) | 15 (T) | 16 (R-cat tool=true, tier low; `qoder` üzerinden ACP ucu var ama bench'i hiç koşulmadı) | 17 (R-cat 983.616 + cache) | **64** | **çok düşük** (0 ölçüm) |
| 7 | `glm-5.3-flash` | 14 (T) | 13 (T) | 14 (R-cat tool=true, tier low) | 17 (R-cat 1.000.000) | **58** | **düşük + pratik engel** (1,2 t/s ölçüldü = kullanılamaz) |

Eşitlik bozma: kanıt kapsaması yüksek olan satır öne alınır (1. ve 2. sıradaki fark ölçümden, 3-7'deki fark tahminden üretildi).

## 4. Bu reponun işi için hüküm

- **Çok-dosyalı plugin kodu (ordu-core TS + testler):** tek seferlik uzun üretimde bağlam + hata yönü baskın → `deepseek-v4.1-flash` ölçülmüş olarak hazır; `deepseek-v4-pro` aday (ölçülmesi şart).
- **Sözleşme/ADR yazımı ve derin karar:** tier high/frontier lazım → `kimi-k3` (kanıtlı agentik + 1M ctx) ama boş-çıktı riski ölçüldü: **butce-tavanı yüksek tutulmadan koşulmamalı**; `qwen3.8-max`/`glm-5.3` bu ligde henüz kanıtsız.
- **Kabul/evaluator:** hiçbir yukarıdaki model kendi çıktısını kabul edemez (PLAN §4); evaluator deterministik koşucu kalır, LLM yalnız test-tasarımında.
- **Diskalifiye:** `glm-5.3-flash` hız nedeniyle (1,2 t/s) — puanı ne olursa olsun harness'ta ölçülemiyor, kullanılamıyor.

## 5. Sıralamayı (T)'den (R)'ye çevirecek komut

```
# 1) tokenharbor bakiyesi doldurulunca (tek bakiye 7 ucun 6'sını karşılar)
BENCH_MODELS="glm-5.3,qwen3.8-max,deepseek-v4-pro,kimi-k3,deepseek-v4.1-flash,glm-5.3-flash,qwen3.8-flash" \
  node "$TEMP/bench4.mjs" --providers=tokenharbor --out=raporlar/bench-yedili-<tarih>
node scripts/bench.mjs --check raporlar/bench-yedili-<tarih>/bench.json   # exit-0 beklenir
```
Harness'ta eklenmesi gereken hücre: **hata-yönü doğrudan ölçümü** (bilerek bozuk komut verip kendini düzeltme turu) — bugünkü `uyum`/`kod` testleri bunu tam karşılamıyor; (§2'deki 25 puanlık eksen bu yüzden en zayıf temelli eksen).

## 6. Boşluklar

- `qoder/Qwen3.8-Flash` ACP hattı hiç koşulmadı (free, 0.00x Credit) — tek ücretsiz-denenebilir Qwen ucu; ham-API ölçümü config'de `base_url` olmadığı için imkânsız (R).
- Kimi K3'ün 10-15'teki kod FAIL'i **tekrarlanmadı**; tek-koşu bulgusu * etiketiyle taşınır.
- Hiçbir satırda resmî SWE-bench/Terminal-Bench değeri yok; `scripts/bench-puanlari.json` bilinçli boş — puanlar yalnız kendi ölçüm + katalog alanlarımızdır.
- `omp` bugünkü ready-timeout'u: free hat planı bunu geri almadan güvenemez.

## 7. tokenharbor anahtar degisimi (R, 2026-10-17 — ayni gun devam turu)

- Yapilan: `~/.paseo/config.json` icinde `agents.providers.tokenharbor.env.OPENAI_API_KEY` yeni anahtarla degistirildi. Deger yalniz config `env`'inde; repo dosyalarina yazilmadi (kontrol: `grep -rl thk_live --exclude-dir=.git` -> tek eslesme `raporlar/free-modeller-2026-10-15.md:66`, oradaki sey anahtar DEGERI degil, `thk_live…` ONEK etiketidir).
- Yedek: `~/.paseo/config.json.bak-th-key` (degisiklik oncesi hali; geri alma = bu dosyayi kopyala + `paseo reload --json`).
- Kaza ve kapanisi (durust kayit): ilk yazim denemesinde anahtar tanimlisi `undefined` gecti ve `OPENAI_API_KEY` alani silindi (`key_var_mi=false`, exit 1 ile yakalandi). Yedekten geri yuklendi, sonra dogru degerle tekrar yazildi; `GERI_YUKLENDI=thk_live_EkC...2Hfl` -> `YENI_KAYITLI=thk_live_6aD...lyLO (len 73)`, `FARKLI=true`.
- Daemon: `paseo reload --json` -> `appliedPaths:["agents.providers"]`, `restartRequiredPaths:[]`; `paseo provider ls --json` -> `tokenharbor status=available, enabled=Enabled`. RELOAD/VERIFY exit 0.
- Yeni anahtarla canli olcum (R): `GET /models` -> HTTP 200, katalog 68, hedef 7 ucun 7'si de kataloqta (`glm-5.3, qwen3.8-max, deepseek-v4-pro, kimi-k3, deepseek-v4.1-flash, glm-5.3-flash, qwen3.8-flash`).
- Cagri durumu (R): 7 ucun 7'si de **HTTP 402 `{"type":"balance_zero"}`** — yeni anahtar da kimlik dogruluyor ama bakiye $0. Yani S2-6 tablosundaki (T) hucreler HENUZ (R)'ye donusmedi; alim yapilmadan olcum yok.
- Free hat icin yeni bilgi (R): `deepseek-v4.1-flash:free` -> HTTP 429, `next rolling 7-day period starts 20 Oct 2026 at 05:38 UTC`. Onceki anahtarin artefakti "22 Oct 14:33 UTC" diyordu — kota hesabi anahtar/hesap bazli, iki tarih cakisiyor; bu hesabin free hatt 20 Ekim 05:38 UTC'de aciliyor.
- Guvenlik notu: yeni anahtar sohbete duz metin girdi; islem bitince panelde rotasyon onerilir (repo sozlesmesi: anahtar degeri raporlara dusurulmez, bu turda dusurulmedi).

## 8. Anahtar degisimi sonrasi kapilerin atfisi (R, 2026-10-17)

Kosu: `scripts/openrouter-pi-kapisi.mjs` TOPLAM_FAIL=1, `scripts/pi-erisim-kapisi.mjs` TOPLAM_FAIL=2, `scripts/omp-kurulum-kapisi.mjs` TOPLAM_FAIL=1 (exit 1).

Atif deneyi (ayni gun, config diskte iki kez kosu): yedek (eski) anahtarla `{openrouter-pi: [exit 1, 1 FAIL], pi-erisim: [exit 1, 2 FAIL]}`; yeni anahtarla **birebir ayni**. Sonuc: kirmizilar anahtar degisiminden GELMIYOR, onceden var olan kapı-bekuntusu sapmasi. Deney sonrasi config md5 geri yuklendi (`204e55c834`, ESIT=true), `paseo reload --json` `appliedPaths:[]` (disk = daemon durumu), nihai anahtar `thk_live_6aD...lyLO`.

Kok nedenler (kod satirlari):
- `openrouter-pi-kapisi.mjs:53` `chk(arr.length === 17, ...)` — canli `paseo provider ls` = **19** (`codefast-os`, `codefast-glm` 14-15 Ekim'de eklendi). Beklenti bayat.
- `pi-erisim-kapisi.mjs:33` `chk(!varsay(piModels), "pi models.json YOK ...")` — dosya 2026-10-15'de bilincli olusturuldu (bkz. `free-modeller-2026-10-15.md` §4.1) ve VAR. Ayni dosya icin `openrouter-pi-kapisi.mjs:39` `chk(var_(MJ), ...)` bekliyor: **iki kapı ayni konuda zitt kurallari tasiyor** (sozlesme cakismasi).
- `pi-erisim-kapisi.mjs` "model id'lerinin TAMAMI openrouter/ onekli" onerdurumasi da 5 tokenharbor ucunun eklenmesiyle kirildi; pi yerel kataloğundaki tokenharbor uc sayisi 4 (kapı 5'i bekliyor).

Yesil kalanlar (R, exit 0): `scripts/saglik.ps1` 17 OK / 0 EKSIK / 1 SARI · `scripts/codemap.ps1` (152 dosya) · `scripts/zincir-kontrol.ps1` (14 handoff, kopuk yok) · ordu-core `npm test` 296/296 · config farki tek alan: `.agents.providers.tokenharbor.env.OPENAI_API_KEY DEGISTI`.

Bekleyen insan karari: kapı beklentilerinin tazelenmesi (17 -> canli sayi; models.json VAR + oneek kurali; iki kapinin zit kuralinin tek kaynağa indirilmesi) — kod degisikligi ister, onaysiz yapilmadi.
