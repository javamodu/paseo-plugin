# Builder backlog — sırayla, çalışan dikey dilimler
| ID | İş | Önkoşul | Zorunlu çıkış |
|---|---|---|---|
| B00 | Runtime/SDK semver pin, sandbox and model capability probe | owner environment | A01,A02 gerçek |
| B01 | TypeBox contracts, recipe validation, domain graph/state | baseline review | A03,A04 |
| B02 | SQL migration, commands/outbox/reservations, transaction tests | B01 | A05,A06,A07,A35 |
| B03 | Paseo adapter start/inspect/correlation/cancel | B00,B02 | A08,A09,A10 |
| B04 | Protected evaluator, candidate freeze, artifact receipts | B00,B01 | A11,A12,A13 |
| B05 | Headless manager→draft→approve→run→bounded repair | B02–B04 | A14,A15,A16,A36 |
| B06 | Local auth, read API, cursor SSE and command route | B02 | A17,A18 |
| B07 | 3-view React UI, scoped composer and decisions | B05,B06 | A19,A20,A21 |
| B08 | Parallel fairness + budget race + lease/fence | B05 | A22,A23,A24 |
| B09 | Fault injection + STOP/restart + restore | B08 | A25,A26,A27 |
| B10 | Completion read-only adapter | B01,B06 | A28 |
| B11 | Pilot benchmark fixture runner + fair denominator reports | B04,B09 | A29,A30,A31 |
| B12 | Profile rollout + documentation + release check | B07,B11 | A32,A33,A34 |

S0=B00–B01. S1=B02–B05. S2=B06–B07. S3=B08–B09. S4=B10–B12.
Test harness fail injection headless-first; UI development never changes evaluator success rules.
B06 auth precedes exposing any real UI/API. S1 CLI/control API not internet-served.
Single LLM coder first. Parallel builders after contract freeze: UI and adapters independent;
domain/store files one writer. No auto-created agents or autonomous delegation in this delivery.
