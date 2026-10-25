# TEKNİK YÖNETİCİ ÖZETİ (detaylı) — 2026-10-25, 2. tur

Ölçüm yöntemi: tüm sayılar bugün diskten ölçüldü (find+wc, git log/status, JSON kanıt okuma) → (R); CSV çok-satırlı alanlar nedeniyle kabul sayımları (T) yaklaşıklıktır.

## A. NE KADAR YAZILDI (ölçülmüş)

| Ev | Rol | Kod | Test | Git | Not |
|---|---|---:|---:|---|---|
| `silinecek-task-graph/ordu-core` | **Ordu çekirdeği** (31 src modülü: store, supervisor, dispatcher, grants, lessons, pano-server, providers, 4 SQL migration) | 5.363 | 6.856 | 1 baseline commit (c803673) + 12 kirli | 296/296 test PASS (R, 15 Ekim) |
| `paseo-verimlilik` | **Paseo plugin'i** (bekçi, rollup, pitbull, telemetri) | ≥3.097 | 1.347 | v0.22 kilit; 9 kirli | canlı çalışan ürün |
| `paseo-plugin` | **Sözleşme/plan/kanıt paketi** | 1.866 (18 script) | — | 15 Ekim'den beri donuk | 50 rapor klasörü, 35+ karar, kabul.csv 101 kapı |
| `paseo-pano` | **Pano UI** (tasarım aşaması) | ~1.010 (mockup+server.js) | — | git var | kod değil, mockup |
| `silinecek-task-graph/ordu-v3` | v3 doküman varyantı | 0 (yalnız 5 md + kararlar) | — | git YOK | kod yok |
| `silinecek-task-graph/kapsul-final-v2.0.0` | Teknik referans paketi | — | — | git YOK | ordu-core'un baseline'ı |

**Toplam yazılı: ~19.5k+ LOC kod+test** (ordu-core 12.2k, plugin ≥4.4k, pano 1.0k, scriptler 1.9k) + doküman katmanı (ANAYASA, rehber v2.0/v2.1, PLAN v2.9, 2 ADR + K-0001..0035, kanit/ 10 dosya, handoff zinciri).
PLAN §11 LOC bütçesi 9.3–14.3k → **ordu-core bütçe bandının üst ucunda**: kalan fazlar yeni LOC demektir.

## B. NE KADAR KALDI

