# DC-S2-02 — Korunan gerçek görev testi günlük yola bağlandı

**Kimlik:** DC-S2-02 · ATOM-H1-2026-10-28.2 · **2026-10-30T11:53:45.122+03:00** · Revizyon: **2026-10-30T12:14:11.416+03:00**

## Teslim

- `core/src/dc-protected-runner.ts`: mühürlü aday, suite/runner kimliği ve temiz Git durumu doğrulandıktan sonra gerçek runner sürecini çalıştırır.
- `core/test/dc-protected-runner.test.ts`: gerçek `node:test` süreciyle pozitif, sıfır-test, sahte stdout, yanlış görev sonucu, bayat suite ve bayat runner kimliği senaryolarını sınar.
- Test süreci imzalayıcı yetkisini miras almaz; `ORDU_TEST_SIGNER` ve benzeri anahtarlar ortamdan temizlenir.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-protected-runner.test.ts test/adapter-evaluator.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `12 pass / 0 fail`

## Gözlemler

- **P1:** Doğru küçük kod işi gerçek korunan görev testleriyle geçer.
- **N1:** Sıfır test, sahte stdout, değiştirilmiş suite/runner ve yanlış görev sonucu RED döner.
- **N2:** Başlangıçta bayat kimlik varsa runner çağrı sayısı 0’dır; test süreci imzalayıcı yetkisini miras almaz.
- **N2 revizyonu:** Runner kimliği değiştiğinde runner çağrılmaz ve kabul RED döner.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/receipt-link.ts` | `3477bc4c493e76d1696338cd40e9c01da800dca71fc3fc974a3c801fc13dbc4e` | 9990 |
| `core/test/evaluator-canli.test.ts` | `355c6adc51b1008c8e2b87c8524df0ae5ea60582e1ee6ec472d92fed31b19628` | 9592 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/dc-protected-runner.ts` | `c6bb7c487cab951a07f984a12448f6b065db5237d510aa2242d31bc6cdcd9b0a` | 6544 |
| `core/test/dc-protected-runner.test.ts` | `2ed32faaf713a7a18f73bfc7a71045a63f32a89623651f250b24c3308756bd72` | 6409 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
