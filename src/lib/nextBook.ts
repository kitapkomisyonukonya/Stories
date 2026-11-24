import type { Level } from '../types';
import { getNextLevel, getStoryMeta, storyCatalog, type StoryCatalogItem } from '../core/content/storyCatalog';

export const isBookCompleted = (storyId: string, level: Level) => {
  try {
    return localStorage.getItem(`completed_${storyId}_${level}`) === 'true';
  } catch {
    return false;
  }
};

/** In Arabic, an edition without Arabic text (englishOnly / englishOnlyLevels) is not suggested. */
const readableAt = (story: StoryCatalogItem, level: Level, language: 'en' | 'ar') =>
  language === 'en' || !(story.englishOnly || story.englishOnlyLevels?.includes(level));

/** Books the reader can open in this language at this level. */
const readable = (language: 'en' | 'ar', level: Level) => storyCatalog.filter(story => !story.isComingSoon && readableAt(story, level, language));

/** The first unfinished book at a level, starting with the given collection. */
export const firstOpenBookAt = (level: Level, language: 'en' | 'ar', options: { exclude?: string; preferCollection?: string } = {}) => {
  const candidates = readable(language, level).filter(story => story.id !== options.exclude && story.availableLevels.includes(level));
  const ordered = options.preferCollection
    ? [...candidates.filter(story => story.collection === options.preferCollection), ...candidates.filter(story => story.collection !== options.preferCollection)]
    : candidates;
  return ordered.find(story => !isBookCompleted(story.id, level)) ?? null;
};

export type NextBookReason = 'nextLevel' | 'sameLevel' | 'practiseMore';

/**
 * The next book after finishing one: the same story one level up when the Final Challenge went well,
 * otherwise another unfinished story at the same level.
 */
export const suggestNextBook = (
  storyId: string,
  level: Level,
  language: 'en' | 'ar',
  finalScore: number | null,
): { story: StoryCatalogItem; level: Level; reason: NextBookReason } | null => {
  const story = getStoryMeta(storyId);
  const nextLevel = getNextLevel(level);
  const ready = finalScore === null || finalScore >= 70;

  if (ready && story && nextLevel && story.availableLevels.includes(nextLevel) && readableAt(story, nextLevel, language) && !isBookCompleted(storyId, nextLevel)) {
    return { story, level: nextLevel, reason: 'nextLevel' };
  }
  const sameLevel = firstOpenBookAt(level, language, { exclude: storyId, preferCollection: story?.collection });
  if (sameLevel) return { story: sameLevel, level, reason: ready ? 'sameLevel' : 'practiseMore' };
  if (nextLevel) {
    const up = firstOpenBookAt(nextLevel, language, { preferCollection: story?.collection });
    if (up) return { story: up, level: nextLevel, reason: 'nextLevel' };
  }
  return null;
};
