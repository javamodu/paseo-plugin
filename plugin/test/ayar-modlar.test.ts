// S3 (v0.23) ayar/modlar konu-testleri — D2-18 (ayar cache LRU tavanı),
// D2-20 (modelDeseni uzunluk tavanı: ReDoS vektörü derlenmez).
import * as os from "node:os";
import * as fs from "node:fs";
import { ayarOku, _testIcinCacheBoyutu } from "../server/ayar";
import { modCoz } from "../server/modlar";

let hata = 0;
function assert(kosul: boolean, mesaj: string) {
  if (!kosul) { hata++; console.error("FAIL: " + mesaj); } else { console.log("ok: " + mesaj); }
}

async function main(): Promise<void> {
  // D2-18: her benzersiz cwd cache'e girer — cok-repo makinede sinirsiz buyume vardi.
  // 101 dizin → tavan 100; atilan giris diskten dogru okunmaya devam eder.
  {
    const kok = fs.mkdtempSync(os.tmpdir() + "/d218-");
    const dizinler: string[] = [];
    for (let i = 1; i <= 101; i++) {
      const d = kok + "/repo-" + i;
      fs.mkdirSync(d + "/.verimlilik", { recursive: true });
      fs.writeFileSync(d + "/.verimlilik/ayar.json", JSON.stringify({ pitbullYaziciDk: i }));
      dizinler.push(d);
    }
    for (const d of dizinler) ayarOku(d);
    assert(_testIcinCacheBoyutu() === 100, "D2-18: cache tavan 100'de kalir (101 dizin sonrasi): " + _testIcinCacheBoyutu());
    // Atlanan ilk dizin diskten YENIDEN okunur — deger kaybi yok.
    assert(ayarOku(dizinler[0]).pitbullYaziciDk === 1, "D2-18: atilan giris diskten dogru degerle geri gelir");
    assert(ayarOku(dizinler[100]).pitbullYaziciDk === 101, "D2-18: son giris cache'te durur");
    fs.rmSync(kok, { recursive: true, force: true });
  }

  // D2-20: modelDeseni kullanicinin ayar.json'ina yazdigi regex'tir — 200 karakter
  // ustu desen ReDoS tuzagi tasiyabilir; tavan ustu desen DERLENMEZ (eslesmez).
  {
    const t = fs.mkdtempSync(os.tmpdir() + "/d220-");
    fs.mkdirSync(t + "/.verimlilik", { recursive: true });
    const uzunDesen = "k" + "i".repeat(250); // 251 karakter — tavan ustu
    fs.writeFileSync(t + "/.verimlilik/ayar.json", JSON.stringify({
      modlar: { eslesmeler: [
        { provider: "testp", modelDeseni: uzunDesen, mod: "firtina" },
        { provider: "testp", modelDeseni: "gecerli", mod: "matbaa" },
      ] },
    }));
    assert(modCoz(t, "testp", "k" + "i".repeat(250)) === null, "D2-20: tavan ustu desen eslesmez (derlenmez)");
    assert(modCoz(t, "testp", "gecerli-model")?.ad === "matbaa", "D2-20: tavan alti desen normal eslesir");
    // Gecersiz regex desen eslesmez (null) — istisna firlamaz.
    fs.writeFileSync(t + "/.verimlilik/ayar.json", JSON.stringify({
      modlar: { eslesmeler: [{ provider: "testp2", modelDeseni: "((", mod: "firtina" }] },
    }));
    assert(modCoz(t, "testp2", "herhangi") === null, "D2-20: gecersiz regex sessizce eslesmez");
    fs.rmSync(t, { recursive: true, force: true });
  }
}

main().then(() => {
  if (hata > 0) { console.error(hata + " HATA"); process.exit(1); }
  console.log("TUM TESTLER GECTI (ayar-modlar)");
}).catch((e) => { console.error(e); process.exit(1); });
