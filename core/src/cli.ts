// ordu CLI — headless operasyon yüzeyi (V3-S1.1'in insan kapılarıyla konuşan ucu).
// Tasarım kuralı: her komut TEK iş + makine-okunur JSON çıktı; karar komutları
// B01 sözleşmesinden geçer (CLEAR_STOP evrensel onay metni ister — sürtünme bilinçli).
import { mkdirSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
import { openStore, recordCommand, setGlobalStop, pendingCapacity } from './store.ts';
import { processOutbox, reconcileUnknown, type WorkerAdapter } from './dispatcher.ts';
import { loadVerifiedProbe, spawnBlockedReason } from './capabilities.ts';
import { PaseoWorkerAdapter } from './paseo-adapter.ts';
import { makeSafePaseoTransport } from './paseo-transport.ts';
import {
  createRunPlan, approvePlan, readyNodes, dispatchNode, ensureStartCommand,
  requestDelivery, decideApproval,
} from './supervisor.ts';
import { sampleHandoff } from './handoff.ts';
import { sampleReceipt } from './reasoning-receipt.ts';
import { evaluateArtifact } from './cli-evaluate.ts';

export interface CliDeps {
  dbPath: string;
  env: NodeJS.ProcessEnv;
  probePath: string;
  now?: () => Date;
  makeAdapter?: (probe: ReturnType<typeof loadVerifiedProbe>) => WorkerAdapter; // test enjeksiyonu
}

function defaultAdapter(probe: ReturnType<typeof loadVerifiedProbe>): WorkerAdapter {
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
      const blocked = spawnBlockedReason(probe);
      if (blocked) return { code: 2, out: { dispatch: 'BLOCKED', reason: blocked, note: 'B02 — yetenekler kanıtlanmadan worker yok' } };
      const adapter = deps.makeAdapter?.(probe) ?? defaultAdapter(probe);
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
      return { code: 0, out: { outbox: r1, reconcile: r2 } };
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
    default:
      return { code: 1, out: 'kullanım: ordu status|stop [--actor A --reason R]|resume --confirm "..."|tick [--probe yol]|capsule --goal "..." --repo R --commit <64hex> [--allow K]...|approve --run <runId> --plan-hash <hash>|dispatch --run <runId>|evaluate --run R --attempt A --artifact P [--expect M]|decide --run <runId> (--approve|--reject)' };
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
