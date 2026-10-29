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
| Evrensel paket planı | [`PASEO-VERIMLILIK-PLANI.md`](../PASEO-VERIMLILIK-PLANI.md) | kök paket mimarisi; ürün sprint otoritesi değil |
| Ürün uygulama planı | [`plans/PLAN.md`](PLAN.md) | v2.10.1 §25; tek aktif sıra, denetimli ayrıntı; yeni bütçe onay bekler |
| Rapor birleşimi / belge kilidi | [`aynı ana plan §26`](PLAN.md:588) | RBT-2026-10-28.1; B0-B5 planlama, henüz birleşim/kilit yok; [paket](../raporlar/rapor-birlesimi-2026-10-28/OZET.md) ikinci uygulama otoritesi değil |
| Ajan atomik uygulama fişleri | [`aynı ana plan §27`](PLAN.md) → [ATOM-H1 paketi](uygulama-paketleri/DC-H1-2026-10-28/OZET.md) | 26 görev; 4 S0a brief tam/başlatma yok, 22 tasarım koşullu; ürün grafiği/kabul defteri yerine geçmez |
| Etkin belge kapanışı | [`aynı ana plan §28`](PLAN.md) → [kanıt paketi](../raporlar/kilit-oncesi-kapanis-2026-10-28/OZET.md) | RBT .2 / ATOM-H1 .2; kaynak erataları, sonuç v2, mevcut defter DC eki; B5 insan kabulü ayrı |
| Ajan giriş / runtime yolları | [AJAN-BASLANGIC](AJAN-BASLANGIC.md) / [VERI-YERLESIMI](VERI-YERLESIMI.md) | Navigasyon ve mevcut yol politikası; ikinci plan veya runtime değişimi değil |
| Görev projeksiyonu | [`görev grafiği`](gorev-grafigi-2026-10-26.json) | v14; aktif/tarihsel ilişki ayrı; metadata runtime yetki değil, başlatma kapalı |
| Devir zinciri | `plans/handoff/` | append-only halkalar |
| Tasarım dili | [`plans/TASARIM-MANIFESTOSU.md`](TASARIM-MANIFESTOSU.md) | arayüz SSOT'u + TASARIM KAPISI (emirden öte; UI işi kapıdan geçmeden kapanmaz) |
| Kullanım kılavuzu | `core/KULLANIM.md` | ordu-core tek-dosya kılavuzu |

## Bileşen evleri

| Bileşen | Dizin | Kaynak ev (donduruldu, silme F4) |
|---|---|---|
| core | `core/` | dış repo: `D:\Vibecode\silinecek-task-graph\ordu-core` (donduruldu; bundle: `arsiv/history/ordu-core.bundle`) |
| plugin | `plugin/` | dış repo: `D:\Vibecode\paseo-verimlilik` (bundle: `arsiv/history/paseo-verimlilik.bundle` — kilit tag'lerin evi; drift bekçisi buradan okur) |
| pano | `pano/` | dış repo: `D:\Vibecode\paseo-pano` (mockup; history F4 öncesi bundle önerisi ADR'de) |
| referans | `referans/` | kapsul-final-v2.0.0 notio + ordu-v3 (salt-okur) |
| arşiv | `arsiv/` | history bundle'ları + eski SSOT kopyaları (2026-10-25) + rehber v2.0 |

## Eski SSOT kopyaları (y ASLA — yalnız arsiv/)

`arsiv/SSOT-eski-2026-10-25/` — task-graph evinin STATE/DERSLER/AGENTS/HEDEF kopyaları + MASTER-SSOT-PLAN (3 anahtar REDACTED: B16/B18/B19).
