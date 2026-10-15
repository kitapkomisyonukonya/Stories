import React, { useEffect, useMemo, useState } from 'react';
import { suggestNextBook, type NextBookReason } from '../../lib/nextBook';
import { useMyWords } from '../../lib/myWords';
import { MyWordsPanel } from './MyWordsPanel';
import { BookSeal } from '../seyahatname/art';
import { JOURNAL_COPY as journalCopy } from '../seyahatname/copy';
import { sealBook } from '../../lib/seyahatname/store';
import { ResultCard } from './ResultCard';
import { useUserRole } from '../../contexts/UserRoleContext';
import { SECTION_ICONS, MODE_ICONS } from '../../lib/sectionIcons';
import { motion } from 'motion/react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Library,
  RotateCcw,
  Pencil,
  Type,
} from '../ui/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { useStoryProgress } from '../../contexts/StoryProgressContext';
import {
  collectionVisuals,
  getStoryMeta,
  storyCatalog,
} from '../../core/content/storyCatalog';
import type { BookData, Level } from '../../types';

interface SummaryDashboardProps {
  bookData: BookData;
  onFinish: () => void;
  onReviewStory?: () => void;
  onReadAgain?: () => void;
  onStartJourney?: (storyId: string, level: Level) => void;
  /** Opens the Seyahatname, where the book's seal now is. */
  onOpenJournal?: () => void;
}

const normalizeWord = (value: string) => value.trim().toLocaleLowerCase();

const getCurrentStoryId = (bookId: string) => {
  const id = bookId.toLowerCase();
  if (id.includes('abraham')) return 'ibrahim';
  if (id.includes('moses')) return 'musa';
  if (id.includes('mecca')) return 'mecca';
  if (id.includes('ibnjubayr')) return 'ibnJubayr';
  if (id.includes('yunusemre')) return 'yunusEmre';
  if (id.includes('gevhernesibe')) return 'gevherNesibe';
  return 'adam';
};

