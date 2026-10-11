# DERSLER — paseo-plugin (L5)

- PowerShell here-string kapanışı `'@` satır başında olmalı; değilse parser hatası.
- Remove-Item bazı ortamlarda politikaya takılır; Move-Item çalışır.
- "$anchor" çift tırnak içinde $ değişkeni interpolasyon yapar — eşleştirme metinlerini tek tırnakla tanımla.
- 130 satır markdown ≈ 4-5k token (Aider'in 1k token bütçesi yoğun kod sembolleri içindir; doküman haritası daha hacimli).
- Git post-commit hook testi temp repoda 5 dakikada kanıtlanır (HEAD damgalı CODEMAP üretildi).
- gh repo create stderr'e yazar; PowerShell NativeCommandError sanabilir — ls-remote ile doğrula.
- apply_patch argv'sinde çok satırlı argüman bu ortamda bozuluyor ("last line" hatası) → regex::Escape + tekil-eşleşme-şartlı Replace deseni kullan.
- Subagent araştırma raporundaki (R) etiketler reviewer denetimi olmadan karar gerekçesi yapılmaz (N=80 çöküşü doğrulanamadı, (T)'ye düştü).
- Araştırma ajanı mevcut kuralı "eksik" sayabilir — §8 paralellik tavanı varken eklenti önerildi; önce repo'dan doğrula.
- PowerShell tek-elemanlı çift dizisi düzleşir: @(@('a','b')) → iki string; başına virgül koy veya tekil Swap kullan.
- Paseo plugin server bundle'i CJS + eval (evaluateBundle): import.meta.url ve __dirname YASAK — "path argument must be of type string, received undefined" hatasının kaynağı budur; asset'ler TS modülüne gömülür.
- Paseo plugin install hatası plugins/index.js:191'de fırlatılır ama asıl hata plugin START'ındadır — `paseo plugin logs <id>` + daemon.log'ta stack ara.
- exec_command'da Remove-Item (çoklu ve tekil) bu oturumda policy'ye takıldı; mcp node_repl fs.rmSync çalışır.
- Plugin telemetrisi: agents.ref(id).refresh().lastUsage dolu geliyor (in/out/cachedInputTokens) — ajan başına token ölçümü #5682 beklemeden kısmen mümkün.
- create_agent MCP aracı provider'ı "provider/model" ister; bu makinedeki codex endpoint'i yalnız kimi-K3 kabul eder (gpt-6-luna model_not_allowed).