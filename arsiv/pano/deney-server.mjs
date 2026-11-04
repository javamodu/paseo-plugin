// G9 DENET PANELI IZOLE DENEY SUNUCUSU (KAPI K10 — 2026-10-29).
// Ne: pano/deney-panel.html icin dar canli deney sunucusu — AYRI surec, AYRI port (DENEY_PORT, varsayilan 4930).
// Sinir: pano/server.js (uretim sunucusu) DONMUS — bu dosya ona DOKUNMAZ; kapsul-tuval.html'e dokunmaz.
// G9 cekirdegi CANLI: pano/graf-yonetim.js'ten atamaTaslakla + atanabilirler import edilir (dosya degistirilmez).
// YAZMA KUMESI (fail-closed): tercih.json (TAM yeniden yaz — append degil) + atamalar.jsonl (append)
//   + mudahale.jsonl (append) + log.jsonl (append — istek logu maddesi: her POST bir satir).
//   Kume disi HICBIR yola yazma yok (YAZMA_IZINLI denetimi + DENEY_DIR onek denetimi); kullanici girdisi
//   hicbir dosya yolu kurulumuna girmez — yollar yalniz sabit dosya adlarindan kurulur.
// Okuma: her istekte diskten (onbellek YOK — restart gerektirmeden taze). Dosya yoksa alan durust bos/sifir;
//   sahte veri uretilmez. Bozuk JSONL satiri atlanir + sayilir (konsola hata satiri).
// Konsol: baslangic satiri (port + dizin) + hata satirlari. Emoji yok, renk kodu yok.
// K8 ADIM-A (2026-10-29): CORS basliklari ACILDI — tuval (4377 kapsul-tuval.html) bu sunucudan
//   fetch ile GERCEK veri ceker; preflight OPTIONS 204. Kapsam yalniz bu IZOLE deney sunucusu —
//   pano/server.js (4377) CORS'suz kalir (K8 sonunda tek sunucuya gider — K-0055).
// BAKIM GP-1 (2026-11-01; GUVENLIK-DENETCI bulgulari GD-001/002/008):
//   GD-001 — CORS tek SABIT kaynak: '*' KALDIRILDI; Access-Control-Allow-Origin artik
//     DENEY_CORS_ORIGIN ortam degiskeninden (varsayilan http://127.0.0.1:4377 — tek koprü).
//     Tum POST uclari PANO_TOKEN fail-closed: token TANIMSIZ -> 403, baslik (x-pano-token)
//     YANLIS -> 401 (uretim sunucusuyla ayni env, ayni baslik). Yerel CSRF yazma yuzeyi kapanir.
//   GD-002 — manager-yanit ucu ayni token kapisindan gecer + kayda 'dogrulanmamis: true'
//     isareti: token CAGIRANI (operator koprusu) dogrular; icerigin gercekten ai-manager'dan
//     geldigi sunucu tarafindan dogrulanamaz (E10 durustluk — okuyucu yaniltmaz).
//   GD-008 — durum okuma katmani: her istekte dosya STAT edilir (tazelik korunur — restart
//     gerektirmeden taze); mtime VE boyut eslesirse DISKTEN YENIDEN OKUNMAZ; JSONL kuyruklari
//     son-N'i TAIL penceresiyle okur (tam tarama YOK — dosya buyudukce maliyet sabit kalir);
//     perf_hooks olcum noktasi: istek suresi + okunan bayt/sayi, yanitin 'perf' alaninda
//     tasinir (O2 puaninin olcum kaynagi — puani ajan YAZAMAZ, yalniz olcum alanindan turer).

