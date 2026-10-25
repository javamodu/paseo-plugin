// Pure reference functions. This file does not execute tools or enforce an OS sandbox.
const transitions = {
  DRAFT: ['READY', 'CANCEL_REQUESTED'],
  READY: ['RUNNING', 'PAUSED', 'CANCEL_REQUESTED'],
  RUNNING: ['VERIFYING', 'WAITING_APPROVAL', 'PAUSED', 'CANCEL_REQUESTED', 'FAILED', 'UNKNOWN_EXTERNAL_STATE'],
  VERIFYING: ['RUNNING', 'WAITING_APPROVAL', 'PAUSED', 'CANCEL_REQUESTED', 'FAILED', 'UNKNOWN_EXTERNAL_STATE'],
  WAITING_APPROVAL: ['RUNNING', 'ACCEPTED', 'PAUSED', 'CANCEL_REQUESTED', 'FAILED'],
  PAUSED: ['RUNNING', 'CANCEL_REQUESTED'],
  CANCEL_REQUESTED: ['CANCELLED', 'UNKNOWN_EXTERNAL_STATE'],
  UNKNOWN_EXTERNAL_STATE: ['WAITING_APPROVAL', 'CANCEL_REQUESTED', 'FAILED'],
  CANCELLED: [], FAILED: [], ACCEPTED: [],
};
export function transition(state, next) {
  if (!transitions[state]?.includes(next)) throw new Error('INVALID_TRANSITION');
  return next;
}
export function topologicalOrder(nodes) {
  const ids = new Set(nodes.map(n => n.id));
  if (ids.size !== nodes.length) throw new Error('DUPLICATE_NODE');
  if (nodes.some(n => n.dependsOn.some(d => !ids.has(d)))) throw new Error('UNKNOWN_DEPENDENCY');
  const result = [];
  const remaining = new Map(nodes.map(n => [n.id, new Set(n.dependsOn)]));
  while (remaining.size) {
    const ready = [...remaining].filter(([, deps]) => deps.size === 0).map(([id]) => id).sort();
    if (!ready.length) throw new Error('CYCLE');
    for (const id of ready) { result.push(id); remaining.delete(id); }
    for (const deps of remaining.values()) for (const id of ready) deps.delete(id);
  }
  return result;
}
export function dependencySatisfied(state) {
  return state === 'SUCCEEDED'; // SKIPPED is deliberately not success.
}
export function canAccept({ run, evidence, approval, now }) {
  const expiry = Date.parse(approval.expiresAt);
  return Boolean(
    run.state === 'WAITING_APPROVAL' &&
    run.candidateHash &&
    evidence.trustedEvaluator === true &&
    evidence.verdict === 'PASS' && evidence.exitCode === 0 && evidence.testCount > 0 &&
    evidence.candidateHash === run.candidateHash &&
    evidence.evaluatorHash === run.evaluatorHash &&
    approval.runId === run.id && approval.decision === 'APPROVED' && approval.actor &&
    approval.action === 'ACCEPT_RESULT' &&
    approval.expectedRunVersion === run.version &&
    approval.planHash === run.planHash && approval.policyHash === run.policyHash &&
    approval.candidateHash === run.candidateHash &&
    Number.isFinite(expiry) && expiry > now
  );
}
export function canDispatch({ stopped, paused, usageKnown, sandbox, active, capacity,
                              spent, reserved, requested, tokenLimit }) {
  const numbers = [active, capacity, spent, reserved, requested, tokenLimit];
  if (!numbers.every(n => Number.isSafeInteger(n) && n >= 0) || requested === 0) return false;
  return !stopped && !paused && usageKnown && sandbox &&
    active < capacity && spent + reserved + requested <= tokenLimit;
}
export function aggregateTrials(trials) {
  const started = trials.filter(t => t.started);
  const accepted = started.filter(t => t.verdict === 'PASS');
  const first = accepted.filter(t => t.attempts === 1);
  const costs = started.filter(t => t.knownCostMicros !== null && t.knownCostMicros !== undefined);
  const knownCostMicros = costs.reduce((sum, t) => sum + t.knownCostMicros, 0);
  const unknownCostCount = started.length - costs.length;
  return {
    started: started.length, accepted: accepted.length,
    acceptedRate: started.length ? accepted.length / started.length : null,
    firstPassRate: started.length ? first.length / started.length : null,
    knownCostMicros, unknownCostCount,
    costPerAcceptedMicros: accepted.length && unknownCostCount === 0 ?
      knownCostMicros / accepted.length : null,
  };
}
