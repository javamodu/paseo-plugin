# K13 TURU KAPANIŞ KANITI — GÖZETİMSİZ ROZETİ (§22) + SENARYO B/C (§23)

Tarih: 2026-10-26 · Etiket: `k13-gozetimsiz-senaryo` · Süit: **350/350 (R)** · Süre: 32 sn (R)

Kanal (K-0046 (e)/(f)): `powershell -ExecutionPolicy Bypass -File scripts/test-kanal.ps1 -Etiket k13-gozetimsiz-senaryo`
son-kanit.json: `d=2026-10-26T10:29:46.5502895+03:00 h=081dc56 x=0 test=k13-gozetimsiz-senaryo sureSn=32` (log: `raporlar/kanit-hedef/test-k13-gozetimsiz-senaryo.log`)
Sonek kabul.csv'ye BİREBİR kopyalandı (K13-01 / K13-03 / K13-04 → PASS; 3 satır).

## K13-01 — Gözetimsiz giriş kapısı (plan §22, F4)

Yeni kod: `core/src/gozetimsiz.ts` — `unattendedReadiness(db, kanitlar)` rozet HESAP ucu.
6 koşulun dökümü:

| # | Koşul | Sınama | Dosya |
|---|---|---|---|
| 1 | worker durumu/sahipliği uzlaştırılabilir | `reservations.state='UNKNOWN'` sayısı 0 | defter |
| 2 | iptal doğrulanmış | `CANCEL_REQUESTED`'ı `CANCEL_CONFIRMED`sız run YOK (EXCEPT sorgu) | defter |
| 3 | kullanım ölçülüyor (§9.3) | `runs.usage_unknown=1` YOK | defter |
| 4 | dosya/shell sınırları uygulanıyor (M26/M31) | **kanıt bayrağı** fail-closed | canlı |
| 5 | grant expiry/revoke etki ediyor | sonlanmış granta RUNNING attempt YOK (`expireDueGrants` okuma girişinde tx-dışı — U7) | defter |
| 6 | handoff sonrası eski sahip yazamaz (K12-08) | **kanıt bayrağı** fail-closed | canlı |

Tasarım kararı: 1/2/3/5 DOĞRUDAN defterden sorgulanır; 4/6 yetenek-düzeyi kanıtları
ÇAĞIRANDAN bayrak olarak beklenir — bayrak yoksa koşul KIRMIZI (fail-closed, B02 probe
deseni). Rozet: `gozetimsiz-hazir` / `gozetimsiz-kullanilamaz`. Yeni defter gücü/kind YOK (R6).

Koşumlar:
- `test/k13-gozetimsiz.test.ts` — 7 hermetik kırılım: temiz 6/6 · bayraksız fail-closed
  (4+6 adıyla kırmızı) · her defter koşulu tek tek kırılır (UNKNOWN enjeksiyon / teyitsiz
  CANCEL + teyitle kapanış / usage_unknown / REVOKED inflight CANCEL_REQUESTED etki /
  EXPIRED bağlı RUNNING kusur + settle kapanışı).
- `test/k13-gozetimsiz-canli.test.ts` — CANLI 6-koşul paketi, tek akışta GERÇEK süreç +
  GERÇEK dosya sistemi + GERÇEK defter (f3-live deseni; yalnız kendi spawn edilen
  çocuklar öldürülür):
  1. grantlı dispatch n1 → launcher `failAfterSpawn` (süreç GERÇEKTEN doğar, yanıt kaybolur)
     → outbox UNKNOWN (A08) → **pid canlı doğrulandı**
  2. `revokeGrant` inflight → attempt CANCEL_REQUESTED (**koşul 5 etkisi işledi**)
  3. kendi çocuğumuz `kill` → `isAlive` ESRCH = ölü (OS teyidi) → `reconcileUnknown` →
     `dead-released` + `CANCEL_CONFIRMED` + rezervasyon RELEASED (**koşul 1+2**)
  4. STOP mandalı kurulur → dispatch bloke (`global_stop`) → onay metniyle açılır
  5. n2 GERÇEK spawn → SESSION_BOUND `local:<pid2>`
  6. devir `takeLease` fence 1→2 → ESKİ fence commit RED + YENİ sahip yazar (**koşul 6**)
  7. GERÇEK fs `junction` (symlink guard'ın admin'siz ikizi) → `evaluateArtifact` aday
     aşamasında RED (**koşul 4**)
  8. `settleReservation` → `runs.spent_tokens=42` defterde (**koşul 3**)
  9. `unattendedReadiness` iki kol: bayraklı → `gozetimsiz-hazir` 6/6; bayraksız →
     `gozetimsiz-kullanilamaz` 4/6 (yetenek koşulları kırmızı kalır)

