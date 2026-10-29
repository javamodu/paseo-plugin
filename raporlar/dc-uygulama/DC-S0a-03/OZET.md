# DC-S0a-03 — Kullanım, süreç ve kalıcı bağ tasarımı (salt-okur)

**Kimlik:** DC-S0a-03 · ATOM-H1-2026-10-28.2 · **2026-10-30T01:18:39.886+03:00**

## Öneri

Yetkili süreç, iptal ve kullanım mutabakatı **core SQLite defterinde** kalıcı tablolarla bağlanmalı; ham sağlayıcı/runtime çıktısı **doğrulanan artefakt** olarak hash bağıyla tutulmalı. Artefakt tek başına otoriter olmamalı; ikinci otoriter DB/defter açılmamalı. Bu bir onay değil, S0a-04 ADR önerisi için girdidir.

## Mevcut bağlar

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `plans/PLAN.md` | `271a76f35ef65d4e62d7c6ea5dfa065774aa4bd662f710660a8c3b1adc013b84` | 95704 |
| `core/src/store.ts` | `e46ed62f7cfade8bc5197b9d20681ebc5bbfe75c74540c83ede9afbb62da9f05` | 13415 |
| `core/src/supervisor.ts` | `ae73fc2364eb210719d02b3a4fc2806eae3e06e334689b692c725ac0ca9a0ad4` | 38978 |
| `core/src/local-runtime.ts` | `bdb7aea4fab2ceda162cfa75092ad8a38de756a3f8c6cacd59b79b032b058d54` | 17033 |
| `core/src/dispatcher.ts` | `f74e63ab8643c624d9d45b78c25af805e25fc7af3dc80b8a8bd77d5f613744f7` | 15876 |
| `core/src/gozetimsiz.ts` | `e6c691706b36a2c81054db6685cb64d9e79a993376a75f091d5dca6ebc2d8eb6` | 14532 |
| `core/src/grants.ts` | `fa70a1dd2bab7e7e174ddc4444e729ec94d8b422a791cdb0aed8145552eb5791` | 16428 |
| `core/database/001-initial.sql` | `06716b653e94931b8c1b9ad1be80559fc727987a0c923e5a98d8ab2083d0d61f` | 7367 |
| `core/database/002-hardening.sql` | `30b9247817ea4c3f64e94c3d3ce768d085a1fe0969dfd93abeda5709fe5572ce` | 2068 |
| `core/database/003-role-model.sql` | `9a0c31a5810c86c15548d67a9593020609d788e5d30997a7a5714039180d35e6` | 347 |
| `core/database/004-grants.sql` | `70db559a17ad73b5d6a578386ce7a4354d2f738f65fe3456b24ab8c7af2bd77c` | 3616 |

- `core/src/store.ts`: `openStore`, `user_version` ile 001–004 göçlerini uygular; komut/olay/outbox/rezervasyon tek transaction'da doğar. `settleReservation` `spent_tokens` ekler ve `BUDGET_SETTLED` olayı yazar.
- `core/src/supervisor.ts`: plan/run/attempt kimlik zinciri, plan onayı, kapasite ve dispatch kapıları, aday dondurma, teslim onayı ve asılı run süpürme mevcuttur.
- `core/src/dispatcher.ts`: PENDING→SENDING→SENT/UNKNOWN/FINAL geçişleri, `external_session_id`, `dispatch_key`, fencing ve ölüm gözlemi ile kapanış sağlar.
- `core/src/local-runtime.ts`: pid, worktree ve output kaydı ayrı JSONL registry'de yaşar; iptal `process.kill(pid)` + 2 saniyelik ölüm teyidi ile çalışır.
- `core/src/grants.ts` + `core/database/004-grants.sql`: vekil yetkisi, token/retry bütçeleri, revoke/expiry ve in-flight iptal niyeti deftere bağlıdır.
- `core/src/gozetimsiz.ts`: UNKNOWN rezervasyon, teyitsiz iptal, `usage_unknown`, dosya/shell sınırı, grant etkisi ve stale-fence koşullarını sorgular; tazelik penceresi fail-closed.

## Kullanım fizibilitesi

