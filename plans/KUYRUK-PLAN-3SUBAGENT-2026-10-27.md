# KUYRUK PLANI — S1 → A3 → S7 (2026-10-27; 3 salt-okur planlayıcı sentezi, EK-3)

Kullanıcı düdük kuyruğu (2026-10-27): "S1 koş" → "A3 başla" → "S7 koş". Üç maddede birer salt-okur planlayıcı koştu; bu belge sentezin kalıcı kaydı. Kaynak raporlar: planlayıcı çıktıları (bu oturum) + graf SSOT v7.

## S1 — ikinci canlı run (claw-rehber özeti) · [İCRA EDİLİYOR]

- Kapsül **run-32cbfae2** üretim defterinde (kullanıcı terminalinden atıldı — araç Bash'i glm-5.3 sınıflandırıcı kesintisindeydi); ikinci kapsül **run-b0ce3f7e MAHCUR** (çift koşum — planHash aynı çünkü `planHashOf(nodes)`: hedef/repo/commit hash'e GİRMEZ; görev metni kimliği `CAPSULE_CREATED.goalHash` ile kanıtlanır).
- `--commit` türetmesi: **sha256(HEAD-hash-string)** = `75a7c463da9673de5460e376b54a29b8acac3e6ba9409acbc7d76a4f1cbcc54a` (M02'de kısaltılmıştı — dokümantasyon borcu kapandı; kanıt raporunda tam değer).
- Zincir: `approve --run run-32cbfae2 --plan-hash 13075b3e524e5d54c767339a3555639ba4f702c26f7100da49a141382692e89c` → `dispatch` → `ORDU_LIVE=1 tick` (120 sn exec aşımı → UNKNOWN normal; artifact doğana dek ~75 sn arayla tick yinele — reconcile+sentPoll `recovered` bağlar) → TESTER bağımsız sayım → `evaluate --artifact ...hedef-claw-rehber-ozeti.md --expect "TOPLAM:"` → `decide --approve`.
- Sayım semantiği (operatörce sabitlendi): "dizindeki" = **ÜST SEVİYE** .md = **10** (özyinelemeli 27 — `archive\` hariç); PASS: disk=10 ↔ veri-satırı (TOPLAM hariç) ↔ `TOPLAM: 10` birebir.
- Riskler: workspace-DIŞI okuma (D:\Vibecode\claw-rehberleri) canlıda İLK KEZ (çekirdekte dizin zorlaması yok; gerçek sınır Paseo `--mode auto` izinleri — reddi = dürüst RED + Paseo UI'dan izin onayı); oturum evaluate'den önce kapatılmaz (closed=DEAD); plugin echo-kapısı ilk turu yiyebilir (operatör hatırlatması).
- Kanıt: raporlar/kanit-hedef/s1-ikinci-canli-run-2026-10-27.md (iskelet diskte; koşum tablosu dolduruluyor).

## A3 — deneyim→kural derleyicisi · [PLAN HAZIR; dalga düdükle açılır]

- **Semantik:** DERSLER.md'yi deterministik ayrıştır → ders→kural ADAYLARI (sha256 dedup + mevcut kural çakışanı düşer) → **[insan] TOPLU onay** (tek taslakta N aday, tek `KURALLARI ONAYLIYORUM`) → onaylananlar hedef L0/L2 dosyaya append-only + **kural-proxy sayacına giriş**. Tavan 80 kilidi: sayaç+aday>80 → derleyici DURUR, dosya dokunulmaz. **Sayaç şu an 74 → headroom 6.**
- **Kök bulgu:** kural-proxy sayacı `saglik.ps1 §5b`'de (ANAYASA+AGENTS+REHBER liste-satırı; eşik `hedefler.json kuralKirmiziEsik=80`) — A3 sayacı bunun TS ikizi OLMALI (ayrı havuz = çift-sayım drift'i). `scripts/uygunluk.mjs` sayaç DEĞİLDİR.
- **DERSLER taraması:** 175 madde (51 `tarihsiz` + 124 tarihli) + 1 anomali (satır 62: madde başında `-` yok — ADIYLA listelenir).
- **İskelet:** `core/src/kural.ts` ~275 LOC — `derslerOku` / `kuralSayaci` / `adayUret` (≤3 aday/tur) / `openKuralDefteri` (kural.jsonl: icerikHash idempotent + tail-repair) / `hedefEkle` (bayt-bayt koruma) / `kuralOnayla` (onay-metni/aktör/onaylandi-zaten/oneri-yok RED'leri — replan.ts:272-293 disiplini) + cli `case 'kural'` + `core/test/a3-kural.test.ts` (14-16 kırılım: derslerOku 3, adayUret 3, kuralSayaci 2, tavan 2, kapı 5, hedefEkle 2, defter 2-3).
- **Dokunulmaz:** `lessons.ts` çalışma-zamanı ders döngüsü (F6-A/B) — A3 insan-küreli DERSLER→L0/L2 köprüsüdür, ayrı havuz. Eşik/tavan sayılarıyla OYNANMAZ (K-0037/K-0048).
- **Açık [insan] kararları (dalga açılırken):** (1) onaylı kuralın hedef dosyası: AGENTS.md / REHBER §2 / yeni sayılan dosya; (2) headroom-6 politikası: ilk toplu onay ≤5 ile sınırlansın mı / K-0039 sadeleştirme önce mi; (3) aday metin sentezi LLM turunda mı (öneri: CLI ingest yüzeyi, sentez ajan turu).
- **JSON-kazanır:** OTONOMİ "+100 test" vs graf SSOT "+90" → **90** kabul satırına öyle işlenir.
- **Ara kararı (yazıcı):** jsonl yardımcıları 4. kopya olacak (notify/lessons/replan) — ortak `core/src/defter.ts` çıkarımı değerlendirilir (dalganın kapsamını büyütmezse).

## S7 — mini turnuva (2 provider) · [PLAN HAZIR; S1-sonrası]

- **Koşum (S1 kapanışının ardından, SIRALI):** aynı görev metni (S1 kapsülü birebir) İKİ provider'a — P1 `--provider codex --model glm-5.3` çıktı `s7-turnuva-p1-codex.md`, P2 `--provider glm53u-codex --model glm-5.3` çıktı `s7-turnuva-p2-glm53u.md` (tek sapma: çıktı yolu — kıyas için zorunlu, raporda dürüst yazılır). Zincir S1 ile aynı (approve→dispatch→ORDU_LIVE=1 tick döngüsü→evaluate→decide).
- **Mekanizma kodda VAR (R):** 2-provider registry + F6.5-A canlı emsal run-f65iki-30c1dc0a (2 spawn, SESSION_BOUND×2, evaluate PASS×2, APPROVED). 2 eşzamanlı run izolasyonu hermetik VAR (K12-13), canlı 2-run teyit YOK → sıralı koşum açığı kapatır. `turnuva.ts` (F8) S7'de ÇAĞRILMAZ — S7 atasıdır, protokol kapıları yok.
- **Kıyas tablosu (kanıt raporunda; kolonlar P1|P2):** runId/attemptId/approvalId/evidenceId · provider/model · Paseo oturum sessionId+motor · süre (damga ölçülü) · tur sayısı + UNKNOWN→recovered · evaluate verdict+checks · çıktı satır + TOPLAM:N (disk sayımıyla birebir) · bütçe: defter BUDGET_SETTLED + Paseo usage (T) · dürüst sürpriz notları.
- **Dürüst:** CLI evaluate settle'i 0 tokenla yazar — gerçek usage Paseo ajan kaydından manuel alınır, tabloda (T).
- **Kabul satırı sınıfı:** koşum-dalgası (M02 emsali `GECTI_CANLI`, kanal d/h/x'siz koşum kanıtı — kanal koşumu kod+test dalgalarına aittir); GRUP kodu 'SEN' önerisi.
- **--commit:** S1 ile aynı türetme (sha256(HEAD) o anki HEAD üzerinden).

## Ortak notlar

- Kanal pencere stratejisi (kesinti emsali): salt-okur komutlar statik geçer; durum-değiştirenler glm-5.3 sınıflandırıcısına ihtiyaç duyar. Kesintide: busy-wait `node -e` + periyodik deneme; uzun kesintide kullanıcı terminali (D-1a/D-1b emsali).
- Bu belge plan sınıfıdır (0 kod); üretim dalgaları kendi kanıt-üçlemelerini taşır.

Damga: 2026-10-27 ~06:3x (koşum zinciri hâlâ pencere bekliyor; Get-Date ölçümü kapanışta rapora işlenir).
