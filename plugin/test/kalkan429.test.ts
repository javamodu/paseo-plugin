// PK-1 (429-kalkani, 2026-11-01) hermetik testleri — defter semasi, sonNdk sayaci, pencere karari
// (RED/izin), env kapatma, dirilme dedupe/ust-sinir/sifirlama, RED'in deftere islenmesi.
// Canli 429 ucusu operatOR gozlemine kalir (gorev siniri: canli ajan spawn edilmez).
import * as os from "node:os";
import * as fs from "node:fs";
import { join } from "node:path";
import {
  hataSinifiBul, kayit429, sonNdk, kapiKontrol, turn429Isle, dirilmePlanla, dirilmeKapat,
  defterYolu, DIRILME_MESAJI, _testIcinDirilmeDurumu, VARSAYILAN_ESIK, MAKS_OTOMATIK_DIRILME,
} from "../server/kalkan429";
import { ajanTemizleHepsi } from "../server/temizlik";

let hata = 0;
function assert(kosul: boolean, mesaj: string) {
  if (!kosul) { hata++; console.error("FAIL: " + mesaj); } else { console.log("ok: " + mesaj); }
}

const bekle = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function satirYaz(dosya: string, damgaISO: string, agentId: string, provider: string, hataSinifi: string, tip: "429" | "kapi-red"): void {
  fs.appendFileSync(dosya, JSON.stringify({ damgaISO, agentId, workspaceId: "ws-x", provider, hataSinifi, tip }) + "\n", "utf8");
}

