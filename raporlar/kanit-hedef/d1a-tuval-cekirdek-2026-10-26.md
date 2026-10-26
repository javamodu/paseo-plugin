# D-1a kapsül-tuval masaüstü çekirdeği kanıtı — 2026-10-26

İlgi: kabul.csv D-1a · plans/KAPSUL-TUVAL-UI-PLANI-2026-10-26.md D-1a satırı ("masaüstü çekirdeği") · K-0046 (e)/(f) kanal disiplini · plans/gorev-grafigi-2026-10-26.json (v6 — /api/graf veri kaynağı).

Etiket: (R) — gerçek node çocuk süreçleri + gerçek fetch; hermetik test `pano/d1a-test.mjs` (zero-dep, PANO_PORT=0 gecici port, izole PANO_KOKLER temp dizini; temp dizin + çocuk süreçler koşum sonunda temizlendi).

## Teslim edilenler (diskte)

| Dosya | Rol |
|---|---|
| `pano/yerel-masaustu.bat` + `pano/yerel-masaustu.ps1` (ASCII) | çift-tık başlatıcı: port-probe (doluysa ADIYLA kırmızı) → node pano/server.js → hazırlik kapısı 5 sn (/api/repolar 200) → tarayıcı `/tuval` → kapat-kancası (Wait-Process/finally Stop-Process — orphan node yok) |
| `pano/server.js` (D-1a uçları) | `GET /tuval` (kapsul-tuval.html servis) + `GET /api/graf` (graf SSOT'yu HER İSTEKTE diskten okur — bayat önbellek yok; graf yok → 404 ADIYLA fail-closed; JSON bozuk → 500) + `PANO_PORT` env (test için 0) |
| `pano/kapsul-tuval.html` | üretim çekirdeği: tek veri kaynağı `fetch("/api/graf")`; İNSAN OKUR (sol liste + SVG tuval Kahn katman yerleşimi + detay tablosu) / MAKİNE OKUR (aynı fetch yanıtının JSON pre görünümü) — iki yüz AYNI veriden, çift SSOT imkânsız; 30 sn tazelik; yazma ucu yok (D-3) |
| `pano/package.json` | `"test": "node d1a-test.mjs"` |
| `pano/d1a-test.mjs` | 7 hermetik test (aşağıda) |

## (R) Test sonuçları — pano süiti 7/7 PASS, EXIT=0

| # | Test | Doğrulanan |
|---|---|---|
| 1 | /tuval HTML servisi | 200 + text/html + "KAPSÜL TUVAL" başlık + İNSAN OKUR/MAKİNE OKUR düğme işaretleri |
| 2 | /api/graf birebir | servis yanıtı ≡ disk `plans/gorev-grafigi-2026-10-26.json` (deepEqual — çift SSOT kökü yok) + grafSurumu v6 + 24 görev + 29 kenar |
| 3 | kenar uçları geçerli | 29 kenarın her iki ucu da görev kimlikleri içinde (DAG somut doğrulama) |
| 4 | fail-closed graf yokluğu | ORDU_GRAF_JSON→olmayan dosya: 404 + hata ADIYLA yolu taşır (sessiz boş servis YOK) |
| 5 | /api/repolar regresyonu | izole KOKLER: 200 + schemaSurum 1 + boş repo listesi (mevcut yüz bozulmadı) |
| 6 | tanımsız uç | /api/yok-boyle → 404 |
| 7 | iskelet / regresyonu | mevcut `iskelet.html` yüzü 200 |

Koşum zinciri hatası (dürüst not): ilk koşumda 6/7 kırmızıydı — `finally` bloğu çocuk sunucuları testler koşmadan ÖNCE öldürüyordu (test döngüsü finally'den sonra yürütülüyordu); tek geçen test kill-yarışı kazancıydı (sahte-yeşil örneği). Düzeltme: test döngüsü `try` içine alındı + exit `process.exitCode` ile doğal akışa bağlandı. İkinci koşum 7/7. Bu hata kanıt değeri taşır: önce-kill-sonra-koş deseni sessiz sahte-kırmızı üretir.

## Kanal üçlemesi (K-0046 e/f — son-kanit.json'dan BİREBİR)

- Etiket: `d1a-tuval-cekirdek` · Kanal: `powershell -ExecutionPolicy Bypass -File scripts/test-kanal.ps1 -Etiket d1a-tuval-cekirdek -TestDizin pano` · Log: `raporlar/kanit-hedef/test-d1a-tuval-cekirdek.log`
- Son-kanit.json (birebir): `d=2026-10-26T21:48:41.7063520+03:00 · h=ebc335c · x=0 · test=d1a-tuval-cekirdek · sureSn=15`
- Süit: **7/7 pass / fail 0, EXIT=0** (pano evi — D-1a kodu core'a dokunmaz; `-TestDizin pano` kanal parametresiyle pano'nun kendi npm test'i koşuldu).
- Koşum notu (dürüst): kanal koşumu glm-5.3 sınıflandırıcı kesintisi yüzünden araçtan değil, KULLANICI terminalinden tetiklendi (2026-10-26 ~21:4x) — script'in kendisi değişmedi, son-kanit.json/log diskte bağımsız doğrulandı (okuma araçlarıyla birebir karşılaştırıldı). Koşum öncesi CPU dip ölçümü %54'te yapılmıştı (F4 dersinin kalıbı).

## [insan] ELLE TEST (dalga kapanış düdüğü — plan gereği)

`pano\yerel-masaustu.bat` çift tık → tarayıcı ≤5 sn → **24 görev** görünür → İNSAN OKUR/MAKİNE OKUR aynı 24 düğümü gösterir (JSON'u elle sayıp karşılaştır). Bu adım oturum dışı — kullanıcı eli.
