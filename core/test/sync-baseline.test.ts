// Kapalı-küme senkron testi: ordu-v3 sözleşmeleri baseline (Final) schema.json
// ile birebir aynı kind/type kümelerini taşımalı. Baseline'a yeni tür eklenip
// burada dal eklenmezse test PATLAR (fail-closed; qwen 09 "B kuralı" mirası).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { commandKinds } from '../src/contracts/command-payloads.ts';
import { eventTypes } from '../src/contracts/event-payloads.ts';
import { commandPayloadBranches } from '../src/contracts/command-payloads.ts';
import { eventPayloadBranches } from '../src/contracts/event-payloads.ts';
import { CommandSchema, EventSchema } from '../src/contracts/envelope.ts';

const here = dirname(fileURLToPath(import.meta.url));
const baselinePath = join(here, '..', '..', 'referans', 'kapsul-final-v2.0.0 notio', 'contracts', 'schema.json');
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));

test('Command.kind kümesi baseline ile birebir aynı', () => {
  const base: string[] = baseline.definitions.Command.properties.kind.enum;
  assert.deepEqual([...commandKinds].sort(), [...base].sort());
});

test('Event.type kümesi baseline ile birebir aynı', () => {
  const base: string[] = baseline.definitions.Event.properties.type.enum;
  assert.deepEqual([...eventTypes].sort(), [...base].sort());
});

test('Her kind/type için DAL var ve zorunlu alanı olan kapalı nesne', () => {
  for (const k of commandKinds) {
    const b: any = commandPayloadBranches[k];
    assert.ok(b, `dal yok: ${k}`);
    assert.ok(Array.isArray(b.required) && b.required.length >= 1, `${k} dalının required alanı yok (boşa izin!)`);
    assert.equal(b.additionalProperties, false, `${k} dalı ek alan açık bırakmış`);
  }
  for (const t of eventTypes) {
    const b: any = eventPayloadBranches[t];
    assert.ok(b, `dal yok: ${t}`);
    assert.ok(Array.isArray(b.required) && b.required.length >= 1, `${t} dalının required alanı yok`);
    assert.equal(b.additionalProperties, false, `${t} dalı ek alan açık bırakmış`);
  }
});

test('Zarif alan adları baseline ile aynı (Command)', () => {
  const base = Object.keys(baseline.definitions.Command.properties).sort();
  const ours = Object.keys(CommandSchema.properties as object).sort();
  assert.deepEqual(ours, base);
});

test('Zarif alan adları baseline ile aynı (Event)', () => {
  const base = Object.keys(baseline.definitions.Event.properties).sort();
  const ours = Object.keys(EventSchema.properties as object).sort();
  assert.deepEqual(ours, base);
});
