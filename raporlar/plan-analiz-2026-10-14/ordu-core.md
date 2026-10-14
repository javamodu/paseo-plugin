# ordu-core — Derin Analiz ve Puanlama (v3.2 çerçeve)

- Tarih: 2026-10-14 · Analist: codex (derin inceleme, salt-okur — pakette hiçbir dosya değiştirilmedi)
- Hedef: `D:\Vibecode\silinecek-task-graph\ordu-core` (git reposu DEĞİL — commit hash kanıtı yok; disk durumu tek kaynak)
- Kapsam: 18 src dosyası (~1.652 LOC ürün), 14 test dosyası (102 test), 2 SQL migration, probe kanıtı

## Zorunlu Doğrulamalar

1. **npm test:** `node --test` 14 dosya → **102 pass / 0 fail / 0 skip**, exit 0, ~16.2 sn (R — bu oturumda yeniden ölçüldü). Ana ajanın "83/83" ölçümü BAYAT: güncel gerçek 102/102 (README de 102 diyor, diskle uyumlu).
2. **Eski bulguların güncel durumu:**
   - *migration/reopen* → **KAPALI.** `src/store.ts` openStore'da `PRAGMA user_version` damgasıyla idempotent migration; restart testi (`V3-S1-restart`) dosya-defterinde STOP latch'in reopen sonrası korunduğunu kanıtlıyor.
   - *idempotency conflict* → **KAPALI (küçük artıkla).** `002-hardening.sql` UNIQUE index `commands_idem` + `001` trigger `command_payload_immutable` (`command_id_conflict`); A05/A05-b testleri yeşil. Artık: INSERT-çakışması DUPLICATE yolunda payloadHash karşılaştırması YOK — aynı key + farklı payload sessizce DUPLICATE döner (aşağıda Açık-2).
   - *dispatcher claim* → **KAPALI.** `src/dispatcher.ts` gerçek implementasyon: SENDING niyet-kaydı spawn'dan önce, UNKNOWN'da kör re-spawn yasağı, `reconcileUnknown` (SENDING→UNKNOWN yükseltme, ALIVE/DEAD yolları), STALE/FATAL terminasyonları; 6 dispatcher + 6 closure (U1–U7) testi.
   - *receipt güven zinciri* → **KAPALI ve bağımsız doğrulandı.** `src/capabilities.ts` loadVerifiedProbe: canonical sha256 + şema/tür + 24s tazelik + boolean-zorlama + blocked≡false-yetenekler tutarlılığı. Bu oturumda receipt hash'i bağımsız yeniden hesaplandı: **MATCH** (`da7b7353…cae96`). Tahrifat/bayatlık/tutarsızlık negatif testleri mevcut.
3. **LocalLauncher gerçek impl.:** **VAR.** `src/git-worktree-launcher.ts`: gerçek `git worktree add --detach`, detached süreç spawn, pid DURABLE JSON registry'ye yazılmadan return yok, restart'ta geri okuma, `process.kill(pid,0)` liveness, kill. Testler gerçek git + gerçek süreç koşturuyor (harcamasız RT.1). Provider CLI uçtan-uca (RT.2) bilinçli olarak YOK — README'de NOT_RUN ilan edilmiş.
4. **paseo-adapter session-id parse kanıtı:** **KOD VAR, KANIT YOK (bilinçli).** `src/paseo-adapter.ts` makePaseoTransport stdout'un SON satırını session id sayar; kod yorumu bunun kanıtsız varsayım olduğunu açıkça yazar ve `structuredOutput` blocked olduğu sürece B02 gate spawn'ı zaten engeller. Yani kör uç değil, gate-arkası placeholder — dürüst fail-closed.
5. **Testli vs testsiz sınırlar:** Hermetik testli: kapalı komut/olay sözleşmeleri, store kapıları (A01–A16, A35/A36, A05/A06/A07), dispatcher belirsizlik semantiği, closure U1–U7, evaluator protokolü (allowlist + testCount>0), CLI sürtünme kapısı, local-runtime gate'leri, mod damıtma, telemetri KPI. **Testsiz canlı sınırlar (bilinçli NOT_RUN):** canlı Paseo worker spawn (B02 blocked listesi düşmeden yasak), provider CLI uçtan-uca (RT.2), kill -9 gerçek-crash provası, çok-process eşzamanlı store erişimi, gerçek ağ hata matrisi.

## Alan Tablosu (0–10; canlı kanıt yoksa tavan 8)

