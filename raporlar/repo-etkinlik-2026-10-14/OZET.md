# Repo Etkinlik Olcumu — 2026-10-14 01:45 (R: 14 repo telemetri.jsonl disk taramasi)

## Buyuk resim (anlamli orneklem: >=10 tur)
| repo | tur | tamam % | ort turSn | decode tok/sn | toolFail % | LOC | test k/k |
|---|---|---|---|---|---|---|---|
| paseo-plugin | 387 | 86 | 184 (medyan 84) | 123,8 | 12,9 | 889 | 48/2 |
| txt-to-cad | 167 | 74 | 272 (medyan 76) | 151,9 | 11,8 | 0* | 11/3 |
| chromex | 36 | 92 | 21,5 (medyan 1) | 190,9 | 9,9 | 5 | 0/0 |
| scraper | 15 | 100 | 177,5 | 38,3 | 7,3 | 121 | 57/0 |
| llm-orchestrator-py | 13 | 92 | 829 | 244,7 | 6,7 | 719 | 105/6 |

*txt-to-cad locDelta hic kaydedilmemis (v0.20 oncesi / git yok). <10 turlu repolar: agent-*, BRE, chromex-extension(8), playwright-cdp, vscode, rust-file-explorer — anlamli kiyas icin yetersiz.

## Firtina etkisi (turSn>0 filtresi, ayni repo ici)
| repo | mod | n | ort turSn | tamam % | toolFail % |
|---|---|---|---|---|---|
| paseo-plugin | firtina | 98 | 185,2 | 85 | 5,0 |
| paseo-plugin | diger | 173 | 247,7 | 89 | 13,2 |
| txt-to-cad | firtina | 51 | 334,3 | 63 | 10,0 |
| txt-to-cad | diger | 69 | 352,4 | 80 | 11,7 |

- paseo-plugin'de firtina: tur %25 daha hizli, toolFail 2,6x daha dusuk (R).
- txt-to-cad'de firtina hiz farki kucuk (%5), tamamlanma 17pp dusuk (T: zor is karisimi farkli olabilir).
- decode karsilastirmasi mumkun degil: alan v0.21+ ile geldi, firtina-disi donemde yok.

## Dikkat cekenler
- halKirik %100 orani (paseo-plugin 38/38, llm-orch 80/80, scraper 54/54) eski yanlis-pozitif donem; fix b306324 ile commitli, yeni veri birikiyor.
- chromex medyan turSn=1sn: 36 turun cogu mikro-tur (T: heartbeat/hizli komutlar); ortalama yanıltir, medyan oku.
- llm-orchestrator-py en yogun gercek-is reposu: 105 test kosusu, 719 LOC, ama 829sn ort tur (T: uzun derleme/test donguleri).
