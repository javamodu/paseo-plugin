# Kapsul-Ordu-Master-v5.0-Plan — derin analiz (2026-10-14)

Çerçeve v3.2 (sabit 15 alan). Etiketler: TASARIM-EKSIK / UYGULAMA-EKSIK / KANIT-EKSIK / BASARISIZ. Canlı kanıt yok → tavan 8. (R)=bu turda çalıştırıldı/diskten doğrulandı, (T)=tahmin.

## Doğrulanan iddialar (R)
- `python tools/check_plan.py` → **exit 0**: `PASS_PLAN_INTEGRITY` — JSON parse, 40 benzersiz NOT_RUN/UNKNOWN gate, 16 sıralı backlog task, 15 metrik ağırlığı toplam 100, kapalı draft şema şekilleri, 63 kaynak INDEX hash'i, node_modules yok. Checker kendi sınırını beyan ediyor: "NO runtime tests; full JSON Schema/production validator değil".
- `tests/ACCEPTANCE.csv` 40/40 satır `NOT_RUN`/`UNKNOWN`, `design_status=DRAFT`, `implementation_status=NOT_ASSESSED`; sahte PASS yok (checker + göz, R).
- `tests/NEGATIVE-FIXTURES.json`: 26 fixture, tamamı `executed:false` (R).
- `STATUS.json`: `productionImplemented:false`, `approval:PENDING`, tüm runtime/benchmark/native alanları NOT_RUN, `planIntegrityCheck:PASS_PLAN_INTEGRITY_ONLY` — checker çıktısıyla birebir uyumlu (R).
- `PACKAGE-MANIFEST.json` byte integrity: MASTER-PLAN.md SHA256 manifestle eşleşti (spot check, R); sources/INDEX.json 63 kaydın tamamı checker tarafından hash-doğrulandı (R).
- `contracts/draft.schema.json` 9.983 bayt: tüm `$defs` kapalı object (`additionalProperties:false`, required⊆properties); `handoff.example.json` şema property setiyle birebir, `usage.coverage=UNKNOWN`, tüm checks NOT_RUN (R). v4'teki 148 KB şema burada bilinçli biçimde küçük bir "shape sözleşmesi"ne indirgenmiş; production'a tek TypeBox migration B00/B01'de planlanıyor (`contracts/README.md`).
- Legacy referans `inputs/ordu-core` temp kopyada koşuldu (kaynak ağaç değiştirilmedi): `npm ci` → **exit 0**; `npm run probe` → **exit 0** (fail-closed capability receipt: blocked listesi dolu, spawn kapısı kapalı — küçük ama gerçek canlı kanıt); `npm test` → **exit 1, 100/102 PASS, 2 FAIL**.
- 2 FAIL'in kökü: `test/adapter-evaluator.test.ts:46` ve `test/cli.test.ts:52`, repo-içi `evidence/probe-latest.json` bekliyor ama paket bu dosyayı içermiyor (ilk koşuda ENOENT); probe sonrası ise testlerin sabitlediği `now=2026-10-13T19:00Z`'den daha yeni üretilen receipt `src/capabilities.ts:28` tazelik kapısında "BAYAT" reddediliyor. Yani suite zaman-sabitli fixture eksikliğinden paketlendiği haliyle yeşil değil — paket bunu saklamıyor: `inputs/README.md` "bu paketleme test çalıştırmadı" ve 10 bilinen P0 riskini açık listeliyor (dürüstlük +, yeşillik −).
- Bench: `METRICS.csv` 15 satır, `design_review_weight` toplamı 100 (R); `PLAN.md` role-specific pilot + tam payda + maliyet muhasebesi.

