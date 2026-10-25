# Benchmark ve model seçimi
## Amaç
Hız+kalite = accepted task'ı düşük toplam maliyet, az insan rework ve güvenilir sürede bitirmek.
LOC/saat kalite metriği değil. Ölçülen birim profile manifest; model tek başına değil.

## İlk paket
6 gerçek repo vakası: bug fix, küçük feature, bounded refactor, test design, spec/plan, scope refusal.
2 aday profile × 2 paired repeat × 6 vaka = 24 pilot koşu.
Pilot kesin üstünlük veya sağlam p95 iddiasına yetmez. Adversarial/recovery ayrı operational suite.
Coding cases pinned repo/evaluator; metin cases owner rubric+schema+blind reviewer.
Holdout ayrı tutulur; test suite worker'ın görüp değiştirdiği training set değildir.

## Yöntem sırası
1. Capability smoke: auth/model/structured output/usage/cancel/sandbox.
2. Sabit repo görevleri ve paired baseline.
3. Security negative controls ve fake success/evaluator tampering.
4. Long-run fault injection; state recovery modele atfedilmez.
5. Kör rubric + insan calibration; LLM judge yardımcı.
6. Holdout/regression, sonra canary/shadow/A-B.
7. Ablation: tek coder vs coder+reviewer; gerçekten değer ekleyen rol.
Büyük sentetik “okul/mezuniyet” sistemi yok; küçük versioned fixtures ve batch runner var.

## Adil kıyas
Aynı repo commit, evaluator, prompt/policy, tools, max attempts/time/reservation.
Order randomized; host load/cache/rate limit timestamps kaydedilir.
Provider fiyat/abonelik ve latency model ayrı. Aynı provider sınırlaması sonucu bozmamalı.
Maksimum benchmark spend operatörce onaylanır; production capacity'yi aç bırakmaz.
Evaluator confidence unknown => verdict UNKNOWN; sabit judge'ın doğruluğu ölçülmeden final otorite değil.

## Formüller
acceptedRate = acceptedTasks / startedTasks.
firstPassRate = acceptedOnFirstAttempt / startedTasks.
totalCostPerAccepted = allKnownTrialCosts / acceptedTasks yalnız cost coverage complete ise.
Cost incomplete: known total + unknown trials; tek cost ranking yok.
Rework = tüm repair attempts + human revision; yalnız başarılı tasks ortalamasına saklanmaz.
Time: accepted completion distribution + separately failure/timeout counts and capped duration.
Raw tokens: input/output/cache ayrı ve priceVersion ile; unknown USD null.
Zero started denominator null; acceptance=0 cost-per-accepted undefined.
Belirsizlik: n, pass/total, paired case differences. Küçük n'de p95 veya bootstrap precision yanıltıcı.

## Model seçimi
Required capabilities/security → role quality floor → accepted cost/time tradeoff → manual profile.
Yüksek güvence kritik iş; Dengeli varsayılan; Ekonomik yalnız kabul/evaluator kapısı değişmeden.
Başlangıçta bir manager/coder profile; yüzlerce model dropdown yok.
Yeni profile düşük risk canary, insan onayı, rollback. Worker kendi routing puanını yazamaz.
Fallback permission recorded; failed run costs yeni modelden silinmez.
