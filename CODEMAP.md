# CODEMAP — paseo-plugin (OTOMATIK URETILDI: HEAD f589f67 — elle duzenleme)

Ajan once bu haritadan hedef dosyayi secer, SADECE onu acar. Toplu tarama yasak. Butce hedefi: ~1k token.

- `AGENTS.md` (0.7KB) — AGENTS.md — paseo-plugin (L0) | Hızlı yön | Yapı
- `ANAYASA.md` (1.8KB) — ANAYASA — paseo-plugin | 1. Hizalama Anahtarları (öncelik sırasıyla) | 2. SSOT Maddeleri
- `ANAYASA-SABLONU.md` (2.6KB) — ANAYASA — <proje adı> | 1. Hizalama Anahtarları (öncelik sırasıyla — çakışmada üstteki kazanır) | 2. SSOT Maddeleri (her konunun TEK doğru kaynağı — başka yerde kopya = hata)
- `DERSLER.md` (3KB) — DERSLER — paseo-plugin (L5)
- `FERMANLAR.md` (2.1KB) — FERMANLAR — Paseo Verimlilik Sistemi Aktivasyon Emirleri (v2.0, 2026-10-11) | Ferman 1 — Geçiş (plugin gelene kadar her yeni ajanın ilk mesajı) | Ferman 2 — İnşa (paseo-verimlilik plugin'ini yaptırma emri; birleşik planın bekleyen onayı)
- `kanit\01-paseo-dokuman-envanteri.md` (11.5KB) — Paseo Doküman Envanteri — Ajan Verimliliği Primitifleri | H1 — Geçmişin kaydedilmesi (handoff / hafıza) | H2 — Kod+döküman indeksleme, hızlı erişim
- `kanit\02-plugin-api.md` (10.7KB) — 02 - Paseo Plugin API Tam Haritası | 1. Manifest: `paseo-plugin.json` | 2. Her yeni ajana metin enjeksiyonu (sözleşmenin kalbi)
- `kanit\03-claude-code.md` (10KB) — 03 - Claude Code Verimlilik Mekanikleri | 1. Hafiza: CLAUDE.md hiyerarsisi + .claude/rules + oto-hafiza | 2. Subagents (.claude/agents)
- `kanit\04-cursor.md` (5.3KB) — 04 - Cursor Verimlilik Mekanikleri | 1. Rules (.mdc) — 4 tip + aktivasyon matrisi | 2. Cloud Agents (background agents)
- `kanit\05-windsurf-cline-roo.md` (5.5KB) — 05 - Windsurf / Cline / Roo Code Verimlilik Mekanikleri | 1. Windsurf (Devin Desktop): Memories + Rules | 2. Windsurf: Workflows
- `kanit\06-aider-opencode.md` (4.8KB) — 06 - Aider + OpenCode Verimlilik Mekanikleri | 1. Aider repo-map — "ışık hızı erişim" hedefinin kalbi | 2. OpenCode: AGENTS.md + ajanlar
- `kanit\07-orkestrasyon.md` (3.7KB) — 07 - GitHub Çok-Ajan Orkestrasyon Repoları + Pitbull Desenleri | 1. Framework tablosu (star sırasıyla) | 2. Pitbull-persistence / watchdog desenleri (çerçevelerden damıtılmış)
- `kanit\08-hafiza.md` (4.5KB) — 08 - Hafıza Sistemleri Karşılaştırması (Paseo local-first gözüyle) | 1. Sistem tablosu (Paseo uyumuna göre sıralı) | 2. Vektörlü vs vektörsüz (dosya-tabanlı)
- `kanit\09-token-verimliligi.md` (4.5KB) — 09 - Token Verimliliği Araçları ve Ölçülmüş Tasarruflar | 1. Repo-paketleme araçları (bağlam üretimi) | 2. Prompt caching (en büyük hazır tasarruf)
- `kanit\10-paseo-ekosistem.md` (5.2KB) — 10 - Paseo Ekosistemi (github.com/getpaseo) — Somut Kopyalanabilirler | 1. getpaseo/paseo repo anatomisi | 2. getpaseo/plugins registry (topluluk)
- `kararlar\K-0001.md` (0.6KB) — K-0001 — İki araştırma paketinin birleştirilmesi ve sürüm senkronu
- `kararlar\K-0002.md` (1.6KB) — K-0002 — v2.0: 10-eksenli harness araştırması sentezi + reviewer denetimi
- `kararlar\K-0003.md` (1.9KB) — K-0003 — Ferman 2 tamamlandı: paseo-verimlilik plugin'i kuruldu ve canlı doğrulandı
- `kararlar\K-0004.md` (1.4KB) — K-0004 — v0.2: pitbull + permission polisi + tur telemetrisi (10'a giden yol, paket 1)
- `kararlar\K-0005.md` (1.6KB) — K-0005 — v0.2.1 hijyen paketi + v0.3 (reviewer karşı-incelemesi kapandı)
- `PASEO-VERIMLILIK-PLANI.md` (12.6KB) — PASEO VERİMLİLİK PLANI | 1. Verimlilik kazanç tablosu (ÖNEM SIRASIYLA) | 2. Plugin mimarisi (tek plugin: `paseo-verimlilik`)
- `PASEO-VERIMLILIK-REHBERI-v2.0.md` (10.6KB) — PASEO VERİMLİLİK REHBERİ — Uygulama-Üstü Ajan Sözleşmesi (v2.0) | 1. Altın Kurallar (önce bunlar) | 2. Bağlam Bütçesi (her turda bilinç)
- `plans\handoff\HANDOFF-2026-10-11-1900.md` (0.7KB) — HANDOFF-2026-10-11-1900 — paseo-plugin ilk devir
- `plans\handoff\HANDOFF-2026-10-11-2005.md` (3KB) — HANDOFF-2026-10-11-2005 — rol değişimi + v2.0 karar seti | Reviewer hükmü (kabul edildi) | Reviewer düzeltmeleri (kabul)
- `raporlar\OZET.md` (0.2KB) — OZET — raporlar/
- `raporlar\token-olcum-2026-10-11\OZET.md` (1.3KB) — Token Ölçümü — 2026-10-11 (R) | Tüm kayıtlar (TokenDays=0) | Bugün (TokenDays=1)
- `README.md` (2.7KB) — paseo-plugin — Evrensel Ajan Verimlilik Sözleşmesi (v2.0) | İçindekiler | Hızlı başlangıç (3 adım)
- `scripts\codemap.ps1` (2.4KB)
- `scripts\saglik.ps1` (6.5KB) — function Check($ad, $ok, $detay) { | function Find-First([string]$root, [string[]]$paths) { foreach ($p in $paths) { $full = Join-Path $root $p; if (Test-Path $full) { return $full } }; return $null } | function Warn($ad, $detay) { $script:rows += [pscustomobject]@{ Kontrol = $ad; Durum = 'SARI'; Detay = $detay }; $script:warnN++ }
- `scripts\yonetici-ozeti.ps1` (7.6KB)
- `STATE_BOARD.md` (2KB) — STATE_BOARD — paseo-plugin | Aktif iş | Son damgalar