## Alan tablosu
| Alan | Ağırlık | Puan | Durum |
|---|---:|---:|---|
| Teslim | 14 | 8 | KANIT-EKSIK — 16 task'lık BACKLOG↔40 gate eşlemesi makine-doğrulanıyor (R), `accepted≠delivered≠merged`, idempotent delivery sink + UNKNOWN/at-least-once dürüstlüğü; ilk gerçek teslim T16 NOT_RUN |
| Yetki/güvenlik | 13 | 8 | KANIT-EKSIK — TRUST.md uçtan uca: server-auth actor, deny>allow>default-deny, grant expiry/budget/path binding, protected receipt full-tuple, sandbox/worktree ayrımı; fail-closed probe gerçekten koşup spawn'ı kapattı (R); T07/T14/T20 NOT_RUN |
| Halüsinasyon/kanıt | 10 | 8 | En güçlü alan: STATUS/manifest/checker üçlüsü tutarlı ve kendini sınırlıyor, 26 negatif fixture `executed:false`, kaynak hash'leri doğrulandı (R); legacy suite'in 2-FAIL hali bile beyanla uyumlu |
| Long-run/recovery | 10 | 8 | KANIT-EKSIK — UNKNOWN=no-blind-respawn, STOP latch requested≠confirmed, checkpoint/rebuild, restore-paused+reconcile, goal-long-run plateau/independent-metric; T09–T12/T38 NOT_RUN |
| İzleme | 8 | 6 | UYGULAMA-EKSIK — taze UX-SPEC (5 cevap, dataAge/stale badge, STOP ayrımı UI'da) + SSE cursor/replay/dedupe API tasarımı; çalışan UI kodu hiç yok (v4'teki byte-identical demo da yok — dürüst ama kanıtsız) |
| Otonomi | 7 | 7 | Standing grant + bounded autonomy (T24), kapalı 10 kategorili tek Kararlar kuyruğu, ön-yetkili normal akış; oto-kabul kapısı NOT_RUN |
| Manager | 6 | 7 | Manager=plan öneren LLM, deterministic admission ayrı; kendi yetkisini/bütçesini değiştiremez; durable typed context'ten memory rebuild; roller draft brief olarak ayrık |
| Handoff | 5 | 7 | UYGULAMA-EKSIK — semantic guard listesi (stale fence, forged receipt, expanded scope) + kapalı draft şema + unaccepted örnek (R); production TypeBox'a taşınmamış, paket bunu açık söylüyor |
| Coding | 5 | 6 | 3 kapalı recipe graph (repair/test-design/reasoning, `maxRepairs:2`), FIRST-TASK scope disiplini; legacy ordu-core'da store/dispatcher/handoff kodu + 100 geçen test kısmi referans kanıtı (R) ama "authority değil" etiketli; gerçek runner T16 NOT_RUN |
| Reasoning | 4 | 5 | Read-only reasoning recipe + known-answer/citation/fake-source kapıları (T32) + `reasoner-fake-citation` negatif fixture; ölçülmüş rubric yok |
| Paralellik | 4 | 6 | 1 slot başlangıç, 2 slot ancak fault gate sonrası; ayrı resource pool'lar, fair queue, child accounting zorunlu (T25/T26 NOT_RUN) |
| Schedule | 4 | 6 | KANIT-EKSIK — ONCE+UTC INTERVAL, unique(scheduleId,revision,scheduledUTC), SKIP misfire, DST dürüstlüğü; v4'teki PASS reference testler bu pakette yok, T27/T28 NOT_RUN |
| Memory | 4 | 7 | Casebook QUARANTINED→REPRODUCED→VALIDATED→EXPIRED/REVOKED, provenance/scope-version binding, paired holdout+canary+rollback; T34/T35 NOT_RUN |
| Hız/maliyet | 3 | 7 | BUDGET.md: unknown≠0, moneyMicros, tam payda (fail/cancel/timeout dahil), capacity-wait retry yakmaz; 15 metrik ağırlığı toplam 100 (R); pilot ölçümü S1+ |
| Taşınabilirlik | 3 | 7 | D03/D04: Paseo opsiyonel, UIHostAdapter≠RuntimeAdapter, T22/T33 parite kapıları, BLOCKED_CAPABILITY dürüstlüğü; Node 24 + node:sqlite stdlib tabanı taşınabilir |

**Ağırlıklı toplam: 71,8 / 100**
(8×14 + 8×13 + 8×10 + 8×10 + 6×8 + 7×7 + 7×6 + 7×5 + 6×5 + 5×4 + 6×4 + 6×4 + 7×4 + 7×3 + 7×3 = 112+104+80+80+48+49+42+35+30+20+24+24+28+21+21 = 718)

