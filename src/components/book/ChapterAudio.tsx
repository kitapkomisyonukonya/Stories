// The chapter's audio: player state (useChapterAudio) and the player bar (moved from StoryPage.tsx, unchanged).
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Volume2, VolumeX, Lock, LoaderCircle, RotateCcw } from '../ui/icons';
import { PageData } from '../../types';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoryProgressActions } from '../../contexts/StoryProgressContext';

export const useChapterAudio = (page: PageData) => {
  const { formatNumber } = useLanguage();
  const { trackAudioChapter } = useStoryProgressActions();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [audioMenu, setAudioMenu] = useState<'volume' | 'speed' | null>(null);
  const audioControlsRef = useRef<HTMLDivElement>(null);

  // 'loading' while the narration downloads after Play, 'error' when it could not load.
  const [status, setStatus] = useState<'ready' | 'loading' | 'error'>('ready');

  const toggleAudio = () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
      return;
    }
    // After a failed download the element has to be asked again before it can play.
    if (status === 'error') el.load();
    setStatus('loading');
    el.play().catch((error: DOMException) => {
      if (error?.name === 'AbortError') return;
      setIsPlaying(false);
      // NotAllowedError: the browser wants a tap first; the button simply stays on Play.
      setStatus(error?.name === 'NotAllowedError' ? 'ready' : 'error');
    });
  };

  // The chapter counts as listened to only once the narration really plays.
  const handlePlaying = () => {
    setIsPlaying(true);
    setStatus('ready');
    if (page.type === 'story') trackAudioChapter(page.id);
  };

  const handleWaiting = () => setStatus('loading');

  const handleError = () => {
    setIsPlaying(false);
    setStatus('error');
  };

  // A connection that hangs without an error is treated as a failed download after 20 seconds.
  useEffect(() => {
    if (status !== 'loading') return;
    const timer = window.setTimeout(() => {
      const el = audioRef.current;
      if (el && el.readyState < 3) {
        el.pause();
        handleError();
      }
    }, 20_000);
    return () => window.clearTimeout(timer);
  }, [status]);

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

  const setPlaybackSpeed = (newSpeed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
    setSpeed(newSpeed);
    setAudioMenu(null);
  };

  useEffect(() => {
    const closeAudioMenus = (event: PointerEvent) => {
      if (!audioControlsRef.current?.contains(event.target as Node)) {
        setAudioMenu(null);
      }
    };

    document.addEventListener('pointerdown', closeAudioMenus);
    return () => document.removeEventListener('pointerdown', closeAudioMenus);
  }, []);

  useEffect(() => {
    setAudioMenu(null);
    setStatus('ready');
  }, [page.id]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return formatNumber(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  };

  return {
    audioRef, audioControlsRef, isPlaying, setIsPlaying, status, currentTime, duration, volume, speed, audioMenu, setAudioMenu,
    toggleAudio, handleTimeUpdate, handleLoadedMetadata, handlePlaying, handleWaiting, handleError, handleSeek, handleVolumeChange, toggleMute, setPlaybackSpeed, formatTime,
  };
};

export type ChapterAudio = ReturnType<typeof useChapterAudio>;

/** The chapter's audio element on its own, for a page that moves the player bar between layouts without stopping the sound. */
export const ChapterAudioElement = ({ page, audio, onEnded }: { page: PageData; audio: ChapterAudio; onEnded: () => void }) =>
  page.audioUrl ? (
    <audio
      ref={audio.audioRef}
      src={page.audioUrl}
      onEnded={() => { audio.setIsPlaying(false); onEnded(); }}
      onTimeUpdate={audio.handleTimeUpdate}
      onLoadedMetadata={audio.handleLoadedMetadata}
      onPlaying={audio.handlePlaying}
      onWaiting={audio.handleWaiting}
      onError={audio.handleError}
    />
  ) : null;

