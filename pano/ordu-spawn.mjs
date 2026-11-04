// ordu-spawn.mjs — K-0065 DALGA B: spawn-talebi kuyruğu çekirdeği (panel → KURMAY zinciri).
// Karar K-0065: + düğmesi spawn ETMEZ — TALEP düşürür; panel sunucusu ajan süreci YÖNETMEZ.
// TEK yeni kalıcı state = append-only JSONL kuyruk (satirEkle: mkdir + open(a) + fsync —
// hareketKaydet defteri deseni; eski satır asla bozulmaz/silinmez):
//   tur "talep"  → panel düşürür (server POST /api/spawn-talebi)
//   tur "sonuc"  → KURMAY işleyince yazar (create_agent sonrası); panel GET ile okur (SSOT)
// Okuma salt-okur read-model: bozuk satır atlanır + SAYILIR (gizlenmez — E10); durum türetilir;
// talepId eşleşmesinde EN SON sonuç kazanır. Yok/boş → dürüst SIFIR (hareket yok demektir).
import { existsSync, mkdirSync, openSync, appendFileSync, fsyncSync, closeSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";

const KUYRUK_TAVAN = 200; // okuma penceresi: son 200 talep (kaynak defter append-only — panel silmez)
const ILK_MESAJ_PENCERE = 300; // read-model kısaltma tavanı (TAM metin kuyruk dosyasında — KURMAY dosyadan okur)
const DURUMLAR = ["islandi", "hata"];

function satirEkle(yol, kayit) {
  mkdirSync(dirname(yol), { recursive: true });
  const fd = openSync(yol, "a"); // append-only: eski satir bozulmaz
  try { appendFileSync(fd, JSON.stringify(kayit) + "\n"); fsyncSync(fd); } finally { closeSync(fd); }
}

// Panel talebi — RED'ler throw (uç 400/422 döner; kesme YOK: sınırı aşan girdi DÜRÜST reddedilir).
export function talepEkle(yol, talep) {
  if (!talep || typeof talep !== "object") throw new Error("talep nesne degil");
  const proje = typeof talep.proje === "string" ? talep.proje.trim() : "";
  if (!proje) throw new Error("talep.proje zorunlu (Paseo agents dizin adi)");
  if (proje.length > 200) throw new Error("talep.proje 200 karakteri asamaz (kesilmez — RED)");
  const baslik = typeof talep.baslik === "string" ? talep.baslik.trim() : "";
  if (baslik.length > 200) throw new Error("talep.baslik 200 karakteri asamaz (kesilmez — RED)");
  const ilkMesaj = typeof talep.ilkMesaj === "string" ? talep.ilkMesaj.trim() : "";
  if (ilkMesaj.length > 3000) throw new Error("talep.ilkMesaj 3000 karakteri asamaz (kesilmez — RED)");
  const kayit = { tur: "talep", talepId: randomUUID(), zamanISO: new Date().toISOString(), proje };
  if (baslik) kayit.baslik = baslik; // boş alan yazılmaz (uydurma değer YOK)
  if (ilkMesaj) kayit.ilkMesaj = ilkMesaj;
  satirEkle(yol, kayit);
  return kayit;
}

// KURMAY sonucu — talepId eşleşmeli; durum islandi|hata; ajanId işlenen ajanın kimliği (K-0065 §1).
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

// Read-model (salt-okur) — panel GET /api/ordu/spawn-kuyruk bu özeti okur; kuyruk dosyası SSOT.
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
      if (typeof k.talepId !== "string" || typeof k.proje !== "string") { ozet.bozukSatir += 1; continue; }
      talepler.push(k);
    } else if (k.tur === "sonuc") {
      if (typeof k.talepId !== "string" || !DURUMLAR.includes(k.durum)) { ozet.bozukSatir += 1; continue; }
      const eski = sonuclar.get(k.talepId);
      if (!eski || k.zamanISO > eski.zamanISO) sonuclar.set(k.talepId, k);
    } else { ozet.bozukSatir += 1; continue; } // bilinmeyen tur — dürüst sayılır, gizlenmez
  }
  for (const t of talepler.slice(-KUYRUK_TAVAN)) { // pencere: defterde kalır, listede son 200
    const s = sonuclar.get(t.talepId) || null;
    const satir = { talepId: t.talepId, zamanISO: t.zamanISO, proje: t.proje };
    if (typeof t.baslik === "string" && t.baslik) satir.baslik = t.baslik;
    if (typeof t.ilkMesaj === "string" && t.ilkMesaj) {
      if (t.ilkMesaj.length > ILK_MESAJ_PENCERE) { satir.ilkMesaj = t.ilkMesaj.slice(0, ILK_MESAJ_PENCERE); satir.ilkMesajKisitli = true; }
      else satir.ilkMesaj = t.ilkMesaj;
    }
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

// KURMAY kimliği kadro SSOT'tan (tur 'kurmay' + ölçülmüş ajanId; MANAGER şablonu ajanId
// taşımaz → atlanır — panel kurmayKimligi() ile AYNI kural). Çözülemezse null (fail-closed;
// uydurulmaz). /api/spawn-talebi bu null'da talebi KABUL ETMEZ (zincirin başı kopuk — 503).
export function kurmayKimligiCoz(kadroYolu) {
  try {
    const kadro = JSON.parse(readFileSync(kadroYolu, "utf8"));
    const b = Array.isArray(kadro && kadro.birlikler)
      ? kadro.birlikler.find((x) => x && x.tur === "kurmay" && typeof x.ajanId === "string" && x.ajanId.trim())
      : null;
    return b ? { ajanId: b.ajanId.trim(), kodAdi: typeof b.kodAdi === "string" ? b.kodAdi : null } : null;
  } catch { return null; }
}
