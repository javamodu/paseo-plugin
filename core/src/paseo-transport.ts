// Guvenli Paseo transport (P0-4): komut STRING'i + ComSpec shell yerine execFileSync
// arg-array. Kabuk ARADAN CIKAR: her arguman isletim sistemine TEK token olarak gecer,
// metakarakter yorumlanmaz. Bedel: Windows'ta .cmd shim shell'siz calismaz — paseo
// binary'si .exe (veya PATH'te dogrudan calisabilir) olmali; aksi hÃ¢lde ENOENT firlar
// ve adapter bunu UNKNOWN'a cevirir (fail-closed, sessiz dusme yok).
//
// paseo 0.11.2 gercek CLI uyumu (`paseo run --help` ile dogrulandi):
//   run --provider <p> --mode auto --cwd <cwd> --title ordu:<dk> --json <prompt>
// - --workspace <dispatchKey> YANLISTI: --workspace mevcut workspace ID'si bekler,
//   dispatchKey oraya AIT DEGIL. Korelasyon --title "ordu:<dk>" uzerinden yapilir
//   cunku `paseo ls --json` ciktisinda label ALANI YOK (0.11.2 olcumu: id, shortId,
//   name, provider, thinking, status, cwd, created).
// - Mode 'auto' = Default Permissions (guvenlik); full-access/bypass bu vektore GIREMEZ.
// - Session id: --json ciktisindaki JSON govdeden .id parse edilir — SON SATIR hack'i YOK.
// - Provider env'den: ORDU_PROVIDER (varsayilan 'codex/kimi-K3').
//
// F5.5 ADR notu (oturum-ici spawn cwd bug'i, 2026-10-14):
// Kok neden (0.11.2 app.asar kaynak kaniti): ordu bir Paseo ajani icinden spawn
// edince CLI callerAgentId'yi PASEO_AGENT_ID env'inden cozer
// (@getpaseo/cli dist/commands/agent/run.js resolveRunCallerAgentId) ve daemon
// @getpaseo/server dist/server/server/agent/create-agent/intent.js
// resolvePlacement'ta caller varken istenen cwd'yi TAMAMEN yok sayar:
//   if (input.caller) return { workspaceId: caller.workspaceId, cwd: caller.cwd };
// Yani `paseo run --cwd X` oturum-ici spawn'da ana workspace'e duser (canli bug:
// ajan cwd=paseo-plugin geldi, kapsul reposu degil). Reddedilen alternatif:
// PASEO_AGENT_ID/PASEO_WORKSPACE_ID env'ini siyirmak — bare-run her spawn'da YENI
// workspace mint eder (createWorkspaceForDirectory dedupe'siz) ve ebeveyn-etiketi
// (ParentAgentId label) kaybolur. Secilen cozum: hedef cwd icin daemon'da
// workspace find-or-create (`workspace ls --json` -> cwd eslesmesi, yoksa
// `workspace create --isolation local --path`) ve spawn'a `--workspace <id>`
// gecmek; intent.js'te explicitWorkspaceId caller'dan ONCE kazanir, boylece
// ajan cwd'si kapsul repo'suna baglanir ve ebeveyn etiketi korunur.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Transport } from './paseo-adapter.ts';

export type ExecFileFn = (file: string, args: string[]) => string;

export interface PaseoTransport extends Transport {
  cancel(sessionId: string): Promise<void>; // `paseo stop <id|shortId>` — interrupt, idle'da no-op
}

// .cmd shim shell'siz calismaz (ENOENT); gercek calistirma zinciri resmi shim'den
// cozuldu ve diskte + canli `--version` (exit 0, "0.11.2") ile dogrulandi:
//   Paseo.exe --disable-warning=DEP0040 <runner> node-script <cli-index> <args...>
//   env: ELECTRON_RUN_AS_NODE=1, PASEO_NODE_ENV=production, PASEO_DESKTOP_MANAGED=1
// Cozumleme fail-closed: binary/runner yoksa hata firlatilir, adapter UNKNOWN'a cevirir.
// ORDU_PASEO_RESOURCES ile kurulum dizini asilabilir (test/portable kurulum).
export interface PaseoBinary {
  file: string;
  prefixArgs: string[];
  env: NodeJS.ProcessEnv;
}

