# OTONOM ANALİZ — GÜVENLİK + KAYNAK-PERFORMANSI (teklif v1: ölü oturum ardıl otomasyonu)

**Analist:** OTONOM-ANALIZ-GUVENLIK-PERF (salt-okur). **Nesne:** v1 teklif — (1) workspace başına Paseo nöbet schedule'ı (20-30 dk; STATE + son handoff oku → [insan]-kapısız aktif işi devral; sessizken 2 satır rapor), (2) ölüm-algılayan watchdog script (5 dk polling; ölü+iş → headless `claude -p` devir promptuyla ardıl başlatır), (3) K-0057 süpervizör deseninin genelleşmesi, (4) bağlam yanması azaltma. **Damga:** 2026-11-01 05:06 (ölçüldü, date). **Yöntem:** salt-okur statik analiz — süreç başlatılmadı, ağ isteği gönderilmedi, commit/push yok; yalnız bu 2 rapor dosyası yazıldı (K-0017). `~/.paseo/config.json` yalnız okundu; **değerler rapora yazılmadı — yalnız alan adları** (dosyada canlı sağlayıcı anahtarları var; hiçbir çıktıda basılmadı).

## VERDİKT

**GÜVENLİK+PERF: GÜVENLİ-KOŞULLU** — v1'in üç bileşeni de *koşulsuz* haliyle RİSKLİdir: (i) yanlış-ölüm algısı belgeli YAYGIN durumdur (429 penceresi: ölen ajan pencere açılınca dirilir — 2026-10-30 kanıtı; 5 dk'lık watchdog çift-örnek üretirdi), (ii) headless `claude -p` doğrudan spawn'ı Paseo koruma zincirini (enjeksiyon + izin polisi + pitbull/bekci/loopguard) TAMAMEN bypass eder, (iii) eşzamanlılık/rate tavanı yokken 4-5 eşzamanlı ajanda 429 ölçüldü. Koşullar: §5 sert sınırlar (a)-(j) + mevcut pitbull/bekci katmanıyla birleştirme (§1.6). K-0057'nin kendisi (sınırlı süre, operatöre düşen heartbeat, mekanik-devir sınıfı) güvenli kalır; genelleşen sürüm kalıcı + kapsamsız + spawnsal olduğu için yeni bir güvenlik sınırı ailesi gerektirir.

---

## 1. Watchdog'ın güvenlik yüzeyi

### 1.1 Tek-örnek kilidi YOK — çift-yazar riski (yüksek)

Bugün kodda repo/workspace bazlı tek-örnek kilidi (lock/lease/PID dosyası, çapraz-süreç) **yok**: pitbull durumu bellek-içi `Map` (pitbull.ts:33), bekci atlaması daemon-içi bilgi (bekci.ts:188-189 `aktifTurVarMi`), plugin grep'inde lock/lease mekanizması bulunmadı. Write-set disiplini sözleşme+denetimle (yazıcı≠denetçi, ORDU-3 write-set denetimi) korunur — runtime kilidi değil. Yanlış-ölüm algısı → diriltme → **aynı dosyada iki yazıcı** = write-set ihlalinin en sert hali (ör. aynı `kapsul-tuval.html`'i iki ajan yeniden yazabilir; JSONL defterleri append+fsync toleranslıdır ama MD/kod dosyaları değildir — pano/server.js write-set: BAKIM planı A bölümü, 3 dosya).

### 1.2 Yanlış-ölüm YAYGIN durum: 429 penceresi + "running ≠ çalışıyor" (yüksek)

- **Ölen ajan dirilir:** 2026-10-30 oturumunda ORDU-1 ×2 + ORDU-2 ×1 429 — «ikisi de pencere açılınca dirildi» (kararlar/K-0057.md:3). 5 dk'lık ölüm-algılayan watchdog bu pencerede ardıl spawn ederdi; orijinal dirildiğinde çift örnek. Teklifin 3. maddesi (K-0057 genelleşmesi) tam da bu deseni tekrar üretme riski taşır.
- **Statü yanıltır:** ORDU-1 12:56'dan beri statü «running» ama donuktu; operatör 13:14'te yakaladı (raporlar/boru-hatti-performans-2026-10-30/OZET.md:21 — «otomatik tespit YOK»). Tersi de doğru: errored ≠ ölü (429 sonrası dirilme). Süreç-adı/statü eşleşmesiyle ölüm kararı verilemez.
- **Süreç ortamı belirsiz:** census'ta 322-369 süreç (bakim.log:1-5) — `node/claude` ad-eşleşmesi çok-yanlışlı; Windows PID yeniden kullanımı süreç-kimliği karartır.
- **Bugünkü 429 (5 eşzamanlı ajan, bir denetçi öldü):** görev metni iddiası — ordu telemetrisinde 2026-11-01 kayıt yok (son 6 kayıt 2026-10-29 17:58 → 2026-10-31 18:35; raporlar/gelen-kutu/KURAL-KUTLE-TARAMA-2026-11-01.md §1). **(T) — disk kaydı yok**; ölçülü emsal 2026-10-30 (R).

