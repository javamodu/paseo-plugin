# STATE_BOARD — ordu (eski adıyla paseo-plugin; F1'de köke taşındı)

## Aktif iş
**F2 SÜRÜYOR (2026-10-25 16:42, kullanıcı "F2 ONAYLI")** — ordu/ monorepo birleşimi, tek-yazıcı bu kökte: F2-0..3 kilitli (bkz. damga) · kalan 4 adım: F2-4 plugin/ (S2 → 4 test → commit) · F2-5 raporlar birleşimi (**W42/W43 AD ÇAKIŞMASI** — ordu canlısına dokunma; silinecek kopyası arşive) · F2-6 SSOT tekilleştirme (S6 haritası; MASTER-SSOT-PLAN.md'de nvapi anahtarı — B16, ordu'ya sanitize'siz girmez) · F2-7 SSOT-INDEX + codemap + saglik 0 EKSIK · **devir: plans/handoff/HANDOFF-2026-10-25-1640.md** (echo bekleniyor) · eski kök gözlem modunda, silme F4'te açık onayla; bekçi eski yola yazar (B14, F3'te kapanır)

## Son damgalar (tam: son 3)
- 2026-10-25 · **F2 4/8 ADIM KİLİTLİ** (kullanıcı "F2 ONAYLI"; ADR-toparlanma-monorepo): F2-0 history arşivi 84e3639 (2 bundle, clone-test R) · F2-1 referans/ f0996b3 (82 dosya; S2=yanlış-pozitif) · F2-2 core/ c41c75e + sync-baseline referans/ yolu + npm test 296/296 EXIT=0 (R) · F2-3 pano/ ffa40c3 (mockup, ADR gereği test yok) · vardiya devri: HANDOFF-2026-10-25-1640 (kalan adım + B16 nvapi/B17 pano-token uyarıları orada)
- 2026-10-25 · **F1 TAŞIMA TAMAMLANDI** (kullanıcı koştu, ana-ajan diskten doğruladı): robocopy paseo-plugin→ordu /E (.git+untracked dahil) · `git -C ordu log` kesintisiz: 08dc97b devir → 0de7cdf K-0038 → f92cab3 · hafıza klasörü D--Vibecode-ordu 1:1 (memory/ boş — kayıp yok) · devir HANDOFF-2026-10-25-1542 taşımadan ÖNCE atıldı · F1 ölçüm kapıları: git-kesintisiz ✓ · memory ✓ · echo 3/3 yeni-yol oturumunda ba3a7c8 ✓ · eski konum donduruldu, silme F4
- 2026-10-25 · F0 TAMAMEN KAPALI: kapanış zinciri ce50c92 → d1d128d (STATE 26 satır) → b4f7201 (DERSLER izin-asimetrisi) → 57235fa (K-0037 CODEMAP kapsamı, F1/F3 uygulama) → f633614 (S4 kriteri) → f92cab3 (arsiv 113/188/0 FAILED) → 0de7cdf (K-0038 S4 rotate İPTAL — kullanıcı "yeni anahtara gerek yok"; sızma anı prosedürü kararda)
- 2026-10-25 (özet) · F0 İCRA: 5 commit dalgası (bc174d6→ea601cb) + K-0034 ONAY (6f6a844) + HANDOFF-1350 + S2 temiz + 3 repo commit — ayrıntı handoff zinciri
- 2026-10-25 (özet) · 2. tur teknik özet (R): ~19.5k LOC · kabul.csv kapanış ~%35-40 (T) · DÜZELTME: Codex+glm-5.3 ÇALIŞIYOR (yanlış uç teşhisi düzeltildi) · B11-B15 — raporlar/teknik-yonetici-ozeti-2026-10-25.md
- 2026-10-25 (özet) · [task-graph evi, F2-6 birleşimi] GLM 5.3 sarmalayıcı benchmark full-access kapanışı: Claude Code 95.12 · OpenCode 94.72 · Kilocode 88.20 · Codex 77.97 — raporlar F2-5'te ordu'ya girdi (glm53-wrapper-benchmark-2026-10-25); evin SSOT kopyaları arsiv/SSOT-eski-2026-10-25/

- 2026-10-19 · PASEO WORKSPACE MODEL SEÇİMİ RAPORU (R): 95 workspace (33 aktif) + 493 ajan kaydı + 65 ölçüm eşleşmesi; genel en iyi GLM 5.3/claude-glm 86 — raporlar/paseo-workspace-model-secimi-2026-10-19
- 2026-10-15 · R3 sınırlı vekalet + F6.5 rol→model UYGULANDI (ordu-core, bağımsız doğrulama PASS): 004-grants.sql + 003-role-model.sql + src/grants.ts + providers.ts kapalı registry — npm test 296/296 exit 0 (R) · kabul.csv R3-01/F65-01 GECTI_HERMETIK (canlı kanıt NOT_RUN)

- 2026-10-14 (özet): PLAN v2.9 KİLİT · canlı güvenlik dalgası (V3-S1.5/S1.6, M26/M31; 259/259) · F5.5 cwd (254/254) · 6-subagent derin analiz (MASTER-SSOT v2.4 73.5 — raporlar/plan-analiz-2026-10-14/) · gece vardiyası D1 · F0 baseline 122/122 · toplu commit 32 dosya (kullanıcı "commitle" onayı) — ayrıntı: plans/handoff/ zinciri
- 2026-10-13 (özet): PANO BEYNI canlı (e4ae439 + 407df89) · ORDU-PLAN v1→v1.5 · K-0033 ikili temsil ONAY + F1 TAMAM (19 test) · F2 TAMAM (/ordu + spawn kuyruğu, 12 test) · mockup v2 (b82dd3f) · v0.20 locDelta (b5acdef) + v0.21 metrik paketi (8f2ba0d) — ayrıntı: handoff zinciri 0127→1515→2014
- 2026-10-12 (özet): v0.5→v0.11 KİLİT serisi (K-0007..K-0018; 3bbc625, 277df7c, 196 test) · K-0013/14 bekçi köprüsü v0.9 + iskelet 4 repo · K-0017 gelen-kutu kanalı
- 2026-10-11 · kuruluş: repo+GitHub push · Plan v1.4+REHBER senkron (K-0002) · v0.2 pitbull (K-0004) · v0.4 echo kapısı+onboarding CANLI (K-0006)

## Bekleyen onaylar (insan)
1. ~~S4 anahtar rotate~~ İPTAL — K-0038 (2026-10-25, kullanıcı: "yeni anahtara gerek yok"); ~/.paseo/config.json kart güncellemesi + daemon restart yalnız sızma/iptal anında gündeme gelir (K-0038 prosedürü)
2. ~~F1~~ KAPANDI (2026-10-25, echo 3/3 ba3a7c8) · F2 ONAYLANDI — sürüyor, 4/8 adım; kalan adımlar + echo HANDOFF-2026-10-25-1640'da
3. F3: kanca tek eve + daemon restart (oturumu koparır — ayrı an) · F4: eski konumların silme/arşivi (açık onay)
4. K-0036 ücretli-yok politikası karar kaydı · §17.3 canlı test paketi

## Bilinen açıklar (saglik SARI/EKSİK backlog)
- CODEMAP 134 satır > 130 bütçe: **K-0037 ONAYLANDI** — kapsam genişletmesi (K-0035 hattı: `plans/handoff/` topaklamaya girer), uygulama F1/F3'e ertelendi (yeni kökte harita yeniden üretilir — çifte iş önlendi)
- Kural-proxy 78 satır (hedef <40): sadeleştirme backlog'ta
