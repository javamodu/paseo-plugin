import { appendFileSync, existsSync, readFileSync } from 'node:fs';

export const PROCESS_IDENTITY_VERSION = 'dc-process-identity-v1';

export interface ProcessIdentity {
  pid: number;
  startedAt: string;
  bootId: string;
}

export interface ProcessTreeNode {
  identity: ProcessIdentity;
  parentPid: number | null;
}

export interface ProcessTreeRecord {
  recordVersion: typeof PROCESS_IDENTITY_VERSION;
  attemptId: string;
  ownerId: string;
  ownershipGeneration: number;
  ownershipKey: string;
  root: ProcessTreeNode;
  children: ProcessTreeNode[];
  recordedAt: string;
}

export interface ProcessSnapshot {
  pid: number;
  startedAt: string;
  bootId: string;
  parentPid: number | null;
  alive: boolean;
}

export type DeathConfirmation = 'CONFIRMED' | 'UNKNOWN';

export class ProcessIdentityError extends Error {}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const requireObject = (value: unknown, field: string): Record<string, unknown> => {
  if (!isObject(value)) throw new ProcessIdentityError(field + ' object olmali');
  return value;
};

const requireExactKeys = (value: Record<string, unknown>, keys: readonly string[], field: string): void => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new ProcessIdentityError(field + ' alan kumesi kapali degil');
  }
};

const requireString = (value: unknown, field: string, maxLength = 4096): string => {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    throw new ProcessIdentityError(field + ' gecersiz string');
  }
  return value;
};

const requirePositiveInteger = (value: unknown, field: string): number => {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new ProcessIdentityError(field + ' pozitif tam sayi olmali');
  }
  return value as number;
};

const requireIsoDate = (value: unknown, field: string): string => {
  const text = requireString(value, field, 64);
  if (Number.isNaN(Date.parse(text))) throw new ProcessIdentityError(field + ' ISO-8601 tarih olmali');
  return text;
};

const normalizeIdentity = (value: unknown, field: string): ProcessIdentity => {
  const identity = requireObject(value, field);
  requireExactKeys(identity, ['pid', 'startedAt', 'bootId'], field);
  return {
    pid: requirePositiveInteger(identity.pid, field + '.pid'),
    startedAt: requireIsoDate(identity.startedAt, field + '.startedAt'),
    bootId: requireString(identity.bootId, field + '.bootId', 128),
  };
};

const normalizeNode = (value: unknown, field: string): ProcessTreeNode => {
  const node = requireObject(value, field);
  requireExactKeys(node, ['identity', 'parentPid'], field);
  const parentPid = node.parentPid === null ? null : requirePositiveInteger(node.parentPid, field + '.parentPid');
  return { identity: normalizeIdentity(node.identity, field + '.identity'), parentPid };
};

const normalizeRecord = (value: unknown): ProcessTreeRecord => {
  const record = requireObject(value, 'process tree record');
  requireExactKeys(
    record,
    ['recordVersion', 'attemptId', 'ownerId', 'ownershipGeneration', 'ownershipKey', 'root', 'children', 'recordedAt'],
    'process tree record',
  );
  if (record.recordVersion !== PROCESS_IDENTITY_VERSION) throw new ProcessIdentityError('recordVersion desteklenmiyor');
  const attemptId = requireString(record.attemptId, 'attemptId', 128);
  const ownerId = requireString(record.ownerId, 'ownerId', 128);
  const ownershipGeneration = requirePositiveInteger(record.ownershipGeneration, 'ownershipGeneration');
  const ownershipKey = requireString(record.ownershipKey, 'ownershipKey', 384);
  if (ownershipKey !== attemptId + ':' + ownerId + ':' + ownershipGeneration) {
    throw new ProcessIdentityError('ownershipKey kayitla eslesmiyor');
  }
  if (!Array.isArray(record.children)) throw new ProcessIdentityError('children dizi olmali');
  return {
    recordVersion: PROCESS_IDENTITY_VERSION,
    attemptId,
    ownerId,
    ownershipGeneration,
    ownershipKey,
    root: normalizeNode(record.root, 'root'),
    children: record.children.map((child, index) => normalizeNode(child, 'children[' + index + ']')),
    recordedAt: requireIsoDate(record.recordedAt, 'recordedAt'),
  };
};