const percent = (value: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

const progressWidth = (value: number, total: number) => `${percent(value, total)}%`;

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({
  bookData,
  onFinish,
  onReviewStory,
  onReadAgain,
  onStartJourney,
  onOpenJournal,
}) => {
  const { formatNumber, isRTL, language } = useLanguage();
  const { stats } = useStoryProgress();
  const isArabic = language === 'ar';
  const { isTeacher } = useUserRole();
  const [isResultOpen, setIsResultOpen] = useState(false);

  const currentStoryId = useMemo(() => getCurrentStoryId(bookData.id), [bookData.id]);
  const story = useMemo(() => getStoryMeta(currentStoryId) ?? storyCatalog[0], [currentStoryId]);
  const visual = collectionVisuals[story.collection];

  useEffect(() => {
    localStorage.setItem(`completed_${currentStoryId}_${bookData.level}`, 'true');
    sealBook(currentStoryId, bookData.level, isArabic && !story.englishOnly ? 'ar' : 'en');
  }, [currentStoryId, bookData.level, isArabic, story.englishOnly]);

  const storyPages = useMemo(
    () => bookData.pages.filter(page => page.type === 'story'),
    [bookData.pages],
  );

  const totalWordNotes = useMemo(() => {
    const words = new Set<string>();
    storyPages.forEach(page => {
      page.vocabulary?.forEach(item => words.add(normalizeWord(item.word)));
    });
    return words.size;
  }, [storyPages]);

  const expectedActivityIds = useMemo(() => {
    const ids = new Set<string>();

    bookData.pages.forEach(page => {
      if (page.type === 'story') {
        page.exercises?.forEach(exercise => ids.add(exercise.id));
        page.languageFocusExercises?.forEach(exercise => ids.add(exercise.id));
      }

      if (page.type === 'quiz' || page.type === 'exercises') {
        page.exercises?.forEach(exercise => ids.add(exercise.id));
      }

      if (page.type === 'vocabulary-match' && page.vocabularyPairs?.length) {
        ids.add(`vocabulary-${page.id}`);
      }
    });

    return ids;
  }, [bookData.pages]);

  const completedActivityCount = useMemo(
    () => [...stats.exercisesCompleted].filter(id => expectedActivityIds.has(id)).length,
    [stats.exercisesCompleted, expectedActivityIds],
  );

  const audioChapterTotal = useMemo(
    () => storyPages.filter(page => Boolean(page.audioUrl)).length,
    [storyPages],
  );

  const finalChallengePage = useMemo(
    () => bookData.pages.find(page => page.type === 'final-challenge'),
    [bookData.pages],
  );

  const reflectionTotal = useMemo(
    () => finalChallengePage?.exercises?.filter(exercise => exercise.type === 'reflection').length ?? 0,
    [finalChallengePage],
  );

  const finalScore = stats.finalScore;
  const finalDetails = stats.finalChallengeDetails;
  const chapterCount = storyPages.length;
  const chapterVisited = Math.min(stats.chaptersVisited.size, chapterCount);
  const wordsExplored = Math.min(stats.wordsClicked.size, totalWordNotes || stats.wordsClicked.size);
  const audioPlayed = Math.min(
    stats.audioChaptersPlayed.size,
    Math.max(audioChapterTotal, stats.audioChaptersPlayed.size),
  );

  const nextRecommendation = useMemo(
    () => suggestNextBook(currentStoryId, bookData.level, isArabic ? 'ar' : 'en', finalScore),
    // Worked out once when the summary opens, so it does not change under the reader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStoryId, bookData.level, isArabic],
  );
  const myWords = useMyWords();
  const bookWords = myWords.filter(word => word.storyId === currentStoryId && word.level === bookData.level && word.language === (isArabic ? 'ar' : 'en'));
  const [isMyWordsOpen, setIsMyWordsOpen] = useState(false);

  const scoreBand = useMemo(() => {
    if (finalScore === null) {
      return isArabic
        ? { label: 'اكتملت الرحلة', text: 'أنهيت مسار الكتاب ووصلت إلى صفحة الإنجاز.' }
        : { label: 'Journey complete', text: 'You reached the end of the learning journey.' };
    }
    if (finalScore >= 90) {
      return isArabic
        ? { label: 'إتقان قوي', text: 'أظهرت فهماً متماسكاً للكتاب كاملاً وربطت التفاصيل بالأفكار الكبرى.' }
        : { label: 'Strong mastery', text: 'You showed secure whole-book understanding and connected details with larger ideas.' };
    }
    if (finalScore >= 70) {
      return isArabic
        ? { label: 'فهم راسخ', text: 'أكملت الكتاب بفهم قوي، مع نقاط محددة يمكنك تثبيتها بالمراجعة.' }
        : { label: 'Secure understanding', text: 'You completed the book with strong understanding and a clear path for targeted review.' };
    }
    return isArabic
      ? { label: 'اكتمل المسار', text: 'أنهيت الرحلة وحددت بوضوح ما يحتاج إلى مراجعة إضافية.' }
      : { label: 'Journey completed', text: 'You completed the journey and identified exactly what deserves another look.' };
  }, [finalScore, isArabic]);

  const copy = isArabic
    ? {
        eyebrow: 'اكتملت الرحلة',
        congratulations: 'أحسنت الإنجاز',
        completed: `أكملت ${story.nameAr} · ${bookData.level}`,
        journey: 'رحلتك التعليمية',
        chapters: 'الفصول',
        words: 'ملاحظات الكلمات',
        practice: 'مهام التدريب',
        audio: 'فصول استمعت إليها',
        mastery: 'الإتقان النهائي',
        how: 'كيف تعلمت',
        read: 'قرأت وتتبعت',
        listen: 'استمعت',
        explore: 'استكشفت المفردات',
        practise: 'تدربت',
        reflect: 'راجعت وتأملت',
        finalChallenge: 'التحدي النهائي',
        firstTry: 'المحاولة الأولى',
        finalMastery: 'الإتقان بعد المراجعة',
        corrected: 'إجابات تحسنت',
        reflections: 'مهام التأمل',
        revisit: 'نقاط تستحق مراجعة أخرى',
        noRevisit: 'لم يحتج أي سؤال مسجل إلى محاولة ثانية.',
        canDo: 'ما الذي تستطيع فعله الآن؟',
        continue: 'واصل التعلم',
        nextLevel: 'الخطوة المقترحة التالية',
        review: 'مراجعة هذا الكتاب',
        readAgain: 'القراءة من جديد',
        library: 'العودة إلى المكتبة',
        start: 'متابعة الرحلة',
        of: 'من',
        reason: {
          nextLevel: 'أحسنتَ في التحدي النهائي. المستوى التالي من القصة نفسها مناسب لك.',
          sameLevel: 'قصة جديدة في المستوى نفسه، لتقرأ أكثر قبل أن تنتقل إلى المستوى التالي.',
          practiseMore: 'قصة أخرى في المستوى نفسه أولًا. ستجعلك أقوى قبل المستوى التالي.',
        } as Record<NextBookReason, string>,
        myWordsTitle: (n: string) => `حفظتَ ${n} من كلمات هذا الكتاب`,
        myWordsText: 'راجعها الآن مرة واحدة. ستظهر لك مرة أخرى في كتابك التالي.',
        myWordsAction: 'راجع كلماتي',
      }
    : {
        eyebrow: 'Journey complete',
        congratulations: 'Congratulations',
        completed: `You completed ${story.name} · ${bookData.level}`,
        journey: 'Your learning journey',
        chapters: 'Chapters',
        words: 'Word Notes explored',
        practice: 'Practice tasks',
        audio: 'Audio chapters explored',
        mastery: 'Final mastery',
        how: 'How you learned',
        read: 'Read & followed',
        listen: 'Listened',
        explore: 'Explored vocabulary',
        practise: 'Practised',
        reflect: 'Reviewed & reflected',
        finalChallenge: 'Final Challenge',
        firstTry: 'First try',
        finalMastery: 'Mastery after review',
        corrected: 'Answers improved',
        reflections: 'Reflections completed',
        revisit: 'Worth another look',
        noRevisit: 'No scored question needed a second attempt.',
        canDo: 'What you can do now',
        continue: 'Continue learning',
        nextLevel: 'Recommended next step',
        review: 'Review this book',
        readAgain: 'Read again',
        library: 'Back to library',
        start: 'Continue journey',
        of: 'of',
        reason: {
          nextLevel: 'You did well in the Final Challenge. The next level of the same story is right for you.',
          sameLevel: 'A new story at the same level, so you read more before the next level.',
          practiseMore: 'Another story at the same level first. It will make you stronger before the next level.',
        } as Record<NextBookReason, string>,
        myWordsTitle: (n: string) => `You saved ${n} ${n === '1' ? 'word' : 'words'} from this book`,
        myWordsText: 'Review them once now. They will come back in your next book.',
        myWordsAction: 'Review my words',
      };

  const canDoItems = useMemo(() => {
    if (bookData.level === 'A2') {
      return isArabic
        ? [
            'تتبع الأحداث والشخصيات والأفكار الرئيسة في قصة طويلة مقسمة إلى فصول قصيرة.',
            'تفهم مفردات القصة الأساسية من السياق وتعود إلى ملاحظات الكلمات عند الحاجة.',
            'تجيب عن أسئلة الفهم وتستخدم أنماطاً لغوية بسيطة مرتبطة بالنص.',
          ]
        : [
            'Follow the main events, people and ideas across a complete chaptered story.',
            'Understand key story vocabulary from context and use Word Notes when needed.',
            'Answer comprehension questions and reuse simple language patterns from the text.',
          ];
    }

    if (bookData.level === 'B1') {
      return isArabic
        ? [
            'تربط بين تسلسل الأحداث والأسباب والنتائج عبر فصول متعددة.',
            'تستخدم مفردات القصة والعلاقات اللغوية لشرح أفكارك بوضوح أكبر.',
            'تراجع إجاباتك وتنتقل من الفهم إلى إنتاج لغوي مترابط.',
          ]
        : [
            'Connect sequence, cause and result across multiple chapters.',
            'Use story vocabulary and language relationships to explain ideas more clearly.',
            'Review your answers and move from comprehension into connected language use.',
          ];
    }

    return isArabic
      ? [
          'تحلل الأدلة والسببية ونبرة المصدر عبر الكتاب كاملاً مع الحفاظ على درجة اليقين.',
          'تستخدم مفردات دقيقة وروابط خطابية لبناء تفسير مترابط على مستوى B2.',
          'تجمع أفكاراً من فصول مختلفة وتراجع استجابتك في ضوء التغذية الراجعة.',
        ]
      : [
          'Analyse evidence, causality and source stance across the whole book without overstating certainty.',
          'Use precise vocabulary and discourse relationships to build connected B2 interpretation.',
          'Synthesize ideas across chapters and improve a response after targeted feedback.',
        ];
  }, [bookData.level, isArabic]);

  const learningSteps = [
    {
      icon: BookOpen,
      label: copy.read,
      value: chapterVisited,
      total: chapterCount,
    },
    {
      icon: Headphones,
      label: copy.listen,
      value: audioPlayed,
      total: audioChapterTotal,
    },
    {
      icon: Type,
      label: copy.explore,
      value: wordsExplored,
      total: totalWordNotes,
    },
    {
      icon: Pencil,
      label: copy.practise,
      value: completedActivityCount,
      total: expectedActivityIds.size,
    },
    {
      icon: MODE_ICONS.sayOrWrite.icon,
      label: copy.reflect,
      value: finalDetails?.reflectionCompleted ?? 0,
      total: reflectionTotal,
    },
  ];

  const summaryCards = [
    {
      icon: BookOpen,
      label: copy.chapters,
      value: chapterCount ? `${formatNumber(chapterVisited)} / ${formatNumber(chapterCount)}` : formatNumber(chapterVisited),
      progress: percent(chapterVisited, chapterCount),
    },
    {
      icon: Type,
      label: copy.words,
      value: totalWordNotes ? `${formatNumber(wordsExplored)} / ${formatNumber(totalWordNotes)}` : formatNumber(wordsExplored),
      progress: percent(wordsExplored, totalWordNotes),
    },
    {
      icon: Pencil,
      label: copy.practice,
      value: expectedActivityIds.size
        ? `${formatNumber(completedActivityCount)} / ${formatNumber(expectedActivityIds.size)}`
        : formatNumber(completedActivityCount),
      progress: percent(completedActivityCount, expectedActivityIds.size),
    },
    {
      icon: SECTION_ICONS.finalChallenge.icon,
      label: copy.mastery,
      value: finalScore === null ? '—' : `${formatNumber(finalScore)}%`,
      progress: finalScore ?? 0,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto text-white custom-scrollbar"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: visual.summaryGradient }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <img
          src={story.image}
          alt=""
          className="absolute -right-[8%] -top-[16%] h-[70vh] w-[52vw] min-w-[520px] object-cover opacity-[0.075] blur-[32px]"
        />
        <div
          className="absolute left-[7%] top-[4%] h-[420px] w-[420px] rounded-full blur-[150px]"
          style={{ background: visual.ambient, opacity: 0.55 }}
        />
        <div
          className="absolute bottom-[-14%] right-[8%] h-[520px] w-[520px] rounded-full blur-[170px]"
          style={{ background: visual.accentSoft }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-12">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[34px] border border-white/10 bg-black/15 shadow-[0_34px_100px_rgba(0,0,0,0.32)] backdrop-blur-xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[390px_minmax(0,1fr)]">
            <div className="relative min-h-[420px] overflow-hidden bg-black/20">
              <img src={story.image} alt={isArabic ? story.nameAr : story.name} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-8">
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: visual.accentBright, borderColor: `${visual.accent}55`, background: visual.accentSoft }}
                >
                  <img src={visual.icon} alt="" className="h-4 w-4 object-contain" />
                  {isArabic ? visual.nameAr : visual.nameEn}
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  {copy.eyebrow}
                </p>
                <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  {isArabic ? story.nameAr : story.name}
                </h1>
                <p className="mt-2 text-sm font-semibold text-white/65">
                  {bookData.level} · {isArabic ? visual.shortAr : visual.shortEn}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-col justify-center p-7 max-sm:p-5 sm:p-10 lg:p-12">
              <div className="flex items-center gap-3">
                {/* The book's wax seal, pressed as the summary opens; it now sits in the Seyahatname. */}
                <motion.div
                  initial={{ scale: 1.5, opacity: 0, rotate: -14 }}
                  animate={{ scale: 1, opacity: 1, rotate: -4 }}
                  transition={{ delay: 0.2, duration: 0.4, ease: [0.3, 1.4, 0.5, 1] }}
                  className="shrink-0"
                  data-summary-seal
                >
                  <BookSeal storyId={currentStoryId} level={bookData.level} arabic={isArabic && !story.englishOnly} size={84} title={isArabic ? journalCopy.ar.sealed : journalCopy.en.sealed} />
                </motion.div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/62">
                    {copy.eyebrow}
                  </p>
                  {scoreBand.label !== copy.eyebrow && (
                    <p className="mt-1 text-sm font-semibold" style={{ color: visual.accentBright }}>
                      {scoreBand.label}
                    </p>
                  )}
                  {onOpenJournal && (
                    <button
                      type="button"
                      onClick={onOpenJournal}
                      className="mt-1 text-start text-[13px] font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline"
                      data-summary-journal
                    >
                      {isArabic ? 'خُتِمَ الْكِتَابُ فِي دَفْتَرِ رِحْلَتِكَ' : 'Book sealed in your Seyahatname'}
                    </button>
                  )}
                </div>
              </div>

              <h2 className="mt-8 break-words font-display text-[clamp(2.7rem,5vw,5.4rem)] font-semibold leading-[0.94] tracking-[-0.06em] max-sm:text-[clamp(1.75rem,9vw,2.4rem)] max-sm:tracking-[-0.045em]">
                {copy.congratulations}
              </h2>
              <p className="mt-5 text-lg font-medium leading-8 text-white/82 sm:text-xl">
                {copy.completed}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58 sm:text-[15px]">
                {scoreBand.text}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {summaryCards.map(({ icon: Icon, label, value, progress }) => (
                  <div key={label} className="min-w-0 rounded-2xl border border-white/8 bg-white/[0.035] p-4 max-sm:p-3.5">
                    <Icon size={18} style={{ color: visual.accentBright }} />
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/62 max-sm:min-h-[2lh] max-sm:tracking-[0.1em]">{label}</p>
                    <p className="mt-1 whitespace-nowrap text-xl font-semibold tabular-nums text-white">{value}</p>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full" style={{ width: `${progress}%`, background: visual.accent }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="min-w-0 rounded-[30px] border border-white/8 bg-white/[0.035] p-6 max-sm:px-4 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: visual.accentBright }}>
                  {copy.journey}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                  {copy.how}
                </h3>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              {learningSteps.map(({ icon: Icon, label, value, total }, index) => {
                const complete = total > 0 && value >= total;
                return (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 * index }}
                    className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-white/7 bg-black/10 px-4 py-3.5 max-sm:gap-3 max-sm:px-3"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: visual.accentSoft, color: visual.accentBright }}
                    >
                      <Icon size={19} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-white/86 max-sm:whitespace-normal max-sm:leading-snug">{label}</span>
                        <span className="shrink-0 whitespace-nowrap text-xs font-semibold tabular-nums text-white/46">
                          {total > 0 ? `${formatNumber(value)} / ${formatNumber(total)}` : formatNumber(value)}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: total > 0 ? progressWidth(value, total) : value > 0 ? '100%' : '0%' }}
                          transition={{ duration: 0.65, delay: 0.08 * index }}
                          className="h-full rounded-full"
                          style={{ background: visual.accent }}
                        />
                      </div>
                    </div>
                    <CheckCircle2
                      size={18}
                      className={complete ? 'opacity-100' : 'opacity-20'}
                      style={{ color: complete ? visual.accentBright : undefined }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col rounded-[30px] border border-white/8 bg-white/[0.035] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: visual.accentSoft, color: visual.accentBright }}>
                <SECTION_ICONS.finalChallenge.icon size={21} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/62">{copy.finalChallenge}</p>
                <h3 className={cn('mt-1 font-display font-semibold tracking-[-0.03em]', finalScore === null ? 'text-lg text-white/70' : 'text-2xl')}>
                  {finalScore === null ? (isArabic ? 'لم يُنجَز بعد' : 'Not taken yet') : `${formatNumber(finalScore)}%`}
                </h3>
              </div>
            </div>

            {finalDetails ? (
              <>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  {[
                    [copy.firstTry, `${formatNumber(finalDetails.firstAttemptAccuracy)}%`],
                    [copy.finalMastery, `${formatNumber(finalDetails.masteryAccuracy)}%`],
                    [copy.corrected, formatNumber(finalDetails.correctedAnswers)],
                    [copy.reflections, formatNumber(finalDetails.reflectionCompleted)],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0 rounded-2xl border border-white/7 bg-black/10 p-4 max-sm:p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-white/62 max-sm:min-h-[2lh] max-sm:tracking-[0.1em]">{label}</p>
                      <p className="mt-2 whitespace-nowrap text-2xl font-semibold tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-white/7 bg-black/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold text-white/55">{copy.revisit}</p>
                    <span className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums">
                      {formatNumber(finalDetails.missedQuestionCount)} / {formatNumber(finalDetails.scoredQuestionCount)}
                    </span>
                  </div>

                  {finalDetails.missedQuestions.length ? (
                    <div className="mt-3 space-y-2">
                      {finalDetails.missedQuestions.slice(0, 3).map((item, index) => (
                        <div key={item.id} className="flex items-start gap-3 rounded-xl bg-white/[0.035] px-3 py-2.5">
                          <span
                            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                            style={{ background: visual.accentSoft, color: visual.accentBright }}
                          >
                            {formatNumber(index + 1)}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-white/80">{item.title}</p>
                            <p className="mt-0.5 text-xs leading-5 text-white/48">{item.question}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-white/58">{copy.noRevisit}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/12 bg-black/10 px-6 py-8 text-center">
                <SECTION_ICONS.finalChallenge.icon size={30} className="opacity-35" style={{ color: visual.accentBright }} />
                <p className="max-w-xs text-sm leading-6 text-white/58">
                  {isArabic ? 'تظهر هنا تفاصيل المحاولة الأولى والمراجعة عند إكمال التحدي النهائي.' : 'First-try and review details appear here when the Final Challenge is completed.'}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[30px] border border-white/8 bg-white/[0.035] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Award size={22} style={{ color: visual.accentBright }} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: visual.accentBright }}>
                {bookData.level}
              </p>
              <h3 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                {copy.canDo}
              </h3>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {canDoItems.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index }}
                className="rounded-2xl border border-white/7 bg-black/10 p-5"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ background: visual.accentSoft, color: visual.accentBright }}
                >
                  {formatNumber(index + 1)}
                </span>
                <p className="mt-4 text-sm font-medium leading-7 text-white/72">{item}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {!isTeacher && (
          <section className="mt-6 flex flex-col gap-4 rounded-[30px] border border-white/8 bg-white/[0.035] p-6 sm:flex-row sm:items-center sm:p-8" data-summary-result-card>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: visual.accentSoft, color: visual.accentBright }}>
              <SECTION_ICONS.resultCard.icon size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-xl font-semibold">{SECTION_ICONS.resultCard[isArabic ? 'ar' : 'en']}</h3>
              <p className="mt-1 text-sm leading-6 text-white/62">
                {isArabic
                  ? 'نَتَائِجُكَ فِي هٰذَا الكِتَابِ مَعَ رَمْزٍ قَصِيرٍ. أَرِهِ لِمُعَلِّمِكَ أَوِ اطْبَعْهُ.'
                  : 'Your results for this book with a short code. Show it to your teacher or print it.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsResultOpen(true)}
              data-result-card-open
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: visual.summaryButton }}
            >
              {isArabic ? 'افْتَحِ البِطَاقَةَ' : 'Open my card'}
            </button>
            <ResultCard
              isOpen={isResultOpen}
              onClose={() => setIsResultOpen(false)}
              bookData={bookData}
              storyId={currentStoryId}
              level={bookData.level}
            />
          </section>
        )}

        {bookWords.length > 0 && (
          <section className="mt-6 flex flex-col gap-4 rounded-[30px] border border-white/8 bg-white/[0.035] p-6 sm:flex-row sm:items-center sm:p-8" data-summary-my-words>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: visual.accentSoft, color: visual.accentBright }}>
              <SECTION_ICONS.myWords.icon size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-xl font-semibold">{copy.myWordsTitle(formatNumber(bookWords.length))}</h3>
              <p className="mt-1 text-sm leading-6 text-white/62">{copy.myWordsText}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsMyWordsOpen(true)}
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: visual.summaryButton }}
            >
              {copy.myWordsAction}
            </button>
            <MyWordsPanel
              isOpen={isMyWordsOpen}
              onClose={() => setIsMyWordsOpen(false)}
              startInReview
              book={{ storyId: currentStoryId, level: bookData.level }}
            />
          </section>
        )}

        <section className="mt-6 overflow-hidden rounded-[30px] border border-white/8 bg-white/[0.035]">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: visual.accentBright }}>
                {copy.continue}
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                {copy.nextLevel}
              </h3>

              {nextRecommendation && (
                <div className="mt-6 flex items-center gap-4">
                  <img
                    src={nextRecommendation.story.image}
                    alt=""
                    className="h-20 w-16 rounded-xl object-cover shadow-lg"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">
                      {isArabic ? nextRecommendation.story.nameAr : nextRecommendation.story.name}
                    </p>
                    <p className="mt-1 text-sm text-white/48">
                      {nextRecommendation.level} · {isArabic
                        ? collectionVisuals[nextRecommendation.story.collection].shortAr
                        : collectionVisuals[nextRecommendation.story.collection].shortEn}
                    </p>
                  </div>
                </div>
              )}
              {nextRecommendation && (
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/62" data-next-book-reason>
                  {copy.reason[nextRecommendation.reason]}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {nextRecommendation && (
                  <button
                    type="button"
                    onClick={() => onStartJourney?.(nextRecommendation.story.id, nextRecommendation.level)}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 sm:w-auto"
                    style={{ background: visual.summaryButton }}
                  >
                    {copy.start}
                    {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onReviewStory ?? onFinish}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-5 text-sm font-semibold text-white/76 transition-colors hover:bg-white/[0.08] sm:w-auto"
                >
                  <BookOpen size={16} />
                  {copy.review}
                </button>
                <button
                  type="button"
                  onClick={onReadAgain ?? onFinish}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-5 text-sm font-semibold text-white/76 transition-colors hover:bg-white/[0.08] sm:w-auto"
                >
                  <RotateCcw size={16} />
                  {copy.readAgain}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center border-t border-white/8 bg-black/10 p-6 lg:border-s lg:border-t-0">
              <button
                type="button"
                onClick={onFinish}
                className="inline-flex min-h-13 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-6 text-sm font-semibold text-white/76 transition-colors hover:bg-white/[0.09]"
              >
                <Library size={18} style={{ color: visual.accentBright }} />
                {copy.library}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
