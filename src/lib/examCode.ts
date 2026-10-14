import type { Level } from '../types';

/**
 * The end-of-level test code. It carries the level, the test version and the option the student
 * chose for every scored item, so a teacher can score the test and a pilot can analyse each item
 * without any personal data leaving the device. 28 items × 2 bits + level + version + check = 13 characters.
 */
export interface ExamCodeData {
  level: Level;
  version: number;
  answers: number[];
}

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const LEVELS: Level[] = ['A2', 'B1', 'B2'];
export const EXAM_ITEM_COUNT = 28;
const LENGTH = 13;

const checksum = (bits: bigint) => {
  let sum = 0n;
  let rest = bits;
  while (rest > 0n) {
    sum = (sum * 7n + (rest & 0xfn) + 5n) % 16n;
    rest >>= 4n;
  }
  return sum;
};

export const encodeExam = ({ level, version, answers }: ExamCodeData): string => {
  let bits = BigInt(LEVELS.indexOf(level));
  bits = (bits << 3n) | BigInt(version & 7);
  for (let i = 0; i < EXAM_ITEM_COUNT; i += 1) bits = (bits << 2n) | BigInt((answers[i] ?? 0) & 3);
  bits = (bits << 4n) | checksum(bits);
  let code = '';
  for (let i = 0; i < LENGTH; i += 1) {
    code = ALPHABET[Number(bits & 31n)] + code;
    bits >>= 5n;
  }
  return code;
};

/** Shown in groups so it is easy to read aloud and copy: XXXX-XXXX-XXXXX. */
export const formatExamCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;

/** Null when the code is mistyped (wrong length, letters or check digit). */
export const decodeExam = (raw: string): ExamCodeData | null => {
  const code = raw.toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (code.length !== LENGTH) return null;
  let bits = 0n;
  for (const char of code) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) return null;
    bits = (bits << 5n) | BigInt(index);
  }
  const check = bits & 0xfn;
  bits >>= 4n;
  if (checksum(bits) !== check) return null;
  const answers: number[] = [];
  for (let i = 0; i < EXAM_ITEM_COUNT; i += 1) {
    answers.unshift(Number(bits & 3n));
    bits >>= 2n;
  }
  const version = Number(bits & 7n);
  bits >>= 3n;
  const level = LEVELS[Number(bits)];
  if (!level || version < 1) return null;
  return { level, version, answers };
};

/** `#/test/a2` opens the A2 test, so a teacher can share one link or QR code with the class. */
export const parseExamHash = (hash: string): Level | null => {
  const match = /^#\/test\/(a2|b1|b2)\/?$/i.exec(hash);
  return match ? (match[1].toUpperCase() as Level) : null;
};
