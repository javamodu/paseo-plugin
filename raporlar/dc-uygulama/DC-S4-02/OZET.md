# DC-S4-02 — Pilot B: tamamlama, filtre ve doğru toplam

**Kimlik:** DC-S4-02 · ATOM-H1-2026-10-28.2 · **2026-10-30T13:22:18.389+03:00** · Revizyon: **2026-10-30T13:31:01.996+03:00**

## Teslim

- `core/test/dc-pilot-b.test.ts`: A davranışını koruyarak tamamlama, filtreleme ve toplam senaryolarını sınar.
- Pilot işçi: `src/task-cli.mjs`; oracle: `acceptance-a.test.mjs` + `acceptance-b.test.mjs`.
- A insan teslim kaydı ve aynı oracle sürümü fiş içinde simülasyon sınıfında çözülür; gerçek insan kabul H1 insan kapısıdır.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-pilot-a.test.ts test/dc-pilot-b.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `7 pass / 0 fail`

## Gözlemler

- **P1:** İnsan görevi tamamlar, duruma göre filtreler; toplamlar doğru olur.
- **N1:** Yinelenen tamamlama sayıları bozmaz; A'nın verisi/işlevleri gerilemez.
- **N2:** A insan teslim kaydı ve aynı oracle sürümü olmadan B kapanışı yok; yanlış oracle sürümü RED döner.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `plans/PLAN.md` | `271a76f35ef65d4e62d7c6ea5dfa065774aa4bd662f710660a8c3b1adc013b84` | 95704 |
| `core/src/cli.ts` | `6721c75795ee9a7e61c01ac39bf34ad4d55a26b3e1993bc549f367f6293c24a6` | 30437 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/test/dc-pilot-b.test.ts` | `482817efb38b65fb6dbf304bb4c69e1b9f7bfc3b5f082933394a4aa9f02df0c0` | 11176 |

## Pilot/oracle kayıtları

| Kayıt | Yol / Kimlik | SHA-256 |
|---|---|---|
| A pilot kökü | `C:\Users\gatep\AppData\Local\Temp\dc-pilot-a-qCAmJ1` | — |
| A protected oracle kökü | `C:\Users\gatep\AppData\Local\Temp\dc-pilot-a-oracle-IrRMHr` | — |
| B pilot kökü | `C:\Users\gatep\AppData\Local\Temp\dc-pilot-b-QIHD8w` | — |
| B protected oracle kökü | `C:\Users\gatep\AppData\Local\Temp\dc-pilot-b-oracle-Q6qdSO` | — |
| A oracle dondurma | `acceptance-a.test.mjs` | `4b45eddadaf91e203ffebdd169cf7704f9aa9f488cc94535d5a114e5da94f636` |
| B A oracle dondurma | `acceptance-a.test.mjs` | `f0a336817654ac94203298fb38d32427313e20a41362de6997b9d8c448d3e669` |
| B B oracle dondurma | `acceptance-b.test.mjs` | `be76a9ff504059288ee9f210de05962d1cdea2e7834044c2f3f3726e07507760` |
| A pilot package | `package.json` | `acfb1c2c04b8ac78d90954a64e641fce0b46965fc4a330ee579f1d3a19d1d4c3` |
| A pilot CLI | `src/task-cli.mjs` | `821750e017c095a94f50293dbf92a3c7421099c5410457e86f22fa742258b542` |
| B pilot package | `package.json` | `6daf529d19535cd80fa284e0a1c5e9f4530a31fbedcc99c9bfb5e266c05bc101` |
| B pilot CLI | `src/task-cli.mjs` | `471a145413951cffef4db37e204c7147c67ea514f6751d8d822d4621def5f78a` |
| A kalıcı görev verisi | `tasks.json` | `2497c2cefd2a56166d0e81b39c387deb2bca2f56f4d5242e082836244732492d` |
| B kalıcı görev verisi | `tasks.json` | `d9622008a45fba11e477c98e995a6b315ec4e82b0995cea902a6b5230a57c958` |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
