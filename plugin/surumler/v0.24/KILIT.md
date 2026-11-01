# Kilitli Sürüm - v0.24-kilit

- Tarih: 2026-11-01 - Commit: `704c9ef` - Tag: `v0.24-kilit`
- Doctor: 1 OK / 0 EKSİK / 0 SARI
- Ek özet: KD-a çekirdek diyeti — 22 kural / 3693 B (%68,2); 446 ok + 18 assert / 10 dosya EXIT=0; tsc EXIT=0
- Hedefler + eksen puanları: `kilit.json` (makine-okunur)
- Not: Kilit damgası ELLE atıldı (kilit-surum.ps1 çift-ev varsayımı + paralel kirli-ağaç reddi; v0.23 emsali) — doctor kapıları gerçek koşuldu; ayrıntı `kilit.json` not alanında
- Kapsam: KD-a (CEKIRDEK v2.1 + `cekirdek-diyet.test.ts`); v0.23 kilidi değişmedi
- Dürüst sınır: canlı senkron YOK — `paseo plugin reload` = KD-c [insan]

## Rollback

`git reset --hard v0.24-kilit` -> `scripts\codemap.ps1` (tazelik damgası) -> `scripts\saglik.ps1` yeşil.
Plugin reposunda: tag'e dön + `paseo plugin reload paseo-verimlilik`. Bir önceki kilit: `v0.23-kilit`.
