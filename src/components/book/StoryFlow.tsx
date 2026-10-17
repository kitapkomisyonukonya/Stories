// Story mode (reader menu): the whole story on one page, chapter after chapter, without the activities between
// them. One audio bar plays the chapter being read and goes on to the next chapter by itself. After the last
// chapter comes "The End", then the activities: each chapter's Quick Challenge and Language Focus, and the
// pages after the story (map, Knowledge Check, glossary...). Highlighted words and follow along work as in the
// chapter pages.
import React, { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { ArrowRight } from '../ui/icons';
import { PageData, Exercise } from '../../types';
import { ExerciseModule } from '../ExerciseModule';
import { useStoryImage } from '../../lib/mediaImage';
import { ImageUnavailable } from '../ui/ImageUnavailable';
import { cn } from '../../lib/utils';
import { markQuranVerses } from '../../lib/quranVerses';
import { timingsUrlFor } from '../../lib/followAlong';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoryProgress } from '../../contexts/StoryProgressContext';
import { useFollowAlong } from './useFollowAlong';
import { getResponsiveStoryFontStyle, useStoryTextRenderer } from './useStoryText';
import { ChapterAudioBar, useChapterAudio, type ChapterAudio } from './ChapterAudio';
import { LanguageFocusPanel, QuickChallengePanel } from './ChapterActivities';

interface FlowProps {
  pages: PageData[];
  /** Index of the page the reader is on (the footer's page counter). */
  currentIndex: number;
  /** The chapter at the top of the screen changed: the footer's counter follows it. */
  onVisibleIndex: (index: number) => void;
  /** Opens a page after the story (map, Knowledge Check...). */
  onOpenPage: (index: number) => void;
  isDyslexic: boolean;
  showHighlights: boolean;
  followAlong: boolean;
  fontSize: number;
  level: string;
  storyId?: string;
  collectionId: string;
}

// memo: the audio bar's time ticks and the page counter re-render StoryFlow several times a second; a chapter
// re-renders only when its own props change (on phones re-rendering every chapter made scrolling and the
// audio bar lag).
const ChapterBlock = React.memo(({
  page, index, allPages, isActive, audioRef, isPlaying, near, isDyslexic, showHighlights, followAlong, fontSize, level, storyId, collectionId, flip,
}: {
  page: PageData;
  index: number;
  allPages: PageData[];
  isActive: boolean;
  audioRef: ChapterAudio['audioRef'];
  /** The audio is playing (only ever true for the active chapter). */
  isPlaying: boolean;
  /** Within two chapters of the one being read: its picture loads now, not when it scrolls into view. */
  near: boolean;
  isDyslexic: boolean;
  showHighlights: boolean;
  followAlong: boolean;
  fontSize: number;
  level: string;
  storyId?: string;
  collectionId: string;
  flip: boolean;
}) => {
  const { language, t, formatNumber, isRTL } = useLanguage();
  const renderContent = useStoryTextRenderer({ page, allPages, currentIndex: index, showHighlights, fontSize, collectionId });
  const storyText = useMemo(
    () => markQuranVerses(page.content, /[؀-ۿ]/.test(page.content) ? 'ar' : 'en', storyId ?? '', level, page.id),
    [page.content, page.id, storyId, level],
  );
  // Building a chapter's text (word notes, highlights) is the slow part; it only changes with these inputs, not
  // when the chapter becomes the one being read.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const text = useMemo(() => renderContent(storyText), [storyText, page, allPages, index, showHighlights, fontSize, collectionId, language]);
  const textRef = useRef<HTMLDivElement>(null);
  const textRefs = useMemo(() => [textRef], []);
  useFollowAlong({
    enabled: followAlong && isActive,
    timingsUrl: timingsUrlFor(page.audioUrl),
    audioRef,
    textRefs,
    language: language === 'ar' ? 'ar' : 'en',
    isPlaying,
  });
  const isChapter = Boolean(page.exercises?.length);
  const picture = useStoryImage(page.image);
  const pictureClass = cn(
    'mb-5 aspect-[4/5] w-full max-w-sm rounded-[1.25rem] object-cover shadow-[0_24px_30px_-28px_rgba(0,0,0,0.55)] sm:mx-auto md:mb-3 md:w-[38%] md:max-w-none',
    flip ? 'md:float-start md:me-7' : 'md:float-end md:ms-7',
  );

  return (
    <article className="pt-10 first:pt-2" data-story-chapter={index}>
      <header className={cn('mb-5', isRTL && 'text-right')}>
        {isChapter && (
          <p className={cn('font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600', language === 'ar' && 'text-sm normal-case tracking-normal')}>
            {t('nav.chapter')} {formatNumber(page.id)}
          </p>
        )}
        <h2 className="mt-1 font-display text-2xl sm:text-3xl font-semibold tracking-[-0.03em] leading-tight text-wood clip-room">{page.title}</h2>
      </header>
      <div
        className={cn('font-serif leading-[1.72] text-wood/90 flow-root', isDyslexic && 'font-sans tracking-wide', isRTL && 'text-right')}
        style={getResponsiveStoryFontStyle(fontSize, isRTL, isDyslexic)}
      >
        {page.image && (picture.failed ? (
          <ImageUnavailable onRetry={picture.retry} className={cn(pictureClass, 'overflow-hidden')} />
        ) : (
          <img
            key={picture.attempt}
            src={picture.src}
            onError={picture.onError}
            alt={page.title}
            referrerPolicy="no-referrer"
            loading={near ? 'eager' : 'lazy'}
            decoding="async"
            className={pictureClass}
          />
        ))}
        <div ref={textRef}>{text}</div>
      </div>
    </article>
  );
});

