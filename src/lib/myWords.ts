import { useSyncExternalStore } from 'react';
import type { Level } from '../types';

/** One Word Note the reader saved. Kept on this device only. */
export interface MyWord {
  id: string;
  word: string;
  definition: string;
  language: 'en' | 'ar';
  storyId: string;
  level: Level;
  savedAt: number;
  /** Reviews answered "I knew it" in a row; "Not yet" sets it back to 0. */
  known: number;
}

/** A word counts as learned after this many "I knew it" answers in a row. */
export const MY_WORDS_LEARNED = 2;

const STORAGE_KEY = 'v2:my-words';
const CHANGE_EVENT = 'v2-my-words-change';

/** The word as it appears in the story, without the punctuation it was tapped with. */
const cleanWord = (word: string) => word.replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, '');
const wordId = (language: string, word: string) => `${language}|${cleanWord(word).toLocaleLowerCase()}`;

let cache: MyWord[] | null = null;

const read = (): MyWord[] => {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    cache = Array.isArray(parsed) ? parsed.filter(item => item && typeof item.word === 'string') : [];
  } catch {
    cache = [];
  }
  return cache;
};

const write = (next: MyWord[]) => {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable; the list then lasts for this session only.
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

/** The open book, set by the reader, so a saved word remembers where it came from. */
let currentBook: { storyId: string; level: Level } | null = null;
export const setMyWordsBook = (book: { storyId: string; level: Level } | null) => {
  currentBook = book;
};

export const getMyWordsBook = () => currentBook;

export const isMyWord = (words: MyWord[], language: string, word: string) =>
  words.some(item => item.id === wordId(language, word));

export const toggleMyWord = (entry: { word: string; definition: string; language: 'en' | 'ar' }) => {
  const id = wordId(entry.language, entry.word);
  const words = read();
  if (words.some(item => item.id === id)) {
    write(words.filter(item => item.id !== id));
    return;
  }
  if (!currentBook) return;
  write([
    ...words,
    { id, word: cleanWord(entry.word), definition: entry.definition, language: entry.language, storyId: currentBook.storyId, level: currentBook.level, savedAt: Date.now(), known: 0 },
  ]);
};

export const removeMyWord = (id: string) => write(read().filter(item => item.id !== id));

export const markMyWord = (id: string, knew: boolean) =>
  write(read().map(item => (item.id === id ? { ...item, known: knew ? item.known + 1 : 0 } : item)));

/** Words to review first: not learned yet, the weakest and oldest first. */
export const reviewQueue = (words: MyWord[], limit = 10) =>
  words
    .filter(item => item.known < MY_WORDS_LEARNED)
    .sort((a, b) => a.known - b.known || a.savedAt - b.savedAt)
    .slice(0, limit);

const EMPTY: MyWord[] = [];
export const useMyWords = () => useSyncExternalStore(subscribe, read, () => EMPTY);

/** Adds words brought from another device; a word already here keeps its own review count. */
export const mergeMyWords = (incoming: MyWord[]) => {
  const words = read();
  const known = new Set(words.map(item => item.id));
  const fresh = incoming.filter(item => item && typeof item.word === 'string' && typeof item.id === 'string' && !known.has(item.id));
  if (fresh.length) write([...words, ...fresh]);
  return fresh.length;
};