**Sonuç:** ölüm kararı yalnız **süreç-çıkışı kanıtıyla** (PID + başlangıç-zamanı doğrulamalı süreç-ağacı sorgusu) + kira (lease) bayatlığıyla verilebilir; idle/errored/running-donuk ölüm SAYILMAZ.

### 1.3 Headless `claude -p` spawn Paseo koruma zincirini BYPASS eder (yüksek)

Plugin katmanının tamamı Paseo daemon kancalarına bağlıdır: sözleşme enjeksiyonu `server.before("agent.create")` → `enjeksiyonMetni` → systemPrompt değişimi (plugin/index.server.ts:60-92); izin polisi salt-okuma beyaz listesi + tehlike-deseni deny (plugin/server/permission.ts:15-23, 43-61); pitbull 60sn tarama (pitbull.ts:7, 140-152); bekci 15dk repo taraması (bekci.ts:21, 249-263); loopguard dürtme-döngü freni (loopguard.ts:6-8) — hepsi index.server.ts:41-46'dan başlar. Doğrudan `claude -p` spawn'ı bu zincirin HİÇBİRİNDEN geçmez: çekirdek sözleşme enjekte edilmez, izin polisi koşmaz, pitbull/bekci izlemez. İzin modu settings.json/CLI bayrağına kalır — `--dangerously-skip-permissions`/bypassPermissions kullanılırsa **denetimsiz serbest ajan**; kullanılmazsa headless'da izin istenemez → ya kilitlenir ya allow-list'e düşer. **Öneri:** watchdog ardılı Paseo İÇİNDEN yaratsın (paseo ajan yaratımı veya mevcut oturuma `send` — Paseo'da gönderim transkriptten devam ettirir) → koruma zinciri aynen geçerli olur ve «devralma» aynı kimlikle (revival-in-place) yapılır: çift-örnek riski spawn'dan çok daha düşük.

### 1.4 Watchdown script'in kendi ayrıcalıkları ve kötüye-kullanım yüzeyi (orta)

Scheduled task kullanıcı hesabında koşar → script, kullanıcı env'i (settings.json'daki sağlayıcı anahtarları dahil) devralmış bir ajan doğurabilir. Script kaynağı değiştirilebilirse = **serbest ajan spawn kılldığı** (prompt enjeksiyon kaynağı). Örnek emsal: `.git/hooks/post-commit`'e bağlı üçüncü taraf Qoder tracker her commit'te npm-cache yolundan node ile koşuyordu — 2026-11-01'de kaldırıldı (raporlar/gelen-kutu/GUVENLIK-DENETCI-2026-11-01.md:33 GD-007; plans/BAKIM-GUVENLIK-PERFORMANS-PLANI-2026-11-01.md:35). İkinci yüzey: devir promptu STATE/handoff içeriğinden derlenir — STATE ajan-yazılabilir damga protokolüdür → **dolaylı prompt enjeksiyonu** (ajan, ardılı yönlendirmek için STATE'e metin gömebilir). **Öneri:** (1) script repo içi + ajan write-set'i DIŞINDA (ajanlar değiştiremez) + sha256'i denetçinin/STATE'in göreceği yerde; (2) devir promptu SABİT şablon + dar alan çıkarımı (iş kimliği, handoff yolu — serbest metin girmesin); (3) ardıl K-0057 3a disipliniyle başlar: «disk teyidi — rapora güvenme, kodda kanıt ara».

### 1.5 Kill reçetesiyle çelişki (orta — dolaylı)

