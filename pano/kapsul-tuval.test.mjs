// DALGA-0-2 — pano/kapsul-tuval.html kaynak-duzeyi iddialari (node --test).
// DALGA-0-ARAYUZ-1 mirasi: ilk 8 vaka KORUNUR (esik gevsetilmez); 9-16 yeni (drawer,
// iki temel, ORNEK-etiket sistemi, kopyala/EK-2, dis-fetch, reduced-motion, emoji,
// viewBox zoom/pan). DOM render testi YOK; yeni bagimlilik YOK (yalniz node:test +
// node:fs + node:assert). Her vaka ADIYLA kirmiziya duser (fail-closed).
import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

let SRC = "";
try {
  SRC = readFileSync(new URL("./kapsul-tuval.html", import.meta.url), "utf8");
} catch {
  SRC = ""; // kaynak okunamazsa tum vakalar kendi adlariyla kirmiziya duser
}
const ok = (msg, cond, detay) => assert.ok(cond, "KAYNAKTA YOK — " + msg + (detay ? " (" + detay + ")" : ""));

// "@media ... kosul ..." sorgusunun govdesini suslu-parantez eslesmesiyle ceker (ic ice bloklar dahil).
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

// id'li elemanin ACILIS etiketini dondurur (tek satirlik etiket; kapanis haric).
function tagOf(id) {
  const m = SRC.match(new RegExp('<[^<>]*id="' + id + '"[^<>]*>'));
  return m ? m[0] : null;
}

