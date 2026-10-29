# Eksik Raporu — DC "Demir Çekirdek / Kademeli Büyüme" Planının Uçtan Uca 3-Subagent Denetimi

- **Tarih:** 2026-10-28 (Europe/Istanbul, UTC+3)
- **Yazan:** deepseek (ana ajan; 3 alt-ajan sentezi + iki doğrulama turu)
- **Kapsam:** `plans/PLAN.md` v2.10.1 §25 · `plans/gorev-grafigi-2026-10-26.json` v14 · `plans/GOREV-GRAFIGI-SENERARYO-2026-10-26.md` · `plans/kabul.csv` · ilgili `core/src` + `plugin/server` uçları
- **Yöntem:** V1 (teknik/güvenlik) · V2 (yönetişim/otorite/bütçe) · V3 (uygulanabilirlik/ölçülebilirlik) + iki doğrulama turu (4 P1 bulgusu kaynaktan teyit edildi)
- **İşaretler:** **(R)** kaynaktan doğrulandı · **(T)** tahmin · **(Ç)** çürütüldü
- **Niteliği:** Salt-okur inceleme; bu rapor dışında hiçbir dosya değiştirilmedi.

---

## 0. Yönetici özeti

Plan **yönetişim açısından dürüst ve kasıtlı olarak kapalıdır** (`uygulamaBaşlatmaYetkisi:false`, `butceOnayi:null`), fakat üç bağımsız denetçi de **uçtan uca uygulanamaz** sonucuna vardı. Eksikler üç kümede toplanıyor:

1. **Gerçek çelişkiler** — ikiz metindeki sıra (E-04); hiç çalışmamış boş kapı sözleşmesi (E-03);
2. **Teknik boşluklar** — gerçek izolasyon (E-01), kimlik/operatör baypası (E-02), opsiyonel imza (E-05), kuyrukta deadline/grant yeniden denetimi (E-06);
3. **Ölçüm sözleşmesi katmanı** — sprint→metrik→eşik→kanal bağının yokluğu (E-08, E-09, E-17) + bütçe ikiliği (E-07).

Plan metninin varlığı hazırlık puanını yükseltmez; bu turda **hiçbir puan veya yeşil oran üretilmedi/değiştirilmedi**.

---

## 1. Doğrulama turunda teyit edilenler (R)

| Bulgu | Kaynaktan teyit | Sonuç |
|---|---|---|
| **E-05** İmza opsiyonel | [`core/src/receipt-link.ts:182`](../core/src/receipt-link.ts:182) → `if (ctx.verifySignature && !ctx.verifySignature(r))` — imza **yalnız sağlanırsa** denetlenir; varsayılan bypass. | **(R) DOĞRULANDI** |
| **E-06** Kuyrukta deadline/grant yeniden denetimi yok | [`core/src/dispatcher.ts:41`](../core/src/dispatcher.ts:41) sorgusu yalnız `outbox` + `attempt.state==='RUNNING'` bakıyor; **deadline/grant/expiry çağrısı yok**. | **(R) DOĞRULANDI** |
| **E-02** Plugin dosya-kuyruğu baypası | [`plugin/server/ordu.ts:134`](../plugin/server/ordu.ts:134) `paseo.agents.create(...)` doğrudan çağrılıyor; **PLAN_APPROVED/A03 kapısı yok**. | **(R) DOĞRULANDI** |
| **E-08** DC sprintleri ölçümsüz | [`plans/kabul.csv:127`](../plans/kabul.csv:127)–[:137](../plans/kabul.csv:137) → 11 DC satırının tümü `NOT_RUN`; kanıt sütunu yalnız `"<LOC> teknik LOC (T)"`; başlık şeması `id,faz,kaynak,durum,kaniT` — **ölçüt/metrik/eşik/kanal alanı şemada yok**. | **(R) DOĞRULANDI** |
| **E-04** Sıra çelişkisi | [`plans/GOREV-GRAFIGI-SENERARYO-2026-10-26.md:251`](../plans/GOREV-GRAFIGI-SENERARYO-2026-10-26.md:251) `DC-S2(dep DC-S1)` + `DC-S3(dep DC-S2)`, kritik yol [:267](../plans/GOREV-GRAFIGI-SENERARYO-2026-10-26.md:267) `S1→S2→S3`; PLAN [`:446`](../plans/PLAN.md:446) `S1→S3→S2`. | **(R) DOĞRULANDI** |
| **E-03** Kapı sözleşmesi boş | [`plans/gorev-grafigi-2026-10-26.json:1022`](../plans/gorev-grafigi-2026-10-26.json:1022) `planHash:null`, [:1023](../plans/gorev-grafigi-2026-10-26.json:1023) `grafHash:null`, [:1024](../plans/gorev-grafigi-2026-10-26.json:1024) `kanitRefleri:[]`, [:1025](../plans/gorev-grafigi-2026-10-26.json:1025) `insanKanitKabulKarari:null`. | **(R) DOĞRULANDI** |
| **E-07** Bütçe ikiliği | [`plans/gorev-grafigi-2026-10-26.json:1635`](../plans/gorev-grafigi-2026-10-26.json:1635) `butceGecmisi` yalnız v12; [:1932](../plans/gorev-grafigi-2026-10-26.json:1932) `tumYol:[12320,19390]`; [`:1940`](../plans/gorev-grafigi-2026-10-26.json:1940) `butceOnayi:null`, [:1939](../plans/gorev-grafigi-2026-10-26.json:1939) `uygulamaYetkisi:false`. | **(R) DOĞRULANDI** |
| **E-22** Atıf özeti boş | [`raporlar/plan-3-denetci-2026-10-27/OZET.md:1`](./plan-3-denetci-2026-10-27/OZET.md:1) → 0 satır. | **(R) DOĞRULANDI** |

