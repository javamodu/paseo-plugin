# M1 METRİK dalgası — KURMAY hareket-metrik çekirdeği (defter + özet read-model)

Tarih: 2026-11-04 17:56 · Yazıcı: KURMAY-1 (8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7, glm53u-claude) · Durum: KAPALI

## Emirler (verbatim)

- «şimdi kurmay ile başlayan tüm hareketlerde herşeyi metrikler altınnda yönetim parametresi yapmalısyız sağ panelde en önemlileri görmeliyiz»
- «gereksiz giçbir state olmayacak tüm hedef izleme yönetme ve kendi kendine ordu çalışıyor mu»

## Ne yapıldı (M1 — çekirdek; sağ panel gösterimi M2/FAZ-V dalgası)

- **pano/ordu-metrik.mjs YENİ** (74 satır): `hareketKaydet(yol, hareket)` — hareket doğrulaması (tur ∈ mudahale/spawn-talebi/spawn-sonuc; hedef dolgu; sonuc ok|hata; sureMs sonlu sayı) geçersizse RED — çöp deftere yazılmaz (fail-closed, E10); zamanISO YALNIZ burada eklenir (tek doğru kaynak); append-only JSONL + fsync (defterEkle deseni). `metrikOzet(yol)` — salt-okur read-model: toplam · bozukSatır (atlanır+SAYILIR, gizlenmez) · son24s {toplam, ok, hata, ortSureMs} · turler kırılımı + sonZamanISO · sonHareketISO · olcumAniISO (pencere dürüstlük etiketi). Defter YOK/BOŞ → dürüst SIFIR özet (hata DEĞİL).
- **pano/server.js ince kanca** (+~20 net): HAREKET_DEFTERI sabiti (env ORDU_HAREKET_DEFTERI — izole test kancası; varsayılan core/data/hareket-defteri.jsonl); /api/mesaj her gönderim denemesini hareket olarak yazar (t0 süre ölçümü; 200→ok, 503/502/500→hata + kısa detay, token ASLA kayda girmez); yanıt `kayit: "yazildi"|"yazilamadi: …"` bayrağı taşır (defter yazımı başarısızsa dürüst söylenir — GD-005/E10 deseni). YENİ uç: GET /api/ordu/metrik (salt-okur, diğer /api/ordu/* GET'leri gibi token kapısız) → metrikOzet.
- **Gereksiz state YOK**: TEK yeni kalıcı state = hareket defteri (KURMAY hareketlerinin bugün HİÇBİR kalıcı kaydı yoktu — yönetim metriğinin ham maddesi). Otonomi («ordu kendi kendine çalışıyor mu») + hedef izleme ölçümleri mevcut SSOT'lardan türetilecek (projelerTara son etkinlik/durum sayıları) — M2 sağ panel dalgasında, yeni state AÇILMAZ.

## Kanıt

- **Tam kapı**: `node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs` = **320 tests / 320 pass / 0 fail / EXIT=0** (314 → 320; +6: ordu-metrik.test.mjs YENİ 75-79 [kayıt+trim+zamanISO+mkdir · yok-defter dürüst sıfır · kırılım+ortSureMs 150 · bozuk satır sayılır + 24s pencere dışı · RED'ler defter satırı bırakmaz] + mesaj-ucu 74- [İZOLE SUNUCU uçtan-uca: ORDU_HAREKET_DEFTERI temp yola; 503 müdahalesi deftere YAZILIR + kayit:'yazildi' + kayıtta token YOK + GET /api/ordu/metrik AYNI kaydı okur — SSOT tek defter]).
- **Üretim restart GEREKLİ — [insan] onayı BEKLİYOR**: server.js değişti; 4937 üretim süreci (PID 11680) hâlâ eski kodu koşturuyor → /api/ordu/metrik ucu + hareket kaydı üretimde CANLI DEĞİL. Davranış izole sunucu testiyle uçtan-uca kanıtlandı; restart operatör onayınla (izleyen görünüm dalgası da server.js'e dokunursa TEK restart ikisini kapsar).
- **LOC DELTA (K-0062)**: pano/ 17.665 → **17.875, net +210** — +200 üstü → koordinatör gerekçesi: yeni çekirdek modül + test yüzeyi (salt ekleme, sökülen YOK; hareket defteri katmanı bir kez yazılır, tekrar büyümez). **18.000 tavanına 125 satır kaldı (%99,3 doluluk)** → ARŞİV dalgası (PANEL-DALGA-SIRASI #2, −6.500 adayı: kapsul-tuval.html 2870 · deney-panel.html 1134 · deney-server.mjs 810 · orkestra.html 307 · mockup 330) sıradaki dalgalardan ÖNCE öne çekilmeli — %100 kilidine dayanmadan.

## Kuyruk (bu turda gelen YENİ emirler — sıradaki dalga)

- «ordu panelinde metin kesildi (2000 karakter tavanı — TAM metin sunucudaki transcript dosyasında kalır) yazıyor böyle demede devamı diyelim tıklayınca açılsın»
- «sol panelde proje isimlerini daha büyük yaz»

## Kapsam

pano/ordu-metrik.mjs YENİ · pano/ordu-metrik.test.mjs YENİ · pano/server.js M · pano/mesaj-ucu.test.mjs M (74-) · raporlar/pano-metrik-2026-11-04/ YENİ · CODEMAP.md M · STATE_BOARD.md M

## Notlar

- Dalga B (K-0065 spawn-talebi) aynı defterden kayıt alacak (tur 'spawn-talebi' hazır).
- Bu kayıt YERELDİR — push ayrı emir (K7; birikim 66 → bu committe 67).
