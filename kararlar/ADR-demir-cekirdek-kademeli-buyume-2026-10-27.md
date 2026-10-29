# ADR — Tek ana planın insan kanıtlı, kademeli büyüme revizyonu

**Durum: ONAYLANDI — plan/yönetişim revizyonu.** Tarih: 27 Ekim 2026.  
**Kullanıcı onayı:** “evet bu şekilde yapalım”; önceki yönetici kararı mevcut ana planı kontrollü revize etmek, ikinci aktif plan oluşturmamaktı. Bu kayıt sohbet onayının kapsamını kalıcılaştırır; yeni teknik test sonucu değildir.

## Bağlam

[`Değerlendirme`](../raporlar/rapor-chatgpt-27ekim.md:383) güvenlik parçalarının tek günlük kullanım yolunda tamamlanmadığını gösterdi. Eski graf gece sürücüsünü bağımlılıkça hazır sayarken yeni öneri önce insan yönetimli somut teslim istiyor. İki aktif sıra işletilmemeli.

## Karar

1. Tek uygulama otoritesi [`PLAN.md`](../plans/PLAN.md) kalır; v2.10 yürütme revizyonunda güncel sıra §25'tir. Hedef ve güvenlik invariant'ları değişmez.
2. Önce DC/F0–F1: tek yerel yol, insan onaylı sınırlar, korunan gerçek testler, somut pilotun üç teslimi. Sonra ayrı faz kapılarıyla sabit plan otomasyonu, stratejik öneri/ölçülmüş öğrenme ve yetki içi deterministik iyileştirme.
3. Plan onayı **uygulama başlatma yetkisi değildir**. İlk planlanan paket DC/F0–F1; kod işi, canlı sağlayıcı/harcama, süreç sınaması, gece modu, kabul ve sürüm/tag kendi açık insan emirlerini bekler. Ajan insan adına onay vermez.
4. Mevcut graf aynı otoriteye hizalanır; eski kapalı düğümler ve kanıtlar korunur. Eski açık paralel işlerin bütçesi yeni bütçeye ikinci kez eklenmez; gece sürücüsünün önüne H1 konur.
5. Yeni sprint kabul satırları yalnız NOT_RUN açılır. Eski PASS/GECTI kayıtları veya kanıt metinleri değiştirilmez. Hedef belgesinin yalnız plan sürüm işaretçisi güncellenir; yetenekler koşmadan “VAR” yapılmaz.
6. Eski ana plan/graf/senaryo bayt kopyaları [`tarihçe`](../arsiv/plan-revizyonu-2026-10-27/README.md) olarak korunur. Taslaklar “ana plana aktarıldı; bağımsız yürütülmez” işaretini alır. Rapor geçmişi silinmez.

## Bütçe ve sınırlar (T)

H1: 1.400 Ordu uygulama/değişiklik + 1.980 Ordu test + 600 ayrı pilot = **3.980 teknik LOC**; yüzde 35 planlama rezerviyle **5.373**, doküman 400 ayrıca. Bütün yol: **9.980 teknik LOC**, rezervli **13.473**, doküman 920 ayrıca. Bunlar süre veya güven düzeyi garantisi değil; kapsam/izolasyon/kullanım varsayımı değişirse yeniden tahmin gerekir.

## Reddedilen alternatifler

- İkinci aktif ana plan: çifte otorite ve farklı gece modu kapıları doğurur.
- Eski planı/kanıtları silip baştan başlamak: çalışan yatırım ve provenansı kaybettirir.
- Plan onayını bütün fazlar için yürütme/harcama izni saymak: insan kapılarını dolanır.

## Sonuç

Yalnız planlama kayıtları hizalanır. Üretim kodu ve çalışma zamanı yetkileri değişmez. Yeni kabul satırları paydada görünür; bu genişleme kalite gerilemesi veya yeni başarı ölçümü olarak sunulmaz. Yürürlükteki sırayı ana plan, seçilebilir işleri onun graf projeksiyonu tanımlar.
