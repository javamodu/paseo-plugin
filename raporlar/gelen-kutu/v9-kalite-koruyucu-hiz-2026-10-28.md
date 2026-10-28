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
