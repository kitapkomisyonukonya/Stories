import { appImage, usePreloadImage } from './lib/mediaImage';
import { usePreloadAudio } from './components/book/ChapterAudio';
import React, { Suspense, lazy, useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  BookMarked,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Home,
  Info,
  LoaderCircle,
  CheckCircle,
  Layers,
  MapPin,
  Menu,
  X, HelpCircle, FileText, Scroll } from './components/ui/icons';

import { Level, PageData } from './types';
import { useBookBundle } from './hooks/useBookBundle';
import {
  loadSelfStudyGuideData,
  loadTeacherGuideData,
  type BilingualSelfStudyGuideData,
  type BilingualTeacherGuideData,
} from './core/content/bookGuideLoader';
import { cn } from './lib/utils';
import { clearReaderPosition, readReaderPosition, saveReaderPosition } from './lib/readerPosition';
import { formatHashRoute, isHomeHash, parseHashRoute, type HashRoute } from './lib/hashRoute';
import { mergeBookProgress, readBookProgress, type BookProgress } from './lib/bookProgress';
import { collectionVisuals, getStoryMeta, isHiddenStory, readerTokenVariables } from './core/content/storyCatalog';
import { useLanguage } from './contexts/LanguageContext';
import { LanguageToggle } from './components/ui/LanguageToggle';
import { FullscreenToggle } from './components/ui/FullscreenButton';
import { ReaderSettings } from './components/book/ReaderSettings';
import { useMediaQuery } from './lib/useMediaQuery';
import { useReaderPreferences } from './hooks/useReaderPreferences';
import { useIsPhone, useSheetDrag } from './lib/phone';
import { useDialogFocus } from './hooks/useDialogFocus';
import { StoryProgressProvider, useStoryProgress } from './contexts/StoryProgressContext';

// Layout Components
// Loaded on first use: the teacher guide, the final challenge and the summary are large and not needed to start reading.
const TeacherGuide = lazy(() => import('./components/layout/TeacherGuide').then(module => ({ default: module.TeacherGuide })));
const FinalChallenge = lazy(() => import('./components/book/FinalChallenge').then(module => ({ default: module.FinalChallenge })));
const StoryMapPage = lazy(() => import('./features/story-maps/StoryMapPage').then(module => ({ default: module.StoryMapPage })));
const PlacesPage = lazy(() => import('./features/historical-entities/PlacesPage'));
const SummaryDashboard = lazy(() => import('./components/book/SummaryDashboard').then(module => ({ default: module.SummaryDashboard })));
import { SelfStudyGuide } from './components/layout/SelfStudyGuide';
import { HomePage } from './components/layout/HomePage';
import { AboutPage } from './components/layout/AboutPage';
import { HowToUse } from './components/layout/HowToUse';
import { UsageGuide } from './components/layout/UsageGuide';
import { USAGE_GUIDES } from './data/usageGuides';
import { SECTION_ICONS } from './lib/sectionIcons';
import { BOOK_PDF_LABELS, STORY_PDF_KINDS, bookPdfUrl } from './lib/bookPdfs';

// Book Components
import { StoryPage, StoryFlow, ExercisePage, MasterGlossary } from './components/book/readerChunks';
import { RolePicker } from './components/layout/RolePicker';
import { AccessGate, hasAccessCode } from './components/layout/AccessGate';
import { MyWordsPanel } from './components/book/MyWordsPanel';
import { SeyahatnamePanel, type OpenBookTarget } from './components/seyahatname/SeyahatnamePanel';
import { StampMoment } from './components/seyahatname/StampMoment';
import { JOURNAL_COPY } from './components/seyahatname/copy';
import { pressStamps } from './lib/seyahatname/store';
import { setMyWordsBook } from './lib/myWords';
import { useUserRole } from './contexts/UserRoleContext';
import { useClassMode } from './contexts/ClassModeContext';
import { saveBookOffline } from './lib/pwa';
import { OFFLINE_BOOK_SIZE_MB } from './data/offlineBookSizes';

