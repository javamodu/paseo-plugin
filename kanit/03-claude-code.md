# 03 - Claude Code Verimlilik Mekanikleri

Kaynak (11 Eki 2026): resmi dokumanlarin canli `.md` ciktilari (code.claude.com/docs/en/*). Linkler sonda. Not: Dokumanlar eski bilgilerden ileride; oto-hafiza, 33 hook eventi ve `auto` izin modu gibi yeni mekanikler dahil edildi.

## 1. Hafiza: CLAUDE.md hiyerarsisi + .claude/rules + oto-hafiza

| Katman (genis -> dar) | Konum | Paylasim |
| --- | --- | --- |
| Managed policy | `C:\Program Files\ClaudeCode\CLAUDE.md` (Win), `/etc/claude-code/` (Linux) | Kurum/IT |
| User | `~/.claude/CLAUDE.md` | Sadece sen, tum projeler |
| Project | `./CLAUDE.md` veya `./.claude/CLAUDE.md` (AGENTS.md da okunur) | Git ile ekip |
| Local | `./CLAUDE.local.md` (.gitignore'a ekle) | Sadece sen, bu proje |

- Ust dizinlerdeki dosyalar acilis yuklenir; alt dizinlerdeki CLAUDE.md'ler gerektikce (on-demand) yuklenir. `@import` ile dosya icine dosya cekilir. Hedef: dosya basina <200 satir.
- `.claude/rules/*.md`: konu bazli kurallar; `paths:` frontmatter'i glob'a baglar, kural sadece eslesen dosya Read/Write/Edit edilirken yuklenir (ciddi token tasarrufu).
- Oto-hafiza: Claude kendi notlarini yazar. `~/.claude/projects/<proje>/memory/` altinda `MEMORY.md` indeksi + konu dosyalari; turler: `user` / `feedback` / `project` / `reference`; her oturumda ilk 200 satir veya 25KB yuklenir; `/memory` ile kapatilir, subagent'lerin de ayri oto-hafizasi olabilir.
- Bakim araclari: `/init` kod tabanindan taslak CLAUDE.md uretir; `/doctor prompt-audit` eski/catisan talimatlari raporlar.

## 2. Subagents (.claude/agents)

- `.claude/agents/*.md` + YAML frontmatter: `name, description, tools, model, permissionMode, hooks, skills, memory, effort, background, isolation, omitClaudeMd, maxTurns`.
- Her subagent ayri context window'da kosar, ana sohbete sadece ozet doner -> ana baglam temiz kalir. Claude, `description` eslesmesiyle otomatik delege eder; toplam description'lar 15k tokeni asarsa baslangic uyarisi verir.
- Oncelik: managed > `--agents` CLI JSON > proje `.claude/agents/` > user `~/.claude/agents/` > plugin. Yerlesikler: Explore (salt-okur arama), Plan (plan modu arastirmasi), general-purpose. Subagent baska subagent acabilir, arka planda kosabilir, kalici hafiza acilabilir.

## 3. Hooks (tam event listesi)

- Eventler (33): SessionStart, Setup, InstructionsLoaded, UserPromptSubmit, UserPromptExpansion, MessageDisplay, PreToolUse, PermissionRequest, PostToolUse, PostToolUseFailure, PostToolBatch, PermissionDenied, Notification, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, Stop, StopFailure, TeammateIdle, ConfigChange, CwdChanged, DirectoryAdded, FileChanged, WorktreeCreate, WorktreeRemove, PreCompact, PostCompact, PreModelSwitch, PostModelSwitch, SessionEnd, Elicitation, ElicitationResult.
- Handler tipleri: shell komutu, HTTP endpoint, MCP araci, prompt/agent (LLM'in evet-hayir degerlendirdigi hook). `matcher` regex'i tool adina baglanir (MCP araclari dahil).
- Karar mekanigi: exit code 2 = islemi blokla ve stderr'i Claude'a geri besle; JSON ciktiyla `allow/deny/ask`, ek baglam enjeksiyonu, SessionStart'ta env degiskeni kalicilastirma. Tanim yeri: settings.json katmanlari; `/hooks` menusu.

## 4. Output styles

- Yerlesik: Default, Proactive (sormadan ise baslar), Concise (sonuc-once kisa), Explanatory (`Insight` bloklari), Learning (sana kod yazdirir). Ozel: `~/.claude/output-styles/` veya `.claude/output-styles/` altinda md dosyasi; frontmatter: `name, description, keep-coding-instructions`. `/output-style` ile tum oturum icin rol/ton/format tek yerden degisir.

## 5. Headless mode (-p) ve SDK

- `claude -p "sorgu"`: script/CI icin tek atis; `--output-format text|json|stream-json`, `--json-schema` ile semaya uyan yapilandirilmis cikti, `--max-turns`, `--allowedTools`, `--permission-mode`, `--agents '<json>'`, `--append-system-prompt[-file]`, `-c`/`-r` ile oturum surdurme; exit code ile dallanma; stdin pipe.
- `--bare`: hook, skill, komut, subagent, MCP, oto-hafiza ve CLAUDE.md kesfini atlar -> CI'da hizli ve tekrarlanabilir calisma; ihtiyaclar flag ile verilir.

## 6. Skills + ozel komutlar

- `.claude/skills/<ad>/SKILL.md`: frontmatter (`name, description, allowed-tools`, `context: fork` vb.) + govde; destek dosyalari gerektikce yuklenir (progressive disclosure). Kullanici `/komut` gibi cagirir ya da Claude description'dan kendisi secer; `$ARGUMENTS` ile arguman; skill subagent icinde kosabilir; plugin ile paketlenip dagitilir. Eski `.claude/commands/` yapisi skill catisina tasindi.

## 7. MCP entegrasyonu

- `claude mcp add`; uc kapsam: local (sadece sen+proje), project (`.mcp.json`, git ile ekip), user (her yerde). stdio/HTTP/SSE/WebSocket; OAuth akisi ve `claude mcp login`. Araclar `mcp__sunucu__arac` adiyla izin kurallarina girer; channels ile server oturuma mesaj itebilir; kurumsal connector kontrolleri var; Claude Code'un kendisi MCP server olarak da calisabilir.

## 8. Context compaction

- `/compact [talimat]`: sohbeti ozetleyip baglami bosaltir, talimatla odak verilir. Oto-compact penceresi ayarlanabilir: `/autocompact auto|500k` veya `--autocompact`. `PreCompact`/`PostCompact` hook'lari; `/context` renkli grid ile neyin kac token tuttugunu ve neyin compact'tan sag ciktigini (kurallar, hafiza dosyalari) gosterir.

## 9. Permissions

- Modlar: `default` (Manual, salt-okuma), `acceptEdits`, `plan`, `auto` (sunucu-tarafi classifier + hard-deny kurallari; prompt yorgunlugunu bitirir), `dontAsk` (onaysiz her sey red; CI kilidi), `bypassPermissions` (sadece izole ortam). Shift+Tab ile gecis.
- Uzerine allow/ask/deny kurallari (deny her modda gecerli, bypass'ta bile); kritik yollar (`.git`, sistem dizinleri vb.) hicbir modda otomatik onaylanmaz; workspace trust diyalogu. Ayar onceligi: managed > `--settings` > `.claude/settings.local.json` > `.claude/settings.json` > `~/.claude/settings.json`.

## 10. Calinabilir mekanikler

| Mekanik | Nasil calisir | Paseo'da karsilik | Calma onerisi |
| --- | --- | --- | --- |
| CLAUDE.md hiyerarsisi | 4 katmanli talimat dosyasi, otomatik yukleme | Yok (provider'lar kendi dosyasini okur, Paseo-native degil) | Workspace/proje bazli talimat dosyalari; `before("agent.create")` ile systemPrompt'a birlestir (bkz. 02) |
| Oto-hafiza | Ajan kendi notunu yazar; MEMORY.md indeks, 25KB tavan | Yok | Workspace basina `memory/` dizini + her prompt'a ilk 25KB enjeksiyonu; tur alani: user/feedback/project/reference |
| Path-scoped rules | `paths:` glob, dosya acilinca yuklenir | Yok | Token verimliliginin anahtari; glob eslemeli kural motoru |
| Subagent otomatik delegasyon | description eslesmesiyle yonlendirme, ayri context | Kismen: create_agent + profiller var, otomatik secim yok | Profil `notes`'una gore secen yonlendirici katman |
| Hook event katalogu | 33 event, shell/HTTP/LLM handler, bloklama | Kismen: plugin lifecycle + izin otomasyonu | Plugin API'ye agent.start/stop/permission/schedule-fired eventleri + config-driven tanim |
| Prompt-based hook | LLM evet/hayir ile karar veren hook | Yok | Ucuz modelle calisan plugin hook handler'i |
| Output styles | Oturum genelinde rol/ton/format | Yok (profil var ama ton katmani yok) | Profile `style` alani; systemPrompt sonuna eklenir |
| Headless -p + JSON cikti | Script/CI, exit code, stream-json, --json-schema | Var: CLI + schedule + background prompt; sema yok | Schedule ciktisina JSON-schema dogrulamali mod |
| --bare | Kesifleri atlayip hizli/tekrarlanabilir baslatma | Yok | "Hafif ajan" bayragi: plugin/hafiza/hook kapali |
| /compact + oto-compact | Ozetle baglam bosaltma, ayarlanabilir pencere | Provider'a bagli, Paseo kontrolu yok | Context doluluk gostergesi + tek tik compact tetikleme |
| /context gorunumu | Neyin kac token tuttugunu gosterir | Yok | Workspace panel: talimat/hafiza/skill token maliyeti |
| Izin modlari + kurallar | 6 mod, Shift+Tab, allow/ask/deny | Var: modeId + respond_to_permission | deny-listesi ve kritik-yol korumasi; auto-mode benzeri kural motoru |
| /init + /doctor | Kod tabanindan taslak uretimi, yapilandirma denetimi | Yok | Workspace acilisinda repo taramasi -> paseo.json + hafiza taslagi; catisma denetcisi |
| /rewind, /branch, /fork | Konusmayi geri sar/dallandir | Yok | Timeline'dan dallanma: arsivlemeden kopya ajan |
| Settings precedence | 5 katmanli net oncelik sirasi | Kismen | paseo.json (proje) vs kullanici config vs plugin default onceligini dokumante et |
| /batch fan-out | 5-30 paralel worktree subagent | Var: worktree workspace + create_agent; tek komut yok | Tek komutluk batch akisi (plugin veya schedule) |

## Kaynaklar

- Hafiza: https://code.claude.com/docs/en/memory | Subagentler: https://code.claude.com/docs/en/sub-agents
- Hook'lar: https://code.claude.com/docs/en/hooks (+ hooks-guide) | Output styles: https://code.claude.com/docs/en/output-styles
- Headless: https://code.claude.com/docs/en/headless | CLI: https://code.claude.com/docs/en/cli-reference
- Skills: https://code.claude.com/docs/en/skills | MCP: https://code.claude.com/docs/en/mcp
- Izinler: https://code.claude.com/docs/en/permission-modes (+ permissions, settings) | Komutlar: https://code.claude.com/docs/en/commands
- Genel secim rehberi: https://code.claude.com/docs/en/features-overview

## OZET

1. Claude Code'un verimlilik omurgasi "katmanli talimat + olay gudumlu otomasyon": 4 katmanli CLAUDE.md, glob'a bagli .claude/rules ve 33 event'li hook sistemi; Paseo'da buna en yakin zemin plugin lifecycle + izin otomasyonu, eksik olan config-driven basit hook katmani.
2. En degerli calinti oto-hafiza: ajanin kendi notlarini yazdigi MEMORY.md + 25KB yukleme tavani; Paseo workspace'lerine birebir port edilebilir ve hicbir rakip primitige bagli degil.
3. Subagent modeli (description ile otomatik delegasyon + ayri context + 15k description butcesi) Paseo profilleriyle birlesince guclu bir yonlendirici katmani verir.
4. --bare, -p/--json-schema ve izin modlari (ozellikle auto classifier + dontAsk) Paseo'nun schedule/heartbeat akislarina CI kalitesi katar; karsiliklari kismen var, derinlestirilmeli.
5. Token verimliliginin sessiz kahramanlari: path-scoped rules, /context gorunumu ve ayarlanabilir oto-compact; Paseo paneline "neyin kac token tuttugu" gostergesi eklemek ucuz ve yuksek etkili.
