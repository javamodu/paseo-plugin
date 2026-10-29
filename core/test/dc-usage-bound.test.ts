import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUsageBoundFixture, USAGE_BOUND_MECHANISM } from './fixtures/dc-usage-bound-fixture.mjs';

test('DC-S0b-03: independent usage bound blocks new effects and keeps G0 fail-closed', () => {
  const fixture = createUsageBoundFixture({ limit: 100, measured: 0, usageUnknown: false });
  try {
    assert.equal(fixture.mechanism, USAGE_BOUND_MECHANISM);
    assert.deepEqual(fixture.requestEffect(10), { allowed: true, reason: 'OK', g0Open: false });

    fixture.setUsage({ limit: 100, measured: 90, usageUnknown: false });
    const exceeded = fixture.requestEffect(11);
    assert.equal(exceeded.allowed, false, 'limit overflow unexpectedly allowed');
    assert.equal(exceeded.reason, 'LIMIT_EXCEEDED');

    fixture.setUsage({ limit: 100, measured: 0, usageUnknown: true });
    const unknown = fixture.requestEffect(1);
    assert.equal(unknown.allowed, false, 'unknown usage was treated as zero');
    assert.equal(unknown.reason, 'USAGE_UNKNOWN');
    assert.equal(unknown.g0Open, true, 'unknown usage did not keep G0 open');

    fixture.removeUsageSource();
    const missing = fixture.requestEffect(1);
    assert.equal(missing.allowed, false, 'missing usage source unexpectedly allowed');
    assert.equal(missing.reason, 'USAGE_SOURCE_MISSING');
    assert.equal(missing.g0Open, true, 'missing source did not keep G0 open');
  } finally {
    fixture.cleanup();
  }
});
