import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfgPath = process.env.PASEO_CONFIG ?? join(homedir(), '.paseo', 'config.json');

const argv = process.argv.slice(2);
const flag = (ad, varsayilan) => {
  const hit = argv.find((a) => a === `--${ad}` || a.startsWith(`--${ad}=`));
  if (!hit) return varsayilan;
  const eq = hit.indexOf('=');
  return eq === -1 ? true : hit.slice(eq + 1);
};

const TEK_PROVIDER = flag('provider', null);
const MODEL_FILTRE = flag('model', null) ? new RegExp(String(flag('model', null)), 'i') : null;
const TUM_MODELLER = argv.includes('--all');
const RUNS = Math.max(1, Number(flag('runs', 1)) || 1);
const MAX_TOKENS = Math.max(16, Number(flag('max-tokens', 256)) || 256);
const PROMPT = String(flag('prompt', "1'den 30'a kadar sayilari virgulle yaz."));
const BOSLUK_MS = Math.max(0, Number(flag('gap', 250)) || 0);
const CIKTI_YOLU = String(flag('out', join(root, 'evidence', 'provider-bench-latest.json')));
const HTML_YOLU = String(flag('html', join(dirname(CIKTI_YOLU), 'provider-bench-latest.html')));
const KATALOG_HTML_YOLU = String(flag('katalog-html', join(dirname(CIKTI_YOLU), 'provider-katalog.html')));
const KATALOG_HTML = argv.includes('--katalog') || KATALOG_HTML_YOLU !== 'none';
const KATALOG_ONLY = argv.includes('--katalog-only');
const DUMP_YOLU = flag('dump', null) ? String(flag('dump', null)) : null;
const AKIS = flag('no-stream', false) !== true;

const kes = (s, n = 110) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').slice(0, n) : '');
const ucl = (u) => String(u ?? '').replace(/\/+$/, '');
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

const MIN_URETIM_MS = 100;
const MIN_PARCA = 2;
const KATALOG_MS = 45000;
const TUR_MS = 120000;

function zamanlayici(ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(new Error('zaman asimi')), ms);
  if (typeof t.unref === 'function') t.unref();
  return { signal: ctrl.signal, bitti: () => clearTimeout(t) };
}

function hataKodu(govde) {
  if (typeof govde !== 'string') return null;
  const kod = govde.match(/"(?:error_)?code"\s*:\s*"([a-z0-9_]+)"/i);
  if (kod && !['error', 'invalid_request_error'].includes(kod[1].toLowerCase())) return kod[1];
  const tur = govde.match(/"type"\s*:\s*"([a-z0-9_]+)"/i);
  if (tur && !['error'].includes(tur[1].toLowerCase())) return tur[1];
  return null;
}

function hataMesaji(govde) {
  if (typeof govde !== 'string') return null;
  const m = govde.match(/"message"\s*:\s*"([^"]{3,200})"/i);
  return m ? m[1] : null;
}

function limitBasliklari(headers) {
  const cikti = {};
  try {
    for (const [k, v] of headers) {
      if (/retry|ratelimit|rate-limit|remaining|billing|quota|x-.*limit/i.test(k)) cikti[k] = v;
    }
  } catch {
    return {};
  }
  return cikti;
}

const kataloglar = new Map();

const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const tumProviderlar = cfg?.agents?.providers ?? {};
const providerlar = Object.entries(tumProviderlar)
  .filter(([, p]) => p?.env?.OPENAI_BASE_URL && p?.env?.OPENAI_API_KEY)
  .filter(([id]) => !TEK_PROVIDER || TEK_PROVIDER === id)
  .map(([id, p]) => ({ id, base: ucl(p.env.OPENAI_BASE_URL), key: p.env.OPENAI_API_KEY }));

async function katalogCek(p) {
  const t0 = performance.now();
  const z = zamanlayici(KATALOG_MS);
  try {
    const r = await fetch(`${p.base}/models`, {
      headers: { Authorization: `Bearer ${p.key}` },
      signal: z.signal,
    });
    const ms = performance.now() - t0;
    const govde = await r.text();
    if (!r.ok) {
      return { http: r.status, ms, ids: [], limit: limitBasliklari(r.headers), hata: { kod: hataKodu(govde), mesaj: hataMesaji(govde) ?? kes(govde) } };
    }
    let ids = [];
    try {
      ids = (JSON.parse(govde).data ?? []).map((d) => d.id).filter(Boolean);
    } catch {
      ids = [];
    }
    return { http: r.status, ms, ids, limit: limitBasliklari(r.headers), hata: null };
  } catch (e) {
    return { http: 0, ms: performance.now() - t0, ids: [], limit: {}, hata: { kod: 'AG_YAKALANDI', mesaj: kes(String(e.message ?? e)) } };
  } finally {
    z.bitti();
  }
}

