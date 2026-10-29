# BRIEF-ORDU4 — BLOK-2/3 taşınabilir desen analizi (seçimli composer + manager köprüsü)

- **Yazan:** ORDU-4 (desen araştırmacısı; salt-okur tur — tek çıktı bu dosya)
- **Kaynak (diske karşı doğrulanmış):** `pano/deney-panel.html` (1134 satır) + `pano/deney-server.mjs` (589 satır) + `pano/kapsul-tuval.html` (mevcut ADIM-B bağları)
- **Tarih:** 2026-10-29 (saat ölçülmedi — bu brief kanıt kaydı değil, desen aktarımı; ORDU-1 uygulama anında ölçer)
- **Amaç:** ORDU-1'in BLOK-2 (seçimli composer) ve BLOK-3 (manager köprüsü) bloklarına hazır girdi — imzalar, DOM id'leri, veri akışı, adaptasyon notları.

---

## BLOK-2 — SEÇİMLİ COMPOSER (deney-panel.html)

### Fonksiyon imzaları ve DOM id'leri

| Fonksiyon | Satır | İmza | İş |
|---|---|---|---|
| `renderSeciciler()` | deney-panel:942 | `()` → void | Chat model seçici (`#secModel`) + ATAMA sağlayıcı seçici (`#atSaglayici`) doldurur |
| `modelSecimAyristir(deger)` | deney-panel:1028 | `(string) → {provider, model} \| null` | `"provider|model"` birleşik seçici değerini ayırır |
| `chatYolla()` | deney-panel:1007 | `()` → async | Composer → POST müdahale; seçilen model/rol gövdede taşınır |
| `tercihSec(sagId, modelId)` | deney-panel:988 | `(string, string) → async` | Model satırı tıkı → POST `/api/deney/tercih` |
| `doluCubuk(o)` | deney-panel:922 | `(ornekAjan) → DOM düğümü` | ÖRNEK ajan dolu/esZamanlı çubuğu (metin düşüşü var) |
| `composerBoyut()` | deney-panel:1083 | `()` → void | Textarea içeriğe göre büyür (max 132px) |

DOM id'leri: `#secModel` (select, model), `#secRol` (select: manager/coder/tester), `#chatMetin` (textarea), `#chatGonder` (düğme), `#chatHistory` (scroll konteyner), `#composerSecim` sarmalayıcı; ATAMA tarafı `#atSaglayici` / `#atProje` / `#atAjan` / `#atRol` / `#atGorev` / `#atRolMd` / `#atGonder`.

### Veri akışı (D.envanter → seçiciler → POST)

1. `yukle()` (deney-panel:433) → `GET /api/deney/durum` → global `durum` (tuvaldeki karşılığı `D`).
2. `saglayiciListe()` (deney-panel:472) aday zinciri: `durum.envanter.saglayicilar → durum.saglayicilar → envanter.providers → durum.providers`; array VEYA `{providerId: modeller}` harita şeklini ikisi de normalize eder (`sagKayitNormalize`/`modelNormalize` — deney-panel:487/500).
   - Sunucu tarafı garanti: `durumGovdesi().envanter.saglayicilar` DİZİ verir, her kayıtta `modeller` gömülü (deney-server:226-232 — G9-yaması; KAPALI sağlayıcı model listesi boş kalır, dürüst).
