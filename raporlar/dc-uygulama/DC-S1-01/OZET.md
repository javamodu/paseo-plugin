# DC-S1-01 — Sürümlü tam iş sözleşmesi

**Kimlik:** DC-S1-01 · ATOM-H1-2026-10-28.2 · **2026-10-30T02:29:36.928+03:00**

## Teslim

- `core/src/dc-full-contract.ts`: sürüm, hedef, kaynak, izin, eski plan, evaluator, politika, bütçe, süre, çözülmüş model ve suite alanlarını tek kapalı sözleşmede normalleştirir; kimlik `dcf1:<sha256>` üretir.
- `core/test/dc-full-contract.test.ts`: alan değişimlerinin kimlik/onay eşleşmesini bozduğunu, eski `planHash` genişlemesini ve R6 kümesini doğrular.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-full-contract.test.ts test/sync-baseline.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `9 pass / 0 fail`

## Gözlemler

- **P1:** Aynı normalize sözleşme aynı kimliği verdi; kaynak nesnesi, çözülmüş provider/model ve suite kimliği sözleşmeye bağlı.
- **N1:** Hedef, kaynak, izin, evaluator, politika, bütçe, süre, model, suite ve plan alanlarının her biri tek tek değişince kimlik/onay eşleşmesi bozuldu.
- **N2:** Eski `planHash` yalnız doğrulandı, tam sözleşme kimliğine sessizce genişletilmedi; R6 Command/Event kümeleri baseline ile aynı kaldı.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/supervisor.ts` | `ae73fc2364eb210719d02b3a4fc2806eae3e06e334689b692c725ac0ca9a0ad4` | 38978 |
| `core/src/contracts/validate.ts` | `5e8b11532f632eff42c13918aadf5dd9d44dde5dc2e68622dee7978563c178b2` | 2932 |
| `core/test/sync-baseline.test.ts` | `15fa20fee449a122d2b10e39ea56461aee1f8b0fcb1d5a7f8aba9e7a0a69c2b4` | 2729 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/dc-full-contract.ts` | `e7dd0f08ed81909466ab82af96ecc0de2731105d014acb1c1154aebe614a6f5e` | 9043 |
| `core/test/dc-full-contract.test.ts` | `87af7e6a159110f512b3919a1b35a865c65be45666da1b456a04f9662df1a7f6` | 5889 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
