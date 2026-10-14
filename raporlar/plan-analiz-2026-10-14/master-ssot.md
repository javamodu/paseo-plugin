# MASTER-SSOT-PLAN v2.4 — Özeleştiri (taze göz, acımasız)
Tarih: 2026-10-14 · Çerçeve: v3.2 (15 alan, sabit ağırlıklar) · Kural: canlı kanıt yoksa alan tavanı 8 · Ayrım: TASARIM-EKSIK ≠ UYGULAMA-EKSIK ≠ KANIT-EKSIK ≠ BASARISIZ; NOT_RUN başarısızlık değildir.
Doğrulama: 19 bölüm tam okundu; ordu-core testi bu oturumda canlı koşuldu → **102/102 exit 0** (node --test, 14 test dosyası); src ~1.770 satır (19 dosya).

## Tutarlılık kontrolü (sorulan üç nokta)

- **§17.3 canlı test paketi**: Tutarlı. 3 maddesi (F0-A determinizm, F1/S1.1 canlı kapsül, F2 fake-adaptor senaryoları) §10 faz kapılarıyla ve §18 P0-1/P0-2 satırlarıyla birebir bağlı; "onay gelmeden koşulmaz" kilidi açık. Kod yazımı değil mevcut baseline koşusu olması dürüst çerçeve.
- **§18 kapanış listesi (P0-1..P2-8)**: Tutarlı ve disiplinli — her satırda kod yeri + kabul testi + durum ayrımı doğru kullanılmış (P0-1 "CANLI KANIT YOK" dürüstlüğü dahil). Eksiği: P0-2'nin "hermetik 83/83" kanıt damgası eski (aşağıda çelişki #1).
- **§19 halka modeli**: Mimari olarak temiz (4 halka + 4 bozulma kuralı + faz eşlemesi), AMA §10 F0 ile doğrudan çelişiyor (çelişki #2).

## Alan tablosu (0-10, tavan 8)

| Alan | Ağırlık | Puan | Gerekçe |
|---|---|---|---|
| Teslim | 14 | 8.0 | 14-alan receipt + sahte-PASS kapısı (A13) + 5-durum teslim ekseni + korunan suite; çekirdek hermetik testli (canlı doğrulandı). Canlı S1.1 koşusu yok → tavan. |
| Yetki/güvenlik | 13 | 8.0 | Rol yetki sınırları net (§4), worktree≠sandbox dürüstlüğü, M26/M31 canlı kapılara bağlı, politika plug-in halkası. |
| Halüsinasyon/kanıt | 10 | 7.5 | Ayrım disiplini + §18.2 güncel-doğrulama kuralı örnek; AMA belge kendi kanıt damgasını eski sayıyla taşıyor (83/83) — P4 ruhuna kendisi kısmen aykırı. |
| Long-run/recovery | 10 | 8.0 | A05/A06/A16/A35/A36 testli; kill -9 + STOP restart F2 geçiş kuralı; UNKNOWN reconcile + fence. Hermetik kanıt canlı doğrulandı. |
| İzleme | 8 | 7.0 | §16 15 alan + 5 gösterge + kimlik zinciri (§16.4) güçlü tasarım; toplayıcı F2'de, dashboard F3'te — henüz kod yok. |
| Otonomi | 7 | 7.0 | Mod profilleri + 9 kart + bounded retry + otonomi metrikleri (müdahale/görev, gereksiz kart). |
| Manager | 6 | 7.0 | Manager manifest'e yazamaz, derleyici determinizm testi (F0-A) var; prompt-disiplini riski checker ile kapatılmış. |
| Handoff | 5 | 7.5 | §16.5'in 7 öğesi + handoff.schema.json + yazma-yolu zorunlu validator (P1-5) — iki plan arasında en olgun handoff tasarımı. |
| Coding | 5 | 7.0 | Evaluator-coder ayrımı + suite koruması + ilk-aday≠kabul kuralı (§16.6). |
| Reasoning | 4 | 5.5 | §16.6 sonuç+gerekçe+varsayıma bakar kuralı ve sabit rubric var; karşı-örnek avı mekanizması zayıf. |
| Paralellik | 4 | 7.0 | Kapasite = canlı+UNKNOWN rezervasyonları, çakışma/rework ölçümü F4 kapısında. |
| Schedule | 4 | 6.5 | Occurrence-unique + DST SKIP + misfire SKIP + overlap SKIP + durable outbox — tam tasarım, sıfır kod (F4). |
| Memory | 4 | 7.0 | Karantina→eşlenmiş deney→çift onay→canary regresyon; expiry/revoke + veri-talimat ayrımı. Nedensellik dürüstlüğü (§9.4) örnek. |
| Hız/maliyet | 3 | 6.5 | Dürüst LOC tablosu (8-13k, (T) etiketli), muhafazakar rezervasyon, p50/p95 planı; ölçüm henüz yok. |
| Taşınabilirlik | 3 | 7.0 | Kalın adaptör sözleşmesi (§6) + 4 halka + "Paseo'suz yaşar, üretmez" dürüstlüğü (§12). |

**Ağırlıklı toplam: 73.5 / 100** (735/1000)

## İlk 3 açık (kod yeri + kabul testi + durum)

1. **Canlı uçtan uca teslim yok (P0-3)** — Kod yeri: ordu-core dispatcher/evaluator + F1 hattı (§10). Kabul testi: S1.1 canlı kapsül + 14-alan receipt + indirilebilir artefakt. Durum: UYGULAMA-EKSIK (tasarım tam). Bu tek başına Teslim alanını tavana bastırıyor.
2. **Kanıt damgası eski: "83/83"** — Kod yeri: başlık satırı, §17, §18.2, §19.1 kural 3. Kabul testi: damganın `npm test` çıktısıyla (bu oturum: 102/102 exit 0) yenilenmesi; §19.1 kural 3'teki mutlak sayının "tüm testler yeşil, exit 0" biçiminde sayıdan bağımsız yazılması. Durum: KANIT-EKSIK (kanıt var ama damga yanlış — P4 disiplin ihlali, düşük şiddet).
3. **F3 izleme/yüzey yok (P1-4)** — Kod yeri: F3 read-model + core API + bağımsız web. Kabul testi: F3-A (Paseo kapalıyken read 200) + F3-B (STOP sonrası 0 spawn). Durum: UYGULAMA-EKSIK.

## İç çelişki listesi

1. **Üç farklı test sayısı (en büyük çelişki):** başlık + §17 + §18.2 + §19 "83/83 (R, 2026-10-14)" derken §0 ve §15 aynı belgede "51/51" diyor; canlı gerçek ise 102/102. Belge hem kendi içinde çelişik hem bugün koşulan kanıtla uyuşmuyor. Üstelik damga bugünün tarihini taşıyor — yani yazıldığı anda bile doğrulanmamış. §19.1 kural 3'ün "83/83 yeşil kalmalı" biçimi mutlak sayı gömdüğü için kural tanımı gereği kırılgan: bir test eklendiği an merge kapısı teknik olarak sağlanamaz hale geliyor.
2. **Donmuş çekirdek vs F0 içeriği:** §19.1 "çekirdek şemasına DOKUNULMAZ" + §19.2 "hiçbir faz çekirdek diff'i gerektirmez" derken §10 F0 çıkış kapısı "schema `local` enum + manifest regen + K1 payload daraltma" istiyor — bunların üçü de çekirdek sözleşme diff'i. F0 bunları ADR + kırmızı-test şartıyla (§19.1 kural 4) işaretlemeden sıradan faz işi gibi listeliyor.
3. **Otorite zinciri çift başlı:** üst bant "ANAYASA > evrensel sozlesme > BU PLAN > raporlar" derken §0 "çakışmada ordu-v3/ordu-core kazanır" diyor — ordu-v3 ve ordu-core zincir satırında hiç yok. Plan kendini zincirde üstte gösterip iki satır sonra kendinden üstün iki kaynak ilan ediyor.
4. **`karar-bekleyen` durumu düşmüş:** §3 döngü "KARAR KARTI -> insan" diyor, §9.2 9 kart türü tanımlıyor; ama §5 görev durum kümesinde `karar-bekleyen` yok (qwen'de vardı). Kart açıkken görev hangi durumda — `bloklu` mu, `kosuyor` mu? — tanımsız. Pano (§8) "Kararlar" bölümünü bu duruma bağlayamaz.
5. **Auth kararsız ama faza gömülü:** §14 soru 3 web pano auth modelini açık soru bırakırken §10 F4 çıkış kapısı "uzaktan erişim (auth'lu)" diyerek kararı peşinen varsayıyor.
6. **LOC damgası tekrarlanabilir değil:** §11 "1.815 LOC" iddiası; bu oturumda src ölçümü ~1.770 (19 dosya). Ölçüm yöntemi (hangi dizinler, boş satır politikası) yazılmadığı için fark açıklanamıyor — (R) etiketi taşıyan bir sayının komutu belgede yok.

## Hüküm

v2.4, v1.0'ın üç eleştirisini (65/64/60) gerçekten kapatmış: tek-otorite modeli (§0), receipt zinciri (§7), faz sırasının güvenlik-önce çevrilmesi (§10) ve 15 alanlık metrik katmanı (§16) tasarım olarak bu ekosistemin en olgun yüzeyi; dürüstlük kayıtları ("yasar, üretmez", canary≠üstünlük, nedensellik uyarısı) örnek nitelikte. 73.5 puanın tavanını belirleyen tek şey canlı kanıt yokluğu — plan bunu kendisi de söylüyor (§17) ve doğru reçeteyi yazıyor (§17.3). Asıl yara estetik değil epistemik: "kanıtsız PASS = bug" diyen bir plan, kendi başlığına bugünün tarihiyle doğrulanmamış bir test sayısı damgalamış ve üç yerde birbiriyle çelişen sayılar taşıyor. Çelişki #1 ve #2 beşer dakikalık düzeltmeler; onlar kapanıp §17.3 paketi koşulduğunda bu belge hem kendi kuralına uyan hem de puanı 80+ bandına taşınmaya aday tek plan olur.
