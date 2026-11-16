import type { HistoricalEntity } from '../types';
import { IBN_JUBAYR_A1_CHAPTER_ENTITIES, IBN_JUBAYR_A2_CHAPTER_ENTITIES, ibnJubayrA1Entities, ibnJubayrA2Entities } from './ibnJubayrA2';
import { ABRAHAM_SET } from './abraham';
import { MOSES_SET } from './moses';
import { YUNUS_EMRE_SET } from './yunus';
import { MECCA_SET } from './mecca';
import { GEVHER_NESIBE_SET } from './gevherNesibe';
import { AHILIK_SET } from './ahilik';
import { NUH_SET } from './nuh';
import { KASGARLI_SET } from './kasgarli';
import { YESEVI_SET } from './yesevi';
import { IBN_JUBAYR_B_SET } from './ibnJubayrB';

// The words of the cards are edited in src/content/entityCards.json (the panel's Places & People
// page); the words written here are only the first version, copied there by
// scripts/content/exportEntityCards.ts when a book's cards are added.

/** One story's cards and, per book level, the cards each chapter offers. */
export interface EntityBookSet {
  entities: HistoricalEntity[];
  chapters: Record<string, Record<number, string[]>>;
}

export const BOOK_SETS: EntityBookSet[] = [
  { entities: [...Object.values(ibnJubayrA2Entities), ...Object.values(ibnJubayrA1Entities)], chapters: { 'ibnjubayr-a2': IBN_JUBAYR_A2_CHAPTER_ENTITIES, 'ibnjubayr-a1': IBN_JUBAYR_A1_CHAPTER_ENTITIES } },
  MECCA_SET,
  ABRAHAM_SET,
  MOSES_SET,
  YUNUS_EMRE_SET,
  GEVHER_NESIBE_SET,
  AHILIK_SET,
  NUH_SET,
  KASGARLI_SET,
  YESEVI_SET,
  IBN_JUBAYR_B_SET,
];
