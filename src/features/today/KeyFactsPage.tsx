import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { editionStamps, useJournal } from '../../lib/seyahatname/store';
import type { Level, PageData } from '../../types';

/**
 * Key Facts (Our World Today books, in place of the journey map): one stop per chapter. A stop is
 * coloured once that chapter's Seyahatname stamp is pressed; every stop can be read at any time.
 */
const COPY = {
  en: { eyebrow: 'After the text', coloured: (n: string, all: string) => `${n} of ${all} stops colored`, how: 'Each chapter stamp colors its stop.', chapter: (n: string) => `Chapter ${n}`, read: 'Read the chapter' },
  ar: { eyebrow: 'بَعْدَ النَّصِّ', coloured: (n: string, all: string) => `${n} مِنْ ${all} مَحَطَّاتٍ مُلَوَّنَةٌ`, how: 'خَتْمُ كُلِّ فَصْلٍ يُلَوِّنُ مَحَطَّتَهُ.', chapter: (n: string) => `الْفَصْلُ ${n}`, read: 'اِقْرَأِ الْفَصْلَ' },
};

interface Props {
  page: PageData;
  pages: PageData[];
  storyId?: string;
  level?: Level | null;
  onOpenPage: (index: number) => void;
}

export default function KeyFactsPage({ page, pages, storyId, level, onOpenPage }: Props) {
  const { language, formatNumber, isRTL } = useLanguage();
  const copy = COPY[language === 'ar' ? 'ar' : 'en'];
  const journal = useJournal();
  const stamps = storyId && level ? editionStamps(journal, storyId, level) : [];
  const facts = page.facts ?? [];
  const done = facts.filter(fact => stamps[fact.chapter - 1]).length;
  const storyIndexes = pages.map((p, i) => (p.type === 'story' ? i : -1)).filter(i => i >= 0);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-1 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <p className={cn('text-[11px] font-semibold uppercase text-[var(--accent-strong)]', !isRTL && 'tracking-[0.2em]')}>{copy.eyebrow}</p>
          <p className="text-[13px] text-stone-500">
            <strong className="text-[var(--accent-strong)]">{copy.coloured(formatNumber(done), formatNumber(facts.length))}</strong> · {copy.how}
          </p>
        </div>
        <ol className="relative m-0 flex list-none flex-col gap-3 p-0 ps-8">
          <span className="absolute inset-y-3 start-3 w-0.5 rounded bg-stone-300" aria-hidden="true" />
          <span
            className="absolute start-3 top-3 w-0.5 rounded bg-[var(--accent-strong)] transition-[height] duration-700"
            style={{ height: facts.length ? `calc(${(done / facts.length) * 100}% - 1.5rem)` : 0 }}
            aria-hidden="true"
          />
          {facts.map(fact => {
            const isDone = Boolean(stamps[fact.chapter - 1]);
            const target = storyIndexes[fact.chapter - 1];
            return (
              <li key={fact.chapter} className="relative">
                <span
                  className={cn('absolute -start-[1.6rem] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2', isDone ? 'border-[var(--accent-strong)] bg-[var(--accent-strong)]' : 'border-stone-400 bg-[var(--page)]')}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => target !== undefined && onOpenPage(target)}
                  className={cn(
                    'grid w-full grid-cols-1 items-center gap-2 rounded-2xl border px-4 py-3 text-start transition-colors sm:grid-cols-[8.5rem_minmax(0,1fr)_auto] sm:gap-4',
                    isDone ? 'border-[var(--brand-300)] bg-[var(--brand-50)]' : 'border-stone-200 bg-white/70 hover:bg-white',
                  )}
                  aria-label={`${copy.chapter(formatNumber(fact.chapter))}: ${fact.title}`}
                >
                  <span className="min-w-0">
                    <span className={cn('block text-xl font-bold leading-tight tabular-nums', isDone ? 'text-[var(--brand-700)]' : 'text-stone-400')}>{fact.value}</span>
                    <span className={cn('mt-0.5 block text-[11px] font-semibold uppercase text-stone-500', !isRTL && 'tracking-[0.1em]')}>{fact.label}</span>
                  </span>
                  <span className={cn('min-w-0', !isDone && 'opacity-70')}>
                    <span className="block font-semibold text-stone-900">{fact.title}</span>
                    <span className="block text-[14px] text-stone-600">{fact.text}</span>
                  </span>
                  <span
                    className={cn(
                      'grid h-10 w-10 place-items-center justify-self-start rounded-full text-[11px] font-bold sm:justify-self-end',
                      isDone ? '-rotate-6 border-2 border-[var(--accent-strong)] bg-[var(--brand-100)] text-[var(--brand-700)]' : 'border border-dashed border-stone-400 text-stone-500',
                    )}
                    title={isDone ? undefined : copy.read}
                  >
                    {isDone ? '✓' : formatNumber(fact.chapter)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
