# MASTER-SSOT-PLAN v1.0 TASLAK — puan ve hüküm

> Puanlayan: ordu-v3 operasyon katmanı (takım-lead rolü), 2026-10-14.
> Ölçüt: bu workspace'teki ağırlıklı puan çerçevesi (Requirement Fit %20, UI/K bilişsel
> sadelik %15, Long-runner/Recovery %20, Güvenlik/Bağımsızlık %15, Evrensel
> Entegrasyon %10, Benchmark %10, Sözleşme Bütünlüğü %10). Karşılaştırma tabanı:
> ordu-v3 + ordu-core (51/51 hermetik) + Final ADR-011/ADR-012 kapıları A01–A36.
> GPT'nin kendi taslak değerlendirmesi (6/10) bağımsız referans olarak okundu; bu
> puan ondan türetilmedi, aynı olgular üzerinde ayrı hesaplandı.

## HÜKÜM: 64/100 (~6.5/10) — ONAYLANMAZ olarak mevcut hâliyle; DEVRALMA ile önerilir

Ürün niyeti ve kapalı-küme disiplini güçlü; ancak plan, bu workspace'te **kanıtlanarak
inşa edilmiş** güvenlik/dayanıklılık değişmezlerini (A05–A08, A13, A35, A36; 51/51 test,
1.815 LOC) file-SSOT'a devir ederken onların karşılığı olan mekanizmayı tanımlamıyor.
Bu, puanı en ağır iki kalemden (Recovery %20, Sözleşme %10) çökertiyor.

| Kalem | Ağırlık | Puan | Gerekçe |
|---|---|---|---|
| Gereksinim uyumu | 20 | 15 | Hedef cümle test edilebilir; §7 bağımsızlık tablosu doğrudan kullanıcı emrini karşılıyor; delivery/acceptance zinciri zayıf |
| UI/bilişsel sadelik | 15 | 9 | 5-soru + tek Onay kutusu + tek ACIL DURDUR çok iyi; 11 ekran + tam röntgen VARSAYILAN olarak bununla çelişiyor |
| Long-runner/kurtarma | 20 | 8 | Crash-point semantiği, çok-dosyalı atomiklik, lease/fencing, restart sonrası defter tutarlılığı TANIMLI DEĞİL; STOP≤5sn ölçüm istiyor ama "defter bozulmaz"ın kanıtı yok |
| Güvenlik/bağımsızlık | 15 | 10 | deny-first izin matrisi + `.verimlilik/**` yazma yasağı iyi; worktree≠sandbox, onay-kimliği (accept-hash ≠ auth), secret/control-path izolasyonu yok |
| Evrensel entegrasyon | 10 | 8 | §6 adaptor sözleşmesi planın en iyi bölümü; hata normalizasyonu (auth|kota|zamanasimi|belirsiz) olgun |
| Benchmark/ölçüm | 10 | 7 | Deterministik ölçü + "ajan kendi metriğini ölçemez" + unknown≠ücretsiz doğru; eşlenmiş-deney ve confounder disipliri yalnız §9.4'te imada |
| Sözleşme bütünlüğü | 10 | 4 | Veri dosyaları somut ve round-trip checker parlak; ANCAK yetki çatallaması (SQLite reddi), A13 sahte-PASS kapısının yokluğu, kanıt/kandidat-donma sözleşmesinin olmaması |
| **Toplam** | **100** | **64** | |

## Planın gerçekten iyi olduğu yerler (devralınacaklar)

1. **§6 Adaptor sözleşmesi** — motorun tek bildiği; SDK tipi sızması yasağı; 3 adaptor
   + #3'ün ayrı K kararıyla gelmesi. ordu-v3'ün `WorkerAdapter` arayüzüyle uyumlu,
   ondan daha iyi belgelenmiş (iptal "istek≠teyit", kullanım "bilinmiyor serbest").
2. **§7 Bağımsızlık tablosu** — "Paseo kapalıyken core uyur, ÖLMEZ": bileşen bazında
   davranış tablosu. ADR-012 ile aynı yönde ve ADR-012'nin eksik bıraktığı
   "ne çalışır/ne durur" şeffaflığını veriyor.
3. **§9.2 Kapalı 8 karar-kartı türü + stale kuralı** — yeni donmuş adayda eski kararın
   geçersizleşmesi, ordu-v3'ün inbox kapalı-kümesini tamamlıyor.
4. **§9.1 Mod profilleri** (fırtına/atölye/ekonomi) — mesaj-başına-değil-görev-başına
   seçim sürtünme tercihi doğru.
5. **§5 kapasite-bekliyor yakmasız bekleme + atlandı açık-bağımlılık kuralı** —
   A24/qwen K-0002 mirasını doğru taşıyor.
6. **§8 Checker'ın deterministik olması ve `.verimlilik/**` izin-matrisi yasağı** —
   tek-yazar ilkesi sağlıklı.
7. **§14 soy haritası + §15 açık sorular** — dürüstlük kültürü işaretleri.

