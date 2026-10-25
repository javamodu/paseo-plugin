# Runtime adapter ve gerçek Paseo sınırları
> Kapsam eki: [ADR-012](../governance/ADR-012-local-runtime.md) uyarınca execution adapter `paseo` veya Paseo'suz `local` olabilir. Aynı port ve güvenlik/receipt/recovery kapıları; [parite kabulü](../../gpt/RUNTIME.md). Toolsuz completion coder runtime yerine geçmez. Eski tek-Paseo kapsam satırları önceki sürümdür.
## Canonical port (öneri; Paseo API imzası değil)
capabilities(profile) → capability manifest.
start(attemptRequest) → sessionRef or UNKNOWN; request has attemptId/idempotencyKey/inputManifest.
inspect(sessionRef) → observed status/usage/lastProgress.
findByCorrelation(attemptId) → found/confirmedAbsent/unknown.
send(sessionRef, structuredInstruction) → turnRef.
cancel(sessionRef) → requested/confirmed/unsupported.
events(sessionRef,cursor) → canonical runtime event stream.
Core profile discovery'nin doğrudan secret/settings payload'ına güvenmez; validate/redact.

## Paseo SDK
Referans source commit: 5805b776c2deaa745a2abe6590f12e25ddc1b9c2; npm sürümüyle birebir eşit
olduğu varsayılmaz. S0 gerçek daemon+SDK semver pin/typecheck/smoke gerektirir.
Paket: @getpaseo/client; createPaseoClient → connect → client.agents.create.
SDK config.provider provider/model birleşik kimliğidir. Seçimi discovery'den yap; model adını tahmin etme.
Worktree ve label/correlation API'si kurulu sürümde typecheck edilir; unsupportedsa UNKNOWN yolu.
waitForFinish sonuçları idle/permission/error/timeout; idle sadece turn bitti.
Timeout cancel değildir. SDK connection close agent'ı kapatmaz.
archive runtime'ı kapatabilir ve parent children etkisi vardır; detach/cascade probe edilmeden geniş cancel yok.
Best-effort hooks replay değildir. Native plugin reload subprocess'i durdurabilir.
İlk core plugin process'i değil ayrı OS-managed servis. Hook yalnız durable inbox event kaydeder.

## Sandbox örneklerini doğrula
Codex sandbox_mode/approval_policy ve Claude failIfUnavailable seçenekleri provider-native.
approval_policy never + sandbox yok = unattended full access riski; full-access default yok.
Her writable profile için dışa-yazma/secret/network/child-spawn negative testleri.
Capability boolean bir güvenlik kanıtı değil; observed probe receipt saklanır.

## Completion adapter
OpenAI-compatible/Anthropic/yerel endpoint yalnız read-only plan/özet/rubric.
Fetch timeout/abort, structured output check, usage nullable, request/responses redact.
Model completion tool-running coder değildir. Host process eval/js/shell ile model metni çalıştırılmaz.
İkinci full runner: tool broker+sandbox+artifacts+cancel+recovery contract testleriyle ayrı faz.

## Genişleme kuralı
Yeni adapter registry entry + adapter tests + capability manifest; core'da vendor if/else yok.
Yeni task türü recipe/evaluator/policy ekler; salt adapter eklemek CAD/browser/mail desteği sayılmaz.
Paseo yokken demo/salt-okur devam eder; coding run blocked; completion'a sessiz coder fallback yok.
