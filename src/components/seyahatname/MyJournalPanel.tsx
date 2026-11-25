import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import homeIcon from '../../assets/images/home_icon.webp';
import type { Level } from '../../types';
import { levelLabel } from '../../content/levelLabels';
import { getStoryMeta } from '../../core/content/storyCatalog';
import { cn } from '../../lib/utils';
import { appImage } from '../../lib/mediaImage';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUserRole } from '../../contexts/UserRoleContext';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { MY_WORDS_LEARNED, useMyWords } from '../../lib/myWords';
import { EDITIONS, editionKey, setWeeklyGoal, stampsThisWeek, useJournal, weeksOnTarget } from '../../lib/seyahatname/store';
import {
  BADGE_COPY, BADGE_ORDER, CERTIFICATE_LEVELS, LEVELS, bookName, certificateProgress, chapterStamp, earnedBadges, levelBooks, nextChest, totalSeals, totalStamps, visibleEditions,
  type ChapterStampView,
} from '../../lib/seyahatname/view';
import { NOTE_MAX, saveJournalNote, useJournalNotes } from '../../lib/seyahatname/notes';
import { BadgeMark, BookSeal, STAMP_ICONS, Stamp, storyStyle, tiltFor } from './art';
import { JOURNAL_COPY } from './copy';
import { CertificateDialog, type CertificateChoice } from './CertificateDialog';
import { TransferDialog } from './TransferDialog';
import { CaravanPanel } from './CaravanPanel';
import { Modal } from './Modal';
import { useJournalBook, type JournalChapter } from './useJournalBook';
import { BookOpen, Check, ChevronLeft, MapPin, Pause, Pencil, Play } from '../ui/icons';
import type { OpenBookTarget } from './SeyahatnamePanel';

/**
 * My Journal, the light picture-book version (shown on preview links, ?gizli=…, until it is approved).
 * Same journal data as before: stamps, seals, words, badges, goal and certificates. New: each chapter
 * is its own picture with its stamp pressed on it, a road that fills as stamps are pressed, a chapter
 * card (picture, a line from the chapter, its words, listen again) and a short "What I learned" note.
 */

const GOALS = [0, 2, 3, 5];
const BEGINNER: Level[] = ['Pre-A1', 'A1'];
const isBeginner = (level: Level) => BEGINNER.includes(level);

const PAPER = '#F4EDDD';
const INK = '#1f2a24';

const COPY = {
  en: {
    fromChapter: 'From the chapter',
    words: 'Words from this chapter',
    inMyWords: 'In My words',
    listen: 'Listen again',
    pause: 'Pause',
    notYet: 'Not stamped yet. Finish the chapter (its audio, Quick Challenge, Language Focus and I can) to press its stamp.',
    noteTitle: 'What I learned',
    starter: { A2: 'Today I learned that…', B1: 'The most important idea in this chapter is…', B2: 'The most important idea in this chapter is…' } as Record<string, string>,
    frame: 'My new word:',
    pick: 'Tap a word or write your own.',
    save: 'Save',
    saved: 'Saved in your journal',
    private: 'Only on this device.',
    chapter: (n: string) => `Chapter ${n}`,
    notes: (n: string, value: number) => (value === 1 ? '1 note' : `${n} notes`),
    loading: 'Loading the pictures…',
    road: 'Your road',
    next: 'Next stop',
  },
  ar: {
    fromChapter: 'مِنَ الْفَصْلِ',
    words: 'كَلِمَاتُ هٰذَا الْفَصْلِ',
    inMyWords: 'فِي «كَلِمَاتِي»',
    listen: 'اسْتَمِعْ مَرَّةً أُخْرَى',
    pause: 'إِيقَافٌ مُؤَقَّتٌ',
    notYet: 'لَمْ يُخْتَمْ بَعْدُ. أَكْمِلِ الْفَصْلَ (تَسْجِيلَهُ الصَّوْتِيَّ وَالتَّحَدِّيَ السَّرِيعَ وَالتَّرْكِيزَ اللُّغَوِيَّ وَ«أَسْتَطِيعُ») لِيُخْتَمَ خَتْمُهُ.',
    noteTitle: 'مَا تَعَلَّمْتُهُ',
    starter: { A2: 'تَعَلَّمْتُ الْيَوْمَ أَنَّ…', B1: 'أَهَمُّ فِكْرَةٍ فِي هٰذَا الْفَصْلِ…', B2: 'أَهَمُّ فِكْرَةٍ فِي هٰذَا الْفَصْلِ…' } as Record<string, string>,
    frame: 'كَلِمَتِي الْجَدِيدَةُ:',
    pick: 'اخْتَرْ كَلِمَةً أَوِ اكْتُبْ كَلِمَتَكَ.',
    save: 'احْفَظْ',
    saved: 'حُفِظَ فِي دَفْتَرِكَ',
    private: 'عَلَى هٰذَا الْجِهَازِ فَقَطْ.',
    chapter: (n: string) => `الْفَصْلُ ${n}`,
    notes: (n: string, _value: number) => `مُلَاحَظَاتِي: ${n}`,
    loading: 'تُحَمَّلُ الصُّوَرُ…',
    road: 'طَرِيقُكَ',
    next: 'الْمَحَطَّةُ التَّالِيَةُ',
  },
};

