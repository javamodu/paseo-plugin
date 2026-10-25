# 00 — MASTER: ORDU-V3 (v3.1)
> Runtime kapsamı ADR-012/K-0005 ile Paseo-opsiyoneldir; ek güvenlik/parite koşulları [ortak runtime rehberinde](../gpt/RUNTIME.md). Local modun kendi sandbox/usage/cancel/registry/evaluator kanıtları gerekir; düşük risk tek başına izolasyon kanıtı değildir. Fake local PASS, Paseo kapalı host'ta gerçek end-to-end teslim PASS'i değildir.

## 1. Amaç

Tek kullanıcılı, local-first **görev kapsülü komuta sistemi**: hedefi yazarsın,
manager plan kurar, ordu (coder/tester/bekçi/vekil + reasoning kademeleri)
izole worktree'lerde koşar, **bağımsız makine kapısı** kabul eder, sen yalnız
izlersin ve nadiren tek dokunuş karar verirsin; sistem doğrulanmış derslerle
kendi prompt/politika/profil önerilerini üretir — öneriler daima insan
onayıyla aktifleşir.

## 2. ÇEKİRDEK DÖNGÜ (GPT zihin modeli × Final yürütme protokolü × Qwen teslim disiplini)

```
HEDEF (composer, tek metin)
 → MANAGER plan taslağı: kapsül/düğüm/rol/bağımlılık/kabul kapısı/bütçe/risk
 → İNSAN ONAYI (tek "Başlat") — plan önizlemesiz dispatch YOK
 → DISPATCH: bağımlılıkları geçmiş düğümler, kapasite varsa, intent+outbox+rezervasyon
   TEK transaction'ta yazılır (Final docs/03; A05-A07, A35)
 → KOŞU: worker izole worktree'de; aday commit DONDURULUR (A11)
 → KABUL: KORUNAN evaluator, donmuş adayda; exit-0 YETMEZ — sıfır-test/sahte-PASS
   negatif kapıları (A12/A13); receipt→store→domain güven zinciri (K4/ADR-011)
 → SONUÇ: geçti → sıradaki düğüm; kaldı → imzalı hataysa bounded repair (≤2),
   değilse/tekrarlanansa KARAR KARTI (Inbox, tek dokunuş)
 → TESLİM: tüm kapılar + gereken insan kararları → "kabul edildi"; merge daima insan
 → ÖĞRENME: sprint kapanışında retrospektif → öneri → deney → onay (30-ogrenme)
```

Yan kurallar: istenen≠gözlenen durum (STOP latch A16); timeout≠iptal; belirsiz
dış etki = kör retry YASAK (A08); atlamak başarı değildir (A04).

## 3. ROL MİMARİSİ (detay: 10-roller.md)

| Rol | Cinsi | İlk sürüm | Neden |
|---|---|---|---|
| Manager | reasoning-ağır | LLM (event-driven, oturum yenilenebilir) | plan/parçalama/özet; kendi bütcesini artıramaz |
| Coder | üretim | tek Paseo worker (P0'da tek, sonra ≤2 paralel) | yazma yetkisi yalnız izole worktree'de |
| Tester | kabul | ÖNCE deterministik runner (kod); test tasarımı gerekirse LLM | yeşili tek başına birleştirme yetkisi değil |
| Bekçi | fren | ÖNCE kod (sayılar); LLM yalnız odak denetiminde | bütçe/lease/kapasite/kapsam — spawn'ı o keser |
| Vekil | rubric | kritik/öznellik kapısında LLM + insan standardı (`kullanici.md`) | kullanıcıyı TAKLİT eder, yetkiyi asla |

"Düğüm" rol değildir; iş birimidir. Reasoning ayrı rol değil KADEMEDİR:
her görev düğümünde `akılSeviyesi: hizli|derin` profili seçilir (10-roller §6).

**Roller arası iki sabit (v3.0.0 §3–4 devralma, K-0006):**
- **LLM ekonomisi:** her düğümde altı rol koşturulMAZ — kod işinde çoğu kez
  manager+coder+evaluator yeter; reasoner/test-designer/vekil yalnız ölçülebilir fayda
  veya recipe gereği çağrılır (token hijyeni, 10-roller §1 girdi kuralıyla uyumlu).
- **Slot sayımı etiketle DEĞİL rezervasyonla:** paralellik tavanı "görev sayısı" ile
  değil ACTIVE/UNKNOWN **kaynak rezervasyonu** ile sayılır; WAITING_APPROVAL/PAUSED
  görünen iş hâlâ slot tutar (A07/A24); görünmez iç nested ajan ölçülemiyorsa KAPALI.

## 4. TEKNOLOJİ (Final D01-D08 aynen; seçenek listesi DEĞİL)

Node 24 LTS + TypeScript · Fastify · TypeBox (kapalı payload şemaları, A03+K1) ·
SQLite/WAL + transactional outbox/reservation (A05-A07, A35) · React+Vite tek
arayüz · `node:sqlite`, native fetch · **ÇİFT-RUNTIME (ADR-012/K-0005): worker
adapter'ı `config/ordu.json → runtime:"paseo"|"local"` seçimiyle çalışır (varsayılan
paseo, geçersiz değer fail-closed dispatch yok). Paseo TS SDK (pin'li sürüm,
capability probe A01) VEYA local yol: core yönetimli `git worktree` + provider CLI
süreci + durable süreç registry — her runtime KENDİ kanıt seti olmadan spawn edemez
(runtime-kapsamlı B02). Dispatch/defter/fence mantığı runtime-bağımsız; ikinci core
YOK (Y1).** Vitest+Playwright (geliştirme aracı; runtime bağımlılığı yok) ·
Redis/Kafka/Temporal/K8s/LangGraph/React-Flow YOK.

