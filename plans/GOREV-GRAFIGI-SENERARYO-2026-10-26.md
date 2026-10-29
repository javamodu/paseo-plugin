# GÖREV GRAFİ BULUTU — MANAGER·CODER·TESTER·PROXY SENARYOSU (2026-10-26)

> **GÜNCEL: graf v14 / ana plan v2.10.1 §25.** Politika otoritesi [`PLAN.md`](PLAN.md); bu belge [`görev grafiğinin`](gorev-grafigi-2026-10-26.json) insan görünümüdür. Güncel tablo ve bütçe yorumu §20'de. **Uygulama/canlı/harcama YOK; yeniden tahmin bütçesi onay bekler.** JSON/MD veri önceliği ana planı aşamaz.
> **§1–19 tarihsel v1–v13 kayıtlarıdır.** Eski HAZIR, proxy yetkisi, bütçe ve “gece modu açılabilir” ifadeleri güncel emir değildir. v14'te tarihsel ilişkiler aktif kenarlardan ayrıldı; metadata gerçek okuyucularda uygulanan runtime güvence diye sunulmaz. Önceki kopyalar [`v12`](../arsiv/plan-revizyonu-2026-10-27/SENARYO-v12.md) ve [`v13`](../arsiv/plan-3-denetci-oncesi-2026-10-27/SENARYO-v13.md) korunur.

## 1. Roller — kim ne YAPAR, ne YAPMAZ

| Rol | Yapar | ASLA yapmaz |
|---|---|---|
| **KULLANICI (insan)** | hedef koyar · kapı düdüğü · kill-switch (STOP/kill-9) | — |
| **MANAGER** | grafı tutar · READY düğüm seçer · kapsül üretir (hedef+ölçüt+dizin+bütçe+deadline) · metrikleri okur · replan TASLAĞI üretir | görevi kendi DEĞİŞTİRMEZ (yalnız taslak) · kabul çevirmez · kalite kapısını düşürmez |
| **CODER (worker)** | kapsüldeki DİZİNDE belirtilen İŞİ yapar · kanıt dosyası üretir (sonek-hash) · bütçede kalır | kapsam dışına çıkmaz · kendi hedefini yeniden yorumlamaz · insan onayı gereken yeri kendi geçmez · testleri atlayamaz/saşmaz |
| **TESTER (bağımsız)** | kanıtı DİSKTEN okur (öz-beyana BAKMAZ) · ölçüt vs kanıt · FAIL → yeniden-üretim talimatı (repairAttempt≤2) · altın-set probları ile KENDİ isabeti ölçülür | kodu DEĞİŞTİRMEZ · coder'a ipucu VERMEZ (yalnız kırmızı+ölçüt) · PASS'i tahminle vermez |
| **İNSAN-VEKİLİ PROXY** (tıkanma çözücü) | insan YOKKEN: checkpoint'ten devralır · görevi böl/yeniden sırala (hedef AYNİ) · retry/provider-failover · öncelik DÜŞÜRME | **insan kartına ONAY VEREMEZ** (EK-2) · silme · kabul çevirisi · kapsam BÜYÜTME · hedef/ölçüt değiştirme · anahtar/para |
| **GÖZLEMCİ (meta)** | M1-M3 meta-ölçüm · altın-set · çift-sayıım · eğilim | hiçbir karara müdahale etmez — yalnız ALARM üretir |

## 2. Örnek akış — "sıradaki şunları bitir" düdüğü

```
DÜDÜK: [A0-1, A0-2, EK1-3] bitir
 1. MANAGER  → graf: bağımlılık kontrol → READY: A0-1 (bağımlılık: T0 bitmiş) → kapsül: {dizin: core/src+paseo-transport, ölçüt: cancel çağrısı canlı Paseo yolunda RED değil + 40 test yeşil, bütçe, deadline} → deftere PLAN_APPROVED [insan]
 2. CODER    → core/src'te çalışır → kanıt: test çıktısı + diff → commit adayı (fence)
 3. TESTER   → bağımsız koşum → kanıt-dosyadan sayar → PASS/FAIL; FAIL ise: "yeniden üret, neden: <ölçüt-satırı>" (≤2 kez) → 2 FAIL = insan kartı
 4. GÖZLEMCİ → bu turun metrikleri: süre·token·kanıt-delta·tester-isabeti → meta-tabloya
 5. TIKANIRSA (3 kırmızı / asılı run / API ölümü):
      PROXY → yetki matrisinden karar: [devral+böl+failover] EVET · [kart onayı] HAYIR → kart sizin dönüşünüze PENDING bekler (sistem durur ama ÖLMÜŞ sayılmaz — checkpoint)
 6. MANAGER → tur kapanışı: kanıt-üçleme → kabul satırı → damga → graf durumu güncelle
```

## 3. PROXY yetki matrisi (insan yokken — hızlı başvuru)

| Durum | Proxy kararı | Yetki |
|---|---|---|
| Süreç/API ölümü | retry + provider failover + backoff | ✅ EVET |
| Asılı run | sweep: kart veya temiz öldür + checkpoint'ten devam | ✅ EVET |
| Aynı görev 2× kırmızı | görevi BÖL + alt-görevlere ayır (hedef aynı) | ✅ EVET |
| Sıra tıkalı (bağımlılık bekleme) | bağımsız READY'ye geç (graf boş değilse) | ✅ EVET |
| Bütçe tükeniyor | öncelik DÜŞÜK görevleri ertele + rapor | ✅ EVET |
| İnsan kartı (onay isteyen her şey) | — | ❌ HAYIR: PENDING bekler |
| Silme / kabul çevirisi / kapsam büyütme / hedef-ölçüt değişikliği / anahtar-para | — | ❌ HAYIR: asla |

## 4. Tarihsel görev tablosu (v12; güncel v13 tablosu §19)

Durum: `HAZIR`=bağımlılık tamam · `BEKLE`·`DALGA`·`[İNSAN]`=kapı · `DEVAM`=paralel yazıcıda.

