# 30 — ÖĞRENEN ORDU: sınırlı, kanıtlı, ONAYLI öz-iyileşme

> Kullanıcı şartı: "kendi kendine öğrenip iyileştirsinler." dürüst karşılık:
> **ağırlık eğitimi değil**, doğrulanmış ders + sürümlü öneri + ölçülü geçiş.
> GPT §15 + Final D09'un birleşik, ÇALIŞIR hattı. Amaç: senden sonraki sprint,
> öncekinden ucuz/hızlı/güvenli olsun — ve bunu SEN onaylarsın.

## 1. Dört öğrenme kanalı (hepsi defterde)

| Kanal | Ne öğrenilir | Ürün | Otomatik mi |
|---|---|---|---|
| L1 Hata imzaları | aynı hatanın tekrar gelen düzeltme reçetesi | `lessons/imzalar.jsonl` → retry promptuna tek satır eklenir | EVET (yalnız NOT ekler; politika/prompt şablonuna dokunmaz) |
| L2 Skorcard | rol×profil ilk-deneme-geçme, süresi, **maliyet-per-kabul** (tam payda: başarısız+atlandı+iptal dâhil) | canlı tablo (40-kabul Ö-metrik) | HESAP otomatik; karar değil |
| L3 Retro önerileri | sprint sonunda manager+bekçi: "X rolünde Y şablonu Z düğümünde başarısız; önerecek: prompt maddesi / kademe değişimi / profil değişimi" | `oneriler/O-xx.md` (kapalı şema: hipotez, kanıt, diff, etki, geri-alış) | Öneri üretimi otomatik; **uygulama HAYIR** |
| L4 Vekil kalibrasyonu | senin reddettiğin kabul rubric'leri | `kullanici.md` taslak diff | yalnız öneri |

## 2. Öneri → geçiş hattı (L3; insan kapılı)

```
öneri (kanıt+diff+geri-alış planı) → [ONAY#1: dene mi?] → izole deney koşusu
  (eski=baseline yeni=aday, eşlenmiş görevler, aynı bütçe — GPT §14 koşulları)
→ skorcard karşılaştırması (maliyet-per-kabul, ilk-deneme, ihlal sayacı)
→ [ONAY#2: kanıtı gör — promote/rollback] → profil sürüm artışı (hash'li)
→ kademeli canary: ilk 3 gerçek görevde yeni profil; regresyonda otomatik DURDUR + geri-al
```

- Öneri kartları Inbox türü `ogrenme-onerisi`; tek dokunuş `dene` / `uygula` / `reddet(+neden)` / `bekletme`.
- Retro-kanıtsız hiçbir şey promote edilmez: koşu sayıları n, tarih, paket sürümü ekranda; örneklem düşükse "yön verir, hüküm vermez" ibaresi.
- Model ağırlıkları, öğrenme oranları, fine-tune: KAPSAM DIŞI (bilinçli).

## 3. Kendi-kendine-iyileşme frenleri (bilinçli sınırlar)

- F1 Öneri sahibi (manager) kendi önerisini uygulayamaz; bekçi kodu uygular/engeller.
- F2 Aynı haftada en fazla 2 profil değişimi (değişim-yanlısı sürüklenmeyi keser).
- F3 Güvenlik/recovery kapılarını hiçbir öğrenme önerisi GEVŞETEMEZ (öneri bile olamaz; validator reddeder).
- F4 Ölçüm tanımları sabittir; öneri "metriği değiştir" teklif edemez (GPT §15).
- F5 Plateau/bütçe kuralları kod tarafındadır; prompt önerisi onları aşındıramaz.
- F6 Bilinmeyen maliyet ücretsiz sayılmaz; kullanım alınamıyorsa skorcard `bilinmiyor` der (A30).

## 4. Bekçinin öğrenme rolü (tek LLM görevi burada)

Haftalık LLM bekçi raporu: olay defterinden örüntü avı — "aynı failure imzası
3 kapsülde farklı kılıklarda", "coder X profili tester suite'iyle çelişen
varsayım taşıyor", "manager planları sistematik olarak bağımlılığı eksik
kuruyor". Her bulgu ya `lessons/` notu (L1, otomatik) ya `oneriler/O-xx`
(L3, kapılı) olur. Uydurma istatistik yok: her madde olay-id listesiyle doğrudur.

## 5. Başarı tanımı (ne zaman "öğreniyor" denir?)

Üç sprint art arda: maliyet-per-kabul DÜŞÜYOR VE ilk-deneme-geçme YÜKSELİYOR
VE güvenlik/rework ihlali ARTMIYOR → öğrenme döngüsü çalışıyor. Aksi hâlde
öneri hattı durdurulup kök neden incelenir (metrik oyunu değil, gerçek iyileşme).

## 6. Reasoning teslimi = makbuz, metin değil (denetim bulgusu: M18 kapısızdı)

Derin-tier (reasoning) görev çıktısı yalnız yanıt metniyle KABUL EDİLEMEZ.
DELIVERED_CANDIDATE olabilmesi için makbuz zorunlu (kapalı alanlar, B01 dalı):
`kaynaklar[]` (gerçek okunan dosya/URL + alıntı satırı), `rubrik` skoru
(önceden donmuş görev brief'indeki kriterler), `belirsizlik` skoru + neyi
doğrulayamadım listesi, `varsayimlar[]`. Uydurma/atıf-doğrulaması-geçemeyen
kaynak veya `belirsizlik > eşik` → oto-kabul YASAK, insan-kartı. Makbuz metni
asla shell'de yürütülmez (yalnız veri). Bekçi alıntıları örneklem-denetler
(F1: denetçi, üreten rol olamaz).
