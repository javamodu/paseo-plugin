export const humanAuthorityActions = ['H1_DECISION', 'H2_START', 'MERGE', 'DEPLOY'];

export const createHumanAuthorityGate = () => {
  const decisions = [];
  return {
    request: ({ actor, action }) => {
      if (actor === 'human' && humanAuthorityActions.includes(action)) {
        const decisionId = `decision-${decisions.length + 1}`;
        decisions.push({ actor, action, decisionId });
        return { allowed: true, status: 'GREEN', decisionId, receipt: `receipt-${decisionId}` };
      }
      return { allowed: false, status: 'RED', reason: 'AGENT_NOT_AUTHORIZED', decisionId: null, receipt: null };
    },
    get decisions() {
      return decisions.slice();
    },
  };
};

export const faultFamilies = [
  {
    id: 'wrong-output',
    inject: () => ({ output: 'not-json' }),
    detect: (state) => !state.output.includes('tests'),
  },
  {
    id: 'zero-tests',
    inject: () => ({ output: '{"tests":0,"failed":0}' }),
    detect: (state) => JSON.parse(state.output).tests === 0,
  },
  {
    id: 'worker-death',
    inject: () => ({ exitCode: 1 }),
    detect: (state) => state.exitCode !== 0,
  },
  {
    id: 'manager-death',
    inject: () => ({ managerAlive: false }),
    detect: (state) => state.managerAlive === false,
  },
  {
    id: 'duplicate-submission',
    inject: () => ({ commandId: 'cmd-1', payload: 'same' }),
    detect: (state) => state.commandId === 'cmd-1' && state.payload === 'same',
  },
  {
    id: 'stop-restart',
    inject: () => ({ stopLatch: true, restartRequested: true }),
    detect: (state) => state.stopLatch === true && state.restartRequested === true,
  },
  {
    id: 'unconfirmed-cancel',
    inject: () => ({ cancelRequested: true, cancelConfirmed: false }),
    detect: (state) => state.cancelRequested === true && state.cancelConfirmed === false,
  },
  {
    id: 'stale-owner',
    inject: () => ({ currentOwner: 'worker-2', recordedOwner: 'worker-1' }),
    detect: (state) => state.currentOwner !== state.recordedOwner,
  },
  {
    id: 'wrong-source',
    inject: () => ({ expectedSourceHash: 'a'.repeat(64), actualSourceHash: 'b'.repeat(64) }),
    detect: (state) => state.expectedSourceHash !== state.actualSourceHash,
  },
  {
    id: 'usage-mismatch',
    inject: () => ({ usageUnknown: true }),
    detect: (state) => state.usageUnknown === true,
  },
];
