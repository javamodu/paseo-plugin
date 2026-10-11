# Kilitli Sürüm — v0.4-kilit (paseo-plugin)

- Tarih: 2026-10-11 · Commit: `c021356` · Tag: `v0.4-kilit` (origin'e push'lu)
- Doctor: 16 OK / 0 EKSIK / 1 SARI (SARI = 68 kural, v2.1 backlog)
- Hedefler + eksen puanları: `kilit.json` (makine-okunur) — kaynak: `hedefler.json`
- Nitelik: **baz kilit** — v0.5 öz-değerlendirme döngüsü öncesi referans noktası (K-0007)

## Rollback tatbikatı (R)

2026-10-11'de canlı denendi: REHBER dosyası silindi → doctor 1 EKSIK ("REHBER (v*) mevcut") →
`git reset --hard v0.4-kilit` → `scripts\codemap.ps1` tazeleme → doctor tekrar 16 OK / 0 EKSIK / 1 SARI.
Ders: doctor'un CODEMAP tazelik kontrolü zaman-damgalı — rollback sonrası codemap tazeleme **şart**.

## Rollback prosedürü

1. `git reset --hard v0.4-kilit`
2. `scripts\codemap.ps1` (tazelik damgası)
3. `scripts\saglik.ps1` → 16 OK / 0 EKSIK beklenir