**Kolay-edit ilkesi (kullanıcı şartı):** davranış değiştiren her şey dosya —
`config/ordu.json` (limitler/mod), `config/profiller.json` (model+runtime+prompt
sürümü eşlemesi), `roller/*.md` (prompt şablonları), `config/izinler.json`
(4-eksen). Kaydet → validator (TypeBox) → tek satır hata ya da `--dry-run` diff
→ ONAY ile aktifleşme. Kod derlemesi GEREKMEZ; state machine/policy motoru
dosyadan düzenlenemez (fail-closed).

**İş modları (K-0006 devralma — MASTER-SSOT §9.1):** `config/ordu.json → mod` ile
GÖREV/profil başına seçilir, mesaj başına DEĞİL (sürtünme bilinçli):
`atolye` (varsayılan: dengeli), `firtina` (paralel tavan ×2, hizli-kademe ağırlıklı —
hız için; güvenlik kapıları gevşemez), `ekonomi` (toplam paralel=2, token tavan ×0.5,
kabul suite Paseo'da kalır). Mod yalnız KAPASITE/bütçe tavanlarını ve kademe
tercihini etkiler; A-kapılarını, fence'i, insan-onayını ETKİLEMEZ (Y3/Y6 sabit).

**Kanonik adaptör sözleşmesi (K-0006 — motorun tek bildiği; RUNTIME.md ile uyum):**
`spawn(brief)→handle · gonder(handle,msg) · durum(handle) · iptal(handle)→teyit ·
olaylar(handle)→stream`. Kurallar: (a) SDK tipi motora SIZMAZ — her runtime bu 5
sözcüğe damıtılır; (b) iptal **istek≠teyit** — teyit gelmezse `bilinmiyor` (A08 kör
re-spawn yasağıyla aynı); (c) hata sınıfları normalize: `auth | kota(kuyruk) |
zamanasimi | belirsiz | desteklenmiyor` — dispatcher yalnız bu etiketleri görür;
(d) kullanım ölçülemiyorsa `bilinmiyor` rozeti, ASLA 0 değil (bekçi freni). Karşılık:
`ordu-core/src/dispatcher.ts` `WorkerAdapter` + `paseo-adapter.ts`/`local-runtime.ts`.
**Dürüst not (Y5):** kod bugün yalnız `spawn`+`lookup`(=`durum`) taşır; `iptal` deseni
reconcile'ın DEAD kolunda dolaylı var; `gonder`/`olaylar`/açık `iptal` sözleşmesi S2
API katmanında gelecektir (kapı `ADP` = KISMEN, NOT_RUN kollar kabul defterinde).

## 5. FAZLAR (S0–S4 = Final backlog B00–B12'nin işletme adı; kapılar A-IDs)

| Faz | İçerik | Çıkış kapısı (hepsi kanıtlı GEÇTİ) | Tahmini süre* |
|---|---|---|---|
| S0 Pin+Probe | B00-B01: SDK semver, sandbox/capability probe, TypeBox kapalı şemalar | A01-A04 | 1–3 gün |
| S1 Güvenli Headless Dilim | B02-B05: transaction/outbox/rezervasyon, fence, stop-latch, tek worker+evaluator+insan kapısı UÇTAN UCA | A05-A16, **A35, A36** | 5–10 gün |
| S2 Tek Pano | B06-B07: auth+API+SSE, 3 bölümlük UI, mobil, uzaktan izleme (20-uzaktan) | A17-A21 + M04/M07 (V3-S2.4/2.5) + operatör testi | 3–6 gün |
| S3 Dayanıklılık | B08-B09: 2 izole kapsül paralel, fault-matrix, backup/restore, ortak kapasite | A22-A27 + M16-konak (V3-S3.3) | 5–10 gün |
| S4 Öğrenen Ordu | B10-B12 + 30-ogrenme: ham-read-only adapter, mini benchmark, öneri→canary→regresyon hattı, release kontrolü, zamanlı görevler + oto-kabul şeridi (K-0004) | A28-A34 + Ö-1..Ö-5 + M08–M10/M17/M18 (V3-S4.3/4/5) | 1–2 hafta |

*Tahmin; S1 bitiminde gerçek ölçümle kalibre edilir. Bütçe aşımında önce
kısıtlar gevşetilmez — kapsam daraltılır (GPT kuralı).
LOC bütçesi: Final CODE-BUDGET 5.750–9.300 (test dahil) referans + ADR-012
runtime-local katmanı **+300–550** (tavan 9.850); sapma S1 sonunda raporlanır.
Faz sırası notu (ADR-012): V3-S1.1 canlı kapsül hangi runtime'la koşarsa koşsun
aynı kapılardan geçer; local yol paseo blocked listesine TAKILMAZ (runtime-kapsamı).

## 6. KESİN YAPILMAYACAKLAR

- Y1 İkinci store/core/JSONL ledger (qwen gövdeleri arşivdir).
- Y2 11-sekmeli menü; graf editörü; ajan marketi; okul/mezuniyet sistemi.
- Y3 ONAYSIZ kendi-kendini-değiştirme: profil/prompt/politika kabulü daima insan
  (30-ogrenme); manager denetim kaydını silemez, limiti kendisi yükseltemez.
- Y4 Merge/deploy/prod-credential ilk sürümde yok; ham-LLM ikinci tool-runner değil.
- Y5 Verisi olmayan kontrol yayınlanmaz; ölçümsüz yüzde yok; "bilinmiyor" yazılır.
- Y6 Kanıtsız PASS = bug. Offline fixture PASS, production PASS sayılmaz.

## 7. GÜNLÜK İZLEME SÖZÜ (kullanıcı sözleşmesi)

Sen günde şunları görürsün, hepsi TEK ekranda (20-uzaktan): beş sorunun cevabı
(ne yapılıyor / neden bekliyor / ne doğrulandı / ne kadar sınır kaldı / hangi
karar sende), ▶✉✓ rozetleri, ACİL DURDUR. Gerisini ordu ve kapılar halleder.

## 8. REFERANSLAR ve MAKİNE DEFTERİ (K-0004 denetiminde eklendi)

- **`kabul.csv`** — TEK makine-okunur kabul defteri (B/A/M/V3 kimlikleri, durum,
  kanıt yolu). Faz kapanışı: yalnız csv'deki satırların GEÇTİ + kanıt dosyası.
- Final baseline derinlik referansları (otorite değişmez, v3 yeniden yazmıyor):
  docs/06 runtime-adapters · docs/07 api-events · docs/08 test-strategy ·
  docs/09 benchmark-routing · docs/10 operations-editability (kolay-edit §4'ün
  teknik karşılığı) · docs/11 synthesis · docs/12 manager-provider (zamanlama
  kararının dayanağı, 20 §6).
- Görev brief şablonu: Final `delivery/TASK-TEMPLATE.md`; backlog: `delivery/BACKLOG.md`;
  kapı listesi: `tests/ACCEPTANCE.csv`. v3'te yeni mekanik tanımlanırken önce
  bunlarda karşılık aranır (Y1 disiplini).
