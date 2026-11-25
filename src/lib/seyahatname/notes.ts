import { useSyncExternalStore } from 'react';

/**
 * "What I learned": one short line the reader writes after a chapter, kept in My Journal on this device
 * only. Key "storyId:level:chapter". Nothing is sent anywhere and nothing is ever graded.
 */
const STORAGE_KEY = 'v2:journal-notes';
const CHANGE_EVENT = 'v2-journal-notes-change';
const EMPTY: Record<string, string> = {};
export const NOTE_MAX = 280;

let cache: Record<string, string> | null = null;

const read = (): Record<string, string> => {
  if (cache) return cache;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    cache = stored && typeof stored === 'object' && !Array.isArray(stored)
      ? Object.fromEntries(Object.entries(stored as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
      : {};
  } catch {
    cache = {};
  }
  return cache;
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

export const useJournalNotes = () => useSyncExternalStore(subscribe, read, () => EMPTY);

export const saveJournalNote = (key: string, text: string) => {
  const value = text.trim().slice(0, NOTE_MAX);
  const next = { ...read() };
  if (value) next[key] = value;
  else delete next[key];
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* kept for this session only */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};
