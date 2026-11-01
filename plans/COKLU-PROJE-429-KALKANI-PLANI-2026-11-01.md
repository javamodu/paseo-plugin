# ÇOKLU-PROJE 429-KALKANI PLANI (PK-1) — PARALEL ÇALIŞMA 429/PERFORMANS/ HIZ/KALİTE (2026-11-01)

**Kimlik:** PK-1. **Kaynak:** kullanıcı emri **«429 hatası da çok oluyor çünkü aynı anda çok proje yürütüyorum paralel çoklu çalışma sorunlarını da gider performans hız kalite»** ([insan] kapısı açıldı). Kök: [otonom sentez](../raporlar/otonom-analiz-sentez-2026-11-01/OZET.md) düşman listesi (RPM 25 + 429 çok-ajan korelasyonu) + bellek kaydı (Codefast RPM 25, WALLET_BUSY).

## Doğrulanmış olgular (plugin API araştırması — kanit/02-plugin-api.md)

- **Kök neden çarpım:** paylaşılan sağlayıcı RPM'i (~25/dk) × eşzamanlı proje/ajan sayısı. Çoklu paralel çalışma tepe anlarında bu çarpımı aşıyor → 429.
- **Chokepoint GERÇEK (Paseo ajanları için):** tek daemon → `server.before("agent.create")` + `server.on("agent.turn_ended")` TÜM projelerin ajanlarını görür.
- `agent.turn_ended` → `outcome: completed | failed { error }` — **429 hataları olay olarak GÖRÜLEBİLİR** (bugün ölçülmüyor).
- `agent.create` before-hook: config düzenlenebilir (`provider`, `mcpServers` dahil); **hata fırlatmak oluşturmayı İPTAL EDER** → 429 penceresinde yeni spawn kod tarafında RED edilebilir (fail-closed).
- `paseo.agents.ref(id).send()` → ölen tura yeni mesaj = diriltme; handler timeout **30 sn** (uzun bekleme handler içinde YASAK; zamanlanmış send ayrı mekanizma ister).
- **Honest sınır:** Claude Code sekmeleri Paseo dışından istek atar — bu kapı onları KAPAYAMAZ; onlar için kütle diyeti (istek hacmi ↓) + OTODEV (sekme/devir azalma) + operatör alışkanlığı üçlüsü geçerli koruma. Hard throttle yalnız Paseo ajan filosunda.

## Hedef (ölçülebilir)

| Ölçüm | Önce | Hedef |
|---|---|---|
| 429 olay sayısı (görgül defter) | ölçülmüyor | PK-a ile SÜREKLİ ölçülür; PK-b/c sonrası **↓%50** (ilk 24 sa baseline) |
| 429 penceresinde yeni spawn | serbest | **KODDA RED** (fail-closed, dürüst mesaj) |
| 429 sonrası ölü tur → devam | manuel/sekmeli | zamanlanmış dirilme **medyan ≤15 dk** (sentez protokolü) |
| 429 pencere kayıtları | — | append-only defter (rapor + pano okuması) |
| Davranış (Paseo dışı işler) | — | DEĞİŞMEZ; plugin süiti yeşil kalır |

## Aşamalar

- **PK-a — 429 telemetri hattı (yazıcı dalgası):** `agent.turn_ended` → `outcome.kind==='failed'` + error 429/RPM/rate-limit deseni → **append-only 429 defteri** (plugin data dizini; alanlar: damga, agentId, workspaceId, provider, hata sınıfı; gizli değer YOK) + sayaç API'si (sonNdk(sayi)). Önce GÖR: baseline ölçmeden düzeltme taahhüdü YOK.
- **PK-b — 429 pencere kapısı (kodda):** `server.before("agent.create")` → son 10 dk ≥2 429 (PK-a defterinden) → yeni spawn **RED** + dürüst hata metni («429 penceresi — ~X dk sonra tekrar deneyin»). Kapı `ORDU_429_KAPI=0` ile kapatılabilir (varsayılan AÇIK — fail-closed yönü). Zamanlanmış spawn'ları (nobet/schedule) da kapsar → OTODEV tavan-geri-çekilmesinin plugin tarafı kardeşi.
- **PK-c — zamanlanmış dirilme:** 429 failed turu → cooldown'lu yeniden deney planı (handler 30 sn içinde planı kurar; tetikleme sonradan) + ajan başına yeniden deneme sayacı (sonsuz döngü koruması; cooldown üst sınır; en fazla 2 otomatik deneme → sonra insan). Dürüst: reload'da plan kaybolur (best-effort) — defter kaydı kalır, kanıt düşmez.
- **PK-d — [insan] ÖNERİ, kod YOK:** 429 fırtınasında `agent.create` provider rotası (alternatif sağlayıcıya çevirme — kayıtlı ikinci sağlayıcı zaten var). Kullanıcı seçimini ezdiği için KAPALI varsayılan + [insan] kararı bekler. PK-a verisi operatöre sunulur.
- **PK-e (opsiyonel, ayrı emir):** 429 defterini pano 4377'den okuyan GET ucu + tuval göstergesi (pano/server.js dokunuşu = ayrı dalga, A2 pilot riskini büyütmez).

## Sürüm disiplini

KD-a şu an v0.24 kilidini hazırlıyor. PK-a/b/c de plugin/server koduna dokunur → **aynı v0.24 penceresinde birleşir** (canlı kurulum = KD-c öncesi tek yükleme; kilit dosyası PK bitince yeniden mühürlenir). `plugin/node_modules` DOKUNULMAZ; v0.23 kilit salt-okur.

## Sınırlar + dürüst notlar

- **Tek-yazıcı:** KD-a yazıcısı AÇIK → PK yazıcısı KD-a KAPANINCA dispatch (429/CPU tavanı — kapının kendisi bu planın öznesi, ihlal etmeyiz).
- Event'ler best-effort: kaçan 429 olabilir → defter ALT SINIR gösterir (abartı yorum YASAK); ölçüm dürüst raporlanır.
- 30 sn handler timeout: bekleme YOKtur — RED/izin/planlı-send üç dışı mekanizma yok.
- Sinerji (ayrı iş, zaten yolda): kütle diyeti = istek başına token ↓ (RPM slotu daha çok iş yapar) · KD-b MCP 61→13 = prompt küçülür · OTODEV = sekme açma ve devir sırasında istek tepe düzleşir.
- Test: her PK-a/b/c parçası hedefli hermetik test (defter şeması, pencere kararı, sayaç sınırları) + mevcut plugin süiti ×1 yeşil; ölçüm kanıtları `raporlar/429-kalkani-2026-11-01/OZET.md` + .json.

**Yürütme:** emir verildi; PK-a/b/c yazıcısı KD-a kapanınca dispatch edilir (tek-yazıcı). PK-d ayrı [insan] kararı. Bu plan YERELDİR — push ayrı emir (K7).
