// OTODEV-1 PARÇA 1 — LEASE (KİRA) KİLİDİ (kaynak: plans/OTODEV-OTOMATIK-DEVIR-PLANI-2026-11-01.md): devir hakkı kira dosyasıyla taşınır [PID+damga+TTL]; fail-closed — TAZE kira asla devrilmez (çift-yazar RED: 429-dirilme vakası), bozuk kira devrilmez, watchdog YAZICI DEĞİLDİR (devirSinifi yalnız operator|nobet); TTL aşmış kira SADECE süreç-çıkış kanıtıyla devrilir (pidCanliMi — sentez koşul 2; sahibi hâlâ ayaktaysa devir RED).
import { appendFileSync, closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeSync } from 'node:fs';
import { dirname, join } from 'node:path';

// --- sabitler ---------------------------------------------------------------------

export const VARSAYILAN_KIRA_YOLU = join(import.meta.dirname, '..', 'core', 'data', 'devir-kira.json');
export const VARSAYILAN_TTL_MS = 15 * 60 * 1000;       // 15 dk kira ömrü (env ORDU_DEVIR_TTL_MS)
export const DEVIR_SINIFLARI = ['operator', 'nobet'];  // watchdog listede YOK — kira yazıcısı olamaz (plan: rol ayrımı)

// Kira yolu çağrı anında çözülür (env ORDU_DEVIR_KIRA; testler yol'u açık geçer — env'e bakmaz).
export function kiraYoluCoz() {
  return process.env.ORDU_DEVIR_KIRA || VARSAYILAN_KIRA_YOLU;
}

// TTL çözümü: env TANIMLI ama geçersizse ATILIR — çöp TTL'e sessiz varsayılan düşmek devir
// güvenliğini bozar (en dar fail-closed yorumu).
function ttlCoz() {
  const e = process.env.ORDU_DEVIR_TTL_MS;
  if (e === undefined || e === '') return VARSAYILAN_TTL_MS;
  const n = Number(e);
  if (!Number.isFinite(n) || n <= 0) throw new Error('RED: ORDU_DEVIR_TTL_MS pozitif sayı olmak zorunda: ' + String(e));
  return n;
}

const logYolu = (kiraYolu) => kiraYolu + '-log.jsonl';

// PID canlılık yoklaması (sentez koşul 2 — süreç-çıkış KANITI, kill YASAK): sinyal-0 yoklaması
// süreci ÖLDÜRMEZ, yalnız varlığı sorgular. ESRCH = süreç yok (ölüm kanıtı tamam); EPERM = süreç
// var ama erişimsiz → CANLI sayılır (fail-closed: kanıt eksikse devir yok); başka hata → CANLI.
function pidCanliMi(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return !(e && e.code === 'ESRCH'); }
}

function kimlikDogrula(kimlik) {
  if (typeof kimlik !== 'string' || !kimlik.trim()) throw new Error('RED: kimlik zorunlu (boş/tanımsız olamaz)');
}

// --- düşük seviye: kira dosyası (tmp+fsync+rename — A2-10) + olay defteri (append fsync) ---

// Kira oku: dosya yok → {sorun:'yok'}; bozuk/şemasız → {sorun:'bozuk'}. Bozuk kirada tazelik
// KANITLANAMAZ → devir RED verilir (fail-closed); temizlik [insan] kapısına kalır — kod yok sayıp geçmez.
function kiraOku(yol) {
  if (!existsSync(yol)) return { kira: null, sorun: 'yok' };
  let h = null;
  try { h = JSON.parse(readFileSync(yol, 'utf8').replace(/^﻿/, '')); } catch { return { kira: null, sorun: 'bozuk' }; }
  if (!h || typeof h !== 'object' || Array.isArray(h) || h.surum !== 1 ||
      typeof h.kimlik !== 'string' || !h.kimlik.trim() ||
      !Number.isInteger(h.pid) ||
      typeof h.damgaISO !== 'string' || !Number.isFinite(Date.parse(h.damgaISO)) ||
      !Number.isFinite(h.ttlMs) || h.ttlMs <= 0 ||
      !DEVIR_SINIFLARI.includes(h.devirSinifi)) {
    return { kira: null, sorun: 'bozuk' };
  }
  return { kira: h, sorun: null };
}

