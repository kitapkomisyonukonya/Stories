import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Level } from '../../types';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { EDITIONS, editionKey, stampsThisWeek, useJournal } from '../../lib/seyahatname/store';
import { chapterStamp } from '../../lib/seyahatname/view';
import { Stamp, tiltFor } from './art';
import { X } from '../ui/icons';

const COPY = {
  en: {
    eyebrow: (n: string) => `Chapter ${n} complete`,
    title: 'A new stamp in your Seyahatname',
    of: (n: string, total: string) => `${n} of ${total} stamps`,
    week: (n: string, goal: string) => `${n}/${goal} this week`,
    next: (n: string) => `Next: Chapter ${n}`,
    open: 'Open my Seyahatname',
    close: 'Close',
  },
  ar: {
    eyebrow: (n: string) => `أَكْمَلْتَ الْفَصْلَ ${n}`,
    title: 'خَتْمٌ جَدِيدٌ فِي دَفْتَرِ رِحْلَتِكَ',
    of: (n: string, total: string) => `الْأَخْتَامُ: ${n} / ${total}`,
    week: (n: string, goal: string) => `هٰذَا الْأُسْبُوعَ: ${n} / ${goal}`,
    next: (n: string) => `التَّالِي: الْفَصْلُ ${n}`,
    open: 'افْتَحْ دَفْتَرَ رِحْلَتِي',
    close: 'إِغْلَاقٌ',
  },
};

interface StampMomentProps {
  stamp: { storyId: string; level: Level; chapter: number } | null;
  onClose: () => void;
  onNextChapter?: (pageIndex: number) => void;
  onOpenJournal: () => void;
  /** Phones: above the page dock, full width. */
  phone?: boolean;
}

/**
 * The moment a chapter stamp is pressed: a small card that floats over the reader (it takes no room,
 * so nothing on the page moves), with the stamp pressing down, the book's count and the way on.
 */
export const StampMoment: React.FC<StampMomentProps> = ({ stamp, onClose, onNextChapter, onOpenJournal, phone = false }) => {
  const { language, isRTL, formatNumber } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';
  const copy = COPY[lang];
  const journal = useJournal();
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const fmt = (value: number) => formatNumber(value);

  useEffect(() => {
    if (!stamp) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stamp, onClose]);

  const edition = stamp ? EDITIONS[editionKey(stamp.storyId, stamp.level)] : undefined;
  const view = stamp && edition ? chapterStamp(journal, stamp.storyId, stamp.level, stamp.chapter, lang, fmt) : null;
  const earned = stamp && edition ? edition.chapters.filter((_, i) => journal.stamps[`${stamp.storyId}:${stamp.level}:${i + 1}`] !== undefined).length : 0;
  const nextPage = stamp && edition ? edition.pages[stamp.chapter] : undefined;

  return (
    <AnimatePresence>
      {stamp && view && edition && (
        <motion.div
          ref={cardRef}
          key={view.key}
          // role="status" is already polite. Both attributes together would pick up the loading screen styles (loading.css).
          role="status"
          dir={isRTL ? 'rtl' : 'ltr'}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25 }}
          className={cn(
            'fixed z-[120] rounded-3xl border border-black/[0.06] bg-[#FBF8F1] p-4 text-[#14221a] shadow-[0_18px_50px_rgba(0,0,0,0.35)]',
            phone ? 'inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))]' : 'bottom-24 end-6 w-[360px]',
            isRTL && 'font-arabic',
          )}
          data-stamp-moment={view.key}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute end-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-[#14221a]/55 hover:bg-black/5 hover:text-[#14221a]"
            aria-label={copy.close}
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="grid h-[108px] w-[108px] shrink-0 place-items-center rounded-2xl bg-[#f7f0df] shadow-[inset_0_0_26px_rgba(120,90,40,0.22)]">
              <motion.div
                initial={reduceMotion ? false : { scale: 1.45, opacity: 0, rotate: tiltFor(view.key) - 10 }}
                animate={{ scale: 1, opacity: 1, rotate: tiltFor(view.key) }}
                transition={{ delay: 0.15, duration: 0.32, ease: [0.3, 1.4, 0.5, 1] }}
                className="mix-blend-multiply"
              >
                <Stamp {...view} size={96} title={view.label} />
              </motion.div>
            </div>
            <div className="min-w-0 pe-6">
              <p className={cn('text-[11px] font-semibold uppercase text-[#047a51]', !isRTL && 'tracking-[0.14em]')}>{copy.eyebrow(fmt(stamp.chapter))}</p>
              <p className="mt-0.5 text-[16px] font-semibold leading-snug">{copy.title}</p>
              <p className="mt-1 text-[12.5px] text-[#14221a]/65">
                <span className="inline-block whitespace-nowrap">{copy.of(fmt(earned), fmt(edition.chapters.length))}</span>
                {journal.goal > 0 && (
                  <>
                    {' · '}
                    <span className="inline-block whitespace-nowrap">{copy.week(fmt(stampsThisWeek(journal)), fmt(journal.goal))}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {onNextChapter && nextPage !== undefined ? (
              <button
                type="button"
                onClick={() => { onNextChapter(nextPage); onClose(); }}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#E7C76A] px-3 text-[13.5px] font-semibold text-[#14221a] hover:bg-[#f0d585]"
              >
                {copy.next(fmt(stamp.chapter + 1))}
              </button>
            ) : <span />}
            <button
              type="button"
              onClick={() => { onOpenJournal(); onClose(); }}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#C2AA6B] px-3 text-[13.5px] font-semibold text-[#14221a] hover:bg-black/[0.03]"
              data-open-journal
            >
              {copy.open}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
