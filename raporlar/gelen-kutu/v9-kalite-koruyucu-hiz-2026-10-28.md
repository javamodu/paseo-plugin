# v9 — Kalite-koruyucu hız paketi (2026-10-28)

**Kaynak:** kullanıcı sorusu "kaliteyi düşürmeden nasıl verimlilik artar — hız paketine
ekle" (bu oturum). **Sahiplik:** öneri — hiçbir madde [insan] onayı içermez (EK-2).
v8 (0218cd8 + kapanış 8c93792) KAPALI kaydına dokunulMAZ (append-only) → ekleme bu
yeni sürüm dosyasında; v8 bekleyenleriyle ilişki çapraz referansla (aşağıda).

## İlke: kaliteyi düşürmeden hız nereden gelir

Hız, kapıları gevşeterek değil **hatanın maliyetini erkene çekerek** kazanılır:

1. **Erken yakala.** Hata geç bulundukça tur sayısı büyür (hedefli test → tam kanal
   ~102 sn → kapanış turu 45–60 dk). Tip kapısı (v8-03b) bu zinciri saniyeye indirdi;
   aynı erken-yakalama deseni kapsam seçimine (V9-01) ve commit hatalarına (V9-02) uygulanır.
2. **Mekanik işi otomatikleştir, insanı doğrulayıcı yap.** Yanlış-test-altkümesi,
   yasak-dosya commit'i, ölçümsüz hız iddiası İNSAN-hatası sınıflarıdır; makine kapatır,
   karar insanda kalır (tek elden commit değişmez).
3. **Ölçmeden hız iddiası kapatma.** V8-06'nın NULL kalmasının dersi: önce ölç (V9-03),
   sonra karar.

**Kırmızı çizgi:** v8 yapma-listesi aynen geçerli (test adedi kırma / eşik gevşetme /
doğrulayıcı atlama / sahte yeşil). Hiçbir v9 maddesi mevcut kapıyı gevşetmez — v8'de
dinamik timeout (3a) bu yüzden reddedilmişti.

## Maddeler

### V9-01 — Hedefli test seçici (deterministik kapsam)
`scripts/hedefli-test.mjs` (YENİ): değişen src dosyalarından (`git diff`) test alt
kümesini makine-seçimli üretir — dosya-adı eşleşmesi (`src/x.ts` ↔ `test/x.test.ts`) +
test dosyalarının import taraması; çıktı `node --test` dosya listesi. Değişen dosyanın
testi YOKSA uyarı (kapama boşluğu görünür olur). K-0053 yazar akışının "hedefli test"
adımı tahminden çıkar: yanlış alt küme koşmak sahte-yeşil riskiydi; seçim makinede =
kapak garantili, yazar 3–5 dk seçimde harcanmaz. ~80–150 kaynak + 60–100 test.

### V9-02 — Merge-guard (yasak-desen pre-commit hook)
`scripts/yasak-liste.json` + `scripts/merge-guard.ps1` (YENİ) + `.git/hooks/pre-commit`
kurulum adımı. Staged alanda (`git diff --cached --name-only`) ASLA desen eşleşirse
exit 1 + sebep: `probe-latest.json`, `ordu.sqlite-{shm,wal}`, `core/data/*` üretim
defterleri, `tmp-*`. `kirli-liste.json` deseninin ayna-görüntüsü (benign liste OK
tarafı; bu liste ASLA tarafı). "Paralel yazıcının dosyasına dokunulMADI" kontrolü şu
an her commit'te ELLE yürütülüyor — tek ihlal geri-alınamaz kalıcı hata; hook sınıfı
zaten kanıtlı (post-commit hook temp-repo testi 5 dk, AGENTS/K-0051). ~30–60 PS +
temp-repo kanıtı; kurulum repo-yerel (her klon kurar).

