# REHBER-EK — Öz-Değerlendirme + Sürüm Disiplini (REHBER §10; K-0052 taşınması)

REHBER §10 maddeleri buradadır. Yükleme koşulu: haftalık heartbeat (Pazar 20:00 Europe/Istanbul) veya Ctrl+K manuel tetik.

- Tetik: haftalık heartbeat (Pazar 20:00 Europe/Istanbul) veya Ctrl+K manuel. Değerlendirici okur: telemetri JSONL + saglik.ps1 + yonetici-ozeti.ps1 + hedefler.json + DERSLER yeni girdileri → raporlar/oz-degerlendirme/<tarih>.md (+ .json yan dosya).
- Hüküm + kıyas: hedef tuttuysa çıta yükseltilir (öneri); tutmadıysa kök neden + iyileşme planı taslağı plans/ altına — 3 dönem üst üste kötüleşme → alarm + insan kapısı. `scripts/kiyasla.ps1 <A> <B>` → eksen bazında delta tablosu; her değerlendirme raporu önceki kilit ile kıyas içerir.
- Onay şartı: hedef/plan değişikliği kullanıcı onayı olmadan uygulanmaz; ajan yalnız önerir. Onay → uygulama → karşı-inceleme → K-XXXX → yeni kilit.
- Kilit: her onaylı uygulama sonrası iki repoda scripts/kilit-surum.ps1 → git tag + surumler/<etiket>/ (KILIT.md + kilit.json: commit, puanlar, hedefler, doctor özeti). Kilitler append-only; silme yok.
- Rollback (yalnız kullanıcı komutuyla; ajan kendini eski sürüme döndüremez): git reset --hard <etiket>-kilit → codemap.ps1 (tazelik zaman-damgalı, tatbikat dersi) → saglik.ps1 yeşil. Plugin: tag'e dön + paseo plugin reload. Hedef geri alma: hedefler.json geçmiş kaydı + yeni K-XXXX.

Kaynak: sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md §10 (K-0052, 2026-10-28 — içerik kayıpsız taşındı).
