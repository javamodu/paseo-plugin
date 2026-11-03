// ORDU KOMUTA PANELI TESTI — pano/ordu-panosu.html + pano/ordu-kadro.json +
// pano/ordu-birlesim.mjs (operator spec 2026-11-01 + spec guncellemesi 17:5x).
// Hermetik: server BASLATILMAZ (gorev siniri — izole sayfa/kadro/veri birlesim
// fonksiyonlari sinanir); disk dosyalari DEGISMEZ; tmp fixture'lar mkdtempSync ile
// izole. Uc katman: (1) kaynak-pin iddialari — HTML yuz sozlesmesi fail-closed;
// (2) vm ile sayfa fonksiyonlarinin DAVRANISI (esc/fazGruplari/durumSinifi/kiraEtiketi);
// (3) ordu-birlesim.mjs modul vakalari (kadro sema + kira canlilik + akis siralama +
// graf sayim + saglik isigi + durust null'lar). Kaynak okunamazsa her vaka KENDI
// adiyla kirmiziya duser (fail-closed). Yorumlar ASCII (gorev talimati).
// KOSEK: node --test pano/ordu-panosu.test.mjs (repo kokunden).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import {
  kadroDogrula, kiraEtiketi, kadroBirlesim, aktifIsOku, defterOzet, gitHeadOku,
  akisBirlestir, handoffOlaylari, kiraOlaylari, defterKayitlari, akisTopla,
  saglikBirlesim, enOlduruculer, frenSayilari, sorunBirlesim, genelSaglikIsigi, grafSayim,
  kisaAjanId, kuyrukOku, ajanEslemeKur, logBirlesik, projelerTara, sonDamgaSatiri,
} from "./ordu-birlesim.mjs";

const KOK = fileURLToPath(new URL(".", import.meta.url));
let HTML = "";
let KADRO = null;
try { HTML = readFileSync(new URL("./ordu-panosu.html", import.meta.url), "utf8"); } catch { HTML = ""; }
try { KADRO = JSON.parse(readFileSync(new URL("./ordu-kadro.json", import.meta.url), "utf8")); } catch { KADRO = null; }
const ok = (msg, cond, detay) => assert.ok(cond, "KAYNAKTA YOK — " + msg + (detay ? " (" + detay + ")" : ""));
const jsKisim = () => { const a = HTML.indexOf("<script>"); return a > 0 ? HTML.slice(a) : HTML; };
const htmlKisim = () => { const a = HTML.indexOf("<script>"); return a > 0 ? HTML.slice(0, a) : ""; };

// Kaynaktan fonksiyon govdesini suslu-parantez eslesmesiyle ceker (ic ice bloklar dahil)
// ve vm'de ifade olarak kosturur — sayfa fonksiyonlari server'siz test edilir.
function fnAl(ad) {
  const m = HTML.indexOf("function " + ad + "(");
  ok("sayfada fonksiyon var: " + ad, m >= 0);
  if (m < 0) return null;
  const ac = HTML.indexOf("{", m);
  let der = 1, j = ac + 1;
  while (j < HTML.length && der > 0) {
    if (HTML[j] === "{") der++;
    else if (HTML[j] === "}") der--;
    j++;
  }
  ok("fonksiyon govdesi tam: " + ad, der === 0);
  return vm.runInNewContext("(" + HTML.slice(m, j) + ")", {});
}

const tempKok = () => mkdtempSync(join(tmpdir(), "ordu-panosu-"));

/* ===================== (0) TUM SCRIPT PARSE — butun-script söz dizimi ===================== */
// Regresyon: 2026-11-01 canli tarayici bulgusu — genelYukle icinde 1 fazla kapanis parantezi
// (satir 513) TUM script'i oldurdu; sayfa fail-closed yuzde kaldi, hicbir fetch atilmadi.
// fnAl() fonksiyon-BASI ceker — butun-script hatasini goremez; bu vaka vm.Script ile
// TAM script'i derler (yalniz parse, kosturulmaz — disk/sunucu dokunulmaz).
test("0- tum inline script vm.Script ile PARSE olur (canli SyntaxError regresyonu — satir 513 fazla parantez)", () => {
  const a = HTML.indexOf("<script>");
  const b = HTML.indexOf("</script>");
  ok("script etiketleri var", a > 0 && b > a);
  const kod = HTML.slice(a + "<script>".length, b);
  assert.doesNotThrow(() => new vm.Script(kod), "inline script parse EDILMELI — SyntaxError canli sayfayi oldurur (fetch'ler hic atilmaz)");
});

/* ===================== (1) HTML yuz sozlesmesi — kaynak-pin ===================== */

test("1- bes bolum + iki alt-bolum (spec guncellemesi: ORDU bolumu 2b'ye birlesti; BOLUM 6 LOG eklendi)", () => {
  ok('bolum-genel', HTML.includes('id="bolum-genel"'));
  ok('bolum-plan', HTML.includes('id="bolum-plan"'));
  ok('bolum-akis', HTML.includes('id="bolum-akis"'));
  ok('bolum-saglik', HTML.includes('id="bolum-saglik"'));
  ok('bolum-log (BOLUM 6 spec eki)', HTML.includes('id="bolum-log"'));
  ok("ayri ORDU bolumu YOK (2b'de birlesik)", !HTML.includes('id="bolum-ordu"'));
  ok("bolum etiket metinleri (h2 govdesinde)", /GENEL DURUM\s*<\/h2/.test(HTML) && /PLAN\s*<\/h2/.test(HTML) && /AKIŞ\s*<\/h2/.test(HTML) && /SİSTEM SAĞLIĞI\s*<\/h2/.test(HTML) && /LOG\s*<\/h2/.test(HTML));
  ok("(a) FAZ/SPRINT alt-basligi", HTML.includes("(a) FAZ/SPRINT PLAN TABLOSU"));
  ok("(b) GOREV GRAF + ORDU alt-basligi", HTML.includes("(b) GÖREV GRAF + ORDU"));
  ok("(b) alt-baslik cizim yok beyani (CSS satirlari)", HTML.includes("dalga görünümü (CSS satırları; çizim yok)"));
  const genelIdx = HTML.indexOf('id="bolum-genel"');
  const planIdx = HTML.indexOf('id="bolum-plan"');
  const akisIdx = HTML.indexOf('id="bolum-akis"');
  const sagIdx = HTML.indexOf('id="bolum-saglik"');
  const logIdx = HTML.indexOf('id="bolum-log"');
  ok("siralama basitten karmasiga: genel < plan < akis < saglik < log", genelIdx < planIdx && planIdx < akisIdx && akisIdx < sagIdx && sagIdx < logIdx);
});

