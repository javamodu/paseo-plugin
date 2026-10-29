// DALGA0-ARAYUZ-1 — pano/kapsul-tuval.html kaynak-duzeyi iddialari (node --test).
// DOM render testi YOK; yeni bagimlilik YOK (yalniz node:test + node:fs + node:assert).
// Her vaka ADIYLA kirmiziya duser (fail-closed): iddia kaynakta yoksa assert o vakanin adiyle patlar.
import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

let SRC = "";
try {
  SRC = readFileSync(new URL("./kapsul-tuval.html", import.meta.url), "utf8");
} catch {
  SRC = ""; // kaynak okunamazsa tum vakalar kendi adlariyla kirmiziya duser
}
const ok = (msg, cond) => assert.ok(cond, "KAYNAKTA YOK — " + msg);

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
