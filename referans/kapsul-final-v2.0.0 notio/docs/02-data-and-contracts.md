# Veri otoritesi ve sözleşmeler
## Otorite
SQLite: plan/run/node/attempt/command/onay/rezervasyon/event.
Artifact store: büyük log/rapor/diff ve immutable snapshot referansları.
Git: kod, onaylı recipe/profile/test suite. Markdown/JSON: read-only versioned projection/export.
LLM, worker veya UI DB dosyasına ve kabul suite'ine doğrudan erişmez.

## Nesneler
Capsule: hedef ve repo scope. Plan: immutable DAG, acceptance manifest ve politika.
Run: belirli plan/profile/evaluator sürümünün yürütülmesi; her rerun yeni runId.
Node: recipe adımı. Attempt: node'un her icrası; attemptId tekil.
Command: operator/manager intent; commandId idempotency key.
Evidence: candidateHash + evaluatorHash + environmentHash + trusted exit/receipt.
Approval: run/plan/candidate/policy/action/expiry/actor'a bağlı.
Budget reservation: atomic admit öncesi tahsis; usage settle veya UNKNOWN.
Event: unique ID, DB sequence, correlation, causal command ve redacted payload.

## Kimlik/sürüm
Her kayıt stable ID; session ID attempt değildir. run.version optimistic concurrency'dir.
expectedVersion yanlışsa 409; aynı commandId farklı payload hash'i conflict.
Plan değişikliği yeni immutable planVersion ve açık replan/fork. Eski kanıt korunur.
Attempt number 1-based; unique(runId,nodeId,number). Aynı retry eski attempt'i overwrite etmez.
Scope paths canonical realpath ile policy gate'e gider; string prefix güvenlik değildir.
Secrets profile JSON'a girmeyen environment/keychain reference'lardır.

## Kanıt
Artefact temp dosyaya yaz → hash/size hesapla → atomik rename → DB metadata/receipt bağla.
Blob yazılıp DB commit olmazsa orphan blob GC; DB metadata mevcut olmayan blob'a başarı yazamaz.
Content address append-only niyettir; ayrı OS erişim sınırı gerekir. Hash tek başına anti-tamper imza değildir.
Test receipt evaluator servisinden gelir; coder'ın yazdığı JSON receipt trusted sayılmaz.

## Sözleşme baseline
contracts/schema.json bütün temel DTO'ları kapalı tanımlar; örnekler ayrı fixture'dır.
Production typed schemas contract modülünden export edilir; CI export/baseline diff'i onay ister.
Migration geriye dönük plan/attempt'i sessiz değiştirmez; schemaVersion ve manifest export taşır.
SQL text/json alanları şema kontrolünü server'a bırakır; FK/unique/check DB ikinci kapıdır.
