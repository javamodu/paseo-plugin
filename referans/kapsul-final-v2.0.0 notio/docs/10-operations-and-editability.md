# Operasyon, kolay düzenleme ve bakım
## Kolay değişiklik haritası
Metin/renk/layout → src/web/*.tsx + tokens.css.
Rol promptu → config/prompts/*.md; promptVersion/hash yeni run'a snapshot.
Model/provider → config/profiles/*.json; secret reference, capability probe.
Görev akışı → config/recipes/repair-v1.json; DAG/checker + evaluator binding.
Limit/yetki → config/policies/*.json; active run otomatik genişlemez; diff+approval.
State/recovery → src/domain, control; kabul testini aynı PR'da güncelle.
Adapter → src/adapters; başka modüllerde vendor şartı ekleme.
Schema → src/contracts; generated JSON diff, migration, negative fixture.

## LLM-friendly geliştirme
Küçük cohesive modüller; genellikle 150–300 satır, bu hard kalite sınırı değil.
Her dosyada kısa purpose ve exported contract; gizli global state yok.
Saf domain fonksiyonu + explicit dependency injection (constructor arguments; DI framework yok).
Tek accepted command handler; UI/model aynı yolu kullanır. Büyük tek app.js production önerisi değil.
No dynamic eval, reflection registry, magical decorators, parallel implementation alternatives.
Her task verilen files/acceptance ile dar; aynı dosyada iki yazıcı yok.
Test/contract sabit, agent code diff küçük. Reviewer coder çıktısı üstüne bağımsız test receipt ister.

## Service ve kaynaklar
OS service restarts process; latch+reconcile tasks. SQLite private data directory,
WAL-aware backup. Artifact retention önce reference ownership; aktif run evidence silinmez.
Disk pressure yeni dispatch'i durdurur; emergency event alternatif stderr sanitized.
Logs rotate/secret redact; sensitive transcript retention ayrı.
Health: DB integrity/version, queue age, unresolved external, active lease, missing evidence.
Tek JSON structured log; ilk sürüm ayrı telemetry cluster yok.

## Backup/restore
SQLite online backup API veya checkpoint-safe backup; canlı yalnız .db copy yapılmaz.
Artifact content manifest + files consistent snapshot. Restore isolated host, validate refs,
dispatch paused açılış, session reconciliation, operator enable. Restore dış side effect'i geri almaz.
Shutdown: latch pause, finish durable writes, controlled cancel/wait, service exit.

## Update
Pinned lockfile/SBOM + migration rehearsal + rollback backup.
Run manifest old prompt/model versionını korur; provider sürüm kayması detected/recorded.
Schema upgrade eski run'ı sessiz rewrite etmez. Active attempt ortasında profile switch yok.