Kanıt satırı (koşumdan): `pid1=<canlı pid> (spawn→UNKNOWN→revoke→kill→CANCEL_CONFIRMED) · pid2=<canlı pid> (spawn→devir fence2→eski-sahip RED) · junction RED · spent=42 · rozet 6/6`

## K13-03 — Senaryo B: gece geliştirme uçtan uca (plan §23, P1)

`test/k13-senaryo.test.ts` — kompozit akış tek testte, her adım mevcut çekirdek kapılarından:
1. coder dispatch → bağlan → **GERÇEK dosya + beklenti eşleşmesi** `evaluateArtifact`
   PASS + exit-0 + node DONE — "PASS ancak koşullu komut + artefakt ile" birebir
2. tester'a **kontrollü API kesintisi** (spawn exception) → UNKNOWN; ikinci geçiş spawn
   yoluna DÖNMEZ — kör çift iş yok (A08)
3. **handoff** (`takeLease` fence 1→2) → eski sahip `commitCandidate` RED +
   `recordEvidence` stale-fence RED (A36 iki bacak); yeni sahip yazar
4. **deadline'da güvenli kapanış**: RUNNING attempt checkpoint'te KALIR (kalite kapıları
   süre baskısıyla DÜŞMEZ) + insan kartı `DEADLINE_CLOSE` PENDING + kapalı runa yeni
   dispatch R4 RED + run ASLA ACCEPTED olamaz + bütçe defterde ölçüldü (settle 21)

## K13-04 — Senaryo C: eşzamanlı izolasyon (plan §23, P1)

`test/k13-senaryo.test.ts` — iki run EŞZAMANLI tek defterde:
- run-A DÜZ uçtan uca: dispatch → bağlan → gerçek dosya evaluate PASS → teslim → insan
  kararı APPROVED → `runs.state='ACCEPTED'`
- run-B B'nin kesintili bacağı eş zamanlı: kesinti → devir → deadline kapanışı (kart PENDING)

İzolasyon dörgüsü: **oturum** (external_session_id / dispatch_key / run_id tekil) ·
**karar** (approvals.run_id izolasyonu: A APPROVED ≠ B DEADLINE_CLOSE PENDING; A'nın kararı
B'nin kartını bağlayamaz; B ASLA ACCEPTED olmaz) · **bütçe** (A otomatik settle 0 / B elle
22 — her biri kendi run'una) · **çıktı** (aday karmaları tekil, A04).

**DÜRÜST KAPSAM AYRIMI (K13-02):** senaryo A'nın turnuva çok-tur claim/değerlendirme
protokolü (5 model → rubric → çapraz eleştiri → revizyon) F8 turundadır — K13-02
NOT_RUN kalır. Bu turda sahte A ÜRETİLMEDİ; C'nin eşzamanlılık+izolasyon omurgası mevcut
çekirdek kapılarıyla uçtan uca sınandı.

## Süit ve kabul defteri

- Süit 340 → **350** (7 hermetik + 1 canlı + 2 senaryo; `package.json` test listesine
  üç dosya eklendi).
- kabul.csv: K13-01/03/04 PASS (sonek kanal kaynaklı, birebir). K13-02 NOT_RUN (F8'e
  dürüst bağlı). Kabul oranı: 63 → **66 / 115 (%57)**.
- saglik.ps1 + codemap.ps1 kapanışta koşuldu (17 OK / 0 EKSIK / 3 SARI beklentisiyle).

## DERSLER (bu tur)

- TS strip-only mod `constructor(private x)` parametre özelliğini reddeder — hermetik
  koşumlarda bile açık alan ataması gerekir (f3-live deseni zaten öyleydi; kısaltınca
  geri düştü).
- Türkçe apostrof ('nın, 'te) TEK TIRNAKLI string literal'ı kırar — parse hatası testin
  KOŞMADAN önce gelir; mesaj satırlarında ya çift tırnak ya apostrofsuz yazım.
- `evaluateArtifact` attempt RUNNING ister + içinde `commitCandidate`+`settleNodeOutcome`
  çağırır: junction/eski-sahip kanıt bacakları commit'ten ÖNCE, manuel settle kanıtı
  hâlâ ACTIVE olan (checkpoint'teki) attempt'e yapılmalı.
