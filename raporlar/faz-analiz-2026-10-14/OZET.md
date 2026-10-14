# Faz Analizi: Sozlesme vs Firtina — 2026-10-14 (R: telemetri.jsonl, paseo-plugin 395 tur + txt-to-cad 168 tur)

## paseo-plugin — uc faz (turSn>0 filtresi)
| faz | n | ort turSn | medyan | tamam % | toolFail % | edit/tur | LOC |
|---|---|---|---|---|---|---|---|
| sozlesme-oncesi | 74 | 200 | 108 | 88 | 13,8 | 0,05 | 0 |
| sozlesme (v0.9-0.18) | 188 | 267 | 113 | 85 | 8,8 | 0,52 | 0 |
| firtina (v0.19-0.22) | 133 | 185 | 111 | 87 | 5,4 | 1,02 | 1281 |

## Surum trendi (paseo-plugin)
- v0.9-0.10: 34-103sn, ama toolFail %8-19 (erken sarsinti)
- v0.11-0.12: 343-372sn, tamam %77-82 (is kapsami buyudu, bekci devrede)
- v0.18: 249sn, edit/tur 1,05 (sozlesme olgun)
- v0.19 firtina giris: 189sn, toolFail 5,9
- v0.21: 217sn, decode 111,6, 752 LOC, 12 test/1 kirmizi
- v0.22: 146,7sn, tamam %95, toolFail 4,2, decode 120,1, 529 LOC, 36 test/1 kirmizi — EN IYI SURUM

## Sozlesmenin tek-basina etkisi (on-cesi -> sozlesme)
- toolFail %13,8 -> %8,8 (%36 dusus)
- edit/tur 0,05 -> 0,52 (10x — konusmadan ise gecis)
- turSn +33% (200->267): yavaslama degil, kapsam buyumesi (T: medyan 108->113 sabit)

## Firtinanin etkisi (sozlesme-sonu v0.18 -> firtina)
- turSn 249 -> 185sn (%26 hiz)
- toolFail 9,9 -> 5,4 (%45 dusus)
- tamam %82 -> %87; v0.22'de %95
- txt-to-cad'de tekrarlanmadi: tamam %81 -> %66 (T: is karisimi farkli)

## Eksikler / kor noktalar
1. locDelta + decode sadece v0.21+: faz karsilastirmasi bu eksenlerde mumkun degil
2. halRef v0.21'de %100 yanlis-pozitifti (fix b306324); v0.22'de henuz ref uretilmedi, metrik dogrulanmamis
3. BK-02 reload kirliligi aktifSn'i bozuyor (isci b0a4af2d uzerinde)
4. A2-9 kabul sayaci cift sisiyor: tamam % metrigi hafif iyimser
5. v0.22 orneklemi 44 tur, pencere ~1 gun — W43 rollup'i beklenmeli
6. turSn uzun kuyruklu: ort 267 vs medyan 113 — ortalamaya degil medyana bak