BAKIM-ANA-REHBER §1.2 (satır 25): **kanıt olmadan kill yasak, toplu-kill yasak**; yanıt bekleyen canlı ajan oturumu Paseo penceresinden kapatılır, kill edilmez; kill reçetesi = ölç → komut-satırı kanıtı → PID zinciri doğrulama → Stop-Process. v1 metni kill İÇERMEZ → **doğrudan çelişki yok**. Üç dolaylı çatışma: (1) «canlı ama idle» ajanı ölü saymak kill'in manevi eşdeğeridir (orijinal yetkisi elinden alınır, süreci zombi kalır) — yasak sınıf; (2) çift-örnek çözümü kill gerektirdiği anda reçete şartları zorunlu; (3) **toplu-devir** (birden çok repo aynı pencerede öldü — 429/daemon çöküşü sonrası) toplu-kill'in ayna riskidir. **Öneri:** watchdog asla kill etmez; çakışmada YENİ gelen çekilir (yield + rapor), mevcut öldürülmez; devir pencere başına 1.

### 1.6 Mevcut altyapı zaten katmanlı — teklif örtüşmeyi hesaplamıyor (orta)

Pitbull (stall: yazıcı 15 dk/okuyucu 20 dk; 10 dk cooldown; 3 ardışık → insan kapısı; oturum başına 5 dürtme tavanı; ölü ajan 24h bayat tura dürtme BİLE üretemez — pitbull.ts:8-13, 89-95, 104-117); loopguard (3-tekrar döngü dedektörü, 2. dürtmede insan kapısı — loopguard.ts:6-8, 67-79); bekci (15 dk; aktif tur varsa erteler — bekci.ts:189); K-0057 heartbeat (10 dk ofsetli, operatöre düşer — kararlar/K-0057.md:8). Mevcut sistemin ölüm/takılma cevabı hep **aynı ajana dürtme + tavanlar + insan kapısı**dır; hiçbir katman otonom spawn etmez (K-0057 devri bile mekanik-senkron sınıfıyla sınırlı, kayıtlı). Nöbet schedule (20-30 dk) + watchdog (5 dk) üstüne binince: aynı ajana çift dürtme (pitbull+nöbet), aynı repoya çift rapor (bekci+nöbet — sessiz dönemde bekci zaten anomali raporluyor, bekci.ts:204-209). **Öneri:** nöbet cadence'ı pitbull/bekci ritminden dakika-ofsetli; bekci anomali raporlarken nöbetin sessiz-raporu susturulur; watchdog yalnız Paseo heartbeat'in kendisi öldüğünde devreye girsin (2. derece nöbetçi — «watch the watcher»).

## 2. Paseo kaynak-performans tabanı

**Config yapısı (yalnız alan adları — değer YOK):** `daemon.listen` (localhost bağlantı), `daemon.mcp.injectIntoAgents`, `daemon.browserTools.enabled`, `daemon.autoArchiveAfterMerge`, `daemon.enableTerminalAgentHooks`, `daemon.appendSystemPrompt`, `daemon.agentProfiles` (~16 profil), `daemon.cors.allowedOrigins`, `daemon.relay.enabled`, `pluginsEnabled`, `plugins.paseo-verimlilik` (directory kaynak, ordu\plugin yolu, enabled), `agents.providers` (çok sağlayıcı; bir kısmı kapalı). **Schedule alanı config'te YOK** — schedule'lar daemon durumunda yaşar; bilinen tek schedule haftalık bakım `0239347b` (BAKIM-ANA-REHBER §2.2:47 — Pazar 05:37, `.paseo` bakımı son 3 kalır).

**Plugin eşikleri (kod satırıyla):** enjeksiyon bütçesi 20 KB (plugin/server/sozlesme.ts:6; canlı ölçüm 6.014 B — KURAL-KUTLE-TARAMA §1); kural eşiği SARI 40 / BLOK 80 (sozlesme.ts:7-8; ordu canlı toplam 47 — SARİ bandında); bağlam bütçesi %70 yeni iş yok / %80 devir / %90 acil damga (cekirdek.ts:17, 24; BAKIM-ANA-REHBER §2.2:48); pitbull/bekci/loopguard sabitleri (§1.6); izin polisi (permission.ts:6, 15-23).

