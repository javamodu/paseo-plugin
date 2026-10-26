// ui-tester.ts — F9 UI-tester adaptoru (evaluator'in tarayici yuzu) — PLAN bol.10 F9 satiri.
// Tarayici yuzu = pano'nun BAGIMSIZ web ince-istemcisi (fetch): Paseo native istemci
// KAPALI senaryosunda bu yuz teslim dogrulamasinin tek yoludur (K12-14 — "Paseo kapali
// bagimsiz teslim": teslim Paseo'ya ihtiyac duymadan dogrulanir; pano zaten Paseo'dan
// ayri yasar, PLAN bol.12).
//
// Sozlesmeler (fail-closed):
// (1) F9-A: senaryo/beklenen/gozlenen uclusu KANIT KAYDI olarak diske duser —
//     append-only JSONL + append basina fsync (notify/turnuva deseni). Screenshot
//     yalniz istege-bagli REFERANSTIR ve verdict'e ETkISIZDIR: "screenshot tek basina
//     PASS DEGIL" (PLAN bol.10) kod duzeyinde — screenshot alaninin verdict
//     hesabinda okunmasi YOK; kayitta gorunurluk olarak yazar.
// (2) Tek sahip: bir tarayici profili (baseUrl+token) ayni anda TEK senaryo
//     kosucusunundur (mouse/keyboard tek-sahip sozlesmesi) — acik profil uzerinden
//     ikinci acilis RED. Profili kapanca koşum RED.
// (3) Yalniz GET okuma: UI-tester read-model yuzudur; panonun yazma uclari
//     (POST /api/emir + /api/karar) kapsam DISI — hata DEGIL bilincli sinir.
// (4) Token kirmizisi fail-closed: 403 senaryonun beklenen degil ADIM kirmizisidir
//     (pano yuzeyini token gostermek zorundadir).
// (5) Yeni defter tablosu / command.kind / Event.type YOK (R6): kanit kayitlari
//     defter DISI JSONL'de yasar (turnuva deseni).
import { appendFileSync, closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type KriterKosulu = 'esittir' | 'buyuktur' | 'icerir';

export interface TarayiciProfili {
  readonly baseUrl: string;
  readonly token: string;
  kapat(): void;
}

export interface UiBeklenen {
  alan: string;          // JSON yolu ('globalStop', 'metrics.verifiedDeliveries')
  kosul: KriterKosulu;
  deger: unknown;        // esittir/icerir: string|number|boolean; buyuktur: number
}

export interface UiAdim {
  ad: string;
  yol: string;           // '/healthz', '/api/status'
  beklenen: UiBeklenen[];
}

export interface UiSenaryo {
  ad: string;
  adimlar: UiAdim[];
}

export type UiVerdict = 'PASS' | 'RED';

export interface UiAdimKaniti {
  tip: 'ui-adim';
  senaryo: string;
  adim: string;
  istek: string;
  beklenen: UiBeklenen[];
  gozlenen: unknown;
  sonuc: 'GECTI' | 'KALDI';
  mesaj?: string;
  at: string;
}

export interface UiSenaryoOzeti {
  tip: 'ui-senaryo';
  senaryo: string;
  verdict: UiVerdict;
  gecenAdim: number;
  toplamAdim: number;
  screenshot?: string;   // yalniz gorunurluk — verdict'e etkisi YOK (sozlesme 1)
  at: string;
}

export interface UiSenaryoSonucu {
  verdict: UiVerdict;
  gecenAdim: number;
  toplamAdim: number;
  kanitYolu: string;
  hata?: string;         // ilk kalan adimin kirmizi mesaji (adim adi + alan)
}

// --- tek-sahip profilleri (sozlesme 2) ---
const acikProfiller = new Map<string, TarayiciProfili>();

export function acTarayiciProfili(baseUrl: string, token: string): TarayiciProfili {
  if (!/^https?:\/\//.test(baseUrl)) throw new Error('ui-tester: baseUrl http/https olmali: ' + baseUrl);
  if (!token || typeof token !== 'string') throw new Error('ui-tester: token bos olamaz (pano yuzeyi token ister — sessiz miss YOK)');
  const kime = baseUrl.replace(/\/+$/, '');
  if (acikProfiller.has(kime)) {
    throw new Error('ui-tester: profil zaten ACIK — tek sahip sozlesmesi (ayni yuz tek kosucunundur): ' + kime);
  }
  const profil: TarayiciProfili = {
    baseUrl: kime, token,
    kapat() { acikProfiller.delete(kime); },
  };
  acikProfiller.set(kime, profil);
  return profil;
}

function profilAcikMi(p: TarayiciProfili): boolean {
  return acikProfiller.get(p.baseUrl.replace(/\/+$/, '')) === p;
}

// --- JSON yolu okuyucu ('a.b.c' → govde.a.b.c; '' → govdenin kendisi; yoksa undefined) ---
function al(govde: unknown, yol: string): unknown {
  if (yol === '') return govde;
  let cur: any = govde;
  for (const par of yol.split('.')) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
    cur = cur[par];
  }
  return cur;
}

function karsilastir(b: UiBeklenen, gercek: unknown): { tamam: boolean; mesaj: string } {
  switch (b.kosul) {
    case 'esittir':
      return { tamam: JSON.stringify(gercek) === JSON.stringify(b.deger),
        mesaj: 'alan ' + b.alan + ' beklenen ' + JSON.stringify(b.deger) + ' gozlenen ' + JSON.stringify(gercek) };
    case 'buyuktur': {
      const g = typeof gercek === 'number' ? gercek : Number(gercek);
      if (typeof b.deger !== 'number' || Number.isNaN(g)) {
        throw new Error('ui-tester: buyuktur kriteri sayi ister — alan ' + b.alan + ' gozlenen ' + JSON.stringify(gercek));
      }
      return { tamam: g > b.deger, mesaj: 'alan ' + b.alan + ' beklenen > ' + b.deger + ' gozlenen ' + g };
    }
    case 'icerir': {
      if (typeof b.deger !== 'string') {
        throw new Error('ui-tester: icerir kriteri metin ister — alan ' + b.alan);
      }
      // gozlenen dizi/nesne olabilir (runs, pendingDecisions) — metne cevirip kiyasla
      const g = typeof gercek === 'string' ? gercek : JSON.stringify(gercek);
      return { tamam: g.includes(b.deger), mesaj: 'alan ' + b.alan + ' beklenen icerir ' + JSON.stringify(b.deger) + ' gozlenen ' + JSON.stringify(gercek) };
    }
    default:
      throw new Error('ui-tester: bilinmeyen kriter kosulu: ' + String((b as any).kosul));
  }
}

// giris kapisinin kendi dogrulamasi (fail-closed): fetch try-blokunun ICINDE
// yutulmamasi icin koşumdan ONCE calisir — yanlis girdi 'yuz kirmizisi' kisiligi
// tasimaz, ADIYLA kirmizi dogar.
function senaryoyuDogrula(senaryo: UiSenaryo): void {
  for (const adim of senaryo.adimlar) {
    for (const b of adim.beklenen) {
      if (b.kosul !== 'esittir' && b.kosul !== 'buyuktur' && b.kosul !== 'icerir') {
        throw new Error('ui-tester: bilinmeyen kriter kosulu: ' + String((b as any).kosul));
      }
      if (typeof b.alan !== 'string') throw new Error('ui-tester: beklenen.alan metin olmali — adim ' + adim.ad);
      if (b.kosul === 'buyuktur' && typeof b.deger !== 'number') {
        throw new Error('ui-tester: buyuktur kriteri sayi ister — alan ' + b.alan);
      }
      if (b.kosul === 'icerir' && typeof b.deger !== 'string') {
        throw new Error('ui-tester: icerir kriteri metin ister — alan ' + b.alan);
      }
    }
  }
}

function kaydet(yol: string, kayit: unknown): void {
  const satir = JSON.stringify(kayit) + '\n';
  const d = dirname(yol);
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
  appendFileSync(yol, satir, 'utf8');
  // notify deseni: append-anında fsync kayit kaybini keser — sqlite YOK, bu bir dosya.
  const fd = openSync(yol, 'r+');
  try { fsyncSync(fd); } finally { closeSync(fd); }
}

// --- senaryo kosumu (yalniz GET — sozlesme 3) ---
export async function runUiSenaryo(
  profil: TarayiciProfili,
  senaryo: UiSenaryo,
  opts: { kanitYolu: string; now?: () => string; screenshot?: string },
): Promise<UiSenaryoSonucu> {
  if (!profilAcikMi(profil)) throw new Error('ui-tester: profil KAPALI — koşum icin profil acik olmali (tek sahip zinciri)');
  if (!senaryo || !senaryo.ad) throw new Error('ui-tester: senaryo adi zorunlu');
  if (!Array.isArray(senaryo.adimlar) || senaryo.adimlar.length === 0) {
    throw new Error('ui-tester: bos senaryo — en az bir adim (screen korumasi: bos kosum sahte yesil uretir)');
  }
  senaryoyuDogrula(senaryo);
  const now = opts.now ?? (() => new Date().toISOString());
  const kayitlar: UiAdimKaniti[] = [];
  let gecen = 0;
  let ilkHata: string | undefined;
  for (const adim of senaryo.adimlar) {
    if (!adim.ad || !adim.yol) throw new Error('ui-tester: adim adi/yol zorunlu');
    if (!Array.isArray(adim.beklenen) || adim.beklenen.length === 0) {
      throw new Error('ui-tester: adim beklenen listesi bos olamaz — adim ' + adim.ad);
    }
    let gozlenen: unknown;
    let adimHata: string | undefined;
    let adimGecti = true;
    try {
      // 'connection: close' — undici keep-alive havuzu sunucu kapanisini bloklar
      // (DERSLER: senkron gonderen alicidan ayri surecte yasar ikizi — burada yuz
      // kapanirken soket havuzu event-loop'u tutmamali)
      const yanit = await fetch(profil.baseUrl + adim.yol, { headers: { 'x-pano-token': profil.token, connection: 'close' } });
      const durum = yanit.status;
      if (durum < 200 || durum >= 300) {
        adimGecti = false;
        adimHata = 'adim ' + adim.ad + ' HTTP ' + durum + ' (beklenen 2xx — token/yuz kirmizisi fail-closed)';
        gozlenen = { httpDurum: durum };
      } else {
        const metin = await yanit.text();
        try { gozlenen = JSON.parse(metin); } catch { gozlenen = metin; }
        for (const b of adim.beklenen) {
          const k = karsilastir(b, al(gozlenen, b.alan));
          if (!k.tamam) {
            adimGecti = false;
            adimHata = 'adim ' + adim.ad + ' ' + k.mesaj;
            break;
          }
        }
      }
    } catch (e: any) {
      adimGecti = false;
      adimHata = 'adim ' + adim.ad + ' yuz erisilemedi (baglanti kirmizisi): ' + String(e && e.message ? e.message : e);
      gozlenen = null;
    }
    if (adimGecti) gecen++;
    else if (ilkHata === undefined) ilkHata = adimHata;
    const kayit: UiAdimKaniti = {
      tip: 'ui-adim', senaryo: senaryo.ad, adim: adim.ad, istek: adim.yol,
      beklenen: adim.beklenen, gozlenen, sonuc: adimGecti ? 'GECTI' : 'KALDI', at: now(),
    };
    if (adimHata) kayit.mesaj = adimHata;
    kayitlar.push(kayit);
    kaydet(opts.kanitYolu, kayit);
  }
  const verdict: UiVerdict = gecen === senaryo.adimlar.length ? 'PASS' : 'RED';
  // F9-A: senaryo/beklenen/gozlenen KANIT KAYDI — screenshot yalniz gorunurluk;
  // verdict hesabina screenshot OKUNMAZ (sozlesme 1: screenshot tek basina PASS DEGIL).
  const ozet: UiSenaryoOzeti = {
    tip: 'ui-senaryo', senaryo: senaryo.ad, verdict,
    gecenAdim: gecen, toplamAdim: senaryo.adimlar.length,
    ...(opts.screenshot ? { screenshot: opts.screenshot } : {}),
    at: now(),
  };
  kaydet(opts.kanitYolu, ozet);
  return { verdict, gecenAdim: gecen, toplamAdim: senaryo.adimlar.length, kanitYolu: opts.kanitYolu, ...(ilkHata ? { hata: ilkHata } : {}) };
}

// Kanit dosyasi okuma (test/rapor tarafinin sorgu yuzu — yukleVeOnar tarafi buyuk degil:
// UI-tester kayitlari kucuktur; son satir bozuksa atlanir, fail-closed DEGIL gorunurluktur).
export function uiKanitlariniOku(yol: string): unknown[] {
  if (!existsSync(yol)) return [];
  const satirlar = readFileSync(yol, 'utf8').split('\n');
  const out: unknown[] = [];
  for (const s of satirlar) {
    const t = s.trim();
    if (!t) continue;
    try { out.push(JSON.parse(t)); } catch { /* bozuk son satir atlanir */ }
  }
  return out;
}
