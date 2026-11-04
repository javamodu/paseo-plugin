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
// PANEL-ANA-1 FAZ-M: transcript okuma saf fonksiyonları (konusma-oku.mjs — yeni dosya)
import { slugYap, kuyrukOku as kuyrukOkuFn, satirdanBalon, balonTavan, transcriptHazirla } from "./konusma-oku.mjs";
// FAZ-M hermetik sunucu testi: gerçek node çocuk süreci (d1a deseni — spawn + PANO_PORT=0)
import { spawn } from "node:child_process";

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

test("1- PANEL-SIFIR-1 KABUK: 3 kolon (sol ağaç / ORTA chat — FAZ-O EK-3 kolon takası / sağ sekmeli bölge) — tüm sökülen YÜZ bölümleri KALINTI 0 (kullanıcı fermanı 2026-11-03 «herşeyi sök sadece şunu» + STEER «ortada o projeye ait task grafı» + FAZ-O EK-3 «chat sekmesini ortaya al orta bölümü sağa al» 2026-11-04)", () => {
  ok("SOL = GEZGİN (bolum-agac + h2 GEZGİN)", HTML.includes('id="bolum-agac"') && /GEZGİN\s*<\/h2/.test(HTML));
  ok("ORTA = CHAT (bolum-chat — FAZ-O EK-3: chat ortaya taşındı; h2 CHAT başlığı FAZ-O'da SÖKÜLDÜ — sohbette görünür başlık YOK, chatgpt.com dili)", HTML.includes('id="bolum-chat"') && !/CHAT\s*<\/h2/.test(HTML) && HTML.indexOf('<section id="orta"') < HTML.indexOf('id="bolum-chat"') && HTML.indexOf('id="bolum-chat"') < HTML.indexOf('<section id="sag"'));
  ok("SAĞ = sekmeli kabuk (anaSekmeSerit + sekmeGovde — FAZ-O EK-3: sekmeli bölge sağa taşındı)", HTML.includes('id="anaSekmeSerit"') && HTML.includes('id="sekmeGovde"') && HTML.indexOf('<section id="sag"') < HTML.indexOf('id="anaSekmeSerit"') && HTML.indexOf('id="bolum-chat"') < HTML.indexOf('<section id="sag"'));
  ok("ORDU ana sekmesi ŞERİTTE SABİT (HTML gövdesinde)", htmlKisim().includes('id="sek-ordu"') && htmlKisim().includes('>ORDU</button>'));
  const solIdx = HTML.indexOf('id="sol"');
  const ortaIdx = HTML.indexOf('id="orta"');
  const sagIdx = HTML.indexOf('id="sag"');
  ok("DOM sırası sol < orta < sag (kimlik yolları değişmez)", solIdx > 0 && ortaIdx > solIdx && sagIdx > ortaIdx);
  /* --- SÖKÜLEN YÜZLER (bilinçli — bilinçli silim listesi raporda) --- */
  ok("yüz bölümleri KALDIRILDI: bolum-genel/plan/akis/saglik/log", !HTML.includes('id="bolum-genel"') && !HTML.includes('id="bolum-plan"') && !HTML.includes('id="bolum-akis"') && !HTML.includes('id="bolum-saglik"') && !HTML.includes('id="bolum-log"'));
  ok("h2 yüz başlıkları KALDIRILDI (GENEL DURUM/PLAN/AKIŞ/SİSTEM SAĞLIĞI/LOG)", !/GENEL DURUM\s*<\/h2/.test(HTML) && !/>\s*PLAN\s*<\/h2/.test(HTML) && !/AKIŞ\s*<\/h2/.test(HTML) && !/SİSTEM SAĞLIĞI\s*<\/h2/.test(HTML) && !/>\s*LOG\s*<\/h2/.test(HTML));
  ok("üst bar KALDIRILDI (ustbar/marka/ustSag/ustNav — id + CSS + kod)", !HTML.includes('class="ustbar"') && !HTML.includes('id="ustbar"') && !/\.ustbar\s*\{/.test(HTML) && !/\.marka\s*\{/.test(HTML) && !/\.ustSag\s*\{/.test(HTML) && !/\.ustNav\s*\{/.test(HTML));
  ok("alt sekme şeridi KALDIRILDI (altSekmeSerit id + CSS + JS)", !HTML.includes('id="altSekmeSerit"') && !/#altSekmeSerit\s*\{/.test(HTML) && !jsKisim().includes("altSekmeSerit"));
  ok("hero özet kartları KALDIRILDI (ozetGrid/ozetKart/ozetDeger CSS)", !/\.ozetGrid\s*\{/.test(HTML) && !/\.ozetKart\s*\{/.test(HTML) && !/\.ozetDeger\s*\{/.test(HTML));
  ok("plan tabloları KALDIRILDI (planTablo CSS + tabloYaz/projeTabloYaz + tabloSarma)", !/\.planTablo\s*\{/.test(HTML) && !jsKisim().includes("function tabloYaz(") && !jsKisim().includes("function projeTabloYaz(") && !HTML.includes("tabloSarma"));
  ok("GÖREV GRAF TAŞINDI (STEER 2026-11-03 «ortada o projeye ait task grafı»): dalgaYaz + gorevKutusu + cepheKutusu + dalga CSS KALIR — ORTA sekme gövdesine taşındı", jsKisim().includes("function dalgaYaz(") && jsKisim().includes("function gorevKutusu(") && jsKisim().includes("function cepheKutusu(") && /\.dalgaSatiri\s*\{/.test(HTML) && /\.gorevKutu\s*\{/.test(HTML));
  ok("tuvalLink SÖKÜLDÜ (/tuval 302 — kapsül tuval alt sayfası iptal) + olayCubuk KALDIRILDI (mekanizma: CSS kuralı + render çağrısı 0 — yorumdaki kelime değil)", !/\.tuvalLink\s*\{/.test(HTML) && !HTML.includes('class="tuvalLink"') && !HTML.includes('href="/tuval"') && !/\.olayCubuk/.test(HTML));
  ok("akış/sağlık/log yüzleri KALDIRILDI (akisYukle/saglikYukle/logYukle + CSS)", !jsKisim().includes("function akisYukle(") && !jsKisim().includes("function saglikYukle(") && !jsKisim().includes("function logYukle(") && !/\.akisSatiri\s*\{/.test(HTML) && !/\.saglikKart\s*\{/.test(HTML));
  ok("graf API KALIR — orta görev grafı (UC.graf + grafYukle)", jsKisim().includes('"/api/graf"') && jsKisim().includes("function grafYukle("));
  /* --- ORTA gövde: seçili sekmenin görev grafı (sahte kart/«yakında» YASAK E3) --- */
  ok("orta gövde graf paneli (grafPanel + role=tabpanel + grafAlani)", HTML.includes('id="grafPanel"') && HTML.includes('role="tabpanel"') && HTML.includes('id="grafAlani"'));
  ok("bosPanel sahte boş yüzü KALDIRILDI (graf taşındı)", !HTML.includes('id="bosPanel"'));
  ok("canvas YOK + SVG çizim API YOK (createElementNS)", !HTML.includes("<canvas") && !jsKisim().includes("createElementNS"));
});

test("2- GEZGİN AĞACI (FAZ-B): SOL kolon = projeler + konuşmalar; üstteki select KALDIRILDI (tek seçim yolu ağaç)", () => {
  /* --- KALDIRILANLAR (bilinçli: ağaç tek seçim yolu — çift kaynak yasak) --- */
  ok("üstteki proje select KALDIRILDI", !HTML.includes('id="projeSec"') && !HTML.includes('id="projeGrup"'));
  ok("proje durum kartı bölümü KALDIRILDI (tablo ORTA sekmeye taşındı)", !HTML.includes('id="bolum-projekart"') && !HTML.includes('id="projeKartIci"'));
  ok("gorunumDegistir FAZ-O'da YENİDEN VAR — 4-görünümlü menü anahtarı (eski ikili proje/konuşma modu KALDIRILDI: gecisYeri/proje-konusma toggle kalıntısı YOK; GORUNUMLER sabiti 4 üye)", jsKisim().includes("function gorunumDegistir(") && jsKisim().includes('const GORUNUMLER = ["sohbet", "api", "ayarlar", "doktor"]') && !jsKisim().includes("gecisYeri"));
  /* --- YENİ: gezgin ağacı kabuğu --- */
  ok("SOL = GEZGİN (bolum-agac + h2 GEZGİN)", HTML.includes('id="bolum-agac"') && /GEZGİN\s*<\/h2/.test(HTML));
  ok("ağaç kapları: agacAlani + agacHata (fail-closed kırmızı yüz) — agacOzet SÖKÜLDÜ (PANEL-SIFIR-1)", HTML.includes('id="agacAlani"') && HTML.includes('id="agacHata"') && !HTML.includes('id="agacOzet"'));
  ok("ağaç CSS sınıfları (agac/agacProje/agacAjan/agacCocuklar)", /\.agac\s*\{/.test(HTML) && /\.agacProje\s*\{/.test(HTML) && /\.agacAjan\s*\{/.test(HTML) && /\.agacCocuklar\s*\{/.test(HTML));
  ok("ağaç düğümü FAZ-H 32px (steering «okunaklı» 2026-11-03; 28→32 — eski 44px pin BİLİNÇLİ değişti)", /\.agacProjeBas\s*\{[^}]*min-height:\s*32px/.test(HTML) && /\.agacAjan\s*\{[^}]*min-height:\s*32px/.test(HTML));
  ok("durum noktası sınıfları: running yesil · idle gri · error kirmizi · closed KAPALI-soluk", jsKisim().includes('const NOKTA_SINIF = { running: "yesil", idle: "gri", error: "kirmizi", closed: "kapali" }') && /\.nokta\.kapali\s*\{[^}]*opacity:\s*0\.45/.test(HTML));
  /* --- kalıcılık: ordu-agac-* anahtarları (ordu-solW/sagW ile ÇAKIŞMAZ) --- */
  const j = jsKisim();
  ok("akordiyon kalıcı: ordu-agac-acik", j.includes('kaydet("ordu-agac-acik"') && j.includes('oku("ordu-agac-acik")'));
  ok("seçili düğüm kalıcı: ordu-agac-secili", j.includes('kaydet("ordu-agac-secili"') && j.includes('oku("ordu-agac-secili")'));
  ok("tuval/panel genişlik anahtarlarıyla çakışma YOK", !HTML.includes("tuval-solW") && !HTML.includes("tuval-sagW"));
  /* --- davranış: proje tıkla → akordiyon + sekme; ajan tıkla → seçili konuşma --- */
  ok("proje düğümüne tıkla → akordiyon AÇ/KAPA + sekme açılır", j.includes("agacAcik.has(dizin)") && j.includes("sekmeAc(dizin)"));
  ok("ajan düğümüne tıkla → seçili konuşma + composer hedefi", j.includes("agacSecili = ajanDugumu.dataset.ajan") && j.includes("konusmaSecGuncelle()"));
  ok("ağaç etiketi esc() ile taşınır (ham title — XSS yükü zararsız; FAZ-K TAM ad esc(ad) ile sarılır)", j.includes("esc(ad)") && j.includes("etiketVar ? a.etiket"));
  ok("ajan kimliği TAM uuid'yle data-ajan'da (whitelist gönderim hedefi) + 8 hane görünüde", j.includes('data-ajan="\' + esc(a.ajanKimligi)') && j.includes("a.ajanId || kisaIdGoster(a.ajanKimligi)"));
  ok("dürüst satır: doğmamış workspace görünmez (ağaçta taşındı)", HTML.includes("ajanı hiç doğmamış workspace bu kaynakta GÖRÜNMEZ"));
  ok("tarama ölürse ağacın KENDİ kırmızı yüzü (agacHata + P=null)", j.includes('kirmiziYuzGoster("agacHata", "agacAlani"') && j.includes("P = null"));
});

test("3- esc() birebir korunur + tum dinamik metin esc'ten gecer", () => {
  ok("esc fonksiyonu satiri", HTML.includes('function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }'));
  ok("esc sayfada cagriliyor (kaynakta kullanım)", (jsKisim().match(/esc\(/g) || []).length >= 20, "bulunan esc() cagrisi: " + (jsKisim().match(/esc\(/g) || []).length);
});

test("4- fail-closed: kalan uçların kendi kirmizi yuzu + VERI OKUNAMADI (yüz kırmızıları yüzlerle birlikte SÖKÜLDÜ — PANEL-SIFIR-1)", () => {
  ok("kirmiziYuzGoster fonksiyonu", HTML.includes("function kirmiziYuzGoster("));
  ok("kirmizi yuz metni VERİ OKUNAMADI", HTML.includes("VERİ OKUNAMADI"));
  ok("agacHata + grafHata kırmızı yüz KALIR (ağaç + graf uçları fail-closed)", HTML.includes('id="agacHata"') && HTML.includes('id="grafHata"'));
  ok("yüz kırmızıları KALDIRILDI (genelHata/planHata/orduHata/akisHata/saglikHata/logHata/projeHata)", !HTML.includes('id="genelHata"') && !HTML.includes('id="planHata"') && !HTML.includes('id="orduHata"') && !HTML.includes('id="akisHata"') && !HTML.includes('id="saglikHata"') && !HTML.includes('id="logHata"') && !HTML.includes('id="projeHata"'));
  const uyari = (htmlKisim().match(/role="alert"/g) || []).length;
  ok("role=alert = 2 (ağaç + graf — kalan uç başına bir yüz)", uyari === 2, "bulunan: " + uyari);
  ok("hata yuzunde bayat veri kalmaz (icerik innerHTML bosaltilir)", jsKisim().includes('$(icerikId).innerHTML = ""'));
});

test("5- 30 sn yenileme + uc sabitleri DARALTIILDI (PANEL-SIFIR-1: kalan uç kadro + projeler + graf; genel/akis/saglik/log çağrıları söküldü)", () => {
  ok("YENILE_SN = 30", jsKisim().includes("const YENILE_SN = 30;"));
  ok("setInterval(hepsiniYukle, YENILE_SN * 1000)", jsKisim().includes("setInterval(hepsiniYukle, YENILE_SN * 1000);"));
  const uclar = ["/api/ordu/kadro", "/api/ordu/projeler", "/api/graf"];
  for (const u of uclar) ok("kalan uc sabiti: " + u, jsKisim().includes('"' + u + '"'));
  const cagrilar = (jsKisim().match(/cek\(UC\.\w+/g) || []).length;
  ok("3 cek cagrisi (kadro + projeler + graf — kalan uç başına bir)", cagrilar === 3, "bulunan: " + cagrilar);
  for (const u of ["/api/ordu/genel", "/api/ordu/akis", "/api/ordu/saglik", "/api/ordu/log"]) {
    ok("sökülen uç KALINTISI YOK (UI çağrı kodu): " + u, !jsKisim().includes('"' + u + '"'));
  }
  ok("hepsiniYukle kalan uçlara daraltıldı (FAZ-P EK: async + Promise.all — uçlar paralel; satır ~148 bilinçli)", jsKisim().includes("async function hepsiniYukle() {") && jsKisim().includes("await Promise.all([kadroYukle(), projelerYukle(), grafYukle()])"));
  ok("sökülen yükleyici fonksiyonlar KALINTI YOK (genelYukle/planYukle/akisYukle/saglikYukle/logYukle)", !jsKisim().includes("function genelYukle(") && !jsKisim().includes("function planYukle(") && !jsKisim().includes("function akisYukle(") && !jsKisim().includes("function saglikYukle(") && !jsKisim().includes("function logYukle("));
  ok("tek YAZMA ucu POST /api/mesaj KALIR (composer)", jsKisim().includes('"/api/mesaj"') && jsKisim().includes('method: "POST"'));
});

test("10- TASARIM pinleri — FAZ-P REVİZYON 2026-11-04 kompakt-okunaklı ölçek (TASARIM-MANIFESTOSU §1/§2; eski FAZ-H 15px ölçeği revize edildi); §4/§6/§7 AYNEN; §5 minimumlar yukarı taşındı)", () => {
  ok("FAZ-P baz 13px (REVİZYON 2026-11-04 §1 — «minimal kompakt»; eski FAZ-H 15px bilinçli değişti)", /body\s*\{[^}]*font-size:\s*13px/.test(HTML));
  ok("FAZ-P bolum-etiket 15px/600 (§1 başlık 15-16px bandı — eski 18px)", /\.bolum-etiket\s*\{[^}]*font-size:\s*15px/.test(HTML) && /\.bolum-etiket\s*\{[^}]*font-weight:\s*600/.test(HTML));
  ok("§2 tek viewport: body height:100vh + overflow:hidden (sutunlar kendi icinde kayar)", /body\s*\{[^}]*height:\s*100vh/.test(HTML) && /body\s*\{[^}]*overflow:\s*hidden/.test(HTML));
  ok("§4 light tema tokenlari", HTML.includes("--metin:#1a2332"));
  ok("§4 R3 token'lari birebir: yuzey2/yuzey3/glow", HTML.includes("--yuzey2:#eef2f7") && HTML.includes("--yuzey3:#e4eaf2") && HTML.includes("--glow:rgba(15,76,129,0.18)"));
  ok("§4 BEYAZ zemin (STEERING-8 mirasi)", /--zemin:\s*#ffffff/.test(HTML) && !HTML.includes("--zemin:#f4f6f9"));
  ok("FAZ-P radius 10/8/6 (§4 yumuşak/uyumlu — eski 6/4/4 bilinçli değişti)", HTML.includes("--radius:10px") && HTML.includes("--radius-k:8px") && HTML.includes("--radius-cip:6px"));
  ok("FAZ-P bolum padding 10px 12px 12px (§2 EKONOMİK ritim — eski 16px 20px 20px)", /\.bolum\s*\{[^}]*padding:\s*10px 12px/.test(HTML));
  ok("FAZ-P satir 1.5 (eski 1.55)", /body\s*\{[^}]*line-height:\s*1\.5/.test(HTML));
  ok("§2 main max-width 1760px (kapsul-tuval duzeni)", /main\s*\{[^}]*max-width:\s*1760px/.test(HTML));
  ok("§5 44px dokunma KALIR: composer girdileri (select/input); GÖNDER 40px KISAT alt sınırı + ağaç 28px KOMPAKT (BİLİNÇLİ)", HTML.includes("--min-dokunma:44px") && /#composerForm select, #composerForm input\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(HTML) && /#composerGonder\s*\{[^}]*min-height:\s*40px/.test(HTML));
  ok("§5 44px dokunma KALIR: composer girdileri (select/input); GÖNDER 40px KISAT alt sınırı + ağaç 32px FAZ-H (BİLİNÇLİ: 28→32)", HTML.includes("--min-dokunma:44px") && /#composerForm select, #composerForm input\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(HTML) && /#composerGonder\s*\{[^}]*min-height:\s*40px/.test(HTML));
  ok("§5 prefers-reduced-motion kapatir", HTML.includes("@media (prefers-reduced-motion: reduce)"));
  const nabizBlok = HTML.match(/@keyframes\s+nabiz\s*\{[\s\S]*?\}\s*\}/);
  ok("§6 keyframes FAZ-H istisna: yalnız nabiz (≤2 yeni — brief) + blok opacity-only (layout animasyon YASAK)", (HTML.match(/@keyframes/g) || []).length <= 2 && HTML.includes("@keyframes nabiz") && !!nabizBlok && !/(width|height|padding|margin|top|left|right|bottom|font-size)\s*:/.test(nabizBlok[0]) && /\.nokta\.yesil\s*\{[^}]*animation:\s*nabiz/.test(HTML));
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
  ok("§7 title yalniz kimlik (statik — graf sürümü sayacı yüzlerle birlikte SÖKÜLDÜ)", htmlKisim().includes("<title>ORDU KOMUTA PANELİ — ordu</title>"));
  ok("§7 meta description (kimlik)", htmlKisim().includes('<meta name="description"'));
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
  ok("FAZ-P §2a genislik degiskenleri: --solW 240px / --sagW 560px (SAĞ EN GENİŞ — eski 320)", HTML.includes("--solW:240px") && HTML.includes("--sagW:560px"));
  ok("grid-cocuklar ACIK kolonlara sabitlenir (kapali panel kaydirmaz — kapsul-tuval bug-fix deseni)", /main\s*>\s*#sol\s*\{\s*grid-column:\s*1\s*;?\s*\}/.test(HTML) && /main\s*>\s*#orta\s*\{\s*grid-column:\s*3\s*;?\s*\}/.test(HTML) && /main\s*>\s*#sag\s*\{\s*grid-column:\s*5\s*;?\s*\}/.test(HTML));
  ok("FAZ-B: ORDU-disi 1/-1 kart hucresi KALDIRILDI (kart → ORTA proje sekmesi tablosu)", !/#bolum-projekart\s*\{/.test(HTML));
  ok("[hidden] acik kurali (display kurallari ezmesin — kapsul-tuval deseni)", /\[hidden\]\s*\{\s*display:\s*none\s*!important/.test(HTML));
  ok("main overflow:hidden (kaydirma yalniz sutunlarda)", /main\s*\{[^}]*overflow:\s*hidden/.test(HTML));
  for (const id of ["sol", "orta", "sag", "splitSol", "splitSag"]) ok('kolon kabugu id="' + id + '"', h.includes('id="' + id + '"'));
  ok("#sol + #orta kendi icinde kayar (FAZ-O EK-3: chat bölgesi #orta'da; #sag'da kaydıran #sekmeGovde — pin aşağıda)", /#sol\s*\{[^}]*overflow-y:\s*auto/.test(HTML) && /#orta\s*\{[^}]*overflow-y:\s*auto/.test(HTML) && !/#sag\s*\{[^}]*overflow-y:/.test(HTML));
  /* --- ORTA (PANEL-SIFIR-1): ANA sekme şeridi (ORDU SABİT + proje sekmeleri X ile); ALT şerit SÖKÜLDÜ --- */
  ok("#anaSekmeSerit role=tablist (ORDU sabit sekme kaynakta)", h.includes('<div id="anaSekmeSerit" role="tablist"') && h.includes('id="sek-ordu"'));
  ok("statik kaynakta 5 role=tab: ORDU (ana şerit) + 4 görünüm menü düğmesi (FAZ-O EK-scope — SOHBET/API/AYARLAR/DOKTOR; proje sekmeleri JS ile eklenir; alt şerit SÖKÜLDÜ)", (h.match(/role="tab"/g) || []).length === 5 && h.includes('id="gsek-sohbet"') && h.includes('id="gsek-api"') && h.includes('id="gsek-ayarlar"') && h.includes('id="gsek-doktor"'), "bulunan: " + (h.match(/role="tab"/g) || []).length);
  ok("alt sekme id'leri KALDIRILDI (sek-durum/plan/akis/saglik/log)", !h.includes('id="sek-durum"') && !h.includes('id="sek-plan"') && !h.includes('id="sek-akis"') && !h.includes('id="sek-saglik"') && !h.includes('id="sek-log"'));
  ok("ORDU başlangıçta aktif (aria-selected=true + tabindex=0)", /id="sek-ordu"[^>]*aria-selected="true"/.test(h) && /id="sek-ordu"[^>]*tabindex="0"/.test(h));
  ok("statik tabpanel 5: 4 görünüm (gorunum-sohbet/api/ayarlar/doktor — FAZ-O EK-scope) + sekmeGovde (eski bosPanel SÖKÜLDÜ; sahte kart YOK)", (h.match(/role="tabpanel"/g) || []).length === 5 && !h.includes('id="bosPanel"'), "bulunan: " + (h.match(/role="tabpanel"/g) || []).length);
  ok("yüz bölümleri KALDIRILDI: durumBolum/planBolum/akisBolum/saglikBolum/logBolum/projeSayfa/bosSayfa id'leri 0", !h.includes('id="durumBolum"') && !h.includes('id="planBolum"') && !h.includes('id="akisBolum"') && !h.includes('id="saglikBolum"') && !h.includes('id="logBolum"') && !h.includes('id="projeSayfa"') && !h.includes('id="bosSayfa"'));
  ok("sekme govdesi kendi icinde kayar (#sekmeGovde overflow-y:auto)", /#sekmeGovde\s*\{[^}]*overflow-y:\s*auto/.test(HTML));
  /* --- SPLITTER x2 (pointer + klavye ±16px + clamp) --- */
  ok("splitter HTML tam (splitSol — role/aria-orientation/aria-valuenow=240/tabindex)", h.includes('<div class="splitter" id="splitSol" role="separator" aria-label="sol panel genişliği" aria-orientation="vertical" aria-valuenow="240" tabindex="0"></div>'));
  ok("splitter HTML tam (splitSag — aria-valuenow=560 FAZ-P §2a)", h.includes('<div class="splitter" id="splitSag" role="separator" aria-label="sağ panel genişliği" aria-orientation="vertical" aria-valuenow="560" tabindex="0"></div>'));
  /* --- localStorage: ordu- onekli anahtarlar; tuvalinkilerle CAKISMAZ --- */
  ok("kaydet('ordu-' + taraf + 'W2') — FAZ-P anahtar sürümü (eski W kayıtları okunmaz — yeni ölçeği EZMEZ)", j.includes('kaydet("ordu-" + taraf + "W2"') && !j.includes('kaydet("ordu-" + taraf + "W"'));
  ok("oku('ordu-' + taraf + 'W2') — FAZ-P anahtar sürümü", j.includes('oku("ordu-" + taraf + "W2"') && !j.includes('oku("ordu-" + taraf + "W"'));
  ok("tuvalin anahtarlariyla cakisma YOK ('tuval-solW'/'tuval-sagW' literalleri YOK)", !HTML.includes("tuval-solW") && !HTML.includes("tuval-sagW"));
  /* --- script sözleşmesi (PANEL-SIFIR-1): sekmeDegistir + ALT_SEKME_PANEL SÖKÜLDÜ; splitter kopyası kalır --- */
  ok("sözleşme: sekmeDegistir + ALT_SEKME_PANEL KALDIRILDI (ana sekme yalnız şerit durumunu yönetir)", !j.includes("function sekmeDegistir(") && !j.includes("const ALT_SEKME_PANEL =") && !j.includes('sekmeDegistir("durum")'));
  ok("sözleşme: baslangis ORDU (anaSekmeYaz çağrısı — statik şeritle birebir)", j.includes("anaSekmeYaz();"));
  ok("sözleşme: splitterKur + genislikKenetle (kapsul-tuval ADIM-C kopyasi AYNEN)", j.includes("function splitterKur(") && j.includes("function genislikKenetle("));
  ok("sözleşme: setPointerCapture + lostpointercapture", j.includes("setPointerCapture") && j.includes("lostpointercapture"));
  ok("sözleşme: klavye ±16px (ArrowLeft/ArrowRight)", j.includes('e.key === "ArrowLeft"') && j.includes("-16 : 16"));
  ok("FAZ-P §2a taraf-bazlı clamp: KENAR sabiti sol 200-360 AYNEN · sag 320-760 (eski 260-460 — SAĞ EN GENİŞ)", j.includes("const KENAR = { sol: { min: 200, max: 360 }, sag: { min: 320, max: 760 } };") && j.includes("Math.max(k.min, Math.min(k.max"));
  ok("PANEL-SIFIR-1: 3 GET ucu — tek YAZMA ucu POST /api/mesaj (composer)", j.includes('method: "POST"') && j.includes('"/api/mesaj"') && (j.match(/cek\(UC\./g) || []).length === 3);
  /* --- duncyari ~<900px: sutunlar alt alta (PANEL-SIFIR-1: ağaç ÜSTTE — sol → orta → sag) --- */
  ok("899px kirilimda body scroll geri gelir (overflow:auto)", /@media \(max-width:899px\)[\s\S]*?body\s*\{[^}]*overflow:\s*auto/.test(HTML));
  ok("899px kirilimda splitter gizlenir", /@media \(max-width:899px\)[\s\S]*?\.splitter\s*\{[^}]*display:\s*none/.test(HTML));
  ok("logListe CSS KALDIRILDI (LOG yüzü söküldü)", !/\.logListe\s*\{/.test(HTML));
});

test("10e- KOMPAKT (steering 2026-11-03) yoğunluk + taşma kesme + kısa ad + panel genişliği pinleri (PANEL-SIFIR-1: kalan kabuk kapsamı)", () => {
  const h = htmlKisim();
  const j = jsKisim();
  /* --- yoğunluk: sekmeler + ağaç + composer --- */
  ok("sekme 34px + 13px etiket (FAZ-P §1 baz — eski 15px)", /\.sekme\s*\{[^}]*min-height:\s*34px/.test(HTML) && /\.sekme\s*\{[^}]*font-size:\s*13px/.test(HTML));
  ok("sekmeKapat 20px hedef (KOMPAKT)", /\.sekmeKapat\s*\{[^}]*width:\s*20px/.test(HTML) && /\.sekmeKapat\s*\{[^}]*height:\s*20px/.test(HTML));
  ok("agacAjan 32px + 13px metin (FAZ-P §1 — eski 15px); durum noktasi 8px; girinti 12px", /\.agacAjan\s*\{[^}]*min-height:\s*32px/.test(HTML) && /\.agacAjan\s*\{[^}]*font-size:\s*13px/.test(HTML) && /\.agacAjan \.nokta\s*\{[^}]*width:\s*8px/.test(HTML) && /\.agacCocuklar\s*\{[^}]*padding:\s*0 0 2px 12px/.test(HTML));
  ok("composer: select 12px PILL + textarea 15px metin (§1 ana girdi — FAZ-O bilinçli: eski 12px blok bölündü) + GÖNDER 40px (KISAT alt sınırı)", /#composerForm select\s*\{[^}]*font-size:\s*12px/.test(HTML) && /#composerForm textarea\s*\{[^}]*font-size:\s*15px/.test(HTML) && /#composerGonder\s*\{[^}]*min-height:\s*40px/.test(HTML) && !/#composerForm select, #composerForm textarea, #composerForm input\s*\{/.test(HTML));
  /* --- taşma kesme: title tam metin (ağaç adları FAZ-K'da sarar — istisna) --- */
  ok("kisalt fonksiyonu yerinde (kısa ad kuralı)", j.includes("function kisalt(metin, n)"));
  ok("agac düğüm adı .agacDugumAd SARAR (FAZ-K: white-space:normal + overflow-wrap:anywhere — ellipsis/nowrap KALDIRILDI) — eski agacAjanId/agacEtiket KALDIRILDI", /\.agacDugumAd\s*\{[^}]*white-space:\s*normal/.test(HTML) && /\.agacDugumAd\s*\{[^}]*overflow-wrap:\s*anywhere/.test(HTML) && !/\.agacDugumAd\s*\{[^}]*ellipsis/.test(HTML) && !HTML.includes(".agacAjanId") && !HTML.includes(".agacEtiket"));
  ok("chat sağlayıcı kisalt(a.provider, 16) + title TAM", j.includes("kisalt(a.provider, 16)"));
  ok("PANEL-CHAT-1: sağ başlık satırı TAM kimliği title'da taşır (eski kart '· kısa' satırı BİLİNÇLİ kalktı — kart TEK satıra indi)", j.includes("chatBaslikAd\" title=\"' + esc(a.ajanKimligi) + '\""));
  /* --- panel genişlikleri: varsayılan + KENAR + 900-1279 kırılımı --- */
  ok("varsayılan genişlikler --solW:240px / --sagW:560px (FAZ-P §2a — SAĞ EN GENİŞ)", HTML.includes("--solW:240px") && HTML.includes("--sagW:560px"));
  ok("KENAR taraf-bazlı clamp: sol 200-360 · sag 320-760 (FAZ-P §2a)", j.includes("const KENAR = { sol: { min: 200, max: 360 }, sag: { min: 320, max: 760 } }"));
  ok("splitter fallback 240/560 (FAZ-P §2a — eski 320)", j.includes('(taraf === "sol" ? 240 : 560)'));
  ok("900-1279px kırılımı: kolonlar daralır (--solW:200px / --sagW:420px FAZ-P — sağ orta ekranda da en geniş)", /@media \(min-width:900px\) and \(max-width:1279px\)[\s\S]*?--solW:\s*200px[\s\S]*?--sagW:\s*420px/.test(HTML));
  ok("<899px istif düzeni KORUNUR (body overflow:auto + tek kolon)", /@media \(max-width:899px\)[\s\S]*?body\s*\{[^}]*overflow:\s*auto/.test(HTML));
  ok("çizgi rengi açık gri #e2e8f0 (kalın kenarlıklar → 1px açık gri)", HTML.includes("--cizgi:#e2e8f0"));
  const kutuGolge = (HTML.replace(/box-shadow:\s*inset[^;}]*[;}]/g, "").match(/box-shadow/g) || []);
  ok("gölge YOK (yalnız .agacAjan.secili inset istisnası)", kutuGolge.length === 0, "bulunan: " + kutuGolge.length);
  /* --- PANEL-SIFIR-1: üst bar söküldü — ana şerit artık üstte açık kenarlı (üstten nefes 12px) --- */
  ok("üst bar yok: anaSekmeSerit border-top 1px + main üstten nefes 10px (FAZ-P §2 ekonomik — eski 12px)", /#anaSekmeSerit\s*\{[^}]*border-top:\s*1px solid var\(--cizgi\)/.test(HTML) && /main\s*\{[^}]*padding:\s*10px/.test(HTML));
  ok("paseoOzet KALDIRILDI (agacOzet ile birlikte — tek kaynak ağaç)", !h.includes('id="paseoOzet"') && !j.includes('"Paseo taraması: "') && !j.includes('"Paseo taraması okunamadı'));
});

test("11- emoji YOK + dis URL YOK + webfont YOK", () => {
  const emoji = HTML.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu) || [];
  ok("emoji karakteri yok", emoji.length === 0, "bulunan: " + emoji.length);
  ok("system-ui font stack (webfont YOK)", HTML.includes("system-ui"));
  const dis = HTML.replace(/<link\s+rel="icon"[^>]+>/g, "");
  ok("CDN/dis URL YOK", !/https?:\/\//.test(dis));
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

test("41- (BOLUM 6) LOG UI SÖKÜLDÜ (PANEL-SIFIR-1) — kalıntı 0 + kalan yardımcılar (kisaIdGoster + kutu ajanId satırı)", () => {
  const j = jsKisim();
  ok("logAlani/logHata/logTavan KALDIRILDI", !HTML.includes('id="logAlani"') && !HTML.includes('id="logHata"') && !HTML.includes('id="logTavan"'));
  ok("filtre düğmeleri KALDIRILDI (filtreBtn + data-saat)", !HTML.includes('class="filtreBtn"') && !HTML.includes('data-saat='));
  ok("logYukle KALDIRILDI (yüzle birlikte)", !j.includes("async function logYukle()"));
  ok("LOG kirmizi yuz KALDIRILDI", !HTML.includes('id="logHata"'));
  ok("kisaIdGoster fonksiyonu KALIR (UUID -> 8 hane — ağaç/chat/graph kimlik önekleri)", j.includes("function kisaIdGoster("));
  ok("kadro kartinda tam ajanId gri alt-satir (cepheKutusu detayında — graf TAŞINDI)", j.includes("ajanIdSatiri") && j.includes("ajanId: ölçülemedi"));
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
  const rolB = HTML.indexOf("function dalgaYaz("); /* PANEL-SIFIR-1: dalgaYaz(gorevler, tamMu) — parametreli taşındı */
  ok("cepheKutusu + rol fonksiyonlari yerinde (graf TAŞINDI — ORTA)", cepheA >= 0 && rolA > cepheA && rolB > rolA);
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

test("51- FAZ-B kaynak-pin: /api/ordu/projeler ucu (PASEO_EV + her istekte diskten) + ağaç fail-closed (tablo SÖKÜLDÜ — PANEL-SIFIR-1) + composer + POST sayisi", () => {
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
  ok("FAZ-B: tarama olurse P=null (bayat agac verisi kalmaz)", j.includes("P = null"));
  ok("PANEL-SIFIR-1: fail-closed yuzu AGACA tasindi — kirmiziYuzGoster(agacHata, agacAlani) + icerik bosalir (eski projeHata/projeTabloIci kalintisi 0)", j.includes('kirmiziYuzGoster("agacHata", "agacAlani"') && !j.includes("projeTabloIci"));
  /* --- composer: İKİ AYRI optgroup — manager ile proje ajanı KARIŞMAZ (operatör emri) --- */
  ok("composer hedef select (bolum-composer + composerHedef)", HTML.includes('id="bolum-composer"') && HTML.includes('id="composerHedef"'));
  ok("optgroup 1: ORDU YÖNETİM (sistem) (kadro rolAtamasi.MANAGER — FAZ-M etiket dili: KURMAY = tepe sistem ajanı)", j.includes('optgroup label="ORDU YÖNETİM (sistem)"') && j.includes("K.rolAtamasi.MANAGER"));
  ok("optgroup 2: SEÇİLİ PROJENİN OTURUM AJANLARI (FAZ-M kullanıcı spec'i — oturum ajanları)", j.includes("SEÇİLİ PROJENİN OTURUM AJANLARI"));
  ok("KURMAY-1 grubu DISK taramasiyla kesisir (yoksa devre-disi dürüst seçenek)", j.includes("diskAjanKumesi()") && j.includes("disk taramasında yok (gönderilemez)"));
  ok("yönetim kimlikleri proje grubunda HARİÇ tutulur (KARIŞMAZ pini)", j.includes("yonetimKumesi.has(a.ajanKimligi)"));
  ok("gönderim: POST /api/mesaj + token başlığı + gonderiliyor durumu", j.includes('"/api/mesaj"') && j.includes('"x-pano-token"') && j.includes("gönderiliyor…"));
  ok("token input FAZ-O: Ayarlar görünümünde ayarToken (type=password — değer AKLA girmez; eski id=token composer'da KALDIRILDI; submit oku(\"pano-token\") başlıkta taşır)", HTML.includes('<input id="ayarToken" type="password"') && !HTML.includes('id="token"') && j.includes('oku("pano-token")') && !j.includes('kaydet("token"'));
  ok("composer textarea + 4096 tavan", HTML.includes('id="composerMesaj"') && HTML.includes('maxlength="4096"'));
  ok("FAZ-O: sohbet görünümü — balon history + composer (chatListe role=log AYNEN; eski 'Üstte seçili oturumun yazışmaları' notu + chatOturumNotu sınıfı SÖKÜLDÜ — chatgpt.com dili, ekranda yalnız balonlar)", HTML.includes('id="chatListe"') && HTML.includes('role="log"') && !HTML.includes("Üstte seçili oturumun yazışmaları") && !/\.chatOturumNotu\s*\{/.test(HTML));
  ok("yenileme girdi koruması: odakIcindeMi + gonderiyor bayrağı", j.includes("function odakIcindeMi(") && j.includes("let gonderiyor = false") && j.includes('odakIcindeMi("#bolum-composer")'));
  ok("ağaç yenilenmesi odakta atlanır (activeElement ezilmez)", j.includes('odakIcindeMi("#bolum-agac")'));
  /* PANEL-SIFIR-1: UI TABLOSU SÖKÜLDÜ (kullanıcı fermanı «herşeyi sök sadece şunu» —
     orta gövde görev grafı paneline döndü) — eski vm tablo davranışı kalıntı-0'ya iner */
  ok("tablo mekanizması kaynakta YOK: projeTabloYaz + filtreBtn dinleyicisi + tabloSarma (kalıntı 0)", !j.includes("function projeTabloYaz") && !j.includes('querySelectorAll(".filtreBtn")') && !j.includes("tabloSarma"));
  ok("tablo kapıları kaynakta YOK: projeTabloIci/Ozet/Ad + filtreBtn id'leri (kalıntı 0)", !HTML.includes('id="projeTabloIci"') && !HTML.includes('id="projeTabloOzet"') && !HTML.includes('id="projeTabloAd"') && !HTML.includes('id="filtreBtn"'));
});

test("51b- FAZ-B davranis (vm): agacYaz (ORDU once + secili dugum + esc) + composerHedefGuncelle (KURMAY-1 YALNIZ yonetim grubunda)", () => {
  /* --- (1) agacYaz: ORDU projesi basta + ajan dugumleri + durum noktalari + secili --- */
  const agacA = HTML.indexOf("function ajanDugumHtml(");
  const agacB = HTML.indexOf('$("agacAlani").addEventListener');
  ok("ajanDugumHtml + agacYaz yerinde", agacA >= 0 && agacB > agacA);
  const sahte = {};
  const sahte$ = (id) => (sahte[id] = sahte[id] || { innerHTML: "", textContent: "", hidden: true });
  const agacFn = vm.runInNewContext(HTML.slice(agacA, agacB) + "\nagacYaz", {
    $: sahte$, esc: fnAl("esc"), kisalt: fnAl("kisalt"), kisaIdGoster: fnAl("kisaIdGoster"), projeEtiketi: fnAl("projeEtiketi"), /* FAZ-G */
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
  ok("PANEL-SIFIR-1: ağaç özeti SÖKÜLDÜ — agacYaz yalnız agacAlani'na yazar (agacOzet kapısı yok; sahte $ kapı kümesi dürüst)", Object.keys(sahte).length === 1 && "agacAlani" in sahte && !HTML.includes('id="agacOzet"'));

  /* --- (2) composerHedefGuncelle: KURMAY-1 YALNIZ ORDU YONETIM grubunda (KARISMAZ pini) --- */
  const compA = HTML.indexOf("function yonetimKimlikleri()");
  const compB = HTML.indexOf('$("composerForm").addEventListener');
  ok("yonetimKimlikleri + diskAjanKumesi + composerHedefGuncelle yerinde", compA >= 0 && compB > compA);
  const sahte2 = {};
  const sahte2$ = (id) => (sahte2[id] = sahte2[id] || { innerHTML: "", textContent: "", value: "", options: [] });
  const KURMAY_KIMLIK = "8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7";
  const compFn = vm.runInNewContext(HTML.slice(compA, compB) + "\ncomposerHedefGuncelle", {
    $: sahte2$, esc: fnAl("esc"), kisaIdGoster: fnAl("kisaIdGoster"), projeEtiketi: fnAl("projeEtiketi"), /* FAZ-G */
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
  ok("composer: optgroup ORDU YÖNETİM (sistem) var (FAZ-M etiket dili)", ch.includes('optgroup label="ORDU YÖNETİM (sistem)"'));
  ok("composer: KURMAY-1 yalniz YONETIM grubunda (pini — manager ile proje ajanı KARIŞMAZ)", yonetimGrubu.includes(KURMAY_KIMLIK) && !projeGrubu.includes(KURMAY_KIMLIK));
  ok("composer: yonetim grubu disk taramasi KESISIMI (kaynak: kadro ajanId + tarama)", yonetimGrubu.includes("KURMAY-1 — 8cc610a4"));
  ok("composer: proje grubu yonetim HARIC ajanlari listeler", projeGrubu.includes("432e03b7") && projeGrubu.includes("proje ajanı"));
  /* --- (3) yonetici DISKTE YOK senaryosu: devre-disi secenek (fail-closed dürüst) --- */
  const secSham2 = { innerHTML: "", value: "", options: [] };
  const sahte3 = { composerHedef: secSham2 };
  const compFn2 = vm.runInNewContext(HTML.slice(compA, compB) + "\ncomposerHedefGuncelle", {
    $: (id) => sahte3[id] || (sahte3[id] = { innerHTML: "", textContent: "", value: "", options: [] }),
    esc: fnAl("esc"), kisaIdGoster: fnAl("kisaIdGoster"), projeEtiketi: fnAl("projeEtiketi"), /* FAZ-G */
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

test("51c- FAZ-B davranis (vm): ana sekme yonetimi — ORDU SABIT + X ile kapanis + son sekme ORDU'ya doner + gecersiz donus (PANEL-SIFIR-1: anaSekmeBos/bosSayfa/alt serit SÖKÜLDÜ — gövde graf paneli)", () => {
  const j = jsKisim();
  const sekA = HTML.indexOf("function anaSekmeYaz()");
  const sekB = HTML.indexOf("function kaydet(");
  ok("ana sekme fonksiyonlari yerinde (anaSekmeYaz..anaSekmeDegistir; anaSekmeBos SÖKÜLDÜ — kalıntı 0)", sekA >= 0 && sekB > sekA && !HTML.includes("function anaSekmeBos"));
  const sahte = {};
  const sahte$ = (id) => (sahte[id] = sahte[id] || { innerHTML: "", textContent: "", hidden: true });
  let seritHtml = "";
  const seritSham = {
    get innerHTML() { return seritHtml; },
    set innerHTML(v) { seritHtml = String(v); },
    addEventListener: () => {},
  };
  let grafCagrilar = 0;
  const acikDizi = []; /* vm bağlamındaki acikSekmeler — mutasyon dışarıdan izlenir */
  const fns = vm.runInNewContext(HTML.slice(sekA, sekB) + "\n[anaSekmeDegistir, sekmeAc, sekmeKapat]", {
    $: (id) => (id === "anaSekmeSerit" ? seritSham : sahte$(id)),
    esc: fnAl("esc"), kisalt: fnAl("kisalt"), /* FAZ-D bilinçli ekleme: anaSekmeYaz kisalt(ad,14) çağırır */
    projeEtiketi: fnAl("projeEtiketi"), /* FAZ-G bilinçli ekleme: anaSekmeYaz etiketi projeEtiketi(pr)'den alır */
    P: { projeler: [{ dizin: "P-x", projeAdi: "P-x", ajanlar: [] }] },
    acikSekmeler: acikDizi, aktifSekme: "ordu",
    acikOturumSekmeleri: [], /* FAZ-O EK-2: oturum sekmeleri (anaSekmeYaz render'ı okur) */
    agacSecili: null, kaydet: () => {}, oku: () => null, /* FAZ-O EK-2: anaSekmeDegistir oturum dalı */
    konusmaSecGuncelle: () => {}, transcriptYukle: () => {}, agacYaz: () => {}, /* FAZ-O EK-2: oturum dalı çağrıları */
    grafYaz: () => { grafCagrilar++; }, /* PANEL-SIFIR-1: ORTA gövde grafı — sekme değişiminde yeniden çizilir */
    composerHedefGuncelle: () => {}, odakIcindeMi: () => false, gonderiyor: false,
  });
  const [anaSekmeDegistir, sekmeAc, sekmeKapat] = fns;
  /* sekme ac: ORDU sabit sereitte kalir + yeni sekme aktif olur */
  sekmeAc("P-x");
  ok("ORDU sekmesi seritte SABIT (acilisla birlikte durur)", seritHtml.includes('id="sek-ordu"'));
  ok("yeni proje sekmesi aktif (aria-selected=true, data-ana)", /data-ana="P-x"[^>]*aria-selected="true"/.test(seritHtml) && seritHtml.includes('data-kapat="P-x"'));
  ok("ORDU sekmesi aktif degil (aria-selected=false)", /id="sek-ordu"[^>]*aria-selected="false"/.test(seritHtml));
  ok("PANEL-SIFIR-1: sekme acilisi ORTA grafini yeniden cizer (grafYaz cagrisi; projeSayfa/altSekmeSerit mekanizması YOK)", grafCagrilar > 0);
  /* gecersiz ana sekme: ORDU'ya coerced (fail-closed) */
  anaSekmeDegistir("P-yok");
  ok("gecersiz ana sekme ORDU'ya doner (ORDU aktif + graf yeniden cizilir)", /id="sek-ordu"[^>]*aria-selected="true"/.test(seritHtml) && grafCagrilar > 1);
  /* son sekme kapaninca: ORDU'ya döner (bos yuz mekanizması SÖKÜLDÜ) */
  anaSekmeDegistir("P-x");
  sekmeKapat("P-x");
  ok("son sekme kapaninca ORDU'ya doner (acikSekmeler bos + serit ORDU aktif; bosSayfa mekanizması YOK)", acikDizi.length === 0 && /id="sek-ordu"[^>]*aria-selected="true"/.test(seritHtml) && !HTML.includes('id="bosSayfa"'));
  ok("ORDU dugmesi sereitte durmaya devam eder (kapatilamaz)", seritHtml.includes('id="sek-ordu"') && !seritHtml.includes('data-kapat'));
  ok("kaynak pini: coercion ORDU'ya + son sekme kapanisinca ORDU'ya donus", HTML.includes('if (id !== "ordu" && !acikSekmeler.includes(id)) id = "ordu"') && j.includes('else anaSekmeDegistir("ordu")'));
});

test("51d- KOMPAKT (steering 2026-11-03) davranis (vm): kisalt() esik tablosu + ajanDugumHtml ad kurali (etiket TAM — FAZ-K «paseo'da yazdığım isimleri kullan» · title TAM · data-ajan TAM uuid)", () => {
  const kisalt = fnAl("kisalt");
  assert.equal(kisalt(null, 20), null, "null → null (boş dize uydurulmaz)");
  assert.equal(kisalt(undefined, 20), null, "undefined → null");
  assert.equal(kisalt("kısa ad", 20), "kısa ad", "esik alti aynen doner");
  assert.equal(kisalt("0123456789012345678901", 20), "0123456789012345678…", "21 karakter → 19 + '…'");
  assert.equal(kisalt("0123456789012345678901", 20).length, 20, "sonuc uzunlugu esikle ayni (n karakter)");
  assert.equal(kisalt("0123456789012345678", 20), "0123456789012345678", "tam esikte kesilmez");
  assert.equal(kisalt(12345, 3), "12…", "sayi metne iner (String())");
  assert.equal(kisalt("", 5), "", "bos dize aynen");

  /* ajanDugumHtml: FAZ-K (steering «oturum isimleri ben paseo'da yazdığım isimleri
     kullan» 2026-11-03) — etiket VARSA TAM a.etiket (kisalt 12 KALDIRILDI) + title TAM etiket;
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
  /* (1) uzun etiket → TAM etiket (FAZ-K: kisalt KALDIRILDI) + title TAM etiket */
  const h1 = dgnFn({ ajanKimligi: uuid, ajanId: "432e03b7", lastStatus: "running", etiket: "0123456789012345678901" }, pr);
  ok("kural: uzun etiket TAM görünür (FAZ-K — kisalt 12 KALDIRILDI, '…' kalıntısı YOK)", h1.includes('>0123456789012345678901</span>') && !h1.includes('>01234567890…</span>'));
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
    $: sham$, esc: fnAl("esc"), kisalt: fnAl("kisalt"), kisaIdGoster: fnAl("kisaIdGoster"), projeEtiketi: fnAl("projeEtiketi"), /* FAZ-G */
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

test("51f- PANEL-AGAC-1 SIFIR KABUĞU (vm): çalışan sayısı GERÇEK sayımdan + hata uyarı ikonu + TEK SEVİYE akordiyon (durum grupları/taşıma/sıra/özet SÖKÜLDÜ — kalıntı 0) + tıklama delegasyonu proje/ajan davranışı AYNEN", () => {
  const j = jsKisim();
  /* --- kaynak pinleri --- */
  ok("PANEL-SIFIR-1: kalıcı grup/sıra anahtarları SÖKÜLDÜ (kaydet/oku çağrıları kalıntı 0)", !j.includes('kaydet("ordu-agac-grup"') && !j.includes('kaydet("ordu-agac-sira"') && !j.includes('oku("ordu-agac-grup"') && !j.includes('oku("ordu-agac-sira"'));
  ok("PANEL-SIFIR-1: grup mekanizması SÖKÜLDÜ (GRUP_SIRA/GRUP_ADI sabitleri + agacGrupBas render)", !j.includes("const GRUP_SIRA") && !j.includes("const GRUP_ADI") && !j.includes("agacGrupBas"));
  ok("PANEL-SIFIR-1: taşıma mekanizması SÖKÜLDÜ (agacTasi/agacSirala + aria-label'lar)", !j.includes("agacTasi") && !j.includes("function agacSirala(") && !j.includes('aria-label="projeyi yukarı taşı"'));
  ok("PANEL-SIFIR-1: ağaç özeti SÖKÜLDÜ (agacOzet kapısı + 'aktif / proje' sayımı)", !j.includes("agacOzet") && !j.includes("</b> aktif / <b>"));
  ok("TEK SEVİYE: oturum satırları DOĞRUDAN .agacCocuklar içinde (grup sarmalayıcısı YOK — kullanıcı tarifi; FAZ-N: satır listesi agacGorunurAjanlar ile süzülür)", j.includes('agacGorunurAjanlar(ajanlar).map((a) => ajanDugumHtml(a, pr)).join("")'));
  ok("çalışan sayısı GERÇEK sayım (lastStatus === running; ajanlar.length TOPLAM kayıttır)", j.includes('x.lastStatus === "running"') && j.includes('x.lastStatus === "error"'));
  ok("proje başlığı role=button DIV (W3C: düğme içinde düğme YASAK)", j.includes('<div class="agacProjeBas" role="button"') && !j.includes('<button type="button" class="agacProjeBas"'));
  ok("klavye yolu keydown dinleyicisi AYNEN (başlık DIV role=button → Enter/Space)", j.includes('$("agacAlani").addEventListener("keydown"'));
  ok("uyarı ikonu inline SVG + role=img (emoji YASAK §4)", j.includes("const UYARI_SVG") && j.includes('<span class="agacUyari" role="img"'));
  ok("başlık title'ı dürüst: 'çalışan · toplam ajan kaydı'", j.includes(" çalışan · "));

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
    $: sahte$, esc: fnAl("esc"), kisalt: fnAl("kisalt"), kisaIdGoster: fnAl("kisaIdGoster"), projeEtiketi: fnAl("projeEtiketi"), /* FAZ-G */
    P: FIX, agacAcik: new Set(["P-alfa"]), agacSecili: null,
    NOKTA_SINIF: { running: "yesil", idle: "gri", error: "kirmizi", closed: "kapali" },
  };
  const agacFn = vm.runInNewContext(HTML.slice(HTML.indexOf("function ajanDugumHtml("), HTML.indexOf('$("agacAlani").addEventListener')) + "\nagacYaz", ctx);
  agacFn();
  const h = sahte.agacAlani.innerHTML;
  ok("FAZ-F sıra: AKTİF proje ÜSTTE (P-alfa) — pasifler altta [ORDU, beta] grup içi ORDU-önce aynen (bilinçli pin: eski 'ORDU önce' pini)", h.indexOf("alfa") < h.indexOf("ORDU</span>") && h.indexOf("ORDU</span>") < h.indexOf("beta"));
  const alfaBasIdx = h.indexOf('data-proje="P-alfa"');
  const alfaBas = h.slice(alfaBasIdx, h.indexOf("</div>", alfaBasIdx));
  ok("proje satırı: sağda ÇALIŞAN sayısı (2 — toplam 4 DEĞİL) + dürüst title FAZ-Q birleşik bicim (dizin — [baslik] — çalışan/kayıt; fixture'da baslik YOK: 'P-alfa — 2 çalışan · 4 ajan kaydı'; eski pini 'alfa — 2 çalışan · 4 ajan kaydı')", alfaBas.includes('<span class="agacSayi">2</span>') && !alfaBas.includes('<span class="agacSayi">4</span>') && alfaBas.includes('title="P-alfa — 2 çalışan · 4 ajan kaydı"'));
  ok("hata uyarısı: YALNIZ hatalı ajanı olan projede (P-beta VAR · P-alfa/D-ordu YOK)", (h.match(/class="agacUyari"/g) || []).length === 1 && h.indexOf('class="agacUyari"') > h.indexOf('data-proje="P-beta"'));
  ok("uyarı ikonu aria-label + dürüst sayı title'ı", h.includes('aria-label="hata durumunda ajan var"') && h.includes('title="1 ajan hata durumunda"'));
  ok("PANEL-SIFIR-1 TEK SEVİYE: açık projenin TÜM oturum satırları DOĞRUDAN render (grup filtresi YOK — çalışan/bekleyen/bilinmeyen hepsi)", h.includes('data-ajan="' + R1 + '"') && h.includes('data-ajan="' + R2 + '"') && h.includes('data-ajan="' + I1 + '"') && h.includes('data-ajan="' + D1 + '"'));
  ok("PANEL-SIFIR-1: grup katmanı kalıntısı 0 (data-grup özniteliği + grup başlığı render'da YOK)", !h.includes("data-grup") && !h.includes("agacGrupBas"));
  ok("kapalı projenin (P-beta) oturum satırları render EDİLMEZ (akordiyon kapalı)", !h.includes('data-ajan="' + E1 + '"'));
  ok("data-ajan TAM uuid korunur (seçim/gönderim değişmez)", h.includes('data-ajan="' + R1 + '"'));
  const emojiHtml = h.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}]/gu) || [];
  ok("ağaç çıktısında emoji karakteri YOK (uyarı/ok ikonları inline SVG — §4)", emojiHtml.length === 0, "bulunan: " + emojiHtml.length);
  ok("token alanı YOK (veri köprüsü ikinci dalgada — uydurma E10 ihlali)", !/token/i.test(h));

  /* --- (2) tıklama temsilcisi: yalnız proje başlığı + ajan düğümü (taşıma/grup dalları SÖKÜLDÜ) --- */
  const dinleyiciler = {};
  const agacSham = { addEventListener: (tip, fn) => { dinleyiciler[tip] = fn; } };
  const cagrilar = { sekme: [], secim: [], yaz: 0, transcript: [], oturumSekme: [] };
  const kayit2 = [];
  const dlgCtx = {
    $: (id) => (id === "agacAlani" ? agacSham : { addEventListener: () => {} }),
    sekmeAc: (d) => { cagrilar.sekme.push(d); },
    konusmaSecGuncelle: (z) => { cagrilar.secim.push(z); },
    transcriptYukle: (k) => { cagrilar.transcript.push(k); }, /* FAZ-O EK-2: ağaç artık ÇAĞIRMAZ — yalnız oturum sekmesi aktifken anaSekmeDegistir çağırır */
    oturumSekmeAc: (k) => { cagrilar.oturumSekme.push(k); }, /* FAZ-O EK-2: ağaç tıklaması oturum SEKMESİ açar — dolaylı yol */
    agacYaz: () => { cagrilar.yaz++; },
    agacAcik: new Set(["P-alfa"]),
    agacSecili: null,
    kaydet: (a) => { kayit2.push(a); },
  };
  vm.runInNewContext(HTML.slice(HTML.indexOf('$("agacAlani").addEventListener("click"'), HTML.indexOf("function konusmaSecGuncelle")), dlgCtx);
  ok("delegasyon kayıtlı: click + keydown dinleyicileri", !!dinleyiciler.click && !!dinleyiciler.keydown);
  const olay = (eslesen, dugum) => ({ target: { closest: (s) => (s === eslesen ? dugum : null) } });
  ok("PANEL-SIFIR-1: delegasyon yalnız 2 dal (agacProjeBas + agacAjan — taşıma/grup closest'leri kalıntı 0)", !j.includes('closest(".agacTasiBtn")') && !j.includes('closest(".agacGrupBas")'));
  /* (2a) proje başlığı (regresyon): akordiyon + sekme AYNEN */
  dinleyiciler.click(olay(".agacProjeBas", { dataset: { proje: "P-beta" } }));
  ok("proje başlığı: akordiyon açılır + sekme açılır (mevcut davranış korunur)", dlgCtx.agacAcik.has("P-beta") && cagrilar.sekme.includes("P-beta"));
  ok("ordu-agac-acik kalıcıya yazılır", kayit2.includes("ordu-agac-acik"));
  /* (4d) ajan düğümü (FAZ-O EK-2): seçim kaydı + oturum SEKMESİ açılır — ağaç DOLAYLI yolla chat'i besler; konusmaSecGuncelle/transcriptYukle AĞAÇ TIKLAMASINDA ÇAĞRILMAZ («ağaç → orta sekme → chat. Tek davranış kaynağı ORTA SEKME») */
  dinleyiciler.click(olay(".agacAjan", { dataset: { ajan: R1, proje: "P-alfa" } }));
  assert.equal(dlgCtx.agacSecili, R1, "ajan düğümü: seçili konuşma TAM kimlikle");
  assert.deepEqual(cagrilar.oturumSekme, [R1], "FAZ-O EK-2: ajan düğümü tıklaması oturumSekmeAc(TAM kimlik) çağırır — şeritte sekme açılır/aktive olur");
  assert.deepEqual(cagrilar.secim, [], "FAZ-O EK-2: ağaç tıklaması konusmaSecGuncelle ÇAĞIRMAZ (dolaylı yol — yalnız sekme aktifken anaSekmeDegistir çağırır)");
  assert.deepEqual(cagrilar.transcript, [], "FAZ-O EK-2: ağaç tıklaması transcriptYukle ÇAĞIRMAZ (transcript yalnız oturum sekmesi aktifleşince yüklenir)");
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
  ok("oturum dürüst notu FAZ-O'da SÖKÜLDÜ (chatgpt.com dili: sohbette not satırı YOK — transcript + gönderimler tek balon akışında; eski not metni kalıntı 0)", !HTML.includes("Üstte seçili oturumun yazışmaları") && !HTML.includes("tam geçmiş Paseo sekmesinde"));
  const chatA = HTML.indexOf("const CHAT_TAVAN");
  const chatB = HTML.indexOf("function anaSekmeYaz()");
  ok("chat bloğu yerinde (CHAT_TAVAN … anaSekmeYaz)", chatA >= 0 && chatB > chatA);
  const chatSlice = HTML.slice(chatA, chatB);
  ok("chat dilimi bellek-içi (FAZ-O: kaydet YALNIZ pano-token — Ayarlar KAYDET düğmesi; localStorage. ÇAĞRISI hâlâ yok — kaydet/oku sarmalayıcı üzerinden)", !/kaydet\((?!["']pano-token["'])/.test(chatSlice) && !/localStorage\./.test(chatSlice) && chatSlice.includes('kaydet("pano-token"'));
  ok("30sn yenileme mesaj listesine DOKUNMAZ ($(\"chatListe\") erişimi 2 yerde — chatMesajYaz + transcriptYukle FAZ-M; yenileme döngüsü ikisine de YAZMAZ)", (j.match(/\$\("chatListe"\)/g) || []).length === 2);
  ok("giriş yüzü FAZ-I: BALON — chatKim (title TAM kimlik) + TAM metin + chatSaat + İNCE sonuç satırı", chatSlice.includes('<div class="chatKim" title="') && chatSlice.includes('class="chatMesaj chat-kullanici') && chatSlice.includes("chatSonuc"));
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
    oku: () => "sahte-token", kaydet: () => {}, /* FAZ-O: token localStorage oku() sarmalayıcısından — submit + DOKTOR kapısı okur */
    fetch: async (yol, secenek) => { fetchCagr = { yol, secenek }; if (agHatasi) throw new Error("bağlantı koptu"); return yanit; },
  };
  const [oturumMesajlari, chatMesajYaz] = vm.runInNewContext(chatSlice + "\n[oturumMesajlari, chatMesajYaz]", ctx);
  ok("submit dinleyicisi kayıtlı (composerForm sham'ında)", typeof dinleyiciler.submit === "function");
  const gonder = () => dinleyiciler.submit({ preventDefault: () => {} });
  /* girdi sham'ları önceden doğar (dinleyici gövdesi ilk çağrıda okur — kayıt sırasında değil; FAZ-O: gonderDurum span — token sham'ı GEREKMEZ, oku() taşır) */
  for (const id of ["composerHedef", "composerMesaj", "composerGonder", "gonderDurum", "composerSonuc", "chatListe", "chatBos"]) sham$(id);

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
  sham.composerMesaj.value = "test mesajı"; /* FAZ-O: token oku() sham'ından ("sahte-token") — ekranda alan YOK */
  sham.composerMesaj.value = "test mesajı";
  await gonder();
  const h1 = sham.chatListe.innerHTML;
  ok("gönderim: istek POST /api/mesaj + token YALNIZ başlıkta (x-pano-token)", fetchCagr.yol === "/api/mesaj" && fetchCagr.secenek.method === "POST" && fetchCagr.secenek.headers["x-pano-token"] === "sahte-token" && !fetchCagr.secenek.body.includes("sahte-token"));
  ok("gönderim: gövde hedef+mesaj JSON (kimlik TAM)", fetchCagr.secenek.body.includes(A1) && fetchCagr.secenek.body.includes("test mesajı"));
  ok("liste: giriş BALONU chatKim kısa ad + saat HH:mm (köşeli parantez YOK — FAZ-I)", /\d{2}:\d{2}/.test(h1) && h1.includes(">432e03b7</div>") && h1.includes("<p>test mesajı</p>") && !h1.includes("[432e03b7]"));
  ok("liste: başarı İNCE satır 'gönderildi' (yeşil sınıf; sembol karakteri YOK)", h1.includes(">gönderildi") && h1.includes("chatSonuc basarili") && h1.includes('chatMesaj chat-kullanici basarili'));
  ok("liste: hedef kısa ad title'ı TAM kimlik taşır", h1.includes('title="' + A1 + '"'));
  ok("liste: boş-durum satırı gizlenir + otomatik en alta kaydırma", sham.chatBos.hidden === true && sham.chatListe.scrollTop === sham.chatListe.scrollHeight);
  ok("gönderim sonrası: editör temizlenir (gönderilen mesaj beklemesin)", sham.composerMesaj.value === "");
  ok("dugme geri döner: gonderDurum span 'GÖNDER' + ikon düğmesi DEĞİŞMEZ (FAZ-O: durum ekran-okuyucu metninde — dugme.textContent yazılmaz)", sham.gonderDurum.textContent === "GÖNDER" && sham.composerGonder.disabled === false && sham.composerGonder.textContent === "");

  /* (3) hata 429: 'hata: HTTP 429 — …' kırmızı ince satır + mesaj editörde KALIR (yeniden denenebilir) */
  yanit = { ok: false, status: 429, json: async () => ({ hata: "pencere dolu" }) };
  sham.composerMesaj.value = "<script>alert(1)</script> " + "x".repeat(100);
  await gonder();
  const h2 = sham.chatListe.innerHTML;
  ok("hata: İNCE satır 'hata: HTTP 429 — pencere dolu' (kırmızı sınıf)", h2.includes(">hata: HTTP 429 — pencere dolu") && h2.includes("chatSonuc hata") && h2.includes('chatMesaj chat-kullanici hata'));
  ok("hata: mesaj editörde KALIR (yeniden deneme yüzü dürüst)", sham.composerMesaj.value.includes("<script>"));
  ok("XSS: mesaj metni esc'ten geçer (görüntü + title)", h2.includes("&lt;script&gt;alert(1)&lt;/script&gt;") && !h2.includes("<script>alert"));
  ok("FAZ-I taşma: TAM metin balonda (kisalt(m.metin,80) KALDIRILDI — balon kendi sarar; kesme '…' YOK)", !chatSlice.includes("kisalt(m.metin, 80)") && h2.includes("&lt;script&gt;alert(1)&lt;/script&gt; " + "x".repeat(100)));

  /* (4) ağ hatası: fetch reddi → dürüst 'hata: bağlantı koptu' */
  agHatasi = true;
  sham.composerMesaj.value = "bağlantı denemesi";
  await gonder();
  ok("ağ hatası: 'hata: bağlantı koptu' ince satırda (kirmiziYüz DEĞİL)", sham.chatListe.innerHTML.includes("hata: bağlantı koptu") && sham.chatListe.innerHTML.includes("chatMesaj chat-kullanici hata"));
  agHatasi = false;

  /* (4b) kurtarma: ağ döndü → yeniden gönderim 'gönderildi' ile kapanır */
  yanit = { ok: true, json: async () => ({ gonderildi: true, zamanISO: "2026-11-03T12:05:00Z" }) };
  await gonder();
  ok("kurtarma: yeniden gönderim 'gönderildi' ince satırıyla kapanır (editör temizlenir)", sham.chatListe.innerHTML.includes("chatMesaj chat-kullanici basarili") && sham.composerMesaj.value === "");

  /* (5) emoji taraması: render çıktısında sembol karakteri YOK (§4 — renk diliyle anlatılır) */
  const emojiChat = (sham.chatListe.innerHTML.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{2713}\u{2714}\u{26A0}]/gu) || []);
  ok("chat çıktısında emoji/✓/⚠ karakteri YOK (düz metin — §4)", emojiChat.length === 0, "bulunan: " + emojiChat.length);

  /* (6) liste oturum-içi birikir: 4 gönderim = 4 giriş; her biri kendi sonucunu taşır */
  ok("birikim: 4 giriş oturum listesinde (başarı+hata karışık, sıra korunur)", oturumMesajlari.length === 4 && (sham.chatListe.innerHTML.match(/class="chatMesaj/g) || []).length === 4);
  ok("kayıt yapısı: saat/hedefKisa/hedefKimlik/metin/sonuc alanları (bellek-içi)", oturumMesajlari.every((m) => typeof m.saat === "string" && m.hedefKimlik === A1 && typeof m.metin === "string" && m.sonuc && typeof m.sonuc.tur === "string"));
});

test("51h- PANEL-ANA-1 (kaynak-pin): ORTA ALT SEKMELER SÖKÜLDÜ (PANEL-SIFIR-1 — tek gövde graf paneli) — kalıntı 0; sekme cila pinleri K-0061 korunur", () => {
  const h = htmlKisim();
  /* --- alt sekme yüzleri KALINTI 0 (kullanıcı fermanı «herşeyi sök sadece şunu») --- */
  ok("PANEL-SIFIR-1: 5 alt sekme düğmesi KALINTI 0 (sek-durum/plan/akis/saglik/log id'leri)", ["durum", "plan", "akis", "saglik", "log"].every((s) => !h.includes('id="sek-' + s + '"')));
  ok("PANEL-SIFIR-1: alt sekme şeridi KALINTI 0 (#altSekmeSerit + Bölüm id'leri)", !h.includes('id="altSekmeSerit"') && !h.includes('id="durumBolum"') && !h.includes('id="planBolum"') && !h.includes('id="akisBolum"') && !h.includes('id="saglikBolum"') && !h.includes('id="logBolum"'));
  ok("PANEL-SIFIR-1: sekme kısa-ad mekanizması gitti (SİSTEM SAĞLIĞI→SAĞLIK yüzü YOK — aranan kalıntı dürüst 0)", !/SAĞLIK<\/button>/.test(h) && !/id="sek-saglik"/.test(h));
  ok("PANEL-SIFIR-1: tablist aria-label TAM ad listesi kalıntı 0 (a11y betimleme yüzle birlikte söküldü)", !h.includes('aria-label="ORDU panel sekmeleri'));
  /* --- DAR sekme stili: yatay dolgu 12px → 8px ana şeritte yaşar; 34px satır ailesi KORUNUR (§5 ≥26px) --- */
  ok("DAR ana sekme: #anaSekmeSerit .sekme padding:0 8px (eski 12px — BİLİNÇLİ)", /#anaSekmeSerit \.sekme\s*\{[^}]*padding:\s*0 8px/.test(HTML));
  ok("FAZ-P ana sekme: 34px satır + 13px etiket (§1 baz; §5 ≥26px)", /\.sekme\s*\{[^}]*min-height:\s*34px/.test(HTML) && /\.sekme\s*\{[^}]*font-size:\s*13px/.test(HTML));
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
  ok("FAZ-O EK-3: bolum-chat #ORTA'da (görünüm sarmalayıcısı içinde) — #sag'da .bolum YOK (sekmeli bölge şerit+gövde); eski <section id=bolum-composer> KALDIRILDI", h.includes('<section class="bolum" id="bolum-chat"') && !/<section[^>]*id="bolum-composer"/.test(h) && h.indexOf('<section id="orta"') < h.indexOf('id="bolum-chat"') && h.indexOf('id="bolum-chat"') < h.indexOf('<section id="sag"') && !h.slice(h.indexOf('<section id="sag"')).includes('class="bolum"'));
  ok("COMPOSER h2 başlığı YOK (composer-baslik id'si + h2 gövdesi kalıntısı)", !h.includes('id="composer-baslik"') && !/COMPOSER\s*<\/h2/.test(h));
  ok("composer #bolum-chat İÇİNDE (sarmalayıcı div.composerAlan — bölüm değil)", h.indexOf('id="bolum-chat"') < h.indexOf('id="bolum-composer"') && h.indexOf('id="bolum-composer"') < h.indexOf('id="composerForm"') && h.includes('<div id="bolum-composer" class="composerAlan"'));
  ok("bölüm kapanışı composer'dan SONRA (form bölümün içinde kalır — kopuk değil)", h.indexOf("</section>", h.indexOf('id="composerForm"')) > h.indexOf('id="composerForm"'));
  /* --- flex zinciri: liste kolonun kalanını doldurur + kendi içinde kayar; composer altta SABİT --- */
  ok("TEK birim esner: #bolum-chat flex:1 1 auto + min-height:0 (kolonu doldurur)", /#bolum-chat\s*\{[^}]*flex:\s*1 1 auto[^}]*min-height:\s*0/.test(HTML));
  ok("liste ESNEK + kendi içinde kayar: .chatListe flex:1 1 auto + min-height:0 + overflow-y:auto (eski min-height:140px BİLİNÇLİ gitti)", /\.chatListe\s*\{[^}]*flex:\s*1 1 auto[^}]*min-height:\s*0[^}]*overflow-y:\s*auto/.test(HTML));
  ok("composer ALTTA SABİT: .composerAlan flex:none (ayraç çizgisi border-top ile)", /\.composerAlan\s*\{[^}]*flex:\s*none[^}]*border-top:\s*1px solid var\(--cizgi\)/.test(HTML));
  ok("istifte (<899px) doğal sıra korunur: bölüm flex:none + liste min tabanı 140px geri döner", /@media \(max-width:899px\)[\s\S]*?#bolum-chat\s*\{[^}]*flex:\s*none/.test(HTML) && /@media \(max-width:899px\)[\s\S]*?\.chatListe\s*\{[^}]*min-height:\s*140px/.test(HTML));
  /* --- composer İÇİ FAZ-O: TEK bar düzeni — Hedef → Mesaj → Ekle → GÖNDER (token ALAN YOK — Ayarlar görünümünde); JS girdi koruması AYNEN --- */
  const sira = ["composerHedef", "composerMesaj", "composerEkle", "composerGonder", "composerDosya"].map((id) => h.indexOf('id="' + id + '"'));
  ok("composer bar sırası FAZ-O: Hedef → Mesaj → Ekle → GÖNDER (+ gizli dosya girdisi; token alanı SÖKÜLDÜ — chatgpt.com dili)", sira.every((i) => i >= 0) && sira.every((i, k) => k === 0 || i > sira[k - 1]) && !h.includes('<input id="token"'));
  ok("composer id'leri FAZ-O (form/hedef/mesaj/ekle/dosya/gonder/gonderDurum/sonuc — token AYARLAR görünümünde ayarToken)", ["composerForm", "composerHedef", "composerMesaj", "composerEkle", "composerDosya", "composerGonder", "gonderDurum", "composerSonuc", "ayarToken"].every((id) => h.includes('id="' + id + '"')));
  ok("JS AYNEN: yenileme girdi koruması odakIcindeMi(\"#bolum-composer\") seçicisi sarmalayıcı kimliğiyle yaşar (JS hunk YOK)", j.includes('odakIcindeMi("#bolum-composer")'));
  ok("JS AYNEN: composer submit + 2 AYRI optgroup davranışı değişmedi (JS hunk YOK sınıfı)", j.includes('$("composerForm").addEventListener') && j.includes("optgroup"));
});

test("51j- PANEL-ANA-1 FAZ-D+E+F (kaynak-pin + vm): ana şerit proje sekmeleri DAR (kisalt 16 + title TAM ad — dizin + max-width emniyeti) · ağaç etiketleri «aşırı minimal» (12/14 + satır title birleşik) + okunabilirlik (13px) · AKTİF projeler ÜSTTE (stabil ayrım — kayıt değişmez)", () => {
  const j = jsKisim();
  /* --- FAZ-D: ana şerit proje sekmeleri (steering «üst sekme çok fazla geniş oluyor dağılıyor») --- */
  ok("proje sekmesi etiketi FAZ-H kisalt(ad, 14) (BİLİNÇLİ: 16→14 — font 15px'e büyüdü; kisalt null dönerse dürüst yedek ad)", j.includes("kisalt(ad, 14) || ad"));
  ok("proje sekmesi title TAM ad — dizin (eski title=dizin yok — bilinçli değişti)", j.includes('esc(ad + " — " + dizin)'));
  ok("data-ana TAM dizin AYNEN (seçim/kapatma yolu değişmez)", j.includes('data-ana="\' + esc(dizin) + \'"'));
  ok("DAR dolgu: #anaSekmeSerit .sekme padding:0 8px (alt şerit FAZ-B ailesiyle aynı)", /#anaSekmeSerit \.sekme\s*\{[^}]*padding:\s*0 8px/.test(HTML));
  ok("taşma emniyeti: .anaSekmeGrup .sekme max-width:180px + overflow:hidden + text-overflow:ellipsis", /\.anaSekmeGrup \.sekme\s*\{[^}]*max-width:\s*180px[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis/.test(HTML));
  ok("ORDU sabit sekme + sekmeKapat AYNEN (kapanış yolu değişmez)", j.includes('id="sek-ordu"') && j.includes('class="sekmeKapat"'));
  /* --- FAZ-D davranış (vm): uzun ad → 15+'…'; title TAM — dizin; data-ana TAM --- */
  const sahte2 = {};
  const $2 = (id) => (sahte2[id] = sahte2[id] || { innerHTML: "" });
  const ctx2 = {
    $: $2, esc: fnAl("esc"), kisalt: fnAl("kisalt"), projeEtiketi: fnAl("projeEtiketi"), /* FAZ-G: anaSekmeYaz etiketi yardımcıdan */
    P: { projeler: [
      { dizin: "P-uzun", projeAdi: "01234567890123456789012", orduMu: false, ajanlar: [] },
      { dizin: "P-kisa", projeAdi: "kisa", orduMu: false, ajanlar: [] },
    ] },
    aktifSekme: "ordu", acikSekmeler: ["P-uzun", "P-kisa"], acikOturumSekmeleri: [], /* FAZ-O EK-2: anaSekmeYaz oturum sekme döngüsünü okur */
  };
  vm.runInNewContext(HTML.slice(HTML.indexOf("function anaSekmeYaz("), HTML.indexOf('$("anaSekmeSerit").addEventListener')) + "\nanaSekmeYaz", ctx2)();
  const hs = sahte2.anaSekmeSerit.innerHTML;
  ok("vm: uzun ad 13+'…' görünür (kisalt 14 — FAZ-H) — sekme DAR kalır", hs.includes(">0123456789012…</button>"));
  ok("vm: title TAM ad — dizin + data-ana TAM dizin (kaybolduğu yerde erişilebilir kalır)", hs.includes('title="01234567890123456789012 — P-uzun"') && hs.includes('data-ana="P-uzun"'));
  ok("vm: kısa ad aynen + ORDU sabit sekme şeridin İLKİNDE", hs.includes(">kisa</button>") && hs.indexOf('id="sek-ordu"') < hs.indexOf('data-ana="P-uzun"'));
  /* --- FAZ-E: ağaç etiketleri (steering «aşırı minimal» + E-ek1/E-ek2 «kısalmıyor/küçük») --- */
  ok("oturum düğümü etiketi TAM a.etiket (FAZ-K — kisalt(a.etiket,12) KALDIRILDI; steering «oturum isimleri ben paseo'da yazdığım isimleri kullan»)", j.includes("etiketVar ? a.etiket :") && !j.includes("kisalt(a.etiket, 12)"));
  ok("proje satırı görünen adı TAM etiket (FAZ-K — kisalt(etiket,12) KALDIRILDI; steering «klasör isimlerini doğrudan yaz») — etiket = projeEtiketi(pr)", j.includes("const etiket = projeEtiketi(pr)") && j.includes('esc(etiket) + "</span>"') && !j.includes("kisalt(etiket, 12) || etiket"));
  ok("E-ek1+FAZ-Q: satır title'ı birleşik dürüst bicim 'dizin — [baslik] — N çalışan · M ajan kaydı' (TAM kimlik hover'da; calisan/kayıt bilgisi KORUNUR)", j.includes('const tamTitle = esc(pr.dizin)') && j.includes('" — " + calisan + " çalışan · " + ajanlar.length + " ajan kaydı"'));
  ok("E-ek1: agacAd'in KENDİ title'i YOK (TAM ad satır title'ında — çift tooltip kaldırıldı)", !j.includes('class="agacAd" title='));
  ok("CHAT başlığındaki kisalt(a.etiket, 20) AYNEN (kullanıcı «soldaki» dedi — yalnız ağaç)", j.includes("kisalt(a.etiket, 20)"));
  ok("PANEL-SIFIR-1: AKIŞ yüzü SÖKÜLDÜ — kisalt(o.ad, 80) kalıntısı 0 (eski pin 'AYNEN' idi; akisSatır mekanizması gitti)", !j.includes("kisalt(o.ad, 80)"));
  ok("FAZ-P: .agacProjeBas font-size:13px + .agacAjan font-size:13px (REVİZYON 2026-11-04 §1 — eski 15px)", /\.agacProjeBas\s*\{[^}]*font-size:\s*13px/.test(HTML) && /\.agacAjan\s*\{[^}]*font-size:\s*13px/.test(HTML));
  ok("PANEL-SIFIR-1: .agacGrupBas KALINTI 0 (durum grup katmanı söküldü — ağaç 13px ailesi kalır)", /\.agacProjeBas\s*\{[^}]*font-size:\s*13px/.test(HTML) && /\.agacAjan\s*\{[^}]*font-size:\s*13px/.test(HTML) && !/\.agacGrupBas/.test(HTML));
  ok("FAZ-H: satır yüksekliği 32px (BİLİNÇLİ: 28→32; §5 ≥26px korunur)", /\.agacProjeBas\s*\{[^}]*min-height:\s*32px/.test(HTML) && /\.agacAjan\s*\{[^}]*min-height:\s*32px/.test(HTML));
  /* --- FAZ-F: aktif projeler ÜSTTE (steering «solda aktif projeler üstte olsun pasifler aşağıda») --- */
  ok("FAZ-F kaynak: calisanSay (running sayımı — .agacSayi'nın aynısı) + gorunen stabil ayrımı", j.includes("const calisanSay = (pr) =>") && j.includes("const gorunen = [...P.projeler].sort") && j.includes("for (const pr of gorunen)"));
  ok("PANEL-SIFIR-1: kalıcı sıra kaydı SÖKÜLDÜ (kaydet('ordu-agac-sira') çağrısı kalıntı 0; YENİ anahtar da YOK)", !j.includes('kaydet("ordu-agac-sira"') && !/ordu-agac-(aktif|pasif|fa)/.test(j));
});

test("51k- PANEL-ANA-1 FAZ-G (birlesim + kaynak-pin + vm): workspaces.json baslik birlesimi — dash eslesme + coklu-cwd secim (aktif + en yeni) + arsiv/basliksiz yedek + bozuk-JSON fail-closed; UI'da etiket TEK yardimcidan (projeEtiketi), kimlik yolu DEGISMEZ", () => {
  const j = jsKisim();
  const birlesim = readFileSync(new URL("./ordu-birlesim.mjs", import.meta.url), "utf8");

  /* --- (A) ordu-birlesim.mjs kaynak pinleri --- */
  ok("kaynak SALT-OKUR: join(paseoEv,'projects','workspaces.json') (test fixture'i PASEO_EV duzeniyle ezilir)", birlesim.includes("join(String(paseoEv), 'projects', 'workspaces.json')"));
  ok("dash eslesme deseni server.js ORDU_DIZIN_ADI ile AYNEN: [\\\\/:]+ tek tire", birlesim.includes("replace(/[\\\\/:]+/g, '-')"));
  ok("coklu-cwd secim: arsivli kayit baslik TASIMAZ (archivedAt skip)", birlesim.includes("if (w.archivedAt) continue;"));
  ok("coklu-cwd secim: aktif kayitlarin updatedAt EN YENISI kazanir (Date.parse karsilastirmasi)", birlesim.includes("Date.parse(w.updatedAt)"));
  ok("title bos/null -> baslik YOK (uydurma yok, E10; UI'da dashed yol yedek)", birlesim.includes("typeof w.title === 'string' && w.title.trim()"));
  ok("kayit defteri BOZUK/OKUNAMAZ -> tarama DEGIL: bos harita (fail-closed ayri)", birlesim.includes("} catch { return harita; }"));
  ok("projelerTara kaydina baslik alani: YOK = null (dashed yedek; kararsiz alan — UI'da esc() ile)", birlesim.includes("baslik: basliklar.has(d) ? basliklar.get(d) : null"));

  /* --- (B) birlesim davranisi (gercek tmp fixture) --- */
  const tmp = tempKok();
  try {
    const ag = join(tmp, "agents");
    for (const d of ["D-alfa", "D-beta", "D-yedek", "C-fwd-slash"]) mkdirSync(join(ag, d), { recursive: true });
    const ajanYaz = (d, id) => writeFileSync(join(ag, d, id + ".json"), JSON.stringify({ id, provider: "glm53u-claude", lastStatus: "running", lastActivityAt: "2026-11-02T10:00:00Z", title: "oturum etiketi" }));
    ajanYaz("D-alfa", "11111111-1111-4111-8111-111111111111");
    ajanYaz("D-beta", "22222222-2222-4222-8222-222222222222");
    ajanYaz("D-yedek", "33333333-3333-4333-8333-333333333333");
    ajanYaz("C-fwd-slash", "44444444-4444-4444-8444-444444444444");
    mkdirSync(join(tmp, "projects"), { recursive: true });
    writeFileSync(join(tmp, "projects", "workspaces.json"), JSON.stringify([
      { workspaceId: "w1", cwd: "D:\\alfa", title: "eski ama aktif baslik", updatedAt: "2026-10-01T00:00:00Z", archivedAt: null },
      { workspaceId: "w2", cwd: "D:\\alfa", title: "en yeni ama ARSIVLI", updatedAt: "2026-11-05T00:00:00Z", archivedAt: "2026-11-05T00:00:00Z" },
      { workspaceId: "w3", cwd: "D:\\beta", title: "beta basligi", updatedAt: "2026-11-04T00:00:00Z", archivedAt: null },
      { workspaceId: "w4", cwd: "D:\\yedek", title: null, updatedAt: "2026-11-04T00:00:00Z", archivedAt: null },
      { workspaceId: "w5", cwd: "C:/fwd/slash", title: "ileri bolu cwd basligi", updatedAt: "2026-11-04T00:00:00Z", archivedAt: null },
      { workspaceId: "w6", cwd: "D:\\taramada-yok", title: "ajani yok disarida", updatedAt: "2026-11-04T00:00:00Z", archivedAt: null },
    ]));
    const r = projelerTara(tmp);
    const bul = (d) => r.projeler.find((p) => p.dizin === d);
    assert.equal(bul("D-alfa").baslik, "eski ama aktif baslik", "arsivli en yeni DEGIL: aktif kayit kazanir");
    assert.equal(bul("D-beta").baslik, "beta basligi", "tek aktif kaydin basligi birlesir");
    assert.equal(bul("D-yedek").baslik, null, "title null -> baslik YOK (dashed yol yedek)");
    assert.equal(bul("C-fwd-slash").baslik, "ileri bolu cwd basligi", "ileri bolu cwd dash cevirimiyle eslesir ([\\\\/:]+ deseni)");
    ok("agents'ta olmayan cwd'nin basligi sessizce disarida kalir (tarama listede yok)", r.projeler.every((p) => p.dizin !== "D-taramada-yok"));
    ok("tarama ALANI degismedi (projeAdi dizin basename; orduMu dizin koklu)", r.projeler.every((p) => p.projeAdi === p.dizin));
    /* BOZUK workspaces.json: tarama DEGIL — projeler yasar, basliklar bos (fail-closed ayri) */
    const tmp2 = tempKok();
    try {
      const ag2 = join(tmp2, "agents");
      mkdirSync(join(ag2, "D-x"), { recursive: true });
      writeFileSync(join(ag2, "D-x", "55555555-5555-4555-8555-555555555555.json"), JSON.stringify({ id: "55555555-5555-4555-8555-555555555555", lastStatus: "idle", lastActivityAt: "2026-11-02T10:00:00Z" }));
      mkdirSync(join(tmp2, "projects"), { recursive: true });
      writeFileSync(join(tmp2, "projects", "workspaces.json"), "{bozuk json");
      const r2 = projelerTara(tmp2);
      assert.equal(r2.projeler.length, 1, "bozuk kayit defteri taramayi DURDURMAZ (fail-closed ayri)");
      assert.equal(r2.projeler[0].baslik, null, "bozuk defter -> basliklar bos kalir, dashed yol aynen");
    } finally { rmSync(tmp2, { recursive: true, force: true }); }
  } finally { rmSync(tmp, { recursive: true, force: true }); }

  /* --- (C) ordu-panosu.html kaynak pinleri: etiket TEK yardimcidan --- */
  ok("UI yardimcisi: function projeEtiketi(pr) — baslik VARSA o, yoksa projeAdi", j.includes("function projeEtiketi(pr)") && j.includes('typeof pr.baslik === "string" && pr.baslik.trim()'));
  ok("kullanim 1/5 agac satiri: etiket = projeEtiketi(pr) (kisalt 14 + satir title)", j.includes("const etiket = projeEtiketi(pr)"));
  ok("kullanim 2/5 ana sekme: ad = pr ? projeEtiketi(pr) : dizin (taramadan dustuysae dizin yedek)", j.includes("pr ? projeEtiketi(pr) : dizin"));
  ok("kullanim 3/5 chat basligi: seciliKonusma.projeEtiket (kimlik yolu projeDizin AYNEN)", j.includes("projeDizin: pr.dizin, projeEtiket: projeEtiketi(pr)") && j.includes("seciliKonusma.projeEtiket"));
  ok("kullanim 4/5 composer optgroup: 'SEÇİLİ PROJENİN OTURUM AJANLARI: etiket' (FAZ-M etiket dili)", j.includes('pr ? projeEtiketi(pr) : "yok"'));
  ok("PANEL-SIFIR-1: kullanim 5. tablo SÖKÜLDÜ — projeTabloAd kapısı kalıntı 0; FAZ-O EK-2: 6. kullanım oturumBul (oturum kartı proje satırı) — 1 tanım + 5 kullanım = 6 eşleşme", !j.includes('projeTabloAd') && (j.match(/projeEtiketi\(pr\)/g) || []).length === 6);
  ok("kimlik yolu DEGISMEZ: data-proje TAM dizin AYNEN (agac + tasi dugmeleri)", j.includes('data-proje="\' + esc(pr.dizin)'));
  ok("data-ana TAM dizin AYNEN (ana sekme kimligi)", j.includes('data-ana="\' + esc(dizin)'));

  /* --- (D) vm: baslik etikete AKAR, yoksa yedek --- */
  const R1 = "11111111-1111-4111-8111-111111111111";
  const R2 = "22222222-2222-4222-8222-222222222222";
  const FIXG = {
    olcumAniISO: "2026-11-03T12:00:00Z",
    projeler: [
      { dizin: "P-alfa", projeAdi: "P-alfa", baslik: "01234567890123456789012", orduMu: false, ajanlar: [
        { ajanKimligi: R1, ajanId: "11111111", lastStatus: "running", etiket: "çalışan ajan" },
      ] },
      { dizin: "P-beta", projeAdi: "beta", orduMu: false, ajanlar: [
        { ajanKimligi: R2, ajanId: "22222222", lastStatus: "idle", etiket: "bekleyen ajan" },
      ] },
    ],
  };
  const sahteG = {};
  const $g = (id) => (sahteG[id] = sahteG[id] || { innerHTML: "", textContent: "", hidden: true });
  const ctxG = {
    $: $g, esc: fnAl("esc"), kisalt: fnAl("kisalt"), kisaIdGoster: fnAl("kisaIdGoster"), projeEtiketi: fnAl("projeEtiketi"),
    P: FIXG, agacAcik: new Set(["P-alfa"]), agacSecili: null,
    agacGrupAcik: new Set(["running", "error"]), agacSira: null,
    NOKTA_SINIF: { running: "yesil", idle: "gri", error: "kirmizi", closed: "kapali" },
  };
  vm.runInNewContext(HTML.slice(HTML.indexOf("function ajanDugumHtml("), HTML.indexOf('$("agacAlani").addEventListener')) + "\nagacYaz", ctxG)();
  const hg = sahteG.agacAlani.innerHTML;
  ok("vm agac: FAZ-Q — klasorAdi YOK → dashed yedek görünür ('P-alfa' [projeAdi]; baslik GÖRÜNMEZ) + baslik TOOLTIP'te yaşar (title 'dizin — baslik — N çalışan · M ajan kaydı')", hg.includes(">P-alfa</span>") && !hg.includes(">01234567890123456789012</span>") && hg.includes('title="P-alfa — 01234567890123456789012 — 1 çalışan · 1 ajan kaydı"'));
  ok("vm agac: baslik YOKSA title'da da baslik segmenti yok (beta — dashed yedek aynen)", hg.includes(">beta</span>") && hg.includes('title="P-beta — 0 çalışan · 1 ajan kaydı"'));
  ok("vm agac: kimlik yolu DEGISMEZ (data-proje TAM dizin)", hg.includes('data-proje="P-alfa"') && hg.includes('data-proje="P-beta"'));
  const sahte2 = {};
  const $2 = (id) => (sahte2[id] = sahte2[id] || { innerHTML: "" });
  const ctxS = {
    $: $2, esc: fnAl("esc"), kisalt: fnAl("kisalt"), projeEtiketi: fnAl("projeEtiketi"),
    P: { projeler: [ { dizin: "P-uzun", projeAdi: "P-uzun", baslik: "sekme basligi uzun ornek metni", orduMu: false, ajanlar: [] } ] },
    aktifSekme: "ordu", acikSekmeler: ["P-uzun"], acikOturumSekmeleri: [], /* FAZ-O EK-2 */
  };
  vm.runInNewContext(HTML.slice(HTML.indexOf("function anaSekmeYaz("), HTML.indexOf('$("anaSekmeSerit").addEventListener')) + "\nanaSekmeYaz", ctxS)();
  const hs = sahte2.anaSekmeSerit.innerHTML;
  ok("vm ana sekme: FAZ-Q — klasorAdi YOK → dashed yedek sekme adı ('P-uzun'; baslik görünmez) + title 'ad — dizin' + data-ana TAM dizin (eski pini baslik akışıydı)", hs.includes(">P-uzun</button>") && !hs.includes(">sekme basligi…</button>") && hs.includes('title="P-uzun — P-uzun"') && hs.includes('data-ana="P-uzun"'));
});

test("51l- PANEL-ANA-1 FAZ-H (kaynak-pin): tipografi ölçeği + nefes + nabız + kisalt eşikleri — steering «yazılar çok küçük okunaklu yap modern sade minimalist kompkat az yerde çok işlev dinamik akışlar nefes alan tasarım büyük resim ve yazılar» 2026-11-03", () => {
  const j = jsKisim();
  /* --- TİPOGRAFİ ölçeği (ana kalem — ölçülebilir hedefler) --- */
  ok("FAZ-P baz 13px + line-height 1.5 (REVİZYON 2026-11-04 §1 kompakt-okunaklı; eski 15px/1.55)", /body\s*\{[^}]*font-size:\s*13px/.test(HTML) && /body\s*\{[^}]*line-height:\s*1\.5/.test(HTML));
  ok("FAZ-P bolum-etiket 15px/600 (§1 başlık bandı; eski 18px)", /\.bolum-etiket\s*\{[^}]*font-size:\s*15px/.test(HTML));
  ok("ağaç ölçeği: agacProjeBas 13px + agacAjan 13px (FAZ-P §1; agacGrupBas SÖKÜLDÜ — kalıntı 0)", /\.agacProjeBas\s*\{[^}]*font-size:\s*13px/.test(HTML) && /\.agacAjan\s*\{[^}]*font-size:\s*13px/.test(HTML) && !/\.agacGrupBas/.test(HTML));
  ok("ağaç satır yüksekliği 32px ailesi (proje + ajan — grup/taşıma hedefleri söküldü)", /\.agacProjeBas\s*\{[^}]*min-height:\s*32px/.test(HTML) && /\.agacAjan\s*\{[^}]*min-height:\s*32px/.test(HTML));
  ok("agacSayi rozet 13px kalın mono (büyük resim — sayı okunur)", /\.agacSayi\s*\{[^}]*font:\s*700 13px var\(--mono\)/.test(HTML));
  ok("ana şerit sekme fontu 13px (FAZ-P §1; alt şerit SÖKÜLDÜ — kalıntı 0)", /\.sekme\s*\{[^}]*font-size:\s*13px/.test(HTML) && !/#altSekmeSerit/.test(HTML));
  ok("PANEL-SIFIR-1: özet hero SÖKÜLDÜ — ozetGrid/ozetKart/ozetDeger/ozetEtiket/ozetAlt sınıfları kalıntı 0", !/\.ozetGrid/.test(HTML) && !/\.ozetKart/.test(HTML) && !/\.ozetDeger/.test(HTML) && !/\.ozetEtiket/.test(HTML) && !/\.ozetAlt/.test(HTML));
  ok("chat balon FAZ-I: .chatMesaj 15px/1.55 + chatKim 11.5px/700 + chatSaat 11px + sonuc 12px (eski chatMetin/chatKimlik KALKTI — 51m'de kalıntı pini)", /\.chatMesaj\s*\{[^}]*font-size:\s*15px/.test(HTML) && /\.chatMesaj\s*\{[^}]*line-height:\s*1\.55/.test(HTML) && /\.chatKim\s*\{[^}]*font-size:\s*11\.5px/.test(HTML) && /\.chatSaat\s*\{[^}]*font-size:\s*11px/.test(HTML) && /\.chatSonuc\s*\{[^}]*font-size:\s*12px/.test(HTML));
  ok("PANEL-SIFIR-1: planTablo SÖKÜLDÜ — td/th/tfoot + tabloSarma sınıfları kalıntı 0", !/\.planTablo/.test(HTML) && !/\.tabloSarma/.test(HTML));
  /* --- NEFES (padding/dikey boşluk) --- */
  ok("bolum padding 10px 12px 12px + üst nefes 12px (FAZ-P §2 EKONOMİK — eski 16px 20px 20px/16px; FAZ-O EK-3 notu aynen: yalnız #sol > .bolum)", /\.bolum\s*\{[^}]*padding:\s*10px 12px 12px/.test(HTML) && /#sol > \.bolum\s*\{[^}]*margin-top:\s*12px/.test(HTML) && !/#sol > \.bolum, #sag > \.bolum/.test(HTML));
  ok("sekmeGovde padding 8px 12px 12px (FAZ-P §2; altSekmeSerit SÖKÜLDÜ — kalıntı 0)", /#sekmeGovde\s*\{[^}]*padding:\s*8px 12px 12px/.test(HTML) && !/#altSekmeSerit/.test(HTML));
  ok("PANEL-SIFIR-1: ozetKart nefes pini gitti — kart sınıfı kalıntı 0 (özet hero söküldü)", !/\.ozetKart/.test(HTML) && !/\.ozetGrid/.test(HTML));
  /* --- DİNAMİK AKIŞ: çalışan noktası nabzı (opacity-only; ≤2 yeni keyframes) --- */
  ok("nabız: .nokta.yesil animation:nabiz 2s infinite", /\.nokta\.yesil\s*\{[^}]*animation:\s*nabiz 2s ease-in-out infinite/.test(HTML));
  const nabizBlok = HTML.match(/@keyframes\s+nabiz\s*\{[\s\S]*?\}\s*\}/);
  ok("nabız keyframes blok opacity-only (layout özellik animasyonu YASAK — E12)", (HTML.match(/@keyframes/g) || []).length <= 2 && !!nabizBlok && nabizBlok[0].includes("opacity") && !/(width|height|padding|margin|top|left|right|bottom)\s*:/.test(nabizBlok[0]));
  ok("nabız reduced-motion'da kapalı (bilgi hareketi tercihe saygı)", /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation:\s*none/.test(HTML));
  /* --- KISALT eşikleri (font büyüdü — satır genişliği dengesi; title TAM AYNEN) --- */
  ok("ağaç etiketi TAM (FAZ-K — kisalt(etiket,12) KALDIRILDI) + ana sekme eşiği 14 (BİLİNÇLİ: 16→14 — sekme DAR kalır, FAZ-D kayıtlı karar)", !j.includes("kisalt(etiket, 12) || etiket") && j.includes("kisalt(ad, 14) || ad"));
  ok("kisalt eşik ötesi (PANEL-SIFIR-1 sonrası: chat 20 · sağlayıcı 16 — akış 80 SÖKÜLDÜ; oturum 12 KALDIRILDI)", !j.includes("kisalt(a.etiket, 12)") && j.includes("kisalt(a.etiket, 20)") && !j.includes("kisalt(o.ad, 80)") && j.includes("kisalt(a.provider, 16)"));
  /* --- K-0061 §5 minimumlar yukarı taşındı (aşağı düşmez) --- */
  ok("§5 korunur: GÖNDER min-height 40px + --min-dokunma 44px + sekme 34px ≥26px + ağaç 32px ≥26px", /#composerGonder\s*\{[^}]*min-height:\s*40px/.test(HTML) && HTML.includes("--min-dokunma:44px") && /\.sekme\s*\{[^}]*min-height:\s*34px/.test(HTML) && /\.agacAjan\s*\{[^}]*min-height:\s*32px/.test(HTML));
  /* --- veri katmanı hunk YOK (diff denetimi desteği) --- */
  ok("veri katmanı DARALDI (PANEL-SIFIR-1): cek(UC. 3 (kadro + projeler + graf) + POST /api/mesaj + CHAT_TAVAN", (j.match(/cek\(UC\./g) || []).length === 3 && j.includes('"/api/mesaj"') && j.includes("CHAT_TAVAN"));
  ok("renk dili AYNEN: petrol tek aksan + token seti birebir (YENİ renk YOK — FAZ-H yalnız ölçek/nefes)", HTML.includes("--camgobegi:#0f4c81; --basari:#047857; --uyari:#b45309; --tehlike:#dc2626;") && HTML.includes("--zemin:#ffffff; --yuzey:#ffffff; --yuzey2:#eef2f7; --yuzey3:#e4eaf2;") && HTML.includes("--metin:#1a2332; --ikincil:#51617a; --cizgi:#e2e8f0; --glow:rgba(15,76,129,0.18);"));
});

test("51m- PANEL-ANA-1 FAZ-I (kaynak-pin + vm): sağ chat TUVAL DİLİ — balon mesajlar (gönderilen SAĞA hizalı petrol balon + chatKim üstte/chatSaat altta + TAM metin) + hata kırmızı tonu KALIR + eski log satır görünümü KALKAR (bilinçli)", () => {
  const j = jsKisim();
  const h = htmlKisim();
  /* --- balon yapı (CSS — kapsul-tuval #chatBolum dili uyarlanır) --- */
  ok("balon gövde: 15px/1.55 + padding 8px 10px + radius + overflow-wrap:anywhere (balon kendi sarar)", /\.chatMesaj\s*\{[^}]*font-size:\s*15px/.test(HTML) && /\.chatMesaj\s*\{[^}]*line-height:\s*1\.55/.test(HTML) && /\.chatMesaj\s*\{[^}]*padding:\s*8px 10px/.test(HTML) && /\.chatMesaj\s*\{[^}]*border-radius:\s*var\(--radius-k\)/.test(HTML) && /\.chatMesaj\s*\{[^}]*overflow-wrap:\s*anywhere/.test(HTML));
  ok("balon içindeki p margin:0 (tuval deseni)", /\.chatMesaj p\s*\{[^}]*margin:\s*0/.test(HTML));
  ok("chat-kullanici: petrol balon rgba(15,76,129,0.08)/0.3 + SAĞA hizalı + FAZ-P §2a DAR görünüm tavanı min(92%, 660px) (eski max-width:92%)", /\.chatMesaj\.chat-kullanici\s*\{[^}]*background:\s*rgba\(15,76,129,0\.08\)/.test(HTML) && /\.chatMesaj\.chat-kullanici\s*\{[^}]*border:\s*1px solid rgba\(15,76,129,0\.3\)/.test(HTML) && /\.chatMesaj\.chat-kullanici\s*\{[^}]*align-self:\s*flex-end/.test(HTML) && /\.chatMesaj\.chat-kullanici\s*\{[^}]*max-width:\s*min\(92%, 660px\)/.test(HTML));
  ok("hata balonu kırmızı tonu KALIR: rgba(220,38,38,0.06) bg + kırmızı kenar", /\.chat-kullanici\.hata\s*\{[^}]*background:\s*rgba\(220,38,38,0\.06\)/.test(HTML) && /\.chat-kullanici\.hata\s*\{[^}]*border-color:\s*rgba\(220,38,38,0\.35\)/.test(HTML));
  ok("başarı kenarı yeşil ton (eski sol kenar sinyalinin karşılığı — basari rgba)", /\.chat-kullanici\.basarili\s*\{[^}]*border-color:\s*rgba\(4,120,87,0\.4\)/.test(HTML));
  ok("chatKim ÜSTTE: 11.5px/700 + letter-spacing 0.06em + ikincil + margin-bottom 3px", /\.chatKim\s*\{[^}]*font-size:\s*11\.5px/.test(HTML) && /\.chatKim\s*\{[^}]*font-weight:\s*700/.test(HTML) && /\.chatKim\s*\{[^}]*letter-spacing:\s*0\.06em/.test(HTML) && /\.chatKim\s*\{[^}]*margin:\s*0 0 3px/.test(HTML));
  ok("chatSaat ALTTA: 11px + ikincil + margin-top 4px (tuval deseni)", /\.chatSaat\s*\{[^}]*font-size:\s*11px/.test(HTML) && /\.chatSaat\s*\{[^}]*margin:\s*4px 0 0/.test(HTML) && !/\.chatSaat\s*\{[^}]*font-family:\s*var\(--mono\)/.test(HTML));
  ok("chatListe flex column + gap 6px (tuval chat hattı)", /\.chatListe\s*\{[^}]*display:\s*flex; flex-direction:\s*column;\s*gap:\s*6px/.test(HTML));
  ok("boş durum İNCE balon FAZ-O: #chatBos chat-sistem görünümü (yuzey2 + dashed) AYNEN; chatOturumNotu sınıfı SÖKÜLDÜ (kelime yalnız yorumda — mekanizma 0)", /#chatBos\s*\{[^}]*border:\s*1px dashed var\(--cizgi\)/.test(HTML) && /#chatBos\s*\{[^}]*background:\s*var\(--yuzey2\)/.test(HTML) && !/\.chatOturumNotu\s*\{/.test(HTML) && !/class="chatOturumNotu"/.test(HTML));
  ok("composer cila: #composerForm gap 6px (tuval chatForm hizası — gönderim mantığı AYNEN)", /#composerForm\s*\{[^}]*gap:\s*6px/.test(HTML));
  /* --- eski log satır görünümü KALKAR (bilinçli pin — kalıntı 0) --- */
  ok("eski chatSatir/chatKimlik/chatMetin sınıf kalıntısı 0 (bilinçli: balon dili)", !HTML.includes("chatSatir") && !HTML.includes("chatKimlik") && !HTML.includes("chatMetin"));
  ok("köşeli parantez log formatı render'da KALDI (bilinçli: [saat]/[hedef] gitti)", !j.includes("'[' + esc(m.saat)") && !j.includes("'[' + esc(m.hedefKisa)"));
  ok("kisalt(m.metin, 80) kalıntısı 0 (balon kendi sarar — TAM metin esc ile)", !j.includes("kisalt(m.metin, 80)"));
  /* --- AYNA korunur --- */
  ok("role=log + aria-live=polite AYNEN", /id="chatListe"[^>]*role="log"[^>]*aria-live="polite"/.test(h));
  ok("CHAT_TAVAN 200 + shift AYNEN (oturum-içi bellek — localStorage YOK)", j.includes("const CHAT_TAVAN = 200") && j.includes("oturumMesajlari.shift()"));
  ok("composer AYNEN: POST /api/mesaj + 2 AYRI optgroup + GÖNDER 40px §5", j.includes('"/api/mesaj"') && (j.match(/<optgroup/g) || []).length === 2 && /#composerGonder\s*\{[^}]*min-height:\s*40px/.test(HTML));
  ok("30sn odak koruması AYNEN: odakIcindeMi(\"#bolum-composer\")", j.includes('odakIcindeMi("#bolum-composer")'));
  ok("kompakt konuşma başlık satırı KORUNUR (durum noktası + seçili konuşma + sağlayıcı)", /\.chatBaslikSatiri\s*\{/.test(HTML) && j.includes("chatBaslikYaz"));
  /* --- vm: balon render — hata yolu + esc/XSS + yapı sırası --- */
  const A = "432e03b7-9004-445c-857d-ebf3b6661d53";
  const chatFn = HTML.slice(HTML.indexOf("function chatMesajHtml("), HTML.indexOf("function chatMesajYaz("));
  const chatMesajHtml = vm.runInNewContext(chatFn + "\nchatMesajHtml", { esc: fnAl("esc"), kisalt: fnAl("kisalt") });
  const hataM = { saat: "18:40", hedefKisa: "432e03b7", hedefKimlik: A, metin: '<script>x</script> ' + "u".repeat(120), sonuc: { tur: "hata", metin: "HTTP 429 — pencere dolu" } };
  const balon = chatMesajHtml(hataM);
  ok("vm hata balonu: chatMesaj chat-kullanici hata sınıfı (kırmızı yüz balon dilinde)", balon.includes('class="chatMesaj chat-kullanici hata"'));
  ok("vm yapı sırası: chatKim ÜSTTE (title TAM kimlik + kısa ad) → metin → saat → sonuç", balon.indexOf('<div class="chatKim" title="' + A + '">432e03b7</div>') < balon.indexOf("<p>&lt;script&gt;") && balon.indexOf('<div class="chatSaat">18:40</div>') < balon.indexOf('class="chatSonucSatiri"'));
  ok("vm XSS: TAM metin esc'ten geçer (120 karakter KESİLMEDİ — kisalt YOK)", balon.includes("&lt;script&gt;x&lt;/script&gt; " + "u".repeat(120)) && !balon.includes("<script>x"));
  ok("vm saat: HH:mm köşeli parantez YOK (log formatı gitti)", balon.includes('<div class="chatSaat">18:40</div>') && !balon.includes("[18:40]"));
  ok("vm hata: sonuç İNCE satır balon içinde ('hata: HTTP 429 — pencere dolu')", balon.includes('class="chatSonuc hata">hata: HTTP 429 — pencere dolu'));
  const bekleM = { saat: "18:41", hedefKisa: "kurmay", hedefKimlik: A, metin: "deneme", sonuc: { tur: "bekliyor", metin: "" } };
  const bekleyen = chatMesajHtml(bekleM);
  ok("vm bekliyor: nötr balon (chat-kullanici — ekstra durum sınıfı YOK) + 'gönderiliyor…'", bekleyen.includes('class="chatMesaj chat-kullanici"') && bekleyen.includes(">gönderiliyor…"));
  const basM = { saat: "18:42", hedefKisa: "kurmay", hedefKimligi: A, hedefKimlik: A, metin: "tamamlandı", sonuc: { tur: "basarili", metin: "12:00" } };
  ok("vm başarı: 'gönderildi · 12:00' ince satır + chat-kullanici basarili sınıfı", chatMesajHtml(basM).includes(">gönderildi · 12:00") && chatMesajHtml(basM).includes('chatMesaj chat-kullanici basarili'));
});

test("51n- PANEL-ANA-1 FAZ-J + PANEL-SIFIR-1 (kaynak-pin + vm): responsive + mobile touch %100 — pointer:coarse 44px dokunma hedefleri (masaüstü BİREBİR AYNEN) + <899px istif sırası (ağaç→orta→chat — SIFIR seçim akışı) + graf sekme filtresi (vm) + touch-action + overscroll", () => {
  const j = jsKisim();
  const h = htmlKisim();
  /* --- viewport meta AYNEN (dokunulmadı; user-scalable KAPATILMAZ — erişilebilirlik) --- */
  ok("viewport meta AYNEN: width=device-width, initial-scale=1 + user-scalable YOK (pinch zoom açık)", h.includes('<meta name="viewport" content="width=device-width, initial-scale=1">') && !/user-scalable\s*=\s*no/i.test(h));
  /* --- pointer:coarse bloğu (YENİ) — dokunmatikte 44px; masaüstü kompakt AYNEN --- */
  ok("pointer:coarse bloğu var (dokunmatik işaretçi)", /@media \(pointer:coarse\)/.test(HTML));
  ok("coarse: .sekme min-height var(--min-dokunma)", /@media \(pointer:coarse\)[\s\S]*?\.sekme\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(HTML));
  ok("coarse: ağaç satır ailesi 44px (agacProjeBas + agacAjan — agacGrupBas SÖKÜLDÜ)", /@media \(pointer:coarse\)[\s\S]*?\.agacProjeBas, \.agacAjan\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(HTML));
  ok("PANEL-SIFIR-1: coarse taşıma düğmesi KALINTI 0 (agacTasiBtn mekanizması gitti)", !/@media \(pointer:coarse\)[\s\S]*?\.agacTasiBtn/.test(HTML) && !/\.agacTasiBtn/.test(HTML));
  ok("coarse: sekmeKapat 44px (filtreBtn SÖKÜLDÜ — kalıntı 0)", /@media \(pointer:coarse\)[\s\S]*?\.sekmeKapat\s*\{[^}]*width:\s*var\(--min-dokunma\)/.test(HTML) && !/\.filtreBtn/.test(HTML));
  ok("coarse: GÖNDER 44px (masaüstünde 40px §5 — yalnız coarse kuralı)", /@media \(pointer:coarse\)[\s\S]*?#composerGonder\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(HTML));
  ok("MASAÜSTÜ KOMPAKT AYNEN: .sekme 34px + ağaç 32px + GÖNDER 40px kaynakta DEĞİŞMEDİ (coarse yalnız medya kuralında)", /\.sekme\s*\{[^}]*min-height:\s*34px/.test(HTML) && /\.agacAjan\s*\{[^}]*min-height:\s*32px/.test(HTML) && /#composerGonder\s*\{[^}]*min-height:\s*40px/.test(HTML));
  /* --- <899px istif sırası (CSS order — DOM değişmez) --- */
  ok("899px istif sırası FAZ-O EK-3: #orta (chat) order:1 → #sag (sekmeli) order:2 → #sol (ağaç) order:3 (chat ÜSTTE — kullanıcı «chat sekmesini ortaya al»; eski SIFIR sırası ağaç-üstte bilinçli değişti)", /@media \(max-width:899px\)[\s\S]*?#orta\s*\{\s*order:1;\s*\}[\s\S]*?#sag\s*\{\s*order:2;\s*\}[\s\S]*?#sol\s*\{\s*order:3;/.test(HTML));
  ok("DOM sırası DEĞİŞMEDİ (order yalnız CSS): #sol grid-column:1 → #orta:3 → #sag:5 kaynakta AYNEN", /main > #sol\s*\{[^}]*grid-column:1/.test(HTML) && /main > #orta\s*\{[^}]*grid-column:3/.test(HTML) && /main > #sag\s*\{[^}]*grid-column:5/.test(HTML));
  ok("FAZ-C istif mirası AYNEN: liste 140px tabanı + composer altta + splitter gizli", /@media \(max-width:899px\)[\s\S]*?\.chatListe\s*\{[^}]*min-height:\s*140px/.test(HTML) && /@media \(max-width:899px\)[\s\S]*?\.splitter\s*\{[^}]*display:\s*none/.test(HTML));
  /* --- planTablo/tabloSarma SÖKÜLDÜ (PANEL-SIFIR-1 — tablo yüzü gitti) --- */
  ok("PANEL-SIFIR-1: .tabloSarma + .planTablo + tabloYaz render KALINTI 0", !/\.tabloSarma/.test(HTML) && !/\.planTablo/.test(HTML) && !j.includes("function tabloYaz") && !j.includes("function planTabloYaz"));
  /* --- vm: ORTA gövde = seçili sekmenin görev grafı (grafYaz) --- */
  const grafSham = { innerHTML: "" };
  const grafCagrilar = [];
  const grafFn = HTML.slice(HTML.indexOf("function grafYaz("), HTML.indexOf("async function grafYukle"));
  const grafYaz = vm.runInNewContext(grafFn + "\ngrafYaz", {
    $: (id) => { if (id !== "grafAlani") throw new Error("beklenmedik kapı: " + id); return grafSham; },
    dalgaYaz: (gorevler, tamMu) => { grafCagrilar.push([gorevler.length, tamMu]); },
    G: { kritikYol: ["g1"], gorevler: [
      { id: "g1", dizin: "core/src", faz: "F1" },
      { id: "g2", dizin: "pano", faz: "F2" },
    ] },
    aktifSekme: "ordu",
  });
  grafYaz();
  ok("vm grafYaz: ORDU sekmesi TAM graf (dalgaYaz 2 görev, tamMu true — KRİTİK YOL + cephe dahil)", grafCagrilar.length === 1 && grafCagrilar[0][0] === 2 && grafCagrilar[0][1] === true);
  grafCagrilar.length = 0;
  const grafYazP = vm.runInNewContext(grafFn + "\ngrafYaz", {
    $: (id) => { if (id !== "grafAlani") throw new Error("beklenmedik kapı: " + id); return grafSham; },
    dalgaYaz: (gorevler, tamMu) => { grafCagrilar.push([gorevler.length, tamMu]); },
    G: { kritikYol: ["g1"], gorevler: [
      { id: "g1", dizin: "core/src", faz: "F1" },
      { id: "g2", dizin: "pano", faz: "F2" },
    ] },
    aktifSekme: "pano",
  });
  grafYazP();
  ok("vm grafYaz: proje sekmesi dizin filtresi (dalgaYaz 1 görev, tamMu false — sadece pano dizini)", grafCagrilar.length === 1 && grafCagrilar[0][0] === 1 && grafCagrilar[0][1] === false);
  grafCagrilar.length = 0;
  const grafYazYok = vm.runInNewContext(grafFn + "\ngrafYaz", {
    $: (id) => { if (id !== "grafAlani") throw new Error("beklenmedik kapı: " + id); return grafSham; },
    dalgaYaz: (gorevler, tamMu) => { grafCagrilar.push([gorevler.length, tamMu]); },
    G: { kritikYol: ["g1"], gorevler: [
      { id: "g1", dizin: "core/src", faz: "F1" },
      { id: "g2", dizin: "pano", faz: "F2" },
    ] },
    aktifSekme: "D-Vibecode-yok-boyle",
  });
  grafYazYok();
  ok("vm grafYaz: 0 eşleşme → DÜRÜST BOŞ not (sahte graf YASAK E10 — dalgaYaz çağrılmaz)", grafCagrilar.length === 0 && grafSham.innerHTML.includes("bu projenin graf görevi yok") && grafSham.innerHTML.includes("sahte graf yazılmaz"));
  const grafSham2 = { innerHTML: "" };
  const grafYazFail = vm.runInNewContext(grafFn + "\ngrafYaz", {
    $: (id) => { if (id !== "grafAlani") throw new Error("beklenmedik kapı: " + id); return grafSham2; },
    dalgaYaz: () => { throw new Error("dalgaYaz çağrılmamalıydı"); },
    G: null, aktifSekme: "ordu",
  });
  grafYazFail();
  ok("vm grafYaz: G yok → fail-closed notu (dalgaYaz'a uğramaz)", grafSham2.innerHTML.includes("fail-closed") );
  ok("grafYaz kaynak pini: aktifSekme === \"ordu\" + g.dizin.includes(aktifSekme) filtresi", j.includes('aktifSekme === "ordu"') && j.includes("g.dizin.includes(aktifSekme)"));
  /* --- touch-action + overscroll --- */
  ok("touch-action:manipulation etkileşimlilerde (PANEL-SIFIR-1 listesi: select/button/sekme/ağaç satırı/kapat — grup/taşı/filtre SÖKÜLDÜ)", /select, button, \.sekme, \.agacProjeBas, \.agacAjan, \.sekmeKapat\s*\{[^}]*touch-action:\s*manipulation/.test(HTML) && !/\.agacTasiBtn[^{]*touch-action/.test(HTML) && !/\.filtreBtn[^{]*touch-action/.test(HTML));
  ok("splitter touch-action:none AYNEN (sürükleme — güçlü kural zaten)", /\.splitter\s*\{[^}]*touch-action:\s*none/.test(HTML));
  ok("overscroll-behavior:contain — .chatListe + #sol (kaydırma zinciri sayfaya zıplamaz)", /\.chatListe\s*\{[^}]*overscroll-behavior:\s*contain/.test(HTML) && /#sol\s*\{[^}]*overscroll-behavior:\s*contain/.test(HTML));
  /* --- sınır: drawer/hamburger YOK + veri katmanı AYNEN --- */
  ok("drawer/perde/hamburger MEKANİZMASI YOK (kayıtlı karar — istif + order yeter; FAZ-C mirası yorumdaki 'kopyalanmadı' cümlesi dokümantasyondur, mekanizma değil)", !/hamburger/i.test(HTML) && !/id="(drawer|perde|menuBtn|navToggle)"/i.test(HTML) && !/class="[^"]*\b(drawer|perde|hamburger)\b/.test(HTML));
  ok("veri katmanı AYNEN: cek(UC. 3 (graf + projeler + kadro — PANEL-SIFIR-1 sonrası dürüst sayı) + POST /api/mesaj + CHAT_TAVAN 200 + optgroup 2", (j.match(/cek\(UC\./g) || []).length === 3 && j.includes('"/api/mesaj"') && j.includes("const CHAT_TAVAN = 200") && (j.match(/<optgroup/g) || []).length === 2);
  ok("localStorage şeması PANEL-SIFIR-1: ordu-agac-sira/GRUP mekanizması gitti (kaydet/oku çağrıları 0 — kelime yorumlarda dokümantasyon olarak geçer); kalan anahtarlar agac-acik + agac-secili + kolon genişlikleri", !j.includes('kaydet("ordu-agac-sira"') && j.includes('kaydet("ordu-agac-acik"') && j.includes('kaydet("ordu-agac-secili"') && !j.includes('kaydet("ordu-agac-grup"') && !j.includes('oku("ordu-agac-grup"'));
});

test("51o- PANEL-ANA-1 FAZ-K (kaynak-pin + vm): ağaç etiketleri TAM — kisalt KALDIRILDI (okunmaz kırpma gitti) + uzun adlar SARAR (white-space:normal + overflow-wrap:anywhere); ana sekme/chat/optgroup kısaltmaları BİLİNÇLİ KALDI (kayıtlı kararlar) — steering «proje isimlerini kısaltırken okunmaz yapmışsın klasör isimlerini doğrudan yaz onları göster oturum ismini de aynı yap şimdilik» + «oturum isimleri ben paseo da yazdığım isimleri kullan» 2026-11-03", () => {
  const j = jsKisim();
  const h = htmlKisim();
  /* --- (1) CSS: 3 ağaç sınıfı SARAR; ellipsis/nowrap kalıntısı 0 (yalnız ağaç kapsamı) --- */
  ok(".agacProjeBas white-space:normal (FAZ-K: nowrap→normal — proje adı satırına sarar)", /\.agacProjeBas\s*\{[^}]*white-space:\s*normal/.test(HTML) && !/\.agacProjeBas\s*\{[^}]*white-space:\s*nowrap/.test(HTML));
  ok(".agacAd overflow-wrap:anywhere (FAZ-K: overflow:hidden/ellipsis KALDIRILDI — dashed adlar 'D-Vibecode-...' boşluksuz, ancak anywhere ile kırılır)", /\.agacAd\s*\{[^}]*overflow-wrap:\s*anywhere/.test(HTML) && !/\.agacAd\s*\{[^}]*(ellipsis|overflow:\s*hidden)/.test(HTML));
  ok(".agacDugumAd white-space:normal + overflow-wrap:anywhere (FAZ-K: nowrap/ellipsis KALDIRILDI — oturum adı kullanıcının Paseo'daki adıyla sarar)", /\.agacDugumAd\s*\{[^}]*white-space:\s*normal/.test(HTML) && /\.agacDugumAd\s*\{[^}]*overflow-wrap:\s*anywhere/.test(HTML) && !/\.agacDugumAd\s*\{[^}]*(ellipsis|nowrap|overflow:\s*hidden)/.test(HTML));
  ok("ağaç sınıflarında SABİT height YOK (min-height ile satır sarınca doğal uzar — 'min-' öneki hariç)", !/\.agac(ProjeBas|Ajan|DugumAd)\s*\{[^}]*[^-]\bheight:\s*[0-9]/.test(HTML) && !/\.agac(ProjeBas|Ajan|DugumAd)\s*\{[^}]*^\s*height:/m.test(HTML));
  ok("KAPSAM DIŞI AYNEN: ana sekme DAR (max-width:180 + ellipsis — FAZ-D kayıtlı karar) + chat başlığı kisalt 20", /\.anaSekmeGrup \.sekme\s*\{[^}]*max-width:\s*180px[^}]*text-overflow:\s*ellipsis/.test(HTML) && j.includes("kisalt(a.etiket, 20)"));
  /* --- (2) JS: ağaç renderında kisalt KALINTISI 0 (ajanDugumHtml → agacAlani dinleyicisi arası ağaç render ailesi; yorumlar ayıklanır — FAZ-K yorumları 'KALDIRILDI' sözcüğünü taşır) --- */
  const agacKaynak = HTML.slice(HTML.indexOf("function ajanDugumHtml("), HTML.indexOf('$("agacAlani").addEventListener')).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  ok("ağaç render kaynağında kisalt ÇAĞRISI 0 (ajanDugumHtml + agacYaz TEK SEVİYE — TAM etiket; chat başlık 20 BİLİNÇLİ kalır — bu dilimin DIŞINDA)", !/kisalt\(/.test(agacKaynak));
  ok("proje satırı: '<span class=\"agacAd\">' + esc(etiket) TAM (başlık VARSA başlık = kullanıcının Paseo rename'i)", j.includes('<span class="agacAd">\' + esc(etiket) + "</span>"'));
  ok("oturum düğümü: etiketVar ? a.etiket (TAM) : dürüst yedek (ajanId/kisaIdGoster) — yedek AYNEN", j.includes('etiketVar ? a.etiket : a.ajanId || kisaIdGoster(a.ajanKimligi) || "?"'));
  ok("satır title birleşik bicim FAZ-Q (dizin + [baslik] + çalışan/kayıt bilgisi korunur — TAM kimlik hover'da)", j.includes('const tamTitle = esc(pr.dizin)') && j.includes('" — " + calisan + " çalışan · " + ajanlar.length + " ajan kaydı"'));
  /* --- (3) vm: uzun etiketli sahte proje + başlıksız ajan dürüst yedek --- */
  const R1 = "33333333-3333-4333-8333-333333333333";
  const FIXK = {
    olcumAniISO: "2026-11-03T21:00:00Z",
    projeler: [
      { dizin: "D-Vibecode-Chrome-extension-sarisite-export", projeAdi: "D-Vibecode-Chrome-extension-sarisite-export", baslik: "dodo lemon", orduMu: false, ajanlar: [
        { ajanKimligi: R1, ajanId: null, lastStatus: "idle", etiket: null },
      ] },
    ],
  };
  const sahteK = {};
  const $k = (id) => (sahteK[id] = sahteK[id] || { innerHTML: "", textContent: "", hidden: true });
  const ctxK = {
    $: $k, esc: fnAl("esc"), kisalt: fnAl("kisalt"), kisaIdGoster: fnAl("kisaIdGoster"), projeEtiketi: fnAl("projeEtiketi"),
    P: FIXK, agacAcik: new Set(["D-Vibecode-Chrome-extension-sarisite-export"]), agacSecili: null,
    agacGrupAcik: new Set(["running", "error", "idle"]), agacSira: null,
    NOKTA_SINIF: { running: "yesil", idle: "gri", error: "kirmizi", closed: "kapali" },
  };
  vm.runInNewContext(HTML.slice(HTML.indexOf("function ajanDugumHtml("), HTML.indexOf('$("agacAlani").addEventListener')) + "\nagacYaz", ctxK)();
  const hk = sahteK.agacAlani.innerHTML;
  ok("vm agac: FAZ-Q — rename başlık GÖRÜNMEZ ('dodo lemon' tooltip'te yaşar); görünen ad dashed KLASÖR-ADI yedeki TAM sarar", hk.includes(">D-Vibecode-Chrome-extension-sarisite-export</span>") && !hk.includes(">dodo lemon</span>"));
  ok("vm agac: başlıksız ajan DÜRÜST YEDİK AYNEN (etiket YOK → 8 hane kimlik, 'başlıksız' uydurması YOK)", /class="agacDugumAd"[^>]*>33333333</.test(hk) && !hk.includes("başlıksız"));
  ok("vm agac: kimlik yolu DEĞİŞMEZ (data-proje TAM dizin + data-ajan TAM uuid + title FAZ-Q birleşik: dizin — baslik — çalışan/kayıt)", hk.includes('data-proje="D-Vibecode-Chrome-extension-sarisite-export"') && hk.includes('data-ajan="' + R1 + '"') && hk.includes('title="D-Vibecode-Chrome-extension-sarisite-export — dodo lemon — 0 çalışan · 1 ajan kaydı"'));
  /* --- (4) korunum: min-height 32 ailesi + FAZ-J coarse 44 aynen --- */
  ok("ağaç satır min-height 32px ailesi KORUNUR (sarma doğal uzama — sabit height YOK; agacGrupBas SÖKÜLDÜ)", /\.agacProjeBas\s*\{[^}]*min-height:\s*32px/.test(HTML) && /\.agacAjan\s*\{[^}]*min-height:\s*32px/.test(HTML) && !/\.agacGrupBas/.test(HTML));
  ok("FAZ-J coarse 44px AYNEN (pointer:coarse bloğu SIFIR kabuğuna uyarlandı: agacProjeBas + agacAjan 44)", /@media \(pointer:coarse\)[\s\S]*?\.agacProjeBas, \.agacAjan\s*\{[^}]*min-height:\s*var\(--min-dokunma\)/.test(HTML) && /@media \(pointer:coarse\)[\s\S]*?\.sekmeKapat\s*\{[^}]*width:\s*var\(--min-dokunma\)/.test(HTML) && !/\.agacTasiBtn/.test(HTML));
  ok("§5 satır ≥26px + GÖNDER 40px AYNEN (FAZ-K ölçek değişikliği YOK)", /\.agacAjan\s*\{[^}]*min-height:\s*32px/.test(HTML) && /#composerGonder\s*\{[^}]*min-height:\s*40px/.test(HTML));
  /* --- (5) veri katmanı AYNEN (kisaltma yalnız UI'da — server.js/ordu-birlesim.mjs hunk 0) --- */
  ok("veri katmanı AYNEN: projeEtiketi yardımcısı + 1 tanım + 5 kullanım = 6 eşleşme (ağaç + konuşma seçimi + chat + composer + FAZ-O EK-2 oturum kartı) + fetch/POST sayıları değişmedi", j.includes("function projeEtiketi(pr)") && (j.match(/projeEtiketi\(pr\)/g) || []).length === 6 && j.includes('"/api/mesaj"') && j.includes("const CHAT_TAVAN = 200"));
  ok("YENİ @keyframes/renk/sembol YOK (nabız 1 aynen — E12)", (HTML.match(/@keyframes/g) || []).length <= 2 && !/--yeni-(renk|token)/.test(h));
});

test("51p- PANEL-ANA-1 FAZ-M: konusma-oku.mjs SAF FONKSİYONLAR — slugYap (Claude projects slug: her özel karakter AYRI tire — koordinatör canlı ölçümü 2026-11-03 D--Vibecode-ordu; Paseo ORDU_DIZIN_ADI FARKLI kuraldır) + kuyrukOku (TAM DOSYA ASLA: yarım satır ATILIR / küçük dosya TAMAMI / kuyruksuz tek satır boş / boş satır filtresi / UTF-8) + satirdanBalon (yalnız konuşma text blokları; thinking/tool_use/tool_result GİRMEZ) + balonTavan (dürüst kesildi işareti) + transcriptHazirla (kronoloji + son 30 + tavan) — kullanıcı spec'i «sol tarafta proje altında hangi oturuma tıklarsak onun yazışmaları chat ekranına yüklenecek»", () => {
  const G = mkdtempSync(join(tmpdir(), "51p-"));
  try {
    /* --- (1) slugYap: cwd → Claude projects slug (karakter-başına tire) --- */
    assert.equal(slugYap("D:\\Vibecode\\ordu"), "D--Vibecode-ordu", "slug: GERÇEK dizin biçimi (diskte VAR — Test-Path True; ':' bir tire, '\\' ayrı bir tire)");
    assert.equal(slugYap("D:/Vibecode/ordu"), "D--Vibecode-ordu", "slug: düz bölümlü cwd aynı çıktı ('/' da ayrı tire)");
    assert.equal(slugYap("C:\\a\\b\\c"), "C--a-b-c", "slug: sürücü iki noktası + ilk ayraç → çift tire");
    assert.equal(slugYap("C:\\Users\\g\\.local"), "C--Users-g--local", "slug: NOKTA da tire (diskteki 'C--Users-gatep--local-share-...' biçimi)");
    assert.equal(slugYap("a b"), "a-b", "slug: boşluk → tire");
    assert.equal(slugYap("d:\\V"), "d--V", "slug: küçük harf KORUNUR (harf katlaması YOK — diskte 'd--Vibecode' var)");
    assert.notEqual(slugYap("D:\\Vibecode\\ordu"), "D-Vibecode-ordu", "slug: TEK tireli eski biçim YANLIŞ (diskte YOK — Test-Path False)");
    /* --- (2) kuyrukOku: tail-read --- */
    const t1 = join(G, "t1.jsonl");
    writeFileSync(t1, "A".repeat(20) + "\nsatir1\nsatir2\nsatir3"); // 41 bayt
    // son 11 bayt = "tir2\nsatir3" — ilk satır YARIM → ATILIR, kalan TAM satırlar
    assert.deepEqual(kuyrukOkuFn(t1, 11), ["satir3"], "kuyruk: tail ortasındaki YARIM satır atılır (ilk TAM satırdan başlar)");
    assert.deepEqual(kuyrukOkuFn(t1, 512 * 1024), ["A".repeat(20), "satir1", "satir2", "satir3"], "kuyruk: küçük dosya TAMAMI okunur (yarım satır mantığı devreye girmez)");
    const t2 = join(G, "t2.jsonl");
    writeFileSync(t2, "x".repeat(50)); // kuyrukta yeni satır YOK → tamamı yarım → boş
    assert.deepEqual(kuyrukOkuFn(t2, 10), [], "kuyruk: tail'in tamamı tek yarım satır → boş (uydurma satır YOK)");
    const t3 = join(G, "t3.jsonl");
    writeFileSync(t3, "merhaba dünya\n\nikinci satır ğüşiöç\n");
    assert.deepEqual(kuyrukOkuFn(t3), ["merhaba dünya", "ikinci satır ğüşiöç"], "kuyruk: boş satır atılır + UTF-8 Türkçe bütünlük");
    /* --- (3) satirdanBalon: yalnız KONUŞMA satırları --- */
    assert.deepEqual(
      satirdanBalon(JSON.stringify({ type: "user", message: { role: "user", content: "merhaba ajan" } })),
      { rol: "user", metin: "merhaba ajan" },
      "satır: user string content → balon");
    const asst = satirdanBalon(JSON.stringify({ type: "assistant", message: { role: "assistant", content: [
      { type: "thinking", thinking: "gizli düşünce" },
      { type: "text", text: "birinci parça" },
      { type: "tool_use", name: "bash", input: { command: "ls" } },
      { type: "text", text: "ikinci parça" },
    ] } }));
    assert.deepEqual(asst, { rol: "assistant", metin: "birinci parça\nikinci parça" }, "satır: assistant blok dizisi → YALNIZ text blokları (thinking/tool_use GİRMEZ)");
    assert.equal(satirdanBalon(JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "tool_result", content: "çıktı" }] } })), null, "satır: yalnız tool_result → null (balon değil)");
    assert.equal(satirdanBalon(JSON.stringify({ type: "api-request", mesaj: "başka kayıt" })), null, "satır: api-request → null");
    assert.equal(satirdanBalon(JSON.stringify({ type: "mode", mode: "auto" })), null, "satır: mode → null");
    assert.equal(satirdanBalon("bozuk json {{{"), null, "satır: bozuk JSON → null (atlanır)");
    assert.equal(satirdanBalon(JSON.stringify({ type: "user", message: { role: "user", content: "   " } })), null, "satır: boş metin → null");
    /* --- (4) balonTavan: dürüst kesildi --- */
    assert.deepEqual(balonTavan("kısa metin"), { metin: "kısa metin", kesildi: false }, "tavan: kısa metin AYNEN");
    const uzun = balonTavan("x".repeat(2500));
    assert.equal(uzun.metin.length, 2000, "tavan: 2500 → 2000 karakter");
    assert.equal(uzun.kesildi, true, "tavan: kesildi işareti DÜRÜST");
    assert.deepEqual(balonTavan("1234567890", 5), { metin: "12345", kesildi: true }, "tavan: özel eşik parametresi");
    /* --- (5) transcriptHazirla: filtre + kronoloji + son 30 + tavan --- */
    const satirlar = [];
    for (let i = 1; i <= 35; i++) satirlar.push(JSON.stringify({ type: "user", message: { role: "user", content: "m" + i } }));
    const tH = transcriptHazirla(satirlar);
    assert.equal(tH.length, 30, "hazırla: son 30 balon (36. satır düşmez — TUR_TAVAN)");
    assert.equal(tH[0].metin, "m6", "hazırla: en eski kalan m6");
    assert.equal(tH[29].metin, "m35", "hazırla: en yeni m35");
    assert.equal(tH[0].kesildi, false, "hazırla: kısa metin kesilmedi");
    assert.equal(transcriptHazirla(satirlar, { turTavani: 3 })[0].metin, "m33", "hazırla: özel turTavani seçeneği");
    const karisik = [
      JSON.stringify({ type: "api-request", mesaj: "yok" }),
      JSON.stringify({ type: "user", message: { role: "user", content: "soru" } }),
      "bozuk satır",
      JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "y".repeat(2500) }] } }),
    ];
    const tK = transcriptHazirla(karisik);
    assert.equal(tK.length, 2, "hazırla: konuşma OLMAYAN satırlar filtrelenir (kronoloji korunur)");
    assert.deepEqual(tK[0], { rol: "user", metin: "soru", kesildi: false }, "hazırla: sıra korunur (user önce)");
    assert.equal(tK[1].metin.length, 2000, "hazırla: uzun metin tavanlanır");
    assert.equal(tK[1].kesildi, true, "hazırla: kesildi işareti taşınır");
    assert.deepEqual(transcriptHazirla([]), [], "hazırla: boş girdi → boş dizi (dürüst — sahte içerik YASAK E10)");
    assert.deepEqual(transcriptHazirla(["bozuk", JSON.stringify({ type: "file" })]), [], "hazırla: konuşma satırı hiç yok → boş dizi");
  } finally { try { rmSync(G, { recursive: true, force: true }); } catch { /* Windows gecikmeli silme */ } }
});

test("51q- PANEL-ANA-1 FAZ-M: server GET /api/ordu/konusma HERMETİK (gerçek çocuk süreç — d1a deseni; PASEO_EV + PANO_CLAUDE_EV izole fixture) — 200 + balonlar (düşünce/aracı GİRMEZ) + 400 geçersiz kimlik + 404 dürüst (bilinmeyen ajan / sessionId yok / transcript dosyası yok) + GET salt-okur (token başlığı YOK) + kayıttaki systemPrompt YANITA GİRMEZ", async () => {
  const G = mkdtempSync(join(tmpdir(), "51q-"));
  const cocuklar = [];
  const AJAN = "5f482ae0-1111-4111-8111-111111111111";
  const AJAN2 = "99999999-8888-4888-8888-888888888888"; // sessionId YOK
  const AJAN3 = "77777777-6666-4666-8666-666666666666"; // transcript dosyası YOK
  const AJAN_YOK = "aaaaaaaa-bbbb-4bbb-8bbb-cccccccccccc";
  const OTURUM = "42c288f7-2222-4222-8222-222222222222";
  const OTURUM2 = "12345678-1234-4123-8123-123456789012";
  try {
    /* PASEO_EV fixture: agents/D-Test-p1/<id>.json (projelerTara id ister) */
    mkdirSync(join(G, "paseo", "agents", "D-Test-p1"), { recursive: true });
    writeFileSync(join(G, "paseo", "agents", "D-Test-p1", AJAN + ".json"), JSON.stringify({
      id: AJAN, cwd: "D:\\Test\\p1", lastStatus: "idle", title: "fixture ajan", provider: "glm53u-claude/glm-5.3",
      persistence: { sessionId: OTURUM },
      systemPrompt: "SYSTEM_PROMPT_SIR_MARKER — bu sır yalnız kayıtta, YANITA GİRMEZ",
    }));
    writeFileSync(join(G, "paseo", "agents", "D-Test-p1", AJAN2 + ".json"), JSON.stringify({ id: AJAN2, cwd: "D:\\Test\\p1", lastStatus: "idle" }));
    writeFileSync(join(G, "paseo", "agents", "D-Test-p1", AJAN3 + ".json"), JSON.stringify({ id: AJAN3, cwd: "D:\\Test\\p1", persistence: { sessionId: OTURUM2 } }));
    /* PANO_CLAUDE_EV fixture: projects/<slug>/<sessionId>.jsonl — slug GERÇEK biçim:
       çift tire ('D--Test-p1' — koordinatör disk ölçümü: her özel karakter AYRI tire;
       Paseo agents dizini 'D-Test-p1' tek tire FARKLI kuraldır, AYNEN kalır) */
    assert.equal(slugYap("D:\\Test\\p1"), "D--Test-p1", "gerçek-şekil pini: slugYap(cwd) çıktısı LİTERAL 'D--Test-p1' (self-referans tuzağına gerçek pini — disk biçimi)");
    const jsonl = [
      JSON.stringify({ type: "user", message: { role: "user", content: "fixture kullanıcı mesajı <b>x</b>" } }),
      JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "thinking", thinking: "gizli düşünce" }, { type: "text", text: "fixture ajan yanıtı" }] } }),
      JSON.stringify({ type: "api-request", mesaj: "başka kayıt" }),
      JSON.stringify({ type: "mode", mode: "auto" }),
      JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "tool_use", name: "bash" }] } }),
    ].join("\n") + "\n";
    mkdirSync(join(G, "claude", "projects", "D--Test-p1"), { recursive: true });
    writeFileSync(join(G, "claude", "projects", "D--Test-p1", OTURUM + ".jsonl"), jsonl);
    /* sunucu (izole env — 4937'ye DOKUNULMAZ) */
    const sunucuBaslat = (env) => {
      const c = spawn(process.execPath, ["server.js"], { cwd: KOK, env: { ...process.env, ...env } });
      cocuklar.push(c);
      return new Promise((res, rej) => {
        const zamanAsimi = setTimeout(() => rej(new Error("sunucu 5 sn icinde port bildirmedi")), 5000);
        c.stdout.on("data", (d) => {
          const m = String(d).match(/127\.0\.0\.1:(\d+)/);
          if (m) { clearTimeout(zamanAsimi); res(Number(m[1])); }
        });
        c.stderr.on("data", (d) => process.stderr.write(d));
      });
    };
    const port = await sunucuBaslat({
      PANO_PORT: "0", PASEO_EV: join(G, "paseo"), PANO_CLAUDE_EV: join(G, "claude"),
      PANO_KOKLER: G, ORDU_GRAF_JSON: join(G, "yok.json"),
    });
    const base = "http://127.0.0.1:" + port + "/api/ordu/konusma?ajan=";
    /* (1) 200: transcript çözülür + yalnız konuşma satırları + ölçüm anı + sır GİRMEZ */
    const r1 = await fetch(base + AJAN); // başlık YOK — GET salt-okur
    assert.equal(r1.status, 200, "200: GET salt-okur (token başlığı istenmez — PANO_TOKEN yalnız POST kapısı)");
    const j1 = await r1.json();
    assert.deepEqual(j1.balonlar, [
      { rol: "user", metin: "fixture kullanıcı mesajı <b>x</b>", kesildi: false },
      { rol: "assistant", metin: "fixture ajan yanıtı", kesildi: false },
    ], "200: yalnız KONUŞMA balonları (api-request/mode/tool_use DÜŞER)");
    assert.equal(j1.ajan, AJAN, "200: ajan kimliği aynen");
    assert.equal(j1.oturumId, OTURUM, "200: oturum kimliği kayıttan çözülür");
    assert.equal(j1.dosyaBoyutBayt, Buffer.byteLength(jsonl), "200: dosya boyutu BAYT cinsinden ölçülür");
    assert.ok(j1.okumaNotu.includes("TAM DOSYA asla yüklenmez"), "200: dürüst okuma notu (tail-read sınırları)");
    assert.ok(typeof j1.olcumAniISO === "string" && j1.olcumAniISO.endsWith("Z"), "200: ölçüm anı etiketi (snapshot'ı canlı gösterme kuralı)");
    const govde = JSON.stringify(j1);
    assert.ok(!govde.includes("SYSTEM_PROMPT_SIR_MARKER"), "200: kayıttaki systemPrompt YANITA GİRMEZ (sır)");
    assert.ok(!govde.includes("gizli düşünce"), "200: thinking bloğu balona GİRMEZ");
    /* (2) 400: geçersiz kimlik */
    const r2 = await fetch(base + "abc");
    assert.equal(r2.status, 400, "400: geçersiz kimlik");
    assert.ok((await r2.json()).hata.includes("gecersiz ajan kimligi"), "400: dürüst hata metni");
    /* (3) 404: bilinmeyen ajan (disk taramasında yok) */
    const r3 = await fetch(base + AJAN_YOK);
    assert.equal(r3.status, 404, "404: bilinmeyen ajan");
    assert.ok((await r3.json()).hata.includes("ajan disk taramasında yok"), "404: dürüst — sahte içerik YASAK (E10)");
    /* (4) 404: persistence.sessionId yok */
    const r4 = await fetch(base + AJAN2);
    assert.equal(r4.status, 404, "404: sessionId çözülemez");
    assert.ok((await r4.json()).hata.includes("persistence.sessionId"), "404: dürüst neden metni");
    /* (5) 404: transcript dosyası yok */
    const r5 = await fetch(base + AJAN3);
    const j5 = await r5.json();
    assert.equal(r5.status, 404, "404: transcript dosyası yok");
    assert.ok(!("balonlar" in j5), "404: balonlar alanı YOK (uydurma boş dizi bile yazılmaz)");
    assert.ok(j5.hata.includes("oturum transcript dosyası yok"), "404: dürüst dosya-yok metni (E10)");
  } finally {
    for (const c of cocuklar) { try { c.kill("SIGKILL"); } catch { /* zaten çıkmış */ } }
    try { rmSync(G, { recursive: true, force: true }); } catch { /* Windows gecikmeli silme */ }
  }
});

test("51r- PANEL-ANA-1 FAZ-M (kaynak-pin + vm): ağaçta oturuma TIKLA → transcript chat'e yüklenir (transcriptYukle + transcriptBalonHtml: kullanıcı SAĞ balon / ajan YANITI SOL chat-sistem / saat YOK / esc / kesildi işareti) + chatMesajYaz bileşik (transcript ÜSTTE + panel gönderimleri altta) + açılışta YALNIZ bir kez + composer İKİ TÜR AJAN (ORDU YÖNETİM (sistem) + SEÇİLİ PROJENİN OTURUM AJANLARI — labels.rol tespiti YOK)", async () => {
  const j = jsKisim();
  /* --- (1) kaynak pinleri --- */
  ok("fetch: GET /api/ordu/konusma?ajan= + encodeURIComponent(TAM kimlik)", j.includes('"/api/ordu/konusma?ajan=" + encodeURIComponent(ajanKimligi)'));
  ok("fonksiyonlar: async transcriptYukle + transcriptBalonHtml (yeni özellik = ince kanca — composer POST aynen)", j.includes("async function transcriptYukle(") && j.includes("function transcriptBalonHtml("));
  ok("state: transcriptBalonlar/transcriptHata null + transcriptAcilisIstendi kilidi (null=yüklenmedi, []=dürüst boş)", j.includes("let transcriptBalonlar = null") && j.includes("let transcriptHata = null") && j.includes("let transcriptAcilisIstendi = false"));
  ok("ağaç tıklaması: konusmaSecGuncelle(true) ardından transcriptYukle(agacSecili) — oturuma tıkla → yazışmalar yüklenir + composer hedefi O AJANA döner", j.includes("konusmaSecGuncelle(true)") && j.includes("transcriptYukle(agacSecili)"));
  ok("açılış: kalıcı seçim YALNIZ bir kez yükler (transcriptAcilisIstendi = true — 30sn yenileme döngüsü tekrar fetch ETMEZ)", j.includes("transcriptAcilisIstendi = true"));
  ok("composer İKİ TÜR AJAN: ORDU YÖNETİM (sistem) + SEÇİLİ PROJENİN OTURUM AJANLARI (labels.rol'da MANAGER tespiti YOK — koordinatör ölçümü: 1058 kayıtta 14 etiket, 'manager' YOK; uydurma tespit YASAK)", j.includes('<optgroup label="ORDU YÖNETİM (sistem)">') && j.includes('<optgroup label="SEÇİLİ PROJENİN OTURUM AJANLARI: ') && !j.includes("labels.rol"));
  ok("CSS: .chatMesaj.chat-sistem SOL ince balon (align-self:flex-start — ajan yanıtı) + .chatKesildi dürüst işaret satırı", /\.chatMesaj\.chat-sistem\s*\{[^}]*align-self:\s*flex-start/.test(HTML) && /\.chatKesildi\s*\{[^}]*font-style:\s*italic/.test(HTML));
  ok("yükleniyor dürüst satırı + hata notu seçimi korur (kırmızı yüz çatışı YOK — mesaj gönderilebilir)", j.includes('<p class="bosSatir">yazışmalar yükleniyor…</p>') && j.includes('transcriptHata = "yazışmalar yüklenemedi — "'));
  ok("chatMesajYaz bileşik: transcriptHtml + oturumHtml (transcript ÜSTTE — kronoloji; panel gönderimleri altta devam eder)", j.includes("liste.innerHTML = transcriptHtml + oturumHtml"));
  ok("dürüst boş: 'konuşma satırı yok (son bölüm okundu)' — sahte içerik YASAK (E10)", j.includes('"oturumun yazışmalarında konuşma satırı yok (son bölüm okundu — dürüst boş)"'));
  /* --- (2) vm: chatMesajHtml + chatMesajYaz + transcriptBalonHtml + transcriptYukle --- */
  const dilimA = HTML.indexOf("function chatMesajHtml(");
  const dilimB = HTML.indexOf('$("composerForm").addEventListener');
  ok("FAZ-M vm dilimi yerinde (chatMesajHtml … composerForm dinleyicisi)", dilimA >= 0 && dilimB > dilimA);
  const K = "8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7";
  const R = "11111111-2222-4333-8333-444444444444";
  const sahte = {};
  const $r = (id) => (sahte[id] = sahte[id] || { innerHTML: "", textContent: "", hidden: true, value: "", scrollTop: 0, scrollHeight: 99 });
  const cagrilar = [];
  let anlikListe = "";
  let cekDavranis = async () => ({ balonlar: [] });
  const cek = async (yol) => { anlikListe = String($r("chatListe").innerHTML); cagrilar.push(yol); return cekDavranis(yol); };
  const ctx = {
    $: $r, esc: fnAl("esc"), kisaIdGoster: fnAl("kisaIdGoster"),
    seciliKonusma: { ajan: { ajanKimligi: K, ajanId: "kurmay", etiket: "KURMAY-1" } },
    oturumMesajlari: [], transcriptBalonlar: null, transcriptHata: null,
    cek,
  };
  const fns = vm.runInNewContext(HTML.slice(dilimA, dilimB) + "\n[chatMesajHtml, chatMesajYaz, transcriptBalonHtml, transcriptYukle]", ctx);
  /* (2a) transcriptBalonHtml: kullanıcı SAĞ / ajan SOL / esc / saat YOK / kesildi */
  const bu1 = fns[2]({ rol: "user", metin: "merhaba <b>agent</b>" });
  ok("vm balon: kullanıcı mesajı SAĞ balon (chat-kullanici) + 'kullanıcı' etiketi + esc", bu1.includes('chatMesaj chat-kullanici') && bu1.includes(">kullanıcı<") && bu1.includes("&lt;b&gt;agent&lt;/b&gt;") && !bu1.includes("<b>"));
  const bu2 = fns[2]({ rol: "assistant", metin: "yanıt metni" });
  ok("vm balon: ajan yanıtı SOL ince balon (chat-sistem) + title TAM kimlik + seçili konuşmanın kısa adı", bu2.includes("chatMesaj chat-sistem") && bu2.includes('title="' + K + '"') && bu2.includes(">kurmay<"));
  ok("vm balon: transcript balonlarında saat YOK (uydurma saat YAZILMAZ — E10; gönderim balonunda gerçek saat var)", !fns[2]({ rol: "user", metin: "x" }).includes("chatSaat") && !fns[2]({ rol: "assistant", metin: "x" }).includes("chatSaat"));
  const bu3 = fns[2]({ rol: "assistant", metin: "x".repeat(300), kesildi: true });
  ok("vm balon: kesildi → dürüst işaret satırı (TAM metin sunucudaki dosyada kalır)", bu3.includes('class="chatKesildi"') && bu3.includes("TAM metin sunucudaki transcript dosyasında kalır"));
  /* (2b) transcriptYukle: başarı → balonlar dolar + panel gönderimi ALTTA kalır */
  ctx.oturumMesajlari.push({ saat: "12:00", hedefKisa: "kurmay", hedefKimlik: K, metin: "panel mesajı <i>", sonuc: { tur: "basarili", metin: "" } });
  cekDavranis = async () => ({ balonlar: [
    { rol: "user", metin: "transcript sorusu <script>alert(1)</script>" },
    { rol: "assistant", metin: "y".repeat(300), kesildi: true },
  ] });
  await fns[3](R);
  ok("vm yükleme: fetch /api/ordu/konusma?ajan=<TAM kimlik>", cagrilar.length === 1 && cagrilar[0] === "/api/ordu/konusma?ajan=" + R);
  ok("vm yükleme: beklerken dürüst 'yazışmalar yüklenıyor…' satırı (cesur boş YOK)", anlikListe.includes("yazışmalar yükleniyor…"));
  const h = $r("chatListe").innerHTML;
  ok("vm yükleme: transcript balonları render (kullanıcı SAĞ + ajan SOL + kesildi işareti)", h.includes("chatMesaj chat-kullanici") && h.includes("chatMesaj chat-sistem") && h.includes("chatKesildi"));
  ok("vm yükleme: XSS — transcript metni esc'ten geçer (dış içerik)", h.includes("&lt;script&gt;alert(1)&lt;/script&gt;") && !h.includes("<script>alert"));
  ok("vm yükleme: transcript ÜSTTE + panel gönderimi ALTTA (kronoloji bileşik)", h.indexOf("transcript sorusu") < h.indexOf("panel mesajı") && h.indexOf("panel mesajı") > -1);
  ok("vm yükleme: boş-durum satırı gizlenir (içerik var)", $r("chatBos").hidden === true);
  ok("vm yükleme: transcriptBalonlar ctx'e yazılır (sonraki chatMesajYaz çağrıları aynı akışı korur)", Array.isArray(ctx.transcriptBalonlar) && ctx.transcriptBalonlar.length === 2);
  /* (2c) hata: dürüst not — seçim KALIR, mesaj gönderilebilir */
  ctx.oturumMesajlari.length = 0;
  cekDavranis = async () => { throw new Error("boom"); };
  await fns[3](R);
  ok("vm hata: transcriptHata dürüst not (neden + seçim kalır — kırmızı yüz YOK)", String(ctx.transcriptHata).includes("yazışmalar yüklenemedi — boom") && String(ctx.transcriptHata).includes("oturum seçili kaldı"));
  ok("vm hata: chatBos kapısında not görünür (liste boş — uydurma balon YOK)", $r("chatBos").hidden === false && $r("chatBos").textContent.includes("yazışmalar yüklenemedi") && $r("chatListe").innerHTML === "");
  /* (2d) dürüst boş: balonlar [] → 'konuşma satırı yok' (sahte içerik YASAK) */
  cekDavranis = async () => ({ balonlar: [] });
  await fns[3](R);
  ok("vm boş: yüklendi + boş → dürüst boş metni (son bölüm okundu)", Array.isArray(ctx.transcriptBalonlar) && ctx.transcriptBalonlar.length === 0 && $r("chatBos").textContent.includes("konuşma satırı yok") && $r("chatListe").innerHTML === "");
  /* (2e) koruma: boş kimlik → fetch ATILMAZ */
  const cagrilarOnce = cagrilar.length;
  await fns[3]("");
  ok("vm koruma: boş kimlikte istek ATILMAZ (fail-closed — sahte transcript YOK)", cagrilar.length === cagrilarOnce);
  /* --- (3) veri katmanı AYNEN: POST /api/mesaj + CHAT_TAVAN + transcript YALNIZ GET (salt-okur) --- */
  ok("veri katmanı AYNEN: POST /api/mesaj + CHAT_TAVAN 200 — composer gönderim akışı değişmedi; transcript fetch TEK cek() çağrısı ve salt-okur (method seçeneği YOK — 'konusma?ajan=' diziye göre 2'dir: 1 çağrı + 1 yorum, mekanizma sayısı 1)", j.includes('"/api/mesaj"') && j.includes("const CHAT_TAVAN = 200") && (j.match(/cek\("\/api\/ordu\/konusma\?ajan="/g) || []).length === 1 && !/konusma\?ajan=[\s\S]{0,60}method/.test(j));
});

test("51s- PANEL-ANA-1 FAZ-N (kaynak-pin + vm): ağaç ÖLÜ OTURUM FİLTRESİ — klasör altında YALNIZ SON 3 oturum satırı (sonEtkinlikISO en yeni 3; eksik ISO en eski, eşitlikte kimlikle deterministik) + running/error HER ZAMAN görünür (birleşim, mükerrer yok) + başlık sayısı TOPLAM kayıt DÜRÜST KALIR ('+K eski' YOK) + gizli seçim KORUNUR — kullanıcı onayı 2026-11-04 «bu şekilde yap» + «son 2 yada 3 sekme yeterli özellikle aktif sekme gösterilmeli»", () => {
  const j = jsKisim();
  /* --- (1) kaynak pinleri --- */
  ok("filtre fonksiyonu tanımlı: agacGorunurAjanlar (yeni özellik = ince kanca — render'da çağrılır)", j.includes("function agacGorunurAjanlar("));
  ok("render çağrısı: agacGorunurAjanlar(ajanlar).map(ajanDugumHtml) — satır listesi süzülür", j.includes("agacGorunurAjanlar(ajanlar).map((a) => ajanDugumHtml(a, pr))"));
  ok("başlık sayısı TOPLAM kayıt AYNEN: ajanlar.length (gizlenenler dahil — sahte gizleme YOK E10; FAZ-Q: tamTitle sabiti çift tırnaklı literal)", j.includes('ajanlar.length + " ajan kaydı"'));
  ok("'+K eski' satırı MEKANİZMA YOK (agacEski sınıfı/id'si yok — minimal; yorumdaki kelime dokümantasyondur)", !j.includes("agacEski"));
  const filtreGovde = HTML.slice(HTML.indexOf("function agacGorunurAjanlar("), HTML.indexOf("function agacYaz("));
  ok("filtre agacSecili'ye DOKUNMAZ (gizli satıra denk gelen kalıcı seçim KORUNUR — davranış dürüst)", filtreGovde.includes("function agacGorunurAjanlar(") && !filtreGovde.includes("agacSecili"));
  ok("son 3 eşiği + running/error birleşim koşulu kaynakta", filtreGovde.includes("slice(0, 3)") && filtreGovde.includes('lastStatus === "running"') && filtreGovde.includes('lastStatus === "error"'));
  /* --- (2) vm: 6 kayıtlı fixture — son 3 + running + error görünür, eski idle GİZLİ --- */
  const A1 = "11111111-1111-4111-8111-111111111111"; // idle · 2026-01-01 — YALNIZ eski → GİZLİ
  const A2 = "22222222-2222-4222-8222-222222222222"; // idle · 2026-11-04 — en yeni → GÖRÜNÜR
  const A3 = "33333333-3333-4333-8333-333333333333"; // idle · 2026-11-03 → GÖRÜNÜR
  const A4 = "44444444-4444-4444-8444-444444444444"; // idle · 2026-06-01 → GÖRÜNÜR
  const A5 = "55555555-5555-4555-8555-555555555555"; // running · 2025-01-01 EN ESKİ → GÖRÜNÜR (yaşa bakılmaksızın)
  const A6 = "66666666-6666-4666-8666-666666666666"; // error · 2024-01-01 → GÖRÜNÜR
  const agacA = HTML.indexOf("function ajanDugumHtml(");
  const agacB = HTML.indexOf('$("agacAlani").addEventListener');
  ok("FAZ-N vm dilimi yerinde (ajanDugumHtml … agacAlani dinleyicisi — filtre + agacYaz dahil)", agacA >= 0 && agacB > agacA);
  const dilim = HTML.slice(agacA, agacB);
  const kos = (P, agacAcik, agacSecili) => {
    const sahte = {};
    const $s = (id) => (sahte[id] = sahte[id] || { innerHTML: "", textContent: "", hidden: true });
    const ctx = {
      $: $s, esc: fnAl("esc"), kisaIdGoster: fnAl("kisaIdGoster"), projeEtiketi: fnAl("projeEtiketi"),
      P, agacAcik, agacSecili, NOKTA_SINIF: { running: "yesil", idle: "gri", error: "kirmizi", closed: "kapali" },
    };
    vm.runInNewContext(dilim + "\nagacYaz", ctx)();
    return { html: sahte.agacAlani.innerHTML, ctx };
  };
  const r1 = kos({ olcumAniISO: "2026-11-04T00:00:00Z", projeler: [
    { dizin: "P-alfa", projeAdi: "P-alfa", orduMu: false, ajanlar: [
      { ajanKimligi: A1, ajanId: "11111111", lastStatus: "idle", sonEtkinlikISO: "2026-01-01T00:00:00Z", etiket: "eski idle" },
      { ajanKimligi: A2, ajanId: "22222222", lastStatus: "idle", sonEtkinlikISO: "2026-11-04T00:00:00Z", etiket: "en yeni" },
      { ajanKimligi: A3, ajanId: "33333333", lastStatus: "idle", sonEtkinlikISO: "2026-11-03T00:00:00Z", etiket: "yeni2" },
      { ajanKimligi: A4, ajanId: "44444444", lastStatus: "idle", sonEtkinlikISO: "2026-06-01T00:00:00Z", etiket: "yeni3" },
      { ajanKimligi: A5, ajanId: "55555555", lastStatus: "running", sonEtkinlikISO: "2025-01-01T00:00:00Z", etiket: "eski ama CALISIYOR" },
      { ajanKimligi: A6, ajanId: "66666666", lastStatus: "error", sonEtkinlikISO: "2024-01-01T00:00:00Z", etiket: "eski hata" },
    ] },
  ] }, new Set(["P-alfa"]), null);
  ok("vm 6 kayıt: 5 satır görünür (son 3 + running + error — birleşim)", (r1.html.match(/class="agacAjan"/g) || []).length === 5);
  ok("vm: eski idle (A1) satırı YOK — yalnız son 3 + aktif/hata", !r1.html.includes('data-ajan="' + A1 + '"') && [A2, A3, A4, A5, A6].every((k) => r1.html.includes('data-ajan="' + k + '"')));
  ok("vm: başlık sayısı DÜRÜST TOPLAM: 'P-alfa — 1 çalışan · 6 ajan kaydı' (gizlenen A1 dahil; '+ eski' satırı YOK)", r1.html.includes('title="P-alfa — 1 çalışan · 6 ajan kaydı"') && !r1.html.includes("agacEski"));
  ok("vm: görüntü sırası disk-tarama sırası KORUNUR (A1 atlandı ama diğerleri girdi sırasında: A2 < A3 < A4 < A5 < A6)", [r1.html.indexOf('data-ajan="' + A2), r1.html.indexOf('data-ajan="' + A3), r1.html.indexOf('data-ajan="' + A4), r1.html.indexOf('data-ajan="' + A5), r1.html.indexOf('data-ajan="' + A6)].every((v, i, d) => v >= 0 && (i === 0 || d[i - 1] < v)));
  /* --- (3) vm: gizli seçim KORUNUR — satır görünmez, agacSecili değişmez --- */
  const r2 = kos({ projeler: [
    { dizin: "P-alfa", projeAdi: "P-alfa", orduMu: false, ajanlar: [
      { ajanKimligi: A1, ajanId: "11111111", lastStatus: "idle", sonEtkinlikISO: "2026-01-01T00:00:00Z", etiket: "eski idle" },
      { ajanKimligi: A2, ajanId: "22222222", lastStatus: "idle", sonEtkinlikISO: "2026-11-04T00:00:00Z", etiket: "en yeni" },
      { ajanKimligi: A3, ajanId: "33333333", lastStatus: "idle", sonEtkinlikISO: "2026-11-03T00:00:00Z", etiket: "yeni2" },
      { ajanKimligi: A4, ajanId: "44444444", lastStatus: "idle", sonEtkinlikISO: "2026-06-01T00:00:00Z", etiket: "yeni3" },
    ] },
  ] }, new Set(["P-alfa"]), A1); /* seçim GİZLİ satırda */
  ok("vm gizli seçim: A1 satırı görünmez AMA agacSecili KORUNUR (render seçimi silmez — dürüst; seçim kompozisyonunu sürdürür)", !r2.html.includes('data-ajan="' + A1 + '"') && r2.ctx.agacSecili === A1);
  ok("vm gizli seçim: 'secili' sınıfı hiçbir görünür satıra basılmaz (satır yok — uydurma seçim YOK)", !r2.html.includes("agacAjan secili"));
  /* --- (4) vm: mükerrer YOK — running VE en yeni aynı ajan bir kez render --- */
  const X = "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx";
  const r3 = kos({ projeler: [
    { dizin: "P-beta", projeAdi: "P-beta", orduMu: false, ajanlar: [
      { ajanKimligi: X, ajanId: "xxxxxxxx", lastStatus: "running", sonEtkinlikISO: "2026-11-04T00:00:00Z", etiket: "aktif ve en yeni" },
      { ajanKimligi: A2, ajanId: "22222222", lastStatus: "idle", sonEtkinlikISO: "2026-11-03T00:00:00Z", etiket: "yeni2" },
      { ajanKimligi: A3, ajanId: "33333333", lastStatus: "idle", sonEtkinlikISO: "2026-11-02T00:00:00Z", etiket: "yeni3" },
    ] },
  ] }, new Set(["P-beta"]), null);
  ok("vm birleşim: running + top-3 aynı ajanda TEK satır (mükerrer YOK — Set birleşimi)", (r3.html.match(/class="agacAjan"/g) || []).length === 3 && (r3.html.match(new RegExp('data-ajan="' + X + '"', "g")) || []).length === 1);
  /* --- (5) vm: eksik sonEtkinlikISO en eski + eşitlikte kimlikle DETERMİNİSTİK --- */
  const K1 = "aaaa0000-0000-4000-8000-000000000001";
  const K2 = "bbbb0000-0000-4000-8000-000000000002";
  const K3 = "cccc0000-0000-4000-8000-000000000003";
  const K4 = "dddd0000-0000-4000-8000-000000000004";
  const r4 = kos({ projeler: [
    { dizin: "P-gama", projeAdi: "P-gama", orduMu: false, ajanlar: [
      { ajanKimligi: K1, ajanId: "aaaa0000", lastStatus: "idle", sonEtkinlikISO: null, etiket: "iso yok 1" },
      { ajanKimligi: K2, ajanId: "bbbb0000", lastStatus: "idle", sonEtkinlikISO: null, etiket: "iso yok 2" },
      { ajanKimligi: K3, ajanId: "cccc0000", lastStatus: "idle", sonEtkinlikISO: "bozuk-iso", etiket: "iso bozuk" },
      { ajanKimligi: K4, ajanId: "dddd0000", lastStatus: "idle", sonEtkinlikISO: null, etiket: "iso yok 4" },
    ] },
  ] }, new Set(["P-gama"]), null);
  ok("vm deterministik: 4 eksik/bozuk ISO → kimlik sırasıyla en yeni 3 (K4,K3,K2) görünür, K1 (en küçük kimlik) gizli", (r4.html.match(/class="agacAjan"/g) || []).length === 3 && [K4, K3, K2].every((k) => r4.html.includes('data-ajan="' + k + '"')) && !r4.html.includes('data-ajan="' + K1 + '"'));
  /* --- (6) korunum: FAZ-N CSS/etiket/kimlik yollarına DOKUNULMADI --- */
  ok("korunum: ajanDugumHtml kimlik yolu AYNEN (data-ajan TAM kimlik + data-proje TAM dizin — FAZ-K mirası; filtre yalnız görünürlüğe karar verir)", j.includes('esc(a.ajanKimligi)') && j.includes('esc(pr.dizin)') && j.includes('" data-ajan="'));
  ok("korunum: min-height 32 ailesi + coarse 44 + GÖNDER 40 AYNEN (K-0061 — FAZ-N ölçek değişikliği YOK)", /\.agacAjan\s*\{[^}]*min-height:\s*32px/.test(HTML) && /#composerGonder\s*\{[^}]*min-height:\s*40px/.test(HTML));
  ok("korunum: akordiyon/tıklama/seçim mekanizması AYNEN (agacAcik + agacSecili kaydet/oku çağrıları değişmedi)", j.includes('kaydet("ordu-agac-acik"') && j.includes('kaydet("ordu-agac-secili"'));
});

test("51t- PANEL-ANA-1 FAZ-O (kaynak-pin + vm): 4-İKON GÖRÜNÜM MENÜSÜ [SOHBET][API][AYARLAR][DOKTOR] — token YALNIZ Ayarlar'da (kaydet pano-token; 401 → dürüst yönlendirme) + API salt-okur ölçüm (YENİ uç YOK) + DOKTOR sıralı gerçek muayene (token kapısı gövdeden ÖNCE — mesaj DELİLİ gönderilmez) + composer bar (auto-grow + Enter/Shift+Enter/IME + metin dosyası ekle) + OTURUM SEKMELERİ EK-2 (ağaç → ORTA SEKME → chat dolaylı yolu; kapanış zinciri şerit sırasıyla) — kullanıcı «chat üstünü 4 ikon menü yap … token ve diğerlerini ayarlar içine ekle» + «hangi oturum yüklüyse onun history chat ekranının aktif olacak» + «chat sekmesini ortaya al orta bölümü sağa al» 2026-11-04", async () => {
  const j = jsKisim();
  const h = htmlKisim();
  /* --- (1) kaynak pinleri: menü + görünüm kapları --- */
  ok("menü kabuğu: gorunumMenu role=tablist + 4 gsek düğmesi aria-controls ile görünüm kaplarına bağlı", h.includes('id="gorunumMenu"') && ["gsek-sohbet", "gsek-api", "gsek-ayarlar", "gsek-doktor"].every((id) => h.includes('id="' + id + '"')) && ["gorunum-sohbet", "gorunum-api", "gorunum-ayarlar", "gorunum-doktor"].every((id) => h.includes('id="' + id + '"')));
  ok("açılış görünümü SOHBET (gsek-sohbet aktif + aria-selected=true kaynakta; api/ayarlar/doktor hidden; görünüm tercihi localStorage'a GİRMEZ)", /class="gorunumSekme aktif" id="gsek-sohbet"/.test(h) && /id="gsek-sohbet"[^>]*aria-selected="true"/.test(h) && /id="gorunum-api"[^>]*hidden/.test(h) && !/id="gorunum-sohbet"[^>]*hidden/.test(h) && !j.includes('kaydet("pano-gorunum"') && !j.includes('kaydet("ordu-gorunum"'));
  ok("GORUNUMLER sabiti 4 üye + fail-closed (bilinmeyen görünüm yok)", j.includes('const GORUNUMLER = ["sohbet", "api", "ayarlar", "doktor"]') && j.includes("if (!GORUNUMLER.includes(ad)) return;"));
  ok("token YALNIZ Ayarlar görünümünde: ayarToken (password) + KAYDET düğmesi + ayarSonuc; composer bölgesinde token girdisi yok (tek input gizli dosya seçici — yorumdaki 'token' kelimesi dokümantasyondur)", h.includes('<input id="ayarToken" type="password"') && h.includes('id="ayarTokenKaydet"') && h.includes('id="ayarSonuc"') && !h.slice(h.indexOf('id="bolum-composer"'), h.indexOf("</form>")).includes('type="password"') && (h.slice(h.indexOf('id="bolum-composer"'), h.indexOf("</form>")).match(/<input/g) || []).length === 1);
  ok("AYARLAR kaydetme: kaydet(\"pano-token\") + boş değer dürüst 401/403 notu", j.includes('kaydet("pano-token", deger)') && j.includes("gönderimler sunucu kapısında dürüst 401/403"));
  ok("API görünümü salt-okur: 3 GET satırı + ÖLÇ + apiSonuclar (satırlar YALNIZ ölçümle gelir — sahte satır YOK E10)", h.includes('id="apiOrigin"') && h.includes('id="apiOlc"') && h.includes('id="apiSonuclar"') && j.includes("const API_UCLAR = [") && (j.match(/yol: "\/api\//g) || []).length === 3);
  ok("API ölçümü GERÇEK fetch + kod + ms (tahmin YOK; YENİ uç EKLENMEZ — mevcut GET'ler)", j.includes('satir.textContent = uc.ad + " — HTTP " + r.status + " · " + (Date.now() - t0) + " ms"') && !j.includes('yol: "POST'));
  ok("DOKTOR: MUAYENE sıralı 3 gerçek kontrol + doktorSonuclar; (b) token kapısı gövdeden ÖNCE — hedef BOŞ probe (mesaj DELİLİ gönderilmez)", h.includes('id="doktorMuayene"') && h.includes('id="doktorSonuclar"') && j.includes('body: JSON.stringify({ hedef: "", mesaj: "" })') && j.includes("r.status === 401 || r.status === 403"));
  ok("composer bar: auto-grow (tavan 140) + Enter GÖNDER/Shift+Enter satır/IME isComposing reddi + ekle", j.includes("function composerBoyutla()") && j.includes("Math.min(composerMetin.scrollHeight, 140)") && j.includes('e.key === "Enter" && !e.shiftKey && !e.isComposing') && j.includes("f.requestSubmit()"));
  ok("ekle: METİN uzantı listesi + 1536 tavan + 4096 mesaj tavanı dürüst notu (ikili/uyumsuz hata satırı)", j.includes('const EK_UZANTILAR = ["txt"') && j.includes("const EK_TAVAN = 1536") && j.includes("dosya kesildi") && j.includes("mesaj tavanı 4096 karakter aşıldı"));
  /* --- (2) kaynak pinleri: OTURUM SEKMELERİ (EK-2) --- */
  ok("oturum sekme mekanizması: oturumSekmeAc/Kapat + oturumBul + oturumKartYaz + govdeYaz (tek yönlendirme)", j.includes("function oturumSekmeAc(") && j.includes("function oturumSekmeKapat(") && j.includes("function oturumBul(") && j.includes("function oturumKartYaz(") && j.includes("function govdeYaz()"));
  ok("kimlik uzayı AYRI: data-ana/data-kapat = \"oturum:\" + kimlik (Paseo dizin adlarında ':' YOK — proje uzayıyla çakışma imkânsız)", j.includes("data-ana=\"oturum:' + esc(kimlik)") && j.includes("data-kapat=\"oturum:' + esc(kimlik)"));
  const agacDilim = HTML.slice(HTML.indexOf('$("agacAlani").addEventListener("click"'), HTML.indexOf("function konusmaSecGuncelle"));
  ok("ağaç tıklaması DOLAYLI yol: oturumSekmeAc(agacSecili) — konusmaSecGuncelle/transcriptYukle AĞAÇ TİKLAMASINDA YOK («tek davranış kaynağı ORTA SEKME»)", j.includes("oturumSekmeAc(agacSecili)") && !agacDilim.includes("transcriptYukle(") && !agacDilim.includes("konusmaSecGuncelle("));
  ok("transcriptYukle ÇAĞRISI kaynakta 2 yerde: açılış (transcriptAcilisIstendi kilidi) + anaSekmeDegistir oturum dalı (tanım hariç) — AÇILIŞ sekme AÇMAZ", (j.match(/transcriptYukle\(/g) || []).length - (j.match(/function transcriptYukle\(/g) || []).length === 2 && j.includes("transcriptAcilisIstendi"));
  ok("açık oturum sekme LİSTESİ localStorage'a GİRMEZ (kaynakta kaydet çağrıları yalnız agac-acik/agac-secili/kolon genişlikleri/pano-token ailesi)", !j.includes('kaydet("ordu-oturum') && !j.includes('kaydet("pano-oturum') && !j.includes('kaydet("oturum'));
  ok("PROJE/ORDU sekmesinde chat SON oturumu KORUR (sessiz): anaSekmeDegistir oturum-dışı dalı composerHedefGuncelle çağırır, transcriptYukle ÇAĞIRMAZ", j.includes('else if (!gonderiyor && !odakIcindeMi("#bolum-composer")) composerHedefGuncelle();'));
  ok("oturum kartı DÜRÜST: gerçek P alanları (etiket/ajan/sağlayıcı/durum/son etkinlik/proje); kayıt yok → 'kayıt taramada yok' (uydurma kart YASAK E10)", j.includes('<div class="oturumKart">') && j.includes("bu oturumun kaydı taramada yok"));

  /* --- (3) vm: görünüm geçişi + token kaydetme + chat state korunumu --- */
  const fazA = HTML.indexOf("const GORUNUMLER");
  const fazB = HTML.indexOf("function anaSekmeYaz()");
  ok("FAZ-O dilim yerinde (GORUNUMLER … anaSekmeYaz)", fazA >= 0 && fazB > fazA);
  const fazoKos = (fetchStub) => {
    const sham = {};
    const kayitli = {};
    const olusturulan = [];
    const sham$ = (id) => {
      if (!sham[id]) {
        const dinleyiciler = {};
        sham[id] = {
          innerHTML: "", textContent: "", value: "", hidden: false, disabled: false, className: "",
          scrollTop: 0, scrollHeight: 500, style: {}, files: null, _aria: {}, _sinif: new Set(),
          classList: { toggle: (ad, acik) => { if (acik) sham[id]._sinif.add(ad); else sham[id]._sinif.delete(ad); } },
          setAttribute: (k, v) => { sham[id]._aria[k] = v; },
          appendChild: () => {},
          addEventListener: (tip, fn) => { dinleyiciler[tip] = fn; },
          dinleyiciler,
        };
      }
      return sham[id];
    };
    const fns = vm.runInNewContext(HTML.slice(fazA, fazB) + "\n[gorunumDegistir, composerBoyutla]", {
      $: sham$, oku: (a) => (a in kayitli ? kayitli[a] : null), kaydet: (a, v) => { kayitli[a] = v; },
      fetch: fetchStub, location: { origin: "http://test:4937" },
      document: { createElement: () => { const el = { className: "", textContent: "" }; olusturulan.push(el); return el; } },
    });
    sham$("chatListe"); /* sohbet state korunumu senaryosu için önceden doğar — FAZ-O dilimi yükte dokunmaz */
    sham$("composerForm"); /* keydown işleyicisi ÇAĞRI anında $() ile arar — requestSubmit spy'ı önceden oturur */
    return { sham, kayitli, olusturulan, fns };
  };
  const k1 = fazoKos(async () => ({ ok: true, status: 200, json: async () => ({}) }));
  const [gorunumDegistir, composerBoyutla] = k1.fns;
  gorunumDegistir("api");
  ok("vm görünüm: api görünür + diğer ÜÇÜ gizli (hidden anahtarları)", k1.sham["gorunum-api"].hidden === false && k1.sham["gorunum-sohbet"].hidden === true && k1.sham["gorunum-ayarlar"].hidden === true && k1.sham["gorunum-doktor"].hidden === true);
  ok("vm görünüm: gsek-api aktif sınıfı + aria-selected=true (diğerleri false)", k1.sham["gsek-api"]._sinif.has("aktif") && k1.sham["gsek-api"]._aria["aria-selected"] === "true" && k1.sham["gsek-sohbet"]._aria["aria-selected"] === "false" && !k1.sham["gsek-sohbet"]._sinif.has("aktif"));
  ok("vm görünüm: apiOrigin GERÇEK origin ölçümüyle dolar (tahmin YOK)", k1.sham.apiOrigin.textContent === "panel sunucusu: http://test:4937");
  ok("vm görünüm: bilinmeyen ad fail-closed (değişim yok — api görünür kalır)", gorunumDegistir("yok-boyle") === undefined && k1.sham["gorunum-api"].hidden === false);
  /* chat state görünüm dönüşünde KORUNUR (gizlenir — sıfırlanmaz) */
  k1.sham.chatListe.innerHTML = "kanari-balon";
  gorunumDegistir("sohbet");
  ok("vm görünüm: sohbet'e dönüş chat state KORUR (chatListe dokunulmaz — boşaltılmaz)", k1.sham.chatListe.innerHTML === "kanari-balon" && k1.sham["gorunum-sohbet"].hidden === false);
  ok("vm görünüm: görünüm tercihi KAYDEDİLMEDİ (kayitli boş — localStorage'a girmez)", Object.keys(k1.kayitli).length === 0);
  /* ayarlar → token dolar + KAYDET yazar */
  gorunumDegistir("ayarlar");
  ok("vm ayarlar: kayıtlı token YOKSA alan BOŞ dolar (uydurma YOK)", k1.sham.ayarToken.value === "");
  k1.sham.ayarToken.value = "yeni-token";
  k1.sham.ayarTokenKaydet.dinleyiciler.click();
  ok("vm ayarlar: KAYDET → kaydet(\"pano-token\") + dürüst sonuc satırı", k1.kayitli["pano-token"] === "yeni-token" && k1.sham.ayarSonuc.textContent.includes("token kaydedildi"));
  k1.sham.ayarToken.value = "";
  k1.sham.ayarTokenKaydet.dinleyiciler.click();
  ok("vm ayarlar: BOŞ değer dürüst not (401/403 yüzüne yönlendirir)", k1.kayitli["pano-token"] === "" && k1.sham.ayarSonuc.textContent.includes("401/403"));

  /* --- (4) vm: API ölçümü — 3 satır gerçek fetch + erişilemedi dürüst --- */
  const k2 = fazoKos(async (yol) => { if (yol === "/api/ordu/kadro") throw new Error("koptu"); return { ok: true, status: 200, json: async () => ({}) }; });
  await k2.sham.apiOlc.dinleyiciler.click();
  ok("vm api: 3 satır ölçüldü (uc adı + HTTP + ms — sırayla gerçek fetch)", k2.olusturulan.length === 3 && k2.olusturulan[0].textContent.includes("GET /api/ordu/projeler — HTTP 200 · ") && k2.olusturulan[2].textContent.includes("GET /api/graf — HTTP 200 · "));
  ok("vm api: erişilemeyen uç DÜRÜST hata satırı (kirmizi yüz YOK)", k2.olusturulan[1].textContent.includes("GET /api/ordu/kadro — erişilemedi (koptu)"));

  /* --- (5) vm: DOKTOR sıralı 3 kontrol --- */
  const doktorFetch = async (yol, secenek) => {
    if (secenek && secenek.method === "POST") return { ok: false, status: 401 };
    return { ok: true, status: 200, json: async () => ({ projeler: [{ ajanlar: [{}, {}] }, { ajanlar: [{}] }] }) };
  };
  const k3 = fazoKos(doktorFetch);
  await k3.sham.doktorMuayene.dinleyiciler.click();
  const [da, db, dc] = k3.olusturulan;
  ok("vm doktor (a): sunucu erişimi HTTP + ms ölçülür", da.textContent.includes("sunucu erişimi: HTTP 200 · "));
  ok("vm doktor (b): 401 → token HATALI/eksik + Ayarlar yönlendirmesi (mesaj GÖNDERİLMEDİ — hedef boş probe)", db.textContent.includes("token doğruluğu: HATALI/eksik (HTTP 401)") && db.textContent.includes("Ayarlar"));
  ok("vm doktor (c): veri doluluğu GERÇEK sayım (2 proje · 3 ajan kaydı)", dc.textContent === "veri doluluğu: 2 proje · 3 ajan kaydı");
  const k3b = fazoKos(async (yol, secenek) => {
    if (secenek && secenek.method === "POST") return { ok: false, status: 400, json: async () => ({ hata: "hedef zorunlu" }) };
    return { ok: false, status: 500, json: async () => ({}) };
  });
  await k3b.sham.doktorMuayene.dinleyiciler.click();
  ok("vm doktor: 400 gövde reddi = kapı GEÇTİ (token doğru; mesaj delilli gönderilmedi)", k3b.olusturulan[1].textContent.includes("token doğruluğu: geçti (kapı HTTP 400"));
  ok("vm doktor: (a) veri getirmedi → (c) dürüst ölçülemedi (uydurma sayım YOK E10)", k3b.olusturulan[2].textContent.includes("veri doluluğu: ölçülemedi"));

  /* --- (6) vm: composer bar — Enter/Shift+Enter/IME + auto-grow --- */
  const k4 = fazoKos(async () => ({ ok: true, status: 200, json: async () => ({}) }));
  let submitSay = 0, onlenen = 0;
  k4.sham.composerForm.requestSubmit = () => { submitSay++; };
  const klavye = (e) => k4.sham.composerMesaj.dinleyiciler.keydown({ key: "Enter", shiftKey: false, isComposing: false, preventDefault: () => { onlenen++; }, ...e });
  klavye({});
  ok("vm klavye: Enter GÖNDERİR (requestSubmit — form gönderimi)", submitSay === 1 && onlenen === 1);
  klavye({ shiftKey: true });
  klavye({ isComposing: true });
  ok("vm klavye: Shift+Enter yeni satır + IME isComposing reddi (gönderime ÇEVRİLMEZ)", submitSay === 1 && onlenen === 1);
  k4.sham.composerMesaj.scrollHeight = 500;
  k4.sham.composerMesaj.dinleyiciler.input();
  ok("vm auto-grow: yükseklik tavana kilitlenir (scrollHeight 500 → 140px)", k4.sham.composerMesaj.style.height === "140px");
  k4.sham.composerMesaj.scrollHeight = 40;
  k4.sham.composerMesaj.dinleyiciler.input();
  ok("vm auto-grow: küçük içerik doğal yükseklik (40px)", k4.sham.composerMesaj.style.height === "40px");

  /* --- (7) vm: dosya ekle — metin içeriği + kesildi notu + ret yolları --- */
  const k5 = fazoKos(async () => ({ ok: true, status: 200, json: async () => ({}) }));
  const ekle = async (dosya) => {
    k5.sham.composerDosya.files = [dosya];
    k5.sham.composerDosya.value = "C:/sahte/yol";
    await k5.sham.composerDosya.dinleyiciler.change();
  };
  await ekle({ name: "not.txt", text: async () => "merhaba dosya" });
  ok("vm ekle: metin içeriği [dosya: ad] başlığıyla mesaja EKLENİR + girdi sıfırlanır (aynı dosya tekrar seçilir)", k5.sham.composerMesaj.value.includes("[dosya: not.txt]") && k5.sham.composerMesaj.value.includes("merhaba dosya") && k5.sham.composerDosya.value === "" && k5.sham.composerSonuc.textContent === "");
  await ekle({ name: "buyuk.log", text: async () => "x".repeat(1600) });
  ok("vm ekle: 1536 tavan — ilk 1536 karakter + dürüst 'kesildi' notu", k5.sham.composerMesaj.value.includes("x".repeat(1536)) && k5.sham.composerMesaj.value.includes("…(dosya kesildi — ilk 1536 karakter eklendi)"));
  await ekle({ name: "kur.exe", text: async () => "MZ90" });
  ok("vm ekle: uyumsuz uzantı RED (hata satırı — mesaj DEĞİŞMEZ)", k5.sham.composerSonuc.textContent.includes(".exe' desteklenmiyor") && k5.sham.composerMesaj.value.includes("x".repeat(1536)));
  k5.sham.composerMesaj.value = "z".repeat(2600); /* mevcut metin zaten büyük — kırpılmış dosya (1536) + başlık taşar */
  const onceki = k5.sham.composerMesaj.value;
  await ekle({ name: "tasan.txt", text: async () => "y".repeat(3000) });
  ok("vm ekle: 4096 mesaj tavanı aşarsa RED (eklenmez — mevcut metin aynen; dosya ÖNCE 1536'ya kırpılır, tavan toplam mesaj üzerindedir)", k5.sham.composerSonuc.textContent.includes("mesaj tavanı 4096 karakter aşıldı") && k5.sham.composerMesaj.value === onceki);
  await ekle({ name: "bozuk.txt", text: async () => { throw new Error("okunamadi"); } });
  ok("vm ekle: dosya okunamadı → dürüst hata satırı", k5.sham.composerSonuc.textContent.includes("dosya okunamadı"));

  /* --- (8) vm: OTURUM SEKMELERİ — açma/aktive + dolaylı chat beslemesi + kapanış zinciri --- */
  const R1 = "8cc610a4-6fd3-48c4-8db2-6fb9e6c1eaf7";
  const R2 = "3f3584c0-aa80-44f4-a71d-bf82c9b7671e";
  const PX = "P-x";
  const otA = HTML.indexOf("function anaSekmeYaz()");
  const otB = HTML.indexOf("function kaydet(");
  ok("oturum dilim yerinde (anaSekmeYaz … kaydet)", otA >= 0 && otB > otA);
  const oturumKos = () => {
    const sham = {};
    let seritHtml = "";
    const seritSham = { get innerHTML() { return seritHtml; }, set innerHTML(v) { seritHtml = String(v); }, addEventListener: () => {} };
    const cagrilar = { transcript: [], secim: [], agacYaz: 0, grafYaz: 0, composer: 0, kaydet: [] };
    const sham$ = (id) => (id === "anaSekmeSerit" ? seritSham : sham[id] || (sham[id] = { innerHTML: "", textContent: "", hidden: true }));
    const ctx = {
      $: sham$, esc: fnAl("esc"), kisalt: fnAl("kisalt"), kisaIdGoster: fnAl("kisaIdGoster"), projeEtiketi: fnAl("projeEtiketi"),
      P: { projeler: [
        { dizin: PX, projeAdi: "x", orduMu: false, ajanlar: [
          { ajanKimligi: R1, ajanId: "8cc610a4", lastStatus: "running", provider: "glm53u-claude/glm-5.3", sonEtkinlikISO: "2026-11-04T10:00:00Z", etiket: "KURMAY-1 oturumu" },
          { ajanKimligi: R2, ajanId: "3f3584c0", lastStatus: "idle", provider: "glm53u-claude/glm-5.3", sonEtkinlikISO: "2026-11-04T09:00:00Z", etiket: "PANEL yazici oturumu" },
        ] },
      ] },
      acikSekmeler: [], aktifSekme: "ordu", acikOturumSekmeleri: [], agacSecili: null,
      kaydet: (a) => { cagrilar.kaydet.push(a); }, oku: () => null,
      konusmaSecGuncelle: (z) => { cagrilar.secim.push(z); }, transcriptYukle: (k) => { cagrilar.transcript.push(k); },
      agacYaz: () => { cagrilar.agacYaz++; }, grafYaz: () => { cagrilar.grafYaz++; },
      composerHedefGuncelle: () => { cagrilar.composer++; }, odakIcindeMi: () => false, gonderiyor: false,
    };
    const fns = vm.runInNewContext(HTML.slice(otA, otB) + "\n[anaSekmeDegistir, sekmeAc, sekmeKapat, oturumSekmeAc, oturumSekmeKapat, oturumKartYaz, govdeYaz]", ctx);
    return { sham, seritHtml: () => seritHtml, cagrilar, ctx, fns };
  };
  const o1 = oturumKos();
  const [anaSekmeDegistir, sekmeAc, sekmeKapat, oturumSekmeAc, oturumSekmeKapat, oturumKartYaz, govdeYaz] = o1.fns;
  oturumSekmeAc(R1);
  ok("vm oturum: sekme AÇILIR + AKTİF olur (data-ana=oturum:+kimlik; ORDU pasif)", o1.ctx.acikOturumSekmeleri.length === 1 && o1.ctx.aktifSekme === "oturum:" + R1 && o1.seritHtml().includes('data-ana="oturum:' + R1 + '"') && /data-ana="oturum:[^"]*"[^>]*aria-selected="true"/.test(o1.seritHtml()));
  ok("vm oturum: chat DOLAYLI beslenir — konusmaSecGuncelle(true) + transcriptYukle(kimlik) + agacSecili + agacYaz (ağaç tıklamasının yolu)", o1.cagrilar.secim.length === 1 && o1.cagrilar.secim[0] === true && o1.cagrilar.transcript.length === 1 && o1.cagrilar.transcript[0] === R1 && o1.ctx.agacSecili === R1 && o1.cagrilar.agacYaz === 1 && o1.cagrilar.kaydet.includes("ordu-agac-secili"));
  oturumSekmeAc(R1);
  ok("vm oturum: MÜKERRER AÇILMAZ (ikinci tık varolan sekme yalnız AKTİVE eder — tek sekme)", o1.ctx.acikOturumSekmeleri.length === 1 && (o1.seritHtml().match(/data-ana="oturum:/g) || []).length === 1);
  ok("vm oturum sekme etiketi: DAR etiket (kisalt 14 — FAZ-H ailesi) + TAM ad + kimlik title'da (X ile kapanır)", o1.seritHtml().includes(">KURMAY-1 otur…</button>") && o1.seritHtml().includes('title="KURMAY-1 oturumu — ' + R1 + '"') && o1.seritHtml().includes('data-kapat="oturum:' + R1 + '"'));
  sekmeAc(PX);
  ok("vm oturum: PROJE sekmesine dönüş chat'i SESSİZ korur (transcript/konusmaSecGuncelle YENİDEN çağrılmaz — sayaç aynen; composer hedef listesi tazelenir)", o1.cagrilar.transcript.length === 2 && o1.cagrilar.secim.length === 2 && o1.cagrilar.composer >= 1 && o1.ctx.aktifSekme === PX);
  oturumSekmeAc(R2);
  oturumSekmeKapat(R2);
  ok("vm kapanış zinciri: kapanan aktif oturum → kalan oturum sekmelerinden ŞERİT SIRASIYLA İLKİ (R1)", o1.ctx.aktifSekme === "oturum:" + R1 && o1.ctx.acikOturumSekmeleri.length === 1);
  oturumSekmeKapat(R1);
  ok("vm kapanış zinciri: oturum kalmadı → SON AÇIK PROJE (P-x)", o1.ctx.aktifSekme === PX && o1.ctx.acikOturumSekmeleri.length === 0);
  sekmeKapat(PX);
  ok("vm kapanış zinciri: sekme de kalmadı → ORDU (fail-closed son nokta)", o1.ctx.aktifSekme === "ordu");
  anaSekmeDegistir("oturum:dusmus-kimlik");
  ok("vm fail-closed: kapalı/düşmüş oturum kimliği ORDU'ya döner", o1.ctx.aktifSekme === "ordu");
  /* gövde: oturum sekmesi → DÜRÜST kart; proje → graf */
  const o2 = oturumKos();
  o2.ctx.aktifSekme = "oturum:" + R1;
  o2.fns[6]();
  const kart = o2.sham.grafAlani.innerHTML;
  ok("vm kart: DÜRÜST oturum kartı — gerçek P alanları (etiket başlık + ajan kimliği title'lı + sağlayıcı + durum + son etkinlik + proje)", kart.includes('<div class="oturumKart">') && kart.includes("<h3>KURMAY-1 oturumu</h3>") && kart.includes('title="' + R1 + '">ajan: ' + R1) && kart.includes("sağlayıcı: glm53u-claude/glm-5.3") && kart.includes("durum: running") && kart.includes("son etkinlik: 2026-11-04T10:00:00Z") && kart.includes("proje: x"));
  o2.fns[5]("taramada-yok-kimlik");
  ok("vm kart: kayıt yoksa DÜRÜST boş satır (uydurma kart YASAK)", o2.sham.grafAlani.innerHTML.includes("bu oturumun kaydı taramada yok"));
  o2.ctx.aktifSekme = PX;
  o2.fns[6]();
  ok("vm gövde: PROJE sekmesi → grafYaz AYNEN (tek yönlendirme fonksiyonu)", o2.cagrilar.grafYaz === 1 && o2.cagrilar.transcript.length === 0);
});

test("51u- PANEL-ANA-1 FAZ-P (kaynak-pin): TASARIM MODERNİZASYONU — TASARIM-MANIFESTOSU REVİZYON 2026-11-04 (kullanıcı «chat paneli daralt en geniş sağdaki panel olsun .. minimal komplat yap okunaklı olsun chat yazıları .. sayfa geneli tasarım dili kötü eski ve modern değil ... akıcı net profesyonel arayüz yap») — §1 kompakt-okunaklı ölçek · §2 ekonomik ritim · §2a kolon doktrini · §4 modern dil; DAVRANIŞ AYNEN (FAZ-O mekanizmaları hunk 0 — görünüm dalgası)", () => {
  const j = jsKisim();
  const h = htmlKisim();
  /* --- §2a KOLON DOKTRİNİ: SAĞ EN GENİŞ + chat DAR + eski kayıt ezmez --- */
  ok("§2a: SAĞ (sekmeli) EN GENİŞ — varsayılan --sagW:560px + KENAR 320-760 (sol 240/200-360 AYNEN)", HTML.includes("--solW:240px") && HTML.includes("--sagW:560px") && j.includes("const KENAR = { sol: { min: 200, max: 360 }, sag: { min: 320, max: 760 } }"));
  ok("§2a: eski localStorage genişliği yeni ölçeği EZMEZ — anahtar sürümü W2 (eski W literali kaydet/oku'da YOK)", j.includes('kaydet("ordu-" + taraf + "W2"') && j.includes('oku("ordu-" + taraf + "W2"') && !j.includes('kaydet("ordu-" + taraf + "W"') && !j.includes('oku("ordu-" + taraf + "W"'));
  ok("§2a: splitter mekanizması + kalıcılık AYNEN (splitterKur/genislikKenetle/genislikUygula + resize kenetleme)", j.includes("function splitterKur(") && j.includes("function genislikKenetle(") && j.includes("function genislikUygula(") && j.includes('window.addEventListener("resize"'));
  ok("§2a: chat balon genişlik TAVANI ~660px (640-680 bandı) — KULLANICI + AJAN balonunda (DAR görünüm; dar ekranda %92 doğal dolgu)", /\.chatMesaj\.chat-kullanici\s*\{[^}]*max-width:\s*min\(92%, 660px\)/.test(HTML) && /\.chatMesaj\.chat-sistem\s*\{[^}]*max-width:\s*min\(92%, 660px\)/.test(HTML));
  ok("§2a: orta ekranda da SAĞ en geniş (900-1279: sag 420)", /@media \(min-width:900px\) and \(max-width:1279px\)[\s\S]*?--sagW:\s*420px/.test(HTML));
  /* --- §1 KOMPAKT-OKUNAKLI ölçek --- */
  ok("§1: baz 13px (REVİZYON — eski 15px) + başlık 15px + meta zaten 11-12px ailesi (chatKim 11.5 aynen)", /body\s*\{[^}]*font-size:\s*13px/.test(HTML) && /\.bolum-etiket\s*\{[^}]*font-size:\s*15px/.test(HTML) && /\.chatKim\s*\{[^}]*font-size:\s*11\.5px/.test(HTML));
  ok("§1: OKUNAKLILIK ŞART — chat balon metni 15px/1.55 AYNEN (kullanıcının açık sözü; kırpma YOK)", /\.chatMesaj\s*\{[^}]*font-size:\s*15px/.test(HTML) && /\.chatMesaj\s*\{[^}]*line-height:\s*1\.55/.test(HTML) && !/\.chatMesaj\s*\{[^}]*font-size:\s*1[34]px/.test(HTML));
  ok("§1: oturum kartı baz ölçeğe iner (13px/15px h3 — eski 15/16)", /\.oturumKart\s*\{[^}]*font-size:\s*13px/.test(HTML) && /\.oturumKart h3\s*\{[^}]*font-size:\s*15px/.test(HTML));
  /* --- §2 EKONOMİK minimal ritim (iç içe kutu AZALT) --- */
  ok("§2: chatListe FLAT yüzey — kutu çerçevesi SÖKÜLDÜ (border/background/radius YOK; gap 6 + flex zinciri aynen)", /\.chatListe\s*\{[^}]*display:\s*flex; flex-direction:\s*column;\s*gap:\s*6px[^}]*padding:\s*0/.test(HTML) && !/\.chatListe\s*\{[^}]*border:/.test(HTML) && !/\.chatListe\s*\{[^}]*background:/.test(HTML));
  ok("§2: ekonomik dolgular — main 10px + bolum 10px 12px 12px + sekmeGovde 8px 12px 12px", /main\s*\{[^}]*padding:\s*10px/.test(HTML) && /\.bolum\s*\{[^}]*padding:\s*10px 12px 12px/.test(HTML) && /#sekmeGovde\s*\{[^}]*padding:\s*8px 12px 12px/.test(HTML));
  ok("§2: 44px dokunma KORUNUR (K-0061 — coarse blok + min-dokunma tokeni aynen)", HTML.includes("--min-dokunma:44px") && /@media \(pointer:coarse\)[\s\S]*?min-height:\s*var\(--min-dokunma\)/.test(HTML));
  /* --- §4 TEMİZ MODERN DİL (mevcut tokenlarla — YENİ renk/keyframes YOK) --- */
  ok("§4: yumuşak radius 10/8/6 (eski 6/4/4)", HTML.includes("--radius:10px") && HTML.includes("--radius-k:8px") && HTML.includes("--radius-cip:6px"));
  ok("§4: composer bar yuvarlak 16px + ikon düğmeleri 50% + hedef pill 999px + görünüm menüsü PILL 999px", /\.composerBar\s*\{[^}]*border-radius:\s*16px/.test(HTML) && /\.composerIkonBtn\s*\{[^}]*border-radius:\s*50%/.test(HTML) && /#composerGonder\s*\{[^}]*border-radius:\s*50%/.test(HTML) && /#composerForm select\s*\{[^}]*border-radius:\s*999px/.test(HTML) && /\.gorunumSekme\s*\{[^}]*border-radius:\s*999px/.test(HTML));
  ok("§4: YENİ renk/YENİ keyframes YOK (token :root aynen + keyframes ≤2 + gölge 0 — mevcut dil içinde modern)", (HTML.match(/@keyframes/g) || []).length <= 2 && !/--yeni|--primary|--accent/.test(HTML) && (HTML.replace(/box-shadow:\s*inset[^;}]*[;}]/g, "").match(/box-shadow/g) || []).length === 0);
  /* --- DEĞİŞMEZLER: davranış/veri katmanı hunk 0 --- */
  ok("DEĞİŞMEZ: 899px istif AYNEN (chat order 1 — FAZ-O EK-3)", /@media \(max-width:899px\)[\s\S]*?#orta\s*\{\s*order:1;\s*\}[\s\S]*?#sag\s*\{\s*order:2;\s*\}[\s\S]*?#sol\s*\{\s*order:3;/.test(HTML));
  ok("DEĞİŞMEZ: veri katmanı — POST/x-pano-token/CHAT_TAVAN/esc/localStorage anlamı AYNEN", j.includes('"/api/mesaj"') && j.includes("x-pano-token") && j.includes("const CHAT_TAVAN") && j.includes("function esc(") && j.includes('kaydet("pano-token"'));
  ok("DEĞİŞMEZ: KENAR klavye/drag mantığı AYNEN (±16px + pointer capture + aria-valuenow güncellemesi)", j.includes('e.key === "ArrowLeft" ? -16 : 16') && j.includes("setPointerCapture") && j.includes('setAttribute("aria-valuenow"'));
  ok("DEĞİŞMEZ: splitSag aria-valuenow=560 açılış değeri HTML'de", h.includes('aria-valuenow="560"'));
});

test("51v- PANEL-ANA-1 FAZ-P EK (kaynak-pin + vm): yoklama kendini kollar — kullanıcı hata bildirimi 2026-11-04 «sayfa yenileyip sürekli yeniden yüklüyor sıfırlanıyor sayfa» (uçuş kilidi + ayni-veri-atlama + görünmez sekme + hata-bayat-koruma; render yalnız GERÇEK değişimde)", async () => {
  const j = jsKisim();
  /* --- kaynak pinleri: mekanizmanın 4 ayağı --- */
  ok("(1) uçuş kilidi: yoklamaUcusta + finally ile açılır (üst üste binen istekler yasak)", j.includes("let yoklamaUcusta = false;") && j.includes("if (yoklamaUcusta) return;") && j.includes("yoklamaUcusta = true;") && j.includes("finally {\n    yoklamaUcusta = false;\n  }"));
  ok("(2) ayni-veri-atlama: SON_YANIT parmak izi uc bazında + 3 uçta aynı-VERİ return + UÇUCU META DIŞLANIR (EK DÜZELTME: projeler pini yeni.projeler + kadro olcumAniISO destructuring + graf TAM yanıt [statik dosya])", j.includes("const SON_YANIT = { kadro: null, projeler: null, graf: null };") && (j.match(/if \(parmak === SON_YANIT\.\w+\) return;/g) || []).length === 3 && j.includes("JSON.stringify(yeni.projeler ?? null)") && j.includes("const { olcumAniISO: _ucucuOlcum, ...kadroVerisi } = yeni;") && j.includes("JSON.stringify(kadroVerisi)") && (j.match(/const parmak = JSON\.stringify\(yeni\);/g) || []).length === 1);
  ok("(3) görünmez sekbe: document.hidden kapısı + visibilitychange dinleyicisi (görünür olunca tur HEMEN)", j.includes("if (document.hidden) return;") && j.includes('document.addEventListener("visibilitychange"'));
  ok("(4) hata-bayat-koruma: yalnız HİÇ yüklenmediyse kırmızı yüz (3 uçta SON_YANIT null koşulu; önceki veri ekranda KALIR)", (j.match(/if \(SON_YANIT\.\w+ === null\)/g) || []).length === 3 && j.includes('kirmiziYuzGoster("agacHata", "agacAlani"'));
  ok("hepsiniYukle async + uçlar paralel (Promise.all) + setInterval AYNEN", j.includes("async function hepsiniYukle() {") && j.includes("await Promise.all([kadroYukle(), projelerYukle(), grafYukle()])") && j.includes("setInterval(hepsiniYukle, YENILE_SN * 1000);"));
  ok("kalan uç çağrı ailesi AYNEN (cek ×3 + P/K/G atamaları değişmedi)", (j.match(/await cek\(UC\.\w+\)/g) || []).length === 3);
  /* --- vm: davranış senaryoları --- */
  const declB = HTML.slice(HTML.indexOf("let yoklamaUcusta = false;"), HTML.indexOf("/* STEERING-6"));
  const grafB = HTML.slice(HTML.indexOf("async function grafYukle("), HTML.indexOf("/* ---- Paseo canlı tarama"));
  const projB = HTML.slice(HTML.indexOf("async function projelerYukle("), HTML.indexOf("/* ---- GEZGİN: ağaç render"));
  const kadroB = HTML.slice(HTML.indexOf("async function kadroYukle("), HTML.indexOf("chatBaslikYaz(); /* başlangıçta"));
  const parcalar = declB + grafB + projB + kadroB + "\n[projelerYukle, kadroYukle, grafYukle, hepsiniYukle]";
  const fazpekKos = (cekStub) => {
    const ctx = {
      cek: cekStub, UC: { kadro: "/api/ordu/kadro", projeler: "/api/ordu/projeler", graf: "/api/graf" },
      odakIcindeMi: () => false, gonderiyor: false, agacSecili: null, seciliKonusma: null, transcriptAcilisIstendi: true,
      P: null, G: null, K: null,
      sayac: { agacYaz: 0, konusmaSecGuncelle: 0, transcriptYukle: 0, composerHedefGuncelle: 0, govdeYaz: 0, kirmiziYuzGoster: 0, kirmiziYuzKapat: 0 },
      document: { hidden: false, addEventListener: (tip, fn) => { ctx.gorunurlukDinleyici = fn; } },
    };
    ctx.agacYaz = () => { ctx.sayac.agacYaz++; };
    ctx.konusmaSecGuncelle = () => { ctx.sayac.konusmaSecGuncelle++; };
    ctx.transcriptYukle = () => { ctx.sayac.transcriptYukle++; };
    ctx.composerHedefGuncelle = () => { ctx.sayac.composerHedefGuncelle++; };
    ctx.govdeYaz = () => { ctx.sayac.govdeYaz++; };
    ctx.kirmiziYuzGoster = () => { ctx.sayac.kirmiziYuzGoster++; };
    ctx.kirmiziYuzKapat = () => { ctx.sayac.kirmiziYuzKapat++; };
    const fns = vm.runInNewContext(parcalar, ctx);
    return { ctx, fns };
  };
  /* senaryo 1: AYNİ veri — ikinci özdeş yanıt render tetiklemiyor (projeler yanıtı
     GERÇEK şekliyle sarmalı { projeler: [...] } + uçucu olcumAniISO/onbellek sabit) */
  const veri = { projeler: [{ dizin: "P-x", orduMu: false, ajanlar: [] }], kadro: { ajanlar: [] }, graf: { gorevler: [] } };
  const anahtarla = (yol) => (yol === "/api/ordu/projeler" ? "projeler" : yol === "/api/ordu/kadro" ? "kadro" : "graf");
  const cekAyni = async (yol) => JSON.parse(JSON.stringify(yol === "/api/ordu/projeler" ? { projeler: veri.projeler, olcumAniISO: "S", onbellek: false } : veri[anahtarla(yol)]));
  const s1 = fazpekKos(cekAyni);
  await s1.fns[0](); /* projelerYukle — ilk yükleme: ÇİZER */
  await s1.fns[0](); /* özdeş yanıt: ATLAR */
  ok("vm ayni-veri: ilk yanıt çizer (agacYaz 1 + composer 1), ikinci ÖZDEŞ yanıt render ETMEZ (sayaç aynen)", s1.ctx.sayac.agacYaz === 1 && s1.ctx.sayac.composerHedefGuncelle === 1 && s1.ctx.P && s1.ctx.P.projeler[0].dizin === "P-x");
  veri.projeler[0].dizin = "P-y";
  await s1.fns[0](); /* değişen yanıt: YENİDEN çizer */
  ok("vm değişen-veri: yanıt değişince render geri döner (agacYaz 2 + P güncellenir)", s1.ctx.sayac.agacYaz === 2 && s1.ctx.P.projeler[0].dizin === "P-y");
  await s1.fns[1](); /* kadro ilk — çizer */
  await s1.fns[1](); /* özdeş — atlar */
  veri.kadro.ajanlar.push({ kodAdi: "YENI" });
  await s1.fns[1]();
  ok("vm kadro ayağı: özdeş atlar + değişen çizer (govdeYaz 2)", s1.ctx.sayac.govdeYaz === 2 && s1.ctx.K && s1.ctx.K.ajanlar.length === 1);
  /* senaryo 2: UÇUŞ KİLİDİ — önceki tur bitmeden ikinci tur BAŞLAMAZ */
  const bekleyen = [];
  const cekAskida = (yol) => new Promise((coz) => { bekleyen.push({ yol, coz }); });
  const s2 = fazpekKos(cekAskida);
  const tur1 = s2.fns[3](); /* hepsiniYukle — 3 fetch havada */
  await Promise.resolve();
  const tur2 = s2.fns[3](); /* uçuşta — kilit: yeni fetch YOK */
  ok("vm uçuş kilidi: ilk tur bitmeden ikinci tur YENİ fetch BAŞLATMAZ (3 istek yalnız)", bekleyen.length === 3, "bekleyen: " + bekleyen.length);
  for (const b of bekleyen.splice(0)) b.coz({ ajanlar: [] });
  await tur1; await tur2;
  const tur3 = s2.fns[3]();
  await Promise.resolve();
  ok("vm uçuş kilidi: tur bitince kilit AÇILIR — sonraki tur yeni 3 fetch (kuyruk birikmez)", bekleyen.length === 3, "bekleyen: " + bekleyen.length);
  for (const b of bekleyen.splice(0)) b.coz({ ajanlar: [] });
  await tur3;
  /* senaryo 3: GÖRÜNMEZ SEKBE — document.hidden iken tur atlanır; görünür olunca HEMEN */
  let cekSay = 0;
  const cekSayar = async (yol) => { cekSay++; return { ajanlar: [] }; };
  const s3 = fazpekKos(cekSayar);
  s3.ctx.document.hidden = true;
  await s3.fns[3]();
  ok("vm görünmez: hidden'da tur ATLANIR (fetch 0)", cekSay === 0);
  const dinleyici = s3.ctx.gorunurlukDinleyici;
  ok("vm görünmez: visibilitychange dinleyicisi KAYITLI", typeof dinleyici === "function");
  s3.ctx.document.hidden = false;
  await dinleyici(); /* sekme önüne döndü — ilk tur hemen */
  ok("vm görünür dönüş: dinleyici turu HEMEN tetikler (3 fetch)", cekSay === 3);
  /* senaryo 4: HATA — ilk yükleme hatası dürüst kırmızı yüz; ÖNCEKİ yükleme VARSA veri ekranda KALIR */
  let hataMod = false;
  const cekHata = async (yol) => { if (hataMod) throw new Error("kop"); return JSON.parse(JSON.stringify(yol === "/api/ordu/projeler" ? { projeler: veri.projeler, olcumAniISO: "S", onbellek: false } : veri[anahtarla(yol)])); };
  const s4 = fazpekKos(cekHata);
  hataMod = true;
  await s4.fns[0](); /* hiç yüklenmedi → dürüst kırmızı yüz */
  ok("vm hata ilk-yükleme: kirmiziYuzGoster 1 + P null (fail-closed AYNEN)", s4.ctx.sayac.kirmiziYuzGoster === 1 && s4.ctx.P === null);
  const s5 = fazpekKos(cekHata);
  hataMod = false;
  await s5.fns[0](); /* başarı — çizer */
  const pOnce = s5.ctx.P;
  hataMod = true;
  await s5.fns[0](); /* hata — ÖNCEKİ veri KALIR */
  ok("vm hata bayat-koruma: önceki yükleme VARSA mevcut veri SİLİNMEZ (P aynen + kirmiziYuzGoster 0 + render 1'de kalır)", s5.ctx.P === pOnce && s5.ctx.sayac.kirmiziYuzGoster === 0 && s5.ctx.sayac.agacYaz === 1);
  /* senaryo 5 (FAZ-P EK DÜZELTME — koordinatör canlı casut ölçümünün birebir vm hali):
     yanıtta SADECE uçucu meta (olcumAniISO/onbellek) değişti, UI verisi aynı → render YOK */
  const sabitProjeler = [{ dizin: "P-meta", orduMu: false, ajanlar: [] }];
  let metaTur = 0;
  const cekMetaDegis = async (yol) => {
    metaTur++;
    if (yol === "/api/ordu/projeler") return { projeler: JSON.parse(JSON.stringify(sabitProjeler)), olcumAniISO: "2026-11-04T07:00:0" + metaTur + "Z", onbellek: metaTur % 2 === 0 };
    if (yol === "/api/ordu/kadro") return { olcumAniISO: "2026-11-04T07:00:0" + metaTur + "Z", ajanlar: [] };
    return { gorevler: [] };
  };
  const s6 = fazpekKos(cekMetaDegis);
  await s6.fns[0](); /* projeler ilk — ÇİZER */
  await s6.fns[0](); /* olcumAniISO + onbellek DEĞİŞTİ, projeler aynı — ATLA */
  await s6.fns[1](); /* kadro ilk — ÇİZER */
  await s6.fns[1](); /* kadro olcumAniISO DEĞİŞTİ, kalan veri aynı — ATLA */
  ok("vm uçucu-meta: yalnız olcumAniISO/onbellek değişince render YOK (agacYaz 1 + govdeYaz 1) — canlı casut yakalananın vm hali", s6.ctx.sayac.agacYaz === 1 && s6.ctx.sayac.govdeYaz === 1 && s6.ctx.P && s6.ctx.P.projeler[0].dizin === "P-meta");
  sabitProjeler[0].dizin = "P-meta-yeni";
  await s6.fns[0](); /* olcumAniISO DA değişti + projeler kaydı değişti — ÇİZER */
  ok("vm uçucu-meta + gerçek değişim: projeler kaydı değişince render KOŞAR (agacYaz 2 + P güncellenir)", s6.ctx.sayac.agacYaz === 2 && s6.ctx.P.projeler[0].dizin === "P-meta-yeni");
});

test("51w- PANEL-ANA-1 FAZ-Q (kaynak-pin + hermetik + vm): SOL KOLON KAYDIRMA (flex/overflow kök neden — .chatListe deseni) + ağaç adları SADECE KLASÖR ADI (klasorAdi = ajan kaydı cwd basename'i; dash-bölme YASAK: 'woo-block' ≠ 'block') — kullanıcı «soldaki sadece klasör adlarını neden yazmıyorsun uzun yazıyorsun» + «ayrıca sol panel aşağı kaymıyor» 2026-11-04", () => {
  const j = jsKisim();
  const birlesim = readFileSync(new URL("./ordu-birlesim.mjs", import.meta.url), "utf8");
  /* --- (1) CSS kaynak pinleri: sol kaydırma kök neden düzeltmesi --- */
  ok("(1a) #sol>.bolum esner: flex:1 1 auto + min-height:0 + flex kolon (eski flex:0 1 auto + overflow:hidden automatic min-height korumasını ÖLDÜRÜYORDU — .bolum 3842px içeriği 768px'e KÜÇÜLTÜP kırpıyordu)", HTML.includes("#sol > .bolum { flex:1 1 auto; min-height:0; display:flex; flex-direction:column; }"));
  ok("(1b) #agacAlani kaydırma alanı: .chatListe deseni AYNEN (flex:1 1 auto + min-height:0 + overflow-y:auto + overscroll-behavior:contain)", HTML.includes("#agacAlani { flex:1 1 auto; min-height:0; overflow-y:auto; overscroll-behavior:contain; }"));
  ok("(1c) #agacHata + .logNot esnek-olmayan alt çocuk — altta PINLENİR (hata yüzü kaydırma alanından bağımsız hep görünür)", HTML.includes("#bolum-agac #agacHata, #bolum-agac .logNot { flex:0 0 auto; }"));
  ok("(1d) scrollbar ailesine #agacAlani EKLENDİ (8px + thumb)", HTML.includes("#sol::-webkit-scrollbar, #agacAlani::-webkit-scrollbar") && HTML.includes("#agacAlani::-webkit-scrollbar-thumb"));
  ok("(1e) MOBİL ≤899: .bolum doğal boy (flex:none) + #agacAlani overflow:visible — iç scroll YOK (sayfa kayar)", (() => { const m = HTML.match(/@media \(max-width:899px\)[\s\S]*?(?=@media|$)/); return m !== null && m[0].includes("#sol > .bolum { flex:none; }") && m[0].includes("#agacAlani { overflow:visible; }"); })());
  ok("(1f) #orta'ya DOKUNULMADI (şikayet yok; chatListe zaten bu desenle çalışıyor — kolon kuralı değişmez)", /#orta\s*\{[^}]*overflow-y:auto/.test(HTML) && !/#orta[^;]*overflow:hidden/.test(HTML));
  /* --- (2) birlesim kaynak pinleri: klasorAdi kaynağı cwd --- */
  ok("(2a) projelerTara ajan döngüsünde cwd yakalama (İLK dolu yeter)", birlesim.includes("let klasorCwd = null;") && birlesim.includes("typeof k.cwd === 'string' && k.cwd.trim()"));
  ok("(2b) proje kaydına klasorAdi alanı: cwd basename (son ayraçlar temizlenir + son segment; boş = null) — EKLEMELİ alan, mevcut alanlar AYNEN", birlesim.includes("klasorAdi: klasorCwd === null ? null :") && birlesim.includes("replace(/[\\\\/]+$/, '')"));
  ok("(2c) systemPrompt yanıta GİRMEZ AYNEN (alan ataması 0 — yalnız satır 604 yorumunda doktrin notu)", !birlesim.includes("systemPrompt:"));
  /* --- (3) hermetik projelerTara: GERÇEK tireli klasör adı (dash-bölme tuzağı pinlenir) --- */
  const tmp = tempKok();
  try {
    const ag = join(tmp, "agents");
    for (const d of ["D-woo", "D-cwdsiz", "D-slash"]) mkdirSync(join(ag, d), { recursive: true });
    const ajanYaz = (d, id, cwd) => writeFileSync(join(ag, d, id + ".json"), JSON.stringify(Object.assign({ id, provider: "glm53u-claude", lastStatus: "running", lastActivityAt: "2026-11-04T10:00:00Z", title: "oturum etiketi" }, cwd === undefined ? {} : { cwd })));
    ajanYaz("D-woo", "11111111-1111-4111-8111-111111111111", "C:\\Users\\gatep\\Local Sites\\1\\app\\public\\wp-content\\themes\\woo-block");
    ajanYaz("D-cwdsiz", "22222222-2222-4222-8222-222222222222", undefined);
    ajanYaz("D-slash", "33333333-3333-4333-8333-333333333333", "D:/fwd/klasorum");
    const r = projelerTara(tmp);
    const bul = (d) => r.projeler.find((p) => p.dizin === d);
    assert.equal(bul("D-woo").klasorAdi, "woo-block", "DASH-BÖLME TUZAĞI: tireli klasör adı TEK segment — 'block' DEĞİL (canlı verideki woo-block teması)");
    assert.equal(bul("D-cwdsiz").klasorAdi, null, "cwd'siz ajan → klasorAdi null (dürüst — uydurma yok E10)");
    assert.equal(bul("D-slash").klasorAdi, "klasorum", "ileri-bölü cwd'den basename AYNEN çıkar");
    assert.equal(bul("D-woo").baslik, null, "mevcut alanlar AYNEN: baslik (workspaces.json yok → null)");
    assert.ok(Array.isArray(bul("D-woo").ajanlar) && bul("D-woo").ajanlar.length === 1, "ajanlar listesi AYNEN");
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  /* --- (4) vm: klasorAdi ÖNCELİĞİ (baslik VARSA BİLE kazanır — yeni doktrin) + yedekler + tamTitle --- */
  ok("(4a) projeEtiketi gövdesi: klasorAdi || projeAdi || '?' — baslik GÖRÜNEN ADI TAŞIMAZ", j.includes("typeof pr.klasorAdi === \"string\" && pr.klasorAdi.trim()") && !j.includes('if (pr && typeof pr.baslik === "string" && pr.baslik.trim()) return pr.baslik;'));
  ok("(4b) tamTitle birleşimi: dizin + [baslik VARSA] + çalışan/kayıt (TAM kimlik hover'da)", j.includes("const tamTitle = esc(pr.dizin)") && j.includes('typeof pr.baslik === "string" && pr.baslik.trim()'));
  const R1 = "44444444-4444-4444-8444-444444444444";
  const FIXW = {
    olcumAniISO: "2026-11-04T12:00:00Z",
    projeler: [
      { dizin: "D-kisa", projeAdi: "D-kisa", baslik: "ÇOK UZUN BAŞLIK VAR AMA", klasorAdi: "woo-block", orduMu: false, ajanlar: [
        { ajanKimligi: R1, ajanId: "44444444", lastStatus: "running", etiket: "klasörlü ajan" },
      ] },
      { dizin: "D-yedek", projeAdi: "D-yedek", orduMu: false, ajanlar: [
        { ajanKimligi: R1, ajanId: "44444444", lastStatus: "idle", etiket: "yedekli ajan" },
      ] },
      { dizin: "D-bos", projeAdi: "   ", orduMu: false, ajanlar: [] },
    ],
  };
  const sahteW = {};
  const $w = (id) => (sahteW[id] = sahteW[id] || { innerHTML: "", textContent: "", hidden: true });
  const ctxW = {
    $: $w, esc: fnAl("esc"), kisalt: fnAl("kisalt"), kisaIdGoster: fnAl("kisaIdGoster"), projeEtiketi: fnAl("projeEtiketi"),
    P: FIXW, agacAcik: new Set(["D-kisa", "D-yedek", "D-bos"]), agacSecili: null,
    NOKTA_SINIF: { running: "yesil", idle: "gri", error: "kirmizi", closed: "kapali" },
  };
  vm.runInNewContext(HTML.slice(HTML.indexOf("function ajanDugumHtml("), HTML.indexOf('$("agacAlani").addEventListener')) + "\nagacYaz", ctxW)();
  const hw = sahteW.agacAlani.innerHTML;
  ok("(4c) vm: klasorAdi kazanır — baslik VARSA BİLE görünmez ('woo-block' görünür; 'ÇOK UZUN BAŞLIK' YOK)", hw.includes(">woo-block</span>") && !hw.includes(">ÇOK UZUN BAŞLIK"));
  ok("(4d) vm: baslik TOOLTIP'te yaşar (title 'D-kisa — ÇOK UZUN BAŞLIK VAR AMA — 1 çalışan · 1 ajan kaydı')", hw.includes('title="D-kisa — ÇOK UZUN BAŞLIK VAR AMA — 1 çalışan · 1 ajan kaydı"'));
  ok("(4e) vm: klasorAdi null → dashed projeAdi dürüst yedek + basliksız title segmenti YOK", hw.includes(">D-yedek</span>") && hw.includes('title="D-yedek — 0 çalışan · 1 ajan kaydı"'));
  ok("(4f) vm: her ikisi de boş → dürüst '?' (uydurma yok)", hw.includes(">?</span>"));
  ok("(4g) kimlik yolu DEĞİŞMEZ: data-proje TAM dizin", hw.includes('data-proje="D-kisa"') && hw.includes('data-proje="D-yedek"'));
});
