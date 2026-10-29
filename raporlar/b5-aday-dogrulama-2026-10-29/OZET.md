# B5 aday manifest ↔ disk doğrulaması — 2026-10-29

**Kaynak:** önceki oturum (e0963d30, v9-06 + B5 hazırlığı) `API Error: 400 Hata Oluştu` ile öldü (00:16); bu tur kullanıcı "devam" emriyle doğrulamayı tamamladı. Aday: `aday-20261028152606837.json` (64 yol, baseHead `40b72a3`, self-hash doğrulandı: `733fc17e…`). HEAD: `003f79e`. Ölçüm: 00:45:21Z.

## Sonuç (64 yol)

| Grup | Adet | Anlamı |
|---|---|---|
| **A** kirli + hash EŞİT | **50** (9 M + 41 ??) | B5'in dürüst staging seti — disk = manifest, stage güvenli |
| B temiz + değişmedi | 7 | ANAYASA + 6 kanit-hedef raporu — HEAD'de zaten aynı, no-op |
| **C** kirli + hash FARKLI | **3** | STATE_BOARD + W44 json/md — manifest anından sonra değişmiş, hareketli |
| **D** commit + FARKLI | **4** | AGENTS + CODEMAP + v7×2 — v9-06 zinciri manifesti geçersiz kıldı; **asla geri ezme** |
| E yok | 0 | — |
| outsideScope korunmuş | 6/6 | VAR |

## Ek bulgu (kritik)

`dogrula-kapanis.mjs` protected-unchanged denetimi `baslangic.json` sabitiyle (~13:43) karşılaştırır; v9-06'nın 27 commit'i core dosyalarını değiştirdi (tip-borcu 51→0) → **denetim şimdi patlar**: 15:26 doğrulaması core-koruma iddiasında da bayat, yalnız 7 manifest yolunda değil.

## B5'in dürüst uygulanma yolu (ADR-kilit-oncesi-kapanis'e göre)

B5 = **doğrulanmış aday + insan kabulü**; "bütün kirli dosyaları stage etmek" ve "onay taklidi" reddedilmiştir. 15:26 adayı artık doğrulanmış sayılmaz. Öneri: **yeni kapanış turu** (taze baseline + audit + yeni aday — fiilen RBT-2026-10-28.3) → [insan] B5 kabulü → commit/tag/push. Hızlı yol (aday elle revize) doğrulanmış-aday şartını zayıflatır.

Makine-okunur tam liste: [DOGRULAMA.json](DOGRULAMA.json).
