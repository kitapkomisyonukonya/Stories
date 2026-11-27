import { createHash, randomUUID } from 'node:crypto';

/**
 * Anonymous usage counts (src/lib/stats.ts posts here; the panel's "İstatistikler" page reads them).
 *
 * The app sends only "one more" for a few counters. The server adds them up in memory, per day,
 * and every minute writes this server's totals for the day to one small JSON file:
 * panel-state/stats/<site>/<YYYY-MM-DD>/<server>.json. Each running server writes only its own
 * file, so two servers never overwrite each other; the panel adds the files up. Nothing that
 * names a person or a device is kept: no address, no cookie, no id. The short-term limit below
 * keeps a one-way hash of the sender's address in memory for ten minutes, then forgets it.
 * panel-state/ is closed to browsers by the Storage rules.
 */

export const STATS_PREFIX = 'panel-state/stats/';
const BODY_LIMIT = 8 * 1024;
const MAX_HITS = 40;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 400;
const FLUSH_MS = 60 * 1000;
const MAX_KEYS = 3000;
const MAX_DAYS = 400;
// Turkey keeps UTC+3 all year, so days and hours are counted in Turkish time.
const TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000;

const MODES = new Set(['app', 'browser']);
const DEVICES = new Set(['phone', 'tablet', 'computer']);
const SYSTEMS = new Set(['android', 'ios', 'windows', 'mac', 'linux', 'chromeos', 'other']);
const LANGS = new Set(['en', 'ar']);
const LEVELS = new Set(['Pre-A1', 'A1', 'A2', 'B1', 'B2']);
const FEATURES = new Set(['offline', 'pdf', 'journal', 'teacher-guide', 'self-study']);
const STORY = /^[a-z0-9-]{1,40}$/;

const turkeyTime = date => new Date(date.getTime() + TURKEY_OFFSET_MS);
export const dayOf = date => turkeyTime(date).toISOString().slice(0, 10);
const hourOf = date => turkeyTime(date).getUTCHours();

export const emptyDay = () => ({
  visits: 0,
  newDevices: 0,
  installs: 0,
  launches: 0,
  bookOpens: 0,
  pages: 0,
  audio: 0,
  mode: {},
  device: {},
  os: {},
  lang: {},
  installOs: {},
  hours: Array(24).fill(0),
  books: {},
  levels: {},
  bookPages: {},
  bookAudio: {},
  features: {},
});

const bump = (map, key, by = 1) => {
  if (!(key in map) && Object.keys(map).length >= MAX_KEYS) return;
  map[key] = (map[key] ?? 0) + by;
};

/** Adds one hit to a day's totals; returns false for anything that is not a known counter. */
export const addHit = (day, hit, at) => {
  if (!hit || typeof hit !== 'object') return false;
  const story = typeof hit.s === 'string' && STORY.test(hit.s) ? hit.s : null;
  const level = LEVELS.has(hit.l) ? hit.l : null;
  const lang = LANGS.has(hit.lang) ? hit.lang : null;
  const book = story && level ? `${story}|${level}${lang ? `|${lang}` : ''}` : null;
  switch (hit.k) {
    case 'visit':
      day.visits += 1;
      if (hit.new === true) day.newDevices += 1;
      if (MODES.has(hit.mode)) bump(day.mode, hit.mode);
      if (DEVICES.has(hit.device)) bump(day.device, hit.device);
      if (SYSTEMS.has(hit.os)) bump(day.os, hit.os);
      if (lang) bump(day.lang, lang);
      day.hours[hourOf(at)] += 1;
      return true;
    case 'install':
      day.installs += 1;
      if (SYSTEMS.has(hit.os)) bump(day.installOs, hit.os);
      return true;
    case 'launch':
      day.launches += 1;
      return true;
    case 'book':
      if (!book) return false;
      day.bookOpens += 1;
      bump(day.books, book);
      bump(day.levels, level);
      return true;
    case 'page':
      if (!book) return false;
      day.pages += 1;
      bump(day.bookPages, book);
      return true;
    case 'audio':
      day.audio += 1;
      if (book) bump(day.bookAudio, book);
      return true;
    case 'feature':
      if (!FEATURES.has(hit.f)) return false;
      bump(day.features, hit.f);
      return true;
    default:
      return false;
  }
};

/** Adds day totals together (the panel's sum of every server's file). */
export const mergeDays = (into, from) => {
  for (const [key, value] of Object.entries(from ?? {})) {
    if (typeof value === 'number') into[key] = (into[key] ?? 0) + value;
    else if (Array.isArray(value)) value.forEach((count, index) => { into[key][index] = (into[key][index] ?? 0) + (Number(count) || 0); });
    else if (value && typeof value === 'object' && into[key] && typeof into[key] === 'object') {
      for (const [inner, count] of Object.entries(value)) into[key][inner] = (into[key][inner] ?? 0) + (Number(count) || 0);
    }
  }
  return into;
};

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};

