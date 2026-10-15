import { useSyncExternalStore } from 'react';
import type { Level } from '../../types';
import index from '../../content/seyahatname.json';
import type { EditionIndex } from './places';

/**
 * Seyahatname, the reader's travel journal. A chapter stamp is pressed when the chapter's Quick Challenge
 * is done (in English or Arabic); a book seal when the Final Challenge is finished. Everything stays on
 * this device. Nothing is ever taken away: no streaks to lose, no locks, no ranking.
 */
export interface JournalState {
  /** "storyId:level:chapter" → when it was pressed (0: done before the journal existed). */
  stamps: Record<string, number>;
  /** "storyId:level" → when the book was sealed. */
  seals: Record<string, number>;
  /** Books whose earlier progress was already stamped quietly. */
  seen: string[];
  /** Chapters a week; 0 = no goal. */
  goal: number;
}

export const EDITIONS = (index as unknown as { editions: Record<string, EditionIndex> }).editions;
export const editionKey = (storyId: string, level: Level | string) => `${storyId}:${level}`;
export const stampKey = (storyId: string, level: Level | string, chapter: number) => `${storyId}:${level}:${chapter}`;

const STORAGE_KEY = 'v2:seyahatname';
const CHANGE_EVENT = 'v2-seyahatname-change';
const EMPTY: JournalState = { stamps: {}, seals: {}, seen: [], goal: 0 };

let cache: JournalState | null = null;

/** Books finished before the journal existed carry the older "completed_" flag; they count as sealed. */
const legacySeals = (): Record<string, number> => {
  const seals: Record<string, number> = {};
  try {
    for (const key of Object.keys(EDITIONS)) {
      const [storyId, level] = key.split(':');
      if (localStorage.getItem(`completed_${storyId}_${level}`) === 'true') seals[key] = 0;
    }
  } catch {
    /* storage unavailable */
  }
  return seals;
};

const read = (): JournalState => {
  if (cache) return cache;
  let stored: Partial<JournalState> = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') ?? {};
  } catch {
    stored = {};
  }
  const record = (value: unknown) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([, at]) => typeof at === 'number')) as Record<string, number>
      : {};
  cache = {
    stamps: record(stored.stamps),
    seals: { ...legacySeals(), ...record(stored.seals) },
    seen: Array.isArray(stored.seen) ? stored.seen.filter(item => typeof item === 'string') : [],
    goal: typeof stored.goal === 'number' && stored.goal >= 0 && stored.goal <= 20 ? stored.goal : 0,
  };
  return cache;
};

const write = (next: JournalState) => {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* the journal then lasts for this session only */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

const subscribe = (callback: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && !event.key?.startsWith('completed_')) return;
    cache = null;
    callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
};

export const useJournal = () => useSyncExternalStore(subscribe, read, () => EMPTY);
export const readJournal = read;

/** Chapters (1-based) whose Quick Challenge is done, by either language's exercise id. */
export const doneChapters = (storyId: string, level: Level | string, doneExercises: Iterable<string>): number[] => {
  const edition = EDITIONS[editionKey(storyId, level)];
  if (!edition) return [];
  const done = new Set(doneExercises);
  return edition.chapters
    .map((_, i) => i + 1)
    .filter(n => {
      const en = edition.quick.en[n - 1];
      const ar = edition.quick.ar[n - 1];
      return Boolean((en && done.has(en)) || (ar && done.has(ar)));
    });
};

/**
 * Presses the stamps for the chapters now done. The first time a book is seen, earlier progress is
 * stamped quietly; after that the newly pressed chapters are returned, so the reader sees the moment.
 */
export const pressStamps = (storyId: string, level: Level, doneExercises: Iterable<string>): number[] => {
  const key = editionKey(storyId, level);
  if (!EDITIONS[key]) return [];
  const state = read();
  const chapters = doneChapters(storyId, level, doneExercises);
  const firstVisit = !state.seen.includes(key);
  const fresh = chapters.filter(n => state.stamps[stampKey(storyId, level, n)] === undefined);
  if (!fresh.length && !firstVisit) return [];
  const now = Date.now();
  const stamps = { ...state.stamps };
  fresh.forEach(n => { stamps[stampKey(storyId, level, n)] = firstVisit ? 0 : now; });
  write({ ...state, stamps, seen: firstVisit ? [...state.seen, key] : state.seen });
  return firstVisit ? [] : fresh;
};

export const sealBook = (storyId: string, level: Level) => {
  const key = editionKey(storyId, level);
  const state = read();
  if (state.seals[key] !== undefined) return;
  write({ ...state, seals: { ...state.seals, [key]: Date.now() } });
};

export const setWeeklyGoal = (goal: number) => write({ ...read(), goal: Math.max(0, Math.min(20, Math.round(goal))) });

/** Adds a journal brought from another device; nothing already here is removed. */
export const mergeJournal = (incoming: Partial<JournalState>) => {
  const state = read();
  const keep = (mine: Record<string, number>, theirs: Record<string, number> | undefined) => {
    const out = { ...mine };
    Object.entries(theirs ?? {}).forEach(([key, at]) => {
      if (typeof at === 'number' && out[key] === undefined) out[key] = at;
    });
    return out;
  };
  write({
    stamps: keep(state.stamps, incoming.stamps),
    seals: keep(state.seals, incoming.seals),
    seen: [...new Set([...state.seen, ...Object.keys(incoming.seals ?? {}), ...Object.keys(incoming.stamps ?? {}).map(key => key.split(':').slice(0, 2).join(':'))])],
    goal: state.goal || (typeof incoming.goal === 'number' ? incoming.goal : 0),
  });
};

/** Monday 00:00 of the week `at` falls in, local time. */
export const weekStart = (at: number) => {
  const day = new Date(at);
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return day.getTime();
};

export const stampsThisWeek = (state: JournalState, now = Date.now()) => {
  const start = weekStart(now);
  return Object.values(state.stamps).filter(at => at >= start).length;
};

/** Weeks (before this one) in which the goal was reached. A total, never a streak that breaks. */
export const weeksOnTarget = (state: JournalState, now = Date.now()) => {
  if (!state.goal) return 0;
  const perWeek = new Map<number, number>();
  Object.values(state.stamps).forEach(at => {
    if (at > 0) perWeek.set(weekStart(at), (perWeek.get(weekStart(at)) ?? 0) + 1);
  });
  const current = weekStart(now);
  return [...perWeek.entries()].filter(([week, count]) => count >= state.goal && week !== current).length
    + (stampsThisWeek(state, now) >= state.goal ? 1 : 0);
};

export const editionStamps = (state: JournalState, storyId: string, level: Level | string) => {
  const edition = EDITIONS[editionKey(storyId, level)];
  if (!edition) return [];
  return edition.chapters.map((_, i) => state.stamps[stampKey(storyId, level, i + 1)] !== undefined);
};
