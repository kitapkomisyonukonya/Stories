import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Zap, Lightbulb } from '../ui/icons';
import { MatchingBoard } from './MatchingBoard';
import type { Level, VocabularyChallengePair } from '../../types';
import { getLearningLevelPolicy } from '../../data/learningLevelPolicy';
import { useLanguage } from '../../contexts/LanguageContext';
import { partOfSpeechLabel } from '../../lib/partOfSpeech';
import { SECTION_ICONS } from '../../lib/sectionIcons';
import { cn } from '../../lib/utils';
import { EndCard, FeedbackBox } from './ExerciseFeedback';

type Pair = VocabularyChallengePair;

/** The same number on a matched word and its meaning shows which two belong together. */
type Props = {
  pairs: Pair[];
  collectionId?: string;
  level: Level;
  onReviewGlossary?: () => void;
  onComplete?: () => void;
  /** Opens the next page of the book from the closing card. */
  onNextPage?: () => void;
  nextPageLabel?: string;
};

type FeedbackState =
  | { kind: 'idle' }
  | { kind: 'checked'; correct: number; wrong: number }
  | { kind: 'done'; revealed: number };

const shuffle = <T,>(items: T[]): T[] => [...items].sort(() => Math.random() - 0.5);

const displayWord = (word: string, language: string) => {
  if (language !== 'en' || !word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
};

const pickEvenly = <T,>(items: T[], count: number): T[] => {
  if (items.length <= count) return items.slice();
  if (count <= 1) return count ? [items[0]] : [];
  return Array.from({ length: count }, (_, index) => {
    const sourceIndex = Math.round(index * (items.length - 1) / (count - 1));
    return items[sourceIndex];
  });
};

const normalizeTypedAnswer = (value: string, language: string) => {
  const base = value
    .toLocaleLowerCase(language === 'ar' ? 'ar' : 'en-US')
    .trim()
    .replace(/[.,!?;:'"“”‘’()[\]{}]/g, '')
    .replace(/\s+/g, ' ');

  if (language !== 'ar') return base;

  return base
    .replace(/[\u064B-\u0652\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
};

const normalizeMaskCharacter = (character: string): string => {
  if (/[\u064B-\u0652\u0670]/.test(character)) return '';
  if (/[أإآٱ]/.test(character)) return 'ا';
  if (character === 'ى') return 'ي';
  if (character === 'ؤ') return 'و';
  if (character === 'ئ') return 'ي';
  return character.toLocaleLowerCase();
};

const maskWord = (context: string | undefined, word: string) => {
  if (!context) return '';

  let normalizedContext = '';
  const originalPositions: number[] = [];
  Array.from(context).forEach((character, index) => {
    const normalized = normalizeMaskCharacter(character);
    if (!normalized) return;
    normalizedContext += normalized;
    originalPositions.push(index);
  });

  const normalizedWord = Array.from(word)
    .map(normalizeMaskCharacter)
    .join('');
  const matchIndex = normalizedContext.indexOf(normalizedWord);
  if (matchIndex < 0 || !normalizedWord) return '';

  const startIndex = originalPositions[matchIndex];
  const lastNormalizedIndex = matchIndex + normalizedWord.length - 1;
  let endIndex = (originalPositions[lastNormalizedIndex] ?? startIndex) + 1;
  while (endIndex < context.length && /[\u064B-\u0652\u0670]/.test(context[endIndex])) {
    endIndex += 1;
  }
  // Blank out a whole Latin word, so an inflected form ("mocked" for "mock") leaves no "___ed" hint.
  while (endIndex < context.length && /\p{Script=Latin}/u.test(context[endIndex])) {
    endIndex += 1;
  }

  return context.slice(0, startIndex) + '_____' + context.slice(endIndex);
};

const theme = {
    barBg: 'bg-brand-100', barFill: 'bg-brand-500', accent: 'text-brand-700', dot: 'bg-brand-500',
    badge: 'bg-brand-500 text-white', reset: 'bg-brand-100 text-brand-700 hover:bg-brand-200',
    selected: 'border-brand-500 ring-brand-500 bg-brand-50', matched: 'border-emerald-300 bg-emerald-50', idle: 'border-brand-100 bg-white hover:border-brand-300',
  };

export const VocabularyMatch = ({ pairs, level, onReviewGlossary, onComplete, onNextPage, nextPageLabel }: Props) => {
  const { t, formatNumber, language, isRTL } = useLanguage();
  const policy = getLearningLevelPolicy(level);
  const isArabic = language === 'ar';
  const [meaningOrder, setMeaningOrder] = useState(() => shuffle(pairs.map((pair) => pair.meaning)));
  // Confirmed pairs (locked), pairs placed but not yet checked, and the ✕ marks of the last check.
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<Record<string, string>>({});
  const [checkMarks, setCheckMarks] = useState<Record<string, boolean>>({});
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>({ kind: 'idle' });
  // Two tries per board: the second check shows the right meaning of every pair still wrong.
  const [matchRound, setMatchRound] = useState(0);

  const [stage, setStage] = useState<'match' | 'context' | 'recall' | 'done'>('match');
  const [maxUnlockedStage, setMaxUnlockedStage] = useState(0);
  const [revisitWords, setRevisitWords] = useState<Set<string>>(new Set());
  const [contextIndex, setContextIndex] = useState(0);
  const [contextChoice, setContextChoice] = useState<string | null>(null);
  const [contextFeedback, setContextFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [contextTries, setContextTries] = useState(0);
  const [recallIndex, setRecallIndex] = useState(0);
  const [recallChoice, setRecallChoice] = useState<string | null>(null);
  const [typedRecall, setTypedRecall] = useState('');
  const [recallFeedback, setRecallFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [recallAttempts, setRecallAttempts] = useState(0);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [useSentence, setUseSentence] = useState('');

  const contextItems = useMemo(() => {
    const contextualPairs = pairs.filter(pair => Boolean(pair.context) && Boolean(maskWord(pair.context, pair.word)));
    const pool = contextualPairs.length >= policy.vocabularyContextCount ? contextualPairs : pairs;
    return pickEvenly(pool, Math.min(policy.vocabularyContextCount, pool.length));
  }, [pairs, policy.vocabularyContextCount]);
  const recallItems = useMemo(() => {
    const reversed = [...pairs].reverse();
    const grounded = reversed.filter(pair => Boolean(pair.context?.trim()) && Boolean(maskWord(pair.context, pair.word)));
    const pool = policy.vocabularyRecallMode === 'guided' && grounded.length >= policy.vocabularyRecallCount
      ? grounded
      : reversed;
    return pickEvenly(pool, Math.min(policy.vocabularyRecallCount, pool.length));
  }, [pairs, policy.vocabularyRecallCount, policy.vocabularyRecallMode]);

  const signature = useMemo(
    () => `${level}:${language}:${pairs.map(pair => pair.word).join('|')}`,
    [level, language, pairs]
  );

  const wordToMeaning = useMemo(
    () => Object.fromEntries(pairs.map((pair) => [pair.word, pair.meaning])),
    [pairs]
  );
  const correctCount = Object.keys(matches).length;
  const total = pairs.length;
  const progress = total ? Math.round((correctCount / total) * 100) : 0;

  const reset = () => {
    setMeaningOrder(shuffle(pairs.map((pair) => pair.meaning)));
    setMatches({});
    setPending({});
    setCheckMarks({});
    setStreak(0);
    setFeedback({ kind: 'idle' });
    setMatchRound(0);
    setStage('match');
    setMaxUnlockedStage(0);
    setRevisitWords(new Set());
    setContextIndex(0);
    setContextChoice(null);
    setContextFeedback('idle');
    setContextTries(0);
    setRecallIndex(0);
    setRecallChoice(null);
    setTypedRecall('');
    setRecallFeedback('idle');
    setRecallAttempts(0);
    setAnswerRevealed(false);
    setUseSentence('');
  };

  useEffect(() => {
    reset();
    // Keep challenge state aligned with language/level/target-word changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const addRevisit = (word: string) => {
    setRevisitWords(previous => {
      const next = new Set(previous);
      next.add(word);
      return next;
    });
  };

  const boardPairs = useMemo(() => pairs.map((pair) => ({ left: pair.word, right: pair.meaning })), [pairs]);
  const boardAssignments = useMemo(() => ({ ...pending, ...matches }), [pending, matches]);
  const lockedWords = useMemo(() => new Set(Object.keys(matches)), [matches]);
  const boardResults = useMemo(() => {
    const marks: Record<string, boolean> = { ...checkMarks };
    Object.keys(matches).forEach((word) => { marks[word] = true; });
    return marks;
  }, [checkMarks, matches]);
  const allPlaced = Object.keys(boardAssignments).length === total && total > 0;

  const handleBoardChange = (next: Record<string, string>) => {
    const nextPending: Record<string, string> = {};
    Object.entries(next).forEach(([word, meaning]) => {
      if (!matches[word]) nextPending[word] = meaning;
    });
    setPending(nextPending);
    setCheckMarks({});
    if (feedback.kind === 'checked') setFeedback({ kind: 'idle' });
  };

  // Check every placed pair at once: right ones lock in, wrong ones show ✕ until Try again.
  const checkMatches = () => {
    if (!allPlaced || feedback.kind !== 'idle') return;
    const nextMatches = { ...matches };
    const marks: Record<string, boolean> = {};
    let correct = 0;
    let wrong = 0;
    Object.entries(pending).forEach(([word, meaning]) => {
      if (wordToMeaning[word] === meaning) {
        nextMatches[word] = meaning;
        marks[word] = true;
        correct += 1;
      } else {
        marks[word] = false;
        wrong += 1;
        addRevisit(word);
      }
    });
    setStreak(wrong === 0 ? streak + correct : 0);
    if (wrong > 0 && matchRound > 0) {
      // Second miss: show the right meaning for every pair that is still wrong.
      setMatches({ ...wordToMeaning });
      setPending({});
      setCheckMarks({});
      setFeedback({ kind: 'done', revealed: wrong });
      setMaxUnlockedStage(current => Math.max(current, 1));
      return;
    }
    setMatches(nextMatches);
    if (Object.keys(nextMatches).length === total) {
      setPending({});
      setCheckMarks({});
      setFeedback({ kind: 'done', revealed: 0 });
      setMaxUnlockedStage(current => Math.max(current, 1));
      return;
    }
    setCheckMarks(marks);
    setFeedback({ kind: 'checked', correct, wrong });
  };

  // First miss: the wrong meanings go back to the list for one more try.
  const retryMatches = () => {
    setPending({});
    setCheckMarks({});
    setMatchRound(1);
    setFeedback({ kind: 'idle' });
  };

  const copy = isArabic
    ? {
        title: 'تحدي المفردات',
        subtitle: level === 'A2'
          ? 'طابق الكلمات، ثم ابحث عنها في القصة، ثم تذكّرها.'
          : 'من المعنى إلى السياق ثم الاسترجاع.',
        match: level === 'A2' ? 'طابق' : 'المطابقة',
        context: level === 'A2' ? 'في القصة' : 'في السياق',
        recall: level === 'A2' ? 'تذكّر واستخدم' : 'الاسترجاع والاستخدام',
        contextHint: level === 'A2'
          ? 'اختر الكلمة المناسبة لجملة القصة.'
          : 'اختر الكلمة التي تناسب سياق القصة.',
        recallHint: level === 'A2'
          ? 'اختر الكلمة التي تعبّر عن المعنى.'
          : level === 'B1'
          ? 'اكتب الكلمة الناقصة مستعينًا بالتلميح.'
          : 'استرجع الكلمة الدقيقة من دون بنك كلمات.',
        continue: 'متابعة',
        check: 'تحقق',
        correct: 'صحيح',
        wrong: 'حاول مرة أخرى',
        matchRevealed: 'المعاني الصحيحة ظاهرة الآن باللون الأخضر. اقرأها قبل أن تتابع.',
        hintMeaning: 'ابحث عن الكلمة التي تعني:',
        chapter: 'الفصل',
        cue: 'تلميح',
        complete: 'اكتملت المرحلة',
        done: 'اكتمل تحدي المفردات',
        mastered: 'متقنة في هذه الجولة',
        revisit: 'كلمات للمراجعة',
        revisitHint: 'أخطأت في هذه الكلمات مرة واحدة على الأقل. راجعها في المعجم الرئيسي ثم أعد التحدي.',
        restart: 'إعادة التحدي',
        backToGlossary: 'العودة إلى المعجم الرئيسي',
        usePrompt: 'استخدم الكلمة في جملة قصيرة مرتبطة بالقصة.',
        usePlaceholder: 'اكتب جملتك هنا…',
      }
    : {
        title: 'Vocabulary Challenge',
        subtitle: level === 'A2'
          ? 'Match the words, find them in the story, then remember them.'
          : 'Move from meaning recognition to story context and active recall.',
        match: 'Match',
        context: level === 'A2' ? 'In the Story' : 'In Context',
        recall: level === 'A2' ? 'Remember & Use' : 'Recall & Use',
        contextHint: level === 'A2'
          ? 'Choose the word that fits the story sentence.'
          : 'Choose the word that best fits the story context.',
        recallHint: level === 'A2'
          ? 'Choose the target word that matches the meaning.'
          : level === 'B1'
          ? 'Type the missing word with a small retrieval cue.'
          : 'Retrieve the precise target word without a word bank.',
        continue: 'Continue',
        check: 'Check',
        correct: 'Correct',
        wrong: 'Try again',
        matchRevealed: 'The right meanings are now shown in green. Read them before you go on.',
        hintMeaning: 'Look for the word that means:',
        chapter: 'Chapter',
        cue: 'Cue',
        complete: 'Stage complete',
        done: 'Vocabulary Challenge complete',
        mastered: 'mastered this round',
        revisit: 'Words to revisit',
        revisitHint: 'You made a mistake with these words at least once. Review them in Master Glossary, then try the challenge again.',
        restart: 'Restart challenge',
        backToGlossary: 'Review in Master Glossary',
        usePrompt: 'Use the word in one short sentence connected to the story.',
        usePlaceholder: 'Write your sentence here…',
      };

  const optionWords = (item: Pair, itemIndex: number, optionCount: number) => {
    const samePart = item.partOfSpeech
      ? pairs.filter(candidate => candidate.word !== item.word && candidate.partOfSpeech === item.partOfSpeech)
      : [];
    const rest = pairs.filter(candidate =>
      candidate.word !== item.word && !samePart.some(match => match.word === candidate.word)
    );
    // Each group turns on its own, so the words of the same part of speech always come first.
    const rotate = (list: Pair[]) => list.length ? [...list.slice(itemIndex % list.length), ...list.slice(0, itemIndex % list.length)] : [];
    const rotated = [...rotate(samePart), ...rotate(rest)];
    const words = [item.word, ...rotated.slice(0, Math.max(0, optionCount - 1)).map(candidate => candidate.word)];
    const shift = words.length ? (itemIndex * 2 + 1) % words.length : 0;
    return [...words.slice(shift), ...words.slice(0, shift)];
  };

  const currentContext = contextItems[contextIndex];
  const contextOptions = currentContext
    ? optionWords(currentContext, contextIndex, level === 'A2' ? 3 : 4)
    : [];
  const contextPrompt = currentContext
    ? (maskWord(currentContext.context, currentContext.word) || currentContext.meaning)
    : '';

  const answerContext = (word: string) => {
    if (!currentContext || contextFeedback !== 'idle') return;
    setContextChoice(word);

    if (word === currentContext.word) {
      setContextFeedback('correct');
      return;
    }

    addRevisit(currentContext.word);
    setContextFeedback('wrong');
  };

  const retryContext = () => {
    setContextTries(1);
    setContextChoice(null);
    setContextFeedback('idle');
  };

  const continueContext = () => {
    if (contextIndex + 1 >= contextItems.length) {
      setMaxUnlockedStage(current => Math.max(current, 2));
      setStage('recall');
      setContextChoice(null);
      setContextFeedback('idle');
      setContextTries(0);
      return;
    }

    setContextIndex(index => index + 1);
    setContextChoice(null);
    setContextFeedback('idle');
    setContextTries(0);
  };

  const currentRecall = recallItems[recallIndex];
  const recallOptions = currentRecall ? optionWords(currentRecall, recallIndex + 3, 3) : [];

  const verifyRecall = () => {
    if (!currentRecall) return;

    const answer = policy.vocabularyRecallMode === 'choice'
      ? (recallChoice ?? '')
      : typedRecall;

    if (normalizeTypedAnswer(answer, language) === normalizeTypedAnswer(currentRecall.word, language)) {
      setRecallFeedback('correct');
      return;
    }

    addRevisit(currentRecall.word);
    if (recallAttempts > 0) setAnswerRevealed(true);
    setRecallAttempts(value => value + 1);
    setRecallFeedback('wrong');
  };

  const retryRecall = () => {
    setRecallChoice(null);
    setTypedRecall('');
    setRecallFeedback('idle');
  };

  const continueRecall = () => {
    if (recallIndex + 1 >= recallItems.length) {
      setStage('done');
      onComplete?.();
      return;
    }

    setRecallIndex(index => index + 1);
    setRecallChoice(null);
    setTypedRecall('');
    setRecallFeedback('idle');
    setRecallAttempts(0);
    setAnswerRevealed(false);
    setUseSentence('');
  };

  const stageRank = stage === 'match' ? 0 : stage === 'context' ? 1 : stage === 'recall' ? 2 : 3;
  const stageDefinitions = [
    { key: 'match' as const, label: copy.match },
    { key: 'context' as const, label: copy.context },
    { key: 'recall' as const, label: copy.recall },
  ];
  const stageHeader = (
    <div className="shrink-0 rounded-2xl bg-white/65 p-3 ring-1 ring-inset ring-black/[0.06] max-sm:rounded-none max-sm:bg-transparent max-sm:p-0 max-sm:ring-0">
      <div className="flex items-center gap-3">
        <div className={cn('hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white sm:flex', theme.badge)}>
          <SECTION_ICONS.vocabularyChallenge.icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          {/* Phones: the page name is in the top bar; only the three steps stay, as one slim row. */}
          <div className="flex items-center justify-between gap-3 max-sm:hidden">
            <div>
              <p className={cn('font-display text-xs font-semibold uppercase tracking-[0.14em] sm:text-sm', theme.accent)}>
                {copy.title}
              </p>
              <p className={cn('mt-0.5 font-serif text-wood/62 max-sm:hidden', isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm')}>
                {copy.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors', theme.reset)}
              aria-label={t('nav.reset')}
            >
              <RotateCcw size={14} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 max-sm:mt-0 max-sm:flex max-sm:gap-1 max-sm:rounded-xl max-sm:bg-black/[0.05] max-sm:p-1">
            {stageDefinitions.map((item, index) => {
              const isUnlocked = index <= maxUnlockedStage;
              const isActive = stageRank === index;
              const isComplete = stageRank > index;

              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => {
                    if (!isUnlocked) return;
                    setStage(item.key);
                  }}
                  className={cn(
                    'min-h-10 rounded-xl px-2.5 py-2 text-center font-display text-[12px] font-semibold tracking-[0.02em] ring-1 transition-all sm:text-xs md:text-[13px] max-sm:min-h-10 max-sm:flex-1 max-sm:rounded-lg max-sm:px-1 max-sm:py-1 max-sm:leading-tight max-sm:ring-0',
                    isActive
                      ? cn(theme.selected, 'ring-1')
                      : isComplete
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
                      : isUnlocked
                      ? 'bg-white/80 text-wood/75 ring-black/[0.07] hover:bg-white'
                      : 'cursor-not-allowed bg-white/45 text-wood/50 ring-black/[0.04]'
                  )}
                >
                  {isComplete ? '✓ ' : ''}{item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={reset}
              className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:hidden', theme.reset)}
              aria-label={t('nav.reset')}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (stage === 'context' && currentContext) {
    return (
      <div className="h-full flex flex-col gap-3 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'} onPointerDown={(event) => event.stopPropagation()}>
        {stageHeader}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pe-2 max-sm:ps-0.5">
          <div className="mx-auto max-w-4xl desk:max-w-[80rem] wide:max-w-none space-y-4 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={cn('font-display text-sm font-semibold tracking-[0.04em] sm:text-base', theme.accent)}>02 · {copy.context}</p>
                <p className={cn('mt-1 font-serif text-wood/52', isArabic ? 'text-base' : 'text-sm')}>{copy.contextHint}</p>
              </div>
              <span className={cn('shrink-0 whitespace-nowrap font-display text-xs font-semibold tabular-nums', theme.accent)}>
                {formatNumber(contextIndex + 1)} / {formatNumber(contextItems.length)}
              </span>
            </div>

            <div className={cn('rounded-2xl p-5 ring-1', theme.barBg, theme.selected)}>
              <div className="flex flex-wrap gap-2 font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-wood/58">
                {currentContext.chapter && <span>{copy.chapter} {formatNumber(currentContext.chapter)}</span>}
                {currentContext.partOfSpeech && <span>· {partOfSpeechLabel(currentContext.partOfSpeech, language)}</span>}
              </div>
              <p className={cn('mt-3 font-serif font-semibold leading-[1.7] text-wood', isArabic ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl')}>
                {contextPrompt}
              </p>
            </div>

            <div className={cn('grid gap-2.5', contextOptions.length > 3 ? 'sm:grid-cols-2' : 'sm:grid-cols-3')}>
              {contextOptions.map(word => {
                const selected = contextChoice === word;
                const correct = (contextFeedback === 'correct' || (contextFeedback === 'wrong' && contextTries > 0)) && word === currentContext.word;
                const wrong = contextFeedback === 'wrong' && selected && !correct;

                return (
                  <button
                    key={word}
                    type="button"
                    onClick={() => answerContext(word)}
                    disabled={contextFeedback !== 'idle'}
                    className={cn(
                      'min-h-14 rounded-2xl px-4 font-serif font-semibold ring-1 transition-all',
                      correct
                        ? 'bg-emerald-600 text-white ring-emerald-600'
                        : wrong
                        ? 'bg-rose-50 text-rose-700 ring-rose-300'
                        : selected
                        ? cn(theme.selected, 'ring-1')
                        : cn('bg-white text-wood ring-black/[0.07]', theme.idle)
                    )}
                  >
                    {displayWord(word, language)}
                  </button>
                );
              })}
            </div>

            {contextFeedback !== 'idle' && (
              <FeedbackBox
                state={contextFeedback === 'correct' ? 'correct' : contextTries > 0 ? 'revealed' : 'retry'}
                revealKey={`context-${contextIndex}-${contextTries}`}
                message={contextFeedback === 'correct'
                  ? <><strong>{displayWord(currentContext.word, language)}</strong> · {currentContext.meaning}</>
                  : contextTries > 0 ? undefined : <>{copy.hintMeaning} <strong>{currentContext.meaning}</strong></>}
                onRetry={retryContext}
                onNext={continueContext}
              >
                {contextFeedback === 'wrong' && <><strong>{displayWord(currentContext.word, language)}</strong> · {currentContext.meaning}</>}
              </FeedbackBox>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'recall' && currentRecall) {
    return (
      <div className="h-full flex flex-col gap-3 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'} onPointerDown={(event) => event.stopPropagation()}>
        {stageHeader}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pe-2 max-sm:ps-0.5">
          <div className="mx-auto max-w-3xl desk:max-w-5xl wide:max-w-none space-y-4 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={cn('font-display text-sm font-semibold tracking-[0.04em] sm:text-base', theme.accent)}>03 · {copy.recall}</p>
                <p className={cn('mt-1 font-serif text-wood/52', isArabic ? 'text-base' : 'text-sm')}>{copy.recallHint}</p>
              </div>
              <span className={cn('shrink-0 whitespace-nowrap font-display text-xs font-semibold tabular-nums', theme.accent)}>
                {formatNumber(recallIndex + 1)} / {formatNumber(recallItems.length)}
              </span>
            </div>

            <div className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
              <p className={cn('font-serif font-semibold leading-[1.65] text-wood', isArabic ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl')}>
                {currentRecall.meaning}
              </p>
              {policy.vocabularyRecallMode === 'guided' && currentRecall.context && (
                <p className={cn('mt-4 rounded-xl p-3 font-serif leading-relaxed text-wood/62', theme.barBg, isArabic ? 'text-base' : 'text-sm')}>
                  {maskWord(currentRecall.context, currentRecall.word)}
                </p>
              )}
              {policy.vocabularyRecallMode === 'guided' && (
                <p className={cn('mt-3 font-display text-[11px] font-semibold uppercase tracking-[0.12em]', theme.accent)}>
                  {copy.cue}: {currentRecall.word.charAt(0)}…
                </p>
              )}
            </div>

            {policy.vocabularyRecallMode === 'choice' ? (
              <div className="grid gap-2.5 sm:grid-cols-3">
                {recallOptions.map(word => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => setRecallChoice(word)}
                    disabled={recallFeedback !== 'idle'}
                    className={cn(
                      'min-h-14 rounded-2xl px-4 font-serif font-semibold ring-1 transition-all',
                      (recallFeedback === 'correct' || answerRevealed) && word === currentRecall.word
                        ? 'bg-emerald-600 text-white ring-emerald-600'
                        : recallFeedback === 'wrong' && recallChoice === word
                        ? 'bg-rose-50 text-rose-700 ring-rose-300'
                        : recallChoice === word ? cn(theme.selected, 'ring-1') : cn('bg-white ring-black/[0.07]', theme.idle)
                    )}
                  >
                    {displayWord(word, language)}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={typedRecall}
                onChange={(event) => setTypedRecall(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && typedRecall.trim() && recallFeedback === 'idle') verifyRecall();
                }}
                disabled={recallFeedback !== 'idle'}
                autoComplete="off"
                spellCheck={false}
                placeholder={isArabic ? 'اكتب الكلمة هنا…' : 'Type the target word…'}
                className={cn('min-h-14 w-full rounded-2xl bg-white px-4 font-serif text-lg text-wood outline-none ring-1 focus:ring-2', theme.selected)}
              />
            )}

            {policy.vocabularyRecallMode === 'independent' && (recallFeedback === 'correct' || answerRevealed) && (
              <div className="rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
                <label className={cn('block font-display text-[11px] font-semibold uppercase tracking-[0.12em]', theme.accent)}>
                  {copy.usePrompt}
                </label>
                <textarea
                  value={useSentence}
                  onChange={(event) => setUseSentence(event.target.value)}
                  rows={2}
                  placeholder={copy.usePlaceholder}
                  className="mt-2 w-full resize-none rounded-xl bg-stone-50 px-3.5 py-3 font-serif text-sm leading-relaxed text-wood outline-none ring-1 ring-black/[0.06] focus:ring-2 focus:ring-black/[0.12]"
                />
              </div>
            )}

            {recallFeedback === 'idle' ? (
              <button
                type="button"
                onClick={verifyRecall}
                disabled={policy.vocabularyRecallMode === 'choice' ? !recallChoice : !typedRecall.trim()}
                className={cn('w-full min-h-12 rounded-xl font-display uppercase tracking-widest font-bold transition-colors disabled:cursor-not-allowed bg-brand-700 text-white hover:bg-brand-800 disabled:bg-gray-100 disabled:text-gray-400', isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm')}
              >
                {copy.check}
              </button>
            ) : (
              <FeedbackBox
                state={recallFeedback === 'correct' ? 'correct' : answerRevealed ? 'revealed' : 'retry'}
                revealKey={`recall-${recallIndex}-${recallAttempts}`}
                message={recallFeedback === 'correct'
                  ? <><strong>{displayWord(currentRecall.word, language)}</strong> · {currentRecall.meaning}</>
                  : answerRevealed ? undefined : <>{copy.cue}: <strong>{displayWord(currentRecall.word, language).charAt(0)}…</strong></>}
                onRetry={retryRecall}
                onNext={continueRecall}
                nextDisabled={policy.vocabularyRecallMode === 'independent' && useSentence.trim().length < 8}
              >
                {recallFeedback === 'wrong' && <><strong>{displayWord(currentRecall.word, language)}</strong> · {currentRecall.meaning}</>}
              </FeedbackBox>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'done') {
    return (
      <div className="h-full flex flex-col gap-3 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        {stageHeader}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pe-2 max-sm:ps-0.5">
          <div className="mx-auto max-w-3xl desk:max-w-5xl wide:max-w-none pb-3">
            <EndCard
              title={copy.done}
              onRestart={reset}
              onNext={onNextPage}
              nextLabel={nextPageLabel}
              actions={revisitWords.size > 0 && onReviewGlossary ? (
                <button
                  type="button"
                  onClick={onReviewGlossary}
                  className={cn('inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 font-display text-[12px] font-semibold', theme.badge)}
                >
                  <SECTION_ICONS.glossary.icon size={16} />
                  {copy.backToGlossary}
                </button>
              ) : undefined}
            >
              <p className={cn('text-center font-serif text-emerald-900/70', isArabic ? 'text-base' : 'text-sm')}>
                {formatNumber(Math.max(0, pairs.length - revisitWords.size))} / {formatNumber(pairs.length)} {copy.mastered}
              </p>
              {revisitWords.size > 0 && (
                <div className="mt-4 rounded-2xl bg-white/80 p-4 ring-1 ring-rose-200">
                  <p className="font-display text-sm font-semibold text-rose-800">{copy.revisit}</p>
                  <p className={cn('mt-1 font-serif text-rose-900/60', isArabic ? 'text-base' : 'text-sm')}>{copy.revisitHint}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[...revisitWords].map(word => (
                      <span key={word} className="rounded-full bg-white px-3 py-1.5 font-serif text-sm font-semibold text-rose-800 ring-1 ring-rose-200">
                        {displayWord(word, language)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </EndCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'} onPointerDown={(event) => event.stopPropagation()}>
      {stageHeader}
      <div className="flex items-center gap-3 shrink-0 px-1">
        <span className={cn('font-display font-semibold text-wood/60 tabular-nums shrink-0', isArabic ? 'text-sm' : 'text-xs')}>
          {formatNumber(correctCount)}/{formatNumber(total)}
        </span>
        <div className={cn('flex-1 h-1.5 rounded-full overflow-hidden', theme.barBg)}>
          <motion.div className={cn('h-full rounded-full', theme.barFill)} animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} />
        </div>
        <AnimatePresence>
          {streak >= 2 && (
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className={cn('flex items-center gap-1 px-2 py-1 rounded-full font-semibold shrink-0', isArabic ? 'text-sm' : 'text-[11px]', theme.badge)}>
              <Zap size={10} />{formatNumber(streak)}×
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {feedback.kind === 'idle' && (
        <div className="shrink-0 min-h-[58px] max-sm:hidden">
          <div className="rounded-2xl border-2 border-dashed border-gray-200 h-full min-h-[58px] flex items-center justify-center gap-2 px-4">
            <Lightbulb size={17} className={theme.accent} />
            <p className={cn('font-serif text-wood/50', isArabic ? 'text-base' : 'text-sm')}>{t('ex.selectWordHint')}</p>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-2">
        <MatchingBoard
          pairs={boardPairs}
          meanings={meaningOrder}
          assignments={boardAssignments}
          onAssignmentsChange={handleBoardChange}
          results={boardResults}
          lockedLefts={lockedWords}
          disabled={feedback.kind !== 'idle'}
          headings={{ left: t('ex.words'), right: t('ex.meanings') }}
          instructions={null}
          renderLeft={(word) => displayWord(word, language)}
          className="pb-2"
        />
        {feedback.kind === 'idle' ? (
          <button
            type="button"
            onClick={checkMatches}
            disabled={!allPlaced}
            data-check-matches
            className={cn(
              'mt-4 w-full min-h-12 rounded-xl font-display uppercase tracking-widest font-bold transition-colors',
              isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm',
              allPlaced ? 'bg-brand-700 text-white hover:bg-brand-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            )}
          >
            {t('nav.matchedThem')}
          </button>
        ) : (
          <FeedbackBox
            className="mt-4"
            state={feedback.kind === 'checked' ? 'retry' : feedback.revealed > 0 ? 'revealed' : 'correct'}
            revealKey={`match-${matchRound}`}
            message={feedback.kind === 'checked'
              ? t('ex.matchesResult').replace('{correct}', formatNumber(feedback.correct)).replace('{wrong}', formatNumber(feedback.wrong))
              : feedback.revealed > 0 ? copy.matchRevealed : t('ex.allWordsMatched').replace('{total}', formatNumber(total))}
            onRetry={retryMatches}
            onNext={() => setStage('context')}
          />
        )}
      </div>
    </div>
  );
};