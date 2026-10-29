# G9-ÇEKİRDEK DENAYI — graf içi yönetim işleyişinin saf çekirdeği (dar kapsam test)

**Kimlik:** KAPI K9 · 2026-10-29 16:23 · kaynak emir (verbatim): «tüm sistemin kalbi ve başarısı graf içindeki yönetim metikleri işleyiş hiyerarşi disiplinden geçiyor düşün incele daralt hemen dar kapsamlı test yapalım». Bu bir DALGA değil **DENAY** (keşif): K-0053 yazar hattı kullanılmadı; operatör doğrudan yazdı, ölçtü, kaydetti.

## Dar kapsam (sınır)

Kalp tek zincire daraltıldı: **düğüm seç → ajanları GEREKÇELİ filtrele → ata → versiyon+diff → onay**. Yüz YOK · HTML YOK · server.js YOK (donmuş) · core'a dokunma YOK. Yeni 2 dosya: `pano/graf-yonetim.js` (151 satır saf modül — disk YAZMAZ) + `pano/graf-yonetim.test.mjs` (200 satır, 32 vaka).

## Çekirdek fonksiyonlar (işleyiş · hiyerarşi · disiplin)

| Fonksiyon | İş | Disiplin kuralı |
|---|---|---|
| `izCoz(zincir)` | miras: sistem→proje→graf→görev→ajan birleştirme | **daraltma-only** — alt kapsam üst izni asla GENİŞLETEMEZ; genişletme girişi RED (fail-closed) |
| `dokumanCoz(kapsamlar)` | ajan doküman KÜMESİ + okuma sırası (ANAYASA başta, genelden dara) | aynı ad farklı kapsamda → DAR kazanır; çakışma listelenir |
| `uygunluk(gorev, ajan)` | atama metrikleri: pasif · rol-eksik · dizin-yasak · limit-dolu | her eleme GEREKÇELİ (`{neden, detay}`) |
| `atanabilirler(gorev, ajanlar)` | G9 yüzünün veri çekirdeği — uygunlar (puan sıralı) + elenenler (gerekçeli) | seçim ŞEFFAF: «ajanları nasıl seçtik» = elenme nedenleri görünür |
| `atamaTaslakla(...)` | her değişiklik **versiyon + diff** taşır; onay: TASLAK | açan yalnız `insan:web`; tarih ZORUNLU (ölçümsüz kayıt yasak) |
| `onayla(taslak, actor)` | TASLAK → ONAYLI / RED | onaycı `ai-manager` ya da `insan:web`; vekil/ajan RED (buyutemez); red gerekçesiz olmaz |

## Ölçümler (gerçek koşum)

| Ölçüt | Değer |
|---|---|
| graf-yonetim testi | **32/32 × 2 bağımsız koşum** — 481,9 ms + 558,8 ms (node --test) |
| Sözdizimi | node --check OK × 2 (modül + test) |
| Kapsül-tuval (dokunulmadı) | 33/33 fail 0 — regression YOK |
| LOC | 351 (modül 151 + test 200) |
| Gerçek SSOT bağı | `plans/gorev-grafigi-2026-10-26.json` salt-okur okundu: 40 görev doğrulandı (v29-v30) |

## Düzeltme döngüsü (araç çıktısına bağlı — disiplin §6)

İlk koşum **7 vaka kırmızı** → kök neden TEK: `dizinKapsaminda()` denetimi yanlış değişkende (`Array.isArray(yol)` — yol STRING) → hep false → tüm uygunluk vakaları dizin-yasak'ta düştü. Tek satır düzeltme (`typeof yol !== 'string' || !Array.isArray(izinliOnekler)`) → 32/32. Öz-eleştiri turu değil, test çıktısı dürttü.

## Denay bulguları (G9 tasarımına girdi)

1. **D-1 · SSOT dizin alanı serbest metin:** `gorev.dizin` = «core/ + ilgili politika/adaptor halkası» gibi yol-olmayan parçalar taşıyor → G9 yüzünde **normalize/anlamsal eşleme** katmanı gerek (v29b bu davranışı kanıtlar; test kuralı değil, SSOT gerçeği).
2. **D-2 · daraltma-only core'la uyumlu:** varsayım, `grants.ts` «buyutemez katman-a» (vekil grant yaratamaz)ruhuyla aynı — iki ayrı katmanda aynı hiyerarşi disiplini.
3. **D-3 · doküman küme varsayımı:** ajan birden fazla doküman okur (ANAYASA+AGENTS+tasarım+rol.md); çakışmada dar kapsam kazanır. Varsayımlar tek modülde — kural değişirse tek noktadan düzelir.
4. **Görev rolü bileşik:** SSOT'ta `rol: 'MANAGER+TESTER'` deseni var — uygunluk filtresi bileşik rolü tam kapsama ister (v12/v13).

## Sıradaki

Bulgular G9 yüzüne (K8/B7) girdi: atama çekirdeği kanıtlandı; kalan = yüz + POST yazma ucu (K8 onayı — «DALGA-YÖNETİM başla»). Kalan iş: `plans/KAPI-HARITASI-2026-10-29.md` (R3 — tekrar edilmez).