import http from 'node:http';
import { appendFileSync, closeSync, existsSync, openSync, readFileSync, readSync, statSync, writeFileSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { atamaTaslakla, atanabilirler, onayla } from './graf-yonetim.js';
import { atamaDurum, atamaYaz } from './graf-yaz.mjs';

// --- sabitler -------------------------------------------------------------------

const VARSAYILAN_PORT = 4930;
const VARSAYILAN_DIR = join(import.meta.dirname, '..', 'raporlar', 'deney-canli-panel-2026-10-29');
const PANEL_YOLU = join(import.meta.dirname, 'deney-panel.html'); // panel pano/ evinde (kapsul-tuval.html kardesi)
const GOVDE_LIMIT_BAYT = 4096;      // POST govde tavaninin ustu -> 400
const NOT_LIMIT_KAR = 2000;         // mudahale not tavaninin ustu -> 400
const AKTOR = 'insan:web';          // deneyde tek kalem sahibi insan (vekil/ajan yok — graf-yonetim kurali)
const KUYRUK = { log: 80, atamalar: 20, mudahale: 10 }; // /api/deney/durum yanitindaki son-N kuyruklari
const YAZMA_IZINLI = ['tercih.json', 'atamalar.jsonl', 'atamalar-onay.jsonl', 'mudahale.jsonl', 'log.jsonl', 'manager-kuyruk.jsonl'];
const VARSAYILAN_CORS_ORIGIN = 'http://127.0.0.1:4377'; // GD-001: tek koprü kaynagi (tuval) — '*' KALDIRILDI
const KUYRUK_PENCERE_BAYT = 16384;  // GD-008: tail okuma baslangic penceresi (16 KiB — 80 kayit icin bol)

// --- durum (modul kapsami — baslat() override eder) -------------------------------

let sunucu = null;                                                   // aktif http.Server
let aktifDir = process.env.DENEY_DIR || VARSAYILAN_DIR;              // deney veri dizini
let aktifToken = null;                                               // GD-001: POST kapisi sirri (null = fail-closed 403)
let aktifCorsOrigin = VARSAYILAN_CORS_ORIGIN;                        // GD-001: baslat() cozumler (env DENEY_CORS_ORIGIN)

const sunucuSaati = () => new Date().toISOString();

// --- GD-008: olcum noktasi + dogrulamali okuma katmani ----------------------------
//
// Olcum (O2 puan kaynagi — puani ajan YAZAMAZ, yalniz olcum alanindan turetilir; K8-2 SH/f):
//   durumIstek = durum uc istek sayisi · diskOkuma = diskten gercek veri okuma cagrisi
//   (STAT HARIC — metadata okumalari sayilmaz) · okunanBayt = diskten okunan toplam bayt ·
//   sure degerleri perf_hooks performance.now() ile olculur (tahmin YOK).
const olcum = { durumIstek: 0, diskOkuma: 0, okunanBayt: 0, toplamSureMs: 0, sonSureMs: null, sonOkunanBayt: 0 };

export function olcumOku() {
  return {
    durumIstek: olcum.durumIstek,
    diskOkuma: olcum.diskOkuma,
    okunanBayt: olcum.okunanBayt,
    sonSureMs: olcum.sonSureMs,
    sonOkunanBayt: olcum.sonOkunanBayt,
    toplamSureMs: olcum.toplamSureMs,
    ortSureMs: olcum.durumIstek > 0 ? olcum.toplamSureMs / olcum.durumIstek : null,
  };
}

// Diskten okuma (olcume isler — stat haric yalniz gercek veri okumasi sayilir).
function diskOku(yol) {
  const tampon = readFileSync(yol);
  olcum.diskOkuma += 1;
  olcum.okunanBayt += tampon.length;
  return tampon;
}

// Byte-offset okuma (tail penceresi): [ofset, ofset+uzunluk) araligini tek readSync ile.
function aralikOku(yol, ofset, uzunluk) {
  const fd = openSync(yol, 'r');
  try {
    const tampon = Buffer.alloc(uzunluk);
    const okunan = readSync(fd, tampon, 0, uzunluk, ofset);
    olcum.diskOkuma += 1;
    olcum.okunanBayt += okunan;
    return tampon.subarray(0, okunan);
  } finally { closeSync(fd); }
}

// mtime+boyut eslesmesi (dogrulamali onbellek anahtari — eslesirse diskten okuma YOK).
function statEslesir(kayit, st) { return !!kayit && kayit.mtimeMs === st.mtimeMs && kayit.size === st.size; }

const jsonOnbellek = new Map();    // yol -> { mtimeMs, size, deger } — JSON.parse sonucu
const kuyrukOnbellek = new Map();  // yol -> { mtimeMs, size, deger } — son-N kuyruk (tail) sonucu

// --- okuma yardimcilari (her cagrida STAT; degisince diskten — onbellek yalniz dogrulanmis) ---

// JSON dosya: yok/bozuksa null (durust bos — sahte veri uretilmez); bozuksa konsola hata satiri.
// GD-008: stat eslesirse onbellekten doner (diskten okuma YOK). Durustluk notu: NTFS mtime
// cozunurlugu ~100ns — ayni boyut + ayni an yazisi TEORIK kacaktir; append dosyalarda boyut her
// yazista buyur (yakalanir), tercih.json insan hizinda POST'lanir. Bu katman perf icindir,
// guvenlik degil: en kotu durum GECIKMELI tazelik, veri kaybi degil.
function jsonOku(yol) {
  let st = null;
  try { st = statSync(yol); } catch { return null; }
  const c = jsonOnbellek.get(yol);
  if (statEslesir(c, st)) return c.deger;
  let deger = null;
  try { deger = JSON.parse(diskOku(yol).toString('utf8')); }
  catch (e) { console.error('[deney-server] bozuk JSON atlandi: ' + yol); deger = null; }
  jsonOnbellek.set(yol, { mtimeMs: st.mtimeMs, size: st.size, deger });
  return deger;
}

// JSONL dosya: satir satir; bozuk satir ATLANIR + SAYILIR; donus {satirlar, bozukSatir} (tumu).
// GD-008: TAM TARAMA bilincli kalir — yalniz YAZMA yollari (atama/graf-onay) kullanir; gecmis
// surum zinciri icin dosyanin TAMAMINI gormek zorundadir. Durum ucu bunu KULLANMAZ (jsonlKuyruk).
function jsonlOku(yol) {
  const bos = { satirlar: [], bozukSatir: 0 };
  try {
    if (!existsSync(yol)) return bos;
    const satirlar = [];
    let bozukSatir = 0;
    for (const satir of diskOku(yol).toString('utf8').split(/\r?\n/)) {
      const k = satir.trim();
      if (!k) continue;
      try { satirlar.push(JSON.parse(k)); } catch { bozukSatir++; }
    }
    if (bozukSatir > 0) console.error('[deney-server] ' + bozukSatir + ' bozuk satir atlandi: ' + yol);
    return { satirlar, bozukSatir };
  } catch (e) {
    console.error('[deney-server] jsonl okunamadi: ' + yol);
    return bos;
  }
}

// GD-008 — son-N kuyruk (TAIL) okuma: dosyanin SONUNDAN pencere okunur (baslangic 16 KiB),
// n kayda yetmezse pencere 4x buyur (dosya basina kadar); ofset>0 ise ilk YARIM satir atilir
// (bayt siniri cok baytli UTF-8 karakteri kesmis olabilir — yarim satir zaten atilir, bozulma
// pencere disina sizmaz). mtime+boyut eslesirse onceki sonuc doner (diskten okuma YOK).
// Yanit semanticleri jsonlOku+sonN ile BIREBIR ayni (son-N kayit ayni; bozuk sayimi yalniz
// pencere icin — yanitta kullanimda degisiklik yok).
function jsonlKuyruk(yol, n) {
  const bos = { satirlar: [], bozukSatir: 0 };
  let st = null;
  try { st = statSync(yol); } catch { return bos; }
  const c = kuyrukOnbellek.get(yol);
  if (statEslesir(c, st)) return c.deger;
  let deger = bos;
  let pencere = Math.min(st.size, KUYRUK_PENCERE_BAYT);
  while (pencere > 0) {
    const ofset = st.size - pencere;
    const metin = (ofset > 0 ? aralikOku(yol, ofset, pencere) : diskOku(yol)).toString('utf8');
    const satirlar = [];
    let bozukSatir = 0;
    let basla = 0;
    if (ofset > 0) {
      const ilkYeniSatir = metin.indexOf('\n');
      if (ilkYeniSatir < 0) { pencere = pencereBonyelt(st.size, pencere); if (pencere === 0) break; continue; } // tek yarim satir — buyut
      basla = ilkYeniSatir + 1; // ilk yarim satir ATILIR
    }
    for (const satir of metin.slice(basla).split(/\r?\n/)) {
      const k = satir.trim();
      if (!k) continue;
      try { satirlar.push(JSON.parse(k)); } catch { bozukSatir++; }
    }
    if (satirlar.length >= n || ofset === 0) { deger = { satirlar: sonN(satirlar, n), bozukSatir }; break; }
    pencere = pencereBonyelt(st.size, pencere);
    if (pencere === 0) break;
  }
  kuyrukOnbellek.set(yol, { mtimeMs: st.mtimeMs, size: st.size, deger });
  return deger;
}

// Pencereyi 4x buyut; dosya boyununa ulasildiysa 0 (kilitlenme korumasi).
function pencereBonyelt(dosyaBoyutu, pencere) {
  const yeni = Math.min(dosyaBoyutu, pencere * 4);
  return yeni > pencere ? yeni : 0;
}

const sonN = (dizi, n) => (Array.isArray(dizi) ? dizi.slice(-n) : []);

// --- yazma yardimcilari (fail-closed: kume + onek denetimi) ----------------------

// Yalniz 4 izinli dosya adi + yalniz DENEY_DIR icine. Ihlalde Error (cagiran 500'e cevirir).
function yazmaYolu(dosyaAdi) {
  if (!YAZMA_IZINLI.includes(dosyaAdi)) {
    throw new Error('GUVENLIK RED: yazma kumesi disi dosya: ' + String(dosyaAdi));
  }
  const kok = resolve(aktifDir);
  const yol = resolve(kok, dosyaAdi);
  if (!yol.startsWith(kok + sep)) {
    throw new Error('GUVENLIK RED: DENEY_DIR disina yazma denemesi: ' + yol);
  }
  return yol;
}

// TAM YENIDEN YAZ (tercih.json icin — tek tercih, append degil).
function dosyaYazTam(dosyaAdi, icerik) {
  writeFileSync(yazmaYolu(dosyaAdi), icerik, 'utf8');
}

// APPEND — satir basina JSON (jsonl dosyalari icin).
function satirEkle(dosyaAdi, kayit) {
  appendFileSync(yazmaYolu(dosyaAdi), JSON.stringify(kayit) + '\n', 'utf8');
}

// Istek logu: her POST (basarili/hatali) TAM BIR satir. Anahtar degeri ASLA yazilmaz —
// bu deneyde anahtar yok, ilke ayni: metin kisa ozettir (model/ajan/gerekce), govde degil.
function istekGunlugu(gunluk) {
  try {
    satirEkle('log.jsonl', { t: sunucuSaati(), tur: gunluk.tur, metin: gunluk.metin });
  } catch (e) {
    console.error('[deney-server] istek logu yazilamadi: ' + (e && e.message));
  }
}

// --- yanit yardimcilari ---------------------------------------------------------

// K8 ADIM-A — CORS koprüsü: tek kaynak (ayni makine 127.0.0.1). Yalniz bu izole deney sunucusu.
// GD-001 (BAKIM GP-1): '*' KALDIRILDI — deger SABIT (DENEY_CORS_ORIGIN, varsayilan 4377 tuval).
//   Sabit-deger ACAO: baska origin'deki sayfa tarayici tarafindan OKUYAMAZ (CORS eslesmesi
//   zorunlu); yazma yuzeyi ayrica token kapisiyla kapalidir (postIsci). X-Pano-Token basligi
//   Allow-Headers'ta — tuvalin token'li POST'lari preflight'ten gecer (GD-002 istemci esi).
function corsBaslik() {
  return {
    'Access-Control-Allow-Origin': aktifCorsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, X-Pano-Token',
  };
}

function jsonYaz(res, kod, obj) {
  res.writeHead(kod, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...corsBaslik() });
  res.end(JSON.stringify(obj));
}

