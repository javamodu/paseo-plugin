# SORUN ENVANTERİ — ordu (en sık karşılaşılan sorun sınıfları)

**Damga:** 2026-11-01 ~17:40 (ölçülecek; hasat cron 17:52 ayrı kalem).
**Yöntem:** DERSLER.md 199 satır (~240+ madde, çoklu-ders satırları dâhil) elle sınıflandırıldı + otodev-pilot ARA-DURUM (F1-F4) + operatör hafızası (429/401/400/compacting) + telemetri W43/W44. Sayılar DERSLER satır sayımına dayanır; sınıf sayımları tahminle değil satır bazında sayılmıştır (yorumda küçük kayma olabilir).

## Sıklık sıralaması (tablo)

| # | Sınıf | Yaklaşık tekrar | Temsilî kanıt | Kök neden | Fren durumu |
|---|---|---|---|---|---|
| 1 | **PS 5.1 komut-aktarım katmanı** (tırnak/kaçış/apply_patch/2>&1/Format/null) | ~45+ ders (~%19) | apply_patch **9 resmî tekrar** (satır 100'e kadar numaralı; 13+ bahsis); çift tırnak native arg böler → commit -F deseni; 2>&1 NativeCommandError (v0.10'da 3 'başarısız' çağrı) | PS 5.1'in native-arg kaçış modeli + CJS/eval ortamı; ders kayıtlı ama **kullanım anında tetiklenmiyor** (meta-ders: kayıt ≠ refleks) | KISMEN KAPALI: receteler olgun (temp .mjs + node, git commit -F, [IO.File]::WriteAllText, tek tırnak, Out-String); hâlâ tekrarlıyor çünkü refleks-kuralı yok mekanik freni yok |
| 2 | **Kanıt dürüstlüğü ihlalleri** (ölçmeden yazma: 'bitti', damga saati, hash transkripsiyonu, sahte commit, sahte yeşil) | ~18 | damga saati 2 kez uydurma (162, 194); sha256 3 kez düştü → otomatik fren (195); ajan sahte commit hash c76fec4f (193); tautoloji testi (196) | İnsan-transkripsiyon hattı (json→md) doğrulanmıyor; 'bitti' kapısı exit-0'a bağlanmadan kapatılıyor | ÇOĞU KAPALI: dogrula.mjs 57-63 hane hex freni, exit-0/ölç-sonra-yaz disiplini, cihat: jsonl kayıt komutunun ilk satırı `date` — **kalan açık: md-yanıtı insan gözü** |
| 3 | **Paseo/provider/daemon altyapısı** (available≠çalışıyor, config yüklendi≠uygulandı, credential cache, mode mirası, ID tazelik) | ~20 | 3 katmanlı provider probe kuralı doğdu (125); opencode 401 bayat anahtar bellekte (127); provider available + 403 NO_ACTIVE_PACKAGE (128); mode mirası 7/8 RED (122) | Sağlık katmanı statik yapıyor, canlı üretim sokmuyor; daemon cache'leri süreç-ömürlü | KISMEN KAPALI: canlı üretim probe'u + supervisor/çocuk restart reçetesi (131) + plugin reload diriltir (165); **açık: kalan süreç-kümesi yenileme pencere disiplini** |
| 4 | **HTTP sağlayıcı hata ailesi (429/401/403/400)** | ~10 olay | bugün: kodex uçta 429 fırtınası → ajan ölümü (ARA-DURUM F1, defter 17:23:41.633); glm53u-claude 401 sunucu-tarafı; codefast 400 geçici; tokenharbor free 429; NO_ACTIVE_PACKAGE 403 | RPM/kota baskısı + uç ailesi karışımı; kalkan tur-içi değil | KISMEN KAPALI: kalkan429 spawn kapısı + append-only defter CANLI; glm53u-claude'a geçiş direktifi; **açık: F1 dirilme-kapalı yarışı, tur-içi kalkan yok** |
| 5 | **Test determinizm/flake** (same-tick, misfire, yük flake, sahte yeşil NODE_TEST_CONTEXT) | ~15 | NODE_TEST_CONTEXT çocuk tests=0 sessiz (169); same-tick yarışı (171, 27); %100 CPU flake'leri (182, 183-kanal) | Gerçek saat/gerçek IO ile test determinizmi; Windows zamanlayıcı çözünürlüğü | ÇOĞU KAPALI: sanal-zaman + setImmediate deseni (191), yük-ölçüm-öncesi (182/183), temiz env |
| 6 | **Çok-ajan koordinasyon yarışları** | ~8 | 6 ajan canary'sız = 6 kat maliyet (108); paralel Edit yarışı 2/8 failed (41); port çakışması EADDRINUSE (197); F2 çift enjeksiyon, F3 kira pid tuzağı (bugün) | Paralel yazıcılar ortak kaynakta çarpışıyor; operatör onayı ≠ canlı izleme | KISMEN KAPALI: canary kuralı, kira lease, tek-yazıcı; **açık: F3 ajan-ömürlü kira sahipliği, port/dizin atama disiplini brief'te** |
| 7 | **Long-running/süreç ömrü** | ~9 | 12,5 dk'lık pytest kesintide öksüz (30); run_schedule_once senkron bloklar (50); pipe `$?` yalanı (124); fetch keep-alive close sürünme (181); serve STOPPED sonsuz bekleme (190); oturum compacting takılması (hafıza); **4377/4930/8790 dinleyici yok** | Uzun işin tek poll zincirine bağlanması; bağlantı/süreç ömrünü sahip kapatmıyor; restartlar [insan] kapısında | KISMEN KAPALI: dosyaya tee + tek poll, connection:close + closeAllConnections, CLEAR_STOP açılış adımı; **açık: pano/sunucu dinleyicileri ölü (restart [insan])** |
| 8 | **SSOT/mimari drift** (kopyalar ayrışır, yazma ucu yoksa SSOT ölür) | ~12 | duplicate fonksiyon drift flake sürdürdü (36); yol string iki modülde → sessiz boş pano (179-2); ölü kapı: ratchet literal 6+ handoff'ta 0 eşleşme (87); 3 kapı 3 ayrı kirli-filtre drift (183-3); **graf SSOT yazma ucu inşa EDİLMEDİ (SH-d)** | Bilgi iki yerde yaşayınca biri bayatlıyor; tüketen uç yazmayan uçla bağlanmazsa sessiz görünmezlik | KISMEN KAPALI: tek-kaynak+tie-break, kirli-liste.json tek JSON; **açık: SH-d graf yazma ucu, schedule stored-prompt v2.0 bayatlığı (F2'nin mimari yüzü)** |
| 9 | **Kapsam disiplini ihlali** (tavan 3 dosya) | 3 ihlal | 7 dosya (129), 5 dosya (137, 143) | Turlar bölünmüyor; araç-kırılganlığı dosya sayıyor | AÇIK: refleks düzeyinde değil |
| 10 | **UI/panel yüzü** | ~6 | mockup DOM-doğrulama deseni (63, 75, 76); yanıt çift-kayıt (193-2); tasarım-dili kapısı (hafıza); ekran çekiminde CDP ölçüm zorunlu | Görsel doğrulama için DOM assertion + CDP gerekli; UI işi kapıdan geçmiyor | KISMEN KAPALI: geçici http sunucu + browser_evaluate deseni; **açık: pano 4377 yüzü ölü** |

