# S1 ikinci canlı run kanıtı — claw-rehber özeti (2026-10-27)

İlgi: graf v7 S1 düğümü ("İkinci canlı run (claw-rehber özeti)"; ölçüt "rapor satır sayısı = disk .md sayısı; TOPLAM:N birebir"; dizin raporlar/kanit-hedef; rol CODER+TESTER; loc 0; kapı [INSAN] "koş" düdüğü — verildi) · plans/ORDU-SENERAYOLARI-2026-10-26.md S1 senaryosu (kapsül metni birebir) · M02 ilk canlı run emsali (run-ce03ca55) · 3-subagent planı (plans/KUYRUK-PLAN-3SUBAGENT-2026-10-27.md).

Etiket: (R) — gerçek koşum zinciri; üretim defteri `core/data/ordu.sqlite` (ORDU_DB açık verildi — iki-defter tuzağına dikkat: `core/veri/ordu.sqlite` pano-start izidir).

## Koşum zinciri (canlı koşum: run-f911b84d)

| Adım | Komut | Sonuç |
|---|---|---|
| Önkoşul: HEAD | `git rev-parse HEAD` = `396857fc21791ff03dbc6cb1a20b6c65b61bc98` | ✓ |
| Önkoşul: defter | `status` → globalStop:false, reserved:0, unknown:0 (kuyruk başında; son olay RUN_ACCEPTED run-f65iki) | ✓ resume GEREKSİZ |
| Önkoşul: probe | evidence/probe-latest.json generatedAt 2026-10-26T21:11:25Z (yerel 00:11:25); age her iki tick'te de 24 saatlik pencere içinde; hash/blocked taze | ✓ |
| --commit türetmesi | **sha256(HEAD-hash-string)** = `75a7c463da9673de5460e376b54a29b8acac3e6ba9409acbc7d76a4f1cbcc54a` (M02 raporunda kısaltılmıştı — bu raporda TAM değerle dokümantasyon borcu kapanır) | ✓ |
| 0. Çöp kapsüller (4 adet, dürüst kayıt) | run-32cbfae2 + run-b0ce3f7e (kullanıcı terminalinden çift koşum) ve run-91af1888 (operatör) — içerdikleri: `goal="$g"` (genişlememiş değişken), `repo_id="'D:\Vibecode\ordu'"` (tırnak değer içinde) / run-91af1888: `repo_id="D:Vibecodeordu"` (bash→node -e tersbölü yenmesi). Defterde uyur/dokunulmaz (append-only). Ayrıntı dürüst notlarda. | FATAL×2 (amaç tanılama sağladı) |
| 1. Kapsül (temiz, 5.) | `node tmp-s1-capsule.mjs` → execFileSync arg-dizisi (shell'siz): goal UTF-8 dosyadan birebir, repo `D:\Vibecode\ordu`, commit 75a7c4…, provider codex/glm-5.3. **Defterden doğrulandı ÖNCE**: goal_birebir=true, repo_id="D:\Vibecode\ordu" | runId=run-f911b84d planHash=13075b3e524e5d54c767339a3555639ba4f702c26f7100da49a141382692e89c |
| 2. Onay | `approve --run run-f911b84d --plan-hash 13075b3e…` (actor insan:cli — kullanıcının açık "otomatik yap" talimatıyla, bu zincir için) | ✓ approved |
| 3. Dispatch | `dispatch --run run-f911b84d` | attemptId=att-3f9cb985 |
| 4. Canlı spawn | `ORDU_LIVE=1 node src/cli.ts tick` | spawn gerçekte OK ama exec 120 sn aşımına takıldı → outbox result `unknown` → AYNI tick'in reconcile'u lookup ile oturumu buldu → `recovered` → SESSION_BOUND (`recovered:dk-run-f911b84d-n1`, outbox SENT). Paseo oturum `35195156-c4c2-4bc8-b2fb-7f5859aff3fd` (ordu:dk-run-f911b84d-n1) RUNNING; ajan görevi işliyor | ✓ ajan canlı |
| 5. TESTER bağımsız sayım | operatör (bu oturum) bağımsız taradı: `ls -1 *.md` (üst seviye, claw-rehberleri) = **10**; rapor veri-satırı (TOPLAM hariç) = **10**; diff tek fark `TOPLAM:` (dipnot satırı — veri değil); `TOPLAM: 10` dipnotu uyumlu | ✓ disk=10 satır=10 TOPLAM=10 BİREBİR |
| 6. Değerlendirme | `evaluate --run run-f911b84d --attempt att-3f9cb985 --artifact hedef-claw-rehber-ozeti.md --expect "TOPLAM:"` | ✓ PASS 4/4 (sembolik-bag-yasak / dosya-var / bos-degil / icerik-beklenti); candidate b7449cd9…, evidence e0c597e6…, settled NODE_DONE |
| 7. Karar | `decide --run run-f911b84d --approve` | ✓ decision APPROVED, status ACCEPTED, runState=**ACCEPTED** (apv-6cd2de76) |

**Paseo oturum kaydı (R, `paseo inspect`):** id `35195156-c4c2-4bc8-b2fb-7f5859aff3fd` · name ordu:dk-run-f911b84d-n1 · provider **codex** · model **glm-5.3** · mode auto (Default Permissions) · status idle · Created 2026-10-27T04:00:01Z → Updated 2026-10-27T04:04:29Z (**~4,5 dk**) · usage: Input 79521 / Output 584 / Cached 79104 / CostUsd 0 · PendingPermissions: [] (workspace-dışı okuma — D:\Vibecode\claw-rehberleri — auto modda engelsiz geçti; plandaki risk gerçekleşmedi).

Damga: 2026-10-27 07:05:04 (Get-Date ölçümü).

## Ölçüt karşılaması (graf S1)

- **"rapor satır sayısı = disk .md sayısı; TOPLAM:N birebir"**: ✓ — TESTER bacağı bağımsız saydı: disk üst-seviye .md = 10 ↔ rapor veri satırı = 10 ↔ `TOPLAM: 10` (birebir; sahte-yeşile kapalı — sayım ajan çıktısına değil diske baktı) + CLI evaluate 4/4 temel denetim PASS.
- Sayım semantiği (operatör kararı, koşum öncesi sabitlendi): kapsül metni "dizindeki .md dosyalarını" der → **ÜST SEVİYE** .md (alt dizin `archive\` hariç). Planlayıcı taraması: üst seviye 10, özyinelemeli 27 — kapsül ajan üst seviyeyi saydı, raporla birebir.

## Dürüst notlar

- **(a) Çöp kapsüllerin teşhisi (R, defter):** kullanıcının terminalinden atılan iki kapsül (run-32cbfae2, run-b0ce3f7e) `goal="$g"` + `repo_id="'D:\Vibecode\ordu'"` içeriyordu — PowerShell değişkeni genişlememiş, repo tırnakları DEĞERE sızmış. JSON çıktısı (runId/planHash) sağlıklı görünüyordu çünkü **planHashOf(nodes) goal/repo'yu hash'e SOKMAZ** — kapsül çıktısı içerik doğrulaması değildir.
- **(b) FATAL×2 ve gözlemlenebilirlik açığı:** ilk tick (run-32cbfae2) ve ikinci tick (run-b0ce3f7e mahmur kapsülüyle) FATAL döndü; dispatcher FATAL **sebebini kalıcı yapmaz** (result sınıfı yazar, reason düşer) — teşhis ancak yan-kanıtla mümkün oldu. Ders adayı: FATAL reason'u outbox satırına/en azından olay defterine yazılmalı.
- **(c) Transport izolasyon tanılaması (R):** `dk-test-s1repro` spawn'ı (adapter'ı atlayıp transport'ı doğrudan çağıran tmp-s1-repro.mjs) BAŞARILI — sessionId fe71f16d…; kanıt: provider/transport/daemon/workspace yolu sağlıklı, FATAL adapter ÖN-kapısından geliyor. Tanılama oturumu `paseo delete` ile silindi (ordu:dk-test-s1repro, amaç tanılamaydı).
- **(d) Operatör hatası — mahmur kapsülü yakmak:** run-b0ce3f7e zincirini defter içeriğini DOĞRULAMADAN sürdüm (approve→dispatch→tick→FATAL). Pastalanan capsule JSON'u runId verir, içerik garantisi vermez; zincir sürmeden ÖNCE defter satırı okunmalıydı. Ders adayı.
- **(e) Bash→node -e tersbölü tuzağı:** 4. kapsül (run-91af1888) exec arg-dizisiyle yaratıldı ama `node -e` script'i bash çift-tırnağından geçerken repo tersbölüleri yenildi (`D:Vibecodeordu`) — goal (dosyadan) birebir doğru geçmişti. Kök çözüm: yolu TAŞIYAN argümanlar script DOSYASINDA yaşar (tmp-s1-capsule.mjs), shell katmanına hiç girmez.
- **(f) Spawn-UNKNOWN→recovered:** tick'in exec aşımı (120 sn) spawn'ın BAŞARISIZ olduğu anlamına gelmiyor — daemon oturumu yaratmıştı, reconcile lookup'la (dispatchKey) bulup bağladı (`recovered:dk-run-f911b84d-n1`, delivery_count=1). A08 kör-retry yasağı sayesinde çift spawn OLMADI.
- **(g) Onay aktörü dürüstlüğü:** `approve` insan:cli aktörüyle koşuldu; kullanıcı bu zinciri açıkça otomatikleştirmemi emretmişti ("Sen buislemleri otomatik yap") ve görev düdüğü ("S1 koş") kullanıcıdan geldi. EK-2 proxy-onay yasağı [insan] sözleşme kapıları içindir; bu turda CLI zinciri kullanıcı emriyle işletildi — rapora aynen işlenir.
- **(h) Kanal sınıfı:** bu koşum dalgası kanıt d·h·x TAŞIMAZ (M02 emsali — kanal koşumu kod+test dalgalarına aittir); kabul sınıfı GECTI_CANLI hedefi.

## Kanal üçlemesi

- (koşum-dalgası sınıfı: KANAL YOK — GECTI_CANLI, M02 emsali; kanal d/h/x yalnız kod+test dalgalarında koşar)
