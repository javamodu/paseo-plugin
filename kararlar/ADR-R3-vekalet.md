# ADR-R3 — Sinirli vekalet (grant): grant yeni `grants` tablosunda yasar; vekil karari mevcut approvals kapisindan `actor_id='vekil:<grantId>'` ile akar (UYGULANDI — kanıt: database/004-grants.sql migration + test/r3-grant.test.ts 311-suitinde PASS; [insan] onay damgası bekler)

## Baglam
PLAN.md v2.9 KILIT SS9.2 Vekalet grant modeli (R3): vekil 'yalniz oneri' degildir; onceden verilmis grant icindeki tanimli kararlari VEREBILIR. approvals.action kapali kumesine 5 vekil karar tipi eklenir: ANSWER_QUESTION, FALLBACK_MODEL, EXTRA_RETRY, REASSIGN_NODE, MANIFEST_AMEND — her biri ayri yetki, ayri expiry/butce. Vekil kendi grant'ini buyutemez; merge/deploy/harcama/kapsam genisletme grant ile VERILEMEZ (ayri insan yetkisi). Audit'te actor_id ayrimi: 'insan' vs 'vekil:<grantId>'. Kabul: K12-10.

Guncel durum (ordu-core kaynak kaniti):

- `approvals` tablosu (database/001-initial.sql): `id, run_id, plan_hash, candidate_hash, policy_hash, expected_run_version, action, expires_at, decision(PENDING/APPROVED/REJECTED/REVOKED), actor_id` — bugun tek action 'ACCEPT_RESULT'; tablo tek-atimlik karar-ORNEGI tutar, duran yetki tutmaz.
- `attempts` tablosunda grant_id YOK; ama PLAN SS16 receipt kontrati ileri referans tasir: PREPARE kaydinda `grant (budget+expiry)` alani ve capraz bag `attempt.grantId = grant.id` + `grant.scope kapsar attempt.scope` (PLAN satir 376/381). Sema genisletmesi PLAN tarafindan onceden ilan edilmis: SS19 kural 4 'yeni grant/schedule/receipt bagi migration ile eklenebilir' (satir 344).
- U7 hermetik testi (test/closure.test.ts:123): 'suresi dolmus onay karara baglanamaz' — `decideApproval` (src/supervisor.ts:211) expires_at + expected_run_version + bayat-aday kapilariyla calisir; vekil kapisi bu desenin uzerine kurulur.
- SS22 K13-01 kosul (5): 'grant expiry/revoke calisan ise etki ediyor' gozetimsiz giris kapisidir — revoke'un in-flight etkisi bu ADR'de somutlanmak zorunda.
- F6.5 ADR'i (plans/ADR-F65-rol-model.md) user_version=3'u ALIYOR (003-role-model.sql); bu ADR user_version=4 onerir (004-grants.sql). F6.5 once inerse sira aynen kalir; tersi olursa yalniz numara kayar, icerik degismez.

Sorular: grant nerede yasar? hangi alanlarla? vekil karari hangi kapidan gecer, insan onayindan nasil ayrilir? revoke calisan ise ne yapar? 'buyutemez' kurali deterministik olarak nasil uygulanir?

## Karar

