# DC-S0a-02 — Windows işçi/test sınırı fizibilitesi (salt-okur)

**Kimlik:** DC-S0a-02 · ATOM-H1-2026-10-28.2 · **2026-10-30T01:12:11.752+03:00**

## Sonuç önerisi

Mevcut kaynaklar, işçi/test/operatör/imzalayıcı ayrımını **uygulama düzeyinde** kısmen kurar; **Windows OS düzeyinde kurduğunu kanıtlamaz**. Bu fiş için seçilmiş hazır OS sınırı yoktur. Aday olarak Windows yerel hesap/grup + NTFS ACL + restricted token/job object kombinasyonu değerlendirilebilir, ama davranış deneyi yapılmadığı için kuruldu iddiası üretilmez.

## Kaynak kanıtı

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `plans/PLAN.md` | `271a76f35ef65d4e62d7c6ea5dfa065774aa4bd662f710660a8c3b1adc013b84` | 95704 |
| `core/src/local-runtime.ts` | `bdb7aea4fab2ceda162cfa75092ad8a38de756a3f8c6cacd59b79b032b058d54` | 17033 |
| `core/src/capabilities.ts` | `f0c81827c3d25c7a21972873db4809be0295397430df41ad9f1b19b188062b01` | 4077 |
| `core/src/probe.mjs` | `6bd46992c534a7df1dbed0f56e480e1f5bdfe01cc2d1264a54e31c3885629bd8` | 12028 |
| `core/src/evaluator.ts` | `8daecda19e6f38a94d1272434cd0e437dd1d48ca7fbee312ec1a7ad771fe7db8` | 3866 |
| `core/src/receipt-link.ts` | `3477bc4c493e76d1696338cd40e9c01da800dca71fc3fc974a3c801fc13dbc4e` | 9990 |
| `plugin/index.server.ts` | `1cc2b683a49ed0c7c992425e38502707637abde90739d80eaa5dd05261499b54` | 12841 |
| `plugin/server/ordu.ts` | `b62e62215f058046f2952ecad2b59d3f5679729d2b16a244e20e29ddff91292a` | 7448 |

- `core/src/local-runtime.ts`: işçi ayrı Git worktree'de ve kalıcı pid defteri ile başlar; ancak `spawn` çağrısı `cwd: worktreePath` ve `env: { ...process.env, ...opts.env }` kullanır. Çocuk, ebeveyn kullanıcısı ve ortamını devralır; worktree bir OS dosya sınırı değil.
- `core/src/capabilities.ts` + `core/src/probe.mjs`: `sandboxEstablished` yalnız statik transport config kanıtıdır; davranışsal sandbox iddiası açıkça yok. Worktree/registry/cancel yetenekleri ayrı kanıtlanır.
- `core/src/evaluator.ts`: test komutu plandan donmuş allowlist ile gelir ve kanıt core DB'ye yazılır; koşucu OS sınırı taşımaz.
- `core/src/receipt-link.ts`: run/attempt/candidate/environment/evaluator/grant/fence bağlarını doğrular; imza yalnız opsiyonel callback'tir.
- `plugin/index.server.ts`: agent create/request öncesi politika hook'ları çağırır; `plugin/server/ordu.ts` manager kuyruğu ve max-paralel freni uygular. Bunlar uygulama katmanıdır.

## Aktör/alan erişim matrisi

| Alan | İşçi | Test | Operatör | İmzalayıcı | Mevcut kanıt |
|---|---|---|---|---|---|
| Çekirdek DB | Doğrudan yok (worktree süreci DB açmıyor) | Evaluator core API üzerinden | Kaynakta ayrı OS kimliği yok | Kaynakta ayrı kimlik yok | `local-runtime.ts`, `evaluator.ts` |
| Onay/istek kanalı | Plugin hook'ları ile kısıtlanmaya aday | Aynı sürecin parçası olabilir | İnsan onayı ayrı kapı | Yok | `plugin/index.server.ts` |
| Korunan suite/anahtar | Açık erişim tanımı yok | Suite hash'i receipt ile bağlanır | Kaynakta tanımsız | Anahtar sahibi adayı; kaynak yok | `receipt-link.ts` |
| Kullanıcı evi/config/sır | Devralınan env ile erişilebilirlik engellenmedi | Aynı kullanıcıyla koşabilir | Aynı süreci yönetebilir | Tanımsız | `local-runtime.ts` |
| Ortak Git alanı | Worktree `cwd`, ancak mutlak yol/Git komutlarıyla kaçış OS düzeyinde engellenmedi | `repoDir` allowlist ama OS sınırı yok | Yönetici erişimi varsayılır | Tanımsız | `local-runtime.ts`, `evaluator.ts` |
| Süreç iptali | `process.kill(pid)` + kısa pencere ölüm teyidi | Aynı mekanizma | Operatör emri ayrı kapı | İlgisiz | `local-runtime.ts` |

## Kaynak kanıtı / OS deneyi ayrımı

**Kaynakla doğrulanan:** worktree başlatma, pid defteri, fail-closed capability kapısı, evaluator allowlist, receipt bağları, plugin politika hook'ları ve kuyruk freni.

**OS davranış deneyi gerektiren:** işçinin worktree dışına yazıp yazamadığı; kullanıcı evi/config erişimi; env sızıntısı; Git nesne alanına erişim; restricted token/job object altında yazma/spawn engeli; iptalin alt süreçleri kapsaması; ACL'nin DB/suite/anahtar alanını gerçekten koruması.

## S0b zararsız sınama önerisi

S0b ancak ayrı izinle: yalnız tek kullanımlık temp repo/worktree, sahte CLI, geçici pid defteri ve temp hedef dosyaları kullanılmalı. Üretim DB, kullanıcı evi, sağlayıcı çağrısı, ortak repo ve gerçek anahtar yok. Ölçüler: path-escape RED, env minimalizasyonu, dış-yazma engeli, kill teyidi ve işçi/test ACL ayrımı. Davranış kanıtı alınamazsa BLOCKED kaydedilir.

## Gözlemler

- **P1:** Matris, çekirdek DB, onay kanalı, korunan suite/anahtar, kullanıcı evi ve ortak Git alanı için işçi/test/operatör/imzalayıcı erişimlerini ayrı tanımlar.
- **P2:** Mevcut kaynak kanıtları ile OS davranış deneyi gerektiren iddialar yukarıda ayrı başlıkta ayrılmıştır.
- **N1:** Worktree, statik capability `sandboxEstablished` veya plugin hook'u OS sandbox kanıtı sayılmadı.
- **N2:** Kullanıcı evi/config/sır/env değeri okunmadı; sınır deneyi, süreç öldürme, DB/CLI/sağlayıcı çağrısı yapılmadı.

## Sonuç

**Durum:** `EVIDENCE_RECORDED` — öneri ve kanıt kaydıdır; OS sınırının kurulduğu, ürün PASS olduğu veya insan kapısı geçildiği anlamına gelmez.
