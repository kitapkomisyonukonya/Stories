// Reads the content JSON from disk (the browser build reads it through Vite instead).
import '../lib/nodeContent';
import type { BookData } from '../../src/types';
import { bookRegistry } from '../../src/core/content/bookRegistry';
import { checkExerciseStructure } from '../../src/content/exerciseStructure';

type Language = 'en' | 'ar';

/**
 * Technical integrity only: every check here protects rendering or scoring.
 * Pedagogical quality is reviewed manually (docs/MANUAL_CONTENT_AUTHORING_STANDARD.md).
 */

const duplicates = (values: readonly string[]): string[] => {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  values.forEach(value => {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  });
  return [...repeated];
};

const validateLanguage = (book: BookData, language: Language, label: string): { errors: string[]; languageFocusCount: number } => {
  const errors: string[] = [];
  const ids: string[] = [];
  let languageFocusCount = 0;

  book.pages.forEach(page => {
    const where = `${label} ${language.toUpperCase()} page ${page.id}`;
    // Chapter pages carry a Quick Challenge; non-chapter story pages (e.g. References) do not.
    if (page.type === 'story' && (page.exercises ?? []).length) {
      const languageFocus = page.languageFocusExercises ?? [];
      if (!languageFocus.length) errors.push(`${where}: story page has no Language Focus exercises`);
      languageFocusCount += languageFocus.length;
      languageFocus.forEach(exercise => {
        ids.push(exercise.id);
        errors.push(...checkExerciseStructure(exercise, `${where} Language Focus`).map(problem => problem.en));
      });
    }
    (page.exercises ?? []).forEach(exercise => {
      if (!exercise) return;
      ids.push(exercise.id);
      errors.push(...checkExerciseStructure(exercise, where).map(problem => problem.en));
    });
  });

  const repeatedIds = duplicates(ids);
  if (repeatedIds.length) errors.push(`${label} ${language.toUpperCase()}: repeated exercise id(s) ${JSON.stringify(repeatedIds)}`);

  return { errors, languageFocusCount };
};

const main = async () => {
  console.log('============================================================');
  console.log('STORIES EXERCISE STRUCTURE VALIDATION');
  console.log('Loads every registered EN/AR book through the real UI finalizer.');
  console.log('============================================================');

  const failures: Array<{ label: string; errors: string[] }> = [];

  for (const definition of bookRegistry) {
    const label = `${definition.storyId} ${definition.level}`;
    try {
      const pair = await definition.load();
      // A hidden book first goes in as text only (story pages, no exercises yet): nothing to check here.
      if (pair.en.pages.every(page => page.type === 'story')) { console.log(`[SKIP] ${label} — text only for now`); continue; }
      const en = validateLanguage(pair.en, 'en', label);
      const ar = validateLanguage(pair.ar, 'ar', label);
      const errors = [...en.errors, ...ar.errors];
      if (errors.length) failures.push({ label, errors });
      else console.log(`[PASS] ${label} — Language Focus EN/AR ${en.languageFocusCount}/${ar.languageFocusCount}`);
    } catch (error) {
      failures.push({ label, errors: [error instanceof Error ? error.message : String(error)] });
    }
  }

  if (failures.length) {
    console.error('\n============================================================');
    console.error(`EXERCISE STRUCTURE VALIDATION FAILED — ${failures.length} book(s)`);
    console.error('============================================================');
    failures.forEach(({ label, errors }) => {
      console.error(`\n[FAIL] ${label}`);
      errors.forEach(error => console.error(`  - ${error}`));
    });
    process.exit(1);
  }

  console.log(`\nAll ${bookRegistry.length} registered book-level bundles passed exercise structure validation.`);
};

await main();
