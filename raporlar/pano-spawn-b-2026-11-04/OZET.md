# K-0065 DALGA B KAPANIŞI — SPAWN-TALEBİ KUYRUĞU: panel TALEP düşürür, KURMAY işler (server spawn ETMEZ)

Tarih: 2026-11-04 20:21 (ölçüldü, Get-Date) · dalga: K-0065 Dalga B · kapanış: tam kapı **265/265 EXIT=0** (YENİ baseline 265 — 260 sabit + 5 yeni blok 80-84)

## Operatör emri

«Devam sıradaki» — onaylı dalga sırasının 5. adımı (1. restart ✓ · 2. ARŞİV ✓ · 3. TRANSCRIPT-CANLI ✓ · 4. COMPOSER ✓ · **5. K-0065 Dalga B** · 6. M2 sağ panel + rename).

Karar kaydı: [kararlar/K-0065.md](../../kararlar/K-0065.md) (ONAYLANDI) — **+ düğmesi KENDİ spawn ETMEZ — spawn TALEBİ düşürür.** Zincir: operatör → panel `POST /api/spawn-talebi` (token kapılı, fail-closed) → talep diske (kuyruk) + KURMAY-1'e kısa bildirim → KURMAY MCP `create_agent` işletir → sonuç diskte → panel diskten okur (SSOT). Panel sunucusu ajan süreci YÖNETMEZ.

## Çözüm

**(1) `pano/ordu-spawn.mjs` YENİ (106 satır) — kuyruk çekirdeği:**
- `talepEkle`: append-only fsync JSONL kayıt `{tur:"talep", talepId(uuid), zamanISO, proje, baslik?, ilkMesaj?}` — talepId/zaman içeride üretilir (tek doğru kaynak); doğrulama RED'ler **throw** (proje zorunlu ≤200 · baslik ≤200 · ilkMesaj ≤3000 — **kesme YOK**: sınırı aşan girdi dürüst reddedilir).
- `sonucEkle`: `{tur:"sonuc", talepId, durum:"islandi"|"hata", zamanISO, ajanId?, detay?}` — KURMAY create_agent sonrası yazar (talepId eşleşmeli).
- `kuyrukOzet`: salt-okur read-model — durum TÜRETİLİR (`kuyrukta` | `islandi` | `hata`); her talep yalnız EN SON sonucunu taşır (zamanISO karşılaştırması); bozuk satır atlanır + **SAYILIR** (gizlenmez — E10); `ilkMesaj` 300 karakter okuma penceresiyle kısaltılır + `ilkMesajKisitli` bayrağı (TAM metin kuyruk dosyasında — KURMAY dosyadan okur); 200 talep okuma penceresi (defter append-only — panel silmez).
- `kurmayKimligiCoz`: kadro SSOT'tan `tur:"kurmay"` + ölçülmüş `ajanId` (MANAGER şablonu ajanId taşımaz → atlanır — panel `kurmayKimligi()` ile AYNI kural); çözülemez → null (fail-closed, uydurulmaz).

**(2) `pano/server.js` ince kanca (+79):**
- `ORDU_SPAWN_KUYRUGU` env (izole test kancası) + `SPAWN_ARALIK_MS 10_000` + `sonSpawnTalebi` Map (bellek-içi — sonGonderim deseni).
- **POST `/api/spawn-talebi`** — token zinciri /api/mesaj deseni: 403 (TOKEN yok) → 401 (yanlış token) → 400 (json / nesne / proje boş) → 422 (baslik/ilkMesaj uzun) → **400 proje taramada yok** (projelerTara whitelist — İZOLASYON SSOT: yalnız MEVCUT proje altına oturum doğar) → 429 (aynı proje min 10sn) → **503 kurmay çözülemedi** (kadro SSOT — talep DÜŞMEZ, fail-closed: zincirin başı kopuk) → 500 (kuyruk yazımı) → talep kuyruğa + **KISA bildirim** KURMAY'a (talepId + proje + baslık + kuyruk yolu — brif KUYRUKTA kalır, SSOT) → **200** bildirim iletildi / **202** iletilmedi (talep kuyrukta KALIR — /api/mesaj'tan bilinçli fark: orada amaç mesajın gitmesiydi → 503; burada amaç talebin kuyruğa düşmesi → 202). Hareket defterine `tur:"spawn-talebi"` kaydı (M1; token YAZILMAZ).
- **GET `/api/ordu/spawn-kuyruk`** — salt-okur token'sız read-model (diğer /api/ordu/* GET'leri deseni); durum dürüst: `kuyrukta | islandi | hata` — **sahte «açıldı» YOK (E10)**.

