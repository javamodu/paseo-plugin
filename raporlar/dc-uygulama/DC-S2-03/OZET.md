# DC-S2-03 — Zorunlu imza + run/attempt tam kanıt bağı

**Kimlik:** DC-S2-03 · ATOM-H1-2026-10-28.2 · **2026-10-30T11:59:16.447+03:00**

## Teslim

- `core/test/dc-receipt-auth.test.ts`: test-local yetkili üretici doğrulayıcısı ile imza, callback ve tüm run/attempt bağlarını sınar.
- Makbuz kabulü, ayrılmış fixture HMAC anahtarı üzerinden doğrulanır; üretim sırrı veya genel PKI ürünü kullanılmaz.
- `receipt-link.ts` değiştirilmez; yetkisiz/eksik imza senaryoları fail-closed sarmalayıcıyla RED doğrulanır.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-receipt-auth.test.ts test/receipt-link.test.ts test/store.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `31 pass / 0 fail`

## Gözlemler

- **P1:** Doğru imzalı ve evaluator/ortam/suite/fence/süre/run/attempt bağları eş makbuz kabul edilebilir.
- **N1:** Eksik/revoke imza, callback yokluğu ve yanlış evaluator/ortam/suite/fence/süre RED döner.
- **N2:** Aynı içerik başka run/attempt için PASS kanıtı olarak kullanılamaz.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/grants.ts` | `fa70a1dd2bab7e7e174ddc4444e729ec94d8b422a791cdb0aed8145552eb5791` | 16428 |
| `core/test/receipt-link.test.ts` | `49781989e1633f4b8518d8da5b9415210eb63478b6342902fec552c797cd1ad2` | 6696 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/test/dc-receipt-auth.test.ts` | `440e1f5c0641d7c603200db7fb0cbccbfd173e02889b93945afb45bc0d26e21f` | 7936 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
