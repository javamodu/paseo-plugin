# DC-S3-05 — Kuyrukta dış etki öncesi güncel yetki sınaması

**Kimlik:** DC-S3-05 · ATOM-H1-2026-10-28.2 · **2026-10-30T07:21:17.521+03:00**

## Teslim

- `core/test/dc-before-effect.test.ts`: gerçek `processOutbox` akışına eklenen sahte adapter önünde STOP, run latch, sözleşme, fence, grant, deadline ve bütçe denetimlerini sınar.
- Geçerli kuyruk işi güvenlik zincirinden tam olarak bir kez gönderilir.
- Global STOP, run latch, dolu deadline, revoke grant, bayat fence ve bayat sözleşme yollarında dış spawn sayısı sıfırdır.
- Kontrol-etki yarışı `orphan-unknown` ile kapanır; dış etki inkâr edilmez, sahte güvence üretilmez.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-before-effect.test.ts test/dispatcher.test.ts test/k12-deadline-r8.test.ts test/r3-grant.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `47 pass / 0 fail`

## Gözlemler

- **P1:** Geçerli iş aynı güvenlik zincirinden bir kez gönderilir.
- **N1:** Süresi dolmuş/revoke grant, deadline, bayat fence/sözleşme ve STOP yollarında spawn sayısı 0’dır.
- **N2:** Kontrol-etki yarışı açık `UNKNOWN` semantiğiyle kapanır; sahte güvence yok.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/deadline.ts` | `c7b14f43cfb7d91084aff1e2cce2315b7b713624fdd7cfb11aa6ce9686d6883b` | 4350 |
| `core/src/grants.ts` | `fa70a1dd2bab7e7e174ddc4444e729ec94d8b422a791cdb0aed8145552eb5791` | 16428 |
| `core/src/r8.ts` | `91bc2c2ee9b2ec1cae12f4845ec56364e7b7a3695b8282951d054f8784f549cb` | 3462 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/test/dc-before-effect.test.ts` | `078b0e23f585dcbb017a14824189d8811417e857128788ea5acade236475d51d` | 10020 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
