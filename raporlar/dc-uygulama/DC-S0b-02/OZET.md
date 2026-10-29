# DC-S0b-02 — Korunan alan ve kaçış negatifleri

**Kimlik:** DC-S0b-02 · ATOM-H1-2026-10-28.2 · **2026-10-30T02:02:30.503+03:00**

## Sonuç önerisi

`windows-ntfs-deny-write-v1` mekanizması, izinli pilot-test alanı içinde DB/onay/suite/anahtar/üst-dizin/junction/alt-süreç/env/ağ kaçış denemelerini gerçek Windows ACL reddiyle kapatıyor. Pozitif kontrol aynı koşumda çalışıyor ve korunan dosyaların SHA-256 değerleri değişmiyor.

## Kaynak kanıtı

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/evaluator.ts` | `8daecda19e6f38a94d1272434cd0e437dd1d48ca7fbee312ec1a7ad771fe7db8` | 3866 |
| `core/src/receipt-link.ts` | `3477bc4c493e76d1696338cd40e9c01da800dca71fc3fc974a3c801fc13dbc4e` | 9990 |
| `core/test/k13-gozetimsiz-canli.test.ts` | `24bd26a7658d5bcd6f4c6e9680e487c8505f704b0fc475ed036f49d2b96e8fbd` | 9646 |

## Üretilen kanıt dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/test/fixtures/dc-boundary-protected.mjs` | `1f5257b10c605a58fb6d1bf1077a0284f89fd7e4fe18015b64c9ffeeab833cd4` | 4188 |
| `core/test/dc-boundary-negative.test.ts` | `0a566be8781324ea776d91b6f70b31cd1072f358d390a90abd05e643eeec63c2` | 2357 |

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-boundary-positive.test.ts test/dc-boundary-negative.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `2 pass / 0 fail`

## Gözlemler

- **P1:** Pozitif kontrol aynı koşumda çalıştı; korunan dosyaların hash’leri değişmedi.
- **N1:** DB/onay/suite/anahtar/üst-dizin/junction/alt-süreç/env/ağ kaçış denemeleri gerçek ACL reddiyle kapatıldı.
- **N2:** Sonuç yalnızca string/path kontrolüne dayanmıyor; gerçek Windows ACL davranışı ölçüldü.

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
