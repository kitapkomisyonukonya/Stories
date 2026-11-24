import type { Level } from '../types';

/** Pre-A1 is an Arabic-only level: its books have no English edition and always open in Arabic. */
export const ARABIC_ONLY_LEVELS: readonly Level[] = ['Pre-A1'];
export const isArabicOnlyLevel = (level: Level | null | undefined): boolean => Boolean(level && ARABIC_ONLY_LEVELS.includes(level));
/** The file an edition reads for a language: Arabic-only levels read their Arabic file for both sides. */
export const fileLanguage = (level: Level, language: 'en' | 'ar'): 'en' | 'ar' => (isArabicOnlyLevel(level) ? 'ar' : language);
