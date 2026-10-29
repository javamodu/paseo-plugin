# PANO PLANGRAF VİZYONU — insan+makine okur kapsüllenmiş görev grafı (2026-10-29)

**Kaynak:** kullanıcı hedef beyanı (2026-10-29, bu oturum). Vurucu cümle aynen: «asıl ama vurucu nokta soldaki plan listesinin insan ve makine okur kapsüllenmiş görev grafı yapabilmek ve temeli o — grafik ise cila ve lens». Özetlenen hedef:

1. Sol tarafta projenin **faz → sprint → alt görev** yapısı **satır satır** görünsün; bunlar görev grafı olarak listelensin.
2. Hangi görev grafa tıklanırsa o göreve ait **tüm detaylar** görünsün: atanmış ajan(lar) · **dizin yapısı** · hedefler · **metrikler** · **bütçeler** · **izinler** vb.
3. Graf bir **kapsül** olsun — içindeki **çalışma prensibi grafikle** görünsün (ajanlar, otonomi hedefleri; «graf içinde otonomi hedefler herşeyi görebileceğim iyileştireceğim»).

**Karar statüsü:** VİZYON KAYDI — kod YOK; uygulama ayrı [insan] emri (CALISTIRMA §1-2 disiplini). Bu fiş mevcut yapıların projeksiyonudur; yeni politika DEĞİL (tek politika otoritesi PLAN.md v2.10.1 §25 — graf kuralı aynen geçerli).

## 1. Mevcut zemin (diskten doğrulandı — 2026-10-29)

