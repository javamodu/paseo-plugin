# PANEL-ANA-1 FAZ-G — BAŞLIK BİRLEŞİMİ: workspaces.json rename'leri ağaçta/sekmelerde görünür (yazıcı teslimi)

Yazıcı: glm53u-claude/glm-5.3 (ajan 3f3584c0-aa80-44f4-a71d-bf82c9b7671e)
Brief: KURMAY-1 8cc610a4, mesaj 0ef01b40 (kullanıcı steering'i: Paseo'da rename'lenen workspace adları panelde görünsün — kök neden 17:31 ölçümü: ağaçta 50+ karakter dashed TAM YOL)
Tarih: 2026-11-03 18:02 (Get-Date ile ölçüldü)

## Yapılan (3 dosya: pano/ordu-birlesim.mjs + pano/ordu-panosu.html + pano/ordu-panosu.test.mjs)

### 1. ordu-birlesim.mjs — başlık kaynağı (birleşim katmanı; server.js'e DOKUNULMADI)

- **`workspaceBasliklari(paseoEv)`** (yeni, SALT-OKUR): `join(paseoEv, 'projects', 'workspaces.json')` okur — test fixture'ı aynı PASEO_EV düzeniyle ezilebilir. Eşleşme anahtarı: cwd → dash çevirimi (`[\\/:]+` tek tire — server.js ORDU_DIZIN_ADI deseni AYNEN) = `agents/<dizin>` adı.
- **Çoklu-cwd seçim:** aynı cwd'de birden fazla workspace (gerçek diskte ölçüldü: D:\Vibecode\ordu için 6 kayıt) → `archivedAt` boş (aktif) + `updatedAt` en yeni kazanır.
- **Dürüstlük kuralları:** title boş/null → başlık YOK (UI'da dashed yol dürüst yedek — uydurma başlık YOK, E10). Kayıt defteri BOZUK/OKUNAMAZSA → tarama DEĞİL, yalnız başlıklar boş kalır (fail-closed ayrı — test edildi).
- **`projelerTara`** her proje kaydına `baslik` alanı ekler (TAM başlık; yok = null; kararsız kullanıcı verisi — UI'da esc() ile, etiket deseni).
- Kaynak doğrulama (salt-okur): gerçek workspaces.json 198 kayıt; alanlar brief'le birebir; ORDU cwd'sinde tek aktif kayıt → «ajan ordusu paseo desktop».

### 2. ordu-panosu.html — etiket TEK yardımcıdan

- **`projeEtiketi(pr)`** (yeni): baslik VARSA o, yoksa projeAdi; her ikisi de yoksa «?» dürüst son yedek.
- **5 kullanım noktası:** ağaç satırı (`const etiket` — kisalt(.,14) + satır title'ı birleşik bicim) · ana sekme (`pr ? projeEtiketi(pr) : dizin`) · chat başlığı (`seciliKonusma.projeEtiket`; kimlik yolu `projeDizin` AYNEN) · composer optgroup · proje detay adı (projeTabloAd).
- **Kimlik yolu DEĞİŞMEDİ:** data-proje/data-ana TAM dizin AYNEN; ORDU cipi/orduMu dizin köklü KALIR; agacVarsayilanSira sıralaması projeAdi (dizin) üzerinden AYNEN (başlık sıralamayı bozmaz).

## Kanıt (yazıcının kendi koşumları)

- pano `npm test`: **78/78 pass, fail 0, EXIT=0** (mevcut 77 TAMAMI yeşil + **51k YENİ**: 7 kaynak-pin (birleşim) + 7 birleşim davranışı (tmp fixture: arşivli-en-yeni kaybeder, title-null yedek, ileri-bölü cwd eşleşir, bozuk defter fail-closed) + 8 UI pin + 4 vm (başlık etikete akar / yedek aynen / data-proje & data-ana TAM dizin)).
- Kendi repo-glob koşumum (pano+scripts+raporlar suitleri): **343 test, 342 pass, 1 fail** — kırmızı `raporlar/uzun-gorev-verimi-2026-11-01/judge.test.mjs`: vm 100ms zaman-aşımı harness'i, paralel yük altında flake; **tek başına 8/8 yeşil**; dalganın 3 dosyasına dahil değil, kurulmuş glob dışı.
- Diff: 3 dosya, +169/−22 (birlesim +29 · html +38/−15 · test +124/−7).

## Bilinçli pin değişimleri (satır no'lu)

- Test 51/51b ~1240/1280/1320/1345 + 51c ~1374 + 51e ~1455 + 51f ~1528/~1564 + 51j ~1781: **9 vm ctx'e `projeEtiketi` EKLENDİ** (FAZ-G: agacYaz/anaSekmeYaz/projeTabloYaz/composerHedefGuncelle/konusmaSecGuncelle etiketi yardımcıdan alır — eski ctx'lerde ReferenceError).
- 51j FAZ-E pinleri: `kisalt(pr.projeAdi,14)` → `const etiket = projeEtiketi(pr)` + `kisalt(etiket,14)`; E-ek1 title pini `esc(pr.projeAdi)` → `esc(etiket)`.

## Yapamadım (dürüst)

- Canlı DOM kanıtı KOŞAMADIM — 4937'ye dokunma yasağı; değişiklik canlıya **[insan] restart'ında** biner (koordinatör kapanışında ölçülmeli — sunucu tarafı birleşim değişti, yenileme tek başına YETMEZ).
- K2 görsel kabul KULLANICIDA — açık.

## Dürüst notlar

- **Çoklu-cwd seçim semantiği** brief'in literal okuması: aktif kayıtlar arasından updatedAt en yeni SEÇİLİR; seçilen kaydın title'ı boşsa başlık YOKtur — daha eski başlıklı aktif kayıt devreye girmez (nadir kenar durumu; gerçek diskte ORDU tek aktif, ölçüldü).
- Brief'teki «title ... TAM DİZİN AYNEN (kimlik yolu DEĞİŞMEZ)» ibaresi **kimlik-yolu kaygısı** olarak okundu: data-proje/data-ana TAM dizin AYNEN korundu; title'lar etiketin TAM halini taşımaya devam ediyor (ana sekme title'ı '— dizin' sön ekini zaten içerir; ağaç satırında dizini data-proje taşır; ajan düğümü title'ı TAM uuid AYNEN). Farklı yorum istenirse tek düzeltme noktası projeEtiketi çevresi.

## Öneri

Koordinatör kapanışında [insan] restart sonrası canlı 4937 `/ordu`: (a) ağaçta «ajan ordusu paseo desktop» etiketi (dashed yol yerine) + hover'da 'TAM başlık — N çalışan · M ajan kaydı' title; (b) ana şeritte başlıklı sekmeler dar + title 'TAM başlık — dizin'; (c) chat başlığı + proje detay adında başlık (ekran PNG raporlar/ordu-panosu-2026-11-03/ altına).

## İşlenme (koordinatör KURMAY-1 — kapanış, 2026-11-03 18:15)

1. **Koordinatör bağımsız koşumları:** pano npm **78/78** + repo glob **300/300** (kurulmuş `pano/*.test.mjs + scripts/*.test.mjs` deseni) EXIT=0 — yazıcının pano iddiası birebir; geniş glob'un tek kırmızısı (judge.test.mjs flake) kurulmuş glob'a dahil DEĞİL, kabul. (Koşumlar arka plan görevinde tamamlandı — çıktı dosyadan okundu: PANO_EXIT=0, GLOB_EXIT=0.)
2. **Diff denetimi:** 3 dosya, +169/−22 (birlesim +29/−0 · html +38/−15 · test +124/−7) — yazıcı sayıları birebir. workspaceBasliklari SALT-OKUR + bozuk defter fail-closed; projeEtiketi + 5 kullanım noktası; data-proje/data-ana TAM dizin pinleri kaynakta VAR.
3. **4937 restart koordinatörce yapıldı** (yazıcının beklediği «[insan] restart» — benim İZOLE TEST sunucum, 4377 üretimine DOKUNULMADI): eski süreç durduruldu, yeni süreç PID 37100, token yalnız süreç env-blok'unda. Sunucu tarafı birleşim kodu canlıya bindi.
4. **Canlı API kanıtı:** `/api/ordu/projeler` → 74 proje, **39'u baslik'lı** (gerçek rename başlıkları ölçüldü); ORDU: baslik='ajan ordusu paseo desktop', dizin='D-Vibecode-ordu' (kimlik yolu değişmedi).
5. **CANLI DOM 4937 (tarayıcı sekmesi, yenilemeyle):** (a) ağaç satırları RENAME BAŞLIKLARI gösteriyor — «ajan ordusu p…» (title «ajan ordusu paseo desktop — 1 çalışan · 65 ajan kaydı» + data-proje «D-Vibecode-ordu» TAM), «agentic note …» (TAM «agentic note taker — 1 çalışan · 34 ajan kaydı»), «S53-C: MCP ku…», «fse ai custom…», «speakrapid» — 13px/28px satır KORUNUR; (b) FAZ-D sekme kontrollü testi: «agentic note ta…» **113px dar** + max-width 180 + padding 0 8 + title «agentic note taker — D-Vibecode-Chrome-extension-sarisite-export» + data-ana TAM dizin; (c) projeTabloAd «agentic note taker» (detay görünümü başlık kullanıyor); (d) GÖNDER 40px K-0061 §5; (e) sembol taraması: UI bölgeleri (ana şerit/chat/ağaç satır metinleri) **0** — →×317/←×4/✓×6/↔×9/⚠×2/↑↓×2 DİNAMİK VERİ katmanında (DURUM/PLAN/SAĞLIK API metinleri — kullanıcı verisi, dosya değil; dosya pinleri testte sembol 0).
6. **Kontrollü canlı test dürüst notu:** sekme açıldı (ölçüm), kapatıldı (şerit ORDU'ya döndü), sayfa yenilendi — kullanıcı görünümü geri yüklendi. (Tarayıcı konağı ölçüm sırasında koptu — bilinen geçici aksaklık; bekle-tekrar-dene ile geri döndü.)
7. **Ekran kanıtı:** `raporlar/ordu-panosu-2026-11-03/ekran-kanit-ana-faz-g.png` (157,7 KB, 1918x1110, PNG imzası doğrulandı).
8. **Yazıcının dürüst notları kabul:** (c) geniş-glob flake dışarıda; (d) title'ın etiket-TAM taşıması + data-ana'nın dizin-TAM taşıması canlıda KANITLANDI (kimlik yolu data-* özniteliklerinde — yorum doğru çıktı); (e) çoklu-cwd kenarı nadir, kabul.
9. K2 görsel kabul KULLANICIDA — açık. Tek elden commit bu kapanışta. Kuyruk: **FAZ-H** (yeni kullanıcı steering'i: yazılar büyük/okunaklı + nefes alan modern minimalist kompakt tasarım).
