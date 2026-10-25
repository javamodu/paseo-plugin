# Arayüz planı — az ekran, açık sorumluluk
## Ana yüzey
Header: bağlantı/son senkron + global duraklatma/STOP. Metinli nav:
Kapsüller, Kararlar [sayı], Laboratuvar. Ayarlar ikincil.
Kapsül listesi → tek seçili çalışma alanı. Özet/İşler/Kanıt/Geçmiş.
Default graph yok. Ajan, queue ve outbox global menü değil; ilgili işin teknik detayı.

## Kapsül özetinin beş sorusu
Hedef ne? Şimdi ne oluyor/neden bekliyor? Doğrulanmış ne var?
Hangi sınır kaldı? Benden hangi karar isteniyor?
Özet kısa; en fazla bir karar kartı ve bir birincil eylem.
Kanıtsız progress percentage yok; “2 adım doğrulandı” gibi sayım tanımı açık.
Status türkçe metin + renk; UNKNOWN veya disconnected success gibi görünmez.

## Composer
Varsayılan seçili kapsül bağlamı; yeni hedef açık Yeni Kapsül akışı.
Bağlam label, profil (Ekonomik/Dengeli/Yüksek güvence) ve metin. Model/rol araç ayrıntıları Gelişmiş.
“Plan öner” çalıştırmaz. Taslak → diff/kapsam/kabul/bütçe → ayrı “Planı onayla ve başlat”.
Mevcut run'a mesaj scope değiştirirse replan proposal; sessiz overwrite yok.
Ctrl+Enter öneri gönderir; deploy veya merge tetiklemez.

## Kararlar
Tek queue; kapsül özetinde aynı kararın projection'ı. ID/plan/candidate/action/expiry ve etki görünür.
Buton sonucu durable command ack'ten sonra görünür; network belirsizliğinde pending command göster.
Toplu “hepsine izin ver” yok. Atla, accepted gibi gösterilmez.

## Laboratuvar
Önce test paketi → aday profile → bütçe → küçük batch.
Sonuç: n, accepted/started, first-pass/started, total known cost + unknown count,
completion/rework, safety/recovery kapıları, sürüm ve raw evidence.
Genel tek model leaderboard'u yok. Demo laboratuvarı yalnız NOT_RUN senaryolarını gösterir.

## State UX
Empty/Draft/Running/Verifying/WaitingDecision/WaitCapacity/Paused/CancelRequested/
Cancelled/Failed/Unknown/Accepted/Disconnected/ReadOnly ayrı.
“Son görülen” timestamp; SSE reconnect cursor ile catch-up. Cursor eskiyse tam resync.
Draft model seçimi active attempt profilini değiştirmez.
Görsel review açıkça örnek; gerçek kullanımda UI ile backend receipt ayrımı korunur.

## Mobil ve erişilebilirlik
390px: liste ardından detay; global stop kolay bulunur; drawer yerine doğal expand.
Minimum 44px hedef, 14px küçük yazı, görünür focus, labels ve klavye tabs.
Mobilde çok uzun overview kartları yerine detay disclosure. Yatay page overflow yok.
Demo ui/index.html+app.js+styles.css okunabilir ayrı dosyalardır; backend yok.
Production React bileşenleri aynı davranışı taşır; demo kodu otomatik React app sayılmaz.
