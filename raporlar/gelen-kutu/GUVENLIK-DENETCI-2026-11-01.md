# GÜVENLİK + PERFORMANS DENETİMİ — PANO YÜZEYİ (2026-11-01)

**Denetçi:** GÜVENLİK-DENETÇİ (salt-okur; K8-2a paralel denetim). **Yöntem:** en ileri düzey STATİK analiz — sunucu başlatılmadı, ağ isteği yapılmadı, süreç/commit/push yok. **Damga:** 2026-11-01 04:26 (yerel; ölçüldü). **Odak:** `pano/server.js` (4377) · `pano/deney-server.mjs` (4930) · `pano/kapsul-tuval.html` (istemci taban) + yazma çekirdekleri (`pano/graf-yonetim.js`, `pano/graf-yaz.mjs`) + git hooks.

**DİKKAT — ORDU-1 paralel yazım notu:** `pano/kapsul-tuval.html` okunduğu anda ORDU-1 tarafından yazılıyordu (2391 satırlık anlık görüntü). K8-2a çağrıları (`projelerYaz` — satır 1050; `gorevDetayKapat` — satır 1073-1075) anlık dosyada henüz tanımlı değil (yazım ara durumu; **bulgu sayılmaz**, taban analiz bu durumda yapıldı). Tanımlı fonksiyonların tamamı (solYaz, detayYaz, grafYonetimYaz, grafAtamaDurumYaz, projeYaz, ajanlarYaz, apiYaz, sagKartHtml, modelSatirHtml, chatBalonHtml, chatSablonYaz, chatKayitlarYaz) satır satır esc kapsamıyla denetlendi.

## 1. Kısa özet

Üretim sunucusu (4377) güvenlik duruşu **sağlam**: tüm yazma uçları PANO_TOKEN fail-closed (403/401), aktör sunucu-sabit `insan:web`, yol kaçakları regex + sabit dosya adlarıyla RED, GRAF SSOT HTTP üzerinden **hiç yazılamıyor** (yazma ucu yok — plandaki `/api/graf/yaz` henüz kodda değil), istemci esc disiplini kapsamlı. Başlıca açık yüzey **izole deney sunucusundadır (4930)**: wildcard CORS + tokensız POST uçları (GD-001) ve kimliksiz `manager-yanit` köprü ucu (GD-002). Üretimin `/` yüzü `iskelet.html` esc'siz innerHTML üretiyor (GD-003). Performans ana riski: 4930 durum ucunun her yoklamada 4 JSONL dosyasını baştan sona okuması + sınırsız büyüyen `log.jsonl` (GD-008).

## 2. §H HARD KAPI DOĞRULAMASI (plans/K8-DALGA2-PLANI-2026-10-31.md §H — bağımsız kod-doğrulaması)

| Kapı | Plan durumu | Kod-doğrulama | Kanıt (dosya:satır) |
|---|---|---|---|
| (a) PANO_TOKEN fail-closed | VAR | **GECTI** — 4 yazma ucunun dördünde `!TOKEN→403` + `başlık!==TOKEN→401`; token DEĞERİ yanıtta/logda/yanıt gövdesinde yok (başlangıç satırı yalnız VAR/YOK) | server.js:170-171, 197-198, 224-225, 269-270, 287 |
| (b) Aktör sunucu-sabit (EK-2) | VAR | **GECTI** (4377) — `insan:web` çağrı içinde sabit; istemciden aktor alanı okunmaz; çekirdek ayrıca zorlar: `atamaTaslakla` aktör≠insan:web RED, `onayla` vekil/ajan RED. Nüans: 4930 `manager-yanit` — etiket sunucu-sabit ama uç kimliksiz (GD-002) | server.js:215, 238; graf-yonetim.js:127-129, 141-151 |
| (c) Write-set whitelist + yol normalize | KISMI | **KISMI teyit** — server.js: ad-hoc (id regex `[A-Za-z0-9._-]` + sabit dosya adları; merkezî normalize fonksiyonu YOK); deney-server: tam desen VAR (`YAZMA_IZINLI` + resolve + kök öneki) | server.js:163, 177, 217-218, 243; deney-server.mjs:32, 79-89 |
| (d) GRAF SSOT yazma yalnız `/api/graf/yaz` + append-only | KISMI | **GECTİ-PLUS: yazma ucu HİÇ YOK** — server.js'te GRAF SSOT'ya yazan endpoint yok (yalnız okur); test pinliyor. Planın hedefi (yazma ucu inşa edilince append-only) henüz uygulanabilir değil; mevcut durum hedeften güçlü (salt-okur) | server.js:148-154, 178-182, 208-211; kapsul-tuval.test.mjs:678 |
| (e) «Ajanlar commit ATMAZ» pre-commit kapsam fişi | **EKSİK** | **EKSİK TEYİT EDİLDİ** — `.git/hooks/pre-commit` VAR ama içerik merge-guard shim (staged ASLA-desen denetimi; ajan-commit/kapsam whitelist YOK). Plan satırı doğru. Ek gözlem: `.git/hooks/post-commit` üçüncü taraf Qoder tracker koşuyor (GD-007) | .git/hooks/pre-commit:1-5; scripts/merge-guard.ps1:25-38 |
| (f) Performans puanı ajan-yazamaz (O2) | YENİ | **KISMI** — kodda puan yazma ucu/alanı hiç yok (şu an "yazamaz" vacuous doğru); O2 yüzü inşa halinde; ölçüm-kaynağı kısıtı (puanın yalnız ölçüm alanından türetilmesi) henüz kodda zorlanmıyor — K8-2a/2b pinlerinde kanıtlanacak | server.js (puan uçları yok); kapsul-tuval.html O2 inşa halinde |
| (g) Token ajanın eline geçmez | VAR | **GECTİ** — sunucu loglamaz; istemci token yalnız password input + `X-Pano-Token` başlığında; localStorage'a yazılmıyor (setItem yalnız panel genişliği); deney istek logu yalnız tur+metin özeti | server.js:287; kapsul-tuval.html:673, 1569, 1821, 1389; deney-server.mjs:101-109 |

