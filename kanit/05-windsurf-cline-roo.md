# 05 - Windsurf / Cline / Roo Code Verimlilik Mekanikleri

Kaynak (11 Eki 2026): docs.windsurf.com (Cascade Memories & Rules, Workflows sayfaları), docs.cline.bot (Memory Bank), RooCodeInc/Roo-Code-Docs reposu (using-modes.md, boomerang-tasks.mdx). Not: Windsurf artık "Devin Desktop" (Cognition satın alımı sonrası); eski `.windsurf/` yolları fallback olarak okunuyor.

## 1. Windsurf (Devin Desktop): Memories + Rules

- **Memories**: Cascade konuşma sırasında otomatik üretir; `~/.codeium/windsurf/memories/` altında lokal saklanır; workspace'e özeldir, git'e GİRMEZ, kredi tüketmez. İstenirse "create a memory of..." ile manuel ürettirilir.
- **Rules**: 3 kapsam — Global (`~/.codeium/windsurf/memories/global_rules.md`, tek dosya, **6.000 karakter limiti**, always-on), Workspace (`.devin/rules/*.md`, dosya başı **12.000 karakter limiti**, kendi aktivasyon modu), System/Enterprise (`/etc/devin/rules/`, IT dağıtır, read-only).
- Aktivasyon modları: `always_on`, `glob`, `model_decision`, `manual`. AGENTS.md aynı motorla işlenir: kök dizindekiler always-on, alt dizindekiler o dizine glob.
- Kritik resmi tavsiye: "Kalıcı bilgi için Memory'e güvenme; Rule veya AGENTS.md yaz." Gerekçe: kurallar sürümlenebilir + paylaşılabilir + aktivasyonu kontrolünde.
- Yeni Devin Local agent memories desteklemiyor; kullanıcılar "Devin: Open Cascade Migration Wizard" ile memory'lerini skill'lere taşıyor.

## 2. Windsurf: Workflows

- `.devin/workflows/*.md` = `/workflow-adı` slash komutuyla çağrılan çok adımlı prompt şablonu (deploy, PR review, release checklist).
- **Sadece manuel**: Cascade workflow'u kendiliğinden çalıştırmaz; otomatik yakalama isteniyorsa Skill kullanılır.
- Workflow içinden başka workflow çağrılabilir ("Call /workflow-2"); workspace + global + system kapsamları, git köküne kadar keşif, çoklu klasörde dedup.

## 3. Cline: Memory Bank

- 6 çekirdek markdown dosyası: `projectbrief.md` (temel), `productContext.md` (neden), `activeContext.md` (şu an — en sık güncellenen), `systemPatterns.md` (mimari), `techContext.md` (stack), `progress.md` (durum).
- Döngü: bağlam dolarken "update memory bank" → diske dök → yeni oturumda "follow your custom instructions" → kaldığı yerden devam.
- Kurulum: hazır "custom instructions" metni `.clinerules/memory-bank.md` olarak eklenir; conditional rules ile sadece `memory-bank/` dosyalarına dokunurken aktifleştirilebilir.
- "Memory Bank her AI aracıyla çalışır; komutlar değişir, yaklaşım aynı" — araç-agnostik metodoloji.

## 4. Roo Code: Modes + Boomerang

- Built-in modlar: Code, Ask, Architect, Debug, **Orchestrator**. Her mod farklı yetki/uzmanlık; mod değişimi: dropdown, `/architect` gibi slash, `Ctrl+.`, veya Roo'nun önerisi.
- **Sticky models**: her mod son kullanılan modeli hatırlar → mod başına farklı model = otomatik maliyet ayarı (örn. Architect'e pahalı, Code'a ucuz model).
- **Boomerang Tasks**: Orchestrator büyük işi alt görevlere böler; her alt görev KENDİ İZOLE context'inde koşar; ana göreve sadece özet döner → ana bağlam temiz kalır; sonuçlar bir sonraki alt göreve zincirlenir.

## 5. Çalınabilir mekanik tablosu (önem sırasıyla)

| # | Mekanik | Kaynak | Verimlilik etkisi (tahmin) | Kod etkisi | Artı | Eksi |
|---|---|---|---|---|---|---|
| 1 | Boomerang: alt görev izole context + özet dönüşü | Roo | Ana bağlamda %50+ tasarruf; paralelleşme | Yok: Paseo `create_agent` + worktree ile bugün var | Kanıtlanmış desen; pitbull ile birleşir | Özet kaybı riski (detay alt görevde kalır) |
| 2 | Memory Bank 6-dosya şablonu | Cline | Oturumlar arası "baştan anlatma" maliyeti sıfırlanır | Düşük: şablon + enjeksiyon talimatı | Araç-agnostik; L0-L5'e sade alternatif | Manuel disiplin ister (agent.create hook'u otomatikleştirir) |
| 3 | Kural karakter limitleri (6k/12k) | Windsurf | Prompt şişmesine sert fren | Yok: lint kuralı | Ölçülebilir bütçe | Keyfi sınır; bazı projelere dar gelir |
| 4 | Mod başına sticky model | Roo | Kolay işi ucuz modelle: %20-40 maliyet (tahmin) | Yok: Paseo agent profiles zaten benzer | Otomatik maliyet ayarı | Yanlış modda pahalı model kalabilir |
| 5 | Workflow = slash'lı md dosyası | Windsurf | Tekrarlı süreçlerde kurulum süresi sıfır | Yok: Paseo skills ile var | Git'te sürümlenir, ekip paylaşır | Manuel tetikleme (otomasyon için schedule gerekir) |
| 6 | Oto-Memories | Windsurf | Kısa vadede pratik | Yüksek: güvenilir geri çağırma zor | Sıfır çaba | Windsurf'ün kendisi terk ediyor — KALICI BİLGİ İÇİN KULLANMA |

## ÖZET

1. Üç aracın ortak dersi: **izole context + dosya-tabanlı hafıza + sürümlenebilir kurallar**. Opak oto-hafıza (Windsurf Memories) üreticisi tarafından bile terk ediliyor; Paseo'da hafıza düz markdown dosyası olmalı.
2. En yüksek getirili çalıntı Roo'nun Boomerang'ı: alt görev kendi context'inde, ana göreve sadece özet — Paseo'da create_agent + agent activity ile bugün uygulanabilir, kod etkisi sıfır.
3. Cline Memory Bank, kullanıcının L0-L5 hiyerarşisinin sadeleşmiş kanıtı: 6 dosya, net güncelleme tetikleyicileri ("update memory bank"), araç-agnostik.
4. Windsurf'ün 6k/12k karakter limitleri "kural bütçesi" kavramını somutlaştırıyor — Paseo sözleşme plugin'ine aynen lint kuralı olarak eklenebilir.
5. Roo'nun mod başına sticky modeli Paseo agent profiles ile neredeyse bedava karşılanıyor; ucuz/pahalı model ayrımını profile bağlamak %20-40 maliyet tasarrufu demek (tahmin).
