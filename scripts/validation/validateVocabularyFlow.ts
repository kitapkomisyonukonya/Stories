// Reads the content JSON from disk (the browser build reads it through Vite instead).
import '../lib/nodeContent';
import type { BookData, VocabularyChallengePair } from '../../src/types';
import { bookRegistry } from '../../src/core/content/bookRegistry';
import { getLearningLevelPolicy } from '../../src/data/learningLevelPolicy';
import { getHistoricalEntityIdFromDefinition } from '../../src/features/historical-entities/registry';

type Language = 'en' | 'ar';

const normalize = (value: string, language: Language): string => {
  let normalized = value
    .toLocaleLowerCase(language === 'ar' ? 'ar' : 'en-US')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[.,!?;:'"“”‘’()[\]{}<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (language === 'ar') {
    normalized = normalized
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي');
  }

  return normalized;
};

const contextContainsWord = (
  pair: VocabularyChallengePair,
  language: Language,
): boolean => {
  if (!pair.context?.trim() || !pair.word.trim()) return false;
  return normalize(pair.context, language).includes(normalize(pair.word, language));
};

const learningRoleSequence = (book: BookData): string[] =>
  book.pages
    .filter(page => ['quiz', 'glossary', 'vocabulary-match', 'exercises', 'final-challenge'].includes(page.type))
    .map(page => page.type);

const expectedLearningRoleSequence = (book: BookData): string[] => {
  const glossaryCount = book.pages.filter(page => page.type === 'glossary').length;
  return [
    'quiz',
    ...Array.from({ length: glossaryCount }, () => 'glossary'),
    'vocabulary-match',
    'exercises',
    'final-challenge',
  ];
};

const sameArray = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const validateLanguage = (
  book: BookData,
  language: Language,
): string[] => {
  const errors: string[] = [];
  const policy = getLearningLevelPolicy(book.level);

  const knowledge = book.pages.filter(page => page.type === 'quiz');
  const glossaries = book.pages.filter(page => page.type === 'glossary');
  const vocabularyPages = book.pages.filter(page => page.type === 'vocabulary-match');
  const reviews = book.pages.filter(page => page.type === 'exercises');
  const finals = book.pages.filter(page => page.type === 'final-challenge');

  if (knowledge.length !== 1) errors.push(`expected exactly 1 Knowledge Check, found ${knowledge.length}`);
  if (glossaries.length < 1) errors.push('expected at least 1 Master Glossary');
  if (vocabularyPages.length !== 1) errors.push(`expected exactly 1 Vocabulary Challenge, found ${vocabularyPages.length}`);
  if (reviews.length !== 1) errors.push(`expected exactly 1 Language Review, found ${reviews.length}`);
  if (finals.length !== 1) errors.push(`expected exactly 1 Final Challenge, found ${finals.length}`);

  const sequence = learningRoleSequence(book);
  const expectedSequence = expectedLearningRoleSequence(book);
  if (!sameArray(sequence, expectedSequence)) {
    errors.push(`learning flow is ${sequence.join(' → ') || 'empty'}, expected ${expectedSequence.join(' → ')}`);
  }

  const review = reviews[0];
  if (review) {
    const expectedTitle = language === 'ar' ? 'مراجعة اللغة' : 'Language Review';
    if (review.title !== expectedTitle) {
      errors.push(`Language Review title is "${review.title}", expected "${expectedTitle}"`);
    }
    if (!(review.exercises?.length)) {
      errors.push('Language Review has no exercises');
    }
    if (/retrieval review/i.test(review.title) || /مراجعة الاسترجاع|المراجعة الاسترجاعية/.test(review.title)) {
      errors.push('legacy Retrieval Review title is still active');
    }
  }

  const vocabulary = vocabularyPages[0];
  const pairs = vocabulary?.vocabularyPairs ?? [];

  if (pairs.length !== policy.vocabularyCount) {
    errors.push(`Vocabulary Challenge has ${pairs.length} targets, expected ${policy.vocabularyCount}`);
  }

  const normalizedWords = pairs.map(pair => normalize(pair.word, language));
  const uniqueWords = new Set(normalizedWords.filter(Boolean));
  if (uniqueWords.size !== pairs.length) {
    errors.push(`Vocabulary Challenge has duplicate/empty targets: unique=${uniqueWords.size}, total=${pairs.length}`);
  }

  const contextReady = pairs.filter(pair => contextContainsWord(pair, language));
  if (contextReady.length < policy.vocabularyContextCount) {
    errors.push(`only ${contextReady.length} context-ready targets, expected at least ${policy.vocabularyContextCount}`);
  }

  pairs.forEach((pair, index) => {
    if (!pair.word.trim()) errors.push(`target ${index + 1} has an empty word`);
    if (!pair.meaning.trim()) errors.push(`target ${index + 1} has an empty meaning`);
  });

  return errors;
};

