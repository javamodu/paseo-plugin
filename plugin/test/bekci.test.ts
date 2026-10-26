// S3 (v0.23) bekci konu-testleri — A2-10 (atomik yazim + baslik toleransi),
// A3-10 (25-turlu pencere-kaymasi; DERSLER 172 + K-0046 teyit taramasi koku),
// A5-9 bekci bacagi (kirli-agac tanimi scripts/kirli-liste.json'dan).
import * as os from "node:os";
import * as fs from "node:fs";
import { bekciKontrol, panoIsaretciYaz } from "../server/bekci";

let hata = 0;
function assert(kosul: boolean, mesaj: string) {
  if (!kosul) { hata++; console.error("FAIL: " + mesaj); } else { console.log("ok: " + mesaj); }
}

async function main(): Promise<void> {

const stubTemiz = (komut: string[], _cwd: string) => {
  const s = komut.join(" ");
  if (s.includes("saglik.ps1")) return { cikti: "SONUC: 16 OK, 0 EKSIK, 1 SARI", kod: 0 };
  if (s.includes("zincir-kontrol.ps1")) return { cikti: "ZINCIR OK", kod: 0 };
  if (s.includes("git status")) return { cikti: "", kod: 0 };
  return { cikti: "", kod: 0 };
};

// A2-10: birebir "## Aktig is" eslesmesi kirilgandi — sondaki bosluk/ekstra bosluk basligi
// kacirip isaretcinin sessizce YAZILMAMASINA neden oluyordu.
{
  const t = fs.mkdtempSync(os.tmpdir() + "/a210-");
  fs.writeFileSync(t + "/STATE_BOARD.md", "# Pano\n\n##   Aktif iş  \nYok.\n", "utf8");
  assert(panoIsaretciYaz(t, "2026-10-26") === true, "A2-10: ekstra/sondaki bosluklu baslik taninir");
  const icerik = fs.readFileSync(t + "/STATE_BOARD.md", "utf8");
  assert(icerik.includes("- bekci raporu: raporlar/takip-sozlesme/2026-10-26.md"), "A2-10: isaretci tolere edilmis basligin altina duser");
  assert(!fs.existsSync(t + "/STATE_BOARD.md.bekci-tmp"), "A2-10: tmp dosya atomik geciste geride kalmaz");
  assert(panoIsaretciYaz(t, "2026-10-26") === false, "A2-10: ayni gun idempotentlik korunur");
  fs.rmSync(t, { recursive: true, force: true });
}

// A3-10 (kalem 1): pencere tarih damgasi — anomalide pencere araligi gorunur.
{
  const t = fs.mkdtempSync(os.tmpdir() + "/a310a-");
  fs.mkdirSync(t + "/.verimlilik", { recursive: true });
  // 20 ESKI izlenmis hep-fail kaydi (Ocak) + 5 YENI izlenmeyen tur (Ekim — claude daemon deseni).
  const eski = Array.from({ length: 20 }, (_, i) =>
    JSON.stringify({ ts: "2026-01-01T10:" + String(i).padStart(2, "0") + ":00Z", tip: "tur", agentId: "a", provider: "p", toolCalls: 10, failedCalls: 10 }));
  const yeni = Array.from({ length: 5 }, (_, i) =>
    JSON.stringify({ ts: "2026-10-26T09:" + String(i).padStart(2, "0") + ":00Z", tip: "tur", agentId: "a", provider: "claude" }));
  fs.writeFileSync(t + "/.verimlilik/telemetri.jsonl", [...eski, ...yeni].join("\n") + "\n");
  const a = await bekciKontrol(t, stubTemiz);
  const tel = a.find((x) => x.anahtar === "telemetri-fail");
  assert(tel !== undefined, "A3-10: izlenmeyen turler pencere dolgusu olsa da fail orani yuksek alarm verir");
  assert(tel !== undefined && /pencere 2026-01-01 10:05\.\.2026-10-26 09:04 UTC/.test(tel.detay), "A3-10: pencere tarih damgasi bayatligi ele verir: " + (tel?.detay ?? ""));
  fs.rmSync(t, { recursive: true, force: true });
}

// A3-10 (kalem 2 — kok): pencere-kaymasi. Eski kodda toolCalls>0 filtresi izlenmeyen
// turleri DISLIYORDU: 'son 20 tur' aslinda aylar onceki 20 izlenmis turdu. 25-turlu fixture:
// 5 eski fail + 20 yeni izlenmeyen → yeni pencere = son 20 tur (izlenmeyen) → toplam cagri 0
// → alarm SUSAR (bayat veri guncel gorunmez). Eski kod: pencere=5 eski izlenmis → '%100' alarmi.
{
  const t = fs.mkdtempSync(os.tmpdir() + "/a310b-");
  fs.mkdirSync(t + "/.verimlilik", { recursive: true });
  const eski = Array.from({ length: 5 }, (_, i) =>
    JSON.stringify({ ts: "2026-01-01T10:0" + i + ":00:00Z", tip: "tur", agentId: "a", provider: "p", toolCalls: 10, failedCalls: 10 }));
  const yeni = Array.from({ length: 20 }, (_, i) =>
    JSON.stringify({ ts: "2026-10-26T09:" + String(10 + i).padStart(2, "0") + ":00Z", tip: "tur", agentId: "a", provider: "claude" }));
  fs.writeFileSync(t + "/.verimlilik/telemetri.jsonl", [...eski, ...yeni].join("\n") + "\n");
  const a = await bekciKontrol(t, stubTemiz);
  assert(!a.some((x) => x.anahtar === "telemetri-fail"), "A3-10: izlenmeyen saglayicinin turleri pencereyi KAYDIRMAZ — bayat fail verisi guncel alarm uretmez");
  fs.rmSync(t, { recursive: true, force: true });
}

// A5-9 (bekci bacagi): kirli-agac filtresi scripts/kirli-liste.json'dan (tek kaynak).
{
  const t = fs.mkdtempSync(os.tmpdir() + "/a59-");
  fs.mkdirSync(t + "/scripts", { recursive: true });
  fs.writeFileSync(t + "/STATE_BOARD.md", "durum");
  const stubKirli = (komut: string[], cwd: string) =>
    komut.join(" ").includes("git status")
      ? { cikti: " M README.md\n M raporlar/ozet-raporu.md\n?? arsiv/ekstra.md", kod: 0 }
      : stubTemiz(komut, cwd);
  // liste YOK: yabanci repo — gomulu varsayilanlar (telemetri-haftalik, .verimlilik).
  const a1 = await bekciKontrol(t, stubKirli);
  assert(a1.some((x) => x.anahtar === "git-drift" && x.detay.includes("3 kirli")), "A5-9: liste yoksa gomulu varsayilanlar uygulanir (3 kirli)");
  // liste VAR: desen uygulanir — ozet-raporu dislanir.
  fs.writeFileSync(t + "/scripts/kirli-liste.json", JSON.stringify({ surum: 1, desenler: ["ozet-raporu"] }));
  const a2 = await bekciKontrol(t, stubKirli);
  assert(a2.some((x) => x.anahtar === "git-drift" && x.detay.includes("2 kirli")), "A5-9: gecerli kirli-liste.json desen uygular (2 kirli)");
  // liste BOZUK: fail-closed — desenler bosalir, tum satirlar kirli + durum kendini etiketler.
  fs.writeFileSync(t + "/scripts/kirli-liste.json", "bozuk{json");
  const a3 = await bekciKontrol(t, stubKirli);
  assert(a3.some((x) => x.anahtar === "kirli-liste-bozuk"), "A5-9: bozuk kirli-liste.json anomalisi kendini etiketler");
  assert(a3.some((x) => x.anahtar === "git-drift" && x.detay.includes("3 kirli")), "A5-9: bozuk listede fail-closed — tum kirli dosyalar raporlanir");
  fs.rmSync(t, { recursive: true, force: true });
}

}

main().then(() => {
  if (hata > 0) { console.error(hata + " HATA"); process.exit(1); }
  console.log("TUM TESTLER GECTI (bekci)");
}).catch((e) => { console.error(e); process.exit(1); });
