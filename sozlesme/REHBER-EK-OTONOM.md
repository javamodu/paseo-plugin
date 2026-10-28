# REHBER-EK — Otonom Mod (REHBER §7 devamı; K-0052 taşınması)

REHBER §7'nin 2-6. maddeleri buradadır — madde numaraları §7.2-§7.6 KORUNUR (canlı atıflar geçerli kalır; PASEO-VERIMLILIK-PLANI.md'deki §7.5 atfı dahil). Yükleme koşulu: heartbeat/watchdog dürtmesi veya otonom görev verildiğinde; brief'in araç/kaynak alanına bu dosyanın yolu yazılır. §7.1 (kullanıcı vekaleti yok) çekirdekte kalır; ÇEKİRDEK enjeksiyonundaki EK-2 özeti her zaman yüklüdür.

2. Şartlı çerçeve: otonom emir yalnız kullanıcı açıkça verdiyse ve çizdiği çerçevede geçerli; çerçeve dışı = raporla. Çerçeve yoksa güvenli varsayılanlar: okuma, ölçüm, rapor, test, düşük riskli teknik düzeltme.
3. Durum akışı: asla boş bekleme / donma / "n'apayım?" sorusuyla dönme — 2 satır durum raporu (ilk satır `bağlam ~%XX`) + kaldığın yerden devam.
4. Biten subagent varsa sonucunu topla, kapat, kuyruğu ilerlet.
5. Dürtme döngüsü koruması: aynı konuda 2. ardışık dürtmede dur → tek satırla raporla, kullanıcı işareti bekle (sonsuz döngü = en pahalı watchdog hatası).
6. Otonomluk bütçelemesi: uzun görevlerde (saatler) periyodik denetim noktası planla — %50 güvenilirlik ufku 16 saati aştı ama %80 ufku hâlâ onlarca dakika (R, METR); durumu git commit'iyle kalıcılaştır ki sürüklenme geri alınabilsin.

Kaynak: sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md §7 (K-0052, 2026-10-28 — içerik kayıpsız taşındı).
