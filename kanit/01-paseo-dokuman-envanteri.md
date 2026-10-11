# Paseo Doküman Envanteri — Ajan Verimliliği Primitifleri

Tarih: 2026-10-11. Kaynak: https://paseo.sh/llms.txt altındaki 36 doküman sayfasının tamamı + Hub alt sayfaları (quickstart, concepts, daemons, triggers, workflows, github, configuration, security, self-hosting, hosted) indirilip okundu. Ham kopyalar: `arastirma/paseo-docs/`.

Hedef kodları: **H1** = geçmişin kaydedilmesi (handoff/hafıza) · **H2** = kod+döküman indeksleme, hızlı erişim · **H3** = dizin/mimari hizalama · **H4** = çok ajanlı orkestrasyon, göreve yapışma, token verimliliği

## H1 — Geçmişin kaydedilmesi (handoff / hafıza)

| Primitif | Ne işe yarar | Hangi hedefe hizmet | Doküman linki |
|---|---|---|---|
| `/paseo-handoff` skill | Görevi yapısal briefing ile devreder: ilgili dosyalar, ilerleme, kararlar, kısıtlar, kabul kriterleri; alıcı ajan kendi worktree'sinde devam edebilir | H1, H4 | https://paseo.sh/docs/skills.md |
| Heartbeat (`create_heartbeat`) | Aynı ajana cron ile periyodik prompt; konuşma geçmişi korunur, ajan kaldığı yerden devam eder | H1, H4 | https://paseo.sh/docs/schedules.md |
| `send_agent_prompt` (ajan ID ile) | Var olan konuşmaya prompt ekler; ajanlar ID ile birbirine soru/bulgu gönderir, hafıza konuşmada birikir | H1, H4 | https://paseo.sh/docs/orchestration-workflows.md |
| `get_agent_activity` | Ajan timeline'ının küratörlü özetini döner; bağlam aktarımını az tokenla yapar | H1, H4 | https://paseo.sh/docs/mcp.md |
| `inspect_schedule` + `schedule_logs` | Zamanlanmış işlerin çalıştırma geçmişi ve çıktıları sorgulanabilir | H1, H4 | https://paseo.sh/docs/mcp.md |
| Workspace arşivleme + restore | Arşivlenen workspace, Hub'a bağlı bir ajan devam ettirilecekse otomatik geri yüklenir | H1 | https://paseo.sh/docs/hub/triggers.md |
| Hub "Same conversation" continuation | Aynı GitHub issue/PR veya Slack/Discord thread'ine gelen yeni olaylar mevcut ajan konuşmasına düşer; `executionId` ile takip | H1, H4 | https://paseo.sh/docs/hub/triggers.md |
| Daemon-owns-session mimarisi | Oturumlar daemon'da yaşar; masaüstü/mobil/web/CLI'den aynı konuşmaya devam edilir | H1 | https://paseo.sh/docs/why.md |
| Orchestration skills paketi (`npx skills add getpaseo/paseo`) | `/paseo`, `/paseo-handoff`, `/paseo-committee`, `/paseo-advisor`: versiyonlanabilir, kalıcı iş-akışı hafızası | H1, H4 | https://paseo.sh/docs/skills.md |
| Plugin timeline öğeleri | Plugin'ler ajan timeline'ına özel kayıt ekleyebilir/dönüştürebilir; kalıcı kayıt yüzeyi inşa edilebilir | H1, H2 | https://paseo.sh/docs/plugins.md |

## H2 — Kod+döküman indeksleme, hızlı erişim

> Dürüst bulgu: Paseo'da gömülü kod indeksleme / semantik arama primitifi YOK. En yakın hazır yüzeyler aşağıda; gerçek indeksleme ya bir plugin ya da provider seviyesinde bir MCP sunucusuyla eklenir.

| Primitif | Ne işe yarar | Hangi hedefe hizmet | Doküman linki |
|---|---|---|---|
| Plugin sistemi (daemon RPC + paneller) | Daemon içinde kendi indeksleme/arama servisini yazıp Paseo UI'ına panel/komut/slash komutu olarak bağlama | H2 | https://paseo.sh/docs/plugins.md |
| Provider MCP yapılandırması korunur | Paseo ajanı olduğu gibi sarar; mevcut MCP sunucuların (örn. kod-index MCP) ajanlara aynen geçer | H2 | https://paseo.sh/docs/providers.md |
| Terminal MCP araçları (`create_terminal`, `capture_terminal`, `send_terminal_keys`) | Ajan `rg` gibi araçları denetimli terminalde koşturur; pratik "anında indeks" | H2, H4 | https://paseo.sh/docs/mcp.md |
| Browser automation araçları | Dış doküman sayfalarını ajan adına açma/okuma/ekran görüntüsü | H2 | https://paseo.sh/docs/browser-tools.md |
| `paseo.json` (repo kökü) | Proje bazlı ayar/talimat base branch'in commit'li halinden okunur; tüm ajanlar aynı projeksiyonu görür | H2, H3 | https://paseo.sh/docs/worktrees.md |
| Metadata generation | Workspace başlığı, branch adı, commit mesajı, PR başlık/gövdesi otomatik üretilir; kenar çubuğunda hızlı tarama | H2 (dolaylı) | https://paseo.sh/docs/metadata-generation.md |
| Skill sistemi | Repo-rehberi gibi tekrar kullanılabilir talimat paketleri tüm ajanlara dağıtılır | H2, H1 | https://paseo.sh/docs/skills.md |

