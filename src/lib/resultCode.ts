import type { Level } from '../types';
import { storyCatalog } from '../core/content/storyCatalog';

/**
 * The result card's 8-character code. It carries the book, the level and six rounded scores,
 * so a teacher can type it in and see the same numbers. It is a light check, not protection
 * against cheating; real tracking comes with an account system.
 */
export interface ResultScores {
  /** Chapters read, 0–100. */
  chapters: number;
  /** Knowledge Check, 0–100, or null when not taken. */
  knowledgeCheck: number | null;
  /** Vocabulary Challenge finished. */
  vocabulary: boolean;
  /** Language Review tasks done, 0–100. */
  languageReview: number;
  /** Final Challenge, 0–100, or null when not taken. */
  finalChallenge: number | null;
  /** "I can" lines ticked "Yes", 0–100. */
  iCan: number;
}

export interface ResultCodeData extends ResultScores {
  storyId: string;
  level: Level;
}

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
// A1 is last so codes made before A1 existed still read the same.
const LEVELS: Level[] = ['A2', 'B1', 'B2', 'A1'];
const NOT_TAKEN = 31;

/** 0–100 in steps of 5 (0–20), or 31 for "not taken". */
const toStep = (value: number | null) => (value === null ? NOT_TAKEN : Math.max(0, Math.min(20, Math.round(value / 5))));
const fromStep = (step: number) => (step === NOT_TAKEN ? null : Math.min(100, step * 5));

const checksum = (bits: bigint) => {
  let sum = 0n;
  let rest = bits;
  while (rest > 0n) {
    sum = (sum * 7n + (rest & 0xfn) + 3n) % 16n;
    rest >>= 4n;
  }
  return sum;
};

export const encodeResult = (data: ResultCodeData): string => {
  const story = Math.max(0, storyCatalog.findIndex(item => item.id === data.storyId));
  const fields: [number, number][] = [
    [story, 3],
    [LEVELS.indexOf(data.level), 2],
    [toStep(data.chapters), 5],
    [toStep(data.knowledgeCheck), 5],
    [data.vocabulary ? 1 : 0, 1],
    [toStep(data.languageReview), 5],
    [toStep(data.finalChallenge), 5],
    [toStep(data.iCan), 5],
  ];
  let bits = 0n;
  for (const [value, width] of fields) bits = (bits << BigInt(width)) | BigInt(value);
  bits = (bits << 4n) | checksum(bits);
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code = ALPHABET[Number(bits & 31n)] + code;
    bits >>= 5n;
  }
  return code;
};

/** Null when the code is mistyped (wrong length, letters or check digit). */
export const decodeResult = (raw: string): ResultCodeData | null => {
  const code = raw.toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (code.length !== 8) return null;
  let bits = 0n;
  for (const char of code) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) return null;
    bits = (bits << 5n) | BigInt(index);
  }
  const check = bits & 0xfn;
  bits >>= 4n;
  if (checksum(bits) !== check) return null;
  const take = (width: number) => {
    const value = Number(bits & ((1n << BigInt(width)) - 1n));
    bits >>= BigInt(width);
    return value;
  };
  const iCan = take(5);
  const finalChallenge = take(5);
  const languageReview = take(5);
  const vocabulary = take(1) === 1;
  const knowledgeCheck = take(5);
  const chapters = take(5);
  const level = LEVELS[take(2)];
  const story = storyCatalog[take(3)];
  if (!story || !level) return null;
  return {
    storyId: story.id,
    level,
    chapters: fromStep(chapters) ?? 0,
    knowledgeCheck: fromStep(knowledgeCheck),
    vocabulary,
    languageReview: fromStep(languageReview) ?? 0,
    finalChallenge: fromStep(finalChallenge),
    iCan: fromStep(iCan) ?? 0,
  };
};
