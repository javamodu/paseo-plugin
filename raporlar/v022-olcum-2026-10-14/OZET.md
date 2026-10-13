# v0.22 Olcum — 2026-10-14 01:30 (R: telemetri.jsonl disk taramasi, 14 repo)

## AktifSn birikimi
- Sadece paseo-plugin: 19 tur (hepsi firtina), pencere 21:32-22:25 UTC (~54dk). Esik 50 tur — birikiyor.
- Diger 13 repo v0.22 sonrasi tur uretmedi (txt-to-cad son yazim v0.22 oncesi).

## Hiz / kalite (firtina, paseo-plugin)
- turSn: v0.19 177,8 -> v0.21 209,9 -> v0.22 141,9 (T: 19 tur, kucuk orneklem)
- decodeTps: v0.21 111,6 -> v0.22 137,8 (T)
- test: v0.22'de 8 kosu, 0 kirmizi (v0.21: 12 kosu, 1 kirmizi)

## AktifSn tutarliligi
- 13 ciftte 11'inde aktifSn = turSn - 1sn (beklenen davranis)
- 1 aykiri: tur=4sn ama aktif=264sn -> BK-02 reload redelivery kirliligi ile uyumlu; ortalamayi tek basina bozuyor (181,3 gorunen vs gercek ~140)

## halRef dogrulamasi
- v0.21: 27/27 kirik = %100 yanlis-pozitif (onceki oturum canli deney kaniti)
- Fix b306324 (push'lu): cwd -> katmanKokuBul fallback; 3 yeni assertion yesil, npm test + tsc exit 0
- v0.22 turlarinda ref uretilmedigi icin canli halKirik verisi henuz yok
