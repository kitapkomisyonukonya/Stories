/**
 * The house rules for English content, in one place: the build checks them (scripts/validation/
 * validateContentRules.ts) and the content panel shows them while someone types.
 *
 * They are the rules the project already agreed on: one spelling for shared terms, American
 * spelling, instructions short enough for the level, and no bare pronoun on a card that is read
 * on its own. Everything else about a text is read by people.
 */
import type { Exercise, Level, PageData } from '../types';

export interface ContentFinding {
  where: string;
  rule: string;
  detail: string;
}

const SHARED_TERMS: [RegExp, string][] = [
  [/\bQuran\b/g, 'write Qur’an'],
  [/Qur['‘`]an/g, 'write Qur’an with the curly apostrophe'],
  [/Ka['‘`]ba/g, 'write Ka’ba with the curly apostrophe'],
  [/\bTawheed\b/g, 'write Tawhid'],
  [/\bA\.\s?D\./g, 'write CE'],
  [/\(as\)/g, 'write (pbuh)'],
];

/**
 * British spellings with one American form. Words that are words in their own right on both
 * sides (practice/practise, program/programme) are left to the people who read the text.
 */
export const AMERICAN_SPELLING: Record<string, string> = {
  colour: 'color',
  colours: 'colors',
  coloured: 'colored',
  colourful: 'colorful',
  favour: 'favor',
  favours: 'favors',
  favoured: 'favored',
  favourite: 'favorite',
  honour: 'honor',
  honours: 'honors',
  honoured: 'honored',
  honourable: 'honorable',
  dishonour: 'dishonor',
  neighbour: 'neighbor',
  neighbours: 'neighbors',
  behaviour: 'behavior',
  behaviours: 'behaviors',
  labour: 'labor',
  labours: 'labors',
  laboured: 'labored',
  centre: 'center',
  centres: 'centers',
  metre: 'meter',
  metres: 'meters',
  theatre: 'theater',
  organise: 'organize',
  organised: 'organized',
  organising: 'organizing',
  organisation: 'organization',
  realise: 'realize',
  realised: 'realized',
  realising: 'realizing',
  recognise: 'recognize',
  recognised: 'recognized',
  recognising: 'recognizing',
  apologise: 'apologize',
  apologised: 'apologized',
  defence: 'defense',
  offence: 'offense',
  jewellery: 'jewelry',
  traveller: 'traveler',
  travellers: 'travelers',
  travelled: 'traveled',
  travelling: 'traveling',
  grey: 'gray',
};

export const MAX_INSTRUCTION_WORDS: Record<Level, number> = { A1: 8, A2: 12, B1: 16, B2: 20 };

/** A card that is shuffled and read on its own must say who it is about (the hoca's rule). */
const BARE_PRONOUN = /^(He|She|They|His|Her|Their|Him|Them)\b/;

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean);

/**
 * The words of the instruction itself. A list of the answers at the end ("… with one word:
 * ruler, angel or farmer.") is what the learner chooses from, not instruction to read.
 */
export const instructionWords = (text: string): string[] => {
  const withoutChoices = text.replace(/:\s*[^.:]+\.?\s*$/, '');
  return words(withoutChoices.length > 10 ? withoutChoices : text);
};

export const checkEnglishText = (text: string, where: string): ContentFinding[] => {
  const findings: ContentFinding[] = [];
  for (const [pattern, advice] of SHARED_TERMS) {
    const matches = text.match(pattern);
    if (matches) findings.push({ where, rule: 'shared term', detail: `"${matches[0]}" — ${advice}` });
  }
  for (const [british, american] of Object.entries(AMERICAN_SPELLING)) {
    if (new RegExp(`\\b${british}\\b`, 'i').test(text)) {
      findings.push({ where, rule: 'American spelling', detail: `"${british}" — write "${american}"` });
    }
  }
  return findings;
};

export const checkExercise = (exercise: Exercise, level: Level, where: string): ContentFinding[] => {
  const findings: ContentFinding[] = [];
  const at = `${where} ${exercise.id}`;
  const instructions = typeof exercise.instructions === 'string' ? exercise.instructions : '';
  const count = instructions ? instructionWords(instructions).length : 0;
  if (count > MAX_INSTRUCTION_WORDS[level]) {
    findings.push({ where: at, rule: 'instruction length', detail: `${count} words, ${level} allows ${MAX_INSTRUCTION_WORDS[level]}` });
  }
  // Sequencing cards are shuffled and read one by one, so each must say who it is about.
  // Grammar sorting cards (dragDropGroups) quote the text on purpose and are left alone.
  const standalone = (exercise.sequencingItems ?? []).map(item => item.text).filter((value): value is string => typeof value === 'string');
  for (const item of standalone) {
    if (BARE_PRONOUN.test(item.trim())) {
      findings.push({ where: at, rule: 'name the person', detail: `"${item.slice(0, 60)}" starts with a pronoun` });
    }
  }
  return findings;
};

/** Every string in a page that a reader sees, with where it sits. */
export const pageTexts = (value: unknown, path: string, out: [string, string][] = []): [string, string][] => {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((item, index) => pageTexts(item, `${path}[${index}]`, out));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'image' || key === 'audioUrl' || key === 'id' || key === 'type') continue;
      pageTexts(item, `${path}.${key}`, out);
    }
  }
  return out;
};

/** Every rule, over one English page. */
export const checkEnglishPage = (page: PageData, level: Level): ContentFinding[] => {
  const where = `page ${page.id}`;
  const findings = pageTexts(page, where).flatMap(([path, text]) => checkEnglishText(text, path));
  for (const exercise of [...(page.exercises ?? []), ...(page.languageFocusExercises ?? [])]) {
    findings.push(...checkExercise(exercise, level, where));
  }
  return findings;
};
