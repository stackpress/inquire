import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import render from '@stackpress/lib/Template';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const specsDir = path.join(root, 'specs');
const docsDir = path.join(root, 'docs');
const assetsSourceDir = path.join(__dirname, 'assets');
const stylesDir = path.join(__dirname, 'styles');
const scriptsDir = path.join(__dirname, 'scripts');
const templatesDir = path.join(__dirname, 'templates');
const docsAssetsDir = path.join(docsDir, 'assets');
const siteOrigin = 'https://stackpress.github.io';
const siteBasePath = '/inquire/';
const siteName = 'Inquire Documentation';
const socialImagePath = 'assets/logo.png';

await ensureNode22();

const templateFiles = [
  'home.html',
  'layout.html',
  'nav-group.html',
  'section-card.html',
  'breadcrumb.html',
  'pager.html'
];

const templates = Object.fromEntries(
  await Promise.all(templateFiles.map(async file => ([
    path.basename(file, path.extname(file)),
    await readFile(path.join(templatesDir, file), 'utf8')
  ])))
);

const markdownFiles = (await walk(specsDir))
  .filter(file => file.endsWith('.md'))
  .sort((left, right) => {
    const leftRoot = path.relative(specsDir, left) === 'README.md';
    const rightRoot = path.relative(specsDir, right) === 'README.md';
    if (leftRoot && !rightRoot) return -1;
    if (!leftRoot && rightRoot) return 1;
    const leftReadme = path.basename(left) === 'README.md';
    const rightReadme = path.basename(right) === 'README.md';
    if (leftReadme && !rightReadme) return -1;
    if (!leftReadme && rightReadme) return 1;
    return left.localeCompare(right);
  });

const rawPages = [];
for (const filePath of markdownFiles) {
  const relativePath = path.relative(specsDir, filePath);
  const raw = await readFile(filePath, 'utf8');
  rawPages.push(createPageDraft(relativePath, raw));
}

const pagesByRelative = new Map(rawPages.map(page => [ page.relativePath, page ]));
const navGroups = buildNavGroups(rawPages);
const flatNavItems = navGroups.flatMap(group => group.items);

for (const page of rawPages) {
  if (page.relativePath === 'README.md') {
    const context = buildHomeContext(page);
    page.rendered = render(templates.home, context);
    continue;
  }

  const context = buildPageContext(page, rawPages, flatNavItems, pagesByRelative);
  page.html = renderMarkdown(page.raw, context);
  page.content = context.homeCards.length
    ? `${page.html}\n${context.homeCardsMarkup}`
    : page.html;
  page.rendered = render(templates.layout, {
    ...context,
    content: page.content,
    breadcrumbs: context.breadcrumbsMarkup,
    navGroups: context.navGroupsMarkup,
    pager: context.pagerMarkup,
    toc: context.tocMarkup
  });
}

await mkdir(docsDir, { recursive: true });
await cleanGeneratedDocs();
await mkdir(docsAssetsDir, { recursive: true });
await cp(assetsSourceDir, docsAssetsDir, { recursive: true, force: true });
await writeFile(path.join(docsAssetsDir, 'site.css'), await readFile(path.join(stylesDir, 'site.css'), 'utf8'), 'utf8');
await writeFile(path.join(docsAssetsDir, 'site.js'), await readFile(path.join(scriptsDir, 'site.js'), 'utf8'), 'utf8');
await writeFile(path.join(docsDir, '.nojekyll'), '', 'utf8');

for (const page of rawPages) {
  const outputDir = path.join(docsDir, page.outputDir);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), page.rendered, 'utf8');
}

const homePage = rawPages.find(page => page.relativePath === 'README.md');
if (homePage) {
  await writeFile(
    path.join(docsDir, '404.html'),
    homePage.rendered,
    'utf8'
  );
}

