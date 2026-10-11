# 09 - Token Verimliliği Araçları ve Ölçülmüş Tasarruflar

Kaynak (11 Eki 2026): repo README'leri + GitHub API (star) + docs.claude.com/en/docs/build-with-claude/prompt-caching.md (resmî doküman).

## 1. Repo-paketleme araçları (bağlam üretimi)

| Araç | Star | Ne yapar | Öne çıkan |
|---|---|---|---|
| yamadashy/repomix | 28.8k | Tüm repoyu tek LLM-dostu dosyaya paketler; dosya başına token sayımı | `--compress` = tree-sitter ile iskelet çıkarımı (Aider repo-map'in genel hali); `--remote` ile GitHub reposunu doğrudan paketler; MCP server modu var |
| mufeedvh/code2prompt | 7.7k | Kod tabanı → tek prompt; source tree + şablon + token sayımı | Handlebars şablonları |
| simonw/files-to-prompt | 2.8k | Dizin dosyalarını tek prompt'ta birleştirir | En minimal; `--cxml` Claude XML formatı |

## 2. Prompt caching (en büyük hazır tasarruf)

- **Anthropic** (resmî doküman): otomatik caching (tek `cache_control` alanı) veya explicit breakpoint; varsayılan 5 dk TTL, 1 saat opsiyonu; cache kullanıldıkça süre ücretsiz yenilenir; otomatik modda breakpoint her istekte son cache'lenebilir bloğa kayar. Resmî iddia: uzun promptlarda **%90'a kadar maliyet**, **%85'e kadar gecikme** düşüşü.
- **OpenAI**: otomatik prompt caching, min 1024 token; cached input %90-95 indirimli (fiyat tablosu, doğrulanmış — birleşik plan AR-8).
- Kural: değişmeyen büyük içeriği (sözleşme, repo-map, hafıza) prompt'un BAŞINA sabitle; değişkeni sona koy → cache hit maksimize. Paseo sözleşme plugin'inin enjeksiyon sırası bu yüzden önemli.

## 3. Sıkıştırma

- **LLMLingua** (microsoft, 6.7k star; EMNLP'23 / ACL'24 yayınlı): prompt'u 20x'e kadar sıkıştırır, "minimal performance loss" (resmî iddia). Doğal dil bağlamında etkili; KOD için dikkat: kritik token kaybı riski.
- Context compaction: Claude Code `/compact` + ayarlanabilir auto-compact; OpenCode gizli compaction ajanı. Paseo'da provider'a bağlı; #5728'de Codex'in compact döngüsü bug'ı kayıtlı (dikkat).

## 4. Ölçülmüş / yayınlanmış rakamlar (tahmin değil)

| İddia | Kaynak |
|---|---|
| Prompt caching: %90'a kadar maliyet, %85'e kadar gecikme düşüşü | Anthropic resmî dokümanı |
| LLMLingua: 20x'e kadar sıkıştırma, minimal kayıp | microsoft/LLMLingua README (hakemli yayın) |
| mem0 yeni algoritma: 7K token bütçesi, 0.88s p50, LoCoMo 92.5 | mem0 README (Nisan 2026) |
| Aider repo-map varsayılan bütçesi: 1k token | aider.chat/docs/repomap |
| Windsurf kural limitleri: 6k global / 12k dosya karakter | docs.windsurf.com |

## 5. Çalınabilir mekanik tablosu (önem sırasıyla)

| # | Mekanik | Verimlilik etkisi | Kod etkisi | Artı | Eksi |
|---|---|---|---|---|---|
| 1 | Prompt caching dostu enjeksiyon sırası | %40-90 input maliyet düşüşü (resmî üst sınır %90) | Yok: enjeksiyon sırası disiplini | Sıfır kod, anında | Provider'a göre değişir; TTL yönetimi |
| 2 | repomix `--compress` ile görev öncesi repo paketi | Tam-repo bağlamı %90+ küçülür (tahmin) | Düşük: terminal aracı; Paseo ajanı bugün koşturabilir | Kurulum yok, npx yeter | Çıktı statik; değişince yeniden üret |
| 3 | Token bütçesi kuralları (6k/12k/25kB) | Prompt şişmesine sert fren | Yok: sözleşme + lint | Ölçülebilir disiplin | Keyfi sınırlar |
| 4 | Ucuz-model kaskadı (title/summary/compact) | Yardımcı iş maliyeti %50+ düşer (tahmin) | Yok: Paseo metadata kaskadında var | Zaten çalışıyor | — |
| 5 | LLMLingua benzeri sıkıştırma | Doğal dil bağlamında 5-20x | Yüksek: ayrı servis | Büyük hafıza için çekici | Kod için riskli; v1'de alma |
| 6 | Compact stratejisi (manuel + watchdog) | Bağlam dolunca iş ölmez | Düşük: sözleşme kuralı | Bilinen desen | #5728 tarzı döngü riski; cooldown şart |

## ÖZET

1. En büyük hazır tasarruf prompt caching: Anthropic %90/%85 resmî iddia; Paseo sözleşme plugin'inde sabit içeriği prompt başına enjekte etmek bunu bedavaya açar — sıralama disiplini tek başına yeterli.
2. repomix (`--compress` tree-sitter iskeleti + token sayımı + `--remote`) H2 hedefinin bugün kurulabilir halihazır aracı; Aider repo-map deseninin paketlenmiş hali.
3. Yayınlanmış rakam az: caching %90, LLMLingua 20x, mem0 7K/0.88s; gerisi tahmin — plan tablosunda etiketli tutulmalı.
4. LLMLingua kod bağlamında riskli; Paseo v1'ine ALMA, sadece uzun doğal dil hafıza özetleri için ileride değerlendir.
5. Compact döngüsü (#5728) gerçek risk: watchdog ile compact tetikleme tasarlarken cooldown + sayaç zorunlu.


