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
// Konsol: baslangic satiri (port + dizin) + hata satirlari. Emoji yok, renk kodu yok, CORS header yok.

import http from 'node:http';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { atamaTaslakla, atanabilirler } from './graf-yonetim.js';

// --- sabitler -------------------------------------------------------------------

const VARSAYILAN_PORT = 4930;
const VARSAYILAN_DIR = join(import.meta.dirname, '..', 'raporlar', 'deney-canli-panel-2026-10-29');
const PANEL_YOLU = join(import.meta.dirname, 'deney-panel.html'); // panel pano/ evinde (kapsul-tuval.html kardesi)
const GOVDE_LIMIT_BAYT = 4096;      // POST govde tavaninin ustu -> 400
const NOT_LIMIT_KAR = 2000;         // mudahale not tavaninin ustu -> 400
const AKTOR = 'insan:web';          // deneyde tek kalem sahibi insan (vekil/ajan yok — graf-yonetim kurali)
const KUYRUK = { log: 80, atamalar: 20, mudahale: 10 }; // /api/deney/durum yanitindaki son-N kuyruklari
const YAZMA_IZINLI = ['tercih.json', 'atamalar.jsonl', 'mudahale.jsonl', 'log.jsonl', 'manager-kuyruk.jsonl'];

// --- durum (modul kapsami — baslat() override eder) -------------------------------

let sunucu = null;                                                   // aktif http.Server
let aktifDir = process.env.DENEY_DIR || VARSAYILAN_DIR;              // deney veri dizini

const sunucuSaati = () => new Date().toISOString();

// --- okuma yardimcilari (her cagrida diskten, onbellek YOK) -----------------------

// JSON dosya: yok/bozuksa null (durust bos — sahte veri uretilmez); bozuksa konsola hata satiri.
function jsonOku(yol) {
  try {
    if (!existsSync(yol)) return null;
    return JSON.parse(readFileSync(yol, 'utf8'));
  } catch (e) {
    console.error('[deney-server] bozuk JSON atlandi: ' + yol);
    return null;
  }
}

// JSONL dosya: satir satir; bozuk satir ATLANIR + SAYILIR; donus {satirlar, bozukSatir} (tumu).
function jsonlOku(yol) {
  const bos = { satirlar: [], bozukSatir: 0 };
  try {
    if (!existsSync(yol)) return bos;
    const satirlar = [];
    let bozukSatir = 0;
    for (const satir of readFileSync(yol, 'utf8').split(/\r?\n/)) {
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

function jsonYaz(res, kod, obj) {
  res.writeHead(kod, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
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
    atamalar: sonN(jsonlOku(join(aktifDir, 'atamalar.jsonl')).satirlar, KUYRUK.atamalar),
    log: sonN(jsonlOku(join(aktifDir, 'log.jsonl')).satirlar, KUYRUK.log),
    mudahale: sonN(jsonlOku(join(aktifDir, 'mudahale.jsonl')).satirlar, KUYRUK.mudahale),
    manager: {
      aktor: 'ai-manager:glm-5.3',
      ajan: 'deney-manager-g9',
      paseoAgentId: 'bfda53a3-8e52-4c47-922c-337dfbdf7cca',
      rol: 'ROLLER/manager.md (deney-g9-repo)',
      bekleyenIs: sonN(jsonlOku(join(aktifDir, 'manager-kuyruk.jsonl')).satirlar, 10)
        .filter((k) => k && k.is === 'chat').length,
    },
    ajanlar: {
      kosanPaseo: ajn && Array.isArray(ajn.kosanPaseo) ? ajn.kosanPaseo : [],
      ornek,
    },
  };
}

function durumIsci(req, res) {
  jsonYaz(res, 200, durumGovdesi());
}

// --- POST isleri (dogrulama -> disk yazma -> gunluk) ------------------------------

// Ortak POST boru hatti: govde limiti -> JSON parse -> isle -> yanit + istek logu.
async function postIsci(req, res, ad, isle) {
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

// POST /api/deney/mudahale — {not} -> mudahale.jsonl APPEND {t, kim, not}.
function mudahaleIsle(govde) {
  if (nesneDegil(govde)) {
    return { kod: 400, govde: { hata: 'govde nesne degil' }, gunluk: { tur: 'hata', metin: 'mudahale RED: govde nesne degil' } };
  }
  const not = govde.not;
  if (typeof not !== 'string') {
    return { kod: 400, govde: { hata: 'not metin degil' }, gunluk: { tur: 'hata', metin: 'mudahale RED: not metin degil' } };
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
  satirEkle('mudahale.jsonl', { t: sunucuSaati(), kim: AKTOR, not: kirpilmis });
  // manager kuyrugu: her insan notu manager'a iletilecek ise olarak duser (operatör köprüsü paseo MCP ile manager'a tasir).
  satirEkle('manager-kuyruk.jsonl', { t: sunucuSaati(), is: 'chat', not: kirpilmis });
  return {
    kod: 200,
    govde: { tamam: true },
    gunluk: { tur: 'mudahale', metin: 'mudahale kaydedildi (' + kirpilmis.length + ' karakter) + manager kuyruguna is dustu' },
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
  satirEkle('log.jsonl', { t, tur: 'manager-yanit', metin: metin.trim(), aktor: 'ai-manager:glm-5.3' });
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
  '/api/deney/tercih': { POST: (q, r) => postIsci(q, r, 'tercih', tercihIsle) },
  '/api/deney/atama': { POST: (q, r) => postIsci(q, r, 'atama', atamaIsle) },
  '/api/deney/mudahale': { POST: (q, r) => postIsci(q, r, 'mudahale', mudahaleIsle) },
  '/api/deney/manager-yanit': { POST: (q, r) => postIsci(q, r, 'manager-yanit', managerYanitIsle) },
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

// baslat(port, dir) -> Promise<address>. Port 0 = gecici port (test izolasyonu).
// dir verilmezse DENEY_DIR, o da yoksa varsayilan deney dizini. Dinleme yalniz 127.0.0.1.
export function baslat(port, dir) {
  if (sunucu && sunucu.listening) {
    return Promise.reject(new Error('deney-server zaten dinliyor — once kapat() cagirin'));
  }
  const dinlemePortu = portCoz(port);
  if (dir !== undefined && dir !== null) aktifDir = String(dir);
  else if (process.env.DENEY_DIR) aktifDir = process.env.DENEY_DIR;
  else aktifDir = VARSAYILAN_DIR;
  return new Promise((tamam, hata) => {
    sunucu = http.createServer(handler);
    sunucu.on('error', (e) => { sunucu = null; hata(e); });
    sunucu.listen(dinlemePortu, '127.0.0.1', () => {
      const adr = sunucu.address();
      console.log('[deney-server] dinliyor: http://127.0.0.1:' + adr.port + ' | dizin: ' + aktifDir);
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

export default { baslat, kapat, handler };

// --- komut satiri (node pano/deney-server.mjs) ------------------------------------

const anaModul = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (anaModul) {
  process.on('SIGINT', () => { kapat().then(() => process.exit(0)); });
  baslat().catch((e) => {
    console.error('[deney-server] baslatma hatasi: ' + (e && e.message));
    process.exit(1);
  });
}
