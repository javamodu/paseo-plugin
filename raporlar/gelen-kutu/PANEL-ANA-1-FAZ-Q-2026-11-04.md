# PANEL-ANA-1 FAZ-Q — Teslim Raporu (yazıcı: glm53u-claude/glm-5.3 ajan 3f3584c0-aa80-44f4-a71d-bf82c9b7671e)

- Tarih: 2026-11-04 11:09 (Get-Date ile ölçüldü)
- Koordinatör: KURMAY-1 (8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7)
- Dalga: PANEL-ANA-1 FAZ-Q — ağaç klasör adları + sol kolon kaydırma. Kullanıcı emirleri (verbatim): «soldaki sadece klasör adlarını neden yazmıyorsun uzun yazıyorsun sonuçta workspaces klasör adı ile başlıyor» + «ayrıva sol panel aşağı kaymıyor». İki belirti, iki kök neden — ikisini de koordinatör canlıda teşhis etti (brief 6103b852).

## Kapsam (3 dosya — görev sınırı birebir)

| Dosya | Değişim | Özet |
|---|---|---|
| pano/ordu-birlesim.mjs | +3 satır | **klasorAdi alanı (EKLEMELİ — mevcut alanlar AYNEN)**: projelerTara ajan döngüsünde `let klasorCwd = null` + İLK dolu `k.cwd` yakalanır (aynı dizindeki kayıtlar aynı yola işaret eder); proje kaydına `klasorAdi: cwd basename` (son ayraçlar temizlenir `replace(/[\\/]+$/,'')` + son `\`/`/` segmenti; boş = null). **Dash-bölme YASAK** — klasör adının kendisi tireli olabilir: 'woo-block' TEK segment'tir, 'block' DEĞİL. systemPrompt yanıta girmez AYNEN (dokunulmadı). |
| pano/ordu-panosu.html | ~39 satır | **(1) SOL KAYDIRMA (kök neden: #sol>.bolum flex:0 1 auto + overflow:hidden automatic min-height korumasını ÖLDÜRÜYORDU → .bolum 3842px içeriği 768px'e küçülüp kırpıyordu; #sol taşma görmediğinden kaydırma çubuğu doğmuyordu):** .chatListe deseni AYNEN — `#sol>.bolum { flex:1 1 auto; min-height:0; display:flex; flex-direction:column }` + `#agacAlani { flex:1 1 auto; min-height:0; overflow-y:auto; overscroll-behavior:contain }` + scrollbar ailesine #agacAlani EKLENDİ (8px + thumb) + `#agacHata`/`.logNot` esnek-olmayan alt çocuk olarak altta PINLENİR (hata yüzü kaydırma alanından bağımsız hep görünür — iyileşme). .bolum overflow:hidden + radius KORUNUR (kenar kırpma). MOBİL ≤899: `#sol>.bolum { flex:none }` + `#agacAlani { overflow:visible }` — .bolum doğal boyda, iç scroll YOK (sayfa kayar). **#orta'ya DOKUNULMADI** (şikayet yok; chatListe zaten bu desenle çalışıyor). **(2) AĞAÇ ADLARI:** projeEtiketi → `klasorAdi || projeAdi || "?"` (baslik GÖRÜNEN ADI ARTIK TAŞIMAZ — kullanıcı emri «sadece klasör adları»); agacYaz satır title → TAM kimlik hover'da yaşar: `dizin + [baslik VARSA] + "N çalışan · M ajan kaydı"` (tamTitle sabiti); ajanDugumHtml DOKUNULMAZ (FAZ-K doktrini «oturum isimleri ben paseo'da yazdığım isimleri kullan»); sekme adı + optgroup + konusmaSecGuncelle projeEtiketi paylaşır → hepsi kısa ad alır (bilinçli: aynı proje her yüzeyde aynı kısa ad). |
| pano/ordu-panosu.test.mjs | ~81 satır | **51w YENİ** (7 CSS kaynak pini + 3 birlesim pin + 3 vm pin + hermetik projelerTara) + **8 kırılan pinde dürüst güncelleme** (satır no'lu liste aşağıda). |

## Kanıt (yazıcı koşumu — gerçek çıkış kodları + çıktı dosyaları)

- `node --test pano/ordu-panosu.test.mjs`: **tests 71 · pass 71 · fail 0, EXIT=0** (çıktı %TEMP%\fazq-t6.txt; 51w ile 70→71)
- **Tam kapı açık glob**: `node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs` = **tests 309 · pass 309 · fail 0, TAM_EXIT=0** (çıktı %TEMP%\fazq-tam.txt; FAZ-P kapanışı 308 → 51w ile 309)
- `node --check` + vm.Script parse: her üç dosya SYNTAX_OK
- **Hijyen**: yasak sembol 0 YENİ (test kaynağındaki ✓/⚠ HEAD'deki mevcut 51f-pin metni — baseline ile aynı) · dış URL 0 (w3.org SVG hariç) · değişmezler AYNEN (x-pano-token 2 · CHAT_TAVAN 2 · maxlength 4096 · pano-token 12 · ordu-agac-secili 6 · @keyframes 1)
- **Kapsam**: `git status pano/` = yalnız 3 M dosya (brief'in görev sınırı birebir) — **server.js'e DOKUNULMADI** (kayıt PERF-1 10sn TTL önbelleğinden otomatik akar; restart koordinatör kapanışında) · 4937'ye dokunulmadı
- **Davranış denetimi**: data-proje/data-ana/data-ajan TAM dizin/kimlik AYNEN (51w vm pin 4g) · splitter/oturum sekmesi/transcript/composer mantığına hunk 0

## Bilinçli pin değişimleri (satır no'lu — FAZ-Q öncesi konumlar)

1. **51f (satır ~1377):** title pini `alfa — 2 çalışan · 4 ajan kaydı` → `P-alfa — 2 çalışan · 4 ajan kaydı` (FAZ-Q birleşik: dizin + [baslik] + sayılar; fixture'da baslik yok).
2. **51j (satır ~1594):** title literal pini `esc(etiket) + " — " + calisan...` → `const tamTitle = esc(pr.dizin)` + `" — " + calisan + " çalışan · " + ajanlar.length + " ajan kaydı"`.
3. **51k (satır ~1694):** vm pin — baslik etikete akıyordu → klasorAdi YOK'da dashed yedek görünür + baslik TOOLTIP'te yaşar (`P-alfa — 01234567890123456789012 — 1 çalışan · 1 ajan kaydı`).
4. **51k (satır ~1695):** beta title pini `beta — 0 çalışan` → `P-beta — 0 çalışan` (basliksız title segmenti yok).
5. **51k (satır ~1706):** vm ana sekme pini — baslik akışı → dashed yedek sekme adı (`>P-uzun</button>` + `title="P-uzun — P-uzun"`).
6. **51o (satır ~1894):** «rename başlık TAM görünür» → FAZ-Q: başlık GÖRÜNMEZ, dashed TAM sarar.
7. **51o (satır ~1896):** title pini `dodo lemon — 0 çalışan` → `D-Vibecode-Chrome-extension-sarisite-export — dodo lemon — 0 çalışan · 1 ajan kaydı`.
8. **51s (satır ~2145):** literal pini tek tırnak `' ajan kaydı'` → çift tırnak `" ajan kaydı"` (tamTitle sabitine taşındı).

## Bilinçli kararlar

1. **Gerçek klasör adının kaynağı ajan kaydının cwd alanı** (koordinatör diskte doğruladı) — dash-bölme YASAK: cwd basename'i tek segment alır; 'woo-block' klasörü 'block' OLMAZ (51w hermetik pin).
2. **İLK dolu cwd yeter** — aynı dizindeki kayıtlar dash olarak aynı yola işaret eder; ayrı cwd'li kayıt görülmedi (ölçüm koordinatörün).
3. **baslik GÖRÜNEN ADI TAŞIMAZ** (kullanıcı emri «sadece klasör adlarını yaz») — TAM kimlik (dizin + baslik + çalışan/kayıt) hover'da title olarak yaşar; bilgi KAYBOLMAZ.
4. **Aynı kısa ad her yüzeyde** (ağaç + sekme + optgroup + konusmaSecGuncelle) — projeEtiketi TEK yardımcı aynen; 5 kullanım değişmedi.
5. **klasorAdi EKLEMELİ alan** — mevcut alanlar (baslik/ajanSayisi/ajanlar/durumSayilari/...) harfi harfine AYNEN; parmak izi (FAZ-P EK Düzeltme) yeni.projeler'i string'lediğinden klasorAdi otomatik olarak parmağa GİRER — veri değişince render koşar (yeni test gereği YOK; mevcut mekanizma kapsar).
6. **Sol kaydırma .chatListe deseninin kopyası** — yeni icat YOK; #agacHata/.logNot altta pinlenmesi iyileşme (hata yüzü her zaman görünür).
7. **Mobil ≤899 iç scroll YOK** — .bolum doğal boy; sayfa kayar (mevcut davranış korunur).

## Yapamadım (koordinatör kapanışında)

- Canlı DOM doğrulaması (sol kaydırma scrollHeight>clientHeight + ağaçta kısa klasör adları) + ekran kanıtı PNG — **restart GEREKLİ** (ordu-birlesim.mjs değişti; PERF-1 önbelleği taze taramayı görür)
- Commit (tek elden koordinatör)

## Dürüst notlar

1. **70→71 pano test** (51w eklendi); tam kapı 308→309. Kırılan 8 pin dürüstce güncellendi (liste yukarıda) — hiçbiri sessiz geçiştirilmedi.
2. **Başlıksız + cwd'siz projede görünen ad dashed yedek** (klasorAdi null → projeAdi): 36 başlıksız projenin tamamında cwd mevcuttur (koordinatör disk ölçümü — ajan kaydının üst-düzey alanı) → canlıda dashed yedek nadiren görünür; null'da dürüst dashed kalır (uydurma yok E10).
3. **FAZ-K doktrini kısmen devirildi** («klasör isimlerini doğrudan yaz» = TAM etiket) — FAZ-Q kullanıcı emri daha yeni ve spesifik («sadece klasör adları»); başlık bilgisi title'da yaşadığından kayıp yok. FAZ-K'nın oturum satırı doktrini (TAM ajan etiketi) AYNEN.
4. YENİ renk/@keyframes/box-shadow/emoji 0 · E12 geçişleri 0 · esc() birebir aynen.

## İşlenme

`islenme: ISLENDI` — KURMAY-1 koordinatör kapanışı, 2026-11-04 11:33 (+03:00, Get-Date ile ölçüldü):

1. **Bağımsız tam kapı**: node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs = tests **309 pass 309 fail 0 EXIT=0** (çıktı %TEMP%\fazq-koordinator.txt + gerçek çıkış kodu ayrı dosyadan okundu; yazıcıyla aynı sayı).
2. **Diff denetimi**: 3 dosya +103/−20 — ordu-birlesim.mjs tek bölge (cwd yakalama + klasorAdi alanı; mevcut alanlar hunk 0) · html 5 bölge (FAZ-Q CSS bloğu + scrollbar ailesi + mobil medya istisnası + projeEtiketi + agacYaz tamTitle; splitter/oturum sekmesi/transcript/composer/token mantığına hunk 0; #orta'ya hunk 0) · server.js'e hunk 0.
3. **4937 RESTART koordinatörce** (ordu-birlesim.mjs değişti; eski PID 17092 durduruldu → YENİ PID 11680; PANO_PORT/PANO_TOKEN yalnız env-blokta): API yanıtında **75/75 proje klasorAdi dolu** — hayalet worktree'lerde bile GERÇEK basename («sprint53-alias», naif dash-bölme «alias» derdi; «woo-block» ≠ «block» tuzağı canlıda da doğru).
4. **Canlı DOM (1280x800, taze yükleme)**: **KAYDIRMA DOĞDU** — #agacAlani scrollHeight 2906 > clientHeight 656, overflow-y:auto, scrollbar görünür; programatik alta kaydırma → son satır «YapaySite» GÖRÜNÜR hale geldi; scrollTop sıfıra döndü (öncesi: #sol 780==780, 3842px içerik 768px'te kırpılıyordu). **ADLAR KISA**: ilk 5 satır «ordu · page-agent · sarisite-export · playwright-cdp · sprint53-alias»; en uzun ad 26 krk (öncesi 66). **ORDU satırı**: ad «ordu» + cip; title tooltip «D-Vibecode-ordu — ajan ordusu paseo desktop — 1 çalışan · 66 ajan kaydı» (TAM kimlik hover'da). **Oturum satırları FAZ-K aynen**: akordiyon açıldı — «PANEL-ANA-1 yazici - orta sekmeler kisa ad + modern cila» vb. Paseo başlıkları + FAZ-N son-3 süzgeci.
5. **Mobil 390x844**: medya canlı (splitter display:none · body overflow auto · #sol order:3 — chat önce); #agacAlani overflow:visible + iç scroll YOK + .bolum flex:none (doğal boy); sayfa kaydırması document düzeyinde ÇALIŞIYOR (docScrollH 19748 > 844; window.scrollTo alta indi). Dürüst not: resize'dan hemen sonra yapılan ilk hesaplamalı stil okuması medya yayılımını yetişemedi — ikinci okuma düzeltti (ölçüm yöntemi dersi, kod hatası değil).
6. **Hijyen**: x-pano-token 2 · CHAT_TAVAN 200 2 · maxlength 4096 · pano-token 12 · ordu-agac-secili 6 · @keyframes 1 · yasak sembol 0 yeni · dış URL yalnız w3.org SVG — HEAD-baseline ile aynı.
7. **Ekran kanıtı**: raporlar/ordu-panosu-2026-11-03/ekran-kanit-fazq-klasor-adi-kaydirma-2026-11-04.png (150.663 bayt · 1600x1000 fiziksel = 1280x800 CSS @1.25 DPR · PNG imzası + IHDR boyutları doğrulandı; ağaç 220px kaydırılmış konumda çekildi). Dürüst not: Read aracı PNG'yi boş döndürdü (FAZ-P ile aynı) — görsel inceleme koordinatörde mümkün değil; imza + boyut + DOM ölçümleriyle doğrulandı, K2 görsel kabul KULLANICIDA.
8. **Kullanıcının 75-proje sorusuna veri temeli (aynı gün ölçüldü)**: panelin kaynağı ~/.paseo/agents/ (ajan kaydı olan her dizin) = 75; Paseo aktif workspace 42; fark 33 = 28 arşivli + 5 silinmiş worktree kalıntısı — ölçüm yanlış değil, sayılan kaynak farklı. Ağacı aktif workspaces'la sınırlama FİKİR olarak kullanıcıya sunuldu (yeni dalga kararı kullanıcıda).
9. **Yazıcı dürüst notları kabul** (8 kırık pin satır no'lu listelendi · dashed yedek uç durumu · FAZ-K doktrin devri başlık-tooltip yaşamıyla kayıpsız).
10. Tek elden commit bu kapanışta (CODEMAP dahil).
