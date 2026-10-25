# MODEL FİYAT/PERFORMANS — DeepSeek V4.1 Flash 1017 ve rakipleri — 2026-10-17

Kapsam: `deepseek-v4.1-flash-1017` modelini **hangi kapıdan alırsan** hız ve fiyat ne olur; bu repo'nun yazım iş yükünde (174:1 girdi/çıktı) hangi yolun daha ucuz olduğu.
Kanıt etiketi: (R) canlı ölçüm/canlı katalog · (T) hesap · * üçüncü taraf.
Kaynaklar: DeepSeek resmî fiyat sayfası · TokenHarbor + OpenRouter canlı `/models` · `raporlar/bench-th-fixdogrulama-2026-10-15/`.

## 1. 1017 nedir (R, resmî doküman)

DeepSeek resmî fiyat tablosunda model adı **`deepseek-flash`**, `MODEL VERSION` alanı **`DeepSeek-V4.1-Flash-1017`**. Yani 1017 bir aggregator'ın uydurduğu isim değil, **DeepSeek'in kendi snapshot'ı**. Aynı snapshot üç ayrı yerde satılıyor:

| Yol | Model id | Nereden |
|---|---|---|
| DeepSeek resmî | `deepseek-flash` (→V4.1-Flash-1017) | `https://api.deepseek.com` (OpenAI formatı) ve `https://api.deepseek.com/anthropic` |
| OpenRouter | `deepseek/deepseek-v4.1-flash-1017` | canlı `/models` (470 model) |
| TokenHarbor | `deepseek-v4.1-flash-1017` | canlı `/models` (69 model) |

Ortak özellikler: **ctx 1.048.576** · görsel giriş ✅ · tool calls ✅ · JSON output ✅ · thinking modu var · **maks çıkış: resmî kapıda 384K**.

## 2. Fiyat ve hız — üç yol

| Yol | $/1M girdi | $/1M çıktı | cache-hit | 100k+20k çağrı | 1M girdi (174:1 oran) | Hız |
|---|---|---|---|---|---|---|
| **TokenHarbor** | **$0.14** | **$0.42** | yayımlanmamış | **$0.022** | **$0.142** | **129.5 t/s** (R, 10-15 free katman ölçümü) |
| **OpenRouter** | $0.15 | $0.60 | $0.003 | $0.027 | $0.153 | ölçülmedi |
| **DeepSeek resmî (off-peak)** | $0.15 | $0.60 | $0.003 | $0.027 | $0.153 | ölçülmedi |
| **DeepSeek resmî (peak)** | **$0.30** | **$1.20** | $0.006 | **$0.078** | **$0.307** | ölçülmedi |

Ek kademeler: **OpenRouter `:batch`** = **$0.05 / $0.15** (etkileşimsiz toplu iş için 3–4× ucuz) · **DeepInfra** = $0.14/$0.42 + Priority(1.5×)/Flex(0.8×) · **DeepSeek eşzamanlılık limiti 2500** (Flash), 500 (Pro).

## 3. Peak / off-peak saatleri (R, resmî tablo)

Peak = **01:00–04:00 UTC** ve **06:00–10:00 UTC**, **hafta içi** → tüm oranlar **tam 2×**. Çin resmi tatilleri hariç (tatiller off-peak).
Türkiye = UTC+3:

| UTC | **TR saati** | Durum |
|---|---|---|
| 01:00–04:00 | **04:00–07:00** | 🔴 2× |
| 06:00–10:00 | **09:00–13:00** | 🔴 2× |
| diğer + hafta sonu | — | ✅ 1× |

Kenar: UTC gün sınırı 00:00 UTC = 03:00 TR → "hafta içi" TR'de Cuma 03:00–Cumartesi 03:00 arası; Cuma akşamı zaten off-peak.
**Sonuç:** günün **04:00–07:00 ve 09:00–13:00** bandı (=çalışma saatlerinin içi) resmî kapıda 2× fiyatlı.

## 4. Bu repo için yazım yükünde karşılaştırma

Repo tüketim profili (R, `raporlar/token-olcum-2026-10-11/OZET.md`): **10.666.844.364 girdi / 61.158.030 çıktı = 174:1**, cache-hit %96.8. Yani fiyat kararı **girdi fiyatı üzerinden** verilir.

| Senaryo | TokenHarbor | OpenRouter | DeepSeek resmî |
|---|---|---|---|
| 1M girdi + 5.7k çıktı | **$0.142** | $0.153 | $0.153 off / **$0.307 peak** |
| 10M girdi | **$1.42** | $1.53 | $1.53 off / $3.07 peak |
| 100M girdi | **$14.2** | $15.3 | $15.3 off / $30.7 peak |

(T, 174:1 oranıyla; TokenHarbor'ın ölçülen 129.5 t/s'i free katmanına ait — ücretli katmanda doğrulanmadı.)

**Hüküm:**
1. **En ucuz: TokenHarbor** (çıkışta %30, girdiyle ~%7 daha ucuz) — flat fiyat, saat şoku yok.
2. **Fiyat öngörülebilirliği: OpenRouter** — resmî off-peak ile aynı ama **düz**, yani 09:00–13:00'te 2× ödemiyorsun.
3. **Derin kapı: DeepSeek resmî** — en yüksek eşzamanlılık (2500), **384K maks çıkış**, Anthropic-formatı desteği; ama gündüz 2× fiyat.
4. **Etkileşimsiz toplu iş → OpenRouter `:batch`** ($0.05/$0.15) — bu repo'da ölçüm/rapor üretimi tam olarak bu profile uyar.

## 5. Erişim durumu (R, 2026-10-17)

| Yol | Kayıt | Bakiye | Not |
|---|---|---|---|
| TokenHarbor | ✅ `deepseek-v4.1-flash-1017` config'e eklendi | ❌ **$0** → 402 | ölçüm komutu hazır: `node scripts/bench.mjs --providers=tokenharbor` |
| OpenRouter | ✅ config'e eklendi (15 model) | ❌ doğrulanmadı | **daemon'a yüklenmedi**: `paseo reload` → `Cannot connect to daemon … Invalid hello` |
| DeepSeek resmî | ❌ kayıtlı değil | ön ödeme şart | `models` dizisine eklenmesi + yeni anahtar |

Ayrıntı: `raporlar/model-katalog-2026-10-17/katalog.{json,md}` — 79 model · 114 kayıt · 32 model çoklu sağlayıcıda · 6 geçersiz id.

## 6. Bilinmeyenler (dürüstlük)

- Ücretli katmanlarda **t/s ölçülmedi**; 129.5 t/s free katman ölçümüdür, ücretli yol aynı olmayabilir.
- TokenHarbor'ın ölçülen fiyatı resmî off-peak'ten **daha ucuz** — nedeni (sponsorluk/kampanya/promosyon) yayımlanmamış; **kalıcı sayılmayabilir**.
- DeepSeek "genel fiyat artışı planlanıyor" notu var (kaynak/tarih belli değil) → uzun vadeli fiyat riski aggregator'larda daha yüksek olabilir.
- 1017'nin tokenharbor'daki `:free` kardeşleri (`deepseek-v4.1-flash:free`) **429** — kayan 7 günlük kota 20 Ekim 05:38 UTC'de açılıyor.