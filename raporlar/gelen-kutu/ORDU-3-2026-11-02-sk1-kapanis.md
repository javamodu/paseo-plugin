# ORDU-3 — SK-1 KAPANIŞ DENETİMİ (salt-okur) — 2026-11-02

**Ajan:** ORDU-3 · **Koordinatör:** KURMAY-1 · **Plan:** plans/SORUN-KAPATMA-3AJAN-PLANI-2026-11-01.md §ORDU-3
**Damga:** 2026-11-02 00:59 (yerel; Get-Date ile ölçüldü)
**Yöntem:** her iddia kendi koşumum/okumamla ölçüldü (node --test, PowerShell 5.1 canlı, izole tmp git repo, git status, dosya okuma). Kod/doküman DEĞİŞTİRİLMEDİ — yalnız bu 2 rapor dosyası + tmp test dosyaları (koşu sonunda silindi; `Test-Path` false kanıtı her iki tmp dizin için). Ölçülmeyen hiçbir sayı yazılmadı; uydurma yok.

## Sonuç özeti

**11 madde: 8 doğrulama GEÇTİ + 3 bulgu (1 ORTA · 1 DÜŞÜK · 1 BİLGİ).** İki yazıcının kritik iddiaları büyük ölçüde diske karşı doğrulandı; ORDU-1'in RED-1 deseninde bir kapsam eksiği bulundu (F1) — kapı çalışıyor ama here-string taramasının çift tırnaklı yüzünü görmüyor.

## Doğrulanan iddialar (kendi koşumum)

1. **Test koşumları (hepsi EXIT=0, kendi koşumum):**
   - `node --test scripts/ps51-kapisi.test.mjs` → **17/17** (tests 17, pass 17, fail 0) ✓ iddia 17
   - `node --test pano/nobet.test.mjs pano/devir-olcum.test.mjs` → **35/35** (27 nobet n1-n27 + 8 devir-olcum o1-o8) ✓ iddia 35
   - `node --test pano/*.test.mjs` (glob) → **240/240** — regresyon 0 ✓
   - `core/ npm test` → **467/467** ✓
