import React, { useRef, useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'motion/react';
import { Rocket, ArrowRight } from '../ui/icons';
import { PageData, Hotspot, Exercise, TeacherGuideSection } from '../../types';
import { ReaderTour, isReaderTourDone } from '../ui/ReaderTour';
import { ExerciseModule } from '../ExerciseModule';
import { GroupTaskPanel, ICanPanel, type ICanStep, BeforeYouReadPanel, useBeforeYouRead, useICanProgress } from './ChapterExtras';
import { beforeYouReadSeconds } from '../../lib/chapterExtras';
import { LessonCard } from './LessonCard';
import { bestLanguageActivity, bestParagraph, sayItActivity, storyParagraphs } from '../../lib/iCanSteps';
import { useStoryImage } from '../../lib/mediaImage';
import { ImageUnavailable } from '../ui/ImageUnavailable';
import { cn } from '../../lib/utils';
import { markQuranVerses } from '../../lib/quranVerses';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoryProgress } from '../../contexts/StoryProgressContext';
import { MyWordsReminder } from './MyWordsPanel';
import { useFollowAlong } from './useFollowAlong';
import { timingsUrlFor } from '../../lib/followAlong';
import { HotspotButton } from './StoryHotspot';
import { getResponsiveStoryFontStyle, useStoryTextRenderer } from './useStoryText';
import { ChapterAudioBar, ChapterAudioElement, useChapterAudio } from './ChapterAudio';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { ChapterActivityRail, ChapterSteps, LanguageFocusPanel, QuickChallengePanel } from './ChapterActivities';
import { useDialogFocus } from '../../hooks/useDialogFocus';

// One chapter of the reader: title, steps and audio on top, picture and story text, then the chapter's activities.
// The parts live in their own files: the story text (useStoryText.tsx, StoryPoem.tsx), the picture points
// (StoryHotspot.tsx), the audio (ChapterAudio.tsx) and the activity cards (ChapterActivities.tsx).

