// DALGA-0-2 R1 DÜZELTME — pano/kapsul-tuval.html kaynak-düzeyi iddiaları (node --test).
// Miras: 1-9 (dar-ekran kalıbı 2 R1 tek-akış sırasına güncellendi; eşik gevşetilmedi),
// 10 DÖNÜŞTÜRÜLDÜ (İZLE/DENETLE/YÖNET varlığı → tablist=0 + tek-akış), 11 güncellendi
// (chatBolum + denetimGecmis ÖRNEK kabı), 12-16 korunur. YENİ: 17 denetim-kanıtı-inline,
// 18 katlanır-DAG, 19 GENEL STATE hep-görünür, 20 E7 ölü-buton-yok, 21 E8 44px çipler,
// 22 E9 id-class birebir, 23 E10 SSOT sayı, 24 E11 uydurma-veri-yok, 25 E12 animasyon,
// 26 AI CHAT (EK-ŞART 14:03). DOM render testi YOK; yeni bağımlılık YOK (yalnız
// node:test + node:fs + node:assert). Her vaka ADIYLA kırmızıya düşer (fail-closed).
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

test("2- dar ekran (max-width:768px) tek kolon: R1 TEK AKIŞ sırası (kapsül kartı → harita → run → onay → defter → şablon)", () => {
  const b = mediaBlok("768px");
  ok("@media (max-width:768px) bloğu", !!b);
  ok("main flex-direction:column", b.includes("flex-direction:column"));
  ok("#orta display:contents ( çocuklar main flex öğesi olur)", b.includes("display:contents"));
  ok("#sol order:1 — drawer (bu aralıkta overlay: akış-dışı)", /#sol\s*\{[^}]*order:1/.test(b));
  ok("#detay order:2 — kapsül kartı (denetim kanıtı inline) ilk görsel blok", /#detay\s*\{[^}]*order:2/.test(b));
  ok("#haritaBolum order:3 — katlanır DAG", /#haritaBolum\s*\{[^}]*order:3/.test(b));
  ok("#runBolum order:4 — run kartları", /#runBolum\s*\{[^}]*order:4/.test(b));
  ok("#onayBolum order:5 — onay-bekleyenler", /#onayBolum\s*\{[^}]*order:5/.test(b));
  ok("#defterBolum order:6 — kanıt defteri", /#defterBolum\s*\{[^}]*order:6/.test(b));
  ok("#sablonBolum order:7 — komut şablonları", /#sablonBolum\s*\{[^}]*order:7/.test(b));
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
  ok("30 sn auto-refresh (setInterval yukle)", SRC.includes("setInterval(yukle, 30_000)"));
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
  ok("geniş ekranda kapanış (body.drawer-kapali #sol display:none)", /body\.drawer-kapali\s+#sol\s*\{[^}]*display:\s*none/.test(genis || ""));
  const dar = mediaBlok("max-width:1023px");
  ok("@media (max-width:1023px) bloğu (drawer overlay)", !!dar);
  ok("overlay kaydırma (transform:translateX(-103%))", (dar || "").includes("translateX(-103%)"));
  ok("body.drawer-acik ile açılış (transform:none)", /body\.drawer-acik\s+#sol\s*\{[^}]*transform:\s*none/.test(dar || ""));
  ok("body scroll kilidi (body.drawer-acik overflow:hidden)", /body\.drawer-acik\s*\{[^}]*overflow:\s*hidden/.test(dar || ""));
});

test("10- R1 TEK AKIŞ: İZLE/DENETLE/YÖNET sekmeleri YOK (tablist=0) + tek-akış bileşenleri var", () => {
  // sekme mekaniği TAMAMEN kaldırıldı (kullanıcı: «izle denetle yönet diye ayrı ayrı buton… daha user dostu»)
  ok('role="tablist" YOK (tablist=0)', !SRC.includes('role="tablist"'));
  ok('role="tab" YOK', !/role="tab"/.test(SRC));
  ok("aria-selected YOK", !SRC.includes("aria-selected"));
  ok("sekme() fonksiyonu YOK", !SRC.includes("function sekme("));
  ok("edimTab sınıfı YOK", !SRC.includes("edimTab"));
  ok('data-panel bağlantısı YOK', !SRC.includes("data-panel"));
  ok("panel-izle / panel-denetle / panel-yonet YOK", !SRC.includes("panel-izle") && !SRC.includes("panel-denetle") && !SRC.includes("panel-yonet"));
  ok("edimPanel sınıfı YOK", !SRC.includes("edimPanel"));
  // tek akışın bileşenleri (eski vakanın varlık kontrolleri evrildi — eşik düşürülmedi)
  ok('detay kartı kabuğu (id="detay")', SRC.includes('id="detay"'));
  ok("bağımlılık çipleri (bagimliChip + data-gec)", SRC.includes("bagimliChip") && SRC.includes("data-gec"));
  ok('çipe dokunma zincirde gezinir: sec(dep) işleyicisi', SRC.includes('closest(".bagimliChip[data-gec]")'));
  ok('ordu şeridi (id="orduSeridi")', SRC.includes('id="orduSeridi"'));
  ok("ordu şeridi rolleri graf SSOT'tan üretir (G.roller)", SRC.includes("Object.keys(G.roller)"));
  ok('kanıt defteri gövdesi (id="defterGovde" + role="log")', SRC.includes('id="defterGovde"') && SRC.includes('role="log"'));
  ok('komut kutusu girişi (id="komut")', SRC.includes('id="komut"'));
  ok('GENEL STATE şeridi (id="rozetler" + role="status")', SRC.includes('id="rozetler"') && SRC.includes('role="status"'));
  ok('onay bölümü (id="onayBolum")', SRC.includes('id="onayBolum"'));
  ok('run kartları bölümü (id="runBolum")', SRC.includes('id="runBolum"'));
  ok('kanıt defteri bölümü (id="defterBolum")', SRC.includes('id="defterBolum"'));
  const olum = (SRC.match(/data-not="/g) || []).length;
  ok("ölü düğme YOK: pasif düğmeler data-not ile bilgilendirir (>= 6)", olum >= 6, "bulunan: " + olum);
});

test("11- ÖRNEK-etiket sistemi: kalp-yüzü etiketli (chat dahil), graf-yüzü etiketsiz", () => {
  ok('dürüstlük şeridi (class="serit")', SRC.includes('class="serit"'));
  ok('şerit beyanı "gerçek bağ D-2" içerir', SRC.includes("gerçek bağ D-2"));
  const ornekli = ["orduSeridi", "kartlar", "onayBolum", "defterPanel", "komutKutusu", "sablonListe", "denetimGecmis", "chatBolum"];
  for (const id of ornekli) {
    const t = tagOf(id);
    ok(id + " açılış etiketi bulundu", !!t);
    ok(id + " data-ornek taşır (kalp-yüzü)", !!t && t.includes("data-ornek"));
  }
  const gercekli = ["agac", "detay", "rozetler", "tuval", "sol"];
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
  ok("data-kopyala düğmeleri (>= 3)", kopya >= 3, "bulunan: " + kopya);
  ok("onay cümlesi STATİK HTML parçası (REPLAN ONAYLIYORUM)", htmlKisim.includes("REPLAN ONAYLIYORUM"));
  ok("onay cümlesi JS'te ÜRETİLMEZ (kopyalanabilir sabit dışı yok)", !jsKisim.includes("REPLAN ONAYLIYORUM"));
  ok("JS'te --confirm dizgisi YOK (onay komutu kurgulanmaz)", !jsKisim.includes("--confirm"));
  ok('komut kutusu Enter -> yalnız panoaYaz(tam) (olay.key !== "Enter" beklemesi)', SRC.includes('olay.key !== "Enter"') && SRC.includes("panoyaYaz(tam)"));
});

test("13- dış istek yalnız /api/graf + /api/kart — başka ağ çağrısı YOK (chat fetch atmaz)", () => {
  const ayir = SRC.indexOf("<script>");
  const jsKisim = ayir > 0 ? SRC.slice(ayir) : SRC;
  const cagrilar = jsKisim.match(/fetch\(([^)]{0,60})\)/g) || [];
  ok("en az 2 fetch çağrısı (graf + kart)", cagrilar.length >= 2, "bulunan: " + cagrilar.length);
  for (const c of cagrilar) {
    ok("fetch yalnız pano ucu: " + c.slice(0, 50), c.includes("/api/graf") || c.includes("/api/kart"));
  }
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
  ok("pointer-capture API'si KULLANILMAZ (click ölümü tuzağı)", !SRC.includes("setPointerCapture"));
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
  ok('kanal geçmişi defter bölümünde (id="denetimGecmis" + kanal·a3/a02/a03 satırları)', SRC.includes('id="denetimGecmis"') && SRC.includes("kanal·a3") && SRC.includes("kanal·a02") && SRC.includes("kanal·a03"));
});

test("18- R1: «Görev haritası» KATLANIR DAG bölümü (aria-expanded + rect=0 ölçüm-düzeltme)", () => {
  ok('haritaBolum bölümü (id="haritaBolumn" değil — id="haritaBolum")', SRC.includes('id="haritaBolum"'));
  ok('katlama düğmesi (id="haritaKatla")', SRC.includes('id="haritaKatla"'));
  const t = tagOf("haritaKatla");
  ok("haritaKatla aria-controls=haritaGovde", !!t && t.includes('aria-controls="haritaGovde"'));
  ok("haritaKatla ilk aria-expanded=true (varsayılan açık)", !!t && t.includes('aria-expanded="true"'));
  ok("haritaGovde arclar+tuvalSarma'yı sarar (kaynak sırası)", SRC.indexOf('id="haritaGovde"') < SRC.indexOf('class="arclar"') && SRC.indexOf('class="arclar"') < SRC.indexOf('id="tuvalSarma"'));
  ok("haritaGovde katlanınca ölçüm-düzeltme: haritaGovdeAc içinde enBoyDuzelt()+vbUygula()", /function haritaGovdeAc\(\)[^]{0,220}enBoyDuzelt\(\);\s*vbUygula\(\)/.test(SRC));
  ok("katlaBtn 44px (min-height:var(--min-dokunma))", /\.katlaBtn\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok('katlama tıklama dinleyicisi (haritaKatla.addEventListener("click"))', SRC.includes('haritaKatla.addEventListener("click"'));
  ok("düğme metni senkronu (haritaKatla.textContent =)", SRC.includes("haritaKatla.textContent ="));
  ok('drawer «görev haritası» bağlantısı (data-zipla="haritaBolum")', SRC.includes('data-zipla="haritaBolum"'));
  ok('haritaSayi sayacı (id="haritaSayi") + kirmiziYuz\'ta «—» reseti', SRC.includes('id="haritaSayi"') && SRC.includes('$("haritaSayi").textContent = "—"'));
});

test("19- R1: GENEL STATE + ordu şeridi main'den ÖNCE — tek akışta hep görünür", () => {
  const mainIdx = SRC.indexOf("<main>");
  ok("<main> bulundu", mainIdx > 0);
  ok("rozetler (GENEL STATE) main'den önce", SRC.indexOf('id="rozetler"') < mainIdx);
  ok("ordu şeridi main'den önce", SRC.indexOf('class="orduSeridi"') < mainIdx);
  ok("rozetler role=status (canlı sayım alanı)", SRC.includes('id="rozetler"') && SRC.includes('role="status"'));
  const t = tagOf("orduSeridi");
  ok("ordu şeridi gizli değil (hidden yok — hep görünür)", !!t && !t.includes("hidden"));
  ok("GENEL STATE aria etiketi", SRC.includes("GENEL STATE"));
  ok("ordu şeridi rolleri G.roller'dan sayılır (statik rol sayısı YOK)", SRC.includes("Object.keys(G.roller)") && !/ordu şeridi — \d+ rol/.test(SRC));
});

test("20- E7 ölü-buton YOK: statik her düğme kablolı (kanca veya JS referansı)", () => {
  const ayir = SRC.indexOf("<script>");
  const htmlKisim = ayir > 0 ? SRC.slice(0, ayir) : "";
  const jsKisim = ayir > 0 ? SRC.slice(ayir) : SRC;
  const dugmeler = htmlKisim.match(/<button[^>]*>/g) || [];
  ok("statik düğme sayısı >= 12", dugmeler.length >= 12, "bulunan: " + dugmeler.length);
  for (const d of dugmeler) {
    const idM = d.match(/id="([^"]+)"/);
    const kanca = /data-(not|kopyala|zipla|sec|mod|gec|id|chat-komut)="/.test(d);
    const ref = idM && jsKisim.includes('$("' + idM[1] + '")');
    const formKablolu = d.includes('type="submit"') && jsKisim.includes('$("chatForm").addEventListener("submit"');
    ok("düğme kablolı: " + d.slice(0, 70), kanca || !!ref || !!formKablolu);
  }
  // JS-doğumlu düğmeler de kablolı (delege + doğrudan dinleyici)
  ok('delege: görev fişi (closest(".fisKopyala"))', jsKisim.includes('closest(".fisKopyala")'));
  ok('delege: dispatch şablonu (closest(".dispatchKopyala"))', jsKisim.includes('closest(".dispatchKopyala")'));
  ok('delege: tuvalde bul (closest(".tuvaldeBul"))', jsKisim.includes('closest(".tuvaldeBul")'));
  ok('kart düğmesi doğrudan dinleyicili ($("kartBtn").addEventListener)', jsKisim.includes('$("kartBtn").addEventListener'));
  ok('chat şablon-kopyala düğmeleri doğrudan dinleyicili (querySelectorAll(".chatKopyala"))', jsKisim.includes('querySelectorAll(".chatKopyala, .chatPlanKopyala")'));
  ok("JS-doğumlu ordu çipleri data-not taşır (bilgilendirir)", jsKisim.includes('class="orduChip"') && jsKisim.includes('data-not="'));
});

test("21- E8 44px tutarlılığı: çipler + chat + katlama dahil (global button kuralı)", () => {
  ok("global button kuralı: min-height:var(--min-dokunma)", /(^|\s)button\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("bagimliChip <button doğar (global 44px kuralından yararlanır)", SRC.includes('<button class="bagimliChip"'));
  ok("orduChip <button doğar (global 44px kuralından yararlanır)", SRC.includes('<button class="orduChip"'));
  ok("katlaBtn 44px", /\.katlaBtn\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("drawerKapa 44px (36px→44px düzeltmesi)", /\.drawerKapa\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("ziplink 44px", /\.ziplink\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("chatGiris (input) 44px", /\.chatGiris\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("chatGonder 44px", /\.chatGonder\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("buyuk-btn 44px", /\.buyuk-btn\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
  ok("komut-giris 44px", /\.komut-giris\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(SRC));
});

test("22- E9 id/class birebir: JS'in beklediği her id CSS+HTML'de var; yeni sınıfların CSS kuralı var", () => {
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
  const siniflar = ["katlaBtn", "bolumBas", "kartBolumBas", "chatBolum", "chatListe", "chatForm", "chatGiris", "chatGonder", "chatMesaj", "chatKomutSatir", "chatPlan", "chatSabit", "defterBolum", "sablonBolum", "onayBolum"];
  for (const s of siniflar) {
    ok("." + s + " CSS kuralı var", new RegExp("\\." + s + "\\s*\\{").test(SRC));
    ok("." + s + " kullanımda (HTML veya JS şablonu)", SRC.includes('class="' + s) || SRC.includes('"chatMesaj chat-') || SRC.includes('"kayit acik"'));
  }
  ok("#denetimGecmis CSS kuralı var (id-selector)", /#denetimGecmis\s*\{/.test(SRC));
});

test("23- E10 SSOT sayı tutarlılığı: gösterilen her sayı G'den sayılır, statik sayı YOK", () => {
  const ayir = SRC.indexOf("<script>");
  const htmlKisim = ayir > 0 ? SRC.slice(0, ayir) : SRC;
  const jsKisim = ayir > 0 ? SRC.slice(ayir) : SRC;
  ok("haritaSayi graf SSOT'tan: görev+kenar sayısı", jsKisim.includes('G.gorevler.length + " görev · " + G.kenarlar.length'));
  ok("agacSayi graf SSOT'tan: G.gorevler.length", jsKisim.includes('$("agacSayi").textContent = G.gorevler.length + " görev"'));
  ok("durum kök sayımı G.gorevler üzerinden (kok[k])", jsKisim.includes("kok[k] = (kok[k] || 0) + 1"));
  ok("İNSAN-kapılı sayısı filter ile sayılır", jsKisim.includes('g.kapi && String(g.kapi).indexOf("[INSAN]")'));
  ok("AKTİF sayısı filter ile sayılır", jsKisim.includes("G.gorevler.filter((g) => g.aktif)"));
  ok("haritaSayi statik yer tutucu «—» (sayı yazılmaz)", /<span id="haritaSayi">—<\/span>/.test(SRC));
  ok("agacSayi statik yer tutucu «—» (sayı yazılmaz)", /<span id="agacSayi">—<\/span>/.test(SRC));
  ok("statik HTML'de sabit görev sayısı YOK (40 görev vb.)", !/>\s*\d+\s*görev/.test(htmlKisim));
  ok("seritte sayım iddiası YOK (yalnız kaynak beyanı)", !/class="serit"[^]{0,600}\d+ görev/.test(SRC));
});

test("24- E11 uydurma-veri YOK: her kalp-yüzü kabı ÖRNEK/ŞABLON-etiketli + kaynak beyanlı", () => {
  const ayir = SRC.indexOf("<script>");
  const htmlKisim = ayir > 0 ? SRC.slice(0, ayir) : SRC;
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
  ok("transition beyanı >= 3 (drawer/pe/toast/kart/chat)", gecisler.length >= 3, "bulunan: " + gecisler.length);
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

test("26- AI CHAT (EK-ŞART 14:03): drawer üst paneli + ŞABLON-KOMUT ÜRETİCİ + kopyala (EK-2)", () => {
  const ayir = SRC.indexOf("<script>");
  const htmlKisim = ayir > 0 ? SRC.slice(0, ayir) : SRC;
  const jsKisim = ayir > 0 ? SRC.slice(ayir) : SRC;
  // drawer düzeni: chat ÜSTTE, görev ağacı ALTTA (ikisi de drawer içinde)
  const solIdx = SRC.indexOf('<nav id="sol"');
  const chatIdx = SRC.indexOf('id="chatBolum"');
  const agacIdx = SRC.indexOf('id="agac"');
  const ortaIdx = SRC.indexOf('<section id="orta"');
  ok("drawer içinde chat-üst/ağaç-alt düzeni", solIdx < chatIdx && chatIdx < agacIdx && agacIdx < ortaIdx);
  // panel bileşenleri
  ok('mesaj listesi (id="chatListe" + role="log" + aria-live)', htmlKisim.includes('id="chatListe"') && htmlKisim.includes('role="log"') && htmlKisim.includes('aria-live="polite"'));
  ok('girdi (id="chatGiris" type="text")', /id="chatGiris"[^>]*type="text"/.test(htmlKisim));
  ok('gönder düğmesi (id="chatGonder" type="submit")', /id="chatGonder"[^>]*type="submit"/.test(htmlKisim));
  ok('chat formu (id="chatForm")', htmlKisim.includes('id="chatForm"'));
  ok('chat panel ÖRNEK-etiketli (data-ornek — etiketsiz sahte AI YASAK)', tagOf("chatBolum").includes("data-ornek"));
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
