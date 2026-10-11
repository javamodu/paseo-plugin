# PASEO VERİMLİLİK PLANI

Tarih: 11 Eki 2026 · Plan v1.4: karşı paketin "BİRLEŞİK PLAN v2"si ile hizalandı, 8 boşluk kapatıldı (rehber ile senkron sürüm: v1.4). Kanıt: `kanit/01`-`10`. Kural: ölçüm yoksa (T)=tahmin, (R)=resmî/yayınlı ölçüm; tek-kaynak iddialar * işaretli (spot doğrulama borcu).

## 1. Verimlilik kazanç tablosu (ÖNEM SIRASIYLA)

Hız = uçtan uca görev süresi kısalması; Kalite = hata/tekrar düşüşü; Token = maliyet düşüşü. Yüzdeler tek başına etkidir; doğrusal toplanmaz (birikim notu altta).

| # | Mekanik | Hız | Kod kalitesi | Token | Kod etkisi | En kritik artı | En kritik eksi | Kanıt |
|---|---|---|---|---|---|---|---|---|
| 1 | Sözleşme enjeksiyonu (`agent.create` → REHBER v1.4 ÇEKİRDEK + proje L0/L1) | +%10-20 (T) | +%15-30 (T) | ±%0 (T): ~8KB ekler, israfı önler | Düşük (~100 satır) | Tüm kazançların taşıyıcısı | Prompt şişmesi → bütçe lint şart | Yüksek (01, 02) |
| 2 | Cache-dostu sıralama (sabit başa, değişken sona) | +%30-85 (R) | ±%0 | -%90-97.5 Anthropic cache-read (R) · -%90-95 OpenAI cached input (R, min 1024 token, otomatik) | Yok: sıralama disiplini | Sıfır kod, anında | TTL/provider farkı | Yüksek (09 + birleşik §4) |
| 3 | Repo-map artifact (`scripts/codemap.ps1` / repomix `--compress`) | +%20-40 (T) | +%10-15 (T) | -%70-90 (T); 600k→1-4k token = 150-500x (T, PoC'ta ölçülecek) | Düşük-orta; script KURULU | H2'nin tek kanıtlı yolu | Statik; periyodik yenileme | Yüksek mekanik (06, 09) |
| 4 | Oturum kaydı (`turn_ended` → redaksiyonlu JSONL + STATE damgası) | +%15-25 (T): arşivden geri bakma hızı | +%10-20 (T): kanıt disiplini otomatik | ±%0 | Düşük: lifecycle-actions iskeleti hazır | "Geçmişin kaydı" (H1) otomatikleşir | Redaksiyon kuralı bakımı | Yüksek (02) |
| 5 | memory/ + devir töreni (H1) | +%30-50 (T) | +%10-20 (T) | -%20-40 (T) | Düşük: hook + şablon | Local-first, sektör konsensüsü | Dosya disiplini | Yüksek (03, 05, 08) |
| 6 | Pitbull watchdog (iki taraflı: cooldown + §7.6 dur-kuralı) | +%15-30 (T) | +%0-5 (T) | ±%0 (T) | Düşük (~50 satır) | Primitif hazır | Korumasız yayın YOK; #5728* | Yüksek mekanik (01, 02, 10) |
| 7 | Boomerang delegasyonu (6 öğeli brief + özet) | +%20-40 (T) | +%5-15 (T) | -%30-60 (T) | Yok: `create_agent` var | Kanıtlanmış desen | Özet kaybı riski | Yüksek (03, 05) |
| 8 | MCP araç tanımı kısma (`paseoTools` / defer-loading deseni) | +%5-10 (T) | ±%0 | -%85+ (R): ~55k token MCP tanım yükünde; profil başına araç kısıtlama | Yok: provider politikası config'i | Bugün yapılandırılabilir | Yanlış kısma = eksik araç | Yüksek (01 + birleşik §4) |
| 9 | Glob-scoped kurallar (.mdc aktivasyon portu) | +%0-5 (T) | +%5-10 (T) | -%30-60 (T): talimat bağlamında | Orta: glob matcher | Üç rakipte konsensüs | v1'de "hepsi başa" yeter | Yüksek (03, 04, 05) |
| 10 | Permission polisi (dar beyaz liste) | +%5-15 (T) | +%5 (T) | ±%0 | Düşük: event handler | Helper'lar hazır | Yanlış kural bloklar; dar başla | Yüksek (02, 03) |
| 11 | Token görünürlüğü (built-in usage-source ailesi) | ±%0 | ±%0 | -%10-20 (T) | Yok: kod yazılmaz | Bugün kurulabilir | Ajan başına ölçüm YOK (#5682*) | Orta (01, 10) |
| 12 | Profil başına model ayrımı | +%5-15 (T) | ±%0 | -%20-40 (T) | Yok: profiles + `update_agent` | Mevcut primitif | Yanlış profil riski | Yüksek mekanik (05, 01) |
| 13 | Hub trigger'ları | +%10-30 (T) | +%5-10 (T) | ±%0 | Düşük ama ön koşul ağır | Bugbot deseni | ERTELENDİ: tek makine | Yüksek mekanik (01, 04) |
| 14 | LLMLingua benzeri sıkıştırma | +%10-30 (T) | -%5-15 risk (T) | -%80-95 (R): 5-20x doğal dilde | Yüksek: ayrı servis | Büyük hafıza senaryosu | Kod için riskli; v1'DE YOK | Orta (09) |

**Birikim (T):** Token -%40-70 · Hız +%25-50 · Kalite +%15-30. Aynı israf iki kez sayılmaz. Ölçüm borcu: tur sayacı + cache-hit oranı plugin'de İLK GÜNDEN açık; ajan başına token telemetrisi upstream bekler (#5682*).

## 2. Plugin mimarisi (tek plugin: `paseo-verimlilik`)

- **Enjeksiyon:** `before(agent.create)` → REHBER v1.4 ÇEKİRDEK + proje L0/L1 işaretçileri systemPrompt BAŞINA (madde 2). Toplam enjeksiyon ≤20KB bütçe + lint kuralı (Windsurf 6k/12k dersi).
- **ÇEKİRDEK/EKLER bölünmesi** (rehberin kendi hijyen kuralının uygulanması):

| Katman | İçerik (REHBER v1.4) | Ne zaman | Bütçe |
|---|---|---|---|
| ÇEKİRDEK | §1 kurallar + §2 bütçe + §3 devir tetikleyicisi + §4 tablo + L0/L1 işaretçileri | Her agent.create | ≤8KB |
| EK-1 | §5 token teknikleri | Bağlam baskısı sinyalinde | — |
| EK-2 | §7 watchdog protokolü | Dürtmede (heartbeat promptu taşır) | — |
| EK-3 | §8 subagent standardı | Delegasyon yapacak ajana | — |
| EK-4 | §9 onboarding checklist | Yeni projede ilk tur | — |

v1'de EK'ler tetikleyici cümle olarak kalır; otomatik yükleme motoru madde 9 ile gelir.

- **Mevcut ajanlara geçiş (migration):** enjeksiyon yalnız yeni ajanlarda otomatik (agent.create); resume'da session_open systemPrompt'a dokunamaz. Geçiş yolları: (1) kapat + handoff ile devir (alıcı yeni ajan olduğundan otomatik alır), (2) send_agent_prompt ile tek seferlik "sözleşmeyi oku" mesajı, (3) plugin RPC'si sozlesme.enjekte(agentId) → mevcut ajanın konuşmasına send() ile ÇEKİRDEK düşürülür; Command Center'dan toplu geçiş butonu.
- **Agent-onboarding:** create'te workspace kökü taranır; L0/L1/L5 varsa okuma listesi + echo görevi, yoksa ilk-15-dakika protokolü (ANAYASA-SABLONU + L0/L1/L5 iskeleti); ilk tur sonunda doğrulama, tek seferlik dürtme.
- **Oturum kaydı:** `turn_ended` → redaksiyonlu JSONL arşiv (env değerleri maskeli) + STATE damgası hatırlatması.
- **Pitbull:** cooldown haritası plugin state'inde (tur başı maks 1 dürt, 10 dk sessizlik) + 3 ardışık stall → insan kapısı (Magentic ledger dersi). Dürtülen tarafın kuralları rehber §7.6.
- **Permission polisi:** dar beyaz liste (okuma komutları allow, `rm -rf`/force-push deny); gerisi kullanıcıya.
- **UI v1:** komut yüzeyi `addCommandCenterItem` ile kurulur (`addSlashCommand` referansta var ama örneklerde kanıtsız* — yedekli yaklaşım); STATE_BOARD paneli v2'ye.
- **Repo-map hattı:** `scripts/codemap.ps1` kurulu; HEAD değişince tazele (git repolarında post-commit hook); CODEMAP ≤130 satır (kod ~1k token, doküman ~4-5k); prompt'a yol + 1 satır özet enjekte edilir.
- **Doğrulama:** typecheck + `paseo plugin ls` + her kancanın canlı denemesi.
- **Gözlem modülü (öz-denetim + kuşbakışı):** plugin kendini ve ajanları sürekli ölçer. (1) Öz-denetim: her heartbeat'te doctor kapıları + enjeksiyon bütçe lint + hook hata sayaçları — kendi hatasını raporlar. (2) Ajan ölçümü: `turn_ended` → `.verimlilik\telemetri.jsonl` (tur, cache-hit, dürtme, stall, permission kararları; redaksiyonlu). (3) Kuşbakışı paneli (workspace panel, v2): performans/hız/kalite/güvenlik/token kazanç/hata oranı + milestone zaman çizelgesi + toplam LOC; eşikler §4. Köprü (bugün kurulu): `scripts/yonetici-ozeti.ps1` aynı metrikleri üretir — LOC + milestone + disiplin + doctor skoru + codex rollout token/hız/verim (tur-bazında gerçek harcama, turn_id dedup'lı); plugin gelince panel JSONL'den beslenir.

## 3. Hedef × Paseo primitifi matrisi

| Hedef | Birincil primitifler | Boşluk / eklenti |
|---|---|---|
| H1 geçmişin kaydı | /paseo-handoff, heartbeat, send_agent_prompt, get_agent_activity | Oturum JSONL kaydı (madde 4) + memory/ |
| H2 tam indeks | Terminal (rg), browser, paseo.json | İndeks YOK → codemap.ps1 kurulu (madde 3) |
| H3 hizalama | workspace/worktree, paseo.json hook'ları, checkout-pr | En güçlü taraf; ANAYASA + sözleşme yeter |
| H4 orkestrasyon | MCP araçları, profiles, CLI/SDK, schedule `--max-runs`/`--expires-in` | Watchdog (madde 6) + ajan başına ölçüm eksik; ajan-seviyesi max_runtime/idle_timeout doğrulanmadı* |

## 4. Doğrulanmış Ölçüm Kataloğu (R)

- Anthropic prompt caching: cache-read = base input'un %10'u (yeni modellerde %2.5-5) → %90-97.5 tasarruf; gecikme %85'e kadar düşer (resmî).
- OpenAI cached input: %90-95 indirim, otomatik, min 1024 token (fiyat tablosu).
- Context editing: 100 turluk eval'da token -%84; memory ile +%39 performans (vendor eval, yüksek-orta güven).
- Tool search / defer_loading: ~55k token MCP tanım yükü %85+ azalır (resmî).
- Skills progressive disclosure: ~100 token/skill metadata (resmî; A/B yok).
- mem0 (LOCOMO): -%90 token, -%91 p95 gecikme (üretici ölçümü, itirazlı).
- Bütçeli repo-map: 600k → 1-4k token (150-500x) — (T), Hafta 3 PoC'unda ölçülecek.

### Hedef eşikler (U8 — başarı önceden tanımlı; saglik.ps1 denetler)

| Metrik | Eşik | Kaynak |
|---|---|---|
| Bütçe uyumu (L0 ≤200 / L1 ≤100 / CODEMAP ≤130 satır) | %100 uyum | saglik.ps1 Katman A |
| CODEMAP tazeliği (harita ≥ en yeni kaynak dosya) | %100 taze | saglik.ps1 Katman A |
| Handoff zinciri (kopuk = 0) | 0 kopuk | saglik.ps1 Katman A |
| Cache-hit oranı (stabil dönem) | ≥ %60 | saglik.ps1 Katman B (plugin JSONL) |
| Pitbull dürtmesi | ≤ 10/oturum; 3 ardışık stall = insan kapısı | plugin sayacı |
| Echo'suz devir | 0 | handoff dizini denetimi |
| Yarım kalan iş oranı | < %10 (T, ilk ay baseline çıkar) | plugin sayacı |
## 5. Yol haritası (4 hafta)

- **Hafta 1 — taşıyıcı:** enjeksiyon v0 (ÇEKİRDEK + cache sıralaması + ≤20KB lint) + onboarding taraması + Command Center item + tur sayacı/cache-hit telemetrisi İLK GÜNDEN. Çıktı: plugin reposu.
- **Hafta 2 — disiplin:** pitbull (cooldown + stall kapısı) + permission polisi (dar) + turn_ended→JSONL + usage-source açma + heartbeat/schedule disiplini. Çıktı: v0.2.
- **Hafta 3 — hız:** repo-map hattı genelleştirme (repomix kod repolarında; ilk koşuda gerçek token sayımıyla %70-90 tahminini ÖLÇ) + STATE_BOARD paneli + composer pill. Çıktı: v0.3.
- **Hafta 4 — görünürlük + yayın:** glob-scoped kurallar (yalnız bütçe aşılırsa) + cross-repo görev kimliği (labels + rapor konvansiyonu) + registry submit. Hub YOK (tek makine).

## 6. Yapma Listesi (anti-kararlar)

- Vektör DB / embeddings: YOK (Aider ~1k tokenla çözüyor; Cursor embeddingsiz).
- Ayrı orchestrator modu: YOK (delegasyon + özet sözleşmesi yeter).
- Opak oto-memories: YOK (Windsurf/Cursor terk etti; kalıcı bilgi dosyaya).
- LLMLingua: v1'de YOK (kod bağlamında riskli).
- Hub / GitHub tetik: şimdilik YOK (tek makine; gerektiğinde repo-içi hub.yml).

## 7. Riskler

1. Sonsuz dürtme döngüsü: sayaç + cooldown + stall kapısı olmadan ASLA yayın yok.
2. Compact döngüsü (#5728*): watchdog compact tetiklerse aynı korumalar.
3. Ajan başına token ölçümü yok (#5682*): plugin tur sayacıyla kapatılır; gerçek telemetri upstream.
4. Prompt şişmesi: ≤20KB bütçe + lint; ÇEKİRDEK ≤8KB.
5. Provider farkları: enjeksiyon evrensel, caching davranışı değişir → iki provider'da doğrula.
6. `addSlashCommand` kanıtsız*: komut yüzeyi `addCommandCenterItem` yedeğiyle.
7. Bağımlılık bakımı: AutoGen 61k star ile maintenance mode'a düştü (doğrulandı) → repomix/MCP son-push kontrolü periyodik.
8. Spot doğrulama borcu: #5480/#5003/#6106/#6262 ve ajan-seviyesi max_runtime/idle_timeout tek-kaynak* — PoC öncesi doğrula.








