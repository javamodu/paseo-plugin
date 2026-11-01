# OTONOM-ANALIZ-HIZ — 2026-11-01 (teklif v1 hız/verim boyutu; salt-okur)

- Analiz edilen teklif: Paseo ekosisteminde ölü oturumların ardılını otomatikleştirme — (1) workspace başına 20-30 dk nöbet schedule'ı (STATE + son handoff oku → [insan] kapısı olmayan aktif işi devral), (2) ölüm-algılayan watchdog (5 dk polling) + headless `claude -p` devir promptu, (3) K-0057 süpervizör deseninin workspace bazına genelleşmesi, (4) bağlam yanması azaltma (koordinatör-okumaz · hedefli okuma · kısa commit mesajları).
- Yöntem: salt-okur ölçüm — handoff dosya adı saatleri ↔ (a) oturum transcript ilk-zaman damgaları (`C:\Users\gatep\.claude\projects\D--Vibecode-{ordu,scraper}\*.jsonl`, UTC+3) ↔ (b) git commit zamanları (ordu 462, scraper 161, txt-to-cad-platform 101 commit) ↔ (c) git `--diff-filter=A` handoff ekleme zamanları. Süreç/ağ/commit YOK; yalnız bu 2 rapor dosyası yazıldı.
- Damga: 2026-11-01T05:13 (yerel; ölçüldü). Makine-okunur ikiz: `OTONOM-ANALIZ-HIZ-2026-11-01.json` (K-0017, schemaSurum:1). islenme: null.

## VERDİKT

**HIZ: KOŞULLU** — manuel ardıl gecikmesi ölçüldü: kullanıcı başındayken iş-durması medyanı **18 dk (R, 62 ölçüm, 3 repo)**, kullanıcı-sekmesi açma gecikmesi medyanı **23 dk (R, ordu, n=13)**, kullanıcı uzakken **114 dk - 19 saat (R)**; watchdog bunu ~3-10 kata indirebilir (T) ve uzak-dönem kayıplarında saatler kazandırır — ANCAK kazanç pacing'e bağlı: teklif nöbet+watchdog'la kalıcı +2 eşzamanlı ajan ekler; RPM 25 geçidi (R) ve CPU %100 pencereleri (R) zaten 3-5 eşzamanlı ajanda 429/f3-crash üretti — eşzamanlılık tavanı ve 429 geri-çekilme penceresi KODDA zorlanmadan net hız KAYBI da mümkün.

## 1. Manuel-ardıl gecikmesi ölçümü (görev 1 — EN ÖNEMLİ)

Yöntem: her handoff yazım saati (dosya adı HHMM, yerel) → o repoda bir SONRAKİ iş damgası. İki ölçüm kanalı: **d_sess** = sonraki kullanıcı oturumunun transcript ilk-zamanı («yeni sekme açma» gecikmesi; yalnız Oct 25+ ordu + Oct 30+ scraper kapsamalı) · **d_event** = kapanış-commit'inden (med 4 dk, n=31 — kalibrasyon) ≥5 dk sonraki ilk commit («iş durması» boşluğu). Oct 27/30 «uzak» d_sess değerleri ölçüm dışı: iş worktree/Paseo oturumlarında devam etti, ana dizin transcript'i kör (dürüst not 3).

