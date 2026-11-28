import type { Level } from '../types';

/**
 * Levels whose books have no English edition and always open in Arabic. None at the moment:
 * the old Arabic-only Pre-A1 editions were removed on 2026-11-28 and Pre-A1 is now English
 * (stories.json englishOnlyLevels) until its Arabic arrives.
 */
export const ARABIC_ONLY_LEVELS: readonly Level[] = [];
export const isArabicOnlyLevel = (level: Level | null | undefined): boolean => Boolean(level && ARABIC_ONLY_LEVELS.includes(level));
/** The file an edition reads for a language: Arabic-only levels read their Arabic file for both sides. */
export const fileLanguage = (level: Level, language: 'en' | 'ar'): 'en' | 'ar' => (isArabicOnlyLevel(level) ? 'ar' : language);