export function resolvePaseoBinary(resourcesDir?: string): PaseoBinary {
  const dir =
    resourcesDir ??
    process.env.ORDU_PASEO_RESOURCES ??
    join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Paseo', 'resources');
  const exe = resolve(dir, '..', 'Paseo.exe');
  const runner = join(dir, 'app.asar.unpacked', 'dist', 'daemon', 'node-entrypoint-runner.js');
  const cliIndex = join(dir, 'app.asar', 'node_modules', '@getpaseo', 'cli', 'dist', 'index.js');
  if (!existsSync(exe)) throw new Error('ENOENT: paseo binary bulunamadi: ' + exe);
  if (!existsSync(runner)) throw new Error('ENOENT: paseo runner bulunamadi: ' + runner);
  return {
    file: exe,
    prefixArgs: ['--disable-warning=DEP0040', runner, 'node-script', cliIndex],
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PASEO_NODE_ENV: 'production',
      PASEO_DESKTOP_MANAGED: '1',
    },
  };
}

// Arguman vektorleri saf fonksiyon: kabuk birlestirmesi YOK, prompt TEK eleman.
// workspaceId verilirse --workspace eklenir: oturum-ici spawn'da daemon'un caller
// cwd mirasini yenen TEK resmi yol (F5.5 ADR notu, dosya basi). --cwd korunur:
// acik niyet beyani + workspace'siz ust duzey spawn'da tek belirleyici.
export function paseoSpawnArgs(o: { dispatchKey: string; attemptId: string; prompt: string; cwd?: string; workspaceId?: string; provider?: string; model?: string }): string[] {
  // F6.5 (ADR-F65): dispatcher cozulmus degeri parametre olarak indirir (tek cozum noktasi;
  // transport env okumaz). Parametre yoksa legacy env fallback korunur (dogrudan kullanim).
  const provider = o.provider ? (o.model ? o.provider + '/' + o.model : o.provider) : (process.env.ORDU_PROVIDER ?? 'codex/kimi-K3');
  const args = ['run', '--provider', provider, '--mode', 'auto', '--cwd', o.cwd ?? process.cwd()];
  if (o.workspaceId) args.push('--workspace', o.workspaceId);
  args.push('--title', 'ordu:' + o.dispatchKey, '--json', o.prompt);
  return args;
}
export function paseoLookupArgs(): string[] {
  return ['ls', '--json', '--all']; // --all: kapanmis agent DEAD kaniti icin gorunur olmali
}
export function paseoCancelArgs(sessionId: string): string[] {
  return ['stop', sessionId];
}
export function paseoWorkspaceListArgs(): string[] {
  return ['workspace', 'ls', '--json']; // satirlar: { workspaceId, project, name, isolation, cwd }
}
export function paseoWorkspaceCreateArgs(path: string): string[] {
  // --isolation ZORUNLU (0.11.2 commander requiredOption; eksikse exit 1).
  return ['workspace', 'create', '--isolation', 'local', '--path', path, '--json']; // tekil satir: { workspaceId, ..., cwd }
}

