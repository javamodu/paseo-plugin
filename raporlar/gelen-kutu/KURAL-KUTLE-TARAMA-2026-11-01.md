# KURAL-KÜTLE TARAMA — 2026-11-01 (salt-okur taban haritası)

Damga: 2026-11-01 04:43 (ölçüldü, Get-Date). Tarama salt-okur yürütüldü; kaynak dosyalara dokunulmadı, süreç başlatılmadı, ağ isteği gönderilmedi. Yalnız bu 2 rapor dosyası yazıldı (md + json, gelen-kutu protokolü K-0017).

**TABAN (öncesi) işareti:** GÖREV B (paseo-verimlilik sadeleştirme) yazıcısı paralel koşarken geliştirme reposunun çalışma ağacını şimdiden değiştirdi (kanıt: `git status` → M server/cekirdek.ts · M server/sozlesme.ts · M OVERVIEW.md · M package.json · ?? test/sadelestirme.test.ts). Bu rapordaki **TABAN** değerleri değişiklik ÖNCESİ durumdur; **GÜNCEL** etiketi yazıcı sonrası çalışma ağacını gösterir.

## 1. Enjeksiyon kaynağı haritası

**CANLI KAYNAK → HEDEF: `D:\Vibecode\ordu\plugin` (paseo-verimlilik, v0.23-kilit) → Paseo daemon üzerinden yaratılan HER ajanın `systemPrompt`'u.**

