# DC-S1-02 — Kalıcı sözleşme bağı ve eski kayıt uyumluluğu

**Kimlik:** DC-S1-02 · ATOM-H1-2026-10-28.2 · **2026-10-30T02:36:51.854+03:00**

## Teslim

- `core/src/dc-contract-binding.ts`: tam sözleşme kimliğini onay, mevcut R6 defter kaydı ve TASLAK ADR §4 seçimiyle bağlar; legacy v1 kaydı yeniden hashlemeden okur.
- `core/test/dc-contract-compat.test.ts`: yeni bağ, tarihsel okuma, hash taşınmaz kuralı ve göç yok politikasını doğrular.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-contract-compat.test.ts test/store.test.ts test/supervisor.test.ts test/sync-baseline.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `36 pass / 0 fail`

## Gözlemler

- **P1:** Yeni onay `dcf1` sözleşme kimliğine, `APPROVE_PLAN`/`PLAN_APPROVED` R6 defter seçimine ve ADR bağına bağlandı; legacy kayıt kendi sürüm anlamıyla değişmeden okundu.
- **N1:** Eski plan/evaluator/policy/source hash’leri yeni sözleşme kimliğine taşınmadı; legacy kayda `contractId` ekleme reddedildi.
- **N2:** Göç politikası `none`; göç çağrısı yeni paket revizyonu isteyerek RED. Mevcut dosyalara göç yazılmadı, ikinci DB oluşturulmadı.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/database/004-grants.sql` | `70db559a17ad73b5d6a578386ce7a4354d2f738f65fe3456b24ab8c7af2bd77c` | 3616 |
| `core/src/contracts/event-payloads.ts` | `fcf9457eea9d8fe75ebc93ad3b83035d841c8b8407aecf873984cb65706f969a` | 4366 |
| `core/src/contracts/command-payloads.ts` | `6068490ea5d6b6f4be9a84abeb2a3b27a656ab454079df5f5729d5831ab2dcfa` | 2899 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/dc-contract-binding.ts` | `bf67e825a6ffe0cabc48409a94c5fed3e503df0b2417060aad0293aba264f170` | 7570 |
| `core/test/dc-contract-compat.test.ts` | `9fdd86d9d3dc2ba95c66f4de04924771befe559b106700e467729a3f59746f7c` | 5093 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
