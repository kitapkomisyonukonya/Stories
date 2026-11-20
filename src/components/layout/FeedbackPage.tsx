import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatNumberIn } from '../../content/languages';
import { useUserRole } from '../../contexts/UserRoleContext';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { hiddenStoryCatalog, storyCatalog } from '../../core/content/storyCatalog';
import { Check, Languages, MessageSquare, X } from '../ui/icons';
import { FEEDBACK_COPY } from '../../data/feedbackCopy';
import {
  FEEDBACK_QUESTIONS,
  FEEDBACK_ROLES,
  FEEDBACK_TEXT_LIMIT,
  detectDevice,
  hasFeedbackContent,
  isFeedbackHash,
  sendFeedback,
  type FeedbackEntry,
  type FeedbackLang,
  type FeedbackQuestion,
  type FeedbackRole,
} from '../../lib/feedback';
import type { Level } from '../../types';

interface FeedbackPageProps {
  isOpen: boolean;
  onClose: () => void;
  /** The book the form was opened from (the end-of-book summary); the person can still change it. */
  book?: { storyId: string; level: Level };
}

const LANG_KEY = 'feedback-form-language';
const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2'];
const LANG_OPTIONS: { id: FeedbackLang; label: string }[] = [
  { id: 'tr', label: 'Türkçe' },
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'العربية' },
];

const readSavedLang = (): FeedbackLang | null => {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === 'tr' || saved === 'en' || saved === 'ar' ? saved : null;
  } catch {
    return null;
  }
};

const labelClass = 'block text-[15px] font-semibold text-[#FFF9EC]';
const chipClass = (on: boolean) =>
  cn(
    'min-h-11 rounded-full border px-4 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9C46A]',
    on ? 'border-[#E9C46A] bg-[#E9C46A]/15 text-[#F3D58C]' : 'border-white/15 text-[#F6F0E2]/75 hover:border-white/35 hover:text-white',
  );

