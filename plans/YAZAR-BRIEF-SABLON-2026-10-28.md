# YAZAR BRIEF ŞABLONU — v8 hız paketi madde 4 (2026-10-28)

Paralel yazıcıya (W-*) verilecek brief'in kalıp dosyası. EK-3 brief standardının (hedef ·
çıktı formatı · araç/kaynak · görev sınırı) üstüne kalite katmanı ekler: yazıcı tam kanalı
beklemeden kendi tarafını saniyeler içinde kırmızı görür; operatör kapanışta tek elden
kanıtla kapatır. Kullanım: bu şablonu kopyala, W-<iş> brief'ine doldur — boş kalan bölüm
kırmızıdır (brief eksik işlenmez).

## 1. Brief gövdesi (EK-3 — zorunlu 4 öğe)

| öğe | içerik | örnek |
|---|---|---|
| hedef | tek cümle + ölçüt dosya/ölçüt satırı | "A4-çekirdek: gece sürücüsü; graf v14 A4 ölçüsü" |
| çıktı formatı | dosya yolları + kanıt kanalı | "src/gece.ts + test; defter gece.jsonl; kanıt raporu raporlar/kanit-hedef/" |
| araç/kaynak | readFiles listesi (bağlam paketi — §2) | "schedule.ts, daemon.ts, gozetimsiz.ts, graf satırı" |
| görev sınırı | dokunulacak ≤3 mevcut dosya + yeni dosyalar + yasaklar | "cli.ts/daemon.ts/package.json; data/* dokunulmaz" |

## 2. Bağlam paketi (readFiles) — minimal SSOT zinciri

Yazıcıya tam repo TARAMASI VERİLMEZ (okumadan-yazma kuralı zaten bunu ister). Brief'te
yalnız işin dokunduğu dosyalar + sözleşme kökleri listelenir: iş hedefi dosyaları,
ilgili SSOT bölümü (graf satırı / ADR), DERSLER'deki ilgili ders satırları. Liste
brief'te ad ad yazılır; "repo'ya bak" brief'i GEÇERSİZDİR.

## 3. Pre-flight sonda (yazıcı ilk turda, ~30 sn)

Etkileşim oturumu çalışır ≠ headless çalışır (DERSLER: glm-5.3 SDK sorgu kaynağına kapalı —
W-A0-3 1. denemesi 11 dk sonra API-400 ile öldü). Yazıcı işe başlamadan TEK minimal
headless istek koşar (model yanıtı 1 token yeter). Sonda kırmızıysa brief sahibine döner —
kod yazılmadan ölçülür. Bu, probe.mjs'in CLI-varlık sondasıyla karışmaz: probe ortamı
sorgular, sonda ÇALIŞMA YOLUNU sınar.

## 4. Donmuş arayüz sözleşmesi

Brief'te yazıcının uygulayacağı/dokunacağı arayüzler (metod imzaları) ad ad yazılır.
Sözleşme değişecekse B8 kırımı (arayüze metod eklendi, taşıyıcı güncellenmedi) riski
vardır — artık `npm run tip` (~6 sn, ratchet taban çizgisi 51) bunu tam süitten önce
kırmızı düşürür. Yazıcı akışında tip kapısı commit öncesi zorunludur.

## 5. Yazar akışı (tur içi — tam kanal YOK)

1. pre-flight sonda (§3) → kırmızıysa dur, brief sahibine dön.
2. bağlam paketini oku (§2) — okunmayan dosyaya yazma yasak.
3. kod + hedefli test (yalnız dokunulan bileşenin test dosyası).
4. `npm run tip` (core/ dizininden) — YENİ-TIP-HATASI exit 1 = dur, düzelt.
5. `node --test test/<hedef>.test.ts` — hedefli süit yeşil olmalı.
6. teslim raporu (brief'in çıktı formatına göre) + kirli dosya listesiyle devir.

## 6. Operatör akışı (dalga kapanışı — tek elden)

1. `npm run tip` + TAM KANAL `scripts\test-kanal.ps1 -Etiket <dalga>` (tek koşum; x=1
   ise 2. koşum — bilinen yük-flake sınıfı, kanıt raporunda adıyla).
2. kanıt raporu (raporlar/kanit-hedef/) + kabul/graf satırları (RBT önkoşulu değilse).
3. tek elden commit: dosya adıyla add, `git commit -F`, push'a `2>&1` YOK.

## 7. Yapılmayacaklar (v8 öneri paketinden aynen)

- Test adedi/süit üyeliği kırılmaz (hedefli test = ayrı koşum, süitten çıkarma değil).
- Eşik gevşetilmez (timeout/sayı yükseltme = kırmızı; kök neden çözülür).
- Bağımsız doğrulayıcı (ayrı tester) atlanmaz.
- Sahte yeşil yok: fail-closed davranış testten düşürülmez.
