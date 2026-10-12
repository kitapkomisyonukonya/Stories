import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Exercise } from '../../types';
import { SECTION_ICONS } from '../../lib/sectionIcons';
import { cn } from '../../lib/utils';
import { EndCard, FeedbackBox } from './ExerciseFeedback';
import { useLanguage } from '../../contexts/LanguageContext';
import { presentMultipleChoice } from '../../lib/exercisePresentation';

type AnswerValue = boolean | number | null;

type Props = {
  title: string;
  exercises: Exercise[];
  userAnswers: Record<string, boolean | null>;
  handleAnswer: (id: string, answer: boolean) => void;
  onReset?: () => void;
  level?: string;
  collectionId?: string;
  onComplete?: (exerciseIds: string[]) => void;
  /** Opens the next page of the book from the closing card. */
  onNextPage?: () => void;
  nextPageLabel?: string;
};

const theme = {
    border: 'border-brand-200',
    softBorder: 'border-brand-100',
    softBg: 'bg-brand-50',
    accentBg: 'bg-brand-600',
    accentText: 'text-brand-700',
    title: 'text-brand-950',
    progress: 'bg-brand-500',
    progressTrack: 'bg-brand-100',
  };

const isExerciseAnswerCorrect = (exercise: Exercise, answer: AnswerValue) => {
  if (answer === null || answer === undefined) return false;
  return answer === exercise.correctAnswer;
};