| Kategori | Mevcut durum | Öneri |
|---|---|---|
| Gerçek tüketim | Bu kaynak kümesinde sağlayıcı/runtime usage kaynağı yok; `settleNodeOutcome` çağrıları `spentTokens=0` ile settlement yapıyor | Aday kaynak seçilmeden KNOWN yazılmaz; ayrı sağlayıcı ölçümü/oturum dökümü onay gerektirir |
| Bağımsız limit | `reservations.tokens`, `max_reserved_tokens`, `max_workers` ve `usage_unknown` dispatch öncesi kapı sağlar | Yeni etki önünde korunabilir; gerçek tüketim yerine geçmez |
| Bilinmeyen tüketim | `UNKNOWN` rezervasyon / `usage_unknown=1` temsil eder | Sıfır, KNOWN veya tahmine çevrilmez; yeni etki başlamaz |
| Alt süreç/test/onarım | Ölçüm tanımı ve kaynağı yok | Mutabakat kapsamına dahil edilmeli; kapsam dışı bırakılmamalı |

## Süreç ve iptal tasarımı

- `attempt.external_session_id`, `outbox.dispatch_key`, `fencing_token` ve lokal pid registry mevcut; ancak OS oluşturma kimliği, süreç ağacı ve iptal nesli kalıcı tek tabloda birleşmiyor.
- Önerilen bağ kümesi: `attempt_id`, `dispatch_key`, `external_session_id`, OS process identity/creation bilgi, parent/child ilişkisi, `fencing_token`, worktree/output referansı, iptal talep kimliği ve teyit durumu.
- İptal teyidi run geneli değil; **attempt + güncel fencing/nesil + ilgili talep** ile eşleşmeli. Eski teyit yeni talebi kapatamaz.
- PID tek başına sahiplik kanıtı sayılmaz; `process.kill(pid)` ve kısa süreli yoklama ölüm teyidi için yeterli kalıcı kimlik değildir.
- Süre dolması, sessizlik veya `TIMEOUT_UNCONFIRMED` ölüm kanıtı değildir; UNKNOWN ve insan kartı korunmalı.

## Göç/artefakt seçenekleri

1. **Core göçü (önerilen):** yeni kalıcı bağ/mutabakat tabloları tek SQLite otoritesine eklenir. Eski satır/hash/olay anlamı değişmez; yeni okuyucu eski kayıtları açık `legacy` semantiğiyle okur.
2. **Artefakt-yan dosya:** yalnız ham log/usage dökümü ve hash kanıtı için kullanılabilir. Yetki veya limit kaynağı yapılmaz; ikinci otoriter defter riski taşır.
3. **Hibrit ( sınır ):** core yetkili özet/hash/idempotency anahtarını tutar; doğrulanan artefakt ham veriyi saklar. Çift-doğru-kaynak riski, tek yön core→artifact referansı ile kontrol edilir.

## Belirsizlik ve maliyet

- Gerçek usage kaynağı: sağlayıcı API, oturum dökümü veya harici ölçer seçilmemiş; ölçüm kapsamı alt süreç/test/onarım dahil netleşmeli.
- Windows süreç kimliği: creation id/süreç ağacı ve PID reuse ayrımı için OS davranış kanıtı gerekir; bu fişte deney yapılmadı.
- R6 kümesi: yeni Command/Event türü önerisi onaysız uygulanamaz; tablo/iç payload seçeneği ADR'de tartışılmalı.
- Göç maliyeti: yeni migration, uyumluluk testi, eski kayıt okuma semantiği ve replay senaryoları gerekir.
- İptal maliyeti: nesil eşleme, tree kill/ölüm teyidi, STOP sırasında güvenlik bakımı ve bağımsız tester senaryoları gerekir.

## Gözlemler

- **P1:** Gerçek tüketim, bağımsız limit ve bilinmeyen tüketim yukarıda ayrı tanımlanmıştır.
- **P2:** Tek defter/core göç önerisi ile eski kayıt/hash/olay uyumu yolu ve artefaktın sınırlı rolü tanımlanmıştır.
- **N1:** Rezervasyon tüketim, süre dolması ölüm teyidi veya bilinmeyen kullanım sıfır sayılmamıştır.
- **N2:** `openStore`/CLI status/üretim DB açılmadı; sağlayıcı ölçümü yapılmış gibi yazılmadı.

## Sonuç

**Durum:** `EVIDENCE_RECORDED` — tasarım önerisidir; göç onayı, gerçek kullanım kaynağı, ürün PASS veya insan kapısı değildir.
