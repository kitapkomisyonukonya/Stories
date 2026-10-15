import type { Level } from '../../types';
import { mergeMyWords, type MyWord } from '../myWords';
import { mergeJournal, readJournal, type JournalState } from './store';

/**
 * The move-to-another-device code: the journal (stamps, seals, goal) and My words, packed and
 * compressed. There is no account and no server: the code itself carries everything.
 */
const PREFIX = 'SY1.';
const DAY = 86_400_000;

interface Packed {
  s: Record<string, number>;
  l: Record<string, number>;
  g: number;
  w: [string, string, 'en' | 'ar', string, Level, number, number][];
}

const toBase64Url = (bytes: Uint8Array) => {
  let text = '';
  bytes.forEach(byte => { text += String.fromCharCode(byte); });
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (code: string) => {
  const text = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(text, char => char.charCodeAt(0));
};

const pipe = async (bytes: Uint8Array, stream: CompressionStream | DecompressionStream) => {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
};

/** Days instead of milliseconds keep the code short; a stamp's day is all the weekly goal needs. */
const toDays = (record: Record<string, number>) => Object.fromEntries(Object.entries(record).map(([key, at]) => [key, at ? Math.max(1, Math.round(at / DAY)) : 0]));
const fromDays = (record: Record<string, number>) => Object.fromEntries(Object.entries(record ?? {}).filter(([, d]) => typeof d === 'number').map(([key, d]) => [key, d * DAY]));

export const makeTransferCode = async (words: MyWord[], state: JournalState = readJournal()): Promise<string> => {
  const packed: Packed = {
    s: toDays(state.stamps),
    l: toDays(state.seals),
    g: state.goal,
    w: words.map(word => [word.word, word.definition, word.language, word.storyId, word.level, word.known, Math.round(word.savedAt / DAY)]),
  };
  const bytes = await pipe(new TextEncoder().encode(JSON.stringify(packed)), new CompressionStream('deflate-raw'));
  return PREFIX + toBase64Url(bytes);
};

/** Accepts the code alone or the whole link it came in. Null when it cannot be read. */
export const readTransferCode = async (raw: string): Promise<{ journal: Partial<JournalState>; words: MyWord[] } | null> => {
  const match = raw.trim().match(/SY1\.([A-Za-z0-9_-]+)/);
  if (!match) return null;
  try {
    const bytes = await pipe(fromBase64Url(match[1]), new DecompressionStream('deflate-raw'));
    const packed = JSON.parse(new TextDecoder().decode(bytes)) as Packed;
    const words: MyWord[] = (Array.isArray(packed.w) ? packed.w : [])
      .filter(item => Array.isArray(item) && typeof item[0] === 'string')
      .map(([word, definition, language, storyId, level, known, day]) => ({
        id: `${language}|${word.toLocaleLowerCase()}`,
        word,
        definition: String(definition ?? ''),
        language: language === 'ar' ? 'ar' : 'en',
        storyId: String(storyId),
        level: level as Level,
        known: Number(known) || 0,
        savedAt: (Number(day) || 0) * DAY,
      }));
    return { journal: { stamps: fromDays(packed.s), seals: fromDays(packed.l), goal: Number(packed.g) || 0 }, words };
  } catch {
    return null;
  }
};

export const applyTransfer = (data: { journal: Partial<JournalState>; words: MyWord[] }) => {
  mergeJournal(data.journal);
  const added = mergeMyWords(data.words);
  return { stamps: Object.keys(data.journal.stamps ?? {}).length, words: added };
};

export const transferLink = (code: string) => `${window.location.origin}${window.location.pathname}?tasima=${encodeURIComponent(code)}`;
