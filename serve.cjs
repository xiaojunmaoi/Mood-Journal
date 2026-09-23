const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const port = Number(option('--port', 4173));
const host = option('--host', '127.0.0.1');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.m4a': 'audio/mp4' };
const allowed = new Set(['index.html', 'styles.css', 'care.css', 'app.js', 'journal.js', 'care.js', 'nature-audio.js']);
http.createServer((req, res) => {
  let relative;
  try { relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html'; } catch { res.writeHead(400).end(); return; }
  const full = path.resolve(__dirname, relative);
  const assetRoot = path.join(__dirname, 'assets') + path.sep;
  if (!allowed.has(relative) && !full.startsWith(assetRoot)) { res.writeHead(404).end('Not found'); return; }
  fs.readFile(full, (error, body) => {
    if (error) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(body);
  });
}).listen(port, host, () => process.stdout.write(`心晴原型已启动：http://${host}:${port}\n`));
