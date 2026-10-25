# Referans SQL
Private DB; workers bu dosyayı açamaz. SQL migration saf seed testleriyle doğrulanır.
Admit transaction BEGIN IMMEDIATE; attempt+reservation+outbox+event atomik.
Default STOP latch=1; operatör açık start ve capability gate sonrası açar.
Constraints temel data integrity sağlar; time/expiry/policy/fencing/auth/immutable evaluator
production repository ve supervisor'da test edilmelidir.
Token settle actual usage+spent update+reservation transition aynı transaction.
Usage gerçek veya estimated/unknown kaynağı ayrı tutulur; overshoot olasılığı UI'da açık.
Artifact content write-once/read-only OS policy SQL migration'ın dışında uygulanır.
Events retentions/GC için delete yasağı migration ile gözden geçirilir; aktif audit silinmez.