const QuestionCard = ({
  exercise,
  index,
  answer,
  locked,
  reveal,
  onAnswer,
}: {
  exercise: Exercise;
  index: number;
  answer: AnswerValue;
  /** An answer is on screen: the options are disabled and a wrong choice shows red. */
  locked: boolean;
  /** The item is settled: the right option shows green. */
  reveal: boolean;
  onAnswer: (answer: boolean | number) => void;
}) => {
  const { t, formatNumber, isRTL, language } = useLanguage();
  const isArabic = language === 'ar';
  const hasAnswer = answer !== null && answer !== undefined;
  const correct = isExerciseAnswerCorrect(exercise, answer);
  const showResults = locked && hasAnswer;
  const presentedOptions = React.useMemo(
    () => presentMultipleChoice(exercise),
    [exercise]
  );

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-[24px] bg-white/85 p-4 sm:p-5 md:p-6 ring-1 flex flex-col gap-4 min-w-0 self-start w-full transition-all',
        reveal && hasAnswer
          ? correct
            ? 'ring-emerald-300 bg-emerald-50/55'
            : 'ring-rose-300 bg-rose-50/55'
          : 'ring-black/[0.07]'
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <span className={cn(
          'h-8 min-w-8 shrink-0 rounded-xl px-2 flex items-center justify-center font-semibold font-display',
          isArabic ? 'text-sm' : 'text-[11px]',
          reveal && hasAnswer
            ? correct
              ? 'bg-emerald-500 text-white'
              : 'bg-rose-500 text-white'
            : `${theme.softBg} ${theme.accentText}`
        )}>
          {reveal && hasAnswer ? (correct ? '✓' : '✗') : formatNumber(index + 1)}
        </span>
        <p className={cn(
          'font-serif font-semibold leading-[1.55] text-wood flex-1 min-w-0',
          isArabic ? 'text-[17px] sm:text-lg md:text-xl desk:text-[1.45rem]' : 'text-base sm:text-[17px] md:text-lg desk:text-[1.3rem]'
        )}>
          {exercise.question}
        </p>
      </div>

      {exercise.type === 'true-false' && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {[true, false].map((value) => {
            const selected = answer === value;
            const revealCorrect = reveal && exercise.correctAnswer === value;
            const revealWrong = showResults && selected && exercise.correctAnswer !== value;
            return (
              <button
                type="button"
                key={String(value)}
                disabled={locked}
                onClick={() => onAnswer(value)}
                className={cn(
                  'min-h-12 sm:min-h-14 rounded-2xl px-4 font-display font-semibold ring-1 transition-all',
                  isArabic ? 'text-sm sm:text-[15px] md:text-[17px] desk:text-[1.2rem]' : 'text-xs sm:text-sm md:text-base desk:text-[1.15rem]',
                  revealCorrect
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : revealWrong
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : selected
                        ? `${theme.accentBg} text-white ring-transparent`
                        : `bg-white text-wood/65 ring-black/[0.07] hover:bg-black/[0.025]`
                )}
              >
                {value ? t('ex.true') : t('ex.false')}
              </button>
            );
          })}
        </div>
      )}

      {exercise.type === 'multiple-choice' && (
        <div className="grid grid-cols-1 gap-2.5">
          {presentedOptions.map((option, displayIndex) => {
            const selected = answer === option.originalIndex;
            const revealCorrect = reveal && option.originalIndex === exercise.correctAnswer;
            const revealWrong = showResults && selected && option.originalIndex !== exercise.correctAnswer;
            return (
              <button
                type="button"
                key={`${option.originalIndex}-${option.text}`}
                disabled={locked}
                onClick={() => onAnswer(option.originalIndex)}
                className={cn(
                  'w-full min-h-12 rounded-2xl px-3.5 sm:px-4 py-3 flex items-center gap-3 text-start ring-1 transition-all',
                  revealCorrect
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : revealWrong
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : selected
                        ? `${theme.softBg} ${theme.accentText} ring-black/[0.08]`
                        : `bg-white ring-black/[0.07] hover:bg-black/[0.025]`
                )}
              >
                <span className={cn(
                  'w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-semibold font-display',
                  isArabic ? 'text-sm' : 'text-[11px]',
                  revealCorrect || revealWrong
                    ? 'bg-white/20 text-white'
                    : selected
                      ? `${theme.accentBg} text-white`
                      : `${theme.softBg} ${theme.accentText}`
                )}>
                  {isArabic ? (['أ', 'ب', 'ج', 'د', 'هـ', 'و'][displayIndex] ?? formatNumber(displayIndex + 1)) : String.fromCharCode(65 + displayIndex)}
                </span>
                <span className={cn(
                  'font-serif font-medium leading-relaxed flex-1',
                  isArabic ? 'text-[15px] sm:text-[17px] desk:text-[1.2rem]' : 'text-sm sm:text-[15px] md:text-base desk:text-[1.15rem]',
                  isRTL && 'text-right'
                )}>
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </motion.article>
  );
};

export const KnowledgeCheck = ({
  title,
  exercises,
  userAnswers,
  handleAnswer,
  onReset,
  onComplete,
  onNextPage,
  nextPageLabel,
}: Props) => {
  const { t, formatNumber, language } = useLanguage();
  const isArabic = language === 'ar';
  const supportedExercises = React.useMemo(
    () => exercises.filter((exercise) => exercise.type === 'true-false' || exercise.type === 'multiple-choice'),
    [exercises]
  );
  const storageKey = React.useMemo(
    () => `knowledge-check:${supportedExercises.map((exercise) => exercise.id).join('|')}`,
    [supportedExercises]
  );
  const missedKey = `${storageKey}:missed`;
  const [localAnswers, setLocalAnswers] = React.useState<Record<string, AnswerValue>>({});
  // Items whose first try was wrong: their next answer settles them (two tries, like the Final Challenge).
  const [missed, setMissed] = React.useState<Record<string, true>>({});
  const [showResults, setShowResults] = React.useState(false);
  // One question on screen at a time, like the Final Challenge.
  const [currentStep, setCurrentStep] = React.useState(0);

  const readJson = <T,>(key: string, fallback: T): T => {
    try {
      const stored = window.localStorage.getItem(key);
      const parsed = stored ? JSON.parse(stored) : null;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as T : fallback;
    } catch {
      return fallback;
    }
  };
  const writeJson = (key: string, value: unknown) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Keep the in-memory state even when local storage is unavailable.
    }
  };

  React.useEffect(() => {
    const restored = readJson<Record<string, AnswerValue>>(storageKey, {});
    const restoredMissed = readJson<Record<string, true>>(missedKey, {});
    // A saved wrong answer is a settled one: never reopen it as a first try.
    supportedExercises.forEach((exercise) => {
      const saved = restored[exercise.id];
      if (saved !== null && saved !== undefined && !isExerciseAnswerCorrect(exercise, saved)) restoredMissed[exercise.id] = true;
    });
    setLocalAnswers(restored);
    setMissed(restoredMissed);
    const firstOpen = supportedExercises.findIndex((exercise) => {
      const saved = restored[exercise.id];
      return saved === null || saved === undefined;
    });
    setShowResults(supportedExercises.length > 0 && firstOpen < 0);
    setCurrentStep(firstOpen >= 0 ? firstOpen : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const answerFor = React.useCallback((exercise: Exercise): AnswerValue => {
    if (Object.prototype.hasOwnProperty.call(localAnswers, exercise.id)) {
      return localAnswers[exercise.id];
    }
    if (exercise.type === 'true-false') {
      return userAnswers[exercise.id] ?? null;
    }
    return null;
  }, [localAnswers, userAnswers]);

  const isAnswered = (exercise: Exercise) => answerFor(exercise) !== null;
  const isCorrect = (exercise: Exercise) => isExerciseAnswerCorrect(exercise, answerFor(exercise));
  const isSettled = (exercise: Exercise) => isAnswered(exercise) && (isCorrect(exercise) || Boolean(missed[exercise.id]));

  const settledCount = supportedExercises.filter(isSettled).length;
  const correctCount = supportedExercises.filter(isCorrect).length;
  const firstTryRight = supportedExercises.filter((exercise) => isCorrect(exercise) && !missed[exercise.id]).length;
  const percentage = supportedExercises.length
    ? Math.round((correctCount / supportedExercises.length) * 100)
    : 0;
  const safeStep = Math.min(currentStep, Math.max(0, supportedExercises.length - 1));
  const currentExercise = supportedExercises[safeStep] ?? null;
  const isLastStep = safeStep >= supportedExercises.length - 1;

  const answerQuestion = (exercise: Exercise, answer: boolean | number) => {
    if (showResults || isAnswered(exercise)) return;
    setLocalAnswers((previous) => {
      const next = { ...previous, [exercise.id]: answer };
      writeJson(storageKey, next);
      return next;
    });
    if (exercise.type === 'true-false' && typeof answer === 'boolean') {
      handleAnswer(exercise.id, answer);
    }
  };

  // First miss: clear the answer and give the second (last) try.
  const retryQuestion = (exercise: Exercise) => {
    setMissed((previous) => {
      const next = { ...previous, [exercise.id]: true as const };
      writeJson(missedKey, next);
      return next;
    });
    setLocalAnswers((previous) => {
      const next = { ...previous, [exercise.id]: null };
      writeJson(storageKey, next);
      return next;
    });
  };

  const goNext = () => {
    if (!isLastStep) {
      setCurrentStep((step) => Math.min(supportedExercises.length - 1, step + 1));
      return;
    }
    setShowResults(true);
    onComplete?.(supportedExercises.map(exercise => exercise.id));
  };

  const reset = () => {
    setLocalAnswers({});
    setMissed({});
    setCurrentStep(0);
    setShowResults(false);
    try {
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(missedKey);
    } catch {
      // Ignore unavailable local storage.
    }
    onReset?.();
  };

  const feedbackState = currentExercise && isAnswered(currentExercise)
    ? (isCorrect(currentExercise) ? 'correct' : missed[currentExercise.id] ? 'revealed' : 'retry')
    : null;

  return (
    <section className="h-full min-h-0 overflow-y-auto custom-scrollbar px-0.5 pt-0.5 pe-2">
      <div className="mx-auto w-full max-w-5xl desk:max-w-[84rem] wide:max-w-none space-y-5 pb-4">
        <div className={cn(
          'relative overflow-hidden rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 sm:flex-row sm:items-start sm:justify-between',
          // Phones: the page name is in the top bar; the question starts on the first line.
          'max-sm:hidden',
          theme.softBg
        )}>
          <div className="flex items-start gap-3 min-w-0 sm:items-center">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg shrink-0 sm:h-12 sm:w-12 sm:rounded-2xl', theme.accentBg)}>
              <SECTION_ICONS.knowledgeCheck.icon size={23} />
            </div>
            <div className="min-w-0">
              <p className={cn('font-display text-[11px] font-semibold uppercase tracking-[0.18em]', theme.accentText)}>
                {isArabic ? 'بعد إكمال القصة' : 'After the story'}
              </p>
              <h2 className={cn('mt-1 font-display text-2xl sm:text-3xl font-semibold tracking-[-0.03em] leading-tight', theme.title)}>{title}</h2>
              <p className={cn('font-serif text-wood/70 mt-2 max-w-2xl leading-relaxed', isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base')}>
                {isArabic
                  ? 'اختبر فهمك للعلاقات والأحداث والأفكار الرئيسة في الكتاب كله.'
                  : 'Check your understanding of the key relationships, events and ideas across the whole book.'}
              </p>
            </div>
          </div>
          {showResults && (
            <div className={cn(
              'px-3 py-2 rounded-xl border font-display font-bold',
              isArabic ? 'text-sm sm:text-[15px]' : 'text-xs sm:text-sm',
              percentage >= 70 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
            )}>
              {formatNumber(correctCount)}/{formatNumber(supportedExercises.length)} · {formatNumber(percentage)}%
            </div>
          )}
        </div>

        {showResults ? (
          <EndCard
            firstTry={{ right: firstTryRight, total: supportedExercises.length }}
            onRestart={reset}
            onNext={onNextPage}
            nextLabel={nextPageLabel}
          />
        ) : (
          // Wide screens: one question reads best at a comfortable width, centred.
          <div className="mx-auto w-full max-w-3xl space-y-5">
            <div className="flex items-center justify-between gap-3 px-1" data-kc-progress>
              <span className={cn('font-display font-semibold text-wood/60 tabular-nums shrink-0', isArabic ? 'text-sm' : 'text-xs')}>
                {t('nav.question')} {formatNumber(safeStep + 1)} {t('nav.of')} {formatNumber(supportedExercises.length)}
              </span>
              <span className={cn('font-display font-semibold text-wood/45 tabular-nums shrink-0', isArabic ? 'text-sm' : 'text-xs')}>
                {isArabic ? 'تمت الإجابة' : 'Answered'} {formatNumber(settledCount)}/{formatNumber(supportedExercises.length)}
              </span>
            </div>
            <div className="flex gap-1.5 px-1" aria-hidden="true">
              {supportedExercises.map((exercise, index) => (
                <span
                  key={exercise.id}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    index === safeStep ? theme.progress : isSettled(exercise) ? 'bg-brand-300' : theme.progressTrack,
                  )}
                />
              ))}
            </div>

            {currentExercise && (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentExercise.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <QuestionCard
                    exercise={currentExercise}
                    index={safeStep}
                    answer={answerFor(currentExercise)}
                    locked={isAnswered(currentExercise)}
                    reveal={isSettled(currentExercise)}
                    onAnswer={(answer) => answerQuestion(currentExercise, answer)}
                  />
                </motion.div>
              </AnimatePresence>
            )}

            {/* Feedback and Next sit right under the answers; phones scroll them into view. */}
            {currentExercise && feedbackState && (
              <FeedbackBox
                state={feedbackState}
                revealKey={currentExercise.id}
                message={feedbackState === 'correct' ? currentExercise.feedback.correct : currentExercise.feedback.incorrect}
                explanation={currentExercise.explanation}
                onRetry={() => retryQuestion(currentExercise)}
                onNext={goNext}
                nextLabel={isLastStep ? t('ex.seeResults') : t('nav.nextQuestion')}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
};
