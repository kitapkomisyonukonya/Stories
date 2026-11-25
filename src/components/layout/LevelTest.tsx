import React, { useEffect, useMemo, useRef, useState } from 'react';
import { levelLabel } from '../../content/levelLabels';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { X } from '../ui/icons';
import { SECTION_ICONS } from '../../lib/sectionIcons';
import { levelTestAr, levelTestEn, scoreLevelTest } from '../../data/levelTest';
import { firstOpenBookAt } from '../../lib/nextBook';
import type { Level } from '../../types';
import { useDialogFocus } from '../../hooks/useDialogFocus';

const RESULT_KEY = 'v2:level-test';

export interface LevelTestResult {
  level: Level;
  takenAt: number;
}

export const readLevelTestResult = (): LevelTestResult | null => {
  try {
    const parsed = JSON.parse(localStorage.getItem(RESULT_KEY) ?? 'null');
    return parsed && ['A2', 'B1', 'B2'].includes(parsed.level) ? parsed : null;
  } catch {
    return null;
  }
};

const saveLevelTestResult = (level: Level) => {
  try {
    localStorage.setItem(RESULT_KEY, JSON.stringify({ level, takenAt: Date.now() }));
  } catch {
    // Without storage the suggestion is shown for this visit only.
  }
};

interface LevelTestProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (level: Level) => void;
  onStart: (storyId: string, level: Level) => void;
}

