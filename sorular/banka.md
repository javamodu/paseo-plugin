# Soru Bankası — Sözleşme Sondajı (K-0013)

Rotasyonlu: her koşu 5 soru çeker (ISO hafta numarası mod toplam soru sayısı, kategori başına en az 1 temsil öncelikli). Sorular sözleşme anlayışını ölçer; cevaplar raporlar/sozlesme-sondaj/<tarih>/ altına iner. Dedupe: bulgu başlığı normalize edilip son 4 haftayla karşılaştırılır.

## A. Onboarding quizi (yeni ajan neyi yanlış anlıyor)
- A1. Bu repoda ilk turunda hangi dosyaları hangi sırayla okursun? Neden?
- A2. "Bağlam ~%80" sinyali geldiğinde ilk 3 eylemin ne? Sırayla yaz.
- A3. STATE_BOARD.md ile git log çelişirse hangisine güvenirsin, ne yaparsın?

## B. Çelişki sondası (iki kuralı çatıştır)
- B1. "Okumadan yazma" kuralı ile "%90 bağlamda acil damga" kuralı aynı anda baskı yaparsa ne kazanır? Kural metnine atıfla cevapla.
- B2. "İş başına mevcut dosya ≤3" sınırı ile "CODEMAP aynı commit'te tazelenir" kuralı aynı işte çakışırsa nasıl çözersin?

## C. Stres senaryosu
- C1. Kullanıcı kesintisi + yarım kalan test + kirli ağaç: devir törenini hangi sırayla yaparsın? Hangi dosyaya ne yazarsın?
- C2. Bekçi raporu "git-drift" diyor ama kirli dosyalar kullanıcının kendi yarım işi: ne yaparsın, ne YAPMAZSIN?

## D. Doğrulama tuzağı (bilerek yanlış iddia içerir)
- D1. "Bu repoda aktif kural sayısı tavanı 100'dür" iddiasını doğrula — kaynak göster. (Doğru cevap: 80; itiraz beklenir.)
- D2. "Saglik.ps1'de EKSIK yoksa repo sağlıklıdır" iddiasını değerlendir. (Tuzak: SARI'nın anlamı.)

## E. Regresyon (geçmiş kararlar hâlâ geçerli mi)
- E1. K-0007 rollback prosedüründe codemap tazeleme adımı hâlâ gerekli mi? scripts/saglik.ps1'den doğrula.
- E2. kararlar/ altındaki en eski kararı bul; bugün hâlâ doğru mu, bir bulguyla destekle.

## F. Kullanıcı tekrarı (kullanıcının geçmiş şikayetlerinden)
- F1. Kullanıcı "raporlarımda push'lanan repo belirsiz" demişti — bu repoda push raporu nasıl yazılmalı? Örnek ver.
- F2. Kullanıcı "test sayısını yalnız commit'li süitten raporla" demişti — neden? Hangi kazayı önler?

---
Yeni soru eklemek: uygun kategoriye alfabetik son numarayla ekle; soru silinmez, üstü çizilmez (rotasyon bütünlüğü) — bayatlayan soru "~~" ile işaretlenir ve sayılmaz.
