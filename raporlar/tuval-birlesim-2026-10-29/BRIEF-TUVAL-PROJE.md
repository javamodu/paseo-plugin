# BRIEF-TUVAL-PROJE — K8 tuval-baz birleşme dalga fişi (2026-10-29 18:49)

**Kaynak (kullanıcı emri, tam):** «tuvali baz alalım · iki ayrı tasarım istemiyorum · tuvali sabitleyim içine deneysel proje açarız · sağ tarafa select menülerle proje seç · provider model ve rol atama ve altına rol.md projeye özel opsiyonel · ayrıca provider model api yönetimi için diğer panel deney paneli gibi · farklı workspacelerde farklı projeler yönetebilsin · her yerdeki state yazılarını kaldır saf fonksiyon ve acil menüler odaklı · sağ sol panel aç kapa ve resize oluyor» (+ 18:53: «top bar state kaldır · marka altındaki bölüm ve kaydırma çubuğu kaldır» — bu bacak 40fa22b'de KAPANDI).

## Ana karar (yön)

**Tuval TEK tasarım.** Deney paneli (4930/deney) tasarım hattı KAPANIR — kod + kanıtlar REFERANS kalır; yüzleri tuval içine taşınır. K8'in taşıma yönü: deney → tuval. `pano/server.js` (4377) donmuş kural + K-0055 çerçevesi sürer.

## Bloklar (uygulama sırası)

1. **State sökümü (devam):** «her yerdeki state yazıları» — drawer/sekme sayı etiketleri, ÖZET panel state satırları, kanal kartı state metinleri… yalnız işlevsel menü/buton kalır. (Üst bar + ordu şeridi bacakları KAPANDI: 62951af + 40fa22b.)
2. **Panel aç/kapa + resize:** sol/sağ paneller — deney splitter deseni (pointer events, min 180/max 45vw, localStorage tercihi; sol drawer'ın aç/kapası zaten var).
3. **PROJE kavramı:** tuval içinde deneysel proje açma; proje → workspace bağlantılı (paseo workspace); **farklı workspacelerde farklı projeler** yönetilir. Veri: deney envanter deseni (raporlar/deney-canli-panel-2026-10-29/saglayici-model-envanteri + ajanlar.json) + workspace listesi.
4. **SAĞ panel — PROJE + ATAMA yüzü:** select menüyle proje seç · provider/model/rol atama formu · altında **rol.md (projeye özel, OPSİYONEL)** — deney ATAMA yüzünün tuval sürümü (TANIM kaydı; gerçek spawn köprüde).
5. **API yönetim paneli (başka ikon):** sağlayıcı kartları + model TEST — deney API yüzü gibi; sunucu anahtara erişemez (fail-closed; gerçek çağrı operatör köprüsü/paseo MCP).
6. **Sunucu bacaları:** 4377'a yeni GET uçları (salt-okur: projeler/sağlayıcılar/atamalar) — server.js dokunuşu K-0055 ölçütleriyle; POST'lar (atama TASLAK + api-test kuyruğu) K-0055 §1-3 sonrası.
7. **Chat/composer:** seçimli composer (proje + provider/model/rol) — deney CHAT yüzü + manager köprüsü taşınır (kuyruk + Monitor + paseo MCP; kalıcı servis K8 sonunda).

## Ölçüt (dalga kapanışı)

DOM duman (yeni yüzler render + state yazıları 0) + ekran PNG + log/damga kayıtları + merge-guard + tam bağımsız koşum; her blok kendi commit'i (atomik; KAPSAM ≤3 mevcut dosya).

**Not:** Bu fiş dalganın açılış kaydıdır; yürütme yeni oturum/vardiyada (bağlam bütçesi). KAPI K8 satırı güncellendi.
