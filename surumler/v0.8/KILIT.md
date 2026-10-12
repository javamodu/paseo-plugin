# Kilitli Surum - v0.8-kilit

- Tarih: 2026-10-12 - Commit: `40080bd` - Tag: `v0.8-kilit`
- Doctor: 16 OK / 0 EKSIK / 1 SARI
- Ek ozet: saglik 16 OK / 0 EKSIK / 1 SARI (Jsonl'siz); Jsonl'li: 18 OK, cache %98,5 gercek olcum
- Hedefler + eksen puanlari: `
kilit.json` (makine-okunur)
- Not: K-0012: ucuncu review 8+2 bulgu kapandi (P0 permission + olcum hatti + kapilar)

## Rollback

`
git reset --hard v0.8-kilit` -> `
scripts\codemap.ps1` (tazelik damgasi) -> `
scripts\saglik.ps1` yesil.
Plugin reposunda: tag'e don + `
paseo plugin reload paseo-verimlilik`.
