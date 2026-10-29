# DC-S0b-03 — Bağımsız tüketim sınırı ve G0 kanıt paketi

**Kimlik:** DC-S0b-03 · ATOM-H1-2026-10-28.2 · **2026-10-30T02:07:33.451+03:00**

## Sonuç önerisi

Sağlayıcısız `independent-json-usage-bound-v1` fixture’ı, bağımsız üst sınırı ve kullanım kaynağını temp JSON üzerinden sınar. Limit aşımı yeni etkiyi durdurur; eksik kullanım sıfır sayılmaz; hazır kaynak/limit yoksa G0 açık kalır. Gerçek sağlayıcı/DB/ağ çağrısı yapılmaz.

## Kaynak kanıtı

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/store.ts` | `e46ed62f7cfade8bc5197b9d20681ebc5bbfe75c74540c83ede9afbb62da9f05` | 13415 |
| `core/src/capabilities.ts` | `f0c81827c3d25c7a21972873db4809be0295397430df41ad9f1b19b188062b01` | 4077 |
| `core/src/gozetimsiz.ts` | `e6c691706b36a2c81054db6685cb64d9e79a993376a75f091d5dca6ebc2d8eb6` | 14532 |

## Üretilen kanıt dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/test/fixtures/dc-usage-bound-fixture.mjs` | `c587ad8483064146b9e0b1039e79426a14b8dc3d6dbf1b9aac226469af5d7d0a` | 1892 |
| `core/test/dc-usage-bound.test.ts` | `c4bf645adf0b263e7107a51873eef206e84625990352cd861a70774216825f59` | 1465 |

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-usage-bound.test.ts test/dc-boundary-positive.test.ts test/dc-boundary-negative.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `3 pass / 0 fail`

## Gözlemler

- **P1:** Bağımsız limit aşımı yeni etkiyi durdurdu; sağlayıcı çağrısı yapılmadı.
- **N1:** Eksik kullanım sıfır sayılmadı; `USAGE_UNKNOWN` yeni etkiyi blokladı.
- **N2:** Hazır kaynak/limit yoksa G0 açık kaldı; altyapı/yeniden tahmin gerekliliği korundu.

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
