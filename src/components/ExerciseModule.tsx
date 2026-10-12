import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Eye,
  ChatCircleDots,
} from './ui/icons';
import { Exercise } from '../types';
import { cn } from '../lib/utils';
import { MODE_ICONS, modeKeyFor } from '../lib/sectionIcons';
import { useLanguage } from '../contexts/LanguageContext';
import { useClassMode } from '../contexts/ClassModeContext';
import { highlightPhraseMatches } from '../lib/highlightTextMatch';
import {
  presentDeranged,
  presentExerciseTitle,
  presentMatchingMeanings,
  presentMultipleChoice,
  presentQuizOptions,
} from '../lib/exercisePresentation';
import { isLanguageItemType, scoreLanguageItems } from '../lib/exerciseScoring';
import { LanguageItemExercise } from './exercises/LanguageItemExercises';
import { MatchingBoard } from './exercises/MatchingBoard';
import { useIsPhone, useRevealOnPhone } from '../lib/phone';
import { useDialogFocus } from '../hooks/useDialogFocus';

interface ExerciseModuleProps {
  exercise: Exercise;
  onComplete: () => void;
  onClose: () => void;
  /** Opens the chapter's next activity; the closing screen shows it as "Next activity" (or "Finish" when isLast). */
  onNext?: () => void;
  /** Reports whether the first try was right (once per exercise). */
  onFirstTry?: (right: boolean) => void;
  isLast?: boolean;
  collectionId?: string;
  variant?: 'default' | 'quick' | 'language' | 'review';
  embedded?: boolean;
}

const CLOSING = {
  en: {
    firstTry: (right: string, total: string) => `First try: ${right} / ${total} correct`,
    allFirst: 'All correct on the first try.',
    oneFirst: 'Correct on the first try.',
    later: 'Correct on a later try.',
    answerShown: 'The right answer is shown above.',
    missedMarked: 'The ones you missed are marked above. Read them once more.',
    next: 'Next activity',
    finish: 'Finish',
    showAnswers: 'Show answers',
    classTitle: 'Talk about it together',
    askClass: 'Ask the class: Which sentence in the story helps? Find it and read it aloud.',
  },
  ar: {
    firstTry: (right: string, total: string) => `المحاولة الأولى: ${right} من ${total} صحيحة`,
    allFirst: 'كلّها صحيحة من المحاولة الأولى.',
    oneFirst: 'صحيحة من المحاولة الأولى.',
    later: 'صحيحة في محاولة لاحقة.',
    answerShown: 'الإجابة الصحيحة ظاهرة في الأعلى.',
    missedMarked: 'ما لم يكن صحيحًا مُعلَّم في الأعلى. اقرأه مرّة أخرى.',
    next: 'النشاط التالي',
    finish: 'إنهاء',
    showAnswers: 'أظهر الإجابات',
    classTitle: 'ناقشوا معًا',
    askClass: 'اسأل الصف: أيّ جملة في القصة تساعد؟ ابحثوا عنها واقرؤوها بصوت عالٍ.',
  },
};

// The collection's colours come from the brand-* tokens App publishes; the classes are the same for every collection.
const theme = {
    accentBg: 'bg-brand-600',
    accentHover: 'hover:bg-brand-700',
    accentText: 'text-brand-700',
    title: 'text-brand-950',
    softBg: 'bg-brand-50',
    softBorder: 'border-brand-200',
    selected: 'border-brand-500 bg-brand-50 text-brand-950',
  };

