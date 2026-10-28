# REHBER-EK — Yeni Projede İlk 15 Dakika (REHBER §9; K-0052 taşınması)

REHBER §9 checklist'i buradadır. Yükleme koşulu: yeni projede ilk tur — sözleşme plugin'i kuruluysa agent-onboarding otomatik tetikler, kurulu değilse manuel uygula.

- [ ] SSOT belgeleri oku. Yoksa önce eşleme yap: repo'da eşdeğer dosya var mı (LESSONS.md↔DERSLER.md, devlog/_audit↔raporlar/, mevcut karar günlüğü↔kararlar/)? Varsa mevcut dosyaya yaz — çift-kayıt yasak. Gerçekten yoksa §4'teki L0-L1-L5'i oluştur (3 dosya, 10 dakika).
- [ ] `git log --oneline -10` + `git status` — neredeyim? Test komutunu bul ve bir kez koştur (baseline).
- [ ] Son handoff var mı? Varsa echo doğrula (§3.2 — K-0052 yenumaralandırması; eski metinde §3.4).
- [ ] CODEMAP.md var mı ve güncel mi? Yoksa `scripts/codemap.*` ile üret/güncelle; araç yoksa üretim yolunu STATE'e not et. CODEMAP elle düzenlenmez.
- [ ] DERSLER.md yoksa oluştur; ilk kayıt: bu oturumda öğrendiğin ilk tuzak. Durum dosyasına ilk damganı at (kullandığın sözleşme sürümünü de yaz: v2.1).

Kaynak: sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md §9 (K-0052, 2026-10-28 — içerik kayıpsız taşındı).
