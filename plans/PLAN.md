# PLAN.md (SSOT uygulama plani) — Ordu: Paseo-native, bagimsiz-core, ogrenen ajan ordusu
> Dosya: plans/PLAN.md · Yetkili kopya budur (silinecek-task-graph'teki isaretci). Hedef otoritesi: plans/HEDEF.md · Kanit defteri: plans/kabul.csv

> **Güncel yürütme revizyonu: v2.10.1 — 2026-10-28, üç bağımsız denetimle sonlandırıldı.** Onaylı yön v2.10'daki insan kanıtlı kademeli sıradır; teknik/kanıt ayrıntıları §25.6–25.11'de sıkılaştırıldı. Kararlar: [`ilk ADR`](../kararlar/ADR-demir-cekirdek-kademeli-buyume-2026-10-27.md), [`denetim eki`](../kararlar/ADR-dc-3-denetci-sonlandirma-2026-10-28.md). **Uygulama/canlı/harcama yetkisi YOK; yeniden tahmin bütçesi onay bekler.** §25.3–25.4 sayıları ilk nominal kayıttır; geçerli bütçe yorumu §25.10. Hedef ve invariant'lar korunur. Önceki kopyalar: [`v2.9`](../arsiv/plan-revizyonu-2026-10-27/PLAN-v2.9.md), [`v2.10`](../arsiv/plan-3-denetci-oncesi-2026-10-27/PLAN-v2.10.md).
> **Dikey hizalama (K-0054, [insan] onaylı 2026-10-29):** tüm uygulama iki sacayağına hizalanır (ANAYASA §6): kapsül görev grafı (çerçeve) + manager döngüsü (kalp) — dikey dalga rotası [`DIKEY-HIZALAMA-PLANI`](DIKEY-HIZALAMA-PLANI-2026-10-29.md); bu planın politikası (§25) aynen geçerli.

> Surum: v2.9 KILIT (kapsam) · 2026-10-14 · Durum: ONAYLANDI (K-0034 · 2026-10-25 · karar kaydı: kararlar/K-0034.md — MASTER-SSOT zinciri arşive indi, bu belge tek uygulama otoritesi) — TARIHLI KAYIT - son dis review 85/100 (GO: F0/F1 tasarim+hazirlik, NO-GO: gercek worker) | GUNCEL (2026-10-14): mimari GO; 4-duzeltme paketi islendi; gozetimsiz kullanim bol.22 canli kapilari gecmeden ACIK DEGIL · v2.7: schema/semantik ayrimi (§20.5), cekirdek tek-kural (§19), F7 referans temizligi, receipt ifade duzeltmesi (§18.2) · v2.7.1: 87/100 review tutarlilik patch'i (F7 LOC satiri, §17.3 F3 maddesi, §20.4 temizligi, §15 faz ref'leri) · v2.7.2: T-raporu ayrimlari islendi (§6.1 esleme tablosu, §7 imza tanimi, §16.2 KPI kapilari, §18 P0-4..7, T1/T2 kapsam notlari, regresyon-suite kurali) · ordu-core 102/102 exit 0 (R, 2026-10-14 erken baseline); GUNCEL olcum: 3.499 src + 4.915 test LOC, 252/252 exit 0 (R, 2026-10-14 ~16:45). v2.8: coder review R1-R5 islendi (REVIEW-v2.8-2026-10-14.md). v2.8.1: dis review 7 duzeltme islendi (bol.0 otorite tekillestirme, manager=onerir/derleyici=derler, vekil grant kararlari R3, faz bagimlilik sirasi + F6.5/F8/F9, gozetimsiz giris kapisi bol.22, release senaryolari bol.23, LOC olcum tanimi bol.11)
> v1.0 DURUMU: SUPERSEDED — 3 bagimsiz review 65/64/60 puan verdi, ONAYLANMADI; bu surum 6-subagent derin analiz + review bulgularinin birlesimidir. v1.0 arsiv degeri tasir.
> Hedef otoritesi: plans/HEDEF.md v1.3 (ordu monorepo — eski evi paseo-plugin workspace'i idi, F1'de köke taşındı) — bu plan hedefi degistiremez, hedef kendini kanitlanmis sayamaz. Kullanici hedefi degistirebilir; degisiklik onayli revizyonla (yeni HEDEF surumu + ADR) plana islenir.
> Hiyerarsi: ANAYASA > evrensel sozlesme > BU PLAN > raporlar > konusma.
> Hedef cumle (kullanicidan): 'Gorevi manager ile tanimlarim; ordu kendi ogrenir, test eder, yazar, iyilestirir, teslim eder; ben sadece izlerim. Paseo entegrasyonu derin, bagimliligi sig.'
> Soy: ordu-core (kanitli hat: 102/102 test, A05/A06/A16/A35/A36) · ordu-v3 (kabul.csv 56 kapi + ogrenme bol.) · K-0033 (md-json ikili temsil) · qwen v1.2 (8 kart + frenler) · gpt v3 (scheduler/outbox/receipt) · Kapsul v3 (karantina + casebook) · pano-blueprint (UI dili) · Final (dayaniklilik fikirleri, hijyen borcuyla).

## 0. Yonetisim karari (v1.0'in en buyuk acigi — KAPANDI)

Bu plan dorduncu platform DEGILDIR. Kural:

- **Belge otoritesi (tekillestirildi, v2.8.1)**: HEDEF.md = onayli urun gereksinimleri (NE); PLAN.md = uygulama yontemi (NASIL); kabul.csv = calistirilmis kabul kanitlari (KANITLANDI mi). Eski planlar/kararlar (ordu-v3 SSOT dahil) TARIHCEdir: guncel kararin yerine gecmez, fikir ve kapanis-kaydi kaynagidir. Cakismada yeni onayli revizyon kazanir; sessiz degisiklik YOK. Guvenlik invariant'lari plan degisikligiyle sessizce gevsetilemez (bol.19 kural 4 kapisi).
- **Tek SSOT ilkesi**: K-0000 ('tek plan') ihlal edilmez; K-0034 guncel tek-otorite karariyla uzlasti - bu belge TEK uygulama planidir, ordu-v3 ve diger eski planlar tarihcedir (ustteki belge otoritesi maddesi).
- **Baseline evlat edinme**: ordu-core'un 1.815 LOC + 102/102 testi OLDUGU GIBI devralinir; hicbir kapisi file-SSOT'a veya prose'a GERI ACILMAZ. Yeni mekanizma gerekiyorsa file degil SQLite+test ile yazilir.

## 1. Amac (tek paragraf)

Kullanici Paseo composer'ina dogal dil emir yazar. Manager LLM emri kisitli plan satirlarina boler; deterministik checker'dan gecen plan makine manifestine donusur (degismez calisma sozlesmesi); core servis katman katman spawn eder; her is BAGIMSIZ yesil kapidan gecer (korunan suite, izole ortam, 14-alanli receipt); kirmizida bounded repair, tukenince insan karti; ogrenme hatti kanit toplar ve ancak cift insan kapisindan promote eder. Kullanicinin gunluk yuzeyi TEK pano: 5 sorunun cevabi + Onay kutusu + ACIL DURDUR. Core Paseo'suz yasar; pano pencere, dosya+DB beyin.

## 2. Uc katmanli otorite modeli (v1.0'in 'iki temsil cakismasi' acigi — KAPANDI)

| Katman | Ne | Rol |
|---|---|---|
| Insan yuzeyi | kisitli `plan.md` (K-0033) | duzenlenebilir NIYET/TASLAK; `[x]` tek basina kabul uretemez |
| Makine manifesti | `emirler.json` derlemesi + plan revizyon id | DEGISMEZ calisma sozlesmesi; checker gecmeden append yok (fail-closed) |
| Defter | SQLite (ordu-core: commands/reservations/events/receipts) + JSONL aynasi | GOZLENEN durum ve kanitin otoritesi |

Insan plan.md'yi degistirirse: diff -> checker -> insan onayi -> YENI manifest surumu. Calisan isin scope'u degisirse eski izin ve kanit yeni surume TASINMAZ, ilgili attempt yeniden acilir. Derleyici deterministik olmalidir: ayni md + ayni checker surumu = ayni manifest (byte-esitlik testi F0 kapisinda).

## 3. Cekirdek dongu (degismez tanim)

```
EMIR -> MANAGER onerir, DERLEYICI derler (plan.md -> checker -> manifest vN)
 -> DISPATCH: atomik dispatch (A05) + rezervasyon (A35) + dedupe (A06) [ordu-core, testli]
 -> KOSU: adaptor uzerinden ajan; her adim event append (A16)
 -> VERIFY: bagimsiz evaluator, korunan suite, izole ortam
     -> receipt (14 alan, bkz. §7) imzalanir; coder'in 'PASS' mesaji kabul kaydi OLUSTURAMAZ
     gecti -> bitti; kaldi -> deneme < maxDeneme -> hata ozetiyle bounded retry
     tukendi -> KARAR KARTI -> insan: devam/atla/iptal
 -> DUR: ACIL DURDUR yeni spawn <=5sn keser; istenen != gozlenen ayrimi korunur
 -> OGREN: sprint kapanisi retro -> kanallar -> oneri -> ONAY#1 dene -> ONAY#2 promote
```

## 4. Rol modeli (rol != model != runtime)

