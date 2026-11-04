// PANEL-ANA-1 FAZ-M (2026-11-03): oturum transcript okuma — SAF fonksiyonlar.
// Kaynak: <claudeEv>/projects/<slug>/<sessionId>.jsonl — slug, ajan cwd'sinin
// KARAKTER-BAŞINA TİRE çevrimi (koordinatör canlı ölçümü 2026-11-03: D:\Vibecode\ordu
// → D--Vibecode-ordu; ':' bir tire, '\' ayrı bir tire; nokta/boşluk da tire; harf
// katlaması YOK). DİKKAT — İKİ AYRI slug kuralı var: (a) Paseo agents dizin adı:
// [\\/:]+ TEK tire (server.js ORDU_DIZIN_ADI — doğru, dokunulmaz); (b) Claude
// projects slug: her özel karakter AYRI tire (BU fonksiyon). sessionId ajan kaydının
// persistence.sessionId alanı. TAM DOSYA ASLA yüklenmez (koordinatör örneği 54 MB):
// son KUYRUK_BAYT okunur, tail ortasında başlayan YARIM satır ATILIR (ilk TAM
// satırdan başlanır). Satır filtresi: yalnız KONUŞMA satırları (type user|assistant
// VE message.role aynı) + her satırda YALNIZ text blokları — thinking/tool_use/
// tool_result GİRMEZ (koordinatör ölçümü: user satırları gömülü tool_result'la
// 20K+ karakter olabilir). Metin tavanı kesildiyse İŞARETLİ (dürüst); son
// TUR_TAVAN balon. Transcript yoksa boş dizi — sahte içerik YASAK (E10).
// Sırlar/tokenlar bu katmana GİRMEZ: yalnız satir metin blokları okunur.
import { statSync, openSync, readSync, closeSync } from "node:fs";

export const KUYRUK_BAYT = 512 * 1024; // tail ~512KB (koordinatör brief'i)
export const METIN_TAVAN = 2000; // karakter/balon
export const TUR_TAVAN = 30; // son ~30 tur (balon adedi)

// cwd → Claude projects slug'i: her özel karakter AYRI tireye (karakter-başına; ayraç
// GRUBU tek tireye İNDİRİLMEZ). Koordinatör disk ölçümü: D--Vibecode-ordu VAR,
// D-Vibecode-ordu YOK; C--Users-gatep · nokta → tire (gatep--local) · boşluk → tire
// · küçük harf KORUNUR. Paseo agents dizin adı FARKLI kuraldır (server.js
// ORDU_DIZIN_ADI: [\\/:]+ tek tire) — orayla KARIŞTIRILMAZ.
export function slugYap(cwd) {
  return String(cwd).replace(/[^A-Za-z0-9]/g, "-");
}

// Son N baytı oku → TAM satır dizisi. Dosya N'den küçükse TAMAMI okunur (o durumda
// yarım satır YOK). Kesme noktası çok-baytlı UTF-8 karakterinin ortasına denk
// gelirse bozulan ilk parça, atılan yarım satırın parçasıdır (kalan satırlar temiz).
export function kuyrukOku(dosyaYolu, istenenBayt = KUYRUK_BAYT) {
  const st = statSync(dosyaYolu); // dosya yoksa fırlar — çağıran 404 dürüst basar
  const boyut = st.size > istenenBayt ? istenenBayt : st.size;
  const fd = openSync(dosyaYolu, "r");
  let ham = "";
  try {
    const buf = Buffer.alloc(boyut);
    for (let okunan = 0; okunan < boyut; ) {
      const n = readSync(fd, buf, okunan, boyut - okunan, st.size - boyut + okunan);
      if (n <= 0) break; // beklenmedik kısa okuma — kalan temiz kalır (dürüst)
      okunan += n;
    }
    ham = buf.toString("utf8");
  } finally { closeSync(fd); }
  if (boyut < st.size) {
    const i = ham.indexOf("\n");
    if (i === -1) return []; // kuyruğun TAMAMI tek satır: başı yarım — tamamı ATILIR (dürüst)
    ham = ham.slice(i + 1); // ilk TAM satırdan başla
  }
  return ham.split("\n").filter((s) => s.trim());
}

// Tek jsonl satırı → { rol, metin } | null (konuşma satırı DEĞİLSE null).
// type user|assistant + message.role aynı; content string YA DA blok dizisinin
// YALNIZ text blokları. Bozuk JSON null (atlanır — sessiz değil, sayılmaz burada).
export function satirdanBalon(satir) {
  let k = null;
  try { k = JSON.parse(satir); } catch { return null; }
  if (!k || typeof k !== "object" || !k.message || typeof k.message !== "object") return null;
  const tip = k.type;
  const rol = k.message.role;
  if (tip !== "user" && tip !== "assistant") return null; // api-request/mode/file/prompt_snapshot/… konuşma değil
  if (rol !== "user" && rol !== "assistant") return null;
  let metin = "";
  if (typeof k.message.content === "string") metin = k.message.content;
  else if (Array.isArray(k.message.content)) {
    const parcalar = [];
    for (const b of k.message.content) {
      if (b && typeof b === "object" && b.type === "text" && typeof b.text === "string") parcalar.push(b.text);
    }
    metin = parcalar.join("\n");
  }
  if (!metin.trim()) return null; // yalnız tool_use/tool_result/thinking → balon değil
  return { rol, metin };
}

// Metin tavanı: kısa metin AYNEN; uzunsa kes + dürüst 'kesildi' işareti.
export function balonTavan(metin, tavan = METIN_TAVAN) {
  const m = typeof metin === "string" ? metin : "";
  if (m.length <= tavan) return { metin: m, kesildi: false };
  return { metin: m.slice(0, tavan), kesildi: true };
}

// Kuyruk satırları → son TUR_TAVAN balon (metin tavanı uygulanmış). Kronoloji
// KORUNUR (dizi sırası aynen); konuşma satırı hiç yoksa boş dizi (dürüst).
export function transcriptHazirla(satirlar, secenekler = {}) {
  const metinTavani = secenekler && typeof secenekler.metinTavan === "number" && secenekler.metinTavan > 0 ? secenekler.metinTavan : METIN_TAVAN;
  const turTavani = secenekler && typeof secenekler.turTavani === "number" && secenekler.turTavani > 0 ? secenekler.turTavani : TUR_TAVAN;
  const ham = [];
  const liste = Array.isArray(satirlar) ? satirlar : [];
  for (const s of liste) {
    const b = satirdanBalon(s);
    if (b) ham.push(b);
  }
  return ham.slice(-turTavani).map((b) => {
    const t = balonTavan(b.metin, metinTavani);
    return { rol: b.rol, metin: t.metin, kesildi: t.kesildi };
  });
}
