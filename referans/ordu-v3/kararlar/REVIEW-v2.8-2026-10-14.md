# REVIEW — MASTER-SSOT-PLAN v2.8 + ordu-core uygulama envanteri (2026-10-14)
Tur: coder review (birlesik reviewer talimati). Teslim tipi: review + hedefli revizyon onerisi. Yeni master/ikinci SSOT YOK.
Olcum zamani: 2026-10-14 ~16:45 · Kaynak: ordu-core disk + veri/ordu.sqlite + 252/252 exit 0 (R) + canli kimi-K3 teslimi (R).

## 1. Karar ozeti: KOSULLU DEVAM
Mevcut core guvenilir: 252/252 test exit 0, ilk canli uctan-uca teslim kanitli (run-e264c0a2 RUN_ACCEPTED). Genisletme dogru; yeniden yazim gerekcesi yok. Kosul: asagidaki 5 hedefli revizyon plana islenmeden F8/F9 koduna baslanmaz.

## 2. Hedef-ozellik-kod-test matrisi (gereksinim → kod → test → kanit → durum)

| Gereksinim | Kod yeri | Test | Kanit | Durum |
|---|---|---|---|---|
| Kimlik zinciri task→run→node→attempt | capsules/runs/nodes/attempts tablolari | store/dispatcher testleri | schema PRAGMA ciktisi | DOGRULANDI |
| ...round katmani (turnuva turu) | YOK | — | — | UYGULAMA_EKSIK (F8) |
| Node basina provider (coder su, tester bu) | nodes tablosunda provider kolonu YOK | — | — | UYGULAMA_EKSIK (F6.5, ADR'li migration) |
| grantId bagi (attempt↔onay) | approvals var; attempts'te grant_id YOK | — | — | TASARIM_EKSIK (vekalet icin gerekli) |
| deadline_at + davranis | runs.deadline_at VAR | schedule.test.ts | — | KANIT_EKSIK (deadline enforcement canli kosulmadi) |
| Izin: yasak dosya/symlink/shell bypass | M26/M31 kapilari | m01-a15-m11.test.ts (hermetik) | kabul.csv: NOT_RUN | KANIT_EKSIK (P0 — canli negatif kosu yok) |
| STOP <=5sn canli | cli stop/resume + setGlobalStop | f1-fault (hermetik) | V3-S1.6 NOT_RUN | KANIT_EKSIK (P0) |
| P0-4 shell enjeksiyonu | paseo-transport.ts execFile + resolvePaseoBinary | paseo-transport.test.ts | 252/252 + canli spawn bound | DOGRULANDI (eski raporun aksine KAPALI) |
| P0-7 reconcile sentetik kimlik | dispatcher.reconcileUnknown | paseo-adapter.test.ts | canli 'still-unknown' gozlendi | DOGRULANDI |
| Coder kendi ciktisini kabul edemez | settleNodeOutcome + A13 + decideApproval | f1-gates, e2e-s11 | 252/252 | DOGRULANDI (hermetik); canli taze kanit evaluate akisinda |
| 5-LLM bagimsiz uretim + capraz review | YOK | — | — | UYGULAMA_EKSIK (F8) |
| UI-tester (canli UI testi) | YOK | — | — | UYGULAMA_EKSIK (F9) |
| Vekalet grant'i (soru cevaplama, fallback, retry, atama sinirlari) | approvals (action + expires_at) — dar | kismen | — | TASARIM_EKSIK (karar-tipi ayrimi yok) |
| Tek otorite defter | store.ts SQLite + events | store.test.ts | 252/252 | DOGRULANDI |

## 3. Plana hedefli degisiklikler (5 revizyon)

R1. **§21 F8 tanimi 7-adimli protokolle degisir**: bagimsiz uretim (ilk cevaplar kapali) → surumlu kayit → on kontrol (uydurma kaynak isareti) → capraz review (sabit surum salt-okur) → revizyon → ayni rubric ile yeniden degerlendirme → sentez + bagimsiz son inceleme. Round katmani: yeni tablo YOK; `runs`(tur) altinda `attempts.number` tur numarasi olarak kullanilir, rubricVersion events payload'inda tasinir.
R2. **Rubric surumleme kaydi**: id+version+domain+olcutler+agirliklar+zorunlu kapilar; farkli surum toplam puani kiyaslanmaz; sadece puan artisi kalite ilani degildir. (§16'ya ek)
R3. **Vekalet grant modeli**: approvals.action kapali kumesine vekil karar tipleri (ANSWER_QUESTION, FALLBACK_MODEL, EXTRA_RETRY, REASSIGN_NODE, MANIFEST_AMEND) — her biri ayri yetki; vekil kendi grant'ini buyutemez; actor_id 'insan' vs 'vekil:<grantId>' ayrilir. (§9.2 kart setiyle birlesir)
R4. **Deadline davranisi §9.6'ya**: baslatma takvimi != son calisma saati; deadline yaklasirken yeni is kabulu durur; test+handoff rezervi; dolunca RUNNING attempt'ler checkpoint + insan karti; kalite kapilari sure baskisiyla dusmez.
R5. **§12 kabul test tablosu (14 test) kabul.csv'ye NOT_RUN satirlari olarak eklenir**; fake-adaptor ve canli sonuclar ayri raporlanir; kosulmamis test PASS yazilmaz.

## 4. Mimari secenek karsilastirmasi
- **Mevcut core + ince genisletme (SECILDI)**: 252 test, canli kanit, 3.5k src. F8/F9 modul olarak eklenir. Risk: yok denecek.
- **Pydantic AI sidecar**: tip-guvenli agent tanimlari guzel ama ikinci otorite riski (§4 sinirlari); dayaniklilik/guvenlik cozmez. RED — gereklilik gosterilemedi.
- **PocketFlow**: graph DSL cekici ama core'un zaten kapali durum makinesi + kapilari var; cift motor = cift dogru kaynak. RED.
- Kural: sidecar komut YURUTMEZ, core'a dogrulanacak komut sunar; bu sinir degismez.

## 5. Secilen/reddedilen
Secilen: R1-R5 + F5.5 cwd duzeltmesi + F6.5 rol-model + F9 UI-tester (sonraki faz). Reddedilen: framework eklemeleri, yeni tablo acmadan once mevcut yeterlilik kuralina istisna, 11 uzman ekraninin F9'a bagimlilik yapilmasi (bagimsiz runner once).

## 6. Veri modeli / komut / adaptor notlari
- nodes.provider TEXT NULL (varsayilan ORDU_PROVIDER) — ADR'li migration, §19 kuralina uygun.
- attempts.grant_id TEXT NULL → approvals.id'ye bag (vekalet zinciri icin).
- Yeni Command.kind YOK (sync-baseline korunur); turnuva turu mevcut dispatch/attempt dongusuyle modellenir.

## 7. P0/P1/P2 is listesi (kod yeri + kabul testi)
P0: F5.5 cwd baglama (paseo-transport spawnArgs→workspace) · M26/M31 canli negatif kosu · V3-S1.6 STOP canli.
P1: F6.5 rol-model (supervisor.dispatchNode + cli) · R3 vekalet genisletme (approvals) · R4 deadline enforcement (dispatcher tick).
P2: F8 turnuva (yeni src/tournament.ts ~400-700) · F9 UI-tester adaptor (src/ui-tester-adapter.ts ~300-600) · dikey metrik semasi (~100-200).

## 8. LOC tahmini (ayrik)
Uretim: P0 ~150-250 · P1 ~300-500 · P2 ~800-1.500 → toplam ~1.250-2.250 (T). Test: +~600-1.000. UI: 0 (pano mevcut). Devralinan: 3.499 src + 4.915 test (degismez).

## 9. Gercek test kanitlari + belirsizlikler
Kanit: npm test 252/252 exit 0 (bu tur) · canli RUN_ACCEPTED (run-e264c0a2) · pano 200 OK. Belirsizlik: paseo `run --cwd` nin workspace mirasini neden ezdigi (daemon davranisi — F5.5'te kok neden); LastUsage.CostUsd=0 (maliyet olcumu bilinmiyor).

## 10. Ilk kucuk uygulama dilimi
F5.5 cwd baglama: `src/paseo-transport.ts` spawnArgs + `src/cli.ts` dispatch satiri + 2 test (paseo-transport.test.ts). Geri alma: tek commit revert; kapi: 252+2 test exit 0 + canli spawn'da agent Cwd=ordu-core gozlenir.