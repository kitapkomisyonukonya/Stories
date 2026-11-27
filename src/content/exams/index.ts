import type { Level, LevelExam, ExamItem } from '../../types';
import a1 from './a1.json';
import a2 from './a2.json';
import b1 from './b1.json';
import b2 from './b2.json';

/** Pre-A1 has no end-of-level test. */
export const LEVEL_EXAMS: Partial<Record<Level, LevelExam>> = { A1: a1 as LevelExam, A2: a2 as LevelExam, B1: b1 as LevelExam, B2: b2 as LevelExam };

/** Reading items first, then language items: the order the test code stores answers in. */
export const examItems = (exam: LevelExam): ExamItem[] => [
  ...exam.reading.texts.flatMap(text => text.items),
  ...exam.language.items,
];

export const readingCount = (exam: LevelExam) => exam.reading.texts.reduce((n, text) => n + text.items.length, 0);
