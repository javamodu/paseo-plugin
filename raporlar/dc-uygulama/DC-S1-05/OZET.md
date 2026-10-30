# DC-S1-05 — CLI operatör kimliği ve tam sözleşme girişi

**Kimlik:** DC-S1-05 · ATOM-H1-2026-10-28.2 · **2026-10-30T06:14:28.109+03:00**

## Teslim

- `core/src/dc-operator-boundary.ts`: Ed25519 imzalı, sürümlü operatör yetkisi üretir ve doğrular.
- Yetki; tam sözleşme kimliği, kaynak kimliği, kapalı CLI yüzeyi (`capsule`, `approve`, `dispatch`, `decide`, `resume`, `grant`) ve süre ile bağlanır.
- `core/test/dc-operator-boundary.test.ts`: yetkili operatör, insan etiketi taklidi ve kapsam/kaynak değişimi senaryolarını temp defterle doğrular.
- Mevcut CLI dosyaları release sonrası yazma adayıdır; bu fiş yeni sınır modülünü ve testini üretir, mevcut üretim yüzeyine kablolama yapmaz.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-operator-boundary.test.ts test/cli-capsule.test.ts test/r3-grant.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `32 pass / 0 fail`

## Gözlemler

- **P1:** Yetkili operatör, doğru sözleşme ve kaynakla kapalı CLI yüzeyinin altı eylemini aynı sınır üzerinden kullanır; temp deftere `ALLOW` kaydı düşer.
- **N1:** İşçi anahtarıyla `insan:cli` etiketi taklidi `approve`, `resume` ve `grant` için reddedilir; actor/environment metni istek şemasına alınmaz.
- **N2:** Yetki kapsamı dışındaki eylem ve değişen kaynak/sözleşme eski yetkiyle kullanılamaz; her iki red temp deftere kaydedilir.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/grants.ts` | `fa70a1dd2bab7e7e174ddc4444e729ec94d8b422a791cdb0aed8145552eb5791` | 16428 |
| `core/src/pano-server.ts` | `e19f75fe444b636ff76202979da815bdd03ad1f3655324d27d449df1ec588328` | 9491 |
| `core/test/cli-capsule.test.ts` | `1d67b605a8afd3270dabea6e769c3ea65ff47944402cb66eb8d1dfd01071ead0` | 6292 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/dc-operator-boundary.ts` | `3b57600d738e043e4db5735e63c5c1f6387c76c44db2b7baef3806ad6a3d1bd6` | 10794 |
| `core/test/dc-operator-boundary.test.ts` | `76645fe281e2eb19606968bdbaed33c02297da29e1beb8410499b5239be8b717` | 7689 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
