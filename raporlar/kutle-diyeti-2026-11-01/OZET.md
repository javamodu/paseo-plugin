# Kütle Diyeti — KD-a Çekirdek v2.1 (2026-11-01)

- **Durum: TAMAM (yerel).** Kod `f811936` · damga `704c9ef` · tag `v0.24-kilit` (704c9ef) · kayıt commit'i bu dosyayla.
- Emir: "en doğru olanı sıraya koy tamamla" (2026-11-01). Plan: `plans/KUTLE-DIYETI-PLANI-2026-11-01.md` (KD-1).
- Yürüten: opencode oturumu (glm53u-claude sağlayıcısı 403/401 verdiği için iş ajana dispatch EDİLMEDİ).

## Ölçüm (gerçek çıktı)

| Ölçüt | Önce (v2.0) | Sonra (v2.1) | Hedef | Sonuç |
|---|---|---|---|---|
| ÇEKİRDEK bayt (UTF-8) | 5417 | **3693** | ≤3791 (%70) | TUTTU — %68,2 |
| ÇEKİRDEK kural | 31 | **22** | ≤22 | TUTTU |
| Toplam kural (çekirdek+proje) | 47 | **38** | ≤38 | TUTTU (22+16) |
| `cekirdek.ts` satır | 63 | **43** | — | -20 |
| Test dosyası | 9 | **10** | +1 hedefli | EKLENDİ |
| `npm test` | 446 ok / EXIT=0 | 446 ok + 18 assert / EXIT=0 | yeşil | TUTTU |
| `tsc --noEmit` | EXIT=0 | EXIT=0 | yeşil | TUTTU |

Ölçüm yöntemi: `kuralSayisi()` (satır başı `\d+.` / `-` / `*` / `A1.`), `Buffer.byteLength(metin, "utf8")`. Taban = v2.0 canlı metin (5417 B / 31 kural); proje kuralları = ANAYASA 13 + AGENTS 3 = 16.

## Ne değişti

- Metin kaynağı v2.0 → **v2.1** (tarih damgası 2026-11-01); v2.0 arşiv işaretçisi (`REHBERI-v2.0.md`) düzeltildi.
- Altın kurallar 6 → 3 (okuma / dürüstlük+kanıt / karar), bağlam 3 → 2, disiplin 6 → 5 ([insan] kapıları tek satırda fail-closed).
- Dosya-tabanlı hafıza tablosu tek paragrafa indirildi (L0..L5 bilgisi korunarak).
- Devir töreni **7 madde aynen korundu** (handoff · işaretçi · zincir · echo 3 soru · gelen-kutu tara · gelen-kutu yaz · 7. Append-only).
- Yeni hedefli test: `plugin/test/cekirdek-diyet.test.ts` (18 assert: bayt ≤%70, çekirdek ≤22, toplam ≤38, v2.1 damgası, kritik bölümler, `5. Append-only:` yasağı, sıra 6→7, enjeksiyon 20KB bütçesi).

## Ne değişmedi (davranış garantisi)

Echo borcu, gelen-kutu çifti (`md`+`json`, `islenme:null`), append-only, EK-1..5, [insan] kapıları ve altın kural özü korundu. Mevcut 9 test dosyası **aynı 446 assert** ile yeşil — enjeksiyon davranışı değişmedi.

## Kanıt (komut → çıktı)

```
cd plugin; npm test              -> EXIT=0 (10 dosya; 446 ok + cekirdek-diyet.test.ts OK)
cd plugin; npm run typecheck     -> EXIT=0
cd plugin; npx tsx test/dedektor.test.ts -> EXIT=0 (drift bekçisi: v0.24-kilit)
```

## Dürüst sınırlar

1. **Canlı senkron YOK.** Dosya değişti; çalışan daemon eski worker'ı kullanır. `paseo plugin reload` = **KD-c [insan]** (aktif 4377/4930 oturumlarını etkiler, zamanı operatör seçer).
2. **Kilit elle atıldı.** `scripts/kilit-surum.ps1` çift-ev varsayımı + kirli ağaç reddi nedeniyle koşmadı (v0.23 emsali); doctor kapıları gerçek test/typecheck ile doğrulandı.
3. **OTODEV otomatik devri hâlâ kurulu değil.** Nobet schedule + kira dosyası yok; `glm53u-claude` `/v1/messages` 403→401 arızası ajan devrini sessizce düşürdü. A2 pilotu ayrı dalga (çalışan sağlayıcı + disk kapısı; diskC %9,9 → geçici `maxRuns`).
4. `plugin/node_modules` dokunulmadı; v0.23 kilidi ve tag'i değişmedi.
5. **Push YOK.** Yerel commit birikimi 15 → **19** (bu kayıt commit'i dahil); K7 ayrı [insan] emri.

## Sonraki adım (sıralı)

1. [insan] KD-c: `paseo plugin reload paseo-verimlilik` — canlı senkron.
2. OTODEV A2: nobet schedule + kira (çalışan sağlayıcı şartı; önce disk kapısı).
3. PK-a: 429 telemetri hattı (plan `38d450a`).
