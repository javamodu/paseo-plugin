# ordu-core — ORDU-V3 S0 uygulaması (Faz: Pin + Probe)
> Ürün gereksinimi: Paseo opsiyonel `paseo`/`local` execution; [ADR-012](../kapsul-final-v2.0.0%20notio/governance/ADR-012-local-runtime.md) ve [bağımsız runtime kapısı](../gpt/RUNTIME.md). Bu görev core kodunu değiştirmez. Hermetik test durumları gerçek local/Paseo end-to-end, protected auth/sandbox veya concurrency kabulü yerine geçmez; güncel [negatif denetim](../gpt/proje-denetim-raporu.json) ayrıca kontrol edilir.

Teknik baseline: `kapsul-final-v2.0.0 notio/` (ADR-011). Bu klasör S0'ın
çalışır dilimidir: **B00 probe + B01 kapalı payload sözleşmeleri**.

## Çalıştır
```
npm test            # 122 test (S0 sözleşmeleri + S1 store/dispatcher/adapter+evaluator/cli/local-runtime/git-worktree/modes + supervisor + adapter-contract + metrics + handoff + closure U1–U7 + schedule M08–M10 + reasoning-receipt M18 + agent-lineage D4)
npm run probe       # evidence/probe-latest.json + sha256 receipt
```
Node 24.18 ile `.ts` dosyaları DOĞRUDAN çalışır (type-stripping; build adımı yok).
Store: `node:sqlite` (001 baseline byte-identik kopya + 002-hardening kendi diff'imiz).

## Durum (2026-10-13, kanıtlı)
| Kapı | Durum | Kanıt |
|---|---|---|
| V3-S0.2 / A03+K1 | GEÇTİ | 18/18; negatifler: boş payload, kind-dal uyuşmazlığı, unknown kind, ek alan, hash tutarsızlığı, repairAttempt>2, bozuk date-time |
| V3-S0.1 / A01 (kısmi) | GEÇTİ-kısmi | probe receipt: node pin ✓, git ✓, paseo 0.11.2 ✓, daemon ✓; `blocked: worktreeIsolationProven, sandboxEstablished, structuredOutput, usageReporting, cancelConfirm` → **S1'de gerçek worker ile kanıtlanmadan spawn YOK (fail-closed)** |
| Sync (kapalı küme hijyeni) | GEÇTİ | kind/type kümeleri + zarf alanları baseline schema.json ile birebir; dal zorunluluğu testi |
| **A05** komut dedupe | GEÇTİ | idempotencyKey UNIQUE index + DUPLICATE yolu; commands tek satır kalıyor |
| **A06/A07** atomik dispatch | GEÇTİ | BEGIN IMMEDIATE tx; token_budget RED → reservations/outbox 0 satır (rollback kanıtı); run_capacity tavanı |
| **A16** STOP latch | GEÇTİ | latch açıkken reserveDispatch /global_stop/ RED; kapatınca geçer |
| **A35.1** rezervasyon tavanı | GEÇTİ | `UPDATE tokens=1000` artık `reservation_tokens_immutable` ile RED (baseline probe #1 kapanışı) |
| **A35.2** UNKNOWN→ACTIVE flip | GEÇTİ | `reactivation_forbidden`; mutabakat yalnız SETTLED/RELEASED (baseline probe #2 kapanışı) |
| **A36** minimum stale çit | GEÇTİ | takeLease bump→eski fence commit RED (FenceError); aday hash immutable; fencing monotonik; stale fence ile kanıt RED |
| **A13** store kapısı | GEÇTİ | PASS+0-test CHECK RED; PASS+exit≠0 RED; kanıt yalnız donmuş adayda |
| K1 write-path | GEÇTİ | appendEvent/recordCommand YAZMA ANINDA B01 şemasından geçer; boş payload defteri kirletemez |
| **Dispatcher** A08/A16-S7 | GEÇTİ (deterministik) | fake adapter: latch açıkken spawn 0 çağrı; cevapsız spawn→UNKNOWN + kör re-spawn YOK; reconcile DEAD/ALIVE yolları; 429→gecikmeli PENDING (reserve yanmaz); RUNNING değilse STALE |
| **Adapter + B02 kapısı** | GEÇTİ (hermetik) | gerçek probe receipt: blocked→FATAL, transport'a hiç dokunulmaz; hash tahrifatı/bayatlık/iç tutarsızlık→yükleme RED; ORDU_LIVE=1 beyanı şart; kapılar açıkken dispatch uca kadar ilerler |
| **Evaluator** A11/A13/M19 | GEÇTİ (hermetik) | exit-0+0-test→FAIL; protokol PASS→kanıt; allowlist dışı komut→RED (runner'a ulaşmaz); devir sonrası stale-fence kanıt yazamaz; gerçek node-fixture koşusu PASS kanıtlı |
| **CLI** V3-S1 yürüyüş | GEÇTİ (hermetik) | status/stop/resume sürtünme kapısı (yanlış onay metni latch'i AÇMAZ); tick blocked→exit-2; tick enjekte-adapter→SESSION_BOUND; **bulunan gerçek hata: openStore restart'ta migration tekrarına çöküyordu → user_version damgasıyla idempotent** (V3-S1.4 ön koşulu) |
| **Local runtime (ADR-012)** V3-RT.0 | GEÇTİ (hermetik) | runtime-kapsamlı kapı: paseo yetenekleri blocked iken local kanıtlarıyla spawn DOĞAR; eksik local kanıtı→launcher'a dokunmadan FATAL; ORDU_RUNTIME=local beyanı şart; launch belirsizliği→UNKNOWN kör-re-spawn YOK; registry'siz key uydurma DEAD olmaz; cancel=kill+doğrulanmış DEAD |
| **Git worktree + durable registry (V3-RT.1)** | GEÇTİ (harcamasız, GERÇEK) | `git-worktree-launcher.ts`+`git-worktree.test.ts` (4): temp git reposunda `worktree add` + ayırık zararsız süreç; pid DURABLE JSON'a yazılmadan return YOK; restart (yeni instance) aynı pid'i görür; kill+lookup→DEAD doğrulanır; geçersiz worker→registry bırakmaz; LocalRuntimeAdapter entegrasyonu spawn OK→ALIVE→DEAD. Provider CLI uca-uca = RT.2 (canlı/harcama) DEĞİL |
| **İş modları (K-0006)** MOD | GEÇTİ (hermetik) | `modes.ts`+`config/ordu.json`: tavanı ÖLÇEKLER kapıyı GEVŞETMEZ — firtina settings.max_workers 2→4 kaydırır (global_capacity eşiği), hardMaxWorkers=8 ASLA aşılmaz; mod nesnesi güvenlik anahtarı taşısa bile damıtılır; STOP latch açıkken hiçbir mod dispatch üRETEmez (dispatch_paused sütunu değişmez); bilinmeyen mod→fail-closed |
| **Supervisor DAG/repair (A01–A04/A10/A12)** | GEÇTİ (hermetik) | `supervisor.ts`: PLAN_APPROVED olmadan readyNodes boş (A03); deps ACCEPTED olmadan dispatch RED (A01); bounded repair ≤2 yoksa NEEDS_DECISION (A12); PASS yalnız CANDIDATE_FROZEN'da (A10); rezervasyon PASS/FAIL'de settle edilir (sızma yok) |
| **Closure U1–U7 (crash/STOP/UNKNOWN)** | GEÇTİ (hermetik) | `closure.test.ts`: spawn öncesi SENDING + çökmede kör re-spawn YOK + reconcile UNKNOWN'a yükseltir; STALE→RELEASED; FATAL→attempt/node FAILED; DEAD→node READY yeniden denenebilir; spawn-anı devir→orphan-unknown (SESSION_BOUND 0); süresi dolmuş onay RED |
| **Schedule M08–M10 (D2)** | GEÇTİ (hermetik) | `schedule.ts`+`schedule.test.ts` (9): occurrence benzersiz `key(id,rev,UTC)` + `settled` ile tekrar-üretme YOK (rev bump yeni kimlik); INTERVAL yalnız-UTC epoch sayımı = deterministik, non-UTC tz RED (DST sessiz vaat edilmez); misfire catch-up fırtınası YOK (down→5 MISFIRE_SKIPPED, emit 1), overlap BİNMEZ; STOP/revoke/DEADLINE dispatch-anı yeniden kontrol, güvenlik-redi kalıcı silmez (adil yeniden deneme); ENT: hak edilen occurrence gerçek supervisor.dispatchNode'a akar — YENİ komut/olay kind YOK (çekirdek kapalı) |
| **Reasoning receipt M18 (D3)** | GEÇTİ (hermetik) | `reasoning-receipt.ts` kapalı DTO (ek alan RED, alternatif≥1 = muhakeme/assertion değil, kanıt≥1, confidence enum, candidateHex) + `supervisor.requireDeliverableReceipt`/`requestDelivery` eklemeli gate: makbuz DONMUŞ ACCEPTED adayla birebir bağdaşır + her evidenceRef o adayda GERÇEK PASS kanıt; uyusmaz/kanıtsız/adaysız GateError; mutlu yol insan-onayıyla ACCEPTED (mevcut akış bozulmadı) — YENİ kind/kolon YOK |
| **Agent lineage D4 (kimlik zinciri)** | GEÇTİ (hermetik) | `agent-lineage.ts` TEK okuma sorgusu: attempt→node/role→parent(command actor)→external_session_id→runtime(önek-türetimi, öneksiz=bilinmiyor)→reservation(kullanim)→evidence→events; EKSİK halkaları gap olarak dürüstçe sayar, complete=gaps==0; **unknown-usage ≠ bedava** (usage_unknown/UNKNOWN → cost 'bilinmiyor') — salt-okuma, yazma/şema yok |
| **Handoff DTO (P1 §5, D1)** | GEÇTİ (hermetik) | `handoff.ts`: kapalı şema (ek alan RED), zorunlu 7 alan; `dispatchNode` YAZMA YOLUNDA geçersiz handoff'u RED eder — ÇEKİRDEK komut/olay SETİNE yeni kind EKLENMEDİ (sync-baseline yeşil) |
| **Telemetry — 5 KPI (metrik v3.1)** | GEÇTİ (hermetik) | `telemetry.ts`: ledger'dan 5 gösterge türetilir; güvenlik/doğruluk kapısı ihlali varsa hız/kazanç SAYILMAZ (credited=false); ölçülemeyen "bilinmiyor" (UIY-5 dürüstlük) |
| S1 KALAN | NOT_RUN | V3-S1.1 uçtan uca GERÇEK kapsül (canlı Paseo worker — B02 blocked listesi düşmeden spawn yok), kill -9 gerçek-crash provası (U1 hermetik kapandı; canlı kanıt bekliyor) |

## LOC (net yeni kod, kopyalar hariç)
Ürün 1.842 · test 1.769 · SQL-hardening 29 → **3.640 satır** (src/**/*.ts + test/*.ts ölçüldü). Baseline 001 kopyası (123)
hash-testi ile korunur, sayılmaz.

## Bilinçli sınır
- `EVIDENCE_RECORDED testCount:0 + PASS` şema düzeyinde geçer; **store katmanı artık
  SQL CHECK ile reddediyor (A13 GEÇTİ)**. Kalan: korunan evaluator ortamı (V3-S1.1).
- A36 tam lease/fence stres testi (A23) S3'te; buradaki minimum çit, devir-bump
  olmadan hiçbir eski-sahip sonucun commit/kanıt yoluna girememesidir.
- Payload dalları S1'de ilk kullanılan işlemlerle genişler; genişlerken
  baseline schema.json güncellenmeli (sync test zorlar).
