# Yürütme, döngü ve kesintiden dönüş
## repair-v1 DAG
Prepare → Produce → Verify → Review/Accept.
Prepare: repo/evaluator baseline ve sandbox probe. Produce: bounded coder adayı.
Produce node SUCCEEDED sadece aday manifesti geçerli demektir; ürün/test kabulü değildir.
Verify: aynı candidate üzerinde korunan suite. Review: gerekiyorsa rubric + insan kararı.
Run ACCEPTED ancak required evidence + geçerli onayla. SKIPPED otomatik dependency satisfaction değildir.

## Admit / start
1. Command hash/key/version/policy kontrolü.
2. BEGIN IMMEDIATE: STOP latch, dependencies, global/run capacity ve bütçe kontrolü.
3. Attempt intent + rezervasyon + outbox + event aynı transaction; commit.
4. Dispatcher outbox delivery lease/fence claim; adapter.start(attempt correlation).
5. Dış session binding transaction; duplicate event unique ID ile dedupe.
6. Süreç canlılığı ve semantik ilerleme ayrı izlenir; heartbeat her sessiz testi kill etmez.
Kapasite dolu → WAIT_CAPACITY; retry sayacı ve bütçe harcanmaz. Waiting task slot tutmaz.

## Kritik crash boşluğu
Session oluşturulup bind commit olmadan process ölebilir. Timeout “spawn olmadı” değildir.
Reconciliation dış oturumu attempt label ile arar; bulunan tek session bind edilir.
Native idempotency varsa kullanılır. Bulunamaması kesin yokluk kanıtı değilse UNKNOWN_EXTERNAL_STATE.
UNKNOWN'da yeni otomatik spawn yok. İnsan lookup/iptal/yeni attempt kararını verir.
Outbox at-least-once delivery'dir; dış side effect exactly-once garantisi değildir.

## Retry
Transient API/429: bounded exponential backoff+jitter; retryAfter kayıtlı.
Test failure: frozen candidate/error signature, yeni Produce attempt; downstream evidence invalidated.
İlk deneme + en çok iki repair başlangıç önerisi; aynı failure signature ikinci kez tekrar ederse erken karar.
Auth/policy/malformed contract: blind retry yok. Provider switch yeni attempt/profile snapshot.
Budget/time bittiğinde normal repair yolu kapalı; insan extension/fork veya durdurma.
Max call tokens reserve; provider usage yoksa hard token/spend garantisi yok, capability policy fail-closed.
Unknown maliyet ücretsiz değildir. Parent budget/permission child'a ancak daralır.

## Repair generations
Yeni candidateHash geldiğinde eski Verify/Review çıktıları history'de kalır ama current kabulden çıkar.
Run version artar, pending eski approvals revocable/stale olur; aynı plan stable node IDs taşır.
Yeni Verify attempt o candidate'ı inputManifestHash'e bağlar. DAG'a back-edge eklenmez.

## Pause / STOP / cancel
PAUSE: yeni dispatch durur; aktif işler devam edebilir, UI bunu söyler.
STOP: kalıcı global dispatch_paused latch önce transaction ile yazılır; sonra cancel request.
Cancel requested → adapter.cancel → observe confirmed → CANCELLED.
Teyit yoksa CANCEL_REQUESTED/UNKNOWN; UI “durdu” demez.
Restart latch'i kaldırmaz. START yalnız latch'i açar; terminal CANCELLED run'ı yeniden diriltmez.
Rerun yeni runId; tek kapsül cancel kardeş kapsülü bozmaz.
Yapılmış network/write side effect iptal ile geri alınmış sayılmaz.

## Restore / restart
Single logical supervisor owner lease. Expired lease tek başına respawn sebebi değildir.
Not (ADR-011/K3): S1 çıkışında minimum stale-result fence ZORUNLU (A36): eski
attempt/epoch taşıyan sonuç commit EDİLEMEZ. Geniş lease/fencing seti S3'te (A23).
1. DB integrity + migrations + latch; 2. live sessions query; 3. pending outbox reconcile;
4. reservations settle/unknown; 5. candidate/evidence/approvals validate; 6. güvenli dispatch.
Eski fencing token state/evidence kabul ettiremez; token OS shell side effect'ini tek başına durdurmaz.
Partial JSONL tail sorunu yok; DB transaction/WAL backup doğru uygulanmalıdır.

## Replay
Audit: yalnız recorded evidence/event göster; dış çağrı yok.
Recovery: pending güvenli operasyonu reconcile ederek devam.
Rerun: yeni run/attempt; yeni model/tool çağrısı; deterministik LLM output iddiası yok.
