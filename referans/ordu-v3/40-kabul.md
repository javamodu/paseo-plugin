# 40 — KABUL TESTLERİ (kanıtlı bitiş; qwen 08 kültürü × Final A-IDs)

> Kural (değişmez): her madde ya `GEÇTİ + kanıt(komut+çıktı özü)` ya
> `BAŞARISIZ` ya `NOT_RUN`. Kanıtsız PASS = bug. Liste geçilmeden faz geçilmez.
> A## = Final `tests/ACCEPTANCE.csv` (oradaki canonical tanım; burada yalnız
> işletme sırası + v3-yerel testler var).

## S0 — Pin+Probe (kapılar: A01 A02 A03 A04)
V3-S0.1 `npm run probe` çıktısı: SDK/daemon semver pinli, unsupported
capability `blocked` listelenmiş (A01). **GEÇTİ-kısmi (2026-10-13):**
`ordu-core/evidence/probe-latest.json` — node 24.18 pin ✓, git ✓, paseo 0.11.2 ✓,
daemon ✓; blocked=[worktreeIsolationProven, sandboxEstablished, structuredOutput,
usageReporting, cancelConfirm] → S1 kanıtı bekleniyor, spawn YOK (fail-closed).
V3-S0.2 tip-testleri: kapalı payload
şemaları boş/dallanmış nesneyi RED ile geçiyor (A03 + K1). **GEÇTİ (2026-10-13):**
`ordu-core` `npm test` 18/18; negatif küme: boş payload, unknown kind,
kind-dal uyuşmazlığı, ek alan, payloadHash tutarsızlığı, repairAttempt 3,
bozuk date-time + baseline senkron testleri.

