import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MAX_ICERIK_BYTES = 24 * 1024;

export interface DegerlendirmeOzet {
  dosya: string | null;
  icerik: string | null;
  kilitler: string[];
}

// ISO tarihli dosya adlari lexicographic siralanir — mtime yerine ada gore sirala (deterministik).
export function sonDegerlendirmeOku(cwd: string): DegerlendirmeOzet {
  const kilitler = kilitleriListele(cwd);
  const dir = join(cwd, "raporlar", "oz-degerlendirme");
  if (!existsSync(dir)) return { dosya: null, icerik: null, kilitler };
  try {
    const raporlar = readdirSync(dir)
      .filter((d) => /^\d{4}-\d{2}-\d{2}.*\.md$/i.test(d))
      .sort((a, b) => b.localeCompare(a));
    if (raporlar.length === 0) return { dosya: null, icerik: null, kilitler };
    const son = raporlar[0];
    let icerik = readFileSync(join(dir, son), "utf8");
    if (Buffer.byteLength(icerik, "utf8") > MAX_ICERIK_BYTES) {
      // A2-11 (v0.23): String.slice UTF-16 kod-birim keser — cokbaytli metinde 24KB butce ~48KB'a tasardi
      // ve karakteri ortadan bolebilir. Buffer uzerinden bayt-hizali kesim; kesim noktasi devam-baytina
      // denk gelirse karakterin ONCESINE gerilenir (p, lead baytin indeksine duser).
      const buf = Buffer.from(icerik, "utf8");
      let p = MAX_ICERIK_BYTES;
      while (p > 0 && (buf[p] & 0xc0) === 0x80) p--;
      icerik = buf.subarray(0, p).toString("utf8") + "\n\n...(kirpildi)";
    }
    return { dosya: son, icerik, kilitler };
  } catch {
    return { dosya: null, icerik: null, kilitler };
  }
}

export function kilitleriListele(cwd: string): string[] {
  const dir = join(cwd, "surumler");
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir)
      .filter((d) => existsSync(join(dir, d, "kilit.json")))
      .sort();
  } catch {
    return [];
  }
}
