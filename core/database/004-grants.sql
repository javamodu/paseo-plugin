-- 004-grants (R3, ADR-R3) — sinirli vekalet grant defteri. Yalniz eklemeli;
-- 001/002/003 byte-degismez. Grant = duran yetki (expiry'li, butceli, revoke edilebilir,
-- cok karar dogurabilir); approvals = tek-atimlik karar ornegi olarak AYNEN kalir.
-- Grant run-kapsamlidir: yatay (run-otesi) yetki birikimi engellenir (approvals.run_id deseni).

CREATE TABLE grants (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id),
  created_by TEXT NOT NULL CHECK(created_by NOT LIKE 'vekil:%'), -- buyutemez katman-a (sema): vekil grant yaratamaz
  created_at TEXT NOT NULL,
  actions_json TEXT NOT NULL,              -- SS9.2 vekil karar kapali kumesinin alt kumesi
  question_types_json TEXT NOT NULL,       -- ANSWER_QUESTION kapsami (SS9.2 9 kart turunun alt kumesi)
  fallback_models_json TEXT NOT NULL,      -- F6.5 registry alt kumesi ('provider/model')
  extra_retry_budget INTEGER NOT NULL CHECK(extra_retry_budget>=0),
  reassign_allowed INTEGER NOT NULL CHECK(reassign_allowed IN(0,1)),
  manifest_amend_scope_json TEXT NOT NULL, -- yalniz daraltma/not sinifi; genisletme her zaman insan
  token_budget INTEGER NOT NULL CHECK(token_budget>=0),
  expires_at TEXT NOT NULL,                -- suresiz grant YOK
  forbidden_json TEXT NOT NULL,            -- derinlik-savunmasi acik yasak listesi
  state TEXT NOT NULL CHECK(state IN('ACTIVE','REVOKED','EXPIRED')),
  revoked_by TEXT,
  revoked_at TEXT
);

-- PLAN SS16 capraz-bagi semaya iner: attempt.grantId = grant.id; kararin hangi grant
-- altinda verildigi approvals.grant_id'de (NULL = insan yolu; audit ayrimi yapisal, regex degil).
ALTER TABLE attempts ADD COLUMN grant_id TEXT REFERENCES grants(id);
ALTER TABLE approvals ADD COLUMN grant_id TEXT REFERENCES grants(id);

-- buyutemez katman-b: yetki alanlari degismez. Buyutmenin tek yolu yeni grant = yaratim kapisina takilir.
CREATE TRIGGER grants_authority_immutable BEFORE UPDATE OF
  run_id, created_by, created_at, actions_json, question_types_json, fallback_models_json,
  reassign_allowed, manifest_amend_scope_json, expires_at, forbidden_json ON grants
 BEGIN SELECT RAISE(ABORT,'grant_authority_immutable'); END;

-- buyutemez katman-d: butce sayaclari yalniz TUKENIR; artan/esit UPDATE RED (NEW < OLD sarti).
CREATE TRIGGER grants_retry_budget_monotonic BEFORE UPDATE OF extra_retry_budget ON grants
 WHEN NEW.extra_retry_budget >= OLD.extra_retry_budget
 BEGIN SELECT RAISE(ABORT,'grant_retry_budget_monotonic'); END;
CREATE TRIGGER grants_token_budget_monotonic BEFORE UPDATE OF token_budget ON grants
 WHEN NEW.token_budget >= OLD.token_budget
 BEGIN SELECT RAISE(ABORT,'grant_token_budget_monotonic'); END;

-- izinli tek gecisler: ACTIVE->REVOKED (yalniz insan; revoked_by/at zorunlu) ve ACTIVE->EXPIRED (zaman).
CREATE TRIGGER grants_state_guard BEFORE UPDATE OF state ON grants
 WHEN NOT (
   (OLD.state='ACTIVE' AND NEW.state='REVOKED' AND NEW.revoked_by IS NOT NULL AND NEW.revoked_at IS NOT NULL AND NEW.revoked_by NOT LIKE 'vekil:%')
   OR (OLD.state='ACTIVE' AND NEW.state='EXPIRED')
 )
 BEGIN SELECT RAISE(ABORT,'grant_state_transition_forbidden'); END;

-- revoke damgasi bir kez yazilir; sonradan oynanamaz.
CREATE TRIGGER grants_revoke_immutable BEFORE UPDATE OF revoked_by, revoked_at ON grants
 WHEN OLD.revoked_by IS NOT NULL
 BEGIN SELECT RAISE(ABORT,'grant_revoke_immutable'); END;

CREATE INDEX grants_by_run ON grants(run_id, state);
CREATE INDEX attempts_by_grant ON attempts(grant_id) WHERE grant_id IS NOT NULL;
CREATE INDEX approvals_by_grant ON approvals(grant_id) WHERE grant_id IS NOT NULL;