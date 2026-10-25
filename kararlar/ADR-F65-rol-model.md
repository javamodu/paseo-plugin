# ADR-F6.5 — Rol->model secimi: baglama `nodes.provider`/`nodes.model` kolonlarinda; NULL = "manager'a birak" (deterministik cozum zinciri) (TASLAK — onay bekler)

## Baglam
PLAN.md v2.9 F6.5 satiri rol basina model secimini ister ve yontem isaretini verir: "nodes.provider kolonu (ADR'li migration, varsayilan ORDU_PROVIDER)". Guncel durum (ordu-core kaynak kaniti):

- `nodes` tablosu (database/001-initial.sql): `run_id, id, role, dependencies_json, state` — provider/model alani YOK.
- Provider bugun TEK global noktadan gelir: `paseoSpawnArgs` (src/paseo-transport.ts:83) `process.env.ORDU_PROVIDER ?? 'codex/kimi-K3'` okur; tum spawn'lar ayni provider'a duser. Rol ayirmak mumkun degil.
- PLAN SS4 sabitesi: rol != model != runtime — uc kavram ayri eksende yasar. Runtime secimi deployment-config duzeyinde (hangi WorkerAdapter ile dispatcher kurulur); bu ADR'in konusu degildir.
- PLAN SS2 uc katmanli otorite: insan plan.md -> derleyici (deterministik checker) -> manifest -> defter. PLAN SS4: manager LLM "atama ONERIR", derleyici derler; dispatch yolu deterministik koddur (supervisor.ts basligi: "LLM degil").
- Migration kalibi hazir: `openStore` (src/store.ts) `PRAGMA user_version` ile kademeli, idempotent SQL dosyalari uygular; 001 kopyasi byte-degismez (hash-senkron testi, test/sync-baseline.test.ts).

Soru: rol->model baglamasi nerede yasar, dispatch'e nasil akar, "manager'a birak" ne demektir?

## Karar

1. **Baglama yeri = defterdeki node satiri: `nodes.provider` + `nodes.model` (NULL olabilir).** Node zaten rolun defterdeki evidir; plan topolojisinin parcasidir. Degerler `PlanNode`'a eklenir ve `planHashOf`'a dahil edilir — boylece model secimi manifest degismezligine (SS2) otomatik baglanir: model degisikligi = yeni plan hash = yeni manifest surumu; eski izin ve kanit yeni surume TASINMAZ. Receipt'e ayri alan EKLENMEZ (14 alan sabit, PLAN SS7); provider/model candidateHash->plan uzerinden dolayli baglanir.

2. **NULL semantigi = "manager'a birak"; cozum IKI kapi, ikincisi tamamen deterministik:**
   - **Birincil kapi (derleme):** kullanici plan satirinda model belirtmezse manager LLM atama onerir (PLAN SS4 yetkisi); derleyici oneriyi manifest'e yazar; deterministik checker kapali provider kayit kumesine (registry) karsi dogrular — bilinmeyen provider RED (fail-closed). Bu kapidan gecen node SOMUT degerle dogar.
   - **Yedek kapi (dispatch):** node hala NULL ise (or. `cli capsule` gibi derleyicisiz yol) dispatch yolunda LLM CAGRISI YOKTUR (Y1 sabitesi). Cozum zinciri saf fonksiyondur: `node.provider/model` -> `ORDU_PROVIDER` env (parse: `vendor/model`) -> kod-varsayilani `'codex/kimi-K3'` (bugunku davranis). Env registry disindaysa FATAL — sessiz dusus yok. Sonuc deterministik olarak node kolonu + env'den turetilebilir; ayri defter kaydi/olay tipi GEREKMEZ (Command.kind/Event.type kumeleri degismez).

