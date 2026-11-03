# PANEL-ANA-1 FAZ-D+E+F (+E-ek1/E-ek2) — ANA ŞERİT DAR + AĞAÇ AŞIRI MİNİMAL/OKUNABİLİR + AKTİF PROJELER ÜSTTE (yazıcı teslimi)

Yazıcı: glm53u-claude/glm-5.3 (ajan 3f3584c0-aa80-44f4-a71d-bf82c9b7671e)
Brief: KURMAY-1 8cc610a4, mesajlar d3b44962 (FAZ-D+E) + d5878bca (FAZ-F eki) + c059eecc (E-ek1/E-ek2, 17:31)
Kullanıcı steering'leri: «üst sekme çok fazla geniş oluyor dağılıyor» · «soldaki proje isim ve oturum ismini aşırı minimal yap» · «solda aktif projeler üstte olsun pasifler aşağıda» · «bu proje ve oturum isimleri neden kısalmıyor ve çok küçük yazılmış»
Tarih: 2026-11-03 17:33 (Get-Date ile ölçüldü)

## Yapılan (2 dosya: pano/ordu-panosu.html + pano/ordu-panosu.test.mjs)

### FAZ-D — ana şerit proje sekmeleri DAR

1. **Etiket:** `anaSekmeYaz` döngüsünde `esc(kisalt(ad, 16) || ad)` — kisalt null dönerse dürüst yedek ad; **title `TAM ad — dizin`** (`esc(ad + " — " + dizin)`); **data-ana TAM dizin AYNEN** (seçim/kapatma yolu değişmez); sekmeKapat + ORDU sabit sekme AYNEN.
2. **CSS:** `#anaSekmeSerit .sekme { padding:0 8px }` (alt şerit FAZ-B ailesiyle aynı dar dolgu) + `.anaSekmeGrup .sekme { max-width:180px; overflow:hidden; text-overflow:ellipsis }` — taşma EMNİYETİ.

### FAZ-E — ağaç etiketleri «aşırı minimal» + E-ek1/E-ek2