type Lang = 'en' | 'ar';

/** The road: one stop per chapter, filled in the book's ink as stamps are pressed. */
const Road: React.FC<{ stamps: ChapterStampView[]; ink: string; emblem: keyof typeof STAMP_ICONS; label: string }> = ({ stamps, ink, emblem, label }) => {
  const next = stamps.find(stamp => !stamp.earned)?.chapter;
  return (
    <div className="flex items-center gap-2" aria-label={label} role="img" data-journal-road>
      <ol className="flex min-w-0 flex-1 items-center">
        {stamps.map((stamp, index) => (
          <li key={stamp.key} className={cn('flex min-w-0 items-center', index > 0 && 'flex-1')}>
            {index > 0 && (
              <span
                className="h-[3px] min-w-[3px] flex-1 rounded-full"
                style={stamp.earned && stamps[index - 1].earned
                  ? { background: ink }
                  : { backgroundImage: `repeating-linear-gradient(90deg, ${ink}55 0 5px, transparent 5px 9px)` }}
              />
            )}
            <span
              className={cn('block shrink-0 rounded-full', stamp.chapter === next ? 'h-3.5 w-3.5 animate-pulse' : 'h-2.5 w-2.5')}
              style={stamp.earned ? { background: ink } : { border: `2px solid ${ink}${stamp.chapter === next ? '' : '66'}`, background: '#fffdf7' }}
            />
          </li>
        ))}
      </ol>
      <svg width="30" height="30" viewBox="0 0 200 200" aria-hidden="true" className="shrink-0">
        <circle cx="100" cy="100" r="88" fill="#fffdf7" stroke={ink} strokeWidth="8" />
        <g fill="none" stroke={ink} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" transform="translate(100 98) scale(.78) translate(-100 -104)">
          <path d={STAMP_ICONS[emblem]} />
        </g>
      </svg>
    </div>
  );
};

