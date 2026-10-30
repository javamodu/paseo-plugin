# DC-S3-04 — Gerçek kullanım ve idempotent mutabakat

**Kimlik:** DC-S3-04 · ATOM-H1-2026-10-28.2 · **2026-10-30T07:01:52.574+03:00**

## Teslim

- `core/src/dc-usage-reconcile.ts`: kullanım raporlarını sert biçimde doğrular ve idempotent mutabakat üretir.
- Başarılı, başarısız, iptal, test ve onarım tüketimleri tek seferde kapatılır.
- Eksik, çift ve geç raporlar sırasıyla `MISSING`, `DUPLICATE`, `LATE` olarak ayrıştırılır.
- Bağımsız limit yoksa `NO_LIMIT` döner; yeni dış etki açılmaz.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-usage-reconcile.test.ts test/store.test.ts test/metrics.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `30 pass / 0 fail`

## Gözlemler

- **P1:** Deneme ve alt süreç tüketimi tek kez, aynı sonuçla kapanır.
- **N1:** Eksik/çift/geç rapor sessiz sıfır veya iki kez harcama üretmez.
- **N2:** Bağımsız limit yokken yeni etki açılmaz.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/telemetry.ts` | `1ba4dfacd75cb907ceda6e3ae36b23db682c90e5791dc0050edbfbfe5894773d` | 6817 |
| `core/src/gozetimsiz.ts` | `e6c691706b36a2c81054db6685cb64d9e79a993376a75f091d5dca6ebc2d8eb6` | 14532 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/dc-usage-reconcile.ts` | `615a305e10ceba42460a2003895d19dc0ea3e0925b021821fc10c9dc844cb943` | 6372 |
| `core/test/dc-usage-reconcile.test.ts` | `7a4a9b589573e6045c2ba152d473d836192748bea0a2527c96b6ad974438913e` | 3416 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
