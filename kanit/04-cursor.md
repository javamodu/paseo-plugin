# 04 - Cursor Verimlilik Mekanikleri

Kaynak (11 Eki 2026): cursor.com/docs canlı sayfaları (rules, bugbot, cloud-agent) + cursor.com/docs/llms.txt tam doküman indeksi. Not: docs.cursor.com artık cursor.com/docs'a yönleniyor; her sayfa `.md` uzantısıyla ham markdown da veriyor.

## 1. Rules (.mdc) — 4 tip + aktivasyon matrisi

- 4 kural tipi: **Project** (`.cursor/rules/*.mdc`, git'e girer), **User** (global), **Team** (dashboard'dan, enforce edilebilir), **AGENTS.md** (metadata'sız basit alternatif).
- `.cursor/rules` içindeki düz `.md` dosyası YOK SAYILIR (frontmatter yok diye) — sadece `.mdc`.
- Aktivasyon matrisi (frontmatter: `alwaysApply`, `description`, `globs`):

| alwaysApply | description | globs | Davranış |
|---|---|---|---|
| true | — | — | Her oturumda dahil; globs/description yok sayılır |
| false | — | var | Eşleşen dosya bağlamdaysa otomatik eklenir |
| false | var | yok | Ajan description'a bakıp ilgililik kararı verir |
| false | yok | yok | Sadece `@kural` ile manuel |

- Öncelik: Team → Project → User; çakışmada önceki kazanır. Team Rules enforce edilirse kullanıcı kapatamaz.
- Resmi tavsiye: "Agent aynı hatayı tekrarlayınca kural ekle; önceden aşırı optimize etme"; kanonik örneğe `@dosya` referansı ver (içerik prompt'a inline GİRMEZ, ajan gerektiğinde okur).
- `/create-rule` chat komutu frontmatter'lı kural dosyasını üretir. Kural güncellemesi için GitHub issue/PR'da `@cursor` etiketlenebilir.

## 2. Cloud Agents (background agents)

- İzole VM'de çalışır; paralel sayı sınırı yok; yerel makine kapalıyken bile koşar; multi-repo ortamı destekler.
- Ortam: `.cursor/environment.json` veya Dockerfile; "Builds" arka planda hazır snapshot üretir. Resmi uyarı: ortam kurmamak = "mühendise bilgisayar vermemek".
- Tetikleme kanalları: cursor.com/agents web, iOS, Slack `@cursor`, GitHub/Bitbucket PR/issue yorumu, Linear, API.

## 3. Bugbot (otomatik PR review)

- Her PR push'unda otomatik çalışır; `cursor review` / `bugbot run` yorumuyla manuel tetiklenir; önceki PR yorumlarını okuyup tekrar öneri yapmaz.
- Repo config: `.cursor/config/bugbot.yaml` **base branch'ten** okunur → PR kendi review kurallarını değiştiremez; 64KB üstü config yok sayılır. Precedence: kişisel override → repo yaml → takım dashboard.
- CI check isimleri: GitHub `Cursor Bugbot`; sonuçlar success/neutral/failure; `fail-on-unresolved-issues` ile merge engelleme; Autofix ayrı check (`newBranch`/`existingBranch`).
- Enterprise API: `POST /bugbot/review` (30 istek/dk), `dryRun` ile yan etkisiz tam analiz.

## 4. Bulgu: Memories ve Notepads dokümanlardan kalkmış

- cursor.com/docs/llms.txt tam indeksinde Memories ve Notepads sayfası YOK; yerine Rules, Skills, Subagents, Hooks, Plugins var. Ders: Cursor, opak oto-hafıza yerine açık + sürümlenebilir + kapsamlı kurallar yönünü seçmiş. (Notepads 2025'te deprecated duyurulmuştu; 2026 dokümanlarında tamamen yok.)

## 5. Çalınabilir mekanik tablosu (önem sırasıyla)

| # | Mekanik | Verimlilik etkisi (tahmin) | Kod etkisi | Artı | Eksi |
|---|---|---|---|---|---|
| 1 | 4 modlu kural aktivasyonu (always/glob/description/manual) | Talimat tokenında %30-60 tasarruf (tahmin); doğru kural doğru anda | Düşük: frontmatter parser + glob matcher | Sektör standardı olmuş; Paseo plugin'ine birebir port | Glob motoru bakım ister |
| 2 | Kuralları git'te sürümleme + "hatada kural güncelle" döngüsü | Tekrarlanan hata oranında düşüş (tahmin) | Yok (disiplin) | Ekip geneline yayılır | Kural şişmesi riski → bütçe gerekir |
| 3 | bugbot.yaml'in base branch'ten okunması | Güvenlik: kötü PR kural değiştiremez | Yok (Paseo paseo.json'da zaten var) | Kanıtlanmış desen | — |
| 4 | Cloud agent + hazır ortam snapshot'ı | "Ortam kurma" kaybı ortadan kalkar | Yüksek (Paseo'da karşılığı worktree + setup hooks) | Test edebilen ajan = kapalı döngü | Maliyet/altyapı |
| 5 | Oto-PR review (Bugbot) | İnsan review yükünde azalma (tahmin) | Orta (Hub trigger + review ajanı) | Her push'ta tutarlı kontrol | False-positive gürültüsü |
| 6 | @dosya referansı = tembel yükleme | Bağlam şişmesini önler | Yok (talimat deseni) | Basit | Ajanın okumayı unutma riski |

## Kaynaklar

- https://cursor.com/docs/rules · https://cursor.com/docs/bugbot · https://cursor.com/docs/cloud-agent · https://cursor.com/docs/llms.txt

## ÖZET

1. Cursor'un kural sistemi 2026'da tam olgunlaşmış: 4 tip × 4 aktivasyon modu; `.mdc` frontmatter disiplini Paseo sözleşme plugin'inin glob-scoped kural motoruna doğrudan port edilebilir (etki: talimat tokenında %30-60 tasarruf, tahmin).
2. Memories/Notepads'in dokümanlardan silinmesi güçlü sinyal: opak oto-hafıza kaybetti, açık/sürümlenebilir kurallar kazandı — Paseo hafıza tasarımını dosya-tabanlı tutmak doğru karar.
3. Bugbot'un "config base branch'ten okunur" deseni Paseo'nun paseo.json modeliyle birebir aynı; watchdog/review config'i için hazır ve kanıtlı desen.
4. Cloud Agents'ın dersi: ajan verimliliğinin bir numaralı belirleyicisi çalışan ortam (test/build); Paseo'da worktree + paseo.json setup hook'ları bunun karşılığı.
5. Kod etkisi açısından en ucuz ve en yüksek getirili çalıntı: aktivasyon matrisi + glob kurallar; en pahalı ama dönüştürücü olanı: hazır-ortamlı arka plan ajanları.
