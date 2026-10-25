import assert from "node:assert";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  // A1-3: devir toreni numaralandirmasi sirali, "Append-only" 7 numara tasir
  const { CEKIRDEK } = await import("../server/cekirdek");
  assert(!CEKIRDEK.includes("5. Append-only:"), "A1-3: 5. Append-only dizgi hatasi kaldirildi");
  assert(CEKIRDEK.includes("7. Append-only:"), "A1-3: Append-only 7 numara tasir");
  const devir = CEKIRDEK.slice(CEKIRDEK.indexOf("## Devir"));
  const n6 = devir.indexOf("\n6. ");
  const n7 = devir.indexOf("\n7. Append-only:");
  assert(n6 > -1 && n7 > n6, "A1-3: 6 -> 7 sirasi dogru");

  // kabul kriteri: enjeksiyonMetni ciktisinda Append-only satiri 7 numara
  const { enjeksiyonMetni } = await import("../server/sozlesme");
  const tmp = mkdtempSync(join(tmpdir(), "kucukfix-"));
  const enj = enjeksiyonMetni(tmp, "test promptu");
  assert(/^7\. Append-only:/m.test(enj.metin), "A1-3: enjeksiyon metninde Append-only 7 numara");

  // D2-19: prototip zinciri uzerinden sahte mod kabul edilemez
  const { modAyarla, aktifModOku, aktifModYaz, eslesmeOku } = await import("../server/modlar");
  assert(!modAyarla(tmp, "constructor").ok, "D2-19: constructor gecerli mod sayilamaz");
  assert(!modAyarla(tmp, "toString").ok, "D2-19: toString gecerli mod sayilamaz");
  assert(!modAyarla(tmp, "hasOwnProperty").ok, "D2-19: hasOwnProperty gecerli mod sayilamaz");
  mkdirSync(join(tmp, ".verimlilik"), { recursive: true });
  writeFileSync(join(tmp, ".verimlilik", "mod.json"), JSON.stringify({ aktif: "constructor" }), "utf8");
  assert(aktifModOku(tmp) === null, "D2-19: diskteki constructor aktif mod sayilmaz");
  aktifModYaz(tmp, "cerrah");
  assert(aktifModOku(tmp) === "cerrah", "D2-19: gercek mod okunur (regresyon)");
  writeFileSync(join(tmp, ".verimlilik", "ayar.json"), JSON.stringify({ modlar: { eslesmeler: [{ provider: "x", modelDeseni: "", mod: "constructor" }] } }), "utf8");
  assert(!eslesmeOku(tmp).some((e) => e.provider === "x"), "D2-19: eslesmede constructor modu elenir");

  // D2-29: brief lint regexi durtme metniyle hizali (hedef/cikti formati/arac-kaynak/gorev siniri)
  const { briefTara } = await import("../server/brief");
  const msg = { type: "user_message", text: "delege et" };
  const ok = { type: "assistant_message", text: "tamam" };
  const sub = (description: string) => ({ type: "tool_call", detail: { type: "sub_agent", description } });
  const durtmeDilli = [msg, sub("Hedef: X yapilacak. Cikti formati: diff ozeti. Arac/kaynak: repo koku. Gorev siniri: commit yok."), ok];
  const b1 = briefTara(durtmeDilli as never);
  assert(b1.toplam === 1 && b1.zayif === 0, "D2-29: durtme dilindeki 4 oge sayilir (arac/kaynak + gorev siniri)");
  const turkce = [msg, sub("Hedef: X. Çıktı formatı: Y. Araç/kaynak: Z. Görev sınırı: W."), ok];
  assert(briefTara(turkce as never).zayif === 0, "D2-29: Turkce varyantlar sayilir");
  const ikiOge = [msg, sub("Hedef: X yapilacak. Kabul kriteri: testler yesil. Uzunluk icin ek metin buraya geliyor."), ok];
  assert(briefTara(ikiOge as never).zayif === 1, "D2-29: 2 oge hala zayif (esik bozulmadi)");

  console.log("kucukfix.test.ts OK");
}

main();