const normalizeText = (value: unknown) => String(value ?? '')
  .trim()
  .toLocaleLowerCase()
  .normalize('NFKC')
  .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
  .replace(/ـ/g, '')
  .replace(/[أإآٱ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ؤ/g, 'و')
  .replace(/ئ/g, 'ي')
  .replace(/ة/g, 'ه')
  .replace(/\s+/g, ' ');

const sameUnorderedGroup = (left: string[] = [], right: string[] = []) => {
  const a = left.map(normalizeText).sort();
  const b = right.map(normalizeText).sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
};

export const ExerciseModule: React.FC<ExerciseModuleProps> = ({
  exercise,
  onComplete,
  onClose,
  onNext,
  onFirstTry,
  isLast = false,
  variant = 'default',
  embedded = false,
}) => {
  const { language, t, formatNumber, isRTL } = useLanguage();
  // Full-screen exercises: focus moves in, Tab stays inside, Escape closes, focus returns to the opener.
  const dialogRef = useDialogFocus(!embedded, onClose);
    const isArabic = language === 'ar';
  const isQuick = variant === 'quick';
  const isLanguage = variant === 'language';
  const isReview = variant === 'review';
  const isPhone = useIsPhone();
  const displayExerciseTitle = React.useMemo(() => presentExerciseTitle(exercise), [exercise]);
  const [userAnswer, setUserAnswer] = React.useState<any>(null);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);
  const [matchingAssignments, setMatchingAssignments] = React.useState<Record<string, string>>({});
  const [localSequence, setLocalSequence] = React.useState<string[]>([]);
  const [selectedDragItem, setSelectedDragItem] = React.useState<string | null>(null);
  const [dragAssignments, setDragAssignments] = React.useState<Record<string, string[]>>({});
  const [revealedItems, setRevealedItems] = React.useState<Set<number>>(new Set());
  const [quizStep, setQuizStep] = React.useState(0);
  const [quizScore, setQuizScore] = React.useState(0);
  const [quizAnswered, setQuizAnswered] = React.useState(false);
  const [quizWasCorrect, setQuizWasCorrect] = React.useState<boolean | null>(null);
  const [reflectionResponse, setReflectionResponse] = React.useState('');
  const { classMode } = useClassMode();
  const [shownExamples, setShownExamples] = React.useState<Set<number>>(new Set());
  const [attempt, setAttempt] = React.useState(0);
  // Score of the first check only; later tries never change it.
  const [firstTry, setFirstTry] = React.useState<{ right: number; total: number } | null>(null);
  const [classReveal, setClassReveal] = React.useState(false);
  const feedbackRef = useRevealOnPhone<HTMLElement>(isSubmitted ? `${attempt}-${String(classReveal)}` : null);
  const closing = CLOSING[isArabic ? 'ar' : 'en'];

  const reflectionNeedsWriting = exercise.type === 'reflection' && (
    /\bwrite\b/i.test(exercise.instructions ?? '')
    || (exercise.instructions ?? '').includes('كتابة')
  );

  const presentedMcOptions = React.useMemo(() => presentMultipleChoice(exercise), [exercise]);
  const presentedMeanings = React.useMemo(() => presentMatchingMeanings(exercise), [exercise]);
  const sequenceItems = React.useMemo(() => {
    const items = exercise.sequencingItems ?? [];
    if (items.length <= 1) return items;
    return [...items.slice(1), items[0]];
  }, [exercise]);

  // Reset while rendering, not in an effect, so the next activity never shows one frame of the previous result.
  const [shownExercise, setShownExercise] = React.useState(exercise);
  if (shownExercise !== exercise) {
    setShownExercise(exercise);
    setUserAnswer(null);
    setIsSubmitted(false);
    setShowHint(false);
    setMatchingAssignments({});
    setLocalSequence([]);
    setSelectedDragItem(null);
    setDragAssignments({});
    setRevealedItems(new Set());
    setQuizStep(0);
    setQuizScore(0);
    setQuizAnswered(false);
    setQuizWasCorrect(null);
    setReflectionResponse('');
    setAttempt(0);
    setFirstTry(null);
    setClassReveal(false);
  }

  React.useEffect(() => {
    if (embedded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [embedded]);

  const isCorrectAnswer = (answer: any) => {
    if (exercise.type === 'matching') {
      return (exercise.matchingPairs ?? []).every(
        (pair) => matchingAssignments[pair.left] === pair.right
      );
    }
    if (exercise.type === 'sequencing') {
      return JSON.stringify(answer) === JSON.stringify(exercise.correctAnswer);
    }
    if (exercise.type === 'drag-drop') {
      const correct = exercise.correctAnswer as Record<string, string[]>;
      return Object.keys(correct ?? {}).every((group) =>
        sameUnorderedGroup((answer ?? {})[group] ?? [], correct[group] ?? [])
      );
    }
    if (exercise.type === 'reflection' || exercise.type === 'tap-reveal') return true;
    if (isLanguageItemType(exercise.type)) {
      const results = scoreLanguageItems(exercise, answer);
      return Boolean(results?.length) && results!.every(Boolean);
    }
    if (exercise.type === 'fill-blanks') {
      if (typeof answer !== 'string') return false;
      const expectedAnswers = Array.isArray(exercise.correctAnswer)
        ? exercise.correctAnswer.map(String)
        : [String(exercise.correctAnswer ?? '')];

      return expectedAnswers.some((expected) => (
        normalizeText(answer) === normalizeText(expected)
        || highlightPhraseMatches(answer, expected, language === 'ar' ? 'ar' : 'en')
      ));
    }
    return answer === exercise.correctAnswer;
  };

  const scoreItems = (answer: any): { right: number; total: number } | null => {
    if (exercise.type === 'reflection' || exercise.type === 'tap-reveal') return null;
    if (exercise.type === 'matching') {
      const pairs = exercise.matchingPairs ?? [];
      return { right: pairs.filter((pair) => matchingAssignments[pair.left] === pair.right).length, total: pairs.length };
    }
    if (exercise.type === 'sequencing') {
      const expected = (exercise.correctAnswer ?? []) as unknown[];
      const given = Array.isArray(answer) ? answer : [];
      return { right: expected.filter((item, index) => given[index] === item).length, total: expected.length };
    }
    if (exercise.type === 'drag-drop') {
      const correctGroups = (exercise.correctAnswer ?? {}) as Record<string, string[]>;
      const groups = Object.entries(correctGroups);
      const placed = (answer ?? {}) as Record<string, string[]>;
      const total = groups.reduce((sum, [, items]) => sum + items.length, 0);
      const right = groups.reduce((sum, [group, items]) => {
        const mine = (placed[group] ?? []).map(normalizeText);
        return sum + items.filter((item) => mine.includes(normalizeText(item))).length;
      }, 0);
      return { right, total };
    }
    if (isLanguageItemType(exercise.type)) {
      const results = scoreLanguageItems(exercise, answer) ?? [];
      return { right: results.filter(Boolean).length, total: results.length };
    }
    return { right: isCorrectAnswer(answer) ? 1 : 0, total: 1 };
  };

  const submit = (answer: any = userAnswer) => {
    setUserAnswer(answer);
    setIsSubmitted(true);
    if (attempt === 0 && !firstTry) {
      setFirstTry(scoreItems(answer));
      onFirstTry?.(isCorrectAnswer(answer));
    }
  };

  const retry = () => {
    setAttempt((value) => value + 1);
    setUserAnswer(null);
    setIsSubmitted(false);
    setShowHint(false);
    setMatchingAssignments({});
    setLocalSequence([]);
    setSelectedDragItem(null);
    setDragAssignments({});
    setRevealedItems(new Set());
    setReflectionResponse('');
    setQuizStep(0);
    setQuizScore(0);
    setQuizAnswered(false);
    setQuizWasCorrect(null);
    setClassReveal(false);
  };

  // Class mode: "Show answers" puts the right answer on the board for everyone.
  const showClassAnswers = () => {
    setClassReveal(true);
    if (exercise.type === 'matching') {
      setMatchingAssignments(Object.fromEntries((exercise.matchingPairs ?? []).map((pair) => [pair.left, pair.right])));
    } else if (exercise.type === 'drag-drop') {
      const groups = { ...((exercise.correctAnswer ?? {}) as Record<string, string[]>) };
      setDragAssignments(groups);
      setUserAnswer(groups);
    } else if (exercise.type === 'sequencing') {
      const order = [...((exercise.correctAnswer ?? []) as string[])];
      setLocalSequence(order);
      setUserAnswer(order);
    }
  };

  const assignDragItem = (groupName: string, item: string | null = selectedDragItem) => {
    if (!item || isSubmitted) return;
    setDragAssignments((previous) => {
      const next: Record<string, string[]> = {};
      for (const [group, items] of Object.entries(previous)) {
        next[group] = items.filter((candidate) => candidate !== item);
      }
      next[groupName] = [...(next[groupName] ?? []), item];
      setUserAnswer(next);
      return next;
    });
    setSelectedDragItem(null);
  };

  // Phones: tapping a placed item sends it back to the pile.
  const unassignDragItem = (item: string) => {
    if (isSubmitted) return;
    setDragAssignments((previous) => {
      const next: Record<string, string[]> = {};
      for (const [group, items] of Object.entries(previous)) next[group] = items.filter((candidate) => candidate !== item);
      setUserAnswer(next);
      return next;
    });
  };

  const currentQuizQuestion = exercise.quizQuestions?.[quizStep];
  const currentQuizOptions = React.useMemo(
    () => currentQuizQuestion
      ? presentQuizOptions(currentQuizQuestion, `${exercise.id}:${quizStep}`)
      : [],
    [currentQuizQuestion, exercise.id, quizStep]
  );

  const answerQuiz = (isCorrect: boolean) => {
    if (quizAnswered) return;
    setQuizAnswered(true);
    setQuizWasCorrect(isCorrect);
    if (isCorrect) setQuizScore((score) => score + 1);
  };

  const nextQuiz = () => {
    const total = exercise.quizQuestions?.length ?? 0;
    if (quizStep < total - 1) {
      setQuizStep((step) => step + 1);
      setQuizAnswered(false);
      setQuizWasCorrect(null);
    } else {
      if (attempt === 0 && !firstTry) setFirstTry({ right: quizScore, total });
      setIsSubmitted(true);
    }
  };

  const renderContent = () => {
    if (exercise.type === 'true-false') {
      return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[true, false].map((value) => {
            const selected = userAnswer === value;
            const revealCorrect = revealAnswer && exercise.correctAnswer === value;
            const revealWrong = isSubmitted && selected && !revealCorrect;
            return (
              <button
                key={String(value)}
                type="button"
                disabled={isSubmitted}
                onClick={() => {
                  setUserAnswer(value);
                  submit(value);
                }}
                className={cn(
                  'min-h-14 sm:min-h-16 rounded-2xl border-2 font-display font-black uppercase tracking-wider transition-colors',
                  isArabic ? 'text-base sm:text-lg md:text-xl' : 'text-sm sm:text-lg md:text-xl',
                  revealCorrect
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : revealWrong
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : selected
                        ? `${theme.accentBg} border-transparent text-white`
                        : `bg-white ${theme.softBorder} text-wood/65`
                )}
              >
                {value ? t('nav.true') : t('nav.false')}
              </button>
            );
          })}
        </div>
      );
    }

    if (exercise.type === 'multiple-choice') {
      return (
        <div className="grid grid-cols-1 gap-3">
          {presentedMcOptions.map((option, displayIndex) => {
            const selected = userAnswer === option.originalIndex;
            const revealCorrect = revealAnswer && option.originalIndex === exercise.correctAnswer;
            const revealWrong = isSubmitted && selected && !revealCorrect;
            return (
              <button
                key={`${option.originalIndex}-${option.text}`}
                type="button"
                disabled={isSubmitted}
                onClick={() => {
                  setUserAnswer(option.originalIndex);
                  submit(option.originalIndex);
                }}
                className={cn(
                  'w-full min-h-14 sm:min-h-16 rounded-2xl border-2 px-4 py-3 flex items-center gap-4 text-start transition-colors',
                  revealCorrect
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : revealWrong
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : selected
                        ? theme.selected
                        : `bg-white ${theme.softBorder}`
                )}
              >
                <span className={cn(
                  'w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-display text-sm font-black',
                  revealCorrect || revealWrong
                    ? 'bg-white/20 text-white'
                    : selected
                      ? `${theme.accentBg} text-white`
                      : `${theme.softBg} ${theme.accentText}`
                )}>
                  {isArabic ? (['أ', 'ب', 'ج', 'د', 'هـ', 'و'][displayIndex] ?? formatNumber(displayIndex + 1)) : String.fromCharCode(65 + displayIndex)}
                </span>
                <span className={cn(
                  'font-serif font-semibold leading-snug flex-1',
                  isArabic ? 'text-base sm:text-lg md:text-xl' : 'text-sm sm:text-base md:text-lg'
                )}>
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    if (exercise.type === 'matching') {
      const pairs = exercise.matchingPairs ?? [];
      const allAssigned = pairs.length > 0 && Object.keys(matchingAssignments).length === pairs.length;
      return (
        <div className="space-y-5">
          <MatchingBoard
            pairs={pairs}
            meanings={presentedMeanings}
            assignments={matchingAssignments}
            onAssignmentsChange={setMatchingAssignments}
            submitted={isSubmitted}
            headings={exercise.matchingHeadings}
            instructions={exercise.matchingHeadings ? null : undefined}
          />
          {!isSubmitted && (
            <button
              type="button"
              disabled={!allAssigned}
              onClick={() => submit(matchingAssignments)}
              className={cn(
                'w-full min-h-12 rounded-xl font-display uppercase tracking-widest font-bold',
                isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm',
                allAssigned ? `${theme.accentBg} ${theme.accentHover} text-white` : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {t('nav.matchedThem')}
            </button>
          )}
        </div>
      );
    }

    if (isLanguageItemType(exercise.type)) {
      return (
        <LanguageItemExercise
          key={`${exercise.id}:${attempt}`}
          exercise={exercise}
          isSubmitted={isSubmitted}
          onSubmit={(answer) => submit(answer)}
          theme={theme}
        />
      );
    }

    if (exercise.type === 'sequencing') {
      return (
        <div className="space-y-3">
          <p className={cn('font-serif text-wood/55', isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base')}>{t('nav.sequencingInstructions')}</p>
          {sequenceItems.map((item) => {
            const order = localSequence.indexOf(item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={isSubmitted}
                onClick={() => setLocalSequence((previous) =>
                  previous.includes(item.id)
                    ? previous.filter((id) => id !== item.id)
                    : [...previous, item.id]
                )}
                className={cn(
                  'w-full min-h-14 rounded-xl border-2 px-4 py-3 text-start flex items-center gap-4 font-serif font-semibold',
                  isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base',
                  order >= 0 ? theme.selected : `bg-white ${theme.softBorder}`
                )}
              >
                <span className={cn(
                  'w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-display text-sm font-black',
                  order >= 0 ? `${theme.accentBg} text-white` : 'bg-gray-100 text-gray-400'
                )}>
                  {order >= 0 ? formatNumber(order + 1) : '—'}
                </span>
                <span>{item.text}</span>
              </button>
            );
          })}
          {!isSubmitted && (
            <button
              type="button"
              disabled={localSequence.length !== sequenceItems.length}
              onClick={() => submit(localSequence)}
              className={cn(
                'w-full min-h-12 rounded-xl font-display uppercase tracking-widest font-bold',
                isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm',
                localSequence.length === sequenceItems.length
                  ? `${theme.accentBg} text-white`
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {localSequence.length === sequenceItems.length
                ? t('nav.checkOrder')
                : `${t('nav.selectAllEvents')} (${formatNumber(localSequence.length)}/${formatNumber(sequenceItems.length)})`}
            </button>
          )}
        </div>
      );
    }

    if (exercise.type === 'fill-blanks') {
      return (
        <div className="rounded-2xl bg-white border-2 border-gray-100 p-4 sm:p-6 space-y-5">
          <div className={cn('font-serif leading-loose text-wood', isArabic ? 'text-lg sm:text-xl' : 'text-base sm:text-lg')}>
            {(exercise.fillBlanksText ?? '').split(/(\[blank\]|_{3,})/g).map((part, index) => {
              const isBlank = /^(?:\[blank\]|_{3,})$/.test(part);
              if (!isBlank) return <React.Fragment key={index}>{part}</React.Fragment>;
              return (
                <input
                  key={index}
                  type="text"
                  disabled={isSubmitted}
                  value={typeof userAnswer === 'string' ? userAnswer : ''}
                  onChange={(event) => setUserAnswer(event.target.value)}
                  aria-label={isArabic ? 'إجابة الفراغ' : 'Blank answer'}
                  className={cn('mx-2 px-3 py-1 border-b-2 bg-transparent outline-none min-w-32 text-center font-bold', theme.softBorder)}
                />
              );
            })}
          </div>
          {!isSubmitted && (
            <button type="button" onClick={() => submit(userAnswer)} className={cn('w-full min-h-12 rounded-xl text-white font-bold', isArabic && 'text-base', theme.accentBg)}>
              {t('nav.check')}
            </button>
          )}
        </div>
      );
    }

    if (exercise.type === 'drag-drop') {
      // Authored groups list their items together; mix them so the order does not give the answer away.
      const allItems = presentDeranged(exercise.dragDropGroups?.flatMap((group) => group.items) ?? [], `${exercise.id}:items`);
      const assigned = Object.values(dragAssignments).flat();
      const available = allItems.filter((item) => !assigned.includes(item));
      const allAssigned = allItems.length > 0 && available.length === 0;
      if (isPhone) {
        // Phones: one item at a time, the group buttons right under it; placed items collect below the buttons.
        const groups = exercise.dragDropGroups ?? [];
        const current = available[0] ?? null;
        return (
          <div className="space-y-4">
            {current && !isSubmitted ? (
              <div className="space-y-2">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn('rounded-[20px] border-2 border-stone-200 bg-white px-5 py-7 text-center font-serif font-semibold leading-relaxed text-wood shadow-[0_10px_28px_-14px_rgba(20,34,26,0.35)]', isArabic ? 'text-xl' : 'text-lg')}
                >
                  {current}
                </motion.div>
                <p className={cn('text-center font-display text-wood/45 tabular-nums', isArabic ? 'text-sm' : 'text-xs')}>
                  {formatNumber(allItems.length - available.length + 1)} / {formatNumber(allItems.length)}
                </p>
              </div>
            ) : null}
            {!isSubmitted && (
              <div className="pt-1">
                {current ? (
                  <div className={cn('grid gap-2', groups.length === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
                    {groups.map((group) => (
                      <button
                        key={group.group}
                        type="button"
                        onClick={() => assignDragItem(group.group, current)}
                        className={cn('min-h-14 rounded-xl border-2 bg-white px-3 py-2 font-display font-semibold leading-snug', isArabic ? 'text-base' : 'text-sm', theme.softBorder, theme.accentText)}
                      >
                        {group.group}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button type="button" disabled={!allAssigned} onClick={() => submit(dragAssignments)} className={cn('w-full min-h-12 rounded-xl font-bold', isArabic && 'text-base', allAssigned ? `${theme.accentBg} text-white` : 'bg-gray-100 text-gray-400')}>
                    {t('nav.check')}
                  </button>
                )}
              </div>
            )}
            {groups.some((group) => (dragAssignments[group.group] ?? []).length > 0) && (
              <div className="space-y-2 border-t border-black/[0.06] pt-3">
                {groups.map((group) => {
                  const placed = dragAssignments[group.group] ?? [];
                  if (!placed.length) return null;
                  return (
                    <div key={group.group}>
                      <p className={cn('mb-1.5 font-display font-bold', isArabic ? 'text-sm' : 'text-xs', theme.accentText)}>{group.group}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {placed.map((item) => (
                          <button
                            key={item}
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => unassignDragItem(item)}
                            className={cn('min-h-9 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-start font-serif', isArabic ? 'text-sm' : 'text-xs')}
                          >
                            {item}{!isSubmitted && <span className="ms-1.5 text-wood/35" aria-hidden="true">×</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }
      return (
        <div className="space-y-5">
          <div>
            <p className={cn('font-display uppercase tracking-widest text-wood/45 mb-2', isArabic ? 'text-sm' : 'text-xs')}>{t('nav.availableItems')}</p>
            <div className="min-h-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-3 flex flex-wrap gap-2">
              {available.map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => setSelectedDragItem(selectedDragItem === item ? null : item)}
                  className={cn('px-3 py-2 rounded-lg border-2 bg-white font-serif font-semibold', isArabic ? 'text-base' : 'text-sm', selectedDragItem === item ? theme.selected : 'border-gray-200')}
                >
                  {item}
                </button>
              ))}
              {!available.length && <span className={cn('text-wood/40 m-auto', isArabic ? 'text-base' : 'text-sm')}>{t('nav.allItemsAssigned')}</span>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {exercise.dragDropGroups?.map((group) => (
              <button
                key={group.group}
                type="button"
                disabled={isSubmitted || !selectedDragItem}
                onClick={() => assignDragItem(group.group)}
                className={cn('rounded-2xl border-2 min-h-32 p-4 text-start', selectedDragItem ? theme.softBorder : 'border-gray-100 bg-gray-50')}
              >
                <h5 className={cn('font-display font-bold mb-3', isArabic ? 'text-base' : 'text-sm', theme.accentText)}>{group.group}</h5>
                <div className="flex flex-wrap gap-2">
                  {(dragAssignments[group.group] ?? []).map((item) => (
                    <span key={item} className={cn('px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 font-serif', isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm')}>{item}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
          {!isSubmitted && (
            <button type="button" disabled={!allAssigned} onClick={() => submit(dragAssignments)} className={cn('w-full min-h-12 rounded-xl font-bold', isArabic && 'text-base', allAssigned ? `${theme.accentBg} text-white` : 'bg-gray-100 text-gray-400')}>
              {t('nav.check')}
            </button>
          )}
        </div>
      );
    }

    if (exercise.type === 'tap-reveal') {
      const items = exercise.tapRevealItems ?? [];
      return (
        <div className="space-y-3">
          {items.map((item, index) => {
            const revealed = revealedItems.has(index);
            return (
              <button
                key={`${item.question}-${index}`}
                type="button"
                onClick={() => setRevealedItems((previous) => new Set(previous).add(index))}
                className={cn('w-full rounded-2xl border-2 p-5 sm:p-7 text-center min-h-28', theme.softBorder, theme.softBg)}
              >
                <p className={cn('font-serif font-semibold text-wood', isArabic ? 'text-lg sm:text-xl' : 'text-base sm:text-lg')}>{revealed ? item.answer : item.question}</p>
                {!revealed && <span className={cn('block mt-3 uppercase tracking-widest font-bold', isArabic ? 'text-sm sm:text-base' : 'text-xs', theme.accentText)}>{t('nav.tapToReveal')}</span>}
              </button>
            );
          })}
          {!isSubmitted && revealedItems.size === items.length && (
            <button type="button" onClick={() => submit(true)} className={cn('w-full min-h-12 rounded-xl text-white font-bold', isArabic && 'text-base', theme.accentBg)}>{t('nav.continue')}</button>
          )}
        </div>
      );
    }

    if (exercise.type === 'reflection') {
      return (
        <div className="space-y-4">
          {exercise.type === 'reflection' && (
            <div className="rounded-2xl bg-white border-2 border-gray-100 p-4 sm:p-5">
              {!reflectionNeedsWriting && (
                <p className={cn('mb-2 flex items-center gap-1.5 font-display font-semibold uppercase tracking-widest text-wood/45', isArabic ? 'text-sm' : 'text-[11px]')}>
                  <MODE_ICONS.sayOrWrite.icon size={15} aria-hidden="true" />
                  {isArabic ? 'قُلْها أو اكتُبْها (اختياري)' : 'Say it or write it (optional)'}
                </p>
              )}
              <textarea
                rows={reflectionNeedsWriting ? 5 : 3}
                disabled={isSubmitted}
                value={reflectionResponse}
                onChange={(event) => setReflectionResponse(event.target.value)}
                placeholder={isArabic ? 'اكتب إجابتك القصيرة هنا...' : 'Write your short response here...'}
                className={cn(
                  'w-full resize-y rounded-xl border-2 bg-white px-4 py-3 font-serif leading-relaxed text-wood outline-none',
                  isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base',
                  theme.softBorder
                )}
              />
            </div>
          )}
          {exercise.discussionPrompts?.map((prompt, index) => (
            <div key={`${prompt.question}-${index}`} className="rounded-2xl bg-white border-2 border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-2 text-wood/50">
                {(() => {
                  const mode = MODE_ICONS[modeKeyFor(prompt.mode)];
                  return (
                    <>
                      <mode.icon size={18} aria-hidden="true" />
                      <span className={cn('font-display uppercase tracking-widest', isArabic ? 'text-sm' : 'text-xs')}>{isArabic ? mode.ar : mode.en}</span>
                    </>
                  );
                })()}
              </div>
              <p className={cn('font-serif font-semibold text-wood', isArabic ? 'text-base sm:text-lg md:text-xl' : 'text-sm sm:text-base md:text-lg')}>{prompt.question}</p>
              {classMode && !isSubmitted && prompt.example && !shownExamples.has(index) && (
                <button
                  type="button"
                  data-class-show-example
                  onClick={() => setShownExamples(prev => new Set(prev).add(index))}
                  className={cn('mt-3 inline-flex min-h-9 items-center rounded-lg border border-emerald-300 bg-white px-3 font-display font-semibold text-emerald-800 hover:bg-emerald-50', isArabic ? 'text-sm' : 'text-[12px]')}
                >
                  {isArabic ? 'أَظْهِرِ المِثَالَ' : 'Show example'}
                </button>
              )}
              {(isSubmitted || shownExamples.has(index)) && prompt.example && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2">
                  <p className={cn('font-display font-semibold uppercase tracking-widest text-emerald-800', isArabic ? 'text-sm' : 'text-[11px]')}>
                    {isArabic ? 'مِثَالٌ عَلَى إِجَابَةٍ' : 'Example answer'}
                  </p>
                  <p className={cn('mt-1 font-serif text-wood', isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base')}>{prompt.example}</p>
                </div>
              )}
            </div>
          ))}
          {!isSubmitted && (
            <button
              type="button"
              disabled={reflectionNeedsWriting && !reflectionResponse.trim()}
              onClick={() => submit(reflectionResponse.trim() ? reflectionResponse : true)}
              className={cn(
                'w-full min-h-12 rounded-xl font-bold',
                isArabic && 'text-base',
                reflectionNeedsWriting && !reflectionResponse.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : `${theme.accentBg} text-white`
              )}
            >
              {t('nav.reflectedOnThese')}
            </button>
          )}
        </div>
      );
    }

    if (exercise.type === 'quiz-game') {
      const total = exercise.quizQuestions?.length ?? 0;
      if (isSubmitted) {
        return (
          <div className="rounded-2xl bg-white border-2 border-gray-100 p-6 text-center">
            <p className={cn('font-display text-3xl font-black', theme.title)}>{formatNumber(quizScore)}/{formatNumber(total)}</p>
            <p className={cn('font-serif text-wood/60 mt-2', isArabic ? 'text-base' : 'text-sm')}>{t('nav.challengeComplete')}</p>
          </div>
        );
      }
      if (!currentQuizQuestion) return null;
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <span className={cn('font-display uppercase tracking-widest', isArabic ? 'text-sm' : 'text-xs', theme.accentText)}>{t('nav.question')} {formatNumber(quizStep + 1)} / {formatNumber(total)}</span>
            <span className={cn('font-display font-bold text-wood/50', isArabic ? 'text-base' : 'text-sm')}>{formatNumber(quizScore)} {t('ex.pts')}</span>
          </div>
          <p className="font-serif text-lg sm:text-xl md:text-2xl font-bold text-wood leading-snug">{currentQuizQuestion.question}</p>
          <div className="grid grid-cols-1 gap-3">
            {currentQuizOptions.map((option, index) => (
              <button
                key={`${option.text}-${index}`}
                type="button"
                disabled={quizAnswered}
                onClick={() => answerQuiz(option.isCorrect)}
                className={cn(
                  'min-h-14 rounded-xl border-2 p-3 text-start font-serif font-semibold',
                  isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base',
                  quizAnswered && option.isCorrect ? 'border-emerald-500 bg-emerald-50' : `bg-white ${theme.softBorder}`
                )}
              >
                {option.text}
              </button>
            ))}
          </div>
          {quizAnswered && (
            <div className={cn('rounded-xl border p-3 font-serif', isArabic ? 'text-base' : 'text-sm', quizWasCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800')}>
              {quizWasCorrect ? t('nav.correctWellDone') : currentQuizQuestion.hint}
            </div>
          )}
          {quizAnswered && (
            <button type="button" onClick={nextQuiz} className={cn('w-full min-h-12 rounded-xl text-white font-bold flex items-center justify-center gap-2', isArabic && 'text-base', theme.accentBg)}>
              {quizStep < total - 1 ? t('nav.nextQuestion') : t('nav.seeResults')} <ArrowRight className={cn('w-4 h-4', isRTL && 'rotate-180')} />
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  const correct = isSubmitted && (exercise.type === 'quiz-game'
    ? quizScore === (exercise.quizQuestions?.length ?? 0)
    : isCorrectAnswer(userAnswer));
  // The first wrong try gets only the hint; the answer and explanation appear after a second try.
  // In class mode the teacher reveals them with "Show answers".
  const revealAnswer = isSubmitted && (correct || attempt > 0 || (classMode && classReveal) || exercise.type === 'quiz-game');
  // The closing screen: right, or the answer is already shown.
  const finished = isSubmitted && (correct || revealAnswer);

  const quickBackground =
    'radial-gradient(circle at 14% 8%, color-mix(in srgb, var(--brand-500) 12%, transparent), transparent 34%), #FBFAF6';
  const languageBackground =
    'radial-gradient(circle at 88% 12%, color-mix(in srgb, var(--brand-500) 11%, transparent), transparent 32%), #FCFBF8';

  const dialog = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        embedded
          ? 'relative flex min-h-0 w-full flex-col overflow-clip rounded-[24px] bg-white/72 ring-1 ring-black/[0.06]'
          : 'fixed inset-0 z-[1000] flex flex-col',
        !embedded && (isQuick ? 'bg-[#FBFAF6]' : isLanguage ? 'bg-[#FCFBF8]' : 'bg-[#FDFBF7]'),
        isRTL && 'font-arabic'
      )}
      style={!embedded ? (isQuick ? { background: quickBackground } : isLanguage ? { background: languageBackground } : undefined) : undefined}
      dir={isRTL ? 'rtl' : 'ltr'}
      ref={dialogRef}
      role={embedded ? 'group' : 'dialog'}
      aria-modal={embedded ? undefined : true}
      aria-label={isQuick ? t('nav.quickChallenge') : isLanguage ? (language === 'ar' ? 'التَّرْكِيزُ اللُّغَوِيُّ' : 'Language Focus') : (displayExerciseTitle || exercise.question || t('nav.interactiveChallenge'))}
    >
      <header className={cn(
        'shrink-0 px-4 sm:px-6 md:px-10 flex items-start justify-between gap-4',
        embedded && isReview
          ? 'border-b border-black/[0.05] bg-white/45 py-4 sm:py-5'
          : isQuick
          ? 'border-b border-black/[0.06] bg-white/45 py-4 sm:py-5 backdrop-blur-xl'
          : isLanguage
          ? 'border-b border-black/[0.05] bg-white/55 py-4 sm:py-5 backdrop-blur-xl'
          : `border-b-2 py-4 sm:py-5 ${theme.softBg} ${theme.softBorder}`
      )}>
        <div className="min-w-0">
          <p className={cn(
            'font-display uppercase tracking-[0.2em] font-semibold',
            isArabic ? 'text-sm sm:text-base' : 'text-[10px] sm:text-xs',
            theme.accentText
          )}>
            {isQuick
              ? t('nav.quickChallenge')
              : isLanguage
              ? (language === 'ar' ? 'التَّرْكِيزُ اللُّغَوِيُّ' : 'Language Focus')
              : isReview
              ? (language === 'ar' ? 'مهمة لغوية' : 'Language task')
              : t('nav.interactiveChallenge')}
          </p>

          {!isQuick && (
            <h3 className={cn(
              'mt-1 font-display text-xl sm:text-2xl md:text-3xl leading-tight',
              isLanguage ? 'font-semibold tracking-[-0.03em]' : 'font-black tracking-tight',
              theme.title
            )}>
              {displayExerciseTitle}
            </h3>
          )}

          {exercise.instructions && (
            <p className={cn(
              'font-serif',
              isQuick ? 'mt-2 max-w-3xl desk:max-w-4xl wide:max-w-none text-wood/58' : isLanguage ? 'mt-2 max-w-3xl desk:max-w-4xl wide:max-w-none text-wood/55' : `mt-1 ${theme.accentText}`,
              isArabic ? 'text-sm sm:text-base md:text-lg' : 'text-xs sm:text-sm md:text-base'
            )}>
              {exercise.instructions}
            </p>
          )}
        </div>

        {!embedded && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'touch-target flex shrink-0 items-center justify-center rounded-full transition-colors',
              isQuick || isLanguage
                ? 'bg-white/70 text-wood/55 shadow-sm ring-1 ring-black/[0.06] hover:bg-white hover:text-wood'
                : `border-2 bg-white ${theme.softBorder} ${theme.accentText}`
            )}
            aria-label={t('nav.close')}
          >
            <XCircle className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}
      </header>

      <main className={cn('flex-1 min-h-0 custom-scrollbar', embedded ? 'overflow-visible' : 'overflow-y-auto')}>
        <div className={cn(
          'w-full mx-auto px-4 sm:px-6 md:px-10 space-y-6',
          embedded && isReview
            ? 'max-w-5xl desk:max-w-[84rem] wide:max-w-none py-5 sm:py-6 md:py-7'
            : isQuick
            ? 'max-w-4xl desk:max-w-[72rem] wide:max-w-none py-7 sm:py-10 md:py-12'
            : isLanguage
            ? 'max-w-5xl desk:max-w-[84rem] wide:max-w-none py-7 sm:py-9 md:py-10'
            : 'max-w-6xl desk:max-w-[92rem] wide:max-w-none py-5 sm:py-8'
        )}>
          {exercise.question && exercise.type !== 'quiz-game' && (
            <h4 className={cn(
              'font-display font-semibold text-wood leading-[1.16]',
              isQuick
                ? 'max-w-3xl desk:max-w-5xl wide:max-w-none text-2xl tracking-[-0.03em] sm:text-3xl md:text-[2.15rem] desk:text-[2.45rem]'
                : isLanguage
                ? 'max-w-4xl desk:max-w-5xl wide:max-w-none text-xl tracking-[-0.025em] sm:text-2xl md:text-[1.75rem] desk:text-[2rem]'
                : isReview
                ? 'max-w-4xl desk:max-w-5xl wide:max-w-none text-lg tracking-[-0.02em] sm:text-xl md:text-2xl desk:text-[1.75rem]'
                : 'text-xl sm:text-2xl md:text-3xl desk:text-[2.15rem]'
            )}>
              {exercise.question}
            </h4>
          )}

          {renderContent()}

            {isSubmitted && (
              <motion.section
                ref={feedbackRef}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'rounded-2xl p-4 sm:p-6 space-y-4',
                  'scroll-mb-3',
                  isQuick || isLanguage ? 'border ring-1 ring-inset' : 'border-2',
                  classMode
                    ? `bg-white ${theme.softBorder} ring-black/[0.03]`
                    : correct
                    ? 'bg-emerald-50/70 border-emerald-200 ring-emerald-100'
                    : finished
                    ? 'bg-rose-50 border-rose-200 ring-rose-100'
                    : 'bg-amber-50 border-amber-200 ring-amber-100'
                )}
              >
                {classMode ? (
                  <div className="flex items-start gap-3">
                    <ChatCircleDots className={cn('shrink-0 mt-0.5', theme.accentText)} size={22} />
                    <div className="flex-1 min-w-0">
                      <p className={cn('font-display font-black', isArabic ? 'text-lg sm:text-xl' : 'text-base sm:text-lg', theme.title)}>{closing.classTitle}</p>
                      <p className={cn('font-serif text-wood/75 mt-1 leading-relaxed', isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base')}>{closing.askClass}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    {correct ? <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={22} /> : <XCircle className={cn('shrink-0 mt-0.5', finished ? 'text-rose-600' : 'text-amber-700')} size={22} />}
                    <div className="flex-1 min-w-0">
                      <p className={cn('font-display font-black', isArabic ? 'text-lg sm:text-xl' : 'text-base sm:text-lg', correct ? 'text-emerald-800' : finished ? 'text-rose-800' : 'text-amber-900')}>
                        {!finished
                          ? t('nav.notQuite')
                          : firstTry && firstTry.total > 1
                          ? closing.firstTry(formatNumber(firstTry.right), formatNumber(firstTry.total))
                          : firstTry && firstTry.right === firstTry.total
                          ? closing.oneFirst
                          : firstTry && correct
                          ? closing.later
                          : firstTry
                          ? closing.answerShown
                          : `${t('nav.correct')}!`}
                      </p>
                      {firstTry && firstTry.total > 1 && !finished && (
                        <p className={cn('font-display font-bold text-amber-900/80 mt-0.5', isArabic ? 'text-base' : 'text-sm')}>
                          {closing.firstTry(formatNumber(firstTry.right), formatNumber(firstTry.total))}
                        </p>
                      )}
                      {firstTry && firstTry.total > 1 && finished && (
                        <p className={cn('font-display font-bold mt-0.5', correct ? 'text-emerald-800/80' : 'text-rose-800/80', isArabic ? 'text-base' : 'text-sm')}>
                          {firstTry.right === firstTry.total ? closing.allFirst : correct ? closing.later : closing.answerShown}
                        </p>
                      )}
                      {exercise.feedback && (
                        <p className={cn('font-serif text-wood/75 mt-1 leading-relaxed', isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base')}>
                          {correct ? exercise.feedback.correct : exercise.feedback.incorrect}
                        </p>
                      )}
                      {finished && !correct && firstTry && firstTry.total > 1 && exercise.type !== 'quiz-game' && (
                        <p className={cn('font-serif text-wood/60 mt-2', isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm')}>
                          {closing.missedMarked}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {exercise.explanation && revealAnswer && (
                  <div className={cn('rounded-xl bg-white/70 border border-black/5 p-3 sm:p-4 font-serif text-wood/75 leading-relaxed', isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base')}>
                    <span className={cn('block font-display uppercase tracking-widest text-wood/40 mb-1', isArabic ? 'text-sm' : 'text-[10px]')}>{t('nav.explanation')}</span>
                    {exercise.explanation}
                  </div>
                )}

                {!revealAnswer && !classMode && (
                  <p className={cn('font-serif text-wood/55', isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm')}>
                    {t('nav.answerAfterNextTry')}
                  </p>
                )}

                {/* One button at a time (the Final Challenge model): Try again after a first miss, Next once settled. */}
                <div className={cn(
                  'grid grid-cols-1 gap-3 w-full',
                  classMode && !revealAnswer ? 'sm:grid-cols-2' : 'sm:max-w-sm sm:mx-auto'
                )}>
                  {classMode && !revealAnswer && (
                    <button type="button" onClick={showClassAnswers} className={cn('min-h-12 rounded-xl font-display uppercase tracking-widest font-bold flex items-center justify-center gap-2 bg-white border-2', theme.softBorder, theme.accentText, isArabic ? 'text-sm sm:text-base' : 'text-xs')}>
                      <Eye size={16} /> {closing.showAnswers}
                    </button>
                  )}
                  {!classMode && !finished ? (
                    <button type="button" onClick={retry} data-feedback-retry className={cn('min-h-12 rounded-xl font-display uppercase tracking-widest font-bold flex items-center justify-center gap-2 bg-white border-2 border-amber-300 text-amber-900', isArabic ? 'text-sm sm:text-base' : 'text-xs')}>
                      <RotateCcw size={16} /> {t('nav.tryAgain')}
                    </button>
                  ) : (
                    <button type="button" onClick={onNext ?? onComplete} data-feedback-next className={cn('min-h-12 rounded-xl font-display uppercase tracking-widest font-bold flex items-center justify-center gap-2 text-white bg-brand-700 hover:bg-brand-800', isArabic ? 'text-sm sm:text-base' : 'text-xs')}>
                      {onNext ? (isLast ? closing.finish : closing.next) : t('nav.next')} <ArrowRight className={cn('w-4 h-4', isRTL && 'rotate-180')} />
                    </button>
                  )}
                </div>
              </motion.section>
            )}
        </div>
      </main>

      <footer className={cn(
        'shrink-0 px-4 sm:px-6 md:px-10 py-3 flex items-center justify-between gap-3 safe-area-bottom',
        embedded && isReview
          ? 'border-t border-black/[0.05] bg-white/38'
          : isQuick || isLanguage
          ? 'border-t border-black/[0.06] bg-white/55 backdrop-blur-xl'
          : 'border-t border-gray-200 bg-white'
      )}>
        <div>
          {exercise.hints?.length ? (
            <button type="button" onClick={() => setShowHint((value) => !value)} className={cn('flex items-center gap-2 font-display font-bold', isArabic ? 'text-sm' : 'text-xs', theme.accentText)}>
              <HelpCircle size={16} /> {showHint ? t('nav.hideHint') : t('nav.needHint')}
            </button>
          ) : null}
        </div>
        {showHint && exercise.hints?.length ? (
          <p className={cn('font-serif text-wood/60 flex items-center gap-2 max-w-2xl text-end', isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm')}>
            <Lightbulb size={15} className={theme.accentText} /> {exercise.hints[0]}
          </p>
        ) : null}
      </footer>
    </motion.div>
  );
  if (embedded || typeof document === 'undefined') return dialog;
  return createPortal(dialog, document.body);
};