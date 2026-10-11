# 06 - Aider + OpenCode Verimlilik Mekanikleri

Kaynak (11 Eki 2026): aider.chat/docs/repomap.html + usage/conventions.html (canlı), opencode.ai/docs/rules.md + agents.md (ham markdown). GitHub API: Aider 49.5k star, OpenCode 212.7k star.

## 1. Aider repo-map — "ışık hızı erişim" hedefinin kalbi

- Tree-sitter ile her dosyadan sadece kilit semboller + tanım satırları çıkarılır (class/def imzaları); tüm repo tek kompakt haritada.
- Harita her kullanıcı isteğiyle birlikte LLM'e gider; LLM haritadan hangi dosyaları açacağına KENDİSİ karar verir ve ister (tembel yükleme).
- Sıralama: dosyalar düğüm, bağımlılıklar kenar olan grafta graph-ranking algoritması; en çok referans verilen tanımlar öncelikli.
- Token bütçesi: `--map-tokens` (varsayılan **1k token**); sohbette dosya yoksa harita dinamik genişler, dosya eklenince daralır.
- Ek mekanikler: `CONVENTIONS.md` dosyasını otomatik tanır (`/conventions` vb.), her edit sonrası otomatik lint + test koşturup hatayı modele geri besler (otomatik düzeltme döngüsü).

## 2. OpenCode: AGENTS.md + ajanlar

- AGENTS.md katmanları: proje kökü (yukarı doğru taranır) → global `~/.config/opencode/AGENTS.md` → Claude uyumluluk fallback'i (`CLAUDE.md`, `~/.claude/CLAUDE.md`, `~/.claude/skills/`). İlk eşleşen kazanır.
- `/init` repo'yu tarar, cevaplanamayan yerde hedefli soru sorar, AGENTS.md'yi üretir/geliştirir (var olanı ezip geçmez). İçerik: build/lint/test komutları, doğrulama sırası, dosya adından anlaşılmayan mimari, gotcha'lar.
- `opencode.json instructions[]`: glob (`packages/*/AGENTS.md`) ve **remote URL** desteği (5 sn timeout ile çekilir); AGENTS.md ile birleştirilir.
- Built-in ajanlar: **Build** (primary, tüm araçlar açık), **Plan** (primary; edit + bash varsayılanı `ask` — salt analiz), **General/Explore/Scout** (subagent; Explore salt-okur kod, Scout dış doküman/bağımlılık araştırması), + gizli sistem ajanları **compaction/title/summary** (otomatik koşar, UI'da seçilemez).
- Subagent çağrımı: primary ajan description'a bakıp otomatik delege eder veya `@general` ile manuel; alt oturumlar arası gezinme kısayolları var.

## 3. Çalınabilir mekanik tablosu (önem sırasıyla)

| # | Mekanik | Kaynak | Verimlilik etkisi (tahmin) | Kod etkisi | Artı | Eksi |
|---|---|---|---|---|---|---|
| 1 | Repo-map (tree-sitter + graph rank + 1k token bütçesi) | Aider | Tam-repo bağlamını ~%90+ küçültür; doğru dosyaya tek seferde atlama | Orta: tree-sitter script'i veya repomix köprüsü; Paseo skill/hook'una bağlanır | H2 hedefinin tek kanıtlanmış çözümü; model-agnostik | Büyük monorepolarda harita üretimi periyodik maliyet ister |
| 2 | Gizli sistem ajanları (compaction/title/summary) | OpenCode | Yardımcı işler ana bağlamdan çıkar; ucuz modele devredilir | Yok: Paseo metadata kaskadı zaten yapıyor; genişletme düşük maliyet | Maliyet görünmez şekilde düşer | — |
| 3 | Plan ajanı: edit+bash `ask` | OpenCode | Yanlışlıkla yazım sıfırlanır | Yok: Paseo modeId ile aynı | Güven + hız birlikte | Sürekli izin penceresi yorgunluğu |
| 4 | /init repo taraması | OpenCode | Yeni projede onboarding sıfırlanır | Düşük: tek prompt + skill | AGENTS.md/paseo.json taslağı otomatik | Üretilen taslak bakım ister |
| 5 | instructions[] glob + remote URL | OpenCode | Monorepo/ekip kural paylaşımı merkezileşir | Düşük: paseo.json'a instructions alanı önerisi | Tek doğru kaynak | Remote fetch güvenlik/timeout riski |
| 6 | Otomatik lint+test geri beslemesi | Aider | Hatalı edit anında yakalanır | Düşük: turn_ended hook'u + komut | Kapalı döngü kalitesi | Test süresi uzunsa turu yavaşlatır |
| 7 | CONVENTIONS.md otomatik tanıma | Aider | Sıfır kurulum | Yok: sözleşmeye 1 satır talimat | Basit | Dosya yoksa etkisiz |

## ÖZET

1. H2 (kod indeksi, ışık hızı erişim) için kanıtlanmış tek ucuz çözüm Aider'in repo-map'i: tree-sitter sembol haritası + grafik sıralama + 1k token bütçesi; tam repo bağlamını ~%90+ küçültür (tahmin), Paseo'ya script/skill olarak orta maliyetle taşınır.
2. Repo-map'in asıl zekası LLM'in haritadan dosya SEÇMESİ: "hepsini yükle" yerine "haritayı göster, istediğini aç" — tembel yükleme disiplini tüm Paseo ajanlarına sözleşmeyle öğretilebilir.
3. OpenCode'un gizli compaction/title/summary ajanları, Paseo'nun metadata kaskadının zaten doğru yolda olduğunu doğruluyor; aynı desen "oturum özeti" ajanına genişletilmeli.
4. Plan (salt-okur) vs Build (tam yetki) ayrımı Paseo modeId'leriyle birebir var; eksik olan tek şey bunu sözleşmeye "varsayılan önce Plan" kuralı olarak yazmak.
5. `/init` + `instructions[]` (glob+URL) ikilisi, paseo.json'un evrim yol haritası: repo taramasından taslak üretimi ve merkezi kural paylaşımı.
