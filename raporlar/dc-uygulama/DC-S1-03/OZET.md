# DC-S1-03 — Onaylı repo ve Git nesnesi bağı

**Kimlik:** DC-S1-03 · ATOM-H1-2026-10-28.2 · **2026-10-30T02:41:19.698+03:00**

## Teslim

- `core/test/dc-source-binding.test.ts`: tam sözleşme/bağ arayüzünden kaynak kimliğini çözer; ana HEAD ilerlese de onaylı Git nesnesini korur.
- Temp Git deposunda gerçek `git worktree add` ile onaylı nesneden worktree açılır; yanlış repo/nesne/algoritma/sözleşme bağında spawn 0.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-source-binding.test.ts test/local-runtime.test.ts test/git-worktree.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `13 pass / 0 fail`

## Gözlemler

- **P1:** Kaynak kimliği sözleşmedeki repo + nesne + algoritma alanlarından çözüldü; ana HEAD C2’ye ilerlese de açılan worktree HEAD C1’de kaldı.
- **N1:** Yanlış repo, bulunamayan nesne, bozuk algoritma ve kopuk sözleşme bağında çözüm RED, spawn karşılığı 0.
- **N2:** SHA-256 özeti ile Git nesne kimliği ayrı alanlar; biri diğerinin yerine geçmedi.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/git-worktree-launcher.ts` | `73d3db9958670679da83c058f22cf0726ec3242493575e9978d7422a1e9354a5` | 5647 |
| `core/src/providers.ts` | `42a1fb73de0575fe9055e35cc68ff9c882c8a8b468ff7adb18fc2110ba50b49e` | 9563 |
| `core/test/git-worktree.test.ts` | `2499ba797e85657a30af1c1a2ac05228523c7315fb00e4e8aea34a31dd3e33f0` | 8240 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/test/dc-source-binding.test.ts` | `73330a1d765203cf98f9f391a89299c82699160cf81671436c2b18bff9b706f3` | 6509 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
