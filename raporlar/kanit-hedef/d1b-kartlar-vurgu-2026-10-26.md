# D-1b kapsül kartları + çapraz-vurgu kanıtı — 2026-10-26

İlgi: kabul.csv D-1b · plans/KAPSUL-TUVAL-UI-PLANI-2026-10-26.md D-1b satırı ("kapsüller kartlaşır + vurgu"; eski D-2, V10 katlaması) · K-0046 (e)/(f) kanal disiplini · KT-08 (8-eksen kart ölçüsü) · KT-01/02 (yazma ucu disiplini) · raporlar/gelen-kutu/kapsul-tuval-review-2026-10-26.md.

Etiket: (R) — gerçek node çocuk süreçleri + gerçek fetch; hermetik test `pano/d1b-test.mjs` (zero-dep; kart yazımı İZOLE `ORDU_KAPSUL_DIR` temp dizinine — gerçek repo `plans/kapsuller/` testlerde DOKUNULMAZ ve bu doğrulanır).

## Teslim edilenler (diskte)

| Dosya | İş |
|---|---|
| `pano/server.js` D-1b uçları | `POST /api/kart` TEK yazıcı ucu: PANO_TOKEN fail-closed (env yok→403; başlık yanlış/yok→401) · id `^[A-Za-z0-9._-]+$` kapısı (yol kaçaması `../` → 422 RED) · graf SSOT yok/bozuk → kart ÜRETİLMEZ (fail-closed) · **MEVCUT MD EZİLMEZ** (varsa 409 + yazar kaydı ilk üretimde) · tmp+fsync+rename (kısmi yazış görünmez, A2-10 kalıbı; tmp kalıntısı testle doğrulanır) · `GET /api/kart?id=` salt-okur (icerik diskten birebir) |
| `pano/server.js` `kartIcerik()` | KT-08 8-eksen kapsül kartı: ID · Görev(hedef) · Rol · Durum · Dizin · Ölçüt · Bütçe(LOC) · Deadline · Bağımlılık · Kapı · Ajan kadrosu (görev.ajanlar ezbir-alan; yoksa varsayılan kadro) — **deadline graf SSOT'ta görev-başı alan olarak YOK: uydurulmaz, dürüst "—" satırı** (K-0006 emsali) |
| `pano/kapsul-tuval.html` | detay panelinde "KAPSÜL KARTI OLUŞTUR (MD)" düğmesi + başlıkta token alanı (PANO_TOKEN) + kart sonucu/içerik görünümü · **çapraz-vurgu**: liste satırı seçilir+görünene kayar, tuval düğüme kayar, detay açılır · **fail-closed KIRMIZI YÜZ**: sunucu/graf yokken tüm yüzeyler boşalır + kırmızı detay — bayat graf ASLA gösterilmez |
| `pano/d1b-test.mjs` | 12 hermetik test (aşağıda) |
| `pano/package.json` | test zinciri: d1a + d1b (regresyon bağlantılı) |

## (R) Test sonuçları — pano süiti 7/7 + 12/12 = 19/19 PASS, EXIT=0

| # | Test | Doğrulanan |
|---|---|---|
| 1 | /tuval yüz işaretleri | "KAPSÜL KARTI OLUŞTUR" düğmesi + PANO_TOKEN alanı HTML'de |
| 2 | token başlığı yok→401; PANO_TOKEN env yok sunucu→403 | yazma ucu fail-closed iki kademe (K-0019 semantiği: 403 tanımsız / 401 geçersiz) |
| 3 | token yanlış → 401 | |
| 4 | kart doğar | 201 + dosya + 8-eksen işaretleri + görev metni graf SSOT'tan ("Replan motoru") + ezilmez beyanı |
| 5 | mevcut MD ezilmez | ikinci POST → 409; içerik bayt-bayt aynı |
| 6 | graf-dışı id → 404 | SSOT dışı görev kardı doğmaz |
| 7 | `../` id → 422 | yol kaçaması RED |
| 8 | GET /api/kart | icerik ≡ disk; yoksa 404; kötü id 400 |
| 9 | tmp kalıntısı yok | yalnız .md kalır (tmp+fsync+rename) |
| 10 | graf SSOT yok → 404 | grafsız kart ÜRETİLMEZ + dosya doğmaz |
| 11 | D-1a regresyonu | /api/graf hâlâ disk ile birebir (deepEqual) |
| 12 | gerçek repo izolasyonu | `plans/kapsuller/A2.md` repo'da DOĞMAZ (test temp'e yazar — canlı sunucuya test koşma kuralı) |

Koşum zinciri hataları (dürüst): (a) ilk koşumda 1/12 kırmızı — 403/401 beklemesi tersti (token başlığı YOK = geçersiz→401; 403 yalnız env tanımsızken) — test K-0019 semantiğine düzeltildi + env-yok sunucu kolu eklendi; (b) bir sözdizimi parantezi derlemeyi kırdı (SyntaxError) — kapandı.

## Kanal üçlemesi (K-0046 e/f — son-kanit.json'dan BİREBİR)

- Etiket: `d1b-kartlar-vurgu` · Kanal: `powershell -ExecutionPolicy Bypass -File scripts/test-kanal.ps1 -Etiket d1b-kartlar-vurgu -TestDizin pano` · Log: `raporlar/kanit-hedef/test-d1b-kartlar-vurgu.log`
- Son-kanit.json (birebir): `d=2026-10-26T23:02:33.1837891+03:00 · h=45bd046 · x=0 · test=d1b-kartlar-vurgu · sureSn=3`
- Süit: **19/19 pass / fail 0, EXIT=0** (d1a 7/7 regresyon + d1b 12/12; pano evi — core'a dokunulmaz). Koşum öncesi CPU %58 (F4 dersinin kalıbı).
- Koşum notu (dürüst): D-1a'dakiyle aynı glm-5.3 sınıflandırıcı dalgalanması — kanal koşumu KULLANICI terminalinden tetiklendi (script değişmedi; son-kanit.json + log diskten bağımsız doğrulandı).

## [insan] ELLE TEST (dalga ölçütünün sizin bacağı)

Tuvalde bir görev seçin → "KAPSÜL KARTI OLUŞTUR (MD)" → token girin → `plans\kapsuller\<ID>.md` belirir → Not Defteri ile açın, JSON'daki aynı görevle 8-eksen birebir karşılaştırın. Sunucuyu kapatın (bat penceresinde Ctrl+C) → tarayıcıda 30 sn içinde KIRMIZI YÜZ (bayat graf kalmaz).