function tikTahmini(metin) {
  return Math.max(1, Math.round(metin.length / 4));
}

async function tekTur(p, model) {
  const govde = { model, messages: [{ role: 'user', content: PROMPT }], max_tokens: MAX_TOKENS, temperature: 0 };
  if (AKIS) {
    govde.stream = true;
    govde.stream_options = { include_usage: true };
  }
  const t0 = performance.now();
  const z = zamanlayici(TUR_MS);
  let r;
  try {
    r = await fetch(`${p.base}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${p.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(govde),
      signal: z.signal,
    });
  } catch (e) {
    z.bitti();
    return { ok: false, http: 0, hataKodu: 'AG_YAKALANDI', not: kes(String(e.message ?? e)) };
  }

  if (!r.ok) {
    const g = await r.text();
    z.bitti();
    return {
      ok: false,
      http: r.status,
      hataKodu: hataKodu(g) ?? `HTTP_${r.status}`,
      not: hataMesaji(g) ?? kes(g),
      limit: limitBasliklari(r.headers),
    };
  }

  if (!AKIS) {
    const toplam = performance.now() - t0;
    const g = await r.json();
    const icerik = g?.choices?.[0]?.message?.content ?? '';
    const ham = g?.usage?.completion_tokens ?? g?.usage?.output_tokens ?? null;
    z.bitti();
    return {
      ok: true,
      http: r.status,
      akis: false,
      ttftMs: null,
      toplamMs: toplam,
      outToken: ham ?? tikTahmini(icerik),
      tokenKaynagi: ham === null ? 'tahmin' : 'usage',
      tokSn: null,
      tokSnToplam: (ham ?? tikTahmini(icerik)) > 0 && toplam > 0 ? Number(((ham ?? tikTahmini(icerik)) / (toplam / 1000)).toFixed(2)) : null,
      olcumNotu: 'akis-kapali; yalniz toplam-sure bazli hiz olculur',
      limit: limitBasliklari(r.headers),
      cevap: kes(icerik, 60),
    };
  }

  const okuyucu = r.body.getReader();
  const coz = new TextDecoder();
  let tampon = '';
  let ttft = null;
  let icerik = '';
  let parca = 0;
  let usage = null;
  let okumaHatasi = null;
  try {
    while (true) {
      const { done, value } = await okuyucu.read();
      if (done) break;
      tampon += coz.decode(value, { stream: true });
      const satirlar = tampon.split('\n');
      tampon = satirlar.pop() ?? '';
      for (const satir of satirlar) {
        const t = satir.trim();
        if (!t.startsWith('data:')) continue;
        const yuke = t.slice(5).trim();
        if (!yuke || yuke === '[DONE]') continue;
        let j;
        try {
          j = JSON.parse(yuke);
        } catch {
          continue;
        }
        if (j?.usage) usage = j.usage;
        const delta = j?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta.length > 0) {
          if (ttft === null) ttft = performance.now() - t0;
          icerik += delta;
          parca += 1;
        }
      }
    }
  } catch (e) {
    okumaHatasi = kes(String(e.message ?? e));
  } finally {
    z.bitti();
  }

  const toplam = performance.now() - t0;
  const ham = usage?.completion_tokens ?? usage?.output_tokens ?? null;
  const outToken = ham ?? tikTahmini(icerik);
  const uretimMs = toplam - (ttft ?? 0);
  const olcumlenebilir = uretimMs >= MIN_URETIM_MS && parca >= MIN_PARCA && !okumaHatasi;
  const olcumNotu = okumaHatasi
    ? 'akis-yarida-koptu; tok/sn olculmedi'
    : !olcumlenebilir
      ? uretimMs < MIN_URETIM_MS
        ? 'tek-paket; yalniz toplam-sure bazli hiz olculur'
        : `delta-yetersiz (${parca}); yalniz toplam-sure bazli hiz olculur`
      : parca <= 4 && outToken > 32
        ? `paket-toplama (${parca} delta / ${outToken} tok): uretim penceresi ag-arasi teslimati olcer, cozumleme hizi degil`
        : 'delta paketleriyle uretim penceresi olculdu';
  const deltaSn = uretimMs > 0 && parca > 0 ? Number((parca / (uretimMs / 1000)).toFixed(2)) : null;
  return {
    ok: !okumaHatasi,
    http: r.status,
    akis: true,
    ttftMs: ttft === null ? null : Math.round(ttft),
    toplamMs: Math.round(toplam),
    uretimMs: Math.round(uretimMs),
    outToken,
    parca,
    tokenKaynagi: ham === null ? 'tahmin' : 'usage',
    tokSn: olcumlenebilir ? Number((outToken / (uretimMs / 1000)).toFixed(2)) : null,
    deltaSn,
    tokSnToplam: outToken > 0 && toplam > 0 ? Number((outToken / (toplam / 1000)).toFixed(2)) : null,
    olcumNotu,
    hataKodu: okumaHatasi ? 'AKIS_KOPTI' : null,
    not: okumaHatasi,
    limit: limitBasliklari(r.headers),
    cevap: kes(icerik, 60),
  };
}

async function modelOlc(p, model) {
  const turlar = [];
  for (let i = 0; i < RUNS; i += 1) {
    turlar.push(await tekTur(p, model));
    if (BOSLUK_MS > 0 && i < RUNS - 1) await bekle(BOSLUK_MS);
  }
  const basarili = turlar.filter((t) => t.ok);
  const basarisiz = turlar.filter((t) => !t.ok);
  const medyan = (dizi) => {
    if (dizi.length === 0) return null;
    const s = [...dizi].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  return {
    model,
    deneme: turlar.length,
    basarili: basarili.length,
    ttftMs: medyan(basarili.map((t) => t.ttftMs).filter((v) => v !== null)),
    toplamMs: medyan(basarili.map((t) => t.toplamMs)),
    tokSn: medyan(basarili.map((t) => t.tokSn).filter((v) => v !== null && v > 0)),
    tokSnToplam: medyan(basarili.map((t) => t.tokSnToplam).filter((v) => v !== null && v > 0)),
    outToken: basarili[0]?.outToken ?? null,
    tokenKaynagi: basarili[0]?.tokenKaynagi ?? null,
    parca: basarili[0]?.parca ?? null,
    deltaSn: basarili[0]?.deltaSn ?? null,
    tokenPerDelta: basarili[0]?.outToken && basarili[0]?.parca ? Number((basarili[0].outToken / basarili[0].parca).toFixed(1)) : null,
    http: turlar[0]?.http ?? 0,
    hataKodu: basarisiz[0]?.hataKodu ?? null,
    not: basarisiz[0]?.not ?? null,
    olcumNotu: basarili[0]?.olcumNotu ?? null,
    limit: { ...(basarili[0]?.limit ?? {}), ...(basarisiz[0]?.limit ?? {}) },
  };
}

const rapor = {
  sema: 'ordu-provider-bench/v1',
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  ayarlar: { kapsam: TUM_MODELLER ? 'tum-modeller' : 'free-modeller', runs: RUNS, maxTokens: MAX_TOKENS, akis: AKIS, prompt: PROMPT, config: cfgPath },
  providerlar: [],
  ozet: { toplamModel: 0, calisan: 0, hatali: 0 },
};

for (const p of providerlar) {
  const katalog = await katalogCek(p);
const katalogFree = katalog.ids.filter((m) => /free/i.test(m));
const configIds = new Set((tumProviderlar[p.id]?.models ?? []).map((m) => m.id));
let secilen;
let kapsam;
if (TUM_MODELLER) {
  secilen = katalog.ids;
  kapsam = 'tum-modeller';
} else if (katalogFree.length > 0) {
  secilen = katalogFree;
  kapsam = `free-modeller (${katalogFree.length}/${katalog.ids.length})`;
} else {
  secilen = katalog.ids.filter((m) => configIds.has(m));
  kapsam = `free-katmani-yok, config-listesi (${secilen.length}/${katalog.ids.length})`;
}
const kayit = {
    provider: p.id,
    kapsam,
    katalogHttp: katalog.http,
    katalogMs: Math.round(katalog.ms),
    katalogBoyut: katalog.ids.length,
    katalogHata: katalog.hata,
    katalogLimit: katalog.limit,
    secilenSayi: secilen.length,
    modeller: [],
  };
  kataloglar.set(p.id, katalog);
  console.log(`\n${p.id}  katalog HTTP ${katalog.http} / ${katalog.ids.length} model / ${secilen.length} hedef  [${kapsam}]`);
  if (katalog.hata) console.log(`  katalog hatasi: ${katalog.hata.kod ?? '?'} ${katalog.hata.mesaj}`);
  for (const model of KATALOG_ONLY ? [] : secilen.filter((m) => !MODEL_FILTRE || MODEL_FILTRE.test(m))) {
    const olcum = await modelOlc(p, model);
    kayit.modeller.push(olcum);
    rapor.ozet.toplamModel += 1;
    if (olcum.basarili > 0) rapor.ozet.calisan += 1;
    else rapor.ozet.hatali += 1;
    const durum = olcum.basarili > 0 ? 'OK  ' : 'HATA';
    const ttft = olcum.ttftMs === null ? '  -  ' : `${olcum.ttftMs}ms`;
    const tps = olcum.tokSn === null ? '  -  ' : olcum.tokSn.toFixed(2).padStart(5);
    const tpsT = olcum.tokSnToplam === null ? '  -  ' : olcum.tokSnToplam.toFixed(2).padStart(5);
    const tok = olcum.outToken === null ? '  -' : String(olcum.outToken).padStart(4);
    console.log(
      `  ${durum} ${model.padEnd(42).slice(0, 42)} http=${String(olcum.http).padStart(3)} ttft=${ttft} uretim/sn=${tps} toplam/sn=${tpsT} out=${tok}(${olcum.tokenKaynagi ?? '-'})${olcum.hataKodu ? `  [${olcum.hataKodu}] ${olcum.not ?? ''}` : ''}`,
    );
    if (Object.keys(olcum.limit).length > 0) console.log(`        limit: ${JSON.stringify(olcum.limit)}`);
    if (olcum.olcumNotu && !olcum.olcumNotu.startsWith('delta paketleriyle')) console.log(`        not  : ${olcum.olcumNotu}`);
    if (BOSLUK_MS > 0) await bekle(BOSLUK_MS);
  }
  rapor.providerlar.push(kayit);
}

const canonical = (v) =>
  v === null || typeof v !== 'object'
    ? JSON.stringify(v)
    : Array.isArray(v)
      ? `[${v.map(canonical).join(',')}]`
      : `{${Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',')}}`;
rapor.note =
  'tokSn yalniz uretim penceresi (toplamMs - ttftMs) uzerinden, en az 2 delta paketi ve 100ms usturum goruldugunde hesaplanir; aksi halde null. tokSnToplam her zaman outToken/toplamMs verir ve TTFT icerir (alt sinir). tokenKaynagi=usage sunucu sayimi, tahmin ise ~4 karakter/token kaba olcegi; ikisi de uctan uca dogrulanmis gecikme olcumu degildir. Hatali satirlar kota/402/403 kaynaklidir, model yetenegi degil.';
rapor.benchHash = createHash('sha256').update(canonical({ ...rapor, benchHash: undefined })).digest('hex');

const kacis = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const CSS_ORTAK = `
:root { color-scheme: light dark; --ok:#1a7f37; --hata:#b3261e; --sus:#9a6700; --kenar:#d0d7de; --yuzey:#ffffff; --yazi:#1f2328; }
@media (prefers-color-scheme: dark) { :root { --kenar:#30363d; --yuzey:#0d1117; --yazi:#e6edf3; --ok:#3fb950; --hata:#f85149; --sus:#d29922; } }
* { box-sizing: border-box; }
body { margin:0; padding:24px; background:var(--yuzey); color:var(--yazi); font:14px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace; }
h1 { font-size:18px; margin:0 0 4px; }
.meta { color:#6b7280; font-size:12px; margin-bottom:16px; word-break:break-all; }
.kartlar { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px; }
.kart { border:1px solid var(--kenar); border-radius:8px; padding:8px 14px; display:flex; flex-direction:column; }
.kart .e { font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; }
.kart .d { font-size:20px; }
.arac { display:flex; gap:10px; align-items:center; margin-bottom:12px; flex-wrap:wrap; }
input[type=search] { padding:7px 10px; border:1px solid var(--kenar); border-radius:6px; background:transparent; color:inherit; min-width:260px; font:inherit; }
.say { font-size:12px; color:#6b7280; }
.tablo { border:1px solid var(--kenar); border-radius:8px; overflow:auto; max-height:72vh; }
table { border-collapse:collapse; width:100%; }
th { position:sticky; top:0; background:var(--yuzey); border-bottom:2px solid var(--kenar); text-align:left; padding:9px 10px; cursor:pointer; white-space:nowrap; z-index:1; }
th:hover { background:#6b728018; }
th .ok { display:inline-block; width:10px; color:#6b7280; }
th.asc .ok::after { content:'▲'; }
th.desc .ok::after { content:'▼'; }
td { border-bottom:1px solid var(--kenar); padding:7px 10px; vertical-align:top; }
td.sayi { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
tr.ok td.durum { color:var(--ok); font-weight:700; }
tr.hata td.durum { color:var(--hata); font-weight:700; }
tr.hata td { color:#8b949e; }
tr.sus td.durum { color:var(--sus); font-weight:700; }
tr:hover td { background:#6b728012; }
.note { margin-top:14px; font-size:12px; color:#6b7280; max-width:110ch; }
`;

const JS_ORTAK = `
const tablo = document.getElementById('t');
const filtre = document.getElementById('filtre');
const sayac = document.getElementById('sayac');
let yon = {};
const hucre = (tr, k) => tr.querySelector('td[data-key="' + k + '"]');
function sirala(anahtar) {
  yon[anahtar] = yon[anahtar] === 'asc' ? 'desc' : 'asc';
  const sira = yon[anahtar];
  tablo.querySelectorAll('th').forEach((b) => b.classList.remove('asc', 'desc'));
  tablo.querySelector('th[data-key="' + anahtar + '"]').classList.add(sira);
  const govde = tablo.querySelector('tbody');
  const satirlar = Array.from(govde.querySelectorAll('tr'));
  const sayisal = tablo.querySelector('th[data-key="' + anahtar + '"]').dataset.t === 'sayi';
  satirlar.sort((a, b) => {
    const ca = hucre(a, anahtar);
    const cb = hucre(b, anahtar);
    if (sayisal) {
      const na = ca.dataset.v === '' ? null : parseFloat(ca.dataset.v);
      const nb = cb.dataset.v === '' ? null : parseFloat(cb.dataset.v);
      if (na === null && nb === null) return 0;
      if (na === null) return 1;
      if (nb === null) return -1;
      return sira === 'asc' ? na - nb : nb - na;
    }
    const s = ca.dataset.v.localeCompare(cb.dataset.v, 'tr');
    return sira === 'asc' ? s : -s;
  });
  satirlar.forEach((tr) => govde.appendChild(tr));
  say();
}
function uygula() {
  const q = filtre.value.trim().toLocaleLowerCase('tr');
  tablo.querySelectorAll('tbody tr').forEach((tr) => {
    tr.style.display = !q || tr.textContent.toLocaleLowerCase('tr').includes(q) ? '' : 'none';
  });
  say();
}
function say() {
  const gorunur = tablo.querySelectorAll('tbody tr:not([style*="display: none"])').length;
  sayac.textContent = gorunur + ' / ' + tablo.querySelectorAll('tbody tr').length + ' satır';
}
tablo.querySelectorAll('th').forEach((b) => b.addEventListener('click', () => sirala(b.dataset.key)));
filtre.addEventListener('input', uygula);
say();
`;

function htmlHucre(anahtar, tur, ham, gosterim, sinif = '') {
  const deger = ham === null || ham === undefined || ham === '' ? '' : String(ham);
  return `<td data-key="${anahtar}" data-t="${tur}" data-v="${kacis(deger)}" class="${tur}${sinif ? ' ' + sinif : ''}">${kacis(gosterim)}</td>`;
}

function htmlSayfa({ baslik, meta, kartlar, sutunlar, satirlar, not }) {
  const basliklar = sutunlar.map((s) => `<th data-key="${s.anahtar}" data-t="${s.tur}" scope="col">${kacis(s.etiket)}<span class="ok"></span></th>`).join('');
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${kacis(baslik)}</title>
<style>${CSS_ORTAK}</style>
</head>
<body>
<h1>${kacis(baslik)}</h1>
<div class="meta">${kacis(meta)}</div>
<div class="kartlar">${kartlar.map(([e, d]) => `<div class="kart"><span class="e">${kacis(e)}</span><span class="d">${kacis(d)}</span></div>`).join('')}</div>
<div class="arac">
  <input type="search" id="filtre" placeholder="filtre: model, provider, hata kodu…" autocomplete="off">
  <span class="say" id="sayac"></span>
</div>
<div class="tablo">
<table id="t">
<thead><tr>${basliklar}</tr></thead>
<tbody>
${satirlar.join('\n')}
</tbody>
</table>
</div>
<p class="note">${kacis(not ?? '')}</p>
<script>${JS_ORTAK}</script>
</body>
</html>
`;
}

const SUTUNLAR_KATALOG = [
  { anahtar: 'provider', etiket: 'Provider', tur: 'metin' },
  { anahtar: 'model', etiket: 'Model', tur: 'metin' },
  { anahtar: 'ucretsiz', etiket: 'Free', tur: 'metin' },
  { anahtar: 'kaynak', etiket: 'Liste kaynağı', tur: 'metin' },
  { anahtar: 'katalogHttp', etiket: 'Katalog HTTP', tur: 'sayi' },
  { anahtar: 'durum', etiket: 'Son ölçüm', tur: 'metin' },
  { anahtar: 'ttftMs', etiket: 'TTFT ms', tur: 'sayi' },
  { anahtar: 'tokSn', etiket: 'Üretim/sn', tur: 'sayi' },
  { anahtar: 'tokSnToplam', etiket: 'Toplam/sn', tur: 'sayi' },
  { anahtar: 'parca', etiket: 'Delta sayısı', tur: 'sayi' },
  { anahtar: 'tokenPerDelta', etiket: 'Token/delta', tur: 'sayi' },
  { anahtar: 'olcumZamani', etiket: 'Ölçüm zamanı', tur: 'metin' },
  { anahtar: 'hataKodu', etiket: 'Hata kodu', tur: 'metin' },
  { anahtar: 'not', etiket: 'Not', tur: 'metin' },
];

const SUTUNLAR = [
  { anahtar: 'provider', etiket: 'Provider', tur: 'metin' },
  { anahtar: 'model', etiket: 'Model', tur: 'metin' },
  { anahtar: 'durum', etiket: 'Durum', tur: 'metin' },
  { anahtar: 'deneme', etiket: 'Deneme', tur: 'sayi' },
  { anahtar: 'basarili', etiket: 'Başarılı', tur: 'sayi' },
  { anahtar: 'http', etiket: 'HTTP', tur: 'sayi' },
  { anahtar: 'ttftMs', etiket: 'TTFT ms', tur: 'sayi' },
  { anahtar: 'tokSn', etiket: 'Üretim/sn', tur: 'sayi' },
  { anahtar: 'tokSnToplam', etiket: 'Toplam/sn', tur: 'sayi' },
  { anahtar: 'parca', etiket: 'Delta sayısı', tur: 'sayi' },
  { anahtar: 'deltaSn', etiket: 'Delta/sn', tur: 'sayi' },
  { anahtar: 'tokenPerDelta', etiket: 'Token/delta', tur: 'sayi' },
  { anahtar: 'outToken', etiket: 'Çıktı tok', tur: 'sayi' },
  { anahtar: 'tokenKaynagi', etiket: 'Token kaynağı', tur: 'metin' },
  { anahtar: 'hataKodu', etiket: 'Hata kodu', tur: 'metin' },
  { anahtar: 'not', etiket: 'Not / limit', tur: 'metin' },
];

function htmlSatir(kayit, o) {
  const h = htmlHucre;
  const limitMetni = Object.keys(o.limit ?? {}).length > 0 ? JSON.stringify(o.limit) : '';
  const notMetni = [o.hataKodu ? `[${o.hataKodu}] ${o.not ?? ''}` : (o.not ?? ''), o.olcumNotu ?? '', limitMetni].filter(Boolean).join(' · ');
  const durum = o.basarili > 0 ? 'OK' : 'HATA';
  const goster = (v) => (v === null || v === undefined ? '—' : v);
  return `<tr class="${o.basarili > 0 ? 'ok' : 'hata'}">${h('provider', 'metin', kayit.provider, kayit.provider)}${h('model', 'metin', o.model, o.model)}${h('durum', 'metin', durum, durum, 'durum')}${h('deneme', 'sayi', o.deneme, o.deneme)}${h('basarili', 'sayi', o.basarili, o.basarili)}${h('http', 'sayi', o.http, o.http)}${h('ttftMs', 'sayi', o.ttftMs, goster(o.ttftMs))}${h('tokSn', 'sayi', o.tokSn, goster(o.tokSn))}${h('tokSnToplam', 'sayi', o.tokSnToplam, goster(o.tokSnToplam))}${h('parca', 'sayi', o.parca, goster(o.parca))}${h('deltaSn', 'sayi', o.deltaSn, goster(o.deltaSn))}${h('tokenPerDelta', 'sayi', o.tokenPerDelta, goster(o.tokenPerDelta))}${h('outToken', 'sayi', o.outToken, goster(o.outToken))}${h('tokenKaynagi', 'metin', o.tokenKaynagi, o.tokenKaynagi ?? '—')}${h('hataKodu', 'metin', o.hataKodu, o.hataKodu ?? '—')}${h('not', 'metin', notMetni, notMetni || '—')}</tr>`;
}

function htmlSatirKatalog(s) {
  const h = htmlHucre;
  const goster = (v) => (v === null || v === undefined ? '—' : v);
  const etiket = s.durum === 'OLCUMEDI' ? '&#214;l&#231;&#252;lmedi' : s.durum;
  const sinif = s.durum === 'OK' ? 'ok' : s.durum === 'HATA' ? 'hata' : 'sus';
  return `<tr class="${sinif}">${h('provider', 'metin', s.provider, s.provider)}${h('model', 'metin', s.model, s.model)}${h('ucretsiz', 'metin', s.ucretsiz === null ? 'bilinmiyor' : s.ucretsiz ? 'evet' : 'hayır', s.ucretsiz === null ? 'bilinmiyor' : s.ucretsiz ? 'evet' : 'hayır')}${h('kaynak', 'metin', s.kaynak, s.kaynak)}${h('katalogHttp', 'sayi', s.katalogHttp, s.katalogHttp)}${h('durum', 'metin', s.durum, etiket, 'durum')}${h('ttftMs', 'sayi', s.ttftMs, goster(s.ttftMs))}${h('tokSn', 'sayi', s.tokSn, goster(s.tokSn))}${h('tokSnToplam', 'sayi', s.tokSnToplam, goster(s.tokSnToplam))}${h('parca', 'sayi', s.parca, goster(s.parca))}${h('tokenPerDelta', 'sayi', s.tokenPerDelta, goster(s.tokenPerDelta))}${h('olcumZamani', 'metin', s.olcumZamani, s.olcumZamani ?? '—')}${h('hataKodu', 'metin', s.hataKodu, s.hataKodu ?? '—')}${h('not', 'metin', s.not, s.not || '—')}</tr>`;
}

function htmlKatalog(r, satirlar) {
  const olcule = satirlar.filter((s) => s.durum === 'OK').length;
  const hatali = satirlar.filter((s) => s.durum === 'HATA').length;
  const olcumdisi = satirlar.length - olcule - hatali;
  const free = satirlar.filter((s) => s.ucretsiz).length;
  return htmlSayfa({
    baslik: `Provider Katalog — tüm liste (${r.generatedAt})`,
    meta: `${r.generatedAt} · canlı katalog + config listeleri · ölçüm ${r.generatedAt} tarihli receipt'ten birleştirildi · hash: ${r.benchHash}`,
    kartlar: [
      ['Toplam model', satirlar.length],
      ['Ücretsiz', satirlar.filter((s) => s.ucretsiz === true).length],
      ['Fiyat bilinmiyor', satirlar.filter((s) => s.ucretsiz === null).length],
      ['Ölçüldü (OK)', olcule],
      ['Ölçüldü (HATA)', hatali],
      ['Ölçülmedi', olcumdisi],
    ],
    sutunlar: SUTUNLAR_KATALOG,
    satirlar: satirlar.map(htmlSatirKatalog),
    not: 'Liste kaynağı: canlı /models (katalog HTTP 200) ya da config içindeki models/additionalModels alanı (canlı doğrulanmamış). "Son ölçüm" yalnız o turda fiilen denenen modelleri gösterir; boş hücre ölçülmedi demektir, model arızalı demek değildir. Boş ölçüm satırları sıralamada hep sona gider.',
  });
}

function htmlRapor(r) {
  const satirlar = r.providerlar.flatMap((k) => k.modeller.map((o) => htmlSatir(k, o)));
  return htmlSayfa({
    baslik: `Provider Bench — ${r.generatedAt}`,
    meta: `${r.generatedAt} · kapsam: ${r.ayarlar.kapsam} · runs: ${r.ayarlar.runs} · max_tokens: ${r.ayarlar.maxTokens} · akış: ${r.ayarlar.akis ? 'açık' : 'kapalı'} · hash: ${r.benchHash}`,
    kartlar: [
      ['Üretilen', r.ozet.toplamModel],
      ['Çalışan', r.ozet.calisan],
      ['Hatalı', r.ozet.hatali],
      ['Provider', r.providerlar.length],
    ],
    sutunlar: SUTUNLAR,
    satirlar,
    not: r.note,
  });
}

function olcumTopla(rapor) {
  const harita = new Map();
  const ekle = (kaynak, kaynakZaman) => {
    for (const p of kaynak?.providerlar ?? []) {
      for (const o of p.modeller ?? []) {
        const anahtar = `${p.provider} ${o.model}`;
        const eski = harita.get(anahtar);
        if (!eski || eski.zaman <= kaynakZaman) harita.set(anahtar, { ...o, provider: p.provider, zaman: kaynakZaman });
      }
    }
  };
  ekle(rapor, rapor.generatedAt);
  try {
    for (const ad of readdirSync(dirname(CIKTI_YOLU))) {
      if (!/bench.*\.json$/i.test(ad)) continue;
      try {
        const eski = JSON.parse(readFileSync(join(dirname(CIKTI_YOLU), ad), 'utf8'));
        if (eski?.providerlar) ekle(eski, eski.generatedAt ?? '');
      } catch {
        continue;
      }
    }
  } catch {
    return harita;
  }
  return harita;
}

function configModelleri(p) {
  const dizi = [];
  for (const alan of ['models', 'additionalModels']) {
    const d = p?.[alan];
    if (Array.isArray(d)) for (const m of d) if (m && typeof m.id === 'string') dizi.push({ id: m.id, kaynak: `config:${alan}` });
  }
  return dizi;
}

function envanterKur(rapor) {
  const olcum = olcumTopla(rapor);
  const ucretsizKural = (id) => {
    const k = kataloglar.get(id);
    if (!k) return 'bilinmiyor';
    if (k.ids.some((m) => /:free$/i.test(m))) return 'ucretli-katman-var';
    return 'free-katmani-yok';
  };
  const ortak = (id, model, kaynak, katalogHttp, varsayilanNot) => {
    const o = olcum.get(`${id} ${model}`);
    const olcumNotu = o ? [o.hataKodu ? o.not : null, o.olcumNotu].filter(Boolean).join(' · ') : '';
    const kural = ucretsizKural(id);
    const ucretsiz = kural === 'bilinmiyor' ? null : kural === 'free-katmani-yok' ? false : /:free$/i.test(model);
    return {
      provider: id,
      model,
      ucretsiz,
      kaynak,
      katalogHttp,
      durum: o ? (o.basarili > 0 ? 'OK' : 'HATA') : 'OLCUMEDI',
      ttftMs: o?.ttftMs ?? null,
      tokSn: o?.tokSn ?? null,
      tokSnToplam: o?.tokSnToplam ?? null,
      parca: o?.parca ?? null,
      tokenPerDelta: o?.tokenPerDelta ?? null,
      olcumZamani: o?.zaman ? String(o.zaman).slice(0, 19).replace('T', ' ') : null,
      hataKodu: o?.hataKodu ?? null,
      not: olcumNotu || varsayilanNot || null,
    };
  };
  const satirlar = [];
  for (const [id, p] of Object.entries(tumProviderlar)) {
    if (TEK_PROVIDER && TEK_PROVIDER !== id) continue;
    if (p?.enabled === false) continue;
    const ham = p?.env?.OPENAI_BASE_URL && p?.env?.OPENAI_API_KEY;
    if (ham) {
      const k = kataloglar.get(id);
      for (const model of k?.ids ?? []) {
        satirlar.push(ortak(id, model, 'canli /models', k?.http ?? null, k?.hata ? `${k.hata.kod}: ${k.hata.mesaj}` : null));
      }
      continue;
    }
    for (const m of configModelleri(p)) {
      satirlar.push(ortak(id, m.id, m.kaynak, null, 'bu saglayici ham HTTP degil; /models cagrisi yapilamaz'));
    }
  }
  return satirlar;
}

if (!KATALOG_ONLY) {
  mkdirSync(dirname(CIKTI_YOLU), { recursive: true });
  writeFileSync(CIKTI_YOLU, JSON.stringify(rapor, null, 2));
}
if (HTML_YOLU !== 'none' && !KATALOG_ONLY) {
  mkdirSync(dirname(HTML_YOLU), { recursive: true });
  writeFileSync(HTML_YOLU, htmlRapor(rapor));
  console.log(`html  : ${HTML_YOLU}`);
} else {
  console.log(KATALOG_ONLY ? 'html  : atlandi (--katalog-only: olcum yapilmadi)' : 'html  : atlandi (--html=none)');
}
if (KATALOG_HTML || DUMP_YOLU) {
  const satirlar = envanterKur(rapor);
  if (KATALOG_HTML) {
    mkdirSync(dirname(KATALOG_HTML_YOLU), { recursive: true });
    writeFileSync(KATALOG_HTML_YOLU, htmlKatalog(rapor, satirlar));
    console.log(`katalog: ${KATALOG_HTML_YOLU} (${satirlar.length} model)`);
  }
  if (DUMP_YOLU && DUMP_YOLU !== 'none') {
    const sutunlar = ['provider', 'model', 'ucretsiz', 'kaynak', 'katalogHttp', 'durum', 'ttftMs', 'tokSn', 'tokSnToplam', 'parca', 'tokenPerDelta', 'olcumZamani', 'hataKodu', 'not'];
    const csvHucre = (v) => {
      if (v === null || v === undefined) return '';
      if (typeof v === 'boolean') return v ? 'evet' : 'hayır';
      const s = String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const govde = satirlar.map((s) => sutunlar.map((k) => csvHucre(s[k])).join(',')).join('\n');
    mkdirSync(dirname(DUMP_YOLU), { recursive: true });
    writeFileSync(DUMP_YOLU, `${sutunlar.join(',')}\n${govde}\n`);
    console.log(`dump   : ${DUMP_YOLU} (${satirlar.length} satir)`);
  }
}
console.log(`\nrapor: ${KATALOG_ONLY ? '(yeniden yazilmadi - katalog-only)' : CIKTI_YOLU}`);
console.log(`hash : ${rapor.benchHash}`);
console.log(`ozet : ${rapor.ozet.calisan}/${rapor.ozet.toplamModel} calisti, ${rapor.ozet.hatali} hatali`);
const canliKatalogVar = [...kataloglar.values()].some((k) => k.http === 200);
process.exitCode = KATALOG_ONLY ? (canliKatalogVar ? 0 : 1) : rapor.ozet.calisan > 0 ? 0 : 1;