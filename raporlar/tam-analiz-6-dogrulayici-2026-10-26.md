# TAM ANALİZ — 6 DOĞRULAYICI TURU — 2026-10-26

Yöntem: 6 salt-okur doğrulayıcı (Explore subagent) + 1 yazıcı sentezi (ordu düzeni: N doğrulayıcı → 1 yazıcı). Her iddia dosya:satır kanıtıyla doğrulandı; tahmin yok, kanıt yoksa "tanımsız" dendi. (R) = doğrulanmış ölçüm/okuma, (T) = tahmin.

Soru başlıkları: (1) SAVAŞA START düdüğü — zamanı ve faydaları, (2) çekirdek eksikleri, (3) plugin hedef-ulaşımı, (4) değer-sıralı uygulama planı, (5) teknik borç / mimari drift / fake green, (6) rakip-üstü agentic güçler ve eksikler.

## 1. START düdüğü

- **Otorite:** yalnız [insan]. REHBER v2.1:85 (§7.1 vekalet yasağı), :117 (plan değişikliği onaysız uygulanmaz); ANAYASA.md:4 (ajan değiştiremez). ANAYASA'da START kelimesi tanımlı değil — yetki rehber+plan zincirinden türetiliyor (R).
- **Kalan kapılar (sırasıyla):** (1) 6/6 gözlemci N5/N5-2 turu — KULLANICI'ya ait, "yazıcı kendini sınamaz" (STATE_BOARD.md:5,8,51); (2) kabul %40,9 → %44'e kalan TAM 4 puan üç [insan] kararıyla: F7-B +1, A14+A10 +2, M17 +1 (savasa-hazir-2026-10-26.md:21); (3) B-1 token rotate + git rm — YÜKSEK aciliyet (değer c41c75e geçmişinde, raporlarda yok); (4) Karar C — F4 önkoşulu (SAVASA-HAZIR-PLAN:45); (5) K-0047/K-0048 ÖNERİ; (6) ANAYASA A4 (K-0043 kuyrukta); (7) FAZ-4.1 bench taşıma — ertelenemez (savasa-hazir:48).
- **START sonrası:** gözetimli E2E + STOP/kill-9 + pano görseli → kabul.csv canlı satır (DEFTER.md:82); K3 sınıfı 36 satır açılır — canlı dispatch, canlı UI/operatör, telefon-remote, provider wiring, paired benchmark, çok-ajan K12-01..14 + K13-01..04 (kalici-acik-defteri:13,23; plans/kabul.csv:106-109: 5-LLM turnuvası, gece kesinti senaryosu, eşzamanlı izolasyon); F4 penceresi = 3 eski ev dizininin silinmesi (SAVASA-HAZIR-PLAN:40-46).
- **Savaş ölçüleri:** tanımlı olan yalnız kabul.csv satır hedefi (%44 = 51/115) + K3 36 kalem + F4 silme listesi. Savaş süresi / toplam ajan sayısı / teslim hacmi HİÇBİR dokümanda tanımlı değil (R). Ordu düzeni sınırları: eşzamanlı yazıcı tavanı 3 (REHBER:95), 6 slot dolu (REHBER:125).
- **Gerginlik (dürüstlük notu):** ADR kapı 1 "0 EKSIK" önkoşulu (STATE_BOARD.md:5) iken rapor 2 EKSIK ile teslim edildi ve bunları "bilinçli kırmızı, maskelenmiş yeşil değil" olarak savundu (savasa-hazir:17,22,63).
- **Ham hüküm:** "Çekirdek hazır; savaş MAKİNESİ değil" (ordu-dc-dalga34.md:18, doğrulanmış).

## 2. Çekirdek (core/) eksikleri

Ölçüm temeli: 311/311 EXIT=0 (son-kanit.json h=65daa1f x=0, 2026-10-26T01:09), 46 test dosyası (R).