test("2- GEZGİN AĞACI (FAZ-B): SOL kolon = projeler + konuşmalar; üstteki select KALDIRILDI (tek seçim yolu ağaç)", () => {
  /* --- KALDIRILANLAR (bilinçli: ağaç tek seçim yolu — çift kaynak yasak) --- */
  ok("üstteki proje select KALDIRILDI", !HTML.includes('id="projeSec"') && !HTML.includes('id="projeGrup"'));
  ok("proje durum kartı bölümü KALDIRILDI (tablo ORTA sekmeye taşındı)", !HTML.includes('id="bolum-projekart"') && !HTML.includes('id="projeKartIci"'));
  ok("gorunumDegistir ikili modu KALDIRILDI", !jsKisim().includes("function gorunumDegistir("));
  /* --- YENİ: gezgin ağacı kabuğu --- */
  ok("SOL = GEZGİN (bolum-agac + h2 GEZGİN)", HTML.includes('id="bolum-agac"') && /GEZGİN\s*<\/h2/.test(HTML));
  ok("ağaç kapları: agacAlani + agacOzet + agacHata (fail-closed kırmızı yüz)", HTML.includes('id="agacAlani"') && HTML.includes('id="agacOzet"') && HTML.includes('id="agacHata"'));
  ok("ağaç CSS sınıfları (agac/agacProje/agacAjan/agacCocuklar)", /\.agac\s*\{/.test(HTML) && /\.agacProje\s*\{/.test(HTML) && /\.agacAjan\s*\{/.test(HTML) && /\.agacCocuklar\s*\{/.test(HTML));
  ok("ağaç düğümü KOMPAKT ~28px (steering 2026-11-03; eski 44px pin BİLİNÇLİ değişti)", /\.agacProjeBas\s*\{[^}]*min-height:\s*28px/.test(HTML) && /\.agacAjan\s*\{[^}]*min-height:\s*28px/.test(HTML));
  ok("durum noktası sınıfları: running yesil · idle gri · error kirmizi · closed KAPALI-soluk", jsKisim().includes('const NOKTA_SINIF = { running: "yesil", idle: "gri", error: "kirmizi", closed: "kapali" }') && /\.nokta\.kapali\s*\{[^}]*opacity:\s*0\.45/.test(HTML));
  /* --- kalıcılık: ordu-agac-* anahtarları (ordu-solW/sagW ile ÇAKIŞMAZ) --- */
  const j = jsKisim();
  ok("akordiyon kalıcı: ordu-agac-acik", j.includes('kaydet("ordu-agac-acik"') && j.includes('oku("ordu-agac-acik")'));
  ok("seçili düğüm kalıcı: ordu-agac-secili", j.includes('kaydet("ordu-agac-secili"') && j.includes('oku("ordu-agac-secili")'));
  ok("tuval/panel genişlik anahtarlarıyla çakışma YOK", !HTML.includes("tuval-solW") && !HTML.includes("tuval-sagW"));
  /* --- davranış: proje tıkla → akordiyon + sekme; ajan tıkla → seçili konuşma --- */
  ok("proje düğümüne tıkla → akordiyon AÇ/KAPA + sekme açılır", j.includes("agacAcik.has(dizin)") && j.includes("sekmeAc(dizin)"));
  ok("ajan düğümüne tıkla → seçili konuşma + composer hedefi", j.includes("agacSecili = ajanDugumu.dataset.ajan") && j.includes("konusmaSecGuncelle()"));
  ok("ağaç etiketi esc() ile taşınır (ham title — XSS yükü zararsız)", j.includes("esc(a.etiket)"));
  ok("ajan kimliği TAM uuid'yle data-ajan'da (whitelist gönderim hedefi) + 8 hane görünüde", j.includes('data-ajan="\' + esc(a.ajanKimligi)') && j.includes("a.ajanId || kisaIdGoster(a.ajanKimligi)"));
  ok("dürüst satır: doğmamış workspace görünmez (ağaçta taşındı)", HTML.includes("ajanı hiç doğmamış workspace bu kaynakta GÖRÜNMEZ"));
  ok("tarama ölürse ağacın KENDİ kırmızı yüzü (agacHata + P=null)", j.includes('kirmiziYuzGoster("agacHata", "agacAlani"') && j.includes("P = null"));
});

test("3- esc() birebir korunur + tum dinamik metin esc'ten gecer", () => {
  ok("esc fonksiyonu satiri", HTML.includes('function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }'));
  ok("esc sayfada cagriliyor (kaynakta kullanım)", (jsKisim().match(/esc\(/g) || []).length >= 20, "bulunan esc() cagrisi: " + (jsKisim().match(/esc\(/g) || []).length);
});

test("4- fail-closed: her veri kaynaginin kendi kirmizi yuzu + VERI OKUNAMADI", () => {
  ok("kirmiziYuzGoster fonksiyonu", HTML.includes("function kirmiziYuzGoster("));
  ok("kirmizi yuz metni VERİ OKUNAMADI", HTML.includes("VERİ OKUNAMADI"));
  for (const id of ["genelHata", "planHata", "orduHata", "akisHata", "saglikHata", "logHata", "projeHata"]) {
    ok('id="' + id + '" kirmizi yuz', HTML.includes('id="' + id + '"'));
  }
  const uyari = (htmlKisim().match(/role="alert"/g) || []).length;
  ok("role=alert >= 7 (bolum basina bir yuz)", uyari >= 7, "bulunan: " + uyari);
  ok("hata yuzunde bayat veri kalmaz (icerik innerHTML bosaltilir)", jsKisim().includes('$(icerikId).innerHTML = ""'));
});

test("5- 30 sn yenileme + uc sabitleri (mevcut /api/graf aynen)", () => {
  ok("YENILE_SN = 30", jsKisim().includes("const YENILE_SN = 30;"));
  ok("setInterval(hepsiniYukle, YENILE_SN * 1000)", jsKisim().includes("setInterval(hepsiniYukle, YENILE_SN * 1000);"));
  const uclar = ["/api/ordu/genel", "/api/ordu/kadro", "/api/ordu/akis", "/api/ordu/saglik", "/api/ordu/log", "/api/ordu/projeler", "/api/graf"];
  for (const u of uclar) ok("uc sabiti: " + u, jsKisim().includes('"' + u + '"'));
  const cagrilar = (jsKisim().match(/cek\(UC\.\w+/g) || []).length;
  ok("7 cek cagrisi (kaynak basina bir; log ucu query tasiyabilir)", cagrilar === 7, "bulunan: " + cagrilar);
  ok("hepsiniYukle dongude logYukle'yi de ceker", jsKisim().includes("saglikYukle(); logYukle();"));
  ok("hepsiniYukle projelerYukle'i da ceker (STEERING-7 taramasi yenilenir)", jsKisim().includes("logYukle(); projelerYukle();"));
});

test("6- BOLUM 1 semsiye: en buyuk sorunlar + saglik isigi + cozum yollari + graf sayimi/ilerleme", () => {
  const j = jsKisim();
  for (const id of ["genelSorunlar", "genelIsik", "genelCozum", "grafDurum"]) ok('semsiye alani id="' + id + '"', HTML.includes('id="' + id + '"'));
  ok("sorun kartlari (v.sorun.enOldurucu okunur)", j.includes("sorun.enOldurucu"));
  ok("saglik isigi sunucu olcumunden (v.saglikIsigi)", j.includes("v.saglikIsigi"));
  ok("cozum yollari (fixKuyrugu)", j.includes("fixKuyrugu"));
  ok("graf sayimi (v.grafSayim)", j.includes("v.grafSayim"));
  ok("siradaki 3 gorev (siradaki3)", j.includes("siradaki3"));
  ok("tamamlanma orani (tamamlanmaOrani)", j.includes("tamamlanmaOrani"));
  ok("test durumu olculmedi etiketi (uydurma yok)", j.includes('testDurumu || "ölçülmedi"'));
  ok("sorun okunamazsa durust bos satir (uydurma sorun listesi YOK)", j.includes("uydurma sorun listesi yazılmaz"));
});

test("7- (2a) faz gruplama: gercek g.faz alani + fazsiz durust grubu", () => {
  const j = jsKisim();
  ok("fazGruplari fonksiyonu", j.includes("function fazGruplari("));
  ok("g.faz gercek degerden okunur", j.includes("g.faz"));
  ok("'fazsız' durust grubu", j.includes('"fazsız"'));
  ok("faz baslik satiri: faz adi + gorev sayisi + aktif sayi", j.includes("fazBaslik") && j.includes("gr.aktifSayi"));
  ok("fazsizlar en sonda", j.includes('f !== "fazsız"'));
});

test("8- (2b) dalga gorunumu: CSS satirlari (canvas/SVG cizim YOK) + kutu + kompakt ajan karti", () => {
  const j = jsKisim();
  ok("canvas YOK", !HTML.includes("<canvas"));
  ok("SVG cizim API YOK (createElementNS)", !j.includes("createElementNS"));
  ok("dalga satiri CSS sinifi", /\.dalgaSatiri\s*\{/.test(HTML));
  ok("gorevKutu CSS sinifi", /\.gorevKutu\s*\{/.test(HTML));
  ok("kompakt ajan karti CSS sinifi", /\.ajanKart\s*\{/.test(HTML));
  ok("gorevKutusu uretici", j.includes("function gorevKutusu("));
  ok("cepheKutusu uretici", j.includes("function cepheKutusu("));
  ok("durum rengi eslemesi (durumSinifi)", j.includes("function durumSinifi("));
  ok("bagimli zincirleri satir ici '→' metni", j.includes('join(" → ")'));
  ok("KRITIK YOL satiri", j.includes("KRİTİK YOL"));
  ok("tam harita baglantisi /tuval", htmlKisim().includes('href="/tuval"') || j.includes('href="/tuval"'));
});

test("9- (2b) durustluk: ATANMADI etiketi + olculmedi + OLCUM kaynak beyani", () => {
  const j = jsKisim();
  ok("sorumlu ATANMADI etiketi", j.includes("sorumlu: ATANMADI"));
  ok("atanmis gorev eslemesi kadrodan (atanmisGorevler)", j.includes("atanmisGorevler"));
  ok("rol sablonu gosterimi (henüz canlı ajan yok)", j.includes("henüz canlı ajan yok"));
  ok("olculmedi etiketi (olcumu olmayan alan sayi gostermez)", j.includes(">ölçülmedi</span>"));
  ok("OLCUM cipi (olcumEtiket sinifi)", j.includes('class="olcumEtiket"') && /\.olcumEtiket\s*\{/.test(HTML));
  ok("olcum satiri kaynak beyani (kaynak:)", j.includes("<b>kaynak:</b>"));
  ok("gorev-basi sure olcumu yok beyani", j.includes("görev-başı süre ölçümü yok"));
  ok("denetci rolu TESTER (graf roller.yapar)", j.includes("TESTER (kanıtı diskten oku"));
  ok("kapi alanlari g'lerden okunur (g.kapi + kapiSozlesmesi)", j.includes("g.kapi") && j.includes("kapiSozlesmesi"));
  ok("ORDU CEPHESI satiri (graf disi canli hatlar)", j.includes("ORDU CEPHESİ"));
  ok("cephe alani kadrodan (b.cephe)", j.includes("b.cephe"));
});

test("10- TASARIM pinleri — KOMPAKT steering 2026-11-03 (baz 13px; §1 nefes maddesi kullanıcı steering'iyle GEÇERSİZ — koordinatör brief yetkisi; §4/§6/§7 AYNEN)", () => {
  ok("KOMPAKT baz 13px (BİLİNÇLİ: eski §1 16px — steering 2026-11-03)", /body\s*\{[^}]*font-size:\s*13px/.test(HTML));
  ok("KOMPAKT bolum-etiket 15px/600 (eski 20px — BİLİNÇLİ)", /\.bolum-etiket\s*\{[^}]*font-size:\s*15px/.test(HTML) && /\.bolum-etiket\s*\{[^}]*font-weight:\s*600/.test(HTML));
  ok("§2 tek viewport: body height:100vh + overflow:hidden (sutunlar kendi icinde kayar)", /body\s*\{[^}]*height:\s*100vh/.test(HTML) && /body\s*\{[^}]*overflow:\s*hidden/.test(HTML));
  ok("§4 light tema tokenlari", HTML.includes("--metin:#1a2332"));
  ok("§4 R3 token'lari birebir: yuzey2/yuzey3/glow", HTML.includes("--yuzey2:#eef2f7") && HTML.includes("--yuzey3:#e4eaf2") && HTML.includes("--glow:rgba(15,76,129,0.18)"));
  ok("§4 BEYAZ zemin (STEERING-8 mirasi)", /--zemin:\s*#ffffff/.test(HTML) && !HTML.includes("--zemin:#f4f6f9"));
  ok("KOMPAKT radius 6/4/4 (eski 8/6/4 — BİLİNÇLİ)", HTML.includes("--radius:6px") && HTML.includes("--radius-k:4px") && HTML.includes("--radius-cip:4px"));
  ok("KOMPAKT bolum padding 10px 12px (eski 22px 24px — BİLİNÇLİ)", /\.bolum\s*\{[^}]*padding:\s*10px 12px/.test(HTML));
  ok("KOMPAKT satir 1.4 (eski 1.5 — BİLİNÇLİ)", /body\s*\{[^}]*line-height:\s*1\.4/.test(HTML));
  ok("§2 main max-width 1760px (kapsul-tuval duzeni)", /main\s*\{[^}]*max-width:\s*1760px/.test(HTML));
  ok("§5 44px dokunma KALIR: composer girdileri (select/input); GÖNDER 40px KISAT alt sınırı + ağaç 28px KOMPAKT (BİLİNÇLİ)", HTML.includes("--min-dokunma:44px") && /#composerForm select, #composerForm input\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(HTML) && /#composerGonder\s*\{[^}]*min-height:\s*40px/.test(HTML));
  ok("§5 prefers-reduced-motion kapatir", HTML.includes("@media (prefers-reduced-motion: reduce)"));
  ok("§6 @keyframes YOK", !HTML.includes("@keyframes"));
  const gecisler = (HTML.match(/transition:\s*[^;}]+/g) || []).filter((g) => !/^transition:\s*none/.test(g));
  ok("§6 gecis beyani var (none kapatmasi tarama disi)", gecisler.length >= 1, "bulunan: " + gecisler.length);
  const IZINLI = ["color", "border-color", "background", "transform", "opacity"]; /* E12: anim/transform siniri */
  for (const g of gecisler) {
    const parcalar = g.replace(/^transition:\s*/, "").split(",");
    for (const p of parcalar) {
      const ozellik = p.trim().split(/\s+/)[0];
      ok("§6 gecis ozelligi E12 izinli (renk/transform/opacity): " + p.trim().slice(0, 40), IZINLI.includes(ozellik));
    }
  }
  ok("§7 title yalniz kimlik (graf surumu — sayac yok)", jsKisim().includes('document.title = "ORDU KOMUTA PANELİ — ordu graf "'));
  ok("§7 meta description (kimlik)", htmlKisim().includes('<meta name="description"'));
});

test("10b- STEERING-8 TEK BAKIS: ozet seridi (6 buyuk kart) + progressive disclosure", () => {
  const h = htmlKisim();
  const j = jsKisim();
  /* 6 kart KOMPAKT serit: id + rakam 22px/600 + etiket 11px (BİLİNÇLİ: eski 36/14px) */
  ok("ozetGrid alani", h.includes('id="ozetGrid"'));
  for (const id of ["ozetSaglik", "ozetGorev", "ozetCanli", "ozetSiradaki", "ozetGraf", "ozetDamga"]) {
    ok("ozet karti: " + id, h.includes('id="' + id + '"'));
  }
  ok("KOMPAKT rakam 22px/600 tek satir (eski 36px — BİLİNÇLİ)", /\.ozetDeger\s*\{[^}]*font-size:\s*22px/.test(HTML) && /\.ozetDeger\s*\{[^}]*font-weight:\s*600/.test(HTML));
  ok("KOMPAKT ozet etiketi 11px (eski 14px — BİLİNÇLİ)", /\.ozetEtiket\s*\{[^}]*font-size:\s*11px/.test(HTML));
  /* kart dolusu render-only: kaynak zaten var olan genel/kadro uc verisi (yeni fetch YOK) */
  ok("ozet degerleri genel ucunden (ozetYaz helper)", j.includes("function ozetYaz("));
  ok("canli ajan kadro birlesiminden", j.includes('b.canlilik && b.canlilik.canli'));
  ok("cekin sayisi DEGISMEDI (hala 7 — ozet seridi yeni fetch acmaz)", (j.match(/cek\(UC\./g) || []).length === 7);
  /* fail-closed: genel olunce bayat sayi ekranda kalmaz */
  ok("ozet kartlari fail-closed (catch icinde 'okunamadi')", j.includes('ozetYaz(id, "okunamadı")'));
  /* progressive disclosure: <details> KAPALI varsayilan (kaynakta open attribute YOK) */
  ok("<details> KAPALI varsayilan (open attribute YOK)", !/<details[^>]*\sopen[\s>]/.test(h));
  ok("LOG son 5 satir ACIK kalir (ACIK_SATIR = 5)", j.includes("ACIK_SATIR = 5") && h.includes('id="logAcik"'));
  ok("LOG kalan kayitlar details icinde", h.includes('id="logDetay"') && h.includes('id="logDetayOzet"'));
  /* bolum tek-ozet satirlari */
  for (const id of ["planOzet", "akisOzet", "saglikOzet", "logOzet"]) {
    ok("bolum ozet satiri: " + id, h.includes('id="' + id + '"'));
  }
  /* nefes: kart grid'i >=1024 2-3 kolon (auto-fit), alti tek kolon */
  ok("ozetGrid auto-fit kart grid'i", /\.ozetGrid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit/.test(HTML));
  ok("720px kirilimda tek kolon", /@media \(max-width:720px\)[\s\S]*?\.ozetGrid\s*\{[^}]*grid-template-columns:\s*1fr/.test(HTML));
  /* kadro karti: KOMPAKT ajan adi 14px (BİLİNÇLİ: eski STEERING-8 20px) + durum isigi + rol rozetleri gorunur */
  ok("KOMPAKT ajan adi 14px (.kutuKod — BİLİNÇLİ)", /\.kutuKod\s*\{[^}]*font-size:\s*14px/.test(HTML));
  ok("gorev emri + olcum + ajanId kutunun <details>'inda", /function cepheKutusu\([\s\S]*?kartDetay[\s\S]*?emirBlok/.test(j) || (j.includes('class="kartDetay"') && j.includes("emirBlok")));
  ok("rol rozetleri acik yuzde (cepheRolRozetleri)", j.includes("function cepheRolRozetleri("));
});

test("10c- BEYAZ zemin diger sayfalar (kapsul-tuval + iskelet — yalniz zemin/renk)", () => {
  const tuval = readFileSync(new URL("./kapsul-tuval.html", import.meta.url), "utf8");
  ok("kapsul-tuval zemin SAF BEYAZ", tuval.includes("--zemin:#ffffff"));
  ok("kapsul-tuval eski gri zemin kalkti", !tuval.includes("--zemin:#f4f6f9"));
  const iskelet = readFileSync(new URL("./iskelet.html", import.meta.url), "utf8");
  ok("iskelet body zemini SAF BEYAZ (beyaz uzerinde okunur koyu metin)", /body\s*\{[^}]*background:\s*#ffffff/.test(iskelet));
  ok("iskelet color-scheme light", iskelet.includes("color-scheme: light"));
});

test("10d- STEERING-9 uc-dikey-bolum iskeleti: 5-hucre grid + sekmeler + splitter + ordu-* localStorage (TABAN kapsul-tuval R3)", () => {
  const h = htmlKisim();
  const j = jsKisim();
  /* --- ana duzen: main grid 5 hucre (kapsul-tuval R2/R3 deseni birebir) --- */
  ok("main grid 5 kolon: solW · 6px · minmax(0,1fr) · 6px · sagW", /main\s*\{[^}]*grid-template-columns:\s*var\(--solW\)\s*6px\s*minmax\(0,\s*1fr\)\s*6px\s*var\(--sagW\)/.test(HTML));
  ok("KOMPAKT genislik degiskenleri: --solW 240px / --sagW 320px (eski 280/380 — BİLİNÇLİ)", HTML.includes("--solW:240px") && HTML.includes("--sagW:320px"));
  ok("grid-cocuklar ACIK kolonlara sabitlenir (kapali panel kaydirmaz — kapsul-tuval bug-fix deseni)", /main\s*>\s*#sol\s*\{\s*grid-column:\s*1\s*;?\s*\}/.test(HTML) && /main\s*>\s*#orta\s*\{\s*grid-column:\s*3\s*;?\s*\}/.test(HTML) && /main\s*>\s*#sag\s*\{\s*grid-column:\s*5\s*;?\s*\}/.test(HTML));
  ok("FAZ-B: ORDU-disi 1/-1 kart hucresi KALDIRILDI (kart → ORTA proje sekmesi tablosu)", !/#bolum-projekart\s*\{/.test(HTML));
  ok("[hidden] acik kurali (display kurallari ezmesin — kapsul-tuval deseni)", /\[hidden\]\s*\{\s*display:\s*none\s*!important/.test(HTML));
  ok("main overflow:hidden (kaydirma yalniz sutunlarda)", /main\s*\{[^}]*overflow:\s*hidden/.test(HTML));
  for (const id of ["sol", "orta", "sag", "splitSol", "splitSag"]) ok('kolon kabugu id="' + id + '"', h.includes('id="' + id + '"'));
  ok("#sol + #sag kendi icinde kayar (overflow-y:auto)", /#sol\s*\{[^}]*overflow-y:\s*auto/.test(HTML) && /#sag\s*\{[^}]*overflow-y:\s*auto/.test(HTML));
  /* --- ORTA (FAZ-B): ANA sekme şeridi (ORDU SABİT + proje sekmeleri X ile) + ALT şerit (5 sekme) --- */
  ok("#anaSekmeSerit role=tablist (ORDU sabit sekme kaynakta)", h.includes('<div id="anaSekmeSerit" role="tablist"') && h.includes('id="sek-ordu"'));
  ok("statik kaynakta 6 role=tab: ORDU + DURUM·PLAN·AKIŞ·SİSTEM SAĞLIĞI·LOG (proje sekmeleri JS ile eklenir)", (h.match(/role="tab"/g) || []).length === 6, "bulunan: " + (h.match(/role="tab"/g) || []).length);
  ok("alt sekme id'leri: sek-durum/plan/akis/saglik/log", h.includes('id="sek-durum"') && h.includes('id="sek-plan"') && h.includes('id="sek-akis"') && h.includes('id="sek-saglik"') && h.includes('id="sek-log"'));
  ok("ORDU + DURUM baslangicta aktif (aria-selected=true + tabindex=0)", /id="sek-ordu"[^>]*aria-selected="true"/.test(h) && /id="sek-durum"[^>]*aria-selected="true"/.test(h) && /id="sek-durum"[^>]*tabindex="0"/.test(h));
  ok("plan/akis/saglik/log alt sekmeleri aria-selected=false + tabindex=-1", /id="sek-plan"[^>]*aria-selected="false"/.test(h) && /id="sek-akis"[^>]*aria-selected="false"/.test(h) && /id="sek-saglik"[^>]*aria-selected="false"/.test(h) && /id="sek-log"[^>]*aria-selected="false"/.test(h));
  ok("7 statik tabpanel: 5 alt sekme + projeSayfa + bosSayfa (fail-closed boş yüz)", (h.match(/role="tabpanel"/g) || []).length === 7, "bulunan: " + (h.match(/role="tabpanel"/g) || []).length);
  ok("durumBolum hidden OLMADAN baslar (no-JS dürüst yüz)", /<section class="sekmePanel" id="durumBolum"[^>]*>/.test(h));
  ok("planBolum/akisBolum/saglikBolum/logBolum/projeSayfa/bosSayfa hidden baslar", /id="planBolum"[^>]*hidden/.test(h) && /id="akisBolum"[^>]*hidden/.test(h) && /id="saglikBolum"[^>]*hidden/.test(h) && /id="logBolum"[^>]*hidden/.test(h) && /id="projeSayfa"[^>]*hidden/.test(h) && /id="bosSayfa"[^>]*hidden/.test(h));
  ok("LOG ORTA kolona TASINDI (logBolum sekmeGovde içinde — #sag'dan DEĞİL)", h.indexOf('id="logBolum"') > h.indexOf('id="sekmeGovde"') && h.indexOf('id="logBolum"') < h.indexOf('id="bolum-chat"'));
  ok("sekme govdesi kendi icinde kayar (#sekmeGovde overflow-y:auto)", /#sekmeGovde\s*\{[^}]*overflow-y:\s*auto/.test(HTML));
  ok("bolumler sekmelerin icinde yerinde (plan/akis/saglik id'leri korunur)", h.includes('id="bolum-plan"') && h.includes('id="bolum-akis"') && h.includes('id="bolum-saglik"'));
  /* --- SPLITTER x2 (pointer + klavye ±16px + clamp) --- */
  ok("splitter HTML tam (splitSol — role/aria-orientation/aria-valuenow=240/tabindex)", h.includes('<div class="splitter" id="splitSol" role="separator" aria-label="sol panel genişliği" aria-orientation="vertical" aria-valuenow="240" tabindex="0"></div>'));
  ok("splitter HTML tam (splitSag — aria-valuenow=320)", h.includes('<div class="splitter" id="splitSag" role="separator" aria-label="sağ panel genişliği" aria-orientation="vertical" aria-valuenow="320" tabindex="0"></div>'));
  /* --- localStorage: ordu- onekli anahtarlar; tuvalinkilerle CAKISMAZ --- */
  ok("kaydet('ordu-' + taraf + 'W') — ordu onekli", j.includes('kaydet("ordu-" + taraf + "W"'));
  ok("oku('ordu-' + taraf + 'W') — ordu onekli", j.includes('oku("ordu-" + taraf + "W"'));
  ok("tuvalin anahtarlariyla cakisma YOK ('tuval-solW'/'tuval-sagW' literalleri YOK)", !HTML.includes("tuval-solW") && !HTML.includes("tuval-sagW"));
  /* --- script sözleşmesi (FAZ-B): alt sekme UI-only · splitter kopyası · FAZ-B blokları --- */
  ok("sözleşme: sekmeDegistir UI-only fonksiyonu (ALT_SEKME_PANEL)", j.includes("function sekmeDegistir(") && j.includes("const ALT_SEKME_PANEL ="));
  ok("sözleşme: alt sekme dinleyicisi statik şeride bağlı (delegation)", j.includes('$("altSekmeSerit").addEventListener("click"'));
  ok("sözleşme: baslangis ORDU + DURUM aktif", j.includes('anaSekmeDegistir("ordu")') && j.includes('sekmeDegistir("durum")'));
  const sA = j.indexOf("function sekmeDegistir(");
  const sB = j.indexOf("function splitterKur(");
  ok("sözleşme: sekmeDegistir govdesi fetch/cek ICERMEZ (yalniz class/aria/hidden)", sA >= 0 && sB > sA && !/cek\(|fetch\(/.test(j.slice(sA, sB)));
  ok("sözleşme: splitterKur + genislikKenetle (kapsul-tuval ADIM-C kopyasi AYNEN)", j.includes("function splitterKur(") && j.includes("function genislikKenetle("));
  ok("sözleşme: setPointerCapture + lostpointercapture", j.includes("setPointerCapture") && j.includes("lostpointercapture"));
  ok("sözleşme: klavye ±16px (ArrowLeft/ArrowRight)", j.includes('e.key === "ArrowLeft"') && j.includes("-16 : 16"));
  ok("KOMPAKT taraf-bazli clamp: KENAR sabiti sol 200-360 · sag 260-460 (eski 180px-45vw — BİLİNÇLİ)", j.includes("const KENAR = { sol: { min: 200, max: 360 }, sag: { min: 260, max: 460 } };") && j.includes("Math.max(k.min, Math.min(k.max"));
  ok("FAZ-B: 7 GET ucu AYNEN — tek YAZMA ucu POST /api/mesaj (composer)", j.includes('method: "POST"') && j.includes('"/api/mesaj"') && (j.match(/cek\(UC\./g) || []).length === 7);
  /* --- duncyari ~<900px: sutunlar alt alta (sol → orta → sag) --- */
  ok("899px kirilimda body scroll geri gelir (overflow:auto)", /@media \(max-width:899px\)[\s\S]*?body\s*\{[^}]*overflow:\s*auto/.test(HTML));
  ok("899px kirilimda splitter gizlenir", /@media \(max-width:899px\)[\s\S]*?\.splitter\s*\{[^}]*display:\s*none/.test(HTML));
  /* --- LOG sag kolonda: defter gorunumu (mono satirlar — kapsul-tuval .defterGovde deseni) --- */
  ok("logListe mono defter gorunumu (font-family:var(--mono) + KOMPAKT 12px)", /\.logListe\s*\{[^}]*font-family:\s*var\(--mono\)/.test(HTML) && /\.logListe\s*\{[^}]*font-size:\s*12px/.test(HTML));
});

test("10e- KOMPAKT (steering 2026-11-03) yoğunluk + taşma kesme + kısa ad + panel genişliği pinleri", () => {
  const h = htmlKisim();
  const j = jsKisim();
  /* --- yoğunluk: özet şerit + sekmeler + ağaç + composer --- */
  ok("ozetGrid KOMPAKT serit: auto-fit minmax(150px) + gap 8px", /\.ozetGrid\s*\{[^}]*minmax\(min\(150px,\s*100%\),\s*1fr\)/.test(HTML) && /\.ozetGrid\s*\{[^}]*gap:\s*8px/.test(HTML));
  ok("ozetDeger TEK satır: nowrap + ellipsis; ozetAlt ellipsis", /\.ozetDeger\s*\{[^}]*text-overflow:\s*ellipsis/.test(HTML) && /\.ozetAlt\s*\{[^}]*text-overflow:\s*ellipsis/.test(HTML));
  ok("sekme 30px + 12px etiket (KOMPAKT)", /\.sekme\s*\{[^}]*min-height:\s*30px/.test(HTML) && /\.sekme\s*\{[^}]*font-size:\s*12px/.test(HTML));
  ok("sekmeKapat 20px hedef (KOMPAKT)", /\.sekmeKapat\s*\{[^}]*width:\s*20px/.test(HTML) && /\.sekmeKapat\s*\{[^}]*height:\s*20px/.test(HTML));
  ok("agacAjan 28px + 13px metin (E-ek2 bilinçli: 12→13px — okunabilirlik öne geçti, kompakt baz 13px); durum noktasi 8px; girinti 12px", /\.agacAjan\s*\{[^}]*min-height:\s*28px/.test(HTML) && /\.agacAjan\s*\{[^}]*font-size:\s*13px/.test(HTML) && /\.agacAjan \.nokta\s*\{[^}]*width:\s*8px/.test(HTML) && /\.agacCocuklar\s*\{[^}]*padding:\s*0 0 2px 12px/.test(HTML));
  ok("composer 12px metin + GÖNDER 40px (KISAT alt sınırı)", /#composerForm select, #composerForm textarea, #composerForm input\s*\{[^}]*font-size:\s*12px/.test(HTML) && /#composerGonder\s*\{[^}]*min-height:\s*40px/.test(HTML));
  /* --- taşma kesme: ellipsis her metin hücresinde + title tam metin --- */
  ok("olayAd ellipsis + nowrap (AKIŞ satır başına 1 satır)", /\.olayAd\s*\{[^}]*white-space:\s*nowrap/.test(HTML) && /\.olayAd\s*\{[^}]*text-overflow:\s*ellipsis/.test(HTML));
  ok("logDetay ellipsis + logSatir nowrap + logKaynak max-width", /\.logDetay\s*\{[^}]*text-overflow:\s*ellipsis/.test(HTML) && /\.logListe li\.logSatir\s*\{[^}]*white-space:\s*nowrap/.test(HTML) && /\.logKaynak\s*\{[^}]*max-width:\s*220px/.test(HTML));
  ok("planTablo table-layout:fixed + td 4px 8px + ellipsis + colgroup JS'te", /\.planTablo\s*\{[^}]*table-layout:\s*fixed/.test(HTML) && /\.planTablo td\s*\{[^}]*padding:\s*4px 8px/.test(HTML) && /\.planTablo td\s*\{[^}]*text-overflow:\s*ellipsis/.test(HTML) && j.includes('<colgroup><col class="colSira">'));
  ok("proje tablosu colgroup'u (colKimlik..colSaglayici)", j.includes('<colgroup><col class="colKimlik">'));
  ok("kolon CSS siniflari (colSira/colKod/colDurum/colEtkinlik...)", /\.planTablo \.colSira\s*\{/.test(HTML) && /\.planTablo \.colEtkinlik\s*\{/.test(HTML));
  ok("AKIŞ satır adı kisalt(o.ad, 80) + title TAM metin", j.includes("kisalt(o.ad, 80)") && j.includes('class="olayAd\' + (TUR_MONO'));
  ok("LOG satır kod/detay title TAM metin", j.includes('<span class="logKod" title="\' + esc(k.kodAdi') && j.includes('<span class="logDetay" title="\' + esc(k.detay'));
  ok("ozetYaz title TAM metin (el.title = metin)", j.includes("el.textContent = metin; el.title = metin;"));
  ok("kisalt fonksiyonu yerinde (kısa ad kuralı)", j.includes("function kisalt(metin, n)"));
  ok("agac düğüm adı .agacDugumAd (tek satır) — eski agacAjanId/agacEtiket KALDIRILDI", /\.agacDugumAd\s*\{[^}]*text-overflow:\s*ellipsis/.test(HTML) && !HTML.includes(".agacAjanId") && !HTML.includes(".agacEtiket"));
  ok("sağ kart sağlayıcı kisalt(a.provider, 16) + title TAM", j.includes("kisalt(a.provider, 16)"));
  ok("PANEL-CHAT-1: sağ başlık satırı TAM kimliği title'da taşır (eski kart '· kısa' satırı BİLİNÇLİ kalktı — kart TEK satıra indi)", j.includes("chatBaslikAd\" title=\"' + esc(a.ajanKimligi) + '\""));
  /* --- panel genişlikleri: varsayılan + KENAR + 900-1279 kırılımı --- */
  ok("varsayılan genişlikler --solW:240px / --sagW:320px", HTML.includes("--solW:240px") && HTML.includes("--sagW:320px"));
  ok("KENAR taraf-bazlı clamp: sol 200-360 · sag 260-460", j.includes("const KENAR = { sol: { min: 200, max: 360 }, sag: { min: 260, max: 460 } }"));
  ok("splitter fallback 240/320 (eski 280/380 — BİLİNÇLİ)", j.includes('(taraf === "sol" ? 240 : 320)'));
  ok("900-1279px kırılımı: kolonlar daralır (--solW:200px / --sagW:280px)", /@media \(min-width:900px\) and \(max-width:1279px\)[\s\S]*?--solW:\s*200px[\s\S]*?--sagW:\s*280px/.test(HTML));
  ok("<899px istif düzeni KORUNUR (body overflow:auto + tek kolon)", /@media \(max-width:899px\)[\s\S]*?body\s*\{[^}]*overflow:\s*auto/.test(HTML));
  ok("çizgi rengi açık gri #e2e8f0 (kalın kenarlıklar → 1px açık gri)", HTML.includes("--cizgi:#e2e8f0"));
  const kutuGolge = (HTML.replace(/box-shadow:\s*inset[^;}]*[;}]/g, "").match(/box-shadow/g) || []);
  ok("gölge YOK (yalnız .agacAjan.secili inset istisnası)", kutuGolge.length === 0, "bulunan: " + kutuGolge.length);
  /* --- EK STEERING 2026-11-03 (TEK PANEL): paseoOzet + bitişik üst çubuk ailesi --- */
  ok("DURUM alt-sekmesinde paseoOzet kompakt satırı (proje listesi ağaçta tek kaynak)", h.includes('id="paseoOzet"'));
  ok("paseoOzet doldurma: 'Paseo taraması: N proje · M ajan'", j.includes('"Paseo taraması: "'));
  ok("paseoOzet fail-closed (tarama ölürse dürüst metin)", j.includes('"Paseo taraması okunamadı'));
  ok("eski PROJE DURUMLARI bloğu YOK (çift kaynak yasak — ağaç tek kaynak)", !h.includes('id="bolum-projekart"') && !j.includes("projeKartIci"));
  ok("üst çubuklar bitişik tek aile: anaSekmeSerit border-top:0 + main padding-top 0", /#anaSekmeSerit\s*\{[^}]*border-top:\s*0/.test(HTML) && /main\s*\{[^}]*padding:\s*0 12px 12px/.test(HTML));
  ok("alt sekme şeridi govdeye bitişik (negatif marj + radius 0)", /#altSekmeSerit\s*\{[^}]*margin:\s*0 -12px 8px/.test(HTML));
});

test("11- emoji YOK + dis URL YOK + webfont YOK", () => {
  const emoji = HTML.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu) || [];
  ok("emoji karakteri yok", emoji.length === 0, "bulunan: " + emoji.length);
  ok("system-ui font stack (webfont YOK)", HTML.includes("system-ui"));
  const dis = HTML.replace(/<link\s+rel="icon"[^>]+>/g, "");
  ok("CDN/dis URL YOK", !/https?:\/\//.test(dis));
});

test("12- AKIS: tek kronolojik akis + tur renk kodu lejanti", () => {
  const j = jsKisim();
  ok("akisListe ol listesi", /\.akisListe\s*\{/.test(HTML));
  ok("tur cubuklari (t-handoff/t-kira/t-429)", HTML.includes(".olayCubuk.t-handoff") && HTML.includes(".olayCubuk.t-kira") && HTML.includes(".olayCubuk.t-429"));
  ok("renk lejanti (olay turu renk kodu)", j.includes("olay türü renk kodu"));
  ok("zaman gosterimi olay basina (olayZaman)", /\.olayZaman\s*\{/.test(HTML));
  ok("akis bossa durust bos satir", j.includes("akış kaydı yok"));
});

test("13- SAGLIK detay: sinif kartlari + onlemler + cozum kuyrugu (bolum 4)", () => {
  ok("saglikKart CSS sinifi", /\.saglikKart\s*\{/.test(HTML));
  ok("fren rozet siniflari (KISMEN/COGU/ACIK)", /\.fren\.KISMEN\s*\{/.test(HTML) && /\.fren\.COGU\s*\{/.test(HTML) && /\.fren\.ACIK\s*\{/.test(HTML));
  ok("onlemler statik listesi (kalkan429/kira lease/canary/commit -F/dogrula-hex)", HTML.includes("kalkan429") && HTML.includes("kira lease") && HTML.includes("canary") && HTML.includes("commit -F") && HTML.includes("doğrula-hex"));
  ok("cozumListe kuyrugu", HTML.includes('id="cozumListe"'));
});

/* ===================== (2) sayfa fonksiyonlari — vm davranis ===================== */

test("14- esc() davranisi: XSS yukleri zararsiz metne iner", () => {
  const esc = fnAl("esc");
  assert.equal(esc('<img src=x onerror="alert(1)">'), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  assert.equal(esc("a & b < c > d"), "a &amp; b &lt; c &gt; d");
  assert.equal(esc('"><script>x</script>'), "&quot;&gt;&lt;script&gt;x&lt;/script&gt;");
  assert.equal(esc(123), "123");
  assert.equal(esc(null), "null");
  assert.equal(esc(undefined), "undefined");
});

test("15- fazGruplari: gercek faz degerleri + fazsiz durust grubu + sayimlar", () => {
  const f = fnAl("fazGruplari");
  const gorevler = [
    { id: "A1", faz: "DC/F1", aktif: true },
    { id: "A2", faz: "DC/F0", aktif: true },
    { id: "A3", faz: "DC/F1", aktif: false },
    { id: "A4" },
    { id: "A5", faz: "" },
    { id: "A6", faz: "DC/F0", aktif: false },
  ];
  const g = f(gorevler);
  assert.equal(g.length, 3, "3 grup: F0 + F1 + fazsiz");
  assert.equal(g[0].faz, "DC/F0", "fazlilar ada gore sirali");
  assert.equal(g[1].faz, "DC/F1");
  assert.equal(g[2].faz, "fazsız", "fazsiz en sonda");
  assert.equal(g[0].sayi, 2);
  assert.equal(g[0].aktifSayi, 1);
  assert.equal(g[1].sayi, 2);
  assert.equal(g[1].aktifSayi, 1);
  assert.equal(g[2].sayi, 2, "faz alani yok/ers: fazsiza duser");
  assert.equal(g[2].aktifSayi, 0);
  assert.ok(Array.isArray(f([])) && f([]).length === 0, "bos giris bos cikti (vm alanlari arasi dizi kiyasina girmez)");
});

test("16- durumSinifi: HAZIR yesil · BEKLE amber · KAPALI gri · diger camgobegi", () => {
  const d = fnAl("durumSinifi");
  assert.equal(d("HAZIR (yalniz planlama)"), "durum-hazir");
  assert.equal(d("BEKLE (bagimlilik)"), "durum-bekle");
  assert.equal(d("KAPALI (F6.5-A: commit 80fdb4a)"), "durum-kapali");
  assert.equal(d("ONAYLI"), "durum-diger");
  assert.equal(d(""), "durum-diger");
  assert.equal(d(null), "durum-diger");
  assert.equal(d(undefined), "durum-diger");
});

test("17- kiraEtiketi (sayfa yuzu): 4+2 durust tablo", () => {
  const k = fnAl("kiraEtiketi");
  assert.equal(k({ yok: true }).ad, "kira yok");
  assert.equal(k({ bozuk: true }).ad, "kira bozuk");
  assert.equal(k({ durum: "birakildi", kimlik: "nobet-ajan-21180" }).ad, "kira bırakılmış");
  assert.equal(k({ taze: true, kalanMs: 12 * 60 * 1000 }).ad, "kira taze (12 dk kaldı)");
  assert.equal(k({ taze: false, kalanMs: 0 }).ad, "kira bayat");
  assert.equal(k(null).ad, "kira durumu bilinmiyor");
  assert.equal(k({ taze: true, kalanMs: 30 * 1000 }).taze, true);
});

/* ===================== (3) kadro SSOT — disk sozlesmesi ===================== */

test("18- ordu-kadro.json gecerli + kadroDogrula gecer (fail-closed sema)", () => {
  ok("kadro JSON okunur", KADRO !== null);
  if (KADRO === null) return;
  assert.equal(kadroDogrula(KADRO), true);
  assert.equal(KADRO.surum, 4);
  ok("damgaISO gecerli ISO", Number.isFinite(Date.parse(KADRO.damgaISO)));
});

test("19- kadro: gercek ordu (5) + graf sablonlari (4) — kod adlari SSOT", () => {
  ok("kadro okunur", KADRO !== null);
  if (KADRO === null) return;
  const kodlar = KADRO.birlikler.map((b) => b.kodAdi);
  for (const k of ["KOMUTAN", "KURMAY-1", "NOBET-1", "KARTAL-30", "DEVIR-1", "MANAGER", "CODER", "TESTER", "GOZLEMCI"]) {
    ok("kod adi: " + k, kodlar.includes(k));
  }
  const kiraKaynakli = KADRO.birlikler.filter((b) => b.canliKaynak === "kira").map((b) => b.kodAdi);
  assert.deepEqual(kiraKaynakli.sort(), ["KURMAY-1", "NOBET-1"], "kira kaynakli: KURMAY-1 + NOBET-1");
  const sablonlar = KADRO.birlikler.filter((b) => b.canliKaynak === "graf").map((b) => b.kodAdi);
  assert.equal(sablonlar.length, 4, "graf sablonu: MANAGER/CODER/TESTER/GOZLEMCI");
  /* BOLUM 6 spec eki: ajanId YALNIZ olculmus kartlarda (kaynak etiketi zorunlu) */
  const ajanIdli = KADRO.birlikler.filter((b) => b.ajanId !== undefined).map((b) => b.kodAdi);
  assert.deepEqual(ajanIdli.sort(), ["KURMAY-1", "NOBET-1"], "ajanId tasiyanlar: KURMAY-1 (8cc610a4) + NOBET-1 (432e03b7)");
  const kurmay = KADRO.birlikler.find((b) => b.kodAdi === "KURMAY-1");
  const nobet1 = KADRO.birlikler.find((b) => b.kodAdi === "NOBET-1");
  ok("KURMAY-1 ajanId UUID (Paseo olcumu)", kurmay.ajanId === "8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7");
  ok("KURMAY-1 ajanIdKaynak dolu (kaynak beyani)", typeof kurmay.ajanIdKaynak === "string" && kurmay.ajanIdKaynak.includes("Paseo"));
  ok("NOBET-1 ajanId UUID (run#3 ajani)", nobet1.ajanId === "432e03b7-9004-445c-857d-ebf3b6661d53");
  ok("NOBET-1 ajanIdKaynak dolu (kaynak beyani)", typeof nobet1.ajanIdKaynak === "string" && nobet1.ajanIdKaynak.includes("3b6cd207"));
  ok("olculemeyen kartlar ajanId TASIMAZ (uydurulmaz)", KADRO.birlikler.filter((b) => !ajanIdli.includes(b.kodAdi)).every((b) => b.ajanId === undefined));
});

test("20- kadro OLCUM sozlesmesi: NOBET-1 4 pilot kosusu + KARTAL-30 W44 benchmark (kaynak etiketli)", () => {
  ok("kadro okunur", KADRO !== null);
  if (KADRO === null) return;
  const nobet = KADRO.birlikler.find((b) => b.kodAdi === "NOBET-1");
  ok("NOBET-1 olcum.calismaSuresi 4 kosu", nobet.olcum && Array.isArray(nobet.olcum.calismaSuresi) && nobet.olcum.calismaSuresi.length === 4);
  for (const r of nobet.olcum.calismaSuresi) {
    ok("kosu alani seti (ad/sure/sonuc/kaynak): " + r.ad, typeof r.ad === "string" && typeof r.sure === "string" && typeof r.sonuc === "string" && typeof r.kaynak === "string" && r.kaynak.length > 0);
  }
  ok("run#1 hata-429 olcumu", nobet.olcum.calismaSuresi[0].sonuc.includes("429"));
  ok("run#3 devir/handoff olcumu", nobet.olcum.calismaSuresi[2].sonuc.includes("HANDOFF"));
  ok("olcum kaynagi Paseo tur kaydi", nobet.olcum.calismaSuresi[0].kaynak.includes("Paseo schedule"));
  const kartal = KADRO.birlikler.find((b) => b.kodAdi === "KARTAL-30");
  ok("KARTAL-30 olcum.benchmark (disk W44 degerleri: 727 tur · %71.4)", kartal.olcum && kartal.olcum.benchmark.includes("727") && kartal.olcum.benchmark.includes("%71.4"));
  ok("benchmark kaynagi W44 telemetri", kartal.olcum.kaynak.includes("2026-W44"));
  const olcumsuz = KADRO.birlikler.filter((b) => b.kodAdi !== "NOBET-1" && b.kodAdi !== "KARTAL-30");
  ok("baska birlik OLCUM tasimaz (olcum yok = olculmedi gosterilir)", olcumsuz.every((b) => b.olcum === undefined));
});

test("21- kadro cephe/denetim + sahte atama YOK", () => {
  ok("kadro okunur", KADRO !== null);
  if (KADRO === null) return;
  const gercek = ["KOMUTAN", "KURMAY-1", "NOBET-1", "KARTAL-30", "DEVIR-1"];
  for (const k of gercek) {
    const b = KADRO.birlikler.find((x) => x.kodAdi === k);
    ok(k + " cephe alani (graf disi canli hat)", typeof b.cephe === "string" && b.cephe.length > 0);
    ok(k + " denetim alani", typeof b.denetim === "string" && b.denetim.length > 0);
  }
  ok("graf sablonlari cephe TASIMAZ (dalga gorunumune girmez)", KADRO.birlikler.filter((b) => b.canliKaynak === "graf").every((b) => b.cephe === undefined));
  ok("hicbir birlik atanmisGorevler tasimaz (SAHTE atama YOK)", KADRO.birlikler.every((b) => !b.atanmisGorevler));
});

/* ===================== (4) ordu-birlesim.mjs — modul vakalari ===================== */

test("22- kadroDogrula RED tablosu (fail-closed sema)", () => {
  const taban = { surum: 1, damgaISO: "2026-11-01T17:00:00+03:00", birlikler: [{ kodAdi: "X", rol: "r", tur: "asker", gorev: "g", hedef: "h", dosyalar: [], kaynakAciklama: "k", canliKaynak: "statik" }] };
  assert.equal(kadroDogrula(taban), true);
  assert.throws(() => kadroDogrula({ ...taban, birlikler: [] }), /birlikler/);
  assert.throws(() => kadroDogrula({ ...taban, damgaISO: "yarin" }), /damgaISO/);
  assert.throws(() => kadroDogrula({ ...taban, surum: "1" }), /surum/);
  assert.throws(() => kadroDogrula({ ...taban, birlikler: [{ ...taban.birlikler[0], tur: "yeniceri" }] }), /tur/);
  assert.throws(() => kadroDogrula({ ...taban, birlikler: [{ ...taban.birlikler[0], canliKaynak: "kahin" }] }), /canliKaynak/);
  assert.throws(() => kadroDogrula({ ...taban, birlikler: [{ ...taban.birlikler[0], gorev: " " }] }), /gorev/);
  assert.throws(() => kadroDogrula({ ...taban, birlikler: [{ ...taban.birlikler[0], dosyalar: [1] }] }), /dosyalar/);
  assert.throws(() => kadroDogrula({ ...taban, birlikler: [...taban.birlikler, { ...taban.birlikler[0] }] }), /TEKRARLI/);
  assert.throws(() => kadroDogrula({ ...taban, birlikler: [{ ...taban.birlikler[0], ajanId: "8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7" }] }), /ajanIdKaynak/); // ajanId kaynaksiz RED
  assert.throws(() => kadroDogrula({ ...taban, birlikler: [{ ...taban.birlikler[0], ajanId: "kısa", ajanIdKaynak: "k" }] }), /ajanId/); // kisa/kaynaksiz kimlik RED
  assert.throws(() => kadroDogrula(null), /nesne/);
});

test("23- kadroDogrula olcum semasi: kaynaksiz olcum RED (uydurma olcum engeli)", () => {
  const taban = { surum: 1, damgaISO: "2026-11-01T17:00:00+03:00", birlikler: [{ kodAdi: "X", rol: "r", tur: "asker", gorev: "g", hedef: "h", dosyalar: [], kaynakAciklama: "k", canliKaynak: "statik" }] };
  const kosu = (u) => ({ ...taban, birlikler: [{ ...taban.birlikler[0], olcum: u }] });
  assert.equal(kadroDogrula(kosu({ calismaSuresi: [{ ad: "r1", sure: "1dk", sonuc: "ok", kaynak: "kaynak" }] })), true);
  assert.throws(() => kadroDogrula(kosu({ calismaSuresi: [{ ad: "r1", sure: "1dk", sonuc: "ok", kaynak: " " }] })), /kaynak/);
  assert.throws(() => kadroDogrula(kosu({ calismaSuresi: [{ ad: "r1", sure: "1dk", sonuc: "ok" }] })), /calismaSuresi/);
  assert.throws(() => kadroDogrula(kosu({ calismaSuresi: "1dk" })), /calismaSuresi/);
  assert.throws(() => kadroDogrula(kosu({ benchmark: " " })), /benchmark/);
  assert.throws(() => kadroDogrula(kosu("olcum")), /nesne/);
  assert.throws(() => kadroDogrula({ ...taban, birlikler: [{ ...taban.birlikler[0], cephe: " " }] }), /cephe/);
  assert.throws(() => kadroDogrula({ ...taban, birlikler: [{ ...taban.birlikler[0], denetim: 5 }] }), /denetim/);
  assert.throws(() => kadroDogrula({ ...taban, birlikler: [{ ...taban.birlikler[0], atanmisGorevler: [1] }] }), /atanmisGorevler/);
  assert.equal(kadroDogrula(kosu({ benchmark: "720 tur", kaynak: "W44" })), true);
});

test("24- kiraEtiketi (modul): 4+2 tablo + null", () => {
  assert.equal(kiraEtiketi({ yok: true }), "yok");
  assert.equal(kiraEtiketi({ bozuk: true }), "bozuk");
  assert.equal(kiraEtiketi({ durum: "birakildi" }), "birakildi");
  assert.equal(kiraEtiketi({ taze: true }), "taze");
  assert.equal(kiraEtiketi({ taze: false }), "bayat");
  assert.equal(kiraEtiketi(null), null);
  assert.equal(kiraEtiketi("x"), null);
});

const kadroOrnek = () => ({
  surum: 1, damgaISO: "2026-11-01T17:00:00+03:00",
  birlikler: [
    { kodAdi: "KURMAY-1", rol: "kurmay", tur: "kurmay", gorev: "g1", hedef: "h1", dosyalar: [], kaynakAciklama: "k", canliKaynak: "kira" },
    { kodAdi: "NOBET-1", rol: "nobet", tur: "nobet", gorev: "g2", hedef: "h2", dosyalar: [], kaynakAciklama: "k", canliKaynak: "kira" },
    { kodAdi: "MANAGER", rol: "sablon", tur: "kurmay", gorev: "g3", hedef: "h3", dosyalar: [], kaynakAciklama: "k", canliKaynak: "graf" },
    { kodAdi: "KARTAL-30", rol: "statik", tur: "asker", gorev: "g4", hedef: "h4", dosyalar: [], kaynakAciklama: "k", canliKaynak: "statik" },
    { kodAdi: "ESKI-1", rol: "snapshot", tur: "asker", gorev: "g5", hedef: "h5", dosyalar: [], kaynakAciklama: "k", canliKaynak: "snapshot", olcumAniISO: "2026-10-29T16:48:31+03:00" },
  ],
});

test("25- kadroBirlesim canlilik: taze nobet kirasi NOBET-1'i canli yapar; sahtesi yok", () => {
  const kira = { taze: true, kalanMs: 10 * 60 * 1000, kimlik: "nobet-ajan-x", devirSinifi: "nobet" };
  const b = kadroBirlesim(kadroOrnek(), kira);
  const n = b.birlikler.find((x) => x.kodAdi === "NOBET-1");
  const kur = b.birlikler.find((x) => x.kodAdi === "KURMAY-1");
  assert.equal(n.canlilik.canli, true);
  assert.ok(n.canlilik.etiket.includes("CANLI") && n.canlilik.etiket.includes("nobet-ajan-x"));
  assert.equal(kur.canlilik.canli, false, "operator sinifi degil — KURMAY-1 canli DIYILMEZ");
  assert.equal(b.kiraEtiketi, "taze");
});

test("26- kadroBirlesim: operator kirasi KURMAY-1'i canli yapar; digerleri durust gri", () => {
  const kira = { taze: true, kalanMs: 5 * 60 * 1000, kimlik: "koordinator-1", devirSinifi: "operator" };
  const b = kadroBirlesim(kadroOrnek(), kira);
  assert.equal(b.birlikler.find((x) => x.kodAdi === "KURMAY-1").canlilik.canli, true);
  assert.equal(b.birlikler.find((x) => x.kodAdi === "NOBET-1").canlilik.canli, false);
  const sablon = b.birlikler.find((x) => x.kodAdi === "MANAGER");
  assert.equal(sablon.canlilik.canli, false);
  assert.ok(sablon.canlilik.etiket.includes("ŞABLON"));
  const statik = b.birlikler.find((x) => x.kodAdi === "KARTAL-30");
  assert.ok(statik.canlilik.etiket.includes("STATİK"));
  const snap = b.birlikler.find((x) => x.kodAdi === "ESKI-1");
  assert.ok(snap.canlilik.etiket.includes("ÖLÇÜM ANI") && snap.canlilik.etiket.includes("canlı DENMEZ"), "snapshot canli DENMEZ");
});

test("27- kadroBirlesim: kira yok/birakildi/bozuk → kimse canli degil + durust etiket", () => {
  for (const kira of [null, { yok: true }, { bozuk: true }, { taze: false, durum: "birakildi", kimlik: "nobet-ajan-21180" }]) {
    const b = kadroBirlesim(kadroOrnek(), kira);
    assert.equal(b.birlikler.filter((x) => x.canlilik.canli).length, 0, "canli sifir: " + JSON.stringify(kira));
  }
  const b2 = kadroBirlesim(kadroOrnek(), { taze: false, durum: "birakildi", kimlik: "nobet-ajan-21180" });
  const n2 = b2.birlikler.find((x) => x.kodAdi === "NOBET-1");
  assert.equal(n2.canlilik.canli, false);
  assert.ok(n2.canlilik.etiket.includes("birakildi") && n2.canlilik.etiket.includes("nobet-ajan-21180"), "birakilan kiranin sahibi durust yazilir");
  assert.throws(() => kadroBirlesim({ surum: 1, damgaISO: "x", birlikler: [] }, null), /RED/);
});

test("28- aktifIsOku: STATE_BOARD blogundan duz metin (link/kalin soyulur) + durust null'lar", () => {
  const d = tempKok();
  const p = join(d, "STATE_BOARD.md");
  writeFileSync(p, "# baslik\n\n## Aktif iş\n\n- **K8-2b** [insan] emri bekler\n- gorev: [ORDU paneli](plans/PLAN.md) suruyor\n\n## Son damgalar\n\n- x\n");
  const r = aktifIsOku(p);
  assert.ok(r.aktifIs.includes("K8-2b"));
  assert.ok(r.aktifIs.includes("ORDU paneli (plans/PLAN.md)"), "link metne+parantez yola iner");
  assert.ok(!r.aktifIs.includes("**"), "kalin isaretleri soyulur");
  assert.ok(!r.aktifIs.includes("## Son damgalar"), "sonraki baslikta durur");
  assert.ok(r.satir >= 2);
  writeFileSync(join(d, "baska.md"), "## Baska\n");
  assert.equal(aktifIsOku(join(d, "baska.md")).aktifIs, null, "baslik yoksa null");
  assert.equal(aktifIsOku(join(d, "yok.md")).aktifIs, null, "dosya yoksa null");
  rmSync(d, { recursive: true, force: true });
});

test("28b- sonDamgaSatiri: basliktan ONCEKI son tarihli damga (arsiv ilk satiri DEGIL — canli bayat-damga bulgusu)", () => {
  // canli bulgu: panel SON DAMGA karti 2026-10-31 03:11 gosteriyordu; gercek son damga bolgede 2026-11-01 19:26
  const satirlar = [
    "## Devreden",
    "",
    "- 2026-11-01 17:53 | OTODEV PILOT-0 KAPANDI",
    "- 2026-11-01 19:26 | ORDU KOMUTA PANELI KAPALI",
    "## Son damgalar",
    "- 2026-10-31 03:11 | BEKCI EKSIK KAPATMA",
    "- 2026-10-30 (ozet) · eski kayit",
  ];
  assert.equal(sonDamgaSatiri(satirlar), "- 2026-11-01 19:26 | ORDU KOMUTA PANELI KAPALI");
  // tarihli olmayan madde atlanir — tarih deseni sart
  assert.equal(sonDamgaSatiri(["- madde", "- 2026-11-01 10:00 | D", "## Son damgalar", "- y"]), "- 2026-11-01 10:00 | D");
  // damga bolgesi bos -> arsivin ilk satirina durust geri dusus (eski davranis)
  assert.equal(sonDamgaSatiri(["## Son damgalar", "- 2026-10-31 03:11 | BEKCI", "- x"]), "- 2026-10-31 03:11 | BEKCI");
  // baslik yok -> null; bos dizi -> null
  assert.equal(sonDamgaSatiri(["- 2026-11-01 a"]), null);
  assert.equal(sonDamgaSatiri([]), null);
});

test("29- defterOzet: gecerli+bozuk satirlar sayilir; dosya yoksa sifir+null", () => {
  const d = tempKok();
  const p = join(d, "429-defter.jsonl");
  writeFileSync(p, '{"provider":"glm53u-codex","hataSinifi":"http-429","damgaISO":"2026-11-01T14:23:41.633Z"}\nbozuk satir\n{"provider":"a","damgaISO":"2026-11-01T14:31:15Z"}\n\n');
  const o = defterOzet(p);
  assert.equal(o.toplam, 2);
  assert.equal(o.bozuk, 1);
  assert.equal(o.sonKayit.provider, "a");
  const yok = defterOzet(join(d, "yok.jsonl"));
  assert.deepEqual(yok, { toplam: 0, bozuk: 0, sonKayit: null });
  rmSync(d, { recursive: true, force: true });
});

test("30- gitHeadOku: ref'li dal + detached hash + yok → durust null'lar (child_process YOK)", () => {
  const d = tempKok();
  const git = join(d, ".git");
  mkdirSync(join(git, "refs", "heads"), { recursive: true });
  writeFileSync(join(git, "HEAD"), "ref: refs/heads/main\n");
  writeFileSync(join(git, "refs", "heads", "main"), "e341fd7aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n");
  const r = gitHeadOku(d);
  assert.equal(r.dal, "main");
  assert.equal(r.kisa, "e341fd7");
  assert.equal(r.hash.slice(0, 6), "e341fd");
  writeFileSync(join(git, "HEAD"), "1234567890abcdef\n");
  const det = gitHeadOku(d);
  assert.equal(det.dal, null, "detached HEAD'te dal null");
  assert.equal(det.kisa, "1234567");
  assert.equal(gitHeadOku(join(d, "yok")), null);
  rmSync(d, { recursive: true, force: true });
});

test("31- akisBirlestir: uc kaynak tek kronolojik dizide (en yeni once) + atlanan sayilir", () => {
  const r = akisBirlestir({
    handofflar: [{ turu: "handoff", ad: "H1.md", zamanISO: "2026-11-01T14:00:00Z" }],
    kiraOlaylar: [
      { turu: "kira", ad: "ilk-kira · a", zamanISO: "2026-11-01T14:18:45Z" },
      { turu: "kira", ad: "devir · b", zamanISO: "2026-11-01T14:37:59Z" },
    ],
    defterKayitlari: [
      { turu: "429", ad: "glm53u-codex · http-429", zamanISO: "2026-11-01T14:23:41.633Z" },
      { turu: "429", ad: "bozuk-damga", zamanISO: "kesin degil" },
      null,
    ],
  });
  assert.equal(r.olaylar.length, 4);
  assert.ok(r.atlanan >= 2, "gecersiz damga + null atlanir ve SAYILIR: " + r.atlanan);
  const zamanlar = r.olaylar.map((o) => Date.parse(o.zamanISO));
  for (let i = 1; i < zamanlar.length; i++) assert.ok(zamanlar[i - 1] >= zamanlar[i], "kronolojik azalan: " + i);
  assert.equal(r.olaylar[0].ad, "devir · b", "en yeni once");
  for (const o of r.olaylar) {
    assert.ok(["turu", "ad", "zamanISO"].every((alan) => alan in o), "kayit sekli {turu,ad,zamanISO}");
    assert.ok(!("ms" in o), "ic ms alani sizmaz");
  }
  assert.deepEqual(akisBirlestir({}), { olaylar: [], atlanan: 0 });
});

test("32- akisTopla: tmp fixture'lar uclu birlesim + eksik kaynaklar bos (hata degil)", () => {
  const d = tempKok();
  const hDir = join(d, "handoff");
  mkdirSync(hDir);
  writeFileSync(join(hDir, "HANDOFF-1.md"), "x");
  writeFileSync(join(hDir, "notlar.txt"), "y");
  const kiraYolu = join(d, "devir-kira.json");
  const logYolu = kiraYolu + "-log.jsonl";
  writeFileSync(logYolu, [
    JSON.stringify({ tur: "ilk-kira", kimlik: "nobet-ajan-x", damga: "2026-11-01T14:18:45Z", sebep: "pilot" }),
    "bozuk json",
    JSON.stringify({ tur: "devir", kimlik: "nobet-ajan-y", damga: "2026-11-01T14:37:59Z", sebep: "echo" }),
  ].join("\n") + "\n");
  const defter = join(d, "429.jsonl");
  writeFileSync(defter, '{"provider":"glm53u-codex","hataSinifi":"http-429","damgaISO":"2026-11-01T14:23:41.633Z"}\n');
  const logOkuFn = (yol) => {
    assert.equal(yol, kiraYolu, "logOku kira yolundan cagirilir");
    return { olaylar: readFileSync(logYolu, "utf8").split("\n").filter((s) => s.trim() && s !== "bozuk json").map((s) => JSON.parse(s)), bozuk: 1 };
  };
  const t = akisTopla({ handoffDir: hDir, kiraYolu, defterYolu: defter, logOkuFn });
  const turler = new Set(t.olaylar.map((o) => o.turu));
  assert.ok(turler.has("handoff") && turler.has("kira") && turler.has("429"), "uc tur birlesir: " + [...turler]);
  assert.ok(t.atlanan >= 1, "kira bozuk satiri atlanan sayisina duser: " + t.atlanan);
  const kiraOlay = t.olaylar.find((o) => o.ad.includes("nobet-ajan-x"));
  assert.ok(kiraOlay && kiraOlay.turu === "kira" && kiraOlay.ad.includes("(pilot)"), "kira olay adi tur+kimlik+sebep tasir: " + (kiraOlay ? kiraOlay.ad : "yok"));
  const h = t.olaylar.find((o) => o.turu === "handoff");
  assert.equal(h.ad, "HANDOFF-1.md");
  assert.ok(t.olaylar.every((o) => Number.isFinite(Date.parse(o.zamanISO))));
  const bos = akisTopla({ handoffDir: join(d, "yokdir"), kiraYolu: join(d, "yok.json"), defterYolu: join(d, "yok2.jsonl"), logOkuFn: () => ({ olaylar: [], bozuk: 0 }) });
  assert.deepEqual(bos.olaylar, [], "kaynak yok → bos (hata degil)");
  rmSync(d, { recursive: true, force: true });
});

test("33- defterKayitlari: provider·hataSinifi adi + damgasiz kayit atlanir", () => {
  const d = tempKok();
  const p = join(d, "d.jsonl");
  writeFileSync(p, '{"provider":"glm53u-codex","hataSinifi":"http-429","damgaISO":"2026-11-01T14:23:41.633Z"}\n{"provider":"x"}\n');
  const k = defterKayitlari(p);
  assert.equal(k.length, 1, "damgasiz kayit atlanir");
  assert.equal(k[0].ad, "glm53u-codex · http-429");
  assert.deepEqual(defterKayitlari(join(d, "yok.jsonl")), []);
  rmSync(d, { recursive: true, force: true });
});

test("34- saglikBirlesim: gecerli envanter birlesir; bozuk RED", () => {
  const sorun = { damgaISO: "2026-11-01T17:40:00+03:00", siniflar: [{ id: "S1", ad: "PS 5.1", fren: "KISMEN" }], fixKuyrugu: ["F1"] };
  const b = saglikBirlesim(sorun, { defterToplam: 2, kiraEtiketi: "birakildi" });
  assert.equal(b.defterToplam, 2);
  assert.equal(b.kiraEtiketi, "birakildi");
  assert.equal(b.siniflar.length, 1);
  const b2 = saglikBirlesim(sorun, {});
  assert.equal(b2.defterToplam, null, "ek yoksa durust null");
  assert.throws(() => saglikBirlesim({ siniflar: [] }, {}), /RED/);
  assert.throws(() => saglikBirlesim({ siniflar: [{ id: "S1", ad: "x" }] }, {}), /RED/);
  assert.throws(() => saglikBirlesim(null, {}), /RED/);
});

test("35- enOlduruculer + frenSayilari: enOldurucu5 cozumlenir; kayit yoksa durust ad", () => {
  const sorun = {
    siniflar: [
      { id: "S1", ad: "PS 5.1 komut-aktarim katmani", tekrarYaklasik: 45, fren: "KISMEN" },
      { id: "S2", ad: "kanit durustlugu", tekrarYaklasik: 18, fren: "COGU" },
      { id: "S9", ad: "kapsam tavana", tekrarYaklasik: 3, fren: "ACIK" },
    ],
    enOldurucu5: ["S1", "S2", "S3", "S9"],
  };
  const e = enOlduruculer(sorun);
  assert.equal(e.length, 4);
  assert.equal(e[0].ad, "PS 5.1 komut-aktarim katmani");
  assert.equal(e[0].tekrarYaklasik, 45);
  assert.equal(e[0].fren, "KISMEN");
  assert.equal(e[2].ad, "(sinif kaydi bulunamadi)", "eksik id durust ad tasir");
  assert.deepEqual(enOlduruculer({ siniflar: [] }), []);
  assert.deepEqual(enOlduruculer(null), []);
  const f = frenSayilari({ siniflar: sorun.siniflar });
  assert.deepEqual(f, { ACIK: 1, KISMEN: 1, COGU: 1, diger: 0 });
  assert.deepEqual(frenSayilari(null), { ACIK: 0, KISMEN: 0, COGU: 0, diger: 0 });
});

test("36- sorunBirlesim: gecerli → enOldurucu+fren+fixKuyrugu; bozuk → null", () => {
  const gecerli = sorunBirlesim({ siniflar: [{ id: "S1", ad: "x", fren: "ACIK" }], enOldurucu5: ["S1"], fixKuyrugu: ["F1", 2], damgaISO: "2026-11-01T17:40:00+03:00" });
  assert.equal(gecerli.enOldurucu.length, 1);
  assert.deepEqual(gecerli.frenSayilari, { ACIK: 1, KISMEN: 0, COGU: 0, diger: 0 });
  assert.deepEqual(gecerli.fixKuyrugu, ["F1", "2"], "sayi maddesi metne iner");
  assert.equal(gecerli.damgaISO, "2026-11-01T17:40:00+03:00");
  assert.equal(sorunBirlesim(null), null);
  assert.equal(sorunBirlesim({ siniflar: [] }), null);
  assert.equal(sorunBirlesim("x"), null);
});

test("37- genelSaglikIsigi: kirmizi/sari/yesil tablosu (deterministik simdiMs)", () => {
  const simdi = Date.parse("2026-11-01T18:00:00+03:00");
  const temiz = { kiraEtiketi: "birakildi", fren: { ACIK: 0, KISMEN: 0, COGU: 8, diger: 0 }, son429Ms: Date.parse("2026-11-01T13:00:00Z"), simdiMs: simdi };
  const y = genelSaglikIsigi(temiz);
  assert.equal(y.renk, "yesil", "birakildi NORMAL nobet araligi — uyari degil");
  assert.ok(y.neden.length > 0);
  assert.ok(y.testDurumu.includes("ölçülmedi"));
  assert.equal(genelSaglikIsigi({ ...temiz, fren: { ACIK: 1, KISMEN: 2, COGU: 0, diger: 0 } }).renk, "kirmizi", "ACIK fren kirmizi");
  assert.equal(genelSaglikIsigi({ ...temiz, kiraEtiketi: "bozuk" }).renk, "kirmizi", "kira bozuk kirmizi");
  const s1 = genelSaglikIsigi({ ...temiz, fren: { ACIK: 0, KISMEN: 6, COGU: 4, diger: 0 } });
  assert.equal(s1.renk, "sari", "KISMEN sari");
  assert.ok(s1.neden.join(" ").includes("KISMEN"));
  assert.equal(genelSaglikIsigi({ ...temiz, kiraEtiketi: "bayat" }).renk, "sari", "kira bayat sari");
  assert.equal(genelSaglikIsigi({ ...temiz, son429Ms: simdi - 10 * 60 * 1000 }).renk, "sari", "son 429 kaydi 30 dk icinde sari");
  assert.equal(genelSaglikIsigi({ ...temiz, son429Ms: simdi - 2 * 60 * 60 * 1000 }).renk, "yesil", "429 eskiden ise etkisiz");
  assert.equal(genelSaglikIsigi({ ...temiz, fren: { ACIK: 1, KISMEN: 0, COGU: 0, diger: 0 }, son429Ms: simdi - 10 * 60 * 1000 }).renk, "kirmizi", "kirmizi onceligi");
  assert.equal(genelSaglikIsigi({ kiraEtiketi: null, fren: null, son429Ms: null, simdiMs: simdi }).renk, "yesil", "veri yok → temiz varsayilamaz, neden satiri durust");
});

test("38- grafSayim: durum+aktif alanlarindan durust sayim + kritik-yoldan siradaki 3", () => {
  const gorevler = [];
  for (let i = 1; i <= 7; i++) gorevler.push({ id: "G" + i, gorev: "gorev " + i, aktif: true, durum: "BEKLE (x)" });
  gorevler.push({ id: "G8", gorev: "kapali", aktif: false, durum: "KAPALI (bitti)" });
  gorevler.push({ id: "G9", gorev: "hazir", aktif: true, durum: "HAZIR (planlama)" });
  gorevler.push({ id: "G10", gorev: "kapali2", aktif: false, durum: "KAPALI (bitti2)" });
  const g = grafSayim({ grafSurumu: "v14", gorevler, kritikYol: ["G9", "G8", "G1", "G2", "G3", "G4"] });
  assert.equal(g.toplam, 10);
  assert.equal(g.aktif, 8);
  assert.equal(g.pasif, 2);
  assert.equal(g.tamam, 2);
  assert.equal(g.tamamlanmaOrani, 20, "2/10 = %20");
  assert.equal(g.grafSurumu, "v14");
  assert.deepEqual(g.siradaki3.map((s) => s.id), ["G9", "G1", "G2"], "KAPALI yol uyesi atlanir");
  assert.equal(g.siradaki3[0].ad, "hazir");
  assert.equal(grafSayim(null), null);
  assert.equal(grafSayim({}), null, "gorevler yoksa null");
  assert.equal(grafSayim({ gorevler: [] }).tamamlanmaOrani, null, "0 gorev → oran null (olculmedi)");
});

test("39- modul kaynagi: server'a baglanan cikislar (import sozlesmesi) ucu kapatir", () => {
  const kaynak = readFileSync(new URL("./ordu-birlesim.mjs", import.meta.url), "utf8");
  ok("kadroDogur export", kaynak.includes("export function kadroDogrula"));
  ok("kiraEtiketi export", kaynak.includes("export function kiraEtiketi"));
  ok("kadroBirlesim export", kaynak.includes("export function kadroBirlesim"));
  ok("aktifIsOku export", kaynak.includes("export function aktifIsOku"));
  ok("defterOzet export", kaynak.includes("export function defterOzet"));
  ok("gitHeadOku export", kaynak.includes("export function gitHeadOku"));
  ok("akisTopla export", kaynak.includes("export function akisTopla"));
  ok("saglikBirlesim export", kaynak.includes("export function saglikBirlesim"));
  ok("grafSayim export", kaynak.includes("export function grafSayim"));
  ok("genelSaglikIsigi export", kaynak.includes("export function genelSaglikIsigi"));
  ok("sorunBirlesim export", kaynak.includes("export function sorunBirlesim"));
  ok("logBirlesik export (BOLUM 6)", kaynak.includes("export function logBirlesik"));
  ok("kuyrukOku export (tail deseni)", kaynak.includes("export function kuyrukOku"));
  ok("kisaAjanId export", kaynak.includes("export function kisaAjanId"));
  ok("ajanEslemeKur export", kaynak.includes("export function ajanEslemeKur"));
  ok("modul YAZMAZ (writeSync/writeFile YOK — readSync OK)", !/writeFile|writeSync|appendFile|appendSync/.test(kaynak));
  ok("child_process YOK", !kaynak.includes("child_process"));
});

test("40- diskten GERCEK veriyle duman: graf sayimi + kadro birlesimi + akis (salt-okur)", () => {
  const grafYolu = new URL("../plans/gorev-grafigi-2026-10-26.json", import.meta.url);
  if (!existsSync(grafYolu)) return; // repo disi kosum: vaka sessiz gecer, kaynak-pin vaka 39 kapsar
  const graf = JSON.parse(readFileSync(grafYolu, "utf8"));
  const g = grafSayim(graf);
  assert.ok(g.toplam >= 30, "graf toplam gorev (v14 ~40): " + g.toplam);
  assert.ok(g.aktif >= 10, "aktif DC gorevleri (~16): " + g.aktif);
  assert.ok(g.tamam >= 5, "KAPALI gorevler (~9): " + g.tamam);
  assert.equal(g.siradaki3.length, 3, "kritik yoldan siradaki 3 dolu");
  assert.ok(g.tamamlanmaOrani > 0);
  if (KADRO !== null) {
    const b = kadroBirlesim(KADRO, { yok: true });
    assert.equal(b.birlikler.filter((x) => x.canlilik.canli).length, 0, "kira yok → kimse canli iddia edilmez");
    const cepheler = b.birlikler.filter((x) => typeof x.cephe === "string");
    assert.equal(cepheler.length, 5, "ORDU CEPHESI 5 hat: KOMUTAN/KURMAY-1/NOBET-1/KARTAL-30/DEVIR-1");
  }
});

/* ============ BOLUM 6 (LOG spec eki 2026-11-01): UI kaynak-pini + modul vakalari ============ */

test("41- (BOLUM 6) LOG UI: satir listesi + zaman filtre dugmeleri + tavan + append-only durust satiri", () => {
  const j = jsKisim();
  ok('logAlani', HTML.includes('id="logAlani"'));
  ok('logHata kirmizi yuz', HTML.includes('id="logHata"'));
  ok('logTavan (son 200 kayit etiketi)', HTML.includes('id="logTavan"') && HTML.includes("son 200 kayıt"));
  for (const s of ["1", "6", "24", "168"]) ok('filtre dugmesi data-saat="' + s + '"', HTML.includes('data-saat="' + s + '"'));
  ok("4 filtre dugmesi (1sa/6sa/24sa/7gun)", (HTML.match(/class="filtreBtn"/g) || []).length === 4);
  ok("varsayilan pencere 24sa (aria-pressed)", /data-saat="24" aria-pressed="true"/.test(HTML));
  ok("append-only durust satiri", HTML.includes("kanıt defterleri append-only'dir; panel yalnız pencere gösterir"));
  ok("logYukle fonksiyonu", j.includes("async function logYukle()"));
  ok("logYukle saat parametresi server'a gider (server-side pencere)", j.includes('?saat=" + encodeURIComponent(logSaat)'));
  ok("kisaIdGoster fonksiyonu (UUID -> 8 hane)", j.includes("function kisaIdGoster("));
  ok("turm rozet rengi t-log", HTML.includes(".olayCubuk.t-log"));
  ok("kod adi cozulemezse durust etiket", j.includes('(kod adı çözülmedi)'));
  ok("kaynak dosya yolu satirda (title ile tam yol)", j.includes("k.kaynakDosya"));
  ok("ajanId TAM deger title/aria'da tasinir (iki kez esc'ten gecer)", (j.match(/esc\(k\.ajanId\)/g) || []).length >= 2, "bulunan: " + (j.match(/esc\(k\.ajanId\)/g) || []).length);
  ok("kadro kartinda tam ajanId gri alt-satir", j.includes("ajanIdSatiri") && j.includes("ajanId: ölçülemedi"));
  ok("filtre dugmeleri logSaat'i degistirip yeniden yukler", j.includes("logSaat = s;") && j.includes("LOG_SAATLER.includes(s)"));
});

test("42- kisaAjanId: UUID -> 8 hane; UUID olmayan kimlik TAM; bos/gecersiz -> null", () => {
  assert.equal(kisaAjanId("8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7"), "8cc610a4");
  assert.equal(kisaAjanId("432e03b7-9004-445c-857d-ebf3b6661d53"), "432e03b7");
  assert.equal(kisaAjanId("nobet-ajan-21180"), "nobet-ajan-21180"); // kira kimligi kisaltilmaz
  assert.equal(kisaAjanId("kurmay-oturum"), "kurmay-oturum");
  assert.equal(kisaAjanId(null), null);
  assert.equal(kisaAjanId(undefined), null);
  assert.equal(kisaAjanId(""), null);
  assert.equal(kisaAjanId("   "), null);
  assert.equal(kisaAjanId(12345), null);
});

test("43- kuyrukOku (GD-008/tail): dosya TAMAMI bellekte DEGIL — tail okunca ilk (kesik) satir atlanir", () => {
  const d = mkdtempSync(join(tmpdir(), "ordu-log-tail-"));
  try {
    /* kucuk dosya: TAMAMI okunur, ilk satir DUSMEZ */
    const kucukYol = join(d, "kucuk.jsonl");
    writeFileSync(kucukYol, '{"i":1}\n{"i":2}\n{"i":3}\n', "utf8");
    const k = kuyrukOku(kucukYol);
    assert.equal(k.satirlar.length, 3, "kucuk dosya: 3 satirin TAMAMI");
    assert.equal(k.kesikIlkAtlandi, false);
    assert.ok(k.satirlar[0] === '{"i":1}', "ilk satir yerinde");
    /* buyuk dosya: son 64KB tail — ilk (muhtemelen kesik) satir ATLANIR */
    const satirlar = [];
    satirlar.push('{"i":0,"pad":"BASLANGIC-ISARETI-' + "x".repeat(400) + '"}');
    for (let n = 1; n <= 300; n++) satirlar.push('{"i":' + n + ',"pad":"' + "y".repeat(400) + '"}');
    const buyukYol = join(d, "buyuk.jsonl");
    writeFileSync(buyukYol, satirlar.join("\n") + "\n", "utf8");
    const b = kuyrukOku(buyukYol);
    assert.equal(b.kesikIlkAtlandi, true, "tail okundu — kesik ilk satir atlandi");
    assert.ok(b.satirlar.length >= 100 && b.satirlar.length <= 299, "tail okuma kismi: 64KB / ~430B satir ~ 150 adet (bulunan: " + b.satirlar.length + ")");
    assert.ok(!b.satirlar.some((s) => s.includes("BASLANGIC-ISARETI")), "ilk satir (isaretli) tail okumada YOK");
    for (const s of b.satirlar) JSON.parse(s); // kalan satirlar gecerli JSON
    /* tavan parametresi buyukse: ilk satir dusmez */
    const tam = kuyrukOku(buyukYol, 400000);
    assert.equal(tam.kesikIlkAtlandi, false);
    assert.ok(tam.satirlar.some((s) => s.includes("BASLANGIC-ISARETI")), "tum dosya okununca isaretli ilk satir doner");
    /* dosya yok: bos + bayrak yok */
    const yok = kuyrukOku(join(d, "yok.jsonl"));
    assert.deepEqual(yok, { satirlar: [], kesikIlkAtlandi: false, boyut: 0 });
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("44- ajanEslemeKur: kadro ajanId kayitli + deney kosanPaseo snapshot etiketli", () => {
  const kadro = { birlikler: [
    { kodAdi: "NOBET-1", ajanId: "432e03b7-9004-445c-857d-ebf3b6661d53" },
    { kodAdi: "KURMAY-1" }, // ajanId yok — eslemeye girmez
  ] };
  const deney = { kosanPaseo: [
    { id: "bfda53a3-8e52-4c47-922c-337dfbdf7cca", ad: "deney-manager-g9" },
    { id: "074a43f2-f0bc-4177-a35a-096145be1b78", ad: "074a43f" },
  ] };
  const e = ajanEslemeKur(kadro, deney);
  assert.equal(e.size, 3);
  assert.deepEqual(e.get("432e03b7-9004-445c-857d-ebf3b6661d53"), { kodAdi: "NOBET-1", etiket: "kayitli" });
  assert.equal(e.get("bfda53a3-8e52-4c47-922c-337dfbdf7cca").etiket, "snapshot");
  assert.equal(e.get("bfda53a3-8e52-4c47-922c-337dfbdf7cca").kodAdi, "deney-manager-g9");
  assert.equal(ajanEslemeKur(null, null).size, 0);
  assert.equal(ajanEslemeKur(null, deney).size, 2);
});

test("45- logBirlesik: 4 kaynak tek dizide (en yeni once) + saat penceresi + tavan + bozuk tolerans", () => {
  const d = mkdtempSync(join(tmpdir(), "ordu-log-birlesik-"));
  try {
    mkdirSync(join(d, "handoff"), { recursive: true });
    const kiraYol = join(d, "kira-log.jsonl");
    writeFileSync(kiraYol, JSON.stringify({ tur: "devir", oncekiKimlik: "nobet-ajan-21180", kimlik: "nobet-ajan-21180", devirSinifi: "nobet", damga: "2026-11-01T14:37:59.172Z", sebep: "birakildi" }) + "\n" +
      JSON.stringify({ tur: "ilk-kira", kimlik: "kurmay-oturum-1", devirSinifi: "operator", damga: "2026-11-01T13:30:00.000Z", pid: 5 }) + "\n", "utf8");
    const defterYol = join(d, "429-defter.jsonl");
    writeFileSync(defterYol, JSON.stringify({ damgaISO: "2026-11-01T14:23:41.633Z", agentId: "432e03b7-9004-445c-857d-ebf3b6661d53", provider: "glm53u-codex", hataSinifi: "http-429" }) + "\n" +
      JSON.stringify({ damgaISO: "2026-11-01T14:31:15.298Z", agentId: "2df1e48f-413d-4d3a-9461-658a32ce5fbf", provider: "glm53u-codex", hataSinifi: "http-429" }) + "\n", "utf8");
    const deneyYol = join(d, "deney-log.jsonl");
    writeFileSync(deneyYol, JSON.stringify({ t: "2026-10-29T14:18:01.000Z", tur: "manager-yanit", metin: "yanit", aktor: "ai-manager:glm-5.3" }) + "\n" +
      JSON.stringify({ t: "t", tur: "duzeltme", metin: "bozuk damga" }) + "\n" + // bozuk t — atlanir + sayilir
      JSON.stringify({ t: "2026-10-29T16:48:31", tur: "envanter", metin: "envanter cekildi" }) + "\n", "utf8");
    writeFileSync(join(d, "handoff", "HANDOFF-TEST-1.md"), "# test handoff\n", "utf8");
    const esleme = ajanEslemeKur(
      { birlikler: [{ kodAdi: "NOBET-1", ajanId: "432e03b7-9004-445c-857d-ebf3b6661d53" }] },
      { kosanPaseo: [{ id: "bfda53a3-8e52-4c47-922c-337dfbdf7cca", ad: "deney-manager-g9" }] },
    );
    const simdiMs = Date.parse("2026-11-01T15:00:00.000Z");

    /* (a) birlesik sira: en yeni once; kayit semasi tam */
    const r = logBirlesik({ kiraLogYolu: kiraYol, defterYolu: defterYol, handoffDir: join(d, "handoff"), deneyLogYolu: deneyYol, esleme, saat: null, simdiMs });
    assert.equal(r.atlanan, 1, "bozuk damgali deney kaydi atlandi + SAYILDI");
    const turler = r.kayitlar.map((k) => k.tur).sort();
    assert.deepEqual(turler, ["429", "429", "handoff", "kira", "kira", "log", "log"], "4 kaynaktan 7 kayit (bozuk damgali 1 atlandi): " + turler.join(","));
    for (const k of r.kayitlar) {
      for (const alan of ["zamanISO", "tur", "kodAdi", "ajanId", "detay", "kaynakDosya"]) assert.ok(alan in k, "kayit alani: " + alan);
      assert.ok(Number.isFinite(Date.parse(k.zamanISO)), "zamanISO gecerli ISO");
    }
    const zamanlar = r.kayitlar.map((k) => Date.parse(k.zamanISO));
    for (let i = 1; i < zamanlar.length; i++) assert.ok(zamanlar[i - 1] >= zamanlar[i], "kronolojik (en yeni once)");
    /* (b) kod adi cozumu: kira devirSinifi + defter esleme + snapshot manager */
    const kiraNobet = r.kayitlar.find((k) => k.tur === "kira" && k.detay.includes("devir"));
    assert.equal(kiraNobet.kodAdi, "NOBET-1", "kira devirSinifi nobet -> NOBET-1");
    assert.equal(kiraNobet.ajanId, "nobet-ajan-21180", "kira kimligi ajanId olarak tasınır (kisaltilmaz)");
    const defterBilinen = r.kayitlar.find((k) => k.tur === "429" && k.ajanId === "432e03b7-9004-445c-857d-ebf3b6661d53");
    assert.equal(defterBilinen.kodAdi, "NOBET-1", "defter agentId eslemeden cozuldu");
    const defterBilinmeyen = r.kayitlar.find((k) => k.tur === "429" && k.ajanId === "2df1e48f-413d-4d3a-9461-658a32ce5fbf");
    assert.equal(defterBilinmeyen.kodAdi, null, "eslesmeyen agentId: kodAdi null (uydurulmaz)");
    const manager = r.kayitlar.find((k) => k.tur === "log" && k.ajanId !== null);
    assert.equal(manager.kodAdi, "deney-manager-g9 (snapshot)", "deney aktor -> snapshot etiketli kod adi");
    /* (c) saat penceresi: 15:00 - 1sa = 14:00 esigi; 13:30 kira ve 10-29 kayitlari duser */
    const p = logBirlesik({ kiraLogYolu: kiraYol, defterYolu: defterYol, handoffDir: join(d, "handoff"), deneyLogYolu: deneyYol, esleme, saat: 1, simdiMs });
    assert.ok(p.kayitlar.every((k) => Date.parse(k.zamanISO) >= Date.parse("2026-11-01T14:00:00.000Z")), "pencere disi kayit YOK");
    assert.ok(p.penceredeToplam >= 3 && p.penceredeToplam <= 5, "pencerede kayit sayisi durust (bulunan: " + p.penceredeToplam + ")");
    /* (d) tavan: son N kayit */
    const t = logBirlesik({ kiraLogYolu: kiraYol, defterYolu: defterYol, handoffDir: join(d, "handoff"), deneyLogYolu: deneyYol, esleme, saat: null, simdiMs, tavan: 2 });
    assert.equal(t.kayitlar.length, 2, "tavan 2 -> en yeni 2 kayit");
    assert.equal(t.tavan, 2);
    /* (e) kaynaklar YOK: bos dizi + hata YOK (durust bos) */
    const bos = logBirlesik({ kiraLogYolu: join(d, "yok1"), defterYolu: join(d, "yok2"), handoffDir: join(d, "yok3"), deneyLogYolu: join(d, "yok4"), esleme: new Map(), saat: null, simdiMs });
    assert.deepEqual(bos.kayitlar, []);
    assert.equal(bos.atlanan, 0);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("46- server.js kaynak-pini: /api/ordu/log ucu + saat dogrulama + mevcut uclar AYNEN (regresyon pini)", () => {
  let srv = "";
  try { srv = readFileSync(new URL("./server.js", import.meta.url), "utf8"); } catch { srv = ""; }
  ok("server.js okunur", srv.length > 0);
  ok("/api/ordu/log ucu", srv.includes('"/api/ordu/log"'));
  ok("saat dogrulama dar-liste (1|6|24|168)", srv.includes('["1", "6", "24", "168"].includes(saatHam)'));
  ok("gecersiz saat -> 422 RED", srv.includes("gecersiz saat filtresi"));
  ok("LOG_TAVAN 200", srv.includes("LOG_TAVAN = 200"));
  ok("kira-log yolu sabiti", srv.includes('join(ORDU_KOK, "core", "data", "devir-kira.json-log.jsonl")'));
  ok("deney log/ajanlar yolu sabitleri", srv.includes('"log.jsonl"') && srv.includes('"ajanlar.json"'));
  ok("append-only notu uctan doner", srv.includes("appendOnlyNotu"));
  ok("ajan esleme ucta kurulur", srv.includes("ajanEslemeKur"));
  ok("logBirlesik ucta cagrilir", srv.includes("logBirlesik"));
  /* mevcut uclar AYNEN (ekleme-only sozlesmesi) */
  for (const u of ['"/api/graf"', '"/api/veri"', '"/api/repolar"', '"/api/kart"', '"/api/atama/durum"', '"/tuval"']) {
    ok("mevcut uc yerinde: " + u, srv.includes("url.pathname === " + u));
  }
  ok("yazma uclari: mevcut 4 + FAZ-A /api/mesaj = 5 POST (bilincl genisletme — K-0060 TASLAK)", (srv.match(/req\.method === "POST"/g) || []).length === 5, "bulunan POST ucu: " + (srv.match(/req\.method === "POST"/g) || []).length);
  ok("/api/mesaj ucu (FAZ-A: Composer gonderim)", srv.includes('"/api/mesaj"'));
  ok("server.js'e child_process GELMEDI (spawn yalnız paseo-kopru.mjs'te)", !srv.includes("child_process") && srv.includes('from "./paseo-kopru.mjs"'));
  ok("token kapisi mesaj ucunda aynen (403/401)", srv.includes("mesaj gonderme kapali (fail-closed)"));
  ok("hedef beyaz liste projelerTara'dan (30sn TTL) + min 2sn aralik", srv.includes("hedefBeyazListe()") && srv.includes("GONDERIM_ARALIK_MS"));
  ok("kopru zinciri cozumsuz -> 503 (fail-closed)", srv.includes("kopru zinciri cozumlenemedi"));
});

/* ===================== (6) STEERING-5/6 — gorev emri + SSOT rol modeli ===================== */

// Sentetik kadro hamuru (kadroDogrula nesne alir — dosya GEREKMEZ; hermetik).
const emirSablonu = () => ({ hedef: "h", ciktiFormati: "f", aracKaynak: "a", gorevSiniri: { yapar: ["y"], yapmaz: ["n"] }, ozet: "o" });
const temelBirlik = (kodAdi, uzerine = {}) => ({
  kodAdi, rol: "rol", gorev: "gorev", hedef: "hedef", kaynakAciklama: "kaynak",
  tur: "asker", canliKaynak: "statik", dosyalar: [], ...uzerine,
});
const temelKadro = (birlikler, rolAtamasi) => ({ surum: 9, damgaISO: "2026-11-01T12:00:00Z", birlikler, rolAtamasi });

test("47- kadro sema (STEERING-5/6): gorevEmri 4 alan + roller SSOT + rolAtamasi N:M — anahtarlar SSOT 5'i birebir", () => {
  ok("kadro okunur", KADRO !== null);
  if (KADRO === null) return;
  const SSOT5 = ["CODER", "GOZLEMCI", "INSAN-VEKILI-PROXY", "MANAGER", "TESTER"];
  assert.deepEqual(Object.keys(KADRO.rolAtamasi).sort(), SSOT5, "rolAtamasi anahtarlari graf SSOT 5 cekirdek rolu birebir (STEERING-6)");
  for (const b of KADRO.birlikler) {
    ok(b.kodAdi + ": gorevEmri 4 alan + ozet dolu", ["hedef", "ciktiFormati", "aracKaynak", "ozet"].every((a) => typeof b.gorevEmri[a] === "string" && b.gorevEmri[a].trim().length > 0));
    ok(b.kodAdi + ": gorevSiniri yapar/yapmaz dolu metin dizileri", Array.isArray(b.gorevEmri.gorevSiniri.yapar) && b.gorevEmri.gorevSiniri.yapar.length > 0 && Array.isArray(b.gorevEmri.gorevSiniri.yapmaz) && b.gorevEmri.gorevSiniri.yapmaz.length > 0);
    ok(b.kodAdi + ": roller SSOT sozlugunde (KULLANICI tek istisna — insan)", Array.isArray(b.roller) && b.roller.length > 0 && b.roller.every((r) => SSOT5.includes(r) || r === "KULLANICI"));
  }
  const komutan = KADRO.birlikler.find((b) => b.kodAdi === "KOMUTAN");
  const kurmay = KADRO.birlikler.find((b) => b.kodAdi === "KURMAY-1");
  const nobet = KADRO.birlikler.find((b) => b.kodAdi === "NOBET-1");
  const kartal = KADRO.birlikler.find((b) => b.kodAdi === "KARTAL-30");
  const devir1 = KADRO.birlikler.find((b) => b.kodAdi === "DEVIR-1");
  assert.deepEqual(komutan.roller, ["KULLANICI"], "KOMUTAN insan (KULLANICI) — alt-ajan degil");
  assert.deepEqual(kurmay.roller, ["MANAGER", "TESTER"], "KURMAY-1: tek ajan cok-rol (N:M)");
  ok("KURMAY-1 uzmanligi graf-kurmaciyi UST etiket olarak tasir (ayri cekirdek rol DEGIL)", kurmay.uzmanlik.includes("graf-kurmacı"));
  assert.deepEqual(nobet.roller, ["CODER"]);
  ok("NOBET-1 uzmanligi nobetci", nobet.uzmanlik.includes("nöbetçi"));
  assert.deepEqual(kartal.roller, ["GOZLEMCI"]);
  ok("KARTAL-30 uzmanligi olcucu", kartal.uzmanlik.includes("ölçücü"));
  assert.deepEqual(devir1.roller, ["TESTER"]);
  ok("DEVIR-1 uzmanligi devir-dogrulayici", devir1.uzmanlik.includes("devir-doğrulayıcı"));
  assert.deepEqual(KADRO.rolAtamasi.MANAGER, ["KURMAY-1"]);
  assert.deepEqual(KADRO.rolAtamasi.CODER, ["NOBET-1"]);
  assert.deepEqual(KADRO.rolAtamasi.TESTER, ["KURMAY-1"], "TESTER de KURMAY-1'de (manager ile ayni ajan)");
  assert.deepEqual(KADRO.rolAtamasi["INSAN-VEKILI-PROXY"], [], "bos dizi = atanmadi (durust etiket)");
  assert.deepEqual(KADRO.rolAtamasi.GOZLEMCI, ["KARTAL-30"]);
  const kodlar = new Set(KADRO.birlikler.map((b) => b.kodAdi));
  for (const [rol, adlar] of Object.entries(KADRO.rolAtamasi)) {
    for (const a of adlar) ok("rolAtamasi kod adi kadroda tanimli: " + rol + " -> " + a, kodlar.has(a));
  }
  /* sentetik N:M vaka: tek rol cok ajan (kadroDogrula gecerli der) */
  const cokAjan = temelKadro([
    temelBirlik("A-1", { roller: ["CODER"], gorevEmri: emirSablonu() }),
    temelBirlik("B-1", { roller: ["CODER"], gorevEmri: emirSablonu() }),
  ], { MANAGER: [], CODER: ["A-1", "B-1"], TESTER: [], "INSAN-VEKILI-PROXY": [], GOZLEMCI: [] });
  assert.equal(kadroDogrula(cokAjan), true, "tek rol cok ajan (CODER: A-1 + B-1) gecerli");
});

test("48- kadroDogrula RED (STEERING-5/6): gorevEmri eksik alan · gorevSiniri eksik · roller SSOT-disi · uzmanlik bos · rolAtamasi SSOT-disi anahtar/tanimsiz kod adi", () => {
  const gecerliEmir = emirSablonu();
  const red = (k, desen) => assert.throws(() => kadroDogrula(k), desen);
  red(temelKadro([temelBirlik("A-1", { gorevEmri: { ...gecerliEmir, hedef: "" } })]), /gorevEmri alani zorunlu ve dolu metin: hedef/);
  red(temelKadro([temelBirlik("A-1", { gorevEmri: { ...gecerliEmir, gorevSiniri: { yapar: ["y"] } } })]), /gorevSiniri \{yapar:\[\], yapmaz:\[\]\} metin dizileri/);
  red(temelKadro([temelBirlik("A-1", { roller: ["graf-kurmacı"] })]), /rol adi SSOT sozlugunde degil/);
  red(temelKadro([temelBirlik("A-1", { uzmanlik: " " })]), /uzmanlik dolu metin olmak zorunda/);
  const bosRolHaritasi = { MANAGER: [], CODER: [], TESTER: [], "INSAN-VEKILI-PROXY": [], GOZLEMCI: [] };
  red(temelKadro([temelBirlik("A-1", { roller: ["MANAGER"] })], { ...bosRolHaritasi, "graf-kurmacı": ["A-1"] }), /rolAtamasi anahtari SSOT cekirdek rolu olmak zorunda/);
  red(temelKadro([temelBirlik("A-1", { roller: ["MANAGER"] })], { ...bosRolHaritasi, MANAGER: ["HAYALET-9"] }), /rolAtamasi kadroda TANIMSIZ kod adi: HAYALET-9/);
  /* STEERING-6 vaka: anahtarlar SSOT 5'i tam kullanan kadro gecer (kelime seviyesinde senkron) */
  const ssotTam = temelKadro([temelBirlik("A-1", { roller: ["MANAGER", "GOZLEMCI"], gorevEmri: gecerliEmir })], { ...bosRolHaritasi, MANAGER: ["A-1"], GOZLEMCI: ["A-1"] });
  assert.equal(kadroDogrula(ssotTam), true);
});

test("49- render (STEERING-5/6): GOREV EMRI blogu 4 etiket + roller (SSOT) satiri + ROL ATAMASI + senkron durust satiri (vm davranis)", () => {
  const j = jsKisim();
  ok("GOREV EMRI basligi (emirBaslik)", j.includes("GÖREV EMRİ"));
  for (const e of ["<b>hedef:</b>", "<b>çıktı formatı:</b>", "<b>araç/kaynak:</b>", "<b>sınır — yapar:</b>", "<b>sınır — yapmaz:</b>", "<b>özet:</b>"]) {
    ok("emir etiketi: " + e, j.includes(e));
  }
  ok("emirBlok CSS", /\.emirBlok\s*\{/.test(HTML));
  ok("rolSatiri CSS", /\.rolSatiri\s*\{/.test(HTML));
  ok("atanmadiEtiket CSS (bos dizi durust)", /\.atanmadiEtiket\s*\{/.test(HTML));
  ok("roller (SSOT) satiri kartta", j.includes("roller (SSOT):"));
  ok("uzmanlik UST etiketi kartta", j.includes("uzmanlık: "));
  ok("ROL ATAMASI satiri (bolum basi)", j.includes("ROL ATAMASI"));
  ok("SSOT sabitleri sayfada", j.includes("const SSOT_ROLLER =") && j.includes("const ROL_ETIKET_TR ="));
  ok("Turkce etiket haritasi (render-only)", j.includes("Yönetici") && j.includes("Yazıcı") && j.includes("Denetçi") && j.includes("İnsan-Vekili") && j.includes("Gözlemci"));
  ok("dalgaYaz rol + senkron satirlarini cagirir", j.includes("rolAtamasiSatiri()") && j.includes("senkronSatiri()"));
  ok("senkron durust cumlesi (kopya yok)", j.includes("Tek kaynak: kadro + görev-grafigi JSON — panel salt-okur; insan görünümü ve makine okuması aynı dosyadan gelir"));
  ok("spawn senkronu 'otomatiktir' DENMEZ", j.includes("Spawn senkronu otomatik DEĞİLDİR"));
  /* --- davranis: cepheKutusu gorev emri blogu uretir (vm; esc + rol sabitleri context'te) --- */
  const escFn = fnAl("esc");
  const sabitA = HTML.indexOf("const SSOT_ROLLER");
  const sabitB = HTML.indexOf("const $ =");
  ok("SSOT sabit blogu yerinde", sabitA >= 0 && sabitB > sabitA);
  const cepheA = HTML.indexOf("function cepheKutusu(");
  const rolA = HTML.indexOf("function rolAtamasiSatiri");
  const rolB = HTML.indexOf("function dalgaYaz()");
  ok("cepheKutusu + rol fonksiyonlari yerinde", cepheA >= 0 && rolA > cepheA && rolB > rolA);
  const cepheFn = vm.runInNewContext(HTML.slice(sabitA, sabitB) + "\n" + HTML.slice(cepheA, rolA) + "\ncepheKutusu", { esc: escFn });
  const ornek = {
    kodAdi: "TEST-1", rol: "test", roller: ["CODER"], uzmanlik: "nöbetçi (test)",
    cephe: "cephe", hedef: "hedef", dosyalar: [], denetim: "denetim", kaynakAciklama: "kaynak",
    canlilik: { canli: false, etiket: "durum bilinmiyor" },
    gorevEmri: { hedef: "<script>h</script> amacı", ciktiFormati: "rapor MD", aracKaynak: "dosyalar", gorevSiniri: { yapar: ["yazar"], yapmaz: ["commit/push"] }, ozet: "kısa özet" },
  };
  const kart = cepheFn(ornek);
  ok("kart GOREV EMRI blogu uretir", kart.includes("GÖREV EMRİ"));
  ok("emir hedefi esc'ten gecer (XSS yuku zararsiz)", kart.includes("&lt;script&gt;h&lt;/script&gt; amacı"));
  ok("emir 4 etiket + ozet kartta", kart.includes("hedef:</b>") && kart.includes("çıktı formatı:</b>") && kart.includes("araç/kaynak:</b>") && kart.includes("sınır — yapar:</b> yazar") && kart.includes("sınır — yapmaz:</b> commit/push") && kart.includes("özet:</b>"));
  ok("roller (SSOT) Turkce etiket + SSOT anahtari ile", kart.includes("Yazıcı [CODER]"));
  ok("uzmanlik ust etiketi kartta", kart.includes("uzmanlık: nöbetçi (test)"));
  /* --- davranis: rolAtamasiSatiri + senkronSatiri (vm; K context global'i) --- */
  ok("kadro davranis testi icin okunur", KADRO !== null);
  if (KADRO === null) return;
  const ctx = { K: KADRO, esc: escFn };
  const fns = vm.runInNewContext(HTML.slice(sabitA, sabitB) + "\n" + HTML.slice(rolA, rolB) + "\n[rolAtamasiSatiri, senkronSatiri]", ctx);
  const gercek = fns[0]();
  ok("ROL ATAMASI satiri SSOT anahtar listesiyle", gercek.includes("ROL ATAMASI") && gercek.includes("MANAGER · CODER · TESTER · INSAN-VEKILI-PROXY · GOZLEMCI"));
  ok("gercek atamalar: Yonetici/Yazici/Denetci/Gozlemci", gercek.includes("Yönetici → KURMAY-1") && gercek.includes("Yazıcı → NOBET-1") && gercek.includes("Denetçi → KURMAY-1") && gercek.includes("Gözlemci → KARTAL-30"));
  ok("bos dizi 'atanmadi' durust etiketi", gercek.includes("İnsan-Vekili → <span class=\"atanmadiEtiket\">atanmadı</span>"));
  ok("ayni ajanda birden fazla rol notu (tek ajan cok-rol)", gercek.includes("şu an birden fazla rol aynı ajanda: KURMAY-1 (Yönetici + Denetçi)"));
  ctx.K = { rolAtamasi: { MANAGER: ["A-1"], CODER: ["A-1", "B-1"], TESTER: [], "INSAN-VEKILI-PROXY": [], GOZLEMCI: [] } };
  const sentetik = fns[0]();
  ok("tek rol cok ajan: 'Yazici -> A-1 . B-1'", sentetik.includes("Yazıcı → A-1 · B-1"));
  ok("sentetikte de bos dizi 'atanmadi'", sentetik.includes("atanmadı"));
  ctx.K = { rolAtamasi: { MANAGER: ["<script>"], CODER: [], TESTER: [], "INSAN-VEKILI-PROXY": [], GOZLEMCI: [] } };
  ok("kod adi esc'ten gecer", fns[0]().includes("&lt;script&gt;"));
  ctx.K = null;
  assert.equal(fns[0](), "", "kadro yokken rol satiri bos (crash yok)");
  const senk = fns[1]();
  ok("senkron satiri Tek kaynak cumlesi", senk.includes("Tek kaynak: kadro + görev-grafigi JSON") && senk.includes("aynı dosyadan gelir"));
  ok("senkron satiri spawn durustlugu", senk.includes("otomatik DEĞİLDİR"));
});

/* ===================== (7) STEERING-7 — Paseo proje durumlari (canli tarama) ===================== */

test("50- projelerTara (STEERING-7): agents dizin taramasi + durum/saglayici sayimlari + bozuk tolerans + systemPrompt SIZMAZ", () => {
  const tmp = tempKok();
  try {
    const ag = join(tmp, "agents");
    mkdirSync(join(ag, "P-alfa"), { recursive: true });
    mkdirSync(join(ag, "P-beta"), { recursive: true });
    mkdirSync(join(ag, "P-bos"), { recursive: true }); /* ajani hic dogmamis — listede gorunmez */
    mkdirSync(join(ag, "P-gamma"), { recursive: true }); /* 6 ajan — sonAjanlar 5 tavani */
    const kayit = (id, provider, durum, etkinlik) => JSON.stringify({
      id, provider, cwd: "D:\\x", lastStatus: durum, lastActivityAt: etkinlik,
      title: "kararsız başlık", config: { systemPrompt: "SÖZLEŞME CEKIRDEK — gizli sozlesme metni" },
    });
    writeFileSync(join(ag, "P-alfa", "11111111-1111-4111-8111-111111111111.json"), kayit("11111111-1111-4111-8111-111111111111", "glm53u-claude", "running", "2026-11-01T10:00:00Z"));
    writeFileSync(join(ag, "P-alfa", "22222222-2222-4222-8222-222222222222.json"), kayit("22222222-2222-4222-8222-222222222222", "glm53u-codex", "closed", "2026-11-01T12:00:00Z"));
    writeFileSync(join(ag, "P-beta", "33333333-3333-4333-8333-333333333333.json"), kayit("33333333-3333-4333-8333-333333333333", "glm53u-claude", "idle", "2026-11-01T11:00:00Z"));
    writeFileSync(join(ag, "P-beta", "bozuk.json"), "{bozuk json");
    writeFileSync(join(ag, "P-beta", "id-siz.json"), JSON.stringify({ provider: "x" }));
    writeFileSync(join(ag, "P-beta", "not-ascii.txt"), "json DEGIL — yoksayilir");
    for (let i = 0; i < 6; i++) {
      const id = String(10000000 + i) + "-0000-4000-8000-" + String(100000000000 + i);
      writeFileSync(join(ag, "P-gamma", id + ".json"), kayit(id, "glm53u-claude", "idle", "2026-11-01T0" + i + ":00:00Z"));
    }
    const r = projelerTara(tmp, { orduDizinAdi: "P-alfa" });
    assert.deepEqual(r.projeler.map((p) => p.dizin), ["P-alfa", "P-beta", "P-gamma"], "alfabetik; bos dizin (ajan dogmamis) gorunmez");
    assert.equal(r.atlanan, 2, "bozuk JSON + id-siz kayit atlanir ve SAYILIR");
    const alfa = r.projeler[0];
    assert.equal(alfa.projeAdi, "P-alfa", "projeAdi dizin basename'i (title degil)");
    assert.equal(alfa.ajanSayisi, 2);
    assert.equal(alfa.orduMu, true, "orduDizinAdi eslesen kayit isaretlenir");
    assert.deepEqual(alfa.durumSayilari, { running: 1, idle: 0, error: 0, closed: 1, diger: 0 });
    assert.deepEqual(alfa.saglayicilar, { "glm53u-claude": 1, "glm53u-codex": 1 });
    assert.equal(alfa.sonEtkinlikISO, "2026-11-01T12:00:00Z", "sonEtkinlik = max lastActivityAt");
    assert.equal(alfa.sonAjanlar[0].ajanId, "22222222", "8-hane onek + en yeni once");
    assert.equal(alfa.sonAjanlar.length, 2);
    const beta = r.projeler[1];
    assert.equal(beta.orduMu, false);
    assert.equal(beta.ajanSayisi, 1, "bozuk/id-siz/txt dosyalar sayima girmez");
    assert.deepEqual(beta.durumSayilari, { running: 0, idle: 1, error: 0, closed: 0, diger: 0 });
    const gamma = r.projeler[2];
    assert.equal(gamma.sonAjanlar.length, 5, "sonAjanlar tavani 5");
    assert.equal(gamma.ajanSayisi, 6);
    /* FAZ-A (PANEL-EXPLORER-1): ajanlar TAM listesi — Composer hedef seçiminin veri kaynağı */
    assert.ok(Array.isArray(alfa.ajanlar) && alfa.ajanlar.length === 2, "ajanlar TAM listesi projede tasınır");
    assert.equal(alfa.ajanlar[0].ajanKimligi, "11111111-1111-4111-8111-111111111111", "ajanKimligi TAM uuid");
    assert.equal(alfa.ajanlar[0].ajanId, "11111111", "kisa onek korunur");
    assert.ok(alfa.ajanlar.every((a) => "lastStatus" in a && "sonEtkinlikISO" in a && "provider" in a && "etiket" in a), "her ajan kaydi 6 alani tasir (ajanKimligi/ajanId/lastStatus/sonEtkinlikISO/provider/etiket)");
    assert.ok(alfa.sonAjanlar.every((s) => alfa.ajanlar.some((a) => a.ajanId === s.ajanId)), "sonAjanlar ajanlar listesiyle uyumlu");
    assert.equal(gamma.ajanlar.length, 6, "gamma ajanlar TAM liste (tavansiz — sonAjanlar degil)");
    const metin = JSON.stringify(r);
    ok("systemPrompt YANITA SIZMAZ", !metin.includes("systemPrompt"));
    ok("sozlesme metni YANITA SIZMAZ", !metin.includes("SÖZLEŞME"));
    ok("ajan title YALNIZ etiket alaninda ham deger olarak tasınır (FAZ-A bilinçli değişim; UI'da esc() ile)", metin.includes("kararsız başlık") && alfa.ajanlar.every((a) => a.etiket === "kararsız başlık"));
    /* agents dizini yok / bos: hata DEGIL — bos liste (durust) */
    assert.deepEqual(projelerTara(join(tmp, "yok")), { projeler: [], atlanan: 0 });
    mkdirSync(join(tmp, "bos-agents", "agents"), { recursive: true });
    assert.deepEqual(projelerTara(join(tmp, "bos-agents")).projeler, [], "bos agents dizini -> bos proje listesi");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("51- FAZ-B kaynak-pin: /api/ordu/projeler ucu (PASEO_EV + her istekte diskten) + UI tablo davranisi (vm) + composer + POST sayisi", () => {
  let srv = "";
  try { srv = readFileSync(new URL("./server.js", import.meta.url), "utf8"); } catch { srv = ""; }
  ok("server.js okunur", srv.length > 0);
  ok("/api/ordu/projeler ucu", srv.includes('"/api/ordu/projeler"'));
  ok("PASEO_EV sabiti (varsayilan USERPROFILE\\.paseo)", srv.includes("process.env.PASEO_EV ||"));
  ok("projelerTara ucta cagrilir (her istekte diskten — bayat onbellek yok)", srv.includes("projelerTara(PASEO_EV"));
  ok("ordu dizin adi koke hesaplanir — boli isaretleri VE surucu iki noktasi tireye (olcumle kanitlandi: D:\\Vibecode\\ordu -> D-Vibecode-ordu)", srv.includes("ORDU_DIZIN_ADI") && srv.includes(".replace(/[\\\\/:]+/g, \"-\")"));
  ok("kapsam notu uctan doner", srv.includes("kapsamNotu"));
  ok("yazma uclari: mevcut 4 + FAZ-A /api/mesaj = 5 POST (bilincl genisletme)", (srv.match(/req\.method === "POST"/g) || []).length === 5, "bulunan POST ucu: " + (srv.match(/req\.method === "POST"/g) || []).length);
  const j = jsKisim();
  ok("UC.projeler sabiti", j.includes('"/api/ordu/projeler"'));
  ok("projelerYukle cek ile cagirir", j.includes("await cek(UC.projeler)"));
  ok("FAZ-B: tarama olurse P=null (bayat tablo verisi kalmaz)", j.includes("P = null"));
  ok("FAZ-B: tablo fail-closed: veri yoksa kirmizi yuz + icerik bosalir", j.includes('kirmiziYuzGoster("projeHata", "projeTabloIci"'));
  /* --- composer: İKİ AYRI optgroup — manager ile proje ajanı KARIŞMAZ (operatör emri) --- */
  ok("composer hedef select (bolum-composer + composerHedef)", HTML.includes('id="bolum-composer"') && HTML.includes('id="composerHedef"'));
  ok("optgroup 1: ORDU YÖNETİM (kadro rolAtamasi.MANAGER)", j.includes('optgroup label="ORDU YÖNETİM"') && j.includes("K.rolAtamasi.MANAGER"));
  ok("optgroup 2: SEÇİLİ PROJENİN AJANLARI", j.includes("AJANLARI"));
  ok("KURMAY-1 grubu DISK taramasiyla kesisir (yoksa devre-disi dürüst seçenek)", j.includes("diskAjanKumesi()") && j.includes("disk taramasında yok (gönderilemez)"));
  ok("yönetim kimlikleri proje grubunda HARİÇ tutulur (KARIŞMAZ pini)", j.includes("yonetimKumesi.has(a.ajanKimligi)"));
  ok("gönderim: POST /api/mesaj + token başlığı + gonderiliyor durumu", j.includes('"/api/mesaj"') && j.includes('"x-pano-token"') && j.includes("gönderiliyor…"));
  ok("token input (değer AKLA girmez — yalnız başlıkta)", HTML.includes('<input id="token" type="password"') && !j.includes('kaydet("token"'));
  ok("composer textarea + 4096 tavan", HTML.includes('id="composerMesaj"') && HTML.includes('maxlength="4096"'));
  ok("PANEL-CHAT-1: sağ panel CHAT — oturum listesi + dürüst oturum notu (eski konusmaKart 'geçmiş YOK' notu BİLİNÇLİ değişti)", HTML.includes('id="chatListe"') && HTML.includes('role="log"') && HTML.includes("Bu oturumda gönderilenler — yenileyince temizlenir"));
  ok("yenileme girdi koruması: odakIcindeMi + gonderiyor bayrağı", j.includes("function odakIcindeMi(") && j.includes("let gonderiyor = false") && j.includes('odakIcindeMi("#bolum-composer")'));
  ok("ağaç yenilenmesi odakta atlanır (activeElement ezilmez)", j.includes('odakIcindeMi("#bolum-agac")'));
  /* davranis (vm): projeTabloYaz sahte DOM ile — tablo satırları, durum dağılımı, OLCUM ANI, esc */
  const tabloA = HTML.indexOf("function projeTabloYaz()");
  const tabloB = HTML.indexOf('document.querySelectorAll(".filtreBtn")');
  ok("projeTabloYaz yerinde (FAZ-B: kartYaz'ın tablo hali)", tabloA >= 0 && tabloB > tabloA);
  const sahte = {};
  const sahte$ = (id) => (sahte[id] = sahte[id] || { innerHTML: "", textContent: "", hidden: true });
  const tabloFn = vm.runInNewContext(HTML.slice(tabloA, tabloB) + "\nprojeTabloYaz", {
    $: sahte$, esc: fnAl("esc"), kisaIdGoster: fnAl("kisaIdGoster"),
    kirmiziYuzKapat: () => {}, kirmiziYuzGoster: () => {},
    UC: { projeler: "/api/ordu/projeler" },
    NOKTA_SINIF: { running: "yesil", idle: "gri", error: "kirmizi", closed: "kapali" },
    P: {
      olcumAniISO: "2026-11-01T18:00:00Z", atlanan: 1,
      projeler: [{
        dizin: "P-x", projeAdi: "P-x", ajanSayisi: 2, sonEtkinlikISO: "2026-11-01T12:00:00Z",
        durumSayilari: { running: 1, idle: 1, error: 0, closed: 0, diger: 0 },
        saglayicilar: { "glm53u-claude": 2 },
        ajanlar: [
          { ajanKimligi: "8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7", ajanId: "8cc610a4", lastStatus: "running", sonEtkinlikISO: "2026-11-01T12:00:00Z", provider: "glm53u-claude", etiket: "<script>inject</script>" },
          { ajanKimligi: "432e03b7-9004-445c-857d-ebf3b6661d53", ajanId: "432e03b7", lastStatus: "idle", sonEtkinlikISO: "2026-11-01T11:00:00Z", provider: "glm53u-claude", etiket: null },
        ],
        orduMu: true,
      }],
    },
    aktifSekme: "P-x",
  });
  tabloFn();
  const ic = sahte.projeTabloIci.innerHTML;
  ok("tablo: durum dagilimi başlıkta (running 1 · idle 1)", sahte.projeTabloOzet.innerHTML.includes("running 1") && sahte.projeTabloOzet.innerHTML.includes("idle 1"));
  ok("tablo: satır = konuşma (kısa kimlik hücreleri)", ic.includes("8cc610a4") && ic.includes("432e03b7"));
  ok("tablo: TAM kimlik title'da (gönderim hedefi doğrulanabilir)", ic.includes('title="8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7"'));
  ok("tablo: son etkinlik + sağlayıcı sütunları", ic.includes("2026-11-01T12:00:00Z") && ic.includes("glm53u-claude"));
  ok("tablo: etiket esc'ten gecer (XSS yuku zararsiz)", ic.includes("&lt;script&gt;inject&lt;/script&gt;"));
  ok("tablo: etiket yoksa dürüst '(başlıksız)'", ic.includes("(başlıksız)"));
  ok("tablo: OLCUM ANI + atlanan sayısı dürüst", sahte.projeTabloOzet.innerHTML.includes("2026-11-01T18:00:00Z") && sahte.projeTabloOzet.innerHTML.includes("atlanan 1"));
  ok("tablo başligi textContent ile atanir (innerHTML DEGIL)", sahte.projeTabloAd.textContent === "P-x");
  ok("tablo: ordu dizini notu", sahte.projeTabloOzet.innerHTML.includes("bu dizin ORDU projesinin kendisi"));
});

test("51b- FAZ-B davranis (vm): agacYaz (ORDU once + secili dugum + esc) + composerHedefGuncelle (KURMAY-1 YALNIZ yonetim grubunda)", () => {
  /* --- (1) agacYaz: ORDU projesi basta + ajan dugumleri + durum noktalari + secili --- */
  const agacA = HTML.indexOf("function ajanDugumHtml(");
  const agacB = HTML.indexOf('$("agacAlani").addEventListener');
  ok("ajanDugumHtml + agacYaz yerinde", agacA >= 0 && agacB > agacA);
  const sahte = {};
  const sahte$ = (id) => (sahte[id] = sahte[id] || { innerHTML: "", textContent: "", hidden: true });
  const agacFn = vm.runInNewContext(HTML.slice(agacA, agacB) + "\nagacYaz", {
    $: sahte$, esc: fnAl("esc"), kisalt: fnAl("kisalt"), kisaIdGoster: fnAl("kisaIdGoster"),
    P: {
      olcumAniISO: "2026-11-03T09:00:00Z",
      projeler: [
        { dizin: "D-diger", projeAdi: "diger proje", orduMu: false, ajanlar: [] },
        { dizin: "D-Vibecode-ordu", projeAdi: "ordu", orduMu: true, ajanlar: [
          { ajanKimligi: "8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7", ajanId: "8cc610a4", lastStatus: "running", sonEtkinlikISO: "t", provider: "p", etiket: "KURMAY <b>" },
          { ajanKimligi: "432e03b7-9004-445c-857d-ebf3b6661d53", ajanId: "432e03b7", lastStatus: "closed", sonEtkinlikISO: "t", provider: "p", etiket: null },
        ] },
      ],
    },
    agacAcik: new Set(["D-Vibecode-ordu"]),
    agacSecili: "8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7",
    /* PANEL-AGAC-1 (bilinçli fixture genişletmesi): durum gruplu render için yeni
       durum değişkenleri — KAPALI grubu da AÇIK verilir ki 'nokta kapali' düğümü
       (kapalı akordiyon altında artık render edilmez) davranışı görünsün; sıra
       kaydı yok → varsayılan sıra (ORDU önce) */
    agacGrupAcik: new Set(["running", "closed"]),
    agacSira: null,
    NOKTA_SINIF: { running: "yesil", idle: "gri", error: "kirmizi", closed: "kapali" },
  });
  agacFn();
  const agacHtml = sahte.agacAlani.innerHTML;
  ok("agac: ORDU projesi once (ozel isaret + cip)", agacHtml.indexOf("ORDU</span>") >= 0 && agacHtml.indexOf("ordu") < agacHtml.indexOf("diger proje"));
  ok("agac: acik projenin ajan dugumleri gorunur, kapali projenin cocuklari YOK", agacHtml.includes("8cc610a4") && !agacHtml.includes('data-proje="D-diger"><button'));
  ok("agac: secili dugum .secili sinifi", /class="agacAjan secili"[^>]*data-ajan="8cc610a4/.test(agacHtml));
  ok("agac: running yesil + closed KAPALI (soluk) nokta siniflari", agacHtml.includes('nokta yesil') && agacHtml.includes('nokta kapali'));
  ok("agac: etiket esc'ten gecer (XSS yuku zararsiz)", agacHtml.includes("KURMAY &lt;b&gt;"));
  ok("agac: basliksiz ajan KOMPAKT kural — kısa ad 8 hane kimlik (eski '(başlıksız)' pini BİLİNÇLİ değişti; TAM kimlik title'da)", /class="agacDugumAd"[^>]*>432e03b7</.test(agacHtml) && agacHtml.includes('title="432e03b7-9004-445c-857d-ebf3b6661d53"'));
  ok("agac: yalniz ACIK projenin cocuklari render edilir (D-diger akordiyon kapali)", (agacHtml.split('class="agacCocuklar"').length - 1) === 1);
  ok("agac ozeti: proje + ajan sayimi olcumle", sahte.agacOzet.innerHTML.includes("2</b> ajan kaydı"));

  /* --- (2) composerHedefGuncelle: KURMAY-1 YALNIZ ORDU YONETIM grubunda (KARISMAZ pini) --- */
  const compA = HTML.indexOf("function yonetimKimlikleri()");
  const compB = HTML.indexOf('$("composerForm").addEventListener');
  ok("yonetimKimlikleri + diskAjanKumesi + composerHedefGuncelle yerinde", compA >= 0 && compB > compA);
  const sahte2 = {};
  const sahte2$ = (id) => (sahte2[id] = sahte2[id] || { innerHTML: "", textContent: "", value: "", options: [] });
  const KURMAY_KIMLIK = "8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7";
  const compFn = vm.runInNewContext(HTML.slice(compA, compB) + "\ncomposerHedefGuncelle", {
    $: sahte2$, esc: fnAl("esc"), kisaIdGoster: fnAl("kisaIdGoster"),
    K: { rolAtamasi: { MANAGER: ["KURMAY-1"] }, birlikler: [{ kodAdi: "KURMAY-1", ajanId: KURMAY_KIMLIK }] },
    P: { projeler: [
      { dizin: "D-Vibecode-ordu", projeAdi: "ordu", orduMu: true, ajanlar: [
        { ajanKimligi: KURMAY_KIMLIK, ajanId: "8cc610a4", lastStatus: "running", etiket: "KURMAY-1" },
        { ajanKimligi: "432e03b7-9004-445c-857d-ebf3b6661d53", ajanId: "432e03b7", lastStatus: "idle", etiket: "proje ajanı" },
      ] },
    ] },
    seciliKonusma: null, aktifSekme: "D-Vibecode-ordu", gonderiyor: false, /* aktif sekme = ordu PROJESI (yönetim-grubu ayrımı tam görünsün) */
  });
  const secSham = { innerHTML: "", value: "", options: [] };
  sahte2.composerHedef = secSham;
  compFn();
  const ch = secSham.innerHTML;
  const yonetimGrubu = ch.slice(ch.indexOf("ORDU YÖNETİM"), ch.indexOf("</optgroup>"));
  const projeGrubu = ch.slice(ch.lastIndexOf("AJANLARI"));
  ok("composer: optgroup ORDU YÖNETİM var", ch.includes('optgroup label="ORDU YÖNETİM"'));
  ok("composer: KURMAY-1 yalniz YONETIM grubunda (pini — manager ile proje ajanı KARIŞMAZ)", yonetimGrubu.includes(KURMAY_KIMLIK) && !projeGrubu.includes(KURMAY_KIMLIK));
  ok("composer: yonetim grubu disk taramasi KESISIMI (kaynak: kadro ajanId + tarama)", yonetimGrubu.includes("KURMAY-1 — 8cc610a4"));
  ok("composer: proje grubu yonetim HARIC ajanlari listeler", projeGrubu.includes("432e03b7") && projeGrubu.includes("proje ajanı"));
  /* --- (3) yonetici DISKTE YOK senaryosu: devre-disi secenek (fail-closed dürüst) --- */
  const secSham2 = { innerHTML: "", value: "", options: [] };
  const sahte3 = { composerHedef: secSham2 };
  const compFn2 = vm.runInNewContext(HTML.slice(compA, compB) + "\ncomposerHedefGuncelle", {
    $: (id) => sahte3[id] || (sahte3[id] = { innerHTML: "", textContent: "", value: "", options: [] }),
    esc: fnAl("esc"), kisaIdGoster: fnAl("kisaIdGoster"),
    K: { rolAtamasi: { MANAGER: ["KURMAY-1"] }, birlikler: [{ kodAdi: "KURMAY-1", ajanId: KURMAY_KIMLIK }] },
    P: { projeler: [
      { dizin: "D-Vibecode-ordu", projeAdi: "ordu", orduMu: true, ajanlar: [
        { ajanKimligi: "432e03b7-9004-445c-857d-ebf3b6661d53", ajanId: "432e03b7", lastStatus: "idle", etiket: "proje ajanı" },
      ] },
    ] },
    seciliKonusma: null, aktifSekme: "ordu", gonderiyor: false,
  });
  compFn2();
  ok("composer: yonetim diskinde yoksa DEVRE-DISI secenek (fail-closed dürüst)", secSham2.innerHTML.includes("disk taramasında yok (gönderilemez)"));
  ok("composer: yonetici diske donmediginde gonderilebilir deger YOK (value bos)", secSham2.innerHTML.includes('value="' + KURMAY_KIMLIK + '"') === false && secSham2.value === "");
});

test("51c- FAZ-B davranis (vm): ana sekme yonetimi — ORDU SABIT + X ile kapanis + bos yuz + gecersiz donus", () => {
  const sekA = HTML.indexOf("function anaSekmeYaz()");
  const sekB = HTML.indexOf("function projeTabloYaz()");
  ok("ana sekme fonksiyonlari yerinde (anaSekmeYaz..anaSekmeBos)", sekA >= 0 && sekB > sekA);
  const sahte = {};
  const sahte$ = (id) => (sahte[id] = sahte[id] || { innerHTML: "", textContent: "", hidden: true });
  let seritHtml = "";
  const seritSham = {
    get innerHTML() { return seritHtml; },
    set innerHTML(v) { seritHtml = String(v); },
    addEventListener: () => {},
  };
  const fns = vm.runInNewContext(HTML.slice(sekA, sekB) + "\n[anaSekmeDegistir, sekmeAc, sekmeKapat, anaSekmeBos]", {
    $: (id) => (id === "anaSekmeSerit" ? seritSham : sahte$(id)),
    esc: fnAl("esc"), kisalt: fnAl("kisalt"), /* FAZ-D bilinçli ekleme: anaSekmeYaz artık kisalt(ad,16) çağırır */
    P: { projeler: [{ dizin: "P-x", projeAdi: "P-x", ajanlar: [] }] },
    acikSekmeler: [], aktifSekme: "ordu", aktifAltSekme: "durum",
    ALT_SEKME_PANEL: { durum: "durumBolum", plan: "planBolum", akis: "akisBolum", saglik: "saglikBolum", log: "logBolum" },
    document: { querySelectorAll: () => ({ forEach: () => {} }) }, /* panelSiniflariTazele sham'i */
    requestAnimationFrame: (f) => f(),
    projeTabloYaz: () => {}, composerHedefGuncelle: () => {}, odakIcindeMi: () => false, gonderiyor: false,
  });
  const [anaSekmeDegistir, sekmeAc, sekmeKapat] = fns;
  /* sekme ac: ORDU sabit sereitte kalir + yeni sekme aktif olur */
  sekmeAc("P-x");
  ok("ORDU sekmesi seritte SABIT (acilisla birlikte durur)", seritHtml.includes('id="sek-ordu"'));
  ok("yeni proje sekmesi aktif (aria-selected=true, data-ana)", /data-ana="P-x"[^>]*aria-selected="true"/.test(seritHtml) && seritHtml.includes('data-kapat="P-x"'));
  ok("ORDU sekmesi aktif degil (aria-selected=false)", /id="sek-ordu"[^>]*aria-selected="false"/.test(seritHtml));
  ok("proje sekmesi acikken alt sirit gizlenir + proje sayfasi gorunur", sahte.altSekmeSerit.hidden === true && sahte.projeSayfa.hidden === false);
  /* gecersiz ana sekme: ORDU'ya coerced (fail-closed) */
  anaSekmeDegistir("P-yok");
  ok("gecersiz ana sekme ORDU'ya doner (ORDU aktif + alt sirit geri)", /id="sek-ordu"[^>]*aria-selected="true"/.test(seritHtml) && sahte.altSekmeSerit.hidden === false && sahte.projeSayfa.hidden === true);
  /* son sekme kapaninca: bos yuz (ORDU sereitte durur ama bos yuz gorunur) */
  anaSekmeDegistir("P-x");
  sekmeKapat("P-x");
  ok("son sekme kapaninca bos yuz (fail-closed 'gezginden proje seç')", sahte.bosSayfa.hidden === false && sahte.altSekmeSerit.hidden === true && sahte.projeSayfa.hidden === true);
  ok("ORDU dugmesi sereitte durmaya devam eder (kapatilamaz)", seritHtml.includes('id="sek-ordu"') && !seritHtml.includes('data-kapat'));
  ok("kaynak pini: coercion ORDU'ya + bos yuz metni gezginden secer", HTML.includes('if (id !== "ordu" && !acikSekmeler.includes(id)) id = "ordu"') && HTML.includes("hiç sekme açık değil — gezginden bir proje seç"));
});

test("51d- KOMPAKT (steering 2026-11-03) davranis (vm): kisalt() esik tablosu + ajanDugumHtml kisa ad kurali (etiket 12 — FAZ-E «aşırı minimal» · title TAM · data-ajan TAM uuid)", () => {
  const kisalt = fnAl("kisalt");
  assert.equal(kisalt(null, 20), null, "null → null (boş dize uydurulmaz)");
  assert.equal(kisalt(undefined, 20), null, "undefined → null");
  assert.equal(kisalt("kısa ad", 20), "kısa ad", "esik alti aynen doner");
  assert.equal(kisalt("0123456789012345678901", 20), "0123456789012345678…", "21 karakter → 19 + '…'");
  assert.equal(kisalt("0123456789012345678901", 20).length, 20, "sonuc uzunlugu esikle ayni (n karakter)");
  assert.equal(kisalt("0123456789012345678", 20), "0123456789012345678", "tam esikte kesilmez");
  assert.equal(kisalt(12345, 3), "12…", "sayi metne iner (String())");
  assert.equal(kisalt("", 5), "", "bos dize aynen");

  /* ajanDugumHtml: kisa ad kurali — etiket VARSA kisalt(etiket,12) (FAZ-E bilinçli:
     20 → 12 «aşırı minimal») + title TAM etiket;
     yoksa 8 hane kimlik + title TAM kimlik; data-ajan TAM uuid (secim/gonderim degismez) */
  const dgnA = HTML.indexOf("function ajanDugumHtml(");
  const dgnB = HTML.indexOf("function agacYaz()");
  ok("ajanDugumHtml yerinde", dgnA >= 0 && dgnB > dgnA);
  const dgnFn = vm.runInNewContext(HTML.slice(dgnA, dgnB) + "\najanDugumHtml", {
    esc: fnAl("esc"), kisalt, kisaIdGoster: fnAl("kisaIdGoster"),
    agacSecili: null, NOKTA_SINIF: { running: "yesil", idle: "gri", error: "kirmizi", closed: "kapali" },
  });
  const pr = { dizin: "D-Vibecode-ordu" };
  const uuid = "432e03b7-9004-445c-857d-ebf3b6661d53";
  /* (1) uzun etiket → 11 + '…' (FAZ-E: eşik 12) + title TAM etiket */
  const h1 = dgnFn({ ajanKimligi: uuid, ajanId: "432e03b7", lastStatus: "running", etiket: "0123456789012345678901" }, pr);
  ok("kural: uzun etiket kisalir (11 + '…' — FAZ-E eşik 12)", h1.includes('>01234567890…</span>'));
  ok("kural: dugum title TAM etiketi tasir", h1.includes('title="0123456789012345678901"'));
  ok("kural: dugum adı .agacDugumAd icinde (tek satir)", /class="agacDugumAd"/.test(h1));
  /* (2) etiket yok → 8 hane kimlik + title TAM kimlik (dürüst yedek) */
  const h2 = dgnFn({ ajanKimligi: uuid, ajanId: null, lastStatus: "idle", etiket: null }, pr);
  ok("kural: etiket yoksa kisa ad 8 hane kimlik", /class="agacDugumAd"[^>]*>432e03b7</.test(h2));
  ok("kural: etiket yoksa title TAM kimlik", h2.includes('title="' + uuid + '"'));
  /* (3) data-ajan TAM uuid + XSS yuku zararsiz + durum noktasi */
  const h3 = dgnFn({ ajanKimligi: uuid, ajanId: "432e03b7", lastStatus: "error", etiket: '<script>x</script> <b>' }, pr);
  ok("gonderim hedefi: data-ajan TAM uuid (degismedi)", h3.includes('data-ajan="' + uuid + '"'));
  ok("kural: XSS yuku esc'ten gecer (etiket kisaltma sonrasi da)", h3.includes("&lt;script&gt;"));
  ok("durum noktasi sinifi korunur (error kirmizi)", h3.includes('nokta kirmizi'));
  ok("eski iki-span duzeni KALDIRILDI (agacAjanId/agacEtiket YOK)", !h3.includes('class="agacAjanId"') && !h3.includes('class="agacEtiket"'));
});

test("51e- KOMPAKT kapanis duzeltmesi (vm): agac tiklamasi composer hedefini TIKLANAN konuşmaya zorlar; yenileme elle seçileni KORUR (gizil kusur: kart doluyor, select eski değerde kalıyordu)", () => {
  /* kaynak pinleri: tıklama yolu bayrağı taşır, zorlama dalı eski-değer dalından ÖNCE */
  ok("kaynak: ajan düğüm tıklaması konusmaSecGuncelle(true) çağırır", HTML.includes("konusmaSecGuncelle(true)"));
  ok("kaynak: konusmaSecGuncelle + composerHedefGuncelle secimiZorla imzası", HTML.includes("function konusmaSecGuncelle(secimiZorla)") && HTML.includes("function composerHedefGuncelle(secimiZorla)"));
  ok("kaynak: zorlama dalı eski-değer dalından ÖNCE (öncelik)", HTML.indexOf("if (secimiZorla && seciliKonusma") >= 0 && HTML.indexOf("if (secimiZorla && seciliKonusma") < HTML.indexOf("else if (eskiDeger &&"));

  const KURMAY = "8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7";
  const A1 = "432e03b7-9004-445c-857d-ebf3b6661d53";
  const A2 = "128a3edc-b2a6-4eff-b0ff-f430015fa045";
  const a = HTML.indexOf("function konusmaSecGuncelle(");
  const b = HTML.indexOf('$("composerForm").addEventListener');
  ok("dilim yerinde: konusmaSecGuncelle … composerForm", a >= 0 && b > a);
  const sham = {};
  const sham$ = (id) => sham[id] || (sham[id] = { innerHTML: "", textContent: "", value: "", options: [], className: "", hidden: true });
  const ctx = {
    $: sham$, esc: fnAl("esc"), kisalt: fnAl("kisalt"), kisaIdGoster: fnAl("kisaIdGoster"),
    kirmiziYuzKapat: () => {}, NOKTA_SINIF: { running: "yesil", idle: "gri", error: "kirmizi", closed: "kapali" },
    K: { rolAtamasi: { MANAGER: ["KURMAY-1"] }, birlikler: [{ kodAdi: "KURMAY-1", ajanId: KURMAY }] },
    P: { projeler: [ { dizin: "D-Vibecode-ordu", projeAdi: "ordu", orduMu: true, ajanlar: [
      { ajanKimligi: KURMAY, ajanId: "8cc610a4", lastStatus: "running", etiket: "KURMAY-1" },
      { ajanKimligi: A1, ajanId: "432e03b7", lastStatus: "idle", etiket: "proje ajanı 1" },
      { ajanKimligi: A2, ajanId: "128a3edc", lastStatus: "idle", etiket: "proje ajanı 2" },
    ] } ] },
    seciliKonusma: null, agacSecili: null, aktifSekme: "ordu", gonderiyor: false,
  };
  const fn = vm.runInNewContext(HTML.slice(a, b) + "\nkonusmaSecGuncelle", ctx);
  const secSham = sham$("composerHedef");
  secSham.options = [{ value: KURMAY }, { value: A1 }, { value: A2 }];

  /* (1) AĞAÇ TIKLAMASI (true): select eski değerde A1, tıklanan A2 → hedef A2 (kusur düzeltmesi) */
  secSham.value = A1; ctx.agacSecili = A2;
  fn(true);
  ok("tıklama: hedef TIKLANAN konuşmaya döner (eski değer yutulmaz)", secSham.value === A2);
  ok("tıklama: sağ başlık satırı tıklanan konuşmayı gösterir (TAM kimlik title'da — PANEL-CHAT-1)", sham.chatBaslik.innerHTML.includes(A2));
  ok("tıklama: seciliKonusma tıklanan ajana bağlandı", ctx.seciliKonusma && ctx.seciliKonusma.ajan.ajanKimligi === A2);

  /* (2) YENİLEME (zorlasız): elle seçilmiş YÖNETİM hedefi korunur (elle seçim yenilemede ezilmez) */
  secSham.value = KURMAY;
  fn();
  ok("yenileme: elle seçilmiş yönetim hedefi KORUNUR", secSham.value === KURMAY);

  /* (3) YENİLEME + eski değer listede YOK → seçili konuşmaya dürüst dönüş */
  secSham.value = "silinmis-kimlik";
  fn();
  ok("yenileme: eski değer listede yoksa seçili konuşmaya döner", secSham.value === A2);
});

test("51f- PANEL-AGAC-1 (vm): çalışan sayısı GERÇEK sayımdan + hata uyarı ikonu + aktif/toplam proje + durum grupları (boş grup YOK) + kalıcı sıra + taşıma/grup tıklaması proje davranışını DURDURUR", () => {
  const j = jsKisim();
  /* --- kaynak pinleri --- */
  ok("grup kalıcılığı: ordu-agac-grup (kaydet + oku)", j.includes('kaydet("ordu-agac-grup"') && j.includes('oku("ordu-agac-grup")'));
  ok("sıra kalıcılığı: ordu-agac-sira (kaydet + oku)", j.includes('kaydet("ordu-agac-sira"') && j.includes('oku("ordu-agac-sira")'));
  ok("durum grup sabitleri: render sırası + Türkçe adlar", j.includes('const GRUP_SIRA = ["running", "idle", "error", "closed", "diger"]') && j.includes('const GRUP_ADI = { running: "ÇALIŞAN", idle: "BEKLEYEN", error: "HATA", closed: "KAPALI", diger: "DİĞER" }'));
  ok("varsayılan açık gruplar: ÇALIŞAN + HATA", j.includes('new Set(["running", "error"])'));
  ok("çalışan sayısı GERÇEK sayım (lastStatus === running; ajanlar.length TOPLAM kayıttır)", j.includes('x.lastStatus === "running"') && j.includes('x.lastStatus === "error"'));
  ok("proje başlığı role=button DIV (W3C: düğme içinde düğme YASAK)", j.includes('<div class="agacProjeBas" role="button"') && !j.includes('<button type="button" class="agacProjeBas"'));
  ok("taşıma düğmeleri başlığın DIŞINDA (agacTasi) + klavye yolu keydown dinleyicisi", j.includes('<span class="agacTasi">') && j.includes('$("agacAlani").addEventListener("keydown"'));
  ok("taşıma hedefi 28px (K-0061 kompakt satır yüksekliği)", /\.agacTasiBtn\s*\{[^}]*width:\s*28px/.test(HTML) && /\.agacTasiBtn\s*\{[^}]*min-height:\s*28px/.test(HTML));
  ok("uyarı ikonu inline SVG + role=img (emoji YASAK §4)", j.includes("const UYARI_SVG") && j.includes('<span class="agacUyari" role="img"'));
  ok("tıklama temsilcisi: sıra + grup başlıkları ÖNCE (erken dönüş — TRAP 2)", j.indexOf('closest(".agacTasiBtn")') >= 0 && j.indexOf('closest(".agacTasiBtn")') < j.indexOf('closest(".agacProjeBas")') && j.indexOf('closest(".agacGrupBas")') < j.indexOf('closest(".agacProjeBas")'));
  ok("ağaç özeti aktif/toplam: 'N aktif / M proje'", j.includes("</b> aktif / <b>"));
  ok("başlık title'ı dürüst: 'çalışan · toplam ajan kaydı'", j.includes(" çalışan · "));
  ok("taşıma aria-label'ları (yukarı/aşağı)", j.includes('aria-label="projeyi yukarı taşı"') && j.includes('aria-label="projeyi aşağı taşı"'));

  /* --- (1) agacYaz davranışı: çalışan sayısı + uyarı + gruplar + boş grup yok --- */
  const R1 = "8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7"; /* running (P-alfa) */
  const R2 = "128a3edc-b2a6-4eff-b0ff-f430015fa045"; /* running (P-alfa) */
  const I1 = "432e03b7-9004-445c-857d-ebf3b6661d53"; /* idle (P-alfa) */
  const E1 = "b7f2c915-3a9e-4c21-8f14-09d3a2c6e7b8"; /* error (P-beta) */
  const D1 = "c9e8d7a6-2b4f-4e3a-9c21-7f0a1b2c3d4e"; /* bilinmeyen durum → DİĞER (P-alfa) */
  const FIX = {
    olcumAniISO: "2026-11-03T12:00:00Z",
    projeler: [
      { dizin: "P-alfa", projeAdi: "alfa", orduMu: false, ajanlar: [
        { ajanKimligi: R1, ajanId: "8cc610a4", lastStatus: "running", etiket: "çalışan ajan 1" },
        { ajanKimligi: R2, ajanId: "128a3edc", lastStatus: "running", etiket: "çalışan ajan 2" },
        { ajanKimligi: I1, ajanId: "432e03b7", lastStatus: "idle", etiket: "bekleyen ajan" },
        { ajanKimligi: D1, ajanId: "c9e8d7a6", lastStatus: "hazirlaniyor", etiket: "bilinmeyen durum" },
      ] },
      { dizin: "P-beta", projeAdi: "beta", orduMu: false, ajanlar: [
        { ajanKimligi: E1, ajanId: "b7f2c915", lastStatus: "error", etiket: "hatalı ajan" },
      ] },
      { dizin: "D-ordu", projeAdi: "ordu", orduMu: true, ajanlar: [] },
    ],
  };
  const sahte = {};
  const sahte$ = (id) => (sahte[id] = sahte[id] || { innerHTML: "", textContent: "", hidden: true });
  const ctx = {
    $: sahte$, esc: fnAl("esc"), kisalt: fnAl("kisalt"), kisaIdGoster: fnAl("kisaIdGoster"),
    P: FIX, agacAcik: new Set(["P-alfa"]), agacSecili: null,
    agacGrupAcik: new Set(["running", "error"]), agacSira: null,
    NOKTA_SINIF: { running: "yesil", idle: "gri", error: "kirmizi", closed: "kapali" },
  };
  const agacFn = vm.runInNewContext(HTML.slice(HTML.indexOf("function ajanDugumHtml("), HTML.indexOf('$("agacAlani").addEventListener')) + "\nagacYaz", ctx);
  agacFn();
  const h = sahte.agacAlani.innerHTML;
  ok("özet: 1 aktif / 3 proje · 5 ajan kaydı (gerçek sayım — uydurma yok)", sahte.agacOzet.innerHTML.includes("1</b> aktif / <b>3</b> proje") && sahte.agacOzet.innerHTML.includes("5</b> ajan kaydı"));
  ok("FAZ-F sıra: AKTİF proje ÜSTTE (P-alfa) — pasifler altta [ORDU, beta] grup içi ORDU-önce aynen (bilinçli pin: eski 'ORDU önce' pini)", h.indexOf("alfa") < h.indexOf("ORDU</span>") && h.indexOf("ORDU</span>") < h.indexOf("beta"));
  const alfaBasIdx = h.indexOf('data-proje="P-alfa"');
  const alfaBas = h.slice(alfaBasIdx, h.indexOf("</div>", alfaBasIdx));
  ok("proje satırı: sağda ÇALIŞAN sayısı (2 — toplam 4 DEĞİL) + dürüst title TAM adlı birleşik bicim (E-ek1 bilinçli: 'alfa — 2 çalışan · 4 ajan kaydı'; eski pini '2 çalışan · 4 ajan kaydı')", alfaBas.includes('<span class="agacSayi">2</span>') && !alfaBas.includes('<span class="agacSayi">4</span>') && alfaBas.includes('title="alfa — 2 çalışan · 4 ajan kaydı"'));
  ok("hata uyarısı: YALNIZ hatalı ajanı olan projede (P-beta VAR · P-alfa/D-ordu YOK)", (h.match(/class="agacUyari"/g) || []).length === 1 && h.indexOf('class="agacUyari"') > h.indexOf('data-proje="P-beta"'));
  ok("uyarı ikonu aria-label + dürüst sayı title'ı", h.includes('aria-label="hata durumunda ajan var"') && h.includes('title="1 ajan hata durumunda"'));
  ok("durum grupları: ÇALIŞAN + BEKLEYEN + DİĞER başlıkları; boş HATA grubu render EDİLMEZ", h.includes('data-grup="running"') && h.includes('data-grup="idle"') && h.includes('data-grup="diger"') && !h.includes('data-grup="error"'));
  ok("grup başlığı: ad + sağda sayı (ÇALIŞAN 2)", h.includes(">ÇALIŞAN</span><span class=\"agacSayi\">2</span>"));
  ok("ÇALIŞAN açık: 2 ajan düğümü render; BEKLEYEN/DİĞER kapalı: düğüm YOK (yalnız başlık sayısı)", h.includes('data-ajan="' + R1 + '"') && h.includes('data-ajan="' + R2 + '"') && !h.includes('data-ajan="' + I1 + '"') && !h.includes('data-ajan="' + D1 + '"'));
  ok("kapalı projenin (P-beta) grupları render EDİLMEZ", !h.includes('data-ajan="' + E1 + '"'));
  ok("data-ajan TAM uuid korunur (seçim/gönderim değişmez)", h.includes('data-ajan="' + R1 + '"'));
  const emojiHtml = h.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}]/gu) || [];
  ok("ağaç çıktısında emoji karakteri YOK (uyarı/ok ikonları inline SVG — §4)", emojiHtml.length === 0, "bulunan: " + emojiHtml.length);
  ok("token alanı YOK (veri köprüsü ikinci dalgada — uydurma E10 ihlali)", !/token/i.test(h));

  /* --- (2) kalıcı sıra kaydı VARSAYILANI Ezer (kullanıcı düzeni öncelikli) — FAZ-F:
         kayıt GRUP İÇİNDE yaşar (aktif P-alfa her koşulda üstte; pasif sırası kayıtlı tercih) --- */
  ctx.agacSira = ["P-beta", "P-yok"]; /* kayıtta olmayan proje yok sayılır + eksikler sona eklenir */
  agacFn();
  const h2 = sahte.agacAlani.innerHTML;
  ok("kayıtlı sıra grup içinde yaşar: aktif P-alfa üstte; pasifler kayıtlı sırada [beta, ORDU]; 'P-yok' dürüstçe yok sayılır (bilinçli pin)", h2.indexOf("alfa") < h2.indexOf("beta") && h2.indexOf("beta") < h2.indexOf("ORDU</span>") && !h2.includes("P-yok"));
  ok("FAZ-F: kayıt YENİ anahtar doğurmaz (ordu-agac-sira şeması aynen — aktif-öncelik tercihe bağlı DEĞİL)", !/ordu-agac-(aktif|pasif|fa)/.test(j));

  /* --- (3) agacSirala: bir satır kaydırır + kalıcıya yazar; uç satırda sessiz no-op --- */
  const kayit = [];
  const kaydetSpy = (a, v) => kayit.push([a, v]);
  const sirCtx = {
    $: sahte$, esc: fnAl("esc"), kisalt: fnAl("kisalt"), kisaIdGoster: fnAl("kisaIdGoster"),
    P: FIX, agacAcik: new Set(), agacSecili: null,
    agacGrupAcik: new Set(["running", "error"]), agacSira: null,
    NOKTA_SINIF: { running: "yesil", idle: "gri", error: "kirmizi", closed: "kapali" },
    kaydet: kaydetSpy,
  };
  const sirFn = vm.runInNewContext(HTML.slice(HTML.indexOf("function ajanDugumHtml("), HTML.indexOf('$("agacAlani").addEventListener')) + "\nagacSirala", sirCtx);
  sirFn("P-alfa", -1); /* varsayılan sıra: D-ordu, P-alfa, P-beta → P-alfa bir satır yukarı */
  assert.deepEqual([...sirCtx.agacSira], ["P-alfa", "D-ordu", "P-beta"], "taşıma: bir satır kaydırır");
  ok("sıra kalıcıya yazılır (ordu-agac-sira)", kayit.some(([a]) => a === "ordu-agac-sira"));
  ok("taşıma sonrası ağaç yeniden render (P-alfa başta)", sahte.agacAlani.innerHTML.indexOf("alfa") < sahte.agacAlani.innerHTML.indexOf("ORDU</span>"));
  const kayitSayisi = kayit.length;
  sirFn("P-alfa", -1); /* zaten başta: sessiz no-op */
  assert.deepEqual([...sirCtx.agacSira], ["P-alfa", "D-ordu", "P-beta"], "uç satır: sıra değişmez");
  assert.equal(kayit.length, kayitSayisi, "uç satır: kalıcıya YENİ kayıt yazılmaz");

  /* --- (4) tıklama temsilcisi: taşıma + grup başlığı proje/ajan davranışını tetiklemez --- */
  const dinleyiciler = {};
  const agacSham = { addEventListener: (tip, fn) => { dinleyiciler[tip] = fn; } };
  const cagrilar = { sirala: [], sekme: [], secim: [], yaz: 0 };
  const kayit2 = [];
  const dlgCtx = {
    $: (id) => (id === "agacAlani" ? agacSham : { addEventListener: () => {} }),
    agacSirala: (d, y) => { cagrilar.sirala.push([d, y]); },
    sekmeAc: (d) => { cagrilar.sekme.push(d); },
    konusmaSecGuncelle: (z) => { cagrilar.secim.push(z); },
    agacYaz: () => { cagrilar.yaz++; },
    agacAcik: new Set(["P-alfa"]),
    agacGrupAcik: new Set(["running", "error"]),
    agacSecili: null,
    kaydet: (a) => { kayit2.push(a); },
  };
  vm.runInNewContext(HTML.slice(HTML.indexOf('$("agacAlani").addEventListener("click"'), HTML.indexOf("function konusmaSecGuncelle")), dlgCtx);
  ok("delegasyon kayıtlı: click + keydown dinleyicileri", !!dinleyiciler.click && !!dinleyiciler.keydown);
  const olay = (eslesen, dugum) => ({ target: { closest: (s) => (s === eslesen ? dugum : null) } });
  /* (4a) taşıma düğmesi: agacSirala çağrılır; akordiyon/sekme/selection DEĞİŞMEZ */
  dinleyiciler.click(olay(".agacTasiBtn", { dataset: { proje: "P-beta", yon: "-1" } }));
  assert.deepEqual(cagrilar.sirala, [["P-beta", -1]], "taşıma: agacSirala(proje, yon) çağrılır");
  assert.deepEqual(cagrilar.sekme, [], "taşıma: sekme açMAZ");
  assert.equal(dlgCtx.agacAcik.size, 1, "taşıma: akordiyonu bozmaz");
  /* (4b) grup başlığı: grup açılır/kapanır + kalıcıya yazılır; proje davranışı YOK */
  dinleyiciler.click(olay(".agacGrupBas", { dataset: { grup: "idle" } }));
  ok("grup başlığı: kapalı grup AÇILIR", dlgCtx.agacGrupAcik.has("idle"));
  ok("grup tercihi kalıcıya yazılır (ordu-agac-grup)", kayit2.includes("ordu-agac-grup"));
  assert.deepEqual(cagrilar.sekme, [], "grup başlığı: sekme açmaz");
  dinleyiciler.click(olay(".agacGrupBas", { dataset: { grup: "idle" } }));
  ok("grup başlığı: ikinci tıklama KAPATIR", !dlgCtx.agacGrupAcik.has("idle"));
  /* (4c) proje başlığı (regresyon): akordiyon + sekme AYNEN */
  dinleyiciler.click(olay(".agacProjeBas", { dataset: { proje: "P-beta" } }));
  ok("proje başlığı: akordiyon açılır + sekme açılır (mevcut davranış korunur)", dlgCtx.agacAcik.has("P-beta") && cagrilar.sekme.includes("P-beta"));
  ok("ordu-agac-acik kalıcıya yazılır", kayit2.includes("ordu-agac-acik"));
  /* (4d) ajan düğümü (regresyon): seçim + konusmaSecGuncelle(true) AYNEN */
  dinleyiciler.click(olay(".agacAjan", { dataset: { ajan: R1, proje: "P-alfa" } }));
  assert.equal(dlgCtx.agacSecili, R1, "ajan düğümü: seçili konuşma TAM kimlikle");
  assert.deepEqual(cagrilar.secim, [true], "ajan düğümü: konusmaSecGuncelle(true) — 51e düzeltmesi korunur");
  ok("ordu-agac-secili kalıcıya yazılır", kayit2.includes("ordu-agac-secili"));
  /* (4e) klavye: başlık DIV role=button → Enter/Space tıklamaya çevrilir */
  let tiklandi = 0, engellendi = 0;
  const baslikSham = { closest: (s) => (s === ".agacProjeBas" ? baslikSham : null), click: () => { tiklandi++; } };
  dinleyiciler.keydown({ key: "Enter", target: baslikSham, preventDefault: () => { engellendi++; } });
  dinleyiciler.keydown({ key: " ", target: baslikSham, preventDefault: () => { engellendi++; } });
  ok("klavye: Enter + Space başlık tıklamasına çevrilir (kaydırma önlenir)", tiklandi === 2 && engellendi === 2);
  dinleyiciler.keydown({ key: "a", target: baslikSham, preventDefault: () => { engellendi++; } });
  ok("klavye: diğer tuşlar geçer (yalnız Enter/Space)", tiklandi === 2);
});

test("51g- PANEL-CHAT-1 (vm): mesaj listesi oturum-içi — gönderim sonrası render + role=log + esc() XSS pini + localStorage YASAK + dürüst hata satırı + composer pinleri AYNEN", async () => {
  const j = jsKisim();
  /* --- kaynak pinleri --- */
  ok("mesaj listesi: role=log + aria-live=polite + otomatik en alta kaydırma", HTML.includes('id="chatListe"') && HTML.includes('role="log"') && HTML.includes('aria-live="polite"') && j.includes("liste.scrollTop = liste.scrollHeight"));
  ok("oturum dürüst notu: 'Bu oturumda gönderilenler — yenileyince temizlenir'", HTML.includes("Bu oturumda gönderilenler — yenileyince temizlenir"));
  const chatA = HTML.indexOf("const CHAT_TAVAN");
  const chatB = HTML.indexOf("function anaSekmeYaz()");
  ok("chat bloğu yerinde (CHAT_TAVAN … anaSekmeYaz)", chatA >= 0 && chatB > chatA);
  const chatSlice = HTML.slice(chatA, chatB);
  ok("bellek-içi: mesaj listesi KALICI DEĞİL — chat diliminde kaydet(/localStorage YOK", !/kaydet\(/.test(chatSlice) && !chatSlice.includes("localStorage"));
  ok("30sn yenileme mesaj listesine DOKUNMAZ ($(\"chatListe\") erişimi yalnız 1 yerde — chatMesajYaz)", (j.match(/\$\("chatListe"\)/g) || []).length === 1);
  ok("giriş yüzü: [HH:mm] [hedef kısa ad] metin + İNCE sonuç satırı (düz metin)", chatSlice.includes('<span class="chatSaat">[') && chatSlice.includes('<span class="chatKimlik" title="') && chatSlice.includes('chatSonuc'));
  ok("tavan: 200 + en eski düşer (shift)", chatSlice.includes("const CHAT_TAVAN = 200") && chatSlice.includes("oturumMesajlari.shift()"));
  ok("composer AYNEN: POST /api/mesaj + x-pano-token başlığı + gonderiyor bayrağı", chatSlice.includes('"/api/mesaj"') && chatSlice.includes('"x-pano-token"') && chatSlice.includes("gonderiyor = true"));
  ok("composer AYNEN: hedef boş + mesaj boş istemci doğrulamaları (fail-closed yüz)", chatSlice.includes("hedef seçilmedi") && chatSlice.includes("mesaj boş"));
  ok("sonuç satırı DÜZ METİN: composerHata kirmiziYüzü BİLİNÇLİ kalktı (hata ince satırda)", !chatSlice.includes("kirmiziYuzGoster") && !HTML.includes('id="composerHata"'));
  ok("eski konusmaKart/bolum-konusma kalıntısı YOK (blok kalktı — TEK satır + liste)", !HTML.includes('id="konusmaKart"') && !HTML.includes('id="bolum-konusma"') && !HTML.includes("function konusmaKartYaz"));

  /* --- davranış (vm): gönderim → liste render + sonuç satırı + esc + localStorage yok --- */
  const A1 = "432e03b7-9004-445c-857d-ebf3b6661d53";
  const dinleyiciler = {};
  const sham = {};
  const sham$ = (id) => sham[id] || (sham[id] = { innerHTML: "", textContent: "", value: "", hidden: true, disabled: false, className: "", scrollTop: 0, scrollHeight: 500, addEventListener: (tip, fn) => { dinleyiciler[tip] = fn; } });
  let fetchCagr = null;
  let yanit = { ok: true, json: async () => ({ gonderildi: true, zamanISO: "2026-11-03T12:00:00Z" }) };
  let agHatasi = false;
  const ctx = {
    $: sham$, esc: fnAl("esc"), kisalt: fnAl("kisalt"), kisaIdGoster: fnAl("kisaIdGoster"),
    NOKTA_SINIF: { running: "yesil", idle: "gri", error: "kirmizi", closed: "kapali" },
    P: { projeler: [{ dizin: "D-Vibecode-ordu", projeAdi: "ordu", orduMu: true, ajanlar: [
      { ajanKimligi: A1, ajanId: "432e03b7", lastStatus: "running", etiket: "proje ajanı 1" },
    ] }] },
    seciliKonusma: null, gonderiyor: false,
    fetch: async (yol, secenek) => { fetchCagr = { yol, secenek }; if (agHatasi) throw new Error("bağlantı koptu"); return yanit; },
  };
  const [oturumMesajlari, chatMesajYaz] = vm.runInNewContext(chatSlice + "\n[oturumMesajlari, chatMesajYaz]", ctx);
  ok("submit dinleyicisi kayıtlı (composerForm sham'ında)", typeof dinleyiciler.submit === "function");
  const gonder = () => dinleyiciler.submit({ preventDefault: () => {} });
  /* girdi sham'ları önceden doğar (dinleyici gövdesi ilk çağrıda okur — kayıt sırasında değil) */
  for (const id of ["composerHedef", "composerMesaj", "token", "composerGonder", "composerSonuc", "chatListe", "chatBos"]) sham$(id);

  /* (1) doğrulama: hedef boş → istek YOK + liste boş + composerSonuc dürüst */
  sham.composerHedef.value = "";
  sham.composerMesaj.value = "hedefsiz mesaj";
  await gonder();
  ok("doğrulama: hedef boş → istek ATILMAZ + giriş listeye DÜŞMEZ", fetchCagr === null && oturumMesajlari.length === 0);
  ok("doğrulama: composerSonuc dürüst hata metni (role=status)", sham.composerSonuc.textContent.includes("hedef seçilmedi"));
  sham.composerHedef.value = A1;
  sham.composerMesaj.value = "  ";
  await gonder();
  ok("doğrulama: mesaj boş → giriş listeye DÜŞMEZ", oturumMesajlari.length === 0 && sham.composerSonuc.textContent.includes("mesaj boş"));

  /* (2) başarı: giriş düşer → [HH:mm] [kısa ad] metin + 'gönderildi' + editör temizlenir */
  sham.token.value = "sahte-token"; /* sahte token — yalnız başlıkta yolculuk yapar */
  sham.composerMesaj.value = "test mesajı";
  await gonder();
  const h1 = sham.chatListe.innerHTML;
  ok("gönderim: istek POST /api/mesaj + token YALNIZ başlıkta (x-pano-token)", fetchCagr.yol === "/api/mesaj" && fetchCagr.secenek.method === "POST" && fetchCagr.secenek.headers["x-pano-token"] === "sahte-token" && !fetchCagr.secenek.body.includes("sahte-token"));
  ok("gönderim: gövde hedef+mesaj JSON (kimlik TAM)", fetchCagr.secenek.body.includes(A1) && fetchCagr.secenek.body.includes("test mesajı"));
  ok("liste: giriş satırı [HH:mm] [432e03b7] metin (saat kalıbı ölçülür)", /\[\d{2}:\d{2}\]/.test(h1) && h1.includes("[432e03b7]") && h1.includes("test mesajı"));
  ok("liste: başarı İNCE satır 'gönderildi' (yeşil sınıf; sembol karakteri YOK)", h1.includes(">gönderildi") && h1.includes("chatSonuc basarili") && h1.includes('chatMesaj basarili'));
  ok("liste: hedef kısa ad title'ı TAM kimlik taşır", h1.includes('title="' + A1 + '"'));
  ok("liste: boş-durum satırı gizlenir + otomatik en alta kaydırma", sham.chatBos.hidden === true && sham.chatListe.scrollTop === sham.chatListe.scrollHeight);
  ok("gönderim sonrası: editör temizlenir (gönderilen mesaj beklemesin)", sham.composerMesaj.value === "");
  ok("dugme geri döner: GÖNDER + disabled=false", sham.composerGonder.textContent === "GÖNDER" && sham.composerGonder.disabled === false);

  /* (3) hata 429: 'hata: HTTP 429 — …' kırmızı ince satır + mesaj editörde KALIR (yeniden denenebilir) */
  yanit = { ok: false, status: 429, json: async () => ({ hata: "pencere dolu" }) };
  sham.composerMesaj.value = "<script>alert(1)</script> " + "x".repeat(100);
  await gonder();
  const h2 = sham.chatListe.innerHTML;
  ok("hata: İNCE satır 'hata: HTTP 429 — pencere dolu' (kırmızı sınıf)", h2.includes(">hata: HTTP 429 — pencere dolu") && h2.includes("chatSonuc hata") && h2.includes('chatMesaj hata'));
  ok("hata: mesaj editörde KALIR (yeniden deneme yüzü dürüst)", sham.composerMesaj.value.includes("<script>"));
  ok("XSS: mesaj metni esc'ten geçer (görüntü + title)", h2.includes("&lt;script&gt;alert(1)&lt;/script&gt;") && !h2.includes("<script>alert"));
  ok("taşma: görüntü kisalt(80) + '…'; title TAM metin", h2.includes("…") && /title="&lt;script&gt;alert\(1\)&lt;\/script&gt; x{100}"/.test(h2));

  /* (4) ağ hatası: fetch reddi → dürüst 'hata: bağlantı koptu' */
  agHatasi = true;
  sham.composerMesaj.value = "bağlantı denemesi";
  await gonder();
  ok("ağ hatası: 'hata: bağlantı koptu' ince satırda (kirmiziYüz DEĞİL)", sham.chatListe.innerHTML.includes("hata: bağlantı koptu") && sham.chatListe.innerHTML.includes("chatMesaj hata"));
  agHatasi = false;

  /* (4b) kurtarma: ağ döndü → yeniden gönderim 'gönderildi' ile kapanır */
  yanit = { ok: true, json: async () => ({ gonderildi: true, zamanISO: "2026-11-03T12:05:00Z" }) };
  await gonder();
  ok("kurtarma: yeniden gönderim 'gönderildi' ince satırıyla kapanır (editör temizlenir)", sham.chatListe.innerHTML.includes("chatMesaj basarili") && sham.composerMesaj.value === "");

  /* (5) emoji taraması: render çıktısında sembol karakteri YOK (§4 — renk diliyle anlatılır) */
  const emojiChat = (sham.chatListe.innerHTML.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{2713}\u{2714}\u{26A0}]/gu) || []);
  ok("chat çıktısında emoji/✓/⚠ karakteri YOK (düz metin — §4)", emojiChat.length === 0, "bulunan: " + emojiChat.length);

  /* (6) liste oturum-içi birikir: 4 gönderim = 4 giriş; her biri kendi sonucunu taşır */
  ok("birikim: 4 giriş oturum listesinde (başarı+hata karışık, sıra korunur)", oturumMesajlari.length === 4 && (sham.chatListe.innerHTML.match(/class="chatMesaj/g) || []).length === 4);
  ok("kayıt yapısı: saat/hedefKisa/hedefKimlik/metin/sonuc alanları (bellek-içi)", oturumMesajlari.every((m) => typeof m.saat === "string" && m.hedefKimlik === A1 && typeof m.metin === "string" && m.sonuc && typeof m.sonuc.tur === "string"));
});

test("51h- PANEL-ANA-1 (kaynak-pin): orta panel ALT SEKMELER kısa ad + DAR — SİSTEM SAĞLIĞI görünürde «SAĞLIK», TAM ad title/aria'da; cila pinleri (K-0061 korunur)", () => {
  const h = htmlKisim();
  /* --- kısa ad: SİSTEM SAĞLIĞI → SAĞLIK; TAM ad title'da; erişilebilirlik AYNEN --- */
  ok("sek-saglik görünür etiketi KISA ad 'SAĞLIK' + title TAM ad 'SİSTEM SAĞLIĞI'", /id="sek-saglik"[^>]*title="SİSTEM SAĞLIĞI"[^>]*>SAĞLIK<\/button>/.test(h));
  ok("sek-saglik etiketi uzun ad taşımayı BIRAKTI (eski >SİSTEM SAĞLIĞI< kalıntısı YOK)", !/id="sek-saglik"[^>]*>SİSTEM SAĞLIĞI</.test(h));
  ok("5 alt sekmenin HEPSİNDE title (tam ad) + role=tab + aria-controls AYNEN", ["durum", "plan", "akis", "saglik", "log"].every((s) => new RegExp('id="sek-' + s + '"[^>]*role="tab"[^>]*aria-controls="' + s + 'Bolum"[^>]*title="').test(h)));
  ok("tablist aria-label TAM adları taşımayı sürdürür (görünmez a11y betimleme)", h.includes('aria-label="ORDU panel sekmeleri — DURUM · PLAN · AKIŞ · SİSTEM SAĞLIĞI · LOG"'));
  ok("bölüm h2 başlıkları TAM ad AYNEN (SAĞLIK yalnız SEKME kısa adıdır)", /SİSTEM SAĞLIĞI\s*<\/h2/.test(HTML));
  /* --- DAR sekme stili: yatay dolgu 12px → 8px; 30px satır ailesi KORUNUR (§5 ≥26px) --- */
  ok("DAR alt sekme: #altSekmeSerit .sekme padding:0 8px (eski 12px — BİLİNÇLİ)", /#altSekmeSerit \.sekme\s*\{[^}]*padding:\s*0 8px/.test(HTML));
  ok("DAR alt sekme: 30px satır + 12px etiket KOMPAKT ailede kalır (§5 ≥26px)", /#altSekmeSerit \.sekme\s*\{[^}]*min-height:\s*30px/.test(HTML) && /#altSekmeSerit \.sekme\s*\{[^}]*font-size:\s*12px/.test(HTML));
  /* --- cila (görsel yalnız — veri katmanı AYNEN): focus/hover/aktif hiyerarşisi --- */
  ok("sekme klavye odağı görünür (.sekme:focus-visible outline petrol)", /\.sekme:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--camgobegi\)/.test(HTML));
  ok("aktif olmayan sekme hover yüzü (yuzey3 — aktif sekme hover'da DEĞİŞMEZ)", /\.sekme:not\(\.aktif\):hover\s*\{[^}]*background:\s*var\(--yuzey3\)/.test(HTML));
  ok("aktif sekme hiyerarşisi: font-weight 700 (pasif 600)", /\.sekme\.aktif\s*\{[^}]*font-weight:\s*700/.test(HTML));
  ok("sekme geçişi yalnız renk (E12: transition color/background)", /\.sekme\s*\{[^}]*transition:\s*color 160ms ease, background 160ms ease/.test(HTML));
  ok("cila sınırı: gölge YOK kalır + petrol tek aksan AYNEN (K-0061)", (HTML.replace(/box-shadow:\s*inset[^;}]*[;}]/g, "").match(/box-shadow/g) || []).length === 0 && HTML.includes("--camgobegi:#0f4c81"));
});

test("51i- PANEL-ANA-1 FAZ-C (kaynak-pin): sağ kolon TEK chat birimi — liste üstte ESNEK + composer ALTTA SABİT (eski ayrı #bolum-composer bölümü KALDIRILDI; JS AYNEN)", () => {
  const h = htmlKisim();
  const j = jsKisim();
  /* --- tek-bölüm yapısı: ayrı composer BÖLÜMÜ + başlığı gider --- */
  ok("#sag'da TEK .bolum: bolum-chat; eski <section id=bolum-composer> KALDIRILDI", h.includes('<section class="bolum" id="bolum-chat"') && !/<section[^>]*id="bolum-composer"/.test(h));
  ok("COMPOSER h2 başlığı YOK (composer-baslik id'si + h2 gövdesi kalıntısı)", !h.includes('id="composer-baslik"') && !/COMPOSER\s*<\/h2/.test(h));
  ok("composer #bolum-chat İÇİNDE (sarmalayıcı div.composerAlan — bölüm değil)", h.indexOf('id="bolum-chat"') < h.indexOf('id="bolum-composer"') && h.indexOf('id="bolum-composer"') < h.indexOf('id="composerForm"') && h.includes('<div id="bolum-composer" class="composerAlan"'));
  ok("bölüm kapanışı composer'dan SONRA (form bölümün içinde kalır — kopuk değil)", h.indexOf("</section>", h.indexOf('id="composerForm"')) > h.indexOf('id="composerForm"'));
  /* --- flex zinciri: liste kolonun kalanını doldurur + kendi içinde kayar; composer altta SABİT --- */
  ok("TEK birim esner: #bolum-chat flex:1 1 auto + min-height:0 (kolonu doldurur)", /#bolum-chat\s*\{[^}]*flex:\s*1 1 auto[^}]*min-height:\s*0/.test(HTML));
  ok("liste ESNEK + kendi içinde kayar: .chatListe flex:1 1 auto + min-height:0 + overflow-y:auto (eski min-height:140px BİLİNÇLİ gitti)", /\.chatListe\s*\{[^}]*flex:\s*1 1 auto[^}]*min-height:\s*0[^}]*overflow-y:\s*auto/.test(HTML));
  ok("composer ALTTA SABİT: .composerAlan flex:none (ayraç çizgisi border-top ile)", /\.composerAlan\s*\{[^}]*flex:\s*none[^}]*border-top:\s*1px solid var\(--cizgi\)/.test(HTML));
  ok("istifte (<899px) doğal sıra korunur: bölüm flex:none + liste min tabanı 140px geri döner", /@media \(max-width:899px\)[\s\S]*?#bolum-chat\s*\{[^}]*flex:\s*none/.test(HTML) && /@media \(max-width:899px\)[\s\S]*?\.chatListe\s*\{[^}]*min-height:\s*140px/.test(HTML));
  /* --- composer İÇİ AYNEN: alan sırası + id'ler + JS girdi koruması --- */
  const sira = ["composerHedef", "composerMesaj", "token", "composerGonder"].map((id) => h.indexOf('id="' + id + '"'));
  ok("composer alan sırası AYNEN: Hedef → Mesaj → token → GÖNDER", sira.every((i) => i >= 0) && sira.every((i, k) => k === 0 || i > sira[k - 1]));
  ok("composer id'leri AYNEN (form/hedef/mesaj/token/gonder/sonuc — JS $('…') çağrıları yaşar)", ["composerForm", "composerHedef", "composerMesaj", "token", "composerGonder", "composerSonuc"].every((id) => h.includes('id="' + id + '"')));
  ok("JS AYNEN: yenileme girdi koruması odakIcindeMi(\"#bolum-composer\") seçicisi sarmalayıcı kimliğiyle yaşar (JS hunk YOK)", j.includes('odakIcindeMi("#bolum-composer")'));
  ok("JS AYNEN: composer submit + 2 AYRI optgroup davranışı değişmedi (JS hunk YOK sınıfı)", j.includes('$("composerForm").addEventListener') && j.includes("optgroup"));
});

test("51j- PANEL-ANA-1 FAZ-D+E+F (kaynak-pin + vm): ana şerit proje sekmeleri DAR (kisalt 16 + title TAM ad — dizin + max-width emniyeti) · ağaç etiketleri «aşırı minimal» (12/14 + satır title birleşik) + okunabilirlik (13px) · AKTİF projeler ÜSTTE (stabil ayrım — kayıt değişmez)", () => {
  const j = jsKisim();
  /* --- FAZ-D: ana şerit proje sekmeleri (steering «üst sekme çok fazla geniş oluyor dağılıyor») --- */
  ok("proje sekmesi etiketi kisalt(ad, 16) (kisalt null dönerse dürüst yedek ad)", j.includes("kisalt(ad, 16) || ad"));
  ok("proje sekmesi title TAM ad — dizin (eski title=dizin yok — bilinçli değişti)", j.includes('esc(ad + " — " + dizin)'));
  ok("data-ana TAM dizin AYNEN (seçim/kapatma yolu değişmez)", j.includes('data-ana="\' + esc(dizin) + \'"'));
  ok("DAR dolgu: #anaSekmeSerit .sekme padding:0 8px (alt şerit FAZ-B ailesiyle aynı)", /#anaSekmeSerit \.sekme\s*\{[^}]*padding:\s*0 8px/.test(HTML));
  ok("taşma emniyeti: .anaSekmeGrup .sekme max-width:180px + overflow:hidden + text-overflow:ellipsis", /\.anaSekmeGrup \.sekme\s*\{[^}]*max-width:\s*180px[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis/.test(HTML));
  ok("ORDU sabit sekme + sekmeKapat AYNEN (kapanış yolu değişmez)", j.includes('id="sek-ordu"') && j.includes('class="sekmeKapat"'));
  /* --- FAZ-D davranış (vm): uzun ad → 15+'…'; title TAM — dizin; data-ana TAM --- */
  const sahte2 = {};
  const $2 = (id) => (sahte2[id] = sahte2[id] || { innerHTML: "" });
  const ctx2 = {
    $: $2, esc: fnAl("esc"), kisalt: fnAl("kisalt"),
    P: { projeler: [
      { dizin: "P-uzun", projeAdi: "01234567890123456789012", orduMu: false, ajanlar: [] },
      { dizin: "P-kisa", projeAdi: "kisa", orduMu: false, ajanlar: [] },
    ] },
    aktifSekme: "ordu", acikSekmeler: ["P-uzun", "P-kisa"],
  };
  vm.runInNewContext(HTML.slice(HTML.indexOf("function anaSekmeYaz("), HTML.indexOf('$("anaSekmeSerit").addEventListener')) + "\nanaSekmeYaz", ctx2)();
  const hs = sahte2.anaSekmeSerit.innerHTML;
  ok("vm: uzun ad 15+'…' görünür (kisalt 16) — sekme DAR kalır", hs.includes(">012345678901234…</button>"));
  ok("vm: title TAM ad — dizin + data-ana TAM dizin (kaybolduğu yerde erişilebilir kalır)", hs.includes('title="01234567890123456789012 — P-uzun"') && hs.includes('data-ana="P-uzun"'));
  ok("vm: kısa ad aynen + ORDU sabit sekme şeridin İLKİNDE", hs.includes(">kisa</button>") && hs.indexOf('id="sek-ordu"') < hs.indexOf('data-ana="P-uzun"'));
  /* --- FAZ-E: ağaç etiketleri (steering «aşırı minimal» + E-ek1/E-ek2 «kısalmıyor/küçük») --- */
  ok("oturum düğümü etiketi kisalt(a.etiket, 12) (eski 20 — bilinçli)", j.includes("kisalt(a.etiket, 12)"));
  ok("proje satırı görünen adı kisalt(pr.projeAdi, 14) (eski TAM — bilinçli)", j.includes("kisalt(pr.projeAdi, 14) || pr.projeAdi"));
  ok("E-ek1: satır title'ı birleşik dürüst bicim 'TAM ad — N çalışan · M ajan kaydı' (calisan/kayıt bilgisi KORUNUR)", j.includes('esc(pr.projeAdi) + " — " + calisan + " çalışan · " + ajanlar.length'));
  ok("E-ek1: agacAd'in KENDİ title'i YOK (TAM ad satır title'ında — çift tooltip kaldırıldı)", !j.includes('class="agacAd" title='));
  ok("CHAT başlığındaki kisalt(a.etiket, 20) AYNEN (kullanıcı «soldaki» dedi — yalnız ağaç)", j.includes("kisalt(a.etiket, 20)"));
  ok("AKIŞ satırı kisalt(o.ad, 80) AYNEN (bu turun kapsamı dışı)", j.includes("kisalt(o.ad, 80)"));
  ok("E-ek2: .agacProjeBas font-size:13px + .agacAjan font-size:13px (12→13 — kompakt baz 13px)", /\.agacProjeBas\s*\{[^}]*font-size:\s*13px/.test(HTML) && /\.agacAjan\s*\{[^}]*font-size:\s*13px/.test(HTML));
  ok("E-ek2: .agacGrupBas 11px mono (10→11)", /\.agacGrupBas\s*\{[^}]*font:\s*700 11px var\(--mono\)/.test(HTML));
  ok("E-ek2: satır yüksekliği 28px KORUNUR (§5 ≥26px; yalnız font büyür)", /\.agacProjeBas\s*\{[^}]*min-height:\s*28px/.test(HTML) && /\.agacAjan\s*\{[^}]*min-height:\s*28px/.test(HTML));
  /* --- FAZ-F: aktif projeler ÜSTTE (steering «solda aktif projeler üstte olsun pasifler aşağıda») --- */
  ok("FAZ-F kaynak: calisanSay (running sayımı — .agacSayi'nın aynısı) + gorunen stabil ayrımı", j.includes("const calisanSay = (pr) =>") && j.includes("const gorunen = [...projeler].sort") && j.includes("for (const pr of gorunen)"));
  ok("FAZ-F: kalıcı kayıt ŞEMASI AYNEN (ordu-agac-sira; YENİ anahtar YOK — aktiflik tercihe bağlı değil)", j.includes('kaydet("ordu-agac-sira"') && !/ordu-agac-(aktif|pasif|fa)/.test(j));
});