| ID | Görev | Rol | Dizin | Ölçüt/metrik | Bağımlılık | LOC (T) | Durum |
|---|---|---|---|---|---|---|---|
| T0 | F6.5-A 2-provider paketi commit | paralel yazıcı | core/src | kanal x=0 zaten; commit hash | — | ~5 | **KAPALI (F6.5-A: commit 80fdb4a, kanal x=0, kabul F65-01 PASS 10:46)** |
| S1 | İkinci canlı run (claw-rehber) | coder+tester | raporlar/kanit-hedef | rapor satır=disk .md sayısı | — | 0 | **KAPALI (v8: run-f911b84d uçtan uca ACCEPTED 2026-10-27 — spawn UNKNOWN→recovered [A08], TESTER bağımsız sayım 10↔10↔TOPLAM:10, evaluate PASS 4/4, decide apv-6cd2de76; kanal d/h/x koşum dalgasına ait değil [M02 emsali]; §14)** |
| S3 | STOP/kesinti eli ile | KULLANICI | pano 4378 | iptal zinciri defterde | S1 | 0 | [İNSAN] |
| S2 | Eşzamanlı ikili (LMS+website) | coder×2+tester | raporlar/kanit-hedef | 2 ACCEPTED + izolasyon | S1 | 0 | [İNSAN] "koş" |
| S4 | Gözlemci turu | KULLANICI | ordu | 3 doğrulama + drift izleri | S1 | 0 | [İNSAN] |
| S5 | Deadline baskisi senaryosu (capsule --deadline; T5' ucu) | coder | core/src | 30 sn dolunca yeni dispatch RED + RUNNING attempt CHECKPOINT + insan kartı DEADLINE_CLOSE + CRITICAL bildirim; run ASLA ACCEPTED olmaz; +30 test | S1 | 30+30 | [İNSAN] "koş" |
| S6 | Gece modu rozeti pano ucu (T4' ucu) | coder | core/src/pano | rozet gozetimsiz-hazir VEYA durust kırmızı + ADIYLA nedeni; +30 test | S1 | 40+30 | [İNSAN] "koş" |
| A0-1 | Paseo cancel bacağı | coder | core/src+paseo-transport | canlı iptal RED değil; +40 test | T0 | 50+40 | HAZIR |
| A0-2 | Asılı run sweep | coder | core/src/supervisor | c0ea713b deseni kapanır; +40 test | — | 60+40 | **KAPALI (v11: kod dalgası 2026-10-27 — kanal d=2026-10-27T11:43:06.3865016+03:00 h=280d881 x=0 sureSn=56 [2. koşum 437/437]; 6-sınıf karar kaskadı + B1 kart-döngüsü + B2 tx-dışı enqueue + B4 dispatch kapısı + tick r4; üretim (R): tick 11:20 asılı 3→0 [run-c0ea713b DERSLER-173 deseni + 2 çöp-kapsül run'ı temiz-öldürüldü]; gerçek (R) 262 kod/359 test satırı-15 test [plan (T) 60/40 — dürüst not]; §17)** |
| A0-3 | Gözetimsiz kanıt-üretici uç | coder | core/src+daemon | rozet bayrakları besleniyor; +60 test | A0-2 | 100+60 | **KAPALI (v12: kod dalgası 2026-10-27 — kanal d=2026-10-27T12:47:21.0584862+03:00 h=26a0561 x=0 sureSn=119 [2. koşum 449/449; 1. koşum x=1: f3-crash V3-S1.4 bilinen 15sn manager yük-flake — kanal öncesi %100, a02/a05 deseni]; ölçüt üç katman: hermetik wiring 12/12 + serve wiring üretim-şekli koşumu [cli.ts serve → runDaemon kanitDefteriYolu; a03-serve-wiring.log: kanit-besleme kayit=4, stats kanit:{besleme:4,hata:0}] + üretim rozeti fail-closed [gozetimsiz-kullanilamaz 6/6 ESKI_KANIT — DB bacağı yeşil, daemon koşmadan rozet açılmaz]; gerçek (R) 207 kod/183 test satırı-12 test [plan (T) 100/60 — dürüst not]; §18)** |
| A0-4 | Bildirim gerçek sender | coder | core/src/notify | kart size ULAŞIR; +40 test | — | 80+40 | HAZIR |
| A0-5 | **L-RT: üretim LocalLauncher + provider→CLI eşleme** (Paseo'suz koşum bacağı) | coder | core/src/local-runtime + providers | `ORDU_RUNTIME=local` gerçek CLI süreci + durable pid registry; claude-code/gemini-cli bilinçli registry girişleri | — | 230+60 (150 L-RT + ~40/CLI) | **KAPALI (v11: kod dalgası 2026-10-27 — kanal d=2026-10-27T11:44:07.7627073+03:00 h=280d881 x=0 sureSn=60 [2. koşum 437/437]; canlı 3-koşum kırıl-ölç-düzelt: glm-5.3 headless 400 [sdk sorgu kaynağına kapalı] → model NULL AYNI 400 → codefastglm53unlimited UÇTAN UCA ACCEPTED — **METRİK: Paseo'suz koşum duvar-süresi 38.0 sn**; PROVIDER_REGISTRY['claude-code'] ölçülmüş-tek; B8 restart-körlüğü + B9 telafi-kill; gerçek (R) 430 kod/407 test satırı-12 test [plan (T) 230/60 — dürüst not]; §17)** |
| S7 | Mini-turnuva (2 provider) | manager+tester | core | 2 run kıyas tablosu | T0 commit + S1 | 0 | **KAPALI (v9: SIRALI iki zincir 2026-10-27 — P1 run-1bcba32d [codex/glm-5.3] ACCEPTED 04:49:06 + P2 run-9b2607fc [glm53u-codex/glm-5.3] ACCEPTED 04:57:53; TESTER bağımsız sayım 10↔10↔TOPLAM:10 ×2, evaluate PASS 4/4 ×2; KISYAS: candidateHash b7449cd9… AYNI (goal senaryosu aynı), artifactHash YOL-FARKLI [1f873de2… vs 26f39427…] — tek değişken provider doğrulandı; kanal d/h/x YOK [koşum-dalgası sınıfı, M02/S1 emsali]; §15)** |
| A1 | F8 turnuva protokolü | coder | core/src | K12-01/02+K13-02 kapanır; +130 test | S7 + A0-1 | 400-700 | **KAPALI (F8: commit e70dd55, kabul.csv PASS 13:31)** |
| A2 | Replan motoru | coder | core/src | DRIFT% sürekli; §18 otomatik; +120 test | A1 | 250-400 | **KAPALI (v7: kanal d=2026-10-27T00:12:39 h=45bd046 x=0 etiket a2-replan; core/src/replan.ts + cli 'replan' + 11 hermetik test, tam süit 389/389; kabul A2 PASS; [insan] eşik onayı ölçüm-üzeri açık kapı — §13)** |
| A3 | Deneyim→kural derleyicisi | coder | core/src+DERSLER | ders→kural tavan 80; +90 test | A2 | 200-350 | **KAPALI (v10: kod dalgası 2026-10-27 — kanal d=2026-10-27T09:43:17.0929164+03:00 h=bbbd393 x=0 sureSn=86; DERSLER tarama → 3 aday (ilk parti ≤5, K-0051) → sentez×3 ajan:llm → [insan] TOPLU onay 05:43:06Z → AGENTS.md inişi → sayaç 74→77 ≤ tavan 80; denetçi B1-B5 DÜZELT-İLE-DEVAM + üretim bulguları B6 provenans-çapası / B7 eş-taslak idempotansı bulundu-kapatıldı; hermetik 20/20; gerçek (R) 476 kod/392 test satırı-20 test [plan (T) 275/90 — dürüst not]; pending taslak krl-b0cb1576 [insan] onayı bekler; §16)** |
| A4 | Otonom sürü sürücüsü | coder | core/src/daemon | gece modu açılır; +100 test | A3+A0-3 | 150-250 | HAZIR (v12: iki bağımlılığı da kapandı — A3✓ [v10] + A0-3✓ [v12]; tek kapısı **[İNSAN] gece-modu açılış** — EK-2: ajan/proxy açamaz) |
| EK1-1 | Benchmark regresyon defteri | coder | core/src/benchmark | koşumlar damgalı; gerileme sinyali | — | 100 | HAZIR |
| EK1-2 | Drift sinyal birleştirici | coder | core/src | 4 sinyal→tek yeniden-üretim | A1 | 120 | BEKLE |
| EK1-3 | Tıkanma çözücü proxy | coder | core/src | yetki matrisi kodda; kart YASAK testli | A0-2 | 100 | BEKLE |
| EK1-4 | Altın-set probları (M1) | coder | core/test | evaluator isabeti ölçülür | A1 | 120 | BEKLE |
| EK1-5 | Çift-sayıım meta-metrik (M2) | coder | scripts+core | metrik-drift alarmı | — | 100 | HAZIR |
| EK1-6 | Pano aksiyometri satırları | coder | core/src/pano | her adımın metriği görünür | A4 | 80 | BEKLE |
| K1 | Kapanış: Z1 + kilit tag | manager | repo | CODEMAP taze + doctor 0 EKSIK + kilit tag — **NOT (v6): v0.23-kilit 16:2x'te plugin S3 dalgasında DOĞDU (9853bb1); graf K1 sıradaki kilit penceresinde tag'ler (v0.24+ [insan])** | tüm A+EK | 0 | BEKLE |

Toplam (T, graf v12): **bütçe BİLİNÇLİ REVİZYON — kodLocT tavan 2600→~3300 (v11)→~3400 (v12), testLocT 1050→~2100 (v11)→~2250 (v12)** (kapalı-gerçekler plan üstü yaktı: A3 476/275, A0-2 262/60, A0-5 430/230, A0-3 207/100 (R git-diff); gerekçe graf v11/v12 geçmiş kayıtlarında, tavanKural gereği aynı sürüm kaydında) · **kalan ölçümlü açık-plan: ~1020 kod / ~510 test** (KAPALI 9/24: T0+S1+S7+A1+A2+A3+A0-2+A0-5+A0-3; durum dağılımı 9 KAPALI/8 HAZIR/7 BEKLE) · kritik yol: T0✓→S7✓→A1✓→A2✓→A3✓→A4→K1 — **uç: A4 (iki bağımlılığı da KAPALI; tek kapı [İNSAN] gece-modu açılış — düdük bekler).** A0-5 kapandı — Paseo'suz koşum bacağı ÜRETİMDE (gece turları local runtime'da koşabilir). K1 bağımlılığı "tüm A+EK" = A0-1..A4 + EK1-1..6 (A0-5 bilinçli HARİÇ: kritik yol dışı, paralel yetenek; S5/S6 da koşum-senaryosu olduğu için kapanışta zorunlu DEĞİL).

> **İsim-uzayı dipnotu (v6):** bu belgenin S3'ü = STOP/kesinti SENARYOSU ([insan], BEKLE). Plugin dalgalarının S3'ü (v0.23 kod dalgası, 16:2x'te KAPALI: 76a8b0b/9853bb1/a6fd75f + tag v0.23-kilit) ile ALAKASIZDIR — iki ID uzayı farklı belgelerde yaşar, rapor okurken karıştırılmamalı.

## 5. Replan kuralları

- **Tetikler:** (a) plan-sapma >%25 (defter↔graf) · (b) 2 ardışık görev 2×-kırmızı · (c) metrik-drift alarmı · (d) benchmark gerileme · (e) [insan] kapsam düdüğü.
- **Akış:** manager → replan TASLAĞI (yeni sıra/bölme/erteleme, hedef DOKUNULMAZ) → kapı: [insan] varsa PENDING; insan YOKSA VE tetik c/d ise → proxy yalnız SIRA/BÖLME uygulayabilir (hedef/ölçüt asla) → graf JSON güncellenir + eski graf arşivlenir (append-only).
- Graf sürümü her değişimde artar (v1 → v2 …) + değişim nedeni kaydı.

## 6. Simülasyon (ön-simülasyon + tıkandıkça iyileştirme)

- **ÖN-SİMÜLASYON (kuru koşum):** grafi yürütmeden doğrula — (1) döngü yok (DAG), (2) her BEKLE'nin bağımlılığı var, (3) her görevde ölçüt+dizin+rol dolu, (4) bütçe/LOC toplamı tavan içinde, (5) kritik yol kapı zinciri (insan kapıları yolda işaretli). Hata bulunursa graf v(n+1) düzeltilir, koşum YOK.
- **TIKANDIKÇA İYİLEŞTİRME:** her tıkanma (3-kırmızı/asılı/proxy-devralma) bir graf olayı olarak kaydedilir → tıkanma NEDENİ etiketlenir → aynı etiket 2. kez görünürse görev otomatik BÖLÜNÜR veya bağımlılık yeniden bağlanır (replan kuralı devreye) → v(n+1).
- Simülasyon çıktısı: `raporlar/simulasyon/gorev-grafigi-<tarih>.md` (insan) + `.json` (makine) — koşum ÖNCESİ zorunlu adım.

## 7. Makine sözleşmesi (JSON ikiz şeması)

`gorev-grafigi-2026-10-26.json`: {schemaSurum, grafSurumu, roller, yetkiMatrisi, gorevler[{id,rol,dizin,olcut,bagimli,kapi,loc,durum}], kenarlar, replanKurallari, simulasyon} — ajan görev seçerken YALNIZ JSON'dan okur; MD insan içindir.

---
Damga (R): 2026-10-26 ~12:05, ajan = ana oturum (Claude glm-5.3, ordu). Durum = ÖNERİ — senaryo koşumu [insan] düdükle ("S1 koş" / "A0 dalgası başla"). Kaynak: otonomi-merdiveni EK-1 + senaryo dosyası + FAZ-2.

## 8. ÖN-SİMÜLASYON SONUCU (2026-10-26 ~12:25)

JSON ikiz **v2**'ye geçti (v1'de 2 sessiz hata yakalandı ve düzeltildi — ön-simülasyon işe yaradı):
1. K1'in 10 bağımlılığı görev tablosundaydı ama `kenarlar` dizisinde YOKTU → 10 kenar eklendi (27 kenar).
2. LOC değerleri aralık üst uçlarıydı → toplam 2615 > 2600 tavan patlıyordu → orta noktalar (2265 ✓; test 890 ✓).

5/5 kontrol yeşil (DAG 21/21 döngüsüz · bağımlılık bütünlüğü · alan doluluğu · bütçe tavanı · kritik yol kapı zinciri). **Graf v2 koşuma hazır.** Rapor: `raporlar/simulasyon/gorev-grafigi-2026-10-26.md` + `.json` (tıkanma olayları bu dosyaya append edilir — aynı etiket 2× = otomatik bölme, v3+).

İlk dalga (bağımlılığı yok/T0 sonrası): **S1 · A0-1 · A0-2 · A0-4 · EK1-1 · EK1-5** — düdük sizden: "S1 koş" veya "A0 dalgası başla".

## 9. AJAN KADROSU — kapsül başına model·izin·yetki (2026-10-26 ~14:40; graf v3)

Her kapsül kendi ajan kadrosunu **görev kartının içinde** taşır (bulutun parçası):
- **JSON (makine-okur):** `gorev-grafigi-2026-10-26.json` → `ajanKadrosu.varsayilan` (M/C/T/V/D şablonları) + `gorev.ajanlar` ezbir-alanı (A1/S7 turnuva: 2 CODER 2 provider).
- **MD (insan-okur):** kapsül kartları `plans/kapsuller/<ID>.md` — görev kartı + kadro tablosu + korunmalar.
- **Modeller registry'den** (fail-closed: registry-dışı RED; R: codex/glm-5.3 + glm53u-codex/glm-5.3 canlı, F6.5-A).
- **TESTER bilinçli 2. provider** (glm53u-codex) → kod-yolu + model bağımsızlığı (öz-değerlendirme tuzağına karşı).
- **Vekilin yetkisi = yetkiMatrisi'ne tabi** (§3); ❌ kolonlara kod katında testle yasak.
- Mockup'ta üçüncü yüz: **KAPSÜL KARTI (MD)** düğmesi — aynı veriden markdown kartı üretir (`pano/kapsul-tuval-mockup-2026-10-26.html`).

## 10. A0-5 — Paseo'suz + çok-CLI koşum bacağı (graf v4, 2026-10-26 ~16:05; kullanıcı onayı)

Kullanıcı sorusu: "hem Paseo hem Paseo olmadan, hem claude-code/codex/gemini-cli ile çalışabilir mi?" → cevap graf düğümü oldu:
- **A0-5 = L-RT üretim LocalLauncher** (150+60): git worktree + provider CLI süreci + durable pid registry; `ORDU_RUNTIME=local` kapısıyla LocalRuntimeAdapter (R: sözleşme hazır) finally üretim uçlu.
- **Provider→CLI eşleme tablosu** (~40/CLI): claude-code (`claude`), gemini-cli — registry'ye bilinçli girişler (fail-closed K-0033 korunur; `providerCliPresent` kanıtı CLI yokluğunda spawn RED).
- İki yol aynı defter/kadro/dispatch semantiği: Paseo AÇIK → Paseo transport; Paseo KAPALI → local CLI süreci. **"İkinci DEFTER değil, ikinci RUNNER"** (Y1, ADR-012).
- Yeni kök düğüm (bağımlılık: —) → yerel masaüstü otonomisinin koşum bacağı; A4 sürücüsüyle isteğe bağlı birleşir.

## 11. Graf v5 — denetim tazelemesi (2026-10-26 **~15:51 — disk mtime ölçümü**; 10-subagent plan denetimi)

> Damga-düzeltme beyanı: §10 başlığındaki "~16:05" ve bu bölümün ilk yazımındaki "~17:20" saatleri yazıcı saatinin tahminle üretimiydi; disk ölçümü 15:51'i gösterdi. Ders: damga saati ölçülür (Get-Date / mtime), tahmin edilmez (DERSLER-162).

- **S5/S6 düğümleri grafa eklendi** (bu MD'de tanımlıydılar ama JSON SSOT'sunda yoktu — ajan seçemezdi; JSON-kazanır kuralı bunu affetmezdi).
- **A1 → KAPALI gerçeklik tazelemesi:** F8 commit e70dd55 + kabul.csv K12-01/02+K13-02 PASS (13:31) — graf kurulumundan (12:05) sonra kapandı; kalan kod bütçesi ~2015 (T).
- A1/A3 ölçüt-test sayıları testLoc ile hizalandı (130/90); S3 dizini "plugin pano koprugu (4378)" netleşti.
- Bütçe (v5): kod 2565 / test 1010 — tavalar 2600 / 1050. Ön-simülasyon yeniden koşuldu: **8/8 PASS** (raporlar/simulasyon/gorev-grafigi-2026-10-26.md v5 kaydı).
- Sıradaki engel kritik yolda: **S7 mini-turnuva koşumu ([insan] düdük)** — A1 kapandığında A2'nin tek bekleyeni bu.

## 12. Graf v6 — FINAL durum (2026-10-26 17:05, Get-Date ölçümlü; S3-plugin kapanışı sonrası)

S3 plugin v0.23 dalgası kapandı; bu oturum kapanışı diskten bağımsız doğruladı (commit 76a8b0b → 9853bb1 → a6fd75f · tag **v0.23-kilit @ 9853bb1** [v0.8'den beri ilk gerçek tag] · son-kanit birebir d=16:23:04 h=f992e46 x=0 · kanıt raporu + plugin/surumler/v0.23/kilit.json yerinde).

**Graf v6 taze durumu (8/8 PASS):**
- KAPALI: **T0** (F6.5-A, 80fdb4a) · **A1** (F8, e70dd55) — kalan kod ~2010 (T) / test 1010 (tavan 1050).
- **Kritik yol ucu: A2 artık BAĞIMLILIKÇA SERBEST** (A1, S7'yi beklemeden kapandı) → A2 → A3 → A4 → K1 zinciri tümüyle açık.
- [insan] düdük bekleyenler: S1 "koş" (canlı senaryo) · S7 (mini-turnuva; zinciri bloklamaz, değer senaryosu) · S5/S6 (T4'/T5' uçları, S1 sonrası) · S3-STOP (kendi senaryosu) · K-0044 (paralel tarafın anahtar→env penceresi) · K1 tag onayı (v0.24+).
- Paralel hazır (bağımlılıksız): A0-1 · A0-2 · A0-4 · A0-5 · EK1-1 · EK1-5; A1'in kapanışıyla EK1-2/EK1-4 de serbest.
- Kirli ağaç: bu oturumun plan/rapor seti untracked — "[insan] commit" düdüğü bekliyor (tek yazıcı, dosya adıyla; paralel tarafın dosyalarına dokunulmaz).

**Kilit notu:** kilit-surum.ps1'in çift-ev kusuru (tek RepoKok iki ev taşıyamıyor) plugin dalgasında RED'e düştü, adımlar elle yürütüldü — onarım kayıtlı ayrı kalem; graf kapanış (K1) kilidi için sıradaki pencerede netleşmeli.

## 13. Graf v7 — FINAL durum (2026-10-27 00:24, Get-Date ölçümlü; A2 replan motoru kapanışı sonrası)

A2 dalgası kapandı; kapanış diskten bağımsız doğrulandı (kanal son-kanit.json birebir `d=2026-10-27T00:12:39.7323672+03:00 · h=45bd046 · x=0 · etiket a2-replan · sureSn=114` · test-a2-replan.log · kanıt raporu raporlar/kanit-hedef/a2-replan-2026-10-26.md · kabul.csv A2 PASS).

**Graf v7 taze durumu (6/6 PASS):**
- KAPALI: **T0** (F6.5-A, 80fdb4a) · **A1** (F8, e70dd55) · **A2** (kanal x=0, 45bd046) — kalan kod ~1685 (T) / test 890.
- **Kritik yol ucu: A3 bağımlılıkça SERBEST** (tek bağımlılığı A2 idi; kapısı [insan] kural-onayları toplu) → A3 → A4 → K1 zinciri açık.
- **A2'nin getirdiği (V4-01 kökten kapandı):** DRIFT% ölçer kodda (`kabulOku`/`olcDrift`/`olcSapma`); §18 Durum hücreleri [insan] kapılı otomatik tazelenir (MD-ezmez: yalnız Durum hücresi; `REPLAN ONAYLIYORUM` + aktör `insan:cli` — EK-2 ajan/proxy RED); replan.jsonl append-only fsync (ölçüm icerikHash idempotent); onaysız plan değişimi YOK.
- [insan] düdük bekleyenler: **S1 "koş"** (canlı senaryo) · S7 (mini-turnuva; zinciri bloklamaz) · "A3 başla" (kritik yol ucu) · S5/S6 (T4'/T5' uçları, S1 sonrası) · S3-STOP (kendi senaryosu) · K-0044 (paralel tarafın anahtar→env penceresi) · K1 tag onayı (v0.24+).
- Dürüst kapsam: A2 ölçütü "+120 test" plan (T) değeri — gerçek (R) 11 hermetik kırılım testi (kabul satırında aynen böyle kayıtlı).
- Kirli ağaç: bu oturumun A2 seti commit düdüğünde tek yazıcıyla girer; paralel tarafın dalga-ortası dosyalarına dokunulmaz.

## 14. Graf v8 — FINAL durum (2026-10-27 07:05, Get-Date ölçümlü; S1 ikinci canlı run kapanışı sonrası)

S1 koşum dalgası kapandı ([insan] "S1 koş" düdüğü + kullanıcının "otomatik yap" talimatıyla bu oturum zinciri işletti): kapsül **run-f911b84d uçtan uca ACCEPTED** — kanıt raporu raporlar/kanit-hedef/s1-ikinci-canli-run-2026-10-27.md · kabul.csv **S1-SEN GECTI_CANLI** (kanal d/h/x koşum dalgasına ait DEĞİL — M02 emsali; kanal koşumu kod+test dalgalarında).

**Graf v8 taze durumu (ön-simülasyon 7/7 PASS programatik: sürüm, DAG 24 düğüm/29 kenar 0 döngü, kenar uçları, alan doluluk, butçe kalan 1685, kronoloji v1..v8):**
- KAPALI: **T0** (80fdb4a) · **S1** (run-f911b84d ACCEPTED) · **A1** (e70dd55) · **A2** (45bd046) — kalan kod ~1685 (T) / test 890.
- S1'in bağımlıları çözüldü: **S2 · S3 · S4 · S5 · S6 SERBEST** (hepsi kendi [insan] düdüğünü bekler); **S7 bağımlılığı "T0 commit + S1" TAMAM → S7 koşulabilir.**
- Bu dalganın canlı bulguları (DERSLER'e işlendi): (1) kapsül CLI çıktısı içerik doğrulaması DEĞİLDİR — `planHashOf(nodes)` goal/repo'yu hash'lemez; 4 çöp kapsül sağlıklı görünüp FATAL üretti (goal='$g' genişlememiş değişken + repo tırnağı değer içinde); (2) dispatcher FATAL reason kalıcı yapılmıyor — teşhis yan-kanıtla (transport repro + defter okuma) yapılabildi; (3) bash→node -e katmanı path tersbölülerini yer — path taşıyan argümanlar script dosyasında yaşar.
- [insan] düdük bekleyenler: **"S7 koş"** (mini-turnuva; plan hazır: plans/KUYRUK-PLAN-3SUBAGENT-2026-10-27.md) · **"A3 başla"** (kritik yol ucu; plan hazır: aynı dosya) · S2 · S5/S6 (S1 sonrası) · S3-STOP (kendi senaryosu) · K-0044 (paralel tarafın anahtar→env penceresi) · K1 tag onayı (v0.24+) · D-1b ELLE TEST · D-2 chat (ertelenebilir).
- Dürüst notlar: tanılama oturumu dk-test-s1repro silindi (amaç teşhisti); mahmur kapsül run-b0ce3f7e içerik doğrulamasız sürüldüğü için yandı (ders 1'in bedeli); 4 uyur çöp kapsül defterde append-only olarak durur (silinmez — kanıt zinciri).

## 15. Graf v9 — FINAL durum (2026-10-27 09:10, Get-Date ölçümlü; S7 mini-turnuva kapanışı sonrası)

S7 koşum dalgası kapandı ([insan] "6 subagent ata" talimatının kuyruğundaki iki dalgadan ilki; S1 kalıbıyla mekanik işletildi): **SIRALI iki zincir** — P1 kapsül **run-1bcba32d** (codex/glm-5.3, thinking high; oturum 04:32:37–04:53:18) + P2 kapsül **run-9b2607fc** (glm53u-codex/glm-5.3, thinking xhigh; oturum 04:51:12–04:58:13; P2'nin CodexMcpElicitation pending izni [insan] kararında KALDI — EK-2) — her ikisi UNKNOWN→recovered (A08), TESTER 10↔10↔TOPLAM:10, evaluate PASS 4/4, decide APPROVED. **KISYAS: candidateHash b7449cd9… AYNI (aynı goal → aynı aday); artifactHash YOL-FARKLI — tek değişken provider, kompozit kimlik sağlam.** Kanıt: raporlar/kanit-hedef/s7-turnuva-2026-10-27.md (+ p1-codex/p2-glm53u ajan artefaktları) · kabul.csv **S7-SEN GECTI_CANLI** (kanal d/h/x koşum dalgasına ait DEĞİL — M02/S1 emsali).

**Graf v9 taze durumu (8/8 kontrol PASS programatik — ölçümlü: 24 düğüm/29 kenar/0 döngü [topolojik sıra 24/24]; çekirdek alan doluluğu 24/24 [testLoc yalnız 6 senaryo düğümünde YOK — 0-test sınıfı]; 10 BEKLE'nin bağımlılığı dolu; kronoloji v1..v9):**
- KAPALI: **T0** (80fdb4a) · **S1** (run-f911b84d) · **S7** (run-1bcba32d + run-9b2607fc) · **A1** (e70dd55) · **A2** (45bd046) — **5/24**; kalan ~1685 kod / **~760 test (ölçümlü; v8'e kadar taşınan 890'da A1'in 130'u düşülmemişti — dürüst düzeltme bu sürümde)**.
- **Kritik yol ucu: A3** (bağımlılığı A2✓) → A4 → K1. A3'ün kod dalgası kanal taşır (koşum dalgaları taşımaz).
- Bu dalganın canlı bulgusu (DERSLER'de): kapsül üretimi bileşik komuta GÖMÜLMEZ — CLI idempotent değildir; P2 öncesi tek bileşik komut deftere 3 uyuk kapsül bıraktı (zincirsiz, dokunulmaz append-only kanıt).
- [insan] düdük bekleyenler: "A3 başla" (kritik yol ucu; K-0051 kararları alındı, dalga üretimde) · S2 · S5/S6 (T4'/T5' uçları) · S3-STOP (kendi senaryosu) · S4 (gözlemci turu) · K-0044 (paralel tarafın anahtar→env penceresi) · K1 tag onayı (v0.24+) · D-1b ELLE TEST · D-2 chat (ertelenebilir).

## 16. Graf v10 — FINAL durum (2026-10-27 09:44:25 (Get-Date ölçümü))

A3 (deneyim→kural derleyicisi) KAPALI: kanal d=2026-10-27T09:43:17.0929164+03:00 h=bbbd393 x=0 sureSn=86; DERSLER 177 madde/210 alt-ders → 3 aday → sentez → [insan] toplu onay → AGENTS.md'e 3 kural indi (sayaç 74→77, tavan 80 içinde). Denetçi B1-B5 düzeltmeleri + üretimde yakalanan B6 (provenans çapası: iniş-dedup) ve B7 (eş-taslak idempotansı: ölçüm yüzü) kapatıldı — kanıt raporu raporlar/kanit-hedef/a3-kural-derleyici-2026-10-27.md. Gerçek ölçüm: 476 kod / 392 test satırı (20 test). Kalan: ~1209 kod / ~368 test (ölçümlü). Kritik yol ucu: A0-2→A0-3→A4. Pending [insan]: krl-b0cb1576 toplu onayı (sonraki 3 aday; sayaç 77→80).

## 17. Graf v11 — FINAL durum (2026-10-27 11:59:30 (Get-Date ölçümü); A0 dalga ilk iki düğüm kapanışı sonrası)

A0-2 (asılı run sweep) + A0-5 (L-RT local runner) KAPALI — A0 dalgasının ([insan] onayıyla açılan plans/A0-DALGA-6SUBAGENT-PLANI-2026-10-27.md) ilk iki kod düğümü. Kanallar: **a02-sweep** d=2026-10-27T11:43:06.3865016+03:00 h=280d881 x=0 sureSn=56 (437/437, 2. koşum — 1. koşum x=1: iskelet fake B8-interface + 3 bilinen yük-flake); **a05-lrt** d=2026-10-27T11:44:07.7627073+03:00 h=280d881 x=0 sureSn=60 (437/437, 2. koşum). Kanıt raporları: raporlar/kanit-hedef/a02-sweep-2026-10-27.md + a05-lrt-2026-10-27.md (+ run{1,2,3} log kopyaları) · kabul.csv A0-2/A0-5 PASS. §16'nın pending'i krl-b0cb1576 06:59:08Z'de [insan] onaylandı (280d881; sayaç 77→80 = TAVAN DOLDU — kural derleyicisi sadeleştirme turuna kadar askıda).

**Graf v11 taze durumu (8/8 kontrol PASS programatik — graf SSOT v11 üzerinde gerçek koşuldu; raporlar/simulasyon v11):**
- KAPALI: **T0** (80fdb4a) · **S1** (run-f911b84d) · **S7** (2 zincir) · **A1** (e70dd55) · **A2** (45bd046) · **A3** (bbbd393) · **A0-2** (280d881 dalgası) · **A0-5** (280d881 dalgası) — **8/24**; durum dağılımı KAPALI 8 / HAZIR 8 / BEKLE 8 (24 düğümün üç eşit sınıfı).
- **Kritik yol ucu: A0-3→A4** — A0-3 HAZIR'a döndü (tek bağımlılığı A0-2✓); W-A0-3 yazıcısı 1. deneme API-400 ile öldü (disk temiz — bağımsız doğrulandı), 2. deneme arka planda koşuyor; kapanışı AYRI commit (S7/A3 deseni). A4 [insan] gece-modu açılış kapısını bekler — L-RT sayesinde gece turları Paseo bağımlılığı OLMADAN koşabilir.
- **A0-5'in getirdiği (canlı, 3-koşum kırıl-ölç-düzelt):** glm-5.3 headless'da proxy 400 (sdk sorgu kaynağına kapalı — etkileşim oturumda ÇALIŞIR; model NULL da AYNI 400); `codefastglm53unlimited` uçtan uca ACCEPTED — **METRİK: Paseo'suz koşum duvar-süresi 38.0 sn**; PROVIDER_REGISTRY['claude-code'] ölçülmüş-teke düzeltildi (kırık-ölçülmüş model registry'ye YAZILMAZ).
- **A0-2'nin getirdiği (üretim, R):** tick 11:20 asılı run 3→0 (run-c0ea713b [DERSLER-173: ölen dış oturum defterde RUNNING kalıyordu] + 2 çöp-kapsül run'ı temiz-öldürüldü); kart-döngüsü kapandı (B1); dispatch kapısı (B4).
- **BÜTÇE BİLİNÇLİ REVİZYONU (tavanKural gereği):** kodLocT 2600→~3300, testLocT 1050→~2100 — kapalı-gerçekler plan üstü yaktı (A3 476/275, A0-2 262/60, A0-5 430/230 (R git-diff); denetçi B-vakaları + kanıt-yöntemi testleri hacmi büyüttü); **kalan ölçümlü açık-plan: ~1120 kod / ~570 test**.
- Replan bacağı: A0 dalga açılışı replan TASLAK'ıyla (rpl-03579e06 [insan] onayı bekler — EK-2: `node src/cli.ts replan --onay rpl-03579e06 --confirm "REPLAN ONAYLIYORUM"` [core/ dizininden]; replan.jsonl defter + B7-ikizi eş-taslak idempotansı dalga commit'inde).
- Kira-canlı 2 run (A0-5'in kırık-model deneme bacakları: run-16efb6ef, run-e0fe70c6): 30 dk sessizlikte A0-2 sweep'i kapatır — kanıt raporlarında dürüst not.
- [insan] düdük bekleyenler: **K-SADE kural sadeleştirme (EN ACİL — tavan 80 DOLDU; paket raporlar/gelen-kutu/v7; 15-30 dk karar turu)** · K-0044 (~15 dk) · D-1b ELLE TEST (5 dk) · rpl-03579e06 replan onayı · S2 · S5/S6 · S3-STOP · S4 · A4 gece-modu · K1 tag (v0.24+).

## 18. Graf v12 — FINAL durum (2026-10-27 12:47:40 (Get-Date ölçümü); A0-3 kapanışı — A0 dalga üçüncü düğümü)

A0-3 (gozetimsiz rozet kanıt beslemesi) KAPALI — dalga kapanışı 26a0561'den AYRI commit'tir (graf v11 §17'nin 'kapanışı AYRI commit' taahhüdü yerine geldi). Kanal: **a03-gozetimsiz-besleme** d=2026-10-27T12:47:21.0584862+03:00 h=26a0561 x=0 sureSn=119 (449/449, 2. koşum — 1. koşum x=1: tek kırmızı f3-crash V3-S1.4 [bilinen 15sn manager yük-flake sınıfı; kanal öncesi %100 yük, 15dk 3×<%60 pencere açılmadı — kullanıcı süreçleri; a02/a05 deseni: 2. koşum temiz]). Kanıt raporu: raporlar/kanit-hedef/a03-gozetimsiz-besleme-2026-10-27.md (+ a03-serve-wiring.log) · kabul.csv A0-3 PASS (%65=81/124).

**Ölçüt 'rozet 4/6 bayrağı daemon tarafından besleniyor' — üç katman:**
- **Hermetik** (a0-3-gozetimsiz-besleme.test.ts 12/12, kanal içinde): başarılı tick sonrası kanıt defteri 4 bayrak; KIRMIZI tick BESLEMEZ (fail-closed); besleme hatası daemon'ı öldürmez; tazelik en-yeni-kazanır; bilinmeyen bayrak RED.
- **Serve wiring üretim-şekli koşumu (R)**: cli.ts serve → runDaemon kanitDefteriYolu [env ORDU_KANIT_DEFTERI || KANIT_DEFTERI_YOLU] → resume [taze DB dispatch_paused=1 mandalı] → tick-launched → kanit-besleme kayit=4 {uzlastirma, iptalDogrulama, kullanimOlcumu, grantEtkisi} → stats kanit:{besleme:4,hata:0} (a03-serve-wiring.log verbatim; kayıtlar damga 2026-10-27T09:22:14.171Z).
- **Üretim rozeti fail-closed (R)**: gozetimsiz-kullanilamaz 6/6 ESKI_KANIT — DB bacağı yeşil (unknown=0/teyitsiz-iptal=0/usage_unknown=0/grant-etkisi=0, A0-2 sweep sonrası); rozet yalnız KANIT bacağından kırmızı. **Daemon koşmadan rozet AÇILMAZ — tasarımın kendisi.**

**Graf v12 taze durumu (8/8 kontrol PASS programatik — graf SSOT v12 üzerinde gerçek koşuldu; raporlar/simulasyon v12):**
- KAPALI: **9/24** (T0 · S1 · S7 · A1 · A2 · A3 · A0-2 · A0-5 · **A0-3**); durum dağılımı KAPALI 9 / HAZIR 8 / BEKLE 7.
- **Kritik yol ucu: A4** — iki bağımlılığı da kapandı (A3 [v10] + A0-3 [v12]); tek kapısı **[İNSAN] gece-modu açılış** (EK-2: ajan/proxy açamaz, kullanıcı düdüğü bekler). L-RT sayesinde gece turları Paseo bağımlılığı OLMADAN koşabilir.
- **BÜTÇE BİLİNÇLİ REVİZYONU (tavanKural gereği):** kodLocT ~3300→~3400, testLocT ~2100→~2250 — A0-3 gerçeği (R) +207 kod/+183 test planın (100/60) üstünde yaktı (ölçüt-kapsamı + fail-closed yönleri — A3/A0-2/A0-5 deseni); **kalan ölçümlü açık-plan: ~1020 kod / ~510 test**.
- Dürüst notlar: +60 test planı → gerçek 12 test/183 satır; W-A0-3 1. deneme API-400 glm-5.3 (diske dokunmadı), 2. deneme 12/12 + regresyon 17/17; EPERM (rmSync sqlite tanıtıcı gecikmesi — temizlik koşum-dışı komutla); taze-DB mandalı dersi (serve öncesi resume şart — DERSLER'de); PS 5.1 commit -m çift tırnak bölmesi dersi (-F deseni — DERSLER'de).
- [insan] düdük bekleyenler: **K-SADE kural sadeleştirme (EN ACİL — tavan 80 DOLDU; paket raporlar/gelen-kutu/v7; 15-30 dk karar turu)** · K-0044 (~15 dk) · D-1b ELLE TEST (5 dk) · rpl-03579e06 replan onayı (komut: core/ dizininden `node src/cli.ts replan --onay rpl-03579e06 --confirm "REPLAN ONAYLIYORUM"`) · S2 · S5/S6 · S3-STOP · S4 · **A4 gece-modu açılış (graf v12'de HAZIR — tek kapı bu)** · K1 tag (v0.24+).

## 19. Graf v13 — Tarihsel uygulama projeksiyonu (güncel v14 §20)

Graf damgasi (R): 2026-10-27T18:41:25.530Z. Karar: [onayli ADR](../kararlar/ADR-demir-cekirdek-kademeli-buyume-2026-10-27.md). Politika: [ana plan](PLAN.md).

**PLAN ONAYLI; UYGULAMA/CANLI/HARCAMA EMRI YOK.** HAZIR bagimlilik hazirligidir; secilebilir=false ve uygulamaYetkisi=false iken is baslatilamaz. DC-S0 ilk planlanan istir, baslatilmadi. DC-H1 somut insan kaniti olmadan gece surucusu/otonomi acilmaz.

Asagidaki tablo JSON graf v13 ile ayni 40 kimligi gosterir. Eski acik dugumlerin LOC degerleri tarihcedir ve yeni butceye eklenmez. 9 eski KAPALI kaydi degismedi; 15 eski acik kayit bagimsiz secime kapali.

| ID | Rol | Gorev | Bagimlilik | Ordu uygulama LOC | Ordu test LOC | Pilot kod+test LOC | Durum |
|---|---|---|---|---:|---:|---:|---|
| T0 | paralel-yazici | F6.5-A 2-provider paketi commit | yok | tarihsel | tarihsel | tarihsel | KAPALI (tarihsel kanit korunur) |
| S1 | CODER+TESTER | Ikinci canli run (claw-rehber ozeti) | yok | tarihsel | tarihsel | tarihsel | KAPALI (tarihsel kanit korunur) |
| S3 | KULLANICI | STOP/kesinti kullanici eli | S1, DC-S3 | tarihsel | tarihsel | tarihsel | BEKLE (devralan: DC-S3, DC-S4) |
| S2 | CODERx2+TESTER | Es zamanli ikili (LMS+website) | S1, DC-H2 | tarihsel | tarihsel | tarihsel | BEKLE (devralan: DC-H2) |
| S4 | KULLANICI | Gozlemci turu | S1, DC-S4 | tarihsel | tarihsel | tarihsel | BEKLE (devralan: DC-S4) |
| S5 | CODER | Deadline baskisi senaryosu (capsule --deadline; T5' ucu) | S1, DC-S3 | tarihsel | tarihsel | tarihsel | BEKLE (devralan: DC-S3) |
| S6 | CODER | Gece modu rozeti pano ucu (T4' ucu) | S1, DC-H2 | tarihsel | tarihsel | tarihsel | BEKLE (devralan: DC-H2) |
| A0-1 | CODER | Paseo cancel bacadigi | T0, DC-H1 | tarihsel | tarihsel | tarihsel | BEKLE (devralan: DC-H1) |
| A0-2 | CODER | Asili run sweep | yok | tarihsel | tarihsel | tarihsel | KAPALI (tarihsel kanit korunur) |
| A0-3 | CODER | Gozetimsiz kanit-uretici uc | A0-2 | tarihsel | tarihsel | tarihsel | KAPALI (tarihsel kanit korunur) |
| A0-4 | CODER | Bildirim gercek sender | DC-S6 | tarihsel | tarihsel | tarihsel | BEKLE (devralan: DC-S6) |
| A0-5 | CODER | L-RT: uretim LocalLauncher + provider->CLI esleme (Paseo'suz koşum bacağı) | yok | tarihsel | tarihsel | tarihsel | KAPALI (tarihsel kanit korunur) |
| S7 | MANAGER+TESTER | Mini turnuva (2 provider) | T0, S1 | tarihsel | tarihsel | tarihsel | KAPALI (tarihsel kanit korunur) |
| A1 | CODER | F8 turnuva protokolü (insan-proxy) | S7, A0-1 | tarihsel | tarihsel | tarihsel | KAPALI (tarihsel kanit korunur) |
| A2 | CODER | Replan motoru | A1 | tarihsel | tarihsel | tarihsel | KAPALI (tarihsel kanit korunur) |
| A3 | CODER | Deneyim->kural derleyicisi | A2 | tarihsel | tarihsel | tarihsel | KAPALI (tarihsel kanit korunur) |
| A4 | CODER | Otonom suru surucusu | A3, A0-3, DC-H1 | tarihsel | tarihsel | tarihsel | BEKLE (devralan: DC-S5, DC-S6) |
| EK1-1 | CODER | Benchmark regresyon defteri | DC-S8 | tarihsel | tarihsel | tarihsel | BEKLE (devralan: DC-S8) |
| EK1-2 | CODER | Drift sinyal birlestirici | A1, DC-S6 | tarihsel | tarihsel | tarihsel | BEKLE (devralan: DC-S6, DC-S7) |
| EK1-3 | CODER | Tikanma cozucu proxy | A0-2, DC-S6 | tarihsel | tarihsel | tarihsel | BEKLE (devralan: DC-S6, DC-S7) |
| EK1-4 | CODER | Altin-set problari (M1) | A1, DC-S8 | tarihsel | tarihsel | tarihsel | BEKLE (devralan: DC-S8) |
| EK1-5 | CODER | Cift-sayim meta-metrik (M2) | DC-S8 | tarihsel | tarihsel | tarihsel | BEKLE (devralan: DC-S8) |
| EK1-6 | CODER | Pano aksiyometri satirlari | A4, DC-H2 | tarihsel | tarihsel | tarihsel | BEKLE (devralan: DC-H2) |
| K1 | MANAGER | Kapanis: Z1 + kilit tag | A1, A2, A3, A4, EK1-1, EK1-2, EK1-3, EK1-4, EK1-5, EK1-6, DC-H4 | tarihsel | tarihsel | tarihsel | BEKLE (devralan: DC-H4) |
| DC-S0 | MANAGER+TESTER | Taban ve sinirlar | yok | 60 | 160 | 0 | PLAN HAZIR; BASLAT YOK |
| DC-G0 | KULLANICI+TESTER | Ortam/pilot/kabul ve fizibilite kaniti | DC-S0 | 0 | 0 | 0 | BEKLE (kanit + insan emri) |
| DC-S1 | CODER+TESTER | Onayli sozlesme ve tek kapi | DC-G0 | 400 | 480 | 0 | BEKLE (kanit + insan emri) |
| DC-S2 | CODER+TESTER | Korunan test ve teslim | DC-S1 | 340 | 440 | 0 | BEKLE (kanit + insan emri) |
| DC-S3 | CODER+TESTER | Yasam dongusu ve tuketim | DC-S2 | 420 | 600 | 0 | BEKLE (kanit + insan emri) |
| DC-S4 | CODER+TESTER | Insan kanitli somut pilot | DC-S3 | 180 | 300 | 600 | BEKLE (kanit + insan emri) |
| DC-H1 | KULLANICI+TESTER | Uc somut teslim ve on hata ailesi; insan kabul | DC-S4 | 0 | 0 | 0 | BEKLE (kanit + insan emri) |
| DC-S5 | CODER+TESTER | Kalici sabit-plan surucusu | DC-H1 | 460 | 520 | 0 | BEKLE (kanit + insan emri) |
| DC-S6 | CODER+TESTER | Sinirli onarim ve hazirlama | DC-S5 | 340 | 460 | 160 | BEKLE (kanit + insan emri) |
| DC-H2 | KULLANICI+TESTER | Sinirli otomatik hazirlama kaniti; final insan kabul | DC-S6 | 0 | 0 | 0 | BEKLE (kanit + insan emri) |
| DC-S7 | CODER+TESTER | Stratejik replan onerisi | DC-H2 | 400 | 480 | 0 | BEKLE (kanit + insan emri) |
| DC-S8 | CODER+TESTER | Olculmus ogrenme ve kalibrasyon | DC-S7 | 460 | 560 | 0 | BEKLE (kanit + insan emri) |
| DC-H3 | KULLANICI+TESTER | Strateji onerisi ve ogrenme deneyi; insan karari | DC-S8 | 0 | 0 | 0 | BEKLE (kanit + insan emri) |
| DC-S9 | CODER+TESTER | Deterministik yetkili terfi | DC-H3 | 380 | 520 | 0 | BEKLE (kanit + insan emri) |
| DC-S10 | CODER+TESTER | Temsili kampanya ve surum | DC-S9 | 380 | 600 | 280 | BEKLE (kanit + insan emri) |
| DC-H4 | KULLANICI+TESTER | Butun kritik kapilar ve temsili kampanya; surum onayi | DC-S10 | 0 | 0 | 0 | BEKLE (kanit + insan emri) |

**Aktif butce (T):** 3.820 Ordu uygulama/degisiklik + 5.120 Ordu test + 1.040 ayri pilot = **9.980 teknik LOC**; yuzde 35 rezervli **13.473**, dokuman **920** ayrica. Ilk H1: **3.980**, rezervli **5.373**, dokuman **400** ayrica. Eski 1.020/510 kalan butcesi ikinci kez eklenmez.

**Kritik yol:** DC-S0 -> DC-G0 -> DC-S1 -> DC-S2 -> DC-S3 -> DC-S4 -> DC-H1 -> DC-S5 -> DC-S6 -> DC-H2 -> DC-S7 -> DC-S8 -> DC-H3 -> DC-S9 -> DC-S10 -> DC-H4. Ilk planlanan paket DC/F0-F1; DC/F2-F4 ayri devam onayi ister. Kapi dugumlerinin 0 LOC olmasi insan zamani/harcamanin sifir oldugu anlamina gelmez.

**Kabul:** DC-S0..DC-S10 yalniz NOT_RUN acildi. Yeni basari, test kosumu veya urun puani artisi yok.

**Yetki:** Eski proxy tablosundaki izinler kendi basina gecerli yeni grant degildir; yalniz acilmis is ve verilmis dar yetki icinde uygulanabilir. Bu revizyonda otomatik replan, gece modu veya final kabul acilmadi.

## 20. Graf v14 — Uc denetci sonrasi guncel projeksiyon

Tek otorite: [PLAN v2.10.1 §25](PLAN.md). [Denetim karari](../kararlar/ADR-dc-3-denetci-sonlandirma-2026-10-28.md). [Bulgular](../raporlar/plan-3-denetci-2026-10-27/OZET.md).

**UYGULAMA/CANLI/HARCAMA YOK; yeniden tahmin butcesi ONAY BEKLER.** Statik aktif/secilebilir/yetki alanlari planlama metadatasidir; mevcut tum okuyucularda uygulanmis runtime siniri iddia edilmez. Kart/tiklama gorev baslatma veya insan karari degildir.

Aktif yurutme: **DC-S0 -> DC-G0 -> DC-S1 -> DC-S3 -> DC-S2 -> DC-S4 -> DC-H1 -> DC-S5 -> DC-S6 -> DC-H2 -> DC-S7 -> DC-S8 -> DC-H3 -> DC-S9 -> DC-S10 -> DC-H4**. DC-S0 icinde S0a salt-okur kesif, S0b ise ayri dar izinli saglayicisiz sinamadir. S3 yasam/yazma kapanisi S2 muhurlu aday/test kapisindan once gelir; sprint kimligi yeniden numaralanmaz.

| ID | Onkosul | Ilk nominal teknik LOC (T, tarihsel) | Guncel karar |
|---|---|---:|---|
| DC-S0 | yok | 220 | NOT_RUN; baslatma ve butce onayi yok |
| DC-G0 | DC-S0 | 0 | Insan kanit karari ve sonraki faz baslatma kaydi AYRI, ikisi de bos |
| DC-S1 | DC-G0 | 880 | NOT_RUN; baslatma ve butce onayi yok |
| DC-S3 | DC-S1 | 1020 | NOT_RUN; baslatma ve butce onayi yok |
| DC-S2 | DC-S3 | 780 | NOT_RUN; baslatma ve butce onayi yok |
| DC-S4 | DC-S2 | 1080 | NOT_RUN; baslatma ve butce onayi yok |
| DC-H1 | DC-S4 | 0 | Insan kanit karari ve sonraki faz baslatma kaydi AYRI, ikisi de bos |
| DC-S5 | DC-H1 | 980 | NOT_RUN; baslatma ve butce onayi yok |
| DC-S6 | DC-S5 | 960 | NOT_RUN; baslatma ve butce onayi yok |
| DC-H2 | DC-S6 | 0 | Insan kanit karari ve sonraki faz baslatma kaydi AYRI, ikisi de bos |
| DC-S7 | DC-H2 | 880 | NOT_RUN; baslatma ve butce onayi yok |
| DC-S8 | DC-S7 | 1020 | NOT_RUN; baslatma ve butce onayi yok |
| DC-H3 | DC-S8 | 0 | Insan kanit karari ve sonraki faz baslatma kaydi AYRI, ikisi de bos |
| DC-S9 | DC-H3 | 900 | NOT_RUN; baslatma ve butce onayi yok |
| DC-S10 | DC-S9 | 1260 | NOT_RUN; baslatma ve butce onayi yok |
| DC-H4 | DC-S10 | 0 | Insan kanit karari ve sonraki faz baslatma kaydi AYRI, ikisi de bos |

**Tarihce:** 24 eski dugum aktif yurutme/butce secimine kapali. 9 KAPALI durum ve kanit metni korunur; 15 acik is devredilmis/ertelenmistir. Eski baglar tarihselBagimli/tarihselKenarlar alaninda; aktif kenarlar yalniz 16 DC dugumu arasindadir (15 kenar). Tarihsel A1->A0-1 bagindan bugunku onkosul kapanisi sonucu cikarilmaz.

**Kapilar:** DC-G0 [DC-S0]; DC-H1 [DC-S1,DC-S3,DC-S2,DC-S4]; DC-H2 [DC-S5,DC-S6]; DC-H3 [DC-S7,DC-S8]; DC-H4 [DC-S9,DC-S10]. Her karar plan/graf kimligi, kanit, dogrulanmis insan, kapsam, tarih, butce ve deadline baglar. Son sprint PASS karari, yeni faz baslatma yetkisi degildir. Bos kayit kirmizi kalir.

**Guncel sartli yeniden tahmin (T): H1 5.880-9.450; butun yol 12.320-19.390 teknik LOC.** Eski 3.980/9.980 ve yuzde 35 rezervli rakamlar ilk nominal tarihcedir. Yeni aralik eski butceye EK DEGIL, ayni paketlerin yeniden tahmini; eski rezerv tekrar eklenmez. Hazir secili OS siniri ve kullanim kaynagi yoksa ayri altyapi tahmini ve insan karari gerekir.

**Veri uyumlulugu:** Eski tuvalin metin bekledigi kodLocT gorunum metnidir; aritmetik orduUygulamaLocT ve diger sayisal alanlarda, guncel aralik teknikButceGozdenGecirme altindadir. Bu dar veri duzeltmesi urun kodunda genel tip/yetki denetimi yazildi demek degil.

**Kabul:** DC-S0..S10 dahil 135 kayit degismedi; 11 yeni sprint NOT_RUN. Bu denetim kalite puani veya kabul yesili uretmez.