const validatePair = async (
  label: string,
  load: () => Promise<{ en: BookData; ar: BookData }>,
): Promise<string[]> => {
  const errors: string[] = [];
  const pair = await load();
  const policy = getLearningLevelPolicy(pair.en.level);

  if (pair.en.level !== pair.ar.level) {
    errors.push(`level mismatch EN=${pair.en.level}, AR=${pair.ar.level}`);
    return errors;
  }

  const englishTypes = pair.en.pages.map(page => page.type);
  const arabicTypes = pair.ar.pages.map(page => page.type);
  if (!sameArray(englishTypes, arabicTypes)) {
    errors.push('EN/AR page-type sequence differs');
  }

  const englishStories = pair.en.pages.filter(page => page.type === 'story');
  const arabicById = new Map(
    pair.ar.pages.filter(page => page.type === 'story').map(page => [page.id, page] as const),
  );

  englishStories.forEach(page => {
    const arabic = arabicById.get(page.id);
    if (!arabic) {
      errors.push(`chapter ${page.id} is missing in Arabic`);
      return;
    }

    // Place cards follow each language's own text, so only Word Notes must match.
    const wordNotes = (list: typeof page.vocabulary) => (list ?? []).filter(item => !getHistoricalEntityIdFromDefinition(item.definition)).length;
    const enCount = wordNotes(page.vocabulary);
    const arCount = wordNotes(arabic.vocabulary);
    if (enCount !== arCount) {
      errors.push(`chapter ${page.id} Word Notes differ EN=${enCount}, AR=${arCount}`);
    }
  });

  errors.push(...validateLanguage(pair.en, 'en').map(error => `EN: ${error}`));
  errors.push(...validateLanguage(pair.ar, 'ar').map(error => `AR: ${error}`));

  const enPairs = pair.en.pages.find(page => page.type === 'vocabulary-match')?.vocabularyPairs ?? [];
  const arPairs = pair.ar.pages.find(page => page.type === 'vocabulary-match')?.vocabularyPairs ?? [];

  if (enPairs.length !== arPairs.length) {
    errors.push(`EN/AR target counts differ EN=${enPairs.length}, AR=${arPairs.length}`);
  }

  const pairCount = Math.min(enPairs.length, arPairs.length);
  for (let index = 0; index < pairCount; index += 1) {
    const enChapter = enPairs[index].chapter;
    const arChapter = arPairs[index].chapter;
    if (enChapter !== arChapter) {
      errors.push(`target ${index + 1} chapter pairing differs EN=${enChapter ?? 'n/a'}, AR=${arChapter ?? 'n/a'}`);
    }
  }

  if (!errors.length) {
    const enContext = enPairs.filter(pair => contextContainsWord(pair, 'en')).length;
    const arContext = arPairs.filter(pair => contextContainsWord(pair, 'ar')).length;
    const glossaryCount = pair.en.pages.filter(page => page.type === 'glossary').length;
    console.log(
      `[PASS] ${label} — ${policy.vocabularyCount} targets | context EN/AR ${enContext}/${arContext} | glossary ${glossaryCount}`,
    );
  }

  return errors;
};

const main = async () => {
  console.log('============================================================');
  console.log('STORIES LEARNING FLOW VALIDATION');
  console.log('Loads every registered EN/AR book through the real UI finalizer.');
  console.log('============================================================');

  const failures: Array<{ label: string; errors: string[] }> = [];

  for (const definition of bookRegistry) {
    const label = `${definition.storyId} ${definition.level}`;
    try {
      const draft = await definition.load();
      // A hidden book first goes in as text only (story pages, no end pages yet): nothing to check here.
      if (draft.en.pages.every(page => page.type === 'story')) { console.log(`[SKIP] ${label} — text only for now`); continue; }
      const errors = await validatePair(label, definition.load);
      if (errors.length) failures.push({ label, errors });
    } catch (error) {
      failures.push({
        label,
        errors: [error instanceof Error ? error.message : String(error)],
      });
    }
  }

  if (failures.length) {
    console.error('\n============================================================');
    console.error(`LEARNING FLOW VALIDATION FAILED — ${failures.length} book(s)`);
    console.error('============================================================');
    failures.forEach(({ label, errors }) => {
      console.error(`\n[FAIL] ${label}`);
      errors.forEach(error => console.error(`  - ${error}`));
    });
    process.exit(1);
  }

  console.log('\nAll 15 registered book-level bundles passed learning-flow validation.');
};

await main();
