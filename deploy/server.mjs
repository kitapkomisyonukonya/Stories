import http from 'node:http';
import { Readable } from 'node:stream';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, join, normalize, sep } from 'node:path';
import { brotliCompressSync, gzipSync, constants as zlibConstants } from 'node:zlib';
import { createPanelApi } from './panelApi.mjs';

const port = Number(process.env.PORT || 8080);
const root = join(process.cwd(), 'dist');
const gitSha = process.env.APP_GIT_SHA || 'unknown';
const gitRef = process.env.APP_GIT_REF || 'unknown';
const revision = process.env.K_REVISION || 'unknown';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
};

// Security headers on every response. The Content-Security-Policy goes on pages only and lists
// exactly what the app loads: its own files, pictures and audio from Firebase Storage, the
// OpenDyslexic font from jsDelivr and the About page film from youtube-nocookie. The app may be
// framed only by itself and by MEB sites (EBA), never by anyone else.
const storageHosts = 'https://firebasestorage.googleapis.com https://storage.googleapis.com';
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  `img-src 'self' data: blob: ${storageHosts}`,
  `media-src 'self' blob: ${storageHosts}`,
  `connect-src 'self' ${storageHosts} https://firebase.googleapis.com https://firebaseinstallations.googleapis.com`,
  'frame-src https://www.youtube-nocookie.com',
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self' https://*.eba.gov.tr https://*.meb.gov.tr",
  'upgrade-insecure-requests',
].join('; ');
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), payment=(), usb=(), microphone=(self), fullscreen=(self)',
  'Cross-Origin-Opener-Policy': 'same-origin',
};
const pageSecurityHeaders = { ...securityHeaders, 'Content-Security-Policy': contentSecurityPolicy };

// The content panel signs its team in with Google through Firebase, which needs a sign-in popup
// and Google's sign-in scripts. Those are allowed on the panel page only, never in the app.
const firebaseAuthDomain = 'https://gen-lang-client-0373200489.firebaseapp.com';
// The panel shows the app itself in a frame (same origin), its pictures and recordings, and lists
// the chapter folders in Storage to find which file a new picture replaces.
const panelPageHeaders = {
  ...securityHeaders,
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' https://apis.google.com",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `img-src 'self' data: blob: https://*.googleusercontent.com ${storageHosts}`,
    `media-src 'self' blob: ${storageHosts}`,
    `connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://apis.google.com ${storageHosts}`,
    `frame-src 'self' ${firebaseAuthDomain} https://accounts.google.com`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
};

// Text files go out compressed (about a quarter of their size), which matters most on slow
// school networks. Files never change inside one revision, so each is compressed once and kept.
const compressible = new Set(['.html', '.js', '.css', '.json', '.svg', '.ttf']);
const compressedCache = new Map();
const compressed = (filePath, encoding) => {
  const key = `${encoding}:${filePath}`;
  let body = compressedCache.get(key);
  if (!body) {
    const raw = readFileSync(filePath);
    body = encoding === 'br'
      ? brotliCompressSync(raw, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 6, [zlibConstants.BROTLI_PARAM_SIZE_HINT]: raw.length } })
      : gzipSync(raw, { level: 6 });
    compressedCache.set(key, body);
  }
  return body;
};

// Only the hashed build files (dist/assets) and the fonts keep one name for one content, so only they
// are kept for a year. The page, the service worker, the manifest and version.json are checked on
// every visit, so a new build reaches everyone; icons and the rest keep their names, so a day.
// PDFs keep their names when they are rebuilt, so they are only cached for an hour.
const cacheControlFor = (filePath, ext) => {
  const name = basename(filePath);
  if (ext === '.html' || name === 'sw.js' || name === 'manifest.webmanifest' || name === 'version.json') return 'no-cache';
  if (ext === '.pdf') return 'public, max-age=3600';
  if (filePath.startsWith(join(root, 'assets') + sep) || /\.(ttf|woff2?)$/.test(ext)) return 'public, max-age=31536000, immutable';
  return 'public, max-age=86400';
};

