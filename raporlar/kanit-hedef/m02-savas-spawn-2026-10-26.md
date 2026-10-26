# M02 CANLI SPAWN KANITI — SAVAŞ START — 2026-10-26

**Kullanıcı START düdüğü: 2026-10-26 (bu tur).** Bu rapor ordu çekirdeğinin ANA AMACININ — canlıda gerçek ajan yürütme — ilk tam döngüsünün kanıtıdır. Üretim defteri (`core/data/ordu.sqlite`) üzerinde, gerçek Paseo daemon + gerçek LLM (glm-5.3) ile.

## 1. Canlı döngü (run-ce03ca55 — TAMAM, ACCEPTED)

| Adım | Komut/olay | Kanıt |
|---|---|---|
| 1. START latch | `resume --confirm 'I understand the risk' --actor insan:cli --reason 'SAVAS START 2026-10-26'` | commandId 705ba7fc-3fbd-42f4-97fc-29357f0c9272 |
| 2. Kapsül | `capsule --goal "M02 ... m02-savas-spawn-kaniti.txt ..." --repo D:\Vibecode\ordu --commit 88c6a2b0... --provider codex --model glm-5.3` | runId **run-ce03ca55**, planHash 13075b3e..., attemptId **att-ca389c9f** |
| 3. İnsan onayı | `approve` (actor insan:cli) | plan-hash eşleşti |
| 4. Dispatch | `dispatch --run` | DISPATCHED, outbox PENDING |
| 5. **CANLI SPAWN** | `ORDU_LIVE=1 tick` → PaseoWorkerAdapter → makeSafePaseoTransport → workspace wks_c29d49b820d3bbc2 (find-or-create) → `paseo run --provider codex/glm-5.3 --mode auto --cwd D:\Vibecode\ordu --title ordu:dk-run-ce03ca55-n1` | **result: "bound"** — SESSION_BOUND (sequence 15-16 bandı); oturum **8f1a97c6-2aa3-489a-b163-e2643549997f** (Paseo kaydı: provider codex, model glm-5.3, status running→finished) |
| 6. Gerçek iş | Ajan repo kökünde çalıştı, tek satır kanıt dosyası yazdı | `raporlar/kanit-hedef/m02-savas-spawn-kaniti.txt`: "M02 CANLI SPAWN KANITI — ordu cekirdegi tick komutuyla gercek Paseo oturumu baslatti — 2026-10-26T03:04:46Z" (112 bayt) |
| 7. Bağımsız değerlendirme | `evaluate --attempt att-ca389c9f --artifact ... --expect 'M02 CANLI SPAWN'` | **PASS 3/3** (dosya-var, bos-degil, icerik-beklenti); candidateHash 818fcf3a..., artifactHash 75984bae..., evidenceId b66ceb5d-ad9e-4085-92dd-f6150b33d5b0; NODE_DONE |
| 8. Teslim kararı | `decide --approve` | approvalId **apv-00454b81**, APPROVAL_DECIDED, **runState ACCEPTED** |

## 2. Dürüst negatif koşum (aynı turda — run-c0ea713b, kimi-K3)

İlk kapsül varsayılan provider ile açıldı (node provider NULL → çözüm zinciri kod-varsayılanı `codex/kimi-K3`). Canlı spawn **bağlandı** (SESSION_BOUND, oturum c86df0df-ab36-4204-9c08-3851d5f75cc0) fakat ajan anında `model_not_allowed` ile öldü:

> "Only \"glm-5.3\" or \"codefastglm53unlimited\" is available on this API. Requested model \"kimi-K3\" is not supported." — request_id **a50638f90f0c66c7** (Paseo ajan kaydından birebir)

**Sonuç:** PROVIDER_REGISTRY bakımı (providers.ts) — `codex: ['kimi-K3', 'gpt-5.4', 'glm-5.3']`; glm-5.3 canlı-ölçülmüş model olarak eklendi, kimi-K3 listede kaldı (kart değişirse geri döner). Bilinçli registry değişikliği = dosya başındaki kuralın izlediği yol.

**Kanıt satırı:** run-c0ea713b defterde RUNNING + outbox SENT olarak kalır — **SENT satırları için durum yoklaması YOK** (reconcile yalnız SENDING/UNKNOWN bakar; dispatcher.ts:152-170). Ölü harici oturum defterde görünmez. Bu, S4 "Scheduler tick döngüsü" kaleminin gerekliliğinin CANLI KANITIDIR: durum yoklama döngüsü olmadan savaş defteri harici gerçeği göremez.

## 3. Kabul çevirisi

M02 (RESOURCE, live slot sayımı) NOT_RUN → **GECTI_CANLI** (bu kanıtla). Kapı okuması: START düdüğü = UYGULAMA-PLANI Sprint 4 paketinin açılış kapısı (plan satırı "S4 kapısı: START" — madde listesi planda yazılı: M02, Scheduler, K12, K13, F6.5, Bildirim, F8, F9, F4). Kanal koşumu bu turun kapanışında (etiket `savas-start-m02-canli`).

## 4. Ölçüm ortamı

Windows 11 · node v24 · Paseo daemon canlı (workspace çözümleme başarılı) · probe receipt taze (2026-10-25 22:00, <24s) · ORDU_LIVE=1 yalnız tick anında · üretim DB `core/data/ordu.sqlite` (bu savaşın defteri; latch START ile insan:cli aktörüyle açıldı).

Damga (R): 2026-10-26T06:06:23+03:00 (Get-Date), ajan = yazıcı (Claude glm-5.3). Kanıt dosyası ajan 8f1a97c6 tarafından 03:04:46Z'de yazıldı (ajanın kendi damgası).
