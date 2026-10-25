# Test stratejisi
## Üç farklı kanıt
1. Paket/schema/reference tests: bu ZIP içindeki dar offline check.
2. UI demo checks: yalnız browser UX; gerçek worker/core yok.
3. Production acceptance: gerçek adapter/sandbox/DB/control/provider ortamında test.
Birinci veya ikinci üçüncüyü PASS yapmaz.

## Test piramidi
Saf domain: graph cycles, state transitions, policy monotonicity, stale approval, unknown usage.
Store integration: unique commands, rollback intent, atomic reservation, two-connection contention,
lease/fencing, migrations, consistent backup.
Adapter contract: capabilities, start ambiguity, finish status mapping, cancel, correlation, usage missing.
Fault injection: crash before/after spawn/bind; disconnect; duplicate/out-of-order events;
429/backoff; timeout; auth; provider death; disk full; STOP/restart; stale child.
Security: outside path, symlink, repo changes own evaluator, forged receipt, prompt injection,
secret/redaction, CSRF/Origin, worker direct spawn bypass.
Browser: draft/start split, bound composer, single approval scope, read-only/disconnected,
wait capacity, cancel pending, stale approval, 390px flow and keyboard.
Benchmark runner tests: failed trials remain denominator, paired profiles, missing cost not zero.

## Phase gates
S0: required capability/sandbox/typed SDK probe; missing capability blocks.
S1: headless actual capsule, duplicate command, spawn ambiguity, immutable evaluator, stop latch.
S2:gerçek state UI; no optimistic accepted/cancelled without evidence.
S3: parallel race + restart + partial cancel + budget + backup restore.
S4: paired batch evidence + budget accounting + routing approval.
Release: pinned dependencies/license, operational ownership and all required test receipts.

## Her PR
Touched scope/contract version + unit tests + relevant acceptance IDs + real command/output.
NOT_RUN allowed as status, not as release PASS. Tests that only grep implementation text are not behavioral proof.
Mock engine never replaces required real runtime run. Fake usage allowed only explicit fixture.
No test count target that incentivizes redundant shallow asserts.
