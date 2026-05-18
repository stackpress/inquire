import { createReadStream } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

await ensureNode22();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const docsDir = path.join(root, 'docs');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4173);

await access(path.join(docsDir, 'index.html'));

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${host}:${port}`);
    const filePath = resolvePath(url.pathname);
    const body = createReadStream(filePath);
    response.writeHead(200, { 'Content-Type': contentType(filePath) });
    body.pipe(response);
  } catch (error) {
    const notFound = path.join(docsDir, '404.html');
    try {
      const html = await readFile(notFound, 'utf8');
      response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(html);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  }
});

server.listen(port, host, () => {
  process.stdout.write(`Docs server running at http://${host}:${port}\n`);
});

function resolvePath(pathname) {
  const safePath = decodeURIComponent(pathname).replace(/^\/+/, '');
  let target = path.join(docsDir, safePath);

  if (pathname.endsWith('/')) {
    target = path.join(target, 'index.html');
  } else if (!path.extname(target)) {
    target = path.join(target, 'index.html');
  }

  const normalized = path.normalize(target);
  if (!normalized.startsWith(docsDir)) {
    throw new Error('Path escapes docs directory');
  }

  return normalized;
}

function contentType(filePath) {
  const extension = path.extname(filePath);
  const types = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8'
  };
  return types[extension] || 'application/octet-stream';
}

async function ensureNode22() {
  const [ major ] = process.versions.node.split('.').map(Number);
  if (major >= 22) {
    return;
  }
  throw new Error('Node.js 22 or newer is required to serve the docs site.');
}
