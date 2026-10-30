# DAR-DENE DALGASI 2/3 — KAPI BAĞLAMA PLANI (3 ajan)

**Kimlik:** 2026-10-30 17:31 (ölçülmüş) · kaynak emir: «tamam 3 ajanla tamamla bunu önce plan sonra uygula» (önceki sunum: ~110 net satır kapı yolu — Kapı 2 + Kapı 3) · dalga 1/3: D-3 çekirdek `bcc8795`.

## Dürüst kapsam düzeltmesi (önce net sayı)

| KaleM | İlk net | **Düzeltılmış net** | Neden |
|---|---|---|---|
| Kapı 2 — deney-server graf-onay POST | ~50 | **~50** | değişmedi |
| Kapı 3 — üretim server.js atama POST'ları | ~60 | **~130** | K-0055 karar 3: plans/ altına yazma ÇİFTE-KAYIT (MD+JSON aynı iş) şartı → taslak + onay için 2 dosya çifti; ilk ~60 tahmini token guard'a bakıp çifte-kayıtı saymamıştı |
| **Toplam** | ~110 | **~180** | +70 dürüst düzeltme — K-0055 uyumunun gerçek bedeli |

## 3 ajan bölüşümü (paralel yazıcı tavanı 2 ≤ 3; ORDU-3 ardışık)

| Ajan | Rol | Dosya | Net |
|---|---|---|---|
| **ORDU-1** (yazıcı 1) | Kapı 2: POST `/api/deney/graf-onay` + GET graf-durum | `pano/deney-server.mjs` | ~50 |
| **ORDU-4** (yazıcı 2) | Kapı 3: POST `/api/atama/taslak` + `/api/atama/onay` (K-0055 uyumlu) | `pano/server.js` | ~130 |
| **ORDU-3** (salt-okur denetçi) | 1+4 bitince: insan kapısı / fail-closed / K-0055 6 madde / write-set / tautoloji | rapor → `raporlar/gelen-kutu/` | 0 |

Operatör (bu oturum): plan + brief'ler + bağımsız koşum doğrulama + **commit tek elden**.

## Kilit tasarım kararları (brief'lere kilitlendi — ajan değiştiremez)

- **KA-1 (Kapı 2):** ONAYLI defter AYRI dosya `DENEY_DIR/atamalar-onay.jsonl`. Gerekçe: `atamalar.jsonl` (TASLAK akışı) ile aynı dosyada olsaydı `atamaYaz` idempotans imzası (görev#sürüm) TASLAK satırıyla çarpışırdı → ONAYLI hiç inmezdi. `YAZMA_IZINLI`'ye eklenir (fail-closed write-set).
- **KA-2 (Kapı 2):** kapı zinciri İKİ adım — mevcut `/api/deney/atama` (TASLAK açar, insan:web) → yeni `/api/deney/graf-onay` (onayla + atamaYaz). Tek çağrıda taslak+onay YOK (insan kapısı çöker).
- **KA-3 (Kapı 2):** idempotans görünür — 2. onay çağrısı 200 `{mevcut:true}` (çöp kayıt yok).
- **KA-4 (Kapı 3):** üretim yazma hedefi `plans/atamalar/` ÇİFTE-KAYIT: `taslaklar.jsonl`+`taslaklar.md`, `onayli.jsonl`+`onayli.md` (K-0055 karar 3/4 — plans/ MD+JSON kategorisi; yeni kategori YOK → yeni ADR GEREKMEZ; `core/*` HER KOŞULDA YASAK). ATAMA_DIR = `ORDU_ATAMA_DIR` env ya da `plans/atamalar`.
- **KA-5 (Kapı 3):** PANO_TOKEN fail-closed birebir mevcut `/api/kart` deseninden (satır 146-148): TOKEN yok → 403; yanlış → 401. Aktör SUNUCU TARAFINDAN sabit `insan:web` — istemciden aktör alanı KABUL EDİLMEZ (spoof edilemez; vekil RED graf-yönetim çekirdeğinden).
- **KA-6 (Kapı 3):** taslak sürüm zinciri — `onceki` = taslaklar/onaylı İKİ dosyadan o görevin **tarihçe en yeni** kaydı (tarih alanıyla karşılaştır); boşsa null.
- **KA-7:** 4377 ÇALIŞAN süreç **DOKUNULMAZ** — Kapı 3 kanıtı `PANO_PORT=4931` izole koşum + geçici ATAMA_DIR; üretim restart [insan] ayrı onay. 4930 deney sunucusu restart'u bu dalgada (kullanıcı canlı denemesi için).
- **KA-8:** graf SSOT salt-okunur (D-3 v7 hash kanıtı geçerli); ajanlar commit atmaz (tek elden); emoji yok; LF korunur.

## Sıra

1. Plan + kayıtlar commit (bu dosya — plan diske inmeden iş bitmiş sayılmaz)
2. ORDU-1 ∥ ORDU-4 (farklı dosyalar — çakışma yok) — brief'ler ayrı gönderilir
3. ORDU-3 salt-okur denetim (1+4 tamamlanınca)
4. Operatör bağımsız koşum: Kapı 2 izole round-trip + Kapı 3 izole (403/401/201/idempotans/çifte-kayıt 4 dosya/fail-closed graf-yok)
5. Commit tek elden (+ CODEMAP taze + STATE damga + log kapanış)
6. **[insan] Kapı 2 canlı deneme** (4930, tarayıcı) → «Kapı 2 kabul»
7. **[insan] 4377 restart onayı** → üretim POST'ları canlı

## Kanıt ölçütleri

- Kapı 2 (izole): taslak→onay→defter satırı 1→idempotans (mevcut:true)→durum haritası→TASLAK'sız görev 400; 2. bağımsız koşum.
- Kapı 3 (izole 4931): token'sız 403 · yanlış token 401 · taslak 201 · onay 201 {yazildi:true} · 2. onay {mevcut:true} · 4 dosya oluşur (jsonl×2+md×2) · `ORDU_GRAF_JSON`=olmayan → 404 fail-closed · graf dosya hash'i DEĞİŞMEZ.
- ORDU-3: bulgu yok → temiz rapor; bulgu var → `raporlar/gelen-kutu/ORDU-3-2026-10-30.{md,json}` (schemaSurum 1).
- Kullanıcı canlı denemesi (Kapı 2 kabul cümlesi) — EK-2: ajan onay vermez.

## Kabul dışı (bu dalgada YOK)

push (K7) · 4377 restart · panel butonu (~+20 satır, ayrı istek) · K2 görsel kabul · B1-B7 tuval taşıma (K-0055 karar 5 — ayrı dalga).
