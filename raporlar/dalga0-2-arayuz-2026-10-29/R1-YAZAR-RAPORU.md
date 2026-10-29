# DALGA-0-2 · R1 DÜZELTME — YAZAR RAPORU (DALGA0-2-ARAYUZ-1 · KAPI K1 · R1 bacağı)

**Yazar dalı:** `dalga0-2-r1-duzeltme` (ayrı worktree — K-0053 dalga hattı; merge + tam kanal + kapanış OPERATÖRE)
**Fiş:** `raporlar/dalga0-2-arayuz-2026-10-29/BRIEF-R1-DUZELTME.md` (kullanıcı emri «birleşik teklifi incele eğer uygunsa uygula», 2026-10-29 13:56)
**Taban:** merge **20767b8** (dal, main 5316354'ten açıldı — pano/ içerikleri 20767b8 ile özdeş) · **Tasarım SSOT:** mockup-final.html GÜNCEL hali (1254 satır, tablist=0) + GEREKSİNİM-MATRİSİ §3-§5

## 1. Teslim özeti

`pano/kapsul-tuval.html` **R1 TEK-AKIŞ revizyonu** (kullanıcı: «izle denetle yönet diye ayrı ayrı buton… daha user dostu» — aa3da88):

- **İZLE/DENETLE/YÖNET sekmeleri TAMAMEN KALDIRILDI:** kaynakta `role="tablist"` 0 · `role="tab"` 0 · `aria-selected` 0 · `function sekme(` 0 · `edimTab` 0 · `data-panel` 0 · panel-izle/panel-denetle/panel-yonet 0 · `edimPanel` 0 (test 10 ile kanıtlı). Drawer'da nav YOK.
- **TEK AKIŞ sırası:** ÜST GENEL STATE rozetleri + ordu şeridi (main'den ÖNCE, hep görünür — test 19) → SOL DRAWER (AI CHAT üstte + faz-gruplu görev ağacı altta + «görev haritası» bağlantısı) → KAPSÜL KARTI (#detay: **DENETİM KANIYI INLINE** — tam kanal 467/467 · x=0 · ölçüm çifti 166→206 · tip GECTI · duvar 1297<emsal 1473 · kaçak 0, her satır «kayıtlı» damgalı; makine-okur diliminde `n.denetim` alanı) → **«Görev haritası» KATLANIR DAG bölümü** (etiketli düğümler + viewBox zoom/pan/pinch AYNEN; ≥44px katlama + aria-expanded + açılışta `enBoyDuzelt()+vbUygula()` rect=0 ölçüm-düzeltmesi) → run kartları → onay-bekleyenler (#orta içine taşındı, .govdeAlt kabı kalktı) → kanıt defteri (+ kanal geçmişi tablosu + kirmiziYuz kartı) → komut şablonları → alt komut kutusu.
- **Yönetim eylemleri bağlamda (K3):** görev kartında ⧉ GÖREV FİŞİ (BRIEF) + ⧉ DISPATCH ŞABLONU (görev kimlikli) + ◎ TUVALDE BUL; onay kartında onay cümlesi kopyala — **EK-2 dokunulmaz** (onay cümlesi JS'te üretilmez/çalıştırılmaz; yalnız statik metin kopyalanır).
- **Kalp-yüzü verileri ÖRNEK-etiketli KALDI** (B tercihi): serit beyanı + `data-ornek` kapları + görünür rozetler; denetim değerleri «kayıtlı kapanış» damgasıyla.

**EK-ŞART (14:03 — merge'den önce ulaştı, tek dalgada uygulandı): SOLDAN AI CHAT GERİ GELDİ.**
- **Drawer ikiye bölündü:** ÜSTTE AI CHAT paneli (mesaj listesi `role="log"` + ≥44px input + gönder düğmesi), ALTTA faz-gruplu görev ağacı. Masaüstünde solda ikisi birlikte (≥1024 sabit sütun; chatListe max-height 180px — ağaç alanı korunur); mobilde drawer overlay içinde.
- **Chat davranışı bu dalgada = YERLEŞİM + ŞABLON-KOMUT ÜRETİCİ (dürüst):** hedef cümle → hazır komut ŞABLONLARI (`node src/cli.ts gece --hedef "<cümle>" --limit 5` · `node src/cli.ts replan --esik N --hedef N` · `node src/cli.ts graf goster`) + **plan taslağı ŞABLONU** (hedef/görev/faz/limit alanları) + her birinde ⧉ kopyala (panoya). «Planı oluştur» akışı: plan taslağı gösterilir → «planı komuta çevir + kopyala» düğmesi gece komutuna çevirir.
- **Görünür etiket:** panel başlığında «**ŞABLON — canlı AI yanıtı D-4**» rozeti + her yanıtın ilk satırında aynı beyan (CHAT_ETIKET) + `data-ornek` kabı — etiketsiz sahte AI YASAK ilkesiyle uyumlu.
- **EK-2 dokunulmaz:** chat onay cümlesi ÜRETMEZ (JS'te ONAYLIYORUM/--confirm yok), komut ÇALIŞTIRMAZ (chat bölümünde fetch yok — test 13/26), yalnız şablon kopyalar. Canlı AI yanıtı bağlantısı **D-4 dalgası**.

## 2. Ölçümler (hepsi koşulmuş — tahmin yok)

| Kapı | Sonuç |
|---|---|
| Hedefli test `node --test kapsul-tuval.test.mjs` (pano/) | **26/26 × 2 bağımsız koşum** — 636,5 ms + 474,6 ms |
| Test adedi | 26 vaka: 1-9 korunur (2 R1 sırasına güncellendi; eşik gevşetilmedi) · 10 DÖNÜŞTÜRÜLDÜ (tablist=0 + tek-akış) · 11 güncellendi (chat + denetimGecmis ÖRNEK) · 12-16 korunur · **17-26 yeni** |
| Inline script `node --check` | **SCRIPT_SYNTAX_OK** (728 satır script; gecici dosya OS temp'te) |
| Tip kapısı `npm run tip` (core/) | **GECTI** — hata 0 · bilinen borç 0 · yeni 0 · tsc 0 · 15 695 ms |
| İzole smoke (`PANO_PORT=4912`, kendi örneğim) | `/tuval` **200** (99 438 bayt) · `/api/graf` **200** (40 görev · 15 kenar · v14) · server kill edildi (taskkill; portta dinleyen YOK) |
| CRLF bütünlüğü | html 1 516 CRLF/0 LF-only · test 408/0 (server.js dokunulmadı) |

**LOC (`git diff --numstat` — sayım, tahmin değil):**

| Dosya | Durum | Eklendi | Silinen |
|---|---|---|---|
| `pano/kapsul-tuval.html` | düzenlendi | 287 | 173 |
| `pano/kapsul-tuval.test.mjs` | düzenlendi | 293 | 99 |
| `raporlar/dalga0-2-arayuz-2026-10-29/R1-YAZAR-RAPORU.md` | YENİ | (bu dosya) | — |

Kod LOC **+580/−272** — revizyon ölçeği (1 402 → 1 516 satır; sekmeli mekanik kalktı, yerine katlanır bölüm kabuğu + chat paneli + kart-içi denetim bloğu + 10 yeni test vakası geçti).

## 3. Yeni testler (17-26; her iddia kaynak-düzeyi, adıyla kırmızı düşer)

17- **denetim kanıtı kapsül kartında inline** (kartBolumBas CSS+JS · data-ornek sarmalayıcı · kSatir("tam kanal"/"ölçüm çifti"/"tip · duvar") · 467/467·x=0·sureSn=206 · «tek örnek; hız iddiası YOK» · GECTI·1297·1473 · kayıtlı damgası ≥4 · n.denetim makine dilimi · panel-denetle YOK · kanal·a3/a02/a03 geçmişi defter bölümünde) · 18- **katlanır DAG** (haritaBolum/haritaKatla/aria-controls=haritaGovde/aria-expanded=true · arclar+tuvalSarma haritaGovde içinde · haritaGovdeAc içinde enBoyDuzelt+vbUygula · .katlaBtn 44px · click dinleyicisi · textContent senkronu · data-zipla="haritaBolum" · kirmiziYuz'ta haritaSayi reset) · 19- **GENEL STATE + ordu şeridi hep-görünür** (rozetler+orduSeridi main'den önce · role=status · hidden yok · statik rol sayısı YOK) · 26- **AI CHAT EK-ŞART** (drawer chat-üst/ağaç-alt · chatListe role=log · chatGiris/chatGonder · data-ornek · chatSablonlar gerçek komut üretir --hedef/--limit 5 · plan taslağı görev/faz/limit alanlı · «planı komuta çevir + kopyala» · submit işleyici · panoaYaz+data-chat-komut · JS'te ONAYLIYORUM YOK · chat'te fetch YOK · boş cümlede dürüst uyarı).

**E7-E12 onarım derslerinin test vaka durumları (brief §2 listesi — tamamı vaka OLDU):**

| Ders | Vaka |
|---|---|
| E7 ölü-buton-yok | **20** — statik her `<button>` kablolı (data-kanca veya JS referansı veya form-submit; JS-doğumlu düğmeler delege/doğrudan dinleyicili) |
| E8 44px çipler dahil | **21** — global `button{min-height:var(--min-dokunma)}` + bagimliChip/orduChip `<button` doğumu + katlaBtn/drawerKapa/ziplink/chatGiris/chatGonder/buyuk-btn/komut-giris |
| E9 id-class birebir | **22** — JS'in `$("…")` beklediği her id kaynakta birebir (statik veya JS şablonu) + 16 yeni sınıfın CSS kuralı + #denetimGecmis |
| E10 SSOT sayı tutarlılığı | **23** — haritaSayi/agacSayi G'den sayılır · kok/İNSAN-kapılı/AKTİF filter · statik yer tutucu «—» · statik HTML'de sabit sayı YOK · ordu şeridi yer tutucusu sayısız |
| E11 uydurma-veri-yok | **24** — kayıtlı-beyanlı denetim + kanal geçmişi · hız iddiasına red · chat ŞABLON etiketi (statik+JS) · kadro fallback · grafsız bağımlılık pasif çip · «canlı değil» ≥5 |
| E12 animasyon kümesi | **25** — @keyframes YOK · animation yalnız none · her transition özelliği transform/opacity · süre ≤600ms (reduced-motion bloğu tarama dışı — onu 14 kapsar) |

## 4. DÜRÜST NOTLAR (yapamadığım / sapan — adıyla)

1. **Görsel/tarayıcı kabulü yazarın elinde değil:** DOM render testi yasak (yeni bağımlılık). İddialar kaynak-düzeyi + izole HTTP smoke. Gerçek görsel kabul (D-1b) operatör tarayıcısında: `http://127.0.0.1:4377/tuval` (ana 4377 örneğine yazarak HİÇ dokunulmadı; server her istekte dosyayı diskten okur — restart gerekmez).
2. **AI CHAT bu dalgada ŞABLON üreticidir — canlı AI yanıtı yok** (EK-ŞART'ın dürüst sınırları): yanıtlar komut şablonları + plan taslağıdır; hedef cümleden komut türetme kural tabanlıdır (gece şablonuna gömme + replan/graf sabitleri). LLM'e bağlanan gerçek «sohbet zekası» D-4 dalgası. Etiketsiz sahte AI üretmedim — panel görünür ŞABLON rozetli.
3. **Denetim kartı değerleri taban kümesiyle korundu** (467/467 · sureSn=206 · h=ea78bd3 · ölçüm çifti 166→206): kaynağı beyanlı «kayıtlı kapanış» değerleridir; 20767b8 merge'inin kanal değerine (sureSn=100) YENİLENMEDİ — dalga kapanış ölçüm çifti operatörün kapanışında yazılır (K-0053 hattı: merge anında tam kanal + tip). Kart içi değer seti dahili tutarlıdır.
4. **Komut şablonları bölümü (sablonListe) tek akışta KALDI:** mockup SSOT onu akışta tutar (katlanır DAG'den sonra); brief'te kaldırma emri yok. Test-12'nin data-kopyala ≥3 eşiği sürekli.
5. **Drawer tek bağlantıya indi:** «görev haritası» ziplink — onay/GENEL STATE ziplink'leri kaldırıldı (kısa brief okuması: drawer = yalnız ağaç + görev haritası bağlantısı; AI CHAT EK-ŞART'la eklendi).
6. **#sag sticky YAPILMADI** (mockupta var): uzun kaydırma davranışı riski; rapora not düştüm, operatör isterse sonraki dalga.
7. **drawerKapa 36px→44px** (E8); **#orta/#sag ≤768'de display:contents** (test-2 kalıbının süreklilik kuralı — yaprak sırası #detay:2/#haritaBolum:3/#runBolum:4/#onayBolum:5/#defterBolum:6/#sablonBolum:7).
8. **Worktree'de core/ npm install (önceki yazar oturumundan) korunarak kullanıldı** (tip kapısı koşabilsin diye; node_modules gitignored — repo değişikliği DEĞİL). Bu oturum yeni kurulum yapmadı.
9. **denetimGecmis id-selector'lıdır** (`#denetimGecmis{margin-top:14px}`) — sınıf listesi değil; test 22 id kuralını ayrıca kanıtlar.
10. **Test-2'nin anlattığı kırılım:** ≤768'de #sol overlay (order:1 görsel etkisiz — inert); ilk görsel blok #detay (kapsül kartı), sonra katlanır DAG. Kaynak iddiaları regex'te birebir.
11. **Harita katlama kapatılınca tuval DOM'da kalır** (hidden ile gizlenir): yeniden açılışta rect=0'a karşı yeniden ölçülür — viewBox bozulmaz; test 18 kanıtlar.
12. **E5'«>—<' yer tutucu kontrolü** tam eleman regex'ine çevrildi (tagOf yalnız açılış etiketini döndürdüğü için) — eşik aynı, desen daha kesin.

## 5. Operatöre bırakılanlar

- **Merge:** `dalga0-2-r1-duzeltme` → main (`--no-ff`; K-0053 — merge anında tam kanal + tip kapısı + hedefli; kırmızıysa `git reset --keep ORIG_HEAD`).
- **Kapanış ölçüm çifti + TASLAK + STATE_BOARD damgası + CODEMAP regen** — operatörde (yazar worktree'si açıkken CODEMAP regen YASAK — ders).
- **Push** — tek elden operatörde (yazar hiç push yapmadı; bu commit YEREL).
- **Görsel kabul (D-1b):** tek akış sırası, katlanır DAG (kapat/aç — yeniden ölçüm), drawer'da AI CHAT (hedef cümle → şablon + kopyala), kapsül kartında DENETİM KANIYI bloğu, karttaki fiş/dispatch kopyala düğmeleri.