## İlk 3 açık
1. **Production runtime yok** (UYGULAMA-EKSIK) — 40/40 acceptance NOT_RUN, `productionImplemented:false`; ilk gerçek coding teslimi T16 kapısı koşulmamış. Kod yeri: `delivery/BACKLOG.csv` B00–B03, `tests/ACCEPTANCE.csv` T16. Kabul testi: gerçek source patch → protected suite → receipt → authorized bundle, receipt'li PASS.
2. **Legacy ordu-core suite paketlendiği haliyle yeşil değil** (UYGULAMA-EKSIK) — `npm test` exit 1, 100/102; 2 test zaman-sabitli `evidence/probe-latest.json` fixture'ı eksikliğinden fail (test `now=2026-10-13T19:00Z` sabitliyor, taze probe "gelecekten" sayılıp BAYAT reddediliyor). Kod yeri: `inputs/ordu-core/test/adapter-evaluator.test.ts:46`, `inputs/ordu-core/test/cli.test.ts:52`, tazelik kapısı `inputs/ordu-core/src/capabilities.ts:28`. Kabul testi: pakete pinned-now uyumlu probe fixture'ı eklenip (veya testler fixture üretecek şekilde düzeltilip) temp kopyada `npm ci && npm test` → exit 0. Durum: AÇIK (bu turda yeniden üretildi, R).
3. **Contracts production'a taşınmamış** (TASARIM tamam / UYGULAMA-EKSIK) — `contracts/draft.schema.json` yalnız 9.983 baytlık kapalı shape sözleşmesi; tek TypeBox SSOT migration B00/B01'de planlı, `fullSchemaValidation:NOT_RUN`. Kod yeri: `contracts/README.md`, `tests/ACCEPTANCE.csv` T01. Kabul testi: T01 — missing/extra/wrong binding negatifleri tek typed authority üzerinde PASS.

## v4.0 ile karşılaştırma
v5, v4'ün "byte-identical korunan v3 çekirdeği + kanıt disiplini zarfı" formülünü terk edip entegre bir v5 tasarımına geçiyor: kapanış defteri (20 CLOSURES) yerini makine-doğrulanır 16 task ↔ 40 gate eşlemesine (BACKLOG+ACCEPTANCE, checker'la topolojik sıra ve referans bütünlüğü test ediliyor, R), 148 KB monolitik şema yerini bilinçli biçimde küçültülmüş kapalı draft shape + açık TypeBox migration planına, byte-identical eski UI demosu yerini kodsuz ama tutarlı UX-SPEC/API tasarımına bırakıyor. En büyük yapısal fark: v5 artık gerçek kod taşıyor — `inputs/ordu-core` referansı temp kopyada koşuldu ve 100/102 PASS verdi; 2 FAIL paketin kendi dürüstlük beyanıyla ("bu paketleme test çalıştırmadı") uyumlu, yani halüsinasyon değil fixture borcu. Buna karşılık v4'ün elindeki iki R-kanıtı (domain 32/32 + autonomy 62/62 PASS, schedule reference testleri) v5'te karşılıksız: schedule alanı bu yüzden 7→6 düştü. Net: +1,6 puan (70,2→71,8); artış teslim izlenebilirliği, izleme tasarım tazeliği ve çalıştırılabilir referans kodun varlığından, eksilme v4'ün kanıtlanmış reference suite'lerinin v5'e taşınmamasından geliyor.

## Hüküm
v5.0, "integrated-plan-draft" adını hak eden, kendi kanıt sınırını her yüzeyde (STATUS, PLAN-QA `notChecked`, checker çıktısı, inputs README) tutarlı beyan eden bir tasarım paketi; plan bütünlüğü bugün exit 0 ile doğrulanabilir durumda ve fail-closed probe'un gerçekten spawn kapattığı küçük bir canlı kanıt bile var. 71,8 puanın tamamı tasarim kalitesi + offline/plan düzeyi kanıttır; canlı kanıt tavanı (8) dört ağır alanı (Teslim, Yetki, Halüsinasyon, Recovery) bastırmaya devam ediyor — T01–T19 kapanmadan bu tavan kalkmaz ve kalkmamalı. Legacy suite'in 2-FAIL hali skoru kırmıyor çünkü paket bunu hiç PASS diye sunmadı; ama B00 adoption'ın ilk işi bu fixture borcunu kapatmak olmalı.
