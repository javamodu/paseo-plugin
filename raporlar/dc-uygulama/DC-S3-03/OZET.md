# DC-S3-03 — İptal teyidi attempt, nesil ve istek bağı

**Kimlik:** DC-S3-03 · ATOM-H1-2026-10-28.2 · **2026-10-30T06:55:32.264+03:00**

## Teslim

- `core/test/dc-cancel-generation.test.ts`: iki attempt, iki iptal isteği ve ayrı ölüm kanıtlarını sınar.
- Her attempt kendi `CANCEL_CONFIRMED` olayı, kendi ölüm kanıtı ve kendi rezervasyonuyla kapanır.
- Tek attempt’in teyidi diğer attempt’in açık iptalini kapatmaz.
- Ölüm doğrulanamadığında slot ve rezervasyon serbest bırakılmaz.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-cancel-generation.test.ts test/k13-gozetimsiz.test.ts test/local-runtime.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `14 pass / 0 fail`

## Gözlemler

- **P1:** Her güncel iptal isteği kendi attempt kimliği ve ölüm kanıtıyla kapanır.
- **N1:** İki attempt’te tek teyit ikinciyi örtmez; açık iptal kalır.
- **N2:** Ölüm doğrulanamıyorsa slot/rezerv hayali şekilde bırakılmaz.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/grants.ts` | `fa70a1dd2bab7e7e174ddc4444e729ec94d8b422a791cdb0aed8145552eb5791` | 16428 |
| `core/src/supervisor.ts` | `ae73fc2364eb210719d02b3a4fc2806eae3e06e334689b692c725ac0ca9a0ad4` | 38978 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/test/dc-cancel-generation.test.ts` | `71ebc91a0daca98a7ce49c47b2f7771d73eb28eff6427573ed32c56f373c3d6e` | 6646 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
