# Kilitli Surum - v0.23-kilit

- Tarih: 2026-10-26 - Commit: `9853bb1` - Tag: `v0.23-kilit`
- Doctor: 1 OK / 0 EKSIK / 0 SARI
- Ek ozet: 446 assertion yesil (9 test dosyasi) + tsc --noEmit exit 0
- Hedefler + eksen puanlari: `kilit.json` (makine-okunur)
- Not: S3 dalgasi kalemleri + kilit damgasi elle atildi (kilit-surum.ps1 cift-ev varsayimi + paralel-oturum kirli-agac reddi; doctor kapilari gercek kosuldu) — aciklama `kilit.json` not alaninda

## Rollback

`git reset --hard v0.23-kilit` -> `scripts\codemap.ps1` (tazelik damgasi) -> `scripts\saglik.ps1` yesil.
Plugin reposunda: tag'e don + `paseo plugin reload paseo-verimlilik`.