const readBody = req =>
  new Promise((resolve, reject) => {
    let body = '';
    let tooBig = false;
    req.on('data', chunk => {
      if (tooBig) return;
      body += chunk;
      if (body.length > BODY_LIMIT) tooBig = true;
    });
    req.on('end', () => (tooBig ? reject(Object.assign(new Error('too big'), { status: 413 })) : resolve(body)));
    req.on('error', reject);
  });

export const siteOf = (env = process.env) => (String(env.K_SERVICE || 'stories-preview').includes('preview') ? 'preview' : 'live');

export const createStats = ({ storage, site = siteOf(), server = randomUUID().slice(0, 12), now = () => new Date() } = {}) => {
  const days = new Map();
  const dirty = new Set();
  const recent = new Map();
  let lastFlush = now().getTime();
  let flushing = null;

  const allow = (req, count) => {
    const address = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    const key = createHash('sha256').update(address).digest('hex').slice(0, 16);
    const time = now().getTime();
    const entry = recent.get(key);
    const fresh = entry && time - entry.since < WINDOW_MS ? entry : { since: time, count: 0 };
    if (recent.size > 5000) for (const [other, value] of recent) if (time - value.since >= WINDOW_MS) recent.delete(other);
    if (fresh.count + count > MAX_PER_WINDOW) {
      recent.set(key, fresh);
      return false;
    }
    fresh.count += count;
    recent.set(key, fresh);
    return true;
  };

  const pathFor = day => `${STATS_PREFIX}${site}/${day}/${server}.json`;

  /** Writes this server's changed days. Old days leave memory once written. */
  const flush = async () => {
    if (!storage) return;
    if (flushing) return flushing;
    flushing = (async () => {
      const today = dayOf(now());
      for (const day of [...dirty]) {
        dirty.delete(day);
        try {
          await storage.writeJson(pathFor(day), { site, day, server, updatedAt: now().toISOString(), totals: days.get(day) });
        } catch (error) {
          dirty.add(day);
          console.error('[Stats] not saved:', error.message);
        }
      }
      for (const day of days.keys()) if (day !== today && !dirty.has(day)) days.delete(day);
      lastFlush = now().getTime();
    })().finally(() => {
      flushing = null;
    });
    return flushing;
  };

  /** POST /stats-api/hit from the app: { hits: [{ k: 'visit', … }, …] }. */
  const handleHit = async (req, res) => {
    let raw;
    try {
      raw = JSON.parse(await readBody(req));
    } catch (error) {
      sendJson(res, error.status === 413 ? 413 : 400, { error: 'bad request' });
      return;
    }
    const hits = Array.isArray(raw?.hits) ? raw.hits.slice(0, MAX_HITS) : [];
    if (!hits.length) {
      sendJson(res, 400, { error: 'empty' });
      return;
    }
    if (!allow(req, hits.length)) {
      sendJson(res, 429, { error: 'busy' });
      return;
    }
    const at = now();
    const day = dayOf(at);
    if (!days.has(day)) days.set(day, emptyDay());
    let counted = 0;
    for (const hit of hits) if (addHit(days.get(day), hit, at)) counted += 1;
    if (counted) dirty.add(day);
    sendJson(res, 200, { ok: true });
    if (dirty.size && at.getTime() - lastFlush >= FLUSH_MS) void flush();
  };

  /** Totals per day, oldest first, for the panel: every server's file added up. */
  const report = async ({ site: wanted = site, from, to } = {}) => {
    if (!storage) return { site: wanted, days: [] };
    if (wanted === site) await flush();
    const prefix = `${STATS_PREFIX}${wanted}/`;
    const paths = (await storage.list(prefix)).filter(path => path.endsWith('.json'));
    const byDay = new Map();
    for (const path of paths) {
      const day = path.slice(prefix.length, prefix.length + 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || (from && day < from) || (to && day > to)) continue;
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(path);
    }
    const wantedDays = [...byDay.keys()].sort().slice(-MAX_DAYS);
    const result = [];
    for (const day of wantedDays) {
      const totals = emptyDay();
      const files = await Promise.all(byDay.get(day).map(path => storage.readJson(path).catch(() => null)));
      for (const file of files) if (file?.totals) mergeDays(totals, file.totals);
      result.push({ day, ...totals });
    }
    return { site: wanted, days: result };
  };

  const timer = setInterval(() => {
    if (dirty.size) void flush();
  }, FLUSH_MS);
  timer.unref?.();

  return { handleHit, report, flush, site };
};
