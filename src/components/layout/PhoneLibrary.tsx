import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Level } from '../../types';
import homeIcon from '../../assets/images/home_icon.webp';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUserRole } from '../../contexts/UserRoleContext';
import { LanguageToggle } from '../ui/LanguageToggle';
import { RoleToggle } from '../ui/RoleToggle';
import { InstallAppButton } from '../ui/InstallAppButton';
import { SECTION_ICONS } from '../../lib/sectionIcons';
import { summarizeBookProgress } from '../../lib/bookProgress';
import { type ReaderPosition } from '../../lib/readerPosition';
import { aboutIntro } from '../../data/aboutContent';
import { useSheetDrag } from '../../lib/phone';
import { MyWordsPanel } from '../book/MyWordsPanel';
import { SeyahatnamePanel } from '../seyahatname/SeyahatnamePanel';
import { BookSeal } from '../seyahatname/art';
import { JOURNAL_COPY } from '../seyahatname/copy';
import { editionKey, useJournal } from '../../lib/seyahatname/store';
import { ArrowRight, BookMarked, BookOpen, GraduationCap, Info, Library, Play, Scroll, Settings, X } from '../ui/icons';
import {
  collectionStoryIds,
  collectionVisuals,
  getStoryCollection,
  storyCatalog,
  type StoryCollectionId,
} from '../../core/content/storyCatalog';
import { useDialogFocus } from '../../hooks/useDialogFocus';

type CatalogStory = (typeof storyCatalog)[number];
type Tab = 'library' | 'journal' | 'words' | 'settings';

const LEVELS: Level[] = ['A2', 'B1', 'B2'];
const COLLECTIONS: StoryCollectionId[] = ['prophets', 'history', 'turkish'];

interface PhoneLibraryProps {
  stories: CatalogStory[];
  level: Level;
  onChooseLevel: (level: Level) => void;
  lastActive: { prophetId: string; level: Level; position: ReaderPosition | null } | null;
  onLaunch: (prophetId: string, level: Level, options?: { resume?: boolean; pageIndex?: number }) => void;
  onWarm: (prophetId: string, level: Level) => void;
  storyName: (story: CatalogStory) => string;
  storyDescription: (story: CatalogStory) => string;
  collectionLabels: Record<StoryCollectionId, string>;
  myWordCount: number;
  usageGuideTitle: string;
  onOpenMyWords: () => void;
  onOpenAbout: () => void;
  onOpenUsageGuide: () => void;
  onOpenLevelTest: () => void;
  onOpenCheckCode: () => void;
  onOpenExam: (level: Level) => void;
  onOpenScoreExam: () => void;
  onOpenTeacherGuide?: (prophetId: string, level: Level) => void;
  suggestedLevel: Level | null;
}

/**
 * The library on phones: a native-app layout (continue card, shelves that scroll sideways, a book card that opens
 * from the bottom, and a tab bar). Same books, levels and actions as the desktop home page; only the presentation differs.
 */