const AppContent = () => {
  // --- State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hasAccessCode);
  const { role, isTeacher } = useUserRole();
  const { classMode, setClassMode } = useClassMode();
  // A shared or reloaded link like #/mecca/a2/5 opens that book at that page.
  const [initialRoute] = useState(() => parseHashRoute(window.location.hash));
  const [selectedProphetId, setSelectedProphetId] = useState<string | null>(initialRoute?.storyId ?? null);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(initialRoute?.level ?? null);
  const [currentPageIndex, setCurrentPageIndex] = useState(initialRoute?.pageIndex ?? 0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [isUsageGuideOpen, setIsUsageGuideOpen] = useState(false);
  const [isMyWordsOpen, setIsMyWordsOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [stampMoment, setStampMoment] = useState<{ storyId: string; level: Level; chapter: number } | null>(null);
  const [isTeacherGuideOpen, setIsTeacherGuideOpen] = useState(false);
  const [isSelfStudyOpen, setIsSelfStudyOpen] = useState(false);
  const [teacherGuideData, setTeacherGuideData] = useState<BilingualTeacherGuideData | null>(null);
  const [selfStudyGuideData, setSelfStudyGuideData] = useState<BilingualSelfStudyGuideData | null>(null);
  const {
    isDyslexic, setIsDyslexic,
    readerScale, setReaderScale,
    isWideView, setIsWideView,
    showHighlights, setShowHighlights,
    followAlong, setFollowAlong,
    storyMode, setStoryMode,
  } = useReaderPreferences();
  const isLargeDesktop = useMediaQuery('(min-width: 90rem)');
  // Phones get native patterns: the menu opens as a sheet from the bottom, the header keeps only what is used most.
  const isPhone = useIsPhone();
  const menuSheet = useSheetDrag(() => setIsMenuOpen(false));
  const menuRef = useDialogFocus<HTMLElement>(isMenuOpen, () => setIsMenuOpen(false));
  const [isReaderSettingsOpen, setIsReaderSettingsOpen] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, boolean | null>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [isQuickTOCOpen, setIsQuickTOCOpen] = useState(false);
  const [activePdfDownloads, setActivePdfDownloads] = useState<string[]>([]);
 
  useEffect(() => {
    const handleStart = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.name) {
        setActivePdfDownloads(prev => [...prev, detail.name]);
      }
    };
    const handleEnd = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.name) {
        setActivePdfDownloads(prev => prev.filter(n => n !== detail.name));
      }
    };
    window.addEventListener('pdf-generation-start', handleStart);
    window.addEventListener('pdf-generation-end', handleEnd);
    return () => {
      window.removeEventListener('pdf-generation-start', handleStart);
      window.removeEventListener('pdf-generation-end', handleEnd);
    };
  }, []);






 
  const { language, setLanguage, t, formatNumber, isRTL } = useLanguage();
  const { stats, resetStats, hydrateStats } = useStoryProgress();
  const {
    definition: currentDefinition,
    pair: currentBookPair,
    loading: isBookLoading,
    error: bookLoadError,
  } = useBookBundle(selectedProphetId, currentLevel);

  // English-only books (no Arabic edition) always open in English.
  const isEnglishOnlyBook = Boolean(selectedProphetId && getStoryMeta(selectedProphetId)?.englishOnly);
  useEffect(() => {
    if (isEnglishOnlyBook && language === 'ar') setLanguage('en');
  }, [isEnglishOnlyBook, language, setLanguage]);

  // --- Data ---
  const currentBook = useMemo(() => {
    if (!currentBookPair) return null;
    return language === 'ar' ? currentBookPair.ar : currentBookPair.en;
  }, [currentBookPair, language]);

  const currentPage = currentBook?.pages[currentPageIndex];
  const nextChapterAudio = useMemo(
    () => currentBook?.pages.slice(currentPageIndex + 1).find(page => page.type === 'story' && page.audioUrl)?.audioUrl,
    [currentBook, currentPageIndex],
  );
  usePreloadAudio(nextChapterAudio);
  const nextChapterImage = useMemo(
    () => currentBook?.pages.slice(currentPageIndex + 1).find(page => page.type === 'story' && page.image)?.image,
    [currentBook, currentPageIndex],
  );
  usePreloadImage(nextChapterImage);
  const isFinalChallengePage = currentPage?.type === 'final-challenge';
  // Pages slide the way the reader turns them (forward = towards the reading direction), like a book.
  const reduceMotion = useReducedMotion();
  const pageTurnRef = useRef({ index: currentPageIndex, dir: 1 });
  if (pageTurnRef.current.index !== currentPageIndex) {
    pageTurnRef.current = { index: currentPageIndex, dir: currentPageIndex > pageTurnRef.current.index ? 1 : -1 };
  }
  const pageShift = reduceMotion ? 0 : pageTurnRef.current.dir * (isRTL ? -1 : 1) * 28;
  const totalPages = currentBook?.pages.length || 0;
  const progress = totalPages > 0 ? (currentPageIndex + 1) / totalPages : 0;

  // A resumed position or a hand-typed link may point past the end of the book.
  useEffect(() => {
    if (!currentBook) return;
    setCurrentPageIndex(prev => Math.min(prev, Math.max(currentBook.pages.length - 1, 0)));
  }, [currentBook, currentPageIndex]);

  useEffect(() => {
    if (!selectedProphetId || !currentLevel || !currentPage) return;
    if (showSummary) {
      clearReaderPosition(selectedProphetId, currentLevel);
      return;
    }
    saveReaderPosition(selectedProphetId, currentLevel, { pageIndex: currentPageIndex, totalPages });
  }, [selectedProphetId, currentLevel, currentPage, currentPageIndex, totalPages, showSummary]);

  useEffect(() => {
    setMyWordsBook(selectedProphetId && currentLevel ? { storyId: selectedProphetId, level: currentLevel } : null);
  }, [selectedProphetId, currentLevel]);

  // --- Book progress: pages read and exercises done, stored per book and shared by the TOC, summary and home page ---
  const [bookProgress, setBookProgress] = useState<BookProgress | null>(null);

  useEffect(() => {
    if (!selectedProphetId || !currentLevel || !currentBookPair) {
      setBookProgress(null);
      return;
    }
    const saved = readBookProgress(selectedProphetId, currentLevel);
    const pages = currentBookPair.en.pages;
    const chaptersVisited = saved.readPages
      .map(index => pages[index])
      .filter(page => page?.type === 'story')
      .map(page => page.id);
    hydrateStats({ exercisesCompleted: saved.doneExercises, chaptersVisited });
    setBookProgress(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProphetId, currentLevel, currentBookPair]);

  useEffect(() => {
    if (!selectedProphetId || !currentLevel || !currentBook) return;
    setBookProgress(
      mergeBookProgress(selectedProphetId, currentLevel, {
        readPages: [currentPageIndex],
        totalPages: currentBook.pages.length,
      }),
    );
  }, [selectedProphetId, currentLevel, currentBook, currentPageIndex]);

  useEffect(() => {
    if (!selectedProphetId || !currentLevel || stats.exercisesCompleted.size === 0) return;
    setBookProgress(mergeBookProgress(selectedProphetId, currentLevel, { doneExercises: stats.exercisesCompleted }));
  }, [selectedProphetId, currentLevel, stats.exercisesCompleted]);

  // Seyahatname: a chapter's stamp is pressed when its Quick Challenge is done. Progress from before
  // (the first time a book is opened) is stamped quietly; a new stamp shows its moment.
  useEffect(() => {
    if (!selectedProphetId || !currentLevel || !bookProgress) return;
    const fresh = pressStamps(selectedProphetId, currentLevel, readBookProgress(selectedProphetId, currentLevel).doneExercises);
    if (fresh.length) setStampMoment({ storyId: selectedProphetId, level: currentLevel, chapter: fresh[fresh.length - 1] });
  }, [selectedProphetId, currentLevel, bookProgress]);

  // The moment belongs to the page where the chapter was finished: turning the page closes it.
  useEffect(() => {
    setStampMoment(null);
  }, [selectedProphetId, currentLevel, currentPageIndex]);

  // Links into the journal from deeper pages (the map's stamped places).
  useEffect(() => {
    const open = () => setIsJournalOpen(true);
    window.addEventListener('seyahatname:open', open);
    return () => window.removeEventListener('seyahatname:open', open);
  }, []);

  const openFromJournal = (target: OpenBookTarget) => {
    setIsJournalOpen(false);
    if (target.storyId === selectedProphetId && target.level === currentLevel) {
      setShowSummary(false);
      if (typeof target.pageIndex === 'number') setCurrentPageIndex(target.pageIndex);
      return;
    }
    handleStartJourney(target.storyId, target.level, { pageIndex: target.pageIndex ?? 0 });
  };

  const readPageSet = useMemo(() => new Set(bookProgress?.readPages ?? []), [bookProgress]);
  const doneExerciseSet = useMemo(() => new Set(bookProgress?.doneExercises ?? []), [bookProgress]);
  const allDone = (ids: string[] | undefined) =>
    Boolean(ids && ids.length > 0 && ids.every(id => doneExerciseSet.has(id)));

  // --- URL hash: one entry per page, so the browser back button and reload keep the reader's place ---
  const currentRoute = useMemo<HashRoute | null>(
    () => (selectedProphetId && currentLevel ? { storyId: selectedProphetId, level: currentLevel, pageIndex: currentPageIndex } : null),
    [selectedProphetId, currentLevel, currentPageIndex],
  );
  const currentRouteRef = useRef(currentRoute);
  currentRouteRef.current = currentRoute;

  useEffect(() => {
    const next = formatHashRoute(currentRoute);
    const hash = window.location.hash;
    if (hash === next || (!currentRoute && isHomeHash(hash))) return;
    window.location.hash = next;
  }, [currentRoute]);

  const currentCollection = currentDefinition?.collection ?? null;

  const currentTeacherGuide = teacherGuideData
    ? (language === 'ar' ? teacherGuideData.ar : teacherGuideData.en)
    : null;
  const currentSelfStudyGuide = selfStudyGuideData
    ? (language === 'ar' ? selfStudyGuideData.ar : selfStudyGuideData.en)
    : null;

  // The Teacher Guide section for a story chapter: matched by the chapter number in its title, else by position.
  const lessonSectionFor = (page: PageData) => {
    const sections = currentTeacherGuide?.content;
    if (!sections?.length || page.type !== 'story') return undefined;
    const storyPages = (currentBook?.pages ?? []).filter(item => item.type === 'story');
    const chapterNo = storyPages.findIndex(item => item.id === page.id) + 1;
    if (chapterNo < 1) return undefined;
    return sections.find(section => Number(section.chapter.match(/\d+/)?.[0]) === chapterNo) ?? sections[chapterNo - 1];
  };

  useEffect(() => {
    setTeacherGuideData(null);
    setSelfStudyGuideData(null);
    setIsTeacherGuideOpen(false);
    setIsSelfStudyOpen(false);
  }, [currentDefinition?.storyId, currentLevel]);

  useEffect(() => {
    if (!currentDefinition || !currentLevel || !currentBookPair) return;

    const timer = window.setTimeout(() => {
      loadTeacherGuideData(currentDefinition.storyId, currentLevel)
        .then(setTeacherGuideData)
        .catch(() => undefined);
      loadSelfStudyGuideData(currentDefinition.storyId, currentLevel)
        .then(setSelfStudyGuideData)
        .catch(() => undefined);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [currentDefinition?.storyId, currentLevel, currentBookPair]);

  const openTeacherGuide = () => {
    if (!currentDefinition || !currentLevel) return;
    setIsMenuOpen(false);
    if (teacherGuideData) {
      setIsTeacherGuideOpen(true);
      return;
    }
    loadTeacherGuideData(currentDefinition.storyId, currentLevel)
      .then(data => {
        setTeacherGuideData(data);
        setIsTeacherGuideOpen(true);
      })
      .catch(error => console.error('[Teacher Guide] Unable to load guide data.', error));
  };

  // The home page's Teacher Guide shortcut opens the book and then its guide once the book is in.
  const [pendingTeacherGuide, setPendingTeacherGuide] = useState(false);
  useEffect(() => {
    if (!pendingTeacherGuide || !currentBook || !currentDefinition || !currentLevel) return;
    setPendingTeacherGuide(false);
    openTeacherGuide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTeacherGuide, currentBook, currentDefinition, currentLevel]);

  const handleOpenTeacherGuideFromHome = (prophetId: string, level: Level) => {
    setPendingTeacherGuide(true);
    handleStartJourney(prophetId, level);
  };

  // "Save this book offline": every image and audio file of both language editions, stored by the service worker.
  const [offlineSaveState, setOfflineSaveState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  useEffect(() => { setOfflineSaveState('idle'); }, [currentBookPair]);
  const offlineBookSizeMb = selectedProphetId && currentLevel ? OFFLINE_BOOK_SIZE_MB[`${selectedProphetId}:${currentLevel}`] : undefined;
  const offlineBookHasAudio = Boolean(currentBookPair?.en.pages.some(page => page.type === 'story' && page.audioUrl));
  const canSaveOffline = import.meta.env.PROD && typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const handleSaveOffline = () => {
    if (!currentBookPair || offlineSaveState === 'saving') return;
    const urls = new Set<string>();
    [currentBookPair.en, currentBookPair.ar].forEach(book => {
      book.pages.forEach(page => {
        // Only story pages show pictures; learning pages carry unused (some dead) image links.
        if (page.type !== 'story') return;
        if (page.image) urls.add(appImage(page.image));
        if (page.audioUrl) urls.add(page.audioUrl);
      });
    });
    setOfflineSaveState('saving');
    saveBookOffline([...urls])
      .then(result => setOfflineSaveState(result.failed === 0 ? 'saved' : 'failed'))
      .catch(() => setOfflineSaveState('failed'));
  };

  const openSelfStudyGuide = () => {
    if (!currentDefinition || !currentLevel) return;
    setIsMenuOpen(false);
    if (selfStudyGuideData) {
      setIsSelfStudyOpen(true);
      return;
    }
    loadSelfStudyGuideData(currentDefinition.storyId, currentLevel)
      .then(data => {
        setSelfStudyGuideData(data);
        setIsSelfStudyOpen(true);
      })
      .catch(error => console.error('[Self-Study Guide] Unable to load guide data.', error));
  };

  // Dynamic UI theme classes based on active collection
  // One palette for the reader chrome. The collection only changes the accent tokens the root
  // publishes (see collectionVisuals[...].readerTokens); the class names never change.
  const themeClasses = useMemo(() => ({
    headerBg: "bg-chrome/85 border-accent/20",
    headerSubtitle: "text-accent",
    buttonSec: "bg-accent/10 border-accent/30 text-parchment hover:bg-accent/20",
    progressTrack: "bg-accent/10",
    progressBar: "bg-accent",
    percentageText: "text-accent/80",
    mainBg: !showSummary && (currentLevel === 'A2' || currentLevel === 'B1' ? "bg-page/95" : "bg-page-deep/95"),
    cardBorder: "border-accent/20",
    navButton: "bg-accent-strong border-accent text-white hover:brightness-110 hover:scale-110",
    goldText: "text-accent",
    quoteLine: "via-accent/40",
    // Side-menu specific
    menuOverlayBg: "bg-chrome/60",
    menuBg: "bg-chrome-menu/95",
    menuBorder: "border-accent/10",
    menuAccentText: "text-accent",
    menuHoverBg: "hover:bg-accent/10",
    menuSectionHeader: "text-accent/40",
    menuItemActive: "bg-accent-strong text-white",
    menuItemHover: "hover:bg-accent/5 text-parchment/60",
    menuCloseButton: "text-accent/40 hover:text-accent",
    menuLogoContainer: "border-accent/20 bg-accent/10 shadow-[0_2px_10px_rgba(0,0,0,0.2)]",
  }), [currentLevel, showSummary]);

  // The collection's tokens go on <html>, so portaled tooltips and overlays read the same variables as the reader.
  useEffect(() => {
    const root = document.documentElement;
    const variables = readerTokenVariables(collectionVisuals[currentCollection ?? 'prophets'].readerTokens);
    Object.entries(variables).forEach(([name, value]) => root.style.setProperty(name, value));
    root.setAttribute('data-collection', currentCollection ?? 'prophets');
    return () => {
      Object.keys(variables).forEach(name => root.style.removeProperty(name));
      root.removeAttribute('data-collection');
    };
  }, [currentCollection]);

  // One name per book everywhere: the same translated story name the library shows.
  const currentBookTitle = useMemo(() => {
    if (!currentDefinition) return currentBook?.title ?? '';
    const key = `prophet.${currentDefinition.storyId}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
    return getStoryMeta(currentDefinition.storyId)?.name ?? currentBook?.title ?? '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBook, currentDefinition, language]);

  // --- Handlers ---
  const handleStartJourney = (
    prophetId: string,
    level: Level,
    options?: { resume?: boolean; pageIndex?: number },
  ) => {
    setSelectedProphetId(prophetId);
    setCurrentLevel(level);
    setCurrentPageIndex(
      options?.pageIndex ?? (options?.resume ? readReaderPosition(prophetId, level)?.pageIndex ?? 0 : 0),
    );
    setUserAnswers({});
    setIsMenuOpen(false);
    setShowSummary(false);
    resetStats();
  };


  const handleReturnToLibrary = () => {
    setSelectedProphetId(null);
    setCurrentLevel(null);
    setCurrentPageIndex(0);
    setIsMenuOpen(false);
    setShowSummary(false);
    resetStats();
  };

  const handleReadAgain = () => {
    setCurrentPageIndex(0);
    setUserAnswers({});
    setShowSummary(false);
    resetStats();
  };

  const handleReviewStory = () => {
    setShowSummary(false);
  };

  // Moving on with the chapter's Quick Challenge still open: one reminder per chapter, then the reader decides.
  const [isQuickReminderOpen, setIsQuickReminderOpen] = useState(false);
  const remindedPagesRef = useRef<Set<string>>(new Set());

  const advancePage = () => {
    setIsQuickReminderOpen(false);
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const handleNextPage = () => {
    if (isQuickReminderOpen) {
      advancePage();
      return;
    }
    const quickExercise = currentPage?.type === 'story' && !storyMode ? currentPage.exercises?.[0] : undefined;
    const reminderKey = `${selectedProphetId}:${currentLevel}:${currentPage?.id}`;
    if (
      quickExercise &&
      currentPageIndex < totalPages - 1 &&
      !doneExerciseSet.has(quickExercise.id) &&
      !remindedPagesRef.current.has(reminderKey)
    ) {
      remindedPagesRef.current.add(reminderKey);
      setIsQuickReminderOpen(true);
      return;
    }
    advancePage();
  };

  const handleGoToQuickChallenge = () => {
    setIsQuickReminderOpen(false);
    window.dispatchEvent(new Event('reader:focus-quick-challenge'));
  };

  useEffect(() => {
    setIsQuickReminderOpen(false);
  }, [currentPageIndex, selectedProphetId, currentLevel]);

  useEffect(() => {
    if (!isQuickReminderOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsQuickReminderOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isQuickReminderOpen]);

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    const applyHash = () => {
      const route = parseHashRoute(window.location.hash);
      const current = currentRouteRef.current;
      if (!route) {
        if (current) handleReturnToLibrary();
        return;
      }
      if (current && current.storyId === route.storyId && current.level === route.level) {
        if (current.pageIndex !== route.pageIndex) setCurrentPageIndex(route.pageIndex);
        setShowSummary(false);
        return;
      }
      handleStartJourney(route.storyId, route.level, { pageIndex: route.pageIndex });
    };
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in form controls
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl && (
          activeEl.tagName === 'INPUT' || 
          activeEl.tagName === 'TEXTAREA' || 
          activeEl.isContentEditable
        )
      ) {
        return;
      }

      // Only navigate if a story is active, no overlays are open, and summary is not shown
      if (!selectedProphetId || showSummary || isFinalChallengePage) return;
      if (isMenuOpen || isAboutOpen || isHowToUseOpen || isUsageGuideOpen || isMyWordsOpen || isJournalOpen || isTeacherGuideOpen || isSelfStudyOpen || isQuickTOCOpen || isReaderSettingsOpen) return;

      if (e.key === 'ArrowRight') {
        if (language === 'ar') {
          handlePrevPage();
        } else {
          handleNextPage();
        }
      } else if (e.key === 'ArrowLeft') {
        if (language === 'ar') {
          handleNextPage();
        } else {
          handlePrevPage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    selectedProphetId,
    showSummary,
    isMenuOpen,
    isAboutOpen,
    isHowToUseOpen,
    isUsageGuideOpen,
    isMyWordsOpen,
    isJournalOpen,
    isTeacherGuideOpen,
    isSelfStudyOpen,
    isQuickTOCOpen,
    isReaderSettingsOpen,
    currentPageIndex,
    totalPages,
    language,
    isFinalChallengePage
  ]);

  // A horizontal swipe on a touch screen turns the page; sliders, inputs and open overlays are left alone.
  const swipeStartRef = useRef<{ x: number; y: number; ignore: boolean } | null>(null);
  // A swipe that starts on a row that scrolls sideways (filter chips, shelves, maps) scrolls that row, never the page.
  const startsInSideScroller = (target: HTMLElement | null) => {
    for (let el = target; el && el !== document.body; el = el.parentElement) {
      if (el.scrollWidth > el.clientWidth + 2 && /(auto|scroll)/.test(getComputedStyle(el).overflowX)) return true;
    }
    return false;
  };
  const handleSwipeStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const target = e.target as HTMLElement | null;
    const ignore =
      !touch ||
      Boolean(target?.closest('input, textarea, select, [role="slider"], [draggable="true"], [data-no-swipe]')) ||
      startsInSideScroller(target) ||
      showSummary || isFinalChallengePage ||
      isMenuOpen || isAboutOpen || isHowToUseOpen || isUsageGuideOpen || isMyWordsOpen || isJournalOpen || isTeacherGuideOpen || isSelfStudyOpen || isQuickTOCOpen || isReaderSettingsOpen;
    swipeStartRef.current = touch ? { x: touch.clientX, y: touch.clientY, ignore } : null;
  };
  const handleSwipeEnd = (e: React.TouchEvent) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    const touch = e.changedTouches[0];
    if (!start || start.ignore || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 90 || Math.abs(dy) > 50 || Math.abs(dx) < Math.abs(dy) * 2) return;
    const forward = isRTL ? dx > 0 : dx < 0;
    if (forward) handleNextPage();
    else handlePrevPage();
  };


  const handleAnswer = (id: string, answer: boolean) => {
    setUserAnswers(prev => ({ ...prev, [id]: answer }));
  };

  // --- Render Helpers ---
  if (!isAuthenticated) {
    return <AccessGate onOpen={() => setIsAuthenticated(true)} />;
  }

  if (!role) {
    return <RolePicker />;
  }

  if (!selectedProphetId || !currentLevel) {
    return <HomePage onStart={handleStartJourney} onOpenTeacherGuide={isTeacher ? handleOpenTeacherGuideFromHome : undefined} />;
  }

  if (bookLoadError) {
    return (
      <div className="min-h-screen bg-wood page-texture flex items-center justify-center p-6 text-center" role="alert">
        <div className="max-w-lg rounded-2xl border border-red-400/30 bg-black/30 p-8 text-parchment shadow-2xl">
          <h2 className="font-display text-xl text-red-300">Book could not be loaded</h2>
          <p className="mt-3 font-serif text-sm text-parchment/70">{bookLoadError.message}</p>
          <button onClick={handleReturnToLibrary} className="mt-6 rounded-xl border border-gold/40 px-5 py-2 font-display text-sm text-gold">
            {t('nav.returnToLibrary')}
          </button>
        </div>
      </div>
    );
  }

  if (isBookLoading || !currentBook) {
    return (
      <div className="min-h-screen bg-wood page-texture flex items-center justify-center" role="status" aria-live="polite">
        <LoaderCircle className="h-8 w-8 animate-spin text-gold" aria-hidden="true" />
        <span className="sr-only">Loading book</span>
      </div>
    );
  }

  const renderPage = () => {
    if (showSummary) {
      return (
        <Suspense fallback={null}>
          <SummaryDashboard 
            bookData={currentBook!} 
            onFinish={handleReturnToLibrary}
            onReviewStory={handleReviewStory}
            onReadAgain={handleReadAgain}
            onStartJourney={handleStartJourney}
            onOpenJournal={() => setIsJournalOpen(true)}
          />
        </Suspense>
      );
    }

    if (!currentPage) return null;

    switch (currentPage.type) {
      case 'story':
        if (storyMode) {
          return (
            <StoryFlow
              pages={currentBook?.pages || []}
              currentIndex={currentPageIndex}
              onVisibleIndex={index => setCurrentPageIndex(index)}
              onOpenPage={index => setCurrentPageIndex(index)}
              isDyslexic={isDyslexic}
              showHighlights={showHighlights}
              followAlong={followAlong}
              fontSize={(currentBook?.baseFontSize || 12) * readerScale * (isLargeDesktop ? 1.15 : 1) * (classMode ? 1.3 : 1)}
              level={currentLevel}
              storyId={currentDefinition?.storyId}
              collectionId={currentCollection || 'prophets'}
            />
          );
        }
        return (
          <StoryPage 
            page={currentPage} 
            allPages={currentBook?.pages || []}
            currentIndex={currentPageIndex}
            isDyslexic={isDyslexic} 
            showHighlights={showHighlights}
            followAlong={followAlong}
            fontSize={(currentBook?.baseFontSize || 12) * readerScale * (isLargeDesktop ? 1.15 : 1) * (classMode ? 1.3 : 1)}
            level={currentLevel}
            storyId={currentDefinition?.storyId}
            collectionId={currentCollection || 'prophets'}
            lessonSection={isTeacher ? lessonSectionFor(currentPage) : undefined}
          />
        );
      case 'map':
        return (
          <Suspense fallback={null}>
            <StoryMapPage page={currentPage} storyId={currentDefinition?.storyId} level={currentLevel} />
          </Suspense>
        );
      case 'places':
        return (
          <Suspense fallback={null}>
            <PlacesPage
              page={currentPage}
              pages={currentBook?.pages ?? []}
              onOpenPage={index => setCurrentPageIndex(index)}
            />
          </Suspense>
        );
      case 'glossary':
        return (
          <MasterGlossary
            bookData={currentBook}
            page={currentPage}
            collectionId={currentCollection || 'prophets'}
          />
        );
      case 'final-challenge':
        return (
          <Suspense fallback={null}>
            <FinalChallenge bookData={currentBook!} onComplete={() => setShowSummary(true)} />
          </Suspense>
        );
      default:
        return (
          <ExercisePage 
            page={currentPage} 
            userAnswers={userAnswers} 
            handleAnswer={handleAnswer} 
            level={currentLevel}
            collectionId={currentCollection || 'prophets'}
            onNextPage={currentPageIndex < totalPages - 1 ? handleNextPage : undefined}
            nextPageLabel={currentBook.pages[currentPageIndex + 1]?.title}
            onReviewGlossary={
              currentPage.type === 'vocabulary-match'
                ? () => {
                    const glossaryIndexes = currentBook.pages
                      .map((page, index) => page.type === 'glossary' ? index : -1)
                      .filter(index => index >= 0);
                    const targetIndex = glossaryIndexes[glossaryIndexes.length - 1];
                    if (typeof targetIndex === 'number') setCurrentPageIndex(targetIndex);
                  }
                : undefined
            }
          />
        );
    }
  };

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'}
      lang={language}
      data-reader-wide={isWideView ? 'true' : undefined}
      className={cn(
        "h-dvh max-h-dvh bg-wood flex flex-col relative overflow-hidden page-texture",
        isDyslexic && language !== 'ar' && "font-dyslexic-mode"
      )}
    >
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Reader Header */}
      {!showSummary && (
        <header className={cn(
          "reader-header relative z-50 min-h-12 sm:min-h-16 px-2 sm:px-5 md:px-8 flex items-center transition-colors duration-500 shrink-0",
          themeClasses.headerBg
        )}>
          <div className="relative z-50 flex w-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="touch-target flex items-center justify-center rounded-full text-parchment transition-colors hover:bg-white/10"
                title={t('nav.menu')}
                aria-label={t('nav.menu')}
                aria-expanded={isMenuOpen}
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              <div className="min-w-0">
                <h1
                  className="clip-room max-w-[min(15rem,58vw)] truncate font-display text-[14px] font-semibold leading-tight tracking-[-0.01em] text-parchment sm:max-w-xs sm:text-[15px] md:max-w-md md:text-[17px] xl:max-w-[20rem] 2xl:max-w-md"
                  title={currentBookTitle}
                >
                  <span className="sm:hidden">{currentPage?.title || currentBookTitle}</span>
                  <span className="hidden sm:inline">{currentBookTitle}</span>
                </h1>
                <span className={cn(
                  "ui-label mt-0.5 block truncate sm:text-xs max-sm:hidden",
                  themeClasses.headerSubtitle
                )}>
                  {t('nav.level')} {currentLevel} · {t('nav.page')} {formatNumber(currentPageIndex + 1)}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <ReaderSettings
                open={isReaderSettingsOpen}
                setOpen={setIsReaderSettingsOpen}
                language={language}
                isRTL={isRTL}
                readerScale={readerScale}
                setReaderScale={setReaderScale}
                isDyslexic={isDyslexic}
                setIsDyslexic={setIsDyslexic}
                showHighlights={showHighlights}
                setShowHighlights={setShowHighlights}
                followAlong={followAlong}
                setFollowAlong={setFollowAlong}
                storyMode={storyMode}
                setStoryMode={setStoryMode}
                isWideView={isWideView}
                setIsWideView={setIsWideView}
                isTeacher={isTeacher}
                classMode={classMode}
                setClassMode={setClassMode}
                theme={themeClasses}
              />

              <FullscreenToggle className={themeClasses.buttonSec} />

              {isFinalChallengePage ? (
                <span
                  className={cn(
                    "min-w-11 h-11 px-3 flex items-center justify-center rounded-full border font-display text-[11px] font-semibold uppercase",
                    themeClasses.buttonSec
                  )}
                  title={language === 'ar' ? 'لغة التحدي ثابتة أثناء المحاولة' : 'Challenge language is locked during the attempt'}
                  aria-label={language === 'ar' ? 'لغة التحدي: العربية' : 'Challenge language: English'}
                >
                  {language.toUpperCase()}
                </span>
              ) : isEnglishOnlyBook ? null : (
                <>
                  <button
                    type="button"
                    onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                    className={cn(
                      "ui-control ui-label hidden",
                      themeClasses.buttonSec
                    )}
                    aria-label={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
                  >
                    {language === 'en' ? 'AR' : 'EN'}
                  </button>

                  <div className="hidden shrink-0 sm:block">
                    <LanguageToggle />
                  </div>
                </>
              )}

              <button 
                onClick={handleReturnToLibrary}
                className={cn(
                  "ui-control max-sm:hidden",
                  themeClasses.buttonSec
                )}
                title={t('nav.returnToLibrary')}
                aria-label={t('nav.returnToLibrary')}
              >
                <Home className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          <div
            className="pointer-events-none absolute left-1/2 top-1/2 hidden w-[540px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center xl:flex 2xl:w-[520px]"
            aria-label="Surah Yusuf 12:111"
          >
            <p
              dir="rtl"
              lang="ar"
              className={cn("text-[13px] font-semibold leading-tight 2xl:text-[15px]", themeClasses.goldText)}
              style={{ fontFamily: 'Arakom, sans-serif' }}
            >
              ﴿لَقَدْ كَانَ فِي قَصَصِهِمْ عِبْرَةٌ لِأُولِي الْأَلْبَابِ﴾
            </p>
            {language === 'ar' ? (
              <p dir="rtl" lang="ar" className="mt-0.5 text-xs font-medium leading-tight text-parchment/62">
                سُورَةُ يُوسُف، الآيَة ١١١
              </p>
            ) : (
              <p
                dir="ltr"
                lang="en"
                className="mt-0.5 whitespace-nowrap text-xs font-medium leading-tight text-parchment/70"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                “In their stories there is truly a lesson for people of understanding.”
                <span className="ms-1 whitespace-nowrap text-parchment/65">Yusuf 12:111</span>
              </p>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.06]" aria-hidden="true">
            <motion.div
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn("h-full", themeClasses.progressBar)}
              style={{ marginInlineStart: isRTL ? 'auto' : 0 }}
            />
          </div>

          {isReaderSettingsOpen && (
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label={language === 'ar' ? 'إغلاق إعدادات القصة' : 'Close story settings'}
              onClick={() => setIsReaderSettingsOpen(false)}
            />
          )}
        </header>
      )}

      {/* Main Content Area */}
      <main
        id="main"
        className="flex-1 relative z-10 flex flex-col overflow-hidden min-h-0"
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
      >
        <div className={cn(
          "flex-1 w-full relative page-texture transition-all duration-500 flex flex-col overflow-hidden min-h-0",
          themeClasses.mainBg
        )}>
          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            <div className={cn(
              "w-full max-w-[1700px] desk:max-w-[1900px] wide:max-w-none mx-auto h-full flex flex-col min-h-0",
              !showSummary && "p-3 sm:p-5 md:p-7 lg:py-7 lg:px-10 xl:px-14 2xl:px-18 wide:lg:px-6 wide:xl:px-8 wide:2xl:px-10"
            )}>
              <AnimatePresence mode="wait" custom={pageShift}>
                <motion.div
                  key={showSummary ? 'summary' : storyMode && currentPage?.type === 'story' ? `${currentLevel}-story-flow` : `${currentLevel}-${currentPageIndex}`}
                  custom={pageShift}
                  variants={{
                    enter: (shift: number) => ({ opacity: 0, x: showSummary ? 0 : shift, scale: showSummary && !reduceMotion ? 1.03 : 1 }),
                    center: { opacity: 1, x: 0, scale: 1 },
                    exit: (shift: number) => ({ opacity: 0, x: showSummary ? 0 : -shift, scale: 1 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.26, ease: [0.22, 0.8, 0.3, 1] }}
                  className="h-full flex flex-col overflow-hidden min-h-0"
                >
                  <Suspense fallback={null}>{renderPage()}</Suspense>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Reader Navigation Dock */}
      {!showSummary && !isFinalChallengePage && (
        <footer className={cn(
          "reader-footer relative z-50 min-h-12 sm:min-h-14 px-2.5 sm:px-5 md:px-8 grid grid-cols-[1fr_auto_1fr] items-center gap-2 transition-colors duration-500 shrink-0",
          themeClasses.headerBg
        )}>
          <div className="relative flex min-w-0 items-center justify-start">
            <button 
              onClick={() => setIsQuickTOCOpen(prev => !prev)}
              className="touch-target flex max-w-full items-center gap-1.5 rounded-xl px-2 text-parchment/80 sm:gap-2 sm:px-2.5 transition-colors hover:bg-white/[0.08] hover:text-parchment"
              title={t('nav.tableOfContents')}
              aria-label={t('nav.tableOfContents')}
              aria-expanded={isQuickTOCOpen}
            >
              <BookMarked className={cn(themeClasses.goldText, "h-4 w-4 shrink-0")} />
              <span className="truncate font-display text-[12px] font-semibold sm:text-[13px] md:text-[14px]">
                <span className="hidden sm:inline">{t('nav.page')} </span>
                {formatNumber(currentPageIndex + 1)} / {formatNumber(totalPages)}
              </span>
              <ChevronUp className={cn("hidden h-3 w-3 shrink-0 opacity-45 transition-transform min-[360px]:block", isQuickTOCOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isQuickTOCOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label={language === 'ar' ? 'إغلاق الفهرس' : 'Close table of contents'}
                    onClick={() => setIsQuickTOCOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={cn(
                      "absolute bottom-[calc(100%+0.7rem)] z-50 w-[min(25rem,calc(100vw-1.5rem))] rounded-2xl border p-3 shadow-2xl backdrop-blur-2xl sm:p-4",
                      themeClasses.menuBg,
                      themeClasses.menuBorder,
                      isRTL ? "right-0" : "left-0"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-4 px-1">
                      <h4 className={cn("font-display text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.14em]", themeClasses.goldText)}>
                        {t('nav.tableOfContents')}
                      </h4>
                      <span className="font-display text-[11px] sm:text-[12px] text-white/50">
                        {formatNumber(totalPages)} {language === 'ar' ? (totalPages === 2 ? 'صفحتان' : totalPages >= 3 && totalPages <= 10 ? 'صفحات' : 'صفحة') : "pages"}
                      </span>
                    </div>

                    <div className="max-h-[min(58vh,24rem)] space-y-1 overflow-y-auto pe-1 custom-scrollbar">
                      {currentBook?.pages.map((page, idx) => {
                        const isActive = currentPageIndex === idx;
                        const isStorySection = page.type === 'story' || page.type === 'map';
                        const prevPage = idx > 0 ? currentBook.pages[idx - 1] : null;
                        const prevIsStorySection = prevPage ? prevPage.type === 'story' || prevPage.type === 'map' : null;
                        const sectionHeading = prevIsStorySection === isStorySection
                          ? null
                          : (isStorySection ? t('nav.tocStory') : t('nav.tocPractice'));
                        return (
                          <React.Fragment key={page.id}>
                          {sectionHeading && (
                            <div
                              role="presentation"
                              className={cn(
                                "flex items-center gap-3 px-1 pb-1 font-display text-[11px] font-semibold uppercase tracking-[0.16em]",
                                idx === 0 ? "pt-0.5" : "pt-4",
                                isStorySection ? "text-white/45" : themeClasses.goldText
                              )}
                            >
                              <span>{sectionHeading}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            aria-current={isActive ? 'page' : undefined}
                            onClick={() => {
                              setCurrentPageIndex(idx);
                              setIsQuickTOCOpen(false);
                            }}
                            className={cn(
                              "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-start transition-colors",
                              isRTL && "text-right",
                              isActive
                                ? themeClasses.menuItemActive
                                : "text-parchment/68 hover:bg-white/[0.06] hover:text-white"
                            )}
                          >
                            <span
                              className={cn(
                                "w-8 shrink-0 text-center font-display text-[11px] sm:text-[12px] font-semibold",
                                readPageSet.has(idx) && !isActive ? "text-emerald-300" : "opacity-65"
                              )}
                              aria-label={readPageSet.has(idx) ? (language === 'ar' ? 'مقروءة' : 'Read') : undefined}
                            >
                              {readPageSet.has(idx) && !isActive ? '✓' : page.type === 'map' ? <MapPin size={15} className="mx-auto" aria-label={t('map.label')} /> : formatNumber(idx + 1)}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-display text-[13px] font-medium sm:text-[14px]">
                              {page.title}
                            </span>
                            {allDone(page.exercises?.map(exercise => exercise.id)) && (
                              <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-display text-[11px] font-semibold text-emerald-300">
                                {page.type === 'story' ? 'QC ✓' : '✓'}
                              </span>
                            )}
                            {allDone(page.languageFocusExercises?.map(exercise => exercise.id)) && (
                              <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-display text-[11px] font-semibold text-emerald-300">
                                LF ✓
                              </span>
                            )}
                            {isActive && (
                              <span className={cn("h-2 w-2 shrink-0 rounded-full", themeClasses.progressBar)} />
                            )}
                          </button>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative flex items-center gap-2">
            <AnimatePresence>
              {isQuickReminderOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  role="dialog"
                  aria-labelledby="quick-reminder-title"
                  data-quick-reminder
                  className="absolute bottom-[calc(100%+10px)] left-1/2 z-50 w-[min(300px,calc(100vw-24px))] -translate-x-1/2 rounded-panel bg-white p-4 text-start shadow-[0_18px_48px_rgba(0,0,0,0.28)] ring-1 ring-black/10"
                >
                  <p id="quick-reminder-title" className="font-display text-[14px] font-semibold text-wood">{t('nav.quickChallengeFirst')}</p>
                  <p className="mt-1 font-serif text-[13px] leading-snug text-wood/70">{t('nav.quickChallengeFirstHint')}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleGoToQuickChallenge}
                      className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-brand-700 px-4 font-display text-[12px] font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                    >
                      {t('nav.goToQuickChallenge')}
                    </button>
                    <button
                      type="button"
                      onClick={advancePage}
                      className="inline-flex min-h-10 items-center justify-center rounded-full px-4 font-display text-[12px] font-semibold text-wood/70 ring-1 ring-black/10 transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      {t('nav.skipForNow')}
                    </button>
                  </div>
                  <span aria-hidden="true" className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white ring-1 ring-black/10" />
                </motion.div>
              )}
            </AnimatePresence>
            <button 
              onClick={handlePrevPage}
              disabled={currentPageIndex === 0}
              className={cn(
                "ui-control disabled:cursor-not-allowed disabled:opacity-25 active:scale-95",
                themeClasses.buttonSec
              )}
              title={t('nav.back')}
              aria-label={t('nav.back')}
            >
              <ChevronLeft className={cn("h-5 w-5", isRTL && "rotate-180")} />
            </button>

            <button 
              onClick={handleNextPage}
              disabled={currentPageIndex === totalPages - 1}
              className={cn(
                "ui-control disabled:cursor-not-allowed disabled:opacity-25 active:scale-95",
                themeClasses.navButton
              )}
              title={t('nav.next')}
              aria-label={t('nav.next')}
            >
              <ChevronRight className={cn("h-5 w-5", isRTL && "rotate-180")} />
            </button>
          </div>

          <div className="hidden min-w-0 items-center justify-end md:flex">
            <span className="truncate font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-parchment/55 lg:text-[12px]">
              {currentCollection === 'history' ? t('home.collection2') : currentCollection === 'turkish' ? t('home.collection3') : t('home.collection1')}
            </span>
          </div>
        </footer>
      )}

      {/* Reader Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("fixed inset-0 z-[200] backdrop-blur-sm", themeClasses.menuOverlayBg)}
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.aside
              initial={isPhone ? { y: '100%' } : { x: isRTL ? 340 : -340 }}
              animate={isPhone ? { y: 0 } : { x: 0 }}
              exit={isPhone ? { y: '100%' } : { x: isRTL ? 340 : -340 }}
              transition={isPhone ? { type: 'spring', stiffness: 380, damping: 38 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "flex flex-col overflow-y-auto overscroll-contain p-5 shadow-2xl backdrop-blur-2xl sm:p-7",
                isPhone
                  ? "absolute inset-x-0 bottom-0 max-h-[88svh] w-full rounded-t-[24px] border-t pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
                  : "h-full w-[min(22rem,88vw)] border-r",
                !isPhone && isRTL && "ml-auto border-l border-r-0",
                themeClasses.menuBg,
                themeClasses.menuBorder
              )}
              onClick={e => e.stopPropagation()}
              ref={menuRef}
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.mainMenu')}
              {...(isPhone ? menuSheet.sheet : {})}
            >
              {isPhone && (
                <div className="-mx-5 -mt-3 mb-1 flex shrink-0 cursor-grab justify-center pb-3 pt-3" {...menuSheet.grip}>
                  <span className="block h-1 w-10 rounded-full bg-white/30" aria-hidden="true" />
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className={cn("font-display text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.16em] max-sm:hidden", themeClasses.menuAccentText)}>
                    {t('nav.mainMenu')}
                  </p>
                  <h3 className="mt-1 truncate font-display text-lg font-semibold text-parchment">
                    {currentBookTitle}
                  </h3>
                  <p className="mt-1 text-[13px] text-parchment/55">
                    {t('nav.level')} {currentLevel} · {t('nav.page')} {formatNumber(currentPageIndex + 1)} / {formatNumber(totalPages)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className={cn("touch-target flex items-center justify-center rounded-full transition-colors hover:bg-white/[0.06]", themeClasses.menuCloseButton)}
                  aria-label={t('nav.closeMenu')}
                >
                  <X size={22} />
                </button>
              </div>

              <div className="mt-7 space-y-2">
                <button 
                  onClick={handleReturnToLibrary}
                  className={cn("touch-target flex w-full items-center gap-4 rounded-xl px-4 text-parchment transition-colors", themeClasses.menuHoverBg)}
                >
                  <Home size={21} className={themeClasses.menuAccentText} />
                  <span className="font-display text-[14px] sm:text-[15px] font-semibold">{t('nav.libraryHome')}</span>
                </button>
                {/* Phones: the language switch lives here instead of the crowded header. */}
                {isPhone && !isFinalChallengePage && !isEnglishOnlyBook && (
                  <button
                    type="button"
                    onClick={() => { setLanguage(language === 'en' ? 'ar' : 'en'); setIsMenuOpen(false); }}
                    className={cn("touch-target flex w-full items-center gap-4 rounded-xl px-4 text-parchment transition-colors", themeClasses.menuHoverBg)}
                  >
                    <span className={cn("flex h-[21px] min-w-[21px] items-center justify-center font-display text-[12px] font-bold", themeClasses.menuAccentText)} aria-hidden="true">{language === 'en' ? 'ع' : 'EN'}</span>
                    <span className="font-display text-[14px] font-semibold" lang={language === 'en' ? 'ar' : 'en'} dir={language === 'en' ? 'rtl' : 'ltr'}>{language === 'en' ? 'اقرأ بالعربية' : 'Read in English'}</span>
                  </button>
                )}
              </div>

              <div className="mt-7">
                <h4 className={cn("px-4 font-display text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.16em]", themeClasses.menuSectionHeader)}>
                  {t('nav.guidesResources')}
                </h4>

                <div className="mt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsHowToUseOpen(true);
                    }}
                    className={cn("touch-target flex w-full items-center gap-4 rounded-xl px-4 text-parchment transition-colors", themeClasses.menuHoverBg)}
                    data-how-to-use-link
                  >
                    <HelpCircle size={21} className={themeClasses.menuAccentText} />
                    <span className="font-display text-[14px] sm:text-[15px] font-semibold">{language === 'ar' ? 'كَيْفَ تَسْتَخْدِمُ هٰذَا الكِتَابَ' : 'How to use this book'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsUsageGuideOpen(true);
                    }}
                    className={cn("touch-target flex w-full items-center gap-4 rounded-xl px-4 text-parchment transition-colors", themeClasses.menuHoverBg)}
                    data-usage-guide-link
                  >
                    <FileText size={21} className={themeClasses.menuAccentText} />
                    <span className="font-display text-[14px] sm:text-[15px] font-semibold">{USAGE_GUIDES[role ?? 'student'][language === 'ar' ? 'ar' : 'en'].title}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsMyWordsOpen(true);
                    }}
                    className={cn("touch-target flex w-full items-center gap-4 rounded-xl px-4 text-parchment transition-colors", themeClasses.menuHoverBg)}
                    data-my-words-link
                  >
                    <SECTION_ICONS.myWords.icon size={21} className={themeClasses.menuAccentText} />
                    <span className="font-display text-[14px] sm:text-[15px] font-semibold">{SECTION_ICONS.myWords[language === 'ar' ? 'ar' : 'en']}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsJournalOpen(true);
                    }}
                    className={cn("touch-target flex w-full items-center gap-4 rounded-xl px-4 text-parchment transition-colors", themeClasses.menuHoverBg)}
                    data-journal-link
                  >
                    <Scroll size={21} className={themeClasses.menuAccentText} />
                    <span className="font-display text-[14px] sm:text-[15px] font-semibold">{JOURNAL_COPY[language === 'ar' ? 'ar' : 'en'].name}</span>
                  </button>

                  {isTeacher ? (
                    <button 
                      onClick={openTeacherGuide}
                      className={cn("touch-target flex w-full items-center gap-4 rounded-xl px-4 text-parchment transition-colors", themeClasses.menuHoverBg)}
                    >
                      <SECTION_ICONS.teacherGuide.icon size={21} className={themeClasses.menuAccentText} />
                      <span className="font-display text-[14px] sm:text-[15px] font-semibold">{t('nav.teacherGuide')}</span>
                    </button>
                  ) : (
                    <button 
                      onClick={openSelfStudyGuide}
                      className={cn("touch-target flex w-full items-center gap-4 rounded-xl px-4 text-parchment transition-colors", themeClasses.menuHoverBg)}
                    >
                      <SECTION_ICONS.selfStudy.icon size={21} className={themeClasses.menuAccentText} />
                      <span className="font-display text-[14px] sm:text-[15px] font-semibold">{t('nav.selfStudyGuide')}</span>
                    </button>
                  )}

                  {canSaveOffline && (
                    <button
                      type="button"
                      onClick={handleSaveOffline}
                      disabled={offlineSaveState === 'saving' || offlineSaveState === 'saved'}
                      aria-live="polite"
                      data-save-offline={offlineSaveState}
                      className={cn("touch-target flex w-full items-center gap-4 rounded-xl px-4 text-parchment transition-colors disabled:opacity-80", themeClasses.menuHoverBg)}
                    >
                      {offlineSaveState === 'saved'
                        ? <CheckCircle size={21} className="text-emerald-400" />
                        : offlineSaveState === 'saving'
                          ? <LoaderCircle size={21} className={cn('animate-spin', themeClasses.menuAccentText)} />
                          : <Layers size={21} className={themeClasses.menuAccentText} />}
                      <span className="font-display text-[14px] sm:text-[15px] font-semibold">
                        {offlineSaveState === 'saved' ? t('nav.savedOffline')
                          : offlineSaveState === 'saving' ? t('nav.savingOffline')
                          : offlineSaveState === 'failed' ? t('nav.saveOfflineFailed')
                          : t('nav.saveOffline')}
                      </span>
                    </button>
                  )}
                  {canSaveOffline && offlineBookSizeMb && (
                    <p className="px-4 pb-1 pl-[3.3rem] rtl:pl-4 rtl:pr-[3.3rem] text-[12px] sm:text-[13px] leading-snug text-parchment/70" data-save-offline-hint>
                      {t(offlineBookHasAudio ? 'nav.saveOfflineHint' : 'nav.saveOfflineHintImages').replace('{size}', formatNumber(offlineBookSizeMb))}
                    </p>
                  )}
                </div>

                {selectedProphetId && currentLevel && !isHiddenStory(selectedProphetId) && (
                  <>
                    <h4 className={cn("mt-6 px-4 font-display text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.16em]", themeClasses.menuSectionHeader)}>
                      {BOOK_PDF_LABELS[language === 'ar' ? 'ar' : 'en'].heading}
                    </h4>
                    <div className="mt-2 space-y-1" data-book-pdfs>
                      {([...STORY_PDF_KINDS, isTeacher ? 'teachers-book' : 'self-study-guide'] as const).map(kind => (
                        <a
                          key={kind}
                          href={bookPdfUrl(selectedProphetId, currentLevel, language, kind)}
                          target="_blank"
                          rel="noopener"
                          onClick={() => setIsMenuOpen(false)}
                          className={cn("touch-target flex w-full items-center gap-4 rounded-xl px-4 text-parchment transition-colors", themeClasses.menuHoverBg)}
                          data-book-pdf={kind}
                        >
                          <Download size={21} className={themeClasses.menuAccentText} />
                          <span className="font-display text-[14px] sm:text-[15px] font-semibold">{BOOK_PDF_LABELS[language === 'ar' ? 'ar' : 'en'][kind]}</span>
                        </a>
                      ))}
                      <p className="px-4 pt-1 text-[12px] text-parchment/50">{BOOK_PDF_LABELS[language === 'ar' ? 'ar' : 'en'].hint}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAboutOpen(true);
                  }}
                  className={cn("touch-target flex w-full items-center gap-4 rounded-xl px-4 text-parchment/80 transition-colors", themeClasses.menuHoverBg)}
                  data-about-link
                >
                  <Info size={21} className={themeClasses.menuAccentText} />
                  <span className="font-display text-[14px] sm:text-[15px] font-semibold">{t('nav.aboutSources')}</span>
                </button>
              </div>

            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <AboutPage isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <HowToUse isOpen={isHowToUseOpen} onClose={() => setIsHowToUseOpen(false)} isTeacher={isTeacher} />
      <UsageGuide isOpen={isUsageGuideOpen} onClose={() => setIsUsageGuideOpen(false)} />
      <MyWordsPanel isOpen={isMyWordsOpen} onClose={() => setIsMyWordsOpen(false)} />
      <SeyahatnamePanel
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        focusBook={selectedProphetId && currentLevel ? { storyId: selectedProphetId, level: currentLevel } : undefined}
        onOpenBook={openFromJournal}
        onOpenMyWords={() => { setIsJournalOpen(false); setIsMyWordsOpen(true); }}
      />
      <StampMoment
        stamp={showSummary ? null : stampMoment}
        phone={isPhone}
        onClose={() => setStampMoment(null)}
        onNextChapter={index => setCurrentPageIndex(index)}
        onOpenJournal={() => setIsJournalOpen(true)}
      />

      {/* Teacher Guide Overlay */}
      {isTeacher && (
        <Suspense fallback={null}>
          <TeacherGuide 
            isOpen={isTeacherGuideOpen} 
            onClose={() => setIsTeacherGuideOpen(false)} 
            content={currentTeacherGuide?.content || []}
            pages={currentBook?.pages || []}
            bookTitle={currentBookTitle}
            metadata={currentTeacherGuide?.metadata}
            bookId={currentBook?.id}
            level={currentLevel || undefined}
            collectionId={currentCollection || 'prophets'}
            pdfUrl={selectedProphetId && currentLevel && !isHiddenStory(selectedProphetId) ? bookPdfUrl(selectedProphetId, currentLevel, language, 'teachers-book') : undefined}
          />
        </Suspense>
      )}

      {/* Self-Study Guide Overlay (Student Guide) */}
      <SelfStudyGuide 
        isOpen={isSelfStudyOpen} 
        onClose={() => setIsSelfStudyOpen(false)} 
        content={currentSelfStudyGuide?.content || []}
        pages={currentBook?.pages || []}
        bookTitle={currentBookTitle}
        studentGuideText={currentSelfStudyGuide?.text}
        studentGuideSections={currentSelfStudyGuide?.sections}
        metadata={currentSelfStudyGuide?.metadata}
        title={t('nav.studentSelfStudyGuide')}
        subtitle={t('nav.reflectionPractice')}
        footerText={t('nav.interactiveEbookSeries')}
        collectionId={currentCollection || 'prophets'}
        level={currentLevel}
        pdfUrl={selectedProphetId && currentLevel && !isHiddenStory(selectedProphetId) ? bookPdfUrl(selectedProphetId, currentLevel, language, 'self-study-guide') : undefined}
      />

      {/* Background PDF Generation Notification Card */}
      <AnimatePresence>
        {activePdfDownloads.map((name) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-[#1E293B]/95 text-white p-4 pr-5 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md max-w-sm"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-display font-medium text-[11px] uppercase tracking-widest text-amber-400">Background Download</h5>
              <p className="font-serif text-[13px] text-slate-200 truncate mt-0.5" title={name}>
                Generating PDF for {name}...
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const App = () => (
  <StoryProgressProvider>
    <AppContent />
  </StoryProgressProvider>
);

export default App;
