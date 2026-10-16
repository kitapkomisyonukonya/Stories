import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChevronLeft } from '../ui/icons';
import { SECTION_ICONS } from '../../lib/sectionIcons';
import { getStoryMeta } from '../../core/content/storyCatalog';
import { MY_WORDS_LEARNED, daysUntilReview, dueWords, getMyWordsBook, markMyWord, removeMyWord, reviewQueue, useMyWords, type MyWord } from '../../lib/myWords';
import type { Level } from '../../types';
import { useDialogFocus } from '../../hooks/useDialogFocus';

interface MyWordsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Opens straight into the review. */
  startInReview?: boolean;
  /** Review only this book's words (the book-end review). */
  book?: { storyId: string; level: Level };
  /** Review only words from other books (the reminder at the start of a new book). */
  excludeBook?: { storyId: string; level: Level };
  /** Phones: shown as a tab of the dark library, not as a page over it. */
  embedded?: boolean;
}

const sameBook = (word: MyWord, book: { storyId: string; level: Level }) => word.storyId === book.storyId && word.level === book.level;

/** "My words": the Word Notes the reader saved, with a short flashcard review. Everything stays on the device. */
export const MyWordsPanel: React.FC<MyWordsPanelProps> = ({ isOpen, onClose, startInReview = false, book, excludeBook, embedded = false }) => {
  // Tab stays inside and focus returns to the opener; Escape is handled below.
  const dialogRef = useDialogFocus(isOpen && !embedded, onClose, { escape: false });
  const { language, isRTL, formatNumber } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';
  const allWords = useMyWords();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mode, setMode] = useState<'list' | 'review'>(startInReview ? 'review' : 'list');
  const [queue, setQueue] = useState<MyWord[]>([]);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const [knewCount, setKnewCount] = useState(0);

  const words = useMemo(
    () => allWords.filter(word => word.language === lang && (!book || sameBook(word, book)) && (!excludeBook || !sameBook(word, excludeBook))),
    [allWords, lang, book, excludeBook],
  );

  const startReview = () => {
    setQueue(reviewQueue(words));
    setIndex(0);
    setShown(false);
    setKnewCount(0);
    setMode('review');
  };

  useEffect(() => {
    if (!isOpen) return;
    if (startInReview) startReview();
    else setMode('list');
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // The queue is fixed when the panel opens, so marking a word does not reshuffle the cards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const bookName = (word: MyWord) => {
    const meta = getStoryMeta(word.storyId);
    return `${(lang === 'ar' ? meta?.nameAr : meta?.name) ?? word.storyId} · ${word.level}`;
  };

  const groups = useMemo(() => {
    const map = new Map<string, MyWord[]>();
    [...words].sort((a, b) => b.savedAt - a.savedAt).forEach(word => {
      const key = `${word.storyId}|${word.level}`;
      map.set(key, [...(map.get(key) ?? []), word]);
    });
    return [...map.values()];
  }, [words]);

  const copy = lang === 'ar'
    ? {
        close: 'إغلاق',
        intro: 'اضْغَطْ عَلَى كَلِمَةٍ مُلَوَّنَةٍ فِي القِصَّةِ، ثُمَّ «احْفَظْ فِي كَلِمَاتِي». تَبْقَى الكَلِمَاتُ عَلَى هٰذَا الجِهَازِ.',
        empty: 'لَمْ تَحْفَظْ أَيَّ كَلِمَةٍ بَعْدُ.',
        review: 'رَاجِعْ كَلِمَاتِي',
        list: 'القَائِمَةُ',
        remove: 'احْذِفْ',
        learned: 'تَعَلَّمْتُهَا',
        show: 'أَظْهِرِ المَعْنَى',
        knew: 'كُنْتُ أَعْرِفُهَا',
        notYet: 'لَيْسَ بَعْدُ',
        nothingToReview: 'لَا تُوجَدُ كَلِمَاتٌ لِلْمُرَاجَعَةِ الآنَ. كُلُّ كَلِمَاتِكَ مُتَعَلَّمَةٌ.',
        done: (knew: string, total: string) => `انْتَهَتِ المُرَاجَعَةُ: عَرَفْتَ ${knew} مِنْ ${total}.`,
        again: 'رَاجِعْ مَرَّةً أُخْرَى',
        card: (n: string, total: string) => `${n} / ${total}`,
        schedule: 'تَعُودُ الْكَلِمَةُ لِلْمُرَاجَعَةِ بَعْدَ يَوْمٍ، ثُمَّ بَعْدَ ثَلَاثَةِ أَيَّامٍ، ثُمَّ بَعْدَ أُسْبُوعٍ.',
        dueCount: (n: string) => `لِلْمُرَاجَعَةِ الْيَوْمَ: ${n}`,
        dueNow: 'رَاجِعْهَا الْيَوْمَ',
        next: (days: number, n: string) => days === 1 ? 'الْمُرَاجَعَةُ التَّالِيَةُ غَدًا' : days === 2 ? 'الْمُرَاجَعَةُ التَّالِيَةُ بَعْدَ يَوْمَيْنِ' : `الْمُرَاجَعَةُ التَّالِيَةُ بَعْدَ ${n} أَيَّامٍ`,
      }
    : {
        close: 'Close',
        intro: 'Tap a coloured word in the story, then “Save to My words”. Your words stay on this device.',
        empty: 'You have not saved any words yet.',
        review: 'Review my words',
        list: 'List',
        remove: 'Remove',
        learned: 'Learned',
        show: 'Show the meaning',
        knew: 'I knew it',
        notYet: 'Not yet',
        nothingToReview: 'Nothing to review now. You have learned all your words.',
        done: (knew: string, total: string) => `Review done: You knew ${knew} of ${total}.`,
        again: 'Review again',
        card: (n: string, total: string) => `${n} / ${total}`,
        schedule: 'A word comes back for review after one day, then after three days, then after one week.',
        dueCount: (n: string) => `To review today: ${n}`,
        dueNow: 'Review today',
        next: (days: number, n: string) => days === 1 ? 'Next review: tomorrow' : `Next review: in ${n} days`,
      };

  const dueCount = useMemo(() => dueWords(words).length, [words]);
  const Icon = SECTION_ICONS.myWords.icon;
  const current = queue[index];
  const finished = mode === 'review' && queue.length > 0 && index >= queue.length;

  const answer = (knew: boolean) => {
    if (!current) return;
    markMyWord(current.id, knew);
    if (knew) setKnewCount(count => count + 1);
    setShown(false);
    setIndex(i => i + 1);
  };

  const body = (
    <>
            {/* Embedded on phones, the top bar already names the tab. */}
            {!embedded && (
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800">
                <Icon size={22} />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-semibold text-wood">{SECTION_ICONS.myWords[lang]}</h2>
                {book && <p className="text-sm text-wood/60">{bookName({ storyId: book.storyId, level: book.level } as MyWord)}</p>}
              </div>
            </div>
            )}

            {mode === 'list' && (
              <>
                <p className="mt-3 text-[15px] leading-relaxed text-wood/75">{copy.intro}</p>
                {words.length > 0 && <p className="mt-1 text-sm leading-relaxed text-wood/65" data-my-words-schedule>{copy.schedule}</p>}
                {words.length === 0 ? (
                  <p className="mt-5 rounded-2xl bg-black/[0.035] p-5 text-center text-wood/65">{copy.empty}</p>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={startReview}
                      className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                    >
                      {copy.review}
                    </button>
                    {dueCount > 0 && <p className="mt-2 text-sm font-semibold text-brand-800" data-my-words-due>{copy.dueCount(formatNumber(dueCount))}</p>}
                    <div className="mt-5 space-y-5">
                      {groups.map(group => (
                        <section key={`${group[0].storyId}-${group[0].level}`}>
                          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-wood/55">{bookName(group[0])}</h3>
                          <ul className="mt-2 divide-y divide-black/[0.06] rounded-2xl border border-black/[0.07] bg-white/70">
                            {group.map(word => (
                              <li key={word.id} className="flex items-start gap-3 px-4 py-3">
                                <div className="min-w-0 flex-1">
                                  <p className="font-serif text-lg font-semibold text-wood">
                                    {word.word}
                                    {word.known >= MY_WORDS_LEARNED && (
                                      <span className="ms-2 rounded-full bg-emerald-100 px-2 py-0.5 align-middle text-[11px] font-semibold text-emerald-800">{copy.learned}</span>
                                    )}
                                  </p>
                                  <p className="mt-0.5 text-sm leading-relaxed text-wood/70">{word.definition}</p>
                                  {word.known < MY_WORDS_LEARNED && (
                                    <p className="mt-1 text-xs font-semibold text-wood/50">
                                      {daysUntilReview(word) === 0 ? copy.dueNow : copy.next(daysUntilReview(word), formatNumber(daysUntilReview(word)))}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMyWord(word.id)}
                                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-wood/55 hover:bg-black/5 hover:text-wood focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                                >
                                  {copy.remove}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {mode === 'review' && (
              <div className="mt-5" data-my-words-review>
                {queue.length === 0 ? (
                  <p className="rounded-2xl bg-black/[0.035] p-5 text-center text-wood/70">{words.length ? copy.nothingToReview : copy.empty}</p>
                ) : finished ? (
                  <div className="rounded-2xl bg-black/[0.035] p-6 text-center">
                    <p className="text-lg font-semibold text-wood">{copy.done(formatNumber(knewCount), formatNumber(queue.length))}</p>
                    <button
                      type="button"
                      onClick={startReview}
                      className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800"
                    >
                      {copy.again}
                    </button>
                  </div>
                ) : current && (
                  <div className="rounded-2xl border border-black/[0.08] bg-white/80 p-6 text-center">
                    <p className="text-xs font-semibold text-wood/50">{copy.card(formatNumber(index + 1), formatNumber(queue.length))} · {bookName(current)}</p>
                    <p className="mt-4 font-serif text-3xl font-semibold text-wood">{current.word}</p>
                    {shown ? (
                      <>
                        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-wood/80">{current.definition}</p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => answer(true)}
                            className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
                          >
                            {copy.knew}
                          </button>
                          <button
                            type="button"
                            onClick={() => answer(false)}
                            className="inline-flex min-h-11 items-center rounded-xl border border-black/10 bg-white px-5 text-sm font-semibold text-wood/80 hover:bg-black/5"
                          >
                            {copy.notYet}
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShown(true)}
                        className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800"
                      >
                        {copy.show}
                      </button>
                    )}
                  </div>
                )}
                {!book && !excludeBook && (
                  <button
                    type="button"
                    onClick={() => setMode('list')}
                    className="mt-4 text-sm font-semibold text-brand-800 underline-offset-4 hover:underline"
                  >
                    {copy.list}
                  </button>
                )}
              </div>
            )}
    </>
  );

  if (embedded) {
    return (
      <div className={cn('my-words-dark px-4 pb-6 pt-2', isRTL && 'font-arabic')} dir={isRTL ? 'rtl' : 'ltr'} data-my-words>
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
          className="fixed inset-0 z-[300] overflow-y-auto overscroll-contain bg-[#FBF8F1]"
          data-my-words
        >
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={SECTION_ICONS.myWords[lang]}
            dir={isRTL ? 'rtl' : 'ltr'}
            onClick={event => event.stopPropagation()}
            className={cn('relative mx-auto min-h-full w-full max-w-4xl px-5 pb-16 pt-5 text-wood sm:px-8 sm:pt-8', isRTL && 'font-arabic')}
          >
            {/* A page of its own: the way back is a clear button at the top, not a close cross. */}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="mb-6 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-brand-200 bg-white ps-3 pe-4 font-display text-[13px] font-semibold text-brand-800 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:text-sm"
            >
              <ChevronLeft size={16} className="rtl:rotate-180" aria-hidden="true" />
              {isRTL ? 'رُجُوع' : 'Back'}
            </button>

            {body}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

/**
 * At the start of a book: words saved in other books whose review day has come are shown here.
 * Shown only when there is something to review.
 */
export const MyWordsReminder: React.FC = () => {
  const { language, isRTL } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';
  const allWords = useMyWords();
  const [isOpen, setIsOpen] = useState(false);
  const book = getMyWordsBook();
  const due = useMemo(
    () => dueWords(allWords.filter(word => word.language === lang && (!book || !sameBook(word, book)))),
    [allWords, lang, book],
  );
  if (!book || due.length === 0) return null;
  const Icon = SECTION_ICONS.myWords.icon;
  const copy = lang === 'ar'
    ? { title: 'رَاجِعْ كَلِمَاتٍ مِنْ كُتُبِكَ السَّابِقَةِ', text: 'أَنْهَيْتَ الفَصْلَ الأَوَّلَ. رَاجِعْ هٰذِهِ الكَلِمَاتِ قَبْلَ الفَصْلِ التَّالِي، يَكْفِي دَقِيقَةٌ وَاحِدَةٌ.', action: 'رَاجِعِ الآنَ' }
    : { title: 'Review words from your earlier books', text: 'You finished Chapter 1. Review these words before the next chapter. One minute is enough.', action: 'Review now' };

  return (
    <aside
      dir={isRTL ? 'rtl' : 'ltr'}
      className="mx-auto mt-8 w-full max-w-[68ch] rounded-2xl border border-brand-300/40 bg-brand-50/70 p-4 sm:p-5 lg:max-w-none"
      data-my-words-reminder
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800">
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold text-wood">{copy.title}</p>
          <p className="mt-0.5 text-sm text-wood/70">{copy.text}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {due.slice(0, 5).map(word => (
              <span key={word.id} className="rounded-full bg-white px-3 py-1 font-serif text-sm font-semibold text-wood/80 shadow-sm">{word.word}</span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"
          >
            {copy.action}
          </button>
        </div>
      </div>
      <MyWordsPanel isOpen={isOpen} onClose={() => setIsOpen(false)} startInReview excludeBook={book} />
    </aside>
  );
};
