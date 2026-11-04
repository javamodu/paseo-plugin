// ordu-metrik.mjs — M1: KURMAY hareket-metrik çekirdeği (operatör emri 2026-11-04:
// «kurmay ile başlayan tüm hareketlerde herşeyi metrikler altında yönetim parametresi
// yapmalıyız sağ panelde en önemlileri görmeliyiz» + «gereksiz hiçbir state olmayacak»).
// TEK yeni kalıcı state = hareket defteri (append-only JSONL, fsync'li — defterEkle deseni):
// KURMAY hareketlerinin (müdahale / spawn) bugün HİÇBİR kalıcı kaydı yoktu → yönetim
// metriğinin ham maddesi meşru; otonomi/hedef ölçümleri mevcut SSOT'lardan türetilir
// (bu modül YALNIZ hareket kaydı + salt-okur özet — sayı türetmez, kayıt dışı bir şey yazmaz).
import { existsSync, mkdirSync, openSync, appendFileSync, fsyncSync, closeSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

export const HAREKET_TURLERI = ["mudahale", "spawn-talebi", "spawn-sonuc"];
const SONUCLAR = ["ok", "hata"];

// Geçersiz alan RED — çöp deftere YAZILMAZ (fail-closed; E10).
function hareketDogrula(h) {
  if (!h || typeof h !== "object") throw new Error("hareket nesne degil");
  if (!HAREKET_TURLERI.includes(h.tur)) throw new Error("hareket.tur bilinmiyor: " + String(h.tur));
  if (typeof h.hedef !== "string" || !h.hedef.trim()) throw new Error("hareket.hedef zorunlu (dolgu string)");
  if (!SONUCLAR.includes(h.sonuc)) throw new Error("hareket.sonuc 'ok'|'hata' olmali: " + String(h.sonuc));
  if (h.sureMs !== undefined && (typeof h.sureMs !== "number" || !Number.isFinite(h.sureMs))) throw new Error("hareket.sureMs sonlu sayi olmali");
  if (h.detay !== undefined && typeof h.detay !== "string") throw new Error("hareket.detay string olmali");
}

// Hareketi deftere yazar (append-only + fsync — eski satir bozulmaz). zamanISO BURADA
// eklenir (cagiran asla yazmaz — tek dogru kaynak). Donus: deftere yazilan kayit nesnesi.
export function hareketKaydet(yol, hareket) {
  hareketDogrula(hareket);
  const kayit = { tur: hareket.tur, hedef: hareket.hedef.trim(), sonuc: hareket.sonuc, zamanISO: new Date().toISOString() };
  if (hareket.sureMs !== undefined) kayit.sureMs = Math.round(hareket.sureMs);
  if (hareket.detay !== undefined && hareket.detay) kayit.detay = hareket.detay;
  mkdirSync(dirname(yol), { recursive: true });
  const fd = openSync(yol, "a");
  try { appendFileSync(fd, JSON.stringify(kayit) + "\n"); fsyncSync(fd); } finally { closeSync(fd); }
  return kayit;
}

// Defteri yonetim ozetine indirger (salt-okur read-model). Defter YOK/BOSE → durust
// SIFIR ozet (hata DEGIL — hareket olmadı demektir). Bozuk satir atlanir + SAYILIR
// (gizlenmez). son24s penceresi olcumAniISO anina gore — panelin OLCUM ANI dürüstlük etiketi deseni.
export function metrikOzet(yol) {
  const simdi = Date.now();
  const ozet = {
    olcumAniISO: new Date(simdi).toISOString(),
    toplam: 0, bozukSatir: 0,
    son24s: { toplam: 0, ok: 0, hata: 0, ortSureMs: null },
    turler: {},
    sonHareketISO: null,
  };
  let sureToplam = 0, sureAdet = 0;
  if (existsSync(yol)) {
    const ham = readFileSync(yol, "utf8"); // defter kucuk kalir (KURMAY hareket seyrek)
    for (const satir of ham.split("\n")) {
      const k = satir.trim();
      if (!k) continue; // bos satir dogal (dosya sonu \n)
      let kayit = null;
      try { kayit = JSON.parse(k); } catch { ozet.bozukSatir += 1; continue; }
      if (!kayit || typeof kayit !== "object" || typeof kayit.tur !== "string" || typeof kayit.zamanISO !== "string") { ozet.bozukSatir += 1; continue; }
      ozet.toplam += 1;
      const t = ozet.turler[kayit.tur] || (ozet.turler[kayit.tur] = { toplam: 0, ok: 0, hata: 0, sonZamanISO: null });
      t.toplam += 1;
      if (kayit.sonuc === "ok") t.ok += 1; else if (kayit.sonuc === "hata") t.hata += 1;
      if (!t.sonZamanISO || kayit.zamanISO > t.sonZamanISO) t.sonZamanISO = kayit.zamanISO;
      if (!ozet.sonHareketISO || kayit.zamanISO > ozet.sonHareketISO) ozet.sonHareketISO = kayit.zamanISO;
      const ms = Date.parse(kayit.zamanISO);
      if (Number.isFinite(ms) && simdi - ms <= 86_400_000) {
        ozet.son24s.toplam += 1;
        if (kayit.sonuc === "ok") ozet.son24s.ok += 1; else if (kayit.sonuc === "hata") ozet.son24s.hata += 1;
        if (typeof kayit.sureMs === "number" && Number.isFinite(kayit.sureMs)) { sureToplam += kayit.sureMs; sureAdet += 1; }
      }
    }
  }
  ozet.son24s.ortSureMs = sureAdet > 0 ? Math.round(sureToplam / sureAdet) : null;
  return ozet;
}
