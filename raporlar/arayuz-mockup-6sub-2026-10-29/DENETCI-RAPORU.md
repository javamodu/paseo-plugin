# DENETÇİ RAPORU — ARAYÜZ İDEAL MOCKUP (6-subagent çalışması)

**Tarih:** 2026-10-29 · **Rol:** DENETÇİ (bağımsız puanlama) · **Yöntem:** fail-closed kaynak doğrulaması — her §3/§5 maddesi 4 dosyada grep/dizin taramasıyla kanıtlandı; yazar raporlarındaki VAR iddiaları kabul EDİLMEDİ, kaynakta tek tek doğrulandı. Görev ID'leri `plans/gorev-grafigi-2026-10-26.json` (graf v14) ile çapraz doğrulandı; run ID'leri repo çapında grep ile doğrulandı.

**Değerlendirilen dosyalar:**
- V1 = `raporlar/arayuz-mockup-6sub-2026-10-29/variant-1-komuta.html` (826 satır)
- V2 = `raporlar/arayuz-mockup-6sub-2026-10-29/variant-2-harita.html` (846 satır)
- V3 = `raporlar/arayuz-mockup-6sub-2026-10-29/variant-3-sahne.html` (807 satır)
- V0 = `raporlar/pano-mockup-dalga1-2026-10-29/mockup.html` (703 satır — mevcut «kumanda konsolu», variant-0 olarak puanlandı)

---

## 1. PUAN TABLOSU (her hücre 0-2 · kanıt: satır no / desen)

