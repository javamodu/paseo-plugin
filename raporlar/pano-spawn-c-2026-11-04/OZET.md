# K-0065 DALGA C KAPANIŞI — GEZGİN «+» DÜĞMESİ: TALEP KARTI + UCA BAĞLAMA + CANLI DOM (panel talep düşürür, KURMAY işler)

Tarih: 2026-11-04 21:29 (ölçüldü, Get-Date) · dalga: K-0065 Dalga C · kapanış: tam kapı **266/266 EXIT=0** (YENİ baseline 266 = 265 + 51ac)

## Operatör emri

«Devam» — onaylı dalga sırasının 6. adımı (1. restart ✓ · 2. ARŞİV ✓ · 3. TRANSCRIPT-CANLI ✓ · 4. COMPOSER ✓ · 5. Dalga B ✓ · **6. K-0065 Dalga C** · 7. M2 sağ panel + rename).

Karar kaydı: [kararlar/K-0065.md](../../kararlar/K-0065.md) (ONAYLANDI) — **+ düğmesi KENDİ spawn ETMEZ — spawn TALEBİ düşürür** (panel sunucusu ajan süreci YÖNETMEZ). Restart [insan] adımı Dalga B EK'inde önden tüketildi (operatör «Restart yap»; 4937 PID 18292 canlı).

## Çözüm — `pano/ordu-panosu.html` (server.js DEĞİŞMEDİ; restart GEREKMEDİ — statik dosya her istekte diskten)

**(1) «+» düğmesi (her proje satırında):** `.agacProjeBas`'in KARDEŞİ olarak eklenir (akordeonu tetiklemez: click delegation'ı önce `.agacTalepDugme` dalını yakalar, `return`; `closest(".agacProjeBas")` eşleşmez). `data-talep-proje` = TAM dizin; dürüst title: «yeni oturum talebi — talep düşürür (spawn etmez; KURMAY işler)». Görünürlük: `opacity:0` varsayılan → `:hover` / `:focus-visible` → `1`; `@media (pointer: coarse)` bloğunda hem görünür hem `min-height:var(--min-dokunma)` (dokunmatikte gizli tuzak yok).

