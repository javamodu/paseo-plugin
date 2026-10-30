import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { VARSAYILAN_AYAR, aktifWorkerSay, orduDongu, spawnDogrula, MANAGER_BRIEF } from '../server/ordu';
import { derle, izinliDizinleriOku, planMdYaz, repolariBul, emirlerOku } from '../server/planmd';

const jsonYaz = (path: string, value: unknown) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
const metinYaz = (path: string, value: string) => writeFileSync(path, value, 'utf8');

function repoKur(root: string, ad: string, izinli: string[] | null) {
  const repo = join(root, ad);
  mkdirSync(join(repo, '.verimlilik'), { recursive: true });
  if (izinli !== null) jsonYaz(join(repo, '.verimlilik', 'izinler.json'), { dizin: { izinli } });
  return repo;
}

function izinliIcinde(cwd: string, izinli: string[] | null) {
  if (izinli === null) return false;
  return izinli.some((d) => cwd === d || cwd.startsWith(d.replace(/[\\/]$/, '') + sep));
}

function mockPaseo(repoYol: string) {
  const createCalls: unknown[] = [];
  const izinli = izinliDizinleriOku(repoYol);
  const paseo = {
    agents: {
      list: async () => ({ entries: [] }),
      create: async (request: { cwd: string }) => {
        if (!izinliIcinde(request.cwd, izinli)) throw new Error('pilot izin alani disinda: ' + request.cwd);
        createCalls.push(request);
        return { id: 'agent-' + createCalls.length };
      },
      ref: (id: string) => ({ send: async () => undefined }),
    },
  };
  return { createCalls, paseo };
}

async function emirGonder(repoYol: string, emir: string) {
  const { createCalls, paseo } = mockPaseo(repoYol);
  const mevcut = await aktifWorkerSay(paseo as never, repoYol);
  if (mevcut.managerId === null) {
    const izinli = izinliDizinleriOku(repoYol);
    if (!izinliIcinde(repoYol, izinli)) return { ok: false, managerId: null, createCalls };
    const handle = await paseo.agents.create({
      config: { provider: VARSAYILAN_AYAR.managerProvider },
      cwd: repoYol,
      title: 'ordu manager',
      prompt: MANAGER_BRIEF,
      labels: { ordu: 'manager' },
    } as Parameters<typeof paseo.agents.create>[0]);
    return { ok: true, managerId: (handle as { id: string }).id, createCalls };
  }
  return { ok: true, managerId: mevcut.managerId, createCalls };
}

test('P1: pilot disi proje davranisi korunur ve izinli tek yol calisir', () => {
  const root = mkdtempSync(join(tmpdir(), 'ordu-s1-04-'));
  const pilot = repoKur(root, 'pilot', [join(root, 'pilot')]);
  const other = repoKur(root, 'other', [join(root, 'other')]);
  try {
    const repolar = repolariBul([root]);
    assert.deepEqual(repolar.map((r) => r.ad).sort(), ['other', 'pilot']);
    const md = '- [ ] S1-04 Diger proje · kabul: test gecer · dizin: ' + other;
    planMdYaz(other, md);
    const sonuc = derle(md, izinliDizinleriOku(other));
    assert.equal(sonuc.ok, true);
    assert.equal(sonuc.hatalar.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('N1: pilot dosya-kuyrugu yetkisiz create uretmez', async () => {
  const root = mkdtempSync(join(tmpdir(), 'ordu-s1-04-queue-'));
  const pilot = repoKur(root, 'pilot', [join(root, 'pilot')]);
  const other = repoKur(root, 'other', [join(root, 'other')]);
  try {
    const kayit = {
      id: 'sp-1',
      ts: new Date().toISOString(),
      tip: 'spawn' as const,
      provider: 'codex/gpt-5.4',
      rol: 'coder',
      gorev: 'S1-04',
      cwd: other,
      prompt: 'yetkisiz',
    };
    metinYaz(join(pilot, '.verimlilik', 'spawn-kuyruk.jsonl'), JSON.stringify(kayit) + '\n');
    assert.equal(spawnDogrula(kayit, { coder: 0, tester: 0, toplam: 0 }, VARSAYILAN_AYAR.sinirlar), null);
    const { createCalls, paseo } = mockPaseo(pilot);
    const islenen = await orduDongu(paseo as never, pilot, 'pilot');
    assert.equal(islenen, 1);
    assert.equal(createCalls.length, 0);
    const sonuc = readFileSync(join(pilot, '.verimlilik', 'spawn-sonuc.jsonl'), 'utf8');
    assert.match(sonuc, /pilot izin alani disinda/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('N1: pilot manager/emir yolu yetkisiz create uretmez', async () => {
  const root = mkdtempSync(join(tmpdir(), 'ordu-s1-04-manager-'));
  const pilot = repoKur(root, 'pilot', null);
  const other = repoKur(root, 'other', [join(root, 'other')]);
  try {
    const red = await emirGonder(pilot, 'yetkisiz emir');
    assert.equal(red.ok, false);
    assert.equal(red.managerId, null);
    assert.equal(red.createCalls.length, 0);
    const izinli = await emirGonder(other, 'izinli emir');
    assert.equal(izinli.ok, true);
    assert.equal(izinli.createCalls.length, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('N1: bayat kart yetkisiz dizin acmaz', () => {
  const root = mkdtempSync(join(tmpdir(), 'ordu-s1-04-stale-'));
  const pilot = repoKur(root, 'pilot', [join(root, 'pilot')]);
  const other = repoKur(root, 'other', [join(root, 'other')]);
  try {
    const md = '- [ ] S1-04 Bayat kart · kabul: test gecer · dizin: ' + other;
    planMdYaz(pilot, md);
    const sonuc = derle(md, izinliDizinleriOku(pilot));
    assert.equal(sonuc.ok, false);
    assert.ok(sonuc.hatalar.some((h) => h.includes('dizin izin listesinde yok')));
    const emirler = {
      schemaSurum: 1,
      repo: 'pilot',
      kaynakMdHash: 'stale',
      guncelleme: new Date().toISOString(),
      gorevler: [{
        id: 'S1-04',
        baslik: 'Bayat kart',
        durum: 'bekliyor',
        rol: 'coder',
        kabul: 'test gecer',
        once: [] as string[],
        dizin: other,
        mddeYok: true,
      }],
    };
    jsonYaz(join(pilot, '.verimlilik', 'emirler.json'), emirler);
    assert.equal(emirlerOku(pilot)?.gorevler[0].mddeYok, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('N2: izin alani eksikse default kapalidir ve plugin reload yok', () => {
  const root = mkdtempSync(join(tmpdir(), 'ordu-s1-04-default-'));
  const pilot = repoKur(root, 'pilot', null);
  try {
    assert.equal(izinliDizinleriOku(pilot), null);
    assert.equal(izinliIcinde(pilot, null), false);
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    assert.equal('reload' in packageJson.scripts, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
