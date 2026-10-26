# KAPSÜL TUVAL UI — UYGULAMA PLANI (2026-10-26)

> Amaç: görev-listesi · graf-tuvali · chat · yapay-zeka katmanını TEK ekranda; hem insan-okur hem makine-okur, **reactflow'suz, en basit etkin yol**. Kaynak istem: sürükle-bırak + edit + manuel/ajAN ortak yönetim + çapraz ilişki matrisi.
> Zemin: gorev-grafigi-2026-10-26.json **v5** (kadro + A0-5 + S5/S6; 24 düğüm, 29 kenar) + mockup **D-0 KAPALI** (330 ham satır (R; V7 düzeltmesi +1), 0 bağımlılık).

## MİMARİ KARAR (reactflow'suz)

1. **Tek doğru-kaynak:** `plans/gorev-grafigi-2026-10-26.json`. MD (senaryo + kapsül kartları) insan yüzü; UI yalnız **render + yazma ucu**. Edit (insan veya ajan) hep JSON'a yazar; MD'ler ve tuval JSON'dan yeniden üretilir. Çelişki imkânsız: tek yazıcı yolu.
2. **Sürükle-bırak = vanilla SVG + Pointer Events** (pointerdown/move/up → düğüm x/y → JSON kaydet). ~90-110 LOC. Reactflow getirdiği tek şey bu + kenar sürükleme; 1200+ LOC'a değmez.
3. **Çapraz ilişki matrisi:** her varlık kimlik taşır (görev id · düğüm id · chat mesajı → gorevId · kanıt kaydı → gorevId). Birine tıkla → diğer üç yüzde aynı id vurgulanır + sağ-panelde o varlığın kayıt zinciri (provenance) açılır.
4. **AI edit kapısı:** ajan UI'ye değil JSON taslağına yazar → [insan] diff önizleme → onay → tek yazıcı ucu uygular. Ölçüt/hedef alanları kilitli (sözleşme: hedef DOKUNULMAZ). **KT-04 kuralı (b8 incelemesi):** yazma ucu ajan-aktörlü DOĞRUDAN çağrıyı RED eder (yalnız taslak yolu geçerli; negatif testli) — "insan veya ajan JSON'a yazar" ifadesindeki ajan yolu daima *taslaktır*, asla doğrudan `POST /api/graf/yaz` değildir.

## DALGALAR — hedef · insan-okur TEST · somut çıktı (rev. ~17:20 — 10-subagent uçtan-uca denetim SONRASI)

Kural: her dalga öncekinin **üstüne** inşa edilir; kapanış şartı **tam süit x=0 + kanıt-üçleme (d·h·x) + yeni kabul satırı + [insan] ELLE TEST** — yarım dalga devrolmaz, önce kapanır. Dalga tavanı 500 LOC; aşma riski görünürse bölünür (replan kuralı). Her dalganın testi **sizin ellerinizle, dakikalar içinde** yapılır ve **diskteki somut dosyaya** bakar. **Kabul satırları (KT-05):** dalga ID'leriyle (`D-1a`..`D-4`) kabul.csv'ye yeni satır olarak açılır (K-0046: epoch sonrası ekleme meşru; mevcut kapı satırları ezilmez).

> V2 bulgusu (dürüst sayı): plan (T) değerleri gerçeğe göre ~%20-25 iyimser kalabiliyor (emsal: F9 dalgası plan +%28 şişti) → aşağıdaki üretim sayıları bu yastıkla yazıldı; kapanışta (R) kanal ölçümü geri döner.

