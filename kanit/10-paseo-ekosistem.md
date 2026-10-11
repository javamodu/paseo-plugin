# 10 - Paseo Ekosistemi (github.com/getpaseo) — Somut Kopyalanabilirler

Kaynak (11 Eki 2026): GitHub API ile getpaseo/paseo (20.5k star) tam ağaç listesi + getpaseo/plugins registry ağacı + açık issue araması (memory/context).

## 1. getpaseo/paseo repo anatomisi

- `plugin-examples/` (14 örnek, hepsi çalışan referans): agent-configuration, buttons, catppuccin, hosts, inline-thinking, **lifecycle-actions** (turn_ended/permission helper'ları: `latestOutputText`, `shellCommand`), **lifecycle-logger**, linear, local-plugin, modal-ui, provider-acp-transformer, provider-direct, settings, **timeline-items**.
- `plugins/` (built-in): antigravity-provider, muse-provider + **usage-source** ailesi: claude, codex, copilot, cursor, grok, kimi, minimax, opencode-go, zai — provider başına kota/kullanım okuyucuları. Token görünürlüğünün ham maddesi.
- `packages/plugin` = `@getpaseo/plugin` SDK (client/server girişleri); `packages/client` = `@getpaseo/client` (programatik orkestrasyon); `skills/paseo-plugin` = plugin yazım skill'i; `public-docs/` = doküman kaynağı.

## 2. getpaseo/plugins registry (topluluk)

- Yapı: `plugins/<yazar>/<ad>.json` + `.md`; artifact npm (version + resolved URL + **sha512 integrity**) veya git (remote + **commit pin** + pluginPath); `submittedAt/reviewedAt` alanları → gözden geçirilmiş, sabitlenmiş dağıtım. CI: submit/validate/bump workflow'ları + issue template ile submission.
- Verimlilikle doğrudan ilgili topluluk plugin'leri:

| Plugin | Ne yapar (manifest/kategori kanıtı) |
|---|---|
| omercnet/context-mode | npm `@omercnet/paseo-context-mode` v2.0.0; kategori: providers/utils — bağlam modu yönetimi |
| stv1024/token-ledger | npm `paseo-token-ledger` v0.7.0; kategori: sidebar — token defteri paneli |
| zhjiang22/project-notes | git artifact; kategori: workspaces/sidebar — proje notları (H1/H2'ye yakın) |
| panrafal/agent-heartbeats | Composer pill'de ajan heartbeat'lerini göster/düzenle/sil; `paseo heartbeat` CLI üzerinden çalışır; prompt/maxRuns değişince yeni heartbeat + sıfırlanan geçmiş (Paseo API sınırı notu) |
| omercnet/agent-crew, vokturz/peer-agents | Çok-ajan koordinasyon denemeleri |
| yannelli/prompt-manager, naruforge/prompt-palette | Prompt/slash yönetimi |
| aborakati/usage-monitor, nerveband/provider-usage, ruiiiovo/usage-sidebar | Kullanım/kota görünürlüğü |

## 3. İlgili açık issue'lar (getpaseo/paseo, memory/context araması)

| Issue | İçerik | Anlamı |
|---|---|---|
| #5480 | "Add shared project context: agent-contributed knowledge inherited by future agents" | H1+H2'nin upstream talebi; açık → plugin ile şimdi yapılabilir |
| #5682 | "Show selected agent context usage in the composer" | Bağlam göstergesi talebi; plugin paneliyle şimdi yapılabilir |
| #5003 | "feat(client): expose agent fork context in public SDK" | Handoff/fork bağlamının SDK'ya açılması isteniyor |
| #5728 | "Codex agent compacts its context over and over in a loop" | Watchdog tasarlarken ders: cooldown şart |
| #6106 | "fix(omp): show manual /compact progress and refresh the context meter" | Bağlam ölçerinin doğruluğu aktif çalışılıyor |
| #6262 | "Long OpenCode v2 streams no longer exhaust the daemon's memory" | Daemon bellek sınırları bilinen konu |

## 4. Kopyalanabilir somut örnekler (önem sırasıyla)

| # | Ne | Nereden | Kod etkisi | Artı | Eksi |
|---|---|---|---|---|---|
| 1 | lifecycle-actions örneğinin helper'ları (`latestOutputText`, `shellCommand`) | plugin-examples/lifecycle-actions/server | Sıfır: kopyala-yapıştır | turn_ended watchdog + permission polisi doğrudan üzerine kurulur | — |
| 2 | agent-heartbeats plugin'i (heartbeat UI + CLI köprüsü) | registry (panrafal) | Sıfır: kur | Pitbull deseninin görünür UI'sı hazır | Prompt değişimi heartbeat'i sıfırlar (API sınırı) |
| 3 | usage-source plugin ailesi | plugins/ (built-in) | Sıfır: kurulu | Provider kota görünürlüğü | Ajan başına değil, hesap başına ölçer |
| 4 | token-ledger / project-notes / context-mode | registry | Sıfır: kur veya forklama | H1/token hedeflerine hazır parça | Topluluk kalitesi değişken; pin'li sürüm şart |
| 5 | timeline-items örneği (kalıcı kayıt yüzeyi) | plugin-examples | Düşük | Devir/STATE olaylarını timeline'a yaz | — |
| 6 | Registry submit akışı (issue → validate → pin) | getpaseo/plugins | Kendi plugin'ini yayınlarken | Topluluk geri beslemesi | Review süresi |

## ÖZET

1. Sözleşme plugin'i için gereken her kırıntı hazır: lifecycle-actions helper'ları (turn_ended/permission), agent-heartbeats (watchdog UI), timeline-items (kayıt yüzeyi) — toplam kod etkisi düşük.
2. Registry olgun: npm/git artifact pinning + integrity + review; kendi plugin'ini yayınlamak için net yol (issue → validate → bump).
3. #5480 (shared project context) hâlâ açık: bizim hafıza planımız upstream'in de istediği şey; plugin olarak şimdi yapıp ileride core'a önerilebilir.
4. Token görünürlüğü usage-source ailesi + token-ledger ile hesap seviyesinde var; ajan başına ölçüm eksik (plan tablosunda risk olarak kalıyor).
5. #5728 compact döngüsü ve #6262 daemon belleği, watchdog/pitbull tasarımının iki somut kenar-vaka dersi.