const sendFile = (req, res, filePath, overrides = {}) => {
  const ext = extname(filePath).toLowerCase();
  const headers = {
    'Content-Type': contentTypes[ext] || 'application/octet-stream',
    'Cache-Control': cacheControlFor(filePath, ext),
    ...(ext === '.html' ? pageSecurityHeaders : securityHeaders),
    ...overrides,
    'X-Stories-Git-Sha': gitSha,
    'X-Stories-Revision': revision,
  };
  if (ext === '.html') {
    const cookie = previewCookieFor(req);
    if (cookie) headers['Set-Cookie'] = cookie;
  }
  if (compressible.has(ext)) {
    const accepted = String(req.headers['accept-encoding'] || '');
    const encoding = /\bbr\b/.test(accepted) ? 'br' : /\bgzip\b/.test(accepted) ? 'gzip' : null;
    headers.Vary = 'Accept-Encoding';
    if (encoding) {
      const body = compressed(filePath, encoding);
      res.writeHead(200, { ...headers, 'Content-Encoding': encoding, 'Content-Length': body.length });
      res.end(req.method === 'HEAD' ? undefined : body);
      return;
    }
  }
  res.writeHead(200, headers);
  createReadStream(filePath).pipe(res);
};

const sendMissingAsset = (res) => {
  res.writeHead(404, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    ...securityHeaders,
    'X-Stories-Git-Sha': gitSha,
    'X-Stories-Revision': revision,
  });
  res.end('Asset not found');
};

// Word timings for the reader's "follow along" marker live next to the chapter audio in
// Firebase Storage. Storage downloads carry no CORS header, so the app reads them here,
// on its own origin.
const storageBucket = 'gen-lang-client-0373200489.firebasestorage.app';
const sendAudioTimings = async (res, storagePath) => {
  try {
    const upstream = await fetch(
      `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(storagePath)}?alt=media`,
    );
    if (!upstream.ok) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=60' });
      res.end('Timings not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' });
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('Timings unavailable');
  }
};

