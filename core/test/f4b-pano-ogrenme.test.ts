// F4-B devami — pano Ogrenme+Bildirim gorunurlugu (plan 3. bolum).
// /api/status yanitina eklenen lessons/notifications alanlari dbPath'in yanindaki
// lessons.jsonl ve notify.jsonl'den okunur; dosyalar yoksa bos deger doner
// (fail-closed DEGIL, bos gorunum). Append-only defterde ayni id icin SON satir kazanir.
// Hermetik: Paseo importu/processi YOK, dis API YOK.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, setGlobalStop } from '../src/store.ts';
import { createPanoServer } from '../src/pano-server.ts';

const TOKEN = 't123';

function lessonEvent(id: string, state: string, updatedAt: string) {
  return {
    event: 'test',
    at: updatedAt,
    lesson: {
      id,
      kind: 'VERI',
      source: 'human',
      text: 'deneme dersi',
      evidenceRef: 'kanit-1',
      scope: { repoId: 'r', suiteId: 's', surum: '1' },
      expiresAt: '2027-01-01T00:00:00.000Z',
      state,
      scorecard: null,
      approvals: [],
      canary: null,
      createdAt: updatedAt,
      updatedAt,
    },
  };
}

function notifyEvent(id: string, severity: string, status: string, title: string, updatedAt: string) {
  return {
    event: 'test',
    at: updatedAt,
    record: {
      id,
      dedupeKey: 'dk-' + id,
      contentHash: 'h',
      severity,
      title,
      body: 'govde',
      status,
      attempts: 0,
      createdAt: updatedAt,
      updatedAt,
    },
  };
}

function tempDb(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  const dbPath = join(dir, 'ordu.sqlite');
  const db = openStore(dbPath);
  setGlobalStop(db, false, 'test', 'kurulum');
  db.close();
  return { dir, dbPath };
}

async function startPano(dbPath: string) {
  const { server, port } = await createPanoServer({ dbPath, port: 0, authToken: TOKEN });
  return { base: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) };
}

async function getStatus(base: string): Promise<any> {
  const r = await fetch(base + '/api/status', { headers: { 'x-pano-token': TOKEN } });
  assert.equal(r.status, 200);
  return r.json();
}

test('F4-ogrenme pozitif: lessons/notify jsonl dolu — alanlar ve sayimlar dogru, son event kazanir', async () => {
  const { dir, dbPath } = tempDb('ordu-f4og-');
  const lessons = [
    lessonEvent('d-1', 'PROPOSED', '2026-10-01T00:00:00.000Z'),
    lessonEvent('d-2', 'VALIDATING', '2026-10-02T00:00:00.000Z'),
    lessonEvent('d-2', 'PUBLISHED', '2026-10-03T00:00:00.000Z'), // ayni id: son satir kazanir
    lessonEvent('d-3', 'REVOKED', '2026-10-04T00:00:00.000Z'),
  ];
  writeFileSync(join(dir, 'lessons.jsonl'), lessons.map((e) => JSON.stringify(e)).join('\n') + '\n');
  const bildirimler = [
    notifyEvent('b-1', 'INFO', 'pending', 'ilk bildirim', '2026-10-01T00:00:00.000Z'),
    notifyEvent('b-2', 'WARN', 'deferred', 'sessiz saat', '2026-10-02T00:00:00.000Z'),
    notifyEvent('b-3', 'CRITICAL', 'dead', 'gonderim hatasi', '2026-10-03T00:00:00.000Z'),
  ];
  writeFileSync(join(dir, 'notify.jsonl'), bildirimler.map((e) => JSON.stringify(e)).join('\n') + '\n');

  const p = await startPano(dbPath);
  try {
    const j = await getStatus(p.base);
    // mevcut alanlar bozulmamis (F4 sozlesmesi)
    assert.equal(j.globalStop, false);
    assert.ok(Array.isArray(j.runs), 'runs alani korunur');
    assert.ok('pendingDecisions' in j && 'unknownCount' in j && 'metrics' in j && 'lastEvents' in j);

    assert.deepEqual(
      { toplam: j.lessons.toplam, published: j.lessons.published, karantina: j.lessons.karantina },
      { toplam: 3, published: 1, karantina: 1 },
      'lessons sayimlari (d-2 son durumu PUBLISHED sayilir)',
    );
    assert.equal(j.lessons.sonDersler.length, 3);
    assert.equal(j.lessons.sonDersler[0].id, 'd-3', 'en guncel ders basta');
    const d2 = j.lessons.sonDersler.find((d: any) => d.id === 'd-2');
    assert.deepEqual(
      { kind: d2.kind, state: d2.state, expiry: d2.expiry },
      { kind: 'VERI', state: 'PUBLISHED', expiry: '2027-01-01T00:00:00.000Z' },
      'sonDersler ogesi id/kind/state/expiry tasir',
    );

    assert.deepEqual(
      { bekleyen: j.notifications.bekleyen, deferred: j.notifications.deferred, dead: j.notifications.dead },
      { bekleyen: 1, deferred: 1, dead: 1 },
      'notifications sayimlari',
    );
    assert.equal(j.notifications.sonBildirimler.length, 3);
    const b3 = j.notifications.sonBildirimler[0];
    assert.deepEqual(
      { severity: b3.severity, redakteMetin: b3.redakteMetin, state: b3.state },
      { severity: 'CRITICAL', redakteMetin: 'gonderim hatasi', state: 'dead' },
      'sonBildirimler severity/redakteMetin/state tasir, en yeni basta',
    );
  } finally {
    await p.close();
  }
});

test('F4-ogrenme negatif: jsonl dosyalari yok — 200 + bos degerler (fail-closed DEGIL)', async () => {
  const { dbPath } = tempDb('ordu-f4og-bos-');
  const p = await startPano(dbPath);
  try {
    const j = await getStatus(p.base);
    assert.deepEqual(j.lessons, { toplam: 0, published: 0, karantina: 0, sonDersler: [] });
    assert.deepEqual(j.notifications, { bekleyen: 0, deferred: 0, dead: 0, sonBildirimler: [] });
    assert.ok(Array.isArray(j.runs), 'mevcut alanlar korunur');
  } finally {
    await p.close();
  }
});

test('F4-ogrenme bozuk satir: gecersiz jsonl satiri atlanir, pano ayakta kalir', async () => {
  const { dir, dbPath } = tempDb('ordu-f4og-bozuk-');
  writeFileSync(
    join(dir, 'lessons.jsonl'),
    JSON.stringify(lessonEvent('d-1', 'PUBLISHED', '2026-10-01T00:00:00.000Z')) + '\n{bozuk json\n',
  );
  writeFileSync(join(dir, 'notify.jsonl'), '{bozuk\n');

  const p = await startPano(dbPath);
  try {
    const j = await getStatus(p.base);
    assert.equal(j.lessons.toplam, 1);
    assert.equal(j.lessons.published, 1);
    assert.deepEqual(j.notifications, { bekleyen: 0, deferred: 0, dead: 0, sonBildirimler: [] });
  } finally {
    await p.close();
  }
});