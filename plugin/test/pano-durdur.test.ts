// TUR A - pano STOP ucu (dalga-3 C-2): "durdur" eylemi calisan turu daemon interrupt'iyla keser.
// Gercek HTTP sunucusu (panoBaslat, ephemeral port) + sahte PaseoApi (send cagrilari kayda alinir).
// kill-9 DAEMON otoritesidir - plugin ucu interrupt ile sinirlidir (pano.ts kaynak notu).
import assert from "node:assert";
import http from "node:http";
import { writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface Gonderilen { agentId: string; metin: string; activeTurnBehavior?: string }

async function main() {
  const { panoBaslat } = await import("../server/pano");

  const gonderilen: Gonderilen[] = [];
  const sahtePaseo = {
    agents: {
      list: async () => ({ entries: [] }),
      ref: (id: string) => ({
        send: async (metin: string, options?: { activeTurnBehavior?: string }) => {
          gonderilen.push({ agentId: id, metin, activeTurnBehavior: options?.activeTurnBehavior });
        },
      }),
    },
  };

  const port = 43781; // test port'u (4378'in test ikizi; cakisma olursa ortam zaten kirmizi olur)
  process.env.PANO_PORT = String(port);
  process.env.PANO_TOKEN = "test-token";
  process.env.PANO_UI_DIR = "D:\\Vibecode\\ordu\\pano";
  const pano = panoBaslat(() => sahtePaseo as never);

  try {
    // sunucu dinlemeye gecsin
    await new Promise((resolve) => setTimeout(resolve, 200));
    assert.equal(pano.durum().dinliyor, true, "test sunucusu dinlemeli");

    const istek = (govde: unknown, token: string | null): Promise<{ kod: number; cevap: any }> =>
      new Promise((resolve, reject) => {
        const veri = JSON.stringify(govde);
        const req = http.request(
          { host: "127.0.0.1", port, path: "/api/emir", method: "POST", headers: { "content-type": "application/json", ...(token ? { "x-pano-token": token } : {}) } },
          (res) => {
            let buf = "";
            res.on("data", (p: Buffer) => { buf += p; });
            res.on("end", () => resolve({ kod: res.statusCode ?? 0, cevap: JSON.parse(buf) }));
          },
        );
        req.on("error", reject);
        req.end(veri);
      });

    // 1) durdur: interrupt ile tur kesilir
    const r1 = await istek({ eylem: "durdur", agentId: "ajan-1" }, "test-token");
    assert.equal(r1.kod, 202, "durdur 202 donmeli");
    assert.equal(r1.cevap.ok, true);
    assert.equal(gonderilen.length, 1, "tek send cagrilmali");
    assert.equal(gonderilen[0].agentId, "ajan-1");
    assert.equal(gonderilen[0].activeTurnBehavior, "interrupt", "STOP ucu interrupt semantigiyle gonderilmeli");
    assert.ok(gonderilen[0].metin.startsWith("STOP"), "durdurma emri acik metin tasimali");

    // 2) durdur: agentId yoksa RED
    const r2 = await istek({ eylem: "durdur" }, "test-token");
    assert.equal(r2.kod, 422, "agentId'siz durdur 422");
    assert.equal(r2.cevap.ok, false);

    // 3) token yoksa yazma kapisi fail-closed (mevcut davranisin regresyonu)
    const r3 = await istek({ eylem: "durdur", agentId: "ajan-1" }, null);
    assert.equal(r3.kod, 401, "tokensuz POST 401");
    assert.equal(gonderilen.length, 1, "tokensuz istek send'e ulasmamali");

    // 4) /api/kabul: defter tabanli canli kabul (TUR A - 4, dalga-3 C-2)
    const get = (path: string): Promise<{ kod: number; cevap: any }> =>
      new Promise((resolve, reject) => {
        http.get({ host: "127.0.0.1", port, path }, (res) => {
          let buf = "";
          res.on("data", (p: Buffer) => { buf += p; });
          res.on("end", () => resolve({ kod: res.statusCode ?? 0, cevap: JSON.parse(buf) }));
        }).on("error", reject);
      });
    const k = await get("/api/kabul");
    assert.equal(k.kod, 200, "kabul ucu 200 (repo ici plans/kabul.csv gercek dosya)");
    assert.ok(k.cevap.toplam > 50, "defter gercek satir tasimali (117 satir civari)");
    assert.equal(k.cevap.yesil + k.cevap.hermetik + k.cevap.diger, k.cevap.toplam, "sayim tutarli");
    assert.ok(k.cevap.hermetik > 0, "GECTI_HERMETIC ayri sayilmali (SARI - canli kanit yok)");
    assert.ok(k.cevap.oran !== null && k.cevap.oran < 100, "oran dürüst: tam yesil DEGIL (fail-closed defter)");
    assert.ok(k.cevap.satirlar.every((s: any) => typeof s.id === "string" && typeof s.durum === "string"), "satir semasi: id+faz+kaynak+durum+kaniT");

    // 5) ORDU_KABUL_CSV gecersiz kilar: gecici defter servis edilir (BUG-2026-10-25 worker-killer
    //    duzeltmesinin test tarafindan gorulebilen yuzu — eval baglamindaki kok env ile bagimsiz sinanir;
    //    eval dali bizzat uretimde, canli probe ile dogrulanir)
    const geciciCsv = join(tmpdir(), "kabul-test-" + Date.now() + ".csv");
    writeFileSync(geciciCsv, "id,faz,kaynak,durum,kaniT\r\nX-1,F1,test,PASS,k\r\nX-2,F1,test,GECTI_HERMETIC,k\r\n", "utf8");
    process.env.ORDU_KABUL_CSV = geciciCsv;
    const k2 = await get("/api/kabul");
    delete process.env.ORDU_KABUL_CSV;
    rmSync(geciciCsv, { force: true });
    assert.equal(k2.kod, 200, "env gecersiz: gecici defter okunur");
    assert.equal(k2.cevap.toplam, 2, "gecici defterin 2 satiri");
    assert.equal(k2.cevap.yesil, 1, "PASS yesil sayilir");
    assert.equal(k2.cevap.hermetik, 1, "GECTI_HERMETIC ayri SARI sayilir");
    assert.equal(k2.cevap.oran, 50, "oran = 1/2 = %50");
  } finally {
    pano.kapat();
    delete process.env.PANO_PORT;
    delete process.env.PANO_TOKEN;
    delete process.env.ORDU_KABUL_CSV;
  }

  console.log("PANO-DURDUR: durdur eylemi -> send(activeTurnBehavior=interrupt) + STOP metni; agentId'siz 422; tokensuz 401 (fail-closed); /api/kabul canli defter " + "(saglik 6b ile ayni hesap)");
}

main().catch((e) => { console.error(e); process.exit(1); });
