-- 003-role-model (F6.5, ADR-F65) — nodes'a rol->model baglamasi; NULL = manager'a birak.
-- Yalniz eklemeli; 001/002 byte-degismez. Kapali kume dogrulamasi kod katmaninda
-- (src/providers.ts + createRunPlan), CHECK kisiti YOK (node-state deseniyle uyumlu).
ALTER TABLE nodes ADD COLUMN provider TEXT;
ALTER TABLE nodes ADD COLUMN model TEXT;
