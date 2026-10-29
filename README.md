# ordu — Evrensel Ajan Verimlilik Sözleşmesi (v2.1)

Her projede her AI ajanına uygulanabilen, uygulama-üstü verimlilik sözleşmesi + otomasyon araçları. Paseo (paseo.sh) içinde doğdu, herhangi bir ajan ortamında çalışır (Claude Code, Codex, Cursor, Cline, OpenCode...).

Monorepo bileşen evleri (F1/F2 birleşimi; ayrıntı AGENTS.md "Yapı" bölümünde): `core/` ordu-core (defter+dispatch+kabul) · `plugin/` paseo-verimlilik (kayıtlı kilit v0.23-kilit; bugünkü belge değişiklikleri yeni ürün kilidi değildir) · `pano/` pano iskelet/mockup · `referans/` salt-okur (kapsul-final, ordu-v3) · `surumler/` kök kilit sürümleri.

## Bu repoda çalışacak ajan için ilk yol

[Kısa ajan başlangıcı](plans/AJAN-BASLANGIC.md) → [ANAYASA](ANAYASA.md) ve [AGENTS](AGENTS.md) → [CODEMAP](CODEMAP.md) → [SSOT indeksi](plans/SSOT-INDEX.md) → [ana ürün planı](plans/PLAN.md) → [atomik görev paketi](plans/uygulama-paketleri/DC-H1-2026-10-28/OZET.md). [STATE_BOARD](STATE_BOARD.md) güncel durumun kaynağıdır; eski START/gece modu damgaları bugünkü izin değildir. [Veri yerleşimi](plans/VERI-YERLESIMI.md) okunmadan runtime komutu çalıştırılmaz.

Bu dosyanın aşağıdaki kurulum anlatımı **evrensel sözleşme paketine** aittir. [PASEO-VERIMLILIK-PLANI](PASEO-VERIMLILIK-PLANI.md) paket mimarisidir; ürün sprintlerinin tek uygulama otoritesi [plans/PLAN.md](plans/PLAN.md) olarak kalır. Görev fişinin veya belge kilit adayının varlığı başlatma/harcama/insan kabulü değildir.

Amaç: **ajan zekâsı ≈ model IQ × bağlam kalitesi** — bu paket bağlam kalitesini maksimize eder, tokenı minimize eder, devirde kaybı sıfırlar.

## İçindekiler

| Dosya | Ne işe yarar |
|---|---|
| `sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md` | EVRENSEL SÖZLEŞME — 10 bölüm + EK-5: altın kurallar, bağlam bütçesi, devir töreni, L0-L5 dosya hafızası, token teknikleri, çalışma disiplini, watchdog protokolü, subagent standardı, ilk-15-dakika onboarding, öz-değerlendirme, EK-5 süre ekonomisi (K3 fırtına modu) |
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
powershell -NoProfile -File scripts\saglik.ps1            # repo sağlığı (18 kapı; -Jsonl ile 21)
powershell -NoProfile -File scripts\saglik.ps1 -Jsonl telemetri.jsonl   # + cache-hit/dürtme eşikleri
```

## İlke

Ölçüm yoksa "tahmin" etiketi; tek-kaynak iddialar `*` işaretli. Vektör DB yok, opak oto-hafıza yok — kalıcı bilgi dosyada, git'te sürümlenir.

v2.1 · 2026-10-13 · v2.0: SpeakRapid ve BUSINESS-REALITY-ENGINE pratiğinden damıtıldı, iki bağımsız araştırma paketinin çapraz doğrulamasıyla. v2.1: EK-5 Süre Ekonomisi + §5 K3 askı notu (K-0032).