| Rol | Cinsi | Yetki siniri |
|---|---|---|
| Manager | LLM (uzun yasayan) | plan onerir (derleme deterministik kodda), atama onerir; butce/izin/kendi brief'ini DEGISTIREMEZ; manifest'e dogrudan YAZAMAZ |
| Vekil | LLM (grant'e bagli) | yalniz grant'inde tanimli kararlari verir (R3, bol.9.2); kendi grant'ini BUYUTEMEZ; grant disi islem RED |
| Coder | worker (izole worktree; worktree sandbox DEGILDIR) | yalniz izinli dizinler; kendi isini kabul edemez; receipt uretemez |
| Tester/Evaluator | deterministik runner + gerektiginde test-tasarim LLM'i | test patch'i AYRI attempt'ta, AYNI korumali kapidan gecer; coder suite'i DEGISTIREMEZ |
| Bekci | kod (sayilar) | butce/izin/kapasite/fence; LLM yalniz haftalik oruntu avinda |

## 5. Durum makinesi (kapali kume)

Gorev: `bekliyor | atanan | kosuyor | testte | bloklu | kapasite-bekliyor | bitti | atlandi | iptal-istendi | iptal-onaylandi`
Attempt (ayri eksen): `spawn-istendi | spawn-onaylandi | kosuyor | iptal-istendi | iptal-onaylandi | bitti | UNKNOWN`

- UNKNOWN'da kor retry YASAK: reconcile (findByCorrelation) -> canliysa beklet, degilse `onar` karti.
- `kapasite-bekliyor` butce/retry YAKMAZ (qwen A5). `atlandi` bagimliyi varsayilan ACMAZ (qwen D4).
- Fence (A35/A36): stale sonuc REDDEDILIR; eski sahibin receipt'i yeni candidate'da gecersiz.
- Teslim ayri eksen (P0-3): `uretildi | dogrulandi | teslim-edildi | kabul-edildi | merge-edildi` — birbirinin yerine kullanilamaz; her gecis receipt ister.

## 6. Adaptor sozlesmesi (KALIN — v1.0'in ince sozlesme acigi KAPANDI)

```
spawn(brief, manifestRef, attemptId) -> handle     # attemptId = idempotency anahtari
findByCorrelation(correlationId) -> handle|null    # kopan spawn'i geri bulma (UNKNOWN cozumu)
gonder(handle, mesaj) ; durum(handle) ; olaylar(handle, cursor)
iptal(handle) -> istek ; iptalTeyit(handle)        # istek != teyit
kullanim(handle) -> {tur: bilinen|tahmini|bilinmeyen, degerler}
fenceToken(handle)                                 # sahiplik/devir; stale receipt reddi
```

Sozlesme ihlali = adaptor kaydi duser, kapi acilmaz. `manifestRef` ile spawn edilen candidate degismezdir; receipt manifest+attempt+evaluator+ortam ile baglidir.

### 6.1 Davranis -> kod eslemesi (T-raporu bulgusu; her satir ayri dogrulanir)

| Plan davranisi | Planlanan metot | Guncel kod metodu | Capability | Negatif test | Canli durum |
|---|---|---|---|---|
| spawn | `spawn()` | F0'da dogrulanacak | spawn | cift-spawn dedupe | hermetik var (A05/A06); canli KANIT-EKSIK |
| UNKNOWN cozumu | `findByCorrelation()` | F0'da dogrulanacak | query | kopma-reconcile | F1'de dogrulanacak |
| iptal | `iptal()` + `iptalTeyit()` | F0'da dogrulanacak | cancel | istek != teyit | F1'de dogrulanacak |
| stale red | `fenceToken()` | F0'da dogrulanacak | fence | stale receipt reddi | hermetik (A35/A36); canli KANIT-EKSIK |
| maliyet | `kullanim()` | F0'da dogrulanacak | usage | bilinmeyen rozeti | F1'de dogrulanacak |
| olay akisi | `olaylar(cursor)` | F0'da dogrulanacak | events | cursor resume | F1'de dogrulanacak |

Kural: kod metodu sutunundaki her isim ordu-core kaynagina bakilarak doldurulur; karsilik yoksa satir 'UYGULAMA-EKSIK' isaretlenir, uydurma metot adi YAZILMAZ.

## 7. Guven zinciri (kabul ancak boyle dogar)

1. Candidate degismez: manifest hash + worktree HEAD receipt'e yazilir.
2. Suite korunur: evaluator sahibi disinda kimse test dosyasina yazamaz (dispatch katinda red).
3. Ortam izole: islem + dizin + ag sinirlari; worktree tek basina sandbox DEGILDIR.
4. Receipt 14 alan (gpt invariants spec'i): candidateHash, suiteHash, evaluatorId, evaluatorVersion, attemptId, environment, startedAt, finishedAt, exitCodes, testCounts (passed>0 sarti), artifacts, fenceToken, correlationId, signature.
5. Sahte-PASS kapisi (A13): exit-0 + sifir test = RED. Coder beyani kantitatif deger tasiMAZ.
6. Signature tanimi: imzalayan = kayitli evaluator anahtari (registration + revoke/rotation politikasi); dogrulayici = core; kapsam = receipt alanlarinin butunu. Imza, dogru-ise baglanma ve sandbox kanitinin YERINE GECMEZ.

## 8. Pano (sade once, uzman sonra)

- **Gunluk gorunum = 3 bolum**: Kapsuller (ne kosuyor/neden bekliyor) · Kararlar (Onay kutusu, kapali 9 kart turu) · Ogrenme (skorcard + oneriler). Teknik detay secili kapsul icinde acilir. Ilk dashboard YALNIZ 5 gosterge: dogrulanmis teslim · gereken karar · butce · takilan/belirsiz isler · kritik ihlaller (§16); 15 metrik alaninin detayi gorev icinde ve benchmark ekraninda acilir — 15 ayri menu YOK.
- **Iki erisim yuzeyi**: (a) Paseo native ince istemci (derin entegrasyon: composer pill, timeline, komut paleti); (b) bagimsiz web (core ayakta oldugu surece Paseo kapaliyken de erisim). Ikisi de ayni read-model'i okur; yazma tek ucu: POST /api/emir + POST /api/karar.
- Durustluk: olu buton YOK; demo veri sari bantli; yazma kapaliyken fail-closed rozet; UNKNOWN ayri durum (kirmizi degil gri).
- 11 ekran/graf = F7 uzman gorunumu; varsayilan DEGIL (v1.0'in UI-oncelik hatasi duzeltildi).

## 9. Otonomi katmani

### 9.1 Mod profilleri
`firtina` (paralel x2, ANCAK owner hard-limit'i asamaz) · `atolye` (varsayilan) · `ekonomi` (paralel 2, token x0.5). Mod kurulumda/gorevde secilir.

### 9.2 Karar karti tur seti (kapali kume — 9 tur)
qwen'in 8'i (`3-kirmizi` · `plateau` · `butce-asimi` · `kapsam-disi` · `yetim` · `izin-sorisi` · `onar` · `acik-bagimlilik`) + **`ogrenme-onerisi`** (ayri sema: kaynak kanit + kapsam + geri-al plani zorunlu). Stale kurali: yeni candidate'da eski kararlar gecersiz, yeniden istenir.

**Vekalet grant modeli (R3)**: vekil 'yalniz oneri' degildir; onceden verilmis grant icindeki tanimli kararlari VEREBILIR. approvals.action kapali kumesine 5 vekil karar tipi eklenir: ANSWER_QUESTION, FALLBACK_MODEL, EXTRA_RETRY, REASSIGN_NODE, MANIFEST_AMEND - her biri ayri yetki, ayri expiry/butce. Vekil kendi grant'ini buyutemez; merge/deploy/harcama/kapsam genisletme grant ile VERILEMEZ (ayri insan yetkisi). Audit'te actor_id ayrimi: 'insan' vs 'vekil:<grantId>'. Kabul: K12-10. Uzlasma (bol.2 insan-onayi kuraliyla): on yetkili, kapsami genisletmeyen manifest degisikliklerini (MANIFEST_AMEND) vekil yapabilir; yetki/butce/kapsam GENISLETME her zaman insan kararina duser.

### 9.3 Butce frenleri
Spawn aninda rezerve (A35); evaluator butcesi AYRI rezerve (%100 zorla-testte toplam ASILAMAZ); %90 durtme; sprint tavaninda yeni spawn stop + tek toplu kart; bilinmeyen kullanim muhafazakar rezervasyonla sayilir, ucretsiz sayiLMAZ.

### 9.4 Ogrenme hatti (birlesik: ordu-v3 4 kanal + Kapsul karantina + gpt L1-L3)
- L1 imzalar: otomatik not, tek basina PROMOTE EDILEMEZ.
- L2 skorcard: tam payda (basarisiz+atlandi+iptal dahil); hesap otomatik.
- L3 retro onerisi: kaynak kanit + repo/suite/surum kapsami zorunlu -> KARANTINA -> eslenmis izole deney (sabit evaluator) -> skorcard -> ONAY#2 promote -> canary ilk 3 gorev = REGRESYON KONTROLU (ustunluk kaniti degil); regresyonda oto-geri-al.
- Oto-eklenen dersler icin: expiry/revoke + veri-talimat ayrimi (Kapsul casebook modeli).
- Basari tanimi durustlugu: '3 sprint maliyet duser' YON VERIR, HUKUM VERMEZ — sprint zorlugu farkliysa nedensellik iddia edilemez; hukum icin eslenmis gorev + sabit evaluator sart.

### 9.5 Hedef-koklu long-runner
Deterministik olcum script'i (ajan kendi metrigini OLCEMEZ) -> worktree deney -> yesil kapi -> kilitle/geri-al; plateau -> insan karti.

### 9.6 Zamanlama + bildirim (gpt v3)
Occurrence = scheduleId+revision+UTC instant (unique); DST kaybolan saat SKIP; kacan is SKIP (catch-up firtinasi YOK); overlap SKIP+neden. Bildirim: durable outbox, dedupe+severity+quiet-hours; LLM poll YOK (heartbeat gizli LLM-poll yasak — ordu-v3 acigi kapatildi).

**Deadline davranisi (R4, bol.9.6 eki)**: baslatma takvimi != son calisma saati (deadline_at). Deadline yaklasirken yeni is/node kabulu durur; test+handoff rezervi ayrilir; deadline dolunca RUNNING attempt'ler checkpoint + insan kartina duser; kalite kapilari sure baskisiyla DUSMEZ. Zaman dilimi ve kesin tarih manifest'te tanimlidir. Kabul: K12-11. Yurutme etkisi: (1) yeni dispatch kapanir; (2) suresi biten grant ile yeni arac islemi REDDEDILIR; (3) tanimli kapanis suresi icinde guvenli checkpoint/iptal yapilir; (4) process durumu uzlastirilir; (5) iptal dogrulanamiyorsa durum UNKNOWN kalir, slot SERBEST BIRAKILMAZ ve is yeniden baslatilmaz. Deadline bildirimi ile gercek deadline uygulamasi AYRI kabul testidir (K12-11 iki alt-test: bildirim + yurutme etkisi).

## 10. Fazlar (fault-once — v1.0 ters cevrildi, v2.6'da fake-adaptor fault tabani gercek worker'in ONUNE alindi)

> **v2.10 sıralama hükmü:** Aşağıdaki F0–F9 tablosu mevcut mimari/kabiliyet ailesini ve tarihsel faz kimliklerini korur. Bugünden sonraki uygulama önceliği ve faz geçişleri §25'teki DC sırasıdır; tarihsel sıra, DC/H1 öncesinde gece modu/paralellik açmak için kullanılamaz.

| Faz | Icerik | Cikis kapisi (kabul.csv ID bagli) |
|---|---|---|
| F0 Baseline saglamlastir | ordu-core devral (102/102 korunur); Final hijyen borcu: manifest regen + schema `local` enum + K1 payload daraltma; md->manifest determinizm testi; LAN §2/§8 celiskisi ADR | mevcut A-kapilari PASS + F0-A: ayni md = ayni manifest (byte-esit) |
| F1 Fault tabani (fake adaptor — gercek worker'dan ONCE) | bounded repair, UNKNOWN reconcile, STOP/restart, cift-spawn dedupe, fence/stale, sahte-PASS reddi, M26/M31 negatif izin | F1-A..G: crash/STOP/UNKNOWN/stale/dedupe/sahte-PASS + negatif izin testleri — hepsi fake adaptorde PASS olmadan gercek worker spawn'i YOK |
| F2 Kontrollu gercek tek kapsul | tek gorev uctan uca: emir -> manifest -> gercek spawn -> receipt -> pano rozet | S1.1 canli PASS + F2-A: receipt 14 alan dogrulandi + F2-B: canli sahte-PASS reddi |
| F3 Canli fault dogrulamasi | kill -9 + STOP restart + reconcile GERCEK worker'da | F3-A/B: canli recovery PASS — bu ikisi olmadan F4'e GIRILMEZ |
| F4 Sade pano | 3 bolum + Paseo ince istemci + bagimsiz web + ACIL DURDUR | F4-A: Paseo kapaliyken pano read 200; F4-B: STOP sonrasi 0 spawn |
| F5 Paralellik + zaman | kapasite modeli, scheduler, outbox, uzaktan erisim (auth'lu) | F5-A: DST/misfire/overlap testleri; F5-B: outbox dedupe; F5-C: canli kapasite + cakisma olcumu |
| F6 Ogrenme + benchmark | §9.4 + §9.5 + eslenmis deney | F6-A: karantina->promote zinciri; F6-B: regresyonda oto-geri-al kaniti; F6-C: eslenmis gorev benchmark raporu |
| F7 Uzman yuzey + 2. runner | 11 sekme, graf, ikinci adaptor (Codex CLI/aider — ayri karar) | F7-A: 11/11 render 0 konsol hatasi (uzman ekran kapisi) + F7-B TAM BAGIMSIZLIK kapisi (runner bu kapiyla teslim edilir; uzman ekranlar F7-B'ye bagimli DEGIL): Paseo'suz START/DECIDE/STOP -> local coder -> protected evaluator -> teslim -> restart/reconcile canli PASS |
| F6.5 Rol->model secimi | nodes.provider kolonu (ADR'li migration, varsayilan ORDU_PROVIDER) + rol/model secim yuzeyi + 3 cikti modu (yalniz cevap / izinli dizin / worktree) + temel rubric | F6.5-A: rol basina farkli provider dispatch canli kaniti + cikti modu testleri |
| F8 Arastirma turnuvasi | 7-adim protokol (bol.21); turnuva yoneticisi ~400-700 LOC (T); round = attempts.number, rubricVersion event payload | K12-01 + K12-02 PASS |
| F9 UI-tester adaptoru | canli UI testi ~300-600 LOC (T); ayri test hesabi + browser profili + tek sahip mouse/keyboard; screenshot tek basina PASS DEGIL | K12-14 + F9-A: senaryo/beklenen/gozlenen + kanit kayitlari |

**Bagimlilik sirasi (v2.8.1 - faz numaralari tarihseldir)**: (1) guvenli tek gorev (F0-F3) -> (2) canli recovery/STOP + temel pano (F3-F4) -> (3) rol/model secimi + cikti modlari + temel rubric (F6.5) -> (4) 5-model arastirma-review-revizyon akisi (F8) -> (5) iki-task izolasyonu (F5-C canli) -> (6) deadline + sinirli vekil + bagimsiz runner (R4/R3/F7-B) -> (7) canli UI tester (F9) -> (8) kanitli ogrenme + uzman ekranlar (F6/F7+).

Kural: kapilar kabul.csv'ye NOT_RUN olarak yazilir; PASS ancak kosulmus komut + exit-0 + artefaktla. PNG/konsol kontrolu tek basina kabul DEGILDIR.

## 11. LOC butcesi (durust, (T))

> Bu bölümün aşağıdaki toplamı tarihsel tam-ürün tahminidir. **v2.10 kalan iş bütçesi §25.4'tedir**; iki toplam birleştirilmez. Eski kapalı modüller yeniden yapılacak iş diye sayılmaz.

| Kalem | Tahmin |
|---|---|
| Devralinan kanitli cekirdek (ordu-core) | 1.815 LOC (hazir, testli) |
| F0-F2 yeni kod + test | ~2.500-4.000 |
| F3-F4 | ~2.000-3.500 |
| F5-F6 | ~3.000-5.000 |
| F7 bagimsiz runner + F7+ uzman yuzey | ~1.500-3.000 (T) |
| F6.5 rol->model + cikti modlari | ~150-300 (T) |
| F8 arastirma turnuvasi | ~400-700 (T) |
| F9 UI-tester | ~300-600 (T) |
| **Tam urun toplam** | **~11.700-18.900** (kalem toplami; v2.6'da F7 eksikti duzeltildi; v2.8.1'de F6.5/F8/F9 eklendi - arastirma turlari ve UI-tester DAHIL) |

Not: 'eklenen LOC' ile 'tamamlanmis urun toplami' ayni sayi degildir; v1.0'in 3.9-6.2k iddiasi savunmasiz kalmisti, bu tablo onun yerine gecer.

**Olcum tanimi (v2.8.1)**: 'devralinan 1.815 LOC / 102 test' 2026-10-14 erken-saat baseline'idir; guncel olcum 3.499 src + 4.915 test, 252/252 exit 0 (R, ayni gun ~16:45). Iki sayi farkli anin olcumudur, celiski degildir. Ayrim sabittir: uretim src != test != UI != adaptor; mevcut olcum ile kalan-is tahmini karistirilmaz. LOC hedef tavani olabilir; guvenlikten taviz gerekcesi OLAMAZ.

## 12. Paseo bagimsizlik tablosu (bilesen bazli)

| Bilesen | Paseo kapaliyken |
|---|---|
| core (dispatch/defter/evaluator) | CALISIR (OS servisi) |
| bagimsiz web pano | CALISIR |
| Paseo native istemci | kapali (beklenen) |
| Paseo worker spawn | DURUR — gozlenemez; var olan attempt UNKNOWN'a duser, reconcile F2'de |
| yerel tool-runner (F7) | CALISIR — tam bagimsizlik bu fazda |

Taahhut: 'Paseo'suz calisir' iddiasi ancak F7'de tam; oncesinde dogru ifade 'Paseo'suz yasar, Paseo'suz uretmez'.

## 13. Yapilmayacaklar (kayitli karar)

DAG motoru YOK · framework/bundler YOK · modal YOK · fine-tune YOK · LLM poll bildirim YOK · ajanin kendi metrigini olcmesi YOK · coder beyaniyla kabul YOK · SQLite'dan file-SSOT'a geri donus YOK · 11 ekrani F3'ten once yapmak YOK. Stack/erisim kilidi (v2.9): TypeScript core + SQLite + ince Paseo baglantisi; LangChain/LangGraph/Paperclip ve upstream fork YOK. Ilk surum local-only; uzaktan erisim ayri yetkilendirilmis kapidan acilir.

## 14. Acik sorular (kullaniciya)

1. K-0034 'alt-plan' roluyle acilsin mi? (Onerilen: evet; ordu-v3'e referansli)
2. F7 ikinci runner adayi: Codex CLI mi, aider mi? (Ayri karar kaydi)
3. Bagimsiz web pano auth modeli: tek-kullanici token yeterli mi, LAN kapali mi?
4. Final hijyen borcu (manifest regen + schema) bu hatta mi kapatilsin, Final'in kendi reposunda mi?

## 15. Soy haritasi ve devralma listesi

| Kazanc | Kaynak | Faz |
|---|---|---|
| 102/102 testli cekirdek (A05/A06/A16/A35/A36) | ordu-core | F0 (oldugu gibi) |
| kabul.csv kapi defteri + ADR disiplini | ordu-v3 | F0 (ID'ler baglanir) |
| ikili temsil (insan md yuzeyi) | K-0033 | F0 |
| 8 kart + stale + kapasite-butce frenleri | qwen v1.2 | F4/F6 |
| scheduler/outbox/14-alan receipt spec | gpt v3 | F1/F5 |
| karantina + casebook + veri-talimat ayrimi | Kapsul v3 | F6 |
| UI dili, dosya-aracili spawn, kapasite modeli | pano-blueprint | F4/F5/F7 |
| dayaniklilik fikirleri (hijyen borcu notuyla) | Final | F0 |

## 16. Metrik katmani (kullanici direktifi, 2026-10-14 — baglayici)

### 16.1 Oncelik sirasi (degismez)
dogru ve guvenli teslim > kesintiden toparlanma > kontrol edilebilir otonomi > paralel hiz > kanitli ogrenme. Ajan sayisi, token/sn ve LOC bunlardan SONRA gelir. Guvenlik/dogruluk kapilari kirmiziysa hiz-maliyet avantaji kazanan sayilmaz.

### 16.2 Ana basari gostergesi
Onceden verilen yetki ve butce icinde, az insan mudahalesiyle uretilen bagimsiz dogrulanmis teslim. Tek 'ordu puani'na sikistirilmaz; 5 gosterge birlikte izlenir:
1. dogrulanmis teslim / saat
2. toplam maliyet / kabul edilen is
3. insan mudahalesi / gorev
4. teslim sonrasi regresyon
5. kritik guvenlik ve dogruluk ihlalleri

Her KPI icin kapi (formul + kaynak + dogrulama testi):

| KPI | Formul | Veri kaynagi | Dogrulama testi |
|---|---|---|---|
| dogrulanmis teslim/saat | tekillestirilmis dogrulanmis teslim (kabul gorev) / duvar saati | receipts tablosu | F6 benchmark raporu |
| maliyet/kabul | toplam usage / kabul | usage event'leri | 'bilinmeyen=ucretsiz degil' testi (F1) |
| mudahale/gorev | tanimli insan eylemi (onay/red/duzeltme) / gorev | karar kayitlari | F2 senaryo ciktisi |
| teslim sonrasi regresyon | kabul-sonrasi hata / kabul | defter | F6 eslenmis deney |
| kritik ihlaller | sayi (sifir hedefi) | bekci log | negatif testler (F1) |

### 16.3 On bes alan (oncelik sirasinda; detay benchmark ekraninda)
| # | Alan | Temel metrikler |
|---|---|---|
| 1 | Dogrulanmis teslim kalitesi | bagimsiz kabul orani · teslim sonrasi regresyon/rework · yanlis PASS sayisi |
| 2 | Yetki ve guvenlik | izin disi islem · butce/kapsam asimi · korunan evaluator mudahalesi · sir sizintisi |
| 3 | Halusinasyon ve kanit dogrulugu | kanitsiz onemli iddia orani · sahte test/kaynak/artefakt · yanlis basari beyani · belirsizligi dogru belirtme |
| 4 | Long-running ve recovery | restart sonrasi dogru toparlanma · kayip is · cift dis etki · UNKNOWN cozum suresi · checkpoint gecerliligi |
| 5 | Izleme ve mudahale | durum gecikmesi · takilmayi fark etme suresi · STOP kayit/teyit suresi · dogru is baglaminda komut · olay izi butunlugu |
| 6 | Otonom calisma | on-yetkili isleri mudahalesiz tamamlama · insan mudahalesi/gorev · gereksiz karar karti · dogru eskalasyon |
| 7 | Manager ve ajan yonetimi | gecerli plan orani · bagimlilik/atama hatasi · kritik yol beklemesi · gereksiz ajan cagrisi · tikaniiklik cozme |
| 8 | Handoff kalitesi | ilk devirde kullanilabilir teslim · eksik bilgi geri donusu · yanlis/eski snapshot · baglam hazirlama maliyeti |
| 9 | Coding gucu | ilk adayda bagimsiz test gecisi · repair sayisi · kapsam disi diff · teslim sonrasi hata · bakim yapilabilirlik |
| 10 | Reasoning gucu | varsayim hatasi · karsi ornek bulma · kisitlari karsilama · kaynak dogrulugu · sabit rubric basarisi |
| 11 | Paralellik ve subagent | ayni kaliteyle kabul edilen is/saat · paralel hizlanma · kaynak verimi · cakisma/rework · kuyruk adaleti · alt ajan gorunurlugu |
| 12 | Schedule guvenilirligi | zamaninda baslatma · duplicate occurrence · overlap ihlali · dogru missed-job · STOP/revoke sonrasi dispatch |
| 13 | Memory ve ogrenme | ilgili+dogru bellek kullanimi · eski/yanlis ders uygulamasi · tekrar eden hata · eslenmis deneyde iyilesme · rollback basarisi |
| 14 | Hiz ve toplam maliyet | dogrulanmis teslim suresi p50/p95 · toplam maliyet/kabul · retry maliyeti · kullanim verisi kapsami |
| 15 | Tasinabilirlik / adaptor | ayni sozlesme testleri farkli runner'da · host yokken core erisimi · degisimde kayip/duplicate · unsupported capability davranisi |

### 16.4 Kimlik zinciri (ic subagent = dis agent, ayni olcum)
parent task -> node -> attempt -> agent/session -> model/runtime -> scope -> usage -> evidence. Alt ajan maliyeti ve hatasi ana gorev toplamina DAHIL. Alt ajan kullanimi gorunmuyorsa 'bilinmiyor' gosterilir; gorunmeyen alt ajan olculmus kapasite gibi SUNULMAZ. Karsilastirma birimi = model + runtime + prompt + araclar + izin + evaluator surumu.

### 16.5 Handoff zorunlu paketi (ajan devri)
amac + tamamlanma kriteri · izinli kapsam + kalan butce · sabit input/candidate surumu · uretilen cikti + kanit baglantilari · kosulan testler + gercek sonuclari · bilinen belirsizlikler/blokajlar · sonraki ajandan beklenen net islem. Butun sohbet gecmisi gondermek iyi handoff DEGILDIR; kisa, surumlu, kanitli paket esastir.

### 16.6 Olcum hatasi kurallari
- Ilk gecis basarisi = ilk adayda gecen gorevler / baslayan gorevler (attempt basarisiyla karistirilmaz).
- Basarisiz ve timeout isler rapordan CIKARILMAZ; devam eden isler ayri gosterilir.
- Bilinmeyen maliyet sifir DEGILDIR (§9.3 muhafazakar rezervasyonla uyumlu).
- Reasoning degerlendirmesi gizli dusunce zincirine degil sonuc+gerekce+varsayim+kanita bakar.
- Memory kaniti farkli zorluktaki sprint karsilastirmasiyla DEGIL, eslenmis gorev + sabit kalite kapisiyla (§9.4 ile uyumlu).

### 16.7 Faz baglantisi
Metrik toplayici F1'de (event'ler zaten defterde; sayaclar buna biner) · 5 gostergeli dashboard F4'te · benchmark/15-alan ekrani F6'da. Hicbir metrik UI'i kapisisiz PASS iddia edemez; metrikler de kanit zincirine (§7) baglidir.

### 16.8 Rubric surumleme (R2)
Rubric kaydi: id + version + domain + olcutler + agirliklar + zorunlu kapilar + degerlendirme yontemi. Manager yeni rubric ONEREBILIR; kabul kapilarini kendi cikarina GEVSETEMEZ. Rubric degisirse ilgili adaylar ayni surumle yeniden degerlendirilir; farkli surumlerin toplam puanlari dogrudan kiyaslanmaz. Kalite iyilesmesi yalniz puan artisiyla ILAN EDILMEZ. Kabul: K12-02.

## 17. Puanlama v3.2 hizalamasi ve canli kanit paketi (2026-10-14)

Kaynak: gpt/TUM-PLANLAR-PUANLAMA-v3.2.md (15 alan agirlikli; raporun kendi tercihi: canli kanitsiz alan tavani 8 — evrensel kural degil, rapor tercihi). MASTER-SSOT 41.3 — zayif alanlarin ortak kokeni CANLI KANIT yoklugu. Kapatma yolu daha fazla tasarim degil, canli kapi kosmaktir.

**Ayrim disiplini (baglayici)**: TASARIM EKSIK (sozlesme tanimlanmamis) != UYGULAMA EKSIK (tasarim var, kod yok) != KANIT EKSIK (kod var, test kosulmamis/incelenmemis) != BASARISIZ (test kalmis). NOT_RUN basarisizlik degildir; production icin yeterli kanit olmadigini soyler. 'Teslim zayif' demek YANLIS; dogrusu 'teslim gucu kanitlanmadi/degerlendirilemedi'. v3.2 puanlari (58.9/56.3...) onceki tasarim puanlariyla (65/64/60) KARSILASTIRILAMAZ — agirlik ve kurallar farkli. Eski inceleme bulgulari guncel kodda dogrulanmadan 'hala kesin var' SAYILAMAZ (ordu-core 102/102 exit 0 ile guncel dogrulandi — R, iki bagimsiz olcum; onceki 51/59/83 iddialari guncel degilmis).

### 17.1 Yedi ortak acik -> kapi eslemesi
| # | Ortak acik | v2.1 karsiligi |
|---|---|---|
| 1 | hicbir pakette canli PASS yok | F2: S1.1 canli tek kapsul (receipt'li) |
| 2 | schedule yalniz tasarim (M08-M10) | F5: occurrence-unique + TZ/DST + misfire canli testleri |
| 3 | handoff paketi hicbir planda sema degil | F1: `handoff.schema.json` — §16.5'in 7 ogesi makine-okunur, dogrulayici testli |
| 4 | memory eslenmis-gorev kapisiz (M13/M14) | F6: eslenmis deney + sabit evaluator kapisi (§9.4) |
| 5 | p50/p95 + maliyet/kabul olcumu yok (M12) | F1 sayaclar + F6 benchmark ekrani |
| 6 | paralel kapasite/cakisma olcumu yok (V3-S3.1) | F5: canli kapasite + cakisma/rework olcumu |
| 7 | dis agent kimlik zinciri tam degil | F1: event semasinda §16.4 zinciri zorunlu alan |

### 17.2 Kullanicinin 3 kritik acigi -> canli guvenlik kapilari
- M26 (izin/symlink) + M31 (capability eksikliginde yazma engeli) -> F1 guvenlik senaryo paketi (fake adaptor).
- kill -9 (V3-S1.2) + STOP restart (V3-S1.4) -> F3 canli recovery; gecis kurali: bu ikisi PASS olmadan F4'e girilmez.
- M32 (Paseo kapaliyken yerel tam dongu) -> F7-B tam-bagimsizlik kapisina bagli; oncesinde dogru ifade §12'deki gibidir ('yasar, uretmez').

### 17.3 Canli test onay paketi (kullanici onayi bekler — kod yazimi degil, mevcut baseline'in kosusu)
1. F0-A: md->manifest determinizm (byte-esit) — yerel, risksiz.
2. F1 senaryolari (fake adaptor: STOP/UNKNOWN/dedupe/fence/sahte-PASS + M26/M31) — izole, risksiz.
3. F2/S1.1: Paseo uzerinden gercek tek kapsul uctan uca — izinli worktree, tek spawn; F1 tamamen PASS olmadan kosulmaz.
4. F3 canli recovery: kill -9 + STOP restart — ancak F2 PASS'ten sonra.
Her kosu receipt + kabul.csv satiri uretir; PASS ancak exit-0 + artefakt + 14-alan receipt ile. Onay gelmeden hicbiri kosulmaz.

## 18. Kapanis listesi (tek liste — kod yeri + kabul testi + gercek kanit + durum)

> **v2.10 güncellemesi:** Eski P kayıtları tarihsel problem/kanıt izidir; yeni sprint kabul kimlikleri DC-S0..DC-S10 olarak aynı kabul defterine yalnız NOT_RUN eklenir. Güncel yürütme sırası §25 ve onun graf projeksiyonudur. Aşağıdaki eski “CANLI KANIT YOK/UYGULAMA-EKSİK” hücreleri yeni bir ölçüm veya kapalı işin yeniden açılması sayılmaz.

Yeni master plan YOK; bu liste tek takip yuzeyi. Kapanis teslim paketi (her satir icin): kucuk diff + gercek test ciktisi + kaynak/test hash + kalan NOT_RUN listesi — 'F1 suite' yazmasi tek basina kapanis kaniti DEGIL; her kapanisin gercek ID'si, sorumlusu ve kanit referansi kabul.csv'ye yazilir. Durum degerleri: TASARIM-EKSIK / UYGULAMA-EKSIK / KANIT-EKSIK / CANLI-PASS.

| ID | Acik | Kod yeri | Kabul testi | Gercek kanit | Durum |
|---|---|---|---|---|---|
| P0-1 | Yetki ve kanit zinciri (coder kendi isini kabul edemez; korunan suite; receipt=candidate+evaluator+ortam+attempt; izin/sir/sandbox sinirlari) | ordu-core dispatcher+evaluator; §7 | M26/M31 negatif izin + A13 sahte-PASS + receipt 14-alan dogrulama | exit-0 + receipt + artefakt | tasarim tam; kod kismen (ordu-core); CANLI KANIT YOK |
| P0-2 | Islem butunlugu ve recovery (cift is yok; ayni-kimlik/farkli-icerik conflict; kopma=UNKNOWN; restart STOP'u unutmaz; stale fence red; belirsiz process slotu serbest birakmaz) | ordu-core store+dispatcher; §5/§6 | A05/A06 dedupe+conflict; kill -9; STOP restart; UNKNOWN reconcile; fence red; slot-release senaryolari | hermetik: 102/102 exit 0 (R, 2026-10-14, node v24.18.0) | kod var + hermetik testli; CANLI KANIT YOK |
| P0-3 | Uctan uca kanitli teslim (gorev->aday->bagimsiz test->receipt->artifact->teslim; 5 teslim durumu ayri) | §5 teslim ekseni (v2.3'te islendi) + F2 | S1.1 canli kapsul + 5-durum ayrimi testi + indirilebilir teslim paketi | receipt + indirilebilir artefakt | tasarim tam (v2.3); UYGULAMA-EKSIK |
| P0-4 | CLI->paseo transport latent shell-enjeksiyonu | ordu-core transport katmani | negatif fixture: metas karakterli payload red | test/paseo-transport.test.ts + test/paseo-adapter.test.ts (P0-4/6c) | kapandi -> GECTI_HERMETIC (kabul.csv P0-4; 296/296 exit 0) — CANLI KANIT EKSIK |
| P0-5 | txDepth global | ordu-core store | ic-ice tx senaryo testi | test/store.test.ts P0-5 + P0-5b + P0-5c | kapandi -> GECTI_HERMETIC (kabul.csv P0-5; 296/296 exit 0) |
| P0-6 | DUPLICATE payloadHash kontrolsuz (ayni kimlik + farkli icerik conflict) | ordu-core store/dispatcher | conflict negatif testi | test/store.test.ts P0-6 + A05-b + contracts.test | kapandi -> GECTI_HERMETIC (kabul.csv P0-6; 296/296 exit 0) |
| P0-7 | sentetik 'recovered:' session id | ordu-core adapter | reconcile'da sentetik-id reddi testi | test/paseo-adapter.test.ts P0-7 (canli transport; fake-yol 'recovered:' etiketi AYRI) | kapandi -> GECTI_HERMETIC (kabul.csv P0-7; 296/296 exit 0) — canli transport lookup kanitli, canli provider rollout NOT_RUN |
| P1-4 | Izleme ve kontrol (gercek!=son-gorulen; STOP istek!=kalici ACK!=iptal teyidi; yanlis kapsul komutu + stale karar reddi; Paseo kapaliyken yetkili kontrol) | F4 read-model + core API + bagimsiz web | F4-A/B + stale-ret + yanlis-kapsul reddi testleri | F4 kapilari | tasarim tam; UYGULAMA-EKSIK |
| P1-5 | Handoff sozlesmesi — soru: tek handoff DTO'su var mi ve yazma yolunda ZORUNLU dogrulaniyor mu? | F1 `handoff.schema.json` (§16.5'in 7 ogesi + 4 asama) + yazma-yolu validator | schema testi + dogrulanmamis yazim REDDEDILIR testi | schema + test ciktisi | tasarim tam (v2.2); UYGULAMA-EKSIK |
| P1-6 | Paralellik ve schedule (kapasite=canli+UNKNOWN rezervasyonlar; izole writer + entegrasyon cakisma kontrolu; tekil occurrence; misfire/overlap/STOP; grant expiry/revoke sonrasi calisma yasak) | F5 | occurrence-unique + DST + misfire + overlap + revoke-dispatch testleri | F5 kapilari | tasarim tam; UYGULAMA-EKSIK |
| P2-7 | Memory guvenilirligi (kaynak/kapsam/surum/expiry; karantina->dogrulama->kullanim; ajan metni politika otoritesi OLAMAZ) | §9.4 | alan-zorunluluk + karantina-zinciri testi | F6-A | tasarim tam; UYGULAMA-EKSIK |
| P2-8 | Eslenmis performans deneyi (ayni gorev/source/evaluator/butce; basarisiz+timeout dahil; ilk-aday != nihai kabul; sure+maliyet+mudahale olculur; canary=erken regresyon kontrolu, ustunluk kaniti DEGIL) | §9.4 + §16.6 + F5 benchmark | eslenmis gorev cifti + sabit evaluator + tam payda raporu | F6-A/B/C + benchmark ciktisi | tasarim tam; UYGULAMA-EKSIK |
| P1-9 | Gozetimsiz calisma giris kapisi (6 kosul; receipt fence != yazma engeli) | bol.22 | K13-01 | canli 6-kosul paketi | tasarim tam (v2.8.1); CANLI KANIT YOK |
| P2-9 | Release senaryo A (arastirma uctan uca) | bol.21 + bol.23 | K13-02 (+K12-01/02) | senaryo kosusu + artefakt | tasarim tam; UYGULAMA-EKSIK (F8) |
| P2-10 | Release senaryo B + C (gece gelistirme + eszamanli izolasyon) | bol.23 | K13-03/04 (+K12-07/08/11/13) | senaryo kosusu + artefakt | tasarim tam; UYGULAMA-EKSIK |

### 18.1 Baglayici gelistirme sirasi
Tek gercek guvenli kapsul -> kill/restart/STOP/UNKNOWN -> kanitli teslim -> iki paralel kapsul -> remote/schedule -> memory/benchmark -> native ayrintilar. Native API kesfi erken yapilabilir; ekran gelistirme P0 kapanislarinin onune GECEMEZ. (Guncel bagimlilik sirasi: bol.10'daki 8-adim sira; bu satir tarihsel ozettir.)

### 18.2 Guncel kod dogrulama kurali
Eski inceleme bulgusu ancak GUNCEL kodda yeniden kontrol edilerek 'acik' yazilir. Guncel dogrulama (2026-10-14, bagimsiz ajan): migration/reopen KAPALI (user_version + restart testi) · idempotency conflict KAPALI (UNIQUE + command_id_conflict, A05-b yesil) · dispatcher claim KAPALI (SENDING/UNKNOWN/reconcile, U1-U7) · receipt hash butunlugu DOGRULANDI (hash bagimsiz hesaplandi, MATCH); kaynak ve dogru-is baglari ACIK (F1 receipt-link calismasi). AYRIM NOTU: 'idempotency conflict kapali' = ayni anahtarin ikinci kaydi engelleniyor; ACIK kalan = ayni kimlik/FARKLI icerik (payloadHash) karsilastirmasi kontrolsuz + receipt hash eslesmesi evaluator kaynagini ve dogru-is bagini TEK BASINA kanitlamaz (kaynak/bag dogrulamasi F1 negatif-yol testlerinde). 102/102 gecis bu negatif yollarin sinandigini GOSTERMEZ. Dort acik §18 tablosunda ayri satirlara tasindi (P0-4..P0-7; sahip/test/kapanis kaydi orada). T1 kapsam notu: onceki core'da kapali DTO + yazma-yolu shape kontrolu VAR ama bu v2.7 4-asamali tam-semantik handoff'un uygulandigi anlamina GELMEZ (P1-5 UYGULAMA-EKSIK kalir). T2 kapsam notu: schedule saf-mantik testleri gecmis olsa bile DB/supervisor entegrasyonu eksikse 'calisan scheduler' SAYILMAZ.

## 19. Donmus cekirdek + halka modeli (buyume mimarisi — baglayici)

Cekirdek (ordu-core: store + dispatcher + evaluator + event log; 102/102 kanitli) DONMUSTUR. Guc cekirdegi buyutmekten degil, etrafindaki 4 halkadan gelir:

| Halka | Ne | Guc kaynagi | Ornek |
|---|---|---|---|
| 1. Adaptorler | §6 kalin sozlesmeyi uygulayan runner | icra gucu | Paseo, ham-LLM, yerel tool-runner, ileride Codex CLI/aider |
| 2. Projeksiyonlar | event log'u append-only okuyan saf read-model | zeka/gorunurluk | pano gorunumu, skorcard, kapasite haritasi, §16 metrikleri |
| 3. Politika plug-in'leri | cekirdek 'izin verildi mi?' diye sorar; karar disaridan | kontrol gucu | bekci kurallari, mod profilleri, 9 kart turu, butce frenleri |
| 4. Yuzeyler | ayni read-model'i okuyan istemciler | erisim gucu | Paseo ince istemci, bagimsiz web, CLI |

### 19.1 Bozulmayi onleyen 4 kural
1. Yeni yetenek = yeni halka elemani; cekirdek degisimi YALNIZ kural 4 kapisindan gecer.
2. Event turleri append-only genisler; eski tur asla degismez (replay kirilmaz).
3. Her halka kendi test paketiyle gelir; her merge'de GUNCEL zorunlu regresyon suite'i yesil kalmali (su an 102/102; sayi degisebilir) — kanit paketi: kaynak hash + komut + ortam + tarih + sonuc raporu birlikte; bozulursa merge olmaz. Yeni sonuc eski tarihli kaniti geriye donuk DEGISTIRMEZ.
4. Cekirdek degisikligi tek yolla: ADR + once kirmizi test + kontrollu migration. Donmus olan KOD DEGIL; invariant'lar + geriye-uyumluluk sozlesmesidir — yeni grant/schedule/receipt bagi migration ile eklenebilir.

### 19.2 Faz eslemesi

F0-F3 cekirdek+adaptor halkasi (fault-once) · F4 yuzey halkasi · F5 politika+adaptor genislemesi · F6-F7 projeksiyon+yeni adaptor. Fazlar cekirdek diff'ini EN AZA indirgeyecek tasarlandi; §18'deki core aciklarinin (P0-4..P0-7) kapanisi core diff'i GEREKTIREBILIR — hepsi kural 4 kapisindan: invariant'lar korunur, ADR + negatif test + kontrollu migration.

## 20. Delegasyon ve brief standardi (6 alan — baglayici)

Her subagent/worker spawn'i 6 alanli brief ile yapilir; brief ve handoff ayni sozlesme AILESINDEN ama ayni icerik DEGIL: stage-discriminated DTO — PREPARE (spawn oncesi: hedef/sinir/butce zorunlu; candidate/receipt henuz YOK) · PRODUCE (+izinli kapsam) · VERIFY (+sabit candidate + gercek test sonuclari) · DELIVER (+receipt + artefakt). Her asamada zorunlu alanlar farklidir; sema `handoff.schema.json` (§17.1#3) bu dort asamayi tanimlar.

| # | Alan | Sart |
|---|---|---|
| 1 | Hedef | tek cumle, olculebilir tamamlanma kriteriyle |
| 2 | Cikti formati | dosya yolu + sema (rapor mu, patch mi, receipt mi) |
| 3 | Arac/kaynak | izinli komutlar + dizinler + cerceve (izin disi her sey deny-default) |
| 4 | Gorev siniri | 'ne YAPMAMALI' acik liste (or: dosya degistirme, commit atma, baska repoya dokunma) |
| 5 | Kabul kriteri | bitmis sayilmasi icin gereken kanit (exit-0 + artefakt + receipt) |
| 6 | Tahmini butce | tur/token/duvar-saati tavani; asimda dur + kart |

### 20.1 Ret kapisi
6 alandan biri eksikse dispatcher spawn'i REDDEDER (fail-closed) — eksik alan hangisiyse onu soyleyen `brief-ret` olayi deftere duser. Manager eksik brief uretirse bu manager hatasi olarak skorcard'a (§16.3#7) yazilir.

### 20.2 Brief != sohbet dokumu
Brief kisa, surumlu, kanitli pakettir (§16.5 ile ayni ilke). Butun baglami yapistirmak YASAK; isaretci prensibi (yol + ozet) kullanilir.

### 20.3 Ornek (6 alan, dolu)
hedef: 'X paketini v3.2 cercevesiyle puanla' · cikti: raporlar/plan-analiz/<ad>.md, sema: alan tablosu+toplam+3 acik+hukum · arac: salt-okur + npm test, dizin: yalniz hedef paket · sinir: dosya degistirme, commit yok, baska repo yok · kabul: tum alanlar skorlu + iddialar dosyadan dogrulanmis + exit-0 kanitli testler · butce: ~8 tur / 60k token.

### 20.4 Asama x zorunlu bag alanlari (semantik baglar)

| Asama | Zorunlu bagli alanlar |
|---|---|
| PREPARE | runId · parentTask · scope · grant (budget+expiry) · evaluatorId+surum — candidate/receipt henuz YOK |
| PRODUCE | + attemptId · candidateRef (baglandiktan sonra degismez) · izin snapshot'i |
| VERIFY | + candidateHash (sabit) · suiteHash · environment · gercek test sonuclari |
| DELIVER | + receiptId · artefakt yollari · receipt = candidate+evaluator+attempt+environment bagli |

Capraz baglar store/domain dogrulayicisinda kontrol edilir (schema'ya yazilmaz — §20.5): receipt.attemptId = attempt.id · attempt.candidateHash = candidate.hash · attempt.grantId = grant.id · grant.scope kapsar attempt.scope · evaluator-suite eslesmesi registry uzerinden (evaluatorRegistry[id, surum].suiteHash == receipt.suiteHash). Dogrulanmayan asama gecisi REDDEDILIR.

### 20.5 Schema != semantik dogrulama (uc katman — review bulgusu 1)

- **JSON Schema**: alanlar, tipler, asama zorunluluklari. Bundan fazlasini TASIMAZ.
- **Store/domain**: iliskili kayit varligi, guncel candidate, scope kapsamasi, grant expiry/revoke, fence — schema'ya yazilamaz, store sorgusuyla dogrulanir.
- **Guven siniri**: receipt'in gercek korunan evaluator'dan geldigi + artefakt byte/hash dogrulamasi.

Receipt tam bagi (birlikte kontrol): run / attempt / candidate / evaluator / environment / plan-policy / grant / fence. Kayit denklemi: `evaluatorRegistry[id, surum].suiteHash == receipt.suiteHash`. Bes iliski bulunmasi yeterli DEGIL; tamami eslesmeli.

## 21. F8 arastirma turnuvasi - 7 adimli protokol (R1)
1. Bagimsiz uretim: ilk cevaplar diger ajanlara KAPALI.
2. Surumlu kayit: model/runtime, brief, kaynaklar, cikti surumu deftere.
3. On kontrol: eksik alan, uydurma kaynak, kanitsiz iddia isareti.
4. Capraz review: SABIT surumler salt-okur; review ciktisi = olcut puani + gerekce + kanit referansi + kritik itiraz + kapatma deneyi + belirsizlik.
5. Revizyon: her ajan yalniz KENDI yeni surumunu uretir.
6. Yeniden degerlendirme: ayni rubric surumuyle (bol.16.8).
7. Sentez + bagimsiz son inceleme: bagimsiz degerlendirme olmadan basari ilan edilemez.

Round katmani (v2.9 duzeltmesi): round != attempt. Kimlik zinciri: taskId -> runId -> roundId -> nodeId -> attemptId. Yeni tablo ZORUNLU DEGIL; roundId mevcut kayitta alan veya tipli metadata olarak kalici, sorgulanabilir ve review/cevap surumleriyle baglidir. Ayni turdaki farkli modeller ve retry'lar karismaz: arastirma turu round=2 iken API retry attempt=3 olabilir; ikisi ayni sayi DEGILDIR. Ajan uzlasmasi dogruluk kaniti DEGILDIR. Kor review uygulanabilirligi ayrica degerlendirilir; mutlak tarafsizlik garantisi IDDIA EDILMEZ.

## 22. Gozetimsiz calisma giris kapisi (v2.8.1)
'Gece calistir' modu ancak su 6 kosulun canli kanitiyla acilir (K13-01): (1) worker durumu/sahipligi uzlastirilabiliyor (reconcile canli PASS). (2) iptal dogrulanmis (STOP -> kalici ACK -> gercek iptal teyidi). (3) kullanim olculuyor veya muhafazakar sinirlandirilabiliyor (bol.9.3). (4) dosya/shell sinirlari gercekten uygulaniyor (M26/M31 canli negatif PASS). (5) grant expiry/revoke calisan ise etki ediyor. (6) handoff sonrasi eski sahip YAZAMIYOR - receipt fence yazma engeliyle ayni sey DEGILDIR (K12-08). Kosullar saglanamiyorsa runtime 'gozetimsiz kullanilamaz' rozeti tasir.

## 23. Release kabul senaryolari (v2.8.1 - fonksiyon testlerine EK, uctan uca)
Senaryo A - Arastirma: 5 bagimsiz model -> kayit -> ortak rubric -> capraz elestiri -> revizyon -> yeniden degerlendirme -> kanitli sentez (K12-01/02, K13-02). Senaryo B - Gece gelistirme: secili coder/tester -> gercek test -> kontrollu API kesintisi -> handoff -> eski sahibin engellenmesi -> deadline'da guvenli kapanis (K12-07/08/11, K13-03). Senaryo C - Eszamanli izolasyon: A ve B ayni anda; cikti, yetki, karar, butce KARISMAMALI (K12-13, K13-04). PASS ancak kosulmus komut + exit-0 + artefakt ile.

## 24. R6-R9 tanimlari (HEDEF referanslari)
- R6: command.kind/Event.type kapali kumesine ekleme YOK (sync-baseline).
- R7: uc cikti modu - F6.5 kapsamina alindi.
- R8: gorunmeyen alt ajan kabul kurali - 5 sart (kimlik+ana gorev, yetki bagi, kullanim olcumu, yasam durumu uzlastirma, iptal+sahiplik) yoksa gozetimsiz dispatch RED (K12-12).
- R9: gorev-turune gore kabul - ortak receipt zarfi + goreve ozel payload (arastirma/kod/UI); schema bicimi dogrular, semantik baglar ayrica denetlenir (bol.20.4/20.5).

## 25. v2.10.1 — İnsan kanıtlı demir çekirdek ve kademeli büyüme (ONAYLI YÖN, DENETİMLİ AYRINTI)

### 25.1. Otorite ve onayın kapsamı

Kullanıcının “evet bu şekilde yapalım” onayı mevcut ana planın kontrollü revizyonuna yöneliktir. İkinci aktif plan kurulmaz. Karar kaydı: [`ADR`](../kararlar/ADR-demir-cekirdek-kademeli-buyume-2026-10-27.md). Önceki sürüm/graf/senaryo [`tarihçede`](../arsiv/plan-revizyonu-2026-10-27/README.md) korunur.

- **Plan onaylı; uygulama başlatılmadı.** İlk planlanan paket DC/F0–F1'dir. Kod işine başlama, canlı sağlayıcı/harcama, kontrollü süreç sınaması, süreli otomasyon, nihai kabul ve sürüm/tag ayrı insan kapılarıdır.
- Hedef, güvenlik invariant'ları, onay yetkisi, R6 kapalı kümesi ve donmuş çekirdek değişim protokolü korunur. Bu revizyon çalışma zamanı davranışını değiştirmez.
- Makine görev seçimi [`görev grafiğinden`](gorev-grafigi-2026-10-26.json), insan görünümü [`senaryo ikizinden`](GOREV-GRAFIGI-SENERARYO-2026-10-26.md) okunur. İkisi bu planın projeksiyonudur; JSON üstünlüğü yalnız kendi MD ikiziyle veri uyuşmazlığı içindir, plan politikasını aşamaz.
- DC/S0 gösterimi grafikte **DC-S0** kimliğidir. Eski S0/S1/A4 kimlikleriyle birleştirilmez. Eski kapalı işlerin kabulü ve kanıt metinleri aynen korunur.
- Önceki [`taslak`](DEMIR-CEKIRDEK-KADEMELI-BUYUME-TASLAK-2026-10-27.md) revizyonun tarihsel gerekçesidir; bağımsız çalışma otoritesi değildir. Rapor önerisi bir yetenek kapanış kanıtı sayılmaz.

### 25.2. İlk ürün ve değişmez güven sınırı

**H1 teslimi:** Tek operatör, tek kanıtlı yerel sağlayıcı, tek işçi ve insan onaylı hedef/kaynak/izin/test/bütçe. Günlük kod yolunda korunan gerçek görev testleri, dondurulmuş aday ve tam makbuz bağı; final kabulü insanın.

Somut pilot **Görev Defteri CLI**: ayrı Git deposunda ekleme/listeleme, kalıcılık, tamamlama, durum filtresi ve doğru istatistik. Ordu defteri veya ikinci orkestrasyon otoritesi değildir. Üç ayrı teslim: kullanılabilir ilk sürüm → önceki sürümü bozmayan özellik → bağımsız regresyon testli düzeltme/değişiklik. İnsan terminalden gerçekten kullanır; üç teslim genel başarı olasılığı kanıtı değildir.

**Önkoşul:** Worktree sandbox değildir. Uygulanabilir işçi sınırı, işçiden korunan değerlendirici ve gerçek kullanım kaynağı veya bağımsız uygulanabilir muhafazakâr limit DC/S0'da doğrulanmadan canlı pilot açılmaz. Bunlar yoksa durulur, altyapı ve bütçe ayrıca onaya çıkarılır.

İlk üründe çoklu proje/paralellik, yeni pano/uzak erişim, sağlayıcı genişletmesi, beş model turnuvası, otomatik yeni hedef, otomatik kural yayımlama, final kabulü, merge/deploy yok. Pilotun alternatif dosya-kuyruğu başlatması kapalı/reddedilir; core STOP'unun eklentiyi kendiliğinden durdurduğu varsayılmaz.

### 25.3. Bağlayıcı faz/sprint ve kanıt kapıları

> Faz kapsamı korunur. **Gerçek geliştirme sırası DC-S0a → ayrı dar izin → DC-S0b → DC-G0 → DC-S1 → DC-S3 → DC-S2 → DC-S4 → DC-H1**; devamı DC-S5/S6 → H2 → DC-S7/S8 → H3 → DC-S9/S10 → H4. S3'ün S2'den önce gelmesi süreç/yazma kapanışı olmadan aday mühürleme iddiasını engeller; kimlikler yeniden numaralanmaz. Aşağıdaki LOC sütunları ilk nominal kayıttır, denetim sonrası yeterlilik taahhüdü değildir (§25.10).

| Faz | Sprintler | Çıkış ve sonraki faza koşul | Ek teknik LOC (T) |
|---|---|---|---:|
| DC/F0 — Taban ve sınırlar | DC/S0 | Kaynak/ortam/süit tabanı; negatif test; pilot kabulü; G0 insan onayı ve uygulanabilir izolasyon/ölçüm | 220 |
| DC/F1 — İnsan yönetimli sağlam ürün | DC/S1–S4 | H1: üç somut teslim; korunan test; on hata ailesi; insan kabulü | 3.760 |
| DC/F2 — Sabit plan otomasyonu | DC/S5–S6 | H2: onaylı plan otomatik ilerler/onarır veya limitte durur; final insan kabulü korunur | 1.940 |
| DC/F3 — Stratejik öneri ve öğrenme | DC/S7–S8 | H3: gerçek alternatif strateji ve sabit bütçeli gizli görev deneyi; plan/kural onayı insanın | 1.900 |
| DC/F4 — Yetki içi deterministik iyileştirme | DC/S9–S10 | H4: korunan oracle ve sonlu terfi basamakları; gerileme kontrolü; temsili kampanya ve ayrı sürüm kararı | 2.160 |
| **Toplam** | **11 sprint** | **Önceki kapı + yeni faz için ayrı insan emri olmadan ilerleme yok** | **9.980** |

| Sprint / kabul kimliği | İş ve kabul koşulu | Teknik LOC (T) |
|---|---|---:|
| DC-S0 | Güncel taban/kimlikler; kırmızı testler; ADR/kabul; izolasyon ve kullanım kaynağı fizibilitesi. İmkânsız varsayımda canlıya geçmeden yeniden tahmin. | 220 |
| DC-S1 | Tam sözleşme onayı ve doğru kaynak sabitleme; yanlış kaynak/onaysız/alternatif pilot başlatma reddi; eski kayıtları yeniden hashlememe. | 880 |
| DC-S2 | Gerçek bağımsız test ve makbuz bağları; yanlış çıktı/sıfır test/değiştirilmiş test/bayat aday reddi. | 780 |
| DC-S3 | Deneme bazlı iptal/ölüm teyidi, yeniden açılış, dürüst kullanım, STOP ve gerçek deadline; belirsizlikte slotu hayalen bırakmama. | 1.020 |
| DC-S4 | Üç pilot teslimi, insan kara-kutu kullanımı, kanıt dışa aktarımı ve izole geri dönüş tatbikatı. | 1.080 |
| DC-S5 | Mevcut deftere bağlı kalıcı sabit-plan sürücüsü: hazır işi gönder → adayı bul → korunan test → kayıt → sıradaki iş; yeni otoriter DB yok. | 980 |
| DC-S6 | Mevcut sınırlı onarımı gerçekten çağır; hata başına tek karar, bildirim, deneme/süre/kullanım tavanı. Ayrı onaylı 30 dk ve en fazla 2 saat hazırlama penceresi. | 960 |
| DC-S7 | Durum hücresi yenilemekten farklı görev/bağımlılık/strateji önerisi; deterministik kapsam/bütçe denetimi ve insan onaylı revizyon. | 880 |
| DC-S8 | Sonraki görevde ders kullanımı; ders açık/kapalı gizli görev kıyası; hata tekrarı; altın set, bağımsız çift sayım ve canary/geri-al. Faydasız ders dürüstçe reddedilebilir. | 1.020 |
| DC-S9 | Sabit hedef/oracle ve yetkili sonlu eşik basamakları; yeterli kanıtla yükselt, aksi durumda bekle/onar/geri-al; normalize karar tekrarı. | 900 |
| DC-S10 | Ön-kayıtlı temsili kampanya, görev düzeyinde analiz ve kanıt denetimi; başarılı tamamlanma/güvenli duruş/müdahale ayrı; koşullar sağlanmazsa NO-GO. | 1.260 |

Graf geçişleri DC-G0 (DC-S0 sonrası), DC-H1 (DC-S4 sonrası), DC-H2 (DC-S6 sonrası), DC-H3 (DC-S8 sonrası), DC-H4 (DC-S10 sonrası) insan kanıt kapılarıdır; kapı düğümlerinin LOC'u 0'dır. Her kapı kendi sprint kabul kayıtları ve insan kararıyla geçer; plan metninin varlığı kapıyı kapatmaz.

H1'in on hata ailesi: yanlış çıktı, sıfır test, işçi ölümü, yönetici ölümü, çift gönderim, STOP/yeniden açılış, teyitsiz iptal, eski sahip yazısı, yanlış repo/commit, eksik/aşan kullanım. Yalnız son yeşil tekrar seçilmez; bütün tekrarlar kanıtlıdır.

### 25.4. İlk nominal iş bütçesi (T; tarihsel taban, yürütme taahhüdü değil)

| Sprint | Yeni Ordu kaynak | Değişen Ordu kaynak | Ordu test | Pilot kod | Pilot test | Teknik toplam |
|---|---:|---:|---:|---:|---:|---:|
| DC-S0 | 60 | 0 | 160 | 0 | 0 | 220 |
| DC-S1 | 220 | 180 | 480 | 0 | 0 | 880 |
| DC-S2 | 200 | 140 | 440 | 0 | 0 | 780 |
| DC-S3 | 240 | 180 | 600 | 0 | 0 | 1.020 |
| DC-S4 | 80 | 100 | 300 | 320 | 280 | 1.080 |
| DC-S5 | 360 | 100 | 520 | 0 | 0 | 980 |
| DC-S6 | 240 | 100 | 460 | 60 | 100 | 960 |
| DC-S7 | 300 | 100 | 480 | 0 | 0 | 880 |
| DC-S8 | 360 | 100 | 560 | 0 | 0 | 1.020 |
| DC-S9 | 300 | 80 | 520 | 0 | 0 | 900 |
| DC-S10 | 220 | 160 | 600 | 80 | 200 | 1.260 |
| **Toplam** | **2.580** | **1.240** | **5.120** | **460** | **580** | **9.980** |

| Kümülatif kilometre taşı | Ordu uygulama/değişiklik | Ordu test | Ayrı pilot kod/test | Teknik | Yüzde 35 rezervli | Doküman ayrıca |
|---|---:|---:|---:|---:|---:|---:|
| H1 | 1.400 | 1.980 | 600 | 3.980 | 5.373 | 400 |
| H2 | 2.200 | 2.960 | 760 | 5.920 | 7.992 | 540 |
| H3 | 3.060 | 4.000 | 760 | 7.820 | 10.557 | 720 |
| H4 | 3.820 | 5.120 | 1.040 | 9.980 | 13.473 | 920 |

LOC fiziksel iş tahminidir: değişen satır sprint başına bir kez sayılır; tekrar değişmesi yeniden iş maliyetidir, net depo büyümesi değil. Test LOC test adedi değildir. Mevcut çalışan modüller yeniden yazım diye, eski grafın açık bütçesi de ikinci kez toplama eklenmez. Göç/betik kaynak tahminine dâhil; üretilen log/veri ve doküman teknik toplam dışında.

Yüzde 35 rezerv olasılıksal güven aralığı veya garantili tavan değil. İzolasyon, gerçek kullanım kaynağı, R6 değişikliği veya kapsam varsayımı bozulursa dur ve yeni tahmini onaya sun. Sprint nominali/rezervi kalite düşürme gerekçesi değildir. LOC'tan teslim tarihi veya sağlayıcı harcaması türetilmez.

### 25.5. Eski işlerin devralınması ve uygulama disiplini

Eski T0/S1/S7/A1/A2/A3/A0-2/A0-3/A0-5 kapanışları korunur. Eski A4, H1 öncesi seçilemez; kapsamı DC-S5/S6'da karşılanır. Eski açık senaryo, metrik ve pano işleri yeni DC işlerine yönlendirilir veya açıkça ertelenir; sahte kapanış ve çifte LOC yok. Yeni sprint satırları aynı kabul defterinde NOT_RUN; kapılar insan kanıt kararlarıdır.

İlk kritik yolda bir yazıcı, ayrı tester ve salt-okur denetçi. Her atomik iş en fazla üç mevcut dosyaya dokunur; sprintin toplam dosyası bu sınırla karıştırılmaz. Yeni yetenek yeni halka + ince kancadır. Çekirdeğe dokunma §19'daki ADR/negatif test/uyumluluk kapısına tabidir; bu yönetişim ADR'si tek başına teknik çekirdek değişim onayı değildir.

Her merge'de güncel tam regresyon ve değişen bileşenin tam süiti gerekir; geçmiş test sayısı yeni ölçüm yapılmış gibi sunulmaz. Kullanıcının çalışan süreç/portlarına dokunulmaz. Yetki, hedef, oracle veya bütçe ajan tarafından genişletilmez; kabul/tag/merge/deploy ayrı insan kararlarıdır. Rapor ve taslağın ana plana aktarılması ürün puanını veya mevcut kabul durumlarını iyileştirmiş sayılmaz.

### 25.6. S0a/S0b — Keşif, izin ve gerçek sınır kanıtı ayrı teslimlerdir

Üç salt-okur denetimin kararları ve ana ajanın karşı örnekleri [`denetim paketinde`](../raporlar/plan-3-denetci-2026-10-27/OZET.md) bulunur. Bu plan düzeltmeleri **ürün kodundaki açıkların giderildiği anlamına gelmez**.

- **DC-S0a:** Salt-okur envanter, tehdit modeli, seçili Windows mekanizması, kullanım kaynağı ve kalıcı veri yerleşimi teknik ADR önerisi. Mevcut 220 LOC nominali gerçek izolasyon kurulmuş gibi kullanılamaz. Konfigürasyon/worktree varlığı G0 geçirmez.
- **Ara izin:** İnsan, sağlayıcısız zararsız fixture ile yapılacak OS/süreç/dosya sınamasının tam kapsamını ayrıca onaylar. Bu denetim veya planın onayı bu izni vermez. Kod/göç uygulaması yine ayrı başlatma ve teknik ADR ister.
- **DC-S0b:** Hazır sınırın gerçek seçili ortamda olumlu/olumsuz kanıtı: işçi ve aday kodunu çalıştıran test süreci core DB/onay kanalı/korunan suite/evaluator anahtarı/kullanıcı evi/ortak Git yönetim alanına erişemez; izinli pilot alanına yazabilir. Miras ortam, junction, üst dizin, çocuk süreç ve ağ/kimlik bilgisi kaçışları denetlenir. Test süreci güvenilmeyen adayı içe aktarır; imzalayıcı/operatör yetkilerini miras alamaz.
- **G0:** Keşif önerisi, dar sınama izni ve davranışsal kanıt ayrı referanslarla insan tarafından kabul edilir. Hazır mekanizma veya bağımsız tüketim sınırı mümkün değilse durulur; genel VM/sandbox/kota aracısı bu bütçeye gizlenmez. Gerçek sağlayıcı yolu S3/S4'te ayrı canlı/harcama kapısından geçer.

S0a/S0b aynı DC-S0 makro sprintinin atomik adımlarıdır; yeni genel başarı veya ek PASS satırı değildir. Teknik ADR kalıcı bağların aynı core defteri/göçte mi yoksa zorunlu doğrulanan artefaktta mı yaşayacağını belirlemeli; ikinci otoriter orkestrasyon DB'si yok. Yeni CLI fiili yeni kapalı command/event türü demek değildir; R6 değiştirmek ayrı politika kararıdır.

### 25.7. S1 ve S2 — Kimlik, operatör ve bağımsız kanıtın tek sözleşmesi

**S1'in atomik işleri:** (a) sürümlü kanonik tam sözleşme ve geçmiş okuma, (b) doğrulanmış repo/Git nesnesini çalıştırıcıya taşıma, (c) pilot için bütün alternatif operasyonel girişleri kapatma ve operatör kimliği sınırı.

Tam sözleşme hedef, gerçek repo, Git nesne algoritması+commit/tree, izin, çözülmüş sağlayıcı/model, gerçek suite/evaluator/politika kimliği, bütçe/deadline ve sürümü bağlar. SHA-1/SHA-256 Git nesnesi ile sözleşmenin SHA-256 özeti ayrı alanlardır; yalnız biçim doğrulaması kaynak kanıtı değildir. Onay sonrası HEAD ilerlese de onaylı nesne açılır. Eski onay/kanıt yeniden hashlenmez ve daha geniş sözleşmeye sessiz taşınmaz; uyumluluk fixture'ı gerekir.

**İnsan etiketi kimlik değildir.** İşçi bağlamından insan aktör adıyla approve/decide/resume/grant yaratma reddedilmeli; gerçek operatör aynı yetkili yüzeyi kullanabilmeli. Pilot kapsamındaki dosya-kuyruğu tüketicisi yanında manager/emir, plan-uygula ve diğer operasyonel girişler envantere girer. Yalnız bir dosyayı kaldırmak yeterli değildir; diğer kullanıcı projeleri izinsiz kapatılmaz. Statik graf bayrağı veya kilit simgesi bu OS/IPC/operatör sınırının yerine geçmez.

**S2'nin değişmez adayı:** S3'ün normal bitiş/yazma kapanışı sözleşmesinden sonra işçi ve alt süreçlerin aday üzerinde yazma yetkisi kalmadığı kanıtlanır. Güvenilir süreç commit/tree, izlenmeyen dosya politikası ve içerik baytlarını mühürler; test için salt-okur doğrulama kopyası kurar. Kimlik/fence/izin/test sürümü yürütmeden **önce**, içerik tekrar **sonra** kontrol edilir. Test edilen baytlar teslim edilen baytlardır; rapor özeti disk baytlarından yeniden üretilir.

Korunan suite ve runner gerçek testleri yürütür; işçinin bastığı pozitif JSON sayacı tek başına test oracle'ı değildir. Doğrulama makbuzu run+attempt+aday+tam sözleşme+evaluator/suite+ortam+grant/fence bağlarını zorunlu ve tek kapıda denetler; imza/yetkili üretici doğrulaması opsiyonel bırakılamaz. Muhakeme/örnek makbuzu yerine geçmez. Aynı içerik özeti başka run veya attempt'in PASS kanıtını kullanmaya izin vermez; gerçek evaluator kimliği kayıtlı kanıtın evaluator kimliğiyle de eşleşir.

**S1/S2 kabulü:** Her sözleşme alanını tek tek değiştirince eski onay reddi; yanlış repo/nesne; sahte insan aktörü; diğer pilot başlatma girişi; sıfır test/sahte protokol; değişmiş suite/runner/aday; yanlış attempt/run/ortam/evaluator; eksik/revoke imza; geçersiz/bayat zaman/fence ayrı negatiflerdir. Başlangıçta bayat girdiyle runner hiç çağrılmamalı. Pozitif küçük kod işi de aynı kapıdan geçmelidir.

### 25.8. S3 ve S5/S6 — Yaşam, kullanım ve kalıcı kontrol döngüsü

**S3 sırası:** OS süreç kimliği ve bitiş/aday sonucu → kullanım mutabakatı → STOP/deadline/grant ve yeniden açılış entegrasyonu. PID tek başına sahiplik değildir; OS oluşturulma kimliği, süreç ağacı ve attempt/sahiplik nesli kalıcı bağlanır. Başkasının yeniden kullanılan PID'si öldürülmez. Normal başarılı exit, hazır aday, çökme, iptal isteği, ölüm teyidi ve UNKNOWN ayrı sonuçlardır. Normal bitişin yoklamada peşinen FAILED'a dönüşmesi ve READY/PENDING etiketi uyuşmazlığı kabulü geçemez.

Lease dolması, sessizlik veya TIMEOUT_UNCONFIRMED **ölüm teyidi değildir**. Eski süreç/yazma yetkisi kesilmeden sahiplik devri veya kapasite bırakma yok; belirsizlikte rezervasyon tutulur. İptal teyidi run'a değil attempt+nesil+ilgili iptal talebine bağlanır; eski teyit yeni talebi örtemez. Kayıt yazılamadıktan sonraki telafi kill de doğrulanamazsa FATAL/serbest kapasite diye sunulmaz; UNKNOWN ve kart yolu kalır.

Gerçek kullanım veya bağımsız uygulanabilir üst sınır başarılı/başarısız/iptal, alt süreç, test ve onarımın toplamını kapsar. Tahmini rezervasyon ölçülmüş tüketim değildir; UNKNOWN sıfır veya KNOWN'a çevrilmez. Gecikmiş/eksik/çift kullanım bildirimi idempotent mutabakatla ele alınır; veri/limit yoksa yeni etki başlamaz. Yetki dolanımı sayılacak yeni ölçüm aracısı gerekiyorsa ayrı onay/yeniden tahmin.

**Dış etkinin hemen öncesi:** Kuyruktaki iş için güncel STOP, run durumu, sözleşme, fence, grant, deadline ve bütçe yeniden denetlenir. Kuyruğa kabul anındaki kontrol yeterli değildir. Kontrol–etki yarışında niyet, sahiplik ve uzlaştırma semantiği teknik ADR'de belirlenir. STOP/probe kırmızısı yeni üretimi kapatır, ancak iptal/ölüm teyidi/uzlaştırma gibi güvenlik bakımını körleştirmez. Kart açmak veya state'i RUNNING bırakmak checkpoint/yazma duruşu kanıtı değildir.

**S5/S6:** Sabit plan sürücüsü mevcut tick'in takma adı değildir. Kalıcı geçiş tablosu; hazır işi sahiplenme, niyet → dış etki → kayıt, normal sonuç/aday keşfi, güvenli mühürleme, doğrulama, tek sınırlı repair, bildirim ve final insan kararını birbirine bağlar. Her sınırda yönetici ölümü/yeniden oynatma sınanır; aynı niyet çift spawn/test/onarım/bildirim doğurmaz. Gerçek kayıt yeri ve idempotency anahtarı S0 teknik ADR'sinde seçilir; tarihsel olayların anlamı değişmez.

**S3 kabulüne ek:** İki attempt'te bir teyit; eski teyitten sonra yeni iptal; normal CLI exit; ebeveyni ölü yaşayan çocuk; PID yeniden kullanımı; lease dolarken yazan işçi; kuyruğa alındıktan sonra deadline/grant dolması; STOP altında ölüm teyidi; bilinmeyen kullanım ve yinelenen mutabakat. S5/S6 bu mekanizmaları ikinci kez yazmaz, üretim kontrol döngüsüne bağlar.

### 25.9. İnsan kapısı, tarihçe ve gerçek okuyucu sözleşmesi

**G0/H1/H2/H3/H4 kapı sözleşmesi:** Gerekli sprint kabul kimlikleri, ilgili plan/graf sürümü ve kimlikleri, sabit kanıt/artefakt referansları, insan karar kimliği+gerçek doğrulama kaynağı+kapsamı+tarihi, kapsam/bütçe/deadline ve gerekçe birlikte bağlanır. Karar veya kanıt yoksa alan NULL/boş ve kapı kapalıdır. “Son sprint PASS” insan kararının yerine geçmez. **Kapı kabulü ile sonraki fazı başlatma izni ayrı kayıtlardır.** S0b sınama izni de G0 kabulü değildir. Boşluk doldurmak için kapılara sahte PASS veya yeni keyfî kabul satırı eklenmez.

Tarihsel düğümün kapanış metni/kanıtı korunur; eski bağımlılıkları provenans alanına taşınır. Aktif yürütme kenarları yalnız DC altgrafını tanımlar. Kapalı A1'in ertelenmiş A0-1'e tarihsel bağı, bugünkü önkoşul sağlandı iddiası yapılamaz. Eski açık iş devri/erteleme ilişkisi bağımlılık gibi yürütülmez; eski A4'ün yeniden açılması H1 ve ayrı emre bağlıdır. Bütün eski düğümler aktif seçime/bütçeye kapalı kalır.

Grafın aktif/seçilebilir/yetki alanları bu tur **planlama metadatasıdır**; mevcut tüm okuyucuların uyguladığı teknik güvenlik kapıları değildir. Görsel seçme veya MD kartı yaratma dispatch değildir; bu ikisi çalıştırma/insan onayı kanıtı gösterilemez. S0/S1 gerçek operasyonel sınırda deny-default testlerini şart koşar. Yeni kartın ana plan üstünlüğünü, kaynak graf sürüm/özetini ve “anlık görüntü; başlatma yetkisi değil” durumunu taşıması; stale kartın çalıştırmaya dönüşmemesi mevcut kapsamın kabul maddesidir. Eski kart ezilmez.

Graf üretimi gerçek okuyucu tip sözleşmesini korur. Eski tuvalin metin beklediği kod bütçesi alanı geriye uyumlu metin görünümüdür; yetkili aritmetik ayrı sayısal alanlarla yapılır. v13'te sayı yayımlayarak yapılan kırılma yalnız veri projeksiyonuyla giderilir; bu, genel pano yetki/tip denetimlerinin ürün kodunda tamamlandığı iddiası değildir. Durum başlığı mevcut okuyucunun sabit başlığıyla uyumlu tutulur. Her plan/graf revizyonunda gerçek okuyucu fonksiyonu ve aktif altgraf da sınanır; JSON parse/DAG tek başına yeterli değildir.

### 25.10. Denetim sonrası bütçe kararı — ilk nominal yeterli kabul edilmedi (T)

**§25.3–25.4'teki 3.980/9.980 ve yüzde 35 rezervli sayılar ilk nominal tarihçedir; yeterliliği onaylanmış teslim veya harcama tavanı değildir.** Denetimler, zaten kapsamdaki güvenlik/kanıt bağlarının işini büyüttü. Yeni tahminler eski toplamın üstüne eklenmez, aynı paketlerin **yerine geçen** keşif aralıklarıdır. Ürün yapıldı veya bütçe onaylandı sayılmaz.

| Paket | Ordu kaynak işi (T) | Ordu test işi (T) | Ayrı pilot kod/test (T) | Teknik aralık (T) |
|---|---:|---:|---:|---:|
| DC-S0 (S0a+S0b) | 300–600 | 350–650 | 0 | 650–1.250 |
| DC-S1 | 500–800 | 650–950 | 0 | 1.150–1.750 |
| DC-S3 | 650–1.050 | 900–1.400 | 0 | 1.550–2.450 |
| DC-S2 | 600–950 | 850–1.250 | 0 | 1.450–2.200 |
| DC-S4 | 180–300 | 300–500 | 600–1.000 | 1.080–1.800 |
| **H1 toplamı** | **2.230–3.700** | **3.050–4.750** | **600–1.000** | **5.880–9.450** |
| DC-S5/S6 birlikte | kaynak/test birlikte 1.700–3.000 | ortak toplamda, ayrı tahmin yok | 160 | 1.860–3.160 |
| DC-S7..S10 birlikte | 1.800–2.700 | 2.500–3.800 | 280 | 4.580–6.780 |
| **Bütün yol** | ayrıştırma S0 sonrası | kaynak/test/pilot tek kez | toplamın içinde | **12.320–19.390** |

Kaynaklar: [`V1 teknik inceleme`](../raporlar/plan-3-denetci-2026-10-27/V1-SONUC.md), [`V3 paket tahminleri`](../raporlar/plan-3-denetci-2026-10-27/V3-SONUC.md). V3'ün ilk bütün-yol aralığı S5/S6'yı eski 1.940'da tutuyordu; burada V1'in 1.700–3.000 Ordu aralığı ve 160 pilot bir kez kullanıldı. Birbiriyle örtüşen V1 alt kümeleri tekrar toplanmadı. Eski yüzde 35 rezerv bu aralığa yeniden eklenmez. Yeni risk payı S0 keşfinden sonra ayrıca önerilir.

**Bağlayıcı bütçe sınırı:** Hazır seçili Windows sınırı ve kullanılabilir kullanım kaynağı varsayımı şartlıdır. Yoksa bu aralık geçersiz; genel VM/sandbox/kota aracısı ayrı onay/tahmin ister. Doküman, insan tanıklığı, kampanya süresi, sağlayıcı tüketimi ve dış altyapı saatleri LOC'den çıkarılmaz. Kaynak/test/göç/fixture, tekrar iş ve net depo büyümesi ayrı ölçülür. **Yeniden tahmin için açık insan kararı gelmeden artırılmış bütçe veya kod uygulaması açılmaz.**

### 25.11. Somut kabul ve son durum

Pilot oracle'ı adaydan önce dondurulur: A'da Unicode, bozuk giriş ve restart kalıcılığı; B'de yinelenen tamamlama, filtre/toplam ve A regresyonu; C'de önceden tutulmuş eski veriyle bakım/düzeltme ve gizli regresyon. İnsan kara-kutu kullanır; core'un kendi sayacını yeniden okumak bağımsız doğrulama değildir. On hata ailesi önce S0'da beklenen etkiyle tanımlanır, S1–S3'te mekanizma, S4'te aynı gerçek yol üzerinde ürün kanıtı olur; ikinci hata motoru yazılmaz.

S7–S10'da özellik/üretim ile bakım/regresyon görevleri ayrı ailelerdir; yeni dış proje zorunlu değil. Öğrenme açık/kapalı durumu, strateji kontrolü, kullanılan ders sürümü ve korunan oracle ayrı tutulur. Executor hatası/timeout/iptal/güvenli duruş paydadan kaybolmaz; aynı görevin tekrarları bağımsız yeni görev değildir. Sıra dengelenir, görev düzeyinde belirsizlik ve ön-kayıtlı anlamlı kazanım aranır. Faydasız dersin reddi geçerli sonuç; veri yoksa başarı/fayda değeri boş kalır. Rubrik değişikliği yalnız sürüm değişimi, kanıtlı terfi denetimi ayrı mekanizmadır.

**Son plan hükmü:** Kademeli hedef ve dar pilot korunur; plan sözleşmeleri bu ayrıntıyla sonlandırılmıştır. **Ürün/kod açıkları henüz kapalı değildir.** İlk eylem izin verilirse S0a keşiftir; S0b zararsız sınama izni, G0 kanıt kabulü, teknik uygulama ADR'si ve güncel bütçe ayrı kapılardır. Canlı pilot, gece modu, final kabul, harcama veya deployment bu sonlandırmayla açılmaz. Her kapanış güncel kod+test+kalıcı kanıtla yeniden değerlendirilir.

## 26. RBT-2026-10-28.1 — Rapor birleştirme ve belge kilidi planı

**Durum:** Kullanıcının “planı bu şekilde düzenle” emriyle plan düzenlemesi kayda alındı. **B0–B5 birleşim uygulaması tamamlanmadı; belge kilidi, final insan kabulü, commit/tag/push ve ürün çalıştırma yetkisi verilmedi.** Bu ek aynı ana planın belge yönetişimi işidir; ikinci aktif plan veya ürün sprinti değildir. Karar: [belge düzenleme ADR'si](../kararlar/ADR-rapor-birlesimi-belge-kilidi-2026-10-28.md). İnsan/makine planlama kaydı: [birleşim paketi](../raporlar/rapor-birlesimi-2026-10-28/OZET.md).

### 26.1. Kapsam, otorite ve değişmezler

Ürün yürütme revizyonu **v2.10.1 §25**, ürün grafiği **v14** olarak kalır. RBT kimliği yalnız bu belge düzenleme ekini sürümler; ürün/graf sürümünü veya evrensel sözleşme sürümünü artırmaz. RBT/B0–B5 kimlikleri DC-G0, DC-H1..H4 ve rapordaki G1..G6 kapılarıyla karıştırılmaz.

- Birleşim; 27–28 Ekim değerlendirme/denetim raporları, bunların makine ikizleri, ilgili canlı kanıtlar, plan revizyonları, K-SADE, bekçi ve haftalık telemetri kayıtlarını kapsar. Eski raporlar yalnız provenans ve kapanış kontrolü için yüklenir; bütün arşivin veya ham logların yeniden okunduğu iddia edilmez.
- Tek uygulama otoritesi bu plandır. [Görev grafiği](gorev-grafigi-2026-10-26.json) projeksiyon, [kabul defteri](kabul.csv) çalıştırılmış kabul kaydı, [mevcut birleşik eksik defteri](../raporlar/birlesik-eksik-defteri-2026-10-25/DEFTER.md) açık-iş kaynağı olarak korunur. Yeni birleşim paketi bunları bağlar; ikinci görev/karar/orkestrasyon otoritesi kurmaz.
- Ürün kodu, çalışma zamanı ayarı, hedef, oracle, kabul durumları, insan yetkisi ve bütçe bu belge işiyle değişmez. 81/135 ve 11 DC NOT_RUN, son kayıtlı başlangıçtır; yeni ölçüm olmadan güncel koşum sonucu veya ürün başarısı diye sunulmaz. Makine grafiği ve kabul defteri sırf raporları uzlaştırmak için yeniden yazılmaz.
- Rapor gövdeleri ve eski kanıtlar korunur. Düzeltme tarihli ek ve makine kaydındaki etkin düzeltme ilişkisiyle yapılır; tarihsel değer silinmez, sessizce yeni sürümün kanıtı olmaz. Plan düzenlemesini onaylamak B5 final kabulü değildir.

### 26.2. Kaynak envanteri ve tekilleştirme sözleşmesi

Başlangıç kaynakları: [ChatGPT raporu](../raporlar/rapor-chatgpt-27ekim.md) ve [ikizi](../raporlar/rapor-chatgpt-27ekim.json); [Deepseek raporu](../raporlar/rapor-deepseek27ekim.md) ve [ikizi](../raporlar/rapor-deepseek27ekim.json); [V1](../raporlar/plan-3-denetci-2026-10-27/V1-SONUC.md), [V2](../raporlar/plan-3-denetci-2026-10-27/V2-SONUC.md), [V3](../raporlar/plan-3-denetci-2026-10-27/V3-SONUC.md), [denetim kaydı](../raporlar/plan-3-denetci-2026-10-27/denetim.json) ve [kayıtlı doğrulama](../raporlar/plan-3-denetci-2026-10-27/dogrulama-son.json); [v2.10 revizyonu](../raporlar/plan-revizyonu-v210-2026-10-27/OZET.md) ve [v2.10.1 kararı](../kararlar/ADR-dc-3-denetci-sonlandirma-2026-10-28.md).

Kanıt/işletim girdileri: [S1](../raporlar/kanit-hedef/s1-ikinci-canli-run-2026-10-27.md), [S7](../raporlar/kanit-hedef/s7-turnuva-2026-10-27.md), [A3](../raporlar/kanit-hedef/a3-kural-derleyici-2026-10-27.md), [A0-2](../raporlar/kanit-hedef/a02-sweep-2026-10-27.md), [A0-3](../raporlar/kanit-hedef/a03-gozetimsiz-besleme-2026-10-27.md), [A0-5](../raporlar/kanit-hedef/a05-lrt-2026-10-27.md), [K-SADE](../raporlar/gelen-kutu/v7-kural-sadelestirme-2026-10-27.md), [27 Ekim bekçisi](../raporlar/takip-sozlesme/2026-10-27.md), [28 Ekim bekçisi](../raporlar/takip-sozlesme/2026-10-28.md) ve [W44 telemetrisi](../raporlar/telemetri-haftalik/2026-W44.md). Var olan makine ikizleri de envantere girer; bulunmayan ikiz varmış gibi gösterilmez.

Her ham iddianın kimliği **kaynak yolu + özgün bulgu kimliği/bölüm + kaynak sürümü/içerik özeti** üçlüsüdür. Farklı raporlardaki V1/V2 adları aynı inceleme değildir. 20 ve 22 ham bulgu toplanıp 42 bağımsız açık veya deney diye sunulmaz; ortak loga dayanan raporlar bağımsız kanıt sayılmaz.

Her iddia gerekçesiyle bir sınıfa bağlanır: **ürün açığı; plan/kabul ayrıntısı; rapor hatası/geçersizleşmiş iddia; tekrar; insan kararı/uygulama penceresi; tarihsel kanıt**. Birden fazla kanonik işe bağlanan iddia bölünme gerekçesi taşır. İşlenmemiş madde silinmez; “birleşime alındı”, “karar bekliyor” ve “üründe kapandı” ayrı durumlardır. Kanıt eksikse ölçülmedi/doğrulama bekliyor yazılır; sahte ret veya kapanış üretilmez.

### 26.3. Uzlaştırmada uygulanacak yorum düzeltmeleri

Bu tablo B1'in düzeltme kapsamını tanımlar; kaynak raporlara düzeltme eklenmiş veya ürün hataları giderilmiş demek değildir.

| Konu | Etkin yorum ve B1 işlemi |
|---|---|
| E-04 sıra iddiası | [İnsan ikizinin §19'u](GOREV-GRAFIGI-SENERARYO-2026-10-26.md:214) v13 tarihçesidir; [§20](GOREV-GRAFIGI-SENERARYO-2026-10-26.md:273) güncel S1 → S3 → S2 sırasını taşır. Güncel çelişki diye sayma, tarihsel sırayı değiştirme. |
| E-03 boş kararlar | §25.9 ve graf kapı sözleşmesi tanımlıdır. Kanıt/onay yokken boş karar doğru kapalı durumdur; çalışma zamanı uygulamasının doğrulandığı anlamına gelmez. |
| E-11 S0 alt adımları | S0a/S0b grafın DC-S0 alt adımlarıdır; §25.6 gereği yeni genel PASS satırı değildir. Sırf görünürlük için yeni ürün düğümü/başarı ekleme. |
| E-08/E-09 kabul bağı | NOT_RUN ölçüt yok demek değildir; §25.3/§25.7–11 ve graf ölçütleri vardır. Eksik test/eşik/kanıt bağlantısını somutlaştır; [kabul okuyucularını](../core/src/replan.ts:42) sınamadan CSV şemasını değiştirme. |
| Üç puan ölçeği | 19/40 = %47,5 eşit ağırlıklı kontrol oranı; 48,75/100 ağırlıklı hazırlık endeksi; 3,9125/10 ayrı olgunluk değerlendirmesi. H1 5,775 ve H4 8,775 koşullu (T) projeksiyondur. Bunlar eşitlik/dönüşüm veya ürün başarısı değildir. |
| Bütçe tarihçesi | 3.980/9.980 ilk nominal tarihçedir; aynı kapsam için doğrulanmış alternatif taahhüt değil. §25.10'daki H1 5.880–9.450 / bütün yol 12.320–19.390 yerine geçen (T) tahmin, onaysızdır; eski rezerv tekrar eklenmez. |
| İnsan kuyruğu | [A3 taslağı onayı](../STATE_BOARD.md) verilmiştir; [K-0044](../kararlar/K-0044.md) kararı verilmiş, uygulama penceresi bekler. Eski replan sürüm/kapsam kontrolünden geçmeden uygulanmaz; eski A4, H1 ve ayrı emir öncesinde açılmaz. |
| K-SADE sınırı | Kural sadeleştirmesi, kabul tablosu şeması değildir. 38'e iniş koşullu öneridir; özellikle V7-23'ün koruma yükleme riski ayrı karar ister. K-SADE bu belge işine veya salt-okur S0a'ya otomatik önkoşul yapılmaz. |
| Boş denetim özeti | Atıf yapılan [denetim özeti](../raporlar/plan-3-denetci-2026-10-27/OZET.md) içerik kontrolünden geçmeli; yalnız dosyanın bulunması kapanış değildir. Tamamlama B3 işidir. |
| Sağlık ve işletim | Bekçi raporları kendi ölçüm anlarının sinyalidir; eski 18 OK/0 EKSİK sonucu bugüne kopyalanmaz. Telemetri turları görev/ajan sayısı değildir; tahmini LOC/saat teslim tarihi veya kabul kanıtı yapılmaz. |

Alternatif doğrudan başlatma, tam kaynak/onay bağı, gerçek izolasyon, zorunlu imza, deneme bazlı yaşam/iptal, gerçek kullanım ve dış etki öncesi güncel yetki/süre kontrolleri **ürün işi olarak açık** kalır. Rapor yorumunun düzeltilmesi bu güvenlik işlerinin kapanışı değildir.

### 26.4. B0–B5 aşamaları ve geçiş koşulları

| Kimlik | İş | Sorumlu / bağımlılık | Çıkış koşulu |
|---|---|---|---|
| RBT/B0 | Kaynakları sabitle: ölçülmüş zaman, HEAD, kirli dosya/sahip, kapsam kesim noktası, sürüm ve dosya özeti. | Operatör + salt-okur doğrulayıcı; ayrı birleşim başlatma/kapsam emri. | Kaynak baytları ve sahiplik biliniyor; eşzamanlı değişiklik sessizce sahiplenilmiyor. Plan düzenlemesinin başlangıç kaydı, bütün B0'ın yerine sayılmıyor. |
| RBT/B1 | Ham iddiaları uzlaştır; §26.3 düzeltmelerini tarihli erata adaylarına, tekrarları kaynaklı eşlemeye bağla. | Tek yazıcı + ayrı denetçi; B0. | Kapsamdaki her iddianın gerekçeli karşılığı var; çözümlenmemiş kritik rapor çelişkisi yok. Ürün açıkları örtülmüyor. |
| RBT/B2 | Geçerli işleri C01–C10 ve ilgili DC sprint/kabul kimliklerine bağla; mevcut eksik defterine tarihli ek tasarla. | Yazıcı + tester; B1. | Her açık işte sorumlu, önkoşul, pozitif/negatif sınama, eşik, kanal, kalıcı kanıt ve insan kapısı var. Kanıt yokken kapanış/yeşil üretme yok. |
| RBT/B3 | Asgari belge birleşimi: özet/makine ikizi, kaynak erataları, boş denetim özeti, mevcut defter eki ve indeks/durum işaretçileri. | Tek yazıcı; B2, atomik dosya sahipliği. | İnsan/makine etkin sonuçları aynı; eski gövdeler ve kanıtlar korunmuş; ikinci aktif defter/plan yok. |
| RBT/B4 | Kilit adayını bağımsız doğrula: eşlemeler, sayım/puan/bütçe, bağlantı/içerik, aktif graf/gerçek okuyucu, değişmezlik ve güncel sağlık. | Ayrı tester + salt-okur denetçi; B3. | Belge kontrolleri geçer; 0 EKSİK; her SARI için gerekçe/sahip/kabul kararı var. Kırmızı koşular ve kanıt sınırı saklanmıyor. |
| RBT/B5 | Kapsamlı insan kararı sonrası aynı adayın değişmez belge kilidi; commit/tag/push kendi açık izinleriyle. | İnsan + operatör; B4 ve ayrı final kabulü. | Onaylı içerik ile kilitli içerik eş; karar/kanıt/commit bağlantısı yeniden doğrulanmış; ürün/canlı/harcama yetkisi açılmamış. |

İlk durum **B0..B5 BAŞLATILMADI**; bu plan ekinin yazılması aşamaları geçmiş yapmaz. Bekçi/gelen-kutu birikimi B0'da güncel sayılır; 102 gibi eski toplamlar bugünkü ölçüm diye kullanılmaz. Kapsam dışındaki kayıtlar sahip ve gerekçeli devirle ayrılır; silinmez. Kapsam içi çözümsüz iddia varsa durum açık/doğrulama bekliyor kalır; B4/B5 geçti denmez.

### 26.5. Kanonik iş ve kabul eşleme kaydı

Her kayıtta kaynak kimlikleri, kanonik grup/iş, iddia sınıfı, kanıt türü/tarihi/sürümü, etkin hüküm ve gerekçe; açık ürün işinde ayrıca DC sprint/kabul kimliği, sorumlu, önkoşul, sınama komutu/ortamı, beklenen sonuç/eşik, kalıcı kanal/artefakt ve insan kapısı bulunur. Statik kaynak gözlemi, eski test kaydı, yeni koşum (R) ve değerlendirme/projeksiyon (T) birbirine dönüştürülmez. Aynı bulgunun plan netleştirmesi ile ürün onarımı ayrı tutulur.

C01–C03 sınır/kaynak/operatör, C04 mühürlü aday ve korunan kanıt, C05–C06 yaşam/kullanım/duruş, C07 kalıcı sürücü/replan/öğrenme/terfi, C08–C10 temsil/okuyucu/pilot/bütçe grupları başlangıç taksonomisidir. C08/C09'daki kayıtlı veri düzeltmeleri yeniden açık hata diye sayılmaz; genel çalışma zamanı güvencesiyle karıştırılmaz. Yeni iddia sığmıyorsa gerekçeli ek gerekir; sınıfa zorla sokulmaz.

Ölçüt boşluğu önce bu planın mevcut koşulları ve graf ölçütlerine referansla tamamlanır. Kabul şemasını değiştirmek; bütün okuyucular, eski kayıtlar ve sayım uyumluluğu sınanmadan yapılmaz. Gerekirse ayrı teknik ADR/test işi açılır; bu belge bütçesine kod/göç gizlenmez.

### 26.6. Doğrulama ve belge kilidi kontrol listesi

1. Kapsamdaki ham iddiaların tamamı gerekçeli eşlemeli; açık ürün işlerinin kapanış ölçütleri ve sahipleri kayıtlı; insan/makine sayımları eş. Tekil toplam ancak eşleme doğrulandıktan sonra verilir.
2. Bütün etkin düzeltmeler insan ve makine kaydında, eski değerleri koruyan tarihli ilişkiyle görünür. Özellikle eski hazırlık toplamı ile etkin toplamı, hazırlık/olgunluk ve nominal/yeniden tahmin birbirine karışmaz.
3. Bağlantı hedefi, varsa satır aralığı ve **içerik doluluğu** sınanır. Sadece varlık, JSON parse veya DAG döngüsüzlüğü yeterli değil; aktif altgraf ve mevcut okuyucu fonksiyonu da sınanır. Tarayıcı E2E yapılmadıysa yapıldı denmez.
4. Ürün kaynakları, grafın yetki/bağımlılıkları, hedef ve kabul kayıtları başlangıç kimlikleriyle karşılaştırılır. S0a/S0b ve insan kapıları sahte PASS/kararla doldurulmaz. Belge birleşimi tek başına 81/135'i veya puanı değiştiremez.
5. Her anlamlı değişiklik sonrası [CODEMAP üreticisi](../scripts/codemap.ps1) ve [sağlık kontrolü](../scripts/saglik.ps1) çalışır. Sağlık eşikleri gevşetilmez; 0 EKSİK gerekir. SARI kaydı, final kabulü ve ürün hazır kararı aynı şey değildir.
6. Kod/göç/okuyucu/betik değişimi gerekirse ayrı teknik kapsam, ADR, negatif test, değişen bileşenin tam süiti ve §25.5'teki güncel tam regresyon kapısı uygulanır. Belge kontrolü tam ürün regresyonu veya canlı sağlayıcı kanıtı diye sunulmaz; izin gerektiren koşum kendiliğinden başlatılmaz.
7. Bir yazıcı, ayrı doğrulayıcı ve salt-okur son denetçi; her atomik işte en fazla üç mevcut dosya; commit tek elden ve dosya adıyla. Kullanıcının süreç/portlarına ve başkasının kirli dosyalarına dokunulmaz. Yeni genel inceleme turu yerine yalnız çözümsüz iddia hedefli sınanır.

Kilit kaydı; kapsam kimliği, onaylı kaynak özetleri, kanıt dizini, doğrulanmış insan karar kimliği/kapsamı, açık riskler ve yeniden açma koşullarını taşır. **Belge kilidi ürün sürümü değildir.** [Mevcut kilit betiği](../scripts/kilit-surum.ps1:93) eski bileşen yolu varsayımı ve tag/kilit-belgesi sırası nedeniyle bu iş için doğrudan çalıştırılmaz. Kullanılacak yöntem monorepo ve commit kapsamıyla izole doğrulanır; kayıt kendi hash/commit'ini döngüsel olarak içermez. Tag varsa karar ve kanıtı kapsayan kesin commit doğrulanır; sonradan değiştirilmez. Rollback ayrı kullanıcı emridir.

### 26.7. Çıktılar, ayrı insan kapıları ve son hüküm

[Birleşim paketi](../raporlar/rapor-birlesimi-2026-10-28/OZET.md) ve [makine ikizi](../raporlar/rapor-birlesimi-2026-10-28/birlesim.json) bu turda **planlama kaydıdır**. Tam birleşim/erata/eşleme B1–B3'te, güncel kilit kanıtı B4'te, final kilit kaydı yalnız B5'te üretilir. Hazırlık dosyası yaratmak kilit oluşturmak değildir. [Mevcut eksik defteri](../raporlar/birlesik-eksik-defteri-2026-10-25/DEFTER.md) tarihli ekle genişletilir; ikinci açık-iş kaynağı açılmaz.

Birleşimi başlatma/kapsam emri; B5 belge kabulü; commit/tag/push; K-SADE madde/varyant ve uygulaması; DC-S0a dar keşfi; S0b süreç sınaması; G0 kanıt kabulü; teknik ADR/kod/güncel bütçe; canlı/harcama ve sonraki DC fazları ayrı kararlardır. Tek cümle plan düzenleme emri bunları topluca vermez. K-SADE uygulanmadan rapor uzlaştırma ve izinli S0a keşfi yapılabilir; kuralların korunması yine zorunludur.

**Hedeflenen B5 hükmü, henüz gerçekleşmiş sonuç değil:** “Rapor ve plan tabanı izlenebilir biçimde kilitli; ürün açıkları kayıtlı ve açık. Canlı pilot, gözetimsiz çalışma ve artırılmış bütçe için yetki yok. İlk ürün adımı ayrıca izin verilirse DC-S0a salt-okur keşfi.” Kanıt/karar eksikse **KİLİT YOK / NO-GO** kalır. Yeni kanıt, kaynak değişimi veya onaylı kapsam revizyonu yalnız yeni tarihli ek/sürümle yeniden açılır; eski kilit ve kanıt ezilmez.

## 27. ATOM-H1-2026-10-28.1 — Ajan uygulama paketleri

**Kapsam emri:** “uygulama paketini bu şekilde atomikleştir”. Bu emir görev fişlerinin hazırlanmasıdır; **S0a keşfi, S0b OS sınaması, ürün kodu, harcama, sprint kapanışı veya insan kabulü BAŞLATILMADI**. Ürün yürütme revizyonu v2.10.1, graf v14 ve kabul durumları korunur. Karar: [atomikleştirme ADR'si](../kararlar/ADR-dc-h1-atomik-paketler-2026-10-28.md).

### 27.1. Tek kaynak ve görev kapsamı

[Paket özeti](uygulama-paketleri/DC-H1-2026-10-28/OZET.md), [makine fişleri](uygulama-paketleri/DC-H1-2026-10-28/gorevler.json) ve [çalıştırma disiplini](uygulama-paketleri/DC-H1-2026-10-28/CALISTIRMA.md) bu ana planın projeksiyonudur; ikinci aktif plan veya orkestrasyon DB'si değildir. İnsan fişleri makine kaydından üretilir; çelişkide ana plan kazanır. [Görünüm denetimi](uygulama-paketleri/DC-H1-2026-10-28/gorunum.mjs) insan/makine eşliğini kontrol eder.

| Sıra | Makro sprint | Atomik görev | Hazırlık durumu |
|---|---|---:|---|
| 1 | [DC-S0a](uygulama-paketleri/DC-H1-2026-10-28/S0a.md) | 4 | Kaynak/ortam, tehdit, kullanım/veri, ADR-oracle önerisi; brief tam, ayrı başlatma emri yok |
| 2 | [DC-S0b](uygulama-paketleri/DC-H1-2026-10-28/S0b.md) | 3 | Pozitif sınır, kaçış negatifleri, bağımsız tüketim fizibilitesi; teknik ADR ve ayrı zararsız sınama izni bekler |
| 3 | [DC-S1](uygulama-paketleri/DC-H1-2026-10-28/S1.md) | 5 | Tam sözleşme, kalıcı/uyumlu bağ, onaylı kaynak, alternatif giriş, operatör sınırı |
| 4 | [DC-S3](uygulama-paketleri/DC-H1-2026-10-28/S3.md) | 6 | Süreç kimliği, bitiş/uzlaştırma, iptal nesli, kullanım, dış etki kontrolü, STOP bakımı |
| 5 | [DC-S2](uygulama-paketleri/DC-H1-2026-10-28/S2.md) | 4 | Aday mühürleme, korunan runner, zorunlu makbuz/imza, günlük gerçek teslim |
| 6 | [DC-S4](uygulama-paketleri/DC-H1-2026-10-28/S4.md) | 4 | Pilot A/B/C, hata aileleri/geri dönüş ve H1 insan kanıtı |

Toplam **26 görev**, başlatılmış/yetkili görev **0**. S0a/S0b aynı DC-S0 makro kabulüne bağlıdır; diğer görevler kendi mevcut sprint kimliğine bağlanır. Yeni genel PASS/kabul satırı veya ürün graf düğümü açılmaz. S1/S3/S2/S4'ün **19 kod/pilot görevi** ve S0b'nin 3 görevi tasarım koşulludur; seçili OS/kalıcı veri/operatör/usage/oracle bağları S0 ADR'sinde teyit edilmeden çalıştırılabilir diye sunulmaz.

### 27.2. Görevi ajana serbest bırakma

Her fişte hedef/çıktı, kaynaklar, mevcut ve yeni kesin dosya **adayları**, bağımlılıklar, kapılar, pozitif/negatif kabul, komut/çalışma dizini/yan etkisi, kaynak-test-pilot LOC payı ve kanıt çifti bulunur. Gerçek ajan kimliği, ilgili kaynak/kirli dosya snapshot'ı, doğru kapsamlı insan emri, tasarım/write-set teyidi, bağımsız tester/denetçi ve yürütme bütçesi **başlatma anında** bağlanır. Bu bağlar yokken fiş hazır bir yürütme yetkisi değildir.

En fazla üç mevcut dosya, tek kritik-yol yazıcısı ve dosya sahibi disiplini geçerlidir. Ek göç/arayüz/okuyucu dosyası gerekirse görev içinde sınırı genişletme; önce yeni atomik parça/paket revizyonu. Yeni test görevle birlikte mevcut test zincirine girer; hiçbir eski test çıkarılmaz. Hedefli test güncel tam regresyon yerine geçmez. Tam core testinin ön adımı probe çalıştırır; S0a'nın salt-okur kapsamına alınmaz. İzinsiz yerel süreç/ağ/üretim DB/sağlayıcı veya temizlik etkisi ihtimali varsa durulur.

Pilot işçisinin yazma alanı ayrı pilot dosyalarıdır; çekirdek entegrasyon yazıcısı ve **korunan oracle sahibi güvenilir tester** ayrı kapsam kullanır. A/B/C kabul testleri adaydan önce korunan ayrı kökte dondurulur; işçiye suite/imza anahtarı/operatör yetkisi verilmez. Eski oracle/veri aday lehine değiştirilmez.

### 27.3. LOC, kanıt ve sonraki fazlar

Görev payları yeni **geçici (T)** ayrıştırmadır; §25.10 sprint toplamları aynen korunur: S0 650–1.250; S1 1.150–1.750; S3 1.550–2.450; S2 1.450–2.200; S4 1.080–1.800; **H1 5.880–9.450 teknik LOC**. Pilot 600–1.000 toplamı bu pakette kaynak 300–500/test 300–500 diye önerilmiştir; bu da onaysız tahmindir. S0a rapor/ADR'si teknik LOC değildir. Görev başına önerilen 8 tur/60 dk/60k token, verilmiş hak veya sağlayıcı harcama izni değildir; aşımda dur/yeniden tahmin, kaliteyi düşürme yok.

[Paket denetçisi](uygulama-paketleri/DC-H1-2026-10-28/dogrula.mjs) görev/DAG, dosya sınırı/çakışma, kapalı izinler, LOC ve sonuç kaydı **biçimini** kontrol eder. Gerçek OS/kimlik sınırı, ürün testi veya insan kabulü değildir. Kaynak hash, gerçek komut/çıkış/kanıt ve pozitif/negatif gözlemle görev sonucu teslim edilir; ayrı tester denetimi ve mevcut insan kapıları gerekir. Görev raporu üretmek sprint PASS, G0/H1 kabulü veya sonraki fazı başlatma anlamına gelmez.

[S5–S10 teslim ve ayrıntılandırma kapıları](uygulama-paketleri/DC-H1-2026-10-28/SONRAKI-FAZLAR.md): S5/S6 H1, S7/S8 H2, S9/S10 H3 sonrasındaki gerçek kanıta göre aynı paket ailesinde ayrıntılandırılır; ayrıca faz emri gerekir. Ortak tahminler S5/S6 1.860–3.160 ve S7–S10 4.580–6.780 (T) olarak kalır. Bütün yol 12.320–19.390 (T); tekil ileri-sprint bütçesi veya kesin dosya/komut bugün uydurulmaz. RBT ve K-SADE ürün keşfine otomatik önkoşul yapılmaz.

## 28. RBT-2026-10-28.2 — Kilit öncesi etkin kapanış

**Emir:** “yukarıdaki kapanışları tamamla”. Bu emir §26'daki belge birleşimini ve son denetimdeki kapsam/sonuç kaydı/hijyen/navigasyon düzeltmelerini açar; §25 ürün görevi, sağlayıcı harcaması, gerçek OS sınaması, final B5 kabulü veya commit/tag/push açmaz. [Kapanış ADR'si](../kararlar/ADR-kilit-oncesi-kapanis-2026-10-28.md), [kapanış kanıt paketi](../raporlar/kilit-oncesi-kapanis-2026-10-28/OZET.md).

### 28.1. Başlangıç kayıtlarının üzerine etkin durum

§26 ve §27'deki “başlatılmadı” ifadeleri o eklerin yazıldığı andaki başlangıçtır; gövdeler korunur. Belge birleşimi için sonraki emir ve kanıtın **etkin kaydı**, [birleşim makine kaydındaki kapanış ekidir](../raporlar/rapor-birlesimi-2026-10-28/birlesim.json). B0..B3 ancak dondurulmuş kaynak kimlikleri, kaynaklı eşleme/eratalar ve teslimlerle; B4 güncel doğrulama ve bağımsız incelemeyle kayda alınır. Aşama kapanışı bu plan metninin yazılmasından çıkarsanmaz.

**B5 FINAL İNSAN KABULÜ YOK.** Sağlık/test yeşili veya kapsamı belli aday manifesti; B5'in kabul/commit/etiket sözleşmesini geçmiş yapmaz. Çalışma ağacı tamamen temizlenmiş iddiası verilmez; başkalarının ve runtime'ın değişiklikleri sahibinde kalır. Aday ile tam sürüm kilidi açıkça ayrıdır.

### 28.2. Etkin ajan paketi ve sonuç sözleşmesi

[ATOM-H1-2026-10-28.2](uygulama-paketleri/DC-H1-2026-10-28/OZET.md), §27'deki .1 yazımını belge/denetçi düzeyinde devralır; 26 görev ve H1 5.880–9.450 teknik LOC (T) zarfı korunur. Ürün yürütme revizyonu v2.10.1/graf v14 değişmez; yeni görev/kabul/PASS eklenmez. Gerçek ajan atamaları, OS/operatör/usage/oracle tasarımı ve bütün ürün insan kapıları boş kalır.

- S0a başlatma kapsamı okuma/kanıt çiftinin yanında **yalnız S0a-04'te adı verilen TASLAK ADR önerisini** kapsayacak biçimde eşleştirildi; taslağı üretmek ADR onayı değildir.
- Sonuç şeması **v2**: zorunlu okuma dosyalarının tamamı; izinli kaynak kimlikleri; görevin kendi kökünde mevcut/boş olmayan hash+byte kimlikli artefakt; komut kimliği/tam metin/çalışma dizini/çıkış/beklenen çıkış/çıktı referansı; her P/N gözleminin kayıtlı kanıt bağı gerekir. Eski v1 kayıtları tarihçe, yeni kapanış yerine kullanılamaz.
- Başarısız komut, eksik kaynak veya hayali/boş/değişmiş artefakt kanıt kaydedildi sonucuna çevrilmez. Sonuç kendi hash'ini taşımaz; kanıt başka görev/üretim veri alanına kaçamaz. Denetçi komutu yeniden çalıştırmaz; semantik doğrulama, yetkili aktör ve insan kabulü ayrıca gerekir.
- Pilot görev fişi çekirdek entegrasyon yazıcısını, yalnız pilot dosyalarıyla sınırlı işçiyi ve korunan oracle sahibi güvenilir testeri ayrı gösterir. Bu rol metni gerçek OS sınırının uygulanmış olduğu iddiası değildir.

### 28.3. Kaynak erataları, açık-iş ve hijyen

Kaynak raporların [ChatGPT §15 eratası](../raporlar/rapor-chatgpt-27ekim.md), [Deepseek §9 eratası](../raporlar/rapor-deepseek27ekim.md) ve makine ikizlerindeki tarihli etkin düzeltme ilişkileri eski gövde/alanları silmeden işlenir. [Üç-denetçi özeti](../raporlar/plan-3-denetci-2026-10-27/OZET.md) mevcut denetim/test kayıtlarından tamamlanır; yeni ürün ölçümü sayılmaz.

**150 kaynak kimliği** [mevcut eksik defterinin DC ekine](../raporlar/birlesik-eksik-defteri-2026-10-25/DC-2026-10-28.json) bağlanır. Bu 150 bağımsız açık/deney veya bütün-repo açık sayımı değildir. Kapsam ve beklenen kimlik kümeleri makine ekinde açık; C01–C10 ürün işleri açık, K-SADE ayrı insan kararı, eski backlog tarihli sahibiyle taşınır. Yeni bir açık-iş otoritesi kurulmaz.

[Ajan başlangıcı](AJAN-BASLANGIC.md) doğru otoriteye navigasyondur; yeni kural veya izin değildir. [Veri yerleşimi](VERI-YERLESIMI.md) CLI ve pano veri köklerini kaynaklarıyla açıklar. İki DB eş kabul edilmez; üretim DB/JSONL/probe/config açma/göç/silme/restart yapılmaz. Her iki veri kökünün WAL/SHM dosyaları ve geçici araç dizini Git dışlanır; kalıcı DB/JSONL/artefaktlar körlemesine dışlanmaz veya silinmez.

### 28.4. Manifest ve kilit adayı

Adayın kapsamı; değiştirilen belge/paket kaynakları, makine eşlemesi ve ilgili karar/kanıt dosyalarının path+SHA-256+byte kimliğidir. Başlangıç HEAD tek başına kirli ağacı tanımlamadığından ilgili içerik kimlikleri ayrıca gerekir. Önceden kirli ürün/probe/telemetri/handoff/başka ajan dosyaları sahiplik dışı olarak listelenir; toplu stage, reset, stash, silme veya kendiliğinden commit yapılmaz.

Doğrulama raporu adayın içerik manifestine bağlanır; manifest kendisinin hash'ini veya henüz var olmayan commit'ini içermez. Değişmez aday hazırlanması commit/tag veya temiz repo değildir. Final B5'te gerçek insan aynı manifest ve açık riskleri kabul eder; commit/tag/push için kendi açık emirleri ve kesin commit kapsamı gerekir. Yeni içerik/kanıt geldiğinde yeni tarihli aday üretilir; eski aday/kanıt ezilmez.
