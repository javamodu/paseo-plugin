# PLAN.md (SSOT uygulama plani) — Ordu: Paseo-native, bagimsiz-core, ogrenen ajan ordusu
> Dosya: plans/PLAN.md · Yetkili kopya budur (silinecek-task-graph'teki isaretci). Hedef otoritesi: plans/HEDEF.md · Kanit defteri: plans/kabul.csv

> Surum: v2.9 KILIT (kapsam) · 2026-10-14 · Durum: ONAY BEKLER (K-0034 adayi) — TARIHLI KAYIT - son dis review 85/100 (GO: F0/F1 tasarim+hazirlik, NO-GO: gercek worker) | GUNCEL (2026-10-14): mimari GO; 4-duzeltme paketi islendi; gozetimsiz kullanim bol.22 canli kapilari gecmeden ACIK DEGIL · v2.7: schema/semantik ayrimi (§20.5), cekirdek tek-kural (§19), F7 referans temizligi, receipt ifade duzeltmesi (§18.2) · v2.7.1: 87/100 review tutarlilik patch'i (F7 LOC satiri, §17.3 F3 maddesi, §20.4 temizligi, §15 faz ref'leri) · v2.7.2: T-raporu ayrimlari islendi (§6.1 esleme tablosu, §7 imza tanimi, §16.2 KPI kapilari, §18 P0-4..7, T1/T2 kapsam notlari, regresyon-suite kurali) · ordu-core 102/102 exit 0 (R, 2026-10-14 erken baseline); GUNCEL olcum: 3.499 src + 4.915 test LOC, 252/252 exit 0 (R, 2026-10-14 ~16:45). v2.8: coder review R1-R5 islendi (REVIEW-v2.8-2026-10-14.md). v2.8.1: dis review 7 duzeltme islendi (bol.0 otorite tekillestirme, manager=onerir/derleyici=derler, vekil grant kararlari R3, faz bagimlilik sirasi + F6.5/F8/F9, gozetimsiz giris kapisi bol.22, release senaryolari bol.23, LOC olcum tanimi bol.11)
> v1.0 DURUMU: SUPERSEDED — 3 bagimsiz review 65/64/60 puan verdi, ONAYLANMADI; bu surum 6-subagent derin analiz + review bulgularinin birlesimidir. v1.0 arsiv degeri tasir.
> Hedef otoritesi: plans/HEDEF.md v1.3 (paseo-plugin workspace'i) — bu plan hedefi degistiremez, hedef kendini kanitlanmis sayamaz. Kullanici hedefi degistirebilir; degisiklik onayli revizyonla (yeni HEDEF surumu + ADR) plana islenir.
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
