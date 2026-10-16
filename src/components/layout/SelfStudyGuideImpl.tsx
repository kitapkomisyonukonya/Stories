import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { X, Download, User, BookOpen, Lightbulb, Clock, Compass, Award, Headphones, Pencil, ListOrdered, Heart, FileText, Eye, CheckCircle, Scroll, ArrowRight, type AppIconProps } from '../ui/icons';
import { PhosphorGuideIcon, type GuideIconName } from '../icons/PhosphorGuideIcon';
import { SECTION_ICONS } from '../../lib/sectionIcons';
import { cn } from '../../lib/utils';
import { collectionVisualFor } from '../../core/content/storyCatalog';
import { PageData, StudentGuideSection, TeacherGuideSection } from '../../types';
import { GuideV2ChapterBox, GuideV2Tools, storyPageForSection } from './GuideV2';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoryProgress } from '../../contexts/StoryProgressContext';
import { useDialogFocus } from '../../hooks/useDialogFocus';

const GuideIcon = ({ name, className = 'w-7 h-7' }: { name: GuideIconName; className?: string }) => (
  <PhosphorGuideIcon name={name} className={className} />
);

/**
 * Guide data names an icon loosely ("Stars", "Map", "Target"). Each one resolves here to an icon that does not
 * already stand for a reader section (no trophy, rocket, magnifier or target), so one icon keeps one meaning.
 */
const iconNameMap: Record<string, React.ComponentType<AppIconProps>> = {
  Users: User, BookOpen: BookOpen, Rocket: Lightbulb, Clock: Clock, Compass: Compass,
  Stars: Award, Ear: Headphones, PenTool: Pencil, Smile: Lightbulb, Map: ListOrdered,
  Lightbulb: Lightbulb, Target: Clock, Heart: Heart, HelpCircle: Lightbulb, FileText: FileText,
  Eye: Eye, CheckCircle: CheckCircle, Overview: Scroll,
};

// A guide section about one reader section gets that section's icon; icons that mean something
// else in the app (target, stars, compass, eye) become a neutral page icon.
const sectionIconName = (title: string, name?: string): string | undefined => {
  if (/quick challenge|التحدي السريع|التَّحَدِّي السَّرِيعُ/i.test(title)) return 'QuickChallenge';
  if (/language focus|التركيز اللغوي|التَّرْكِيزُ اللُّغَوِيُّ/i.test(title)) return 'LanguageFocus';
  if (/listen|استمع|اسْتَمِعْ|الاستماع/i.test(title)) return 'Listen';
  return name && ['Target', 'Stars', 'Compass', 'Eye'].includes(name) ? 'FileText' : name;
};

const iconFor = (name?: string, className = 'w-7 h-7'): React.ReactNode => {
  if (name === 'QuickChallenge' || name === 'LanguageFocus' || name === 'Listen') {
    const Icon = SECTION_ICONS[name === 'QuickChallenge' ? 'quickChallenge' : name === 'LanguageFocus' ? 'languageFocus' : 'listen'].icon;
    return <Icon className={className} aria-hidden="true" />;
  }
  const Icon = (name && iconNameMap[name]) || FileText;
  return <Icon className={className} aria-hidden="true" />;
};

const localizeArabicUiText = (value: string) => value
  .replace(/Tap\s*&\s*Reveal/gi, 'اضغط واكشف')
  .replace(/Tap\s+and\s+Reveal/gi, 'اضغط واكشف')
  .replace(/Language Focus/gi, 'التركيز اللغوي')
  .replace(/Language Review/gi, 'مراجعة اللغة')
  .replace(/Quick Challenge/gi, 'التحدي السريع')
  .replace(/Knowledge Check/gi, 'اختبار المعرفة')
  .replace(/Final Challenge/gi, 'التحدي النهائي')
  .replace(/Teacher Guide/gi, 'دليل المعلم')
  .replace(/Self Study Guide/gi, 'دليل الدراسة الذاتية')
  .replace(/Chapter Support/gi, 'دعم الفصول')
  .replace(/Full Guide/gi, 'الدليل الكامل');

const localizeArabicDeep = <T,>(value: T): T => {
  if (typeof value === 'string') return localizeArabicUiText(value) as T;
  if (Array.isArray(value)) return value.map(item => localizeArabicDeep(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, localizeArabicDeep(item)])
    ) as T;
  }
  return value;
};

type StudyStep = {
  id: string;
  title: string;
  subtitle: string;
  icon: GuideIconName;
  lists: Array<{ title: string; items?: string[] }>;
  texts: Array<{ title: string; text?: string }>;
};

