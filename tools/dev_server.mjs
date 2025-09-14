#!/usr/bin/env node
// Simple static file server for local development.
// Usage: node tools/dev_server.mjs [--port 8080] [--host 127.0.0.1] [--root .]

import http from 'http';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = new Map();
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  const nk = a.startsWith('--') ? a.slice(2) : a;
  const [k, v] = nk.split('=');
  if (v !== undefined) args.set(k, v);
  else if (i + 1 < process.argv.length && !process.argv[i + 1].startsWith('--')) {
    args.set(k, process.argv[++i]);
  } else {
    args.set(k, 'true');
  }
}

const host = args.get('host') || '127.0.0.1';
const port = parseInt(args.get('port') || '8080', 10);
const root = path.resolve(args.get('root') || path.join(__dirname, '..'));

const mime = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}));

function contentType(p) {
  return mime.get(path.extname(p).toLowerCase()) || 'application/octet-stream';
}

function safeJoin(rootDir, reqPath) {
  const decoded = decodeURIComponent(reqPath.split('?')[0]);
  const p = path.normalize(decoded).replace(/^\/+/, '');
  const abs = path.join(rootDir, p);
  if (!abs.startsWith(rootDir)) return null; // traversal guard
  return abs;
}

async function send(res, status, body, headers = {}) {
  const baseHeaders = {
    'Cache-Control': 'no-store, max-age=0',
  };
  res.writeHead(status, { ...baseHeaders, ...headers });
  if (body instanceof Buffer) res.end(body);
  else if (typeof body === 'string') res.end(body);
  else res.end();
}

async function serveFile(res, absPath) {
  try {
    const data = await readFile(absPath);
    return send(res, 200, data, { 'Content-Type': contentType(absPath) });
  } catch (e) {
    return send(res, 404, 'Not Found');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let abs = safeJoin(root, url.pathname);
  if (!abs) return send(res, 400, 'Bad Request');
  try {
    const st = await stat(abs).catch(() => null);
    if (st && st.isDirectory()) {
      const indexPath = path.join(abs, 'index.html');
      const hasIndex = await stat(indexPath).then(s => s.isFile()).catch(() => false);
      if (hasIndex) return serveFile(res, indexPath);
      // Directory listing disabled; attempt to serve 404
      return send(res, 403, 'Forbidden');
    }
    if (st && st.isFile()) return serveFile(res, abs);
    // Fallback to index.html for root URL
    if (url.pathname === '/' || url.pathname === '') {
      return serveFile(res, path.join(root, 'index.html'));
    }
    return send(res, 404, 'Not Found');
  } catch (e) {
    return send(res, 500, 'Internal Server Error');
  }
});

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`Dev server running at http://${host}:${port} (root: ${root})`);
});