1. **Paseo canlı dispatch etkisiz** — adaptör wire değil; gerçek kapsül üretilmez, outbox boş kalır (fail-closed). core/KULLANIM.md:77,93. Kabul.csv M02 NOT_RUN + MOD HERMETIC. Core'un ana amacı canlıda koşmuyor (K3/Sınıf A).
2. **A14 rapor-dürüstlüğü bulgusu (yeni):** kalıcı-açık defteri (:32) ve SAVAŞA HAZIR raporu "cli.ts'de decide komutu YOK / özellik eksik" yazıyor; oysa `core/src/cli.ts:169-186`'da decide komutu VAR (git -S teyitli, c41c75e'den beri). A14'ün açık kısmı "canlı uç kanıtı NOT_RUN" olarak düzeltilmeli — defter satırı kodla çelişiyor.
3. M17 (V3-S4.4 dar oto-kabul şeridi) modern core'da yok — kabul.csv:43; F7-B NOT_RUN (kabul.csv:90); F0-A arşivde (K4/[insan]).
4. kill-9'un Paseo-ajan ayağı DAEMON otoritesinde — core erişemiyor (dürüst sınır; core/src içinde DaemonClient 0 eşleşme).
5. 8787 portu yabancı süreçte (deepseek-harness) → core panosu kalkarsa EADDRINUSE; çift sunucu 4378/8787 (STATE_BOARD.md:58).
6. B-1 token git'te tracked (YÜKSEK, [insan]); probe.mjs süit kapsamı dışı (BOM bug'ı 299/299 yeşilken latent yaşadı — d4d7f74 ile kapatıldı, kapsam açığı kural olarak açık); KULLANIM §6 CLI komut listesi eksik (§6 yalnız status/stop/resume/tick; cli.ts:107-186 capsule/approve/dispatch/evaluate/decide de taşıyor); kabul %40,9 bilinçli kırmızı; CODEMAP 144>130; kural-proxy 74 (hedef <40); dürtme 197/1138.

KAPALI olanlar (git kanıtlı): BUG-C2/C6 (79a011c + canlı regresyon testleri live-gates-v4:196-379), K6 flake (a2361a1), BOM (d4d7f74), V3-S1.2/S1.4 canlı kill-9 (c12267f), kanal onarımı K-0046(e)/(f) (13c5967), K-0039 84→74 (01:15).

## 3. Plugin hedef-ulaşımı

**Hedef (OVERVIEW.md:3):** REHBER çekirdeğini her yeni ajana otomatik enjekte et (20KB bütçe, kural>80 blok) + disiplini mekanik kancalarla koru.

**ULAŞILDI (R):** enjeksiyon, telemetri (kök .verimlilik/telemetri.jsonl 651.831 bayt, son kayit 2026-10-26T01:46:31Z, pluginSurum=v0.22), loop dedektörü, finish-gate, pitbull 15/20dk, permission polisi, roller, 5 mod+FIRTINA, bekçi 15dk, haftalık rollup W42-W44, pano köprüsü 4378, orkestrasyon (emirler.json/plan.md K-0033), gelen-kutu K-0017. K-zinciri v0.13→v0.22 (10 kilit; K-0025 Güvenlik Üçlüsü, K-0026, K-0027, K-0028, K-0029→K-0041 ONAYLANDI, K-0030, K-0032 FIRTINA+LOC, v0.20 locDelta, v0.21 metrik paketi, v0.22 aktifSn). Kilit doctor 1 OK/0 EKSIK/0 SARI, 345+ assertion (v0.22/KILIT.md:3-8). BK-02 KAPALI (telemetry.ts:57-84 + :282-290 + index.server.ts:208-210; kod v0.23 damgalı).

**ULAŞMADI:** kural diyeti 74 < 80 tavan OK ama hedef <40 açık (K-0039:26); 15 hijyen kalemi v0.22-kilit [insan] kuyruğunda (A2-9..12, A3-9..12, A4-2/3, A6-3/4, D2-11/12/18/20/24); sürüm ucuzyarı: BK-02 kodu v0.23 damgalı ama package.json 0.22.0.

**Yargı:** hedefin büyük bölümü ulaşılmış ve canlı akıyor; eksikler hijyen-test-örneklem sınıfı, yapısal değil. Kilit açılması her sunucu-kodu dokunuşunda [insan] onayı ister (DERSLER 171,172).

## 4. Değer-sıralı plan (özet — ayrıntı plans/UYGULAMA-PLANI-SPRINT-2026-10-26.md)

1. FAZ-4.1 bench taşıma (ertelenemez — F4 silinirse kalıcı kayıp: 24 koşu/702K + ordu-core.zip 2,1MB)
2. B-1 token rotate (YÜKSEK)
3. 4-puan köprüsü: F7-B + A14 zinciri + M17 → kabul %44
4. 6/6 gözlemci N5/N5-2 turu (kullanıcı turu)
5. START → K3 36 satır + F4 silme dalgası
6. K-0047/K-0048 onayları
7. Karar C + ANAYASA A4 (F4 önkoşulları)

FAZ durumu: FAZ-1 6/6 KAPALI · FAZ-2 KAPALI · FAZ-3 5/6 (kalan adım kullanıcıya ait) · FAZ-4 = savaş, BEKLİYOR. Ürün F0-F9: F1-F7-A PASS; F6.5/F8/F9 NOT_RUN (K3 sınıfı).

## 5. Teknik borç / drift / fake green

