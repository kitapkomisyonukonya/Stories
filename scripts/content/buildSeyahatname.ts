// Seyahatname (the travel journal): the place on each chapter stamp and the chapters of each map place,
// made from the books' journey maps. Runs before every build, so a map edited in the panel updates
// the stamps with it.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEditionIndex } from '../../src/lib/seyahatname/places';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const catalog = JSON.parse(readFileSync(`${root}/src/content/bookCatalog.json`, 'utf8')) as {
  editions: { storyId: string; level: string }[];
};

const stories = JSON.parse(readFileSync(`${root}/src/content/stories.json`, 'utf8')) as {
  stories: { id: string; collection?: string; englishOnly?: boolean; hidden?: boolean; text: { en: { name: string } } }[];
};
const englishOnly = new Set(stories.stories.filter(story => story.englishOnly).map(story => story.id));
// Books set before Islam (the prophets, Mecca before Islam) get no minaret on their stamps.
const beforeIslam = new Set(stories.stories.filter(story => story.collection === 'prophets' || story.id === 'mecca').map(story => story.id));

const readBook = (storyId: string, level: string, language: 'en' | 'ar') => {
  const file = `${root}/src/content/books/${storyId}-${level.toLowerCase()}-${language}.json`;
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).book : null;
};

const editions: Record<string, ReturnType<typeof buildEditionIndex>> = {};
for (const { storyId, level } of catalog.editions) {
  const en = readBook(storyId, level, 'en');
  if (!en) continue;
  editions[`${storyId}:${level}`] = buildEditionIndex(en, englishOnly.has(storyId) ? null : readBook(storyId, level, 'ar'), {
    beforeIslam: beforeIslam.has(storyId),
  });
}

const writeIfChanged = (file: string, text: string) => {
  const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
  if (current !== text) writeFileSync(file, text);
  return current !== text;
};

const changed = writeIfChanged(`${root}/src/content/seyahatname.json`, `${JSON.stringify({ schema: 1, editions })}\n`);

// Open Badges 3.0 achievements (deploy/openBadges.mjs): a seal for every listed book, a certificate per level.
const RECORD_NOTE = 'Recorded by the Lisandan Kültüre app on the learner’s own device; the platform keeps no learner records.';
const nameOf = (storyId: string) => stories.stories.find(story => story.id === storyId)?.text.en.name ?? storyId;
const listed = catalog.editions.filter(({ storyId }) => !stories.stories.find(story => story.id === storyId)?.hidden);
const achievements: Record<string, { type: string; name: string; description: string; criteria: string; level: string }> = {};
for (const { storyId, level } of listed) {
  achievements[`book-${storyId}-${level}`] = {
    type: 'Badge',
    name: `Book seal: ${nameOf(storyId)} · ${level}`,
    description: `Finished the book ${nameOf(storyId)} (${level}) of the Lisandan Kültüre digital library, up to its Final Challenge.`,
    criteria: `Finish the Final Challenge of ${nameOf(storyId)} (${level}) in the Lisandan Kültüre app. ${RECORD_NOTE}`,
    level,
  };
}
for (const level of ['A2', 'B1', 'B2']) {
  const books = listed.filter(edition => edition.level === level).map(edition => nameOf(edition.storyId));
  if (!books.length) continue;
  achievements[`level-${level}`] = {
    type: 'Certificate',
    name: `Seyahatname Certificate · ${level}`,
    description: `Completed the ${level} journey of the Lisandan Kültüre digital library: every ${level} book sealed (${books.join(', ')}).`,
    criteria: `Finish the Final Challenge of every ${level} book in the Lisandan Kültüre app. ${RECORD_NOTE}`,
    level,
  };
}
mkdirSync(`${root}/public/ob`, { recursive: true });
writeIfChanged(`${root}/public/ob/achievements.json`, `${JSON.stringify({ schema: 1, achievements }, null, 1)}\n`);
console.log(`Seyahatname: ${Object.keys(editions).length} books, ${Object.keys(achievements).length} Open Badges achievements${changed ? ', index written' : ''}.`);
