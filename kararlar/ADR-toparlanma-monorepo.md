# ADR — Toparlanma: tek dizin (monorepo) — TASLAK, onay bekler

Durum: TASLAK (kullanıcı onayı bekleniyor) · Tarih: 2026-10-25 · İlgili: K-0034 (PLAN otoritesi), B11/B14/B15 (gelen-kutu ana-ajan-2026-10-25)

## Bağlam

Proje altı evde yaşıyor (sözleşme: paseo-plugin · çekirdek: silinecek-task-graph/ordu-core · plugin: paseo-verimlilik · pano: paseo-pano · doküman-v3: ordu-v3 · referans: kapsul-final). İki ayrı SSOT seti (paseo-plugin VE silinecek-task-graph'ta STATE_BOARD/DERSLER/HEDEF/plan) çift-doğru-kaynak riski üretiyor; ana kod "silinecek" adlı klasörde; bekçi yalnız bir evi görüyor (B14).

## Karar (önerilen)

`D:\Vibecode\ordu\` tek git repo'su; tüm parçalar altında. paseo-plugin repo'su köke taşınır (git history korunur); ordu-core ve plugin kopya+commit ile girer (history'leri eski yerlerde tag+bundle arşivinde kalır — ordu-core zaten tek baseline commit, plugin v0.22 kilitli).

## Hedef yapı

```
D:\Vibecode\ordu\
  ANAYASA.md AGENTS.md STATE_BOARD.md DERSLER.md   ← TEK SSOT seti (birleştirilmiş)
  plans/        → PLAN.md HEDEF.md kabul.csv handoff/ SSOT-INDEX.md
  kararlar/     → K-0001..0035 + ADR'ler (plans/ADR-* buraya taşınır)
  sozlesme/     → rehber v2.1 (tek yetkili; v2.0 arsiv)
  kanit/ raporlar/ scripts/
  core/         → ordu-core (src test database package.json)
  plugin/       → paseo-verimlilik (Paseo kayıt yolu güncellenir)
  pano/         → paseo-pano (mockup + gelecek UI)
  referans/     → kapsul-final + ordu-v3 (salt-okur)
  arsiv/        → eski planlar, ordu-core.zip, bench verileri, tarih damgalı eski SSOT kopyaları
```

## Uygulama fazları (her adım tek commit + doğrulama; geri-alış = eski klasörler taşınana kadar silinmez)

- **F0 (onayınla):** bu ADR onayı + S1-S5 güvenlik sırası + devir töreni + üç repodaki kirli işlerin commit'i (taşıma temiz, ANAHTARSIZ ağaçla yapılır).
- **F1:** `ordu/` klasörü; paseo-plugin içeriği köke `git mv` tarzı taşıma; commit.
- **F2 (sırayla, her biri commit + test):** core/ (npm test yeşil şartı) → plugin/ → pano/ → referans/ → raporlar birleşimi (append-only, çakışmasız) → SSOT tekilleştirme (iki set birleştirilir, eskiler arsiv/ altına tarih damgalı) → SSOT-INDEX doldurulur.
- **F3 (kancalar):** codemap.ps1+saglik.ps1 kök `ordu/` (K-0035 emsali: sözleşme-script değişikliği bu ADR ile onaylanmış olur) · bekçi kapsamı tek ev (B14 kapanır) · claude-glm.cmd → ordu/scripts + anahtar env'e (B11 kapanır) · ~/.codex trust listesine yeni yol · ~/.paseo plugin kayıt yolu + daemon restart (oturum kopar — ayrı onayınla, uygun vakitte) · Paseo workspace'lerin yeniden bağlanması · heartbeat/schedule kayıtlarının yeni yolda tazelenmesi.
- **F4 (açık onayınla):** eski konumlar arşiv adıyla (…-eski-2026-10-25) tutulur ya da silinir; `silinecek-task-graph` adı görevini yapar; ordu-core.zip + .bench-* + .verimlilik → ordu/arsiv/.

## Reddedilen alternatifler

- **Git subtree/filter-repo ile tam history birleştirme:** en temiz ama en zahmetli; ordu-core'un tek commit'i ve plugin'in kilit tag'leri zaten arşivlenebilir değerdedir. İhtiyaç olursa ileride yapılır.
- **Yerinde bırakıp yalnız SSOT tekilleştirme:** dağınıklığın kökü (kodun altı evde olması) çözülmez; B14 kör noktası kalır.
- **Symbolic link çorbası:** Windows'ta junction'lar izin/karışıklık üretir; ölçülebilirlik kaybolur.

## Güvenlik sırası (F0 içi, commit'ten ÖNCE zorunlu — 2026-10-25 dış incelemeden)

Doğrulanmış kanıt (R, bu turda diskten): `.tmp-home/.codex/` 25 girdi — sqlite oturum/state/memories/queue/thread_history DB'leri, `config.toml`, `mcp-oauth-locks/`, `sessions/`; canlı anahtar 3 dosyada: `.claude/settings.json`, `.tmp-home/claude-glm53u-settings.json`, `.tmp-home/kilo.patch` (rg sk- taraması). Bunlar git history'ye ASLA girmemeli.

- **S1.** `claude-glm.cmd` sanitize: token → `%ANTHROPIC_AUTH_TOKEN%` env referansı (değer setx ile env'e; dosya şablon olarak commit edilir).
- **S2.** Kirli küme taraması: `rg -il "sk-|api[_-]?key|auth_token|secret"` → bulgu ya sanitize ya .gitignore; kanıt rapora eklenir.
- **S3.** `.tmp-home/` ve `.claude/` ASLA commit edilmez: `.gitignore`'a girer, `arsiv/tmp-home/` kopyasıyla korunur (taşınır, history'ye girmez). `.tmp-home/.codex` OAuth kilitleri + oturum DB'leri taşınır ama izole kalır.
- **S4.** Anahtar rotate: codefast/GLM anahtarı kullanıcı tarafından yenilenir; **B11'in kapanışı rotate'i içerir** (3 dosyadan çıkması yetmez — geçmişte düz metin dolaştı).
- **S5.** K-0034 dosyası aday statüsüyle `kararlar/`'da açılır (B3 kapanışı).
- **S6.** SSOT yetki haritası (birleştirmede kazanan, dosya bazlı): STATE_BOARD←en güncel damgalı · DERSLER←birleşim · HEDEF←`plans/HEDEF.md` · rehber←`sozlesme/` v2.1. Birleştirici ajan sentez icat edemez; haritaya uymak zorunda.
- **S7.** Kural: `ordu/` repo'su runtime verisi biriktirmez; her hedef workspace kendi `.verimlilik/` düzlemini taşır (motor ≠ muharebe alanı).

**F0 sırası: S1-S5 → devir töreni → dalga dalga commit (temiz ağaç).**

## Bağlam sürekliliği (taşımada kayıp önleme — F1/F3'te zorunlu)

Kayıp riski iki kategoride: (a) yol-anahtarlı bağlamlar (git dışı, kopya taşınmazsa kaybolur), (b) oturum sürekliliği (yeni yol = taze oturum). Önlemler:

1. **Dizin TAŞIMASI, git clone değil:** F1'de repo klasörü diskte olduğu gibi taşınır (rename/robocopy) → `.git` + geçmiş + **untracked dosyalar** (`.claude/`, `.tmp-home/`, working dosyalar) birlikte gider. Clone bunu yapmazdı.
2. **Git history arşivi:** ordu-core ve plugin için taşımadan önce `git bundle create` → `ordu/arsiv/history/` + son durumlar tag'lenir; clone'lanabilir kanıt kalır.
3. **Claude Code hafıza/geçmişi (yol-anahtarlı):** `~/.claude/projects/D--Vibecode-paseo-plugin/` → `D--Vibecode-ordu/` **kopyalanır** (memory/ + MEMORY.md + istenirse transcripts). Yeni yoldaki oturum hafızayı yerinde bulur.
4. **Devir töreni TAŞIMADAN ÖNCE:** F0 kapanışında tam devir (HANDOFF halkası + STATE damga + commit) üretilir; yeni yoldaki ilk ajan ÇEKİRDEK §devir echo'suyla (3 soru, diskten) devralır — echo'nun başarısı taşımanın kendisinin doğrulamasıdır. Sözleşmenin dosya-tabanlı hafıza katmanları (L0-L5) zaten bu senaryo için tasarlandı: sohbet geçmişi kaybolsa bile proje bilgisi diskte.
5. **Paseo bağlamı:** taşımadan önce `list_workspaces` + ajan/schedule/heartbeat envanteri çıkarılır; plugin yolu `~/.paseo/config.json`'da güncellenir; restart sonrası workspace'ler yeni cwd'den yeniden bağlanır, transcripts/ajan kayıtları merkezî depoda kaldığı sürece kaybolmaz — restart sonrası `list_agents` + bir ajanın eski transkriptine erişimle doğrulanır (T: merkezî depolama varsayımı, restartta teyit).
6. **Codex oturumları:** `~/.codex` merkezî; trust listesine yeni yol eklenir (eski trust silinmez); oturum geçmişi yol-anahtarlıysa kayıp kabul edilir — önemli bağlam zaten handoff'ta.
7. **Bench/kanıt verileri:** `.bench-*`, `evidence/`, `benchmark/` çalışma dizinleri `arsiv/`'e kopyalanır (silinmez).
8. **Kabul/plan içi yol atıfları:** SSOT-INDEX yeni haritayı listeler; eski yollara atıf yapan satırlar arsivde tarih damgasıyla korunur, düzeltilmez (append-only).

## Sonuç ölçümleri (kapı)

1. `saglik.ps1` yeni kökte yeşil (0 EKSIK) 2. `npm test` core/ altında 296+ yeşil 3. tek STATE_BOARD/DERSLER/HEDEF (ikinci kopya yok — Test-Path ile) 4. `paseo plugin list` plugin'i yeni yoldan görüyor 5. watchdog yalnız tek evi izliyor ve 24s+ raporlar tek yerde toplanıyor 6. **bağlam sürekliliği:** `D--Vibecode-ordu/memory/` var + MEMORY.md erişilebilir · yeni yoldaki ilk oturum echo 3/3 doğrulamış · `list_agents` eski ajan kayıtlarını görüyor · `git log` ordu/ kökünde paseo-plugin geçmişini kesintisiz gösteriyor · `arsiv/history/*.bundle` clone-test geçmiş.
