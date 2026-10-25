# Testlerin anlamı
domain.test.mjs: saf fonksiyon assertion'ları. database.test.py: fixture SQLite constraints/rollback.
İkisi gerçek provider, sandbox, auth, HTTP, evaluator veya supervisor'ın çalıştığını ispatlamaz.
ACCEPTANCE.csv üretim kapılarıdır; bütün kayıtlar NOT_RUN. Offline PASS bunlara taşınmaz.
Gerçek test evidence formatı: id/commit/SDK/runtime/OS/policy/evaluator/environment/command/
timestamp/exitCode/redacted logs/artifact hash/verdict/assessor.
SQL test ikinci writer lock davranışını kontrol eder; gerçek async scheduling fairness testi değildir.
