import type { Level } from '../types';

/**
 * CEFR level codes as the Arabic side shows them (أ1, ب2 ...); the English side keeps A1, B2.
 * Latin digits on purpose: an Arabic-Indic one after أ reads like a second alif.
 */
const ARABIC_LEVEL_LABELS: Record<Level, string> = {
  'Pre-A1': 'ما قبل أ1',
  A1: 'أ1',
  A2: 'أ2',
  B1: 'ب1',
  B2: 'ب2',
};

export const levelLabel = (level: Level | string | null | undefined, language: string): string => {
  if (!level) return '';
  return language === 'ar' ? ARABIC_LEVEL_LABELS[level as Level] ?? String(level) : String(level);
};