// Tazelik: 'birakildi' DEĞİL ve (şimdi − damga) < kira.ttlMs. Geleceğe damgalı kira (saat kayması)
// taze sayılır — aşım KANITLANAMADIKÇA devir yok (fail-closed yönü).
function tazeMi(kira, simdi) {
  return kira.durum !== 'birakildi' && (simdi - Date.parse(kira.damgaISO)) < kira.ttlMs;
}

// Kira dosyasına atomik yaz (tmp + fsync + rename — A2-10/server.js deseni): yarım dosya görünmez;
// hata durumunda tmp temizlenir, hata yukarı taşınır (süreç ayakta kalır — GD-005 deseni).
function kiraYaz(yol, kira) {
  mkdirSync(dirname(yol), { recursive: true });
  const tmp = yol + '.tmp-' + Date.now();
  try {
    const fd = openSync(tmp, 'w');
    try { writeSync(fd, JSON.stringify(kira, null, 2) + '\n', null, 'utf8'); fsyncSync(fd); } finally { closeSync(fd); }
    renameSync(tmp, yol);
  } catch (e) {
    try { if (existsSync(tmp)) rmSync(tmp); } catch { /* tmp zaten yok/kaldırıldı */ }
    throw e;
  }
}

// Olay defteri: kiraYolu + '-log.jsonl' — append-only + fsync (graf-yaz.mjs deseni; eski satır bozulmaz).
// Gizli değer YAZILMAZ; kimlik/pid loga yazılır (bunlar sır değil, denetim bağlantısıdır).
function logEkle(kiraYolu, olay) {
  const ly = logYolu(kiraYolu);
  mkdirSync(dirname(ly), { recursive: true });
  const fd = openSync(ly, 'a');
  try { appendFileSync(fd, JSON.stringify(olay) + '\n'); fsyncSync(fd); } finally { closeSync(fd); }
}

// Defteri oku: bozuk satır atlanır + sayılır (dürüst; sessiz yutma yok — graf-yaz.mjs deseni).
// olayId = parse sırasındaki konum (1'den başlar) — defter append-only olduğu için konum kararlıdır.
export function logOku(kiraYolu) {
  const ly = logYolu(kiraYolu);
  if (!existsSync(ly)) return { olaylar: [], bozuk: 0 };
  const satirlar = readFileSync(ly, 'utf8').replace(/^﻿/, '').split('\n').filter((s) => s.trim());
  const olaylar = [];
  let bozuk = 0;
  for (const s of satirlar) {
    try { olaylar.push(JSON.parse(s)); } catch { bozuk++; }
  }
  return { olaylar, bozuk };
}

// Son 'devir' olayının konumu (yoksa -1) — echo borcu buna bağlanır.
function sonDevirKonum(olaylar) {
  let kon = -1;
  for (let i = 0; i < olaylar.length; i++) if (olaylar[i] && olaylar[i].tur === 'devir') kon = i;
  return kon;
}

// --- API (tümü senkron fs) ---------------------------------------------------------

