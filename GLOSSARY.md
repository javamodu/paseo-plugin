# GLOSSARY — ordu kavram sözlüğü (L2 · elle yazılır)

> Amaç: ORDU paneli ve ajan ordusu mimarisinin kavramlarını tek yerde toparlamak. Tüm tanımlar ölçülmüş gerçeğe dayanır — kaynaklar: çekirdek doğrulama turu (raporlar/pano-cekirdek-dogrulama-2026-11-04), K-0063, plans/AJAN-YONETIM-MATRISI.md, plans/PANEL-DALGA-SIRASI.md, plans/DOGRULAMA-TURU-PROTOKOLU.md. Bu belge İNSAN/AJAN eliyle yazılır ve güncellenir (CODEMAP otomasyonundur — ANAYASA Y3 yalnız CODEMAP için bağlar). Kök: D:\Vibecode\ordu · İlk doğum: 2026-11-04 (operatör emriyle).

## 1) ORDU PANELİ nedir

Paseo altında **veya dışında** (adapter mimarisi: `paseo`/`local` — ADR-012, ordu-core `adapter-contract`) yaşayan ajan ordularının **tek komuta yüzeyi**: yönetmek · izlemek · denetlemek.

- **Hiyerarşik:** proje → oturumlar → ajan (tek) veya ajan sürüsü.
- **Yüzey:** salt-okur GET'ler (ağaç · kadro · akış · sağlık · log · konusma) + **token kapılı POST /api/mesaj** (403/401/400/429 zinciri fail-closed — D4/D8'de ölçüldü).
- **Disk SSOT:** panel veri kopyası TUTMAZ; `~/.paseo/agents/` kayıtlarını + `.jsonl` transcriptleri okur (konusma = tail-read 512KB). Panel = diskin görünümü. Sahte veri / ölü buton YASAK (E10).
- **Doğurma köprüsü:** K-0060 TASLAK (kapalı) — bugün panel yalnız MEVCUT ajana mesaj atar; yeni ajan doğurma KURMAY MCP aracıyla.

## 2) Deterministik dikey (üç katman)

Ajan beyni **stokastiktir** (LLM); deterministik olan **süreç ve kapılardır** — belirsiz beyinler, kesin raylar arasında:

| Katman | İş | Araç (ölçülmüş) |
|---|---|---|
| **Daemon** (altyapı — yargısız: iyi/kötü bilmez, yalnız taşır) | kayıt defteri · mesaj kuyruğu + teslim (**2 sakin saniye** — D8 kırılımı 1,9 sn) · süreç doğurma/ölüm · cron/heartbeat/schedule | Paseo daemon (bugün) · ordu-core `daemon.ts` (bağımsız yol: tick çocuk süreçte koşar — daemon çökmez; 3 üst üste kırmızı çocuk = fail-closed ölüm; STOP mandalı her uyanışta yeniden okunur) |
| **Scriptler** (harness — kabul kapıları: sayı ve exit kodu konuşur) | «yaptım» sözü kanıt DEĞİL | tam kapı `node --test` EXIT=0 · `scripts/ps51-kapisi.ps1` merge-guard · CODEMAP regen · K-0062 LOC tavanları (@Count ölçümü) · PNG imza + IHDR doğrulaması |
| **Kurallar** (sözleşme — davranış disiplini) | ne yapılır / yapılmaz | ANAYASA > evrensel sözleşme v2.1 > EK-1..5 > kararlar K-xxxx · DERSLER |

Otorite ekseni ALTYAPI ekseninden AYRIDIR: operatör → sözleşme → KURMAY → işçi ajanlar (kararı üst katman verir); daemon hepsinin altındaki ZEMİNDİR (KURMAY dahil — daemon yönetici değil, sahne).

## 3) Doğum ve izleme: ORDU panelinden vs projenin kendi sekmesi

