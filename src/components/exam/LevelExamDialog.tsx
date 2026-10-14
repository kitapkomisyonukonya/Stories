import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { X, Check, ArrowRight } from '../ui/icons';
import type { Level, ExamItem } from '../../types';
import { LEVEL_EXAMS, examItems, readingCount } from '../../content/exams';
import { encodeExam, formatExamCode } from '../../lib/examCode';

interface LevelExamDialogProps {
  level: Level | null;
  onClose: () => void;
}

type Step = 'intro' | 'reading-0' | 'reading-1' | 'language' | 'review' | 'result';

const COPY = {
  en: {
    close: 'Close', start: 'Start the test', next: 'Next', back: 'Back', finish: 'Finish and see my code', review: 'Check your answers',
    parts: 'This test has four parts. You do Reading and Language here. Your teacher gives you Writing and Speaking.',
    minutes: 'minutes', reading: 'Reading', language: 'Language', writing: 'Writing', speaking: 'Speaking',
    unanswered: (n: number) => `${n} question${n === 1 ? '' : 's'} not answered yet.`,
    allAnswered: 'All questions are answered.',
    yourScore: 'Your score', code: 'Your test code', codeHint: 'Show this code to your teacher, or write it on your writing paper.',
    writingNow: 'Now do the writing task on paper and give it to your teacher.',
    leave: 'Your answers are lost if you close the test. Close it?',
    question: 'Question',
  },
  ar: {
    close: 'إغلاق', start: 'ابْدَأِ الاخْتِبَارَ', next: 'التَّالِي', back: 'رُجُوعٌ', finish: 'أَنْهِ وَاعْرِضِ الرَّمْزَ', review: 'رَاجِعْ إِجَابَاتِكَ',
    parts: 'لِلاخْتِبَارِ أَرْبَعَةُ أَجْزَاءٍ. تُجِيبُ هُنَا عَنِ القِرَاءَةِ وَاللُّغَةِ، وَيُعْطِيكَ المُعَلِّمُ الكِتَابَةَ وَالمُحَادَثَةَ.',
    minutes: 'دَقِيقَةً', reading: 'القِرَاءَةُ', language: 'اللُّغَةُ', writing: 'الكِتَابَةُ', speaking: 'المُحَادَثَةُ',
    unanswered: (n: number) => `لَمْ تُجِبْ بَعْدُ عَنْ ${n} مِنَ الأَسْئِلَةِ.`,
    allAnswered: 'أَجَبْتَ عَنْ كُلِّ الأَسْئِلَةِ.',
    yourScore: 'نَتِيجَتُكَ', code: 'رَمْزُ اخْتِبَارِكَ', codeHint: 'أَعْطِ هٰذَا الرَّمْزَ لِمُعَلِّمِكَ، أَوِ اكْتُبْهُ عَلَى وَرَقَةِ الكِتَابَةِ.',
    writingNow: 'اكْتُبِ الآنَ مَهَمَّةَ الكِتَابَةِ عَلَى وَرَقَةٍ وَأَعْطِهَا لِمُعَلِّمِكَ.',
    leave: 'سَتَضِيعُ إِجَابَاتُكَ إِذَا أَغْلَقْتَ الاخْتِبَارَ. هَلْ تُغْلِقُهُ؟',
    question: 'السُّؤَالُ',
  },
};