export const PhoneLibrary: React.FC<PhoneLibraryProps> = ({
  stories,
  level,
  onChooseLevel,
  lastActive,
  onLaunch,
  onWarm,
  storyName,
  storyDescription,
  collectionLabels,
  myWordCount,
  usageGuideTitle,
  onOpenAbout,
  onOpenUsageGuide,
  onOpenLevelTest,
  onOpenCheckCode,
  onOpenExam,
  onOpenScoreExam,
  onOpenTeacherGuide,
  suggestedLevel,
}) => {
  const { language, t, isRTL, formatNumber } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';
  const { isTeacher, isSelfLearner } = useUserRole();
  const [tab, setTab] = useState<Tab>('library');
  const [openBook, setOpenBook] = useState<{ id: string; level: Level } | null>(null);
  const bookSheet = useSheetDrag(() => setOpenBook(null));
  const scrollRef = useRef<HTMLElement>(null);
  const journal = useJournal();
  const journalCopy = JOURNAL_COPY[lang];

  const copy = lang === 'ar'
    ? {
        continueLabel: 'تابع القراءة',
        yourLevel: 'مُسْتَوَاكَ',
        library: 'الْمَكْتَبَةُ',
        continueTab: 'تابع',
        myWords: 'كَلِمَاتِي',
        settings: 'الْإِعْدَادَاتُ',
        read: 'ابْدَأِ الْقِرَاءَةَ',
        resume: 'تابع',
        chooseLevel: 'اخْتَرِ الْمُسْتَوَى',
        page: 'صَفْحَةٌ',
        iAm: 'أنا',
        appLanguage: 'لغة التطبيق',
        guides: 'الأدلة',
        film: 'شاهد الفيلم',
        about: t('nav.aboutSources'),
        levelTest: 'اختبار المستوى',
        suggested: 'مستواك المقترح',
        checkCode: 'تحقق من رمز نتيجة',
        teacherGuide: t('nav.teacherGuideFor'),
        close: 'إغلاق',
        nothingYet: 'اختر كتابًا لتبدأ.',
      }
    : {
        continueLabel: 'Continue reading',
        yourLevel: 'Your level',
        library: 'Library',
        continueTab: 'Continue',
        myWords: 'My words',
        settings: 'Settings',
        read: 'Start reading',
        resume: 'Continue',
        chooseLevel: 'Choose your level',
        page: 'Page',
        iAm: 'I am a',
        appLanguage: 'App language',
        guides: 'Guides',
        film: 'Watch the film',
        about: t('nav.aboutSources'),
        levelTest: 'Level test',
        suggested: 'Your suggested level',
        checkCode: 'Check a result code',
        teacherGuide: t('nav.teacherGuideFor'),
        close: 'Close',
        nothingYet: 'Choose a book to start.',
      };

  const lastStory = lastActive ? storyCatalog.find(story => story.id === lastActive.prophetId) ?? null : null;
  const shelves = useMemo(
    () => COLLECTIONS
      .map(collection => ({ collection, books: stories.filter(story => collectionStoryIds[collection].includes(story.id)) }))
      .filter(shelf => shelf.books.length > 0),
    [stories],
  );
  const bookOpen = openBook ? stories.find(story => story.id === openBook.id) ?? null : null;
  // Tab stays in the book sheet and focus returns to the cover; Escape is handled below.
  const bookSheetRef = useDialogFocus(bookOpen !== null, () => setOpenBook(null), { escape: false });

  useEffect(() => {
    if (!openBook) return undefined;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenBook(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openBook]);

  const levelFor = (story: CatalogStory) => (story.availableLevels.includes(level) ? level : story.availableLevels[0]);
  const showBook = (story: CatalogStory) => {
    const bookLevel = levelFor(story);
    onWarm(story.id, bookLevel);
    setOpenBook({ id: story.id, level: bookLevel });
  };

  const resume = () => {
    if (lastStory && lastActive) onLaunch(lastStory.id, lastActive.level, { resume: true });
  };

  const tabButton = (id: string, label: string, icon: React.ReactNode, onClick: () => void, active: boolean, disabled = false) => (
    <button
      key={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 font-semibold transition-colors disabled:opacity-35',
        isRTL ? 'text-[12.5px]' : 'text-[11px]',
        active ? 'text-[#E9C46A]' : 'text-[#EDE5D4]/62',
      )}
    >
      {icon}
      {label}
    </button>
  );

  const settingsRow = (label: string, icon: React.ReactNode, onClick: () => void, trailing?: React.ReactNode) => (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center gap-3.5 border-b border-white/[0.06] px-4 text-start last:border-b-0"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D8B35C]/12 text-[#E9C46A]">{icon}</span>
      <span className={cn('min-w-0 flex-1 font-semibold text-[#FFF9EC]', isRTL ? 'text-[16px]' : 'text-[14.5px]')}>{label}</span>
      {trailing ?? <ArrowRight size={16} mirrored={isRTL} className="shrink-0 text-[#EDE5D4]/40" />}
    </button>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0b0e0c] text-[#F6F0E2]" data-phone-library>
      <header className="flex shrink-0 items-center gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-white/[0.045] p-1">
          <img src={homeIcon} alt="" className="h-full w-full object-contain" />
        </div>
        <p className="clip-room min-w-0 flex-1 line-clamp-2 text-[15px] font-semibold leading-tight text-[#F7F1E5]">
          {tab === 'settings' ? copy.settings : tab === 'words' ? copy.myWords : tab === 'journal' ? journalCopy.name : t('nav.homeTitle')}
        </p>
        <InstallAppButton />
        <LanguageToggle />
      </header>

      <main id="main" ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
        {tab === 'library' ? (
          <div className="space-y-7 px-4 pt-2">
            {lastStory && lastActive && (
              <section>
                <p className={cn('mb-2 font-semibold uppercase text-[#D8B35C]', isRTL ? 'text-[14px]' : 'text-[11px] tracking-[0.16em]')}>{copy.continueLabel}</p>
                <button
                  type="button"
                  onClick={resume}
                  onTouchStart={() => onWarm(lastStory.id, lastActive.level)}
                  className="flex w-full items-center gap-3.5 rounded-[18px] border border-white/[0.08] bg-white/[0.05] p-3 text-start"
                  data-home-continue
                >
                  <img src={lastStory.imageSmall ?? lastStory.image} alt="" className="h-[84px] w-[66px] shrink-0 rounded-[10px] object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate font-semibold text-[#FFF9EC]', isRTL ? 'text-[18px]' : 'text-[16px]')}>{storyName(lastStory)}</span>
                    <span className={cn('mt-0.5 block text-[#EDE5D4]/66', isRTL ? 'text-[14px]' : 'text-[12.5px]')}>
                      {lastActive.level}
                      {lastActive.position && lastActive.position.pageIndex > 0 && (
                        <> · {copy.page} {formatNumber(lastActive.position.pageIndex + 1)} / {formatNumber(lastActive.position.totalPages)}</>
                      )}
                    </span>
                    {lastActive.position && lastActive.position.totalPages > 0 && (
                      <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/10">
                        <span className="block h-full rounded-full bg-[#E9C46A]" style={{ width: `${Math.round(((lastActive.position.pageIndex + 1) / lastActive.position.totalPages) * 100)}%` }} />
                      </span>
                    )}
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E9C46A] text-[#16130c]">
                    <Play size={16} />
                  </span>
                </button>
              </section>
            )}

            <section className="flex items-center gap-3">
              <span className={cn('shrink-0 font-semibold text-[#EDE5D4]/66', isRTL ? 'text-[14px]' : 'text-[12px]')}>{copy.yourLevel}</span>
              <div className="flex flex-1 gap-1 rounded-2xl bg-white/[0.05] p-1" role="group" aria-label={copy.yourLevel}>
                {LEVELS.map(option => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={option === level}
                    onClick={() => onChooseLevel(option)}
                    className={cn(
                      'min-h-10 flex-1 rounded-xl text-[15px] font-semibold transition-colors',
                      option === level ? 'bg-[#E9C46A] text-[#16130c]' : 'text-[#FFF9EC]',
                    )}
                    data-home-level={option}
                  >
                    {option}
                    {suggestedLevel === option && option !== level && <span className="ms-1 text-[10px] text-[#E9C46A]">●</span>}
                  </button>
                ))}
              </div>
            </section>

            {shelves.map(shelf => (
              <section key={shelf.collection}>
                <h2 className={cn('mb-3 flex items-center gap-2 font-semibold text-[#FFF9EC]', isRTL ? 'text-[19px]' : 'text-[17px]')}>
                  <img src={collectionVisuals[shelf.collection].icon} alt="" className="h-5 w-5 object-contain" />
                  {collectionLabels[shelf.collection]}
                </h2>
                <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {shelf.books.map(story => {
                    const bookLevel = levelFor(story);
                    const progress = summarizeBookProgress(story.id, bookLevel);
                    const accent = collectionVisuals[getStoryCollection(story.id)].accentBright;
                    return (
                      <button
                        key={story.id}
                        type="button"
                        onClick={() => showBook(story)}
                        onTouchStart={() => onWarm(story.id, bookLevel)}
                        className="w-[132px] shrink-0 snap-start text-start"
                        data-home-book={story.id}
                      >
                        <span className="relative block aspect-[4/5] overflow-hidden rounded-[14px] shadow-[0_14px_30px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.07]">
                          <img src={story.imageSmall ?? story.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                          {!story.availableLevels.includes(level) && (
                            <span className="absolute end-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10.5px] font-semibold text-[#F3D58A]">{bookLevel}</span>
                          )}
                          {journal.seals[editionKey(story.id, bookLevel)] !== undefined && (
                            <span className="absolute bottom-1.5 end-1 -rotate-6" data-home-seal>
                              <BookSeal storyId={story.id} level={bookLevel} arabic={lang === 'ar' && !story.englishOnly} size={48} ribbons={false} title={journalCopy.sealed} />
                            </span>
                          )}
                          {progress && (
                            <span className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
                              <span className="block h-full" style={{ width: `${progress.percent}%`, background: accent }} />
                            </span>
                          )}
                        </span>
                        <span className={cn('mt-2 line-clamp-2 block font-semibold leading-snug text-[#FFF9EC]', isRTL ? 'text-[15px]' : 'text-[13px]')}>{storyName(story)}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : tab === 'journal' ? (
          <SeyahatnamePanel
            isOpen
            embedded
            onClose={() => setTab('library')}
            onOpenBook={target => onLaunch(target.storyId, target.level, { pageIndex: target.pageIndex })}
            onOpenMyWords={() => { setTab('words'); scrollRef.current?.scrollTo({ top: 0 }); }}
          />
        ) : tab === 'words' ? (
          <MyWordsPanel isOpen embedded onClose={() => setTab('library')} />
        ) : (
          <div className="space-y-6 px-4 pt-3">
            <section>
              <p className={cn('mb-2 px-1 font-semibold text-[#EDE5D4]/55', isRTL ? 'text-[14px]' : 'text-[12px] uppercase tracking-[0.12em]')}>{copy.iAm}</p>
              <div className="rounded-2xl bg-white/[0.045] p-3 [&_[data-role-toggle]]:w-full [&_[data-role-toggle]_button]:min-h-11 [&_[data-role-toggle]_button]:flex-1 [&_[data-role-toggle]_button]:text-[12px]">
                <RoleToggle />
              </div>
            </section>
            <section>
              <p className={cn('mb-2 px-1 font-semibold text-[#EDE5D4]/55', isRTL ? 'text-[14px]' : 'text-[12px] uppercase tracking-[0.12em]')}>{copy.guides}</p>
              <div className="overflow-hidden rounded-2xl bg-white/[0.045]">
                {settingsRow(usageGuideTitle, <BookOpen size={18} />, onOpenUsageGuide)}
                {isSelfLearner && settingsRow(
                  copy.levelTest,
                  <SECTION_ICONS.levelTest.icon size={18} />,
                  onOpenLevelTest,
                  suggestedLevel ? <span className="text-[13px] font-semibold text-[#E9C46A]">{copy.suggested}: {suggestedLevel}</span> : undefined,
                )}
                {isTeacher && settingsRow(copy.checkCode, <SECTION_ICONS.checkCode.icon size={18} />, onOpenCheckCode)}
                {(['A2', 'B1', 'B2'] as Level[]).map(option => (
                  <React.Fragment key={option}>
                    {settingsRow(`${SECTION_ICONS.levelExam[lang]} · ${option}`, <SECTION_ICONS.levelExam.icon size={18} />, () => onOpenExam(option))}
                  </React.Fragment>
                ))}
                {isTeacher && settingsRow(SECTION_ICONS.scoreExam[lang], <SECTION_ICONS.scoreExam.icon size={18} />, onOpenScoreExam)}
                {settingsRow(copy.myWords, <BookMarked size={18} />, () => setTab('words'), <span className="text-[13px] font-semibold tabular-nums text-[#EDE5D4]/55">{formatNumber(myWordCount)}</span>)}
              </div>
            </section>
            <section>
              <div className="overflow-hidden rounded-2xl bg-white/[0.045]">
                {settingsRow(copy.film, <Play size={18} />, () => window.open(`https://youtu.be/${aboutIntro.videoId}`, '_blank', 'noopener,noreferrer'))}
                {settingsRow(copy.about, <Info size={18} />, onOpenAbout)}
              </div>
            </section>
          </div>
        )}
      </main>

      <nav
        className="flex shrink-0 border-t border-white/[0.08] bg-[#0b0e0c]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
        aria-label={copy.library}
      >
        {tabButton('library', copy.library, <Library size={22} />, () => { setTab('library'); scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, tab === 'library')}
        {tabButton('continue', copy.continueTab, <Play size={22} />, resume, false, !lastStory)}
        {tabButton('journal', journalCopy.name, <Scroll size={22} />, () => { setTab('journal'); scrollRef.current?.scrollTo({ top: 0 }); }, tab === 'journal')}
        {tabButton('words', copy.myWords, <BookMarked size={22} />, () => { setTab('words'); scrollRef.current?.scrollTo({ top: 0 }); }, tab === 'words')}
        {tabButton('settings', copy.settings, <Settings size={22} />, () => setTab('settings'), tab === 'settings')}
      </nav>

      <AnimatePresence>
        {bookOpen && openBook && (
          <motion.div
            className="fixed inset-0 z-[120] bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenBook(null)}
          >
            <motion.div
              ref={bookSheetRef}
              role="dialog"
              aria-modal="true"
              aria-label={storyName(bookOpen)}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              onClick={event => event.stopPropagation()}
              className="absolute inset-x-0 bottom-0 max-h-[90svh] overflow-y-auto rounded-t-[26px] bg-[#151a16] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-start shadow-2xl"
              data-phone-book-sheet
              {...bookSheet.sheet}
            >
              <div className="-mx-5 -mt-3 mb-1 flex cursor-grab justify-center pb-3 pt-3" {...bookSheet.grip}>
                <span className="block h-1 w-10 rounded-full bg-white/25" aria-hidden="true" />
              </div>
              <div className="flex items-end gap-4">
                <img src={bookOpen.imageSmall ?? bookOpen.image} alt="" className="h-[138px] w-[110px] shrink-0 rounded-[14px] object-cover shadow-[0_16px_34px_rgba(0,0,0,0.5)]" />
                <div className="min-w-0 flex-1 pb-1">
                  <p className={cn('font-semibold', isRTL ? 'text-[13px]' : 'text-[10.5px] uppercase tracking-[0.14em]')} style={{ color: collectionVisuals[getStoryCollection(bookOpen.id)].accentBright }}>
                    {collectionLabels[getStoryCollection(bookOpen.id)]}
                  </p>
                  <h3 className={cn('mt-1 font-semibold leading-tight text-[#FFF9EC]', isRTL ? 'text-[24px]' : 'text-[21px]')}>{storyName(bookOpen)}</h3>
                </div>
                <button type="button" onClick={() => setOpenBook(null)} aria-label={copy.close} className="mb-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[#EDE5D4]/80">
                  <X size={18} />
                </button>
              </div>
              <p className={cn('mt-4 leading-relaxed text-[#EDE5D4]/75', isRTL ? 'text-[17px]' : 'text-[14px]')}>{storyDescription(bookOpen)}</p>
              <p className={cn('mb-2 mt-5 font-semibold text-[#EDE5D4]/60', isRTL ? 'text-[14px]' : 'text-[12px]')}>{copy.chooseLevel}</p>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map(option => {
                  const available = bookOpen.availableLevels.includes(option);
                  const progress = available ? summarizeBookProgress(bookOpen.id, option) : null;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={!available}
                      aria-pressed={openBook.level === option}
                      onClick={() => { onWarm(bookOpen.id, option); setOpenBook({ id: bookOpen.id, level: option }); }}
                      className={cn(
                        'min-h-14 rounded-2xl border-2 px-2 py-2 transition-colors disabled:opacity-25',
                        openBook.level === option ? 'border-[#E9C46A] bg-[#E9C46A]/12 text-[#FFF9EC]' : 'border-white/10 text-[#EDE5D4]/85',
                      )}
                    >
                      <span className="block text-[17px] font-semibold">{option}</span>
                      {progress && <span className="block text-[11px] tabular-nums text-[#EDE5D4]/60">{formatNumber(progress.percent)}%</span>}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  const resumeThis = lastActive?.prophetId === bookOpen.id && lastActive.level === openBook.level;
                  setOpenBook(null);
                  onLaunch(bookOpen.id, openBook.level, resumeThis ? { resume: true } : undefined);
                }}
                className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#ECCD7E,#B98A36)] text-[16px] font-semibold text-[#16130c]"
                data-home-read
              >
                {lastActive?.prophetId === bookOpen.id && lastActive.level === openBook.level ? copy.resume : copy.read} · {openBook.level}
                <ArrowRight size={16} mirrored={isRTL} />
              </button>
              {onOpenTeacherGuide && (
                <button
                  type="button"
                  onClick={() => { setOpenBook(null); onOpenTeacherGuide(bookOpen.id, openBook.level); }}
                  className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/12 text-[14px] font-semibold text-[#FFF9EC]"
                  data-teacher-shortcut
                >
                  <GraduationCap size={17} />
                  {copy.teacherGuide} {openBook.level}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
