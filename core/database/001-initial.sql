-- Reference schema: a migration starting point, not a working supervisor.
PRAGMA foreign_keys=ON;
PRAGMA journal_mode=WAL;
CREATE TABLE settings (
 id INTEGER PRIMARY KEY CHECK(id=1),
 dispatch_paused INTEGER NOT NULL DEFAULT 1 CHECK(dispatch_paused IN(0,1)),
 max_workers INTEGER NOT NULL DEFAULT 2 CHECK(max_workers>0)
);
INSERT INTO settings(id,dispatch_paused,max_workers) VALUES(1,1,2);
CREATE TABLE capsules(id TEXT PRIMARY KEY, goal TEXT NOT NULL, repo_id TEXT NOT NULL, source_commit TEXT NOT NULL);
CREATE TABLE plans(
 id TEXT PRIMARY KEY, capsule_id TEXT NOT NULL REFERENCES capsules(id),
 version INTEGER NOT NULL CHECK(version>0), plan_hash TEXT NOT NULL,
 evaluator_hash TEXT NOT NULL, policy_hash TEXT NOT NULL, payload_json TEXT NOT NULL,
 UNIQUE(capsule_id,version)
);
CREATE TRIGGER plans_no_update BEFORE UPDATE ON plans BEGIN SELECT RAISE(ABORT,'immutable_plan'); END;
CREATE TRIGGER plans_no_delete BEFORE DELETE ON plans BEGIN SELECT RAISE(ABORT,'immutable_plan'); END;
CREATE TABLE runs(
 id TEXT PRIMARY KEY, plan_id TEXT NOT NULL REFERENCES plans(id),
 version INTEGER NOT NULL DEFAULT 1 CHECK(version>0),
 state TEXT NOT NULL CHECK(state IN('DRAFT','READY','RUNNING','VERIFYING','WAITING_APPROVAL',
  'PAUSED','CANCEL_REQUESTED','CANCELLED','FAILED','UNKNOWN_EXTERNAL_STATE','ACCEPTED')),
 profile_hash TEXT NOT NULL, candidate_hash TEXT,
 dispatch_paused INTEGER NOT NULL DEFAULT 0 CHECK(dispatch_paused IN(0,1)),
 max_workers INTEGER NOT NULL CHECK(max_workers>0),
 max_attempts INTEGER NOT NULL CHECK(max_attempts>0),
 max_reserved_tokens INTEGER NOT NULL CHECK(max_reserved_tokens>0),
 spent_tokens INTEGER NOT NULL DEFAULT 0 CHECK(spent_tokens>=0),
 usage_unknown INTEGER NOT NULL DEFAULT 0 CHECK(usage_unknown IN(0,1)),
 deadline_at TEXT NOT NULL
);
CREATE TRIGGER run_manifest_immutable BEFORE UPDATE OF plan_id,profile_hash ON runs
 WHEN OLD.plan_id<>NEW.plan_id OR OLD.profile_hash<>NEW.profile_hash
 BEGIN SELECT RAISE(ABORT,'immutable_run_manifest'); END;
CREATE TABLE nodes(
 run_id TEXT NOT NULL REFERENCES runs(id), id TEXT NOT NULL,
 role TEXT NOT NULL, dependencies_json TEXT NOT NULL, state TEXT NOT NULL,
 PRIMARY KEY(run_id,id)
);
CREATE TABLE attempts(
 id TEXT PRIMARY KEY, run_id TEXT NOT NULL, node_id TEXT NOT NULL,
 number INTEGER NOT NULL CHECK(number>0), state TEXT NOT NULL,
 input_hash TEXT NOT NULL, candidate_hash TEXT, external_session_id TEXT,
 lease_owner TEXT, lease_until TEXT, fencing_token INTEGER NOT NULL CHECK(fencing_token>0),
 FOREIGN KEY(run_id,node_id) REFERENCES nodes(run_id,id), UNIQUE(run_id,node_id,number)
);
CREATE TABLE commands(
 id TEXT PRIMARY KEY, run_id TEXT REFERENCES runs(id), expected_version INTEGER,
 kind TEXT NOT NULL, actor_id TEXT NOT NULL, payload_hash TEXT NOT NULL, payload_json TEXT NOT NULL,
 status TEXT NOT NULL, result_json TEXT
);
CREATE TRIGGER command_payload_immutable BEFORE UPDATE OF payload_hash,payload_json ON commands
 WHEN OLD.payload_hash<>NEW.payload_hash OR OLD.payload_json<>NEW.payload_json
 BEGIN SELECT RAISE(ABORT,'command_id_conflict'); END;
