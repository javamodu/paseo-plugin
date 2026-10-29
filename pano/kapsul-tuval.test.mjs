// DALGA-0-2 R2 TASARIM REVİZYONU — pano/kapsul-tuval.html kaynak-düzeyi iddiaları (node --test).
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
  ok("role=tab >= 4 (3 sabit sekme + JS görev-sekmesi şablonu)", tabSay >= 4, "bulunan: " + tabSay);
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
  const ornekli = ["kartlar", "onayBolum", "defterPanel", "denetimGecmis", "chatBolum"];
  for (const id of ornekli) {
    const t = tagOf(id);
    ok(id + " açılış etiketi bulundu", !!t);
    ok(id + " data-ornek taşır (kalp-yüzü)", !!t && t.includes("data-ornek"));
  }
  // K8 ADIM-B: sagOzet/sagKomut söküldü; yeni PROJE/API yüzleri GERÇEK (data-ornek TAŞIMAZ — 4930 verisi)
  const gercekli = ["agac", "detay", "tuval", "sol", "sagProje", "sagApi", "ajanListe", "saglayiciAlani"];
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

test("13- dış istek: /api/graf + /api/kart (4377) + DENEY_KOK 4930 uçları — başka ağ çağrısı YOK (chat fetch atmaz)", () => {
  const ayir = SRC.indexOf("<script>");
  const jsKisim = ayir > 0 ? SRC.slice(ayir) : SRC;
  ok('deney köprüsü sabiti (DENEY_KOK = "http://127.0.0.1:4930" — ADIM-A CORS)', jsKisim.includes('const DENEY_KOK = "http://127.0.0.1:4930"'));
  const cagrilar = jsKisim.match(/fetch\(([^)]{0,60})\)/g) || [];
  ok("en az 3 fetch çağrısı (graf + kart + deney durum)", cagrilar.length >= 3, "bulunan: " + cagrilar.length);
  for (const c of cagrilar) {
    ok("fetch yalnız izinli uç (pano veya izole deney): " + c.slice(0, 50), c.includes("/api/graf") || c.includes("/api/kart") || c.includes("DENEY_KOK"));
  }
  ok("deney uçları DENEY_KOK'tan kurulur (yol değişkeni — sabit URL dizilimi yok)", jsKisim.includes('DENEY_KOK + "/api/deney/durum"') && jsKisim.includes("DENEY_KOK + uc"));
  const dis = SRC.replace(/http:\/\/127\.0\.0\.1/g, "");
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
  ok('sabit sekme id\'leri (sek-harita/sek-defter/sek-run)', ["sek-harita", "sek-defter", "sek-run"].every((i) => SRC.includes('id="' + i + '"')));
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
  ok('chat görünür ŞABLON etiketi («ŞABLON — canlı AI yanıtı D-4»)', htmlKisim.includes("ŞABLON — canlı AI yanıtı D-4"));
  ok("chat JS tarafında da aynı etiket (CHAT_ETIKET)", jsKisim.includes('const CHAT_ETIKET = "ŞABLON'));
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
  ok("chat panel ÖRNEK-etiketli (data-ornek — etiketsiz sahte AI YASAK)", !!tChat && tChat.includes("data-ornek"));
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
  ok("chat koşmaz: chat bölümünde fetch YOK (yalnız sablon üretir)", !/chat[^]{0,400}fetch\(/.test(jsKisim));
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
  ok("statik sabit sekme sayısı 3 (harita/defter/run)", sabit === 3, "bulunan: " + sabit);
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
