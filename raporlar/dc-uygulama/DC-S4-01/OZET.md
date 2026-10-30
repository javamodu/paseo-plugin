# DC-S4-01 — Pilot A: görev ekleme/listeleme ve kalıcılık

**Kimlik:** DC-S4-01 · ATOM-H1-2026-10-28.2 · **2026-10-30T12:46:57.701+03:00**

## Teslim

- `core/test/dc-pilot-a.test.ts`: izole pilot kökü ve korunan oracle kökünü kurar; gerçek süreçle ekleme/listeleme, Unicode, kalıcılık ve negatifleri sınar.
- Pilot işçi: `package.json` + `src/task-cli.mjs`; oracle: `acceptance-a.test.mjs`.
- Pilot kökü ve oracle kökü ayrı temp dizinlerdir; oracle adaydan önce dondurulur ve işçi erişemez.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-pilot-a.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `3 pass / 0 fail`

## Gözlemler

- **P1:** İnsan görev ekler/listeler; Unicode ve yeniden açılışta veri kalıcılığı çalışır.
- **N1:** Bozuk giriş reddedilir ve veri bozulmaz.
- **N2:** Pilot kökü/oracle/sağlayıcı izni yoksa dosya yaratılmaz; canlı çağrı yapılmaz.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `plans/PLAN.md` | `271a76f35ef65d4e62d7c6ea5dfa065774aa4bd662f710660a8c3b1adc013b84` | 95704 |
| `core/src/cli.ts` | `6721c75795ee9a7e61c01ac39bf34ad4d55a26b3e1993bc549f367f6293c24a6` | 30437 |
| `core/src/evaluator.ts` | `8daecda19e6f38a94d1272434cd0e437dd1d48ca7fbee312ec1a7ad771fe7db8` | 3866 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/test/dc-pilot-a.test.ts` | `b37841effe2c956f265d90ea232026c5d37f7eea21e7cb3c8afc6b94a448b21a` | 7412 |

## Pilot/oracle kayıtları

| Kayıt | Yol / Kimlik | SHA-256 |
|---|---|---|
| Pilot kökü | `C:\Users\gatep\AppData\Local\Temp\dc-pilot-a-GUybiJ` | — |
| Protected oracle kökü | `C:\Users\gatep\AppData\Local\Temp\dc-pilot-a-oracle-gP8V60` | — |
| Oracle dondurma | `acceptance-a.test.mjs` | `4b45eddadaf91e203ffebdd169cf7704f9aa9f488cc94535d5a114e5da94f636` |
| Pilot package | `package.json` | `acfb1c2c04b8ac78d90954a64e641fce0b46965fc4a330ee579f1d3a19d1d4c3` |
| Pilot CLI | `src/task-cli.mjs` | `821750e017c095a94f50293dbf92a3c7421099c5410457e86f22fa742258b542` |
| Kalıcı görev verisi | `tasks.json` | `6da152173e039c074ead2654cdbd109f4c8002cf84fcf22f031c6c381333dc34` |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
