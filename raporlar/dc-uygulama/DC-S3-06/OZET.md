# DC-S3-06 — STOP/probe altında bakım ve restart mandalı

**Kimlik:** DC-S3-06 · ATOM-H1-2026-10-28.2 · **2026-10-30T07:28:08.899+03:00**

## Teslim

- `core/test/dc-stop-maintenance.test.ts`: global STOP altında `reconcileUnknown` ve `pollSentSessions` bakım yollarının sürdüğünü, yeni spawn olmadığını ve restart sonrası mandanın korunduğunu sınar.
- İnsan onay kartı ve kırmızı probe bakım teyidini engellemez; kırmızı probe altında bakım-okuma ve teyit yolu tamamlanır.
- Belirsiz çalışan sahiplik `UNKNOWN` kalır; hayali serbest bırakma üretilmez.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-stop-maintenance.test.ts test/daemon.test.ts test/closure.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `18 pass / 0 fail`

## Gözlemler

- **P1:** STOP altında teyit/uzlaştırma sürer, yeni spawn olmaz; restart aynı durumu korur.
- **N1:** Kart açmak yazma duruşu sayılmaz; kırmızı probe bakım teyidini engellemez.
- **N2:** Belirsiz çalışan sahiplik devri hayali serbest bırakılmaz.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/dispatcher.ts` | `f74e63ab8643c624d9d45b78c25af805e25fc7af3dc80b8a8bd77d5f613744f7` | 15876 |
| `core/test/daemon.test.ts` | `45c9463357930f4caa587e42023576b49f8d6cc05e9e511a381b4aa41bd4d624` | 6353 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/test/dc-stop-maintenance.test.ts` | `860112cbfa3ce6f976d007fbaffef1169e44c8a59ccebf9a1eb3e6adf887cc4e` | 7672 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
