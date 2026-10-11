# paseo-plugin — Evrensel Ajan Verimlilik Sözleşmesi (v2.0)

Her projede her AI ajanına uygulanabilen, uygulama-üstü verimlilik sözleşmesi + otomasyon araçları. Paseo (paseo.sh) içinde doğdu, herhangi bir ajan ortamında çalışır (Claude Code, Codex, Cursor, Cline, OpenCode...).

Amaç: **ajan zekâsı ≈ model IQ × bağlam kalitesi** — bu paket bağlam kalitesini maksimize eder, tokenı minimize eder, devirde kaybı sıfırlar.

## İçindekiler

| Dosya | Ne işe yarar |
|---|---|
| `PASEO-VERIMLILIK-REHBERI-v2.0.md` | EVRENSEL SÖZLEŞME — 9 bölüm: altın kurallar, bağlam bütçesi, devir töreni, L0-L5 dosya hafızası, token teknikleri, çalışma disiplini, watchdog protokolü, subagent standardı, ilk-15-dakika onboarding |
| `ANAYASA-SABLONU.md` | Proje başına üst otorite şablonu: hizalama anahtarları, SSOT tablosu, ASLA/HER ZAMAN maddeleri (manifesto; detay yok) |
| `FERMANLAR.md` | Aktivasyon emirleri: geçiş (her yeni ajana ilk mesaj), inşa (plugin MVP), ANAYASA kurulumu — sırası: 3 → 2 → 1 |
| `PASEO-VERIMLILIK-PLANI.md` | 14 mekaniklik kazanç tablosu (hız/kalite/token × artı/eksi, önem sıralı), plugin mimarisi, ölçüm kataloğu, hedef eşikler, 4 haftalık yol haritası, anti-kararlar |
| `scripts/codemap.ps1` | Repo haritası üretici (Aider deseni): kökte `CODEMAP.md` üretir; git repolarında post-commit hook ile otomatik (test edilmiş) |
| `scripts/saglik.ps1` | verimlilik-doctor: L0-L5 varlık/bütçe, CODEMAP tazeliği, handoff zinciri, rehber hijyeni + opsiyonel JSONL telemetri (cache-hit/dürtme eşikleri) |
| `kanit/01-10` | Kanıt paketi: Paseo envanteri, plugin API haritası, Claude Code/Cursor/Windsurf/Cline/Roo/Aider/OpenCode mekanikleri, orkestrasyon repoları, hafıza sistemleri, token araçları, Paseo ekosistemi |

## Hızlı başlangıç (3 adım)

1. `FERMANLAR.md` #3: ANAYASA'yı proje köküne kur (ajan iskeleti çıkarır, maddeleri siz doldurursunuz).
2. `FERMANLAR.md` #2: plugin'i inşa ettirin (Paseo kullanıyorsanız) — kurulum daemon'a bir kez, ajanlara otomatik.
3. Plugin yoksa `FERMANLAR.md` #1: her yeni ajana ilk mesaj olarak verin.

## Sağlık kontrolü

```powershell
powershell -NoProfile -File scripts\saglik.ps1            # repo sağlığı (12+ kapı)
powershell -NoProfile -File scripts\saglik.ps1 -Jsonl telemetri.jsonl   # + cache-hit/dürtme eşikleri
```

## İlke

Ölçüm yoksa "tahmin" etiketi; tek-kaynak iddialar `*` işaretli. Vektör DB yok, opak oto-hafıza yok — kalıcı bilgi dosyada, git'te sürümlenir.

v2.0 · 2026-10-11 · SpeakRapid ve BUSINESS-REALITY-ENGINE pratiğinden damıtıldı; iki bağımsız araştırma paketinin çapraz doğrulamasıyla.