---

## 2. Zincir ve boşluk haritası

```mermaid
flowchart LR
    S0a[DC-S0a keşif]:::gap --> IZIN[ara dar izin]:::gap --> S0b[DC-S0b dar izin]:::gap
    S0b --> S0[DC-S0 taban/kimlik]:::partial --> G0{{DC-G0 kapı}}:::gap
    G0 --> S1[DC-S1 sözleşme/tek kapı]:::partial --> S3[DC-S3 yaşam/tüketim]:::ok
    S3 --> S2[DC-S2 korunan test]:::ok --> S4[DC-S4 pilot]:::partial --> H1{{DC-H1 insan}}:::gap
    H1 --> S5[DC-S5 sabit-plan]:::ok --> S6[DC-S6 onarım]:::ok --> H2{{DC-H2}}:::ok
    H2 --> S7[DC-S7 replan]:::ok --> S8[DC-S8 öğrenme]:::ok --> H3{{DC-H3}}:::ok
    H3 --> S9[DC-S9 terfi]:::ok --> S10[DC-S10 kampanya]:::ok --> H4{{DC-H4}}:::ok
    classDef ok fill:#d4f7d4,stroke:#2e7d32;
    classDef partial fill:#fff3cd,stroke:#b8860b;
    classDef gap fill:#f8d7da,stroke:#b02a37;
```

⚠ İnsan ikizi [`GOREV-GRAFIGI-SENERARYO-2026-10-26.md:251`](../plans/GOREV-GRAFIGI-SENERARYO-2026-10-26.md:251) ok yönünü **`S1→S2→S3`** çiziyor (PLAN/graf `S1→S3→S2`); ayrıca `S0a / ara-izin / S0b` graf'ta **düğüm/kenar değildir**, yalnız §25.6 metninde geçer.

---

## 3. Birleşik bulgu listesi (önem sırasına göre)

### 🔴 Kritik (P0) — yürütmeyi bloklar

| # | Bulgu | Kanıt | Kaynak |
|---|---|---|---|
| **E-01** | Gerçek izolasyon/sandbox H1 sonuna dek yok; `capabilities.ts` yalnız statik probe. | [`plans/PLAN.md:440`](../plans/PLAN.md:440), [`core/src/capabilities.ts:59`](../core/src/capabilities.ts:59) | V1 #5 |
| **E-02** | Kimlik ≠ operatör sınırı; plugin kuyruğu kapıyı baypas ediyor. | [`core/src/cli.ts:172`](../core/src/cli.ts:172), [`plugin/server/ordu.ts:134`](../plugin/server/ordu.ts:134) | **(R)** V1 #6 |
| **E-03** | Kapı sözleşmesi boş → mekanizma hiç çalışmadı. | [`plans/gorev-grafigi-2026-10-26.json:1022`](../plans/gorev-grafigi-2026-10-26.json:1022), graf `:79` | **(R)** V2 #5/#6 |