- Kayıt (config kanıtı): `C:\Users\gatep\.paseo\config.json` satır 135: `"paseo-verimlilik": { "source": "directory", "path": "D:\\Vibecode\\ordu\\plugin", "enabled": true }` (üstünde `"pluginsEnabled": true`). ordu\AGENTS.md satır 13 ("kayıtlı v0.23-kilit") ve kilit fişi `D:\Vibecode\ordu\plugin\surumler\v0.23\KILIT.md` (commit `9853bb1`, tag `v0.23-kilit`, 2026-10-26) ile uyumlu.
- Enjekte edilen metin: `D:\Vibecode\ordu\plugin\server\cekirdek.ts` içindeki `CEKIRDEK` sabiti — "SÖZLEŞME ÇEKİRDEK (v2.0)" (satır 1 başlık; satır 3: "Bu metin paseo-verimlilik plugin'i tarafından enjekte edildi"). 63 satır, 31 sayılabilir kural.
- Mekanizma (kod kanıtı): `index.server.ts` satır 62-92 — `server.before("agent.create")` her ajan yaratılışında `enjeksiyonMetni(cwd, mevcutSystemPrompt, rolEki)` çağırır (satır 72) ve systemPrompt'u sonuç metinle değiştirir (satır 87). Elle enjeksiyon RPC'si ayrıca var: `server\enjekte.ts` satır 26-69 (`sozlesmeEnjekte`; bağlanma `index.server.ts` satır 250) — mevcut ajan(lar)a `paseo.agents.ref(id).send("[paseo-verimlilik · sözleşme enjeksiyonu]…")` (satır 63-65).
- Bütçe/eşikler: `server\sozlesme.ts` satır 6 (ENJEKSIYON_BUTCE_BYTES = 20 KB), satır 7-8 (KURAL_SARI=40, KURAL_BLOK=80); `enjeksiyonMetni` satır 110-156; kapalı/işaretçi kipleri satır 118-123. Canlı ölçüm: butceBytes=6014 (bütçe içinde).
- Yapılandırma: repo başına `<katman-kökü>\.verimlilik\ayar.json` → `enjeksiyonMod: tam | isaretci | kapali` (`server\ayar.ts` satır 8 tip, satır 17 varsayılan "tam", satır 29 dosya yolu, satır 41 doğrulama). ordu ayarı: `D:\Vibecode\ordu\.verimlilik\ayar.json` = yalnız `k3Bitis` → mod = tam (varsayılan). `D:\Vibecode\.verimlilik\` = çalışma-zamanı durumu (telemetri.jsonl 88 KB + brief-state.json) — enjeksiyon yapılandırması DEĞİL; ayar.json yok → varsayılan tam.
- Kural sayımının proje kaynakları: `sozlesme.ts` satır 75-89 `projeKuralSayisi` — katman kökündeki (satır 23-35 `katmanKokuBul`; işaretçiler: .git, AGENTS.md, ANAYASA.md, STATE_BOARD.md, DERSLER.md) ANAYASA.md + AGENTS.md. ordu kökü için: ÇEKİRDEK 31 + ANAYASA 13 + ordu AGENTS 3 = 47.
- **GLOBAL SÖZLEŞME `D:\Vibecode\AGENTS.md\AGENTS.md` (Codex Engineering Contract, 506 satır) enjekte EDİLMİYOR.** Codex CLI global yuvası `C:\Users\gatep\.codex\AGENTS.md` **0 bayttır** (ölçüldü) — dosyanın kendi başlığı hedefi `~/.codex/AGENTS.md`'dir (satır 2 scope notu) ve o yuva boş. `D:\Vibecode\AGENTS.md` bir DİZİN olduğundan Claude Code bunu üst-dizin sözleşme dosyası olarak yüklemez (dolaylı kanıt: bu tarama oturumunda yalnız `D:\Vibecode\ordu\AGENTS.md` yüklendi). Sonuç: global sözleşme şu an hiçbir canlı enjeksiyon yoluna bağlı değil — GÖREV A budaması plugin'in ölçtüğü kural sayısını değiştirmez.
- Enjeksiyon zincirinin canlılığı telemetriyle kanıtlı: ordu\.verimlilik\telemetri.jsonl içinde tip:"lint" kayıtları (agent.create anında yazılır; index.server.ts satır 78-82 `lintKaydet`) — son 6 kayıt (2026-10-29 17:58 → 2026-10-31 18:35) tutarlı biçimde `kuralToplam=47, butceBytes=6014`.

## 2. Taban ölçümler (komutla ölçüldü; tahmin yok)

| Dosya | Satır | Bayt | Kural* |
|---|---|---|---|
| `D:\Vibecode\AGENTS.md\AGENTS.md` (global sözleşme) | 506 | 13.496 | 124 (22 numaralı + 102 madde†) |
| `ordu\arsiv\PASEO-VERIMLILIK-REHBERI-v2.0.md` | 127 | 14.017 | 63 |
| `ordu\sozlesme\PASEO-VERIMLILIK-REHBERI-v2.1.md` | 96 | 12.692 | 25 |
| `ordu\plugin\server\cekirdek.ts` (CANLI ÇEKİRDEK v2.0, v0.23) | 63 | 5.444 | 31 |
| `paseo-verimlilik\server\cekirdek.ts` (TABAN = GÖREV B öncesi) | 63 | 5.837 | 31 |
| `paseo-verimlilik\server\cekirdek.ts` (GÜNCEL, yazıcı B sonrası) | 57 | 6.137 | 22 (v2.1) |
| `ordu\ANAYASA.md` | 47 | — | 13 |
| `ordu\AGENTS.md` | 15 | — | 3 |
| `BUSINESS-REALITY-ENGINE\arastirma\PASEO-VERIMLILIK-REHBERI-v1.4.md` | 107 | 9.431 | — |
| `BUSINESS-REALITY-ENGINE\arastirma\PASEO-VERIMLILIK-PLANI.md` | 112 | 10.766 | — |
| `ordu\PASEO-VERIMLILIK-PLANI.md` | 123 | 13.018 | — |

\* Kural sayımı yöntemi: plugin'in kendi `kuralSayisi()` regex'i `^\s*(\d+\.|[-*]|[A-Z]\d+\.)\s+\S` (sozlesme.ts satır 65-73) — numaralı madde (N.), madde işareti (- / *) ve "XN." desenli satırlar sayılır. † checkbox satırları (- [ ] ×13) madde sayımına dahildir.

- **EK-1..5 özet satırları:** ÇEKİRDEK içinde 5 satır — cekirdek.ts satır 56 ("## EK özetleri") başlığı altında satır 58-62, her EK 1 satır: EK-1 (§5 token teknikleri) · EK-2 (§7 watchdog) · EK-3 (§8 subagent) · EK-4 (§9 onboarding) · EK-5 (K3 süre ekonomisi). ordu v2.1'in dış EK dosyaları (`ordu\sozlesme\`): REHBER-EK-OTONOM.md 11 · REHBER-EK-OZ-DEGERLENDIRME.md 11 · REHBER-EK-SURE-EKONOMISI.md 13 · REHBER-EK-YENI-PROJE.md 11 satır (toplam 46).
- **~49 iddiasının teyidi:** ÖLÇÜLEN canlı taban **47**'dir — plugin'in kendi telemetrisi (ordu\.verimlilik\telemetri.jsonl, tip:"lint", son 6 kayıt): `kuralToplam=47` = ÇEKİRDEK 31 + ANAYASA 13 + ordu AGENTS 3. ~49 iddiası ölçümle TAM teyit edilemedi; en yakın ölçülebilir değer 47 (±2). 47 > 40 (KURAL_SARI) → her ajan yaratılışında "UYARI: aktif kural sayısı ~47" satırı enjekte ediliyor (sozlesme.ts satır 141-143); blok eşiği 80'e uzak. GÖREV B'nin ÇEKİRDEK'i 22'ye indirmesi (kayıtlı kopyaya senkronize edilirse) toplamı **38**'e düşürür → sarı eşiğin altına.
- "Rehber v2.0 (paket reposu)" satır sayısı sorusu: paket reposunda rehber v2.0 **dosyası yok** (ayrıntı bölüm 4).

## 3. Çapraz-atıf süpürmesi (yalnız AGENTS.md · CLAUDE.md · README*; node_modules/.git hariç; rg -i -w)

- **ORDU + PASEO-VERİMLİLİK REPOLARI TEMİZ** — 16 bölüm adının hiçbiri bu iki reponun AGENTS.md/CLAUDE.md/README/OVERVIEW.md dosyalarında geçmiyor. GÖREV A ve GÖREV B'nin doğrudan çalıştığı iki repo atıf bağı taşımıyor.
- Kesin ifade **"Codex Engineering Contract"** yalnız 2 dosyada: (1) kaynağın kendisi `D:\Vibecode\AGENTS.md\AGENTS.md` (satır 1); (2) **GERÇEK ATIF: `D:\Vibecode\playwright-cdp\nullproxy\AGENTS.md`** — satır 4: "This overlay extends the global Codex Engineering Contract." + satır 5: "Hard Rules and Final Answer Contract from global apply unchanged." → GÖREV A budamasından etkilenecek tek bağımlılık bildiren dosya.
- **Yapısal uyarlama** (çoklu bölüm adı; büyük olasılıkla aynı sözleşmeden türetilmiş): `D:\Vibecode\Harness\raypipe\AGENTS.md` (satır 5 "## Project Mission", satır 21 "## Core Philosophy", satır 1150 "## Final Answer Contract"; Operator/continuation kullanımı) ve `D:\Vibecode\godaemon\gatepipe\AGENTS.md` (satır 10 "## Mission", satır 98 "Human Flow Cross-Examination", satır 280 "Hard rules:", satır 775 "## Final Answer Contract"; operator kullanımı).
- Tek-ad başlık (bağımsız kullanım olasılığı yüksek): `txt-to-cad\solidcraft\AGENTS.md` satır 8 "## Hard rules (what enforces each)"; `agent-os\universal-conv-log\README.md` satır 21 "Hard rules:"; `Chrome-extension\aibrowserkit\README.md` satır 7 "## 🎯 Core Philosophy"; `STARTTERKIT-BOILER\!saas-tipleri\!!webcontainer\ai-website-builder2\AGENTS.md` satır 5 "## 1) Mission & Mindset".

Bölüm adı → dış atıf durumu (kaynak belge hariç; "dış atıf YOK" = yalnız kaynakta geçiyor):

| Bölüm adı | Durum |
|---|---|
| Decision Priority | dış atıf YOK |
| Quick Checklist | dış atıf YOK |
| Readiness Scoring | dış atıf YOK |
| Risk Classification | dış atıf YOK |
| Drift Protocol | dış atıf YOK ("drift" kelimesi başka dosyalarda var, bölüm adı olarak yok) |
| Final Answer Contract | nullproxy (atıf, satır 5) · raypipe satır 1150 · gatepipe satır 775 |
| Hard Rules | nullproxy (atıf, satır 5) · gatepipe satır 280 · solidcraft satır 8 · universal-conv-log satır 21 (+ !repolar içi ~5 üçüncü parti) |
| Mission | raypipe satır 5 · gatepipe satır 10 (+ ~15 üçüncü parti/şablon dosyası, tesadüfi) |
| Core Philosophy | raypipe satır 21 · aibrowserkit satır 7 (+ pockode/engage/gutenberg üçüncü parti) |
| Cross-Examination | gatepipe satır 98 (uyarlanmış: "Human Flow Cross-Examination") |
| Core Principles | ~15 dosyada tek-ad başlık (website\CLAUDE.md, ai-image-video-gen\CLAUDE.md, STARTTERKIT boiler'ları, Archon, kild, jat, FasterClaw...) — türetme kanıtı yok, yaygın başlık |
| Execution Model | yalnız üçüncü parti (prefect, go-orchestrator, gemini-cli-bot, zeroclaw-plugins, ironclaw) |
| Mission/Escalation/Continuation/Operator/Precedence (kelime düzeyi) | 10-40'ar dosyada İngilizce teknik kelime olarak tesadüfi — atıf sayılmaz |

Yöntem notu: rg 15.1, `-i -w`, `--glob AGENTS.md / CLAUDE.md / README*` + `!**/node_modules/**`; gizli dizinler rg varsayımıyla taranmadı — D:\Vibecode\.claude ve .agents üst düzeyinde AGENTS/CLAUDE/README dosyası yok (ayrıca kontrol edildi).

## 4. Sürüm manzarası (ordu v2.1 ↔ paket v2.0)

ordu'nun v2.1'i (`sozlesme\PASEO-VERIMLILIK-REHBERI-v2.1.md`, 96 satır, 2026-10-13; üzerinde K-0039 [2026-10-26] ve K-0052 [2026-10-28] sadeleştirme dalgaları, EK'ler 4 dış dosyaya taşınmış) ile "paket reposunun v2.0'ı" aynı soyun iki ayrı dalıdır — ve kritik nokta: **paket reposunda (D:\Vibecode\paseo-verimlilik) rehber v2.0'ın tam metni dosya olarak HİÇ bulunmamıştır** (kanıt: `git ls-files` yalnız server/cekirdek.ts + server/sozlesme.ts; `git log --all -- ':(glob)**/*REHBERI*'` boş); paketin "v2.0"ı, cekirdek.ts'e gömülü 63 satırlık ÇEKİRDEK damıtmasıdır ve cekirdek.ts satır 3'teki "Tam sözleşme … (paket reposunda)" işaretçisi **kırıktır** — tam v2.0 metni tek kopya olarak `ordu\arsiv\PASEO-VERIMLILIK-REHBERI-v2.0.md`'de (127 satır, SUPERSEDED başlıklı) durur. ordu commit `c4f7043` (F2-4) plugin'i paseo-verimlilik → ordu\plugin'e taşıdı (.git eski yerde bundle+tag ile: `ordu\arsiv\history\paseo-verimlilik.bundle`, 204.822 bayt); kayıtlı canlı kopya v0.23-kilit (2026-10-26) ÇEKİRDEK v2.0'ı (31 kural) enjekte ederken ordu belgeleri v2.1'i bağlayıcı sayar — enjekte edilen katman ile reponun sözleşmesi arasında sürüm farkı vardır; v2.1'in farkı niteliksel olarak madde birleştirme (127→96 satır) + EK dışsallaştırma + K-0032/K-0052 düzeltmeleri, davranış semantiği korunmuştur. Bugün (2026-11-01) GÖREV B yazıcısı geliştirme kopyasında ÇEKİRDEK'i v2.1'e (22 kural, 57 satır) sadeleştirdi ve sozlesme.ts işaretçisini v2.1'e çevirdi — canlı kural sayısının 47'den 38'e inmesi, kayıtlı kopyanın (ordu\plugin) senkronize edilmesi + kilit + `paseo plugin reload` (v0.23 KILIT.md rollback notundaki komut) sonrası gerçekleşir.

