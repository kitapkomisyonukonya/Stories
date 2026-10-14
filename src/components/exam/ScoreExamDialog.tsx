import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { X } from '../ui/icons';
import type { ExamRubricCriterion, LevelExam } from '../../types';
import { LEVEL_EXAMS, examItems, readingCount } from '../../content/exams';
import { decodeExam, formatExamCode, type ExamCodeData } from '../../lib/examCode';

interface ScoreExamDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const COPY = {
  en: {
    title: 'Score an end-of-level test', close: 'Close', check: 'Check',
    intro: 'Type the student’s test code. Then score Writing and Speaking with the bands below.',
    invalid: 'This code is not valid. Check the 13 letters and numbers.',
    reading: 'Reading', language: 'Language', writing: 'Writing', speaking: 'Speaking', objective: 'Reading and Language',
    total: 'Total', pass: 'pass mark', items: 'Item by item',
    reached: 'Level reached', close2: 'Close to the level: one part is below its pass mark', notYet: 'Not yet at this level',
    between: '4 and 2 lie between the bands; 0 means no answer.',
    copyLine: 'Copy the pilot line', copied: 'Copied',
    pilotNote: 'The pilot line has no name. Paste it into the pilot results sheet, one line per student.',
    provisional: 'Pass marks are provisional until the pilot results are analysed.',
  },
  ar: {
    title: 'تَصْحِيحُ اخْتِبَارِ نِهَايَةِ المُسْتَوَى', close: 'إغلاق', check: 'تَحَقَّقْ',
    intro: 'اكْتُبْ رَمْزَ اخْتِبَارِ الطَّالِبِ، ثُمَّ قَيِّمِ الكِتَابَةَ وَالمُحَادَثَةَ بِالدَّرَجَاتِ أَدْنَاهُ.',
    invalid: 'هٰذَا الرَّمْزُ غَيْرُ صَحِيحٍ. تَأَكَّدْ مِنَ الأَحْرُفِ وَالأَرْقَامِ الثَّلَاثَةَ عَشَرَ.',
    reading: 'القِرَاءَةُ', language: 'اللُّغَةُ', writing: 'الكِتَابَةُ', speaking: 'المُحَادَثَةُ', objective: 'القِرَاءَةُ وَاللُّغَةُ',
    total: 'المَجْمُوعُ', pass: 'دَرَجَةُ النَّجَاحِ', items: 'سُؤَالًا سُؤَالًا',
    reached: 'بَلَغَ المُسْتَوَى', close2: 'قَرِيبٌ مِنَ المُسْتَوَى: جُزْءٌ وَاحِدٌ دُونَ دَرَجَةِ النَّجَاحِ', notYet: 'لَمْ يَبْلُغِ المُسْتَوَى بَعْدُ',
    between: '٤ وَ٢ بَيْنَ الدَّرَجَاتِ، وَ٠ يَعْنِي لَا إِجَابَةَ.',
    copyLine: 'انْسَخْ سَطْرَ التَّجْرِبَةِ', copied: 'نُسِخَ',
    pilotNote: 'لَا يَحْمِلُ سَطْرُ التَّجْرِبَةِ اسْمًا. أَلْصِقْهُ فِي جَدْوَلِ نَتَائِجِ التَّجْرِبَةِ، سَطْرًا لِكُلِّ طَالِبٍ.',
    provisional: 'دَرَجَاتُ النَّجَاحِ مُؤَقَّتَةٌ حَتَّى تُحَلَّلَ نَتَائِجُ التَّجْرِبَةِ.',
  },
};

const SCORES = [0, 1, 2, 3, 4, 5];

