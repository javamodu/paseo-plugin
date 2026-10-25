# KALICI-AÇIK DEFTERİ + [İNSAN] KARAR DERLEMESİ — 2026-10-26

İlgi: plans/SAVASA-HAZIR-PLAN-2026-10-25.md (FAZ-3 kapanış eki; sıra adımı 4/6) · plans/kabul.csv (taze sayım) · raporlar/faz3-triyaj-2026-10-25.md (sınıflandırma kaynağı — SLOT/F7-A/V3-S3.1 kapanışlarıyla bayatlayan kısımları bu defter güncelledi) · K-0046 (NOT_RUN ≠ FAIL; geri-doldurma YASAK).

Etiketler: (R) resmî ölçüm (bugünkü makine sayımı) · (T) tahmin.

**Kaynak sayım (R, 2026-10-26 00:12, Import-Csv):** yeşil **47**/115 = %40,9 (PASS 43 + GECTI 3 + GECTI_CANLI 1) · GECTI_HERMETIC **35** · NOT_RUN **32** · KISMEN **1** (M19). 47+35+32+1 = 115 ✓. Yeşil-dışı **68** satırın tamamı aşağıdaki sınıflara ayrıldı: **36 K3 + 4 [insan] + 1 erteli + 27 koşum-tabanlı = 68 ✓**.

**Koşulabilir sıra SIFIRLANDI (S4 = 0):** K2'nin koşulabilir tamamı bitti — kanal onarımı (23:52) · SLOT (23:58) · F7-A (00:07) üç kapanışıyla bugünkü kabul.csv'de bir kanal koşumuyla tek başına açılabilecek satır KALMADI. Kalan 68'in her satırı [insan] kararı, dış-bağımlılık veya hermetik-kalıcı sınıfındadır; hiçbiri yalnız koşumla yeşile dönmez.

## Sınıf A — K3: bloklu / dış-bağımlılık canlı bacak (36 satır; kalıcı-açık)

Savaş-öncesi koşulmaz (ücretli API / provider wiring / telefon UI / çok-ajan senaryosu gerektirir); savaş içi ya da sınırlı-vekalet penceresiyle açılır. Blok noktasına göre gruplandı (R durumlar bugünkü):

| Grup | Satırlar (mevcut durum) | Blok noktası |
|---|---|---|
| Provider CLI uçtan uca | RT2 (NOT_RUN) · INDEP (HERMETIC) | gerçek harcama; 2-provider |
| Canlı dispatch etkisi | M02 (NOT_RUN) · MOD (HERMETIC) | Paseo adaptör wire edilmedi (KULLANIM §8 — fail-closed IDLE) |
| Canlı UI/operator yolu | M03 (HERMETIC) · M18 (HERMETIC) | canlı operator/UI kanalı |
| Remote/telefon UI (V3-S2) | M04 · M05 · M06 · V3-S2.1 · V3-S2.2 · V3-S2.3 (hepsi NOT_RUN) | telefon-remote UI; V3-S2.2 ayrıca insan denekçi ister (T) |
| Provider wiring / vekil | ADP (HERMETIC) · F65-01 (HERMETIC) · R3-01 (HERMETIC) | gerçek provider wiring; canlı vekil |
| Paired benchmark + ucu-uca (V3-S4) | V3-S4.1 · V3-S4.2 · ECON (NOT_RUN) | paired benchmark; ucu-uca canlı |
| Çok-ajan senaryoları | K12-01..K12-14 (14) · K13-01..K13-04 (4) (hepsi NOT_RUN) | savaş içi / sınırlı-vekalet ister |

Sayım: 2+2+2+6+3+3+18 = 36 ✓ (29 NOT_RUN + 7 HERMETIC). NOT_RUN 32 = 29 (bu sınıf) + M17 + F0-A + F7-B ✓.

## Sınıf B — [insan] kabul kararları (4 satır) + 1 erteli

| Satır | Durum | Karar noktası + öneri (v1-dışı kapanış önerileri burada görünür — kayıp yok) |
|---|---|---|
| F7-B | NOT_RUN | Kapsam kararı: "Paseosuz tam döngü" — **emsal flip adayı**: V3-S1.1 zaten gerçek local-runtime uçtan uca (kabul 2026-10-14) → kapsama alınırsa bugünkü karşılıkla PASS yazılabilir; aksi kalıcı-açık. [insan] — puan etkisi **+1** |
| A14 | HERMETIC | **ÖZELLİK EKSİK**: cli.ts'de decide komutu YOK (kabul yolu insan-onaylı: pano/CLI değil defter). Özellik eklenirse A14+A10 canlı zinciri açılır; aksi ÖZELLİK EKSİK kalıcı-açık. [insan] — puan etkisi **+2 (A14 + A10 zinciri)** |
| M17 | NOT_RUN | **ÖZELLİK EKSİK**: V3-S4.4 dar oto-kabul şeridi (K-0004.2; varsayılan kapalı) modern core'da YOK. Ya özellik ya kapsam-dışı kalıcı-açık. [insan] — puan etkisi **+1** |
| F0-A | NOT_RUN | K4 eski-plan: MS-SSOT v2.7.2 par10 manifest determinizmi — araç zinciri arşivde, kökte YOK. Ya arşivden diriltilir ya emsal kapatılır. [insan] — puan etkisi +1 (köprü dışı; 51 hedefini aşar) |
| M19 | KISMEN | Suite-corruption kolu S4-erteli — S4 olmaksızın test yazılabilirliği belirsiz (T). **Kalıcı-açık adayı**; her kapanış turunda yeniden değerlendirilir. |

