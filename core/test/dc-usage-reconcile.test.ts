import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  USAGE_RECONCILE_VERSION,
  normalizeExpectedUsages,
  normalizeUsageReports,
  reconcileUsage,
} from '../src/dc-usage-reconcile.ts';

const cutoff = '2026-10-30T07:00:00.000Z';

const reportFixture = (reportId: string, attemptId: string, subProcessId: string | null, kind: 'SUCCESS' | 'FAILURE' | 'CANCEL' | 'TEST' | 'REPAIR', tokens: number, reportedAt = '2026-10-30T06:00:00.000Z') => ({
  reportId,
  attemptId,
  subProcessId,
  kind,
  tokens,
  reportedAt,
  source: 'fixture',
});

const expectedFixture = (attemptId: string, subProcessId: string | null) => ({ attemptId, subProcessId });

test('P1: deneme ve alt surec tuketimi tek kez kapanir', () => {
  const reports = [
    reportFixture('r-1', 'att-usage', null, 'SUCCESS', 120),
    reportFixture('r-2', 'att-usage', 'sub-1', 'TEST', 40),
    reportFixture('r-3', 'att-usage', 'sub-2', 'REPAIR', 20),
  ];
  const expected = [
    expectedFixture('att-usage', null),
    expectedFixture('att-usage', 'sub-1'),
    expectedFixture('att-usage', 'sub-2'),
  ];
  const input = { reports, expected, cutoff, independentLimit: true };
  const first = reconcileUsage(input);
  const second = reconcileUsage(input);
  assert.deepEqual(first, second);
  assert.deepEqual(first.map((result) => result.outcome), ['SETTLED', 'SETTLED', 'SETTLED']);
  assert.deepEqual(first.map((result) => result.tokens), [120, 40, 20]);
  assert.ok(first.every((result) => result.effectOpened === false));
  assert.equal(USAGE_RECONCILE_VERSION, 'dc-usage-reconcile-v1');
});

test('N1: eksik, cift ve gec rapor sessiz sifir veya cift harcama uretmez', () => {
  const reports = [
    reportFixture('r-1', 'att-missing', null, 'SUCCESS', 100),
    reportFixture('r-2', 'att-duplicate', null, 'SUCCESS', 80),
    reportFixture('r-3', 'att-duplicate', null, 'SUCCESS', 80),
    reportFixture('r-4', 'att-late', null, 'SUCCESS', 60, '2026-10-30T08:00:00.000Z'),
  ];
  const expected = [
    expectedFixture('att-missing', null),
    expectedFixture('att-duplicate', null),
    expectedFixture('att-late', null),
    expectedFixture('att-none', null),
  ];
  const results = reconcileUsage({ reports, expected, cutoff, independentLimit: true });
  assert.deepEqual(results.map((result) => result.outcome), ['SETTLED', 'DUPLICATE', 'LATE', 'MISSING']);
  assert.equal(results[1].tokens, 80);
  assert.equal(results[2].tokens, 60);
  assert.equal(results[3].tokens, 0);
  assert.ok(results.every((result) => result.effectOpened === false));
});

test('N2: bagimsiz limit yokken yeni etki acilmaz', () => {
  const reports = [reportFixture('r-1', 'att-no-limit', null, 'SUCCESS', 90)];
  const expected = [expectedFixture('att-no-limit', null)];
  const result = reconcileUsage({ reports, expected, cutoff, independentLimit: false });
  assert.equal(result[0].outcome, 'NO_LIMIT');
  assert.equal(result[0].tokens, 90);
  assert.equal(result[0].effectOpened, false);
});

test('normalizasyon: rapor ve beklenen kullanimlar sert sekle girer', () => {
  const reports = normalizeUsageReports([reportFixture('r-1', 'att-normal', null, 'CANCEL', 30)]);
  const expected = normalizeExpectedUsages([expectedFixture('att-normal', null)]);
  assert.equal(reports.length, 1);
  assert.equal(expected.length, 1);
  assert.equal(reports[0].kind, 'CANCEL');
  assert.equal(expected[0].subProcessId, null);
});
