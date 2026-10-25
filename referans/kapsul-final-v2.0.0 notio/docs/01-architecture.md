# Mimari ve kod sınırları
## Tek dağıtılabilir uygulama
Tarayıcı → Fastify API + snapshot/SSE → saf domain → DB repository/outbox dispatcher →
RuntimeAdapter → Paseo daemon / read-only model endpoint.
Evaluator ayrı sınırlı process/container'da çalışır; host control process'i repo kodunu çalıştırmaz.
Artefact deposu control kullanıcısının private dizininde içerik hash'i ile saklanır.

```text
src/
  contracts/       TypeBox DTO + event registry; import-safe
  domain/          state, graph, approval, budget; IO yok
  store/           sqlite repositories + transaction boundaries
  control/         commands, dispatcher, reconciliation
  adapters/        paseo.ts, completion.ts; provider details burada
  evaluator/       pinned-suite runner, receipt, artifact writer
  api/             routes, auth, SSE; iş kararı yok
  web/             shell, capsules, decisions, lab, shared primitives
config/            versioned recipes/profiles; credential yok
migrations/        ileri-only numbered SQL
tests/             unit, store, adapter, faults, browser, eval
```
Tek package.json/lockfile, tek repo; workspace monorepo ve onlarca package yok.
Domain adapters/api/web'i import etmez. Web store/runtime'ı import etmez.
Adapter yalnız canonical event üretir; kendi başarı ilanı kapsülü kabul ettirmez.
Uzun IO DB transaction içinde beklemez. Manager ve test runner hook callback içinde çalışmaz.

## Neden TypeBox?
Fastify JSON Schema kontrolüyle aynı tanım; TypeScript tipi de aynı kaynaktan çıkar.
Zod+JSON Schema+elle interface üçlemesi yok. TypeBox/Ajv version uyumu S0 typecheck ile doğrulanır.
Statik DTO kontrolü niyet, path güvenliği veya tool capability kanıtı değildir.

## Mevcut runtime'dan yeniden kullanılanlar
Paseo agent lifecycle, provider discovery, terminal ve worktree araçları; SDK bağlantısı.
Yeni yazılanlar: kapsül hedef/plan, güvenli dispatcher, bağımsız evaluator, onay, audit ve küçük UI.
Manager tooling dar command broker'ıdır; raw spawn/merge yetkisi verilmez.

## Portability
Canonical contracts, SQL export, source snapshot, receipt ve profile manifest taşınır.
Canlı sohbet/hidden subagent state migrasyonu vaat edilmez. Session carry destek yoksa yeni attempt.
V1 local API; remote browser açma TLS/auth/workspace scoping review gerektirir.

## Dağıtım
`npm run build` sonrası Fastify Vite static çıktısını servis eder. Tek localhost port.
Development Vite proxy; production iki server yok. OS service control process'i yeniden açar,
task recovery ise reconciliation ile yapılır. Plugin UI sonradan aynı API'nin ince istemcisi olur.