**Süreç/RAM/disk (ölçülmüş, R):** bakim.log census 04:11-04:29 penceresi — süreç sayısı 341→337→322→322→369 (bakim.log:1-5); RAM boş ~6,8-6,9 GB (~%29); 2 adet 6,5-7s claude süreci 187-248 MB (her oturum ~200-250 MB — BAKIM-ANA-REHBER §1.2:27 «~250 MB/süreç» ile uyumlu). metrik.log (3 ölçüm — kısa pencere, dürüst): cpu %100-%100-%96 (04:26/04:29/04:59), RAM boş ~%26, **diskC boş %9,1 = ALARM** (eşik %10; bakim.log+metrik.log:1-3). **Sonuç:** CPU %100 dönemlerinde yeni döngüsel LLM turları çakışmayı büyütür; diskC ALARM'ında `~/.paseo` transkript büyümesi gerçek kısıttır — kalıcı yeni schedule ailesi diskC %10 üstüne çıkana kadar açılmamalı.

**autoArchive etkileşimi (dürüst):** `autoArchiveAfterMerge` alanı VAR (config satır 11; BAKIM-ANA-REHBER §2.1:39 «biten ajan otomatik arşive iner» — 16-ajan birikimi 8 arşiv + bu alanla kapatıldı). Schedule-per-tick nöbet modelinde her tick YENİ ajan doğar → işini bitirir → arşive iner: **aktif listede birikmez** (zincir üstünde kalmaz), ANCAK transkript/kayıtlar diskte birikir (haftalık `0239347b` son-3 budamasına güvenir — bakım güne denk gelen birikme ölçülmeli). Kalıcı heartbeat-nöbet alternatifi diskte ucuz ama RAM'de ~200-250 MB sabit tutar VE tek transkript büyür → bağlam yanması (teklifin 4. hedefi) TERS yönde işler. Schedule-per-tick taze bağlamla açılır = hedef 4 ile uyumlu; bedeli disk + spawn churn.

## 3. 429 / hız-limiti modeli ve pacing sınırları

**Ölçülen limitler (R, 2026-10-29 teşhis — memory kaydı):** Codefast GLM-unlimited geçidi `429 RATE_LIMIT_RPM_EXCEEDED (rpm_limit=25)`; Cloudflare 429 ~30 istek/dk'da; aynı anahtarı paylaşan sürü işleri için ~**20 istek/dk altında kal** önerisi. 429 emsalleri: 2026-10-30 4 ajan (3 iş + 1 süpervizör) döneminde 3 kırılma, ORDU-2 429→closed (K-0057.md:3; boru-hatti OZET.md:13, 26); bugün 5 eşzamanlıda bir denetçi öldü iddiası **(T, disk kaydı yok)**. Telemetri-fail anomali eşiği: son 20 turda başarısız çağrı >%25 (bekci.ts:23-24, 66-71).

**Teklif üstüne binince:** nöbet schedule + watchdog devri + insan oturumu + iş ajanları aynı paylaşımlı anahtara vurur. Hesap (T): sessiz nöbet turu ~1-3 dk ve ~8-12 istek; 3 repo × 30 dk cadence ≈ 50-70 istek/saat ≈ ~1 istek/dk ortalama — ortalama RPM 25 içinde. Risk üç başlıktadır: (1) **faz hizası** — schedule'lar aynı dakikada kurulursa her 30 dk'da 3 ajan aynı anda request-yoğun başlar (ani burst ~25-30 istek/2-3 dk → limit kenarı); (2) **iş-dönemi üst üste binmesi** — 3 iş ajanı + insan oturumu + nöbet zaten ölçülen 4-5 eşzamanlılık bölgesine girer; (3) **watchdog toplu-devir** — rate-penceresi birden çok ajanı öldürdüyse anında revive kümesi thundering-hip çakışması üretir ve tekrar 429'a çarpar → **crashloop** (§3b).

**Önerilen tavanlar:** paylaşımlı anahtar üzerinde eşzamanlı iş ajanı ≤3 (EK-3 paralel yazıcı tavanıyla aynı; ATOLYE 6-paralel yalnız limitsiz sağlayıcı için — modlar.ts:22); **eşzamanlı nöbet ajanı 1** (repolar sırayla — tek nöbetçi kuyruğu); **devir pencere başına 1** (kalan kuyrukta); insan oturumu tavana dahil sayılır; anlık istek bütçesi ~20/dk (RPM 25 ölçümü); cadence'lar dakika-ofsetli + jitter (K-0057 «4-54/10 ofsetli» deseni).

