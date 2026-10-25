# SAVAŞA HAZIR PLAN — 2026-10-25 18:50 (devir taraması çıktısı)

Girdi: `raporlar/devir-tarama-6subagent-2026-10-25/OZET.md` (V-01..V-17) + denetim-6subagent 20 madde. Kural: hiçbir adım onaysız başlamaz; her iş = dosya-bazlı commit + kapı doğrulaması; `BAŞLA` onayıyla FAZ-1 açılır.

## FAZ-1 — Fake-green/pano tamiri (denetim B, V-01..V-03, V-13)

| # | İş | Dosya:satır | Commit planı | Kapı |
|---|---|---|---|---|
| 1.1 | cache-hit normalizasyonu: `if ($pct -gt 100) { $pct = 100 * $pct / (100 + $pct) }` + `elseif` dalına SARI satır "N kayıt normalize — plugin inputTokens semantiği" | saglik.ps1:104,113-115 | tek commit | telemetri.jsonl:769 (2253.1→%95,7) kağıt doğrulaması + birim kayıt örneği |
| 1.2 | kabul-oranı kapısını gerçek deftere bağla: `$kDefter = Import-Csv (Find-First $Root @('plans\kabul.csv','kabul.csv'))`; yeşil = PASS+GECTI+GECTI_CANLI (GECTI_HERMETIC ayrı SARI satır: 43) | saglik.ps1:120-121 | ayrı commit (aynı dosya) | JSONL'li koşuda "27/115" görünmeli; kapı kırmızıya dönmeli (bilinçli kırmızı — fail-closed) |
| 1.3 | Kök onarım: paydayı `inputTokens + cachedInputTokens` yap | plugin/server/telemetry.ts:292-294 | plugin commit | `npm test` 387 ok EXIT=0 |
| 1.4 | B20: kod varsayılanı `D:\Vibecode\ordu\pano` | plugin/server/pano.ts:46 | plugin commit | restart **child-kill** (~30 sn, kullanıcı pencere onayı; DERSLER 131) → yeni log `ui: D:\Vibecode\ordu\pano`, `/api/durum uiVar:true` |
| 1.5 | live-gates-v4: önce tek başına koş → yeşilse core/package.json:11'e ekle, kırmızıysa karar raporu (v3'e mi kalır) | core/package.json:11 | core commit | v4 EXIT kodu kayda geçer |
| 1.6 | Eşik kararı: cacheHitMinPct 40 mü 60 mı → **K-0040 kaydı** (V-03) | hedefler.json:8 + kararlar/ | K kaydı | STATE atıf |

Not 1.2: kapı kırmızıya dönerken "SAVAŞA HAZIR" kapanış hedefi **kırmızının görünmesi** — dürüst defter. NOT_RUN azaltma turu FAZ-3'te.
Not 1.4: env yolu (PANO_UI_DIR setx) seçilirse pencere **tam restart**a büyür (V-07/N7); kod varsayılanı tercih sebebi.

## FAZ-2 — Doküman/atık temizliği (denetim C/D/E, V-06, V-09..V-12, V-15, V-16)

Sıra (dosya başına 1 commit; STATE önce — kendiyle çelişiyor):
1. STATE_BOARD.md bekleyen-onaylar tazelemesi (V-15 — bu turda zaten işlendi, doğrulanır)
2. core/KULLANIM.md:4,86 (eski kök + kabul.csv yolu)
3. README.md:1 + monorepo bileşen satırı
4. admin-onboarding.md:85,96
5. pano/README.md:1,21 + pano/BLUEPRINT.md:4 (B20 doküman ayağı)
6. FERMANLAR.md:20 · plans/PLAN.md:6 · PASEO-VERIMLILIK-PLANI.md v2.1 senkron (V-06)
7. plugin/package.json manifest satırları (V-12) + web.ts silme (V-10)
8. ajanTemizle merkezileştirme (V-09 — en geniş, en son; npm test kapısı)
9. K-0029 (aday statüsü, 13+ atıfın yönlendirilmesi) + K-0036 (ücretli-yok politikası) kayıtları — **kullanıcı onayı**
10. ANAYASA A4 "v2.1" + başlık "ordu" — **K kaydı + kullanıcı onayı (ANAYASA ajan değiştiremez)**
11. Son adım: `scripts\codemap.ps1` + `scripts\saglik.ps1` (E1-E3 kendiliğinden kapanır)

## FAZ-3 — EK-4 baseline + "SAVAŞA HAZIR" raporu

- EK-4 onboarding checklist: SSOT oku ✓ (bu devir) · git log+status ✓ · handoff echo ✓ · CODEMAP taze · DERSLER açıldı ✓ · **test baseline (R): plugin 387 ok EXIT=0** · ilk damga.
- Dürüst defter turu: kabul.csv NOT_RUN (38) için canlı-kanıt turu — her GECTI_HERMETIK maddesi ya canlı koşumla PASS'e ya kalıcı-açık listesine (hedef: canlı oran %23,5 → alarm eşiği 44'ün üstü).
- "SAVAŞA HAZIR" kapanış raporu: saglik çıktısının EKSIK satırları görünür okunur (`*> $null` YASAK — DERSLER:36); kırmızı kapılar dürüst kırmızı olarak listelenir.

## FAZ-4 — SAVAŞ (F4) — eski evlerin silinmesi (kullanıcı sıra kararı: savaş sonrası)

Önkoşullar (denetim A-1..A-3, hepsi F4'ten ÖNCE):
1. Ham bench verisi taşıma: `silinecek-task-graph/benchmark/glm53-wrapper/runs/` (24 koşu, 702K) + `.bench-data/` (4 dizin) + `ordu-core.zip` (2.1MB) → `arsiv/` (F4 silmeden ÖNCE — kalıcı kayıp engeli).
2. K-0029/K-0036 kayıtları (FAZ-2.9).
3. Karar C penceresi: kart anahtarları env'e (tam restart) **veya** yerel-kabul K kaydı — silinecek dosyada anahtar kalmasın.
4. Silme: paseo-plugin (eski konum, donduruldu) · silinecek-task-graph (versiyonsuz!) · paseo-pano (eski UI evi; B20 kod varsayılanı FAZ-1.4'te kesmiş olacak).

## Yeni karar kayıtları kuyruğu (kullanıcı onayı bekler)
- **K-0040** cacheHitMinPct eşik (40/60) · **K-0041** K-0029 geriye dönük aday kaydı · **K-0042** K-0036 ücretli-yok politikası · **K-0043** ANAYASA A4+başlık · **K-0044** (opsiyonel) karar C env/yerel-kabul · **K-0045** (opsiyonel) B17 pano-token yerel-özel kabulü.

## Riskler / bilinçli kırmızılar
- FAZ-1.2 sonrası saglik kabul kapısı **bilinçli kırmızı** (gerçek %23,5 < alarm 44) — kapanış ölçütü görünür kırmızı, maskelenmiş yeşil değil.
- restart pencerelerinde koşan ajan turları düşer; pencere öncesi `list_agents` meşgul-yok kontrolü.
- live-gates-v4 kırmızı çıkabilir — o durumda eklemek değil karar vermek.
