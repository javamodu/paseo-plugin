-- 002-hardening (ordu-v3 S1) — ADR-011 K2/K3 kapanışları: A35 + A36 minimum çiti.
-- 001-initial.sql (baseline, byte-identik kopya) ÜZERİNE uygulanır.
-- Gözlem (ADR-011 §3): baseline INSERT kapılarını kapatıyor ama UPDATE yolları
-- aynı kontrollerden geçmiyordu. Bu migration UPDATE yollarını da kapatır.

-- A05: komut idempotency anahtarı kalıcı ve DB-düzeyinde tekil (NULL serbest).
ALTER TABLE commands ADD COLUMN idempotency_key TEXT;
CREATE UNIQUE INDEX commands_idem ON commands(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- A35.1: rezervasyon tokenları EKLEME/AZALTMA dahil tamamen değişmez.
-- (Tavan aşımı INSERT kapısında; bütçe değişimi yeni attempt ister.)
CREATE TRIGGER reservation_tokens_immutable BEFORE UPDATE OF tokens ON reservations
 WHEN NEW.tokens <> OLD.tokens
 BEGIN SELECT RAISE(ABORT,'reservation_tokens_immutable'); END;

CREATE TRIGGER reservation_attempt_immutable BEFORE UPDATE OF attempt_id ON reservations
 WHEN NEW.attempt_id <> OLD.attempt_id
 BEGIN SELECT RAISE(ABORT,'reservation_attempt_immutable'); END;

-- A35.2: ACTIVE'ye geri dönüş YASAK (UNKNOWN→ACTIVE flip'ini STOP'a bakmadan
-- kapatır; mutabakat UNKNOWN'ı yalnız SETTLED/RELEASED'e taşıyabilir).
CREATE TRIGGER reservation_no_flip_to_active BEFORE UPDATE OF state ON reservations
 WHEN NEW.state='ACTIVE' AND OLD.state<>'ACTIVE'
 BEGIN SELECT RAISE(ABORT,'reactivation_forbidden'); END;

-- A36 (minimum): dondurulmuş aday hash'i sonradan değişemez.
CREATE TRIGGER candidate_hash_immutable BEFORE UPDATE OF candidate_hash ON attempts
 WHEN OLD.candidate_hash IS NOT NULL AND NEW.candidate_hash IS NOT NULL
  AND NEW.candidate_hash <> OLD.candidate_hash
 BEGIN SELECT RAISE(ABORT,'candidate_already_frozen'); END;

-- A36: fencing token yalnız artar (devir = bump; eski sahip RED'e mahkûm).
CREATE TRIGGER fencing_monotonic BEFORE UPDATE OF fencing_token ON attempts
 WHEN NEW.fencing_token <= OLD.fencing_token
 BEGIN SELECT RAISE(ABORT,'fencing_token_monotonic'); END;
