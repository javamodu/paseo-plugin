# v8 — Paralel-yazar hız paketi (2026-10-28)

**Kaynak:** başka bir oturumun 7 maddelik önerisi (kullanıcı yapıştırdı, "incele yorumla"
→ tur 2'de madde madde doğrulandı; "düzeltmelerle uygula" → bu tur uygulama). Öneri
başka oturumun dosya haritasından yazılmıştı — buradaki doğrulama diske karşı yapıldı.
**Sahiplik:** uygulama bu tur (tek elden); rapor/kanıt kanalları aşağıda.

## Düzeltmeler (tur 2 hükümleri — bu kayda işlendi)

1. **Madde 1** (dalga-bazlı boru hattı): merge-birimi yeniden tanımı §25.5 dokunusu →
   L4 kayıt şart → **kararlar/K-0053.md ADR ÖNERİ** olarak doğdu (worktree/branch +
   merge anında tam kanal; kayıtsız muafiyet = gizli eşik gevşetme, yasak).
2. **Madde 2b** (kapanış bölme script'i kapanis-taslak.ps1): graf/kabul/SENARYO
   RBT-2026-10-28.2'nin kirli dosyaları → **RBT kapanışı önkoşulu**; bugün yazılmadı.
   Not: tur 2'nin "CALISTIRMA.md/dogrula.mjs/gorevler.json YOK" tespiti ESKİDİ — dosyalar
   artık diskte (RBT ilerlemiş); yalnız kapanis-taslak.ps1 hâlâ yok.
3. **Madde 3a** (f3-crash dinamik timeout): **reddedildi — eşik gevşetme** (yapma
   listesi yasağı). Alternatif öneri: tam süit koşumu sırasında gerçek-süreç testlerinin
   (f3-crash/f3-live/manager) paralellik kaynaklı açlık yaşadığı sınıf için AYRI
   seri-faz işi (bekleyen; kök neden = node --test'in dosya-düzeyi paralelliği).
4. **Madde 3b** (statik tip kapısı): **UYGULANDI — ratchet ile** (aşağıda §1).
5. **Madde 5** (paralel eşleme): K-0053 onayına bağlandı (öncesinde uygulanmaz).
6. **Gece penceresi** (madde 3 ayağı): gereksiz bulundu — kanal politikası zaten
   yük-dengi ölçümlü (A4 kanalı %36/%31'de beklemeden tek koşum x=0).

## §1 Uygulanan: statik tip kapısı (madde 3b — ratchet taban çizgisi)

- **core/tsconfig.json** (YENİ, serbest ayar — noEmit, strict kapalı) +
  **core/src/tip-kapisi.mjs** (YENİ, kapı script'i) + **core/package.json** `tip`
  script'i + devDependencies typescript@5.9.3/@types/node (npm install --save-dev).
- **Ratchet mantığı:** tsc --noEmit hata sayısı BILINEN_BORC=51'i AŞARSA exit 1
  (YENİ-TIP-HATASI); eşit/altı → GECTI + borç raporu; tsc çökerse fail-closed exit 1.
- **Ölçüm (R, bu tur):** baseline 51 hata = 6 src + 45 test — tamamı LATENT TİP-BORCU
  (süit 461/461 yeşil; canlı patlama YOK). B8 deseni ilk koşumda ~10 açık örnekle
  kanıtlandı (EchoLauncher/GitWorktreeLauncher/GercekLauncher/RealNodeLauncher'a
  `dispatchKeyOf` eksik — arayüz sözleşmesi değişmiş, taşıyıcılar taşınmamış).
- **Kapı kanıtı (R):** koşum-1 `{"hata":51,"yeni":0,"sonuc":"GECTI"}` exit 0, 5.5 sn;
  koşum-2 (geçici hata enjeksiyonu) `{"hata":52,"yeni":1,"sonuc":"YENI-TIP-HATASI"}`
  exit 1, 6.2 sn — enjeksiyon silindi (TEMIZ). **Tam süit 461/461 fail 0** (merge kapısı;
  kanal değil doğrudan koşum — bu dalga graf işi değil, kanal d/h/x kaydı A4 turunda
  atıldı).
- **Borç dürüstlüğü:** 51 sıfırlanmadı — 6 src (2'si gerçek imza temizliği: dispatcher
  ResolveResult daraltması, git-worktree-launcher dispatchKeyOf) + 45 test-fake düzeltmesi
  "iş başına mevcut dosya ≤3" sınırını aşar → borç-düşürme AYRI dalgadır (bekleyen;
  ratchet her düşüşte ayrı commit'te indirilir, sessiz değil).

## §2 Uygulanan: yazar brief şablonu (madde 4)

**plans/YAZAR-BRIEF-SABLON-2026-10-28.md** (YENİ): EK-3 4-öğe brief gövdesi +
bağlam paketi (readFiles — "repo'ya bak" brief'i geçersiz) + pre-flight sonda (minimal
headlike tek istek — W-A0-3'ün 11-dk-sonra-API-400 sınıfını saniyeler içinde yakalar;
probe.mjs CLI-varlık sondasıyla KARIŞMAZ: sonda çalışma yolunu sınar) + donmuş arayüz
sözleşmesi (B8 riski tip kapısıyla kapatılır) + yazar akışı (sonda→paket→kod+hedefli
test→tip→hedefli süit→teslim) + operatör akışı (tip + tam kanal tek koşum + kanıt raporu
+ tek elden commit) + yapılmayacaklar (test adedi kırma/eşik gevşetme/doğrulayıcı
atlama/sahte yeşil aynen yasak).

## §3 Uygulanan: kümelenmiş [insan] kapıları (madde 7)

**plans/KARAR-PAKETI-2026-10-28.md** (YENİ): 6 kapı sıraya kümelenir, her biri KENDİ
tam onay cümlesiyle — rpl-03579e06 (cümle kesin), K-0044 penceresi (restart'ta birlikte;
setx kullanıcı eliyle), K-0053 (ADR onayı), S0A_START (CALISTIRMA §2 8-maddeli
serbest bırakma kaydı önkoşuluyla), H1 bütçe payları (5.880–9.450, T — S1'in ayağı),
S2/S5/S6 düdükleri (metinler uydurulMADI — graf sahibi turda). Paket ONAY DEĞİLDİR
(EK-2: ajan onay üretemez); yalnız depolar + sıralar.

## Bekleyenler (bu turun dışı — sahiplik/ölçüt)

| madde | ne bekliyor | önkoşul |
|---|---|---|
| 1 uygulama (K-0053 pilot) | [insan] onayı → pilot dalga + ölçütler | karar paketi kapı 3 |
| 2b kapanis-taslak.ps1 | bölünmüş kapanış turu script'i | RBT-2026-10-28.2 kapanışı (graf/kabul/SENARYO kilidi) |
| 3a seri-faz | gerçek-süreç testlerinin seri fazda koşumu | AYRI iş fişi (eşik gevşetme REDDİ; dynamic timeout yok) |
| 5 paralel eşleme | 3 yazıcının dosya-çakışmasız eşlemesi | K-0053 onayı |
| 6 spawn ekonomisi | ölçüsüz varsayım olarak DEĞERLENDİRİLMEDİ (bu tur kapsamı dışı) | önce ölçüm (A0-5 spawn payı) |
| tip-borcu 51→0 | 6 src + 45 test-fake düzeltme dalgası | ayrı dalga fişi; ratchet düşüşle iner |

## İşlenme (K-0017)

Madde işlenme kayıtları JSON sidecar'da (v8-paralel-yazar-hizi-2026-10-28.json);
işlenen 4 maddeye commit hash kapanış commit'inde append edilir (K-0052 deseni:
uygulama commit'i + kapanış commit'i).
