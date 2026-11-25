import { useEffect, useState } from 'react';
import type { Level, PageData } from '../../types';
import { getBookDefinition } from '../../core/content/bookRegistry';
import { applyResolvedAssets, loadBookAssets } from '../../core/storage/storageAssetLoader';

/** What My Journal shows of one chapter: its picture, audio, title, a line from it and its Word Notes. */
export interface JournalChapter {
  title: string;
  image?: string;
  audioUrl?: string;
  /** A sentence from the chapter itself (the Before You Read quote), never a written summary. */
  line?: string;
  words: { word: string; definition: string }[];
}

type Chapters = { en: JournalChapter[]; ar: JournalChapter[] };
const cache = new Map<string, { first: Promise<Chapters>; full: Promise<Chapters> }>();

const chaptersOf = (pages: PageData[]): JournalChapter[] =>
  pages
    .filter(page => page.type === 'story')
    .map(page => ({
      title: page.title,
      image: page.image || undefined,
      audioUrl: page.audioUrl || undefined,
      line: page.beforeYouRead?.quote || undefined,
      // Places & People entries ride in the vocabulary with a marker instead of a meaning; they are not Word Notes.
      words: (page.vocabulary ?? []).filter(item => item.definition && !item.definition.startsWith('__')).map(item => ({ word: item.word, definition: item.definition })),
    }));

const EMPTY: Chapters = { en: [], ar: [] };

/** First the book file (its own pictures), then the same with the pictures and audio found in Storage. */
const load = (storyId: string, level: Level) => {
  const key = `${storyId}:${level}`;
  let entry = cache.get(key);
  if (!entry) {
    const definition = getBookDefinition(storyId, level);
    const pair = definition ? definition.load() : Promise.reject(new Error('no book'));
    const first = pair.then(book => ({ en: chaptersOf(book.en.pages), ar: chaptersOf(book.ar.pages) }));
    const full = pair.then(async book => {
      const assets = definition ? await loadBookAssets(definition.storage).catch(() => null) : null;
      const filled = assets ? applyResolvedAssets(book, assets) : book;
      return { en: chaptersOf(filled.en.pages), ar: chaptersOf(filled.ar.pages) };
    });
    entry = { first: first.catch(() => EMPTY), full: full.catch(() => EMPTY) };
    pair.catch(() => cache.delete(key));
    cache.set(key, entry);
  }
  return entry;
};

/** Loads one book's chapters for My Journal (only for books on the page; each book once). */
export const useJournalBook = (storyId: string, level: Level, arabic: boolean): JournalChapter[] | null => {
  const [chapters, setChapters] = useState<JournalChapter[] | null>(null);
  useEffect(() => {
    let live = true;
    setChapters(null);
    const pick = (result: Chapters) => (arabic && result.ar.length ? result.ar : result.en);
    const { first, full } = load(storyId, level);
    void first.then(result => { if (live) setChapters(current => current ?? pick(result)); });
    void full.then(result => { if (live) setChapters(pick(result)); });
    return () => { live = false; };
  }, [storyId, level, arabic]);
  return chapters;
};
