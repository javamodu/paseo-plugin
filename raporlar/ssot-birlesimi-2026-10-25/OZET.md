# SSOT Birleşimi (F2-6) — 2026-10-25

Otorite: `kararlar/ADR-toparlanma-monorepo.md` S6 haritası + `plans/handoff/HANDOFF-2026-10-25-1640.md` F2-6 maddesi. Kaynak ev: `D:\Vibecode\silinecek-task-graph` (donduruldu; silme F4).

## Yapılanlar

| Hedef | Karar (S6) | Uygulama |
|---|---|---|
| STATE_BOARD | ordu'nunki kazanır | task-graph evinin özgün damgası (GLM 5.3 sarmalayıcı benchmark kapanışı) özet satırı olarak eklendi |
| DERSLER | birleşim; çakışmada ordu kazanır | 8 özgün madde eklendi; 4 çakışan hariç (aşağıda); 2 madde tarih penceresi dışı (aşağıda) |
| HEDEF | plans/HEDEF.md yetkili | task-graph HEDEF.md 1 satırlık işaretçi → arşiv (atıfta eski yol, append-only düzeltilmez) |
| rehber | sozlesme/ v2.1 tek yetkili | v2.1 → `sozlesme/` (139 satır ≤ 150); v2.0 → `arsiv/` |
| ADR'ler | plans/ADR-* → kararlar/ | 3 dosya taşındı (toparlanma-monorepo, F65-rol-model, R3-vekalet) |
| eski SSOT kopyaları | arsiv/ tarih damgalı | `arsiv/SSOT-eski-2026-10-25/` (5 dosya) |
| MASTER-SSOT-PLAN | B16: sanitize'siz GİRMEZ | 3 anahtar REDACTED: nvapi (B16), gsk (B18), thk_live (B19) — kalıntı taraması 0 (R) |
| yol atıfları | mekanik güncelleme | AGENTS/ANAYASA(2)/admin-onboarding/FERMANLAR/README + `scripts/saglik.ps1:75` → sozlesme/v2.1 |

## DERSLER kesişim listesi (ordu kazandı, task-graph kopyası arşivde)

1. `file://` tarayıcı reddi ↔ ordu 2026-10-12 "Paseo browser file:// açmaz" (aynı ders).
2. inline `node -e` çift tırnak ↔ ordu 2026-10-14/17/18 node -e tırnak dersleri (aynı sınıf).
3. Edit oldString tahmini ↔ ordu 2026-10-17/18 Edit oldString dersleri (aynı sınıf).
4. aynı ölçüm koşusunu tekrar etmek ↔ ordu 2026-10-19 "ikinci başarısız denemeden sonra dur" (aynı sınıf).

## Hariç tutulanlar (pencere: 2026-10-16'ya kadar — handoff F2-6 maddesi)

- 2026-10-25 Codex `--approve-for-me` + `--sandbox` çakışması; 2026-10-25 Windows süreç ağacı `taskkill /T /F` — tam metin `arsiv/SSOT-eski-2026-10-25/DERSLER.md`'de korunuyor (append-only, erişilebilir).

## Kanıt

- S2 tarama `arsiv/SSOT-eski-2026-10-25/` → 0 hit (R). Anahtar kalıntıdeseni (nvapi-/gsk/thk_live gövdeleri) → 0 (R).
- Gelen-kutu: B18 + B19 açıldı; B2/B15/B16 islenme aldı (commit = F2-6 commit'i).
- Bekleyen insan onayı: F4 (kaynak silme) anahtarların env'e taşınması için pencere.
