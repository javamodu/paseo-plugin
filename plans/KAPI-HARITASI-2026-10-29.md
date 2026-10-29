# KAPI-HARITASI-2026-10-29 — kalan iş tek bakışta (SSOT)

**Amaç:** kalan adımlar burada KAPI olarak durur. Sohbetlerde/raporlarda tekrar EDİLMEZ — yalnız bu dosyaya atıf yapılır ("kalan iş: KAPI-HARITASI"). Her önemli [insan] emri burada **sertleşir**: kapı satırı + kural. Detay ilgili fişte/kararda yaşar; bu dosya tek satırla indeksler.

**Hiyerarşi:** ANAYASA > AGENTS > PLAN > bu dosya. Yeni politika üretmez; mevcut kaynakları sıralar.

## 1. SERT KURALLAR (kullanıcı emirlerinden sertleşti)

| # | Kural | Kaynak emir |
|---|---|---|
| R1 | Mockup hattı DONDURULDU — K1 geçilene kadar yeni mockup/varyant satırı YAZILMAZ | «gerçek işe odaklanmalıyız» |
| R2 | Arayüz kabul ölçütü İKİ TEMEL: (a) solda atomize görev grafı + sağda detay, (b) kalp/manager döngüsü yüzü. Yüz ikisini taşımıyorsa K1 AÇILMAZ | «iki temel» beyanı |
| R3 | Her yeni önemli [insan] emri bu tabloya kapı satırı olarak APPEND edilir; sohbette kuyruk tekrarı YASAK — atıf yeter | «sürekli aynı şeyleri tekrarlamayalım» |
| R4 | Kapı satırında DEĞER cümlesi vardır; LOC/süre yalnız ilgili fişte yaşar, kapıda yaşamaz | «yavan loc» |
| R5 | Kapıyı cümle/koşul dışında hiçbir ajan açamaz (EK-2); GUI onay üretmez | ferman 3 |
| R6 | Kapı geçilince yalnız DURUM alanı değişir (GEÇİLDİ + tarih + commit); metin yeniden yazılmaz — tarihçe git'te | «detayda kaybolmayalım» |

## 2. KAPILAR

| Kapı | Durum | Açan | Doğan iş (değer) | Asıl kayıt |
|---|---|---|---|---|
| K1 MOCKUP KABULÜ | GEÇİLDİ (13:11) — R1 düzeltme bacağı KAPANDI (14:53, merge dd51987: kanal 467/467 x=0 96 sn + tip GECTI + hedefli 26/26; kapanış raporlar/dalga0-2-arayuz-2026-10-29/OZET.md) | «DALGA-0-2 başla» ya da eksik listesi | gerçek inşa dalgası (fiş→yazar→merge+tam kanal) — mockup'taki yüz gerçek veriyle 4377/tuval'e iner | raporlar/arayuz-mockup-6sub-2026-10-29/ |
| K2 GÖRSEL KABUL | SIRA SENDE — R2 tasarım bacağı KAPANDI (16:0x, merge 8c4c459: kanal 467/467 x=0 53 sn + tip + hedefli 33/33; yeni yüz 4377/tuval'de) | elle gezme + cümle | DALGA-0 + 0-2 kabul damgası; arayüz hattı kapanır. İç kapılar: D-2 canlı akış → D-3 graf yazma → D-4 AI edit | plans/KAPSUL-TUVAL-UI-PLANI-2026-10-26.md |
| K3 REPLAN | BEKLİYOR | terminal (core/): `node src/cli.ts replan --onay rpl-03579e06 --confirm "REPLAN ONAYLIYORUM"` | drift düzelir, graf gerçeğe döner | plans/KARAR-PAKETI-2026-10-28.md |
| K4 K-0044 PENCERE | BEKLİYOR | restart'ta birlikte; setx kullanıcı eliyle | ortam anahtarı referansı — değerler ekrana YAZILMAZ | kararlar/K-0044.md |
| K5 S0A_START | BEKLİYOR | «S0A başla» (önkoşul: CALISTIRMA §2 8-madde) | 4 keşif fişi — ÜRÜN hattı açılır (tek bütçe sahibi DC-H1: kaynak/test/pilot payları orada) | plans/uygulama-paketleri/DC-H1-2026-10-28/ |
| K6 H1 PAYLARI + DÜDÜKLER | BEKLİYOR | karar paketi cümleleri | bütçe payları + S2/S5/S6 düdükleri | plans/KARAR-PAKETI-2026-10-28.md |
| K7 PUSH | BEKLİYOR | «push» | yerel commit'ler uzak repoya iner | AGENTS.md (push ayrı emir) |
| K8 YÖNETİM ARAYÜZÜ (write-model) | BEKLİYOR | «DALGA-YÖNETİM başla» | admin her ekranı ön yüzden GÖRÜR + EDİTLER (plan/rol/ayar/onay; AI ile veya manuel); her edit **anında** MD + makine-okur çifte kayıt olarak diske iner — görev grafı + plan arkada makine-okur programlanır; izleme → yönetim dönüşür | plans/YONETIM-ARAYUZ-PLANI-2026-10-29.md |
| K9 G9-ÇEKİRDEK DENAYI | GEÇİLDİ (2026-10-29 16:2x, kullanıcı emriyle açıldı+kapandı) — 32/32 ×2 koşum · 351 LOC · kanıt `raporlar/deney-g9-cekirdek-2026-10-29/RAPOR.json` | «dar kapsamlı test yapalım» (emir bu kez API değil DENAY açtı) | kalp zinciri saf modülde kanıtlandı: miras daraltma-only çözücü + doküman kümesi + **gerekçeli atama filtresi** (G9 «ajanları nasıl seçtik» çekirdeği) + versiyon/diff taslağı + onay disiplini — G9 yüzü (K8/B7) bu çekirdeğin üstüne oturur | raporlar/deney-g9-cekirdek-2026-10-29/ |

**Geçiş sırası (öneri):** K1 → K2 → K8 → K3 → K5 → K4 → K7 → K6. Değişirse yalnız bu satır güncellenir.

## 3. Bakım

- Kapı geçildi → DURUM: GEÇİLDİ (+ tarih, commit) — append dışı metin düzenlemesi YOK.
- Yeni kapı → tabloya append (K8, K9…); kaynak emir R3'le bağlanır.
- Raporlarda kuyruk saymak yerine: "kalan iş: `plans/KAPI-HARITASI-2026-10-29.md`".
- Bu dosyanın kendisi kapı değildir; kapılar §2'dekilerdir.
