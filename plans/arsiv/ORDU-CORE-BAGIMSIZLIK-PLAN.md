# ORDU-CORE BAGIMSIZLIK PLANI v0.1 (TASLAK — kullanici onayi bekler)

> Tarih: 2026-10-14 · v0.1: otonomi ekseni derin analizi sonrasi 3 ithal — qwen v1.2 (8 karar karti + stale kurali + mod profilleri), ordu-v3 §30 (4 ogrenme kanali + F1-F6 frenler), gpt v3 (scheduler + notification outbox + quiet-hours). Soy haritasi asagida; uydurma ozellik yok, her madde kaynak pakete atifli.
> Ilgili: K-0019, K-0020, K-0033, ORDU-PLAN-v1.md (v1.6), pano-blueprint (2026-10-13)
> Hedef cumle (kullanicidan): "Gorevi manager ile tanimlarim; ordu kendi ogrenir, test eder, yazar, iyilestirir, teslim eder; ben sadece izlerim. Paseo entegrasyonu derin, bagimliligi sig."

## 0. Tek karar (bu planin kalbi)

Ordu core'u plugin surecinden AYRIK bir yerel servise tasinir. Paseo = worker adaptoru #1. Pano = Paseo icinde native yuzey (yeni sekme), verisini core'dan okur.

- Core olmeden Paseo calisir; Paseo olmadan core calisir (uyur modunda: defter/checker/kuyruk/pano canli, spawn bekler).
- Veri otoritesi: `.verimlilik/` dosya SSOT (K-0033 ikili temsil) v1'de KORUNUR. SQLite migrasyonu ileri faz — K-0020 acik sorusu bu planla kapanir (dosya SSOT yeterli; DB, uzaktan-coklu-host ihtiyacinda ayri K ile).

## 1. Mimari (3 kutu + adaptor sozlesmesi)

```
[pano: Paseo sekme, vanilla tek HTML] <---> [core: ayrik OS servisi, 127.0.0.1:4379] <---> [.verimlilik/ dosya SSOT]
        kopru degil, ince istemci               |                                        emirler/plan/izinler/hedefler
                                                +-- adaptor #1: Paseo SDK (worker spawn)
                                                +-- adaptor #2: ham HTTP LLM (toolsuz roller: manager/reviewer)
                                                +-- adaptor #3 (v2): Paseo-disi tool-runner (tam bagimsizlik)
```

- Adaptor sozlesmesi (motor yalniz bununla konusur): `spawn(brief) -> handle` · `gonder(handle, mesaj)` · `durum(handle)` · `iptal(handle) -> teyit` · `olaylar(handle) -> stream`. "Paseo'ya karsi" kod yazilmaz; hicbir cagri SDK tipi sizmaz.
- Core yasam dongusu: Windows gorev zamanlayici/servis; Paseo kapaliyken spawn kuyrugu birikir, donuste reconcile (kor retry YOK — qwen K-0001/D2).

## 2. Bagimsizlik matrisi (Paseo kapaliyken)

| Bilesen | Davranis |
|---|---|
| Defter + checker + derleyici | calisir (saf dosya islemi) |
| Kuyruk + frenler (max-paralel, butce, izin matrisi) | calisir; spawn "paseo-kapali" bekler |
| Pano | salt-okur canli; yazma fail-closed rozet |
| Manager akil yurutme | adaptor #2 ile calisir (ozet/plan/repair onerisi) |
| Worker (kod yazan el) | DURUR — tek gercek bagimlilik; adaptor #3 v2'de |

## 3. Otonomi katmani (v0.1 — en iyilerin birlesimi)

