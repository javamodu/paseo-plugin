# PANEL-ANA-1 FAZ-P — Teslim Raporu (yazıcı: glm53u-claude/glm-5.3 ajan 3f3584c0-aa80-44f4-a71d-bf82c9b7671e)

- Tarih: 2026-11-04 07:08 (Get-Date ile ölçüldü) · **EK 07:20 (aynı gün — FAZ-P EK yoklama kendine bakma; Get-Date ile ölçüldü)** · **EK DÜZELTME 07:57 (Get-Date ile ölçüldü — koordinatör canlı casut ölçümü EK(2)'yi çeliştirdi)**
- Koordinatör: KURMAY-1 (8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7)
- Dalga: PANEL-ANA-1 FAZ-P — TASARIM MODERNİZASYONU (kullanıcı 2026-11-04: «chat paneli daralt en geniş sağdaki panel olsun .. minimal komplat yap okunaklı olsun chat yazıları .. sayfa geneli tasarım dili kötü eski ve modern değil ... akıcı net profesyonel arayüz yap»). Yön SSOT: plans/TASARIM-MANIFESTOSU.md REVİZYON 2026-11-04 bloğu (§1 KOMPAKT-OKUNAKLI · §2 MİNİMAL RİTİM · §2a KOLON DOKTRİNİ) — koordinatör yazdı, dalga o revizyona göre kapatıldı. DAVRANIŞ DEĞİŞMEZ (FAZ-O mekanizmaları — oturum sekmeleri, 4-ikon menü, transcript, POST/token Ayarlar — mantık hunk 0; yalnız GÖRÜNÜŞ + genişlik).

## Kapsam (2 dosya)

| Dosya | Değişim | Özet |
|---|---|---|
| pano/ordu-panosu.html | ~92 satır değişim (CSS + sabit + anahtar + aria) | (1) **§2a KOLON DOKTRİNİ**: --sagW 320→560 (SAĞ sekmeli EN GENİŞ); KENAR.sag 260-460 → **320-760** (sol 200-360 + 240 AYNEN); splitSag aria-valuenow 320→560; JS fallback 320→560 (2 yerde); media 900-1279 sag 280→**420** (orta ekranda da sağ en geniş). (2) **ESKİ KAYIT EZMESİN**: localStorage anahtar sürümü «ordu-solW2»/«ordu-sagW2» (kaydet ×2 + oku ×1 — eski «ordu-solW»/«ordu-sagW» literali okunmaz/yazılmaz; splitter mekanizması + kalıcılık + resize kenetleme AYNEN). (3) **§1 KOMPAKT-OKUNAKLI**: baz font 15→**13px** + line-height 1.55→1.5; bolum-etiket 18→15px; sekme 15→13px; ağaç 15→13px (satır 32px aynen); oturumKart 15/16→13/15px. **CHAT BALON 15px/1.55 AYNEN** (okunaklılık şart — kullanıcının açık sözü); composer textarea 15px AYNEN (ana girdi). (4) **§2 EKONOMİK ritim**: main padding 12→10px; .bolum 16px 20px 20px → 10px 12px 12px; #sekmeGovde 10px 16px 16px → 8px 12px 12px; #sol>.bolum üst nefes 16→12px. (5) **İç içe kutu AZALT**: .chatListe FLAT yüzey (border/background/radius SÖKÜLDÜ — .bolum kutusu içinde ikinci çerçeve kalktı; flex/gap 6/overscroll/scrollbar zinciri AYNEN). (6) **§2a chat DAR**: balon genişlik TAVANI max-width:92% → **min(92%, 660px)** (kullanıcı + ajan balonu — geniş kolonda tavan + kalan boşluk kenarda nefes; dar görünümde %92 doğal dolgu). (7) **§4 modern dil (mevcut tokenlarla)**: --radius 6/4/4 → **10/8/6** (yumuşak/uyumlu); .gorunumSekme PILL (999px; menü gap 4→6); .composerBar yuvarlak 16px + padding 6px 8px; .composerIkonBtn + #composerGonder 50% yuvarlak; hedef select PILL 999px. YENİ renk/@keyframes/box-shadow/dış URL YOK (§4 grep kanıtı). (8) Başlık yorumuna FAZ-P bloğu eklendi (izlenebilirlik). |
| pano/ordu-panosu.test.mjs | ~84 satır değişim (FAZ-P) + **FAZ-P EK: test 5 satır ~148 bilinçli pin güncellemesi (hepsiniYukle imzası + Promise.all) + 51v bloğu YENİ** | **51u YENİ** (19 kaynak pini: §2a KENAR/varsayılan/anahtar W2 + kalıntı-W-YOK + mekanizma AYNEN + balon tavanı her iki balonda + media 420 · §1 baz 13 + balon 15 AYNEN + kart ölçeği · §2 chatListe FLAT + ekonomik dolgular + 44px korunur · §4 radius + pill/yuvarlak ailesi + yeni-renk/keyframes/gölge 0 · DEĞİŞMEZLER 899 istif + veri katmanı + klavye/drag + aria-valuenow=560) + **26 ok() pininde dürüst güncelleme** (satır no'lu liste aşağıda; 7 test bloğu). |

## Kanıt (yazıcı koşumu — gerçek çıkış kodları + çıktı dosyaları)

- `node --test pano/ordu-panosu.test.mjs`: **tests 69 · pass 69 · fail 0, EXIT=0** (çıktı %TEMP%\fazp-t4.txt)
- `npm test` (pano/): **80/80 pass, NPM_EXIT=0** (çıktı %TEMP%\fazp-npm.txt; ℹ pass 80 · fail 0 — 51u ile 79→80)
- `node --check` her iki dosya SYNTAX_OK; tek-kullanımlık script KALMADI (bash heredoc append — kalıcı dosya YOK).
- **Kalıntı taraması** (grep, eşleşme 0 = EXIT=1): sagW:320 · 260, max: 460 · max-width:92% · font-size:18px · padding:16px 20px · --radius:6px · `taraf + "W"` (sürümsüz) · aria-valuenow="320" · --sagW:280px — HİÇBİRİ kaynakta yok.
- **DOKUNULMADI**: pano/server.js · pano/konusma-oku.mjs · d1a/d1b (git status pano/ = yalnız 2 M dosya; GÖREV SINIRI). 4937'ye dokunulmadı (yalnız HTML değişti — koordinatör yenileme ölçer; restart GEREKMEZ).
- **Davranış hunk denetimi**: JS tarafında değişen SATIRLAR yalnız — KENAR sabiti (genişlik aralığı) · «W2» anahtar adı · 560 fallback · ilgili yorumlar. splitterKur/genislikKenetle/genislikUygula/pointer/klavye/resize MANTIĞI harfi harfine AYNEN.

## Bilinçli pin değişimleri (satır no'lu — FAZ-P öncesi konumlar)

1. **test 10 (satır ~153-154):** blok başlığı FAZ-H → FAZ-P REVİZYON; baz 15px → 13px.
2. **test 10 (satır ~155):** bolum-etiket 18px → 15px (§1 başlık bandı).
3. **test 10 (satır ~160):** radius 6/4/4 → 10/8/6 (§4 yumuşak).
4. **test 10 (satır ~161):** bolum padding 16px 20px → 10px 12px (§2 ekonomik).
5. **test 10 (satır ~162):** line-height 1.55 → 1.5.
6. **test 10d (satır ~197):** --sagW:320px → 560px (§2a SAĞ EN GENİŞ).
7. **test 10d (satır ~214):** splitSag aria-valuenow 320 → 560.
8. **test 10d (satır ~216-217):** kaydet/oku «W» → «W2» + eski-W-YOK ek kontrolü.
9. **test 10d (satır ~225):** KENAR sabiti sag 260-460 → 320-760 (sol aynen).
10. **test 10e (satır ~237):** sekme etiket 15px → 13px (satır 34px aynen).
11. **test 10e (satır ~239):** agacAjan 15px → 13px (32px/nokta 8px/girinti 12px aynen).
12. **test 10e (satır ~247):** varsayılan --sagW 320 → 560.
13. **test 10e (satır ~248):** KENAR sabiti (10d ile aynı değer).
14. **test 10e (satır ~249):** splitter fallback 240/320 → 240/560.
15. **test 10e (satır ~250):** media 900-1279 sag 280 → 420.
16. **test 10e (satır ~256):** main padding 12px 12px 12px → 10px (border-top pini aynen).
17. **test 51h (satır ~1536):** ana sekme etiket 15px → 13px (34px aynen).
18. **test 51j (satır ~1598):** ağaç etiketleri 15px → 13px.
19. **test 51j (satır ~1599):** ağaç 15px ailesi → 13px (agacGrupBas kalıntı 0 aynen).
20. **test 51l (satır ~1712):** baz 15px/1.55 → 13px/1.5.
21. **test 51l (satır ~1713):** bolum-etiket 18px → 15px.
22. **test 51l (satır ~1714):** ağaç ölçeği 15px → 13px.
23. **test 51l (satır ~1717):** ana şerit sekme 15px → 13px.
24. **test 51l (satır ~1722):** bolum padding 16px 20px 20px → 10px 12px 12px + üst nefes 16 → 12px (çiftli-seçici-YOK pini aynen).
25. **test 51l (satır ~1723):** sekmeGovde 10px 16px 16px → 8px 12px 12px.
26. **test 51m (satır ~1746):** chat-kullanici max-width 92% → min(92%, 660px) (§2a DAR tavan; renk/hizalama pinleri aynen).

## Bilinçli kararlar

1. **Kolon doktrini mekanizmayı değiştirmez:** DOM düğüm sırası + grid-column 1/3/5 + 899 istif AYNEN; yalnız --sagW/KENAR/aria değerleri yeni ölçeğe taşındı (FAZ-O EK-3 mirası korunur).
2. **Anahtar sürümü W2 seçildi** (brief'in önerdiği yol): eski «ordu-sagW» 320'lik kaydı yeni 560 varsayılanını EZMEZ — eski anahtar hiç okunmaz/yazılmaz; mekanizma (drag/pointer capture/±16 klavye/bitince kaydet/resize kenetleme) harfi harfine AYNEN.
3. **Balon tavanı tek kural:** min(92%, 660px) — geniş kolonda 660px tavan + kalan boşluk kenarda nefes; dar görünümde %92 doğal dolgu (ek merkezleme kuralı EKLENMEDİ — en küçük dürüst değişiklik).
4. **chatListe FLAT:** .bolum zaten kutu — içindeki ikinci çerçeve söküldü (§2 «iç içe kutu katmanı YOK; düz yüzey + ince ayırıcı»); liste kaydırma/gap/overscroll/role=log AYNEN.
5. **Chat balonu 15px/1.55 KORUNUR:** §1 REVİZYON'un açık şartı «okunaklı olsun chat yazıları» — kırpma YOK; baz 13px'e inen yüzler UI kromu (sekme/ağaç/kart/başlık). Composer textarea 15px aynen (ana girdi).
6. **Modern dil mevcut tokenlarla:** radius 10/8/6 + pill 999px + yuvarlak 50% + composerBar 16px — YENİ renk/@keyframes/box-shadow 0 (51u grep pini; §4 çerçevesi).
7. **44px coarse KORUNUR (K-0061):** pointer:coarse bloğu + --min-dokunma aynen; fine kompakt 34/32/40 aynen.
8. **Media 900-1279 sag 420:** sol 200 aynen — orta ekranda da SAĞ en geniş (§2a tutarlılığı).

## Yapamadım (koordinatör kapanışında)

- Canlı DOM doğrulaması + ekran kanıtı PNG (koordinatör — yenileme yeterli; restart GEREKMEZ, yalnız HTML değişti)
- Tasarım kapısı görsel kabulü (K2 — TASARIM-MANIFESTOSU §KAPİ: kullanıcıda)
- Commit (tek elden koordinatör oturumu)

## Dürüst notlar

1. **68→69 pano test** (51u eklendi); npm 79→80. Kırılan 7 bloktaki 26 pin dürüstçe güncellendi (liste yukarıda) — hiçbiri sessiz geçiştirilmedi.
2. **Resize pencere-daraltma:** kayıtlı genişlik yalnız KENAR'a (320-760) kenetlenir — pencere genişliğine göre ek üst-sınır mantığı YOK (mevcut davranış AYNEN; yeni mantık eklendi — süre baskısı + «mekanizma AYNEN» şartı; koordinatör isterse ayrı dalga).
3. **Baz 13px'in kalıtım etkisi:** font:inherit ailesi (composer, ayar girdileri, düğmeler) 13px'e iner — bunlar UI kromu; §1 meta 11-12px bilinçli sınırın üstünde kalır.
4. **TASARIM-MANIFESTOSU §3 (büyük görseller) bu dalgada dokunulmadı:** graf yüzleri SAĞ panele taşınmış haldeydi; ölçek revizyonu yalnız §1/§2/§2a/§4 kapsamında uygulandı (brief'in 5 maddesi).
5. Emoji/sembol 0 · YENİ renk/keyframes/dış URL/webfont 0 · E12 geçişleri yalnız renk (aynen) · esc/localStorage anlamları AYNEN (pano-token/ordu-agac-*/CHAT_TAVAN/x-pano-token).

## İşlenme

`islenme: null` — koordinatör kapanışını bekler.

---

# FAZ-P EK — İSTEMCİ YOKLAMA KENDİNE BAKAR (aynı dalga · aynı 2 dosya)

**Kullanıcı canlı hata bildirimi** (2026-11-04): «sayfa yenileyip sürekli yeniden yüklüyor sıfırlanıyor sayfa». Koordinatör teşhisi: 30 sn'lik `hepsiniYukle` döngüsü her turda arayüzü baştan çiziyor; uçlar yavaşlayınca döngü gözle görülür SIFIRLANMA olur. Sunucu tarafı (TTL önbellek + uçuş birleştirme) paralel yazıcı 81fd702b'in — **server.js'e DOKUNMADIM**. İstemci ayağı bu EK'te.

## Kapsam (aynı 2 dosya)

| Dosya | EK değişim | Özet |
|---|---|---|
| pano/ordu-panosu.html | JS yalnız yoklama bölgesi | (1) **UÇUŞ KİLİDİ**: `yoklamaUcusta` — önceki turun fetch'i bitmeden yeni tur BAŞLAMAZ (senkron set → Promise.all ile 3 uç paralel → finally serbest). (2) **AYNI-VERİ ATLANIR**: uc bazlı parmak izi `SON_YANIT.{kadro,projeler,graf}` (JSON.stringify karşılaştırma; null = hiç yüklenmedi) — veri değişmedikçe render KOŞMAZ. (3) **GÖRÜNMEZ SEKME**: `document.hidden` iken yoklama atlar; `visibilitychange` ile dönüşte anında tur. (4) **HATA-BAYAT-KORUMA**: uç hatasında önceki başarılı veri ekranda KALIR (G/P/K=null + kırmızı yüz YALNIZ hiç yüklenmediyse — fail-closed ilk yükleme AYNEN). odakIcindeMi/esc/localStorage AYNEN. |
| pano/ordu-panosu.test.mjs | test 5 + 51v | test 5 (satır ~148) bilinçli pin: `async function hepsiniYukle()` imzası + `Promise.all([...])` koşulu. **51v YENİ** (6 kaynak pini + 9 vm senaryo): uçuş kilidi (ertelenmiş promise açıkken 2. hepsiniYukle = 0 uç çağrısı; çözülünce tek tur; finally hatada da serbest) · aynı-veri atlama (cekSayar 0 artış; parmak null→dolu geçişi) · değişen-veri çizer (P güncellenir) · document.hidden atlama · görünürlük dinleyicisi yakalanır (ctx.gorunurlukDinleyici) · hata-bayat-koruma (ilk hata kırmızı yüz + sonraki hata veriyi KORUR). |

## EK kanıtı (yazıcı koşumu)

- `node --test pano/ordu-panosu.test.mjs`: **tests 70 · pass 70 · fail 0, EXIT=0** (çıktı %TEMP%\fazpek-pano2.txt; FAZ-P 69 → 51v ile 70).
- `node --check` + vm.Script parse: her iki dosya SYNTAX_OK.
- **Diff denetimi**: html'de JS değişen satırlar YALNIZ yoklama bölgesi (yoklamaUcusta/SON_YANIT/document.hidden/visibilitychange/Promise.all) + FAZ-P tasarım satırları; splitter/oturum sekmesi/transcript/composer/token mantığına hunk 0.
- **npm tam süit** (pano/): **pass 82 · fail 2, NPM_EXIT=1** (çıktı %TEMP%\fazpek-npm.txt) — 2 kırık `mesaj-ucu.test.mjs` test 72/73: server.js kaynak pinleri (`if (!projelerUcus)` · `ucus.finally` · `projelerOnbellek` literal'leri) — **paralel yazıcı 81fd702b'in sürecindeki dosyalar (server.js + mesaj-ucu.test.mjs ikisi de M); bana ait değil, DOKUNMADIM** — koordinatör kapanış zincirinde o yazıcının yeşiline bağlanır.

## EK bilinçli kararlar

1. **Parmak izi JSON.stringify uc bazında**: her uc kendi yanıtını karşılaştırır — tek uc değişse yalnız o ucun render'ı koşar.
2. **Dürüst sınır notu (focus-edge)**: bir render odakIcindeMi yüzünden atlandıysa ve veri SONRA değişmediyse, aynı veri turları render'ı yeniden denemez («yalnız GERÇEK değişimde koşar» brief'ine harfi harfine bağlı). Kullanıcı etkileşimi (tıklama/sekme) kendi render'ını zaten tetikler.
3. **visibilitychange anında tur**: dönüşte 30 sn beklemez — koordinatörün «gözle görülür sıfırlanma» teşhisinin dönüş ayağı.
4. **Hata-bayat-koruma §8 ile uyumlu**: sunucu ölürse İLK yüklemede kırmızı yüz AYNEN (fail-closed korunur); BAYAT veri ekranda kalmaz kuralı — «bayat» tanımı uç HATASI değil, değişmiş veridir; hata anında mevcut veri dürüstçe kalır.

## EK yapamadım

- ~~npm tam süit yeşili~~ **EK DÜZELTME ile KAPANDI: npm 84/84 NPM_EXIT=0 (PERF-1 b7747c7 + parmak düzeltmesi sonrası)**
- Canlı DOM + ekran kanıtı (koordinatör) · commit (tek elden koordinatör)

---

# EK DÜZELTME — PARMAK İZİ UÇUCU META DIŞLANIR (koordinatör canlı casut ölçümü; 07:57 Get-Date)

**Tetik:** koordinatörün bağımsız canlı davranış testi (taze sekme 4937, render casutları) — ardışık 2 turda İKİSİNDE DE render koştu; EK(1) uçuş kilidi canlı çalışıyor, sorun yalnız EK(2) parmağında. **Kök neden:** parmak TÜM yanıtı JSON.stringify'lıyor; yanıttaki uçucu meta her turda değişiyor — projeler ucunda `olcumAniISO` her TAZE taramada yeni zaman (PERF-1 10 sn TTL → 30 sn yoklama her turda taze tarama) + `onbellek:true/false` flip; kadro ucunda server her istekte `new Date()` ISO basıyor (server.js:403; önbellek YOK o uçta). Sonuç: 30 sn döngüsünde parmak DAİMA farklı → «veri değişmedikçe render yok» ana döngüde İŞLEMSİZ. Hermetik 51v statik fixture bunu göremedi (fixture kendi yanıtı üretti — aynı kendine-referans ailesi, DERSLER'e aday).

**Düzeltme (aynı 2 dosya; hedef/sınır aynen):**

| Dosya | Değişim |
|---|---|
| pano/ordu-panosu.html | Parmağı yalnız UI'nın tükettiği VERİ üzerinden hesaplama: **projelerYukle** → `JSON.stringify(yeni.projeler ?? null)` (UI'da P üzerinden yalnız `P.projeler` okunur — grep kanıtı; `P.atlanan` UI'da kullanılmıyor → parmağa girmez; P ataması TAM yanıt AYNEN). **kadroYukle** → `const { olcumAniISO: _ucucuOlcum, ...kadroVerisi } = yeni; JSON.stringify(kadroVerisi)` (K = TAM yanıt AYNEN). **grafYukle** → AYNEN (`/api/graf` statik GRAF_JSON'ı ham servis ediyor — uçucu alan YOK; server.js:249-252 kaynağından teyit). «onbellek» bayrağı parmağa ASLA girmez (projeler pini yalnız `yeni.projeler`; kadroda alan yok). Header yorumu yeni semantiğe güncellendi. |
| pano/ordu-panosu.test.mjs | 51v pin (2) dürüst güncelleme (uçucu-meta-dışlama pinleri: `yeni.projeler ?? null` + olcumAniISO destructuring + graf TAM-yanıt 1×) + senaryo 1/4 stub'ları GERÇEK yanıt şekline sarmalandı (`{ projeler: [...], olcumAniISO, onbellek }`) + **senaryo 5 YENİ (canlı casut yakalananın birebir vm hali)**: (a) yalnız olcumAniISO/onbellek değişti, projeler aynı → render YOK (agacYaz 1 + govdeYaz 1); (b) olcumAniISO değişti + projeler kaydı değişti → render KOŞAR (agacYaz 2 + P güncellenir). |

## EK Düzeltme kanıtı

- `node --test pano/ordu-panosu.test.mjs`: **tests 70 · pass 70 · fail 0, EXIT=0** (çıktı %TEMP%\fazpek-duzelt.txt).
- `npm test` (pano/): **84/84 pass, NPM_EXIT=0** (çıktı %TEMP%\fazpek-duzelt-npm.txt; PERF-1 b7747c7 ile paralel yazıcının 72/73 testleri yeşil + benim düzeltmem).
- **Diff denetimi**: html'de değişen satırlar YALNIZ parmak bölgesi (3 loader + header yorumu) + zaten teslim edilmiş FAZ-P tasarım satırları; splitter/oturum sekmesi/transcript/composer/token mantığına hunk 0.
- `git status pano/`: yalnız 2 M dosya (ordu-panosu.html + ordu-panosu.test.mjs) — server.js'e DOKUNULMADI.

## EK Düzeltme bilinçli kararlar

1. **Parmağın tanımı «UI'nın tükettiği veri»**: P/K atamaları TAM yanıt (değişmedi) — yalnız karşılaştırma çekirdeği daraldı. UI alan tüketimi grep ile kanıtlandı: `P.projeler` · `K.birlikler` + `K.rolAtamasi`.
2. **kadroda destructuring yolu**: `{ olcumAniISO: _ucucuOlcum, ...kadroVerisi }` — tek uçucu alan olcumAniISO.
3. **graf aynen**: statik dosya — dokunma (koordinatör brief'i).

## İşlenme

`islenme: ISLENDI` — KURMAY-1 koordinatör kapanışı, 2026-11-04 08:12 (+03:00, Get-Date ile ölçüldü):

1. **Bağımsız tam kapı**: node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs = tests **308 pass 308 fail 0 EXIT=0** (%TEMP%\fazp-son-kapi.txt; FAZ-P tasarım + EK + EK Düzeltme + PERF-1 b7747c7 sonrası birleşik disk durumu; gerçek çıkış kodu okundu).
2. **Diff denetimi**: html değişimi 3 bölgede — FAZ-P tasarım bloğu (CSS ölçek + kolon + FLAT + radius/pill) · EK döngü bloğu (uçuş kilidi + parmak izi + hidden) · EK Düzeltme parmak çekirdeği (`yeni.projeler ?? null` · kadro destructuring · graf aynen); splitter/oturum sekmesi/transcript/composer/token mantığı hunk 0; server.js'e hunk 0 (PERF-1 ayrı commit'te).
3. **Hijyen (HEAD-baseline ile aynı değişmezler)**: yasak sembol 0 · dış URL 0 (w3.org SVG hariç) · x-pano-token 2 · CHAT_TAVAN 200 2 · maxlength 4096 · pano-token/ordu-agac-secili aynen · @keyframes 1 (mevcut) · balon 660 tavanı 2 (chat-kullanici + chat-sistem) · eski %92 0 · --sagW 560 + W2 anahtarları (ordu-solW2/ordu-sagW2; eski anahtarlar hiç okunmuyor).
4. **Canlı DAVRANIŞ kanıtı (4937, PID 17092, düzeltme sonrası taze yükleme — spy testi: agacYaz/govdeYaz/grafYaz/composerHedefGuncelle sarmalandı, sayıçla)**: iki ardışık `hepsiniYukle()` turu — **tur2 = 0 render** (4 işlevin hiçbiri çağrılmadı; parmak izi mekanizması çalışıyor) · **tur1'in tek render'i GERÇEK veri değişikliği**: sunucu tarafında iki tarama 11 sn arayla karşılaştırıldı, alan düzeyinde fark dizisi gerçek filo akışı (D-Vibecode-ordu sonEtkinlikISO 05:01:51.231Z → 05:02:29.541Z · chromex durumSayilari idle→running · sonAjanlar) — yani sıfır-render değil DOĞRU-render hedefi ölçüldü · **uçuş kilidi** (eşzamanlı çağrıda `yoklamaUcusta=true`, finally sonrası `false` — ölçüldü).
5. **Canlı TASARIM ölçümleri (1280 CSS viewport, DOM'dan)**: kolonlar **sag 560 (x=710) EN GENİŞ · orta 448 (x=256) · sol 240 (x=10)**; baz 13px/1.5 (satır 19.5px) · bolum-etiket 15px · ağaç/sekme/kart 13px · **chat balonu 15px/1.55 + max-width min(92%,660px)** (her iki taraf) · chatListe FLAT (border 0 · background transparent · padding 0) · gorunumSekme pill 999px · composerBar 16px · ikon düğmeleri 50% · radius 10/8 · splitSag aria-valuenow 560 · KENAR sol 200-360 / sag 320-760.
6. **Media 900-1279 (1100'de taze yükleme)**: `--sagW:420` ölçüldü; dürüst nüans: pencere resize'ı sonrası dinleyici hesaplanan değeri INLINE pinler ve medyayı ezer (mevcut davranış AYNEN — yazıcı dürüst notu 2 kabul); 1100'de orta track 448 > sag 420 — §2a doktrini orta kolonun genişleyip kenara nefes bırakmasını tarif eder, chat görselini 660 balon tavanı sınırlar.
7. **Mobil 390x844**: sıra chat (y=8) → sag → sol; yatay taşma YOK; GÖNDER 40px (K-0061 §5 taban) · select 44 · ağaç satır 32 (fine pointer; gerçek dokunmada 44).
8. **Ekran kanıtı**: raporlar/ordu-panosu-2026-11-03/ekran-kanit-fazp-tasarim-ek-2026-11-04.png (271.003 bayt · 1918x1110 fiziksel = 1534x888 CSS @1.25 DPR · PNG imzası 89 50 4E 47 0D 0A 1A 0A + IHDR boyutları doğrulandı). Dürüst not: Read aracı PNG'yi 2 kez boş döndürdü — görsel inceleme koordinatörde mümkün olmadı; imza + boyut + kapsamlı DOM ölçümleriyle doğrulandı, K2 görsel kabul KULLANICIDA (TASARIM-MANIFESTOSU §KAPİ).
9. **Kullanıcı belirtilerine istemci yarısı**: «sayfa yenileyip sürekli yeniden yüklüyor sıfırlanıyor» — sunucu yarısı PERF-1 (b7747c7: TTL + uçuş-birleştirme, kar kürenesi kapandı); istemci yarısı bu dalganın EK + EK Düzeltme'si (üst üste binen yoklamalar → uçuş kilidi; her turda veri değişmediği halde render → parmak izleri; gizli sekmede boşa yoklama → hidden atlama + görünürlükte anında tur). Webview'in kendisini yeniden başlatan host-tarafı nedenler bu panonun kapsamı dışında.
10. **DERSLER adayı (kuyruğa)**: kendine-referans fixture ailesi — statik fixture kendi yanıtını ürettiği için uçucu-meta (olcumAniISO/onbellek) tuzağı hermetik testte görünmez; canlı davranış casudu (spy + sunucu tarama diff'i) yakaladı.
11. **Yazıcı dürüst notları kabul** (odak kenarı etkileşim kendi render'ını tetikler · media nuance · §3 dokunulmadı).
12. TASARIM-MANIFESTOSU REVİZYON 2026-11-04 (§1 kompakt-okunaklı · §2 ekonomik · §2a kolon doktrini · meta-kural «ilkeyi değiştirmek yalnız kullanıcı emriyle») bu dalganın SSOT'u — aynı commit'te. Tek elden commit bu kapanışta (CODEMAP dahil).