| Alan | Ağırlık | Puan | Gerekçe (kısa) |
|---|---|---|---|
| Teslim | 14 | 8 | 102/102 gerçek yeşil + RT.1 gerçek mekanizma kanıtı; uçtan-uca canlı teslim (RT.2) yok |
| Yetki/güvenlik | 13 | 8 | Fail-closed her yerde: SQL trigger savunması, allowlist evaluator, STOP latch, receipt zinciri, mod damıtma; sandboxEstablished bilinçli false |
| Halüsinasyon/kanıt | 10 | 9 | A13 store kapısı (0-test PASS RED), evaluator protokolü, Y5 "bilinmiyor" dürüstlüğü, kanıt yalnız donmuş adayda — örnek düzey |
| Long-run/recovery | 10 | 7 | U1–U7 + reconcile + fencing + durable registry + restart testi; canlı kill -9 provası yok (ilanlı) |
| İzleme | 8 | 8 | 5+ KPI defterden türetilir, ihlal dedektörleri (onaysız-teslim/kanitsiz-accept/sahte-pass), append-only defter |
| Otonomi | 7 | 7 | Deterministik DAG + bounded repair + WAIT_CAPACITY + otonom reconcile; insan onayı tasarım gereği, canlı otonom koşu kanıtsız |
| Manager | 6 | 5 | Manager "ajan" yok — deterministik supervisor + CLI insan kapısı var; brief/müdahale politikası katmanı kapsam dışı |
| Handoff | 5 | 7 | Tek Handoff DTO, yazma-yolunda zorunlu (dispatchNode RED), 7 test; çekirdek kind setine bulaşmadan |
| Coding | 5 | 8 | Build'siz Node 24 TS, DI-tabanlı testler, neden-odaklı yorumlar; `as any` yaygın, global txDepth (Açık-3) |
| Reasoning | 4 | 7 | Plan-hash determinizmi, bayatlık/fence akıl yürütmesi kodda; LLM reasoning iddiası yok (doğru kapsam) |
| Paralellik | 4 | 6 | Kapasite rezervasyonu + mod ölçekleme (firtina ×2, hardMax tavan); processOutbox LIMIT 1 tekli tüketim, gerçek paralel koşu kanıtsız |
| Schedule | 4 | 5 | deadline_at + next_attempt_at var; cron/zamanlayıcı yok (CLI tick manuel) — kapsam sınırı |
| Memory | 4 | 7 | node:sqlite append-only event defteri + restart kalıcılığı testli; öğrenen/yöneltici hafıza katmanı yok |
| Hız/maliyet | 3 | 7 | Token rezervasyon + usage_unknown≠bedava + maliyet KPI; canlı ölçüm yok |
| Taşınabilirlik | 3 | 6 | Node 24 pin + WIN-NOTES dürüstlüğü + ComSpec fallback; tek platform (Windows) kanıtlı, `process.kill`/shell varsayımları çapraz-platform kanıtsız |

**Ağırlıklı toplam: 73.3 / 100** (Σ ağırlık = 100)

## İlk 3 Açık

1. **Canlı uçtan-uca kanıt yokluğu (RT.2 + gerçek crash provası) — KANIT-EKSIK (bilinçli).**
   - Kod yeri: `README.md` "S1 KALAN" satırı; `src/paseo-adapter.ts` makePaseoTransport (son-satır parse varsayımı).
   - Kabul testi: B02 blocked listesi (worktreeIsolationProven, sandboxEstablished, structuredOutput, usageReporting, cancelConfirm) gerçek provayla düşecek; canlı spawn→SESSION_BOUND→kill -9→reconcile zinciri evidence'a yazılacak.
   - Durum: AÇIK — gate'ler sayesinde risk taşımıyor ama Teslim/Yetki/Long-run puanlarını 8'de mühürlüyor.
2. **Paseo live transport komut-satırı enjeksiyonu (latent) — UYGULAMA-EKSIK.**
   - Kod yeri: `src/cli.ts` defaultAdapter — `` `paseo run … "${o.prompt.replace(/["`]/g, '')}"` ``; `src/paseo-adapter.ts` run() shell=ComSpec.
   - Sorun: tırnak/backtick sıyrılıyor ama cmd.exe'de `& | < > %` aktif kalır; prompt metni komut satırına ham karışır. Şu an B02 gate canlıyı kapalı tuttuğu için patlama yüzeyi yok.
   - Kabul testi: prompt içinde `& calc` / `%PATH%` taşıyan dispatch'te execFileSync arg-array kullanımıyla metnin TEK argüman olarak geçtiği test edilir; shell interpozisyonu sıfır.
   - Durum: AÇIK (gate arkasında, latent).
3. **Küçük bütünlük artıkları — UYGULAMA-EKSIK (düşük-orta).**
   - a) `src/store.ts` `txDepth` modül-global: aynı process'te iki DB handle iç içe `tx` çağırırsa BEGIN/SAVEPOINT karışır (tek-DB CLI'da zararsız, çok-store'da recovery riski). Kabul: iki db ile iç içe tx senaryosu testi.
   - b) `recordCommand` DUPLICATE yolunda payloadHash karşılaştırması yok: aynı idempotencyKey + farklı payload sessiz DUPLICATE döner (submit-anı tahrifatı yakalanmaz; yalnız UPDATE trigger'ı var). Kabul: aynı key + farklı payload → açık `command_id_conflict` hatası testi.
   - c) `reconcileUnknown` ALIVE kolu sentetik `'recovered:'+dispatchKey` session id yazar; sendFollowUp/cancel bu sahte id'ye gider. Kabul: recovery sonrası send/cancel'ın gerçek external id ile çalıştığı entegrasyon testi.
   - Durum: AÇIK — hiçbiri mevcut 102 testi bozmuyor; hepsi küçük yama sınıfında.

## Hüküm

ordu-core, incelenen paketler arasında "kodu gerçekten var" sınıfının net örneği: 102/102 testi bu oturumda bağımsız yeniden koşuldu, probe receipt hash'i dışarıdan doğrulandı, eski dört bulgunun dördü de güncel kodda kapalı (migration user_version, idempotency trigger+UNIQUE, dispatcher tam implementasyon, receipt zinciri hash+tazelik+tutarlılık). En güçlü yanı dürüstlük disiplini — ölçemediğine "bilinmiyor" diyen telemetri, kanıtlanmamış yeteneği blocked listesinde tutan fail-closed gate'ler, kanıtsız parse varsayımını kod yorumunda itiraf eden adapter. Bu disiplin puanı yukarı taşırken aynı zamanda tavanı da dürüstçe mühürlüyor: canlı Paseo spawn, provider CLI uçtan-ucası ve gerçek crash provası bilinçli NOT_RUN olduğu sürece Teslim/Yetki/Long-run 8'i aşamaz. 73.3/100, "güvenilir çekirdek, kanıt bekleyen canlı uç" paketinin adil karşılığı; ilk üç açık da küçük/ortopedik sınıfta — hiçbiri mimari yeniden tasarım gerektirmiyor.