### 3.1 Mod profilleri (qwen 06 §1'den)
`firtina` (tavan x2, min insan) · `atolye` (dengeli, varsayilan) · `ekonomi` (toplam paralel=2, tester Paseo'da kalir, token tavan x0.5). Mod composer'dan degil gorev/profil kurulumundan secilir.

### 3.2 Karar karti tur seti (qwen 06 §5'ten — kapali kume, 8 tur)
`3-kirmizi` (maxDeneme tukendi: devam+2/atla/iptal) · `plateau` (devam/daralt/iptal) · `butce-asimi` (artir/atla/durdur — butce-bitimli normal retry YOK, qwen K-0001/D5) · `kapsam-disi` (onayla/reddet) · `yetim` (crash sonrasi olu sahip: yeniden-spawn/iptal) · `izin-sorisi` (bu-kez/bekle/iptal) · `onar` (sonucsuz spawn mutabakati) · `acik-bagimlilik` (bagimlisi atlandi: gecis-var/bekle/iptal).
Stale kurali (qwen K-0002/A4): yeni donmus candidate uretiminde onceki adayin acik kararlari `karar-stale` ile gecersizlesir; cevaplari RED, yeniden istenir.
Mekanik: her cevap `karar-verildi` olayi + kararlar.jsonl telafi satiri + manager'a tek mesaj.

### 3.3 Butce frenleri (qwen 06 §3'ten)
Rezerve dusumu spawn aninda; %90'da duzeltme durtmesi; %100'de zorla-testte; sprint toplam tavaninda yeni spawn stop + tek toplu kart. Token olculemiyorsa `bilinmiyor` rozeti — uydurma sayi yasak.

### 3.4 Ogrenme hatti (ordu-v3 §30'dan — 4 kanal)
- L1 Hata imzalari: ayni hatanin duzeltme recetesi `lessons/imzalar.jsonl` -> retry promptuna tek satir. OTOMATIK (yalniz not ekler).
- L2 Skorcard: rol x profil ilk-deneme-gecme + maliyet-per-kabul (tam payda: basarisiz+atlandi+iptal dahil). Hesap otomatik, karar degil.
- L3 Retro onerileri: `oneriler/O-xx.md` (kapali sema: hipotez, kanit, diff, etki, geri-alis) -> [ONAY#1 dene] -> eslenmis izole deney -> skorcard kiyas -> [ONAY#2 promote/rollback] -> canary: ilk 3 gercek gorev; regresyonda otomatik DURDUR + geri-al.
- L4 Vekil kalibrasyonu: reddedilen rubric'ler `kullanici.md` taslak diff'i olur; yalniz oneri.
- Basari tanimi: 3 sprint art arda maliyet-per-kabul dusuyor VE ilk-deneme yukseliyor VE ihlal artmiyor -> "ogreniyor". Aksi halde oneri hatti durur, kok neden.
- Frenler F1-F6: oneri sahibi kendi onerisini uygulayamaz · haftada en fazla 2 profil degisimi · guvenlik/recovery kapilari ogrenmeyle GEVSEMEZ · metrik tanimlari sabit (oneri "metrigi degistir" diyemez) · plateau/butce kurallari kodda · bilinmeyen maliyet ucretsiz sayilmaz.

### 3.5 Hedef-koklu long-runner (ORDU-PLAN v1.5 §24-27'den — korunur)
Olc (deterministik script; ajan kendi metrigini OLCEMEZ) -> dene (worktree) -> yesil kapi -> kilitle/geri-al -> plateau (5 deney <%2) -> insan karti. Regresyon ana dala giremez; her kilitleme ayri commit (tek komutla geri sarilir).

### 3.6 Zamanlama + bildirim (gpt v3 §8-9'dan)
- Scheduler: occurrence = scheduleId+revision+UTC instant (unique); DST: kaybolan saat skip, tekrarlanan saat ilk occurrence; kacan is varsayilan SKIP (boot'ta toplu catch-up YOK); overlap SKIP + neden kaydi; STOP'ta SKIPPED_STOP, mandal acilinca firtina yok.
- Bildirim: LLM poll'u DEGIL, durable notification outbox (karar/teslim/kritik hata/stop teyidi/gunluk ozet); dedupe + severity + quiet-hours (kritik asabilir); "bildirim gelmedi = sorun yok" varsayimi YOK; linkler auth'lu karar ekranina acilir.

## 4. Fazlar (her faz = calisan sistem + kanitli kapi)

| Faz | Icerik | Cikis kapisi |
|---|---|---|
| C0 Cekirdek ayrima | plugin'deki pano koprusu + spawn poller + planmd core'a tasinir; plugin ince istemci; OS servisi kurulum script'i | Paseo kapaliyken GET /api/durum 200 + kuyruk append; Paseo acilinca 1 spawn islenir (sonuc.jsonl kaniti) |
| C1 Pano native sekme | blueprint'in 11 ekrani + mockup13ekim v2 dili Paseo paneline; Graf tam rontgen (katman bantlari + 5 mudahale) | 11/11 render 0 konsol hatasi; dugum->dock detay; PNG kanit 1600x1000 |
| C2 Onay kutusu + tek durdur | 8 kart turu (§3.2) + stale kurali + ACIL DURDUR (<=5sn, tum yeni spawn 0) | kart yanitlaninca ordu devam; STOP sonrasi defterde 0 spawn; stale karar reddi testli |
| C3 Adaptor #2 + routing | ham-LLM toolsuz roller; provider karti + 3-eksen bench tohumu (ORDU-PLAN §15); mod profilleri aktif | Paseo hic acilmadan manager plan uretir (checker'dan gecmis derleme kaniti) |
| C4 Self-learn dongusu | §3.4 + §3.5: 4 kanal + long-runner + oneri->canary hatti | hedef 3 deneyi kartsiz tamamlar; regresyon revert kanitli; plateau insana duser; 3-sprint olcumu baslar |
| C5 Uzaktan izleme | salt-okur remote (ozel ag + reverse proxy + auth; gpt §9 kurallari) + notification outbox + STOP ayri auth | telefondan 5 soru ekrani + STOP + bildirim dedupe testi |

## 5. Var olan / eksik (disk kanitli)

- VAR: planmd checker + round-trip (19 test) · /ordu slash + spawn kuyrugu + fren (12 test) · pano koprusu canli (e4ae439) · mockup v2 11 sekme render kanitli · hedefler.json semasi (v1.5) · telemetri hatti (v0.21 alanli)
- EKSIK: core ayrima (C0) · Graf sekmesi · 8 kart turu + stale (qwen'den ithal, kod yok) · notification outbox · scheduler · adaptor #2/#3 · OS servisi · ogrenme kanallari L2-L4

## 6. Yapilmayacaklar

- DAG motoru/kutuphanesi YOK (katman-liste, K-0033) · framework/bundler YOK · modal YOK · file manager YOK · merge/deploy otomasyonu YOK (insan) · SQLite v1'de YOK · model fine-tune YOK (ogrenme = kayit disiplini) · LLM poll ile bildirim YOK · uydurma sayi YOK.

## 7. Soy haritasi (kimden ne alindi)

| Katman | Kaynak | Durum |
|---|---|---|
| Veri/ikili temsil | K-0033 + ORDU-PLAN v1.6 | canli kod, tasinoir |
| Komuta + spawn frenleri | ORDU-PLAN v1.6 F2 | canli kod, tasinoir |
| 8 kart + stale + butce frenleri + modlar | qwen v1.2 (06, K-0001/D5, K-0002/A4) | taslak -> C2/C3 |
| 4 ogrenme kanali + F1-F6 + 3-sprint tanimi | ordu-v3 §30 | taslak -> C4 |
| Scheduler + notification outbox + uzaktan kurallari | gpt v3 §8-9 | taslak -> C5 |
| UI etkilesim dili | pano-blueprint (BLUEPRINT/DESIGN/mockup v2) | canli mockup -> C1 |
| Dayaniklilik zemin fikirleri (fence/dedupe/UNKNOWN) | kapsul-final + ADR-011 | dosya-SSOT'a uyarlanir (SQLite'siz asgari bicim) |

## 8. Acik sorular (kullaniciya)

1. Core servisi ayri repo mu (ordu-core) yoksa paseo-verimlilik icinde ayri giris mi?
2. C0 oncesi PANO_TOKEN zorunlu mu (yazma acik pano) — evet onerilir.
3. Adaptor #3 adayi: Codex CLI mi, aider mi? (v2 konusu; simdi karar gerekmez)