async function ensureNode22() {
  const [ major ] = process.versions.node.split('.').map(Number);
  if (major >= 22) {
    return;
  }
  throw new Error('Node.js 22 or newer is required to build the docs site.');
}

async function cleanGeneratedDocs() {
  const entries = await readdir(docsDir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    await rm(path.join(docsDir, entry.name), { force: true, recursive: true });
  }
}

function createPageDraft(relativePath, raw) {
  const segments = relativePath.split(path.sep);
  const title = extractTitle(raw) || humanize(
    path.basename(relativePath, path.extname(relativePath))
  );
  const sectionKey = segments[0] === 'README.md' ? 'overview' : segments[0];
  const section = sectionMeta(sectionKey);
  const outputDir = routeFromRelative(relativePath);
  const slug = outputDir === '.' ? 'home' : outputDir.replaceAll('/', '-');
  const description = extractDescription(raw);
  const headings = extractHeadings(raw);

  return {
    description,
    headings,
    outputDir,
    raw,
    relativePath,
    section,
    slug,
    title
  };
}

function buildPageContext(page, allPages, flatNavItems, pagesByRelative) {
  const outputDir = page.outputDir === '.' ? '' : page.outputDir;
  const pageDir = outputDir;
  const assetRoot = relativeAssetPath(pageDir, 'assets');
  const ordered = flatNavItems.filter(item => !item.hidden);
  const currentIndex = ordered.findIndex(item => item.relativePath === page.relativePath);
  const previous = currentIndex > 0 ? ordered[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < ordered.length - 1
    ? ordered[currentIndex + 1]
    : null;
  const navGroupsMarkup = navGroups.map(group => render(templates['nav-group'], {
    ...group,
    items: group.items.map(item => ({
      ...item,
      active: item.relativePath === page.relativePath,
      className: item.relativePath === page.relativePath
        ? 'nav-item is-active'
        : 'nav-item',
      href: relativePageHref(pageDir, item.outputDir)
    }))
  })).join('\n');
  const breadcrumbs = buildBreadcrumbs(page, pagesByRelative);
  const breadcrumbsMarkup = render(templates.breadcrumb, {
    items: breadcrumbs.map(item => ({
      ...item,
      href: relativePageHref(pageDir, item.outputDir)
    }))
  });
  const pagerMarkup = render(templates.pager, {
    previousHref: previous ? relativePageHref(pageDir, previous.outputDir) : '',
    previousLabel: previous ? previous.title : '',
    nextHref: next ? relativePageHref(pageDir, next.outputDir) : '',
    nextLabel: next ? next.title : ''
  });
  const tocMarkup = page.headings.length ? page.headings.map(heading => `
    <a class="toc-link toc-link-level-${heading.level}" href="#${heading.id}">
      ${escapeHtml(heading.text)}
    </a>
  `).join('') : '<p class="toc-empty">This page is compact by design.</p>';
  const homeCards = page.relativePath === 'README.md'
    ? navGroups.filter(group => group.items.length)
    : [];
  const homeCardsMarkup = homeCards.map(group => render(templates['section-card'], {
    ...group,
    items: group.items.slice(0, 4).map(item => ({
      ...item,
      href: relativePageHref(pageDir, item.outputDir)
    }))
  })).join('\n');

  return {
    assetRoot,
    canonicalUrl: buildPageUrl(page.outputDir),
    homeHref: relativePageHref(pageDir, '.'),
    metaDescription: page.description,
    metaTitle: buildPageTitle(page.title, false),
    ogImageUrl: buildAssetUrl(socialImagePath),
    ogType: 'article',
    pageUrl: buildPageUrl(page.outputDir),
    breadcrumbs,
    breadcrumbsMarkup,
    description: page.description,
    homeCards,
    homeCardsMarkup,
    navGroupsMarkup,
    outputDir: page.outputDir,
    pageClass: page.relativePath === 'README.md' ? 'page-home' : 'page-doc',
    pagerMarkup,
    relativePath: page.relativePath,
    section: page.section,
    siteName,
    slug: page.slug,
    title: page.title,
    tocMarkup
  };
}

function buildHomeContext(page) {
  const pageDir = '';
  const featured = [
    {
      description: 'Build a table, insert rows, and run a typed query in one pass.',
      href: relativePageHref(pageDir, 'tutorials/quick-start'),
      label: 'Start here',
      title: 'Quick Start'
    },
    {
      description: 'See how engines, builders, dialects, and connections fit together.',
      href: relativePageHref(pageDir, 'explanation/mental-model'),
      label: 'Understand the shape',
      title: 'Mental Model'
    },
    {
      description: 'Inspect the exact class and method surface when you need details.',
      href: relativePageHref(pageDir, 'api'),
      label: 'Reference lookup',
      title: 'API Reference'
    }
  ];

  const fit = [
    'Simply schema and query building',
    'Same DX across MySQL, Postgred, and SQLite',
    'Easy connection interface for database libraries',
    'Building your own ORM, migration tools and generators'
  ];

  const notTrying = [
    'An object relational mapper and strong type mapping',
    'Automatic boilerplate CRUD operations',
    'Deterministic relationship management',
    'Expressive code patterns over performance'
  ];

  const surfaces = [
    'Engine',
    'Create / Alter',
    'Select / Insert / Update / Delete',
    'Mysql / Pgsql / Sqlite',
    'Connection wrappers'
  ];

  const proofCode = renderCodeBlock(`const engine = connect(resource);

await engine.create('users')
  .addField('id', { type: 'integer', autoIncrement: true })
  .addField('email', { type: 'string', length: 255, nullable: false })
  .addPrimaryKey('id');

const users = await engine
  .select<{ id: number; email: string }>(['id', 'email'])
  .from('users');`, 'ts');

  return {
    assetRoot: './assets',
    canonicalUrl: buildPageUrl(page.outputDir),
    description: page.description,
    docsHref: relativePageHref(pageDir, 'tutorials/quick-start'),
    featured,
    fit,
    homeExample: proofCode,
    homeHref: relativePageHref(pageDir, '.'),
    metaDescription: page.description,
    metaTitle: buildPageTitle('Home', true),
    notTrying,
    ogImageUrl: buildAssetUrl(socialImagePath),
    ogType: 'website',
    pageClass: 'page-home',
    pageUrl: buildPageUrl(page.outputDir),
    section: page.section,
    siteName,
    surfaces,
    title: 'Ingest'
  };
}

function buildBreadcrumbs(page, pagesByRelative) {
  const items = [{
    label: 'Inquire',
    outputDir: '.'
  }];
  if (page.relativePath === 'README.md') {
    return items;
  }

  const segments = page.relativePath.split(path.sep);
  let current = '';
  for (let index = 0; index < segments.length - 1; index++) {
    current = current
      ? path.posix.join(current, segments[index])
      : segments[index];
    const readmePath = path.posix.join(current, 'README.md');
    const match = pagesByRelative.get(readmePath);
    if (!match) {
      continue;
    }
    items.push({
      label: match.title,
      outputDir: match.outputDir
    });
  }

  items.push({
    label: page.title,
    outputDir: page.outputDir
  });
  return dedupeBreadcrumbs(items);
}

function dedupeBreadcrumbs(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = `${item.label}:${item.outputDir}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildNavGroups(pages) {
  const groups = [
    buildGroup('Overview', 'Core system map', pages, ['README.md']),
    buildGroup('Tutorials', 'Operational boot sequence', pages, ['tutorials/']),
    buildGroup('Explanation', 'Architecture reasoning', pages, ['explanation/']),
    buildGroup('Guides', 'Task-specific procedures', pages, ['guides/']),
    buildGroup('API Core', 'Engine and wrappers', pages, ['api/README.md', 'api/engine.md', 'api/connections.md']),
    buildGroup('API Builders', 'Composable query units', pages, ['api/builders/README.md', 'api/builders/']),
    buildGroup('API Dialects', 'SQL translation modules', pages, ['api/dialects/README.md', 'api/dialects/'])
  ];

  return groups.filter(group => group.items.length);
}

function buildGroup(title, eyebrow, pages, patterns) {
  const seen = new Set();
  const items = [];

  for (const pattern of patterns) {
    const matches = pages.filter(page => matchesPattern(page.relativePath, pattern));
    for (const match of matches) {
      if (seen.has(match.relativePath)) {
        continue;
      }
      seen.add(match.relativePath);
      items.push({
        description: match.description,
        hidden: false,
        outputDir: match.outputDir,
        relativePath: match.relativePath,
        title: match.title
      });
    }
  }

  return {
    eyebrow,
    items,
    title
  };
}

function matchesPattern(relativePath, pattern) {
  if (pattern.endsWith('/')) {
    return relativePath.startsWith(pattern) && relativePath !== `${pattern}README.md`;
  }
  return relativePath === pattern;
}

function sectionMeta(sectionKey) {
  const map = {
    overview: {
      eyebrow: 'Blueprint',
      name: 'Overview'
    },
    tutorials: {
      eyebrow: 'Boot',
      name: 'Tutorials'
    },
    explanation: {
      eyebrow: 'Model',
      name: 'Explanation'
    },
    guides: {
      eyebrow: 'Ops',
      name: 'Guides'
    },
    api: {
      eyebrow: 'Surface',
      name: 'API'
    }
  };

  return map[sectionKey] || {
    eyebrow: 'Docs',
    name: humanize(sectionKey)
  };
}

function routeFromRelative(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  if (normalized === 'README.md') {
    return '.';
  }
  if (normalized.endsWith('/README.md')) {
    return normalized.slice(0, -'/README.md'.length);
  }
  return normalized.slice(0, -'.md'.length);
}

function buildPageTitle(title, isHome) {
  return isHome ? siteName : `${title} | Inquire`;
}

function buildPageUrl(outputDir) {
  const route = outputDir && outputDir !== '.'
    ? `${outputDir.replace(/^\/+|\/+$/g, '')}/`
    : '';
  return new URL(`${siteBasePath}${route}`, siteOrigin).toString();
}

function buildAssetUrl(assetPath) {
  return new URL(`${siteBasePath}${assetPath.replace(/^\/+/, '')}`, siteOrigin).toString();
}

function relativeUrl(fromDir, toDir) {
  const from = fromDir || '.';
  const to = toDir || '.';
  let relative = path.posix.relative(from, to) || '.';
  if (!relative.startsWith('.')) {
    relative = `./${relative}`;
  }
  if (relative === '.') {
    return './';
  }
  if (!relative.endsWith('/')) {
    relative = `${relative}/`;
  }
  return relative;
}

function relativePageHref(fromDir, toDir) {
  const target = toDir && toDir !== '.'
    ? `${toDir}/index.html`
    : 'index.html';
  return relativeFilePath(fromDir, target);
}

function relativeAssetPath(fromDir, target) {
  return relativeFilePath(fromDir, target);
}

function relativeFilePath(fromDir, target) {
  const from = fromDir || '.';
  let relative = path.posix.relative(from, target) || path.posix.basename(target);
  if (!relative.startsWith('.')) {
    relative = `./${relative}`;
  }
  return relative;
}

function extractTitle(markdown) {
  return markdown.match(/^#\s+(.+)$/m)?.[1].trim() || '';
}

function extractDescription(markdown) {
  const lines = markdown.split('\n');
  let started = false;
  let buffer = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!started) {
      if (trimmed.startsWith('# ')) {
        started = true;
      }
      continue;
    }
    if (!trimmed) {
      if (buffer.length) {
        break;
      }
      continue;
    }
    if (trimmed.startsWith('```') || trimmed.startsWith('#') || trimmed.startsWith('|')) {
      break;
    }
    if (trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
      if (!buffer.length) {
        buffer.push(trimmed.replace(/^[-*]\s+/, ''));
      }
      break;
    }
    buffer.push(trimmed);
  }

  return buffer.join(' ').trim();
}