/** Teacher tool: score Reading and Language from the test code, add Writing and Speaking bands, copy one anonymous pilot line. */
export const ScoreExamDialog: React.FC<ScoreExamDialogProps> = ({ isOpen, onClose }) => {
  const dialogRef = useDialogFocus(isOpen, onClose);
  const { language, formatNumber } = useLanguage();
  const copy = COPY[language === 'ar' ? 'ar' : 'en'];
  const [value, setValue] = useState('');
  const [data, setData] = useState<ExamCodeData | null | 'invalid'>(null);
  const [writing, setWriting] = useState<number[]>([]);
  const [speaking, setSpeaking] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setValue('');
    setData(null);
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  if (!isOpen) return null;

  const decoded = data && data !== 'invalid' ? data : null;
  const exam: LevelExam | null = decoded ? LEVEL_EXAMS[decoded.level] : null;
  const items = exam ? examItems(exam) : [];
  const nReading = exam ? readingCount(exam) : 0;
  const right = items.map((item, i) => decoded?.answers[i] === item.answer);
  const readingScore = right.slice(0, nReading).filter(Boolean).length;
  const languageScore = right.slice(nReading).filter(Boolean).length;
  const objective = readingScore + languageScore;
  const sum = (list: number[]) => list.reduce((a, b) => a + (b ?? 0), 0);
  const writingScore = sum(writing);
  const speakingScore = sum(speaking);
  const scored = exam ? writing.filter(n => n !== undefined).length === exam.writing.rubric.length && speaking.filter(n => n !== undefined).length === exam.speaking.rubric.length : false;
  const passes = exam
    ? [objective >= exam.scoring.objectivePass, writingScore >= exam.scoring.writingPass, speakingScore >= exam.scoring.speakingPass].filter(Boolean).length
    : 0;
  const decision = passes === 3 ? copy.reached : passes === 2 ? copy.close2 : copy.notYet;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = decodeExam(value);
    setData(result ?? 'invalid');
    setWriting([]);
    setSpeaking([]);
    setCopied(false);
  };

  const pilotLine = decoded && exam
    ? [formatExamCode(value.toUpperCase().replace(/[^0-9A-Z]/g, '')), decoded.level, decoded.version, readingScore, languageScore, ...writing, ...speaking, decoded.answers.join('')].join(',')
    : '';

  const rubricBlock = (title: string, rubric: ExamRubricCriterion[], scores: number[], set: (next: number[]) => void, max: number, pass: number) => (
    <section className="mt-5 rounded-2xl border border-black/[0.07] bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm tabular-nums text-wood/70">{formatNumber(sum(scores))} / {formatNumber(max)} · {copy.pass} {formatNumber(pass)}</span>
      </div>
      <div className="exam-latin mt-2 space-y-3" dir="ltr">
        {rubric.map((row, r) => (
          <div key={row.criterion}>
            <p className="text-sm font-semibold">{row.criterion}</p>
            <div className="mt-1 flex gap-1.5">
              {SCORES.map(score => (
                <button
                  key={score}
                  type="button"
                  aria-pressed={scores[r] === score}
                  onClick={() => { const next = [...scores]; next[r] = score; set(next); }}
                  className={cn('h-9 w-9 rounded-lg border text-sm font-semibold', scores[r] === score ? 'border-[#3b2f1f] bg-[#3b2f1f] text-white' : 'border-black/10 hover:bg-black/5')}
                >
                  {score}
                </button>
              ))}
            </div>
            <ul className="mt-1 space-y-0.5 text-xs leading-snug text-wood/65">
              {row.bands.map(band => <li key={band.score}><b>{band.score}</b> {band.descriptor}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-wood/55">{copy.between}</p>
    </section>
  );

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/60 p-3 sm:p-6" onClick={onClose} data-score-exam>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        onClick={event => event.stopPropagation()}
        className={cn('relative w-full max-w-2xl rounded-[26px] bg-[#FBF8F1] p-6 text-wood shadow-2xl sm:my-auto sm:p-7', language === 'ar' && 'font-arabic')}
      >
        <button type="button" onClick={onClose} aria-label={copy.close} className="absolute end-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-wood/60 hover:bg-black/5 hover:text-wood">
          <X size={20} />
        </button>
        <h2 className="pe-10 font-display text-2xl font-semibold leading-tight">{copy.title}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-wood/75">{copy.intro}</p>
        <form onSubmit={submit} className="mt-4 flex gap-2" dir="ltr">
          <input
            ref={inputRef}
            value={value}
            onChange={event => { setValue(event.target.value.toUpperCase().slice(0, 16)); setData(null); }}
            placeholder="ABCD-2345-EFGH6"
            autoComplete="off"
            spellCheck={false}
            aria-label={copy.title}
            className="exam-latin min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 font-mono text-lg font-bold tracking-[0.15em] outline-none focus:border-[#b08a35]"
            data-score-exam-input
          />
          <button type="submit" className="inline-flex min-h-12 items-center rounded-xl bg-[#3b2f1f] px-5 text-sm font-semibold text-white hover:bg-[#2a2116]">{copy.check}</button>
        </form>
        {data === 'invalid' && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{copy.invalid}</p>}
        {decoded && exam && (
          <div className="mt-5" data-score-exam-result>
            <p className="exam-latin text-lg font-semibold" dir="ltr">{exam.title}</p>
            <dl className="mt-2 divide-y divide-black/[0.06] rounded-2xl border border-black/[0.07] bg-white">
              {([
                [copy.reading, readingScore, nReading],
                [copy.language, languageScore, items.length - nReading],
                [`${copy.objective} (${copy.pass} ${formatNumber(exam.scoring.objectivePass)})`, objective, exam.scoring.objectiveMax],
              ] as [string, number, number][]).map(([label, score, max]) => (
                <div key={label} className="flex justify-between gap-4 px-4 py-2 text-sm">
                  <dt className="text-wood/70">{label}</dt>
                  <dd className="font-semibold tabular-nums">{formatNumber(score)} / {formatNumber(max)}</dd>
                </div>
              ))}
            </dl>
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-wood/70">{copy.items}</summary>
              <div className="exam-latin mt-2 flex flex-wrap gap-1.5" dir="ltr">
                {items.map((item, i) => (
                  <span key={item.id} title={item.target} className={cn('flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold', right[i] ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800')}>{item.id}</span>
                ))}
              </div>
            </details>
            {rubricBlock(copy.writing, exam.writing.rubric, writing, setWriting, exam.scoring.writingMax, exam.scoring.writingPass)}
            {rubricBlock(copy.speaking, exam.speaking.rubric, speaking, setSpeaking, exam.scoring.speakingMax, exam.scoring.speakingPass)}
            {scored && (
              <div className="mt-5 rounded-2xl bg-[#3b2f1f] p-4 text-white" data-score-exam-decision>
                <p className="text-sm text-white/70">{copy.total}: {formatNumber(objective + writingScore + speakingScore)} / {formatNumber(exam.scoring.objectiveMax + exam.scoring.writingMax + exam.scoring.speakingMax)}</p>
                <p className="mt-1 text-lg font-semibold">{decision}</p>
                <p className="mt-1 text-xs text-white/60">{copy.provisional}</p>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard?.writeText(pilotLine).then(() => setCopied(true)).catch(() => undefined); }}
                  className="mt-3 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/25"
                >
                  {copied ? copy.copied : copy.copyLine}
                </button>
                <p className="exam-latin mt-2 select-all break-all font-mono text-xs text-white/70" dir="ltr">{pilotLine}</p>
                <p className="mt-1 text-xs text-white/60">{copy.pilotNote}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
