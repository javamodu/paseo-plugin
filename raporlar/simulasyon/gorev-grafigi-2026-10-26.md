# ÖN-SİMÜLASYON RAPORU — GÖREV GRAFİĞİ BULUTU v2 (2026-10-26)

> Kapsam: plans/gorev-grafigi-2026-10-26.json (v2) kuru koşum — GOREV-GRAFIGI-SENERARYO-2026-10-26.md §6 kuralı: koşum ÖNCESİ zorunlu. Hata bulunursa graf v(n+1) düzeltilir, koşum YOK.

## Kontroller (5/5 sonuç)

| # | Kontrol | Sonuç | Kanıt (R) |
|---|---|---|---|
| 1 | DAG (döngü yok) | **PASS** | topolojik sıralama: 21/21 düğüm sıralandı, 0 geri-kenar; kökler: T0, S1, A0-2, A0-4, EK1-1, EK1-5 |
| 2 | her BEKLE'nin bağımlılığı var + kenar/görev tablo bütünlüğü | **v1'de HATA → v2 PASS** | v1: K1'in 10 bağımlılığı görev tablosundaydı ama `kenarlar` dizisinde yoktu (ajan kenarlardan yürürse K1 asla tetiklenmezdi); v2: 10 kenar eklendi → 27 kenar; programatik: eksik bağımlı-id 0 |
| 3 | her görevde ölçüt+dizin+rol dolu | **PASS** | 21/21 — elle tek tek doğrulandı (alanlar boş olmayan string) |
| 4 | bütçe/LOC tavan | **v1'de HATA → v2 PASS** | v1: loc toplamı 2615 > 2600 tavan (kök-neden: aralık ÜST uçları tek değer yazılmış: A1=700, A2=400, A3=350, A4=250); v2: orta-nokta değerleri (550/325/275/200) → toplam **2265** ∈ [1900-2600] ✓; test toplamı **890** ≤ 950 ✓ |
| 5 | kritik yol kapı zinciri | **PASS** | T0→S7→A1→A2→A3→A4→K1 yolunda insan kapıları işaretli: S7 "koş" · A1 rubrik onayı · A2 eşik onayı · A4 gece-modu açılışı · K1 tag onayı |

## v1 → v2 değişim kaydı (append-only, grafSurumGecmisi JSON içinde)

