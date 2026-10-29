# DALGA-0-2 · R1 DÜZELTME BRIEF'İ — sekmeler kaldırılır, TEK AKIŞ

**Kimlik:** DALGA-0-2'in R1 düzeltme bacağı (KAPI K1). **Kaynak:** [TEKLIF-BIRLESIK-DALGA0-2.md](../arayuz-mockup-6sub-2026-10-29/TEKLIF-BIRLESIK-DALGA0-2.md) — kullanıcı «birleşik teklifi incele eğer uygunsa uygula» (2026-10-29 13:56; uygun bulundu; koder oturumu kısıtlı → bu oturum yürütür). Hat: K-0053 aynen.
**Taban:** merge **20767b8** — `pano/kapsul-tuval.html` 1403 satır (sekmeli yapı inşa edildi; şimdi R1 revizyonu). **Tasarım SSOT:** mockup-final.html **GÜNCEL** hali (1254 satır, tablist=0) + GEREKSİNİM-MATRİSİ §3-§5.

## 1. Hedef (EK-3)

`pano/kapsul-tuval.html`'de **R1 TEK-AKIŞ revizyonu** (kullanıcı: «izle denetle yönet diye ayrı ayrı buton… daha user dostu» — aa3da88):

- **İZLE/DENETLE/YÖNET nav/sekmeleri KALDIR:** kaynakta tablist=0 · role="tab" 0 · aria-selected 0 · sekme fonksiyonu 0 — hiçbir sekme mekaniği kalmaz. Drawer'da nav YOK: drawer = yalnız faz-gruplu görev ağacı + «görev haritası» bağlantısı.
- **TEK AKIŞ sırası:** ÜST GENEL STATE + ordu şeridi (hep görünür) → SOL DRAWER (görev ağacı) → KAPSÜL KARTI (**denetim kanıtı INLINE: kanal x=0 + ölçüm çifti + tip**) → «Görev haritası» **KATLANIR DAG** bölümü (etiketli düğümler + mevcut viewBox zoom/pan KORUNUR; ≥44px katlama + aria-expanded + rect=0 ölçüm-düzeltme deseni açılışta) → run kartları → onay-bekleyenler → kanıt defteri → alt komut kutusu.
- **Yönetim eylemleri bağlamda:** görev kartında fiş/dispatch-şablonu **kopyala**; onay kartında onay cümlesi **kopyala** (EK-2 dokunulmaz — GUI'de üretilmez/çalıştırılmaz).
- **Kalp-yüzü verileri ÖRNEK-etiketli KALIR** (B tercihi — canlı bağ D-2 dalgası; E13-A `/api/ordu` ucu D-2'ye taşındı, bu dalgada YOK).

## 2. Çıktı

- `pano/kapsul-tuval.html` (DÜZENLENECEK)
- `pano/kapsul-tuval.test.mjs` (DÜZENLENECEK): korunabilir vakalar KORUNUR (drawer/aria/Escape/perde/44px/reduced-motion/ÖRNEK-etiket/kopyala/emoji-yok/dış-fetch-yalnız-/api/graf); «İZLE/DENETLE/YÖNET varlığı» vaka(ları) → **tablist=0 + tek-akış varlığı**; YENİ: denetim-kanıtı-kapsül-kartında · katlanır DAG bölümü · GENEL STATE + ordu şeridi hep-görünür · E7-E12 dersleri (ölü-buton-yok / 44px çipler dahil / id-class birebir / SSOT sayı tutarlılığı / uydurma-veri-yok / animasyon yalnız transform/opacity)
- `raporlar/dalga0-2-arayuz-2026-10-29/R1-YAZAR-RAPORU.md` (YENİ)

## 3. Araç/kaynak (readFiles)

mockup-final.html (güncel, 1254) · GEREKSINIM-MATRISI.md §3-§5 · kapsul-tuval.html (20767b8 hali) · kapsul-tuval.test.mjs · pano/server.js (SALT-OKUR anlama).

## 4. Sınır

Mevcut dosya ≤3 (html + test; rapor yeni). server.js + graf SSOT + core/ + scripts/ YAZMA YASAK. Yeni bağımlılık YOK. K5 korunur seti AYNEN: kirmiziYuz fail-closed · İNSAN/MAKİNE OKUR (modUygula) · sec(id) senkronu · 30 sn tazeleme · yerlesim döngüde-çizilmez · «(faz yok)» dalı. K-0053 hattı: yazar ayrı worktree/branch → merge --no-ff → merge anında tam kanal + tip + hedefli + kapanış ölçüm çifti (taban: son-kanit 100 sn / h=20767b8).

## 5. Yazar akışı

1. readFiles (§3). 2. Kod + test (2 bağımsız koşum). 3. `npm run tip` (core/). 4. İzole smoke: boş port, /tuval 200 + /api/graf 40 görev; server kill. 5. Branch'inde commit (-F %TEMP% deseni; emoji yok; Co-Authored-By). 6. R1-YAZAR-RAPORU.md: branch + hash + test X/X ×2 + tip + smoke + LOC + dürüst notlar (E7-E12 derslerinin hangileri test vaka OLDU listesiyle).
