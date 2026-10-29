# KOORDİNATÖR KAYDI — DC-S0a serbest bırakma (S0A_START)

**Kimlik:** DC-S0a zinciri · ATOM-H1-2026-10-28.2 · **2026-10-30T00:58:28+03:00** (ölçülmüş) · koordinatör: operatör oturumu b400f1e5.

## 1. İnsan başlatma kaydı (S0A_START açıldı)

Kullanıcı emri, birebir: **«Ordu siradi ile tüm görevleri bitirsin»** (2026-10-29 ~23:5x, bu oturum). Bağlam: aynı oturumda soruya yanıt olarak DC-S0→H1 kapı tablosu sunuldu (K7 push dahil); emir bu sırayı komple yürütme talimatı. Emsal: S1 koşumunda «approve insan:ci [kullanıcı otomasyon talimatıyla]» (STATE 12. satır) — aynı sınıf otomasyon talimatı. **Kapsam:** PLAN §25 sırası S0a→S0b→S1→S3→S2→S4 fiş uygulaması; her halka kendi ek iznini (S0b zararsız sınama, S1 G0+ADR+bütçe+F1, S4 pilot izinleri) bu genel talikatın kapsamında yürür; **EK-2 istisnası yok** — sağlayıcı harcaması/canlı/insan kabul sınıfı kararlarda dur ve rapor ver.

## 2. Görev kimlikleri ve zincir

DC-S0a-01 (kaynak tabanı; READ_GIT/READ_ENV) → DC-S0a-02 (işçi/test sınırı fizibilitesi) → DC-S0a-03 (kullanım/süreç/kalıcı bağ tasarımı) → DC-S0a-04 (TASLAK teknik ADR + pilot oracle + yeni dosya adayı `kararlar/ADR-dc-s0-teknik-oneri-2026-10-28.md`). Fiş ayrıntısı: [S0a.md](../../plans/uygulama-paketleri/DC-H1-2026-10-28/S0a.md). Ana plan/graf: PLAN.md v2.10.1 / graf v14. Önkoşul kanıtı: yok (zincir başı).

## 3. HEAD ve kirli dosya sahipliği

HEAD **3f231e3** (yerel; origin/main geride — push K7 ayrı emir sınıfında, bu kayıt push yetkisi VERMEZ). Kirli ~128 yol: dokunulmaz sınıf [eski untracked + üretim defterleri + mudahale/manager deney kayıtları]. **S0a yazıcı bunlara dokunmaz**; yalnız kendi kanıt çiftlerini üretir (aşağıda yollar).

## 4. S0 ADR arayüz bağları

S0a-04'e kadar TASLAK ADR yoktur (o fiş üretecek). S0a-01..03 salt-okur keşif: write-set boş. Fişlerdeki «kesin mevcut dosya adayları: yok» hükmü bu kayıtla teyit edilir; S0a-04 tek YENİ dosya adayı taşır (ADR TASLAK — «onay verme» sınırı fişte yazılı).

## 5. Kesin dosya listesi (yazma alanı)

| Fiş | Mevcut dosya | Yeni dosya |
|---|---|---|
| DC-S0a-01 | yok | `raporlar/dc-uygulama/DC-S0a-01/OZET.md` + `sonuc.json` |
| DC-S0a-02 | yok | `raporlar/dc-uygulama/DC-S0a-02/OZET.md` + `sonuc.json` |
| DC-S0a-03 | yok | `raporlar/dc-uygulama/DC-S0a-03/OZET.md` + `sonuc.json` |
| DC-S0a-04 | yok | `raporlar/dc-uygulama/DC-S0a-04/OZET.md` + `sonuc.json` + `kararlar/ADR-dc-s0-teknik-oneri-2026-10-28.md` (TASLAK) |

Üst sınır: 0 mevcut dosya (≤3 kuralı rahat) · kritik yolda TEK yazıcı.

## 6. Roller ve tavanlar

- **Yazıcı:** ORDU-1 (128a3edc; glm53u-codex/glm-5.3) — salt-okur keşif + rapor çifti; commit ATMAZ (operatör tek elden).
- **Ayrı tester:** ORDU-2 (6061983f) — her fiş sonrası bağımsız: `node plans/uygulama-paketleri/DC-H1-2026-10-28/dogrula.mjs --result DC-S0a-XX raporlar/dc-uygulama/DC-S0a-XX/sonuc.json` + kaynak hash'lerini yeniden hesaplayıp manifestle karşılaştır (P1) + komut kayıtlarının çıktı kimliklerini teyit.
- **Salt-okur denetçi:** ORDU-3 (d171af6b) — şema/şeffaflık denetimi: sonuc.json alanları sonuç sözleşmesine (gorevler.json) birebir mi; P/N gözlemleri boş/uydurma mı; BLOCKED gerekçeleri doğru sınıfta mı.
- **Süpervizör:** ORDU-4 (cfda82a0) — 429/hata diriltme (kalp atışı bc8e7c28); görev dağıtımı YOK.
- **Tavan (fiş başına, T önerisi aynen):** 8 tur / 60 dk / 60000 token. Tavan → dur ve devir kartı.

## 7. Test ortamı

S0a salt-okur keşif: temp repo/DB/port GEREKMEZ; ürün testi/probe/DB/CLI çağrısı YASAK (fiş hükümleri). Komut reçeteleri fiş başında: S0a-01 READ_GIT (git metadata) + READ_ENV (platform/mimari/Node sürümü — sır dökümü YOK); S0a-02..04 yalnız kaynak okuma aracı.

## 8. Duruş koşulları

(a) Tavan yaklaşınca dur + devir; (b) fiş gereği eksik izin/mekanizma çıkarsa **BLOCKED** olarak kaydet (sahte değer YOK); (c) kapsam büyümesi isterse fişi genişletme — paket revizyonu iste (raporla); (d) sağlayıcı harcaması/canlı dokunuş gerekiyorsa dur. **S0a sonuçları EVIDENCE_RECORDED sınıfıdır — sprint PASS/ürün kabulü/insan kapısı DEĞİLDİR** (her fiş hükmü aynen).
