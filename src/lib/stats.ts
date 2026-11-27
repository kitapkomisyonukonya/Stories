import { detectDevice } from './feedback';
import { parseHashRoute } from './hashRoute';
import { isStandalone } from './pwa';

/**
 * Anonymous usage counts for the content panel's "İstatistikler" page.
 *
 * The app only says "one more" to a few counters: a device visited today, a device added the app
 * to its home screen, the app was opened from the home screen, a book or page was opened, a
 * recording was played, a PDF was downloaded. No name, account, address, cookie or device id is
 * sent, and the server keeps only totals per day. The browser keeps three marks of its own so the
 * same device is not counted twice ("counted today", "seen before", "installed"); they never
 * leave the device. A visitor who asked not to be tracked (Do Not Track) is not counted at all.
 */

const ENDPOINT = '/stats-api/hit';
const DAY_KEY = 'v2:stats-day';
const SEEN_KEY = 'v2:stats-seen';
const INSTALLED_KEY = 'v2:stats-installed';
const FLUSH_MS = 15_000;
const MAX_BATCH = 40;

export type StatsFeature = 'offline' | 'pdf' | 'journal' | 'teacher-guide' | 'self-study';

type Hit = Record<string, string | number | boolean>;

let queue: Hit[] = [];
let started = false;
const sessionOnce = new Set<string>();

const allowed = () => {
  try {
    if (!import.meta.env.PROD || navigator.doNotTrack === '1') return false;
    // The app shown inside the content panel is the team at work, not a reader.
    if (window.top !== window.self && window.top?.location.pathname.startsWith('/panel')) return false;
    return true;
  } catch {
    // A cross-origin parent (an embedding site) cannot be read: those readers are counted.
    return true;
  }
};

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the mark is not kept */
  }
};

const appLang = () => (read('app_language') === 'ar' ? 'ar' : 'en');

const os = () => {
  const agent = navigator.userAgent;
  if (/Android/i.test(agent)) return 'android';
  if (/iPad|iPhone|iPod/.test(agent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Windows/i.test(agent)) return 'windows';
  if (/CrOS/i.test(agent)) return 'chromeos';
  if (/Macintosh|Mac OS X/i.test(agent)) return 'mac';
  if (/Linux/i.test(agent)) return 'linux';
  return 'other';
};

const localDay = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const flush = () => {
  if (!queue.length) return;
  const hits = queue.slice(0, MAX_BATCH);
  queue = queue.slice(MAX_BATCH);
  try {
    const body = JSON.stringify({ hits });
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))) return;
    void fetch(ENDPOINT, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => undefined);
  } catch {
    /* the app never waits for this */
  }
  if (queue.length) flush();
};

const add = (hit: Hit, onceKey?: string) => {
  if (!started) return;
  if (onceKey) {
    if (sessionOnce.has(onceKey)) return;
    sessionOnce.add(onceKey);
  }
  queue.push(hit);
  if (queue.length >= MAX_BATCH) flush();
};

const countInstall = (how: string) => {
  if (read(INSTALLED_KEY)) return;
  write(INSTALLED_KEY, localDay());
  add({ k: 'install', os: os(), how });
};

const currentBook = () => {
  const route = parseHashRoute(window.location.hash);
  return route ? { s: route.storyId, l: route.level, lang: appLang(), p: route.pageIndex + 1 } : null;
};

const watchRoute = () => {
  const book = currentBook();
  if (!book) return;
  add({ k: 'book', s: book.s, l: book.l, lang: book.lang }, `book|${book.s}|${book.l}|${book.lang}`);
  add({ k: 'page', s: book.s, l: book.l, lang: book.lang, p: book.p }, `page|${book.s}|${book.l}|${book.lang}|${book.p}`);
};

/** One use of a feature (a PDF, the journal, a guide…), at most once per visit for each book. */
export const countFeature = (feature: StatsFeature) => {
  const book = currentBook();
  add({ k: 'feature', f: feature, ...(book ? { s: book.s, l: book.l } : {}) }, `feature|${feature}|${book?.s ?? ''}|${book?.l ?? ''}`);
};

export const startStats = () => {
  if (started || typeof window === 'undefined' || !allowed()) return;
  started = true;
  const standalone = isStandalone();

  const today = localDay();
  if (read(DAY_KEY) !== today) {
    const isNew = !read(SEEN_KEY);
    write(DAY_KEY, today);
    if (isNew) write(SEEN_KEY, '1');
    add({ k: 'visit', mode: standalone ? 'app' : 'browser', device: detectDevice(), os: os(), lang: appLang(), new: isNew });
  }

  if (standalone) {
    // iPhone and iPad give no "installed" signal: the first start from the home screen is the install.
    countInstall('first-launch');
    add({ k: 'launch', os: os() }, 'launch');
  }
  window.addEventListener('appinstalled', () => countInstall('prompt'));

  watchRoute();
  window.addEventListener('hashchange', watchRoute);

  // A recording started anywhere in the app (play events do not bubble, so listen while capturing).
  document.addEventListener(
    'play',
    event => {
      const target = event.target as HTMLMediaElement | null;
      if (!target || target.tagName !== 'AUDIO') return;
      const book = currentBook();
      const src = target.currentSrc || target.src || '';
      add({ k: 'audio', ...(book ? { s: book.s, l: book.l, lang: book.lang } : {}) }, `audio|${src}`);
    },
    true,
  );

  // A PDF link (book PDFs, guides) opened or downloaded.
  document.addEventListener(
    'click',
    event => {
      const link = (event.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (link && /\.pdf(\?|#|$)/i.test(link.href)) countFeature('pdf');
    },
    true,
  );

  window.setInterval(flush, FLUSH_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
  window.setTimeout(flush, 3000);
};
