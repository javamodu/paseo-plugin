// S3 (v0.23) izin konu-testleri — A3-9/D2-11: izinYanitla / permissionKontrol / rolIzinKontrol
// async sarmalayicilari test disiydi: mock context uzerinden allow/deny govdesi, telemetri
// yazimi ve null-kararda (insan kapisi) HIC yanit verilmemesi dogrulanir.
import * as os from "node:os";
import * as fs from "node:fs";
import { izinYanitla, permissionKontrol } from "../server/permission";
import { rolIzinKontrol, ROLLER } from "../server/roller";

let hata = 0;
function assert(kosul: boolean, mesaj: string) {
  if (!kosul) { hata++; console.error("FAIL: " + mesaj); } else { console.log("ok: " + mesaj); }
}

type Yanit = { requestId: string; response: { behavior: string; message?: string } };

async function main(): Promise<void> {
  // izinYanitla: deny/allow govdesi + telemetri yazimi.
  {
    const t = fs.mkdtempSync(os.tmpdir() + "/a39a-");
    const yanitlar: Yanit[] = [];
    const ctx = { paseo: { agents: { ref: () => ({ respondToPermission: async (r: { requestId: string; response: Yanit["response"] }) => { yanitlar.push(r); } }) } } } as never;
    const agent = { id: "iz-1", cwd: t, provider: "codex" } as never;
    await izinYanitla(agent, { id: "req-1" } as never, ctx, "deny", "rm");
    assert(yanitlar.length === 1 && yanitlar[0].requestId === "req-1" && yanitlar[0].response.behavior === "deny", "A3-9: deny yanit gidere yazilir (requestId korunami)");
    assert(yanitlar[0].response.message !== undefined && yanitlar[0].response.message!.includes("rm"), "A3-9: deny mesaji komut adini tasir");
    await izinYanitla(agent, { id: "req-2" } as never, ctx, "allow", "git");
    assert(yanitlar.length === 2 && yanitlar[1].requestId === "req-2" && yanitlar[1].response.behavior === "allow", "A3-9: allow yanit gidere yazilir");
    const tel = fs.readFileSync(t + "/.verimlilik/telemetri.jsonl", "utf8");
    assert(tel.includes("izin:deny komut=rm") && tel.includes("izin:allow komut=git"), "A3-9: izin yanitlari telemetriye iner");
    fs.rmSync(t, { recursive: true, force: true });
  }

  // izinYanitla: respondToPermission firlarsa sarmalayici YUTAR (console.error) — hook zinciri kirilmaz.
  {
    const ctx = { paseo: { agents: { ref: () => ({ respondToPermission: async () => { throw new Error("kopuk"); } }) } } } as never;
    const agent = { id: "iz-2", cwd: os.tmpdir(), provider: "codex" } as never;
    await izinYanitla(agent, { id: "req-x" } as never, ctx, "deny", "rm");
    assert(true, "A3-9: yanit hatasi sarmalayicida yutulur (hook zinciri kirilmaz)");
  }

  // permissionKontrol: null karar (insan kapisi) respondToPermission'i HIC tetiklemez.
  {
    const t = fs.mkdtempSync(os.tmpdir() + "/a39c-");
    const yanitlar: Yanit[] = [];
    const ctx = { paseo: { agents: { ref: () => ({ respondToPermission: async (r: never) => { yanitlar.push(r); } }) } } } as never;
    const agent = { id: "iz-3", cwd: t, provider: "codex" } as never;
    const req = (command?: string) => ({ id: "req-" + Math.random().toString(36).slice(2, 6), input: command === undefined ? {} : { command } }) as never;
    await permissionKontrol(agent, req("npm install"), ctx);
    assert(yanitlar.length === 0, "D2-11: tanimadik komut (null karar) insanina kalir — otomatik yanit YOK");
    await permissionKontrol(agent, req("rm -rf /"), ctx);
    assert(yanitlar.length === 1 && yanitlar[0].response.behavior === "deny", "D2-11: tehlike komutu otomatik deny");
    await permissionKontrol(agent, req("git status"), ctx);
    assert(yanitlar.length === 2 && yanitlar[1].response.behavior === "allow", "D2-11: salt-okur komut otomatik allow");
    await permissionKontrol(agent, req(), ctx);
    assert(yanitlar.length === 2, "D2-11: komutu olmayan istek (null) otomatik yanit vermez");
    fs.rmSync(t, { recursive: true, force: true });
  }

  // rolIzinKontrol: profil bazli yanitlar sarmalayicidan gecer.
  {
    const t = fs.mkdtempSync(os.tmpdir() + "/a39d-");
    const yanitlar: Yanit[] = [];
    const ctx = { paseo: { agents: { ref: () => ({ respondToPermission: async (r: never) => { yanitlar.push(r); } }) } } } as never;
    const agent = { id: "iz-4", cwd: t, provider: "codex", title: "[tester] tarama" } as never;
    const req = (input: Record<string, unknown>) => ({ id: "req-" + Math.random().toString(36).slice(2, 6), input }) as never;
    await rolIzinKontrol(agent, req({ command: "Set-Content a.txt x" }), ctx, ROLLER.tester);
    assert(yanitlar.length === 1 && yanitlar[0].response.behavior === "deny" && yanitlar[0].response.message!.includes("[rol:tester]"), "A3-9: tester yazma komutuna rol etiketli deny");
    await rolIzinKontrol(agent, req({ filePath: "raporlar/ozet.md" }), ctx, ROLLER.reviewer);
    assert(yanitlar.length === 2 && yanitlar[1].response.behavior === "allow", "A3-9: reviewer raporlar/ editine allow");
    await rolIzinKontrol(agent, req({ command: "node --version" }), ctx, ROLLER.coder);
    assert(yanitlar.length === 3 && yanitlar[2].response.behavior === "allow", "A3-9: coder tam profil permission polisine duser (node --version allow)");
    const tel = fs.readFileSync(t + "/.verimlilik/telemetri.jsonl", "utf8");
    assert(tel.includes("izin:deny komut=[rol:tester] Set-Content"), "A3-9: rol izinleri de telemetriye iner: " + tel.split("\n")[0]);
    fs.rmSync(t, { recursive: true, force: true });
  }
}

main().then(() => {
  if (hata > 0) { console.error(hata + " HATA"); process.exit(1); }
  console.log("TUM TESTLER GECTI (izin)");
}).catch((e) => { console.error(e); process.exit(1); });
