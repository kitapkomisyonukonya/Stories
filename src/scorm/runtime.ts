import { SCORM } from './config';

/**
 * SCORM 1.2 runtime: finds the LMS's API object, opens the session, and reports where the learner is,
 * whether the book is finished and the Final Challenge score. Outside an LMS (no API found) every call is a
 * no-op, so the package also opens as a plain page.
 *
 * What is reported:
 * - cmi.core.lesson_location: the page index, so the LMS reopens the book where the learner stopped.
 * - cmi.core.lesson_status: "incomplete" from the first open, "completed" once every chapter was opened and
 *   the Final Challenge led to the book's summary.
 * - cmi.core.score.raw (0-100): the Final Challenge score, when the learner has one.
 * - cmi.suspend_data: the book's progress (pages read, activities done), so it follows the learner to
 *   another computer. SCORM 1.2 allows 4096 characters; larger progress is cut to what fits.
 * - cmi.core.session_time on exit.
 */

interface Scorm12Api {
  LMSInitialize(arg: ''): string;
  LMSFinish(arg: ''): string;
  LMSGetValue(element: string): string;
  LMSSetValue(element: string, value: string): string;
  LMSCommit(arg: ''): string;
  LMSGetLastError(): string;
}

const findApi = (): Scorm12Api | null => {
  const search = (start: Window | null): Scorm12Api | null => {
    let win: Window | null = start;
    for (let depth = 0; win && depth < 10; depth += 1) {
      try {
        const api = (win as unknown as { API?: Scorm12Api }).API;
        if (api && typeof api.LMSInitialize === 'function') return api;
      } catch {
        // A frame from another site: keep looking further up.
      }
      if (win.parent === win) break;
      win = win.parent;
    }
    return null;
  };
  if (typeof window === 'undefined') return null;
  return search(window) ?? (window.opener ? search(window.opener as Window) : null);
};

let api: Scorm12Api | null = null;
let started = false;
let finished = false;
let startedAt = 0;
let status = '';
let commitTimer: number | undefined;

const get = (element: string): string => {
  if (!api) return '';
  try {
    return api.LMSGetValue(element) ?? '';
  } catch {
    return '';
  }
};

const set = (element: string, value: string) => {
  if (!api || finished) return;
  try {
    api.LMSSetValue(element, value);
  } catch {
    /* the LMS refused one value; the others still go */
  }
};

const commitSoon = () => {
  if (!api || finished) return;
  window.clearTimeout(commitTimer);
  commitTimer = window.setTimeout(() => {
    try {
      api?.LMSCommit('');
    } catch {
      /* next commit or LMSFinish sends it */
    }
  }, 1500);
};

/** SCORM 1.2 time format HHHH:MM:SS.SS */
const sessionTime = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(4, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const progressKey = () => (SCORM ? `book_progress_${SCORM.storyId}_${SCORM.level}` : '');
const completedKey = () => (SCORM ? `completed_${SCORM.storyId}_${SCORM.level}` : '');

/** Progress saved by the LMS goes back into the browser before the app reads it. */
const restoreProgress = () => {
  const saved = get('cmi.suspend_data');
  if (saved) {
    try {
      const data = JSON.parse(saved) as { r?: number[]; d?: string[]; t?: number };
      const local = JSON.parse(localStorage.getItem(progressKey()) || 'null') as
        | { readPages?: number[]; doneExercises?: string[]; totalPages?: number }
        | null;
      const merged = {
        readPages: [...new Set([...(local?.readPages ?? []), ...(data.r ?? [])])].sort((a, b) => a - b),
        doneExercises: [...new Set([...(local?.doneExercises ?? []), ...(data.d ?? [])])],
        totalPages: local?.totalPages || data.t || 0,
      };
      localStorage.setItem(progressKey(), JSON.stringify(merged));
    } catch {
      /* unreadable progress: the book starts fresh */
    }
  }
  if (status === 'completed' || status === 'passed') {
    try {
      localStorage.setItem(completedKey(), 'true');
    } catch {
      /* storage blocked */
    }
  }
};

/** Opens the LMS session. Called once, before the app is drawn. */
export const startScorm = () => {
  if (!SCORM || started) return;
  started = true;
  api = findApi();
  if (!api) return;
  try {
    if (api.LMSInitialize('') !== 'true') {
      api = null;
      return;
    }
  } catch {
    api = null;
    return;
  }
  startedAt = Date.now();
  status = get('cmi.core.lesson_status');
  if (!status || status === 'not attempted') {
    status = 'incomplete';
    set('cmi.core.lesson_status', 'incomplete');
  }
  set('cmi.core.score.min', '0');
  set('cmi.core.score.max', '100');
  restoreProgress();
  commitSoon();

  const finish = () => {
    if (!api || finished) return;
    set('cmi.core.session_time', sessionTime(Date.now() - startedAt));
    set('cmi.core.exit', status === 'completed' ? '' : 'suspend');
    try {
      api.LMSCommit('');
      api.LMSFinish('');
    } catch {
      /* the LMS window is already closing */
    }
    finished = true;
  };
  window.addEventListener('pagehide', finish);
  window.addEventListener('beforeunload', finish);
};

/** The page the LMS saved last time, or null. */
export const scormResumePage = (): number | null => {
  const value = Number.parseInt(get('cmi.core.lesson_location'), 10);
  return Number.isInteger(value) && value >= 0 ? value : null;
};

export const reportPage = (pageIndex: number) => {
  if (!api) return;
  set('cmi.core.lesson_location', String(pageIndex));
  commitSoon();
};

export const reportProgress = (progress: { readPages: number[]; doneExercises: string[]; totalPages: number }) => {
  if (!api) return;
  const data = { r: progress.readPages, d: [...progress.doneExercises], t: progress.totalPages };
  let text = JSON.stringify(data);
  // SCORM 1.2 keeps at most 4096 characters: drop the oldest activities until it fits.
  while (text.length > 4096 && data.d.length) {
    data.d.shift();
    text = JSON.stringify(data);
  }
  if (text.length <= 4096) set('cmi.suspend_data', text);
  commitSoon();
};

/** At the book's summary: the Final Challenge score, and "completed" once every chapter was opened too. */
export const reportResult = (score: number | null, allChaptersRead: boolean) => {
  if (!api) return;
  if (score !== null && Number.isFinite(score)) {
    set('cmi.core.score.raw', String(Math.max(0, Math.min(100, Math.round(score)))));
  }
  if (allChaptersRead && status !== 'completed') {
    status = 'completed';
    set('cmi.core.lesson_status', 'completed');
  }
  commitSoon();
};
