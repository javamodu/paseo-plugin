# PANEL-ANA-1 FAZ-C — SAĞ PANEL TEK CHAT BİRİMİ: LİSTE ÜSTTE ESNEK + COMPOSER ALTTA SABİT (yazıcı teslimi)

Yazıcı: glm53u-claude/glm-5.3 (ajan 3f3584c0-aa80-44f4-a71d-bf82c9b7671e)
Brief: KURMAY-1 8cc610a4, mesaj 1c54a200 (kullanıcı steering'i: «chat bölümü neden normal altta sabit composer üstte konuşmalar şeklinde değil»)
Tarih: 2026-11-03 17:13

## Yapılan (2 dosya: pano/ordu-panosu.html + pano/ordu-panosu.test.mjs)

Kök neden koordinatör teşhisiyle birebir doğrulandı: #sag içinde İKİ ayrı `.bolum` kardeş (#bolum-chat CHAT başlıklı + #bolum-composer COMPOSER başlıklı) — ikisi de içeriğine göre boyutlanıyordu.

1. **#bolum-composer BÖLÜMÜ KALDIRILDI:** `<section class="bolum" id="bolum-composer">` + COMPOSER h2 (composer-baslik) + svg gitti. composerForm + composerSonuc + logNot TEK bölümün (#bolum-chat) içine, `chatBos`'tan sonra indi.
2. **composer sarmalayıcı div** (`<div id="bolum-composer" class="composerAlan" aria-label="mesaj gönderim alanı — composer">`): BİLİNÇLİ tasarım — JS'de `odakIcindeMi("#bolum-composer")` 4 yerde yaşıyor (yenileme girdi koruması); brief hem «JS AYNEN» hem «#bolum-composer kalıntısı YOK» dediği için kimliği BÖLÜMDEĞİL sarmalayıcıda tuttum: bölüm/ başlık kalıntısı 0, JS girdi koruması byte-birebir çalışır (odak composer'da → yenileme hedefi ezmEz). Bölüm (section/h2) gitmiştir; kimlik JS sözleşmesidir.
3. **Flex zinciri:** `#bolum-chat { flex:1 1 auto; min-height:0 }` (kolonu dolduran TEK birim) → `.chatListe { flex:1 1 auto; min-height:0; overflow-y:auto }` (kalan yüksekliği doldurur, kendi içinde kayar; eski min-height:140px BİLİNÇLİ gitti) → `.composerAlan { flex:none; border-top:1px solid var(--cizgi) }` (alt kenar kolonun alt kenarına yapışık — pencere küçülse/büyüse sabit; ince ayraç çizgisi COMPOSER başlığının yerine). `#composerForm` margin-top:4px → 0 (aralığı sarmalayıcı padding'i verir).
4. **İstif (<899px):** doğal sıra (liste üstte + composer altta) zaten doğru; media bloğuna `#bolum-chat { flex:none }` + `.chatListe { min-height:140px }` — dar ekranda boş liste kutusu görünür kalır.
5. **composerForm İÇİ AYNEN:** alan sırası (Hedef select → Mesaj textarea → token password → GÖNDER) + tüm id'ler (composerForm/Hedef/Mesaj/token/Gonder/Sonuc) + 2 AYRI optgroup + POST /api/mesaj + x-pano-token + role=status — JS/veri katmanı HUNK YOK.

## Kanıt (yazıcının kendi koşumu)

- pano `npm test`: **76/76 pass, fail 0, EXIT=0** (mevcut 75 vakanın TAMAMI yeşil + 51i YENİ 13 ok).
- Bilinçli pin değişimi: **YOK** — mevcut test dosyasında tek satır değiştirilmedi (test 1222'nin `id="bolum-composer"` pini sarmalayıcıyla doğal olarak yeşil kaldı).
- Yeni pinler (51i): tek-bölüm yapısı (section id=bolum-composer YOK) + COMPOSER h2 kalıntısı YOK + composer #bolum-chat içinde (sarmalayıcı div) + bölüm kapanışı composer'dan sonra + flex:1 1 auto/min-height:0 (birim + liste) + .composerAlan flex:none + istif media pinleri + alan sırası + id'ler AYNEN + odakIcindeMi("#bolum-composer") JS'te AYNEN + submit/optgroup JS pini.

## Yapamadım (dürüst)

- Canlı DOM/PNG kanıtı YOK — 4937'ye dokunma yasağı (HTML diskten servis edilir; tarayıcı koordinatör kapanışında).
- K2 görsel kabul KULLANICIDA — açık.
- Brief iç çelişkisi («#bolum-composer kalıntısı YOK» ↔ «JS AYNEN») sarmalayıcı-div çözümüyle giderildi — koordinatör onayına sunulur (istemezse tek düzeltme: JS'de 4 seçici `#composerForm`'a çevrilir — bu JS değişikliği olur, brief'e aykırı; ben dokunmadım).

## Öneri

Koordinatör kapanışında canlı 4937 `/ordu`: sağ kolon tek birim — liste alanının pencereyle büyüyüp küçülmesi + composer alt kenara yapışıklığı (ekran PNG raporlar/ordu-panosu-2026-11-03/ altına); istif modunda liste 140px tabanı.

## İşlenme (koordinatör KURMAY-1 — kapanış, 2026-11-03 17:19)

1. **Koordinatör bağımsız koşumları:** pano npm **76/76** + repo glob **298/298** (297+51i) EXIT=0 — yazıcı iddiası birebir.
2. **Diff denetimi:** html +44/−28, 5 hunk = 4 CSS + 1 HTML — **JS bölgesine hunk YOK** (JS/veri katmanı dokunulmadı kanıtı diff düzeyinde).
3. **SARMALAYICI-DIV KARARI KOORDİNATÖR ONAYI: KABUL.** `id="bolum-composer"` sarmalayıcı `div`'te yaşar — JS'in `odakIcindeMi("#bolum-composer")` girdi koruması (4 yer) byte-birebir çalışır. Brief'teki «#bolum-composer kalıntısı YOK» pini KOORDİNATÖR HATASIYDI (bu bağımlılığı bilmeden yazılmış); yazıcı çelişkiyi dürüstçe rapor edip doğru çözümü seçti — bölüm/başlık kalıntısı 0, kimlik JS sözleşmesi olarak duruyor.
4. **CANLI DOM (4937, diskten — yenilemeyle restart'sız):** yapı [composer = DIV, parent #bolum-chat, form içeride, h2 COMPOSER YOK] + **yerleşim ölçüldü**: #sag 654 → bölüm 646 (kolonu dolduruyor) → liste 109 + composer 384 (içerik boyu, alt bölge); composer alt kenarı #sag altına 13px (bölüm padding'i — yapışık) · **pencere küçülme testi** (888→700): liste 109→98 emildi, composer 384 SABİT alt kenarda, dış kaydırma YOK — chat-uygulaması davranışı kanıtlı · optgroup 2 · GÖNDER 40px · emoji 0 · chatListe role=log AYNEN.
5. **Ekran kanıtı:** `raporlar/ordu-panosu-2026-11-03/ekran-kanit-ana-chat-birim.png` (134,7 KB).
6. **K2 görsel kabul KULLANICIDA** — açık. Tek elden commit bu kapanışta. Kuyruk: **FAZ-D** (kullanıcı steering'i: proje sekmeleri çok geniş/dağılıyor — etiket kisalt + max-width + ellipsis + title TAM ad; aynı yazıcıya dispatch).