### 🟠 Yüksek (P1) — kapatılmadan sprint başlatılmamalı

| # | Bulgu | Kanıt | Kaynak |
|---|---|---|---|
| **E-04** | Sıra çelişkisi: ikiz `S1→S2→S3`, PLAN/graf `S1→S3→S2`. | [`plans/GOREV-GRAFIGI-SENERARYO-2026-10-26.md:251`](../plans/GOREV-GRAFIGI-SENERARYO-2026-10-26.md:251), [:267](../plans/GOREV-GRAFIGI-SENERARYO-2026-10-26.md:267), [`plans/PLAN.md:446`](../plans/PLAN.md:446) | **(R)** V1 #1 |
| **E-05** | Makbuz imzası opsiyonel ↔ §25.7 "8 bağ zorunlu". | [`core/src/receipt-link.ts:182`](../core/src/receipt-link.ts:182), [`plans/PLAN.md:532`](../plans/PLAN.md:532) | **(R)** V1 #7 |
| **E-06** | Kuyrukta deadline/grant dispatch anında yeniden denetlenmiyor. | [`core/src/dispatcher.ts:41`](../core/src/dispatcher.ts:41), [`plans/PLAN.md:544`](../plans/PLAN.md:544) | **(R)** V1 #8 |
| **E-07** | Bütçe ikiliği: kabul.csv eski nominal (220…9.980) + `butceGecmisi` yalnız v12; tekBA yeni aralık 12.320–19.390. | [`plans/gorev-grafigi-2026-10-26.json:1635`](../plans/gorev-grafigi-2026-10-26.json:1635), [:1932](../plans/gorev-grafigi-2026-10-26.json:1932), [`plans/PLAN.md:475`](../plans/PLAN.md:475) | **(R)** V1#11 · V2#1/#2 · V3#3 |
| **E-08** | DC sprintleri ölçülemez (tümü NOT_RUN; şemada ölçüt yok). | [`plans/kabul.csv:127`](../plans/kabul.csv:127) | **(R)** V3 #1 |
| **E-09** | Ölçüm kanalı var ama DC sprintlerine bağlanmamış. | [`scripts/test-kanal.ps1:34`](../scripts/test-kanal.ps1:34), [`plans/UYGULAMA-PLANI-SPRINT-2026-10-26.md:105`](../plans/UYGULAMA-PLANI-SPRINT-2026-10-26.md:105) | V3 #2 |
| **E-10** | Birleşik risk defteri yok (iki dokümana dağılmış). | [`plans/DEMIR-CEKIRDEK-KADEMELI-BUYUME-TASLAK-2026-10-27.md:54`](../plans/DEMIR-CEKIRDEK-KADEMELI-BUYUME-TASLAK-2026-10-27.md:54), [`plans/PASEO-VERIMLILIK-PLANI.md:106`](../plans/PASEO-VERIMLILIK-PLANI.md:106) | V3 #4 |
| **E-11** | DC-G0 sözleşmesi eksik: `gerekliKabulIdleri=["DC-S0"]` iken §25.6 S0a/S0b ayrı teslim ister. | [`plans/gorev-grafigi-2026-10-26.json:1017`](../plans/gorev-grafigi-2026-10-26.json:1017), [`plans/PLAN.md:516`](../plans/PLAN.md:516) | V1 #3/#4 |

### 🟡 Orta (P2) — izlenecek / temizlik

