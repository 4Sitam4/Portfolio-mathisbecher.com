/**
 * Post-build: print the CV pages to PDF and screenshot the link-preview image,
 * with a headless Chrome/Chromium serving the freshly built `dist/`.
 *
 *   dist/cv/Mathis-Becher-CV.pdf       ← /cv/
 *   dist/en/cv/Mathis-Becher-CV-EN.pdf ← /en/cv/
 *   dist/og.png                        ← /og/ (page removed afterwards)
 *
 * Browser: $CHROME_BIN, else the usual install paths. Without a browser the
 * step is skipped with a warning, unless RENDER_REQUIRED=1 (Docker build),
 * where it fails so a release never ships without its CV.
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const DIST = resolve('dist');
const required = process.env.RENDER_REQUIRED === '1';

// The CV is meant to fit on a single A4 page: the build fails otherwise.
const JOBS = [
  { kind: 'pdf', path: '/cv/', out: 'cv/Mathis-Becher-CV.pdf', maxPages: 1 },
  { kind: 'pdf', path: '/en/cv/', out: 'en/cv/Mathis-Becher-CV-EN.pdf', maxPages: 1 },
  { kind: 'png', path: '/og/', out: 'og.png', size: '1200,630' },
];

const CANDIDATES = [
  process.env.CHROME_BIN,
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);

const browser = CANDIDATES.find((p) => existsSync(p));
if (!browser) {
  const msg = 'render-assets: no Chrome/Chromium found (set CHROME_BIN)';
  if (required) throw new Error(msg);
  console.warn(`${msg} — CV PDF and og.png skipped.`);
  process.exit(0);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
};

// Minimal static server over dist/ (localhost only, for the duration of the step).
const server = createServer((req, res) => {
  let file = normalize(join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!file.startsWith(DIST)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}`;

const profile = mkdtempSync(join(tmpdir(), 'render-assets-'));
const common = [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--hide-scrollbars',
  '--no-first-run',
  `--user-data-dir=${profile}`,
  '--virtual-time-budget=5000',
];

try {
  for (const job of JOBS) {
    const out = join(DIST, job.out);
    const args =
      job.kind === 'pdf'
        ? [...common, '--no-pdf-header-footer', `--print-to-pdf=${out}`]
        : [...common, `--window-size=${job.size}`, '--force-device-scale-factor=1', `--screenshot=${out}`];
    await run(browser, [...args, base + job.path], { timeout: 60_000 });
    if (!existsSync(out) || statSync(out).size === 0) throw new Error(`render-assets: ${job.out} was not produced`);
    if (job.maxPages) {
      const pages = (readFileSync(out, 'latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
      if (pages > job.maxPages) {
        throw new Error(`render-assets: ${job.out} has ${pages} pages (max ${job.maxPages}) — shorten src/i18n/cv.ts`);
      }
    }
    console.log(`render-assets: ${job.out} (${Math.round(statSync(out).size / 1024)} kB)`);
  }
  // The preview source page is an implementation detail: do not ship it.
  rmSync(join(DIST, 'og'), { recursive: true, force: true });
} finally {
  server.close();
  rmSync(profile, { recursive: true, force: true });
}
