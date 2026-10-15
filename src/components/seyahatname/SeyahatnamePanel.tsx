import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import homeIcon from '../../assets/images/home_icon.webp';
import type { Level } from '../../types';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUserRole } from '../../contexts/UserRoleContext';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { MY_WORDS_LEARNED, useMyWords } from '../../lib/myWords';
import { EDITIONS, editionKey, setWeeklyGoal, stampsThisWeek, useJournal, weeksOnTarget } from '../../lib/seyahatname/store';
import {
  BADGE_COPY, BADGE_ORDER, LEVELS, bookName, certificateProgress, chapterStamp, earnedBadges, levelBooks, nextChest, totalSeals, totalStamps, visibleEditions,
} from '../../lib/seyahatname/view';
import { BadgeMark, BookSeal, Stamp, tiltFor } from './art';
import { JOURNAL_COPY } from './copy';
import { CertificateDialog, type CertificateChoice } from './CertificateDialog';
import { TransferDialog } from './TransferDialog';
import { CaravanPanel } from './CaravanPanel';
import { ChevronLeft, Scroll } from '../ui/icons';

export interface OpenBookTarget {
  storyId: string;
  level: Level;
  pageIndex?: number;
}

interface SeyahatnamePanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Phones: a tab of the dark library, not a page over it. */
  embedded?: boolean;
  /** Opens a book (at a chapter or its map). Absent where no book can be opened from here. */
  onOpenBook?: (target: OpenBookTarget) => void;
  onOpenMyWords?: () => void;
  /** Shown first: a book's journal opens expanded. */
  focusBook?: { storyId: string; level: Level };
}

const GOALS = [0, 2, 3, 5];
const COLLAPSED = 6;

