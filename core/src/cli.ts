// ordu CLI — headless operasyon yüzeyi (V3-S1.1'in insan kapılarıyla konuşan ucu).
// Tasarım kuralı: her komut TEK iş + makine-okunur JSON çıktı; karar komutları
// B01 sözleşmesinden geçer (CLEAR_STOP evrensel onay metni ister — sürtünme bilinçli).
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, resolve, join } from 'node:path';
import { openStore, recordCommand, setGlobalStop, pendingCapacity } from './store.ts';
import { processOutbox, reconcileUnknown, pollSentSessions, type WorkerAdapter } from './dispatcher.ts';
import { loadVerifiedProbe, spawnBlockedReason } from './capabilities.ts';
import { PaseoWorkerAdapter } from './paseo-adapter.ts';
import { makeSafePaseoTransport } from './paseo-transport.ts';
import { LocalRuntimeAdapter, LocalCliLauncher, type LocalCliBinding } from './local-runtime.ts';
import {
  createRunPlan, approvePlan, readyNodes, dispatchNode, ensureStartCommand,
  requestDelivery, decideApproval, sweepAsiliRunlar,
} from './supervisor.ts';
import { sampleHandoff } from './handoff.ts';
import { sampleReceipt } from './reasoning-receipt.ts';
import { evaluateArtifact } from './cli-evaluate.ts';
import { runDaemon } from './daemon.ts';
import { openProductionNotify, type ExecSync } from './sender.ts';
import { kabulOku, olcDrift, olcSapma, replanTaslagi, replanOnayla, openReplanDefteri, eslesenReplanTaslagi } from './replan.ts';
import {
  KURAL_ONAY_METNI, KURAL_PARTI_UST, KURAL_HEDEF_DOSYA,
  derslerOku, kuralSayaci, esikOku, adayUret, openKuralDefteri, kuralOnayla, kuralYolu, eslesenTaslak,
} from './kural.ts';
import { KANIT_DEFTERI_YOLU } from './gozetimsiz.ts';
import { geceModu, GECE_DEFTERI_YOLU } from './gece.ts';

export interface CliDeps {
  dbPath: string;
  env: NodeJS.ProcessEnv;
  probePath: string;
  now?: () => Date;
  makeAdapter?: (probe: ReturnType<typeof loadVerifiedProbe>) => WorkerAdapter; // test enjeksiyonu
  notifyExec?: ExecSync; // S4 Bildirim: üretim sender'ın gerçek dış çağrısının test enjeksiyonu
}

function defaultAdapter(probe: ReturnType<typeof loadVerifiedProbe>, env: NodeJS.ProcessEnv, dbPath: string): WorkerAdapter {
  // A0-5 wiring (2026-10-27): ORDU_RUNTIME=local → L-RT üretim LocalLauncher
  // (Paseo'suz koşum: gerçek CLI süreci + durable pid registry). repoPath kapsül
  // varsayılan repo köküdür; registry/çıktı dbPath yanında yaşar (replan.jsonl/
  // notify.jsonl konvansiyonu); cliBindings ORDU_CLI_* env ile gerçek binary
  // bağlar (B00 Windows dersi: PATH'teki claude.exe doğrudan spawn olur; gemini
  // npm .cmd shim'i ORDU_CLI_GEMINI_JS ile node+js-entry olarak bağlanır).
  if (env.ORDU_RUNTIME === 'local') {
    const dataKok = dirname(dbPath);
    const kokRepo = env.ORDU_LOCAL_REPO ?? resolve(dirname(dataKok), '..');
    const cliBindings: Record<string, LocalCliBinding> = {};
    if (env.ORDU_CLI_CLAUDE_CODE) cliBindings['claude-code'] = { cmd: env.ORDU_CLI_CLAUDE_CODE, argvPrefix: [] };
    if (env.ORDU_CLI_GEMINI_JS) cliBindings['gemini-cli'] = { cmd: process.execPath, argvPrefix: [env.ORDU_CLI_GEMINI_JS] };
    return new LocalRuntimeAdapter(probe, new LocalCliLauncher({
      repoPath: kokRepo,
      worktreeRoot: join(dataKok, 'worktrees'),
      registryPath: join(dataKok, 'local-pid.jsonl'),
      cliBindings,
    }), env);
  }
  // P0-4: shell-string transport kaldirildi — execFileSync arg-array (paseo-transport.ts).
  const transport = makeSafePaseoTransport();
  return new PaseoWorkerAdapter(probe, transport);
}