**Fake green — VAR, 2 aktif sınıf + 1 damgalı:**
- Sınıf A: bekci (bekci.ts:38-42) ve kilit-surum (kilit-surum.ps1:31) saglik'i -Jsonl'siz çağırıyor → Katman B koşmuyor; kapı yeşili ölçümsüz (saglik.ps1:96 koşullu).
- Sınıf B: telemetri-fail kontrolü sağır (bekci.ts:52 toolCalls>0 filtresi; pencere bayat — DERSLER 172; pencere-kayması testi de YOK: A3-10).
- Sınıf C (damgalı, dışlandı): bench success alanı ECONNREFUSED koşumda "success" (GECERSIZ-KOSUM-DAMGASI.md:9-11; append-only dokunulmadan).

**Teknik borç:** 28 ACIK madde (G23, commit 437cc17): 16 plugin v0.22-kilit kuyruğu + 6 script + 3 doc + A1-8 encoding + A5-14 kısmen. Kapanmış sahte-yeşil sınıfları kayıtlı (kabul öz-bildirimi, cacheHitPct, ölü ratchet DERSLER:87, NODE_TEST_CONTEXT DERSLER:169, PID-basildi DERSLER:151).

**Mimari drift (canlı):** CODEMAP 144>130 — eşik İKİ kod konumunda (REHBER §4 L2 + saglik.ps1:54, senkron değişmeli; K-0037'de eşik oynatma REDDEDİLDİ, K-0048 ÖNERİ); BOM karmaşası (A1-8: ANAYASA/REHBER/saglik BOM'lu, admin-onboarding/cekirdek.ts BOM'suz; A5-11: codemap BOM'lu yazar, CODEMAP.md EF BB BF); K-0019/K-0020 "v0.12"ye çakılı TASLAK'lar (D2-27/28); denetim dosyaRef'leri eski ev yollarında (G23 islenme yeni yolla doğruladı — referans katmanı bayat, dosya katmanı doğru); üç kapı üç farklı kirli-ağaç tanımı (A5-9: bekci.ts:109 filtreli, kilit-surum.ps1:26-27 filtresiz, proje-panosu.ps1:55 üçüncü filtre); A14 "komut YOK" hatalı iddiası (bkz. §2/2).

## 6. Agentic güçler ve eksikler (rakip kıyası)

**Rakiplerin çoğunda OLMAYAN gerçek güçler (kod+test kanıtlı):**
- A13 kanıt kapısı: PASS ⟺ exit0 VE test_count>0 — DB tetiğiyle zorlanır (store.ts:221-251)
- K-0046 kanal disiplini: koşum → son-kanit.json birebir; kanal-dışı kapanış ayrı sınıfa düşer
- Kabul kapısı gerçek defterden okur: öz-bildirim %98,6 → gerçek %40,9 dürüst kırmızı (saglik.ps1:127-142)
- Fail-closed evren: UNKNOWN-semantiği (kör re-spawn yasak, U1-U7), fencing token (A36), STOP latch (A16), idempotent komut (A05: farklı payload = tahrifat RED), transactional outbox (A06/A07)
- Gerçek SIGKILL çökme testleri (f3-crash.test.ts), gerçek git-worktree runtime (51/51), gerçek tarayıcı 11/11 render (F7-A, 0 konsol hatası)
- Dürüstlük kültürü: erata, DERSLER negatif-bilgi, (R)/(T) ayrımı, bilinçli kırmızı, 22 halka kopuksuz handoff zinciri

**Eksikler (NOT_RUN sınıfında yaşıyor, kayıtsız değil):** canlı yürütme sıfıra yakın (dispatch→spawn→sonuç→kabul hiç üretimde koşmadı: M02/RT2/INDEP); scheduler runtime yok (SAF mantık+test var, süren servis yok; tek-örnek kanıt 2026-10-12); tek vendor registry (providers.ts:9 yalnız codex); RBAC yerine desen-bazlı izin + tek paylaşımlı pano token'ı; pano salt-okur (karar panodan yapılamaz, KULLANIM §8); bildirim teslim ucu yok (outbox var, gerçek sender bilinçli yok); tek makine/127.0.0.1; 9+ maddelik [insan] darboğazı (bilinçli tasarım, ölçek sınırı); ölçüm körleri (subagentUsage 'bilinmiyor', sandbox yalnız config-kanıtı).

**Özet hüküm:** fevkalade disiplinli, test-ağır çekirdek + çalışan plugin katmanı — üretim orchestrator'u değil. Omurga (kanıt/kapı/dürüstlük) güç; kas (canlı spawn, çok-sağlayıcı, uzak komuta) NOT_RUN ve kası START düdüğü açar.

---

Damga (R): 2026-10-26 05:45 (Get-Date ile ölçüldü — DERSLER 162), ajan = yazıcı sentez (Claude glm-5.3, ordu; 6 salt-okur doğrulayıcı turu), commit = bu kaydın commit'i. Kardeş dosya: plans/UYGULAMA-PLANI-SPRINT-2026-10-26.md (sprint + LOC planı, (T) etiketli).
