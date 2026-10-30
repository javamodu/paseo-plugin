# DC-S4-04 — On hata ailesi ve H1 kabul paketi taslağı

**Kimlik:** DC-S4-04 · ATOM-H1-2026-10-28.2 · **2026-10-30T13:37:07.847+03:00**

## Teslim

- `core/test/dc-h1-fault-matrix.test.ts`: on hata ailesini enjeksiyon/dedektör çiftiyle sınar; ajan denemesinde H1/H2/merge/deploy kapısının gerçek RED dönüşünü doğrular.
- `core/test/fixtures/dc-h1-faults.mjs`: yanlış çıktı, sıfır test, işçi ölümü, yönetici ölümü, çift gönderim, STOP/restart, teyitsiz iptal, eski sahip, yanlış kaynak ve kullanım uyumsuzluğu ailelerini tanımlar; `createHumanAuthorityGate` ile insan yetki kapısını uygular.
- H1 kabul paketi bu raporda **taslak** olarak listelenir; insan kararı üretilmez.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-h1-fault-matrix.test.ts test/dc-pilot-a.test.ts test/dc-pilot-b.test.ts test/dc-pilot-c.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `22 pass / 0 fail`

## Gözlemler

- **P1:** On hata ailesi ayrı benzersiz kayıtlarla enjekte edilir ve dedektör her aileyi yakalar.
- **P2:** Hata matrisi ile A/B/C pilot süitleri aynı hedefli komutta birlikte geçer; insan akışları fiş içi simülasyon olarak sınanır.
- **N1:** Kanıt, son yeşil tekrarın seçimi değil; 22 vakanın tamamı aynı ölçülen koşumdan gelir.
- **N2:** Ajan benzeri aktör H1 kararı, H2 başlatması, merge ve deploy yollarını denediğinde kapı RED döner; karar kaydı ve makbuz üretilmez.

## H1 kabul paketi taslağı (insan kapısı)

1. Pilot A/B/C kanıt çiftleri ve oracle dondurma kayıtları.
2. Bu fişin on hata ailesi matrisi ve 22/22 hedefli koşum çıktısı.
3. Tüketim/UNKNOWN mutabakatının açık bacakları ve eksik kalan kapılar.
4. `LIVE_SPEND`, `ROLLBACK_DEMO`, merge ve deploy için ayrı insan onayı.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `plans/PLAN.md` | `271a76f35ef65d4e62d7c6ea5dfa065774aa4bd662f710660a8c3b1adc013b84` | 95704 |
| `core/src/backup.ts` | `ef34a2a73c5f1b4e1061f55d40be963447bb57a4888ca4d612dd00990c1823bc` | 1410 |
| `core/src/telemetry.ts` | `1ba4dfacd75cb907ceda6e3ae36b23db682c90e5791dc0050edbfbfe5894773d` | 6817 |
| `scripts/test-kanal.ps1` | `c13079ace145125c91e8ea194f8514d18a9ea4e880b4886afb313b6392c5286f` | 2205 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/test/dc-h1-fault-matrix.test.ts` | `6a6f25f0f2e0f3767d7a909182e55d488d0b5109dff3e0051baca55525156886` | 970 |
| `core/test/fixtures/dc-h1-faults.mjs` | `5d63155e76cb88a35cc4d0916a4fa07784a98b4f7817c226f7d9077cf1171939` | 2331 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
