const http = require('http');
const fs = require('fs');
const path = require('path');
const MIME = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.css': 'text/css', '.js': 'text/javascript' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/mockup13ekim.html';
  const dosya = path.join(process.cwd(), p);
  if (!dosya.startsWith(process.cwd())) { res.writeHead(403); return res.end(); }
  fs.readFile(dosya, (err, data) => {
    if (err) { res.writeHead(404); return res.end('yok'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(dosya)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(8901, '127.0.0.1', () => console.log('pano-mockup: http://127.0.0.1:8901'));