### V9-03 — Spawn maliyeti ölçüm kanalı (V8-06'nın önkoşul ölçümü)
Spawn başına süre/model kaydı kanıt defterine (`gece.jsonl` deseni — `jsonlEkle`
fsync'li). V8-06 (spawn ekonomisi) DEĞERLENDİRİLEMEDİ çünkü ölçümsüz varsayımdı;
N koşum veri biriktikten sonra karara girer. ~20–50 + 20–40 test. Ölç-sonra-karar.

### V9-04 — Ölçüm çifti standardı (hız kalemleri için)
Her hız kalemi kapanışında ÖNCE/SONRA tablosu (kanal sn, duvar süresi, x, tur sayısı)
kanıt raporunda; ölçümsüz "hızlandı" iddiası kapanamaz. **Önkoşul:** CALISTIRMA.md
RBT-2026-10-28.2'nin untracked kirli dosyası → V8-02b ile AYNI önkoşul (RBT kapanışı);
bugün yazılmaz. 0 teknik LOC (~10 satır doküman; kural sayacına girmez — paket dokümanı).

### V9-05 — Ders → regresyon-test çifti
DERSLER.md'e giren tekrarlanabilir hata dersi ilgili dalgada +1 regression test
doğurur (A3 emsali: ders → `a3-kural.test.ts` vakası). "Aynı tuzağa iki kez düşmek
hatadır"nın mekanik karşılığı: her tekrar-hata turu 45–60 dk; maliyet tek seferliğe
çekilir. 0 sabit LOC; ders başına ~20–40 test satırı (sürekli maliyet — dürüst not).

### V9-06 — Tip-borcu 51→0 sıfırlama fişi (v8'den devralma; yalnız FİŞLEME teklifi)
v8 kaydının bekleyen bacağı: 6 src + 45 test-fake; iş başına ≤3 dosya → ~18 mini-dalga;
her düşüşte BILINEN_BORC AYRI commit'te iner (sessiz değil). Kalite-hız bağı: borç 0'da
tip kapısı 0→1 anında kırmızı = REGRESYON YAKALAYICI (bugünkü değer artış-yakalayıcı);
B8 sınıfının gelecekteki tam-suit yakalanması (~102 sn + kapanış turu) saniyeye iner.

## LOC (T) ve süre

| madde | kaynak | test/kanıt |
|---|---:|---:|
| V9-01 seçici | 80–150 | 60–100 |
| V9-02 merge-guard | 30–60 PS | temp-repo kanıtı |
| V9-03 spawn ölçümü | 20–50 | 20–40 |
| V9-04 ölçüm çifti | 0 | ~10 satır doküman |
| V9-05 ders-test çifti | 0 | ders başına 20–40 |
| V9-06 tip-borcu fişi | 0 yeni (51 dosya düzeltmesi dalgalara bölünmüş) | — |
| **toplam** | **~130–260** | **~80–180** |

Graf-dışı altyapı (DC bütçesine girmez); ~2–3 saat. **Çarpan iddiası YOK:** kazanç
birimi = önlenebilen tur (her biri 45–60 dk); sayı V9-04 ölçüm çiftinden çıkar.

## v8 bekleyenleriyle ilişki (tekrar yok)

- V9-03 → V8-06'nın önkoşul ölçümü · V9-06 → v8 tip-borcu bacağının fişleşmesi.
- Seri-faz fişi (f3 sınıfı) ve kapanis-taslak.ps1 (V8-02b) v8'de zaten bekleyen —
  v9 bunları yeniden önermez.

## İşlenme (K-0017)

JSON sidecar'da (v9-kalite-koruyucu-hiz-2026-10-28.json); maddeler `islenme: null` —
işlenen maddeye tarih + commit hash kapanış dalgasında append edilir (K-0052 deseni).

## §V9-02 uygulama kaydı (2026-10-28 — bu dalga; kullanici "devam" emri)

- **Dosyalar (YENİ):** `scripts/yasak-liste.json` (ASLA desenler: probe-latest.json ·
  ordu.sqlite-shm · ordu.sqlite-wal · gece.jsonl · tmp-) + `scripts/merge-guard.ps1`
  (fail-closed: liste yok/okunamadı/boş → KAPI-INFAZ-EDILEMEDI exit 1 — kirli-liste.json
  ayna-görüntüsü deseni). **Dizin-geneli desen bilinçli YOK:** core/data/ altında
  TRACKED meşru defterler var (kural.jsonl, gozetimsiz-kanit.jsonl, local-pid.jsonl,
  replan.jsonl, ordu.sqlite — R: `git ls-files`); blanket desen yanlış-pozitif bloklardı.
  Yalnız ev kurallarının açıkça ASLA dediği dosyalar listelendi.
- **Kurulum:** `.git/hooks/pre-commit` shim (repo-yerel — commit edilmez, her klon
  kurar; kaldırmak tek dosya silme; mevcut post-commit Qoder-tracker'a DOKUNULMADI).
- **KANIT (R, temp repo):** (1) yasaklı staged (probe-latest.json) → YASAK-DOSYA-STAGED
  + exit 1, commit İPTAL; (2) temiz staged → GECTI exit 0, commit oluştu; (3) repo
  geçmişinde 1 commit — bloklu commit iz bırakmadı; (4) wal deseni → exit 1.
  Dürüst not: KANIT-4'ün ilk koşumu bash zincirim bozuktu (dosya hiç doğmadı — GEÇERSİZ);
  düzgün yeniden koşuldu, geçerli kanıt ikinci koşumdur.
- **KANIT (R, gerçek repo):** dry-run staged-0 → GECTI exit 0; dalga commit'leri
  hook'tan GEÇEREK atıldı — bu commit'lerin kendisi PASS-yolu kanıtıdır.
- **Tam süit (merge kapısı, doğrudan koşum — graf işi değil, v8 deseni): 461/461
  fail 0, duration 83.2 sn.** Test koşumu probe-latest.json'i yeniden üretti (zaten
  kirli; COMMIT EDİLMEZ — merge-guard deseni bunu artık mekanikleştirir).
- **Kapsam:** dokunulan mevcut dosya 0 (kural ≤3); YENİ: 2 script + hook (izlenmeyen).
  KANAL koşulmadı (graf-dışı dalga — kanal kaydı A4 turunda duruyor, v8 emsali).
  Kalan v9 maddeleri (V9-01, V9-03..06) BEKLEYEN — bu dalga yalnız V9-02.

## §V9-01 uygulama kaydı (2026-10-28 — ikinci dalga; kullanıcı "devam" emri)

- **Dosyalar:** `scripts/hedefli-test.mjs` YENİ (~110 satır; saf çekirdek `hedefliSec`
  export — test edilebilir + CLI kabuğu) + `scripts/hedefli-test.test.mjs` YENİ
  (9 test: ad-eşleşmesi / import-taraması / çok-testli import [aşırı-seçim güvenli yön]
  / değişen-test doğrudan / kapsamsız-uyarı / ilgisiz-yoksayma / .mjs modülü /
  determinizm / temp-repo entegrasyonu [diff+untracked+fail-closed]) +
  `plans/YAZAR-BRIEF-SABLON-2026-10-28.md` §5-adım-3 ince kanca (seçim deterministik —
  yanlış-altküme koşmak sahte-yeşil riskiydi).
- **Tasarım kararı (testin yakaladığı gerçek boşluk):** ilk sürüm yalnız `git diff`
  okuyordu — entegrasyon testi UNTRACKED dosyanın diff'te GÖRÜNMEDiğini kanıtladı;
  yazarın en sık çıktısı YENİ dosyadır → eksik-seçim (tehlikeli yön) olurdu. Düzeltme:
  `git diff --name-only <taban>` + `git ls-files --others --exclude-standard`
  (ignore sayılır — shm/wal/defterler dışarıda).
- **KANIT (R):** kendi testleri **9/9** (5.0 sn; entegrasyon temp git repo'da);
  gerçek-repo DRY-RUN 1 (taban HEAD): 249 değişen → 0 seçim 0 kapsamsız (core/src işi
  yok — doğru boş); DRY-RUN 2 (taban 62d4fde, A4/v8/v9 öncesi — BİLİNEN-CEVAP):
  **a4-gece.test.ts seçildi** + 11 test daha (cli/daemon/bildirim/f3/f65/paseo —
  dokunulan modüllerle tutarlı) + **kapsamsız uyarısı GERÇEK boşluğu yakaladı:
  core/src/tip-kapisi.mjs'in test dosyası YOK** (v8'de koşum-kanıtıyla geçmişti);
  temsilci koşum (seçilen listeden a4-gece.test.ts): **11/11, 7.4 sn** — seçilen
  liste koşulabilir.
- **Tam süit (merge kapısı): 461/461 fail 0, 54.1 sn** (KANAL koşulmadı — graf-dışı,
  v8 emsali). Kapsam: dokunulan mevcut dosya 1 (kural ≤3: brief şablonu); YENİ 2.

## §V9-03 uygulama kaydı (2026-10-28 — üçüncü dalga; kullanıcı "devam" emri)

- **Dosyalar:** `core/src/spawn-olcum.ts` YENİ (~28 satır: `SPAWN_OLCUM_DEFTERI_YOLU`
  module-göreli [gozetimsiz KANIT_DEFTERI_YOLU deseni] + `SpawnOlcumKayit` tipi +
  `spawnOlcumKaydet` [jsonlEkle — gece.jsonl fsync deseni]) + `core/src/dispatcher.ts`
  ince kanca (~17 satır: opts'a opt-in `kanitDefteriYolu` [daemon A0-3 deseni — verilmedikçe
  kayıt YOK, mevcut çağıranlar etkilenmez]; `performance.now` ile adapter.spawn duvar süresi;
  kayıt hatası best-effort stderr — **ölçüm boru hattını düşüremez**) + `core/src/cli.ts`
  kablolama (tick opts'una `SPAWN_OLCUM_DEFTERI_YOLU` — üretim verisi akmaya başlar) +
  `core/test/spawn-olcum.test.ts` YENİ (5 test: kayıt formatı / entegrasyon opt-in
  [provider-model nodes satırından çözülür] / opt-out dosya-dogrulmaz / ölçüm hatası boruyu
  düşürmez / UNKNOWN da kayda girer) + `core/package.json` süit listesine kayıt (461→466) +
  `scripts/yasak-liste.json`'a `spawn-olcum.jsonl` ASLA deseni (yeni üretim defteri).
  Dokunulan mevcut dosya 3 (kural ≤3: dispatcher, cli, package.json).
- **KANIT (R):** 5/5 kendi testi; hedefli üçlü (spawn-olcum+dispatcher+cli) 18/18;
  **tip kapısı GEÇTİ** (borç 51 aynı, yeni 0 — ilk koşum +1 [testin JSON.parse map
  geriçağrısı] TS kapı KOŞUMDAN ÖNCE yakaladı ve düzeltildi); **KANAL** `test-kanal.ps1
  -Etiket v9-03`: 1. koşum x=1 (m16-canlı "yazıcı işareti 15sn içinde gelmedi" — 204 sn
  toplam yük; bilinen yük-flake sınıfı, ev kuralı 2. koşum) → **2. koşum x=0, 97 sn,
  466/466**; `core/data/spawn-olcum.jsonl` kanal koşumlarında 12 GERÇEK kayıt üretti
  (OK 0-12 ms + FATAL — canlı testlerin fake/local adapter yolu; üretimde gerçek adapter
  süresi birikir) — V8-06 artık ölçümlü zemine oturur.
- **Dürüst notlar:** kanıt logu UTF-16'dır (Tee-Object deseni); ölçülen süre adapter
  çağrısının duvar süresi (LLM tur süresi DEĞİL — V8-06 spawn-ekonomisi sorusu tam bu
  çağrının maliyetiydi).

## §V9-06 uygulama kaydı (2026-10-28 — tip-borcu 51→0 SIFIRLAMA; kullanici "06:00'a kadar otonom tamamla" emri = uygulama emri; 9 dalga)

- **Yol (her düşüş AYRI ratchet commit'iyle, sessiz değil):** 51 → 48 `1ffefdd` → 46 `250cb51` →
  44 `73dda2d` → 36 `aff770c` → 25 `aa274a9` → 17 `03614e7` → 14 `9ccc7ff` → 9 `ccd6fae` →
  0 `ec96f29` + **KİLİT** `39f46e4` (BILINEN_BORC=0 — andan itibaren +1 yeni tip hatası anında
  YENI-TIP-HATASI exit 1: kapı artış-yakalayıcıdan **REGRESYON-YAKALAYICIYA** döndü; v8-3b'nin
  açılış notundaki taahhüt yerine geldi). tsc exit kodu 2→0 ilk kez.
- **Kök-cause kümesi 1 (~28 hata): B8 aynası** — LocalLauncher'a giren `dispatchKeyOf` 11
  sahte launcher'da yoktu (capacity/f3-live/f5/k13/live-gates-v3/v4/f9/e2e-s11/f3-crash sınıfları
  + f1-gates/f65-rol-model obje literalleri). Stub bilinci: sahte attempt İZLEMEZ → undefined →
  adapter cancel 'UNKNOWN' (fail-closed; gerçek impl git-worktree-launcher'da v9-06/c).
- **Kök-cause kümesi 2:** ajv-formats nodenext tip tuzağı (validate/handoff/handoff.test —
  çağrı noktasında lokal tip; DERSLER 2026-10-28 tur kaydı) · strict:false truthiness-daraltmama
  (dispatcher `=== true`, minimal repro kanıtlı) · writeSync overload imzası (kural/replan) ·
  sqlite variyad (a0-2-sweep) · ProbeReceipt doğru evi (a0-5-lrt) · executor imzası gerçeği
  yansıtmıyordu (benchmark-canli) · f4-pano fetch unknown (tek gevşek kayıt).
- **GERÇEK boşluklar (tip-borcu kozmetik değil — 2 kanıt):** (1) git-worktree-launcher'da
  dispatchKeyOf FİİLEN eksikti → restart-sonrası cancel kör (B8) — uygulandı + regresyon testi
  (git-worktree.test.ts 6/6); (2) evaluator-canli `r2.exitCode ?? 1` SAHTE-YEŞİL'di (dönüş tipinde
  olmayan alan → `?? 1` her koşumda geçer) — iddia dürüstçe kaldırıldı, semantik verdict FAIL
  iddiasında taşıyor.
- **KANIT (R):** her dalga tsc sayımı + hedefli testler (32/32 · 33/33 · 6/6 · 5/5+2/2 · 7/7 ·
  9/9 · 27/27 · 28/28 · 18/18); **tam KANAL -Etiket v9-06: 467/467 x=0 sureSn=125**
  (h=39f46e4; 466→467: yeni B8 testi) + tip kapısı 0/0 GECTI; DERSLER.md +1 tur (4 ders).
  Dalga-A ders kaydı: MANAGER_KAYNAGI şablon tuzak testler commit'ten ÖNCE yakaladı.

## §V9-05 uygulama kaydı (2026-10-28 — ders→test çifti; politika olarak uygulandı)

Bu turda çift İKİ emsale doğdu (politika kalıcı hale geldi): (1) MANAGER_KAYNAGI şablon-tuzağı
dersi → hedefli koşumda kalan f3-crash testleri (kırıldı→düzeltüldü→yeşil — regression gerçek);
(2) sahte-yeşil dersi (evaluator exitCode) → tip kapısı 0-ratchet (mekanik yakalayıcı: bu sınıf
artık süitten ÖNCE kırmızı). Kalıcı kural formülasyonu: **DERSLER.md'e giren tekrarlanabilir
hata dersi ilgili dalgada +1 regression testi veya mekanik kapı doğurur** — bu turun 2 örneği
yukarıda; gelecek dersler için brief şablonu §5 zaten hedefli-test + tip kapısı adımlarını
içeriyor. 0 sabit LOC (v9 tahminiyle birebir).

## v9 kapanış durumu (2026-10-28 son)

İşlendi: V9-01 · V9-02 · V9-03 · V9-05 · V9-06 (5/6). BEKLEYEN: **V9-04** (ölçüm çifti
standardı — CALISTIRMA.md RBT-2026-10-28.2'nin untracked kirli dosyası; V8-02b ile AYNI önkoşul,
RBT kapanışı bekler; bugün yazılmaz). Graf-dışı verimlilik paketinin DC bütçesine etkisi yok.
