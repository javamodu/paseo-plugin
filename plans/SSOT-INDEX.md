# SSOT-INDEX — ordu monorepo tek-doğru-kaynak haritası (F2-7)

Otorite: `kararlar/ADR-toparlanma-monorepo.md` (S6) · Bu dosya birleşim sonrası hangi dosyanın hangi katmanda TEK yetkili olduğunu listeler. İkinci kopya = ihlal (saglik.ps1 katman kapıları bunları varlık-yokluğu ile denetler).

| Katman | Tek doğru kaynak | Not |
|---|---|---|
| L0 kurallar | `AGENTS.md` | her zaman yüklü |
| Üst otorite | `ANAYASA.md` | ajan değiştiremez |
| Evrensel sözleşme | `sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md` | v2.0 → `arsiv/` (tarih damgalı) |
| L1 durum | `STATE_BOARD.md` | task-graph evinin özgün damgası birleşim satırı olarak içeride |
| L2 indeks | `CODEMAP.md` | otomatik üretilir (`scripts/codemap.ps1`; K-0037 klasör-topaklama) |
| L3 raporlar | `raporlar/` | append-only, OZET.md + JSON yan dosya |
| L4 kararlar | `kararlar/` | K-XXXX + ADR'ler (plans/ADR-* buraya taşındı) |
| L5 dersler | `DERSLER.md` | birleşim: ordu + task-graph 2026-10-16'ya kadar; kesişim → `raporlar/ssot-birlesimi-2026-10-25/` |
| Hedef | `plans/HEDEF.md` | task-graph HEDEF.md işaretçiydi → `arsiv/SSOT-eski-2026-10-25/` |
| Plan | `PASEO-VERIMLILIK-PLANI.md` | kök |
| Devir zinciri | `plans/handoff/` | append-only halkalar |

## Bileşen evleri

| Bileşen | Dizin | Kaynak ev (donduruldu, silme F4) |
|---|---|---|
| core | `core/` | silinecek-task-graph/ordu-core (bundle: `arsiv/history/ordu-core.bundle`) |
| plugin | `plugin/` | paseo-verimlilik (bundle: `arsiv/history/paseo-verimlilik.bundle` — kilit tag'lerin evi; drift bekçisi buradan okur) |
| pano | `pano/` | paseo-pano (mockup; history F4 öncesi bundle önerisi ADR'de) |
| referans | `referans/` | kapsul-final-v2.0.0 notio + ordu-v3 (salt-okur) |
| arşiv | `arsiv/` | history bundle'ları + eski SSOT kopyaları (2026-10-25) + rehber v2.0 |

## Eski SSOT kopyaları (y ASLA — yalnız arsiv/)

`arsiv/SSOT-eski-2026-10-25/` — task-graph evinin STATE/DERSLER/AGENTS/HEDEF kopyaları + MASTER-SSOT-PLAN (3 anahtar REDACTED: B16/B18/B19).
