# S4 SCHEDULER — SENT OTURUM YOKLAMASI (sentPoll) — 2026-10-26

Savaş START turunun canlı bulgusunun kapanışı: SENT outbox satırları durum yoklamasızdı — ölen harici oturum defterde RUNNING görünür, reservation ACTIVE kalırdı (kanıt: run-c0ea713b/kimi-K3 ölümü, DERSLER 173).

## Kod

- `core/src/dispatcher.ts` — yeni `pollSentSessions(db, adapter)`: SENT satırları lookup'lanır. ALIVE → dokunma (olay YOK — tick başına spam üretmez); DEAD + attempt RUNNING ailesi → reconcile'ın DEAD dalıyla aynı kapanış (outbox DEAD_CONFIRMED + reservation RELEASED + attempt FAILED + node READY + CANCEL_CONFIRMED olayı); DEAD + terminal attempt (CANDIDATE_FROZEN/ACCEPTED/FAILED) → yalnız gözlem (`dead-observed` — DONE düzeyine REGRESYON YOK); UNKNOWN → `still-unknown` (kör karar yok).
- `core/src/cli.ts` — tick çıktısına `sentPoll` alanı eklendi (dispatch → reconcile → sentPoll sırası).
- Testler: `core/test/dispatcher.test.ts` +4 senaryo (dead-released / alive-running-spam-sız / terminal-regresyon-yok / still-unknown) — 13/13 PASS (R).

## Canlı koşum (üretim defteri — (R))

`node src/cli.ts tick` → `sentPoll: { polled: 2, outcomes: ["dead-released", "alive-running"] }`:

- **dead-released** = dk-run-c0ea713b-n1 (kimi-K3, harici status error → DEAD): attempt att-c341ceec FAILED, node READY, reservation RELEASED, olay CANCEL_CONFIRMED (sequence 23). Savaşın ilk açık kalemi defterde KAPANDI.
- **alive-running** = dk-run-ce03ca55-n1 (glm-5.3, M02): dokunulmadı (runState ACCEPTED, oturum idle = ALIVE).

Defter sonrası: `reserved: 0, unknown: 0, pendingOutbox: 0` — savaş defteri harici gerçekle senkron.

## Ölçüler

- Hedefli test: dispatcher+cli 13/13 (R). Tam süit kanal koşumu bu kapanışta (etiket `s4-scheduler-sentpoll`).
- Kabul.csv satır çevirisi YOK (yeni işlev; S4 Scheduler plan kaleminin ilk yarısı — tick döngüsü/daemon sürücüsü kalır).
- K-0048(i) aynı turda uygulandı: codemap.ps1 raporlar/+plans/ klasör-topaklama → CODEMAP 151→**94 satır** (531 dosya; tavan 150 altında bol pay; kod sembol haritası scripts/+kararlar/ dosya-düzeyi TAM).

Damga (R): 2026-10-26 (Get-Date), ajan = yazıcı (Claude glm-5.3), SAVAŞ START sonrası ilk S4 turu.