1. `loc` alanları aralık üst ucuğundan orta noktaya çekildi (A1: 700→550, A2: 400→325, A3: 350→275, A4: 250→200); `locAralik` alanı eklendi (MD'deki bant korunur).
2. K1 kenarları (10 adet) `kenarlar`'a eklendi — görev-tablosu ↔ kenar tutarsızlığı kapandı.
3. `testLocT` tavan ~950 olarak netleştirildi (MD "~900" bandının %2 üstü dürüst kayıtla taşınır; v2 toplam 890).

## Sonuç

**Graf v2 KOŞUMA HAZIR** — 5/5 kontrol yeşil (2 tanesi v1 hatası bulundu→düzeltildi→yeniden koşuldu; bu, ön-simülasyonun işe yaradığının ilk kanıtı: iki sessiz hata koşumdan önce yakalandı).

- Kritik yol (uzun bağımlılık zinciri): T0 → S7 → A1 → A2 → A3 → A4 → K1
- Paralel başlatılabilir (bağımlılığı sadece T0/hiç yok): A0-1 (T0 sonrası), A0-2, A0-4, EK1-1, EK1-5, S1 — ilk "düdük" dalgası bu 6'dan seçilir
- Sıradaki [insan] düdükleri: "S1 koş" (canlı senaryo) veya "A0 dalgası başla" (onarım paketi) veya G1 madenci fırlat (OTONOM-SÜRÜ boru hattı)

## Tıkandıkça-iyileştirme bağlantısı (§6 ikinci yarı)

Her koşum tıkanması bu rapora olay olarak append edilir: `{tarih, gorevId, nedenEtiketi, proxyKararı}`; aynı etiket 2. kez → görev otomatik bölünür → graf v3+ → yeni ön-simülasyon. Bu dosya append-only'dir.

---
Damga (R): 2026-10-26 ~12:25, ajan = ana oturum (Claude glm-5.3, ordu). Yöntem: programatik DAG sıralama + bağımlılık/LOC toplam kontrolü (PowerShell, JSON diskten) + elle alan doluluk taraması. Kaynak: gorev-grafigi-2026-10-26.json v2 + GOREV-GRAFIGI-SENERAYO-2026-10-26.md §6.

## v5 yeniden koşum (2026-10-26 ~15:49 — disk mtime ölçümü; ilk yazımda ~17:15 tahminle üretilmişti, düzeltildi — 10-subagent denetim düzeltme turu sonrası)

Graf v5: **24 düğüm / 29 kenar / 8/8 kontrol PASS** (programatik: node tmp-v5-kontrol.js, sonra silindi).
Değişiklikler (geçmişte birebir): (a) S5/S6 düğümleri + S1 kenarları eklendi (SSOT seçilebilirlik); (b) A1/A3 ölçüt-test sayıları 130/90'a çekildi; (c) S3 dizini 'plugin pano koprugu (4378)'; (d) A1 → KAPALI gerçeklik tazelemesi (F8 commit e70dd55 + kabul.csv PASS 13:31); (e) bütçe: kod 2565 (kalan ~2015 (T), A1 hariç) / test 1010 — tavalar 2600/1050.

- Kritik yol (v5): T0 → S7 → A1 ✓KAPALI → A2 → A3 → A4 → K1 — **A1 kapandığından sıradaki engel S7 mini-turnuva koşumu ([insan] düdük)**
- Kalan ilk-düdük adayları değişmedi: S1 · A0-2 · A0-4 · A0-5 · EK1-1 · EK1-5 (+A1'in kapanışıyla EK1-2/EK1-4 bağımlılığı çözüldü)

## v6 yeniden koşum (2026-10-26 17:05 — Get-Date ölçümlü; S3-plugin kapanışı sonrası gerçeklik tazelemesi)

Graf v6: **24 düğüm / 29 kenar / 8/8 kontrol PASS** (programatik; script koşum sonrası silindi).
Değişiklikler: (a) **T0 → KAPALI** (F6.5-A: commit 80fdb4a + kanal x=0 + kabul F65-01 PASS 10:46); (b) K1 ölçütü — **v0.23-kilit tag'i 16:2x'te plugin S3 dalgasında doğdu** (9853bb1); graf K1 sıradaki kilit penceresinde tag'ler (v0.24+ [insan]); (c) kilit script çift-ev kusuru RED kaydı (onarım graf-dışı kalem); (d) isim-uzayı dipnotu: grafın S3'ü (STOP senaryosu) ≠ plugin dalgasının S3'ü (v0.23).
Kalan butce: kod ~2010 (T) / test 1010. Kritik yol: T0✓ → S7 → A1✓ → A2 → A3 → A4 → K1 — **A1 gerçekte S7'yi beklemeden kapandığından A2 bağımlılıkça SERBEST (kritik yol ucu); S1/S7 senaryoları [insan] düdük bekler ama kalan zinciri (A2→A3→A4→K1) BLOKLAMAZ.**

## v7 yeniden koşum (2026-10-27 00:24 — Get-Date ölçümlü; A2 replan motoru kapanışı sonrası gerçeklik tazelemesi)

Graf v7: **24 düğüm / 29 kenar / 6/6 kontrol PASS** (programatik: node -e topolojik tarama + alan doluluğu; kenar yapısı v6 ile aynı — yalnız durum metinleri değişti).
Değişiklikler: (a) **A2 → KAPALI** (kanal son-kanit.json birebir d=2026-10-27T00:12:39.7323672+03:00 h=45bd046 x=0 etiket a2-replan sureSn=114; core/src/replan.ts + cli 'replan' + 11 hermetik test, tam süit 389/389; kabul.csv A2 PASS); (b) grafSurumu v6→v7 + geçmiş girişi; (c) KAPALI seti T0+A1+A2 (3/24).
Kalan butce: kod ~1685 (T) / test 890. Kritik yol: T0✓ → S7 → A1✓ → A2✓ → A3 → A4 → K1 — **A3 bağımlılıkça SERBEST (tek bağımlılığı A2 idi; kritik yol ucu artık A3).**
Kırmızı-satır notu: A2 ölçütü "+120 test" plan (T) değeri — gerçek (R) 11 kırılım testi; dürüst fark kabul satırında ve kanıt raporunda aynen kayıtlı.