## S1 — Güvenli headless uçtan uca (kapılar: A05–A16, A35, A36)
**Store katmanı GEÇTİ (2026-10-13, `ordu-core` 30/30):** A05 dedupe, A06/A07
atomik dispatch+rollback, A13 sahte-PASS/0-test/exit-yalanı RED, A16 STOP latch
dispatch reddi, **A35.1/A35.2 baseline UPDATE kaçamakları kapandı**
(`002-hardening.sql`), A36 minimum stale-fence (bump→eski sahip RED, aday hash
immutable, kanıt fence bağlı), K1 write-path (boş payload deftere yazılamaz).
**Dispatcher GEÇTİ (2026-10-13, 36/36, deterministik fake adapter):** latch→spawn-0
(A16/S7 okuma sırası), cevapsız spawn→UNKNOWN + kör re-spawn YOK + reconcile
DEAD/ALIVE yolları (A08), 429→gecikmeli PENDING (reserve yanmaz), RUNNING-değil→STALE.
**Adapter+Evaluator+CLI GEÇTİ (2026-10-13, 47/47 hermetik):** B02 kapısı gerçek probe
receipt'i bağımsız doğrular (hash tahrifatı/bayatlık/iç tutarsızlık → yükleme RED;
blocked → transport'a dokunmadan FATAL; ORDU_LIVE=1 beyanı şart); korunan evaluator
(A11/A13/M19: donmuş plan allowlist, exit-0+0-test→FAIL, stale-fence kanıt yazamaz,
gerçek node-fixture PASS koşusu); CLI status/stop/resume sürtünme kapısı (yanlış onay
metni latch'i açmaz) + tick blocked→exit-2. **Bu turda AÇIKÇA BULUNAN restart bug'i
kapandı:** openStore ikinci açılışta migration'ları tekrar koşuyordu → user_version
damgası ile idempotent (V3-S1.4'ün hermetik ön koşulu artık GEÇTİ, gerçek kill -9
NOT_RUN).
KALAN (NOT_RUN): V3-S1.1 TEK GERÇEK KAPSÜL: hedef→plan→onay→coder→frozen candidate→korunan
evaluator→insan kabulü, hepsi CLI'dan, UI'sız (A14). V3-S1.2 crash noktala:
spawn-sonrası-yanıt-öncesi → reconciliation, kör re-spawn yok (A08). V3-S1.3
aynı komut 2× → tek mantıksal koşu (A05). V3-S1.4 STOP ortasında kill -9 →
restart'ta latch açık, dispatch yok (A16+A35/A36 mutasyon denemeleri reddi).
V3-S1.5 sıfır-test/sahte-PASS → gate KIRMIZI (A13).

## S2 — Tek pano + uzaktan (kapılar: A17–A21)
V3-S2.1 telefon (aynı ağ) → 5 sn'de canlı; kop→"donmuş" rozet→geri→kayıpsız
(A18/A20). V3-S2.2 HEDEF TESTİ (senin testin): yabancı birine 3 dk göster →
"şu an ne oluyor, senden ne isteniyor" 3'ten az soruda cevaplıyor; değilse
sadelik ihlali, düzelt (qwen P1-7 mirası). V3-S2.3 heartbeat sessiz-akış:
karar yoksa bildirim YOK; karar varsa ≤1 dokunuşla çözülür (20 §2).
V3-S2.4 erişim güvenliği (M04, A17 ile birlikte kanıtlanır): token iptali sonrası
canlı akış GERÇEKTEN kesilir; core portu LAN'a yayınlanmıyor (bind kanıtı);
anonim istek fail-closed RED (20 §8). V3-S2.5 bildirim dayanıklılığı (M07):
outbox restart'ta duplike/eksik YOK; provider hatası görünür (20 §9).

## S3 — Dayanıklılık (kapılar: A22–A27)
V3-S3.1 iki izole kapsül + kapasite kıtlığı: `WAIT_CAPACITY` yakmasız bekleme
(A24). V3-S3.2 fault-matrix çalıştırma raporu: 429/auth/ölüm/disk-full/yarım
kayıt (A25) + yedekten dönüş (A26). V3-S3.3 konak kısıtları (M16): disk-dolusu
senaryosu dispatch'i durdurup CRITICAL kartı üretir; worker varken uyku politikası
zamanlanmış görevlerin misfire kaydıyla doğrulanır (20 §10).

## S4 — Öğrenen ordu (kapılar: A28–A34 + Ö)
Ö-1 L1 hattı: tekrar eden imza → retry promptunda tek satır, defterde izi.
Ö-2 öneri üretimi: retro kartı kapalı şemaya uygun + kanıt olay-id listeli.
Ö-3 çift ONAY akışı: `dene` olmadan deney koşusu BAŞLAMAZ; `uygula` olmadan
profil sürümü DEĞİŞMEZ (F1 doğrulaması: manager'ın kendi kendine uygulaması
ENGELLENİR — negatif test).
Ö-4 canary regresyonda otomatik geri-al + kart düşer.
Ö-5 üç-sprint trend tanımı hesaplanabiliyor (30 §5); veri yoksa `bilinmiyor`.
V3-EDIT.1 (kolay-edit şartı): `roller/coder.md` satır ekle → validator →
dry-run diff → onay → yeni run'da görünüyor; koşan run'da görünmÜYOR; toplam
≤4 adım, kod derlemesi yok.
V3-EDIT.2: `config/ordu.json` paralel tavan 2→3 → yeni dispatch 3'e çıkar,
koşan 2 iş bozulmaz; güvenlik maddesi gevşetme denemesi validator RED.
V3-S4.3 zamanlı görevler (M08–M10): restart + duplicate-trigger provasında
occurrence TEK koşar; STOP altındaki pencerede "atlandı" kanıtı düşer, catch-up
burst YOK; DST kaydırma testinde önizleme=gözlem (20 §6).
V3-S4.4 oto-kabul şeridi (M17): grant'siz kapalı başlar; sahte-kanıt şeridi
geçmez (A13 zinciri); şerit-merge denemesi RED; tek-dokunuş iptal sonrası tüm
şerit kararları insan-kartına döner; güvenlik kapsüllü iş şeride giremez (20 §7).
V3-S4.5 reasoning makbuzu (M18): uydurma atıf/eksik kaynaklı çıktı DELIVERED
olamaz; belirsizlik eşiği aşınca insan-kartı; makbuz metninin shell yürütme
denemesi engellenir; bekçi örneklem-alıntı denetimi çalışır (30 §6).

## Çift-runtime kapıları (ADR-012 / K-0005 — "paseo olmadan da çalışabilsin")
V3-RT.0 GEÇTİ (2026-10-13, 51/51 hermetik): `local-runtime.ts` — runtime-kapsamlı
kapı (paseo yetenekleri blocked iken local kanıtlarıyla spawn DOĞAR; eksik local
kanıtı → launcher'a dokunmadan FATAL; `ORDU_RUNTIME=local` beyanı şart); launch
belirsizliği → UNKNOWN + kör re-spawn YOK; registry'de olmayan key uydurma DEAD
OLMAZ; cancel = kill + doğrulanmış DEAD.
V3-RT.1 NOT_RUN (canlı, harcamasız): gerçek `git worktree add/remove` provası +
durable registry yazımı → `gitWorktreeProven`, `processRegistryDurable` kanıtları.
V3-RT.2 NOT_RUN (canlı, kısa): provider CLI ile tek gerçek local worker uç uca
(dispatch→çalışan→evaluator→kanıt); `cancelConfirmLocal` iptal provası dahil.
V3-RT.3 NOT_RUN (S2): local runtime'da bildirim fallback'i (SSE + webhook) sessiz-
akış sözleşmesini heartbeat ile aynı şekilde geçirir.
Sabitler (değişmez): tek defter/tek kapı seti (Y1); oto-kabul şeridi local'de
sandbox-eşdeğeri kanıtlanana dek KAPALI; merge her zaman insan (A14).

## K-0006 iş-moda/uydurma kapıları (Kapsul-Autonomous-Army-Master-v3.0.0 devralma)
V3-MOD.0 GEÇTİ (2026-10-13, 59/59 hermetik): `modes.ts` + `config/ordu.json` — mod
tavanı ÖLÇEKLER, kapıyı GEVŞETMEZ. Kanıt: firtina `settings.max_workers` eşikini 2→4
kaydırır (3./4. rezervasyon geçer, 5. RED — kapı kalkmadı, sadece büyüdü);
`hardMaxWorkers=8` ASLA aşılmaz; mod nesnesine enjekte edilen `dispatch_paused:false`
damıtılır (sonuca sızmaz); STOP latch açıkken applyMode firtina bile dispatch üRETEM
(rezervasyon /global_stop/ RED, `dispatch_paused` sütunu değmez); bilinmeyen mod →
fail-closed. KALAN (NOT_RUN): canlı dispatch'te mod etkisi + ekonomi token tavanının
gerçek usage'a uygulanması (S3). ADP uydurma-kontrolü: kod yalnız spawn+lookup taşır →
S2 API'de gonder/iptal/olaylar eklenene dek KISMEN (Y5 — ölçümsüz GEÇTİ yok).

## Operatör teslim töresi (her faz sonu)
Demo kaydı + GEÇTİ tablosu + BİLİNEN LIMITLER listesi. Yeni özellik sayısı
başarı metriği DEĞİL (GPT §16); tek soru: "kabul edilmiş iş daha ucuz/güvenli
geldi mi?"
