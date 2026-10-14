import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Volume2, VolumeX } from '../ui/icons';
import { PageData, Level } from '../../types';
import { KnowledgeCheck } from '../exercises/KnowledgeCheck';
import { VocabularyMatch } from '../exercises/VocabularyMatch';
import { ExerciseModule } from '../ExerciseModule';
import { EndCard } from '../exercises/ExerciseFeedback';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoryProgress } from '../../contexts/StoryProgressContext';

import { SECTION_ICONS } from '../../lib/sectionIcons';
import { cn } from '../../lib/utils';

export const ExercisePage = ({ 
  page, 
  userAnswers, 
  handleAnswer,
  level,
  collectionId = 'prophets',
  onReviewGlossary,
  onNextPage,
  nextPageLabel,
}: { 
  page: PageData; 
  userAnswers: Record<string, boolean | null>; 
  handleAnswer: (id: string, answer: boolean) => void;
  level: Level;
  collectionId?: string;
  onReviewGlossary?: () => void;
  /** Opens the next page of the book; only the closing card calls it, never a timer. */
  onNextPage?: () => void;
  nextPageLabel?: string;
}) => {
  const { language, formatNumber } = useLanguage();
  const { trackExerciseComplete } = useStoryProgress();
  const isArabic = language === 'ar';
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewDone, setReviewDone] = useState(false);
  // Language Review items whose first try was right, for the closing card.
  const [reviewFirstTry, setReviewFirstTry] = useState<Record<string, boolean>>({});

  const colTheme = {
        audioBg: "bg-brand-50/90 border-brand-200 backdrop-blur-md shadow-lg",
        audioBtn: "bg-brand-700 hover:bg-brand-800 text-white",
        audioSlider: "text-brand-600 bg-brand-200",
        audioIcon: "hover:bg-brand-200/50 text-brand-600",
        speedBtn: "bg-brand-100/80 text-brand-700 hover:bg-brand-200",
        containerBorder: "border-brand-100",
        iconBg: "bg-brand-600 text-white",
        iconText: "text-brand-600",
        quizSectionBorder: "border-brand-200/60",
        exerciseTitle: "text-brand-900",
        exerciseBtnHover: "hover:border-brand-400 hover:shadow-brand-50/50",
        exerciseIdxBg: "bg-brand-100 text-brand-700",
        exerciseArrowColor: "text-brand-400"
      };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setVolume(vol);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (volume > 0) {
        audioRef.current.volume = 0;
        setVolume(0);
      } else {
        audioRef.current.volume = 1;
        setVolume(1);
      }
    }
  };

  const handleSpeedChange = () => {
    const nextSpeeds: Record<number, number> = {
      1: 1.25,
      1.25: 1.5,
      1.5: 1.75,
      1.75: 2,
      2: 1
    };
    const newSpeed = nextSpeeds[speed] || 1;
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
      setSpeed(newSpeed);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Remove audio for pages 11, 12, 13 (indices 10, 11, 12)
  const hideAudio = page.id === 11 || page.id === 12 || page.id === 13;

  const languageReviewExercises = page.type === 'exercises' ? (page.exercises ?? []) : [];
  const reviewTotal = languageReviewExercises.length;
  const noticeCount = reviewTotal > 0 ? Math.max(2, Math.round(reviewTotal * 0.3)) : 0;
  const useCount = reviewTotal > 0 ? Math.max(2, Math.round(reviewTotal * 0.25)) : 0;
  const buildCount = Math.max(0, reviewTotal - noticeCount - useCount);
  const buildStart = noticeCount;
  const useStart = noticeCount + buildCount;
  const reviewStageIndex = reviewIndex < buildStart ? 0 : reviewIndex < useStart ? 1 : 2;
  const reviewStageStarts = [0, buildStart, useStart];
  const reviewStageLabels = level === 'A2'
    ? (isArabic ? ['انظر', 'تدرّب', 'استخدم'] : ['Look', 'Practice', 'Use'])
    : (isArabic ? ['لاحظ', 'طبّق', 'استخدم'] : ['Notice', 'Build', 'Use']);

  React.useEffect(() => {
    setReviewIndex(0);
    setCompletedExercises([]);
  }, [page.id, language]);

  const isReviewStageUnlocked = (stageIndex: number) => {
    const start = reviewStageStarts[stageIndex] ?? 0;
    if (start === 0) return true;
    return languageReviewExercises
      .slice(0, start)
      .every(exercise => completedExercises.includes(exercise.id));
  };

  return (
    <div className="h-full relative flex flex-col">
      {/* Top Bar: Audio (Right) */}
      <div className="absolute top-0 right-0 z-50">
        {/* Fixed Audio Player - Top Right */}
        {page.audioUrl && !hideAudio && (
          <div className={cn(
            "flex items-center gap-4 p-3 rounded-2xl border backdrop-blur-md shadow-lg transition-all shrink-0",
            colTheme.audioBg
          )}>
            <audio 
              ref={audioRef} 
              src={page.audioUrl} 
              onEnded={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />
            
            <button
              onClick={toggleAudio}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md shrink-0",
                colTheme.audioBtn
              )}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
            </button>

            <div className="flex flex-col w-32 gap-1 translate-y-1.5">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className={cn(
                  "w-full h-1 rounded-lg appearance-none cursor-pointer accent-current",
                  colTheme.audioSlider
                )}
              />
              <div className="flex justify-between text-[11px] font-mono opacity-80">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 group/vol">
              <button 
                onClick={toggleMute}
                className={cn(
                  "p-1.5 rounded-full transition-colors shrink-0",
                  colTheme.audioIcon
                )}
              >
                {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 flex items-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className={cn(
                    "w-16 h-1 rounded-lg appearance-none cursor-pointer accent-current",
                    colTheme.audioSlider
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleSpeedChange}
                className={cn(
                  "px-2 py-0.5 text-[11px] font-bold rounded-lg transition-colors shrink-0",
                  colTheme.speedBtn
                )}
              >
                {speed}x
              </button>
            </div>
          </div>
        )}
      </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group h-full flex flex-col justify-center w-full min-h-0 flex-1"
        >
          <div className={cn(
            "relative bg-white/40 backdrop-blur-sm rounded-2xl sm:rounded-3xl border-2 p-3 sm:p-4 md:p-5 h-full flex flex-col overflow-y-auto custom-scrollbar",
            // Phones: no frame around the page, the exercise is the screen (as in Final Challenge).
            "max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:backdrop-blur-none",
            colTheme.containerBorder
          )}>
            <div className="flex-1 min-h-0 flex flex-col h-full">
              {page.type === 'quiz' && page.exercises && (
                <KnowledgeCheck 
                  title={page.title} 
                  exercises={page.exercises} 
                  userAnswers={userAnswers} 
                  handleAnswer={handleAnswer} 
                  collectionId={collectionId}
                  onComplete={(exerciseIds) => exerciseIds.forEach(trackExerciseComplete)}
                  onNextPage={onNextPage}
                  nextPageLabel={nextPageLabel}
                />
              )}
              {page.type === 'vocabulary-match' && page.vocabularyPairs && (
                <div className="h-full flex flex-col min-h-0">
                  <VocabularyMatch
                    pairs={page.vocabularyPairs}
                    collectionId={collectionId}
                    level={level}
                    onReviewGlossary={onReviewGlossary}
                    onComplete={() => trackExerciseComplete(`vocabulary-${page.id}`)}
                    onNextPage={onNextPage}
                    nextPageLabel={nextPageLabel}
                  />
                </div>
              )}
              {page.type === 'exercises' && page.exercises && (
                <div className="h-full min-h-0 overflow-y-auto px-0.5 pt-0.5 pe-1 custom-scrollbar">
                  <div className="mx-auto w-full max-w-5xl desk:max-w-[84rem] wide:max-w-none space-y-4 pb-4">
                    <section className={cn(
                      "rounded-[28px] bg-white/68 p-5 sm:p-6 max-sm:rounded-none max-sm:bg-transparent max-sm:p-0"
                    )}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        {/* Phones: the page name is in the top bar, so only the task counter stays. */}
                        <div className="min-w-0 max-sm:hidden">
                          <p className={cn(
                            "font-display text-[11px] font-semibold uppercase tracking-[0.18em]",
                            colTheme.iconText
                          )}>
                            {isArabic ? 'بعد المفردات' : 'After vocabulary'}
                          </p>
                          <h3 className={cn(
                            "mt-1 font-display text-2xl font-semibold tracking-[-0.03em] sm:text-3xl",
                            "flex items-center gap-2.5",
                            colTheme.exerciseTitle
                          )}>
                            <SECTION_ICONS.languageReview.icon size={26} aria-hidden="true" className="shrink-0" />
                            {isArabic ? 'مراجعة اللغة' : 'Language Review'}
                          </h3>
                          <p className={cn(
                            "mt-2 max-w-2xl font-serif leading-relaxed text-wood/58 max-sm:hidden",
                            isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                          )}>
                            {level === 'A2'
                              ? (isArabic
                                  ? 'انظر إلى لغة القصة، تدرّب عليها، ثم استخدمها بنفسك.'
                                  : 'Look at language from the story, practise it, then use it yourself.')
                              : page.content}
                          </p>
                        </div>

                        <div className="shrink-0 sm:min-w-[170px]">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-wood/60">
                              {isArabic ? 'المهمة' : 'Task'}
                            </span>
                            <span className={cn("shrink-0 whitespace-nowrap font-display text-sm font-semibold tabular-nums", colTheme.iconText)}>
                              {formatNumber(Math.min(reviewIndex + 1, reviewTotal))} / {formatNumber(reviewTotal)}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                            <motion.div
                              initial={false}
                              animate={{ width: `${reviewTotal ? ((reviewIndex + 1) / reviewTotal) * 100 : 0}%` }}
                              className={cn("h-full rounded-full", 'bg-brand-600')}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-2 max-sm:hidden">
                        {reviewStageLabels.map((label, stageIndex) => {
                          const unlocked = isReviewStageUnlocked(stageIndex);
                          const active = reviewStageIndex === stageIndex;
                          const complete = reviewStageStarts[stageIndex + 1] !== undefined
                            ? languageReviewExercises
                                .slice(reviewStageStarts[stageIndex], reviewStageStarts[stageIndex + 1])
                                .every(exercise => completedExercises.includes(exercise.id))
                            : languageReviewExercises
                                .slice(reviewStageStarts[stageIndex])
                                .every(exercise => completedExercises.includes(exercise.id));

                          return (
                            <button
                              key={label}
                              type="button"
                              disabled={!unlocked}
                              onClick={() => { if (!unlocked) return; setReviewDone(false); setReviewIndex(reviewStageStarts[stageIndex]); }}
                              className={cn(
                                "min-h-11 rounded-xl px-2 py-2 font-display text-[12px] font-semibold transition-all ring-1 sm:text-xs md:text-sm",
                                active
                                  ? cn(colTheme.exerciseIdxBg, 'ring-current/15')
                                  : complete
                                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                  : unlocked
                                  ? 'bg-white text-wood/75 ring-black/[0.07] hover:bg-white/85'
                                  : 'cursor-not-allowed bg-white/45 text-wood/50 ring-black/[0.04]'
                              )}
                            >
                              {complete ? '✓ ' : ''}{label}
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    {reviewDone ? (
                      <EndCard
                        title={isArabic ? 'اكتملت مراجعة اللغة' : 'Language Review complete'}
                        firstTry={{ right: Object.values(reviewFirstTry).filter(Boolean).length, total: reviewTotal }}
                        onRestart={() => {
                          setReviewFirstTry({});
                          setCompletedExercises([]);
                          setReviewIndex(0);
                          setReviewDone(false);
                        }}
                        onNext={onNextPage}
                        nextLabel={nextPageLabel}
                      />
                    ) : languageReviewExercises[reviewIndex] && (
                      <ExerciseModule
                        key={languageReviewExercises[reviewIndex].id}
                        exercise={languageReviewExercises[reviewIndex]}
                        variant="review"
                        embedded
                        collectionId={collectionId}
                        onClose={() => undefined}
                        onFirstTry={(right) => {
                          const exerciseId = languageReviewExercises[reviewIndex].id;
                          setReviewFirstTry(previous => exerciseId in previous ? previous : { ...previous, [exerciseId]: right });
                        }}
                        onComplete={() => {
                          const exerciseId = languageReviewExercises[reviewIndex].id;
                          trackExerciseComplete(exerciseId);
                          setCompletedExercises(previous =>
                            previous.includes(exerciseId) ? previous : [...previous, exerciseId]
                          );
                          if (reviewIndex < reviewTotal - 1) {
                            setReviewIndex(index => index + 1);
                          } else {
                            setReviewDone(true);
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

    </div>
  );
};