## H3 — Dizin / mimari hizalama

| Primitif | Ne işe yarar | Hangi hedefe hizmet | Doküman linki |
|---|---|---|---|
| Project → Workspace → Session modeli | Görev = workspace; projeler repo/dizinleri gruplar; oturumlar (ajan, terminal, browser, diff) workspace içinde toplanır | H3 | https://paseo.sh/docs/workspaces.md |
| İzolasyon modları (local / worktree) | Paylaşılan checkout ya da görev başına izole dizin+branch | H3, H4 | https://paseo.sh/docs/workspaces.md |
| Yönetilen worktree yerleşimi | `$PASEO_HOME/worktrees/<checkout-hash>/<slug>` deterministik düzen; kök `worktrees.root` ile taşınabilir | H3 | https://paseo.sh/docs/worktrees.md |
| `paseo.json` setup/teardown hook'ları | Worktree oluşunca `npm ci`, `.env` kopyalama, migrasyon; arşivde temizlik — dizin hijyeni otomatik | H3 | https://paseo.sh/docs/worktrees.md |
| Scripts & services + reverse proxy | İsimli script'ler; servislere otomatik port (`$PASEO_PORT`) ve deterministik proxy URL (`<script>--<branch>--<project>.localhost`); servisler arası env değişkenleri | H3 | https://paseo.sh/docs/worktrees.md |
| `checkout-pr` modu | Bir GitHub PR'ını kendi workspace'inde açma; inceleme mimariyle hizalı | H3, H4 | https://paseo.sh/docs/worktrees.md |
| `origin/main` baz-ref kuralı | Remote-tracking ref'ten dallanma dokümante edilmiş kural; bayat `main` riskini önler | H3 | https://paseo.sh/docs/worktrees.md |
| Per-proje `metadataGeneration` talimatları | Branch adı formatı (`<type>/<scope>-...`), Conventional Commits gibi standartlar repo bazında zorlanır | H3 | https://paseo.sh/docs/metadata-generation.md |
| Worktree çöp toplama | Son workspace arşivlenince teardown koşar ve dizin silinir | H3 | https://paseo.sh/docs/worktrees.md |
| `$PASEO_SOURCE_CHECKOUT_PATH` | Worktree hook'larından orijinal checkout'a köprü; untracked config/cache erişimi | H3 | https://paseo.sh/docs/worktrees.md |

## H4 — Çok ajanlı orkestrasyon, göreve yapışma, token verimliliği