// Yaniti yaz + yalniz POST ise istek logunu dus (her POST tam bir satir; GET loglanmaz).
// gunluk yoksa (yanitin KENDISI zaten logda olan uclar) istek ozeti dusmez — cift kayit onlenir.
function yanitla(req, res, kod, govde, gunluk) {
  jsonYaz(res, kod, govde);
  if (req && req.method === 'POST' && gunluk) istekGunlugu(gunluk);
}

// POST govdesi: parca parca topla; limit asilinca tampon atilir ve akis cekilir (drain),
// 'end' uzerinde limit hataasiyla cozulur. Istek koparsa 'govde okunamadi'.
function govdeOku(req) {
  return new Promise((tamam) => {
    const parcalar = [];
    let bayt = 0;
    let fazla = false;
    let bitti = false;
    const bitir = (r) => { if (!bitti) { bitti = true; tamam(r); } };
    req.on('data', (p) => {
      if (fazla) return; // tasma sonrasi veri cekilir, tamponlanmaz
      bayt += p.length;
      if (bayt > GOVDE_LIMIT_BAYT) { fazla = true; parcalar.length = 0; return; }
      parcalar.push(p);
    });
    req.on('end', () => bitir(fazla
      ? { hata: 'govde cok buyuk (maks ' + GOVDE_LIMIT_BAYT + ' bayt)' }
      : { govde: Buffer.concat(parcalar) }));
    req.on('error', () => bitir({ hata: 'govde okunamadi' }));
  });
}

// --- GET uclari -----------------------------------------------------------------

// GET /deney — paneli HER istekte diskten oku (restart yok). Panel yoksa 503 durust metin.
function panelIsci(req, res) {
  try {
    const html = readFileSync(PANEL_YOLU);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(html);
  } catch (e) {
    if (!e || e.code !== 'ENOENT') console.error('[deney-server] panel okunamadi: ' + (e && e.message));
    res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('deney-panel.html henuz yok — panel yazari teslim etmedi. Sunucu ayakta; /api/deney/durum calisiyor. Beklenen dosya: ' + PANEL_YOLU);
  }
}