export const StoryFlow = ({
  pages, currentIndex, onVisibleIndex, onOpenPage, isDyslexic, showHighlights, followAlong, fontSize, level, storyId, collectionId,
}: FlowProps) => {
  const { language, t, formatNumber, isRTL } = useLanguage();
  const { stats, trackExerciseComplete, trackChapterVisit, trackAudioChapter } = useStoryProgress();
  const ar = language === 'ar';
  const storyIndexes = useMemo(() => pages.map((p, i) => (p.type === 'story' ? i : -1)).filter(i => i >= 0), [pages]);
  const lastStory = storyIndexes[storyIndexes.length - 1] ?? 0;
  const afterStory = useMemo(() => pages.map((p, i) => ({ p, i })).filter(({ p, i }) => i > lastStory && p.type !== 'story'), [pages, lastStory]);

  const [activeIndex, setActiveIndex] = useState(() => (pages[currentIndex]?.type === 'story' ? currentIndex : storyIndexes[0] ?? 0));
  const activePage = pages[activeIndex];
  const audio = useChapterAudio(activePage);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [openFocus, setOpenFocus] = useState<number | null>(null);
  const completedExercises = useMemo(() => [...stats.exercisesCompleted], [stats.exercisesCompleted]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const reportedRef = useRef(currentIndex);
  // every index reported while scrolling, until the counter has caught up (the reports are deferred)
  const reportedSinceRef = useRef(new Set<number>());
  const playNextRef = useRef(false);
  const chapterEl = (i: number) => scrollRef.current?.querySelector<HTMLElement>(`[data-story-chapter="${i}"]`);

  // Open on the chapter the reader came from; later, follow the footer's buttons.
  const firstRef = useRef(true);
  useEffect(() => {
    const first = firstRef.current;
    firstRef.current = false;
    // The counter only followed the scroll: nothing to do.
    if (!first && reportedSinceRef.current.has(currentIndex)) {
      if (currentIndex === reportedRef.current) reportedSinceRef.current.clear();
      return;
    }
    if (pages[currentIndex]?.type !== 'story') return;
    reportedRef.current = currentIndex;
    if (!audio.isPlaying) setActiveIndex(currentIndex);
    chapterEl(currentIndex)?.scrollIntoView({ block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // The chapter at the top of the screen becomes the one the audio bar plays (while nothing is playing).
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = root.getBoundingClientRect().top + root.clientHeight * 0.3;
      let i = -1;
      root.querySelectorAll<HTMLElement>('[data-story-chapter]').forEach(el => {
        if (el.getBoundingClientRect().top <= line) i = Number(el.dataset.storyChapter);
      });
      if (i < 0) i = storyIndexes[0] ?? 0;
      if (reportedRef.current !== i) {
        reportedRef.current = i;
        reportedSinceRef.current.add(i);
        // the page counter and reading progress re-render much of the app: let scrolling go first
        startTransition(() => {
          if (pages[i]?.exercises?.length) trackChapterVisit(pages[i].id);
          onVisibleIndex(i);
        });
      }
      setActiveIndex(current => (audio.isPlaying ? current : i));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => { root.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, audio.isPlaying]);

  // A chapter's audio ended: the next chapter with audio plays, and the page goes there.
  const handleEnded = () => {
    const next = storyIndexes.find(i => i > activeIndex && pages[i].audioUrl);
    if (next === undefined) return;
    playNextRef.current = true;
    setActiveIndex(next);
    chapterEl(next)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  useEffect(() => {
    const el = audio.audioRef.current;
    if (!playNextRef.current || !el) return;
    playNextRef.current = false;
    el.playbackRate = audio.speed;
    el.play().then(() => {
      audio.setIsPlaying(true);
      trackAudioChapter(activePage.id);
    }).catch(() => audio.setIsPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const activityChapters = storyIndexes.filter(i => pages[i].exercises?.length || pages[i].languageFocusExercises?.length);
  const variantOf = (exercise: Exercise) => {
    const owner = pages.find(p => p.exercises?.some(e => e.id === exercise.id) || p.languageFocusExercises?.some(e => e.id === exercise.id));
    if (owner?.exercises?.[0]?.id === exercise.id) return 'quick' as const;
    if (owner?.languageFocusExercises?.some(e => e.id === exercise.id)) return 'language' as const;
    return 'default' as const;
  };

  // The activities list re-renders only when its own data changes, not with the page counter or the audio bar.
  const openPageRef = useRef(onOpenPage);
  openPageRef.current = onOpenPage;
  const activities = useMemo(() => (
      <section aria-label={ar ? 'الأنشطة' : 'Activities'} data-story-activities>
        <h3 className={cn('font-display text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-wood clip-room', isRTL && 'text-right')}>
          {ar ? 'الأنشطة' : 'Activities'}
        </h3>
        <p className={cn('mt-1 font-serif text-sm sm:text-base text-wood/60', isRTL && 'text-right')}>
          {ar ? 'لكل فصل تحدٍّ سريع وتركيز لغوي. اختر ما تريد.' : 'Each chapter has a Quick Challenge and Language Focus. Choose what you want to do.'}
        </p>

        {activityChapters.map(i => (
          <div key={i} className="mt-8" data-story-activity-chapter={i}>
            <p className={cn('font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-700', ar && 'text-sm normal-case tracking-normal', isRTL && 'text-right')}>
              {t('nav.chapter')} {formatNumber(pages[i].id)} · {pages[i].title}
            </p>
            <QuickChallengePanel page={pages[i]} completedExercises={completedExercises} onOpenExercise={setActiveExercise} />
            <LanguageFocusPanel
              page={pages[i]}
              completedExercises={completedExercises}
              onOpenExercise={setActiveExercise}
              isOpen={openFocus === i}
              onToggle={() => setOpenFocus(open => (open === i ? null : i))}
            />
          </div>
        ))}

        {afterStory.length > 0 && (
          <div className="mt-12">
            <h4 className={cn('font-display text-lg font-semibold text-wood', isRTL && 'text-right')}>
              {ar ? 'بعد القصة' : 'After the story'}
            </h4>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {afterStory.map(({ p, i }) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => openPageRef.current(i)}
                  className="group flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-white/80 px-4 py-3 text-start ring-1 ring-brand-100 transition-colors hover:bg-white hover:ring-brand-300"
                  data-story-after-page={i}
                >
                  <span className="font-display text-sm font-semibold text-brand-950">{p.title}</span>
                  <ArrowRight size={16} className={cn('shrink-0 text-brand-700 opacity-60 group-hover:opacity-100', isRTL && 'rotate-180')} />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [pages, activityChapters.join(','), afterStory, completedExercises, openFocus, language, isRTL]);

  return (
    <div className="h-full flex flex-col min-h-0" data-story-flow>
      {/* The audio bar stays on top while the story scrolls */}
      {activePage?.audioUrl && (
        <div className="mb-2 flex shrink-0 flex-col gap-1.5 sm:mb-3 sm:flex-row sm:items-center sm:gap-2 sm:justify-between">
          <p className={cn('min-w-0 truncate font-display text-xs font-semibold text-wood/75 sm:text-sm', isRTL && 'text-right')}>
            {t('nav.chapter')} {formatNumber(activePage.id)} · {activePage.title}
          </p>
          <div className="shrink-0 w-full sm:w-auto">
            <ChapterAudioBar page={activePage} audio={audio} onEnded={handleEnded} />
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-0.5 sm:pe-4">
        <div className="mx-auto max-w-[76ch] wide:max-w-[90ch] pb-10">
          {storyIndexes.map((i, n) => (
            <ChapterBlock
              key={pages[i].id + '-' + i}
              page={pages[i]}
              index={i}
              allPages={pages}
              isActive={i === activeIndex}
              audioRef={audio.audioRef}
              isPlaying={i === activeIndex && audio.isPlaying}
              near={Math.abs(n - storyIndexes.indexOf(activeIndex)) <= 2}
              isDyslexic={isDyslexic}
              showHighlights={showHighlights}
              followAlong={followAlong}
              fontSize={fontSize}
              level={level}
              storyId={storyId}
              collectionId={collectionId}
              flip={n % 2 === 1}
            />
          ))}

          {/* The end of the story; the activities come after it */}
          <div className="my-16 flex flex-col items-center text-center" data-story-end>
            <p className="font-display text-4xl sm:text-5xl font-semibold tracking-[-0.03em] text-wood clip-room">
              {ar ? 'النِّهَايَةُ' : 'The End'}
            </p>
          </div>

          {activities}
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
            collectionId={collectionId}
            variant={variantOf(activeExercise)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
