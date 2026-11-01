# BAKIM-YAZICI 2026-11-01 — GD-001..006 + GD-008 kapanış raporu

- **damga**: 2026-11-01T05:13 (yerel; ölçüldü — Get-Date)
- **yöntem**: kod değişikliği (3 dosya) + izole koşum (port 4936/0, TEMP veri kopyaları) + A/B ölçüm (repo DIŞI temp, aynı fikstürde HEAD vs yeni kod) + node --test 5 paket; canlı süreçlere dokunulmadı; COMMIT/PUSH YOK (operator tek elden).
- **kaynak**: plans/BAKIM-GUVENLIK-PERFORMANS-PLANI-2026-11-01.md · raporlar/gelen-kutu/GUVENLIK-DENETCI-2026-11-01.md/.json

## Değişen dosyalar

| tür | dosya | kapsam |
|---|---|---|
| DEĞİŞTİ | pano/deney-server.mjs | GD-001 (CORS sabit + POST token kapısı) · GD-002 (manager-yanit işareti) · GD-008 (stat-doğrulamalı okuma + tail + perf_hooks) |
| DEĞİŞTİ | pano/iskelet.html | GD-003 (esc disiplini — imza kapsul-tuval.html:1012 ile birebir) |
| DEĞİŞTİ | pano/server.js | GD-004 (timingSafeEqual) · GD-005 (try/catch + 500) · GD-006 (Buffer.concat) |
| YENİ | pano/deney-server.test.mjs | 13 vaka — GD-001a..f · GD-002 · SH-g · GD-008a..e |
| YENİ | pano/iskelet.test.mjs | 4 vaka — kaynak pin + vm'de esc davranışı + ham desen kalıntısı YOK |
| YENİ | pano/server-bakim.test.mjs | 6 vaka — kaynak pin 3 + davranış 3 (spawn çocuk süreç + ham TCP) |

3. test dosyası gerekçesi (şeffaf): brief "YENİ test dosyaları serbest" diyor, iki ad belirtiyor. server.js'in DAVRANIŞ kanıtı (çocuk süreç spawn + ham TCP parça testi) d1a/d1b deseninin kopyasını gerektirir; d1a/d1b'yi kirletmek yerine tekil amaçlı üçüncü dosya daha temiz. Operator veto ederse 6 vakayı d1b'ye taşıyabilirim.

## Ölçüm tablosu (yalnız ÖLÇÜLEN değerler — tahmin yok)

### Uç davranışları (izole koşum, ölçüldü)

| uç | ÖNCE (HEAD) | SONRA |
|---|---|---|
| POST + token YOK | 200 (yazılıyordu) | **401** |
| POST + yanlış token | 200 | **401** |
| POST + doğru token | 200 | **200** (aynı işlev) |
| POST, PANO_TOKEN tanımsız | 200 | **403 fail-closed** |
| ACAO başlık değeri | `*` | `http://127.0.0.1:4377` (birebir ölçüldü) + DENEY_CORS_ORIGIN izole kanalı |
| OPTIONS preflight | 204 | **204** + X-Pano-Token izinli |
| manager-yanit kaydı | işaretsiz | `dogrulanmamis: true` + aktor sunucu-sabit |
| yazma zinciri atışı (ENOTDIR enjeksiyonu) | süreç CRASH | **500 jsonYaz** + süreç AYAKTA (izleyen istek 200) |
| çok baytlı gövde TCP parçasında bölünmüş | U+FFFD (bozuk echo) | JSON çözümlenir; 1500'lük `ç` dizisi echo'da BOZULMAMIŞ |
| log kuyruğu | 400 satırın tamamı okunur | son-80 (sira 320..399); dış append sonrası okuma ≤ 16 384 B |

### GD-008 /api/deney/durum okuma maliyeti — A/B, aynı fikstür (log.jsonl 400 satır = 63 090 B + 5 JSON + 3 JSONL + GRAF SSOT 73 839 B; toplam 138 168 B)

| metrik | ÖNCE (HEAD — tam tarama, önbellek YOK) | SONRA (stat-doğrulamalı + tail) |
|---|---|---|
| çağrı-başı disk okuma | ~**138 168 B** (yapısal: tüm dosyalar her çağrıda) | 1. çağrı **91 462 B** (= 138 168 − 63 090 + 16 384 — tail penceresi matematiği BİREBİR) · 2..21. çağrı **0 B / 0 okuma** |
| istemci-duvarı medyan (21 çağrı) | 33,366 / 63,823 / 107,369 ms (3 koşu; gürültülü 16–239 ms) | 11,809 / 14,305 / 9,967 ms (3 koşu) |
| sunucu-içi süre (perf_hooks — kayıtlı ölçüm) | ölçüm noktası YOK | 1. çağrı 134,4 / 271,7 ms (soğuk) · sürekli durum medyan **1,374 ms** |
| ölçüm kaydı | yok | yanıt `perf` alanı + modül `olcumOku()` (O2 puan kaynağı — SH-f) |

Not: istemci-duvarı süreler Windows disk önbelleği nedeniyle koşular arası gürültülüdür; kararlı ve dürüst metrik perf_hooks sunucu-içi ölçümüdür (1,374 ms medyan) + bayt sayıları (yapısal, kesin). "Restartsız taze" korunur: her istekte statSync doğrulama — değişiklik anında yeniden okuma (GD-008d kanıtı: append sonrası sira=400 restartsız göründü).

