# DALGA-0 ARAYÜZ — YAZAR BRIEF'İ (K-0053 hattı · DIKEY-HIZALAMA ilk dalgası)

**Dalga ID:** DALGA0-ARAYUZ-1 · **Tur başlangıcı:** 2026-10-29 11:04:48 · **Operatör:** ana oturum (merge/kanal/kapanış tek elden) · **Yazar:** ayrı worktree/branch (bu brief'in alıcısı)

## 1. Hedef (EK-3 ögesi 1)

`pano/kapsul-tuval.html` → **responsive + touch + clean + faz-gruplu sol ağaç**. Kullanıcı cümlesi (SSOT kaynağı): «ilk önce arayüzü düzelteceğiz — responsive touch uyumlu clean net kullanıcı arayüzü» + «görev graf ve çalışan ordunun izleme denetleme arayüzü». Somut değişiklikler:

1. **Responsive:** `<meta name="viewport">` ekle (yoksa); CSS media query'ler — dar görünümde (≤768px) düzen tek-sütuna iner: sol görev listesi üstte, SVG tuval altta, detay paneli listeyi takip eder; geniş görünümde bugünkü yan-yana yerleşim korunur.
2. **Touch:** tıklanabilir hedefler (görev satırları, butonlar, mod düğmeleri) ≥44×44px dokunma alanı (padding/min-height); mobil font boyutları okunur; hover'a bağımlı davranış yok (her eylem click'te de çalışır — zaten click temelli, koru).
3. **Clean:** tek boşluk ölçeği (4px katları), az sayıda gri tonu, başlık hiyerarşisi net; mevcut koyu tema korunur (tema değişikliği kapsam DIŞI).
4. **Faz-gruplu sol ağaç:** sol liste bugünkü gibi durum-gruplu (HAZIR/BEKLE/DEVAM/KAPALI) DEĞİL, **faz-gruplu** olsun: graf verisindeki görev-başı `faz` alanı (DC/F0..F4) başlık olur, altında görev satırları. `faz` alanı olmayan görev «(faz yok)» grubunda listelenir — uydurma faz ÜRETİLMEZ. Durum renk noktaları satırlarda kalır (bilgi kaybı yok).
5. **KORUNUR (regresyon yasak):** kirmiziYuz fail-closed yüzü · İNSAN OKUR/MAKİNE OKUR modUygula (aynı fetch) · sec(id) detay tablosu + kartIcerik butonu · 30 sn auto-refresh · yerlesim() SVG DAG + döngüde-çizilmez kuralı · kapsül kartı üretim ucuna dokunma.

## 2. Çıktı formatı (EK-3 ögesi 2)

- **Düzenlenen dosya:** `pano/kapsul-tuval.html` (tek dosya ağırlıklı — HTML+CSS+JS inline kalır).
- **YENİ test dosyası:** `pano/kapsul-tuval.test.mjs` — `node --test` (pano/ çalışma dizininden). Kaynak-düzeyi iddialar (HTML dosyasını okuyup): viewport meta var · media query var · 44px dokunma kuralı (min-height/min-width CSS) var · faz-gruplama kodu + «(faz yok)» dalı var · kirmiziYuz/İNSAN OKUR/MAKİNE OKUR/sec/kartBtn etiketleri hâlâ kaynakta · fetch ucu `/api/graf` değişmemiş. 6-9 vaka; her vaka ADIYLA kırmızıya düşer (fail-closed). DOM render testi YOK — yeni bağımlılık (jsdom vb.) EKLENMEZ.
- **YENİ dalga raporu:** `raporlar/dalga0-arayuz-2026-10-29/YAZAR-RAPORU.md` — kısa: değişiklik listesi (LOC sayımı) · test koşum çıktısı (kopya) · dürüst notlar · «operatöre bırakılanlar» (merge/kanal/kapanış).
- **LOC hedefi:** ~250-400 (DIKEY plan §3; saparsan dürüst yaz — tahminle değil gerçek sayımla).

## 3. Araç/kaynak (EK-3 ögesi 3)

- **Oku (koddan dokunmadan önce):** `pano/kapsul-tuval.html` (asıl zemin) · `pano/server.js` (yalnız /tuval + /api/graf uçlarını anlamak için — DOKUNMA) · `plans/gorev-grafigi-2026-10-26.json` içinde bir görevin `faz` alanı (grep 'faz' — verinin şekli) · `plans/PANO-PLANGRAF-VIZYON-2026-10-29.md` §1-§3 (vizyon FAZ-A) · `plans/DIKEY-HIZALAMA-PLANI-2026-10-29.md` §3 DALGA-0.
- **Koşum:** hedefli test `node --test pano/kapsul-tuval.test.mjs` (repo kökünden ya da pano/'dan — hangisi çalışıyorsa rapora yaz). Server testi: `pano/server.js` ZATEN 4377'de koşuyor (PID 33340) — öldürme/yeniden başlatma YOK; değişiklikten sonra sayfayı doğrulamak istersen ayrı portta örnek: `node pano/server.js` + PANO_PORT farklı — izole port dışında canlı süreçlere DOKUNMA.
- **Sözleşme (donmuş):** server.js API'leri ve graf JSON şeması DEĞİŞMEZ; HTML'in kullandığı alan adları aynı kalır.

## 4. Görev sınırı (EK-3 ögesi 4)

- **Yapma:** `pano/server.js` DOKUNULMAZ · `plans/gorev-grafigi-2026-10-26.json` SALT-OKUR (YAZMA YASAK) · core/ ve scripts/ dokunulmaz · graf SSOT'ya veri EKLENMEZ · yeni npm bağımlılığı YOK · CODEMAP ÇALIŞTIRMA (worktree kirliliği — operatör merge sonrası üretir) · push YASAK (tek elden operatör) · emoji yok · test adedi kırma/eşik gevşetme yok.
- **Commit (worktree branch'inde):** dosya adıyla `git add pano/kapsul-tuval.html pano/kapsul-tuval.test.mjs raporlar/dalga0-arayuz-2026-10-29/YAZAR-RAPORU.md`; mesajı %TEMP% dosyasına yaz (PS 5.1 çift tırnak tuzağı — [IO.File]::WriteAllText + UTF8Encoding($false), BOM YOK) + `git commit -F`; mesaj sonu boş satır + `Co-Authored-By: Claude Code <noreply@anthropic.com>`; `2>&1` KULLANMA.
- **Bitiş koşulu:** hedefli testler TAM yeşil + YAZAR-RAPORU.md yazılmış + branch'te commit atılmış. Kırmızı kalırsa düzelt — düzeltemezsen dürüst raporla, asla testi gevşetme.
- **Dürüstlük:** sahte yeşil (testi iddiaya uydurma) ADIYLA yasak; yapamadığını yaz.

**Dalga ölçütleri (operatör kapanışta arar):** merge anında tam kanal x=0 (core 467) + tip GECTI + hedefli test yeşil + kapanışta V9-04 ölçüm çifti (kanal tabanı: 2026-10-29 inceleme kanalı sureSn=166 h=ebb6692) + kaçak dosya 0 (yalnız 3 dalga dosyası) + kirli-dosya ihlali 0 (ana ağacın kirli tracked dosyaları değişmez).
