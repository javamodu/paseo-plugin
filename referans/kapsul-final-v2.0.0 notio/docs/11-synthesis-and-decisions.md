# Üç plandan seçilenler ve reddedilenler
## Alınan
GPT: kapsül odaklı UX, independent core, wanted/observed state, paired benchmark.
Önceki master: Capsule/Plan/Run/Node/Attempt, bound approval, unknown side effect,
lease/fencing/outbox, design vs release lock, acceptance provenance.
Qwen: headless-first, tek command kapısı, static routing, scope/graph-editor restraint.

## Düzeltilen
Dosya SSOT/fold eksikliği → transaction DB + full plan snapshots.
STOP terminal-iptal/START çelişkisi → durable latch + requested/confirmed + yeni rerun.
Atla=bitti → SKIPPED ayrı, acceptance/dependency policy explicit.
Budget sonrası otomatik retry → reserve+settle+blocked extension.
Köprüde aynı mutable repo test → ayrı pinned evaluator ve frozen candidate.
LLM bekçi gate → deterministik enforcement, LLM yalnız semantic advisor.
Plugin subprocess engine → ayrı OS service.
Accepted-only scoreboard → failures/timeouts/costs dahil paydalar.
SDK provider/model ayrı genellemesi → incelenen SDK'da birleşik provider/model; pinned smoke.
Framework zorunlu şişirir iddiası → küçük React UI seçildi; cache/router/state platformu eklenmedi.

## Bilerek dışarıda
Native Paseo UI, Electron, giant fork, graph designer, auto-merge, deploy, hosted multitenancy,
distributed fleet, model self-tuning, broad framework/tool runner rewrite.
Ham completion “universal coder” sayılmaz; UI/data independence universality'nin ilk adımı.

## Hazır repo tavsiyesiyle ilişki
Agent Orchestrator/Kandev hazır kullanım için güçlü alternatifler; belgeler gerçek acceptance kanıtı değil.
Bu paket kendi branded minimal control layer isteyen durum içindir; kullanıcının açık ürün isteğini
herhangi bir hazır app'in fork'uyla otomatik eşitlemez. Büyük repo toplam LOC'si sıfır yeni kod
kullanım avantajını ortadan kaldırmaz; fork bakımını ise büyütebilir.
