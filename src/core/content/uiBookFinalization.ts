import type { BookData, PageData } from '../../types';
import type { BookPair, Language } from './contracts';
import { getLearningLevelPolicy } from '../../data/learningLevelPolicy';

const normalizeVocabularyContextText = (value: string): string => value
  .toLocaleLowerCase()
  .replace(/[\u064B-\u0652\u0670]/g, '')
  .replace(/[أإآٱ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ؤ/g, 'و')
  .replace(/ئ/g, 'ي')
  .replace(/\s+/g, ' ')
  .trim();

const preparedStoryContext = (
  page: PageData,
  word: string,
  preferred?: string,
): string | undefined => {
  const normalizedWord = normalizeVocabularyContextText(word);

  if (
    preferred?.trim()
    && normalizeVocabularyContextText(preferred).includes(normalizedWord)
  ) {
    return preferred.trim();
  }

  const source = (page.content ?? '')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/[*_#>`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!source) return undefined;

  const sentence = source
    .split(/(?<=[.!?؟])\s+/)
    .map(value => value.trim())
    .find(value => normalizeVocabularyContextText(value).includes(normalizedWord));

  if (!sentence) return undefined;
  return sentence.length > 240 ? `${sentence.slice(0, 237).trim()}…` : sentence;
};

const pickPreparedTargets = (
  english: BookData,
  arabic: BookData,
): {
  english: NonNullable<PageData['vocabularyPairs']>;
  arabic: NonNullable<PageData['vocabularyPairs']>;
} => {
  const targetCount = getLearningLevelPolicy(english.level).vocabularyCount;
  const englishGlossaryByWord = new Map(
    english.pages
      .filter(page => page.type === 'glossary')
      .flatMap(page => page.vocabulary ?? [])
      .map(item => [item.word.trim().toLocaleLowerCase('en-US'), item] as const)
  );
  const arabicGlossaryByWord = new Map(
    arabic.pages
      .filter(page => page.type === 'glossary')
      .flatMap(page => page.vocabulary ?? [])
      .map(item => [item.word.trim().toLocaleLowerCase('ar'), item] as const)
  );
  const paired: Array<{
    english: NonNullable<PageData['vocabularyPairs']>[number];
    arabic: NonNullable<PageData['vocabularyPairs']>[number];
  }> = [];

  english.pages
    .filter(page => page.type === 'story')
    .forEach(englishPage => {
      const arabicPage = arabic.pages.find(page => page.type === 'story' && page.id === englishPage.id);
      if (!arabicPage) {
        throw new Error(
          `[Prepared Book Finalization] ${english.id} chapter ${englishPage.id} is missing in Arabic.`,
        );
      }

      const englishVocabulary = englishPage.vocabulary ?? [];
      const arabicVocabulary = arabicPage.vocabulary ?? [];
      if (englishVocabulary.length !== arabicVocabulary.length) {
        throw new Error(
          `[Prepared Book Finalization] ${english.id} chapter ${englishPage.id} Word Notes differ: EN=${englishVocabulary.length}, AR=${arabicVocabulary.length}.`,
        );
      }

      englishVocabulary.forEach((englishEntry, index) => {
        const arabicEntry = arabicPage.vocabulary?.[index];
        if (!arabicEntry?.word?.trim() || !arabicEntry.definition?.trim()) return;
        if (!englishEntry.word?.trim() || !englishEntry.definition?.trim()) return;

        const englishDetail = englishGlossaryByWord.get(
          englishEntry.word.trim().toLocaleLowerCase('en-US'),
        ) ?? englishEntry;
        const arabicDetail = arabicGlossaryByWord.get(
          arabicEntry.word.trim().toLocaleLowerCase('ar'),
        ) ?? arabicEntry;

        paired.push({
          english: {
            word: englishDetail.word,
            meaning: englishDetail.definition,
            context: preparedStoryContext(
              englishPage,
              englishDetail.word,
              englishDetail.storyExample ?? englishDetail.example ?? englishEntry.storyExample ?? englishEntry.example,
            ),
            chapter: englishDetail.chapter ?? englishPage.id,
            chapterTitle: englishDetail.chapterTitle ?? englishPage.title,
            partOfSpeech: englishDetail.partOfSpeech ?? englishEntry.partOfSpeech,
          },
          arabic: {
            word: arabicDetail.word,
            meaning: arabicDetail.definition,
            context: preparedStoryContext(
              arabicPage,
              arabicDetail.word,
              arabicDetail.storyExample ?? arabicDetail.example ?? arabicEntry.storyExample ?? arabicEntry.example,
            ),
            chapter: arabicDetail.chapter ?? arabicPage.id,
            chapterTitle: arabicDetail.chapterTitle ?? arabicPage.title,
            partOfSpeech: arabicDetail.partOfSpeech ?? arabicEntry.partOfSpeech,
          },
        });
      });
    });

  const seen = new Set<string>();
  const uniquePaired = paired.filter(pair => {
    const key = `${pair.english.word.trim().toLocaleLowerCase('en-US')}::${pair.arabic.word.trim().toLocaleLowerCase('ar')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (uniquePaired.length < targetCount) {
    throw new Error(
      `[Prepared Book Finalization] ${english.id} ${english.level} needs ${targetCount} unique paired target words; found ${uniquePaired.length}.`,
    );
  }

  const policy = getLearningLevelPolicy(english.level);
  const contextRich = uniquePaired.filter(pair => pair.english.context && pair.arabic.context);

  if (contextRich.length < policy.vocabularyContextCount) {
    throw new Error(
      `[Prepared Book Finalization] ${english.id} ${english.level} needs ${policy.vocabularyContextCount} bilingual story-context vocabulary targets; found ${contextRich.length}.`,
    );
  }

  const pickEven = <T,>(items: T[], count: number): T[] => {
    if (count <= 0) return [];
    if (items.length <= count) return items.slice();
    return Array.from({ length: count }, (_, index) => {
      const sourceIndex = count <= 1
        ? 0
        : Math.round(index * (items.length - 1) / (count - 1));
      return items[sourceIndex];
    });
  };

  const contextTargets = pickEven(contextRich, policy.vocabularyContextCount);
  const contextKeys = new Set(
    contextTargets.map(pair =>
      `${pair.english.word.trim().toLocaleLowerCase('en-US')}::${pair.arabic.word.trim().toLocaleLowerCase('ar')}`
    )
  );
  const remaining = uniquePaired.filter(pair => {
    const key = `${pair.english.word.trim().toLocaleLowerCase('en-US')}::${pair.arabic.word.trim().toLocaleLowerCase('ar')}`;
    return !contextKeys.has(key);
  });
  const selected = [
    ...contextTargets,
    ...pickEven(remaining, targetCount - contextTargets.length),
  ];

  return {
    english: selected.map(pair => pair.english),
    arabic: selected.map(pair => pair.arabic),
  };
};

const reorderPreparedLearningFlow = (pages: PageData[]): PageData[] => {
  const knowledge = pages.filter(page => page.type === 'quiz');
  const glossaries = pages.filter(page => page.type === 'glossary');
  const vocabulary = pages.filter(page => page.type === 'vocabulary-match');
  const review = pages.filter(page => page.type === 'exercises');
  const finalChallenge = pages.filter(page => page.type === 'final-challenge');

  if (!knowledge.length || !glossaries.length || !vocabulary.length || !review.length || !finalChallenge.length) {
    throw new Error(
      `[Prepared Book Finalization] Learning flow is incomplete: knowledge=${knowledge.length}, glossary=${glossaries.length}, vocabulary=${vocabulary.length}, review=${review.length}, final=${finalChallenge.length}.`,
    );
  }

  const ordered = [
    ...knowledge,
    ...glossaries,
    ...vocabulary,
    ...review,
    ...finalChallenge,
  ];
  const roleIds = new Set(ordered.map(page => page.id));
  const positions = pages
    .map((page, index) => roleIds.has(page.id) ? index : -1)
    .filter(index => index >= 0);

  if (positions.length !== ordered.length) {
    throw new Error(
      `[Prepared Book Finalization] Learning flow cannot be reordered safely. Positions=${positions.length}, pages=${ordered.length}.`,
    );
  }

  const output = [...pages];
  positions.forEach((position, index) => {
    output[position] = ordered[index];
  });
  return output;
};

const finalizePreparedLanguage = (
  book: BookData,
  vocabularyPairs: NonNullable<PageData['vocabularyPairs']>,
  language: Language,
): BookData => {
  const enriched = book.pages.map(page => {
    if (page.type === 'vocabulary-match') {
      return {
        ...page,
        title: language === 'ar' ? 'تحدي المفردات' : 'Vocabulary Challenge',
        content: language === 'ar'
          ? `تدرّب على ${vocabularyPairs.length} ${vocabularyPairs.length <= 10 ? 'كلمات' : 'كلمة'} مستهدفة عبر المطابقة والسياق والاسترجاع.`
          : book.level === 'A1'
          ? `Learn ${vocabularyPairs.length} words from the story. Match them and use them.`
          : `Practise ${vocabularyPairs.length} target words through matching, context and recall.`,
        vocabularyPairs,
      };
    }

    if (page.type === 'exercises') {
      const content = language === 'ar'
        ? book.level === 'A1' || book.level === 'A2'
          ? 'راجع لغة القصة بخطوات بسيطة: انظر، تدرّب، ثم استخدمها.'
          : book.level === 'B1'
          ? 'راجع تراكيب القواعد وروابط المعنى واللغة التواصلية من الكتاب كله، ثم استخدمها في سياقات جديدة.'
          : 'راجع تراكيب القواعد والموقف والتماسك ولغة الخطاب من الكتاب كله، ثم استخدمها بدقة في سياقات جديدة.'
        : book.level === 'A1'
        ? 'Look at words from the story. Practice them. Then use them.'
        : book.level === 'A2'
        ? 'Review the story language in simple steps: look, practise, then use it.'
        : book.level === 'B1'
        ? 'Review grammar patterns, meaning relationships and useful language from across the book, then use them in new contexts.'
        : 'Review grammar, stance, cohesion and discourse language from across the book, then use them precisely in new contexts.';

      return {
        ...page,
        title: language === 'ar' ? 'مراجعة اللغة' : 'Language Review',
        content,
      };
    }

    return page;
  });

  return {
    ...book,
    pages: reorderPreparedLearningFlow(enriched),
  };
};

/**
 * A reviewed Vocabulary Challenge is authored by hand with a story sentence (context) for every
 * pair; it is used as written. Books not reviewed yet (pairs without context) still get the
 * Word Note based set from pickPreparedTargets.
 */
const authoredTargets = (
  english: BookData,
  arabic: BookData,
): { english: NonNullable<PageData['vocabularyPairs']>; arabic: NonNullable<PageData['vocabularyPairs']> } | null => {
  const reviewed = (book: BookData) => {
    const pairs = book.pages.find(page => page.type === 'vocabulary-match')?.vocabularyPairs ?? [];
    return pairs.length && pairs.every(item => item.context?.trim() && item.chapter) ? pairs : null;
  };
  const en = reviewed(english);
  const ar = reviewed(arabic);
  return en && ar ? { english: en, arabic: ar } : null;
};

/**
 * Prepared books keep their reviewed/manual learning content. This lightweight
 * UI finalizer only normalizes the vocabulary study flow and enriches the
 * existing Vocabulary Challenge from the reviewed story Word Notes.
 */
export const finalizePreparedBookPairForUi = (pair: BookPair): BookPair => {
  if (pair.en.level !== pair.ar.level) {
    throw new Error(
      `[Prepared Book Finalization] EN/AR levels differ: ${pair.en.level} vs ${pair.ar.level}.`,
    );
  }

  const englishGlossaries = pair.en.pages.filter(page => page.type === 'glossary').length;
  const arabicGlossaries = pair.ar.pages.filter(page => page.type === 'glossary').length;
  const englishVocabularyPages = pair.en.pages.filter(page => page.type === 'vocabulary-match').length;
  const arabicVocabularyPages = pair.ar.pages.filter(page => page.type === 'vocabulary-match').length;

  if (englishGlossaries !== arabicGlossaries || englishVocabularyPages !== arabicVocabularyPages) {
    throw new Error(
      `[Prepared Book Finalization] EN/AR vocabulary page roles differ for ${pair.en.id} ${pair.en.level}.`,
    );
  }

  if (!englishVocabularyPages) return pair;

  const targets = authoredTargets(pair.en, pair.ar) ?? pickPreparedTargets(pair.en, pair.ar);
  return {
    en: finalizePreparedLanguage(pair.en, targets.english, 'en'),
    ar: finalizePreparedLanguage(pair.ar, targets.arabic, 'ar'),
  };
};