| Madde | V1 komuta | V2 harita | V3 sahne | V0 mevcut |
|---|---|---|---|---|
| **§3.1 sol graf sütunu** | **2** — `#grafAlani` satır 285; fazGruplari() satır 546-559 «(faz yok)» en sonda; `.gSatir` min-height 44 (satır 23+83); sec(id) satır 703; 13 gerçek ID | **2** — `#sol` satır 290; agacYaz() satır 483-506; `.satir` 44px (satır 111); 24 gerçek ID + 15 gerçek kenar (satır 444-446) | **2** — `.graf` satır 329; faz gruplu satır 493-500; `.satir` 44px (satır 110); 14 gerçek ID; DC-S7*/DC-S10* listede-yok dürüst işaretli | **0** — YOK: görev listesi/faz grubu/sec(id) hiç yok (GOREVLER dizisi yok; sol sütun run kartları, satır 336-467) |
| **§3.2 sağ detay paneli** | **2** — `#detayAlani` satır 300; kapsül kart satır 601-634: ad/faz/durum/bağımlılık/ajan/kanıt/kapı/LOC + İNSAN-MAKİNE OKUR + kopyala | **2** — `#sag` satır 334; detayYaz satır 721-762: tüm alanlar + «TUVALDE BUL» + SSOT dipnot | **1** — içerik TAM (satır 555-567, sahte hash üretilmez satır 543) ama detay MERKEZ sütunda (satır 336-342); ≥1024'te sağ sütun onaylara gidiyor — «SAĞDA detay» sözünden sapma | **0** — YOK: kapsül kart yok; sağ sütun onay kartları (satır 470-515) |
| **§3.3 dört durum boyutu** | **2** — aktif halkalı-nabız satır 87+295; durum renk+nokta her satır; onay bölümü satır 386-409 (3 gerçek); genel state satır 259-267 (13-alt-küme dürüst kapsamlı) | **2** — aktif nabız ağaç+tuval (satır 498+537); durum renk; onay paneli satır 379-382 (4 gerçek kapı); genel state satır 267-275: 40/24/16/1/30/9/29 — SSOT ile BİREBİR doğru | **1** — durum renk+nokta ✓; onay bölümü ✓ (satır 412-442, 3 gerçek); AMA genel state «aktif 1» (satır 284) SSOT'ta aktif=16 ile ÇELİŞİYOR, etiketsiz | **1** — onay bölümü ✓ (satır 470-515, 4 gerçek kart); run kartlarında durum rozetleri; görev sayımı/aktif görev boyutu YOK; pill'ler sağlık metric (satır 325-330) |
| **§3.4 kalp yüzü** | **2** — ordu şeridi 6 rol satır 272-279; 4 run kartı satır 315-347; defter satır 412-423; komut kutusu satır 426-441 | **2** — ordu 6 rol satır 280-287; 2 run kartı (run-f911b84d GERÇEK + «dispatch-örnek» etiketli kurgu) satır 359-378; defter satır 397-410; komut satır 383-394 | **2** — ordu 6 rol satır 304-324; 2 run kartı satır 345-360; defter + İNSAN/MAKİNE OKUR + kirmiziYuz demosu satır 399-407; komut satır 378-396 | **1** — run kartları ✓ (4 adet) + defter ✓ + komut ✓; AMA ordu şeridi (roller) YOK |
| **§3.5 izle/denetle/yönet** | **2** — 3 sekme satır 308-312; DENETLE tablosu gerçek değerlerle (467/467, x=0, ölçüm çifti 166→206) satır 350-367; YÖNET şablonlar satır 370-381 | **2** — 3 edim satır 260-265; denetim paneli satır 340-356 (gerçek kanal satırları); YÖNET komut üretimi satır 812-830 | **2** — 3 sekme + ok-tuşu klavye satır 292-296+593-597; DENETLE gerçek değerler satır 363-376; YÖNET satır 378-396 | **1** — İZLE yüzü (run kartları) + YÖNET (komut kutusu) dolaylı var; DENETLE görünümü YOK; edim sekmeleri YOK |
| **§5.1 örnek-veri şeridi** | **2** — satır 237-242: neyin gerçek (graf kökleri, kapanış değerleri) neyin ÖRNEK (ajan, mockup-run) ayrıntılı | **2** — satır 249-253: gerçek/ÖRNEK ayrımı + 0 dış istek | **2** — satır 276: 14/40 kapsamı + ÖRNEK sınıfları sayılmış | **2** — satır 309: blanket «tüm sayılar ÖRNEK» |
| **§5.2 ölü buton yok** | **2** — 0 ölü: tek delege satır 701-732 (gSatir/bagimliChip/modBtn/edimTab/mdKopyala/fisKopyala/yenile/data-kopyala/data-not) + klavye satır 734-741 | **0** — 6 ÖLÜ BUTON: `.ordu-kart` satır 281-287 tık işleyicisi YOK (hiçbir addEventListener/data-delege bunları yakalamıyor) | **2** — 0 ölü: [data-bilgi] click+keydown satır 641-646; tüm butonlar bağlı | **2** — 0 ölü buton: kopyala/kart/durdur/resume/komut bağlı (satır 591-621) — ama defter akışı JS hatasıyla kırık (bkz. bulgu 3) |
| **§5.3 kopyala gerçek / onay cümlesi güvenliği** | **2** — clipboard+execCommand satır 527-540; onay cümlesi statik (satır 393) yalnız kopyalanır; JS kartMd/fisMd onay cümlesi ÜRETMEZ (satır 654-671) | **2** — kopyala+başarısızlık mesajı satır 461-480; JS önerileri (replan --esik, inspect) onay cümlesi DEĞİL (satır 812-824); EK-2 notu satır 391 | **2** — clipboard+execCommand satır 611-627; onay komutu statik (satır 420); JS yalnız dispatch üretir (satır 571+698) | **2** — clipboard+execCommand satır 572-588; onay cümlesi statik (satır 481) kopyala; JS üretmez |
| **§7.1 temel-1 uygunluk** | **2** — anaGrid satır 66-71: SOL graf/SAĞ detay ana yerleşim; 4 boyut tamam | **2** — sol ağaç/sağ detay + merkez DAG; 4 boyut tamam | **1** — sol graf ✓; detay merkezde; «aktif» sayısı yanlış | **0** — Temel 1 TAMAMEN YOK (kullanıcı şikayetinin kökü) |
| **§7.2 kalp bütünlüğü** | **2** — tüm bileşenler + edim sütunu | **2** — tüm bileşenler + gerçek run verisi | **2** — tüm bileşenler + çift-okur defter | **1** — 4/4 bileşenin 3'ü; ordu şeridi yok |
| **§7.3 okunabilirlik** | **2** — tipografi hiyerarşisi, tabular-nums, mono/sans ayrımı, iki okur modu | **2** — kompakt mono + blueprint netliği; durum renk sistemi | **2** — terminal estetiği tutarlı; amber vurgu disiplinli | **2** — kart/detay hiyerarşisi net |
| **§7.4 mobil davranış** | **2** — <640 tek kolon + sec'te detaya kaydırma (satır 648-650); tüm butonlar 44px (satır 205) | **1** — pinch/pan iyi (satır 616-653); AMA `.bagim-btn` 26px (satır 176-178) 44px kuralı ihlali | **1** — 44px tamam; AMA `.onaylar`/`.onay` sınıf uyumsuzluğu 640-1023'te onayı 288px sütuna sıkıştırır (satır 88-94 vs 412) | **1** — tek kolon var; `.kopyala-btn` 36px (satır 188) 44px ihlali |
| **§7.5 dürüstlük** | **1** — görev ID/faz/bağımlılık/ölçüm gerçek; AMA run ID'leri (1ee8d2/9b2e17/c07d31/mock6) repo'da YOK + «önceki rapordan kopya» ibaresi önceki MOCKUP'ı kastediyor; gerçek zincir hash'leri (aefc03a/f56052b/ea78bd3) uydurma run ID'ye bağlanmış (satır 317-344) | **2** — en dürüst: run-f911b84d GERÇEK (graf S1 ile örtüşür); kurgu kart açıkça «dispatch-örnek»; kısaltma beyanları (satır 414-416) | **2** — «sahte hash ÜRETİLMEZ» (satır 543) en güçlü dürüstlük deseni; run kartları ÖRNEK etiketli | **2** — blanket ÖRNEK şeridi; onay kartları gerçek (S0A_START dahil — DC-H1 paketinde doğrulandı) |
| **§7.6 görsel his** | **2** — camgöbeği/menevşe + cam barlar (kullanıcının DALGA-1'de onayladığı dil) | **2** — blueprint koyu-mavi, köşe işaretleri, tarihsel ada çizgisi — ayırt edici | **2** — amber/yeşil terminal sahnesi — ayırt edici | **2** — DALGA-1 dili (V1'in kaynağı) |
| **TOPLAM /28** | **27** | **25** | **24** | **17** |

