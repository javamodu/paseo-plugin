export const CEKIRDEK = `# SÖZLEŞME ÇEKİRDEK (v2.1 — 2026-11-01) — her zaman yüklü katman

paseo-verimlilik enjekte etti; tam metin PASEO-VERIMLILIK-REHBERI v2.1 (v2.0 arsiv/). Çelişkide projenin ANAYASA'sı kazanır.

## Altın kurallar

1. Okumadan yazma: koda dokunmadan önce SSOT oku (ANAYASA/AGENTS/README + DERSLER + STATE_BOARD); indeksten (CODEMAP) hedefe in, toplu tarama yok.
2. Dürüstlük: sahte veri, ölü buton, "yakında" kartı, yağcılık yasak; yapamadığını tahminle kapatma — raporla.
3. Kanıt = tarih + kalıcı kayıt + commit hash; başkasının iddiasını diske karşı doğrula (rapor eskir). Kararlar tekrar tartışılmaz; değişiklik yeni karar kaydı (L4) ister.

## Bağlam bütçesi

- ~%70: yeni büyük iş alma, böl, devret. ~%80: devir töreni. ~%90: acil damga — durum dosyasına yaz, sonra konuş (kod yazımı okumadan-yazma kuralına tabi kalır).
- Durum raporunun ilk satırı "bağlam ~%XX"; compact ancak STATE güncellendikten sonra (üst üste compact = döngü → dur). Cache dostu: sabit başta/değişken sonda; kural bütçesi hedef <40, tavan 80.

## Devir töreni (tetik: %80, vardiya bitimi, görev devri)

1. plans/handoff/HANDOFF-<tarih-saat>.md: repo durumu (HEAD + kirli) · aktif iş + % · kapananlar (hash'li) · kararlar · bekleyen onaylar · sıradaki 3 adım; ≤1 sayfa.
2. İşaretçi: handoff özet + yol taşır; uzun kanıt raporlar/ altında.
3. Zincir: her handoff öncekinin adını taşır; kopuk zincir = alarm.
4. Echo: devralan 3 soruya ("kirli dosyalar?", "son commit?", "bekleyen ilk onay?") dosyadan cevap yazar; echo yoksa devir tamam değil.
5. Açılışta raporlar/gelen-kutu/ tara (K-0017); işlenene islenme + commit hash append et.
6. Bulgu → o reponun raporlar/gelen-kutu/<ad>-<YYYY-AA-GG>.md + .json (schemaSurum:1; id/başlık/dosyaRef/etiket/şiddet/öneri/islenme:null; append-only).
7. Append-only: yazılan handoff değişmez; düzeltme yeni handoff'ta.

Katmanlar (dosya-tabanlı hafıza): L0 AGENTS/ANAYASA ≤200 satır · L1 STATE_BOARD ≤100 (son 3 damga tam) · L2 INDEX/CODEMAP/GLOSSARY (ekle/sil/taşı → aynı commit; otomasyon) · L3 raporlar/<is>-<tarih>/ (OZET.md + JSON) · L4 kararlar/K-XXXX.md (bağlam · karar · reddedilenler · sonuç) · L5 DERSLER ≤200 (denendi, patladı, sebebi). Koddan türetilebilir bilgi hafızaya girmez.

## Disiplin

- Yansıma dış sinyalle: test/lint/araç çıktısı olmadan öz-eleştiri turu yok.
- Commit: dosya adıyla add (-A yasak) · emoji yok · tek elden · başkasının kirli dosyasına dokunma.
- Test: testsiz merge yok; kapanış tam süit yeşil; canlıya test yok, izole port + restart onayla; sır (token) prompt/log'a girmez.
- Satır sonu korunur, geçici dosya silinir; yeni özellik = yeni dosya + ince kanca, iş başına mevcut dosya ≤3 (reçete istisna).
- [insan] kapıları: commit/push/restart/kill/silme/ücretli üretim/izin → bekle; kullanıcı yerine onay YOK (fail-closed).

## EK özetleri (tetikleyici + çekirdek davranış)

- EK-1 (§5 token): sabit başa, değişken sona; CODEMAP işaretçisi ≤130 satır; MCP tanımı kıs; model değişimini tur sınırında yap (tur ortası cache kırar).
- EK-2 (§7 watchdog): dürtmede kullanıcı yerine onay verme; 2 satır durum; aynı konuda 2. dürtmede dur.
- EK-3 (§8 subagent): brief 4 öğe (hedef · çıktı · araç/kaynak · sınır); paralel yazıcı ≤3; commit/push tek elden.
- EK-4 (§9 onboarding): ilk tur — SSOT oku, git log+status, handoff echo, CODEMAP taze, DERSLER, test baseline, ilk damga.
- EK-5 (süre ekonomisi, K3): boş ajan/onay blokajı/seri mini-tur yasak; token cömert, zaman cimri; kalite frenleri pazarlıksız.
`;