// Kira AL. Kural (fail-closed): mevcut kira TAZE VE kimlik FARKLI → 'kira-taze-devir-RED'
// (çift-yazar — 429'da ölüp pencere açılınca dirilen ajan vakasını kapatır). STALE → devir
// ALINIR (yeni kira yazılır + loga devir olayı düşer). Sahibin taze kirada kiraAl çağrısı
// idempotent 'kira-sahipte' (yazma/log YOK — yenileme kiraYenile'in işidir). devirSinifi
// varsayılan 'operator' (ilk kira koordinatör oturumudur); nöbet devri açıkça 'nobet' taşır.
export function kiraAl(yol = kiraYoluCoz(), { kimlik, pid, devirSinifi = 'operator' } = {}) {
  kimlikDogrula(kimlik);
  if (!Number.isInteger(pid)) throw new Error('RED: pid tamsayı olmak zorunda: ' + String(pid));
  if (!DEVIR_SINIFLARI.includes(devirSinifi)) {
    throw new Error('RED: devirSinifi yalnız operator|nobet (watchdog YAZICI DEĞİL): ' + String(devirSinifi));
  }
  const { kira, sorun } = kiraOku(yol);
  const damga = new Date().toISOString();
  if (sorun === 'bozuk') {
    logEkle(yol, { tur: 'RED', sebep: 'kira-bozuk-devir-RED', kimlik, damga });
    return { ok: false, sebep: 'kira-bozuk-devir-RED', kira: null };
  }
  if (sorun === 'yok') {
    const kiraYeni = { surum: 1, kimlik, pid, damgaISO: damga, ttlMs: ttlCoz(), devirSinifi };
    kiraYaz(yol, kiraYeni);
    logEkle(yol, { tur: 'ilk-kira', kimlik, pid, devirSinifi, damga });
    return { ok: true, sebep: 'ilk-kira', kira: kiraYeni };
  }
  if (tazeMi(kira, Date.now())) {
    if (kira.kimlik === kimlik) return { ok: true, sebep: 'kira-sahipte', kira };
    logEkle(yol, { tur: 'RED', sebep: 'kira-taze-devir-RED', kimlik, oncekiKimlik: kira.kimlik, damga });
    return { ok: false, sebep: 'kira-taze-devir-RED', kira };
  }
  // Kira ÖLÜ: ttl aşımı ya da bilinçli bırakılma → devir ALINIR. Kira ÖNCE yazılır (kilit),
  // olay SONRA düşer — arada süreç ölse kilit alınmış kalır, log eksik kalır (daha güvenli taraf).
  // TTL aşımında SÜREÇ-ÇIKIŞ KANITI zorlanır (sentez koşul 2): sahibin pid'i hâlâ AYAKTAYSA kira
  // ölü görünsün → devir RED (tırmanan saat/sistem uykusu/429-dirilme — ayaktaki sahibi asla
  // devrilmez). 'birakildi' muaf: sahip bilinçli veda etti, pid canlı olsa da belirsizlik yok.
  const sebep = kira.durum === 'birakildi' ? 'birakildi' : 'ttl-asimi';
  if (sebep === 'ttl-asimi' && pidCanliMi(kira.pid)) {
    logEkle(yol, { tur: 'RED', sebep: 'pid-canli-devir-RED', kimlik, oncekiKimlik: kira.kimlik, oncekiPid: kira.pid, damga });
    return { ok: false, sebep: 'pid-canli-devir-RED', kira };
  }
  const kiraYeni = { surum: 1, kimlik, pid, damgaISO: damga, ttlMs: ttlCoz(), devirSinifi };
  kiraYaz(yol, kiraYeni);
  logEkle(yol, { tur: 'devir', oncekiKimlik: kira.kimlik, kimlik, pid, devirSinifi, damga, sebep });
  return { ok: true, sebep: kira.durum === 'birakildi' ? 'birakildi-devir' : 'ttl-asimi-devir', kira: kiraYeni };
}

