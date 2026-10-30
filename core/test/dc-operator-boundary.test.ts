import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { planHashOf } from '../src/supervisor.ts';
import { FULL_CONTRACT_VERSION } from '../src/dc-full-contract.ts';
import { ADR_BINDING, bindApprovedContract } from '../src/dc-contract-binding.ts';
import {
  OPERATOR_SURFACE_ACTIONS,
  issueOperatorAuthorization,
  operatorSourceIdentityOf,
  recordOperatorBoundaryDecision,
  verifyOperatorAuthorization,
  type OperatorSurfaceAction,
} from '../src/dc-operator-boundary.ts';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const now = '2026-10-30T03:00:00.000Z';
const notBefore = '2026-10-30T02:00:00.000Z';
const expiresAt = '2026-10-30T04:00:00.000Z';

const nodes = () => [
  { id: 'research', role: 'researcher', deps: [] as string[], provider: 'codex', model: 'glm-5.3' },
  { id: 'write', role: 'writer', deps: ['research'], provider: 'codex', model: 'glm-5.3' },
];

const contractFor = (repository = 'D:/Vibecode/ordu') => {
  const planNodes = nodes();
  return {
    contractVersion: FULL_CONTRACT_VERSION,
    goal: 'Operator sinirini dogrula',
    source: { repository, objectAlgorithm: 'sha1', objectId: '0123456789012345678901234567890123456789' },
    permissions: { allowedCommands: ['git', 'node'] },
    plan: { nodes: planNodes, legacyHash: planHashOf(planNodes) },
    evaluatorHash: hash('evaluator'),
    policyHash: hash('policy'),
    budget: { maxReservedTokens: 10000 },
    deadline: { at: '2026-11-01T00:00:00.000Z' },
    resolvedModel: { provider: 'codex', model: 'glm-5.3' },
    testSuite: { hash: hash('suite'), command: 'node --test' },
  };
};

const bindingFor = (contract: unknown) => bindApprovedContract({
  contract,
  approval: { approvalId: 'apv-operator', decision: 'APPROVED' },
  ledger: { stream: 'commands', recordId: 'cmd-operator', commandKind: 'APPROVE_PLAN' },
  adr: ADR_BINDING,
});

const operatorKeys = generateKeyPairSync('ed25519');
const workerKeys = generateKeyPairSync('ed25519');
const privateKeyPem = operatorKeys.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
const publicKeyPem = operatorKeys.publicKey.export({ type: 'spki', format: 'pem' }) as string;
const workerPrivateKeyPem = workerKeys.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;

const authorizationFor = (
  contract: unknown,
  contractBinding: unknown,
  actions: readonly OperatorSurfaceAction[] = OPERATOR_SURFACE_ACTIONS,
) => issueOperatorAuthorization({
  privateKey: privateKeyPem,
  keyId: 'operator-key-001',
  operatorId: 'operator-001',
  contract,
  contractBinding,
  actions,
  notBefore,
  expiresAt,
  nonce: 'nonce-operator-001',
});

test('P1: yetkili operator tum CLI yuzlerini ayni sozlesme ve kaynakla kullanir', () => {
  const root = mkdtempSync(join(tmpdir(), 'ordu-s1-05-'));
  const ledgerPath = join(root, 'operator-boundary.jsonl');
  try {
    const contract = contractFor();
    const contractBinding = bindingFor(contract);
    const authorization = authorizationFor(contract, contractBinding);
    for (const action of OPERATOR_SURFACE_ACTIONS) {
      const decision = verifyOperatorAuthorization({ action, contract, contractBinding, authorization, publicKey: publicKeyPem, now });
      assert.equal(decision.allowed, true);
      recordOperatorBoundaryDecision({ ledgerPath, decision, at: now });
    }
    const entries = readFileSync(ledgerPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    assert.equal(entries.length, OPERATOR_SURFACE_ACTIONS.length);
    assert.deepEqual(entries.map((entry) => entry.action), [...OPERATOR_SURFACE_ACTIONS]);
    assert.ok(entries.every((entry) => entry.decision === 'ALLOW' && entry.operatorId === 'operator-001'));
    assert.ok(entries.every((entry) => entry.sourceId === operatorSourceIdentityOf(contract)));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('N1: isci/test baglaminda insan etiketi taklidi onay, resume ve grant RED', () => {
  const root = mkdtempSync(join(tmpdir(), 'ordu-s1-05-'));
  const ledgerPath = join(root, 'operator-boundary.jsonl');
  try {
    const contract = contractFor();
    const contractBinding = bindingFor(contract);
    const spoofedAuthorization = issueOperatorAuthorization({
      privateKey: workerPrivateKeyPem,
      keyId: 'worker-key-001',
      operatorId: 'insan:cli',
      contract,
      contractBinding,
      actions: OPERATOR_SURFACE_ACTIONS,
      notBefore,
      expiresAt,
      nonce: 'worker-spoof',
    });
    for (const action of ['approve', 'resume', 'grant'] as const) {
      const decision = verifyOperatorAuthorization({
        action,
        contract,
        contractBinding,
        authorization: spoofedAuthorization,
        publicKey: publicKeyPem,
        now,
      });
      assert.equal(decision.allowed, false);
      assert.equal(decision.reason, 'operator imzasi gecersiz');
      recordOperatorBoundaryDecision({ ledgerPath, decision, at: now });
      const textRequest = {
        action,
        contract,
        contractBinding,
        authorization: spoofedAuthorization,
        publicKey: publicKeyPem,
        now,
        claimedActor: 'insan:cli',
        environment: 'worker',
      };
      assert.throws(() => verifyOperatorAuthorization(textRequest), /operator boundary request alan kumesi kapali degil/);
    }
    const entries = readFileSync(ledgerPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    assert.equal(entries.length, 3);
    assert.ok(entries.every((entry) => entry.decision === 'DENY' && entry.reason === 'operator imzasi gecersiz'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('N2: kapsam veya kaynak degisince eski operator yetkisi kullanilamaz', () => {
  const root = mkdtempSync(join(tmpdir(), 'ordu-s1-05-'));
  const ledgerPath = join(root, 'operator-boundary.jsonl');
  try {
    const contract = contractFor();
    const contractBinding = bindingFor(contract);
    const scopedAuthorization = authorizationFor(contract, contractBinding, ['approve', 'resume']);
    const grantDecision = verifyOperatorAuthorization({
      action: 'grant',
      contract,
      contractBinding,
      authorization: scopedAuthorization,
      publicKey: publicKeyPem,
      now,
    });
    assert.equal(grantDecision.allowed, false);
    assert.equal(grantDecision.reason, 'action operator kapsaminda degil');
    recordOperatorBoundaryDecision({ ledgerPath, decision: grantDecision, at: now });

    const otherContract = contractFor('D:/Vibecode/other');
    const otherBinding = bindingFor(otherContract);
    const authorization = authorizationFor(contract, contractBinding);
    const sourceDecision = verifyOperatorAuthorization({
      action: 'approve',
      contract: otherContract,
      contractBinding: otherBinding,
      authorization,
      publicKey: publicKeyPem,
      now,
    });
    assert.equal(sourceDecision.allowed, false);
    assert.equal(sourceDecision.reason, 'contract kimligi eslesmiyor');
    recordOperatorBoundaryDecision({ ledgerPath, decision: sourceDecision, at: now });

    const entries = readFileSync(ledgerPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    assert.equal(entries.length, 2);
    assert.deepEqual(entries.map((entry) => entry.reason), [
      'action operator kapsaminda degil',
      'contract kimligi eslesmiyor',
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