/** The goal ring: the week's stamps against the goal. */
const GoalRing: React.FC<{ done: number; goal: number; label: string }> = ({ done, goal, label }) => {
  const share = goal ? Math.min(1, done / goal) : 0;
  const length = 2 * Math.PI * 26;
  return (
    <span className="relative grid h-16 w-16 shrink-0 place-items-center" aria-hidden="true">
      <svg viewBox="0 0 64 64" className="absolute inset-0 h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeOpacity=".14" strokeWidth="6" />
        <circle cx="32" cy="32" r="26" fill="none" stroke="#E4C779" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${share * length} ${length}`} />
      </svg>
      <b className="text-sm font-semibold tabular-nums">{label}</b>
    </span>
  );
};

/** "Seyahatname", the reader's travel journal: stamps, seals, words, badges, goal and certificates on one page. */
export const SeyahatnamePanel: React.FC<SeyahatnamePanelProps> = ({ isOpen, onClose, embedded = false, onOpenBook, onOpenMyWords, focusBook }) => {
  const dialogRef = useDialogFocus(isOpen && !embedded, onClose);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { language, isRTL, formatNumber } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';
  const copy = JOURNAL_COPY[lang];
  const { isTeacher } = useUserRole();
  const journal = useJournal();
  const words = useMyWords();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(focusBook ? [editionKey(focusBook.storyId, focusBook.level)] : []));
  const [selected, setSelected] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<CertificateChoice | null>(null);
  const [transfer, setTransfer] = useState<'show' | 'enter' | null>(null);
  const [caravanOpen, setCaravanOpen] = useState(false);
  const fmt = (value: number) => formatNumber(value);

  useEffect(() => {
    if (focusBook) setExpanded(prev => new Set([...prev, editionKey(focusBook.storyId, focusBook.level)]));
  }, [focusBook]);

  const weekDone = stampsThisWeek(journal);
  const onTarget = weeksOnTarget(journal);
  const badges = useMemo(() => earnedBadges(journal, words, onTarget), [journal, words, onTarget]);
  const learned = words.filter(word => word.known >= MY_WORDS_LEARNED).length;
  const chest = nextChest(words.length);

  // Journals: books with at least one stamp, the most recently stamped first; the focused book on top.
  const journals = useMemo(() => {
    const latest = new Map<string, number>();
    Object.entries(journal.stamps).forEach(([key, at]) => {
      const book = key.split(':').slice(0, 2).join(':');
      if (EDITIONS[book]) latest.set(book, Math.max(latest.get(book) ?? -1, at));
    });
    if (focusBook && EDITIONS[editionKey(focusBook.storyId, focusBook.level)] && !latest.has(editionKey(focusBook.storyId, focusBook.level))) {
      latest.set(editionKey(focusBook.storyId, focusBook.level), -1);
    }
    return [...latest.entries()]
      .sort((a, b) => {
        if (focusBook && a[0] === editionKey(focusBook.storyId, focusBook.level)) return -1;
        if (focusBook && b[0] === editionKey(focusBook.storyId, focusBook.level)) return 1;
        return b[1] - a[1];
      })
      .map(([key]) => {
        const [storyId, level] = key.split(':') as [string, Level];
        return { key, storyId, level };
      });
  }, [journal.stamps, focusBook]);

  const toggle = (key: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const sectionTitle = (title: string, aside?: string, id?: string) => (
    <h3 id={id} className="flex items-baseline justify-between gap-3 px-1 pt-7 pb-2 text-[17px] font-semibold text-[#FFF9EC]">
      <span>{title}</span>
      {aside && <small className="text-[12px] font-medium text-[#EDE5D4]/60">{aside}</small>}
    </h3>
  );

  const card = 'rounded-2xl bg-white/[0.055] p-4';
  const ghostButton = 'inline-flex min-h-11 items-center justify-center rounded-full border border-[#C2AA6B]/70 px-4 text-sm font-semibold text-[#F6F0E2] transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4C779]';
  const goldButton = 'inline-flex min-h-11 items-center justify-center rounded-full bg-[#E7C76A] px-5 text-sm font-semibold text-[#14221a] transition-colors hover:bg-[#f0d585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4C779] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e0c]';

  const body = (
    <div className={cn('mx-auto w-full max-w-3xl', isRTL && 'font-arabic')} data-seyahatname>
      {/* Phones show the name in the library's top bar. */}
      {!embedded && (
        <div className="flex items-center gap-3 px-1">
          <img src={homeIcon} alt="" className="h-12 w-12 shrink-0 rounded-xl bg-[#1b1b1b] p-1" />
          <div className="min-w-0">
            <h2 className="text-[22px] font-semibold leading-tight text-[#FFF9EC]">{copy.name}</h2>
            <p className="text-[13px] text-[#EDE5D4]/65">{copy.subtitle}</p>
          </div>
        </div>
      )}
      {embedded && <p className="px-1 text-[13px] text-[#EDE5D4]/65">{copy.subtitle}</p>}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          [totalStamps(journal), copy.stamps],
          [totalSeals(journal), copy.books],
          [words.length, copy.words],
        ].map(([value, label]) => (
          <div key={label} className="flex flex-col rounded-2xl bg-white/[0.055] px-3 py-2.5">
            <b className="text-[22px] font-semibold tabular-nums text-[#E7C76A]">{fmt(value as number)}</b>
            <span className="text-[11px] leading-snug text-[#EDE5D4]/65">{label}</span>
          </div>
        ))}
      </div>

      {/* Weekly goal: optional, never punishing. */}
      <div className={cn(card, 'mt-3')} data-weekly-goal>
        <div className="flex items-center gap-4">
          {journal.goal > 0 && <GoalRing done={weekDone} goal={journal.goal} label={`${fmt(Math.min(weekDone, journal.goal))}/${fmt(journal.goal)}`} />}
          <div className="min-w-0 flex-1">
            <b className="block text-[15px] font-semibold text-[#FFF9EC]">
              {journal.goal > 0 ? copy.weekTitle(fmt(weekDone), fmt(journal.goal), journal.goal) : copy.weekNoGoal}
            </b>
            <span className="mt-0.5 block text-[12.5px] leading-snug text-[#EDE5D4]/65">{journal.goal > 0 ? copy.weekNote : copy.weekNoGoalText}</span>
            {journal.goal > 0 && onTarget > 0 && <span className="mt-1 block text-[12px] font-semibold text-[#E4C779]">{copy.weeksOnTarget(fmt(onTarget), onTarget)}</span>}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={copy.weekNoGoal}>
          {GOALS.map(goal => (
            <button
              key={goal}
              type="button"
              role="radio"
              aria-checked={journal.goal === goal}
              onClick={() => setWeeklyGoal(goal)}
              className={cn(
                'min-h-9 rounded-full px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4C779]',
                journal.goal === goal ? 'bg-[#E7C76A] text-[#14221a]' : 'bg-white/[0.07] text-[#EDE5D4]/80 hover:bg-white/[0.12]',
              )}
            >
              {goal === 0 ? copy.goalOff : copy.goalChapters(fmt(goal), goal)}
            </button>
          ))}
        </div>
      </div>

      {/* Book journals: one page of stamps per book. */}
      {journals.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-[#f7f0df] p-5 text-center text-[#14221a] shadow-[inset_0_0_40px_rgba(120,90,40,0.22)]" data-journal-empty>
          <div className="mx-auto w-fit">
            <Stamp top={copy.name} bottom={copy.subtitle} number="1" icon="book" color="#1d6b66" faded size={110} arabic={lang === 'ar'} />
          </div>
          <b className="mt-2 block text-[16px] font-semibold">{copy.emptyTitle}</b>
          <p className="mx-auto mt-1 max-w-sm text-[13.5px] leading-relaxed text-[#14221a]/70">{copy.emptyText}</p>
          {embedded && (
            <button type="button" onClick={onClose} className="mt-3 inline-flex min-h-10 items-center rounded-full bg-[#14221a] px-4 text-[13px] font-semibold text-[#F6F0E2]">
              {copy.toLibrary}
            </button>
          )}
        </div>
      ) : (
        journals.map(({ key, storyId, level }) => {
          const edition = EDITIONS[key];
          const all = edition.chapters.map((_, i) => chapterStamp(journal, storyId, level, i + 1, lang, fmt));
          const earned = all.filter(stamp => stamp.earned).length;
          const open = expanded.has(key);
          // Collapsed: the earned stamps first in chapter order, then the next ones still to press.
          const shown = open ? all : [...all.filter(stamp => stamp.earned), ...all.filter(stamp => !stamp.earned)].slice(0, COLLAPSED).sort((a, b) => a.chapter - b.chapter);
          const pick = selected ? all.find(stamp => stamp.key === selected) : undefined;
          return (
            <section key={key} aria-labelledby={`journal-${key}`} data-journal={key}>
              {sectionTitle(`${bookName(storyId, lang)} · ${level}`, copy.stampsOf(fmt(earned), fmt(all.length)), `journal-${key}`)}
              <div className="rounded-2xl bg-[#f7f0df] p-3 text-[#14221a] shadow-[inset_0_0_40px_rgba(120,90,40,0.22)] sm:p-4">
                <ul className="grid grid-cols-3 justify-items-center gap-1 sm:grid-cols-6">
                  {shown.map(stamp => (
                    <li key={stamp.key} className="w-full">
                      <button
                        type="button"
                        onClick={() => setSelected(selected === stamp.key ? null : stamp.key)}
                        className={cn(
                          'mx-auto block aspect-square w-full max-w-[112px] rounded-full mix-blend-multiply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d6b66]',
                          selected === stamp.key && 'ring-2 ring-[#14221a]/40',
                        )}
                        aria-label={`${stamp.label}${stamp.earned ? '' : ` · ${copy.notSealed}`}`}
                        aria-pressed={selected === stamp.key}
                        data-stamp={stamp.key}
                        data-earned={stamp.earned || undefined}
                      >
                        <Stamp {...stamp} size={112} className="h-full w-full" tilt={stamp.earned ? tiltFor(stamp.key) : 0} faded={!stamp.earned} />
                      </button>
                    </li>
                  ))}
                </ul>
                {pick && (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2 text-[13px]" data-stamp-detail>
                    <span className="min-w-0 font-semibold">{pick.label}</span>
                    {onOpenBook && (
                      <span className="flex gap-2">
                        <button type="button" className="rounded-full bg-[#14221a] px-3 py-1.5 text-[12px] font-semibold text-[#F6F0E2]" onClick={() => onOpenBook({ storyId, level, pageIndex: edition.pages[pick.chapter - 1] })}>
                          {copy.openChapter}
                        </button>
                        {edition.mapPage !== undefined && (
                          <button type="button" className="rounded-full border border-[#14221a]/25 px-3 py-1.5 text-[12px] font-semibold" onClick={() => onOpenBook({ storyId, level, pageIndex: edition.mapPage })}>
                            {copy.openMap}
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                )}
                {all.length > COLLAPSED && (
                  <button type="button" onClick={() => toggle(key)} className="mx-auto mt-1 block min-h-9 px-3 text-[13px] font-semibold text-[#1d6b66]" aria-expanded={open}>
                    {open ? copy.seeLess : copy.seeAll(fmt(all.length))}
                  </button>
                )}
              </div>
            </section>
          );
        })
      )}

      {/* Book seals: every book, sealed or still open. */}
      {sectionTitle(copy.seals, `${fmt(totalSeals(journal))} / ${fmt(visibleEditions().length)}`)}
      <p className="px-1 text-[12.5px] text-[#EDE5D4]/60">{copy.sealsNote}</p>
      <div className="mt-2 space-y-3">
        {LEVELS.map(level => (
          <div key={level} className="flex items-start gap-2">
            <span className="mt-6 w-7 shrink-0 text-[12px] font-semibold text-[#E4C779]">{level}</span>
            <ul className="grid flex-1 grid-cols-3 gap-2 sm:grid-cols-6">
              {levelBooks(level).map(story => {
                const sealed = journal.seals[editionKey(story.id, level)] !== undefined;
                return (
                  <li key={story.id} className="flex flex-col items-center text-center" data-book-seal={`${story.id}:${level}`} data-sealed={sealed || undefined}>
                    <BookSeal storyId={story.id} level={level} arabic={lang === 'ar' && !story.englishOnly} size={78} faded={!sealed} title={`${bookName(story.id, lang)} · ${level} · ${sealed ? copy.sealed : copy.notSealed}`} className={sealed ? '' : 'text-[#EDE5D4]'} />
                    <span className={cn('mt-0.5 text-[11px] leading-tight', sealed ? 'text-[#F6F0E2]' : 'text-[#EDE5D4]/45')}>{bookName(story.id, lang)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Word treasury */}
      {sectionTitle(copy.treasury, `${fmt(words.length)} · ${copy.learned(fmt(learned))}`)}
      <div className={card} data-word-treasury>
        <div className="flex justify-between text-[11px] text-[#EDE5D4]/50" dir="ltr">
          {[50, 100, 250, 500].map(size => (
            <span key={size} className={cn(words.length >= size && 'font-semibold text-[#E7C76A]')}>{fmt(size)}</span>
          ))}
        </div>
        <div className="my-2 h-2 overflow-hidden rounded-full bg-white/10">
          <i className="block h-full rounded-full bg-[#E7C76A]" style={{ width: `${Math.min(100, (words.length / 500) * 100)}%`, marginInlineStart: 0 }} />
        </div>
        <p className="text-[12.5px] text-[#EDE5D4]/70">{words.length >= 1000 ? copy.treasuryFull : copy.treasuryLeft(fmt(chest - words.length), chest - words.length)}</p>
        {words.length > 0 && (
          <ul className="mt-2">
            {[...words].sort((a, b) => b.savedAt - a.savedAt).slice(0, 3).map(word => (
              <li key={word.id} className="flex justify-between gap-3 border-t border-white/[0.07] py-2 text-[13.5px]">
                <span dir="auto" className="font-semibold text-[#FFF9EC]">{word.word}</span>
                <span className="truncate text-[11.5px] text-[#EDE5D4]/55">{bookName(word.storyId, lang)} · {word.level}</span>
              </li>
            ))}
          </ul>
        )}
        {onOpenMyWords && (
          <button type="button" onClick={onOpenMyWords} className="mt-2 text-[13px] font-semibold text-[#E4C779] underline-offset-4 hover:underline">
            {copy.openMyWords}
          </button>
        )}
      </div>

      {/* Traveller badges */}
      {sectionTitle(copy.badges, copy.badgesOf(fmt(badges.size), fmt(BADGE_ORDER.length)))}
      <ul className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2" data-badges>
        {BADGE_ORDER.map(badge => {
          const earned = badges.has(badge);
          const text = BADGE_COPY[badge];
          return (
            <li key={badge} className={cn('flex items-center gap-3 rounded-2xl p-2.5', earned ? 'bg-white/[0.07]' : 'bg-white/[0.025]')} data-badge={badge} data-earned={earned || undefined}>
              <span className={cn('shrink-0', earned ? '' : 'text-[#EDE5D4]')}>
                <BadgeMark badge={badge} earned={earned} size={46} />
              </span>
              <span className="min-w-0">
                <b className={cn('block text-[12.5px] font-semibold leading-tight', earned ? 'text-[#FFF9EC]' : 'text-[#EDE5D4]/60')}>{lang === 'ar' ? text.ar : text.en}</b>
                <span className="mt-0.5 block text-[11px] leading-snug text-[#EDE5D4]/50">{lang === 'ar' ? text.howAr : text.howEn}</span>
              </span>
            </li>
          );
        })}
      </ul>

      {/* Certificates: one per level and language, never two languages on one certificate. */}
      {sectionTitle(copy.certificates)}
      <p className="px-1 text-[12.5px] text-[#EDE5D4]/60">{copy.certificatesNote}</p>
      <div className="space-y-2">
        {LEVELS.map(level => (
          <div key={level} className={card} data-certificate={level}>
            <b className="block text-[14.5px] font-semibold text-[#FFF9EC]">{copy.certificateLevel(level)}</b>
            <div className="mt-2 space-y-3">
              {(['en', 'ar'] as const).map(certLang => {
                const { books, done, ready } = certificateProgress(journal, level, certLang);
                if (!books.length) return null;
                return (
                  <div key={certLang} data-certificate-lang={certLang} data-ready={ready || undefined}>
                    <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
                      <span className="font-semibold text-[#EDE5D4]/90">{copy.certificateIn[certLang]}</span>
                      <span className="text-[#EDE5D4]/65">{ready ? copy.certificateReady : copy.certificateNeeds(fmt(done), fmt(books.length))}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <i className="block h-full rounded-full bg-[#E7C76A]" style={{ width: `${(done / books.length) * 100}%` }} />
                    </div>
                    {ready && (
                      <button type="button" className={cn(goldButton, 'mt-2.5 w-full')} onClick={() => setCertificate({ level, lang: certLang })}>
                        {copy.certificateOpen[certLang]}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {isTeacher && (
        <>
          {sectionTitle(copy.caravan)}
          <div className={card} data-caravan-card>
            <p className="text-[13px] leading-relaxed text-[#EDE5D4]/70">{copy.caravanText}</p>
            <button type="button" className={cn(ghostButton, 'mt-3 w-full')} onClick={() => setCaravanOpen(true)}>
              {copy.caravanOpen}
            </button>
          </div>
        </>
      )}

      {sectionTitle(copy.move)}
      <div className={card} data-transfer-card>
        <p className="text-[13px] leading-relaxed text-[#EDE5D4]/70">{copy.moveText}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className={ghostButton} onClick={() => setTransfer('show')}>{copy.showCode}</button>
          <button type="button" className={ghostButton} onClick={() => setTransfer('enter')}>{copy.enterCode}</button>
        </div>
      </div>

      <CertificateDialog certificate={certificate} onClose={() => setCertificate(null)} />
      <TransferDialog mode={transfer} onClose={() => setTransfer(null)} />
      <CaravanPanel isOpen={caravanOpen} onClose={() => setCaravanOpen(false)} />
    </div>
  );

  if (embedded) {
    return (
      <div className="px-4 pb-8 pt-1 text-[#F6F0E2]" dir={isRTL ? 'rtl' : 'ltr'}>
        {body}
      </div>
    );
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[300] overflow-y-auto overscroll-contain bg-[#0b0e0c] text-[#F6F0E2]"
          data-seyahatname-page
        >
          <motion.div
            ref={dialogRef}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={copy.name}
            dir={isRTL ? 'rtl' : 'ltr'}
            className="relative mx-auto min-h-full w-full max-w-3xl px-4 pb-16 pt-5 sm:px-8 sm:pt-8"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="mb-5 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#C2AA6B]/50 ps-3 pe-4 text-[13px] font-semibold text-[#F6F0E2] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4C779]"
            >
              <ChevronLeft size={16} className="rtl:rotate-180" aria-hidden="true" />
              {copy.back}
            </button>
            {body}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export const SeyahatnameIcon = Scroll;
