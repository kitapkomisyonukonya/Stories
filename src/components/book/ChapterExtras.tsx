import React, { useEffect, useState } from 'react';
import { Check, CheckCircle, ChevronRight, Clock } from '../ui/icons';
import { MODE_ICONS, SECTION_ICONS } from '../../lib/sectionIcons';
import type { BeforeYouRead, GroupTask } from '../../types';
import { cn } from '../../lib/utils';
import { useClassMode } from '../../contexts/ClassModeContext';

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeStored = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable; the answer then lasts for this visit only.
  }
};

export interface BeforeYouReadState {
  guess: number | null;
  checked: boolean;
}

/** The learner's guess for one chapter, kept on the device. */
export const useBeforeYouRead = (storageKey: string) => {
  const [state, setState] = useState<BeforeYouReadState>(() => readStored(storageKey, { guess: null, checked: false }));
  useEffect(() => setState(readStored(storageKey, { guess: null, checked: false })), [storageKey]);
  const update = (next: BeforeYouReadState) => {
    setState(next);
    writeStored(storageKey, next);
  };
  return {
    state,
    guess: (index: number) => update({ guess: index, checked: false }),
    check: () => update({ ...state, checked: true }),
  };
};

const I_CAN_EVENT = 'ican:changed';

/** How many I can lines the learner has rated, kept in step with the panel wherever it is open. */
export const useICanProgress = (storageKey: string, total: number) => {
  const count = () => Object.keys(readStored<Record<string, string>>(storageKey, {})).length;
  const [rated, setRated] = useState(count);
  useEffect(() => {
    setRated(count());
    const sync = () => setRated(count());
    window.addEventListener(I_CAN_EVENT, sync);
    return () => window.removeEventListener(I_CAN_EVENT, sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);
  return { rated: Math.min(rated, total), total };
};

const LABELS = {
  en: {
    title: 'Before you read',
    check: 'Check my guess',
    checkAnswer: 'Check my answer',
    start: 'Start',
    seconds: 's',
    timeUp: 'Time’s up. Keep looking!',
    right: 'Your guess was right!',
    rightAnswer: 'Well done, that is right!',
    wrong: 'Good try. The answer is:',
    answerIs: 'The answer is:',
    showAnswer: 'Show the answer',
    canTitle: 'I can',
    canHint: 'How well can you do these now?',
    yes: 'Yes',
    almost: 'Almost',
    notYet: 'Not yet',
    allYes: 'Well done! You can do all of these now.',
    lookAgain: 'One step for each:',
    reread: 'Read the chapter again',
    done: 'Done',
    askClass: 'Ask the class:',
    showInStory: 'Ask one learner to show it in the story.',
  },
  ar: {
    title: 'قَبْلَ القِرَاءَةِ',
    check: 'تَحَقَّقْ مِنْ تَخْمِينِي',
    checkAnswer: 'تَحَقَّقْ مِنْ إِجَابَتِي',
    start: 'اِبْدَأْ',
    seconds: 'ث',
    timeUp: 'انْتَهَى الوَقْتُ. تَابِعِ البَحْثَ!',
    right: 'تَخْمِينُكَ صَحِيحٌ!',
    rightAnswer: 'أَحْسَنْتَ، إِجَابَتُكَ صَحِيحَةٌ!',
    wrong: 'مُحَاوَلَةٌ جَيِّدَةٌ. الإِجَابَةُ:',
    answerIs: 'الإِجَابَةُ:',
    showAnswer: 'أَظْهِرِ الإِجَابَةَ',
    canTitle: 'أَسْتَطِيعُ',
    canHint: 'إِلَى أَيِّ حَدٍّ تَسْتَطِيعُ ذٰلِكَ الآنَ؟',
    yes: 'نَعَمْ',
    almost: 'تَقْرِيبًا',
    notYet: 'لَيْسَ بَعْدُ',
    allYes: 'أَحْسَنْتَ! تَسْتَطِيعُ الآنَ كُلَّ هٰذِهِ.',
    lookAgain: 'خُطْوَةٌ وَاحِدَةٌ لِكُلٍّ مِنْهَا:',
    reread: 'اقْرَأِ الفَصْلَ مَرَّةً أُخْرَى',
    done: 'تَمَّ',
    askClass: 'اسْأَلِ الصَّفَّ:',
    showInStory: 'اطْلُبْ مِنْ طَالِبٍ أَنْ يُرِيَهُ فِي القِصَّةِ.',
  },
};

/** A countdown for the timed Before you read tasks. It never locks the question. */
const useCountdown = (seconds: number, resetKey: string) => {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => setLeft(null), [resetKey]);
  useEffect(() => {
    if (left === null || left <= 0) return undefined;
    const timer = window.setTimeout(() => setLeft(left - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left]);
  return { left, start: () => setLeft(seconds) };
};

/** A small optional task above the story. The text is always visible; the learner can skip it. */
export const BeforeYouReadPanel = ({
  data,
  language,
  state,
  onGuess,
  onCheck,
  seconds = 15,
}: {
  data: BeforeYouRead;
  language: string;
  state: BeforeYouReadState;
  onGuess: (index: number) => void;
  onCheck: () => void;
  /** Time for the find and skim tasks. */
  seconds?: number;
}) => {
  const L = language === 'ar' ? LABELS.ar : LABELS.en;
  const isArabic = language === 'ar';
  const { guess, checked } = state;
  const right = checked && guess === data.answer;
  const { classMode } = useClassMode();
  const timed = data.kind === 'find' || data.kind === 'skim';
  const countdown = useCountdown(seconds, data.question);

  const letters = isArabic ? ['أ', 'ب', 'ج', 'د'] : ['A', 'B', 'C', 'D'];
  // Arabic pages count the seconds in Arabic digits, like the rest of the Arabic interface.
  const num = (n: number) => (isArabic ? n.toLocaleString('ar-EG') : String(n));

  return (
    <section
      data-before-you-read
      className="mb-4 rounded-xl border border-brand-200/80 bg-brand-50/60 px-3 py-2.5 font-sans"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn('min-w-[min(100%,16rem)] flex-1 text-wood', isArabic ? 'text-base' : 'text-sm')}>
          <span className={cn('me-2 inline-flex items-center gap-1 align-middle font-display font-semibold uppercase tracking-widest text-brand-800', isArabic ? 'text-xs' : 'text-[10px]')}>
            <SECTION_ICONS.beforeYouRead.icon size={14} />
            {L.title}
          </span>
          <span className="font-semibold">{data.question}</span>
        </p>
        {timed && !checked && (
          countdown.left === null ? (
            <button
              type="button"
              onClick={countdown.start}
              data-byr-start
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-3 font-display text-[12px] font-semibold text-brand-800 hover:bg-brand-50"
            >
              <Clock size={14} />
              {L.start} · {num(seconds)} {L.seconds}
            </button>
          ) : (
            <span
              role="timer"
              aria-live="polite"
              className={cn(
                'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 font-display text-[12px] font-semibold tabular-nums',
                countdown.left > 0 ? 'bg-brand-100 text-brand-800' : 'bg-amber-100 text-amber-900',
              )}
            >
              <Clock size={14} />
              {countdown.left > 0 ? `${num(countdown.left)} ${L.seconds}` : L.timeUp}
            </span>
          )
        )}
        {!checked && guess === null && classMode && (
          <button
            type="button"
            onClick={onCheck}
            data-class-show-answer
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-3 font-display text-[12px] font-semibold text-brand-800 hover:bg-brand-50"
          >
            {L.showAnswer}
          </button>
        )}
        {!checked && guess !== null && (
          <button
            type="button"
            onClick={onCheck}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-brand-700 px-3 font-display text-[12px] font-semibold text-white hover:bg-brand-800"
          >
            <Check size={14} />
            {timed ? L.checkAnswer : L.check}
          </button>
        )}
      </div>

      <div role="radiogroup" className="mt-2 grid gap-1.5 sm:grid-cols-3">
        {data.options.map((option, index) => {
          const isGuess = guess === index;
          const isAnswer = checked && index === data.answer;
          const isWrongGuess = checked && isGuess && !isAnswer;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isGuess}
              disabled={checked}
              onClick={() => onGuess(index)}
              className={cn(
                'flex min-h-9 items-center gap-2 rounded-lg border bg-white px-2 py-1 text-start leading-snug transition-colors',
                isArabic ? 'text-sm' : 'text-[13px]',
                isAnswer
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold'
                  : isWrongGuess
                  ? 'border-amber-400 bg-amber-50 text-wood'
                  : isGuess
                  ? 'border-brand-600 ring-1 ring-brand-600 text-wood font-semibold'
                  : checked
                  ? 'border-brand-100 text-wood/50'
                  : 'border-brand-100 text-wood/85 hover:border-brand-400',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-display font-bold',
                  isArabic ? 'text-sm' : 'text-[11px]',
                  isAnswer
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : isWrongGuess
                    ? 'border-amber-500 bg-amber-500 text-white'
                    : isGuess
                    ? 'border-brand-700 bg-brand-700 text-white'
                    : 'border-brand-200 text-brand-700',
                )}
              >
                {isAnswer ? <CheckCircle size={14} /> : letters[index]}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {checked && (
        <p className={cn('mt-1.5', isArabic ? 'text-sm' : 'text-[13px]', right ? 'text-emerald-800' : 'text-wood/80')}>
          <span className="font-semibold">{right ? (timed ? L.rightAnswer : L.right) : `${guess === null ? L.answerIs : L.wrong} ${data.options[data.answer]}`}</span>
          {data.quote && data.quote.replace(/[.\s]+$/, '') !== data.options[data.answer].replace(/[.\s]+$/, '') && <span className={cn('ms-1.5 font-serif text-wood/60', !isArabic && 'italic')}>{isArabic ? `«${data.quote}»` : `“${data.quote}”`}</span>}
        </p>
      )}
    </section>
  );
};

type Rating = 'yes' | 'almost' | 'notYet';

/** What to do next for one "I can" line, taken from the chapter (see lib/iCanSteps). */
export interface ICanStep {
  text: string;
  quote?: string;
  actionLabel?: string;
  action?: () => void;
}

export const ICanPanel = ({ items, language, storageKey, onReread, onDone, steps }: {
  items: string[];
  /** One step per line, in the same order as items. */
  steps?: ICanStep[];
  language: string;
  storageKey: string;
  /** Takes the learner back to the story text. */
  onReread?: () => void;
  /** Shown in a window: closes it. */
  onDone?: () => void;
}) => {
  const { classMode } = useClassMode();
  const L = language === 'ar' ? LABELS.ar : LABELS.en;
  const isArabic = language === 'ar';
  const [ratings, setRatings] = useState<Record<number, Rating>>(() => readStored(storageKey, {}));
  useEffect(() => setRatings(readStored(storageKey, {})), [storageKey]);
  const rate = (index: number, value: Rating) => {
    const next = { ...ratings, ...readStored<Record<number, Rating>>(storageKey, {}), [index]: value };
    setRatings(next);
    writeStored(storageKey, next);
    window.dispatchEvent(new Event(I_CAN_EVENT));
  };
  const allRated = items.every((_, index) => ratings[index]);
  const reviewIndexes = items.map((_, index) => index).filter(index => ratings[index] && ratings[index] !== 'yes');
  const toReview = reviewIndexes.map(index => items[index]);
  const options: { value: Rating; label: string; on: string }[] = [
    { value: 'yes', label: L.yes, on: 'bg-emerald-600 text-white border-emerald-600' },
    { value: 'almost', label: L.almost, on: 'bg-amber-500 text-white border-amber-500' },
    { value: 'notYet', label: L.notYet, on: 'bg-wood/70 text-white border-wood/70' },
  ];

  return (
    <section data-i-can className="mt-6 rounded-[26px] border border-brand-100 bg-white p-5 sm:p-6 shadow-[0_14px_38px_rgba(63,49,28,0.06)] font-sans" dir={isArabic ? 'rtl' : 'ltr'}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-2 text-brand-800">
          <SECTION_ICONS.iCan.icon size={18} />
          <span className={cn('font-display font-semibold uppercase tracking-widest', isArabic ? 'text-sm' : 'text-[11px]')}>{L.canTitle}</span>
        </span>
        <span className={cn('text-wood/55', isArabic ? 'text-sm' : 'text-xs')}>{L.canHint}</span>
      </header>
      <ul className="mt-3 divide-y divide-gray-100">
        {items.map((item, index) => (
          <li key={item} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <span className={cn('font-serif text-wood', isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base')}>{item}</span>
            <span className="flex shrink-0 gap-1.5">
              {options.map(option => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={ratings[index] === option.value}
                  onClick={() => rate(index, option.value)}
                  className={cn(
                    'min-h-9 rounded-full border px-3 font-display text-[12px] font-semibold transition-colors',
                    ratings[index] === option.value ? option.on : 'border-gray-200 bg-white text-wood/65 hover:border-gray-300',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </span>
          </li>
        ))}
      </ul>

      {/* Closing moment: once every line is rated (students), or as a prompt for the class (class mode) */}
      {classMode ? (
        <div className="mt-3 rounded-2xl bg-brand-50/70 px-4 py-3">
          <p className={cn('font-display font-semibold text-brand-800', isArabic ? 'text-sm' : 'text-[12px] uppercase tracking-widest')}>{L.askClass}</p>
          <p className={cn('mt-1 font-serif text-wood', isArabic ? 'text-base' : 'text-sm sm:text-base')}>{(toReview[0] ?? items[0]).replace(/\.$/, '')}?</p>
          <p className={cn('mt-1 text-wood/60', isArabic ? 'text-sm' : 'text-[13px]')}>{L.showInStory}</p>
        </div>
      ) : allRated && (
        <div className={cn('mt-3 rounded-2xl px-4 py-3', toReview.length ? 'bg-amber-50' : 'bg-emerald-50')} role="status" data-i-can-summary>
          {toReview.length === 0 ? (
            <p className={cn('flex items-center gap-2 font-semibold text-emerald-800', isArabic ? 'text-base' : 'text-sm')}>
              <CheckCircle size={18} />{L.allYes}
            </p>
          ) : (
            <>
              <p className={cn('font-semibold text-amber-900', isArabic ? 'text-base' : 'text-sm')}>{L.lookAgain}</p>
              <ul className="mt-2 space-y-2.5">
                {reviewIndexes.map(index => {
                  const step = steps?.[index];
                  return (
                    <li key={items[index]} className="rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-amber-100">
                      <p className={cn('text-wood/55', isArabic ? 'text-sm' : 'text-[12px]')}>{items[index]}</p>
                      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className={cn('font-serif text-wood', isArabic ? 'text-base' : 'text-sm')}>
                          {step?.text ?? L.reread}
                          {step?.quote && <span className={cn('ms-1 text-wood/70', !isArabic && 'italic')}>{isArabic ? `«${step.quote}»` : `“${step.quote}”`}</span>}
                        </p>
                        {(step?.action || onReread) && (
                          <button
                            type="button"
                            onClick={step?.action ?? onReread}
                            className="min-h-9 shrink-0 self-start rounded-full border border-brand-300 bg-white px-3.5 font-display text-[12px] font-semibold text-brand-800 hover:bg-brand-50 sm:self-auto"
                          >
                            {step?.actionLabel ?? L.reread}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      {onDone && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {onDone && (
            <button type="button" onClick={onDone} className="min-h-10 rounded-full bg-brand-700 px-5 font-display text-[12px] font-semibold text-white hover:bg-brand-800">
              {L.done}
            </button>
          )}
        </div>
      )}
    </section>
  );
};

const GROUP_LABELS = {
  en: {
    title: 'Group task',
    show: 'Show the task',
    hide: 'Hide the task',
    people: 'people',
    roles: 'Roles',
    steps: 'Steps',
    share: 'Share',
    solo: 'On your own?',
    types: { jigsaw: 'Jigsaw reading', roleplay: 'Role play', mapGap: 'Map game', project: 'Mini project' },
  },
  ar: {
    title: 'مُهِمَّةٌ جَمَاعِيَّةٌ',
    show: 'اِعْرِضِ المُهِمَّةَ',
    hide: 'أَخْفِ المُهِمَّةَ',
    people: 'أَشْخَاص',
    roles: 'الأَدْوَارُ',
    steps: 'الخُطُوَاتُ',
    share: 'شَارِكْ',
    solo: 'تَتَعَلَّمُ وَحْدَكَ؟',
    types: { jigsaw: 'قِرَاءَةٌ تَعَاوُنِيَّةٌ', roleplay: 'لَعِبُ الأَدْوَارِ', mapGap: 'لُعْبَةُ الخَرِيطَةِ', project: 'مَشْرُوعٌ صَغِيرٌ' },
  },
};

/** A group task after some chapters. Closed by default so it never lengthens the page for a learner who skips it. */
export const GroupTaskPanel = ({ task, language, defaultOpen = false }: { task: GroupTask; language: string; defaultOpen?: boolean }) => {
  const isArabic = language === 'ar';
  const L = isArabic ? GROUP_LABELS.ar : GROUP_LABELS.en;
  const { classMode } = useClassMode();
  const [open, setOpen] = useState(classMode || defaultOpen);
  const GroupIcon = MODE_ICONS.group.icon;
  const SoloIcon = MODE_ICONS.individual.icon;
  const small = isArabic ? 'text-sm' : 'text-[13px]';
  const body = isArabic ? 'text-base' : 'text-sm sm:text-[15px]';

  return (
    <section data-group-task className="mt-6 rounded-[26px] border border-brand-100 bg-white p-5 sm:p-6 shadow-[0_14px_38px_rgba(63,49,28,0.06)] font-sans" dir={isArabic ? 'rtl' : 'ltr'}>
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex w-full items-center gap-3 text-start">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <GroupIcon size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block font-display font-semibold uppercase tracking-widest text-brand-800', isArabic ? 'text-sm' : 'text-[11px]')}>
            {L.title} · {L.types[task.type]}
          </span>
          <span className={cn('block font-display font-semibold text-wood', isArabic ? 'text-lg' : 'text-base sm:text-lg')}>{task.title}</span>
          <span className={cn('mt-0.5 flex flex-wrap items-center gap-x-3 text-wood/55', small)}>
            <span className="inline-flex items-center gap-1"><Clock size={13} />{task.time}</span>
            <span className="inline-flex items-center gap-1"><GroupIcon size={13} />{task.groupSize} {L.people}</span>
          </span>
        </span>
        <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border border-brand-200 px-3 py-1.5 font-display text-[12px] font-semibold text-brand-800', isArabic && 'text-sm')}>
          {open ? L.hide : L.show}
          <ChevronRight size={14} className={cn('transition-transform', open ? 'rotate-90' : isArabic && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {task.roles?.length ? (
            <div>
              <h5 className={cn('font-display font-semibold uppercase tracking-widest text-wood/50', isArabic ? 'text-xs' : 'text-[10px]')}>{L.roles}</h5>
              <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                {task.roles.map(role => (
                  <li key={role.name} className={cn('rounded-xl bg-brand-50/60 px-3 py-2 text-wood', small)}>
                    <span className="font-semibold">{role.name}:</span> {role.job}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <h5 className={cn('font-display font-semibold uppercase tracking-widest text-wood/50', isArabic ? 'text-xs' : 'text-[10px]')}>{L.steps}</h5>
            <ol className="mt-1.5 space-y-1.5">
              {task.steps.map((step, index) => (
                <li key={step} className={cn('flex gap-2.5 font-serif text-wood', body)}>
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-700 font-display text-[11px] font-bold text-white">{(index + 1).toLocaleString(isArabic ? 'ar-EG' : 'en')}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <p className={cn('rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-emerald-900', small)}>
            <span className="font-semibold">{L.share}: </span>{task.share}
          </p>
          <p className={cn('flex items-start gap-2 text-wood/70', small)}>
            <SoloIcon size={15} className="mt-0.5 shrink-0" />
            <span><span className="font-semibold">{L.solo} </span>{task.solo}</span>
          </p>
        </div>
      )}
    </section>
  );
};