3. **Registry = kod seviyesinde kapali kume (yeni ince modul `src/providers.ts`).** Bicim: `provider` = vendor adi (or. `codex`), `model` = o provider'in model kimligi (or. `kimi-K3`); Paseo CLI'nin `--provider codex/kimi-K3` bicimi spawn aninda `provider + '/' + model` birlesimiyle uretilir (model NULL ise provider tek basina = provider'in kendi varsayilani). Dogrulama `createRunPlan`'da GateError ile (mevcut desen: node.state kapali kumesi de schema CHECK'siz, supervisor sabitleriyle yonetilir). Kural: `model` dolu + `provider` NULL = RED (model tek basina anlamsiz).

4. **Dispatch akisi (dosya dosya):**
   - `supervisor.ts`: `PlanNode { id, role, deps, provider?, model? }`; `createRunPlan` INSERT'i iki kolonu yazar + registry dogrular.
   - `planHashOf`: provider/model yalniz TANIMLIYSA kanonik hash'e girer — providersuz planlar bugunku hash'lerle birebir ayni kalir (F0 byte-esitlik kapisi bozulmaz).
   - `dispatcher.ts processOutbox`: attempt satirindan `(run_id, node_id)` ile nodes'a join; cozum zinciri uygulanir; `adapter.spawn({ ..., provider, model })`. nodes satiri yoksa FATAL (FK garantisi altinda beklenmez ama fail-closed).
   - `WorkerAdapter.spawn` imzasi: `provider?: string; model?: string` eklenir (opsiyonel alan = mevcut implementasyonlar kirilmaz).
   - `paseo-adapter.ts`: yalniz passthrough; B02 capability / ORDU_LIVE / F5.5 cwd kapilari AYNEN kalir, yeni kapi YOK.
   - `paseo-transport.ts paseoSpawnArgs`: parametreden gelen somut degeri kullanir; env okuma cozum zincirine (dispatcher tarafina) tasinir — transport'a her zaman cozulmus deger iner, cift-varsayilan kaynagi kalmaz.
   - `local-runtime.ts`: `LocalLauncher.launch({ ..., provider, model })`; provider->CLI binary eslemesi launcher'in isi. SINIR BEYANI: mevcut `providerCliPresent` capability'si tek-bittir; provider-basina kanit genisletmesi AYRI is — F6.5 canli kanidi paseo yoluyla yapilir, local runtime ilk surumde yalniz cozulmus varsayilan provider'i destekler.

5. **Secim yuzeyi (ince):** `ordu capsule` komutuna `--provider P [--model M]` flag'leri; plan.md satir formatina opsiyonel model alani (K-0033 derleyici kapsamina kucuk bir satir-formati genisletmesi — ayri atomik is olarak planlanir). Panoda salt-okunur gosterge sonraki faz.

6. **Geriye uyumluluk:** migration sonrasi mevcut tum node satirlari NULL -> eski davranis (env -> varsayilan) birebir korunur. 001/002 dosyalarina DOKUNULMAZ (hash-senkron). Mevcut sorgular sabit kolon listesi kullanir (`nodeDeps`, `nodeState`, cli `tick` join'i); yeni kolonlar bunlari bozmaz.

## Reddedilen alternatifler
- **Manifest-only (emirler.json'da yasar, spawn'da payload ile tasinir):** rol zaten nodes'ta; modeli baska katmanda tutmak dispatch join'ini ikiye boler ve planHash disinda kalma riski yaratir (sessiz model degisimi = kanit zinciri kirilir). Defter kolonu hem tek-ev hem hash'e bagli.
- **Grant/approval seviyesi:** grant'ler vekil kararlari icin (PLAN SS9.2); statik plan topolojisinin baglamasi degil. Yanlis granulerlik + her dispatch'te onay surturmesi.
- **Yeni Event.type ile cozum kaydi (MODEL_RESOLVED):** cozum deterministik ve turetilebilir oldugundan cift-dogru-kaynak riski; gorev siniri da Event.type kumesine dokunmayi yasakliyor. (Istenirse SESSION_BOUND payload dalina alan eklemek B01 sema genisletmesi olarak AYRI ADR konusu.)
- **Run-seviyesi tek provider (runs.provider):** rol basina ayrimi ifade edemez; F6.5'in varolus sebebini karsilamaz.
- **Registry yerine serbest metin:** manager halusinasyonu dogrudan spawn arg'ina akar; kapali kume + checker fail-closed sart (K-0033 supap mantigi).

## Sematik taslak
`database/003-role-model.sql` (yalniz eklemeli):
```sql
-- 003-role-model (F6.5) — nodes'a rol->model baglamasi; NULL = manager'a birak.
ALTER TABLE nodes ADD COLUMN provider TEXT;
ALTER TABLE nodes ADD COLUMN model TEXT;
```
`src/store.ts openStore`:
```ts
if (version < 3) db.exec(readFileSync(join(dbDir, '003-role-model.sql'), 'utf8'));
db.exec('PRAGMA user_version=3;');
```
Idempotens: ALTER tek basina idempotent degildir; `user_version < 3` kapisi ikinci acilista atlatir (001/002 deseniyle ayni). CHECK kisiti YOK — kapali kume dogrulamasi kod katmaninda (providers.ts + createRunPlan), mevcut node-state deseniyle uyumlu.

## Test plani
Hermetik (npm test, mevcut desenler: sahte transport/execFile enjeksiyonu):
1. Migration: temiz DB'de user_version=3; 001+002'li fixture DB acilinca 003 uygulanir, ikinci acilis no-op; 001/002 byte-hash senkron testi yesil kalir.
2. `createRunPlan`: provider+model ile INSERT; bilinmeyen provider RED (GateError); model-dolu+provider-NULL RED; NULL/NULL kabul.
3. `planHashOf`: ayni topoloji + farkli model = farkli hash; providersuz plan bugunku hash algoritmasiyla birebir ayni (geriye uyum).
4. Cozum zinciri (saf fonksiyon): node degeri > env > varsayilan; registry-disi env = FATAL.
5. `paseoSpawnArgs`: `--provider codex/kimi-K3` birlesimi; model-NULL'da provider tek basina.
6. Uctan uca hermetik: 2 node'lu plan (farkli provider) + sahte transport -> spawn arg'lari dispatchKey basina dogru provider'i tasir; NULL node varsayilana duser.
7. `LocalRuntimeAdapter` spy: launcher'a provider/model iletildi.

Canli kabul (kabul.csv satir onerisi):
```
F65-01,F6.5,rol->model secimi: nodes.provider/model migration + cozum zinciri + spawn arg akisi,NOT_RUN,"hermetik suite exit-0 (252+ yeni testler); canli: tek run'da 2 node farkli provider ile spawn (paseo list_agents provider alanindan dogrulanir) + NULL node ORDU_PROVIDER fallback kaniti"
```

## LOC tahmini (T)
- Uretim: **~130-190** — 003 SQL ~5 · store.ts ~3 · providers.ts (yeni) ~25-35 · supervisor.ts ~30-40 · dispatcher.ts ~25-35 · paseo-adapter.ts ~5 · paseo-transport.ts ~15-20 · local-runtime.ts ~10-15 · cli.ts ~10-15.
- Test: **~160-260** (7 hermetik grup + migration fixture).
- Not: PLAN F6.5 satirindaki ~150-300 (T) bu dilime EK olarak 3 cikti modu + temel rubric'i de icerir; bu ADR yalniz rol->model baglama dilimidir.

## Sonuc / riskler
- Model secimi manifest degismezligine baglanir: sessiz model degisimi yapilandirmasal olarak imkansiz (yeni plan hash = yeni manifest = eski kanit tasinmaz, SS2).
- Risk: FALLBACK_MODEL vekil karari (PLAN SS9.2) node kolonunu DEGISTIREMEZ (plan immutability); attempt-bazli override istenirse cozum zincirine "onayli override" halkasi ekleyen AYRI ADR gerekir.
- Risk: registry bakimi kod degisikligi ister (bilincli kapali-kume tercihi); sik provider degisen ortamlarda surtunme — olculup gerekirse policy-hash'e bagli config'e tasinir (ayri karar).
- Local runtime provider-basina capability kaniti bu ADR kapsami disinda; canli F6.5 kanidi paseo yolundan uretilir.

## Baglantilar
PLAN.md v2.9 SS2 (uc katman), SS4 (rol!=model!=runtime), SS6 (adaptor sozlesmesi), faz tablosu F6.5 satiri, SS9.2 (FALLBACK_MODEL) · K-0033 (derleyici+checker supabi) · ordu-core: src/store.ts (migration kalibi), src/supervisor.ts (createRunPlan/dispatchNode), src/dispatcher.ts (processOutbox), src/paseo-transport.ts:83 (ORDU_PROVIDER), src/local-runtime.ts (LocalLauncher), ADR-012 (local runtime kapilari).