| # | Bulgu | Kanıt | Kaynak |
|---|---|---|---|
| **E-12** | `kodLocT` serbest metin; `metaYaz` regex ile parse ediyor. | graf `:1599`, [`pano/kapsul-tuval.html:94`](../pano/kapsul-tuval.html:94) | V1 #9 |
| **E-13** | Kanıt dörtlüsü olmadan yeşil: B01, A35, A36, MOD. | [`plans/kabul.csv:3`](../plans/kabul.csv:3), [:25](../plans/kabul.csv:25), [:26](../plans/kabul.csv:26), [:58](../plans/kabul.csv:58) | V2 #7 |
| **E-14** | Ödünç/karar kanıt satırları: F7-B=K-0049 (ödünç), M17 (kapsam kararı). | [`plans/kabul.csv:90`](../plans/kabul.csv:90), [:43](../plans/kabul.csv:43) | V2 #8 |
| **E-15** | Tarihsel `S2/S3` ↔ yeni `DC-S2/DC-S3` isim çakışması. | [`plans/GOREV-GRAFIGI-SENERARYO-2026-10-26.md:226`](../plans/GOREV-GRAFIGI-SENERARYO-2026-10-26.md:226) | V1 #10 |
| **E-16** | Rollback/STOP "yürütme" eşiği belirsiz. | [`plans/PLAN.md:463`](../plans/PLAN.md:463), [:544](../plans/PLAN.md:544) | V3 #5 |
| **E-17** | H1/H4 projeksiyonu ölçümle doğrulanamaz ("ölçüm sözleşmesi" yok). | [`raporlar/rapor-chatgpt-27ekim.md:594`](./rapor-chatgpt-27ekim.md:594) | V3 #6 |
| **E-18** | "İnsan kanıtı" formatı/kaydı kısmen açık. | [`plans/PLAN.md:536`](../plans/PLAN.md:536), [:582](../plans/PLAN.md:582) | V3 #7 |
| **E-19** | S0 çıktısı, sonraki sprintlerin LOC ayrıştırmasından önce gerekli. | [`plans/PLAN.md:572`](../plans/PLAN.md:572) | V3 #8 |
| **E-20** | DC-S3 kapsamı DC-S1 sınırını aşıyor. | [`plans/PLAN.md:538`](../plans/PLAN.md:538) | V1 #2 |

### 🟢 Düşük (P3)

| # | Bulgu | Kanıt | Kaynak |
|---|---|---|---|
| **E-21** | H1 "on hata ailesi" sayılıyor ama geçme eşiği tanımsız. | [`plans/PLAN.md:473`](../plans/PLAN.md:473), [:582](../plans/PLAN.md:582) | V3 #9 |
| **E-22** | **(R)** Atıf yapılan özet dosyası gerçekten boş. | [`raporlar/plan-3-denetci-2026-10-27/OZET.md:1`](./plan-3-denetci-2026-10-27/OZET.md:1) | V2 #9 |

---

## 4. Çürütülen / doğrulanan iddialar (dürüstlük defteri)

- **(Ç) Çürütüldü —** *"S3-S2 yer değişimi hatalı."* → **Kasıtlı**: S3'ün S2'den önce gelmesi, süreç/yazma kapanışı olmadan aday mühürleme iddiasını engelliyor ([`plans/PLAN.md:446`](../plans/PLAN.md:446)). **Ancak** ikiz metnin güncellenmemiş olması ayrı ve gerçek bir eksiktir (bkz. E-04).
- **(R) Doğrulandı —** Yetki/rol matrisi tutarlı, kendini-genişletme kapalı (graf `:149,222,264,266`) · kapı kabulü ≠ sonraki faz başlangıcı ayrımı mevcut (graf `:1025`; [`plans/PLAN.md:552`](../plans/PLAN.md:552)) · "ürün tamam değil" ile nihai hüküm çelişmiyor · kapsam sınırı sertleştirilmiş · **135 satır / 81 yeşil korunmuş**, 11 yeni `NOT_RUN` · eski rezerv ikinci kez eklenmiyor (graf `:1936`) · bütçe onayı boş (graf `:1940`).

---

## 5. İnsan karar kuyruğu (V2 derlemesi — aciliyet sırasıyla)

1. **K-SADE kural sadeleştirmesi** (80 satır tavan; FULL) — **en acil**.
2. **DC-S0 başlangıç kapsamı** onayı (S0a keşif + S0b dar izin + davranışsal kanıt).
3. **DC-G0 kapısı** (S0a keşif + S0b dar izin + gerçek kanıt ayrımı).
4. **Bütçe yeniden-hesap onayı** ([`plans/gorev-grafigi-2026-10-26.json:1632`](../plans/gorev-grafigi-2026-10-26.json:1632) `null`).
5. **K-0044 kart-anahtarı ortam (env)** kararı.
6. **A3 bekleyen kural** (`krl-b0cb1576`).
7. **Replan taslağı** (`rpl-03579e06`).
8. **A4 gece-modu açılış kapısı**.

---