// Kira YENİLE (heartbeat — K0057 aynen): yalnız SAHİP yeniler, kimlik uyuşmazsa RED
// 'kira-sahip-degil'. Yenilemede pid yoklaması YOK (sahip kendini tazeliyor — ölüm kanıtı
// burada anlam taşımaz; kanıt DEVİR yolunda zorlanır: kiraAl → pidCanliMi). Bırakılmış kira
// yenilenemez — yeniden sahiplenme kiraAl devir yolundan olur.
export function kiraYenile(yol = kiraYoluCoz(), kimlik) {
  kimlikDogrula(kimlik);
  const { kira, sorun } = kiraOku(yol);
  const damga = new Date().toISOString();
  if (sorun === 'yok') {
    logEkle(yol, { tur: 'RED', sebep: 'kira-yok-yenile-RED', kimlik, damga });
    return { ok: false, sebep: 'kira-yok', kira: null };
  }
  if (sorun === 'bozuk') {
    logEkle(yol, { tur: 'RED', sebep: 'kira-bozuk-yenile-RED', kimlik, damga });
    return { ok: false, sebep: 'kira-bozuk', kira: null };
  }
  if (kira.kimlik !== kimlik) {
    logEkle(yol, { tur: 'RED', sebep: 'kira-sahip-degil', kimlik, oncekiKimlik: kira.kimlik, damga });
    return { ok: false, sebep: 'kira-sahip-degil', kira };
  }
  if (kira.durum === 'birakildi') {
    logEkle(yol, { tur: 'RED', sebep: 'kira-birakildi-yenile-RED', kimlik, damga });
    return { ok: false, sebep: 'kira-birakildi', kira };
  }
  const kiraYeni = { ...kira, damgaISO: damga, ttlMs: ttlCoz() };
  kiraYaz(yol, kiraYeni);
  logEkle(yol, { tur: 'yenile', kimlik, damga });
  return { ok: true, sebep: 'yenilendi', kira: kiraYeni };
}

// Kira DURUM — salt-okur (YAZMA/LOG YOK; nöbet ajanının 'kira TAZE → sessiz çıkış' bacağı
// buradan bakar: 0 yazma, min token). Bozuk kira dürüst 'bozuk' taşır, taze DYETİLMemiş sayılır.
export function kiraDurum(yol = kiraYoluCoz()) {
  const { kira, sorun } = kiraOku(yol);
  if (sorun === 'yok') return { taze: false, kalanMs: 0, kimlik: null, devirSinifi: null, yok: true };
  if (sorun === 'bozuk') return { taze: false, kalanMs: 0, kimlik: null, devirSinifi: null, bozuk: true };
  const kalan = kira.ttlMs - (Date.now() - Date.parse(kira.damgaISO));
  const d = {
    taze: kalan > 0 && kira.durum !== 'birakildi',
    kalanMs: Math.max(0, kalan),
    kimlik: kira.kimlik,
    devirSinifi: kira.devirSinifi,
  };
  if (kira.durum) d.durum = kira.durum;
  return d;
}

// Kira BIRAK: yalnız sahip bırakır. Dosya SİLİNMEZ — durum:'birakildi' yazılır (belirgin veda;
// append-only 'birak' olayı deftere düşer). Bırakılan kira TTL beklemeden devralınabilir:
// sahibin gittiği KESİNDİR (belirsizlik kalmadı — fail-closed'ın kapsadığı belirsizlik değil).
export function kiraBirak(yol = kiraYoluCoz(), kimlik) {
  kimlikDogrula(kimlik);
  const { kira, sorun } = kiraOku(yol);
  const damga = new Date().toISOString();
  if (sorun === 'yok') {
    logEkle(yol, { tur: 'RED', sebep: 'kira-yok-birak-RED', kimlik, damga });
    return { ok: false, sebep: 'kira-yok', kira: null };
  }
  if (sorun === 'bozuk') {
    logEkle(yol, { tur: 'RED', sebep: 'kira-bozuk-birak-RED', kimlik, damga });
    return { ok: false, sebep: 'kira-bozuk', kira: null };
  }
  if (kira.kimlik !== kimlik) {
    logEkle(yol, { tur: 'RED', sebep: 'kira-sahip-degil', kimlik, oncekiKimlik: kira.kimlik, damga });
    return { ok: false, sebep: 'kira-sahip-degil', kira };
  }
  const kiraYeni = { ...kira, durum: 'birakildi', birakildiISO: damga };
  kiraYaz(yol, kiraYeni);
  logEkle(yol, { tur: 'birak', kimlik, damga, durum: 'birakildi' });
  return { ok: true, sebep: 'birakildi', kira: kiraYeni };
}

