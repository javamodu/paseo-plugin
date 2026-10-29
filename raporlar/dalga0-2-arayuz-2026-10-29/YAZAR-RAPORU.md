# DALGA-0-2 ARAYÜZ — YAZAR RAPORU (DALGA0-2-ARAYUZ · KAPI K1)

**Yazar dalı:** `worktree-agent-ae07618a00dec95de` (ayrı worktree/branch — K-0053 dalga hattı; merge + tam kanal + kapanış OPERATÖRE)
**Fiş:** `raporlar/dalga0-2-arayuz-2026-10-29/BRIEF.md` (kullanıcı emri «DALGA-0-2 başla», 2026-10-29 13:11)
**Tasarım SSOT:** `raporlar/arayuz-mockup-6sub-2026-10-29/mockup-final.html` (1245 satır) · **Hedef:** `pano/kapsul-tuval.html` mevcut yüz (269 satır) → İDEAL YÜZ

## 1. Teslim özeti

`pano/kapsul-tuval.html` tam yüz değişimi: **İKİ TEMEL birlikte** (KAPI-HARITASI R2) —

**Temel (a) — drawer + graf yüzü (GERÇEK veri, GET /api/graf):**
- Drawer: **>=1024px sabit kenar sütunu** (GRAF düğmesi toggle; `body.drawer-kapali #sol{display:none}`) · **<1024px overlay** (hamburger `#cekmeceBtn`, perde, `transform:translateX(-103%)`, **Esc kapatma**, **body scroll kilidi** `overflow:hidden`, **aria-expanded senkronu** `drawerDurumYaz`).
- İçinde İZLE / DENETLE / YÖNET nav (drawer + merkez sekmeler senkron; `role=tab`/`aria-selected`).
- **Faz-gruplu görev ağacı** `#agac` (DALGA-0 mirası: `g.faz` okunur, «(faz yok)» dalı korunur — 40 görevden 24'ü fazsız, uydurma faz yok; durum rengi `DURUMRENK[d]` + `title`=tam durum etiketi).
- Satır seçimi → **sağda kapsül detay kartı** `#detay`: kartUst (renkli kartId + KAPI rozeti + **İNSAN/MAKİNE OKUR** kart-içi düğmeler) + kSatırlar + **bağımlılık çipleri** (`.bagimliChip[data-gec]` → çipe dokunma `sec(dep)` ile zincirde gezinir; graf SSOT'ta olmayan bağımlılık kesikli-pasif) + **KAPSÜL KARTI OLUŞTUR (MD)** gerçek POST ucu + ◎ TUVALDE BUL.
- GENEL STATE rozet şeridi `#rozetler` (`role=status`): graf sürümü/görev/kenar, HAZIR/BEKLE/KAPALI sayımları, İNSAN-kapılı sayısı, AKTİF, bütçe, canlı sayaç — tamamı /api/graf'tan.

**Temel (b) — kalp yüzü (ÖRNEK etiketli; gerçek bağ D-2):**
- 6-rollü ordu şeridi (rol adları/modeller `G.roller`+`ajanKadrosu.varsayilan`'dan GERÇEK; canlı koşum durumu ÖRNEK) · run kartları (3 kayıtlı gerçek run + 1 kurgu dispatch kartı — hepsi ÖRNEK rozetli) · **onay-bekleyenler** (rpl-03579e06 statik komut + **kopyala GERÇEK panoya**; D-1b URL kopyala; K-0044 pasif bilgi) · **kanıt defteri** (çift-okur İNSAN/MAKİNE; kayıtlar ÖRNEK) · **$ komut kutusu** (odak ışıması + şablon önerisi + Enter→panoya; GUI komut çalıştırmaz) · DENETLE görünümü (kayıtlı ölçüm çifti) · YÖNET (görev fişi kopyala + şablonlar).
- **Sarı şerit beyanı** sayfa tepesinde: «kalp-yüzü verileri ÖRNEK — gerçek bağ D-2 dalgası»; her ÖRNEK kapta `data-ornek` + görünür `etiketOrnek` rozeti (test 11 ile kanıtlı: graf-yüzü kapları `data-ornek` TAŞIMAZ).

**DAG (İZLE):** `yerlesim` çekirdeği **DEĞİŞMEDİ** (döngüde-çizilmez korunur) + mockup deseni **viewBox zoom/pan**: tekerlek (passive:false + preventDefault), sürükle-pan, **pinch** (2 işaretçi mesafesi), SIĞDIR/1:1/+− düğmeleri, düğüm tıklanınca `sec()` + giren/çıkan kenar vurgusu (marker değişimi). **pointer-capture API'si KULLANILMAZ** (bilinen tuzak: click ölürümü) — pan pencere-düzeyinde dinleyicilerle; `tasindi` bayrağı drag sonrası tıklamayı yutar.

**Korunan DALGA-0 mirası (testlerle kanıtlı):** `kirmiziYuz` fail-closed (ağaç boşalır + tuval boş + kırmızı detay + rozet sıfırlanır — bayat graf kalmaz) · `modUygula` iki yüz aynı fetch · `sec(id)` · POST `/api/kart` ucu (token fail-closed, 201/409 aynı) · 30 sn tazelik · `.satir` 44px + width:100% · 768px tek-kolon kaynak kalıpları.

## 2. Ölçümler (hepsi koşulmuş — tahmin yok)

| Kapı | Sonuç |
|---|---|
| Hedefli test `node --test kapsul-tuval.test.mjs` (pano/) | **16/16 × 2 bağımsız koşum** — 318,2 ms + 334,5 ms |
| Test adedi | 8 eski vaka **birebir KORUNUR** (eşik gevşetilmedi) + 8 yeni = 16 |
| Inline script `node --check` | **SCRIPT_SYNTAX_OK** (641 satır script; gecici dosya OS temp'te) |
| Tip kapısı `npm run tip` (core/) | **GECTI** — hata 0 · bilinen borç 0 · yeni 0 · tsc 0 · 27 251 ms |
| İzole smoke (`PANO_PORT=4911`, kendi örneğim) | `/tuval` **200** · `/api/graf` **200** (40 görev · 15 kenar · v14) · server kill edildi (portta yalnız TIME_WAIT kaldı — dinleyen yok) |
| CRLF bütünlüğü | html 1402 CRLF/0 LF-only · test 215/0 · server.js 205/0 (dokunulmadı) |

**LOC (`git diff --numstat`, tahmin değil sayım):**

| Dosya | Durum | Eklendi | Silinen |
|---|---|---|---|
| `pano/kapsul-tuval.html` | düzenlendi | 1 261 | 128 |
| `pano/kapsul-tuval.test.mjs` | düzenlendi | 121 | 4 |
| `raporlar/dalga0-2-arayuz-2026-10-29/YAZAR-RAPORU.md` | YENİ | (bu dosya) | — |

Kod LOC +1 382/−132 — yüz değişimi ölçeği (269 → 1 403 satır; tasarım SSOT mockup 1 245 satırdı).

## 3. Yeni testler (9–16; her iddia kaynak-düzeyi, adıyla kırmızı düşer)

9- drawer kaynak-işaretleri (çekmeceBtn + aria-expanded ilk değer + `drawerDurumYaz`/`setAttribute` senkron + `e.key === "Escape"` + `#perde` + perde click + `#drawerKapa` + min-width:1024px bloğu `body.drawer-kapali #sol{display:none}` + max-width:1023px bloğu `translateX(-103%)`/`transform:none`/`overflow:hidden`) · 10- iki temel (İZLE/DENETLE/YÖNET data-panel + metin + hidden senkron + `#detay` + bagimliChip[data-gec]→sec + orduSeridi G.roller'dan + defterGovde role=log + #komut + rozetler role=status + data-not ≥6 — ölü düğme yok) · 11- ÖRNEK-etiket sistemi (7 kalp kabı data-ornek TAŞIR; 5 graf kabı TASIMAZ; görünür etiketOrnek ≥8; serit «gerçek bağ D-2») · 12- kopyala/EK-2 (panoaYaz + clipboard; REPLAN ONAYLIYORUM YALNIZ statik HTML'de — JS'te yok; JS'te `--confirm` YOK; Enter→panoaYaz(tam)) · 13- dış istek yalnız /api/graf + /api/kart (tüm fetch çağrıları; dış URL yok) · 14- prefers-reduced-motion (animation/transition none !important) · 15- emoji YOK (unicode aralıkları + 🔒 kalktı; system-ui font stack) · 16- viewBox zoom/pan (zoomAt/sigdir/enBoyDuzelt/vbUygula + wheel+preventDefault + pointerdown/move + pinchUzak + setPointerCapture YOK + zIn/zOut/zFit/z100 + tasindi).

## 4. DÜRÜST NOTLAR (yapamadığım / sapan — adıyla)

1. **Kalp-yüzü verileri ÖRNEK kalıyor** (tanım gereği): ordu şeridi canlı durumları, run kartları, onay-bekleyenler kuyruğu, kanıt defteri kayıtları, komut şablonları, denetim tablosu değerleri. Run kartlarındaki 3 run ve defter kayıtları GERÇEK kayıtlardır (DALGA-0/S7 kapanışları) ama CANLI DEĞİL — hepsi ÖRNEK rozetli. Gerçek canlı bağ (notify.jsonl→SSE) **D-2 dalgasında**.
2. **Tek-kolon kırılımı ≤768'e uzadı:** brief <640 istiyordu; 640–768 arası da tek kolon (superset davranış). 769–1023 iki kolon (merkez+detay) + overlay drawer; ≥1024 üç kolon + sabit drawer. Brief'in 640/1024 eşiklerinden bu sapma bilinçli (eski test-2 kalıbının 768px'i korunması zorunluydu).
3. **Eski test-2 kaynak kalıpları korunurken semantiği evrildi:** `#sol{order:1}` bu aralıkta overlay (position:fixed) olduğundan **akis-dışı (inert)**; `#sag{order:4}` display:contents olduğundan kutu üretmez (inert). Gerçek mobil dizilim: sekmeler → kapsül kartı (#detay order:2) → DAG (#tuvalSarma order:3) → run kartları → defter. Regex iddiaları değişmedi; test adı eski dille «sohbet en altta» der — sahte yeşil değil, kaynak iddiası doğru, anlatı raporda.
4. **Nabız/halka keyframe animasyonları ÇIKARILDI:** brief'in «animasyon yalnız transform/opacity ≤600ms» kuralına tam uyum (mockup'ta 2,4 sn/3 sn döngüsel nabız vardı). Aktif gösterge artık statik halka (box-shadow); lejant «halka = aktif» olarak güncellendi. Kalan tüm animasyon/geçişler transform/opacity ve ≤600ms (drawer 280ms, perde 240ms, toast 250ms, suzulme 420ms, kart 200ms).
5. **`sec()`'in tuval kaydırma davranışı değişti:** eski `#tuvalSarma.scrollTo(...)` yerine `tuvaleOrtala(g)` (viewBox'u düğüme ortalar) — zoom/pan deseninin gereği. Ayrıca 30 sn tazelemede seçim korunur (eski sürüm sınıfı kaybediyordu).
6. **`#jsonview` artık `#tuvalSarma` içinde absolute** (eski ayrı bloktaydı): İNSAN/MAKİNE yüzleri aynı canvas alanında dönüşür; id ve hidden senkronu korundu. `modUygula`'nın MAKİNE yüzü yine GRAFİK SSOT'UN TAMAMINI basar; karttaki MAKİNE OKUR yalnız seçili görev dilimini.
7. **Eski kilit karakteri (🔒 emoji) kalktı** — emoji yasağı; yerine metin rozeti «K» (kIsaret) + title'da tam kapı metni (bilgi kaybı yok). DAG düğüm başlıklarında «· K» eki.
8. **`#kartBtn` 5px'lik eski inline değer artık yok:** kart ucu mantığı değişmedi (POST aynı), biçimlendirme CSS'e indi (44px literal).
9. **Worktree'de `npm install` yapıldı (core/):** tip kapısının worktree'de koşabilmesi için (tsc bulunamıyordu). `node_modules/` gitignored — izlenen dosya 0; operatör ana ağaçta kendi kurulumuyla koşar. Bu bir repo değişikliği DEĞİL.
10. **Görsel/tarayıcı kabulü yazarın elinde değil:** DOM render testi yasak (yeni bağımlılık) — iddialar kaynak-düzeyi + izole HTTP smoke. Gerçek görsel kabul (D-1b gibi) operatörün tarayıcısında: `http://127.0.0.1:4377/tuval` (ana 4377 örneğine yazar olarak HİÇ dokunulmadı; server her istekte dosyayı diskten okur — restart gerekmez) veya izole port.
11. **LOC +1 382/−132:** yüz değişimi (mockup 1 245 satırdan ~%12 büyük — drawer + pano'ya özgü kart ucu/kirmiziYuz/test kalıpları eklendi; öğe çıkarılmadan sıkıştırılamadı). Mockup dersiyle aynı sapma sınıfı.
12. **`data-not` bilgilendirme düğmeleri** pasiftir (DURDUR/RESUME/run kartları/K-0044): EK-2 uyarınca GUI onay/kill komutu ÇALIŞTIRMAZ; gerçek kill-switch KULLANICI terminalinde (roller SSOT'u).

## 5. Operatöre bırakılanlar

- **Merge:** `worktree-agent-ae07618a00dec95de` → main (`--no-ff`; K-0053 §25.5 — merge anında tam kanal + tip kapısı; kırmızıysa `git reset --keep ORIG_HEAD`).
- **CODEMAP:** bu fişte YOK (yazar worktree'si açıkken regen haritayı şişirir — ders); merge sonrası operatör.
- **Push:** tek elden operatörde (yazar hiç push yapmadı — bu commit YEREL).
- **Kapanış TASLAK'ı + STATE_BOARD damgası + K-0017 işlenme kayıtları** — operatör dalganın kapanışında.
- **Görsel kabul (D-1b sınıfı):** drawer (dar/geniş), ÖRNEK şerit/rozetler, bağımlılık çipi gezinmesi, viewBox zoom/pan/pinch, komut kutusu odak ışıması.
