import type { Level } from '../types';
import { isRegisteredStoryId } from '../core/content/bookRegistry';
import { isHiddenEdition, isHiddenStory } from '../core/content/storyCatalog';

/** Where the reader is, as carried in the URL hash: `#/` for the library, `#/mecca/a2/5` for page 5 of a book. */
export interface HashRoute {
  storyId: string;
  level: Level;
  /** Zero-based page index; the hash shows it one-based to match the page counter. */
  pageIndex: number;
}

export const HOME_HASH = '#/';

const LEVELS: readonly Level[] = ['A1', 'A2', 'B1', 'B2'];

export const formatHashRoute = (route: HashRoute | null): string =>
  route ? `#/${route.storyId}/${route.level.toLowerCase()}/${route.pageIndex + 1}` : HOME_HASH;

/** Returns the route in the hash, or null for the library (an empty, unknown or malformed hash). */
export const parseHashRoute = (hash: string): HashRoute | null => {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const [storyId, rawLevel, rawPage] = parts;
  if (!isRegisteredStoryId(storyId)) return null;
  // Hidden books open only from a preview link that carries ?gizli=1.
  if (isHiddenStory(storyId) && (typeof window === 'undefined' || !new URLSearchParams(window.location.search).has('gizli'))) return null;
  const level = LEVELS.find(candidate => candidate.toLowerCase() === rawLevel.toLowerCase());
  if (!level) return null;
  // Levels that are not on the shelf yet open the same way.
  if (isHiddenEdition(storyId, level) && (typeof window === 'undefined' || !new URLSearchParams(window.location.search).has('gizli'))) return null;
  const page = rawPage === undefined ? 1 : Number.parseInt(rawPage, 10);
  if (!Number.isInteger(page) || page < 1) return null;
  return { storyId, level, pageIndex: page - 1 };
};

export const isHomeHash = (hash: string): boolean => hash === '' || hash === '#' || hash === HOME_HASH;