3. **Oturum düğümü:** `kisalt(a.etiket, 12)` (eski 20) — title TAM etiket AYNEN, data-ajan TAM uuid AYNEN.
4. **Proje satırı:** görünen ad `kisalt(pr.projeAdi, 14) || pr.projeAdi` (eski TAM ad — koordinatör 17:31 ölçümü: 50+ karakter dashed TAM YOL taşıyordu, kisalt YOKTU — gerçek bug). **E-ek1:** satır title'ı birleşik dürüst bicim `TAM projeAdi — N çalışan · M ajan kaydı` (calisan/kayıt bilgisi KORUNARAK birleşti; agacAd'in kendi title'i kaldırıldı — çift tooltip yok); data-proje TAM dizin + aria-expanded AYNEN.
5. **E-ek2 font:** `.agacProjeBas` 12→13px · `.agacAjan` 12→13px (`.agacDugumAd` buradan kalıtır — kendi font-size'ı yok; kompakt baz 13px ile hizalı) · `.agacGrupBas` 10→11px mono. Satır 28px KORUNUR (K-0061 §5 ≥26px).
6. **Dokunulmayanlar:** CHAT başlığındaki `kisalt(a.etiket, 20)` AYNEN + AKIŞ `kisalt(o.ad, 80)` AYNEN (kullanıcı «soldaki» dedi — yalnız ağaç).

### FAZ-F — aktif projeler ÜSTTE, pasifler aşağıda

7. `agacYaz` içinde **stabil ayrım**: `calisanSay` (lastStatus running sayımı — sağdaki `.agacSayi`'nın aynısı) → `gorunen = [...projeler].sort((a,b) => (aktif(b)) - (aktif(a)))` — PRIMARY aktif-öncelik, SECONDARY mevcut sıra (ORDU-önce varsayılanı + kayıtlı ↑/↓ tercihi ordu-agac-sira) **grup içinde yaşar**. Kalıcı kayıt ŞEMASI DEĞİŞMEZ, **YENİ localStorage anahtarı YOK**, yeni başlık/blok YOK (kompakt dil).

## Kanıt (yazıcının kendi koşumu)

- pano `npm test`: **77/77 pass, fail 0, EXIT=0** (mevcut 76 vakanın TAMAMI yeşil + 51j YENİ 23 ok: kaynak-pin + vm davranış — uzun sekme adı vm'de 15+'…', title 'TAM — dizin', data-ana TAM; ağaç vm'si 51f'te FAZ-F davranış piniyle).
- Bilinçli pin değişimleri (satır no'lu): test 10 ~319 (agacAjan 12→13px, E-ek2) · 51f ~1536 (sıra pini → aktif-üstte) · 51f ~1539 (alfa title → 'alfa — 2 çalışan · 4 ajan kaydı', E-ek1) · 51f ~1556 (kayıtlı-sıra pini) · 51c ~1373 (vm ctx'e kisalt EKLENDİ — FAZ-D anaSekmeYaz artık kisalt çağırır, eski ctx ReferenceError veriyordu) · 51d ~1399-1426 (eşik 20→12 + beklenen dize).

## Yapamadım (dürüst)

- Canlı DOM/PNG kanıtı YOK — 4937'ye dokunma yasağı (HTML diskten servis edilir; tarayıcı koordinatör kapanışında).
- K2 görsel kabul KULLANICIDA — açık.
- Başlık-birleşme (workspaces.json'dan rename'lerin okunması) FAZ-G AYRI DALGA — bu tura ALINMADI (koordinatör sınırı).

## Dürüst notlar

- **text-overflow:ellipsis inline-flex düğmede glif BASMAZ** (tarayıcı semantiği) — ana şeritte CSS katmanı yalnız taşma emniyetidir; görünür kesme JS `kisalt(.,16)` + title TAM'dır. Ağaçtaki `.agacAd`/`.agacDugumAd` blok-düzey flex öğesidir — orada ellipsis glif basar; yine de birincil kesme JS'tir.
- **agacSirala (↑/↓) ham agacSiraUygula sırası üzerinde çalışır** — grup SINIRI geçen taşımalar (aktif↔pasif arası) FAZ-F ayrımında görüntüde no-op'tir; grup içi taşımalar aynen çalışır (51f(3) aynen yeşil). Bilinen sınır, davranış kaybı değil.

## Öneri

Koordinatör kapanışında canlı 4937 `/ordu`: (a) ana şeritte uzun adlı proje sekmesi dar + hover'da title 'TAM ad — dizin'; (b) sol ağaçta aktif projeler üstte + 13px okunur etiketler + satır hover'ında 'TAM ad — N çalışan · M ajan kaydı'; (c) ↑/↓ ile grup-içi sıra (ekran PNG raporlar/ordu-panosu-2026-11-03/ altına).

## İşlenme (koordinatör KURMAY-1 — kapanış, 2026-11-03 17:39)

1. **Koordinatör bağımsız koşumları:** pano npm **77/77** + repo glob **299/299** (298+51j, `pano/*.test.mjs + scripts/*.test.mjs` kurulmuş deseni) EXIT=0 — yazıcı iddiası birebir.
2. **Diff denetimi:** html +32/−11 · test +53/−10. JS hunk'ları yalnız anaSekmeYaz (kisalt 16 + title) · agacYaz (kisalt 14 + birleşik title + calisanSay + gorunen sıralama) · ajanDugumHtml (12) + CSS font blokları — fetch/optgroup/CHAT_TAVAN/composer bölgesine hunk YOK.
3. **CANLI DOM 4937 (diskten — yenilemeyle restart'sız):** (a) ağaç proje satırları görünen **14 karakter + kısalt** («D-Vibecode-or…»), title «TAM ad — N çalışan · M ajan kaydı», **13px**, satır 28px; (b) oturum düğümleri **12 karakter** («R5 Duzeltme…»), 13px, data-ajan TAM 36 karakter, title TAM kimlik; (c) grup başlığı **11px**; (d) **FAZ-F kanıtlandı**: ilk 3 satır çalışanı 1 (aktif), ardından 0'lar — aktif üstte, pasif aşağıda; (e) **FAZ-D kanıtlandı**: uzun proje sekmesi «c-Users-gatep-L…» 16 karakter, **genişlik 118px**, max-width 180px, padding 8px, title «TAM ad — dizin»; sekme kapatınca şerit ORDU'ya döndü; (f) GÖNDER 40px + composer yapısı AYNEN (sarmalayıcı bolum-composer/composerAlan · optgroup 2 · token password); (g) emoji/sembol 0; chatListe role=log AYNEN.
4. **Kontrollü canlı test dürüst notu:** sekme açma/kapama ölçümü kullanıcının görünüm durumunda yapıldı — ölçüm sonunda sekme kapatıldı + sayfa yenilendi (durum geri döndü; ağaç açılma durumu bellek-içi, yenilemeyle sıfırlandı).
5. **EK BULGU (dalgadan bağımsız):** `plans/uygulama-paketleri/DC-H1-2026-10-28/dogrula.test.mjs` kırmızı (planned-file-already-exists 35 madde — DC uygulamasının dosyaları yerinde, test eski plan durumunu doğruluyor). Kurulmuş repo glob'una (pano+scripts) dahil DEĞİL, yazıcı dokunmadı — **[insan] kuyruğuna alındı** (test yenile ya da arşiv kararı operatörde).
6. **Ekran kanıtı:** `raporlar/ordu-panosu-2026-11-03/ekran-kanit-ana-faz-def.png` (134,5 KB, 1918x1110).
7. **K2 görsel kabul KULLANICIDA** — açık. Tek elden commit bu kapanışta. Kuyruk: **FAZ-G** — workspaces.json başlık birleşimi (kullanıcının rename'lediği adlar ağaçta proje adı olarak görünsün; koordinatör 17:31 ölçümü: 198 kayıt, cwd anahtarlı, başlıklar VAR; sunucu tarafı ordu-birlesim.mjs + 4937 restart gereksinimi).
