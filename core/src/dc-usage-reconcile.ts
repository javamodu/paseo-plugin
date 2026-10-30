export const USAGE_RECONCILE_VERSION = 'dc-usage-reconcile-v1';

export const USAGE_KINDS = ['SUCCESS', 'FAILURE', 'CANCEL', 'TEST', 'REPAIR'] as const;
export type UsageKind = (typeof USAGE_KINDS)[number];

export interface UsageReport {
  reportId: string;
  attemptId: string;
  subProcessId: string | null;
  kind: UsageKind;
  tokens: number;
  reportedAt: string;
  source: string;
}

export interface ExpectedUsage {
  attemptId: string;
  subProcessId: string | null;
}

export type UsageOutcome = 'SETTLED' | 'MISSING' | 'DUPLICATE' | 'LATE' | 'NO_LIMIT';

export interface UsageReconciliation {
  attemptId: string;
  subProcessId: string | null;
  outcome: UsageOutcome;
  tokens: number;
  effectOpened: false;
  kind: UsageKind | null;
  source: string | null;
}

export class UsageReconcileError extends Error {}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const requireObject = (value: unknown, field: string): Record<string, unknown> => {
  if (!isObject(value)) throw new UsageReconcileError(field + ' object olmali');
  return value;
};

const requireExactKeys = (value: Record<string, unknown>, keys: readonly string[], field: string): void => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new UsageReconcileError(field + ' alan kumesi kapali degil');
  }
};

const requireString = (value: unknown, field: string, maxLength = 4096): string => {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    throw new UsageReconcileError(field + ' gecersiz string');
  }
  return value;
};

const requirePositiveInteger = (value: unknown, field: string): number => {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new UsageReconcileError(field + ' negatif olmayan tam sayi olmali');
  }
  return value as number;
};

const requireIsoDate = (value: unknown, field: string): string => {
  const text = requireString(value, field, 64);
  if (Number.isNaN(Date.parse(text))) throw new UsageReconcileError(field + ' ISO-8601 tarih olmali');
  return text;
};

const requireUsageKind = (value: unknown): UsageKind => {
  const kind = requireString(value, 'kind', 32) as UsageKind;
  if (!USAGE_KINDS.includes(kind)) throw new UsageReconcileError('kind kapali kumede degil');
  return kind;
};

const normalizeReport = (value: unknown): UsageReport => {
  const report = requireObject(value, 'usage report');
  requireExactKeys(report, ['reportId', 'attemptId', 'subProcessId', 'kind', 'tokens', 'reportedAt', 'source'], 'usage report');
  return {
    reportId: requireString(report.reportId, 'reportId', 128),
    attemptId: requireString(report.attemptId, 'attemptId', 128),
    subProcessId: report.subProcessId === null ? null : requireString(report.subProcessId, 'subProcessId', 128),
    kind: requireUsageKind(report.kind),
    tokens: requirePositiveInteger(report.tokens, 'tokens'),
    reportedAt: requireIsoDate(report.reportedAt, 'reportedAt'),
    source: requireString(report.source, 'source', 128),
  };
};

const normalizeExpected = (value: unknown): ExpectedUsage => {
  const expected = requireObject(value, 'expected usage');
  requireExactKeys(expected, ['attemptId', 'subProcessId'], 'expected usage');
  return {
    attemptId: requireString(expected.attemptId, 'attemptId', 128),
    subProcessId: expected.subProcessId === null ? null : requireString(expected.subProcessId, 'subProcessId', 128),
  };
};

export function normalizeUsageReports(values: readonly unknown[]): UsageReport[] {
  if (!Array.isArray(values)) throw new UsageReconcileError('reports dizi olmali');
  return values.map(normalizeReport);
}

export function normalizeExpectedUsages(values: readonly unknown[]): ExpectedUsage[] {
  if (!Array.isArray(values)) throw new UsageReconcileError('expected usages dizi olmali');
  return values.map(normalizeExpected);
}

const expectedKey = (value: ExpectedUsage): string => value.attemptId + ':' + (value.subProcessId ?? 'attempt');

export function reconcileUsage(input: {
  reports: readonly unknown[];
  expected: readonly unknown[];
  cutoff: string;
  independentLimit: boolean;
}): UsageReconciliation[] {
  const record = requireObject(input, 'usage reconcile input');
  requireExactKeys(record, ['reports', 'expected', 'cutoff', 'independentLimit'], 'usage reconcile input');
  const reports = normalizeUsageReports(record.reports);
  const expected = normalizeExpectedUsages(record.expected);
  const cutoff = requireIsoDate(record.cutoff, 'cutoff');
  if (typeof record.independentLimit !== 'boolean') {
    throw new UsageReconcileError('independentLimit boolean olmali');
  }
  const byExpectedKey = new Map<string, UsageReport[]>();
  for (const report of reports) {
    const key = report.attemptId + ':' + (report.subProcessId ?? 'attempt');
    const list = byExpectedKey.get(key) ?? [];
    list.push(report);
    byExpectedKey.set(key, list);
  }
  return expected.map((item) => {
    const key = expectedKey(item);
    const matches = byExpectedKey.get(key) ?? [];
    if (matches.length === 0) {
      return { attemptId: item.attemptId, subProcessId: item.subProcessId, outcome: 'MISSING', tokens: 0, effectOpened: false, kind: null, source: null };
    }
    if (matches.length > 1) {
      const first = matches[0];
      return { attemptId: item.attemptId, subProcessId: item.subProcessId, outcome: 'DUPLICATE', tokens: first.tokens, effectOpened: false, kind: first.kind, source: first.source };
    }
    const report = matches[0];
    if (Date.parse(report.reportedAt) > Date.parse(cutoff)) {
      return { attemptId: item.attemptId, subProcessId: item.subProcessId, outcome: 'LATE', tokens: report.tokens, effectOpened: false, kind: report.kind, source: report.source };
    }
    if (!record.independentLimit) {
      return { attemptId: item.attemptId, subProcessId: item.subProcessId, outcome: 'NO_LIMIT', tokens: report.tokens, effectOpened: false, kind: report.kind, source: report.source };
    }
    return { attemptId: item.attemptId, subProcessId: item.subProcessId, outcome: 'SETTLED', tokens: report.tokens, effectOpened: false, kind: report.kind, source: report.source };
  });
}