CREATE TABLE events(
 sequence INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
 run_id TEXT REFERENCES runs(id), attempt_id TEXT REFERENCES attempts(id),
 type TEXT NOT NULL, actor_id TEXT NOT NULL, causation_id TEXT NOT NULL,
 created_at TEXT NOT NULL, payload_json TEXT NOT NULL
);
CREATE TRIGGER events_no_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'append_only_event'); END;
CREATE TRIGGER events_no_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'append_only_event'); END;
CREATE TABLE outbox(
 id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL REFERENCES attempts(id),
 command_id TEXT NOT NULL REFERENCES commands(id), dispatch_key TEXT NOT NULL UNIQUE,
 kind TEXT NOT NULL, payload_json TEXT NOT NULL, status TEXT NOT NULL,
 lease_owner TEXT, lease_until TEXT, fencing_token INTEGER NOT NULL DEFAULT 1,
 next_attempt_at TEXT, delivery_count INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE reservations(
 id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL UNIQUE REFERENCES attempts(id),
 tokens INTEGER NOT NULL CHECK(tokens>0),
 state TEXT NOT NULL CHECK(state IN('ACTIVE','SETTLED','RELEASED','UNKNOWN'))
);
CREATE TRIGGER reservation_admit BEFORE INSERT ON reservations WHEN NEW.state='ACTIVE'
BEGIN
 SELECT CASE WHEN (SELECT dispatch_paused FROM settings WHERE id=1)=1
  THEN RAISE(ABORT,'global_stop') END;
 SELECT CASE WHEN (SELECT r.dispatch_paused FROM runs r JOIN attempts a ON a.run_id=r.id WHERE a.id=NEW.attempt_id)=1
  THEN RAISE(ABORT,'run_paused') END;
 SELECT CASE WHEN (SELECT r.usage_unknown FROM runs r JOIN attempts a ON a.run_id=r.id WHERE a.id=NEW.attempt_id)=1
  THEN RAISE(ABORT,'unknown_budget') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM reservations WHERE state IN('ACTIVE','UNKNOWN')) >=
  (SELECT max_workers FROM settings WHERE id=1) THEN RAISE(ABORT,'global_capacity') END;
 SELECT CASE WHEN
  (SELECT COUNT(*) FROM reservations z JOIN attempts a ON z.attempt_id=a.id
   WHERE z.state IN('ACTIVE','UNKNOWN') AND a.run_id=(SELECT run_id FROM attempts WHERE id=NEW.attempt_id)) >=
  (SELECT r.max_workers FROM runs r JOIN attempts a ON r.id=a.run_id WHERE a.id=NEW.attempt_id)
  THEN RAISE(ABORT,'run_capacity') END;
 SELECT CASE WHEN
  COALESCE((SELECT SUM(z.tokens) FROM reservations z JOIN attempts a ON z.attempt_id=a.id
   WHERE z.state IN('ACTIVE','UNKNOWN') AND a.run_id=(SELECT run_id FROM attempts WHERE id=NEW.attempt_id)),0)
  + NEW.tokens + (SELECT r.spent_tokens FROM runs r JOIN attempts a ON r.id=a.run_id WHERE a.id=NEW.attempt_id) >
  (SELECT r.max_reserved_tokens FROM runs r JOIN attempts a ON r.id=a.run_id WHERE a.id=NEW.attempt_id)
  THEN RAISE(ABORT,'token_budget') END;
END;
CREATE TRIGGER reservation_no_reactivate BEFORE UPDATE OF state ON reservations
 WHEN OLD.state IN('SETTLED','RELEASED') AND NEW.state<>OLD.state
 BEGIN SELECT RAISE(ABORT,'new_attempt_required'); END;
CREATE TABLE artifacts(
 hash TEXT PRIMARY KEY CHECK(length(hash)=64), storage_ref TEXT NOT NULL UNIQUE,
 bytes INTEGER NOT NULL CHECK(bytes>=0), media_type TEXT NOT NULL, sensitivity TEXT NOT NULL
);
CREATE TABLE evidence(
 id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL REFERENCES attempts(id),
 artifact_hash TEXT NOT NULL REFERENCES artifacts(hash), candidate_hash TEXT NOT NULL,
 evaluator_hash TEXT NOT NULL, environment_hash TEXT NOT NULL, exit_code INTEGER NOT NULL,
 verdict TEXT NOT NULL CHECK(verdict IN('PASS','FAIL','UNKNOWN')), test_count INTEGER NOT NULL CHECK(test_count>=0),
 CHECK(verdict<>'PASS' OR (exit_code=0 AND test_count>0))
);
CREATE TABLE approvals(
 id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES runs(id),
 plan_hash TEXT NOT NULL, candidate_hash TEXT, policy_hash TEXT NOT NULL,
 expected_run_version INTEGER NOT NULL, action TEXT NOT NULL, expires_at TEXT NOT NULL,
 decision TEXT NOT NULL CHECK(decision IN('PENDING','APPROVED','REJECTED','REVOKED')), actor_id TEXT,
 CHECK(action<>'ACCEPT_RESULT' OR candidate_hash IS NOT NULL)
);
CREATE INDEX events_by_run ON events(run_id,sequence);
CREATE INDEX outbox_pending ON outbox(status,next_attempt_at);
CREATE INDEX attempt_sessions ON attempts(external_session_id);
-- Production repositories must still enforce semantic state, auth, artifact trust and fencing.
-- Do not treat arbitrary SQL INSERT as an authenticated command or successful tool execution.