**Görev-ID çapraz doğrulaması (graf v14):** V1 13/13, V2 24/24, V3 14/14 gerçek — uydurma görev ID YOK. Faz adları (DC/F0..F4), durumlar (HAZIR/BEKLE/KAPALI), bağımlılıklar, LOC değerleri ve kanıt hash'leri (80fdb4a, 45bd046, bbbd393, 280d881, 26a0561, e70dd55) birebir örtüşüyor. V2'nin 15 kenarı graf `kenarlar` dizisiyle birebir; V2'nin genel state sayımları (aktif 16 · HAZIR 1 · BEKLE 30 · KAPALI 9 · İNSAN kapılı 29) SSOT'tan bağımsız yeniden sayıldı — TAMAMEN DOĞRU. Onay kartı ID'leri (rpl-03579e06, D-1b, K-0044, S0A_START) gerçek.

---

## 2. KIRMIZI BULGULAR (matris ihlali / ölü buton / uydurma veri / kırık kod)

1. **V0 — §3.1 SOL GRAF SÜTUNU YOK** (`mockup.html` tümü): görev listesi, faz grupları, sec(id), GOREVLER verisi hiç yok; sol sütun «Bugün ne koştu» run kartları (satır 336-467). Kullanıcının Temel 1 beyanını karşılayan sıfır öğe. **«Temel 1 eksik» iddiası DOĞRULANDI.**
2. **V0 — §3.2 SAĞ DETAY YOK** (`mockup.html`): kapsül kart / görev detay paneli yok; sağ sütun onay kartları (satır 469-515).
3. **V0 satır 689 — JS ReferenceError (kırık özellik):** `defter.insertBefore(satir, imcec.parentElement);` — `imcec`, `imlec` (satır 672) değişkeninin YAZIM HATASI; strict mode'da her 4,8 sn'lik tick ReferenceError fırlatır → kanıt defteri akışı (yeni satır ekleme) HİÇ ÇALIŞMAZ. Ölü buton değil ama ölü özellik.
4. **V2 satır 281-287 — 6 ÖLÜ BUTON (matris §5.2 ihlali):** `.ordu-kart` butonları (KOMUTAN, YAZARI-1/2/3, DENETÇİ, GÖZLEMCİ) hiçbir tık işleyicisine bağlı değil — button stilleri cursor:pointer + hover verir, tıklayınca hiçbir şey olmaz. V2'nin tek ama çekirdek dürüstlük ihlali (0 puanın sebebi).
5. **V3 satır 284 — veri çelişkisi:** genel state «aktif 1» — graf v14 SSOT'ta `aktif:true` düğüm sayısı **16** (DC zinciri; V2 satır 270 «AKTİF 16» doğru, V1 «aktif 10» gösterilen-13 alt kümesiyle dürüst kapsamlı). Etiketsiz, SSOT ile çelişen sayı — «aktif olanlar» boyutunu zehirler.
6. **V3 satır 88-94 vs 412 — CSS sınıf uyumsuzluğu:** `.onaylar` kuralları `.onay` sınıflı elemana hiç uygulanmaz → 640-1023px arası onay-bekleyenler bölümü 288px'lik sol sütuna sıkışar (yayılma kuralı ölü).