1. **Grant'in evi = yeni `grants` tablosu (database/004-grants.sql, user_version=4).** approvals genisletilMEZ; o tablo karar-ornegidir (PENDING -> karar), grant ise duran yetkidir (revoke edilebilir, expiry'li, butceli, cok karar dogurabilir). Ikisini tek tabloda tutmak U7'nin tek-atimlik expiry semantigini grant'in cok-atimlik omruyle karistirir. `attempts.grant_id TEXT` (NULL = grant'siz/insan yolu; mevcut tum satirlar NULL kalir, geriye-uyum) ve `approvals.grant_id TEXT` (kararin hangi grant altinda verildigi; insan kararlarinda NULL) kolonlari eklenir — PLAN SS16'nin `attempt.grantId = grant.id` bagi boylece semaya iner. Grant run-kapsamlidir (`run_id NOT NULL REFERENCES runs(id)`): approvals'in run_id deseniyle ayni; yatay (run-otesi) yetki birikimi engellenir.

2. **Grant alanlari (tablo kolonlari):**
   - `id`, `run_id`, `created_by` (insan actor — CHECK ile 'vekil:%' kalibi RED, madde 4), `created_at`
   - `actions_json`: izinli vekil karar tipleri — SS9.2 kapali kumesinin alt kumesi (ANSWER_QUESTION / FALLBACK_MODEL / EXTRA_RETRY / REASSIGN_NODE / MANIFEST_AMEND); liste-disi tip = RED
   - `question_types_json`: ANSWER_QUESTION kapsami — SS9.2 karar karti 9 turunun alt kumesi (vekil hangi soru tiplerine cevap verebilir)
   - `fallback_models_json`: FALLBACK_MODEL icin izinli model listesi (F6.5 registry kapali kumesinin alt kumesi olmali; liste-disi model = RED)
   - `extra_retry_budget INTEGER`: kalan ek-retry hakki; her kullanimda atomik AZALIR, 0'da RED
   - `reassign_allowed INTEGER (0/1)`: node yeniden-atama yetki bayragi
   - `manifest_amend_scope_json`: MANIFEST_AMEND icin izinli degisiklik sinifi (yalniz kapsam-DARALTAN / not-duzeltme sinifi; genisletme yuklemcisi madde 4c)
   - `token_budget INTEGER`: grant altinda verilen kararlarin dogurdugu attempt rezervasyonlarinin toplam token tavani
   - `expires_at TEXT NOT NULL`: suresiz grant YOK (alan zorunlu)
   - `forbidden_json`: yasak islemler acik listesi — derinlik-savunmasi; merge/deploy/harcama/kapsam-genisletme SS9.2 geregi grant ile HIC verilemez, bu alan ek yasaklari tasir
   - `state TEXT IN ('ACTIVE','REVOKED','EXPIRED')` + `revoked_by` / `revoked_at`: revoke insan islemidir; EXPIRED zaman fonksiyonuyla set edilir

3. **Uygulama noktalari — vekil karari TEK kapidan gecer, insan yolu degismez:**
   - Yeni saf kapi fonksiyonu `assertGrantAllows(db, grantId, action, payload)` (ince modul `src/grants.ts`): grant var mi + state='ACTIVE' + expires_at dolmamis (U7 deseni: datetime('now') kiyasi) + action actions_json icinde + tip-bazli alt kontrol (FALLBACK_MODEL: model fallback_models_json icinde VE F6.5 registry'de; EXTRA_RETRY: extra_retry_budget>0; REASSIGN_NODE: reassign_allowed=1; MANIFEST_AMEND: genisletme yuklemcisi) + token_budget yeterli. Tek kirmizi = GateError (fail-closed, mevcut desen).
   - Vekil karari mevcut `decideApproval`'a `actor='vekil:<grantId>'` ile akar: once assertGrantAllows (AYNI transaction icinde), sonra approvals satiri `grant_id` dolu olarak yazilir/karara baglanir. U7'nin tum kapilari (expiry, A05 stale version, A14 bayat aday) vekil icin de AYNEN calisir — vekil insandan daha GEVSEK hicbir kapidan gecmez.
   - Audit ayrimi cift katmanli: actor_id deseni PLAN'in soyledigi gibidir (insan: 'insan'/'insan:cli', vekil: 'vekil:<grantId>') + yapisal `approvals.grant_id` kolonu desen-regex'ine guveni kaldirir (pano/telemetry sorgusu `grant_id IS NULL` vs `IS NOT NULL` ile iki kuyrugu kesin ayirir). telemetry.ts 'humanInterventions' deseninin vekil eslenigi ayri metrik olur.
   - **Revoke etkisi (K13-01 kosul 5):** (a) dispatch kapisi: revoke/expiry sonrasi o grant ile YENI vekil islemi (yeni attempt doguracak EXTRA_RETRY/REASSIGN_NODE dahil) RED — PLAN R4 yurutme etkisi (2) 'suresi biten grant ile yeni arac islemi REDDEDILIR' ile ayni cumle. (b) in-flight: revoke aninda `attempts.grant_id = <grant>` ve state='RUNNING' olan attempt'ler mevcut iptal patikasina duser (cancel-requested + fencing bump; iptal dogrulanamazsa UNKNOWN kalir, slot SERBEST BIRAKILMAZ — R4 yurutme etkisi (5) ile birebir). Revoke kor kill YAPMAZ: mevcut reconcile/UNKNOWN makinasi kullanilir, yeni mekanizma eklenmez. (c) o grant altinda acilmis PENDING approval'lar vekil tarafindan artik karara baglanamaz (decideApproval girisinde grant-state yeniden kontrolu); insan hala baglayabilir — grant sonlaninca otorite kaybolmaz, sahibine (insana) doner.

4. **'Vekil kendi grant'ini buyutemez' — deterministik 4 katman:**
   - (a) Yaratim kapisi: `createGrant(db, ..., actor)` actor 'vekil:%' kalibiyla eslesirse GateError + DB tarafinda `CHECK(created_by NOT LIKE 'vekil:%')` — kod atlanirsa sema yakalar.
   - (b) Degismezlik: grant'in yetki alanlari (actions/question_types/fallback_models/reassign/amend_scope/token_budget/expires_at/forbidden/created_by) UPDATE-trigger'i ile degismez (002-hardening `reservation_tokens_immutable` deseni). Buyutmenin tek yolu yeni grant = (a)'ya takilir. Izinli tek gecisler: state ACTIVE->REVOKED (yalniz insan, revoked_by zorunlu) ve ACTIVE->EXPIRED (zaman), arti extra_retry_budget'in atomik AZALMASI (artan/esit UPDATE RED — `NEW < OLD` sarti).
   - (c) MANIFEST_AMEND genisletme yuklemcisi (derleyici tarafi, K-0033 supabi): vekilin onerdigi manifest farki deterministik checker'dan gecer — yeni node YOK, dependencies_json genislemesi YOK, butce/tavan artisi YOK, izinli-dizin genislemesi YOK, provider/model kapali kume disi YOK. Teknik tanim: yeni manifest her alanda eskisinin ALT KUMESI/daraltmasi olmali. Yuklemce saglanmazsa RED + insan kartina duser (SS9.2 uzlasmasi: genisletme her zaman insan).
   - (d) Butce sayaclari: extra_retry_budget ve token_budget yalniz TUKENEN sayaclardir; artirma UPDATE'i trigger'a takilir. 'Buyutme' sozle degil, izinli-UPDATE kumesinin bos olmasiyla uygulanir.

5. **Yeni Command.kind / Event.type GEREKMEZ (F6.5 deseni).** Gerekce: grant yasam dongusu (yaratim/revoke/tukenme) grants tablosunun kendisinde tam kayitlidir (created_by/created_at/state/revoked_by/revoked_at + degismez alanlar); vekil kararlari approvals + mevcut APPROVAL_DECIDED olayinin actor_id'sinde ('vekil:<grantId>') tasir. Cift-dogru-kaynak riski almak yerine defter satiri kanit sayilir. (Istenirse APPROVAL_DECIDED payload'ina grantId dali eklemek sema genisletmesidir — F6.5'teki SESSION_BOUND notu gibi AYRI ADR konusu; bu ADR Event.type/Command.kind kumelerine DOKUNMAZ.)

## Reddedilen alternatifler
- **approvals tablosunun genisletilmesi (grant = uzun-omurlu approval satiri):** approvals tek-atimlik karar-ornegi tutar; decision CHECK kumesi (PENDING/APPROVED/REJECTED/REVOKED) duran yetki omruyle (ACTIVE/EXPIRED) catisir; U7'nin 'suresi dolmus onay karara baglanamaz' kurali grant satirina uygulaninca grant ilk kararda 'tukenir'. Yanlis granulerlik — F6.5 ADR'inin grant'i rol baglamasi icin reddetmesiyle simetrik (orada grant fazla buyuk kavramdi, burada approvals fazla kucuk).
- **attempts.grant_id tek basina (grant JSON'i commands payload'inda):** revoke/expiry dispatch kapisi her seferinde payload parse + zaman kiyasi gerektirir; 'aktif grant var mi' sorgusu SQL ile yazilamaz; K13-01 kosul 5'in canli kaniti uretilemez. Grant sorgulanabilir satir olmali.
- **run-otesi/global grant (capsule veya settings seviyesi):** yatay yetki birikimi — bir grant birden cok run'da karar verdirir; butce/expiry muhasebesi run sinirini asar ve SS9.3 butce frenleriyle (run-bazli rezervasyon) catisir. Run-kapsamli grant approvals.run_id deseniyle de uyumlu.
- **Vekil kararlari icin ayri delegations tablosu (approvals'tan tamamen ayri akis):** iki paralel karar defteri = audit birlesimi sorguda yapilmak zorunda, tek-kapi garantisi kaybolur; U7/A05/A14 kapilarinin vekil kopyasi ikinci kez yazilir (kopya-kapilar sapma riski).
- **Grant'in plan/manifest icinde tasinmasi:** plan immutable (plans_no_update trigger'i) — revoke edilemez. Grant dogasi geregi geri-cagrilabilir yetkidir; immutability ile revoke temelden catisir.

## Sematik taslak
`database/004-grants.sql` (yalniz eklemeli; 001/002/003'e DOKUNULMAZ — hash-senkron):
```sql
-- 004-grants (R3) — sinirli vekalet: duran yetki satirlari; karar-ornekleri approvals'ta kalir.
CREATE TABLE grants(
 id TEXT PRIMARY KEY,
 run_id TEXT NOT NULL REFERENCES runs(id),
 created_by TEXT NOT NULL CHECK(created_by NOT LIKE 'vekil:%'),
 created_at TEXT NOT NULL,
 actions_json TEXT NOT NULL,
 question_types_json TEXT NOT NULL,
 fallback_models_json TEXT NOT NULL,
 extra_retry_budget INTEGER NOT NULL CHECK(extra_retry_budget>=0),
 reassign_allowed INTEGER NOT NULL CHECK(reassign_allowed IN(0,1)),
 manifest_amend_scope_json TEXT NOT NULL,
 token_budget INTEGER NOT NULL CHECK(token_budget>=0),
 expires_at TEXT NOT NULL,
 forbidden_json TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN('ACTIVE','REVOKED','EXPIRED')),
 revoked_by TEXT, revoked_at TEXT,
 CHECK(revoked_by IS NULL OR revoked_by NOT LIKE 'vekil:%')
);
CREATE TRIGGER grant_fields_immutable BEFORE UPDATE OF actions_json,question_types_json,
 fallback_models_json,reassign_allowed,manifest_amend_scope_json,token_budget,
 expires_at,forbidden_json,created_by ON grants
 BEGIN SELECT RAISE(ABORT,'grant_immutable'); END;
CREATE TRIGGER grant_retry_budget_monotonic BEFORE UPDATE OF extra_retry_budget ON grants
 WHEN NEW.extra_retry_budget >= OLD.extra_retry_budget
 BEGIN SELECT RAISE(ABORT,'retry_budget_grows_forbidden'); END;
CREATE TRIGGER grant_revoke_human_only BEFORE UPDATE OF state ON grants
 WHEN NEW.state='REVOKED' AND (OLD.state<>'ACTIVE' OR NEW.revoked_by IS NULL)
 BEGIN SELECT RAISE(ABORT,'grant_revoke_invalid'); END;
ALTER TABLE attempts ADD COLUMN grant_id TEXT REFERENCES grants(id);
ALTER TABLE approvals ADD COLUMN grant_id TEXT REFERENCES grants(id);
CREATE INDEX grants_active ON grants(run_id,state);
```
`src/store.ts openStore` (F6.5'in user_version=3'unu ALDIGI varsayimiyla):
```ts
if (version < 4) db.exec(readFileSync(join(dbDir, '004-grants.sql'), 'utf8'));
db.exec('PRAGMA user_version=4;');
```
Idempotens: `user_version < 4` kapisi ikinci acilista atlatir (001/002/003 deseni). Not: bu ADR F6.5'ten ONCE uygulanirsa migration 003 olur, F6.5 004'e kayar — icerik degismez, yalniz numara.

## Test plani
Hermetik (npm test; sahte transport/execFile enjeksiyonu mevcut desen):
1. Migration: temiz DB'de user_version=4; 001+002(+003)'lu fixture DB acilinca 004 uygulanir, ikinci acilis no-op; 001/002/003 byte-hash senkron testleri yesil kalir; mevcut attempts/approvals satirlari grant_id=NULL ile bozulmadan acilir.
2. createGrant: insan actor ile kabul; 'vekil:%' actor RED (GateError + DB CHECK cift katman kaniti); expires_at=NULL RED; actions_json'a merge/deploy/harcama tipi sokma denemesi RED (SS9.2 verilemezler listesi); fallback_models_json F6.5 registry disi model icerirse RED.
3. Vekil karar kapisi: gecerli grant + izinli action -> approvals satiri actor_id='vekil:<grantId>' + grant_id dolu; izinsiz action RED; EXPIRED grant RED (U7'nin vekil eslenigi: 'suresi dolmus grant karara baglanamaz'); REVOKED grant RED; token_budget yetersiz RED.
4. Buyutemezlik: grant yetki-alani UPDATE'i trigger RED; extra_retry_budget artirma RED, azaltma OK; vekil createGrant RED; MANIFEST_AMEND yuklemcesi: node-ekleme/butce-artisi/dizin-genislemesi RED, daraltma/not-duzeltme GECER + yeni plan hash (SS2 degismezlik korunur); FALLBACK_MODEL liste-disi RED; EXTRA_RETRY budget=0'da RED.
5. Audit ayrimi: ayni run'da insan + vekil kararlari; `grant_id IS NULL` / `IS NOT NULL` sorgusuyla iki kume birebir dogru sayilir; telemetry insan/vekil metrikleri ayrismis.
6. Revoke in-flight: grant'a bagli RUNNING attempt revoke'da cancel patikasina duser (fencing bump; dogrulanamazsa UNKNOWN, slot serbest KALIR); revoke sonrasi o grant ile yeni vekil islemi RED; grant'in PENDING approval'i vekilce karara baglanamaz ama insan baglayabilir.
7. PLAN SS16 bagi: PREPARE/receipt dogrulayicisinda attempt.grant_id doluysa grant'in attempt scope'unu kapsadigi ve expiry/revoke durumu kontrol edilir — dogrulanmayan asama gecisi RED (PLAN satir 381/386 capraz-bag deseni).

Canli kabul (kabul.csv satir onerisi):
```
R3-01,R3,sinirli vekalet grant modeli (grants tablosu + vekil karar kapisi + revoke),NOT_RUN,"hermetik suite exit-0 (252+ yeni testler); canli: K12-10 — vekil grant icindeki izinli karar actor_id='vekil:<grantId>' ile baglanir, grant-disi RED; revoke sonrasi yeni vekil islemi RED + in-flight cancel/UNKNOWN kaniti (K13-01 kosul 5)"
```

## LOC tahmini (T)
- Uretim: **~170-240** — 004 SQL ~45-55 · store.ts ~3 · grants.ts (yeni ince modul: createGrant/assertGrantAllows/revokeGrant) ~70-90 · supervisor.ts vekil kapi entegrasyonu ~25-35 · dispatcher/cancel revoke etkisi ~15-25 · telemetry/pano ayrisimi ~10-15 · SS16 dogrulayici bagi ~10-15.
- Test: **~200-300** (7 hermetik grup + migration fixture + revoke senaryolari).

## Sonuc / riskler
- Grant defterde yasadigi icin revoke/expiry sorgulanabilir ve K13-01 kosul 5'in canli kaniti uretilebilir hale gelir; SS9.2'nin 5 vekil karar tipi approvals.action kapali kumesine PLAN'in ongordugu sekilde eklenir (bu ADR kume genisletmesini PLAN'a dayandirir; kendi basina yeni tip ONERMEZ).
- Insan/vekil audit ayrimi cift katmanli: actor_id deseni + yapisal grant_id kolonu — regex guvenine dayanmaz.
- 'Buyutemez' kurali sozde degil mekanikte: CHECK + immutable trigger + monotonic-azalan sayac + genisletme yuklemcisi — dort katmanin her biri tek basina RED uretir.
- Risk: MANIFEST_AMEND yuklemcisinin 'genisletme' tanimi derleyici checker'inda buyuyecek; ilk surumde bilincli DAR tutulur (supheli fark = insan kartina) — yanlis-negatif (mesru daraltmanin reddi) kabul edilebilir, yanlis-pozitif degil (K-0033 supap mantigi).
- Risk: grant'in run-kapsamli olmasi cok-run'li vekil senaryolarinda grant cogalmasi yaratir; olculup gerekirse capsule-kapsamli grant AYRI ADR ile acilir (yatay yetki riski o zaman bilincli kabul edilir).
- F6.5 ile bagimlilik yalniz migration numarasindadir; sema ve icerik bagimsizdir.

## Baglantilar
PLAN.md v2.9 SS9.2 (grant modeli + 5 vekil karar tipi + actor_id ayrimi) · SS16 (receipt PREPARE grant bagi, satir 376/381) · SS19 kural 4 (migration ile genisletme, satir 344) · SS22 K13-01 kosul 5 (revoke calisan ise etki) · SS9.3 (run-bazli butce frenleri) · plans/ADR-F65-rol-model.md (user_version=3 + migration kalibi + FALLBACK_MODEL registry bagimliligi) · K-0033 (derleyici+checker supabi) · ordu-core: database/001-initial.sql (approvals/attempts), database/002-hardening.sql (immutable-trigger deseni), src/store.ts:19-22 (user_version kalibi), src/supervisor.ts:211 (decideApproval + U7), test/closure.test.ts:123 (U7 expiry kaniti), src/dispatcher.ts (cancel/UNKNOWN patikasi).
