# ARŞİV + HAREKET-İZOLE DALGASI KAPANIŞI — pano LOC nefesi + test sızıntı yaması + restart kanıtı

Tarih: 2026-11-04 18:29 · dalga: ARŞİV (PANEL-DALGA-SIRASI #2 öne çekildi) · kapanış: tam kapı 260/260 (YENİ baseline)

## 0) RESTART KANITI (önceki adım — operatör onayı «onaylıyorum» 18:2x)

4937 restart UYGULANDI: eski süreç (PID 5820) durdu → `node pano/server.js` + PANO_PORT=4937 (PID 20964). **Restart yolunda bir tuzaq ölçüldü ve kapatıldı:** env'siz başlatma sunucuyu **4377**'de açıyordu (deney sunucusunun limanı — şu an boştu, işgal edildi; süreç derhal öldürüldü) — doğru başlatma PANO_PORT=4937 env'iyle. Kanıt: GET /ordu **HTTP 200 · 149.080** + **GET /api/ordu/metrik HTTP 200** (M1 çekirdeği İLK KEZ CANLI) + **tamBalon ucu uçtan-uca** (?ajan=8cc610a4…&tamBalon=0 → balon TAM) — M1 + GÖRÜNÜM TEK restart'la canlıya girdi.

## 1) ARŞİV (LOC — K-0062 mutlak tetik: 17.986/18.000, %99,9)

**7 dosya arsiv/pano/ altına taşındı (git mv — dosyalar silinmez, tarihçe korunur):**

| dosya | satır | bağ durumu |
|---|---|---|
| kapsul-tuval.html | 2870 | üretim yüzü PANEL-SIFIR-1'de zaten 302 — dosya servis EDİLMİYOR |
| kapsul-tuval.test.mjs | 861 | dosyayla birlikte arşive (glob dışı — koşmaz) |
| kapsul-tuval-mockup-2026-10-26.html | 330 | bağ yok |
| deney-panel.html | 1134 | bağ yok |
| deney-server.mjs | 810 | server.js'te import YOK (yalnız desen atfı); deney süreci koşmuyor (4377 boştu — ölçüldü) |
| deney-server.test.mjs | 245 | deney-server'la birlikte arşive |
| orkestra.html | 307 | bağ yok |

**LOC: 17.986 → 11.432 (−6.554; doluluk %63,5 — 6.568 satır nefes).** TRANSCRIPT-CANLI + COMPOSER + K-0065 dalgaları artık tavan baskısı olmadan sığar.

**Kırılan 2 pin onarıldı:** ordu-panosu.test.mjs 10c + d1b-test.mjs (kapsül-tuval'i `../arsiv/pano/` yolundan okur — dosya diskte yaşıyor, işaret pinleri geçerli kalır). iskelet.test.mjs bağımsız çıktı (yalnız ESC_SATIRI sabiti — dosya okumuyor).

## 2) HAREKET-İZOLE YAMASI (test sızıntısı — bulgu ölçümle kapatıldı)

**Bulgu:** tam kapı koşumlarında test 69 (izole 503 sunucusu) env'inde ORDU_HAREKET_DEFTERİ YOKTU → server.js fallback `ORDU_KOK` (repo kökü — env'siz üretim yolu) → **503 denemeleri ÜRETİM defterine yazdı**. Kanıt: core/data/hareket-defteri.jsonl'de 6 kayıt — hedefleri test sabitleri (8cc610a4… = HEDEF, 432e03b7… = HEDEF2), detayları temp test dizinleri ('paseo-mesaj-503-jUjXAg\kopru-yok.cmd' gibi); zamanlar 17:55 / 18:08 / 18:10 = bugünkü 3 tam kapı koşumu.

**Yama:** test 69 sunucuDogur env'ine `ORDU_HAREKET_DEFTERI: join(d, "hareket-defteri.jsonl")` (izole temp). Doğrulama: bu koşum sonrası üretim defteri DOSYA YOK (sızıntı kapandı).

**Defter temizliği:** 6 kayıdın TAMAMI test atığıydı (gerçek üretim hareketi hiç yazılmamıştı — defter bugün M1 ile doğdu) → dosya kaldırıldı, boş başladı. Append-only dürüstlüğü bozulmadı: kaydı olmayan muhasebe yok; atık dökümü bu raporda (şeffaflık — E10 sahte veri ölçümü bozardı):
```
2026-11-04T14:55:01Z hata 8cc610a4-6fd — kopru-cozulmedi: ENOENT …paseo-mesaj-503-jUjXAg\kopru-yok.cmd
2026-11-04T14:55:01Z hata 432e03b7-900 — kopru-cozulmedi: ENOENT …paseo-mesaj-503-jUjXAg\kopru-yok.cmd
2026-11-04T15:08:57Z hata 8cc610a4-6fd — kopru-cozulmedi: ENOENT …paseo-mesaj-503-jTXL9B\kopru-yok.cmd
2026-11-04T15:08:57Z hata 432e03b7-900 — kopru-cozulmedi: ENOENT …paseo-mesaj-503-jTXL9B\kopru-yok.cmd
2026-11-04T15:10:25Z hata 8cc610a4-6fd — kopru-cozulmedi: ENOENT …paseo-mesaj-503-Tzdywq\kopru-yok.cmd
2026-11-04T15:10:25Z hata 432e03b7-900 — kopru-cozulmedi: ENOENT …paseo-mesaj-503-Tzdywq\kopru-yok.cmd
```

## Kanıt

- **Tam kapı: `node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs` = 260 tests / 260 pass / 0 fail / EXIT=0.** YENİ baseline 260 (320 → 260: kapsul-tuval.test.mjs + deney-server.test.mjs'in 60 testi arşive taşındı — glob dışı; arşivde koşmaz, tarihçe commit zincirinde).
- **Servis (restart'sız — server.js değişmedi):** GET 4937/ordu **HTTP 200**; GET /tuval **302 /ordu** (PANEL-SIFIR-1 aynen — arşiv servis akışını etkilemedi).
- **Sızıntı kapandı:** koşum sonrası core/data/hareket-defteri.jsonl YOK (izole testler temp'e yazar).
- Durust eksik: canlı DOM/PNG yine YOK (browser host bağlı değil).

## Bekleyen (operatör onaylı plan sırası)

- SIRADA: **TRANSCRIPT-CANLI** (yanıtlarım panelde aksın — UI-only, restart'sız) → COMPOSER (hedef seçici kaldır + kurmay/manager iki mod + izolasyon SSOT) → K-0065 Dalga B (yeni oturum).
- K7 push (birikim 68 → bu committe 69).
