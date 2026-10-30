import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHumanAuthorityGate, faultFamilies, humanAuthorityActions } from './fixtures/dc-h1-faults.mjs';

for (const fault of faultFamilies) {
  test(`P1: ${fault.id} hata ailesi yakalanır`, () => {
    const state = fault.inject();
    assert.equal(fault.detect(state), true);
  });
}

test('P1: on hata ailesi tam sayıda ve benzersizdir', () => {
  assert.equal(faultFamilies.length, 10);
  assert.equal(new Set(faultFamilies.map((fault) => fault.id)).size, 10);
});

test('N2: H1 kararı, H2 başlatması, merge ve deploy ajan denemesinde RED döner', () => {
  const gate = createHumanAuthorityGate();
  for (const action of humanAuthorityActions) {
    const result = gate.request({ actor: 'agent', action });
    assert.equal(result.allowed, false);
    assert.equal(result.status, 'RED');
    assert.equal(result.receipt, null);
    assert.equal(gate.decisions.length, 0);
  }
});
