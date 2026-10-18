// Minimal static web server for the second exercise, without dependencies.
// Usage: node server.js [port]   (default port: 3100)
// Serves the files of its own folder; "/" returns index.html. The files are
// read on every request, so an edited page is served without a restart.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] ?? 3100);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const file = path.join(root, name === '/' ? 'index.html' : name);
  // only files inside this folder, and never the server itself
  if (!file.startsWith(root + path.sep) || file === fileURLToPath(import.meta.url) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
  res.end(fs.readFileSync(file));
});

server.listen(port, () => console.log(`Example app running at http://localhost:${port}/ (Ctrl+C to stop)`));
server.on('error', (e) => {
  const self = path.relative(process.cwd(), fileURLToPath(import.meta.url));
  console.error(e.code === 'EADDRINUSE' ? `Port ${port} is in use; choose another, e.g. node ${self} ${port + 1}` : e.message);
  process.exit(1);
});
