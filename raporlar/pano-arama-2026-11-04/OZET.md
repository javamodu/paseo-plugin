# ARAMA dalgası — ağaç arama çubuğu (projeler üstünde)

Tarih: 2026-11-04 17:07 · Yazıcı: KURMAY-1 (8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7, glm53u-claude) · Durum: KAPALI

## Emir (verbatim)

«birde arama çubuğu ekle projeler üstüne»

## Ne yapıldı

- **Arama kutusu** kontrol satırının BAŞINDA (ağacın/projelerin üstünde): `type=search`, esnek genişlik (flex:1 1 120px), placeholder «proje veya oturum ara». Sıralama + filtre ile aynı satırda birlikte yaşar.
- **Eşleşme**: tr-locale küçük-harf (`İ→i` — İngilizce `toLowerCase` combining-dot üretir, eşleşmezdi); alanlar: proje etiket/dizin/başlık · oturum etiket/ajanKimligi/ajanId.
- **Davranış**: (a) proje ADI eşleşir → görünür, oturum satırları mevcut desen AYNEN (son-3+aktif — FAZ-N korunur); (b) yalnız OTURUM eşleşir → proje görünür + **yalnız eşleşen oturumlar (tam liste — aranan son-3 sınırına takılmaz)**; (c) arama + yalnız-aktifler VE bağlı; (d) boş arama (trim) → mevcut davranış AYNEN.
- **Durum geçici**: kalıcı kayıt YOK (sayfa yenilenince taze) — 30 sn P-yenilemesinde kutu (ayrı kapta) ve değişken yaşar, odak korunur.
- **Boş-dürüst üç kademeli**: arama > filtre > tarama (arama metni esc() ile yansır — XSS).

## Kanıt

- **Tam kapı**: `node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs` = **314 tests / 314 pass / 0 fail / EXIT=0** (313→314; yeni 51ab: kaynak pinleri + vm — «eski»/«kurmay»/«ESKİ» tr-locale/boşluk/VE-bağlama/eşleşme-yok/oturum-kolu/son-3-açılımı).
- **Servis kanıtı** (server.js DOKUNULMADI → restart YOK): `GET http://127.0.0.1:4937/ordu` HTTP 200 · 138.188 bayt · `agacArama` serviste (statik dosya — reload yeterli).
- **Canlı DOM + PNG: YAPILAMADI** — Paseo browser automation host hâlâ bağlı değil (SIRALAMA dalgasıyla aynı durum). Davranış VM testlerinde ölçülü (gerçek filter/sort kodu koşar). Host geri gelirse PNG eklenebilir — tahminle kapatılmadı (dürüst eksik).
- **LOC DELTA (K-0062)**: pano/ 17.535 → **17.632, net +97** (dalga tavanı +200 ✓; 18.000 tavanına doluluk %97,9).
- **Z1**: CODEMAP taze (870 dosya, 119 satır) + saglik 16 OK / 2 EKSIK / 1 SARI — üç bayrak da ÖNCEDEN VARDI; bu dalga hiçbirini üretmedi.

## Kapsam

pano/ordu-panosu.html M · pano/ordu-panosu.test.mjs M (51ab YENİ + 51f/51s render-çağrı pini ternary else koluna + 51k/51o projeEtiketi sayım 6→7 [7. kullanım prAdEs]) · raporlar/pano-arama-2026-11-04/ YENİ · CODEMAP.md M · STATE_BOARD.md M

## Notlar

- Pin çatlaşı çözüldü: `agacGorunurAjanlar(ajanlar).map(...)` düz string'i arama ternary'sine gömüldü → pinler `: agacGorunurAjanlar(ajanlar)).map(...)` (else kolu, arama boşken AYNEN).
- `projeEtiketi(pr)` 7. kullanımı prAdEs — 51k/51o sayım pinleri dürüstçe 7'ye güncellendi (çift-kaynak YOK: prAdEs yardımcıyı çağırır, kopyalamaz).
- Bu kayıt YERELDİR — push ayrı emir (K7; birikim 63 → bu committe 64).