// Chapter pictures and covers live in Firebase Storage as full-size PNGs (often 3200 x 4000,
// 2-3 MB) because the PDFs need them. The app gets a 1200 px wide WebP of the same picture
// (about 50 KB) from here. The source URL carries Storage's token, so a newly uploaded picture
// gets a new URL and the long browser cache never shows an old picture.
const imageCache = new Map();
const IMAGE_CACHE_LIMIT = 300;
let sharpModule;
const loadSharp = async () => {
  if (sharpModule === undefined) sharpModule = await import('sharp').then(m => m.default).catch(() => null);
  return sharpModule;
};
// Only a few widths are made, and the Storage address is rebuilt from its path, `alt` and
// `token` alone, so extra query parameters cannot force a new conversion for the same picture.
const IMAGE_WIDTHS = [480, 800, 1200, 1600, 2000];
const pickWidth = (requested) => IMAGE_WIDTHS.find(w => w >= requested) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
// New conversions are limited per visitor; pictures already in the cache are not counted.
const CONVERSIONS_PER_MINUTE = 60;
const conversionCounts = new Map();
const clientAddress = (req) => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
const allowConversion = (req) => {
  const now = Date.now();
  const address = clientAddress(req);
  const entry = conversionCounts.get(address);
  if (!entry || now - entry.start > 60_000) {
    if (conversionCounts.size > 10_000) conversionCounts.clear();
    conversionCounts.set(address, { start: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= CONVERSIONS_PER_MINUTE;
};
const sendMediaImage = async (req, res) => {
  const params = new URL(req.url || '/', 'http://local').searchParams;
  const src = params.get('src') || '';
  const width = pickWidth(Number(params.get('w')) || 1200);
  let requested;
  try {
    requested = new URL(src);
  } catch {
    requested = null;
  }
  if (!requested || requested.protocol !== 'https:' || requested.hostname !== 'firebasestorage.googleapis.com' || !requested.pathname.startsWith(`/v0/b/${storageBucket}/o/`)) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...securityHeaders });
    res.end('Bad image source');
    return;
  }
  const source = new URL(`https://firebasestorage.googleapis.com${requested.pathname}`);
  source.searchParams.set('alt', 'media');
  const token = requested.searchParams.get('token');
  if (token) source.searchParams.set('token', token);
  const key = `${width}:${source.href}`;
  const send = (body) => {
    res.writeHead(200, {
      'Content-Type': 'image/webp',
      'Content-Length': body.length,
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...securityHeaders,
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  const cached = imageCache.get(key);
  if (cached) {
    imageCache.delete(key);
    imageCache.set(key, cached);
    send(cached);
    return;
  }
  const sharp = await loadSharp();
  // Without the image library, or when a picture cannot be converted, the original is used.
  const fallBack = () => {
    res.writeHead(302, { Location: source.href, 'Cache-Control': 'no-store' });
    res.end();
  };
  if (!sharp || !allowConversion(req)) return fallBack();
  try {
    const upstream = await fetch(source.href);
    if (!upstream.ok) return fallBack();
    const body = await sharp(Buffer.from(await upstream.arrayBuffer()))
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    imageCache.set(key, body);
    if (imageCache.size > IMAGE_CACHE_LIMIT) imageCache.delete(imageCache.keys().next().value);
    send(body);
  } catch {
    fallBack();
  }
};

// Unpublished books are built into assets/hidden-*.js (vite.config.ts). When PREVIEW_KEY is set,
// those files are sent only to a browser that opened the app with ?gizli=<PREVIEW_KEY> (it then
// keeps a cookie for 30 days). Without PREVIEW_KEY everything is served as before.
const previewKey = process.env.PREVIEW_KEY || '';
const pdfBaseUrl = (process.env.PDF_BASE_URL || '').replace(/\/+$/, '');
const PREVIEW_COOKIE = 'stories_preview';
const hasPreviewCookie = (req) => String(req.headers.cookie || '')
  .split(';')
  .some(part => part.trim() === `${PREVIEW_COOKIE}=${encodeURIComponent(previewKey)}`);
const previewCookieFor = (req) => {
  if (!previewKey) return null;
  const query = new URL(req.url || '/', 'http://local').searchParams;
  if (query.get('gizli') !== previewKey) return null;
  return `${PREVIEW_COOKIE}=${encodeURIComponent(previewKey)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`;
};

// Anonymous counters. The app reports that a page was opened and that a script failed; nothing
// that identifies a visitor is read, kept or logged. The totals are written to the service log
// every five minutes, so a broken release is visible without collecting anybody's data.
const eventTotals = { open: 0, error: 0 };
const errorMessages = new Map();
const EVENT_BODY_LIMIT = 2048;

const logEventTotals = () => {
  if (eventTotals.open === 0 && eventTotals.error === 0) return;
  const top = [...errorMessages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  console.log(JSON.stringify({
    message: '[Stories] anonymous totals',
    openedPages: eventTotals.open,
    scriptErrors: eventTotals.error,
    topErrors: top.map(([text, count]) => ({ text, count })),
    revision,
  }));
  eventTotals.open = 0;
  eventTotals.error = 0;
  errorMessages.clear();
};
setInterval(logEventTotals, 5 * 60 * 1000).unref?.();

const readEvent = (req, res) => {
  let body = '';
  let tooBig = false;
  req.on('data', chunk => {
    body += chunk;
    if (body.length > EVENT_BODY_LIMIT) { tooBig = true; req.destroy(); }
  });
  req.on('end', () => {
    res.writeHead(204, { 'Cache-Control': 'no-store' });
    res.end();
    if (tooBig) return;
    try {
      const event = JSON.parse(body);
      if (event.kind === 'open') { eventTotals.open += 1; return; }
      if (event.kind !== 'error') return;
      eventTotals.error += 1;
      const text = `${String(event.message ?? '').slice(0, 200)} (${String(event.source ?? '').slice(0, 60)}:${Number(event.line) || 0}, ${String(event.screen ?? '').slice(0, 20)})`;
      errorMessages.set(text, (errorMessages.get(text) ?? 0) + 1);
    } catch {
      /* a malformed report is ignored */
    }
  });
};

const panelApi = createPanelApi();

const server = http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  // A signed-in team member gets the preview cookie, so the app shown inside the panel can open
  // the hidden books too. The key itself never reaches the browser's scripts (the cookie is HttpOnly).
  if (urlPath === '/panel-api/preview-access' && req.method === 'POST') {
    const member = await panelApi.memberFor(req);
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
    if (member && previewKey) headers['Set-Cookie'] = `${PREVIEW_COOKIE}=${encodeURIComponent(previewKey)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`;
    res.writeHead(member ? 200 : 401, headers);
    res.end(JSON.stringify({ hidden: Boolean(member && previewKey) }));
    return;
  }

  if (urlPath.startsWith('/panel-api/')) {
    await panelApi.handle(req, res, urlPath);
    return;
  }

  if (urlPath === '/__version') {
    const payload = JSON.stringify({ gitSha, gitRef, revision });
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Stories-Git-Sha': gitSha,
      'X-Stories-Revision': revision,
    });
    res.end(payload);
    return;
  }

  if (urlPath === '/__event' && req.method === 'POST') {
    readEvent(req, res);
    return;
  }

  if (urlPath === '/media-image') {
    sendMediaImage(req, res);
    return;
  }

  if (urlPath.startsWith('/audio-timings/')) {
    const storagePath = urlPath.slice('/audio-timings/'.length);
    if (!storagePath.endsWith('.timings.json') || storagePath.split('/').includes('..')) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    sendAudioTimings(res, storagePath);
    return;
  }

  if (previewKey && urlPath.startsWith('/assets/hidden-') && !hasPreviewCookie(req)) {
    return sendMissingAsset(res);
  }

  // The content panel and the book files it reads are a work tool. The panel page opens for a
  // browser that has the preview link, or for anyone once a team list (PANEL_TEAM) exists, since
  // it then asks for a Google sign-in. The book files go only to the preview link or to a
  // signed-in team member. With neither switched on, nothing here is served.
  if (urlPath === '/panel' || urlPath.startsWith('/panel/') || urlPath.startsWith('/content/')) {
    const previewOpen = Boolean(previewKey) && hasPreviewCookie(req);
    const isContent = urlPath.startsWith('/content/');
    const allowed = isContent ? previewOpen || Boolean(await panelApi.memberFor(req)) : previewOpen || panelApi.enabled;
    if (!allowed) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end('Not found');
      return;
    }
    if (urlPath === '/panel' || urlPath === '/panel/') {
      return sendFile(req, res, join(root, 'panel', 'panel.html'), panelPageHeaders);
    }
    if (isContent) {
      // Book files keep their names when they change, so the panel always reads the current one.
      const contentPath = join(root, normalize(urlPath).replace(/^([.][.][/\\])+/, ''));
      if (existsSync(contentPath) && statSync(contentPath).isFile()) {
        return sendFile(req, res, contentPath, { 'Cache-Control': 'private, no-store' });
      }
    }
  }

  // The book PDFs and the About page's media kit live on Cloudflare R2 (README, "Book PDFs");
  // /pdfs/books/<name>.pdf and /pdfs/media-kit/<name>.(pdf|zip) answer with a redirect to PDF_BASE_URL,
  // so the links in the app stay the same.
  // The media kit is passed through as a download of this site: an installed phone app does not
  // follow a "download" link that leaves the site, so the brand guide and logo files stayed unsaved.
  if (pdfBaseUrl && /^\/pdfs\/media-kit\/[a-z0-9-]+\.(pdf|zip)$/.test(urlPath) && (req.method === 'GET' || req.method === 'HEAD')) {
    try {
      const upstream = await fetch(`${pdfBaseUrl}${urlPath.slice('/pdfs'.length)}`);
      if (upstream.ok && upstream.body) {
        res.writeHead(200, {
          'Content-Type': urlPath.endsWith('.zip') ? 'application/zip' : 'application/pdf',
          'Content-Disposition': `attachment; filename="${basename(urlPath)}"`,
          ...(upstream.headers.get('content-length') ? { 'Content-Length': upstream.headers.get('content-length') } : {}),
          'Cache-Control': 'public, max-age=300',
        });
        if (req.method === 'HEAD') { res.end(); upstream.body.cancel().catch(() => {}); return; }
        Readable.fromWeb(upstream.body).on('error', () => res.destroy()).pipe(res);
        return;
      }
    } catch {
      /* fall through to the redirect below */
    }
  }
  if (pdfBaseUrl && /^\/pdfs\/(books\/[a-z0-9-]+\.pdf|media-kit\/[a-z0-9-]+\.(pdf|zip))$/.test(urlPath)) {
    res.writeHead(302, { Location: `${pdfBaseUrl}${urlPath.slice('/pdfs'.length)}`, 'Cache-Control': 'public, max-age=300' });
    res.end();
    return;
  }

  const safePath = normalize(urlPath).replace(/^([.][.][/\\])+/, '');
  let filePath = join(root, safePath === '/' ? 'index.html' : safePath);

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    return sendFile(req, res, filePath);
  }

  // Never serve the SPA HTML fallback for a missing hashed Vite asset. A stale
  // browser bundle may request a chunk from the previous Cloud Run revision;
  // returning HTML for that request turns a recoverable 404 into a JS module
  // MIME/fetch failure. Let the client detect the missing chunk and reload.
  if (urlPath.startsWith('/assets/')) {
    return sendMissingAsset(res);
  }

  if (urlPath.startsWith('/pdfs/')) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('PDF not found');
    return;
  }

  filePath = join(root, 'index.html');
  if (existsSync(filePath)) {
    return sendFile(req, res, filePath);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Stories app listening on port ${port} (${gitRef}@${gitSha}, revision ${revision})`);
});
