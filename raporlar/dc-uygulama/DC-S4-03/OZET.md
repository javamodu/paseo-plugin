# DC-S4-03 — Pilot C: eski veriyle bakım/düzeltme

**Kimlik:** DC-S4-03 · ATOM-H1-2026-10-28.2 · **2026-10-30T13:26:48.051+03:00**

## Teslim

- `core/test/dc-pilot-c.test.ts`: eski veri kopyası, bakım/düzeltme yolu ve salt-okunur bacağı sınar.
- Pilot işçi: `src/task-cli.mjs`; oracle: `acceptance-a.test.mjs` + `acceptance-b.test.mjs` + `acceptance-c.test.mjs`.
- Eski veri örneği ayrı sabit kökte tutulur; tamir çıktısı ayrı dosyaya yazılır.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-pilot-a.test.ts test/dc-pilot-b.test.ts test/dc-pilot-c.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `9 pass / 0 fail`

## Gözlemler

- **P1:** Önceden alınmış eski veriyle yeni sürüm çalışır; gerçek düzeltme gözlenir.
- **N1:** Eski veri adaya göre değiştirilmez; A/B regresyonu veya yeni hata gizlenmez.
- **N2:** Üç teslim bağımsız genel güvenilirlik örneklemi sayılmaz.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `plans/PLAN.md` | `271a76f35ef65d4e62d7c6ea5dfa065774aa4bd662f710660a8c3b1adc013b84` | 95704 |
| `core/src/evaluator.ts` | `8daecda19e6f38a94d1272434cd0e437dd1d48ca7fbee312ec1a7ad771fe7db8` | 3866 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/test/dc-pilot-c.test.ts` | `958edf74363d7868a7729ec2e1a3b4ea03d4548f46137e6a94e7e1e9c8da1cce` | 8453 |

## Pilot/oracle/eski-veri kayıtları

| Kayıt | Yol / Kimlik | SHA-256 |
|---|---|---|
| A pilot kökü | `C:\Users\gatep\AppData\Local\Temp\dc-pilot-a-EGVSwQ` | — |
| A oracle kökü | `C:\Users\gatep\AppData\Local\Temp\dc-pilot-a-oracle-ws2DMv` | — |
| B pilot kökü | `C:\Users\gatep\AppData\Local\Temp\dc-pilot-b-QIexIe` | — |
| B oracle kökü | `C:\Users\gatep\AppData\Local\Temp\dc-pilot-b-oracle-zBfohu` | — |
| C pilot kökü | `C:\Users\gatep\AppData\Local\Temp\dc-pilot-c-gx2mL4` | — |
| C oracle kökü | `C:\Users\gatep\AppData\Local\Temp\dc-pilot-c-oracle-DBYvUE` | — |
| Eski veri kökü | `C:\Users\gatep\AppData\Local\Temp\dc-pilot-c-old-vQnPRv` | — |
| A oracle dondurma | `acceptance-a.test.mjs` | `4b45eddadaf91e203ffebdd169cf7704f9aa9f488cc94535d5a114e5da94f636` |
| B A oracle dondurma | `acceptance-a.test.mjs` | `f0a336817654ac94203298fb38d32427313e20a41362de6997b9d8c448d3e669` |
| B B oracle dondurma | `acceptance-b.test.mjs` | `be76a9ff504059288ee9f210de05962d1cdea2e7834044c2f3f3726e07507760` |
| C oracle dondurma | `acceptance-c.test.mjs` | `ac4db2d9e87da60b7b15960f0d88048419b45382a316d1d691708d429764b18c` |
| A pilot package | `package.json` | `acfb1c2c04b8ac78d90954a64e641fce0b46965fc4a330ee579f1d3a19d1d4c3` |
| A pilot CLI | `src/task-cli.mjs` | `821750e017c095a94f50293dbf92a3c7421099c5410457e86f22fa742258b542` |
| B pilot package | `package.json` | `6daf529d19535cd80fa284e0a1c5e9f4530a31fbedcc99c9bfb5e266c05bc101` |
| B pilot CLI | `src/task-cli.mjs` | `471a145413951cffef4db37e204c7147c67ea514f6751d8d822d4621def5f78a` |
| C pilot package | `package.json` | `125c4cda3fb5ee01cfc8ec5e950bd601c3c021c491534aeffe2ef80800407cad` |
| C pilot CLI | `src/task-cli.mjs` | `c42c45e05d19f828d53ca7ebcf9a7896a7c3e02ce4ed3163e41a8e2e4fcba0d8` |
| Eski veri | `tasks-old.json` | `5696fc99866ae454b351ccbe376aed16ed05a7088cace5d6277ebca5d507afae` |
| Bakım çıktısı | `tasks-fixed.json` | `d05eeba0b229214ee2d1543f0cdc0ef9f8137d29cf283042ae16f860a0b74417` |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