test("1- viewport meta mevcut (mobil genislik sabiti)", () => {
  ok('<meta name="viewport" etiketi', SRC.includes('<meta name="viewport"'));
  ok('viewport content="width=device-width', /<meta\s+name="viewport"\s+content="width=device-width/.test(SRC));
});

test("2- dar ekran (max-width:768px) tek sutun: liste ustte, detay listeyi takip eder, tuval altta", () => {
  const b = mediaBlok("768px");
  ok("@media (max-width:768px) blogu", !!b);
  ok("main flex-direction:column", b.includes("flex-direction:column"));
  ok("#orta display:contents (cocuklar main flex ogesi olur)", b.includes("display:contents"));
  ok("#sol order:1 — gorev listesi ustte", /#sol\s*\{[^}]*order:1/.test(b));
  ok("#detay order:2 — detay listeyi takip eder", /#detay\s*\{[^}]*order:2/.test(b));
  ok("#tuvalSarma order:3 — SVG tuval altta", /#tuvalSarma\s*\{[^}]*order:3/.test(b));
  ok("#sag order:4 — sohbet en altta", /#sag\s*\{[^}]*order:4/.test(b));
});

test("3- dokunma hedefleri >= 44x44px (min-height/min-width CSS kurali)", () => {
  ok(".satir (gorev satiri) min-height:44px", /\.satir\s*\{[^}]*min-height:\s*44px/.test(SRC));
  ok(".modlar button + #yenile min-height:44px", /\.modlar button[^{]*\{[^}]*min-height:\s*44px/.test(SRC));
  ok(".modlar button + #yenile min-width:44px", /\.modlar button[^{]*\{[^}]*min-width:\s*44px/.test(SRC));
  ok("#kartBtn min-height:44px (CSS'ten; kart ucu markup'ina dokunulmadan)", /#kartBtn\s*\{[^}]*min-height:\s*44px/.test(SRC));
  ok(".satir tam genislik (width:100%)", /\.satir\s*\{[^}]*width:\s*100%/.test(SRC));
});

test("4- faz-gruplu sol agac: g.faz okunur + (faz yok) dali; durum rengi satirda kaldi", () => {
  ok('kaynak gorev-basi "faz" alanini okur (g.faz)', SRC.includes("g.faz"));
  ok('"(faz yok)" sabit dizgisi (fazsiz gorev grubu) var', SRC.includes('"(faz yok)"'));
  ok("eski durum-sira dizisi kaldirildi (gruplama artik faz uzerinden)", !SRC.includes("const sira = ["));
  ok("durum rengi satirlarda kaldi (DURUMRENK[d] kullanimi)", SRC.includes("DURUMRENK[d]"));
  ok("uydurma faz YOK: sabit faz listesi tanimlanmamis", !/const FAZLAR|FAZ_SIRA/.test(SRC));
});

test("5- korunan cekirdek etiketleri: kirmiziYuz + iki yuz + sec + kartBtn", () => {
  ok("kirmiziYuz (fail-closed yuz) fonksiyonu", SRC.includes("function kirmiziYuz("));
  ok("İNSAN OKUR dugme etiketi", SRC.includes("İNSAN OKUR"));
  ok("MAKİNE OKUR dugme etiketi", SRC.includes("MAKİNE OKUR"));
  ok("modUygula (iki yuz ayni fetch'ten)", SRC.includes("function modUygula("));
  ok("sec (detay tablosu) fonksiyonu", SRC.includes("function sec("));
  ok("kartBtn (kart icerik butonu id)", SRC.includes("kartBtn"));
  ok("KAPSÜL KARTI OLUŞTUR dugme etiketi", SRC.includes("KAPSÜL KARTI OLUŞTUR"));
});

test("6- sozlesme: /api/graf fetch'i + POST /api/kart + 30 sn tazelik + dongude-cizilmez", () => {
  ok('fetch("/api/graf") degismedi', SRC.includes('fetch("/api/graf")'));
  ok('POST /api/kart ucu (fetch("/api/kart") degismedi)', SRC.includes('fetch("/api/kart"'));
  ok("30 sn auto-refresh (setInterval yukle)", SRC.includes("setInterval(yukle, 30_000)"));
  ok("yerlesim dongu kurali (islenen !== G.gorevler.length)", SRC.includes("islenen !== G.gorevler.length"));
});

test("7- click temelli etkilesim: hover'a bagli eylem YOK", () => {
  const tik = (SRC.match(/addEventListener\("click"/g) || []).length;
  ok("en az 5 click dinleyicisi (satir/dugum/modlar/yenile/kart)", tik >= 5, "bulunan click sayisi: " + tik);
  ok("mouseover dinleyicisi yok", !SRC.includes('addEventListener("mouseover"'));
  ok("mouseenter dinleyicisi yok", !SRC.includes('addEventListener("mouseenter"'));
  ok("touchstart dinleyicisi yok (tiklama zaten click temelli)", !SRC.includes('addEventListener("touchstart"'));
});

test("8- DOM iskelet id'leri korunur (sol/orta/tuval/detay/sag/modlar/token)", () => {
  for (const id of ["sol", "orta", "tuvalSarma", "tuval", "jsonview", "detay", "sag", "mInsan", "mMakine", "yenile", "token", "hata"]) {
    ok('id="' + id + '" mevcut', SRC.includes('id="' + id + '"'));
  }
});

test("9- drawer kaynak-isaretleri: hamburger + aria-expanded senkronu + Esc + perde + 1023/1024 kirilimi", () => {
  ok('hamburger/cekmece dugmesi (id="cekmeceBtn")', SRC.includes('id="cekmeceBtn"'));
  ok('cekmece aria-expanded ilk deger ("false")', /id="cekmeceBtn"[^>]*aria-expanded="false"/.test(SRC));
  ok("aria-expanded senkron fonksiyonu (drawerDurumYaz)", SRC.includes("function drawerDurumYaz("));
  ok('aria-expanded runtime guncellemesi (setAttribute("aria-expanded"))', SRC.includes('setAttribute("aria-expanded"'));
  ok('Escape kapatma dinleyicisi (e.key === "Escape")', SRC.includes('e.key === "Escape"'));
  ok('overlay perde elemani (id="perde")', SRC.includes('id="perde"'));
  ok('perde tikla-kapat dinleyicisi (JS kaynaginda)', SRC.includes('$("perde").addEventListener("click"'));
  ok('drawer kapatma dugmesi (id="drawerKapa")', SRC.includes('id="drawerKapa"'));
  const genis = mediaBlok("min-width:1024px");
  ok("@media (min-width:1024px) blogu (drawer sabit sutun)", !!genis);
  ok("genis ekranda kapanis (body.drawer-kapali #sol display:none)", /body\.drawer-kapali\s+#sol\s*\{[^}]*display:\s*none/.test(genis || ""));
  const dar = mediaBlok("max-width:1023px");
  ok("@media (max-width:1023px) blogu (drawer overlay)", !!dar);
  ok("overlay kaydirma (transform:translateX(-103%))", (dar || "").includes("translateX(-103%)"));
  ok("body.drawer-acik ile acilis (transform:none)", /body\.drawer-acik\s+#sol\s*\{[^}]*transform:\s*none/.test(dar || ""));
  ok("body scroll kilidi (body.drawer-acik overflow:hidden)", /body\.drawer-acik\s*\{[^}]*overflow:\s*hidden/.test(dar || ""));
});

test("10- iki temel: IZLE/DENETLE/YONET nav + gorev agaci -> detay karti + kalp yuzu bilesenleri", () => {
  ok('IZLE sekmesi (data-panel="panel-izle")', SRC.includes('data-panel="panel-izle"'));
  ok('DENETLE sekmesi (data-panel="panel-denetle")', SRC.includes('data-panel="panel-denetle"'));
  ok('YONET sekmesi (data-panel="panel-yonet")', SRC.includes('data-panel="panel-yonet"'));
  ok("sekme etiketleri (IZLE/DENETLE/YONET metinleri)", SRC.includes(">İZLE<") && SRC.includes(">DENETLE<") && SRC.includes(">YÖNET<"));
  ok("panel gizle/goster (hidden senkronu)", SRC.includes("p.hidden = p.id !== hedef"));
  ok('detay karti kabugu (id="detay")', SRC.includes('id="detay"'));
  ok("bagimlilik cipleri (bagimliChip + data-gec)", SRC.includes("bagimliChip") && SRC.includes("data-gec"));
  ok('cipe dokunma zinciri gezinir: sec(dep) isleyicisi', SRC.includes('closest(".bagimliChip[data-gec]")'));
  ok('ordu seridi (id="orduSeridi")', SRC.includes('id="orduSeridi"'));
  ok("ordu seridi rolleri graf SSOT'tan uretir (G.roller)", SRC.includes("Object.keys(G.roller)"));
  ok('kanit defteri govdesi (id="defterGovde" + role="log")', SRC.includes('id="defterGovde"') && SRC.includes('role="log"'));
  ok('komut kutusu girisi (id="komut")', SRC.includes('id="komut"'));
  ok('GENEL STATE seridi (id="rozetler" + role="status")', SRC.includes('id="rozetler"') && SRC.includes('role="status"'));
  ok('onay bolumu (id="onayBolum")', SRC.includes('id="onayBolum"'));
  const olum = (SRC.match(/data-not="/g) || []).length;
  ok("olu dugme YOK: pasif dugmeler data-not ile bilgilendirir (>= 6)", olum >= 6, "bulunan: " + olum);
});

test("11- ORNEK-etiket sistemi: kalp-yuzu etiketli, graf-yuzu etiketsiz", () => {
  ok('durusluk seridi (class="serit")', SRC.includes('class="serit"'));
  ok('serit beyani "gercek bag D-2" icerir', SRC.includes("gerçek bağ D-2"));
  const ornekli = ["orduSeridi", "kartlar", "onayBolum", "defterPanel", "komutKutusu", "denetimVeri", "sablonListe"];
  for (const id of ornekli) {
    const t = tagOf(id);
    ok(id + " acilis etiketi bulundu", !!t);
    ok(id + " data-ornek tasir (kalp-yuzu)", !!t && t.includes("data-ornek"));
  }
  const gercekli = ["agac", "detay", "rozetler", "tuval", "sol"];
  for (const id of gercekli) {
    const t = tagOf(id);
    ok(id + " acilis etiketi bulundu", !!t);
    ok(id + " data-ornek TASIMAZ (graf-yuzu)", !!t && !t.includes("data-ornek"));
  }
  const etiket = (SRC.match(/class="etiketOrnek"/g) || []).length;
  ok("gorunur ORNEK rozeti >= 8 adet", etiket >= 8, "bulunan: " + etiket);
});

test("12- kopyala + EK-2: onay cumlesi STATIK HTML'de — GUI'de uretilmez/calistirilmaz", () => {
  const ayir = SRC.indexOf("<script>");
  const htmlKisim = ayir > 0 ? SRC.slice(0, ayir) : "";
  const jsKisim = ayir > 0 ? SRC.slice(ayir) : SRC;
  ok("panoya kopyala fonksiyonu (panoaYaz + navigator.clipboard)", SRC.includes("function panoyaYaz(") && SRC.includes("navigator.clipboard"));
  const kopya = (SRC.match(/data-kopyala="/g) || []).length;
  ok("data-kopyala dugmeleri (>= 3)", kopya >= 3, "bulunan: " + kopya);
  ok('onay cumlesi STATIK HTML parcasi (REPLAN ONAYLIYORUM)', htmlKisim.includes("REPLAN ONAYLIYORUM"));
  ok("onay cumlesi JS'te URETILMEZ (kopyalanabilir sabit disi yok)", !jsKisim.includes("REPLAN ONAYLIYORUM"));
  ok("JS'te --confirm dizgisi YOK (onay komutu kurgulanmaz)", !jsKisim.includes("--confirm"));
  ok('komut kutusu Enter -> yalniz panoyaYaz(tam) (olay.key !== "Enter" beklemesi)', SRC.includes('olay.key !== "Enter"') && SRC.includes("panoyaYaz(tam)"));
});

test("13- dis istek yalniz /api/graf + /api/kart — baska ag cagrisi YOK", () => {
  const ayir = SRC.indexOf("<script>");
  const jsKisim = ayir > 0 ? SRC.slice(ayir) : SRC;
  const cagrilar = jsKisim.match(/fetch\(([^)]{0,60})\)/g) || [];
  ok("en az 2 fetch cagrisi (graf + kart)", cagrilar.length >= 2, "bulunan: " + cagrilar.length);
  for (const c of cagrilar) {
    ok("fetch yalniz pano ucu: " + c.slice(0, 50), c.includes("/api/graf") || c.includes("/api/kart"));
  }
  const dis = SRC.replace(/http:\/\/127\.0\.0\.1/g, "");
  ok("CDN/webfont/dis URL YOK (yalniz 127.0.0.1 istisnasi)", !/https?:\/\//.test(dis));
});

test("14- prefers-reduced-motion: animasyon/akis kapanir", () => {
  const b = mediaBlok("prefers-reduced-motion: reduce");
  ok("@media (prefers-reduced-motion: reduce) blogu", !!b);
  ok("animation: none !important", (b || "").includes("animation: none !important"));
  ok("transition: none !important", (b || "").includes("transition: none !important"));
});

test("15- emoji YOK (inline SVG ikon + sistem font stack; eski kilit karakteri kalkti)", () => {
  const emoji = SRC.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu) || [];
  ok("kaynakta emoji karakteri yok", emoji.length === 0, "bulunan: " + emoji.length);
  ok("webfont/CDN YOK (system-ui font stack)", SRC.includes("system-ui"));
  ok("eski kilit karakteri kaldirildi (K rozeti kaldi)", !SRC.includes("🔒"));
});

test("16- DAG: viewBox zoom/pan (tekerlek + surukle + pinch) — dongude-cizilmez korunur", () => {
  ok("zoomAt (viewBox odakli zoom)", SRC.includes("function zoomAt("));
  ok("sigdir (tum grafigi sigdir)", SRC.includes("function sigdir("));
  ok("enBoyDuzelt (rect=0 tuzagina karsi koruma)", SRC.includes("function enBoyDuzelt("));
  ok("vbUygula (viewBox uygular)", SRC.includes("function vbUygula("));
  ok("tekerlek zoom dinleyicisi (passive:false + preventDefault)", /addEventListener\("wheel"[^]{0,160}preventDefault/.test(SRC));
  ok('surukleme pan (pointerdown + pointermove)', SRC.includes('addEventListener("pointerdown"') && SRC.includes('addEventListener("pointermove"'));
  ok("pinch zoom (2 isaretci mesafesi — pinchUzak)", SRC.includes("pinchUzak"));
  ok("pointer-capture API'si KULLANILMAZ (click olumu tuzagi)", !SRC.includes("setPointerCapture"));
  ok("zoom dugmeleri (zIn/zOut/zFit/z100)", ["zIn", "zOut", "zFit", "z100"].every((i) => SRC.includes('id="' + i + '"')));
  ok("drag sonrasi tiklama yutulmaz (tasindi bayragi ile tiklama korunur)", SRC.includes("tasindi"));
});