**SARI bulgular (ihlal değil, cilacıya not):**

7. **Uydurma run ID'leri:** `run-1ee8d2`, `run-9b2e17`, `run-c07d31`, `run-f65a4c` repo çapında YALNIZ mockup dosyalarında eşleşir (grep kanıtı) — v0'da uydurulmuş, V1/V3 devralmış. V3 şeridi «run kartları ÖRNEK» ile açıkça koruyor; V0 blanket ÖRNEK ile koruyor; **V1'de satır 331/338 «(önceki rapordan; kopya)» ibaresi önceki MOCKUP raporunu kasteder — gerçek run kaydı değil; okuyucuyu yanıltabilir (§7.5'te 1 puanın sebebi).** Gerçek run ID'leri repoda: run-f911b84d, run-1bcba32d, run-9b2607fc, run-16efb6ef, run-e0fe70c6, run-c0ea713b.
8. **V2 satır 176-178:** `.bagim-btn` min-height:26px — §4 44px dokunma hedefi kuralı ihlali.
9. **V0 satır 188:** `.kopyala-btn` min-height:36px — aynı ihlal.
10. **V1 satır 262:** durum dağılım pill'i «gösterilen alt küme» kapsamıyla sınırlı (13 görevden 10 BEKLE) — dürüstçe beyan edilmiş (title açıklaması var) ama final mockupta tam graf sayımına (V2 satır 271 deseni) geçilmeli.

**Onay cümlesi güvenliği (4 dosyada da TEMİZ):** hiçbir dosyanın JS'i onay cümlesi ÜRETMEZ/çalıştırmaz — V1 satır 393, V3 satır 420, V0 satır 481 statik HTML metni + kopyala; V2'de --confirm içeren string JS'te hiç yok. EK-2 dokunulmazlığı 4/4 dosyada korunuyor.

---

## 3. VARYANT SIRALAMASI

**1. V1-komuta (27/28)** — Temel 1'i ana grid olarak tam karşılayan tek iskelet değil ama en bütünsel: sol graf/sağ detay + 4 durum boyutu + kalp + üç edim + 0 ölü buton tek dosyada eksiksiz; kullanıcının DALGA-1'de görsel olarak onayladığı tasarım dili taşınmış. Tek zaafı run kartlarında uydurma run ID'lerinin «önceki rapordan kopya» muğlaklığı.
**2. V2-harita (25/28)** — veri doğruluğunda birinci (24 gerçek görev + 15 gerçek kenar + birebir doğru genel state + gerçek run ID) ve DAG tuvali (zoom/pan/pinch + kenar vurgusu + fail-closed demo) benzersiz bir katman; ama 6 ölü ordu-kart butonu matrisin çekirdek dürüstlük kuralını (%5.2) deliyor — cilacıda dakikalık onarım, sıralamada ağır yara.
**3. V3-sahne (24/28)** — dürüstlük desenleri en güçlü (sahte hash üretilmez; ÖRNEK etiketleme disiplinli) ve defter-çift-okur + kirmiziYuz demosu özgün; ama detayın merkez sütuna kayması, «aktif 1» veri hatası ve `.onaylar` CSS hatası §3 çekirdeğinde üç ayrı kıpırtı yaratıyor.
**4. V0-mevcut (17/28)** — kalp yüzü (run/defter/komut) güçlü ama kullanıcının «arayüz istediğim gibi değil» şikayetinin kaynağı kaynakta kanıtlandı: görev grafının tüm izi (sol liste, detay, görev durumları, edim sekmeleri, ordu şeridi) yok; üstelik defter akışını kıran JS yazım hatası taşıyor.

---

## 4. CILACIYA TAVSİYE — öge-bölge listesi (dosya:satıra indirgenmiş)

**İskelet ve yerleşim:**
1. **Ana iskelet:** V1 `.anaGrid` (variant-1-komuta.html satır 66-71: grid-template-areas «graf detay»/«graf edim»; 640/1024 kırılımları satır 69-70) — final mockupun Temel 1 iskeleti bu.
2. **Genel state şeridi:** V2 satır 267-275 (40 görev · aktif 16 · HAZIR 1 · BEKLE 30 · KAPALI 9 · İNSAN kapılı 29 · x=0 · HEAD) — tam graf sayımları; V1'in pill `title` açıklama deseni (satır 260-266) eklensin.