**(2) Talep kartı `#agacTalepKarti`:** `#agacAlani` DIŞINDA (30 sn ağaç re-render'ından etkilenmez — kart açık kalır). Açılış (`talepFormAc`): fail-closed dizin doğrulaması + proje etiketi (etiket + TAM dizin) + alanlar temizlenir + odak başlıkta + kuyruk yüklenir. Alanlar: başlık ≤200, ilk mesaj ≤3000 (sunucu AYNI sınırlarla RED — **kesme YOK**, istemci uzun girdiyi göndermez: «başlık 200, ilk mesaj 3000 karaktere dek (kesme YOK: sunucu da reddeder)»). KAPAT düğmesi kartı gizler.

**(3) Gönderim — `POST /api/spawn-talebi`:** token başlığı `x-pano-token` (GÖNDER deseni; token localStorage `pano-token`). Dürüst yüzler: **200** «talep DÜŞTÜ — KURMAY'a bildirim iletildi (talepId …); kuyruk aşağıda» · **202** «talep KUYRUKTA — bildirim iletilmedi (KURMAY sırayı işler; talep kaybolmaz — kuyruk SSOT)» · **401/403** «token gerekli — Ayarlar görünümünden girin (üstteki AYARLAR ikonu)» · **429** «bekle — aynı proje için kısa aralık (10 sn)» · diğer «HTTP <kod> — <hata>». Hata durumunda form KORUNUR (kullanıcının metni kaybolmaz); `finally` butonu yeniden aktif kılar; boş `ilkMesaj` gövdeye GİRMEZ (yalnız dolu alan yazılır). Gönderim kilidi `talepGonderiyor` çift POST'a karşı.

**(4) Kuyruk görünümü (`kuyrukYukle`):** salt-okur `GET /api/ordu/spawn-kuyruk` (token'sız). Özet satırı: «kuyruk: N talep — K kuyrukta · İ işlendi · H hata [· B bozuk satır (sayılır — gizlenmez)]»; boş kuyruk dürüst satır: «kuyrukta talep yok (dürüst boş)». Talep satırları dürüst rozetler: KUYRUKTA (uyarı) / İŞLENDİ (başarı — ajan kısa kimlik görünür, panel diskten okur) / HATA (tehlike — detay) — **sahte «açıldı» YOK (E10)**. Aynı-veri atlaması (`sonKuyrukYazi` parmağı — gereksiz re-render yok); ağ hatası sessiz (kuyruk turu kırılmaz). `hepsiniYukle` dizisi 4→**5 ayak** (kuyrukYukle guard'lı: `talepProje` yoksa DOKUNMAZ — kart kapalıyken istek YOK).

## Kanıt

- **Tam kapı: `node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs` = 266 tests / 266 pass / 0 fail / EXIT=0** (ayrı komutla ölçüldü).
- **Test 51ac YENİ** (2 bölüm): (A) 10 kaynak pini — + düğmesi kardeş konum + `esc(pr.dizin)` + delegation sırası + `typeof` koruması; kart HTML konumu/kimlikleri/maxlength'leri; CSS opacity kuralları + coarse bloğu; POST pin (body üçlü-koşullu + token başlığı); kuyruk read-model uç/guard/parmak; E10 dürüst rozetler + kaybolmaz + bozuk satır; istemci doğrulamaları; hepsiniYukle 5 ayak; talepFormAc fail-closed. (B) 9 VM senaryosu — form açılışı + kuyruk render (2 talep: 1 kuyrukta + 1 işlendi, ajan kısa kimlik), parmak aynı-veri, boş başlık fetch YOK, 200 (gövde + token başlığı + DÜŞTÜ yüzü), 202 (KUYRUKTA + kaybolmaz), boş ilkMesaj GİRMEZ, 403 Ayarlar yüzü, kapat → guard cek YOK, hata + bozuk satır render.
- **Test 51v stub eki:** fazpekKos ctx'ine `kuyrukYukle` stub (transcriptTazele deseni) — hepsiniYukle 5. ayağı VM'de çözülür; uçuş kilidi ölçümü 3 istekle doğru kaldı.
- **11 pin güncellemesi (bilinçli genişletme, Dalga B POST 5→6 emsali):** test 5 cek 3→4 + uclar; test 10d GET 3+2YAZMA→4+2YAZMA; test 51k projeEtiketi 6→7; test 51l cek 3→4; test 51n/51o coarse 3 sınıf; test 51t composer-form fromIndex düzeltmesi (talep formu `</form>`'u bulmuyordu) + parola-YOK pini; test 51v cek ×3→×4 + 3 Promise.all pini (test 5/51r/51v) 4→5.
- **Canlı DOM (browser host, sekme 4937; ölçüm 21:0x–21:29):** 76 proje satırı → **76 + düğmesi** (k ya rdeş yapı ölçüldü: `agacProjeBas | agacTalepDugme`); click → **kart açıldı** + «proje: ordu (D-Vibecode-ordu)» + odak başlıkta; **kuyruk GET canlı**: «kuyruk: 0 talep — 0 kuyrukta · 0 işlendi · 0 hata» + «kuyrukta talep yok (dürüst boş)»; form doldur + TALEP DÜŞÜR → **GERÇEK POST → 403 → dürüst yüz** «token gerekli — Ayarlar görünümünden girin (üstteki AYARLAR ikonu)» + buton `finally` aktif + kuyruk tazelendi + form korundu. **CSS canlı parse (tarayıcı cssRules taraması):** `.agacTalepDugme => 0` · `.agacProjeSatir:hover .agacTalepDugme, .agacTalepDugme:focus-visible => 1` · `@(pointer: coarse) .agacTalepDugme => 1 + min-height:var(--min-dokunma)`.
- **PNG:** [canli-dom.png](canli-dom.png) 153.662 bayt 1534×888 (kart açık + 403 yüzü). Dürüst not: bu ajan oturumunda Read görseli iki kez sessiz döndü — içerik doğrulaması DOM ölçümleriyle yapıldı, PNG kaydı diske indi.
- **Servis kanıtı:** GET /ordu 200 · 165.345 bayt (agacTalepDugme servis gövdesinde + kart HTML) · GET /api/ordu/spawn-kuyruk 200 dürüst sıfır aynen. 4937 PID 18292 **restart'sız** (server.js değişmedi).
- **Dürüst eksikler (E10):** (a) gerçek fare `:hover` tetiklemesi ölçülemedi — Paseo hover aracı ref bazlı, a11y snapshot'ı `opacity:0` öğeyi almıyor; kanıt zinciri: kuralın canlı parse'ı + VM kaynak pini. (b) **200/202 canlı ölçülemedi** — canlı sunucu tokensiz (403 fail-closed); operatör sunucuyu kendi terminalinden token'la başlatınca ölçülür (izole test 202 yolu Dalga B'de ölçülü). (c) Paseo keypress Enter button'da click ÜRETMEDİ (CDP keydown gerektirir) — click DOM API `click()` ile tetiklendi (delegation + listener zinciri gerçek). (d) 30 sn döngüsünün kuyruk ayağı canlı beklemede ayrı ölçülmedi (guard + VM pini 51ac'te).
- **Test koşu dürüstlüğü: 4 tam kapı koşusu** — (1) 266/258/8 (mevcut pin regresyonları), (2) 266/265/1 (51v stub eksik — teşhis edildi, kök neden: hepsiniYukle 5. ayağı çözümsüz ReferenceError → uçuş kilidi sıfırlanıyordu), (3) 266/266 yeşil, (4) EXIT=0 teyidi (pipeline exit maskesi için ayrı komut). Bütçe ≤4'e DEĞDİ (aşmadı).
- **LOC: 11.352 → 11.632 (DELTA +280)** — ölçüm karesi: `pano/` mjs+js+html `@(Get-Content).Count`, 32 dosya, tek yöntem. **Dalga tavanı +200 AŞILDI (+80)** — gerekçe: kart + form + kuyruk görünümü UI yüzeyi (dalganın öznesi) + 51ac test bloğu; mevcut dosya dokunuşu yalnız ordu-panosu.html + ordu-panosu.test.mjs; doluluk **%64,6** (11.632/18.000 — bol nefes).

