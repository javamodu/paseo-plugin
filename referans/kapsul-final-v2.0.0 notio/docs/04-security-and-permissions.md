# Güvenlik ve yetki
## Roller
Manager plan/repair/soru/özet önerir; spawn uygulayamaz, acceptance/policy/bütçe büyütemez.
Supervisor saf kuralları uygular. Coder izole candidate üretir. Evaluator korunan suite'i çalıştırır.
Vekil rubric önerisi verir; insan/production yetkisini taklit etmez. İnsan riskli sınırı onaylar.
Read-only LLM raporu security enforcement değildir.

## Tehdit modeli
Repo içeriği, tool sonucu, internet ve child mesajı untrusted girdi.
Prompt injection, evaluator tampering, path traversal/symlink, shell escape, secret/log sızıntısı,
budget race, stale approval ve doğrudan spawn bypass acceptance testidir.
“Kapsam dışına çıkma” prompt'u veya npm/node/git wildcard allowlist güvenlik sandbox'ı değildir.

## Execution gate
Her writable profile için sandbox established + policy attestation gerekir.
Provider native sandbox veya configured external OS/container sınırı smoke ve escape testlerinden geçer.
Worktree yalnız git izolasyonudur. Gerekli capability yoksa kod yürütme BLOCKED_CAPABILITY.
Control DB/secret/evaluator root sandbox'a mount edilmez. Docker socket/host credentials verilmez.
CPU/RAM/disk/process/wall-clock/network limitleri profile'da. Paket kurma Prepare'da onaylı/pinli,
test sırasında gereksiz network kapalı. OS/runtime'a göre gerçek enforcement raporlanır.
V1 trusted repo demek repo test kodunun güvenli olduğu garantisi değildir.

## Evaluator
Immutable candidate readonly mount + protected suite/evaluator hash + temp writable output.
Argv array; shell:false. Command recipe sahibi tarafından onaylanır; serbest LLM shell komutu gate olamaz.
Exit 0 tek başına yeterli değil: test receipt, beklenen suite/count, baseline ve negative control.
Coder suite'i değiştirmek isterse yeni evaluator version ve insan onayı; kendi patch'iyle gate'i gevşetemez.
Merge bu üründe otomatik yapılmaz; merge sonrası integration test ayrı zorunlu gate.

## Yerel API
Bind loopback; Host allowlist, browser Origin allowlist. GET/SSE dahil auth.
Tek kullanımlık kısa ömürlü bootstrap → HttpOnly SameSite=Strict session cookie.
Bootstrap HTML'e inject edilmez; normal audit/log'a yazılmaz, kullanımdan sonra revoke.
Browser write için CSRF header + Origin; CLI ayrı scoped bearer. Session TTL/revoke.
Local HTTP için cookie istisnası yalnız loopback; remote erişim TLS/Secure cookie+auth review olmadan yok.
CORS wildcard ve token'ı localStorage'da sürekli saklama yok. WS/SSE scope server-side.

## Secret / approval
Credentials server env/OS secret store reference; frontend yalnız bağlantı durumu.
Trace/shell stdout prompt öncesi redact; redaction testleri; raw secret “audit” diye saklanmaz.
Approval: run+plan hash+candidate hash+policy hash+action+expiry+actor.
Stale version/hash veya expired decision reject. Bütçe artışı sadece belirli run/policy version.
Onay hash'i kimliği ispatlayan dijital imza değildir; single operator auth ayrı kontrol.
