# STATE_BOARD — ordu (eski adıyla paseo-plugin; F1'de köke taşındı)

## Aktif iş
- bekci raporu: raporlar/takip-sozlesme/2026-10-25.md (untracked — commit bekliyor)
**F4-ÖNCESİ DENETİM TAMAM (2026-10-25 19:05; kullanıcı talebi, 6 salt-okur subagent) — `raporlar/denetim-6subagent-2026-10-25/` (commit `43d2c6d`)**: 58 ham bulgu → 20 madde. En kritik: K-0029/K-0036 kayıtları YOK · ham bench verileri eski evde arşivsiz (F4 silerse kayıp) · fake-green (cache-hit %175 bozuk metrik; kabul-oranı öz-bildirimli vs defter %33 NOT_RUN) · **zincir KOPUK: HANDOFF-1815 kısaltılmış ad → saglik 16 OK / 2 EKSIK (K-0039 + zincir) — "17 OK/1 EKSIK" anlatısı bayat**. Düzeltme uygulanmadı (karar insanda). Sıra önerisi: (1) zincir onarımı (2) F4 taslağı genişletilmiş (3) fake-green tamiri (4) doküman/atık temizliği. F3 KAPALI kanıtları ve kalan açık: `plans/handoff/HANDOFF-2026-10-25-1815.md` + F3 kapanış damgası (daemon 36184→20040, plugin ordu/plugin'den, B14 KAPANDI; B20 · karar C/D · F4 · K-0039 · B11–15 json hijyeni açık).

## Son damgalar (tam: son 3)
- 2026-10-25 · **F3 KAPALI — kanca tek eve + tam restart** (kullanıcı `F3 BAŞLA`; ADR F3): F3-1 `42ae414` cmd→scripts/ · F3-2 `24a5552` A0-A3 (plugin path→`ordu/plugin`, yedek `.bak-2026-10-25-F3`; codex trust+ordu; sozlesme-sondaj schedule→ordu) + envanter `raporlar/f3-restart-envanteri-2026-10-25/` · restart 17:52 (daemon 36184→20040, serverId korundu) · A6 kanıt: eski ev sessiz (B14 KAPANDI), plugin 7 method ready, git kesintisiz, saglik 17 OK / 1 EKSIK (K-0039) · B11 kısmi (cmd kapandı, kart ayağı karar C) · yeni bulgu B20 (pano köprüsü UI yolu eski ev)
- 2026-10-25 · **F2 KAPALI 8/8** (ADR-toparlanma-monorepo, kararlar/): F2-0..3 `84e3639 f0996b3 c41c75e ffa40c3` (ayrıntı HANDOFF-2026-10-25-1640) · F2-4 plugin/ c4f7043 (93 dosya; S2 temiz R; drift bekçisi arsiv/history bundle'a yöneltildi; npm test 4/4 EXIT=0 R) · F2-5 raporlar d112592 (kullanıcı onayı: 5 dosya raporlar/, W42/W43 çakışması arsiv/raporlar-silinecek-taskgraph/, ordu canlısına DOKUNULMADI) · F2-6 SSOT 234e56b (sozlesme/v2.1 yetkili, v2.0 arsiv; 3 ADR→kararlar/; eski SSOT→arsiv/SSOT-eski-2026-10-25/; MASTER-SSOT-PLAN 3 anahtar REDACTED: B16 nvapi + B18 gsk + B19 thk_live; yol atıfları güncellendi; DERSLER birleşimi 8 madde) · F2-7 SSOT-INDEX dolduruldu + CODEMAP 423 dosya→123 satır (K-0037 klasör-topaklama uygulandı: plans/handoff/ + bilesen dizinleri tek satır) + saglik **17 OK / 1 EKSIK** (kural-proxy 84>80 → **K-0039 erte, onaylı**)
- 2026-10-25 · **F1 TAŞIMA TAMAMLANDI** (kullanıcı koştu, ana-ajan diskten doğruladı): robocopy paseo-plugin→ordu /E (.git+untracked dahil) · `git -C ordu log` kesintisiz: 08dc97b devir → 0de7cdf K-0038 → f92cab3 · hafıza klasörü D--Vibecode-ordu 1:1 (memory/ boş — kayıp yok) · devir HANDOFF-2026-10-25-1542 taşımadan ÖNCE atıldı · F1 ölçüm kapıları: git-kesintisiz ✓ · memory ✓ · echo 3/3 yeni-yol oturumunda ba3a7c8 ✓ · eski konum donduruldu, silme F4
- 2026-10-25 (özet) · F0 KAPALI: kapanış zinciri ce50c92→0de7cdf (K-0038 rotate İPTAL, sızma prosedürü kararda) — ayrıntı handoff zinciri
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
1. **F3: kanca tek eve + daemon restart** (oturumu koparır — ayrı an/timing; B14 kapanışı, bekçi kapsamı tek ev)
2. F4: eski konumların (paseo-verimlilik, silinecek-task-graph, paseo-pano) silme/arşivi — açık onay; aynı pencere: B16/B18/B19 anahtarlarının env'e taşınması (kaynak dosyalar silinir)
3. K-0036 ücretli-yok politikası karar kaydı · §17.3 canlı test paketi
4. Kural-proxy sadeleştirme turu (K-0039): rehber v2.1 madde birleştirme → <80; ayrı dikkatli tur

## Bilinen açıklar (saglik SARI/EKSİK backlog)
- ~~CODEMAP 134 satır~~ **KAPANDI (F2-7)**: K-0037 klasör-topaklama uygulandı — CODEMAP 123 satır, 423 dosya (R)
- Kural-proxy 84 satır (tavan 80, hedef <40): **K-0039 erte (onaylı)** — sadeleştirme ayrı tur; saglik'deki tek EKSIK bu atıfla okunur
