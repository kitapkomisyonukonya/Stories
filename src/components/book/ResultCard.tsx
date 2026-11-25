import React, { useEffect, useMemo, useState } from 'react';
import { levelLabel } from '../../content/levelLabels';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoryProgress } from '../../contexts/StoryProgressContext';
import { X } from '../ui/icons';
import { SECTION_ICONS } from '../../lib/sectionIcons';
import { encodeResult, type ResultScores } from '../../lib/resultCode';
import { getStoryMeta } from '../../core/content/storyCatalog';
import type { BookData, Level } from '../../types';
import { useDialogFocus } from '../../hooks/useDialogFocus';

const NAME_KEY = 'v2:result-name';

const readJson = (key: string) => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
};

const pct = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

/** The scores the card shows, read from what this device has stored for the book. */
export const useResultScores = (bookData: BookData, language: string): ResultScores & { hasICan: boolean } => {
  const { stats } = useStoryProgress();
  return useMemo(() => {
    const storyPages = bookData.pages.filter(page => page.type === 'story');
    const quiz = bookData.pages.find(page => page.type === 'quiz');
    const kcItems = (quiz?.exercises ?? []).filter(exercise => exercise.type === 'true-false' || exercise.type === 'multiple-choice');
    const kcAnswers = kcItems.length ? readJson(`knowledge-check:${kcItems.map(exercise => exercise.id).join('|')}`) : null;
    const kcRight = kcAnswers ? kcItems.filter(exercise => kcAnswers[exercise.id] !== undefined && kcAnswers[exercise.id] === exercise.correctAnswer).length : 0;
    const review = bookData.pages.find(page => page.type === 'exercises');
    const reviewIds = review?.exercises?.map(exercise => exercise.id) ?? [];
    const vocabularyPage = bookData.pages.find(page => page.type === 'vocabulary-match');

    let iCanTotal = 0;
    let iCanYes = 0;
    storyPages.forEach(page => {
      if (!page.iCan?.length) return;
      iCanTotal += page.iCan.length;
      const ratings = readJson(`v2:${bookData.level}:${language}:${page.id}:${page.title}:ican`) ?? {};
      iCanYes += Object.values(ratings).filter(value => value === 'yes').length;
    });

    return {
      chapters: pct(Math.min(stats.chaptersVisited.size, storyPages.length), storyPages.length),
      knowledgeCheck: kcAnswers && Object.keys(kcAnswers).length ? pct(kcRight, kcItems.length) : null,
      vocabulary: Boolean(vocabularyPage && stats.exercisesCompleted.has(`vocabulary-${vocabularyPage.id}`)),
      languageReview: pct(reviewIds.filter(id => stats.exercisesCompleted.has(id)).length, reviewIds.length),
      finalChallenge: stats.finalScore,
      iCan: pct(iCanYes, iCanTotal),
      hasICan: iCanTotal > 0,
    };
  }, [bookData, language, stats]);
};

interface ResultCardProps {
  isOpen: boolean;
  onClose: () => void;
  bookData: BookData;
  storyId: string;
  level: Level;
}

