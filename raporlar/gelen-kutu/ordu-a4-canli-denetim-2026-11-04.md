# ORDU-A4 — 4937 canlı pano sunucusu uçtan-uca salt-okur denetim (A4)

- Dalga: A4 canlı servis denetimi · Yazıcı: coder ajanı [glm53u-claude/glm-5.3; ajanId bu oturumda ölçülemedi] · Koordinatör: KURMAY-1 8cc610a4
- Tarih: 2026-11-04 22:56:23 (+03:00, date komutuyla ölçüldü) · Kayıt: raporlar/gelen-kutu/ordu-a4-canli-denetim-2026-11-04.md + aynı adlı .json
- Sınır uyumu: salt-okur denetim · token DEĞERİ hiçbir komutta/çıktıda GÖRÜNMEDİ (yalnız durum koduyla ölçüldü; C:\Users\gatep\pano-token-4937.txt OKUNMADI) · sunucu restart/durdurma YOK · 4377'ye DOKUNULMADI · pano koduna yazma YOK · tek yazma POST'u = bilinçli token'sız 401 testi

## Ölçüm ortamı

- Hedef: http://127.0.0.1:4937 (PID 36940, StartTime 2026-11-04 22:22:49 ölçüldü — STATE_BOARD satır 3 ile BİREBİR)
- Ölçüm zamanları: GET uçları 22:37:26 · POST/port/PID 22:49-22:55 · damga 22:56:23 (tümü komutla ölçüldü)
- Yöntem: Invoke-WebRequest -UseBasicParsing + curl (Git Bash) + netstat + Get-Process

## Uç tablosu (6 GET + 1 POST + portlar + süreç)