## Bulgu tablosu

| id | bulgu | etiket | siddet | dosyaRef |
|---|---|---|---|---|
| KKT-1 | Canlı enjeksiyon kaynağı ordu\plugin (v0.23-kilit), geliştirme kopyası değil | enjeksiyon-kaynagi | orta | C:\Users\gatep\.paseo\config.json satır 135; ordu\plugin\surumler\v0.23\KILIT.md |
| KKT-2 | Çift-ev ayrışması: geliştirme kopyası (paseo-verimlilik) kayıtlı kopyanın önünde/yanında; GÖREV B bugün çalışma ağacını değiştirdi — TABAN ölçümler önce alındı | cift-ev | orta | git status (M cekirdek/sozlesme/OVERVIEW/package + ?? sadelestirme.test.ts); ordu commit c4f7043 |
| KKT-3 | ÇEKİRDEK'in "tam sözleşme paket reposunda" işaretçisi kırık — rehber v2.0 tam metni pakette hiç yok | kirik-isaretci | dusuk | ordu\plugin\server\cekirdek.ts satır 3; paket repo git kanıtı |
| KKT-4 | Global sözleşme (Codex Engineering Contract) hiçbir canlı enjeksiyon yoluna bağlı değil; tek gerçek dış atıf nullproxy | kapsam-bilgisi | bilgi | D:\Vibecode\AGENTS.md\AGENTS.md satır 2; C:\Users\gatep\.codex\AGENTS.md (0 bayt); playwright-cdp\nullproxy\AGENTS.md satır 4-5 |
| KKT-5 | Canlı kural tabanı 47; ~49 iddiası ölçümle tam teyit edilmedi (en yakın 47) | olcum-taban | bilgi | ordu\.verimlilik\telemetri.jsonl (son 6 lint kaydı, kuralToplam=47) |
| KKT-6 | Rehber v2.0 tam metni tek kopya (ordu\arsiv, 127 satır) — yedek/kopya riski | envanter | dusuk | ordu\arsiv\PASEO-VERIMLILIK-REHBERI-v2.0.md; ordu\arsiv\history\paseo-verimlilik.bundle |
| KKT-7 | Sürüm kopyaları dağınık: v1.4 (BUSINESS-REALITY-ENGINE) + 2 PLANI dosyası + v2.1 dış EK dosyaları (46 satır) — sadeleştirme bunlara dokunmaz | envanter | dusuk | BUSINESS-REALITY-ENGINE\arastirma\PASEO-VERIMLILIK-REHBERI-v1.4.md (107 satır) vb. |

Ayrıntılar ve öneriler json yan dosyada (schemaSurum:1, maddeler KKT-1..7, islenme:null).
