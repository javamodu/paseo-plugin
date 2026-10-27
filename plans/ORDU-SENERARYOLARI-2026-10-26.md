# ORDU CANLI SENARYO DOSYASI — WORKSPACE GERÇEK PROJELERİ (2026-10-26)

> Amaç: kullanıcının ELİNDE, GERÇEK senaryo testi. Kaynak: FAZ-2 tarama (V6: 3/5 tur bugün koşulabilir) + V1 defter durumu (temiz: UNKNOWN 0, PENDING 0). Her senaryo: gerçek workspace projesi + ölçülebilir değerlendirici kanıtı + defter olay zinciri. Kapsül metinleri kopyala-yapıştır hazır.
> Sıra: SIRIF-KOD (bugün, düdükle) → AZ-KOD (~30-60 satır). Her koşum sonrası: kanal üçleme (son-kanit) → defter → kabul satırı.

## SEVIYE 0 — SIFIR KOD, BUGÜN (tek düdük)

### S1 — "İKİNCİ CANLI RUN" (M02 deseni; V6/T2: kod engeli YOK)
- **Hedef proje:** `D:\Vibecode\claw-rehberleri` (salt-okur görev — güvenli ilk gerçek iş)
- **Kapsül (kopyala):** "D:\Vibecode\claw-rehberleri dizinindeki .md dosyalarını listele; her dosyanın İLK başlık satırını (# ...) al ve D:\Vibecode\ordu\raporlar\kanit-hedef\hedef-claw-rehber-ozeti.md dosyasına 'dosyaadı → başlık' formatında satır satır yaz. Dosya sayısı toplamını son satıra 'TOPLAM: N' olarak yaz."
- **Değerlendirici ölçütü (makine):** rapor dosyası VAR + satır sayısı = dizindeki .md sayısı + son satır `TOPLAM: N` ile disk sayımı BİREBİR (bağımsız sayılabilir — sahte-yeşile kapalı).
- **Beklenen defter zinciri:** CANDIDATE_FROZEN → EVIDENCE_RECORDED → BUDGET_SETTLED → ACCEPTED (run-89eed2dd emsalinde canlı görüldü).
- **Kapı:** [insan] "koş" · **Süre:** ~5-10 dk.

### S2 — "EŞZAMANLI İKİLİ" (K13-C deseninin gerçek-proje versiyonu)
- **Hedefler:** iki BAĞIMSIZ kapsül — S1'in aynısı iki farklı dizine: `D:\Vibecode\LMS` ve `D:\Vibecode\website`
- **Değerlendirici:** iki ayrı rapor dosyası, iki run ACCEPTED, defterde oturum/bütçe/çıktı AYRIMI görünür (K12 son senaryosunun canlı tekrarı).
- **Kapı:** [insan] "koş" · **Süre:** ~10-15 dk.

### S3 — "STOP/DURDUR — KESİNTİ SENARYOSU" (kullanıcı eli)
- **Akış:** S1 kapsülünü koş → ajan çalışırken **pano'dan durdur** (köprü 4378 canlı — DERSLER 164 sonrası uç sağlam) → defteri izle: CANCEL_REQUESTED → teyit → yeni kapsülle yeniden koş → tamamla.
- **Kanıt:** iptal zinciri defterde + kör çift iş YOK (aynı iş iki kez yapılmaz) + ikinci run ACCEPTED.
- **Kapı:** [insan] (sizin ellerinizle) · **Süre:** ~10 dk.

### S4 — "GÖZLEMCİ TURU" (N5/N5-2 deseni; KULLANICI oturumu)
- **Akış (kendi Claude oturumunuzda):** (1) son-kanit.json ↔ git log ↔ damga birebirliği; (2) S1'in raporunu kendiniz sayın — değerlendiriciyle aynı mı; (3) 3 drift izi (PLAN §18 P1-9/P2-10 + kalıcı-açık 2 bayat satır) diskte teyit.
- **Kapı:** KULLANICI · **Süre:** 30-60 dk.

## SEVIYE 1 — AZ KOD (~30-60 satır; uçlar T5'/T4')

### S5 — "DEADLINE BASKISI" (T5' ucu şart: `capsule --deadline`)
- **Kapsül:** S1 görevi + `--deadline 30s` → ajan Kasıtlı yavaş görev (60 sn uyku içerir: "raporu yaz ama 60 saniye beklemeden yazma").
- **Beklenen (deadline.ts canlı ilk tetikleniş):** 30 sn dolunca yeni dispatch RED + RUNNING attempt CHECKPOINT'te kalır + **insan kartı** (approvals'da DEADLINE_CLOSE PENDING görürsünüz) + CRITICAL bildirim (M07) + run ASLA ACCEPTED olmaz.
- **Kod ihtiyacı:** ~30 satır (bayrak + enforceDeadline çağracısı) + ~30 test.

### S6 — "GECE MODU ROZETİ" (T4' ucu şart: pano görünümü)
- **Akış:** S1-S3'ü temiz bitirin → 6 koşulun 1/2/3/5'i defterden zaten yeşil → pano'da rozet görünür (4/6 kanıt bayrağı S3'ün kesinti testinden gelir: junction RED + eski-sahip RED kanıtları taze).
- **Beklenen:** rozet `gozetimsiz-hazir` (tüm kapılar yeşil) veya dürüst kırmızı + ADIYLA nedeni.
- **Kod ihtiyacı:** ~40 satır (pano ucu) + ~30 test.

### S7 — "MİNİ TURNUVA" (F6.5-A commit'i sonrası; tam F8 değil — atası)
- **Kapsül:** aynı görev (S1) İKİ provider'a (glm-5.3 + glm53u-codex) → iki çıktı → değerlendirici ikisini de puanlar → siz kıyaslı tablo görürsünüz.
- **Kanıt:** iki run, iki provider kolonu, bütçe ayrımı — F8'in çekirdek provası.
- **Kapı:** F6.5-A commit'i (paralel yazıcıda bitmek üzere).

## ÖNERİLEN GÜN PLANI (en hızlı yol)

| Sıra | Senaryo | Süre | Kapı |
|---|---|---|---|
| 1 | S1 ikinci canlı run | 10 dk | "koş" |
| 2 | S3 STOP/kesinti (elinizle) | 10 dk | siz |
| 3 | S2 eşzamanlı ikili | 15 dk | "koş" |
| 4 | S4 gözlemci turu | 30-60 dk | siz |
| 5 | S5+S6 kod uçları (ben) | yarım gün | — |
| 6 | S5/S6/S7 koşumları | 15 dk | "koş" |

Bugün 1-4 yapılırsa: **~1,5 saatiniz + sıfır kod** ile sistemin ilk GERÇEK kullanıcı-elinde senaryo paketi kapanır; her biri kabul satırına kanıt bırakır.

---
Damga (R): 2026-10-26 ~11:20, ajan = ana oturum (Claude glm-5.3, ordu). Durum = ÖNERİ — kapılar [insan]; kapsül metinleri koşuma hazır. Kaynak: FAZ-2 sentez + V6 hazırlık raporu + V1 defter sağlığı.
