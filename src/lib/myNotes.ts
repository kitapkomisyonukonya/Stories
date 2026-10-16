import { useSyncExternalStore } from 'react';

/**
 * "My notes": what a learner writes in the Self-Study Guide (the note grid, the summary from the notes, the
 * translation, the home retelling and the reading diary). Kept on this device only, like My words.
 */
export interface ChapterNotes {
  cells: string[];
  summary: string;
  translation: string;
  /** The learner told someone at home about the chapter. */
  retold: boolean;
  /** The learner did the stop-and-check question. */
  checked: boolean;
  updatedAt: number;
}

export interface DiaryNotes {
  answers: string[];
  updatedAt: number;
}

type NotesState = Record<string, ChapterNotes | DiaryNotes>;

const STORAGE_KEY = 'v2:my-notes';
const CHANGE_EVENT = 'v2-my-notes-change';

let cache: NotesState | null = null;

const read = (): NotesState => {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    cache = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    cache = {};
  }
  return cache as NotesState;
};

const write = (next: NotesState) => {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable; the notes then last for this session only.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

const subscribe = (callback: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
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

const EMPTY: NotesState = {};
export const useMyNotes = () => useSyncExternalStore(subscribe, read, () => EMPTY);

export const bookNotesKey = (storyId: string, level: string, language: string) => `${storyId}|${level}|${language}`;
export const chapterNotesKey = (book: string, chapter: number) => `${book}|ch${chapter}`;
export const diaryNotesKey = (book: string) => `${book}|diary`;

export const emptyChapterNotes = (): ChapterNotes => ({ cells: [], summary: '', translation: '', retold: false, checked: false, updatedAt: 0 });

export const chapterNotes = (state: NotesState, key: string): ChapterNotes => ({ ...emptyChapterNotes(), ...(state[key] as ChapterNotes | undefined) });

export const diaryNotes = (state: NotesState, key: string): DiaryNotes => ({ answers: [], updatedAt: 0, ...(state[key] as DiaryNotes | undefined) });

export const saveChapterNotes = (key: string, patch: Partial<ChapterNotes>) => {
  const state = read();
  write({ ...state, [key]: { ...chapterNotes(state, key), ...patch, updatedAt: Date.now() } });
};

export const saveDiaryAnswer = (key: string, index: number, answer: string) => {
  const state = read();
  const answers = [...diaryNotes(state, key).answers];
  answers[index] = answer;
  write({ ...state, [key]: { answers, updatedAt: Date.now() } });
};

const hasText = (value?: string) => Boolean(value && value.trim());

export const chapterHasNotes = (notes: ChapterNotes) =>
  notes.cells.some(hasText) || hasText(notes.summary) || hasText(notes.translation) || notes.retold || notes.checked;

export interface NotesExportChapter {
  title: string;
  columns: string[];
  summaryTask?: string;
  translationTask?: string;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * A page with everything the learner wrote for one book, to keep, print or show the teacher.
 * Labels come in the reader's language; the learner's own words are copied as they are.
 */
export const notesExportHtml = (opts: {
  state: NotesState;
  book: string;
  bookTitle: string;
  rtl: boolean;
  labels: { heading: string; summary: string; translation: string; retold: string; diary: string; nothing: string };
  chapters: NotesExportChapter[];
  diaryPrompts: string[];
}) => {
  const { state, book, bookTitle, rtl, labels, chapters, diaryPrompts } = opts;
  const parts: string[] = [];
  chapters.forEach((chapter, index) => {
    const notes = chapterNotes(state, chapterNotesKey(book, index + 1));
    if (!chapterHasNotes(notes)) return;
    const grid = chapter.columns.length
      ? `<table><tr>${chapter.columns.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr><tr>${chapter.columns.map((_, i) => `<td>${escapeHtml(notes.cells[i] ?? '')}</td>`).join('')}</tr></table>`
      : '';
    parts.push(`<section><h2>${escapeHtml(chapter.title)}</h2>${grid}${hasText(notes.summary) ? `<p><b>${escapeHtml(labels.summary)}:</b> ${escapeHtml(notes.summary)}</p>` : ''}${hasText(notes.translation) ? `<p><b>${escapeHtml(labels.translation)}:</b> ${escapeHtml(notes.translation)}</p>` : ''}${notes.retold ? `<p>✓ ${escapeHtml(labels.retold)}</p>` : ''}</section>`);
  });
  const diary = diaryNotes(state, diaryNotesKey(book));
  if (diary.answers.some(hasText)) {
    parts.push(`<section><h2>${escapeHtml(labels.diary)}</h2>${diaryPrompts.map((prompt, i) => `<p><b>${escapeHtml(prompt)}</b> ${escapeHtml(diary.answers[i] ?? '')}</p>`).join('')}</section>`);
  }
  const body = parts.length ? parts.join('') : `<p>${escapeHtml(labels.nothing)}</p>`;
  return `<!doctype html><html lang="${rtl ? 'ar' : 'en'}" dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${escapeHtml(labels.heading)} · ${escapeHtml(bookTitle)}</title><style>body{font-family:system-ui,sans-serif;max-width:780px;margin:24px auto;padding:0 16px;line-height:1.5;color:#2b2118}h1{font-size:22px}h2{font-size:17px;margin-top:24px}table{border-collapse:collapse;width:100%;margin:8px 0}th,td{border:1px solid #bbb;padding:6px;text-align:start;vertical-align:top}th{background:#f3ead9}</style></head><body><h1>${escapeHtml(labels.heading)} · ${escapeHtml(bookTitle)}</h1>${body}</body></html>`;
};

export const downloadNotes = (html: string, fileName: string) => {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