/** The optional ten-question level test for self-learners. The result is only a suggestion. */
export const LevelTest: React.FC<LevelTestProps> = ({ isOpen, onClose, onResult, onStart }) => {
  // Tab stays inside and focus returns to the opener; Escape is handled below.
  const dialogRef = useDialogFocus(isOpen, onClose, { escape: false });
  const { language, isRTL, formatNumber } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';
  const items = lang === 'ar' ? levelTestAr : levelTestEn;
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    setAnswers([]);
    setStep(0);
    setSelected(null);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const finished = step >= items.length;
  const level = useMemo(() => (finished ? scoreLevelTest(items, answers) : null), [finished, items, answers]);
  const startBook = level ? firstOpenBookAt(level, lang) : null;
  const rightCount = answers.filter((answer, i) => answer === items[i]?.answer).length;

  const copy = lang === 'ar'
    ? {
        close: 'إغلاق',
        intro: 'عَشَرَةُ أَسْئِلَةٍ قَصِيرَةٍ، نَحْوَ ثَلَاثِ دَقَائِقَ. اقْرَأِ النَّصَّ وَاخْتَرِ الإِجَابَةَ. النَّتِيجَةُ اقْتِرَاحٌ فَقَطْ.',
        question: (n: string, total: string) => `السُّؤَالُ ${n} مِنْ ${total}`,
        next: 'التَّالِي',
        finish: 'أَظْهِرِ النَّتِيجَةَ',
        resultTitle: 'المُسْتَوَى المُقْتَرَحُ لَكَ',
        score: (right: string, total: string) => `أَجَبْتَ إِجَابَةً صَحِيحَةً عَنْ ${right} مِنْ ${total} أَسْئِلَةٍ.`,
        resultText: {
          A2: 'ابْدَأْ بِالمُسْتَوَى أ2. القِصَصُ قَصِيرَةٌ، وَالجُمَلُ بَسِيطَةٌ.',
          B1: 'ابْدَأْ بِالمُسْتَوَى ب1. تَسْتَطِيعُ أَنْ تَفْهَمَ قِصَّةً أَطْوَلَ وَأَسْبَابَ الأَحْدَاثِ.',
          B2: 'ابْدَأْ بِالمُسْتَوَى ب2. تَسْتَطِيعُ أَنْ تَقْرَأَ نُصُوصًا تُقَدِّمُ آرَاءً وَأَدِلَّةً.',
        } as Record<Level, string>,
        startWith: 'ابْدَأْ بِـ',
        own: 'سَأَخْتَارُ بِنَفْسِي',
        note: 'تَسْتَطِيعُ دَائِمًا أَنْ تَفْتَحَ أَيَّ مُسْتَوًى مِنَ المَكْتَبَةِ.',
      }
    : {
        close: 'Close',
        intro: 'Ten short questions, about three minutes. Read the text and choose the answer. The result is only a suggestion.',
        question: (n: string, total: string) => `Question ${n} of ${total}`,
        next: 'Next',
        finish: 'Show my result',
        resultTitle: 'Your suggested level',
        score: (right: string, total: string) => `You answered ${right} of ${total} questions correctly.`,
        resultText: {
          A2: 'Start at A2. The stories are short and the sentences are simple.',
          B1: 'Start at B1. You can follow a longer story and the reasons for what happens.',
          B2: 'Start at B2. You can read texts that give ideas and evidence.',
        } as Record<Level, string>,
        startWith: 'Start with',
        own: 'I’ll choose myself',
        note: 'You can always open any level from the library.',
      };

  const item = items[step];
  const Icon = SECTION_ICONS.levelTest.icon;

  const next = () => {
    if (selected === null) return;
    const nextAnswers = [...answers, selected];
    setAnswers(nextAnswers);
    setSelected(null);
    setStep(s => s + 1);
    if (nextAnswers.length === items.length) {
      const result = scoreLevelTest(items, nextAnswers);
      saveLevelTestResult(result);
      onResult(result);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/60 p-3 sm:p-6"
          onClick={onClose}
          data-level-test
        >
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={SECTION_ICONS.levelTest[lang]}
            dir={isRTL ? 'rtl' : 'ltr'}
            lang={lang}
            onClick={event => event.stopPropagation()}
            className={cn('relative w-full max-w-2xl rounded-[26px] sm:my-auto bg-[#FBF8F1] p-5 text-wood shadow-2xl sm:p-7', isRTL && 'font-arabic')}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={copy.close}
              className="absolute end-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-wood/60 hover:bg-black/5 hover:text-wood focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b7a2f]"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 pe-10">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D8B35C]/20 text-[#7a5d1c]">
                <Icon size={22} />
              </span>
              <h2 className="font-display text-2xl font-semibold text-wood">{SECTION_ICONS.levelTest[lang]}</h2>
            </div>

            {!finished && item && (
              <>
                {step === 0 && <p className="mt-3 text-[15px] leading-relaxed text-wood/75">{copy.intro}</p>}
                <div className="mt-4 flex items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-wood/55">{copy.question(formatNumber(step + 1), formatNumber(items.length))}</p>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.07]">
                    <div className="h-full rounded-full bg-[#b08a35]" style={{ width: `${(step / items.length) * 100}%` }} />
                  </div>
                </div>
                <blockquote className={cn('mt-4 rounded-2xl border-s-4 border-[#D8B35C] bg-white/80 p-4 font-serif leading-relaxed text-wood/90', lang === 'ar' ? 'text-xl leading-loose' : 'text-[16px]')}>
                  {item.passage}
                </blockquote>
                <p className={cn('mt-4 font-semibold text-wood', lang === 'ar' ? 'text-lg' : 'text-[16px]')}>{item.question}</p>
                <div className="mt-3 grid gap-2" role="radiogroup" aria-label={item.question}>
                  {item.options.map((option, i) => (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={selected === i}
                      onClick={() => setSelected(i)}
                      className={cn(
                        'min-h-12 rounded-xl border px-4 py-2.5 text-start text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a35]',
                        selected === i ? 'border-[#b08a35] bg-[#D8B35C]/20 font-semibold text-wood' : 'border-black/10 bg-white hover:border-[#b08a35]/60',
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    disabled={selected === null}
                    onClick={next}
                    className="inline-flex min-h-11 items-center rounded-xl bg-[#3b2f1f] px-6 text-sm font-semibold text-white transition-opacity hover:bg-[#2a2116] disabled:opacity-40"
                  >
                    {step === items.length - 1 ? copy.finish : copy.next}
                  </button>
                </div>
              </>
            )}

            {finished && level && (
              <div className="mt-5" data-level-test-result>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-wood/55">{copy.resultTitle}</p>
                <p className="mt-3 font-display text-5xl font-semibold leading-none text-wood">{levelLabel(level, lang)}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-wood/80">{copy.resultText[level]}</p>
                <p className="mt-1 text-sm text-wood/60">{copy.score(formatNumber(rightCount), formatNumber(items.length))}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {startBook && (
                    <button
                      type="button"
                      onClick={() => onStart(startBook.id, level)}
                      className="inline-flex min-h-12 items-center rounded-xl bg-[#3b2f1f] px-5 text-sm font-semibold text-white hover:bg-[#2a2116]"
                    >
                      {copy.startWith} {lang === 'ar' ? startBook.nameAr : startBook.name} · {levelLabel(level, lang)}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex min-h-12 items-center rounded-xl border border-black/10 bg-white px-5 text-sm font-semibold text-wood/80 hover:bg-black/5"
                  >
                    {copy.own}
                  </button>
                </div>
                <p className="mt-4 text-sm text-wood/55">{copy.note}</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
