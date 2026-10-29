# PANO PLANGRAF VİZYONU — insan+makine okur kapsüllenmiş görev grafı (2026-10-29)

**Kaynak:** kullanıcı hedef beyanı (2026-10-29, bu oturum). Vurucu cümle aynen: «asıl ama vurucu nokta soldaki plan listesinin insan ve makine okur kapsüllenmiş görev grafı yapabilmek ve temeli o — grafik ise cila ve lens». Özetlenen hedef:

1. Sol tarafta projenin **faz → sprint → alt görev** yapısı **satır satır** görünsün; bunlar görev grafı olarak listelensin.
2. Hangi görev grafa tıklanırsa o göreve ait **tüm detaylar** görünsün: atanmış ajan(lar) · **dizin yapısı** · hedefler · **metrikler** · **bütçeler** · **izinler** vb.
3. Graf bir **kapsül** olsun — içindeki **çalışma prensibi grafikle** görünsün (ajanlar, otonomi hedefleri; «graf içinde otonomi hedefler herşeyi görebileceğim iyileştireceğim»).

**İkinci beyan (aynı gün, saatler sonra — öncelik ters-çevrimi):** «görev grafının içindeki en önemli konu manager ajan ile görevlerin dağıtılması, replan, izleme, takip, performansa dayalı kod yazdırma — bu uygulamanın başarısını ölçecek. Görev grafı ile kapsüllemek **çerçeve**; manager'ın görev dağıtım · denetim · izleme · replan · benchmark'ı **asıl başarıyı belirler**» → §6'ya işlendi (KALP katmanı).

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

## 6. KALP katmanı — manager döngüsü (ikinci beyan; diskten doğrulandı — 2026-10-29)

**Öncelik hiyerarşisi (kullanıcı hükmü):** graf + kapsül = **ÇERÇEVE** (bu fişin §1-5'i); manager döngüsü = **KALP** ve uygulamanın **asıl başarı ölçütü**. Pano FAZ-A/B/C çalışması çerçeveyi cilalar; kalp core/ ürün kodunda + ölçüm/benchmark/replan yolunda yaşar.

| döngü ayağı | disk karşılığı | durum |
|---|---|---|
| Görev dağıtımı | `core/src/dispatcher.ts` (kimlik/yetki/ölçüm kapıları) + `r8.ts` (5-şart ADIYLA kırmızı) + `deadline.ts` (dispatch kapısı + kapanış politikası) + `grants.ts`/`capabilities.ts` (izin) + `git-worktree-launcher.ts` (K-0053 dalga hattı) | **VAR** (S1-S4 dalgalarıyla kapandı) |
| Denetim | `evaluator.ts` (bağımsız; A13 sahte-PASS yok) + `turnuva.ts` (§21 yedi-adım çapraz eleştiri; F8 KAPALI) + `tip-kapisi.mjs` (ratchet, borç 0 kilit) + merge anında tam kanal (K-0053) | **VAR** |
| İzleme / takip | `daemon.ts` + `schedule.ts` (serve: her tur tick çocuk sürecinde; 2/2 KAPALI) · `sender.ts` (gerçek bildirim ucu) · `defter.ts` (fsync JSONL) · `telemetry.ts` · `gozetimsiz.ts` (§22 rozet, kanıt-besleme A0-3 KAPALI) · pano `/api/canli` SSE | **VAR** |
| Replan | `replan.ts` — DRIFT% ölçer + sapma ölçer + taslak birleştirme + **[insan] REPLAN ONAYLIYORUM kapısı** + §18 MD-ezmez tazeleme (A2 KAPALI) | **VAR** — gözlemsel ölçer; onaylı uygulama [insan] (rpl-03579e06 bekler) |
| Benchmark | `benchmark.ts` — F6-C eşlenmiş benchmark İSKELETİ: kol-başı {gorevHash, sourceHash, evaluatorHash, butce} eşlenmişlik assert'i · tam payda (başarısız+timeout+iptal DAHİL) · maliyet 'unknown' dürüstlüğü (Y5) · birim kimliği (model+runtime+prompt+araç+izin+evaluator) · üstünlük metni yasağı · hermetik (executor enjekte, gerçek LLM YOK) | **KISMEN** — iskelet VAR; canlı eşlenmiş deney (P2-8/F6-A) koşumu AÇIK |
| Performansa-dayalı kod yazdırma | provider registry (codex/glm-5.3 · glm53u-codex · codefast…) + `spawn-olcum.ts` (V9-03: dispatcher her spawn'da provider/outcome/sureMs → spawn-olcum.jsonl) + S7 mini-turnuva (tek-ölçüm emsal, sıralı 2-provider) | **KISMEN** — ölçüm kanalı doğuyor; **dinamik performans-tabanlı yazıcı seçme/eşleme motoru YOK** (ajan kadrosu statik; V8-05 eşlemesi dosya-çakışma-temelli, performans-temelli değil) |

**Asıl başarı yolunun açık kalemleri** (uygulama ayrı [insan] emirleri — burada yalnız envanter):

1. **F6-A canlı eşlenmiş performans deneyi** — benchmark.ts iskeletine gerçek kol koşumu; n < eşikte «nedensellik için yeterli değil» uyarısı zorunlu (üstünlük ilanı yok).
2. **Performans-tabanlı atama/eşleme motoru** — ölçüm defterlerinden (telemetri · spawn-olcum · turnuva kayıtları) yazıcı seçimine giden karar katmanı; bugün YOK (asıl açık).
3. **Replan gözlemden eyleme** — rpl-03579e06 [insan] onayı; onay sonrası §18 tazeleme kapısı yalnız Durum hücresine iner (MD-ezmez).
4. **V8-06 spawn ekonomisi** — ölç-sonra-karar; veri spawn-olcum.jsonl'de birikiyor (defter COMMIT EDİLMEZ).
5. **Pano'da manager döngüsünün GÖRÜNÜMÜ** — D-2 koşum sohbeti + performans/dağıtım yüzleri; §3 FAZ-C ile kesişir ama kalbin lens'idir (çerçeve değil kalp görünür olur).

Bağlantılar: [benchmark iskeleti](../core/src/benchmark.ts) · [replan](../core/src/replan.ts) · [spawn ölçüm](../core/src/spawn-olcum.ts) · [dispatcher](../core/src/dispatcher.ts) · [turnuva](../core/src/turnuva.ts).
