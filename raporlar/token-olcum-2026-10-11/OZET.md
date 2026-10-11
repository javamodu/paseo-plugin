# Token Ölçümü — 2026-10-11 (R)

Kaynak: `scripts\yonetici-ozeti.ps1 -SadeceToken` (Codex rollout kayıtları, `~/.codex/sessions/*.jsonl`; tur bazında `turn_id` dedup, MAX alınır). Yeniden üretim: aynı komut herkesçe koşturulabilir.

## Tüm kayıtlar (TokenDays=0)
- 653 oturum · 3.304 tur · 30 proje
- Input: 10.666.844.364 · cached: 10.326.071.808 · output: 61.158.030
- **Cache-hit: %96,8** · efektif maliyet ~1,43B token (cached %90 indirimli, OpenAI fiyat tablosu) → **%86,6 tasarruf**
- Proje aralığı: %50,6 (esp32, 2 tur) — %97,5; büyük hacimliler %95,5-97,5 bandında

## Bugün (TokenDays=1)
- 78 oturum · 124 tur · 6 proje
- Input: 328.524.565 · cached: 315.855.360
- **Cache-hit: %96,1** → %85,8 tasarruf
- Bu repo (paseo-plugin): %82,3 (11 oturum, 18 tur — genç repo, örneklem küçük)

## Hüküm
- "Cache-dostu sıralama" (Plan madde 2): **doğrulandı, kapandı** — %96,8, Anthropic'in "%40 altı = promptu düzelt" eşiğinin ~2,4 katı üstü.
- Plan §4 cache-hit eşiği ≥%60: saha verisi eşiğin çok üstünde; eşik aynen kalır (alarm eşiği olarak anlamlı).
- paseo-plugin'in %82-83'ü izlemeye değer: yeni repo + sık dosya değişimi cache kırar; şişerse müdahale.

## Etiket
(R) — rollout kayıtlarından doğrudan ölçüm; hesaplama scripti repo'da (`scripts/yonetici-ozeti.ps1` §5).
