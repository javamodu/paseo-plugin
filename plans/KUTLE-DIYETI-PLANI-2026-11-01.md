# KÜTLE DİYETİ PLANI (KD-1) — ENJEKTE ÇEKİRDEK 47→38 + MCP FİLTRESİ (2026-11-01)

**Kimlik:** KD-1. **Kaynak:** kullanıcı emri **«kütle diyeti başla»** (bu sohbet; [insan] kapısı açıldı). Kök: [otonom sentez](../raporlar/otonom-analiz-sentez-2026-11-01/OZET.md) yol haritası madde 1 («öncü — her oturuma anında yarar, risksiz»).

## Doğrulanmış olgular (06:18 ölçüldü)

- `plugin/paseo-plugin.json`: id `paseo-verimlilik` · requirements `paseo>=0.11.2` · sürüm kilit disiplini `surumler/v0.23` (kayıtlı kilit).
- `plugin/server/cekirdek.ts` → `CEKIRDEK` sabiti = **canlıya enjekte edilen metnin kaynağı** (v2.0, ~47 kurallı; bu koordinatör oturumunun promptundaki metinle birebir doğrulandı).
- Repo SSOT: `sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md` + **K-0052** (K-SADE: kural sayacı 80→38 — repo tarafı TAMAM). **Canlı enjeksiyon eski metni basıyor → senkron eksik.**
- MCP: 61 araç tanımı her oturuma iniyor; kullanım ordu ölçümü 92/8708 = **%1,1** (~13 tanım).
- Plugin API dokümanı: `kanit/02-plugin-api.md` (KD-b araştırma kaynağı).

## Hedef (ölçülebilir)

| Ölçüm | Önce | Hedef |
|---|---|---|
| Enjekte ÇEKİRDEK kural sayısı | ~47 | **≤38** |
| Enjekte ÇEKİRDEK boyut (bayt/satır) | ölçülecek | **≤%70'ü** |
| MCP tanım sayısı (oturum başına) | 61 | **~13** (workspace bazlı) |
| Yan etki | — | davranış DEĞİŞMEZ (yalnız hacim küçülür); plugin test süiti yeşil kalır |

## Aşamalar

- **KD-a — ÇEKİRDEK diyeti (yazıcı dalgası):** `plugin/server/cekirdek.ts` CEKIRDEK sabiti, rehber **v2.1 çekirdeğinden türetilen** ≤38-kurallı metinle yenilenir (tek kaynak v2.1; çift-doğru-kaynak notu: cekirdek.ts kopya — senkron bu dalganın ta kendisi). Başlıkta sürüm etiketi v2.1 + damga. Eski v2.0 metni arşiv disiplinine uyar (surumler/v0.23 kaydında zaten kilitli — silme/ezme yok, yalnız kaynaktaki sabit yenilenir). Test: mevcut plugin süiti (npm test) + cekirdek sabiti için yeni hedefli test (kural sayısı ≤38 sayaç + kritik bölüm varlıkları: altın kurallar/echo borcu/[insan] kapıları/eğik-pozlama YOK).
- **KD-b — MCP exposure filtresi (ayrı bacak; API araştırması gerekir):** plugin server'da workspace bazlı tanım filtresi (61→kullanılan ~13). Kaynak: `kanit/02-plugin-api.md` + mevcut server modülleri. Araştırma raporu önce yazılır (uygulanabilirlik + mekanizma), sonra kod.
- **KD-c — Canlı senkron + daemon reload [insan]:** canlı yükleme yolu doğrulanır (daemon yapılandırması — **değerler raporlara YAZMAZ**) → v0.24 kurulur → **daemon reload** (aktif ajan oturumlarını etkiler → zamanı OPERATÖR seçer; tek [insan] kapısı) → canlıda yeniden ölç: kuralToplam + yeni oturum prompt boyutu → kanıt raporuna.

## Sürüm disiplini

Yeni sürüm **v0.24** (surumler/v0.24/kilit.json + KILIT.md — önceki sürüm desenine birebir). Kilitli v0.23 DOKUNULMAZ (yeni sürüm = kilit ihlali değil, kilit disiplininin uygulanışı). `plugin/node_modules` DOKUNULMAZ. Kural-sayısı bütçesi ÇEKİRDEK metninde zaten yazar (<40 hedef) — diet kendi bütçesine uymayı sağlar.

## Sınırlar + dürüst notlar

- OTODEV yazıcısı pano/'da açık → **KD yazıcısı ONDAN SONRA** dispatch (tek-yazıcı disiplini, 429/CPU tavanı).
- KD-b uygulanabilirliği ÖNCEDEN bilinmiyor (plugin API yüzeyine bağlı) — araştırma önce, taahhüt sonra; uygulanamazsa dürüst rapor + KD-a tek başına değer üretir.
- Daemon reload kesintisi: heartbeat K0057 + nöbet spawn'ları kısa süre etkilenir; kira/deney sunucuları (4377/4930) etkilenMEZ (ayrı süreçler).
- Ölçüm kanıtı: before/after (bayt + kural sayısı + tanım sayısı) → `raporlar/kutle-diyeti-2026-11-01/OZET.md` + .json.

**Yürütme:** emir verildi («kütle diyeti başla») — OTODEV yazıcısı kapanınca KD-a yazıcısı dispatch edilir; KD-c reload yine [insan] düdüğü ister. Bu plan YERELDİR — push ayrı emir (K7).
