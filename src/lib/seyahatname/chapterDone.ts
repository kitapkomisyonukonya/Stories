import type { PageData } from '../../types';

/**
 * When a chapter counts as finished, for its Seyahatname stamp: everything the chapter page asks of the
 * reader. The Quick Challenge and every Language Focus exercise done, every I can line rated, and the
 * chapter's audio started at least once (whether it was listened to the end cannot be known).
 */

/** Kept with the book's done exercises once the chapter's audio has been started. */
export const listenMarker = (quickId: string) => `listen:${quickId}`;

/** Where the chapter page keeps its I can ratings (see ChapterExtras). */
export const iCanStorageKey = (level: string, lang: 'en' | 'ar', page: Pick<PageData, 'id' | 'title'>) =>
  `v2:${level}:${lang}:${page.id}:${page.title}:ican`;

const iCanRated = (key: string) => {
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}');
    return stored && typeof stored === 'object' ? Object.keys(stored).length : 0;
  } catch {
    return 0;
  }
};

/** Chapters (1-based, in story order) of one language's edition that are finished. */
export const finishedChapters = (pages: PageData[], level: string, lang: 'en' | 'ar', done: ReadonlySet<string>): number[] =>
  pages
    .filter(page => page.type === 'story')
    .map((page, index) => {
      const quick = page.exercises?.[0];
      if (!quick || !done.has(quick.id)) return 0;
      if (!(page.languageFocusExercises ?? []).every(exercise => done.has(exercise.id))) return 0;
      if (page.iCan?.length && iCanRated(iCanStorageKey(level, lang, page)) < page.iCan.length) return 0;
      if (page.audioUrl && !done.has(listenMarker(quick.id))) return 0;
      return index + 1;
    })
    .filter(n => n > 0);