// GET /api/deney/durum — tek JSON; panel 5 sn'de bir ceker. Hepsi diskten, o anda.
// BIRLESTIRME (K8 ilk adim): ordu graf SSOT da burada tasinir — deney paneli ile ana panel TEK veri
// kaynagini paylasir. Salt okuma; SSOT dosyasina yazma YOK (write-set degismedi).
const GRAF_SSOT = join(import.meta.dirname, '..', 'plans', 'gorev-grafigi-2026-10-26.json');
function grafGovdesi() {
  const g = jsonOku(GRAF_SSOT);
  if (!g || !Array.isArray(g.gorevler)) return null;
  return {
    grafSurumu: g.grafSurumu != null ? g.grafSurumu : null,
    is: g.is != null ? g.is : null,
    gorevSayisi: g.gorevler.length,
    kapaliSayisi: g.gorevler.filter((x) => String(x.durum || '').indexOf('KAPALI') >= 0).length,
    gorevler: g.gorevler.map((x) => ({
      id: x.id, gorev: x.gorev, rol: x.rol, dizin: x.dizin, durum: x.durum,
      bagimli: Array.isArray(x.bagimli) ? x.bagimli : [], olcut: x.olcut, loc: x.loc,
    })),
  };
}

function durumGovdesi() {
  const sag = jsonOku(join(aktifDir, 'saglayicilar.json'));
  const mod = jsonOku(join(aktifDir, 'modeller.json'));
  const wsp = jsonOku(join(aktifDir, 'workspaces.json'));
  const tercih = jsonOku(join(aktifDir, 'tercih.json'));
  const ajn = jsonOku(join(aktifDir, 'ajanlar.json'));
  const gor = jsonOku(join(aktifDir, 'gorevler.json'));
  const ornek = ajn && Array.isArray(ajn.ornek) ? ajn.ornek : [];
  const gorevler = gor && Array.isArray(gor.gorevler) ? gor.gorevler : [];

  // ATANABILIR — G9 cekirdegi CANLI: atanabilirler(gorev, ornekKumesi) graf-yonetim.js'ten.
  const atanabilir = {};
  for (const g of gorevler) {
    if (!g || g.id === undefined) continue;
    try { atanabilir[g.id] = atanabilirler(g, ornek); }
    catch (e) { atanabilir[g.id] = { hata: e && e.message }; } // tek gorevi bozsa butun durum cökmez
  }

  const sagListe = sag && Array.isArray(sag.list) ? sag.list : [];
  let modelSayisi = 0;
  if (mod && typeof mod.modelSayisi === 'number') modelSayisi = mod.modelSayisi;
  else if (mod && mod.saglayicilar && typeof mod.saglayicilar === 'object') {
    modelSayisi = Object.values(mod.saglayicilar).reduce((t, l) => t + (Array.isArray(l) ? l.length : 0), 0);
  }

  return {
    sunucuSaati: sunucuSaati(),
    envanter: {
      saglayiciSayisi: sagListe.length,
      aktifSaglayiciSayisi: sagListe.filter((s) => s && s.enabled === true).length,
      modelSayisi,
      workspaceSayisi: wsp && typeof wsp.toplam === 'number' ? wsp.toplam : 0,
      // K8 ADIM-B: PROJE secicisi GERCEK workspace listesi tasiyinca tasir (diskten; sahte proje YOK).
      // digerlerindenOrnek = envanter cekimindeki orneklem (tam liste degil — sayi toplam alani).
      workspaces: {
        deney: wsp && wsp.deneyWorkspace ? wsp.deneyWorkspace : null,
        ornek: wsp && Array.isArray(wsp.digerlerindenOrnek) ? wsp.digerlerindenOrnek : [],
      },
      // G9-yama (mudahale 'sol sutun bos'): panel envanter.saglayicilar bekliyor — kart basina kendi modelleri gomulu.
      // Veri zaten diskte (saglayicilar.json + modeller.json); KAPALI saglayici model listesi cekilmedigi icin bos kalir (dorust).
      saglayicilar: sagListe.map((s) => ({
        id: s && s.id,
        label: s && s.label,
        enabled: !!(s && s.enabled === true),
        not: s && s.not,
        modeller: (mod && mod.saglayicilar && mod.saglayicilar[s && s.id]) || [],
      })),
    },
    tercih: tercih || null,
    gorevler,
    atanabilir,
    atamalar: jsonlKuyruk(join(aktifDir, 'atamalar.jsonl'), KUYRUK.atamalar).satirlar,
    log: jsonlKuyruk(join(aktifDir, 'log.jsonl'), KUYRUK.log).satirlar,
    mudahale: jsonlKuyruk(join(aktifDir, 'mudahale.jsonl'), KUYRUK.mudahale).satirlar,
    graf: grafGovdesi(),               // ordu SSOT — birleşme: deney paneli ana veriyi gösterir
    manager: {
      aktor: 'ai-manager:glm-5.3',
      ajan: 'deney-manager-g9',
      paseoAgentId: 'bfda53a3-8e52-4c47-922c-337dfbdf7cca',
      rol: 'ROLLER/manager.md (deney-g9-repo)',
      bekleyenIs: jsonlKuyruk(join(aktifDir, 'manager-kuyruk.jsonl'), 10).satirlar
        .filter((k) => k && k.is === 'chat').length,
    },
    ajanlar: {
      kosanPaseo: ajn && Array.isArray(ajn.kosanPaseo) ? ajn.kosanPaseo : [],
      ornek,
    },
  };
}

// JSONL buyume izi (O2 kaynagi — dosya boyutlari bayt cinsinden, stat'ten; tahmin YOK).
function jsonlBoyutlari() {
  const boyut = {};
  for (const ad of ['atamalar.jsonl', 'log.jsonl', 'mudahale.jsonl', 'manager-kuyruk.jsonl']) {
    try { boyut[ad] = statSync(join(aktifDir, ad)).size; } catch { boyut[ad] = 0; }
  }
  return boyut;
}

function durumIsci(req, res) {
  // GD-008 perf_hooks OLCUM NOKTASI: istek suresi (performance.now — perf_hooks) + bu istekte
  // diskten okunan bayt/cagri sayisi + buyume izi. Yanitin 'perf' alani O2 puaninin OLCUM
  // KAYNAGIDIR (K8-2 SH/f: puani ajan YAZAMAZ — yalniz bu olcum alanindan turetilir).
  olcum.durumIstek += 1;
  const baytOnce = olcum.okunanBayt;
  const okumaOnce = olcum.diskOkuma;
  const t0 = performance.now();
  const govde = durumGovdesi();
  const sureMs = performance.now() - t0;
  olcum.toplamSureMs += sureMs;
  olcum.sonSureMs = sureMs;
  olcum.sonOkunanBayt = olcum.okunanBayt - baytOnce;
  govde.perf = {
    istekSuresiMs: Math.round(sureMs * 1000) / 1000,
    okunanBayt: olcum.sonOkunanBayt,
    okumaSayisi: olcum.diskOkuma - okumaOnce,
    durumIstek: olcum.durumIstek,
    jsonlBoyut: jsonlBoyutlari(),
  };
  jsonYaz(res, 200, govde);
}

