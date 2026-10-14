# qwen v1.2 (SUPERSEDED) — Derin Plan Analizi
Tarih: 2026-10-14 · Çerçeve: v3.2 (15 alan, sabit ağırlıklar) · Kural: canlı kanıt yoksa alan tavanı 8 · Ayrım: TASARIM-EKSIK ≠ UYGULAMA-EKSIK ≠ KANIT-EKSIK ≠ BASARISIZ; NOT_RUN başarısızlık değildir.

## Doğrulanan iddialar (dosyadan kanıtlı)

- **8 kart + stale**: DOĞRU. `06-frenler-ve-guvenlik.md` §5'te 8 kapalı kart türü (3-kirmizi, plateau, butce-asimi, kapsam-disi, yetim, izin-sorisi, onar, acik-bagimlilik); `karar-stale` K-0002/A4 ile 01 §3 + 06 §5'te tanımlı.
- **Bütçe frenleri**: DOĞRU. 06 §3: spawn anında rezerve, %90 dürtme, %100 zorla-testte, sprint tavanı, bilinmeyen kullanım = `bilinmiyor` (uydurma sayı yasak).
- **kapasite-bekliyor**: DOĞRU. K-0002/A5 → 01 §4 durum kümesinde, 02 §1/§3 geçiş tablosunda; retry/bütçe yakmaz kuralı açık.
- **'25 kapalı event türü'**: DOĞRU (şema tarafında). `schemas/olay.schema.json` `t` enum'u tam 25 tür içeriyor. NOT: 01 §3 insan-okur tablosunda 24 satır var — `cevap-guncel` tabloda eksik, şemada ve 01 §8 metninde var. Şema-otorite kuralı (K-0002/A6, "çelişkide şema kazanır") bunu tolere eder; düşük şiddetli doküman-şema drifti.
- **'P0-10 replay testi'**: DOĞRU. `08-kabul-testleri.md` P0-10: capsules.json SİL + köprü restart → tablo %100 events.jsonl'den; "tacı" olarak işaretli.

## Alan tablosu (0-10, tavan 8)

| Alan | Ağırlık | Puan | Gerekçe |
|---|---|---|---|
| Teslim | 14 | 6.0 | Gate/verifier + candidate freeze (K/D6) + kanıtlı kabul kültürü güçlü tasarım; ama receipt/zincir yok (check-gecti'de suite hash, evaluator kimliği, imza yok); hiç koşulmamış; SUPERSEDED. |
| Yetki/güvenlik | 13 | 7.0 | 4-eksen izin fail-closed, S1-S7, bekçi pre-spawn, `.ordus/**` zorunlu yasak, merge yalnız insan. Sandbox izolasyonu worktree düzeyinde kalıyor. |
| Halüsinasyon/kanıt | 10 | 7.0 | "Kanıtsız PASS = bug" (08 giriş), GEÇTİ+çıktı zorunluluğu, uydurma sayı yasağı, checker. Receipt-benzeri bağlayıcı kanıt zarfı eksik. |
| Long-run/recovery | 10 | 7.5 | En güçlü alan: fold/replay (M4, P0-10), intent-first fsync (K/D2), spawn-bilinmiyor + onar, owner/epoch lock, tail repair, migration + downgrade koruması, yetim prosedürü. |
| İzleme | 8 | 6.0 | Tek SSE, stale/donmuş rozeti, plateau tespiti; metrik katmanı ve p50/p95 yok (skorcard P4'e ertelenmiş). |
| Otonomi | 7 | 6.5 | Mod profilleri (ekonomi dahil), bounded retry, karar-iste eskalasyonu; otonomi ölçümü tanımsız. |
| Manager | 6 | 6.5 | Manager çıktı sözleşmesi + checker fail-closed; ama manager format disiplini prompt'a emanet ("başka düz metin yok" zorlanamaz). |
| Handoff | 5 | 5.5 | Z3 rapor biçimi + 09 §5 teslim paketi iyi; makine-doğrulanır DTO/şema yok. |
| Coding | 5 | 6.0 | Worktree izolasyonu, geri-bildirimli retry, aynı-sahip dürtme; suite koruması (evaluator-coder ayrımı) zayıf. |
| Reasoning | 4 | 4.0 | Açık reasoning değerlendirme mekanizması yok; bekçi tek hafif kontrol. |
| Paralellik | 4 | 7.0 | Katman bandı + rol bazlı maxParalel + kapasite-bekliyor + aynı-worktree yasağı; çakışma ölçümü yok. |
| Schedule | 4 | 1.5 | Scheduler yok; yalnız saat penceresi ekseni. TASARIM-EKSIK. |
| Memory | 4 | 3.5 | K-XXXX hijyeni + arsiv var; öğrenme hattı/karantina/promote yok. |
| Hız/maliyet | 3 | 6.5 | LOC bütçesi 80/20 zinciri + B4 sapma freni + ekonomi modu; ölçüm altyapısı tanımsız. |
| Taşınabilirlik | 3 | 6.0 | M3 adaptör soyutlaması + ham-llm ikinci adaptörü; Paseo-first yazılmış (ADR-012 sonradan ekleme). |

**Ağırlıklı toplam: 61.2 / 100** (611.5/1000)

## İlk 3 açık (kod yeri + kabul testi + durum)

1. **Canlı implementasyon hiç yok** — Kod yeri: yok (klasör salt-doküman; K-0003 ile platform otoritesi baseline'a devredilmiş). Kabul testi: 08 P0-1..P0-20 (20 satır) hiçbiri koşulmamış. Durum: UYGULAMA-EKSIK + KANIT-EKSIK — NOT_RUN; başarısızlık DEĞİL, bilinçli supersede.
2. **Schedule/zamanlama tasarımı yok** — Kod yeri: 06 §4 saat penceresi tek zaman kavramı; occurrence/DST/misfire/outbox kavramları hiç yok. Kabul testi: tanımsız. Durum: TASARIM-EKSIK.
3. **Kanıt zarfı (receipt) eksik** — Kod yeri: 01 §3 `check-gecti` payload'ı (`komut/sureDk/token/deneme`) — suite hash, evaluatorId/version, ortam, imza alanları yok; sahte-PASS kapısı (exit-0 + 0 test = red) tanımsız. Kabul testi: 08'de karşılığı yok. Durum: TASARIM-EKSIK (kısmi — candidate freeze var, zincir yok).

## Hüküm

qwen v1.2, hiç koşulmamış olmasına rağmen disiplin yoğunluğu en yüksek paket: kapalı kümeler, intent-first fsync, replay-tacı testi, karar-stale ve kapasite-bekliyor gibi ince mekanizmaları hem tasarlayıp hem makine şemasına indirmiş; "kanıtsız PASS = bug" kültürünü bu ekosisteme o sokmuş. 61.2 puanın ana maliyeti tasarım kalitesi değil, (a) SUPERSEDED statüsü gereği hiçbir satırın canlı kanıtının olmaması ve (b) schedule/memory/receipt gibi üç alanın tasarım olarak hiç var olmaması. Baseline'a taşınan katkıları (headless-first sıra, 8 kart, frenler, kanıt kültürü) MASTER-SSOT §9.2/§15'te kimlikleriyle yaşıyor — bu, bir plan için en iyi ikinci sonuçtur: kodu değil disiplini miras kaldı.
