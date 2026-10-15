import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Level } from '../../types';
import homeIcon from '../../assets/images/home_icon.webp';
import { cn } from '../../lib/utils';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { useIsPhone } from '../../lib/phone';
import { PhoneLibrary } from './PhoneLibrary';
import { afterFirstInteraction } from '../../lib/afterFirstInteraction';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageToggle } from '../ui/LanguageToggle';
import { FullscreenToggle } from '../ui/FullscreenButton';
import { RoleToggle } from '../ui/RoleToggle';
import { useUserRole } from '../../contexts/UserRoleContext';
import { SECTION_ICONS } from '../../lib/sectionIcons';
import { LevelTest, readLevelTestResult } from './LevelTest';
import { MyWordsPanel } from '../book/MyWordsPanel';
import { CheckResultCode } from './CheckResultCode';
import { LevelExamDialog } from '../exam/LevelExamDialog';
import { ScoreExamDialog } from '../exam/ScoreExamDialog';
import { parseExamHash } from '../../lib/examCode';
import { useMyWords } from '../../lib/myWords';
import { firstOpenBookAt } from '../../lib/nextBook';
import { InstallAppButton } from '../ui/InstallAppButton';
import { AboutPage } from './AboutPage';
import { UsageGuide } from './UsageGuide';
import { BrandTitle } from './BrandedEntry';
import { USAGE_GUIDES } from '../../data/usageGuides';
import { aboutIntro } from '../../data/aboutContent';
import { HOME_AFTER_STORY, HOME_FEATURES, HOME_FEATURE_ORDER, HOME_NOTES, type HomeNoteIcon } from '../../data/homeFeatures';
import { ArrowDown, ArrowRight, BookOpen, Clock, Download, FileText, GraduationCap, Play, Scroll } from '../ui/icons';
import { preloadBook } from '../../core/content/bookRegistry';
import { readReaderPosition, type ReaderPosition } from '../../lib/readerPosition';
import { summarizeBookProgress } from '../../lib/bookProgress';
import { SeyahatnamePanel } from '../seyahatname/SeyahatnamePanel';
import { BookSeal } from '../seyahatname/art';
import { JOURNAL_COPY } from '../seyahatname/copy';
import { EDITIONS, editionKey, editionStamps, useJournal } from '../../lib/seyahatname/store';
import { totalSeals, totalStamps } from '../../lib/seyahatname/view';
import {
  collectionStoryIds,
  collectionVisuals,
  getStoryCollection,
  storyCatalog,
  type StoryCollectionId,
} from '../../core/content/storyCatalog';


interface HomePageProps {
  onStart: (prophetId: string, level: Level, options?: { resume?: boolean; pageIndex?: number }) => void;
  /** Teachers get a Teacher Guide shortcut per level on the book card. */
  onOpenTeacherGuide?: (prophetId: string, level: Level) => void;
}

type CollectionId = 'all' | StoryCollectionId;
const LEVELS: Level[] = ['A2', 'B1', 'B2'];
const levelDescriptions: Record<Level, { en: string; ar: string }> = {
  A2: { en: 'Elementary', ar: 'المستوى الأساسي' },
  B1: { en: 'Intermediate', ar: 'المستوى المتوسط' },
  B2: { en: 'Upper intermediate', ar: 'فوق المتوسط' },
};
type CatalogStory = (typeof storyCatalog)[number];
const HOME_LEVEL_KEY = 'home_level';
const readStoredLevel = (): Level | null => {
  try {
    const stored = localStorage.getItem(HOME_LEVEL_KEY) as Level | null;
    return stored && LEVELS.includes(stored) ? stored : null;
  } catch {
    return null;
  }
};

const NOTE_ICONS: Record<HomeNoteIcon, React.ComponentType<{ size?: number; className?: string }>> = {
  classMode: SECTION_ICONS.classMode.icon,
  lessonCard: SECTION_ICONS.lessonCard.icon,
  levelTest: SECTION_ICONS.levelTest.icon,
  myWords: SECTION_ICONS.myWords.icon,
  pdf: FileText,
  offline: Download,
  guide: BookOpen,
};