// --- POST isleri (token kapisi -> dogrulama -> disk yazma -> gunluk) ----------------

// GD-001/GD-002: token karsilastirmasi ZAMAN-SABIT (GD-004 deseni — ayni uygulama burada da):
// uzunluk on-kontrolu yapilir (timingSafeEqual uzunluk farkinda ATAR), sonra icerik.
// Token DEGERI hicbir yere (yanit/log/konsol) yazilmaz — SH-g.
function tokenEsitMi(gelen) {
  if (typeof gelen !== 'string' || !aktifToken) return false;
  const a = Buffer.from(gelen);
  const b = Buffer.from(aktifToken);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Ortak POST boru hatti: TOKEN KAPISI (GD-001 — tum deney POST uclari, fail-closed:
// tanimli token YOK -> 403 yazma kapali; baslik yanlis -> 401) -> govde limiti -> JSON parse
// -> isle -> yanit + istek logu. Red satirlari da log'a duser (audit; token DEGERI yazilmaz).
async function postIsci(req, res, ad, isle) {
  if (!aktifToken) {
    return yanitla(req, res, 403, { hata: 'PANO_TOKEN tanimli degil — deney yazma kapali (fail-closed)' }, { tur: 'hata', metin: ad + ' RED: PANO_TOKEN tanimli degil (403 fail-closed)' });
  }
  if (!tokenEsitMi(req.headers['x-pano-token'])) {
    return yanitla(req, res, 401, { hata: 'token gecersiz' }, { tur: 'hata', metin: ad + ' RED: token gecersiz (401)' });
  }
  const okunan = await govdeOku(req);
  if (okunan.hata) {
    return yanitla(req, res, 400, { hata: okunan.hata }, { tur: 'hata', metin: ad + ' RED: ' + okunan.hata });
  }
  let govde = null;
  try {
    govde = JSON.parse(okunan.govde.toString('utf8'));
  } catch {
    return yanitla(req, res, 400, { hata: 'govde JSON degil' }, { tur: 'hata', metin: ad + ' RED: govde JSON degil' });
  }
  try {
    const sonuc = isle(govde);
    return yanitla(req, res, sonuc.kod, sonuc.govde, sonuc.gunluk);
  } catch (e) {
    console.error('[deney-server] beklenmeyen hata (' + ad + '): ' + (e && e.message));
    return yanitla(req, res, 500, { hata: 'sunucu hatasi' }, { tur: 'hata', metin: ad + ' RED: sunucu hatasi' });
  }
}

const nesneDegil = (g) => !g || typeof g !== 'object' || Array.isArray(g);

// POST /api/deney/tercih — {provider, model} -> tercih.json TAM YENIDEN YAZ.
function tercihIsle(govde) {
  if (nesneDegil(govde)) {
    return { kod: 400, govde: { hata: 'govde nesne degil' }, gunluk: { tur: 'hata', metin: 'tercih RED: govde nesne degil' } };
  }
  const provider = govde.provider;
  const model = govde.model;
  const sag = jsonOku(join(aktifDir, 'saglayicilar.json'));
  const mod = jsonOku(join(aktifDir, 'modeller.json'));
  const sagVar = !!(sag && Array.isArray(sag.list) && sag.list.some((s) => s && s.id === provider));
  const modListe = mod && mod.saglayicilar && Array.isArray(mod.saglayicilar[provider]) ? mod.saglayicilar[provider] : [];
  const modVar = modListe.some((m) => m && m.id === model);
  if (!sagVar || !modVar) {
    return {
      kod: 400,
      govde: { hata: 'saglayici/model bulunamadi' },
      gunluk: { tur: 'hata', metin: 'tercih RED: saglayici/model bulunamadi (' + String(provider) + '/' + String(model) + ')' },
    };
  }
  const t = sunucuSaati();
  dosyaYazTam('tercih.json', JSON.stringify({ provider, model, t }, null, 2) + '\n');
  return {
    kod: 200,
    govde: { tamam: true, provider, model, t },
    gunluk: { tur: 'tercih', metin: 'tercih yazildi: ' + provider + '/' + model },
  };
}

// POST /api/deney/atama — {gorevId, ajanAd} -> son atamayi bul -> atamaTaslakla -> APPEND.
function atamaIsle(govde) {
  if (nesneDegil(govde)) {
    return { kod: 400, govde: { hata: 'govde nesne degil' }, gunluk: { tur: 'hata', metin: 'atama RED: govde nesne degil' } };
  }
  const gorevId = govde.gorevId;
  const ajanAd = govde.ajanAd;
  const gor = jsonOku(join(aktifDir, 'gorevler.json'));
  const ajn = jsonOku(join(aktifDir, 'ajanlar.json'));
  const gorevler = gor && Array.isArray(gor.gorevler) ? gor.gorevler : [];
  const ornek = ajn && Array.isArray(ajn.ornek) ? ajn.ornek : [];
  if (!gorevler.some((g) => g && g.id === gorevId)) {
    return {
      kod: 400,
      govde: { hata: 'gorev bulunamadi: ' + String(gorevId) },
      gunluk: { tur: 'hata', metin: 'atama RED: gorev bulunamadi (' + String(gorevId) + ')' },
    };
  }
  if (!ornek.some((a) => a && a.ad === ajanAd)) {
    return {
      kod: 400,
      govde: { hata: 'ajan bulunamadi: ' + String(ajanAd) },
      gunluk: { tur: 'hata', metin: 'atama RED: ajan bulunamadi (' + String(ajanAd) + ')' },
    };
  }
  // O gorevin SON atamasi (atamalar.jsonl'in tam taramasindaki son eslesme).
  const kayitlar = jsonlOku(join(aktifDir, 'atamalar.jsonl')).satirlar;
  let sonAtama = null;
  for (const k of kayitlar) {
    if (k && k.gorevId === gorevId) sonAtama = k;
  }
  try {
    const taslak = atamaTaslakla(gorevId, ajanAd, sonAtama, AKTOR, sunucuSaati());
    satirEkle('atamalar.jsonl', taslak);
    return {
      kod: 200,
      govde: { tamam: true, taslak },
      gunluk: { tur: 'atama', metin: 'atama taslagi: ' + String(gorevId) + ' -> ' + String(ajanAd) + ' (surum ' + taslak.surum + ')' },
    };
  } catch (e) {
    // graf-yonetim RED'leri (actor/tarih kurallari) — 400'e cevrilir.
    return { kod: 400, govde: { hata: e && e.message }, gunluk: { tur: 'hata', metin: 'atama RED: ' + (e && e.message) } };
  }
}

function grafOnayIsle(govde) {
  if (nesneDegil(govde)) {
    return { kod: 400, govde: { hata: 'govde nesne degil' }, gunluk: { tur: 'hata', metin: 'graf-onay RED: govde nesne degil' } };
  }
  const gorevId = govde.gorevId;
  if (typeof gorevId !== 'string' || !gorevId.trim()) {
    return { kod: 400, govde: { hata: 'gorevId string+trim degil' }, gunluk: { tur: 'hata', metin: 'graf-onay RED: gorevId string+trim degil' } };
  }
  const kayitlar = jsonlOku(join(aktifDir, 'atamalar.jsonl')).satirlar;
  const taslak = [...kayitlar].reverse().find((k) => k && k.gorevId === gorevId && k.onay === 'TASLAK');
  if (!taslak) {
    return {
      kod: 400,
      govde: { hata: 'onay bekleyen TASLAK yok: ' + gorevId },
      gunluk: { tur: 'hata', metin: 'graf-onay RED: onay bekleyen TASLAK yok: ' + gorevId },
    };
  }
  try {
    const onayli = onayla(taslak, AKTOR);
    const sonuc = atamaYaz(onayli, join(aktifDir, 'atamalar-onay.jsonl'));
    return {
      kod: 200,
      govde: { tamam: true, kayit: onayli, yazildi: sonuc.yazildi, mevcut: sonuc.mevcut, toplam: sonuc.toplam },
      gunluk: {
        tur: 'graf-onay',
        metin: 'graf onay: ' + gorevId + ' surum ' + onayli.surum + ' -> defter (' + (sonuc.yazildi ? 'yazildi' : 'mevcut') + ')',
      },
    };
  } catch (e) {
    return { kod: 400, govde: { hata: e && e.message }, gunluk: { tur: 'hata', metin: 'graf-onay RED: ' + (e && e.message) } };
  }
}

// POST /api/deney/mudahale — {metin|not} -> mudahale.jsonl APPEND {t, kim, not}.
function mudahaleIsle(govde) {
  if (nesneDegil(govde)) {
    return { kod: 400, govde: { hata: 'govde nesne degil' }, gunluk: { tur: 'hata', metin: 'mudahale RED: govde nesne degil' } };
  }
  const not = typeof govde.metin === 'string' ? govde.metin : govde.not;
  if (typeof not !== 'string') {
    return { kod: 400, govde: { hata: 'metin degil' }, gunluk: { tur: 'hata', metin: 'mudahale RED: metin degil' } };
  }
  const kirpilmis = not.trim();
  if (!kirpilmis) {
    return { kod: 400, govde: { hata: 'not bos olamaz' }, gunluk: { tur: 'hata', metin: 'mudahale RED: not bos olamaz' } };
  }
  if (not.length > NOT_LIMIT_KAR) {
    return {
      kod: 400,
      govde: { hata: 'not ' + NOT_LIMIT_KAR + ' karakterden uzun' },
      gunluk: { tur: 'hata', metin: 'mudahale RED: not uzun (' + not.length + ' karakter)' },
    };
  }
  const secim = {
    provider: typeof govde.provider === 'string' ? govde.provider.slice(0, 100) : undefined,
    model: typeof govde.model === 'string' ? govde.model.slice(0, 100) : undefined,
    rol: typeof govde.rol === 'string' ? govde.rol.slice(0, 30) : undefined,
  };
  satirEkle('mudahale.jsonl', { t: sunucuSaati(), kim: AKTOR, not: kirpilmis, ...secim });
  // manager kuyrugu: her insan notu manager'a iletilecek is olarak duser (operator kopru paseo MCP ile tasir;
  // secilen model/rol kuyrukta tasinarak operator o modelde ajan dogurur ya da manager'a iletir).
  satirEkle('manager-kuyruk.jsonl', { t: sunucuSaati(), is: 'chat', not: kirpilmis, ...secim });
  const ozet = secim.provider
    ? 'mudahale kaydedildi (' + kirpilmis.length + ' karakter) + kuyruga dustu [hedef ' + secim.provider + '/' + String(secim.model) + ' rol ' + String(secim.rol) + ']'
    : 'mudahale kaydedildi (' + kirpilmis.length + ' karakter) + manager kuyruguna is dustu';
  return { kod: 200, govde: { tamam: true }, gunluk: { tur: 'mudahale', metin: ozet } };
}

// POST /api/deney/api-test — {provider, model} -> manager-kuyruk.jsonl'a 'api-test' isi.
// GERCEK cagriyi operator koprusu yapar (paseo MCP o modelde tek-soru spawn; ucretsiz uclar oncelik).
// Sunucunun kendisi saglayici anahtarina erisemez — fail-closed: yalniz is kaydi dusulur, sahte test sonucu uretilmez.
function apiTestIsle(govde) {
  if (nesneDegil(govde)) {
    return { kod: 400, govde: { hata: 'govde nesne degil' }, gunluk: { tur: 'hata', metin: 'api-test RED: govde nesne degil' } };
  }
  const provider = govde.provider;
  const model = govde.model;
  const sag = jsonOku(join(aktifDir, 'saglayicilar.json'));
  const mod = jsonOku(join(aktifDir, 'modeller.json'));
  const sagVar = !!(sag && Array.isArray(sag.list) && sag.list.some((s) => s && s.id === provider));
  const modListe = mod && mod.saglayicilar && Array.isArray(mod.saglayicilar[provider]) ? mod.saglayicilar[provider] : [];
  const modVar = modListe.some((m) => m && m.id === model);
  if (!sagVar || !modVar) {
    return {
      kod: 400,
      govde: { hata: 'saglayici/model bulunamadi' },
      gunluk: { tur: 'hata', metin: 'api-test RED: saglayici/model bulunamadi (' + String(provider) + '/' + String(model) + ')' },
    };
  }
  const t = sunucuSaati();
  satirEkle('manager-kuyruk.jsonl', { t, is: 'api-test', provider, model });
  return {
    kod: 200,
    govde: { tamam: true, t, not: 'test isi kuyruga dustu — operator kopru paseo MCP ile gercek cagriyi yapar, sonuc loga duser' },
    gunluk: { tur: 'api-test', metin: 'test istendi: ' + provider + '/' + model + ' — kopru kuyruga dustu' },
  };
}

// POST /api/deney/ajan-ata — {proje, ajanAd, provider, model, rol, gorev?, rolMd?} -> atamalar.jsonl 'ajan-atama'.
// KADRO atamasi (spawn tanimi: hangi saglayici/model/rol hangi projede). Gorev->ORNEK TASLAK zinciri ayri
// ucta (/api/deney/atama) yasar — graf-yonetim atamaTaslakla orada. rolMd ZORUNLU DEGIL (kullanici emri).
function ajanAtaIsle(govde) {
  if (nesneDegil(govde)) {
    return { kod: 400, govde: { hata: 'govde nesne degil' }, gunluk: { tur: 'hata', metin: 'ajan-ata RED: govde nesne degil' } };
  }
  const metinAlan = (ad, max, zorunlu) => {
    const v = govde[ad];
    if (typeof v !== 'string' || !v.trim()) {
      if (zorunlu) return { hata: ad + ' zorunlu' };
      return { deger: undefined };
    }
    return { deger: v.trim().slice(0, max) };
  };
  const proje = metinAlan('proje', 200, true);
  if (proje.hata) return { kod: 400, govde: { hata: proje.hata }, gunluk: { tur: 'hata', metin: 'ajan-ata RED: ' + proje.hata } };
  const ajanAd = metinAlan('ajanAd', 100, true);
  if (ajanAd.hata) return { kod: 400, govde: { hata: ajanAd.hata }, gunluk: { tur: 'hata', metin: 'ajan-ata RED: ' + ajanAd.hata } };
  const provider = metinAlan('provider', 100, true);
  if (provider.hata) return { kod: 400, govde: { hata: provider.hata }, gunluk: { tur: 'hata', metin: 'ajan-ata RED: ' + provider.hata } };
  const model = metinAlan('model', 100, true);
  if (model.hata) return { kod: 400, govde: { hata: model.hata }, gunluk: { tur: 'hata', metin: 'ajan-ata RED: ' + model.hata } };
  const rol = metinAlan('rol', 30, true);
  if (rol.hata) return { kod: 400, govde: { hata: rol.hata }, gunluk: { tur: 'hata', metin: 'ajan-ata RED: ' + rol.hata } };
  const gorev = metinAlan('gorev', 500, false);
  const rolMd = metinAlan('rolMd', 200, false);
  // provider envanterde VAR mi (kadro kaydi gercek uca baglanir — sahte saglayici yazilamaz).
  const sag = jsonOku(join(aktifDir, 'saglayicilar.json'));
  const sagVar = !!(sag && Array.isArray(sag.list) && sag.list.some((s) => s && s.id === provider.deger));
  if (!sagVar) {
    return {
      kod: 400,
      govde: { hata: 'saglayici bulunamadi: ' + provider.deger },
      gunluk: { tur: 'hata', metin: 'ajan-ata RED: saglayici bulunamadi (' + provider.deger + ')' },
    };
  }
  const t = sunucuSaati();
  const kayit = {
    t, tur: 'ajan-atama', acan: AKTOR,
    proje: proje.deger, ajanAd: ajanAd.deger, provider: provider.deger, model: model.deger, rol: rol.deger,
    gorev: gorev.deger, rolMd: rolMd.deger, durum: 'TANIM',
  };
  satirEkle('atamalar.jsonl', kayit);
  return {
    kod: 200,
    govde: { tamam: true, kayit },
    gunluk: { tur: 'ajan-atama', metin: 'kadro: ' + ajanAd.deger + ' [' + rol.deger + '] ' + provider.deger + '/' + model.deger + ' proje ' + proje.deger + (rolMd.deger ? ' rolMd ' + rolMd.deger : '') },
  };
}

// POST /api/deney/manager-yanit — operatör KÖPRÜSÜ: paseo manager ajaninin (glm-5.3) yanitini panele tasir.
// Icerigi URETEN manager'dir (ai-manager:glm-5.3); bu uc yalniz iletimdir — aktor etiketi manager adina yazilir.
function managerYanitIsle(govde) {
  if (nesneDegil(govde)) {
    return { kod: 400, govde: { hata: 'govde nesne degil' }, gunluk: { tur: 'hata', metin: 'manager-yanit RED: govde nesne degil' } };
  }
  const metin = govde.metin;
  if (typeof metin !== 'string' || !metin.trim()) {
    return { kod: 400, govde: { hata: 'yanit metni bos' }, gunluk: { tur: 'hata', metin: 'manager-yanit RED: metin bos' } };
  }
  if (metin.length > NOT_LIMIT_KAR) {
    return { kod: 400, govde: { hata: 'yanit ' + NOT_LIMIT_KAR + ' karakterden uzun' }, gunluk: { tur: 'hata', metin: 'manager-yanit RED: uzun (' + metin.length + ')' } };
  }
  const t = sunucuSaati();
  // GD-002 (BAKIM GP-1): token CAGIRANI (operator koprusunu) dogrular; ICERIGIN gercekten
  // ai-manager:glm-5.3 tarafindan uretildigi sunucu tarafindan DOGRULANAMAZ — koprü metni
  // operatorden tasir, sunucu manager surecine erisemez. Kayit durustlukle 'dogrulanmamis'
  // isaretlenir (E10): okuyucu bu kayitlari SUNUCU DOGRULAMASI OLMAYAN aktor-atfi olarak
  // gorur. Isaret bu duzeltmeyle geldi — isaretsiz ESKI kayitlar da ayni sekilde 'dogrulanmamis'
  // varsayilmalidir (panel okuma tarafi icin not).
  satirEkle('log.jsonl', { t, tur: 'manager-yanit', metin: metin.trim(), aktor: 'ai-manager:glm-5.3', dogrulanmamis: true });
  return {
    kod: 200,
    govde: { tamam: true, t },
    gunluk: null, // yanitin kendisi ustteki satir olarak logda — istek ozeti dusmez (cift balon onlenir)
  };
}

// --- yonlendirme (bilinen uc + dogru yontem; digerleri 405/404) -------------------

const UCLAR = {
  '/deney': { GET: panelIsci },
  '/api/deney/durum': { GET: durumIsci },
  '/api/deney/graf-durum': { GET: (q, r) => jsonYaz(r, 200, atamaDurum(join(aktifDir, 'atamalar-onay.jsonl'))) },
  '/api/deney/tercih': { POST: (q, r) => postIsci(q, r, 'tercih', tercihIsle) },
  '/api/deney/atama': { POST: (q, r) => postIsci(q, r, 'atama', atamaIsle) },
  '/api/deney/graf-onay': { POST: (q, r) => postIsci(q, r, 'graf-onay', grafOnayIsle) },
  '/api/deney/mudahale': { POST: (q, r) => postIsci(q, r, 'mudahale', mudahaleIsle) },
  '/api/deney/manager-yanit': { POST: (q, r) => postIsci(q, r, 'manager-yanit', managerYanitIsle) },
  '/api/deney/api-test': { POST: (q, r) => postIsci(q, r, 'api-test', apiTestIsle) },
  '/api/deney/ajan-ata': { POST: (q, r) => postIsci(q, r, 'ajan-ata', ajanAtaIsle) },
};

export async function handler(req, res) {
  try {
    let pathname = null;
    try { pathname = new URL(req.url, 'http://127.0.0.1').pathname; } catch { pathname = null; }
    const uc = pathname ? UCLAR[pathname] : undefined;
    if (!uc) {
      // bilinmeyen yol — POST ise istek logu 'hata' satiriyla dusulur.
      return yanitla(req, res, 404, { hata: 'bilinmeyen uc' }, { tur: 'hata', metin: 'bilinmeyen uc: ' + String(pathname) });
    }
    // K8 ADIM-A — bilinen uc OPTIONS preflight'i: 204 + CORS basliklari (fetch POST json tetikler).
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', ...corsBaslik() });
      return res.end();
    }
    const isci = uc[req.method];
    if (!isci) {
      res.setHeader('Allow', Object.keys(uc).join(', '));
      return yanitla(req, res, 405, { hata: 'yontem desteklenmiyor: ' + req.method }, { tur: 'hata', metin: 'yontem RED (' + req.method + '): ' + pathname });
    }
    await isci(req, res);
  } catch (e) {
    console.error('[deney-server] isleyici hatasi: ' + (e && e.message));
    try { jsonYaz(res, 500, { hata: 'sunucu hatasi' }); } catch { /* yanit zaten gittiyse sessiz */ }
  }
}

// --- yasam dongusu (test yazari bunlari import eder) ------------------------------

function portCoz(p) {
  let deger = p;
  if (deger === undefined || deger === null || deger === '') {
    deger = process.env.DENEY_PORT !== undefined && process.env.DENEY_PORT !== '' ? process.env.DENEY_PORT : undefined;
  }
  const n = Number(deger);
  return Number.isFinite(n) && n >= 0 && n <= 65535 ? n : VARSAYILAN_PORT;
}

// baslat(port, dir, secenekler) -> Promise<address>. Port 0 = gecici port (test izolasyonu).
// dir verilmezse DENEY_DIR, o da yoksa varsayilan deney dizini. Dinleme yalniz 127.0.0.1.
// secenekler (GD-001, test izolasyonu): { token, corsOrigin } — acik deger ortam degiskenini
//   (PANO_TOKEN / DENEY_CORS_ORIGIN) OVERRIDER; uretimde argumansiz cagri ortamdan cozer.
//   token cozumu null/bos -> POST kapisi fail-closed (403). Dir degisince okuma onbellekleri
//   temizlenir (izole test dizinleri arasini tasima YOK).
export function baslat(port, dir, secenekler) {
  if (sunucu && sunucu.listening) {
    return Promise.reject(new Error('deney-server zaten dinliyor — once kapat() cagirin'));
  }
  const dinlemePortu = portCoz(port);
  if (dir !== undefined && dir !== null) aktifDir = String(dir);
  else if (process.env.DENEY_DIR) aktifDir = process.env.DENEY_DIR;
  else aktifDir = VARSAYILAN_DIR;
  aktifToken = secenekler && secenekler.token !== undefined ? secenekler.token : (process.env.PANO_TOKEN || null);
  aktifCorsOrigin = secenekler && secenekler.corsOrigin !== undefined ? String(secenekler.corsOrigin)
    : (process.env.DENEY_CORS_ORIGIN || VARSAYILAN_CORS_ORIGIN);
  jsonOnbellek.clear();
  kuyrukOnbellek.clear();
  return new Promise((tamam, hata) => {
    sunucu = http.createServer(handler);
    sunucu.on('error', (e) => { sunucu = null; hata(e); });
    sunucu.listen(dinlemePortu, '127.0.0.1', () => {
      const adr = sunucu.address();
      console.log('[deney-server] dinliyor: http://127.0.0.1:' + adr.port + ' | dizin: ' + aktifDir +
        ' | CORS kaynak: ' + aktifCorsOrigin + ' | POST kapisi: ' + (aktifToken ? 'PANO_TOKEN VAR' : 'YOK — fail-closed 403'));
      tamam(adr);
    });
  });
}

// kapat() -> Promise; bekleyen baglantilari da kapatir (temiz kapanis).
export function kapat() {
  return new Promise((tamam) => {
    if (!sunucu) return tamam();
    const s = sunucu;
    sunucu = null;
    if (typeof s.closeAllConnections === 'function') s.closeAllConnections();
    s.close(() => tamam());
  });
}

export default { baslat, kapat, handler, olcumOku };

// --- komut satiri (node pano/deney-server.mjs) ------------------------------------

const anaModul = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (anaModul) {
  process.on('SIGINT', () => { kapat().then(() => process.exit(0)); });
  baslat().catch((e) => {
    console.error('[deney-server] baslatma hatasi: ' + (e && e.message));
    process.exit(1);
  });
}