/** The player bar; onEnded runs when the chapter's audio has played to the end. withElement false: the page renders ChapterAudioElement itself. */
export const ChapterAudioBar = ({ page, audio, onEnded, withElement = true }: { page: PageData; audio: ChapterAudio; onEnded: () => void; withElement?: boolean }) => {
  const { language } = useLanguage();
  const {
    audioControlsRef, isPlaying, status, currentTime, duration, volume, speed, audioMenu, setAudioMenu,
    toggleAudio, handleSeek, handleVolumeChange, toggleMute, setPlaybackSpeed, formatTime,
  } = audio;
  const isAudioLocked = false;
  const ar = language === 'ar';
  const failed = status === 'error';

  return (
    <>
          {page.audioUrl && (
            <div
              ref={audioControlsRef}
              dir="ltr"
              className={cn(
                "relative z-[90] flex w-full items-center gap-2 rounded-xl border px-1.5 py-1.5 shadow-[0_18px_24px_-22px_rgba(63,49,28,0.45)] backdrop-blur-md sm:w-[430px] sm:gap-3 sm:rounded-2xl sm:px-3 sm:py-3 lg:w-[460px] lg:py-1.5 lg:px-2",
                "bg-brand-50/88 border-brand-200/90"
              )}
            >
              {withElement && <ChapterAudioElement page={page} audio={audio} onEnded={onEnded} />}

              <button
                type="button"
                onClick={isAudioLocked ? undefined : toggleAudio}
                disabled={isAudioLocked}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-[0_7px_18px_rgba(63,49,28,0.16)] transition-all active:scale-[0.97] sm:h-12 sm:w-12 lg:h-10 lg:w-10",
                  isAudioLocked
                    ? "bg-gray-400 text-white cursor-not-allowed opacity-60"
                    : "bg-brand-700 text-white hover:bg-brand-800"
                )}
                aria-label={failed
                  ? (ar ? 'حَاوِلْ تَشْغِيلَ الصَّوْتِ مَرَّةً أُخْرَى' : 'Try the audio again')
                  : isPlaying ? (language === 'ar' ? 'إيقاف مؤقت' : 'Pause audio') : (language === 'ar' ? 'تشغيل' : 'Play audio')}
                aria-busy={status === 'loading'}
              >
                {isAudioLocked
                  ? <Lock size={17} />
                  : failed
                  ? <RotateCcw size={18} />
                  : status === 'loading'
                  ? <LoaderCircle size={19} className="animate-spin motion-reduce:animate-none" />
                  : isPlaying
                  ? <Pause size={18} />
                  : <Play size={19} className="translate-x-[1px]" />}
              </button>

              <div className="min-w-0 flex-1">
                {failed ? (
                  <p role="status" dir={ar ? 'rtl' : 'ltr'} className={cn('px-1 font-display font-semibold leading-snug text-wood/75', ar ? 'text-[13px]' : 'text-[12px]')}>
                    {ar ? 'لَمْ يُحَمَّلِ الصَّوْتُ.' : 'The audio did not load.'}{' '}
                    <button type="button" onClick={toggleAudio} className="text-brand-700 underline underline-offset-2 hover:text-brand-800">
                      {ar ? 'حَاوِلْ مَرَّةً أُخْرَى' : 'Try again'}
                    </button>
                  </p>
                ) : (
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="w-9 shrink-0 text-start font-mono text-[11px] font-semibold tabular-nums text-wood/70 sm:w-10 sm:text-[11px]">
                    {formatTime(currentTime)}
                  </span>

                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    disabled={isAudioLocked}
                    aria-label={language === 'ar' ? 'تقدّم الصوت' : 'Audio progress'}
                    className={cn(
                      "h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full accent-current",
                      isAudioLocked
                        ? "cursor-not-allowed opacity-30"
                        : "bg-brand-200 text-brand-700"
                    )}
                  />

                  <span className="w-9 shrink-0 text-end font-mono text-[11px] font-semibold tabular-nums text-wood/70 sm:w-10 sm:text-[11px]">
                    {formatTime(duration)}
                  </span>
                </div>
                )}
              </div>

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setAudioMenu(current => current === 'volume' ? null : 'volume')}
                  disabled={isAudioLocked}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors sm:h-10 sm:w-10",
                    isAudioLocked
                      ? "cursor-not-allowed opacity-30"
                      : audioMenu === 'volume'
                      ? "bg-brand-100 text-brand-800"
                      : "text-brand-700 hover:bg-brand-100"
                  )}
                  aria-label={language === 'ar' ? 'مستوى الصوت' : 'Volume'}
                  aria-expanded={audioMenu === 'volume'}
                >
                  {volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
                </button>

                <AnimatePresence>
                  {audioMenu === 'volume' && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.14, ease: 'easeOut' }}
                      className="absolute end-0 top-[calc(100%+0.55rem)] z-50 w-48 rounded-2xl border border-black/[0.07] bg-white/96 p-3.5 shadow-2xl backdrop-blur-xl"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={toggleMute}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[0.045] text-wood/65 transition-colors hover:bg-black/[0.08]"
                          aria-label={volume === 0 ? (language === 'ar' ? 'إلغاء كتم الصوت' : 'Unmute') : (language === 'ar' ? 'كتم الصوت' : 'Mute')}
                        >
                          {volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
                        </button>

                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={handleVolumeChange}
                          aria-label={language === 'ar' ? 'مستوى الصوت' : 'Volume level'}
                          className={cn(
                            "h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full accent-current",
                            "bg-brand-200 text-brand-700"
                          )}
                        />

                        <span className="w-9 shrink-0 text-end font-mono text-[11px] font-semibold tabular-nums text-wood/70">
                          {Math.round(volume * 100)}%
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setAudioMenu(current => current === 'speed' ? null : 'speed')}
                  disabled={isAudioLocked}
                  className={cn(
                    "flex h-9 min-w-[46px] items-center justify-center rounded-full px-2.5 font-display text-[11px] font-semibold tabular-nums transition-colors sm:h-10 sm:min-w-[50px]",
                    isAudioLocked
                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                      : audioMenu === 'speed'
                      ? "bg-brand-100 text-brand-800"
                      : "bg-brand-50 text-brand-800 hover:bg-brand-100"
                  )}
                  aria-label={language === 'ar' ? 'سرعة التشغيل' : 'Playback speed'}
                  aria-expanded={audioMenu === 'speed'}
                >
                  {speed}×
                </button>

                <AnimatePresence>
                  {audioMenu === 'speed' && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.14, ease: 'easeOut' }}
                      className="absolute end-0 top-[calc(100%+0.55rem)] z-50 w-44 rounded-2xl border border-black/[0.07] bg-white/96 p-2 shadow-2xl backdrop-blur-xl"
                    >
                      {[
                        { label: language === 'ar' ? 'أبطأ' : 'Slower', options: [0.25, 0.5, 0.75] },
                        { label: language === 'ar' ? 'عادي وأسرع' : 'Normal and faster', options: [1, 1.25, 1.5, 1.75, 2] },
                      ].map(group => (
                        <div key={group.label} className="mb-1 last:mb-0">
                          <p className="px-1.5 pb-1 pt-0.5 font-display text-[10px] font-semibold uppercase tracking-wide text-wood/45">
                            {group.label}
                          </p>
                          <div className="grid grid-cols-3 gap-1">
                            {group.options.map(option => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => setPlaybackSpeed(option)}
                                aria-pressed={speed === option}
                                className={cn(
                                  "flex h-9 items-center justify-center rounded-xl font-display text-[11px] font-semibold tabular-nums transition-colors",
                                  speed === option
                                    ? "bg-brand-700 text-white"
                                    : "bg-black/[0.035] text-wood/70 hover:bg-brand-100 hover:text-brand-800"
                                )}
                              >
                                {option}×
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
    </>
  );
};

// The next chapter's narration starts downloading a moment after a chapter opens, so its audio
// is ready when the reader moves on instead of loading only then.
export const usePreloadAudio = (url?: string) => {
  useEffect(() => {
    if (!url) return;
    let preloader: HTMLAudioElement | null = null;
    const timer = window.setTimeout(() => {
      preloader = new Audio();
      preloader.preload = 'auto';
      preloader.src = url;
      preloader.load();
    }, 1500);
    return () => {
      window.clearTimeout(timer);
      if (preloader) {
        preloader.removeAttribute('src');
        preloader.load();
      }
    };
  }, [url]);
};