**429-algılanınca geri çekilme (K-0057 deseninden):** (a) 429 ölümü → ANINDA devir YOK — önce pencere bekle (memory: «bekle-yeniden dene»; 400/429 geçici geçit hatası sınıfı); (b) devir denemesi başarısız → üstel bekleme + jitter; (c) **2 ardışık başarısız devirde watchdog SUSAR ve insan kapısı açılır** (loopguard.ts:67-71 ve pitbull.ts:105-117 ile aynı fren deseni — sonsuz döngü en pahalı watchdog hatasıdır, arsiv/PASEO-VERIMLILIK-REHBERI-v2.0.md:94).

## 4. Token bütçesi (dürüst, T etiketli)

Girdi ölçümleri (R): STATE_BOARD.md 57.080 B; son handoff (HANDOFF-2026-10-31-2002.md) 3.129 B; canlı enjeksiyon çıktısı 6.014 B (KURAL-KUTLE). İşini yapan bir sessiz nöbet turu (STATE + handoff + enjeksiyon) ≈ **~17-20k girdi token** (T; ~4 B/token dönüşümü) + ≤0,1k çıktı. Görev metnindeki «~2-5k (T)» tahmini yalnız dosya-OKUMADAN tur için geçerli — nöbetin tanımı gereği STATE+handoff okur → gerçekçi bant 17-20k/tur.

**Günlük ek maliyet (T):** 20-30 dk cadence = 48-72 tur/repo/gün. 3 workspace → 144-216 tur/gün × ~18k ≈ **2,6-3,9M girdi token/gün** ham; tekrarlayan önekler (çekirdek + değişmemiş STATE) cache'lenir (emsal kanal cacheHitPct ~97, R) → efektif yeni token ~**0,3-1M/gün** (T). limitsiz paket uçlarında bu para değil duvar-saati + geçit yükü; ücretli uçlarda gerçek paradır. Çıktı cimri (2 satır kuralı — REHBER-EK-OTONOM.md:6).

**Kazanç (R emsal):** durmuş iş tespiti bugün insana bağlı — 2026-10-30'da donuk 18 dk sonra operatör nöbet taramasıyla yakalandı, 429 gecikmesi ~33 dk (boru-hatti OZET.md:13, 21). Otomasyon MTTR'yi cadance'a indirir: 20-30 dk nöbet ≈ insan performansı (net kazanç küçük), 5 dk watchdog belirgin kazanç — AMA yanlış-ölüm maliyetiyle (§1.2). **Dürüst netice:** sessiz günlerde maliyet ≥ getiri; asıl getiri gece/nöbet penceresi (operatör yokken saatlerce süren kayıp) + uzun işlerde. Kazancın ölçümü nöbet raporuna bağlanmalı (devir sayısı × kurtarılan süre).

## 5. Sert sınırlar listesi (teklifin güvenlik şartnamesi)