export const HomePage: React.FC<HomePageProps> = ({ onStart, onOpenTeacherGuide }) => {
  const [activeCollection, setActiveCollection] = useState<CollectionId>('all');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isUsageGuideOpen, setIsUsageGuideOpen] = useState(false);
  const [lastActive, setLastActive] = useState<{ prophetId: string; level: Level; position: ReaderPosition | null } | null>(null);

  const { language, t, isRTL, formatNumber } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';
  const { role, isSelfLearner, isTeacher } = useUserRole();
  const [isCheckCodeOpen, setIsCheckCodeOpen] = useState(false);
  const [isLevelTestOpen, setIsLevelTestOpen] = useState(false);
  const [isMyWordsOpen, setIsMyWordsOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const journal = useJournal();
  const journalCopy = JOURNAL_COPY[lang];
  // #/test/a2 opens that end-of-level test directly (a link or QR code from the printed booklet).
  const [examLevel, setExamLevel] = useState<Level | null>(() => (typeof window === 'undefined' ? null : parseExamHash(window.location.hash)));
  const [isScoreExamOpen, setIsScoreExamOpen] = useState(false);
  const [suggestedLevel, setSuggestedLevel] = useState<Level | null>(() => readLevelTestResult()?.level ?? null);
  // The level is chosen once above the shelf and remembered; a self-learner's test result is the first default.
  const [level, setLevel] = useState<Level>(() => readStoredLevel() ?? readLevelTestResult()?.level ?? 'A2');
  const suggestedBook = suggestedLevel ? firstOpenBookAt(suggestedLevel, lang) : null;
  const myWordCount = useMyWords().filter(word => word.language === lang).length;
  const selfCopy = language === 'ar'
    ? { question: 'لَا تَعْرِفُ مُسْتَوَاكَ؟ اخْتِبَارٌ قَصِيرٌ فِي ثَلَاثِ دَقَائِقَ.', take: 'ابْدَأِ الاخْتِبَارَ', suggested: 'مُسْتَوَاكَ المُقْتَرَحُ', startWith: 'ابْدَأْ بِـ', again: 'أَعِدِ الاخْتِبَارَ' }
    : { question: 'Don’t know your level? A three-minute test.', take: 'Take the test', suggested: 'Your suggested level', startWith: 'Start with', again: 'Take the test again' };
  const reduceMotion = useReducedMotion();
  const shelfRef = useRef<HTMLElement>(null);

  const copy =
    language === 'ar'
      ? {
          lead: 'مكتبة تنمو باستمرار، فيها قصص تُقرأ وتُسمع وتُعاش. قصص الأنبياء والتاريخ والتراث التركي الإسلامي، من A2 إلى B2.',
          explore: 'استكشف المكتبة',
          film: 'شاهد الفيلم',
          cue: 'مرّر للاستكشاف',
          all: 'الكل',
          prophets: 'قصص الأنبياء',
          history: 'التاريخ والحضارة',
          turkish: 'التراث التركي الإسلامي',
          continueLabel: 'تابع من حيث توقفت',
          shelfEyebrow: 'المكتبة',
          shelfTitle: 'اختر قصة',
          yourLevel: 'مستواك',
          read: 'ابدأ القراءة',
          alsoAt: 'أيضًا',
          onlyAt: 'متاح الآن في',
          featEyebrow: 'داخل كل كتاب',
          featTitle: 'أكثر من قصة.',
          featLead: 'كل كتاب درس كامل: اقرأ، واستمع، وتابع الرحلة على الخريطة، وتدرّب على ما تعلّمت.',
          afterStory: 'بعد القصة، ينتهي كل كتاب بـ',
        }
      : {
          lead: 'A growing library of stories to read, hear and step inside. Prophets, history and Turkish-Islamic heritage, from A2 to B2.',
          explore: 'Explore the library',
          film: 'Watch the film',
          cue: 'Scroll to explore',
          all: 'All',
          prophets: 'Prophets',
          history: 'History & civilization',
          turkish: 'Turkish-Islamic heritage',
          continueLabel: 'Continue where you left off',
          shelfEyebrow: 'The library',
          shelfTitle: 'Choose a story',
          yourLevel: 'Your level',
          read: 'Start reading',
          alsoAt: 'Also',
          onlyAt: 'Available now at',
          featEyebrow: 'Inside every book',
          featTitle: 'More than a story.',
          featLead: 'Each book is a full lesson: read, listen, follow the journey on the map and practise what you learned.',
          afterStory: 'After the story, every book ends with',
        };

  const collectionLabels: Record<StoryCollectionId, string> = {
    prophets: copy.prophets,
    history: copy.history,
    turkish: copy.turkish,
  };

  const translatedStoryName = (story: CatalogStory) => {
    const key = `prophet.${story.id}`;
    const value = t(key);
    return value && value !== key ? value : language === 'ar' && story.nameAr ? story.nameAr : story.name;
  };

  const translatedStoryDescription = (story: CatalogStory) => {
    const key = `prophet.${story.id}.desc`;
    const value = t(key);
    return value && value !== key ? value : language === 'ar' && story.descriptionAr ? story.descriptionAr : story.description;
  };

  // English-only books are not offered on the Arabic side.
  const stories = useMemo(
    () => storyCatalog.filter(story => language === 'en' || !story.englishOnly),
    [language],
  );
  const visibleStories = useMemo(() => {
    if (activeCollection === 'all') return stories;
    return stories.filter((story) => collectionStoryIds[activeCollection].includes(story.id));
  }, [activeCollection, stories]);

  // Hero: the covers turn slowly as a ring so each book comes to the front in turn, and every cover also floats on its own.
  // Hovering a cover pauses the turn and lifts that cover; clicking it goes down to that book on the shelf.
  const [hoveredCover, setHoveredCover] = useState<string | null>(null);
  const [highlightedBook, setHighlightedBook] = useState<string | null>(null);
  const [frontIndex, setFrontIndex] = useState(0);
  // Phones draw the floating covers small, so they get the 480 px copies (a quarter of the download).
  const isSmallScreen = useMediaQuery('(max-width: 767px)');
  // Phones get their own app-like library (PhoneLibrary): same books and actions, native layout.
  const isPhone = useIsPhone();
  const frontStory = stories.find(story => story.id === hoveredCover) ?? stories[frontIndex % stories.length] ?? stories[0];
  const fanStep = 'clamp(64px, 11vw, 170px)';
  const coverRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hoveredRef = useRef<string | null>(null);
  hoveredRef.current = hoveredCover;
  useLayoutEffect(() => {
    if (isPhone) return undefined;
    const count = stories.length;
    // A card's look at a given distance from the front (0 = front, 1 = next, ...). Smooth curves, so a cover never speeds up or
    // slows down suddenly; outer covers bunch up so a growing library still fits.
    const offsetAt = (distance: number) => 2.3 * Math.tanh((distance * 1.3) / 2.3);
    const scaleAt = (distance: number) => 0.44 + 0.56 * Math.exp(-distance * 0.55);
    const lightAt = (distance: number) => 0.3 + 0.7 * Math.exp(-distance * 0.7);
    const visibleUntil = Math.min(count / 2, 3.4);
    const lift = stories.map(() => 0);
    const PERIOD = 6500;
    let elapsed = 0;
    let last: number | null = null;
    let shownFront = -1;
    let frame = 0;
    const draw = (now: number) => {
      const dt = last === null ? 0 : Math.min(now - last, 100);
      last = now;
      if (!hoveredRef.current && !reduceMotion) elapsed += dt;
      // One steady turn: every cover moves at the same pace all the time.
      const phase = elapsed / PERIOD;
      const nearest = ((Math.round(phase) % count) + count) % count;
      if (nearest !== shownFront) {
        shownFront = nearest;
        setFrontIndex(nearest);
      }
      const stepPx = Math.min(170, Math.max(64, window.innerWidth * 0.11));
      const widths = coverRefs.current.map(card => card?.offsetWidth ?? 0);
      const deltas = stories.map((_, index) => {
        const delta = (((index - phase) % count) + count) % count;
        return delta > count / 2 ? delta - count : delta;
      });
      const offsets = deltas.map((delta, index) => offsetAt(Math.abs(delta)) * Math.sign(delta) * (isRTL ? -1 : 1) * (1 - lift[index] * 0.25));
      const scales = deltas.map((delta, index) => scaleAt(Math.abs(delta)) * (1 + lift[index] * 0.08));
      stories.forEach((story, index) => {
        const card = coverRefs.current[index];
        if (!card) return;
        const delta = deltas[index];
        const distance = Math.abs(delta);
        const target = hoveredRef.current === story.id ? 1 : 0;
        lift[index] += (target - lift[index]) * (reduceMotion ? 1 : Math.min(1, dt / 120));
        const offset = offsets[index];
        const light = lightAt(distance) + (1 - lightAt(distance)) * lift[index];
        card.style.transform = `translate(calc(-50% + ${offset} * ${fanStep}), -50%) perspective(1600px) scale(${scales[index]}) rotateY(${-offset * 12 * (1 - lift[index])}deg)`;
        card.style.filter = `brightness(${light})`;
        card.style.opacity = String(Math.max(0, Math.min(1, (visibleUntil - distance) / 0.6)));
        card.style.zIndex = String(Math.round(1000 - distance * 100) + (lift[index] > 0.05 ? 1000 : 0));
        card.style.pointerEvents = distance > visibleUntil - 0.3 ? 'none' : '';
        // The front cover going back and the next one coming forward overlap. Where they overlap, the one going back fades
        // little by little, so when they swap places the newcomer is already showing there and nothing jumps.
        let mask = '';
        if (delta < 0 && delta > -1) {
          const partner = deltas.findIndex(other => Math.abs(other - (delta + 1)) < 1e-6);
          const strength = Math.max(0, 1 - Math.abs(distance - 0.5) / 0.4);
          if (partner >= 0 && strength > 0 && lift[partner] < 0.05) {
            const width = widths[index] * scales[index];
            const partnerWidth = widths[partner] * scales[partner];
            const x = offset * stepPx;
            const partnerX = offsets[partner] * stepPx;
            const toRight = partnerX > x;
            const start = toRight
              ? (partnerX - partnerWidth / 2 - (x - width / 2)) / width
              : (x + width / 2 - (partnerX + partnerWidth / 2)) / width;
            if (start < 1) {
              const edge = Math.max(0, Math.min(100, start * 100));
              mask = `linear-gradient(to ${toRight ? 'right' : 'left'}, #000 ${Math.max(0, edge - 6)}%, rgba(0,0,0,${1 - strength}) ${edge}%)`;
            }
          }
        }
        card.style.maskImage = mask;
        card.style.webkitMaskImage = mask;
      });
      if (!reduceMotion) frame = window.requestAnimationFrame(draw);
    };
    draw(performance.now());
    return () => window.cancelAnimationFrame(frame);
  }, [stories, isRTL, reduceMotion, reduceMotion ? hoveredCover : null, isPhone]);
  const goToBook = (storyId: string) => {
    setActiveCollection('all');
    setHighlightedBook(storyId);
    // Wait a frame so a filtered shelf can show the book again before scrolling to it.
    window.requestAnimationFrame(() => {
      document.querySelector(`[data-home-book="${storyId}"]`)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
  };
  useEffect(() => {
    if (!highlightedBook) return;
    const timer = window.setTimeout(() => setHighlightedBook(null), 2800);
    return () => window.clearTimeout(timer);
  }, [highlightedBook]);

  useEffect(() => {
    // Warm the chosen level of every book on the shelf one by one in idle time, so the first open feels instant.
    const queue = stories.map(story => ({ storyId: story.id, level: story.availableLevels.includes(level) ? level : story.availableLevels[0] }));
    let cancelled = false;
    let index = 0;
    let idleId: number | null = null;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const warmNext = () => {
      if (cancelled || index >= queue.length) return;
      const item = queue[index++];
      preloadBook(item.storyId, item.level)?.catch(() => undefined);
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(warmNext, { timeout: 1800 });
      } else {
        timerId = setTimeout(warmNext, 700);
      }
    };

    // Starts on the first touch or scroll (or after a quiet moment), so it never slows the first screen.
    const cancelStart = afterFirstInteraction(() => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(warmNext, { timeout: 1200 });
      } else {
        timerId = setTimeout(warmNext, 900);
      }
    }, 6000);

    return () => {
      cancelled = true;
      cancelStart();
      if (idleId !== null && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
      if (timerId !== null) clearTimeout(timerId);
    };
  }, [stories, level]);

  const lastActiveStory = lastActive
    ? storyCatalog.find((story) => story.id === lastActive.prophetId) ?? null
    : null;

  useEffect(() => {
    const stored = localStorage.getItem('last_active_story');
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      const story = storyCatalog.find((item) => item.id === parsed?.prophetId);
      const storedLevel = parsed?.level as Level | undefined;

      if (story && storedLevel && story.availableLevels.includes(storedLevel)) {
        setLastActive({ prophetId: story.id, level: storedLevel, position: readReaderPosition(story.id, storedLevel) });
        preloadBook(story.id, storedLevel)?.catch(() => undefined);
      }
    } catch {
      // Ignore malformed local storage data.
    }
  }, []);

  const chooseLevel = (next: Level) => {
    setLevel(next);
    try { localStorage.setItem(HOME_LEVEL_KEY, next); } catch { /* the choice just is not remembered */ }
  };

  const warmBook = (prophetId: string, bookLevel: Level) => {
    preloadBook(prophetId, bookLevel)?.catch(() => undefined);
  };

  const launchStory = (prophetId: string, bookLevel: Level, options?: { resume?: boolean; pageIndex?: number }) => {
    localStorage.setItem('last_active_story', JSON.stringify({ prophetId, level: bookLevel }));
    setLastActive({ prophetId, level: bookLevel, position: options?.resume ? readReaderPosition(prophetId, bookLevel) : null });
    onStart(prophetId, bookLevel, options);
  };

  const scrollToShelf = () => shelfRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

  const eyebrowClass = cn('text-[12px] font-semibold uppercase text-[#D8B35C]', isRTL ? 'text-[15px]' : 'tracking-[0.26em]');
  const sectionTitleClass = cn('mt-3 text-[clamp(2rem,3.4vw,3.3rem)] font-semibold text-[#FFF9EC]', isRTL ? 'leading-[1.35]' : 'leading-[1.05] tracking-[-0.04em]');
  const featureOrder = HOME_FEATURE_ORDER[role ?? 'student'];

  const overlays = (
    <>
      <LevelTest
        isOpen={isLevelTestOpen}
        onClose={() => setIsLevelTestOpen(false)}
        onResult={(result) => {
          setSuggestedLevel(result);
          if (result) chooseLevel(result);
        }}
        onStart={(storyId, startLevel) => {
          setIsLevelTestOpen(false);
          launchStory(storyId, startLevel);
        }}
      />
      <MyWordsPanel isOpen={isMyWordsOpen} onClose={() => setIsMyWordsOpen(false)} />
      <CheckResultCode isOpen={isCheckCodeOpen} onClose={() => setIsCheckCodeOpen(false)} />
      <LevelExamDialog level={examLevel} onClose={() => setExamLevel(null)} />
      <ScoreExamDialog isOpen={isScoreExamOpen} onClose={() => setIsScoreExamOpen(false)} />
      <AboutPage isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <UsageGuide isOpen={isUsageGuideOpen} onClose={() => setIsUsageGuideOpen(false)} />
    </>
  );

  if (isPhone) {
    return (
      <div className={cn('min-h-screen bg-[#0b0e0c] text-[#F6F0E2]', isRTL && 'font-arabic')} dir={isRTL ? 'rtl' : 'ltr'}>
        <PhoneLibrary
          stories={stories}
          level={level}
          onChooseLevel={chooseLevel}
          lastActive={lastActive}
          onLaunch={launchStory}
          onWarm={warmBook}
          storyName={translatedStoryName}
          storyDescription={translatedStoryDescription}
          collectionLabels={collectionLabels}
          myWordCount={myWordCount}
          usageGuideTitle={USAGE_GUIDES[role ?? 'student'][lang].title}
          onOpenMyWords={() => setIsMyWordsOpen(true)}
          onOpenAbout={() => setIsAboutOpen(true)}
          onOpenUsageGuide={() => setIsUsageGuideOpen(true)}
          onOpenLevelTest={() => setIsLevelTestOpen(true)}
          onOpenCheckCode={() => setIsCheckCodeOpen(true)}
          onOpenExam={setExamLevel}
          onOpenScoreExam={() => setIsScoreExamOpen(true)}
          onOpenTeacherGuide={onOpenTeacherGuide}
          suggestedLevel={suggestedLevel}
        />
        {overlays}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-screen overflow-x-hidden bg-[#0b0e0c] text-[#F6F0E2] selection:bg-[#D8B35C]/25 selection:text-white',
        isRTL && 'font-arabic',
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <header className="relative z-50 bg-[#0b0e0c]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-full max-w-[1500px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white/[0.045] p-1.5">
              <img
                src={homeIcon}
                alt=""
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 text-start">
              <p className="clip-room line-clamp-2 text-[13px] font-semibold leading-tight tracking-[-0.01em] text-[#F7F1E5] sm:line-clamp-none sm:truncate sm:text-[15px]">
                {t('nav.homeTitle')}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <InstallAppButton />
            <div className="hidden sm:block">
              <RoleToggle />
            </div>
            <LanguageToggle />
            <FullscreenToggle />
          </div>
        </div>
      </header>

      <main id="main">
      {/* Three role options do not fit beside the title on a phone, so the switch gets its own row there. */}
      <div className="flex px-5 pb-2 sm:hidden">
        <RoleToggle />
      </div>

      <section className="relative isolate overflow-hidden lg:min-h-[min(calc(100vh-76px),900px)]" data-home-hero>
        <div className="absolute inset-[-8%] -z-20" aria-hidden="true">
          {stories.map(story => (
            <div
              key={story.id}
              className="absolute inset-0 scale-110 bg-cover bg-center blur-[46px] saturate-[1.2] transition-opacity duration-[1600ms]"
              style={{ backgroundImage: `url(${story.imageSmall ?? story.image})`, opacity: story.id === frontStory.id ? 0.34 : 0 }}
            />
          ))}
        </div>
        <div
          className={cn(
            'absolute inset-0 -z-10',
            isRTL
              ? 'bg-[radial-gradient(ellipse_at_28%_50%,rgba(216,179,92,.18),transparent_55%),linear-gradient(-90deg,#0b0e0c_8%,rgba(11,14,12,.82)_42%,rgba(11,14,12,.3)_100%),linear-gradient(0deg,#0b0e0c_1%,transparent_28%)]'
              : 'bg-[radial-gradient(ellipse_at_72%_50%,rgba(216,179,92,.18),transparent_55%),linear-gradient(90deg,#0b0e0c_8%,rgba(11,14,12,.82)_42%,rgba(11,14,12,.3)_100%),linear-gradient(0deg,#0b0e0c_1%,transparent_28%)]',
          )}
          aria-hidden="true"
        />

        <div className="mx-auto grid w-full max-w-[1500px] items-center gap-6 px-5 pb-16 pt-2 sm:px-8 lg:min-h-[inherit] lg:grid-cols-2 lg:gap-10 lg:px-12 lg:pb-24 lg:pt-6">
          <div className="text-start lg:order-1">
            <h1
              className={cn(
                'home-rise font-semibold text-[#FFF9EC] [text-wrap:balance]',
                isRTL ? 'text-[clamp(2.6rem,5.4vw,5.8rem)] leading-[1.25]' : 'text-[clamp(2.9rem,6.2vw,7rem)] leading-[0.95] tracking-[-0.05em]',
              )}
              style={{ animationDelay: '80ms' }}
            >
              <BrandTitle />
            </h1>
            <p className={cn('home-rise mt-6 max-w-[540px] leading-[1.7] text-[#EDE5D4]/78', isRTL ? 'text-[19px]' : 'text-[15.5px] sm:text-[17px]')} style={{ animationDelay: '160ms' }}>
              {copy.lead}
            </p>
            <div className="home-rise mt-9 flex flex-wrap gap-3.5" style={{ animationDelay: '240ms' }}>
              <button
                type="button"
                onClick={scrollToShelf}
                className="inline-flex items-center gap-2.5 rounded-full bg-[linear-gradient(135deg,#ECCD7E,#B98A36)] px-7 py-4 text-[15px] font-semibold text-[#16130c] shadow-[0_18px_50px_rgba(216,179,92,0.26)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(216,179,92,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3D58A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e0c]"
                data-home-explore
              >
                {copy.explore}
                <ArrowDown size={16} />
              </button>
              <a
                href={`https://youtu.be/${aboutIntro.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.06] px-7 py-4 text-[15px] font-semibold text-[#FFF9EC] transition-colors hover:bg-white/[0.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <Play size={15} />
                {copy.film}
              </a>
            </div>

            {lastActiveStory && lastActive && (
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
                onPointerEnter={() => warmBook(lastActiveStory.id, lastActive.level)}
                onFocus={() => warmBook(lastActiveStory.id, lastActive.level)}
                onTouchStart={() => warmBook(lastActiveStory.id, lastActive.level)}
                onClick={() => launchStory(lastActiveStory.id, lastActive.level, { resume: true })}
                className="group mt-7 flex w-full max-w-[460px] items-center gap-4 rounded-[18px] bg-white/[0.045] p-3.5 text-start transition-colors hover:bg-white/[0.075]"
                data-home-continue
              >
                <img src={lastActiveStory.imageSmall ?? lastActiveStory.image} alt="" className="h-14 w-12 shrink-0 rounded-[10px] object-cover" />
                <span className="min-w-0 flex-1">
                  <span className={cn('flex items-center gap-1.5 text-[11px] font-semibold uppercase text-[#E4C779]/78', !isRTL && 'tracking-[0.16em]')}>
                    <Clock size={13} />
                    {copy.continueLabel}
                  </span>
                  <span className="mt-1 block truncate text-sm font-semibold text-[#FFF9EC]">
                    {translatedStoryName(lastActiveStory)} · {lastActive.level}
                    {lastActive.position && lastActive.position.pageIndex > 0 && (
                      <> · {t('nav.page')} {formatNumber(lastActive.position.pageIndex + 1)} / {formatNumber(lastActive.position.totalPages)}</>
                    )}
                  </span>
                </span>
                <ArrowRight size={16} mirrored={isRTL} className="shrink-0 text-[#F3D58A] transition-transform group-hover:translate-x-0.5" />
              </motion.button>
            )}
          </div>

          <div className="relative order-first flex h-[250px] items-center justify-center sm:h-[420px] lg:order-2 lg:h-[min(68vh,640px)]">
            <div className="absolute left-1/2 top-1/2 aspect-square w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#D8B35C]/20 opacity-60" aria-hidden="true" />
            <div className="home-spin absolute left-1/2 top-1/2 aspect-square w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#D8B35C]/16" aria-hidden="true" />
            <div className="absolute left-1/2 top-1/2 aspect-square w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#D8B35C]/36 shadow-[0_0_120px_rgba(216,179,92,0.16)]" aria-hidden="true" />
            <div className="relative h-full w-full">
              {stories.map((story, index) => {
                const hovered = hoveredCover === story.id;
                const name = translatedStoryName(story);
                return (
                  <button
                    key={story.id}
                    ref={element => { coverRefs.current[index] = element; }}
                    type="button"
                    onClick={() => goToBook(story.id)}
                    onPointerEnter={() => setHoveredCover(story.id)}
                    onPointerLeave={() => setHoveredCover(current => (current === story.id ? null : current))}
                    onFocus={() => setHoveredCover(story.id)}
                    onBlur={() => setHoveredCover(current => (current === story.id ? null : current))}
                    aria-label={name}
                    className="absolute left-1/2 top-1/2 aspect-[4/5] h-[80%] cursor-pointer rounded-[22px] focus-visible:outline-none sm:h-[66%]"
                  >
                    <span
                      className="home-float block h-full w-full rounded-[22px] bg-cover bg-center shadow-[0_40px_90px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.07)]"
                      style={{
                        backgroundImage: `url(${(isSmallScreen && story.imageSmall) || story.image})`,
                        animationDuration: `${7 + (index % 3) * 1.3}s`,
                        animationDelay: `${-index * 1.7}s`,
                      }}
                    >
                      <span
                        className={cn(
                          'absolute inset-x-3 bottom-3 rounded-full bg-[#0b0e0c]/75 px-3 py-1.5 text-center font-semibold text-[#FFF9EC] backdrop-blur-md transition-opacity duration-300',
                          isRTL ? 'text-[15px]' : 'text-[13px]',
                          hovered ? 'opacity-100' : 'opacity-0',
                        )}
                      >
                        {name}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={scrollToShelf}
          className={cn('absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2.5 text-[11px] font-semibold uppercase text-[#EDE5D4]/50 lg:flex', !isRTL && 'tracking-[0.24em]')}
        >
          {copy.cue}
          <span className="home-cue h-[38px] w-px bg-gradient-to-b from-[#D8B35C] to-transparent" />
        </button>
      </section>

      <div className="relative mx-auto w-full max-w-[1500px] px-5 pb-10 sm:px-8 lg:px-12">
        <section ref={shelfRef} className="scroll-mt-4 pt-10" data-home-shelf>
          <p className={eyebrowClass}>{copy.shelfEyebrow}</p>
          <h2 className={sectionTitleClass}>{copy.shelfTitle}</h2>

          <div className="mt-6 flex flex-wrap gap-3">
              {isTeacher && (
                <div className="w-full max-w-[460px] rounded-2xl bg-white/[0.045] p-4 text-start" data-teacher-tools-card>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D8B35C]/11 text-[#E4C779]">
                      <SECTION_ICONS.checkCode.icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-[11px] font-semibold uppercase text-[#E4C779]/76', !isRTL && 'tracking-[0.18em]')}>{SECTION_ICONS.checkCode[lang]}</p>
                      <p className="mt-1 text-sm font-semibold text-[#FFF9EC]">
                        {language === 'ar' ? 'يُظْهِرُ الطَّالِبُ بِطَاقَةَ نَتِيجَتِهِ فِي آخِرِ الكِتَابِ. اكْتُبْ رَمْزَهَا هُنَا.' : 'Students show a result card at the end of each book. Type its code here.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCheckCodeOpen(true)}
                        className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-[#EDE5D4]/80 transition-colors hover:text-white"
                        data-check-code-open
                      >
                        {language === 'ar' ? 'تَحَقَّقْ مِنْ رَمْزٍ' : 'Check a code'}
                        <ArrowRight size={14} mirrored={isRTL} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {isSelfLearner && (
                <div className="w-full max-w-[460px] rounded-2xl bg-white/[0.045] p-4 text-start" data-self-learner-card>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D8B35C]/11 text-[#E4C779]">
                      <SECTION_ICONS.levelTest.icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      {suggestedLevel ? (
                        <>
                          <p className={cn('text-[11px] font-semibold uppercase text-[#E4C779]/76', !isRTL && 'tracking-[0.18em]')}>{selfCopy.suggested}</p>
                          <p className="mt-1 text-sm font-semibold text-[#FFF9EC]">{suggestedLevel}</p>
                          {suggestedBook && (
                            <button
                              type="button"
                              onClick={() => launchStory(suggestedBook.id, suggestedLevel)}
                              className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-[#EDE5D4]/80 transition-colors hover:text-white"
                            >
                              {selfCopy.startWith} {translatedStoryName(suggestedBook)} · {suggestedLevel}
                              <ArrowRight size={14} mirrored={isRTL} />
                            </button>
                          )}
                          <button type="button" onClick={() => setIsLevelTestOpen(true)} className="mt-1 block text-xs text-[#EDE5D4]/55 underline-offset-4 hover:text-white hover:underline">
                            {selfCopy.again}
                          </button>
                        </>
                      ) : (
                        <>
                          <p className={cn('text-[11px] font-semibold uppercase text-[#E4C779]/76', !isRTL && 'tracking-[0.18em]')}>{SECTION_ICONS.levelTest[lang]}</p>
                          <p className="mt-1 text-sm font-semibold text-[#FFF9EC]">{selfCopy.question}</p>
                          <button
                            type="button"
                            onClick={() => setIsLevelTestOpen(true)}
                            className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-[#EDE5D4]/80 transition-colors hover:text-white"
                            data-level-test-open
                          >
                            {selfCopy.take}
                            <ArrowRight size={14} mirrored={isRTL} />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsMyWordsOpen(true)}
                        className="mt-3 flex w-full items-center gap-2 border-t border-white/8 pt-3 text-xs font-semibold text-[#EDE5D4]/72 transition-colors hover:text-white"
                      >
                        <SECTION_ICONS.myWords.icon size={14} />
                        {SECTION_ICONS.myWords[lang]} · {formatNumber(myWordCount)}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="w-full max-w-[460px] rounded-2xl bg-white/[0.045] p-4 text-start" data-journal-card>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D8B35C]/11 text-[#E4C779]">
                    <Scroll size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-[11px] font-semibold uppercase text-[#E4C779]/76', !isRTL && 'tracking-[0.18em]')}>{journalCopy.name}</p>
                    <p className="mt-1 text-sm font-semibold text-[#FFF9EC]">
                      {totalStamps(journal) > 0
                        ? journalCopy.summaryLine(formatNumber(totalStamps(journal)), formatNumber(totalSeals(journal)), totalStamps(journal), totalSeals(journal))
                        : journalCopy.subtitle}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsJournalOpen(true)}
                      className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-[#EDE5D4]/80 transition-colors hover:text-white"
                      data-journal-open
                    >
                      {lang === 'ar' ? 'افْتَحْ دَفْتَرَ رِحْلَتِي' : 'Open my Seyahatname'}
                      <ArrowRight size={14} mirrored={isRTL} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-[460px] rounded-2xl bg-white/[0.045] p-4 text-start" data-level-exam-card>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D8B35C]/11 text-[#E4C779]">
                    <SECTION_ICONS.levelExam.icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-[11px] font-semibold uppercase text-[#E4C779]/76', !isRTL && 'tracking-[0.18em]')}>{SECTION_ICONS.levelExam[lang]}</p>
                    <p className="mt-1 text-sm font-semibold text-[#FFF9EC]">{SECTION_ICONS.levelExam.hint[lang]}</p>
                    <div className="mt-2 flex flex-wrap gap-2" dir="ltr">
                      {LEVELS.map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setExamLevel(option)}
                          className="rounded-lg bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-[#EDE5D4]/85 transition-colors hover:bg-white/[0.12] hover:text-white"
                          data-level-exam-open={option}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {isTeacher && (
                      <button
                        type="button"
                        onClick={() => setIsScoreExamOpen(true)}
                        className="mt-3 flex w-full items-center gap-2 border-t border-white/8 pt-3 text-xs font-semibold text-[#EDE5D4]/72 transition-colors hover:text-white"
                        data-score-exam-open
                      >
                        <SECTION_ICONS.scoreExam.icon size={14} />
                        {SECTION_ICONS.scoreExam[lang]}
                        <ArrowRight size={14} mirrored={isRTL} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[22px] bg-white/[0.045] p-3">
            <span className={cn('ps-2 text-[11px] font-semibold uppercase text-[#EDE5D4]/66', isRTL ? 'text-[14px]' : 'tracking-[0.18em]')}>{copy.yourLevel}</span>
            <div className="flex w-full gap-1 rounded-2xl bg-black/30 p-1 sm:w-auto" role="group" aria-label={copy.yourLevel}>
              {LEVELS.map(option => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={option === level}
                  onClick={() => chooseLevel(option)}
                  className={cn(
                    'flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-1.5 py-2 text-center transition-colors sm:min-w-[120px] sm:flex-none sm:items-start sm:justify-start sm:px-4 sm:text-start',
                    option === level ? 'bg-[linear-gradient(135deg,#ECCD7E,#B98A36)] text-[#16130c]' : 'text-[#FFF9EC] hover:bg-white/[0.06]',
                  )}
                  data-home-level={option}
                >
                  <span className="text-[19px] font-semibold leading-tight">{option}</span>
                  <span className={cn('leading-tight', isRTL ? 'text-[13px] sm:text-[13.5px]' : 'text-[10.5px] sm:text-[11.5px]', option === level ? 'text-[#16130c]/80' : 'text-[#EDE5D4]/66')}>
                    {levelDescriptions[option][lang]}
                  </span>
                </button>
              ))}
            </div>
            {/* Phones: one row that scrolls sideways instead of four ragged lines */}
            <div className="-mx-1 flex w-full gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 lg:ms-auto lg:w-auto" role="group">
              {(['all', 'prophets', 'history', 'turkish'] as CollectionId[]).map(collection => (
                <button
                  key={collection}
                  type="button"
                  aria-pressed={activeCollection === collection}
                  onClick={() => setActiveCollection(collection)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 font-semibold transition-colors',
                    isRTL ? 'text-[15px]' : 'text-[13px]',
                    activeCollection === collection ? 'border-white/10 bg-white/[0.08] text-[#FFF9EC]' : 'border-white/[0.06] text-[#EDE5D4]/66 hover:text-[#FFF9EC] sm:border-transparent',
                  )}
                >
                  {collection !== 'all' && <img src={collectionVisuals[collection].icon} alt="" className="h-5 w-5 object-contain" />}
                  {collection === 'all' ? copy.all : collectionLabels[collection]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleStories.map(story => {
              const collection = getStoryCollection(story.id);
              const visual = collectionVisuals[collection];
              const hasLevel = story.availableLevels.includes(level);
              const bookLevel = hasLevel ? level : story.availableLevels[0];
              const otherLevels = story.availableLevels.filter(option => option !== bookLevel);
              const progress = summarizeBookProgress(story.id, bookLevel);
              return (
                <article
                  key={story.id}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-[26px] border border-white/[0.06] bg-[#121612] text-start transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_70px_rgba(0,0,0,0.45)]",
                    highlightedBook === story.id && 'home-book-highlight',
                  )}
                  style={{ ['--accent' as string]: visual.accentBright }}
                  data-home-book={story.id}
                  data-home-highlight={highlightedBook === story.id || undefined}
                >
                  <button
                    type="button"
                    onClick={() => launchStory(story.id, bookLevel)}
                    onPointerEnter={() => warmBook(story.id, bookLevel)}
                    onFocus={() => warmBook(story.id, bookLevel)}
                    onTouchStart={() => warmBook(story.id, bookLevel)}
                    className="relative block aspect-[16/11] overflow-hidden focus-visible:outline-none"
                    aria-label={`${translatedStoryName(story)} · ${bookLevel}`}
                    tabIndex={-1}
                  >
                    <img src={story.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-t from-[#121612] to-transparent to-45%" />
                    {journal.seals[editionKey(story.id, bookLevel)] !== undefined && (
                      <span className="absolute bottom-2 end-3 -rotate-6" data-home-seal>
                        <BookSeal storyId={story.id} level={bookLevel} arabic={lang === 'ar' && !story.englishOnly} size={64} ribbons={false} title={journalCopy.sealed} />
                      </span>
                    )}
                    <span
                      className={cn('absolute start-3.5 top-3.5 inline-flex items-center gap-2 rounded-full bg-[#0b0e0c]/72 px-3 py-1.5 font-semibold uppercase backdrop-blur-md', isRTL ? 'text-[13px]' : 'text-[11px] tracking-[0.12em]')}
                      style={{ color: visual.accentBright }}
                    >
                      <span className="h-[7px] w-[7px] rounded-full bg-current shadow-[0_0_10px_currentColor]" />
                      {collectionLabels[collection]}
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col px-5 pb-5 sm:px-[22px] sm:pb-[22px]">
                    <h3 className={cn('font-semibold text-[#FFF9EC]', isRTL ? 'text-[27px]' : 'text-[24px] tracking-[-0.025em]')}>{translatedStoryName(story)}</h3>
                    <p className={cn('mt-2 flex-1 leading-relaxed text-[#EDE5D4]/66', isRTL ? 'text-[17px]' : 'text-[14px]')}>{translatedStoryDescription(story)}</p>
                    {!hasLevel && (
                      <p className="mt-2 text-[12px] font-semibold text-[#F3D58A]">{copy.onlyAt} {bookLevel}</p>
                    )}
                    {progress && (
                      <span className="mt-3 flex items-center gap-2" aria-label={`${progress.percent}%`}>
                        <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                          <span className="block h-full rounded-full" style={{ width: `${progress.percent}%`, background: visual.accentBright }} />
                        </span>
                        <span className="text-[11px] font-semibold tabular-nums text-[#F0E8D8]/76">{formatNumber(progress.percent)}%</span>
                      </span>
                    )}
                    {EDITIONS[editionKey(story.id, bookLevel)] && editionStamps(journal, story.id, bookLevel).some(Boolean) && (
                      <span className="mt-1.5 text-[11.5px] font-semibold text-[#EDE5D4]/62" data-home-stamps>
                        {journalCopy.bookStamps(formatNumber(editionStamps(journal, story.id, bookLevel).filter(Boolean).length), formatNumber(editionStamps(journal, story.id, bookLevel).length))}
                      </span>
                    )}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => launchStory(story.id, bookLevel)}
                        onPointerEnter={() => warmBook(story.id, bookLevel)}
                        onFocus={() => warmBook(story.id, bookLevel)}
                        className="inline-flex items-center gap-2.5 rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] px-[18px] py-[11px] text-[14px] font-semibold text-[var(--accent)] transition-colors group-hover:bg-[var(--accent)] group-hover:text-[#16130c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        data-home-read
                      >
                        {copy.read} · {bookLevel}
                        <ArrowRight size={15} mirrored={isRTL} />
                      </button>
                      {otherLevels.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[12px] text-[#EDE5D4]/60">
                          {copy.alsoAt}
                          {otherLevels.map(option => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => launchStory(story.id, option)}
                              onPointerEnter={() => warmBook(story.id, option)}
                              className="rounded-lg px-2 py-1 font-semibold text-[#EDE5D4]/70 transition-colors hover:bg-white/[0.08] hover:text-[#FFF9EC]"
                            >
                              {option}
                            </button>
                          ))}
                        </span>
                      )}
                    </div>
                    {onOpenTeacherGuide && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.09] pt-3" data-teacher-shortcut>
                        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#EDE5D4]/66">
                          <GraduationCap size={14} style={{ color: visual.accentBright }} />
                          {t('nav.teacherGuideFor')}
                        </span>
                        {story.availableLevels.map(option => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => onOpenTeacherGuide(story.id, option)}
                            className="min-h-8 rounded-full border border-white/14 bg-white/[0.04] px-3 text-[12px] font-semibold text-[#FFF9EC] transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="pb-10 pt-20 sm:pt-24" data-home-features>
          <p className={eyebrowClass}>{copy.featEyebrow}</p>
          <h2 className={sectionTitleClass}>{copy.featTitle}</h2>
          <p className={cn('mt-3 max-w-[620px] leading-[1.7] text-[#EDE5D4]/66', isRTL ? 'text-[19px]' : 'text-[16px]')}>{copy.featLead}</p>

          <div className="mt-12 flex flex-col gap-14 lg:gap-[72px]">
            {featureOrder.map((id, index) => {
              const feature = HOME_FEATURES[id];
              return (
                <div key={id} className="grid items-center gap-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14 lg:even:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
                  <figure className={cn('m-0 aspect-[16/10] overflow-hidden rounded-3xl border border-white/[0.09] bg-[#121612] shadow-[0_40px_90px_rgba(0,0,0,0.45)]', index % 2 === 1 && 'lg:order-2')}>
                    <img src={feature.image[lang]} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
                  </figure>
                  <div>
                    <span className={eyebrowClass}>{feature.verb[lang]}</span>
                    <h3 className={cn('mt-2.5 text-[clamp(1.7rem,2.6vw,2.5rem)] font-semibold text-[#FFF9EC] [text-wrap:balance]', isRTL ? 'leading-[1.4]' : 'leading-[1.1] tracking-[-0.035em]')}>
                      {feature.title[lang]}
                    </h3>
                    <p className={cn('mt-3.5 max-w-[52ch] leading-[1.75] text-[#EDE5D4]/75', isRTL ? 'text-[19px]' : 'text-[16px]')}>{feature.body[lang]}</p>
                    <ul className="mt-5 flex flex-col gap-2.5">
                      {feature.points[lang].map(point => (
                        <li key={point} className={cn('flex items-center gap-3 font-medium text-[#FFF9EC]', isRTL ? 'text-[17px]' : 'text-[14.5px]')}>
                          <span className="h-[9px] w-[9px] shrink-0 rounded-full border-2 border-[#D8B35C]" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}

            <div className="flex flex-col gap-6 rounded-[28px] bg-white/[0.045] p-6 sm:p-8" data-home-after-story>
              <p className={eyebrowClass}>{copy.afterStory}</p>
              <ol className="relative grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
                <span className="absolute inset-x-[8%] top-7 hidden h-px bg-[linear-gradient(90deg,transparent,rgba(216,179,92,.5)_10%,rgba(216,179,92,.5)_90%,transparent)] lg:block" aria-hidden="true" />
                {HOME_AFTER_STORY.map(key => {
                  const section = SECTION_ICONS[key];
                  return (
                    <li key={key} className="relative flex flex-col items-center gap-3 text-center">
                      <span className="grid h-14 w-14 place-items-center rounded-full border border-[#D8B35C]/45 bg-[#0b0e0c] text-[#F3D58A] shadow-[0_0_0_6px_#121612,0_0_30px_rgba(216,179,92,0.12)]">
                        <section.icon size={24} />
                      </span>
                      <span className={cn('font-semibold leading-snug text-[#FFF9EC]', isRTL ? 'text-[17px]' : 'text-[14px]')}>{section[lang]}</span>
                    </li>
                  );
                })}
              </ol>
              <ul className="flex flex-wrap gap-x-7 gap-y-3 border-t border-white/[0.09] pt-5">
                {HOME_NOTES[role ?? 'student'].map(note => {
                  const Icon = NOTE_ICONS[note.icon];
                  return (
                    <li key={note.icon} className={cn('flex items-center gap-2.5 font-medium text-[#EDE5D4]/70', isRTL ? 'text-[17px]' : 'text-[14px]')}>
                      <Icon size={18} className="text-[#F3D58A]" />
                      {note.label[lang]}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      </div>
      </main>

      <LevelTest
        isOpen={isLevelTestOpen}
        onClose={() => setIsLevelTestOpen(false)}
        onResult={(result) => {
          setSuggestedLevel(result);
          if (result) chooseLevel(result);
        }}
        onStart={(storyId, startLevel) => {
          setIsLevelTestOpen(false);
          launchStory(storyId, startLevel);
        }}
      />
      <MyWordsPanel isOpen={isMyWordsOpen} onClose={() => setIsMyWordsOpen(false)} />
      <SeyahatnamePanel
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        onOpenBook={target => { setIsJournalOpen(false); launchStory(target.storyId, target.level, { pageIndex: target.pageIndex }); }}
        onOpenMyWords={() => { setIsJournalOpen(false); setIsMyWordsOpen(true); }}
      />
      <CheckResultCode isOpen={isCheckCodeOpen} onClose={() => setIsCheckCodeOpen(false)} />
      <LevelExamDialog level={examLevel} onClose={() => setExamLevel(null)} />
      <ScoreExamDialog isOpen={isScoreExamOpen} onClose={() => setIsScoreExamOpen(false)} />

      <footer className="mx-auto w-full max-w-[1500px] px-5 pb-10 text-center sm:px-8 lg:px-12">
        <button
          type="button"
          onClick={() => setIsUsageGuideOpen(true)}
          className="min-h-10 rounded-full px-4 text-[13px] font-semibold text-[#F6F0E2]/55 underline decoration-white/20 underline-offset-4 transition-colors hover:text-[#F6F0E2] hover:decoration-[#D8B35C]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          data-usage-guide-link
        >
          {USAGE_GUIDES[role ?? 'student'][lang].title}
        </button>
        <button
          type="button"
          onClick={() => setIsAboutOpen(true)}
          className="min-h-10 rounded-full px-4 text-[13px] font-semibold text-[#F6F0E2]/55 underline decoration-white/20 underline-offset-4 transition-colors hover:text-[#F6F0E2] hover:decoration-[#D8B35C]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          data-about-link
        >
          {t('nav.aboutSources')}
        </button>
      </footer>

      <AboutPage isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <UsageGuide isOpen={isUsageGuideOpen} onClose={() => setIsUsageGuideOpen(false)} />
    </div>
  );
};