## Test sonuçları (hepsi bu oturumda ölçüldü)

- pano/iskelet.test.mjs **4/4** · pano/deney-server.test.mjs **13/13** · pano/server-bakim.test.mjs **6/6**
- pano/graf-yaz.test.mjs **7/7** · pano/graf-yonetim.test.mjs **32/32** (bozulma YOK; final koşum 62/62 FAIL 0)
- pano/kapsul-tuval.test.mjs **47/47** (ORDU-1'in — dokunulmadı, yalnız doğrulandı)
- d1a **6/7** · d1b **11/12** — 2 başarısızlık ÖNCE DE VAR (kanıt aşağıda), benim değişikliklerimden DEĞİL

### Önceden varan başarısızlıklar (E10 dürüst atıf)

1. d1a `/api/graf` vakası SSOT pinleri `grafSurumi "v6"`/24 görev/29 bağ ile sabitlenmiş; güncel GRAF SSOT **v14/40/15** (K8-1 dalgası değiştirdi). HEAD server.js (`git show HEAD:pano/server.js` temp'te koşuldu) aynı v14/40 döndürüyor → başarısızlık HEAD'de de var.
2. d1b `/tuval` vakası `"PANO_TOKEN (kart yazma kapısı)"` dizgesini arıyor; bu dizge kapsul-tuval.html'de **grep 0** — ORDU-1'in sürmekte olan K8-2a yazımı (git diff ~615 satır) kaldırmış. Dosya ORDU-1'in, dokunma yasağım sürüyor. Tüm İŞLEVSEL d1b vakaları (201/409/401/403/422/404/tmp-temiz/izolasyon) benim server.js'imle geçiyor.

## Notlar

- **Canlı süreçler**: 4377 · 4930 (· 4933) sürecine tek satır kod/debug dokunulmadı. Değişiklikler canlıya **[insan] restart onayıyla** geçer (EK-2). Dürüst gözlem: bu oturumun kısıtlı netstat görünümünde 4377/4930 dinleyicisi GÖRÜNMEDİ — süreç durumu insan tarafından teyit edilmeli (ben süreç yönetimi yapmadım, kill etmedim).
- **Write-set DEĞİŞMEDİ**: deney-server aynı 6-dosya beyaz listesi; server.js aynı 4 atama dosyası + kapsül MD; yeni dosya hedefi YOK.
- **Test token hijyeni (SH-g)**: crypto.randomBytes ile BELLEKTE üretildi; değeri hiçbir dosyaya/log'a/assert mesajına YAZILMADI; SH-g testi tüm temp dosyalarında 0 geçişle doğruladı.
- **İzole koşum + temizlik**: port 4936 (4934'e çakışma YOK); koşum sonu tüm sunucular kapatıldı, temp dizinleri silindi (4936 boş; A/B ölçüm portları 62430/62455/63175/63212 kapalı; `bakim-*` temp kalıntısı 0).
- **GD-002 semantiği kararı**: token ÇAĞRANI doğrular, İÇERİĞİ değil — sunucu "ai-manager:glm-5.3" yazarlığını doğrulayamaz. Bu yüzden HER manager-yanit kaydı `dogrulanmamis: true` taşır; işaretsiz eski kayıtlar da doğrulanmamış varsayılmalı.
- **Kapsam dışı kalan**: GD-007 (Qoder post-commit — operator kaldırdı, denetçi raporunda işlenmiş) · GD-009/GD-010 (ORDU-1 K8-2a kapsamında KAPANDI — zaten kayıtlı).

## İşlenme (gelen-kutu borç kapanışı, 2026-11-01 16:44)

- **GD-001 — halledildi:** BAKIM-GP kapanışı — ACAO sabit köken + deney POST PANO_TOKEN fail-closed; deney-server.test.mjs 13/13; kayıt: 0225dc7
- **GD-002 — halledildi:** manager-yanit token kapısı + dogrulanmamis isareti; kayıt: 0225dc7
- **GD-003 — halledildi:** iskelet.html esc() (imza kapsul-tuval:1012 birebir); iskelet.test.mjs 4/4; kayıt: 0225dc7
- **GD-004 — halledildi:** tokenSabitEsit timingSafeEqual + uzunluk ön-kontrolü; kayıt: 0225dc7
- **GD-005 — halledildi:** try/catch + 500 jsonYaz (ENOTDIR enjeksiyonunda süreç ayakta); kayıt: 0225dc7
- **GD-006 — halledildi:** Buffer.concat + tek utf8 decode; kayıt: 0225dc7
- **GD-008 — halledildi:** stat-doğrulamalı okuma + 16384 B tail + perf alanı + olcumOku(); A/B: 1. çağrı 91462 B / 2..21. çağrı 0 B; kayıt: 0225dc7
- Kanıt koşulu (rapor şartı: bugün server-bakim.test.mjs EXIT=0): yeniden koşuldu — node --test pano/server-bakim.test.mjs **EXIT=0, fail 0** (2026-11-01, ölçüldü).
