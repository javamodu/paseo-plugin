// DALGA-0-2 R2 TASARIM REVİZYONU — pano/kapsul-tuval.html kaynak-düzeyi iddiaları (node --test).
// R3 KURUMSAL CİLA (2026-10-30, kullanıcı emri «tasarımı modern gelecek uyumlu yap, AI çöpü
// gözükmesin, kurumsal»): süs katmanı söküldü (ışık lekeleri · grid dokusu · köşe kancaları ·
// gradient · hover lift), tek aksan petrol mavisi (#0f4c81), radius 3 token (8/6/4px), pil
// rozetleri köşeli, .modBtn kuralı EKLENDİ. R2 vaka seti AYNEN KORUNUR (manifesto ölçütleri
// değişmedi); YENİ vaka 36 R3 kurumsal sözleşmeyi doğrular.
// Miras: R1'in 26 vakasından 1, 3-9, 11-17, 19, 20, 23-25 AYNEN korunur (eşik gevşetilmedi).
// R2 tasarım emriyle EVRİLENLER: 2 (dar ekran: 1023 kırılımı + tek kolon + sağ alta — tek-viewport
// yalnız geniş ekran), 10 (R1'in «tablist=0» yorumu KALKTI — ORTA görev sekmeleri tablist/role=tab
// TAŞIR; İZLE/DENETLE/YÖNET ÜST mod-sekmeleri + drawer nav YİNE YOK), 18 (katlanır-DAG → SABİT
// SEKME modeli: haritaKatla/haritaGovde YOK; rect=0 ölçüm-düzeltmesi sekmeAktiflestir'de),
// 21 (katlaBtn → akordiyonBas + ikonBtn + sekmeKapat), 22 (sınıf listesi R2 sınıflarına),
// 26 (chat drawer'dan SAĞ BÜYÜK panele taşındı — VARSAYILAN). YENİ: 27 üç-sütun tek-viewport +
// panel-içi kaydırma, 28 sol akordiyon aria, 29 orta sekme mekaniği (kirmiziYuz temizler),
// 30 sağ ikon menü + varsayılan chat + dinamik değişim (hash/route YOK), 31 light-tema tokenları,
// 32 büyük yazılar, 33 K8 ADIM-B: PROJE + API yüzleri (GERÇEK 4930 uçları + fail-closed).
// K8 ADIM-B (2026-10-29 «UYGULA») EVRİMİ: ÖZET + KOMUT yüzleri söküldü (kullanıcı emri) —
// vaka 10/11/12/19/21/22/23/30/32/33 güncel sözleşmeye evrildi (sökülen bileşenlerin YOKLUĞU
// artık iddia); vaka 6/13 deney köprüsünü (DENEY_KOK 4930) beyaz listeye aldı. ÜST bar
// rozetleri (62951af) + ordu şeridi (40fa22b) sökümlerinin test borcu bu dalgada kapatıldı.
// K8 DALGA 2a (2026-11-01; omurga emri 2026-10-31 15:14 + kontrol ilkesi 17:21 + denetim merkezi
// emri 2026-11-01 + denetçi bulguları GD-009/010): DÜRÜST PİN GÜNCELLEMELERİ — vaka 10 (role=tab
// eşiği 4→5) · vaka 18 (sabit sekme listesine sek-projeler eklendi) · vaka 29 (statik sabit sekme
// 3→4: PROJELER). YENİ vaka 39-47: G10a proje seçici · G10b görev tablosu · O1 görev detay kartı ·
// O2 performans yüzü (puanı ajan YAZAMAZ) · O3 ajan kartı · G11 kapsam rozeti/filtre · R3+çevre ·
// D denetim merkezi (kayıtlı — canlı değil) · GD-009 JSON-imza dirty-check + GD-010 tek delege.
// DOM render testi YOK;
// yeni bağımlılık YOK (yalnız node:test + node:fs + node:assert). Her vaka ADIYLA kırmızıya
// düşer (fail-closed).
import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

let SRC = "";
try {
  SRC = readFileSync(new URL("./kapsul-tuval.html", import.meta.url), "utf8");
} catch {
  SRC = ""; // kaynak okunamazsa tüm vakalar kendi adlarıyla kırmızıya düşer
}
const ok = (msg, cond, detay) => assert.ok(cond, "KAYNAKTA YOK — " + msg + (detay ? " (" + detay + ")" : ""));
const htmlKisimOf = () => { const a = SRC.indexOf("<script>"); return a > 0 ? SRC.slice(0, a) : ""; };
const jsKisimOf = () => { const a = SRC.indexOf("<script>"); return a > 0 ? SRC.slice(a) : SRC; };

// "@media ... kosul ..." sorgusunun gövdesini süslü-parantez eşleşmesiyle çeker (iç içe bloklar dahil).
function mediaBlok(kosul) {
  let idx = 0;
  for (;;) {
    const m = SRC.indexOf("@media", idx);
    if (m < 0) return null;
    const acilan = SRC.indexOf("{", m);
    if (acilan < 0) return null;
    if (SRC.slice(m, acilan).includes(kosul)) {
      let derinlik = 1, j = acilan + 1;
      while (j < SRC.length && derinlik > 0) {
        if (SRC[j] === "{") derinlik++;
        else if (SRC[j] === "}") derinlik--;
        j++;
      }
      return derinlik === 0 ? SRC.slice(acilan + 1, j - 1) : null;
    }
    idx = m + 6;
  }
}

// id'li elemanın AÇILIŞ etiketini döndürür (tek satırlık etiket; kapanış hariç).
function tagOf(id) {
  const m = SRC.match(new RegExp('<[^<>]*id="' + id + '"[^<>]*>'));
  return m ? m[0] : null;
}