1. **Kabul kapıları:** kabul.csv 101 satır. Ham token sayımı (T): kapanış işareti ≈ 70 (44 GECTİ_HERMETİK + 23 PASS + 3 GECTİ + PASS_PARTIAL), NOT_RUN ≈ 33 satır (kaniT alanındaki "canlı NOT_RUN" geçişleriyle 62 token). Net: **defter ~%35-40 kapalı; kalanların ezici çoğunluğu CANLI kanıt kapısı** (kod yazılmış, insan onayı + gerçek koşum bekliyor).
2. **Hiç yazılmamış fazlar** (§18 "tasarım tam, uygulama eksik"): F8 turnuva · F5-C izolasyon · R4 deadline · F7-B bağımsızlık · F9 UI-tester · gerçek pano UI (mockup'tan koda) · gözetimsiz §22.
3. **Sözleşme disiplini borcu:** 10 gün commit'siz ~270 untracked (paseo-plugin) + ordu-core 12 kirli + plugin 9 kirli; gelen-kutu 42+ madde; hijyen (mojibake, boş SSOT-INDEX, düz metin anahtar ×3 dosya).
4. **Özet oran (T):** çekirdek hat ~%70 kodlandı; canlı kanıt ~%35; öğrenme/turnuva/UI fazları %0.

## C. HANGİ KLASÖRLERDE YAŞIYOR — dağınık mı? EVET

Kanıtlı dağınıklık bulguları:

1. **Ana kod "silinecek" adlı klasörde** (`D:\Vibecode\silinecek-task-graph\`) — adı "silinecek" olan evde ana üretim yaşıyor; yanında 2.1 MB `ordu-core.zip` arşiv kopyası.
2. **İKİ ayrı SSOT seti:** paseo-plugin (ANAYASA+DERSLER+STATE_BOARD+HEDEF+PLAN) VE silinecek-task-graph (AGENTS+DERSLER+HEDEF+MASTER-SSOT-PLAN+STATE_BOARD+raporlar) — çift-doğru-kaynak riski sözleşmenin kendi tanıdığı tehlike.
3. **Üretim ev değiştirdi ve bekci fark etmedi:** 24–25 Ekim çalışması (glm53-wrapper benchmark, model-benchmark, provider-bench evidence, .bench-* 4 dizin) **silinecek-task-graph'ta** üretildi — "19 Ekimden beri üretim yok" tespiti paseo-plugin için doğruydu, genel için YANLIŞ.
4. Altı ayrı ev: sözleşme (paseo-plugin) · çekirdek (silinecek-task-graph/ordu-core) · plugin (paseo-verimlilik) · pano (paseo-pano) · doküman-v3 (ordu-v3) · referans (kapsul-final). Ayrıca paseo-plugin içinde `.claude/`, `.tmp-home/` untracked çöp.
5. Harness klasörü (`D:\Vibecode\Harness`: raypipe, vix, wozcode-plugin) bu projeye ait DEĞİL — yanlış ev arama riskini artırıyor.

## D. BUGÜN DÜZELTİLEN İKİ ÖNCEKİ HATA (dürüstlük kaydı)

1. **"Codex çalışmıyor" hükmü yanlıştı.** 24 Ekim wrapper benchmark (R): Codex 0.164.0-alpha.11.1, model **glm-5.3**, görev BAŞARILI, exit 0 (179 sn, 70 event). Tek uyarı: "Model metadata for glm-5.3 not found — fallback metadata" (performans notu, arıza değil). Sıralama: Claude Code 95.1 · OpenCode 94.7 · Kilocode 88.2 · **Codex 77.9**. 19 Ekim matrisi yanlış ucu (`/glm-api`, chat-only) ölçmüştü. Bugünkü canlı ölçümüm de: limitsiz uç /chat 200 (anahtar+paket sağlam).
2. **"19 Ekimden beri üretim yok" hükmü tamamlanmalı:** motor çalışması 24–25 Ekim'de silinecek-task-graph'ta sürdü (yukarıda). Watchdog'nun görüş alanı paseo-plugin'la sınırlıymış — bu bir bekçi kör noktası bulgusudur (B14).

## E. SIRADAKİ ADIMLAR (güncellenmiş, sahipli)

**S0 — Senden (bloklayıcı kararlar):**
1. K-0034: PLAN v2.9 onayı (11 gündür bekliyor)
2. "Commitle" — üç repo dalga dalga (paseo-plugin 270, ordu-core 12, plugin 9)
3. §17.3 canlı test paketi onayı
4. **YENİ: Toparlanma ADR'i** — öneri: `ordu` monorepo (core+plugin+pano tek evde), SSOT tekilleştirme (tek STATE_BOARD/DERSLER/HEDEF), "silinecek-task-graph" adının terki. K-0034 kapsamına eklenebilir.
5. K-0036: ücretli API yok politikası (öneri)

**S1 — Benden (onaylarla):**
6. Commit dalgaları + codemap/saglik tazeliği (üç evde)
7. Hijyen: mojibake, SSOT-INDEX, ADR başlıkları, K-0029/K-0034 dosyaları, anahtar env'e taşıma (3 dosyadan temizlik)
8. Bekçi kör noktası kapatma: watchdog kapsamına silinecek-task-graph ekleme
9. `codex -p glm exec` teyidi + TokenHarbor free kota probu

**S2 — Benden (kanıt kapatma):**
10. F6.5 canlı 2-provider spawn + R3 canlı vekil koşusu
11. Gelen-kutu 42+ madde işleme turu
12. Yeni HANDOFF halkası

**S3 — Sonraki sprint:** F8 → F5-C → R4 → F7-B → §22 gözetimsiz kapısı → pano mockup→kod

Damga (R): 2026-10-25 · ajan = ana-ajan (teknik yönetici özeti, 2. tur — ölçümlü) · commit = YOK · kaynak: find/wc/git/JSON kanıt okuma (bugün koşuldu) + raporlar/codex-uc-analizi-2026-10-25 · yeni bulgular B14 (üretim ev değiştirdi/bekçi kör noktası), B15 (çift SSOT seti + "silinecek" ana ev).
