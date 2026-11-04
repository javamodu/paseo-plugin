# COMPOSER DALGASI KAPANIŞI — hedef seçici SÖKÜLDÜ, İKİ MOD (KURMAY/MANAGER) + minimal üst satır + 2 satır büyüyen metin kutusu

Tarih: 2026-11-04 (kapanış 20:0x ölçümle) · dalga: COMPOSER · kapanış: tam kapı 260/260 EXIT=0

## Operatör emirleri (verbatim)

1. «ordu composer içindeki chat metin kutusu tasarımını bozuk buradaki select menü değişemez bu şekilde bu hatalı ... bunu kaldır sadece kurmay ve manager (prpje yönetici ajanı) olarak iki mod kalsın dedik .. bu şekilde oturum seçemezsin üstte .. oturum üstte düğme ile geliyor ve history oturum ikisi birbirine bağlı izole çalışır değişmez bu ssot belgedir»
2. İZOLASYON SSOT: «her proje izoledir ve her proje altındaki her oturum birbirinden izoledir bu ssot emirdir . aksi olmadıkça ajanlar diğer konuşmaya dahil olamaz izin verilmediği sürece .. kurmay farklıdır»
3. «select menü üstte txt buton olsun minimal kurmay ve manager olarak»
4. «metin kutusunu iiki satır yükseklikte sabitle eğer daha fazla yazı gelirse metin kutusuna metin kutusunu yükseltebilirsin kaydırma çubuğu başlangçta olmasın yükselt ve belli seviyeden sorna kaydırma çubuğu gelsin»
5. «ayrıca paseodaki metin kutusunu örnek alabilirsin görebiliyormusun tasarım olarak» → **EVET, ölçüldü:** Paseo masaüstü (Electron) app-dist web paketi bundle'ından çıkarıldı — `textInput { width:100%, lineHeight:1.4*fontSize, outline:none }` (kenarsız iç girdi) + `buttonRow { alignItems:flex-end, space-between }` + büyüme `mode:"measured" { height, minHeight, maxHeight }` + **`scrollEnabled: f >= c`** (kaydırma YALNIZ yükseklik tavana ulaşınca açılır — altında kaydırma çubuğu YOK). Panel uygulaması bu deseni birebir taşır.

## Çözüm (pano/ordu-panosu.html)

**(1) Hedef SELECT'i SÖKÜLDÜ → İKİ MOD:** `composerMod` ("kurmay"|"manager") bellek-içi (localStorage YOK — yenileme KURMAY'a döner, kayıtlı karar). Hedef `hedefKimligi()` gönderim ANINDA hesaplar:
- **KURMAY:** `kurmayKimligi()` — kadro birliklerinden `tur === "kurmay" && ajanId` ölçülmüş (kadro SSOT; şu an KURMAY-1 = 8cc610a4). İzolasyonun TEK istisnası.
- **MANAGER (proje yönetici ajanı):** `seciliKonusma.ajan.ajanKimligi` — seçili OTURUMUN KENDİ ajanı (oturumu yöneten = proje içi manager). Başka oturumun ajanı UI'da SEÇİLEMEZ (izolasyon SSOT; sunucu beyaz listesi 2. katman).
- **Fail-closed:** kadro ölçülememişse KURMAY düğmesi, oturum seçilmemişse MANAGER düğmesi devre-dışı + dürüst title; devre-dışı düğme seçilemez. Submit doğrulamaları dürüst yüzler: «oturum seçilmedi — gezgin ağacından oturum seç…» / «kurmay kimliği yok (kadro ölçümü bekleniyor…)» / «mesaj boş».

**(2) Mod düğmeleri ÜST SATIRDA (emir 3):** `composerMod` satırı composerBar DIŞINDA, girdinin ÜSTÜNDE (Paseo buttonRow modeli — düğmeler girdiden ayrı satırda). **Minimal METİN düğmesi:** arka plan/kenar YOK (`border:none; background:transparent`), aktif mod camgöbeği + 2px alt çizgi; hover metin rengi; focus-visible outline aynen.