| Primitif | Ne işe yarar | Hangi hedefe hizmet | Doküman linki |
|---|---|---|---|
| Paseo MCP araç kataloğu (`injectIntoAgents`) | `create_agent`, `send_agent_prompt`, `list_agents`, `cancel/archive/kill_agent`, `update_agent` — tam orkestrasyon yüzeyi | H4 | https://paseo.sh/docs/mcp.md |
| Subagent ebeveynlik modeli + Subagents track | Alt ajanlar ebeveynin workspace'inde açılır, UI'da izlenir; `detach` ile üst seviyeye alınır | H4 | https://paseo.sh/docs/orchestration-workflows.md |
| Agent profiles + "When to use" notları | Model/mode/thinking presetleri; orkestratör `list_profiles` ile notları okuyup göreve uygun profili seçer | H4 | https://paseo.sh/docs/agent-profiles.md |
| Provider/model keşfi (`list_providers`, `list_models`, `inspect_provider`) | Profil uymazsa yapılandırılmış provider/model fallback keşfi | H4 | https://paseo.sh/docs/mcp.md |
| CLI orkestrasyonu (`paseo run --no-wait`, `paseo wait`, `--output-schema`) | Shell'den hiyerarşik ajanlar; yapısal çıktıyla implement-verify döngüsü | H4 | https://paseo.sh/docs/cli.md |
| Uzak daemon (`--host`, relay E2E, `PASEO_HOST`) | Başka makinedeki daemon'da ajan başlatma; makineler arası orkestrasyon | H4 | https://paseo.sh/docs/cli.md |
| Permission araçları (`list_pending_permissions`, `respond_to_permission`) | Orkestratör onay isteklerini uzaktan yönetir; iş akışı kilitlenmez | H4 | https://paseo.sh/docs/mcp.md |
| `paseoTools` provider politikaları | Profil bazında araç kataloğunu kısma (`disabledTools`, `enabled:false`) — hem güvenlik hem daha küçük prompt/token | H4 | https://paseo.sh/docs/mcp.md |
| Schedules (cron, `--max-runs`, `--expires-in`, timezone) | Her koşuda taze ajan; koşu sayısı/süre sınırları maliyeti frenler; build babysitting, günlük triage | H4 | https://paseo.sh/docs/schedules-cli.md |
| Heartbeats (göreve yapışma) | Aynı ajanı periyodik uyandırıp uzun işi küçük adımlarla bitirtir; iş bitince kendi heartbeat'ini sildirilebilir | H4, H1 | https://paseo.sh/docs/orchestration-workflows.md |
| Hub trigger'ları (GitHub/Slack/Discord/manual) | `github.issue_created`, `pull_request_created`, label/comment olaylarından ajan başlatma; `from_users` allowlist zorunlu | H4 | https://paseo.sh/docs/hub/triggers.md |
| Hub `github` bloğu | Adım bazında `GH_TOKEN` + scoped permission (`contents`, `pull_requests`); `gh`/`git` hazır, host git kimliğine dokunmaz | H4 | https://paseo.sh/docs/hub/github.md |
| Hub workflows (sıralı adımlar, classifier routing) | Çok adımlı akış; önce sınıflandırıcı okur, yetki sadece worker adımında; `if` ile koşullu adımlar | H4 | https://paseo.sh/docs/hub/workflows.md |
| Hub deadline'ları (`max_runtime`, `idle_timeout`) | Kaçak ajanları durdurur; workflow süresi adım sürelerini kapsar | H4 | https://paseo.sh/docs/hub/workflows.md |
| TypeScript SDK (`@getpaseo/client`) | Programatik ajan başlatma, paralel koşu, `waitForFinish` ile sonuç toplama; ajanlar UI'da görünür kalır | H4 | https://paseo.sh/docs/sdk.md |
| Metadata küçük-model kaskadı | Başlık/commit/PR metni otomatik olarak haiku/mini sınıfı ucuz modellere devredilir; sıralı fallback listesi yapılandırılabilir | H4 (token) | https://paseo.sh/docs/metadata-generation.md |
| Kompakt listeleme primitifleri | `list_agents` kompakt metadata, `get_agent_activity` küratörlü özet — orkestratör durumu az tokenla tarar | H4 (token) | https://paseo.sh/docs/mcp.md |
| `update_agent` (model/mode/thinking/features) | Oturum ortasında model/thinking değişimi; maliyet görev zorluğuna göre ayarlanır | H4 (token) | https://paseo.sh/docs/mcp.md |
| `paseo usage` | Host'taki hesap kota/bakiyelerini gösterir; NOT: ajan başına token tüketimini ÖLÇMEZ (dokümanda açıkça belirtilmiş) | H4 (token, kısmi) | https://paseo.sh/docs/cli.md |

## ÖZET

1. **H1 (hafıza/handoff) iyi karşılanıyor:** `/paseo-handoff` skill'i, heartbeat'ler, ajan-ID ile konuşma devamı, Hub'ın "Same conversation" continuation'ı ve `get_agent_activity`/`schedule_logs` ile geçmiş hem taşınabilir hem sorgulanabilir; uzun vadeli çapraz-ajan hafızası ise "konuşma + heartbeat + briefing + log" kombinasyonuna dayanıyor, ayrı bir hafıza deposu yok.
2. **H2 (kod/döküman indeksleme) bilinçli bir boşluk:** Paseo gömülü indeksleme sunmuyor; hazır yol, indeksleme MCP sunucusunu provider yapılandırmasıyla geçirmek veya plugin sistemiyle (daemon RPC + panel) kendi indeks aracını yazmak.
3. **H3 (dizin/mimari hizalama) en güçlü taraf:** workspace/worktree modeli, `paseo.json` setup-teardown hook'ları, otomatik port/proxy, `checkout-pr` ve repo bazlı isimlendirme kuralları mimariyi kodlanmış kurala dönüştürüyor.
4. **H4 (orkestrasyon) üç katmanlı:** MCP araç kataloğu + agent profiles/skills (ajan-içi), CLI/SDK (otomasyon), Hub trigger+workflow (GitHub/Slack/Discord olay-güdümlü); persistence heartbeat+schedule ile, token verimliliği ucuz-model kaskadı, kompakt listeleme, `paseoTools` kısıtlama ve deadline'larla sağlanıyor — ama ajan başına token ölçümü yok.
5. **Önerilen başlangıç sırası:** (a) `injectIntoAgents` + agent profiles + notlar, (b) worktree izolasyonlu paralel görevler, (c) heartbeat/schedule ile persistence, (d) GitHub tarafı için Hub trigger'ları, (e) indeksleme ihtiyacı için plugin veya MCP entegrasyonu.
