# Admin Onboarding — Paseo Verimlilik Sistemi

> 5 dakikalık kullanım kılavuzu. Detay: PASEO-VERIMLILIK-REHBERI-v2.0.md · kararlar: kararlar/ · durum: STATE_BOARD.md

## 1. Günlük kullanım (en sık 3 hareket)

- **İş ver:** herhangi bir ajana doğal dille yaz. Başlık prefix'i yoksa ajan "coder" sayılır (tam yetki).
- **Onayla/reddet:** sistem sana yalnızca onay gereken noktalarda gelir (yazıcı komutlar, yeni katman kararları). Bekçi/sondaj raporları onay istemez, bilgi verir.
- **Durumu gör:** repo kökünde STATE_BOARD.md (aktif iş + damgalar); tüm filo için raporlar/proje-panosu/2026-10-12.md.

## 2. Rol verme — başlık prefix'i (v0.10)

Ajan oluştururken başlığın başına yaz; gerisi otomatik:

| Prefix | Rol | Ne yapar / yapamaz |
|---|---|---|
| (yok) veya [coder] | coder | Tam yetki; commit tek elden |
| [tester] | tester | Salt-okunur + test koşar; dosya yazamaz, commit atamaz |
| [reviewer] | reviewer | Salt-okunur + yalnız raporlar/ altına yazar; onay veremez |
| [bekçi] | bekçi | reviewer gibi; drift/anomali raporları |

Örnek başlıklar: `[reviewer] v0.10 inceleme` · `[tester] regresyon` · `[bekçi] gece turu`

## 3. Farklı LLM seçme

Ajan penceresinde provider + model seç (ya da create_agent'te provider/model):

| Provider | İçerik | Not |
|---|---|---|
| codex | varsayılan (pratikte kimi-K3) | en kanıtlı coder |
| kilo | OpenRouter kataloğu (Claude, DeepSeek, GPT aileleri) | reviewer için ideal |
| qoder | Qwen | hızlı/plan işleri |
| codex-codefast-glm | GLM 5.3 | PAYG bakiye ister |
| cf-opensource | DeepSeek/Kimi/MiniMax ailesi | PAYG bakiye ister |

Kural (K-0016 R2): reviewer panelinde model çeşitliliği şart — coder ile aynı modeli reviewer yapma.

## 4. Çok-ajanlı iş (2 farklı LLM + N subagent)

- **Doğru kanal: bağımsız Paseo ajanı (create_agent).** Oturumdan bağımsız yaşar, farklı LLM alır, rol prefix'i çalışır, telemetri ayrı düşer.
- Yanlış kanal: oturum-içi spawn_agent — model çeşitlisi veremez, rol güvenliği yok; yalnız aynı-model paralel kod işi için.
- Tarif: her alt iş için ayrı ajan aç → başlığa rol prefix'i → brief'te 4+1 öğe (hedef/çıktı/araç/sınır + kapsam kimliği) → yazma kümeleri çakışmasın (R1).
- Paralellik: 3 rahat, 6 kanıtlı; üstünde plugin "paralellik aşımı" uyarır.

## 5. Otomatik sistemler (sen bir şey yapmadan çalışır)

| Sistem | Ne zaman | Nerede görünür |
|---|---|---|
| Enjeksiyon | her yeni ajan | sözleşme otomatik yüklenir |
| Bekçi | 15 dk'da bir | raporlar/takip-sozlesme/<tarih>.md |
| Pitbull | ajan >15dk sessiz | ajana dürtme mesajı |
| Kalite | tur fail >%10 | ajana ders dürtmesi |
| Sondaj | Pazartesi 09:00 | raporlar/sozlesme-sondaj/<tarih>/ |
| Pano özeti | Pazar 20:00 | raporlar/proje-panosu/ + sohbet özeti |
| Öz-değerlendirme | Pazar 20:00 | raporlar/oz-degerlendirme/ |

## 6. Repo ayarı (.verimlilik/ayar.json — repo başına, opsiyonel)

```json
{ "bekciKapali": false, "enjeksiyonMod": "tam", "pitbullYaziciDk": 15, "pitbullOkuyucuDk": 20, "kapsamEsik": 3 }
```
enjeksiyonMod: "tam" | "isaretci" (kısa işaretçi) | "kapali".

## 7. Sağlık ve sürüm komutları (paseo-plugin reposunda)

- `powershell -ExecutionPolicy Bypass -File scripts\saglik.ps1` — 16 kapı; SONUC satırı OK/EKSIK/SARI
- `scripts\proje-panosu.ps1` — filo panosu (60 repo taranır); `-TestModu` ile öz-test
- `scripts\zincir-kontrol.ps1` — handoff zinciri + sözleşme-notu denetimi
- `scripts\katman-kur.ps1 -RepoKok <yol>` — bir repoya L1/L5 iskeleti kur (idempotent)
- `scripts\kilit-surum.ps1 -Etiket vX.Y -RepoKok <yol>` — kilitli sürüm damgası (rollback noktası)

## 8. Acil durumlar

- **Plugin sapıttı:** `paseo plugin reload paseo-verimlilik` · olmadı: `paseo plugin disable paseo-verimlilik`
- **Rollback:** `git reset --hard vX.Y-kilit` (iki repo için de tag'ler var) → sonra codemap + saglik yeşil olmalı
- **Bekçi gürültüsü:** repo köküne .verimlilik/ayar.json → `{"bekciKapali": true}`
- **Bir repoda sözleşme istenmiyor:** aynı dosyada `{"enjeksiyonMod": "kapali"}`

## 9. İlk hafta ritüeli

1. Yeni repoya `katman-kur.ps1` ile iskelet kur (bir kez)
2. İşi coder'a ver; bitince `[reviewer]` + farklı model ile ikinci göz aç
3. Pazartesi sondaj raporunu, Pazar pano özetini oku (2 dk)
4. Aynı tuzağa iki kez düşerse → DERSLER.md'ye işlendi mi kontrol et; değilse söyle