**(3) Metin kutusu 2 SATIR sabit → büyür → tavanda kaydırma (emir 4 + Paseo deseni):** textarea `rows="2"` + CSS `min-height:62px; max-height:140px; overflow-y:hidden`. `composerBoyutla()`: yükseklik = min(scrollHeight, 140); **kaydırma çubuğu YALNIZ `scrollHeight >= 140`'te açılır** (`overflowY = tavandami ? "auto" : "hidden"` — Paseo `scrollEnabled: f>=c`); gönderim sonrası kutu 2 satıra DÖNER (submit içinde çağrılır). Enter gönderir / Shift+Enter yeni satır / IME isComposing reddi aynen.

**(4) Sökülenler:** `composerHedef` select (2 optgroup) + `composerHedefGuncelle` + `konusmaSecGuncelle(secimiZorla)` parametresi (artık argümansız) + select-zorlama dalı. 5 çağrı noktası + boot `composerModGuncelle()` (açılışta dürüst ilk durum).

## Kanıt

- **Tam kapı: `node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs` = 260 tests / 260 pass / 0 fail / EXIT=0** (test bloğu sayısı 260 SABİT — pinler mevcut testlere gömüldü: 51g yeniden yazıldı [mod-bazlı doğrulama 3 yüzü + auto-grow VM 3 senaryosu: input kayıtlı / tavan 140px+auto / 2 satır 62px+hidden] + 51e VM mod senaryoları [tıklanan oturuma MANAGER bağlanır, KURMAY değişmez, mod kalıcı] + 51b mod düğme sham'ları [normal geçiş + kadro YOK + oturum YOK devre-dışı] + kaynak pinleri [mod bloğu + rows=2 + 62/140/hidden CSS + tavandami toggle + optgroup ÖĞESİ 0 + projeEtiketi 6 eşleşme — composer kullanımı söküldü + konusmaSecGuncelle argümansız] + 51i sıra pini [MOD ÜSTTE → Mesaj → Ekle → GÖNDER] + 51u §4 minimal metin pini [border:none + alt çizgi, PILL DEĞİL] + 51r ağaç tıklaması [argless + MANAGER hedefi] + 51t/51v stub'ları composerModGuncelle).
- **Servis:** GET 127.0.0.1:4937/ordu **HTTP 200 · 153.174** — composerMod/modKurmay/modManager + rows="2" + overflow-y:hidden + `tavandami ? "auto" : "hidden"` + minimal düğme stili SERVİSTE; **optgroup 0**. **server.js DEĞİŞMEDİ → restart GEREKMEDİ** (statik dosya her istekte diskten); operatör restart bildirdi — ölçüm: PID 20964 AYNEN, 4377 BOŞ (deney limanı işgal edilmedi, restart doğru limanda) — zararsız.
- Durust eksik: canlı DOM/PNG YAPILAMADI (browser automation host bağlı değil — VM + kaynak pinleriyle ölçüldü; host dönerse eklenebilir).
- **LOC: 11.477 → 11.577 (+100; dalga tavanı +200 içinde; doluluk %64,3 — 18.000'e bol nefes).**

## Operatöre kullanım

- Girdi kutusunun ÜSTÜNDE **KURMAY | MANAGER** metin düğmeleri: KURMAY = ordu sistem ajanına (izolasyon istisnası); MANAGER = seçili oturumun kendi ajanına gönderir. Oturum seçimi gezgin ağacındaki düğmeyle (izole — SSOT).
- Metin kutusu 2 satır başlar, yazdıkça uzar, ~6 satırdan sonra kaydırma çubuğu gelir. Enter gönderir, Shift+Enter alt satır.

## Bekleyen (operatör onaylı sıra)

- SIRADA: **K-0065 Dalga B** (yeni oturum: POST /api/spawn-talebi + hareket defteri kaydı) → M2 sağ panel metrik gösterimi + rename.
- K7 push (birikim 70 → bu committe 71).
