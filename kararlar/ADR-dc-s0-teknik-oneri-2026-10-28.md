# ADR — DC-S0 teknik öneri (TASLAK)

**Durum:** TASLAK / ONAY YOK · **Paket:** ATOM-H1-2026-10-28.2 · **Kayıt:** 2026-10-30

## Bağlam

DC-S0a salt-okur keşfi üç sonuç verdi: mevcut worktree/probe/plugin katmanı OS sınırı kanıtı değil; süreç/iptal/kullanım bağları core SQLite ile kalıcılaşmalı; gerçek kullanım kaynağı henüz seçilmedi. Bu ADR yalnız öneridir; imza, sınama, G0, bütçe veya faz başlangıcı onayı vermez.

## Önerilen teknik yön

1. **OS sınırı:** Windows için `restricted token + Job Object + NTFS ACL` aday mekanizması ayrı S0b fixture'ında sınanmalı. İşçi, kullanıcı evi/config/sır ve ortak Git alanına OS düzeyinde yazamaz; test/operatör/imzalayıcı kimlikleri ayrışmalı. Hazır sınır kanıtlanmadan kuruldu denmez.
2. **Kalıcı bağ:** süreç kimliği, iptal nesli ve kullanım mutabakatı core SQLite göçüyle tek otoritede tutulmalı; ham log/usage dökümü doğrulanan artefakt olarak hash bağıyla saklanmalı. İkinci otoriter DB açılmaz.
3. **Kullanım:** gerçek sağlayıcı/runtime ölçüm kaynağı seçilmeden `spent_tokens=KNOWN` yazılmaz. Geçici bağımsız sınır yalnız rezervasyon/kapasite kapısı olarak kullanılabilir; `UNKNOWN` yeni etkiyi bloklar, sıfıra dönüşmez.
4. **R6 kümesi:** yeni Command/Event türü eklenmeden tablo/iç payload bağı tercih edilir. Küme değişimi ayrı insan kararıdır.
5. **Arayüz/write-set:** `gorevler.json`'daki mevcut adaylar esas kalır; bu ADR onaylanırsa yalnızca teyit edilir. Sınıra, göçe veya suite'e yeni dosya gerekiyorsa önce paket revizyonu istenir.

## Pilot A/B/C oracle önerisi

| Oracle | Sahip | Donmuş kabul ölçütü |
|---|---|---|
| A | Güvenilir tester | İki Unicode görev eklenir, listelenir, süreç yeniden açılır; kimlik, metin ve sıra korunur, boş/geçersiz giriş reddedilir. |
| B | Güvenilir tester | A verisi üzerine bir görev tamamlanır, iki kez tamamlama idempotenttir; pending/done filtre ve toplamlar doğru kalır. |
| C | Güvenilir tester | A/B eski verisi dondurulur; bakım/düzeltme istenen sonucu üretir, eski baytlar ve A/B davranışı gerilemez. |

Oracle dosyaları adaydan önce tester tarafından ayrı kökte dondurulur; işçi okuyamaz/yazamaz, eşiği adaya göre değiştiremez.

## On hata ailesi beklenen etkisi

| Hata | Beklenen |
|---|---|
| Yanlış çıktı | Oracle RED; aday FAIL; insan kabulü yok. |
| Sıfır test | Evaluator A13 RED; exit-0 PASS sayılmaz. |
| İşçi ölümü | Ölüm teyidi olmadan FAILED yok; UNKNOWN/kart, teyitli ölümde release ve sınırlı retry. |
| Yönetici ölümü | Yeni dispatch durur; mevcut iş uzlaştırılır; insan kartı açılır. |
| Çift gönderim | Outbox/idempotency tek niyet; ikinci spawn RED/DUPLICATE. |
| STOP/restart | Yeni dış etki kapalı; uzlaştırma/iptal bakımı sürer; resume ayrı onay. |
| Teyitsiz iptal | Reservation/kapasite serbest kalmaz; `CANCEL_CONFIRMED` olmadan kapanış yok. |
| Eski sahip yazısı | Fencing mismatch; commit/evidence RED, yeni nesil sahiplenir. |
| Yanlış repo/commit | Kaynak/sözleşme bağ RED; spawn veya kabul doğmaz. |
| Eksik/aşan kullanım | Yeni etki durur; UNKNOWN sıfır/Known değil; aşma ayrı insan kararı. |

## Kapılar

S0b zararsız OS sınırı izni → G0 insan kabulü → bu ADR'in insan onayı → uygulama bütçesi → F1 başlangıcı → yerel test kapsamı → S4 pilot izinleri. Her kapı ayrı kayıt ister; ajan kendi kapanışını onaylamaz.

## Reddedilen alternatifler

- Worktree/PATH kontrolü veya statik capability bayrığını OS sandbox saymak.
- Usage artefaktını ikinci otoriter defter yapmak.
- Bilinmeyen tüketimi sıfır/tahmine çevirip kapasite açmak.
- Adaydan sonra oracle/eşik güncellemek.
- R6 kümesini onaysız genişletmek.