## Kullanıcının adlandırdığı örneklerin karşılıkları

- «429 ve diğer hatalar» → sınıf 4 (+ sınıf 3'ün available-yalanı).
- «UI plan mimari drifti» → sınıf 8 (+ sınıf 10): graf SSOT'un yazma ucu yok → canlı plan yüzü ölü; duplicate-öğrenme drift ailesi; F2'nin bayat schedule-prompt yüzü.
- «hız» → dolaylı: sınıf 1 + tekrar-deneme bütçe kaybı (104: 8 deneme yerine 1 escalate; 141: aynı komutu üst üste) + D:\Vibecode kökünde recursive tarama dakikalar (90) + cache-hit %93,8→%71,5 düşüşü (tur-arası büyük değişiklik + motor karışımı).
- «long running çalışmama» → sınıf 7 (+ F1: uzun ajan turu 429'da ölüyor, dirilme kapalı ajana yetişmiyor).

## En öldürücü 5 (tekrar × maliyet sırasıyla)

1. **PS 5.1 aktarım katmanı** — frekans şampiyonu; her tekrar bir tur yakıyor (kalite dürtmeleri %12-50'nin ana kaynağı).
2. **Kanıt dürüstlüğü** — en pahalı tekil vakalar (sahte commit, uydurma saat, düşen hash); frenler mekanikleşti, insan-transkripsiyon bacağı açık.
3. **Provider available-yalanı + credential cache** — 'çalışıyor' sanısıyla dispatch edilen ajan 401/403/429 duvarına çarpıyor.
4. **429 ailesi** — bugün canlı örneği: pilot run#1 öldü; kalkan spawn kapısında ama tur içi koruma yok.
5. **SSOT drift** — sessiz görünmezlik sınıfı (ölü kapı, boş pano, yazma-ucusuz graf): hata üretmiyor, **yanlış güven** üretiyor.

## Dashboard bağlantısı (operatör direktifi 17:35)

Bu envanter, dashboard'un 'sorun' kartının veri kaynağıdır: sınıf başına (tekrar sayısı, son olay, fren durumu) üç alan. Otomatik sayım için `devir-olcum.mjs` iş kalemine kardeş: `DERSLER`/defter/telemetri kaynaklı sınıf-sayma ucu (LLM'siz — desen sayımı), pano 4377 yüzüne kart (4377 restart [insan] kapısında).

## Sıradaki adım önerisi (fix kuyruğu sırası)

1. F1 + F3 (pilot düzeltmeleri — canlı devir zinciri bunlara bağlı): dirilme-kapalı yarışı + ajan-ömürlü kira.
2. F2 schedule stored-prompt temizliği (v0.25 penceresi [insan]).
3. `devir-olcum.mjs` + sorun-envanter sayım ucu (dashboard beslemesi).
4. PS 5.1 refleks-freni: 'büyük yama öncesi DERSLER'de araç adını ara' zorlaması otomasyona bağlanabilir (plugin tarafında dispatch-öncesi uyarı).