## 6. Nihai hüküm

| Boyut | V1 (teknik/güvenlik) | V2 (yönetişim) | V3 (uygulanabilirlik) |
|---|---|---|---|
| **Verdict** | Olduğu gibi **yürütülemez** (*kasıtlı*) | yön onayına **sunulabilir**, işletimsel kapı için **NO-GO** | Olduğu gibi **uygulanabilir değil** (*kasıtlı*) |
| **Önce kapat** | İzolasyon · kimlik/operatör baypası · kanıt tutarlılığı | (1) `butceGecmisi` (2) sayı ikiliği | Ölçüm sözleşmesi · kanal bağı · S0 tek-nokta-arızası |

**Üç denetçinin ortak öncelikli 3 riski:**

1. **Ölçüm/kabul boşluğu** — DC sprintleri için bitiş-ölçütü/metrik/eşik/kanal yok (E-08, E-09, E-17).
2. **Gerçek olmayan güven sınırı** — izolasyon + kimlik/operatör baypası (E-01, E-02) ve hiç çalışmamış kapı sözleşmesi (E-03).
3. **Bütçe/kanıt ikiliği** — iki sayı kümesi, eksik `butceGecmisi`, ikiz metin sapması (E-07, E-04).

---

## 7. En düşük maliyetli ilk düzeltmeler (yalnız öneri — uygulanmadı)

1. `plans/kabul.csv` şemasına `bitis_olcuttu · metrik · esik · kanal` alanlarını ekle; `scripts/test-kanal.ps1 → son-kanit.json` çıktısını DC satırlarına referansla (E-08, E-09).
2. `butceGecmisi`'ne v13/v14 kayıtlarını ekle; kabul.csv DC nominalini tek kaynağa bağla (E-07).
3. `core/src/receipt-link.ts` imzasını zorunlu kıl (`verifySignature` yoksa RED) (E-05).
4. `core/src/dispatcher.ts` `processOutbox`'a dispatch öncesi deadline/grant yeniden denetimi ekle (E-06).
5. İkizin sıra satırlarını (251, 267) ve S0a/ara-izin/S0b düğümlerini PLAN.md §25 ile hizala (E-04, E-11).

---

## 8. Kanıt dürüstlük notu

- Tüm satır numaraları ana ajanın **iki doğrulama turuyla** teyit edilmiştir; bu turda 4 yeni P1 bulgusu (R) seviyesine çıkarıldı.
- Bulgular *plan-metni→kod* eşlemesidir; plan **kasıtlı olarak kapalı** olduğundan "eksik" = "henüz yok / tutarsız" anlamındadır.
- Bu inceleme turunda **incelenen dosyalarda hiçbir değişiklik yapılmadı**; yalnız bu rapor dosyası (`raporlar/rapor-deepseek27ekim.md`) oluşturulmuştur.
- Bu raporda hiçbir olgunluk puanı, yeşil oranı veya kanıt (R) iddiası yeni olarak üretilmemiş ya da değiştirilmemiştir.

## 9. ERATA — Etkin bulgu hükümleri (28 Ekim 2026)

Kullanıcı emri “yukarıdaki kapanışları tamamla” kapsamında kaynaklar çapraz uzlaştırıldı. Yukarıdaki **22 bulgu ve 3/8/9/2 şiddet dağılımı tarihsel rapor sayımıdır; bugün 22 bağımsız açık olduğu iddiası değildir**. Dosyada görülen değer (R) ile o değerden çıkarılan yorum ayrılır. Kanonik eşleme [mevcut eksik defterinin DC ekindedir](birlesik-eksik-defteri-2026-10-25/DC-2026-10-28.json); ayrı ikinci açık-iş defteri açılmadı.

