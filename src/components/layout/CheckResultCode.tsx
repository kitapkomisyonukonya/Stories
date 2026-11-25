import React, { useEffect, useRef, useState } from 'react';
import { levelLabel } from '../../content/levelLabels';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { X } from '../ui/icons';
import { SECTION_ICONS } from '../../lib/sectionIcons';
import { decodeResult, type ResultCodeData } from '../../lib/resultCode';
import { getStoryMeta } from '../../core/content/storyCatalog';
import { useDialogFocus } from '../../hooks/useDialogFocus';

interface CheckResultCodeProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Teacher tool: type the 8-character code from a student's result card and see the same numbers. */
export const CheckResultCode: React.FC<CheckResultCodeProps> = ({ isOpen, onClose }) => {
  // Tab stays inside and focus returns to the opener; Escape is handled below.
  const dialogRef = useDialogFocus(isOpen, onClose, { escape: false });
  const { language, isRTL, formatNumber } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';
  const [value, setValue] = useState('');
  const [result, setResult] = useState<ResultCodeData | null | 'invalid'>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    setValue('');
    setResult(null);
    window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const copy = lang === 'ar'
    ? {
        close: 'إغلاق', intro: 'اكْتُبِ الرَّمْزَ المَكْتُوبَ عَلَى بِطَاقَةِ نَتِيجَةِ الطَّالِبِ.', check: 'تَحَقَّقْ',
        invalid: 'هٰذَا الرَّمْزُ غَيْرُ صَحِيحٍ. تَأَكَّدْ مِنَ الأَحْرُفِ الثَّمَانِيَةِ.', valid: 'رَمْزٌ صَحِيحٌ',
        chapters: 'الفُصُولُ المَقْرُوءَةُ', kc: 'اخْتِبَارُ المَعْرِفَةِ', vc: 'تَحَدِّي المُفْرَدَاتِ', lr: 'مُرَاجَعَةُ اللُّغَةِ', fc: 'التَّحَدِّي النِّهَائِيُّ', ican: '«أَسْتَطِيعُ»: نَعَمْ',
        done: 'تَمَّ', notDone: 'لَمْ يَتِمَّ', note: 'النَّتَائِجُ مُقَرَّبَةٌ إِلَى أَقْرَبِ ٥٪. الرَّمْزُ فَحْصٌ خَفِيفٌ، لَا حِمَايَةٌ مِنَ الغِشِّ.',
      }
    : {
        close: 'Close', intro: 'Type the code from the student’s result card.', check: 'Check',
        invalid: 'This code is not valid. Check the eight letters and numbers.', valid: 'Valid code',
        chapters: 'Chapters read', kc: 'Knowledge Check', vc: 'Vocabulary Challenge', lr: 'Language Review', fc: 'Final Challenge', ican: '“I can”: Yes',
        done: 'Done', notDone: 'Not done', note: 'Scores are rounded to the nearest 5%. The code is a light check, not protection against cheating.',
      };

  const percent = (n: number | null) => (n === null ? '—' : `${formatNumber(n)}%`);
  const data = result && result !== 'invalid' ? result : null;
  const story = data ? getStoryMeta(data.storyId) : undefined;
  const Icon = SECTION_ICONS.checkCode.icon;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setResult(decodeResult(value) ?? 'invalid');
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/60 p-3 sm:p-6"
          onClick={onClose}
          data-check-code
        >
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={SECTION_ICONS.checkCode[lang]}
            dir={isRTL ? 'rtl' : 'ltr'}
            onClick={event => event.stopPropagation()}
            className={cn('relative w-full max-w-md rounded-[26px] sm:my-auto bg-[#FBF8F1] p-6 text-wood shadow-2xl sm:p-7', isRTL && 'font-arabic')}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={copy.close}
              className="absolute end-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-wood/60 hover:bg-black/5 hover:text-wood"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 pe-10">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D8B35C]/20 text-[#7a5d1c]">
                <Icon size={22} />
              </span>
              <h2 className="font-display text-2xl font-semibold leading-tight">{SECTION_ICONS.checkCode[lang]}</h2>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-wood/75">{copy.intro}</p>
            <form onSubmit={submit} className="mt-4 flex gap-2" dir="ltr">
              <input
                ref={inputRef}
                value={value}
                onChange={event => {
                  setValue(event.target.value.toUpperCase().slice(0, 12));
                  setResult(null);
                }}
                placeholder="ABCD2345"
                autoComplete="off"
                spellCheck={false}
                aria-label={SECTION_ICONS.checkCode[lang]}
                className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 font-mono text-xl font-bold tracking-[0.25em] outline-none focus:border-[#b08a35]"
                data-check-code-input
              />
              <button type="submit" className="inline-flex min-h-12 items-center rounded-xl bg-[#3b2f1f] px-5 text-sm font-semibold text-white hover:bg-[#2a2116]">
                {copy.check}
              </button>
            </form>

            {result === 'invalid' && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{copy.invalid}</p>}
            {data && (
              <div className="mt-5" data-check-code-result>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{copy.valid}</p>
                <p className="mt-1 text-lg font-semibold">{(lang === 'ar' ? story?.nameAr : story?.name) ?? data.storyId} · {levelLabel(data.level, lang)}</p>
                <dl className="mt-3 divide-y divide-black/[0.06] rounded-2xl border border-black/[0.07] bg-white/80">
                  {([
                    [copy.chapters, percent(data.chapters)],
                    [copy.kc, percent(data.knowledgeCheck)],
                    [copy.vc, data.vocabulary ? copy.done : copy.notDone],
                    [copy.lr, percent(data.languageReview)],
                    [copy.fc, percent(data.finalChallenge)],
                    [copy.ican, percent(data.iCan)],
                  ] as [string, string][]).map(([label, shown]) => (
                    <div key={label} className="flex items-center justify-between gap-4 px-4 py-2">
                      <dt className="text-sm text-wood/70">{label}</dt>
                      <dd className="font-semibold tabular-nums">{shown}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs leading-relaxed text-wood/55">{copy.note}</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