export const SelfStudyGuide = ({
  isOpen,
  onClose,
  title,
  subtitle,
  footerText,
  content = [],
  pages = [],
  studentGuideText = '',
  studentGuideSections = [],
  metadata,
  bookTitle,
  collectionId,
  level,
  pdfUrl
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  footerText?: string;
  content?: TeacherGuideSection[];
  pages?: PageData[];
  studentGuideText?: string;
  studentGuideSections?: StudentGuideSection[];
  metadata?: import('../../types').StudentGuideMetadata;
  /** The book's library name; shown instead of the guide's own title so every screen uses one name. */
  bookTitle?: string;
  collectionId?: string;
  level?: string | null;
  /** The book's printable Self-Study Guide (opens in a new tab). */
  pdfUrl?: string;
}) => {
  // Tab stays inside and focus returns to the opener; Escape is handled below.
  const dialogRef = useDialogFocus(isOpen, onClose, { escape: false });
  const [activeTab, setActiveTab] = useState('welcome');
  const [activeGuideSection, setActiveGuideSection] = useState(0);
  const [activeStudyStep, setActiveStudyStep] = useState(0);
  const [isRescueOpen, setIsRescueOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const contentScrollRef = React.useRef<HTMLDivElement>(null);
  const sectionNavRef = React.useRef<HTMLElement>(null);
  const { language, t, formatNumber, isRTL } = useLanguage();
  const { stats } = useStoryProgress();

  const guideTokens = collectionVisualFor(collectionId).readerTokens;
  const isAr = language === 'ar';
  // A2 learners look for "the answer sentence", not "evidence" (GUIDE_VISUAL_STANDARD, A2 learner language).
  const isA2 = (level ?? metadata?.level) === 'A2';

  if (isAr) {
    title = title ? localizeArabicUiText(title) : title;
    subtitle = subtitle ? localizeArabicUiText(subtitle) : subtitle;
    footerText = footerText ? localizeArabicUiText(footerText) : footerText;
    content = localizeArabicDeep(content);
    studentGuideText = localizeArabicUiText(studentGuideText);
    studentGuideSections = localizeArabicDeep(studentGuideSections);
    metadata = localizeArabicDeep(metadata);
  }

  const displayTitle = bookTitle || metadata?.title || title || t('nav.studentSelfStudyGuide');
  const displaySubtitle = metadata?.subtitle || subtitle || t('nav.reflectionPractice');
  const displayFooter = footerText || t('nav.interactiveEbookSeries');

  const storyPages = useMemo(() => pages.filter(page => page.type === 'story'), [pages]);

  const defaultGuideSections = [
    { title: t('ssg.whoIsThisFor'), icon: iconFor('Users'), text: metadata?.whoIsThisFor || t('ssg.whoIsThisForDesc'), points: [t('ssg.learnerType1'), t('ssg.learnerType2')] },
    { title: t('ssg.whatInBook'), icon: iconFor('BookOpen'), text: t('ssg.whatInBookDesc'), points: [t('ssg.content1'), t('ssg.content2'), t('ssg.content3'), t('ssg.content4')] },
    { title: t('ssg.howToUse'), icon: iconFor('Rocket'), text: t('ssg.howToUseDesc'), points: [t('ssg.step1'), t('ssg.step2'), t('ssg.step3'), t('ssg.step4')] },
    { title: t('ssg.routine'), icon: iconFor('Clock'), text: t('ssg.routineDesc'), points: [t('ssg.routine1'), t('ssg.routine2'), t('ssg.routine3')] },
    { title: t('ssg.readingTips'), icon: iconFor('Compass'), text: t('ssg.readingTipsDesc'), points: [t('ssg.readingTip1'), t('ssg.readingTip2'), t('ssg.readingTip3')] },
    { title: t('ssg.learningWords'), icon: iconFor('Stars'), text: t('ssg.learningWordsDesc'), points: [t('ssg.learningWord1'), t('ssg.learningWord2'), t('ssg.learningWord3'), t('ssg.learningWord4')] },
    { title: t('ssg.listeningSpeaking'), icon: iconFor('Ear'), text: t('ssg.listeningSpeakingDesc'), points: [t('ssg.listeningSpeaking1'), t('ssg.listeningSpeaking2')] },
    { title: t('ssg.writingPractice'), icon: iconFor('PenTool'), text: t('ssg.writingPracticeDesc'), points: [t('ssg.writingPractice1'), t('ssg.writingPractice2'), t('ssg.writingPractice3')] },
    { title: t('ssg.whenHard'), icon: iconFor('Smile'), text: t('ssg.whenHardDesc'), points: [t('ssg.whenHard1'), t('ssg.whenHard2'), t('ssg.whenHard3')] },
  ];

  const displaySections = studentGuideSections.length > 0
    ? studentGuideSections.map(section => ({ ...section, icon: iconFor(sectionIconName(section.title, section.icon)) }))
    : defaultGuideSections;

  const tabs = [
    { id: 'welcome', label: isAr ? 'مساحة الدراسة' : 'Study Home', icon: iconFor('Overview', 'w-5 h-5') },
    ...(content.length ? [{ id: 'chapters', label: isAr ? 'مسار الفصول' : 'Study Path', icon: iconFor('Map', 'w-5 h-5') }] : []),
    ...displaySections.map((section, idx) => ({
      id: `section-${idx}`,
      label: section.title,
      icon: studentGuideSections.length > 0
        ? iconFor(sectionIconName(studentGuideSections[idx]?.title ?? '', studentGuideSections[idx]?.icon), 'w-5 h-5')
        : React.isValidElement(section.icon)
          ? React.cloneElement(section.icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })
          : iconFor('FileText', 'w-5 h-5')
    })),
    ...(studentGuideText ? [{ id: 'full-guide', label: isAr ? 'الدليل الكامل' : (t('ssg.fullGuide') || 'Full Guide'), icon: iconFor('FileText', 'w-5 h-5') }] : [])
  ];

  const getChapterPage = (index: number) => storyPages[index];

  const getChapterExerciseIds = (index: number) => {
    const page = getChapterPage(index);
    if (!page) return [];
    return [
      ...(page.exercises ?? []).map(exercise => exercise.id),
      ...(page.languageFocusExercises ?? []).map(exercise => exercise.id),
    ];
  };

  const chapterStatus = content.map((_, index) => {
    const page = getChapterPage(index);
    const exerciseIds = getChapterExerciseIds(index);
    const completedExercises = exerciseIds.filter(id => stats.exercisesCompleted.has(id)).length;
    const visited = page ? stats.chaptersVisited.has(page.id) : false;
    const complete = exerciseIds.length > 0 && completedExercises === exerciseIds.length;
    return { visited, complete, completedExercises, totalExercises: exerciseIds.length };
  });

  const visitedCount = chapterStatus.filter(status => status.visited).length;
  const completedChapterCount = chapterStatus.filter(status => status.complete).length;
  const totalBookExercises = chapterStatus.reduce((sum, status) => sum + status.totalExercises, 0);
  const completedBookExercises = chapterStatus.reduce((sum, status) => sum + status.completedExercises, 0);

  const lastVisitedIndex = chapterStatus.reduce((last, status, index) => status.visited ? index : last, -1);
  const continueIndex = lastVisitedIndex < 0
    ? 0
    : chapterStatus[lastVisitedIndex]?.complete && lastVisitedIndex < content.length - 1
      ? lastVisitedIndex + 1
      : lastVisitedIndex;

  const activeSection = content[activeGuideSection];

  const labels = isAr ? {
    goals: 'هدفك في هذا الفصل',
    notice: 'ما الذي ألاحظه؟',
    read: 'اقرأ / استمع',
    find: isA2 ? 'اعثر على جملة الجواب في القصة' : 'اعثر على الدليل في القصة',
    vocab: 'المفردات في السياق',
    quick: 'التحدي السريع',
    wrong: 'إذا أخطأت',
    check: 'اختبر نفسك',
    use: 'استخدم ما تعلمته',
    reflection: 'تأمل',
    grammar: 'التركيز اللغوي',
    pronunciation: 'النطق',
  } : {
    goals: 'Your Chapter Goal',
    notice: 'What to Notice',
    read: 'Read / Listen',
    find: isA2 ? 'Find the Answer Sentence in the Story' : 'Find the Evidence in the Story',
    vocab: 'Vocabulary in Context',
    quick: 'Quick Challenge',
    wrong: 'If You Get It Wrong',
    check: 'Check Yourself',
    use: 'Use What You Learned',
    reflection: 'Reflection',
    grammar: 'Language Focus',
    pronunciation: 'Pronunciation',
  };

  const getStudySteps = (section: TeacherGuideSection): StudyStep[] => [
    {
      id: 'goal',
      title: isAr ? 'حدّد هدفك' : 'Set Your Goal',
      subtitle: isAr ? 'اعرف ما الذي تبحث عنه قبل أن تبدأ.' : 'Know what you are looking for before you begin.',
      icon: 'goal',
      lists: [
        { title: labels.goals, items: section.objectives },
        { title: labels.notice, items: section.whatToNotice },
      ],
      texts: [],
    },
    {
      id: 'read',
      title: isAr ? 'اقرأ واستمع' : 'Read & Listen',
      subtitle: isA2
        ? (isAr ? 'اقرأ للمعنى، ثم ابحث عن جملة الجواب.' : 'Read for meaning, then find the answer sentence.')
        : (isAr ? 'اقرأ للمعنى ثم ارجع إلى الدليل.' : 'Read for meaning, then return to the evidence.'),
      icon: 'headphones',
      lists: [
        { title: labels.read, items: section.readListen },
        { title: labels.find, items: section.findAnswerInStory },
      ],
      texts: [],
    },
    {
      id: 'notice',
      title: isAr ? 'لاحظ اللغة' : 'Notice the Language',
      subtitle: isAr ? 'اربط المفردات والتراكيب بما رأيته في الفصل.' : 'Connect vocabulary and language patterns to the chapter.',
      icon: 'language',
      lists: [
        { title: labels.vocab, items: section.vocabularyInContext },
      ],
      texts: [
        { title: labels.grammar, text: section.grammarFocus },
        { title: labels.pronunciation, text: section.pronunciationFocus },
      ],
    },
    {
      id: 'challenge',
      title: isAr ? 'اختبر وأصلح' : 'Challenge & Repair',
      subtitle: isA2
        ? (isAr ? 'أجب أولًا. إذا أخطأت، فابحث عن جملة الجواب وحاول مرة أخرى.' : 'Answer first. If it is wrong, find the answer sentence and try again.')
        : (isAr ? 'أجب أولاً، ثم استخدم الدليل إذا احتجت إلى إصلاح الإجابة.' : 'Answer first, then use evidence to repair what went wrong.'),
      icon: 'pencil',
      lists: [
        { title: labels.wrong, items: section.wrongAnswerSupport },
      ],
      texts: [
        { title: labels.quick, text: section.quickChallengeGuide },
      ],
    },
    {
      id: 'use',
      title: isAr ? 'استخدم وتأمل' : 'Use & Reflect',
      subtitle: isAr ? 'حوّل ما تعلمته إلى إجابة أو فعل أو تأمل قصير.' : 'Turn what you learned into a short response, action, or reflection.',
      icon: 'check',
      lists: [
        { title: labels.check, items: section.selfCheck },
      ],
      texts: [
        { title: labels.use, text: section.useWhatYouLearned },
        { title: labels.reflection, text: section.reflectionPrompt },
      ],
    },
    ...(section.mediationTasks ? [{
      id: 'mediate',
      title: t('ssg.mediateStep'),
      subtitle: t('ssg.mediateSub'),
      icon: 'file' as const,
      lists: [
        { title: section.mediationTasks.noteTaking.focus, items: section.mediationTasks.noteTaking.columns },
      ],
      texts: [
        { title: t('tg.mtAfterNotes'), text: section.mediationTasks.noteTaking.afterNotes },
        { title: t('tg.mtTranslation'), text: section.mediationTasks.translation },
        { title: t('tg.mtHome'), text: section.mediationTasks.homeRetell },
      ],
    }] : []),
  ];

  const activeStudySteps = activeSection ? getStudySteps(activeSection) : [];

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase(isAr ? 'ar' : 'en');
  const searchResults = normalizedSearch
    ? [
        ...content
          .map((chapter, index) => ({ kind: 'chapter' as const, index, label: chapter.chapter }))
          .filter(result => result.label.toLocaleLowerCase(isAr ? 'ar' : 'en').includes(normalizedSearch)),
        ...displaySections
          .map((section, index) => ({ kind: 'section' as const, index, label: section.title }))
          .filter(result => result.label.toLocaleLowerCase(isAr ? 'ar' : 'en').includes(normalizedSearch)),
      ].slice(0, 8)
    : [];

  const openChapter = (index: number) => {
    setActiveGuideSection(Math.min(Math.max(index, 0), Math.max(content.length - 1, 0)));
    setActiveStudyStep(0);
    setIsRescueOpen(false);
    setSearchQuery('');
    setActiveTab('chapters');
  };

  React.useEffect(() => {
    if (!isOpen) return;
    setActiveTab('welcome');
    setActiveGuideSection(continueIndex);
    setActiveStudyStep(0);
    setIsRescueOpen(false);
    setSearchQuery('');
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, activeGuideSection, isOpen]);

  // Keep the active section tab in view: the phone strip scrolls sideways, the desktop map vertically.
  React.useEffect(() => {
    if (!isOpen) return;
    const active = sectionNavRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [activeTab, isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (isRescueOpen) {
        setIsRescueOpen(false);
        return;
      }
      onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isRescueOpen, onClose]);

  const renderList = (title: string, items?: string[]) => {
    if (!items?.length) return null;
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5">
        <h5 className="font-display text-[11px] sm:text-[12px] font-black uppercase tracking-[0.14em] text-gold/72">{title}</h5>
        <ul className="mt-3 space-y-2.5 font-serif text-[14px] sm:text-base text-white/82 leading-relaxed">
          {items.map((item, index) => (
            <li key={index} className="flex gap-2.5">
              <span className="text-gold/55">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderText = (title: string, text?: string) => {
    if (!text) return null;
    return (
      <div className="rounded-2xl border border-gold/15 bg-gold/[0.055] p-4 sm:p-5">
        <h5 className="font-display text-[11px] sm:text-[12px] font-black uppercase tracking-[0.14em] text-gold/72">{title}</h5>
        <p className="mt-3 font-serif text-[14px] sm:text-base text-white/82 leading-relaxed">{text}</p>
      </div>
    );
  };

  const renderStudyHome = () => {
    const progressPercent = content.length ? Math.round((visitedCount / content.length) * 100) : 0;
    const continueChapter = content[continueIndex];

    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 sm:space-y-8">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-gold/20 bg-gradient-to-br from-gold/[0.13] via-white/[0.035] to-transparent p-5 sm:p-7 md:p-8">
          <div className="absolute -end-16 -top-16 w-52 h-52 rounded-full bg-gold/[0.08] blur-3xl" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.45fr_0.85fr] gap-6 lg:gap-8 items-center">
            <div>
              <p className="font-display text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-gold/60">
                {isAr ? 'مساحة الدراسة الشخصية' : 'YOUR STUDY WORKSPACE'}
              </p>
              <h3 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                {isAr ? 'اعرف أين أنت وما الخطوة التالية.' : 'Know where you are and what comes next.'}
              </h3>
              <p className="mt-3 max-w-2xl font-serif text-[14px] sm:text-base md:text-lg text-white/68 leading-relaxed">
                {metadata?.whoIsThisFor || metadata?.description || t('ssg.welcomeDesc')}
              </p>

              {continueChapter && (
                <button
                  type="button"
                  onClick={() => openChapter(continueIndex)}
                  className="mt-5 inline-flex min-h-12 items-center gap-3 rounded-2xl bg-gold px-5 sm:px-6 font-display text-[13px] sm:text-sm font-bold text-white shadow-lg shadow-black/15 transition-transform hover:-translate-y-0.5"
                >
                  <span>{isAr ? 'تابع من حيث توقفت' : 'Continue where you left off'}</span>
                  <span className="opacity-70">· {formatNumber(continueIndex + 1)}</span>
                  <ArrowRight className={cn('w-5 h-5', isRTL && 'rotate-180')} aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-white/[0.08] bg-black/15 p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-display text-[10px] font-black uppercase tracking-[0.15em] text-white/35">
                    {isAr ? 'تقدم الفصول' : 'CHAPTER PROGRESS'}
                  </p>
                  <p className="mt-1 font-display text-3xl font-black text-white">{formatNumber(progressPercent)}%</p>
                </div>
                <p className="font-display text-sm font-bold text-gold">
                  {formatNumber(visitedCount)} / {formatNumber(content.length)}
                </p>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div initial={false} animate={{ width: `${progressPercent}%` }} className="h-full rounded-full bg-gold" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/[0.04] p-3.5">
                  <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">{isAr ? 'فصول مكتملة' : 'Completed'}</p>
                  <p className="mt-1 font-display text-xl font-black text-white">{formatNumber(completedChapterCount)}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.04] p-3.5">
                  <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">{isAr ? 'أنشطة مكتملة' : 'Activities'}</p>
                  <p className="mt-1 font-display text-xl font-black text-white">{formatNumber(completedBookExercises)} / {formatNumber(totalBookExercises)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {content.length > 0 && (
          <div>
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <p className="font-display text-[10px] font-black uppercase tracking-[0.16em] text-gold/50">
                  {isAr ? 'خريطة الكتاب' : 'BOOK MAP'}
                </p>
                <h4 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white">{isAr ? 'اختر فصلاً' : 'Choose a chapter'}</h4>
              </div>
              <div className="hidden sm:flex items-center gap-3 font-display text-[10px] text-white/40">
                <span>○ {isAr ? 'جديد' : 'New'}</span>
                <span className="text-gold">● {isAr ? 'تمت زيارته' : 'Visited'}</span>
                <span className="text-emerald-400">✓ {isAr ? 'مكتمل' : 'Complete'}</span>
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2.5">
              {content.map((chapter, index) => {
                const status = chapterStatus[index];
                return (
                  <button
                    key={`home-chapter-${index}`}
                    type="button"
                    onClick={() => openChapter(index)}
                    title={chapter.chapter}
                    aria-label={chapter.chapter}
                    className={cn(
                      "relative aspect-square rounded-2xl border flex items-center justify-center font-display text-[12px] sm:text-[13px] font-black transition-all hover:-translate-y-0.5",
                      status?.complete
                        ? "border-emerald-400/25 bg-emerald-400/[0.10] text-emerald-300"
                        : status?.visited
                          ? "border-gold/30 bg-gold/[0.10] text-gold"
                          : "border-white/[0.08] bg-white/[0.025] text-white/42 hover:border-gold/20 hover:text-white/70"
                    )}
                  >
                    {status?.complete ? '✓' : formatNumber(index + 1)}
                    {status?.visited && !status.complete && <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-gold" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(metadata?.learningGoals?.length || metadata?.recommendedUse?.length) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metadata?.learningGoals?.length ? renderList(isAr ? 'أهدافك' : 'Your Learning Goals', metadata.learningGoals) : null}
            {metadata?.recommendedUse?.length ? renderList(isAr ? 'طريقة الاستخدام المقترحة' : 'Recommended Study Routine', metadata.recommendedUse) : null}
          </div>
        )}

        {metadata?.readingDiary?.prompts?.length ? (
          <div data-ssg-reading-diary>
            {renderList(t('ssg.readingDiary'), [metadata.readingDiary.intro, ...metadata.readingDiary.prompts])}
          </div>
        ) : null}

        <GuideV2Tools language={language} variant="self" />
      </motion.div>
    );
  };

  const renderChapterSupport = () => {
    if (!activeSection) return null;
    const steps = activeStudySteps;
    const status = chapterStatus[activeGuideSection];

    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 sm:space-y-7">
        <div className="rounded-[1.65rem] border border-gold/18 bg-gradient-to-br from-gold/[0.10] via-white/[0.025] to-transparent p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-[10px] font-black uppercase tracking-[0.16em] text-gold/50">
                {isAr ? 'مسار الفصل' : 'CHAPTER STUDY PATH'}
              </p>
              <h3 className="mt-1 font-display text-xl sm:text-2xl md:text-3xl font-bold text-white">{activeSection.chapter}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-gold/15 bg-gold/[0.055] px-3 py-1 font-display text-[10px] sm:text-[11px] font-bold text-gold">
                  {activeSection.timing}
                </span>
                {status?.complete ? (
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.09] px-3 py-1 font-display text-[10px] sm:text-[11px] font-bold text-emerald-300">
                    ✓ {isAr ? 'أنشطة الفصل مكتملة' : 'Chapter activities complete'}
                  </span>
                ) : status?.visited ? (
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1 font-display text-[10px] sm:text-[11px] font-bold text-white/55">
                    {formatNumber(status.completedExercises)} / {formatNumber(status.totalExercises)} {isAr ? 'أنشطة' : 'activities'}
                  </span>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRescueOpen(open => !open)}
              className={cn(
                "min-h-11 shrink-0 rounded-xl border px-4 font-display text-[12px] sm:text-[13px] font-bold transition-colors",
                isRescueOpen
                  ? "border-amber-300/30 bg-amber-300/[0.13] text-amber-200"
                  : "border-white/[0.08] bg-white/[0.035] text-white/68 hover:border-amber-300/25 hover:text-amber-200"
              )}
            >
              {isAr ? 'أحتاج مساعدة' : "I'm stuck"}
            </button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {content.map((chapter, index) => {
              const chapterState = chapterStatus[index];
              return (
                <button
                  key={`chapter-nav-${index}`}
                  type="button"
                  onClick={() => openChapter(index)}
                  title={chapter.chapter}
                  className={cn(
                    "relative shrink-0 min-w-10 h-10 px-3 rounded-full border font-display text-[11px] font-black transition-all",
                    activeGuideSection === index
                      ? "bg-gold text-white border-gold shadow-lg shadow-black/10"
                      : chapterState?.complete
                        ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300"
                        : chapterState?.visited
                          ? "border-gold/25 bg-gold/[0.065] text-gold"
                          : "border-white/[0.08] bg-white/[0.025] text-white/42 hover:text-white/70"
                  )}
                >
                  {chapterState?.complete && activeGuideSection !== index ? '✓' : formatNumber(index + 1)}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {isRescueOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/[0.065] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl bg-amber-300/[0.12] text-amber-200 flex items-center justify-center shrink-0">
                    <GuideIcon name="help" className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="font-display text-[10px] font-black uppercase tracking-[0.16em] text-amber-200/65">
                      {isAr ? 'وضع الإنقاذ' : 'RESCUE MODE'}
                    </p>
                    <h4 className="mt-1 font-display text-lg sm:text-xl font-bold text-white">
                      {isA2
                        ? (isAr ? 'لا تخمّن. ارجع إلى جملة الجواب.' : "Don't guess. Go back to the answer sentence.")
                        : (isAr ? 'لا تبحث عن الإجابة. عد إلى الدليل.' : "Don't hunt for the answer. Return to the evidence.")}
                    </h4>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {renderList(labels.find, activeSection.findAnswerInStory)}
                  {renderList(labels.wrong, activeSection.wrongAnswerSupport)}
                  {renderList(labels.vocab, activeSection.vocabularyInContext)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <GuideV2ChapterBox page={activeSection ? storyPageForSection(pages, activeSection, activeGuideSection) : undefined} language={language} variant="self" />

        <div className="rounded-[1.6rem] border border-white/[0.07] bg-black/10 p-3 sm:p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStudyStep(index)}
                className={cn(
                  "relative rounded-2xl border p-3 sm:p-3.5 text-start transition-all",
                  activeStudyStep === index
                    ? "border-gold/30 bg-gold/[0.11] text-white shadow-lg shadow-black/10"
                    : "border-white/[0.06] bg-white/[0.02] text-white/52 hover:bg-white/[0.04] hover:text-white/72"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center",
                    activeStudyStep === index ? "bg-gold text-white" : "bg-white/[0.04] text-gold/65"
                  )}>
                    <GuideIcon name={step.icon} className="w-4 h-4" />
                  </span>
                  <span className="font-display text-[10px] font-black text-gold/45">{formatNumber(index + 1)}</span>
                </div>
                <p className="mt-2 font-display text-[12px] sm:text-[13px] font-bold leading-tight">{step.title}</p>
              </button>
            ))}
          </div>
        </div>

        {steps[activeStudyStep] && (
          <motion.div
            key={steps[activeStudyStep].id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.65rem] border border-gold/16 bg-white/[0.025] p-4 sm:p-6"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="w-11 h-11 rounded-2xl bg-gold text-white flex items-center justify-center shrink-0">
                <GuideIcon name={steps[activeStudyStep].icon} className="w-5 h-5" />
              </span>
              <div>
                <p className="font-display text-[10px] font-black uppercase tracking-[0.16em] text-gold/50">
                  {isAr ? `الخطوة ${formatNumber(activeStudyStep + 1)} من 5` : `STEP ${formatNumber(activeStudyStep + 1)} OF 5`}
                </p>
                <h4 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white">{steps[activeStudyStep].title}</h4>
                <p className="mt-1.5 font-serif text-[14px] sm:text-base text-white/58">{steps[activeStudyStep].subtitle}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {steps[activeStudyStep].lists.map((block, index) => (
                <React.Fragment key={`list-${index}`}>{renderList(block.title, block.items)}</React.Fragment>
              ))}
              {steps[activeStudyStep].texts.map((block, index) => (
                <React.Fragment key={`text-${index}`}>{renderText(block.title, block.text)}</React.Fragment>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
              <button
                type="button"
                disabled={activeStudyStep === 0}
                onClick={() => setActiveStudyStep(step => Math.max(0, step - 1))}
                className="min-h-10 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 font-display text-[11px] sm:text-[12px] font-bold text-white/55 disabled:opacity-25"
              >
                {isAr ? 'السابق' : 'Previous'}
              </button>
              <span className="font-display text-[10px] sm:text-[11px] font-bold text-white/30">
                {formatNumber(activeStudyStep + 1)} / 5
              </span>
              <button
                type="button"
                disabled={activeStudyStep === steps.length - 1}
                onClick={() => setActiveStudyStep(step => Math.min(steps.length - 1, step + 1))}
                className="min-h-10 rounded-xl border border-gold/18 bg-gold/[0.065] px-4 font-display text-[11px] sm:text-[12px] font-bold text-gold disabled:opacity-25"
              >
                {isAr ? 'التالي' : 'Next'}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderGeneralSection = () => {
    if (!activeTab.startsWith('section-')) return null;
    const sectionIdx = parseInt(activeTab.split('-')[1]);
    const section = displaySections[sectionIdx];
    if (!section) return null;

    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} key={activeTab}>
        <div className="rounded-[1.75rem] border border-gold/18 bg-gradient-to-br from-gold/[0.09] via-white/[0.025] to-transparent p-5 sm:p-7 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gold/[0.13] flex items-center justify-center text-gold shrink-0">{section.icon}</div>
            <div>
              <p className="font-display text-[10px] font-black uppercase tracking-[0.16em] text-gold/50">
                {isAr ? 'دليل الدراسة' : 'STUDY GUIDE'}
              </p>
              <h3 className="mt-1 font-display text-xl sm:text-2xl md:text-3xl font-bold text-white">{section.title}</h3>
            </div>
          </div>
          <p className="mt-5 font-serif text-[15px] sm:text-lg text-white/78 leading-relaxed max-w-4xl">{section.text}</p>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {section.points.map((point, index) => (
              <div key={index} className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                <span className="w-7 h-7 rounded-full bg-gold/[0.10] text-gold flex items-center justify-center shrink-0">
                  <GuideIcon name="check" className="w-4 h-4" />
                </span>
                <span className="font-serif text-[14px] sm:text-base text-white/78 leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderContent = () => {
    if (activeTab.startsWith('section-')) return renderGeneralSection();
    if (activeTab === 'welcome') return renderStudyHome();
    if (activeTab === 'chapters') return renderChapterSupport();
    if (activeTab === 'full-guide') {
      return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="prose prose-invert prose-gold max-w-none font-serif">
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-8">
            <ReactMarkdown>{studentGuideText}</ReactMarkdown>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const activeTabIndex = Math.max(0, tabs.findIndex(tab => tab.id === activeTab));
  const activeTabMeta = tabs[activeTabIndex] ?? tabs[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn('self-study-shell fixed inset-0 bg-wood/98 backdrop-blur-3xl z-[100] overflow-hidden flex flex-col', isRTL && 'font-arabic')}
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.selfStudyGuide')}
          style={{
            '--color-gold': guideTokens.accent,
            '--color-wood': guideTokens.chromeMenu
          } as React.CSSProperties}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <header className="self-study-header min-h-[4.75rem] md:min-h-[6.25rem] border-b border-gold/15 px-4 sm:px-7 md:px-10 lg:px-12 py-3.5 flex items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
              <div className="relative p-2.5 sm:p-3.5 bg-gold text-white rounded-2xl shrink-0 shadow-lg shadow-black/15">
                <SECTION_ICONS.selfStudy.icon className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-gold/60">
                  {isAr ? 'مساحة الدراسة الذاتية' : 'SELF-STUDY WORKSPACE'}
                </p>
                <h2 className="mt-0.5 font-display text-lg sm:text-2xl md:text-[28px] text-white font-bold tracking-tight truncate">{displayTitle}</h2>
                <p className="font-serif text-gold/70 text-[13px] sm:text-[15px] mt-0.5 truncate">{displaySubtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener"
                data-book-pdf-link
                className="flex min-h-11 items-center gap-2 rounded-xl border border-gold/15 bg-gold/[0.07] px-3 sm:px-4 font-display text-[12px] sm:text-[13px] font-bold text-gold transition-colors hover:bg-gold hover:text-white"
                title={isAr ? 'افتح دليل التعلم الذاتي PDF للقراءة أو الطباعة' : 'Open the Self-Study Guide PDF to read or print'}
              >
                <Download size={18} className="shrink-0" />
                <span className="hidden sm:inline">PDF</span>
              </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-gold hover:bg-white/[0.08] transition-colors"
                aria-label={isAr ? 'إغلاق دليل الدراسة الذاتية' : 'Close Self-Study Guide'}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <aside className={cn(
              'self-study-sidebar w-[4.5rem] sm:w-20 md:w-[20rem] lg:w-[21rem] border-gold/10 overflow-y-auto custom-scrollbar shrink-0',
              isRTL ? 'border-l' : 'border-r'
            )}>
              <div className="hidden md:block px-4 pt-5 pb-3">
                <div className="rounded-2xl border border-gold/12 bg-white/[0.035] p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="font-display text-[10px] font-black uppercase tracking-[0.16em] text-gold/50">
                        {isAr ? 'تقدمك' : 'YOUR PROGRESS'}
                      </p>
                      <p className="mt-1 font-display text-lg font-black text-white">{formatNumber(visitedCount)} / {formatNumber(content.length)}</p>
                    </div>
                    <span className="font-display text-[11px] font-bold text-gold">{formatNumber(completedBookExercises)} / {formatNumber(totalBookExercises)}</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      initial={false}
                      animate={{ width: `${content.length ? (visitedCount / content.length) * 100 : 0}%` }}
                      className="h-full rounded-full bg-gold"
                    />
                  </div>
                </div>
              </div>

              <nav ref={sectionNavRef} className="p-2 sm:p-3 md:px-4 md:pb-6 space-y-1.5">
                {tabs.map((tab, index) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={tab.label}
                      title={tab.label}
                      className={cn(
                        "relative w-full min-h-12 md:min-h-[3.65rem] flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3.5 px-2 md:px-3.5 rounded-xl border transition-all",
                        isActive
                          ? "border-gold/25 bg-gold/[0.12] text-white"
                          : "border-transparent text-white/48 hover:bg-white/[0.04] hover:text-white/72"
                      )}
                    >
                      <span className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        isActive ? "bg-gold text-white" : "bg-white/[0.04] text-gold/65"
                      )}>
                        {tab.icon}
                      </span>
                      <span className="block md:hidden font-display text-[10px] sm:text-[11px] font-black">{formatNumber(index + 1)}</span>
                      <span className={cn("hidden md:block min-w-0 flex-1 font-display text-[14px] lg:text-[15px] font-bold leading-tight", isRTL ? "text-right" : "text-left")}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <main ref={contentScrollRef} className="self-study-content flex-1 overflow-y-auto custom-scrollbar">
              <div className="sticky top-0 z-20 border-b border-gold/10 bg-wood/95 backdrop-blur-xl px-4 sm:px-7 md:px-9 lg:px-11 py-3">
                <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex flex-1 items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-gold/[0.10] border border-gold/15 text-gold flex items-center justify-center shrink-0">{activeTabMeta.icon}</span>
                    <div className="min-w-0">
                      <p className="font-display text-[10px] font-black uppercase tracking-[0.15em] text-gold/45">{isAr ? 'أنت هنا' : 'YOU ARE HERE'}</p>
                      <h3 className="font-display text-base sm:text-lg font-bold text-white truncate">{activeTabMeta.label}</h3>
                    </div>
                  </div>

                  <div className="relative order-3 w-full md:order-none md:w-[19rem]">
                    <span className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-gold/50", isRTL ? "right-3.5" : "left-3.5")}>
                      <GuideIcon name="search" className="w-4 h-4" />
                    </span>
                    <input
                      value={searchQuery}
                      onChange={event => setSearchQuery(event.target.value)}
                      placeholder={isAr ? 'ابحث عن فصل أو دليل...' : 'Find a chapter or study guide...'}
                      aria-label={isAr ? 'بحث في دليل الدراسة الذاتية' : 'Search Self-Study Guide'}
                      className={cn(
                        "w-full h-11 rounded-xl border border-white/[0.08] bg-black/20 text-white placeholder:text-white/25 outline-none focus:border-gold/35 focus:ring-2 focus:ring-gold/10 font-serif text-[13px]",
                        isRTL ? "pr-10 pl-3.5 text-right" : "pl-10 pr-3.5"
                      )}
                    />
                    {searchQuery.trim() && (
                      <div className="absolute top-[calc(100%+0.5rem)] inset-x-0 z-50 overflow-hidden rounded-2xl border border-gold/15 bg-wood/95 shadow-2xl backdrop-blur-xl">
                        {searchResults.length > 0 ? (
                          <div className="p-2">
                            {searchResults.map((result, index) => (
                              <button
                                key={`${result.kind}-${result.index}-${index}`}
                                type="button"
                                onClick={() => {
                                  if (result.kind === 'chapter') openChapter(result.index);
                                  else {
                                    setActiveTab(`section-${result.index}`);
                                    setSearchQuery('');
                                  }
                                }}
                                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-start hover:bg-white/[0.06]"
                              >
                                <span className="w-8 h-8 rounded-lg bg-gold/[0.10] text-gold flex items-center justify-center shrink-0">
                                  <GuideIcon name={result.kind === 'chapter' ? 'book' : 'file'} className="w-4 h-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block font-display text-[10px] font-black uppercase tracking-[0.12em] text-gold/42">
                                    {result.kind === 'chapter' ? (isAr ? 'فصل' : 'Chapter') : (isAr ? 'دليل' : 'Guide')}
                                  </span>
                                  <span className="block truncate font-display text-[13px] font-bold text-white/82">{result.label}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="px-4 py-4 font-serif text-[13px] text-white/42">{isAr ? 'لا توجد نتيجة مطابقة.' : 'No matching chapter or guide.'}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-4 py-5 sm:px-7 sm:py-7 md:px-9 md:py-8 lg:px-11 lg:py-10">
                <div className="max-w-6xl mx-auto">{renderContent()}</div>
              </div>
            </main>
          </div>

          <footer className="h-12 md:h-14 border-t border-gold/10 px-4 md:px-10 flex items-center justify-center shrink-0 bg-black/15">
            <p className="font-display text-[10px] sm:text-[11px] tracking-[0.16em] text-gold/55 uppercase text-center">{displayFooter}</p>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
