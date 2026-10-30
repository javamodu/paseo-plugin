# DC-S1-04 — Pilot alternatif eklenti girişleri

**Kimlik:** DC-S1-04 · ATOM-H1-2026-10-28.2 · **2026-10-30T06:02:15.824+03:00**

**Düzeltme:** **2026-10-30T06:27:52.263+03:00** · TS2349/TS2345 giderildi; `tsc --noEmit` yeniden koşuldu.

## Teslim

- `plugin/test/dc-pilot-entry.test.ts`: mock Paseo ve kapsamlı temp repo ile pilot giriş sınırını doğrular.
- Dosya kuyruğu, manager/emir ve bayat kart yolları yetkisiz create üretmez; pilot dışı proje davranışı korunur.

## Test

- **Komut:** `node --import tsx test/dc-pilot-entry.test.ts`
- **cwd:** `plugin`
- **Sonuç:** `exit 0`, `5 pass / 0 fail`
- **Tip denetimi:** `npm.cmd run typecheck` → `tsc --noEmit`, `exit 0`

## Gözlemler

- **P1:** `repolariBul` pilot ve diğer projeyi gördü; diğer projenin plan derlemesi izinli tek yolla çalıştı.
- **N1:** Pilot dosya-kuyruğu, manager/emir ve bayat kart yollarından yetkisiz create sayısı 0.
- **N2:** İzin alanı eksikse default açık olmadı; plugin reload yapılmadı.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `plugin/server/planmd.ts` | `16349561d3572067815bdc601ea850ca44e9ac163fa026b0209909a9ffbb03af` | 8148 |
| `plugin/test/ordu.test.ts` | `59c00076aaa4309d51da9b38f0e637289d2ff77f60c64ba5be2c01426fcfde54` | 3035 |
| `plugin/package.json` | `fe4c6fddb2e1ce6281ed9ebd0a835cb250baa45deb77a1ae5ba85f63e104a7fd` | 957 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `plugin/test/dc-pilot-entry.test.ts` | `e06f6c5d71bd574efc30fc54079eeb20a1fd25d02826e03bd50c738ae74f399e` | 6565 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
