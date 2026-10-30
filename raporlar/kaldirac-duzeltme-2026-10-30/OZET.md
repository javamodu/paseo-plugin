# KALDIRAÇ DÜZELTME DALGASI — P1-P6 UYGULAMA (boru-hatti-kaldirac-2026-10-30)

**Kimlik:** 2026-10-30 · 14:53→15:00 (ölçülmüş) · operatör · [plan](plans/BORU-HATTI-KALDIRAC-DUZELTME-PLANI-2026-10-30.md) (kullanıcı onayı «başla» · kaynak emir: «tüm eksikleri belirle ve uygulama planı yap az loc çok yüksek kaldıraç»)

## Teslim

| Madde | Ne | Nereye |
|---|---|---|
| P1 [KOD] | dogrula.mjs `validateResult` +OZET-içi `\b[0-9a-f]{57,63}\b` freni (~10 satır) — düşmüş sha256 otomatik RED | plans/uygulama-paketleri/DC-H1-2026-10-28/dogrula.mjs |
| P2 | +2 ders: hash transkripsiyonu (3 kez yaşandı) + tautoloji sınıfı | DERSLER.md (194→196) |
| P3 | heartbeat v2 **440e636a**: son-aktivite >15 dk + running → donuk şüphesi; cron 4-54/10; 6h | paseo |
| P4 | denetçi brief'ine tautoloji kaynak-izleme maddesi | KOORDINATOR-DC-S4 §9 |
| P5 | fiş raporu ilk satırı «bağlam ~%XX» | KOORDINATOR-DC-S4 §9 |
| P6 | fiş kapanışında `usage:{in,out,cached}` alan talimatı | KOORDINATOR-DC-S4 §9 |
| P7 | ORDU-2 yeniden yaratma prosedürü (tester gerektiren ilk zincirde) | planda — askıda |
| P8/P9 | izin allowlist [insan kararı] · V8-05 [ayrı dalga] | kuyrukta |

## Kanıtlar (ölçümlü koşumlar)

1. **RED senet (tek-sebep):** S4-02 OZET kopyasında 64→62 hane kırpma + sha/bytes senkron → dogrula **yalnız `ozet-truncated-hash` · exit 1**; OZET restore birebir (cb754af4 teyitli). Senet temp dosyaları koşum sonunda silindi.
2. **Desen bakımı:** ilk desen `{40,63}` S0a-01'de 40 hane **tam git HEAD SHA-1** yanlış-pozitifi üretti → `{57,63}`'e daraltıldı → S0a-01 passed (40 hane commit damgaları ve kısa önekler etkilenmez).
3. **GERÇEK BULGU — fren ilk koşumunda 3. düşük hash'i yakaladı:** DC-S1-01 OZET satır 34 `e7dd0f08…a6f5e` **63 hane** (S1 halkasından; o turun üçlü doğrulama zinciri kaçırmıştı — S2-02 63 / S4-02 62 ile aynı sınıf). Kaynak sha ölçüldü (birebir ilk 63 karakter: `…aebe614a6f5e`) → OZET + sonuc.json senkron düzeltildi (yeni OZET sha `157949a7…de87d`, 1922 bayt) → dogrula **passed**. Düzelt-ile-devrakla.
4. **Regresyon: 26/26 fiş** sonuc.json passed (S0a 4 · S0b 3 · S1 5 · S2 4 · S3 6 · S4 4).
5. Paket validasyonu kırmızısı (`planned-file-already-exists`) **eski kodla aynı** — eki koddan bağımsız (S0a/S0b writeNew dosyaları halkalar bittikçe diskte; authoring-time denetimi).

## Dürüst notlar

- P6'nın bugünkü teslimi talimat + alan tanımıdır; usage İLK doldurma sonraki fiş kapanışında (bu dalgada fiş yok — uydurma değer YASAK).
- Kırpma senedi için DC-S4-02 OZET'i geçici bozdum, kanıt sonrası birebir geri yükledim (hash teyitli) — dürüst kayıt.
- Kod değişikliği yalnız plans/ altında (core yazma yasağına tabi değil); mevcut hükümler (K-0056/K-0057/EK-2) değişmedi.

**Durum:** UYGULANDI — P1-P6 kanıtlı; P7 askıda; P8/P9 [insan] kuyruğunda.
