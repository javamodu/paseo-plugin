# Kodlayan LLM için çalışma sözleşmesi
1. README → MASTER → ilgili docs → contracts → backlog task → acceptance IDs.
2. Bir PR bir dar task. Plan/meta belgeleri değiştirerek çalışmayan kodu PASS yapma.
3. Başka agent'ın scope dosyasını overwrite etme; shared contract değişikliği ayrı ADR.
4. Domain saf; IO adapter/store'da; UI iş kuralı otoritesi değil.
5. Secrets/model/provider settings uydurma. Capability bilinmiyorsa blocked/unknown.
6. Schema/evaluator/policy gevşetme; test failure'ı başarı sayma; model kendi çıktısını kabul etmesin.
7. Her dispatch kalıcı intent/outbox/reservation; ambiguous start'ta blind retry yasak.
8. Failing test → root cause → bounded patch → bağımsız receipt. İki aynı failure'da soru/karar.
9. Profil prompt değişikliği version/hash ve regression; active run sessiz değiştirilmez.
10. Production merge/deploy bu recipe'de yok. Paket “final” ifadesi insan onayı yerine geçmez.

## Task input
taskId, allowedPaths, forbiddenPaths, contractVersion, acceptanceIds, fixtures, output artifact.
## Handoff
NE DEĞİŞTİ / test komutu+gerçek sonuç / kabul IDs / bilinen limit / next blocker.
NOT_RUN açık yazılır; mock test real adapter test değildir.
## Dosya ilkesi
Basit küçük fonksiyon; explicit dependencies; no frameworks for agent loops.
Yeni dependency önce necessity/license/version ADR. Codegen çıktısı elle edit edilmez.
