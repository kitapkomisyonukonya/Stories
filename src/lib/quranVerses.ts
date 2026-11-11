/**
 * Qur'an verse quotations inside story text, shown in italics (user's request, 2026-10-05).
 * The story text itself is never changed; this only finds where verses start and end.
 *
 * English: a quotation counts as a verse when a Surah reference follows it, or when the
 * sentence that introduces it names the Qur'an, a Surah or verses. EXTRA lists passages the
 * rule cannot see (several quotations and the words between them form one passage, or no
 * reference is given). The same rule prints English verses in italics in the book PDFs.
 * Arabic: verses marked with ﴿ ﴾, plus «…» quotations with a Surah reference or a Qur'an
 * introduction, like the English rule.
 */
type Range = [number, number];

const EXTRA: Record<string, Record<number, [string, string][]>> = {
  'musa-B2': {
    10: [['“And he entered the city', 'who do right.”']],
    11: [['And there came a man', 'who are wrongdoers!”']],
    17: [['“Verily, the Hour is coming', 'as an arrogant tyrant).”']],
  },
  'musa-A1': { 6: [['“O Moses,', 'I am Allah.”']], 7: [['“We believe in the Lord', 'Moses and Aaron.”']], 8: [['“No! My Lord is with me', 'show me the way.”']] },
  'ibrahim-A1': { 4: [['“O fire, be cold', 'for Abraham.”']] },
  'adam-A1': {
    2: [['“I am better than Adam', 'Adam from soil.”'], ['“Get out', 'of here!”']],
    3: [['“Do not go near', 'this tree.”']],
  },
  'adam-B2': {
    2: [['“Your Lord said to the angels', '”']],
    4: [['‘And We said to the angels', 'of the disbelievers.’'], ['‘Except for Satan. He was too proud', 'of the faithless.’'], ['‘O Satan, what prevented you', 'of the exalted?’'], ['‘I am better than he', 'him from clay.’']],
    6: [['“Lord, allow me until', '”'], ['“You are one of those allowed', '”'], ['“By Your majesty', '”']],
    9: [['Then Adam (pbuh) received words from his Lord', 'the Most Merciful.']],
    17: [['“He (Satan) said, ‘My Lord', '”']],
  },
  'ibrahim-B2': {
    6: [['“And We had certainly given Abraham', 'well-Knowing”']],
    9: [['“Then, when he saw the moon rising', '”']],
    14: [['“He (his father) said, ‘Are you rejecting', '”']],
    19: [['“They said, ‘We heard a youth', '”']],
    23: [['“My Lord (Allah) is He Who gives life', '”'], ['“I give life and cause death', '”']],
    24: [['“Verily, Allah causes the sun to rise', '”']],
    35: [['“I will make you a leader to the nations', '”']],
  },
};

// Arabic passages with no reference after them, matching an English verse that has one.
const EXTRA_AR: Record<string, Record<number, [string, string][]>> = {
  'musa-B1': { 5: [['«اِغْفِرْ لي!', 'من عمل الشيطان»']] },
  'musa-B2': {
    10: [['﴿وَدَخَلَ الْمَدِينَةَ', 'مِنَ الْمُصْلِحِينَ»']],
    11: [['وَجَاءَ رَجُلٌ مِنْ أَقْصَى الْمَدِينَةِ', 'مِنَ الْقَوْمِ الظَّالِمِينَ!»']],
  },
};

// Quotations the rule would take for verses but that are not the verse's own words: a title, or
// people's words retold in the story's own way. Listed by how the quotation begins.
const NOT_VERSE: Record<'en' | 'ar', Record<string, Record<number, string[]>>> = {
  en: {
    'mecca-B2': { 8: ['“With men like us around'] },
  },
  ar: {
    'ibrahim-B2': { 1: ['«خَلِيلُ اللَّهِ»'] },
    'mecca-B2': { 8: ['«مَعَ وُجُودِ رِجَالٍ'] },
  },
};

const EN_CITE = /^\s*\((see |See )?(Surah|[A-Z][\w’'-]+:\s?\d)/;
const EN_INTRO = /(Qur’an|Qur'an|Surah|verses? \d|Allah related|Allah narrated)[^“”.]*[.:,]?\s*$|(Qur’an|Surah [\w’'-]+, verses? [\d–-]+)[^“”]*$/;
/** Arabic text without harakat, so the rules match vowelled and plain text alike. */
// eslint-disable-next-line no-misleading-character-class -- harakat are listed on purpose
const bare = (text: string) => text.replace(/[\u0640\u064B-\u065F\u0670]/g, '');
const AR_CITE = /^\s*[.،؛]?\s*\((انظر:?\s*)?سور[ةه]/;
const AR_INTRO = /(القرآن|سور[ةه]|الآي[ةات]|قال تعالى|قوله تعالى)[^«».]*[.:،]?\s*$/;

function quoteRanges(text: string, open: string, close: string, isVerse: (start: number, end: number) => boolean, skip: Range[]) {
  const out: Range[] = [];
  for (let start = text.indexOf(open); start >= 0; start = text.indexOf(open, start + 1)) {
    let depth = 1;
    let end = start + 1;
    for (; end < text.length && depth; end += 1) {
      if (text[end] === open) depth += 1;
      else if (text[end] === close) depth -= 1;
    }
    if (depth) break;
    if (!skip.some(([s, e]) => start < e && end > s) && isVerse(start, end)) out.push([start, end]);
    start = end - 1;
  }
  return out;
}

const lastParagraph = (text: string, end: number) => text.slice(Math.max(0, end - 140), end).split(/\n\s*\n/).pop() ?? '';

/** [start, end) ranges of verse text in one chapter's story text. */
export function quranVerseRanges(text: string, language: 'en' | 'ar', storyId: string, level: string, chapter: number): Range[] {
  const out: Range[] = [];
  const extra = (language === 'ar' ? EXTRA_AR : EXTRA)[`${storyId}-${level}`]?.[chapter] ?? [];
  for (const [a, b] of extra) {
    const s = text.indexOf(a);
    const e = s < 0 ? -1 : text.indexOf(b, s + a.length);
    if (s >= 0 && e >= 0) out.push([s, e + b.length]);
  }
  if (language === 'ar') {
    out.push(...quoteRanges(text, '﴿', '﴾', () => true, out));
    out.push(...quoteRanges(text, '«', '»', (s, e) => AR_CITE.test(bare(text.slice(e, e + 60))) || AR_INTRO.test(bare(lastParagraph(text, s))), out));
  } else {
    out.push(...quoteRanges(text, '“', '”', (s, e) => EN_CITE.test(text.slice(e, e + 40)) || EN_INTRO.test(lastParagraph(text, s)), out));
  }
  const notVerse = NOT_VERSE[language][`${storyId}-${level}`]?.[chapter] ?? [];
  return out.filter(([s]) => !notVerse.some(start => text.startsWith(start, s))).sort((x, y) => x[0] - y[0]);
}

export const VERSE_OPEN = '\uE000';
export const VERSE_CLOSE = '\uE001';
export const VERSE_MARKS = /[\uE000\uE001]/g;

/** The text with VERSE_OPEN / VERSE_CLOSE around each verse. */
export function markQuranVerses(text: string, language: 'en' | 'ar', storyId: string, level: string, chapter: number) {
  let marked = text;
  for (const [s, e] of quranVerseRanges(text, language, storyId, level, chapter).reverse()) {
    marked = marked.slice(0, s) + VERSE_OPEN + marked.slice(s, e) + VERSE_CLOSE + marked.slice(e);
  }
  return marked;
}
