# SIRALAMA-DÜZELTME dalgası — ad anahtarı görünmez YOL değil GÖRÜNEN etiket (hata düzeltmesi)

Tarih: 2026-11-04 17:45 · Yazıcı: KURMAY-1 (8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7, glm53u-claude) · Durum: KAPALI

## Emir (verbatim)

«sıralama çalışmıyor proje ismine göre sıralanmalı»

## Teşhis (gerçek üretim verisiyle kanıtlandı — teşhis tahmin değil)

- SIRALAMA dalgasının (adf8832) ad anahtarı `projeAdi` idi = **Paseo dizin adı (dashed YOL)**. Gerçek taramada (76 proje, `projelerTara` izole koşumu) `projeAdi` «C-Users-gatep-Local-Sites-1», «D-Vibecode-Chrome-extension-sarisite-export» gibi YOLLAR; ağaçta GÖRÜNEN ad ise `klasorAdi` («1», «sarisite-export»).
- Sonuç: «isim» modu görünmez yola göre sıralıyordu — C-diskli worktree'ler («sprint53-alias…») D-disklilerden önce, kullanıcının gördüğü ad sırası DÜZENSİZ. **VM testleri geçti çünkü fixture'lar `projeAdi`'yi doğrudan kısa ad olarak vermişti** — üretim ayrımı (klasorAdi ≠ projeAdi) hiç sınanmamıştı. Ders: görünür-ad davranışının testi görünen-etiket ayrımını taşımalı.

## Ne yapıldı

- `agacYaz` sıralamasının SON ad anahtarı (tüm modların ortak son anahtarı): `String(a.projeAdi).localeCompare(...)` → **`String(projeEtiketi(a)).localeCompare(String(projeEtiketi(b)), "tr")`** — sıralama anahtarı artık GÖRÜNEN etiket (klasorAdi → projeAdi → dashed dizin; ağacın yazdırdığı adla AYNI yardımcı). ORDU-önce + mod anahtarları DEĞİŞMEDİ.
- Test (51aa): +1 kaynak pini (yeni anahtar + eski `projeAdi` anahtarı YOK) + +1 VM senaryosu — gerçek taramadan alınan alan ayrımıyla (klasorAdi ≠ projeAdi) 4-proje fixture: «isim» GÖRÜNEN ad sıralar [ORDU('ordu') → '1' → 'agent-bus' → 'sarisite-export']; eski anahtar YOL sıralardı (ordu SONDA).

## Kanıt

- **Tam kapı**: `node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs` = **314 tests / 314 pass / 0 fail / EXIT=0** (yeni test YOK — pinler 51aa içine gömüldü; mevcut sıra beklentileri klasorAdi'siz fixture'larda projeEtiketi→projeAdi yedeciğiyle AYNEN geçti).
- **Üretim kanıtı (gerçek 76-proje taraması, izole koşum — sunucuya dokunulmadı)**: yeni anahtar ilk-15 görünür ad = `[ORDU] ordu · !token-optimzation · .paseo-bench · 1 · agent-bus · agent-codex-supervisor-go · …` (gerçek alfabetik); eski anahtar = `sprint53-alias · sprint53-backoff · … · default-workspace · 1 · woo-block …` (yol sırası — «sıralama çalışmıyor» teşhirinin birebir kendisi).
- **Servis kanıtı** (server.js DOKUNULMADI → restart YOK): `GET http://127.0.0.1:4937/ordu` **HTTP 200 · 140.095** · yeni anahtar serviste ✓ · eski `projeAdi` anahtarı serviste YOK ✓ (statik html — sayfayı yenilemen yeterli).
- **Canlı DOM + PNG: YAPILAMADI** — browser automation host hâlâ bağlı değil (4. dalga üst üste); davranış VM + gerçek-veri izole koşumuyla ölçüldü — dürüst eksik.
- **LOC DELTA (K-0062)**: pano/ 17.650 → **17.665, net +15** (dalga tavanı +200 ✓; 18.000 tavanına doluluk %98,1).

## Kapsam

pano/ordu-panosu.html M · pano/ordu-panosu.test.mjs M (51aa +2 pin) · raporlar/pano-siralama-duzeltme-2026-11-04/ YENİ · CODEMAP.md M · STATE_BOARD.md M

## Notlar

- Sekme-sıralama/sıralama çakışması YOK: bu dalga yalnız ağaç proje sırasının AD anahtarını değiştirdi.
- Bu kayıt YERELDİR — push ayrı emir (K7; birikim 65 → bu committe 66).
