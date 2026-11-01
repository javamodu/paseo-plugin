# C: DİYETİ — JUNCTION TAŞIMALARI (2026-11-01)

**Kimlik:** C-DIYET-1. **Kaynak:** kullanıcı onayı **«onaylıyorum»** (2026-11-01 ~05:40; sunum: 05:37 watcher verisi — haftalık bakım ilk koşumu **+0,07 GB** ↔ junction paketi **~3,3 GB**; önerim junction'dı). Paketin kökü: pre-damga ölçümü `.claude` 2,24 GB + `.paseo` 1,08 GB (oturum transkripti, 660. satır).

## İcra — güvenli dans (her hedef için)

robocopy kopya → **dosya-sayısı/bayt doğrulama** (eşitsizse DUR) → **rename-kilit-testi** (kilitliyse dokunma) → `mklink /J` → junction doğrulama → eski kaynağı sil. C: kullanımı hiçbir adımda artmadı (kopya D:'ye).

| Hedef (kaynak) | Boyut | Sonuç |
|---|---|---|
| .claude\projects\d--Vibecode-YapaySite-archive-yapaysite | 0,292 GB | OK · junction · eski silindi |
| .claude\projects\D--Vibecode-txt-to-cad | 0,239 GB | OK · junction · eski silindi |
| .claude\projects\D--Vibecode-chromex-extension | 0,222 GB | OK · junction · eski silindi |
| .claude\projects\d--Vibecode-YapaySite-archive | 0,113 GB | OK · junction · eski silindi |
| .claude\projects\d--Vibecode-txt-to-cad--repolar-text-to-cad | 0,083 GB | OK · junction · eski silindi |
| .claude\projects\d--Vibecode-proje | 0,075 GB | OK · junction · eski silindi |
| .claude\file-history | 0,134 GB | OK · junction · eski silindi |
| .paseo\models | 0,961 GB | OK · junction · eski silindi |
| .paseo\worktrees | 0,068 GB | OK · junction · eski silindi |

**Toplam taşındı: 2,187 GB.** Junction hedef evi: `D:\c-tasinan\{claude-projects, claude, paseo}`.

## Ölçümler (damga 05:59)

- **C: boş 21,04 → 23,18 GB** (+2,14 net; ~%9,0 → ~%9,9 — ALARM kenarından çıkıyor, %10 hâlâ yakında)
- **D: boş 53,5 → 51,31 GB** (53,5 ölçümü 05:44 civarı)
- Junction doğrulama: `LinkType=Junction` + hedef yolları birebir + her dizinden ilk öge listelendi (4 nokta bağımsız `Get-Item` teyidi)

## Canlı kalan — pencere bekler (~0,83 GB daha)

Son-yazma bugün olanlar (yeniden adlandırma kilit-testine takılır — oturumlar kapanınca **aynı dans** uygulanır):

- `.claude\projects\D--Vibecode-ordu` **0,38 GB** (bu koordinatör oturumu transkripti + memory)
- `.claude\projects\D--Vibecode-ai-scene-graph-dart` 0,25 · `D--Vibecode-scraper` 0,10 · `D--Vibecode-playwright-cdp` 0,08 · `D--Vibecode-mcp` 0,02

## Dürüst notlar

- rename-kilit-testi kapısı işledi: hiçbir canlı sürece dokunulmadı; 4377/4930/4933 sunucuları ve Paseo daemon etkilenmedi (models/worktrees junction'ları yolu korur — daemon spawn'ları aynı patikadan okur).
- Haftalık bakım da çalışıyor (101 öğe) — junction ile çelişmez; marjinal katkı.
- Sonraki %10 eşiği hedefi: canlı dizinlerin penceresi (~0,83 GB) + Temp (3,42 GB, ayrı karar — yeniden üretilir).
