// Reads the content JSON from disk (the browser build reads it through Vite instead).
import '../lib/nodeContent';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Level, PageData, PageType } from '../../src/types';
import { bookCatalog } from '../../src/content/bookCatalog';
import { editionName } from '../../src/core/content/bookRegistry';

/**
 * Shape check for the content files. A book edited by hand or by the content panel must still
 * be a book the app can open: this runs in `npm run build`, so a broken file never ships.
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const booksDir = `${root}/src/content/books`;
const guidesDir = `${root}/src/content/guides`;

const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2'];
const PAGE_TYPES: PageType[] = ['story', 'quiz', 'vocabulary-match', 'exercises', 'glossary', 'final-challenge', 'map', 'places', 'key-facts', 'key-terms'];
const LANGUAGES = ['en', 'ar'] as const;

const errors: string[] = [];
const fail = (where: string, message: string) => errors.push(`${where}: ${message}`);

const isText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

const readJson = (file: string): unknown => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    fail(file, `is not readable JSON (${(error as Error).message})`);
    return null;
  }
};

const checkPage = (page: PageData, where: string) => {
  if (typeof page?.id !== 'number') fail(where, 'has no page number');
  if (!PAGE_TYPES.includes(page?.type)) fail(where, `has an unknown page type "${page?.type}"`);
  if (!isText(page?.title) && page?.type !== 'map') fail(where, 'has no title');
  if (typeof page?.content !== 'string') fail(where, 'has no content field');
  // A map with a year slider shows the person's age, so it needs all three sentences, the last two with {years}.
  const map = page?.map as { time?: { mode?: string }; age?: Record<string, unknown> } | undefined;
  if (map?.age) {
    if (!isText(map.age.born)) fail(`${where} map`, 'has no age.born sentence');
    for (const key of ['alive', 'died']) {
      const text = map.age[key];
      if (!isText(text) || !text.includes('{years}')) fail(`${where} map`, `needs an age.${key} sentence with {years}`);
    }
  }
  for (const list of [page?.exercises, page?.languageFocusExercises]) {
    (list ?? []).forEach((exercise, index) => {
      if (!isText(exercise?.id)) fail(`${where} exercise ${index + 1}`, 'has no id');
      if (!isText(exercise?.type)) fail(`${where} exercise ${exercise?.id ?? index + 1}`, 'has no type');
    });
  }
};

const expected = new Set<string>();
for (const entry of bookCatalog) {
  if (!LEVELS.includes(entry.level)) fail('bookCatalog.json', `unknown level "${entry.level}"`);
  for (const language of LANGUAGES) expected.add(`${editionName(entry.storyId, entry.level, language)}.json`);
}

for (const file of readdirSync(booksDir)) {
  if (!file.endsWith('.json')) continue;
  if (!expected.has(file)) fail(`books/${file}`, 'is not listed in bookCatalog.json');
}
for (const name of expected) {
  const where = `books/${name}`;
  const data = readJson(`${booksDir}/${name}`) as { schema?: number; book?: { pages?: PageData[]; title?: string; level?: string } } | null;
  if (!data) continue;
  if (data.schema !== 1) fail(where, 'has an unknown schema number');
  const book = data.book;
  if (!isText(book?.title)) fail(where, 'has no book title');
  const pages = book?.pages ?? [];
  if (pages.length < 2) fail(where, 'has fewer than two pages');
  const ids = new Set<number>();
  pages.forEach(page => {
    checkPage(page, `${where} page ${page?.id}`);
    if (ids.has(page?.id)) fail(where, `has two pages numbered ${page?.id}`);
    ids.add(page?.id);
  });

  const guide = readJson(`${guidesDir}/${name}`) as { schema?: number; teacherGuide?: unknown; selfStudyGuide?: unknown } | null;
  if (!guide) continue;
  if (guide.schema !== 1) fail(`guides/${name}`, 'has an unknown schema number');
  if (!guide.teacherGuide) fail(`guides/${name}`, 'has no teacher guide');
  if (!guide.selfStudyGuide) fail(`guides/${name}`, 'has no self-study guide');
}

if (errors.length > 0) {
  console.error(`\n[Content] ${errors.length} problem(s):`);
  errors.slice(0, 40).forEach(line => console.error(` - ${line}`));
  process.exit(1);
}
console.log(`All ${expected.size} content files and their guides passed the shape check.`);