2. **Kapsam:** `git status --porcelain` toplam **150** kirli kayıt. Yazıcı listesindeki 10 dosyanın TAMAMI diskte ve beklenen durumda — M: `AGENTS.md`, `pano/nobet.mjs`, `pano/nobet.test.mjs`, `scripts/merge-guard.ps1` · ??: `scripts/ps51-kapisi.ps1`, `scripts/ps51-kapisi.test.mjs`, `pano/devir-olcum.mjs`, `pano/devir-olcum.test.mjs`, `kararlar/K-0058.md`, `core/data/devir-olcum.jsonl`. Kalan 140 kayıt için ayrıştırma: 138 önceden-kirli iddiası + 2 kayıtlık fark **ayrıştırılamadı** (görev-başı snapshot'ım zaten yazıcı sonrası durumda — yazıcı öncesi baseline'ım yok; yazıcılara atfedilemeyecek yeni değişiklik KANITLANAMADI, kanıtlanamayan şey bulgu olamaz).
3. **Kapı canlı sınaması** (%TEMP tmp dizin, koşu sonunda silindi): 3-RED'li kötü örnek → **exit 1** · temiz örnek (kolon-0 kapanış, `2>$null`, `-F`, `@(Get-Content).Count`) → **exit 0** · yalnız-uyarı örneği → **exit 2** ✓. (Kötü örneğin RED-1 yüzü yakalanmadı → F1.)
4. **merge-guard v10** (izole tmp git repo, staged senaryolar): kötü .ps1 staged → kapı RED → **merge-guard exit 1** («commit iptal edildi») · temiz .ps1 → **GECTI exit 0** · uyarılı .ps1 → **merge-guard exit 0** (uyarı sınıfı RED'e dönüşmez ✓). Kanca **ayrı süreçte** (`powershell.exe -File`), `$LASTEXITCODE` ayrı okunuyor; kanca KOD satırı **8 ≤ 10** ✓; v9 yasak-liste bölümü diff'te değişmemiş (yalnız başlık + kanca + son satır) ✓.
5. **K-0058:** başlıkta TASLAK etiketi + **[insan] ONAYI AÇIK, YÜRÜRLÜKTE DEĞİL** ✓. Onay ÜRETEN cümle YOK — kayıt yalnızca «onayı gelirse ...» bekliyor (EK-2 ihlali yok) ✓. Format K-0057 desenine uyumlu (Bağlam · Karar · Reddedilen alternatifler · Sonuç) ✓.
6. **Seed kaynağı:** `core/data/devir-olcum.jsonl` 1 satır; `kaynak: raporlar/otodev-pilot-0-2026-11-01/OZET.md` — dosya diskte VAR. Ölçüm çapraz doğrulandı: rapor satır 11 «devir 4dk08sn (kira-al 17:37:59 → birak 17:42:07)» → 17:37:59.172→17:42:07.064 = **247.892sn ≈ 248** ✓; echo 3/3 ✓; `zincir: HANDOFF-2026-11-01-1658.md` raporla birebir ✓; `damgaISO 14:42:07.064Z` (UTC) = kira-birak anı ✓. Seed uydurma değil — üç kaynak çaprazı (rapor + kira zamanları + dosya).
7. **devir-olcum.mjs tasarımı:** append-only + fsync (spawn-olcum deseni); idempotent kayıt (aynı `handoffDosya` çoğaltmaz); bozuk/şema-dışı satır atlanır + SAYILIR; boş defter dürüst `n:0 + medyanSn:null` (ölçüsüz ≠ sıfır); `--kaynak` zorunlu. 8 vaka o1-o8 hermetik: `mkdtempSync` + `ORDU_DEVIR_OLCUM_DEFTERI` env bağlaması ✓.
8. **AGENTS.md:** 3 yeni tuzak metin olarak mevcut — satır 14'te «git push'a 2>&1 EKLENMEZ» · «commit -m cift tirnakli mesaj PS 5.1 argumani boler — %TEMP% dosya + git commit -F» · «Measure-Object -Line bos satirlari saymaz — @(Get-Content ...).Count» ✓.

## Bulgular

### F1 — ORTA: ps51-kapisi RED-1 deseni çift tırnaklı here-string kapanışını TARMIYOR

`scripts/ps51-kapisi.ps1:58` regex `^[ \t]+'@` yalnız TEK tırnaklı terminatörü yakalar; PS 5.1'de here-string İKİ tiptedir ve **her ikisinin de girintili kapanışı aynı parser hatasıdır**:

- **Kanıt (canlı, PS 5.1):** girintili `  "@` → `WhitespaceBeforeHereStringFooter`, exit 1 · girintili `  '@` → aynı hata, exit 1. Parser sınıfı ikisini de kapsıyor.
- **Kanıt (kapı):** 3-RED'li kötü örneğimde satır 3 `  "@` affedildi — çıktı «2 kirmizi desen» (RED-2 + RED-3), RED-1 yalnız satır 4-5'ten geldi.
- **Kanıt (test örtüsü):** `scripts/ps51-kapisi.test.mjs:54` RED-1 fixture'ı yalnız `'@` sınar → 17/17 geçer ama kör nokta testle örtülü (benim canlı koşumun yakaladığı sınıf).
- **Etki:** kapı yanlış-fren yapmıyor (RED'lenenler gerçek hata sınıfı); KAPSAM yarım — kronik #1'in mekanik freni çift tırnak yüzünde sessiz. merge-guard entegrasyon koşumunda da aynı kör nokta doğrulandı.
- **Öneri (yazıcı ORDU-1, koordinatör kararı):** regex'i iki terminatöre genişlet — `^[ \t]+(['"])@` — ve test vakasına çift tırnaklı RED-1 örneği ekle. Kaynak tuzak metni (AGENTS.md satır 14, DERSLER satır 3) da tek tırnak örneğinden konuşuyor; metin eşliğinde netleştirme değerlendirilebilir.

### F2 — DÜŞÜK: AGENTS.md satır sayısı iddia/ölçüm uyumsuz

Brief iddiası «satır sayısı 16 sabit»; ölçümüm **15** (`wc -l` 15, `awk END{NR}` 15 — iki yöntem aynı). 3 tuzak içeriği doğru (madde 8); yalnız sayı iddiası uyuşmuyor. İddia sahibinin ölçüm kaynağını netleştirmesi yeterli; davranışsal etkisi yok.

### F3 — BİLGİ: ORDU-4 sapması — bozuk damga `devirSinifi === 'nobet'` KOŞULLU (plan metni koşulsuz)

**Durum tespiti (ölçümlü):** `pano/nobet.mjs` diff: `kd.taze && kd.devirSinifi === 'nobet' && pidCanli === false ? 'bozuk'` — yani bozuk damga yalnız NOBET sınıfı kira + TAZE + kanıtlı ölü pid'de. **n2 pini kanıtı:** `kiraFixture({ damgaISO: simdi() })` = TAZE + varsayılan OLU_PID + `sinif: operator` → beklenen `j.kira === 'taze'`, exit 0 — operator sınıfında taze+ölü kira bozuk damga ALMIYOR (35/35 koşumda n2 geçti → sınıf kısıtı mevcut pinleri bozmuyor ✓).

**Planla uyum/çelişki:** plan §ORDU-4 «sahibi ölmüş kira `bozuk` damgası taşır» — sınıf ayrımı YOK; ORDU-4 daraltmış. Gerekçe (kod yorumu): operator kirası insan-attended (n2/n3 pinleri korunmalı), nöbet kirası gözetimsiz. İkincil ayrım: plan «devralan fail-closed devredebilir» diyor; ORDU-4 taze+ölüde `kira-sahip-olu-RED` (exit 1) tutuyor — TAZE kira asla devrilmez (A1 çekirdeği), devir yolu bayat-ölü'de açık (n12/n26 kanıtlı: exit 2, ttl-asimi ile kiraAl alır).

**Değerlendirme (karar koordinatörün):** sapma plan metninden DARALTICI ve fail-closed yönlü; teknik gerekçe sağlam (gözetimsiz kirayı önceliklendirme + A1 dokunulmazlığı); mevcut pinler korunmuş. Önerim: (a) kabul + plan/K kaydıyla sınıf kuralını resmileştirme (operator kirasında sahibi ölüyken sessiz 'taze' çıkışı insan-attended varsayımına dayanıyor — bu varsayım K'ya yazılırsa zayıflığı görünür olur) ya da (b) koşulsuz genişletme (n2 pininin değişmesi pahasına). (a) tarafını işaretliyorum.

## Sonuç

ORDU-1: iddialarının 4'ünden 4'ü ölçüldü (kapı var + 17/17 + kanca entegre + tuzaklar ekli); **F1 dışında TEMİZ**. ORDU-4: iddialarının tamamı doğrulandı (35/35 + koşullu damga + defter + K-0058 + seed üç-kaynak çaprazı); **F3 sapması karar bekler, hata değil**. Kapanış koordinatörün kanıt kapısında F1'in işlenmesi (ya da bilinçli ertelenmesi) kaydı önerilir.

## İşlenme (koordinatör KURMAY-1 — SK-1 kapanışı, 2026-11-02 01:11)

- **F1 ISLENDİ:** `ps51-kapisi.ps1` regex `^[ \t]+['"]@` (karakter sınıfı doğrudan `@`'ye bağlı — grup gereksiz) + `red1c.ps1` çift-tırnak RED vakası + temiz fixture'a kolon-0 `"@` bloğu + AGENTS.md satır 14 `'@ ve "@` netleştirmesi. Koordinatör koşumu: ps51-kapisi **18/18** + pano+scripts glob **278/278 fail 0** + canlı red1c.ps1:3 RED + öz-tarama temiz. Dürüst not: koordinatörün ilk düzeltme denemesi geçersiz regex'ti (kapanmamış `(` grubu — `[regex]::IsMatch` ArgumentException, 14 test düştü) → dış-sinyalle kapatıldı.
- **F2 İŞLENDİ:** ölçüm 15 doğru kabul (koordinatör teyit etti); iddia rapor sayısıydı — dosya değişikliği gerekmez.
- **F3 İŞLENDİ (KARAR):** sapma KABUL — yol (a) seçildi; karar kaydı **kararlar/K-0059.md** ile resmileştirildi.
- Commit: SK-1 kapanış commit'i (hash bu kaydın işlendiği commit'tir; K7 push takibinde rapora eklenebilir).
