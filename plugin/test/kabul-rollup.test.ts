// S3 (v0.23) kabul/rollup konu-testleri — A2-9 (kabul takip turnId + prompt dedupe),
// A2-11 (byte-hizali kirpma), A3-11 (isoHafta yil-siniri + bozuk jsonl),
// A4-2 (tam ISO damga) + A4-3 (n= dipnotu) + cacheHitPuan→cacheHitDelta.
import * as os from "node:os";
import * as fs from "node:fs";
import { kabulTakipIsle } from "../server/kabultakip";
import { telemetriDosyasi } from "../server/telemetry";
import { sonDegerlendirmeOku } from "../server/degerlendirme";
import { haftalikRollup, isoHafta } from "../server/rollup";

let hata = 0;
function assert(kosul: boolean, mesaj: string) {
  if (!kosul) { hata++; console.error("FAIL: " + mesaj); } else { console.log("ok: " + mesaj); }
}

const userMsg = (t: string) => ({ type: "user_message", text: t }) as never;

async function main(): Promise<void> {
  // A2-9: durtmeli turda yeni user mesaji yokken eski prompt yeniden RET desenine
  // sokulup cift kabul sayimi uretiyordu. Prompt kimligi + turnId dedupe.
  {
    const t = fs.mkdtempSync(os.tmpdir() + "/a29-");
    fs.mkdirSync(t + "/.verimlilik", { recursive: true });
    const kabulKayitlari = () =>
      fs.existsSync(telemetriDosyasi(t))
        ? fs.readFileSync(telemetriDosyasi(t), "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
            .filter((k) => k.tip === "kabul" || k.tip === "karisiklik")
        : [];
    const isle = (turnId: string, mesajlar: never[], completed = true, editli = true) =>
      kabulTakipIsle({ agentId: "kt-1", cwd: t, provider: "codex", turnId, timeline: mesajlar, completed, editli });

    // t1: ilk editli completed tur — state init, kayit YOK (sonPrompt='bu olmadı' olarak hatirlanir)
    isle("u1", [userMsg("ilk is"), userMsg("bu olmadı")]);
    assert(kabulKayitlari().length === 0, "A2-9: ilk turda kabul kaydi yok (onceki tur bilgisi henuz yok)");
    // t2: DURTMELI tur — timeline'da yeni user mesaji yok (ayni prompt) → eski kod yine kayit yazardi
    isle("u2", [userMsg("ilk is"), userMsg("bu olmadı")]);
    assert(kabulKayitlari().length === 0, "A2-9: durtmeli turda eski prompt YENIDEN sayilmaz (cift kabul kapandi)");
    // t3: yeni prompt (ret kelimeli) → kabul=false kaydi dogar
    isle("u3", [userMsg("ilk is"), userMsg("bu olmadı"), userMsg("olmamış, tekrar dene")]);
    const k3 = kabulKayitlari();
    assert(k3.length === 1 && k3[0].tip === "kabul" && k3[0].kabul === false, "A2-9: yeni ret promptu kabul=false kaydi uretir");
    assert(k3[0].kabulSinyali === "onceki-tur-prompt-deseni(T)", "A2-9: sinyal etiketi korunur");
    // t4: ayni turnId tekrar teslim (reload dedupe) → kayit yine yazilmaz
    isle("u3", [userMsg("ilk is"), userMsg("bu olmadı"), userMsg("olmamış, tekrar dene")]);
    assert(kabulKayitlari().length === 1, "A2-9: ayni turnId ikinci teslimde kayit yazilmaz (BK-02 deseni)");
    // t5: yeni temiz prompt → kabul=true
    isle("u4", [userMsg("ilk is"), userMsg("bu olmadı"), userMsg("tamam, güzel iş")]);
    const k5 = kabulKayitlari();
    assert(k5.length === 2 && k5[1].kabul === true, "A2-9: temiz prompt kabul=true kaydi uretir");
    // t6: karisiklik sinyali — completed (editli olmayan) onceki tur + karisiklik kelimeli yeni prompt
    isle("u5", [userMsg("soru")], true, false);
    isle("u6", [userMsg("soru"), userMsg("bu karışık oldu, net değil")], true, false);
    const k6 = kabulKayitlari();
    assert(k6.some((k) => k.tip === "karisiklik"), "A2-9: karisiklik deseni kaydi dogar (tasiyici ayni state)");
    fs.rmSync(t, { recursive: true, force: true });
  }

  // A2-11: cokbaytli metinde 24KB butce artik bayt-hizali kesilir — kirpma noktasi
  // karakterin ortasina dusmez (U+FFFD uretmez) ve toplam bayt tavana uyar.
  {
    const t = fs.mkdtempSync(os.tmpdir() + "/a211-");
    fs.mkdirSync(t + "/raporlar/oz-degerlendirme", { recursive: true });
    const cokbaytli = "ş".repeat(30 * 1024); // her 'ş' 2 bayt — UTF-16 slice ~30KB butceyi asardi
    fs.writeFileSync(t + "/raporlar/oz-degerlendirme/2026-10-26.md", cokbaytli);
    const o = sonDegerlendirmeOku(t);
    assert(o.icerik !== null && o.icerik.includes("...(kirpildi)"), "A2-11: kirpildi notu duser");
    assert(!o.icerik!.includes("�"), "A2-11: karakter ortasindan kesim YOK (U+FFFD uretmez)");
    const govde = o.icerik!.slice(0, o.icerik!.indexOf("\n\n...(kirpildi)"));
    assert(Buffer.byteLength(govde, "utf8") <= 24 * 1024, "A2-11: govde bayt butcesine uyar: " + Buffer.byteLength(govde, "utf8"));
    assert(govde.length % 1 === 0 && [...govde].every((c) => c === "ş"), "A2-11: tum karakterler butun (son karakter yarim degil)");
    fs.rmSync(t, { recursive: true, force: true });
  }

  // A3-11: isoHafta yil-siniri — 2026-01-01 Persembe = W01; 2026 53 haftalik yil.
  assert(isoHafta(new Date("2026-01-01T12:00:00Z")) === "2026-W01", "A3-11: 2026-01-01 = W01");
  assert(isoHafta(new Date("2026-12-31T12:00:00Z")) === "2026-W53", "A3-11: 2026-12-31 = W53 (Persembe baslangicli yil)");
  assert(isoHafta(new Date("2027-01-01T12:00:00Z")) === "2026-W53", "A3-11: 2027-01-01 (Cuma) 2026-W53'e aittir (hafta persembesinin yilina)");
  assert(isoHafta(new Date("2027-01-04T12:00:00Z")) === "2027-W01", "A3-11: 2027-W01 pazartesi 2027-01-04'te baslar");

  // A3-11: rollup bozuk jsonl satiri atlar, gecerli kayit sayilir.
  {
    const t = fs.mkdtempSync(os.tmpdir() + "/a311-");
    fs.mkdirSync(t + "/.verimlilik", { recursive: true });
    const simdi = new Date("2026-10-26T12:00:00Z");
    const satirlar = [
      "bozuk{json satiri",
      JSON.stringify({ ts: simdi.toISOString(), tip: "tur", agentId: "a", provider: "p", turSn: 100 }),
      "",
      JSON.stringify({ ts: simdi.toISOString(), tip: "kabul", agentId: "a", provider: "p", kabul: true }),
    ];
    fs.writeFileSync(t + "/.verimlilik/telemetri.jsonl", satirlar.join("\n") + "\n");
    const yol = haftalikRollup(t, simdi);
    const md = fs.readFileSync(yol!, "utf8");
    const js = JSON.parse(fs.readFileSync(yol!.replace(/\.md$/, ".json"), "utf8"));
    assert(js.tur === 1 && js.kabul === 1, "A3-11: bozuk satir atlanir, gecerli kayitlar sayilir");
    // A4-2: damga tam ISO (json 'uretim' alaniyla tek-tip).
    assert(/Üretim: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(md), "A4-2: md uretim damgasi tam ISO");
    assert(js.uretim === simdi.toISOString(), "A4-2: json damgasi ile tek-tip");
    // A4-3: ortalama dipnotlari n= tasir.
    assert(md.includes("100sn (n=1)"), "A4-3: ort. tur suresi n= dipnotu tasir");
    fs.rmSync(t, { recursive: true, force: true });
  }

  // cacheHitPuan→cacheHitDelta (BDG): delta alani artik FARK anlamiyla adlandirilir.
  {
    const t = fs.mkdtempSync(os.tmpdir() + "/chd-");
    fs.mkdirSync(t + "/.verimlilik", { recursive: true });
    fs.mkdirSync(t + "/raporlar/telemetri-haftalik", { recursive: true });
    const simdi = new Date("2026-10-26T12:00:00Z");
    const onceki = isoHafta(new Date(simdi.getTime() - 7 * 86400000));
    fs.writeFileSync(t + "/raporlar/telemetri-haftalik/" + onceki + ".json",
      JSON.stringify({ hafta: onceki, tur: 1, kabulOrani: 10, pitbull: 0, ortCacheHit: 50 }));
    const turKaydi = JSON.stringify({ ts: simdi.toISOString(), tip: "tur", agentId: "a", provider: "p", turSn: 50, detay: "in=1000 cacheHitPct=80" });
    fs.writeFileSync(t + "/.verimlilik/telemetri.jsonl", turKaydi + "\n" + turKaydi.replace('"turSn":50', '"turSn":60') + "\n");
    const yol = haftalikRollup(t, simdi);
    const md = fs.readFileSync(yol!, "utf8");
    const js = JSON.parse(fs.readFileSync(yol!.replace(/\.md$/, ".json"), "utf8"));
    assert(js.delta !== null && js.delta.cacheHitDelta === 30, "cacheHitDelta: alan yeni adiyla fark tasir (80-50=30): " + JSON.stringify(js.delta));
    assert(!("cacheHitPuan" in js.delta), "cacheHitDelta: eski cacheHitPuan alani json ciktisinda YOK");
    assert(md.includes("cache-hit +30 puan"), "cacheHitDelta: md satiri imzali fark tasir");
    fs.rmSync(t, { recursive: true, force: true });
  }
}

main().then(() => {
  if (hata > 0) { console.error(hata + " HATA"); process.exit(1); }
  console.log("TUM TESTLER GECTI (kabul-rollup)");
}).catch((e) => { console.error(e); process.exit(1); });