| vizyon parçası | bugün | kanıt |
|---|---|---|
| Sol panel satır listesi + tıklama → detay + çapraz-vurgu (satır↔tuval) | **VAR** — durum-gruplu (HAZIR/BEKLE/DEVAM/KAPALI) | `pano/kapsul-tuval.html` solYaz/sec |
| Görev grafı görselleştirme | **VAR** — SVG DAG, deterministik katman yerleşimi; döngüde çizilmez (ön-simülasyon kuralı) | kapsul-tuval.html tuvalCiz |
| Görev detay tablosu | **KISMEN** — görev/rol/durum/dizin/ölçüt/bağımlılık/kapı/LOC/ajanlar + **8-eksen kapsül kartı üretimi** (plans/kapsuller/`<ID>`.md — MEVCUT MD EZİLMEZ, token fail-closed) | kapsul-tuval.html `sec` + `pano/server.js` kartIcerik |
| Ajan kadrosu (model/rol/atanma) | **VAR** — graf SSOT `ajanKadrosu.varsayilan` + görev-başı `ajanlar` (v3'ten beri: «her kapsülde atan ajanların model/izin/yetki/rolleri görev kartının İÇİNDE olmalı») | graf json + grafSurumGecmisi v3 |
| Bütçe | **KISMEN** — plan loc/testLoc (T); gerçek-vs-plan karşılaştırması yok | graf json |
| İnsan+makine okur İKİ YÜZ | **VAR** — İNSAN OKUR / MAKİNE OKUR mod; **aynı fetch yanıtından** üretilir (çift-SSOT imkansız — D-1a çekirdek ilkesi) | kapsul-tuval.html modUygula |
| Makine SSOT + insan ikiz | **KISMEN** — `plans/gorev-grafigi-2026-10-26.json` (grafSurumu **v14**; sürüm geçmişi gerçeklik-tazelemeli, JSON-kazanır kuralı) VAR; **insanOkurIkiz yolu BAYAT** — `plans/GOREV-GRAFIGI-SENERAYO-2026-10-26.md` diskte YOK (en yakın ikiz `arsiv/plan-3-denetci-oncesi-2026-10-27/SENARYO-v13.md` — graf v13/v14'e göre İKİ SÜRÜM GERİDE; kartIcerik'in bastığı yol 404 sınıfı) | graf json başlığı + Test-Path 2026-10-29 |
| **Faz hiyerarşisi (veri)** | **VAR** — görevlerde `"faz"` alanı (DC/F0..F4…; v13 DC projeksiyonundan) | graf json |
| Fail-closed kırmızı yüz | **VAR** — sunucu/graf yokken bayat veri asla gösterilmez | kapsul-tuval.html kirmiziYuz |
| Kapsül-iç çalışma prensibi (canlı akış) | **YOK** — sağ panel placeholder (D-2 planı: notify.jsonl→SSE koşum sohbeti) | kapsul-tuval.html `#sag` |
| Dizin yapısı ağaç görünümü · canlı metrik bağları · izin kaydı detayı · otonomi rozetleri (§22) · plan-vs-gerçek bütçe | **YOK** | — |

## 2. Açıklar (vizyon ↔ bugün)

1. **Sol ağaç FAZ-GRUPLU DEĞİL** — `faz` alanı veride VAR ama UI kullanmıyor (durum-gruplu liste). Vizyon: faz → sprint → alt görev daraltılabilir ağaç, satır satır.
2. **Detay paneli tam değil** — dizin tek string (ağaç yok); metrik = ölçüt metni (canlı ölçüm/kanıt bağları yok: telemetri.jsonl · son-kanit.json · kabul.csv); izin = kapı adı (serbest bırakma kaydı detayı yok); otonomi hedefleri (§22 gozetimsiz rozetleri) yok; bütçe plan-vs-gerçek karşılaştırması yok.
3. **Kapsül-iç çalışma prensibi grafiği YOK** — capsule→plan→run→node→attempt→evaluate→decide akışı ile yazar/denetçi/tester ajan rolleri görsel değil (D-2 sohbet paneli bu boşluğun ilk ayağı olarak planlıydı).
4. **«Kapsüllenmiş» tek format** — makine JSON + insan MD ikiz İKİ DOSYA ve **senkron zaten kopmuş** (insanOkurIkiz yolu bayat; ikiz arşivde 2 sürüm geride); vizyon: tek kapsül formatı iki okura da hizmet etsin (ikiz-üreteci de seçenek — çelişkide JSON kazanır korunur; ikiz YENİDEN doğmadan tuvalin İNSAN OKUR modu de-facto insan yüzü).

## 3. Faz önerisi (temel önce — kullanıcının «grafik cila ve lens» hükmü)

- **FAZ-A (temel — vurucu nokta):** sol ağaç FAZ-gruplu + detay alanları graf SSOT'ya (metrik/kanıt bağları, izin kaydı, otonomi rozetleri, bütçe gerçek) → insan+makine okur tek kaynak pekişir.
- **FAZ-B (lens):** detay paneli zenginleşir — dizin ağacı, canlı metrik/kanıt bağları, izinler, otonomi; kart 8-eksen → n-eksen.
- **FAZ-C (cila):** kapsül-iç çalışma prensibi grafiği (ajan rolleri + akış) — D-2 canlı sohbetle birleşir.

## 4. Açık tasarım soruları (uygulama fişine girer — burada kararlaştırılmaz)

1. Hiyerarşi kaynağı: `faz` graf SSOT'ta (DC/F0..) · sprint kavramı (DC-S0..S10) PLAN §25'te — tek ağaçta nasıl birleşir? Hiyerarşi PLAN'dan türetilmeli mi (politik otorite), graf'a mı yazılır (projeksiyon)?
2. Metrik bağları hangi defterlerden okunur? (telemetri.jsonl / son-kanit.json / kabul.csv / kural.jsonl — hepsi salt-okur GET; canlı pano YAZMA ucu açmaz)
3. Kapsül-iç graf statik mi (graf verisinden çizilir) canlı mı (koşum defterinden akar — D-2 kesişimi)?
4. İnsan-okur ikiz (SENARYO md) yazmaya devam mı, yoksa tuvalin İNSAN OKUR modu ikizi ikame mi eder?

## 5. Uygulama kapısı

Kod YOK — bu fiş yalnız yön kaydı. Uygulama: ayrı [insan] emri + iş fişi (CALISTIRMA §2 serbest bırakma kaydı; mevcut dosya ≤3; pano/ evinde ince kanca dalgaları). Bütçe sınıfı dürüst: FAZ-A küçük-orta dalga (UI + graf alan ekleri); FAZ-B/C ayrı fişlerle ölçülür. Bağlantılar: [PLAN §25](PLAN.md) (politika) · [graf SSOT](gorev-grafigi-2026-10-26.json) · insan ikiz (en yakın, bayat): [arsiv/plan-3-denetci-oncesi-2026-10-27/SENARYO-v13.md](../arsiv/plan-3-denetci-oncesi-2026-10-27/SENARYO-v13.md) · [tuval](../pano/kapsul-tuval.html) · [kartlar](kapsuller/).
