# DC-S3-01 — Kalıcı süreç ağacı ve sahiplik kimliği

**Kimlik:** DC-S3-01 · ATOM-H1-2026-10-28.2 · **2026-10-30T06:43:39.450+03:00**

## Teslim

- `core/src/dc-process-identity.ts`: PID + başlangıç zamanı + boot kimliği ile süreç kimliği tanımlar.
- Süreç ağacı, attempt/sahiplik nesli ve ownership key kalıcı JSONL registry’ye yazılır; restart sonrası diskten okunur.
- `core/test/dc-process-identity.test.ts`: restart, PID yeniden kullanımı ve ölü ebeveyn/bozuk kayıt senaryolarını temp registry ile sınar.
- Gerçek süreç öldürme yok; yalnız kayıt ve snapshot doğrulaması yapılır.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-process-identity.test.ts test/a0-5-lrt.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `15 pass / 0 fail`

## Gözlemler

- **P1:** Restart, aynı attempt/sahiplik nesline bağlı ağacı diskten bulur ve kök hedefini çözümler.
- **N1:** PID yeniden kullanıldığında kimlik eşleşmez; kill hedefi `null` kalır, başka süreç seçilmez.
- **N2:** Ölü ebeveyn veya bozuk kayıt ölüm teyidi üretmez; sonuç `UNKNOWN` kalır.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/test/a0-5-lrt.test.ts` | `84a87dde56b57eaee924d5a308648ba53804b94348bf15d99f5df2bff8378927` | 24552 |
| `core/src/store.ts` | `e46ed62f7cfade8bc5197b9d20681ebc5bbfe75c74540c83ede9afbb62da9f05` | 13415 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/dc-process-identity.ts` | `ca3ce2234761fe1dadf5b5a09d56230ffb7a9105c23ef82f6745bc92403e2ede` | 9156 |
| `core/test/dc-process-identity.test.ts` | `071c1c439cbb82bd92fb17b0b67c12e386282a2831e1b8dd7ed43e2c4f82d658` | 4382 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