async function main(): Promise<void> {
  const kok = fs.mkdtempSync(join(os.tmpdir(), "k429-"));
  const defter = join(kok, "defter.jsonl");
  const saklanan = {
    defter: process.env.ORDU_429_DEFTER,
    kapi: process.env.ORDU_429_KAPI,
    pencere: process.env.ORDU_429_PENCERE_MS,
    dirilme: process.env.ORDU_429_DIRILME_MS,
  };
  process.env.ORDU_429_DEFTER = defter;
  delete process.env.ORDU_429_KAPI;
  delete process.env.ORDU_429_PENCERE_MS;
  delete process.env.ORDU_429_DIRILME_MS;

  try {
    // --- S1: hata sinifi desenleri (error metninden YALNIZCA etiket cikar) ---
    assert(hataSinifiBul("429 Too Many Requests") === "http-429", "S1: 429 metni http-429 sinifi");
    assert(hataSinifiBul({ code: "429", message: "provider kota" }) === "http-429", "S1: code=429 yakalanir");
    assert(hataSinifiBul("Rate limit exceeded") === "rate-limit", "S1: Rate limit yakalanir");
    assert(hataSinifiBul("rate_limit aşıldı") === "rate-limit", "S1: rate_limit alt-cizgi varyanti");
    assert(hataSinifiBul("RPM 25 exceeded") === "rpm", "S1: RPM deseni");
    assert(hataSinifiBul("requests per minute exceeded") === "rpm", "S1: requests-per-minute deseni");
    assert(hataSinifiBul("authentication failed (401)") === null, "S1: 429 disi hata null");
    assert(hataSinifiBul(null) === null && hataSinifiBul("") === null, "S1: bos/null metin null");

    // --- S2: defter semasi — 5 alan + tip; gizli deger YOK ---
    turn429Isle(
      { id: "s2a", workspaceId: "ws-1", provider: "codex" },
      { kind: "failed", error: { message: "429 Too Many Requests (api key sk-SECRET-TOKEN-123)" } },
      async () => { throw new Error("S2'de gonderim olmamaliydi"); },
    );
    const ham = fs.readFileSync(defter, "utf8");
    assert(ham.endsWith("\n") && ham.trim().split("\n").length === 1, "S2: tek satir + satir sonu");
    const satir = JSON.parse(ham.trim()) as Record<string, unknown>;
    assert(
      Object.keys(satir).sort().join(",") === "agentId,damgaISO,hataSinifi,provider,tip,workspaceId",
      "S2: defter semasi tam olarak 6 alan: " + Object.keys(satir).sort().join(","),
    );
    assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(String(satir.damgaISO)), "S2: damgaISO ISO-8601 biciminde");
    assert(satir.agentId === "s2a" && satir.workspaceId === "ws-1" && satir.provider === "codex", "S2: ajan/workspace/provider alanlari dogru");
    assert(satir.hataSinifi === "http-429" && satir.tip === "429", "S2: hataSinifi etiketi + tip=429");
    assert(!ham.includes("SECRET") && !ham.includes("sk-"), "S2: gizli deger (token) deftere ASLA girmez");
    assert(_testIcinDirilmeDurumu("s2a") !== null && _testIcinDirilmeDurumu("s2a")!.bekleyen === true, "S2: failed 429 turu dirilme planlar");

    // --- S3: sonNdk sayaci (defterden okur; kapi-red + bozuk satir + ileri damga sayilmaz) ---
    const defter3 = join(kok, "defter3.jsonl");
    process.env.ORDU_429_DEFTER = defter3;
    const d = (dk: number) => new Date(Date.now() + dk * 60_000).toISOString();
    satirYaz(defter3, d(-3), "a", "codex", "http-429", "429");
    satirYaz(defter3, d(-3), "b", "qoder", "rpm", "429");
    satirYaz(defter3, d(-40), "c", "codex", "rate-limit", "429");
    satirYaz(defter3, d(-1), "-", "codex", "kapi-red", "kapi-red");
    fs.appendFileSync(defter3, "{bozuk json\n", "utf8");
    satirYaz(defter3, d(2), "e", "codex", "http-429", "429");
    assert(sonNdk(10) === 2, "S3: son 10 dk = 2 (kapi-red ve bozuk satir sayilmaz): " + sonNdk(10));
    assert(sonNdk(60) === 3, "S3: son 60 dk = 3 (40 dk onceki de girer): " + sonNdk(60));
    assert(sonNdk(1) === 0, "S3: son 1 dk = 0 (+2 dk ileri damga tolerans disi): " + sonNdk(1));

    // --- S4: pencere karari — esik 2; izin -> RED; pencere uzunlugu env'den ---
    const defter4 = join(kok, "defter4.jsonl");
    process.env.ORDU_429_DEFTER = defter4;
    assert(kapiKontrol("codex").red === false, "S4: bos defterde izin");
    satirYaz(defter4, d(-2), "a", "codex", "http-429", "429");
    const k1 = kapiKontrol("codex");
    assert(k1.red === false && k1.sayac === 1, "S4: 1 olay esik alti — izin (esik " + VARSAYILAN_ESIK + ")");
    satirYaz(defter4, d(-1), "b", "codex", "rpm", "429");
    const k2 = kapiKontrol("qoder");
    assert(k2.red === true && k2.sayac === 2, "S4: 2 olay esikte — RED");
    assert(k2.mesaj !== null && k2.mesaj.includes("429 penceresi açık"), "S4: RED mesaji '429 penceresi açık' der");
    assert(k2.mesaj !== null && /~\d+ dk sonra tekrar dene/.test(k2.mesaj), "S4: RED mesaji ~X dk tahmini tasir");
    assert(k2.mesaj !== null && k2.mesaj.includes(defterYolu()), "S4: RED mesaji defter yolunu tasir");
    assert(k2.kalanMs !== null && k2.kalanMs >= 60_000 && k2.kalanMs <= 9 * 60_000, "S4: kalan sure pencere icinde (olay 9 dk once): " + k2.kalanMs);
    process.env.ORDU_429_PENCERE_MS = "60000"; // 1 dk pencere: 1-2 dk onceki olaylar disarida
    assert(kapiKontrol("codex").red === false, "S4: ORDU_429_PENCERE_MS=60000 pencere daralir → olaylar yaslanir, izin");
    process.env.ORDU_429_PENCERE_MS = "abc"; // gecersiz → varsayilan 10 dk
    const k3 = kapiKontrol("codex");
    assert(k3.red === true && k3.pencereMs === 10 * 60_000, "S4: gecersiz pencere env'i varsayilana duser");
    delete process.env.ORDU_429_PENCERE_MS;

    // --- S5: env kapatma — ORDU_429_KAPI=0: RED yok, deftere kapi-red YAZILMAZ ---
    const satirSayisi = fs.readFileSync(defter4, "utf8").trim().split("\n").length;
    process.env.ORDU_429_KAPI = "0";
    const k4 = kapiKontrol("codex");
    assert(k4.red === false && k4.mesaj === null, "S5: KAPI=0 iken RED uretilmez");
    assert(fs.readFileSync(defter4, "utf8").trim().split("\n").length === satirSayisi, "S5: kapi kapaliyken deftere hicbir sey yazilmaz");
    delete process.env.ORDU_429_KAPI;
    assert(kapiKontrol("codex").red === true, "S5: env silinince varsayilan ACIK (fail-closed) — RED geri gelir");

    // --- S6: RED deftere islenir; sayaca KARISMAZ (kendini besleyen pencere yok) ---
    const defter6 = join(kok, "defter6.jsonl");
    process.env.ORDU_429_DEFTER = defter6;
    satirYaz(defter6, d(-2), "a", "codex", "http-429", "429");
    satirYaz(defter6, d(-1), "b", "codex", "rpm", "429");
    const r1 = kapiKontrol("glm");
    assert(r1.red === true, "S6: RED karari verildi");
    const satirlar = fs.readFileSync(defter6, "utf8").trim().split("\n").map((s) => JSON.parse(s) as Record<string, unknown>);
    const redSatiri = satirlar.find((s) => s.tip === "kapi-red");
    assert(redSatiri !== undefined, "S6: RED deftere islenir (tip=kapi-red)");
    assert(redSatiri!.agentId === "-" && redSatiri!.provider === "glm" && redSatiri!.hataSinifi === "kapi-red", "S6: kapi-red satiri alanlari dogru");
    assert(sonNdk(10) === 2, "S6: kapi-red satiri sayaca girmez (olumsuz geri besleme yok): " + sonNdk(10));
    const r2 = kapiKontrol("glm");
    assert(r2.red === true && r2.sayac === 2, "S6: RED sonrasi sayac ayni (pencere sismez)");

    // --- S7: dirilme — dedupe, ust sinir 2, completed sifirlama, agent.closed, kapat ---
    process.env.ORDU_429_DIRILME_MS = "40";
    const defter7 = join(kok, "defter7.jsonl");
    process.env.ORDU_429_DEFTER = defter7;
    let giden = 0;
    const g7 = async () => { giden++; };
    assert(dirilmePlanla("a1", g7) === true, "S7: ilk dirilme planlanir");
    assert(dirilmePlanla("a1", g7) === false, "S7: bekleyen dirilme varken ikinci plan REDdedilir (cift gonderim yok)");
    await bekle(140);
    assert(giden === 1, "S7: tek tetikleme tek gonderim: " + giden);
    // ust sinir: a2 icin 3 deneme → 2 gonderim (3.'sü insan kapisi)
    let giden2 = 0;
    const g2 = async () => { giden2++; };
    assert(dirilmePlanla("a2", g2) === true, "S7: a2 deneme 1 planlanir");
    await bekle(140);
    assert(dirilmePlanla("a2", g2) === true, "S7: a2 deneme 2 planlanir");
    await bekle(140);
    assert(dirilmePlanla("a2", g2) === false, "S7: " + MAKS_OTOMATIK_DIRILME + " otomatik denemeden sonra insan kapisi");
    assert(giden2 === 2, "S7: tam 2 otomatik gonderim (tavan): " + giden2);
    const dA2 = _testIcinDirilmeDurumu("a2");
    assert(dA2 !== null && dA2.sayac === 2 && dA2.bekleyen === false, "S7: a2 sayac 2, bekleyen yok");
    // completed tur → bekleyen iptal + sayac sifir
    assert(dirilmePlanla("a3", async () => { giden++; }) === true, "S7: a3 dirilme planlanir");
    turn429Isle({ id: "a3", workspaceId: null, provider: "codex" }, { kind: "completed" }, async () => { giden++; });
    assert(_testIcinDirilmeDurumu("a3") === null, "S7: completed tur dirilme state'ini sifirlar");
    await bekle(140);
    assert(giden === 1, "S7: iptal edilen dirilme gonderim uretmez (giden hala 1): " + giden);
    // agent.closed → temizlik kayit defteri (temizlik.ts) uzerinden
    assert(dirilmePlanla("a4", async () => { giden++; }) === true, "S7: a4 dirilme planlanir");
    ajanTemizleHepsi("a4");
    assert(_testIcinDirilmeDurumu("a4") === null, "S7: agent.closed dirilme state'ini temizler");
    await bekle(140);
    assert(giden === 1, "S7: kapanan ajana gec dirilme gitmez");
    // canceled tur → dokunma
    turn429Isle({ id: "a6", workspaceId: null, provider: "codex" }, { kind: "canceled", reason: "kullanici" }, async () => { giden++; });
    assert(_testIcinDirilmeDurumu("a6") === null, "S7: canceled tur dirilme planlamaz");
    assert(!fs.existsSync(defter7) || fs.readFileSync(defter7, "utf8").trim() === "", "S7: canceled tur deftere satir yazmaz");
    // 429'suz failed tur → dokunma (deftere yazmaz, dirilme planlamaz)
    turn429Isle({ id: "a7", workspaceId: null, provider: "codex" }, { kind: "failed", error: { message: "authentication failed (401)" } }, async () => { giden++; });
    assert(_testIcinDirilmeDurumu("a7") === null, "S7: 429 disi failed tur dirilme planlamaz");
    // plugin unload → tum zamanlayicilar iptal
    assert(dirilmePlanla("a5", async () => { giden++; }) === true, "S7: a5 dirilme planlanir");
    dirilmeKapat();
    assert(_testIcinDirilmeDurumu("a5") === null && _testIcinDirilmeDurumu("a2") === null, "S7: dirilmeKapat tum state'i temizler");
    await bekle(140);
    assert(giden === 1, "S7: kapatma sonrasi hicbir gonderim: " + giden);
    delete process.env.ORDU_429_DIRILME_MS;
    assert(DIRILME_MESAJI.includes("429 penceresi geçti") && DIRILME_MESAJI.includes("kalıcı kayıtlardan devam et"), "S7: dirilme mesaji plan metniyle birebir");

    // --- S8: defter yazim hatasi YUTULUR (event akisini bloke etmez) ---
    process.env.ORDU_429_DEFTER = kok; // dizin → openSync EISDIR → yakalanir
    let firladi = false;
    try {
      kayit429({ agentId: "s8", workspaceId: null, provider: "codex", hataSinifi: "http-429" });
      const k8 = kapiKontrol("codex");
      assert(k8.red === false, "S8: okunamayan defter izin verir (red karar icin kanit yok)");
    } catch {
      firladi = true;
    }
    assert(firladi === false, "S8: defter yazim hatasi firlatilmaz (best-effort, loglanir)");

    // --- S9: defter yolu — env gecersiz kilar; varsayilan plugin data evi ---
    delete process.env.ORDU_429_DEFTER;
    const yol = defterYolu();
    assert(yol.replace(/\\/g, "/").endsWith("plugin/data/429-defter.jsonl"), "S9: varsayilan defter plugin/data evinde: " + yol);
  } finally {
    if (saklanan.defter === undefined) delete process.env.ORDU_429_DEFTER; else process.env.ORDU_429_DEFTER = saklanan.defter;
    if (saklanan.kapi === undefined) delete process.env.ORDU_429_KAPI; else process.env.ORDU_429_KAPI = saklanan.kapi;
    if (saklanan.pencere === undefined) delete process.env.ORDU_429_PENCERE_MS; else process.env.ORDU_429_PENCERE_MS = saklanan.pencere;
    if (saklanan.dirilme === undefined) delete process.env.ORDU_429_DIRILME_MS; else process.env.ORDU_429_DIRILME_MS = saklanan.dirilme;
    fs.rmSync(kok, { recursive: true, force: true });
  }
}

main().then(() => {
  if (hata > 0) { console.error(hata + " HATA"); process.exit(1); }
  console.log("TUM TESTLER GECTI (kalkan429)");
}).catch((e) => { console.error(e); process.exit(1); });