function extractHeadings(markdown) {
  return markdown
    .split('\n')
    .map(line => line.match(/^(##|###)\s+(.+)$/))
    .filter(Boolean)
    .map((match) => ({
      id: slugify(match[2]),
      level: match[1].length,
      text: match[2].trim()
    }));
}

function renderMarkdown(markdown, page) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const html = [];
  let index = 0;
  let leadParagraphSkipped = false;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || 'text';
      const buffer = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        buffer.push(lines[index]);
        index += 1;
      }
      index += 1;
      html.push(renderCodeBlock(buffer.join('\n'), language));
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      if (level === 1) {
        index += 1;
        continue;
      }
      const tag = `h${level}`;
      const id = ` id="${slugify(text)}"`;
      const className = 'doc-heading';
      html.push(`<${tag}${id} class="${className}">${renderInline(text, page)}</${tag}>`);
      index += 1;
      continue;
    }

    if (trimmed.startsWith('|') && isTableDivider(lines[index + 1])) {
      const header = splitTableRow(lines[index]);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      html.push(renderTable(header, rows, page));
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = [];
      while (index < lines.length) {
        const candidate = lines[index].trim();
        if (!candidate.startsWith('- ') && !candidate.startsWith('* ')) {
          break;
        }
        items.push(candidate.slice(2).trim());
        index += 1;
      }
      html.push(`<ul class="doc-list">${items.map(item => `
        <li>${renderInline(item, page)}</li>
      `).join('')}</ul>`);
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items = [];
      while (index < lines.length) {
        const candidate = lines[index].trim();
        if (!/^\d+\.\s/.test(candidate)) {
          break;
        }
        items.push(candidate.replace(/^\d+\.\s/, '').trim());
        index += 1;
      }
      html.push(`<ol class="doc-list doc-list-ordered">${items.map(item => `
        <li>${renderInline(item, page)}</li>
      `).join('')}</ol>`);
      continue;
    }

    const buffer = [];
    while (index < lines.length) {
      const candidate = lines[index];
      const candidateTrimmed = candidate.trim();
      if (!candidateTrimmed
        || candidateTrimmed.startsWith('```')
        || candidateTrimmed.startsWith('|')
        || candidateTrimmed.startsWith('- ')
        || candidateTrimmed.startsWith('* ')
        || /^\d+\.\s/.test(candidateTrimmed)
        || /^(#{1,3})\s+/.test(candidateTrimmed)) {
        break;
      }
      buffer.push(candidateTrimmed);
      index += 1;
    }
    const paragraph = buffer.join(' ');
    if (!leadParagraphSkipped && paragraph === page.description) {
      leadParagraphSkipped = true;
      continue;
    }
    leadParagraphSkipped = true;
    html.push(`<p>${renderInline(paragraph, page)}</p>`);
  }

  return html.join('\n');
}

