# A0 DALGASI — 6 SUBAGENT ORGANİZASYONU (2026-10-27 10:25)

[insan] onayı: "plana onay veriyorum A0-2'den aç + A0-5'i paralele forla; K1 zamanlaması kararını sen ver; kural sadeleştirme kartını bugüne al." · Tetik: kritik zincir A0-2→A0-3→A4 + A0-5 paralel (kullanıcı-değer şampiyonu). Bu dosya dalga SSOT'idir; briefler burada yaşar — devralan oturum buradan spawn eder.

## 1. Replan gözlemsel ölçümü (A2 motorunun İLK CANLI KULLANIMI — 10:17, (R))

- **DRIFT**: 6 tarandı / 0 tutarlı / **14 bayat hücre** (PLAN §18 Durum hücreleri kabul.csv gerçeğinin gerisinde: "tasarım tam; UYGULAMA-EKSIK" vs PASS/GECTI_HERMETIC) · 9 satır eşleşmeyen (ölçüm dışı, dürüst listelendi).
- **SAPMA**: gerçek **%90.1** (109/121 yeşil) vs hedef 70 → **sapma −20.1; eşik 15 aşım YOK** — kabul hedefin 20 puan üstünde; replan tetiklenmedi (tetikleyen: bayat-satır sınıfı).
- **Taslak rpl-03579e06** pending (tetik drift-bayat-satir; 6 öneri — 6 §18 Durum hücresi tazeleme). [insan] onayı: `node src/cli.ts replan --onay rpl-03579e06 --confirm "REPLAN ONAYLIYORUM"` (core/ dizininden).
- **BULGU (R) — replan taslak yüzü idempotent DEĞİL**: çift gözlemsel koşum 2. yinelenen taslak doğurdu (rpl-079a6c50, aynı 6 öneri; ölçüm kaydı icerikHash'le özdeşleşti ✓ — A2 tasarımının o yüzü çalıştı). Çöp yinelenen kayıt pre-commit silindi (üretim kayıtlarına dokunulmadı; bu dosya ifşa kaydıdır). Onarım: kural motorunun **B7 eş-taslak imzası** replan.ts'ye genellenir (A0 dalgası içi kalem, ayrı testle). DERSLER'e işlendi.

## 2. K1 zamanlama KARARI (bana devredildi — bu dosya kayıttır)

**Savaş kapanışı: bugün ~20:00 hedefi; 15:30 TETİK KONTROLÜ.**

- Gerekçe: kalan plan (T) **1410 kod / 670 test** (18 açık düğüm); dünkü ölçülen hız ~226 satır/saat → saf ~6,2 saat; kanıt üçlemesi + kanal disipliniyle gerçekçi **8-10 saat**. 10:25'ten 20:00'a sığar; ANA risk tek kanal-flake dalgası / [insan] kartı gecikmesi.
- **15:30 tetiği (ölçümlü, umut değil):** A0-2 KAPALI değil VEYA A0-5 entegrasyonu askıdaysa → **descope paketi [insan]'a sunulur**: K1 bağımlılığı A1,A2,A3,A4+EK1-3,EK1-6 (EK1-1/2/4/5 ERTET-V1.1; fark 440 kod/190 test); graf değişikliği replan taslağı + [insan] onayıyla.
- Not: A0-1/A0-4 graf SSOT gereği K1 bağımlılığı DEĞİLDİR (senaryo düzyazısı "tüm A+EK" der; graf makinesi A1,A2,A3,A4+EK1-1..6 der — **graf kazanır**) → zaten V1.1-lenebilir, replan gerekmez.
- K1'in kendi [insan] kartı (kilit tag onayı v0.24+) kullanıcıda kalır — zamanlama kararı operatörün, onay insanın.

## 3. 6-subagent organizasyonu (EK-3: brief 4 öğe; paralel yazıcı tavanı 3; commit+kanal TEK ELDEN operatörde)

| # | Ajan | Rol | Ne zaman | Somut çıktı |
|---|---|---|---|---|
| 1 | **W-A0-2** | yazıcı | ŞİMDİ (arka plan) | supervisor.ts uzatma + a0-2-sweep.test.ts; **asılı run 3→0** metric |
| 2 | **W-A0-5** | yazıcı | ŞİMDİ (arka plan) | local-runtime.ts+providers.ts büyütme + a0-5-lrt.test.ts; **Paseo'suz duvar-süresi** metric |
| 3 | **K-SADE** | analiz (gelen-kutu yazarı) | ŞİMDİ (arka plan) | v7-kural-sadelestirme öneri paketi → [insan] 15-30 dk karar turu |
| 4 | **DENETÇİ** | doğrulayıcı | kod iner inmez | A0-2+A0-5 adversarial inceleme → bulgu listesi + DÜZELT-İLE-DEVAM/RED (B1-B7 deseni) |
| 5 | **METRİK/TESTER** | doğrulayıcı | entegrasyonda | bağımsız sayım + gözle-görülür metrik satırları (kanıt raporlarına) |
| 6 | **W-A0-3** | yazıcı | A0-2 KAPALI olunca | gozetimsiz.ts+daemon.ts: rozet 4/6 bayrak → besleme; +60 test |

A4 (200/100, [insan] gece-modu açılış kapısı) — A0-3 kapanınca; devralan oturum veya operatör. K1 = Z1 + kilit tag.

**Dosya sahipliği (çakışma yasağı):** W-A0-2 → yalnız `supervisor.ts` + kendi testi · W-A0-5 → yalnız `local-runtime.ts` + `providers.ts` + kendi testi · K-SADE → yalnız `raporlar/gelen-kutu/v7-*` · **ORTAK dosyalar (cli.ts, package.json test zinciri) OPERATÖRE aittir** — yazıcılar dokunmaz · yazıcılar COMMIT YOK (tek elden) · paralel yazıcının kirli dosyalarına (HANDOFF listesi) dokunma YASAK.

## 4. Metrik katmanı — her dalganın kanıt raporunda 1 "gözle-görülür ölçüm" satırı

A0-2 → **asılı run sayısı N→0** (başlangıç (R): defter RUNNING=3; kira-dolma taraması) · A0-3 → **beslenen rozet bayrağı 4/6** · A0-4 → gönderilen gerçek bildirim sayısı · A4 → **otonom tur sayısı + ortalama süre** · A0-5 → **Paseo'suz koşum duvar-süresi** (ilk gerçek CLI koşumu). Rakamla biten cümle yoksa dalga teorik sayılır.

## 5. [insan] kartları — bugünün sırası

1. **Kural sadeleştirme** (EN ACİL — tavan 80 DOLDU, iniş askıda): K-SADE paketi inince 15-30 dk karar turu; headroom açılmadan A3'ün ürettiği akış yarı yolda.
2. **K-0044** (~15 dk — kullanıcının 10 alan yalnız-isim listesi hazır).
3. **D-1b ELLE TEST** (5 dk — pano bat → kart + kırmızı yüz).
4. **rpl-03579e06** replan onayı (gözlemsel — 6 §18 hücresi; yukarıdaki komut).
5. A4 açılışında gece-modu [insan] düdüğü · K1 tag onayı (v0.24+).

## 6. Kapanış protokolü (her kod dalgası — A3 deseni)

Yazıcı teslim → DENETÇİ hüküm → düzeltmeler → operatör wiring (cli.ts/package.json) → tam süit + **kanal** (test-kanal.ps1, etiket a02-sweep / a05-lrt) → kanıt raporu (metrik satırı zorunlu) → kabul.csv satırı → graf vNext (düğüm KAPALI + gecmiş + ölçümlü kalan) → STATE_BOARD damga → Z1 (codemap+saglik) → commit (dosya adıyla, tek elden). Koşum dalgaları kanal taşımaz (M02/S1 emsali); kod dalgaları taşır.

## 7. Başlangıç envanteri (R, 10:25)

- Defter: runsDurum ACCEPTED 5 / READY 4 / RUNNING 3 (asılı adaylar — A0-2'nin N başlangıcı).
- Mevcut modüller: supervisor.ts 345 · local-runtime.ts 81 · providers.ts 80 · daemon.ts 175 · gozetimsiz.ts 56 (skeleton→büyütme dalgaları; greenfield değil).
- Süit: 409/409 yeşil (kanal x=0, sureSn=86, yük %73). Kabul %64=78/121. KAPALI 6/24. kural.jsonl 9 kayıt (tavan dolu). replan.jsonl 2 kayıt (ölçüm + pending taslak).
