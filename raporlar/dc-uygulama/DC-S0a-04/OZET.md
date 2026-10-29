# DC-S0a-04 — TASLAK ADR, pilot oracle ve kapı bağları (salt-okur)

**Kimlik:** DC-S0a-04 · ATOM-H1-2026-10-28.2 · **2026-10-30T01:23:02.493+03:00**

## Üretilen TASLAK

**ADR:** `kararlar/ADR-dc-s0-teknik-oneri-2026-10-28.md`  
**SHA-256:** `a499e3b0b7028b6f13f1a3b89d46da782feb157489c20b13d13cde1be38d8209` · **Byte:** 3840

ADR; Windows sınır adayı (`restricted token + Job Object + NTFS ACL`), core SQLite kalıcı bağ tercihi, artefaktın yalnız hash bağlı kanıt rolü, gerçek usage kaynağı seçimi ve R6 kümesinin onaysız genişletilmemesi önerisini taşır. **TASLAK/onaysızdır.**

## Pilot A/B/C oracle

- **A:** Unicode görev ekleme/listeleme ve süreç yeniden açma sonrası kalıcılık; boş/geçersiz giriş RED.
- **B:** tamamlama + durum filtresi + doğru toplam; yinelenen tamamlama idempotent; A davranışı gerilemez.
- **C:** eski A/B verisi donar; bakım/düzeltme yeni sonucu üretir, eski baytlar ve A/B regresyonu korunur.

Üç oracle da **güvenilir tester** tarafından adaydan önce ayrı kökte dondurulur; işçi okuyamaz/yazamaz.

## On hata ailesi

ADR'de her aile için beklenen etki tanımlıdır: yanlış çıktı, sıfır test, işçi ölümü, yönetici ölümü, çift gönderim, STOP/restart, teyitsiz iptal, eski sahip yazısı, yanlış repo/commit, eksik/aşan kullanım. Ortak ilke: belirsizlik insan kartı/UNKNOWN olarak kalır; kırmızıyı yeşile boyayan bir kapı yoktur.

## Tasarım sorusu bağları

| Grup | ADR yanıtı / durum |
|---|---|
| S0b OS sınırı | Aday mekanizma ve taklit kökler tanımlı; kesin komut/hesap/izin kapsamı insan onayı olmadan **BLOCKED** kalır. |
| S0b usage | Gerçek kaynak yok; rezervasyon yalnız bağımsız geçici limittir. Kaynak seçilmezse G0 açık, yeni etki yok. |
| S1 sözleşme/göç/arayüz | Sürüm + Git nesne algoritması + core göç + tek başlatıcı arayüzü önerildi; onay bekler. |
| S1 pilot/operatör | Operasyonel giriş envanteri ve gerçek OS/IPC doğrulama ayrı insan kararı; CLI aktör metni sınır sayılmaz. |
| S3 yaşam/kullanım | Süreç kimliği, nesil, iptal ve mutabakat core tablolarına bağlanmalı; gerçek sağlayıcı ölçümü `LIVE_SPEND` ile ayrı doğrulanır. |
| S2 mühür/test/imza | Yazma kapanışı, korunan runner/oracle ve yetkili üretici/anahtar sınırı ADR'ye bağlı; genel PKI önerilmez. |
| S4 pilot | Ayrı pilot kökü, donmuş oracle, insan teslim kayıtları, hata enjeksiyonu ve izole geri dönüş penceresi onay bekler. |

## Kapılar

S0b zararsız sınama izni, G0, ADR onayı, uygulama bütçesi, F1 başlangıcı, yerel test kapsamı ve S4 pilot izinleri ayrı insan kapılarıdır. Bu fiş yalnız öneri üretir.

## Gözlemler

- **P1:** Sonraki görev tasarım soruları yukarıda yanıt ya da gerekçeli BLOCKED/onay-bekliyor durumuna bağlandı.
- **P2:** A/B/C oracle tanımları ve on hata ailesinin beklenen etkileri ADR'de adaydan önce donacak şekilde tanımlandı.
- **N1:** İmza, sınama, G0, bütçe veya faz başlangıcı ajanca onaylanmadı.
- **N2:** Yeni command/event türü veya ikinci otoriter DB önerisi onaysız uygulanmadı; gorevler.json write-set genişletilmedi.

## Sonuç

**Durum:** `EVIDENCE_RECORDED` — TASLAK öneri ve kanıt kaydıdır; ürün PASS veya insan kapısı değildir.