## Kritik eksikler (onay koşulları — sıralı)

- **K1. Yetki tekliği ihlali.** §8 "veri sözleşmeleri (DEĞİŞMEZ)" + §13 "SQLite v1'de
  YOK", bu workspace'te 51/51 testle kanıtlanmış SQLite defter hattını (001+002+store)
  reddediyor; ayrıca ADR-012 §7 ve K-0004 denetiminin "ikinci defter YOK (Y1)" sabitesiyle
  çelişiyor. Onay için: ya mevcut defter otorite kalır ve dosyalar yalnız export/draft
  olur, ya da superseding bir ADR + migration planı + file-SSOT'un A05/A06/A07/A08
  eşdeğerlerinin KANIT TEST listesi yazılmalı. İkisi de yoksa plan paralel evren üretir.
- **K2. A13 sahte-PASS kapısı yok.** §2/§6 "yeşil kapı = test+lint+checker" diyor;
  "exit-0 YETMEZ + 0-test PASS olamaz + kanıt yalnız DONMUŞ adaya ve güncel fence ile
  yazılır" (baseline CHECK + A36) sözleşmesinin file-SSOT karşılığı tanımsız. Bu olmadan
  "her iş bağımsız yeşil kapıdan geçer" iddiası korunmuyor.
- **K3. Crash/recovery semantiği tanımsız.** 8+ JSONL/JSON dosyası arasında dispatch
  anında kill → hangi satır yetim? Append-kilit + reconcile nerede? Lease/expiry/devir
  (§5'te hiç yok; A09/A35/A36 karşılığı yok). DUR satırı "defter bozulmaz" DİYOR,
  KANITLAMIYOR (P4 kendi kuralını ihlal ediyor).
- **K4. Faz sırası güvenlik kapılarını geciktiriyor.** C0'da ilk spawn var, STOP/kart
  C2'de, durable bildirim-outbox C5'te — headless-first + gate-first disiplinine aykırı;
  ACIL DURDUR latch'i ilk dispatch'ten önce var olmalı (A16/S7 okuma sırası).
- **K5. Kabul kanıtı ölçütleri güçsüz.** C1 "PNG 1600x1000 + 0 konsol hatası"
  davranış kanıtı değil (V3-S2.2 operatör-sadelik testi gibi bir ölçüt yok). C4 "hedef
  3 deneyi kartsız" öğrenme frenleriyle (F1 kendi-önerisini-uyayamaz, güvenlik kapıları
  gevşemez) bağlanmamış.
- **K6. Test stratejisi bölümü yok.** Hiçbir fazda fault-matrix, negatif senaryo,
  yedekten dönüş satırı yok (baseline S3/A22–A27 karşılığı plansız).
- **K7. Bütçe savunusuz.** 11 ekran UI + uzaktan auth + scheduler + learning 3.900–6.200
  LOC'a sığmıyor — sadece React UI dilimi mevcut baseline'da 900–1.400; K-0005 sonrası
  tavan 9.850. (T) etiketi dürüst ama faz kapılarıyla çelişiyor.
- **K8. Doğrulanamayan soy.** `plans/ORDU-CORE-BAGIMSIZLIK-PLAN.md` bu workspace'te
  yok (grep 0); K-0033/ORDU-PLAN v1.6 pano-blueprint arşivinde (bu plan reddettiği bir
  çatalla soydaş). Onay öncesi soy dosyaları gerçek yollarıyla bağlanmalı.
- **K9. Açık sorular kritik kararı içeriyor.** §15-1 (core ayrı repo mu?) mimari
  bağımlılık yönünü belirler; soru olarak bırakılamaz — ADR gerektirir.

## Karşılaştırmalı konum

| | MASTER-SSOT v1.0 | ordu-v3 (canlı plan) | ordu-core (canlı kod) |
|---|---|---|---|
| Kanıtlanmış kapı | 0 (kağıt) | A-kapılarına referans | 51/51 hermetik |
| Bağımsız runtime | §7 matrix (iyi tanım) | ADR-012 + RT kapıları | local-runtime.ts testli |
| Sahte-PASS koruması | yok | A13 | store+evaluator testli |
| Fence/lease | yok | A09/A35/A36 | testli |
| UI kapsamı | 11 ekran varsayılan | 3 bölge/5-soru varsayılan | — |

## Önerilen yol (ONAY BEKLER olarak)

1. **Reddetme + devral:** §6, §7, §9.1–9.2, §5 (kapalı-küme mirasları) ordu-v3'e
   K-0006 ile işlenir; planın kendisi arşiv-dokunulmaz kalır.
2. **Ya da koşullu kabul:** K1–K9 kapatılıp (özellikle file-SSOT equivalence test
   listesi + A13/A36 karşılığı + recovery bölümü + faz sırası düzeltmesi) v1.1 olarak
   yeniden sunulursa puan ~80'e çıkar ve ordu-v3'ün yerini alabilir — otorite devri
   ayrıca ADR ile tescillenir.