| Dalga | HEDEF (tek cümle) | İNSAN-OKUR TEST (siz yaparsınız) | SOMUT ÇIKTI (diskte) | Kod+Test (T) | Kapı |
|---|---|---|---|---|---|
| **D-0** ✅ | Ortak anlayış: 3 panel · 3 yüz · kadro mockup'ı | tarayıcıda açın: sol akordiyon · orta tuval · sağ chat · 3 mod düğmesi · kadro kartları (~5 dk) | `pano/kapsul-tuval-mockup-2026-10-26.html` — **330 ham satır (R; V7 düzeltmesi +1)** | 330 (R) | — |
| **D-1a** "masaüstü çekirdeği" | Paseo KAPALI, çift tıkla yerel projede kendi görev grafiğinizi görün | `pano\yerel-masaustu.bat` çift tık → tarayıcı ≤5 sn açılır → **24 görev** görünür → İNSAN OKUR/MAKİNE OKUR düğmeleri **aynı 24 düğümü** gösterir (JSON'u elle sayıp karşılaştır, ~5 dk) | `pano/yerel-masaustu.bat`+`.ps1` (ASCII; port-probe + kapat-kancası) · `pano/server.js`'e `/tuval`+`/api/graf` · `pano/kapsul-tuval.html` (üretim çekirdeği: fetch+render+2 yüz) · kanıt: d1a raporu + son-kanit.json + kabul satırı | **~395** (305+90) | "D-1a aç" teyidi |
| **D-1b** "kapsüller kartlaşır + vurgu" (eski D-2 KATLANDI — V10) | Her görev kapsül kartı olur; tıkla → MD diskte doğar; yüzeyler arası tık vurgusu çalışır | bir göreve tıklayın → `plans\kapsuller\<ID>.md` belirir → Not Defteri'yle açın, JSON'daki aynı görevle **birebir** karşılaştırın — hedef+ölçüt+dizin+bütçe+deadline+kadro **8-eksen eksiksiz** (KT-08; yalnız id/başlık değil), ~5 dk; sunucuyu kapatın → **kırmızı yüz** (fail-closed) | `plans/kapsuller/*.md` (24 kart) · kart üretici uç (**mevcut MD'yi EZMEZ** — yazar kaydı) · çapraz-vurgu çekirdeği · fail-closed kırmızı yüzü · kanıt: d1b raporu + kabul satırı | **~260** (180+80) | ilk kart yazımı (1 kez) |
| **D-2** "izleme canlılaşır" (eski D-3; **ertelenebilir**) | Koşum, ekrandan insan-okur sohbet olarak akar | **"S1 koş"** düdüğü verin → ekranda dispatch → coder → tester → ACCEPTED zinciri canlı akar → insan kartı düğmeleri PASİF kalır (~10 dk) | notify.jsonl→SSE köprüsü · mesaj→görev bağlama · SENT-satırı kör-nokta lookup · kanıt: d2 raporu (mesaj ↔ defter olay-id eşlemesi) + kabul satırı | **~480** (400+80) | canlı izleme teyidi |
| **D-3** "elinize düzenleme gücü" (eski D-4) | Grafı elle şekillendirin: sürükle · kenar · görev ekle | bir düğümü sürükleyin → pencereyi kapatıp açın → **konum aynı** (~3 dk); yeni görev ekleyin → sol tablo + tuval + JSON + MD **dördünde de aynı satır** (~5 dk) | `POST /api/graf/yaz` (TEK yazıcı ucu: **PANO_TOKEN fail-closed + fsync + sürüm-guard** — bayat grafSurumu RED) · grafSurumu v(n+1) kayıtları · kanıt: d3 raporu + kabul satırı | **~500** (380+100) — **tavanda**; aşarsa bölünür | ilk edit-yazım (1 kez) |
| **D-4** "yapay-zeka edit kapısı" (eski D-5) | AI grafı düzenler ama ölçüt/hedef kilitli, onay sizde | AI'dan görev taslağı isteyin → **diff önizleme** görün → onaylayın → uygulanır; ölçüt alanını değiştirme denemesi **kırmızı** (~10 dk) | taslak→diff→onay→uygula akışı · kilit negatif testleri · provenance paneli · kanıt: d4 raporu (kilit RED + onaysız uygulama RED) + kabul satırı | **~410** (330+80) | her AI-diff (kalıcı) |
**V10 katlama (bu rev.):** eski D-2 dalgası KALDIRILDI — kart üretici ucu (~70) D-1b'ye, çapraz-vurgu (~80) D-1b/D-3'e kaydı → **~1 dalga tasarruf**. Eski D-3/D-4/D-5 dalga numaraları bir kaydı (D-2/D-3/D-4).
**D-2 sıralama kuralı (V10):** "S1 koş" düdüğü yakınsa → D-1b → D-2 → D-3/D-4; değilse D-2 SONA ertelenebilir (değeri canlı koşum izlemesinde somutlaşır; dosya-bazlı yüzler onu beklemez).
**Bilinçli kapsam-dışı (V10 beyanı):** Karar kutusu / replan-tıkanma olaylarının UI yüzü (grafSurumGecmisi + simulasyon tıkanma kayıtları ekranda) bu planın DIŞINDA — veri zaten `raporlar/simulasyon/*.json`'da makine-okur duruyor; istenirse D-3'e ~60-100 LOC'lik yüz eklenir (yeni dalga değil, dalga-içi artış kuralıyla).

**Kılıç bağlantısı:** D-1a..D-4 tümü **V-3 (ajan-sürüsü verimlilik sözleşmesi)** dikey hedefine bağlanır; tuval repo-agnostik olduğundan V-1 (AI-video/Remotion) ve V-2 (AI web-site) projelerinde aynı dalga yapısı kurulabilir (graf JSON'u repo başına).
**Süre:** dalga başına ~0,5 gün ajan → 5 dalga ≈ **2-2,5 gün**; insan test toplamı **~35-45 dk**.

## TOPLAM (net, rev. ~17:20)

| | LOC |
|---|---|
| D-0 mockup (yazıldı) | **330 ham** (R — disk ölçümü, V7 düzeltmesi sonrası) |
| D-1a..D-4 üretim kodu (T, yastıklı) | **~1,595** |
| testler (T) | **~430** |
| **GENEL TOPLAM (T)** | **~2,355** (D-0 dahil) |

Her dalga kapanışı ölçüyle (R)'ye döner (kanal üçlemesi); (T) yalnız dalga öncesi plan değeri.
Az-kod ilkesi: hiçbir dalga 500'ü aşmaz; aşma riski görünürse dalga bölünür, kapsam büyütülmez.

## YEREL MASAÜSTÜ MODU — Paseo KAPALI çalışma (2026-10-26 ~15:40 ekleme; kullanıcı isteği)

**Zemin (R):** `pano/server.js` (K-0019) sıfır bağımlılık `node:http`, 127.0.0.1:4377, verisini telemetry.jsonl/STATE_BOARD **dosyalarından** okur — Paseo sürecine hiç bağlanmaz. `core/src/local-runtime.ts` (ADR-012/K-0005): `ORDU_RUNTIME=local` kapısı + `LOCAL_REQUIRED_CAPS` 4-kanıt fail-closed — Paseo'suz worker koşumunun sözleşme katmanı hazır. **KT-07:** bu plan `pano/BLUEPRINT.md` (K-0019, ONAY BEKLER) hattının tuval/kart yüzünü büyüten **aynı evdir** — ayrı hat değil; `/api/graf` ve `kapsul-tuval.html` BLUEPRINT'in okuma-model evine (pano/) iner, core'a yalnız L-RT (A0-5) ince kancası dokunur.

| Parça | Ne yapar | LOC | Sprint'e bağ |
|---|---|---|---|
| `pano/yerel-masaustu.bat` + `.ps1` | çift-tık: `node pano/server.js` başlat (önce port-probe: doluysa ADIYLA kırmızı, sessiz çakışma yok) → varsayılan tarayıcı `http://127.0.0.1:4377` aç → kapat-kancası: pencere kapanınca süreç temiz (orphan-node yok) | ~30 | D-1a'nın parçası |
| `/api/graf` ucu `pano/server.js`'e | mevcut zero-dep sunucuya `GET /api/graf` (görev-grafiği JSON okur) + `GET /tuval` (kapsül-tuval HTML servis) | D-1a'nın ~25'i buraya yönlendirilir (core pano-server yerine — daha hafif yol) | D-1a |
| SSE canlı itme | `/api/canli` (SSE) **zaten var** — D-2 chat akışı notify.jsonl izleyicisini SSE'ye bağlar | +40 | D-2 |
| **L-RT** üretim LocalLauncher | git worktree oluştur + provider CLI sürecini ayrık başlat + pid'i durable registry'e yaz (adapter hazır R; launcher üretim ucu eksik — local-runtime.ts başlığındaki V3-RT.1/2 borcu) | ~150 + 60 test | **A0-5 olarak grafta (graf v4 eklendi, v5'te kök düğüm; 2026-10-26 ~16:05; kullanıcı onayı)** — claude-code/gemini-cli CLI eşlemeleri de bu düğümde (~40/CLI); D-dalgalarını bloklamaz |

**Sonuç matrisi:**

| Senaryo | Paseo | Çalışır mı |
|---|---|---|
| Tuval + kartlar + edit + AI-taslak (D-1a..D-4) | ❌ kapalı | ✅ tam — dosya bazlı |
| Chat geçmiş akışı | ❌ kapalı | ✅ — diskteki olaylar akar |
| Chat YENİ olaylar (koşum) | ❌ kapalı | ✅ `ORDU_RUNTIME=local` + L-RT ile (Paseo tamamen gereksiz) |
| Tuval erişimi | sunucu kapalı | ❌ bilinçli kırmızı (fail-closed; F9 kanıtı) |

## ÇAPRAZ İLİŞKİ MATRİSİ (D-1b/D-3 çekirdeği — varlık × yüz)


| Varlık | Sol (liste) | Orta (tuval) | Sağ (chat) | Makine (JSON/MD) |
|---|---|---|---|---|
| görev | satır vurgusu | düğüm vurgusu | o id'li mesajlar filtre | `gorevler[i]` + kapsül kartı |
| düğüm konumu | — | drag → x,y | — | `gorev.x/y` kalıcı |
| chat mesajı | kaynak görev satırı | düğüm vurgusu | mesaj | defter olay kaydı (id) |
| kanıt | satır 🔒 durumu | düğüm kenarı | mesaj → kanıt bağlantısı | son-kanit.json d·h·x |

## RİSKLER (kısa — V8 denetimiyle panzehirli)

- pano-server bugün salt-okur read-model; D-3 yazma ucu **tek uç** olmalı (çift-yazıcı = split-brain). Kenar: yazma ucu ayrı modül (`POST /api/graf/yaz`), **PANO_TOKEN fail-closed** (yanlış token → adım kırmızısı, sessiz yok) + fsync; **core pano-server'a (8790) yazma ucu YASAK** — tek fiziksel modül kuralı.
- MD↔JSON eşzamanlılığı: MD elle düzenlenirse (insan) → D-4 diff ucu "MD → JSON taslağı" yönünü de destekler; çelişkide JSON kazanır kuralı korunur. Kart üretici uç **mevcut MD'yi EZMEZ** (yazar kaydı üretir; insan notu bozulmaz).
- Drag'de JSON'a her hamlede yazma YOK — kaydet düğmesi/kapanışta (fsync başına append maliyeti + cache).
- **Sürüm-guard:** D-3 yazma ucu grafSurumu bayatsa RED (aynı anda iki sekmede edit → ikinci yazma kırmızı; split-brain kalıcılaşmaz).
- **Orphan-node / port çakışması:** başlatıcı önce port-probe (doluysa ADIYLA kırmızı); kapat-kancası süreci temizler (DERSLER: undici keep-alive tarzı kapanma blokları — server'da connection:close).
- **Kirli-ağaç kiliti:** yeni dosyaların yolları `scripts/kirli-liste.json`'a girmezse kilit denetimi kırmızı basar (S2 dalgasında bilinçli liste güncellemesi gerekli).
- .ps1 **ASCII** yazılır (PS 5.1 + Türkçe karakter = mojibake tuzağı; DERSLER).

---
Damga (R): 2026-10-26 ~15:00, ajan = ana oturum (Claude glm-5.3, ordu). Rev. ~15:15: 300-500 LOC dilimlerine bölündü. Rev. ~15:45: YEREL MASAÜSTÜ MODU (zemin R: pano/server.js zero-dep + local-runtime.ts). Rev. ~16:20: sprintler **DALGALARA** dönüştürüldü — her dalga HEDEF + İNSAN-OKUR TEST + SOMUT ÇIKTI üçlüsüne bağlandı. Rev. **~15:54 (disk mtime ölçümü — ilk yazımda ~17:20 tahminle üretilmişti, düzeltildi)** — **10-SUBAGENT UÇTAN-UCA DENETİM SONRASI**: (V6) graf v3→v5 (24 düğüm; 21→24), mockup 315→330 ham satır (R), D-1 aritmetik 460=470 düzeltildi; (V2) LOC yastığı — kalem revizyonu (server 70→~25, ui 350→~400 yastıklı, diff 180→~210), toplam ~2.455→**~2.355**; (V10) eski D-2 KATLANDI (kart ucu D-1b'ye, vurgu D-1b/D-3'e; ~1 dalga tasarruf), D-1 bölündü (D-1a/D-1b — 500 tavanı), D-2 erteleme kuralı, Karar-kutusu bilinçli kapsam-dışı beyanı; (V4/V8) panzehirler: PANO_TOKEN + fsync + sürüm-guard + MD-ezmez + port-probe + orphan-kancası + ASCII .ps1 + tek-fiziksel-yazma-modülü. Denetim kanıtı: raporlar/plan-kontrol-10subagent-2026-10-26/. Durum = ÖNERİ — "D-1a başla" düdüğüyle üretime geçer. Rev. **17:05 (Get-Date ölçümlü)** — KT-01..KT-08 işlenmeleri (b8 gelen-kutu raporu: KT-04 ajan-doğrudan-yazma RED kuralı · KT-05 kabul satır ID'leri · KT-07 BLUEPRINT aynı-ev beyanı · KT-08 kart 8-eksen ölçütü; KT-01 kapsam-dışı beyanı · KT-02 yazıcı-tavanı-3 + S1'e bağlı D-2 erteleme kuralı · KT-03 grafSurumGecmisi emaneti) + S3-plugin kapanışı doğrulaması (v0.23-kilit tag doğdu; paralel yazar boşaldı — D-1a artık istenirse paralel hatta da açılabilir). Zincir: GOREV-GRAFIGI **v6** → mockup D-0 → bu plan.
