// Post-build: preload the dynamically-imported MSW browser chunk so it is fetched
// as part of the initial document, in parallel, instead of a late critical-path
// dynamic import that can fail on slow/lossy connections.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const assetsDir = join(dist, 'assets');
const indexPath = join(dist, 'index.html');

if (!existsSync(indexPath) || !existsSync(assetsDir)) {
  console.log('[inject-preload] nothing to do (no dist)');
  process.exit(0);
}

const files = readdirSync(assetsDir);
const msw = files.find((f) => /^browser-.*\.js$/.test(f));
if (!msw) {
  console.log('[inject-preload] no MSW browser chunk found; skipping');
  process.exit(0);
}

let html = readFileSync(indexPath, 'utf8');
const tag = `    <link rel="modulepreload" crossorigin href="/assets/${msw}">`;
if (html.includes(tag.trim())) {
  console.log('[inject-preload] already present:', msw);
  process.exit(0);
}
html = html.replace('</head>', `${tag}\n  </head>`);
writeFileSync(indexPath, html);
console.log('[inject-preload] preloading', msw);
