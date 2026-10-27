# GÖREV GRAFİ BULUTU — MANAGER·CODER·TESTER·PROXY SENARYOSU (2026-10-26)

> İnsan-okur ikiz. Makine-okur kardeş: `gorev-grafigi-2026-10-26.json` (aynı ID'ler). Ajan bu iki dosyayı SSOT kabul eder; çelişkide JSON kazanır (makine sözleşmesi) + rapor edilir.
> Kurulum bitti: manager/coder/ordu belirlendi, hedefler kondu, kurulum-test aşaması çıkarıldı. Bu belge ARTIK ÇALIŞMA senaryosudur.

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

## 4. Görev tablosu (insan+makine ortak; JSON'da aynı ID'ler)

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
| A0-2 | Asılı run sweep | coder | core/src/supervisor | c0ea713b deseni kapanır; +40 test | — | 60+40 | HAZIR |
| A0-3 | Gözetimsiz kanıt-üretici uç | coder | core/src+daemon | rozet bayrakları besleniyor; +60 test | A0-2 | 100+60 | BEKLE |
| A0-4 | Bildirim gerçek sender | coder | core/src/notify | kart size ULAŞIR; +40 test | — | 80+40 | HAZIR |
| A0-5 | **L-RT: üretim LocalLauncher + provider→CLI eşleme** (Paseo'suz koşum bacağı) | coder | core/src/local-runtime + providers | `ORDU_RUNTIME=local` gerçek CLI süreci + durable pid registry; claude-code/gemini-cli bilinçli registry girişleri | — | 230+60 (150 L-RT + ~40/CLI) | HAZIR (v4) |
| S7 | Mini-turnuva (2 provider) | manager+tester | core | 2 run kıyas tablosu | T0 commit + S1 | 0 | **KAPALI (v9: SIRALI iki zincir 2026-10-27 — P1 run-1bcba32d [codex/glm-5.3] ACCEPTED 04:49:06 + P2 run-9b2607fc [glm53u-codex/glm-5.3] ACCEPTED 04:57:53; TESTER bağımsız sayım 10↔10↔TOPLAM:10 ×2, evaluate PASS 4/4 ×2; KISYAS: candidateHash b7449cd9… AYNI (goal senaryosu aynı), artifactHash YOL-FARKLI [1f873de2… vs 26f39427…] — tek değişken provider doğrulandı; kanal d/h/x YOK [koşum-dalgası sınıfı, M02/S1 emsali]; §15)** |
| A1 | F8 turnuva protokolü | coder | core/src | K12-01/02+K13-02 kapanır; +130 test | S7 + A0-1 | 400-700 | **KAPALI (F8: commit e70dd55, kabul.csv PASS 13:31)** |
| A2 | Replan motoru | coder | core/src | DRIFT% sürekli; §18 otomatik; +120 test | A1 | 250-400 | **KAPALI (v7: kanal d=2026-10-27T00:12:39 h=45bd046 x=0 etiket a2-replan; core/src/replan.ts + cli 'replan' + 11 hermetik test, tam süit 389/389; kabul A2 PASS; [insan] eşik onayı ölçüm-üzeri açık kapı — §13)** |
| A3 | Deneyim→kural derleyicisi | coder | core/src+DERSLER | ders→kural tavan 80; +90 test | A2 | 200-350 | **KAPALI (v10: kod dalgası 2026-10-27 — kanal d=2026-10-27T09:43:17.0929164+03:00 h=bbbd393 x=0 sureSn=86; DERSLER tarama → 3 aday (ilk parti ≤5, K-0051) → sentez×3 ajan:llm → [insan] TOPLU onay 05:43:06Z → AGENTS.md inişi → sayaç 74→77 ≤ tavan 80; denetçi B1-B5 DÜZELT-İLE-DEVAM + üretim bulguları B6 provenans-çapası / B7 eş-taslak idempotansı bulundu-kapatıldı; hermetik 20/20; gerçek (R) 476 kod/392 test satırı-20 test [plan (T) 275/90 — dürüst not]; pending taslak krl-b0cb1576 [insan] onayı bekler; §16)** |
| A4 | Otonom sürü sürücüsü | coder | core/src/daemon | gece modu açılır; +100 test | A3+A0-3 | 150-250 | BEKLE |
| EK1-1 | Benchmark regresyon defteri | coder | core/src/benchmark | koşumlar damgalı; gerileme sinyali | — | 100 | HAZIR |
| EK1-2 | Drift sinyal birleştirici | coder | core/src | 4 sinyal→tek yeniden-üretim | A1 | 120 | BEKLE |
| EK1-3 | Tıkanma çözücü proxy | coder | core/src | yetki matrisi kodda; kart YASAK testli | A0-2 | 100 | BEKLE |
| EK1-4 | Altın-set probları (M1) | coder | core/test | evaluator isabeti ölçülür | A1 | 120 | BEKLE |
| EK1-5 | Çift-sayıım meta-metrik (M2) | coder | scripts+core | metrik-drift alarmı | — | 100 | HAZIR |
| EK1-6 | Pano aksiyometri satırları | coder | core/src/pano | her adımın metriği görünür | A4 | 80 | BEKLE |
| K1 | Kapanış: Z1 + kilit tag | manager | repo | CODEMAP taze + doctor 0 EKSIK + kilit tag — **NOT (v6): v0.23-kilit 16:2x'te plugin S3 dalgasında DOĞDU (9853bb1); graf K1 sıradaki kilit penceresinde tag'ler (v0.24+ [insan])** | tüm A+EK | 0 | BEKLE |

Toplam (T, graf v10): ~2565 kod (T0+S1+S7+A1+A2+A3 KAPALI — **kalan ~1209**; A3 gerçeği (R): 476 kod/392 test satırı [20 test] düştü, v9 kalan ~1685/~760 ölçümünden) + ~1010 test — **kalan ~368 (ölçümlü)** · kritik yol: T0✓→S7✓→A1✓→A2✓→A3✓→A4→K1 — **A3 kapandı → kritik yol ucu A0-2→A0-3→A4 zinciri (A4 bağımlılığı A0-3 açık; A3 tarafı tamam).** A0-5 kritik yol DIŞI — paralel yetenek: Paseo'suz + claude-code/gemini-cli/codex CLI koşumu. K1 bağımlılığı "tüm A+EK" = A0-1..A4 + EK1-1..6 (A0-5 bilinçli HARİÇ: kritik yol dışı, paralel yetenek; S5/S6 da koşum-senaryosu olduğu için kapanışta zorunlu DEĞİL).

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