**(3) `pano/spawn-ucu.test.mjs` YENİ (246 satır; bloklar 80-84) + `ordu-panosu.test.mjs` 2 pin güncellemesi** (POST ucu sayısı 5 → 6 — bilinçli K-0065 genişletmesi; test 46 + 51).

## Kanıt

- **Tam kapı: `node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs` = 265 tests / 265 pass / 0 fail / EXIT=0.**
- Test 80: çekirdek RED'ler (throw; RED'lerde kuyruğa çöp YAZILMAZ — dosya yok/boş) + kayıt şekli (uuid/ISO/trim; boş alan yazılmaz) + append-only 2 satır + sonucEkle doğrulamaları.
- Test 81: kuyrukOzet — dosya YOK dürüst sıfır; uzun ilkMesaj DOSYADA TAM 350 / read-model 300 + bayrak; hata→islandi EN SON kazanır; bozuk satır SAYILIR + kayıtları etkilemez; kaynak pini KUYRUK_TAVAN 200.
- Test 82: kurmayKimligiCoz — şablon atlanır; savasci eşleşmez; bozuk JSON / dosya yok → null.
- Test 83 (izole server, PANO_PORT=0): 403 → 401 → 400 (json/boş proje) → 422 → 400 whitelist → **503 kurmay yok (talep DÜŞMEDİ — kuyruk dosyası YOK)** + GET boş kuyruk dürüst sıfır (salt-okur, token başlığı YOK).
- Test 84 (izole server uçtan-uca): **202** (köprü çözümsüz — GERÇEK paseo send YOK; `PANO_KOPRU_KOK_CMD` var olmayan yol) + talepId + kuyrukta:true + bildirim "iletilmedi" + detay kopru-cozulmedi + kayit "yazildi" + kuyruk dosyası SSOT (talep kaydı) + hareket defteri `spawn-talebi`/hedef KURMAY/**token YAZILMAZ** + GET aynı kuyruğu okur (toplamTalep 1 / kuyrukta 1 / durum "kuyrukta") + **429** (aynı proje hemen) + KURMAY sonuc simülasyonu `sonucEkle` (islandi + ajanId) → GET `islenen 1` + ajanId görünür (panel diskten okur) + kaynak pinleri (uç + env kancası + aralık + hareket türü).
- **Test koşu dürüstlüğü: dalga bütçesi ≤4 AŞILDI** — 6 tam kapı koşusu + 1 tek-dosya teşhis + 1 boot teyidi. İki düzeltme turu gerekti: (a) Edit'te `/api/veri` açılış satırı kazara silindi → syntax hatası (sunucu boot'u teşhis etti; satır geri eklendi); (b) test 46/51 POST-sayısı pinleri 6. ucu regresyon saydı → bilinçli genişletmeyle tazelendi.
- **Dürüst eksikler (E10):** (a) canlı DOM/PNG YOK — Dalga C'de browser host ile (+ düğmesi dalgayla birlikte); (b) 200 «bildirim iletildi» yolu izole testlerde KOŞULAMADI — köprüsüz simülasyon 202'yi ölçer; 200 için GERÇEK köprü gerekir → Dalga C canlı doğrulamasında ölçülecek; (c) **restart YAPILMADI** — server.js DEĞİŞTİ, canlıya alma 4937 restart'ı Dalga C'de [insan] onayıyla (K-0065 planı aynen).
- İzolasyon: kuyruk + hareket defteri + kadro env kancalarıyla tmp yollar — üretim defterine sızıntı YOK (ARSİV dalgası test 69 yaması deseni aynen).
- **LOC: 10.921 → 11.352 (DELTA +431)** — ölçüm karesi: `pano/` mjs+js+html `@(Get-Content).Count`; önceki raporların «11.577» değeri aynı kareyle ölçülmüyor (git'ten `e588ceb` yeniden ölçüm: 10.921, 30 dosya) — d1a/d1b çift-sayım şüphesi; bundan sonraki damgalar bu tek yöntemle. **Dalga tavanı +200 AŞILDI** — gerekçe: yeni çekirdek modül + izole test yüzeyi SALT EKLEME (mevcut dosya dokunuşu yalnız server.js +79 + 2 pin satırı); doluluk **%63,1** (11.352/18.000 — bol nefes).

## Operatöre kullanım

- **UI'da düğme HENÜZ YOK** (Dalga C: hover + düğmesi + uca bağlanma). Elle deneme (restart sonrası): `POST /api/spawn-talebi` gövde `{"proje":"D-Vibecode-ordu","baslik":"...","ilkMesaj":"..."}` + `x-pano-token`; GET `/api/ordu/spawn-kuyruk` token'sız kuyruğu gösterir.
- KURMAY tarafı (bu ajan): bildirim geldiğinde kuyruğu okuyup `create_agent` işletir, sonucu `sonucEkle` ile kuyruğa yazar — panel durumu kendiliğinden gösterir.

## Bekleyen (operatör onaylı sıra)

- **SIRADA: K-0065 Dalga C** — hover + düğmesi + uca bağlanma + canlı DOM + izole 4937 restart (**[insan] onay adımı dalga içinde**).
- M2 sağ panel metrik gösterimi + rename · K7 push (birikim 72 → bu committe 73).

## EK — RESTART UYGULANDI (operatör emri «Restart yap»; ölçüm 2026-11-04 20:34)

Yukarıdaki **«restart YAPILMADI» dürüst eksiği KAPANDI** — operatör restart emrini doğrudan verdi (Dalga C'ye planlanan [insan] onay adımı önden tüketildi; Dalga C artık restart beklemez).

- **Eski süreç:** PID 20964 durduruldu (`Stop-Process`; durduktan sonra 4937'nin BOŞ olduğu ölçüldü).
- **Yeni süreç:** `PANO_PORT=4937` env mirasıyla `node pano/server.js` (D:\Vibecode\ordu) — **PID 18292, StartTime 20:33:10 (ölçüldü)**. Env'siz başlatma 4377'yi açan tuzaktan bilinçli kaçınıldı (ARSİV dalgası dersi).
- **Ölçümler:** GET /ordu **200** (153.174 bayt) · **GET /api/ordu/spawn-kuyruk 200 (123 bayt — DALGA B UCU CANLI)**; gövde dürüst sıfır: `toplamTalep 0, kuyrukta 0, islenen 0, hatali 0, bozukSatir 0, talepler []` · GET /api/ordu/metrik **200** (156 bayt) · token'sız POST /api/mesaj **403** · 4377 **BOŞ** (dokunulmadı).
- **Token durumu (dürüst):** yeni süreç env'inde **PANO_TOKEN yok** — ölçüm yöntemi: token'sız POST → 403 = `!TOKEN` dalı; 401 olsaydı TOKEN set edilmiş demekti. Eski süreç (20964) de tokensiz çalışıyordu → **restart hiçbir POST yetkisini geriletmedi**; POST uçları (GÖNDER + spawn-talebi) zaten 403 fail-closed idi, öyle kaldı. Token DEĞERİ bu ajana hiçbir komutta/çıktıda görünmez. POST'ları açmak isteyen operatör sunucuyu KENDİ terminalinden başlatır: `$env:PANO_TOKEN='<token>'; $env:PANO_PORT='4937'; node pano/server.js` (D:\Vibecode\ordu'dan).
- Makine-okunur kanıt: [restart-ek.json](restart-ek.json).
