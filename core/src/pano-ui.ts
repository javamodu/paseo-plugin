// pano-ui — pano-server.ts'in servis ettiği tek-dosya arayüz (koyu tema, Türkçe, bağımlılıksız).
// Veri kaynağı /api/status (5 sn'de bir); token localStorage'da 'panoToken' anahtarında tutulur.
// İçerik bilinçli olarak tek template literal: başka dosya/bağımlılık YOK (görev sınırı).
export const PANO_HTML = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ORDU Pano</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0d1117; color: #e6edf3; font: 14px/1.5 system-ui, "Segoe UI", sans-serif; }
  header { display: flex; align-items: center; gap: 12px; padding: 14px 20px; background: #161b22; border-bottom: 1px solid #30363d; }
  header h1 { font-size: 16px; margin: 0; letter-spacing: .5px; }
  .rozet { padding: 3px 12px; border-radius: 999px; font-weight: 700; font-size: 12px; }
  .rozet.aktif { background: #1a7f37; color: #fff; }
  .rozet.durdu { background: #da3633; color: #fff; }
  main { padding: 20px; max-width: 1100px; margin: 0 auto; }
  .kartlar { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .kart { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 12px 14px; }
  .kart .deger { font-size: 24px; font-weight: 700; }
  .kart .ad { color: #8b949e; font-size: 12px; text-transform: uppercase; letter-spacing: .5px; }
  .kart.tehlike .deger { color: #f85149; }
  section { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; }
  section h2 { margin: 0 0 10px; font-size: 14px; color: #8b949e; text-transform: uppercase; letter-spacing: .5px; }
  table { width: 100%; border-collapse: collapse; }
  td, th { text-align: left; padding: 6px 8px; border-bottom: 1px solid #21262d; font-size: 13px; }
  .durum { font-weight: 600; }
  .bos { color: #8b949e; font-style: italic; }
  #durdur { background: #da3633; color: #fff; border: 0; border-radius: 8px; padding: 12px 22px; font-size: 15px; font-weight: 700; cursor: pointer; }
  #durdur:hover { background: #f85149; }
  .muted { color: #8b949e; font-size: 12px; }
  .st { padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
  .st-yesil { background: #1a7f37; color: #fff; }
  .st-sari { background: #9e6a03; color: #fff; }
  .st-kirmizi { background: #da3633; color: #fff; }
  .st-gri { background: #30363d; color: #8b949e; }
</style>
</head>
<body>
<header>
  <h1>ORDU Pano</h1>
  <span id="rozet" class="rozet aktif">AKTIF</span>
  <span class="muted" id="zaman"></span>
</header>
<main>
  <div class="kartlar">
    <div class="kart"><div class="deger" id="k-teslim">-</div><div class="ad">Doğrulanmış Teslim</div></div>
    <div class="kart"><div class="deger" id="k-karar">-</div><div class="ad">Bekleyen Karar</div></div>
    <div class="kart tehlike"><div class="deger" id="k-unknown">-</div><div class="ad">UNKNOWN</div></div>
    <div class="kart"><div class="deger" id="k-butce">-</div><div class="ad">Bütçe (harcanan/tavan)</div></div>
    <div class="kart tehlike"><div class="deger" id="k-ihlal">-</div><div class="ad">Kritik İhlal</div></div>
  </div>
  <section>
    <h2>Kapsüller</h2>
    <div id="kapsuller"><span class="bos">yükleniyor…</span></div>
  </section>
  <section>
    <h2>Kararlar</h2>
    <div id="kararlar"><span class="bos">yükleniyor…</span></div>
  </section>
  <section>
    <h2>Sistem</h2>
    <p><button id="durdur">ACİL DURDUR</button></p>
    <p class="muted">İnsan müdahalesi: <span id="k-mudahale">-</span> · Son olaylar:</p>
    <div id="olaylar"><span class="bos">yükleniyor…</span></div>
  </section>
  <section>
    <h2>&#214;&#287;renme</h2>
    <p class=muted>Toplam: <span id=k-ders-toplam>-</span> &middot; Yayinda: <span id=k-ders-yayin>-</span> &middot; Karantina: <span id=k-ders-karantina>-</span></p>
    <div id=dersler><span class=bos>yukleniyor...</span></div>
  </section>
  <section>
    <h2>Bildirimler</h2>
    <p class=muted>Bekleyen: <span id=k-bekleyen>-</span> &middot; Ertelenen: <span id=k-deferred>-</span> &middot; &#214;lu: <span id=k-olu>-</span></p>
    <div id=bildirimler><span class=bos>yukleniyor...</span></div>
  </section>
</main>
<script>
var urlToken = new URLSearchParams(location.search).get('token');
if (urlToken) { localStorage.setItem('panoToken', urlToken); history.replaceState(null, '', location.pathname); }
var token = localStorage.getItem('panoToken') || '';
function esc(v) {
  return String(v).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}
function api(path, opts) {
  opts = opts || {};
  var headers = opts.headers || {};
  headers['x-pano-token'] = token;
  opts.headers = headers;
  return fetch(path, opts).then(function (r) {
    if (r.status === 403) {
      token = prompt('Pano token (x-pano-token):') || '';
      localStorage.setItem('panoToken', token);
      throw new Error('yetkisiz');
    }
    return r;
  });
}
function tablo(satirlar, kolonlar) {
  if (!satirlar.length) return '<span class="bos">kayıt yok</span>';
  var h = '<table><tr>' + kolonlar.map(function (k) { return '<th>' + esc(k) + '</th>'; }).join('') + '</tr>';
  satirlar.forEach(function (s) {
    h += '<tr>' + kolonlar.map(function (k) {
      var v = s[k];
      return '<td' + (k === 'state' ? ' class="durum"' : '') + '>' + (v == null ? '—' : esc(v)) + '</td>';
    }).join('') + '</tr>';
  });
  return h + '</table>';
}
function dersRozeti(state) {
  var cls = 'st st-gri';
  if (state === 'PUBLISHED') cls = 'st st-yesil';
  else if (state === 'PROPOSED') cls = 'st st-sari';
  else if (state === 'REVOKED') cls = 'st st-kirmizi';
  return '<span class="' + cls + '">' + esc(state) + '</span>';
}
function sevRozeti(sev) {
  var cls = 'st st-gri';
  if (sev === 'CRITICAL') cls = 'st st-kirmizi';
  else if (sev === 'WARN') cls = 'st st-sari';
  return '<span class="' + cls + '">' + esc(sev) + '</span>';
}
function dersTablosu(dersler) {
  if (!dersler || !dersler.length) return '<span class="bos">kayit yok</span>';
  var h = '<table><tr><th>id</th><th>kind</th><th>state</th><th>expiry</th></tr>';
  dersler.forEach(function (d) {
    h += '<tr><td>' + esc(d.id) + '</td><td>' + esc(d.kind) + '</td><td>' + dersRozeti(d.state) + '</td><td>' + (d.expiry == null ? '-' : esc(d.expiry)) + '</td></tr>';
  });
  return h + '</table>';
}
function bildirimTablosu(liste) {
  if (!liste || !liste.length) return '<span class="bos">kayit yok</span>';
  var h = '<table><tr><th>severity</th><th>metin</th><th>state</th></tr>';
  liste.forEach(function (b) {
    h += '<tr><td>' + sevRozeti(b.severity) + '</td><td>' + esc(b.redakteMetin) + '</td><td class="durum">' + esc(b.state) + '</td></tr>';
  });
  return h + '</table>';
}
function ciz(s) {
  var rozet = document.getElementById('rozet');
  rozet.textContent = s.globalStop ? 'DURDURULDU' : 'AKTIF';
  rozet.className = 'rozet ' + (s.globalStop ? 'durdu' : 'aktif');
  document.getElementById('k-teslim').textContent = s.metrics.verifiedDeliveries;
  document.getElementById('k-karar').textContent = s.pendingDecisions.length;
  document.getElementById('k-unknown').textContent = s.unknownCount;
  document.getElementById('k-ihlal').textContent = s.metrics.criticalViolations;
  document.getElementById('k-mudahale').textContent = s.metrics.humanInterventions;
  var harcanan = 0, tavan = 0;
  s.runs.forEach(function (r) { harcanan += r.spentTokens || 0; tavan += r.maxReservedTokens || 0; });
  document.getElementById('k-butce').textContent = harcanan + ' / ' + tavan;
  document.getElementById('kapsuller').innerHTML = tablo(s.runs, ['id', 'planId', 'state', 'updatedAt']);
  document.getElementById('kararlar').innerHTML = tablo(s.pendingDecisions, ['runId', 'kind', 'createdAt']);
  document.getElementById('olaylar').innerHTML = tablo(s.lastEvents, ['sequence', 'type', 'runId', 'createdAt']);
  var ls = s.lessons || { toplam: 0, published: 0, karantina: 0, sonDersler: [] };
  document.getElementById('k-ders-toplam').textContent = ls.toplam;
  document.getElementById('k-ders-yayin').textContent = ls.published;
  document.getElementById('k-ders-karantina').textContent = ls.karantina;
  document.getElementById('dersler').innerHTML = dersTablosu(ls.sonDersler);
  var nt = s.notifications || { bekleyen: 0, deferred: 0, dead: 0, sonBildirimler: [] };
  document.getElementById('k-bekleyen').textContent = nt.bekleyen;
  document.getElementById('k-deferred').textContent = nt.deferred;
  document.getElementById('k-olu').textContent = nt.dead;
  document.getElementById('bildirimler').innerHTML = bildirimTablosu(nt.sonBildirimler);
  document.getElementById('zaman').textContent = 'güncelleme: ' + new Date().toLocaleTimeString('tr-TR');
}
function yenile() {
  api('/api/status').then(function (r) { return r.json(); }).then(ciz).catch(function () {});
}
document.getElementById('durdur').addEventListener('click', function () {
  if (!token) {
    token = prompt('Pano token (x-pano-token):') || '';
    localStorage.setItem('panoToken', token);
  }
  var onay = prompt('ACİL DURDUR — onay için DURDUR yaz:');
  if (onay !== 'DURDUR') return;
  api('/api/stop', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ confirm: 'DURDUR' })
  }).then(function (r) {
    if (!r.ok) alert('durdurma reddedildi: HTTP ' + r.status);
    yenile();
  }).catch(function () {});
});
yenile();
setInterval(yenile, 5000);
</script>
</body>
</html>`;