/** One chapter: its picture, and its stamp pressed on the corner once earned. */
const ChapterTile: React.FC<{ stamp: ChapterStampView; chapter?: JournalChapter; big: boolean; hasNote: boolean; lang: Lang; onOpen: () => void; fmt: (n: number) => string }> = ({ stamp, chapter, big, hasNote, lang, onOpen, fmt }) => {
  const [failed, setFailed] = useState(false);
  const picture = chapter?.image && !failed ? appImage(chapter.image, 480) : '';
  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={onOpen}
        className="group block w-full text-start focus-visible:outline-none"
        aria-label={`${stamp.label}${stamp.earned ? '' : ` · ${JOURNAL_COPY[lang].notSealed}`}`}
        data-stamp={stamp.key}
        data-earned={stamp.earned || undefined}
      >
        <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-[#e9dfc9] shadow-[0_2px_8px_rgba(80,60,20,0.14)] ring-1 ring-[#d9cba9] transition-transform group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-[#1d6b66]">
          {picture ? (
            <img
              src={picture}
              alt=""
              loading="lazy"
              onError={() => setFailed(true)}
              className={cn('h-full w-full object-cover transition-[filter,opacity]', !stamp.earned && 'opacity-55 grayscale-[85%]')}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center" style={{ color: stamp.color }}>
              <svg width="46%" viewBox="0 0 200 200" aria-hidden="true" className={cn(!stamp.earned && 'opacity-40')}>
                <path d={STAMP_ICONS[stamp.icon]} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
          <span className="absolute start-2 top-2 rounded-full bg-[#fffdf7]/92 px-2 py-0.5 text-[11px] font-semibold text-[#1f2a24] shadow-sm">{fmt(stamp.chapter)}</span>
          {hasNote && (
            <span className="absolute end-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-[#fffdf7]/92 text-[#1d6b66] shadow-sm" aria-hidden="true">
              <Pencil size={13} />
            </span>
          )}
          {stamp.earned && (
            <span className={cn('absolute -bottom-1 -end-1 rounded-full bg-[#fffdf7]/88 p-0.5 shadow-[0_2px_6px_rgba(0,0,0,0.18)]', big ? 'w-[46%]' : 'w-[52%]')}>
              <Stamp {...stamp} size={96} className="h-auto w-full" tilt={tiltFor(stamp.key)} />
            </span>
          )}
        </span>
        <span className={cn('mt-1.5 line-clamp-2 block px-0.5 font-semibold leading-snug', big ? 'text-[14px]' : 'text-[12.5px]', stamp.earned ? 'text-[#1f2a24]' : 'text-[#1f2a24]/55')} dir="auto">
          {chapter?.title ?? stamp.top}
        </span>
      </button>
    </li>
  );
};

/** The note under a chapter card: a word for beginners, a sentence from A2 on. */
const NoteEditor: React.FC<{ noteKey: string; level: Level; words: string[]; lang: Lang }> = ({ noteKey, level, words, lang }) => {
  const notes = useJournalNotes();
  const t = COPY[lang];
  const stored = notes[noteKey] ?? '';
  const [text, setText] = useState(stored);
  const [justSaved, setJustSaved] = useState(false);
  useEffect(() => setText(stored), [stored]);
  const beginner = isBeginner(level);
  const save = (value = text) => {
    saveJournalNote(noteKey, value);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1800);
  };
  return (
    <div className="rounded-2xl bg-[#fff7e3] p-3.5 ring-1 ring-[#ecd9a8]" data-journal-note>
      <b className="flex items-center gap-2 text-[14px] font-semibold"><Pencil size={15} className="text-[#b0832f]" />{t.noteTitle}</b>
      {beginner ? (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold">{t.frame}</span>
            <input
              value={text}
              onChange={event => setText(event.target.value.slice(0, 40))}
              onBlur={() => text !== stored && save()}
              dir="auto"
              className="min-h-10 min-w-0 flex-1 rounded-xl border border-[#d9c690] bg-white px-3 text-[15px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#1d6b66]"
              aria-label={t.frame}
              data-journal-note-input
            />
          </div>
          {words.length > 0 && (
            <>
              <p className="mt-2 text-[12px] text-[#1f2a24]/60">{t.pick}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {words.map(word => (
                  <button
                    key={word}
                    type="button"
                    dir="auto"
                    onClick={() => { setText(word); save(word); }}
                    className={cn('min-h-9 rounded-full px-3 text-[14px] font-semibold ring-1 transition-colors', text === word ? 'bg-[#1d6b66] text-white ring-[#1d6b66]' : 'bg-white text-[#1f2a24] ring-[#d9c690] hover:bg-[#fffaf0]')}
                    data-journal-note-word
                  >
                    {word}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <textarea
            value={text}
            onChange={event => setText(event.target.value.slice(0, NOTE_MAX))}
            placeholder={t.starter[level] ?? t.starter.A2}
            rows={3}
            dir="auto"
            className="mt-2 w-full resize-none rounded-xl border border-[#d9c690] bg-white px-3 py-2 text-[14.5px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1d6b66]"
            aria-label={t.noteTitle}
            data-journal-note-input
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[11.5px] text-[#1f2a24]/55">{t.private}</span>
            <button type="button" onClick={() => save()} disabled={text === stored} className="min-h-9 rounded-full bg-[#1d6b66] px-4 text-[13px] font-semibold text-white disabled:opacity-40" data-journal-note-save>
              {t.save}
            </button>
          </div>
        </>
      )}
      <AnimatePresence>
        {justSaved && (
          <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#1d6b66]" data-journal-note-saved>
            <Check size={13} />{t.saved}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

/** The card that opens from a chapter picture. */
const ChapterCard: React.FC<{
  stamp: ChapterStampView | null; chapter?: JournalChapter; storyId: string; level: Level; lang: Lang; savedWords: Set<string>;
  onClose: () => void; onOpenBook?: (target: OpenBookTarget) => void; fmt: (n: number) => string;
}> = ({ stamp, chapter, storyId, level, lang, savedWords, onClose, onOpenBook, fmt }) => {
  const t = COPY[lang];
  const copy = JOURNAL_COPY[lang];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const edition = EDITIONS[editionKey(storyId, level)];

  useEffect(() => () => { audioRef.current?.pause(); audioRef.current = null; setPlaying(false); }, [stamp?.key]);

  const toggleAudio = () => {
    if (!chapter?.audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(chapter.audioUrl);
      audioRef.current.addEventListener('ended', () => setPlaying(false));
    }
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { void audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  };

  return (
    <Modal open={Boolean(stamp)} onClose={onClose} title={stamp ? `${t.chapter(fmt(stamp.chapter))} · ${chapter?.title ?? stamp.top}` : ''}>
      {stamp && (
        <div className="space-y-4" data-chapter-card={stamp.key}>
          <div className="relative overflow-hidden rounded-2xl bg-[#e9dfc9]">
            {chapter?.image ? (
              <img src={appImage(chapter.image, 900)} alt="" className={cn('aspect-[4/3] w-full object-cover', !stamp.earned && 'grayscale-[70%]')} />
            ) : (
              <div className="aspect-[4/3] w-full" />
            )}
            <span className="absolute bottom-2 end-2 w-28 rounded-full bg-[#fffdf7]/90 p-1 shadow-lg">
              <Stamp {...stamp} size={112} className="h-auto w-full" tilt={stamp.earned ? tiltFor(stamp.key) : 0} faded={!stamp.earned} />
            </span>
          </div>
          {!stamp.earned && <p className="rounded-xl bg-[#f3ead6] px-3 py-2 text-[13px] leading-relaxed text-[#1f2a24]/75">{t.notYet}</p>}
          <div className="flex flex-wrap gap-2">
            {onOpenBook && edition && (
              <button type="button" onClick={() => onOpenBook({ storyId, level, pageIndex: edition.pages[stamp.chapter - 1] })} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#1f2a24] px-4 text-[13px] font-semibold text-[#FBF8F1]" data-chapter-card-open>
                <BookOpen size={15} />{copy.openChapter}
              </button>
            )}
            {chapter?.audioUrl && (
              <button type="button" onClick={toggleAudio} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#1d6b66] px-4 text-[13px] font-semibold text-white" aria-pressed={playing} data-chapter-card-listen>
                {playing ? <Pause size={15} /> : <Play size={15} />}{playing ? t.pause : t.listen}
              </button>
            )}
            {onOpenBook && edition?.mapPage !== undefined && (
              <button type="button" onClick={() => onOpenBook({ storyId, level, pageIndex: edition.mapPage })} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#1f2a24]/20 px-4 text-[13px] font-semibold">
                <MapPin size={15} />{copy.openMap}
              </button>
            )}
          </div>
          {chapter?.line && (
            <figure className="border-s-4 ps-3" style={{ borderColor: stamp.color }}>
              <figcaption className="text-[11.5px] font-semibold uppercase tracking-wide text-[#1f2a24]/55 rtl:tracking-normal">{t.fromChapter}</figcaption>
              <blockquote className="mt-1 text-[15px] leading-relaxed" dir="auto">{chapter.line}</blockquote>
            </figure>
          )}
          {chapter && chapter.words.length > 0 && (
            <div>
              <b className="text-[13.5px] font-semibold">{t.words}</b>
              <ul className="mt-1.5 divide-y divide-[#e6dac0] rounded-2xl bg-white ring-1 ring-[#e6dac0]">
                {chapter.words.map(item => (
                  <li key={item.word} className="flex items-start justify-between gap-3 px-3 py-2">
                    <span className="min-w-0">
                      <b className="block text-[14.5px] font-semibold" dir="auto">{item.word}</b>
                      <span className="block text-[12.5px] leading-snug text-[#1f2a24]/65" dir="auto">{item.definition}</span>
                    </span>
                    {savedWords.has(item.word.toLocaleLowerCase()) && (
                      <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e5f1ee] px-2 py-0.5 text-[11px] font-semibold text-[#1d6b66]"><Check size={11} />{t.inMyWords}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <NoteEditor noteKey={stamp.key} level={level} words={(chapter?.words ?? []).map(item => item.word)} lang={lang} />
        </div>
      )}
    </Modal>
  );
};

/** One book's page in the journal: road, chapter pictures, notes. */
const BookJournal: React.FC<{
  storyId: string; level: Level; lang: Lang; fmt: (n: number) => string; savedWords: Set<string>; onOpenBook?: (target: OpenBookTarget) => void;
}> = ({ storyId, level, lang, fmt, savedWords, onOpenBook }) => {
  const journal = useJournal();
  const notes = useJournalNotes();
  const copy = JOURNAL_COPY[lang];
  const t = COPY[lang];
  const key = editionKey(storyId, level);
  const edition = EDITIONS[key];
  const all = edition.chapters.map((_, i) => chapterStamp(journal, storyId, level, i + 1, lang, fmt));
  const arabic = lang === 'ar' && edition.quick.ar.length > 0;
  const chapters = useJournalBook(storyId, level, arabic);
  const earned = all.filter(stamp => stamp.earned).length;
  const big = isBeginner(level);
  const limit = big ? 6 : 8;
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const style = storyStyle(storyId);
  const meta = getStoryMeta(storyId);
  const noteCount = all.filter(stamp => notes[stamp.key]).length;
  const nextIndex = all.findIndex(stamp => !stamp.earned);
  // Folded: the window that ends just after the next stop, so the newest stamps and the next pictures show.
  const start = open || all.length <= limit ? 0 : Math.max(0, Math.min(all.length - limit, nextIndex < 0 ? all.length - limit : nextIndex + 2 - limit));
  const shown = open ? all : all.slice(start, start + limit);
  const pick = picked !== null ? all[picked - 1] ?? null : null;

  return (
    <section aria-labelledby={`journal-${key}`} data-journal={key} className="rounded-[26px] bg-[#fffdf7] p-4 shadow-[0_6px_24px_rgba(90,70,30,0.10)] ring-1 ring-[#e6dac0] sm:p-5">
      <div className="flex items-center gap-3">
        {meta?.imageSmall || meta?.image ? (
          <img src={meta.imageSmall ?? meta.image} alt="" className="h-14 w-11 shrink-0 rounded-lg object-cover shadow-sm ring-1 ring-black/5" />
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 id={`journal-${key}`} className="truncate text-[17px] font-semibold leading-tight">{bookName(storyId, lang)}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-[#1f2a24]/60">
            <span className="rounded-full px-2 py-px text-[11.5px] font-semibold text-white" style={{ background: style.ink }}>{levelLabel(level, lang)}</span>
            <span>{copy.stampsOf(fmt(earned), fmt(all.length))}</span>
            {noteCount > 0 && <span>· {t.notes(fmt(noteCount), noteCount)}</span>}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <Road stamps={all} ink={style.ink} emblem={style.emblem} label={`${t.road}: ${copy.stampsOf(fmt(earned), fmt(all.length))}`} />
      </div>
      {chapters === null && <p className="mt-3 text-[12px] text-[#1f2a24]/50">{t.loading}</p>}
      <ul className={cn('mt-3 grid gap-3', big ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-3 sm:grid-cols-4')}>
        {shown.map(stamp => (
          <ChapterTile
            key={stamp.key}
            stamp={stamp}
            chapter={chapters?.[stamp.chapter - 1]}
            big={big}
            hasNote={Boolean(notes[stamp.key])}
            lang={lang}
            fmt={fmt}
            onOpen={() => setPicked(stamp.chapter)}
          />
        ))}
      </ul>
      {all.length > limit && (
        <button type="button" onClick={() => setOpen(value => !value)} className="mx-auto mt-2 block min-h-9 px-3 text-[13px] font-semibold text-[#1d6b66]" aria-expanded={open}>
          {open ? copy.seeLess : copy.seeAll(fmt(all.length))}
        </button>
      )}
      <ChapterCard
        stamp={pick}
        chapter={pick ? chapters?.[pick.chapter - 1] : undefined}
        storyId={storyId}
        level={level}
        lang={lang}
        savedWords={savedWords}
        fmt={fmt}
        onClose={() => setPicked(null)}
        onOpenBook={onOpenBook}
      />
    </section>
  );
};

interface MyJournalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
  onOpenBook?: (target: OpenBookTarget) => void;
  onOpenMyWords?: () => void;
  focusBook?: { storyId: string; level: Level };
}

export const MyJournalPanel: React.FC<MyJournalPanelProps> = ({ isOpen, onClose, embedded = false, onOpenBook, onOpenMyWords, focusBook }) => {
  const dialogRef = useDialogFocus(isOpen && !embedded, onClose);
  const { language, isRTL, formatNumber } = useLanguage();
  const lang: Lang = language === 'ar' ? 'ar' : 'en';
  const copy = JOURNAL_COPY[lang];
  const { isTeacher } = useUserRole();
  const journal = useJournal();
  const words = useMyWords();
  const [certificate, setCertificate] = useState<CertificateChoice | null>(null);
  const [transfer, setTransfer] = useState<'show' | 'enter' | null>(null);
  const [caravanOpen, setCaravanOpen] = useState(false);
  const fmt = (value: number) => formatNumber(value);

  const weekDone = stampsThisWeek(journal);
  const onTarget = weeksOnTarget(journal);
  const badges = useMemo(() => earnedBadges(journal, words, onTarget), [journal, words, onTarget]);
  const learned = words.filter(word => word.known >= MY_WORDS_LEARNED).length;
  const chest = nextChest(words.length);
  const savedWords = useMemo(() => new Set(words.map(word => word.word.toLocaleLowerCase())), [words]);

  const journals = useMemo(() => {
    const latest = new Map<string, number>();
    Object.entries(journal.stamps).forEach(([key, at]) => {
      const book = key.split(':').slice(0, 2).join(':');
      if (EDITIONS[book]) latest.set(book, Math.max(latest.get(book) ?? -1, at));
    });
    const focusKey = focusBook ? editionKey(focusBook.storyId, focusBook.level) : null;
    if (focusKey && EDITIONS[focusKey] && !latest.has(focusKey)) latest.set(focusKey, -1);
    return [...latest.entries()]
      .sort((a, b) => (a[0] === focusKey ? -1 : b[0] === focusKey ? 1 : b[1] - a[1]))
      .map(([key]) => {
        const [storyId, level] = key.split(':') as [string, Level];
        return { key, storyId, level };
      });
  }, [journal.stamps, focusBook]);

  // A reader of Pre-A1 and A1 books only gets the short journal: pictures, seals and words.
  const simple = journals.length > 0 ? journals.every(item => isBeginner(item.level)) : Boolean(focusBook && isBeginner(focusBook.level));

  const sectionTitle = (title: string, aside?: string) => (
    <h3 className="flex items-baseline justify-between gap-3 px-1 pt-8 pb-2.5 text-[18px] font-semibold">
      <span>{title}</span>
      {aside && <small className="text-[12.5px] font-medium text-[#1f2a24]/55">{aside}</small>}
    </h3>
  );
  const card = 'rounded-[22px] bg-[#fffdf7] p-4 ring-1 ring-[#e6dac0] shadow-[0_4px_16px_rgba(90,70,30,0.07)]';
  const ghostButton = 'inline-flex min-h-11 items-center justify-center rounded-full border border-[#1f2a24]/20 bg-white px-4 text-sm font-semibold transition-colors hover:bg-[#fffaf0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d6b66]';
  const goldButton = 'inline-flex min-h-11 items-center justify-center rounded-full bg-[#E7C76A] px-5 text-sm font-semibold text-[#14221a] transition-colors hover:bg-[#f0d585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d6b66]';

  const stats: [number, string, string][] = [
    [totalStamps(journal), copy.stamps, '#e4f0ec'],
    [totalSeals(journal), copy.books, '#f8ead2'],
    [words.length, copy.words, '#ece8f6'],
  ];

  const body = (
    <div className={cn('mx-auto w-full max-w-3xl', isRTL && 'font-arabic')} data-seyahatname data-my-journal data-simple={simple || undefined}>
      {/* The cover: light paper with a ribbon, like the book pages. */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#fffaf0] to-[#f6e9cc] p-5 ring-1 ring-[#e3d1a6] sm:p-6">
        <span className="absolute -top-1 end-8 h-16 w-5 rounded-b-sm bg-[#b0832f] shadow-md [clip-path:polygon(0_0,100%_0,100%_100%,50%_82%,0_100%)]" aria-hidden="true" />
        <div className="flex items-center gap-3">
          <img src={homeIcon} alt="" className="h-12 w-12 shrink-0 rounded-2xl bg-[#1f2a24] p-1" />
          <div className="min-w-0 pe-8">
            <h2 className="text-[24px] font-semibold leading-tight">{copy.name}</h2>
            <p className="text-[13px] text-[#1f2a24]/60">{copy.subtitle}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {stats.map(([value, label, tint]) => (
            <div key={label} className="flex flex-col rounded-2xl px-3 py-2.5" style={{ background: tint }}>
              <b className="text-[24px] font-semibold tabular-nums leading-tight">{fmt(value)}</b>
              <span className="text-[11.5px] leading-snug text-[#1f2a24]/65">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly goal: optional, never punishing; left out of the short journal. */}
      {!simple && (
        <div className={cn(card, 'mt-3')} data-weekly-goal>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <b className="block text-[15px] font-semibold">{journal.goal > 0 ? copy.weekTitle(fmt(weekDone), fmt(journal.goal), journal.goal) : copy.weekNoGoal}</b>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-[#1f2a24]/60">{journal.goal > 0 ? copy.weekNote : copy.weekNoGoalText}</span>
              {journal.goal > 0 && onTarget > 0 && <span className="mt-1 block text-[12px] font-semibold text-[#b0832f]">{copy.weeksOnTarget(fmt(onTarget), onTarget)}</span>}
            </div>
            {journal.goal > 0 && (
              <span className="flex shrink-0 gap-1" aria-hidden="true">
                {Array.from({ length: journal.goal }, (_, i) => (
                  <span key={i} className={cn('h-3.5 w-3.5 rounded-full', i < weekDone ? 'bg-[#1d6b66]' : 'border-2 border-[#1d6b66]/35')} />
                ))}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={copy.weekNoGoal}>
            {GOALS.map(goal => (
              <button
                key={goal}
                type="button"
                role="radio"
                aria-checked={journal.goal === goal}
                onClick={() => setWeeklyGoal(goal)}
                className={cn('min-h-9 rounded-full px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d6b66]', journal.goal === goal ? 'bg-[#1d6b66] text-white' : 'bg-[#f3ead6] text-[#1f2a24]/80 hover:bg-[#ece0c6]')}
              >
                {goal === 0 ? copy.goalOff : copy.goalChapters(fmt(goal), goal)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Book journals */}
      {journals.length === 0 ? (
        <div className={cn(card, 'mt-6 text-center')} data-journal-empty>
          <div className="mx-auto w-fit">
            <Stamp top={copy.name} bottom={copy.name} number="1" icon="book" color="#1d6b66" faded size={110} arabic={lang === 'ar'} />
          </div>
          <b className="mt-2 block text-[16px] font-semibold">{copy.emptyTitle}</b>
          <p className="mx-auto mt-1 max-w-sm text-[13.5px] leading-relaxed text-[#1f2a24]/65">{copy.emptyText}</p>
          <button type="button" onClick={onClose} className="mt-3 inline-flex min-h-10 items-center rounded-full bg-[#1f2a24] px-4 text-[13px] font-semibold text-[#FBF8F1]">
            {copy.toLibrary}
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {journals.map(({ key, storyId, level }) => (
            <BookJournal key={key} storyId={storyId} level={level} lang={lang} fmt={fmt} savedWords={savedWords} onOpenBook={onOpenBook} />
          ))}
        </div>
      )}

      {/* Book seals */}
      {sectionTitle(copy.seals, `${fmt(totalSeals(journal))} / ${fmt(visibleEditions().length)}`)}
      <div className={card}>
        <p className="text-[12.5px] text-[#1f2a24]/60">{copy.sealsNote}</p>
        <div className="mt-3 space-y-4">
          {LEVELS.filter(level => levelBooks(level).length > 0).map(level => (
            <div key={level}>
              <span className="inline-block rounded-full bg-[#f3ead6] px-2.5 py-0.5 text-[12px] font-semibold">{levelLabel(level, lang)}</span>
              <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {levelBooks(level).map(story => {
                  const sealed = journal.seals[editionKey(story.id, level)] !== undefined;
                  return (
                    <li key={story.id} className="flex flex-col items-center text-center" data-book-seal={`${story.id}:${level}`} data-sealed={sealed || undefined}>
                      <BookSeal storyId={story.id} level={level} arabic={lang === 'ar' && !(story.englishOnly || story.englishOnlyLevels?.includes(level))} size={74} faded={!sealed} title={`${bookName(story.id, lang)} · ${levelLabel(level, lang)} · ${sealed ? copy.sealed : copy.notSealed}`} className={sealed ? '' : 'text-[#8a7a55]'} />
                      <span className={cn('mt-0.5 text-[11px] leading-tight', sealed ? 'font-semibold' : 'text-[#1f2a24]/45')}>{bookName(story.id, lang)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Word treasury */}
      {sectionTitle(copy.treasury, `${fmt(words.length)} · ${copy.learned(fmt(learned))}`)}
      <div className={card} data-word-treasury>
        <div className="flex justify-between text-[11px] text-[#1f2a24]/50" dir="ltr">
          {[50, 100, 250, 500].map(size => (
            <span key={size} className={cn(words.length >= size && 'font-semibold text-[#b0832f]')}>{fmt(size)}</span>
          ))}
        </div>
        <div className="my-2 h-2.5 overflow-hidden rounded-full bg-[#efe5cf]">
          <i className="block h-full rounded-full bg-gradient-to-r from-[#d9b04f] to-[#E7C76A]" style={{ width: `${Math.min(100, (words.length / 500) * 100)}%` }} />
        </div>
        <p className="text-[12.5px] text-[#1f2a24]/65">{words.length >= 1000 ? copy.treasuryFull : copy.treasuryLeft(fmt(chest - words.length), chest - words.length)}</p>
        {words.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {[...words].sort((a, b) => b.savedAt - a.savedAt).slice(0, 8).map(word => (
              <li key={word.id} dir="auto" className="rounded-full bg-[#f3ead6] px-3 py-1 text-[13.5px] font-semibold" title={`${bookName(word.storyId, lang)} · ${levelLabel(word.level, lang)}`}>{word.word}</li>
            ))}
          </ul>
        )}
        {onOpenMyWords && (
          <button type="button" onClick={onOpenMyWords} className="mt-3 text-[13px] font-semibold text-[#1d6b66] underline-offset-4 hover:underline">
            {copy.openMyWords}
          </button>
        )}
      </div>

      {/* Traveller badges */}
      {sectionTitle(copy.badges, copy.badgesOf(fmt(badges.size), fmt(BADGE_ORDER.length)))}
      <ul className={cn('grid gap-2', simple ? 'grid-cols-4' : 'grid-cols-1 min-[480px]:grid-cols-2')} data-badges>
        {BADGE_ORDER.map(badge => {
          const earned = badges.has(badge);
          const text = BADGE_COPY[badge];
          return (
            <li key={badge} className={cn('flex items-center gap-3 rounded-2xl p-2.5 ring-1', earned ? 'bg-[#fffdf7] ring-[#e3c98b]' : 'bg-[#f7f1e3] ring-[#ece2cc]', simple && 'flex-col gap-1 text-center')} data-badge={badge} data-earned={earned || undefined}>
              <span className={cn('shrink-0', earned ? '' : 'text-[#8a7a55]')}>
                <BadgeMark badge={badge} earned={earned} size={simple ? 52 : 46} />
              </span>
              <span className="min-w-0">
                <b className={cn('block text-[12.5px] font-semibold leading-tight', !earned && 'text-[#1f2a24]/55')}>{lang === 'ar' ? text.ar : text.en}</b>
                {!simple && <span className="mt-0.5 block text-[11px] leading-snug text-[#1f2a24]/50">{lang === 'ar' ? text.howAr : text.howEn}</span>}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Certificates (A2-B2), not in the short journal. */}
      {!simple && (
        <>
          {sectionTitle(copy.certificates)}
          <p className="px-1 text-[12.5px] text-[#1f2a24]/60">{copy.certificatesNote}</p>
          <div className="mt-2 space-y-2">
            {CERTIFICATE_LEVELS.map(level => (
              <div key={level} className={card} data-certificate={level}>
                <b className="block text-[14.5px] font-semibold">{copy.certificateLevel(level)}</b>
                <div className="mt-2 space-y-3">
                  {(['en', 'ar'] as const).map(certLang => {
                    const { books, done, ready } = certificateProgress(journal, level, certLang);
                    if (!books.length) return null;
                    return (
                      <div key={certLang} data-certificate-lang={certLang} data-ready={ready || undefined}>
                        <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
                          <span className="font-semibold">{copy.certificateIn[certLang]}</span>
                          <span className="text-[#1f2a24]/60">{ready ? copy.certificateReady : copy.certificateNeeds(fmt(done), fmt(books.length))}</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#efe5cf]">
                          <i className="block h-full rounded-full bg-[#1d6b66]" style={{ width: `${(done / books.length) * 100}%` }} />
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
        </>
      )}

      {isTeacher && (
        <>
          {sectionTitle(copy.caravan)}
          <div className={card} data-caravan-card>
            <p className="text-[13px] leading-relaxed text-[#1f2a24]/65">{copy.caravanText}</p>
            <button type="button" className={cn(ghostButton, 'mt-3 w-full')} onClick={() => setCaravanOpen(true)}>{copy.caravanOpen}</button>
          </div>
        </>
      )}

      {sectionTitle(copy.move)}
      <div className={card} data-transfer-card>
        <p className="text-[13px] leading-relaxed text-[#1f2a24]/65">{copy.moveText}</p>
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
      <div className="min-h-full rounded-t-[28px] px-4 pb-10 pt-4" style={{ background: PAPER, color: INK }} dir={isRTL ? 'rtl' : 'ltr'}>
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
          className="fixed inset-0 z-[300] overflow-y-auto overscroll-contain"
          style={{ background: PAPER, color: INK }}
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
              type="button"
              onClick={onClose}
              className="mb-5 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#1f2a24]/20 bg-white/70 ps-3 pe-4 text-[13px] font-semibold hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d6b66]"
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
