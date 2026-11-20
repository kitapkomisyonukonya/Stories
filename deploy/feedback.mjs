import { createHash, randomUUID } from 'node:crypto';

/**
 * The feedback form (src/components/layout/FeedbackPage.tsx) posts here; the content panel reads it.
 *
 * Each entry is one small JSON file under panel-state/feedback/<year-month>/, a folder the Storage
 * rules keep closed to browsers, so only the server (and through it the signed-in team) reads it.
 * Nothing that names a person is kept: the form asks for no name, school, e-mail or account; the
 * server also blanks out e-mail addresses and phone numbers someone typed into the free text, and
 * it never writes the sender's address anywhere (the short-term limit below keeps a one-way hash
 * of it in memory for ten minutes, then forgets it).
 */

export const FEEDBACK_PREFIX = 'panel-state/feedback/';
const BODY_LIMIT = 16 * 1024;
const TEXT_LIMIT = 2000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const LIST_LIMIT = 2000;

const LANGS = new Set(['tr', 'en', 'ar']);
const ROLES = new Set(['student', 'teacher', 'parent', 'other']);
const LEVELS = new Set(['A1', 'A2', 'B1', 'B2']);
const QUESTIONS = ['overall', 'ease', 'level', 'exercises', 'media'];
const DEVICES = new Set(['phone', 'tablet', 'computer']);

const EMAIL = /[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/gi;
// Ten or more digits, allowing spaces, dots, dashes and brackets between them (phone numbers).
const PHONE = /\+?\d(?:[\s().-]*\d){9,}/g;

/** Free text without e-mail addresses or phone numbers. */
export const scrubText = value =>
  String(value ?? '')
    .slice(0, TEXT_LIMIT)
    .replace(EMAIL, '[…]')
    .replace(PHONE, '[…]')
    .trim();

/** The entry as it is stored, or null when nothing was answered. */
export const cleanEntry = raw => {
  if (!raw || typeof raw !== 'object') return null;
  const ratings = {};
  for (const question of QUESTIONS) {
    const score = Number(raw.ratings?.[question]);
    if (Number.isInteger(score) && score >= 1 && score <= 5) ratings[question] = score;
  }
  const entry = {
    formLang: LANGS.has(raw.formLang) ? raw.formLang : 'en',
    appLang: raw.appLang === 'ar' ? 'ar' : 'en',
    role: ROLES.has(raw.role) ? raw.role : null,
    storyId: typeof raw.storyId === 'string' && /^[a-z0-9-]{1,40}$/.test(raw.storyId) ? raw.storyId : null,
    level: LEVELS.has(raw.level) ? raw.level : null,
    ratings,
    liked: scrubText(raw.liked),
    problems: scrubText(raw.problems),
    ideas: scrubText(raw.ideas),
    device: DEVICES.has(raw.device) ? raw.device : null,
  };
  const answered = Object.keys(ratings).length > 0 || entry.liked || entry.problems || entry.ideas;
  return answered ? entry : null;
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

export const createFeedback = ({ storage, now = () => new Date() } = {}) => {
  const recent = new Map();
  const allow = req => {
    const address = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    const key = createHash('sha256').update(address).digest('hex').slice(0, 16);
    const time = now().getTime();
    const times = (recent.get(key) ?? []).filter(at => time - at < WINDOW_MS);
    if (recent.size > 5000) for (const [other, list] of recent) if (!list.some(at => time - at < WINDOW_MS)) recent.delete(other);
    if (times.length >= MAX_PER_WINDOW) {
      recent.set(key, times);
      return false;
    }
    times.push(time);
    recent.set(key, times);
    return true;
  };

  let cache = { entries: null, until: 0 };

  /** POST /feedback-api/send from the app. */
  const handleSend = async (req, res) => {
    let raw;
    try {
      raw = JSON.parse(await readBody(req));
    } catch (error) {
      sendJson(res, error.status === 413 ? 413 : 400, { error: 'bad request' });
      return;
    }
    // A form-filling robot fills the hidden field; it is told "thanks" and nothing is kept.
    if (raw && typeof raw.website === 'string' && raw.website.trim()) {
      sendJson(res, 200, { ok: true });
      return;
    }
    const entry = cleanEntry(raw);
    if (!entry) {
      sendJson(res, 400, { error: 'empty' });
      return;
    }
    if (!allow(req)) {
      sendJson(res, 429, { error: 'busy' });
      return;
    }
    if (!storage) {
      sendJson(res, 503, { error: 'not available' });
      return;
    }
    const at = now().toISOString();
    const id = `${at.replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
    try {
      await storage.writeJson(`${FEEDBACK_PREFIX}${at.slice(0, 7)}/${id}.json`, { id, at, ...entry });
      cache = { entries: null, until: 0 };
      sendJson(res, 200, { ok: true });
    } catch (error) {
      console.error('[Feedback] not saved:', error.message);
      sendJson(res, 502, { error: 'not saved' });
    }
  };

  /** Every entry, newest first, for the panel. */
  const list = async () => {
    if (!storage) return [];
    if (cache.entries && Date.now() < cache.until) return cache.entries;
    const paths = (await storage.list(FEEDBACK_PREFIX)).filter(path => path.endsWith('.json')).sort().reverse().slice(0, LIST_LIMIT);
    const entries = [];
    for (let start = 0; start < paths.length; start += 25) {
      const batch = await Promise.all(paths.slice(start, start + 25).map(path => storage.readJson(path).then(entry => (entry ? { ...entry, path } : null)).catch(() => null)));
      entries.push(...batch.filter(Boolean));
    }
    cache = { entries, until: Date.now() + 20_000 };
    return entries;
  };

  const remove = async path => {
    if (!storage) return;
    if (typeof path !== 'string' || !path.startsWith(FEEDBACK_PREFIX) || path.includes('..') || !path.endsWith('.json')) {
      throw Object.assign(new Error('Bu kayıt silinemez.'), { status: 400, plain: true });
    }
    await storage.remove(path);
    cache = { entries: null, until: 0 };
  };

  return { handleSend, list, remove };
};