test("1- viewport meta mevcut (mobil genişlik sabiti)", () => {
  ok('<meta name="viewport" etiketi', SRC.includes('<meta name="viewport"'));
  ok('viewport content="width=device-width', /<meta\s+name="viewport"\s+content="width=device-width/.test(SRC));
});

test("2- dar ekran (max-width:1023px) tek kolon: R2 — sol overlay + orta tam genişlik + sağ ALTA; body scroll geri gelir", () => {
  const b = mediaBlok("max-width:1023px");
  ok("@media (max-width:1023px) bloğu (drawer overlay + tek kolon)", !!b);
  ok("main flex-direction:column (orta tam genişlik, sağ alta katlanır)", b.includes("flex-direction:column"));
  ok("body akışa döner: height:auto (tek-viewport yalnız geniş ekran — R2 sözleşmesi)", /body\s*\{[^}]*height:\s*auto/.test(b));
  ok("body akışa döner: overflow:auto (dar ekranda sayfa kayar)", /body\s*\{[^}]*overflow:\s*auto/.test(b));
  ok("main height:auto + overflow:visible", /main\s*\{[^}]*height:\s*auto/.test(b) && /main\s*\{[^}]*overflow:\s*visible/.test(b));
  ok("#sag alta katlanır (width:100%)", /#sag\s*\{[^}]*width:\s*100%/.test(b));
  ok("#sol overlay'e çekilir (position:fixed)", /#sol\s*\{[^}]*position:\s*fixed/.test(b));
  ok("drawer kapatma düğmesi görünür olur (display:inline-flex)", /\.drawerKapa\s*\{[^}]*display:\s*inline-flex/.test(b));
  ok("#tuvalSarma yüksekliği korunur (48vh)", b.includes("height:48vh"));
});

test("3- dokunma hedefleri >= 44x44px (min-height/min-width CSS kuralı)", () => {
  ok(".satir (görev satırı) min-height:44px", /\.satir\s*\{[^}]*min-height:\s*44px/.test(SRC));
  ok(".modlar button + #yenile min-height:44px", /\.modlar button[^{]*\{[^}]*min-height:\s*44px/.test(SRC));
  ok(".modlar button + #yenile min-width:44px", /\.modlar button[^{]*\{[^}]*min-width:\s*44px/.test(SRC));
  ok("#kartBtn min-height:44px (CSS'ten; kart ucu markup'ına dokunulmadan)", /#kartBtn\s*\{[^}]*min-height:\s*44px/.test(SRC));
  ok(".satir tam genişlik (width:100%)", /\.satir\s*\{[^}]*width:\s*100%/.test(SRC));
});

test("4- faz-gruplu sol ağaç: g.faz okunur + (faz yok) dalı; durum rengi satırda kaldı", () => {
  ok('kaynak görev-bası "faz" alanını okur (g.faz)', SRC.includes("g.faz"));
  ok('"(faz yok)" sabit dizgisi (fazsız görev grubu) var', SRC.includes('"(faz yok)"'));
  ok("eski durum-sıra dizisi kaldırıldı (gruplama artık faz üzerinden)", !SRC.includes("const sira = ["));
  ok("durum rengi satırlarda kaldı (DURUMRENK[d] kullanımı)", SRC.includes("DURUMRENK[d]"));
  ok("uydurma faz YOK: sabit faz listesi tanımlanmamış", !/const FAZLAR|FAZ_SIRA/.test(SRC));
});

test("5- korunan çekirdek etiketleri: kirmiziYuz + iki yüz + sec + kartBtn", () => {
  ok("kirmiziYuz (fail-closed yüz) fonksiyonu", SRC.includes("function kirmiziYuz("));
  ok("İNSAN OKUR düğme etiketi", SRC.includes("İNSAN OKUR"));
  ok("MAKİNE OKUR düğme etiketi", SRC.includes("MAKİNE OKUR"));
  ok("modUygula (iki yüz aynı fetch'ten)", SRC.includes("function modUygula("));
  ok("sec (detay tablosu) fonksiyonu", SRC.includes("function sec("));
  ok("kartBtn (kart içerik düğmesi id)", SRC.includes("kartBtn"));
  ok("KAPSÜL KARTI OLUŞTUR düğme etiketi", SRC.includes("KAPSÜL KARTI OLUŞTUR"));
});

test("6- sözleşme: /api/graf fetch'i + POST /api/kart + 30 sn tazelik + döngüde-çizilmez", () => {
  ok('fetch("/api/graf") değişmedi', SRC.includes('fetch("/api/graf")'));
  ok('POST /api/kart ucu (fetch("/api/kart") değişmedi)', SRC.includes('fetch("/api/kart"'));
  ok("30 sn auto-refresh (graf + deney köprüsü birlikte — K8 ADIM-B)", SRC.includes("setInterval(() => { yukle(); deneyYukle(); }, 30_000)"));
  ok("yerleşim döngü kuralı (islenen !== G.gorevler.length)", SRC.includes("islenen !== G.gorevler.length"));
});

test("7- click temelli etkileşim: hover'a bağlı eylem YOK", () => {
  const tik = (SRC.match(/addEventListener\("click"/g) || []).length;
  ok("en az 5 click dinleyicisi (satir/dugum/modlar/yenile/kart)", tik >= 5, "bulunan click sayısı: " + tik);
  ok("mouseover dinleyicisi yok", !SRC.includes('addEventListener("mouseover"'));
  ok("mouseenter dinleyicisi yok", !SRC.includes('addEventListener("mouseenter"'));
  ok("touchstart dinleyicisi yok (tıklama zaten click temelli)", !SRC.includes('addEventListener("touchstart"'));
});

test("8- DOM iskelet id'leri korunur (sol/orta/tuval/detay/sag/modlar/token)", () => {
  for (const id of ["sol", "orta", "tuvalSarma", "tuval", "jsonview", "detay", "sag", "mInsan", "mMakine", "yenile", "token", "hata"]) {
    ok('id="' + id + '" mevcut', SRC.includes('id="' + id + '"'));
  }
});

test("9- drawer kaynak-işaretleri: hamburger + aria-expanded senkronu + Esc + perde + 1023/1024 kırılımı", () => {
  ok('hamburger/çekmece düğmesi (id="cekmeceBtn")', SRC.includes('id="cekmeceBtn"'));
  ok('çekmece aria-expanded ilk değer ("false")', /id="cekmeceBtn"[^>]*aria-expanded="false"/.test(SRC));
  ok("aria-expanded senkron fonksiyonu (drawerDurumYaz)", SRC.includes("function drawerDurumYaz("));
  ok('aria-expanded runtime güncellemesi (setAttribute("aria-expanded"))', SRC.includes('setAttribute("aria-expanded"'));
  ok('Escape kapatma dinleyicisi (e.key === "Escape")', SRC.includes('e.key === "Escape"'));
  ok('overlay perde elemanı (id="perde")', SRC.includes('id="perde"'));
  ok('perde tıkla-kapat dinleyicisi (JS kaynağında)', SRC.includes('$("perde").addEventListener("click"'));
  ok('drawer kapatma düğmesi (id="drawerKapa")', SRC.includes('id="drawerKapa"'));
  const genis = mediaBlok("min-width:1024px");
  ok("@media (min-width:1024px) bloğu (drawer sabit sütun)", !!genis);
  ok("geniş ekranda kapanış (body.drawer-kapali #sol + #splitSol display:none — ADIM-C: splitter da gizlenir)", /body\.drawer-kapali\s+#sol,\s*body\.drawer-kapali\s+#splitSol\s*\{[^}]*display:\s*none/.test(genis || ""));
  const dar = mediaBlok("max-width:1023px");
  ok("@media (max-width:1023px) bloğu (drawer overlay)", !!dar);
  ok("overlay kaydırma (transform:translateX(-103%))", (dar || "").includes("translateX(-103%)"));
  ok("body.drawer-acik ile açılış (transform:none)", /body\.drawer-acik\s+#sol\s*\{[^}]*transform:\s*none/.test(dar || ""));
  ok("body scroll kilidi (body.drawer-acik overflow:hidden)", /body\.drawer-acik\s*\{[^}]*overflow:\s*hidden/.test(dar || ""));
});

test("10- R2 SEKME ÖZGÜRLÜĞÜ: ORTA görev sekmeleri tablist/role=tab TAŞIR; İZLE/DENETLE/YÖNET üst sekmeleri + drawer nav YOK", () => {
  // R2 kullanıcı düzeltmesi: «sekmeli yapı yasak değil» — R1'in tablist=0 yorumu kalktı.
  ok('üst mod-sekmeleri YOK (İZLE/DENETLE/YÖNET düğme metni)', !/<button[^>]*>(İZLE|DENETLE|YÖNET)/.test(SRC));
  ok("drawer'da nav YOK (<nav öğesi yok)", !SRC.includes("<nav"));
  ok("eski sekme() fonksiyonu YOK (R0 kalıntısı)", !SRC.includes("function sekme("));
  ok("edimTab sınıfı YOK", !SRC.includes("edimTab"));
  ok('data-panel bağlantısı YOK', !SRC.includes("data-panel"));
  ok("panel-izle / panel-denetle / panel-yonet YOK", !SRC.includes("panel-izle") && !SRC.includes("panel-denetle") && !SRC.includes("panel-yonet"));
  ok("edimPanel sınıfı YOK", !SRC.includes("edimPanel"));
  // ORTA sekmeler (R2 emriyle): tablist + role=tab + runtime aria-selected
  ok('sekme şeridi (id="sekmeSerit" + role="tablist")', SRC.includes('id="sekmeSerit"') && SRC.includes('role="tablist"'));
  const tabSay = (SRC.match(/role="tab"/g) || []).length;
  ok("role=tab >= 5 (4 sabit sekme + JS görev-sekmesi şablonu — K8-2a PROJELER)", tabSay >= 5, "bulunan: " + tabSay);
  ok('aria-selected runtime güncellemesi (setAttribute("aria-selected"))', SRC.includes('setAttribute("aria-selected"'));
  // R1 tek-akış bileşenleri (varlık kontrolleri evrildi — eşik düşürülmedi)
  ok('detay kartı kabuğu (id="detay")', SRC.includes('id="detay"'));
  ok("bağımlılık çipleri (bagimliChip + data-gec)", SRC.includes("bagimliChip") && SRC.includes("data-gec"));
  ok('çipe dokunma zincirde gezinir: sec(dep) işleyicisi', SRC.includes('closest(".bagimliChip[data-gec]")'));
  ok('kanıt defteri gövdesi (id="defterGovde" + role="log")', SRC.includes('id="defterGovde"') && SRC.includes('role="log"'));
  // R1 bileşenlerinden KULLANICI EMRİYLE SÖKÜLENLER (K2 turu 62951af + 40fa22b; K8 ADIM-B komut kutusu):
  // ordu şeridi, GENEL STATE rozetleri, komut kutusu — yoklukları ARTIK sözleşme.
  ok('ordu şeridi SÖKÜLDÜ (id="orduSeridi" YOK — kullanıcı emri 40fa22b)', !SRC.includes('id="orduSeridi"'));
  ok("ordu şeridi rolleri JS'i de söküldü (G.roller sayımı YOK)", !SRC.includes("Object.keys(G.roller)"));
  ok('komut kutusu SÖKÜLDÜ (id="komut" YOK — K8 ADIM-B)', !SRC.includes('id="komut"'));
  ok('GENEL STATE rozetleri SÖKÜLDÜ (id="rozetler" YOK — kullanıcı emri 62951af)', !SRC.includes('id="rozetler"'));
  ok('onay bölümü (id="onayBolum")', SRC.includes('id="onayBolum"'));
  ok('run kartları bölümü (id="runBolum")', SRC.includes('id="runBolum"'));
  ok('kanıt defteri bölümü (id="defterBolum")', SRC.includes('id="defterBolum"'));
  const olum = (SRC.match(/data-not="/g) || []).length;
  ok("ölü düğme YOK: pasif düğmeler data-not ile bilgilendirir (>= 5 — ordu çipleri sökülünce eşik dürüst düştü)", olum >= 5, "bulunan: " + olum);
});

test("11- ÖRNEK-etiket sistemi: kalp-yüzü etiketli (chat dahil), graf-yüzü etiketsiz", () => {
  ok('tepe dürüstlük şeridi SÖKÜLDÜ (kullanıcı emri — class="serit" YOK; ÖRNEK etiketleri bileşenlerde kalır)', !SRC.includes('class="serit"'));
  const ornekli = ["kartlar", "onayBolum", "defterPanel", "denetimGecmis"];
  for (const id of ornekli) {
    const t = tagOf(id);
    ok(id + " açılış etiketi bulundu", !!t);
    ok(id + " data-ornek taşır (kalp-yüzü)", !!t && t.includes("data-ornek"));
  }
  // K8 B1-B3: chat müdahale/manager kaydı da 4930'a bağlandı — GERÇEK yüz (data-ornek TAŞIMAZ)
  const gercekli = ["agac", "detay", "tuval", "sol", "sagProje", "sagApi", "ajanListe", "saglayiciAlani", "chatBolum"];
  for (const id of gercekli) {
    const t = tagOf(id);
    ok(id + " açılış etiketi bulundu", !!t);
    ok(id + " data-ornek TAŞIMAZ (graf-yüzü)", !!t && !t.includes("data-ornek"));
  }
  const etiket = (SRC.match(/class="etiketOrnek"/g) || []).length;
  ok("görünür ÖRNEK rozeti >= 8 adet", etiket >= 8, "bulunan: " + etiket);
});

test("12- kopyala + EK-2: onay cümlesi STATİK HTML'de — GUI'de üretilmez/çalıştırılmaz", () => {
  const ayir = SRC.indexOf("<script>");
  const htmlKisim = ayir > 0 ? SRC.slice(0, ayir) : "";
  const jsKisim = ayir > 0 ? SRC.slice(ayir) : SRC;
  ok("panoya kopyala fonksiyonu (panoaYaz + navigator.clipboard)", SRC.includes("function panoyaYaz(") && SRC.includes("navigator.clipboard"));
  const kopya = (SRC.match(/data-kopyala="/g) || []).length;
  ok("data-kopyala düğmeleri (>= 2 — onay kartları; KOMUT şablonları söküldü)", kopya >= 2, "bulunan: " + kopya);
  ok("onay cümlesi STATİK HTML parçası (REPLAN ONAYLIYORUM)", htmlKisim.includes("REPLAN ONAYLIYORUM"));
  ok("onay cümlesi JS'te ÜRETİLMEZ (kopyalanabilir sabit dışı yok)", !jsKisim.includes("REPLAN ONAYLIYORUM"));
  ok("JS'te --confirm dizgisi YOK (onay komutu kurgulanmaz)", !jsKisim.includes("--confirm"));
  ok('komut kutusu Enter davranışı KALKTI (KOMUT yüzü söküldü — K8 ADIM-B)', !SRC.includes('olay.key !== "Enter"') && !jsKisim.includes('$("komut")'));
});

test("13- dış istem: /api/graf + /api/kart (4377) + DENEY_KOK 4930 uçları — chat gerçek müdahale ucunu kullanır", () => {
  const ayir = SRC.indexOf("<script>");
  const jsKisim = ayir > 0 ? SRC.slice(ayir) : SRC;
  ok('deney köprüsü sabiti (DENEY_KOK = "http://127.0.0.1:4930" — ADIM-A CORS)', jsKisim.includes('const DENEY_KOK = "http://127.0.0.1:4930"'));
  const cagrilar = jsKisim.match(/fetch\(([^)]{0,60})\)/g) || [];
  ok("en az 3 fetch çağrısı (graf + kart + deney durum)", cagrilar.length >= 3, "bulunan: " + cagrilar.length);
  for (const c of cagrilar) {
    ok("fetch yalnız izinli uç (pano veya izole deney): " + c.slice(0, 50), c.includes("/api/graf") || c.includes("/api/kart") || c.includes("/api/atama") || c.includes("DENEY_KOK"));
  }
  ok("deney uçları DENEY_KOK'tan kurulur (yol değişkeni — sabit URL dizilimi yok)", jsKisim.includes('DENEY_KOK + "/api/deney/durum"') && jsKisim.includes("DENEY_KOK + uc"));
  ok('chat GERÇEK müdahale ucu (deneyPost "/api/deney/mudahale")', jsKisim.includes('deneyPost("/api/deney/mudahale"'));
  ok('chat gövdesi metin alanı taşır (govde = { metin: deger, rol ... })', jsKisim.includes('govde = { metin: deger, rol'));
  const dis = SRC.replace(/<link\s+rel="icon"[^>]+>/g, "").replace(/http:\/\/127\.0\.0\.1/g, "");
  ok("CDN/webfont/dış URL YOK (yalnız 127.0.0.1 istisnası)", !/https?:\/\//.test(dis));
});

test("14- prefers-reduced-motion: animasyon/akış kapanır", () => {
  const b = mediaBlok("prefers-reduced-motion: reduce");
  ok("@media (prefers-reduced-motion: reduce) bloğu", !!b);
  ok("animation: none !important", (b || "").includes("animation: none !important"));
  ok("transition: none !important", (b || "").includes("transition: none !important"));
});

test("15- emoji YOK (inline SVG ikon + sistem font stack; eski kilit karakteri kalktı)", () => {
  const emoji = SRC.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu) || [];
  ok("kaynakta emoji karakteri yok", emoji.length === 0, "bulunan: " + emoji.length);
  ok("webfont/CDN YOK (system-ui font stack)", SRC.includes("system-ui"));
  ok("eski kilit karakteri kaldırıldı (K rozeti kaldı)", !SRC.includes("🔒"));
});

test("16- DAG: viewBox zoom/pan (tekerlek + sürükle + pinch) — döngüde-çizilmez korunur", () => {
  ok("zoomAt (viewBox odaklı zoom)", SRC.includes("function zoomAt("));
  ok("sigdir (tüm grafiği sığdır)", SRC.includes("function sigdir("));
  ok("enBoyDuzelt (rect=0 tuzağına karşı koruma)", SRC.includes("function enBoyDuzelt("));
  ok("vbUygula (viewBox uygular)", SRC.includes("function vbUygula("));
  ok("tekerlek zoom dinleyicisi (passive:false + preventDefault)", /addEventListener\("wheel"[^]{0,160}preventDefault/.test(SRC));
  ok('sürükleme pan (pointerdown + pointermove)', SRC.includes('addEventListener("pointerdown"') && SRC.includes('addEventListener("pointermove"'));
  ok("pinch zoom (2 işaretçi mesafesi — pinchUzak)", SRC.includes("pinchUzak"));
  ok("pointer-capture yalnız splitter'da (DAG pan'ında KULLANILMAZ — click ölümü tuzağı)", (() => {
    const yerler = SRC.split("setPointerCapture").length - 1;
    return yerler === 1 && SRC.includes("kolon.setPointerCapture"); // ADIM-C splitter sürüklemesi meşru; DAG pan'ı dokunulmaz
  })());
  ok("zoom düğmeleri (zIn/zOut/zFit/z100)", ["zIn", "zOut", "zFit", "z100"].every((i) => SRC.includes('id="' + i + '"')));
  ok("drag sonrası tıklama yutulmaz (tasindi bayrağı ile tıklama korunur)", SRC.includes("tasindi"));
});

test("17- R1/K2: denetim kanıtı KAPSÜL KARTINDA inline (kanal x=0 + ölçüm çifti + tip)", () => {
  const ayir = SRC.indexOf("<script>");
  const jsKisim = ayir > 0 ? SRC.slice(ayir) : SRC;
  ok("kartBolumBas CSS kuralı (kart içi blok başlığı)", /\.kartBolumBas\s*\{/.test(SRC));
  ok('JS kart şablonunda DENETİM KANIYI başlığı', jsKisim.includes('kartBolumBas">DENETİM KANIYI'));
  ok('denetim kanıtı data-ornek sarmalayıcısı (kayıtlı — canlı değil)', jsKisim.includes('data-ornek="denetim kanıtı'));
  ok('tam kanal satırı: kSatir("tam kanal") + 467/467 + x=0 + sureSn=206', jsKisim.includes('kSatir("tam kanal"') && jsKisim.includes("467/467") && jsKisim.includes("x=0</b>") && jsKisim.includes("sureSn=206"));
  ok('ölçüm çifti satırı: taban 166 → 206 + «tek örnek; hız iddiası YOK» dürüst notu', jsKisim.includes('kSatir("ölçüm çifti"') && jsKisim.includes("166") && jsKisim.includes("tek örnek; hız iddiası YOK"));
  ok('tip · duvar satırı: GECTI + duvar 1297 < emsal 1473', jsKisim.includes('kSatir("tip · duvar"') && jsKisim.includes("GECTI") && jsKisim.includes("1297") && jsKisim.includes("1473"));
  ok("kayıtlı etiket sayısı >= 4 (her satır kayıtlı damgalı)", (jsKisim.match(/etiketOrnek">kayıtlı/g) || []).length >= 4);
  ok("eski DENETLE paneli YOK (panel-denetle kaldırıldı)", !SRC.includes("panel-denetle"));
  ok("makine-okur diliminde denetim alanı (n.denetim)", jsKisim.includes("n.denetim = {"));
  ok('kanal geçmişi defter sekmesinde (id="denetimGecmis" + kanal·a3/a02/a03 satırları)', SRC.includes('id="denetimGecmis"') && SRC.includes("kanal·a3") && SRC.includes("kanal·a02") && SRC.includes("kanal·a03"));
});

test("18- R2: «Görev haritası» SABİT SEKME (VS Code tarzı) — aktivasyonda rect=0 ölçüm-düzeltmesi", () => {
  const jsKisim = jsKisimOf();
  ok('haritaBolum sekme paneli (id="haritaBolum" + role="tabpanel")', SRC.includes('id="haritaBolum"') && /id="haritaBolum"[^>]*role="tabpanel"/.test(SRC));
  ok("R1 katlama kaldırıldı (haritaKatla/haritaGovde YOK — sekme modeli geldi)", !SRC.includes("haritaKatla") && !SRC.includes("haritaGovde"));
  ok('sabit sekme id\'leri (sek-harita/sek-defter/sek-run/sek-projeler — K8-2a)', ["sek-harita", "sek-defter", "sek-run", "sek-projeler"].every((i) => SRC.includes('id="' + i + '"')));
  const t = tagOf("sek-harita");
  ok("sek-harita role=tab + aria-controls=haritaBolum", !!t && t.includes('role="tab"') && t.includes('aria-controls="haritaBolum"'));
  ok('sek-harita data-sekme="harita" (aktivasyon kancası)', !!t && t.includes('data-sekme="harita"'));
  ok("sekme aktivasyonunda ölçüm-düzeltme: sekmeAktiflestir içinde enBoyDuzelt()+vbUygula()", /function sekmeAktiflestir\([^)]*\)[^]{0,500}enBoyDuzelt\(\);\s*vbUygula\(\)/.test(jsKisim));
  ok('drawer «görev haritası» bağlantısı (data-sekme="harita" — ziplink)', SRC.includes('data-sekme="harita"'));
  ok('haritaSayi sayacı SÖKÜLDÜ (ADIM-D state yazısı — id="haritaSayi" YOK)', !SRC.includes('id="haritaSayi"'));
});

test("19- üst bar GENEL STATE + ordu şeridi KULLANICI EMRİYLE SÖKÜLDÜ (K2 turu; 62951af + 40fa22b)", () => {
  const mainIdx = SRC.indexOf("<main>");
  ok("<main> bulundu", mainIdx > 0);
  ok('rozetler kabı YOK (GENEL STATE üst bardan söküldü — 62951af)', !SRC.includes('id="rozetler"'));
  ok("orduSeridi bölümü YOK (kaydırma çubuğuyla birlikte — 40fa22b)", !SRC.includes("orduSeridi"));
  ok("orduChip sınıfı YOK", !SRC.includes("orduChip"));
  ok("orduYaz JS YOK", !SRC.includes("function orduYaz("));
  ok("üst bar main'den önce (marka + token kalır)", SRC.indexOf('<header class="ustbar">') > 0 && SRC.indexOf('<header class="ustbar">') < mainIdx);
  ok("marka metni kalır (ORDU KUMANDA · TUVAL)", SRC.includes("ORDU KUMANDA · TUVAL"));
  ok("token alanı kalır (PANO_TOKEN kapısı — değer ekrana yazılmaz)", SRC.includes('id="token"'));
});

test("20- E7 ölü-buton YOK: statik her düğme kablolı (kanca veya JS referansı)", () => {
  const ayir = SRC.indexOf("<script>");
  const htmlKisim = ayir > 0 ? SRC.slice(0, ayir) : "";
  const jsKisim = ayir > 0 ? SRC.slice(ayir) : SRC;
  const dugmeler = htmlKisim.match(/<button[^>]*>/g) || [];
  ok("statik düğme sayısı >= 12", dugmeler.length >= 12, "bulunan: " + dugmeler.length);
  for (const d of dugmeler) {
    const idM = d.match(/id="([^"]+)"/);
    const kanca = /data-(not|kopyala|zipla|sec|mod|gec|id|chat-komut|sekme|kapat|gorev)="/.test(d);
    const ref = idM && jsKisim.includes('$("' + idM[1] + '")');
    const formKablolu = d.includes('type="submit"') && jsKisim.includes('$("chatForm").addEventListener("submit"');
    ok("düğme kablolı: " + d.slice(0, 70), kanca || !!ref || !!formKablolu);
  }
  // JS-doğumlu düğmeler de kablolı (delege + doğrudan dinleyici)
  ok('delege: görev fişi (closest(".fisKopyala"))', jsKisim.includes('closest(".fisKopyala")'));
  ok('delege: dispatch şablonu (closest(".dispatchKopyala"))', jsKisim.includes('closest(".dispatchKopyala")'));
  ok('delege: tuvalde bul (closest(".tuvaldeBul"))', jsKisim.includes('closest(".tuvaldeBul")'));
  ok('delege: sekme kapat (closest(".sekmeKapat")) — R2', jsKisim.includes('closest(".sekmeKapat")'));
  ok('delege: görev sekmesi (closest(".gorevSekme")) — R2', jsKisim.includes('closest(".gorevSekme")'));
  ok('delege: sabit sekme (closest("[data-sekme]")) — R2', jsKisim.includes('closest("[data-sekme]")'));
  ok('delege: akordiyon katlama (closest(".akordiyonBas")) — R2', jsKisim.includes('closest(".akordiyonBas")'));
  ok('kart düğmesi doğrudan dinleyicili ($("kartBtn").addEventListener)', jsKisim.includes('$("kartBtn").addEventListener'));
  ok('chat şablon-kopyala düğmeleri doğrudan dinleyicili (querySelectorAll(".chatKopyala"))', jsKisim.includes('querySelectorAll(".chatKopyala, .chatPlanKopyala")'));
  ok('ikon menü düğmeleri doğrudan dinleyicili ($("ik-chat").addEventListener) — R2', jsKisim.includes('$("ik-chat").addEventListener'));
  ok('K8 ADIM-B: yeni yüzler kablolı (ik-proje + ik-api dinleyicileri)', jsKisim.includes('$("ik-proje").addEventListener') && jsKisim.includes('$("ik-api").addEventListener'));
  ok('K8 ADIM-B: KADROYA EKLE kablolı ($("atGonder").addEventListener("click", ajanAta))', jsKisim.includes('$("atGonder").addEventListener("click", ajanAta)'));
  ok('K8 ADIM-B: API yüzü delege kablolı ($("saglayiciAlani").addEventListener("click"))', jsKisim.includes('$("saglayiciAlani").addEventListener("click"'));
  ok('K8 ADIM-B: model satırı klavyeden de seçilir (keydown role=button)', jsKisim.includes('$("saglayiciAlani").addEventListener("keydown"'));
});

test("21- E8 44px tutarlılığı: çipler + chat + akordiyon + ikon menü + sekme kapat (global button kuralı)", () => {
  ok("global button kuralı: min-height:var(--min-dokunma)", /(^|\s)button\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("bagimliChip <button doğar (global 44px kuralından yararlanır)", SRC.includes('<button class="bagimliChip"'));
  ok("K8 ADIM-B: orduChip YOK (ordu şeridi söküldü)", !SRC.includes("orduChip"));
  ok("akordiyonBas 44px (R2 — katlaBtn'nin yerini akordiyon başlığı aldı)", /\.akordiyonBas\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("ikonBtn 44px (R2 — sağ panel ikon menü)", /\.ikonBtn\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("sekmeKapat 44px (R2 — × kapatma düğmesi)", /\.sekmeKapat\s*\{[^}]*min-width:\s*44px/.test(SRC));
  ok("drawerKapa 44px (36px→44px düzeltmesi)", /\.drawerKapa\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("ziplink 44px", /\.ziplink\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("chatGiris (input) 44px", /\.chatGiris\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("chatGonder 44px", /\.chatGonder\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("K8 ADIM-B: dkSecici/dkGiris 44px (PROJE form girdileri — birleşik kural)", /\.dkSecici, \.dkGiris\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("K8 ADIM-B: dkGonder 44px (KADROYA EKLE)", /\.dkGonder\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("K8 ADIM-B: dkKartBas 44px (sağlayıcı akordiyon başlığı)", /\.dkKartBas\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
});

test("22- E9 id/class birebir: JS'in beklediği her id CSS+HTML'de var; R2 sınıflarının CSS kuralı var", () => {
  const ayir = SRC.indexOf("<script>");
  const htmlKisim = ayir > 0 ? SRC.slice(0, ayir) : "";
  const jsKisim = ayir > 0 ? SRC.slice(ayir) : SRC;
  const idler = [...new Set((jsKisim.match(/\$\("([^"]+)"\)/g) || []).map((s) => s.slice(3, -2)))];
  ok("JS en az 20 farklı id referans eder", idler.length >= 20, "bulunan: " + idler.length);
  for (const id of idler) {
    const statik = htmlKisim.includes('id="' + id + '"');
    const dinamik = jsKisim.includes('id="' + id + '"'); // JS şablonlarında doğan (kartBtn, meta, canliMetin…)
    ok('id="' + id + '" kaynakta birebir var', statik || dinamik);
  }
  const siniflar = ["kartBolumBas", "chatBolum", "chatListe", "chatForm", "chatGiris", "chatGonder", "chatMesaj", "chatKomutSatir", "chatPlan", "chatSabit", "defterBolum", "onayBolum", "sagPanel", "sekmePanel", "akordiyonBas", "akordiyonGovde", "ikonBtn", "sekmeKapat", "dkKart", "dkKartBas", "dkModelSatir", "dkModelEtiket", "dkTest", "dkAjanSatir", "dkGonder", "dkKirmizi", "dkEtiket", "dkBolumBas", "dkListe", "dkNot", "dkRozet"];
  for (const s of siniflar) {
    ok("." + s + " CSS kuralı var", new RegExp("\\." + s + "\\s*\\{").test(SRC));
    ok("." + s + " kullanımda (HTML veya JS şablonu)", SRC.includes('class="' + s) || SRC.includes('"chatMesaj chat-'));
  }
  ok("#denetimGecmis CSS kuralı var (id-selector)", /#denetimGecmis\s*\{/.test(SRC));
});

test("23- E10 SSOT sayı disiplini (ADIM-D: ekran sayaçları SÖKÜLDÜ — statik sayı YOK, kalan her sayı kaynağından)", () => {
  const ayir = SRC.indexOf("<script>");
  const htmlKisim = ayir > 0 ? SRC.slice(0, ayir) : "";
  const jsKisim = ayir > 0 ? SRC.slice(ayir) : SRC;
  ok("agacSayi SÖKÜLDÜ (ADIM-D — id + besleme YOK)", !jsKisim.includes('id="agacSayi"') && !jsKisim.includes('$("agacSayi")'));
  ok("durum kök sayımı KALKTI (ADIM-D — kok[k] sayaç beslemesi öksüzleşti)", !jsKisim.includes("kok[k] = (kok[k] || 0) + 1"));
  ok("İNSAN-kapılı/AKTİF sayımı KALKTI (ÖZET yüzü söküldü — K8 ADIM-B)", !jsKisim.includes('g.kapi && String(g.kapi).indexOf("[INSAN]")') && !jsKisim.includes("G.gorevler.filter((g) => g.aktif)"));
  ok("akordiyon sayı rozeti SÖKÜLDÜ (ADIM-D — akordiyonSayi YOK)", !jsKisim.includes("akordiyonSayi"));
  ok("document.title sayaçsız kimlik (ADIM-D — yalnız graf sürümü)", jsKisim.includes('document.title = "Kapsül Tuval — ordu " + G.grafSurumu;'));
  ok("statik HTML'de sabit görev sayısı YOK (40 görev vb.)", !/>\s*\d+\s*görev/.test(htmlKisim));
  ok("tepe şeridi YOK (kullanıcı emriyle söküldü — sayım iddiası da gitti)", !/class="serit"/.test(SRC));
});

test("24- E11 uydurma-veri YOK: her kalp-yüzü kabı ÖRNEK/ŞABLON-etiketli + kaynak beyanlı", () => {
  const ayir = SRC.indexOf("<script>");
  const htmlKisim = ayir > 0 ? SRC.slice(0, ayir) : "";
  const jsKisim = ayir > 0 ? SRC.slice(ayir) : SRC;
  ok("denetim kanıtı kayıtlı-beyanlı (kaynak: DALGA0-ARAYUZ-1)", jsKisim.includes("kayıtlı kapanış (DALGA0-ARAYUZ-1)"));
  ok("kanal geçmişi kayıtlı-beyanlı", htmlKisim.includes("kayıtlı değerler, canlı değil"));
  ok("hız iddiasına dürüst red (tek örnek notu)", jsKisim.includes("tek örnek; hız iddiası YOK"));
  ok('chat görünür GERÇEK etiketi («GERÇEK — 4930»)', htmlKisim.includes("GERÇEK — 4930"));
  ok("chat JS tarafı şablon/manager dürüstlük etiketi taşır (CHAT_ETIKET)", jsKisim.includes('const CHAT_ETIKET = "ŞABLON') && jsKisim.includes("manager yanıtı gerçek 4930 kaydından gelir"));
  ok('ajan kadrosu dolmaysa dürüst fallback («atanmadı» sınıfı: varsayılan kadro beyanı)', jsKisim.includes("varsayılan kadro (JSON ajanKadrosu.varsayilan)"));
  ok("grafsız bağımlılık pasif çip (SSOT'ta yok dürüstlüğü)", jsKisim.includes("böyle bir görev yok"));
  const canliDegil = (SRC.match(/canlı değil/g) || []).length;
  ok("«canlı değil» beyanı >= 5", canliDegil >= 5, "bulunan: " + canliDegil);
});

test("25- E12 animasyon kümesi: yalnız transform/opacity, <= 600ms, @keyframes YOK", () => {
  ok("@keyframes YOK", !SRC.includes("@keyframes"));
  const anim = SRC.match(/animation:\s*[^;}]+/g) || [];
  for (const a of anim) {
    ok("animation yalnız none: " + a.slice(0, 40), /animation:\s*none/.test(a));
  }
  const rmBlok = mediaBlok("prefers-reduced-motion: reduce") || "@@YOK@@";
  const tarama = SRC.replace(rmBlok, ""); // kapatma blogu tarama disi (vaka 14 kapsar)
  const gecisler = tarama.match(/transition:\s*[^;}]+/g) || [];
  ok("transition beyanı >= 3 (drawer/sekme/panel/toast/chat)", gecisler.length >= 3, "bulunan: " + gecisler.length);
  for (const g of gecisler) {
    const parcalar = g.replace(/^transition:\s*/, "").split(",");
    for (const p of parcalar) {
      const ozellik = p.trim().split(/\s+/)[0];
      ok("geçiş özelliği transform/opacity: " + p.trim().slice(0, 40), ozellik === "transform" || ozellik === "opacity");
    }
    const sureler = [...g.matchAll(/(\d+(?:\.\d+)?)ms/g)].map((m) => parseFloat(m[1]));
    for (const s of sureler) {
      ok("geçiş süresi <= 600ms: " + s + "ms", s <= 600);
    }
  }
});

test("26- AI CHAT (EK-ŞART 14:03 + R2): SAĞ BÜYÜK PANEL (VARSAYILAN) + ŞABLON-KOMUT ÜRETİCİ + kopyala (EK-2)", () => {
  const htmlKisim = htmlKisimOf();
  const jsKisim = jsKisimOf();
  // R2 düzeni: chat sağ panelde (ağaç solda, #sag sağda) — drawer düzeni değil
  const agacIdx = SRC.indexOf('id="agac"');
  const ortaIdx = SRC.indexOf('<section id="orta"');
  const sagIdx = SRC.indexOf('id="sag"');
  const chatIdx = SRC.indexOf('id="chatBolum"');
  ok("chat sağ panelde (ağaç + ortadan sonra, #sag içinde)", agacIdx > 0 && agacIdx < sagIdx && ortaIdx < sagIdx && sagIdx < chatIdx);
  const tChat = tagOf("chatBolum");
  ok("chat VARSAYILAN panel (hidden YOK — R2 emri)", !!tChat && !tChat.includes("hidden"));
  ok("chat panel GERÇEK yüzdür (data-ornek YOK — 4930 müdahale/manager kaydı)", !!tChat && !tChat.includes("data-ornek") && !!tChat && tChat.includes("chatBolum"));
  const tIk = tagOf("ik-chat");
  ok('ikon menü CHAT düğmesi varsayılan basılı (aria-pressed="true")', !!tIk && tIk.includes('aria-pressed="true"'));
  // panel bileşenleri
  ok('mesaj listesi (id="chatListe" + role="log" + aria-live)', htmlKisim.includes('id="chatListe"') && htmlKisim.includes('role="log"') && htmlKisim.includes('aria-live="polite"'));
  ok('girdi (id="chatGiris" type="text")', /id="chatGiris"[^>]*type="text"/.test(htmlKisim));
  ok('gönder düğmesi (id="chatGonder" type="submit")', /id="chatGonder"[^>]*type="submit"/.test(htmlKisim));
  ok('chat formu (id="chatForm")', htmlKisim.includes('id="chatForm"'));
  // şablon-üretici: GERÇEK komut dizgileri üretir
  ok("chatSablonlar üretici fonksiyonu", jsKisim.includes("function chatSablonlar("));
  ok("gece şablonu: hedef cümle komuta gömülür (--hedef + --limit 5)", jsKisim.includes("gece --hedef \"' + t + '\" --limit 5"));
  ok("replan + graf şablonları üretilir", jsKisim.includes("replan --esik N --hedef N") && jsKisim.includes("node src/cli.ts graf goster"));
  ok("plan taslağı şablonu (görev/faz/limit alanları)", jsKisim.includes("function chatPlanTaslak(") && jsKisim.includes("PLAN TASLAĞI (ŞABLON)") && jsKisim.includes("faz: <faz — boşsa (faz yok)>") && jsKisim.includes("limit: 5"));
  ok("«planı oluştur» akışı: planı komuta çevir + kopyala düğmesi", jsKisim.includes("chatPlanKopyala") && jsKisim.includes("planı komuta çevir + kopyala"));
  // kopyala + EK-2
  ok("chat yanıt işleyicisi (chatYanitla + chatMesajEkle)", jsKisim.includes("function chatYanitla(") && jsKisim.includes("function chatMesajEkle("));
  ok('form gönderimi işlenir ($("chatForm").addEventListener("submit"))', jsKisim.includes('$("chatForm").addEventListener("submit"'));
  ok("şablon komutları PANOA kopyalanır (panoaYaz + data-chat-komut)", jsKisim.includes("data-chat-komut") && jsKisim.includes("panoyaYaz(b.getAttribute"));
  ok("chat onay cümlesi ÜRETMEZ (JS'te ONAYLIYORUM YOK — EK-2)", !jsKisim.includes("ONAYLIYORUM"));
  ok("chat gerçek müdahale uçına POST eder (deneyPost + govde)", jsKisim.includes('deneyPost("/api/deney/mudahale"') && jsKisim.includes('deneyPost("/api/deney/mudahale", govde)'));
  ok('chat fail-closed alanı (id="chatKirmizi" + role="alert")', htmlKisim.includes('id="chatKirmizi"') && htmlKisim.includes('role="alert"'));
  ok("chat hata yüzü sahte yanıt ÜRETMEZ (DENEY SUNUCUSU HATA + fail-closed)", jsKisim.includes("DENEY SUNUCUSU HATA") && jsKisim.includes("sahte yanıt ÜRETİLMEZ"));
  ok("chat gerçek uç yanıtı ekrana gelir (GERÇEK 4930 YANITI)", jsKisim.includes("GERÇEK 4930 YANITI"));
  ok('composer seçici alanı (id="chatSecim" + id="chatRol")', htmlKisim.includes('id="chatSecim"') && htmlKisim.includes('id="chatRol"'));
  ok("seçici sunucu tercihini gerçek uca yazar (deneyPost /api/deney/tercih)", jsKisim.includes('deneyPost("/api/deney/tercih"'));
  ok("müdahale gövdesi seçim + rol taşır (provider/model/rol)", jsKisim.includes("govde.provider") && jsKisim.includes("govde.model") && jsKisim.includes("govde = { metin: deger, rol"));
  ok("seçim tazelemede korunur (onceki = sec.value)", jsKisim.includes("const onceki = sec.value"));
  ok("4930 yokken seçiciler kilitlenir (fail-closed)", jsKisim.includes("sec.disabled = true") && jsKisim.includes('$("chatRol").disabled = true'));
  ok("manager köprüsü kayıtları birleştirir (mudahale + log manager-yanit/mudahale-yanit)", jsKisim.includes("function chatKayitlar(") && jsKisim.includes('tur === "mudahale-yanit"') && jsKisim.includes('tur === "manager-yanit"'));
  ok("aynı yanıt metni sunumda tekilleşir (Set dedupe)", jsKisim.includes("const gorunen = new Set();") && jsKisim.includes("gorunen.has(k.metin)"));
  ok("5 sn tazelemede yerel şablon balonları korunur (chat-yerel yeniden eklenir)", jsKisim.includes("chat-yerel") && jsKisim.includes("for (const el of yerel) liste.appendChild(el);"));
  ok("sunucu balonları ayrıştırılır (chat-sunucu)", jsKisim.includes("chat-sunucu"));
  ok("4930 ölünce chat kırmızı yüzü otomatik yanar (deneyOluBanner)", jsKisim.includes('if (!D) { $("chatKirmizi").innerHTML = deneyOluBanner(); return; }'));
  ok("başarılı POST sonrası yerel insan balonu sunucu kaydıyla çiftlenmez (kullaniciKutu.remove)", jsKisim.includes("kullaniciKutu.remove();"));
  ok("manager kimliği sunucu durumundan yazılır (D.manager + chatManager)", jsKisim.includes("D.manager") && htmlKisim.includes('id="chatManager"'));
  ok("client manager-yanit POST etmez (uç operatör köprüsünde)", !jsKisim.includes('deneyPost("/api/deney/manager-yanit"'));
  ok("chat paneli görünürken 5 sn tazeleme (manager yanıtı gecikmez)", jsKisim.includes('setInterval(() => { if (sagAktif === "chat") deneyYukle(); }, 5_000);'));
  ok("boş hedef cümlede dürüst uyarı (hedef cümle boş)", jsKisim.includes("Hedef cümle boş"));
});

test("27- R2 ÜÇ SÜTUN · TEK VIEWPORT (ADIM-C: beş hücre — splitter'lı): grid + body scroll YOK + panel-içi kaydırma", () => {
  ok("main display:grid", /main\s*\{[^}]*display:\s*grid/.test(SRC));
  ok("grid AÇIK yerleşim (bug düzeltme: display:none çocuk yerleşimi KAYDIRMAZ — her çocuk sabit kolonda)",
    SRC.includes("main > #orta { grid-column:3; }") && SRC.includes("main > #sag { grid-column:5; }") && SRC.includes("main > #sol { grid-column:1; }"));
  ok("beş hücre izi (ADIM-C + duvar inceltme: --solW + 6px splitter + orta minmax(0,1fr) + 6px + --sagW; gap:0)", SRC.includes("grid-template-columns:var(--solW) 6px minmax(0,1fr) 6px var(--sagW)") && /main\s*\{[^}]*gap:\s*0/.test(SRC));
  ok("main viewport içinde esner (flex:1 1 auto + min-height:0)", /main\s*\{[^}]*flex:\s*1 1 auto/.test(SRC) && /main\s*\{[^}]*min-height:\s*0/.test(SRC));
  ok("tek viewport: body overflow:hidden (body scroll YOK — R2 emri)", /body\s*\{[^}]*overflow:\s*hidden/.test(SRC));
  ok("body height:100vh + flex kolon", /body\s*\{[^}]*height:\s*100vh/.test(SRC) && /body\s*\{[^}]*display:\s*flex/.test(SRC));
  ok('html, body height:100% kuralı', SRC.includes("html, body { height:100%; }"));
  ok("#sekmeGovde panel-içi kayar (overflow-y:auto)", /#sekmeGovde\s*\{[^}]*overflow-y:\s*auto/.test(SRC));
  ok(".grafKutu panel-içi kayar (overflow-y:auto)", /\.grafKutu\s*\{[^}]*overflow-y:\s*auto/.test(SRC));
  ok(".chatListe panel-içi kayar (overflow-y:auto)", /\.chatListe\s*\{[^}]*overflow-y:\s*auto/.test(SRC));
  ok(".sagPanel panel-içi kayar (overflow-y:auto)", /\.sagPanel\s*\{[^}]*overflow-y:\s*auto/.test(SRC));
  const dar = mediaBlok("max-width:1023px") || "";
  ok("dar ekranda tek-viewport gevşer (body height:auto + overflow:auto)", /body\s*\{[^}]*height:\s*auto/.test(dar) && /body\s*\{[^}]*overflow:\s*auto/.test(dar));
});

test("28- R2 SOL AKORDİYON: fazlar katlanır (aria-expanded + aria-controls + kapanmisFazlar kalıcı)", () => {
  const jsKisim = jsKisimOf();
  ok("akordiyon başlığı 44px", /\.akordiyonBas\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("JS şablonu aria-expanded yazar (runtime değerle)", jsKisim.includes("aria-expanded=\"' + acik + '\""));
  ok("JS şablonu aria-controls yazar (fazKimlik'ten üretilmiş id)", jsKisim.includes("aria-controls=\"' + fid + '\""));
  ok("geçerli DOM id üretici (function fazKimlik)", jsKisim.includes("function fazKimlik("));
  ok("katlama durumu kalıcı (kapanmisFazlar Set)", jsKisim.includes("kapanmisFazlar"));
  ok("katlama delege (closest(\".akordiyonBas\"))", jsKisim.includes('closest(".akordiyonBas")'));
  ok("tıklamada hidden döner (govde.hidden = !!acik)", jsKisim.includes("govde.hidden = !!acik"));
  ok("katlama durumu yazılır (kapanmisFazlar.add/delete)", jsKisim.includes("kapanmisFazlar.add") && jsKisim.includes("kapanmisFazlar.delete"));
  ok("30 sn yeniden çizimde katlama korunur (solYaz kapanmisFazlar'dan okur)", /function solYaz\(\)[^]{0,600}kapanmisFazlar/.test(jsKisim));
  ok("akordiyonOk geçişi transform (chevron döner)", /\.akordiyonOk\s*\{[^}]*transition:\s*transform/.test(SRC));
});

test("29- R2 ORTA SEKME MEKANİĞİ: görev sekmeleri açılır/kapanır; sec→sekme; kirmiziYuz temizler", () => {
  const jsKisim = jsKisimOf();
  ok("sekmeAc (görev sekmesi açar)", jsKisim.includes("function sekmeAc("));
  ok("sekmeKapat (× ile kapatır)", jsKisim.includes("function sekmeKapat("));
  ok("sekmeAktiflestir (panel değiştirir)", jsKisim.includes("function sekmeAktiflestir("));
  ok("renderSekmeler (dinamik sekme şeridi)", jsKisim.includes("function renderSekmeler("));
  ok("sec(id) görev sekmesi açar (sec → sekmeAc(id))", /function sec\([^)]*\)[^]{0,400}sekmeAc\(id\)/.test(jsKisim));
  ok("görev sekmesi paylaşılan paneli hedefler (aria-controls=detay)", jsKisim.includes('aria-controls="detay"'));
  ok("aktif sekme kartı etiketler (setAttribute aria-labelledby)", jsKisim.includes('setAttribute("aria-labelledby", "sek-g-" + ad)'));
  ok("kapanış karakteri × (U+00D7 — emoji menzili dışında)", jsKisim.includes("×</button>"));
  ok("kirmiziYuz görev sekmelerini kapatır (sekmeler.length = 0)", /function kirmiziYuz\([^)]*\)[^]{0,900}sekmeler\.length = 0/.test(jsKisim));
  ok("kirmiziYuz DAG sekmesini aktifleştirir (kırmızı hata katmanı görünür)", /function kirmiziYuz\([^)]*\)[^]{0,900}sekmeAktiflestir\("harita"\)/.test(jsKisim));
  ok("sekme kapatma delege (closest(\".sekmeKapat\"))", jsKisim.includes('closest(".sekmeKapat")'));
  ok("sekme tıkla=seç (closest(\".gorevSekme\") → sec)", jsKisim.includes('closest(".gorevSekme")'));
  ok("sabit sekme delege (closest(\"[data-sekme]\"))", jsKisim.includes('closest("[data-sekme]")'));
  const htmlKisim = htmlKisimOf();
  const sabit = (htmlKisim.match(/role="tab"/g) || []).length;
  ok("statik sabit sekme sayısı 4 (harita/defter/run/projeler — K8-2a PROJELER)", sabit === 4, "bulunan: " + sabit);
});

test("30- R2/K8 SAĞ İKON MENÜ: CHAT (varsayılan) + PROJE + API — panel içeriği dinamik değişir; hash/route YOK", () => {
  const htmlKisim = htmlKisimOf();
  const jsKisim = jsKisimOf();
  for (const id of ["ik-chat", "ik-proje", "ik-api"]) {
    const t = tagOf(id);
    ok(id + " düğmesi var", !!t);
    ok(id + " aria-pressed taşır (basılı durum bildirir)", !!t && t.includes("aria-pressed="));
  }
  ok('ik-chat varsayılan basılı (aria-pressed="true")', tagOf("ik-chat").includes('aria-pressed="true"'));
  ok('ik-proje başlangıçta kapalı (aria-pressed="false")', tagOf("ik-proje").includes('aria-pressed="false"'));
  ok('ik-api başlangıçta kapalı (aria-pressed="false")', tagOf("ik-api").includes('aria-pressed="false"'));
  ok("ikon etiketleri (CHAT/PROJE/API metin)", htmlKisim.includes("<span>CHAT</span>") && htmlKisim.includes("<span>PROJE</span>") && htmlKisim.includes("<span>API</span>"));
  ok("eski ÖZET/KOMUT düğmeleri YOK (K8 ADIM-B — söküldü)", !htmlKisim.includes('id="ik-ozet"') && !htmlKisim.includes('id="ik-komut"'));
  const tProje = tagOf("sagProje"), tApi = tagOf("sagApi");
  ok("PROJE paneli başlangıçta gizli (hidden)", !!tProje && tProje.includes("hidden"));
  ok("API paneli başlangıçta gizli (hidden)", !!tApi && tApi.includes("hidden"));
  ok("CHAT paneli VARSAYILAN görünür (yukarıda — vaka-26)", true);
  ok("panel değiştirici (function sagPanelAyarla)", jsKisim.includes("function sagPanelAyarla("));
  ok("panel-harita eşlemeleri (SAG_PANEL_ID + SAG_IKON_ID)", jsKisim.includes("SAG_PANEL_ID") && jsKisim.includes("SAG_IKON_ID"));
  ok('ikon düğmeleri doğrudan kablolı ($("ik-chat").addEventListener + ik-proje + ik-api)', jsKisim.includes('$("ik-chat").addEventListener') && jsKisim.includes('$("ik-proje").addEventListener') && jsKisim.includes('$("ik-api").addEventListener'));
  ok("dinamik değişim id-toggling (hash/route YOK)", !jsKisim.includes("location.hash") && !jsKisim.includes("history.pushState") && !jsKisim.includes("history.replaceState"));
  ok("akışkan panel geçişi (requestAnimationFrame + .acik sınıfı)", jsKisim.includes("requestAnimationFrame") && /\.sagPanel\.acik/.test(SRC));
  ok("[hidden] ezilmez (açık display kuralına karşı .sagPanel[hidden])", /\.sagPanel\[hidden\]\s*\{\s*display:\s*none/.test(SRC));
});

test("31- R2 LIGHT TEMA: açık zemin + koyu metin + light accent; eski koyu tokenlar yok", () => {
  ok("açık zemin tokenı (--zemin:#f4f6f9)", SRC.includes("--zemin:#f4f6f9"));
  ok("beyaz yüzey tokenı (--yuzey:#ffffff)", SRC.includes("--yuzey:#ffffff"));
  ok("koyu metin tokenı (--metin:#1a2332)", SRC.includes("--metin:#1a2332"));
  ok("meta color-scheme light", SRC.includes('content="light"'));
  ok("kırmızı yüz light paletle (--tehlike:#dc2626)", SRC.includes("--tehlike:#dc2626"));
  ok("başarı/uyarı light paletle (--basari:#047857 + --uyari:#b45309)", SRC.includes("--basari:#047857") && SRC.includes("--uyari:#b45309"));
  ok("DURUMRENK light değerler (HAZIR #047857)", SRC.includes('HAZIR: "#047857"'));
  ok("eski koyu zeminler yok (#070b14/#0d1420/#071018)", !SRC.includes("#070b14") && !SRC.includes("#0d1420") && !SRC.includes("#071018"));
  ok("eski koyu aksanlar yok (#22d3ee/#8b5cf6/#b2dfdb)", !SRC.includes("#22d3ee") && !SRC.includes("#8b5cf6") && !SRC.includes("#b2dfdb"));
  ok("tuval zemini açık (#fafcff)", SRC.includes("#fafcff"));
  ok("kırmızı yüz katmanı açık zeminli (rgba(255,255,255,0.97))", SRC.includes("rgba(255,255,255,0.97)"));
});

test("32- R2 BÜYÜK YAZILAR: baz 16px; başlıklar 20-24px; GENEL STATE sayıları büyük", () => {
  ok("body baz font-size:16px (>=15-16px)", /body\s*\{[^}]*font-size:\s*16px/.test(SRC));
  ok(".bolum-etiket 20px (bölüm başlığı)", /\.bolum-etiket\s*\{[^}]*font-size:\s*20px/.test(SRC));
  ok(".kartId 22px (görev kimliği — başlık bandı 20-24 arası)", /\.kartId\s*\{[^}]*font-size:\s*22px/.test(SRC));
  ok("K8 ADIM-B: .dkAjanAd 14px + .dkModelEtiket 13.5px (yeni yüzler okunur)", /\.dkAjanAd\s*\{[^}]*font-size:\s*14px/.test(SRC) && /\.dkModelEtiket\s*\{[^}]*font-size:\s*13\.5px/.test(SRC));
  ok(".chatGiris 15px (girdi bazı >= 15px)", /\.chatGiris\s*\{[^}]*font-size:\s*15px/.test(SRC));
});

test("33- K8 ADIM-B PROJE + API: GERÇEK 4930 uçları + fail-closed kırmızı yüz — sahte veri ÜRETİLMEZ", () => {
  const htmlKisim = htmlKisimOf();
  const jsKisim = jsKisimOf();
  const projeBas = htmlKisim.indexOf('id="sagProje"');
  const apiBas = htmlKisim.indexOf('id="sagApi"');
  ok("ÖZET + KOMUT yüzleri SÖKÜLDÜ (sagOzet/sagKomut YOK — kullanıcı emri)", !htmlKisim.includes('id="sagOzet"') && !htmlKisim.includes('id="sagKomut"'));
  ok("PROJE paneli statik HTML'de (sagProje)", projeBas > 0);
  ok("API paneli statik HTML'de (sagApi)", apiBas > 0);
  const projeBolum = projeBas > 0 ? htmlKisim.slice(projeBas, apiBas > projeBas ? apiBas : htmlKisim.length) : "";
  ok("ATAMA formu alanları (proje/ajan/sağlayıcı/rol + gorev/rolMd opsiyonel)",
    ["atProje", "atAjan", "atSaglayici", "atRol", "atGorev", "atRolMd", "atGonder"].every((i) => projeBolum.includes('id="' + i + '"')));
  ok('PROJE yüzü GERÇEK etiketi («GERÇEK — 4930»)', projeBolum.includes("GERÇEK — 4930"));
  ok("ajan-ata GERÇEK ucu (deneyPost \"/api/deney/ajan-ata\")", jsKisim.includes('deneyPost("/api/deney/ajan-ata"'));
  ok("api-test GERÇEK ucu (deneyPost \"/api/deney/api-test\")", jsKisim.includes('deneyPost("/api/deney/api-test"'));
  ok("tercih GERÇEK ucu (deneyPost \"/api/deney/tercih\")", jsKisim.includes('deneyPost("/api/deney/tercih"'));
  ok("boş workspace envanterinde sabit proje ÜRETİLMEZ (D:/Vibecode/deney-g9-repo YOK)", !SRC.includes("D:/Vibecode/deney-g9-repo"));
  ok("boş workspace envanterinde kırmızı fail-closed yüz (WORKSPACE YOK)", jsKisim.includes("WORKSPACE YOK") && jsKisim.includes("sabit proje ÜRETİLMEZ"));
  ok("sağ panel başlıkları 20px (manifesto §1)", /\.panelBas \.bolum-etiket\s*\{[^}]*font-size:\s*20px/.test(SRC) && /\.chatBas h3\s*\{[^}]*font-size:\s*20px/.test(SRC));
  ok("chat balon metni 15px (manifesto §1)", /\.chatMesaj\s*\{[^}]*font-size:\s*15px/.test(SRC));
  ok("4930 ölürse kırmızı yüz (deneyOluBanner — fail-closed)", jsKisim.includes("function deneyOluBanner("));
  ok("bayat deney verisi kalmaz (deneyYukle catch → D=null)", /deneyYukle[^]{0,600}catch \(e\)[^]{0,120}D = null/.test(jsKisim));
  ok("sahte sağlayıcı/model RED: sunucu hata nesnesi kullanıcıya dürüst taşınır (b.hata)", jsKisim.includes("b.hata"));
  ok("AJANLAR listesi durumdan çizilir (ajanlarYaz)", jsKisim.includes("function ajanlarYaz("));
  ok("API test sahte sonucu ÜRETİLMEZ (yalnız kuyruk kaydı beyanı)", jsKisim.includes("fail-closed — sahte test sonucu üretilmez") || htmlKisim.includes("sahte test sonucu üretilmez"));
  ok("PROJE seçim tazelemede korunur (oncekiProje)", jsKisim.includes("oncekiProje"));
  ok("sağlayıcı akordiyon tazelemede korunur (acikSagKartlar)", jsKisim.includes("acikSagKartlar"));
  ok("ÖRNEK ajanlar etiketli kalır (kalp-yüzü — etiketOrnek)", jsKisim.includes('class="etiketOrnek">ÖRNEK'));
});

test("34- ADIM-C panel resize + sağ panel aç/kapa: splitter ×2 (pointer events + klavye) + localStorage + 44px dokunma ritmi", () => {
  ok(":root değişkenleri (--solW/--sagW)", SRC.includes("--solW:280px") && SRC.includes("--sagW:380px"));
  ok("splitter CSS (col-resize + touch-action:none + ::after tutamaç)", /\.splitter\s*\{[^}]*cursor:\s*col-resize[^}]*touch-action:\s*none/.test(SRC) && SRC.includes(".splitter::after"));
  ok('sol splitter elemanı (id="splitSol" role=separator tabindex)', /id="splitSol"[^>]*role="separator"[^>]*tabindex="0"/.test(SRC));
  ok('sağ splitter elemanı (id="splitSag" role=separator tabindex)', /id="splitSag"[^>]*role="separator"[^>]*tabindex="0"/.test(SRC));
  ok("splitterKur ×2 (pointer events — fare + dokunmatik; deney deseni)", SRC.includes('splitterKur("splitSol", "sol")') && SRC.includes('splitterKur("splitSag", "sag")'));
  ok("pointer capture sürüklemede (setPointerCapture try/catch — kayıp tolere)", SRC.includes("kolon.setPointerCapture"));
  ok("sürükleyici bitişler (pointerup/pointercancel/lostpointercapture)", ["pointerup", "pointercancel", "lostpointercapture"].every((i) => SRC.includes('addEventListener("' + i + '"')));
  ok("genişlik alt sınırı 180px (nefes alan — clamp)", SRC.includes("Math.max(180,"));
  ok("genişlik üst sınırı 45vw (orta ezilmez)", SRC.includes("window.innerWidth * 0.45"));
  ok("localStorage kalıcılığı (kaydet tuval-solW/sagW + kaydet/oku sessiz catch)", SRC.includes('kaydet("tuval-" + taraf + "W"') && /function kaydet[^]{0,90}catch/.test(SRC));
  ok("açıhta kayıtlı genişlik uygulanır (oku + genislikKenetle)", SRC.includes('oku("tuval-" + taraf + "W")'));
  ok("klavye erişimi (ArrowLeft/ArrowRight ±16px — WAI-ARIA separator)", SRC.includes('e.key !== "ArrowLeft"') && SRC.includes("ArrowLeft\" ? -16 : 16"));
  ok("aria-valuenow senkron (genislikUygula)", SRC.includes('setAttribute("aria-valuenow"'));
  ok('sağ panel düğmesi (id="sagPanelBtn" aria-pressed + aria-controls="sag")', /id="sagPanelBtn"[^>]*aria-pressed="true"[^>]*aria-controls="sag"/.test(SRC));
  ok("body.sag-kapali kuralı (geniş ekran — panel + splitter gizlenir; duvar 6px)", /body\.sag-kapali\s+main[^}]*grid-template-columns:\s*var\(--solW\)\s*6px\s*minmax\(0,1fr\)\s*0px\s*0px/.test(SRC) && /body\.sag-kapali\s+#sag,\s*body\.sag-kapali\s+#splitSag\s*\{[^}]*display:\s*none/.test(SRC));
  ok("ikisi de kapalı kombinasyonu (drawer-kapali + sag-kapali)", /body\.drawer-kapali\.sag-kapali\s+main/.test(SRC));
  ok("sağ panel durumu kalıcı (tuval-sagAcik)", SRC.includes('kaydet("tuval-sagAcik"'));
  ok("dar ekranda splitter gizli (<1024 tek kolon akış)", /@media \(max-width:1023px\)[^]{0,2000}\.splitter\s*\{\s*display:\s*none/.test(SRC));
  ok("pencere daralınca 45vw yeniden kenetlenir (resize dinleyicisi)", /addEventListener\("resize"[^]{0,700}genislikKenetle/.test(SRC));
});

test("35- POST RED yolunda yerel balon/seçim sunucu gerçeğine döner (ORDU-3 fail-closed kapanışı)", () => {
  const jsKisim = jsKisimOf();
  ok("müdahale RED: kullanıcı yerel balonu EKRANDA KALMAZ (catch → remove)", /\.catch\(\(hata\) => \{\s*kullaniciKutu\.remove\(\);/.test(jsKisim));
  ok("müdahale RED: kırmızı fail-closed yüz kalır (chatKirmizi + sahte yanıt YOK)", /\.catch\(\(hata\) => \{\s*kullaniciKutu\.remove\(\);[\s\S]{0,300}chatKirmizi/.test(jsKisim) && jsKisim.includes("sahte yanıt ÜRETİLMEZ"));
  ok("tercih RED: yerel seçim sunucudaki önceki tercihe GERİ döner (chatSecimiSunucuyaGeriAl)", /catch \(e\) \{\s*chatSecimiSunucuyaGeriAl\(\);/.test(jsKisim));
  ok("geri dönüş kaynağı sunucu tercihidir (D.tercih provider|model; kayıt yoksa boş)", /function chatSecimiSunucuyaGeriAl\(\)\s*\{\s*const tercih = D && D\.tercih;[\s\S]{0,240}tercih\.provider \+ "\|" \+ tercih\.model : ""/.test(jsKisim));
});

test("36- R3 KURUMSAL CİLA: süs katmanı yok (gradient/leke/kanca/lift) · tek aksan petrol mavisi · radius ölçeği 3 token · pil YOK · modBtn kuralı VAR", () => {
  ok("tek aksan petrol mavisi (--camgobegi:#0f4c81)", SRC.includes("--camgobegi:#0f4c81"));
  ok("mor aksan tokenı SÖKÜLDÜ (--menevse YOK)", !SRC.includes("--menevse"));
  ok("mor rgba izleri yok (rgba(109,40,217)", !SRC.includes("rgba(109,40,217"));
  ok("eski teal izi yok (#0e7490)", !SRC.includes("#0e7490") && !SRC.includes("%230e7490"));
  ok("dekoratif gradient YOK (linear/radial-gradient kaynağıta yok)", !SRC.includes("linear-gradient") && !SRC.includes("radial-gradient"));
  ok("ışık lekesi bileşeni SÖKÜLDÜ (.isik sınıfı YOK)", !SRC.includes(".isik"));
  ok("body::before süs dokusu SÖKÜLDÜ (fixed zemin katmanı yok)", !/body::before/.test(SRC));
  ok("tuval köşe kancaları SÖKÜLDÜ (#tuvalSarma::before/::after YOK)", !/#tuvalSarma::(before|after)/.test(SRC));
  ok("kart hover lift YOK (translateY(-2px) yok; yalnız kenarlık)", !SRC.includes("translateY(-2px)"));
  ok("radius ölçeği 3 token (--radius:8px + --radius-k:6px + --radius-cip:4px)", SRC.includes("--radius:8px") && SRC.includes("--radius-k:6px") && SRC.includes("--radius-cip:4px"));
  ok("eski 12px kart radius'u yok (--radius:12px)", !SRC.includes("--radius:12px"));
  ok("pil rozet YOK (border-radius:999px / 99px kalmadı)", !SRC.includes("999px") && !SRC.includes(":99px"));
  ok("modBtn CSS kuralı VAR (defter okur düğmeleri tarayıcı varsayılanında değil)", /\.modBtn\s*\{/.test(SRC));
  ok("modBtn aktif hali aria-pressed'e bağlı (tek gerçeklik kaynağı — JS attribute'u yazar)", /\.modBtn\[aria-pressed="true"\]\s*\{/.test(SRC));
  ok("yüzey3 tokenı VAR (akordiyon hover tokenlı)", SRC.includes("--yuzey3:#e4eaf2"));
  ok("başlık ağırlıkları 800 YOK (kurumsal 700 disiplini)", !SRC.includes("font-weight:800"));
  ok("splitter aktif dolgu yeni aksanla (--glow rgba(15,76,129,0.18))", SRC.includes("--glow:rgba(15,76,129,0.18)"));
  ok("DURUMRENK DEVAM yeni aksanla (DEVAM #0f4c81)", SRC.includes('DEVAM: "#0f4c81"'));
  ok("marka logosu grafit+petrol çift tonlu (dış #1a2332, iç #0f4c81)", /stroke="#1a2332"/.test(SRC) && SRC.includes('stroke="#0f4c81"'));
  ok("R2 manifesto ölçütleri korunur: baz 16px + başlık 20/22px + 44px (vaka 3/21/31/32 sahibi)", /body\s*\{[^}]*font-size:\s*16px/.test(SRC) && /\.bolum-etiket\s*\{[^}]*font-size:\s*20px/.test(SRC));
});

test("37- K8-1a GRAF OKU/SEÇ: DAG düğümü → kart + atanabilir ajanlar + faz tamamlanma sayımı (uydurma alan/FAZ eşleşmesi YOK)", () => {
  const htmlKisim = htmlKisimOf();
  const jsKisim = jsKisimOf();
  ok('sol panel faz göstergesi (id="fazYuzde")', !!tagOf("fazYuzde"));
  ok("faz yüzdesi kapalı/toplam düğüm sayımından hesaplanır (GRAF SSOT)", jsKisim.includes("const kapali = gs.filter((g) => String(g.durum || \"\").split(\" \")[0] === \"KAPALI\").length") && jsKisim.includes("Math.round((kapali / toplam) * 100)"));
  ok("SVG ölçek yüzdesi AYRI kalır (#yuzdek hâlâ viewBox ölçek", /function vbUygula\(\)[^]{0,320}\$\("yuzdek"\)\.textContent = "%" \+ Math\.round\(\(r\.width \/ vb\.w\) \* 100\)/.test(jsKisim));
  ok('GRAF sağ paneli (id="sagGraf" hidden)', !!tagOf("sagGraf") && tagOf("sagGraf").includes("hidden"));
  ok('GRAF ikonu (id="ik-graf" aria-pressed)', !!tagOf("ik-graf") && /aria-pressed="false"/.test(tagOf("ik-graf")));
  ok("DAG düğüm tıklaması GRAF yüzünü açar (sec(id, false, true))", jsKisim.includes('sec(n.dataset.id, false, true)') && jsKisim.includes('if (grafAc) sagPanelAyarla("graf")'));
  ok("düğüm kartı yalnız G.gorevler.find(/secilen) diliminden", /function grafYonetimYaz\(\)[^]{0,600}const g = G\.gorevler\.find\(\(x\) => x\.id === secilen\)/.test(jsKisim));
  ok("kart alanları graf kaydından (durum·faz·rol·dizin·ölçüt·bağımlılık·kapı·limitler)", /grafMetin\(g\.durum\).*grafMetin\(g\.faz \|\| "\(faz yok\)"\).*grafMetin\(roller\).*grafMetin\(g\.dizin\).*grafMetin\(g\.olcut\).*grafMetin\(\(g\.bagimli \|\| \[\]\)\.join\(", "\)\).*grafMetin\(g\.kapi\).*grafMetin\(g\.secilebilir\)/s.test(jsKisim));
  ok("atanabilir ajanlar D.ajanlar.ornek gerçek envanterinden", jsKisim.includes('Array.isArray(D.ajanlar.ornek) ? D.ajanlar.ornek : []'));
  ok("ajan filtresi rol + dizin izni + eşzamanlı limit", jsKisim.includes('neden: "rol-eksik"') && jsKisim.includes('neden: "dizin-yasak"') && jsKisim.includes('neden: "limit-dolu"'));
  ok("ajan-faz uydurma eşleşmesi YOK (envanterde faz alanı yok)", !jsKisim.includes("ajanFaz") && !jsKisim.includes("fazEslestir") && htmlKisim.includes("ajan kaydında faz alanı yoktur"));
  ok("envanter boşsa sabit ajan ÜRETİLMEZ (fail-closed)", jsKisim.includes("D.ajanlar.ornek boş döndü") && jsKisim.includes("sabit ajan ÜRETİLMEZ"));
  ok("GRAF ajan satırı 44px dokunma hedefi", /\.grafAjanSatir\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
});

test("38- K8-1b ATAMA ZİNCİRİ: seç → TASLAK → ONAY → durum; PANO_TOKEN fail-closed · graf SSOT yazma YOK", () => {
  const jsKisim = jsKisimOf();
  ok("sağ panel haritasına GRAF yüzü eklendi", jsKisim.includes('SAG_PANEL_ID = { chat: "chatBolum", proje: "sagProje", graf: "sagGraf", api: "sagApi" }'));
  ok("TASLAK gerçek ucu: POST /api/atama/taslak {gorevId, ajanId}", jsKisim.includes('await atamaPost("taslak", { gorevId: secilen, ajanId })') && jsKisim.includes('fetch("/api/atama/" + uc'));
  ok("ONAY gerçek ucu: POST /api/atama/onay {gorevId}", jsKisim.includes('await atamaPost("onay", { gorevId: secilen })'));
  ok("durum gerçek ucu: GET /api/atama/durum", jsKisim.includes('fetch("/api/atama/durum")'));
  ok("PANO_TOKEN başlıkla gönderilir; token DEĞERİ loglanmaz", jsKisim.includes('"X-Pano-Token": token') && !/console\.(log|info|warn|error)\([^)]*token/.test(jsKisim));
  ok("token yoksa POST RED (sahte 201 YOK)", jsKisim.includes('if (!token) throw new Error("PANO_TOKEN girin (üst bardaki alan)")'));
  ok("HTTP/hata gövdesi fail-closed (403/401/422 RED)", jsKisim.includes('if (!r.ok || !j || j.hata) throw new Error((j && j.hata) || "HTTP " + r.status)'));
  ok("TASLAK yalnız sunucu yanıtından gelir (grafTaslak = yanit.taslak)", jsKisim.includes("grafTaslak = yanit.taslak || null"));
  ok("ONAY yalnız sunucudaki TASLAK'a bağlıdır", jsKisim.includes('if (!grafTaslak || grafTaslak.gorevId !== secilen)') && jsKisim.includes('grafTaslak.onay === "TASLAK"'));
  ok("ONAY düğmesi TASLAK yoksa kilitli", jsKisim.includes('$("grafOnayGonder").disabled = !(grafTaslak && grafTaslak.gorevId === secilen && grafTaslak.onay === "TASLAK")'));
  ok("durum okuma hatasında bayat harita gösterilmez", jsKisim.includes("grafAtamaDurum = null; grafAtamaHata = e.message") && jsKisim.includes("bayat atama gösterilmez"));
  ok("TASLAK → ONAY zinciri iki ayrı çağrı (tek çağrıda kalıcı atama YOK)", !jsKisim.includes("/api/atama/taslak-onay") && !jsKisim.includes('atamaPost("taslak", { gorevId: secilen, ajanId });\n    await atamaPost("onay"'));
  ok("GRAF SSOT yazma ucu YOK (/api/graf/yaz veya POST /api/graf)", !jsKisim.includes("/api/graf/yaz") && !/fetch\("\/api\/graf",\s*\{\s*method:\s*"POST"/.test(jsKisim));
  ok("ajan satırı tıklaması delege ile gerçek TASLAK akışına bağlı", jsKisim.includes('e.target.closest(".grafAjanSatir")') && jsKisim.includes("grafAjanTaslak(dugme.getAttribute(\"data-ajan\"), dugme)"));
});

test("39- K8-2a G10a PROJE SEÇİCİ: üst bar rozeti + listbox + kalıcı seçim (localStorage) + dış-tık/Esc kapatma", () => {
  const htmlKisim = htmlKisimOf();
  const jsKisim = jsKisimOf();
  const t = tagOf("projeSecici");
  ok("üst barda seçici düğmesi (id=projeSecici + class=projeBtn)", !!t && t.includes('class="projeBtn"'));
  ok("aria-haspopup=listbox + aria-expanded senkron + aria-controls=projeListe", !!t && t.includes('aria-haspopup="listbox"') && t.includes('aria-expanded="false"') && t.includes('aria-controls="projeListe"'));
  const tl = tagOf("projeListe");
  ok("açılır liste (id=projeListe role=listbox, başlangıçta hidden)", !!tl && tl.includes('role="listbox"') && tl.includes("hidden"));
  ok("rozet + ok (id=projeRozet + aria-hidden ok)", !!tagOf("projeRozet") && SRC.includes('class="projeOk" aria-hidden="true"'));
  ok("iki seçenek: SİSTEM görünümü + ORDU (data-proje-sec sistem/ordu)", htmlKisim.includes('data-proje-sec="sistem"') && htmlKisim.includes('data-proje-sec="ordu"'));
  ok("seçenekler klavyeyle erişilir (role=option + tabindex=0 + aria-selected)", /role="option" data-proje-sec="sistem" tabindex="0"/.test(htmlKisim) && /role="option" data-proje-sec="ordu" tabindex="0"/.test(htmlKisim));
  ok("tuval içi sabit manifest (SİSTEM görünümü + ORDU — uydurma proje YOK E10)", jsKisim.includes("const PROJE_MANIFEST = [") && jsKisim.includes('{ id: "sistem", ad: "SİSTEM görünümü"') && jsKisim.includes('{ id: "ordu", ad: "ORDU"'));
  ok("manifest dışı görünüm ÜRETİLMEZ (sistem|ordu guard)", /function projeSecDegistir\([^)]*\)[^]{0,200}deger !== "sistem" && deger !== "ordu"/.test(jsKisim));
  ok("seçim kalıcı (localStorage tuval-proje — kaydet + oku)", jsKisim.includes('kaydet("tuval-proje", deger)') && jsKisim.includes('oku("tuval-proje")'));
  ok("G10a ↔ G11 senkronu: seçim defter kapsamını belirler", jsKisim.includes('defterKapsam = deger === "sistem" ? "sistem" : "proje"'));
  ok("rozet yazımı SİSTEM/ORDU + aria-selected senkronu", /function projeRozetYaz\(\)[^]{0,300}SİSTEM" : "ORDU/.test(jsKisim) && jsKisim.includes('li.getAttribute("data-proje-sec") === projeSecimi'));
  ok("düğme + liste kablolı (click + keydown Enter/Space → seçim)", jsKisim.includes('$("projeSecici").addEventListener("click"') && jsKisim.includes('$("projeListe").addEventListener("keydown"'));
  ok("dış tıklamada liste kapanır (!closest(.projeKutu))", jsKisim.includes('if (!e.target.closest(".projeKutu")) projeListeAcKapa(false)'));
  ok("Escape kapatır (document keydown)", jsKisim.includes('e.key === "Escape") projeListeAcKapa(false);'));
  ok("açılışta kalıcı seçim uygulanır (projeSecimiBaslat + oku)", jsKisim.includes("projeSecimiBaslat();") && /function projeSecimiBaslat\(\)[^]{0,400}oku\("tuval-proje"\)/.test(jsKisim));
});

test("40- K8-2a G10b PROJELER SEKMESİ: 4. sabit sekme + filo özeti + GÖREV TABLOSU kahraman (GERÇEK alanlar + dürüst boşluklar)", () => {
  const htmlKisim = htmlKisimOf();
  const jsKisim = jsKisimOf();
  const t = tagOf("sek-projeler");
  ok("sekme düğmesi (id=sek-projeler role=tab + data-sekme=projeler + aria-controls=projelerBolum)", !!t && t.includes('role="tab"') && t.includes('data-sekme="projeler"') && t.includes('aria-controls="projelerBolum"'));
  ok("panel (id=projelerBolum role=tabpanel + aria-labelledby=sek-projeler)", /id="projelerBolum"[^>]*role="tabpanel"/.test(htmlKisim) && htmlKisim.includes('aria-labelledby="sek-projeler"'));
  ok("SABIT_SEKMELER 4 üyeli (harita/defter/run/projeler)", jsKisim.includes('const SABIT_SEKMELER = ["harita", "defter", "run", "projeler"];'));
  ok("manifest dürüst notu (uydurma proje listesi YASAK — E10)", htmlKisim.includes("uydurma proje listesi YASAK (E10)"));
  ok("proje özeti GRAF SSOT alanlarından (grafSurumu + açık kapı + son damga)", /function projelerYaz\(\)[^]{0,900}G\.gorevler\.filter\(\(g\) => g\.kapi\)\.length/.test(jsKisim) && jsKisim.includes("G.grafSurumGecmisi[G.grafSurumGecmisi.length - 1].tarih") && jsKisim.includes('esc(String(G.grafSurumu || "—"))'));
  ok("«şu projeye geç» düğmesi seçiciyi değiştirir (data-gec-proje + delege + SEÇİLİ rozeti)", jsKisim.includes("ŞU PROJEYE GEÇ") && jsKisim.includes('closest("[data-gec-proje]")') && jsKisim.includes('dkRozet teal">SEÇİLİ'));
  ok("görev tablosu başlığı 5 sütun (GÖREV/FAZ/DURUM/YÜRÜTÜCÜ AJAN/SON OLAY)", jsKisim.includes('gorevTabloBas"><span>GÖREV</span><span>FAZ</span><span>DURUM</span><span>YÜRÜTÜCÜ AJAN</span><span>SON OLAY</span>'));
  ok("satır = görev (data-gorev-row + delege → gorevDetayAc)", jsKisim.includes('data-gorev-row="') && jsKisim.includes('closest(".gorevSatir")') && jsKisim.includes('gorevDetayAc(el.getAttribute("data-gorev-row"))'));
  ok("yürütücü ajan atama haritasından; kayıt yoksa dürüst «atanmadı»", jsKisim.includes("grafAtamaDurum.harita[g.id]") && jsKisim.includes(': "atanmadı")'));
  ok("son olay kayıttan + G11 rozetli; kayıt yoksa dürüst «kayıt yok»", jsKisim.includes("gorevSonOlay(g.id)") && jsKisim.includes(': "kayıt yok")'));
  ok("durum rengi + faz SATIRDA kalır (DURUMRENK + (faz yok))", /function gorevTablosuYaz\(\)[^]{0,900}DURUMRENK\[d\] \|\| "#666"/.test(jsKisim) && jsKisim.includes('g.faz || "(faz yok)"'));
  ok("fail-closed: grafsız tablo çizilmez (bosSatir)", jsKisim.includes("graf yok — görev tablosu gösterilmez (fail-closed)"));
  ok("kirmiziYuz omurga yüzlerini boşaltır (proje özeti + tablo + O1 kartı kapanır)", /function kirmiziYuz\([^)]*\)[^]{0,1200}graf yok — görev tablosu gösterilmez/.test(jsKisim) && /function kirmiziYuz\([^)]*\)[^]{0,1200}gorevDetayKapat\(\)/.test(jsKisim));
  ok("tablo döngüde tazelenir (deneyYaz + atamaDurumYukle beslemesi)", jsKisim.includes("grafYonetimYaz(); ajanFiloYaz(); gorevTablosuYaz(); }") && /function atamaDurumYukle\([^)]*\)[^]{0,700}gorevTablosuYaz\(\)/.test(jsKisim));
  ok("görev satırı 44px (min-height:var(--min-dokunma))", /\.gorevSatir\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("başlık + satır aynı 5 kolonlu grid (hücreler hizalı)", /\.gorevTabloBas\s*\{[^}]*grid-template-columns/.test(SRC) && /\.gorevSatir\s*\{[^}]*grid-template-columns/.test(SRC));
  ok("dar ekranda tablo başlığı gizlenir + hücreler akar (639px)", (mediaBlok("max-width:639px") || "").includes(".gorevTabloBas { display:none; }"));
});

test("41- K8-2a O1 GÖREV DETAY KARTI (omurga halkası 2): NE YAPIYOR · NASIL YAPMALI + KISITLAR · KANIT", () => {
  const htmlKisim = htmlKisimOf();
  const jsKisim = jsKisimOf();
  ok("kart kabuğu (id=gorevDetay + aria-live=polite + hidden)", /id="gorevDetay"[^>]*aria-live="polite"/.test(htmlKisim));
  ok("NE YAPIYOR bölümü (atanmış ajan + son gerçek olay)", jsKisim.includes('kartBolumBas">NE YAPIYOR — atanmış ajan + son gerçek olay'));
  ok("NASIL YAPMALI bölümü (talimat + KISITLAR — GRAF düğüm verisi)", jsKisim.includes('kartBolumBas">NASIL YAPMALI — talimat + KISITLAR (GRAF düğüm verisi'));
  ok("KANIT bölümü + deftere geçiş düğmesi (data-sekme=defter)", jsKisim.includes('kartBolumBas">KANIT — defter/olay satırlarına geçiş') && jsKisim.includes('data-sekme="defter">▸ KANIT DEFTERİNDE GÖR'));
  ok("kısıt alanları GRAF kaydından (rol·dizin·konum loc+testLoc·seçilebilir·uygulamaYetkisi·bütçe·ölçüt)", jsKisim.includes('kSatir("rol", grafMetin(g.rol)') && jsKisim.includes('kSatir("dizin", grafMetin(g.dizin)') && jsKisim.includes('kSatir("konum", grafMetin(g.loc)') && jsKisim.includes("g.testLoc") && jsKisim.includes('kSatir("seçilebilir", grafMetin(g.secilebilir))') && jsKisim.includes('kSatir("uygulama yetkisi", grafMetin(g.uygulamaYetkisi))') && jsKisim.includes('kSatir("bütçe", grafMetin(g.butceyeDahil))') && jsKisim.includes('kSatir("ölçüt (kabul)", grafMetin(g.olcut)'));
  ok("atanmadı dürüstlüğü (atama haritasında kayıt yok)", jsKisim.includes("atanmadı — atama haritasında kayıt yok"));
  ok("son olay kaynağı beyanlı (atamalar defteri / deney logu)", jsKisim.includes("atamalar defteri (/api/atama/durum)") && jsKisim.includes("deney logu (4930)"));
  ok("kimlik eşleşmesi kelime-sınırlı (D1 ↔ D17 karışmaz)", jsKisim.includes("function metindeKimlikVar(") && jsKisim.includes("D1 ile D17 karışmaz"));
  ok("görev fişi bağlantısı (data-fis-id → fisMd + panoyaYaz — GERÇEK graf verisi)", jsKisim.includes('data-fis-id="') && jsKisim.includes('closest("[data-fis-id]")') && jsKisim.includes("panoyaYaz(fisMd(fg))"));
  ok("ajan kartına geçiş (data-ajan-kart → O3)", jsKisim.includes('data-ajan-kart="') && jsKisim.includes('closest("[data-ajan-kart]")'));
  ok("performans ölçüm bağlantısı dürüst (ölçüm yok → AJAN KARTINDA)", jsKisim.includes("kayıtlı run ölçümü — tam yüz AJAN KARTINDA (O2)") && jsKisim.includes("ölçüm yok — bu ajanın modeline bağlı run kartı kaydı yok"));
  ok("kart GERÇEK etiketli (/api/graf · /api/atama · 4930)", jsKisim.includes("GERÇEK — /api/graf · /api/atama · 4930"));
  ok("kart × kapat düğmesi kablolı (gorevDetayKapat)", jsKisim.includes('id="gorevDetayKapat"') && jsKisim.includes('$("gorevDetayKapat").addEventListener'));
});

test("42- K8-2a O2 AJAN PERFORMANS YÜZÜ (omurga halkası 3): KAYITLI ölçümler — PUANI AJAN YAZAMAZ (hard kapı)", () => {
  const jsKisim = jsKisimOf();
  const olcumBlok = (() => { const a = jsKisim.indexOf("const OLCUM_KAYITLARI"); const b = jsKisim.indexOf("];", a); return a >= 0 && b > a ? jsKisim.slice(a, b) : ""; })();
  const hesapGovde = (() => { const a = jsKisim.indexOf("function olcumHesapla("); const b = jsKisim.indexOf("\nfunction ", a); return a >= 0 && b > a ? jsKisim.slice(a, b) : ""; })();
  ok("kayıtlı ölçüm sabitleri (3 run kartı değeri — Paseo 35195156 · 270/450/168 sn · usage)", jsKisim.includes("const OLCUM_KAYITLARI = [") && olcumBlok.includes("Paseo 35195156") && olcumBlok.includes("sureSn: 270") && olcumBlok.includes("sureSn: 450") && olcumBlok.includes("sureSn: 168") && olcumBlok.includes("usageIn: 106098") && olcumBlok.includes("usageIn: 78936"));
  ok("HARD KAPI: ölçüm kayıtlarında puan alanı YOK (blok ayrıştı + puan kelimesi yok)", !!olcumBlok && !/\bpuan\b/.test(olcumBlok));
  ok("HARD KAPI: olcumHesapla puan ÜRETMEZ (yalnız süre/test/usage alanları)", !!hesapGovde && !/\bpuan\b/.test(hesapGovde));
  ok("hard kapı beyanı ekranda (puanı ajan YAZAMAZ — yalnız ölçüm kaynağından)", jsKisim.includes("puanı ajan YAZAMAZ — yalnız ölçüm kaynağından türetilir"));
  ok("veri yoksa dürüst «ölçüm yok» (E10 — üretim YOK)", jsKisim.includes("ölçüm yok — bu ajanın modeline bağlı run kartı kaydı yok"));
  ok("trend yalnız >= 2 kayıttan (tek ölçümde trend ÜRETİLMEZ)", jsKisim.includes("sureler.length >= 2 ? sureler[sureler.length - 1] - sureler[0] : null"));
  ok("İYİLEŞME YOLU ölçümden türetilir; veri yoksa ÜRETİLMEZ", jsKisim.includes('kSatir("İYİLEŞME YOLU"') && jsKisim.includes("veri yok — İYİLEŞME YOLU satırı ölçümden türetilir; veri yoksa ÜRETİLMEZ"));
  ok("hız üstünlüğü iddiası YOK (tek ölçüm dürüst notu)", jsKisim.includes("P2 ~2,7 kat hızlı görünüyor — TEK ölçüm, üstünlük iddiası YOK"));
  ok("model eşleşmesi kapsayıcı (iki yön indexOf)", jsKisim.includes("function olcumEsles(") && jsKisim.includes("km.indexOf(m) > -1 || m.indexOf(km) > -1"));
  ok("her ölçüm satırı «kayıtlı» etiketli (canlı değil)", (jsKisim.match(/etiketOrnek">kayıtlı/g) || []).length >= 6);
  ok("sürekli ölçüm hattı K8-3 beyanı (bu dalgada üretim YOK)", jsKisim.includes("Sürekli ölçüm hattı K8-3"));
});

test("43- K8-2a O3 AJAN KARTI: kimlik · kısıtlar (E11 dürüstlük) · aktif görevler (ters arama) · performans (O2)", () => {
  const htmlKisim = htmlKisimOf();
  const jsKisim = jsKisimOf();
  ok("filo + kart kabukları (ajanFilo role=list + ajanKarti aria-live)", /id="ajanFilo"[^>]*role="list"/.test(htmlKisim) && /id="ajanKarti"[^>]*aria-live="polite"/.test(htmlKisim));
  ok("ajan iki kaynaktan bulunur (kosanPaseo + ornek — ajanBul)", jsKisim.includes("function ajanBul(") && jsKisim.includes("D.ajanlar.kosanPaseo.find") && jsKisim.includes("D.ajanlar.ornek.find"));
  ok("koşan paseo kısıtları dürüst (izin/limit alanı yok — uydurulmaz E11)", jsKisim.includes("kayıt yok — koşan paseo kaydında izin/limit alanı yoktur, uydurulmaz (E11)"));
  ok("örnek ajan kısıtları gerçek alanlardan (izin.dizin · limit.esZamanli · dolu · roller)", jsKisim.includes("a.izin && Array.isArray(a.izin.dizin)") && jsKisim.includes("a.limit && a.limit.esZamanli != null") && jsKisim.includes('kSatir("dolu", grafMetin(a.dolu))') && jsKisim.includes("a.roller"));
  ok("aktif görevler atama haritasından TERS arama (Object.entries)", jsKisim.includes("function ajanGorevleri(") && jsKisim.includes("Object.entries(grafAtamaDurum.harita)"));
  ok("atanmamış dürüstlüğü (atama haritasında kayıt yok)", jsKisim.includes("atama haritasında kayıt yok — atanmamış"));
  ok("filo fail-closed: 4930 yoksa banner + boş envanterde sabit ajan ÜRETİLMEZ", /function ajanFiloYaz\(\)[^]{0,400}deneyOluBanner\(\)/.test(jsKisim) && jsKisim.includes("sabit ajan ÜRETİLMEZ (fail-closed; E11)"));
  ok("filo satırları düğme + delege (data-ajan-filo)", jsKisim.includes('data-ajan-filo="') && jsKisim.includes('closest("[data-ajan-filo]")'));
  ok("ajan kartı performans yüzü taşır (performansHtml(a.model))", jsKisim.includes("performansHtml(a.model)"));
  ok("koşan GERÇEK / örnek ÖRNEK etiket ayrımı (E11)", /bul\.tur === "kosan"/.test(jsKisim) && jsKisim.includes("GERÇEK — 4930"));
  ok("kart × kapat düğmesi kablolı (ajanKartiKapat)", jsKisim.includes('id="ajanKartiKapat"') && jsKisim.includes('$("ajanKartiKapat").addEventListener'));
});

test("44- K8-2a G11 OLAY KAPSAM KATMANI: rozet [SİSTEM]/[PROJE: ordu]/[GRAF] + defter filtresi + açık sınıflandırma", () => {
  const htmlKisim = htmlKisimOf();
  const jsKisim = jsKisimOf();
  ok("rozet sınıfları mevcut paletten (dkRozet nötr/teal/yesil — yeni renk YOK)", jsKisim.includes('const KAPSAM_SINIF = { SISTEM: "dkRozet", GRAF: "dkRozet yesil", PROJE: "dkRozet teal" };'));
  ok("rozet metinleri (SİSTEM · GRAF · PROJE: ordu)", jsKisim.includes('const KAPSAM_AD = { SISTEM: "SİSTEM", GRAF: "GRAF", PROJE: "PROJE: ordu" };'));
  ok("olay sınıflandırması KODDA açık (OLAY_KAPSAM — merge/tip/spawn-olcum/ajan-atama/manager-yanit)", jsKisim.includes("const OLAY_KAPSAM = {") && jsKisim.includes('merge: "GRAF"') && jsKisim.includes('tip: "SISTEM"') && jsKisim.includes('"spawn-olcum": "SISTEM"') && jsKisim.includes('"ajan-atama": "PROJE"') && jsKisim.includes('"manager-yanit": "PROJE"'));
  ok("bilinmeyen olay güvenli tarafta SİSTEM (fallback)", jsKisim.includes('OLAY_KAPSAM[String(tur || "")] || "SISTEM"'));
  ok("kayıt olay alanı (KAYITLAR sınıflandırılabilir)", jsKisim.includes('olay: "merge"') && jsKisim.includes('olay: "tip"') && jsKisim.includes('olay: "kapanis"') && jsKisim.includes('olay: "spawn-olcum"') && jsKisim.includes('olay: "karar"'));
  ok("insan satırı rozetli, makine satırı saf JSONL kalır (çift yazım YOK)", /function kayitDok\([^)]*\)[^]{0,500}kapsamRozeti\(kayitKapsami\(k\)\) \+ " " \+ k\.i/.test(jsKisim));
  const sistem = (htmlKisim.match(/\[SİSTEM\]/g) || []).length;
  const proje = (htmlKisim.match(/\[PROJE: ordu\]/g) || []).length;
  const graf = (htmlKisim.match(/\[GRAF\]/g) || []).length;
  ok("statik rozetler: run + onay kartları + filtre başlıkları (6 SİSTEM · 2 PROJE · 2 GRAF)", sistem === 6 && proje === 2 && graf === 2, "S/P/G: " + sistem + "/" + proje + "/" + graf);
  ok("her run kartının başlığında rozet var (run-id → dkRozet bitişikliği ×4)", (htmlKisim.match(/run-id">[^<]+<\/span><span class="dkRozet/g) || []).length === 4);
  ok("her onay kartının başlığında rozet var (onay-id → dkRozet bitişikliği ×3)", (htmlKisim.match(/onay-id">[^<]+<\/span><span class="dkRozet/g) || []).length === 3);
  ok("defter başlığı kapsam filtresi (3 modBtn: tümü/sistem/proje)", !!tagOf("kapsam-tumu") && !!tagOf("kapsam-sistem") && !!tagOf("kapsam-proje") && htmlKisim.includes("KAPSAM: TÜMÜ") && htmlKisim.includes("YALNIZ SİSTEM") && htmlKisim.includes("YALNIZ BU PROJE"));
  ok("filtre kalıcı (localStorage tuval-defterKapsam — kaydet + oku)", jsKisim.includes('kaydet("tuval-defterKapsam"') && jsKisim.includes('oku("tuval-defterKapsam")'));
  ok("filtre davranışı: sistem→yalnız SİSTEM; proje→PROJE+GRAF", jsKisim.includes("function kapsamGoster(k)") && jsKisim.includes('if (defterKapsam === "sistem") return k === "SISTEM";') && jsKisim.includes('if (defterKapsam === "proje") return k === "PROJE" || k === "GRAF";'));
  ok("defteriCiz filtre uygular + gizli kayıt sayısı dürüst belirtilir", /function defteriCiz\(\)[^]{0,600}kapsamGoster\(kayitKapsami\(k\)\)/.test(jsKisim) && jsKisim.includes("kapsam filtresi: ' + gizli + ' kayıt gizli"));
  ok("G10a seçimi filtreyle senkron (seçim değişince defter yeniden çizilir)", /function projeSecDegistir\([^)]*\)[^]{0,700}defteriCiz\(\)/.test(jsKisim));
  ok("3 filtre düğmesi kablolı (click dinleyicileri)", jsKisim.includes('$("kapsam-tumu").addEventListener("click"') && jsKisim.includes('$("kapsam-sistem").addEventListener("click"') && jsKisim.includes('$("kapsam-proje").addEventListener("click"'));
  ok("görev tablosu son-olay hücresi rozetli (kapsamRozeti(son.kapsam))", jsKisim.includes("kapsamRozeti(son.kapsam)"));
});

test("45- K8-2a R3 + çevre sözleşmesi: yeni CSS mevcut tokenlarla (hex/transition/800 YOK) · 44px · radius ölçeği · E9 id'leri", () => {
  const jsKisim = jsKisimOf();
  const a = SRC.indexOf("/* ---- K8 DALGA 2a");
  const b = SRC.indexOf("/* ---- SAĞ (#sag)");
  const yeniCss = a > 0 && b > a ? SRC.slice(a, b) : "";
  ok("K8-2a CSS bloğu ayrıştırılabilir (marker'dan marker'a)", !!yeniCss);
  ok("yeni kurallarda hex renk YOK (yalnız var() + mevcut palet rgba)", !/#{3}[0-9a-fA-F]{3,6}\b/.test(yeniCss));
  ok("yeni kurallarda transition YOK (E12 animasyon kümesi büyümez)", !yeniCss.includes("transition"));
  ok("yeni kurallarda font-weight:800 YOK (700 disiplini)", !yeniCss.includes("font-weight:800"));
  ok("radius tokenları (var(--radius) + var(--radius-k))", yeniCss.includes("var(--radius)") && yeniCss.includes("var(--radius-k)"));
  ok("44px dokunma (min-height:var(--min-dokunma) — projeBtn/projeSecenek/gorevSatir)", (yeniCss.match(/min-height:var\(--min-dokunma\)/g) || []).length >= 3);
  ok("[hidden] açık kural ile ezilmez (.projeListe[hidden] display:none)", yeniCss.includes(".projeListe[hidden] { display:none; }"));
  ok("dar ekran: tablo başlığı gizlenir + satır 2 kolona akar (639px)", (mediaBlok("max-width:639px") || "").includes(".gorevTabloBas { display:none; }") && (mediaBlok("max-width:639px") || "").includes(".gorevSatir { grid-template-columns:1fr 1fr;"));
  const idler = [...new Set((jsKisim.match(/\$\("([^"]+)"\)/g) || []).map((s) => s.slice(3, -2)))];
  for (const id of ["projeSecici", "projeListe", "projeRozet", "kapsam-tumu", "kapsam-sistem", "kapsam-proje", "projeOzet", "gorevTablosu", "gorevDetay", "gorevDetayKapat", "ajanFilo", "ajanKarti", "ajanKartiKapat", "denetimMerkez"]) {
    ok('E9: JS id="' + id + '" kaynakta birebir var', idler.includes(id) && SRC.includes('id="' + id + '"'));
  }
  ok("E9: denetimMerkez HTML+CSS+JS üçlüsü (dkListe sınıfı + $('denetimMerkez'))", /id="denetimMerkez"[^>]*class="dkListe"/.test(SRC) && jsKisim.includes('$("denetimMerkez")'));
  ok("yüz sınıflarının CSS kuralı var (projeKutu/projeBtn/projeListe/projeSecenek/gorevTabloBas/gorevSatir + dkRozet.uyari)", [".projeKutu", ".projeBtn", ".projeListe", ".projeSecenek", ".gorevTabloBas", ".gorevSatir"].every((s) => yeniCss.includes(s + " {")) && /\.dkRozet\.uyari\s*\{[^}]*var\(--uyari\)/.test(SRC));
});

test("46- K8-2a D DENETİM MERKEZİ (emir 2026-11-01): kayıtlı performans + güvenlik durumu — canlı uç YOK, her değer «kayıtlı»", () => {
  const htmlKisim = htmlKisimOf();
  const jsKisim = jsKisimOf();
  ok("yüz statik HTML'de (dkBolumBas başlığı — kayıtlı — canlı değil)", htmlKisim.includes("D · DENETİM MERKEZİ — performans + güvenlik durumu (kayıtlı — canlı değil)"));
  ok("yüz kabuğu + JS kablolı (denetimMerkezYaz + açılışta çağrılır)", jsKisim.includes("function denetimMerkezYaz(") && jsKisim.includes('$("denetimMerkez")') && jsKisim.includes("denetimMerkezYaz();"));
  ok("PERFORMANS: son kayıtlı test koşumları (tuval ×2 · graf-yaz · graf-yonetim — kapanış koşumu ×3)", jsKisim.includes('sonuc: "47/47 ×2 bağımsız"') && jsKisim.includes('ad: "graf-yaz süiti", sonuc: "7/7"') && jsKisim.includes('ad: "graf-yonetim süiti", sonuc: "32/32"') && (jsKisim.match(/kaynak: "K8-2a kapanış koşumu — 2026-11-01/g) || []).length === 3);
  ok("PERFORMANS: tam core süiti ÖLÇÜLMÜŞ değer (467/467 · 0 kırmızı · 62,3 sn — kayıtlı 2026-11-01)", jsKisim.includes('sonuc: "467/467 · 0 kırmızı · 62,3 sn"') && jsKisim.includes("ölçümlü koşum — 2026-11-01 kayıtlı"));
  ok("PERFORMANS → O2 bağlantısı (AJAN FİLOSU + bilgi düğmesi data-not — E7 kablolı)", jsKisim.includes("O2 kayıtlı ölçümleri — AJAN FİLOSU") && /data-not="O2 · AJAN PERFORMANS YÜZÜ/.test(jsKisim) && jsKisim.includes('closest("[data-not]")'));
  const kapBloku = (() => { const a = jsKisim.indexOf("const GUVENLIK_KAPILARI = ["); const b = jsKisim.indexOf("];", a); return a >= 0 && b > a ? jsKisim.slice(a, b) : ""; })();
  ok("GÜVENLİK: §H envanteri 7 satır (her satır durum rozetli)", !!kapBloku && (kapBloku.match(/durum: "/g) || []).length === 7);
  ok("GÜVENLİK: durum taksonomisi VAR/KISMI/EKSIK/YENI", ["VAR", "KISMI", "EKSIK", "YENI"].every((d) => kapBloku.includes('durum: "' + d + '"')));
  ok("GÜVENLİK: her satır kaynak referansı (plan §H + bağımsız denetçi raporu)", jsKisim.includes("kaynak: plans/K8-DALGA2-PLANI-2026-10-31.md §H · bağımsız kod-doğrulaması ayrı raporda (raporlar/gelen-kutu/GUVENLIK-DENETCI-2026-11-01.md)"));
  ok("GÜVENLİK: satır anahtar kelimeleri (PANO_TOKEN fail-closed · insan:web · write-set whitelist · Ajanlar commit ATMAZ · puanı AJAN YAZAMAZ)", kapBloku.includes("PANO_TOKEN fail-closed 403/401") && kapBloku.includes("insan:web") && kapBloku.includes("write-set whitelist") && kapBloku.includes("Ajanlar commit ATMAZ") && kapBloku.includes("puanı AJAN YAZAMAZ"));
  ok("rozet sınıfları mevcut paletten (yesil/nötr/uyari/teal — KAPI_DURUM_SINIF)", jsKisim.includes('const KAPI_DURUM_SINIF = { VAR: "dkRozet yesil", KISMI: "dkRozet", EKSIK: "dkRozet uyari", YENI: "dkRozet teal" };'));
  ok("saglik.ps1 kayıtlı sonucu (17 OK · 1 EKSIK CODEMAP taze · 2 SARI kural-proxy/31 GECTI_HERMETIC)", jsKisim.includes("const SAGLIK_KAYDI = { ok: 17, eksik: 1, sari: 2") && jsKisim.includes("CODEMAP taze") && jsKisim.includes("kural-proxy 41 satır hedef <40") && jsKisim.includes("31 GECTI_HERMETIC"));
  ok("etiket dürüstlüğü: KAYITLI — canlı değil (footer beyanı)", jsKisim.includes("Bu merkez KAYITLI değerleri gösterir — canlı değil"));
  ok("canlı koşum uçları EKLENMEDİ (POST /api/denetim K8-2b — fetch/deneyPost YOK, yalnız metin beyanı)", !jsKisim.includes('fetch("/api/denetim') && !jsKisim.includes('deneyPost("/api/denetim') && jsKisim.includes("POST /api/denetim/*"));
});

test("47- K8-2a GD-009/010 denetçi bulguları: döngüsel tam-yeniden-çizim YOK (JSON-imza) + DAG düğüm tıklaması TEK delege", () => {
  const jsKisim = jsKisimOf();
  ok("imza deposu + karşılaştırıcı (veriImza Map + veriDegisti)", jsKisim.includes("const veriImza = new Map();") && jsKisim.includes("function veriDegisti("));
  ok("imza JSON dizesinden (JSON.stringify)", /function veriDegisti\([^)]*\)[^]{0,300}JSON\.stringify/.test(jsKisim));
  ok("string'e dökülemeyen veri güvenli tarafta ÇİZİLİR (catch → true)", /function veriDegisti\([^)]*\)[^]{0,400}catch \(e\) \{ return true; \}/.test(jsKisim));
  ok("deney döngüsü dirty-check (deneyYukle → veriDegisti(\"deney\", D))", /function deneyYukle\(\)[^]{0,900}veriDegisti\("deney", D\)/.test(jsKisim));
  ok("graf döngüsü dirty-check (yukle → veriDegisti(\"graf\", G))", /async function yukle\(\)[^]{0,900}veriDegisti\("graf", G\)/.test(jsKisim));
  ok("atama döngüsü dirty-check + zorla bayrağı (TASLAK/ONAY/ikon bypass ×3)", /function atamaDurumYukle\([^)]*\)[^]{0,700}!zorla && !veriDegisti\("atama", grafAtamaDurum\)/.test(jsKisim) && (jsKisim.match(/atamaDurumYukle\(true\)/g) || []).length === 3);
  ok("kırmızı yüz imzayı geçersiz kılar (kurtulan graf mutlaka yeniden çizilir)", /function kirmiziYuz\([^)]*\)[^]{0,300}veriImza\.delete\("graf"\)/.test(jsKisim));
  ok("deney POST borusu PANO_TOKEN başlığı taşır (4930 uçları — BAKIM-YAZICI GD-001/002 ile eş zamanlı, atama deseni)", /async function deneyPost\([^)]*\)[^]{0,300}PANO_TOKEN girin \(üst bardaki alan\)/.test(jsKisim) && /async function deneyPost\([^)]*\)[^]{0,500}X-Pano-Token/.test(jsKisim) && !/console\.(log|info|warn|error)\([^)]*token/.test(jsKisim));
  ok("düğüm başına click dinleyicisi YOK (querySelectorAll(.dugum).forEach bağlantısı kalktı)", !/querySelectorAll\("\.dugum"\)\.forEach\(\(n\) => n\.addEventListener\("click"/.test(jsKisim));
  ok("tuvalCiz artık dinleyici bağlamaz (GD-010 yorumu blokta)", jsKisim.includes("GD-010: düğüm başına click dinleyicisi BAĞLANMAZ"));
  ok("TEK delege svgEl'de (closest(.dugum) + tasindi korunur + sec(n.dataset.id, false, true))", /svgEl\.addEventListener\("click"[^]{0,260}closest\("\.dugum"\)/.test(jsKisim) && /svgEl\.addEventListener\("click"[^]{0,260}if \(tasindi\) return/.test(jsKisim) && jsKisim.includes("sec(n.dataset.id, false, true)"));
});
