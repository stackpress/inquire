import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

await ensureNode22();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const docsDir = path.join(root, 'docs');
const requiredAssets = [
  '.nojekyll',
  'assets/site.css',
  'assets/site.js',
  'assets/favicon.ico',
  'assets/icon.png',
  'assets/logo.png',
  'index.html'
];

const htmlFiles = (await walk(docsDir))
  .filter(filePath => filePath.endsWith('.html'))
  .sort();
const existingFiles = new Set(await walk(docsDir));

const errors = [];
const warnings = [];

for (const relativePath of requiredAssets) {
  try {
    await access(path.join(docsDir, relativePath));
  } catch {
    errors.push(`Missing required docs asset: ${relativePath}`);
  }
}

if (!htmlFiles.length) {
  errors.push('No generated HTML files were found in docs/.');
}

for (const filePath of htmlFiles) {
  const html = await readFile(filePath, 'utf8');
  const relativeFile = path.relative(docsDir, filePath);
  checkStructure(relativeFile, html, errors, warnings);
  checkLinks(relativeFile, html, errors, existingFiles);
}

if (errors.length) {
  process.stderr.write('Docs check failed.\n');
  for (const error of errors) {
    process.stderr.write(`- ${error}\n`);
  }
  if (warnings.length) {
    process.stderr.write('Warnings:\n');
    for (const warning of warnings) {
      process.stderr.write(`- ${warning}\n`);
    }
  }
  process.exit(1);
}

process.stdout.write(`Docs check passed for ${htmlFiles.length} HTML files.\n`);
if (warnings.length) {
  process.stdout.write('Warnings:\n');
  for (const warning of warnings) {
    process.stdout.write(`- ${warning}\n`);
  }
}

function checkStructure(relativeFile, html, errors, warnings) {
  const isHome = relativeFile === 'index.html' || relativeFile === '404.html';
  const checks = [
    [/<title>.+<\/title>/, 'title'],
    [/<meta content="[^"]+" name="description" \/>/, 'meta description'],
    [/<link href="https:\/\/[^"]+" rel="canonical" \/>/, 'canonical link'],
    [/<link href=".*assets\/site\.css" rel="stylesheet" \/>/, 'stylesheet link'],
    [/<meta content="[^"]+" property="og:title" \/>/, 'Open Graph title'],
    [/<meta content="[^"]+" property="og:description" \/>/, 'Open Graph description'],
    [/<meta content="[^"]+" property="og:type" \/>/, 'Open Graph type'],
    [/<meta content="https:\/\/[^"]+" property="og:url" \/>/, 'Open Graph URL'],
    [/<meta content="https:\/\/[^"]+" property="og:image" \/>/, 'Open Graph image'],
    [/<meta content="summary(?:_large_image)?" name="twitter:card" \/>/, 'Twitter card'],
    [/<meta content="[^"]+" name="twitter:title" \/>/, 'Twitter title'],
    [/<meta content="[^"]+" name="twitter:description" \/>/, 'Twitter description'],
    [/<meta content="https:\/\/[^"]+" name="twitter:image" \/>/, 'Twitter image'],
    [/<script defer src=".*assets\/site\.js"><\/script>/, 'docs script'],
    [/<button[^>]*data-theme-toggle="true"[^>]*>/s, 'theme toggle']
  ];

  if (isHome) {
    checks.push([/<section class="page-home-hero">/, 'home hero']);
  } else {
    checks.push([/<aside class="site-nav">/, 'site navigation']);
    checks.push([/<article class="doc-panel">/, 'doc panel']);
  }

  for (const [ pattern, label ] of checks) {
    if (!pattern.test(html)) {
      errors.push(`${relativeFile}: missing ${label}`);
    }
  }

  const h1Count = html.match(/<h1>/g)?.length || 0;
  if (h1Count !== 1) {
    errors.push(`${relativeFile}: expected exactly one <h1>, found ${h1Count}`);
  }

  if (html.includes('{{') || html.includes('}}')) {
    errors.push(`${relativeFile}: unresolved template placeholder found`);
  }

  const copyButtons = html.match(/class="copy-button"/g)?.length || 0;
  const codeBlocks = html.match(/class="code-shell"/g)?.length || 0;
  if (codeBlocks && !copyButtons) {
    warnings.push(`${relativeFile}: no copy buttons found`);
  }

  if (/href="[^"]+\.md(?:#|")/.test(html)) {
    errors.push(`${relativeFile}: still contains markdown links`);
  }
}

function checkLinks(relativeFile, html, errors, existingFiles) {
  const directory = path.dirname(path.join(docsDir, relativeFile));
  const hrefs = [
    ...html.matchAll(/href="([^"]+)"/g)
  ].map(match => match[1]);
  const srcs = [
    ...html.matchAll(/src="([^"]+)"/g)
  ].map(match => match[1]);

  for (const target of [ ...hrefs, ...srcs ]) {
    if (target.startsWith('http://') || target.startsWith('https://')
      || target.startsWith('mailto:') || target.startsWith('#')) {
      continue;
    }

    const [ clean ] = target.split('#');
    if (!clean) {
      continue;
    }

    const rawResolved = path.join(directory, clean);
    const resolved = path.extname(rawResolved)
      ? rawResolved
      : path.join(rawResolved, 'index.html');

    const normalized = path.normalize(resolved);
    if (!normalized.startsWith(docsDir)) {
      errors.push(`${relativeFile}: target escapes docs root -> ${target}`);
      continue;
    }

    if (!existingFiles.has(normalized)) {
      errors.push(`${relativeFile}: missing target -> ${target}`);
    }
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(location));
      continue;
    }
    if ((await stat(location)).isFile()) {
      files.push(location);
    }
  }

  return files;
}

async function ensureNode22() {
  const [ major ] = process.versions.node.split('.').map(Number);
  if (major >= 22) {
    return;
  }
  throw new Error('Node.js 22 or newer is required to check the docs site.');
}