| Özgün bulgu | Etkin yorum / işlem |
|---|---|
| E-01 | Gerçek izolasyon kanıtı ürün önkoşulu olarak açıktır; plan bunu H1 sonuna ertelemiyor, S0/G0 öncesine koyuyor. C01. |
| E-02 | Alternatif giriş ve gerçek operatör ayrımı ürün açığı olarak korunur. C03. |
| E-03 | Boş onay/kanıt alanı sözleşme yok demek değildir. Ana plan §25.9 bunu doğru kapalı başlangıç olarak şart koşar. Çalışma zamanı uygulaması ayrı iştir; sahte karar eklenmez. C08. |
| E-04 | Eski sıra insan ikizinin **tarihsel §19** bölümündedir; **güncel §20** zaten S1 → S3 → S2 ile uyumludur. Güncel sıra çelişkisi iddiası çürütülür; tarihçe değiştirilmez. |
| E-05/E-06 | İmza zorunluluğu ve dış etki öncesi güncel deadline/grant kontrolleri ürün işleri olarak açıktır. C04/C06. |
| E-07 | Eski nominal ile yerine geçen tahmin açıkça tarihçe/koşullu ayrılmıştır; iki onaylı bütçe yoktur. Gösterim/izlenebilirlik işi ile bütçe onayı ayrı tutulur. C10. |
| E-08/E-09 | NOT_RUN veya CSV'de ayrı sütun bulunmaması ölçüt yokluğu kanıtı değildir. Mevcut plan/graf ölçütleri atomik test/kanıta bağlandı; CSV şeması değişmedi. Gerçek test/kanıt teslimi ürün görevlerinde bekler. |
| E-10 | Risk ve açık işleri mevcut defterin tarihli DC ekinde tekilleştirildi; yeni otorite açılmadı. |
| E-11 | S0a/S0b grafın DC-S0 alt adımlarında zaten vardır. Yeni düğüm veya PASS satırı gerekmez. Dar sınama izni ve G0 kabulü ayrı kalır. |
| E-12 | Eski okuyucu için metin görünümü kasıtlı uyumluluktur; aritmetik sayısal alandadır. Bu veri düzeltmesi genel okuyucu/çalışma zamanı güvenliğini tamamlamaz. C09. |
| E-13/E-14 | Eski dar kanıt ve kapsam kararları kendi tarihsel anlamıyla korunur; bütün satırlara sonradan aynı kanal kuralı uygulanıp PASS silinmez veya sahte kanıt eklenmez. Yeni kapanış kendi kanıtını ister. |
| E-15 | Eski S2/S3 ile DC-S2/DC-S3 ayrı kimliklerdir; önek ve tarihçe korunuyorsa isim benzerliği yürütme çakışması değildir. |
| E-16/E-18 | STOP/geri dönüş ve insan kanıtı için plan sözleşmesi vardır; somut uygulama/karar kayıtları kendi S3/S4 ve insan kapılarında bekler. |
| E-17 | H1/H4 puanları ölçülmüş sonuç değil, koşullu (T) değerlendirmedir; gözlenen başarıyla karıştırılmaz. |
| E-19 | S0 sonrası yeniden ayrıştırma açık bağımlılıktır; tek başına yeni ürün hatası veya ek LOC kalemi değildir. |
| E-20 | S3'ün süreç/kullanım kapsamı S1'den geniş olabilir; görevlerin farklı teslimleri olması sınır ihlali değildir. Kimlik/veri arayüzü S0 ADR'sinde teyit edilir. |
| E-21 | On hata ailesi atomik S4 kabul/kanıt işine bağlandı; sayısal işletim eşikleri adaydan önce dondurulacak. Test paketi hazırlığı testlerin geçildiği anlamına gelmez. |
| E-22 | Boş denetim özeti bu kapanışta mevcut makine kayıtlarına dayanarak tamamlandı; geçmiş (R) gözlemi silinmedi. |

**İnsan kuyruğu düzeltmesi:** A3'ün krl-b0cb1576 taslağı daha sonraki kayıtla onaylanmıştır. K-0044 kararı onaylıdır, uygulama penceresi bekler. Eski replan güncel sürüm/kapsam kontrolü olmadan uygulanmaz; eski A4, H1 ve ayrı insan emri öncesinde açılamaz. K-SADE kural sadeleştirmesidir, kabul CSV şeması değildir; bu kapanışta uygulanmadı. Kaynak raporun eski kuyruğu bugünkü yürütme emri yapılmaz.

**Son etkin hüküm:** Rapor yorumları düzeltildi; ürün güvenlik/kimlik/kanıt/kullanım işleri kanonik C gruplarında açık. Yeni ürün puanı, canlı başarı, harcama veya uygulama yetkisi üretilmedi. [Belge kapanış paketi](kilit-oncesi-kapanis-2026-10-28/OZET.md) final insan kabulünün yerine geçmez.