**Sol graf sütunu:**
3. **Satır yapısı:** V2 `.satir` (variant-2-harita.html satır 111-123: durum noktası + mono ID + aktif-nabız noktası + «K» kapı işareti + kesik ad) + V1'in seçim göstergesi (variant-1-komuta.html satır 85 `.gSatir.secili` border-left + satır 637-651 sec() seçim-kalır/darda-kaydır mantığı).
4. **Faz gruplama:** V1 fazGruplari() (satır 546-559) — «(faz yok)» en-sonda sıralaması + grup sayacı; V2'nin 24 görevlik veri seti (satır 418-443) kullanılmalı (V1'in 13'ü değil — kapsam geniş tutuluyor).

**Sağ detay / kapsül kartı:**
5. **Kapsül kartı gövdesi:** V1 detayYaz (satır 601-634) — alan seti tam (ölçüt/kapı/LOC/kanıt/İNSAN-MAKİNE OKUR çift yüz); V3'ün GERÇEK/ÖRNEK etiket sistemi (variant-3-sahne.html satır 142-145 + kullanım satır 542-546, sahte-hash-üretilmez dahil) kart içine aşılanmalı.
6. **Kapı kopyala:** V1 satır 628-630 (data-kopyala="kapi-metni" + gizli span deseni).

**Merkez/ikincil görselleştirme:**
7. **DAG tuvali:** V2 merkez bölümü (satır 297-332 arayüz + satır 508-664 mantık: yılan düzeni, tarihsel ada, viewBox zoom/pan/pinch, kenar-vurgusu sec()) — final mockupta graf görselleştirmesi bu tuvalden gelir; satır 612-613'teki setPointerCapture tuzak notu koda yorum olarak KORUNSUN. FAIL-CLOSED demosu V2 satır 313-319+683-692.
8. **Defter akışı:** V3 (satır 399-407 panel + satır 703-799 mantık: İNSAN/MAKİNE OKUR toggle + kirmiziYuz demosu); veri satırları V1'in gerçek kapanış satırlarından (satır 415-421).

**Kalp bileşenleri:**
9. **Run kartları:** V1 (satır 315-347: 4 kart, ölçüm satırı, data-not) — AMA run ID'leri gerçek run-f911b84d / run-9b2607fc ile değiştirilsin (V2 satır 359-368 gerçek-run kart deseni) veya V3 tarzı açık «ÖRNEK» rozeti takılsın.
10. **Ordu şeridi:** V1 satır 272-279 deseni (data-not'lu 6 orduChip — her tık bilgi verir); V2'nin görsel kompaktlığı (satır 76-86) alınabilir ama V2'nin ölü-buton hatası ASLA — butonlar mutlaka işleyicili.
11. **Onay kartları:** V1 satır 386-409 (3 gerçek kart + onay-komut kopyala deseni) + V0'nun 4. kartı S0A_START (mockup.html satır 505-512 — gerçek kapı, plans/uygulama-paketleri/DC-H1-2026-10-28/S0a.md'de doğrulandı).
12. **Komut kutusu / alt çubuk:** V1 satır 426-441 (DURDUR/RESUME bilgilendirme + komut-üretici + Enter-panoya) + V3'ün şablon butonları (satır 386-392: gece/kanal/tip/graf/dispatch).

**Cilacının ONARMASI gerekenler (yukarıdaki kırmızı/sarı bulgular):**
13. V2 satır 281-287: 6 ordu-kart butonuna V1'in data-not deseni (tık → bilgi) eklensin (ölü buton temizlenir).
14. V3 satır 284: «aktif 1» → «aktif 16» (SSOT); V3 satır 88-94: `.onaylar` → `.onay` sınıf düzeltmesi.
15. V2 satır 176-178: `.bagim-btn` min-height 26px → 44px; V0 satır 188 deseni (36px) finalde tekrarlanmasın.
16. V0 satır 689 `imcec` typo: V0 yalnız geçmiş referans — final iskelette kullanılmıyor; defter mantığı V3'ün satır 703-799 kodundan geliyor (orada aynı hata yok).

**Tema kararı:** ana dil V1 camgöbeği/menevşe (kullanıcının DALGA-1'de gördüğü ve onayladığı dil); V3'ün amber/yeşil token seti (satır 12-20) isteğe bağlı ikinci tema olarak düşünülebilir, kararı komutan alır.

---

*Denetçi notu: bu rapor tek yazım dosyasıdır (raporlar/arayuz-mockup-6sub-2026-10-29/DENETCI-RAPORU.md); başka hiçbir dosyaya yazılmadı, git kullanılmadı, sunucu/port/canlı sürece dokunulmadı. Tüm puanlar kaynak-düzeyi kanıtla verildi; yazar raporlarındaki iddialardan hiçbiri tek başına kabul edilmedi.*