| Uç | HTTP | Bayt | Gövde (üst düzey alanlar + dürüst özet) |
|---|---|---|---|
| GET /ordu | 200 | 172.227 | HTML; disk kaynağı pano/ordu-panosu.html her istekte okunur (Cache-Control: no-store; server.js:256-260). Disk boyutu = HTTP yanıtı BİREBİR (172.227) |
| GET /api/ordu/kadro | 200 | 17.419 | olcumAniISO, surum(4), damgaISO, kaynak, not, rolAtamasi, birlikler(9), kiraEtiketi. Kaynak: pano/ordu-kadro.json (disk; server.js:413-418, yoksa 404 fail-closed). Kaynak alanı canlı Paseo ölçüm zincirini dürüst anlatıyor (schedule + tur geçmişi + list_agents 2026-11-01T15:12Z) |
| GET /api/ordu/projeler | 200 | 271.566 | olcumAniISO, projeler(76), atlanan, kapsamNotu, onbellek. 76 proje = Dalga C canlı DOM ölçümüyle (76 satır) TUTARLI. Örnek satır gerçek veri: sprint53-alias · 1 ajan · idle · sonEtkinlik 2026-10-31T07:12Z · provider claude-glm (uydurma YOK) |
| GET /api/ordu/metrik | 200 | 156 | toplam 0 · bozukSatir 0 · son24s {toplam 0, ok 0, hata 0, ortSureMs null} · turler {} · sonHareketISO null — DÜRÜST SIFIR (aşağıda çapraz-kontrol) |
| GET /api/ordu/spawn-kuyruk | 200 | 123 | toplamTalep 0 · kuyrukta 0 · islenen 0 · hatali 0 · bozukSatir 0 · talepler [] — DÜRÜST SIFIR (aşağıda çapraz-kontrol) |
| GET /api/graf | 200 | 58.194 | schemaSurum, grafSurumu, grafSurumGecmisi, is, tarih, insanOkurIkiz, kural, ajanKadrosu, roller, yetkiMatrisi, replanKurallari, simulasyon, gorevler, kenarlar, kritikYol, butceToplam, planOtoritesi, onayKarari, planOnayi, butceGecmisi, tarihselKenarlar, bagimlilikPolitikasi, sonDenetimKarari, teknikButceGozdenGecirme (27 üst düzey anahtar). Kaynak: plans/gorev-grafigi-2026-10-26.json her istekte diskten (server.js:262-268; bayat önbellek yok) |
| POST /api/mesaj (token'sız) | **401** | — | {"hata":"token gecersiz"} — **TOKEN SET kanıtı** (server.js:556 !TOKEN→403; 557 TOKEN var + geçersiz → 401; STATE_BOARD beklentisiyle eşleşti). Kapı sırası: token kontrolü gövde ayrıştırmadan ÖNCE → gerçek mesaj ASLA gönderilmedi, hareket defterine KAYIT YAZILMADI |
| Port 4377 | — | — | LISTEN YOK = BOŞ (dokunulmadı) |
| Port 4937 | — | — | LISTENING 127.0.0.1:4937 · OwningProcess **36940** (sunucu + PID tek sürece bağlı) |
| PID 36940 | — | — | node · StartTime 2026-11-04 22:22:49 · CPU 2,3 sn (Get-Process ile ölçüldü) |

## Dürüst sıfır çapraz-kontrolü (sahte veri olmadığına kanıt)

- core/data/hareket-defteri.jsonl **YOK** (varsayılan yol server.js:60; Glob ile doğrulandı) + metrik `toplam 0, sonHareketISO null` → TUTARLI: canlı sunucuda hiçbir başarılı POST olmadı (401/403 fail-closed kapı), defter hiç oluşmadı. Sıfır raporu uydurma DEĞİL.
- core/data/spawn-kuyrugu.jsonl **YOK** (varsayılan yol server.js:65) + kuyruk `toplamTalep 0, talepler []` → TUTARLI: hiç talep düşmedi, kuyruk dosyası oluşmadı.
- Kaynak SSOT dosyaları diskte mevcut: pano/ordu-panosu.html, pano/ordu-kadro.json, plans/gorev-grafigi-2026-10-26.json (Glob).
- Not: süreç env'inde ORDU_HAREKET_DEFTERI/ORDU_SPAWN_KUYRUGU farklı yol taşıyorsa dosya başka yerde olurdu; ancak uçlar sıfır raporladığından env yolu fark etmeksizin dürüst sıfır TUTARLI (veri olsaydı uçlar sıfır olamazdı).

## Bulgu: /ordu bayt ölçümü yöntem farkı (hata değil)

Bu denetim: 172.227 **bayt** (HTTP yanıtı = disk boyutu birebir). Önceki damgalardaki 165.345 değeri karakter sayımıdır (UTF-8 çok-baytlı Türkçe karakterler: fark 6.882). İkisi de doğru; birim etiketi farkı. Sonraki damgalarda birim açık yazılmalı («bayt»).

## Dürüst eksikler

- 200 («ileti ulaştı») / 202 («kuyrukta») canlı POST yolları bu denetimde ölçÜLEMEDİ — token'sız denetim kısıtı (token değeri ajan çıkışında görünmez ilkesi gereği kasıtlı). Bu yollar token'li operatör testinde ölçülür.
- Token DEĞERİ hiçbir şekilde doğrulanmadı/okunmadı — TOKEN SET çıkarımı yalnız 401 durum kodu + gövde metninden (metod: 403→401 değişimi, 792217b restart-ek kanıtıyla aynı).
- /api/ordu/projeler `atlanan` alanının değeri bu kayıtta örneklenmedi (anahtar mevcut; değer muhtemelen boş liste).

## Sonuç

4937 canlı sunucusu (PID 36940) tam denetim sağlıklı: 6/6 GET ucu 200 + disk SSOT kaynaklı gerçek veri; token kapısı 401 fail-closed ÇALIŞIYOR (TOKEN SET); 4377 boş ve dokunulmadı; süreç kimliği STATE_BOARD ile birebir. Sorun bulunamadı — kayıt bilgilendirme amaçlıdır (maddeler siddet: bilgi).


## İşlenme

- 2026-11-04 23:1x — KURMAY: bulgu YOK tespiti + canlı sağlık ölçümleri (6/6 GET 200 · tokensız POST 401 = TOKEN SET · 4377 BOŞ · dürüst sıfırlar) STATE_BOARD echo'ya ve M2 raporuna işlendi.