- **(a) Tek-örnek kilidi:** repo bazlı kira (lease) dosyası — PID + süreç başlangıç-zamanı + son-nabız damgası; atomik edinme (tmp+rename, panoIsaretciYaz deseni bekci.ts:242-245); watchdog yalnız kira bayat VE süreç-ağacı sorgusu çıkış-kanıtı verirse devir üretir. Süreç-adı/statü eşleşmesi ölüm kararı için YASAK.
- **(b) Kapı tanımı KODA taşınır:** «[insan]-kapısız iş» işaretçisi STATE metninden değil, kodda beyaz listeli iş sınıfından gelir (kontrol ilkesi, kullanıcı emri 2026-10-31 17:21 — STATE_BOARD.md:4; K8-2 §H). STATE ajan-yazılabilir → kural kaynağı OLAMAZ.
- **(c) Eşzamanlılık tavanı:** iş ajanı ≤3 (paylaşımlı anahtar) + eşzamanlı nöbet 1 + devir pencere başına 1 + insan oturumu sayılır; anlık ~20 istek/dk bütçesi (RPM 25 ölçümü).
- **(d) Headless spawn izin modu:** mevcut oturum izinlerinden DAHA geniş OLMAZ; bypassPermissions/skip-permissions YASAK; en iyisi doğrudan `claude -p` hiç kullanmayıp ardılı Paseo içinden yaratmak (enjeksiyon+izin polisi+pitbull zinciri geçerli — index.server.ts:60-92, permission.ts:43-61).
- **(e) Watchdog script kaynağı:** repo içi + ajan write-set'i DIŞINDA + sabit devir-şablonu + sha256 denetçi kaydı; yaşam-döngüsü betiği emsali GD-007/Qoder dersi; STATE içerik yalnız dar kimlik alanlarıyla girer, ardıl disk-teyidiyle başlar.
- **(f) [insan] kapıları aynen (EK-2):** watchdog/nöbet asla kullanıcı adına onay üretmez; 2 satır durum raporu; aynı konuda 2. ardışık dürtmede dur (REHBER-EK-OTONOM.md:5-8).
- **(g) Kill yasak:** watchdog kill ETMEZ, yalnız spawn+rapor; çift-örnek tespitinde YENİ gelen çekilir, mevcut öldürülmez; kill gerektiğinde BAKIM-ANA-REHBER §1.2 reçetesi (ölç+kanıt+PID zinciri) zorunlu.
- **(h) Toplu-devir yasak + geri çekilme:** pencere başına 1 devir, kalan kuyruğa; 429-algılamada anında revive YOK — pencere bekle; üstel+jitter; 2 ardışık başarısız devirde watchdog susar (insan kapısı).
- **(i) Nöbet bütçesi:** sessiz çıktı ≤2 satır; nöbet ajanı salt-okur modda; ilk aşama cadence ≥30 dk ve 1 pilot workspace — ölçüm (tur süresi, istek sayısı, kurtarılan süre) olmadan kısaltılmaz; diskC %10 altında yeni kalıcı schedule açılmaz.
- **(j) Disk/RAM muhasebesi:** schedule-per-tick + autoArchive + haftalık son-3 budaması birlikte izlenir; günlük ajan/transkript artışı nöbet raporuna ölçü olarak girer (O2 ölçüm-kaynağı ilkesiyle uyumlu — puan ajan ürünü değil).

## En güçlü 3 öneri

1. **Devri Paseo içinden, süreç-çıkış kanıtı olmadan asla:** lease kilidi (a) + süreç-ağacı teyidi; ardıl doğrudan `claude -p` değil Paseo yaratımı/mevcut-oturuma gönderim (d) — koruma zinciri (enjeksiyon, izin polisi, pitbull, bekci, loopguard) aynen geçerli, çift-örnek riski taban iner.
2. **Rate/paralel tavanlar koda gömülü:** iş ≤3 + nöbet 1 + devir 1/pencere + ~20 istek/dk; 429-penceresinde bekle-yeniden-dene + 2 başarısızlıkta susma (h) — crashloop ve toplu-hip önlenir.
3. **Kademeli pilot + ölçüm kapısı:** önce 1 workspace'te 30 dk nöbet (sessiz), watchdog yalnız 2. derece nöbetçi (heartbeat öldüğünde); her nöbet turu istek/token/MTTR ölçer; ölçüm olmadan kapsam büyütülmez (subagent ölçek kuralı: kademeli artırım; EK-3 tavan 3).

## Kaynak referansları (tümü salt-okur okundu)

- C:\Users\gatep\.paseo\config.json (yapı; değerler rapora yazılmadı)
- D:\Vibecode\ordu\plugin\index.server.ts (:41-46, :60-92) · plugin\server\{sozlesme,permission,pitbull,bekci,loopguard,cekirdek,modlar}.ts (satırlar metinde)
- D:\Vibecode\ordu\kararlar\K-0057.md · STATE_BOARD.md · raporlar\boru-hatti-performans-2026-10-30\OZET.md · raporlar\gelen-kutu\KURAL-KUTLE-TARAMA-2026-11-01.md · raporlar\gelen-kutu\GUVENLIK-DENETCI-2026-11-01.md · plans\BAKIM-GUVENLIK-PERFORMANS-PLANI-2026-11-01.md · sozlesme\REHBER-EK-OTONOM.md · arsiv\PASEO-VERIMLILIK-REHBERI-v2.0.md
- D:\Vibecode\healthcheck\BAKIM-ANA-REHBER.md (§1.2, §2.1, §2.2) · raporlar-bakim\bakim.log (5 satır) · raporlar-bakim\metrik.log (3 satır)
- Memory: codefast-400-hata-olustu-gecici.md (RPM 25 ölçümü; 2026-10-29) · subagent-olcek-kurali.md (kademeli artırım)

**Şema ikizi:** raporlar/gelen-kutu/OTONOM-ANALIZ-GUVENLIK-PERF-2026-11-01.json (schemaSurum 1, append-only).
