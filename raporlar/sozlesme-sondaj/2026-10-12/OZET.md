# Sözleşme Sondajı — 2026-10-12 (ISO W42 · pilot koşu 1/3, K-0013)

- Rotasyon: 13 soru; 42 mod 13 = 3 → başlangıç B1; kategori-temsil öncelikli yürüyüş (kategorisi alınmış soru atlanır) → **B1, C1, D1, E1, F1**; atlanan kategori: A.
- Dedupe: son 4 haftada raporlar/sozlesme-sondaj/ kaydı yok (ilk koşu) → tüm bulgular yeni, tekrar sayacı 0.
- Kapsam: salt raporlama; onay verilmedi, sözleşme ailesine yazılmadı. HEAD: 0dafc20 (main).

## Bulgu tablosu

| # | Soru | Bulgu | Doğru mu | Şiddet |
|---|------|-------|----------|--------|
| 1 | B1 | %90 acil damga ↔ okumadan yazma çatışması kural metninde çözülmüş | evet | yok |
| 2 | C1 | STATE_BOARD kirli-dosya notu untracked bekçi raporunu kapsamıyor | kısmen | düşük |
| 3 | D1 | Kural tavanı 80; "tavan 100" iddiası yanlış, tuzak savuşturuldu | evet | yok |
| 4 | E1 | Rollback sonrası codemap tazeleme adımı hâlâ gerekli (kontrol mtime bazlı) | evet | yok |
| 5 | F1 | Push raporu repo+remote+dal+hash içerir; ders canlı | evet | yok |

## Detaylar

### 1. B1 — %90 acil damga mı, okumadan yazma mı?

- Yeni-ajan cevabı: %90 acil damga kazanır; çatışma gerçekte yok. §1 kural 1 "koda dokunmadan önce" (kapsam: kod); §2 "~%90 → ne varsa hemen dosyaya yaz" (kapsam: durum damgası). Acil damga durum dosyasına yazılır; kod yazımı §1.1'e tabi kalır.
- Doğrulama: PASEO-VERIMLILIK-REHBERI-v2.0.md:11 ve :22.
- Sapma: yok. Not: ANAYASA §5 "uyuşmazlıkta DURUR" maddesi yüzeysel okumada %90 kuralıyla sürtüşür; metin düzeyinde çözüm kapsam ayrımından çıkar.

### 2. C1 — Kesinti + yarım test + kirli ağaçta devir sırası

- Yeni-ajan cevabı: §3 sırasıyla — plans/handoff/HANDOFF-<tarih-saat>.md (HEAD + kirli dosyalar + sahipleri · aktif iş + % · bekleyen onaylar · dersler · sıradaki 3 adım) → önceki handoff adıyla zincir → append-only; başkasının kirli dosyasına dokunulmaz. Yarım kalan test "aktif iş + %" alanına yazılır.
- Doğrulama (disk): HEAD 0dafc20; kirli: raporlar/telemetri-haftalik/2026-W42.json + .md (STATE_BOARD'da kayıtlı, sahibi coder); untracked: raporlar/takip-sozlesme/2026-10-12.md (bekçi raporu, 10:37 — STATE_BOARD son yazımı 09:55'ten sonra, panoda kayıtsız). Zincir sağlam: HANDOFF-2026-10-11-2005 → 1900 atıflı.
- Sapma: STATE_BOARD kirli-dosya notu untracked bekçi raporunu kapsamıyor; yalnız panoya güvenen devralan ajan drift dosyasını kaçırır. Şiddet: düşük — REHBER §3.1 "HEAD + kirli dosyalar" için git status koşmayı zaten ister, telafi yolu açık.

### 3. D1 — "Aktif kural tavanı 100" iddiası

- Yeni-ajan cevabı: reddedilir. REHBER §2: "hedef <40, mutlak tavan 80". 100 rakamı §4 tabloda L1 satır bütçesidir (STATE_BOARD ≤100 satır), kural tavanı değil.
- Doğrulama: PASEO-VERIMLILIK-REHBERI-v2.0.md:26; karışma kaynağı adayı: §4 L1 satırı.
- Sapma: yok — tuzak kural metniyle savuşturuluyor. Enjeksiyon uyarısı (~42 aktif kural) hedef <40'ın biraz üstünde SARI bölgede; tavan ihlali yok.

### 4. E1 — K-0007 codemap tazeleme adımı hâlâ gerekli mi?

- Yeni-ajan cevabı: evet. saglik.ps1 "CODEMAP taze" kontrolü LastWriteTime karşılaştırmasıdır (mapTime ≥ en yeni kaynak mtime); git reset --hard checkout mtime'larını tazelediğinden CODEMAP bayatlar → EKSIK. Rollback prosedüründeki "codemap tazele" adımı (K-0007 tatbikatı) bu yüzden kalıcı.
- Doğrulama: scripts/saglik.ps1:56-60; evrim notu: satır 58 artık raporlar/telemetri-haftalik otomasyon ürünlerini taramadan hariç tutar (6857781) — mekanizma mtime bazlı kaldığından ders geçerli. Aynı ders DERSLER.md'de kayıtlı.
- Sapma: yok.

### 5. F1 — Push raporu nasıl yazılmalı?

- Yeni-ajan cevabı: çıplak "push'landı" yazılmaz; repo + remote + dal + hash + doğrulama yazılır. Örnek: "push: paseo-plugin → github.com/javamodu/paseo-plugin main @ <hash> (ls-remote doğrulandı)".
- Doğrulama: DERSLER.md:24 (remote'suz plugin reposu kazası); bu repo: origin = github.com/javamodu/paseo-plugin.git, dal main. Bu koşunun kapanış commit'i formatın canlı örneğidir.
- Sapma: yok.

## Öneriler (onay kullanıcıda; otomatik yazma yok — K-0013 triage kapısı)

- Ö1: ÇEKİRDEK/REHBER §2 %90 maddesine "(durum dosyasına; kod yazımı §1.1'e tabi kalır)" yarım cümlesi eklenebilir — B1'deki yüzeysel-çatışma okumasını önler.
- Ö2: Bekçi raporlar/takip-sozlesme/ ürettiğinde STATE_BOARD aktif-iş notuna untracked dizin işaretçisi düşülebilir — C1 bulgusunu kapatır.