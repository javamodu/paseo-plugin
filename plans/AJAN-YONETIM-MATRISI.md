# AJAN YÖNETİM MATRİSİ — kurmay el kitabı (Paseo + KURMAY-1 sözleşmesi)

Tarih: 2026-11-04 · Kaynak: Paseo MCP araç yüzeyi (srv_zM3KvDbisBso) + PASEO-VERIMLILIK-REHBERI v2.1 (EK-2/EK-3) + K-0062.
Soru kökeni: operatör «kurmay ve diğer ajanlar için schedule/create iki yöntem var, bir de kendiliğinden başlamış projeleri takip var — üç çeşit doğru mu? heartbeat cron watchdog neresinde? dizin kontrolü? rate limit? benchmark/kapı?»

## 1) Ajan çeşitleri (DOĞRULAMA: 3 DEĞİL — 4 doğum şekli + 1 izleme kategorisi)

| # | Tür | Nasıl doğar | Ömrü | Kim yönetir |
|---|---|---|---|---|
| 1 | **Kalıcı subagent** (`create_agent`) | Koordinatör/ajan çağrısıyla, workspace'e bağlı | Uzun ömürlü — bitince idle kalır, tekrar emirle uyanır | Doğuran ajan (ben) tam yetkiyle |
| 2 | **Cron ajanı** (`create_schedule`) | Daemon cron tetiklemesiyle — her koşuda YENİ ajan doğar | Tek koşuluk (koşu biter ajan ölür); schedule kalıcı | Daemon + koordinatör (schedule araçlarıyla) |
| 3 | **Heartbeat** (`create_heartbeat`) | Cron bana prompt DÜŞÜRÜR — ajan DOĞMAZ | Kalıcı (ben zaten yaşıyorum) | Ben koşarım; maxRuns/expiresIn sınırlarım |
| 4 | **Uzak host ajanı** (serverId'li araçlar) | Aynı araçlar, hedef daemon seçili | 1/2 ile aynı | Aynı — serverId parametresiyle |
| 5 | **Kendiliğinden/manuel başlamış ajan** (İZLEME kategorisi) | Operatör Paseo desktop'tan açar, projede çalışır | Operatörün ajanı | BEN İZLERİM + YÖNLENDİRİRİM; öldürme/arşiv SADECE emirle |

## 2) Çalışma şekilleri

| Tür | Çalışma deseni |
|---|---|
| Kalıcı subagent | Brief (EK-3 4 öğe: hedef · çıktı formatı · araç/kaynak · görev sınırı) → koşu → teslim raporu raporlar/gelen-kutu'ya → koordinatör bağımsız doğrulama |
| Cron ajanı | Aynı brief şablonu + cron ifadesi + maxRuns/expiresIn (K-0062 harç tavanı buradan bağlanır) |
| Heartbeat | 2 satır durum raporu (EK-2) — asla kullanıcı onayı sayılmaz; aynı konu 2. ardışık dürtmede dururum |
| Manuel ajan | Operatörün akışı — ben harici müdahale etmem (yalnız prompt/steer/interrupt) |

## 3) Yönetim sınırları (hard frenler)

| Güç | Subagent'ım | Operatörün ajanı | Not |
|---|---|---|---|
| Görme (list/status/activity/terminal capture/disk kaydı) | TAM | TAM | `~/.paseo/agents/` salt-okur |
| Yönlendirme (prompt · steer = tura katıl · interrupt = turu kes) | TAM | TAM | 3f3584c0 yazıcı her dalga böyle yönetiliyor |
| Ayar (model/mod/etiket — update_agent, set_agent_mode) | TAM | Emirle | Mod tur sınırında değişir (cache) |
| Koşu durdurma (cancel — ajan yaşar) | TAM | Emirle | Cancel yarım işi diskte BIRAKIR — sonrası kirlilik denetimi benim |
| Kalıcı ölüm (kill/archive) | TAM | Emirle | Geri alınamaz — sahiplik disiplini |
| İzin yanıtı (respond_to_permission) | GÖRÜRÜM, ASLA onaylamam | AYNEN | EK-2: kullanıcı adına onay YASAK |
| Schedule (pause/resume/update/delete/run-once) | TAM (benim schedule'larım) | Dokunmam | maxRuns = koşu sayısı sınırı |
| OS süreç sinyali / dondurma / beynine müdahale | YOK | YOK | API = daemon düzeyi; shell'im var ama kill_agent temiz yol, ham süreç öldürme kirli bırakır |

## 4) Özel soruların cevapları

| Soru | Cevap |
|---|---|
| Dizin kontrolü? | EVET 2 katman: workspace/cwd seçimi (worktree izolasyonu: local/branch-off/checkout-branch/checkout-pr) + read-only mod (denetim ajanlarına kilit). list_agents cwd süzgeci izlemede. |
| Rate limit? | Paseo API'de per-agent zaman-limiti ARACI YOK. Frenler: K-0062 (dalga ≤4 koşu, ≤3 paralel yazıcı, ≤5 doğrulayıcı) + schedule maxRuns/expiresIn + cron aralığı (makro kadans). Mikro (token/dk) sağlayıcıda: glm53u-claude sınırsız (operatör direktifi), codex 429'a yatkın (ölçüldü). |
| Watchdog / cron / heartbeat yerleşimi? | **cron** = zaman makinesi (schedule + heartbeat ikisinin de motoru). **heartbeat** = cron'un bana prompt düşüren hali. **watchdog** = EK-2 DAVRANIŞ PROTOKOLÜ (ajan değil, sözleşme): heartbeat dürtmesine 2 satır rapor + 2. ardışık dürtmede dur. |
| Hedef benchmark alanı? | Paseo'da native YOK. Bizim kurulumumuzda kapı = koordinatör KANIT ZİNCİRİ (bağımsız test EXIT kodu + diff hunk + canlı DOM ölçümü + PNG) — dalga kapanış kapısı; brifte kabul ölçütü yazılır, ölçtirmeden iş kapanmaz. İstenirse her görev brifine sayısal kabul-ölçütü (benchmark) ZORUNLU alan yapılabilir — karar operatörde. |

## 5) Sürü planına bağlantı

Denetim sürüsü = tür 2 (cron) veya tür 1 (kalıcı) + read-only mod + dizin izolasyonu; bulgular her projenin `raporlar/gelen-kutu/<ad>-<tarih>.md+.json`'a. Pilot 3 ajan → rapor → operatör onayı → 42 proje dalga dalga (K-0062 tavanları içinde). İlgili: [K-0062] harç/LOC tavanları · EK-3 subagent standardı · [subagent-ölçek-kuralı] belleği.