// ECHO YAZ: son DEVİR olayına echo kaydını iliştirir (echo borcu 3 soru — üçü de zorunlu;
// eksik alan fail-closed ATILIR, 'eksik echo' tam echo SAYILMAZ). Defterde devir olayı yoksa
// iliştirilecek halka yoktur → {ok:false} (ilk-kira devri yok, borç da yoktur).
export function kiraEchoYaz(yol = kiraYoluCoz(), cevaplar) {
  if (!cevaplar || typeof cevaplar !== 'object' || Array.isArray(cevaplar)) {
    throw new Error('RED: cevaplar nesnesi gerekli {kirliSayisi, sonCommit, ilkOnay}');
  }
  for (const alan of ['kirliSayisi', 'sonCommit', 'ilkOnay']) {
    if (cevaplar[alan] === undefined) throw new Error('RED: echo borcu 3 soru zorunlu — eksik alan: ' + alan);
  }
  const { olaylar } = logOku(yol);
  const kon = sonDevirKonum(olaylar);
  if (kon < 0) return { ok: false, sebep: 'devir-olay-yok', iliskinOlayId: null };
  const { kira } = kiraOku(yol);
  logEkle(yol, {
    tur: 'echo',
    iliskinOlayId: kon + 1,
    kimlik: kira ? kira.kimlik : null,
    damga: new Date().toISOString(),
    cevaplar: { kirliSayisi: cevaplar.kirliSayisi, sonCommit: cevaplar.sonCommit, ilkOnay: cevaplar.ilkOnay },
  });
  return { ok: true, sebep: 'echo-yazildi', iliskinOlayId: kon + 1 };
}

// ZİNCİR KONTROL (echo-doluluk bacağı — plan parça 5): son 'devir' olayının echo'su YOK/eksikse
// kırmızı 'echo-borcu-acik'. Devir olayı hiç yoksa borç yoktur (ok). Yalnız SON devir sorgulanır
// (eski devirlerin borcu arşiv kaydıdır; borç hep en yeni halkadan okunur — plan sözü budur).
// İNSAN KAPISI (sentez koşul 5): sondan geriye 'ilk-kira' köküne DEK sayılan ardışık 'devir'
// zinciri >3 → 'devir-zinciri-insan-kapisi-RED' — zincirin kendisi otomatizmi dayanmaz, insan
// turu devreye girer. Zincir RED'i echo'dan ÖNCE döner (daha sert kapı); aradaki RED/yenile/
// birak/echo olayları zinciri KIRMAZ (yalnız 'ilk-kira' kökü kırar).
export function zincirKontrol(yol = kiraYoluCoz()) {
  const { olaylar } = logOku(yol);
  const kon = sonDevirKonum(olaylar);
  if (kon < 0) return { ok: true, sebep: 'devir-olayi-yok', devirOlayId: null, ardisikDevir: 0 };
  let ardisik = 0;
  for (let i = olaylar.length - 1; i >= 0; i--) {
    const o = olaylar[i];
    if (!o) continue;
    if (o.tur === 'ilk-kira') break;
    if (o.tur === 'devir') ardisik++;
  }
  if (ardisik > 3) {
    return { ok: false, sebep: 'devir-zinciri-insan-kapisi-RED', devirOlayId: kon + 1, ardisikDevir: ardisik };
  }
  const hedefId = kon + 1;
  for (let i = 0; i < olaylar.length; i++) {
    const o = olaylar[i];
    if (o && o.tur === 'echo' && o.iliskinOlayId === hedefId && o.cevaplar &&
        o.cevaplar.kirliSayisi !== undefined && o.cevaplar.sonCommit !== undefined && o.cevaplar.ilkOnay !== undefined) {
      return { ok: true, sebep: 'echo-dolu', devirOlayId: hedefId, echoOlayId: i + 1, ardisikDevir: ardisik };
    }
  }
  return { ok: false, sebep: 'echo-borcu-acik', devirOlayId: hedefId, ardisikDevir: ardisik };
}