/** One card a student shows (or prints) for the teacher: name, book, scores and a code the teacher can check. */
export const ResultCard: React.FC<ResultCardProps> = ({ isOpen, onClose, bookData, storyId, level }) => {
  // Tab stays inside and focus returns to the opener; Escape is handled below.
  const dialogRef = useDialogFocus(isOpen, onClose, { escape: false });
  const { language, isRTL, formatNumber } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';
  const scores = useResultScores(bookData, lang);
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem(NAME_KEY) ?? '';
    } catch {
      return '';
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch {
      // The name then lasts for this visit only.
    }
  }, [name]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const code = encodeResult({ storyId, level, ...scores });
  const story = getStoryMeta(storyId);
  const date = new Date().toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const percent = (value: number | null) => (value === null ? '—' : `${formatNumber(value)}%`);

  const copy = lang === 'ar'
    ? {
        close: 'إغلاق', name: 'اسْمُكَ', namePlaceholder: 'اكْتُبِ اسْمَكَ', nameNote: 'يَبْقَى الاسْمُ عَلَى هٰذَا الجِهَازِ فَقَطْ.',
        chapters: 'الفُصُولُ المَقْرُوءَةُ', kc: 'اخْتِبَارُ المَعْرِفَةِ', vc: 'تَحَدِّي المُفْرَدَاتِ', lr: 'مُرَاجَعَةُ اللُّغَةِ', fc: 'التَّحَدِّي النِّهَائِيُّ', ican: '«أَسْتَطِيعُ»: نَعَمْ',
        done: 'تَمَّ', notDone: 'لَمْ يَتِمَّ', code: 'رَمْزُ المُعَلِّمِ', codeNote: 'يَكْتُبُ المُعَلِّمُ هٰذَا الرَّمْزَ فِي «تَحَقَّقْ مِنْ رَمْزِ النَّتِيجَةِ» لِيَرَى النَّتَائِجَ نَفْسَهَا.', print: 'اطْبَعْ',
      }
    : {
        close: 'Close', name: 'Your name', namePlaceholder: 'Type your name', nameNote: 'Your name stays on this device only.',
        chapters: 'Chapters read', kc: 'Knowledge Check', vc: 'Vocabulary Challenge', lr: 'Language Review', fc: 'Final Challenge', ican: '“I can”: Yes',
        done: 'Done', notDone: 'Not done', code: 'Teacher code', codeNote: 'Your teacher types this code in “Check a result code” to see the same results.', print: 'Print',
      };

  const rows: [string, string][] = [
    [copy.chapters, percent(scores.chapters)],
    [copy.kc, percent(scores.knowledgeCheck)],
    [copy.vc, scores.vocabulary ? copy.done : copy.notDone],
    [copy.lr, percent(scores.languageReview)],
    [copy.fc, percent(scores.finalChallenge)],
    ...(scores.hasICan ? [[copy.ican, percent(scores.iCan)] as [string, string]] : []),
  ];
  const Icon = SECTION_ICONS.resultCard.icon;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/60 p-3 sm:p-6 print:static print:bg-white print:p-0"
          onClick={onClose}
          data-result-card
        >
          <style>{'@media print { body > *:not([data-result-card]) { display: none !important; } [data-result-card] [data-no-print] { display: none !important; } }'}</style>
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={SECTION_ICONS.resultCard[lang]}
            dir={isRTL ? 'rtl' : 'ltr'}
            onClick={event => event.stopPropagation()}
            className={cn('relative w-full max-w-lg rounded-[26px] sm:my-auto bg-[#FBF8F1] p-6 text-wood shadow-2xl print:shadow-none sm:p-8', isRTL && 'font-arabic')}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={copy.close}
              data-no-print
              className="absolute end-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-wood/60 hover:bg-black/5 hover:text-wood"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 pe-10">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800">
                <Icon size={22} />
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold">{SECTION_ICONS.resultCard[lang]}</h2>
                <p className="text-sm text-wood/60"><bdi>{(lang === 'ar' ? story?.nameAr : story?.name) ?? storyId}</bdi> · <bdi>{levelLabel(level, lang)}</bdi> · <bdi>{date}</bdi></p>
              </div>
            </div>

            <label className="mt-5 block" data-no-print>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-wood/55">{copy.name}</span>
              <input
                value={name}
                onChange={event => setName(event.target.value.slice(0, 40))}
                placeholder={copy.namePlaceholder}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-lg font-semibold outline-none focus:border-brand-500"
              />
              <span className="mt-1 block text-xs text-wood/50">{copy.nameNote}</span>
            </label>
            {name && <p className="mt-5 hidden text-xl font-semibold print:block">{name}</p>}

            <dl className="mt-5 divide-y divide-black/[0.06] rounded-2xl border border-black/[0.07] bg-white/80">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <dt className="text-sm text-wood/70">{label}</dt>
                  <dd className="font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 rounded-2xl bg-brand-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-800/80">{copy.code}</p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-[0.3em] text-wood" dir="ltr" data-result-code>{code}</p>
              <p className="mt-2 text-xs leading-relaxed text-wood/60">{copy.codeNote}</p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              data-no-print
              className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-black/10 bg-white px-5 text-sm font-semibold text-wood/80 hover:bg-black/5"
            >
              {copy.print}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
