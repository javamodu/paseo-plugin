// ordu-rename.mjs — M2b: rename-talebi kuyruğu çekirdeği (K-0065 deseninin rename uyarlaması).
// Karar K-0065: panel YENİ ADLAYAMAZ — TALEP düşürür; panel sunucusu ajan/workspace YÖNETMEZ.
// Zincir: panel POST /api/rename-talebi → talep bu kuyruğa (SSOT) + KURMAY'a kısa bildirim →
// KURMAY MCP ile rename işletir → sonucu kuyruğa yazar → panel GET ile okur.
// TEK yeni kalıcı state = append-only JSONL kuyruk (satirEkle: mkdir + open(a) + fsync —
// ordu-spawn.mjs deseni; eski satır asla bozulmaz/silinmez):
//   tur "talep"  → panel düşürür (server POST /api/rename-talebi)
//   tur "sonuc"  → KURMAY işleyince yazar (rename sonrası); panel GET ile okur (SSOT)
// Okuma salt-okur read-model: bozuk satır atlanır + SAYILIR (gizlenmez — E10); durum türetilir;
// talepId eşleşmesinde EN SON sonuç kazanır. Yok/boş → dürüst SIFIR. yeniAd KISA alandır —
// TAM okunur (kısaltma penceresi YOK; ilkMesaj'ın aksine ≤200 olduğu çekirdekte garanti).
import { existsSync, mkdirSync, openSync, appendFileSync, fsyncSync, closeSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";

const KUYRUK_TAVAN = 200; // okuma penceresi: son 200 talep (kaynak defter append-only — panel silmez)
const HEDEF_TIPLERI = ["proje", "oturum"]; // proje = Paseo agents TAM dizin adı · oturum = ajan kimliği
const DURUMLAR = ["islandi", "hata"];

function satirEkle(yol, kayit) {
  mkdirSync(dirname(yol), { recursive: true });
  const fd = openSync(yol, "a"); // append-only: eski satir bozulmaz
  try { appendFileSync(fd, JSON.stringify(kayit) + "\n"); fsyncSync(fd); } finally { closeSync(fd); }
}

// Panel talebi — RED'ler throw (uç 400/422 döner; kesme YOK: sınırı aşan girdi DÜRÜST reddedilir).
// hedef: hedefTip "proje" → Paseo agents TAM dizin adı (ör. D-Vibecode-ordu) ·
//        hedefTip "oturum" → Paseo ajan kimliği (TAM uuid). Whitelist doğrulaması server ucunda.
export function talepEkle(yol, talep) {
  if (!talep || typeof talep !== "object") throw new Error("talep nesne degil");
  const hedefTip = typeof talep.hedefTip === "string" ? talep.hedefTip.trim() : "";
  if (!HEDEF_TIPLERI.includes(hedefTip)) throw new Error("talep.hedefTip 'proje'|'oturum' olmali (alinan: " + String(talep.hedefTip) + ")");
  const hedef = typeof talep.hedef === "string" ? talep.hedef.trim() : "";
  if (!hedef) throw new Error("talep.hedef zorunlu (proje: Paseo agents dizin adi | oturum: ajan kimligi)");
  if (hedef.length > 200) throw new Error("talep.hedef 200 karakteri asamaz (kesilmez — RED)");
  const yeniAd = typeof talep.yeniAd === "string" ? talep.yeniAd.trim() : "";
  if (!yeniAd) throw new Error("talep.yeniAd zorunlu (dolu string — bos/kesisik YOK)");
  if (yeniAd.length > 200) throw new Error("talep.yeniAd 200 karakteri asamaz (kesilmez — RED)");
  const kayit = { tur: "talep", talepId: randomUUID(), zamanISO: new Date().toISOString(), hedefTip, hedef, yeniAd };
  satirEkle(yol, kayit);
  return kayit;
}

// KURMAY sonucu — talepId eşleşmeli; durum islandi|hata; ajanId işleyen kimliği (K-0065 §1 deseni).
export function sonucEkle(yol, sonuc) {
  if (!sonuc || typeof sonuc !== "object") throw new Error("sonuc nesne degil");
  if (typeof sonuc.talepId !== "string" || !sonuc.talepId.trim()) throw new Error("sonuc.talepId zorunlu");
  if (!DURUMLAR.includes(sonuc.durum)) throw new Error("sonuc.durum 'islandi'|'hata' olmali (alinan: " + String(sonuc.durum) + ")");
  const kayit = { tur: "sonuc", talepId: sonuc.talepId.trim(), durum: sonuc.durum, zamanISO: new Date().toISOString() };
  if (typeof sonuc.ajanId === "string" && sonuc.ajanId.trim()) kayit.ajanId = sonuc.ajanId.trim();
  if (typeof sonuc.detay === "string" && sonuc.detay.trim()) kayit.detay = sonuc.detay.trim();
  satirEkle(yol, kayit);
  return kayit;
}

// Read-model (salt-okur) — panel GET /api/ordu/rename-kuyruk bu özeti okur; kuyruk dosyası SSOT.
export function kuyrukOzet(yol) {
  const ozet = { toplamTalep: 0, kuyrukta: 0, islenen: 0, hatali: 0, bozukSatir: 0, talepler: [] };
  const son = () => ({ olcumAniISO: new Date().toISOString(), ...ozet });
  if (!existsSync(yol)) return son(); // dürüst sıfır — hareket hiç doğmamış
  const talepler = [];
  const sonuclar = new Map(); // talepId → EN SON sonuc kaydı
  for (const satir of readFileSync(yol, "utf8").split("\n")) {
    const ham = satir.trim();
    if (!ham) continue;
    let k = null;
    try { k = JSON.parse(ham); } catch { ozet.bozukSatir += 1; continue; }
    if (!k || typeof k !== "object" || typeof k.tur !== "string" || typeof k.zamanISO !== "string") { ozet.bozukSatir += 1; continue; }
    if (k.tur === "talep") {
      if (typeof k.talepId !== "string" || !HEDEF_TIPLERI.includes(k.hedefTip) || typeof k.hedef !== "string" || typeof k.yeniAd !== "string") { ozet.bozukSatir += 1; continue; }
      talepler.push(k);
    } else if (k.tur === "sonuc") {
      if (typeof k.talepId !== "string" || !DURUMLAR.includes(k.durum)) { ozet.bozukSatir += 1; continue; }
      const eski = sonuclar.get(k.talepId);
      if (!eski || k.zamanISO > eski.zamanISO) sonuclar.set(k.talepId, k);
    } else { ozet.bozukSatir += 1; continue; } // bilinmeyen tur — dürüst sayılır, gizlenmez
  }
  for (const t of talepler.slice(-KUYRUK_TAVAN)) { // pencere: defterde kalır, listede son 200
    const s = sonuclar.get(t.talepId) || null;
    const satir = { talepId: t.talepId, zamanISO: t.zamanISO, hedefTip: t.hedefTip, hedef: t.hedef, yeniAd: t.yeniAd }; // yeniAd TAM (kısa alan)
    ozet.toplamTalep += 1;
    if (!s) { ozet.kuyrukta += 1; satir.durum = "kuyrukta"; }
    else {
      satir.durum = s.durum; satir.sonucZamanISO = s.zamanISO;
      if (s.ajanId) satir.ajanId = s.ajanId;
      if (s.detay) satir.detay = s.detay;
      if (s.durum === "islandi") ozet.islenen += 1; else ozet.hatali += 1;
    }
    ozet.talepler.push(satir);
  }
  return son();
}
