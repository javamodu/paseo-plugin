# UYGULAMA PLANI — SPRINT + LOC — 2026-10-26

Kaynak: raporlar/tam-analiz-6-dogrulayici-2026-10-26.md (6 doğrulayıcı turu, (R) kanıtlı). Bu plan REHBER:117 gereği ÖNERİDİR — her sprintin [insan] kapıları ayrı onay ister; ajan yalnız önerir. LOC değerleri (T) tahmindir (sözleşme kuralı: (R) resmî ölçüm, (T) tahmin).

Kapsam kuralı: plugin sunucu kodu v0.22-kilit — Sprint 3'ün tamamı tek [insan] "kilit aç" düdüğüyle başlar (BK-02 örneği: "devam" düdüğüyle tek dal açıldı). Script/doc kalemleri yeni tur ister (yazıcı kendisi o turu koşar, ayrı commit).

## SPRINT 0 — Kayıp/güvenlik kalkanı (hemen; 0 kod LOC)

| Madde | İş | LOC (T) | Kapı |
|---|---|---|---|
| FAZ-4.1 | bench ham verisi (24 koşu/702K + ordu-core.zip 2,1MB) arsiv/'e taşı | 0 (git mv) | [insan] sıra kararı — ertelenemez |
| B-1 | pano-token rotate + git rm (değer c41c75e geçmişinde) | 0 | [insan] YÜKSEK |
| A14-erata | kalıcı-açık defteri "cli'de decide komutu YOK" → "canlı uç kanıtı NOT_RUN" (cli.ts:169-186'da komut VAR) | 0 (doc) | ajan yazar, commit ile |

## SPRINT 1 — Kabul köprüsü: %40,9 → %44 (4 puan; ~80 LOC)

| Madde | İş | LOC (T) | Kapı |
|---|---|---|---|
| F7-B | kapsam flip K kaydı (emsal: V3-S1.1 gerçek local-runtime zaten PASS) | 0 (K kaydı) | [insan] |
| A14+A10 | canlı decide zinciri koşumu: `cli decide --run` canlı uçtan, makbuz kanalıyla | test ~60 (mevcut kod +~0) | [insan] onayıyla ajan koşar |
| M17 | kapsam kararı (V3-S4.4 şeridi) | 0 veya özellik ~120 | [insan] |
| 6/6 N5/N5-2 | gözlemci turu — kullanıcının bağımsız oturumu | 0 | KULLANICI |

## SPRINT 2 — Script hijyen dalgası (yeni tur; ~50 LOC, 6 açık kalem)

| Madde | İş | LOC (T) |
|---|---|---|
| A5-10 | codemap.ps1 param bloğuna `TrimEnd('\','/')` normalizasyonu | 1 |
| A5-11 | codemap.ps1:72 BOM'suz yazım (UTF8Encoding $false) — A1-8 md hizalamasıyla birlikte karar | 2 |
| A5-12 | yonetici-ozeti.ps1 uzanti filtresi (binary dışla) | 6 |
| A5-13 | yonetici-ozeti.ps1 :15 SilentlyContinue kaldır + :89-90 try/catch | 15 |
| A5-9 | kilit-surum.ps1 / proje-panosu.ps1 / bekci.ts:109 tek kirli-ağaç filtresi (ortak liste) | ~12 (script tarafı; bekci tarafı Sprint 3'e düşer) |
| D2-21 | zincir-kontrol.ps1 exit 1 / ayrık bayrak | 2 |
| K-0048 (i) | CODEMAP kapsam daraltma — saglik EKSİK'lerinden birini keser | ~10 |
| A14-erata / D2-26 | DERSLER tarih öneki normalizasyonu (doc) | 0 |
| **Toplam** | | **~48** |

## SPRINT 3 — Plugin v0.23 dalgası (tek [insan] "kilit aç" düdüğü; net ~+500 LOC, çoğu test)

| Madde | İş | Kod (T) | Test (T) |
|---|---|---|---|
| A2-10 | panoIsaretciYaz tmp+rename atomik + başlık toleransı | 15 | 30 |
| A2-11 | Buffer.subarray ile byte-hizalı slice | 5 | 10 |
| A2-12 | onboarding.ts ölü dal silme | -10 | — |
| A2-9 | kabul-bloğu turnId dedupe (index.server.ts:178-183) | 25 | 40 |
| A6-4 | client/web.ts ölü modül silme | -12 | — |
| A6-3 | degerlendirme.tsx refetchInterval 10_000 | 1 | — |
| A3-9/D2-11 | permission/rol async sarmalayıcı testleri (permission.ts:63,94; roller.ts:120) | — | 120 |
| A3-10 | bekci pencere-kayması testi (25 turlu fixture; DERSLER 172 kökü) | — | 60 |
| A3-11 | isoHafta yıl-sınırı (2026-01-01=W01) + bozuk jsonl satır testi | — | 50 |
| A3-12 | dedektor.test.ts:542 gevşek includes → regex assert | 2 | 3 |
| A4-2/A4-3 | rollup damga tek-tip + ortTurSn n= dipnotu | 10 | 15 |
| D2-18 | ayar.ts cache LRU/evict (tavan ~100 cwd) | 25 | 30 |
| D2-20 | modelDeseni desen-uzunluk tavi + derleme cache | 20 | 25 |
| D2-24 | dedektor.test.ts bölme (1233 satır → konu-dosyaları) | 0 (refactor) | 0 |
| Sürüm | package.json 0.23.0 + v0.23-kilit (K kaydı + tag + doctor) | 2 | — |
| **Toplam** | | **+83 / -22** | **~383** |

## SPRINT 4 — Canlı kas (START sonrası; K3 penceresi; (T) geniş bant)

| Madde | İş | LOC (T) |
|---|---|---|
| M02 | Paseo adaptör wire — gerçek kapsül yaratma, outbox akışı | 150-400 |
| Scheduler | tick döngüsü / daemon sürücüsü (schedule.ts mantığı zaten testli) | 100-200 |
| K12-01..14 | çok-ajan senaryoları (koşum + kanıt, kod çoğunlukla mevcut) | test/koşum ~200 |
| K13-01..04 | savaş senaryoları (5-LLM turnuvası, gece kesinti, izolasyon) | koşum ~150 |
| F6.5 | 2-provider canlı spawn (registry genişletmesi) | ~60 |
| Bildirim | gerçek sender ucu (outbox zaten sağlam) | ~80 |

## Sprint LOC özeti (T)

| Sprint | Net kod | Test | Kapı |
|---|---|---|---|
| 0 | 0 | 0 | [insan] ×2 + erata |
| 1 | ~+60 | ~60 | [insan] |
| 2 | ~+48 | — | yeni tur |
| 3 | +83 / -22 | ~383 | [insan] kilit aç |
| 4 | 590-1090 | ~350+ | START |
| **Toplam** | **~800-1300** | **~800** | |

## Sıra bağımlılıkları

Sprint 0 → 1 → (START) → 4; Sprint 2 ve 3 bağımsız paralel yürüyebilir (2 = ajan turu, 3 = [insan] kilit düdüğü sonrası). Sprint 3'ün A3-10'u DERSLER 172 kök-onarımını test korumasına alar — telemetri-fail sağırlığının kod düzeltmesi de aynı düdükle kuyruğa girer (bekci.ts:52 filtre + pencere tarih damgası, ~15 LOC + test).

## Ölçüler (sözleşme disiplini)

- Her sprint kapanışı: kanal koşumu (`scripts\test-kanal.ps1`) → son-kanit birebir → defter → commit (K-0046 e/f)
- Sprint 3: kilit döngüsü K-0007 (tag + manifest + doctor 0 EKSIK)
- Kabul ölçüsü: %44 alarm eşiği Sprint 1 sonunda ölçülür; Sprint 4 K3 36 satırın kapanış hızısı tek düdükle değil, kanal kanalıyla

---

Damga (R): 2026-10-26 05:45 (Get-Date ile ölçüldü), ajan = yazıcı sentez (Claude glm-5.3, ordu), durum = ÖNERİ — [insan] onayı bekler (REHBER:117). Kardeş dosya: raporlar/tam-analiz-6-dogrulayici-2026-10-26.md.