/** The student's end-of-level test: Reading and Language are answered on screen, Writing and Speaking with the teacher. */
export const LevelExamDialog: React.FC<LevelExamDialogProps> = ({ level, onClose }) => {
  const isOpen = level !== null;
  const exam = level ? LEVEL_EXAMS[level] : null;
  const { language, formatNumber } = useLanguage();
  const copy = COPY[language === 'ar' ? 'ar' : 'en'];
  const [step, setStep] = useState<Step>('intro');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const requestClose = () => {
    if (step !== 'intro' && step !== 'result' && Object.keys(answers).length > 0 && !window.confirm(copy.leave)) return;
    onClose();
  };
  const dialogRef = useDialogFocus(isOpen, requestClose);

  useEffect(() => {
    if (!isOpen) return;
    setStep('intro');
    setAnswers({});
  }, [isOpen, level]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const items = useMemo(() => (exam ? examItems(exam) : []), [exam]);
  if (!isOpen || !exam) return null;

  const unanswered = items.filter(item => answers[item.id] === undefined).length;
  const nReading = readingCount(exam);
  const correct = (list: ExamItem[]) => list.filter(item => answers[item.id] === item.answer).length;
  const readingScore = correct(items.slice(0, nReading));
  const languageScore = correct(items.slice(nReading));
  const code = step === 'result' ? encodeExam({ level: exam.level, version: exam.version, answers: items.map(item => answers[item.id] ?? 0) }) : '';

  const itemBlock = (item: ExamItem) => (
    <fieldset key={item.id} className="relative rounded-2xl border border-black/[0.07] bg-white p-4" data-exam-item={item.id}>
      <legend className="sr-only">{copy.question} {item.id}</legend>
      <p className="exam-latin text-[15px] font-semibold leading-snug text-wood" dir="ltr">
        <span className="me-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#3b2f1f] px-1.5 text-xs text-white">{item.id}</span>
        {item.stem}
      </p>
      <div className="exam-latin mt-3 grid gap-2" dir="ltr">
        {item.options.map((option, index) => {
          const chosen = answers[item.id] === index;
          return (
            <label
              key={option}
              className={cn(
                'relative flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-[15px] transition-colors',
                chosen ? 'border-[#b08a35] bg-[#D8B35C]/15 font-semibold' : 'border-black/10 hover:bg-black/[0.03]',
              )}
            >
              <input
                type="radio"
                name={`exam-${item.id}`}
                className="sr-only"
                checked={chosen}
                onChange={() => setAnswers(prev => ({ ...prev, [item.id]: index }))}
              />
              <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold', chosen ? 'border-[#b08a35] bg-[#b08a35] text-white' : 'border-black/20 text-wood/60')}>
                {chosen ? <Check size={14} /> : String.fromCharCode(65 + index)}
              </span>
              {option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );

  const navButtons = (prev: Step | null, next: Step, nextLabel = copy.next) => (
    <div className="mt-6 flex flex-wrap justify-between gap-3">
      {prev ? (
        <button type="button" onClick={() => setStep(prev)} className="min-h-11 rounded-xl border border-black/10 px-5 text-sm font-semibold text-wood/75 hover:bg-black/5">
          {copy.back}
        </button>
      ) : <span />}
      <button type="button" onClick={() => setStep(next)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#3b2f1f] px-5 text-sm font-semibold text-white hover:bg-[#2a2116]" data-exam-next>
        {nextLabel} <ArrowRight size={16} />
      </button>
    </div>
  );

  const partHead = (label: string, instructions: string) => (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6a22]">{label}</p>
      <p className="exam-latin mt-1 text-[15px] text-wood/80" dir="ltr">{instructions}</p>
    </div>
  );

  let body: React.ReactNode = null;
  if (step === 'intro') {
    body = (
      <div>
        <p className="text-[15px] leading-relaxed text-wood/80">{copy.parts}</p>
        <dl className="mt-4 divide-y divide-black/[0.06] rounded-2xl border border-black/[0.07] bg-white">
          {([
            [copy.reading, exam.minutes.reading],
            [copy.language, exam.minutes.language],
            [copy.writing, exam.minutes.writing],
            [copy.speaking, exam.minutes.speaking],
          ] as [string, number][]).map(([label, min]) => (
            <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
              <dt className="text-wood/70">{label}</dt>
              <dd className="font-semibold tabular-nums">{formatNumber(min)} {copy.minutes}</dd>
            </div>
          ))}
        </dl>
        {navButtons(null, 'reading-0', copy.start)}
      </div>
    );
  } else if (step === 'reading-0' || step === 'reading-1') {
    const index = step === 'reading-0' ? 0 : 1;
    const text = exam.reading.texts[index];
    body = (
      <div>
        {partHead(`${copy.reading} ${index + 1} / ${exam.reading.texts.length}`, exam.reading.instructions)}
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <article className="exam-latin rounded-2xl bg-white p-5 lg:sticky lg:top-0 lg:max-h-[70vh] lg:overflow-y-auto" dir="ltr" data-exam-text>
            <h3 className="font-display text-xl font-semibold text-wood">{text.title}</h3>
            {text.body.split('\n\n').map(paragraph => (
              <p key={paragraph.slice(0, 40)} className="mt-3 whitespace-pre-line font-serif text-[16px] leading-relaxed text-wood/90">{paragraph}</p>
            ))}
          </article>
          <div className="space-y-3">{text.items.map(itemBlock)}</div>
        </div>
        {navButtons(index === 0 ? 'intro' : 'reading-0', index === 0 ? 'reading-1' : 'language')}
      </div>
    );
  } else if (step === 'language') {
    body = (
      <div>
        {partHead(copy.language, exam.language.instructions)}
        <div className="grid gap-3 md:grid-cols-2">{exam.language.items.map(itemBlock)}</div>
        {navButtons('reading-1', 'review', copy.review)}
      </div>
    );
  } else if (step === 'review') {
    body = (
      <div>
        <p className={cn('rounded-xl px-4 py-3 text-sm font-semibold', unanswered ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-800')} role="status">
          {unanswered ? copy.unanswered(unanswered) : copy.allAnswered}
        </p>
        <div className="exam-latin mt-4 flex flex-wrap gap-2" dir="ltr">
          {items.map((item, i) => {
            const done = answers[item.id] !== undefined;
            const target: Step = i < exam.reading.texts[0].items.length ? 'reading-0' : i < nReading ? 'reading-1' : 'language';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStep(target)}
                className={cn('h-10 w-10 rounded-lg text-sm font-semibold', done ? 'bg-[#3b2f1f] text-white' : 'border-2 border-dashed border-amber-500 text-amber-800')}
                aria-label={`${copy.question} ${item.id}`}
              >
                {item.id}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <button type="button" onClick={() => setStep('language')} className="min-h-11 rounded-xl border border-black/10 px-5 text-sm font-semibold text-wood/75 hover:bg-black/5">{copy.back}</button>
          <button
            type="button"
            disabled={unanswered > 0}
            onClick={() => setStep('result')}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#3b2f1f] px-5 text-sm font-semibold text-white hover:bg-[#2a2116] disabled:cursor-not-allowed disabled:opacity-40"
            data-exam-finish
          >
            {copy.finish}
          </button>
        </div>
      </div>
    );
  } else {
    body = (
      <div data-exam-result>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6a22]">{copy.yourScore}</p>
        <dl className="mt-2 divide-y divide-black/[0.06] rounded-2xl border border-black/[0.07] bg-white">
          {([
            [copy.reading, readingScore, nReading],
            [copy.language, languageScore, items.length - nReading],
          ] as [string, number, number][]).map(([label, score, max]) => (
            <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
              <dt className="text-wood/70">{label}</dt>
              <dd className="font-semibold tabular-nums">{formatNumber(score)} / {formatNumber(max)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6a22]">{copy.code}</p>
        <p className="exam-latin mt-1 select-all rounded-2xl bg-[#3b2f1f] px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.18em] text-white" dir="ltr" data-exam-code>
          {formatExamCode(code)}
        </p>
        <p className="mt-2 text-sm text-wood/70">{copy.codeHint}</p>
        <div className="exam-latin mt-5 rounded-2xl border border-black/[0.07] bg-white p-4" dir="ltr">
          <p className={cn('text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6a22]', language === 'ar' && 'font-arabic')}>{copy.writing} · {exam.writing.words}</p>
          <p className="mt-1 text-[15px] font-semibold text-wood">{exam.writing.instructions}</p>
          <ul className="mt-2 list-disc ps-5 text-[15px] text-wood/80">
            {exam.writing.prompts.map(prompt => <li key={prompt}>{prompt}</li>)}
          </ul>
        </div>
        <p className="mt-3 text-sm text-wood/70">{copy.writingNow}</p>
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-stretch justify-center bg-black/60 sm:p-4" data-level-exam>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={exam.title}
        className={cn('relative flex w-full max-w-5xl flex-col overflow-hidden bg-[#FBF8F1] text-wood shadow-2xl sm:rounded-[26px]', language === 'ar' && 'font-arabic')}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-5 py-3">
          <h2 className="exam-latin font-display text-lg font-semibold" dir="ltr">{exam.title}</h2>
          <button type="button" onClick={requestClose} aria-label={copy.close} className="ms-auto flex h-10 w-10 items-center justify-center rounded-full text-wood/60 hover:bg-black/5 hover:text-wood">
            <X size={20} />
          </button>
        </div>
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-7">{body}</div>
      </div>
    </div>,
    document.body,
  );
};
