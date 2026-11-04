# M2 SAĞ PANEL + RENAME — KAPANIŞ (operatör sırasının 7. adımı: «M2 sağ panel + rename»)

Tarih: 2026-11-04 23:11 (ölçüldü, Get-Date) · kapanış: tam kapı **271/271/0 EXIT=0** (YENİ baseline 271 = 266 + 51ad + A1'in 4 rename testi) · HEAD 792217b üstüne.

## Operatör emirleri (bu pencere)

- «Devam» → M2 (onaylı dalga sırası 7. adım: M2 sağ panel + rename).
- M1 şartı (devam eden bağ): **«gereksiz hiçbir state olmayacak»** + «şimdi kurmay ile başlayan tüm hareketlerde herşeyi metrikler altında yönetim parametresi yapmalıyız sağ panelde en önemlileri görmeliyiz».
- «6 ajan ata ve tüm sorunları gider» → M2 yürütülürken 6 ajan koordinasyonu (aşağıda).

## M2a — sağ panel YÖNETİM metrik kartı (KURMAY; `pano/ordu-panosu.html`)

**YENİ KALICI STATE YOK** (M1 şartı): kart veriyi MEVCUT iki kaynaktan türetir — `GET /api/ordu/metrik` (M1'den beri canlı uç) + P (proje taraması; ağaç zaten çekiyor).

- **HTML:** `#metrikKarti` `#grafPanel` İÇİNDE `#grafAlani`'nden ÖNCE — her sekme görünümünde kalıcı. Fail-closed açılış satırı: «yönetim metrikleri yüklenmedi (fail-closed)». aria-label: «yönetim — hareket metrikleri ve otonomi göstergesi».
- **CSS:** kart çerçevesi + `.metrikEtiket` (mono uppercase 11px) + `.metrikSatir` + `.metrikSayi` (kalın) + `.metrikHata` (tehlike) + `.metrikTur` (ikincil).
- **JS:** `otonomiTurev()` — P'den türev: proje sayısı · toplam ajan · çalışan (lastStatus running) · hatalı (error) · son etkinlik ISO (en büyük). `metrikKartYaz()` — dürüst yüzler: hareket (24 sa): X ok · H hata (hata>0'da kırmızı) · ort N ms · tür satırı (gerçek turler) · toplam · bozuk satır SAYILIR (gizlenmez — E10) · son KURMAY hareketi · otonomi satırı (P yoksa «ölçülemedi (proje taraması bekleniyor)»). `metrikYukle()` — FAZ-P deseni: uçucu `olcumAniISO` parmak DIŞI (her tur yeniden render YOK), aynı-veri atlama, hata-bayat-koruma (yalnız hiç yüklenmediyse kırmızı yüz).
- **`hepsiniYukle` 5→6 AYAK** (metrikYukle eklendi; kuyrukYukle 5. ayak emsali).
- **`UC.metrik` + `SON_YANIT.metrik`** — POST YOK, yalnız salt-okur GET (token gerekmez).

## M2b — rename talebi zinciri çekirdeği + server ucu (ORDU-M2-A1 ajanı; 4 dosya)

K-0065 deseninin rename uyarlaması: **panel YENİ ADLAYMAZ — TALEP DÜŞÜRÜR; KURMAY MCP ile işler.**

- `pano/ordu-rename.mjs` YENİ 93 satır — `talepEkle`/`sonucEkle` (append-only fsync JSONL; RED throw — KESME YOK: hedefTip 'proje'|'oturum', hedef ≤200, yeniAd dolu ≤200; talepId/zaman içeride) + `kuyrukOzet` (salt-okur read-model: durum TÜRETİLİR kuyrukta|islandi|hata; en son sonuç kazanır; bozuk satır SAYILIR; pencere son 200 talep; yeniAd TAM okunur — kısa alan) + tek yeni kalıcı state = append-only kuyruk JSONL (ordu-spawn.mjs deseni birebir).
- `pano/server.js` +~75 — POST `/api/rename-talebi` (token zinciri 403/401 → 400 json/hedefTip → 422 uzun → 400 hedef taramada yok [izolasyon SSOT: proje = projelerTara whitelist, oturum = hedefBeyazListe] → 429 aynı hedef 10 sn → 500 kuyruk yazılamadı → 202 kurmay çözülemedi [bilinçli fark: spawn-talebi 503'ten — rename zincirin başına bağlı değil, talep kuyrukta kalır] → 200 iletildi/202 iletilmedi) + GET `/api/ordu/rename-kuyruk` (salt-okur token'sız read-model) + hareket defteri tur `rename-talebi` (M1; token YAZILMAZ).
- `pano/ordu-metrik.mjs` — HAREKET_TURLERI + "rename-talebi" (çekirdek bilinmeyen turu RED'lediğinden burada bilinmeli).
- `pano/rename-ucu.test.mjs` YENİ — 4 test: çekirdek RED'ler + read-model + izole server zinciri + uçtan-uca.

## Kanıt

- **Tam kapı: 271 tests / 271 pass / 0 fail / EXIT=0** (ayrı komutla ölçüldü; bu pencerede 4 tam kapı + 2 tek-dosya teşhis — 51v teşhisi: metrik fonksiyon BİLDİRİMİ fazpekKos diliminde VM'in ctx stub'ını ezdiği için `cek(UC.metrik)` 4. isteği atıyordu; çözüm: koşudan SONRA stub'ı geri ata — kuyrukYukle deseni, davranış pini 51ad'te gerçek dilimle. A3 ajanı aynı teşhise bağımsız vardı: raporlar/gelen-kutu/ordu-a3-kapi-saglik-2026-11-04.md).
- **Test 51ad YENİ** (2 bölüm): 7 kaynak pini (kart HTML konumu/aria/fail-closed; UC.metrik + SON_YANIT + async metrikYukle; olcumAniISO parmak dışı; otonomiTurev kaynak; dürüst yüz metinleri; ilk-yükleme hatası) + 6 VM senaryosu (otonomiTurev sayımı — ISO'suz ajan hariç; ilk render — sayılar span-sarmalı pinler; parmak aynı-veri atlama; P değişimi yeniden render; ilk-yükleme hatası kırmızı yüz; boş defter + P null — dürüst sıfır yüz).
- **12 bilinçli pin güncellemesi** (M2a genişletmesi): test 46/51 POST 6→7 (M2b'nin +1 ucu) · cek sayıları 4→5 (test 5/10d/51l/51n) · Promise.all 5→6 (test 5/51r/51v) · SON_YANIT tanım dizesi + parmak-null sayıları 3→4 (51v) · hepsiniYukle 5→6 ayak (51ac).
- **Canlı servis kanıtı (4937, PID 36940):** GET /ordu **200** 165.534 karakter — `metrikKarti` HTML + aria etiketi GÖVDEDE (statik dosya diskten → restart GEREKMEDİ; M2a yalnız HTML) + GET /api/ordu/metrik **200 dürüst sıfır** (toplam 0/bozuk 0/son24 0/türler boş — canlıda mudahale kaydı yok; kart dürüst boş yüz basar). M2b server ucu canlıda **restart'a kadar hizmet dışı** (server.js değişti; restart [insan] onayıyla — aşağıda).
- **6 ajan koordinasyonu** (operatör emri «6 ajan ata ve tüm sorunları gider»; EK-3: 1 yazıcı + 5 salt-okur, brief 4 öğe, ajanlar commit ATMAZ — tek elden KURMAY): A1 yazıcı (M2b çekirdek — yukarıda) + A2 git kalıntı envanteri + A3 kapı/sağlık + A4 canlı 4937 denetim + A5 askıda karar envanteri + A6 devir zinciri. Raporlar: `raporlar/gelen-kutu/ordu-a?-…-2026-11-04.md` + .json (5 rapor işlendi — STATE ek).
- **Dürüst eksikler (E10):** (a) canlı DOM ölçülemedi — browser automation host bağlı DEĞİL (Dalga C'de bağlıydı, bu pencerede «browser_no_host»); kanıt zinciri: servis kanıtı + VM render pini 51ad. (b) Token tarayıcıya girilmedi — canlı POST yolları (GÖNDER 200, rename-talebi 200/202) tarayıcı token'lıyken ölçülebilir (A5 #4). (c) M2c — panel UI tarafı (rename kalem düğmeleri + kart + kuyruk görünümü + projeEtiketi öncelik çevrimi) SONRAKİ DALGA (dalga disiplini: mevcut dosya dokunuşu iş başına ≤3). (d) A1'in 200 «iletildi» yolu izole koşulamadı (gerçek köprü ister — Dalga B/C ile aynı).
- **Test koşu dürüstlüğü: 4 tam kapı** (267/263/4 → 271/267/4 [46+51 A1 eşzamanlı] → 271/269/2 → 271/271) + 2 tek-dosya teşhis (51v, 51ad). Bütçe ≤4'e DEĞDİ — aşılmadı.
- **LOC: 11.632 → 12.229 (+597)** — ölçüm karesi `pano/` mjs+js+html `@(Get-Content).Count`, 34 dosya. Dalga tavanı +200 AŞILDI (+397): M2a+M2b BİRLEŞİK kapanış (onaylı sıranın 7. adımı TEK adım: «M2 sağ panel + rename») — M2a'nın payı ~+300 (UI + 51ad), M2b'nin ~+300 (çekirdek + uç + 4 test); mevcut dosya dokunuşu: M2a 2 dosya (html + test), M2b 4 dosya (2 YENİ + 2 mevcut). Doluluk **%67,9** (12.229/18.000 — bol nefes).

## Z1 + kayıt

- CODEMAP taze (raporlardan SONRA koşuldu — bu rapor + STATE + gelen-kutu 5 işleme damgası dahil).
- Makine-okunur yan dosya: [m2.json](m2.json).

## Operatöre kullanım

- Sağ panelde YÖNETİM kartı: 30 sn döngüsünde otomatik tazelenir (click ile anında). Boş defterde dürüst sıfır yüz; KURMAY hareketi (mudahale/spawn-talebi/rename-talebi) doğdukça tür satırı dolar.
- rename talebi düşürmek (M2c UI'si çıkana dek): POST /api/rename-talebi doğrudan ya da M2c dalgasında panel düğmeleriyle.
- Canlı sunucuda rename ucunu açmak: restart [insan] onayıyla — `$env:PANO_TOKEN='<token>'; $env:PANO_PORT='4937'; node pano/server.js`.

## Bekleyen (operatör onaylı sıra)

- **SIRADA: «tüm yüzey testleri uçtan uca, kullanıcı gibi»** (operatör emri bekliyor — tarayıcı turu; browser host'un bağlanması + token'ın AYARLAR'dan girilmesi gerekiyor).
- M2c: rename UI tarafı (panel düğmeleri + kart + kuyruk görünümü).
- Ajan raporu bulguları [insan] sırası: K7 push (birikim 76 → bu committe 77) · F1 113 D kapanışı · AGENTS.md ölü yollar (plugin/ + sozlesme/ diskte yok — A2 #2) · ADR-dc-3 bütçe · K-0058 · K-0064 kayıtsız · G01/G02/G03 kapıları · sağlık ölçümleri bayat (probe/bench/katalog regen).
- 4937 restart (M2b ucunun canlıya alınması — [insan]).