function renderTable(header, rows, page) {
  return `
    <div class="table-wrap">
      <table class="doc-table">
        <thead>
          <tr>${header.map(cell => `<th>${renderInline(cell, page)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map(row => `<tr>${row.map(cell => `<td>${renderInline(cell, page)}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderCodeBlock(code, language) {
  const highlighted = highlightCode(code, language);
  const label = escapeHtml(language);
  return `
    <div class="code-shell">
      <div class="code-toolbar">
        <span class="code-language">${label}</span>
        <button class="copy-button" type="button">
          Copy example
        </button>
      </div>
      <pre class="code-block" data-language="${label}"><code class="language-${label}">${highlighted}</code></pre>
    </div>
  `;
}

function highlightCode(code, language) {
  const lang = language.toLowerCase();
  const tokens = tokenize(code, lang);
  return tokens.map(token => {
    const value = escapeHtml(token.value);
    return token.type === 'plain'
      ? value
      : `<span class="token token-${token.type}">${value}</span>`;
  }).join('');
}

function tokenize(code, language) {
  const patterns = {
    bash: [
      ['comment', /^#[^\n]*/],
      ['string', /^"(?:\\.|[^"])*"|^'(?:\\.|[^'])*'/],
      ['number', /^\b\d+(?:\.\d+)?\b/],
      ['keyword', /^(?:yarn|node|cd|export|echo|await)\b/],
      ['operator', /^(?:&&|\|\||[|=:$])/]
    ],
    sql: [
      ['comment', /^(?:--[^\n]*|\/\*[\s\S]*?\*\/)/],
      ['string', /^'(?:''|[^'])*'/],
      ['number', /^\b\d+(?:\.\d+)?\b/],
      ['keyword', /^(?:SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|DELETE|CREATE|TABLE|ALTER|DROP|TRUNCATE|RETURNING|LIKE|ORDER|BY|AND|OR|JOIN|LEFT|RIGHT|INNER|ON|AS)\b/i],
      ['operator', /^(?:>=|<=|<>|!=|=|[(),.*;])/]
    ],
    text: []
  };
  const scriptPatterns = [
    ['comment', /^(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)/],
    ['string', /^"(?:\\.|[^"])*"|^'(?:\\.|[^'])*'|^`(?:\\.|[^`])*`/],
    ['number', /^\b\d+(?:\.\d+)?\b/],
    ['keyword', /^(?:import|from|const|let|var|await|async|return|class|extends|new|if|else|for|while|switch|case|break|continue|try|catch|throw|type|interface|export|default|public|private|protected|readonly|as|implements|function|true|false|null|undefined)\b/],
    ['operator', /^(?:=>|===|!==|==|!=|>=|<=|&&|\|\||[{}()[\].,;:+\-*/<>?])/]
  ];

  const active = langGroup(language) === 'script'
    ? scriptPatterns
    : patterns[language] || patterns.text;
  const tokens = [];
  let source = code;

  while (source.length) {
    let matched = false;
    for (const [ type, pattern ] of active) {
      const result = source.match(pattern);
      if (!result) {
        continue;
      }
      tokens.push({ type, value: result[0] });
      source = source.slice(result[0].length);
      matched = true;
      break;
    }
    if (matched) {
      continue;
    }
    tokens.push({ type: 'plain', value: source[0] });
    source = source.slice(1);
  }

  return tokens;
}

function langGroup(language) {
  if ([ 'ts', 'tsx', 'js', 'jsx', 'typescript', 'javascript' ].includes(language)) {
    return 'script';
  }
  return language;
}

function renderInline(text, page) {
  let output = escapeHtml(text);
  output = output.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const url = rewriteHref(page, href);
    const title = escapeAttribute(label);
    return `<a href="${url}" title="${title}">${escapeHtml(label)}</a>`;
  });
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return output;
}

function rewriteHref(page, href) {
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
    return href;
  }

  const [ target, hash = '' ] = href.split('#');
  if (!target.endsWith('.md')) {
    return href;
  }

  const fromDir = page.outputDir === '.' ? '' : page.outputDir;
  const fromSpecDir = path.posix.dirname(page.relativePath.split(path.sep).join('/'));
  const resolvedSpec = path.posix.normalize(
    path.posix.join(fromSpecDir === '.' ? '' : fromSpecDir, target)
  );
  const route = routeFromRelative(resolvedSpec);
  return `${relativePageHref(fromDir, route)}${hash ? `#${hash}` : ''}`;
}

function isTableDivider(line = '') {
  return /^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(line);
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cell => cell.trim());
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[`'"()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function humanize(value) {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeAttribute(value = '') {
  return escapeHtml(value).replaceAll('"', '&quot;');
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