| | **KURMAY/panel zincirinden** | **Proje sekmesinden (Paseo desktop)** |
|---|---|---|
| Doğuran | KURMAY-1 (ajan onun subagent'ı) | operatör (parent'sız — diskte 606 «operatör doğumlu» kayıt) |
| Soy kaydı | `parent-agent-id` YAZILI (481 bağlı kayıt · 46 yönetici) | yok → FAZ-V yüzeyinde dürüst gösterim: «bağlı: operatör» |
| Kapılardan geçer | token (403/401) + beyaz liste + 429 hız + 4096 bayt tavan + 15 sn köprü zaman aşımı | Paseo desktop'un kendi izin akışı (bizim frenlerimiz o akışta YOK) |
| İş kabulü | KURMAY kanıt kapısı: brif → koşu → gelen-kutu raporu → bağımsız doğrulama → commit TEK ELDEN (ajanlar COMMIT ATMAZ) | operatörde (o ajan kendi commit'ini atabilir) |
| KURMAY-1 yetkisi | TAM: prompt · steer · interrupt · cancel · kill/archive · ayar | görme + yönlendirme TAM; **kill/ayar/cancel YALNIZ emirle** (sahiplik disiplini — matris §3) |

**İzleme iki yüzeyden serbest — ikisi de AYNI diske bakar:** Paseo sekmesi = o projenin native oturumu (canlı akış + doğrudan sohbet + izin onayı); ORDU paneli = 76 proje tek ağaçta + hiyerarşi + rozetler + kanıt katmanı (işlenme · rapor · commit hash) + mesaj gönderimi. Veri ayrımı/kopması YOK (SSOT disk).

Dürüst sınırlar: (a) panel konuşma görünümü Claude-motorlu ajanlarda tam; codex-motor oturumlarının transcript düzeni farklı → panelde dürüst boş/404 (durum/kayıt yine görünür). (b) Paseo sekmesinden KURMAY'a seslenileMEZ — ajanlar workspace'e bağlıdır; KURMAY yalnız ordu workspace'inde görünür (üç kapı: ordu projesinin sekmesi · panel composer hedef listesi «KURMAY-1» · bu sohbet).

## 4) KURMAY vs PROJE-MANAGER (K-0063 — onaylı, start bekler)

Hiyerarşi: **operatör → KURMAY → proje-manager → işçi ajanlar**

| | **KURMAY** | **PROJE-MANAGER** |
|---|---|---|
| Kapsam | TÜM ordu | TEK proje |
| Yaşar | ordu workspace'inde | o projenin workspace'inde (kurmay altında soylu kayıtla) |
| Görev | strateji · dalga sırası (PANEL-DALGA-SIRASI) · kaynak/kadro · brif (EK-3) · bağımsız doğrulama · commit tek elden · kanıt zinciri · tavanlar | o projenin ajanları ve görevleri: dağıtım · izleme · denetim · replan · performansa-dayalı atama · rapor |
| Yetki | tüm astlarda kill/cancel/ayar; ordu-geneli her karar | kendi projesi sınırlarında; ordu-geneli kararlar kurmayda |
| Durum | ÇALIŞIYOR (KURMAY-1 · 8cc610a4) | TASARLANDI — start emri bekler (pilot 3 proje read-only → rapor → onay → 42'ye yaygınlaştırma) |

Reddedilen alternatifler (K-0063): tek kurmay 76 projeyi doğrudan yönetir (ölçeklenmez) · ordu-dışı bağımsız proje manager (kanıt/hiyerarşi zinciri kopar).

## 5) Ajan ordusu yönetimi — YAPABİLİR / YAPACAK / YAPAMAZ

**YAPABİLİR (yetkiler):**
- GÖRME (tam, her ajan): list/status/activity · terminal çıktısı · `~/.paseo/agents/` kayıtları (salt-okur) · transcript tail-read · 76 projelik ağaç.
- YÖNLENDİRME (tam, hem kendi hem operatör ajanına): prompt gönder · steer (tura katıl) · interrupt (turu kes).
- KENDİ subagent'ında: model/mod/etiket ayarı (tur sınırında — cache dostu) · cancel (ajan yaşar) · kill/archive (kalıcı ölüm).
- Doğurma: create_agent (kalıcı subagent) · create_schedule (cron ajanı — her vuruşta yeni ajan) · create_heartbeat (var olan oturuma dürtme) · uzak host (serverId'li).
- Schedule yönetimi (kendi olanlar): pause/resume/run-once/update/delete + maxRuns/expiresIn sınırları.
- Ölçek: paralel yazıcı ≤3 (EK-3) · dalga başına ≤4 koşu (K-0062).

**YAPACAK (yükümlülükler):**
- Brif 4 öğe: hedef · çıktı formatı · araç/kaynak · görev sınırı (EK-3).
- Bağımsız doğrulama kapanışı: tam kapı test EXIT kodu + diff hunk denetimi + canlı DOM + PNG imza («rapor eskir, kod durur»).
- Kalıcı kayıt: teslim → raporlar/gelen-kutu md+json → işlenme + commit hash; bulgu → İLGİLİ reponun gelen-kutusuna (append-only).
- Commit tek elden, dosya adıyla add; CODEMAP aynı commit'te taze; her işlenmede LOC DELTA (K-0062).
- Devir töreni: HANDOFF-%80 bağlam + zincir + echo; açılışta gelen-kutu taraması (K-0017).
- Dürüstlük: ölçümsüz rakam YOK (ANAYASA A2) · aynı tuzağa iki kez düşmek hatadır (DERSLER).

**YAPAMAZ (yasaklar):**
- Kullanıcı ADINA onay/izin yanıtı (EK-2 — agent-notification onay SAYMAZ; fail-closed).
- push (K7 — ayrı emir, birikim takibi) · 4377 üretim restart · operatör ajanına kill/ayar/cancel (yalnız emirle).
- Canlı sunucuya test; izole port + restart yalnız onayla.
- Commit'te `-A` · emoji · başkasının kirli dosyası; testsiz merge; ANAYASA değiştirme (yalnız kullanıcı).
- CODEMAP elle düzenleme (Y3) · sahte veri/ölü buton/«yakında» kartı (E10) · ölçümsüz yüzde (A2).
- K-0062 tavan aşımı (%100'de yeni iş ALINMAZ — yalnız daraltma); tavan revizyonu YALNIZ kullanıcı emriyle.
- Sır disiplini: PANO_TOKEN değeri hiçbir komutta/çıktıda/logda YAZILMAZ (tarayıcı localStorage + fetch başlığı).
- Ajanlar COMMIT ATMAZ — commit tek elden koordinatör oturumunda.

## Terimler (kısa sözlük)

| Terim | Anlam |
|---|---|
| **daemon** | altyapı süreci: kayıt + kuyruk + süreç + saat; yargısız (determinizm ondan bekleme) |
| **harness** | deterministik kabul rayları: test EXIT, kapı scriptleri, tavan ölçümleri |
| **SSOT** | tek doğru kaynak — bu sistemde DISK (kayıtlar + transcript) |
| **steer / interrupt** | mesajın tura KATILMASI / turun KESİLMESİ |
| **2 sakin saniye** | daemon'un mesajı alıcıya teslim öncesi toplu işleme penceresi (tasarım) |
| **tail-read** | büyük dosyanın yalnız SON bölümünü okuma (konusma: 512KB/30 balon) |
| **fail-closed** | hata/eksik veri durumunda DÜRÜST boş/kırmızı — sahte içerik doğmaz |
| **parent-agent-id** | ajanın doğuran annesinin kimliği — hiyerarşinin kayıt temeli |
| **işlenme** | gelen-kutu maddesinin işlendiğinin damgası (+ commit hash) |
| **[insan] kapıları** | yalnız operatör: push · restart · kill · silme · ücretli üretim · izin |
| **dalga** | atomik iş birimi: brif → koşu → doğrulama → kapanış (tam kapı test sayısı ölçüt) |
| **birikim** | push'lanmamış yerel commit sayısı (K7 — ayrı emirle push) |
