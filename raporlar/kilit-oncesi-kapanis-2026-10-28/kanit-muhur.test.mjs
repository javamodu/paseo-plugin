import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { verifyEntries } from './kanit-muhur.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'ordu-document-evidence-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const body = 'yalnız sentetik belge kanıtı\n';
  writeFileSync(join(root, 'evidence.txt'), body);
  return { root, entry: { path: 'evidence.txt', bytes: Buffer.byteLength(body),
    sha256: createHash('sha256').update(body).digest('hex') } };
}

test('hash ve byte kimliği eş olan mevcut kanıt doğrulanır', (t) => {
  const { root, entry } = fixture(t);
  assert.equal(verifyEntries([entry], root), 1);
});
test('kanıt değişirse eski hash kabul edilmez', (t) => {
  const { root, entry } = fixture(t);
  writeFileSync(join(root, entry.path), 'değişmiş kanıt');
  assert.throws(() => verifyEntries([entry], root), /evidence-hash-or-bytes/);
});
test('byte sayısı değiştirilemez ve boş kanıt kabul edilmez', (t) => {
  const { root, entry } = fixture(t);
  assert.throws(() => verifyEntries([{ ...entry, bytes: entry.bytes + 1 }], root), /evidence-hash-or-bytes/);
  writeFileSync(join(root, entry.path), '');
  assert.throws(() => verifyEntries([{ ...entry, bytes: 0 }], root), /evidence-hash-or-bytes/);
});
test('yinelenen yol ve manifestin kendisine bağlanması reddedilir', (t) => {
  const { root, entry } = fixture(t);
  assert.throws(() => verifyEntries([entry, entry], root), /duplicate-or-self-reference/);
  assert.throws(() => verifyEntries([entry], root, [entry.path]), /duplicate-or-self-reference/);
});
test('kök dışına çıkış ve mutlak yol reddedilir', (t) => {
  const { root, entry } = fixture(t);
  for (const path of ['../evidence.txt', '/evidence.txt', 'folder/../evidence.txt', 'folder\\evidence.txt']) {
    assert.throws(() => verifyEntries([{ ...entry, path }], root), /unsafe-evidence-path/);
  }
});
test('olmayan dosya, boş veya bozuk manifest yeşil üretemez', (t) => {
  const { root, entry } = fixture(t);
  assert.throws(() => verifyEntries([{ ...entry, path: 'missing.txt' }], root));
  assert.throws(() => verifyEntries([], root), /empty-or-invalid-manifest/);
  assert.throws(() => verifyEntries(null, root), /empty-or-invalid-manifest/);
});
