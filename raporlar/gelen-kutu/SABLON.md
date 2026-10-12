# Gelen Kutu Şablonu (K-0017, schemaSurum: 1)

Dış ajan / subagent bulgusu BURAYA girer — sohbete değil. Dosya: `raporlar/gelen-kutu/<kaynagin-adi>-<YYYY-MM-DD>.md` + aynı adlı `.json`.

## Markdown dosyası (insan-okunur)
```
# Gelen Kutu — <kaynak> — <tarih>
| id | bulgu | dosya:satır | etiket | şiddet | öneri |
|---|---|---|---|---|---|
| <kaynak>-1 | <tek cümle> | <yol:satır> | (R)/(T)/* | düşük/orta/yüksek | <tek cümle> |
```

## JSON sidecar (makine-okunur; aynı dosya adı + .json)
```json
{ "schemaSurum": 1, "kaynak": "<ajan>", "tarih": "<YYYY-MM-DD>",
  "maddeler": [ { "id": "<kaynak>-1", "baslik": "...", "dosyaRef": "yol:satir", "etiket": "(T)", "siddet": "dusuk", "oneri": "...", "islenme": null } ] }
```

## Kurallar
- Append-only: aynı kaynak aynı gün ikinci kez yazarsa aynı dosyaya EKLE; asla rewrite yok.
- Doğrulanamayan iddia (T) veya (*) ile girer; coder repo-doğrulaması yapar.
- İşlenen maddeye `islenme: { durum, hash, ts }` append edilir (kapanış kanıtı = commit hash).
- Sözleşme ailesine otomatik yazma YOK — kabul yalnız kullanıcı onayıyla K-kaydı olur.