| Repo | handoff (n) | d_event med — aktif≤6h (R) | d_sess med — başta≤90dk (R) | uzak-dönem örnekleri (R) |
|---|---|---|---|---|
| ordu | 35 (36. dosya 05:12'de eklendi) | **12 dk** (n=32; ort 30; min 6) | **23 dk** (n=13; ort 32; min 2) | 114, 330, 406, 414 dk |
| scraper | 21 (22 dosya) | **18 dk** (n=20; ort 32; min 8) | fork zincirinde **1-2 dk** (n=4; otomatik) | 378 dk (gece 00:05→06:23) |
| txt-to-cad-platform | 10 (git add-zamanı) | **42 dk** (n=10; ort 51; min 8; maks 108) | veri yok (transcript yok) | — |
| **Havuz** | **66** | **med 18,0 · ort 33,8 · p75 35 · min 6 · maks 330** (n=62) | — | — |

Kaynaklar: `plans/handoff/` dosya adları (ls ölçümü 05:1x) · `git log --format=%ci` (ordu/scraper/txt-to-cad) · transcript ilk-satır timestamp'leri. Örnek satırlar (R): HANDOFF-2026-10-29-1902 (19:02) → sonraki oturum 19:04 (2 dk) → ilk commit 19:09; HANDOFF-2026-10-25-1350 (13:50) → sonraki sekme 15:20 (90 dk); HANDOFF-2026-10-31-2002 (20:02, restart öncesi) → dönüş oturumu 21:26 (84 dk).

**Yorum:** hız kazancının tabanı iki katmanlı — (a) kullanıcı başında: 12-42 dk medyan duruş; (b) kullanıcı uzakta: saatler (ör. 414 dk, 19 saat — Oct 28 21:34 → 03:19 dönüş; 44 saat — HANDOFF-2026-10-29-2130 → Oct 31 17:25, ölçüm dışı worktree kör noktasıyla). Teklifin en büyük hız gövdesi (b) katmanıdır; (a) katmanında kazanç 3 kata kadar.

## 2. Watchdog / nöbet schedule teorik gecikmesi (görev 2)

Çapalar (R): fork-tabanlı ardıl başlatma **1-2 dk** (scraper 2026-11-01 zinciri: handoff 04:34 → yeni fork oturumu 04:35:45; handoff 04:59 → 05:01:22 — `D--Vibecode-scraper\0941d5a5…jsonl`, `8c41c7e8…jsonl`) · Paseo spawn'ı **120 sn aşımına gidebiliyor** → UNKNOWN→recovered zinciri üretimde çalıştı (STATE_BOARD.md:10, :16; canlı oturum 07:00:01–07:04:29 ≈ 4,5 dk ilk tur) · 429 dirilmesi «pencere açılınca» — mekanik devir eşiği ~10 dk (kararlar/K-0057.md:3, :9).

- **Watchdog toplam ardıl gecikmesi (T):** algı 0-5 dk (5 dk polling; ort 2,5) + spawn/ısınma 1-4,5 dk → **2-9,5 dk, medyan ~7 dk**.
- **Nöbet schedule 20-30 dk (T):** devralma gecikmesi 0-30 dk (ort 10-15) + devir okuma turu ~5-15 dk → iş başına **10-45 dk, ort ~20 dk** — kötü durumda manuel medyandan bile yavaş olabilir.
- **Net hızlanma (T):** d_sess 23 dk (ordu, başta-dönem) → watchdog ~7 dk = **~3,3x**; txt-to-cad 42 dk → ~7 dk = **~6x**; uzak-dönem 114 dk-19 saat → ~7-10 dk = **10-100x** (yalnız [insan] kapısı olmayan iş sınıfında — kapılı iş yine insanı bekler, KALITE raporu §5). Nöbet schedule tek başına (watchdog'suz) **~1,5-2x** (T).

## 3. Hız düşmanları envanteri (görev 3)

- **429 / hız limiti (R):** Codefast geçidi `429 RATE_LIMIT_RPM_EXCEEDED (rpm_limit=25)` + Cloudflare 429 (~30 istek/dk) yakalandı; «hata pencereleri sürü/çok-ajan dönemlerine ve arka plan Paseo ajanlarının aynı anahtarı paylaşmasına denk geliyor» (memory: `codefast-400-hata-olustu-gecici.md:11`). K-0057 3-ajan dalgasında ardışık 429 ×3 (ORDU-1 ×2 + ORDU-2 ×1; kararlar/K-0057.md:3). Bugün (2026-11-01 04:26-05:11) gelen-kutuda 5 farklı ajan raporu paralel indi (GUVENLIK-DENETCI, KURAL-KUTLE-TARAMA, ORDU-3-k8-2a, OTONOM-ANALIZ-GUVENLIK-PERF, OTONOM-ANALIZ-KALITE — ls ölçümü) — 5 eşzamanlı ajan iddiasıyla tutarlı; «429 bir denetçiyi kesti» olayı diskte kanıtlanamadı (dürüst not 2). **Teklifin ek yükü:** nöbet + watchdog + insan oturumu üst üste bindiğinde kalıcı +2 ajan → 429 olasılığı mekanik olarak artar (RPM paylaşımı).
- **CPU %100 dönemleri (R):** tam-süit yükünde 2 koşum x=1 (f3-crash, 15 sn manager penceresi aşıldı), CPU %52'ye düşen pencerede tek koşum x=0 — yük kaynağı yabancı deepseek-harness süreci (STATE_BOARD.md:14); koşum öncesi CPU %73 (STATE_BOARD.md:15). Watchdog spawn'ı %100 penceresine denk gelirse aynı f3-crash sınıfı (T).
- **Süreç filosu 341-369:** diskte kaynak YOK (grep ölçümü — dürüst not 2); ölçülemedi, teklif bağlamından alındı.
- **Pacing önerisi:** (1) eşzamanlı ajan tavanı **3+1** (K-0057 desen: 3 çalışma + 1 süpervizör) kodda zorlanır — memory `subagent-olcek-kurali.md` (N paralel doğrulayıcı → 1 yazıcı, kademeli artırım) + EK-3 kademeli ölçek (STATE_BOARD.md:66); (2) 429'da **10-15 dk geri çekilme penceresi** (K-0057.md:9'un ~10 dk emsali; RPM 25'e göre); (3) nöbet + watchdog AYNI anda aynı işe kalkışamaz — tek-aktör kilidi (çakışan devralma = çift spawn = israf + 429); (4) watchdog spawn'ı CPU eşiğine bağlanır (>%85 → bekle, %100'de f3-crash R).

## 4. Bağlam yanması → devir sıklığı → hız (görev 4)

- **Devir sıklığı (R):** ordu 35 handoff / 21 gün = **1,7/gün**; aktif gün (10 gün) = **3,5/gün**; tek-oturum dönemi zirvesi Oct 13 = **8/gün**; çok-ajan/worktree dönemi Oct 30-31 = **1/gün** ana dizinde (iş worktree ajanlarına kaydı — toplam devir ajan başına sürdü). scraper 22 / 2,6 gün ≈ **8,5/gün** (bağlam ~%75-92'de devir — HANDOFF-2026-10-31-0745.md başlığı «Bağlam ~%92 → devir»; KALITE:20 aynı eşik %83/%89).
- **Her devirin hız maliyeti (R):** iş durması med 12-18 dk (bölüm 1) + echo borcunun ilk turu yemesi (DERSLER.md:178 — canlı vaka: n2 ajanının ilk turu echo doğrulamasına gitti; doluluk ölçümü 13 şablonlu halkada in-file 3 — OTONOM-ANALIZ-KALITE-2026-11-01.md:19) + zincir bilgi kaybı (KALITE §1).
- **Koordinatör-okumaz mekanizması (T):** yanma hızı ~%30-50 düşer (koordinatör ajan çıktılarını özet/skaler düzeyde alır, ham çıktıyı bağlamına almaz) → devir sıklığı 3,5/gün → ~2-2,5/gün → günlük duruş 3,5×15 dk ≈ 52 dk → **~30-37 dk/gün (T)**; scraper sınıfında 8,5/gün → ~4-6/gün → günde ~35-60 dk kazanç (T). Telemetri çapası (R): W44 tur 641 · alt-ajan turları 200 · cache-hit %73,4 (raporlar/telemetri-haftalik/2026-W44.md:5,9,10) — çok-ajan dönemde turlar alt-ajanlara kaydı ama cache-hit -20,4 puan düştü (aynı dosya:13): yanma azaltmadan paralelleşmenin token maliyeti görünüyor.

## En güçlü 3 öneri

1. **Watchdog öncelikli, nöbet geri kademeli (hız mimarisi):** ölüm-algı ve devir watchdog'da (5 dk polling + 1-4,5 dk spawn → medyan ~7 dk, T); 20-30 dk nöbet schedule yalnız DURUM SÜPERVİZYONU yapar (kapılı iş + sessiz rapor) — devralma hakkı yok. Aynı işe ikisinin kalkışması kodla RED (tek-aktör kilidi).
2. **Eşzamanlılık tavanı + 429 pacing KODDA:** tavan 3+1 (K-0057 deseni; bugünkü 5 paralel ajan emsal — R); 429'da 10-15 dk geri çekilme (RPM 25'e göre); watchdog spawn CPU eşiğiyle fail-closed (>%85 bekle). Tavan olmadan teklif hız yerine 429+f3-crash üretir (R mekanizma kanıtlı).
3. **Devir öncesi echo-borç kapanışı (ilk-tur maliyeti):** boş echo görülen zincirde watchdog önce echo kapatan mini tur koşar (DERSLER.md:178 canlı vaka + 3/13 doluluk) — aksi halde her ~7 dk'lık hızlı devir, ilk turunu ~dakikalarca echo doğrulamasına yedirir ve kazancı yer.

## Dürüst notlar

1. Sayı etiketleri: (R) = gerçek-ölçüm (kaynak: dosya adı / git log / transcript timestamp / ls); (T) = tahmin (R-çapalı). Etiketsiz sayı yok (E10).
2. aa1ac225 ölümü, 341-369 süreç filosu, «bugün 429 bir denetçiyi kesti»: diskte kaynak YOK (aa1ac225 için KALITE de aynı bulgu — OTONOM-ANALIZ-KALITE-2026-11-01.md:70); teklif bağlamından alınıp kanıtsız bırakıldı. «96 handoff/14 repo» iddiası: benim sayımım **123 handoff / 20+ repo** (find, maxdepth 4, arşiv+node_modules hariç — ölçüm komutu raporun json'unda).
3. d_sess kör noktası: worktree (dk-run) ve Paseo ajan oturumları ana proje dizininde transcript bırakmaz → Oct 27/30 «uzak» değerleri şişkin, ölçüm dışı tutuldu; bu dönemlerde iş kesintisiz sürdü (gece 5-ajan dalgası — STATE_BOARD.md:52) — yani ordu'nun uzak-dönem açığı zaten kısmen çok-ajan nöbetleriyle kapanıyor, teklifin marjinal kazancı orada küçüktür (en büyük kazanç orkestrasyonsuz replarda: txt-to-cad 42 dk medyan).
4. txt-to-cad handoff yazım saati = git ekleme commit zamanı (dosya adında saat yok) — gerçek yazımdan birkaç dk sonradır (closeout kalibrasyonu med 4 dk); etki ±5 dk, medyan sınıfını değiştirmez.
5. Bu rapor 2 rapor dosyası yazdı (salt-okur sözleşme); süreç/ağ/commit YOK; damga ölçüldü (2026-11-01T05:13). KALITE raporuyla örtüşme tamamlayıcıdır (hız ↔ kalite aynı teklifin iki yüzü).

## İşlenme (gelen-kutu borç kapanışı, 2026-11-01 16:44)

- **HIZ-01 — işlendi:** ölçüm tabanı senteze girdi (manuel-ardıl duruş med 18,0 dk / n=62 / yeni-sekme 23 dk — 4 boyut tablosu) + OTODEV planına kök ağrı olarak yazıldı; kayıt: 9d42973, 4d4df25
- **HIZ-02 — işlendi:** watchdog teorik gecikmesi (~7 dk) sentez HIZ satırının kazanç dayanağı + OTODEV hedefi (devir toplam süresi ≤ 10 dk); kayıt: 9d42973, 4d4df25
- **HIZ-03 — işlendi:** bulgu sentez KOŞULLU gerekçesine girdi; tek-aktör kilidi OTODEV parça 1'de kira olarak koda indi; nöbet kira ölüyken devir alır, watchdog 2. derece yedek (koşul 7) — nöbetin devralma hakkını bırakması önerisi aynen benimsenmedi (dürüst not); kayıt: 9d42973, 4d4df25
- **HIZ-04 — işlendi:** sentez koşul 3 (iş ≤3 + nöbet 1 + devir 1/pencere + ~20 istek/dk + 429'da 10-15 dk geri çekilme) + OTODEV parça 3 + A1 yaması Y2 (istekDk 20 kodda); kayıt: 9d42973, 4d4df25, 0135a47
- **HIZ-05 — işlendi:** sentez koşul 3 (spawn CPU eşiği >%85 bekle) + OTODEV A1 yaması Y1 (varsayılan 85; test 84 OK / 85 RED); kayıt: 9d42973, 4d4df25, 0135a47
- **HIZ-06 — işlendi:** kazanç katmanları sentez HIZ satırına girdi (aktif 3-6x / uzak 10-100x) + yol haritası pilot-0 seçimi (scraper — en yüksek devir sıklığı); kayıt: 9d42973
- **HIZ-07 — işlendi:** yanma→devir sıklığı→duruş zinciri sentez PERFORMANS boyutuna + yol haritası 1 kütle diyeti planı + KD-a uygulaması (kural 47→38); kayıt: 9d42973, c265d99, f811936
- **HIZ-08 — işlendi:** echo-borç ilk-tur maliyeti sentez koşul 5 (mini tur her devirden önce) + OTODEV parça 2/5 + A1 kodu (echo 3-soru zorunlu, zincirKontrol kırmızısı — pano/devir-kira.mjs); kayıt: 9d42973, 4d4df25, 0135a47
- **HIZ-10 — işlendi:** dürüst beyan sentez Dürüst notlar'a aynen taşındı (aa1ac225 / 341-369 / 429-kesintisi kanıtlanamadı); kayıt: 9d42973
Bekleyen: HIZ-09 — fork-deseni önerisi senteze/plana girmedi (OTODEV Paseo create_schedule yolunu seçti); [insan]/plan kuyruğunda.
