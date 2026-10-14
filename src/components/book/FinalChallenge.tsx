import React from 'react';
import { motion } from 'motion/react';
import { Trophy, ArrowRight } from '../ui/icons';
import { BookData, Exercise } from '../../types';
import { SECTION_ICONS } from '../../lib/sectionIcons';
import { FeedbackBox } from '../exercises/ExerciseFeedback';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoryProgress } from '../../contexts/StoryProgressContext';
import { highlightPhraseMatches } from '../../lib/highlightTextMatch';
import { presentMatchingMeanings } from '../../lib/exercisePresentation';
import { MatchingBoard } from '../exercises/MatchingBoard';

interface FinalChallengeProps {
  bookData: BookData;
  onComplete?: () => void;
}

type FinalAnswer = boolean | number | string | string[] | Record<string, string> | null;

const getTheme = (bookData: BookData) => {
  const isHistory = bookData.id.toLowerCase().includes('mecca') || bookData.id.toLowerCase().includes('history');
  const isTurkish = bookData.id.toLowerCase().includes('yunus');

  if (isHistory) {
    return {
      accent: 'bg-emerald-700 hover:bg-emerald-800',
      accentSolid: 'bg-emerald-600',
      soft: 'bg-emerald-50 border-emerald-200',
      border: 'border-emerald-200',
      text: 'text-emerald-950',
      subtext: 'text-emerald-700',
      confetti: ['#059669', '#10B981', '#34D399'],
    };
  }

  if (isTurkish) {
    return {
      accent: 'bg-sky-700 hover:bg-sky-800',
      accentSolid: 'bg-sky-700',
      soft: 'bg-sky-50 border-sky-200',
      border: 'border-sky-200',
      text: 'text-sky-950',
      subtext: 'text-sky-700',
      confetti: ['#0284C7', '#0EA5E9', '#38BDF8'],
    };
  }

  return {
    accent: 'bg-amber-700 hover:bg-amber-800',
    accentSolid: 'bg-amber-600',
    soft: 'bg-amber-50 border-amber-200',
    border: 'border-amber-200',
    text: 'text-amber-950',
    subtext: 'text-amber-700',
    confetti: ['#D97706', '#F59E0B', '#FCD34D'],
  };
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

export const FinalChallenge: React.FC<FinalChallengeProps> = ({ bookData, onComplete }) => {
  const { t, formatNumber, isRTL, language } = useLanguage();
  const { setFinalScore, setFinalChallengeDetails } = useStoryProgress();
  const theme = React.useMemo(() => getTheme(bookData), [bookData]);
  const isArabic = language === 'ar';

  const [gameState, setGameState] = React.useState<'intro' | 'playing'>('intro');
  const [questions, setQuestions] = React.useState<Exercise[]>([]);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [firstAttemptCorrect, setFirstAttemptCorrect] = React.useState(0);
  const [correctedAnswers, setCorrectedAnswers] = React.useState(0);
  const [missedQuestions, setMissedQuestions] = React.useState<Array<{ id: string; title: string; question: string }>>([]);
  const [attemptNumber, setAttemptNumber] = React.useState<1 | 2>(1);
  const [selectedAnswer, setSelectedAnswer] = React.useState<FinalAnswer>(null);
  const [lastCorrect, setLastCorrect] = React.useState<boolean | null>(null);
  const [fillDraft, setFillDraft] = React.useState('');
  const [matchingAssignments, setMatchingAssignments] = React.useState<Record<string, string>>({});
  const [sequenceDraft, setSequenceDraft] = React.useState<string[]>([]);
  // Sentences already in the right place after the first check stay there for the second try.
  const [lockedSequenceIds, setLockedSequenceIds] = React.useState<string[]>([]);
  const [lastMovedId, setLastMovedId] = React.useState<string | null>(null);
  const [reflectionDraft, setReflectionDraft] = React.useState('');

  const dedicatedFinalQuestions = React.useMemo(() => {
    const finalPage = bookData.pages.find((page) => page.type === 'final-challenge');
    return finalPage?.exercises ?? [];
  }, [bookData]);

  const currentQuestion = questions[currentStep];
  const scoredQuestionCount = React.useMemo(
    () => questions.filter((question) => question.type !== 'reflection').length,
    [questions]
  );
  const reflectionQuestionCount = React.useMemo(
    () => questions.filter((question) => question.type === 'reflection').length,
    [questions]
  );

  React.useEffect(() => {
    if (currentQuestion?.type === 'sequencing') {
      setSequenceDraft([...(currentQuestion.sequencingItems ?? [])].map((item) => item.id).reverse());
    } else {
      setSequenceDraft([]);
    }
  }, [currentQuestion?.id]);

  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setLastCorrect(null);
    setFillDraft('');
    setMatchingAssignments({});
    setSequenceDraft([]);
    setLockedSequenceIds([]);
    setLastMovedId(null);
    setReflectionDraft('');
    setAttemptNumber(1);
  };

  const startChallenge = () => {
    const selected = [...dedicatedFinalQuestions];

    setQuestions(selected);
    setCurrentStep(0);
    setScore(0);
    setFirstAttemptCorrect(0);
    setCorrectedAnswers(0);
    setMissedQuestions([]);
    resetQuestionState();

    if (!selected.length) {
      setFinalScore(0);
      setFinalChallengeDetails({
        firstAttemptAccuracy: 0,
        masteryAccuracy: 0,
        correctedAnswers: 0,
        missedQuestionCount: 0,
        missedQuestions: [],
        reflectionCompleted: 0,
        scoredQuestionCount: 0,
      });
      onComplete?.();
      return;
    }

    setGameState('playing');
  };

  const presentedOptions = React.useMemo(
    () => currentQuestion?.type === 'multiple-choice'
      ? (currentQuestion.options ?? []).map((text, originalIndex) => ({ text, originalIndex }))
      : [],
    [currentQuestion]
  );
  const presentedMeanings = React.useMemo(
    () => currentQuestion?.type === 'matching' ? presentMatchingMeanings(currentQuestion) : [],
    [currentQuestion]
  );

  const expectedSequence = (question: Exercise) => (
    Array.isArray(question.correctAnswer)
      ? question.correctAnswer.map(String)
      : (question.sequencingItems ?? []).map((item) => item.id)
  );

  const isCorrectAnswer = (answer: Exclude<FinalAnswer, null>) => {
    if (!currentQuestion) return false;
    if (currentQuestion.type === 'matching') {
      if (typeof answer !== 'object' || Array.isArray(answer)) return false;
      return (currentQuestion.matchingPairs ?? []).every((pair) => answer[pair.left] === pair.right);
    }
    if (currentQuestion.type === 'sequencing') {
      if (!Array.isArray(answer)) return false;
      const expected = Array.isArray(currentQuestion.correctAnswer)
        ? currentQuestion.correctAnswer.map(String)
        : (currentQuestion.sequencingItems ?? []).map((item) => item.id);
      return answer.length === expected.length && answer.every((id, index) => id === expected[index]);
    }
    if (currentQuestion.type === 'fill-blanks') {
      if (typeof answer !== 'string') return false;
      const expectedAnswers = Array.isArray(currentQuestion.correctAnswer)
        ? currentQuestion.correctAnswer.map(String)
        : [String(currentQuestion.correctAnswer ?? '')];

      return expectedAnswers.some((expected) => (
        normalizeText(answer) === normalizeText(expected)
        || highlightPhraseMatches(answer, expected, language === 'ar' ? 'ar' : 'en')
      ));
    }
    if (currentQuestion.type === 'reflection') return true;
    return answer === currentQuestion.correctAnswer;
  };

  const handleAnswer = (answer: Exclude<FinalAnswer, null>) => {
    if (!currentQuestion || selectedAnswer !== null) return;
    if (currentQuestion.type === 'reflection') {
      setSelectedAnswer(answer);
      setLastCorrect(null);
      return;
    }

    const correct = isCorrectAnswer(answer);
    setSelectedAnswer(answer);
    setLastCorrect(correct);

    if (attemptNumber === 1 && correct) {
      setFirstAttemptCorrect((previous) => previous + 1);
    } else if (attemptNumber === 1 && !correct) {
      setMissedQuestions((previous) => (
        previous.some((item) => item.id === currentQuestion.id)
          ? previous
          : [...previous, {
              id: currentQuestion.id,
              title: currentQuestion.title || (isArabic ? 'سؤال' : 'Question'),
              question: currentQuestion.question || currentQuestion.instructions || (isArabic ? 'سؤال التحدي' : 'Challenge question'),
            }]
      ));
    }

    if (correct) {
      setScore((previous) => previous + 1);
      if (attemptNumber === 2) {
        setCorrectedAnswers((previous) => previous + 1);
      }
    }
  };

  const retryCurrentQuestion = () => {
    if (!currentQuestion || attemptNumber !== 1 || lastCorrect !== false) return;

    setSelectedAnswer(null);
    setLastCorrect(null);
    setAttemptNumber(2);
    setFillDraft('');
    setMatchingAssignments({});
    setReflectionDraft('');

    if (currentQuestion.type === 'sequencing') {
      // Keep the learner's order: the sentences in the right place stay locked, only the others move.
      const expected = expectedSequence(currentQuestion);
      setLockedSequenceIds(sequenceDraft.filter((id, index) => expected[index] === id));
      setLastMovedId(null);
    }
  };


  // The nearest place up or down that is not locked; -1 when there is none.
  const sequenceTarget = (index: number, delta: number) => {
    let target = index + delta;
    while (target >= 0 && target < sequenceDraft.length && lockedSequenceIds.includes(sequenceDraft[target])) target += delta;
    return target >= 0 && target < sequenceDraft.length ? target : -1;
  };

  const moveSequenceItem = (index: number, delta: number) => {
    if (selectedAnswer !== null) return;
    const target = sequenceTarget(index, delta);
    if (target < 0) return;
    setLastMovedId(sequenceDraft[index]);
    setSequenceDraft((previous) => {
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const goNext = () => {
    if (!currentQuestion || selectedAnswer === null) return;

    if (currentStep < questions.length - 1) {
      setCurrentStep((previous) => previous + 1);
      resetQuestionState();
      return;
    }

    const masteryAccuracy = Math.round((score / Math.max(scoredQuestionCount, 1)) * 100);
    const firstAttemptAccuracy = Math.round((firstAttemptCorrect / Math.max(scoredQuestionCount, 1)) * 100);

    setFinalScore(masteryAccuracy);
    setFinalChallengeDetails({
      firstAttemptAccuracy,
      masteryAccuracy,
      correctedAnswers,
      missedQuestionCount: missedQuestions.length,
      missedQuestions,
      reflectionCompleted: reflectionQuestionCount,
      scoredQuestionCount,
    });


    onComplete?.();
  };

  if (gameState === 'intro') {
    return (
      <div className="h-full min-h-0 overflow-y-auto flex flex-col items-center justify-center text-center px-5 py-8 sm:p-10 gap-6 sm:gap-8">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn('w-20 h-20 sm:w-24 sm:h-24 rounded-3xl text-white flex items-center justify-center shadow-xl', theme.accentSolid)}
        >
          <Trophy size={44} />
        </motion.div>

        <div className="max-w-xl">
          <h2 className={cn('font-display text-2xl sm:text-3xl md:text-4xl font-black tracking-tight', theme.text)}>
            {t('nav.finalChallenge')}
          </h2>
          <p className={cn('font-serif text-wood/65 mt-3 leading-relaxed', isArabic ? 'text-base sm:text-lg md:text-xl' : 'text-sm sm:text-base md:text-lg')}>
            {t('nav.finalChallengeIntro')}
          </p>
        </div>

        <button
          type="button"
          onClick={startChallenge}
          className={cn(
            'min-h-12 px-8 sm:px-10 rounded-xl text-white font-display uppercase tracking-widest font-bold flex items-center gap-2 shadow-lg',
            isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm',
            theme.accent
          )}
        >
          {t('nav.startChallenge')}
          <ArrowRight className={cn('w-4 h-4', isRTL && 'rotate-180')} />
        </button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const questionTypeLabel = isArabic
    ? currentQuestion.type === 'multiple-choice'
      ? 'اختيار من متعدد'
      : currentQuestion.type === 'true-false'
        ? 'صح / خطأ'
        : currentQuestion.type === 'matching'
          ? 'مطابقة'
          : currentQuestion.type === 'fill-blanks'
            ? 'إكمال'
            : currentQuestion.type === 'sequencing'
              ? 'ترتيب'
              : currentQuestion.type === 'reflection'
                ? 'تأمل'
                : 'سؤال'
    : currentQuestion.type === 'multiple-choice'
      ? 'Multiple Choice'
      : currentQuestion.type === 'true-false'
        ? 'True / False'
        : currentQuestion.type === 'matching'
          ? 'Matching'
          : currentQuestion.type === 'fill-blanks'
            ? 'Fill In'
            : currentQuestion.type === 'sequencing'
              ? 'Sequencing'
              : currentQuestion.type === 'reflection'
                ? 'Reflection'
                : 'Question';

  const renderCorrectionReview = () => {
    if (lastCorrect !== false || attemptNumber !== 2) return null;

    if (currentQuestion.type === 'fill-blanks') {
      const acceptedAnswers = Array.isArray(currentQuestion.correctAnswer)
        ? currentQuestion.correctAnswer.map(String)
        : [String(currentQuestion.correctAnswer ?? '')];

      return (
        <div className={cn('mt-4 rounded-xl border px-4 py-3', theme.border, theme.soft)}>
          <p className={cn('font-display font-black uppercase tracking-wider', isArabic ? 'text-sm' : 'text-xs', theme.subtext)}>
            {isArabic ? 'الإجابة الصحيحة' : 'Correct Answer'}
          </p>
          <p className={cn('font-serif mt-1.5 font-bold text-wood', isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base')}>
            {acceptedAnswers.join(' / ')}
          </p>
        </div>
      );
    }

    if (currentQuestion.type === 'matching') {
      return (
        <div className={cn('mt-4 rounded-xl border px-4 py-3 space-y-2', theme.border, theme.soft)}>
          <p className={cn('font-display font-black uppercase tracking-wider', isArabic ? 'text-sm' : 'text-xs', theme.subtext)}>
            {isArabic ? 'المطابقة الصحيحة' : 'Correct Matching'}
          </p>
          {(currentQuestion.matchingPairs ?? []).map((pair) => (
            <div key={`correct-${pair.left}`} className={cn('font-serif text-wood/80 leading-relaxed', isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm')}>
              <span className="font-bold text-wood">{pair.left}</span>
              <span className="mx-2 opacity-45">→</span>
              <span>{pair.right}</span>
            </div>
          ))}
        </div>
      );
    }

    if (currentQuestion.type === 'sequencing') {
      const itemMap = new Map((currentQuestion.sequencingItems ?? []).map((item) => [item.id, item.text]));
      const orderedIds = Array.isArray(currentQuestion.correctAnswer)
        ? currentQuestion.correctAnswer.map(String)
        : (currentQuestion.sequencingItems ?? []).map((item) => item.id);

      return (
        <div className={cn('mt-4 rounded-xl border px-4 py-3 space-y-2', theme.border, theme.soft)}>
          <p className={cn('font-display font-black uppercase tracking-wider', isArabic ? 'text-sm' : 'text-xs', theme.subtext)}>
            {isArabic ? 'الترتيب الصحيح' : 'Correct Order'}
          </p>
          {orderedIds.map((id, index) => (
            <div key={`correct-order-${id}`} className="flex items-start gap-2">
              <span className={cn('w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-display font-black', isArabic ? 'text-xs' : 'text-[10px]', theme.soft, theme.subtext)}>
                {formatNumber(index + 1)}
              </span>
              <span className={cn('font-serif text-wood/80 leading-relaxed', isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm')}>
                {itemMap.get(id)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const renderAnswerArea = () => {
    if (currentQuestion.type === 'true-false') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[true, false].map((value) => {
            const selected = selectedAnswer === value;
            const revealCorrect = selectedAnswer !== null && (lastCorrect === true || attemptNumber === 2) && currentQuestion.correctAnswer === value;
            const revealWrong = selectedAnswer !== null && selected && !revealCorrect;
            return (
              <button
                type="button"
                key={String(value)}
                disabled={selectedAnswer !== null}
                onClick={() => handleAnswer(value)}
                className={cn(
                  'min-h-14 sm:min-h-16 rounded-2xl border-2 px-4 font-display font-black uppercase tracking-widest transition-colors',
                  isArabic ? 'text-base sm:text-lg md:text-xl desk:text-[1.45rem]' : 'text-sm sm:text-lg desk:text-[1.3rem]',
                  revealCorrect
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : revealWrong
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : `bg-white ${theme.border} ${theme.text}`
                )}
              >
                {value ? t('nav.true') : t('nav.false')}
              </button>
            );
          })}
        </div>
      );
    }

    if (currentQuestion.type === 'multiple-choice') {
      return (
        <div className="grid grid-cols-1 gap-3">
          {presentedOptions.map((option, displayIndex) => {
            const selected = selectedAnswer === option.originalIndex;
            const revealCorrect = selectedAnswer !== null && (lastCorrect === true || attemptNumber === 2) && option.originalIndex === currentQuestion.correctAnswer;
            const revealWrong = selectedAnswer !== null && selected && !revealCorrect;
            return (
              <button
                type="button"
                key={`${option.originalIndex}-${option.text}`}
                disabled={selectedAnswer !== null}
                onClick={() => handleAnswer(option.originalIndex)}
                className={cn(
                  'min-h-14 sm:min-h-16 rounded-2xl border-2 px-4 py-3 flex items-center gap-4 text-start transition-colors',
                  revealCorrect
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : revealWrong
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : `bg-white ${theme.border}`
                )}
              >
                <span className={cn(
                  'w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-display font-black text-sm',
                  revealCorrect || revealWrong ? 'bg-white/20 text-white' : `${theme.soft} ${theme.subtext}`
                )}>
                  {isArabic ? (['أ', 'ب', 'ج', 'د', 'هـ', 'و'][displayIndex] ?? formatNumber(displayIndex + 1)) : String.fromCharCode(65 + displayIndex)}
                </span>
                <span className={cn('font-serif font-semibold flex-1 leading-snug', isArabic ? 'text-base sm:text-lg md:text-xl desk:text-[1.4rem]' : 'text-sm sm:text-base md:text-lg desk:text-[1.3rem]')}>{option.text}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (currentQuestion.type === 'fill-blanks') {
      return (
        <div className={cn('rounded-2xl border-2 p-4 sm:p-6 space-y-5 bg-white', theme.border)}>
          <div className={cn('font-serif leading-loose text-wood', isArabic ? 'text-lg sm:text-xl' : 'text-base sm:text-lg')}>
            {(currentQuestion.fillBlanksText ?? '').split(/(\[blank\]|_{3,})/g).map((part, index) => {
              const isBlank = /^(?:\[blank\]|_{3,})$/.test(part);
              if (!isBlank) {
                return <React.Fragment key={`${currentQuestion.id}-part-${index}`}>{part}</React.Fragment>;
              }
              return (
                <input
                  key={`${currentQuestion.id}-blank-${index}`}
                  type="text"
                  disabled={selectedAnswer !== null}
                  value={fillDraft}
                  onChange={(event) => setFillDraft(event.target.value)}
                  aria-label={isArabic ? 'إجابة الفراغ' : 'Blank answer'}
                  className={cn('mx-2 px-3 py-1 border-b-2 bg-transparent outline-none min-w-32 text-center font-bold max-sm:mx-1 max-sm:w-36 max-sm:max-w-full', theme.border)}
                />
              );
            })}
          </div>
          {selectedAnswer === null && (
            <button
              type="button"
              disabled={!fillDraft.trim()}
              onClick={() => handleAnswer(fillDraft)}
              className={cn(
                'w-full min-h-12 rounded-xl text-white font-display uppercase tracking-widest font-bold disabled:opacity-40',
                isArabic ? 'text-sm sm:text-base' : 'text-xs',
                theme.accent
              )}
            >
              {t('nav.check')}
            </button>
          )}
        </div>
      );
    }

    if (currentQuestion.type === 'matching') {
      const pairs = currentQuestion.matchingPairs ?? [];
      const allAssigned = pairs.length > 0 && Object.keys(matchingAssignments).length === pairs.length;
      return (
        <div className="space-y-5">
          <MatchingBoard
            pairs={pairs}
            meanings={presentedMeanings}
            assignments={matchingAssignments}
            onAssignmentsChange={setMatchingAssignments}
            submitted={selectedAnswer !== null}
          />
          {selectedAnswer === null && (
            <button
              type="button"
              disabled={!allAssigned}
              onClick={() => handleAnswer(matchingAssignments)}
              className={cn(
                'w-full min-h-12 rounded-xl text-white font-display uppercase tracking-widest font-bold disabled:opacity-40',
                isArabic ? 'text-sm sm:text-base' : 'text-xs',
                theme.accent
              )}
            >
              {t('nav.matchedThem')}
            </button>
          )}
        </div>
      );
    }

    if (currentQuestion.type === 'sequencing') {
      const itemMap = new Map((currentQuestion.sequencingItems ?? []).map((item) => [item.id, item.text]));
      return (
        <div className="space-y-4">
          <p className={cn('font-serif text-wood/55', isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base')}>
            {language === 'ar' ? 'رتّب الأحداث باستخدام زري الأعلى والأسفل، ثم تحقق من الإجابة.' : 'Use the up and down buttons to put the events in order, then check your answer.'}
          </p>
          <div className="space-y-2.5">
            {sequenceDraft.map((id, index) => {
              const locked = lockedSequenceIds.includes(id);
              const checked = selectedAnswer !== null && lastCorrect !== null;
              const inPlace = expectedSequence(currentQuestion)[index] === id;
              const state = checked ? (inPlace ? 'right' : 'wrong') : locked ? 'right' : 'idle';
              return (
                <motion.div
                  key={id}
                  layout
                  transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                  animate={lastMovedId === id && !checked ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                  className={cn(
                    'relative rounded-xl border-2 px-3 py-3 flex items-center gap-3 transition-colors duration-300',
                    state === 'right' ? 'border-emerald-300 bg-emerald-50' : state === 'wrong' ? 'border-rose-300 bg-rose-50' : 'bg-white',
                    state === 'idle' && theme.border,
                    lastMovedId === id && !checked && 'z-10 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.45)]'
                  )}
                >
                  <span className={cn(
                    'w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-display text-sm font-black',
                    state === 'right' ? 'bg-emerald-500 text-white' : state === 'wrong' ? 'bg-rose-500 text-white' : cn(theme.soft, theme.subtext)
                  )}>
                    {state === 'right' ? '✓' : formatNumber(index + 1)}
                  </span>
                  <span className={cn('font-serif text-wood flex-1 leading-snug', isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base')}>{itemMap.get(id)}</span>
                  {!locked && selectedAnswer === null && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={selectedAnswer !== null || sequenceTarget(index, -1) < 0}
                        onClick={() => moveSequenceItem(index, -1)}
                        className={cn('w-9 h-9 rounded-lg border font-bold disabled:opacity-25', theme.border, theme.subtext)}
                        aria-label={language === 'ar' ? 'تحريك إلى أعلى' : 'Move up'}
                      >↑</button>
                      <button
                        type="button"
                        disabled={selectedAnswer !== null || sequenceTarget(index, 1) < 0}
                        onClick={() => moveSequenceItem(index, 1)}
                        className={cn('w-9 h-9 rounded-lg border font-bold disabled:opacity-25', theme.border, theme.subtext)}
                        aria-label={language === 'ar' ? 'تحريك إلى أسفل' : 'Move down'}
                      >↓</button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          {selectedAnswer === null && (
            <button
              type="button"
              disabled={!sequenceDraft.length}
              onClick={() => handleAnswer(sequenceDraft)}
              className={cn(
                'w-full min-h-12 rounded-xl text-white font-display uppercase tracking-widest font-bold disabled:opacity-40',
                isArabic ? 'text-sm sm:text-base' : 'text-xs',
                theme.accent
              )}
            >
              {t('nav.check')}
            </button>
          )}
        </div>
      );
    }

    if (currentQuestion.type === 'reflection') {
      return (
        <div className={cn('rounded-2xl border-2 bg-white p-4 sm:p-6 space-y-4', theme.border)}>
          {currentQuestion.instructions && (
            <p className={cn('font-serif text-wood/65 leading-relaxed', isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base')}>
              {currentQuestion.instructions}
            </p>
          )}
          {!!currentQuestion.discussionPrompts?.length && (
            <div className="space-y-2">
              {currentQuestion.discussionPrompts.map((prompt, index) => (
                <div key={`${currentQuestion.id}-prompt-${index}`} className={cn('rounded-xl border px-3 py-2.5 font-serif text-wood/70', theme.border, theme.soft, isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm')}>
                  {prompt.question}
                </div>
              ))}
            </div>
          )}
          <textarea
            value={reflectionDraft}
            disabled={selectedAnswer !== null}
            onChange={(event) => setReflectionDraft(event.target.value)}
            rows={7}
            placeholder={isArabic ? 'اكتب إجابتك هنا...' : 'Write your response here...'}
            className={cn(
              'w-full resize-y rounded-xl border-2 bg-white px-4 py-3 font-serif text-wood outline-none transition-shadow focus:ring-2 focus:ring-black/5',
              theme.border,
              isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
            )}
          />
          {selectedAnswer === null && (
            <button
              type="button"
              disabled={!reflectionDraft.trim()}
              onClick={() => handleAnswer(reflectionDraft.trim())}
              className={cn(
                'w-full min-h-12 rounded-xl text-white font-display uppercase tracking-widest font-bold disabled:opacity-40',
                isArabic ? 'text-sm sm:text-base' : 'text-xs',
                theme.accent
              )}
            >
              {isArabic ? 'إكمال التأمل' : 'Complete Reflection'}
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto custom-scrollbar px-4 py-5 sm:p-8">
      <div className="w-full max-w-4xl desk:max-w-[72rem] wide:max-w-none mx-auto space-y-6 sm:space-y-8 pb-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center font-display font-black shrink-0', theme.soft, theme.subtext)}>
                {formatNumber(currentStep + 1)}
              </span>
              <div className="min-w-0">
                <p className={cn('font-display uppercase tracking-widest font-black', isArabic ? 'text-sm' : 'text-[10px]', theme.subtext)}>{t('nav.question')}</p>
                <p className={cn('font-display font-bold', isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base', theme.text)}>
                  {formatNumber(currentStep + 1)} {t('nav.of')} {formatNumber(questions.length)}
                </p>
              </div>
            </div>
            <div className={cn('px-3 py-2 rounded-xl border flex items-center gap-2 shrink-0', theme.soft)}>
              <SECTION_ICONS.finalChallenge.icon size={17} className={theme.subtext} />
              <span className={cn('font-display text-xs sm:text-sm font-black', theme.text)}>{questionTypeLabel}</span>
            </div>
          </div>

          <div className="flex gap-1 sm:gap-1.5" aria-label={isArabic ? 'تقدم التحدي' : 'Challenge progress'}>
            {questions.map((question, index) => (
              <span
                key={question.id}
                className={cn(
                  'h-1.5 sm:h-2 flex-1 rounded-full transition-colors',
                  index < currentStep
                    ? theme.accentSolid
                    : index === currentStep
                      ? `${theme.accentSolid} ring-2 ring-white/90 ring-offset-1 ring-offset-transparent`
                      : 'bg-wood/10'
                )}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <motion.h3
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('font-display text-xl sm:text-2xl md:text-3xl font-black leading-snug text-center', theme.text)}
          >
            {currentQuestion.question || currentQuestion.instructions}
          </motion.h3>
          {currentQuestion.question && currentQuestion.instructions && currentQuestion.type !== 'reflection' && (
            <p className={cn('font-serif text-center text-wood/55', isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm')}>
              {currentQuestion.instructions}
            </p>
          )}
        </div>

        {renderAnswerArea()}

        {selectedAnswer !== null && currentQuestion.type === 'reflection' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('rounded-2xl border-2 p-4 sm:p-5', theme.soft)}
          >
            <p className={cn('font-serif text-wood/75 leading-relaxed', isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base')}>
              {currentQuestion.feedback.correct}
            </p>
            <button
              type="button"
              onClick={goNext}
              className={cn('w-full mt-4 min-h-12 rounded-xl text-white font-display uppercase tracking-widest font-bold flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800', isArabic ? 'text-sm sm:text-base' : 'text-xs')}
            >
              {currentStep < questions.length - 1 ? t('nav.nextQuestion') : (isArabic ? 'عرض ملخص التعلم' : 'View Learning Summary')}
              <ArrowRight className={cn('w-4 h-4', isRTL && 'rotate-180')} />
            </button>
          </motion.div>
        )}
        {selectedAnswer !== null && currentQuestion.type !== 'reflection' && (
          <FeedbackBox
            state={lastCorrect ? 'correct' : attemptNumber === 1 ? 'retry' : 'revealed'}
            revealKey={`${currentQuestion.id}-${attemptNumber}`}
            message={lastCorrect
              ? currentQuestion.feedback.correct
              : <>
                  {currentQuestion.feedback.incorrect || (isArabic ? 'ارجع إلى الدليل في القصة وحاول مرة أخرى.' : 'Return to the story evidence and try once more.')}
                  {currentQuestion.type === 'sequencing' && attemptNumber === 1 && (() => {
                    const expected = expectedSequence(currentQuestion);
                    const inPlace = sequenceDraft.filter((id, index) => expected[index] === id).length;
                    return (
                      <span className="mt-1.5 block font-semibold text-wood/80">
                        {isArabic
                          ? `${formatNumber(inPlace)} من ${formatNumber(expected.length)} في المكان الصحيح. تبقى الجمل الخضراء في مكانها، فرتّب الباقي.`
                          : `${inPlace} of ${expected.length} are in the right place. The green ones stay; move the others.`}
                      </span>
                    );
                  })()}
                </>}
            explanation={currentQuestion.explanation}
            onRetry={retryCurrentQuestion}
            onNext={goNext}
            nextLabel={currentStep < questions.length - 1 ? t('nav.nextQuestion') : (isArabic ? 'عرض ملخص التعلم' : 'View Learning Summary')}
          >
            {renderCorrectionReview()}
          </FeedbackBox>
        )}
      </div>
    </div>
  );
};