export function buildProcessTreeRecord(input: {
  attemptId: string;
  ownerId: string;
  ownershipGeneration: number;
  root: unknown;
  children: unknown[];
  recordedAt: string;
}): ProcessTreeRecord {
  const record = requireObject(input, 'process tree input');
  requireExactKeys(record, ['attemptId', 'ownerId', 'ownershipGeneration', 'root', 'children', 'recordedAt'], 'process tree input');
  const attemptId = requireString(record.attemptId, 'attemptId', 128);
  const ownerId = requireString(record.ownerId, 'ownerId', 128);
  const ownershipGeneration = requirePositiveInteger(record.ownershipGeneration, 'ownershipGeneration');
  const children = Array.isArray(record.children) ? record.children : [];
  return normalizeRecord({
    recordVersion: PROCESS_IDENTITY_VERSION,
    attemptId,
    ownerId,
    ownershipGeneration,
    ownershipKey: attemptId + ':' + ownerId + ':' + ownershipGeneration,
    root: record.root,
    children,
    recordedAt: requireIsoDate(record.recordedAt, 'recordedAt'),
  });
}

export function appendProcessTreeRecord(registryPath: string, record: unknown): ProcessTreeRecord {
  const normalized = normalizeRecord(record);
  appendFileSync(registryPath, JSON.stringify(normalized) + '\n', 'utf8');
  return normalized;
}

export function readProcessTreeRecords(registryPath: string): ProcessTreeRecord[] {
  if (!existsSync(registryPath)) return [];
  const records: ProcessTreeRecord[] = [];
  for (const line of readFileSync(registryPath, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      records.push(normalizeRecord(JSON.parse(line)));
    } catch {
      continue;
    }
  }
  return records;
}

const snapshotOf = (snapshot: readonly ProcessSnapshot[], pid: number): ProcessSnapshot | undefined =>
  snapshot.find((entry) => entry.pid === pid);

const sameIdentity = (left: ProcessIdentity, right: ProcessIdentity): boolean =>
  left.pid === right.pid && left.startedAt === right.startedAt && left.bootId === right.bootId;

const treeMatchesSnapshot = (record: ProcessTreeRecord, snapshot: readonly ProcessSnapshot[]): boolean => {
  const nodes = [record.root, ...record.children];
  for (const node of nodes) {
    const current = snapshotOf(snapshot, node.identity.pid);
    if (!current || !current.alive || !sameIdentity(current, node.identity)) return false;
    if (node.parentPid !== null) {
      const parent = snapshotOf(snapshot, node.parentPid);
      if (!parent || !parent.alive || parent.parentPid === node.identity.pid) return false;
    }
  }
  return true;
};

export function resolveOwnershipAfterRestart(
  registryPath: string,
  attemptId: string,
  snapshot: readonly ProcessSnapshot[],
): { ownerId: string; ownershipGeneration: number; ownershipKey: string; root: ProcessTreeNode; children: ProcessTreeNode[] } | null {
  const records = readProcessTreeRecords(registryPath).filter((record) => record.attemptId === attemptId);
  const record = records.at(-1);
  if (!record || !treeMatchesSnapshot(record, snapshot)) return null;
  return {
    ownerId: record.ownerId,
    ownershipGeneration: record.ownershipGeneration,
    ownershipKey: record.ownershipKey,
    root: record.root,
    children: record.children,
  };
}

export function resolveKillTarget(
  registryPath: string,
  attemptId: string,
  snapshot: readonly ProcessSnapshot[],
): ProcessIdentity | null {
  const ownership = resolveOwnershipAfterRestart(registryPath, attemptId, snapshot);
  return ownership ? ownership.root.identity : null;
}

export function confirmProcessDeath(
  registryPath: string,
  attemptId: string,
  snapshot: readonly ProcessSnapshot[],
  targetPid: number,
): DeathConfirmation {
  const records = readProcessTreeRecords(registryPath).filter((record) => record.attemptId === attemptId);
  const record = records.at(-1);
  if (!record) return 'UNKNOWN';
  const nodes = [record.root, ...record.children];
  const target = nodes.find((node) => node.identity.pid === targetPid);
  if (!target) return 'UNKNOWN';
  const current = snapshotOf(snapshot, targetPid);
  if (current?.alive) return 'UNKNOWN';
  for (const node of nodes) {
    if (node.identity.pid === targetPid) continue;
    const process = snapshotOf(snapshot, node.identity.pid);
    if (!process || !process.alive || !sameIdentity(process, node.identity)) return 'UNKNOWN';
    if (node.parentPid === targetPid) continue;
    if (node.parentPid !== null) {
      const parent = snapshotOf(snapshot, node.parentPid);
      if (!parent || !parent.alive) return 'UNKNOWN';
    }
  }
  if (target.parentPid !== null) {
    const parent = snapshotOf(snapshot, target.parentPid);
    if (!parent || !parent.alive) return 'UNKNOWN';
  }
  return 'CONFIRMED';
}
