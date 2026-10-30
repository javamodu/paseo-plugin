# DC-S3-02 — Normal bitiş, çökme ve aday ayrımı

**Kimlik:** DC-S3-02 · ATOM-H1-2026-10-28.2 · **2026-10-30T06:51:53.833+03:00**

## Teslim

- `core/test/dc-completion-reconcile.test.ts`: normal bitiş, sessiz lease ve idempotent uzlaştırma senaryolarını temp defter + fake adaptörle sınar.
- Normal başarı yolu: aday donar, kanıt yazılır, node DONE olur ve onay kartı doğar; üretim onayı verilmez.
- Sessizlik yolu: lease süresi dolmuş olsa bile `UNKNOWN` kalır; otomatik `CANCEL_CONFIRMED` veya kapasite bırakma üretilmez.
- Tekrar-oynatma: aynı `UNKNOWN` sonucu ikinci uzlaştırmada yeni olay/spawn üretmez.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-completion-reconcile.test.ts test/closure.test.ts test/a0-2-sweep.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `25 pass / 0 fail`

## Gözlemler

- **P1:** Normal bitiş, hazır adayı `VERIFYING` ve `PENDING` onay kartına bırakır.
- **N1:** Lease/sessizlik tek başına `CANCEL_CONFIRMED` veya rezervasyon `RELEASED` üretmez.
- **N2:** Aynı UNKNOWN sonucu için ikinci uzlaştırma yeni kayıt veya spawn üretmez.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/test/closure.test.ts` | `4bb54386526f4ea789c70c545802b560476fa0200019eeedd37dda1898f9f0ed` | 7304 |
| `core/test/a0-2-sweep.test.ts` | `eacdfc868cf64059a879fe7390d199e8f74cdf63f946212a19c4ad5f641ef429` | 19577 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/test/dc-completion-reconcile.test.ts` | `60d32f2e4018b56d91883096d77fce449fea5ad2fa6fa9ddd956616472faba99` | 5680 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