export async function cliMain(argv: string[], deps: CliDeps): Promise<{ code: number; out: object | string }> {
  const [cmd, ...rest] = argv;
  const flag = (name: string) => {
    const i = rest.indexOf('--' + name);
    return i >= 0 ? rest[i + 1] : undefined;
  };
  const flags = (name: string) => {
    const out: string[] = [];
    for (let i = 0; i < rest.length; i++) if (rest[i] === '--' + name && rest[i + 1] !== undefined) out.push(rest[i + 1]);
    return out;
  };
  if (deps.dbPath !== ':memory:') mkdirSync(dirname(deps.dbPath), { recursive: true });
  const db = openStore(deps.dbPath);
  const now = deps.now ?? (() => new Date());

  switch (cmd) {
    case 'status': {
      const stop = (db.prepare('SELECT dispatch_paused FROM settings WHERE id=1').get() as any).dispatch_paused === 1;
      const evs = db.prepare('SELECT sequence,type,run_id,attempt_id FROM events ORDER BY sequence DESC LIMIT 5').all();
      return { code: 0, out: {
        globalStop: stop, pendingOutbox: (db.prepare("SELECT COUNT(*) c FROM outbox WHERE status='PENDING'").get() as any).c,
        reserved: pendingCapacity(db), unknown: (db.prepare("SELECT COUNT(*) c FROM reservations WHERE state='UNKNOWN'").get() as any).c,
        lastEvents: evs,
      } };
    }
    case 'stop': {
      const actor = flag('actor') ?? 'cli';
      setGlobalStop(db, true, actor, flag('reason') ?? 'cli-stop');
      return { code: 0, out: { stopped: true, actor } };
    }
    case 'resume': {
      // B01: CLEAR_STOP onay metni — yanlış/eksik metinde sürtünme BİLİNÇLİ (A16 latching'i)
      if (flag('confirm') !== 'I understand the risk') {
        return { code: 1, out: 'resume reddedildi: --confirm "I understand the risk" gerekli (kapı tasarımı)' };
      }
      const cmdr = recordCommand(db, {
        kind: 'CLEAR_STOP', actorId: flag('actor') ?? 'cli',
        idempotencyKey: 'resume-' + now().toISOString(),
        payload: { reason: flag('reason') ?? 'cli-resume', confirmText: 'I understand the risk' },
      } as any);
      if (cmdr.status !== 'ACCEPTED') return { code: 1, out: 'komut kaydı reddedildi: ' + cmdr.commandId };
      // olay şeması confirmationHash ister (64 hex): komut kimliğinin sha256'sı bağlar
      const confirmationHash = createHash('sha256').update('CLEAR_STOP|' + cmdr.commandId).digest('hex');
      setGlobalStop(db, false, flag('actor') ?? 'cli', 'cli-resume', confirmationHash);
      return { code: 0, out: { resumed: true, commandId: cmdr.commandId } };
    }
    case 'tick': {
      // TEK geçiş: probe doğrulanır → dispatcher/adapter gate'leri → sonuç JSON
      let probe;
      try { probe = loadVerifiedProbe(deps.probePath, { now }); }
      catch (e: any) { return { code: 1, out: 'probe doğrulanamadı: ' + e.message }; }
      const blocked = spawnBlockedReason(probe, deps.env.ORDU_RUNTIME === 'local'); // ADR-012 §3: kapı runtime-kapsamlı
      if (blocked) return { code: 2, out: { dispatch: 'BLOCKED', reason: blocked, note: 'B02 — yetenekler kanıtlanmadan worker yok' } };
      const adapter = deps.makeAdapter?.(probe) ?? defaultAdapter(probe, deps.env, deps.dbPath);
      // canlı coder akışı: prompt sabit yer tutucu değil, kapsülün ONAYLI hedefidir.
      // Zincir: outbox → attempt → run → plan → capsule.goal (salt-okunur bakış).
      // dispatcher ile AYNI secim filtresi (backoff dahil): cwd/prompt gercekten
      // islenecek satirin kapsulune baglanir, baska satirinkiyle karisamaz.
      const pending = db.prepare("SELECT o.dispatch_key FROM outbox o WHERE o.status='PENDING' AND (o.next_attempt_at IS NULL OR o.next_attempt_at<=?) ORDER BY rowid LIMIT 1").get(now().toISOString()) as any;
      let livePrompt: string | undefined;
      let liveCwd: string | undefined;
      if (pending) {
        // F5.5: kapsul repo'su spawn cwd'sidir. repo_id tasiyorsa oldugu gibi
        // iletilir; mutlak+var-dizin denetimi adapter'da fail-closed yapilir
        // (gecersizse FATAL + rezervasyon release; sessiz process.cwd() YOK).
        const g = db.prepare(`SELECT c.goal, c.repo_id FROM outbox o JOIN attempts a ON a.id=o.attempt_id JOIN runs r ON r.id=a.run_id JOIN plans p ON p.id=r.plan_id JOIN capsules c ON c.id=p.capsule_id WHERE o.dispatch_key=?`).get(pending.dispatch_key) as any;
        if (g?.goal) livePrompt = String(g.goal);
        if (g?.repo_id) liveCwd = String(g.repo_id);
      }
      const r1 = await processOutbox(db, adapter, { ...(livePrompt ? { prompt: livePrompt } : {}), ...(liveCwd ? { cwd: liveCwd } : {}) });
      const r2 = await reconcileUnknown(db, adapter);
      // S4 Scheduler: SENT oturumlarının durum yoklaması (kimi-K3 ölümünün defterde
      // görünmez kaldığı canlı bulgunun kapanışı — DERSLER 173, K-0050)
      const r3 = await pollSentSessions(db, adapter);
      // A0-2 (graf v10, wiring): asılı run sweep — RUNNING + kira-dolmuş runlar kart/
      // temiz-öldürülür (c0ea713b deseni: ölen dış oturum defterde RUNNING kalıyordu).
      // Kira disiplini (denetçi B3): defter kirası 30 dk; lease sözleşmeli worker
      // geldiğinde kiraDakika ≥ lease süresi ×2 tutulmalı (bugün takeLease üretimde
      // çağrılmıyor — kanıtlı-dal bugün tetiklenemez). Kart bildirimi bu dalgada
      // notify'sız (kart approvals satırında görünür; CRITICAL notify A0-3 kalemi).
      const r4 = sweepAsiliRunlar(db, { actor: 'tick' });
      return { code: 0, out: { outbox: r1, reconcile: r2, sentPoll: r3, sweep: r4 } };
    }
    case 'capsule': {
      // kapsul yasam dongusu 1/4: tek node'lu minimal plan + run (e2e-s11 deseni).
      // Dispatch burada YOK: A03 kapsi onaysiz dispatchNode'u reddeder;
      // sira capsule -> approve -> dispatch -> decide (e2e-s11 akis sirasi).
      const goal = flag('goal'); const repoId = flag('repo'); const commit = flag('commit');
      if (!goal || !repoId) return { code: 1, out: 'kullanim: ordu capsule --goal "..." --repo R --commit <64hex> [--allow KOMUT]... [--provider P [--model M]]' };
      if (!commit || !/^[0-9a-f]{64}$/.test(commit)) return { code: 1, out: 'capsule reddedildi: --commit 64-hex sha256 olmali' };
      const allowed = flags('allow');
      const provider = flag('provider'); const model = flag('model'); // F6.5: rol->model secimi (opsiyonel)
      const runId = 'run-' + randomUUID().slice(0, 8);
      const nodeId = 'n1';
      try {
        const { planHash } = createRunPlan(db, {
          capsuleId: 'cap-' + runId, goal, repoId, sourceCommit: commit,
          runId, planId: 'plan-' + runId, profileHash: createHash('sha256').update('cli:capsule').digest('hex'),
          nodes: [{ id: nodeId, role: 'coder', deps: [], ...(provider ? { provider } : {}), ...(model ? { model } : {}) }], maxWorkers: 1,
          allowedCommands: allowed.length ? allowed : ['npm test'],
        });
        return { code: 0, out: { runId, planHash, nodeId, capsuleId: 'cap-' + runId } };
      } catch (e: any) { return { code: 1, out: 'capsule hatasi: ' + e.message }; }
    }
    case 'approve': {
      // kapsul 2/4: insan onayi = bu komutun kendisi (actor 'insan:cli'); yanlis/bayat plan-hash RED.
      const runId = flag('run'); const planHash = flag('plan-hash');
      if (!runId || !planHash) return { code: 1, out: 'kullanim: ordu approve --run <runId> --plan-hash <hash>' };
      try {
        approvePlan(db, runId, planHash, 'insan:cli');
        return { code: 0, out: { runId, approved: true, planHash, actor: 'insan:cli' } };
      } catch (e: any) { return { code: 1, out: 'onay reddedildi: ' + e.message }; }
    }
    case 'dispatch': {
      // kapsul 3/4: hazir node'lari outbox'a yaz (A03: onaysiz planda readyNodes bos doner).
      const runId = flag('run');
      if (!runId) return { code: 1, out: 'kullanim: ordu dispatch --run <runId>' };
      try {
        const run = db.prepare('SELECT p.plan_hash FROM plans p JOIN runs r ON r.plan_id=p.id WHERE r.id=?').get(runId) as any;
        if (!run) return { code: 1, out: 'dispatch reddedildi: run yok: ' + runId };
        const ready = readyNodes(db, runId);
        const dispatched: object[] = [];
        if (ready.length > 0) {
          const startCommandId = ensureStartCommand(db, runId, run.plan_hash as string, 'insan:cli');
          for (const nodeId of ready) {
            dispatched.push({ nodeId, ...dispatchNode(db, runId, nodeId, {
              tokens: 1000, startCommandId, dispatchKey: 'dk-' + runId + '-' + nodeId, handoff: sampleHandoff(runId),
            }) });
          }
        }
        return { code: 0, out: { runId, ready: ready.length, dispatched } };
      } catch (e: any) { return { code: 1, out: 'dispatch reddedildi: ' + e.message }; }
    }
    case 'evaluate': {
      // kapsul 3.5/4: bağımsız DOSYA değerlendiricisi — worker beyanına güven yok.
      // commitCandidate(A36) → recordEvidence(A13) → settleNodeOutcome(A10) zinciri.
      const runId = flag('run'); const attemptId = flag('attempt'); const artifactPath = flag('artifact');
      if (!runId || !attemptId || !artifactPath) return { code: 1, out: 'kullanim: ordu evaluate --run <runId> --attempt <attemptId> --artifact <yol> [--expect metin]' };
      try {
        const own = db.prepare('SELECT id FROM attempts WHERE id=? AND run_id=?').get(attemptId, runId) as any;
        if (!own) return { code: 1, out: 'evaluate reddedildi: attempt bu runa ait değil' };
        const r = evaluateArtifact(db, { attemptId, artifactPath, expect: flag('expect'), actorId: 'evaluator:cli' });
        return { code: r.exitCode, out: r };
      } catch (e: any) { return { code: 1, out: 'evaluate reddedildi: ' + e.message }; }
    }
    case 'decide': {
      // kapsul 4/4: teslim onayi. M18 makbuzu run'in donmus ACCEPTED adayindan ve o aday
      // uzerindeki PASS kanitlarindan kurulur; requestDelivery -> decideApproval (e2e-s11 zinciri).
      const runId = flag('run');
      const wantsApprove = rest.includes('--approve'); const wantsReject = rest.includes('--reject');
      if (!runId || wantsApprove === wantsReject) return { code: 1, out: 'kullanim: ordu decide --run <runId> (--approve|--reject)' };
      try {
        const cand = db.prepare("SELECT candidate_hash, node_id FROM attempts WHERE run_id=? AND state='ACCEPTED' AND candidate_hash IS NOT NULL ORDER BY number DESC LIMIT 1").get(runId) as any;
        if (!cand) return { code: 1, out: 'decide reddedildi: ACCEPTED donmus aday yok (once teslim adayi gerek)' };
        const evidenceRefs = (db.prepare("SELECT id FROM evidence WHERE candidate_hash=? AND verdict='PASS' ORDER BY rowid").all(cand.candidate_hash) as any[]).map((r) => r.id as string);
        const receipt = sampleReceipt(cand.candidate_hash as string, cand.node_id as string, { evidenceRefs });
        const req = requestDelivery(db, runId, 'insan:cli', receipt);
        const decision = wantsApprove ? 'APPROVED' as const : 'REJECTED' as const;
        const dec = decideApproval(db, req.approvalId, decision, 'insan:cli', 1);
        const runState = (db.prepare('SELECT state FROM runs WHERE id=?').get(runId) as any).state as string;
        return { code: 0, out: { runId, approvalId: req.approvalId, request: req.status, decision, status: dec.status, runState } };
      } catch (e: any) { return { code: 1, out: 'decide reddedildi: ' + e.message }; }
    }
    case 'notify': {
      // S4 Bildirim: ÜRETİM sender ucu — kuyruğu (opsiyonel --enqueue ile yeni kayıt)
      // gerçek webhook'a boşalt. ORDU_NOTIFY_URL yoksa DÜRÜST RED: sessiz no-op YOK
      // (notify.ts 'sender-yok' fail-closed'ının CLI yüzü). Yol pano-server ile aynı
      // kökte: dirname(dbPath)/notify.jsonl — bildirim diske iner, pano oradan okur.
      const wantsEnqueue = rest.includes('--enqueue');
      const severity = flag('severity'); const title = flag('title'); const body = flag('body'); const dedupeKey = flag('dedupe-key');
      if (wantsEnqueue && (!severity || !title || body === undefined || !dedupeKey))
        return { code: 1, out: 'kullanim: ordu notify [--enqueue --severity INFO|WARN|CRITICAL --title T --body B --dedupe-key K]' };
      let p;
      try {
        p = openProductionNotify(deps.dbPath, deps.env, { ...(now ? { now } : {}), ...(deps.notifyExec ? { execSync: deps.notifyExec } : {}) });
      } catch (e: any) { return { code: 1, out: 'notify reddedildi: ' + e.message }; }
      if (!p.urlSet)
        return { code: 1, out: 'notify reddedildi: ORDU_NOTIFY_URL ayarli degil — gercek sender ucu kapali (sessiz teslim YOK; kuyruk dokunulmadan birakildi)' };
      let queued: object | undefined;
      if (wantsEnqueue) {
        try {
          const rec = p.outbox.enqueue({ dedupeKey, severity: severity as any, title, body });
          queued = { id: rec.id, dedupeKey: rec.dedupeKey, status: rec.status };
        } catch (e: any) { return { code: 1, out: 'notify enqueue reddedildi: ' + e.message }; }
      }
      try {
        const r = p.outbox.flush();
        return { code: 0, out: { path: p.outbox.path, ...(queued ? { queued } : {}), ...r,
          bekleyen: p.outbox.list().filter((x) => x.status === 'pending' || x.status === 'deferred').length } };
      } catch (e: any) { return { code: 1, out: 'notify flush reddedildi: ' + e.message }; }
    }
    case 'replan': {
      // A2 (graf v6; OTONOMİ MERDİVENİ AŞAMA 2/L3): replan motoru CLI yüzü.
      // Ölç (DRIFT% + sapma + defter bağlamı) → taslak; eşik KOD TAŞIMAZ —
      // [insan] onayı: --esik N ölçümde, --onay + REPLAN_ONAYLIYORUM uygulamada.
      // Aktör daima 'insan:cli' (EK-2: ajan/proxy onaylayamaz — replanOnayla RED eder).
      const planEv = flag('plan') ?? deps.env.ORDU_PLAN ?? 'plans/PLAN.md';
      const kabulEv = flag('kabul') ?? deps.env.ORDU_KABUL ?? 'plans/kabul.csv';
      const onayId = flag('onay');
      if (onayId) {
        try {
          const r = replanOnayla({
            defter: openReplanDefteri(deps.dbPath), taslakId: onayId,
            confirm: flag('confirm') ?? '', actor: 'insan:cli', planEv, ...(now ? { now } : {}),
          });
          return { code: 0, out: r };
        } catch (e: any) { return { code: 1, out: 'replan onay reddedildi: ' + e.message }; }
      }
      const esik = flag('esik') !== undefined ? Number(flag('esik')) : undefined;
      const hedef = flag('hedef') !== undefined ? Number(flag('hedef')) : undefined;
      if (esik !== undefined && !(Number.isFinite(esik) && esik >= 0 && esik <= 100))
        return { code: 1, out: 'replan: --esik 0-100 olmalı' };
      if (hedef !== undefined && !(Number.isFinite(hedef) && hedef >= 0 && hedef <= 100))
        return { code: 1, out: 'replan: --hedef 0-100 olmalı' };
      try {
        const kabul = kabulOku(kabulEv);
        if (!existsSync(planEv)) return { code: 1, out: 'replan reddedildi: PLAN.md yok: ' + planEv };
        const drift = olcDrift(readFileSync(planEv, 'utf8'), kabul);
        const sapma = olcSapma(db, kabul, {
          ...(hedef !== undefined ? { hedefYuzde: hedef } : {}),
          ...(esik !== undefined ? { esik } : {}),
        });
        const defter = openReplanDefteri(deps.dbPath);
        defter.olcumKaydet(sapma, drift, now);
        const t = replanTaslagi(sapma, drift, now);
        // B7 (üretim bulgusu, kural.ts ikizi): aynı öneri imzası için ONAYSIZ taslak
        // zaten varsa yenisi DOĞMAZ — mevcut döner (çift gözlemsel koşum spam üretmez).
        let taslikBilgi: object | undefined;
        if (t.oneriler.length > 0) {
          const onayliIdler = new Set(defter.onaylar().map((a) => a.taslakId));
          const eslesen = eslesenReplanTaslagi(defter.taslaklar(), onayliIdler, t.oneriler);
          if (eslesen) {
            taslikBilgi = { id: eslesen.id, tetik: eslesen.tetik, oneriSayisi: eslesen.oneriler.length, mevcut: true, onayKomutu: `ordu replan --onay ${eslesen.id} --confirm "REPLAN ONAYLIYORUM"` };
          } else {
            defter.taslakKaydet(t);
            taslikBilgi = { id: t.id, tetik: t.tetik, oneriSayisi: t.oneriler.length, onayKomutu: `ordu replan --onay ${t.id} --confirm "REPLAN ONAYLIYORUM"` };
          }
        }
        return { code: 0, out: { drift, sapma, defterYolu: defter.path,
          esikNotu: esik === undefined ? 'esik TANIMSIZ — tetikleme kapali ([insan] esik onayi: --esik N verin)' : undefined,
          ...(taslikBilgi ? { taslak: taslikBilgi } : {}) } };
      } catch (e: any) { return { code: 1, out: 'replan reddedildi: ' + e.message }; }
    }
    case 'kural': {
      // A3 (graf v8 kritik yol ucu): deneyim→kural derleyicisi CLI yüzü.
      // K-0051: hedef AGENTS.md; ilk toplu onay <= 5 (kademeli); sentez ajan turu
      // ayrı kayıttır (ajan:llm — onay DEĞİL). Ölçüm/aday koşusu ↔ [insan] onay kapısı.
      // Aktör daima 'insan:cli' (EK-2: ajan/proxy onaylayamaz — kuralOnayla RED eder).
      const kok = flag('kok') ?? deps.env.ORDU_KOK ?? '..';
      const derslerEv = flag('dersler') ?? kok + '/DERSLER.md';
      const hedefEv = kok + '/' + KURAL_HEDEF_DOSYA; // K-0051 karar 1: hedef SABİT — flag yok (sayac havuzu dışı hedef tavan kilidini körletirdi, denetçi B2)
      const hedeflerYolu = flag('hedefler') ?? kok + '/hedefler.json';
      const onayId = flag('onay');
      if (onayId) {
        try {
          const r = kuralOnayla({
            defter: openKuralDefteri(deps.dbPath), taslakId: onayId,
            confirm: flag('confirm') ?? '', actor: 'insan:cli', hedefEv, kok, hedeflerYolu, ...(now ? { now } : {}),
          });
          return { code: 0, out: r };
        } catch (e: any) { return { code: 1, out: 'kural onay reddedildi: ' + e.message }; }
      }
      const sentezId = flag('sentez');
      if (sentezId) {
        const adayOnEk = flag('aday'); const metin = flag('metin');
        if (!adayOnEk || metin === undefined)
          return { code: 1, out: 'kullanim: ordu kural --sentez <taslakId> --aday <anahtar-on-ek> --metin "..." (sentez ajan:llm turu — onay degil)' };
        try {
          const d = openKuralDefteri(deps.dbPath);
          d.sentezKaydet(sentezId, adayOnEk, metin, 'ajan:llm', now);
          return { code: 0, out: { sentez: true, taslakId: sentezId, defterYolu: d.path } };
        } catch (e: any) { return { code: 1, out: 'kural sentez reddedildi: ' + e.message }; }
      }
      const limit = flag('limit') !== undefined ? Number(flag('limit')) : 3;
      if (!(Number.isInteger(limit) && limit >= 1 && limit <= KURAL_PARTI_UST))
        return { code: 1, out: `kural: --limit 1-${KURAL_PARTI_UST} olmali (K-0051 kademeli guven)` };
      try {
        const tarama = derslerOku(derslerEv);
        const sayac = kuralSayaci(kok);
        const esik = esikOku(hedeflerYolu);
        const mevcut = sayac.dosyaBasi.flatMap((d) => d.satirlar);
        const sonuc = adayUret(tarama, mevcut, limit);
        const defter = openKuralDefteri(deps.dbPath);
        defter.taramaKaydet({ maddeSayisi: tarama.maddeler.length, altDersSayisi: tarama.altDersler.length, adaySayisi: sonuc.adaylar.length, sayac: sayac.toplam }, now);
        let taslikBilgi: object | undefined;
        if (sonuc.adaylar.length > 0) {
          // B7 (üretim bulgusu): aynı aday-anahtar seti için ONAYSIZ taslak zaten varsa
          // yenisi DOĞMAZ — mevcut döner (sentez kayıtları taslağa bağlı kalır; spam yok).
          const onayliIdler = new Set(defter.onaylar().map((a) => a.taslakId));
          const eslesen = eslesenTaslak(defter.taslaklar(), onayliIdler, sonuc.adaylar);
          if (eslesen) {
            taslikBilgi = { id: eslesen.id, adaySayisi: eslesen.adaylar.length, mevcut: true, onayKomutu: `ordu kural --onay ${eslesen.id} --confirm "${KURAL_ONAY_METNI}"` };
          } else {
            const t = {
              id: 'krl-' + randomUUID().slice(0, 8), at: now().toISOString(), tip: 'TASLAK' as const,
              sayac: sayac.toplam, esik: esik.kirmizi, adaylar: sonuc.adaylar, dusenler: sonuc.dusenler, kalan: sonuc.kalan,
            };
            defter.taslakKaydet(t);
            taslikBilgi = { id: t.id, adaySayisi: sonuc.adaylar.length, onayKomutu: `ordu kural --onay ${t.id} --confirm "${KURAL_ONAY_METNI}"` };
          }
        }
        return { code: 0, out: {
          sayac: { toplam: sayac.toplam, dosyaBasi: sayac.dosyaBasi.map((d) => ({ yol: d.yol, sayi: d.sayi })) },
          esik,
          dersler: { madde: tarama.maddeler.length, altDers: tarama.altDersler.length, anomali: tarama.anomaliler.length, ev: derslerEv },
          adaylar: sonuc.adaylar.map((a) => ({ anahtar: a.anahtar.slice(0, 12), satir: a.kaynakSatir, metin: a.hamMetin.slice(0, 120), ...(a.cakisanTahmin ? { cakisanTahmin: a.cakisanTahmin } : {}) })),
          dusenler: sonuc.dusenler, kalan: sonuc.kalan, defterYolu: kuralYolu(deps.dbPath),
          ...(taslikBilgi ? { taslak: taslikBilgi } : {}),
        } };
      } catch (e: any) { return { code: 1, out: 'kural reddedildi: ' + e.message }; }
    }
    case 'gece': {
      // A4 Otonom sürü sürücüsü — gece modu: hedef+limit ver → gece tur serisi.
      // Açılış kapısı gözetimsiz rozetidir (fail-closed: rozet kırmızıysa 0 tur RED);
      // canlılık her tur sonrası — rozet düşerse seri kendini kapatır; limit dolunca
      // temiz kapanış. Otonom tur sayısı + ortalama süre gece defterine (gece.jsonl)
      // yazılır; her çıkışta kapanış kaydı düşer ("neden açılmadı" da kalıcı bilgi).
      const hedef = flag('hedef');
      if (!hedef || !hedef.trim()) {
        return { code: 1, out: 'gece: --hedef "..." zorunlu (gece hedefsiz açılmaz — ölçüm kaydı hedefsiz doğmaz)' };
      }
      const limitRaw = flag('limit');
      const turLimiti = limitRaw !== undefined ? Number(limitRaw) : undefined;
      if (turLimiti === undefined || !(Number.isInteger(turLimiti) && turLimiti > 0)) {
        return { code: 1, out: 'gece: --limit pozitif tam sayı olmalı (tur tavanı — sonsuz gece yok)' };
      }
      const intervalMs = Number(flag('interval-ms') ?? 30_000);
      if (!(Number.isFinite(intervalMs) && intervalMs >= 1000)) {
        return { code: 1, out: 'gece: --interval-ms >= 1000 gerekli (cadence disiplini — serve ile aynı kapı)' };
      }
      const tazelikDk = flag('tazelik-dk') !== undefined ? Number(flag('tazelik-dk')) : undefined;
      if (tazelikDk !== undefined && !(Number.isFinite(tazelikDk) && tazelikDk > 0)) {
        return { code: 1, out: 'gece: --tazelik-dk pozitif sayı olmalı (rozet tazelik penceresi)' };
      }
      let signalled = false;
      const onSig = () => { signalled = true; };
      process.on('SIGINT', onSig); process.on('SIGTERM', onSig);
      try {
        const res = await geceModu({
          hedef, turLimiti, intervalMs, dbPath: deps.dbPath,
          kanitDefteriYolu: (deps.env.ORDU_KANIT_DEFTERI as string | undefined) || KANIT_DEFTERI_YOLU,
          defterYolu: (deps.env.ORDU_GECE_DEFTERI as string | undefined) || GECE_DEFTERI_YOLU,
          ...(tazelikDk !== undefined ? { tazelikMs: tazelikDk * 60_000 } : {}),
          probePath: deps.probePath, env: deps.env,
          shouldStop: () => signalled,
        });
        return { code: res.code, out: res.stats };
      } finally {
        process.removeListener('SIGINT', onSig); process.removeListener('SIGTERM', onSig);
      }
    }
    case 'serve': {
      // S4 Scheduler 2/2: tick DÖNGÜSÜ — daemon sürücüsü. Her tur ayrı `tick` ÇOCUK
      // süreci (crash izolasyonu); cadence schedule.ts disipliniyle (misfire/overlap
      // SKIP — catch-up fırtınası yok). SIGINT/SIGTERM temiz duruş. STOP mandalı her
      // uyanışta defterden: mandalı kapalıyken çocuk HİÇ spawn edilmez, açılınca aynı
      // occurrence adil yeniden denenir. 3 üst üste kırmızı çocuk → fail-closed exit.
      const intervalMs = Number(flag('interval-ms') ?? 30_000);
      if (!(Number.isFinite(intervalMs) && intervalMs >= 1000)) {
        return { code: 1, out: 'serve: --interval-ms >= 1000 gerekli (cadence disiplini — hızlı döngü spam\'i kapı dışı)' };
      }
      const maxTicks = flag('max') !== undefined ? Number(flag('max')) : undefined;
      if (maxTicks !== undefined && !(Number.isInteger(maxTicks) && maxTicks > 0)) {
        return { code: 1, out: 'serve: --max pozitif tam sayı olmalı' };
      }
      let signalled = false;
      const onSig = () => { signalled = true; };
      process.on('SIGINT', onSig); process.on('SIGTERM', onSig);
      try {
        const res = await runDaemon({
          intervalMs, maxTicks, dbPath: deps.dbPath, probePath: deps.probePath, env: deps.env,
          // A0-3 wiring: serve döngüsü rozetin 4/6 defter-sorgulu bayrağını (koşul 1/2/3/5)
          // BAŞARILI tick sonrası kanıt defterine besler — kırmızı koşul/koşum kayıt ÜRETMEZ
          // (yeşile boyama yok; kanıt eskir → rozet fail-closed düşer). Yol ORDU_KANIT_DEFTERI
          // env'iyle yönlendirilir; varsayılan üretim defteri gozetimsiz.ts KANIT_DEFTERI_YOLU.
          kanitDefteriYolu: (deps.env.ORDU_KANIT_DEFTERI as string | undefined) || KANIT_DEFTERI_YOLU,
          shouldStop: () => signalled,
        });
        return { code: res.code, out: res.stats };
      } finally {
        process.removeListener('SIGINT', onSig); process.removeListener('SIGTERM', onSig);
      }
    }
    default:
      return { code: 1, out: 'kullanım: ordu status|stop [--actor A --reason R]|resume --confirm "..."|tick [--probe yol]|serve [--interval-ms N] [--max N]|gece --hedef "..." --limit N [--interval-ms N] [--tazelik-dk N]|notify [--enqueue --severity INFO|WARN|CRITICAL --title T --body B --dedupe-key K]|capsule --goal "..." --repo R --commit <64hex> [--allow K]...|approve --run <runId> --plan-hash <hash>|dispatch --run <runId>|evaluate --run R --attempt A --artifact P [--expect M]|decide --run <runId> (--approve|--reject)|replan [--esik N --hedef N --plan P --kabul K]|replan --onay <taslakId> --confirm "REPLAN ONAYLIYORUM"|kural [--kok R] [--limit 1-5]|kural --sentez <taslakId> --aday <on-ek> --metin "..."|kural --onay <taslakId> --confirm "KURALLARI ONAYLIYORUM"' };
  }
}

// doğrudan çalıştırma: node src/cli.ts status
if (process.argv[1] && process.argv[1].endsWith('cli.ts')) {
  const r = await cliMain(process.argv.slice(2), {
    dbPath: process.env.ORDU_DB ?? 'data/ordu.sqlite',
    env: process.env,
    probePath: process.env.ORDU_PROBE ?? 'evidence/probe-latest.json',
  });
  console.log(JSON.stringify(r.out, null, 2));
  process.exitCode = r.code;
}