export const StoryPage = ({ 
  page, 
  allPages,
  currentIndex,
  isDyslexic,
  showHighlights = true,
  followAlong = true,
  fontSize,
  level,
  storyId = '',
  collectionId = 'prophets',
  lessonSection,
}: { 
  page: PageData; 
  allPages: PageData[];
  currentIndex: number;
  isDyslexic: boolean;
  /** Off: the story reads as plain text, without Word Note and place card highlights. */
  showHighlights?: boolean;
  /** On: while the audio plays, the word being read fills with the book colour (when timings exist). */
  followAlong?: boolean;
  fontSize: number;
  level: string;
  /** Book id from the catalogue (e.g. 'ibrahim'); finds the verse passages the verse rule cannot see. */
  storyId?: string;
  collectionId?: string;
  /** The Teacher Guide section for this chapter; given only to teachers. */
  lessonSection?: TeacherGuideSection;
}) => {
  const { language, t, formatNumber, isRTL } = useLanguage();
  const { stats, trackExerciseComplete, trackChapterVisit } = useStoryProgress();
  const audio = useChapterAudio(page);
  const picture = useStoryImage(page.image);
  const { audioRef, isPlaying } = audio;
  // Wide screens (1024px+): title, steps and audio on top, activities as icons beside the picture.
  const isWide = useMediaQuery('(min-width: 1024px)');
  const isPhone = useMediaQuery('(max-width: 639px)');
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  // Completion lives in the shared progress, so a finished Quick Challenge stays finished when the reader comes back.
  const completedExercises = useMemo(() => [...stats.exercisesCompleted], [stats.exercisesCompleted]);
  const [isLanguageFocusOpen, setIsLanguageFocusOpen] = useState(false);
  const [isLessonCardOpen, setIsLessonCardOpen] = useState(false);
  // Wide screens: the group task or the I can list opened from the icons beside the picture.
  const [railPanel, setRailPanel] = useState<'group' | 'iCan' | null>(null);
  const railRef = useDialogFocus(isWide && railPanel !== null, () => setRailPanel(null));
  // First story page on this device: a three-step tour once the page has settled.
  const [isTourActive, setIsTourActive] = useState(false);
  useEffect(() => {
    if (page.type !== 'story' || isReaderTourDone()) return;
    const timer = window.setTimeout(() => setIsTourActive(true), 1100);
    return () => window.clearTimeout(timer);
  }, [page.type]);
  // "What's next": the chapter's audio finished, or the reader scrolled to the end of the text.
  const [audioEnded, setAudioEnded] = useState(false);
  const [textEndReached, setTextEndReached] = useState(false);
  const endSentinelsRef = useRef<Set<HTMLDivElement>>(new Set());

  useEffect(() => {
    if (page.type === 'story') trackChapterVisit(page.id);
    setIsLanguageFocusOpen(false);
    setAudioEnded(false);
    setTextEndReached(false);
  }, [page.id, page.type]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) setTextEndReached(true);
    });
    endSentinelsRef.current.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [page.id]);

  const registerEndSentinel = (node: HTMLDivElement | null) => {
    if (node) endSentinelsRef.current.add(node);
    else endSentinelsRef.current.clear();
  };

  // The reader's footer asks for the Quick Challenge when the reader tries to move on without it.
  useEffect(() => {
    const focusQuickChallenge = () => {
      const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-quick-challenge]'));
      const visible = panels.find(panel => panel.offsetParent !== null) ?? panels[0];
      visible?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const exercise = page.exercises?.[0];
      if (exercise) window.setTimeout(() => setActiveExercise(exercise), 450);
    };
    window.addEventListener('reader:focus-quick-challenge', focusQuickChallenge);
    return () => window.removeEventListener('reader:focus-quick-challenge', focusQuickChallenge);
  }, [page.id, page.exercises]);

  const highlightLanguage = language === 'ar' ? 'ar' : 'en';
  const followTextA = useRef<HTMLDivElement>(null);
  const followTextB = useRef<HTMLDivElement>(null);
  const followTextRefs = useMemo(() => [followTextA, followTextB], []);
  useFollowAlong({
    enabled: followAlong && page.type === 'story',
    timingsUrl: timingsUrlFor(page.audioUrl),
    audioRef,
    textRefs: followTextRefs,
    language: highlightLanguage,
    isPlaying,
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 30, stiffness: 100 });
  const springY = useSpring(mouseY, { damping: 30, stiffness: 100 });
  const rotateX = useTransform(springY, [-300, 300], [5, -5]);
  const rotateY = useTransform(springX, [-300, 300], [-5, 5]);
  const imageX = useTransform(springX, [-300, 300], [10, -10]);
  const imageY = useTransform(springY, [-300, 300], [10, -10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };
  const chunksWithIndices = useMemo(() => {
    if (!page.timedChunks) return [];
    let currentWordIdx = 0;
    return page.timedChunks.map(chunk => {
      const wordCount = chunk.text.split(/\s+/).filter(w => w.length > 0).length;
      const startIdx = currentWordIdx;
      const endIdx = currentWordIdx + wordCount - 1;
      currentWordIdx += wordCount;
      return { ...chunk, startIdx, endIdx };
    });
  }, [page.timedChunks]);
  void chunksWithIndices;

  const storyText = useMemo(
    () => markQuranVerses(page.content, /[\u0600-\u06FF]/.test(page.content) ? 'ar' : 'en', storyId, level, page.id),
    [page.content, page.id, storyId, level],
  );

  const renderContent = useStoryTextRenderer({ page, allPages, currentIndex, showHighlights, fontSize, collectionId });


  // Before you read: one optional guess above the story; the text is always visible.
  const extrasKey = `v2:${level}:${language}:${page.id}:${page.title}`;
  const beforeYouRead = useBeforeYouRead(`${extrasKey}:byr`);
  const renderBeforeYouRead = () => page.type === 'story' && page.beforeYouRead ? (
    <BeforeYouReadPanel
      data={page.beforeYouRead}
      language={language}
      state={beforeYouRead.state}
      onGuess={beforeYouRead.guess}
      onCheck={beforeYouRead.check}
      seconds={beforeYouReadSeconds(page.content)}
    />
  ) : null;
  const iCanProgress = useICanProgress(`${extrasKey}:ican`, page.iCan?.length ?? 0);
  // "Read the chapter again" from I can: close the window and bring the story text into view.
  // Scrolls to one paragraph of the story and marks it for a moment.
  const goToParagraph = (item: string) => {
    setRailPanel(null);
    const target = [followTextB.current, followTextA.current].find(node => node && node.offsetParent !== null);
    if (!target) return;
    const paragraphs = Array.from(target.querySelectorAll('p'));
    const index = bestParagraph(item, paragraphs.map(p => p.textContent ?? ''), language === 'ar');
    const paragraph = paragraphs[index] ?? target;
    window.setTimeout(() => {
      paragraph.scrollIntoView({ behavior: 'smooth', block: 'center' });
      paragraph.classList.add('ican-flash');
      window.setTimeout(() => paragraph.classList.remove('ican-flash'), 2600);
    }, 150);
  };
  const iCanSteps = useMemo((): ICanStep[] | undefined => {
    if (page.type !== 'story' || !page.iCan?.length) return undefined;
    const ar = language === 'ar';
    const num = (n: number) => (ar ? n.toLocaleString('ar-EG') : String(n));
    const focus = page.languageFocusExercises ?? [];
    const openExercise = (exercise: Exercise) => () => { setRailPanel(null); setActiveExercise(exercise); };
    return page.iCan.map((item, index): ICanStep => {
      if (index === 1) {
        const exercise = bestLanguageActivity(item, focus, ar);
        if (exercise) return {
          text: ar ? 'تَدَرَّبْ عَلَى هٰذَا فِي نَشَاطِ التَّرْكِيزِ اللُّغَوِيِّ:' : 'Practise it in this Language Focus activity:',
          actionLabel: exercise.title,
          action: openExercise(exercise),
        };
      }
      if (index === 2) {
        const sayIt = sayItActivity(focus);
        if (sayIt) return {
          text: sayIt.example ? (ar ? 'اِبْدَأْ هٰكَذَا:' : 'Start like this:') : (ar ? 'جَرِّبْهُ فِي نَشَاطِ «قُلْهَا».' : 'Try it in the “Say it” task.'),
          quote: sayIt.example,
          actionLabel: ar ? 'جَرِّبِ الآنَ' : 'Try it now',
          action: openExercise(sayIt.exercise),
        };
      }
      const paragraph = bestParagraph(item, storyParagraphs(storyText), ar);
      if (paragraph >= 0) return {
        text: ar ? `الفِقْرَةُ ${num(paragraph + 1)} تَحْكِي هٰذَا. اِقْرَأْهَا مَرَّةً أُخْرَى.` : `Paragraph ${paragraph + 1} tells this. Read it once more.`,
        actionLabel: ar ? `اِذْهَبْ إِلَى الفِقْرَةِ ${num(paragraph + 1)}` : `Go to paragraph ${paragraph + 1}`,
        action: () => goToParagraph(item),
      };
      return { text: ar ? 'اِقْرَأِ الفَصْلَ مَرَّةً أُخْرَى.' : 'Read the chapter once more.' };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, language, storyText]);
  const rereadChapter = () => {
    setRailPanel(null);
    const target = [followTextB.current, followTextA.current].find(node => node && node.offsetParent !== null);
    window.setTimeout(() => target?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  };
  const renderICan = (inWindow = false) => page.type === 'story' && page.iCan?.length ? (
    <ICanPanel
      items={page.iCan}
      steps={iCanSteps}
      language={language}
      storageKey={`${extrasKey}:ican`}
      onReread={rereadChapter}
      onDone={inWindow ? () => setRailPanel(null) : undefined}
    />
  ) : null;
  const renderGroupTask = () => page.type === 'story' && page.groupTask ? (
    <GroupTaskPanel key={extrasKey} task={page.groupTask} language={language} defaultOpen={isWide} />
  ) : null;

  const quickExercise = page.exercises?.[0];
  const quickDone = Boolean(quickExercise && completedExercises.includes(quickExercise.id));
  const focusExercises = page.languageFocusExercises ?? [];
  const focusDone = focusExercises.length > 0 && focusExercises.every(exercise => completedExercises.includes(exercise.id));
  const chapterExercises = [quickExercise, ...focusExercises].filter((exercise): exercise is Exercise => Boolean(exercise));
  // The chapter's activity order: Quick Challenge, Language Focus, then (desktop windows) Group task and I can.
  const nextActivityAfter = (current: Exercise): (() => void) | null => {
    const index = chapterExercises.findIndex(exercise => exercise.id === current.id);
    // Always the next one in order, done or not, so Quick Challenge leads to the first Language Focus.
    const nextExercise = index < 0 ? undefined : chapterExercises[index + 1];
    if (nextExercise) return () => setActiveExercise(nextExercise);
    if (isWide && page.type === 'story' && page.groupTask) return () => { setActiveExercise(null); setRailPanel('group'); };
    if (isWide && page.iCan?.length) return () => { setActiveExercise(null); setRailPanel('iCan'); };
    return null;
  };
  const activeNext = activeExercise ? nextActivityAfter(activeExercise) : null;
  const listened = audioEnded || stats.audioChaptersPlayed.has(page.id);

  // End of the text: a sentinel for the observer, and the call to the Quick Challenge once the reader is there.
  const renderNextUp = () => (
    <>
      <div ref={registerEndSentinel} className="h-px w-full" aria-hidden="true" />
      <AnimatePresence>
        {quickExercise && !quickDone && (audioEnded || textEndReached) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="mt-5 flex justify-end"
          >
            <button
              type="button"
              data-next-up
              onClick={() => setActiveExercise(quickExercise)}
              className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-700 px-5 font-display text-[12px] font-semibold text-white shadow-lg transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <Rocket size={15} />
              {t('nav.nextUpQuickChallenge')}
              <ArrowRight size={15} className={cn('transition-transform group-hover:translate-x-0.5', isRTL && 'rotate-180 group-hover:-translate-x-0.5')} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  // Listen · Read · Quick Challenge · Language Focus: what this chapter asks for and what is done.
  const onAudioEnded = () => setAudioEnded(true);
  const renderSteps = () => (
      <ChapterSteps
        page={page}
        listened={listened}
        textEndReached={textEndReached}
        quickExercise={quickExercise}
        quickDone={quickDone}
        focusExercises={focusExercises}
        focusDone={focusDone}
        lessonSection={lessonSection}
        onOpenExercise={setActiveExercise}
        onOpenLanguageFocus={() => setIsLanguageFocusOpen(true)}
        onOpenLessonCard={() => setIsLessonCardOpen(true)}
        progressOnly={isWide}
      />
  );
  const renderHeading = () => (
    <div className={cn("flex flex-col min-w-0", isRTL && "text-right")}>
      <h2 className="font-display text-[1.3rem] sm:text-3xl lg:text-4xl text-wood font-semibold tracking-[-0.03em] leading-tight lg:truncate clip-room">{page.title}</h2>
      <p className={cn(
        "font-serif text-xs sm:text-base lg:text-lg sm:mt-0.5",
        language !== 'ar' && "italic",
        "text-brand-600"
      )}>
        {t('nav.chapter')} {formatNumber(page.id)}
      </p>
      {renderSteps()}
    </div>
  );
  // Phones open a chapter like a story app: the picture first, a little wider than tall, with the
  // chapter title written on it. The 4:5 picture is cropped to 4:3 from its middle, so hotspots
  // are moved to match; one that falls outside the crop or onto the title is pulled just inside,
  // so every picture keeps all of its points.
  const phoneCover = isPhone && !isWide && Boolean(page.image);
  const shownHotspots = phoneCover
    ? (page.hotspots ?? []).map(hotspot => ({ ...hotspot, y: Math.min(Math.max((hotspot.y - 20) / 0.6, 6), 56) }))
    : page.hotspots ?? [];
  const renderAudioBar = () => !isWide && page.audioUrl && (
    <div className="sticky top-0 z-[90] !mt-2 sm:!mt-3 [&>div]:bg-brand-50">
      <ChapterAudioBar page={page} audio={audio} onEnded={onAudioEnded} withElement={false} />
    </div>
  );

  return (
    <div className="h-full flex flex-col relative overflow-hidden min-h-0">
      {/* One audio element for both layouts, so turning a tablet does not stop the sound */}
      <ChapterAudioElement page={page} audio={audio} onEnded={onAudioEnded} />

      {/* Wide screens: title, steps and audio stay on top. Phones and tablets scroll them with the story (below). */}
      {isWide && (
        <div className="flex flex-row items-center justify-between gap-4 mb-5 shrink-0">
          {renderHeading()}
          <div className="shrink-0 w-auto">
            <ChapterAudioBar page={page} audio={audio} onEnded={onAudioEnded} withElement={false} />
          </div>
        </div>
      )}

      {/* Dynamic responsive layout container */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Mobile View: Vertical scrolling stack */}
        <div className="block lg:hidden h-full overflow-y-auto custom-scrollbar px-0.5 sm:ps-0.5 sm:pe-4 space-y-4 sm:space-y-6">
          {/* The title and steps scroll away; the audio bar stays at the top of the text */}
          {!isWide && !phoneCover && renderHeading()}
          {!phoneCover && renderAudioBar()}
          {page.image && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-[60] group perspective-1000 w-full max-w-lg mx-auto"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ rotateX, rotateY }}
            >
              <div className={cn(
                "relative w-full rounded-[1.5rem] shadow-[0_24px_30px_-28px_rgba(0,0,0,0.55)] overflow-hidden",
                phoneCover ? "aspect-[4/3] rounded-[1.25rem]" : "aspect-[4/5]"
              )}>
                <motion.img 
                  key={picture.attempt}
                  src={picture.src}
                  onError={picture.onError}
                  alt={page.title}
                  className="w-full h-full object-cover transition-all duration-700"
                  referrerPolicy="no-referrer"
                  style={{ x: imageX, y: imageY, scale: 1.1 }}
                />
                
                {picture.failed && <ImageUnavailable onRetry={picture.retry} className={cn("absolute inset-0 z-[5]", phoneCover && "justify-start pt-8")} />}
                <div className="absolute inset-0 z-[70] p-4 pointer-events-none">
                  <div className="relative w-full h-full">
                     {!picture.failed && shownHotspots.map((hotspot) => (
                      <HotspotButton 
                        key={hotspot.id} 
                        hotspot={hotspot} 
                        isActive={activeHotspot?.id === hotspot.id}
                        onToggle={() => setActiveHotspot(activeHotspot?.id === hotspot.id ? null : hotspot)}
                        collectionId={collectionId}
                      />
                    ))}
                  </div>
                </div>
                {/* Only the phone writes the chapter title on the picture: a light shade under the title keeps it readable */}
                {phoneCover && (
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 from-0% via-black/15 via-30% to-transparent to-45% pointer-events-none" />
                )}
                {phoneCover && (
                  <div className={cn("absolute inset-x-0 bottom-0 z-[65] px-4 pb-3.5 text-white pointer-events-none", isRTL && "text-right")}>
                    <p className={cn("font-display font-semibold uppercase text-white/80", language === 'ar' ? "text-[13px]" : "text-[11px] tracking-[0.16em]")}>
                      {t('nav.chapter')} {formatNumber(page.id)}
                    </p>
                    <h2 className="font-display text-[1.35rem] font-semibold leading-tight tracking-[-0.02em] [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]">{page.title}</h2>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {phoneCover && <div className="!mt-3">{renderSteps()}</div>}
          {phoneCover && renderAudioBar()}

          {/* Text Content */}
          <div className="mx-auto max-w-[68ch] wide:max-w-none">
          {renderBeforeYouRead()}
          <div className="relative">
          <div 
            className={cn(
              "font-serif leading-[1.72] text-wood/90",
              isDyslexic ? "font-sans tracking-wide" : "",
              isRTL && "text-right"
            )}
            style={getResponsiveStoryFontStyle(fontSize, isRTL, isDyslexic)}
          >
            <div ref={followTextA}>{renderContent(storyText)}</div>
            {renderNextUp()}
          </div>
          </div>
          </div>

          <QuickChallengePanel page={page} completedExercises={completedExercises} onOpenExercise={setActiveExercise} />

          <LanguageFocusPanel page={page} completedExercises={completedExercises} onOpenExercise={setActiveExercise} isOpen={isLanguageFocusOpen} onToggle={() => setIsLanguageFocusOpen(open => !open)} mobile />

          {renderGroupTask()}
          {renderICan()}
          {page.type === 'story' && page.id === 1 && <MyWordsReminder />}
        </div>

        {/* Desktop View: Grid layout with Quick Challenge spanning both columns at bottom */}
        <div className="hidden lg:flex lg:flex-col h-full min-h-0 overflow-y-auto custom-scrollbar ps-0.5 pe-3 xl:pe-4 pb-4">
          <div className="grid grid-cols-12 gap-8 desk:gap-12 items-start">
            {/* Left side: Image */}
            <div className="col-span-5 self-start lg:sticky lg:top-0 flex items-start gap-3 xl:gap-4">
              <ChapterActivityRail
                page={page}
                completedExercises={completedExercises}
                onOpenExercise={setActiveExercise}
                onOpenPanel={setRailPanel}
                iCanRated={iCanProgress.rated}
              />
              <div className="min-w-0 flex-1">
              {page.image && (
                <motion.div 
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative z-[60] group perspective-1000 w-full"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{ rotateX, rotateY }}
                >
                  <div className="relative aspect-[4/5] w-full rounded-[1.25rem] shadow-[0_24px_30px_-28px_rgba(0,0,0,0.55)] overflow-hidden border border-gold/15">
                    <motion.img 
                      key={picture.attempt}
                      src={picture.src}
                      onError={picture.onError}
                      alt={page.title}
                      className="w-full h-full object-cover transition-all duration-700"
                      referrerPolicy="no-referrer"
                      style={{ x: imageX, y: imageY, scale: 1.1 }}
                    />
                    
                    {picture.failed && <ImageUnavailable onRetry={picture.retry} className="absolute inset-0 z-[5]" />}
                    <div className="absolute inset-0 z-[70] p-4 pointer-events-none">
                      <div className="relative w-full h-full">
                         {!picture.failed && page.hotspots?.map((hotspot) => (
                          <HotspotButton 
                            key={hotspot.id} 
                            hotspot={hotspot} 
                            isActive={activeHotspot?.id === hotspot.id}
                            onToggle={() => setActiveHotspot(activeHotspot?.id === hotspot.id ? null : hotspot)}
                            collectionId={collectionId}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              </div>
            </div>

            {/* Right side: Story text scrolling content */}
            <div className="col-span-7">
              <div className="w-full max-w-[72ch] desk:max-w-none">
              {renderBeforeYouRead()}
              <div className="relative">
              <div 
                className={cn(
                  "font-serif leading-[1.72] text-wood/90",
                  isDyslexic ? "font-sans tracking-wide" : "",
                  isRTL && "text-right"
                )}
                style={getResponsiveStoryFontStyle(fontSize, isRTL, isDyslexic)}
                  >
                <div ref={followTextB}>{renderContent(storyText)}</div>
                {renderNextUp()}
              </div>
                  </div>
              </div>
            </div>
          </div>


          {page.type === 'story' && page.id === 1 && <MyWordsReminder />}
        </div>
      </div>

      <AnimatePresence>
        {activeExercise && (
          <ExerciseModule
            exercise={activeExercise}
            onComplete={() => {
              trackExerciseComplete(activeExercise.id);
              setActiveExercise(null);
            }}
            onClose={() => setActiveExercise(null)}
            onNext={() => {
              trackExerciseComplete(activeExercise.id);
              if (activeNext) activeNext();
              else setActiveExercise(null);
            }}
            isLast={!activeNext}
            collectionId={collectionId}
            variant={
              page.exercises?.[0]?.id === activeExercise.id
                ? 'quick'
                : page.languageFocusExercises?.some(exercise => exercise.id === activeExercise.id)
                ? 'language'
                : 'default'
            }
          />
        )}
      </AnimatePresence>

      {createPortal(
        <AnimatePresence>
          {isWide && railPanel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] flex items-center justify-center bg-black/45 p-8 backdrop-blur-sm"
              onClick={() => setRailPanel(null)}
              ref={railRef}
              role="dialog"
              aria-modal="true"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <motion.div
                initial={{ y: 12, scale: 0.98 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 12, scale: 0.98 }}
                className="relative w-full max-w-3xl"
                onClick={event => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setRailPanel(null)}
                  className="absolute -end-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white font-display text-xl text-wood/75 shadow-lg ring-1 ring-black/5 hover:bg-brand-50"
                  aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
                >
                  ×
                </button>
                <div className="max-h-[85vh] overflow-y-auto custom-scrollbar rounded-[26px] [&>section]:mt-0">
                  {railPanel === 'group' ? renderGroupTask() : renderICan(true)}
                  {railPanel === 'group' && (
                    <div className="flex justify-center pt-4">
                      <button
                        type="button"
                        onClick={() => setRailPanel(page.iCan?.length ? 'iCan' : null)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-700 px-6 font-display text-xs font-bold uppercase tracking-widest text-white shadow-lg hover:bg-brand-800"
                      >
                        {page.iCan?.length
                          ? (language === 'ar' ? 'النشاط التالي' : 'Next activity')
                          : (language === 'ar' ? 'إنهاء' : 'Finish')}
                        <ArrowRight size={16} className={cn(isRTL && 'rotate-180')} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <ReaderTour active={isTourActive} onFinish={() => setIsTourActive(false)} />
      {lessonSection && (
        <LessonCard
          isOpen={isLessonCardOpen}
          onClose={() => setIsLessonCardOpen(false)}
          section={lessonSection}
          groupTask={page.type === 'story' ? page.groupTask : undefined}
          language={language}
        />
      )}
    </div>
  );
};