## 3. Bulgular (siddet + tek cümle + dosyaRef)

| id | siddet | Bulgu | dosyaRef | Öneri |
|---|---|---|---|---|
| GD-001 | orta | 4930 deney sunucusu `Access-Control-Allow-Origin: *` + tüm POST uçları tokensız — aynı makinedeki herhangi bir tarayıcı sayfası yerel CSRF ile deney defterlerine yazabilir / durumu okuyabilir (chat notları dahil); modern Chrome PNA kısmen engeller ama eksik koruma | deney-server.mjs:114-117, 532-543 | ACAO'yu `http://127.0.0.1:4377`'ye sabitle (tek köprü) veya deney POST uçlarına da PANO_TOKEN |
| GD-002 | orta | `POST /api/deney/manager-yanit` kimliksiz — herhangi yerel istemci `ai-manager:glm-5.3` etiketli sahte manager yanıtı log'a yazabilir (aktör etiketi sabit ama içerik doğrulanamaz; EK-2 bütünlüğü deney tarafında zayıf) | deney-server.mjs:510-528 | Köprü ucuna ayrı sır/localhost süreç denetimi; en azından kayda `dogrulanmamis: true` alanı |
| GD-003 | orta | Üretim `/` yüzü iskelet.html innerHTML'e dinamik veriyi esc'siz basıyor — `KOKLER` varsayılanı tüm D:\Vibecode'u taradığından KARDEŞ repodaki STATE_BOARD satırı / telemetri mod adı 4377 origin'inde XSS üretebilir | iskelet.html:47, 53, 61-63 | Tuvaldeki `esc()` desenini uygula (kapsul-tuval.html:1012) |
| GD-004 | dusuk | Token karşılaştırması `!==` — zaman-sabit değil (uzunluk kaçağı teorik); localhost tek-kullanıcı gerçek riski düşük | server.js:171, 198, 225, 270 | `crypto.timingSafeEqual` (uzunluk önceden karşılaştırılır) |
| GD-005 | dusuk | `renameSync`/`appendFileSync` yakalanmamış throw — eşzamanlı istek yarışında (Windows'ta hedef varsa renameSync atar) senkron exception event handler içinde süreç çökletir | server.js:186-189, 22-26 | try/catch + 500 jsonYaz |
| GD-006 | dusuk | Gövde toplama `govde += p` (Buffer→string) — çok baytlı UTF-8 karakteri parça sınırında bozulur (JSON 400'e düşer; güvenlik değil robustluk); deney-server doğru deseni kullanıyor | server.js:172-173, 199-200, 226-227, 271-272 | `Buffer.concat` deseni (deney-server.mjs:133-151) |
| GD-007 | dusuk | `.git/hooks/post-commit` her commit'te npm-cache yolundaki üçüncü taraf Qoder tracker betiğini node ile koşuyor — repo dışı betik commit yaşam döngüsüne bağlı (tedarik zinciri gözlemi) | .git/hooks/post-commit:1-5 | Bilinçli tutuluyorsa STATE'e not; değilse kaldır |
| GD-008 | orta (perf) | `/api/deney/durum` her çağrıda 4 JSONL'i BAŞTAN SONA okur (`log.jsonl` her POST'ta satır alıp sınırsız büyür) + chat açıkken 5 sn'de bir yoklanır → okuma maliyeti dosya boyutuyla lineer büyür | deney-server.mjs:55-72, 238-247; kapsul-tuval.html:2387 | Son-N satırı byte-offset/tail okumayla al veya dosya döndür; perf_hooks ölçüm noktası ekle |
| GD-009 | dusuk (perf) | 30sn/5sn döngüsünde tam-yeniden-çizim (ağaç + SVG + sekmeler + 5 deney yüzü innerHTML) — veri değişmediğinde bile koşar | kapsul-tuval.html:2386-2387, 1049-1050 | JSON-imza dirty-check: değişmediyse render atla |
| GD-010 | dusuk (perf) | `tuvalCiz` her çizimde her `.dugum`'e ayrı click listener (O(düğüm) listener/çizim; sızıntı yok — eski düğümler GC — ama delege deseni burada da uygulanabilir) | kapsul-tuval.html:1198 | svgEl'e tek delege dinleyici |

**Temiz kalanlar (bulgu yok):** yol kaçamağı (traversal) RED — id regex `/` ve `\` bloklar, URL-decode sonrası yeniden doğrulanır; başlık enjeksiyon yüzeyi yok; eval/new Function YOK; prototype pollution yüzeyi yok (istemci yalnız alan okur, derin birleştirme yok); dış URL erişimi yok (istemci fetch beyaz listesi: `/api/graf` · `/api/kart` · `/api/atama/*` · `DENEY_KOK`=127.0.0.1:4930 — sabit dizgiler); gövde limiti 4096 bayt her iki sunucuda; JSON gövde alan-tipi doğrulaması kapsamlı (`nesneDegil` + typeof zincirleri); graf çekirdeği aktör/onay kurallarını kodda zorluyor.

## 4. Kontrol listesi — net durumlar

1. **Kimlik: GECTİ** (+ GD-004). 2. **Aktör sahteciliği: GECTİ (4377)** + GD-002 (4930 deney). 3. **Yol güvenliği: GECTİ** — traversal RED; write-set envanteri: server.js → KAPSUL_DIR yeni kart MD (+tmp) + ATAMA_DIR 4 dosya (taslaklar.jsonl/md, onayli.jsonl/md; graf-yaz.mjs append-only+fsync+idempotans); deney-server → 6 dosya whitelist (tercih.json TAM yeniden yaz + 5 JSONL append); merkezî normalize server.js'te yok → KISTI planın teyidi (K8-2b'de sertleşir). 4. **Enjeksiyon: KISMI** — kapsul-tuval GECTİ (esc satır satır; başlıca: 1012 tanım, 1112-1124 solYaz, 1185-1193 tuvalCiz, 1486-1512 detayYaz, 1739-1773 grafYonetimYaz, 1863-1894/1942-1969/2009-2064 deney yüzleri, 2261-2266 chatBalonHtml, 2308-2313 chatSablonYaz); iskelet.html ACIK (GD-003). 5. **Ağ: GECTİ (4377)** — 127.0.0.1, CORS yok, dış URL yok; **KISMI (4930)** — 127.0.0.1 ama ACAO:* (GD-001). 6. **Robustluk/DoS: GECTİ** gövde limitleri; KISMI notlar GD-005/GD-006 + SSE istemci seti sınırsız (server.js:260-266, localhost, düşük); readFileSync-per-request bilinçli tasarım (aşağıda perf notu). 7. **İstemci: GECTİ** (+ ORDU-1 paralel yazım notu, yukarıda). 8. **Gizlilik: GECTİ (4377)** — token/anahtar hiçbir yanıtta/log satırında düz metin değil; **KISMI (4930)** — durum wildcard CORS ile her origin'e okunabilir (GD-001 kapsamı). 9. **Performans:** bölüm 5. 10. **§H:** bölüm 2 tablosu.

## 5. Performans notları (en fazla 5)

1. **4930 durum okuması büyür** — 4 JSONL'in tam taraması her 5/30 sn'de (GD-008): en yüksek öncelik.
2. **readFileSync-per-request bilinçli** (server.js:145/151/166 + deney-server tüm uçlar): restart'sız tazelik için tasarım kararı; `/api/veri` 60 sn TTL önbelleği var (server.js:14, 93-97), `/api/graf` küçük JSON — kabul edilebilir; `/api/repolar` her çağrıda `readdirSync(D:\Vibecode)` (server.js:39-51) — nadir çağrı, not.
3. **İstemci tam-yeniden-çizim** 30 sn'de (GD-009) + chat açıkken deney yüzleri 5 sn'de — dirty-check en ucuz kazanç.
4. **Delege deseni çoğunlukla VAR** (document click, saglayiciAlani, grafYonetimAlani, chatListe) — istisna `tuvalCiz` düğüm listener'ları (GD-010).
5. **Ölçüm noktası önerisi (K8-3 hattı):** sunucu — `perf_hooks.performance.now()` işaretleri `durumGovdesi()` çevresine + yanıt bayt boyutu + JSONL satır/byte sayıları (büyüme izi); istemci — `performance.getEntriesByType("resource")` ile fetch süreleri + render çevresi `performance.now()` (solYaz/tuvalCiz/deneyYaz). O2 performans yüzü bu ölçümlerden beslenmeli (puan ölçüm kaynağından — §H/f).

## Kaynak dosyalar (tümü salt-okur okundu, hiçbirine yazılmadı)

- D:\Vibecode\ordu\pano\server.js (289 satır)
- D:\Vibecode\ordu\pano\deney-server.mjs (626 satır)
- D:\Vibecode\ordu\pano\kapsul-tuval.html (2391 satır — ORDU-1 yazımında anlık görüntü)
- D:\Vibecode\ordu\pano\graf-yonetim.js · graf-yaz.mjs · iskelet.html
- D:\Vibecode\ordu\.git\hooks\pre-commit · post-commit · scripts\merge-guard.ps1
- D:\Vibecode\ordu\plans\K8-DALGA2-PLANI-2026-10-31.md (§H)

**Şema ikizi:** raporlar/gelen-kutu/GUVENLIK-DENETCI-2026-11-01.json (schemaSurum 1, append-only).

## İşlenme (gelen-kutu borç kapanışı, 2026-11-01 16:44)

- **K1 — halledildi:** önerisi GD-004 — timingSafeEqual 0225dc7'de (bugün server-bakim.test.mjs EXIT=0 fail 0); kayıt: 0225dc7
- **K2 — halledildi:** önerisi GD-002 — manager-yanit token kapısı 0225dc7'de; kayıt: 0225dc7
- **K4 — halledildi:** önerisi GD-003 — iskelet esc 0225dc7'de; kayıt: 0225dc7
- **K5 — halledildi:** önerisi GD-001 — ACAO sabit + POST token kapısı 0225dc7'de; kayıt: 0225dc7
- **K6 — halledildi:** önerileri GD-005/GD-006 — 0225dc7'de; kayıt: 0225dc7
- **K7 — halledildi:** önerisi (pinlerin kapanış denetiminde tekrar koşulması) yerine geldi — ORDU-3 k8-2a D8 çapraz doğrulama; kayıt: 58fd9f4
- **K8 — halledildi:** kapsamı GD-001 — 0225dc7'de; kayıt: 0225dc7
- **K9 — halledildi:** GD-008 0225dc7 + GD-009/010 58fd9f4; kayıt: 0225dc7, 58fd9f4
- **K10 — kısmen:** SH-f pini K8-2a'da kanıtlandı (D3/D7); SH-e + SH-c K8-2b [insan] emri bekler; kayıt: 58fd9f4
- **SH-a — halledildi:** önerisi GD-004 — 0225dc7'de; kayıt: 0225dc7
- **SH-b — halledildi:** önerisi GD-002 — 0225dc7'de; kayıt: 0225dc7
- **SH-f — halledildi:** K8-2a denetiminde pini kanıtlandı (D3 puan alanı YOK + D7 denetim ucu YOK); kayıt: 58fd9f4
- **SH-g — halledildi:** izole koşum disiplini BAKIM-YAZICI kapanışında pinlendi (test token'ı bellekte; temp dosyalarında 0 geçiş); kayıt: 0225dc7
Bekleyen: K3, SH-c (merkezî write-set), SH-e (pre-commit kapsam whitelist) — K8-2b [insan] emri bekler; SH-d — GRAF SSOT yazma ucu henüz inşa edilmedi (öneri inşa anında geçerli); plan kuyruğunda.
