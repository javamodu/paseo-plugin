import assert from "node:assert";
import { join } from "node:path";

const TABAN_BAYT = 5417;
const HEDEF_ORAN = 0.7;
const CEKIRDEK_TAVAN = 22;
const TOPLAM_TAVAN = 38;

async function main() {
  const { CEKIRDEK } = await import("../server/cekirdek");
  const { kuralSayisi, projeKuralSayisi, enjeksiyonMetni } = await import("../server/sozlesme");

  // KD-1: kütle diyeti — boyut ≤ %70 (taban 5417 B), çekirdek ≤22, toplam ≤38
  const bayt = Buffer.byteLength(CEKIRDEK, "utf8");
  assert(bayt <= Math.floor(TABAN_BAYT * HEDEF_ORAN), `KD-1: cekirdek <=%70 bayt (${bayt} > ${Math.floor(TABAN_BAYT * HEDEF_ORAN)})`);
  const cekirdekKural = kuralSayisi(CEKIRDEK);
  assert(cekirdekKural <= CEKIRDEK_TAVAN, `KD-1: cekirdek kural <=${CEKIRDEK_TAVAN} (${cekirdekKural})`);
  const toplam = cekirdekKural + projeKuralSayisi(process.cwd());
  assert(toplam <= TOPLAM_TAVAN, `KD-1: toplam kural <=${TOPLAM_TAVAN} (${toplam})`);

  // KD-1: kaynak v2.1 + tarih damgası (v2.0 arşivde; canlı metin onu işaret etmez)
  assert(CEKIRDEK.startsWith("# SÖZLEŞME ÇEKİRDEK"), "KD-1: baslik korunur");
  assert(CEKIRDEK.includes("(v2.1 — 2026-11-01)"), "KD-1: v2.1 + tarih damgasi");
  assert(!CEKIRDEK.includes("(v2.0)"), "KD-1: v2.0 damgasi canli metinde kalmaz");
  assert(!CEKIRDEK.includes("REHBERI-v2.0.md"), "KD-1: arsiv dosya adina isaretci kalmaz");

  // KD-1: davranış-kritik bölümler kaybolmaz
  for (const s of [
    "## Devir",
    "7. Append-only:",
    "okumadan-yazma kuralına tabi kalır",
    "EK özetleri",
    "model değişimini tur sınırında",
    "echo",
    "[insan]",
  ]) {
    assert(CEKIRDEK.includes(s), "KD-1: kritik bolum korunur: " + s);
  }
  assert(!CEKIRDEK.includes("5. Append-only:"), "KD-1: 5. Append-only dizgi hatasi geri gelmez");
  const n6 = CEKIRDEK.indexOf("\n6. ");
  const n7 = CEKIRDEK.indexOf("\n7. Append-only:");
  assert(n6 > -1 && n7 > n6, "KD-1: 6 -> 7 sirasi korunur");

  // KD-1: enjeksiyon hattı yeni metni kullanır ve 20KB bütçesinde kalır
  const tmp = join(process.cwd(), "node_modules", ".kd-tmp");
  const enj = enjeksiyonMetni(tmp, "test");
  assert(enj.metin.includes("# SÖZLEŞME ÇEKİRDEK (v2.1"), "KD-1: enjeksiyon v2.1 cekirdegi tasir");
  assert(!enj.butceAsimi, "KD-1: 20KB enjeksiyon butcesi asilmaz");

  console.log(`cekirdek-diyet.test.ts OK (${bayt} B / %${((100 * bayt) / TABAN_BAYT).toFixed(1)} · ${cekirdekKural}+${toplam - cekirdekKural}=${toplam} kural)`);
}

main();