// --json ciktisindan session id: stdout icindeki JSON govde bulunur, .id okunur.
// Parse edilemeyen/bos cikti "yanit alinamadi" sinifindadir → adapter'in UNKNOWN
// eslesmesi icin mesaj 'boş çıktı' ifadesini tasir (bilincli: belirsizlik = UNKNOWN).
export function parseSpawnedSessionId(out: string): string {
  const start = out.search(/[{[]/);
  if (start < 0) throw new Error('paseo run --json ciktisinda JSON govde yok — boş çıktı esdegeri, belirsiz');
  let candidate = out.slice(start);
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    const end = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'));
    if (end <= 0) throw new Error('paseo run --json ciktisi parse edilemedi — boş çıktı esdegeri, belirsiz');
    try {
      parsed = JSON.parse(candidate.slice(0, end + 1));
    } catch {
      throw new Error('paseo run --json ciktisi parse edilemedi — boş çıktı esdegeri, belirsiz');
    }
  }
  const obj: any = Array.isArray(parsed) ? parsed[0] : parsed;
  const id = obj?.id ?? obj?.agentId;
  if (typeof id !== 'string' || !id) throw new Error('paseo run --json ciktisinda id alani yok — boş çıktı esdegeri, belirsiz');
  return id;
}

// `workspace ls|create --json` ciktilari icin toleransli JSON govde ayiklama;
// parse edilemeyen cikti yanit-alinamadi sinifindadir (adapter icin UNKNOWN).
function extractFirstJson(out: string, what: string): unknown {
  const start = out.search(/[{[]/);
  if (start < 0) throw new Error(what + ' ciktisinda JSON govde yok — boş çıktı esdegeri, belirsiz');
  const candidate = out.slice(start);
  try {
    return JSON.parse(candidate);
  } catch {
    const end = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'));
    if (end <= 0) throw new Error(what + ' ciktisi parse edilemedi — boş çıktı esdegeri, belirsiz');
    try {
      return JSON.parse(candidate.slice(0, end + 1));
    } catch {
      throw new Error(what + ' ciktisi parse edilemedi — boş çıktı esdegeri, belirsiz');
    }
  }
}

export interface WorkspaceRow { workspaceId: string; cwd: string }
export function parseWorkspaceRows(out: string): WorkspaceRow[] {
  const parsed = extractFirstJson(out, 'paseo workspace ls');
  if (!Array.isArray(parsed)) throw new Error('paseo workspace ls ciktisi dizi degil — boş çıktı esdegeri, belirsiz');
  return parsed.filter((r: any) => typeof r?.workspaceId === 'string' && typeof r?.cwd === 'string');
}
export function parseCreatedWorkspaceId(out: string): string {
  const parsed: any = extractFirstJson(out, 'paseo workspace create');
  const id = parsed?.workspaceId ?? parsed?.data?.workspaceId;
  if (typeof id !== 'string' || !id) throw new Error('paseo workspace create ciktisinda workspaceId yok — boş çıktı esdegeri, belirsiz');
  return id;
}

// win32 dosya sistemi buyuk/kucuk harf duyarsiz; daemon tarafi realpath-farkindali
// esitlik kullanir, istemci tarafinda resolve+kucultme yeterli.
export function sameFsPath(a: string, b: string): boolean {
  const na = resolve(a); const nb = resolve(b);
  return process.platform === 'win32' ? na.toLowerCase() === nb.toLowerCase() : na === nb;
}

const normPathKey = (p: string) => (process.platform === 'win32' ? resolve(p).toLowerCase() : resolve(p));

const defaultExec: ExecFileFn = (file, args) =>
  execFileSync(file, args, { encoding: 'utf8', shell: false, timeout: 120_000 }).trim();

// prefixArgs + env uygulanmis tek giris noktasi: tum transport cagrilari .exe uzerinden
// gider, hicbir yol .cmd shim'e dusmez. Enjekte edilen execFile (testler) onekli arg
// vektorunu alir; env kapatma yalniz gercek execFileSync yolunda uygulanir.
function execPaseo(execFile: ExecFileFn, args: string[]): string {
  const bin = resolvePaseoBinary();
  if (execFile === defaultExec) {
    return execFileSync(bin.file, [...bin.prefixArgs, ...args], {
      encoding: 'utf8',
      shell: false,
      timeout: 120_000,
      env: bin.env,
    }).trim();
  }
  return execFile(bin.file, [...bin.prefixArgs, ...args]);
}

// 0.11.2 `paseo ls --json` status degerleri (gozlenen): initializing, running, idle,
// closed, error. archived satirlar --all ile gelir. Bilinmeyen durum = UNKNOWN.
const ALIVE_STATUSES = new Set(['initializing', 'running', 'idle']);
const DEAD_STATUSES = new Set(['closed', 'error', 'archived']);

// F5.5: hedef cwd icin daemon workspace'i bul; yoksa --path ile kur. Daemon
// baglanti hatasi ECONN isaretli firlar (adapter UNKNOWN'a cevirir — spawn
// gerceklesmedi ama dis dunya durumu belirsiz); dizin reddi (Directory not
// found) daemon mesajiyla gecer (adapter FATAL'a cevirir). Sessiz dusme YOK.
export function resolveWorkspaceIdForCwd(execFile: ExecFileFn, cwd: string): string {
  const execWs = (args: string[]): string => {
    try {
      return execPaseo(execFile, args);
    } catch (err: any) {
      const text = String(err?.stderr ?? '') + String(err?.message ?? err);
      if (/Cannot connect to daemon|DAEMON_NOT_RUNNING/i.test(text)) {
        throw new Error('ECONN: paseo daemon ulasilamiyor (workspace cozumleme, spawn gerceklesmedi)');
      }
      throw err;
    }
  };
  const hit = parseWorkspaceRows(execWs(paseoWorkspaceListArgs())).find((r) => sameFsPath(r.cwd, cwd));
  if (hit) return hit.workspaceId;
  return parseCreatedWorkspaceId(execWs(paseoWorkspaceCreateArgs(cwd)));
}

export function makeSafePaseoTransport(execFile: ExecFileFn = defaultExec): PaseoTransport {
  // find-or-create spawn basina tekrar etmez; daemon kaydi kalici, cache RAM'de.
  const wsCache = new Map<string, string>();
  return {
    async spawn(o) {
      let workspaceId: string | undefined;
      if (o.cwd) {
        const key = normPathKey(o.cwd);
        workspaceId = wsCache.get(key);
        if (!workspaceId) {
          workspaceId = resolveWorkspaceIdForCwd(execFile, o.cwd);
          wsCache.set(key, workspaceId);
        }
      }
      return parseSpawnedSessionId(execPaseo(execFile, paseoSpawnArgs({ ...o, workspaceId })));
    },
    async lookup(dk) {
      // P0-7 korelasyon sarti: cikti bu dispatchKey'in gercek kaydini ICERMIYORSA
      // kayit bulunamamis sayilir → UNKNOWN; reconcile sentetik 'recovered:' kimligi
      // URETMEZ, satir UNKNOWN kalir. Baskasinin canli kaydi ALIVE kaniti degildir.
      // Korelasyon: name alaninda dispatchKey (spawn --title "ordu:<dk>" ile gomulur).
      let parsed: unknown;
      try {
        parsed = JSON.parse(execPaseo(execFile, paseoLookupArgs()));
      } catch {
        return 'UNKNOWN'; // daemon ulasilamaz VEYA json bozuk → belirsiz, iddia yok
      }
      if (!Array.isArray(parsed)) return 'UNKNOWN';
      const hit: any = parsed.find((a: any) => typeof a?.name === 'string' && a.name.includes(dk));
      if (!hit) return 'UNKNOWN';
      const status = String(hit.status ?? '').toLowerCase();
      if (ALIVE_STATUSES.has(status)) return 'ALIVE';
      if (DEAD_STATUSES.has(status)) return 'DEAD';
      return 'UNKNOWN';
    },
    async cancel(sid) {
      execPaseo(execFile, paseoCancelArgs(sid)); // interrupt; idle agent icin no-op (0.11.2 help)
    },
  };
}
