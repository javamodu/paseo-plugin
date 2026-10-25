# API ve event protokolü
## Tek command yolu
POST /api/commands: Command DTO; commandId, payloadHash, expectedVersion, runId,
actor server auth'dan, kind closed enum, payload.
Model çıktısındaki actor veya role auth değildir.
Kinds: PROPOSE_PLAN, APPROVE_PLAN, START_RUN, MESSAGE_MANAGER, PAUSE_RUN, RESUME_RUN,
CANCEL_RUN, GLOBAL_STOP, CLEAR_STOP, RERUN, DECIDE_APPROVAL, UPDATE_PROFILE.
Raw shell, direct arbitrary spawn veya approve-self yok.

Responses: APPLIED/QUEUED/REJECTED/UNKNOWN; duplicate same hash eski response'u döndürür.
Same ID different hash 409. Decision stale 409; expired 410; invalid contract 422; unauth 401.
Request success => intent durable; external job success değildir.
Rate/body size limit, redacted structured error, command correlation ID.

## Reads
GET /api/capsules?status=&cursor=
GET /api/runs/:id (snapshot + cursor + known/unknown usage)
GET /api/approvals?status=pending
GET /api/artifacts/:id (scoped, content-type, no path traversal)
GET /api/profiles (masked capability summaries)
GET /api/evaluations/:id
GET /api/events?after=&scope= : tek SSE; authenticated.
GET /health : yalnız küçük readiness; secret/project içeriği yok.

## SSE
Snapshot cursor S aynı consistency boundary'de; events >S catch-up, sonra canlı stream.
eventId unique; duplicate rendering idempotent. SSE id sequence; Last-Event-ID support.
Retention window dışı → RESYNC_REQUIRED + fresh snapshot. Connection yoksa “son görülen”, başarı yok.
Server output redacted canonical event; raw provider transcript bütün UI client'lara broadcast edilmez.
Human-readable explanation event code'dan renderer'da çıkar; durum hesaplama text regex değildir.

## Optimistic concurrency
UI expected run version taşır. Version conflict son snapshot/diff; sessiz overwrite yok.
Manager proposal da command'dır; validation/policy/human gate'i aşamaz.
Application event registry contracts/event-types.json'dur. Yeni tür değişikliği contract version ister.
