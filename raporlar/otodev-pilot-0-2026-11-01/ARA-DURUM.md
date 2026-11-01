# OTODEV pilot-0 — ARA DURUM (ilk koşu + gerçek 429 uçuşu)

**Damga:** 2026-11-01 17:27 (ölçüldü). Hasat cron'u 17:52'de tam tabloyu OZET.md'ye yazar; bu dosya kalıcı bulgu kaydıdır.

## Koşu #1 zaman çizelgesi (schedule 3b6cd207, run 159174b3, ajan 2df1e48)

| Saat | Olay | Kaynak |
|---|---|---|
| 17:17:31 | Ajan doğdu (schedule'dan, glm53u-codex/glm-5.3, thinking max, mode full-access) | get_agent_status |
| — | Enjeksiyon ÇİFT: v2.1 (22 kural, dinamik — son devir 1658 gösteriyor) + ÜSTÜNE depolanmış v2.0 (~47 kural, bayat işaretçi 10-31-2002) | get_agent_status → systemPrompt |
| 17:18:45 | Kira alındı: nobet-ajan-21180, sinif nobet, pid 21180 | kira-log ilk-kira |
| 17:23:41 | **Ajan ÖLDÜ: "exceeded retry limit, last status: 429 Too Many Requests"** — gerçek 429 fırtınası | lastError |
| 17:23:41.633 | **Kalkan defteri YAKALADI: `plugin/data/429-defter.jsonl` ilk canlı kayıt** (hataSinifi http-429, tip 429, agentId/workspaceId/provider; sır YOK) | defter okundu |
| — | **Handoff YAZILAMADI** — devir, ajanla birlikte öldü; kira sahipsiz kaldı (pid 21180 = daemon yaşıyor) | plans/handoff/ değişmedi |

## Bulgular (dürüst, pilot-0'nın işi tam da bu)

- **F1 — gerçek 429 tur-içi ölüm:** kalkan gözlem+spawn kapısıdır, tur içi kalkan DEĞİL. Nöbet ajanı devir yazarken 429'dan öldü. PK-c dirilme (12 dk, ~17:35:41) KAPALI ajana yetişemez (aynı anda closed). → dirilme-kapalı-yarışı + "nobet ajanı 429'a öncelikli dayanıklı uçta doğsun" düzeltme adayları.
- **F2 — çift enjeksiyon:** schedule config'i systemPrompt'u YARATILMA ANINDA snapshot'lar (v2.0); ateş anında canlı enjeksiyon (v2.1) de geliyor → ajan ikisini birden taşıdı (~84 kural, çelişen bayat işaretçiler). → schedule stored-prompt temizliği veya plugin tarafında dedupe (v0.24 penceresi değerlendirmesi).
- **F3 — kira pid semantiği tuzağı:** ajan kira sahibi pid olarak DAEMON pid'ini geçti (koordinatör talimatı!) → ajan ölünce kira "bayat-canli" görünür (pid yaşıyor) → devir TETİKLENMEZ. Kalan koşular (17:37/17:47) sessiz çıkış bekleniyor; pilot 0 handoff'la bitme riski. → kira sahibi ajan-ömürlü bağlanmalı (kira-birak finally bloğu / kendi session pid'i / devirSinifi-kuralı).
- **F4 — zincir kapısı test edilemedi** (0 devir olayı).

## Kalan plan

Koşular 17:27 (sessiz — kira taze 17:33:45'e dek), 17:37 + 17:47 (bayat-canli → sessiz bekleniyor). Hasat 17:52: koşu tablosu + ölçüm + OZET.md + STATE damga. Düzeltme adayları (F1-F3) ayrı iş kalemleri — pilot bitince değerlendirilir.

## Ek ölçümler (17:30-17:34 arası)

- **Run #2 BAŞARILI — sessiz yol kanıtlandı:** 17:27:01→17:29:47 (2dk46sn), çıktı tek satır "kira taze — nöbet sessiz", yazma 0 (schedule koşu geçmişi: status succeeded, ajan 2127c899).
- **Kira operatör temizliği:** ölü ajanın terk lease'i 17:30:39'da bırakıldı (kiraBirak, kimlik nobet-ajan-21180) → durum `birakildi` exit 2 → run #3 (17:37) devir yazma yolunda.
- **Sağlayıcı direktifi uygulandı:** schedule 3b6cd207 `glm53u-codex` → `glm53u-claude`/glm-5.3 (Claude Code motoru, sınırsız uç; operatör emri "ajanlar glm 5.3 claudecode sınırsız kullanmalı" — hafızada).

## ÖLÇÜM SAHİPLİĞİ (operatör emri 17:34: "devirden itibaren her şeyi izle, rapor tut — kim tutacak?")

**3 katmanlı cevap (ideal çalışma):**
1. **Mekanik rollup (LLM'siz)** — YENİ İŞ KALEMİ: `pano/devir-olcum.mjs` — kira-log + plans/handoff/ dosya meta + Paseo koşu geçmişinden haftalık devir raporu (JSONL→OZET.md): koşu başına sonuç (devir/sessiz/RED), süre, handoff adı, echo doluluk, başarılı-devir oranı. Telemetri-haftalik deseninin kardeşi.
2. **Nöbet ajanı** koşu kapanış raporu (pilot prompt'unda zaten: devir süresi + handoff adı + echo 3 cevap).
3. **Koordinatör** bağımsız doğrulama + STATE damga; **insan (operatör)** hedef eşikleri koyar.

**Eksikler (iş kuyruğuna):** (a) devir-olcum.mjs rollup script'i; (b) sayısal hedef karar kaydı (örn. devir ≤10 dk, başarılı-devir ≥%90, çift-yazar 0, kapı ihlali 0); (c) ajan-başı "ne yaptı" faaliyet özeti (Paseo agent timeline'dan — get_agent_activity mevcut); (d) **DASHBOARD (operatör direktifi 17:35: "ilk andan devir anına kadar tüm metrikler dashboard üzerinden ölçmeliyiz")** — metrik hattı pano 4377 yüzüne devir/metrik kartı olarak bağlanır; 4377 şu an ÖLÜ, restart [insan] kapısında.