3. `renderSeciciler()` kuralları (deney-panel:942-985):
   - Pasif sağlayıcı seçilemez (`!s.aktif && !GLM_UCLAR.includes(s.id)` atla) — **GLM uçları her zaman listede**.
   - `GLM_UCLAR = ['glm53u-codex','glm53u-claude','claude-glm']` en başta; GLM etiketlerinde provider öneki YOK (`'glm-5.3'` gibi), diğerlerinde `'provider · model'`.
   - Option `value = s.id + '|' + m.id`.
   - Varsayılan: sunucudaki `tercih` eşleşmesi → yoksa `deger.indexOf('glm-5.3')` içeren → yoksa glm[0] → `''`.
   - **Tazelemede önceki seçim korunur** (`onceki = chatSec.value` — 5 sn'de bir yeniden dolduruluyor, kullanıcının seçimi sıfırlanmaz); boşsa `'(model yok)'` düşer.
4. `chatYolla()`: gövde `{not, rol, provider?, model?}` — provider/model yalnız seçici doluysa (`modelSecimAyristir` null dönerse eklenmez); POST `/api/deney/mudahale` → textarea temizlenir + `chatAltta=true` + `await yukle()`.
5. Klavye: **Ctrl/Cmd+Enter gönder, Enter satır sonu** (deney-panel:1117); textarea `input` → `composerBoyut()`.

### Sunucu ucu (doğrulama — fail-closed)

`POST /api/deney/mudahale` (deney-server:358-391):
- Gövde limiti 4096 bayt (deney-server:27 — aşılırsa akış çekilir, 400).
- `not` string + trim + boş RED + `NOT_LIMIT_KAR` üstü RED; `provider`/`model` ≤100, `rol` ≤30 karakter kırpılır.
- YAZMA ÇİFTE: `mudahale.jsonl`'a `{t, kim: AKTOR('insan:web'), not, provider?, model?, rol?}` **VE** `manager-kuyruk.jsonl`'a `{t, is:'chat', not, ...secim}` (deney-server:383-386 — kuyruk satırı BLOK-3'ün girdisidir).

`POST /api/deney/tercih` (deney-server:285): `{provider, model}` → `tercih.json` TAM YENİDEN YAZ.

### Tuval adaptasyon notları (BLOK-2)

- **`atSaglayici` deseni tuvalde ZATEN VAR** (ADIM-B'den): `secicileriDoldur()` kapsul-tuval:1555-1580 yalnız `#atSaglayici`'yi doldurur; kendi yorumunda **«chat seçicisi K8 sonraki blokta»** yazar — BLOK-2 tam bu boşluğu doldurur. Birleşme: aynı `opts` döngüsünden İKİNCİ select (`#secModel`) doldurulur (deney-panel:942'deki gibi önceki-değer korumasıyla); `modelSecimAyristir` tuvalde birebir zaten var (kapsul-tuval:1613-1618) — KOPYALAMA, yeniden yazma.
- Veri kaynağı farkı: deney-panel `durum`, tuval **`D`**; tuvalin `saglayiciListe`'si (kapsul-tuval:1518) yalnız `D.envanter.saglayicilar` okur — fallback zinciri gerekmez (sunucu garanti ediyor).
- **Render üslubu farkı:** deney-panel DOM API + `textContent` (HTML'e asla gömülmez); tuval `innerHTML` + `esc()` üslubu. Adaptasyonda option/balon üretiminde **esc() zorunlu** (tuval üslubuna uy).
- Composer: tuvalin mevcut `#chatForm/#chatGiris` TEK SATIR input + şablon üretici (kapsul-tuval:789-792). Deney tarafı: textarea (çok satırlı) + Ctrl+Enter + otomatik boyut. Öneri: deney deseni textarea'ya geçsin; `composerBoyut` (6 satır) aynen taşınır.
- `doluCubuk`: tuval şu an dolu/esZamanlı'yı METİN olarak veriyor (kapsul-tuval:1606). Çubuk istenirse deney-panel:922-939 aynen taşınabilir (guard'lı: isFinite değilse metin düşer); CSS `.cubukKutu/.cubukIz/.cubukDol` da (deney-panel:169-172; geçiş yok — manifesto E6'ya uygun).
- `GLM_UCLAR` sabiti tuvalde zaten var (kapsul-tuval:1487) — tek kaynak, mükerrer sabit açma.

---

## BLOK-3 — MANAGER KÖPRÜSÜ (manager-yanit POST + kuyruk + balon render)

### Uç imzası ve akış (4 adım)

`POST /api/deney/manager-yanit` (deney-server:474-493): `{metin}` → doğrulama (nesne, string, trim, `NOT_LIMIT_KAR` üstü RED) → `log.jsonl`'a APPEND: `{t, tur:'manager-yanit', metin: trim, aktor:'ai-manager:glm-5.3'}`. **İçeriği ÜRETEN manager'dır; bu uç yalnız iletir** — aktör etiketi manager adına yazılır.

**Kuyruk okuma:** panel kuyruğu OKUMAZ (yazma da etmez — kuyruk yalnız sunucu yazar, `mudahaleIsle` içinde). Kuyruğu **operatör köprüsü** izler: `manager-kuyruk.jsonl` tail (Monitor ~2 sn) → yeni `is:'chat'` satırı → paseo MCP `send_agent_prompt` → deney-manager-g9 (paseoAgentId `bfda53a3-8e52-4c47-922c-337dfbdf7cca`, glm-5.3, izole workspace) → yanıt → operatör `POST /api/deney/manager-yanit {metin}`.

Durum gövdesi relevant alanları (deney-server:237-248): `log` (son N), `mudahale` (son N), `manager: {aktor, ajan, paseoAgentId, rol, bekleyenIs: son-10'daki is:'chat' sayısı}`.

### Chat balon render (deney-panel)

- `chatKayitlar()` (deney-panel:812-832): sohbet = **`durum.mudahale` (kim:'insan') + `durum.log`'dan `tur==='mudahale-yanit'` (kim:'operator') ve `tur==='manager-yanit'` (kim:'manager')** birleşimi; `t`'ye göre `localeCompare` sıralı; **çift-ilete tekilleştirme**: aynı METİNLİ insan-olmayan balonlar tek gösterilir (ham log aynen kalır — operatör köprüsü aynı yanıtı POST + elle iki kez yazabildi; defter ham, sunum tek).
- `balon(k)` (deney-panel:848-854): kimlik satırı + metin (pre-wrap) + saat. Renk sınıfları: `insan` sağda teal-soluk · `manager` solda DOLU teal «MANAGER (GLM 5.3 — izole)» · `operator` solda gri «OPERATÖR» (CSS deney-panel:138-144).
- `renderSagChat()` (deney-panel:834-846) + scroll takibi: `chatAltta`/`chatIlk` bayrakları; kullanıcı en alttaysa (48px pay) yeni mesajda alta sürelendir, yukarıdaysa karışmaz; `scroll` listener'ı bayrağı günceller (deney-panel:1121-1124).
- Polling: **5 sn** `setInterval(yukle, 5000)` (deney-panel:1130).

### Tuval adaptasyon notları (BLOK-3)

- Tuvalde **yok olan parçalar:** balon sınıfları (`.balonKutu` ailesi — tuvalin `.chatMesaj`'u tek-sistem balonu), `chatKayitlar` birleştirme/sıralama/tekilleştirme mantığı, scroll-takip bayrakları. Taşınacak çekirdek: `chatKayitlar` + `balon` + iki bayrak + scroll listener (~70 satır eşdeğeri).
- **Dürüstlük etiketi kritik:** tuvalin chat bölümü şu an `data-ornek` + `etiketOrnek` «ŞABLON — canlı AI yanıtı D-4» taşıyor (kapsul-tuval:781-784). Canlı bağlanınca ŞABLON etiketi **kalkmalı** (gerçek yanıt artık sahte değil); bunun yerine deney-paneldeki dürüst satır deseni («CHAT — yanıt seçtiğin modelden...») ve fail-closed banner gelmeli.
- **Polling farkı:** tuval 30 sn tazeliyor (kapsul-tuval:1919 `setInterval(() => { yukle(); deneyYukle(); }, 30_000)`); deney panel 5 sn. Canlı sohbet hissi için chat açıkken ayrı 5 sn'lik `deneyYukle` cadence'i düşün (yalnız chat paneli görünürken — token/performans dengesi ORDU-1 kararı; 30 sn'de kalınırsa yanıt gecikmesi kullanıcıya banner/toast ile dürüst bildirilmeli).
- Scroll davranışı: tuvalin `#chatListe`'si `role="log" aria-live="polite"` (kapsul-tuval:786) — aynen korunmalı; deney-paneldeki scroll-takip eklenebilir.

---

## TUVAL FARKLARI — ÇAPRAZ-ORIGIN (DENEY_KOK) DİKKAT LİSTESİ

Deney panel **aynı-origin**'di (`fetch('/api/deney/...')`); tuval 4377 sayfasından **4930'a çapraz-origin** çağırır (`DENEY_KOK = "http://127.0.0.1:4930"` — kapsul-tuval:1484; GET kapsul-tuval:1492, POST borusu `deneyPost` kapsul-tuval:1502).

ADIM-A köprüsü sunucuda hazır (deney-server:112-120): `Access-Control-Allow-Origin: '*'` + `Allow-Headers: Content-Type` tüm JSON yanıtlarda (`jsonYaz` spread eder — 404/405 dahil) + bilinen uçlarda OPTIONS preflight 204 + `Allow-Methods: GET, POST, OPTIONS`. Panik gerektiren bir şey YOK; dikkat edilecekler:

1. **Göreli yol tuzağı:** deney-panel kodundan kopyalanan her `fetch('/api/deney/...')` YANLIŞ — tuvalde daima `DENEY_KOK + uc` (hazır borular: GET için `deneyYukle`, POST için `deneyPost` — yeni eylemler `deneyPost`'tan geçmeli, kendi fetch açma).
2. **Hata modu farklı:** çapraz-origin reddi HTTP durum kodu DEĞİL, ağ hatasıdır (`TypeError`) — `deneyYukle` catch'i `D=null` yapar (fail-closed, kapsul-tuval:1496). Chat POST'u `deneyPost`'ta `b.hata` kontrolüyle RED'e düşer; catch → tuval üslubunda `toast(...)` (deney-panelin `hataGoster` rozeti yerine).
3. **Sunucu ölü senaryosu:** 4930 geçici deney süreci (task b2ci0m6dn, süre sınırlı; önceki bt3ui267j arka-plan sınırında öldü). `D=null` iken chat yüzü **kırmızı banner** (`deneyOluBanner` deseni — kapsul-tuval:1514) vermeli; bayat sohbet ekranda KALMAZ. POST denemeleri `if (!D) toast RED` guard'ıyla başlamalı (ajanAta deseni — kapsul-tuval:1622).
4. **Kimlik bilgisi YOK:** deney uçları token istemez (4377 `/api/kart`'ın `X-Pano-Token`'ı buraya AİT DEĞİL); fetch `credentials` göndermez — `Access-Control-Allow-Origin: '*'` ile uyumlu (specific-origin + credentials kombinasyonu OLMAZ, bozma).
5. **Ön-uç/protokol tutarlılığı:** ikisi de `http://127.0.0.1` — aynı kaldığı sürecek (tuval https'e taşınsa loopback http fetch karışık-içerik engeline takılabilir; bugün risk YOK, kayıt için).
6. **Cache:** `jsonYaz` `Cache-Control: no-store` basar — polling tazeliği garanti; client tarafında ek strateji gereksiz.
7. **Gövde limiti:** POST boru hattı 4096 bayt tavanı (deney-server:27) — chat metni çok uzunsa 400 + `{hata}` döner; `NOT_LIMIT_KAR` da müdahale metnine uygulanır (sunucu değeri `deney-server` sabitlerinden — ORDU-1 dokunmuyor). Composer'da client-side uzunluk uyarısı opsiyonel, sunucu zaten fail-closed.

---

## ÖZET RİSK TABLOSU (ORDU-1'e)

| Risk | Kaynak | Önlem |
|---|---|---|
| Göreli fetch kopyası | deney-panel aynı-origin kod | `DENEY_KOK + uc`; `deneyPost` borusunu kullan |
| Bayat veri gösterimi | 4930 ölümü | `D=null` → banner + POST guard (`if (!D) toast RED`) |
| esc eksikliği | tuval innerHTML üslubu | Tüm dış veri `esc()`'ten geçer (log metinleri dahil) |
| Seçim sıfırlanması | 5/30 sn yeniden doldurma | `onceki = select.value` koruma deseni (deney-panel:946/974) |
| Mükerrer yanıt balonu | operatör POST + elle çift yazım | `chatKayitlar` metin-tekilleştirme (deney-panel:824-831) |
| ŞABLON etiketi kalıntısı | tuval chat şu an ÖRNEK-etiketli | Canlı bağlanınca etiketi kaldır + dürüst satır koy |
| Kuyruğa çift iş | — | Panel kuyruğa ASLA yazmaz; yalnız `/api/deney/mudahale` üzerinden sunucu yazar |

**Sınır hatırlatması:** bu brief salt-okur analizdir; ORDU-4 kod yazmaz. Tüm satır referansları 2026-10-29 HEAD (9ac3ea7) disk durumuna göre doğrulandı.