export const FeedbackPage: React.FC<FeedbackPageProps> = ({ isOpen, onClose, book }) => {
  const dialogRef = useDialogFocus(isOpen, onClose, { escape: false });
  const { language } = useLanguage();
  const { role: appRole } = useUserRole();
  const closeRef = useRef<HTMLButtonElement>(null);

  const [fl, setFl] = useState<FeedbackLang>(() => readSavedLang() ?? (language === 'ar' ? 'ar' : 'en'));
  const initialRole: FeedbackRole | null = appRole === 'teacher' ? 'teacher' : appRole ? 'student' : null;
  const [role, setRole] = useState<FeedbackRole | null>(initialRole);
  const [storyId, setStoryId] = useState<string>(book?.storyId ?? '');
  const [level, setLevel] = useState<Level | null>(book?.level ?? null);
  const [ratings, setRatings] = useState<Partial<Record<FeedbackQuestion, number>>>({});
  const [liked, setLiked] = useState('');
  const [problems, setProblems] = useState('');
  const [ideas, setIdeas] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'empty' | 'busy' | 'failed'>('idle');

  const isAr = fl === 'ar';
  const copy = FEEDBACK_COPY[fl];
  const number = (value: number) => formatNumberIn(fl, value);

  // Opening from another book's summary starts on that book.
  const bookId = book?.storyId;
  const bookLevel = book?.level;
  useEffect(() => {
    if (!isOpen || !bookId) return;
    setStoryId(bookId);
    setLevel(bookLevel ?? null);
  }, [isOpen, bookId, bookLevel]);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const books = useMemo(() => {
    const shelf = storyCatalog.filter(story => !story.isComingSoon);
    // A book opened from a preview link is not on the shelf; it is still offered when the form opens from it.
    const extra = bookId && !shelf.some(story => story.id === bookId) ? hiddenStoryCatalog.filter(story => story.id === bookId) : [];
    return [...shelf, ...extra].map(story => ({ id: story.id, name: isAr ? story.nameAr : story.name }));
  }, [isAr, bookId]);

  const chooseLang = (next: FeedbackLang) => {
    setFl(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // Private mode: the choice is simply not remembered.
    }
  };

  const reset = () => {
    setRatings({});
    setLiked('');
    setProblems('');
    setIdeas('');
    setStatus('idle');
    dialogRef.current?.scrollTo({ top: 0 });
  };

  const close = () => {
    // A link straight to the form (#/feedback) goes back to the library address once it is closed.
    if (isFeedbackHash(window.location.hash)) window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#/`);
    if (status === 'sent') reset();
    onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === 'sending') return;
    const entry: FeedbackEntry = {
      formLang: fl,
      appLang: language === 'ar' ? 'ar' : 'en',
      role,
      storyId: storyId || null,
      level,
      ratings,
      liked: liked.trim(),
      problems: problems.trim(),
      ideas: ideas.trim(),
      device: detectDevice(),
      website,
    };
    if (!hasFeedbackContent(entry)) {
      setStatus('empty');
      return;
    }
    setStatus('sending');
    const result = await sendFeedback(entry);
    setStatus(result);
    if (result === 'sent') dialogRef.current?.scrollTo({ top: 0 });
  };

  const textArea = (id: string, label: string, value: string, onChange: (next: string) => void) => (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        maxLength={FEEDBACK_TEXT_LIMIT}
        onChange={event => onChange(event.target.value)}
        rows={4}
        placeholder={copy.placeholder}
        dir="auto"
        className="mt-2.5 block w-full resize-y rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-[15px] leading-relaxed text-[#FFF9EC] placeholder:text-[#F6F0E2]/35 focus:border-[#E9C46A]/70 focus:outline-none focus:ring-2 focus:ring-[#E9C46A]/30"
        data-feedback-text={id}
      />
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={cn('fixed inset-0 z-[300] overflow-y-auto overscroll-contain bg-[#0b0e0c] text-[#F6F0E2]', isAr && 'font-arabic')}
          style={isAr ? undefined : ({ '--font-display': '"Poppins", sans-serif', fontFamily: '"Poppins", sans-serif' } as React.CSSProperties)}
          dir={isAr ? 'rtl' : 'ltr'}
          lang={fl}
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={copy.heading}
          data-feedback-page
        >
          <div className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#0b0e0c]/92 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
              <p className="flex min-w-0 items-center gap-2.5 font-display text-[17px] font-semibold text-[#FFF9EC]">
                <MessageSquare size={20} className="shrink-0 text-[#E9C46A]" />
                <span className="truncate">{copy.heading}</span>
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label={copy.close}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[#F6F0E2]/85 transition-colors hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                data-feedback-close
              >
                <X size={22} />
              </button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[760px] px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
            <div className="mb-7 flex flex-wrap items-center gap-2" role="group" aria-label={copy.formLanguage}>
              <Languages size={16} className="text-[#D8B35C]/80" aria-hidden="true" />
              <span className="me-1 text-[13px] font-semibold text-[#F6F0E2]/60">{copy.formLanguage}</span>
              {LANG_OPTIONS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  lang={option.id}
                  aria-pressed={fl === option.id}
                  onClick={() => chooseLang(option.id)}
                  className={cn(
                    'min-h-9 rounded-full border px-3.5 text-[13px] font-semibold transition-colors',
                    option.id === 'ar' ? 'font-arabic' : "font-['Poppins',sans-serif]",
                    fl === option.id ? 'border-[#E9C46A] bg-[#E9C46A]/15 text-[#F3D58C]' : 'border-white/12 text-[#F6F0E2]/70 hover:border-white/30 hover:text-white',
                  )}
                  data-feedback-lang={option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {status === 'sent' ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center sm:p-12" role="status" data-feedback-sent>
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E9C46A]/15 text-[#F3D58C]">
                  <Check size={30} />
                </span>
                <h1 className="mt-5 font-display text-[28px] font-semibold text-[#FFF9EC]">{copy.thanks}</h1>
                <p className="mt-2 text-[16px] text-[#F6F0E2]/75">{copy.thanksText}</p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={reset} className="min-h-12 rounded-xl border border-white/15 px-5 text-[15px] font-semibold text-[#F6F0E2] hover:border-white/35">
                    {copy.again}
                  </button>
                  <button type="button" onClick={close} className="min-h-12 rounded-xl bg-[#E9C46A] px-6 text-[15px] font-semibold text-[#1a1a12] hover:bg-[#F3D58C]">
                    {copy.close}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-9 text-start" noValidate data-feedback-form>
                <div>
                  <h1 className="font-display text-[30px] font-semibold leading-tight tracking-[-0.01em] text-[#FFF9EC] sm:text-[36px]">{copy.heading}</h1>
                  <p className="mt-3 text-[16px] leading-relaxed text-[#F6F0E2]/80">{copy.intro}</p>
                  <p className="mt-4 rounded-2xl border border-[#D8B35C]/25 bg-[#D8B35C]/[0.07] px-4 py-3 text-[14px] leading-relaxed text-[#F6F0E2]/80" data-feedback-privacy>
                    {copy.privacy}
                  </p>
                </div>

                <fieldset>
                  <legend className={labelClass}>{copy.role}</legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {FEEDBACK_ROLES.map(option => (
                      <button key={option} type="button" aria-pressed={role === option} onClick={() => setRole(role === option ? null : option)} className={chipClass(role === option)} data-feedback-role={option}>
                        {copy.roles[option]}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    <label htmlFor="feedback-book" className={labelClass}>
                      {copy.book}
                    </label>
                    <select
                      id="feedback-book"
                      value={storyId}
                      onChange={event => setStoryId(event.target.value)}
                      className="mt-2.5 block min-h-12 w-full rounded-2xl border border-white/12 bg-[#151915] px-4 text-[15px] text-[#FFF9EC] focus:border-[#E9C46A]/70 focus:outline-none focus:ring-2 focus:ring-[#E9C46A]/30"
                      data-feedback-book
                    >
                      <option value="">{copy.general}</option>
                      {books.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <fieldset>
                    <legend className={labelClass}>{copy.level}</legend>
                    <div className="mt-2.5 flex flex-wrap gap-2" dir="ltr">
                      {LEVELS.map(option => (
                        <button key={option} type="button" aria-pressed={level === option} onClick={() => setLevel(level === option ? null : option)} className={cn(chipClass(level === option), 'min-w-12 px-3 font-sans')} data-feedback-level={option}>
                          {option}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>

                <fieldset>
                  <legend className={labelClass}>{copy.ratingsTitle}</legend>
                  <div className="mt-3 divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                    {FEEDBACK_QUESTIONS.map(question => (
                      <div key={question} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5" role="radiogroup" aria-label={copy.questions[question]} data-feedback-question={question}>
                        <p className="text-[15px] leading-snug text-[#F6F0E2]/90">{copy.questions[question]}</p>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="hidden w-14 text-end text-[11px] text-[#F6F0E2]/45 sm:block">{copy.low}</span>
                          {[1, 2, 3, 4, 5].map(score => {
                            const on = ratings[question] === score;
                            return (
                              <button
                                key={score}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                aria-label={`${number(score)} / ${number(5)}`}
                                onClick={() =>
                                  setRatings(current => {
                                    const next = { ...current };
                                    if (next[question] === score) delete next[question];
                                    else next[question] = score;
                                    return next;
                                  })
                                }
                                className={cn(
                                  'flex h-11 w-11 items-center justify-center rounded-full border text-[15px] font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9C46A]',
                                  on ? 'border-[#E9C46A] bg-[#E9C46A] text-[#1a1a12]' : 'border-white/15 text-[#F6F0E2]/80 hover:border-white/40 hover:text-white',
                                )}
                                data-feedback-score={score}
                              >
                                {number(score)}
                              </button>
                            );
                          })}
                          <span className="hidden w-14 text-[11px] text-[#F6F0E2]/45 sm:block">{copy.high}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </fieldset>

                {textArea('feedback-liked', copy.liked, liked, setLiked)}
                {textArea('feedback-problems', copy.problems, problems, setProblems)}
                {textArea('feedback-ideas', copy.ideas, ideas, setIdeas)}

                {/* Left empty by people; hidden from screens and screen readers. */}
                <input type="text" name="website" value={website} onChange={event => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="min-h-12 rounded-xl bg-[#E9C46A] px-8 text-[16px] font-semibold text-[#1a1a12] transition-colors hover:bg-[#F3D58C] disabled:opacity-60"
                    data-feedback-send
                  >
                    {status === 'sending' ? copy.sending : copy.send}
                  </button>
                  {(status === 'empty' || status === 'failed' || status === 'busy') && (
                    <p className="text-[14px] font-medium text-[#F4A38C]" role="alert" data-feedback-error>
                      {status === 'empty' ? copy.empty : status === 'busy' ? copy.busy : copy.failed}
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