## Sınıf C — koşum-tabanlı kanıt: HERMETIC kalır (27 satır; SARI — "kalıcı-açık" DEĞİL)

Kanıt türü kapalı-suit testidir; canlılık FAZ-3 ayrımı bunları gerektirmez (triyaj ilkesi: **tazelik ≠ canlılık**). Tazelik her kanal koşumunda yenilenir — bugün (R) 311/311 EXIT=0, kanal-kaynaklı (`test-f7a-sonrasi-bc938b8.log`). Durum: GECTI_HERMETIC kalır, SARI görünür (saglik).

Satırlar: RT0 · RT1 · A01 · A02 · A03 · A04 · A05 · A06 · A07 · A08 · A10 · A12 · A15 · A16 · M01 · M07 · M09 · M10 · M11 · M13 · METR · CLOSURE · HANDOFF · P0-4 · P0-5 · P0-6 · P0-7 (27 ✓).

## Onaylı taslak planla sınıf-eşlemesi (S-şeması; toplamlar birebir)

Onaylı taslak planın güncel S-şeması — üyelik listeleri plan dosyası tazelendiğinde oradan gelir; bu defter toplamları ve tekil-eşik sınıfları birebir taşır: **S1** hermetik-kabul kalıcı **21** · **S2** canlı-bacak adayı **13** (HERMETIC satırlar arasından; üyelik plan dosyasında) · **S3** [insan] F7-B/A14/M17 **3** · **S4 SIFIRLANDI** — koşulabilir kalmadı (açılış cümlesi yukarıda) · **S5** K3 dış-bağımlılık **29** (= bu defterin Sınıf A NOT_RUN'ları) · **S6** K4 F0-A **1** · **S7** M19 **1**. Denetim: 21+13+3+29+1+1 = 68 ✓.

## [İNSAN] KARAR KUYRUĞU (repo düzeyi — SAVAŞA HAZIR raporunda tek tabloda sunulur)

1. **B-1 pano-token rotate + `git rm`** (ya da K-0045 yerel-özel kabul) — core/veri/pano-token.txt git-tracked; değer hiçbir çıktıda raporlanmaz.
2. **Karar C — kart anahtarları** (env ya da K-0044/45 kart-anahtar kararı; savaş-öncesi sınıfı; F4 önkoşulu).
3. **ANAYASA A4 + başlık** (K-0043 kaydı; ANAYASA ajan değiştiremez).
4. **Kabul kapısı (b) K kaydı** — K-0046 (b) madde-bazlı onay düdüğü (BAŞLA madde-ID listesi + TAMAMLA aynı liste) kuralının kendi K kaydının açılması; bugüne dek onaylar toplu düdüklerle verildi.
5. **K-0039 + CODEMAP kapsam K kaydı** — kural-proxy sadeleştirme (84 → <80; sıra adımı 5/6) VE CODEMAP 141 > 130 bilinçli-kırmızının kapsam/bütçe kararı TEK K kaydı adayı (K-0037 emsali: eşik oynatma YOK — ya sadeleştirilir ya tavan bilinçli revize edilir).
6. **F7-B/A14/M17/F0-A/M19** — yukarıdaki Sınıf B (kabul.csv'yi ilgilendiren [insan] kararları).
7. **Dürtme 197/1138** (C-3 disiplini; backlog) · **8787 yabancı süreç** (deepseek-harness; core panosu 8787'de kalkamaz — çift-sunucu dokümantasyon kalemi).
8. **Gözlemci N5/N5-2 turu** (sıra adımı 6/6 — bağımsız oturum; artık 20 sonekli satır + kanal-kaynaklı zincirin tamamını kapsar).

## Dürüstlük notları

- Bu defter UYDURMA satır içermez: her satır bugünkü kabul.csv sayımından (R); kapananlar (SLOT 23:58, F7-A 00:07, kanal 23:52) bu defterde "kapanmış" olarak listelenmez — kalan 68'e dahil değillerdir.
- %44 = 51 hedefine K2 ile ulaşılamaz: **47 = K2 tavanı doldu**. Kalan **TAM 4 puan** üç [insan] kararıyla nokta-düzeyinde köprü kurar: **F7-B (+1) · A14 zinciri (+2: A14 + A10) · M17 (+1)** — dördüncü nokta A10, A14'in zincir ortağıdır (cli'de decide ucu ikisini birden açar). F0-A bu köprünün dışındadır (+1 → 52, hedef üstü). Sayı hedefi için uydurma YOK; her kararın etkisi puan-düzeyinde yazılıdır.
- Sınıf C, "hermetik-kalıcı" dur; kalıcı-açık DEĞİLDİR — sınıf karışıklığı sahte-kırmızı üretir (METR alarmının GECTI_HERMETIC'i SARI göstermesi bilinçli).
- K3 arıza türleri (provider CLI çökmesi vb.) fault-matrix'e GERİ-DOLDURULMAZ (fault-matrix-2026-10-25.md dürüstlük notu).