## Operatöre kullanım

- Gezgin ağacında proje satırının sağındaki **+** düğmesine gel (fareyle: hover'da görünür; dokunmatikte hep görünür) → tıkla → talep kartı açılır → başlık (zorunlu) + ilk mesaj (isteğe bağlı) → **TALEP DÜŞÜR**.
- **Canlı 4937'de POST kapalı** (sunucu tokensiz → 403 dürüst yüz + Ayarlar yönlendirmesi). Gerçek talep düşürme için sunucuyu kendi terminalinden başlat: `$env:PANO_TOKEN='<token>'; $env:PANO_PORT='4937'; node pano/server.js` (D:\Vibecode\ordu'dan) — ya da panoda AYARLAR ikonu → token gir (aynı tarayıcı profili).
- Talep düşünce KURMAY (bu ajan) bildirimi alır → kuyruğu okur → MCP `create_agent` işletir → sonucu kuyruğa yazar → panel 30 sn döngüsünde İŞLENDİ + ajan kimliğini gösterir.

## Bekleyen (operatör onaylı sıra)

- **SIRADA: M2 sağ panel metrik gösterimi + rename** (7. adım).
- K-0065 kalan bileşenleri: yeni workspace · composer'da proje klasörü seçimi · proje ekleme.
- K7 push (birikim 74 → bu committe 75).

Makine-okunur yan dosya: [spawn-c.json](spawn-c.json).
