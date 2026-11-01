# OTODEV pilot-0 — HASAT RAPORU (4/4 koşu bitti; maxRuns tükendi)

**Damga:** 2026-11-01 17:53 (ölçüldü, Get-Date). Kaynak: inspect_schedule 3b6cd207 (koşu geçmişi) + kira-log + 429-defter + git log/status + HANDOFF-1741 disk okuması — hepsi koordinatörce bağımsız doğrulandı.

## Ölçüm tablosu

| Koşu | Saat (yerel) | Sağlayıcı | Sonuç | Süre | Handoff | Kanıt |
|---|---|---|---|---|---|---|
| #1 | 17:17:00→17:23:47 | glm53u-codex | **BAŞARISIZ — 429 fırtınası** ("exceeded retry limit, 429", req a53b8f...-AMS) | 6dk47sn | YAZILAMADI (echo 0/3) | schedule run 159174b3 + defter 17:23:41.633 |
| #2 | 17:27:01→17:29:47 | glm53u-codex | **SESSİZ BAŞARI** — "kira taze — nöbet sessiz", exit 0 | 2dk46sn | gerekmedi | run 99a71bdc çıktısı |
| #3 | 17:37:00→17:42:37 | glm53u-claude | **DEVRİ YAZDI — İLK OTOMATİK DEVR** | koşu 5dk37sn · **devir 4dk08sn** (kira-al 17:37:59 → birak 17:42:07) | `HANDOFF-2026-11-01-1741.md` — echo 3/3, zincir 1658'e bağlı | run 2badf321 + kira-log + dosya diskte |
| #4 | 17:47:00→17:49:20 | glm53u-claude | **RED: echo-borcu-acik** — fail-closed zincir kapısı, dosyaya yazmadı | 2dk20sn | YAZMADI (tasarım gereği) | run 09944e9a çıktısı + `nobet durum` exit 1 |

## 5 ölçüm hedefi kapanışı

- **Devir süresi:** 4dk08sn (tek örnek; hedef eşiği karar kaydı hâlâ YOK — öneri: ≤10 dk, karar/K kaydı iş kalemi).
- **Echo doluluk:** 3/3 (1741 ilk 3 satırı ECHO-1/2/3 — kirli 138 · HEAD e341fd7 · K8-2b ilk onay; hepsi diskten çapraz doğrulandı).
- **Çift-yazar 0:** ✓ kira pencereleri çakışmıyor — [17:18:45→(ölüm 17:23:41, sat kira)→operatör birak 17:30:39] ve [17:37:59→17:42:07]; log 4 olay, tek kimlik nobet-ajan-21180 (daemon pid).
- **Kapı ihlali 0:** ✓ HEAD değişmedi (e341fd7) · commit/push yok · [insan] kapılarına dokunulmadı (4377/4930/8790 restart kuyrukta kaldı) · PANO_TOKEN kullanılmadı · headless -p koşulmadı.
- **Sekme açma 0:** koşu çıktılarında browser/sekme kanıtı yok (çıktı salt metin raporları; negatif kanıt sınırı dürüstçe not edilir).

## Bulguların kapanışı (ARA-DURUM F1-F4)

- **F1 (429 tur-içi ölüm): KANITLANDI** — run#1 ajanı devir yazarken öldü; kalkan spawn-kapısı/defter çalıştı ama tur-içi kalkan yok. **AÇIK** → düzeltme: dirilme-kapalı yarışı + nöbet ajanının dayanıklı uçta doğması (glm53u-claude'ye geçiş ilk yarım-çözüm — run#3/#4 o uçta sorunsuz).
- **F2 (çift enjeksiyon): KANITLANDI, AÇIK** — schedule stored systemPrompt hâlâ v2.0 snapshot'ı (inspect_schedule 17:53 okuması; bayat işaretçi 10-31-2002, ~47 kural); canlı v2.1 de enjekte oluyor → koşan ajan ikisini taşıdı. Temizlik [insan] v0.25 penceresi kararı.
- **F3 (kira pid semantiği): KISMEN KANITLANDI, AÇIK** — run#3 yine daemon pid 21180'ı kira sahibi yaptı (koordinatör talimatı aynen uygulandı); ajan-ölümünde kira yine bayat-canli görünürdü (run#1'de yaşandı). Öneri: kira kimliğini ajan-ömürlü bağla.
- **F4 (zincir kapısı): KAPANDI ✓** — run#4'te echo-borcu-acik RED'i ile fail-closed zincir kapısı CANLI KANITLI çalıştı: devir yazıldı ama devralan echo'yu kapatmadan yeni devir doğmaz (ardışikDevir 1).

## Yan bulgular

- 429-defterde **2 gerçek üretim kaydı** (17:23:41 run#1 ajanı + 17:31:15 nöbet-dışı ajan 95042ce9; ikisi glm53u-codex) — PK-a telemetri canlıda çalışıyor.
- Run#3'ün 1741 dosyasındaki "17:17 koşusu neden dosya üretmedi — repo tarafında kanıtsız" cümlesi artık ÇÖZÜLDÜ: Paseo tur kaydında ölüm kanıtı var (429, 17:23:47); ajanın dürüst "bilinmiyor"u bilgi eksikliğiydi, yanlış değil.
- Pilot schedule `completed`, maxRuns=4 tükendi → **pilot-0 KAPANDI**; kalıcı nöbet (A3 büyütme) [insan] kararı, diskC %10 eşiğine bağlı.

## Devralan için (1741'in echo borcu)

1741'in echo'su henüz kapatılmadı (run#4'nün RED sebebi bu). Kapanış yolu: sıradaki koordinatör oturumu 3 soruyu 1741'e yanıtlayarak echo append eder (bu oturum — KURMAY-1 — 3 soruyu yukarıda doğruladı: 138 / e341fd7 / K8-2b; 1741'e echo-kapanış satırı ayrı iş kalemi).

## Kapanış hükmü

**PİLOT-0 BAŞARILI:** mekanizmanın üç sonuç yolu da canlıda kanıtlandı (sessiz / devir / RED) + 1 gerçek arıza modu yakalandı (F1). İlk otomatik devir: 1741, 4dk08sn. Düzeltme kuyruğu: F1+F3 (öncelik) → F2 [insan] → devir-olcum.mjs + hedef karar kaydı → A3 büyütme [insan].
