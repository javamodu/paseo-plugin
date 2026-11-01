# OTONOMİ ANALİZİ — 3 AJANLI DERİN ANALİZ SENTEZİ (2026-11-01)

**Kimlik:** OTONOM-SENTEZ-1. **Kaynak:** kullanıcı emri 2026-11-01 («bu şekilde yaparsak hem hız hem kalite hem performans güvenlik artacak mı 3 ajanla çok derin analiz yap · paseo'da en üst düzey performans elde edeyim»). **Damga:** 2026-11-01 05:16 (ölçüldü).

**Girdi raporlar (operatörce diske karşı doğrulandı: JSON parse OK, schemaSurum:1, madde sayıları birebir):**

- [HIZ](../gelen-kutu/OTONOM-ANALIZ-HIZ-2026-11-01.md) — 10 madde · 59 satır — **KOŞULLU**
- [KALİTE](../gelen-kutu/OTONOM-ANALIZ-KALITE-2026-11-01.md) — 14 madde · 72 satır — **KOŞULLU**
- [GÜVENLİK-PERF](../gelen-kutu/OTONOM-ANALIZ-GUVENLIK-PERF-2026-11-01.md) — 12 madde · 97 satır — **GÜVENLİ-KOŞULLU**

**Çapraz-teyit:** HIZ'ın repo-bazlı devir sayımları (ordu 35, scraper 21) operatörün bağımsız ölçümüyle birebir (96 dosya / 14 repo turu, aynı gün).

## NİHAİ HÜKÜM — 4 BOYUT

**Soru: hız · kalite · performans · güvenlik dördü birden artar mı? Cevap: KOŞULLU EVET.**

| Boyut | Koşullu mimari (v2) ile | Koşulsuz v1 ile |
|---|---|---|
| **HIZ** | ↑↑ — ölçülmüş manuel-ardıl duruş med **18,0 dk** (n=62; ordu aktif 12 · yeni-sekme 23 · uzak dönem 114-414 dk) → watchdog devri med ~7 dk = **aktif dönem 3-6x, uzak dönem 10-100x (T)** | ↑ hızlanır AMA pacing yoksa 429/f3-crash ile hız KAYBINA döner (R: K-0057'de 3 ajan → 429×3; CPU %100'de f3-crash ×2) |
| **KALİTE** | ↑/= — mekanik/koddan-kanıtlı sınıfta eşit ya da üst (devir tazeleşir, echo diski yeniden ölçer) | ↓ — echo-borcu ilk turu yer (35 halkada 11 boş ≈ %25); watchdog yazıcıya dönüşürse yazıcı≠denetçi bacağı kırılır |
| **PERFORMANS** | ↑ — oturum ömrü uzar (kütle diyetiyle birleşince: araç tanımı 61→~13, kural 47→38) + nöbet maliyeti ölçülü (~17-20k token/tur; 3 repo ≈ 0,3-1M token/gün cache'le, T) | =/↓ — eşzamanlılık tavanı yok → 429 salgını → toplam verim düşer |
| **GÜVENLİK** | ↑ — devir Paseo içinden doğarsa koruma zinciri (enjeksiyon + izin polisi + pitbull/bekci/loopguard) geçerli kalır; [insan]-kapıları kodda | ↓ — headless `claude -p` zinciri TAMAMEN bypass eder; yanlış-ölüm → çift-yazar (429 ile ölen ajanlar pencere açılınca dirildi — gerçek vaka) |

**Birleşik sinyal: 3/3 KOŞULLU — koşulsuz varyant üç bağımsız analiz tarafından da reddedildi (kullanım dışı).**

## MİMARİ v2 — 7 BİRLEŞİK KOŞUL (üç analistin kesişimi)

1. **Devir Paseo içinden** — mevcut oturuma gönderim = transkriptten devam, aynı kimlik; headless `claude -p` YOK. Koruma zinciri + izin polisi geçerli kalır.
2. **Tek-örnek kilidi KODDA** — kira dosyalı (PID + başlangıç-zamanı) lease; süreç-çıkış kanıtı olmadan devir YOK; watchdog çakışmada yeni gelen çekilir, **kill ETMEZ**.
3. **Tavanlar kodda zorlanır** — iş ajanı ≤3 (+ eşzamanlı nöbet 1, devir 1/pencere), ~20 istek/dk, 429'da 10-15 dk geri çekilme, spawn CPU eşiği (>%85 bekle), 2 ardışık başarısız devirde watchdog insan kapısına düşer.
4. **Watchdog ASLA yazıcı/denetçi değil** — yalnız devir hakkının sahibi; script ajan write-set'i DIŞINDA, sabit şablon (Qoder/GD-007 dersi).
5. **Echo-borç kapanış mini turu** her devirden önce + zincir ≤3 ardışık devir → insan turu + periyodik N5 gözlemci turu.
6. **[insan]-kapıları STATE'ten KODA** (fail-closed; aktör=ajan:watchdog RED) + EK-2 aynen: onay üretme YOK, 2 satır rapor, 2. ardışık dürtmede dur.
7. **Kademeli pilot + ölçüm** — 1 workspace × ≥30 dk sessiz nöbet; watchdog yalnız 2. derece (Paseo heartbeat'in kendisi öldüğünde); MTTR/istek/token/429 ölçülmeden kapsam büyütülmez. diskC %9.1 ALARM'da yeni kalıcı schedule YOK — pilot tek koşum.

**Kalite-kapıları (KALİTE raporundan):** iş fişine `devirSinifi` şema alanı (tanıma metinden koda) · echo-doluluk bacağı zincir-kontrol'e · boş `maddeler:[]` sidecar'ı kırmızı sayan şema kapısı · denetçi rotasyonu.

## «EN ÜST DÜZEY PERFORMANS» YOL HARİTASI (öncelik sırası)

1. **Kütle diyeti (öncü — her oturuma anında yarar, risksiz):** ① B senkronu (paket ÇEKİRDEK kural 47→38) canlı plugin + daemon reload **[insan kararı]** → ② canlıda kuralToplam yeniden ölç → ③ >40 kalırsa Liste-2 kalıntısı (EK kesimleri ayrı L4 kaydı). **+ MCP exposure filtresi** plugin server'da workspace bazlı (61 tanım → kullanılan ~13; ordu transkript ölçümü: 92/8.708 = %1,1). Etki: taban bağlam küçülür → oturum ömrü uzar → devir sıklığı (ordu 3,5/gün · scraper 8,5/gün) düşer → manuel sekme ihtiyacı azalır.
2. **Pilot-0 nöbet:** tek workspace (öneri: scraper — en yüksek devir sıklığı) × 30 dk sessiz nöbet, 7 koşulun TAMAMI kodda; ölçüm: MTTR · istek/dk · token/tur · 429 sayısı.
3. **Watchdog 2. derece** (yalnız heartbeat ölümünde) — pilot verisi onaylamadan tam kapsam YOK.
4. **Ölçüm altyapısı O2 hattıyla birleşir** — performans yalnız kayıtlı ölçümden türetilir (SH-f hard kapı); nöbet ölçümleri aynı kaynağa girer.

**Dürüst notlar:** 18 dk manuel ölçümü (R) sağlam; 3-10x kazanım (T) sınıfı tahmin. aa1ac225 / 341-369 süreç / bugünkü 429-kesintisi diskte kanıtlanamadı (HIZ-10 dürüst beyan). Nöbet token maliyeti ~17-20k/tur (T; enjeksiyon + handoff ölçümlü). **Uygulama YOK — yürütme emri bekler (EK-2).**
